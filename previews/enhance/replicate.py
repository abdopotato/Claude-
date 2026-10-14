"""Replicate the Red master drawing in every colourway, with flat colours.

1. Segment the sharp Red repeat (enhance.py output) into flat colour regions: k-means, majority-filter the
   anti-aliased halos away, split into connected regions, fold tiny specks into their neighbours.
2. Align the drawing to each colourway's catalogue swatch: the sub-pixel scale/offset where 'same drawing, one colour
   per drawing colour' best explains the swatch (works even when a colourway hides some lines, e.g. Natural).
3. Solve one colour per region by least squares: rendering the regions with those colours and shrinking to the
   swatch's size (with the print/JPEG blur) should reproduce the swatch. Regions too small to see are pulled
   towards the colour their label usually takes in that colourway.
4. Render the regions flat and anti-aliased.

Usage: python replicate.py <catalogue-page.jpg> <red-enlarged.png> <out-dir> [names...]   (needs numpy, scipy, pillow)"""
import sys, json, numpy as np
from PIL import Image
from scipy import ndimage, sparse
from scipy.sparse.linalg import lsqr

page = None
def load_page(path):
    global page; page = np.asarray(Image.open(path).convert('RGB')).astype(float)
# swatch boxes on the 1600x1143 catalogue page: x0, y0, x1, y1, repeat width (px), repeats
BOXES = {'red': (95,143,943,682,212,4), 'green': (97,743,362,978,88,3), 'dark-blue': (980,743,1245,978,88,3),
         'natural': (1282,445,1546,682,88,3), 'cream': (1282,743,1547,978,88,3), 'pink': (980,147,1245,382,88,3),
         'brick': (1282,147,1546,382,88,3), 'blue': (980,453,1245,690,88,3), 'copper': (387,743,651,978,88,3),
         'light-green': (680,743,945,978,88,3)}

def swatch_tile(name):
    x0, y0, x1, y1, P, reps = BOXES[name]
    s = page[y0 - 6:y1 + 6]
    bg = lambda r: r.mean() > 226 and (r.max(1) - r.min(1)).mean() < 22
    a, b = 0, len(s)
    while bg(s[a, x0:x0 + P]): a += 1
    while bg(s[b - 1, x0:x0 + P]): b -= 1
    return np.median(np.stack([s[a:b, x0 + k * P:x0 + (k + 1) * P] for k in range(reps)]), 0)

def kmeans(px, k, iters=30, seed=0):
    rng = np.random.default_rng(seed)
    c = px[rng.choice(len(px), k, replace=False)].astype(float)
    for _ in range(iters):
        lab = ((px[:, None] - c[None]) ** 2).sum(-1).argmin(1)
        c = np.array([px[lab == j].mean(0) if (lab == j).any() else c[j] for j in range(k)])
    return c

