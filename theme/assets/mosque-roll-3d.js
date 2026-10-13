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


  // ---- Masjid setting: qibla wall with mihrab, arched lattice windows, tile dado, marble floor, lanterns. ----
  // Everything is painted on canvases at mount, so nothing extra downloads.
  function arch(g, x0, x1, base, spring, apex) { // pointed (two-centred) arch outline
    var xc = (x0 + x1) / 2, k = (spring - apex) * 0.55;
    g.beginPath(); g.moveTo(x0, base); g.lineTo(x0, spring);
    g.bezierCurveTo(x0, spring - k, xc - (x1 - x0) * 0.12, apex + (spring - apex) * 0.25, xc, apex);
    g.bezierCurveTo(xc + (x1 - x0) * 0.12, apex + (spring - apex) * 0.25, x1, spring - k, x1, spring);
    g.lineTo(x1, base); g.closePath();
  }
  function star(g, cx, cy, r) { // 8-point star from two squares
    g.beginPath();
    for (var i = 0; i < 16; i++) { var a = i * Math.PI / 8, rr = i % 2 ? r * 0.62 : r; g.lineTo(cx + rr * Math.cos(a), cy + rr * Math.sin(a)); }
    g.closePath();
  }
  function canvasTexture(THREE, w, h, paint, aniso) {
    var c = document.createElement('canvas'); c.width = w; c.height = h; paint(c.getContext('2d'), w, h);
    var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = aniso; return t;
  }
  var GOLD = '#C69A3E', TILE = '#1E5A61', TILE2 = '#2F8A8A', IVORY = '#F4ECDC', PLASTER = '#EDE3CE';
  function buildMasjid(THREE, scene, aniso) {
    var WALL_W = 40, WALL_H = 7.5, PX = 100; // canvas pixels per metre
    var wallTex = canvasTexture(THREE, WALL_W * PX, WALL_H * PX, function (g, w, h) {
      var y = function (m) { return h - m * PX; }, x = function (m) { return w / 2 + m * PX; };
      var grd = g.createLinearGradient(0, 0, 0, h); grd.addColorStop(0, '#F6EFDF'); grd.addColorStop(1, PLASTER);
      g.fillStyle = grd; g.fillRect(0, 0, w, h);
      // tile dado, 0-1.1 m: teal ground, ivory 8-point stars, turquoise centres
      g.fillStyle = TILE; g.fillRect(0, y(1.1), w, 1.1 * PX);
      for (var cx = 15; cx < w; cx += 30) for (var cy = y(1.1) + 15; cy < h; cy += 30) {
        g.fillStyle = IVORY; star(g, cx, cy, 12); g.fill();
        g.fillStyle = TILE2; g.beginPath(); g.arc(cx, cy, 4, 0, 6.3); g.fill();
      }
      g.fillStyle = GOLD; g.fillRect(0, y(1.16), w, 6); g.fillRect(0, y(1.32), w, 3);
      // running band of small arches near the ceiling
      g.fillStyle = '#E2D3B2'; g.fillRect(0, y(7.1), w, 0.5 * PX);
      g.strokeStyle = GOLD; g.lineWidth = 3;
      for (var bx = 0; bx < w; bx += 40) { arch(g, bx + 6, bx + 34, y(6.65), y(6.85), y(7.05)); g.stroke(); }
      // arched lattice windows every 3 m, leaving the middle for the mihrab
      for (var m = -18; m <= 18; m += 3) {
        if (Math.abs(m) < 2.5) continue;
        var x0 = x(m - 0.55), x1 = x(m + 0.55);
        arch(g, x0 - 10, x1 + 10, y(2.1), y(4.0), y(4.95)); g.fillStyle = '#E4D2AA'; g.fill();
        arch(g, x0, x1, y(2.2), y(4.0), y(4.85));
        var lg = g.createLinearGradient(0, y(4.85), 0, y(2.2)); lg.addColorStop(0, '#FFF8E6'); lg.addColorStop(1, '#F1DDAD');
        g.fillStyle = lg; g.fill();
        g.save(); g.clip(); g.strokeStyle = 'rgba(110,80,40,.55)'; g.lineWidth = 2; // mashrabiya lattice
        for (var d = -300; d < 300; d += 14) { g.beginPath(); g.moveTo(x0 + d, y(2.2)); g.lineTo(x0 + d + 260, y(4.85)); g.moveTo(x1 - d, y(2.2)); g.lineTo(x1 - d - 260, y(4.85)); g.stroke(); }
        g.restore();
        arch(g, x0, x1, y(2.2), y(4.0), y(4.85)); g.strokeStyle = GOLD; g.lineWidth = 5; g.stroke();
      }
      // mihrab: tiled frame, gold border, deep shaded niche, columns, hood bands
      var mx0 = x(-1.25), mx1 = x(1.25);
      g.fillStyle = TILE; g.fillRect(mx0, y(5.6), mx1 - mx0, 5.6 * PX - 0);
      for (var sx = mx0 + 15; sx < mx1; sx += 30) for (var sy = y(5.6) + 15; sy < y(0); sy += 30) { g.fillStyle = IVORY; star(g, sx, sy, 11); g.fill(); }
      g.strokeStyle = GOLD; g.lineWidth = 10; g.strokeRect(mx0 + 5, y(5.6) + 5, mx1 - mx0 - 10, 5.6 * PX - 10);
      arch(g, x(-0.95), x(0.95), y(0), y(3.3), y(5.05)); g.fillStyle = IVORY; g.fill();
      arch(g, x(-0.8), x(0.8), y(0), y(3.25), y(4.8));
      var ng = g.createRadialGradient(x(0), y(1.6), 10, x(0), y(2.2), 260); ng.addColorStop(0, '#C9B48A'); ng.addColorStop(1, '#6E5A3A');
      g.fillStyle = ng; g.fill();
      g.save(); g.clip(); g.strokeStyle = 'rgba(255,240,205,.35)'; g.lineWidth = 3; // fluted hood
      for (var r = 0; r < 9; r++) { g.beginPath(); g.moveTo(x(0), y(3.3)); g.lineTo(x(-0.8 + r * 0.2), y(4.9)); g.stroke(); }
      for (var bnd = 0; bnd < 3; bnd++) { g.fillStyle = bnd % 2 ? '#B9893A' : GOLD; g.fillRect(x(-0.8), y(3.3 - bnd * 0.08), 1.6 * PX, 6); }
      g.restore();
      arch(g, x(-0.8), x(0.8), y(0), y(3.25), y(4.8)); g.strokeStyle = GOLD; g.lineWidth = 8; g.stroke();
      g.fillStyle = '#D9C49A'; g.fillRect(x(-0.93), y(3.25), 0.13 * PX, 3.25 * PX); g.fillRect(x(0.8), y(3.25), 0.13 * PX, 3.25 * PX);
      g.fillStyle = GOLD; g.fillRect(x(-0.96), y(3.3), 0.19 * PX, 10); g.fillRect(x(0.77), y(3.3), 0.19 * PX, 10);
    }, aniso);
    var wall = new THREE.Mesh(new THREE.PlaneGeometry(WALL_W, WALL_H), new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.9 }));
    wall.position.y = WALL_H / 2; scene.add(wall); // FrontSide only: from behind it disappears instead of blocking the view
    // marble floor, 1 m tiles with soft veins
    var floorTex = canvasTexture(THREE, 512, 512, function (g, w, h) {
      g.fillStyle = '#E9E2D3'; g.fillRect(0, 0, w, h);
      var rnd = function (s) { var v = Math.sin(s * 127.1) * 43758.5453; return v - Math.floor(v); };
      for (var tY = 0; tY < 2; tY++) for (var tX = 0; tX < 2; tX++) {
        g.fillStyle = (tX + tY) % 2 ? 'rgba(255,255,255,.08)' : 'rgba(150,130,100,.05)'; g.fillRect(tX * 256, tY * 256, 256, 256);
        for (var v = 0; v < 5; v++) {
          var sd = tX * 31 + tY * 17 + v * 7; g.strokeStyle = 'rgba(140,125,100,' + (0.08 + rnd(sd) * 0.1) + ')'; g.lineWidth = 1 + rnd(sd + 1) * 2;
          g.beginPath(); g.moveTo(tX * 256 + rnd(sd + 2) * 256, tY * 256);
          g.bezierCurveTo(tX * 256 + rnd(sd + 3) * 256, tY * 256 + 90, tX * 256 + rnd(sd + 4) * 256, tY * 256 + 170, tX * 256 + rnd(sd + 5) * 256, tY * 256 + 256); g.stroke();
        }
      }
      g.strokeStyle = 'rgba(120,105,80,.35)'; g.lineWidth = 2;
      for (var i = 0; i <= 512; i += 256) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, h); g.moveTo(0, i); g.lineTo(w, i); g.stroke(); }
    }, aniso);
    floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping; floorTex.repeat.set(60, 60);
    // brass lanterns either side of the mihrab
    var brass = new THREE.MeshStandardMaterial({ color: 0xB8892F, metalness: 0.8, roughness: 0.35 });
    var glow = new THREE.MeshStandardMaterial({ color: 0xFFE7B0, emissive: 0xFFC765, emissiveIntensity: 0.9 });
    var lanterns = new THREE.Group();
    [-1.9, 1.9].forEach(function (lx) {
      var l = new THREE.Group();
      var body = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.12, 0.38, 8, 1, true), glow);
      var cap = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.22, 8), brass); cap.position.y = 0.3;
      var base = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.16, 8), brass); base.rotation.x = Math.PI; base.position.y = -0.27;
      var chain = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 3.6, 4), brass); chain.position.y = 0.41 + 1.8;
      l.add(body, cap, base, chain); l.position.set(lx, 3.4, 0); lanterns.add(l);
    });
    scene.add(lanterns);
    return { wall: wall, lanterns: lanterns, floorTex: floorTex,
      place: function (zFront) { wall.position.z = zFront - 1.6; lanterns.position.z = zFront - 0.9; } };
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
    var bgCol = new THREE.Color(cs.getPropertyValue('--plaster-dim').trim() || '#EAE2CF').convertSRGBToLinear();
    scene.background = bgCol; scene.fog = new THREE.Fog(bgCol, 16, 42); // far floor and wall ends fade into the hall
    scene.add(new THREE.HemisphereLight(0xfff8ec, 0x6b5f48, 0.75));
    var sun = new THREE.DirectionalLight(0xffffff, 0.85);
    sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004;
    scene.add(sun, sun.target);
    var masjid = buildMasjid(THREE, scene, maxAniso);
    var floor = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), new THREE.MeshStandardMaterial({ map: masjid.floorTex, roughness: 0.55 }));
    floor.material.color.setScalar(0.72); // keep the floor quieter than the carpet
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
        fuv.set([u, 1, u, 0], i * 4); // arch tips at the back edge, pointing at the mihrab
        buv.set([ju, 0, ju, W * 18], i * 4);
        euv.set([u, 0.988, u, 0.988, u, 0.012, u, 0.012], i * 8);
      }
      fg.setAttribute('uv', new THREE.BufferAttribute(fuv, 2)); bg.setAttribute('uv', new THREE.BufferAttribute(buv, 2)); eg.setAttribute('uv', new THREE.BufferAttribute(euv, 2));
      index(fg, 2, [[0, 1]]); index(bg, 2, [[1, 0]]); index(eg, 4, [[0, 1], [3, 2]]);
      faceMesh = new THREE.Mesh(fg, faceMat); backMesh = new THREE.Mesh(bg, backMat); edgeMesh = new THREE.Mesh(eg, edgeMat);
      coreMesh = new THREE.Mesh(new THREE.CylinderGeometry(CORE_R, CORE_R, W + 0.08, 40, 1, true), coreMat);
      coreMesh.rotation.x = Math.PI / 2; coreMesh.position.z = W / 2;
      [faceMesh, backMesh, edgeMesh, coreMesh].forEach(function (m) { m.castShadow = m.receiveShadow = true; group.add(m); });
      group.position.set(-S.L / 2, 0, -W / 2); masjid.place(-W / 2);
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
