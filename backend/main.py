from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from model import load_model, predict_gaze
from utils import process_frame
import uvicorn
import os
import torch
from typing import Optional, List


MAX_RISK_SCORE = 100
LOW_RISK_MAX = 19
MEDIUM_RISK_MAX = 44

RISK_PROFILES = {
    "lenient": {
        "recover_center": 4,
        "penalty_down": 1,
        "penalty_side_or_up": 3,
        "penalty_no_face": 4,
        "penalty_multiple_faces": 10,
        "penalty_other_error": 3,
        "low_max": 24,
        "medium_max": 54,
    },
    "balanced": {
        "recover_center": 3,
        "penalty_down": 2,
        "penalty_side_or_up": 5,
        "penalty_no_face": 6,
        "penalty_multiple_faces": 12,
        "penalty_other_error": 4,
        "low_max": 19,
        "medium_max": 44,
    },
    "strict": {
        "recover_center": 2,
        "penalty_down": 3,
        "penalty_side_or_up": 7,
        "penalty_no_face": 8,
        "penalty_multiple_faces": 15,
        "penalty_other_error": 5,
        "low_max": 14,
        "medium_max": 34,
    },
}

ACTIVE_POLICY = os.getenv("EXAM_POLICY", "balanced").strip().lower()
if ACTIVE_POLICY not in RISK_PROFILES:
    ACTIVE_POLICY = "balanced"
POLICY = RISK_PROFILES[ACTIVE_POLICY]

app = FastAPI()

# --- CORS CONFIGURATION ---
raw_origins = os.getenv("ALLOWED_ORIGINS", "*")
if raw_origins == "*":
    ALLOWED_ORIGINS = ["*"]
    # Credentials MUST be False if origins is "*" to avoid 400 errors
    ALLOW_CREDENTIALS = False 
