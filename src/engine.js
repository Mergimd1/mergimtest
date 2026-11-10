// Core logic: cabinet catalog, parts, fittings, holes and prices.
// All sizes are in millimetres.

export const DEFAULT_CONSTRUCT = {
  t: 18,            // carcass board thickness
  backT: 3,         // back panel thickness
  railDepth: 100,   // top rail (lidhese) depth
  bottomSetback: 4, // bottom panel is this much shorter than the side depth
  shelfSetback: 50, // shelf is this much shorter than the side depth
  backGap: 28,      // back panel is this much narrower than the cabinet
  doorGap: 3,       // gap around doors and drawer fronts
  legH: 120,
  wallBottom: 1400, // height of the underside of wall cabinets
  baseH: 720,
  baseD: 575,
  wallH: 720,
  wallD: 347,
  tallH: 2040,
  wardH: 2620,
  wardD: 725,
  sheetL: 2800,
  sheetW: 2070,
  kerf: 4,
  trim: 10,
  hingeShortDoor: 900,   // doors up to this height get 2 hinges
  hingeMediumDoor: 1500, // up to this: 3 hinges, taller: 4
  dowelEnd: 37,          // dowel distance from the front edge
  plateX: 37,            // hinge plate distance from the front edge
  plateEnd: 100,         // first/last hinge distance from the door end
  cupDia: 35,
  shelfPinX: 37,
  snap: 1,
  limits: { minW: 150, maxW: 1400, minH: 200, maxH: 2800, minD: 200, maxD: 900 },
};

export const CONSTRUCT_SCHEMA = [
  ['Standard sizes', [
    ['baseH', 'Base height', 'Height of a base cabinet, without legs.'],
    ['baseD', 'Base depth', 'Depth of every base cabinet.'],
    ['wallH', 'Wall height', 'Standard wall cabinet height.'],
    ['wallD', 'Wall depth', 'Depth of every wall cabinet.'],
    ['tallH', 'Tall height', 'Height of a tall unit.'],
    ['wardH', 'Wardrobe height', 'Standard wardrobe height.'],
    ['wardD', 'Wardrobe depth', 'Standard wardrobe depth.'],
    ['legH', 'Leg height', 'Adjustable leg height under base and tall cabinets.'],
    ['wallBottom', 'Wall cabinet bottom', 'Distance from the floor to the underside of a wall cabinet.'],
  ]],
  ['Carcass & shelves', [
    ['t', 'Carcass board thickness', 'Board used for sides, bottom, rails and shelves.'],
    ['backT', 'Back panel thickness', 'Lesonit / HDF back.'],
    ['backGap', 'Back panel narrower by', 'Back panel width = cabinet width minus this.'],
    ['railDepth', 'Top rail depth', 'Depth of the two top rails (lidhese) on base cabinets.'],
    ['bottomSetback', 'Bottom panel setback', 'Bottom is shorter than the side depth by this.'],
    ['shelfSetback', 'Shelf setback', 'Shelf is shorter than the side depth by this.'],
  ]],
  ['Doors & drawers', [
    ['doorGap', 'Gap around fronts', 'Gap between doors, and between a door and the carcass.'],
  ]],
  ['Board stock & saw', [
    ['sheetL', 'Sheet length', 'Stock board length.'],
    ['sheetW', 'Sheet width', 'Stock board width.'],
    ['kerf', 'Saw kerf', 'Width of the saw cut.'],
    ['trim', 'Sheet trim', 'Trimmed off each sheet edge before cutting.'],
  ]],
  ['Hardware quantities', [
    ['hingeShortDoor', 'Doors with 2 hinges up to', 'Door height up to this gets 2 hinges.'],
    ['hingeMediumDoor', 'Doors with 3 hinges up to', 'Up to this height 3 hinges, taller doors get 4.'],
  ]],
  ['Drilling — system 32', [
    ['dowelEnd', 'Dowel from front', 'Distance from the front edge to the first dowel.'],
    ['plateX', 'Hinge plate from front', 'Distance from the front edge to the hinge plate holes.'],
    ['plateEnd', 'Hinge from door end', 'First and last hinge distance from the door end.'],
    ['cupDia', 'Hinge cup diameter', 'Drill bit used for the hinge cup.'],
    ['shelfPinX', 'Shelf pin from front', 'Front row of shelf pin holes.'],
  ]],
];

