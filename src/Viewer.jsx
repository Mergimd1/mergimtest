import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { doorSize, drawerFrontSize } from './engine';

const S = 0.001; // mm -> m
const LOOKS = {
  studio: { bg: 0xeeeeea, edge: 0x6b6b66, floor: 0xe9e8e3 },
  light: { bg: 0xf7f6f3, edge: 0x4a4a46, floor: 0xf2f1ee },
  dark: { bg: 0x16181b, edge: 0x9fb3c0, floor: 0x1d2024 },
};

function mk(group, w, h, d, x, y, z, color, opts = {}) {
  const geo = new THREE.BoxGeometry(w * S, h * S, d * S);
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0, transparent: !!opts.opacity, opacity: opts.opacity ?? 1 });
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x * S, y * S, z * S);
  m.castShadow = true;
  m.receiveShadow = true;
  const e = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: opts.edge ?? 0x6b6b66, transparent: true, opacity: 0.55 }));
  m.add(e);
  m.userData.dir = opts.dir || [0, 0, 0];
  group.add(m);
  return m;
}

function buildCabinet(c, C, colors, look, open) {
  const g = new THREE.Group();
  const t = C.t;
  const y0 = c.kind === 'wall' ? C.wallBottom : 0;
  const legs = c.kind === 'wall' ? 0 : c.legs;
  const yb = y0 + legs;
  const carc = colors.carcass;
  const E = { edge: look.edge };

  // sides
  mk(g, t, c.h, c.d, t / 2, yb + c.h / 2, -c.d / 2, carc, { ...E, dir: [-1, 0, 0] });
  mk(g, t, c.h, c.d, c.w - t / 2, yb + c.h / 2, -c.d / 2, carc, { ...E, dir: [1, 0, 0] });
  // bottom + rails / top
  mk(g, c.w - 2 * t, t, c.d - C.bottomSetback, c.w / 2, yb + t / 2, -(c.d - C.bottomSetback) / 2 - 2, carc, { ...E, dir: [0, -0.5, 0] });
  if (c.kind === 'base') {
    mk(g, c.w - 2 * t, t, C.railDepth, c.w / 2, yb + c.h - t / 2, -C.railDepth / 2, carc, { ...E, dir: [0, 1, 0] });
    mk(g, c.w - 2 * t, t, C.railDepth, c.w / 2, yb + c.h - t / 2, -c.d + C.railDepth / 2, carc, { ...E, dir: [0, 1, 0] });
  } else {
    mk(g, c.w - 2 * t, t, c.d - C.bottomSetback, c.w / 2, yb + c.h - t / 2, -(c.d - C.bottomSetback) / 2 - 2, carc, { ...E, dir: [0, 1, 0] });
  }
  if (c.back) mk(g, c.w - C.backGap, c.h, C.backT, c.w / 2, yb + c.h / 2, -c.d + C.backT / 2 + 2, colors.back, { ...E, dir: [0, 0, -1] });
  for (let i = 0; i < c.shelves; i++) {
    const y = yb + t + ((c.h - 2 * t) * (i + 1)) / (c.shelves + 1);
    mk(g, c.w - 2 * t - 2, t, c.d - C.shelfSetback, c.w / 2, y, -(c.d - C.shelfSetback) / 2 - 8, carc, { ...E, dir: [0, 0.5, 0] });
  }
  // plinth and legs
  if (legs > 0) {
    mk(g, c.w, legs - 6, t, c.w / 2, y0 + legs / 2, -60, colors.plinth, { ...E, dir: [0, -1, 0.6] });
    const n = c.w <= 800 ? 4 : c.w <= 1200 ? 5 : 6;
    const pts = [[30, -50], [c.w - 30, -50], [30, -c.d + 60], [c.w - 30, -c.d + 60]];
    if (n >= 5) pts.push([c.w / 2, -c.d / 2]);
    if (n >= 6) pts.push([c.w / 3, -c.d / 2], [(2 * c.w) / 3, -c.d / 2]);
    pts.slice(0, n).forEach(([x, z]) => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(15 * S, 15 * S, legs * S, 12), new THREE.MeshStandardMaterial({ color: 0x1b1d20, roughness: 0.6 }));
      m.position.set(x * S, (y0 + legs / 2) * S, z * S);
      m.castShadow = true;
      m.userData.dir = [0, -1, 0];
      g.add(m);
    });
  }
  // appliances
  if (c.appliance === 'oven' || c.appliance === 'dishwasher' || c.appliance === 'fridge') {
    const ah = c.appliance === 'fridge' ? c.h - 120 : 590;
    const ay = c.appliance === 'oven' ? yb + c.h - ah - 20 : yb + ah / 2 + 20;
    mk(g, c.w - 2 * t - 8, ah, 20, c.w / 2, c.appliance === 'oven' ? ay + ah / 2 : ay, 10, 0x2a2d31, { ...E, dir: [0, 0, 1] });
  }
  // fronts
  const mkDoor = (dw, dh, hingeX, side, yc) => {
    const piv = new THREE.Group();
    piv.position.set(hingeX * S, yc * S, (t / 2) * S);
    const m = mk(piv, dw, dh, t, (side === 'L' ? dw / 2 : -dw / 2), 0, 0, colors.door, { ...E });
    piv.userData.dir = [0, 0, 1];
    piv.userData.door = side === 'L' ? 1 : -1;
    piv.rotation.y = open ? piv.userData.door * -1.75 : 0;
    g.add(piv);
    if (c.handle === 'handle') {
      const knob = new THREE.Mesh(new THREE.SphereGeometry(14 * S, 14, 10), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4 }));
      const kx = side === 'L' ? dw - 40 : -(dw - 40);
      const topKnob = c.kind === 'base';
      knob.position.set(kx * S, (topKnob ? dh / 2 - 60 : 0) * S, (t / 2 + 12) * S);
      piv.add(knob);
    }
    return m;
  };
  const gap = C.doorGap;
  if (c.front === 'doors' || c.front === 'both') {
    const ds = doorSize(c, C);
    const dh = c.front === 'both' ? Math.round(ds.h * 0.6) : ds.h;
    const yc = c.front === 'both' ? yb + c.h - dh / 2 - gap : yb + ds.h / 2 + gap / 2;
    if (ds.n === 1) mkDoor(ds.w, dh, gap, 'L', yc);
    else {
      mkDoor(ds.w, dh, gap, 'L', yc);
      mkDoor(ds.w, dh, c.w - gap, 'R', yc);
    }
  }
  if (c.front === 'drawers' || c.front === 'both') {
    const dr = drawerFrontSize(c, C);
    const startY = c.front === 'both' ? yb + gap : yb + gap;
    const area = c.front === 'both' ? Math.round((c.h - gap) * 0.4) : c.h;
    const fh = c.front === 'both' ? (area - gap * (dr.n)) / dr.n : dr.h;
    for (let i = 0; i < dr.n; i++) {
      const y = startY + i * (fh + gap) + fh / 2;
      mk(g, dr.w, fh, t, c.w / 2, y, t / 2, colors.door, { ...E, dir: [0, 0, 1 + i * 0.2] });
      if (c.handle === 'handle') {
        const knob = new THREE.Mesh(new THREE.SphereGeometry(14 * S, 14, 10), new THREE.MeshStandardMaterial({ color: 0x111111 }));
        knob.position.set((c.w / 2) * S, y * S, (t + 12) * S);
        g.add(knob);
      }
    }
  }
  if (c.handle === 'gola' && c.front !== 'none') {
    mk(g, c.w - 4, 22, 30, c.w / 2, yb + c.h - 10, t, 0x111111, { ...E, dir: [0, 1, 1] });
  }
  if (c.leftEnd === 'panel') mk(g, t, c.h + legs, c.d, -t / 2, y0 + (c.h + legs) / 2, -c.d / 2, colors.door, { ...E, dir: [-1.4, 0, 0] });
  if (c.rightEnd === 'panel') mk(g, t, c.h + legs, c.d, c.w + t / 2, y0 + (c.h + legs) / 2, -c.d / 2, colors.door, { ...E, dir: [1.4, 0, 0] });
  return g;
}

