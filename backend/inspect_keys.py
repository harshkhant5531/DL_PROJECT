import torch
state_dict = torch.load("gaze_model.pth", map_location="cpu")
for k, v in state_dict.items():
    print(f"{k} {list(v.shape)}")
