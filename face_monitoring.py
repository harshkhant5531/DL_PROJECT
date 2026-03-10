import os
import scipy.io as so
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import TensorDataset, DataLoader
from sklearn.model_selection import train_test_split

# --- DATA PATHS (Unchanged) ---
DATA = "/content/drive/MyDrive/mpiigaze/Mpiigaze/Data/Normalized"

def train():
    print("Starting data loading...")
    
    mat_path = os.path.join(DATA, "p00", "day02.mat")
    if not os.path.exists(mat_path):
        print(f"ERROR: Could not find data at {mat_path}. Please ensure your data paths are correct.")
        return

    data = so.loadmat(mat_path)
    d = data['data'][0, 0]
    
    right = d['right'][0, 0]
    left = d['left'][0, 0]
    
    # Images are (858, 36, 60)
    Xl = left["image"]
    Xr = right["image"]
    Y = left["gaze"] # (858, 3)
    
    print(f"Loaded {Xl.shape[0]} samples.")

    # --- Preprocessing ---
    # Add channel dimension and normalize
    Xl = np.expand_dims(Xl, axis=-1) / 255.0
    Xr = np.expand_dims(Xr, axis=-1) / 255.0

    # Split into train/val/test while keeping pairs together
    Xl_train, Xl_temp, Xr_train, Xr_temp, y_train, y_temp = train_test_split(
        Xl, Xr, Y, test_size=0.3, random_state=42)
    
    Xl_val, Xl_test, Xr_val, Xr_test, y_val, y_test = train_test_split(
        Xl_temp, Xr_temp, y_temp, test_size=0.5, random_state=42)

    # Transpose for PyTorch (samples, channels, height, width)
    def to_torch_format(arr):
        return np.transpose(arr, (0, 3, 1, 2))

    Xl_train = to_torch_format(Xl_train)
    Xr_train = to_torch_format(Xr_train)
    Xl_val = to_torch_format(Xl_val)
    Xr_val = to_torch_format(Xr_val)
    Xl_test = to_torch_format(Xl_test)
    Xr_test = to_torch_format(Xr_test)

    # Convert to Tensors
    train_ds = TensorDataset(torch.Tensor(Xl_train), torch.Tensor(Xr_train), torch.Tensor(y_train))
    val_ds = TensorDataset(torch.Tensor(Xl_val), torch.Tensor(Xr_val), torch.Tensor(y_val))
    test_ds = TensorDataset(torch.Tensor(Xl_test), torch.Tensor(Xr_test), torch.Tensor(y_test))

    train_loader = DataLoader(train_ds, batch_size=32, shuffle=True)
    val_loader = DataLoader(val_ds, batch_size=32)
    test_loader = DataLoader(test_ds, batch_size=32)

    # --- Model Definition (Siamese CNN) ---
    class GazeNet(nn.Module):
        def __init__(self):
            super().__init__()
            self.conv = nn.Sequential(
                nn.Conv2d(1, 32, 3, padding=1),
                nn.ReLU(),
                nn.MaxPool2d(2),
                nn.Conv2d(32, 64, 3, padding=1),
                nn.ReLU(),
                nn.MaxPool2d(2)
            )
            # 64 channels * 9 height * 15 width * 2 eyes = 17280
            self.fc = nn.Sequential(
                nn.Linear(64 * 9 * 15 * 2, 128),
                nn.ReLU(),
                nn.Linear(128, 3)
            )

        def forward(self, xl, xr):
            feat_l = self.conv(xl)
            feat_r = self.conv(xr)
            feat_l = feat_l.view(feat_l.size(0), -1)
            feat_r = feat_r.view(feat_r.size(0), -1)
            combined = torch.cat((feat_l, feat_r), dim=1)
            return self.fc(combined)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")
    
    model = GazeNet().to(device)
    criterion = nn.MSELoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=0.001)

    # --- Training Loop ---
    epochs = 15
    print("Starting training...")
    for epoch in range(epochs):
        model.train()
        epoch_loss = 0
        for xl, xr, labels in train_loader:
            xl, xr, labels = xl.to(device), xr.to(device), labels.to(device)
            
            optimizer.zero_grad()
            outputs = model(xl, xr)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            epoch_loss += loss.item()
        
        print(f"Epoch {epoch+1}/{epochs}, Loss: {epoch_loss/len(train_loader):.6f}")

    # --- Save Model ---
    torch.save(model.state_dict(), "gaze_model.pth")
    print("SUCCESS: Model saved as gaze_model.pth")

    # --- Test ---
    model.eval()
    test_loss = 0
    with torch.no_grad():
        for xl, xr, labels in test_loader:
            xl, xr, labels = xl.to(device), xr.to(device), labels.to(device)
            outputs = model(xl, xr)
            loss = criterion(outputs, labels)
            test_loss += loss.item()
    print(f"Final Test Loss: {test_loss/len(test_loader):.6f}")

if __name__ == "__main__":
    train()
