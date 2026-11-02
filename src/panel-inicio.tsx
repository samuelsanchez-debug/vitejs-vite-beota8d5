import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

// Panel de Inicio: trabajos, novedades y tareas, y panel económico.
// Todo sale de los datos que el CRM ya guarda; se refresca solo cada 30 segundos.

type Per = "7" | "30" | "12";
type Serie = "nuevas" | "comp" | "canc";
type Item = { id: any; txt: string; extra?: string };
type Grupo = {
  key: string; tipo: "novedad" | "tarea"; hot?: boolean; color: string; icono: string;
  titulo: string; sub: string; items: Item[];
  ver: (it: Item) => void; descartar?: () => Promise<void>;
};
type Props = {
  data: any; setData: (f: any) => void; go: (s: string) => void; setTid: (id: any) => void;
  toast: (m: string) => void; verEconomico: boolean; supabase: SupabaseClient;
};

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sept", "oct", "nov", "dic"];
const DIA_INI = ["D", "L", "M", "X", "J", "V", "S"];
const ESTADOS_VIVOS = ["Solicitud", "Presupuestando", "Colaborador disponible", "Visita propuesta", "Cliente confirmó", "Presupuesto recibido", "Presupuesto enviado"];

const fechaDe = (v: any): Date | null => {
  if (!v) return null;
  const s = String(v);
  const d = new Date(s.length === 10 ? s + "T00:00:00" : s);
  return isNaN(d.getTime()) ? null : d;
};
const fmtN = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const precio = (t: any): number => +(t.precio_cliente || t.precioCliente || 0);
const costeColab = (t: any): number => +(t.presupuesto_colaborador || t.presupuestoColaborador || 0);
const conIva = (t: any): number => Math.round(precio(t) * (1 + (t.iva || 21) / 100));
const suma = (a: number[]) => a.reduce((x, y) => x + y, 0);
const plural = (n: number, s: string, p: string) => (n === 1 ? s : p);

function rango(per: Per) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  if (per === "12") {
    const desde = new Date(hoy.getFullYear(), hoy.getMonth() - 11, 1);
    const hasta = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1);
    const prevDesde = new Date(desde.getFullYear(), desde.getMonth() - 12, 1);
    return { n: 12, mes: true, desde, hasta, prevDesde };
  }
  const n = per === "7" ? 7 : 30;
  const hasta = new Date(hoy);
  hasta.setDate(hasta.getDate() + 1);
  const desde = new Date(hoy);
  desde.setDate(desde.getDate() - (n - 1));
  const prevDesde = new Date(desde);
  prevDesde.setDate(prevDesde.getDate() - n);
  return { n, mes: false, desde, hasta, prevDesde };
}
type Rango = ReturnType<typeof rango>;

const idxBucket = (d: Date, r: Rango): number => {
  if (d < r.desde || d >= r.hasta) return -1;
  if (r.mes) return d.getFullYear() * 12 + d.getMonth() - (r.desde.getFullYear() * 12 + r.desde.getMonth());
  const dia = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return Math.round((dia - r.desde.getTime()) / 864e5);
};
const fechaBucket = (r: Rango, i: number): Date =>
  r.mes ? new Date(r.desde.getFullYear(), r.desde.getMonth() + i, 1) : new Date(r.desde.getFullYear(), r.desde.getMonth(), r.desde.getDate() + i);
const etiqueta = (r: Rango, i: number): string => {
  const d = fechaBucket(r, i);
  if (r.mes) return MESES[d.getMonth()];
  if (r.n === 7) return DIA_INI[d.getDay()];
  return i % 5 === 0 || i === r.n - 1 ? String(d.getDate()) : "";
};
const nombreBucket = (r: Rango, i: number): string => {
  const d = fechaBucket(r, i);
  return r.mes ? `${MESES[d.getMonth()]} ${d.getFullYear()}` : `${d.getDate()} ${MESES[d.getMonth()]}`;
};

