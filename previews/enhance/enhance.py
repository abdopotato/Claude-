"""Sharpen the colourway artwork cut from the catalogue page.
1. Every swatch repeats the same arch 3-4 times; the median of those repeats removes JPEG noise.
2. Real-ESRGAN (realesr-animevideov3, made for flat-colour artwork) enlarges the clean repeat 4x, run in NumPy (srvgg.py).
Models: https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.5.0/realesr-animevideov3.pth (fast)
        https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.2.4/RealESRGAN_x4plus_anime_6B.pth (sharper; used)
Usage: python3 enhance.py <catalogue-page.jpg> <animevideov3.pth>[,<anime_6B.pth>] <out-dir> [names...]  -> <out-dir>/<name>.png (one repeat)"""
import os, sys, numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import srvgg, rrdb
from PIL import ImageFilter
src = Image.open(sys.argv[1]).convert('RGB'); out = sys.argv[3]
fast = srvgg.load_pth(sys.argv[2].split(',')[0]); sharp = srvgg.load_pth(sys.argv[2].split(',')[1]) if ',' in sys.argv[2] else None
def blur(a, r=6): return np.asarray(Image.fromarray((a * 255).clip(0, 255).astype('uint8')).filter(ImageFilter.GaussianBlur(r))).astype(float) / 255
def enlarge(x):
    # animevideov3 keeps the swatch's colours; anime_6B draws cleaner edges but drifts colour (gold -> peach).
    # Keep 6B's edges and put back the faithful model's local colour: sharp + blur(faithful) - blur(sharp).
    f = srvgg.run(fast, x)
    if sharp is None: return f
    s = rrdb.run(sharp, x)
    return (s + blur(f) - blur(s)).clip(0, 1)
# Each swatch is a whole number of repeats starting at a seam: 4 x 212 px (red), 3 x 88 px (the others).
BOXES = {'red': (95,143,943,682,212,4), 'green': (97,743,362,978,88,3), 'dark-blue': (980,743,1245,978,88,3),
         'natural': (1282,445,1546,682,88,3), 'cream': (1282,743,1547,978,88,3)}
def is_bg(row): return row.mean() > 226 and (row.max(1) - row.min(1)).mean() < 22
page = np.asarray(src).astype(float)
for n in sys.argv[4:] or list(BOXES):
    x0, y0, x1, y1, P, reps = BOXES[n]
    strip = page[y0 - 6:y1 + 6]
    a, b = 0, len(strip)
    while is_bg(strip[a, x0:x0 + P].astype(int)): a += 1
    while is_bg(strip[b - 1, x0:x0 + P].astype(int)): b -= 1
    tile = np.median(np.stack([strip[a:b, x0 + k * P:x0 + (k + 1) * P] for k in range(reps)]), axis=0)
    # wrap a few columns round each side so the repeat stays seamless after enlarging
    padded = np.concatenate([tile[:, -6:], tile, tile[:, :6]], axis=1) / 255.0
    big = enlarge(padded)[:, 24:-24]
    Image.fromarray((big * 255).round().astype('uint8')).save(f'{out}/{n}.png')
    print(n, tile.shape[1], 'x', tile.shape[0], '->', big.shape[1], 'x', big.shape[0])
