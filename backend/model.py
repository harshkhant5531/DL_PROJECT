import torch
import torch.nn as nn
import os

class GazeNet(nn.Module):
    def __init__(self):
        super(GazeNet, self).__init__()
        # Matches Sequential structure found in weights:
        # layers.0 (Linear), layers.1 (ReLU), layers.2 (Linear), layers.3 (ReLU), layers.4 (Linear)
        self.layers = nn.Sequential(
            nn.Linear(36 * 60, 128),
            nn.ReLU(),
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.Linear(64, 3)
        )

    def forward(self, xl, xr):
        # Flatten and treat each eye as an independent sample (matching training script)
        xl_flat = xl.view(xl.size(0), -1)
        xr_flat = xr.view(xr.size(0), -1)
        
        out_l = self.layers(xl_flat)
        out_r = self.layers(xr_flat)
        
        # Return the average gaze vector of both eyes
        return (out_l + out_r) / 2.0

def load_model(weights_path):
    model = GazeNet()
    state_dict = torch.load(weights_path, map_location="cpu")
    model.load_state_dict(state_dict)
    model.eval()
    return model

def predict_gaze(model, xl_tensor, xr_tensor):
    with torch.no_grad():
        output = model(xl_tensor, xr_tensor)
        gaze_vector = output[0].numpy()
        x_angle = gaze_vector[0] # Negative is left, positive is right (image-space)
        y_angle = gaze_vector[1] # Negative is up, positive is down
        
        # Deadzone relaxed to 0.15 (from 0.07) to improve focus stability
        if x_angle < -0.15:
            direction = "left"
        elif x_angle > 0.15:
            direction = "right"
        elif y_angle < -0.15:
            direction = "up"
        elif y_angle > 0.15:
            direction = "down"
        else:
            direction = "center"
            
        return direction, gaze_vector
