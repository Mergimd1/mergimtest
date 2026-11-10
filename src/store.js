import { useSyncExternalStore } from 'react';
import { DEFAULT_CONSTRUCT, DEFAULT_MATERIALS, DEFAULT_FITTINGS, newCabinet } from './engine';

const KEY = 'gacaferi-configurator-v1';

function init() {
  return {
    orders: [], run: [newCabinet('base')], sel: 0, layouts: [],
    construct: DEFAULT_CONSTRUCT, materials: DEFAULT_MATERIALS, fittings: DEFAULT_FITTINGS,
    orderId: null, look: 'studio', dark: false, mode: 'kitchen',
  };
}
function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && Array.isArray(s.run) && s.run.length) {
      const d = init();
      return { ...d, ...s, construct: { ...d.construct, ...s.construct }, fittings: { ...d.fittings, ...s.fittings } };
    }
  } catch { /* first run or storage blocked */ }
  return init();
}

let state = load();
const subs = new Set();
export const getState = () => state;
export function set(p) {
  state = { ...state, ...(typeof p === 'function' ? p(state) : p) };
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
  subs.forEach((f) => f());
}
export const useStore = () =>
  useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, getState);

export function updateCab(index, patch) {
  set((s) => ({ run: s.run.map((c, i) => (i === index ? { ...c, ...(typeof patch === 'function' ? patch(c) : patch) } : c)) }));
}
export function nextOrderNumber(orders) {
  const y = new Date().getFullYear();
  const n = orders.reduce((m, o) => Math.max(m, parseInt(o.number.split('-')[2] || '0', 10)), 0) + 1;
  return `P-${y}-${String(n).padStart(3, '0')}`;
}
export function exportBackup() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `gacaferi-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
}
export function importBackup(text) {
  const s = JSON.parse(text);
  if (!s.run) throw new Error('Not a configurator backup');
  set({ ...init(), ...s });
}