function useCount(to: number): number {
  const [v, setV] = useState(0);
  const desde = useRef(0);
  useEffect(() => {
    const reduce = typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { desde.current = to; setV(to); return; }
    const a = desde.current;
    const t0 = performance.now();
    let raf = 0;
    const paso = (t: number) => {
      const k = Math.min(1, (t - t0) / 650);
      const cur = a + (to - a) * (1 - Math.pow(1 - k, 3));
      desde.current = cur;
      setV(cur);
      if (k < 1) raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return v;
}
const Num = ({ valor }: { valor: number }) => <>{fmtN(useCount(valor))}</>;

const ICONOS: Record<string, ReactNode> = {
  cal: <><rect x="3" y="5" width="18" height="16" rx="2" /><line x1="3" y1="10" x2="21" y2="10" /><line x1="8" y1="3" x2="8" y2="7" /><line x1="16" y1="3" x2="16" y2="7" /></>,
  warn: <><path d="M12 3 2 20h20z" /><line x1="12" y1="10" x2="12" y2="14" /><circle cx="12" cy="17.2" r=".6" fill="currentColor" /></>,
  doc: <><path d="M6 3h9l4 4v14H6z" /><polyline points="14 3 14 8 19 8" /></>,
  eur: <><path d="M17 6.5A6 6 0 1 0 17 17.5" /><line x1="4" y1="10" x2="13" y2="10" /><line x1="4" y1="14" x2="13" y2="14" /></>,
  clip: <path d="M20 12.5 12.5 20a5 5 0 0 1-7-7L13 5.5a3.4 3.4 0 0 1 5 5L10.5 18a1.8 1.8 0 0 1-2.5-2.5L14.5 9" />,
  user: <><circle cx="12" cy="8" r="3.2" /><path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" /></>,
  hour: <path d="M6 3h12M6 21h12M7 3c0 5 5 6 5 9s-5 4-5 9M17 3c0 5-5 6-5 9s5 4 5 9" />,
  check: <><circle cx="12" cy="12" r="9" /><polyline points="8.5 12.5 11 15 15.5 9.5" /></>,
  bell: <><path d="M12 4a4 4 0 0 0-4 4v3.4c0 .6-.2 1.2-.6 1.7L6 15h12l-1.4-1.9c-.4-.5-.6-1.1-.6-1.7V8a4 4 0 0 0-4-4z" /><path d="M10 18a2 2 0 0 0 4 0" /></>,
  tool: <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.5-.5-.5-2.5z" />,
  bars: <><line x1="6" y1="20" x2="6" y2="12" /><line x1="12" y1="20" x2="12" y2="5" /><line x1="18" y1="20" x2="18" y2="9" /></>,
  chev: <polyline points="9 6 15 12 9 18" />,
  x: <><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></>,
  tick: <polyline points="20 6 9 17 4 12" />,
};
const Ico = ({ n, s = 16 }: { n: string; s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ICONOS[n]}</svg>
);

const claseNovedad = (txt: string): string => {
  if (/propone|cambio de fecha/i.test(txt)) return "fecha";
  if (/falta algo/i.test(txt)) return "falta";
  if (/justificante/i.test(txt)) return "justif";
  if (/verific/i.test(txt)) return "verifico";
  if (/presupuesto/i.test(txt) && /colaborador/i.test(txt)) return "presup";
  if (/presupuesto recibido/i.test(txt)) return "presup";
  if (/acept[oó] el presupuesto/i.test(txt)) return "acepto";
  if (/confirm[oó] la visita/i.test(txt)) return "confirmo";
  if (/disponible/i.test(txt)) return "disp";
  if (/terminado/i.test(txt)) return "terminado";
  return "otra";
};

const DASH_CSS = `
.dsh{--navy:#1E3A5F;--navy2:#2D5A8E;display:flex;flex-direction:column;gap:16px}
.dsh *{box-sizing:border-box}
.dsh-bar{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
.dsh-hoy{font-size:13px;color:#6B7280}
.dsh-seg{display:inline-flex;background:#fff;border:1px solid #E5E7EB;border-radius:999px;padding:3px}
.dsh-seg button{font:inherit;font-size:12.5px;font-weight:600;padding:5px 12px;border-radius:999px;border:0;background:none;color:#6B7280;cursor:pointer}
.dsh-seg button[aria-pressed="true"]{background:var(--navy);color:#fff}
.dsh button:focus-visible{outline:2px solid var(--navy);outline-offset:2px}
.dsh-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
@media (max-width:900px){.dsh-grid{grid-template-columns:minmax(0,1fr)}}
.dsh-card{background:#fff;border:1px solid #EEF0F3;border-radius:18px;padding:18px;box-shadow:0 1px 2px rgba(16,24,40,.04);min-width:0;display:flex;flex-direction:column}
.dsh-wide{grid-column:1/-1}
.dsh-ch{display:flex;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap}
.dsh-ci{flex:none;width:30px;height:30px;border-radius:9px;display:flex;align-items:center;justify-content:center;color:#fff}
.dsh-ct{font-size:14.5px;font-weight:600;color:#111827;flex:1;min-width:0;margin:0}
.dsh-badge{flex:none;min-width:24px;height:24px;border-radius:999px;background:#EF4444;color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;padding:0 7px}
.dsh-badge.pop{animation:dshpop .5s ease}
@keyframes dshpop{0%{transform:scale(1)}40%{transform:scale(1.35)}100%{transform:scale(1)}}
.dsh-chips{display:flex;gap:6px;flex-wrap:wrap}
.dsh-pill{display:inline-flex;align-items:center;gap:6px;font:inherit;font-size:11.5px;font-weight:600;background:#F3F4F6;border:1px solid transparent;border-radius:999px;padding:3px 10px;color:#4B5563;cursor:pointer}
.dsh-pill i{width:7px;height:7px;border-radius:50%;display:inline-block}
.dsh-pill[aria-pressed="true"]{background:#fff;border-color:#CBD5E1;color:#111827;box-shadow:0 1px 2px rgba(0,0,0,.06)}
.dsh-big{font-size:44px;line-height:1;font-weight:700;letter-spacing:-.02em;color:#111827;font-variant-numeric:tabular-nums}
.dsh-sub{font-size:13px;color:#6B7280;margin-top:4px}
.dsh-chart{position:relative;margin-top:24px;height:170px;display:flex;align-items:flex-end;gap:4px;padding-left:28px;border-bottom:1px solid #E5E7EB}
.dsh-gl{position:absolute;left:28px;right:0;border-top:1px dashed #E5E7EB;pointer-events:none}
.dsh-gt{position:absolute;left:0;width:24px;text-align:right;font-size:10px;color:#9CA3AF;transform:translateY(-50%);font-variant-numeric:tabular-nums}
.dsh-bar1,.dsh-pair{position:relative;flex:1;min-width:0;display:flex;align-items:flex-end;justify-content:center;gap:1px;height:100%;z-index:1}
.dsh-bar1 span{display:block;width:min(100%,26px);border-radius:6px 6px 0 0;height:0;transition:height .6s cubic-bezier(.2,.8,.2,1)}
.dsh-pair span{display:block;flex:1;max-width:14px;border-radius:5px 5px 0 0;height:0;transition:height .6s cubic-bezier(.2,.8,.2,1)}
.dsh-pair .a{background:linear-gradient(180deg,#4F7FB8,#2D5A8E)}
.dsh-pair .b{background:linear-gradient(180deg,#34D399,#10B981)}
.dsh-bar1:hover span,.dsh-pair:hover span,.dsh-bar1:focus-visible span,.dsh-pair:focus-visible span{filter:brightness(.88)}
.dsh-bar1::after,.dsh-pair::after{content:attr(data-tip);position:absolute;bottom:calc(100% + 2px);left:50%;transform:translateX(-50%);background:#111827;color:#fff;font-size:11px;font-weight:600;padding:3px 7px;border-radius:6px;white-space:nowrap;opacity:0;pointer-events:none;transition:opacity .12s;z-index:5}
.dsh-bar1:hover::after,.dsh-pair:hover::after,.dsh-bar1:focus-visible::after,.dsh-pair:focus-visible::after{opacity:1}
.dsh-xl{display:flex;gap:4px;padding-left:28px;margin-top:6px}
.dsh-xl span{flex:1;min-width:0;text-align:center;font-size:10.5px;color:#9CA3AF;white-space:nowrap;overflow:hidden}
.dsh-nl{background:#F6F7F9;border-radius:14px;max-height:340px;overflow:auto;margin:0;padding:0;list-style:none}
.dsh-sec{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#9CA3AF;padding:10px 14px 4px}
.dsh-ni{border-bottom:1px solid #fff}
.dsh-nh{display:flex;align-items:center;gap:12px;flex:1;min-width:0;font:inherit;text-align:left;background:none;border:0;padding:11px 12px;cursor:pointer;color:inherit}
.dsh-nh:hover{background:#EEF1F5}
.dsh-nt{flex:none;width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;color:#fff}
.dsh-nx{flex:1;min-width:0}
.dsh-nx b{display:block;font-size:13.5px;font-weight:600;color:#111827;line-height:1.3}
.dsh-nx.hot b{color:#B91C1C}
.dsh-nx small{display:block;font-size:12px;color:#6B7280;margin-top:1px}
.dsh-chev{flex:none;color:#C4C9D2;transition:transform .2s}
.dsh-ni[data-open="true"] .dsh-chev{transform:rotate(90deg)}
.dsh-dis{flex:none;width:26px;height:26px;margin-right:8px;border-radius:7px;border:0;background:none;color:#B6BCC8;cursor:pointer;display:flex;align-items:center;justify-content:center}
.dsh-dis:hover{background:#D1FAE5;color:#059669}
.dsh-nd{display:none;padding:0 12px 10px 58px}
.dsh-ni[data-open="true"] .dsh-nd{display:block}
.dsh-nd div{display:flex;align-items:center;gap:8px;padding:6px 0;border-top:1px dashed #DDE1E8;font-size:12.5px;color:#374151}
.dsh-nd div span{flex:1;min-width:0;overflow-wrap:anywhere}
.dsh-nd div em{font-style:normal;color:#9CA3AF;font-size:11.5px}
.dsh-nd button{flex:none;font:inherit;font-size:11px;font-weight:700;border:0;border-radius:7px;padding:4px 9px;cursor:pointer}
.dsh-nd .ver{background:var(--navy);color:#fff}
.dsh-nd .ok{background:#F3F4F6;color:#6B7280;padding:4px 7px;display:inline-flex}
.dsh-nd .ok:hover{background:#D1FAE5;color:#059669}
.dsh-ni.nuevo{animation:dshslide .5s ease}
.dsh-ni.nuevo .dsh-nt{animation:dshping 1.2s ease 2}
@keyframes dshslide{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}
@keyframes dshping{0%{box-shadow:0 0 0 0 rgba(239,68,68,.5)}100%{box-shadow:0 0 0 12px rgba(239,68,68,0)}}
.dsh-empty{padding:26px 12px;text-align:center;color:#9CA3AF;font-size:13px}
.dsh-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
@media (max-width:760px){.dsh-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}}
.dsh-kpi{background:#F6F7F9;border-radius:14px;padding:14px;display:flex;flex-direction:column;gap:6px;min-width:0}
.dsh-kpi .l{font-size:12.5px;color:#6B7280}
.dsh-kpi .v{font-size:28px;font-weight:700;line-height:1.1;letter-spacing:-.01em;font-variant-numeric:tabular-nums;color:#111827}
.dsh-kpi .v small{font-size:13px;font-weight:600;color:#6B7280;margin-left:4px}
.dsh-kpi .f{font-size:12px;color:#6B7280}
.dsh-kpi.hl{color:#fff;background:linear-gradient(160deg,var(--navy2),var(--navy))}
.dsh-kpi.hl .l,.dsh-kpi.hl .f,.dsh-kpi.hl .v small{color:#BFD3EA}
.dsh-kpi.hl .v{color:#fff}
.dsh-delta{align-self:flex-start;font-size:11.5px;font-weight:700;border-radius:999px;padding:2px 8px}
.dsh-delta.up{background:#D1FAE5;color:#047857}.dsh-delta.down{background:#FEE2E2;color:#B91C1C}
.dsh-eco2{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(0,1fr);gap:12px;margin-top:12px}
@media (max-width:760px){.dsh-eco2{grid-template-columns:minmax(0,1fr)}}
.dsh-box{background:#F6F7F9;border-radius:14px;padding:14px;min-width:0}
.dsh-leg{display:flex;gap:14px;font-size:12px;color:#6B7280;margin-bottom:4px}
.dsh-leg i{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px}
.dsh-tp{padding:6px 0}
.dsh-tp .l{display:flex;justify-content:space-between;gap:8px;font-size:12.5px;color:#374151}
.dsh-tp .l b{font-variant-numeric:tabular-nums;color:#111827}
.dsh-tp .t{height:7px;border-radius:99px;background:#E5E7EB;margin-top:4px;overflow:hidden}
.dsh-tp .t i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,var(--navy2),#6C9BD1);transition:width .8s cubic-bezier(.2,.8,.2,1)}
.dsh-mini{display:flex;justify-content:space-between;gap:8px;font-size:12.5px;color:#374151;border-top:1px solid #E5E7EB;padding-top:8px;margin-top:8px}
.dsh-mini b{font-variant-numeric:tabular-nums;color:#111827}
@media (prefers-reduced-motion: reduce){.dsh *{animation:none!important;transition:none!important}}
`;

export default function PanelInicio({ data, setData, go, setTid, toast, verEconomico, supabase }: Props) {
  const [per, setPer] = useState<Per>("12");
  const [serie, setSerie] = useState<Serie>("nuevas");
  const [abierto, setAbierto] = useState<Record<string, boolean>>({});
  const [cobros, setCobros] = useState<any[]>([]);
  const [pagos, setPagos] = useState<any[]>([]);
  const [tick, setTick] = useState(0);
  const [nuevos, setNuevos] = useState<string[]>([]);
  const [pulso, setPulso] = useState(0);
  const [animar, setAnimar] = useState(false);
  const vistos = useRef<Set<string> | null>(null);

  // Refresco automático: avisos que llegan mientras el CRM está abierto
  useEffect(() => {
    const refrescar = async () => {
      if (typeof document !== "undefined" && document.hidden) return;
      const [t, i] = await Promise.all([
        supabase.from("trabajos").select("*").order("id"),
        supabase.from("incidencias").select("*").order("id", { ascending: false }),
      ]);
      if (t.error || i.error) return;
      setData((d: any) => ({
        ...d,
        trabajos: (t.data || []).map((x: any) => ({ ...x, clienteId: x.cliente_id, colaboradorId: x.colaborador_id, presupuestoColaborador: x.presupuesto_colaborador, precioCliente: x.precio_cliente })),
        incidencias: i.data || [],
      }));
      setTick((n) => n + 1);
    };
    const id = window.setInterval(refrescar, 30000);
    return () => window.clearInterval(id);
  }, [supabase, setData]);

  useEffect(() => {
    if (!verEconomico) return;
    let vivo = true;
    Promise.all([supabase.from("cobros_cliente").select("importe"), supabase.from("pagos_colaborador").select("importe")]).then(([c, p]) => {
      if (!vivo) return;
      setCobros(c.data || []);
      setPagos(p.data || []);
    });
    return () => { vivo = false; };
  }, [verEconomico, supabase, tick]);

  useEffect(() => { const id = requestAnimationFrame(() => setAnimar(true)); return () => cancelAnimationFrame(id); }, [per, serie]);
  useEffect(() => { setAnimar(false); }, [per, serie]);

  const nombreCliente = (t: any) => (data.clientes || []).find((c: any) => c.id === (t.clienteId || t.cliente_id))?.nombre || "Sin cliente";
  const etiquetaTrabajo = (t: any): Item => ({ id: t.id, txt: `${t.tipo} · ${nombreCliente(t)} · #${t.id}`, extra: t.ultima_novedad || "" });

  // ---------- Trabajos ----------
  const abiertos = (data.trabajos || []).filter((t: any) => !["Completado", "Cancelado"].includes(t.estado) && !t.archivado).length;
  const r = useMemo(() => rango(per), [per]);
  const calc = useMemo(() => {
    const n = r.n;
    const nuevas = new Array(n).fill(0), comp = new Array(n).fill(0), canc = new Array(n).fill(0);
    const fact = new Array(n).fill(0), marg = new Array(n).fill(0);
    const tipos = new Map<string, number>();
    let factPrev = 0;
    (data.trabajos || []).forEach((t: any) => {
      const alta = fechaDe(t.created_at || t.creado || t.fecha_alta) || fechaDe(t.fecha);
      if (alta) { const i = idxBucket(alta, r); if (i >= 0) nuevas[i]++; }
      const ev = fechaDe(t.fecha_ultimo_estado) || fechaDe(t.fecha);
      if (!ev) return;
      if (t.estado === "Completado") {
        const i = idxBucket(ev, r);
        if (i >= 0) {
          comp[i]++;
          const p = precio(t);
          fact[i] += p;
          marg[i] += p - costeColab(t);
          const k = String(t.tipo || "Otros").split(",")[0].trim() || "Otros";
          tipos.set(k, (tipos.get(k) || 0) + p);
        } else if (ev >= r.prevDesde && ev < r.desde) factPrev += precio(t);
      } else if (t.estado === "Cancelado") {
        const i = idxBucket(ev, r);
        if (i >= 0) canc[i]++;
      }
    });
    const orden = [...tipos.entries()].sort((a, b) => b[1] - a[1]);
    const top = orden.slice(0, 5);
    const resto = suma(orden.slice(5).map((x) => x[1]));
    if (resto > 0) top.push(["Otros", resto]);
    const totalFact = suma(fact);
    return { nuevas, comp, canc, fact, marg, tipos: top, totalFact, totalMarg: suma(marg), nComp: suma(comp), delta: factPrev > 0 ? Math.round(((totalFact - factPrev) / factPrev) * 100) : null };
  }, [data.trabajos, r]);

  const serieAct: number[] = calc[serie];
  const maxS = Math.max(1, ...serieAct);
  const topS = Math.max(2, Math.ceil(maxS / 2) * 2);
  const nombreSerie = { nuevas: "demandas nuevas", comp: "completados", canc: "cancelados" }[serie];
  const colorSerie = { nuevas: ["#34D399", "#A7E8CE"], comp: ["#4F7FB8", "#A9C4E4"], canc: ["#F87171", "#FCCACA"] }[serie];

  // ---------- Económico ----------
  const eco = useMemo(() => {
    const trabCli = (data.trabajos || []).filter((t: any) => ["Aceptado", "En curso", "Completado"].includes(t.estado));
    const totalCli = suma(trabCli.map(conIva));
    const cobrado = suma(cobros.map((c) => +c.importe || 0));
    const deuda = suma((data.trabajos || []).filter((t: any) => (t.colaboradorId || t.colaborador_id) && ["Aceptado", "En curso", "Completado"].includes(t.estado)).map(costeColab));
    const pagado = suma(pagos.map((p) => +p.importe || 0));
    const adel = suma((data.trabajos || []).filter((t: any) => ["Aceptado", "En curso"].includes(t.estado) && !t.adelanto_pagado && precio(t) > 0).map((t: any) => {
      const tot = conIva(t);
      return t.adelanto_tipo === "fijo" ? t.adelanto_valor || 0 : Math.round((tot * (t.adelanto_valor || 30)) / 100);
    }));
    const sinAceptar = suma((data.trabajos || []).filter((t: any) => t.estado === "Presupuesto enviado").map(conIva));
    return { porCobrar: Math.max(0, totalCli - cobrado), porPagar: Math.max(0, deuda - pagado), adel, sinAceptar };
  }, [data.trabajos, cobros, pagos]);

  const ticket = calc.nComp ? calc.totalFact / calc.nComp : 0;
  const pctMargen = calc.totalFact > 0 ? Math.round((calc.totalMarg / calc.totalFact) * 100) : 0;
  const maxF = Math.max(1, ...calc.fact);
  const topF = Math.max(500, Math.ceil(maxF / 500) * 500);
  const maxTipo = Math.max(1, ...calc.tipos.map((x) => x[1]));

  // ---------- Novedades y tareas ----------
  const marcarAtendidos = async (ids: any[]) => {
    const { error } = await supabase.from("trabajos").update({ atendido: true }).in("id", ids);
    if (error) { toast("No se pudo marcar como atendido"); return; }
    setData((d: any) => ({ ...d, trabajos: d.trabajos.map((x: any) => (ids.includes(x.id) ? { ...x, atendido: true } : x)) }));
    toast("Marcado como atendido");
  };

  const grupos: Grupo[] = useMemo(() => {
    const trabajos: any[] = data.trabajos || [];
    const out: Grupo[] = [];
    const verTrabajo = (it: Item) => setTid(it.id);

    const CFG: Record<string, { hot?: boolean; color: string; icono: string; t: (n: number) => string; s: string }> = {
      fecha: { hot: true, color: "#F59E0B", icono: "hour", t: (n) => `${n} ${plural(n, "cliente pide", "clientes piden")} otra fecha`, s: "Consulta con el colaborador si le viene bien" },
      falta: { hot: true, color: "#EF4444", icono: "warn", t: (n) => `${n} ${plural(n, "cliente indica", "clientes indican")} que falta algo`, s: "Revisa el motivo y avisa al colaborador" },
      justif: { color: "#8B5CF6", icono: "clip", t: (n) => `${n} ${plural(n, "justificante de pago recibido", "justificantes de pago recibidos")}`, s: "Revisa el comprobante y registra el cobro" },
      presup: { color: "#3B6EA8", icono: "doc", t: (n) => `${n} ${plural(n, "presupuesto de colaborador", "presupuestos de colaborador")}`, s: "Genera el presupuesto de Domia" },
      acepto: { color: "#10B981", icono: "check", t: (n) => `${n} ${plural(n, "cliente ha aceptado", "clientes han aceptado")} el presupuesto`, s: "Cobra el adelanto y avisa al colaborador" },
      confirmo: { color: "#14B8A6", icono: "cal", t: (n) => `${n} ${plural(n, "visita confirmada", "visitas confirmadas")} por el cliente`, s: "Avisa al colaborador" },
      verifico: { color: "#10B981", icono: "check", t: (n) => `${n} ${plural(n, "trabajo verificado", "trabajos verificados")} por el cliente`, s: "Reclama el cobro final" },
      disp: { color: "#14B8A6", icono: "user", t: (n) => `${n} ${plural(n, "colaborador disponible", "colaboradores disponibles")}`, s: "Propón fecha al cliente" },
      terminado: { color: "#3B6EA8", icono: "tool", t: (n) => `${n} ${plural(n, "trabajo marcado", "trabajos marcados")} como terminado`, s: "Pide la verificación al cliente" },
      otra: { color: "#9CA3AF", icono: "bell", t: (n) => `${n} ${plural(n, "otra novedad", "otras novedades")}`, s: "Abre la ficha para ver el detalle" },
    };
    const orden = ["fecha", "falta", "justif", "presup", "acepto", "confirmo", "verifico", "disp", "terminado", "otra"];
    const porClase = new Map<string, any[]>();
    trabajos.filter((t) => t.ultima_novedad && !t.atendido && !t.archivado).forEach((t) => {
      const k = claseNovedad(String(t.ultima_novedad));
      porClase.set(k, [...(porClase.get(k) || []), t]);
    });
    const incAbiertas: any[] = (data.incidencias || []).filter((i: any) => i.atendida === false && i.estado !== "Resuelta");
    if (incAbiertas.length) {
      out.push({
        key: "inc", tipo: "novedad", hot: true, color: "#F97316", icono: "warn",
        titulo: `${incAbiertas.length} ${plural(incAbiertas.length, "incidencia con novedad", "incidencias con novedad")}`,
        sub: "Revisa la respuesta del colaborador",
        items: incAbiertas.map((i: any) => {
          const t = trabajos.find((x) => x.id === i.trabajo_id);
          return { id: i.id, txt: `${i.tipo || "Incidencia"} · ${t ? nombreCliente(t) : "Sin cliente"} · #${i.trabajo_id}`, extra: i.fecha_propuesta ? `Propone ${String(i.fecha_propuesta).slice(0, 10).split("-").reverse().join("/")} ${i.hora_propuesta || ""}`.trim() : "" };
        }),
        ver: () => go("incidencias"),
        descartar: async () => {
          const ids = incAbiertas.map((i: any) => i.id);
          const { error } = await supabase.from("incidencias").update({ atendida: true }).in("id", ids);
          if (error) { toast("No se pudo marcar como atendido"); return; }
          setData((d: any) => ({ ...d, incidencias: d.incidencias.map((x: any) => (ids.includes(x.id) ? { ...x, atendida: true } : x)) }));
          toast("Marcado como atendido");
        },
      });
    }
    orden.forEach((k) => {
      const ts = porClase.get(k);
      if (!ts || !ts.length) return;
      const c = CFG[k];
      out.push({ key: "nov-" + k, tipo: "novedad", hot: c.hot, color: c.color, icono: c.icono, titulo: c.t(ts.length), sub: c.s, items: ts.map(etiquetaTrabajo), ver: verTrabajo, descartar: () => marcarAtendidos(ts.map((t) => t.id)) });
    });

    const tarea = (key: string, lista: any[], color: string, icono: string, t: (n: number) => string, s: string, hot = false) => {
      if (lista.length) out.push({ key: "tar-" + key, tipo: "tarea", hot, color, icono, titulo: t(lista.length), sub: s, items: lista.map(etiquetaTrabajo), ver: verTrabajo });
    };
    const vivos = trabajos.filter((t) => !t.archivado);
    const parados = vivos.filter((t) => ESTADOS_VIVOS.includes(t.estado) && t.fecha_ultimo_estado && (Date.now() - new Date(t.fecha_ultimo_estado).getTime()) / 36e5 >= 48);
    tarea("parados", parados, "#EF4444", "hour", (n) => `${n} ${plural(n, "trabajo parado", "trabajos parados")} más de 48 h`, "Sin movimiento: retómalo o ciérralo", true);
    tarea("asignar", vivos.filter((t) => t.estado === "Solicitud"), "#14B8A6", "user", (n) => `${n} ${plural(n, "demanda sin asignar", "demandas sin asignar")}`, "Asigna un colaborador");
    tarea("presup", vivos.filter((t) => t.estado === "Presupuesto recibido"), "#3B6EA8", "doc", (n) => `${n} ${plural(n, "presupuesto", "presupuestos")} por generar`, "Prepara el presupuesto de Domia para el cliente");
    tarea("fecha", vivos.filter((t) => t.estado === "Colaborador disponible" && !/propone/i.test(String(t.ultima_novedad || ""))), "#0EA5E9", "cal", (n) => `${n} ${plural(n, "visita", "visitas")} por proponer al cliente`, "El colaborador ya está disponible");
    tarea("avisar", vivos.filter((t) => t.estado === "Cliente confirmó"), "#14B8A6", "cal", (n) => `${n} ${plural(n, "visita confirmada", "visitas confirmadas")} por avisar al colaborador`, "Avísale de la fecha y la hora");
    tarea("adelanto", vivos.filter((t) => ["Aceptado", "En curso"].includes(t.estado) && !t.adelanto_pagado && precio(t) > 0), "#10B981", "eur", (n) => `${n} ${plural(n, "adelanto", "adelantos")} por cobrar`, "Trabajos aceptados sin adelanto");
    tarea("cobro", vivos.filter((t) => t.estado === "En curso" && t.cliente_verificado), "#10B981", "eur", (n) => `${n} ${plural(n, "cobro final", "cobros finales")} por reclamar`, "El cliente ya verificó el trabajo");
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.trabajos, data.incidencias, data.clientes]);

  // Detecta avisos nuevos entre refrescos para resaltarlos
  useEffect(() => {
    const claves = grupos.flatMap((g) => g.items.map((it) => `${g.key}:${it.id}`));
    if (vistos.current === null) { vistos.current = new Set(claves); return; }
    const nuevas = claves.filter((c) => !vistos.current!.has(c));
    vistos.current = new Set(claves);
    if (nuevas.length) {
      setNuevos((p) => [...p, ...nuevas]);
      setPulso((n) => n + 1);
      const id = window.setTimeout(() => setNuevos((p) => p.filter((c) => !nuevas.includes(c))), 6000);
      return () => window.clearTimeout(id);
    }
  }, [grupos]);

  const hoyISO = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; })();
  const visitasHoy = (data.trabajos || []).filter((t: any) => ["Cliente confirmó", "Aceptado", "En curso"].includes(t.estado) && t.fecha === hoyISO).length;
  const novedades = grupos.filter((g) => g.tipo === "novedad");
  const tareas = grupos.filter((g) => g.tipo === "tarea");

  const fila = (g: Grupo) => {
    const esNuevo = g.items.some((it) => nuevos.includes(`${g.key}:${it.id}`));
    return (
      <li key={g.key} className={`dsh-ni${esNuevo ? " nuevo" : ""}`} data-open={!!abierto[g.key]}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <button type="button" className="dsh-nh" aria-expanded={!!abierto[g.key]} onClick={() => setAbierto((p) => ({ ...p, [g.key]: !p[g.key] }))}>
            <span className="dsh-nt" style={{ background: g.color }}><Ico n={g.icono} s={18} /></span>
            <span className={`dsh-nx${g.hot ? " hot" : ""}`}><b>{g.titulo}</b><small>{g.sub}</small></span>
            <span className="dsh-chev"><Ico n="chev" s={16} /></span>
          </button>
          {g.descartar && <button type="button" className="dsh-dis" aria-label="Marcar como atendido" title="Marcar como atendido" onClick={() => g.descartar!()}><Ico n="tick" s={14} /></button>}
        </div>
        <div className="dsh-nd">
          {g.items.map((it) => (
            <div key={it.id}>
              <span>{it.txt}{it.extra ? <> · <em>{it.extra}</em></> : null}</span>
              {g.tipo === "novedad" && g.key !== "inc" && <button type="button" className="ok" aria-label="Marcar como atendido" onClick={() => marcarAtendidos([it.id])}><Ico n="tick" s={12} /></button>}
              <button type="button" className="ver" onClick={() => g.ver(it)}>Ver</button>
            </div>
          ))}
        </div>
      </li>
    );
  };

  const [c1, c2] = colorSerie;
  return (
    <div className="dsh">
      <style>{DASH_CSS}</style>
      <div className="dsh-bar">
        <div className="dsh-hoy">{visitasHoy > 0 ? `Hoy tienes ${visitasHoy} ${plural(visitasHoy, "visita", "visitas")}` : "Hoy no hay visitas programadas"}</div>
        <div className="dsh-seg" role="group" aria-label="Periodo">
          {([["7", "7 días"], ["30", "30 días"], ["12", "12 meses"]] as [Per, string][]).map(([k, l]) => (
            <button key={k} type="button" aria-pressed={per === k} onClick={() => setPer(k)}>{l}</button>
          ))}
        </div>
      </div>

      <div className="dsh-grid">
        <section className="dsh-card" aria-labelledby="dsh-t1">
          <div className="dsh-ch">
            <div className="dsh-ci" style={{ background: "#3B6EA8" }}><Ico n="tool" /></div>
            <h2 className="dsh-ct" id="dsh-t1">Trabajos</h2>
            <div className="dsh-chips">
              {([["nuevas", "#10B981", "nuevas"], ["comp", "#3B6EA8", "completados"], ["canc", "#EF4444", "cancelados"]] as [Serie, string, string][]).map(([k, col, l]) => (
                <button key={k} type="button" className="dsh-pill" aria-pressed={serie === k} onClick={() => setSerie(k)}><i style={{ background: col }} />{suma(calc[k])} {l}</button>
              ))}
            </div>
          </div>
          <div className="dsh-big"><Num valor={abiertos} /></div>
          <div className="dsh-sub">trabajos abiertos ahora · {nombreSerie} por {r.mes ? "mes" : "día"}</div>
          <div className="dsh-chart" role="img" aria-label={`Gráfico de ${nombreSerie}, total ${suma(serieAct)}`}>
            {[0, 0.5, 1].map((f) => (
              <div key={f}><div className="dsh-gl" style={{ bottom: `${f * 100}%` }} /><div className="dsh-gt" style={{ bottom: `${f * 100}%` }}>{Math.round(topS * f)}</div></div>
            ))}
            {serieAct.map((v, i) => (
              <div key={i} className="dsh-bar1" tabIndex={0} data-tip={`${nombreBucket(r, i)}: ${v} ${nombreSerie}`}>
                <span style={{ height: animar ? `${(v / topS) * 100}%` : "0%", background: `linear-gradient(180deg,${c1},${c2})` }} />
              </div>
            ))}
          </div>
          <div className="dsh-xl">{serieAct.map((_, i) => <span key={i}>{etiqueta(r, i)}</span>)}</div>
        </section>

        <section className="dsh-card" aria-labelledby="dsh-t3">
          <div className="dsh-ch">
            <div className="dsh-ci" style={{ background: "#EF4444" }}><Ico n="bell" /></div>
            <h2 className="dsh-ct" id="dsh-t3">Novedades y tareas</h2>
            <span key={pulso} className={`dsh-badge${pulso ? " pop" : ""}`}>{grupos.length}</span>
          </div>
          {grupos.length === 0 ? (
            <ul className="dsh-nl"><li className="dsh-empty">Todo al día. No hay nada pendiente.</li></ul>
          ) : (
            <ul className="dsh-nl">
              {novedades.length > 0 && <li className="dsh-sec" aria-hidden="true">Novedades</li>}
              {novedades.map(fila)}
              {tareas.length > 0 && <li className="dsh-sec" aria-hidden="true">Tareas</li>}
              {tareas.map(fila)}
            </ul>
          )}
        </section>

        {verEconomico && (
          <section className="dsh-card dsh-wide" aria-labelledby="dsh-t4">
            <div className="dsh-ch">
              <div className="dsh-ci" style={{ background: "#10B981" }}><Ico n="bars" /></div>
              <h2 className="dsh-ct" id="dsh-t4">Económico</h2>
              <span className="dsh-hoy">{per === "12" ? "últimos 12 meses" : `últimos ${per} días`} · importes sin IVA</span>
            </div>
            <div className="dsh-kpis">
              <div className="dsh-kpi"><div className="l">Facturado</div><div className="v"><Num valor={calc.totalFact} /><small>€</small></div>
                {calc.delta !== null && <span className={`dsh-delta ${calc.delta >= 0 ? "up" : "down"}`}>{calc.delta >= 0 ? "▲" : "▼"} {Math.abs(calc.delta)} % vs. periodo anterior</span>}</div>
              <div className="dsh-kpi hl"><div className="l">Margen</div><div className="v"><Num valor={calc.totalMarg} /><small>€</small></div><div className="f">{pctMargen} % de lo facturado</div></div>
              <div className="dsh-kpi"><div className="l">Por cobrar a clientes</div><div className="v"><Num valor={eco.porCobrar} /><small>€</small></div><div className="f">Con IVA, de trabajos aceptados</div></div>
              <div className="dsh-kpi"><div className="l">Ticket medio</div><div className="v"><Num valor={ticket} /><small>€</small></div><div className="f">sobre {calc.nComp} {plural(calc.nComp, "trabajo completado", "trabajos completados")}</div></div>
            </div>
            <div className="dsh-eco2">
              <div className="dsh-box">
                <div className="dsh-leg"><span><i style={{ background: "#2D5A8E" }} />Facturado</span><span><i style={{ background: "#10B981" }} />Margen</span></div>
                <div className="dsh-chart" role="img" aria-label="Facturado y margen por periodo">
                  {[0, 0.5, 1].map((f) => {
                    const v = topF * f;
                    return <div key={f}><div className="dsh-gl" style={{ bottom: `${f * 100}%` }} /><div className="dsh-gt" style={{ bottom: `${f * 100}%` }}>{v >= 1000 ? `${(v / 1000).toFixed(v % 1000 ? 1 : 0)}k` : Math.round(v)}</div></div>;
                  })}
                  {calc.fact.map((v: number, i: number) => (
                    <div key={i} className="dsh-pair" tabIndex={0} data-tip={`${nombreBucket(r, i)}: ${fmtN(v)} € · margen ${fmtN(calc.marg[i])} €`}>
                      <span className="a" style={{ height: animar ? `${(v / topF) * 100}%` : "0%" }} />
                      <span className="b" style={{ height: animar ? `${(Math.max(0, calc.marg[i]) / topF) * 100}%` : "0%" }} />
                    </div>
                  ))}
                </div>
                <div className="dsh-xl">{calc.fact.map((_: number, i: number) => <span key={i}>{etiqueta(r, i)}</span>)}</div>
              </div>
              <div className="dsh-box">
                <div className="dsh-leg" style={{ marginBottom: 6 }}>Facturado por tipo de trabajo</div>
                {calc.tipos.length === 0 && <div className="dsh-sub">Sin trabajos completados en este periodo.</div>}
                {calc.tipos.map(([k, v]) => (
                  <div className="dsh-tp" key={k}><div className="l"><span>{k}</span><b>{fmtN(v)} €</b></div><div className="t"><i style={{ width: animar ? `${(v / maxTipo) * 100}%` : "0%" }} /></div></div>
                ))}
                <div className="dsh-mini"><span>Adelantos por cobrar</span><b>{fmtN(eco.adel)} €</b></div>
                <div className="dsh-mini"><span>Presupuestos enviados sin aceptar</span><b>{fmtN(eco.sinAceptar)} €</b></div>
                <div className="dsh-mini"><span>Por pagar a colaboradores</span><b>{fmtN(eco.porPagar)} €</b></div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
