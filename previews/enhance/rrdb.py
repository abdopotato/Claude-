"""Real-ESRGAN RRDBNet (RealESRGAN_x4plus_anime_6B: 6 blocks, 64 features, 32 growth, x4) inference in NumPy."""
import numpy as np
from srvgg import load_pth
def conv(x, w, b, rows=48):  # zero-padded 3x3 conv, x: C,H,W, processed in row chunks to bound memory
    C, H, W = x.shape; O = w.shape[0]; wm = w.reshape(O, -1)
    p = np.pad(x, ((0, 0), (1, 1), (1, 1))); out = np.empty((O, H, W), np.float32)
    for r0 in range(0, H, rows):
        r1 = min(H, r0 + rows); h = r1 - r0
        cols = np.stack([p[:, r0 + dy:r0 + dy + h, dx:dx + W] for dy in range(3) for dx in range(3)], 1)
        out[:, r0:r1] = (wm @ cols.reshape(C * 9, h * W)).reshape(O, h, W) + b[:, None, None]
    return out
lrelu = lambda x: np.where(x > 0, x, 0.2 * x).astype(np.float32)
up2 = lambda x: np.repeat(np.repeat(x, 2, 1), 2, 2)
def run(sd, img):
    c = lambda name, x: conv(x, sd[name + '.weight'], sd[name + '.bias'])
    x = img.transpose(2, 0, 1).astype(np.float32)
    feat = c('conv_first', x); h = feat
    for i in range(6):
        inp = h
        for r in (1, 2, 3):
            pre = f'body.{i}.rdb{r}.'; xs = [h]
            for k in range(1, 5): xs.append(lrelu(c(pre + f'conv{k}', np.concatenate(xs, 0))))
            h = c(pre + 'conv5', np.concatenate(xs, 0)) * 0.2 + h
        h = h * 0.2 + inp
    feat = feat + c('conv_body', h)
    feat = lrelu(c('conv_up1', up2(feat))); feat = lrelu(c('conv_up2', up2(feat)))
    out = c('conv_last', lrelu(c('conv_hr', feat)))
    return out.transpose(1, 2, 0).clip(0, 1)
