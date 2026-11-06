import { useState, type ReactNode } from 'react';
export default function Shell({ number, title, description, children }: { number: string; title: string; description: string; children: ReactNode }) {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  return <><header><span className="brand"><b>{number}</b>DEVELOPER / TOOLS</span><div className="row"><span className="pill">RUANG KERJA LOKAL</span><button onClick={() => { localStorage.setItem('theme', String(!dark ? 'dark' : 'light')); setDark(!dark); }} aria-label="Ganti tema">{dark ? 'Terang' : 'Gelap'}</button></div></header><main><div className="intro"><div><div className="eyebrow">Alat pengembangan · {number} / 10</div><h1>{title}</h1><p>{description}</p></div><span className="tag">DIBUAT UNTUK BEKERJA.</span></div>{children}<footer className="note"><span>{title} / AhmadNurHidayat-23</span><span>Data diproses di perangkat Anda.</span></footer></main></>;
}
