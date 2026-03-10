import torch
from model import load_model, GazeNet
import os
model_path = os.path.join(os.path.dirname(__file__), "gaze_model.pth")
try:
    model = load_model(model_path)
    print("SUCCESS: Model loaded")
    print(f"Model parameters: {sum(p.numel() for p in model.parameters())}")
except Exception as e:
    print(f"FAILURE: Model load error: {e}")