else:
    # Clean up origins: split by comma and remove spaces/trailing slashes
    ALLOWED_ORIGINS = [o.strip().rstrip('/') for o in raw_origins.split(",") if o.strip()]
    ALLOW_CREDENTIALS = True

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=ALLOW_CREDENTIALS,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Health check endpoint for Render."""
    return {"status": "online", "message": "Exam Monitoring API is active"}

try:
    model_path = os.path.join(os.path.dirname(__file__), "gaze_model.pth")
    gaze_model = load_model(model_path)
except Exception as e:
    print(f"Failed to load GazeNet model at {model_path}: {e}")
    gaze_model = None

class FrameRequest(BaseModel):
    image: str
    warning_count: int = 0
    consecutive_away: int = 0

class ProcessResponse(BaseModel):
    gaze_direction: str
    warning_count: int
    cheating_risk: str
    warning: bool
    attention_score: int
    eye_target_x: float = 0.5
    eye_target_y: float = 0.5
    left_eye_box: Optional[List[float]] = None
    right_eye_box: Optional[List[float]] = None
    left_iris: Optional[List[float]] = None
    right_iris: Optional[List[float]] = None
    left_eye_center: Optional[List[float]] = None
    right_eye_center: Optional[List[float]] = None
    error: Optional[str] = None
    warning_message: Optional[str] = None
    gaze_vector: Optional[List[float]] = None


def clamp_risk(value: int) -> int:
    return max(0, min(MAX_RISK_SCORE, value))


def risk_to_level(risk_score: int) -> str:
    if risk_score <= POLICY["low_max"]:
        return "low"
    if risk_score <= POLICY["medium_max"]:
        return "medium"
    return "high"


def risk_to_attention(risk_score: int) -> int:
    return max(0, 100 - risk_score)
    
@app.post("/api/process_frame", response_model=ProcessResponse)
async def api_process_frame(request: FrameRequest):
    # `warning_count` is used as a persisted risk score across frames.
    risk_score = clamp_risk(request.warning_count)
    
    if gaze_model is None:
        return ProcessResponse(
            gaze_direction="unknown",
            warning_count=risk_score,
            cheating_risk="unknown",
            warning=False,
            attention_score=100,
            eye_target_x=0.5,
            eye_target_y=0.5,
            error="Model not loaded"
        )
        
    b64_image = request.image
    left, right, error, meta = process_frame(b64_image)
    
    if error is not None:
        if "Multiple" in error:
            risk_score = clamp_risk(risk_score + POLICY["penalty_multiple_faces"])
        elif "No face" in error:
            risk_score = clamp_risk(risk_score + POLICY["penalty_no_face"])
        else:
            risk_score = clamp_risk(risk_score + POLICY["penalty_other_error"])

        risk_level = risk_to_level(risk_score)
        attention_score = risk_to_attention(risk_score)

        return ProcessResponse(
            gaze_direction="unknown",
            warning_count=risk_score,
            cheating_risk=risk_level,
            warning=risk_level in {"medium", "high"},
            attention_score=attention_score,
            eye_target_x=0.5,
            eye_target_y=0.5,
            error=error,
            warning_message=error,
            gaze_vector=[0.0, 0.0, 0.0]
        )
        
    head_pose = (meta or {}).get("head_pose", "unknown")
    nose_ratio = (meta or {}).get("nose_ratio", 0.5)
    heuristic_direction = (meta or {}).get("heuristic_direction")
    heuristic_confidence = float((meta or {}).get("heuristic_confidence", 0.0))
    eye_target_x = float((meta or {}).get("iris_center_x", 0.5))
    eye_target_y = float((meta or {}).get("iris_center_y", 0.5))
    left_box = (meta or {}).get("left_eye_box")
    right_box = (meta or {}).get("right_eye_box")
    left_iris = (meta or {}).get("left_iris")
    right_iris = (meta or {}).get("right_iris")
    l_eye_center = (meta or {}).get("left_eye_center")
    r_eye_center = (meta or {}).get("right_eye_center")

    eye_target_x = max(0.0, min(1.0, eye_target_x))
    eye_target_y = max(0.0, min(1.0, eye_target_y))

    pose_vector = (meta or {}).get("pose_vector", [0.0, 0.0, 0.0])
    
    # Always run the model even if heuristic is active, to provide calibration telemetry
    pose_tensor = torch.tensor(pose_vector, dtype=torch.float32).unsqueeze(0)
    model_dir, model_vec = predict_gaze(gaze_model, left, right, pose_tensor)
    
    if heuristic_direction and heuristic_confidence >= 0.40:
        direction = heuristic_direction
        model_source = "heuristic"
    else:
        direction = model_dir
        model_source = "model"
    
    gaze_vec = model_vec
    
    print(
        f"DEBUG: Gaze Direction: {direction} | Source={model_source} "
        f"| HeuristicConf={heuristic_confidence:.2f} | Raw: {gaze_vec}"
    )
    
    warning_message = None

    consecutive_away = request.consecutive_away
    
    # Weighted scoring smooths transient noise while still penalizing sustained look-away.
    if direction == "center":
        # Do not recover score (integrity point stays same)
        pass
    elif head_pose == "sideways_extreme" and direction in {"left", "right"}:
        # Do not recover score (neutral)
        pass
    elif direction == "down":
        # Penalize immediately for downward gaze
        risk_score = clamp_risk(risk_score + POLICY["penalty_down"])
    else:
        # Penalize immediately for side/up gaze
        risk_score = clamp_risk(risk_score + POLICY["penalty_side_or_up"])

    cheating_risk = risk_to_level(risk_score)
    warning = cheating_risk in {"medium", "high"}

    if cheating_risk == "high":
        warning_message = f"High cheating risk: sustained gaze {direction}."
    elif cheating_risk == "medium":
        warning_message = f"Suspicious gaze detected: {direction}."

    if head_pose == "sideways_extreme" and direction in {"left", "right"}:
        warning_message = "Head turned strongly sideways (announcement-safe mode)."
    elif head_pose == "tilted_extreme":
        warning_message = "Head tilted excessively up or down."

    attention_score = risk_to_attention(risk_score)
    nose_ratio_v = (meta or {}).get("nose_ratio_v", 0.5)
    print(
        f"DEBUG: Policy={ACTIVE_POLICY} | HeadPose={head_pose} (H:{nose_ratio:.2f}, V:{nose_ratio_v:.2f}) "
        f"| Risk Score: {risk_score} | Calculated Score: {attention_score}"
    )
        
    return ProcessResponse(
        gaze_direction=direction,
        warning_count=risk_score,
        cheating_risk=cheating_risk,
        warning=warning,
        attention_score=attention_score,
        eye_target_x=eye_target_x,
        eye_target_y=eye_target_y,
        left_eye_box=left_box,
        right_eye_box=right_box,
        left_iris=left_iris,
        right_iris=right_iris,
        left_eye_center=l_eye_center,
        right_eye_center=r_eye_center,
        warning_message=warning_message,
        gaze_vector=gaze_vec
    )

if __name__ == "__main__":
    # Get port from environment variable (Render sets this automatically)
    port = int(os.getenv("PORT", 8000))
    # 'reload' should be False in production for better performance
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
