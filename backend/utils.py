import cv2
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python as tasks_python
from mediapipe.tasks.python import vision
import base64
import torch
import os

base_options = tasks_python.BaseOptions(model_asset_path=os.path.join(os.path.dirname(__file__), 'face_landmarker.task'))
options = vision.FaceLandmarkerOptions(
    base_options=base_options,
    num_faces=2,
    running_mode=vision.RunningMode.IMAGE
)
detector = vision.FaceLandmarker.create_from_options(options)

LEFT_EYE_INDICES = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398]
RIGHT_EYE_INDICES = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161 , 246]

# Face mesh landmarks used for a lightweight yaw proxy.
NOSE_TIP_IDX = 1
LEFT_CHEEK_IDX = 234
RIGHT_CHEEK_IDX = 454

# Iris indices are available for 478-point face landmarks.
RIGHT_IRIS_INDICES = [468, 469, 470, 471, 472]
LEFT_IRIS_INDICES = [473, 474, 475, 476, 477]

# Vertical landmarks for head pitch
TOP_FOREHEAD_IDX = 10
BOTTOM_CHIN_IDX = 152

# Eye reference points for geometric gaze estimation.
RIGHT_EYE_LEFT_CORNER = 33
RIGHT_EYE_RIGHT_CORNER = 133
LEFT_EYE_LEFT_CORNER = 263
LEFT_EYE_RIGHT_CORNER = 362
RIGHT_EYE_TOP = 159
RIGHT_EYE_BOTTOM = 145
LEFT_EYE_TOP = 386
LEFT_EYE_BOTTOM = 374

def crop_eye(image, landmarks, eye_indices):
    h, w, _ = image.shape
    x_coords = [landmarks[i].x * w for i in eye_indices]
    y_coords = [landmarks[i].y * h for i in eye_indices]
    
    x_min, x_max = int(min(x_coords)) - 5, int(max(x_coords)) + 5
    y_min, y_max = int(min(y_coords)) - 5, int(max(y_coords)) + 5
    
    x_min = max(0, x_min)
    x_max = min(w, x_max)
    y_min = max(0, y_min)
    y_max = min(h, y_max)
    
    if x_min >= x_max or y_min >= y_max:
        return None, None
        
    eye_img = image[y_min:y_max, x_min:x_max]
    # Return normalized coordinates [x, y, w, h]
    box = [
        float(x_min) / w,
        float(y_min) / h,
        float(x_max - x_min) / w,
        float(y_max - y_min) / h
    ]
    return eye_img, box


def estimate_head_pose(landmarks):
    # --- Horizontal (Yaw) ---
    left_x = landmarks[LEFT_CHEEK_IDX].x
    right_x = landmarks[RIGHT_CHEEK_IDX].x
    nose_x = landmarks[NOSE_TIP_IDX].x

    face_width = right_x - left_x
    if abs(face_width) < 1e-6:
        nose_ratio_h = 0.5
    else:
        nose_ratio_h = (nose_x - left_x) / face_width

    # --- Vertical (Pitch) ---
    top_y = landmarks[TOP_FOREHEAD_IDX].y
    bottom_y = landmarks[BOTTOM_CHIN_IDX].y
    nose_y = landmarks[NOSE_TIP_IDX].y

    face_height = bottom_y - top_y
    if abs(face_height) < 1e-6:
        nose_ratio_v = 0.5
    else:
        # Typical neutral v_ratio is ~0.45-0.5. 
        # Tilted down -> nose moves down -> ratio increases.
        # Tilted up -> nose moves up -> ratio decreases.
        nose_ratio_v = (nose_y - top_y) / face_height

    # String classification for main.py (primarily used for sideways extreme mode)
    if nose_ratio_h < 0.2 or nose_ratio_h > 0.8:
        head_pose_str = "sideways_extreme"
    elif nose_ratio_h < 0.35 or nose_ratio_h > 0.65:
        head_pose_str = "sideways_partial"
    elif nose_ratio_v < 0.3 or nose_ratio_v > 0.7:
        head_pose_str = "tilted_extreme"
    else:
        head_pose_str = "frontal"

    return head_pose_str, (nose_ratio_h, nose_ratio_v)


def _landmark_xy(landmarks, idx):
    return float(landmarks[idx].x), float(landmarks[idx].y)


def _mean_landmark(landmarks, indices):
    pts = [_landmark_xy(landmarks, i) for i in indices]
    x = sum(p[0] for p in pts) / len(pts)
    y = sum(p[1] for p in pts) / len(pts)
    return x, y


