"""Turn enlarged repeats (enhance.py output) into theme assets.
Usage: python3 make-assets.py <enlarged-dir> <theme/assets>
  mosque-roll-<name>.jpg   one repeat, 1024 px tall (3D roll pattern, homepage swatch)
  mosque-design-<name>.jpg square product picture, about three arches, 1200 px"""
import sys
from PIL import Image
src, dst = sys.argv[1], sys.argv[2]
for k in ['green', 'red', 'dark-blue', 'natural', 'cream']:
    t = Image.open(f'{src}/{k}.png').convert('RGB')
    r = t.resize((round(t.width * 1024 / t.height), 1024), Image.LANCZOS)
    r.save(f'{dst}/mosque-roll-{k}.jpg', quality=88, optimize=True)
    H = 1200; u = t.resize((round(t.width * H / t.height), H), Image.LANCZOS)
    strip = Image.new('RGB', (u.width * 4, H))
    for i in range(4): strip.paste(u, (i * u.width, 0))
    x = (strip.width - H) // 2
    strip.crop((x, 0, x + H, H)).save(f'{dst}/mosque-design-{k}.jpg', quality=86, optimize=True, progressive=True)
    print(k, 'aspect', round(r.width / r.height, 4))
