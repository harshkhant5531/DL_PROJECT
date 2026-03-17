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
        
        # Fully connected layers (64 * 9 * 15 * 2 = 17280)
        self.fc = nn.Sequential(
            nn.Linear(64 * 9 * 15 * 2, 128),
            nn.ReLU(),
            nn.Linear(128, 3)
        )

    def forward(self, xl, xr):
        # Expects tensors of shape (B, 1, 36, 60)
        feat_l = self.conv(xl)
        feat_r = self.conv(xr)
        
        feat_l = feat_l.view(feat_l.size(0), -1)
        feat_r = feat_r.view(feat_r.size(0), -1)
        
        # Concatenate features from both eyes
        combined = torch.cat((feat_l, feat_r), dim=1)
        return self.fc(combined)

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
        x_angle = float(gaze_vector[0])
        y_angle = float(gaze_vector[1])

        # Many webcam streams are mirrored; default inversion keeps left/right intuitive.
        if INVERT_HORIZONTAL:
            x_angle = -x_angle

        # Prefer center when both axes are near zero to avoid one-sided drift.
        if abs(x_angle) < X_DEADZONE and abs(y_angle) < Y_DEADZONE:
            direction = "center"
        elif abs(x_angle) >= abs(y_angle):
            direction = "right" if x_angle > 0 else "left"
        elif y_angle < -Y_DEADZONE:
            direction = "down"
        elif y_angle > Y_DEADZONE:
            direction = "up"
        else:
            direction = "center"

        # Keep debug vector aligned with interpreted direction.
        gaze_vector[0] = x_angle
            
        return direction, gaze_vector