def segment(hr, k=16, merge=20, speck=20):
    H, W = hr.shape[:2]; flat = hr.reshape(-1, 3)
    C = kmeans(hr[::3, ::3].reshape(-1, 3), k)
    # merge near-identical clusters (one flat field should stay one colour)
    groups = list(range(len(C)))
    for i in range(len(C)):
        for j in range(i):
            if np.linalg.norm(C[i] - C[j]) < merge: groups[i] = groups[j]; break
    def assign(px, cents):
        out = np.empty(len(px), np.int32)
        for i in range(0, len(px), 400000): out[i:i + 400000] = ((px[i:i + 400000, None] - cents[None]) ** 2).sum(-1).argmin(1)
        return out
    lab0 = np.array(groups)[assign(flat, C)]
    ids = sorted(set(groups)); C = np.array([flat[lab0 == g].mean(0) for g in ids]); k = len(C)
    lab = assign(flat, C)
    # clusters that are just a blend of two others (anti-aliasing halos) are dropped: their pixels go to the nearer end
    mix = {}
    for c in range(k):
        best = None
        for a_ in range(k):
            for b_ in range(a_ + 1, k):
                if c in (a_, b_): continue
                d = C[a_] - C[b_]; t = np.dot(C[c] - C[b_], d) / max(np.dot(d, d), 1e-6)
                res = np.linalg.norm(C[b_] + t * d - C[c])
                if 0.2 < t < 0.8 and res < 10 and (best is None or res < best[0]): best = (res, a_, b_)
        if best and (lab == c).mean() < 0.03: mix[c] = best[1:]
    real = [c for c in range(k) if c not in mix]
    lab = np.array(real)[assign(flat, C[real])] if mix else lab
    lab = lab.reshape(H, W)
    votes = np.stack([ndimage.uniform_filter((lab == j).astype(np.float32), 3, mode=('nearest', 'wrap')) for j in range(k)])
    lab = votes.argmax(0).astype(np.int32)
    regions = np.zeros((H, W), np.int32); n = 0
    for j in range(k):
        r, m = ndimage.label(lab == j, structure=np.ones((3, 3)))
        sizes = np.bincount(r.ravel()); keep = sizes >= speck; keep[0] = False
        remap = np.zeros(len(sizes), np.int32); kid = np.where(keep)[0]; remap[kid] = np.arange(n + 1, n + 1 + len(kid))
        regions = np.where(keep[r] & (r > 0), remap[r], regions); n += len(kid)
    hole = regions == 0
    if hole.any():
        _, (iy, ix) = ndimage.distance_transform_edt(hole, return_indices=True); regions = regions[iy, ix]
    regions -= 1
    counts = np.zeros((n, k), np.int64); np.add.at(counts, (regions.ravel(), lab.ravel()), 1)
    reg_label = counts.argmax(1)
    reg_colour = np.zeros((n, 3)); np.add.at(reg_colour, regions.ravel(), flat)
    reg_colour /= np.bincount(regions.ravel(), minlength=n)[:, None]
    info = {'palette': ['#%02X%02X%02X' % tuple(int(v) for v in c) for c in C], 'halo_clusters': len(mix)}
    return regions, reg_label, reg_colour, info

if __name__ == '__main__':
    PAGE, RED_HR, OUT = sys.argv[1], sys.argv[2], sys.argv[3]; load_page(PAGE)
if __name__ == '__main__' and len(sys.argv) > 4 and sys.argv[4] == '--segment-only':
    hr = np.asarray(Image.open(RED_HR).convert('RGB')).astype(float)
    regions, reg_label, reg_colour, info = segment(hr)
    flat_img = reg_colour[regions].clip(0, 255).astype('uint8')
    Image.fromarray(flat_img).save(f'{OUT}/red-flat.png')
    np.save(f'{OUT}/regions.npy', regions); np.save(f'{OUT}/reg_label.npy', reg_label)
    print('regions', regions.max() + 1, info)
    sizes = np.bincount(regions.ravel()); print('region size px: min', sizes.min(), 'median', int(np.median(sizes)), 'max', sizes.max())

def edges(img):
    gy, gx = np.gradient(img, axis=(0, 1)); return np.sqrt((gx ** 2 + gy ** 2).sum(-1))

def blur_hr(hr_img, sx, sy, sigma):
    return ndimage.gaussian_filter(hr_img, (sigma * sy, sigma * sx, 0), mode=('nearest', 'wrap', 'nearest'))

def sample_lr(blurred, h, w, sx, sy, dx, dy):
    """Point (x, y) of the swatch sits at HR ((x + .5 + dx) sx, (y + .5 + dy) sy); `blurred` is pre-blurred to swatch scale."""
    dyr = np.broadcast_to(np.asarray(dy, float), (h,))  # dy may vary by swatch row (vertical warp)
    yy, xx = np.meshgrid((np.arange(h) + .5 + dyr) * sy - .5, (np.arange(w) + .5 + dx) * sx - .5, indexing='ij')
    return np.stack([ndimage.map_coordinates(blurred[..., c], [yy, xx % blurred.shape[1]], order=1, mode='nearest') for c in range(3)], -1)

