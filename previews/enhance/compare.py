"""Side-by-side check sheets: catalogue swatch (enlarged, pixels kept) | replicated design | replicated shrunk back to
swatch size and enlarged the same way (should look like the catalogue) | difference heat map.
Usage: python compare.py <catalogue-page.jpg> <replicated-dir> <out-dir> names..."""
import os, sys, numpy as np
from PIL import Image, ImageDraw
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import replicate as rep
page_path, rep_dir, out_dir, args = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4:]
rep.load_page(page_path)
for name in args:
    tile = rep.swatch_tile(name); h, w = tile.shape[:2]
    R = np.asarray(Image.open(f'{rep_dir}/{name}.png').convert('RGB')).astype(float)
    H = 900; scale = H / h
    sw = Image.fromarray(tile.clip(0, 255).astype('uint8')).resize((round(w * scale), H), Image.NEAREST)
    big = Image.fromarray(R.astype('uint8')).resize((round(w * scale), H), Image.LANCZOS)
    small = np.asarray(Image.fromarray(R.astype('uint8')).resize((w, h), Image.BOX)).astype(float)
    back = Image.fromarray(small.clip(0, 255).astype('uint8')).resize((round(w * scale), H), Image.NEAREST)
    diff = np.abs(small - tile).mean(-1); heat = np.zeros((h, w, 3), np.uint8); heat[..., 0] = np.clip(diff * 4, 0, 255); heat[..., 1] = np.clip(diff * 1.5, 0, 255)
    heat = Image.fromarray(heat).resize((round(w * scale), H), Image.NEAREST)
    panels = [('catalogue swatch', sw), ('replicated', big), ('replicated, shrunk', back), ('difference', heat)]
    W1 = sw.width; sheet = Image.new('RGB', (4 * W1 + 60, H + 30), 'white'); d = ImageDraw.Draw(sheet)
    for i, (lbl, im) in enumerate(panels):
        sheet.paste(im, (i * (W1 + 20), 30)); d.text((i * (W1 + 20) + 4, 8), lbl, fill='black')
    sheet.save(f'{out_dir}/check-{name}.png')
    print(name, 'mean abs diff %.1f' % np.abs(small - tile).mean())
