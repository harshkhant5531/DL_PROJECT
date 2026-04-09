# -*- coding: utf-8 -*-
"""
Improved Face Monitoring & Gaze Estimation
"""

import os
import scipy.io as so
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import TensorDataset, DataLoader
from sklearn.model_selection import train_test_split

# --- 1. MODEL ARCHITECTURE (Global Scope) ---
class GazeNet(nn.Module):
    def __init__(self):
        super().__init__()

        # Siamese Feature Extractor: We use the same CNN block for both eyes.
        # AdaptiveAvgPool2d fixes the output spatial dimension to 5x5,
        # allowing the model to accept ANY input image resolution without crashing.
        self.feature_extractor = nn.Sequential(
            nn.Conv2d(1, 32, kernel_size=3, padding=1),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2),
            nn.Conv2d(32, 64, kernel_size=3, padding=1),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2),
            nn.AdaptiveAvgPool2d((5, 5))
        )

        # Flattened size per eye: 64 channels * 5 width * 5 height = 1600
        # Total combined size: 1600 (left) + 1600 (right) + 3 (pose) = 3203
        self.fc = nn.Sequential(
            nn.Linear(1600 * 2 + 3, 128),
            nn.ReLU(inplace=True),
            nn.Linear(128, 2) # Output: Pitch and Yaw
        )

    def forward(self, xl, xr, pose):
        # Extract features for both eyes separately
        feat_l = self.feature_extractor(xl).view(xl.size(0), -1)
        feat_r = self.feature_extractor(xr).view(xr.size(0), -1)

        # Fuse eye features with head pose context
        combined = torch.cat((feat_l, feat_r, pose), dim=1)
        return self.fc(combined)


# --- 2. DATA LOADING & PREPROCESSING ---
def load_and_preprocess_data(data_path):
    print("Loading data...")
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"ERROR: Could not find data at {data_path}.")

    data = so.loadmat(data_path)
    d = data['data'][0, 0]

    right = d['right'][0, 0]
    left = d['left'][0, 0]

    # Extract images and add channel dimension, then normalize (0 to 1)
    Xl_img = np.expand_dims(left["image"], axis=-1) / 255.0
    Xr_img = np.expand_dims(right["image"], axis=-1) / 255.0

    # FIX: Remove left-eye bias by averaging left and right pose/gaze
    # to create a unified "cyclopean" (binocular) representation.
    Xp_raw = (left["pose"] + right["pose"]) / 2.0
    Y_3d = (left["gaze"] + right["gaze"]) / 2.0

    print(f"Loaded {Xl_img.shape[0]} samples.")

    # Convert 3D gaze to 2D spherical coordinates (Pitch/Yaw in radians)
    pitch = np.arcsin(-Y_3d[:, 1])
    yaw = np.arctan2(-Y_3d[:, 0], -Y_3d[:, 2])
    Y_2d = np.stack((pitch, yaw), axis=1)

    return Xl_img, Xr_img, Xp_raw, Y_2d


# --- 3. MAIN TRAINING ROUTINE ---
def train():
    # Setup Paths and Device
    DATA_PATH = "/content/drive/MyDrive/mpiigaze/MPIIGaze/Data/Normalized/p00/day01.mat"
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")

    # Load Data
    Xl_img, Xr_img, Xp_raw, Y_2d = load_and_preprocess_data(DATA_PATH)

    # Split into Train and Validation sets
    (Xl_tr, Xl_val, Xr_tr, Xr_val, Xp_tr, Xp_val, y_tr, y_val) = train_test_split(
        Xl_img, Xr_img, Xp_raw, Y_2d, test_size=0.2, random_state=42
    )

    # Helper to convert numpy (N, H, W, C) to PyTorch (N, C, H, W)
    def to_torch_format(arr):
        return np.transpose(arr, (0, 3, 1, 2))

    # Build DataLoaders
    train_ds = TensorDataset(
        torch.Tensor(to_torch_format(Xl_tr)),
        torch.Tensor(to_torch_format(Xr_tr)),
        torch.Tensor(Xp_tr),
        torch.Tensor(y_tr)
    )
    val_ds = TensorDataset(
        torch.Tensor(to_torch_format(Xl_val)),
        torch.Tensor(to_torch_format(Xr_val)),
        torch.Tensor(Xp_val),
        torch.Tensor(y_val)
    )

    train_loader = DataLoader(train_ds, batch_size=32, shuffle=True)
    val_loader = DataLoader(val_ds, batch_size=32, shuffle=False)

    # Initialize Model, Loss, and Optimizer
    model = GazeNet().to(device)
    criterion = nn.MSELoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=0.001)

    # Training Loop
    epochs = 15
    print("\nStarting training...")

    for epoch in range(epochs):
        # --- Training Phase ---
        model.train()
        train_loss = 0.0

        for xl, xr, pose, labels in train_loader:
            xl, xr, pose, labels = xl.to(device), xr.to(device), pose.to(device), labels.to(device)

            optimizer.zero_grad()
            outputs = model(xl, xr, pose)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            train_loss += loss.item()

        avg_train_loss = train_loss / len(train_loader)

        # --- Validation Phase ---
        model.eval()
        val_loss = 0.0
        with torch.no_grad():
            for xl, xr, pose, labels in val_loader:
                xl, xr, pose, labels = xl.to(device), xr.to(device), pose.to(device), labels.to(device)
                outputs = model(xl, xr, pose)
                loss = criterion(outputs, labels)
                val_loss += loss.item()

        avg_val_loss = val_loss / len(val_loader)

        print(f"Epoch {epoch+1:02d}/{epochs} | Train Loss: {avg_train_loss:.6f} | Val Loss: {avg_val_loss:.6f}")

    # Save Model Weights
    torch.save(model.state_dict(), "gaze_model_improved.pth")
    print("\nSUCCESS: Model saved as gaze_model_improved.pth")


if __name__ == "__main__":
    # If running in Colab, ensure drive is mounted first:
    # from google.colab import drive
    # drive.mount('/content/drive')
    train()