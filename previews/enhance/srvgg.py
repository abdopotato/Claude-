"""Real-ESRGAN SRVGGNetCompact (realesr-animevideov3, x4) inference in NumPy, reading the .pth without torch."""
import zipfile, pickle, numpy as np, sys
def load_pth(path):
    z = zipfile.ZipFile(path); root = z.namelist()[0].split('/')[0]
    class Storage:
        def __init__(self, key, dtype): self.key, self.dtype = key, dtype
    dt = {'FloatStorage': np.float32, 'HalfStorage': np.float16}
    class U(pickle.Unpickler):
        def find_class(self, mod, name):
            if name == '_rebuild_tensor_v2':
                def f(st, off, size, stride, *a):
                    buf = np.frombuffer(z.read(f'{root}/data/{st.key}'), dtype=st.dtype)
                    return np.lib.stride_tricks.as_strided(buf[off:], shape=size, strides=[s * buf.itemsize for s in stride]).astype(np.float32).copy()
                return f
            if mod == 'collections' and name == 'OrderedDict':
                import collections; return collections.OrderedDict
            if mod == 'torch' and name.endswith('Storage'): return name
            return super().find_class(mod, name)
        def persistent_load(self, pid):
            _, stype, key, loc, n = pid
            return Storage(key, dt.get(stype if isinstance(stype, str) else stype, np.float32))
    sd = U(z.open(f'{root}/data.pkl')).load()
    return sd.get('params_ema') or sd.get('params') or sd
def conv3(x, w, b):  # x: C,H,W  w: O,C,3,3
    C, H, W = x.shape; p = np.pad(x, ((0, 0), (1, 1), (1, 1)), mode='edge')
    cols = np.stack([p[:, dy:dy + H, dx:dx + W] for dy in range(3) for dx in range(3)], 1)  # C,9,H,W
    out = w.reshape(w.shape[0], -1) @ cols.reshape(C * 9, H * W)
    return out.reshape(-1, H, W) + b[:, None, None]
def run(sd, img):  # img H,W,3 in [0,1]
    x = img.transpose(2, 0, 1).astype(np.float32); i = 0; h = x
    keys = sorted({int(k.split('.')[1]) for k in sd}, key=int)
    for k in keys:
        if f'body.{k}.weight' in sd and sd[f'body.{k}.weight'].ndim == 4:
            h = conv3(h, sd[f'body.{k}.weight'], sd[f'body.{k}.bias'])
        else:  # PReLU
            a = sd[f'body.{k}.weight'][:, None, None]; h = np.where(h > 0, h, h * a)
    r = 4; C = h.shape[0] // (r * r); H, W = h.shape[1:]
    out = h.reshape(C, r, r, H, W).transpose(0, 3, 1, 4, 2).reshape(C, H * r, W * r)
    out += np.repeat(np.repeat(x, r, 1), r, 2)
    return out.transpose(1, 2, 0).clip(0, 1)
if __name__ == '__main__':
    from PIL import Image
    sd = load_pth(sys.argv[1]); im = np.asarray(Image.open(sys.argv[2]).convert('RGB')) / 255.0
    Image.fromarray((run(sd, im) * 255).round().astype('uint8')).save(sys.argv[3])