export const DEFAULT_MATERIALS = [
  { id: 'bardh', name: 'Bardh Mat 18mm', color: '#efece5', carcass: true, door: true, price: 0 },
  { id: 'sahara', name: 'Sahara Mat 18mm', color: '#c9a76b', carcass: true, door: true, price: 0 },
  { id: 'euronoce', name: 'Euronoce 18mm', color: '#7b5236', carcass: true, door: true, price: 0 },
  { id: 'baysen', name: 'Baysen Oak 18mm', color: '#c8a979', carcass: true, door: true, price: 0 },
  { id: 'caramel18', name: 'Caramel 18mm', color: '#cdbfa9', carcass: true, door: true, price: 0 },
  { id: 'carmel', name: 'Carmel', color: '#c1b29b', carcass: true, door: true, price: 0 },
  { id: 'mdflac', name: 'Mdf Lacquered 22mm', color: '#ece9e1', carcass: false, door: true, price: 0 },
  { id: 'mdfpet', name: 'MDF Pet 22mm', color: '#e5e1d8', carcass: false, door: true, price: 0 },
  { id: 'mdffur', name: 'MDF FURNIR 17mm', color: '#a77d52', carcass: false, door: true, price: 0 },
];

export const DEFAULT_FITTINGS = {
  hinge: { name: 'Hinge', detail: 'Tiomos 110° soft-close', price: 0 },
  knob: { name: 'Knob', detail: 'Dorezat (knob)', price: 0 },
  leg: { name: 'Adjustable leg', detail: 'Plastic tube', price: 0 },
  plinth: { name: 'Plinth', detail: 'per metre', price: 0 },
  plinthCorner: { name: 'Plinth corner', detail: 'each', price: 0 },
  runner: { name: 'Drawer runner', detail: 'soft-close pair', price: 0 },
  band: { name: 'Edge banding', detail: 'per metre', price: 0 },
  back: { name: 'Back panel', detail: 'per m²', price: 0 },
};

// ---- catalog ---------------------------------------------------------------
export const CATALOG = {
  kitchen: [
    ['Base', [
      ['base', 'Base', { doors: 2, front: 'doors', shelves: 1 }],
      ['drawers', 'Drawers', { front: 'drawers', drawers: 3, shelves: 0 }],
      ['sink', 'Sink', { doors: 2, front: 'doors', shelves: 0 }],
      ['corner', 'Corner', { doors: 1, front: 'doors', shelves: 1, w: 900 }],
      ['oven', 'Oven', { front: 'none', shelves: 1, appliance: 'oven' }],
      ['dishwasher', 'Dishwasher', { front: 'none', shelves: 0, appliance: 'dishwasher', w: 600 }],
    ]],
    ['Wall', [
      ['wall', 'Wall', { kind: 'wall', doors: 2, front: 'doors', shelves: 1 }],
      ['liftup', 'Lift-up', { kind: 'wall', h: 360, doors: 1, front: 'doors', shelves: 0 }],
      ['hood', 'Hood', { kind: 'wall', h: 360, doors: 1, front: 'doors', shelves: 0 }],
    ]],
    ['Tall', [
      ['tall', 'Tall', { kind: 'tall', doors: 2, front: 'doors', shelves: 4 }],
      ['tallOven', 'Tall oven', { kind: 'tall', front: 'doors', doors: 1, shelves: 2, appliance: 'oven' }],
      ['ovenMicro', 'Oven + micro', { kind: 'tall', front: 'doors', doors: 1, shelves: 2, appliance: 'oven' }],
      ['fridge', 'Fridge', { kind: 'tall', front: 'doors', doors: 1, shelves: 0, appliance: 'fridge' }],
    ]],
    ['Other', [
      ['custom', 'Custom', { doors: 1, front: 'doors', shelves: 1 }],
    ]],
  ],
  wardrobe: [
    ['Wardrobe', [
      ['wHinged', 'Hinged wardrobe', { kind: 'ward', doors: 2, front: 'doors', shelves: 4 }],
      ['wOpen', 'Open wardrobe', { kind: 'ward', front: 'none', shelves: 3 }],
      ['wDrawers', 'Wardrobe + drawers', { kind: 'ward', front: 'both', doors: 2, drawers: 3, shelves: 2 }],
    ]],
  ],
};

