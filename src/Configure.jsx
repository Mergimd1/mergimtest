import { useMemo, useRef, useState } from 'react';
import Viewer, { savePng } from './Viewer.jsx';
import { useStore, set, updateCab, nextOrderNumber } from './store';
import { CATALOG, newCabinet, summary, holeTotals, doorSize, eur, HOLE_KINDS } from './engine';

const TABS = [
  ['type', 'Type', 'M12 3l8 4.5v9L12 21l-8-4.5v-9z'],
  ['size', 'Size', 'M4 20L20 4M7 17l-3 3M17 7l3-3'],
  ['front', 'Front', 'M4 4h16v16H4zM12 4v16'],
  ['finish', 'Finish', 'M4 4h10v10H4zM10 10h10v10H10z'],
  ['inside', 'Inside', 'M4 4h16v16H4zM4 12h16'],
  ['holes', 'Holes', 'M7 7h.01M17 7h.01M7 17h.01M17 17h.01M12 12h.01'],
  ['parts', 'Parts', 'M4 7h16M4 12h16M4 17h10'],
];

function Num({ value, onChange, step = 50, unit = 'mm', min = 0, max = 99999, fine }) {
  const f = fine || Math.max(1, Math.round(step / 2));
  const clamp = (v) => Math.min(max, Math.max(min, Math.round(v)));
  return (
    <div className="num">
      <button onClick={() => onChange(clamp(value - f))}>−{f}</button>
      <label>
        <input type="number" value={value} onChange={(e) => e.target.value !== '' && onChange(clamp(+e.target.value))} />
        <span>{unit}</span>
      </label>
      <button onClick={() => onChange(clamp(value + f))}>+{f}</button>
    </div>
  );
}

function Seg({ value, options, onChange }) {
  return (
    <div className="seg">
      {options.map(([v, l]) => (
        <button key={v} className={value === v ? 'on' : ''} onClick={() => onChange(v)}>{l}</button>
      ))}
    </div>
  );
}

