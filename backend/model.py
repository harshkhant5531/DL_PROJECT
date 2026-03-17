import torch
import torch.nn as nn
import os


INVERT_HORIZONTAL = os.getenv("INVERT_GAZE_HORIZONTAL", "1").strip().lower() in {"1", "true", "yes"}
X_DEADZONE = float(os.getenv("GAZE_X_DEADZONE", "0.22"))
Y_DEADZONE = float(os.getenv("GAZE_Y_DEADZONE", "0.16"))

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
        
        print(f"DEBUG: Gaze Raw -> Pitch: {pitch:.4f}, Yaw: {yaw:.4f}")

        # CUSTOM CALIBRATION BASED ON USER FEEDBACK:
        # Center: 0.264, Down: 0.231, Up: 0.222
        # Center is the largest value. Down is smaller. Up is smallest.
        # This confirms that for the model: Higher Pitch = Higher on screen.
        
        # Let's shift Center (0.264) to 0.0
        pitch -= 0.264
        
        # Now: Center: 0.0, Down: -0.033, Up: -0.042
        # This is still very tight, but "Down" is now negative.
        # BUT the user reported Down is detected as Up.
        # So we MUST invert the string labels here too.

        print(f"DEBUG: Calibrated Gaze -> Pitch: {pitch:.4f}, Yaw: {yaw:.4f}")

        # Thresholds (Tighter for this user's limited range)
        X_DZ = 0.15
        Y_DZ = 0.015

        if abs(yaw) < X_DZ and abs(pitch) < Y_DZ:
            direction = "center"
        elif abs(yaw) >= abs(pitch):
            direction = "right" if yaw > 0 else "left"
        elif pitch < -Y_DEADZONE:
            direction = "down"
        elif pitch > Y_DEADZONE:
            direction = "up"
        else:
            direction = "center"

        return direction, [yaw, pitch, 0.0]