export function findType(id) {
  for (const g of Object.values(CATALOG)) for (const [, items] of g) for (const it of items) if (it[0] === id) return it;
  return null;
}

let uid = 1;
export const newId = () => 'c' + Date.now().toString(36) + (uid++).toString(36);

export function newCabinet(typeId = 'base', C = DEFAULT_CONSTRUCT, over = {}) {
  const it = findType(typeId) || findType('base');
  const o = it[2];
  const kind = o.kind || 'base';
  const h = o.h || (kind === 'wall' ? C.wallH : kind === 'tall' ? C.tallH : kind === 'ward' ? C.wardH : C.baseH);
  const d = kind === 'wall' ? C.wallD : kind === 'ward' ? C.wardD : C.baseD;
  return {
    id: newId(), type: it[0], kind, label: it[1],
    w: o.w || (kind === 'ward' ? 1050 : 600), h, d,
    legs: kind === 'wall' ? 0 : C.legH,
    leftEnd: 'bare', rightEnd: 'bare', joints: 'sides',
    front: o.front || 'doors', doors: o.doors || 2, drawers: o.drawers || 3,
    handle: 'handle', shelves: o.shelves ?? 1, back: true,
    appliance: o.appliance || null,
    carcass: 'caramel18', door: 'caramel18',
    extraHoles: {},
    ...over,
  };
}

const r1 = (x) => Math.round(x);
const m2 = (l, w) => (l * w) / 1e6;

function hingesPerDoor(doorH, C) {
  return doorH <= C.hingeShortDoor ? 2 : doorH <= C.hingeMediumDoor ? 3 : 4;
}

export function doorSize(c, C) {
  const g = C.doorGap;
  const n = c.doors;
  const w = n === 2 ? (c.w - 2 * g) / 2 : c.w - g;
  return { w: r1(w), h: r1(c.h - g), n };
}
export function drawerFrontSize(c, C) {
  const g = C.doorGap;
  const n = c.drawers;
  return { w: r1(c.w - 2 * g), h: r1((c.h - g * (n + 1)) / n), n };
}