def align(flat_hr, tile):
    h, w = tile.shape[:2]; H, W = flat_hr.shape[:2]
    sx = W / w; sy0 = H / h
    bl = blur_hr(flat_hr, sx, sy0, 0.5)  # blur once at the nominal scale; small scale changes don't matter for it
    et = edges(tile); best = None
    for ey in np.arange(-0.05, 0.051, 0.01):
        for dy in np.arange(-3, 3.01, 0.5):
            for dx in np.arange(-1, 1.01, 0.25):
                c = np.corrcoef(edges(sample_lr(bl, h, w, sx, sy0 * (1 + ey), dx, dy)).ravel(), et.ravel())[0, 1]
                if best is None or c > best[0]: best = (c, sy0 * (1 + ey), dx, dy)
    c0, syb, dxb, dyb = best
    for sy in syb * (1 + np.arange(-0.006, 0.0061, 0.002)):
        for dy in dyb + np.arange(-0.4, 0.41, 0.1):
            for dx in dxb + np.arange(-0.2, 0.21, 0.05):
                c = np.corrcoef(edges(sample_lr(bl, h, w, sx, sy, dx, dy)).ravel(), et.ravel())[0, 1]
                if c > best[0]: best = (c, sy, dx, dy)
    # vertical warp: the two swatches' bands differ slightly in height, so refine dy band by band and interpolate
    corr, sy, dx, dy = best
    centres, shifts = [], []
    for y0 in range(0, h - 12, 12):
        y1 = min(h, y0 + 24); bestb = None
        for ddy in np.arange(-1.5, 1.51, 0.1):
            lr = sample_lr(bl, h, w, sx, sy, dx, dy + ddy)[y0:y1]
            c = np.corrcoef(edges(lr).ravel(), et[y0:y1].ravel())[0, 1]
            if bestb is None or c > bestb[0]: bestb = (c, ddy)
        centres.append((y0 + y1) / 2); shifts.append(bestb[1])
    shifts = ndimage.median_filter(np.array(shifts), 3, mode='nearest')
    dyr = dy + np.interp(np.arange(h), centres, shifts)
    c2 = np.corrcoef(edges(sample_lr(bl, h, w, sx, sy, dx, dyr)).ravel(), et.ravel())[0, 1]
    if c2 > corr: corr, dy = c2, dyr
    return dict(corr=corr, sx=sx, sy=sy, dx=dx, dy=dy)

def align_fit(lab, k, tile, sigma=0.5):
    """Colour-independent alignment: the position where 'same drawing, one colour per drawing colour' best explains
    the swatch (least-squares residual), searched coarse to fine."""
    h, w = tile.shape[:2]; H, W = lab.shape; T = tile.reshape(-1, 3)
    sx = W / w; sy0 = H / h
    def resid(sy, dx, dy):
        A = operator(lab, k, h, w, sx, sy, dx, dy, sigma, S=5).toarray()
        X = np.linalg.lstsq(A, T, rcond=None)[0]; return np.abs(A @ X - T).mean()
    best = min(((resid(sy0 * (1 + ey), dx, dy), sy0 * (1 + ey), dx, dy)
                for ey in (-0.015, 0, 0.015) for dy in np.arange(-3, 3.01, 0.5) for dx in np.arange(-1.5, 1.51, 0.25)))
    for step in (0.1, 0.04):
        e, sy, dx, dy = best
        best = min(((resid(sy * (1 + es), dx + ddx, dy + ddy), sy * (1 + es), dx + ddx, dy + ddy)
                    for es in (-step / 20, 0, step / 20) for ddy in (-2 * step, -step, 0, step, 2 * step) for ddx in (-step, 0, step)))
    return dict(resid=best[0], sx=sx, sy=best[1], dx=best[2], dy=best[3])

