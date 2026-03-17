import torch
import torch.nn as nn
import os


INVERT_HORIZONTAL = os.getenv("INVERT_GAZE_HORIZONTAL", "1").strip().lower() in {"1", "true", "yes"}
X_DEADZONE = float(os.getenv("GAZE_X_DEADZONE", "0.28"))
Y_DEADZONE = float(os.getenv("GAZE_Y_DEADZONE", "0.22"))

class GazeNet(nn.Module):
    def __init__(self):
        super(GazeNet, self).__init__()
        
        # Siamese convolutional backbone
        self.conv = nn.Sequential(
            nn.Conv2d(1, 32, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(2),
            nn.Conv2d(32, 64, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(2)
        )
        
        # Fully connected layers
        # Image features (64 * 9 * 15 * 2 = 17280) + Head Pose (3) = 17283
        self.fc = nn.Sequential(
            nn.Linear(64 * 9 * 15 * 2 + 3, 128),
            nn.ReLU(),
            nn.Linear(128, 2) # Outputting 2 angles: Pitch and Yaw
        )

    def forward(self, xl, xr, pose):
        # Expects tensors of shape (B, 1, 36, 60) for eyes, (B, 3) for pose
        feat_l = self.conv(xl).view(xl.size(0), -1)
        feat_r = self.conv(xr).view(xr.size(0), -1)
        
        # Concatenate features from both eyes and head pose
        combined = torch.cat((feat_l, feat_r, pose), dim=1)
        return self.fc(combined)

def load_model(weights_path):
    model = GazeNet()
    state_dict = torch.load(weights_path, map_location="cpu")
    model.load_state_dict(state_dict)
    model.eval()
    return model

def predict_gaze(model, xl_tensor, xr_tensor, pose_tensor):
    """
    Predicts gaze direction and returns a vector for visualization.
    pose_tensor is expected to be (1, 3) tensor [pitch, yaw, roll]
    """
    with torch.no_grad():
        output = model(xl_tensor, xr_tensor, pose_tensor)
        gaze_angles = output[0].numpy() # [Pitch, Yaw]
        pitch = float(gaze_angles[0])
        yaw = float(gaze_angles[1])

        # Many webcam streams are mirrored; default inversion keeps left/right intuitive.
        if INVERT_HORIZONTAL:
            yaw = -yaw

        # Prefer center when both axes are near zero to avoid one-sided drift.
        # Thresholds might need calibration based on the new model's output range.
        if abs(yaw) < X_DEADZONE and abs(pitch) < Y_DEADZONE:
            direction = "center"
        elif abs(yaw) >= abs(pitch):
            direction = "right" if yaw > 0 else "left"
        elif pitch < -Y_DEADZONE:
            direction = "down"
        elif pitch > Y_DEADZONE:
            direction = "up"
        else:
            direction = "center"

        # Return direction and a mock gaze vector for UI compatibility
        return direction, [yaw, pitch, 0.0]