// ---- parts -----------------------------------------------------------------
// Each panel: { key, name, sq, group, mat, l, w, qty, band }
//  l = length (grain direction), w = width. band = metres of edge tape for ALL qty.
export function partsOf(c, C) {
  const t = C.t;
  const P = [];
  const isRail = c.kind === 'base';
  const add = (p) => P.push({ band: 0, ...p });
  const innerW = c.w - 2 * t;

  add({ key: 'side', name: 'Side panels', sq: 'ANSORE', group: 'carcass', mat: c.carcass, l: c.h, w: c.d, qty: 2, band: (c.h * 2) / 1000 });
  add({ key: 'bottom', name: 'Bottom panel', sq: 'POD', group: 'carcass', mat: c.carcass, l: innerW, w: c.d - C.bottomSetback, qty: 1, band: innerW / 1000 });
  if (isRail) {
    add({ key: 'rail', name: 'Top rails (Lidhese)', sq: 'LIDHESE', group: 'carcass', mat: c.carcass, l: innerW, w: C.railDepth, qty: 2, band: (innerW * 2) / 1000 });
  } else {
    add({ key: 'top', name: 'Top panel', sq: 'KOKA', group: 'carcass', mat: c.carcass, l: innerW, w: c.d - C.bottomSetback, qty: 1, band: innerW / 1000 });
  }
  if (c.shelves > 0) {
    add({ key: 'shelf', name: 'Shelves', sq: 'RAFT', group: 'carcass', mat: c.carcass, l: innerW - 2, w: c.d - C.shelfSetback, qty: c.shelves, band: ((innerW - 2) * c.shelves) / 1000 });
  }
  if (c.back) {
    add({ key: 'back', name: 'Back panel', sq: 'SHPINA', group: 'back', mat: 'back', l: c.h, w: c.w - C.backGap, qty: 1, t: C.backT });
  }
  const fronts = [];
  if (c.front === 'doors' || c.front === 'both') {
    const ds = doorSize(c, C);
    const dh = c.front === 'both' ? Math.round(ds.h * 0.6) : ds.h;
    fronts.push({ key: 'door', name: ds.n === 1 ? 'Door front' : `${ds.n} door fronts`, sq: 'KAPAK', l: dh, w: ds.w, qty: ds.n });
  }
  if (c.front === 'drawers' || c.front === 'both') {
    const dr = drawerFrontSize(c, C);
    fronts.push({ key: 'drawerFront', name: `${dr.n} drawer fronts`, sq: 'KAPAK', l: dr.w, w: dr.h, qty: dr.n });
    const bw = c.w - 2 * t - 52;
    add({ key: 'drawerSide', name: 'Drawer sides', sq: 'ANSORE SH', group: 'carcass', mat: c.carcass, l: c.d - 60, w: Math.max(60, dr.h - 40), qty: dr.n * 2, band: 0 });
    add({ key: 'drawerBack', name: 'Drawer backs', sq: 'SHPINA SH', group: 'carcass', mat: c.carcass, l: bw, w: Math.max(60, dr.h - 40), qty: dr.n, band: 0 });
  }
  for (const f of fronts) add({ ...f, group: 'front', mat: c.door, band: (f.qty * 2 * (f.l + f.w)) / 1000 });
  if (c.leftEnd === 'panel' || c.rightEnd === 'panel') {
    const q = (c.leftEnd === 'panel' ? 1 : 0) + (c.rightEnd === 'panel' ? 1 : 0);
    add({ key: 'endPanel', name: 'End panels', sq: 'PANEL ANE', group: 'front', mat: c.door, l: c.h + c.legs, w: c.d, qty: q, band: (q * (c.h + c.legs)) / 1000 });
  }
  return P;
}

export function fittingsOf(c, C) {
  const F = [];
  const hasDoors = c.front === 'doors' || c.front === 'both';
  if (hasDoors) {
    const ds = doorSize(c, C);
    const dh = c.front === 'both' ? Math.round(ds.h * 0.6) : ds.h;
    F.push({ key: 'hinge', qty: ds.n * hingesPerDoor(dh, C), perDoor: hingesPerDoor(dh, C) });
    if (c.handle === 'handle') F.push({ key: 'knob', qty: ds.n });
  }
  if (c.front === 'drawers' || c.front === 'both') {
    F.push({ key: 'runner', qty: c.drawers });
    if (c.handle === 'handle') F.push({ key: 'knob', qty: c.drawers });
  }
  if (c.legs > 0 && c.kind !== 'wall') {
    F.push({ key: 'leg', qty: c.w <= 800 ? 4 : c.w <= 1200 ? 5 : 6 });
    F.push({ key: 'plinth', qty: Math.round(c.w) / 1000 });
    F.push({ key: 'plinthCorner', qty: 1 });
  }
  return F.reduce((a, f) => {
    const x = a.find((y) => y.key === f.key);
    if (x) x.qty += f.qty; else a.push({ ...f });
    return a;
  }, []);
}