def operator(regions, n, h, w, sx, sy, dx, dy, sigma, S=7):
    """Sparse A (h*w x n): how much of each region one swatch pixel sees (box pixel + print blur, Gaussian sigma in swatch px)."""
    H, W = regions.shape
    off = (np.arange(S) + .5) / S * 2 - 1  # sample offsets across +-1 swatch pixel
    oy, ox = np.meshgrid(off, off, indexing='ij'); wgt = np.exp(-(oy ** 2 + ox ** 2) / (2 * sigma ** 2)); wgt /= wgt.sum()
    yy, xx = np.meshgrid(np.arange(h), np.arange(w), indexing='ij')
    dyr = np.broadcast_to(np.asarray(dy, float), (h,))[:, None]
    rows, cols, vals = [], [], []
    for (a, b), wv in np.ndenumerate(wgt):
        Y = np.clip(((yy + .5 + oy[a, b] + dyr) * sy).astype(int), 0, H - 1); X = (((xx + .5 + ox[a, b] + dx) * sx).astype(int)) % W
        rows.append((yy * w + xx).ravel()); cols.append(regions[Y, X].ravel()); vals.append(np.full(h * w, wv))
    return sparse.coo_matrix((np.concatenate(vals), (np.concatenate(rows), np.concatenate(cols))), shape=(h * w, n)).tocsr()

def recolour_by_vote(lab_map, k, tile, al, n_pal=6):
    """Each drawing colour of Red takes the swatch palette colour found most often well inside it (keeps contrast)."""
    h, w = tile.shape[:2]; H, W = lab_map.shape
    pal = kmeans(tile.reshape(-1, 3), n_pal, seed=2)
    pidx = ((tile.reshape(-1, 3)[:, None] - pal[None]) ** 2).sum(-1).argmin(1).reshape(h, w)
    r = max(1, int(0.6 * al['sx']))
    inner = np.zeros_like(lab_map, bool)
    for j in range(k): inner |= ndimage.binary_erosion(lab_map == j, iterations=r) & (lab_map == j)
    yy, xx = np.meshgrid(np.arange(h), np.arange(w), indexing='ij')
    Y = np.clip(((yy + .5 + al['dy']) * al['sy']).astype(int), 0, H - 1); X = (((xx + .5 + al['dx']) * al['sx']).astype(int)) % W
    lab_lr, ok = lab_map[Y, X], inner[Y, X]
    votes = np.zeros((k, n_pal)); np.add.at(votes, (lab_lr[ok], pidx[ok]), 1)
    colours = np.zeros((k, 3))
    for j in range(k):
        if votes[j].sum(): colours[j] = pal[votes[j].argmax()]
        else:  # never seen clearly: nearest palette colour to what the label's pixels average to
            m = lab_lr == j; c = tile[m].mean(0) if m.any() else pal.mean(0); colours[j] = pal[((pal - c) ** 2).sum(1).argmin()]
    return colours, pal

def keep_shapes_visible(regions, red_colour, X, pal):
    """If a shape stood out from its main neighbour in Red but got the same colour here, give it the lightest (or darkest)
    palette colour, matching whether it was lighter or darker than that neighbour in Red."""
    n = len(X); a = np.concatenate([regions[:, :-1].ravel(), regions[:-1].ravel()]); b = np.concatenate([regions[:, 1:].ravel(), regions[1:].ravel()])
    m = a != b; pairs = np.stack([np.concatenate([a[m], b[m]]), np.concatenate([b[m], a[m]])], 1)
    key, cnt = np.unique(pairs[:, 0].astype(np.int64) * n + pairs[:, 1], return_counts=True)
    r1, r2 = key // n, key % n
    order = np.lexsort((-cnt, r1)); first = np.ones(len(order), bool); first[1:] = r1[order][1:] != r1[order][:-1]
    nb = np.full(n, -1); nb[r1[order][first]] = r2[order][first]
    lum = lambda c: c @ np.array([0.299, 0.587, 0.114])
    X = X.copy(); size = np.bincount(regions.ravel(), minlength=n)
    for r in np.argsort(size):  # small shapes first; their big neighbours keep their colour
        q = nb[r]
        if q < 0 or np.linalg.norm(red_colour[r] - red_colour[q]) < 60 or np.linalg.norm(X[r] - X[q]) > 25: continue
        cands = pal[np.linalg.norm(pal - X[q], axis=1) > 25]
        if len(cands): X[r] = cands[lum(cands).argmax()] if lum(red_colour[r]) > lum(red_colour[q]) else cands[lum(cands).argmin()]
    return X

