"""Inline the CM 101 textures into the viewer. Usage: python3 build.py  -> cm101-viewer.html"""
import base64, io, json, pathlib
from PIL import Image
here = pathlib.Path(__file__).parent
tex = {}
for f in sorted((here / 'textures').glob('cm101-*.jpg')):
    im = Image.open(f).convert('RGB')
    buf = io.BytesIO()
    im.resize((256, 512), Image.LANCZOS).save(buf, 'JPEG', quality=86)  # power of two so the pattern can repeat on any GPU
    tex[f.stem[6:]] = {'aspect': round(im.width / im.height, 4),
                       'src': 'data:image/jpeg;base64,' + base64.b64encode(buf.getvalue()).decode()}
src = (here / 'cm101-viewer.src.html').read_text()
(here / 'cm101-viewer.html').write_text(src.replace('/*TEXTURES*/{}', json.dumps(tex)))
print(len(tex), 'colourways,', (here / 'cm101-viewer.html').stat().st_size // 1024, 'KB')