export function summary(c, C, mats, fit) {
  const parts = partsOf(c, C);
  const fits = fittingsOf(c, C);
  let area = 0, band = 0, back = 0;
  const byMat = {};
  for (const p of parts) {
    const a = m2(p.l, p.w) * p.qty;
    if (p.group === 'back') back += a; else area += a;
    if (p.group !== 'front') band += p.band || 0;
    byMat[p.mat] = (byMat[p.mat] || 0) + a;
  }
  const price = (id) => mats.find((m) => m.id === id)?.price || 0;
  let total = 0;
  for (const [id, a] of Object.entries(byMat)) if (id !== 'back') total += a * price(id);
  total += back * (fit.back?.price || 0);
  total += band * (fit.band?.price || 0);
  for (const f of fits) total += f.qty * (fit[f.key]?.price || 0);
  return { parts, fits, area, band, back, byMat, price: total > 0 ? total : null };
}

// ---- holes -------------------------------------------------------------------
// Piece coordinates: x from the front edge, y from the bottom edge, both in mm.
export const HOLE_KINDS = {
  dowel: { label: 'Dowel', dia: 8, color: '#8b5cf6' },
  shelfPin: { label: 'Shelf pin', dia: 5, color: '#38bdf8' },
  hingePlate: { label: 'Hinge plate', dia: 5, color: '#f5b72f' },
  hingeCup: { label: 'Hinge cup', dia: 35, color: '#f5b72f' },
  runner: { label: 'Runner screw', dia: 5, color: '#10b981' },
  frontFix: { label: 'Front fixing', dia: 5, color: '#10b981' },
  hole: { label: 'Added hole', dia: 8, color: '#38bdf8' },
};

export function piecesWithHoles(c, C) {
  const t = C.t;
  const out = [];
  const hasDoors = c.front === 'doors' || c.front === 'both';
  const ds = doorSize(c, C);
  const dh = c.front === 'both' ? Math.round(ds.h * 0.6) : ds.h;
  const nh = hasDoors ? hingesPerDoor(dh, C) : 0;
  const hingeYs = [];
  for (let i = 0; i < nh; i++) hingeYs.push(nh === 1 ? dh / 2 : C.plateEnd + (i * (dh - 2 * C.plateEnd)) / (nh - 1));

  // side panels (two, identical sizes; holes shown for one — doors on both sides if 2 doors)
  const side = [];
  const sd = c.d;
  for (const x of [C.dowelEnd, sd / 2, sd - C.dowelEnd]) side.push({ x: r1(x), y: t / 2, kind: 'dowel' });
  if (c.kind === 'base') { side.push({ x: 50, y: c.h - t / 2, kind: 'dowel' }); side.push({ x: sd - 50, y: c.h - t / 2, kind: 'dowel' }); }
  else side.push({ x: sd / 2, y: c.h - t / 2, kind: 'dowel' });
  const platesPerSide = hasDoors ? hingeYs.length * 2 : 0;
  for (const y of hingeYs) {
    side.push({ x: C.plateX, y: r1(y - 16), kind: 'hingePlate' });
    side.push({ x: C.plateX, y: r1(y + 16), kind: 'hingePlate' });
  }
  for (let i = 0; i < c.shelves; i++) {
    const y = r1((c.h * (i + 1)) / (c.shelves + 1));
    side.push({ x: C.shelfPinX, y, kind: 'shelfPin' });
    side.push({ x: sd - C.shelfPinX, y, kind: 'shelfPin' });
  }
  if (c.front === 'drawers' || c.front === 'both') {
    for (let i = 0; i < c.drawers; i++) side.push({ x: 40, y: r1(60 + (i * (c.h - 120)) / Math.max(1, c.drawers)), kind: 'runner' });
  }
  const sideFull = [...side, ...(c.extraHoles.side || [])];
  // a single door has hinge holes on one side only
  const adjust = hasDoors && ds.n === 1 ? -platesPerSide : 0;
  out.push({ key: 'side', name: 'Side panel', qty: 2, w: c.d, h: c.h, face: 'inside face', holes: sideFull, adjust });

  const bottom = [];
  const bw = c.w - 2 * t;
  for (const y of [C.dowelEnd, (c.d - 4) / 2, c.d - 4 - C.dowelEnd]) { bottom.push({ x: 9, y: r1(y), kind: 'dowel' }); bottom.push({ x: bw - 9, y: r1(y), kind: 'dowel' }); }
  out.push({ key: 'bottom', name: 'Bottom panel', qty: 1, w: bw, h: c.d - C.bottomSetback, face: 'seen from above', holes: [...bottom, ...(c.extraHoles.bottom || [])] });

  if (c.kind === 'base') {
    out.push({ key: 'rail', name: 'Top rail (Lidhese)', qty: 2, w: bw, h: C.railDepth, face: 'seen from above', holes: [{ x: 9, y: 50, kind: 'dowel' }, { x: bw - 9, y: 50, kind: 'dowel' }, ...(c.extraHoles.rail || [])] });
  }
  if (c.back) out.push({ key: 'back', name: 'Back panel', qty: 1, w: c.w - C.backGap, h: c.h, face: 'seen from behind', holes: c.extraHoles.back || [] });
  if (hasDoors) {
    const cups = [];
    for (const y of hingeYs) cups.push({ x: 22, y: r1(y), kind: 'hingeCup' });
    out.push({ key: 'door', name: 'Door front', qty: ds.n, w: ds.w, h: dh, face: 'back of the leaf', holes: [...cups, ...(c.extraHoles.door || [])] });
  }
  return out;
}

