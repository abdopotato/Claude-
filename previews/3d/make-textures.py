"""Cut one seamless pattern repeat (one prayer space) per CM 101 colourway from the catalogue page.
Usage: python3 make-textures.py <catalogue-page.jpg>   -> textures/cm101-<name>.jpg"""
import sys, numpy as np
from PIL import Image, ImageFilter
src = Image.open(sys.argv[1]).convert('RGB')
# name: (box x0, y0, x1, y1 on the 1600x1143 page, offset of first arch seam, repeat width) - measured from arch fills
BOXES = {'red': (95,143,943,682,212,212), 'pink': (980,147,1245,382,88,88), 'brick': (1282,147,1546,382,88,88),
 'blue': (980,453,1245,690,88,88), 'natural': (1282,445,1546,682,88,88), 'green': (97,743,362,978,88,88),
 'copper': (387,743,651,978,88,88), 'lightgreen': (680,743,945,978,88,88), 'darkblue': (980,743,1245,978,88,88),
 'cream': (1282,743,1547,978,88,88)}
def is_bg(row):
    return row.mean() > 226 and (row.max(1) - row.min(1)).mean() < 22
for n, (x0, y0, x1, y1, off, p) in BOXES.items():
    t = np.asarray(src.crop((x0 + off, y0 - 6, x0 + off + p, y1 + 6))).astype(int)
    a, b = 0, len(t)
    while is_bg(t[a]): a += 1
    while is_bg(t[b - 1]): b -= 1
    tile = Image.fromarray(t[a:b].astype('uint8'))
    scale = 512 / tile.height
    tile = tile.resize((round(tile.width * scale), 512), Image.LANCZOS).filter(ImageFilter.UnsharpMask(1.2, 60, 2))
    tile.save(f'textures/cm101-{n}.jpg', quality=88)
    print(n, a, len(t) - b, tile.size)
