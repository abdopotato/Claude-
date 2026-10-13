/* 3D carpet roll for the product page. Loaded only when a buyer taps "View the roll in 3D" (needs THREE r128).
   MCCRoll3D.mount(el, {texture, aspect, spacing, length}) -> {setPattern(url, aspect), setSpacing(m), setA(m), toggle(), destroy()}
   One roll = one prayer row: width = row spacing, the pattern repeats one prayer space at a time along the length.
   The roll is an Archimedean spiral (one thickness per turn) on a cardboard core, pile facing in, as rolls ship. */
(function () {
  var CORE_R = 0.05, FACE = 0.9, T = 0.010, PW = 512, PH = 1024, PITCH = 4;
  var reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function hash(i, j) { var h = (i * 374761393 + j * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }

  // Cut-pile look: each ~3 mm tuft takes the pattern colour at its centre and is shaded as a small dome,
  // with fibre grain and faint tileable mottling. Shared by every colourway.
  var pile = null;
  function makePile(THREE) {
    if (pile) return pile;
    var shade = new Float32Array(PW * PH), knot = new Int32Array(PW * PH), c = document.createElement('canvas');
    c.width = PW; c.height = PH;
    var g = c.getContext('2d'), d = g.createImageData(PW, PH);
    for (var y = 0; y < PH; y++) {
      var j = Math.floor(y / PITCH), off = (j % 2) * PITCH / 2, cy = j * PITCH + PITCH / 2;
      for (var x = 0; x < PW; x++) {
        var i = Math.floor((x + off) / PITCH), cx = ((i * PITCH - off + PITCH / 2) % PW + PW) % PW;
        var dx = Math.abs(x + 0.5 - cx); dx = Math.min(dx, PW - dx);
        var dy = y + 0.5 - cy, dome = Math.max(0, 1 - (dx * dx + dy * dy) / Math.pow(PITCH * 0.62, 2));
        var fibre = Math.random(), tuft = hash(i % (PW / PITCH), j);
        var mottle = 0.03 * Math.sin(6.2832 * (2 * x / PW + y / PH)) + 0.025 * Math.sin(6.2832 * (3 * x / PW - 2 * y / PH) + 1.3);
        var k = y * PW + x;
        shade[k] = 0.74 + 0.24 * dome + 0.07 * (tuft - 0.5) + 0.06 * (fibre - 0.5) + mottle;
        knot[k] = Math.min(PH - 1, cy) * PW + Math.floor(cx);
        var h = Math.round(255 * (0.15 + 0.7 * dome + 0.15 * fibre));
        d.data[k * 4] = d.data[k * 4 + 1] = d.data[k * 4 + 2] = h; d.data[k * 4 + 3] = 255;
      }
    }
    g.putImageData(d, 0, 0);
    var bump = new THREE.CanvasTexture(c); bump.wrapS = bump.wrapT = THREE.RepeatWrapping;
    return (pile = { shade: shade, knot: knot, bump: bump });
  }

  function mount(host, opts) {
    var THREE = window.THREE;
    var S = { spacing: opts.spacing || 0.95, L: opts.length || 10, a: (opts.length || 10) * 0.45, aspect: opts.aspect || 0.37 };
    var renderer = new THREE.WebGLRenderer({ antialias: true });
    var maxAniso = renderer.capabilities.getMaxAnisotropy();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    host.appendChild(renderer.domElement);

    var scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(35, 1, 0.02, 200), dirty = true, alive = true;
    var cs = getComputedStyle(host);
    scene.background = new THREE.Color(cs.getPropertyValue('--plaster-dim').trim() || '#EAE2CF').convertSRGBToLinear();
    scene.add(new THREE.HemisphereLight(0xfff8ec, 0x6b5f48, 0.75));
    var sun = new THREE.DirectionalLight(0xffffff, 0.85);
    sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004;
    scene.add(sun, sun.target);
    var floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ roughness: 1 }));
    floor.material.color.set(cs.getPropertyValue('--line').trim() || '#DCD3BC').convertSRGBToLinear().multiplyScalar(0.62);
    floor.rotation.x = -Math.PI / 2; floor.position.y = -0.0005; floor.receiveShadow = true; scene.add(floor);

    var P = makePile(THREE);
    var jc = document.createElement('canvas'); jc.width = jc.height = 64;
    var jg = jc.getContext('2d'); jg.fillStyle = '#b9a47c'; jg.fillRect(0, 0, 64, 64);
    for (var q = 0; q < 64; q += 4) { jg.fillStyle = q % 8 ? '#a8926a' : '#c7b38c'; jg.fillRect(q, 0, 2, 64); jg.fillStyle = q % 8 ? '#cdb991' : '#9d885f'; jg.fillRect(0, q, 64, 2); }
    var jute = new THREE.CanvasTexture(jc); jute.wrapS = jute.wrapT = THREE.RepeatWrapping; jute.encoding = THREE.sRGBEncoding;

    var faceMat = new THREE.MeshPhysicalMaterial({ roughness: 0.95, metalness: 0, bumpMap: P.bump, bumpScale: 0.35, side: THREE.DoubleSide });
    faceMat.sheen = new THREE.Color(0.22, 0.21, 0.19);
    var edgeMat = new THREE.MeshStandardMaterial({ roughness: 1, side: THREE.DoubleSide });
    var backMat = new THREE.MeshStandardMaterial({ map: jute, roughness: 1, side: THREE.DoubleSide });
    var coreMat = new THREE.MeshStandardMaterial({ color: 0x9c7a4f, roughness: 0.85, side: THREE.DoubleSide });

    function setPattern(url, aspect) {
      if (aspect) S.aspect = aspect;
      var c = document.createElement('canvas'); c.width = PW; c.height = PH;
      var t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = maxAniso; t.encoding = THREE.sRGBEncoding;
      var img = new Image(); img.crossOrigin = 'anonymous';
      img.onload = function () {
        var g = c.getContext('2d'); g.drawImage(img, 0, 0, PW, PH);
        try {
          var src = g.getImageData(0, 0, PW, PH), out = g.createImageData(PW, PH);
          for (var k = 0; k < PW * PH; k++) {
            var s = P.shade[k], o = k * 4, n = P.knot[k] * 4;
            out.data[o] = src.data[n] * s; out.data[o + 1] = src.data[n + 1] * s; out.data[o + 2] = src.data[n + 2] * s; out.data[o + 3] = 255;
          }
          g.putImageData(out, 0, 0);
        } catch (e) { /* image not readable (CORS): keep the plain pattern */ }
        t.needsUpdate = true; dirty = true;
      };
      img.onerror = function () { if (img.crossOrigin) { img.removeAttribute('crossorigin'); img.src = url; } }; // retry without CORS
      img.src = url;
      if (faceMat.map) faceMat.map.dispose();
      faceMat.map = edgeMat.map = t; faceMat.needsUpdate = edgeMat.needsUpdate = true;
      if (faceMesh) build();
    }

    var group = new THREE.Group(); scene.add(group);
    var faceMesh, backMesh, edgeMesh, coreMesh, N, fx, fy, bx, by;
    var view = { az: 0.62, el: 0.36, dist: 6, tx: 0, ty: 0.2, tz: 0 };

    function strip(n) { var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3)); return g; }
    function index(g, per, pairs) {
      var idx = [];
      for (var i = 0; i < N; i++) for (var p = 0; p < pairs.length; p++) {
        var a = i * per + pairs[p][0], b = i * per + pairs[p][1], c = a + per, d = b + per;
        idx.push(a, c, b, b, c, d);
      }
      g.setIndex(idx);
    }
    function build() {
      [faceMesh, backMesh, edgeMesh, coreMesh].forEach(function (m) { if (m) { group.remove(m); m.geometry.dispose(); } });
      N = Math.max(240, Math.round(S.L * 140));
      fx = new Float32Array(N + 1); fy = new Float32Array(N + 1); bx = new Float32Array(N + 1); by = new Float32Array(N + 1);
      var W = S.spacing, archW = S.spacing * S.aspect;
      var fg = strip((N + 1) * 2), bg = strip((N + 1) * 2), eg = strip((N + 1) * 4);
      var fuv = new Float32Array((N + 1) * 4), buv = new Float32Array((N + 1) * 4), euv = new Float32Array((N + 1) * 8);
      for (var i = 0; i <= N; i++) {
        var u = (i / N * S.L) / archW, ju = (i / N * S.L) * 18;
        fuv.set([u, 0, u, 1], i * 4);
        buv.set([ju, 0, ju, W * 18], i * 4);
        euv.set([u, 0.012, u, 0.012, u, 0.988, u, 0.988], i * 8);
      }
      fg.setAttribute('uv', new THREE.BufferAttribute(fuv, 2)); bg.setAttribute('uv', new THREE.BufferAttribute(buv, 2)); eg.setAttribute('uv', new THREE.BufferAttribute(euv, 2));
      index(fg, 2, [[0, 1]]); index(bg, 2, [[1, 0]]); index(eg, 4, [[0, 1], [3, 2]]);
      faceMesh = new THREE.Mesh(fg, faceMat); backMesh = new THREE.Mesh(bg, backMat); edgeMesh = new THREE.Mesh(eg, edgeMat);
      coreMesh = new THREE.Mesh(new THREE.CylinderGeometry(CORE_R, CORE_R, W + 0.08, 40, 1, true), coreMat);
      coreMesh.rotation.x = Math.PI / 2; coreMesh.position.z = W / 2;
      [faceMesh, backMesh, edgeMesh, coreMesh].forEach(function (m) { m.castShadow = m.receiveShadow = true; group.add(m); });
      group.position.set(-S.L / 2, 0, -W / 2);
      var k = Math.max(S.L, W) * 0.75;
      sun.shadow.camera.left = -k; sun.shadow.camera.right = k; sun.shadow.camera.top = k; sun.shadow.camera.bottom = -k;
      sun.shadow.camera.near = 0.5; sun.shadow.camera.far = k * 6; sun.shadow.camera.updateProjectionMatrix();
      sun.position.set(-S.L * 0.3, k * 2.2, k * 1.4);
      pose();
    }
    // Flat on the floor up to `a`, then wound back onto the core.
    function pose() {
      var L = S.L, a = Math.min(Math.max(S.a, 0), L), ft = T * FACE;
      var R = Math.sqrt(CORE_R * CORE_R + (L - a) * T / Math.PI), k = Math.PI * 2 / T;
      for (var i = 0; i <= N; i++) {
        var s = i / N * L;
        if (s <= a) { bx[i] = s; by[i] = 0; fx[i] = s; fy[i] = ft; continue; }
        var th = (R - Math.sqrt(Math.max(0, R * R - T * (s - a) / Math.PI))) * k, r = R - th / k, rf = r - ft, sn = Math.sin(th), co = Math.cos(th);
        bx[i] = a + r * sn; by[i] = R - r * co; fx[i] = a + rf * sn; fy[i] = R - rf * co;
      }
      var W = S.spacing, fp = faceMesh.geometry.attributes.position.array, bp = backMesh.geometry.attributes.position.array, ep = edgeMesh.geometry.attributes.position.array;
      for (i = 0; i <= N; i++) {
        fp.set([fx[i], fy[i], 0, fx[i], fy[i], W], i * 6);
        bp.set([bx[i], by[i], 0, bx[i], by[i], W], i * 6);
        ep.set([bx[i], by[i], 0, fx[i], fy[i], 0, bx[i], by[i], W, fx[i], fy[i], W], i * 12);
      }
      [faceMesh, backMesh, edgeMesh].forEach(function (m) { m.geometry.attributes.position.needsUpdate = true; m.geometry.computeVertexNormals(); m.geometry.computeBoundingSphere(); });
      coreMesh.position.x = a; coreMesh.position.y = R; coreMesh.visible = a < L - 0.01;
      view.tx = group.position.x + (a + 2 * R) / 2;
      S.R = R; dirty = true; autoFit();
      if (opts.onChange) opts.onChange(a / L);
    }
    // Frame what is on the floor (flat part + roll) until the buyer zooms by hand.
    var zoomed = false, corner = new THREE.Vector3();
    function autoFit() {
      if (zoomed || !camera.aspect) return;
      var x0 = group.position.x, x1 = x0 + S.a + 2 * S.R, W = S.spacing / 2, lo = 1.2, hi = 60;
      for (var it = 0; it < 22; it++) {
        view.dist = (lo + hi) / 2; place(); camera.updateMatrixWorld();
        var fits = true;
        for (var c = 0; c < 8 && fits; c++) {
          corner.set(c & 1 ? x1 : x0, c & 2 ? 2 * S.R : 0, c & 4 ? W : -W).project(camera);
          if (Math.abs(corner.x) > 0.86 || Math.abs(corner.y) > 0.8 || corner.z > 1) fits = false;
        }
        if (fits) hi = view.dist; else lo = view.dist;
      }
      view.dist = hi; dirty = true;
    }
    function fit() { zoomed = false; autoFit(); }
    function place() {
      var ce = Math.cos(view.el);
      camera.position.set(view.tx + view.dist * ce * Math.sin(view.az), view.ty + view.dist * Math.sin(view.el), view.tz + view.dist * ce * Math.cos(view.az));
      camera.lookAt(view.tx, view.ty, view.tz);
    }
    function resize() { var r = host.getBoundingClientRect(); renderer.setSize(r.width, r.height, false); camera.aspect = r.width / Math.max(1, r.height); camera.updateProjectionMatrix(); autoFit(); dirty = true; }
    var ro = new ResizeObserver(resize); ro.observe(host);

    // Drag the roll to unroll it; drag elsewhere to turn; wheel or pinch to zoom; arrow keys turn.
    var ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit = new THREE.Vector3();
    var pts = new Map(), mode = null, grab = 0, pinch0 = 0, dist0 = 0, anim = null;
    function toNdc(e) { var r = host.getBoundingClientRect(); ndc.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1); ray.setFromCamera(ndc, camera); }
    function floorX(e) { toNdc(e); return ray.ray.intersectPlane(plane, hit) ? hit.x - group.position.x : null; }
    function onRoll(e) { toNdc(e); var h = ray.intersectObjects([faceMesh, backMesh, edgeMesh, coreMesh])[0]; return h && (h.point.x - group.position.x) > S.a - 0.15; }
    function clampDist(d) { return Math.min(Math.max(d, 1.2), 40); }
    function orbit(dAz, dEl) { view.az += dAz; view.el = Math.min(1.45, Math.max(0.06, view.el + dEl)); dirty = true; }
    function setA(a) { S.a = Math.min(Math.max(a, 0), S.L); pose(); }
    var on = function (t, f, o) { host.addEventListener(t, f, o); };
    on('pointerdown', function (e) {
      host.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); anim = null;
      if (pts.size === 2) { var v = Array.from(pts.values()); pinch0 = Math.hypot(v[0].x - v[1].x, v[0].y - v[1].y); dist0 = view.dist; mode = 'pinch'; return; }
      if (onRoll(e)) { var x = floorX(e); grab = x == null ? 0 : S.a - x; mode = 'unroll'; host.style.cursor = 'grabbing'; } else mode = 'orbit';
    });
    on('pointermove', function (e) {
      var prev = pts.get(e.pointerId);
      if (!prev) { if (e.pointerType === 'mouse') host.style.cursor = onRoll(e) ? 'grab' : 'move'; return; }
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (mode === 'pinch' && pts.size === 2) { var v = Array.from(pts.values()); view.dist = clampDist(dist0 * pinch0 / Math.max(1, Math.hypot(v[0].x - v[1].x, v[0].y - v[1].y))); zoomed = dirty = true; }
      else if (mode === 'orbit') orbit((e.clientX - prev.x) * -0.006, (e.clientY - prev.y) * 0.005);
      else if (mode === 'unroll') { var x = floorX(e); if (x != null) setA(x + grab); }
    });
    function end(e) { pts.delete(e.pointerId); if (!pts.size) { mode = null; host.style.cursor = ''; } else if (mode === 'pinch') mode = null; }
    on('pointerup', end); on('pointercancel', end);
    on('wheel', function (e) { e.preventDefault(); view.dist = clampDist(view.dist * Math.exp(e.deltaY * 0.0012)); zoomed = dirty = true; }, { passive: false });
    on('dblclick', function () { view.az = 0.62; view.el = 0.36; fit(); });
    on('keydown', function (e) {
      var k = { ArrowLeft: [0.12, 0], ArrowRight: [-0.12, 0], ArrowUp: [0, 0.08], ArrowDown: [0, -0.08] }[e.key];
      if (k) { e.preventDefault(); orbit(k[0], k[1]); }
      if (e.key === '+' || e.key === '=') { view.dist = clampDist(view.dist * 0.9); zoomed = dirty = true; }
      if (e.key === '-') { view.dist = clampDist(view.dist * 1.1); zoomed = dirty = true; }
    });

    function loop(now) {
      if (!alive) return;
      if (anim) {
        var k = Math.min(1, (now - anim.t0) / anim.dur), ez = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        setA(anim.from + (anim.to - anim.from) * ez); if (k >= 1) anim = null;
      }
      if (dirty) { place(); renderer.render(scene, camera); dirty = false; }
      requestAnimationFrame(loop);
    }
    setPattern(opts.texture, opts.aspect); build(); resize(); fit(); requestAnimationFrame(loop);

    return {
      setPattern: setPattern,
      setSpacing: function (m) { if (m && m !== S.spacing) { S.spacing = m; build(); fit(); } },
      setFraction: function (f) { anim = null; setA(f * S.L); },
      toggle: function () {
        var to = S.a < S.L * 0.98 ? S.L : 0;
        if (reduceMotion) setA(to); else anim = { from: S.a, to: to, t0: performance.now(), dur: 600 };
      },
      destroy: function () { alive = false; ro.disconnect(); renderer.dispose(); host.removeChild(renderer.domElement); }
    };
  }
  window.MCCRoll3D = { mount: mount };
})();
