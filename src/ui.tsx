import type { ReactNode } from "react";

// Piezas compartidas del sistema visual de Domia:
// lienzo azul de marca, tarjetas blancas y un único acento naranja (el del logo).
// Se usan dentro de un contenedor con la clase "ui-page".

const ICONOS: Record<string, ReactNode> = {
  back: <polyline points="15 6 9 12 15 18" />,
  plus: <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>,
  link: <><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></>,
  search: <><circle cx="11" cy="11" r="7" /><line x1="16.5" y1="16.5" x2="21" y2="21" /></>,
  user: <><circle cx="12" cy="8" r="3.2" /><path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" /></>,
  tool: <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.5-.5-.5-2.5z" />,
  eur: <><path d="M17 6.5A6 6 0 1 0 17 17.5" /><line x1="4" y1="10" x2="13" y2="10" /><line x1="4" y1="14" x2="13" y2="14" /></>,
  chev: <polyline points="9 6 15 12 9 18" />,
};

export function UiIcon({ n, s = 16 }: { n: string; s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ICONOS[n]}</svg>
  );
}

const UI_CSS = `
.ui-page{--navy:#1E3A5F;--or:#F59E0B;--soft:#F6F8FB;--hair:#EEF1F5;display:flex;flex-direction:column}
.ui-page *{box-sizing:border-box}
.ui-page button:focus-visible,.ui-page input:focus-visible,.ui-page select:focus-visible{outline:2px solid var(--or);outline-offset:2px}
.ui-ph{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.ui-back{flex:none;width:36px;height:36px;border-radius:11px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.1);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .15s}
.ui-back:hover{background:rgba(255,255,255,.2)}
.ui-ph-t{margin:0;color:#fff;font-size:22px;font-weight:700;letter-spacing:-.01em;line-height:1.15;min-width:0;overflow-wrap:anywhere}
.ui-ph-s{display:block;color:#B9CBE3;font-size:12.5px;font-weight:500;margin-top:3px}
.ui-ph-sp{flex:1}
.ui-ph-a{display:flex;gap:8px;flex-wrap:wrap}
.ui-btn{display:inline-flex;align-items:center;gap:7px;border:0;border-radius:11px;padding:9px 14px;font:inherit;font-size:13px;font-weight:700;cursor:pointer;transition:transform .12s,background .15s,box-shadow .15s;white-space:nowrap}
.ui-btn:active{transform:scale(.97)}
.ui-btn.pri{background:var(--or);color:#2B1A00;box-shadow:0 4px 14px rgba(245,158,11,.28)}
.ui-btn.pri:hover{background:#FBB023}
.ui-btn.ghost{background:rgba(255,255,255,.1);color:#fff;border:1px solid rgba(255,255,255,.2)}
.ui-btn.ghost:hover{background:rgba(255,255,255,.18)}
.ui-tabs{display:flex;gap:22px;margin-top:18px;border-bottom:1px solid rgba(255,255,255,.14);overflow-x:auto}
.ui-tab{background:none;border:0;color:#A9BEDB;font:inherit;font-size:13.5px;font-weight:600;padding:9px 2px 11px;cursor:pointer;position:relative;display:flex;align-items:center;gap:7px;transition:color .15s;white-space:nowrap}
.ui-tab:hover{color:#fff}
.ui-tab[aria-selected="true"]{color:#fff}
.ui-tab[aria-selected="true"]::after{content:"";position:absolute;left:0;right:0;bottom:-1px;height:3px;border-radius:3px 3px 0 0;background:var(--or)}
.ui-tab .n{font-size:11px;font-weight:700;background:rgba(255,255,255,.14);color:#E2ECF8;border-radius:999px;padding:1px 7px}
.ui-tab[aria-selected="true"] .n{background:var(--or);color:#2B1A00}
.ui-kpis{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:16px}
@media (max-width:640px){.ui-kpis{grid-template-columns:minmax(0,1fr)}}
.ui-kpi{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:12px 14px;display:flex;align-items:center;gap:12px;transition:transform .18s,background .18s}
.ui-kpi:hover{transform:translateY(-2px);background:rgba(255,255,255,.12)}
.ui-kpi .ic{flex:none;width:34px;height:34px;border-radius:10px;background:rgba(255,255,255,.12);display:flex;align-items:center;justify-content:center;color:#fff}
.ui-kpi b{display:block;color:#fff;font-size:22px;line-height:1.1;font-weight:700;font-variant-numeric:tabular-nums}
.ui-kpi span.l{display:block;color:#B9CBE3;font-size:12px}
.ui-card{background:#fff;border-radius:16px;box-shadow:0 6px 22px rgba(8,20,40,.18);min-width:0}
.ui-ctl{margin-top:16px;padding:12px;display:flex;gap:10px;flex-wrap:wrap;align-items:center}
.ui-search{flex:1 1 240px;display:flex;align-items:center;gap:8px;background:var(--soft);border:1px solid #E5E9F0;border-radius:11px;padding:0 12px;height:40px;color:#9CA3AF;transition:border-color .15s,background .15s}
.ui-search:focus-within{border-color:var(--navy);background:#fff}
.ui-search input{border:0;outline:0!important;background:none;flex:1;font:inherit;font-size:13.5px;color:#111827;min-width:0;height:100%}
.ui-sel{height:40px;border:1px solid #E5E9F0;background:var(--soft);border-radius:11px;padding:0 10px;font:inherit;font-size:13px;color:#374151;max-width:100%}
.ui-seg{display:inline-flex;background:var(--soft);border:1px solid #E5E9F0;border-radius:11px;padding:3px;gap:2px;flex-wrap:wrap}
.ui-seg button{border:0;background:none;border-radius:8px;padding:6px 12px;font:inherit;font-size:12.5px;font-weight:600;color:#6B7280;cursor:pointer;transition:background .15s,color .15s}
.ui-seg button:hover{color:#111827}
.ui-seg button[aria-pressed="true"]{background:var(--navy);color:#fff;box-shadow:0 1px 3px rgba(0,0,0,.2)}
.ui-tbl{margin-top:14px;overflow:hidden}
.ui-scroll{overflow-x:auto}
.ui-t{width:100%;border-collapse:collapse;min-width:760px}
.ui-t th{text-align:left;font-size:10.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#9CA3AF;background:#FAFBFD;padding:11px 14px;border-bottom:1px solid var(--hair);white-space:nowrap}
.ui-t th.r,.ui-t td.r{text-align:right}
.ui-t td{padding:12px 14px;border-bottom:1px solid #F1F3F7;vertical-align:middle;font-size:13.5px;color:#374151}
.ui-t tbody tr{cursor:pointer;transition:background .12s,box-shadow .12s}
.ui-t tbody tr:hover,.ui-t tbody tr:focus-visible{background:#F1F6FD;box-shadow:inset 3px 0 0 var(--or);outline:none}
.ui-t tbody tr:last-child td{border-bottom:0}
.ui-t tbody tr.off{opacity:.55}
.ui-who{display:flex;align-items:center;gap:11px;min-width:0}
.ui-who b{display:block;color:#111827;font-weight:600;font-size:13.5px;line-height:1.25}
.ui-av{flex:none;width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12.5px;color:#fff}
.ui-chips{display:flex;gap:4px;flex-wrap:wrap;margin-top:3px}
.ui-chip{font-size:10.5px;font-weight:600;background:#EDF1F7;color:#40536E;border-radius:6px;padding:1px 7px;white-space:nowrap}
.ui-days{display:inline-flex;gap:3px}
.ui-d{width:18px;height:18px;border-radius:5px;font-size:9.5px;font-weight:700;display:flex;align-items:center;justify-content:center;background:#F1F3F7;color:#B6BCC8}
.ui-d.on{background:#DDF6EC;color:#047857}
.ui-st{display:inline-flex;align-items:center;gap:6px;font-size:11.5px;font-weight:700;border-radius:999px;padding:3px 10px;white-space:nowrap}
.ui-st i{width:6px;height:6px;border-radius:50%;background:currentColor}
.ui-st.a{background:#DDF6EC;color:#047857}
.ui-st.i{background:#F1F3F7;color:#6B7280}
.ui-num{font-variant-numeric:tabular-nums;font-weight:600;color:#111827}
.ui-mut{color:#B6BCC8}
.ui-go{color:#C4C9D2;width:20px}
.ui-empty{padding:44px 16px;text-align:center;color:#9CA3AF;font-size:13.5px}
.ui-lbl{margin:22px 0 10px;color:#B9CBE3;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase}
.ui-pad{padding:16px}
@media (prefers-reduced-motion: reduce){.ui-page *{transition:none!important}}
`;

