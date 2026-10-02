import React, { useState, useEffect } from "react";
import { createClient } from '@supabase/supabase-js';
import { jsPDF } from 'jspdf';
import AltaColaborador from "./alta-colaborador";
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
const ICONO_TIPO = {
  "Fontanería":"🔧","Electricidad":"⚡","Albañilería":"🧱","Carpintería":"🪚",
  "Pintura":"🎨","Cerrajería":"🔑","Climatización":"❄️","Mantenimiento":"🛠️",
  "Jardinería":"🌿","Limpieza":"🧽","Otros":"📋"
};
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
const eur = n=>{const num=Number(n||0);const partes=num.toFixed(2).split(".");partes[0]=partes[0].replace(/\B(?=(\d{3})+(?!\d))/g,".");const dec=partes[1]==="00"?"":","+partes[1];return partes[0]+dec+"€";};
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
  const instr=trabajo.instrucciones_colaborador?`\n\n📋 *Instrucciones:* ${trabajo.instrucciones_colaborador}`:"";
  const msg=`Hola ${colab.nombre.split(" ")[0]} 👋\n\nTenemos un trabajo de *${trabajo.tipo}* en ${cliente.direccion}.\n\n📝 ${trabajo.descripcion}${instr}\n\n¿Puedes encargarte? Indícanos tu disponibilidad aquí:\n👉 ${enlace}\n\nGracias 🙏`;
  return `https://wa.me/${colab.whatsapp?.replace(/\s/g,'')}?text=${encodeURIComponent(msg)}`;
};
const buildWAVisitaCliente=(cliente,trabajo,colab)=>{
  const nombre=cliente.nombre.split(" ")[0];
  const enlace=`${BASE_URL}/cliente/${trabajo.id}`;
  const msg=`Hola ${nombre} 😊\n\nSoy Samuel de *Domia Services*.\n\nTe escribo porque hemos organizado una visita de nuestro técnico para revisar el trabajo de *${trabajo.tipo}*.\n\n📅 *${fmt(trabajo.fecha)} a las ${trabajo.hora}*\n\n👇 Confirma aquí si te viene bien (solo un clic):\n${enlace}\n\nSi necesitas cambiar la fecha, también puedes indicarlo ahí. Cualquier duda estamos en el 685 917 059 🙏\n\n— Samuel · Domia Services`;
  return `https://wa.me/${cliente.telefono?.replace(/\s/g,'')}?text=${encodeURIComponent(msg)}`;
};
const buildWAIncidenciaCliente=(cliente,trabajo,incidencia,fechaFmt,hora)=>{
  const nombre=cliente.nombre.split(" ")[0];
  const msg=`Hola ${nombre} 😊\n\nSoy de *Domia Services*. Sobre la incidencia que nos comentaste del trabajo de *${trabajo.tipo}*:\n\n✅ Ya lo tenemos organizado. Nuestro técnico pasará a resolverlo:\n\n📅 *${fechaFmt} a las ${hora}*\n\nCualquier cosa estamos en el 685 917 059. ¡Gracias por tu paciencia!\n\n— Domia Services`;
  return `https://wa.me/${cliente.telefono?.replace(/\s/g,'')}?text=${encodeURIComponent(msg)}`;
};
const buildWAIncidencia=(colab,trabajo,cliente,incidencia)=>{
  const enlace=`${BASE_URL}/trabajo/${trabajo.id}`;
  const msg=`Hola ${colab.nombre.split(" ")[0]} 👋\n\n⚠️ Hay una incidencia en un trabajo que hiciste:\n\n📍 ${cliente?.direccion||""}\n🔧 ${trabajo.tipo} · ${cliente?.nombre||""}\n\n📋 *${incidencia.tipo}:* ${incidencia.descripcion||"(sin detalles)"}\n\n¿Puedes pasarte a revisarlo? Los datos del trabajo aquí:\n👉 ${enlace}\n\nGracias 🙏`;
  return `https://wa.me/${colab.whatsapp?.replace(/\s/g,'')}?text=${encodeURIComponent(msg)}`;
};
const buildWACambioFecha=(colab,trabajo,cliente)=>{
  const enlace=`${BASE_URL}/trabajo/${trabajo.id}`;
  const msg=`Hola ${colab.nombre.split(" ")[0]} 👋\n\nEl cliente del trabajo de *${trabajo.tipo}* pide cambiar la fecha de la visita:\n\n📅 *Nueva fecha: ${fmt(trabajo.fecha)} a las ${trabajo.hora}*\n📍 ${cliente?.direccion||""}\n\n¿Te viene bien? Confírmalo aquí:\n👉 ${enlace}\n\nGracias 🙏`;
  return `https://wa.me/${colab.whatsapp?.replace(/\s/g,'')}?text=${encodeURIComponent(msg)}`;
};
const buildWAConfirmacionColab=(colab,trabajo,cliente)=>{
  const msg=`Hola ${colab.nombre.split(" ")[0]} 👋\n\n✅ El cliente ha confirmado la visita.\n\n📍 ${cliente.direccion}\n📅 *${fmt(trabajo.fecha)} a las ${trabajo.hora}*\n👤 ${cliente.nombre} · ${cliente.telefono}\n\nTras la visita, sube el presupuesto aquí:\n${BASE_URL}/trabajo/${trabajo.id}\n\nGracias 🙏`;
  return `https://wa.me/${colab.whatsapp?.replace(/\s/g,'')}?text=${encodeURIComponent(msg)}`;
};

const buildWAVerificarTrabajo=(cliente,trabajo)=>{
  const nombre=cliente.nombre.split(" ")[0];
  const enlace=`${BASE_URL}/verificar/${trabajo.id}`;
  const msg=`Hola ${nombre} 😊\n\nSoy de *Domia Services*. Nuestro técnico nos indica que ha terminado el trabajo de *${trabajo.tipo}*.\n\n¿Puedes confirmarnos que todo está correcto?\n👉 ${enlace}\n\nGracias 🙏\n\n— Domia Services`;
  return `https://wa.me/${cliente.telefono?.replace(/\s/g,'')}?text=${encodeURIComponent(msg)}`;
};
const buildWACobroFinal=(cliente,trabajo)=>{
  const nombre=cliente.nombre.split(" ")[0];
  const total=trabajo.precio_cliente||trabajo.precioCliente||0;
  const iva=trabajo.iva||21;
  const totalConIva=Math.round(total*(1+iva/100));
  const adelanto=trabajo.adelanto_tipo==='fijo'?trabajo.adelanto_valor:Math.round(totalConIva*(trabajo.adelanto_valor||30)/100);
  const resto=totalConIva-adelanto;
  const msg=`Hola ${nombre} 😊\n\n¡Trabajo terminado! Queda pendiente el cobro final:\n\n💶 *${resto}€*\n🏦 ES43 2100 5129 4102 0005 0515\n\nConcepto: ${trabajo.tipo} #${trabajo.id}\n\nGracias por confiar en Domia Services 🙏`;
  return `https://wa.me/${cliente.telefono?.replace(/\s/g,'')}?text=${encodeURIComponent(msg)}`;
};
const buildWARechazoVerificacion=(colab,trabajo,cliente,motivo)=>{
  const enlace=`${BASE_URL}/trabajo/${trabajo.id}`;
  const msg=`Hola ${colab.nombre.split(" ")[0]} 👋\n\nEl cliente revisó el trabajo de *${trabajo.tipo}* y indica que falta algo:\n\n📝 "${motivo}"\n\n¿Puedes pasarte a solucionarlo? Cuando esté, vuelve a marcarlo como terminado aquí:\n👉 ${enlace}\n\nGracias 🙏`;
  return `https://wa.me/${colab.whatsapp?.replace(/\s/g,'')}?text=${encodeURIComponent(msg)}`;
};
const dbSaveCliente = async(cliente) => { const {data} = await supabase.from('clientes').upsert(cliente).select(); return data?.[0]; };
const HISTORIAL_CAMPOS_IGNORADOS = ['historial','fecha_ultimo_estado'];
const valorParaHistorial = v => v==null?null:typeof v==='object'?JSON.stringify(v):String(v);
const registrarHistorial = async (entries) => {
  const {data:{user}} = await supabase.auth.getUser();
  const usuario_email = user?.email||null;
  await supabase.from('historial_trabajos').insert(entries.map(e=>({usuario_email,...e})));
};
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
   partidas: trabajo.partidas||null,
    iva: trabajo.iva||21,
    adelanto_tipo: trabajo.adelanto_tipo||'porcentaje',
    adelanto_valor: trabajo.adelanto_valor||30,
       atendido: trabajo.atendido||false,
    ultima_novedad: trabajo.ultima_novedad||null,
        instrucciones_colaborador: trabajo.instrucciones_colaborador||'',
    notas_internas: trabajo.notas_internas||'',
       archivado: trabajo.archivado||false,
    trabajo_terminado: trabajo.trabajo_terminado||false,
    cliente_verificado: trabajo.cliente_verificado||false,
    verificacion_rechazo: trabajo.verificacion_rechazo||null,
  };
  if (trabajo.id) {
    const {data:actual}=await supabase.from('trabajos').select('*').eq('id',trabajo.id).single();
    if(actual&&actual.estado!==trabajo.estado){row.fecha_ultimo_estado=new Date().toISOString();}
    const {data} = await supabase.from('trabajos').update(row).eq('id',trabajo.id).select();
    if(actual){
      const resumen=`${row.tipo||actual.tipo||''} · #${trabajo.id}`;
      const cambios=Object.keys(row).filter(k=>!HISTORIAL_CAMPOS_IGNORADOS.includes(k)&&valorParaHistorial(actual[k])!==valorParaHistorial(row[k]));
      if(cambios.length){
        await registrarHistorial(cambios.map(campo=>({trabajo_id:trabajo.id,accion:'editado',campo,valor_anterior:valorParaHistorial(actual[campo]),valor_nuevo:valorParaHistorial(row[campo]),resumen})));
      }
    }
    return data?.[0];
  }
  else {
    row.fecha_ultimo_estado=new Date().toISOString();
    const {data} = await supabase.from('trabajos').insert(row).select();
    const saved=data?.[0];
    if(saved){await registrarHistorial([{trabajo_id:saved.id,accion:'creado',resumen:`${row.tipo||''} · #${saved.id}`}]);}
    return saved;
  }
};
const dbDeleteTrabajo = async(id) => {
  const {data:actual}=await supabase.from('trabajos').select('*').eq('id',id).single();
  if(actual){await registrarHistorial([{trabajo_id:id,accion:'eliminado',resumen:`${actual.tipo||''} · #${id}`}]);}
  return await supabase.from('trabajos').delete().eq('id',id);
};
const dbSaveColab = async(colab) => {
const row = { nombre:colab.nombre, especialidades:colab.especialidades, telefono:colab.telefono, whatsapp:colab.whatsapp, email:colab.email, activo:colab.activo, zona:colab.zona, disponibilidad:colab.disponibilidad, valoracion:colab.valoracion||5, trabajos_completados:colab.trabajosCompletados||colab.trabajos_completados||0 };  if (colab.id) { const {data} = await supabase.from('colaboradores').update(row).eq('id',colab.id).select(); return data?.[0]; }
  else { const {data} = await supabase.from('colaboradores').insert(row).select(); return data?.[0]; }
};

