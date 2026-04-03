'use client';
import { useState, useRef, useEffect } from 'react';
import { SPECIALISTS } from '@/lib/specialists';
import type { ChatMessage, Specialist } from '@/lib/types';

const CTX = { nombre: 'Alejandra', edad: 38, condiciones: 'Perimenopausia', medicamentos: 'Amitriptilina, Angeliq', indicaciones: 'Amitriptilina 22:00, Angeliq 08:00' };

const WELCOME: Record<string, string> = {
  dani: '¡Hola! Soy Dani, tu guía de bienestar. ¿Cómo te has sentido hoy?',
  nutricion: '¡Hola! Soy Marco. ¿En qué te puedo ayudar con tu alimentación?',
  'salud-mental': '¡Hola! Soy Luna. Estoy aquí para escucharte. ¿Cómo estás?',
  movimiento: '¡Hola! Soy Rio. ¿Listo/a para movernos?',
  medicamentos: '¡Hola! Soy Farma. ¿Tienes dudas sobre tus medicamentos?',
  sueno: '¡Hola! Soy Nox. ¿Cómo has dormido últimamente?',
};

export default function ChatPage() {
  const [activeId, setActiveId] = useState('dani');
  const [actives, setActives] = useState(['dani']);
  const [msgs, setMsgs] = useState<Record<string, ChatMessage[]>>({ dani: [{ role: 'assistant', content: WELCOME['dani'] }] });
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState('');
  const [modal, setModal] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const cur = msgs[activeId] ?? [];
  const sp = SPECIALISTS.find(s => s.id === activeId);
  const available = SPECIALISTS.filter(s => !actives.includes(s.id));

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [cur, streamText]);

  function switchTo(id: string) {
    setActiveId(id);
    if (!msgs[id]) setMsgs(p => ({ ...p, [id]: [{ role: 'assistant', content: WELCOME[id] ?? WELCOME['dani'] }] }));
  }

  function addSpec(id: string) {
    setActives(p => [...p, id]);
    setMsgs(p => ({ ...p, [id]: [{ role: 'assistant', content: WELCOME[id] ?? WELCOME['dani'] }] }));
    setActiveId(id);
    setModal(false);
  }

  async function send() {
    if (!input.trim() || streaming) return;
    const content = input.trim(); setInput('');
    const newMsgs: ChatMessage[] = [...cur, { role: 'user', content }];
    setMsgs(p => ({ ...p, [activeId]: newMsgs }));
    setStreaming(true); setStreamText('');
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMsgs, specialistId: activeId, patientContext: CTX }),
      });
      if (!res.ok || !res.body) throw new Error('Sin respuesta');
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let ai = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of dec.decode(value).split('\n').filter(l => l.startsWith('data: '))) {
          try {
            const d = JSON.parse(line.slice(6));
            if (d.type === 'delta') { ai += d.text; setStreamText(ai); }
            if (d.type === 'error') { ai = `Error: ${d.message}`; setStreamText(ai); }
          } catch { }
        }
      }
      setMsgs(p => ({ ...p, [activeId]: [...newMsgs, { role: 'assistant', content: ai || 'No hay respuesta.' }] }));
    } catch {
      setMsgs(p => ({ ...p, [activeId]: [...newMsgs, { role: 'assistant', content: 'Error de conexión. Intenta de nuevo.' }] }));
    } finally { setStreaming(false); setStreamText(''); }
  }

  return (
    <div style={s.page}>
      <div style={s.hdr}>
        <a href="/patient" style={{ fontSize: 13, color: '#7B8499', textDecoration: 'none' }}>← Inicio</a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: sp?.color }} />
          <div>
            <b style={{ fontSize: 15, color: '#1B3A6B' }}>{sp?.emoji} {sp?.nombre}</b>
            <div style={{ fontSize: 11, color: '#0E8A7A' }}>En línea</div>
          </div>
        </div>
      </div>

      <div style={s.bar}>
        {actives.map(id => {
          const sp2 = SPECIALISTS.find(s => s.id === id);
          if (!sp2) return null;
          return (
            <button key={id} onClick={() => switchTo(id)}
              style={{ ...s.chip, background: activeId === id ? sp2.color : '#EEF0F4', color: activeId === id ? '#fff' : '#7B8499', border: `2px solid ${activeId === id ? sp2.color : 'transparent'}` }}>
              {sp2.emoji} {sp2.nombre.split(' — ')[0]}
            </button>
          );
        })}
        <button onClick={() => setModal(true)} style={s.addChip}>+ Agregar</button>
      </div>

      <div style={s.msgs}>
        {cur.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
            {m.role === 'assistant' && <div style={{ ...s.av, background: sp?.color }}>{sp?.emoji}</div>}
            <div style={m.role === 'user' ? s.uBubble : s.aBubble}>{m.content}</div>
          </div>
        ))}
        {streaming && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 12 }}>
            <div style={{ ...s.av, background: sp?.color }}>{sp?.emoji}</div>
            <div style={s.aBubble}>{streamText || '● ● ●'}<span style={{ opacity: .4 }}>▋</span></div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div style={s.inputRow}>
        <input style={s.inp} value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder={`Escribe a ${sp?.nombre?.split(' — ')[0]}...`} disabled={streaming} />
        <button onClick={send} disabled={!input.trim() || streaming}
          style={{ ...s.sendBtn, background: input.trim() && !streaming ? '#1B3A6B' : '#D5DAE4' }}>→</button>
      </div>
      <p style={{ fontSize: 11, color: '#7B8499', textAlign: 'center', padding: '0 20px 16px', margin: 0 }}>
        {sp?.nombre} no sustituye a tu médico.
      </p>

      {modal && (
        <div style={s.overlay} onClick={() => setModal(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <b style={{ fontFamily: "'Lora',serif", fontSize: 18, color: '#1B3A6B' }}>Agregar especialista</b>
            <p style={{ fontSize: 13, color: '#7B8499', margin: '6px 0 20px' }}>Todos gratis</p>
            {available.length === 0 && <p style={{ fontSize: 13, color: '#7B8499', textAlign: 'center' }}>¡Ya los tienes todos!</p>}
            {available.map(sp2 => (
              <div key={sp2.id} style={s.specCard} onClick={() => addSpec(sp2.id)}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: sp2.color + '20', color: sp2.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{sp2.emoji}</div>
                <div style={{ flex: 1 }}>
                  <b style={{ fontSize: 14 }}>{sp2.nombre}</b>
                  <div style={{ fontSize: 12, color: '#7B8499' }}>{sp2.descripcion}</div>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: sp2.color }}>+</span>
              </div>
            ))}
            <button onClick={() => setModal(false)} style={{ width: '100%', marginTop: 16, padding: '12px', background: '#EEF0F4', border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: "'Sora',sans-serif", fontWeight: 600, color: '#7B8499' }}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#F8F9FB', display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto', fontFamily: "'Sora',sans-serif" },
  hdr: { padding: '16px 20px 12px', borderBottom: '1px solid #EEF0F4', background: '#fff', display: 'flex', flexDirection: 'column', gap: 10 },
  bar: { display: 'flex', gap: 8, padding: '10px 16px', background: '#fff', borderBottom: '1px solid #EEF0F4', overflowX: 'auto' },
  chip: { padding: '6px 12px', borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: "'Sora',sans-serif" },
  addChip: { padding: '6px 12px', borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: 'transparent', border: '2px dashed #D5DAE4', color: '#7B8499', whiteSpace: 'nowrap', fontFamily: "'Sora',sans-serif" },
  msgs: { flex: 1, padding: '20px 16px', overflowY: 'auto' },
  av: { width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, marginRight: 8, flexShrink: 0, alignSelf: 'flex-end' },
  aBubble: { background: '#fff', border: '1px solid #EEF0F4', borderRadius: '18px 18px 18px 4px', padding: '12px 16px', fontSize: 14, color: '#111827', lineHeight: 1.5, maxWidth: '80%', boxShadow: '0 1px 4px rgba(27,58,107,0.06)' },
  uBubble: { background: '#1B3A6B', borderRadius: '18px 18px 4px 18px', padding: '12px 16px', fontSize: 14, color: '#fff', lineHeight: 1.5, maxWidth: '80%' },
  inputRow: { display: 'flex', gap: 10, padding: '12px 16px', background: '#fff', borderTop: '1px solid #EEF0F4' },
  inp: { flex: 1, padding: '12px 16px', border: '2px solid #EEF0F4', borderRadius: 24, fontSize: 14, fontFamily: "'Sora',sans-serif", color: '#111827', outline: 'none', background: '#F8F9FB' },
  sendBtn: { width: 44, height: 44, borderRadius: '50%', border: 'none', color: '#fff', fontSize: 18, fontWeight: 700, cursor: 'pointer', flexShrink: 0 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100 },
  modal: { background: '#fff', borderRadius: '20px 20px 0 0', padding: '24px 20px', width: '100%', maxWidth: 480, maxHeight: '70vh', overflowY: 'auto' },
  specCard: { display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', borderBottom: '1px solid #EEF0F4', cursor: 'pointer' },
};