export const UiStyles = () => <style>{UI_CSS}</style>;

export function PageHeader({ titulo, subtitulo, onBack, children }: { titulo: ReactNode; subtitulo?: ReactNode; onBack?: () => void; children?: ReactNode }) {
  return (
    <div className="ui-ph">
      {onBack && <button type="button" className="ui-back" onClick={onBack} aria-label="Volver"><UiIcon n="back" s={18} /></button>}
      <div style={{ minWidth: 0 }}>
        <h2 className="ui-ph-t">{titulo}</h2>
        {subtitulo ? <small className="ui-ph-s">{subtitulo}</small> : null}
      </div>
      <div className="ui-ph-sp" />
      {children ? <div className="ui-ph-a">{children}</div> : null}
    </div>
  );
}

export function Boton({ variante = "ghost", icono, onClick, children, title }: { variante?: "pri" | "ghost"; icono?: string; onClick?: () => void; children: ReactNode; title?: string }) {
  return (
    <button type="button" className={`ui-btn ${variante}`} onClick={onClick} title={title}>
      {icono ? <UiIcon n={icono} s={15} /> : null}
      {children}
    </button>
  );
}

export function Tabs({ tabs, value, onChange }: { tabs: { id: string; label: string; count?: number }[]; value: string; onChange: (id: string) => void }) {
  return (
    <div className="ui-tabs" role="tablist">
      {tabs.map((t) => (
        <button key={t.id} type="button" role="tab" className="ui-tab" aria-selected={value === t.id} onClick={() => onChange(t.id)}>
          {t.label}
          {t.count !== undefined && t.count > 0 ? <span className="n">{t.count}</span> : null}
        </button>
      ))}
    </div>
  );
}