export function holeTotals(c, C) {
  const t = { total: 0, byKind: {}, pieces: [] };
  for (const p of piecesWithHoles(c, C)) {
    const adj = p.adjust || 0;
    p.total = p.holes.length * p.qty + adj;
    p.holes.forEach((h) => { t.byKind[h.kind] = (t.byKind[h.kind] || 0) + p.qty; });
    if (adj) t.byKind.hingePlate = (t.byKind.hingePlate || 0) + adj;
    t.total += p.total;
    t.pieces.push(p);
  }
  return t;
}

// ---- cut-list helpers ---------------------------------------------------------
export function runCutList(run, C, mats) {
  const rows = [];
  run.forEach((c, i) => {
    for (const p of partsOf(c, C)) rows.push({ ...p, cab: i + 1, cabLabel: `${c.label} ${c.w}`, matName: p.mat === 'back' ? 'Back panel' : mats.find((m) => m.id === p.mat)?.name || p.mat });
  });
  // merge identical rows
  const merged = [];
  for (const r of rows) {
    const k = [r.group, r.sq, r.l, r.w, r.mat].join('|');
    const f = merged.find((m) => m.k === k);
    if (f) f.qty += r.qty; else merged.push({ ...r, k });
  }
  return merged;
}

export function runStats(run, C, mats, fit) {
  const rows = runCutList(run, C, mats);
  let pieces = 0, area = 0, band = 0;
  const sheetArea = ((C.sheetL - 2 * C.trim) * (C.sheetW - 2 * C.trim)) / 1e6;
  const byMat = {};
  for (const r of rows) {
    pieces += r.qty;
    const a = m2(r.l + C.kerf, r.w + C.kerf) * r.qty;
    area += m2(r.l, r.w) * r.qty;
    if (r.group !== 'front') band += r.band || 0;
    byMat[r.mat] = (byMat[r.mat] || 0) + a;
  }
  const sheets = Object.values(byMat).reduce((a, v) => a + Math.max(1, Math.ceil(v / sheetArea / 0.9)), 0);
  const price = run.reduce((a, c) => a + (summary(c, C, mats, fit).price || 0), 0);
  return { pieces, area, band, sheets, byMat, rows, price: price > 0 ? price : null };
}

export const eur = (v) => (v == null ? '€ —' : '€ ' + v.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
