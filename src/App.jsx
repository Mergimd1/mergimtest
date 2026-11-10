import { useEffect, useState } from 'react';
import { useStore, set } from './store';
import Configure from './Configure.jsx';
import { Orders, Cabinets, Layouts, CutList, Drilling, Construct } from './pages.jsx';

const NAV = [
  ['orders', 'Orders', 'M3 7h6l2 2h10v10H3z'],
  ['configure', 'Configure', 'M5 4v16M12 4v16M19 4v16M3 9h4M10 15h4M17 8h4'],
  ['cabinets', 'Cabinets', 'M4 6h16M4 12h10M4 18h16'],
  ['layouts', 'Layouts', 'M4 20V10h5v10M10 20V4h5v16M16 20v-8h4v8'],
  ['cutlist', 'Cut list', 'M4 4h16v16H4zM4 12h16M12 4v16'],
  ['drilling', 'Drilling', 'M7 7h.01M12 7h.01M17 7h.01M7 12h.01M12 12h.01M17 12h.01M7 17h.01M12 17h.01M17 17h.01'],
  ['construct', 'Construct', 'M4 4h16v16H4zM12 4v16M4 10h8'],
];

const route = () => (location.hash.replace(/^#\/?/, '').split('/')[0] || 'orders');

export default function App() {
  const s = useStore();
  const [page, setPage] = useState(route());
  useEffect(() => {
    const f = () => setPage(route());
    window.addEventListener('hashchange', f);
    return () => window.removeEventListener('hashchange', f);
  }, []);
  useEffect(() => { document.documentElement.dataset.theme = s.dark ? 'dark' : 'light'; }, [s.dark]);

  const badge = { orders: s.orders.filter((o) => !['delivered', 'cancelled'].includes(o.status)).length, cabinets: s.run.length, layouts: s.layouts.length };
  const Page = { orders: Orders, configure: Configure, cabinets: Cabinets, layouts: Layouts, cutlist: CutList, drilling: Drilling, construct: Construct }[page] || Orders;

  return (
    <div className="shell">
      <nav className="rail">
        <a className="logo" href="#/orders" aria-label="Orders"><span>G</span></a>
        {NAV.map(([id, label, d]) => (
          <a key={id} href={`#/${id}`} className={'nav' + (page === id ? ' on' : '')}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
            {badge[id] ? <i className="badge">{badge[id]}</i> : null}
            <b>{label}</b>
          </a>
        ))}
        <div className="grow" />
        <button className="nav" onClick={() => set({ dark: !s.dark })} title="Light / dark">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 13a9 9 0 1 1-10-10 7 7 0 0 0 10 10z" /></svg>
          <b>{s.dark ? 'Light' : 'Dark'}</b>
        </button>
      </nav>
      <main className={page === 'configure' ? 'main wide' : 'main'}><Page /></main>
    </div>
  );
}