export function KpiRow({ items }: { items: { icono: string; valor: ReactNode; etiqueta: string }[] }) {
  return (
    <div className="ui-kpis">
      {items.map((k) => (
        <div className="ui-kpi" key={k.etiqueta}>
          <div className="ic"><UiIcon n={k.icono} s={17} /></div>
          <div><b>{k.valor}</b><span className="l">{k.etiqueta}</span></div>
        </div>
      ))}
    </div>
  );
}

export const Tarjeta = ({ children, className = "" }: { children: ReactNode; className?: string }) => <div className={`ui-card ${className}`}>{children}</div>;
export const Controles = ({ children }: { children: ReactNode }) => <div className="ui-card ui-ctl">{children}</div>;
export const SeccionEtiqueta = ({ children }: { children: ReactNode }) => <div className="ui-lbl">{children}</div>;

export function Buscador({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label className="ui-search">
      <UiIcon n="search" s={16} />
      <input type="search" value={value} placeholder={placeholder} aria-label={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

export function Selector({ value, onChange, etiqueta, children }: { value: string; onChange: (v: string) => void; etiqueta: string; children: ReactNode }) {
  return <select className="ui-sel" value={value} aria-label={etiqueta} onChange={(e) => onChange(e.target.value)}>{children}</select>;
}

export function Segmentado({ opciones, value, onChange, etiqueta }: { opciones: { id: string; label: string }[]; value: string; onChange: (id: string) => void; etiqueta: string }) {
  return (
    <div className="ui-seg" role="group" aria-label={etiqueta}>
      {opciones.map((o) => <button key={o.id} type="button" aria-pressed={value === o.id} onClick={() => onChange(o.id)}>{o.label}</button>)}
    </div>
  );
}

const PALETA = ["#4F7FB8", "#2F9E88", "#C27C3A", "#8B7FC7", "#D0627A", "#5B8DA6", "#7A8CA5"];
export function Avatar({ nombre }: { nombre: string }) {
  const ini = (nombre || "?").split(/\s+/).filter(Boolean).map((x) => x[0]).join("").slice(0, 2).toUpperCase();
  let h = 0;
  for (const ch of nombre || "") h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return <div className="ui-av" style={{ background: PALETA[h % PALETA.length] }} aria-hidden="true">{ini}</div>;
}

export const EstadoActivo = ({ activo }: { activo: boolean }) =>
  activo ? <span className="ui-st a"><i />Activo</span> : <span className="ui-st i"><i />Inactivo</span>;
