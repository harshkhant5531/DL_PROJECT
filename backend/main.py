from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from model import load_model, predict_gaze
from utils import process_frame
import uvicorn

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

try:
    gaze_model = load_model("gaze_model.pth")
except Exception as e:
    print(f"Failed to load GazeNet model: {e}")
    gaze_model = None

class FrameRequest(BaseModel):
    image: str
    warning_count: int = 0

class ProcessResponse(BaseModel):
    gaze_direction: str
    warning_count: int
    cheating_risk: str
    warning: bool
    attention_score: int
    error: str = None
    warning_message: str = None
    
@app.post("/api/process_frame", response_model=ProcessResponse)
async def api_process_frame(request: FrameRequest):
    warning_count = request.warning_count
    
    if gaze_model is None:
        return ProcessResponse(
            gaze_direction="unknown",
            warning_count=warning_count,
            cheating_risk="unknown",
            warning=False,
            attention_score=100,
            error="Model not loaded"
        )
        
    b64_image = request.image
    left, right, error = process_frame(b64_image)
    
    if error is not None:
        risk = "high" if "Multiple" in error or "No face" in error else "medium"

        # If the face is completely lost (no detection) or multiple faces are present,
        # consider it a critical tracking failure and drop attention immediately.
        if "Multiple" in error or "No face" in error:
            warning_count = max(warning_count, 50)
            attention_score = 0
        else:
            # Small incremental penalty for other detection/processing issues
            warning_count += 2
            attention_score = max(0, 100 - (warning_count * 2))

        return ProcessResponse(
            gaze_direction="unknown",
            warning_count=warning_count,
            cheating_risk=risk,
            warning=True if risk == "high" else False,
            attention_score=attention_score,
            error=error,
            warning_message=error
        )
        
    direction, gaze_vec = predict_gaze(gaze_model, left, right)
    
    print(f"DEBUG: Gaze Direction: {direction} | Raw: {gaze_vec}")
    
    warning = False
    warning_message = None
    
    if direction == "center":
        # Recover attention score faster
        warning_count = max(0, warning_count - 1)
        cheating_risk = "low"
    else:
        # Penalize Look-away
        warning_count += 1
        cheating_risk = "high" if warning_count > 10 else "medium"
        warning = warning_count > 5
        
    if warning:
        warning_message = f"Suspicious Activity: Eyes looking {direction}!"

    # Consistent attention score calculation: 2% reduction per warning unit
    attention_score = max(0, 100 - (warning_count * 2))
    print(f"DEBUG: Warning Count: {warning_count} | Calculated Score: {attention_score}")
        
    return ProcessResponse(
        gaze_direction=direction,
        warning_count=warning_count,
        cheating_risk=cheating_risk,
        warning=warning,
        attention_score=attention_score,
        warning_message=warning_message
    )

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