const S="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] transition";
function Fld({label,children}){return<div className="mb-3"><label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</label>{children}</div>;}
function Badge({text}){const c=ESTADO_CFG[text]||{bg:"bg-gray-100",text:"text-gray-500",dot:"bg-gray-300"};return<span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${c.bg} ${c.text}`}><span className={`w-1.5 h-1.5 rounded-full ${c.dot}`}/>{text}</span>;}
function OrigenTag({id}){const o=orCfg(id);return<span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${o.color}`}>{o.icon} {o.label}</span>;}
function Modal({title,onClose,wide,xwide,children}){return<div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"><div className={`bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full ${xwide?"max-w-5xl":wide?"max-w-2xl":"max-w-lg"} max-h-[93vh] overflow-y-auto`}><div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10"><h2 className="font-bold text-gray-800 text-base">{title}</h2><button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 text-xl">&times;</button></div><div className="px-4 sm:px-5 py-5">{children}</div></div></div>;}
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
  const[showNuevoCliente,setShowNuevoCliente]=useState(false);
  const[nc,setNc]=useState({nombre:"",telefono:"",direccion:""});
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
  const sinAsignar=data.trabajos.filter(t=>t.estado==="Solicitud");
const proximas=[...data.trabajos].filter(t=>["Aceptado","En curso"].includes(t.estado)&&t.fecha>=hoy()).sort((a,b)=>a.fecha.localeCompare(b.fecha)).slice(0,4);
  const estadosVivos=["Solicitud","Presupuestando","Colaborador disponible","Visita propuesta","Cliente confirmó","Presupuesto recibido","Presupuesto enviado"];
  const parados=data.trabajos.filter(t=>{if(!estadosVivos.includes(t.estado))return false;const ref=t.fecha_ultimo_estado?new Date(t.fecha_ultimo_estado).getTime():null;if(!ref)return false;const horas=(Date.now()-ref)/(1000*60*60);return horas>=48;});
  const adelantosPendientes=data.trabajos.filter(t=>["Aceptado","En curso"].includes(t.estado)&&!t.adelanto_pagado&&getPrecioCliente(t)>0);
  const visitasHoy=data.trabajos.filter(t=>["Cliente confirmó","Aceptado","En curso"].includes(t.estado)&&t.fecha===hoy());
 return<div className="space-y-4">
    {(parados.length>0||adelantosPendientes.length>0||visitasHoy.length>0)&&<div className="bg-white border-2 border-gray-100 rounded-2xl p-4 shadow-sm">
      <div className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">🔔 Resumen del día</div>
      <div className="grid grid-cols-3 gap-2">
        <button onClick={()=>go("demandas")} className={`rounded-xl p-3 text-center transition ${parados.length>0?"bg-red-50 hover:bg-red-100":"bg-gray-50"}`}>
          <div className={`text-2xl font-black ${parados.length>0?"text-red-600":"text-gray-300"}`}>{parados.length}</div>
          <div className="text-[10px] text-gray-500 mt-0.5 leading-tight">🔴 Parados +48h</div>
        </button>
        <button onClick={()=>go("finanzas")} className={`rounded-xl p-3 text-center transition ${adelantosPendientes.length>0?"bg-amber-50 hover:bg-amber-100":"bg-gray-50"}`}>
          <div className={`text-2xl font-black ${adelantosPendientes.length>0?"text-amber-600":"text-gray-300"}`}>{adelantosPendientes.length}</div>
          <div className="text-[10px] text-gray-500 mt-0.5 leading-tight">💶 Adelantos por cobrar</div>
        </button>
        <button onClick={()=>go("demandas")} className={`rounded-xl p-3 text-center transition ${visitasHoy.length>0?"bg-blue-50 hover:bg-blue-100":"bg-gray-50"}`}>
          <div className={`text-2xl font-black ${visitasHoy.length>0?"text-blue-600":"text-gray-300"}`}>{visitasHoy.length}</div>
          <div className="text-[10px] text-gray-500 mt-0.5 leading-tight">📅 Visitas hoy</div>
        </button>
      </div>
    </div>}

    {nuevas>0&&<div className="bg-white border border-amber-200 rounded-2xl p-4 shadow-sm">
      <div className="font-semibold text-amber-700 text-sm mb-2 flex items-center gap-2">⚡ {nuevas} demanda{nuevas>1?"s":""} sin asignar</div>
      {sinAsignar.slice(0,2).map(t=>{
        const cl=data.clientes.find(c=>c.id===getClienteId(t));
        const sg=sugerirColab(t.tipo,data.colaboradores,data.trabajos);
        return<div key={t.id} className="flex items-center justify-between gap-2 mt-2 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
          <div><div className="text-sm font-medium text-gray-800">{t.tipo} — {cl?.nombre}</div>{sg&&<div className="text-[11px] text-gray-500 mt-0.5">Sugerido: {sg.nombre}</div>}</div>
          {sg&&<button onClick={async()=>{const updated={...t,colaboradorId:sg.id,estado:"Presupuestando",atendido:false,historial:[...getHistorial(t),{ts:now(),txt:`Asignado a ${sg.nombre}`,tipo:"sistema"}]};const saved=await dbSaveTrabajo(updated);if(saved){setData(d=>({...d,trabajos:d.trabajos.map(x=>x.id===t.id?{...saved,clienteId:saved.cliente_id,colaboradorId:saved.colaborador_id}:x)}));toast("Colaborador asignado");}}} className="bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg transition whitespace-nowrap">Asignar</button>}
        </div>;
      })}
      <button onClick={()=>go("nuevas")} className="mt-2 text-xs text-amber-600 font-medium">Ver todas →</button>
    </div>}

    {proximas.length>0&&<div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3"><div className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Próximas visitas</div><button onClick={()=>go("demandas")} className="text-xs text-gray-400 hover:text-gray-600">Ver todo →</button></div>
      <div className="space-y-2">{proximas.map(t=>{const cl=data.clientes.find(c=>c.id===getClienteId(t));const co=data.colaboradores.find(c=>c.id===getColabId(t));return<div key={t.id} onClick={()=>setTid(t.id)} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 rounded-xl px-2 py-2 transition"><div className="text-center min-w-[36px]"><div className="text-lg font-bold text-[#1E3A5F] leading-none">{new Date(t.fecha+"T00:00:00").getDate()}</div><div className="text-[9px] text-gray-400 uppercase">{new Date(t.fecha+"T00:00:00").toLocaleDateString("es-ES",{month:"short"})}</div></div><div className="flex-1 min-w-0"><div className="font-medium text-sm text-gray-800 truncate">{t.tipo} — {cl?.nombre}</div><div className="text-xs text-gray-400">{t.hora} · {co?.nombre||"Sin asignar"}</div></div><Badge text={t.estado}/></div>;})}
      </div>
    </div>}

    {parados.length===0&&adelantosPendientes.length===0&&visitasHoy.length===0&&nuevas===0&&proximas.length===0&&
      <div className="text-center py-16">
        <div className="text-5xl mb-3">✅</div>
        <div className="font-bold text-gray-700">Todo al día</div>
        <div className="text-sm text-gray-400 mt-1">No hay nada urgente ahora mismo</div>
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
            <button onClick={async(e)=>{e.stopPropagation();const updated={...t,colaboradorId:sg.id,estado:"Presupuestando",atendido:false,historial:[...getHistorial(t),{ts:now(),txt:`Asignado a ${sg.nombre}`,tipo:"sistema"}]};const saved=await dbSaveTrabajo(updated);if(saved){setData(d=>({...d,trabajos:d.trabajos.map(x=>x.id===t.id?{...saved,clienteId:saved.cliente_id,colaboradorId:saved.colaborador_id}:x)}));toast("Colaborador asignado");}}} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold py-2 rounded-xl transition">Asignar</button>
            <button onClick={async(e)=>{e.stopPropagation();const waUrl=buildWA(sg,t,cl);const updated={...t,colaboradorId:sg.id,estado:"Presupuestando",historial:[...getHistorial(t),{ts:now(),txt:`Asignado a ${sg.nombre}`,tipo:"sistema"},{ts:now(),txt:"Presupuesto solicitado WA",tipo:"wa"}]};const saved=await dbSaveTrabajo(updated);if(saved){setData(d=>({...d,trabajos:d.trabajos.map(x=>x.id===t.id?{...saved,clienteId:saved.cliente_id,colaboradorId:saved.colaborador_id}:x)}));toast("Abriendo WhatsApp...");setTimeout(()=>window.open(waUrl,"_blank"),400);}}} className="flex-1 bg-green-500 hover:bg-green-600 text-white text-sm font-bold py-2 rounded-xl transition">Asignar y WA 📱</button>
            <button onClick={e=>{e.stopPropagation();onVer(t.id);}} className="border border-gray-200 text-gray-500 px-3 rounded-xl text-sm">Ver</button>
          </div>
        </div>:<button onClick={e=>{e.stopPropagation();onVer(t.id);}} className="w-full border-2 border-dashed border-gray-200 text-gray-400 py-2.5 rounded-xl text-sm hover:border-[#1E3A5F] hover:text-[#1E3A5F] transition">Asignar manualmente →</button>}
      </div>;
    })}</div>
  </div>;
}

const ESTADO_DOT_PIPELINE = {
  "Solicitud":"bg-indigo-400","Colaborador disponible":"bg-indigo-400","Cliente confirmó":"bg-indigo-400","Presupuesto recibido":"bg-indigo-400","Aceptado":"bg-indigo-400",
  "Presupuestando":"bg-amber-400",
  "Visita propuesta":"bg-cyan-500","Presupuesto enviado":"bg-cyan-500",
  "En curso":"bg-orange-500",
  "Completado":"bg-emerald-500",
  "Cancelado":"bg-gray-300",
};
const PRIO_STRIPE_PIPELINE = {"Alta":"border-l-red-400","Media":"border-l-amber-400","Baja":"border-l-gray-300"};
const PRIO_TEXT_PIPELINE = {"Alta":"text-red-500","Media":"text-amber-600","Baja":"text-gray-400"};

const COLUMNAS_MATRIZ = [
  {key:"gestion",titulo:"En gestión",estados:["Solicitud","Cliente confirmó","Presupuesto recibido","Visita propuesta"],tint:"bg-indigo-50/70",badge:"bg-indigo-100 text-indigo-700",dot:"bg-indigo-400"},
  {key:"presupuestando",titulo:"Presupuestando",estados:["Presupuestando"],tint:"bg-amber-50/70",badge:"bg-amber-100 text-amber-700",dot:"bg-amber-400"},
  {key:"colabdisp",titulo:"Colaborador disp.",estados:["Colaborador disponible"],tint:"bg-cyan-50/70",badge:"bg-cyan-100 text-cyan-700",dot:"bg-cyan-500"},
  {key:"presupenv",titulo:"Presupuesto enviado",estados:["Presupuesto enviado"],tint:"bg-violet-50/70",badge:"bg-violet-100 text-violet-700",dot:"bg-violet-500"},
  {key:"aceptados",titulo:"Aceptados",estados:["Aceptado","En curso"],tint:"bg-orange-50/70",badge:"bg-orange-100 text-orange-700",dot:"bg-orange-500"},
  {key:"completados",titulo:"Completados",estados:["Completado"],tint:"bg-emerald-50/70",badge:"bg-emerald-100 text-emerald-700",dot:"bg-emerald-500"},
];
const diasDesde = f=>{
  if(!f)return"—";
  const d=Math.round((new Date(hoy()+"T00:00:00")-new Date(f+"T00:00:00"))/86400000);
  if(d<=0)return"hoy";
  if(d===1)return"hace 1 día";
  return`hace ${d} días`;
};

function IconoTipoPipeline({tipo}){
  const p={width:18,height:18,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:1.8,strokeLinecap:"round" as const,strokeLinejoin:"round" as const};
  switch(tipo){
    case "Fontanería": return <svg {...p}><path d="M12 3C12 3 6 10.5 6 14.5C6 17.8 8.7 20.5 12 20.5C15.3 20.5 18 17.8 18 14.5C18 10.5 12 3 12 3Z"/></svg>;
    case "Electricidad": return <svg {...p}><path d="M13 2 5 13h6l-1 9 9-11h-6l1-9Z"/></svg>;
    case "Albañilería": return <svg {...p}><rect x="4" y="4" width="16" height="16" rx="1.5"/><line x1="4" y1="9.5" x2="20" y2="9.5"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="12" y1="4" x2="12" y2="9.5"/><line x1="8" y1="9.5" x2="8" y2="15"/><line x1="16" y1="9.5" x2="16" y2="15"/><line x1="12" y1="15" x2="12" y2="20"/></svg>;
    case "Carpintería": return <svg {...p}><path d="M4 20 20 20 4 4Z"/><line x1="7" y1="20" x2="7" y2="17"/><line x1="10" y1="20" x2="10" y2="17"/><line x1="13" y1="20" x2="13" y2="17"/></svg>;
    case "Pintura": return <svg {...p}><rect x="7" y="4" width="10" height="5" rx="1"/><line x1="12" y1="9" x2="12" y2="14"/><path d="M9 14h6v4a3 3 0 01-6 0v-4z"/></svg>;
    case "Cerrajería": return <svg {...p}><circle cx="8" cy="8" r="4"/><line x1="11" y1="11" x2="20" y2="20"/><line x1="16.5" y1="16.5" x2="19" y2="14"/></svg>;
    case "Climatización": return <svg {...p}><line x1="12" y1="4" x2="12" y2="20"/><line x1="12" y1="4" x2="12" y2="20" transform="rotate(60 12 12)"/><line x1="12" y1="4" x2="12" y2="20" transform="rotate(120 12 12)"/></svg>;
    case "Mantenimiento": return <svg {...p}><path d="M14.7 6.3a4 4 0 00-5.4 5.4L4 17l3 3 5.3-5.3a4 4 0 005.4-5.4l-2.1 2.1-2-2 2.1-2.1z"/></svg>;
    case "Jardinería": return <svg {...p}><path d="M6 20C6 12 12 5 20 4c1 8-6 14-14 16z"/><path d="M6 20c2-4 5-7 9-9"/></svg>;
    case "Limpieza": return <svg {...p}><path d="M12 3v8"/><path d="M8 21l4-10 4 10"/><path d="M7 21h10"/></svg>;
    default: return <svg {...p}><path d="M6 4h8l5 5v11H6z"/><path d="M14 4v5h5"/></svg>;
  }
}

function TarjetaTrabajo({t,data,setData,toast,onVer,alertColor}){
  const[abierta,setAbierta]=useState(false);
  const cl=data.clientes.find(c=>c.id===getClienteId(t));
  const co=data.colaboradores.find(c=>c.id===getColabId(t));
  const notas=getNotas(t);
  const disponibilidad=notas.includes('disponibilidad:')?notas.split('disponibilidad:')[1]?.split('|')[0]?.trim():null;
  const partes=notas.split('|').map(n=>n.trim());
  const fotoCliente=partes.find(p=>p.startsWith('foto:'))?.replace('foto:','');
  const presupUrl=partes.find(p=>p.startsWith('presup:'))?.replace('presup:','');
  const pdfDomiaUrl=partes.find(p=>p.startsWith('pdfdomia:'))?.replace('pdfdomia:','');
  const comentCliente=partes.find(p=>p.startsWith('cliente:'))?.replace('cliente:','');

  const avanzar=async(nuevoEstado,txtHistorial)=>{
    const hist=[...getHistorial(t),{ts:now(),txt:txtHistorial,tipo:"sistema"}];
    const saved=await dbSaveTrabajo({...t,estado:nuevoEstado,historial:hist});
    if(saved){setData(d=>({...d,trabajos:d.trabajos.map(x=>x.id===t.id?{...saved,clienteId:saved.cliente_id,colaboradorId:saved.colaborador_id}:x)}));toast(`→ ${nuevoEstado}`);}
  };

  return <div className={`bg-white border rounded-2xl overflow-hidden shadow-sm border-l-4 ${PRIO_STRIPE_PIPELINE[t.prioridad]||"border-l-gray-200"} ${alertColor||"border-gray-100"}`}>
    <div className="px-4 py-3.5">
      <div className="flex items-center justify-between mb-2.5">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-gray-100 text-gray-500"><span className={`w-1.5 h-1.5 rounded-full ${ESTADO_DOT_PIPELINE[t.estado]||"bg-gray-300"}`}/>{t.estado}</span>
        <div className="flex items-center gap-2.5">
          <span className={`text-[10px] font-bold ${PRIO_TEXT_PIPELINE[t.prioridad]||"text-gray-400"}`}>{t.prioridad}</span>
          <button onClick={()=>setAbierta(!abierta)} className={`text-gray-300 text-lg transition-transform ${abierta?"rotate-180":""}`}>▾</button>
        </div>
      </div>
      <div className="flex items-start gap-3 flex-wrap">
        <div className="flex items-start gap-3 flex-1 min-w-[160px] cursor-pointer" onClick={()=>onVer(t.id)}>
          <div className="w-9 h-9 rounded-lg bg-[#EAF0F7] text-[#1E3A5F] flex items-center justify-center flex-shrink-0">
            <IconoTipoPipeline tipo={t.tipo}/>
          </div>
          <div className="min-w-0">
            <div className="text-[10px] text-gray-400 font-semibold mb-0.5 truncate">{t.tipo} · #{t.id}</div>
            <div className="font-bold text-gray-800 text-[14.5px] leading-tight truncate">{cl?.nombre}</div>
            <div className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="16" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="3" x2="8" y2="7"/><line x1="16" y1="3" x2="16" y2="7"/></svg>
              {fmt(t.fecha)}
            </div>
            {t.ultima_novedad&&!t.atendido&&
              <div className="inline-flex items-center gap-1.5 bg-red-50 text-red-600 text-[11px] font-semibold px-2 py-1 rounded-lg mt-1.5">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 4a4 4 0 00-4 4v3.4c0 .6-.2 1.2-.6 1.7L6 15h12l-1.4-1.9c-.4-.5-.6-1.1-.6-1.7V8a4 4 0 00-4-4z"/><path d="M10 18a2 2 0 004 0"/></svg>
                {t.ultima_novedad}
              </div>}
          </div>
        </div>
        <div className="flex-shrink-0 max-w-[110px] pl-3 border-l border-gray-100">
          <div className="text-[10px] text-gray-400 font-semibold mb-0.5">Colaborador</div>
          <div className={`text-[12px] font-semibold flex items-center gap-1 ${co?"text-gray-700":"text-gray-400 italic font-medium"}`}>
            {co&&<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 opacity-70"><circle cx="12" cy="8" r="3.2"/><path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7"/></svg>}
            <span className="truncate">{co?co.nombre:"Sin asignar"}</span>
          </div>
        </div>
        <div className="flex-shrink-0 flex items-center gap-2 pl-3 border-l border-gray-100">
          <button onClick={async(e)=>{e.stopPropagation();await supabase.from('trabajos').update({atendido:true}).eq('id',t.id);setData(d=>({...d,trabajos:d.trabajos.map(x=>x.id===t.id?{...x,atendido:true}:x)}));toast("✓ Marcado como atendido");}} className="w-7 h-7 flex items-center justify-center bg-gray-100 text-gray-500 rounded-lg hover:bg-emerald-100 hover:text-emerald-600 transition">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </button>
          <button onClick={()=>onVer(t.id)} className="bg-[#1E3A5F] text-white text-[11.5px] font-bold px-3 py-1.5 rounded-lg hover:bg-[#152d4a] transition whitespace-nowrap">Ver ficha</button>
        </div>
      </div>
    </div>
    {abierta&&<div className="border-t border-gray-100">
      <div className="px-4 py-3 grid grid-cols-2 gap-3 border-b border-gray-50">
        <div><div className="text-[10px] text-gray-400 uppercase font-bold mb-0.5">Cliente</div><div className="text-sm font-medium text-gray-800">{cl?.nombre}</div><div className="text-[11px] text-gray-500">{cl?.telefono}</div></div>
        <div><div className="text-[10px] text-gray-400 uppercase font-bold mb-0.5">Colaborador</div><div className="text-sm font-medium text-gray-800">{co?.nombre||"Sin asignar"}</div><div className="text-[11px] text-gray-500">{co?.telefono||co?.whatsapp}</div></div>
        <div className="col-span-2"><div className="text-[10px] text-gray-400 uppercase font-bold mb-0.5">Dirección</div><div className="text-sm text-gray-700">{cl?.direccion||"—"}</div></div>
        <div className="col-span-2"><div className="text-[10px] text-gray-400 uppercase font-bold mb-0.5">Descripción</div><div className="text-sm text-gray-700 leading-relaxed">{t.descripcion}</div></div>
      </div>

      {disponibilidad&&<div className="px-4 py-3 bg-teal-50 border-b border-gray-50">
        <div className="text-[10px] text-teal-700 uppercase font-bold mb-1">📅 Disponibilidad del colaborador</div>
        <div className="text-sm text-teal-800">{disponibilidad}</div>
      </div>}

      {(fotoCliente||presupUrl||pdfDomiaUrl||comentCliente)&&<div className="px-4 py-3 border-b border-gray-50 space-y-2">
        <div className="text-[10px] text-gray-400 uppercase font-bold">📎 Archivos y notas</div>
        {fotoCliente&&<a href={fotoCliente} target="_blank" className="block text-sm text-blue-700 font-semibold hover:underline">🖼️ Foto del cliente →</a>}
        {presupUrl&&<a href={presupUrl} target="_blank" className="block text-sm text-purple-700 font-semibold hover:underline">📄 Presupuesto del colaborador →</a>}
        {pdfDomiaUrl&&<div className="flex items-center gap-2">
          <a href={pdfDomiaUrl} target="_blank" className="flex-1 text-sm text-emerald-700 font-semibold hover:underline">📄 Presupuesto Domia →</a>
          <button onClick={()=>{(window as any).__abrirPresupuesto=true;onVer(t.id);}} className="text-xs bg-emerald-100 text-emerald-700 font-bold px-2.5 py-1 rounded-lg hover:bg-emerald-200 transition">✏️ Editar</button>
        </div>}
        {comentCliente&&<div className="text-sm text-gray-600 bg-yellow-50 border border-yellow-100 rounded-lg px-3 py-2">💬 Cliente: {comentCliente}</div>}
      </div>}

      <div className="px-4 py-4 bg-gray-50 border-b border-gray-100">
        <div className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-3">Económico</div>
        <div className="flex items-center justify-between">
          <div className="text-center flex-1">
            <div className="text-xl font-black text-emerald-600">{getPrecioCliente(t)?`${getPrecioCliente(t)}€`:"—"}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">Cliente</div>
          </div>
          <div className="text-gray-300 text-lg font-bold px-1">−</div>
          <div className="text-center flex-1">
            <div className="text-xl font-black text-red-500">{getPresupColab(t)?`${getPresupColab(t)}€`:"—"}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">Colaborador</div>
          </div>
          <div className="text-gray-300 text-lg font-bold px-1">=</div>
          <div className="text-center flex-1">
            <div className="text-xl font-black text-blue-600">{getPrecioCliente(t)&&getPresupColab(t)?`${getPrecioCliente(t)-getPresupColab(t)}€`:"—"}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">Margen</div>
            {getPrecioCliente(t)&&getPresupColab(t)>0&&<div className="text-[10px] font-bold text-blue-500 bg-blue-50 rounded-full px-2 py-0.5 mt-1 inline-block">{Math.round((getPrecioCliente(t)-getPresupColab(t))/getPresupColab(t)*100)}%</div>}
          </div>
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
        <button onClick={()=>{(window as any).__abrirPresupuesto=true;onVer(t.id);}} className="w-full bg-purple-600 text-white py-2.5 rounded-xl text-sm font-semibold transition hover:bg-purple-700">📄 Generar presupuesto Domia</button>
        {t.estado==="Presupuesto enviado"&&<>
          {pdfDomiaUrl&&cl?.telefono&&<button onClick={()=>{const msg=`Hola ${cl.nombre.split(" ")[0]} 😊\n\nTe paso el presupuesto de *Domia Services*.\n\n💶 Total: *${getPrecioCliente(t)}€* (sin IVA)\n\n📄 Verlo y aceptarlo aquí:\nhttps://domia-crm-two.vercel.app/aceptar/${t.id}\n\nCualquier duda me dices. ¡Gracias!\n\n— Samuel · Domia Services · 685 917 059`;window.open(`https://wa.me/${cl.telefono.replace(/\s/g,"")}?text=${encodeURIComponent(msg)}`,"_blank");toast("📱 Reenviado");}} className="w-full bg-green-500 text-white py-2.5 rounded-xl text-sm font-semibold transition hover:bg-green-600">📱 Reenviar presupuesto al cliente</button>}
          <button onClick={()=>avanzar("Aceptado","Cliente aceptó el presupuesto")} className="w-full bg-violet-500 text-white py-2.5 rounded-xl text-sm font-semibold transition hover:bg-violet-600">🤝 Cliente aceptó</button>
        </>}
        {t.estado==="Aceptado"&&<button onClick={()=>avanzar("En curso","Trabajo iniciado")} className="w-full bg-orange-500 text-white py-2.5 rounded-xl text-sm font-semibold transition hover:bg-orange-600">🔧 Marcar en curso</button>}
        {t.estado==="En curso"&&!t.trabajo_terminado&&<button onClick={async()=>{const hist=[...getHistorial(t),{ts:now(),txt:"🔧 Trabajo marcado como terminado — pendiente verificación del cliente",tipo:"sistema"}];const saved=await dbSaveTrabajo({...t,trabajo_terminado:true,verificacion_rechazo:null,historial:hist});if(saved){setData(d=>({...d,trabajos:d.trabajos.map(x=>x.id===t.id?{...saved,clienteId:saved.cliente_id,colaboradorId:saved.colaborador_id}:x)}));if(cl?.telefono)window.open(buildWAVerificarTrabajo(cl,t),"_blank");toast("✅ Marcado — pidiendo verificación al cliente");}}} className="w-full bg-orange-500 text-white py-2.5 rounded-xl text-sm font-semibold transition hover:bg-orange-600">✅ Marcar trabajo terminado</button>}
        {t.estado==="En curso"&&t.trabajo_terminado&&!t.cliente_verificado&&!t.verificacion_rechazo&&cl?.telefono&&<button onClick={()=>window.open(buildWAVerificarTrabajo(cl,t),"_blank")} className="w-full bg-cyan-500 text-white py-2.5 rounded-xl text-sm font-semibold transition hover:bg-cyan-600">📱 Pedir verificación al cliente</button>}
        {t.estado==="En curso"&&t.verificacion_rechazo&&<div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700"><strong>El cliente indica que falta algo:</strong><br/>{t.verificacion_rechazo}</div>}
        {t.estado==="En curso"&&t.verificacion_rechazo&&co&&<button onClick={()=>window.open(buildWARechazoVerificacion(co,t,cl,t.verificacion_rechazo),"_blank")} className="w-full bg-orange-500 text-white py-2.5 rounded-xl text-sm font-semibold transition hover:bg-orange-600">🔁 Reenviar al colaborador con motivo</button>}
        {t.estado==="En curso"&&t.cliente_verificado&&cl?.telefono&&<button onClick={()=>window.open(buildWACobroFinal(cl,t),"_blank")} className="w-full bg-emerald-500 text-white py-2.5 rounded-xl text-sm font-semibold transition hover:bg-emerald-600">💰 Reclamar cobro</button>}
        <button onClick={()=>onVer(t.id)} className="w-full bg-white border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-semibold transition hover:border-gray-400">✏️ Ver ficha completa / Editar</button>
      </div>
    </div>}
  </div>;
}
function EstadoDemandas({data,setData,onBack,toast,onVer}){
  const[busca,setBusca]=useState("");
  const[fColab,setFColab]=useState("Todos");
  const[fTipo,setFTipo]=useState("Todos");
  const[fZona,setFZona]=useState("Todas");
  const[verArchivados,setVerArchivados]=useState(false);
  const[vista,setVista]=useState("colaborador");
  const[filtrosAbiertos,setFiltrosAbiertos]=useState(false);
  const activosBase=data.trabajos.filter(t=>!t.archivado);
  let items=[...data.trabajos].filter(t=>verArchivados?t.archivado:!t.archivado);
  if(fColab!=="Todos")items=items.filter(t=>String(getColabId(t))===fColab);
  if(fTipo!=="Todos")items=items.filter(t=>t.tipo===fTipo);
  if(fZona!=="Todas")items=items.filter(t=>{const co=data.colaboradores.find(c=>c.id===getColabId(t));return co?.zona===fZona;});
  if(busca.trim()){const q=busca.toLowerCase();items=items.filter(t=>{const cl=data.clientes.find(c=>c.id===getClienteId(t));return t.descripcion?.toLowerCase().includes(q)||cl?.nombre.toLowerCase().includes(q)||t.tipo?.toLowerCase().includes(q);});}
  const hayFiltros=fColab!=="Todos"||fTipo!=="Todos"||fZona!=="Todas"||busca.trim()!=="";
  const limpiarFiltros=()=>{setFColab("Todos");setFTipo("Todos");setFZona("Todas");setBusca("");};

  const atencion=items.filter(t=>["Solicitud","Colaborador disponible","Cliente confirmó","Presupuesto recibido","Aceptado","En curso"].includes(t.estado)&&!t.atendido);

  const porColaborador=(()=>{
    const map=new Map();
    items.forEach(t=>{
      const co=data.colaboradores.find(c=>c.id===getColabId(t));
      const key=co?String(co.id):"__sin__";
      if(!map.has(key))map.set(key,{id:co?co.id:null,nombre:co?co.nombre:"Sin asignar",items:[]});
      map.get(key).items.push(t);
    });
    const grupos=[...map.values()];
    grupos.sort((a,b)=>a.nombre==="Sin asignar"?1:b.nombre==="Sin asignar"?-1:b.items.length-a.items.length);
    return grupos;
  })();

  const zonas=["Todas",...new Set(data.colaboradores.map(c=>c.zona).filter(Boolean))];
  const statValor=activosBase.reduce((s,t)=>s+(getPrecioCliente(t)||0),0);
  const stats=[
    {label:"Oportunidades",value:activosBase.length,tint:"bg-blue-50 text-blue-600",icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="8" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="20" y2="12"/><line x1="8" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1.3" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1.3" fill="currentColor" stroke="none"/></svg>},
    {label:"Valor total",value:eur(statValor),tint:"bg-orange-50 text-orange-600",icon:<span className="font-black text-lg leading-none">€</span>},
    {label:"En presupuestando",value:activosBase.filter(t=>t.estado==="Presupuestando").length,tint:"bg-amber-50 text-amber-600",icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="3" width="14" height="18" rx="2"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="9" y1="12" x2="15" y2="12"/></svg>},
    {label:"Aceptados",value:activosBase.filter(t=>t.estado==="Aceptado").length,tint:"bg-emerald-50 text-emerald-600",icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>},
    {label:"Cerrados",value:activosBase.filter(t=>t.estado==="Completado").length,tint:"bg-violet-50 text-violet-600",icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 4h8v4a4 4 0 01-8 0V4z"/><path d="M8 5H5a3 3 0 003 3M16 5h3a3 3 0 01-3 3"/><line x1="12" y1="12" x2="12" y2="17"/><line x1="9" y1="20" x2="15" y2="20"/></svg>},
  ];
  const selCls="border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] transition";

  return<div>
    <Back title="Pipeline" onBack={onBack}/>

    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
      {stats.map(s=><div key={s.label} className="bg-white border border-gray-100 rounded-2xl px-3.5 py-3 shadow-sm flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${s.tint}`}>{s.icon}</div>
        <div className="min-w-0"><div className="font-black text-gray-800 text-lg leading-none truncate">{s.value}</div><div className="text-[10.5px] text-gray-400 font-semibold mt-1 truncate">{s.label}</div></div>
      </div>)}
    </div>

    <div className="flex gap-2 mb-3">
      <input className={S+" flex-1"} placeholder="🔍 Buscar cliente, tipo..." value={busca} onChange={e=>setBusca(e.target.value)}/>
      <button onClick={()=>setFiltrosAbiertos(v=>!v)} className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-bold px-3 py-2.5 rounded-xl border transition ${filtrosAbiertos?"bg-[#1E3A5F] text-white border-[#1E3A5F]":"bg-white text-gray-600 border-gray-200"}`}>
        Filtros
        {(hayFiltros||verArchivados)&&<span className={`w-1.5 h-1.5 rounded-full ${filtrosAbiertos?"bg-white":"bg-[#1E3A5F]"}`}/>}
      </button>
    </div>

    <div className="flex flex-wrap items-center gap-2 mb-3">
      <div className="inline-flex bg-gray-100 rounded-xl p-1 w-full sm:w-auto">
        <button onClick={()=>setVista("colaborador")} className={`flex-1 sm:flex-none text-xs font-bold px-3 py-1.5 rounded-lg transition ${vista==="colaborador"?"bg-[#1E3A5F] text-white shadow-sm":"text-gray-500"}`}>Por colaborador</button>
        <button onClick={()=>setVista("tablero")} className={`flex-1 sm:flex-none text-xs font-bold px-3 py-1.5 rounded-lg transition ${vista==="tablero"?"bg-[#1E3A5F] text-white shadow-sm":"text-gray-500"}`}>Tablero</button>
      </div>
    </div>

    {filtrosAbiertos&&<div className="bg-gray-50 border border-gray-100 rounded-2xl p-3 mb-4 flex flex-wrap items-center gap-2">
      <select className={selCls} value={fColab} onChange={e=>setFColab(e.target.value)}>
        <option value="Todos">Todos los colaboradores</option>
        {data.colaboradores.map(c=><option key={c.id} value={String(c.id)}>{c.nombre}</option>)}
      </select>
      <select className={selCls} value={fTipo} onChange={e=>setFTipo(e.target.value)}>
        <option value="Todos">Todos los tipos</option>
        {TIPOS.map(t=><option key={t} value={t}>{t}</option>)}
      </select>
      {zonas.length>1&&<select className={selCls} value={fZona} onChange={e=>setFZona(e.target.value)}>
        {zonas.map(z=><option key={z} value={z}>{z==="Todas"?"Todas las zonas":z}</option>)}
      </select>}
      <button onClick={()=>setVerArchivados(v=>!v)} className={`text-xs font-bold px-3 py-1.5 rounded-full border transition ${verArchivados?"bg-gray-700 text-white border-gray-700":"bg-white text-gray-500 border-gray-200"}`}>📦 Archivados ({data.trabajos.filter(t=>t.archivado).length})</button>
      {hayFiltros&&<button onClick={limpiarFiltros} className="text-xs font-bold text-gray-400 hover:text-gray-600 transition px-2">Limpiar filtros</button>}
    </div>}
    {atencion.length>0&&<div className="bg-red-50 border-2 border-red-200 rounded-2xl p-3 mb-4">
      <div className="font-bold text-red-700 text-sm mb-2 flex items-center gap-2">🔔 Requiere tu atención ({atencion.length})</div>
      <div className="space-y-2">{atencion.map(t=><TarjetaTrabajo key={t.id} t={t} data={data} setData={setData} toast={toast} onVer={onVer} alertColor="border-red-200"/>)}</div>
    </div>}

    {vista==="tablero"&&items.length>0&&<div className="sm:hidden flex items-center gap-1.5 text-[11px] text-gray-400 mb-3">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 5v14M8 5l-3 3M8 5l3 3M16 19V5M16 19l-3-3M16 19l3-3"/></svg>
      Desliza para ver cada colaborador
    </div>}

    {vista==="tablero"?
      <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-3 -mx-4 px-4" style={{WebkitOverflowScrolling:"touch"}}>
        {porColaborador.map(g=>
          <div key={g.nombre} className="snap-start flex-shrink-0 w-[82%] max-w-[280px] bg-gray-100 rounded-2xl p-3 flex flex-col">
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0 ${g.nombre==="Sin asignar"?"bg-red-400":"bg-[#1E3A5F]"}`}>
                {g.nombre==="Sin asignar"?"—":g.nombre.split(" ").map(n=>n[0]).slice(0,2).join("").toUpperCase()}
              </div>
              <div className="font-bold text-[13.5px] text-gray-800 flex-1 min-w-0 truncate">{g.nombre}</div>
              <div className="text-[11px] font-bold text-gray-400 bg-white border border-gray-200 px-2 py-0.5 rounded-full flex-shrink-0">{g.items.length}</div>
            </div>
            <div className="space-y-2">
              {g.items.map(t=>{
                const cl2=data.clientes.find(c=>c.id===getClienteId(t));
                return <div key={t.id} onClick={()=>onVer(t.id)} className={`bg-white rounded-xl shadow-sm border-l-[3px] ${PRIO_STRIPE_PIPELINE[t.prioridad]||"border-l-gray-200"} px-3 py-2.5 cursor-pointer hover:shadow-md transition`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${ESTADO_DOT_PIPELINE[t.estado]||"bg-gray-300"}`}/>
                    <span className="text-[9.5px] font-bold text-gray-400 uppercase tracking-wide truncate">{t.estado}</span>
                  </div>
                  <div className="text-[10px] text-gray-400 mb-0.5 truncate">{t.tipo} · #{t.id}</div>
                  <div className="font-bold text-[13px] text-gray-800 leading-tight truncate">{cl2?.nombre}</div>
                  <div className="text-[10.5px] text-gray-400 mt-1">{fmt(t.fecha)}</div>
                </div>;
              })}
            </div>
          </div>
        )}
      </div>
    :
      <div>
        <div>
          {porColaborador.map(g=>{
            const colsConItems=COLUMNAS_MATRIZ.filter(col=>g.items.some(t=>col.estados.includes(t.estado)));
            return <div key={g.nombre} className="flex flex-nowrap gap-3 overflow-x-auto snap-x snap-proximity pb-1 mb-3 -mx-4 px-4" style={{WebkitOverflowScrolling:"touch"}}>
              <div className="snap-start w-[220px] flex-shrink-0 bg-white border border-gray-100 rounded-2xl p-3.5 shadow-sm flex flex-col">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${g.nombre==="Sin asignar"?"bg-red-400":"bg-[#1E3A5F]"}`}>
                    {g.nombre==="Sin asignar"?"—":g.nombre.split(" ").map(n=>n[0]).slice(0,2).join("").toUpperCase()}
                  </div>
                  <div className="min-w-0"><div className="font-bold text-[13.5px] text-gray-800 truncate">{g.nombre}</div></div>
                </div>
                <div className="text-[10px] text-gray-400 font-semibold uppercase">En curso</div>
                <div className="font-black text-gray-800 text-sm mb-3">{g.items.length}</div>
                {g.id!=null&&<button onClick={()=>setFColab(String(g.id))} className="mt-auto text-xs font-bold text-[#1E3A5F] hover:underline text-left">Ver todas →</button>}
              </div>
              {colsConItems.length===0?
                <div className="flex items-center text-[11px] text-gray-400 px-2">Sin oportunidades activas en el pipeline</div>
              :colsConItems.map(col=>{
                const its=g.items.filter(t=>col.estados.includes(t.estado));
                return <div key={col.key} className={`snap-start w-[190px] flex-shrink-0 rounded-2xl p-2.5 ${col.tint}`}>
                  <div className="flex items-center justify-between mb-2 px-0.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${col.badge}`}>{col.titulo}</span>
                    <span className="text-[10px] font-bold text-gray-400">{its.length}</span>
                  </div>
                  <div className="space-y-1.5">
                    {its.map(t=>{
                      const cl2=data.clientes.find(c=>c.id===getClienteId(t));
                      return <div key={t.id} onClick={()=>onVer(t.id)} className="bg-white rounded-xl shadow-sm px-2.5 py-2 cursor-pointer hover:shadow-md transition">
                        <div className="flex items-center gap-1.5 mb-1">
                          <div className="w-5 h-5 rounded-md bg-[#EAF0F7] text-[#1E3A5F] flex items-center justify-center flex-shrink-0"><IconoTipoPipeline tipo={t.tipo}/></div>
                          <div className="text-[11px] font-bold text-gray-700 truncate">{t.tipo}</div>
                        </div>
                        <div className="text-[11px] text-gray-600 truncate">{cl2?.nombre}</div>
                        {cl2?.direccion&&<div className="text-[10px] text-gray-400 truncate">📍 {cl2.direccion}</div>}
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[11px] font-bold text-gray-800">{getPrecioCliente(t)?eur(getPrecioCliente(t)):"—"}</span>
                          <span className="text-[9.5px] text-gray-400">{diasDesde(t.fecha)}</span>
                        </div>
                      </div>;
                    })}
                  </div>
                </div>;
              })}
            </div>;
          })}
        </div>
      </div>
    }

    {items.length===0&&<div className="text-center py-16 text-gray-400 text-sm">Sin demandas</div>}
  </div>;
}

const HISTORIAL_CAMPO_LABEL = {
  cliente_id:"Cliente", colaborador_id:"Colaborador", tipo:"Tipo de trabajo", descripcion:"Descripción",
  origen:"Origen", prioridad:"Prioridad", estado:"Estado", fecha:"Fecha", hora:"Hora",
  presupuesto_colaborador:"Presupuesto colaborador", margen:"Margen", precio_cliente:"Precio cliente",
  notas:"Notas", partidas:"Partidas", iva:"IVA", adelanto_tipo:"Tipo de adelanto", adelanto_valor:"Adelanto",
  atendido:"Atendido", ultima_novedad:"Última novedad", instrucciones_colaborador:"Instrucciones colaborador",
  notas_internas:"Notas internas", archivado:"Archivado", trabajo_terminado:"Trabajo terminado",
  cliente_verificado:"Cliente verificado", verificacion_rechazo:"Motivo de rechazo",
};
const HISTORIAL_ACCION_CFG = {
  creado:{icon:"✨",label:"Creado",cls:"text-emerald-600 bg-emerald-50"},
  editado:{icon:"✏️",label:"Editado",cls:"text-blue-600 bg-blue-50"},
  eliminado:{icon:"🗑️",label:"Eliminado",cls:"text-red-600 bg-red-50"},
};
function Historial({data,onBack}){
  const[items,setItems]=useState([]);
  const[cargando,setCargando]=useState(true);
  const[fAccion,setFAccion]=useState("Todas");
  const[fUsuario,setFUsuario]=useState("Todos");
  useEffect(()=>{
    supabase.from('historial_trabajos').select('*').order('created_at',{ascending:false}).limit(400).then(({data})=>{setItems(data||[]);setCargando(false);});
  },[]);
  const usuarios=["Todos",...new Set(items.map(i=>i.usuario_email).filter(Boolean))];
  let list=items;
  if(fAccion!=="Todas")list=list.filter(i=>i.accion===fAccion);
  if(fUsuario!=="Todos")list=list.filter(i=>i.usuario_email===fUsuario);

  const formatearValor=(campo,valor)=>{
    if(valor==null||valor==="")return "—";
    if(campo==="cliente_id"){const c=data.clientes.find(c=>String(c.id)===String(valor));return c?c.nombre:valor;}
    if(campo==="colaborador_id"){const c=data.colaboradores.find(c=>String(c.id)===String(valor));return c?c.nombre:"Sin asignar";}
    if(["precio_cliente","presupuesto_colaborador"].includes(campo))return eur(Number(valor));
    if(valor==="true")return "Sí";
    if(valor==="false")return "No";
    return valor.length>70?valor.slice(0,70)+"…":valor;
  };

  const grupos=[];
  for(const it of list){
    const ultimo=grupos[grupos.length-1];
    if(ultimo&&ultimo.trabajo_id===it.trabajo_id&&ultimo.created_at===it.created_at&&ultimo.accion===it.accion){ultimo.campos.push(it);}
    else{grupos.push({trabajo_id:it.trabajo_id,created_at:it.created_at,accion:it.accion,usuario_email:it.usuario_email,resumen:it.resumen,campos:[it]});}
  }

  return<div>
    <Back title="Historial" onBack={onBack}/>
    <div className="flex gap-1.5 flex-wrap mb-3">
      {["Todas","creado","editado","eliminado"].map(a=><Pill key={a} label={a==="Todas"?"Todas":HISTORIAL_ACCION_CFG[a].label} active={fAccion===a} onClick={()=>setFAccion(a)}/>)}
    </div>
    {usuarios.length>2&&<select className="border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold bg-white text-gray-600 mb-4" value={fUsuario} onChange={e=>setFUsuario(e.target.value)}>
      {usuarios.map(u=><option key={u} value={u}>{u==="Todos"?"Todos los usuarios":u}</option>)}
    </select>}
    {cargando&&<div className="text-center py-16 text-gray-400 text-sm">Cargando…</div>}
    {!cargando&&grupos.length===0&&<div className="text-center py-16 text-gray-400 text-sm">Sin movimientos registrados</div>}
    <div className="space-y-2">
      {grupos.map((g,i)=>{
        const cfg=HISTORIAL_ACCION_CFG[g.accion]||{icon:"•",label:g.accion,cls:"text-gray-600 bg-gray-100"};
        return<div key={i} className="bg-white border border-gray-100 rounded-2xl p-3.5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.cls}`}>{cfg.icon} {cfg.label}</span>
            <span className="text-[13px] font-semibold text-gray-800 truncate">{g.resumen}</span>
          </div>
          {g.accion==="editado"&&<div className="space-y-1 mb-2">
            {g.campos.map((c,j)=><div key={j} className="text-[12px] text-gray-600">
              <span className="font-semibold text-gray-500">{HISTORIAL_CAMPO_LABEL[c.campo]||c.campo}:</span>{" "}
              <span className="text-gray-400">{formatearValor(c.campo,c.valor_anterior)}</span>
              <span className="mx-1 text-gray-300">→</span>
              <span className="font-medium text-gray-800">{formatearValor(c.campo,c.valor_nuevo)}</span>
            </div>)}
          </div>}
          <div className="text-[11px] text-gray-400 flex items-center gap-1.5">
            <span>{g.usuario_email||"Desconocido"}</span>
            <span>·</span>
            <span>{new Date(g.created_at).toLocaleString("es-ES",{day:"2-digit",month:"2-digit",year:"2-digit",hour:"2-digit",minute:"2-digit"})}</span>
          </div>
        </div>;
      })}
    </div>
  </div>;
}
function Clientes({data,setData,onBack,toast}){
  const[cid,setCid]=useState(null);
  const[editando,setEditando]=useState(false);
  const[form,setForm]=useState({});
  const[showNew,setShowNew]=useState(false);
  const[busca,setBusca]=useState("");
  const[fAct,setFAct]=useState("Todos");
  const[orden,setOrden]=useState({campo:"nombre",dir:1});
  if(!cid){
    let list=[...data.clientes];
    if(busca.trim()){const q=busca.toLowerCase();list=list.filter(c=>c.nombre.toLowerCase().includes(q)||c.telefono?.includes(busca));}
    if(fAct==="Con activos")list=list.filter(c=>data.trabajos.some(t=>getClienteId(t)===c.id&&!["Completado","Cancelado"].includes(t.estado)));
    if(fAct==="Sin trabajos")list=list.filter(c=>!data.trabajos.some(t=>getClienteId(t)===c.id));
    const filas=list.map(c=>{
      const ts=data.trabajos.filter(t=>getClienteId(t)===c.id);
      const act=ts.filter(t=>!["Completado","Cancelado"].includes(t.estado)).length;
      const ing=ts.filter(t=>t.estado==="Completado").reduce((s,t)=>s+(getPrecioCliente(t)||0),0);
      return{...c,_trabajos:ts.length,_activos:act,_facturado:ing};
    });
    const ordenar=campo=>setOrden(o=>({campo,dir:o.campo===campo?-o.dir:1}));
    filas.sort((a,b)=>orden.campo==="facturado"?(a._facturado-b._facturado)*orden.dir:a.nombre.localeCompare(b.nombre)*orden.dir);
    const Flecha=({campo})=>orden.campo===campo?<span className="ml-1 text-gray-400">{orden.dir===1?"▾":"▴"}</span>:null;
    return<div>
      <Back title="Clientes" onBack={onBack}/>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input className={S+" flex-1 min-w-[180px]"} placeholder="🔍 Buscar por nombre o teléfono..." value={busca} onChange={e=>setBusca(e.target.value)}/>
        <div className="flex gap-1.5 flex-wrap">{["Todos","Con activos","Sin trabajos"].map(o=><Pill key={o} label={o} active={fAct===o} onClick={()=>setFAct(o)}/>)}</div>
        <button onClick={()=>setShowNew(true)} className="ml-auto bg-[#1E3A5F] hover:bg-[#152d4a] text-white text-xs font-bold px-3.5 py-2.5 rounded-xl transition whitespace-nowrap">+ Nuevo cliente</button>
      </div>
      <div className="text-xs text-gray-400 font-semibold mb-3">{filas.length} cliente{filas.length!==1?"s":""}</div>
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[680px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th onClick={()=>ordenar("nombre")} className="text-left text-[10.5px] uppercase tracking-wide text-gray-400 font-bold px-4 py-2.5 cursor-pointer select-none whitespace-nowrap">Cliente<Flecha campo="nombre"/></th>
                <th className="text-left text-[10.5px] uppercase tracking-wide text-gray-400 font-bold px-4 py-2.5 whitespace-nowrap">Teléfono</th>
                <th className="text-left text-[10.5px] uppercase tracking-wide text-gray-400 font-bold px-4 py-2.5 whitespace-nowrap">Dirección</th>
                <th className="text-right text-[10.5px] uppercase tracking-wide text-gray-400 font-bold px-4 py-2.5 whitespace-nowrap">Trabajos</th>
                <th className="text-left text-[10.5px] uppercase tracking-wide text-gray-400 font-bold px-4 py-2.5 whitespace-nowrap">Estado</th>
                <th onClick={()=>ordenar("facturado")} className="text-right text-[10.5px] uppercase tracking-wide text-gray-400 font-bold px-4 py-2.5 cursor-pointer select-none whitespace-nowrap">Facturado<Flecha campo="facturado"/></th>
                <th className="px-2"></th>
              </tr>
            </thead>
            <tbody>
              {filas.map(c=><tr key={c.id} onClick={()=>setCid(c.id)} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer transition">
                <td className="px-4 py-3">
                  <div className="font-semibold text-gray-800">{c.nombre}</div>
                  {c.email&&<div className="text-[11px] text-gray-400 mt-0.5">{c.email}</div>}
                </td>
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{c.telefono||"—"}</td>
                <td className="px-4 py-3 text-gray-500 max-w-[220px] truncate">{c.direccion||"—"}</td>
                <td className="px-4 py-3 text-right text-gray-600">{c._trabajos}</td>
                <td className="px-4 py-3">
                  {c._activos>0?<span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"/>{c._activos} activo{c._activos>1?"s":""}</span>:<span className="inline-flex items-center text-[10px] font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-400">Sin activos</span>}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-gray-800 whitespace-nowrap">{c._facturado>0?`${c._facturado}€`:<span className="text-gray-300">—</span>}</td>
                <td className="px-2 text-right text-gray-300">›</td>
              </tr>)}
            </tbody>
          </table>
        </div>
        {filas.length===0&&<div className="text-center py-10 text-sm text-gray-400">Sin resultados</div>}
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
 const[tab,setTab]=useState("activos");
  const[solicitudes,setSolicitudes]=useState([]);
  const[filtroSol,setFiltroSol]=useState("Pendiente");
  useEffect(()=>{
    supabase.from('solicitudes_colaborador').select('*').order('creado',{ascending:false}).then(({data})=>setSolicitudes(data||[]));
  },[]);
  const pendientes=solicitudes.filter(s=>s.estado==="Pendiente").length;
  const zonas=["Todas",...[...new Set(data.colaboradores.map(c=>c.zona).filter(Boolean))]];
  const FormColab=({ini,onSave,onCancel})=>{
    const[f,setF]=useState(ini||{nombre:"",especialidades:[TIPOS[0]],telefono:"",whatsapp:"",activo:true,zona:"",disponibilidad:[0,1,2,3,4],valoracion:5,trabajosCompletados:0});
    const tE=t=>setF(x=>({...x,especialidades:x.especialidades?.includes(t)?x.especialidades.filter(e=>e!==t):[...(x.especialidades||[]),t]}));
    const tD=i=>setF(x=>({...x,disponibilidad:x.disponibilidad?.includes(i)?x.disponibilidad.filter(d=>d!==i):[...(x.disponibilidad||[]),i]}));
    return<div>
      <Fld label="Nombre *"><input className={S} value={f.nombre||""} onChange={e=>setF(x=>({...x,nombre:e.target.value}))}/></Fld>
<Fld label="Teléfono"><input className={S} value={f.whatsapp||""} onChange={e=>setF(x=>({...x,whatsapp:e.target.value,telefono:e.target.value}))} placeholder="34666..."/></Fld>
      <Fld label="Email *"><input className={S} type="email" value={f.email||""} onChange={e=>setF(x=>({...x,email:e.target.value}))} placeholder="colaborador@email.com"/></Fld>
      <Fld label="Zona"><input className={S} value={f.zona||""} onChange={e=>setF(x=>({...x,zona:e.target.value}))}/></Fld>
      <Fld label="Especialidades"><div className="flex flex-wrap gap-1.5">{TIPOS.map(t=><button key={t} type="button" onClick={()=>tE(t)} className={`text-xs px-2.5 py-1 rounded-full border transition ${f.especialidades?.includes(t)?"bg-[#1E3A5F] text-white border-[#1E3A5F]":"bg-white text-gray-500 border-gray-200 hover:border-[#1E3A5F]"}`}>{t}</button>)}</div></Fld>
      <Fld label="Disponibilidad"><div className="flex gap-1.5">{DIAS.map((d,i)=><button key={i} type="button" onClick={()=>tD(i)} className={`flex-1 text-[10px] py-2 rounded-lg font-bold transition ${f.disponibilidad?.includes(i)?"bg-emerald-500 text-white":"bg-gray-100 text-gray-400"}`}>{d}</button>)}</div></Fld>
      <Fld label="Estado"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={!!f.activo} onChange={e=>setF(x=>({...x,activo:e.target.checked}))} className="accent-[#1E3A5F] w-4 h-4"/><span className="text-sm text-gray-700">Colaborador activo</span></label></Fld>
      <div className="flex gap-2"><button onClick={()=>onSave(f)} className="flex-1 bg-[#1E3A5F] hover:bg-[#152d4a] text-white py-2.5 rounded-xl font-bold text-sm transition">Guardar</button>{onCancel&&<button onClick={onCancel} className="px-4 py-2.5 border border-gray-200 text-gray-500 rounded-xl text-sm">Cancelar</button>}</div>
    </div>;
  };
  if(!coid){
    let list=[...data.colaboradores];
    if(busca.trim()){const q=busca.toLowerCase();list=list.filter(c=>c.nombre.toLowerCase().includes(q)||c.zona?.toLowerCase().includes(q)||c.telefono?.includes(busca)||c.whatsapp?.includes(busca));}
    if(fEsp!=="Todas")list=list.filter(c=>c.especialidades?.includes(fEsp));
    if(fEst==="Activo")list=list.filter(c=>c.activo);
    if(fEst==="Inactivo")list=list.filter(c=>!c.activo);
    if(fZona!=="Todas")list=list.filter(c=>c.zona===fZona);
    const filas=list.map(c=>{
      const act=data.trabajos.filter(t=>getColabId(t)===c.id&&["Presupuestando","Aceptado","En curso"].includes(t.estado)).length;
      const pag=data.trabajos.filter(t=>getColabId(t)===c.id&&t.estado==="Completado").reduce((s,t)=>s+(getPresupColab(t)||0),0);
      return{...c,_act:act,_pag:pag};
    });
    return<div>
      <Back title="Colaboradores" onBack={onBack}/>
      <div className="flex gap-2 mb-4">
        <button onClick={()=>setTab("activos")} className={`flex-1 py-2 rounded-xl text-sm font-bold transition ${tab==="activos"?"bg-[#1E3A5F] text-white":"bg-white text-gray-500 border border-gray-200"}`}>Colaboradores</button>
        <button onClick={()=>setTab("solicitudes")} className={`flex-1 py-2 rounded-xl text-sm font-bold transition relative ${tab==="solicitudes"?"bg-[#1E3A5F] text-white":"bg-white text-gray-500 border border-gray-200"}`}>Solicitudes{pendientes>0&&<span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white text-[10px] font-black min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center">{pendientes}</span>}</button>
      </div>
      {tab==="solicitudes"&&<div className="space-y-2">
        <div className="flex gap-1.5 mb-3 flex-wrap">
          {["Pendiente","Validado","Rechazado","Todas"].map(f=><Pill key={f} label={f==="Pendiente"?"Pendientes":f==="Validado"?"Validadas":f==="Rechazado"?"Rechazadas":"Todas"} active={filtroSol===f} onClick={()=>setFiltroSol(f)}/>)}
        </div>
        {solicitudes.filter(s=>filtroSol==="Todas"||s.estado===filtroSol).length===0&&<div className="text-center py-10 text-sm text-gray-400">Sin solicitudes</div>}
        {solicitudes.filter(s=>filtroSol==="Todas"||s.estado===filtroSol).map(s=><div key={s.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <div className="flex items-start justify-between mb-2">
            <div><div className="font-bold text-gray-800">{s.nombre}</div><div className="text-xs text-gray-500">{s.telefono} · {s.email}</div></div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${s.estado==="Pendiente"?"bg-amber-100 text-amber-700":s.estado==="Validado"?"bg-emerald-100 text-emerald-700":"bg-gray-100 text-gray-400"}`}>{s.estado}</span>
          </div>
          <div className="text-xs text-gray-600 mb-1">🔧 {s.especialidades}</div>
          {s.zona&&<div className="text-xs text-gray-400">📍 {s.zona}</div>}
          {s.experiencia&&<div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2 mt-2">{s.experiencia}</div>}
          {s.estado==="Pendiente"&&<div className="flex gap-2 mt-3">
            <button onClick={async()=>{
const existe=data.colaboradores.find(c=>c.email&&s.email&&c.email.toLowerCase().trim()===s.email.toLowerCase().trim());
              if(existe){
                if(!confirm(`Ya existe un colaborador con el email ${s.email} (${existe.nombre}). ¿Marcar esta solicitud como validada sin crear un duplicado?`)){return;}
                await supabase.from('solicitudes_colaborador').update({estado:"Validado"}).eq('id',s.id);
                setSolicitudes(prev=>prev.map(x=>x.id===s.id?{...x,estado:"Validado"}:x));
                toast("✅ Solicitud validada (colaborador ya existía)");
                return;
              }
              const nuevoColab={nombre:s.nombre,telefono:s.telefono,whatsapp:s.telefono.replace('+',''),email:s.email,especialidades:s.especialidades.split(", "),activo:true,zona:s.zona,disponibilidad:[0,1,2,3,4],valoracion:5,trabajosCompletados:0};      const saved=await dbSaveColab(nuevoColab);
              if(saved){
                setData(d=>({...d,colaboradores:[...d.colaboradores,saved]}));
                await supabase.from('solicitudes_colaborador').update({estado:"Validado"}).eq('id',s.id);
                setSolicitudes(prev=>prev.map(x=>x.id===s.id?{...x,estado:"Validado"}:x));
                try{
                  await fetch("https://opijkazhbktiikdzbanb.supabase.co/functions/v1/invitar-colaborador",{
                    method:"POST",
                    headers:{"Content-Type":"application/json"},
                    body:JSON.stringify({email:s.email,nombre:s.nombre}),
                  });
                  toast("✅ Colaborador creado e invitado por email");
                }catch(err){
                  toast("✅ Colaborador creado (fallo al enviar invitación)");
                }
              }
            }} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold py-2 rounded-xl transition">✅ Validar y crear colaborador</button>
            <button onClick={async()=>{await supabase.from('solicitudes_colaborador').update({estado:"Rechazado"}).eq('id',s.id);setSolicitudes(prev=>prev.map(x=>x.id===s.id?{...x,estado:"Rechazado"}:x));}} className="bg-red-50 text-red-500 text-xs font-bold px-3 rounded-xl">Rechazar</button>
          </div>}
        </div>)}
      </div>}
      {tab==="activos"&&<>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <input className={S+" flex-1 min-w-[180px]"} placeholder="🔍 Nombre, zona o teléfono..." value={busca} onChange={e=>setBusca(e.target.value)}/>
        <select className="border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-semibold bg-white text-gray-600" value={fEsp} onChange={e=>setFEsp(e.target.value)}>
          <option value="Todas">Todas las especialidades</option>
          {TIPOS.map(t=><option key={t} value={t}>{t}</option>)}
        </select>
        {zonas.length>1&&<select className="border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-semibold bg-white text-gray-600" value={fZona} onChange={e=>setFZona(e.target.value)}>
          {zonas.map(z=><option key={String(z)} value={z}>{z==="Todas"?"Todas las zonas":z}</option>)}
        </select>}
        <button onClick={()=>{navigator.clipboard.writeText("https://domia-crm-two.vercel.app/alta-colaborador").then(()=>toast("📋 Enlace de alta copiado"));}} className="bg-green-50 text-green-700 border border-green-200 text-xs font-bold px-3.5 py-2.5 rounded-xl hover:bg-green-100 transition whitespace-nowrap">🔗 Copiar enlace alta</button>
        <button onClick={()=>setShowNew(true)} className="bg-[#1E3A5F] text-white text-xs font-bold px-3.5 py-2.5 rounded-xl hover:bg-[#152d4a] transition whitespace-nowrap">+ Nuevo colaborador</button>
      </div>
      <div className="flex gap-1.5 mb-3">{["Todos","Activo","Inactivo"].map(o=><Pill key={o} label={o} active={fEst===o} onClick={()=>setFEst(o)}/>)}</div>
      <div className="text-xs text-gray-400 font-semibold mb-3">{filas.length} colaborador{filas.length!==1?"es":""}</div>
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[860px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left text-[10.5px] uppercase tracking-wide text-gray-400 font-bold px-4 py-2.5 whitespace-nowrap">Colaborador</th>
                <th className="text-left text-[10.5px] uppercase tracking-wide text-gray-400 font-bold px-4 py-2.5 whitespace-nowrap">Teléfono</th>
                <th className="text-left text-[10.5px] uppercase tracking-wide text-gray-400 font-bold px-4 py-2.5 whitespace-nowrap">Zona</th>
                <th className="text-left text-[10.5px] uppercase tracking-wide text-gray-400 font-bold px-4 py-2.5 whitespace-nowrap">Disponibilidad</th>
                <th className="text-right text-[10.5px] uppercase tracking-wide text-gray-400 font-bold px-4 py-2.5 whitespace-nowrap">En curso</th>
                <th className="text-right text-[10.5px] uppercase tracking-wide text-gray-400 font-bold px-4 py-2.5 whitespace-nowrap">Pagado</th>
                <th className="text-left text-[10.5px] uppercase tracking-wide text-gray-400 font-bold px-4 py-2.5 whitespace-nowrap">Estado</th>
                <th className="px-2"></th>
              </tr>
            </thead>
            <tbody>
              {filas.map(c=><tr key={c.id} onClick={()=>setCoid(c.id)} className={`border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer transition ${!c.activo?"opacity-50":""}`}>
                <td className="px-4 py-3">
                  <div className="font-semibold text-gray-800">{c.nombre}</div>
                  {c.especialidades?.length>0&&<div className="flex flex-wrap gap-1 mt-1">{c.especialidades.map(e=><span key={e} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#E7EDF5] text-[#1E3A5F] whitespace-nowrap">{e}</span>)}</div>}
                </td>
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{c.telefono||c.whatsapp||"—"}</td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{c.zona||"—"}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-0.5">{DIAS.map((d,i)=><span key={i} className={`text-[9px] w-5 h-5 flex items-center justify-center rounded font-bold ${c.disponibilidad?.includes(i)?"bg-emerald-100 text-emerald-600":"bg-gray-100 text-gray-300"}`}>{d}</span>)}</div>
                </td>
                <td className="px-4 py-3 text-right text-gray-600">{c._act}</td>
                <td className="px-4 py-3 text-right font-semibold text-gray-800 whitespace-nowrap">{c._pag>0?`${c._pag}€`:<span className="text-gray-300">—</span>}</td>
                <td className="px-4 py-3">{c.activo?<span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"/>Activo</span>:<span className="inline-flex items-center text-[10px] font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-400">Inactivo</span>}</td>
                <td className="px-2 text-right text-gray-300">›</td>
              </tr>)}
            </tbody>
          </table>
        </div>
        {filas.length===0&&<div className="text-center py-10 text-sm text-gray-400">Sin resultados.</div>}
      </div>
{showNew&&<Modal title="Nuevo colaborador" onClose={()=>setShowNew(false)}><FormColab onSave={async f=>{if(!f.nombre.trim())return;if(!f.email||!f.email.trim()){alert("El email es obligatorio");return;}const dup=data.colaboradores.find(c=>c.email&&c.email.toLowerCase().trim()===f.email.toLowerCase().trim());if(dup){alert(`Ya existe un colaborador con ese email: ${dup.nombre}`);return;}const saved=await dbSaveColab(f);if(saved){setData(d=>({...d,colaboradores:[...d.colaboradores,saved]}));setShowNew(false);toast("✅ Colaborador creado");}}} onCancel={()=>setShowNew(false)}/></Modal>}      </>}
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
<button onClick={async()=>{const trabajosAsignados=data.trabajos.filter(t=>getColabId(t)===coid);const activos=trabajosAsignados.filter(t=>!["Completado","Cancelado"].includes(t.estado));if(activos.length>0){if(!confirm(`⚠️ ATENCIÓN: ${co?.nombre} tiene ${activos.length} trabajo(s) activo(s) asignado(s). Si lo eliminas, esos trabajos quedarán SIN colaborador.\n\n¿Seguro que quieres eliminarlo?`))return;}else if(trabajosAsignados.length>0){if(!confirm(`${co?.nombre} tiene ${trabajosAsignados.length} trabajo(s) en su historial (ya completados). ¿Eliminar de todas formas?`))return;}else{if(!confirm(`¿Eliminar a ${co?.nombre}?`))return;}await supabase.from('colaboradores').delete().eq('id',coid);setData(d=>({...d,colaboradores:d.colaboradores.filter(x=>x.id!==coid)}));setCoid(null);toast("Colaborador eliminado");}} className="w-full mt-2 bg-red-50 text-red-500 py-2.5 rounded-xl text-sm hover:bg-red-100 transition">Eliminar colaborador</button>
  </div>;
  return<div>
    <Back title={co?.nombre} onBack={()=>setCoid(null)} right={<button onClick={()=>{setForm({...co});setEditando(true);}} className="border border-gray-200 text-gray-500 text-xs font-semibold px-3 py-1.5 rounded-xl hover:border-[#1E3A5F] hover:text-[#1E3A5F] transition">Editar</button>}/>
    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm mb-4">
      <div className="flex flex-wrap items-center gap-2 mb-3"><span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${co?.activo?"bg-emerald-100 text-emerald-700":"bg-gray-100 text-gray-400"}`}>{co?.activo?"Activo":"Inactivo"}</span>{co?.especialidades?.map(e=><span key={e} className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-semibold border border-blue-100">{e}</span>)}</div>
      <div className="grid grid-cols-2 gap-3 text-sm mb-3"><div><div className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Teléfono</div><div className="font-semibold">{co?.telefono||co?.whatsapp||"—"}</div></div><div><div className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Zona</div><div className="font-semibold">{co?.zona||"—"}</div></div></div>
      <div className="text-[10px] text-gray-400 font-bold uppercase mb-1.5">Disponibilidad</div>
      <div className="flex gap-1 mb-3">{DIAS.map((d,i)=><span key={i} className={`flex-1 text-[10px] py-1.5 flex items-center justify-center rounded-lg font-bold ${co?.disponibilidad?.includes(i)?"bg-emerald-100 text-emerald-600":"bg-gray-100 text-gray-300"}`}>{d}</span>)}</div>
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-violet-50 rounded-xl p-2 text-center"><div className="font-black text-violet-700">{act}</div><div className="text-[10px] text-violet-600">Activos</div></div>
        <div className="bg-emerald-50 rounded-xl p-2 text-center"><div className="font-black text-emerald-700">{done}</div><div className="text-[10px] text-emerald-600">Completados</div></div>
        <div className="bg-red-50 rounded-xl p-2 text-center"><div className="font-black text-red-600">{pag}€</div><div className="text-[10px] text-red-500">Pagado</div></div>
      </div>
{co?.whatsapp&&<button onClick={()=>window.open(`https://wa.me/${co.whatsapp.replace(/\s/g,'')}`,"_blank")} className="w-full mt-3 bg-green-500 hover:bg-green-600 text-white text-sm font-bold py-2.5 rounded-xl transition">📱 Abrir WhatsApp</button>}
      {co?.email&&<button onClick={async()=>{if(!confirm(`¿Enviar acceso al portal a ${co.email}?`))return;try{const r=await fetch("https://opijkazhbktiikdzbanb.supabase.co/functions/v1/invitar-colaborador",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:co.email,nombre:co.nombre})});if(r.ok)toast("📧 Acceso enviado por email");else toast("Error al enviar el acceso");}catch(err){toast("Error al enviar el acceso");}}} className="w-full mt-2 bg-[#1E3A5F] hover:bg-[#152d4a] text-white text-sm font-bold py-2.5 rounded-xl transition">📧 Enviar acceso al portal</button>}
    </div>
    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Trabajos asignados</div>
    {ts.length===0&&<p className="text-sm text-gray-400 text-center py-6">Sin trabajos asignados</p>}
    <div className="space-y-2">{ts.map(t=>{const cl=data.clientes.find(c=>c.id===getClienteId(t));return<div key={t.id} className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm flex items-center gap-2"><div className="flex-1 min-w-0"><div className="font-semibold text-sm text-gray-800">{t.tipo}</div><div className="text-xs text-gray-500 truncate">{cl?.nombre} · {fmt(t.fecha)}</div></div><div className="flex items-center gap-2">{getPresupColab(t)&&<span className="text-xs font-bold text-red-500">{getPresupColab(t)}€</span>}<Badge text={t.estado}/></div></div>;})}</div>
  </div>;
}
function EditorPresupuesto({t,cl,co,data,setData,onClose,toast}){
const[partidas,setPartidas]=useState(t.partidas&&t.partidas.length?t.partidas:[{desc:t.descripcion||"",cantidad:1,precio:0,margenLinea:null}]);
  const[margenManual,setMargenManual]=useState(null);
  const[iva,setIva]=useState(t.iva||21);
  const[adelantoTipo,setAdelantoTipo]=useState(t.adelanto_tipo||"porcentaje");
const[adelantoManual,setAdelantoManual]=useState(null);
  const adelantoValor=adelantoManual;
  const totalColab=partidas.reduce((s,p)=>s+Math.round((+p.cantidad||1)*(+p.precio||0)),0);
  const margenTramo=totalColab>=15000?20:totalColab>=5000?25:30;
  const margen=margenManual!==null?margenManual:margenTramo;
  const setMargen=(v)=>setMargenManual(v);
const totalCliente=Math.round(partidas.reduce((s,p)=>{const ml=p.margenLinea!==null&&p.margenLinea!==undefined?+p.margenLinea:margen;return s+Math.round((+p.cantidad||1)*(+p.precio||0)*(1+ml/100)*100)/100;},0)*100)/100;
const adelantoEfectivo=adelantoManual!==null?adelantoManual:(totalCliente>5000?40:50);
  const addPartida=(tipo="normal")=>setPartidas(p=>[...p,{desc:"",cantidad:1,precio:0,margenLinea:null,tipo}]);
  const updPartida=(i,k,v)=>setPartidas(p=>p.map((x,idx)=>idx===i?{...x,[k]:v}:x));
  const delPartida=(i)=>setPartidas(p=>p.filter((_,idx)=>idx!==i));
const[menuAbierto,setMenuAbierto]=useState<number|null>(null);
  const[generando,setGenerando]=useState(false);
  const[pdfUrl,setPdfUrl]=useState<string|null>(null);
  const generarPDF=async()=>{
    setGenerando(true);
    const fecha=new Date().toLocaleDateString("es-ES",{day:"numeric",month:"long",year:"numeric"});
    const doc=new jsPDF();
    const azul="#1E3A5F";

    try{
      const logoResp=await fetch('https://opijkazhbktiikdzbanb.supabase.co/storage/v1/object/public/fotos-demandas/logo-domia.png');
      const logoBlob=await logoResp.blob();
      const logoBase64=await new Promise<string>((res)=>{const r=new FileReader();r.onload=()=>res(r.result as string);r.readAsDataURL(logoBlob);});
      doc.addImage(logoBase64,'PNG',75,10,60,45);
    }catch(e){
      doc.setFontSize(24);
      doc.setTextColor(30,58,95);
      doc.text("DOMIA SERVICES",105,25,{align:"center"});
    }
    doc.setFontSize(9);
    doc.setTextColor(150,150,150);
    doc.text("685 917 059 · Elche, Alicante",105,60,{align:"center"});

   doc.setFontSize(20);
    doc.setTextColor(30,58,95);
    doc.text("PRESUPUESTO",105,75,{align:"center"});

    doc.setFontSize(10);
    doc.setTextColor(80,80,80);
    doc.text(`Cliente: ${cl?.nombre||""}`,195,87,{align:"right"});
    doc.text(fecha,195,93,{align:"right"});

    doc.setFillColor(30,58,95);
    doc.rect(15,102,180,8,"F");
    doc.setTextColor(255,255,255);
    doc.setFontSize(10);
    doc.text("Descripción",18,107.5);
  doc.text("Cant.",156,107.5,{align:"right"});
    doc.text("P. Unit.",174,107.5,{align:"right"});
    doc.text("Importe",192,107.5,{align:"right"});
   let y=118;
    doc.setTextColor(60,60,60);
    doc.setFontSize(10);
    const notas_pdf:any[]=[];
    partidas.filter(p=>p.desc).forEach(p=>{
const lineas=doc.splitTextToSize(p.desc,p.tipo==="normal"||!p.tipo?118:175);
      const alturaNecesaria=lineas.length*5+4;
      if(y+alturaNecesaria>260){doc.addPage();y=25;doc.setFontSize(10);}
      if(p.tipo==="seccion"){
        
       doc.setFontSize(10);
        doc.setFont(undefined,"bold");
        doc.setTextColor(30,58,95);
        doc.text(lineas,18,y);
        doc.setDrawColor(30,58,95);
        doc.setLineWidth(0.5);
        doc.line(15,y+2,195,y+2);
        doc.setLineWidth(0.2);
        doc.setFont(undefined,"normal");
        y+=alturaNecesaria;
      } else if(p.tipo==="nota"){
        notas_pdf.push(lineas);
      } else {
        const ml=p.margenLinea!==null&&p.margenLinea!==undefined?+p.margenLinea:margen;
        doc.setTextColor(60,60,60);
        doc.text(lineas,18,y);
        const cant=+p.cantidad||1;
        const prec=+p.precio||0;
const importeLinea=Math.round(prec*(1+ml/100)*100)/100*cant;
        const precioUnitCliente=Math.round(prec*(1+ml/100)*100)/100;
        doc.text(`${cant}`,156,y,{align:"right"});
        doc.text(eur(precioUnitCliente),174,y,{align:"right"});
        doc.text(eur(importeLinea),192,y,{align:"right"});
        y+=alturaNecesaria;
        
      }
    });
    if(y>235){doc.addPage();y=25;}

   const base=partidas.reduce((s,p)=>{if(p.tipo==="seccion"||p.tipo==="nota")return s;const ml=p.margenLinea!==null&&p.margenLinea!==undefined?+p.margenLinea:margen;const cant=+p.cantidad||1;const prec=+p.precio||0;return s+Math.round(prec*(1+ml/100)*100)/100*cant;},0);
    const importeIva=Math.round(base*iva/100*100)/100;
    const totalConIva=Math.round((base+importeIva)*100)/100;
    y+=6;
    doc.setFontSize(10);
    doc.setTextColor(90,90,90);
   doc.text("Base imponible",150,y,{align:"right"});
    doc.text(eur(base),192,y,{align:"right"});
    y+=7;
    doc.text(`IVA (${iva}%)`,150,y,{align:"right"});
    doc.text(eur(importeIva),192,y,{align:"right"});
    y+=4;
    doc.setDrawColor(30,58,95);
    doc.setLineWidth(0.5);
    doc.line(120,y,192,y);
    y+=8;
    doc.setFontSize(14);
    doc.setTextColor(30,58,95);
    doc.setFont(undefined,"bold");
    doc.text("TOTAL",150,y,{align:"right"});
    doc.text(eur(totalConIva),192,y,{align:"right"});
    doc.setFont(undefined,"normal");
    y+=6;
    const validez=new Date();validez.setDate(validez.getDate()+30);
    doc.setFontSize(8);
    doc.setTextColor(150,150,150);
    doc.text(`Válido hasta el ${validez.toLocaleDateString("es-ES",{day:"numeric",month:"long",year:"numeric"})}`,192,y,{align:"right"});
    y+=6;
   if(notas_pdf.length>0){
      y+=10;
      doc.setFontSize(10);
      doc.setFont(undefined,"bold");
      doc.setTextColor(30,58,95);
      doc.text("Observaciones",18,y);
      doc.setDrawColor(30,58,95);
      doc.setLineWidth(0.5);
      doc.line(15,y+2,195,y+2);
      doc.setLineWidth(0.2);
      doc.setFont(undefined,"normal");
      y+=8;
      doc.setFontSize(9);
      doc.setTextColor(80,80,80);
      notas_pdf.forEach(n=>{
        if(y>270){doc.addPage();y=25;}
        doc.text(n,18,y);
        y+=n.length*5+2;
      });
    }
    y+=34;
    doc.setFontSize(10);
    doc.setTextColor(60,60,60);
   doc.text("Forma de pago:",15,y);
    doc.setFontSize(9);
    doc.setTextColor(100,100,100);
    if(base<=5000){
      doc.text(`• Entrega inicial del 50% (${eur(Math.round(totalConIva*0.5*100)/100)}) antes de empezar el trabajo.`,18,y+7);
      doc.text(`• Entrega final del 50% (${eur(Math.round(totalConIva*0.5*100)/100)}) al finalizar.`,18,y+13);
    }else{
      doc.text(`• Entrega inicial del 40% (${eur(Math.round(totalConIva*0.4*100)/100)}) antes de empezar el trabajo.`,18,y+7);
      doc.text(`• Entrega del 40% (${eur(Math.round(totalConIva*0.4*100)/100)}) a mitad del trabajo.`,18,y+13);
      doc.text(`• Entrega final del 20% (${eur(Math.round(totalConIva*0.2*100)/100)}) al finalizar.`,18,y+19);
    }

    y+=30;
    doc.setFontSize(8);
    doc.setTextColor(150,150,150);
    const cond=doc.splitTextToSize("Este presupuesto tiene una validez de 30 días. Todo trabajo no especificado será presupuestado a parte.",175);
    doc.text(cond,15,y);

    doc.setFontSize(8);
    doc.setTextColor(150,150,150);
    doc.text("DOMIA SERVICES · 685 917 059 · Elche, Alicante",105,285,{align:"center"});

    const totalPaginas=doc.internal.getNumberOfPages();
    for(let p=1;p<=totalPaginas;p++){
      doc.setPage(p);
      doc.setFontSize(8);
      doc.setTextColor(150,150,150);
      doc.text(`Página ${p} de ${totalPaginas}`,105,292,{align:"center"});
    }
    const blob=doc.output("blob");
    const nombre=`domia_presupuesto_${t.id}_${Date.now()}.pdf`;
    window.open(URL.createObjectURL(blob),"_blank");
    const{data:up}=await supabase.storage.from('fotos-demandas').upload(nombre,blob,{contentType:'application/pdf',upsert:true});
    if(up){
      const{data:pub}=supabase.storage.from('fotos-demandas').getPublicUrl(nombre);
      setPdfUrl(pub.publicUrl);
const pdfViejo=getNotas(t).split('|').map(n=>n.trim()).find(n=>n.startsWith('pdfdomia:'))?.replace('pdfdomia:','');
      const notasActuales=getNotas(t).split('|').filter(n=>!n.trim().startsWith('pdfdomia:')).map(n=>n.trim()).join(' | ')+(pdfViejo?` | pdfhist:${pdfViejo}`:'');
      const hist=[...getHistorial(t),{ts:now(),txt:`PDF Domia generado: ${totalCliente}€`,tipo:"presupuesto"}];
const saved=await dbSaveTrabajo({...t,precioCliente:totalCliente,historial:hist,partidas,iva,adelanto_tipo:adelantoTipo,adelanto_valor:adelantoValor,notas:(notasActuales?notasActuales+' | ':'')+`pdfdomia:${pub.publicUrl}`});      if(saved)setData(d=>({...d,trabajos:d.trabajos.map(x=>x.id===t.id?{...saved,clienteId:saved.cliente_id,colaboradorId:saved.colaborador_id}:x)}));
      toast("✅ PDF generado y guardado en la tarjeta");
    }
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
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] font-bold text-gray-400 uppercase">IVA aplicado</div>
        <div className="flex gap-1">
          {[21,10,0].map(v=><button key={v} onClick={()=>setIva(v)} className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${iva===v?"bg-emerald-500 text-white":"bg-gray-800 text-gray-400"}`}>{v}%</button>)}
        </div>
      </div>
     <div className="grid grid-cols-3 gap-2 text-center mt-2">
        <div><div className="text-lg font-black text-red-400">{totalColab}€</div><div className="text-[10px] text-gray-400">Colab.</div></div>
        <div><div className="text-lg font-black text-blue-400">{margen}%</div><div className="text-[10px] text-gray-400">Margen</div></div>
        <div><div className="text-lg font-black text-emerald-400">{totalCliente}€</div><div className="text-[10px] text-gray-400">Base</div></div>
      </div>
      <div className="border-t border-gray-700 mt-3 pt-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] font-bold text-gray-400 uppercase">Adelanto cliente</div>
          <div className="flex gap-1">
            <button onClick={()=>setAdelantoTipo("porcentaje")} className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${adelantoTipo==="porcentaje"?"bg-amber-500 text-white":"bg-gray-800 text-gray-400"}`}>%</button>
            <button onClick={()=>setAdelantoTipo("fijo")} className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${adelantoTipo==="fijo"?"bg-amber-500 text-white":"bg-gray-800 text-gray-400"}`}>€ fijo</button>
          </div>
        </div>
        <div className="flex items-center gap-2">
<input type="number" value={adelantoEfectivo} onChange={e=>setAdelantoManual(+e.target.value||0)} className="w-24 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-sm text-white text-right focus:outline-none"/>
          <span className="text-gray-400 text-sm">{adelantoTipo==="porcentaje"?"% del total":"€ fijos"}</span>
        </div>
      </div>
    </div>
    <div>
      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Partidas del presupuesto</div>
      <div className="space-y-2">
<div className="grid grid-cols-[1fr_36px_52px_36px_16px] gap-1 text-[10px] text-gray-400 font-bold uppercase px-1">
        <span>Descripción</span><span className="text-center">Cant.</span><span className="text-center">Precio</span><span className="text-center">%</span><span/>
        </div>
        {partidas.map((p,i)=>{
          const ml=p.margenLinea!==null&&p.margenLinea!==undefined?+p.margenLinea:margen;
          const totalLinea=Math.round((+p.cantidad||1)*(+p.precio||0)*(1+ml/100));
          const insertar=(tipo="normal")=>{const n=[...partidas];n.splice(i+1,0,{desc:"",cantidad:1,precio:0,margenLinea:null,tipo});setPartidas(n);};
          const btnMenu=<div className="relative"><button onClick={(e)=>{e.stopPropagation();setMenuAbierto(menuAbierto===i?null:i);}} className="text-gray-300 hover:text-[#1E3A5F] text-lg font-bold">⊕</button>{menuAbierto===i&&<div className="absolute right-0 top-7 flex flex-col bg-white border border-gray-200 rounded-xl shadow-lg z-20 text-xs overflow-hidden"><button onClick={()=>{insertar("normal");setMenuAbierto(null);}} className="px-3 py-2 hover:bg-gray-50 text-left whitespace-nowrap">+ Línea</button><button onClick={()=>{insertar("seccion");setMenuAbierto(null);}} className="px-3 py-2 hover:bg-gray-50 text-left whitespace-nowrap">📌 Sección</button><button onClick={()=>{insertar("nota");setMenuAbierto(null);}} className="px-3 py-2 hover:bg-gray-50 text-left whitespace-nowrap">💬 Nota</button></div>}</div>;
          if(p.tipo==="seccion")return<div key={i} className="flex items-center gap-2 mt-2">
            <input value={p.desc} onChange={e=>updPartida(i,"desc",e.target.value)} className="flex-1 border-b-2 border-[#1E3A5F] bg-transparent px-1 py-1 text-sm font-bold text-[#1E3A5F] focus:outline-none" placeholder="Título de sección..."/>
            {btnMenu}
            <button onClick={()=>delPartida(i)} className="text-red-400 hover:text-red-600 text-lg font-bold">×</button>
          </div>;
          if(p.tipo==="nota")return<div key={i} className="flex items-center gap-2">
            <input value={p.desc} onChange={e=>updPartida(i,"desc",e.target.value)} className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-gray-400 italic focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]" placeholder="Nota u observación..."/>
            {btnMenu}
            <button onClick={()=>delPartida(i)} className="text-red-400 hover:text-red-600 text-lg font-bold">×</button>
          </div>;
          return<div key={i} className="space-y-1">
<div className="grid grid-cols-[1fr_36px_52px_36px_20px_16px] gap-1 items-center">
            <input value={p.desc} onChange={e=>updPartida(i,"desc",e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]" placeholder="Descripción"/>
              <input type="number" value={p.cantidad||""} onChange={e=>updPartida(i,"cantidad",e.target.value)} className="border border-gray-200 rounded-lg px-1 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]" placeholder="1"/>
              <input type="number" value={p.precio||""} onChange={e=>updPartida(i,"precio",e.target.value)} className="border border-gray-200 rounded-lg px-1 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]" placeholder="€"/>
              <input type="number" value={p.margenLinea!==null&&p.margenLinea!==undefined?p.margenLinea:""} onChange={e=>updPartida(i,"margenLinea",e.target.value===""?null:+e.target.value)} className="border border-gray-200 rounded-lg px-1 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]" placeholder={`${margen}`}/>
              {btnMenu}
              <button onClick={()=>delPartida(i)} className="text-red-400 hover:text-red-600 text-lg font-bold">×</button>
            </div>
            {(p.cantidad>1||p.precio>0)&&<div className="text-right text-xs text-gray-400 pr-6">{+p.cantidad||1} × {+p.precio||0}€ × {ml}% = <span className="font-bold text-gray-700">{totalLinea}€</span></div>}
          </div>;
        })}
      </div>
      <div className="flex gap-2 mt-2">
        <button onClick={()=>addPartida("normal")} className="flex-1 border-2 border-dashed border-gray-200 text-gray-400 py-2 rounded-xl text-sm hover:border-[#1E3A5F] hover:text-[#1E3A5F] transition">+ Línea</button>
        <button onClick={()=>addPartida("seccion")} className="border-2 border-dashed border-blue-200 text-blue-400 py-2 px-3 rounded-xl text-sm hover:border-[#1E3A5F] hover:text-[#1E3A5F] transition">📌 Sección</button>
        <button onClick={()=>addPartida("nota")} className="border-2 border-dashed border-gray-200 text-gray-400 py-2 px-3 rounded-xl text-sm hover:border-[#1E3A5F] hover:text-[#1E3A5F] transition">💬 Nota</button>
      </div>
    </div>
    <button onClick={generarPDF} className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-bold text-sm transition">📄 Generar PDF Domia ({totalCliente}€)</button>
       {pdfUrl&&<button onClick={async()=>{
      const hist=[...getHistorial(t),{ts:now(),txt:`Presupuesto Domia generado: ${totalCliente}€`,tipo:"cliente"}];
      const saved=await dbSaveTrabajo({...t,estado:"Presupuesto enviado",precioCliente:totalCliente,adelanto_valor:adelantoEfectivo,adelanto_tipo:'porcentaje',iva:iva,historial:hist,notas:getNotas(t)+` | pdfdomia:${pdfUrl}`});
    if(saved){setData(d=>({...d,trabajos:d.trabajos.map(x=>x.id===t.id?{...saved,clienteId:saved.cliente_id,colaboradorId:saved.colaborador_id}:x)}));toast("✅ Presupuesto guardado");onClose();}
    }} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-sm transition">✅ Guardar presupuesto</button>}
    <button onClick={onClose} className="w-full border border-gray-200 text-gray-500 py-2.5 rounded-xl text-sm">Cancelar</button>
  </div>;
}
function SelectorColaborador({data,valorActual,onSeleccionar,onCerrar}){
  const[busca,setBusca]=useState("");
  const[fOficio,setFOficio]=useState("Todos");
  const activos=data.colaboradores.filter(c=>c.activo);
  const oficioDe=c=>(c.especialidades&&c.especialidades[0])||"Otros";
  const todosOficios=[...new Set(activos.map(oficioDe))].sort();
  const filtrados=(busca.trim()?activos.filter(c=>c.nombre.toLowerCase().includes(busca.toLowerCase())||c.especialidades?.some(e=>e.toLowerCase().includes(busca.toLowerCase()))||c.zona?.toLowerCase().includes(busca.toLowerCase())):activos).filter(c=>fOficio==="Todos"||oficioDe(c)===fOficio);
  const porOficio={};
  filtrados.forEach(c=>{const e=oficioDe(c);if(!porOficio[e])porOficio[e]=[];porOficio[e].push(c);});
  const oficios=Object.keys(porOficio).sort();
  return<Modal title="Seleccionar colaborador" onClose={onCerrar} wide>
    <div className="relative mb-3">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <input className={S+" pl-9"} placeholder="Buscar por nombre o zona..." value={busca} onChange={e=>setBusca(e.target.value)} autoFocus/>
    </div>
    <div className="flex gap-1.5 overflow-x-auto pb-2.5">
      {["Todos",...todosOficios].map(o=><button key={o} onClick={()=>setFOficio(o)} className={`text-[11.5px] font-semibold px-3 py-1.5 rounded-full border whitespace-nowrap transition ${fOficio===o?"bg-[#1E3A5F] text-white border-[#1E3A5F]":"bg-white text-gray-500 border-gray-200 hover:border-gray-400"}`}>{o}</button>)}
    </div>
    <div className="border border-gray-200 rounded-xl overflow-hidden max-h-[55vh] overflow-y-auto">
      <button onClick={()=>onSeleccionar("")} className={`w-full flex items-center gap-2.5 text-left px-3 py-2 text-[12.5px] font-semibold transition ${!valorActual?"bg-[#E7EDF5] text-[#1E3A5F]":"text-gray-500 hover:bg-gray-50"}`}>
        <span className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${!valorActual?"bg-[#1E3A5F] text-white":"bg-gray-100 text-gray-400"}`}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><line x1="5.6" y1="5.6" x2="18.4" y2="18.4"/></svg></span>
        Sin colaborador
        {!valorActual&&<svg className="ml-auto" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
      </button>
      {oficios.length===0&&<div className="text-center py-8 text-sm text-gray-400 border-t border-gray-100">Sin colaboradores</div>}
      {oficios.map(oficio=><div key={oficio}>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border-t border-gray-100 text-[10px] font-bold uppercase tracking-wider text-gray-400">
          {oficio}<span className="ml-auto">{porOficio[oficio].length}</span>
        </div>
        {porOficio[oficio].map(c=>{
          const activos=data.trabajos.filter(t=>getColabId(t)===c.id&&["Presupuestando","Aceptado","En curso"].includes(t.estado)).length;
          const sel=String(valorActual)===String(c.id);
          const iniciales=c.nombre.split(" ").filter(Boolean).map(n=>n[0]).slice(0,2).join("").toUpperCase();
          return<button key={c.id} onClick={()=>onSeleccionar(c.id)} className={`w-full flex items-center gap-2.5 text-left px-3 py-2 border-t border-gray-100 transition ${sel?"bg-[#E7EDF5]":"hover:bg-gray-50"}`}>
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${sel?"bg-[#1E3A5F] text-white":"bg-gray-100 text-gray-500"}`}>{iniciales}</span>
            <span className="flex-1 min-w-0 text-[13px] font-semibold text-gray-800 truncate">{c.nombre}</span>
            {c.zona&&<span className="text-[11px] text-gray-400 whitespace-nowrap truncate max-w-[40%]">{c.zona}</span>}
            <span className="flex items-center justify-end gap-1 w-7 text-[10.5px] font-semibold text-gray-500 flex-shrink-0"><span className={`w-1.5 h-1.5 rounded-full ${activos>0?"bg-orange-500":"bg-emerald-500"}`}/>{activos}</span>
            <span className="w-4 flex-shrink-0 text-[#1E3A5F]">{sel&&<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}</span>
          </button>;
        })}
      </div>)}
    </div>
  </Modal>;
}
function FichaTrabajo({t,cl,co,data,setData,onClose,toast,setModo,setSec,setFocoFinanzas}){
const[tab,setTab]=useState("resumen");
const[editColab,setEditColab]=useState(false);
const[selectorColab,setSelectorColab]=useState(false);
const[accionesAbiertas,setAccionesAbiertas]=useState(false);
const[modalRechazo,setModalRechazo]=useState(false);
const[motivoRechazo,setMotivoRechazo]=useState("");const[cobrosTrabajo,setCobrosTrabajo]=useState([]);
useEffect(()=>{supabase.from('cobros_cliente').select('*').eq('trabajo_id',t.id).then(({data})=>setCobrosTrabajo(data||[]));},[t.id]);
  const[guardando,setGuardando]=useState(false);
  const notas=getNotas(t);
  const partes=notas.split('|').map(n=>n.trim());
  const foto=partes.find(p=>p.startsWith('foto:'))?.replace('foto:','');
  const pres=partes.find(p=>p.startsWith('presup:'))?.replace('presup:','');
  const pdfD=partes.find(p=>p.startsWith('pdfdomia:'))?.replace('pdfdomia:','');
  const disp=partes.find(p=>p.startsWith('disponibilidad:'))?.replace('disponibilidad:','').trim();
const comentCli=partes.find(p=>p.startsWith('cliente:'))?.replace('cliente:','').trim();
const notaColab=partes.find(p=>p.startsWith('notacolab:'))?.replace('notacolab:','').trim();
  const justificante=partes.find(p=>p.startsWith('justificante:'))?.replace('justificante:','').trim();
  const precio=getPrecioCliente(t)||0;
  const colab=getPresupColab(t)||0;
  const margen=precio-colab;
  const iva=t.iva||21;
  const totalIva=Math.round(precio*(1+iva/100));
  const adelanto=t.adelanto_tipo==='fijo'?(t.adelanto_valor||0):Math.round(totalIva*(t.adelanto_valor||30)/100);
  const linkAceptar=`https://domia-crm-two.vercel.app/aceptar/${t.id}`;
  const tel=(cl?.telefono||"").replace(/\s/g,'');

return<div className="space-y-3">
    {selectorColab&&<SelectorColaborador data={data} valorActual={t.colaboradorId} onCerrar={()=>setSelectorColab(false)} onSeleccionar={async(id)=>{const saved=await dbSaveTrabajo({...t,colaboradorId:id||null});if(saved){setData(d=>({...d,trabajos:d.trabajos.map(x=>x.id===t.id?{...saved,clienteId:saved.cliente_id,colaboradorId:saved.colaborador_id}:x)}));toast("Colaborador actualizado");}setSelectorColab(false);}}/>}  
   <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
  <div className="p-4">
    <div className="flex items-center gap-3">
      <div className="w-11 h-11 rounded-full bg-[#1E3A5F] text-white flex items-center justify-center font-bold flex-shrink-0">{cl?.nombre?.[0]||"?"}</div>
      <div className="min-w-0"><div className="font-bold text-gray-800 text-[14.5px] truncate">{cl?.nombre}</div><div className="text-xs text-gray-400">{cl?.telefono}</div></div>
    </div>
    {cl?.direccion&&<div className="flex items-center gap-2 pt-3 mt-3 border-t border-gray-100">
      <div className="w-[26px] h-[26px] rounded-lg bg-gray-50 text-gray-400 flex items-center justify-center flex-shrink-0"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 21s7-6.2 7-12a7 7 0 10-14 0c0 5.8 7 12 7 12Z"/><circle cx="12" cy="9" r="2.4"/></svg></div>
      <div className="text-[11px] text-gray-400">Dirección</div>
      <div className="ml-auto text-[12.5px] font-semibold text-gray-700 text-right">{cl.direccion}</div>
    </div>}
    <div className="flex gap-1.5 mt-3">
      {tel&&<a href={`https://wa.me/${tel.replace('+','')}`} target="_blank" className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl bg-gray-50 text-gray-500 hover:bg-gray-100 transition"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 00-8.6 15L2 22l5.2-1.4A10 10 0 1012 2Z"/></svg><span className="text-[9px] font-semibold">WhatsApp</span></a>}
      {tel&&<a href={`tel:${tel}`} className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl bg-gray-50 text-gray-500 hover:bg-gray-100 transition"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2Z"/></svg><span className="text-[9px] font-semibold">Llamar</span></a>}
      {cl?.email&&<a href={`mailto:${cl.email}`} className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl bg-gray-50 text-gray-500 hover:bg-gray-100 transition"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg><span className="text-[9px] font-semibold">Email</span></a>}
      {cl?.direccion&&<a href={`https://maps.google.com/?q=${encodeURIComponent(cl.direccion)}`} target="_blank" className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl bg-gray-50 text-gray-500 hover:bg-gray-100 transition"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 21s7-6.2 7-12a7 7 0 10-14 0c0 5.8 7 12 7 12Z"/><circle cx="12" cy="9" r="2.4"/></svg><span className="text-[9px] font-semibold">Mapa</span></a>}
    </div>
  </div>
</div>
<div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
  <div className="bg-[#E7EDF5] px-4 py-2.5 flex items-center gap-2">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1E3A5F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
    <span className="text-[10px] font-bold text-[#1E3A5F] uppercase tracking-widest flex-1">Siguiente paso</span>
  </div>
  <div className="p-4 space-y-2">
    {(()=>{
      const co2=data.colaboradores.find(c=>c.id===getColabId(t));
const waColab=(co2&&cl)?buildWA(co2,t,cl):null;
  const avanzar=async(nuevoEstado,msg)=>{const hist=[...getHistorial(t),{ts:now(),txt:msg||`Estado: ${nuevoEstado}`,tipo:"sistema"}];const saved=await dbSaveTrabajo({...t,estado:nuevoEstado,historial:hist});if(saved){setData(d=>({...d,trabajos:d.trabajos.map(x=>x.id===t.id?{...saved,clienteId:saved.cliente_id,colaboradorId:saved.colaborador_id}:x)}));toast(`✅ ${nuevoEstado}`);}};
      const Guia=({texto})=><div className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 mb-1">{texto}</div>;
      const Btn=({onClick,children,ghost=false})=>ghost?<button onClick={onClick} className="w-full bg-white border border-gray-200 text-gray-600 py-2.5 rounded-xl font-semibold text-sm transition hover:border-gray-400">{children}</button>:<button onClick={onClick} className="w-full bg-[#1E3A5F] text-white py-2.5 rounded-xl font-bold text-sm transition hover:bg-[#152d4a]">{children}</button>;

            const recomendacion={
        "Solicitud":getColabId(t)?"Ya tienes colaborador asignado. Avísale del trabajo.":"Asigna un colaborador para este trabajo.",
        "Presupuestando":"Esperando presupuesto del colaborador. Puedes reenviarle el aviso.",
        "Colaborador disponible":"Propón fecha de visita al cliente.",
        "Visita propuesta":"Esperando que el cliente confirme la fecha.",
        "Cliente confirmó":"Avisa al colaborador de la visita confirmada.",
        "Presupuesto recibido":"Genera el presupuesto de Domia para el cliente.",
        "Presupuesto enviado":"Esperando que el cliente acepte. Puedes reenviarle el enlace.",
        "Aceptado":"El cliente aceptó. Cobra el adelanto, avisa al colaborador e inicia el trabajo.",
        "En curso":"Trabajo en marcha. Márcalo completado cuando termine.",
        "Completado":"Trabajo terminado. Cobra el resto pendiente si lo hay.",
      }[t.estado]||"Gestiona este trabajo con las acciones de abajo.";
           return<>
        <Guia texto={recomendacion}/>
        {t.estado==="Solicitud"&&!getColabId(t)&&<Btn onClick={()=>setSelectorColab(true)}>👷 Asignar colaborador</Btn>}
{t.estado==="Solicitud"&&getColabId(t)&&co2&&cl&&<Btn onClick={async()=>{window.open(buildWA(co2,t,cl),"_blank");await avanzar("Presupuestando","Trabajo enviado al colaborador");}}>📱 Enviar trabajo al colaborador</Btn>}
             {t.estado==="Presupuestando"&&co2&&cl&&<Btn onClick={()=>window.open(buildWA(co2,t,cl),"_blank")}>📱 Reenviar WhatsApp a {co2.nombre.split(" ")[0]}</Btn>}
        {t.estado==="Colaborador disponible"&&t.ultima_novedad&&t.ultima_novedad.includes("Cliente propone")&&co2&&<Btn onClick={()=>window.open(buildWACambioFecha(co2,t,cl),"_blank")}>📱 Consultar cambio de fecha con {co2.nombre.split(" ")[0]}</Btn>}
             {t.estado==="Colaborador disponible"&&cl?.telefono&&<Btn onClick={async()=>{window.open(buildWAVisitaCliente(cl,t,co2),"_blank");await avanzar("Visita propuesta","Fecha propuesta al cliente por WhatsApp");}}>📱 Proponer fecha al cliente</Btn>}
             {t.estado==="Cliente confirmó"&&co2&&<Btn onClick={async()=>{window.open(buildWAConfirmacionColab(co2,t,cl),"_blank");await avanzar("En curso","Visita programada — colaborador avisado");}}>✅ Avisar colaborador — visita programada</Btn>}
        {t.estado==="Presupuesto recibido"&&<Btn onClick={()=>setModo("presupuesto")}>📄 Generar presupuesto Domia</Btn>}
        {t.estado==="Presupuesto enviado"&&pdfD&&tel&&<Btn onClick={()=>window.open(`https://wa.me/${tel.replace('+','')}?text=${encodeURIComponent(`Hola ${cl?.nombre?.split(" ")[0]||""} 😊\n\nTu presupuesto de *Domia Services* ya está listo.\n\n📄 Verlo y aceptarlo aquí:\nhttps://domia-crm-two.vercel.app/aceptar/${t.id}\n\nCualquier duda me dices. ¡Gracias!\n\n— Samuel · Domia Services · 685 917 059`)}`,"_blank")}>📱 Reenviar presupuesto al cliente</Btn>}
        {t.estado==="Presupuesto enviado"&&<Btn onClick={()=>avanzar("Aceptado","Cliente aceptó el presupuesto")}>🤝 Cliente aceptó</Btn>}
        {t.estado==="Aceptado"&&<Btn onClick={()=>avanzar("En curso","Trabajo iniciado")}>🔧 Marcar en curso</Btn>}
        {t.estado==="En curso"&&!t.trabajo_terminado&&<Btn onClick={async()=>{const hist=[...getHistorial(t),{ts:now(),txt:"🔧 Trabajo marcado como terminado — pendiente verificación del cliente",tipo:"sistema"}];const saved=await dbSaveTrabajo({...t,trabajo_terminado:true,verificacion_rechazo:null,historial:hist});if(saved){setData(d=>({...d,trabajos:d.trabajos.map(x=>x.id===t.id?{...saved,clienteId:saved.cliente_id,colaboradorId:saved.colaborador_id}:x)}));if(cl?.telefono)window.open(buildWAVerificarTrabajo(cl,t),"_blank");toast("✅ Marcado — pidiendo verificación al cliente");}}}>✅ Marcar trabajo terminado</Btn>}
        {t.estado==="En curso"&&t.trabajo_terminado&&!t.cliente_verificado&&!t.verificacion_rechazo&&cl?.telefono&&<Btn onClick={()=>window.open(buildWAVerificarTrabajo(cl,t),"_blank")}>📱 Pedir verificación al cliente</Btn>}
        {t.estado==="En curso"&&t.verificacion_rechazo&&<div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 mb-1"><strong>El cliente indica que falta algo:</strong><br/>{t.verificacion_rechazo}</div>}
        {t.estado==="En curso"&&t.verificacion_rechazo&&co2&&<Btn onClick={()=>window.open(buildWARechazoVerificacion(co2,t,cl,t.verificacion_rechazo),"_blank")}>🔁 Reenviar al colaborador con motivo</Btn>}
        {t.estado==="En curso"&&t.cliente_verificado&&cl?.telefono&&<Btn onClick={()=>window.open(buildWACobroFinal(cl,t),"_blank")}>💰 Reclamar cobro</Btn>}
             <button onClick={()=>setAccionesAbiertas(v=>!v)} className="w-full text-[11px] font-bold text-gray-400 uppercase tracking-widest py-1.5 flex items-center justify-center gap-1 hover:text-gray-600">{accionesAbiertas?"▲ Ocultar acciones":"▼ Todas las acciones"}</button>
        {accionesAbiertas&&<div className="space-y-2">
          {getColabId(t)?<Btn onClick={()=>setSelectorColab(true)} ghost>👷 Cambiar colaborador</Btn>:<Btn onClick={()=>setSelectorColab(true)} ghost>👷 Asignar colaborador</Btn>}
          {co2&&cl&&<Btn onClick={async()=>{window.open(buildWA(co2,t,cl),"_blank");if(t.estado==="Solicitud")await avanzar("Presupuestando","Trabajo enviado al colaborador");}} ghost>📱 Enviar trabajo al colaborador</Btn>}
          {cl&&<Btn onClick={async()=>{window.open(buildWAVisitaCliente(cl,t,co2),"_blank");await avanzar("Visita propuesta","Visita propuesta al cliente");}} ghost>📱 Proponer visita al cliente</Btn>}
          {co2&&cl&&<Btn onClick={async()=>{window.open(buildWAConfirmacionColab(co2,t,cl),"_blank");await avanzar("En curso","Visita confirmada — colaborador avisado");}} ghost>📱 Avisar al colaborador (visita confirmada)</Btn>}
          <Btn onClick={()=>setModo("presupuesto")} ghost>📄 Generar / editar presupuesto</Btn>
          {pdfD&&tel&&<Btn onClick={()=>window.open(`https://wa.me/${tel.replace('+','')}?text=${encodeURIComponent(`Hola ${cl?.nombre?.split(" ")[0]||""} 😊\n\nTu presupuesto de *Domia Services* ya está listo.\n\n📄 Verlo y aceptarlo aquí:\nhttps://domia-crm-two.vercel.app/aceptar/${t.id}\n\nCualquier duda me dices. ¡Gracias!\n\n— Samuel · Domia Services · 685 917 059`)}`,"_blank")} ghost>📱 Enviar presupuesto al cliente</Btn>}
          {setSec&&<Btn onClick={()=>{setFocoFinanzas&&setFocoFinanzas(t.id);onClose();setSec("finanzas");}} ghost>💶 Ver este trabajo en Finanzas</Btn>}
                    <div className="pt-2 border-t border-gray-100">
            <div className="text-[10px] text-gray-400 font-bold uppercase mb-1.5">Cambiar estado</div>
            <select value={t.estado} onChange={e=>avanzar(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm">
              {["Solicitud","Presupuestando","Colaborador disponible","Visita propuesta","Cliente confirmó","Presupuesto recibido","Presupuesto enviado","Aceptado","En curso","Completado"].map(e=><option key={e}>{e}</option>)}
            </select>
          </div>
          <button onClick={()=>setModalRechazo(true)} className="w-full bg-red-50 border border-red-200 text-red-600 py-2.5 rounded-xl font-bold text-sm hover:bg-red-100 transition mt-2">❌ Rechazado</button>
          {t.archivado?<button onClick={async()=>{const saved=await dbSaveTrabajo({...t,archivado:false});setData(d=>({...d,trabajos:d.trabajos.map(x=>x.id===t.id?{...x,archivado:false}:x)}));onClose();toast("📤 Trabajo desarchivado");}} className="w-full bg-blue-50 border border-blue-200 text-blue-600 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-100 transition mt-2">📤 Desarchivar trabajo</button>:<button onClick={async()=>{const saved=await dbSaveTrabajo({...t,archivado:true});setData(d=>({...d,trabajos:d.trabajos.map(x=>x.id===t.id?{...x,archivado:true}:x)}));onClose();toast("📦 Trabajo archivado");}} className="w-full bg-gray-50 border border-gray-200 text-gray-600 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-100 transition mt-2">📦 Archivar trabajo</button>}
                   <button onClick={async()=>{if(!confirm("¿Eliminar este trabajo? Esta acción no se puede deshacer."))return;await dbDeleteTrabajo(t.id);setData(d=>({...d,trabajos:d.trabajos.filter(x=>x.id!==t.id)}));onClose();toast("Trabajo eliminado");}} className="w-full bg-red-50 border border-red-200 text-red-500 py-2.5 rounded-xl font-bold text-sm hover:bg-red-100 transition mt-2">🗑 Eliminar trabajo</button>
        </div>}
      </>;
    })()}
  </div>
  {modalRechazo&&<Modal title="Rechazar trabajo" onClose={()=>setModalRechazo(false)}>
    <div className="space-y-3">
      <div className="text-sm text-gray-600">Indica el motivo del rechazo. El trabajo se marcará como cancelado y se archivará.</div>
      <textarea value={motivoRechazo} onChange={e=>setMotivoRechazo(e.target.value)} rows={3} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] resize-none" placeholder="Ej: precio demasiado alto, cliente eligió otra empresa, ya no lo necesita..."/>
      <button onClick={async()=>{const hist=[...getHistorial(t),{ts:now(),txt:`❌ Rechazado${motivoRechazo?': '+motivoRechazo:''}`,tipo:"sistema"}];const saved=await dbSaveTrabajo({...t,estado:"Cancelado",archivado:true,historial:hist});if(saved){setData(d=>({...d,trabajos:d.trabajos.map(x=>x.id===t.id?{...saved,clienteId:saved.cliente_id,colaboradorId:saved.colaborador_id}:x)}));}setModalRechazo(false);onClose();toast("❌ Trabajo rechazado y archivado");}} disabled={!motivoRechazo.trim()} className="w-full bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl font-bold text-sm transition disabled:opacity-50">Rechazar y archivar</button>
    </div>
  </Modal>}
</div>
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
  <div className="p-4">
    <div className="flex items-center gap-3 mb-3">
      <div className="w-10 h-10 rounded-xl bg-[#EAF0F7] text-[#1E3A5F] flex items-center justify-center flex-shrink-0"><IconoTipoPipeline tipo={t.tipo}/></div>
      <div className="font-bold text-gray-800 text-[15px]">{t.tipo}</div>
    </div>
    <div className="flex flex-col items-start gap-2 pt-3 border-t border-gray-100">
    <div className="flex items-center gap-2">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0"><circle cx="12" cy="12" r="9"/><polyline points="8.5 12.5 11 15 15.5 9.5"/></svg>
      <span className="w-[84px] flex-shrink-0 text-[10px] font-bold uppercase tracking-wide text-gray-400">Estado</span>
      <div className="relative bg-amber-50 border border-amber-100 rounded-lg" style={{width:`calc(${(t.estado.length*1.05).toFixed(1)}ch + 46px)`}}>
        <span className={`absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full pointer-events-none ${ESTADO_DOT_PIPELINE[t.estado]||"bg-gray-300"}`}/>
        <select value={t.estado} disabled={guardando} onChange={async(e)=>{setGuardando(true);const saved=await dbSaveTrabajo({...t,estado:e.target.value});if(saved){setData(d=>({...d,trabajos:d.trabajos.map(x=>x.id===t.id?{...saved,clienteId:saved.cliente_id,colaboradorId:saved.colaborador_id}:x)}));toast("Estado actualizado");}setGuardando(false);}} className="w-full appearance-none bg-transparent text-[12.5px] font-semibold text-gray-800 pl-4 pr-6 py-0.5 cursor-pointer rounded-md hover:bg-amber-100/70 focus:outline-none focus:ring-1 focus:ring-[#1E3A5F] transition disabled:opacity-50">
          {(t.estado==="Cancelado"?["Cancelado"]:[]).concat(["Solicitud","Presupuestando","Colaborador disponible","Visita propuesta","Cliente confirmó","Presupuesto recibido","Presupuesto enviado","Aceptado","En curso","Completado"]).map(e=><option key={e} value={e}>{e}</option>)}
        </select>
        <svg className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none text-amber-600" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" className="flex-shrink-0"><rect x="3" y="5" width="18" height="16" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="3" x2="8" y2="7"/><line x1="16" y1="3" x2="16" y2="7"/></svg>
      <span className="w-[84px] flex-shrink-0 text-[10px] font-bold uppercase tracking-wide text-gray-400">Fecha</span>
      <div className="inline-flex items-center bg-amber-50 border border-amber-100 rounded-lg px-1 py-0.5">
      <input type="date" defaultValue={t.fecha} onBlur={async e=>{if(e.target.value===t.fecha)return;const hist=[...getHistorial(t),{ts:now(),txt:`Fecha actualizada: ${e.target.value}`,tipo:"sistema"}];const saved=await dbSaveTrabajo({...t,fecha:e.target.value,historial:hist});if(saved){setData(d=>({...d,trabajos:d.trabajos.map(x=>x.id===t.id?{...saved,clienteId:saved.cliente_id,colaboradorId:saved.colaborador_id}:x)}));toast("Fecha actualizada");}}} className="border-0 bg-transparent text-[12.5px] font-semibold text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#1E3A5F] rounded-md px-1"/>
      <input type="time" defaultValue={t.hora} onBlur={async e=>{if(e.target.value===t.hora)return;const hist=[...getHistorial(t),{ts:now(),txt:`Hora actualizada: ${e.target.value}`,tipo:"sistema"}];const saved=await dbSaveTrabajo({...t,hora:e.target.value,historial:hist});if(saved){setData(d=>({...d,trabajos:d.trabajos.map(x=>x.id===t.id?{...saved,clienteId:saved.cliente_id,colaboradorId:saved.colaborador_id}:x)}));toast("Hora actualizada");}}} className="border-0 bg-transparent text-[12.5px] font-semibold text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#1E3A5F] rounded-md px-1"/>
      </div>
    </div>
    <div className="flex items-center gap-2 cursor-pointer" onClick={()=>setSelectorColab(true)}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" className="flex-shrink-0"><circle cx="9" cy="8" r="3"/><path d="M3.5 20c0-3.6 2.6-6.2 6-6.2 2.9 0 5.2 1.9 5.8 4.5"/></svg>
      <span className="w-[84px] flex-shrink-0 text-[10px] font-bold uppercase tracking-wide text-gray-400">Colaborador</span>
      <span className="inline-flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100/70 border border-amber-100 rounded-lg pl-2 pr-1.5 py-1 transition">
        <span className="text-[12.5px] font-semibold text-gray-800">{co?.nombre||"Sin asignar"}</span>
        <svg className="text-amber-600 flex-shrink-0" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
      </span>
    </div>
    </div>
  </div>
  <div className="flex gap-1 border-t border-gray-200">
{[["resumen","Resumen"],["presupuesto","Presupuesto"],["archivos","Archivos"],["notas","Notas"],["historial","Historial"]].map(([k,label])=>(
    <button key={k} onClick={()=>setTab(k)} className={`px-3 py-2 text-sm font-semibold transition border-b-2 -mb-px ${tab===k?"border-[#1E3A5F] text-[#1E3A5F]":"border-transparent text-gray-400 hover:text-gray-600"}`}>{label}</button>
        ))}
      </div>

      {tab==="resumen"&&<div className="space-y-3">
       <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <div className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-2">Descripción del cliente</div>
          <div className="text-sm text-gray-700 leading-relaxed">{t.descripcion}</div>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <div className="text-[10px] text-blue-500 uppercase font-bold tracking-widest mb-2">📋 Instrucciones para el colaborador</div>
          <textarea defaultValue={t.instrucciones_colaborador||""} onBlur={async e=>{const v=e.target.value;await supabase.from('trabajos').update({instrucciones_colaborador:v}).eq('id',t.id);setData(d=>({...d,trabajos:d.trabajos.map(x=>x.id===t.id?{...x,instrucciones_colaborador:v}:x)}));toast("Instrucciones guardadas");}} rows={2} className="w-full border border-blue-200 rounded-xl px-3 py-2 text-sm bg-blue-50/40 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none" placeholder="Ej: El cliente pone su material. (Esto lo verá el colaborador)"/>
        </div>
{disp&&<div className="bg-teal-50 border border-teal-100 rounded-2xl p-4"><div className="text-[10px] text-teal-600 uppercase font-bold mb-1">📅 Disponibilidad colaborador</div><div className="text-sm text-teal-800">{disp}</div>{notaColab&&getPresupColab(t)<=0&&<div className="text-sm text-teal-800 mt-2 pt-2 border-t border-teal-200">📝 {notaColab}</div>}</div>}
        {getPresupColab(t)>0&&<div className="bg-purple-50 border border-purple-200 rounded-2xl p-4"><div className="text-[10px] text-purple-700 uppercase font-bold mb-1">💶 Precio propuesto por el colaborador</div><div className="text-2xl font-black text-purple-700">{getPresupColab(t)}€</div>{notaColab&&<div className="text-sm text-purple-800 mt-2 pt-2 border-t border-purple-200">📝 {notaColab}</div>}{pres&&<a href={pres} target="_blank" className="text-xs text-purple-600 font-semibold hover:underline mt-1 inline-block">📄 Ver presupuesto del colaborador →</a>}</div>}
               {t.ultima_novedad&&t.ultima_novedad.includes("Cliente propone")&&!t.atendido&&<div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-4"><div className="text-[10px] text-orange-700 uppercase font-bold mb-1">🔄 El cliente ha propuesto otra fecha</div><div className="text-lg font-black text-orange-700">{fmt(t.fecha)} · {t.hora}</div><div className="text-xs text-orange-600 mt-1">Consulta con el colaborador si le viene bien.</div></div>}
        {comentCli&&<div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-4"><div className="text-[10px] text-yellow-700 uppercase font-bold mb-1">💬 Nota del cliente</div><div className="text-sm text-gray-700">{comentCli}</div></div>}
      </div>}

     {tab==="presupuesto"&&<div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        {pdfD?<div className="space-y-3">
         <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
           <a href={pdfD} target="_blank" className="flex-1 text-sm text-emerald-700 font-semibold hover:underline">📄 Ver presupuesto Domia →</a>
            <button onClick={()=>setModo("presupuesto")} className="text-xs bg-emerald-100 text-emerald-700 font-bold px-2.5 py-1 rounded-lg hover:bg-emerald-200 transition">✏️ Editar</button>
          </div>
          {(()=>{const historicos=partes.filter(p=>p.startsWith('pdfhist:')).map(p=>p.replace('pdfhist:',''));return historicos.length>0?<div className="border-t border-gray-100 pt-3 mt-3">
            <div className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-2">Versiones anteriores</div>
            <div className="space-y-1.5">{historicos.slice().reverse().map((url,i)=><a key={i} href={url} target="_blank" className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition">📄 Versión {historicos.length-i} →</a>)}</div>
          </div>:null;})()}
        </div>
           :<div className="text-center py-6 text-sm text-gray-400">Sin presupuesto generado aún<br/><button onClick={()=>setModo("presupuesto")} className="mt-2 text-purple-600 font-bold text-sm">📄 Generar presupuesto</button></div>}
      </div>}
      {tab==="archivos"&&<div className="space-y-3">
        {foto&&<div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm"><div className="text-[10px] text-gray-400 uppercase font-bold mb-2">📷 Foto del cliente</div><img src={foto} className="w-full rounded-xl max-h-56 object-cover cursor-pointer" onClick={()=>window.open(foto,"_blank")}/></div>}
        {pres&&<a href={pres} target="_blank" className="block bg-white border border-gray-100 rounded-2xl p-4 shadow-sm text-sm text-purple-700 font-semibold hover:underline">📄 Presupuesto del colaborador →</a>}
        {justificante&&<a href={justificante} target="_blank" className="block bg-emerald-50 border border-emerald-200 rounded-2xl p-4 shadow-sm text-sm text-emerald-700 font-semibold hover:underline">🧾 Justificante de pago del cliente →</a>}
        {!foto&&!pres&&!pdfD&&<div className="text-center py-6 text-sm text-gray-400">Sin archivos</div>}
        <label className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-gray-200 rounded-2xl py-4 cursor-pointer hover:border-[#1E3A5F] hover:bg-blue-50 transition">
          <span className="text-2xl">📷</span>
          <span className="text-sm text-gray-500 font-semibold">Añadir foto</span>
          <input type="file" accept="image/*" className="hidden" onChange={async e=>{
            const archivo=e.target.files?.[0];
            if(!archivo)return;
            const ext=archivo.name.split('.').pop();
            const nombre=`foto_${t.id}_${Date.now()}.${ext}`;
            const{data:up}=await supabase.storage.from('fotos-demandas').upload(nombre,archivo,{upsert:true});
            if(up){
              const{data:pub}=supabase.storage.from('fotos-demandas').getPublicUrl(nombre);
              const notasActuales=getNotas(t).split('|').filter(n=>!n.trim().startsWith('foto:')).map(n=>n.trim()).join(' | ');
              const saved=await dbSaveTrabajo({...t,notas:(notasActuales?notasActuales+' | ':'')+`foto:${pub.publicUrl}`});
              if(saved){setData(d=>({...d,trabajos:d.trabajos.map(x=>x.id===t.id?{...saved,clienteId:saved.cliente_id,colaboradorId:saved.colaborador_id}:x)}));toast("Foto añadida");}
            }
          }}/>
        </label>
      </div>}
{tab==="notas"&&<div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm">🔒</span>
          <span className="text-[10px] text-amber-700 uppercase font-bold tracking-widest">Notas internas · solo visible para ti</span>
        </div>
        <textarea defaultValue={t.notas_internas||""} onBlur={async e=>{const v=e.target.value;await supabase.from('trabajos').update({notas_internas:v}).eq('id',t.id);setData(d=>({...d,trabajos:d.trabajos.map(x=>x.id===t.id?{...x,notas_internas:v}:x)}));toast("Nota guardada");}} rows={6} className="w-full border border-amber-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none" placeholder="Escribe aquí notas privadas sobre este trabajo. Solo las veis tú y tu equipo, nunca el cliente ni el colaborador."/>
      </div>}
      {tab==="historial"&&<div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <div className="space-y-2 max-h-80 overflow-y-auto">
{(Array.isArray(getHistorial(t))?getHistorial(t):[]).slice().reverse().map((h,i)=><div key={i} className="flex gap-2 text-xs">
          <span className="text-gray-300">•</span>
            <div><div className="text-gray-700">{h.txt}</div><div className="text-gray-400">{h.ts}</div></div>
          </div>)}
          {getHistorial(t).length===0&&<div className="text-center py-4 text-sm text-gray-400">Sin historial</div>}
        </div>
      </div>}
    </div>

   <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
  <div className="bg-gray-50 border-b border-gray-100 px-4 py-2 flex items-center gap-2">
    <span className="text-xs">💶</span>
    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Económico</span>
  </div>
 <div className="p-4 space-y-3">
 {!pdfD&&<div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-center flex-1">
          <div className="text-xl font-black text-emerald-600">{precio>0?`${precio}€`:"—"}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">Cliente</div>
        </div>
        <div className="text-gray-300 text-lg font-bold px-1">−</div>
              <div className="text-center flex-1">
          <input type="number" defaultValue={colab>0?colab:""} placeholder="—" onBlur={async e=>{const v=+e.target.value||null;if(v===colab)return;const saved=await dbSaveTrabajo({...t,presupuestoColaborador:v});if(saved){setData(d=>({...d,trabajos:d.trabajos.map(x=>x.id===t.id?{...saved,clienteId:saved.cliente_id,colaboradorId:saved.colaborador_id}:x)}));toast("Precio colaborador actualizado");}}} className="w-full text-xl font-black text-red-500 text-center bg-transparent border-b border-dashed border-red-200 focus:outline-none focus:border-red-500"/>
          <div className="text-[10px] text-gray-400 mt-0.5">Colaborador ✏️</div>
        </div>
        <div className="text-gray-300 text-lg font-bold px-1">=</div>
        <div className="text-center flex-1">
          <div className="text-xl font-black text-blue-600">{precio>0&&colab>0?`${margen}€`:"—"}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">Margen</div>
        </div>
      </div>
      <div className="text-center py-1">
        <button onClick={()=>setModo("presupuesto")} className="text-purple-600 font-bold text-sm">📄 Generar presupuesto Domia</button>
      </div>
    </div>}
    {pdfD&&<>
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-gray-50 rounded-xl p-2 text-center">
          <div className="text-[10px] text-gray-400 font-bold uppercase mb-1">Colaborador</div>
          <div className="text-sm font-black text-red-500">{colab>0?`${colab}€`:"—"}</div>
        </div>
        <div className="bg-gray-50 rounded-xl p-2 text-center">
          <div className="text-[10px] text-gray-400 font-bold uppercase mb-1">Cliente</div>
          <div className="text-sm font-black text-emerald-600">{precio>0?`${precio}€`:"—"}</div>
        </div>
        <div className="bg-gray-50 rounded-xl p-2 text-center">
          <div className="text-[10px] text-gray-400 font-bold uppercase mb-1">Margen</div>
          <div className="text-sm font-black text-blue-600">{precio>0&&colab>0?`${margen}€`:"—"}</div>
        </div>
      </div>
     {(()=>{
        const totalCobrado=cobrosTrabajo.reduce((s,c)=>s+(+c.importe||0),0);
        const tramos=totalIva>5000?[{lbl:"Adelanto (40%)",imp:Math.round(totalIva*0.4)},{lbl:"2º pago (40%)",imp:Math.round(totalIva*0.4)},{lbl:"Final (20%)",imp:Math.round(totalIva*0.2)}]:[{lbl:"Adelanto (50%)",imp:Math.round(totalIva*0.5)},{lbl:"Final (50%)",imp:Math.round(totalIva*0.5)}];
        let acumulado=0;
        return<div className="pt-2 border-t border-gray-100 space-y-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-gray-400 uppercase font-bold">Cobros del cliente</span>
            <span className="text-[10px] text-gray-500 font-bold">{totalCobrado}€ / {totalIva}€</span>
          </div>
          {tramos.map((tr,i)=>{
            acumulado+=tr.imp;
            const pagado=totalCobrado>=acumulado-1;
            return<div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
              <div>
                <div className="text-xs text-gray-500">{tr.lbl}</div>
                <div className="text-sm font-black text-gray-800">{tr.imp}€</div>
              </div>
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${pagado?"bg-emerald-100 text-emerald-700":"bg-amber-100 text-amber-700"}`}>{pagado?"✅ Cobrado":"⏳ Pendiente"}</span>
            </div>;
          })}
        </div>;
      })()}
      <div className="flex items-center justify-between pt-1">
        <span className="text-[10px] text-gray-400 uppercase font-bold">Forma de pago</span>
        <div className="flex items-center gap-1">
          <input type="number" defaultValue={t.adelanto_valor||30} onBlur={async e=>{const v=+e.target.value||0;await supabase.from('trabajos').update({adelanto_valor:v}).eq('id',t.id);setData(d=>({...d,trabajos:d.trabajos.map(x=>x.id===t.id?{...x,adelanto_valor:v}:x)}));toast("Adelanto actualizado");}} className="w-14 border border-gray-200 rounded-lg px-2 py-1 text-sm text-right"/>
          <button onClick={async()=>{const nuevo=t.adelanto_tipo==='fijo'?'porcentaje':'fijo';await supabase.from('trabajos').update({adelanto_tipo:nuevo}).eq('id',t.id);setData(d=>({...d,trabajos:d.trabajos.map(x=>x.id===t.id?{...x,adelanto_tipo:nuevo}:x)}));toast(`Adelanto en ${nuevo==='fijo'?'€ fijo':'%'}`);}} className="text-xs bg-gray-100 px-2 py-1 rounded-lg font-bold">{t.adelanto_tipo==='fijo'?'€':'%'}</button>
        </div>
      </div>
      <button onClick={()=>setModo("presupuesto")} className="w-full border border-purple-200 bg-purple-50 text-purple-700 py-2 rounded-xl font-bold text-sm hover:bg-purple-100 transition mt-1">✏️ Editar presupuesto</button>
    </>}
  </div>
</div>
  </div>;
}
function TrabajoModal({tid,data,setData,onClose,toast,setSec,setFocoFinanzas}){
const t=data.trabajos.find(x=>x.id===tid||x.id===+tid);
const[modo,setModo]=useState<"ver"|"editar"|"presupuesto">(window.__abrirPresupuesto?"presupuesto":"ver");
  useEffect(()=>{if(window.__abrirPresupuesto)window.__abrirPresupuesto=false;},[]);  if(!t)return null;
  const cl=data.clientes.find(c=>c.id===getClienteId(t));
  const co=data.colaboradores.find(c=>c.id===getColabId(t));
  const historial=getHistorial(t);
  const notas=getNotas(t);
  const fotoUrl=notas.startsWith('foto:')?notas.replace('foto:',''):null;
  const iconH=tipo=>({entrada:"🟢",wa:"💬",presupuesto:"💶",cliente:"📤",ok:"✅",sistema:"·"}[tipo]||"·");
return<Modal title={`${t.tipo} #${t.id}`} onClose={onClose} wide={modo!=="ver"} xwide={modo==="ver"}>{modo==="ver"?(
<FichaTrabajo t={t} cl={cl} co={co} data={data} setData={setData} onClose={onClose} toast={toast} setModo={setModo} setSec={setSec} setFocoFinanzas={setFocoFinanzas}/>
):false?(    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5"><Badge text={t.estado}/><OrigenTag id={t.origen}/><span className={`text-xs font-bold ${PRIO_CFG[t.prioridad]?.text}`}>{PRIO_CFG[t.prioridad]?.icon} {t.prioridad}</span></div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div><div className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Cliente</div><div className="font-semibold">{cl?.nombre}</div><div className="text-xs text-gray-400">{cl?.telefono}</div></div>
        <div><div className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Colaborador</div><div className="font-semibold">{co?.nombre||"Sin asignar"}</div><div className="text-xs text-gray-400">{co?.telefono||co?.whatsapp}</div></div>
        <div><div className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Fecha / Hora</div><div>{fmt(t.fecha)} · {t.hora}</div></div>
      </div>
      <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-700">{t.descripcion}</div>
      {fotoUrl&&<div className="bg-gray-50 border border-gray-100 rounded-xl p-3"><div className="text-[10px] font-bold text-gray-400 uppercase mb-2">📎 Archivos adjuntos</div><img src={fotoUrl} alt="Foto del problema" className="w-full rounded-xl object-cover max-h-64 cursor-pointer" onClick={()=>window.open(fotoUrl,"_blank")}/><div className="text-xs text-gray-400 mt-1 text-center">Toca para ver en tamaño completo</div></div>}
{notas&&(()=>{
  const partes=notas.split('|').map(n=>n.trim());
  const foto=partes.find(p=>p.startsWith('foto:'))?.replace('foto:','');
  const pres=partes.find(p=>p.startsWith('presup:'))?.replace('presup:','');
  const pdfD=partes.find(p=>p.startsWith('pdfdomia:'))?.replace('pdfdomia:','');
  const disp=partes.find(p=>p.startsWith('disponibilidad:'))?.replace('disponibilidad:','').trim();
  const notaColab=partes.find(p=>p.startsWith('nota-colab:'))?.replace('nota-colab:','').trim();
  const comentCli=partes.find(p=>p.startsWith('cliente:'))?.replace('cliente:','').trim();
  return<div className="space-y-2">
    {pres&&<a href={pres} target="_blank" className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-xl p-3 text-sm text-purple-700 font-semibold hover:bg-purple-100 transition">📄 Ver presupuesto del colaborador →</a>}
    {pdfD&&<a href={pdfD} target="_blank" className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm text-emerald-700 font-semibold hover:bg-emerald-100 transition">📄 Ver presupuesto Domia →</a>}
    {disp&&<div className="bg-teal-50 border border-teal-100 rounded-xl p-3 text-sm text-teal-700">📅 Disponibilidad: {disp}</div>}
    {comentCli&&<div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3 text-sm text-gray-700">💬 Cliente: {comentCli}</div>}
    {notaColab&&<div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm text-gray-600">🔧 Colaborador: {notaColab}</div>}
  </div>;
})()}
      <div className="bg-gray-900 rounded-xl p-4 text-white">
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
<button onClick={()=>setModo("presupuesto")} className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-xl font-bold text-sm transition">📄 Generar presupuesto Domia</button>{!["Completado","Cancelado"].includes(t.estado)&&<label className="w-full cursor-pointer">
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
              const saved=await dbSaveTrabajo({...t,estado:"Presupuesto recibido",notas:(getNotas(t)?getNotas(t)+' | ':'')+'presup:'+pub.publicUrl,historial:hist});
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
function DisponibilidadSelector({onConfirmar}:{onConfirmar:(dia:string,hora:string,importe:string,archivo:File|null,nota:string)=>void}){
  const[dia,setDia]=useState("");
  const[hora,setHora]=useState("09:00");
  const[importe,setImporte]=useState("");
  const[archivo,setArchivo]=useState<File|null>(null);
  const[nota,setNota]=useState("");
  return<div className="space-y-3">
    <div className="flex gap-2">
      <input type="date" value={dia} onChange={e=>setDia(e.target.value)} className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"/>
      <input type="time" value={hora} onChange={e=>setHora(e.target.value)} className="w-28 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"/>
    </div>
    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 space-y-2">
      <div className="text-[10px] text-blue-700 font-bold uppercase">¿Trabajo sencillo? Puedes presupuestar ya (opcional)</div>
      <input type="number" value={importe} onChange={e=>setImporte(e.target.value)} placeholder="Importe €" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"/>
            <input type="file" accept="image/*,application/pdf" onChange={e=>setArchivo(e.target.files?.[0]||null)} className="w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-2 file:rounded-lg file:border-0 file:bg-[#1E3A5F] file:text-white file:text-xs file:font-bold"/>
    </div>
    <textarea value={nota} onChange={e=>setNota(e.target.value)} rows={2} placeholder="¿Quieres añadir alguna nota? (opcional) Ej: a falta de medir la pared" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] resize-none"/>
<button onClick={()=>{if(dia||importe)onConfirmar(dia,hora,importe,archivo,nota);}} disabled={!dia&&!importe} className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-bold text-sm transition disabled:opacity-50">✅ Enviar respuesta</button>
  </div>;
}
function DisponibilidadIncidencia({onConfirmar}:{onConfirmar:(dia:string,hora:string,importe:string,archivo:File|null,nota:string)=>void}){
  const[dia,setDia]=useState("");
  const[hora,setHora]=useState("09:00");
  const[nota,setNota]=useState("");
  return<div className="space-y-3">
    <div className="flex gap-2">
      <input type="date" value={dia} onChange={e=>setDia(e.target.value)} className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"/>
      <input type="time" value={hora} onChange={e=>setHora(e.target.value)} className="w-28 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"/>
    </div>
    <textarea value={nota} onChange={e=>setNota(e.target.value)} rows={2} placeholder="¿Alguna nota? (opcional)" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] resize-none"/>
    <button onClick={()=>{if(dia)onConfirmar(dia,hora,"",null,nota);}} disabled={!dia} className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-bold text-sm transition disabled:opacity-50">✅ Enviar disponibilidad</button>
  </div>;
}
function LoginScreen({onLogin}:{onLogin:()=>void}){
  const[email,setEmail]=useState("");
  const[pass,setPass]=useState("");
  const[error,setError]=useState("");
  const[cargando,setCargando]=useState(false);
  const entrar=async()=>{
    setCargando(true);setError("");
    const{error:err}=await supabase.auth.signInWithPassword({email,password:pass});
    if(err){setError("Email o contraseña incorrectos");setCargando(false);return;}
    onLogin();
  };
  return<div className="min-h-screen flex items-center justify-center bg-[#F0F2F5] p-4" style={{fontFamily:"'Inter',system-ui,sans-serif"}}>
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-sm">
      <div className="text-center mb-6">
        <img src="/logo-domia.png" alt="Domia" className="w-24 mx-auto mb-3"/>
        <div className="font-black text-gray-800 text-lg">Domia CRM</div>
        <div className="text-xs text-gray-400 mt-1">Acceso privado</div>
      </div>
      <div className="space-y-3">
        <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"/>
        <input type="password" placeholder="Contraseña" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&entrar()} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"/>
        {error&&<div className="text-red-500 text-xs text-center">{error}</div>}
        <button onClick={entrar} disabled={cargando} className="w-full bg-[#1E3A5F] hover:bg-[#152d4a] text-white py-3 rounded-xl font-bold text-sm transition disabled:opacity-50">{cargando?"Entrando...":"Entrar"}</button>
      </div>
    </div>
  </div>;
}
function PortalColaboradorApp(){
  const[sesion,setSesion]=useState(null);
  const[cargando,setCargando]=useState(true);
  const[email,setEmail]=useState("");
  const[pass,setPass]=useState("");
  const[error,setError]=useState("");
  const[colab,setColab]=useState(null);
  const[trabajos,setTrabajos]=useState([]);
const[pagos,setPagos]=useState([]);
  const[incidencias,setIncidencias]=useState([]);
  const[tab,setTab]=useState("trabajos");

 const[modoPass,setModoPass]=useState(false);
  useEffect(()=>{
    const hash=window.location.hash;
    if(hash.includes("type=invite")||hash.includes("type=recovery")){
      setModoPass(true);
    }
    supabase.auth.getSession().then(({data})=>{setSesion(data.session);setCargando(false);});
    const{data:sub}=supabase.auth.onAuthStateChange((_e,s)=>setSesion(s));
    return()=>sub.subscription.unsubscribe();
  },[]);

  useEffect(()=>{
    if(!sesion?.user?.email)return;
    (async()=>{
      const{data:col}=await supabase.from('colaboradores').select('*').eq('email',sesion.user.email).single();
      setColab(col);
      if(col){
        const{data:tr}=await supabase.from('trabajos').select('*').eq('colaborador_id',col.id).order('id',{ascending:false});
        setTrabajos(tr||[]);
               const{data:pg}=await supabase.from('pagos_colaborador').select('*').eq('colaborador_id',col.id).order('fecha',{ascending:false});
        setPagos(pg||[]);
        const{data:inc}=await supabase.from('incidencias').select('*').eq('colaborador_id',col.id).order('id',{ascending:false});
        setIncidencias(inc||[]);
      }
    })();
  },[sesion]);

  const entrar=async()=>{
    setError("");
    const{error:err}=await supabase.auth.signInWithPassword({email,password:pass});
    if(err)setError("Email o contraseña incorrectos");
  };
  const salir=async()=>{await supabase.auth.signOut();setColab(null);setTrabajos([]);};

  if(cargando)return<div className="min-h-screen flex items-center justify-center bg-[#F0F2F5]"><div className="text-4xl">⚙️</div></div>;
if(modoPass&&sesion)return<CrearPassword onListo={()=>{setModoPass(false);window.location.hash="";}}/>;
  if(!sesion)return<div className="min-h-screen flex items-center justify-center bg-[#F0F2F5] p-4" style={{fontFamily:"'Inter',system-ui,sans-serif"}}>
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-sm">
      <div className="text-center mb-6">
        <img src="/logo-domia.png" alt="Domia" className="w-24 mx-auto mb-3"/>
        <div className="font-black text-gray-800 text-lg">Portal Colaborador</div>
        <div className="text-xs text-gray-400 mt-1">Accede con tu cuenta</div>
      </div>
      <div className="space-y-3">
        <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"/>
        <input type="password" placeholder="Contraseña" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&entrar()} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"/>
        {error&&<div className="text-red-500 text-xs text-center">{error}</div>}
        <button onClick={entrar} className="w-full bg-[#1E3A5F] hover:bg-[#152d4a] text-white py-3 rounded-xl font-bold text-sm transition">Entrar</button>
        <button onClick={async()=>{
          if(!email){setError("Escribe tu email primero");return;}
          const{error:err}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:"https://domia-crm-two.vercel.app/portal"});
          if(err)setError(err.message);else setError("📧 Te hemos enviado un email para restablecer tu contraseña");
        }} className="w-full text-xs text-gray-400 hover:text-gray-600 mt-1">¿Olvidaste tu contraseña?</button>
      </div>
    </div>
  </div>;

  if(!colab)return<div className="min-h-screen flex items-center justify-center bg-[#F0F2F5] p-4 text-center">
    <div>
      <div className="text-4xl mb-3">🔍</div>
      <div className="font-bold text-gray-700 mb-1">Cuenta sin vincular</div>
      <div className="text-sm text-gray-400 mb-4">Tu email no está asociado a ningún colaborador.</div>
      <button onClick={salir} className="text-xs text-gray-500 underline">Cerrar sesión</button>
    </div>
  </div>;

  const pendientes=trabajos.filter(t=>["Presupuestando","Colaborador disponible","Visita propuesta","Cliente confirmó","Aceptado","En curso"].includes(t.estado));
  const realizados=trabajos.filter(t=>t.estado==="Completado");
  const totalCobrado=realizados.reduce((s,t)=>s+(t.presupuesto_colaborador||0),0);

  return<div className="min-h-screen bg-[#F0F2F5]" style={{fontFamily:"'Inter',system-ui,sans-serif"}}>
    <div className="bg-[#1E3A5F] px-5 py-5 text-white flex items-center justify-between">
      <div>
        <div className="text-[10px] text-blue-300 font-bold uppercase tracking-widest">Portal Colaborador</div>
        <div className="text-lg font-black">Hola, {colab.nombre.split(" ")[0]} 👋</div>
      </div>
      <button onClick={salir} className="text-xs text-blue-200 border border-blue-400 rounded-lg px-3 py-1.5">Salir</button>
    </div>

    <div className="flex gap-1 px-4 pt-4 max-w-lg mx-auto">
      {[["trabajos","Trabajos"],["cobros","Cobros"],["incidencias","Incidencias"],["calc","Calculadora"]].map(([k,label])=>(
      <button key={k} onClick={()=>setTab(k)} className={`flex-1 py-2 rounded-xl text-sm font-bold transition ${tab===k?"bg-[#1E3A5F] text-white":"bg-white text-gray-500 border border-gray-200"}`}>{label}</button>
      ))}
    </div>

    <div className="px-4 py-4 max-w-lg mx-auto space-y-4">
      {tab==="trabajos"&&<>
        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Pendientes ({pendientes.length})</div>
        {pendientes.length===0&&<div className="text-center py-6 text-sm text-gray-400">Sin trabajos pendientes</div>}
        {pendientes.map(t=><div key={t.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start"><div className="font-bold text-gray-800">{t.tipo}</div><span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">{t.estado}</span></div>
          <div className="text-sm text-gray-500 mt-1">{t.descripcion}</div>
          {t.fecha&&<div className="text-xs text-gray-400 mt-2">📅 {fmt(t.fecha)} {t.hora&&`· ${t.hora}`}</div>}
        </div>)}

        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pt-2">Realizados ({realizados.length})</div>
        {realizados.map(t=><div key={t.id} className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm flex justify-between items-center">
          <div><div className="font-semibold text-gray-700 text-sm">{t.tipo}</div><div className="text-xs text-gray-400">{fmt(t.fecha)}</div></div>
          {t.presupuesto_colaborador&&<div className="text-sm font-bold text-emerald-600">{t.presupuesto_colaborador}€</div>}
        </div>)}
      </>}
      {tab==="incidencias"&&<>
        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Incidencias asignadas ({incidencias.length})</div>
        {incidencias.length===0&&<div className="text-center py-8 text-sm text-gray-400">No tienes incidencias</div>}
        {incidencias.map(inc=>{
          const t=trabajos.find(x=>x.id===inc.trabajo_id);
          const cfgEstado={"Abierta":"bg-red-100 text-red-700","En proceso":"bg-amber-100 text-amber-700","Resuelta":"bg-emerald-100 text-emerald-700"};
          return<div key={inc.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start mb-1">
              <div className="font-bold text-gray-800">⚠️ {inc.tipo}{t?` · ${t.tipo}`:""}</div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${cfgEstado[inc.estado]||"bg-gray-100 text-gray-500"}`}>{inc.estado}</span>
            </div>
            {inc.descripcion&&<div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-2 mb-2">{inc.descripcion}</div>}
            {inc.fecha_propuesta&&<div className="text-xs text-teal-700">📅 Propuesto: {fmt(inc.fecha_propuesta)} a las {inc.hora_propuesta}</div>}
            {inc.estado!=="Resuelta"&&<a href={`/trabajo/${inc.trabajo_id}`} target="_blank" className="block text-center mt-2 bg-[#1E3A5F] text-white text-sm font-bold py-2 rounded-xl">Ver y responder →</a>}
          </div>;
        })}
      </>}
     {tab==="cobros"&&(()=>{
const totalGanado=trabajos.filter(t=>(t.presupuesto_colaborador||0)>0).reduce((s,t)=>s+(t.presupuesto_colaborador||0),0);        const totalCobradoReal=pagos.reduce((s,p)=>s+(+p.importe||0),0);
        const pendienteReal=totalGanado-totalCobradoReal;
const idsConPago=[...new Set(pagos.map(p=>p.trabajo_id))];
        const trabajosConImporte=trabajos.filter(t=>(t.presupuesto_colaborador||0)>0||idsConPago.includes(t.id));        return<>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white border border-gray-100 rounded-2xl p-3 shadow-sm text-center">
            <div className="text-[9px] text-gray-400 font-bold uppercase">Total</div>
            <div className="text-base font-black text-gray-800">{totalGanado}€</div>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-3 shadow-sm text-center">
            <div className="text-[9px] text-gray-400 font-bold uppercase">Cobrado</div>
            <div className="text-base font-black text-emerald-600">{totalCobradoReal}€</div>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-3 shadow-sm text-center">
            <div className="text-[9px] text-gray-400 font-bold uppercase">Pendiente</div>
            <div className="text-base font-black text-red-500">{pendienteReal}€</div>
          </div>
        </div>
        {trabajosConImporte.map(t=>{
          const misPagos=pagos.filter(p=>p.trabajo_id===t.id);
          const total=t.presupuesto_colaborador||0;
          const cobrado=misPagos.reduce((s,p)=>s+(+p.importe||0),0);
          const pend=total-cobrado;
          return<div key={t.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <div><div className="font-bold text-gray-800 text-sm">{t.tipo}</div><div className="text-[11px] text-gray-400">{fmt(t.fecha)}</div></div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${pend<=0?"bg-emerald-100 text-emerald-700":cobrado>0?"bg-amber-100 text-amber-700":"bg-red-100 text-red-600"}`}>{pend<=0?"Cobrado":cobrado>0?"Parcial":"Pendiente"}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center bg-gray-50 rounded-xl p-2 mb-2">
              <div><div className="text-sm font-bold text-gray-700">{total}€</div><div className="text-[9px] text-gray-400 uppercase">Total</div></div>
              <div><div className="text-sm font-bold text-emerald-600">{cobrado}€</div><div className="text-[9px] text-gray-400 uppercase">Cobrado</div></div>
              <div><div className="text-sm font-bold text-red-500">{pend}€</div><div className="text-[9px] text-gray-400 uppercase">Pendiente</div></div>
            </div>
            {misPagos.map(p=><div key={p.id} className="flex justify-between items-center text-xs bg-emerald-50 rounded-lg px-2 py-1.5 mb-1">
              <span className="text-emerald-700 font-medium">{p.importe}€ · {p.forma_pago}</span>
              <span className="text-gray-400">{fmt(p.fecha)}{p.notas?` · ${p.notas}`:""}</span>
            </div>)}
          </div>;
        })}
        {trabajosConImporte.length===0&&<div className="text-center py-6 text-sm text-gray-400">Aún no hay cobros</div>}
        </>;
      })()}
      {tab==="calc"&&<CalcInterna/>}
    </div>
  </div>;
}
function CrearPassword({onListo}){
  const[pass,setPass]=useState("");
  const[pass2,setPass2]=useState("");
  const[error,setError]=useState("");
  const[guardando,setGuardando]=useState(false);
  const guardar=async()=>{
    setError("");
    if(pass.length<6){setError("Mínimo 6 caracteres");return;}
    if(pass!==pass2){setError("Las contraseñas no coinciden");return;}
    setGuardando(true);
    const{error:err}=await supabase.auth.updateUser({password:pass});
    setGuardando(false);
    if(err){setError(err.message);return;}
    onListo();
  };
  return<div className="min-h-screen flex items-center justify-center bg-[#F0F2F5] p-4" style={{fontFamily:"'Inter',system-ui,sans-serif"}}>
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-sm">
      <div className="text-center mb-6">
        <img src="/logo-domia.png" alt="Domia" className="w-24 mx-auto mb-3"/>
        <div className="font-black text-gray-800 text-lg">Crea tu contraseña</div>
        <div className="text-xs text-gray-400 mt-1">Para acceder a tu portal</div>
      </div>
      <div className="space-y-3">
        <input type="password" placeholder="Nueva contraseña" value={pass} onChange={e=>setPass(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"/>
        <input type="password" placeholder="Repite la contraseña" value={pass2} onChange={e=>setPass2(e.target.value)} onKeyDown={e=>e.key==="Enter"&&guardar()} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"/>
        {error&&<div className="text-red-500 text-xs text-center">{error}</div>}
        <button onClick={guardar} disabled={guardando} className="w-full bg-[#1E3A5F] hover:bg-[#152d4a] text-white py-3 rounded-xl font-bold text-sm transition disabled:opacity-50">{guardando?"Guardando...":"Guardar y entrar"}</button>
      </div>
    </div>
  </div>;
}
function CalcInterna(){
  const[precio,setPrecio]=useState("");
  const p=parseFloat(precio)||0;
  let margen=30;
  if(p>=15000)margen=20;else if(p>=5000)margen=25;
  const precioCliente=p>0?Math.round(p*(1+margen/100)):0;
  return<div className="space-y-4">
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">Tu precio (€)</div>
      <input type="number" value={precio} onChange={e=>setPrecio(e.target.value)} placeholder="Ej: 3000" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-2xl font-black text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"/>
    </div>
    {p>0&&<div className="bg-[#1E3A5F] rounded-2xl p-6 text-white space-y-4">
      <div className="flex justify-between items-center border-b border-blue-800 pb-3"><span className="text-sm text-blue-200">Presupuesto colaborador</span><span className="text-xl font-black">{p}€</span></div>
      <div className="flex justify-between items-center"><span className="text-sm text-blue-200">Presupuesto Domia</span><span className="text-2xl font-black text-emerald-400">{precioCliente}€</span></div>
    </div>}
  </div>;
}
function Finanzas({data,setData,onBack,toast,focoTrabajo}){
 const[pagos,setPagos]=useState([]);
  const[cargando,setCargando]=useState(true);
  const[modal,setModal]=useState(null);
  const[modalCobro,setModalCobro]=useState(null);
const[filtro,setFiltro]=useState("todos");
const[tabFin,setTabFin]=useState("cobros");
  const[cobros,setCobros]=useState([]);
  useEffect(()=>{
    Promise.all([
      supabase.from('pagos_colaborador').select('*').order('fecha',{ascending:false}),
      supabase.from('cobros_cliente').select('*').order('fecha',{ascending:false})
    ]).then(([{data:pg},{data:cb}])=>{setPagos(pg||[]);setCobros(cb||[]);setCargando(false);});
  },[]);

const trabajosConColab=data.trabajos.filter(t=>getColabId(t)&&["Aceptado","En curso","Completado"].includes(t.estado)&&(!focoTrabajo||String(t.id)===String(focoTrabajo)));
const trabajosCliente=data.trabajos.filter(t=>["Aceptado","En curso","Completado"].includes(t.estado)&&(!focoTrabajo||String(t.id)===String(focoTrabajo)));
  const pagosDeTrabajo=(tid)=>pagos.filter(p=>p.trabajo_id===tid);
  const totalPagado=(tid)=>pagosDeTrabajo(tid).reduce((s,p)=>s+(+p.importe||0),0);

 const totalDeuda=trabajosConColab.reduce((s,t)=>s+(getPresupColab(t)||0),0);
  const totalPagadoGlobal=pagos.reduce((s,p)=>s+(+p.importe||0),0);
  const pendienteGlobal=totalDeuda-totalPagadoGlobal;
  const totalClienteGlobal=trabajosCliente.reduce((s,t)=>{const precio=getPrecioCliente(t)||0;const iva=t.iva||21;return s+Math.round(precio*(1+iva/100));},0);
  const totalCobradoGlobal=cobros.reduce((s,c)=>s+(+c.importe||0),0);
  const pendienteClienteGlobal=totalClienteGlobal-totalCobradoGlobal;

  return<div>
<Back title="Finanzas" onBack={onBack}/>
<div className="flex gap-2 mb-4">
  <button onClick={()=>setTabFin("cobros")} className={`flex-1 py-2 rounded-xl text-sm font-bold transition ${tabFin==="cobros"?"bg-[#1E3A5F] text-white":"bg-white text-gray-500 border border-gray-200"}`}>💰 Cobros clientes</button>
  <button onClick={()=>setTabFin("pagos")} className={`flex-1 py-2 rounded-xl text-sm font-bold transition ${tabFin==="pagos"?"bg-[#1E3A5F] text-white":"bg-white text-gray-500 border border-gray-200"}`}>👷 Pagos colaboradores</button>
</div>
   <div className="grid grid-cols-3 gap-2 mb-4">
      <div className="bg-white border border-gray-100 rounded-2xl p-3 shadow-sm text-center">
        <div className="text-[10px] text-gray-400 font-bold uppercase">Total</div>
        <div className="text-lg font-black text-gray-800">{tabFin==="cobros"?totalClienteGlobal:totalDeuda}€</div>
      </div>
      <div className="bg-white border border-gray-100 rounded-2xl p-3 shadow-sm text-center">
        <div className="text-[10px] text-gray-400 font-bold uppercase">{tabFin==="cobros"?"Cobrado":"Pagado"}</div>
        <div className="text-lg font-black text-emerald-600">{tabFin==="cobros"?totalCobradoGlobal:totalPagadoGlobal}€</div>
      </div>
      <div className="bg-white border border-gray-100 rounded-2xl p-3 shadow-sm text-center">
        <div className="text-[10px] text-gray-400 font-bold uppercase">Pendiente</div>
        <div className="text-lg font-black text-red-500">{tabFin==="cobros"?pendienteClienteGlobal:pendienteGlobal}€</div>
      </div>
    </div>

{cargando&&<div className="text-center py-8 text-gray-400 text-sm">Cargando...</div>}
{tabFin==="cobros"&&<div>
  <div className="flex gap-1.5 mb-4 flex-wrap">
    {[["todos","Todos"],["pendientes","Pendientes"],["pagados","Pagados"]].map(([k,label])=>(
      <button key={k} onClick={()=>setFiltro(k)} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${filtro===k?"bg-[#1E3A5F] text-white":"bg-white text-gray-500 border border-gray-200"}`}>{label}</button>
    ))}
  </div>
  <div className="space-y-2">
  {trabajosCliente.filter(t=>{
    if(filtro==="pendientes")return !t.adelanto_pagado;
    if(filtro==="pagados")return t.adelanto_pagado;
    return true;
  }).length===0&&<div className="text-center py-10 text-sm text-gray-400">Sin cobros</div>}
  {trabajosCliente.filter(t=>{
    if(filtro==="pendientes")return !t.adelanto_pagado;
    if(filtro==="pagados")return t.adelanto_pagado;
    return true;
  }).map(t=>{
    const cl=data.clientes.find(c=>c.id===getClienteId(t));
    const precio=getPrecioCliente(t)||0;
    const iva=t.iva||21;
    const totalIva=Math.round(precio*(1+iva/100));
    const adelanto=t.adelanto_tipo==='fijo'?(t.adelanto_valor||0):Math.round(totalIva*(t.adelanto_valor||30)/100);
    const resto=totalIva-adelanto;
    return<div key={t.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="font-bold text-gray-800 text-sm">{t.tipo} — {cl?.nombre}</div>
          <div className="text-[11px] text-gray-400">{fmt(t.fecha)}</div>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${t.estado==="Completado"?"bg-emerald-100 text-emerald-700":"bg-amber-100 text-amber-700"}`}>{t.estado}</span>
      </div>
      {(()=>{const misCobros=cobros.filter(c=>c.trabajo_id===t.id);const cobrado=misCobros.reduce((s,c)=>s+(+c.importe||0),0);const pendiente=totalIva-cobrado;
      return<>
      <div className="grid grid-cols-3 gap-2 text-center bg-gray-50 rounded-xl p-2 mb-2">
        <div><div className="text-sm font-bold text-gray-700">{totalIva}€</div><div className="text-[9px] text-gray-400 uppercase">Total</div></div>
        <div><div className="text-sm font-bold text-emerald-600">{cobrado}€</div><div className="text-[9px] text-gray-400 uppercase">Cobrado</div></div>
        <div><div className="text-sm font-bold text-red-500">{pendiente}€</div><div className="text-[9px] text-gray-400 uppercase">Pendiente</div></div>
      </div>
      {misCobros.length>0&&<div className="space-y-1 mb-2">
        {misCobros.map(c=><div key={c.id} className="flex justify-between items-center text-xs bg-emerald-50 rounded-lg px-2 py-1.5">
          <span className="text-emerald-700 font-medium">{c.importe}€ · {c.forma_pago} · {c.concepto}</span>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">{fmt(c.fecha)}{c.notas?` · ${c.notas}`:""}</span>
            <button onClick={()=>setModalCobro({trabajo:t,cliente:cl,concepto:c.concepto,importe:c.importe,editId:c.id})} className="text-blue-500 font-bold hover:text-blue-700">✏️</button>
            <button onClick={async()=>{if(!confirm("¿Eliminar este cobro?"))return;await supabase.from('cobros_cliente').delete().eq('id',c.id);setCobros(prev=>prev.filter(x=>x.id!==c.id));toast("Cobro eliminado");}} className="text-red-400 font-bold hover:text-red-600">×</button>
          </div>
        </div>)}
      </div>}
      {pendiente>0&&<button onClick={()=>setModalCobro({trabajo:t,cliente:cl,concepto:cobrado===0?"Adelanto":"Pago final",importe:cobrado===0?adelanto:pendiente})} className="w-full bg-[#1E3A5F] text-white py-2 rounded-xl text-xs font-bold transition hover:bg-[#152d4a]">+ Registrar cobro</button>}
      {pendiente<=0&&<div className="text-center text-xs text-emerald-600 font-bold py-1">Cobrado completamente</div>}
      </>;})()}
    </div>;
  })}
  </div>
</div>}
{tabFin==="pagos"&&<div>
   <div className="flex gap-1.5 mb-4 flex-wrap">
      {[["todos","Todos"],["pendientes","Pendientes"],["proximos","Próximos"],["pagados","Pagados"]].map(([k,label])=>(
        <button key={k} onClick={()=>setFiltro(k)} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${filtro===k?"bg-[#1E3A5F] text-white":"bg-white text-gray-500 border border-gray-200"}`}>{label}</button>
      ))}
    </div>

    <div className="space-y-2">
      {trabajosConColab.filter(t=>{
        const total=getPresupColab(t)||0;
        const pagado=totalPagado(t.id);
        const pend=total-pagado;
if(filtro==="pendientes")return pend>0||total===0;
    if(filtro==="pagados")return pend<=0&&total>0;
        if(filtro==="proximos")return pend>0&&t.vencimiento_pago;
        return true;
      }).sort((a,b)=>{
        if(filtro==="proximos")return (a.vencimiento_pago||"").localeCompare(b.vencimiento_pago||"");
        return 0;
      }).map(t=>{
        const co=data.colaboradores.find(c=>c.id===getColabId(t));
        const cl=data.clientes.find(c=>c.id===getClienteId(t));
        const total=getPresupColab(t)||0;
        const pagado=totalPagado(t.id);
        const pendiente=total-pagado;
        const misPagos=pagosDeTrabajo(t.id);
        return<div key={t.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="font-bold text-gray-800 text-sm">{t.tipo} — {co?.nombre||"?"}</div>
              <div className="text-[11px] text-gray-400">{cl?.nombre} · {fmt(t.fecha)}</div>
            </div>
<span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${pendiente<=0&&total>0?"bg-emerald-100 text-emerald-700":pagado>0?"bg-amber-100 text-amber-700":"bg-red-100 text-red-600"}`}>{pendiente<=0&&total>0?"Pagado":pagado>0?"Parcial":"Pendiente"}</span>
          </div>
          {pendiente>0&&t.vencimiento_pago&&(()=>{
            const dias=Math.ceil((new Date(t.vencimiento_pago).getTime()-Date.now())/(1000*60*60*24));
            const col=dias<0?"bg-red-100 text-red-700":dias<=3?"bg-orange-100 text-orange-700":"bg-blue-50 text-blue-600";
            return<div className={`text-[11px] font-bold px-2 py-1 rounded-lg mb-2 inline-block ${col}`}>📅 {dias<0?`Vencido hace ${-dias}d`:dias===0?"Vence hoy":`Vence en ${dias}d`} · {fmt(t.vencimiento_pago)}</div>;
          })()}
          <div className="grid grid-cols-3 gap-2 text-center bg-gray-50 rounded-xl p-2 mb-2">
            <div><div className="text-sm font-bold text-gray-700">{total}€</div><div className="text-[9px] text-gray-400 uppercase">Total</div></div>
            <div><div className="text-sm font-bold text-emerald-600">{pagado}€</div><div className="text-[9px] text-gray-400 uppercase">Pagado</div></div>
            <div><div className="text-sm font-bold text-red-500">{pendiente}€</div><div className="text-[9px] text-gray-400 uppercase">Pendiente</div></div>
          </div>
          {misPagos.length>0&&<div className="space-y-1 mb-2">
            {misPagos.map(p=><div key={p.id} className="flex justify-between items-center text-xs bg-emerald-50 rounded-lg px-2 py-1.5">
              <span className="text-emerald-700 font-medium">{p.importe}€ · {p.forma_pago}</span>
              <span className="text-gray-400">{fmt(p.fecha)}{p.notas?` · ${p.notas}`:""}</span>
            </div>)}
          </div>}
          {pendiente>0&&<button onClick={()=>setModal({trabajo:t,colab:co,pendiente})} className="w-full bg-[#1E3A5F] text-white py-2 rounded-xl text-xs font-bold transition hover:bg-[#152d4a]">+ Registrar pago</button>}
        </div>;
      })}
      {!cargando&&trabajosConColab.length===0&&<div className="text-center py-10 text-sm text-gray-400">Sin trabajos con colaborador asignado</div>}
    </div>
</div>}
    {modalCobro&&<RegistrarCobro modal={modalCobro} onClose={()=>setModalCobro(null)} onGuardado={(nuevo,esEdicion)=>{if(esEdicion){setCobros(c=>c.map(x=>x.id===nuevo.id?nuevo:x));}else{setCobros(c=>[nuevo,...c]);setData(d=>({...d,trabajos:d.trabajos.map(x=>x.id===modalCobro.trabajo.id?{...x,adelanto_pagado:true}:x)}));}setModalCobro(null);toast(esEdicion?"Cobro actualizado":"Cobro registrado");}}/>}
{modal&&<RegistrarPago modal={modal} onClose={()=>setModal(null)} onGuardado={(nuevo,venc)=>{setPagos(p=>[nuevo,...p]);if(venc)setData(d=>({...d,trabajos:d.trabajos.map(x=>x.id===modal.trabajo.id?{...x,vencimiento_pago:venc}:x)}));setModal(null);toast("Pago registrado");}}/>}
</div>;
}
function RegistrarCobro({modal,onClose,onGuardado}){
  const[importe,setImporte]=useState(String(modal.importe||0));
  const[forma,setForma]=useState("Bizum");
  const[fecha,setFecha]=useState(hoy());
  const[concepto,setConcepto]=useState(modal.concepto||"Adelanto");
  const[notas,setNotas]=useState("");
  const[guardando,setGuardando]=useState(false);
  const guardar=async()=>{
    if(!importe)return;
    setGuardando(true);
   let data,error;
    if(modal.editId){
      ({data,error}=await supabase.from('cobros_cliente').update({importe:+importe,forma_pago:forma,fecha,concepto,notas}).eq('id',modal.editId).select());
    }else{
      ({data,error}=await supabase.from('cobros_cliente').insert({trabajo_id:modal.trabajo.id,importe:+importe,forma_pago:forma,fecha,concepto,notas}).select());
    }
    setGuardando(false);
    if(!error&&data)onGuardado(data[0],!!modal.editId);
  };
  return<Modal title="Registrar cobro" onClose={onClose}>
    <div className="space-y-3">
      <div className="bg-gray-50 rounded-xl p-3 text-sm">
        <div className="font-bold text-gray-700">{modal.trabajo.tipo} — {modal.cliente?.nombre}</div>
        <div className="text-xs text-gray-400">Concepto: {concepto}</div>
      </div>
      <div>
        <div className="text-[10px] text-gray-400 font-bold uppercase mb-1">Concepto</div>
        <div className="flex gap-1.5">
          {["Adelanto","Pago final","Otro"].map(c=><button key={c} onClick={()=>setConcepto(c)} className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${concepto===c?"bg-[#1E3A5F] text-white":"bg-white text-gray-500 border border-gray-200"}`}>{c}</button>)}
        </div>
      </div>
      <div>
        <div className="text-[10px] text-gray-400 font-bold uppercase mb-1">Importe (€)</div>
        <input type="number" value={importe} onChange={e=>setImporte(e.target.value)} className={S}/>
      </div>
      <div>
        <div className="text-[10px] text-gray-400 font-bold uppercase mb-1">Forma de pago</div>
        <div className="flex gap-1.5">
          {["Bizum","Transferencia","Efectivo"].map(f=><button key={f} onClick={()=>setForma(f)} className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${forma===f?"bg-[#1E3A5F] text-white":"bg-white text-gray-500 border border-gray-200"}`}>{f}</button>)}
        </div>
      </div>
      <div>
        <div className="text-[10px] text-gray-400 font-bold uppercase mb-1">Fecha</div>
        <input type="date" value={fecha} onChange={e=>setFecha(e.target.value)} className={S}/>
      </div>
      <div>
        <div className="text-[10px] text-gray-400 font-bold uppercase mb-1">Notas (opcional)</div>
        <input value={notas} onChange={e=>setNotas(e.target.value)} className={S} placeholder="Ej: pago por Bizum confirmado"/>
      </div>
      <button onClick={guardar} disabled={guardando} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-bold text-sm transition disabled:opacity-50">{guardando?"Guardando...":"Registrar cobro"}</button>
    </div>
  </Modal>;
}
function RegistrarPago({modal,onClose,onGuardado}){
  const[importe,setImporte]=useState(String(modal.pendiente));
  const[forma,setForma]=useState("Efectivo");
  const[fecha,setFecha]=useState(hoy());
  const[notas,setNotas]=useState("");
  const[vencimiento,setVencimiento]=useState(modal.trabajo.vencimiento_pago||"");
  const[guardando,setGuardando]=useState(false);

  const guardar=async()=>{
    if(!importe)return;
    setGuardando(true);
    const{data,error}=await supabase.from('pagos_colaborador').insert({
      trabajo_id:modal.trabajo.id,
      colaborador_id:modal.colab?.id,
      importe:+importe,
      forma_pago:forma,
      fecha,
      notas,
    }).select();
    if(vencimiento)await supabase.from('trabajos').update({vencimiento_pago:vencimiento}).eq('id',modal.trabajo.id);
    setGuardando(false);
    if(!error&&data)onGuardado(data[0],vencimiento);
  };

  return<Modal title="Registrar pago" onClose={onClose}>
    <div className="space-y-3">
      <div className="bg-gray-50 rounded-xl p-3 text-sm">
        <div className="font-bold text-gray-700">{modal.trabajo.tipo} — {modal.colab?.nombre}</div>
        <div className="text-xs text-gray-400">Pendiente: {modal.pendiente}€</div>
      </div>
      <div>
        <div className="text-[10px] text-gray-400 font-bold uppercase mb-1">Importe (€)</div>
        <input type="number" value={importe} onChange={e=>setImporte(e.target.value)} className={S}/>
      </div>
      <div>
        <div className="text-[10px] text-gray-400 font-bold uppercase mb-1">Forma de pago</div>
        <div className="flex gap-1.5">
          {["Efectivo","Transferencia","Bizum"].map(f=><button key={f} onClick={()=>setForma(f)} className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${forma===f?"bg-[#1E3A5F] text-white":"bg-white text-gray-500 border border-gray-200"}`}>{f}</button>)}
        </div>
      </div>
      <div>
        <div className="text-[10px] text-gray-400 font-bold uppercase mb-1">Fecha</div>
        <input type="date" value={fecha} onChange={e=>setFecha(e.target.value)} className={S}/>
      </div>
      <div>
        <div className="text-[10px] text-gray-400 font-bold uppercase mb-1">Notas (opcional)</div>
        <input value={notas} onChange={e=>setNotas(e.target.value)} className={S} placeholder="Ej: adelanto materiales"/>
      </div>
      <div>
        <div className="text-[10px] text-gray-400 font-bold uppercase mb-1">Vencimiento del resto (opcional)</div>
        <input type="date" value={vencimiento} onChange={e=>setVencimiento(e.target.value)} className={S}/>
      </div>
      <button onClick={guardar} disabled={guardando} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-bold text-sm transition disabled:opacity-50">{guardando?"Guardando...":"✅ Registrar pago"}</button>
    </div>
  </Modal>;
}
function AceptarPresupuesto({id}){
  const[trabajo,setTrabajo]=useState(null);
  const[cliente,setCliente]=useState(null);
  const[cargando,setCargando]=useState(true);
  const[estado,setEstado]=useState("ver");
  const[justif,setJustif]=useState<string|null>(null);
  const[subiendo,setSubiendo]=useState(false);
  useEffect(()=>{
    (async()=>{
      const{data:t}=await supabase.from('trabajos').select('*').eq('id',id).single();
      if(t){
        setTrabajo(t);
        const{data:c}=await supabase.from('clientes').select('*').eq('id',t.cliente_id).single();
        setCliente(c);
      }
      setCargando(false);
    })();
  },[id]);

  if(cargando)return<div className="min-h-screen flex items-center justify-center bg-[#F0F2F5]"><div className="text-4xl">⚙️</div></div>;
  if(!trabajo)return<div className="min-h-screen flex items-center justify-center bg-[#F0F2F5] p-4 text-center"><div><div className="text-4xl mb-2">🔍</div><div className="text-gray-600">Presupuesto no encontrado</div></div></div>;

  const notas=trabajo.notas||"";
  const partes=notas.split('|').map(n=>n.trim());
  const pdfUrl=partes.find(p=>p.startsWith('pdfdomia:'))?.replace('pdfdomia:','');
  const total=trabajo.precio_cliente||0;
  const iva=trabajo.iva||21;
  const totalConIva=Math.round(total*(1+iva/100));
  const adelanto=trabajo.adelanto_tipo==='fijo'?trabajo.adelanto_valor:Math.round(totalConIva*(trabajo.adelanto_valor||30)/100);

 const aceptar=async()=>{
    setEstado("procesando");
    const hist=JSON.parse(trabajo.historial||"[]");
    hist.push({ts:new Date().toLocaleString("es-ES"),txt:"✅ Cliente aceptó el presupuesto online",tipo:"ok"});
await supabase.from('trabajos').update({estado:"Aceptado",aceptado_cliente:true,atendido:false,ultima_novedad:"💶 Cliente aceptó el presupuesto",historial:JSON.stringify(hist)}).eq('id',id);    try{
      await fetch("https://opijkazhbktiikdzbanb.supabase.co/functions/v1/notificar-aceptacion",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({tipo:trabajo.tipo,cliente:cliente?.nombre,id,total:totalConIva,adelanto}),
      });
    }catch(err){}
    setEstado("aceptado");
  };

  return<div className="min-h-screen bg-[#F0F2F5]" style={{fontFamily:"'Inter',system-ui,sans-serif"}}>
    <div className="bg-[#1E3A5F] px-5 py-6 text-white text-center">
      <img src="/logo-domia.png" alt="Domia" className="w-20 mx-auto mb-2"/>
      <div className="text-lg font-black">Tu presupuesto</div>
      <div className="text-blue-200 text-xs mt-1">Domia Services</div>
    </div>

    <div className="px-4 py-6 max-w-md mx-auto space-y-4">
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <div className="text-sm text-gray-500 mb-1">Hola {cliente?.nombre?.split(" ")[0]||""} 👋</div>
        <div className="font-bold text-gray-800 text-lg mb-3">{trabajo.tipo}</div>
        <div className="text-sm text-gray-600 mb-4">{trabajo.descripcion}</div>
        <div className="bg-[#1E3A5F] rounded-xl p-5 text-white text-center">
          <div className="text-[10px] text-blue-300 font-bold uppercase tracking-widest mb-1">Total (IVA incl.)</div>
          <div className="text-4xl font-black text-emerald-400">{totalConIva}€</div>
          <div className="text-xs text-blue-200 mt-1">Base {total}€ + IVA {iva}%</div>
        </div>
      </div>

      {pdfUrl&&<a href={pdfUrl} target="_blank" className="block bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center text-sm text-[#1E3A5F] font-bold hover:bg-gray-50 transition">📄 Ver presupuesto detallado (PDF)</a>}

      {estado==="ver"&&<button onClick={aceptar} className="w-full bg-green-500 hover:bg-green-600 text-white py-4 rounded-2xl font-black text-base transition shadow-lg">✅ Acepto el presupuesto</button>}
      {estado==="ver"&&<button onClick={()=>{const msg=`Hola, soy ${cliente?.nombre||""} 👋\nTengo una duda sobre el presupuesto del trabajo de ${trabajo.tipo} (#${id}).`;window.open(`https://wa.me/34685917059?text=${encodeURIComponent(msg)}`,"_blank");}} className="w-full bg-white border border-gray-200 text-gray-600 py-3 rounded-2xl font-bold text-sm transition hover:border-[#1E3A5F] hover:text-[#1E3A5F]">💬 Tengo una duda</button>}
      {estado==="procesando"&&<div className="text-center py-4 text-gray-400">Procesando...</div>}

      {estado==="aceptado"&&<>
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center">
          <div className="text-4xl mb-2">✅</div>
          <div className="font-black text-emerald-800 text-lg">¡Presupuesto aceptado!</div>
          <div className="text-emerald-700 text-sm mt-1">Gracias por confiar en Domia Services</div>
        </div>
        <div class="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-3">Reserva tu fecha — Adelanto</div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center mb-3">
            <div className="text-xs text-amber-700 mb-1">Para iniciar el trabajo</div>
            <div className="text-3xl font-black text-amber-600">{adelanto}€</div>
          </div>
                    <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-start gap-2"><span>🏦</span> <span><strong>Transferencia:</strong><br/><span className="font-mono text-gray-800 select-all">ES43 2100 5129 4102 0005 0515</span></span></div>
                       <div className="text-xs text-gray-400 mt-2">Concepto: {trabajo.tipo} #{id}</div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            {justif?<div className="text-center bg-emerald-50 border border-emerald-200 rounded-xl p-3">
              <div className="text-2xl mb-1">✅</div>
              <div className="text-sm font-bold text-emerald-700">Justificante enviado</div>
              <div className="text-xs text-gray-400 mt-0.5">Lo revisaremos y confirmaremos el pago</div>
            </div>:<label className="flex flex-col items-center justify-center gap-2 w-full border-2 border-dashed border-gray-200 rounded-xl py-4 cursor-pointer hover:border-[#1E3A5F] hover:bg-blue-50 transition">
              <span className="text-2xl">📎</span>
              <span className="text-sm text-gray-600 font-semibold">{subiendo?"Subiendo...":"Adjuntar justificante de pago"}</span>
              <span className="text-[11px] text-gray-400">Foto o PDF del Bizum / transferencia</span>
              <input type="file" accept="image/*,application/pdf" className="hidden" disabled={subiendo} onChange={async e=>{
                const archivo=e.target.files?.[0];
                if(!archivo)return;
                setSubiendo(true);
                const ext=archivo.name.split('.').pop();
                const nombre=`justif_${id}_${Date.now()}.${ext}`;
                const{data:up}=await supabase.storage.from('fotos-demandas').upload(nombre,archivo,{upsert:true});
                if(up){
                  const{data:pub}=supabase.storage.from('fotos-demandas').getPublicUrl(nombre);
                  const url=pub.publicUrl;
                  const nuevasNotas=(trabajo.notas||"")+` | justificante:${url}`;
                  await supabase.from('trabajos').update({notas:nuevasNotas,atendido:false,ultima_novedad:"📎 Cliente adjuntó justificante de pago"}).eq('id',id);
                  setJustif(url);
                }
                setSubiendo(false);
              }}/>
            </label>}
          </div>
        </div>
        <div className="text-center text-xs text-gray-400">Te contactaremos para coordinar el inicio del trabajo</div>
      </>}

           <div className="text-center text-xs text-gray-400 pb-4">Domia Services · 685 917 059 · Elche, Alicante</div>
    </div>
  </div>;
}
function VerificarTrabajo({id}:{id:string}){
  const[trabajo,setTrabajo]=useState<any>(null);
  const[cliente,setCliente]=useState<any>(null);
  const[cargando,setCargando]=useState(true);
  const[estado,setEstado]=useState<"ver"|"motivo"|"cargando"|"si"|"no">("ver");
  const[motivo,setMotivo]=useState("");
  useEffect(()=>{
    (async()=>{
      const{data:t}=await supabase.from('trabajos').select('*').eq('id',id).single();
      if(t){
        setTrabajo(t);
        const{data:c}=await supabase.from('clientes').select('*').eq('id',t.cliente_id).single();
        setCliente(c);
      }
      setCargando(false);
    })();
  },[id]);
  const confirmarSi=async()=>{
    setEstado("cargando");
    const historial=JSON.parse(trabajo.historial||"[]");
    historial.push({ts:new Date().toLocaleString("es-ES",{hour:"2-digit",minute:"2-digit",day:"2-digit",month:"2-digit"}),txt:"✅ Cliente verificó que el trabajo está terminado",tipo:"ok"});
    await supabase.from('trabajos').update({cliente_verificado:true,atendido:false,ultima_novedad:"✅ Cliente verificó trabajo terminado",historial:JSON.stringify(historial)}).eq('id',id);
    setEstado("si");
  };
  const confirmarNo=async()=>{
    if(!motivo.trim())return;
    setEstado("cargando");
    const historial=JSON.parse(trabajo.historial||"[]");
    historial.push({ts:new Date().toLocaleString("es-ES",{hour:"2-digit",minute:"2-digit",day:"2-digit",month:"2-digit"}),txt:`❌ Cliente indica que falta: "${motivo.trim()}"`,tipo:"sistema"});
    await supabase.from('trabajos').update({trabajo_terminado:false,verificacion_rechazo:motivo.trim(),atendido:false,ultima_novedad:"❌ Cliente indica que falta algo",historial:JSON.stringify(historial)}).eq('id',id);
    setEstado("no");
  };
  if(cargando)return<div className="min-h-screen flex items-center justify-center bg-[#F0F2F5]"><div className="text-4xl">⚙️</div></div>;
  if(!trabajo)return<div className="min-h-screen flex items-center justify-center bg-[#F0F2F5] p-4 text-center"><div><div className="text-4xl mb-2">🔍</div><div className="text-gray-600">Trabajo no encontrado</div></div></div>;
  if(estado==="si")return<div className="min-h-screen flex items-center justify-center bg-[#F0F2F5] p-4"><div className="bg-white rounded-2xl p-8 text-center max-w-sm w-full shadow-sm border border-gray-100"><div className="text-6xl mb-4">✅</div><div className="text-xl font-black text-gray-800 mb-2">¡Gracias!</div><div className="text-gray-500 text-sm">En breve te contactamos para el cobro final.</div><div className="mt-4 text-xs text-gray-400">Domia Services · 685 917 059</div></div></div>;
  if(estado==="no")return<div className="min-h-screen flex items-center justify-center bg-[#F0F2F5] p-4"><div className="bg-white rounded-2xl p-8 text-center max-w-sm w-full shadow-sm border border-gray-100"><div className="text-6xl mb-4">📝</div><div className="text-xl font-black text-gray-800 mb-2">Recibido</div><div className="text-gray-500 text-sm">Gracias por avisarnos, lo revisamos y te contactamos.</div><div className="mt-4 text-xs text-gray-400">Domia Services · 685 917 059</div></div></div>;
  return<div className="min-h-screen bg-[#F0F2F5]" style={{fontFamily:"'Inter',system-ui,sans-serif"}}>
    <div className="bg-[#1E3A5F] px-5 py-6 text-white text-center">
      <img src="/logo-domia.png" alt="Domia" className="w-20 mx-auto mb-2"/>
      <div className="text-lg font-black">¿Trabajo terminado?</div>
      <div className="text-blue-200 text-xs mt-1">Domia Services</div>
    </div>
    <div className="px-4 py-6 max-w-md mx-auto space-y-4">
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <div className="text-sm text-gray-500 mb-1">Hola {cliente?.nombre?.split(" ")[0]||""} 👋</div>
        <div className="font-bold text-gray-800 text-lg mb-3">{trabajo.tipo}</div>
        <div className="text-sm text-gray-600">Nuestro técnico nos indica que ha terminado el trabajo. ¿Puedes confirmarnos que todo está correcto?</div>
      </div>
      {estado!=="motivo"?<>
        <button onClick={confirmarSi} disabled={estado==="cargando"} className="w-full bg-green-500 hover:bg-green-600 text-white py-4 rounded-2xl font-black text-base transition shadow-lg disabled:opacity-50">✅ Sí, está terminado</button>
        <button onClick={()=>setEstado("motivo")} disabled={estado==="cargando"} className="w-full bg-white border border-gray-200 text-gray-600 py-3 rounded-2xl font-bold text-sm transition hover:border-red-400 hover:text-red-500 disabled:opacity-50">❌ No, falta algo</button>
      </>:<div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3">
        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">¿Qué falta por hacer?</div>
        <textarea value={motivo} onChange={e=>setMotivo(e.target.value)} rows={3} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] resize-none" placeholder="Cuéntanos qué falta..."/>
        <button onClick={confirmarNo} disabled={!motivo.trim()||estado==="cargando"} className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-2xl font-bold text-sm transition disabled:opacity-50">Enviar</button>
        <button onClick={()=>setEstado("ver")} className="w-full text-gray-400 text-sm py-1">← Volver</button>
      </div>}
      <div className="text-center text-xs text-gray-400 pb-4">Domia Services · 685 917 059 · Elche, Alicante</div>
    </div>
  </div>;
}
function Calculadora(){
  const[precio,setPrecio]=useState("");
  const p=parseFloat(precio)||0;
  let margen=30;
  if(p>=15000)margen=20;
  else if(p>=5000)margen=25;
  const precioCliente=p>0?Math.round(p*(1+margen/100)):0;
  return<div className="min-h-screen bg-[#F0F2F5]" style={{fontFamily:"'Inter',system-ui,sans-serif"}}>
    <div className="bg-[#1E3A5F] px-5 py-6 text-white text-center">
      <img src="/logo-domia.png" alt="Domia" className="w-20 mx-auto mb-2"/>
      <div className="text-lg font-black">Calculadora de precios</div>
      <div className="text-blue-200 text-xs mt-1">Introduce tu precio y calcula el precio final</div>
    </div>
    <div className="px-4 py-6 max-w-md mx-auto space-y-4">
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">Tu precio (€)</div>
        <input type="number" value={precio} onChange={e=>setPrecio(e.target.value)} placeholder="Ej: 3000" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-2xl font-black text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"/>
      </div>
      {p>0&&<div className="bg-[#1E3A5F] rounded-2xl p-6 text-white space-y-4">
        <div className="flex justify-between items-center border-b border-blue-800 pb-3">
          <span className="text-sm text-blue-200">Presupuesto colaborador</span>
          <span className="text-xl font-black">{p}€</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-blue-200">Presupuesto Domia</span>
          <span className="text-2xl font-black text-emerald-400">{precioCliente}€</span>
        </div>
      </div>}
      <div className="text-center text-xs text-gray-400 pb-4">Domia Services · Uso interno colaboradores</div>
    </div>
  </div>;
}
function PortalCliente({id}:{id:string}){
  const[trabajo,setTrabajo]=useState<any>(null);
  const[estado,setEstado]=useState<"idle"|"ok"|"no"|"cargando">("idle");
  const[cargando,setCargando]=useState(true);
  const[comentario,setComentario]=useState("");
  const[proponiendo,setProponiendo]=useState(false);
  const[nuevaFecha,setNuevaFecha]=useState("");
  const[nuevaHora,setNuevaHora]=useState("09:00");
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
      estado:confirma?"Cliente confirmó":"Colaborador disponible",
      atendido:false,
      ultima_novedad:confirma?"✅ Cliente confirmó la visita":"🔄 Cliente pidió cambio de fecha",
      historial:JSON.stringify(historial),
    notas:comentario?(trabajo.notas?trabajo.notas+' | ':'')+`cliente: ${comentario}`:trabajo.notas,
    }).eq('id',id);
    setEstado(confirma?"ok":"no");
  };
    const proponerNuevaFecha=async()=>{
    if(!nuevaFecha){return;}
    setEstado("cargando");
    const fechaFmt=new Date(nuevaFecha+"T00:00:00").toLocaleDateString("es-ES",{day:"2-digit",month:"2-digit",year:"2-digit"});
    const historial=JSON.parse(trabajo.historial||"[]");
    historial.push({ts:now(),txt:`Cliente propone otra fecha: ${fechaFmt} a las ${nuevaHora}${comentario?' — "'+comentario+'"':''}`,tipo:"sistema"});
    await supabase.from('trabajos').update({
      estado:"Colaborador disponible",
      fecha:nuevaFecha,
      hora:nuevaHora,
      atendido:false,
      ultima_novedad:`🔄 Cliente propone: ${fechaFmt} a las ${nuevaHora}`,
      historial:JSON.stringify(historial),
      notas:comentario?(trabajo.notas?trabajo.notas+' | ':'')+`cliente: ${comentario}`:trabajo.notas,
    }).eq('id',id);
    setEstado("no");
  };
  if(cargando)return<div className="min-h-screen flex items-center justify-center bg-[#F0F2F5]"><div className="text-center"><div className="text-4xl mb-3">⚙️</div><div className="font-bold text-gray-700">Cargando...</div></div></div>;
  if(!trabajo)return<div className="min-h-screen flex items-center justify-center bg-[#F0F2F5]"><div className="text-center"><div className="text-4xl mb-3">❌</div><div className="font-bold text-gray-700">Enlace no válido</div></div></div>;
  if(estado==="ok")return<div className="min-h-screen flex items-center justify-center bg-[#F0F2F5] p-4"><div className="bg-white rounded-2xl p-8 text-center max-w-sm w-full shadow-sm border border-gray-100"><div className="text-6xl mb-4">✅</div><div className="text-xl font-black text-gray-800 mb-2">¡Perfecto!</div><div className="text-gray-500 text-sm">Hemos confirmado tu visita. Nos vemos pronto 😊</div><div className="mt-4 text-xs text-gray-400">Domia Services · 685 917 059</div></div></div>;
  if(estado==="no")return<div className="min-h-screen flex items-center justify-center bg-[#F0F2F5] p-4"><div className="bg-white rounded-2xl p-8 text-center max-w-sm w-full shadow-sm border border-gray-100"><div className="text-6xl mb-4">✅</div><div className="text-xl font-black text-gray-800 mb-2">¡Recibido!</div><div className="text-gray-500 text-sm">Hemos recibido tu propuesta de fecha. Te confirmaremos en breve. 😊</div><div className="mt-4 text-xs text-gray-400">Domia Services · 685 917 059</div></div></div>;
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
        {!proponiendo?<>
        <button onClick={()=>confirmar(true)} disabled={estado==="cargando"} className="w-full bg-green-500 hover:bg-green-600 active:scale-95 text-white rounded-2xl py-5 flex flex-col items-center gap-2 font-bold text-lg transition disabled:opacity-50"><span className="text-3xl">✅</span>Sí, me viene bien</button>
        <button onClick={()=>setProponiendo(true)} disabled={estado==="cargando"} className="w-full bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-600 rounded-2xl py-4 flex flex-col items-center gap-2 font-bold text-base transition disabled:opacity-50"><span className="text-2xl">📅</span>No, prefiero otra fecha</button>
        </>:<div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3">
          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Indica qué fecha te viene mejor</div>
          <div className="flex gap-2">
            <input type="date" value={nuevaFecha} onChange={e=>setNuevaFecha(e.target.value)} className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"/>
            <input type="time" value={nuevaHora} onChange={e=>setNuevaHora(e.target.value)} className="w-28 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"/>
          </div>
          <button onClick={proponerNuevaFecha} disabled={!nuevaFecha||estado==="cargando"} className="w-full bg-[#1E3A5F] hover:bg-[#152d4a] text-white rounded-2xl py-3.5 font-bold text-base transition disabled:opacity-50">Enviar mi propuesta</button>
          <button onClick={()=>setProponiendo(false)} className="w-full text-gray-400 text-sm py-1">← Volver</button>
        </div>}
      </div>
      <div className="text-center text-xs text-gray-400 pb-4">Domia Services · 685 917 059</div>
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
      atendido:false,
      ultima_novedad:`📄 Colaborador subió presupuesto: ${importe}€`,
      presupuesto_colaborador:+importe,
      notas:(trabajo.notas?trabajo.notas+' | ':'')+(fotoUrl?'presup:'+fotoUrl:(notas?'nota-colab: '+notas:'')),
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
  const[colabInfo,setColabInfo]=useState<any>(null);
  const[incidencia,setIncidencia]=useState<any>(null);
  const[estado,setEstado]=useState<"idle"|"ok"|"no"|"cargando">("idle");
  const[cargando,setCargando]=useState(true);
  useEffect(()=>{
    const cargar=async()=>{
      const{data:t}=await supabase.from('trabajos').select('*').eq('id',id).single();
      if(t){setTrabajo(t);const{data:c}=await supabase.from('clientes').select('*').eq('id',t.cliente_id).single();setCliente(c);if(t.colaborador_id){const{data:co}=await supabase.from('colaboradores').select('*').eq('id',t.colaborador_id).single();setColabInfo(co);}const{data:incs}=await supabase.from('incidencias').select('*').eq('trabajo_id',id).order('id',{ascending:false});if(incs&&incs.length)setIncidencia(incs.find(x=>x.estado!=='Resuelta')||null);}
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
    setEstado(puede?"ok":"no");
  };
const confirmarConDisponibilidad=async(dia:string,hora:string,importe:string,archivo:File|null,nota:string="")=>{
  setEstado("cargando");
    const fechaFmt=dia?new Date(dia+"T00:00:00").toLocaleDateString("es-ES",{day:"2-digit",month:"2-digit",year:"2-digit"}):"";
    let presupUrl="";
    if(archivo){
      const ext=archivo.name.split('.').pop();
      const nombre=`presup_${id}_${Date.now()}.${ext}`;
      const{data:up}=await supabase.storage.from('fotos-demandas').upload(nombre,archivo,{upsert:true});
      if(up){const{data:pub}=supabase.storage.from('fotos-demandas').getPublicUrl(nombre);presupUrl=pub.publicUrl;}
    }
    let historial=[];try{historial=Array.isArray(trabajo.historial)?trabajo.historial:JSON.parse(trabajo.historial||"[]");}catch(e){historial=[];}if(!Array.isArray(historial))historial=[];
    if(dia)historial.push({ts:now(),txt:`Colaborador disponible: ${fechaFmt} a las ${hora}`,tipo:"ok"});
    const nombreCol=colabInfo?.nombre?` · ${colabInfo.nombre}`:"";
    if(importe||presupUrl)historial.push({ts:now(),txt:`Presupuesto${importe?`: ${importe}€`:" (adjunto)"}${nombreCol}${nota?` — 📝 ${nota}`:""}`,tipo:"presupuesto"});
  let notasNuevas=trabajo.notas||"";
    if(dia){notasNuevas=notasNuevas.split('|').map(n=>n.trim()).filter(n=>!n.startsWith('disponibilidad:')).join(' | ');notasNuevas=notasNuevas?notasNuevas+` | disponibilidad: ${fechaFmt} a las ${hora}`:`disponibilidad: ${fechaFmt} a las ${hora}`;}
  if(presupUrl)notasNuevas+=(notasNuevas?" | ":"")+`presup:${presupUrl}`;
    notasNuevas=notasNuevas.split('|').map(n=>n.trim()).filter(n=>!n.startsWith('notacolab:')).join(' | ');
    if(nota&&nota.trim())notasNuevas+=(notasNuevas?" | ":"")+`notacolab:${nota.trim()}`;
  const novedad=dia?`📅 Colaborador disponible: ${fechaFmt} a las ${hora}`:`💶 Presupuesto recibido${importe?`: ${importe}€`:""}`;
    const update:any={
      estado:"Colaborador disponible",
      colaborador_id:trabajo.colaborador_id,
      atendido:false,
      ultima_novedad:novedad,
      historial:JSON.stringify(historial),
      notas:notasNuevas,
    };
    if(dia){update.fecha=dia;update.hora=hora;}
    if(importe)update.presupuesto_colaborador=+importe;
       await supabase.from('trabajos').update(update).eq('id',id);
    setEstado("ok");
  };
  const confirmarCambioFecha=async(aceptar:boolean)=>{
    setEstado("cargando");
    const historial=JSON.parse(trabajo.historial||"[]");
    if(aceptar){
      historial.push({ts:now(),txt:`Colaborador acepta la nueva fecha: ${fmt(trabajo.fecha)} a las ${trabajo.hora}`,tipo:"ok"});
      await supabase.from('trabajos').update({estado:"Cliente confirmó",atendido:false,ultima_novedad:`✅ Colaborador acepta: ${fmt(trabajo.fecha)} a las ${trabajo.hora}`,historial:JSON.stringify(historial)}).eq('id',id);
    }
    setEstado("ok");
  };
  const confirmarIncidencia=async(dia:string,hora:string,importe:string,archivo:File|null,nota:string="")=>{
    setEstado("cargando");
    const fechaFmt=dia?new Date(dia+"T00:00:00").toLocaleDateString("es-ES",{day:"2-digit",month:"2-digit",year:"2-digit"}):"";
    const detalle=`Colaborador disponible para la incidencia: ${fechaFmt} a las ${hora}${nota?` · Nota: ${nota}`:""}`;
      await supabase.from('incidencias').update({
      estado:"En proceso",
      fecha_propuesta:dia,
      hora_propuesta:hora,
      nota_colaborador:nota||"",
      atendida:false,
    }).eq('id',incidencia.id);
    setEstado("ok");
  };
   const marcarResueltoColab=async(mensaje:string)=>{
    setEstado("cargando");
    await supabase.from('incidencias').update({
      estado:"En proceso",
      resolucion:mensaje?`(Colaborador) ${mensaje}`:"(Colaborador) Marcado como resuelto",
      atendida:false,
    }).eq('id',incidencia.id);
    setEstado("resuelto");
  };
  const marcarTrabajoTerminado=async()=>{
    setEstado("cargando");
    const historial=JSON.parse(trabajo.historial||"[]");
    historial.push({ts:now(),txt:"🔧 Colaborador marca el trabajo como terminado",tipo:"sistema"});
    await supabase.from('trabajos').update({trabajo_terminado:true,verificacion_rechazo:null,atendido:false,ultima_novedad:"🔧 Colaborador marca trabajo terminado — pendiente verificación cliente",historial:JSON.stringify(historial)}).eq('id',id);
    setTrabajo({...trabajo,trabajo_terminado:true,verificacion_rechazo:null});
    setEstado("idle");
  };
  if(cargando)return<div className="min-h-screen flex items-center justify-center bg-[#F0F2F5]"><div className="text-center"><div className="text-4xl mb-3">⚙️</div><div className="font-bold text-gray-700">Cargando...</div></div></div>;
  if(!trabajo)return<div className="min-h-screen flex items-center justify-center bg-[#F0F2F5]"><div className="text-center"><div className="text-4xl mb-3">❌</div><div className="font-bold text-gray-700">Trabajo no encontrado</div></div></div>;
  if(estado==="ok")return<div className="min-h-screen flex items-center justify-center bg-[#F0F2F5] p-4"><div className="bg-white rounded-2xl p-8 text-center max-w-sm w-full shadow-sm border border-gray-100"><div className="text-6xl mb-4">✅</div><div className="text-xl font-black text-gray-800 mb-2">¡Confirmado!</div><div className="text-gray-500 text-sm">Hemos avisado a Domia. Nos ponemos en contacto contigo pronto.</div></div></div>;
  if(estado==="no")return<div className="min-h-screen flex items-center justify-center bg-[#F0F2F5] p-4"><div className="bg-white rounded-2xl p-8 text-center max-w-sm w-full shadow-sm border border-gray-100"><div className="text-6xl mb-4">👍</div><div className="text-xl font-black text-gray-800 mb-2">Entendido</div><div className="text-gray-500 text-sm">Gracias por avisarnos. Buscaremos otra disponibilidad.</div></div></div>;
   if(incidencia){
    return<div className="min-h-screen bg-[#F0F2F5]" style={{fontFamily:"'Inter',system-ui,sans-serif"}}>
      <div className="bg-[#1E3A5F] px-5 py-5 text-white">
        <div className="text-[10px] text-blue-300 font-bold uppercase tracking-widest mb-1">Domia Services · Trabajo #{id}</div>
        <div className="text-2xl font-black">{trabajo.tipo}</div>
      </div>
      <div className="px-4 py-5 max-w-lg mx-auto space-y-4">
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1.5"><span className="text-xl">⚠️</span><span className="text-sm font-black text-red-700 uppercase tracking-wide">Incidencia — {incidencia.tipo}</span></div>
          <div className="text-sm text-red-800 leading-relaxed">Este es un trabajo que ya realizaste y ha surgido un problema:</div>
          <div className="text-sm text-red-900 font-semibold bg-white/60 rounded-lg px-3 py-2 mt-2">{incidencia.descripcion||"(sin detalles)"}</div>
<div className="text-xs text-red-600 mt-2">Indica abajo cuándo puedes ir a revisarlo.</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3">
          <div className="flex items-start gap-3"><span className="text-xl mt-0.5">📍</span><div><div className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Dirección</div><div className="font-semibold text-gray-800">{cliente?.direccion||"—"}</div></div></div>
          <div className="flex items-start gap-3"><span className="text-xl mt-0.5">📝</span><div><div className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Trabajo original</div><div className="text-gray-700 text-sm">{trabajo.descripcion}</div></div></div>
        </div>
                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-3">¿Cuándo puedes ir a resolverlo?</div>
          {estado==="ok"?<div className="text-center py-4"><div className="text-4xl mb-2">✅</div><div className="font-bold text-emerald-700 text-sm">Disponibilidad enviada</div><div className="text-xs text-gray-400 mt-1">Domia coordinará la visita con el cliente</div></div>:estado==="resuelto"?<div className="text-center py-4"><div className="text-4xl mb-2">🎉</div><div className="font-bold text-emerald-700 text-sm">¡Gracias!</div><div className="text-xs text-gray-400 mt-1">Domia confirmará el cierre de la incidencia</div></div>:<DisponibilidadIncidencia onConfirmar={(dia,hora,importe,archivo,nota)=>confirmarIncidencia(dia,hora,importe,archivo,nota)}/>}
        </div>
        {estado!=="ok"&&estado!=="resuelto"&&<div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">¿Ya lo has resuelto?</div>
          <button onClick={()=>{const m=prompt("¿Cómo lo has resuelto? (opcional)");marcarResueltoColab(m||"");}} className="w-full bg-emerald-600 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-emerald-700 transition">✅ Ya lo he resuelto</button>
        </div>}
        <div className="text-center text-xs text-gray-400 pb-4">Domia Services · Solo tú tienes acceso a este enlace</div>
      </div>
    </div>;
  }
   if(trabajo.ultima_novedad&&trabajo.ultima_novedad.includes("Cliente propone")&&trabajo.estado==="Colaborador disponible"){
    return<div className="min-h-screen bg-[#F0F2F5]" style={{fontFamily:"'Inter',system-ui,sans-serif"}}>
      <div className="bg-[#1E3A5F] px-5 py-5 text-white">
        <div className="text-[10px] text-blue-300 font-bold uppercase tracking-widest mb-1">Domia Services · Trabajo #{id}</div>
        <div className="text-2xl font-black">{trabajo.tipo}</div>
      </div>
      <div className="px-4 py-5 max-w-lg mx-auto space-y-4">
        <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-4 text-center">
          <div className="text-3xl mb-2">🔄</div>
          <div className="text-sm font-black text-orange-700 uppercase tracking-wide mb-2">El cliente pide otra fecha</div>
          <div className="text-2xl font-black text-orange-800">{fmt(trabajo.fecha)}</div>
          <div className="text-lg font-bold text-orange-600">a las {trabajo.hora}</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-start gap-3"><span className="text-xl mt-0.5">📍</span><div><div className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Dirección</div><div className="font-semibold text-gray-800">{cliente?.direccion||"—"}</div></div></div>
        </div>
        {estado==="ok"?<div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center"><div className="text-4xl mb-2">✅</div><div className="font-bold text-emerald-700">Respuesta enviada</div><div className="text-xs text-gray-400 mt-1">Domia coordinará con el cliente</div></div>:<>
        <button onClick={()=>confirmarCambioFecha(true)} disabled={estado==="cargando"} className="w-full bg-green-500 hover:bg-green-600 text-white rounded-2xl py-4 font-bold text-base transition disabled:opacity-50">✅ Sí, me viene bien esta fecha</button>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">¿Prefieres proponer otra fecha?</div>
          <DisponibilidadIncidencia onConfirmar={(dia,hora,importe,archivo,nota)=>confirmarConDisponibilidad(dia,hora,importe,archivo,nota)}/>
        </div>
        </>}
                <div className="text-center text-xs text-gray-400 pb-4">Domia Services · Solo tú tienes acceso a este enlace</div>
      </div>
    </div>;
  }
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
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">¿Necesitas cambiar la fecha?</div>
          {estado==="ok"?<div className="text-center py-3"><div className="text-3xl mb-1">✅</div><div className="font-bold text-emerald-700 text-sm">Nueva disponibilidad enviada</div></div>:<DisponibilidadIncidencia onConfirmar={(dia,hora,importe,archivo,nota)=>confirmarConDisponibilidad(dia,hora,importe,archivo,nota)}/>}
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
        {trabajo.estado==="En curso"&&<div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-3">Trabajo terminado</div>
          {trabajo.verificacion_rechazo&&<div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-3 text-sm text-red-700"><strong>El cliente indica que falta algo:</strong><br/>{trabajo.verificacion_rechazo}</div>}
          {trabajo.cliente_verificado?(
            <div className="text-center py-3"><div className="text-3xl mb-1">🎉</div><div className="font-bold text-emerald-700 text-sm">El cliente verificó — trabajo cerrado</div></div>
          ):trabajo.trabajo_terminado?(
            <div className="text-center py-3"><div className="text-3xl mb-1">⏳</div><div className="font-bold text-gray-500 text-sm">Esperando verificación del cliente</div></div>
          ):(
            <button onClick={marcarTrabajoTerminado} disabled={estado==="cargando"} className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-bold text-sm transition disabled:opacity-50">✅ Marcar trabajo terminado</button>
          )}
        </div>}
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
     {incidencia&&<div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-1.5"><span className="text-xl">⚠️</span><span className="text-sm font-black text-red-700 uppercase tracking-wide">Incidencia — {incidencia.tipo}</span></div>
        <div className="text-sm text-red-800 leading-relaxed">Este es un trabajo que ya realizaste y ha surgido un problema:</div>
        <div className="text-sm text-red-900 font-semibold bg-white/60 rounded-lg px-3 py-2 mt-2">{incidencia.descripcion||"(sin detalles)"}</div>
<div className="text-xs text-red-600 mt-2">Indica abajo cuándo puedes ir a revisarlo.</div>
     </div>}
     <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-start gap-3"><span className="text-xl mt-0.5">📍</span><div><div className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Dirección</div><div className="font-semibold text-gray-800">{cliente?.direccion||"—"}</div></div></div>
        <div className="flex items-start gap-3"><span className="text-xl mt-0.5">📝</span><div className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Descripción</div><div className="text-gray-700 text-sm leading-relaxed">{trabajo.descripcion}</div></div></div>
        {trabajo.instrucciones_colaborador&&<div className="flex items-start gap-3"><span className="text-xl mt-0.5">📋</span><div><div className="text-[10px] text-blue-500 font-bold uppercase mb-0.5">Instrucciones</div><div className="text-blue-900 text-sm leading-relaxed bg-blue-50 rounded-lg px-3 py-2">{trabajo.instrucciones_colaborador}</div></div></div>}
        {(()=>{const foto=(trabajo.notas||'').split('|').map(n=>n.trim()).find(n=>n.startsWith('foto:'))?.replace('foto:','');return foto?<div className="flex items-start gap-3"><span className="text-xl mt-0.5">📷</span><div className="flex-1"><div className="text-[10px] text-gray-400 font-bold uppercase mb-1">Foto del trabajo</div><img src={foto} alt="Foto del trabajo" className="w-full rounded-xl object-cover max-h-64 cursor-pointer" onClick={()=>window.open(foto,"_blank")}/></div></div>:null;})()}
      </div>
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
       
       <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-3">{incidencia?"¿Cuándo puedes ir a resolver la incidencia?":"¿Puedes encargarte? Indica fecha y/o precio"}</div>
        {estado!=="nopuedo"&&<div className="mb-4">
          <DisponibilidadSelector onConfirmar={(dia,hora,importe,archivo,nota)=>confirmarConDisponibilidad(dia,hora,importe,archivo,nota)}/>
        </div>}
        {estado!=="nopuedo"&&<button onClick={()=>setEstado("nopuedo")} disabled={estado==="cargando"} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-xl py-2.5 font-bold text-sm transition disabled:opacity-50">❌ No puedo encargarme</button>} 
        {estado==="nopuedo"&&<div className="border-t border-gray-100 pt-4">
          <div className="text-[10px] text-gray-400 font-bold uppercase mb-2">¿Puedes en otra fecha? (opcional)</div>
          <DisponibilidadSelector onConfirmar={(dia,hora,importe,archivo,nota)=>confirmarConDisponibilidad(dia,hora,importe,archivo,nota)}/>
          <button onClick={()=>confirmar(false)} className="w-full mt-2 border border-gray-200 text-gray-500 py-2.5 rounded-xl text-sm">No puedo en ninguna fecha</button>
        </div>}
      </div>
      <div className="text-center text-xs text-gray-400 pb-4">Solo tú tienes acceso a este enlace</div>
    </div>
  ;
}
function Incidencias({data,setData,onBack,toast}){
    const[filtro,setFiltro]=useState("Abierta");
  const[nueva,setNueva]=useState(false);
  const[verInc,setVerInc]=useState(null);
  const incidencias=data.incidencias||[];
  const filtradas=filtro==="Todas"?incidencias:incidencias.filter(i=>i.estado===filtro);
  const cfgEstado={"Abierta":"bg-red-100 text-red-700","En proceso":"bg-amber-100 text-amber-700","Resuelta":"bg-emerald-100 text-emerald-700"};
  const cfgTipo={"Garantía":"🛡️","Queja":"😠","Repetición":"🔁","Otro":"📋"};
   const atencion=incidencias.filter(i=>i.atendida===false&&i.estado!=="Resuelta");
  return<div>
    <Back title="Incidencias" onBack={onBack} right={<button onClick={()=>setNueva(true)} className="bg-[#1E3A5F] text-white text-xs font-bold px-3 py-1.5 rounded-xl hover:bg-[#152d4a] transition">+ Nueva</button>}/>
    {atencion.length>0&&<div className="bg-red-50 border-2 border-red-200 rounded-2xl p-3 mb-4">
      <div className="font-bold text-red-700 text-sm mb-2 flex items-center gap-2">🔔 Requiere tu atención ({atencion.length})</div>
      <div className="space-y-2">{atencion.map(inc=>{
        const cl=data.clientes.find(c=>c.id===inc.cliente_id);
        const co=data.colaboradores.find(c=>c.id===inc.colaborador_id);
        return<div key={inc.id} className="bg-white border border-red-200 rounded-xl p-3">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="text-sm font-bold text-gray-800">{inc.tipo} · {cl?.nombre||"—"}</div>
            <div className="flex gap-1.5">
              <button onClick={()=>setVerInc(inc)} className="bg-[#1E3A5F] text-white text-xs font-bold px-2.5 py-1.5 rounded-lg hover:bg-[#152d4a] transition">Ver</button>
              <button onClick={async()=>{await supabase.from('incidencias').update({atendida:true}).eq('id',inc.id);setData(d=>({...d,incidencias:d.incidencias.map(x=>x.id===inc.id?{...x,atendida:true}:x)}));toast("✓ Atendido");}} className="bg-gray-100 text-gray-500 text-xs font-bold px-2.5 py-1.5 rounded-lg hover:bg-emerald-100 hover:text-emerald-600 transition">✓</button>
            </div>
          </div>
          {inc.fecha_propuesta&&<div className="text-sm text-teal-700">📅 {co?.nombre?.split(" ")[0]||"Colaborador"} disponible: {new Date(inc.fecha_propuesta+"T00:00:00").toLocaleDateString("es-ES",{day:"2-digit",month:"2-digit",year:"2-digit"})} a las {inc.hora_propuesta}</div>}
          {inc.nota_colaborador&&<div className="text-xs text-gray-500 mt-0.5">📝 {inc.nota_colaborador}</div>}
        </div>;
      })}</div>
    </div>}
    <div className="flex gap-1.5 flex-wrap mb-4">
      {["Abierta","En proceso","Resuelta","Todas"].map(f=><Pill key={f} label={f} active={filtro===f} onClick={()=>setFiltro(f)}/>)}
    </div>
    {filtradas.length===0&&<div className="text-center py-16 text-gray-400 text-sm">Sin incidencias {filtro!=="Todas"?`en estado "${filtro}"`:""}</div>}
    <div className="space-y-2">
      {filtradas.map(inc=>{
        const cl=data.clientes.find(c=>c.id===inc.cliente_id);
        const trab=data.trabajos.find(t=>t.id===inc.trabajo_id);
        return<div key={inc.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{cfgTipo[inc.tipo]||"📋"}</span>
              <div>
                <div className="font-bold text-gray-800 text-sm">{inc.tipo}</div>
                <div className="text-xs text-gray-500">{cl?.nombre||"—"}{trab?` · ${trab.tipo} #${trab.id}`:""}</div>
              </div>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${cfgEstado[inc.estado]||"bg-gray-100 text-gray-500"}`}>{inc.estado}</span>
          </div>
          {inc.descripcion&&<div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-2 mb-2">{inc.descripcion}</div>}
          {inc.fecha_propuesta&&<div className="text-sm text-teal-700 bg-teal-50 rounded-lg p-2 mb-2">📅 Colaborador disponible: {new Date(inc.fecha_propuesta+"T00:00:00").toLocaleDateString("es-ES",{day:"2-digit",month:"2-digit",year:"2-digit"})} a las {inc.hora_propuesta}{inc.nota_colaborador?` · 📝 ${inc.nota_colaborador}`:""}</div>}
          {inc.fecha_propuesta&&cl?.telefono&&<button onClick={()=>{const fechaFmt=new Date(inc.fecha_propuesta+"T00:00:00").toLocaleDateString("es-ES",{day:"2-digit",month:"2-digit",year:"2-digit"});window.open(buildWAIncidenciaCliente(cl,trab,inc,fechaFmt,inc.hora_propuesta),"_blank");}} className="w-full bg-cyan-500 text-white text-xs font-bold py-2 rounded-lg hover:bg-cyan-600 transition mb-2">📱 Avisar al cliente de la fecha</button>}
          {inc.resolucion&&<div className="text-sm text-emerald-700 bg-emerald-50 rounded-lg p-2 mb-2">✅ {inc.resolucion}</div>}
                    {(()=>{const co=data.colaboradores.find(c=>c.id===inc.colaborador_id);return co&&co.whatsapp?<button onClick={()=>window.open(buildWAIncidencia(co,trab,cl,inc),"_blank")} className="w-full bg-green-500 text-white text-xs font-bold py-2 rounded-lg hover:bg-green-600 transition mb-2">📱 Avisar a {co.nombre.split(" ")[0]} de la incidencia</button>:null;})()}
          <div className="flex gap-2 mt-2">
            {inc.estado==="Abierta"&&<button onClick={async()=>{await supabase.from('incidencias').update({estado:"En proceso"}).eq('id',inc.id);setData(d=>({...d,incidencias:d.incidencias.map(x=>x.id===inc.id?{...x,estado:"En proceso"}:x)}));toast("→ En proceso");}} className="flex-1 bg-amber-50 text-amber-700 text-xs font-bold py-2 rounded-lg hover:bg-amber-100 transition">▶️ En proceso</button>}
            {inc.estado!=="Resuelta"&&<button onClick={async()=>{const res=prompt("¿Cómo se resolvió? (opcional)");await supabase.from('incidencias').update({estado:"Resuelta",resolucion:res||"",fecha_cierre:new Date().toISOString()}).eq('id',inc.id);setData(d=>({...d,incidencias:d.incidencias.map(x=>x.id===inc.id?{...x,estado:"Resuelta",resolucion:res||""}:x)}));toast("✅ Resuelta");}} className="flex-1 bg-emerald-50 text-emerald-700 text-xs font-bold py-2 rounded-lg hover:bg-emerald-100 transition">✅ Resolver</button>}
            <button onClick={async()=>{if(!confirm("¿Eliminar esta incidencia?"))return;await supabase.from('incidencias').delete().eq('id',inc.id);setData(d=>({...d,incidencias:d.incidencias.filter(x=>x.id!==inc.id)}));toast("Eliminada");}} className="bg-red-50 text-red-500 text-xs font-bold px-3 py-2 rounded-lg hover:bg-red-100 transition">🗑</button>
          </div>
        </div>;
      })}
    </div>
        {nueva&&<Modal title="Nueva incidencia" onClose={()=>setNueva(false)} wide><FormIncidencia data={data} setData={setData} onClose={()=>setNueva(false)} toast={toast}/></Modal>}
    {verInc&&(()=>{
      const cl=data.clientes.find(c=>c.id===verInc.cliente_id);
      const co=data.colaboradores.find(c=>c.id===verInc.colaborador_id);
      const trab=data.trabajos.find(t=>t.id===verInc.trabajo_id);
      return<Modal title={`Incidencia · ${verInc.tipo}`} onClose={()=>setVerInc(null)} wide>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className={`text-[11px] px-2.5 py-1 rounded-full font-bold ${cfgEstado[verInc.estado]||"bg-gray-100 text-gray-500"}`}>{verInc.estado}</span>
            <span className="text-lg">{cfgTipo[verInc.tipo]||"📋"}</span>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="text-[10px] text-gray-400 font-bold uppercase mb-1">Cliente</div>
            <div className="text-sm font-semibold text-gray-800">{cl?.nombre||"—"}</div>
            <div className="text-xs text-gray-500">{cl?.telefono||""}</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="text-[10px] text-gray-400 font-bold uppercase mb-1">Trabajo relacionado</div>
            <div className="text-sm text-gray-700">{trab?`${trab.tipo} #${trab.id}`:"—"}</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="text-[10px] text-gray-400 font-bold uppercase mb-1">Colaborador</div>
            <div className="text-sm text-gray-700">{co?.nombre||"—"}</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="text-[10px] text-gray-400 font-bold uppercase mb-1">Descripción del problema</div>
            <div className="text-sm text-gray-700">{verInc.descripcion||"—"}</div>
          </div>
          {verInc.fecha_propuesta&&<div className="bg-teal-50 rounded-xl p-3">
            <div className="text-[10px] text-teal-600 font-bold uppercase mb-1">📅 Fecha propuesta por el colaborador</div>
            <div className="text-sm text-teal-800">{new Date(verInc.fecha_propuesta+"T00:00:00").toLocaleDateString("es-ES",{day:"2-digit",month:"2-digit",year:"2-digit"})} a las {verInc.hora_propuesta}</div>
            {verInc.nota_colaborador&&<div className="text-xs text-teal-700 mt-1">📝 {verInc.nota_colaborador}</div>}
          </div>}
          {verInc.resolucion&&<div className="bg-emerald-50 rounded-xl p-3">
            <div className="text-[10px] text-emerald-600 font-bold uppercase mb-1">✅ Resolución</div>
            <div className="text-sm text-emerald-800">{verInc.resolucion}</div>
          </div>}
          <div className="space-y-2 pt-2 border-t border-gray-100">
            {verInc.fecha_propuesta&&cl?.telefono&&<button onClick={()=>{const fechaFmt=new Date(verInc.fecha_propuesta+"T00:00:00").toLocaleDateString("es-ES",{day:"2-digit",month:"2-digit",year:"2-digit"});window.open(buildWAIncidenciaCliente(cl,trab,verInc,fechaFmt,verInc.hora_propuesta),"_blank");}} className="w-full bg-cyan-500 text-white text-sm font-bold py-2.5 rounded-xl hover:bg-cyan-600 transition">📱 Avisar al cliente de la fecha</button>}
            {co&&co.whatsapp&&<button onClick={()=>window.open(buildWAIncidencia(co,trab,cl,verInc),"_blank")} className="w-full bg-green-500 text-white text-sm font-bold py-2.5 rounded-xl hover:bg-green-600 transition">📱 Avisar a {co.nombre.split(" ")[0]} de la incidencia</button>}
            {verInc.estado!=="Resuelta"&&<button onClick={async()=>{const res=prompt("¿Cómo se resolvió? (opcional)",verInc.resolucion||"");await supabase.from('incidencias').update({estado:"Resuelta",resolucion:res||verInc.resolucion||"",atendida:true,fecha_cierre:new Date().toISOString()}).eq('id',verInc.id);setData(d=>({...d,incidencias:d.incidencias.map(x=>x.id===verInc.id?{...x,estado:"Resuelta",resolucion:res||verInc.resolucion||"",atendida:true}:x)}));toast("✅ Incidencia resuelta");setVerInc(null);}} className="w-full bg-emerald-600 text-white text-sm font-bold py-2.5 rounded-xl hover:bg-emerald-700 transition">✅ Marcar como resuelta</button>}
          </div>
        </div>
      </Modal>;
    })()}
  </div>;
}
function FormIncidencia({data,setData,onClose,toast,trabajoPre}){
  const[trabajoId,setTrabajoId]=useState(trabajoPre||"");
  const[tipo,setTipo]=useState("Garantía");
  const[descripcion,setDescripcion]=useState("");
  const trabajosOrden=[...data.trabajos].sort((a,b)=>b.id-a.id);
  const guardar=async()=>{
    if(!trabajoId){toast("Selecciona un trabajo");return;}
    const trab=data.trabajos.find(t=>t.id===+trabajoId);
    const row={trabajo_id:+trabajoId,cliente_id:trab?getClienteId(trab):null,colaborador_id:trab?getColabId(trab):null,tipo,descripcion,estado:"Abierta"};
    const{data:saved}=await supabase.from('incidencias').insert(row).select();
    if(saved&&saved[0]){setData(d=>({...d,incidencias:[saved[0],...(d.incidencias||[])]}));toast("✅ Incidencia creada");onClose();}
  };
  return<div className="space-y-3">
    <div>
      <label className="text-[10px] text-gray-400 font-bold uppercase">Trabajo relacionado</label>
      <select value={trabajoId} onChange={e=>setTrabajoId(e.target.value)} className={S}>
        <option value="">— Selecciona un trabajo —</option>
        {trabajosOrden.map(t=>{const cl=data.clientes.find(c=>c.id===getClienteId(t));return<option key={t.id} value={t.id}>#{t.id} · {t.tipo} · {cl?.nombre||"—"}</option>;})}
      </select>
    </div>
    <div>
      <label className="text-[10px] text-gray-400 font-bold uppercase">Tipo</label>
      <div className="flex gap-1.5 flex-wrap mt-1">
        {["Garantía","Queja","Repetición","Otro"].map(tp=><button key={tp} onClick={()=>setTipo(tp)} className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${tipo===tp?"bg-[#1E3A5F] text-white":"bg-gray-100 text-gray-500"}`}>{tp}</button>)}
      </div>
    </div>
    <div>
      <label className="text-[10px] text-gray-400 font-bold uppercase">Descripción</label>
      <textarea value={descripcion} onChange={e=>setDescripcion(e.target.value)} rows={3} className={S+" resize-none"} placeholder="¿Qué ha pasado?"/>
    </div>
    <button onClick={guardar} className="w-full bg-[#1E3A5F] text-white py-3 rounded-xl font-bold text-sm">Crear incidencia</button>
  </div>;
}
const ADMIN_EMAIL = "samuel.sanchez@olcproperties.net";
function AdminPanel({data}){
  const[tab,setTab]=useState("resumen");
  const[periodo,setPeriodo]=useState("Todo");
  const[actividad,setActividad]=useState([]);
  useEffect(()=>{
    supabase.from('historial_trabajos').select('usuario_email,accion,created_at').then(({data})=>setActividad(data||[]));
  },[]);
  const enPeriodo=fechaStr=>{
    if(periodo==="Todo"||!fechaStr)return true;
    const d=new Date(fechaStr);
    const ahora=new Date();
    if(periodo==="Este mes")return d.getFullYear()===ahora.getFullYear()&&d.getMonth()===ahora.getMonth();
    if(periodo==="Este año")return d.getFullYear()===ahora.getFullYear();
    return true;
  };
  const clientesNuevos=data.clientes.filter(c=>enPeriodo(c.creado)).length;
  const completados=data.trabajos.filter(t=>t.estado==="Completado"&&enPeriodo(t.fecha_ultimo_estado));
  const cancelados=data.trabajos.filter(t=>t.estado==="Cancelado"&&enPeriodo(t.fecha_ultimo_estado));
  const activos=data.trabajos.filter(t=>["Aceptado","En curso"].includes(t.estado));
  const facturado=completados.reduce((s,t)=>s+(getPrecioCliente(t)||0),0);
  const pagado=completados.reduce((s,t)=>s+(getPresupColab(t)||0),0);
  const colabActivos=data.colaboradores.filter(c=>c.activo).length;
  const porUsuario=(()=>{
    const map=new Map();
    actividad.filter(a=>enPeriodo(a.created_at)).forEach(a=>{
      const key=a.usuario_email||"Desconocido";
      map.set(key,(map.get(key)||0)+1);
    });
    return[...map.entries()].sort((a,b)=>b[1]-a[1]);
  })();
  const kpis=[
    {label:"Clientes nuevos",value:clientesNuevos,cls:"bg-blue-50 text-blue-700"},
    {label:"Colaboradores activos",value:`${colabActivos} / ${data.colaboradores.length}`,cls:"bg-indigo-50 text-indigo-700"},
    {label:"Trabajos completados",value:completados.length,cls:"bg-emerald-50 text-emerald-700"},
    {label:"Trabajos activos",value:activos.length,cls:"bg-orange-50 text-orange-700"},
    {label:"Cancelados",value:cancelados.length,cls:"bg-gray-100 text-gray-600"},
    {label:"Facturado",value:eur(facturado),cls:"bg-emerald-50 text-emerald-700"},
    {label:"Pagado a colaboradores",value:eur(pagado),cls:"bg-red-50 text-red-600"},
    {label:"Beneficio",value:eur(facturado-pagado),cls:"bg-violet-50 text-violet-700"},
  ];
  return<div className="min-h-screen bg-[#F0F2F5]" style={{fontFamily:"'Inter',system-ui,sans-serif"}}>
    <header className="bg-[#1E3A5F] text-white px-4 py-3 flex items-center gap-3 sticky top-0 z-40 shadow-lg">
      <div className="w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0">A</div>
      <div className="flex-1 min-w-0"><div className="font-black text-sm leading-none">Panel de admin</div></div>
      <button onClick={()=>{window.location.pathname="/";}} className="text-xs text-blue-200 hover:text-white transition">Salir</button>
    </header>
    <main className="flex-1 px-4 py-5 max-w-2xl mx-auto w-full pb-8">
      <div className="inline-flex bg-gray-200 rounded-xl p-1 mb-4">
        <button onClick={()=>setTab("resumen")} className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${tab==="resumen"?"bg-white text-[#1E3A5F] shadow-sm":"text-gray-500"}`}>Resumen</button>
        <button onClick={()=>setTab("historial")} className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${tab==="historial"?"bg-white text-[#1E3A5F] shadow-sm":"text-gray-500"}`}>Historial</button>
      </div>
      {tab==="resumen"?<>
        <div className="flex gap-1.5 flex-wrap mb-4">
          {["Todo","Este mes","Este año"].map(p=><Pill key={p} label={p} active={periodo===p} onClick={()=>setPeriodo(p)}/>)}
        </div>
        <div className="grid grid-cols-2 gap-3 mb-5">
          {kpis.map(k=><div key={k.label} className={`rounded-2xl p-4 shadow-sm ${k.cls}`}>
            <div className="text-xl font-black">{k.value}</div>
            <div className="text-[11px] font-semibold mt-0.5 opacity-80">{k.label}</div>
          </div>)}
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <div className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">Actividad por usuario</div>
          {porUsuario.length===0&&<div className="text-sm text-gray-400 text-center py-4">Sin movimientos en este periodo</div>}
          <div className="space-y-2">
            {porUsuario.map(([email,n])=><div key={email} className="flex items-center justify-between text-sm">
              <span className="text-gray-700 truncate">{email}</span>
              <span className="font-bold text-gray-800">{n}</span>
            </div>)}
          </div>
        </div>
      </>:<Historial data={data} onBack={()=>setTab("resumen")}/>}
    </main>
  </div>;
}
const SIDEBAR_ICONS = {
  home:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M4 11 12 4l8 7"/><path d="M6 10v9a1 1 0 001 1h4v-6h2v6h4a1 1 0 001-1v-9"/></svg>,
  nuevas:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M3 13h5l1.5 2.5h5L16 13h5"/></svg>,
  demandas:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="4" height="16" rx="1"/><rect x="10" y="4" width="4" height="10" rx="1"/><rect x="16" y="4" width="4" height="13" rx="1"/></svg>,
  clientes:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="3.4"/><path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7"/></svg>,
  colaboradores:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3"/><circle cx="16.5" cy="9.5" r="2.5"/><path d="M3.5 20c0-3.6 2.6-6.2 6-6.2 2.9 0 5.2 1.9 5.8 4.5"/><path d="M14.5 14c2.4.4 4.3 2.5 4.3 5"/></svg>,
  finanzas:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20V11M10 20V5M16 20v-6M22 20H2"/></svg>,
  incidencias:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4 2.5 20h19L12 4Z"/><line x1="12" y1="10.5" x2="12" y2="15"/><circle cx="12" cy="17.3" r="0.7" fill="currentColor" stroke="none"/></svg>,
};
const SIDEBAR_GRUPOS = [
  {grupo:"General",items:[{id:"home",label:"Inicio"},{id:"nuevas",label:"Nuevas demandas"},{id:"demandas",label:"Pipeline"}]},
  {grupo:"Directorio",items:[{id:"clientes",label:"Clientes"},{id:"colaboradores",label:"Colaboradores"}]},
  {grupo:"Gestión",items:[{id:"finanzas",label:"Finanzas"},{id:"incidencias",label:"Incidencias"}]},
];
function Sidebar({sec,setSec,nuevasCount,pipelineCount,incidenciasCount}){
  const badges={nuevas:nuevasCount,demandas:pipelineCount,incidencias:incidenciasCount};
  return<aside className="w-[68px] sm:w-64 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col items-center sm:items-stretch py-5 px-2 sm:px-3.5 sticky top-0 h-screen overflow-y-auto">
    <div className="flex items-center justify-center pb-6">
      <div className="sm:hidden w-10 h-10 rounded-lg bg-[#1E3A5F] flex items-center justify-center text-white font-bold text-base flex-shrink-0">D</div>
      <img src="/logo-domia.png" alt="Domia" className="hidden sm:block h-24 w-auto max-w-full object-contain"/>
    </div>
    {SIDEBAR_GRUPOS.map(g=><div key={g.grupo} className="w-full">
      <div className="hidden sm:block text-[11px] font-bold uppercase tracking-wider text-gray-400 px-2.5 pt-4 pb-2">{g.grupo}</div>
      {g.items.map(it=>{
        const activo=sec===it.id;
        const badge=badges[it.id];
        return<button key={it.id} onClick={()=>setSec(it.id)} className={`flex items-center gap-2.5 px-0 sm:px-2.5 py-3 sm:py-2.5 rounded-lg w-full justify-center sm:justify-start text-sm font-semibold transition ${activo?"bg-[#E7EDF5] text-[#1E3A5F]":"text-gray-500 hover:bg-gray-100 hover:text-gray-800"}`}>
          {SIDEBAR_ICONS[it.id]}
          <span className="hidden sm:inline truncate">{it.label}</span>
          {badge>0&&<span className={`hidden sm:flex ml-auto text-[11px] font-bold px-1.5 h-5 min-w-[20px] rounded-full items-center justify-center ${activo?"bg-white text-[#1E3A5F]":"bg-gray-100 text-gray-500"}`}>{badge}</span>}
        </button>;
      })}
    </div>)}
    <div className="w-full pt-4">
      <button onClick={()=>window.open('/solicitar','_blank')} className="flex items-center justify-center sm:justify-start gap-2.5 w-full bg-[#1E3A5F] hover:bg-[#152d4a] text-white rounded-lg py-3 sm:py-2.5 px-0 sm:px-2.5 text-sm font-semibold transition">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        <span className="hidden sm:inline">Nueva demanda</span>
      </button>
    </div>
  </aside>;
}
export default function App(){
  const path=window.location.pathname;
  const trabajoMatch=path.match(/^\/trabajo\/(\d+)$/);
  if(trabajoMatch)return<PortalColaborador id={trabajoMatch[1]}/>;
  const clienteMatch=path.match(/^\/cliente\/(\d+)$/);
  if(clienteMatch)return<PortalCliente id={clienteMatch[1]}/>;
  if(path==="/calculadora")return<Calculadora/>;
   const aceptarMatch=path.match(/^\/aceptar\/(\d+)$/);
  if(aceptarMatch)return<AceptarPresupuesto id={aceptarMatch[1]}/>;
  const verificarMatch=path.match(/^\/verificar\/(\d+)$/);
  if(verificarMatch)return<VerificarTrabajo id={verificarMatch[1]}/>;
  if(path==="/portal")return<PortalColaboradorApp/>;
  if(path==="/alta-colaborador")return<AltaColaborador/>;
  const solicitarMatch=path==="/solicitar";
  const[autenticado,setAutenticado]=useState<boolean|null>(null);
  const[emailUsuario,setEmailUsuario]=useState<string|null>(null);
  useEffect(()=>{
    supabase.auth.getSession().then(({data})=>{setAutenticado(!!data.session);setEmailUsuario(data.session?.user?.email||null);});
  },[]);
const[data,setData]=useState({clientes:[],colaboradores:[],trabajos:[],incidencias:[]});
  const[cargando,setCargando]=useState(true);
  const[sec,setSec]=useState("home");
    const[tid,setTid]=useState(null);
  const[focoFinanzas,setFocoFinanzas]=useState(null);
  const[showNuevo,setShowNuevo]=useState(false);
  const[toastMsg,setToastMsg]=useState(null);
  const T=msg=>setToastMsg(msg);
  useEffect(()=>{
    const cargar=async()=>{
const[c,col,t,inc]=await Promise.all([supabase.from('clientes').select('*').order('id'),supabase.from('colaboradores').select('*').order('id'),supabase.from('trabajos').select('*').order('id'),supabase.from('incidencias').select('*').order('id',{ascending:false})]);
      setData({clientes:c.data||[],colaboradores:col.data||[],trabajos:(t.data||[]).map(x=>({...x,clienteId:x.cliente_id,colaboradorId:x.colaborador_id,presupuestoColaborador:x.presupuesto_colaborador,precioCliente:x.precio_cliente})),incidencias:inc.data||[]});
      setCargando(false);
    };
    cargar();  
  },[]);
  if(autenticado===null)return<div className="min-h-screen flex items-center justify-center bg-[#F0F2F5]"><div className="text-4xl">⚙️</div></div>;
  if(!autenticado)return<LoginScreen onLogin={()=>{supabase.auth.getSession().then(({data})=>{setAutenticado(true);setEmailUsuario(data.session?.user?.email||null);});}}/>;
  if(cargando)return<div className="min-h-screen flex items-center justify-center bg-[#F0F2F5]"><div className="text-center"><div className="text-4xl mb-3">⚙️</div><div className="font-bold text-gray-700">Cargando Domia CRM...</div></div></div>;
  if(path==="/admin"&&emailUsuario===ADMIN_EMAIL)return<AdminPanel data={data}/>;
  const sinAsignar=data.trabajos.filter(t=>t.estado==="Solicitud").length;
const TITULO={home:"Inicio",nuevas:"Nuevas demandas",demandas:"Pipeline",clientes:"Clientes",colaboradores:"Colaboradores",incidencias:"Incidencias"};
  const incidenciasAbiertas=(data.incidencias||[]).filter(i=>i.estado==="Abierta").length;
  const pipelineActivos=data.trabajos.filter(t=>["Presupuestando","Presupuesto enviado","Aceptado","En curso"].includes(t.estado)).length;
  return<div className="min-h-screen flex" style={{background:"#F0F2F5",fontFamily:"'Inter',system-ui,sans-serif"}}>
    <Sidebar sec={sec} setSec={setSec} nuevasCount={sinAsignar} pipelineCount={pipelineActivos} incidenciasCount={incidenciasAbiertas}/>
    <div className="flex-1 min-w-0 flex flex-col">
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center gap-3 sticky top-0 z-30">
        <div className="flex-1 min-w-0">
          <div className="font-black text-sm text-gray-800 leading-none">{TITULO[sec]||"Domia CRM"}</div>
        </div>
      </div>
      <main className={`flex-1 px-4 py-5 mx-auto w-full pb-8 ${sec==="demandas"?"max-w-[1440px]":sec==="clientes"||sec==="colaboradores"?"max-w-[1180px]":"max-w-2xl"}`}>
        {sec==="home"&&<Home data={data} setData={setData} go={setSec} setTid={setTid} toast={T}/>}
        {sec==="nuevas"&&<NuevasDemandas data={data} setData={setData} onBack={()=>setSec("home")} toast={T} onVer={id=>{setTid(id);}}/>}
        {sec==="demandas"&&<EstadoDemandas data={data} setData={setData} onBack={()=>setSec("home")} toast={T} onVer={id=>{setTid(id);}}/>}
        {sec==="clientes"&&<Clientes data={data} setData={setData} onBack={()=>setSec("home")} toast={T}/>}
        {sec==="colaboradores"&&<Colaboradores data={data} setData={setData} onBack={()=>setSec("home")} toast={T}/>}
        {sec==="finanzas"&&<Finanzas data={data} setData={setData} onBack={()=>{setSec("home");setFocoFinanzas(null);}} toast={T} focoTrabajo={focoFinanzas}/>}
        {sec==="incidencias"&&<Incidencias data={data} setData={setData} onBack={()=>setSec("home")} toast={T}/>}
      </main>
    </div>
    {showNuevo&&<Modal title="Nueva solicitud" onClose={()=>setShowNuevo(false)} wide><FormTrabajo data={data} setData={setData} onClose={()=>setShowNuevo(false)} toast={T}/></Modal>}
{tid&&<TrabajoModal tid={tid} data={data} setData={setData} onClose={()=>setTid(null)} toast={T} setSec={setSec} setFocoFinanzas={setFocoFinanzas}/>}
    {toastMsg&&<Toast msg={toastMsg} clear={()=>setToastMsg(null)}/>}
  </div>;
}
