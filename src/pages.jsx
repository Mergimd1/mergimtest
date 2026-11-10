import { useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { useStore, set, updateCab, exportBackup, importBackup, nextOrderNumber } from './store';
import {
  CATALOG, CONSTRUCT_SCHEMA, DEFAULT_CONSTRUCT, newCabinet, summary, runStats, runCutList,
  holeTotals, HOLE_KINDS, doorSize, drawerFrontSize, eur,
} from './engine';

const go = (p) => { location.hash = '#/' + p; };
const STATUSES = ['draft', 'confirmed', 'in production', 'ready', 'delivered', 'cancelled'];
const ACTIVE = ['draft', 'confirmed', 'in production', 'ready'];

function Head({ title, sub, children }) {
  return (
    <div className="page-head">
      <div><h1>{title}</h1><p>{sub}</p></div>
      <div className="head-actions">{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------- Orders
export function Orders() {
  const s = useStore();
  const [view, setView] = useState('orders');
  const [q, setQ] = useState('');
  const [f, setF] = useState('active');
  const [ask, setAsk] = useState(false);
  const [cust, setCust] = useState('');
  const [phone, setPhone] = useState('');

  const count = (st) => s.orders.filter((o) => (st === 'all' ? true : st === 'active' ? ACTIVE.includes(o.status) : o.status === st)).length;
  const list = s.orders.filter((o) => (f === 'all' ? true : f === 'active' ? ACTIVE.includes(o.status) : o.status === f))
    .filter((o) => (o.number + o.customer + (o.phone || '')).toLowerCase().includes(q.toLowerCase()));

  const create = (e) => {
    e.preventDefault();
    const now = Date.now();
    const o = { id: 'o' + now, number: nextOrderNumber(s.orders), customer: cust || 'Unnamed', phone, status: 'draft', cabinets: [], created: now, updated: now };
    set((st) => ({ orders: [o, ...st.orders], orderId: o.id, run: [newCabinet('base', st.construct)], sel: 0 }));
    setAsk(false); setCust(''); setPhone('');
    go('configure');
  };
  const open = (o) => {
    set((st) => ({ orderId: o.id, run: o.cabinets.length ? o.cabinets : [newCabinet('base', st.construct)], sel: 0 }));
    go('configure');
  };
  const patch = (id, p) => set((st) => ({ orders: st.orders.map((o) => (o.id === id ? { ...o, ...p, updated: Date.now() } : o)) }));
  const del = (o) => { if (confirm(`Delete ${o.number}?`)) set((st) => ({ orders: st.orders.filter((x) => x.id !== o.id), orderId: st.orderId === o.id ? null : st.orderId })); };

  // materials for the work in hand
  const need = useMemo(() => {
    const m = {};
    s.orders.filter((o) => ACTIVE.includes(o.status)).forEach((o) => {
      runStats(o.cabinets, s.construct, s.materials, s.fittings).rows.forEach((r) => {
        const name = r.matName;
        m[name] = m[name] || { area: 0, pieces: 0 };
        m[name].area += (r.l * r.w * r.qty) / 1e6;
        m[name].pieces += r.qty;
      });
    });
    return Object.entries(m).sort((a, b) => b[1].area - a[1].area);
  }, [s.orders, s.construct, s.materials, s.fittings]);

  return (
    <div className="page">
      <Head title="Orders" sub="Every customer job and where it stands — from the first configuration to delivered.">
        <button className="btn dark" onClick={() => setAsk(true)}>New order</button>
      </Head>
      <div className="seg left"><button className={view === 'orders' ? 'on' : ''} onClick={() => setView('orders')}>Orders</button><button className={view === 'mat' ? 'on' : ''} onClick={() => setView('mat')}>Materials for the work in hand</button></div>

      {view === 'orders' ? (
        <>
          <div className="filters">
            <input className="search" placeholder="Search number, customer, phone..." value={q} onChange={(e) => setQ(e.target.value)} />
            <div className="pills">
              {['active', 'draft', 'confirmed', 'in production', 'ready', 'delivered', 'cancelled', 'all'].map((st) => (
                <button key={st} className={f === st ? 'on' : ''} onClick={() => setF(st)}>{st[0].toUpperCase() + st.slice(1)} <small>{count(st)}</small></button>
              ))}
            </div>
          </div>
          <div className="table">
            <div className="tr th"><span>Number</span><span>Customer</span><span>Status</span><span className="r">Cabinets</span><span>Due</span><span /></div>
            {list.length === 0 && <div className="empty">No orders here yet. Press <b>New order</b> to start one.</div>}
            {list.map((o) => (
              <div className="tr" key={o.id}>
                <button className="lnk" onClick={() => open(o)}><b>{o.number}</b></button>
                <span>{o.customer}{o.phone ? <small className="sub">{o.phone}</small> : null}</span>
                <span><select className={'st ' + o.status.replace(' ', '-')} value={o.status} onChange={(e) => patch(o.id, { status: e.target.value })}>{STATUSES.map((x) => <option key={x}>{x}</option>)}</select></span>
                <span className="r">{o.cabinets.length}</span>
                <span><input type="date" className="date" value={o.due || ''} onChange={(e) => patch(o.id, { due: e.target.value })} /></span>
                <span className="r"><button className="mini" onClick={() => open(o)}>Open</button> <button className="mini" onClick={() => del(o)}>Delete</button></span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="table narrow">
          <div className="tr th m"><span>Material</span><span className="r">Pieces</span><span className="r">Area</span></div>
          {need.length === 0 && <div className="empty">No active orders with cabinets yet.</div>}
          {need.map(([n, v]) => <div className="tr m" key={n}><span>{n}</span><span className="r">{v.pieces}</span><span className="r">{v.area.toFixed(2)} m²</span></div>)}
        </div>
      )}

      {ask && (
        <div className="modal" onClick={() => setAsk(false)}>
          <form className="dialog" onClick={(e) => e.stopPropagation()} onSubmit={create}>
            <h3>New order</h3>
            <label>Customer<input autoFocus value={cust} onChange={(e) => setCust(e.target.value)} /></label>
            <label>Phone<input value={phone} onChange={(e) => setPhone(e.target.value)} /></label>
            <div className="row end"><button type="button" className="btn" onClick={() => setAsk(false)}>Cancel</button><button className="btn dark">Create and configure</button></div>
          </form>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- Mini elevation drawing
function Elevation({ c, C }) {
  const W = 190, H = 190;
  const k = Math.min((W - 40) / c.w, (H - 30) / (c.h + c.legs));
  const w = c.w * k, h = c.h * k, lg = c.legs * k;
  const x0 = (W - w) / 2, y0 = 10;
  const els = [];
  if (c.front === 'doors' || c.front === 'both') {
    const ds = doorSize(c, C);
    const dh = (c.front === 'both' ? ds.h * 0.6 : ds.h) * k;
    for (let n = 0; n < ds.n; n++) els.push(<rect key={'d' + n} x={x0 + 2 + n * (w / ds.n)} y={y0 + (c.front === 'both' ? 2 : 2)} width={w / ds.n - 4} height={dh - 2} fill="none" stroke="#7fb4c8" strokeWidth="1.2" />);
  }
  if (c.front === 'drawers' || c.front === 'both') {
    const dr = drawerFrontSize(c, C);
    const area = c.front === 'both' ? h * 0.4 : h;
    const top = c.front === 'both' ? y0 + h - area : y0;
    for (let n = 0; n < dr.n; n++) els.push(<rect key={'r' + n} x={x0 + 2} y={top + 2 + n * (area / dr.n)} width={w - 4} height={area / dr.n - 4} fill="none" stroke="#7fb4c8" strokeWidth="1.2" />);
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="elev">
      <rect x={x0} y={y0} width={w} height={h} fill="#26332f" stroke="#8fa7a0" />
      {els}
      {lg > 0 && <><rect x={x0 + 4} y={y0 + h} width="5" height={lg} fill="#555" /><rect x={x0 + w - 9} y={y0 + h} width="5" height={lg} fill="#555" /></>}
    </svg>
  );
}

// ---------------------------------------------------------------- Cabinets
export function Cabinets() {
  const s = useStore();
  const [grp, setGrp] = useState('All');
  const fileRef = useRef(null);
  const groups = CATALOG.kitchen.concat(CATALOG.wardrobe);
  const shown = groups.filter(([g]) => grp === 'All' || g === grp);
  const total = groups.reduce((a, [, it]) => a + it.length, 0);
  const edit = (id) => { set((st) => ({ run: [newCabinet(id, st.construct)], sel: 0, orderId: null })); go('configure'); };
  const imp = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    try { importBackup(await f.text()); alert('Backup restored.'); } catch (er) { alert('Could not read that file: ' + er.message); }
    e.target.value = '';
  };
  return (
    <div className="page">
      <Head title="My cabinets" sub="Every cabinet type with its standard size. Edit one and the configurator starts from it.">
        <button className="btn" onClick={() => fileRef.current.click()}>Import backup</button>
        <button className="btn" onClick={exportBackup}>Export</button>
        <input ref={fileRef} type="file" accept=".json" hidden onChange={imp} />
      </Head>
      <div className="filters"><div className="pills">{['All', ...groups.map(([g]) => g)].map((g) => <button key={g} className={grp === g ? 'on' : ''} onClick={() => setGrp(g)}>{g}</button>)}</div><span className="muted">{total} cabinet types</span></div>
      {shown.map(([g, items]) => (
        <section key={g}>
          <h4 className="grp">{g} cabinets <small>{items.length} types</small></h4>
          <div className="cards">
            {items.map(([id, label]) => {
              const c = newCabinet(id, s.construct);
              const p = summary(c, s.construct, s.materials, s.fittings).price;
              const mat = s.materials.find((m) => m.id === c.carcass)?.name;
              return (
                <div className="cab-card" key={id}>
                  <div className="thumb"><Elevation c={c} C={s.construct} /></div>
                  <div className="meta">
                    <div className="row"><b>{label}</b><span className="price">{eur(p)}</span></div>
                    <small>{c.w} × {c.h} × {c.d} mm · {c.front === 'drawers' ? `${c.drawers} drawers` : c.front === 'none' ? 'open front' : `${c.doors} door${c.doors > 1 ? 's' : ''}`}{c.shelves ? ` · ${c.shelves} shelf` : ''}</small>
                    <small>{mat}</small>
                    <button className="btn block" onClick={() => edit(id)}>Edit</button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- Layouts
export function Layouts() {
  const s = useStore();
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('recent');
  const [name, setName] = useState('');
  const list = s.layouts.filter((l) => l.name.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (sort === 'name' ? a.name.localeCompare(b.name) : b.saved - a.saved));
  const saveCurrent = (e) => {
    e.preventDefault();
    set((st) => ({ layouts: [{ id: 'l' + Date.now(), name: name || 'Layout', run: st.run, saved: Date.now() }, ...st.layouts] }));
    setName('');
  };
  const open = (l) => { set({ run: l.run, sel: 0, orderId: null }); go('configure'); };
  const del = (l) => set((st) => ({ layouts: st.layouts.filter((x) => x.id !== l.id) }));
  const rename = (l) => { const n = prompt('Layout name', l.name); if (n) set((st) => ({ layouts: st.layouts.map((x) => (x.id === l.id ? { ...x, name: n } : x)) })); };
  return (
    <div className="page">
      <Head title="My layouts" sub="Saved runs of cabinets — click a card to reopen the whole run.">
        <form className="inline" onSubmit={saveCurrent}><input placeholder="Name for the current run" value={name} onChange={(e) => setName(e.target.value)} /><button className="btn dark">Save current run</button></form>
      </Head>
      <div className="filters"><input className="search" placeholder="Search layouts..." value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={sort} onChange={(e) => setSort(e.target.value)}><option value="recent">Recent</option><option value="name">Name</option></select></div>
      {list.length === 0 && <div className="empty">No saved layouts yet. Build a run on Configure, then save it here.</div>}
      <div className="cards l4">
        {list.map((l) => {
          const W = l.run.reduce((a, c) => a + c.w, 0);
          const H = Math.max(...l.run.map((c) => c.h + c.legs));
          const D = Math.max(...l.run.map((c) => c.d));
          const price = runStats(l.run, s.construct, s.materials, s.fittings).price;
          return (
            <div className="lay-card" key={l.id} onClick={() => open(l)}>
              <div className="row"><b>{l.name}</b>
                <span onClick={(e) => e.stopPropagation()}><button className="mini" onClick={() => rename(l)}>Rename</button> <button className="mini" onClick={() => del(l)}>Delete</button></span></div>
              <small>{l.run.length} cabinets · {W} × {H} × {D} mm</small>
              <div className="chips">{l.run.map((c, k) => <span key={k}>{c.w}</span>)}</div>
              <div className="tot"><small>Total TVSH</small><b>{eur(price)}</b></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Cut list
function packSheets(rows, C) {
  const byMat = {};
  rows.forEach((r) => { for (let n = 0; n < r.qty; n++) (byMat[r.mat] = byMat[r.mat] || []).push(r); });
  const SL = C.sheetL - 2 * C.trim, SW = C.sheetW - 2 * C.trim;
  const sheets = [];
  for (const [mat, pieces] of Object.entries(byMat)) {
    const ps = [...pieces].map((p) => (p.l >= p.w ? { ...p, a: p.l, b: p.w } : { ...p, a: p.w, b: p.l })).sort((x, y) => y.b - x.b || y.a - x.a);
    let cur = null;
    const newSheet = () => { cur = { mat, items: [], rowY: 0, rowH: 0, rowX: 0 }; sheets.push(cur); };
    newSheet();
    for (const p of ps) {
      if (p.a > SL || p.b > SW) continue;
      if (cur.rowH === 0) { cur.rowH = p.b; }
      if (cur.rowX + p.a > SL) { cur.rowY += cur.rowH + C.kerf; cur.rowH = p.b; cur.rowX = 0; }
      if (cur.rowY + p.b > SW) { newSheet(); cur.rowH = p.b; }
      cur.items.push({ x: cur.rowX, y: cur.rowY, a: p.a, b: p.b, sq: p.sq });
      cur.rowX += p.a + C.kerf;
    }
  }
  return sheets.filter((s) => s.items.length);
}

function sheetSvg(sh, C, name) {
  const SL = C.sheetL - 2 * C.trim, SW = C.sheetW - 2 * C.trim;
  const items = sh.items.map((i) => `<rect x="${i.x}" y="${i.y}" width="${i.a}" height="${i.b}" fill="#f4efe6" stroke="#222" stroke-width="3"/><text x="${i.x + i.a / 2}" y="${i.y + i.b / 2}" font-size="${Math.min(60, i.b / 3)}" text-anchor="middle" dominant-baseline="middle" font-family="Arial">${i.sq} ${i.a}×${i.b}</text>`).join('');
  return `<h4>${name}</h4><svg viewBox="0 0 ${SL} ${SW}" style="width:100%;border:1px solid #999"><rect width="${SL}" height="${SW}" fill="#fff"/>${items}</svg>`;
}

export function CutList() {
  const s = useStore();
  const { run, construct: C, materials: mats, fittings: fit } = s;
  const [fronts, setFronts] = useState(true);
  const [backs, setBacks] = useState(true);
  const [labels, setLabels] = useState(false);
  const [printMenu, setPrintMenu] = useState(false);
  const [popt, setPopt] = useState({ list: true, plan: true });
  const rowsAll = useMemo(() => runCutList(run, C, mats), [run, C, mats]);
  const rows = rowsAll.filter((r) => (fronts || r.group !== 'front') && (backs || r.group !== 'back'));
  const st = useMemo(() => runStats(run, C, mats, fit), [run, C, mats, fit]);
  const sheets = useMemo(() => packSheets(rows, C), [rows, C]);
  const matName = (id) => (id === 'back' ? 'Back panel' : mats.find((m) => m.id === id)?.name || id);
  const grp = [['carcass', 'Carcass board', 'Cut in the workshop, off the stock sheet.'], ['back', 'Back panel', 'Lesonit, cut to the carcass outside size.'], ['front', 'Fronts', 'Doors, drawer fronts and end panels, in the front decor. Untick Fronts above when they are bought in machined.']];

  const csv = () => {
    const lines = ['Part,Length,Width,Qty,Material,Cabinet'];
    rows.forEach((r) => lines.push([r.sq, r.l, r.w, r.qty, matName(r.mat), r.cabLabel].map((x) => `"${x}"`).join(',')));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv' }));
    a.download = 'cut-list.csv';
    a.click();
  };
  const print = () => {
    const w = window.open('', '_blank');
    if (!w) { alert('Allow pop-ups to print.'); return; }
    const table = grp.map(([g, title]) => {
      const rr = rows.filter((r) => r.group === g);
      if (!rr.length) return '';
      return `<h3>${title}</h3><table><tr><th>Part</th><th>Length</th><th>Width</th><th>Qty</th><th>Material</th></tr>${rr.map((r) => `<tr><td>${r.sq}</td><td>${r.l}</td><td>${r.w}</td><td>${r.qty}</td><td>${matName(r.mat)}</td></tr>`).join('')}</table>`;
    }).join('');
    const plan = sheets.map((sh, k) => sheetSvg(sh, C, `Sheet ${k + 1} — ${matName(sh.mat)}`)).join('');
    w.document.write(`<html><head><title>Cut list</title><style>body{font-family:Arial;margin:24px}h1{border-bottom:2px solid #000;padding-bottom:6px}table{border-collapse:collapse;width:100%;margin-bottom:16px}td,th{border-bottom:1px solid #ccc;padding:4px 8px;text-align:left}svg{margin-bottom:18px}</style></head><body><h1>Cut list <small style="font-size:14px;font-weight:normal;float:right">${run.length} cabinets · ${st.pieces} pieces · ${st.area.toFixed(2)} m² · ${new Date().toLocaleDateString()}</small></h1>${popt.list ? table : ''}${popt.plan ? '<h2>Cutting plan</h2>' + plan : ''}</body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 400);
    setPrintMenu(false);
  };

  return (
    <div className="page">
      <Head title="Cut list" sub="Every piece in the current run, and the boards it comes off." />
      <div className="stats">
        <div><small>Cabinets</small><b>{run.length}</b></div>
        <div><small>Pieces to cut</small><b>{rows.reduce((a, r) => a + r.qty, 0)}</b></div>
        <div><small>Board area</small><b>{st.area.toFixed(2)} m²</b></div>
        <div><small>Sheets</small><b>{sheets.length}</b></div>
        <div><small>Edge tape</small><b>{st.band.toFixed(1)} m</b></div>
        <div className="grow" />
        <div className="actions">
          <label><input type="checkbox" checked={fronts} onChange={(e) => setFronts(e.target.checked)} /> Fronts</label>
          <label><input type="checkbox" checked={backs} onChange={(e) => setBacks(e.target.checked)} /> Back panels</label>
          <button className="btn" onClick={csv}>CSV for the saw</button>
          <button className="btn" onClick={() => setLabels(true)}>Labels</button>
          <div className="pm"><button className="btn dark" onClick={() => setPrintMenu(!printMenu)}>Print</button>
            {printMenu && <div className="vmenu pmenu"><h6>Print</h6>
              <label><input type="checkbox" checked={popt.list} onChange={(e) => setPopt({ ...popt, list: e.target.checked })} /> Cut list</label>
              <label><input type="checkbox" checked={popt.plan} onChange={(e) => setPopt({ ...popt, plan: e.target.checked })} /> Cutting plan</label>
              <button className="btn dark block" onClick={print}>Print</button></div>}</div>
        </div>
      </div>
      {grp.map(([g, title, sub]) => {
        const rr = rows.filter((r) => r.group === g);
        if (!rr.length) return null;
        return (
          <section className="block-card" key={g}>
            <h3>{title} <small>{sub}</small></h3>
            <div className="table"><div className="tr th cl"><span>Part</span><span className="r">Length</span><span className="r">Width</span><span className="r">Qty</span><span>Material</span></div>
              {rr.map((r) => <div className="tr cl" key={r.k}><b>{r.sq}</b><span className="r mono">{r.l}</span><span className="r mono">{r.w}</span><span className="r mono">× {r.qty}</span><span>{matName(r.mat)}</span></div>)}
            </div>
          </section>
        );
      })}
      {sheets.length > 0 && (
        <section className="block-card"><h3>Cutting plan <small>{sheets.length} sheets, rows cut along the sheet length.</small></h3>
          <div className="plans">{sheets.map((sh, k) => <div key={k} dangerouslySetInnerHTML={{ __html: sheetSvg(sh, C, `Sheet ${k + 1} — ${matName(sh.mat)}`) }} />)}</div></section>
      )}
      {labels && <Labels rows={rows} onClose={() => setLabels(false)} matName={matName} />}
    </div>
  );
}

function Labels({ rows, onClose, matName }) {
  const [proj, setProj] = useState('Project ' + new Date().toLocaleDateString('en-GB'));
  const [stock, setStock] = useState('50x30');
  const [inc, setInc] = useState({ carcass: true, back: true, front: false });
  const [only, setOnly] = useState('');
  const pieces = [];
  rows.forEach((r) => { if (inc[r.group]) for (let n = 0; n < r.qty; n++) pieces.push({ ...r, n: n + 1 }); });
  const numbered = pieces.map((p, k) => ({ ...p, no: k + 1 }));
  const sel = only.trim()
    ? numbered.filter((p) => only.split(',').some((t) => { const [a, b] = t.trim().split('-').map(Number); return b ? p.no >= a && p.no <= b : p.no === a; }))
    : numbered;
  const sizes = { '50x30': [50, 30], '70x40': [70, 40], '100x50': [100, 50] };
  const [lw, lh] = sizes[stock];
  const printLabels = async () => {
    const w = window.open('', '_blank');
    if (!w) { alert('Allow pop-ups to print.'); return; }
    const html = [];
    for (const p of sel) {
      const url = await QRCode.toDataURL(`${proj} | #${p.no} | ${p.sq} ${p.l}x${p.w} | ${p.cabLabel}`, { margin: 0, width: 200 });
      html.push(`<div class="lb"><img src="${url}"/><div><b>#${p.no}</b><br/><b>${p.sq}</b><br/>${p.l} × ${p.w}<br/><small>${p.cabLabel}</small><br/><small>${matName(p.mat)}</small></div></div>`);
    }
    w.document.write(`<html><head><title>Labels</title><style>@page{size:${lw}mm ${lh}mm;margin:0}body{margin:0;font-family:Arial}.lb{width:${lw}mm;height:${lh}mm;box-sizing:border-box;padding:2mm;display:flex;gap:2mm;align-items:center;page-break-after:always;font-size:8pt;line-height:1.2}.lb img{height:${lh - 6}mm;width:${lh - 6}mm}</style></head><body>${html.join('')}</body></html>`);
    w.document.close(); w.focus(); setTimeout(() => w.print(), 500);
  };
  return (
    <div className="modal" onClick={onClose}>
      <div className="dialog wide" onClick={(e) => e.stopPropagation()}>
        <div className="row"><h3>Labels</h3><button className="mini" onClick={onClose}>Close</button></div>
        <p className="muted">{pieces.length} pieces. Each QR code holds the project, piece number, size and cabinet, so it can be read with any phone camera.</p>
        <div className="two"><label>Project name<input value={proj} onChange={(e) => setProj(e.target.value)} /></label>
          <label>Label stock<select value={stock} onChange={(e) => setStock(e.target.value)}><option value="50x30">Roll · 50 × 30 mm</option><option value="70x40">Roll · 70 × 40 mm</option><option value="100x50">Roll · 100 × 50 mm</option></select></label></div>
        <div className="two"><div><small className="muted">Which pieces</small><div className="checks">{[['carcass', 'Carcass'], ['back', 'Back panels'], ['front', 'Fronts']].map(([k, l]) => <label key={k}><input type="checkbox" checked={inc[k]} onChange={(e) => setInc({ ...inc, [k]: e.target.checked })} /> {l} {rows.filter((r) => r.group === k).reduce((a, r) => a + r.qty, 0)}</label>)}</div></div>
          <label>Only these numbers<input value={only} onChange={(e) => setOnly(e.target.value)} placeholder="e.g. 12, 15-18 — to replace a damaged label" /></label></div>
        {sel[0] && <div className="label-prev"><div className="qrbox" /><div><b>#{sel[0].no}</b><br /><b>{sel[0].sq}</b><br />{sel[0].l} × {sel[0].w}<br /><small>{sel[0].cabLabel}</small></div></div>}
        <div className="row end"><button className="btn" onClick={onClose}>Cancel</button><button className="btn dark" onClick={printLabels} disabled={!sel.length}>Print {sel.length} labels</button></div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Drilling
export function Drilling() {
  const s = useStore();
  const { run, sel, construct: C } = s;
  const [ci, setCi] = useState(Math.min(sel, run.length - 1));
  const c = run[ci] || run[0];
  const info = useMemo(() => holeTotals(c, C), [c, C]);
  const [pk, setPk] = useState('side');
  const [kind, setKind] = useState('hole');
  const [snap, setSnap] = useState(1);
  const piece = info.pieces.find((p) => p.key === pk) || info.pieces[0];
  const runTotals = useMemo(() => {
    const t = { total: 0, byKind: {} };
    run.forEach((cab) => { const h = holeTotals(cab, C); t.total += h.total; Object.entries(h.byKind).forEach(([k, n]) => { t.byKind[k] = (t.byKind[k] || 0) + n; }); });
    return t;
  }, [run, C]);

  const W = 640, pad = 46;
  const k = Math.min((W - 2 * pad) / piece.w, 420 / piece.h);
  const vw = piece.w * k + 2 * pad, vh = piece.h * k + 2 * pad;
  const sx = (x) => pad + x * k, sy = (y) => pad + (piece.h - y) * k;
  const added = c.extraHoles[piece.key] || [];

  const onClick = (e) => {
    const svg = e.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM().inverse());
    let x = (p.x - pad) / k, y = piece.h - (p.y - pad) / k;
    if (x < 0 || y < 0 || x > piece.w || y > piece.h) return;
    if (snap > 1) { x = Math.round(x / snap) * snap; y = Math.round(y / snap) * snap; } else { x = Math.round(x); y = Math.round(y); }
    updateCab(ci, (cab) => ({ extraHoles: { ...cab.extraHoles, [piece.key]: [...(cab.extraHoles[piece.key] || []), { x, y, kind }] } }));
  };
  const rm = (n) => updateCab(ci, (cab) => ({ extraHoles: { ...cab.extraHoles, [piece.key]: (cab.extraHoles[piece.key] || []).filter((_, j) => j !== n) } }));

  return (
    <div className="page">
      <Head title="Drilling" sub="The hole pattern every cabinet is bored to — computed from the construction settings." />
      <div className="stats">
        <div><small>Holes in run</small><b>{runTotals.total}</b></div>
        {Object.entries(runTotals.byKind).filter(([, n]) => n > 0).map(([kd, n]) => <div key={kd}><small><i className="dot" style={{ background: HOLE_KINDS[kd].color }} />{HOLE_KINDS[kd].label}</small><b>{n}</b></div>)}
        <div className="grow" />
        <select value={ci} onChange={(e) => setCi(+e.target.value)}>{run.map((r, n) => <option key={r.id} value={n}>{n + 1}. {r.label} {r.w}×{r.h}</option>)}</select>
      </div>
      <div className="drill">
        <div className="block-card">
          <div className="pills">{info.pieces.map((p) => <button key={p.key} className={piece.key === p.key ? 'on' : ''} onClick={() => setPk(p.key)}>{p.name} <small>{p.total}</small></button>)}</div>
          <h4 className="grp">{piece.name} <small>{piece.face} · {piece.w} × {piece.h} mm · ×{piece.qty} per cabinet</small></h4>
          <div className="tray">{Object.entries(HOLE_KINDS).map(([kd, v]) => <button key={kd} className={kind === kd ? 'on' : ''} onClick={() => setKind(kd)}><i className="dot" style={{ background: v.color }} />{v.label} Ø{v.dia}</button>)}
            <span className="grow" /><small className="muted">Snap</small>{[1, 32].map((n) => <button key={n} className={snap === n ? 'on' : ''} onClick={() => setSnap(n)}>{n}</button>)}</div>
          <svg className="drill-svg" viewBox={`0 0 ${vw} ${vh}`} onClick={onClick}>
            <rect x={sx(0)} y={sy(piece.h)} width={piece.w * k} height={piece.h * k} fill="var(--surface2)" stroke="var(--line2)" />
            <line x1={sx(0)} y1={sy(piece.h)} x2={sx(0)} y2={sy(0)} stroke="#e0585b" strokeWidth="4" />
            <text x={sx(0) - 8} y={sy(piece.h / 2)} fontSize="11" fill="#e0585b" textAnchor="end" transform={`rotate(-90 ${sx(0) - 8} ${sy(piece.h / 2)})`}>FRONT</text>
            {[...piece.holes].map((h, n) => (
              <circle key={n} cx={sx(h.x)} cy={sy(h.y)} r={Math.max(3, (HOLE_KINDS[h.kind].dia * k) / 2)} fill={HOLE_KINDS[h.kind].color} fillOpacity=".55" stroke={HOLE_KINDS[h.kind].color} />
            ))}
            <text x={sx(piece.w)} y={sy(piece.h) - 8} fontSize="11" textAnchor="end" fill="var(--muted)">{piece.w} × {piece.h}</text>
          </svg>
          <p className="muted tiny">Click the drawing to add a hole of the selected kind. Measured from the front edge (→) and from the bottom edge (↑).</p>
        </div>
        <div className="block-card">
          <h4 className="grp">Added holes <small>{added.length ? added.length : 'none'}</small></h4>
          {added.map((h, n) => <div className="added" key={n}><i className="dot" style={{ background: HOLE_KINDS[h.kind].color }} />{HOLE_KINDS[h.kind].label} · {h.x} → {h.y} ↑<button className="mini" onClick={() => rm(n)}>Remove</button></div>)}
          {!added.length && <p className="muted">Pick a kind of hole above, then click on the piece to drop one.</p>}
          <h4 className="grp">Checks</h4>
          <p className="ok">{info.total} holes, all inside their pieces.</p>
          <p className="muted tiny">Bits needed: Ø5, Ø8, Ø{C.cupDia}. Hinge positions follow the door height; change the distances on the Construct page.</p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Construct
export function Construct() {
  const s = useStore();
  const { construct: C, materials: mats, fittings: fit } = s;
  const [q, setQ] = useState('');
  const setC = (k, v) => set((st) => ({ construct: { ...st.construct, [k]: v } }));
  const L = (k, v) => set((st) => ({ construct: { ...st.construct, limits: { ...st.construct.limits, [k]: v } } }));
  const match = (t) => !q || t.toLowerCase().includes(q.toLowerCase());
  const setMat = (id, p) => set((st) => ({ materials: st.materials.map((m) => (m.id === id ? { ...m, ...p } : m)) }));
  const setFit = (k, p) => set((st) => ({ fittings: { ...st.fittings, [k]: { ...st.fittings[k], ...p } } }));
  return (
    <div className="page">
      <Head title="Construction" sub="How every cabinet is built — sizes, carcass, fronts, hardware, drilling, limits and prices.">
        <button className="btn" onClick={() => confirm('Restore all construction settings?') && set({ construct: DEFAULT_CONSTRUCT })}>Restore all</button>
      </Head>
      <div className="filters"><input className="search" placeholder="Search — e.g. hinge, depth, pitch, sheet..." value={q} onChange={(e) => setQ(e.target.value)} /></div>

      <section className="block-card"><h3>Prices <small>Euro per m² for boards and per unit for hardware. Leave at 0 to keep prices hidden.</small></h3>
        <div className="table"><div className="tr th pr"><span>Material</span><span>Carcass</span><span>Door</span><span className="r">€ / m²</span></div>
          {mats.filter((m) => match(m.name)).map((m) => (
            <div className="tr pr" key={m.id}><span><i className="dot big" style={{ background: m.color }} />{m.name}</span>
              <span><input type="checkbox" checked={m.carcass} onChange={(e) => setMat(m.id, { carcass: e.target.checked })} /></span>
              <span><input type="checkbox" checked={m.door} onChange={(e) => setMat(m.id, { door: e.target.checked })} /></span>
              <span className="r"><input className="p" type="number" min="0" step="0.5" value={m.price} onChange={(e) => setMat(m.id, { price: +e.target.value })} /></span></div>
          ))}
        </div>
        <div className="table"><div className="tr th pr"><span>Hardware</span><span /><span /><span className="r">€ each</span></div>
          {Object.entries(fit).filter(([, f]) => match(f.name + f.detail)).map(([k, f]) => (
            <div className="tr pr" key={k}><span>{f.name}<small className="sub">{f.detail}</small></span><span /><span /><span className="r"><input className="p" type="number" min="0" step="0.1" value={f.price} onChange={(e) => setFit(k, { price: +e.target.value })} /></span></div>
          ))}
        </div>
      </section>

      {CONSTRUCT_SCHEMA.map(([title, items]) => {
        const rows = items.filter(([, l, d]) => match(l + d + title));
        if (!rows.length) return null;
        return (
          <section className="block-card" key={title}><h3>{title}</h3>
            <div className="params">{rows.map(([k, label, desc]) => (
              <div className="param" key={k}><div><b>{label}</b><small>{desc}</small></div>
                <label><input type="number" value={C[k]} onChange={(e) => setC(k, +e.target.value)} /><span>mm</span></label></div>
            ))}</div>
          </section>
        );
      })}
      {match('limits width height depth') && (
        <section className="block-card"><h3>Limits <small>What the workshop can build — the configurator stops at these sizes.</small></h3>
          <div className="params">{[['minW', 'Narrowest cabinet'], ['maxW', 'Widest cabinet'], ['minH', 'Shortest cabinet'], ['maxH', 'Tallest cabinet'], ['minD', 'Shallowest cabinet'], ['maxD', 'Deepest cabinet']].map(([k, l]) => (
            <div className="param" key={k}><div><b>{l}</b></div><label><input type="number" value={C.limits[k]} onChange={(e) => L(k, +e.target.value)} /><span>mm</span></label></div>
          ))}</div></section>
      )}
    </div>
  );
}
