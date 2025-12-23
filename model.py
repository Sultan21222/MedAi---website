import torch
import torch.nn as nn
layers_for_down = [
    (3, 16, 3, 1),
    (16, 32, 3, 1),
    (32, 64, 3, 1),
    (64, 256, 3, 1),
    (256, 1024, 3, 1)
]
layers_for_up = [
    (1024, 256, 3, 1),
    (256, 64, 3, 1),
    (64, 32, 3, 1),
    (32, 16, 3, 1)
]

y = []

class SameConv(nn.Module):
    def __init__(self, in_channels, kernel_size=3, padding=1):
        super().__init__()
        self.conv = nn.Conv2d(in_channels, in_channels, kernel_size, padding=padding)
        self.pool = nn.MaxPool2d(2, 2)
    def forward(self, x, pooling):
        y.append(self.conv(x))
        return self.pool(y[-1]) if pooling else y[-1]

class SimpleConv(nn.Module):
    def __init__(self, in_channels, out_channels, kernel_size, padding):
        super().__init__()
        self.conv = nn.Conv2d(in_channels, out_channels, kernel_size, padding=padding)
    def forward(self, x):
        return self.conv(x)

class UNet_Block_Down(nn.Module):
    def __init__(self, in_channels, out_channels, kernel_size, padding):
        super().__init__()
        self.simple_module = SimpleConv(in_channels, out_channels, kernel_size, padding)
        self.same_module = SameConv(out_channels, kernel_size, padding)
    def forward(self, x, pooling):
        x = self.simple_module(x)
        x = self.same_module(x, pooling)
        return x

class UNet_Block_Up(nn.Module):
    def __init__(self, in_channels, out_channels, kernel_size, padding):
        super().__init__()
        self.trans_conv = nn.ConvTranspose2d(in_channels, out_channels, kernel_size=4, padding=1, stride=2)
        self.reduce_conv = SimpleConv(out_channels*2, out_channels, kernel_size, padding)
        self.same_conv = SameConv(out_channels, kernel_size, padding)
    def forward(self, x1, x2):
        x = self.trans_conv(x1)
        x = torch.cat([x, x2], dim=1)
        x = self.reduce_conv(x)
        x = self.same_conv(x, False)
        return x

class UNet(nn.Module):
    def __init__(self, nn_classes=2):
        super().__init__()
        self.down = nn.ModuleList()
        self.up = nn.ModuleList()
        self.final_conv = nn.Conv2d(16, nn_classes, 1)
        for in_channels, out_channels, kernel_size, padding in layers_for_down:
            self.down.append(UNet_Block_Down(in_channels, out_channels, kernel_size, padding))
        for in_channels, out_channels, kernel_size, padding in layers_for_up:
            self.up.append(UNet_Block_Up(in_channels, out_channels, kernel_size, padding))
            
    def forward(self, x):
        y.clear() # Очищаем список skip-connections при каждом проходе
        x1 = self.down[0](x, True)
        x2 = self.down[1](x1, True)
        x3 = self.down[2](x2, True)
        x4 = self.down[3](x3, True)
        x5 = self.down[4](x4, False)
        x6 = self.up[0](x5, y[3])
        x7 = self.up[1](x6, y[2])
        x8 = self.up[2](x7, y[1])
        x9 = self.up[3](x8, y[0])
        x10 = self.final_conv(x9)
        return x10