import torch
from model import load_model, GazeNet
import os

model_path = os.path.join(os.path.dirname(__file__), "gaze_model.pth")
try:
    if os.path.exists(model_path):
        model = load_model(model_path)
        print("SUCCESS: Model loaded")
        
        # Test forward pass with dummy data
        xl = torch.randn(1, 1, 36, 60)
        xr = torch.randn(1, 1, 36, 60)
        pose = torch.randn(1, 3)
        output = model(xl, xr, pose)
        print(f"Forward pass SUCCESS. Output shape: {output.shape}")
        print(f"Model parameters: {sum(p.numel() for p in model.parameters())}")
    else:
        print(f"SKIP: Model file not found at {model_path}")
        print("Creating a fresh model instance to verify architecture...")
        model = GazeNet()
        print("SUCCESS: Model class instantiated")
        xl = torch.randn(1, 1, 36, 60)
        xr = torch.randn(1, 1, 36, 60)
        pose = torch.randn(1, 3)
        output = model(xl, xr, pose)
        print(f"Architecture verification SUCCESS. Output shape: {output.shape}")

except Exception as e:
    print(f"FAILURE: Model verification error: {e}")
    import traceback
    traceback.print_exc()
