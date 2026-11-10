# GACAFERI 1957 — Cabinet price configurator

React + Vite + three.js. Pa login dhe pa backend: të dhënat ruhen në shfletuesin e përdoruesit (localStorage).
Për backup përdor "Export" te faqja Cabinets, dhe "Import backup" për ta rikthyer.

## Nisja lokale
    npm install
    npm run dev

## Deploy në Vercel
Me GitHub (rekomandohet): ngarko folderin në një repo, pastaj vercel.com > Add New > Project > zgjidh repo-n.
Vercel e njeh vetë Vite (Build: npm run build, Output: dist). Klik Deploy.

Pa GitHub: npm i -g vercel, pastaj brenda folderit: vercel (dhe vercel --prod).

## Ku ndryshohen gjërat
- src/engine.js: madhësitë standarde, formulat e pjesëve, vrimave dhe çmimeve
- src/Viewer.jsx: modeli 3D
- Çmimet vendosen në aplikacion: Construct > Prices (€/m² dhe €/copë)
