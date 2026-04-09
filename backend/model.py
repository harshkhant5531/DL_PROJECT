import os

import torch
import torch.nn as nn


INVERT_HORIZONTAL = os.getenv("INVERT_GAZE_HORIZONTAL", "1").strip().lower() in {"1", "true", "yes"}
X_DEADZONE = float(os.getenv("GAZE_X_DEADZONE", "0.22"))


class GazeNet(nn.Module):
    """
    Primary production architecture.

    Matches checkpoints that store parameters under `feature_extractor.*`
    and use a flattened FC input size of 3203.
    """

    def __init__(self):
        super().__init__()
        self.feature_extractor = nn.Sequential(
            nn.Conv2d(1, 32, kernel_size=3, padding=1),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2),
            nn.Conv2d(32, 64, kernel_size=3, padding=1),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2),
            nn.AdaptiveAvgPool2d((5, 5)),
        )
        self.fc = nn.Sequential(
            nn.Linear(1600 * 2 + 3, 128),
            nn.ReLU(inplace=True),
            nn.Linear(128, 2),
        )

    def forward(self, xl, xr, pose):
        feat_l = self.feature_extractor(xl).view(xl.size(0), -1)
        feat_r = self.feature_extractor(xr).view(xr.size(0), -1)
        combined = torch.cat((feat_l, feat_r, pose), dim=1)
        return self.fc(combined)


class LegacyGazeNet(nn.Module):
    """
    Backward-compatible architecture for checkpoints with `conv.*` weights.
    """

    def __init__(self):
        super().__init__()
        self.conv = nn.Sequential(
            nn.Conv2d(1, 32, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(2),
            nn.Conv2d(32, 64, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(2),
        )
        self.fc = nn.Sequential(
            nn.Linear(64 * 9 * 15 * 2 + 3, 128),
            nn.ReLU(),
            nn.Linear(128, 2),
        )

    def forward(self, xl, xr, pose):
        feat_l = self.conv(xl).view(xl.size(0), -1)
        feat_r = self.conv(xr).view(xr.size(0), -1)
        combined = torch.cat((feat_l, feat_r, pose), dim=1)
        return self.fc(combined)


def _build_model_from_checkpoint(state_dict):
    keys = state_dict.keys()
    if any(key.startswith("feature_extractor.") for key in keys):
        return GazeNet()
    if any(key.startswith("conv.") for key in keys):
        return LegacyGazeNet()
    raise RuntimeError(
        "Unsupported checkpoint format: expected `feature_extractor.*` or `conv.*` keys."
    )


def load_model(weights_path):
    state_dict = torch.load(weights_path, map_location="cpu")
    model = _build_model_from_checkpoint(state_dict)
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

        # Horizontal-only direction mode: vertical up/down classes are disabled.
        if abs(yaw) < X_DEADZONE:
            direction = "center"
        else:
            direction = "right" if yaw > 0 else "left"

        return direction, [yaw, pitch, 0.0]
