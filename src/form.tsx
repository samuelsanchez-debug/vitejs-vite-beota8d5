import { useState } from "react";

const TIPOS = ["Fontanería","Electricidad","Albañilería","Carpintería","Pintura","Cerrajería","Climatización","Mantenimiento","Limpieza","Otros"];
const SUPABASE_URL = 'https://opijkazhbktiikdzbanb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9waWprYXpoYmt0aWlrZHpiYW5iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxNDcyNjIsImV4cCI6MjA5NzcyMzI2Mn0.HmTXEO848sPMhi2NxNxvshLxntk1EDI6D4NCMAdUINI';
const LOGO_URL = '/logo-domia.png';

export default function FormularioDomia() {
  const [paso, setPaso] = useState(1);
  const [foto, setFoto] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [form, setForm] = useState({
    nombre: "", telefono: "", email: "", direccion: "",
    tipos: [], descripcion: "",
  });
  const [errores, setErrores] = useState({});

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleTipo = (t) => {
    setForm(f => ({
      ...f,
      tipos: f.tipos.includes(t) ? f.tipos.filter(x => x !== t) : [...f.tipos, t]
    }));
    setErrores(e => ({ ...e, tipos: null }));
  };

  const validar = () => {
    const e = {};
    if (!form.nombre.trim()) e.nombre = "Nombre obligatorio";
    if (!form.telefono.trim()) e.telefono = "Teléfono obligatorio";
    if (!form.direccion.trim()) e.direccion = "Dirección obligatoria";
    if (!form.tipos.length) e.tipos = "Selecciona al menos un servicio";
    if (!form.descripcion.trim()) e.descripcion = "Describe el problema";
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const handleFoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFoto(file);
    setFotoPreview(URL.createObjectURL(file));
  };

  const enviar = async () => {
    if (!validar()) return;
    setPaso(2);
    try {
      let fotoUrl = null;
      if (foto) {
        const ext = foto.name.split('.').pop();
        const nombre = `demandas/${Date.now()}.${ext}`;
        const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/fotos-demandas/${nombre}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': foto.type,
          },
          body: foto,
        });
        if (uploadRes.ok) {
          fotoUrl = `${SUPABASE_URL}/storage/v1/object/public/fotos-demandas/${nombre}`;
        }
      }

      const clienteRes = await fetch(`${SUPABASE_URL}/rest/v1/clientes`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          nombre: form.nombre,
          telefono: form.telefono,
          email: form.email,
          direccion: form.direccion,
          notas: 'Cliente registrado desde formulario web',
          creado: new Date().toISOString().slice(0, 10),
        }),
      });
      const clienteData = await clienteRes.json();
      const clienteId = clienteData[0]?.id;

      const now = new Date();
      const historial = [{
        ts: now.toLocaleString('es-ES', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }),
        txt: 'Solicitud recibida desde formulario web',
        tipo: 'entrada'
      }];

      await fetch(`${SUPABASE_URL}/rest/v1/trabajos`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          cliente_id: clienteId,
          tipo: form.tipos.join(", "),
          descripcion: form.descripcion,
          origen: 'web',
          prioridad: 'Media',
          estado: 'Solicitud',
          fecha: now.toISOString().slice(0, 10),
          hora: now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          margen: 30,
          notas: fotoUrl ? `foto:${fotoUrl}` : '',
          historial: JSON.stringify(historial),
        }),
      });
      setPaso(3);
    } catch (err) {
      console.error(err);
      setPaso(4);
    }
  };

  const iCls = (campo) => `w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition ${errores[campo] ? 'border-red-400 bg-red-50 focus:ring-red-300' : 'border-gray-200 bg-white focus:ring-[#1E3A5F]'}`;

  if (paso === 3) return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}>
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
        <img src={LOGO_URL} alt="Domia Services" className="w-32 mx-auto mb-6 object-contain"/>
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-4xl">✅</span>
        </div>
        <h2 className="text-2xl font-black text-[#1E3A5F] mb-2">¡Solicitud enviada!</h2>
        <p className="text-gray-500 mb-6">Hemos recibido tu solicitud. Nuestro equipo se pondrá en contacto contigo en breve.</p>
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 text-left mb-6">
          <div className="text-xs font-bold text-orange-600 uppercase tracking-wide mb-2">Resumen</div>
          <div className="text-sm text-gray-700 space-y-1">
            <div><span className="font-semibold">Servicio:</span> {form.tipos.join(", ")}</div>
            <div><span className="font-semibold">Nombre:</span> {form.nombre}</div>
            <div><span className="font-semibold">Teléfono:</span> {form.telefono}</div>
          </div>
        </div>
        <div className="text-sm text-[#1E3A5F] font-semibold">📞 622 123 456</div>
        <div className="text-xs text-gray-400 mt-1">domiaservices.es · Elche</div>
      </div>
    </div>
  );

  if (paso === 4) return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}>
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-black text-gray-800 mb-2">Ha ocurrido un error</h2>
        <p className="text-gray-500 mb-6">Por favor llámanos directamente.</p>
        <a href="tel:622123456" className="bg-[#1E3A5F] text-white font-bold px-6 py-3 rounded-xl inline-block hover:bg-[#152d4a] transition">📞 622 123 456</a>
        <button onClick={() => setPaso(1)} className="block mx-auto mt-3 text-sm text-gray-400 hover:text-gray-600">Intentar de nuevo</button>
      </div>
    </div>
  );

  if (paso === 2) return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}>
      <div className="text-center">
        <img src={LOGO_URL} alt="Domia Services" className="w-24 mx-auto mb-6 object-contain"/>
        <div className="text-4xl mb-4 animate-spin">⚙️</div>
        <div className="font-bold text-[#1E3A5F]">Enviando tu solicitud...</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen py-6 px-4" style={{ background: 'linear-gradient(135deg, #1E3A5F 0%, #2d5a8e 50%, #1E3A5F 100%)' }}>
      <div className="max-w-lg mx-auto">

        {/* Header con logo */}
        <div className="text-center mb-6">
          <div className="bg-white rounded-2xl p-4 inline-block shadow-lg mb-3">
            <img src={LOGO_URL} alt="Domia Services" className="w-40 h-auto object-contain"/>
          </div>
          <p className="text-blue-200 text-sm">Solicita tu servicio p>
          <div className="flex items-center justify-center gap-4 mt-2 text-blue-300 text-xs">
            <span>✓ Presupuesto sin compromiso</span>
            <span>✓ Profesionales cualificados</span>
          </div>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-3xl shadow-2xl p-6">

          {/* Tipo de servicio - selección múltiple */}
          <div className="mb-5">
            <label className="block text-xs font-bold text-[#1E3A5F] uppercase tracking-wider mb-3">
              ¿Qué servicio necesitas? * <span className="text-gray-400 font-normal">(puedes seleccionar varios)</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TIPOS.map(t => (
                <button key={t} type="button" onClick={() => toggleTipo(t)}
                  className={`text-sm py-2.5 px-3 rounded-xl border font-semibold transition text-left flex items-center gap-2 ${form.tipos.includes(t) ? 'bg-[#1E3A5F] text-white border-[#1E3A5F]' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-[#1E3A5F] hover:bg-blue-50'}`}>
                  <span className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 text-[10px] ${form.tipos.includes(t) ? 'bg-white text-[#1E3A5F]' : 'border border-gray-300'}`}>
                    {form.tipos.includes(t) ? '✓' : ''}
                  </span>
                  {t}
                </button>
              ))}
            </div>
            {form.tipos.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {form.tipos.map(t => (
                  <span key={t} className="bg-[#1E3A5F] text-white text-xs px-2 py-0.5 rounded-full">{t}</span>
                ))}
              </div>
            )}
            {errores.tipos && <p className="text-red-500 text-xs mt-1">⚠️ {errores.tipos}</p>}
          </div>

          {/* Descripción */}
          <div className="mb-4">
            <label className="block text-xs font-bold text-[#1E3A5F] uppercase tracking-wider mb-2">Describe el problema *</label>
            <textarea className={iCls('descripcion')} rows={3}
              placeholder="Ej: Tengo una fuga de agua bajo el fregadero, lleva 2 días goteando..."
              value={form.descripcion} onChange={e => { set('descripcion', e.target.value); setErrores(x => ({ ...x, descripcion: null })); }}/>
            {errores.descripcion && <p className="text-red-500 text-xs mt-1">⚠️ {errores.descripcion}</p>}
          </div>

          {/* Foto */}
          <div className="mb-5">
            <label className="block text-xs font-bold text-[#1E3A5F] uppercase tracking-wider mb-2">Foto del problema <span className="text-gray-400 font-normal">(opcional, nos ayuda a presupuestar mejor)</span></label>
            {fotoPreview ? (
              <div className="relative">
                <img src={fotoPreview} alt="preview" className="w-full h-40 object-cover rounded-xl border border-gray-200"/>
                <button onClick={() => { setFoto(null); setFotoPreview(null); }}
                  className="absolute top-2 right-2 bg-red-500 text-white w-7 h-7 rounded-full text-sm flex items-center justify-center shadow">×</button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl py-5 cursor-pointer hover:border-[#1E3A5F] hover:bg-blue-50 transition bg-gray-50">
                <span className="text-3xl mb-1">📷</span>
                <span className="text-sm text-gray-500 font-semibold">Añadir foto</span>
                <span className="text-xs text-gray-400 mt-0.5">Toca para seleccionar o hacer foto</span>
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFoto}/>
              </label>
            )}
          </div>

          <div className="border-t border-gray-100 my-5"/>
          <h3 className="font-bold text-[#1E3A5F] text-sm mb-4">Tus datos de contacto</h3>

          <div className="mb-3">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Nombre completo *</label>
            <input className={iCls('nombre')} placeholder="Tu nombre y apellidos" value={form.nombre}
              onChange={e => { set('nombre', e.target.value); setErrores(x => ({ ...x, nombre: null })); }}/>
            {errores.nombre && <p className="text-red-500 text-xs mt-1">⚠️ {errores.nombre}</p>}
          </div>

          <div className="mb-3">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Teléfono *</label>
            <input className={iCls('telefono')} placeholder="612 345 678" type="tel" value={form.telefono}
              onChange={e => { set('telefono', e.target.value); setErrores(x => ({ ...x, telefono: null })); }}/>
            {errores.telefono && <p className="text-red-500 text-xs mt-1">⚠️ {errores.telefono}</p>}
          </div>

          <div className="mb-3">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Email <span className="text-gray-400 font-normal">(opcional)</span></label>
            <input className={iCls('email')} placeholder="tu@email.com" type="email" value={form.email}
              onChange={e => set('email', e.target.value)}/>
          </div>

          <div className="mb-6">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Dirección del servicio *</label>
            <input className={iCls('direccion')} placeholder="Calle, número, piso — Localidad" value={form.direccion}
              onChange={e => { set('direccion', e.target.value); setErrores(x => ({ ...x, direccion: null })); }}/>
            {errores.direccion && <p className="text-red-500 text-xs mt-1">⚠️ {errores.direccion}</p>}
          </div>

          <button onClick={enviar}
            className="w-full text-white font-black py-4 rounded-2xl text-base transition shadow-lg active:scale-95"
            style={{ background: 'linear-gradient(135deg, #1E3A5F, #2d5a8e)' }}>
            Enviar solicitud →
          </button>

          <p className="text-center text-xs text-gray-400 mt-3">
            🔒 Tus datos están seguros y solo se usarán para gestionar tu solicitud.
          </p>
        </div>

        <div className="text-center mt-5 text-blue-200 text-xs space-y-1">
          <p>📍 Elche · 📞 685 917 059 · 🌐 domiaservices.es</p>
        
        </div>
      </div>
    </div>
  );
}
