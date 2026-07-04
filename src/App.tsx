import React, { useState, useEffect } from "react";
import { createClient } from '@supabase/supabase-js';
import { jsPDF } from 'jspdf';
const supabase = createClient('https://opijkazhbktiikdzbanb.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9waWprYXpoYmt0aWlrZHpiYW5iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxNDcyNjIsImV4cCI6MjA5NzcyMzI2Mn0.HmTXEO848sPMhi2NxNxvshLxntk1EDI6D4NCMAdUINI');

const TIPOS = ["Fontanería","Electricidad","Albañilería","Carpintería","Pintura","Cerrajería","Climatización","Mantenimiento","Jardinería","Limpieza","Otros"];
const PRIORIDADES = ["Alta","Media","Baja"];
const DIAS = ["L","M","X","J","V","S","D"];
const FLUJO = ["Solicitud","Presupuestando","Colaborador disponible","Visita propuesta","Cliente confirmó","Presupuesto recibido","Presupuesto enviado","Aceptado","En curso","Completado","Cancelado"];
const ORIGENES = [
  {id:"web",label:"Web",icon:"🌐",color:"bg-blue-50 text-blue-700 border-blue-200"},
  {id:"instagram",label:"Instagram",icon:"📸",color:"bg-pink-50 text-pink-700 border-pink-200"},
  {id:"facebook",label:"Facebook",icon:"👤",color:"bg-indigo-50 text-indigo-700 border-indigo-200"},
  {id:"google",label:"Google Ads",icon:"🔍",color:"bg-yellow-50 text-yellow-700 border-yellow-200"},
  {id:"whatsapp",label:"WhatsApp",icon:"💬",color:"bg-green-50 text-green-700 border-green-200"},
  {id:"telefono",label:"Llamada",icon:"📞",color:"bg-gray-50 text-gray-700 border-gray-200"},
  {id:"referido",label:"Referido",icon:"🤝",color:"bg-purple-50 text-purple-700 border-purple-200"},
  {id:"otros",label:"Otros",icon:"📌",color:"bg-orange-50 text-orange-700 border-orange-200"},
];
const ESTADO_CFG = {
  "Solicitud":{bg:"bg-slate-100",text:"text-slate-600",dot:"bg-slate-400"},
  "Presupuestando":{bg:"bg-amber-100",text:"text-amber-700",dot:"bg-amber-400"},
  "Colaborador disponible":{bg:"bg-teal-100",text:"text-teal-700",dot:"bg-teal-500"},
  "Visita propuesta":{bg:"bg-cyan-100",text:"text-cyan-700",dot:"bg-cyan-500"},
  "Cliente confirmó":{bg:"bg-green-100",text:"text-green-700",dot:"bg-green-500"},
  "Presupuesto recibido":{bg:"bg-purple-100",text:"text-purple-700",dot:"bg-purple-500"},
  "Presupuesto enviado":{bg:"bg-blue-100",text:"text-blue-700",dot:"bg-blue-500"},
  "Aceptado":{bg:"bg-violet-100",text:"text-violet-700",dot:"bg-violet-500"},
  "En curso":{bg:"bg-orange-100",text:"text-orange-700",dot:"bg-orange-500"},
  "Completado":{bg:"bg-emerald-100",text:"text-emerald-700",dot:"bg-emerald-500"},
  "Cancelado":{bg:"bg-red-100",text:"text-red-400",dot:"bg-red-300"},
};
const PRIO_CFG = {
  "Alta":{icon:"🔴",text:"text-red-600"},
  "Media":{icon:"🟡",text:"text-amber-500"},
  "Baja":{icon:"⚪",text:"text-gray-400"},
};

const fmt = d=>d?new Date(d+"T00:00:00").toLocaleDateString("es-ES",{day:"2-digit",month:"2-digit",year:"2-digit"}):"—";
const hoy = ()=>new Date().toISOString().slice(0,10);
const now = ()=>new Date().toLocaleString("es-ES",{hour:"2-digit",minute:"2-digit",day:"2-digit",month:"2-digit"});
const orCfg = id=>ORIGENES.find(o=>o.id===id)||ORIGENES[ORIGENES.length-1];
const calc = (c,m)=>c?Math.round(c*(1+m/100)):null;
const getClienteId = t => t.clienteId || t.cliente_id;
const getColabId = t => t.colaboradorId || t.colaborador_id;
const getPresupColab = t => t.presupuestoColaborador || t.presupuesto_colaborador;
const getPrecioCliente = t => t.precioCliente || t.precio_cliente;
const getNotas = t => t.notas || '';
const getHistorial = t => {
  if (!t.historial) return [];
  if (typeof t.historial === 'string') { try { return JSON.parse(t.historial); } catch { return []; } }
  return t.historial;
};

const sugerirColab = (tipo,colabs,trabajos)=>{
  const aptos=colabs.filter(c=>c.activo&&c.especialidades?.includes(tipo));
  if(!aptos.length)return null;
  return aptos.sort((a,b)=>
    trabajos.filter(t=>getColabId(t)===a.id&&["Aceptado","En curso"].includes(t.estado)).length-
    trabajos.filter(t=>getColabId(t)===b.id&&["Aceptado","En curso"].includes(t.estado)).length
  )[0];
};

const BASE_URL = 'https://domia-crm-two.vercel.app';

const buildWA=(colab,trabajo,cliente)=>{
  const enlace=`${BASE_URL}/trabajo/${trabajo.id}`;
  const msg=`Hola ${colab.nombre.split(" ")[0]} 👋\n\nTenemos un trabajo de *${trabajo.tipo}* en ${cliente.direccion}.\n\n📝 ${trabajo.descripcion}\n\n¿Puedes encargarte? Indícanos tu disponibilidad aquí:\n👉 ${enlace}\n\nGracias 🙏`;
  return `https://wa.me/${colab.whatsapp}?text=${encodeURIComponent(msg)}`;
};
const buildWAVisitaCliente=(cliente,trabajo,colab)=>{
  const nombre=cliente.nombre.split(" ")[0];
  const enlace=`${BASE_URL}/cliente/${trabajo.id}`;
  const msg=`Hola ${nombre} 😊\n\nSoy Samuel de *Domia Services*.\n\nTe escribo porque hemos organizado una visita de nuestro técnico para revisar el trabajo de *${trabajo.tipo}*.\n\n📅 *${fmt(trabajo.fecha)} a las ${trabajo.hora}*\n\n👇 Confirma aquí si te viene bien (solo un clic):\n${enlace}\n\nSi necesitas cambiar la fecha, también puedes indicarlo ahí. Cualquier duda estamos en el 685 917 059 🙏\n\n— Samuel · Domia Services`;
  return `https://wa.me/${cliente.telefono?.replace(/\s/g,'')}?text=${encodeURIComponent(msg)}`;
};
const buildWAConfirmacionColab=(colab,trabajo,cliente)=>{
  const msg=`Hola ${colab.nombre.split(" ")[0]} 👋\n\n✅ El cliente ha confirmado la visita.\n\n📍 ${cliente.direccion}\n📅 *${fmt(trabajo.fecha)} a las ${trabajo.hora}*\n👤 ${cliente.nombre} · ${cliente.telefono}\n\nTras la visita, sube el presupuesto aquí:\n${BASE_URL}/trabajo/${trabajo.id}\n\nGracias 🙏`;
  return `https://wa.me/${colab.whatsapp}?text=${encodeURIComponent(msg)}`;
};

const dbSaveCliente = async(cliente) => { const {data} = await supabase.from('clientes').upsert(cliente).select(); return data?.[0]; };
const dbSaveTrabajo = async(trabajo) => {
  const row = {
    cliente_id: trabajo.clienteId||trabajo.cliente_id,
    colaborador_id: trabajo.colaboradorId||trabajo.colaborador_id||null,
    tipo: trabajo.tipo, descripcion: trabajo.descripcion, origen: trabajo.origen,
    prioridad: trabajo.prioridad, estado: trabajo.estado, fecha: trabajo.fecha, hora: trabajo.hora,
    presupuesto_colaborador: trabajo.presupuestoColaborador||trabajo.presupuesto_colaborador||null,
    margen: trabajo.margen||30,
    precio_cliente: trabajo.precioCliente||trabajo.precio_cliente||null,
    notas: trabajo.notas||'',
    historial: JSON.stringify(trabajo.historial||[]),
  };
  if (trabajo.id) { const {data} = await supabase.from('trabajos').update(row).eq('id',trabajo.id).select(); return data?.[0]; }
  else { const {data} = await supabase.from('trabajos').insert(row).select(); return data?.[0]; }
};
const dbDeleteTrabajo = async(id) => await supabase.from('trabajos').delete().eq('id',id);
const dbSaveColab = async(colab) => {
  const row = { nombre:colab.nombre, especialidades:colab.especialidades, telefono:colab.telefono, whatsapp:colab.whatsapp, activo:colab.activo, zona:colab.zona, disponibilidad:colab.disponibilidad, valoracion:colab.valoracion||5, trabajos_completados:colab.trabajosCompletados||colab.trabajos_completados||0 };
  if (colab.id) { const {data} = await supabase.from('colaboradores').update(row).eq('id',colab.id).select(); return data?.[0]; }
  else { const {data} = await supabase.from('colaboradores').insert(row).select(); return data?.[0]; }
};