export default function Configure() {
  const s = useStore();
  const { run, sel, construct: C, materials: mats, fittings: fit } = s;
  const c = run[Math.min(sel, run.length - 1)];
  const i = Math.min(sel, run.length - 1);
  const [tab, setTab] = useState('type');
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [explode, setExplode] = useState(0);
  const [reset, setReset] = useState(0);
  const [saveAsk, setSaveAsk] = useState(false);
  const [saved, setSaved] = useState(true);
  const [name, setName] = useState('');
  const hostRef = useRef(null);
  const L = C.limits;

  const sum = useMemo(() => summary(c, C, mats, fit), [c, C, mats, fit]);
  const holes = useMemo(() => holeTotals(c, C), [c, C]);
  const order = s.orders.find((o) => o.id === s.orderId);
  const up = (p) => { updateCab(i, p); setSaved(false); };

  const doSave = (customer) => {
    const now = Date.now();
    if (order) {
      set((st) => ({ orders: st.orders.map((o) => (o.id === order.id ? { ...o, cabinets: st.run, updated: now } : o)) }));
    } else {
      const o = { id: 'o' + now, number: nextOrderNumber(s.orders), customer: customer || 'Unnamed', phone: '', status: 'draft', cabinets: run, created: now, updated: now };
      set((st) => ({ orders: [o, ...st.orders], orderId: o.id }));
    }
    setSaved(true);
    setSaveAsk(false);
  };

  const pickType = (id) => {
    const n = newCabinet(id, C, { id: c.id, carcass: c.carcass, door: c.door });
    updateCab(i, () => n);
    setSaved(false);
  };
  const add = () => {
    set((st) => ({ run: [...st.run, newCabinet(st.mode === 'wardrobe' ? 'wHinged' : 'base', st.construct, { carcass: c.carcass, door: c.door })], sel: st.run.length }));
    setTab('type');
    setSaved(false);
  };
  const remove = (k) => {
    if (run.length < 2) return;
    set((st) => ({ run: st.run.filter((_, j) => j !== k), sel: Math.max(0, Math.min(st.sel, st.run.length - 2)) }));
    setSaved(false);
  };
  const dup = () => { set((st) => ({ run: [...st.run.slice(0, i + 1), { ...c, id: c.id + 'd' + Date.now().toString(36) }, ...st.run.slice(i + 1)], sel: i + 1 })); setSaved(false); };
  const move = (d) => {
    const j = i + d;
    if (j < 0 || j >= run.length) return;
    set((st) => { const r = [...st.run]; [r[i], r[j]] = [r[j], r[i]]; return { run: r, sel: j }; });
    setSaved(false);
  };
  const fresh = () => set((st) => ({ run: [newCabinet('base', st.construct)], sel: 0, orderId: null }));

  const subtitle = `${c.w} × ${c.h}${c.legs ? ` +${c.legs} legs` : ''} × ${c.d} mm · ${c.label.toUpperCase()}${c.kind === 'base' ? ' CABINET' : ''}`;
  const headMeta = { type: sum.price != null ? eur(sum.price) : `${(sum.parts.reduce((a, p) => a + p.qty, 0))} parts`, size: `${sum.area.toFixed(2)} m² board`, front: (() => { const ds = doorSize(c, C); const h = sum.fits.find((f) => f.key === 'hinge'); return `${ds.n ? (c.front === 'drawers' ? '' : (ds.w * ds.h * ds.n / 1e6).toFixed(2) + ' m²') : ''}${h ? ' · ' + h.qty + ' hinges' : ''}`; })(), finish: '', inside: `${sum.band.toFixed(2)} m tape`, holes: `${holes.total} holes`, parts: '' }[tab];

  return (
    <div className="cfg">
      <header className="cfg-top">
        <div className="order-chip">
          <b>{order ? order.number : 'New'}</b>
          <span>{order ? order.customer : 'not saved yet'}</span>
          <em>{order ? order.status : 'draft'}</em>
        </div>
        <button className="btn dark" onClick={() => (order ? doSave() : setSaveAsk(true))}>Save</button>
        <span className="muted">{saved ? 'Saved' : 'Unsaved changes'}</span>
        <button className="btn" onClick={fresh}>New configuration</button>
      </header>

      <div className="cfg-body">
        <section className="stage">
          <div className="tabs-row">
            {run.map((r, k) => (
              <button key={r.id} className={'ctab' + (k === i ? ' on' : '')} onClick={() => set({ sel: k })}>{r.label} {r.w}×{r.h}</button>
            ))}
            <button className="ctab add" onClick={add} title="Add a cabinet to the run">+</button>
            <span className="grow" />
            <button className="mini" onClick={() => move(-1)} title="Move left">←</button>
            <button className="mini" onClick={() => move(1)} title="Move right">→</button>
            <button className="mini" onClick={dup}>Duplicate</button>
            <button className="mini" onClick={() => remove(i)} disabled={run.length < 2}>Remove</button>
          </div>
          <p className="caption">{subtitle}<br />Drag to turn · right-drag to move · scroll to zoom · W A S D to walk · click a cabinet</p>
          <div ref={hostRef} className="viewer-wrap">
            <Viewer run={run} sel={i} onSelect={(k) => set({ sel: k })} C={C} mats={mats} look={s.look} explode={explode} open={open} resetKey={reset} />
            <div className="dims"><b>{c.w}</b> mm wide · <b>{c.h}{c.legs ? ` + ${c.legs}` : ''}</b> mm high · <b>{c.d}</b> mm deep</div>
            <div className="vbar">
              <button className={open ? 'on' : ''} onClick={() => setOpen(!open)} title="Open the doors">Doors</button>
              <button onClick={() => setReset((n) => n + 1)} title="Show the whole run again">Reset view</button>
              <button onClick={() => { const e = hostRef.current?.requestFullscreen; e && hostRef.current.requestFullscreen(); }} title="Full screen">Full</button>
              <button className={menu ? 'on' : ''} onClick={() => setMenu(!menu)}>More</button>
            </div>
            {menu && (
              <div className="vmenu">
                <h6>Look</h6>
                <Seg value={s.look} onChange={(v) => set({ look: v })} options={[['dark', 'Dark'], ['light', 'Light'], ['studio', 'Studio']]} />
                <h6>Explode</h6>
                <input type="range" min="0" max="1" step="0.01" value={explode} onChange={(e) => setExplode(+e.target.value)} />
                <button className="btn small" onClick={() => savePng(hostRef.current)}>Save picture (PNG)</button>
                <p className="muted tiny">Drag turn · Right-drag move · Scroll zoom · W A S D walk · Q E down/up · Shift faster</p>
              </div>
            )}
          </div>
        </section>

        <aside className="panel">
          <div className="panel-head"><h3>{TABS.find((t) => t[0] === tab)[1]}</h3><span>{headMeta}</span></div>
          <div className="panel-body">
            {tab === 'type' && (
              <>
                <div className="seg wide">
                  <button className={s.mode === 'kitchen' ? 'on' : ''} onClick={() => set({ mode: 'kitchen' })}>Kitchen</button>
                  <button className={s.mode === 'wardrobe' ? 'on' : ''} onClick={() => set({ mode: 'wardrobe' })}>Wardrobe</button>
                </div>
                {CATALOG[s.mode].map(([group, items]) => (
                  <div key={group}>
                    <h5>{group}</h5>
                    <div className="grid2">
                      {items.map(([id, label, o]) => {
                        const probe = newCabinet(id, C);
                        const ps = summary(probe, C, mats, fit).price;
                        return (
                          <button key={id} className={'card' + (c.type === id ? ' on' : '')} onClick={() => pickType(id)}>
                            <b>{label}</b>
                            <small>{probe.h}×{probe.d}</small>
                            <small className="price">{eur(ps)}</small>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </>
            )}

            {tab === 'size' && (
              <>
                <h5>Width</h5><Num value={c.w} min={L.minW} max={L.maxW} onChange={(v) => up({ w: v })} />
                <h5>Height</h5><Num value={c.h} min={L.minH} max={L.maxH} onChange={(v) => up({ h: v })} />
                <div className="chips">
                  {[c.kind === 'wall' ? C.wallH : c.kind === 'tall' ? C.tallH : c.kind === 'ward' ? C.wardH : C.baseH, 750, 900, 1200, 2040, 2400, 2620].filter((v, k, a) => a.indexOf(v) === k).map((v) => (
                    <button key={v} className={c.h === v ? 'on' : ''} onClick={() => up({ h: v })}>{v}</button>
                  ))}
                </div>
                <h5>Depth</h5><Num value={c.d} min={L.minD} max={L.maxD} step={50} onChange={(v) => up({ d: v })} fine={25} />
                <div className="chips">
                  {[347, 575, 725].map((v) => <button key={v} className={c.d === v ? 'on' : ''} onClick={() => up({ d: v })}>{v}</button>)}
                </div>
                {c.kind !== 'wall' && (<><h5>Legs</h5><Num value={c.legs} min={0} max={200} step={20} fine={10} onChange={(v) => up({ legs: v })} />
                  <div className="chips">{[80, 120].map((v) => <button key={v} className={c.legs === v ? 'on' : ''} onClick={() => up({ legs: v })}>{v}</button>)}</div></>)}
                <h5>Left end</h5>
                <Seg value={c.leftEnd} onChange={(v) => up({ leftEnd: v })} options={[['bare', 'Bare'], ['panel', 'End panel'], ['filler', 'Filler']]} />
                <h5>Right end</h5>
                <Seg value={c.rightEnd} onChange={(v) => up({ rightEnd: v })} options={[['bare', 'Bare'], ['panel', 'End panel'], ['filler', 'Filler']]} />
                <h5>Joints</h5>
                <Seg value={c.joints} onChange={(v) => up({ joints: v })} options={[['sides', 'Sides full'], ['bottom', 'On bottom']]} />
              </>
            )}

            {tab === 'front' && (
              <>
                <Seg value={c.front} onChange={(v) => up({ front: v })} options={[['none', 'None'], ['doors', 'Doors'], ['drawers', 'Drawers'], ['both', 'Both']]} />
                {(c.front === 'doors' || c.front === 'both') && (<><h5>Door count</h5><Seg value={c.doors} onChange={(v) => up({ doors: v })} options={[[1, '1 Door'], [2, '2 Doors']]} /></>)}
                {(c.front === 'drawers' || c.front === 'both') && (<><h5>Drawer count</h5><Seg value={c.drawers} onChange={(v) => up({ drawers: v })} options={[[1, '1'], [2, '2'], [3, '3'], [4, '4']]} /></>)}
                <h5>Handle</h5>
                <Seg value={c.handle} onChange={(v) => up({ handle: v })} options={[['gola', 'Gola'], ['handle', 'Handle'], ['touch', 'Touch']]} />
              </>
            )}

            {tab === 'finish' && (
              <>
                <h5>Carcass</h5>
                <div className="grid2">
                  {mats.filter((m) => m.carcass).map((m) => (
                    <button key={m.id} className={'sw' + (c.carcass === m.id ? ' on' : '')} onClick={() => up({ carcass: m.id })}><i style={{ background: m.color }} />{m.name}</button>
                  ))}
                </div>
                <h5>Door finish</h5>
                <div className="grid2">
                  {mats.filter((m) => m.door).map((m) => (
                    <button key={m.id} className={'sw' + (c.door === m.id ? ' on' : '')} onClick={() => up({ door: m.id })}><i style={{ background: m.color }} />{m.name}</button>
                  ))}
                </div>
                <button className="btn small" onClick={() => { set((st) => ({ run: st.run.map((r) => ({ ...r, carcass: c.carcass, door: c.door })) })); setSaved(false); }}>Use these finishes on the whole run</button>
              </>
            )}

            {tab === 'inside' && (
              <>
                <div className="row"><h5>Shelves</h5>
                  <div className="step"><button onClick={() => up({ shelves: Math.max(0, c.shelves - 1) })}>−</button><b>{c.shelves}</b><button onClick={() => up({ shelves: Math.min(8, c.shelves + 1) })}>+</button></div></div>
                <div className="row"><h5>Back panel</h5><Seg value={c.back} onChange={(v) => up({ back: v })} options={[[true, 'Yes'], [false, 'No']]} /></div>
                <h5>In the parts list</h5>
                <div className="list">
                  <div><span>Back panel</span><code>{sum.back.toFixed(2)} m²</code></div>
                  <div><span>Edge banding</span><code>{sum.band.toFixed(2)} m</code></div>
                </div>
              </>
            )}

            {tab === 'holes' && (
              <>
                <div className="hole-sum"><span>This cabinet</span><b>{holes.total}</b> holes
                  <div>{Object.entries(holes.byKind).filter(([, n]) => n > 0).map(([k, n]) => <em key={k}><i style={{ background: HOLE_KINDS[k].color }} />{HOLE_KINDS[k].label} {n}</em>)}</div></div>
                <a className="btn primary block" href="#/drilling">Open hole editor</a>
                <h5>Drilled pieces</h5>
                <div className="list">{holes.pieces.map((p) => <div key={p.key}><span>{p.name}{p.qty > 1 ? ` ×${p.qty}` : ''}<small>{p.w} × {p.h} · {p.face}</small></span><code>{p.total}</code></div>)}</div>
              </>
            )}

            {tab === 'parts' && (
              <>
                <div className="stat3"><div><small>Parts</small><b>{sum.parts.length}</b></div><div><small>Board</small><b>{sum.area.toFixed(2)} m²</b></div><div><small>Fittings</small><b>{sum.fits.reduce((a, f) => a + Math.ceil(f.qty), 0)}</b></div></div>
                <h5>Panels</h5>
                <div className="list">{sum.parts.map((p, k) => <div key={k}><span>{p.name}<small>{p.l} × {p.w} × {p.t || 18} mm</small></span><code>{(p.l * p.w * p.qty / 1e6).toFixed(2)} m²</code></div>)}</div>
                <h5>Hardware</h5>
                <div className="list">{sum.fits.map((f) => <div key={f.key}><span>{fit[f.key].name}<small>{fit[f.key].detail}</small></span><code>{f.key === 'plinth' ? f.qty.toFixed(2) + ' m' : '×' + f.qty}</code></div>)}</div>
                <p className="muted tiny">Set prices on the Construct page to see euro totals.</p>
              </>
            )}
          </div>
        </aside>

        <nav className="vtabs">
          {TABS.map(([id, label, d]) => (
            <button key={id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
              <b>{label}</b>
            </button>
          ))}
        </nav>
      </div>

      {saveAsk && (
        <div className="modal" onClick={() => setSaveAsk(false)}>
          <form className="dialog" onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); doSave(name); }}>
            <h3>Save as order</h3>
            <label>Customer<input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Customer name" /></label>
            <div className="row end"><button type="button" className="btn" onClick={() => setSaveAsk(false)}>Cancel</button><button className="btn dark">Save order</button></div>
          </form>
        </div>
      )}
    </div>
  );
}
