import { useState } from "react";
const TIPOS = ["Fontanería","Electricidad","Albañilería","Carpintería","Pintura","Cerrajería","Climatización","Mantenimiento","Jardinería","Limpieza","Otros"];
const SUPABASE_URL = 'https://opijkazhbktiikdzbanb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9waWprYXpoYmt0aWlrZHpiYW5iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxNDcyNjIsImV4cCI6MjA5NzcyMzI2Mn0.HmTXEO848sPMhi2NxNxvshLxntk1EDI6D4NCMAdUINI';

export default function AltaColaborador() {
  const [paso, setPaso] = useState(1);
  const [form, setForm] = useState({ nombre:"", telefono:"", email:"", zona:"", especialidades:[], experiencia:"" });
  const [errores, setErrores] = useState({});
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const toggleEsp = (t) => setForm(f=>({...f, especialidades: f.especialidades.includes(t)?f.especialidades.filter(x=>x!==t):[...f.especialidades,t]}));
  const validar = () => {
    const e = {};
    if(!form.nombre.trim()) e.nombre="Nombre obligatorio";
    if(!form.telefono.trim()) e.telefono="Teléfono obligatorio";
    if(!form.email.trim()) e.email="Email obligatorio";
    if(form.especialidades.length===0) e.especialidades="Elige al menos una";
    setErrores(e);
    return Object.keys(e).length===0;
  };
  const enviar = async () => {
    if(!validar()) return;
    setPaso(2);
    try {
      let tel = form.telefono.replace(/\s/g,'');
      if(tel && !tel.startsWith('+')) tel = '+34'+tel;
      await fetch(`${SUPABASE_URL}/rest/v1/solicitudes_colaborador`, {
        method:'POST',
        headers:{ 'apikey':SUPABASE_KEY, 'Authorization':`Bearer ${SUPABASE_KEY}`, 'Content-Type':'application/json' },
        body: JSON.stringify({
          nombre: form.nombre,
          telefono: tel,
          email: form.email,
          zona: form.zona,
          especialidades: form.especialidades.join(", "),
          experiencia: form.experiencia,
          estado: 'Pendiente',
        }),
      });
      setPaso(3);
    } catch(err) { console.error(err); setPaso(4); }
  };
  const S = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]";

  if(paso===2) return <div className="min-h-screen flex items-center justify-center bg-[#F0F2F5]"><div className="text-center"><div className="text-4xl mb-3">⚙️</div><div className="font-bold text-gray-700">Enviando...</div></div></div>;
  if(paso===3) return <div className="min-h-screen flex items-center justify-center bg-[#F0F2F5] p-4"><div className="bg-white rounded-2xl p-8 text-center max-w-sm shadow-sm border border-gray-100"><div className="text-6xl mb-4">✅</div><div className="text-xl font-black text-gray-800 mb-2">¡Solicitud enviada!</div><div className="text-gray-500 text-sm">Revisaremos tu perfil y te contactaremos pronto para darte de alta.</div><div className="mt-4 text-xs text-gray-400">Domia Services</div></div></div>;
  if(paso===4) return <div className="min-h-screen flex items-center justify-center bg-[#F0F2F5] p-4"><div className="bg-white rounded-2xl p-8 text-center max-w-sm shadow-sm border border-gray-100"><div className="text-6xl mb-4">❌</div><div className="text-xl font-black text-gray-800 mb-2">Algo falló</div><div className="text-gray-500 text-sm">Inténtalo de nuevo o escríbenos al 685 917 059.</div></div></div>;

  return <div className="min-h-screen bg-[#F0F2F5]" style={{fontFamily:"'Inter',system-ui,sans-serif"}}>
    <div className="bg-[#1E3A5F] px-5 py-6 text-white text-center">
      <img src="/logo-domia.png" alt="Domia" className="w-20 mx-auto mb-2"/>
      <div className="text-lg font-black">Únete a Domia Services</div>
      <div className="text-blue-200 text-xs mt-1">Regístrate como colaborador profesional</div>
    </div>
    <div className="px-4 py-6 max-w-md mx-auto space-y-4">
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Nombre completo *</label>
          <input className={S} value={form.nombre} onChange={e=>set("nombre",e.target.value)}/>
          {errores.nombre&&<div className="text-red-500 text-xs mt-1">{errores.nombre}</div>}
        </div>
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Teléfono *</label>
          <input className={S} value={form.telefono} onChange={e=>set("telefono",e.target.value)} placeholder="655 844 635"/>
          {errores.telefono&&<div className="text-red-500 text-xs mt-1">{errores.telefono}</div>}
        </div>
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Email *</label>
          <input className={S} type="email" value={form.email} onChange={e=>set("email",e.target.value)}/>
          {errores.email&&<div className="text-red-500 text-xs mt-1">{errores.email}</div>}
        </div>
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Zona de trabajo</label>
          <input className={S} value={form.zona} onChange={e=>set("zona",e.target.value)} placeholder="Ej: Elche y alrededores"/>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Especialidades *</label>
          <div className="flex flex-wrap gap-1.5">
            {TIPOS.map(t=><button key={t} type="button" onClick={()=>toggleEsp(t)} className={`text-xs px-2.5 py-1 rounded-full border transition ${form.especialidades.includes(t)?"bg-[#1E3A5F] text-white border-[#1E3A5F]":"bg-white text-gray-500 border-gray-200"}`}>{t}</button>)}
          </div>
          {errores.especialidades&&<div className="text-red-500 text-xs mt-1">{errores.especialidades}</div>}
        </div>
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Experiencia (opcional)</label>
          <textarea className={S} rows={3} value={form.experiencia} onChange={e=>set("experiencia",e.target.value)} placeholder="Cuéntanos brevemente tu experiencia..."/>
        </div>
      </div>
      <button onClick={enviar} className="w-full bg-[#1E3A5F] hover:bg-[#152d4a] text-white py-3 rounded-xl font-bold text-sm transition">Enviar solicitud</button>
      <div className="text-center text-xs text-gray-400 pb-4">Domia Services · Elche, Alicante</div>
    </div>
  </div>;
}