const S="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] transition";
function Fld({label,children}){return<div className="mb-3"><label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</label>{children}</div>;}
function Badge({text}){const c=ESTADO_CFG[text]||{bg:"bg-gray-100",text:"text-gray-500",dot:"bg-gray-300"};return<span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${c.bg} ${c.text}`}><span className={`w-1.5 h-1.5 rounded-full ${c.dot}`}/>{text}</span>;}
function OrigenTag({id}){const o=orCfg(id);return<span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${o.color}`}>{o.icon} {o.label}</span>;}
function Modal({title,onClose,wide,children}){return<div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"><div className={`bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full ${wide?"max-w-2xl":"max-w-lg"} max-h-[93vh] overflow-y-auto`}><div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10"><h2 className="font-bold text-gray-800 text-base">{title}</h2><button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 text-xl">&times;</button></div><div className="px-5 py-5">{children}</div></div></div>;}
function Back({title,onBack,right}){return<div className="flex items-center gap-3 mb-5"><button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-500 hover:border-[#1E3A5F] hover:text-[#1E3A5F] transition text-xl shadow-sm">‹</button><h2 className="font-black text-gray-800 text-lg flex-1 leading-tight">{title}</h2>{right}</div>;}
function Toast({msg,clear}){useEffect(()=>{const t=setTimeout(clear,2800);return()=>clearTimeout(t);},[]);return<div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] bg-gray-900 text-white text-sm px-5 py-3 rounded-2xl shadow-2xl whitespace-nowrap">{msg}</div>;}
function Pill({label,active,onClick}){return<button onClick={onClick} className={`whitespace-nowrap text-xs px-3 py-1.5 rounded-full border font-semibold transition ${active?"bg-[#1E3A5F] text-white border-[#1E3A5F]":"bg-white text-gray-500 border-gray-200 hover:border-[#1E3A5F]"}`}>{label}</button>;}

function PresBox({colab,margen,onChange}){
  const precio=calc(colab,margen);
  return<div className="bg-gray-900 rounded-xl p-4 text-white mb-3">
    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Presupuesto y margen</div>
    <div className="grid grid-cols-3 gap-3 mb-3">
      <div><div className="text-[10px] text-gray-400 mb-1">Precio colaborador</div><input type="number" value={colab||""} onChange={e=>onChange("presupuestoColaborador",+e.target.value||null)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-400" placeholder="€"/></div>
      <div><div className="text-[10px] text-gray-400 mb-1">Tu margen %</div><input type="number" value={margen||""} onChange={e=>onChange("margen",+e.target.value||30)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-400" placeholder="30"/></div>
      <div><div className="text-[10px] text-gray-400 mb-1">Precio cliente</div><div className="bg-gray-700 border border-gray-600 rounded-lg px-2 py-2 text-sm font-bold text-emerald-400">{precio?`${precio}€`:"Auto"}</div></div>
    </div>
    {precio&&<div className="flex justify-between bg-gray-800 rounded-lg px-3 py-2 text-xs"><span className="text-gray-400">Beneficio estimado</span><span className="text-emerald-400 font-black">+{precio-(colab||0)}€</span></div>}
  </div>;
}

function FormTrabajo({data,setData,inicial,onClose,toast}){
  const esNuevo=!inicial;
  const[f,setF]=useState(inicial?{...inicial,clienteId:getClienteId(inicial),colaboradorId:getColabId(inicial),presupuestoColaborador:getPresupColab(inicial),precioCliente:getPrecioCliente(inicial)}:{clienteId:"",tipo:TIPOS[0],origen:"telefono",prioridad:"Media",estado:"Solicitud",fecha:hoy(),hora:"09:00",presupuestoColaborador:null,margen:30,precioCliente:null,colaboradorId:null,descripcion:"",notas:"",historial:[]});
  const set=(k,v)=>setF(x=>({...x,[k]:v}));
  const sugerido=sugerirColab(f.tipo,data.colaboradores,data.trabajos);
  const precioAuto=calc(f.presupuestoColaborador,f.margen);
  const save=async()=>{
    if(!f.descripcion?.trim()||!f.clienteId)return;
    const colab=f.colaboradorId?data.colaboradores.find(c=>c.id===+f.colaboradorId):null;
    const cliente=data.clientes.find(c=>c.id===+f.clienteId);
    const o=orCfg(f.origen);
    const precio=precioAuto||f.precioCliente||null;
    const historial=esNuevo?[{ts:now(),txt:`Solicitud recibida por ${o.label}`,tipo:"entrada"},...(colab?[{ts:now(),txt:`Asignado a ${colab.nombre}`,tipo:"sistema"},{ts:now(),txt:"Presupuesto solicitado por WhatsApp",tipo:"wa"}]:[])]:[...(getHistorial(inicial)),{ts:now(),txt:"Trabajo actualizado",tipo:"sistema"}];
const estadoFinal=esNuevo?(colab?"Presupuestando":"Solicitud"):(f.estado==="Solicitud"&&colab?"Presupuestando":f.estado);
    const trabajo={...f,clienteId:+f.clienteId,colaboradorId:f.colaboradorId?+f.colaboradorId:null,presupuestoColaborador:f.presupuestoColaborador||null,margen:+f.margen||30,precioCliente:precio,estado:estadoFinal,historial};
    const saved=await dbSaveTrabajo(trabajo);
    if(saved){
      if(esNuevo){setData(d=>({...d,trabajos:[...d.trabajos,{...saved,clienteId:saved.cliente_id,colaboradorId:saved.colaborador_id}]}));if(colab){toast("✅ Registrado — abriendo WhatsApp");setTimeout(()=>window.open(buildWA(colab,trabajo,cliente),"_blank"),400);}else toast("✅ Solicitud registrada");}
      else{setData(d=>({...d,trabajos:d.trabajos.map(x=>x.id===f.id?{...saved,clienteId:saved.cliente_id,colaboradorId:saved.colaborador_id}:x)}));toast("✅ Guardado");}
    }
    onClose();
  };
  return<div>
<Fld label="Cliente *">
      <div className="flex gap-2">
        <select className={S} value={f.clienteId} onChange={e=>set("clienteId",e.target.value)}><option value="">— Seleccionar —</option>{data.clientes.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}</select>
        <button type="button" onClick={()=>setShowNuevoCliente(!showNuevoCliente)} className="bg-[#1E3A5F] text-white px-3 rounded-xl text-sm font-bold whitespace-nowrap">+ Nuevo</button>
      </div>
    </Fld>
    {showNuevoCliente&&<div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-3 space-y-2">
      <div className="text-xs font-bold text-blue-800">Nuevo cliente</div>
      <input className={S} placeholder="Nombre *" value={nc.nombre} onChange={e=>setNc(x=>({...x,nombre:e.target.value}))}/>
      <input className={S} placeholder="Teléfono" value={nc.telefono} onChange={e=>setNc(x=>({...x,telefono:e.target.value}))}/>
      <input className={S} placeholder="Dirección" value={nc.direccion} onChange={e=>setNc(x=>({...x,direccion:e.target.value}))}/>
      <button type="button" onClick={async()=>{
        if(!nc.nombre.trim())return;
        const saved=await dbSaveCliente({...nc,creado:hoy()});
        if(saved){setData(d=>({...d,clientes:[...d.clientes,saved]}));set("clienteId",saved.id);setShowNuevoCliente(false);setNc({nombre:"",telefono:"",direccion:""});toast("✅ Cliente creado");}
      }} className="w-full bg-[#1E3A5F] text-white py-2 rounded-xl text-sm font-bold">Guardar cliente</button>
    </div>}
    <div className="grid grid-cols-2 gap-3">
      <Fld label="Tipo"><select className={S} value={f.tipo} onChange={e=>set("tipo",e.target.value)}>{TIPOS.map(t=><option key={t}>{t}</option>)}</select></Fld>
      <Fld label="Canal"><select className={S} value={f.origen} onChange={e=>set("origen",e.target.value)}>{ORIGENES.map(o=><option key={o.id} value={o.id}>{o.icon} {o.label}</option>)}</select></Fld>
      <Fld label="Prioridad"><select className={S} value={f.prioridad} onChange={e=>set("prioridad",e.target.value)}>{PRIORIDADES.map(p=><option key={p}>{p}</option>)}</select></Fld>
      <Fld label="Estado"><select className={S} value={f.estado} onChange={e=>set("estado",e.target.value)}>{FLUJO.map(e=><option key={e}>{e}</option>)}</select></Fld>
      <Fld label="Fecha"><input type="date" className={S} value={f.fecha||""} onChange={e=>set("fecha",e.target.value)}/></Fld>
      <Fld label="Hora"><input type="time" className={S} value={f.hora||""} onChange={e=>set("hora",e.target.value)}/></Fld>
    </div>
    <Fld label="Descripción *"><textarea className={S} rows={3} value={f.descripcion||""} onChange={e=>set("descripcion",e.target.value)} placeholder="Describe el trabajo..."/></Fld>
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-3">
      <div className="text-xs font-bold text-blue-800 mb-1.5">👷 Colaborador</div>
      {sugerido&&<div className="text-xs text-blue-700 mb-2">💡 Recomendado: <strong>{sugerido.nombre}</strong></div>}
      <select className={S} value={f.colaboradorId||""} onChange={e=>set("colaboradorId",e.target.value)}><option value="">— Sin asignar —</option>{data.colaboradores.filter(c=>c.activo).map(c=><option key={c.id} value={c.id}>{c.nombre} ({c.especialidades?.[0]}){sugerido?.id===c.id?" ★":""}</option>)}</select>
      {f.colaboradorId&&<p className="text-[10px] text-blue-600 mt-1.5">✓ Se pedirá presupuesto por WhatsApp al guardar</p>}
    </div>
    <PresBox colab={f.presupuestoColaborador} margen={f.margen} onChange={set}/>
    <Fld label="Notas"><textarea className={S} rows={2} value={f.notas||""} onChange={e=>set("notas",e.target.value)}/></Fld>
    <button onClick={save} className="w-full bg-[#1E3A5F] hover:bg-[#152d4a] text-white py-3 rounded-xl font-bold text-sm transition mt-1">{esNuevo?(f.colaboradorId?"Registrar y pedir presupuesto 📱":"Registrar solicitud"):"Guardar cambios"}</button>
  </div>;
}

function Home({data,setData,go,setTid,toast}){
  const nuevas=data.trabajos.filter(t=>t.estado==="Solicitud").length;
  const activos=data.trabajos.filter(t=>["Presupuestando","Presupuesto enviado","Aceptado","En curso"].includes(t.estado)).length;
  const cerrados=data.trabajos.filter(t=>t.estado==="Completado").length;
  const ingresos=data.trabajos.filter(t=>t.estado==="Completado").reduce((s,t)=>s+(getPrecioCliente(t)||0),0);
  const costes=data.trabajos.filter(t=>t.estado==="Completado").reduce((s,t)=>s+(getPresupColab(t)||0),0);
  const sinAsignar=data.trabajos.filter(t=>t.estado==="Solicitud");
  const proximas=[...data.trabajos].filter(t=>["Aceptado","En curso"].includes(t.estado)&&t.fecha>=hoy()).sort((a,b)=>a.fecha.localeCompare(b.fecha)).slice(0,4);

  return<div className="space-y-4">
    <div className="grid grid-cols-3 gap-3">
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <div className="text-[11px] text-gray-400 font-medium mb-1 flex items-center gap-1">💰 Facturado</div>
        <div className="text-xl font-bold text-gray-800">{ingresos}€</div>
      </div>
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <div className="text-[11px] text-gray-400 font-medium mb-1 flex items-center gap-1">👷 Pagado</div>
        <div className="text-xl font-bold text-red-500">{costes}€</div>
      </div>
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <div className="text-[11px] text-gray-400 font-medium mb-1 flex items-center gap-1">📈 Beneficio</div>
        <div className="text-xl font-bold text-emerald-600">{ingresos-costes}€</div>
      </div>
    </div>

    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm grid grid-cols-3 gap-2 text-center">
      <div><div className="text-2xl font-bold text-gray-800">{nuevas}</div><div className="text-[11px] text-gray-400 mt-0.5">Nuevas</div></div>
      <div className="border-x border-gray-100"><div className="text-2xl font-bold text-gray-800">{activos}</div><div className="text-[11px] text-gray-400 mt-0.5">Activos</div></div>
      <div><div className="text-2xl font-bold text-gray-800">{cerrados}</div><div className="text-[11px] text-gray-400 mt-0.5">Cerrados</div></div>
    </div>

    <div className="grid grid-cols-2 gap-3">
      {[
        {s:"nuevas",icon:"📥",label:"Nuevas demandas",desc:"Sin gestionar",badge:nuevas},
        {s:"demandas",icon:"📋",label:"Pipeline",desc:"Todos los estados",badge:activos},
        {s:"clientes",icon:"👤",label:"Clientes",desc:"Base de datos",badge:0},
        {s:"colaboradores",icon:"🔧",label:"Colaboradores",desc:"Equipo",badge:0},
      ].map(m=>(
        <button key={m.s} onClick={()=>go(m.s)} className="bg-white border border-gray-100 rounded-2xl p-4 text-left shadow-sm hover:border-gray-300 hover:shadow-md active:scale-95 transition relative">
          {m.badge>0&&<span className="absolute top-3 right-3 bg-amber-500 text-white text-[10px] font-bold min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center">{m.badge}</span>}
          <div className="text-2xl mb-2">{m.icon}</div>
          <div className="font-semibold text-gray-800 text-sm">{m.label}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">{m.desc}</div>
        </button>
      ))}
    </div>

    {nuevas>0&&<div className="bg-white border border-amber-200 rounded-2xl p-4 shadow-sm">
      <div className="font-semibold text-amber-700 text-sm mb-2 flex items-center gap-2">⚡ {nuevas} demanda{nuevas>1?"s":""} sin asignar</div>
      {sinAsignar.slice(0,2).map(t=>{
        const cl=data.clientes.find(c=>c.id===getClienteId(t));
        const sg=sugerirColab(t.tipo,data.colaboradores,data.trabajos);
        return<div key={t.id} className="flex items-center justify-between gap-2 mt-2 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
          <div><div className="text-sm font-medium text-gray-800">{t.tipo} — {cl?.nombre}</div>{sg&&<div className="text-[11px] text-gray-500 mt-0.5">Sugerido: {sg.nombre}</div>}</div>
          {sg&&<button onClick={async()=>{const waUrl=buildWA(sg,t,cl);const updated={...t,colaboradorId:sg.id,estado:"Presupuestando",historial:[...getHistorial(t),{ts:now(),txt:`Asignado a ${sg.nombre}`,tipo:"sistema"},{ts:now(),txt:"Presupuesto solicitado WA",tipo:"wa"}]};await dbSaveTrabajo(updated);setData(d=>({...d,trabajos:d.trabajos.map(x=>x.id===t.id?{...x,colaboradorId:sg.id,colaborador_id:sg.id,estado:"Presupuestando"}:x)}));toast("Abriendo WhatsApp...");setTimeout(()=>window.open(waUrl,"_blank"),400);}} className="bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg transition whitespace-nowrap">Asignar</button>}
        </div>;
      })}
      <button onClick={()=>go("nuevas")} className="mt-2 text-xs text-amber-600 font-medium">Ver todas →</button>
    </div>}

    {proximas.length>0&&<div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3"><div className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Próximas visitas</div><button onClick={()=>go("demandas")} className="text-xs text-gray-400 hover:text-gray-600">Ver todo →</button></div>
      <div className="space-y-2">{proximas.map(t=>{const cl=data.clientes.find(c=>c.id===getClienteId(t));const co=data.colaboradores.find(c=>c.id===getColabId(t));return<div key={t.id} onClick={()=>setTid(t.id)} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 rounded-xl px-2 py-2 transition"><div className="text-center min-w-[36px]"><div className="text-lg font-bold text-[#1E3A5F] leading-none">{new Date(t.fecha+"T00:00:00").getDate()}</div><div className="text-[9px] text-gray-400 uppercase">{new Date(t.fecha+"T00:00:00").toLocaleDateString("es-ES",{month:"short"})}</div></div><div className="flex-1 min-w-0"><div className="font-medium text-sm text-gray-800 truncate">{t.tipo} — {cl?.nombre}</div><div className="text-xs text-gray-400">{t.hora} · {co?.nombre||"Sin asignar"}</div></div><Badge text={t.estado}/></div>;})}
      </div>
    </div>}
  </div>;
}
function NuevasDemandas({data,setData,onBack,toast,onVer}){
  const nuevas=data.trabajos.filter(t=>t.estado==="Solicitud");
  return<div>
    <Back title={`Nuevas demandas (${nuevas.length})`} onBack={onBack}/>
    {nuevas.length===0&&<div className="text-center py-16"><div className="text-5xl mb-3">✅</div><div className="font-bold text-gray-700">Todo gestionado</div></div>}
    <div className="space-y-3">{nuevas.map(t=>{
      const cl=data.clientes.find(c=>c.id===getClienteId(t));
      const sg=sugerirColab(t.tipo,data.colaboradores,data.trabajos);
      const notas=getNotas(t);
      const fotoUrl=notas.startsWith('foto:')?notas.replace('foto:',''):null;
      return<div key={t.id} onClick={()=>onVer(t.id)} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm cursor-pointer hover:border-[#1E3A5F] transition">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div><div className="flex items-center gap-2 flex-wrap mb-0.5"><span className="font-black text-gray-800">{t.tipo}</span><span className={`text-[10px] font-bold ${PRIO_CFG[t.prioridad]?.text}`}>{PRIO_CFG[t.prioridad]?.icon} {t.prioridad}</span></div><div className="text-sm text-gray-600">{t.descripcion}</div></div>
          <OrigenTag id={t.origen}/>
        </div>
        {fotoUrl&&<img src={fotoUrl} alt="foto" className="w-full h-32 object-cover rounded-xl mb-3"/>}
        <div className="bg-gray-50 rounded-xl p-3 mb-3 text-sm">
          <div className="font-semibold text-gray-800">{cl?.nombre}</div>
          <div className="text-xs text-gray-500 mt-0.5">{cl?.telefono}</div>
          <div className="text-xs text-gray-400 truncate">📍 {cl?.direccion}</div>
          <div className="text-xs text-gray-400 mt-0.5">📅 {fmt(t.fecha)} · {t.hora}</div>
        </div>
        {sg?<div className="bg-orange-50 border border-orange-200 rounded-xl p-3" onClick={e=>e.stopPropagation()}>
          <div className="text-xs text-orange-700 mb-2">💡 Sugerido: <strong>{sg.nombre}</strong> ({sg.especialidades?.[0]})</div>
          <div className="flex gap-2">
            <button onClick={async(e)=>{e.stopPropagation();const waUrl=buildWA(sg,t,cl);const updated={...t,colaboradorId:sg.id,estado:"Presupuestando",historial:[...getHistorial(t),{ts:now(),txt:`Asignado a ${sg.nombre}`,tipo:"sistema"},{ts:now(),txt:"Presupuesto solicitado WA",tipo:"wa"}]};await dbSaveTrabajo(updated);setData(d=>({...d,trabajos:d.trabajos.map(x=>x.id===t.id?{...x,colaboradorId:sg.id,colaborador_id:sg.id,estado:"Presupuestando"}:x)}));toast("📱 Abriendo WhatsApp...");setTimeout(()=>window.open(waUrl,"_blank"),400);}} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold py-2 rounded-xl transition">Asignar y pedir presupuesto 📱</button>
            <button onClick={e=>{e.stopPropagation();onVer(t.id);}} className="border border-gray-200 text-gray-500 px-3 rounded-xl text-sm">Editar</button>
          </div>
        </div>:<button onClick={e=>{e.stopPropagation();onVer(t.id);}} className="w-full border-2 border-dashed border-gray-200 text-gray-400 py-2.5 rounded-xl text-sm hover:border-[#1E3A5F] hover:text-[#1E3A5F] transition">Asignar manualmente →</button>}
      </div>;
    })}</div>
  </div>;
}

function TarjetaTrabajo({t,data,setData,toast,onVer,alertColor}){
  const[abierta,setAbierta]=useState(false);
  const cl=data.clientes.find(c=>c.id===getClienteId(t));
  const co=data.colaboradores.find(c=>c.id===getColabId(t));
  const notas=getNotas(t);
  const disponibilidad=notas.includes('disponibilidad:')?notas.split('disponibilidad:')[1]?.split('|')[0]?.trim():null;
  const presupUrl=notas.startsWith('presup:')?notas.replace('presup:',''):null;
  const cfg=ESTADO_CFG[t.estado]||{bg:"bg-gray-100",text:"text-gray-500",dot:"bg-gray-300"};

  const avanzar=async(nuevoEstado,txtHistorial)=>{
    const hist=[...getHistorial(t),{ts:now(),txt:txtHistorial,tipo:"sistema"}];
    const saved=await dbSaveTrabajo({...t,estado:nuevoEstado,historial:hist});
    if(saved){setData(d=>({...d,trabajos:d.trabajos.map(x=>x.id===t.id?{...saved,clienteId:saved.cliente_id,colaboradorId:saved.colaborador_id}:x)}));toast(`→ ${nuevoEstado}`);}
  };

  return<div className={`bg-white border rounded-2xl overflow-hidden shadow-sm ${alertColor||"border-gray-100"}`}>
    <div onClick={()=>setAbierta(!abierta)} className="px-4 py-3.5 cursor-pointer flex justify-between items-center hover:bg-gray-50 transition">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap mb-1">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.bg} ${cfg.text}`}><span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}/>{t.estado}</span>
          <span className={`text-[10px] font-bold ${PRIO_CFG[t.prioridad]?.text}`}>{PRIO_CFG[t.prioridad]?.icon}</span>
        </div>
        <div className="text-sm font-semibold text-gray-800">{t.tipo} — {cl?.nombre}</div>
        <div className="text-[11px] text-gray-400 mt-0.5">{co?co.nombre:"Sin colaborador"} · {fmt(t.fecha)}</div>
      </div>
      <span className={`text-gray-300 text-lg transition-transform flex-shrink-0 ml-2 ${abierta?"rotate-180":""}`}>▾</span>
    </div>

    {abierta&&<div className="border-t border-gray-100">
      <div className="px-4 py-3 grid grid-cols-2 gap-3 border-b border-gray-50">
        <div><div className="text-[10px] text-gray-400 uppercase font-bold mb-0.5">Cliente</div><div className="text-sm font-medium text-gray-800">{cl?.nombre}</div><div className="text-[11px] text-gray-500">{cl?.telefono}</div></div>
        <div><div className="text-[10px] text-gray-400 uppercase font-bold mb-0.5">Colaborador</div><div className="text-sm font-medium text-gray-800">{co?.nombre||"Sin asignar"}</div><div className="text-[11px] text-gray-500">{co?.telefono}</div></div>
        <div className="col-span-2"><div className="text-[10px] text-gray-400 uppercase font-bold mb-0.5">Dirección</div><div className="text-sm text-gray-700">{cl?.direccion||"—"}</div></div>
        <div className="col-span-2"><div className="text-[10px] text-gray-400 uppercase font-bold mb-0.5">Descripción</div><div className="text-sm text-gray-700 leading-relaxed">{t.descripcion}</div></div>
      </div>

      {disponibilidad&&<div className="px-4 py-3 bg-teal-50 border-b border-gray-50">
        <div className="text-[10px] text-teal-700 uppercase font-bold mb-1">📅 Disponibilidad del colaborador</div>
        <div className="text-sm text-teal-800">{disponibilidad}</div>
      </div>}

      {presupUrl&&<div className="px-4 py-3 bg-purple-50 border-b border-gray-50">
        <a href={presupUrl} target="_blank" className="text-sm text-purple-700 font-semibold hover:underline">📄 Ver presupuesto del colaborador →</a>
      </div>}

      <div className="px-4 py-3 bg-gray-900">
        <div className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-2">Financiero</div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div><div className="text-base font-bold text-red-400">{getPresupColab(t)?`${getPresupColab(t)}€`:"—"}</div><div className="text-[10px] text-gray-400">Colab.</div></div>
          <div><div className="text-base font-bold text-blue-400">{t.margen||30}%</div><div className="text-[10px] text-gray-400">Margen</div></div>
          <div><div className="text-base font-bold text-emerald-400">{getPrecioCliente(t)?`${getPrecioCliente(t)}€`:"—"}</div><div className="text-[10px] text-gray-400">Cliente</div></div>
        </div>
      </div>

      <div className="px-4 py-3 space-y-2">
        <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">Acciones</div>
        {t.estado==="Solicitud"&&<button onClick={()=>onVer(t.id)} className="w-full bg-[#1E3A5F] text-white py-2.5 rounded-xl text-sm font-semibold transition hover:bg-[#152d4a]">👷 Asignar colaborador</button>}
        {t.estado==="Presupuestando"&&co&&<>
          <button onClick={()=>{window.open(buildWA(co,t,cl),"_blank");toast("📱 WhatsApp...");}} className="w-full bg-green-500 text-white py-2.5 rounded-xl text-sm font-semibold transition hover:bg-green-600">📱 Reenviar WhatsApp a {co.nombre.split(" ")[0]}</button>
        </>}
{t.estado==="Colaborador disponible"&&cl?.telefono&&<button onClick={async()=>{window.open(buildWAVisitaCliente(cl,t,co),"_blank");await avanzar("Visita propuesta","Fecha propuesta al cliente por WhatsApp");}} className="w-full bg-cyan-500 text-white py-2.5 rounded-xl text-sm font-semibold transition hover:bg-cyan-600">📱 Proponer fecha al cliente</button>}
{t.estado==="Cliente confirmó"&&co&&<button onClick={async()=>{window.open(buildWAConfirmacionColab(co,t,cl),"_blank");await avanzar("En curso","Visita programada — colaborador avisado");}} className="w-full bg-teal-500 text-white py-2.5 rounded-xl text-sm font-semibold transition hover:bg-teal-600">✅ Avisar colaborador — visita programada</button>}        
        {t.estado==="Presupuesto recibido"&&<button onClick={()=>onVer(t.id)} className="w-full bg-purple-600 text-white py-2.5 rounded-xl text-sm font-semibold transition hover:bg-purple-700">📄 Revisar y generar PDF Domia</button>}
        {t.estado==="Presupuesto enviado"&&<button onClick={()=>avanzar("Aceptado","Cliente aceptó el presupuesto")} className="w-full bg-violet-500 text-white py-2.5 rounded-xl text-sm font-semibold transition hover:bg-violet-600">🤝 Cliente aceptó</button>}
        {t.estado==="Aceptado"&&<button onClick={()=>avanzar("En curso","Trabajo iniciado")} className="w-full bg-orange-500 text-white py-2.5 rounded-xl text-sm font-semibold transition hover:bg-orange-600">🔧 Marcar en curso</button>}
        {t.estado==="En curso"&&<button onClick={()=>avanzar("Completado","Trabajo completado")} className="w-full bg-emerald-500 text-white py-2.5 rounded-xl text-sm font-semibold transition hover:bg-emerald-600">✅ Marcar completado</button>}
        <button onClick={()=>onVer(t.id)} className="w-full bg-white border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-semibold transition hover:border-gray-400">✏️ Ver ficha completa / Editar</button>
      </div>
    </div>}
  </div>;
}

function EstadoDemandas({data,setData,onBack,toast,onVer}){
  const[busca,setBusca]=useState("");
  let items=[...data.trabajos];
  if(busca.trim()){const q=busca.toLowerCase();items=items.filter(t=>{const cl=data.clientes.find(c=>c.id===getClienteId(t));return t.descripcion?.toLowerCase().includes(q)||cl?.nombre.toLowerCase().includes(q)||t.tipo?.toLowerCase().includes(q);});}

  const atencion=items.filter(t=>["Solicitud","Colaborador disponible","Cliente confirmó","Presupuesto recibido"].includes(t.estado));
  const esperandoColab=items.filter(t=>t.estado==="Presupuestando");
  const esperandoCliente=items.filter(t=>["Visita propuesta","Presupuesto enviado"].includes(t.estado));
  const activos=items.filter(t=>["Aceptado","En curso"].includes(t.estado));
  const completados=items.filter(t=>t.estado==="Completado");
  const cancelados=items.filter(t=>t.estado==="Cancelado");

  const Seccion=({titulo,items:its,color})=>its.length===0?null:<div className="mb-4">
    <div className="flex items-center gap-2 mb-2">
      <span className={`w-2 h-2 rounded-full ${color}`}/>
      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">{titulo}</span>
      <span className="ml-auto text-[11px] font-bold text-gray-400">{its.length}</span>
    </div>
    <div className="space-y-2">{its.map(t=><TarjetaTrabajo key={t.id} t={t} data={data} setData={setData} toast={toast} onVer={onVer}/>)}</div>
  </div>;

  return<div>
    <Back title="Pipeline" onBack={onBack}/>
    <input className={S+" mb-4"} placeholder="🔍 Buscar cliente, tipo..." value={busca} onChange={e=>setBusca(e.target.value)}/>

    {atencion.length>0&&<div className="bg-red-50 border-2 border-red-200 rounded-2xl p-3 mb-4">
      <div className="font-bold text-red-700 text-sm mb-2 flex items-center gap-2">🔔 Requiere tu atención ({atencion.length})</div>
      <div className="space-y-2">{atencion.map(t=><TarjetaTrabajo key={t.id} t={t} data={data} setData={setData} toast={toast} onVer={onVer} alertColor="border-red-200"/>)}</div>
    </div>}

    <Seccion titulo="Esperando colaborador" items={esperandoColab} color="bg-amber-400"/>
    <Seccion titulo="Esperando cliente" items={esperandoCliente} color="bg-cyan-500"/>
    <Seccion titulo="Activos" items={activos} color="bg-orange-500"/>
    <Seccion titulo="Completados" items={completados} color="bg-emerald-500"/>
    <Seccion titulo="Cancelados" items={cancelados} color="bg-gray-300"/>

    {items.length===0&&<div className="text-center py-16 text-gray-400 text-sm">Sin demandas</div>}
  </div>;
}
function Clientes({data,setData,onBack,toast}){
  const[cid,setCid]=useState(null);
  const[editando,setEditando]=useState(false);
  const[form,setForm]=useState({});
  const[showNew,setShowNew]=useState(false);
  const[busca,setBusca]=useState("");
  const[fAct,setFAct]=useState("Todos");
  if(!cid){
    let list=[...data.clientes];
    if(busca.trim()){const q=busca.toLowerCase();list=list.filter(c=>c.nombre.toLowerCase().includes(q)||c.telefono?.includes(busca));}
    if(fAct==="Con activos")list=list.filter(c=>data.trabajos.some(t=>getClienteId(t)===c.id&&!["Completado","Cancelado"].includes(t.estado)));
    if(fAct==="Sin trabajos")list=list.filter(c=>!data.trabajos.some(t=>getClienteId(t)===c.id));
    return<div>
      <Back title="Clientes" onBack={onBack} right={<button onClick={()=>setShowNew(true)} className="bg-[#1E3A5F] text-white text-xs font-bold px-3 py-1.5 rounded-xl hover:bg-[#152d4a] transition">+ Nuevo</button>}/>
      <input className={S+" mb-3"} placeholder="🔍 Nombre o teléfono..." value={busca} onChange={e=>setBusca(e.target.value)}/>
      <div className="flex gap-1.5 mb-4 flex-wrap">{["Todos","Con activos","Sin trabajos"].map(o=><Pill key={o} label={o} active={fAct===o} onClick={()=>setFAct(o)}/>)}</div>
      <div className="text-xs text-gray-400 font-semibold mb-3">{list.length} cliente{list.length!==1?"s":""}</div>
      <div className="space-y-2">{list.map(c=>{const ts=data.trabajos.filter(t=>getClienteId(t)===c.id);const act=ts.filter(t=>!["Completado","Cancelado"].includes(t.estado)).length;const ing=ts.filter(t=>t.estado==="Completado").reduce((s,t)=>s+(getPrecioCliente(t)||0),0);return<div key={c.id} onClick={()=>setCid(c.id)} className="bg-white border border-gray-100 rounded-2xl px-4 py-4 shadow-sm cursor-pointer hover:border-[#1E3A5F] hover:shadow-md transition"><div className="flex items-center justify-between mb-1"><div className="font-bold text-gray-800">{c.nombre}</div><span className="text-[#1E3A5F] text-xl">›</span></div><div className="text-xs text-gray-500">{c.telefono}{c.email?` · ${c.email}`:""}</div>{c.direccion&&<div className="text-xs text-gray-400 truncate mt-0.5">📍 {c.direccion}</div>}<div className="flex items-center gap-2 mt-2"><span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{ts.length} trabajo{ts.length!==1?"s":""}</span>{act>0&&<span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">{act} activo{act>1?"s":""}</span>}{ing>0&&<span className="text-[10px] text-emerald-700 font-bold ml-auto">{ing}€</span>}</div></div>;})}
      {list.length===0&&<div className="text-center py-10 text-sm text-gray-400">Sin resultados</div>}
      </div>
      {showNew&&<Modal title="Nuevo cliente" onClose={()=>setShowNew(false)}>
        {(()=>{const[f,setF]=useState({nombre:"",telefono:"",email:"",direccion:"",notas:""});return<><Fld label="Nombre *"><input className={S} value={f.nombre} onChange={e=>setF(x=>({...x,nombre:e.target.value}))}/></Fld><Fld label="Teléfono"><input className={S} value={f.telefono} onChange={e=>setF(x=>({...x,telefono:e.target.value}))}/></Fld><Fld label="Email"><input className={S} value={f.email} onChange={e=>setF(x=>({...x,email:e.target.value}))}/></Fld><Fld label="Dirección"><input className={S} value={f.direccion} onChange={e=>setF(x=>({...x,direccion:e.target.value}))}/></Fld><Fld label="Notas"><textarea className={S} rows={2} value={f.notas} onChange={e=>setF(x=>({...x,notas:e.target.value}))}/></Fld><button onClick={async()=>{if(!f.nombre.trim())return;const saved=await dbSaveCliente({...f,creado:hoy()});if(saved){setData(d=>({...d,clientes:[...d.clientes,saved]}));setShowNew(false);toast("✅ Cliente creado");}}} className="w-full bg-[#1E3A5F] hover:bg-[#152d4a] text-white py-2.5 rounded-xl font-bold text-sm transition">Guardar</button></>;})()}
      </Modal>}
    </div>;
  }
  const cl=data.clientes.find(c=>c.id===cid);
  const hist=data.trabajos.filter(t=>getClienteId(t)===cid).sort((a,b)=>b.id-a.id);
  const ing=hist.filter(t=>t.estado==="Completado").reduce((s,t)=>s+(getPrecioCliente(t)||0),0);
  const act=hist.filter(t=>!["Completado","Cancelado"].includes(t.estado)).length;
  if(editando)return<div>
    <Back title={`Editar — ${cl?.nombre}`} onBack={()=>setEditando(false)}/>
    <Fld label="Nombre *"><input className={S} value={form.nombre||""} onChange={e=>setForm(f=>({...f,nombre:e.target.value}))}/></Fld>
    <Fld label="Teléfono"><input className={S} value={form.telefono||""} onChange={e=>setForm(f=>({...f,telefono:e.target.value}))}/></Fld>
    <Fld label="Email"><input className={S} value={form.email||""} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/></Fld>
    <Fld label="Dirección"><input className={S} value={form.direccion||""} onChange={e=>setForm(f=>({...f,direccion:e.target.value}))}/></Fld>
    <Fld label="Notas"><textarea className={S} rows={3} value={form.notas||""} onChange={e=>setForm(f=>({...f,notas:e.target.value}))}/></Fld>
    <div className="flex gap-2">
      <button onClick={async()=>{const saved=await dbSaveCliente(form);if(saved){setData(d=>({...d,clientes:d.clientes.map(c=>c.id===cid?saved:c)}));setEditando(false);toast("✅ Guardado");}}} className="flex-1 bg-[#1E3A5F] hover:bg-[#152d4a] text-white py-2.5 rounded-xl font-bold text-sm transition">Guardar</button>
      <button onClick={async()=>{if(!confirm(`¿Eliminar a ${cl?.nombre}?`))return;await supabase.from('clientes').delete().eq('id',cid);setData(d=>({...d,clientes:d.clientes.filter(c=>c.id!==cid)}));setCid(null);}} className="bg-red-50 text-red-500 px-4 py-2.5 rounded-xl text-sm">Eliminar</button>
    </div>
  </div>;
  return<div>
    <Back title={cl?.nombre} onBack={()=>setCid(null)} right={<button onClick={()=>{setForm({...cl});setEditando(true);}} className="border border-gray-200 text-gray-500 text-xs font-semibold px-3 py-1.5 rounded-xl hover:border-[#1E3A5F] hover:text-[#1E3A5F] transition">Editar</button>}/>
    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm mb-4">
      <div className="grid grid-cols-2 gap-3 text-sm mb-3"><div><div className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Teléfono</div><div className="font-semibold">{cl?.telefono||"—"}</div></div><div><div className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Email</div><div className="font-semibold text-xs break-all">{cl?.email||"—"}</div></div></div>
      {cl?.direccion&&<div className="text-xs text-gray-500 mb-2">📍 {cl.direccion}</div>}
      {cl?.notas&&<div className="text-xs text-gray-400 bg-gray-50 rounded-lg p-2 mb-3">📝 {cl.notas}</div>}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-amber-50 rounded-xl p-2 text-center"><div className="font-black text-amber-700">{act}</div><div className="text-[10px] text-amber-600">Activos</div></div>
        <div className="bg-emerald-50 rounded-xl p-2 text-center"><div className="font-black text-emerald-700">{ing}€</div><div className="text-[10px] text-emerald-600">Facturado</div></div>
        <div className="bg-blue-50 rounded-xl p-2 text-center"><div className="font-black text-blue-700">{hist.length}</div><div className="text-[10px] text-blue-600">Total</div></div>
      </div>
    </div>
    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Historial de trabajos</div>
    {hist.length===0&&<p className="text-sm text-gray-400 text-center py-8">Sin trabajos registrados</p>}
    <div className="space-y-2">{hist.map(t=><div key={t.id} className="bg-white border border-gray-100 rounded-2xl p-3 shadow-sm"><div className="flex items-start justify-between gap-2 mb-1"><div><div className="font-semibold text-sm text-gray-800">{t.tipo}</div><div className="text-xs text-gray-500 truncate">{t.descripcion}</div></div><Badge text={t.estado}/></div><div className="flex items-center gap-2"><OrigenTag id={t.origen}/><span className="text-[10px] text-gray-400">📅 {fmt(t.fecha)}</span>{getPrecioCliente(t)&&<span className="text-xs font-bold text-emerald-700 ml-auto">{getPrecioCliente(t)}€</span>}</div></div>)}</div>
  </div>;
}

function Colaboradores({data,setData,onBack,toast}){
  const[coid,setCoid]=useState(null);
  const[editando,setEditando]=useState(false);
  const[form,setForm]=useState({});
  const[showNew,setShowNew]=useState(false);
  const[busca,setBusca]=useState("");
  const[fEsp,setFEsp]=useState("Todas");
  const[fEst,setFEst]=useState("Todos");
  const[fZona,setFZona]=useState("Todas");
  const zonas=["Todas",...[...new Set(data.colaboradores.map(c=>c.zona).filter(Boolean))]];
  const FormColab=({ini,onSave,onCancel})=>{
    const[f,setF]=useState(ini||{nombre:"",especialidades:[TIPOS[0]],telefono:"",whatsapp:"",activo:true,zona:"",disponibilidad:[0,1,2,3,4],valoracion:5,trabajosCompletados:0});
    const tE=t=>setF(x=>({...x,especialidades:x.especialidades?.includes(t)?x.especialidades.filter(e=>e!==t):[...(x.especialidades||[]),t]}));
    const tD=i=>setF(x=>({...x,disponibilidad:x.disponibilidad?.includes(i)?x.disponibilidad.filter(d=>d!==i):[...(x.disponibilidad||[]),i]}));
    return<div>
      <Fld label="Nombre *"><input className={S} value={f.nombre||""} onChange={e=>setF(x=>({...x,nombre:e.target.value}))}/></Fld>
      <div className="grid grid-cols-2 gap-3">
        <Fld label="Teléfono"><input className={S} value={f.telefono||""} onChange={e=>setF(x=>({...x,telefono:e.target.value}))}/></Fld>
        <Fld label="WhatsApp (34...)"><input className={S} value={f.whatsapp||""} onChange={e=>setF(x=>({...x,whatsapp:e.target.value}))} placeholder="34666..."/></Fld>
      </div>
      <Fld label="Zona"><input className={S} value={f.zona||""} onChange={e=>setF(x=>({...x,zona:e.target.value}))}/></Fld>
      <Fld label="Especialidades"><div className="flex flex-wrap gap-1.5">{TIPOS.map(t=><button key={t} type="button" onClick={()=>tE(t)} className={`text-xs px-2.5 py-1 rounded-full border transition ${f.especialidades?.includes(t)?"bg-[#1E3A5F] text-white border-[#1E3A5F]":"bg-white text-gray-500 border-gray-200 hover:border-[#1E3A5F]"}`}>{t}</button>)}</div></Fld>
      <Fld label="Disponibilidad"><div className="flex gap-1.5">{DIAS.map((d,i)=><button key={i} type="button" onClick={()=>tD(i)} className={`flex-1 text-[10px] py-2 rounded-lg font-bold transition ${f.disponibilidad?.includes(i)?"bg-emerald-500 text-white":"bg-gray-100 text-gray-400"}`}>{d}</button>)}</div></Fld>
      <Fld label="Estado"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={!!f.activo} onChange={e=>setF(x=>({...x,activo:e.target.checked}))} className="accent-[#1E3A5F] w-4 h-4"/><span className="text-sm text-gray-700">Colaborador activo</span></label></Fld>
      <div className="flex gap-2"><button onClick={()=>onSave(f)} className="flex-1 bg-[#1E3A5F] hover:bg-[#152d4a] text-white py-2.5 rounded-xl font-bold text-sm transition">Guardar</button>{onCancel&&<button onClick={onCancel} className="px-4 py-2.5 border border-gray-200 text-gray-500 rounded-xl text-sm">Cancelar</button>}</div>
    </div>;
  };
  if(!coid){
    let list=[...data.colaboradores];
    if(busca.trim()){const q=busca.toLowerCase();list=list.filter(c=>c.nombre.toLowerCase().includes(q)||c.zona?.toLowerCase().includes(q)||c.telefono?.includes(busca));}
    if(fEsp!=="Todas")list=list.filter(c=>c.especialidades?.includes(fEsp));
    if(fEst==="Activo")list=list.filter(c=>c.activo);
    if(fEst==="Inactivo")list=list.filter(c=>!c.activo);
    if(fZona!=="Todas")list=list.filter(c=>c.zona===fZona);
    return<div>
      <Back title="Colaboradores" onBack={onBack} right={<button onClick={()=>setShowNew(true)} className="bg-[#1E3A5F] text-white text-xs font-bold px-3 py-1.5 rounded-xl hover:bg-[#152d4a] transition">+ Nuevo</button>}/>
      <input className={S+" mb-3"} placeholder="🔍 Nombre, zona o teléfono..." value={busca} onChange={e=>setBusca(e.target.value)}/>
      <div className="mb-3"><div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Especialidad</div><div className="flex gap-1.5 flex-wrap">{["Todas",...TIPOS].map(t=><Pill key={t} label={t} active={fEsp===t} onClick={()=>setFEsp(t)}/>)}</div></div>
      <div className="mb-3"><div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Estado</div><div className="flex gap-1.5">{["Todos","Activo","Inactivo"].map(o=><Pill key={o} label={o} active={fEst===o} onClick={()=>setFEst(o)}/>)}</div></div>
      {zonas.length>1&&<div className="mb-4"><div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Zona</div><div className="flex gap-1.5 flex-wrap">{zonas.map(z=><Pill key={String(z)} label={String(z)} active={fZona===z} onClick={()=>setFZona(z)}/>)}</div></div>}
      <div className="text-xs text-gray-400 font-semibold mb-3">{list.length} colaborador{list.length!==1?"es":""}</div>
      <div className="space-y-2">{list.map(c=>{const act=data.trabajos.filter(t=>getColabId(t)===c.id&&["Presupuestando","Aceptado","En curso"].includes(t.estado)).length;const pag=data.trabajos.filter(t=>getColabId(t)===c.id&&t.estado==="Completado").reduce((s,t)=>s+(getPresupColab(t)||0),0);return<div key={c.id} onClick={()=>setCoid(c.id)} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm cursor-pointer hover:border-[#1E3A5F] hover:shadow-md transition"><div className="flex items-start justify-between mb-2"><div><div className="flex items-center gap-2 flex-wrap"><span className="font-bold text-gray-800">{c.nombre}</span><span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${c.activo?"bg-emerald-100 text-emerald-700":"bg-gray-100 text-gray-400"}`}>{c.activo?"Activo":"Inactivo"}</span>{act>0&&<span className="text-[10px] bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-bold">{act} en curso</span>}</div><div className="text-xs text-gray-500 mt-0.5">{c.especialidades?.join(" · ")}</div><div className="text-xs text-gray-400">{c.telefono}{c.zona?` · ${c.zona}`:""}</div></div><div className="text-right"><span className="text-[#1E3A5F] text-xl">›</span>{pag>0&&<div className="text-xs text-red-500 font-bold">{pag}€</div>}</div></div><div className="flex gap-0.5">{DIAS.map((d,i)=><span key={i} className={`text-[9px] w-6 h-6 flex items-center justify-center rounded-lg font-bold ${c.disponibilidad?.includes(i)?"bg-emerald-100 text-emerald-600":"bg-gray-100 text-gray-300"}`}>{d}</span>)}</div></div>;})}
      {list.length===0&&<div className="text-center py-10 text-sm text-gray-400">Sin resultados.</div>}
      </div>
      {showNew&&<Modal title="Nuevo colaborador" onClose={()=>setShowNew(false)}><FormColab onSave={async f=>{if(!f.nombre.trim())return;const saved=await dbSaveColab(f);if(saved){setData(d=>({...d,colaboradores:[...d.colaboradores,saved]}));setShowNew(false);toast("✅ Colaborador creado");}}} onCancel={()=>setShowNew(false)}/></Modal>}
    </div>;
  }
  const co=data.colaboradores.find(x=>x.id===coid);
  const ts=data.trabajos.filter(t=>getColabId(t)===coid).sort((a,b)=>b.id-a.id);
  const act=ts.filter(t=>["Presupuestando","Aceptado","En curso"].includes(t.estado)).length;
  const done=ts.filter(t=>t.estado==="Completado").length;
  const pag=ts.filter(t=>t.estado==="Completado").reduce((s,t)=>s+(getPresupColab(t)||0),0);
  if(editando)return<div>
    <Back title={`Editar — ${co?.nombre}`} onBack={()=>setEditando(false)}/>
    <FormColab ini={form} onSave={async f=>{const saved=await dbSaveColab({...f,id:coid});if(saved){setData(d=>({...d,colaboradores:d.colaboradores.map(x=>x.id===coid?saved:x)}));setEditando(false);toast("✅ Guardado");}}} onCancel={()=>setEditando(false)}/>
    <button onClick={async()=>{if(!confirm("¿Eliminar?"))return;await supabase.from('colaboradores').delete().eq('id',coid);setData(d=>({...d,colaboradores:d.colaboradores.filter(x=>x.id!==coid)}));setCoid(null);}} className="w-full mt-2 bg-red-50 text-red-500 py-2.5 rounded-xl text-sm hover:bg-red-100 transition">Eliminar colaborador</button>
  </div>;
  return<div>
    <Back title={co?.nombre} onBack={()=>setCoid(null)} right={<button onClick={()=>{setForm({...co});setEditando(true);}} className="border border-gray-200 text-gray-500 text-xs font-semibold px-3 py-1.5 rounded-xl hover:border-[#1E3A5F] hover:text-[#1E3A5F] transition">Editar</button>}/>
    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm mb-4">
      <div className="flex flex-wrap items-center gap-2 mb-3"><span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${co?.activo?"bg-emerald-100 text-emerald-700":"bg-gray-100 text-gray-400"}`}>{co?.activo?"Activo":"Inactivo"}</span>{co?.especialidades?.map(e=><span key={e} className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-semibold border border-blue-100">{e}</span>)}</div>
      <div className="grid grid-cols-2 gap-3 text-sm mb-3"><div><div className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Teléfono</div><div className="font-semibold">{co?.telefono||"—"}</div></div><div><div className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Zona</div><div className="font-semibold">{co?.zona||"—"}</div></div></div>
      <div className="text-[10px] text-gray-400 font-bold uppercase mb-1.5">Disponibilidad</div>
      <div className="flex gap-1 mb-3">{DIAS.map((d,i)=><span key={i} className={`flex-1 text-[10px] py-1.5 flex items-center justify-center rounded-lg font-bold ${co?.disponibilidad?.includes(i)?"bg-emerald-100 text-emerald-600":"bg-gray-100 text-gray-300"}`}>{d}</span>)}</div>
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-violet-50 rounded-xl p-2 text-center"><div className="font-black text-violet-700">{act}</div><div className="text-[10px] text-violet-600">Activos</div></div>
        <div className="bg-emerald-50 rounded-xl p-2 text-center"><div className="font-black text-emerald-700">{done}</div><div className="text-[10px] text-emerald-600">Completados</div></div>
        <div className="bg-red-50 rounded-xl p-2 text-center"><div className="font-black text-red-600">{pag}€</div><div className="text-[10px] text-red-500">Pagado</div></div>
      </div>
      {co?.whatsapp&&<button onClick={()=>window.open(`https://wa.me/${co.whatsapp}`,"_blank")} className="w-full mt-3 bg-green-500 hover:bg-green-600 text-white text-sm font-bold py-2.5 rounded-xl transition">📱 Abrir WhatsApp</button>}
    </div>
    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Trabajos asignados</div>
    {ts.length===0&&<p className="text-sm text-gray-400 text-center py-6">Sin trabajos asignados</p>}
    <div className="space-y-2">{ts.map(t=>{const cl=data.clientes.find(c=>c.id===getClienteId(t));return<div key={t.id} className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm flex items-center gap-2"><div className="flex-1 min-w-0"><div className="font-semibold text-sm text-gray-800">{t.tipo}</div><div className="text-xs text-gray-500 truncate">{cl?.nombre} · {fmt(t.fecha)}</div></div><div className="flex items-center gap-2">{getPresupColab(t)&&<span className="text-xs font-bold text-red-500">{getPresupColab(t)}€</span>}<Badge text={t.estado}/></div></div>;})}</div>
  </div>;
}
function EditorPresupuesto({t,cl,co,data,setData,onClose,toast}){
const[partidas,setPartidas]=useState([{desc:t.descripcion||"",importe:0}]);  const[margen,setMargen]=useState(t.margen||30);
  const totalColab=partidas.reduce((s,p)=>s+(+p.importe||0),0);
  const totalCliente=Math.round(totalColab*(1+margen/100));
  const addPartida=()=>setPartidas(p=>[...p,{desc:"",importe:0}]);
  const updPartida=(i,k,v)=>setPartidas(p=>p.map((x,idx)=>idx===i?{...x,[k]:v}:x));
  const delPartida=(i)=>setPartidas(p=>p.filter((_,idx)=>idx!==i));
  const[generando,setGenerando]=useState(false);
  const[pdfUrl,setPdfUrl]=useState<string|null>(null);

  const generarPDF=async()=>{
    setGenerando(true);
    const fecha=new Date().toLocaleDateString("es-ES",{day:"numeric",month:"long",year:"numeric"});
    const doc=new jsPDF();
    const azul="#1E3A5F";

    doc.setFontSize(24);
    doc.setTextColor(30,58,95);
    doc.text("DOMIA SERVICES",105,25,{align:"center"});
    doc.setFontSize(9);
    doc.setTextColor(150,150,150);
    doc.text("685 917 059 · Elche, Alicante",105,32,{align:"center"});

    doc.setFontSize(20);
    doc.setTextColor(30,58,95);
    doc.text("PRESUPUESTO",105,50,{align:"center"});

    doc.setFontSize(10);
    doc.setTextColor(80,80,80);
    doc.text(`Cliente: ${cl?.nombre||""}`,195,62,{align:"right"});
    doc.text(fecha,195,68,{align:"right"});

    doc.setFillColor(30,58,95);
    doc.rect(15,78,180,8,"F");
    doc.setTextColor(255,255,255);
    doc.setFontSize(10);
    doc.text("Descripción",18,83.5);

    let y=94;
    doc.setTextColor(60,60,60);
    partidas.filter(p=>p.desc).forEach(p=>{
      const lineas=doc.splitTextToSize(p.desc,170);
      doc.text(lineas,18,y);
      y+=lineas.length*6+4;
      doc.setDrawColor(230,230,230);
      doc.line(15,y-3,195,y-3);
    });

    y+=8;
    doc.setDrawColor(30,58,95);
    doc.setLineWidth(0.8);
    doc.rect(115,y,80,22);
    doc.setFontSize(9);
    doc.setTextColor(120,120,120);
    doc.text("TOTAL sin IVA",190,y+7,{align:"right"});
    doc.setFontSize(18);
    doc.setTextColor(30,58,95);
    doc.text(`${totalCliente}€`,190,y+17,{align:"right"});

    y+=34;
    doc.setFontSize(10);
    doc.setTextColor(60,60,60);
    doc.text("Forma de pago:",15,y);
    doc.setFontSize(9);
    doc.setTextColor(100,100,100);
    doc.text("• Entrega inicial del 50% antes de empezar el trabajo.",18,y+7);
    doc.text("• Entrega de un 25% a mitad del trabajo.",18,y+13);
    doc.text("• Entrega final del 25% restante al finalizar.",18,y+19);

    y+=30;
    doc.setFontSize(8);
    doc.setTextColor(150,150,150);
    const cond=doc.splitTextToSize("Este presupuesto tiene una validez de 30 días. Todo trabajo no especificado será presupuestado a parte.",175);
    doc.text(cond,15,y);

    doc.setFontSize(8);
    doc.setTextColor(150,150,150);
    doc.text("DOMIA SERVICES · 685 917 059 · Elche, Alicante",105,285,{align:"center"});

    const blob=doc.output("blob");
    const nombre=`domia_presupuesto_${t.id}_${Date.now()}.pdf`;
    const{data:up}=await supabase.storage.from('fotos-demandas').upload(nombre,blob,{contentType:'application/pdf',upsert:true});
    if(up){
      const{data:pub}=supabase.storage.from('fotos-demandas').getPublicUrl(nombre);
      setPdfUrl(pub.publicUrl);
      toast("✅ PDF generado y guardado");
    }
    doc.save(nombre);
    setGenerando(false);
  };
  const notas=getNotas(t);
  const fotoUrl=notas.startsWith('presup:')?notas.replace('presup:',''):null;
  return<div className="space-y-4">
    {fotoUrl&&<div className="bg-purple-50 border border-purple-200 rounded-xl p-3">
      <div className="text-xs font-bold text-purple-700 mb-2">📄 Presupuesto del colaborador</div>
      <a href={fotoUrl} target="_blank" className="text-purple-600 text-sm font-semibold hover:underline">Ver PDF del colaborador →</a>
    </div>}
    <div className="bg-gray-900 rounded-xl p-3 text-white">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] font-bold text-gray-400 uppercase">Tu margen %</div>
        <input type="number" value={margen} onChange={e=>setMargen(+e.target.value||30)} className="w-20 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-sm text-white text-right focus:outline-none"/>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center mt-2">
        <div><div className="text-lg font-black text-red-400">{totalColab}€</div><div className="text-[10px] text-gray-400">Colab.</div></div>
        <div><div className="text-lg font-black text-blue-400">{margen}%</div><div className="text-[10px] text-gray-400">Margen</div></div>
        <div><div className="text-lg font-black text-emerald-400">{totalCliente}€</div><div className="text-[10px] text-gray-400">Cliente</div></div>
      </div>
    </div>
    <div>
      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Partidas del presupuesto</div>
      <div className="space-y-2">
        {partidas.map((p,i)=><div key={i} className="flex gap-2 items-center">
          <input value={p.desc} onChange={e=>updPartida(i,"desc",e.target.value)} className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]" placeholder="Descripción de la partida"/>
          <input type="number" value={p.importe||""} onChange={e=>updPartida(i,"importe",e.target.value)} className="w-20 border border-gray-200 rounded-xl px-2 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]" placeholder="€"/>
          <button onClick={()=>delPartida(i)} className="text-red-400 hover:text-red-600 text-lg font-bold px-1">×</button>
        </div>)}
      </div>
      <button onClick={addPartida} className="mt-2 w-full border-2 border-dashed border-gray-200 text-gray-400 py-2 rounded-xl text-sm hover:border-[#1E3A5F] hover:text-[#1E3A5F] transition">+ Añadir partida</button>
    </div>
    <button onClick={generarPDF} className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-bold text-sm transition">📄 Generar PDF Domia ({totalCliente}€)</button>
    <button onClick={onClose} className="w-full border border-gray-200 text-gray-500 py-2.5 rounded-xl text-sm">Cancelar</button>
  </div>;
}
function TrabajoModal({tid,data,setData,onClose,toast}){
  const t=data.trabajos.find(x=>x.id===tid||x.id===+tid);
const[modo,setModo]=useState<"ver"|"editar"|"presupuesto">("ver");
  if(!t)return null;
  const cl=data.clientes.find(c=>c.id===getClienteId(t));
  const co=data.colaboradores.find(c=>c.id===getColabId(t));
  const historial=getHistorial(t);
  const notas=getNotas(t);
  const fotoUrl=notas.startsWith('foto:')?notas.replace('foto:',''):null;
  const iconH=tipo=>({entrada:"🟢",wa:"💬",presupuesto:"💶",cliente:"📤",ok:"✅",sistema:"·"}[tipo]||"·");
  return<Modal title={`${t.tipo} #${t.id}`} onClose={onClose} wide>
    {modo==="ver"?(
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5"><Badge text={t.estado}/><OrigenTag id={t.origen}/><span className={`text-xs font-bold ${PRIO_CFG[t.prioridad]?.text}`}>{PRIO_CFG[t.prioridad]?.icon} {t.prioridad}</span></div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div><div className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Cliente</div><div className="font-semibold">{cl?.nombre}</div><div className="text-xs text-gray-400">{cl?.telefono}</div></div>
        <div><div className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Colaborador</div><div className="font-semibold">{co?.nombre||"Sin asignar"}</div><div className="text-xs text-gray-400">{co?.telefono}</div></div>
        <div><div className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Fecha / Hora</div><div>{fmt(t.fecha)} · {t.hora}</div></div>
      </div>
      <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-700">{t.descripcion}</div>
      {fotoUrl&&<div className="bg-gray-50 border border-gray-100 rounded-xl p-3"><div className="text-[10px] font-bold text-gray-400 uppercase mb-2">📎 Archivos adjuntos</div><img src={fotoUrl} alt="Foto del problema" className="w-full rounded-xl object-cover max-h-64 cursor-pointer" onClick={()=>window.open(fotoUrl,"_blank")}/><div className="text-xs text-gray-400 mt-1 text-center">Toca para ver en tamaño completo</div></div>}
{!fotoUrl&&notas&&(notas.startsWith('presup:')?
  <a href={notas.replace('presup:','')} target="_blank" className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-xl p-3 text-sm text-purple-700 font-semibold hover:bg-purple-100 transition">📄 Ver presupuesto del colaborador →</a>
  :<div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3 text-xs text-gray-600">📝 {notas}</div>
)}      <div className="bg-gray-900 rounded-xl p-4 text-white">
        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-3">Financiero</div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div><div className="text-xl font-black text-red-400">{getPresupColab(t)?`${getPresupColab(t)}€`:"—"}</div><div className="text-[10px] text-gray-400">Colab.</div></div>
          <div><div className="text-xl font-black text-blue-400">{t.margen||0}%</div><div className="text-[10px] text-gray-400">Margen</div></div>
          <div><div className="text-xl font-black text-emerald-400">{getPrecioCliente(t)?`${getPrecioCliente(t)}€`:"—"}</div><div className="text-[10px] text-gray-400">Cliente</div></div>
        </div>
        {getPresupColab(t)&&getPrecioCliente(t)&&<div className="mt-3 bg-gray-800 rounded-lg px-3 py-2 flex justify-between text-xs"><span className="text-gray-400">Beneficio</span><span className="text-emerald-400 font-black">+{getPrecioCliente(t)-getPresupColab(t)}€</span></div>}
      </div>
      <div className="space-y-2">
        {co&&t.estado==="Presupuestando"&&<button onClick={()=>{window.open(buildWA(co,t,cl),"_blank");toast("📱 WhatsApp a colaborador...");}} className="w-full bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-xl font-bold text-sm transition">📱 Pedir visita a {co.nombre.split(" ")[0]}</button>}
        {t.estado==="Visita confirmada"&&cl?.telefono&&<button onClick={()=>{window.open(buildWAVisitaCliente(cl,t,co),"_blank");toast("📱 Propuesta enviada al cliente");}} className="w-full bg-cyan-500 hover:bg-cyan-600 text-white py-2.5 rounded-xl font-bold text-sm transition">📱 Proponer visita al cliente</button>}
        {t.estado==="Visita confirmada"&&co&&<button onClick={async()=>{const hist=[...getHistorial(t),{ts:now(),txt:"Cliente confirmó la visita",tipo:"ok"}];await dbSaveTrabajo({...t,estado:"En curso",historial:hist});setData(d=>({...d,trabajos:d.trabajos.map(x=>x.id===t.id?{...x,estado:"En curso"}:x)}));window.open(buildWAConfirmacionColab(co,t,cl),"_blank");toast("✅ Confirmado — avisando a colaborador");onClose();}} className="w-full bg-teal-500 hover:bg-teal-600 text-white py-2.5 rounded-xl font-bold text-sm transition">✅ Cliente confirmó — avisar a {co.nombre.split(" ")[0]}</button>}
{(t.estado==="Presupuesto recibido"||t.estado==="Visita confirmada"||t.estado==="En curso")&&<button onClick={()=>setModo("presupuesto")} className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-xl font-bold text-sm transition">📄 Generar presupuesto Domia</button>}
{!["Completado","Cancelado"].includes(t.estado)&&<label className="w-full cursor-pointer">
       <div className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-bold text-sm transition text-center">📎 Subir presupuesto colaborador</div>
          <input type="file" accept="image/*,application/pdf" className="hidden" onChange={async(e)=>{
            const archivo=e.target.files?.[0];
            if(!archivo)return;
            const ext=archivo.name.split('.').pop();
            const nombre=`presup_${t.id}_${Date.now()}.${ext}`;
            const{data:up}=await supabase.storage.from('fotos-demandas').upload(nombre,archivo,{upsert:true});
            if(up){
              const{data:pub}=supabase.storage.from('fotos-demandas').getPublicUrl(nombre);
              const hist=[...getHistorial(t),{ts:now(),txt:"Presupuesto subido manualmente",tipo:"presupuesto"}];
              const saved=await dbSaveTrabajo({...t,estado:"Presupuesto recibido",notas:'presup:'+pub.publicUrl,historial:hist});
              if(saved){setData(d=>({...d,trabajos:d.trabajos.map(x=>x.id===t.id?{...saved,clienteId:saved.cliente_id,colaboradorId:saved.colaborador_id}:x)}));toast("✅ Presupuesto subido");}
            }
          }}/>
        </label>}
      </div>
      <div>
        <div className="text-[10px] font-bold text-gray-400 uppercase mb-2">Historial</div>
        <div className="space-y-1.5 max-h-44 overflow-y-auto">{historial.map((h,i)=><div key={i} className="flex items-start gap-2 text-xs"><span className="text-base leading-none flex-shrink-0">{iconH(h.tipo)}</span><span className="text-gray-400 flex-shrink-0">{h.ts} ·</span><span className="text-gray-700">{h.txt}</span></div>)}</div>
      </div>
      <div className="flex gap-2 pt-2 border-t border-gray-100">
        <button onClick={()=>setModo("editar")} className="flex-1 bg-[#1E3A5F] hover:bg-[#152d4a] text-white py-2.5 rounded-xl text-sm font-bold transition">Editar</button>
        <button onClick={async()=>{if(!confirm("¿Eliminar?"))return;await dbDeleteTrabajo(t.id);setData(d=>({...d,trabajos:d.trabajos.filter(x=>x.id!==t.id)}));onClose();}} className="bg-red-50 hover:bg-red-100 text-red-500 px-4 py-2.5 rounded-xl text-sm transition">Eliminar</button>
      </div>
    </div>
    ):modo==="presupuesto"?(
    <EditorPresupuesto t={t} cl={cl} co={co} data={data} setData={setData} onClose={()=>setModo("ver")} toast={toast}/>
    ):(
    <FormTrabajo data={data} setData={setData} inicial={t} onClose={()=>{setModo("ver");onClose();}} toast={toast}/>
    )}
  </Modal>;
}
function DisponibilidadSelector({onConfirmar}:{onConfirmar:(slots:string[])=>void}){
  const[slots,setSlots]=useState<string[]>([]);
  const[dia,setDia]=useState("");
  const[hora,setHora]=useState("09:00");
  const addSlot=()=>{if(!dia)return;const s=`${dia} a las ${hora}`;if(!slots.includes(s))setSlots(p=>[...p,s]);};
  return<div className="space-y-3">
    <div className="flex gap-2">
      <input type="date" value={dia} onChange={e=>setDia(e.target.value)} className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"/>
      <input type="time" value={hora} onChange={e=>setHora(e.target.value)} className="w-28 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"/>
      <button onClick={addSlot} className="bg-[#1E3A5F] text-white px-3 rounded-xl text-sm font-bold">+</button>
    </div>
    {slots.length>0&&<div className="space-y-1">
      {slots.map((s,i)=><div key={i} className="flex items-center justify-between bg-teal-50 border border-teal-100 rounded-xl px-3 py-2 text-sm">
        <span className="text-teal-700 font-medium">📅 {s}</span>
        <button onClick={()=>setSlots(p=>p.filter((_,idx)=>idx!==i))} className="text-red-400 hover:text-red-600 font-bold">×</button>
      </div>)}
    </div>}
    {slots.length>0&&<button onClick={()=>onConfirmar(slots)} className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-bold text-sm transition">✅ Confirmar disponibilidad</button>}
  </div>;
}
function PortalCliente({id}:{id:string}){
  const[trabajo,setTrabajo]=useState<any>(null);
  const[estado,setEstado]=useState<"idle"|"ok"|"no"|"cargando">("idle");
  const[cargando,setCargando]=useState(true);
  const[comentario,setComentario]=useState("");
  useEffect(()=>{
    const cargar=async()=>{
      const{data:t}=await supabase.from('trabajos').select('*').eq('id',id).single();
      if(t)setTrabajo(t);
      setCargando(false);
    };
    cargar();
  },[id]);
  const confirmar=async(confirma:boolean)=>{
    setEstado("cargando");
    const historial=JSON.parse(trabajo.historial||"[]");
    historial.push({ts:now(),txt:confirma?`Cliente confirmó la visita${comentario?' — "'+comentario+'"':''}`:`Cliente rechazó la visita${comentario?' — "'+comentario+'"':''}`,tipo:confirma?"ok":"sistema"});
    await supabase.from('trabajos').update({
estado:confirma?"Cliente confirmó":"Visita propuesta",
      historial:JSON.stringify(historial),
      notas:comentario?`cliente: ${comentario}`:trabajo.notas,
    }).eq('id',id);
    setEstado(confirma?"ok":"no");
  };
  if(cargando)return<div className="min-h-screen flex items-center justify-center bg-[#F0F2F5]"><div className="text-center"><div className="text-4xl mb-3">⚙️</div><div className="font-bold text-gray-700">Cargando...</div></div></div>;
  if(!trabajo)return<div className="min-h-screen flex items-center justify-center bg-[#F0F2F5]"><div className="text-center"><div className="text-4xl mb-3">❌</div><div className="font-bold text-gray-700">Enlace no válido</div></div></div>;
  if(estado==="ok")return<div className="min-h-screen flex items-center justify-center bg-[#F0F2F5] p-4"><div className="bg-white rounded-2xl p-8 text-center max-w-sm w-full shadow-sm border border-gray-100"><div className="text-6xl mb-4">✅</div><div className="text-xl font-black text-gray-800 mb-2">¡Perfecto!</div><div className="text-gray-500 text-sm">Hemos confirmado tu visita. Nos vemos pronto 😊</div><div className="mt-4 text-xs text-gray-400">Domia Services · 622 123 456</div></div></div>;
  if(estado==="no")return<div className="min-h-screen flex items-center justify-center bg-[#F0F2F5] p-4"><div className="bg-white rounded-2xl p-8 text-center max-w-sm w-full shadow-sm border border-gray-100"><div className="text-6xl mb-4">📞</div><div className="text-xl font-black text-gray-800 mb-2">Entendido</div><div className="text-gray-500 text-sm">Te llamaremos para buscar otra fecha que te venga mejor.</div><div className="mt-4 text-xs text-gray-400">Domia Services · 622 123 456</div></div></div>;
  return<div className="min-h-screen bg-[#F0F2F5]" style={{fontFamily:"'Inter',system-ui,sans-serif"}}>
    <div className="bg-[#1E3A5F] px-5 py-6 text-white text-center">
      <div className="text-[10px] text-blue-300 font-bold uppercase tracking-widest mb-2">Domia Services</div>
      <div className="text-2xl font-black mb-1">Visita programada</div>
      <div className="text-blue-200 text-sm">{trabajo.tipo}</div>
    </div>
    <div className="px-4 py-5 max-w-lg mx-auto space-y-4">
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
        <div className="text-4xl mb-3">📅</div>
        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Fecha y hora de la visita</div>
        <div className="text-2xl font-black text-[#1E3A5F]">{fmt(trabajo.fecha)}</div>
        <div className="text-xl font-bold text-gray-600 mt-1">{trabajo.hora}</div>
      </div>
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">Descripción del servicio</div>
        <div className="text-sm text-gray-700 leading-relaxed">{trabajo.descripcion}</div>
      </div>
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">¿Quieres dejar algún comentario? (opcional)</div>
        <textarea className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] transition resize-none" rows={3} placeholder="Ej: mejor por la mañana, código del portal es 1234..." value={comentario} onChange={e=>setComentario(e.target.value)}/>
      </div>
      <div className="space-y-3">
        <button onClick={()=>confirmar(true)} disabled={estado==="cargando"} className="w-full bg-green-500 hover:bg-green-600 active:scale-95 text-white rounded-2xl py-5 flex flex-col items-center gap-2 font-bold text-lg transition disabled:opacity-50"><span className="text-3xl">✅</span>Sí, me viene bien</button>
        <button onClick={()=>confirmar(false)} disabled={estado==="cargando"} className="w-full bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-600 rounded-2xl py-4 flex flex-col items-center gap-2 font-bold text-base transition disabled:opacity-50"><span className="text-2xl">📞</span>No, prefiero otra fecha</button>
      </div>
      <div className="text-center text-xs text-gray-400 pb-4">Domia Services · 622 123 456</div>
    </div>
  </div>;
}
function SubirPresupuesto({id,trabajo,onSubido}:{id:string,trabajo:any,onSubido:(url:string)=>void}){
  const[subiendo,setSubiendo]=useState(false);
  const[importe,setImporte]=useState("");
  const[notas,setNotas]=useState("");
  const[archivo,setArchivo]=useState<File|null>(null);

  const subir=async()=>{
    if(!importe)return;
    setSubiendo(true);
    let fotoUrl="";
    if(archivo){
      const ext=archivo.name.split('.').pop();
      const nombre=`presup_${id}_${Date.now()}.${ext}`;
      const{data}=await supabase.storage.from('fotos-demandas').upload(nombre,archivo,{upsert:true});
      if(data){
        const{data:pub}=supabase.storage.from('fotos-demandas').getPublicUrl(nombre);
        fotoUrl=pub.publicUrl;
      }
    }
    const historial=JSON.parse(trabajo.historial||"[]");
    historial.push({ts:new Date().toLocaleString("es-ES",{hour:"2-digit",minute:"2-digit",day:"2-digit",month:"2-digit"}),txt:`Presupuesto recibido: ${importe}€${notas?' — '+notas:''}`,tipo:"presupuesto"});
    await supabase.from('trabajos').update({
      estado:"Presupuesto recibido",
      presupuesto_colaborador:+importe,
      notas:fotoUrl?'presup:'+fotoUrl:(notas||''),
      historial:JSON.stringify(historial),
    }).eq('id',id);
    onSubido(fotoUrl||"ok");
    setSubiendo(false);
  };

  return<div className="space-y-3">
    <div>
      <div className="text-[10px] text-gray-400 font-bold uppercase mb-1">Tu importe (€) *</div>
      <input type="number" value={importe} onChange={e=>setImporte(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]" placeholder="Ej: 150"/>
    </div>
    <div>
      <div className="text-[10px] text-gray-400 font-bold uppercase mb-1">Notas (opcional)</div>
      <textarea value={notas} onChange={e=>setNotas(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] resize-none" rows={2} placeholder="Detalles del trabajo, materiales..."/>
    </div>
    <div>
      <div className="text-[10px] text-gray-400 font-bold uppercase mb-1">Foto del presupuesto (opcional)</div>
      <input type="file" accept="image/*,application/pdf" onChange={e=>setArchivo(e.target.files?.[0]||null)} className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:bg-[#1E3A5F] file:text-white file:font-bold file:text-xs"/>
    </div>
    <button onClick={subir} disabled={subiendo||!importe} className="w-full bg-[#1E3A5F] hover:bg-[#152d4a] text-white py-3 rounded-xl font-bold text-sm transition disabled:opacity-50">
      {subiendo?"Enviando...":"✅ Enviar presupuesto a Domia"}
    </button>
  </div>;
}
function PortalColaborador({id}:{id:string}){
  const[trabajo,setTrabajo]=useState<any>(null);
  const[cliente,setCliente]=useState<any>(null);
  const[estado,setEstado]=useState<"idle"|"ok"|"no"|"cargando">("idle");
  const[cargando,setCargando]=useState(true);
  useEffect(()=>{
    const cargar=async()=>{
      const{data:t}=await supabase.from('trabajos').select('*').eq('id',id).single();
      if(t){setTrabajo(t);const{data:c}=await supabase.from('clientes').select('*').eq('id',t.cliente_id).single();setCliente(c);}
      setCargando(false);
    };
    cargar();
  },[id]);
  const confirmar=async(puede:boolean)=>{
    setEstado("cargando");
    const nuevoEstado=puede?"Visita confirmada":"Solicitud";
    const historial=JSON.parse(trabajo.historial||"[]");
    historial.push({ts:now(),txt:puede?"Colaborador confirmó la visita":"Colaborador no puede ir",tipo:puede?"ok":"sistema"});
    await supabase.from('trabajos').update({estado:nuevoEstado,colaborador_id:puede?trabajo.colaborador_id:null,historial:JSON.stringify(historial)}).eq('id',id);
    if(puede){const msg='✅ Confirmado — Trabajo #'+id+' · '+trabajo.tipo+'\n📍 '+(cliente?.direccion)+'\n📅 '+fmt(trabajo.fecha)+' · '+trabajo.hora+'\nEl colaborador ha confirmado la visita.';window.open('https://wa.me/34661121413?text='+encodeURIComponent(msg),'_blank');}
    setEstado(puede?"ok":"no");
  };
  const confirmarConDisponibilidad=async(slots:string[])=>{
    setEstado("cargando");
    const historial=JSON.parse(trabajo.historial||"[]");
    historial.push({ts:now(),txt:`Colaborador disponible. Horarios sugeridos: ${slots.join(", ")}`,tipo:"ok"});
    await supabase.from('trabajos').update({
estado:"Colaborador disponible",
      colaborador_id:trabajo.colaborador_id,
      historial:JSON.stringify(historial),
      notas:trabajo.notas?trabajo.notas+` | disponibilidad: ${slots.join(", ")}`:`disponibilidad: ${slots.join(", ")}`,
    }).eq('id',id);
    const msg=`✅ Trabajo #${id} · ${trabajo.tipo}\nEl colaborador puede encargarse.\n\nDisponibilidad sugerida:\n${slots.map(s=>`• ${s}`).join("\n")}`;
    window.open(`https://wa.me/34661121413?text=${encodeURIComponent(msg)}`,"_blank");
    setEstado("ok");
  };
  if(cargando)return<div className="min-h-screen flex items-center justify-center bg-[#F0F2F5]"><div className="text-center"><div className="text-4xl mb-3">⚙️</div><div className="font-bold text-gray-700">Cargando...</div></div></div>;
  if(!trabajo)return<div className="min-h-screen flex items-center justify-center bg-[#F0F2F5]"><div className="text-center"><div className="text-4xl mb-3">❌</div><div className="font-bold text-gray-700">Trabajo no encontrado</div></div></div>;
  if(estado==="ok")return<div className="min-h-screen flex items-center justify-center bg-[#F0F2F5] p-4"><div className="bg-white rounded-2xl p-8 text-center max-w-sm w-full shadow-sm border border-gray-100"><div className="text-6xl mb-4">✅</div><div className="text-xl font-black text-gray-800 mb-2">¡Confirmado!</div><div className="text-gray-500 text-sm">Hemos avisado a Domia. Nos ponemos en contacto contigo pronto.</div></div></div>;
  if(estado==="no")return<div className="min-h-screen flex items-center justify-center bg-[#F0F2F5] p-4"><div className="bg-white rounded-2xl p-8 text-center max-w-sm w-full shadow-sm border border-gray-100"><div className="text-6xl mb-4">👍</div><div className="text-xl font-black text-gray-800 mb-2">Entendido</div><div className="text-gray-500 text-sm">Gracias por avisarnos. Buscaremos otra disponibilidad.</div></div></div>;
  const estadosAvanzados=["Visita confirmada","Presupuesto recibido","Presupuesto enviado","Aceptado","En curso","Completado"];
  if(estadosAvanzados.includes(trabajo.estado)){
    return<div className="min-h-screen bg-[#F0F2F5]" style={{fontFamily:"'Inter',system-ui,sans-serif"}}>
      <div className="bg-[#1E3A5F] px-5 py-5 text-white">
        <div className="text-[10px] text-blue-300 font-bold uppercase tracking-widest mb-1">Domia Services · Trabajo #{id}</div>
        <div className="text-2xl font-black">{trabajo.tipo}</div>
      </div>
      <div className="px-4 py-5 max-w-lg mx-auto space-y-4">
        <div className="bg-teal-50 border border-teal-200 rounded-2xl p-5 text-center">
          <div className="text-4xl mb-2">✅</div>
          <div className="font-black text-teal-800 text-lg mb-1">Visita confirmada</div>
          <div className="text-teal-700 text-sm">📅 {fmt(trabajo.fecha)} · {trabajo.hora}</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">Descripción</div>
          <div className="text-sm text-gray-700">{trabajo.descripcion}</div>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-3">Subir presupuesto</div>
          {!trabajo.notas?.startsWith('presup:')?(
            <SubirPresupuesto id={id} trabajo={trabajo} onSubido={url=>{setTrabajo({...trabajo,notas:'presup:'+url});}}/>
          ):(
            <div className="text-center">
              <div className="text-4xl mb-2">✅</div>
              <div className="font-bold text-emerald-700 text-sm">Presupuesto enviado</div>
              <div className="text-xs text-gray-400 mt-1">Ya hemos recibido tu presupuesto</div>
            </div>
          )}
        </div>
        <div className="text-center text-xs text-gray-400 pb-4">Domia Services · Solo tú tienes acceso a este enlace</div>
      </div>
    </div>;
  }
  return<div className="min-h-screen bg-[#F0F2F5]" style={{fontFamily:"'Inter',system-ui,sans-serif"}}>
    <div className="bg-[#1E3A5F] px-5 py-5 text-white">
      <div className="text-[10px] text-blue-300 font-bold uppercase tracking-widest mb-1">Domia Services · Trabajo #{id}</div>
      <div className="text-2xl font-black">{trabajo.tipo}</div>
    </div>
    <div className="px-4 py-5 max-w-lg mx-auto space-y-4">
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-start gap-3"><span className="text-xl mt-0.5">📍</span><div><div className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Dirección</div><div className="font-semibold text-gray-800">{cliente?.direccion||"—"}</div></div></div>
        <div className="flex items-start gap-3"><span className="text-xl mt-0.5">📝</span><div><div className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Descripción</div><div className="text-gray-700 text-sm leading-relaxed">{trabajo.descripcion}</div></div></div>
      </div>
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-3">¿Puedes encargarte de este trabajo?</div>
        <div className="flex gap-3 mb-4">
          <button onClick={()=>setEstado("disponibilidad")} disabled={estado==="cargando"} className="flex-1 bg-green-500 hover:bg-green-600 active:scale-95 text-white rounded-2xl py-4 flex flex-col items-center gap-2 font-bold text-base transition disabled:opacity-50">
            <span className="text-3xl">✅</span>Sí, puedo
          </button>
          <button onClick={()=>setEstado("nopuedo")} disabled={estado==="cargando"} className="flex-1 bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-600 rounded-2xl py-4 flex flex-col items-center gap-2 font-bold text-base transition disabled:opacity-50">
            <span className="text-3xl">❌</span>No puedo
          </button>
        </div>
        {estado==="disponibilidad"&&<div className="border-t border-gray-100 pt-4">
          <div className="text-[10px] text-gray-400 font-bold uppercase mb-2">Indica tu disponibilidad</div>
          <DisponibilidadSelector onConfirmar={(slots)=>confirmarConDisponibilidad(slots)}/>
        </div>}
        {estado==="nopuedo"&&<div className="border-t border-gray-100 pt-4">
          <div className="text-[10px] text-gray-400 font-bold uppercase mb-2">¿Puedes en otra fecha? (opcional)</div>
          <DisponibilidadSelector onConfirmar={(slots)=>{
            const msg=`❌ Trabajo #${id} · ${trabajo.tipo}\nEl colaborador NO puede encargarse.\n${slots.length>0?`\nPodría en:\n${slots.map(s=>`• ${s}`).join("\n")}`:""}\n\nDirección: ${cliente?.direccion}`;
            window.open(`https://wa.me/34661121413?text=${encodeURIComponent(msg)}`,"_blank");
            setEstado("no");
          }}/>
          <button onClick={()=>confirmar(false)} className="w-full mt-2 border border-gray-200 text-gray-500 py-2.5 rounded-xl text-sm">No puedo en ninguna fecha</button>
        </div>}
      </div>
      <div className="text-center text-xs text-gray-400 pb-4">Solo tú tienes acceso a este enlace</div>
    </div>
  </div>;
}
export default function App(){
  const path=window.location.pathname;
  const trabajoMatch=path.match(/^\/trabajo\/(\d+)$/);
  if(trabajoMatch)return<PortalColaborador id={trabajoMatch[1]}/>;
  const clienteMatch=path.match(/^\/cliente\/(\d+)$/);
  if(clienteMatch)return<PortalCliente id={clienteMatch[1]}/>;
  const[data,setData]=useState({clientes:[],colaboradores:[],trabajos:[]});
  const[cargando,setCargando]=useState(true);
  const[sec,setSec]=useState("home");
  const[tid,setTid]=useState(null);
  const[showNuevo,setShowNuevo]=useState(false);
  const[toastMsg,setToastMsg]=useState(null);
  const T=msg=>setToastMsg(msg);
  useEffect(()=>{
    const cargar=async()=>{
      const[c,col,t]=await Promise.all([supabase.from('clientes').select('*').order('id'),supabase.from('colaboradores').select('*').order('id'),supabase.from('trabajos').select('*').order('id')]);
      setData({clientes:c.data||[],colaboradores:col.data||[],trabajos:(t.data||[]).map(x=>({...x,clienteId:x.cliente_id,colaboradorId:x.colaborador_id,presupuestoColaborador:x.presupuesto_colaborador,precioCliente:x.precio_cliente}))});
      setCargando(false);
    };
    cargar();
  },[]);
  if(cargando)return<div className="min-h-screen flex items-center justify-center bg-[#F0F2F5]"><div className="text-center"><div className="text-4xl mb-3">⚙️</div><div className="font-bold text-gray-700">Cargando Domia CRM...</div></div></div>;
  const sinAsignar=data.trabajos.filter(t=>t.estado==="Solicitud").length;
  const sinPrecio=data.trabajos.filter(t=>t.estado==="Presupuestando"&&!getPresupColab(t)).length;
  const TITULO={home:"Inicio",nuevas:"Nuevas demandas",demandas:"Pipeline",clientes:"Clientes",colaboradores:"Colaboradores"};
  return<div className="min-h-screen flex flex-col" style={{background:"#F0F2F5",fontFamily:"'Inter',system-ui,sans-serif"}}>
    <header className="bg-[#1E3A5F] text-white px-4 py-3 flex items-center gap-3 sticky top-0 z-40 shadow-lg">
      {sec!=="home"&&<button onClick={()=>setSec("home")} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 transition text-xl leading-none">‹</button>}
      {sec==="home"&&<div className="w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0">D</div>}
      <div className="flex-1 min-w-0">
        <div className="font-black text-sm leading-none">{TITULO[sec]||"Domia CRM"}</div>
        {sec==="home"&&<div className="text-[10px] text-blue-300 mt-0.5">{sinAsignar>0?`⚡ ${sinAsignar} sin asignar · `:""}{sinPrecio>0?`💶 ${sinPrecio} sin precio · `:""}activos: {data.trabajos.filter(t=>["Aceptado","En curso"].includes(t.estado)).length}</div>}
      </div>
      <button onClick={()=>setShowNuevo(true)} className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition whitespace-nowrap">+ Nuevo</button>
    </header>
    <main className="flex-1 px-4 py-5 max-w-2xl mx-auto w-full pb-8">
      {sec==="home"&&<Home data={data} setData={setData} go={setSec} setTid={setTid} toast={T}/>}
      {sec==="nuevas"&&<NuevasDemandas data={data} setData={setData} onBack={()=>setSec("home")} toast={T} onVer={id=>{setTid(id);}}/>}
      {sec==="demandas"&&<EstadoDemandas data={data} setData={setData} onBack={()=>setSec("home")} toast={T} onVer={id=>{setTid(id);}}/>}
      {sec==="clientes"&&<Clientes data={data} setData={setData} onBack={()=>setSec("home")} toast={T}/>}
      {sec==="colaboradores"&&<Colaboradores data={data} setData={setData} onBack={()=>setSec("home")} toast={T}/>}
    </main>
    {showNuevo&&<Modal title="Nueva solicitud" onClose={()=>setShowNuevo(false)} wide><FormTrabajo data={data} setData={setData} onClose={()=>setShowNuevo(false)} toast={T}/></Modal>}
    {tid&&<TrabajoModal tid={tid} data={data} setData={setData} onClose={()=>setTid(null)} toast={T}/>}
    {toastMsg&&<Toast msg={toastMsg} clear={()=>setToastMsg(null)}/>}
  </div>;
}