def estimate_gaze_from_landmarks(landmarks, nose_ratios):
    nose_ratio_h, nose_ratio_v = nose_ratios
    
    # If iris landmarks are unavailable, use head yaw/pitch as fallback signals.
    if len(landmarks) < 478:
        if nose_ratio_h < 0.42:
            return "left", 0.45, (0.35, 0.5)
        if nose_ratio_h > 0.58:
            return "right", 0.45, (0.65, 0.5)
        if nose_ratio_v < 0.42:
            return "down", 0.45, (0.5, 0.65)
        if nose_ratio_v > 0.58:
            return "up", 0.45, (0.5, 0.35)
        return "center", 0.4, (0.5, 0.5)

    r_iris_x, r_iris_y = _mean_landmark(landmarks, RIGHT_IRIS_INDICES)
    l_iris_x, l_iris_y = _mean_landmark(landmarks, LEFT_IRIS_INDICES)
    iris_center_x = (r_iris_x + l_iris_x) / 2.0
    iris_center_y = (r_iris_y + l_iris_y) / 2.0

    r_left_x, _ = _landmark_xy(landmarks, RIGHT_EYE_LEFT_CORNER)
    r_right_x, _ = _landmark_xy(landmarks, RIGHT_EYE_RIGHT_CORNER)
    l_left_x, _ = _landmark_xy(landmarks, LEFT_EYE_LEFT_CORNER)
    l_right_x, _ = _landmark_xy(landmarks, LEFT_EYE_RIGHT_CORNER)

    _, r_top_y = _landmark_xy(landmarks, RIGHT_EYE_TOP)
    _, r_bottom_y = _landmark_xy(landmarks, RIGHT_EYE_BOTTOM)
    _, l_top_y = _landmark_xy(landmarks, LEFT_EYE_TOP)
    _, l_bottom_y = _landmark_xy(landmarks, LEFT_EYE_BOTTOM)

    r_min_x, r_max_x = min(r_left_x, r_right_x), max(r_left_x, r_right_x)
    l_min_x, l_max_x = min(l_left_x, l_right_x), max(l_left_x, l_right_x)
    r_h = max(1e-6, r_max_x - r_min_x)
    l_h = max(1e-6, l_max_x - l_min_x)

    r_min_y, r_max_y = min(r_top_y, r_bottom_y), max(r_top_y, r_bottom_y)
    l_min_y, l_max_y = min(l_top_y, l_bottom_y), max(l_top_y, l_bottom_y)
    r_v = max(1e-6, r_max_y - r_min_y)
    l_v = max(1e-6, l_max_y - l_min_y)

    r_h_ratio = (r_iris_x - r_min_x) / r_h
    l_h_ratio = (l_iris_x - l_min_x) / l_h
    h_ratio = (r_h_ratio + l_h_ratio) / 2.0

    r_v_ratio = (r_iris_y - r_min_y) / r_v
    l_v_ratio = (l_iris_y - l_min_y) / l_v
    v_ratio = (r_v_ratio + l_v_ratio) / 2.0

    h_offset = h_ratio - 0.5
    v_offset = v_ratio - 0.5

    # Merge eye-driven cue with head pose cue for stability.
    yaw_offset = nose_ratio_h - 0.5
    pitch_offset = nose_ratio_v - 0.45  # Neutral pitch is slightly offset
    
    combined_h = (0.75 * h_offset) + (0.25 * yaw_offset)
    combined_v = (0.75 * v_offset) + (0.25 * pitch_offset)

    # Swapped labels to fix reported inversion (Down being detected as Up)
    if abs(combined_h) < 0.06 and abs(combined_v) < 0.045:
        return "center", 0.75, (iris_center_x, iris_center_y)

    if abs(combined_h) >= abs(combined_v):
        return ("right" if combined_h > 0 else "left"), 0.8, (iris_center_x, iris_center_y)
    return ("up" if combined_v > 0 else "down"), 0.75, (iris_center_x, iris_center_y)

def process_frame(b64_image):
    try:
        if "," in b64_image:
            # handle data URI: data:image/jpeg;base64,...
            b64_image = b64_image.split(',')[1]
        img_data = base64.b64decode(b64_image)
        np_arr = np.frombuffer(img_data, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        if img is None:
            return None, None, "Invalid image", None
            
        rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_img)
        
        results = detector.detect(mp_image)
        if not results.face_landmarks:
            return None, None, "No face detected", None
            
        if len(results.face_landmarks) > 1:
            return None, None, "Multiple faces detected", None
            
        landmarks = results.face_landmarks[0]
        head_pose, nose_ratios = estimate_head_pose(landmarks)
        heuristic_direction, heuristic_confidence, iris_center = estimate_gaze_from_landmarks(landmarks, nose_ratios)
        
        left_eye_img, left_box = crop_eye(rgb_img, landmarks, LEFT_EYE_INDICES)
        right_eye_img, right_box = crop_eye(rgb_img, landmarks, RIGHT_EYE_INDICES)

        if left_eye_img is None or right_eye_img is None:
            return None, None, "Eye region not visible", {
                "head_pose": head_pose,
                "nose_ratio": float(nose_ratios[0]),
            }
        
        # convert to grayscale, resize, scale
        def preprocess(eye_img):
            gray = cv2.cvtColor(eye_img, cv2.COLOR_RGB2GRAY)
            # Image is handled as-is (no flip) to maintain camera-to-model coordinate alignment
            resized = cv2.resize(gray, (60, 36))
            scaled = resized / 255.0
            tensor = torch.tensor(scaled, dtype=torch.float32).unsqueeze(0).unsqueeze(0)
            return tensor

        left_tensor = preprocess(left_eye_img)
        right_tensor = preprocess(right_eye_img)

        r_iris_x, r_iris_y = _mean_landmark(landmarks, RIGHT_IRIS_INDICES)
        l_iris_x, l_iris_y = _mean_landmark(landmarks, LEFT_IRIS_INDICES)

        meta = {
            "head_pose": head_pose,
            "nose_ratio": float(nose_ratios[0]),
            "nose_ratio_v": float(nose_ratios[1]),
            "heuristic_direction": heuristic_direction,
            "heuristic_confidence": float(heuristic_confidence),
            "iris_center_x": float(iris_center[0]),
            "iris_center_y": float(1.0 - iris_center[1]),  # Invert vertical for UI coordinate consistency
            "left_eye_box": left_box,
            "right_eye_box": right_box,
            "left_iris": [float(l_iris_x), float(1.0 - l_iris_y)],
            "right_iris": [float(r_iris_x), float(1.0 - r_iris_y)],
        }
        
        return left_tensor, right_tensor, None, meta
    except Exception as e:
        return None, None, str(e), None
