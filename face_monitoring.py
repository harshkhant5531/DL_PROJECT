import os
import scipy.io as so
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import TensorDataset, DataLoader
from sklearn.model_selection import train_test_split

# --- DATA PATHS ---
DATA = "/content/drive/MyDrive/mpiigaze/MPIIGaze/Data/Normalized"

def train():
    print("Starting data loading...")
    
    mat_path = os.path.join(DATA, "p00", "day01.mat")
    if not os.path.exists(mat_path):
        print(f"ERROR: Could not find data at {mat_path}.")
        return

    data = so.loadmat(mat_path)
    d = data['data'][0, 0]
    
    # 1. Extract Images, Gaze (Target), and Head Pose (Context)
    right = d['right'][0, 0]
    left = d['left'][0, 0]
    
    Xl_img = left["image"]
    Xr_img = right["image"]
    X_pose = left["pose"]  # (858, 3) - Vital for vertical context
    Y_3d = left["gaze"]    # (858, 3) - 3D vectors
    
    # 2. Convert 3D Gaze Vectors to 2D Angles (Pitch and Yaw)
    # Pitch (Up/Down) = arcsin(-y)
    # Yaw (Left/Right) = arctan2(-x, -z)
    pitch = np.arcsin(-Y_3d[:, 1])
    yaw = np.arctan2(-Y_3d[:, 0], -Y_3d[:, 2])
    Y_2d = np.stack((pitch, yaw), axis=1)

    # --- Preprocessing ---
    Xl_img = np.expand_dims(Xl_img, axis=-1) / 255.0
    Xr_img = np.expand_dims(Xr_img, axis=-1) / 255.0

    # Split including the Pose data
    (Xl_tr, Xl_te, Xr_tr, Xr_te, 
     Xp_tr, Xp_te, y_tr, y_te) = train_test_split(
        Xl_img, Xr_img, X_pose, Y_2d, test_size=0.2, random_state=42)

    def to_torch_format(arr):
        return np.transpose(arr, (0, 3, 1, 2))

    # Convert to Tensors
    train_ds = TensorDataset(
        torch.Tensor(to_torch_format(Xl_tr)), 
        torch.Tensor(to_torch_format(Xr_tr)), 
        torch.Tensor(Xp_tr), 
        torch.Tensor(y_tr)
    )
    test_loader = DataLoader(train_ds, batch_size=32)

    # --- Improved Model: GazeNet with Pose Fusion ---
    class GazeNet(nn.Module):
        def __init__(self):
            super().__init__()
            self.conv = nn.Sequential(
                nn.Conv2d(1, 32, 3, padding=1), nn.ReLU(), nn.MaxPool2d(2),
                nn.Conv2d(32, 64, 3, padding=1), nn.ReLU(), nn.MaxPool2d(2)
            )
            # Image features (17280) + Head Pose (3) = 17283
            self.fc = nn.Sequential(
                nn.Linear(64 * 9 * 15 * 2 + 3, 128),
                nn.ReLU(),
                nn.Linear(128, 2) # Outputting 2 angles: Pitch and Yaw
            )

        def forward(self, xl, xr, pose):
            feat_l = self.conv(xl).view(xl.size(0), -1)
            feat_r = self.conv(xr).view(xr.size(0), -1)
            # Fuse eye features with head pose context
            combined = torch.cat((feat_l, feat_r, pose), dim=1)
            return self.fc(combined)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = GazeNet().to(device)
    criterion = nn.MSELoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=0.001)

    # --- Training Loop ---
    model.train()
    for epoch in range(15):
        epoch_loss = 0
        for xl, xr, pose, labels in test_loader:
            xl, xr, pose, labels = xl.to(device), xr.to(device), pose.to(device), labels.to(device)
            
            optimizer.zero_grad()
            outputs = model(xl, xr, pose)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            epoch_loss += loss.item()
        
        print(f"Epoch {epoch+1}/15, Loss: {epoch_loss/len(test_loader):.6f}")

    torch.save(model.state_dict(), "gaze_model_v2.pth")
    print("SUCCESS: Model updated with Pitch/Yaw prediction and saved.")

if __name__ == "__main__":
    train()