'use client';
import { useState } from 'react';
import UpgradeModal from '@/components/patient/UpgradeModal';
import { hasAccess } from '@/lib/plans';

// Mock — René reemplaza con datos reales
const USER_PLAN = 'free'; // 'free' | 'plus' | 'family'
const USER_GENDER: string = 'femenino'; // del perfil del paciente — René reemplaza con dato real
const STREAK = 7;
const STREAK_DAYS = [true, true, true, true, true, false, false];
const DIAS = ['L','M','X','J','V','S','D'];
const ANIMO_EMOJIS = ['😢','😕','😐','🙂','😄'];

const MOCK_ITEMS = [
  { id: 1, desc: 'Amitriptilina 25mg', hora: '22:00', cumplida: false, notas: 'Antes de dormir' },
  { id: 2, desc: 'Angeliq', hora: '08:00', cumplida: true, notas: 'En ayunas' },
  { id: 3, desc: 'Eliminar cigarro', hora: '', cumplida: false, notas: '' },
];

export default function DiaryPage() {
  const [items, setItems] = useState(MOCK_ITEMS);
  const [popping, setPopping] = useState<number|null>(null);
  const [allDone, setAllDone] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState<string|null>(null);

  // Básicos (free)
  const [animo, setAnimo] = useState<number|null>(null);
  const [dolor, setDolor] = useState(0);
  const [sintoma, setSintoma] = useState('');
  const [saved, setSaved] = useState(false);

  // Avanzados (plus) — sueño detallado
  const [horaAcostar, setHoraAcostar] = useState('');
  const [horaLevantarse, setHoraLevantarse] = useState('');
  const [vecesDespertado, setVecesDespertado] = useState(0);
  const [calidadSueno, setCalidadSueno] = useState<number|null>(null);

  // Avanzados (plus) — más síntomas
  const [energia, setEnergia] = useState<number|null>(null);
  const [estres, setEstres] = useState<number|null>(null);
  const [vasos, setVasos] = useState(0);
  const [ejercicioHoy, setEjercicioHoy] = useState<boolean|null>(null);
  const [ejercicioMin, setEjercicioMin] = useState(0);

  // Síntomas por género (plus)
  const [bochornos, setBochornos] = useState(0);
  const [dolorPelvico, setDolorPelvico] = useState(0);
  const [ciclo, setCiclo] = useState('');

  const done = items.filter(i => i.cumplida).length;
  const pct = items.length ? Math.round((done/items.length)*100) : 0;

  // Calcular horas de sueño
  function calcHorasSueno(): string {
    if (!horaAcostar || !horaLevantarse) return '';
    const [h1, m1] = horaAcostar.split(':').map(Number);
    const [h2, m2] = horaLevantarse.split(':').map(Number);
    let mins = (h2*60+m2) - (h1*60+m1);
    if (mins < 0) mins += 24*60;
    const h = Math.floor(mins/60);
    const m = mins%60;
    return `${h}h ${m > 0 ? m+'min' : ''}`.trim();
  }

  async function mark(id: number) {
    setPopping(id); setTimeout(()=>setPopping(null), 400);
    const updated = items.map(i => i.id===id ? {...i, cumplida:true} : i);
    setItems(updated);
    if (updated.every(i=>i.cumplida)) {
      setAllDone(true);
      try { const c=(await import('canvas-confetti')).default; c({particleCount:120,spread:80,origin:{y:.6},colors:['#0E8A7A','#1B3A6B','#7DD3C8']}); } catch{}
    }
  }

  function gatePlus(feature: string) {
    if (!hasAccess(USER_PLAN as any, feature)) { setUpgradeFeature(feature); return false; }
    return true;
  }

  async function save() {
    setSaved(true);
    setTimeout(()=>setSaved(false), 2500);
  }

  const today = new Date().toLocaleDateString('es-PA', {weekday:'long',day:'numeric',month:'long'});

  return (
    <div style={s.page}>
      {upgradeFeature && <UpgradeModal feature={upgradeFeature} onClose={()=>setUpgradeFeature(null)} />}

      <h1 style={s.h1}>Mi Diario de Salud</h1>
      <p style={s.sub}>📅 {today.charAt(0).toUpperCase()+today.slice(1)}</p>

      {/* Banner completado */}
      {allDone && (
        <div style={s.doneBanner}>
          <span style={{fontSize:28}}>🎉</span>
          <div><b style={{fontSize:15}}>¡Completaste todo hoy!</b><br/><small>Racha: {STREAK} días 🔥</small></div>
        </div>
      )}

      {/* Progreso */}
      {!allDone && items.length > 0 && (
        <div style={s.card}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
            <span style={{fontSize:13,fontWeight:600,color:'#1B3A6B'}}>{done} de {items.length} indicaciones</span>
            <span style={{fontSize:13,fontWeight:700,color:'#0E8A7A'}}>{pct}%</span>
          </div>
          <div style={{height:10,background:'#EEF0F4',borderRadius:10,overflow:'hidden'}}>
            <div style={{height:'100%',width:`${pct}%`,background:'linear-gradient(to right,#0E8A7A,#16A34A)',borderRadius:10,transition:'width .4s'}} />
          </div>
        </div>
      )}

      {/* Checklist */}
      <div style={s.card}>
        <div style={s.cardLabel}>💊 Indicaciones de hoy</div>
        {items.map(item => (
          <div key={item.id} style={{...s.item, background:item.cumplida?'#E0F5F2':'#fff', transform:popping===item.id?'scale(1.02)':'scale(1)', transition:'all .2s'}}>
            <div style={{flex:1}}>
              <div style={{fontWeight:600,fontSize:14,color:item.cumplida?'#7B8499':'#111827',textDecoration:item.cumplida?'line-through':'none'}}>{item.desc}</div>
              <div style={{fontSize:11,color:'#7B8499',marginTop:2}}>{item.hora&&`${item.hora} · `}{item.notas}</div>
            </div>
            {item.cumplida
              ? <div style={{width:32,height:32,borderRadius:'50%',background:'#0E8A7A',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700}}>✓</div>
              : <button style={s.markBtn} onClick={()=>mark(item.id)}>Marcar</button>}
          </div>
        ))}
      </div>

      {/* Racha */}
      <div style={s.card}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
          <span style={{fontSize:22}}>🔥</span>
          <b style={{color:'#1B3A6B'}}>{STREAK} días seguidos</b>
        </div>
        <div style={{display:'flex',gap:8,justifyContent:'space-between'}}>
          {DIAS.map((d,i)=>(
            <div key={d} style={{textAlign:'center' as const}}>
              <div style={{width:34,height:34,borderRadius:'50%',background:STREAK_DAYS[i]?'#0E8A7A':'#EEF0F4',marginBottom:4}} />
              <span style={{fontSize:9,color:'#7B8499',fontWeight:600}}>{d}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── BIENESTAR BÁSICO (FREE) ── */}
      <div style={s.card}>
        <div style={s.cardLabel}>🌡️ ¿Cómo estás hoy? <span style={s.freeBadge}>Free</span></div>

        {/* Ánimo */}
        <div style={{marginBottom:18}}>
          <div style={s.fieldLabel}>Estado de ánimo</div>
          <div style={{display:'flex',gap:10,justifyContent:'space-between'}}>
            {ANIMO_EMOJIS.map((e,i)=>(
              <button key={i} onClick={()=>setAnimo(i+1)} style={{flex:1,padding:'8px 4px',borderRadius:10,border:`2px solid ${animo===i+1?'#1B3A6B':'#EEF0F4'}`,background:animo===i+1?'#EBF1FB':'transparent',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:2,fontFamily:"'Sora',sans-serif"}}>
                <span style={{fontSize:26}}>{e}</span>
                <span style={{fontSize:10,color:'#7B8499'}}>{i+1}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Dolor */}
        <div style={{marginBottom:18}}>
          <div style={{...s.fieldLabel,display:'flex',justifyContent:'space-between'}}>
            <span>Nivel de dolor</span>
            <b style={{color:dolor>=7?'#C0392B':dolor>=4?'#D97706':'#0E8A7A'}}>{dolor}/10</b>
          </div>
          <input type="range" min={0} max={10} step={1} value={dolor} onChange={e=>setDolor(Number(e.target.value))} style={{width:'100%',accentColor:dolor>=7?'#C0392B':dolor>=4?'#D97706':'#0E8A7A'}} />
          {dolor>=7 && <div style={{background:'#FDEAEA',border:'1px solid #C0392B',borderRadius:8,padding:'8px 12px',fontSize:12,color:'#C0392B',marginTop:8}}>⚠️ Se alertará a tu doctor</div>}
        </div>

        {/* Sueño básico free */}
        <div style={{marginBottom:18}}>
          <div style={s.fieldLabel}>Calidad del sueño (básico)</div>
          <div style={{display:'flex',gap:6}}>
            {[1,2,3,4,5].map(n=>(
              <button key={n} onClick={()=>setCalidadSueno(n)} style={{fontSize:28,color:(calidadSueno??0)>=n?'#D97706':'#D5DAE4',cursor:'pointer',background:'none',border:'none',padding:0,lineHeight:1}}>★</button>
            ))}
          </div>
        </div>

        {/* Síntoma libre */}
        <div>
          <div style={s.fieldLabel}>¿Algún síntoma hoy?</div>
          <textarea style={s.ta} placeholder="Describe cómo te sientes..." value={sintoma} onChange={e=>setSintoma(e.target.value)} rows={2} />
        </div>
      </div>

      {/* ── SUEÑO DETALLADO (PLUS) ── */}
      <div style={{...s.card, ...(hasAccess(USER_PLAN as any,'sueno_detallado')?{}:s.lockedCard)}}>
        <div style={s.cardLabel}>
          😴 Sueño detallado
          {hasAccess(USER_PLAN as any,'sueno_detallado')
            ? <span style={s.plusBadge}>Plus</span>
            : <button style={s.lockBtn} onClick={()=>setUpgradeFeature('sueno_detallado')}>🔒 Plus</button>}
        </div>

        {hasAccess(USER_PLAN as any,'sueno_detallado') ? (
          <div>
            <div style={s.suenGrid}>
              <div>
                <div style={s.fieldLabel}>Me acosté a las</div>
                <input type="time" style={s.inp} value={horaAcostar} onChange={e=>setHoraAcostar(e.target.value)} />
              </div>
              <div>
                <div style={s.fieldLabel}>Me levanté a las</div>
                <input type="time" style={s.inp} value={horaLevantarse} onChange={e=>setHoraLevantarse(e.target.value)} />
              </div>
            </div>
            {calcHorasSueno() && (
              <div style={{background:'#E0F5F2',borderRadius:8,padding:'8px 12px',fontSize:13,fontWeight:600,color:'#0E8A7A',marginBottom:12}}>
                ⏱️ Dormiste {calcHorasSueno()}
                {Number(calcHorasSueno().split('h')[0]) < 6 && ' — considera acostarte más temprano 🌙'}
              </div>
            )}
            <div style={s.fieldLabel}>¿Cuántas veces te despertaste?</div>
            <div style={{display:'flex',gap:8}}>
              {[0,1,2,'3+'].map((n,i)=>(
                <button key={i} onClick={()=>setVecesDespertado(i)} style={{flex:1,padding:'10px 0',borderRadius:8,border:`2px solid ${vecesDespertado===i?'#1B3A6B':'#EEF0F4'}`,background:vecesDespertado===i?'#EBF1FB':'transparent',fontSize:14,fontWeight:600,cursor:'pointer',color:vecesDespertado===i?'#1B3A6B':'#7B8499',fontFamily:"'Sora',sans-serif"}}>
                  {n}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={s.lockOverlay} onClick={()=>setUpgradeFeature('sueno_detallado')}>
            <div style={{fontSize:32,marginBottom:8}}>😴</div>
            <div style={{fontWeight:600,fontSize:14,color:'#1B3A6B',marginBottom:4}}>Hora acostarse · Hora levantarse · Veces despertado</div>
            <div style={{fontSize:12,color:'#7B8499'}}>Análisis completo de tu sueño con Plus</div>
          </div>
        )}
      </div>

      {/* ── SÍNTOMAS AVANZADOS (PLUS) ── */}
      <div style={{...s.card,...(hasAccess(USER_PLAN as any,'diario_avanzado')?{}:s.lockedCard)}}>
        <div style={s.cardLabel}>
          📊 Bienestar avanzado
          {hasAccess(USER_PLAN as any,'diario_avanzado')
            ? <span style={s.plusBadge}>Plus</span>
            : <button style={s.lockBtn} onClick={()=>setUpgradeFeature('diario_avanzado')}>🔒 Plus</button>}
        </div>

        {hasAccess(USER_PLAN as any,'diario_avanzado') ? (
          <div>
            {/* Energía */}
            <div style={{marginBottom:16}}>
              <div style={s.fieldLabel}>Energía general</div>
              <div style={{display:'flex',gap:8}}>
                {['Muy baja','Baja','Normal','Alta','Muy alta'].map((label,i)=>(
                  <button key={i} onClick={()=>setEnergia(i+1)} style={{flex:1,padding:'8px 4px',borderRadius:8,border:`2px solid ${energia===i+1?'#0E8A7A':'#EEF0F4'}`,background:energia===i+1?'#E0F5F2':'transparent',fontSize:10,fontWeight:600,cursor:'pointer',color:energia===i+1?'#0E8A7A':'#7B8499',fontFamily:"'Sora',sans-serif"}}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Estrés */}
            <div style={{marginBottom:16}}>
              <div style={{...s.fieldLabel,display:'flex',justifyContent:'space-between'}}>
                <span>Estrés del día</span>
                <b style={{color:estres&&estres>=4?'#C0392B':'#0E8A7A'}}>{estres ? `${estres}/5` : '—'}</b>
              </div>
              <div style={{display:'flex',gap:8}}>
                {[1,2,3,4,5].map(n=>(
                  <button key={n} onClick={()=>setEstres(n)} style={{flex:1,height:36,borderRadius:8,border:`2px solid ${estres===n?'#1B3A6B':'#EEF0F4'}`,background:estres===n?'#EBF1FB':'transparent',fontSize:14,fontWeight:700,cursor:'pointer',color:estres===n?'#1B3A6B':'#7B8499',fontFamily:"'Sora',sans-serif"}}>
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Hidratación */}
            <div style={{marginBottom:16}}>
              <div style={{...s.fieldLabel,display:'flex',justifyContent:'space-between'}}>
                <span>💧 Vasos de agua hoy</span>
                <b style={{color:'#2D5FA6'}}>{vasos}</b>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <button onClick={()=>setVasos(v=>Math.max(0,v-1))} style={{width:36,height:36,borderRadius:'50%',border:'2px solid #EEF0F4',background:'#fff',fontSize:18,cursor:'pointer',fontFamily:"'Sora',sans-serif",display:'flex',alignItems:'center',justifyContent:'center'}}>−</button>
                <div style={{flex:1,display:'flex',gap:4}}>
                  {Array.from({length:8}).map((_,i)=>(
                    <div key={i} style={{flex:1,height:24,borderRadius:4,background:i<vasos?'#2D5FA6':'#EEF0F4',transition:'background .15s'}} />
                  ))}
                </div>
                <button onClick={()=>setVasos(v=>Math.min(8,v+1))} style={{width:36,height:36,borderRadius:'50%',border:'2px solid #EEF0F4',background:'#fff',fontSize:18,cursor:'pointer',fontFamily:"'Sora',sans-serif",display:'flex',alignItems:'center',justifyContent:'center'}}>+</button>
              </div>
            </div>

            {/* Ejercicio */}
            <div style={{marginBottom:16}}>
              <div style={s.fieldLabel}>🏃 ¿Hiciste ejercicio hoy?</div>
              <div style={{display:'flex',gap:8}}>
                {[{v:true,l:'Sí'},{v:false,l:'No'}].map(opt=>(
                  <button key={opt.l} onClick={()=>setEjercicioHoy(opt.v)} style={{flex:1,padding:'10px',borderRadius:8,border:`2px solid ${ejercicioHoy===opt.v?'#0E8A7A':'#EEF0F4'}`,background:ejercicioHoy===opt.v?'#E0F5F2':'transparent',fontSize:14,fontWeight:600,cursor:'pointer',color:ejercicioHoy===opt.v?'#0E8A7A':'#7B8499',fontFamily:"'Sora',sans-serif"}}>
                    {opt.l}
                  </button>
                ))}
              </div>
              {ejercicioHoy && (
                <div style={{marginTop:10}}>
                  <div style={s.fieldLabel}>¿Cuántos minutos?</div>
                  <input type="number" style={{...s.inp,width:120}} min={0} max={300} value={ejercicioMin} onChange={e=>setEjercicioMin(Number(e.target.value))} placeholder="30" />
                </div>
              )}
            </div>

            {/* Síntomas por género */}
            {USER_GENDER === 'femenino' && (
              <div>
                <div style={{...s.cardLabel, marginTop:8, marginBottom:12}}>🌸 Síntomas ginecológicos</div>
                <div style={{marginBottom:12}}>
                  <div style={s.fieldLabel}>¿Estás en tu período?</div>
                  <div style={{display:'flex',gap:8}}>
                    {['No','Sí — flujo normal','Sí — flujo abundante','Sí — flujo escaso'].map((opt,i)=>(
                      <button key={i} onClick={()=>setCiclo(opt)} style={{flex:1,padding:'8px 4px',borderRadius:8,border:`2px solid ${ciclo===opt?'#7C3AED':'#EEF0F4'}`,background:ciclo===opt?'#F5F3FF':'transparent',fontSize:10,fontWeight:500,cursor:'pointer',color:ciclo===opt?'#7C3AED':'#7B8499',fontFamily:"'Sora',sans-serif"}}>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{marginBottom:12}}>
                  <div style={{...s.fieldLabel,display:'flex',justifyContent:'space-between'}}>
                    <span>Bochornos / calores hoy</span>
                    <b style={{color:'#D97706'}}>{bochornos}/5</b>
                  </div>
                  <input type="range" min={0} max={5} step={1} value={bochornos} onChange={e=>setBochornos(Number(e.target.value))} style={{width:'100%',accentColor:'#D97706'}} />
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:'#7B8499'}}>
                    <span>Ninguno</span><span>Muy frecuentes</span>
                  </div>
                </div>
                <div>
                  <div style={{...s.fieldLabel,display:'flex',justifyContent:'space-between'}}>
                    <span>Dolor pélvico o cólicos</span>
                    <b style={{color:dolorPelvico>=4?'#C0392B':'#0E8A7A'}}>{dolorPelvico}/10</b>
                  </div>
                  <input type="range" min={0} max={10} step={1} value={dolorPelvico} onChange={e=>setDolorPelvico(Number(e.target.value))} style={{width:'100%',accentColor:'#7C3AED'}} />
                </div>
              </div>
            )}

            {USER_GENDER === 'masculino' && (
              <div>
                <div style={{...s.cardLabel, marginTop:8, marginBottom:12}}>🔵 Síntomas específicos</div>
                <div style={{marginBottom:12}}>
                  <div style={s.fieldLabel}>Dificultad para orinar hoy</div>
                  <div style={{display:'flex',gap:8}}>
                    {['Ninguna','Leve','Moderada','Frecuente'].map((opt,i)=>(
                      <button key={i} style={{flex:1,padding:'8px 4px',borderRadius:8,border:'2px solid #EEF0F4',background:'transparent',fontSize:10,cursor:'pointer',fontFamily:"'Sora',sans-serif",color:'#7B8499'}}>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={s.lockOverlay} onClick={()=>setUpgradeFeature('diario_avanzado')}>
            <div style={{fontSize:32,marginBottom:8}}>📊</div>
            <div style={{fontWeight:600,fontSize:14,color:'#1B3A6B',marginBottom:4}}>Energía · Estrés · Hidratación · Síntomas por género</div>
            <div style={{fontSize:12,color:'#7B8499'}}>Seguimiento completo con Plus</div>
          </div>
        )}
      </div>

      {/* Guardar */}
      <button onClick={save} style={{width:'100%',padding:'14px',background:saved?'#16A34A':'linear-gradient(135deg,#1B3A6B,#2D5FA6)',color:'#fff',border:'none',borderRadius:12,fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:"'Sora',sans-serif",marginBottom:32}}>
        {saved ? '✓ Registro guardado' : 'Guardar registro de hoy'}
      </button>
    </div>
  );
}

const s: Record<string,React.CSSProperties> = {
  page: {padding:'28px 32px',maxWidth:680,fontFamily:"'Sora',sans-serif"},
  h1: {fontFamily:"'Lora',serif",fontSize:26,fontWeight:600,color:'#1B3A6B',marginBottom:4},
  sub: {fontSize:13,color:'#7B8499',marginBottom:20},
  doneBanner: {background:'linear-gradient(135deg,#0E8A7A,#16A34A)',borderRadius:16,padding:'16px 20px',display:'flex',alignItems:'center',gap:12,marginBottom:20,color:'#fff'},
  card: {background:'#fff',borderRadius:16,padding:'18px 20px',marginBottom:16,boxShadow:'0 1px 6px rgba(27,58,107,0.07)'},
  lockedCard: {background:'#FAFAFA',border:'1.5px dashed #D5DAE4'},
  cardLabel: {fontSize:11,fontWeight:700,textTransform:'uppercase' as const,letterSpacing:.5,color:'#7B8499',marginBottom:14,display:'flex',alignItems:'center',gap:8},
  freeBadge: {background:'#DCFCE7',color:'#16A34A',fontSize:9,fontWeight:700,padding:'2px 7px',borderRadius:100},
  plusBadge: {background:'#EBF1FB',color:'#1B3A6B',fontSize:9,fontWeight:700,padding:'2px 7px',borderRadius:100},
  lockBtn: {background:'#EBF1FB',color:'#1B3A6B',fontSize:10,fontWeight:700,padding:'3px 10px',borderRadius:100,border:'none',cursor:'pointer',fontFamily:"'Sora',sans-serif"},
  lockOverlay: {display:'flex',flexDirection:'column' as const,alignItems:'center',padding:'20px 0',cursor:'pointer',opacity:.7},
  fieldLabel: {fontSize:12,fontWeight:600,color:'#3D4457',marginBottom:8},
  item: {display:'flex',alignItems:'center',gap:12,padding:'11px 10px',borderRadius:10,marginBottom:8,border:'1px solid #EEF0F4'},
  markBtn: {padding:'8px 14px',background:'#1B3A6B',color:'#fff',border:'none',borderRadius:8,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:"'Sora',sans-serif"},
  suenGrid: {display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12},
  inp: {width:'100%',padding:'10px 12px',border:'2px solid #EEF0F4',borderRadius:8,fontSize:14,fontFamily:"'Sora',sans-serif",color:'#111827',background:'#F8F9FB',outline:'none',boxSizing:'border-box' as const},
  ta: {width:'100%',padding:'10px 12px',border:'2px solid #EEF0F4',borderRadius:8,fontSize:13,fontFamily:"'Sora',sans-serif",color:'#111827',background:'#F8F9FB',outline:'none',resize:'vertical' as const,boxSizing:'border-box' as const},
};
