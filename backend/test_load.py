import torch
from model import load_model, GazeNet
try:
    model = load_model("gaze_model.pth")
    print("SUCCESS: Model loaded")
    print(f"Model parameters: {sum(p.numel() for p in model.parameters())}")
except Exception as e:
    print(f"FAILURE: Model load error: {e}")
