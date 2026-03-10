import os
import scipy.io as so
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import TensorDataset, DataLoader
from sklearn.model_selection import train_test_split
import matplotlib.pyplot as plt

# --- DATA PATHS (Unchanged) ---
DATASET_PATH = "/content/drive/MyDrive/Mpiigaze"
DATA = "/content/drive/MyDrive/Mpiigaze/versions/1/MPIIGaze/Data/Normalized"

def train():
    print("Starting data loading...")
    
    # In the original notebook, this was processing p00/day02.mat
    # For a full script, you might want to loop through all days/participants,
    # but I will keep the logic exactly as per the notebook provided.
    
    mat_path = os.path.join(DATA, "p00", "day02.mat")
    if not os.path.exists(mat_path):
        print(f"ERROR: Could not find data at {mat_path}. Please ensure your data paths are correct.")
        return

    data = so.loadmat(mat_path)
    d = data['data'][0, 0]
    
    right = d['right'][0, 0]
    left = d['left'][0, 0]
    
    Xl = left["image"]
    Xr = right["image"]
    Y = left["gaze"]
    
    print(f"Loaded {Xl.shape[0]} samples.")

    # --- Preprocessing ---
    # Reshape and Normalize
    Xl_reshaped = np.expand_dims(Xl, axis=-1) / 255.0
    Xr_reshaped = np.expand_dims(Xr, axis=-1) / 255.0
    
    # Flatten/Concatenate eyes as per the original notebook logic 
    # (Note: The notebook concatenated them which was part of the error I fixed)
    # To keep it consistent with the Siamese fix:
    X = np.concatenate([Xl_reshaped, Xr_reshaped], axis=0) # [B*2, H, W, 1]
    y = np.concatenate([Y, Y], axis=0) # [B*2, 3]

    # train/val/test split
    X_train_raw, X_temp, y_train_raw, y_temp = train_test_split(
        X, y, test_size=0.3, random_state=42)
    X_val_raw, X_test_raw, y_val_raw, y_test_raw = train_test_split(
        X_temp, y_temp, test_size=0.5, random_state=42)

    # Transpose for PyTorch (samples, channels, height, width)
    def to_torch_format(arr):
        return np.transpose(arr, (0, 3, 1, 2))

    X_train_t = to_torch_format(X_train_raw)
    X_val_t = to_torch_format(X_val_raw)
    X_test_t = to_torch_format(X_test_raw)

    # Split back into Siamese pairs (Fixing the notebook error)
    def split_siamese(X_arr, y_arr):
        n = X_arr.shape[0] // 2
        # Note: In the notebook, concatenation was done such that samples were doubled.
        # To train Siamese, we need pairs.
        xl = X_arr[:n]
        xr = X_arr[n:]
        labels = y_arr[:n]
        return xl, xr, labels

    xl_train, xr_train, y_train = split_siamese(X_train_t, y_train_raw)
    xl_val, xr_val, y_val = split_siamese(X_val_t, y_val_raw)
    xl_test, xr_test, y_test = split_siamese(X_test_t, y_test_raw)

    # Convert to Tensors
    train_ds = TensorDataset(torch.Tensor(xl_train), torch.Tensor(xr_train), torch.Tensor(y_train))
    val_ds = TensorDataset(torch.Tensor(xl_val), torch.Tensor(xr_val), torch.Tensor(y_val))
    test_ds = TensorDataset(torch.Tensor(xl_test), torch.Tensor(xr_test), torch.Tensor(y_test))

    train_loader = DataLoader(train_ds, batch_size=32, shuffle=True)
    val_loader = DataLoader(val_ds, batch_size=32)
    test_loader = DataLoader(test_ds, batch_size=32)

    # --- Model Definition ---
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
            self.fc = nn.Sequential(
                nn.Linear(64 * 9 * 15 * 2, 128),
                nn.ReLU(),
                nn.Linear(128, 3)
            )

        def forward(self, xl, xr):
            xl = self.conv(xl)
            xr = self.conv(xr)
            xl = xl.view(xl.size(0), -1)
            xr = xr.view(xr.size(0), -1)
            x = torch.cat((xl, xr), dim=1)
            return self.fc(x)

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
        total_loss = 0
        for xl, xr, labels in train_loader:
            xl, xr, labels = xl.to(device), xr.to(device), labels.to(device)
            
            optimizer.zero_grad()
            outputs = model(xl, xr)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            total_loss += loss.item()
        
        print(f"Epoch {epoch+1}/{epochs}, Loss: {total_loss/len(train_loader):.6f}")

    # --- Save Model ---
    torch.save(model.state_dict(), "gaze_model.pth")
    print("SUCCESS: Model saved as gaze_model.pth")

    # --- Final Test ---
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