def solve(A, T, reg_label, centroids, lam=0.05):
    """Region colours X: min |A X - T|^2 + lam * c_r |X_r - prior_r|^2. Prior: what nearby, well-seen regions of the same
    red-drawing colour turned into (falls back to the label's overall colour)."""
    n = A.shape[1]; k = reg_label.max() + 1
    L = sparse.csr_matrix((np.ones(n), (np.arange(n), reg_label)), shape=(n, k))
    XL = np.linalg.lstsq((A @ L).toarray(), T, rcond=None)[0]  # one colour per label
    seen = np.asarray(A.multiply(A).sum(0)).ravel()            # how visible each region is
    def ridge(prior, strength):
        M = (A.T @ A + sparse.diags(strength)).tocsc(); B = A.T @ T + strength[:, None] * prior
        from scipy.sparse.linalg import splu
        lu = splu(M); return np.stack([lu.solve(B[:, c]) for c in range(3)], 1)
    base = lam * np.median(seen[seen > 0])
    X = ridge(XL[reg_label], np.full(n, base))
    conf = seen > np.percentile(seen, 60)
    prior = XL[reg_label].copy()
    for r in np.where(~conf)[0]:
        same = np.where(conf & (reg_label == reg_label[r]))[0]
        if len(same):
            d2 = ((centroids[same] - centroids[r]) ** 2).sum(1); wv = np.exp(-d2 / (2 * 60.0 ** 2)) * seen[same]
            if wv.sum() > 1e-3 * seen[same].max(): prior[r] = (wv[:, None] * X[same]).sum(0) / wv.sum()
    return ridge(prior, np.full(n, base)).clip(0, 255), XL

if __name__ == '__main__' and (len(sys.argv) <= 4 or sys.argv[4] != '--segment-only'):
    hr = np.asarray(Image.open(RED_HR).convert('RGB')).astype(float)
    regions, reg_label, reg_colour, info = segment(hr)
    n = regions.max() + 1
    flat_red = reg_colour[regions]
    Image.fromarray(flat_red.clip(0, 255).astype('uint8')).save(f'{OUT}/red.png')
    yy, xx = np.indices(regions.shape)
    cnt = np.bincount(regions.ravel(), minlength=n)
    centroids = np.stack([np.bincount(regions.ravel(), yy.ravel(), n) / cnt, np.bincount(regions.ravel(), xx.ravel(), n) / cnt], 1)
    lab_map = reg_label[regions]; k_lab = int(reg_label.max()) + 1
    report = {'regions': int(n), **info}
    for name in sys.argv[4:] or [b for b in BOXES if b != 'red']:
        tile = swatch_tile(name); h, w = tile.shape[:2]
        al = align_fit(lab_map, k_lab, tile)
        best = None
        for sigma in (0.25, 0.32, 0.4, 0.5, 0.6):
            A = operator(regions, n, h, w, al['sx'], al['sy'], al['dx'], al['dy'], sigma)
            X, XL = solve(A, tile.reshape(-1, 3), reg_label, centroids)
            err = np.abs(A @ X - tile.reshape(-1, 3)).mean()
            if best is None or err < best[0]: best = (err, sigma, X)
        err, sigma, X = best
        mode = 'by region'
        if err > 9:  # this colourway's own drawing differs from Red's (e.g. Natural): recolour Red's drawing consistently,
            A = operator(regions, n, h, w, al['sx'], al['sy'], al['dx'], al['dy'], sigma)  # one colour per drawing colour,
            colours, pal = recolour_by_vote(lab_map, k_lab, tile, al)                     # instead of chasing shapes Red lacks
            X = keep_shapes_visible(regions, reg_colour, colours[reg_label], pal)
            mode = 'by drawing colour'
            err = np.abs(A @ X - tile.reshape(-1, 3)).mean()
        Image.fromarray(X[regions].clip(0, 255).astype('uint8')).save(f'{OUT}/{name}.png')
        report[name] = dict(align_resid=round(float(al['resid']), 2), sy=round(float(al['sy']), 3), dx=round(float(al['dx']), 2), dy=round(float(al['dy']), 2), blur=sigma, mean_error=round(float(err), 1), colour_mode=mode)
        print(name, report[name], flush=True)
    json.dump(report, open(f'{OUT}/report.json', 'w'), indent=1)
