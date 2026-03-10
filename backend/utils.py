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
        return np.zeros((36, 60, 3), dtype=np.uint8)
        
    eye_img = image[y_min:y_max, x_min:x_max]
    return eye_img

def process_frame(b64_image):
    try:
        if "," in b64_image:
            # handle data URI: data:image/jpeg;base64,...
            b64_image = b64_image.split(',')[1]
        img_data = base64.b64decode(b64_image)
        np_arr = np.frombuffer(img_data, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        if img is None:
            return None, None, "Invalid image"
            
        rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_img)
        
        results = detector.detect(mp_image)
        if not results.face_landmarks:
            return None, None, "No face detected"
            
        if len(results.face_landmarks) > 1:
            return None, None, "Multiple faces detected"
            
        landmarks = results.face_landmarks[0]
        
        left_eye_img = crop_eye(rgb_img, landmarks, LEFT_EYE_INDICES)
        right_eye_img = crop_eye(rgb_img, landmarks, RIGHT_EYE_INDICES)
        
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
        
        return left_tensor, right_tensor, None
    except Exception as e:
        return None, None, str(e)
