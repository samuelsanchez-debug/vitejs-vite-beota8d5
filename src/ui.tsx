import { useEffect, useState } from "react";
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
  warn: <><path d="M12 3 2 20h20z" /><line x1="12" y1="10" x2="12" y2="14" /><circle cx="12" cy="17.2" r=".6" fill="currentColor" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" /></>,
  check: <><circle cx="12" cy="12" r="9" /><polyline points="8.5 12.5 11 15 15.5 9.5" /></>,
  tick: <polyline points="20 6 9 17 4 12" />,
  bell: <><path d="M12 4a4 4 0 0 0-4 4v3.4c0 .6-.2 1.2-.6 1.7L6 15h12l-1.4-1.9c-.4-.5-.6-1.1-.6-1.7V8a4 4 0 0 0-4-4z" /><path d="M10 18a2 2 0 0 0 4 0" /></>,
  shield: <path d="M12 3 5 6v6c0 4.5 3 7.6 7 9 4-1.4 7-4.5 7-9V6z" />,
  repeat: <><polyline points="17 2 21 6 17 10" /><path d="M3 11V9a3 3 0 0 1 3-3h15" /><polyline points="7 22 3 18 7 14" /><path d="M21 13v2a3 3 0 0 1-3 3H3" /></>,
  dot: <circle cx="12" cy="12" r="4" />,
  edit: <><path d="M4 20h4L19 9l-4-4L4 16z" /><line x1="13.5" y1="6.5" x2="17.5" y2="10.5" /></>,
  chevd: <polyline points="6 9 12 15 18 9" />,
  note: <path d="M4 5h16v11H9l-5 4z" />,
  doc: <><path d="M6 3h9l4 4v14H6z" /><polyline points="14 3 14 8 19 8" /></>,
  image: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="1.8" /><path d="M21 16l-5-5-8 8" /></>,
  lock: <><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" /></>,
  upload: <><path d="M12 16V4M7 9l5-5 5 5" /><path d="M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3" /></>,
  pin: <><path d="M12 21s7-6.2 7-11a7 7 0 0 0-14 0c0 4.8 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></>,
  phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />,
  trash: <><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><line x1="3" y1="10" x2="21" y2="10" /><line x1="8" y1="3" x2="8" y2="7" /><line x1="16" y1="3" x2="16" y2="7" /></>,
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
.ui-st.w{background:#FEF3C7;color:#B45309}
.ui-st.r{background:#FEE2E2;color:#B91C1C}
.ui-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:12px;margin-top:14px}
@media (max-width:420px){.ui-cards{grid-template-columns:minmax(0,1fr)}}
.ui-inc{padding:14px;display:flex;flex-direction:column;gap:10px;transition:transform .15s,box-shadow .15s}
.ui-inc:hover{transform:translateY(-2px);box-shadow:0 10px 28px rgba(8,20,40,.24)}
.ui-inc-h{display:flex;align-items:center;gap:11px}
.ui-inc-h .x{flex:1;min-width:0}
.ui-inc-h b{display:block;color:#111827;font-size:14px;font-weight:700;line-height:1.25}
.ui-inc-h small{display:block;color:#6B7280;font-size:12px;overflow-wrap:anywhere}
.ui-tile{flex:none;width:36px;height:36px;border-radius:11px;display:flex;align-items:center;justify-content:center;color:#fff}
.ui-box{display:flex;gap:8px;align-items:flex-start;background:var(--soft);border-radius:10px;padding:9px 11px;font-size:13px;color:#374151;line-height:1.45}
.ui-box svg{flex:none;margin-top:2px;color:#9CA3AF}
.ui-box.teal{background:#ECFAF7;color:#115E59}.ui-box.teal svg{color:#14B8A6}
.ui-box.ok{background:#EAF8F1;color:#065F46}.ui-box.ok svg{color:#10B981}
.ui-inc-a{display:flex;gap:6px;flex-wrap:wrap;margin-top:auto}
.ui-sbtn{display:inline-flex;align-items:center;justify-content:center;gap:6px;border:0;border-radius:9px;padding:7px 11px;font:inherit;font-size:12px;font-weight:700;cursor:pointer;background:#F1F3F7;color:#4B5563;transition:background .15s,transform .12s}
.ui-sbtn:active{transform:scale(.97)}
.ui-sbtn:hover{background:#E6EAF1}
.ui-sbtn.pri{background:var(--navy);color:#fff}.ui-sbtn.pri:hover{background:#152d4a}
.ui-sbtn.wa{background:#E3F8EA;color:#15803D}.ui-sbtn.wa:hover{background:#CDF1DA}
.ui-sbtn.warn{background:#FEF3C7;color:#B45309}.ui-sbtn.warn:hover{background:#FDE9A0}
.ui-sbtn.ok{background:#DDF6EC;color:#047857}.ui-sbtn.ok:hover{background:#C6EEDD}
.ui-sbtn.danger{background:#FEECEC;color:#DC2626;margin-left:auto}.ui-sbtn.danger:hover{background:#FCD9D9}
.ui-cli{background:var(--soft);border-radius:12px;padding:10px 12px;display:flex;flex-direction:column;gap:5px}
.ui-cli .n{display:flex;align-items:center;gap:7px;font-size:13.5px;font-weight:700;color:#111827}
.ui-cli .n svg{color:#9CA3AF;flex:none}
.ui-cli .r{display:flex;align-items:flex-start;gap:7px;font-size:12.5px;color:#6B7280;overflow-wrap:anywhere}
.ui-cli .r svg{color:#B6BCC8;flex:none;margin-top:2px}
.ui-sug{background:#FFF8E8;border:1px solid #FBE3AE;border-radius:12px;padding:10px 12px;display:flex;flex-direction:column;gap:8px;margin-top:auto}
.ui-sug .t{display:flex;align-items:center;gap:7px;font-size:12.5px;color:#92400E}
.ui-sug .t b{color:#78350F}
.ui-sug .a{display:flex;gap:6px;flex-wrap:wrap}
.ui-dash{margin-top:auto;border:1.5px dashed #CBD2DC;background:#fff;color:#6B7280;padding:10px}
.ui-dash:hover{border-color:var(--navy);color:var(--navy);background:#fff}
.ui-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;background:var(--soft);border-radius:12px;padding:10px 6px;text-align:center}
.ui-stats b{display:block;font-size:15px;font-weight:700;color:#111827;font-variant-numeric:tabular-nums}
.ui-stats b.g{color:#059669}.ui-stats b.r{color:#DC2626}
.ui-stats span{display:block;font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#9CA3AF;margin-top:1px}
.ui-prog{height:6px;border-radius:99px;background:#E8ECF2;overflow:hidden}
.ui-prog i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#34D399,#10B981);transition:width .6s cubic-bezier(.2,.8,.2,1)}
.ui-movs{display:flex;flex-direction:column;gap:6px}
.ui-mov{display:flex;align-items:center;gap:8px;background:#F3FAF6;border-radius:10px;padding:8px 10px}
.ui-mov .x{flex:1;min-width:0}
.ui-mov .x b{font-size:13px;color:#065F46;font-variant-numeric:tabular-nums}
.ui-mov .x span{font-size:12px;color:#047857;margin-left:6px}
.ui-mov .x small{display:block;font-size:11.5px;color:#6B7280;overflow-wrap:anywhere}
.ui-ib{flex:none;width:28px;height:28px;border-radius:8px;border:0;background:transparent;color:#6B7280;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .15s,color .15s}
.ui-ib:hover{background:#E1EEE7;color:#065F46}
.ui-ib.del:hover{background:#FDE2E2;color:#DC2626}
.ui-ven{display:inline-flex;align-items:center;gap:6px;align-self:flex-start;font-size:11.5px;font-weight:700;border-radius:8px;padding:4px 9px}
.ui-ven.r{background:#FEE2E2;color:#B91C1C}.ui-ven.o{background:#FFEDD5;color:#C2410C}.ui-ven.b{background:#E7F0FD;color:#2563EB}
.ui-kpis.k5{grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}
@media (max-width:900px){.ui-kpis.k5{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media (max-width:520px){.ui-kpis.k5{grid-template-columns:repeat(2,minmax(0,1fr))}}
.ui-chipb{border:1px solid #E5E9F0;background:#fff;border-radius:10px;padding:0 11px;height:40px;font:inherit;font-size:12.5px;font-weight:600;color:#6B7280;cursor:pointer;transition:background .15s,color .15s}
.ui-chipb:hover{color:#111827}
.ui-chipb[aria-pressed="true"]{background:#374151;color:#fff;border-color:#374151}
.ui-link{border:0;background:none;font:inherit;font-size:12.5px;font-weight:700;color:#6B7280;cursor:pointer;padding:0 6px}
.ui-link:hover{color:#111827}
.ui-av-sin{background:#EF6B6B!important}
.ui-ahead{display:flex;align-items:center;gap:8px;color:#fff;font-size:13px;font-weight:700;margin:16px 0 8px}
.ui-ahead .n{background:var(--or);color:#2B1A00;border-radius:999px;font-size:11px;padding:1px 8px}
.ui-arow{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:10px;align-items:start}
@media (max-width:420px){.ui-arow{grid-template-columns:minmax(0,1fr)}}
.ui-ac{background:#fff;border-radius:14px;border-left:4px solid var(--or);box-shadow:0 6px 18px rgba(8,20,40,.18);padding:12px 13px;display:flex;flex-direction:column;gap:8px;min-width:0}
.ui-ac-h{display:flex;align-items:center;gap:10px}
.ui-ac-h .x{flex:1;min-width:0;cursor:pointer}
.ui-ac-h b{display:block;font-size:13.5px;color:#111827;line-height:1.25;overflow-wrap:anywhere}
.ui-ac-h small{display:block;font-size:11.5px;color:#6B7280}
.ui-nov{display:inline-flex;align-items:center;gap:6px;background:#FFF7E6;color:#B45309;font-size:11.5px;font-weight:700;border-radius:8px;padding:4px 9px;align-self:flex-start;overflow-wrap:anywhere}
.ui-ac-a{display:flex;gap:6px;flex-wrap:wrap}
.ui-ib2{width:30px;height:30px;padding:0}
.ui-ac .chev{transition:transform .2s}
.ui-ac[data-open="true"] .chev{transform:rotate(180deg)}
.ui-det{display:none;border-top:1px dashed #E1E5EB;padding-top:10px;flex-direction:column;gap:10px;font-size:12.5px;color:#374151}
.ui-ac[data-open="true"] .ui-det{display:flex}
.ui-det .g{display:grid;grid-template-columns:1fr 1fr;gap:8px 12px}
.ui-det .g .w{grid-column:1/-1}
.ui-det .k{font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#9CA3AF;margin-bottom:1px}
.ui-det a{color:var(--navy);font-weight:600;text-decoration:none}
.ui-det a:hover{text-decoration:underline}
.ui-det .eco{display:flex;align-items:center;justify-content:space-between;background:var(--soft);border-radius:10px;padding:8px 10px;text-align:center}
.ui-det .eco b{display:block;font-size:15px}
.ui-det .eco span{font-size:10px;color:#9CA3AF}
.ui-det .eco i{font-style:normal;color:#C4C9D2;font-weight:700}
.ui-full{width:100%}
.ui-sbtn.info{background:#E7F0FD;color:#1D4ED8}.ui-sbtn.info:hover{background:#D5E5FB}
.ui-board{margin-top:16px;display:flex;flex-direction:column;gap:16px}
.ui-lane{display:flex;gap:10px;overflow-x:auto;padding-bottom:6px;scroll-snap-type:x proximity;-webkit-overflow-scrolling:touch}
.ui-lh{flex:none;width:210px;background:#fff;border-radius:14px;padding:12px;display:flex;flex-direction:column;gap:6px;scroll-snap-align:start;box-shadow:0 6px 18px rgba(8,20,40,.18)}
.ui-lh .who{display:flex;align-items:center;gap:10px}
.ui-lh b{font-size:13.5px;color:#111827;line-height:1.2;overflow-wrap:anywhere}
.ui-lh .m{display:flex;gap:10px;font-size:11.5px;color:#6B7280}
.ui-lh .m strong{color:#111827;font-size:15px;display:block;line-height:1.1}
.ui-lh .lk{margin-top:auto;border:0;background:none;color:var(--navy);font:inherit;font-size:12px;font-weight:700;text-align:left;cursor:pointer;padding:0}
.ui-lh .tg{border:0;background:#F1F3F7;border-radius:8px;font:inherit;font-size:11.5px;font-weight:700;color:#4B5563;padding:5px 8px;cursor:pointer;align-self:flex-start}
.ui-col{flex:none;width:200px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:9px;scroll-snap-align:start;display:flex;flex-direction:column;gap:7px}
.ui-tcol{flex:none;width:262px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:10px;display:flex;flex-direction:column;gap:7px;scroll-snap-align:start}
.ui-col-h{display:flex;align-items:center;gap:7px;color:#fff;font-size:11.5px;font-weight:700;padding:1px 3px}
.ui-col-h i{width:8px;height:8px;border-radius:50%}
.ui-col-h .c{margin-left:auto;background:rgba(255,255,255,.14);border-radius:999px;padding:0 8px;font-size:11px}
.ui-tcol .ui-col-h{padding:2px 4px 6px}
.ui-tcol .ui-av{width:28px;height:28px;border-radius:9px;font-size:11px}
.ui-mc{position:relative;background:#fff;border-radius:11px;padding:9px 10px 9px 12px;cursor:pointer;transition:transform .14s,box-shadow .14s;box-shadow:0 2px 6px rgba(8,20,40,.12)}
.ui-mc::before{content:"";position:absolute;left:0;top:8px;bottom:8px;width:3px;border-radius:0 3px 3px 0;background:var(--p,#CBD2DC)}
.ui-mc:hover,.ui-mc:focus-visible{transform:translateY(-2px);box-shadow:0 8px 18px rgba(8,20,40,.25);outline:none}
.ui-mc .t{display:flex;align-items:center;gap:6px;font-size:11px;font-weight:700;color:#4B5563}
.ui-mc .tl{width:20px;height:20px;border-radius:6px;background:#E8EEF5;color:var(--navy);display:flex;align-items:center;justify-content:center;flex:none}
.ui-mc .tl svg{width:13px;height:13px}
.ui-mc .id{margin-left:auto;color:#9CA3AF;font-weight:600}
.ui-mc.hay .id{margin-right:16px}
.ui-mc .cl{font-size:12.5px;font-weight:700;color:#111827;margin-top:5px;line-height:1.25;overflow-wrap:anywhere}
.ui-mc .dr{font-size:10.5px;color:#9CA3AF;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ui-mc .f{display:flex;align-items:center;gap:6px;margin-top:6px}
.ui-mc .f b{font-size:12px;color:#111827;font-variant-numeric:tabular-nums}
.ui-mc .f span{font-size:10.5px;color:#9CA3AF;margin-left:auto}
.ui-mc .es{display:inline-flex;align-items:center;gap:5px;font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:#6B7280;margin-top:5px}
.ui-mc .es i{width:6px;height:6px;border-radius:50%}
.ui-mc .dot{position:absolute;right:8px;top:8px;width:9px;height:9px;border-radius:50%;background:var(--or);box-shadow:0 0 0 3px rgba(245,158,11,.25)}
.ui-vac{color:#B9CBE3;font-size:12px;padding:8px 4px}
.ui-chipb.avs{display:inline-flex;align-items:center;gap:6px}
.ui-chipb.avs i{width:8px;height:8px;border-radius:50%;background:var(--or)}
.ui-chipb.avs[aria-pressed="true"]{background:var(--or);color:#2B1A00;border-color:var(--or)}
.ui-det.on{display:flex}
.ui-kb{margin-top:14px;display:flex;gap:10px;overflow-x:auto;padding-bottom:8px;align-items:flex-start}
.ui-kcol{flex:1 0 210px;max-width:300px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:9px;display:flex;flex-direction:column;gap:7px;min-height:130px;transition:background .15s,border-color .15s}
.ui-kcol.over{background:rgba(245,158,11,.18);border-color:var(--or)}
.ui-kcol .ui-col-h .v{font-size:10.5px;font-weight:600;color:#B9CBE3}
.ui-kcol .ui-col-h .c{margin-left:0}
.ui-kcol .ui-col-h .v{margin-left:auto}
.ui-mc.arr{opacity:.4}
.ui-mc[draggable="true"]{cursor:grab}
.ui-mc .co{display:flex;align-items:center;gap:5px;font-size:10.5px;color:#6B7280;margin-top:2px}
.ui-mc .co.sin{color:#9CA3AF;font-style:italic}
.ui-ls{margin-top:14px;overflow:hidden}
.ui-gtools{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid var(--hair);flex-wrap:wrap;font-size:12.5px;color:#6B7280}
.ui-gh{padding:8px 12px;background:#F6F8FB;font-size:11.5px;font-weight:700;color:#4B5563;cursor:pointer;user-select:none;display:flex;gap:6px;align-items:center}
.ui-gh span{color:#9CA3AF;font-weight:600}
.ui-lc{display:flex;flex-direction:column;gap:7px;padding:11px 12px;border-bottom:1px solid #F1F3F7;cursor:pointer;position:relative}
.ui-lc:active{background:#F1F6FD}
.ui-lc .a{display:flex;align-items:center;gap:10px}
.ui-lc .a .x{flex:1;min-width:0}
.ui-lc b.n{font-size:13.5px;color:#111827;display:flex;align-items:center;gap:6px}
.ui-lc small{font-size:11.5px;color:#6B7280;display:block}
.ui-lc .m{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.ui-lc .m .d{font-size:11.5px;color:#9CA3AF}
.ui-lc .dotn{width:9px;height:9px;border-radius:50%;background:var(--or);box-shadow:0 0 0 3px rgba(245,158,11,.25);flex:none}
.ui-shade{position:fixed;inset:0;background:rgba(8,20,40,.5);z-index:60;animation:uifade .15s ease}
.ui-drawer{position:fixed;top:0;right:0;bottom:0;width:min(420px,100%);background:#fff;color:#111827;z-index:61;padding:18px;display:flex;flex-direction:column;gap:12px;overflow:auto;box-shadow:-10px 0 40px rgba(8,20,40,.3);animation:uislide .2s ease}
@media (max-width:640px){.ui-drawer{top:auto;width:100%;max-height:86vh;border-radius:18px 18px 0 0;animation:uiup .2s ease}}
@keyframes uifade{from{opacity:0}to{opacity:1}}
@keyframes uislide{from{transform:translateX(24px);opacity:.6}to{transform:none;opacity:1}}
@keyframes uiup{from{transform:translateY(24px);opacity:.6}to{transform:none;opacity:1}}
.ui-drawer .cerrar{align-self:flex-end;border:0;background:#F1F3F7;border-radius:9px;width:30px;height:30px;cursor:pointer;font-size:18px;line-height:1;color:#4B5563}
.ui-panel{display:flex;flex-direction:column;gap:12px}
.ui-panel-h{display:flex;align-items:center;gap:11px}
.ui-panel-h h3{margin:0;font-size:18px;line-height:1.2;color:#111827;overflow-wrap:anywhere}
.ui-panel-h .k{font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#9CA3AF}
.ui-undo{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);background:#111827;color:#fff;border-radius:12px;padding:10px 16px;font-size:13px;z-index:70;display:flex;gap:14px;align-items:center;box-shadow:0 10px 30px rgba(0,0,0,.35);max-width:calc(100vw - 24px)}
.ui-undo button{border:0;background:none;color:#FBB023;font:inherit;font-weight:700;cursor:pointer}
a.ui-sbtn{text-decoration:none}
.ui-pp-calc{display:flex;align-items:center;justify-content:space-between;gap:6px;padding:14px 10px;text-align:center;box-shadow:0 1px 2px rgba(16,24,40,.06)}
.ui-pp-calc>div{flex:1;min-width:0}
.ui-pp-calc b{display:block;font-size:22px;font-weight:800;font-variant-numeric:tabular-nums;line-height:1.1}
.ui-pp-calc span.l{display:block;font-size:10.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#9CA3AF;margin-top:2px}
.ui-pp-calc i{font-style:normal;color:#CBD2DC;font-weight:700;font-size:18px;flex:none}
.ui-pp-pct{display:inline-block;background:#E7F0FD;color:#2563EB;font-size:11px;font-weight:700;border-radius:999px;padding:1px 8px;margin-top:4px}
.ui-pp-sec{padding:14px 16px;display:flex;flex-direction:column;gap:12px;box-shadow:0 1px 2px rgba(16,24,40,.06)}
.ui-pp-sh{display:flex;align-items:center;gap:10px}
.ui-pp-sh .t{flex:1;min-width:0}
.ui-pp-sh b{display:block;font-size:14.5px;color:#111827;line-height:1.2}
.ui-pp-sh small{display:block;font-size:12px;color:#6B7280;overflow-wrap:anywhere}
.ui-pp-ic{flex:none;width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;color:#fff}
.ui-pp-row{display:flex;align-items:center;gap:10px;background:var(--soft);border-radius:12px;padding:10px 12px;flex-wrap:wrap}
.ui-pp-row .x{flex:1;min-width:120px}
.ui-pp-row b{display:block;font-size:13px;color:#111827;overflow-wrap:anywhere}
.ui-pp-row small{display:block;font-size:11.5px;color:#6B7280}
.ui-pp-fico{flex:none;width:34px;height:34px;border-radius:9px;background:#EEF1F7;color:#40536E;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;letter-spacing:.04em}
.ui-pp-drop{display:flex;flex-direction:column;align-items:center;gap:4px;border:2px dashed #CBD2DC;border-radius:12px;padding:16px;cursor:pointer;color:#6B7280;font-size:13px;font-weight:600;transition:border-color .15s,background .15s;text-align:center}
.ui-pp-drop:hover{border-color:var(--navy);background:#F3F7FC;color:var(--navy)}
.ui-pp-drop small{font-weight:400;font-size:11.5px;color:#9CA3AF}
.ui-pp-field{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.ui-pp-field label{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#9CA3AF;width:92px;flex:none}
.ui-pp-inp{display:flex;align-items:center;gap:6px;border:1px solid #E1E6EE;background:#fff;border-radius:11px;padding:0 12px;height:40px;width:150px}
.ui-pp-inp:focus-within{border-color:var(--navy)}
.ui-pp-inp input{border:0;outline:0!important;width:100%;font:inherit;font-size:16px;font-weight:700;color:#DC2626;background:none;font-variant-numeric:tabular-nums}
.ui-pp-inp span{color:#9CA3AF;font-weight:700}
.ui-pp-hint{font-size:11.5px;color:#9CA3AF}
.ui-pp-quote{margin:0;padding:2px 0 2px 12px;border-left:2px solid #E5E7EB;font-size:13px;color:#4B5563}
.ui-pp-quote b{display:block;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#9CA3AF}
.ui-pp-lines{display:flex;flex-direction:column;gap:6px;font-size:13px;color:#374151}
.ui-pp-lines>div{display:flex;justify-content:space-between;gap:10px}
.ui-pp-lines b{font-variant-numeric:tabular-nums}
.ui-pp-lines .tot{border-top:1px solid #E5E7EB;padding-top:7px;font-size:14px;font-weight:700;color:#111827}
.ui-pp-lines .mut{color:#6B7280}
.ui-pp-cob{display:flex;flex-direction:column;gap:6px;border-top:1px solid var(--hair);padding-top:10px}
.ui-pp-cob .h{display:flex;justify-content:space-between;font-size:10.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#9CA3AF}
.ui-pp-cob .h b{color:#6B7280}
.ui-pp-cob .r{display:flex;align-items:center;justify-content:space-between;background:var(--soft);border-radius:11px;padding:8px 12px}
.ui-pp-cob .r small{display:block;font-size:11.5px;color:#6B7280}
.ui-pp-cob .r b{font-size:14px;color:#111827;font-variant-numeric:tabular-nums}
.ui-pp-acts{display:flex;gap:8px;flex-wrap:wrap}
.ui-pp-v{border-top:1px solid var(--hair);padding-top:8px}
.ui-pp-v summary{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#9CA3AF;cursor:pointer}
.ui-pp-v a{display:block;font-size:12.5px;color:#6B7280;padding:5px 2px;text-decoration:none}
.ui-pp-v a:hover{color:#111827}
.ui-fotos{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:8px}
.ui-fotos a{display:block;border-radius:12px;overflow:hidden;background:#EEF1F7;aspect-ratio:1/1;transition:transform .15s,box-shadow .15s}
.ui-fotos a:hover{transform:translateY(-2px);box-shadow:0 8px 18px rgba(8,20,40,.18)}
.ui-fotos img{width:100%;height:100%;object-fit:cover;display:block}
.ui-nota{width:100%;border:1px solid #E5E9F0;background:var(--soft);border-radius:12px;padding:12px 14px;font:inherit;font-size:14px;line-height:1.55;color:#374151;resize:vertical;min-height:140px}
.ui-nota:focus{outline:none;border-color:var(--navy);background:#fff}
.ui-nota::placeholder{color:#9CA3AF}
.ui-tl{list-style:none;margin:0;padding:0;position:relative;display:flex;flex-direction:column;max-height:420px;overflow:auto}
.ui-tl::before{content:"";position:absolute;left:5px;top:8px;bottom:8px;width:2px;background:#E8ECF2}
.ui-tl li{position:relative;display:flex;gap:12px;padding:6px 0 10px}
.ui-tl li i{flex:none;width:12px;height:12px;border-radius:50%;margin-top:4px;box-shadow:0 0 0 3px #fff;position:relative;z-index:1}
.ui-tl li b{display:block;font-size:13px;font-weight:600;color:#1F2937;line-height:1.4;overflow-wrap:anywhere}
.ui-tl li small{display:block;font-size:11.5px;color:#9CA3AF;margin-top:1px}
.ui-pp-total{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;border-radius:14px;padding:14px 16px;color:#fff;background:linear-gradient(160deg,#2D5A8E,#1E3A5F)}
.ui-pp-total .l{display:block;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#BFD3EA}
.ui-pp-total>div>b{display:block;font-size:30px;line-height:1.1;font-weight:800;letter-spacing:-.01em;font-variant-numeric:tabular-nums}
.ui-pp-total .parts{display:flex;gap:18px;flex-wrap:wrap}
.ui-pp-total .parts span{display:block;font-size:11px;color:#BFD3EA}
.ui-pp-total .parts b{display:block;font-size:15px;font-variant-numeric:tabular-nums}
.ui-pp-cob2{display:flex;flex-direction:column;gap:10px;background:var(--soft);border-radius:14px;padding:14px}
.ui-pp-cob2 .h{display:flex;align-items:center;justify-content:space-between;gap:8px}
.ui-pp-cob2 .h b{font-size:13.5px;color:#111827}
.ui-pp-cob2 .h span{font-size:12px;font-weight:700;color:#059669;background:#DDF6EC;border-radius:999px;padding:2px 10px}
.ui-pp-cob2 .sum{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;font-size:12.5px;color:#6B7280}
.ui-pp-cob2 .sum b{font-variant-numeric:tabular-nums;color:#111827}
.ui-prog.sm{height:4px}
.ui-steps{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin-top:2px}
.ui-steps .step{background:#fff;border:1px solid #E8ECF2;border-radius:12px;padding:10px 12px;display:flex;flex-direction:column;gap:6px;transition:border-color .2s,background .2s}
.ui-steps .step.ok{background:#EAF8F1;border-color:#BFE8D4}
.ui-steps .step.part{background:#FFF8E6;border-color:#FBE3AE}
.ui-steps .top{display:flex;align-items:center;gap:8px}
.ui-steps .n{flex:none;width:22px;height:22px;border-radius:50%;background:#E8ECF2;color:#6B7280;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center}
.ui-steps .ok .n{background:#10B981;color:#fff}
.ui-steps .part .n{background:#F59E0B;color:#fff}
.ui-steps small{font-size:11.5px;font-weight:600;color:#6B7280}
.ui-steps b{font-size:17px;font-weight:800;color:#111827;font-variant-numeric:tabular-nums}
.ui-steps .ui-st{align-self:flex-start}
.ui-pp-pay{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;border:1px dashed #CBD2DC;border-radius:14px;padding:12px 14px}
.ui-pp-pay .t{flex:1 1 220px;min-width:0}
.ui-pp-pay .t b{display:block;font-size:13.5px;color:#111827}
.ui-pp-pay .t small{display:block;font-size:11.5px;color:#9CA3AF;line-height:1.35}
.ui-pp-pay .c{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.ui-pp-pay input{width:72px;height:36px;border:1px solid #E1E6EE;border-radius:10px;padding:0 10px;font:inherit;font-size:15px;font-weight:700;text-align:right;color:#111827;background:#fff}
.ui-pp-pay input:focus{outline:none;border-color:var(--navy)}
.ui-pp-pay .res{font-size:14px;font-weight:800;color:#1E3A5F;font-variant-numeric:tabular-nums;min-width:80px}
.ui-attn{margin-top:16px;border-left:4px solid var(--or);overflow:hidden}
.ui-attn-h{display:flex;align-items:center;gap:8px;padding:12px 14px 6px;font-size:13px;font-weight:700;color:#92400E}
.ui-attn-h .n{background:var(--or);color:#2B1A00;border-radius:999px;font-size:11px;padding:1px 8px}
.ui-attn-r{display:flex;align-items:center;gap:10px;padding:10px 14px;border-top:1px solid var(--hair)}
.ui-attn-r .x{flex:1;min-width:0}
.ui-attn-r .x b{display:block;color:#111827;font-size:13.5px}
.ui-attn-r .x span{display:block;color:#6B7280;font-size:12px}
.ui-attn-r .a{flex:none;display:flex;gap:6px}
.ui-t th.sort{cursor:pointer;user-select:none}
.ui-t th.sort:hover{color:#374151}
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

export function KpiRow({ items }: { items: { icono?: string; valor: ReactNode; etiqueta: string }[] }) {
  return (
    <div className={`ui-kpis${items.length === 5 ? " k5" : ""}`}>
      {items.map((k) => (
        <div className="ui-kpi" key={k.etiqueta}>
          {k.icono ? <div className="ic"><UiIcon n={k.icono} s={17} /></div> : null}
          <div style={{ minWidth: 0 }}><b>{k.valor}</b><span className="l">{k.etiqueta}</span></div>
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

// Verdadero cuando la pantalla es estrecha (móvil o ventana pequeña)
export function useEstrecho(px = 700): boolean {
  const consulta = `(max-width:${px}px)`;
  const [e, setE] = useState(() => typeof window !== "undefined" && window.matchMedia(consulta).matches);
  useEffect(() => {
    const m = window.matchMedia(consulta);
    const f = () => setE(m.matches);
    m.addEventListener("change", f);
    f();
    return () => m.removeEventListener("change", f);
  }, [consulta]);
  return e;
}

// Cajón: panel lateral en escritorio y hoja inferior en móvil
export function Cajon({ abierto, onCerrar, children }: { abierto: boolean; onCerrar: () => void; children: ReactNode }) {
  useEffect(() => {
    if (!abierto) return;
    const f = (ev: KeyboardEvent) => { if (ev.key === "Escape") onCerrar(); };
    document.addEventListener("keydown", f);
    return () => document.removeEventListener("keydown", f);
  }, [abierto, onCerrar]);
  if (!abierto) return null;
  return (
    <>
      <div className="ui-shade" onClick={onCerrar} />
      <aside className="ui-drawer" role="dialog" aria-modal="true" aria-label="Detalle del trabajo">
        <button type="button" className="cerrar" onClick={onCerrar} aria-label="Cerrar">&times;</button>
        {children}
      </aside>
    </>
  );
}