export default function Viewer({ run, sel, onSelect, C, mats, look, explode, open, resetKey, wire }) {
  const host = useRef(null);
  const api = useRef({});

  useEffect(() => {
    const el = host.current;
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    el.appendChild(renderer.domElement);
    renderer.domElement.style.display = 'block';
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 60);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.maxPolarAngle = Math.PI * 0.52;
    scene.add(new THREE.HemisphereLight(0xffffff, 0xd8d3c9, 2.4));
    const sun = new THREE.DirectionalLight(0xffffff, 1.6);
    sun.position.set(2.5, 4, 3.5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: 0.5, far: 14 });
    sun.shadow.bias = -0.0004;
    scene.add(sun);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshStandardMaterial({ color: 0xe9e8e3, roughness: 1 }));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    const content = new THREE.Group();
    scene.add(content);

    const resize = () => {
      const w = el.clientWidth, h = el.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();

    let raf;
    const loop = () => { controls.update(); renderer.render(scene, camera); raf = requestAnimationFrame(loop); };
    loop();

    // click to select
    const ray = new THREE.Raycaster();
    let down = null;
    const pd = (e) => { down = [e.clientX, e.clientY]; };
    const pu = (e) => {
      if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 4) return;
      const r = renderer.domElement.getBoundingClientRect();
      ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera);
      const hit = ray.intersectObjects(content.children, true)[0];
      if (hit) {
        let o = hit.object;
        while (o && o.userData.ci === undefined) o = o.parent;
        if (o) api.current.onSelect?.(o.userData.ci);
      }
    };
    renderer.domElement.addEventListener('pointerdown', pd);
    renderer.domElement.addEventListener('pointerup', pu);

    // keyboard walk (W A S D / Q E)
    const keys = new Set();
    const kd = (e) => { if (!/INPUT|SELECT|TEXTAREA/.test(document.activeElement?.tagName)) keys.add(e.key.toLowerCase()); };
    const ku = (e) => keys.delete(e.key.toLowerCase());
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    const walk = setInterval(() => {
      if (!keys.size) return;
      const sp = keys.has('shift') ? 0.06 : 0.025;
      const dir = new THREE.Vector3();
      camera.getWorldDirection(dir);
      dir.y = 0; dir.normalize();
      const side = new THREE.Vector3().crossVectors(dir, camera.up).normalize();
      const mv = new THREE.Vector3();
      if (keys.has('w')) mv.add(dir);
      if (keys.has('s')) mv.sub(dir);
      if (keys.has('d')) mv.add(side);
      if (keys.has('a')) mv.sub(side);
      if (keys.has('e')) mv.y += 1;
      if (keys.has('q')) mv.y -= 1;
      mv.multiplyScalar(sp);
      camera.position.add(mv);
      controls.target.add(mv);
    }, 16);

    api.current = { THREE, scene, camera, controls, content, floor, renderer, sun, fitted: '' };
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(walk);
      ro.disconnect();
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
      renderer.dispose();
      el.removeChild(renderer.domElement);
    };
  }, []);

  api.current.onSelect = onSelect;

  // rebuild scene when the run or look changes
  useEffect(() => {
    const a = api.current;
    if (!a.content) return;
    const lk = LOOKS[look] || LOOKS.studio;
    a.scene.background = new THREE.Color(lk.bg);
    a.floor.material.color.set(lk.floor);
    while (a.content.children.length) a.content.remove(a.content.children[0]);
    let x = 0;
    const colorOf = (id) => new THREE.Color(mats.find((m) => m.id === id)?.color || '#cccccc');
    run.forEach((c, i) => {
      const colors = {
        carcass: colorOf(c.carcass), door: colorOf(c.door),
        back: new THREE.Color('#d8d2c6'), plinth: colorOf(c.carcass).multiplyScalar(0.88),
      };
      const g = buildCabinet(c, C, colors, lk, open);
      g.position.x = x * S;
      g.userData.ci = i;
      g.children.forEach((ch) => {
        const d = ch.userData.dir || [0, 0, 0];
        ch.userData.base = ch.position.clone();
        ch.position.set(ch.userData.base.x + d[0] * explode * 0.35, ch.userData.base.y + d[1] * explode * 0.35, ch.userData.base.z + d[2] * explode * 0.35);
        if (run.length > 1 && i === sel) ch.traverse((o) => { if (o.isMesh && o.material?.emissive) o.material.emissive.set(0x0b2330); });
      });
      a.content.add(g);
      x += c.w;
    });
    const total = x;
    // centre the run
    a.content.position.x = (-total * S) / 2;
    const key = run.map((c) => c.w + ':' + c.h).join(',') + '|' + resetKey;
    if (a.fitted !== key) {
      a.fitted = key;
      const maxH = Math.max(...run.map((c) => (c.kind === 'wall' ? C.wallBottom + c.h : c.legs + c.h)));
      const dist = Math.max(total, maxH * 1.4, 900) * S * 1.9;
      a.controls.target.set(0, (maxH * S) / 2, 0);
      a.camera.position.set(dist * 0.55, maxH * S * 0.75 + 0.3, dist);
      a.controls.update();
    }
  }, [run, sel, C, mats, look, explode, open, resetKey]);

  return <div className="viewer" ref={host} data-wire={wire ? 1 : 0} />;
}

export function savePng(host) {
  const c = host?.querySelector('canvas');
  if (!c) return;
  const a = document.createElement('a');
  a.href = c.toDataURL('image/png');
  a.download = 'cabinet.png';
  a.click();
}
