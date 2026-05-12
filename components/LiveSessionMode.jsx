'use client';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

function getFracBlocs(session) {
  const t = session.title.match(/(\d+)\s*×\s*(\d+)\s*min/);
  if (!t || session.type === 'ef' || session.type === 'long' || session.type === 'trail') return null;
  const reps = +t[1], effortMin = +t[2];
  const recovMin = parseFloat((session.title.match(/\/\s*(\d+(?:\.\d+)?)\s*min/) || [])[1] || effortMin);
  const blocs = [];
  blocs.push({ label: 'Échauffement', min: 15, color: '#22c55e', type: 'warmup' });
  for (let i = 0; i < reps; i++) {
    blocs.push({ label: `Effort ${i+1}/${reps}`, min: effortMin, color: '#FF0040', type: 'effort' });
    if (i < reps - 1) blocs.push({ label: 'Récupération', min: recovMin, color: '#60a5fa', type: 'recov' });
  }
  blocs.push({ label: 'Retour calme', min: 10, color: '#22c55e', type: 'cooldown' });
  return blocs;
}

export default function LiveSessionMode({ session, onComplete, onClose }) {
  const blocs = getFracBlocs(session);
  const [elapsed, setElapsed] = useState(0);
  const [active, setActive] = useState(false);
  const [blocIdx, setBlocIdx] = useState(0);
  const [blocElapsed, setBlocElapsed] = useState(0);
  const intervalRef = useRef(null);
  const startRef = useRef(null);
  const blocStartRef = useRef(null);

  const currentBloc = blocs ? blocs[blocIdx] : null;
  const currentBlocSec = currentBloc ? currentBloc.min * 60 : 0;
  const blocPct = currentBlocSec > 0 ? Math.min(blocElapsed / currentBlocSec * 100, 100) : 0;

  const fmt = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  };

  const toggle = () => {
    if (active) {
      clearInterval(intervalRef.current);
      setActive(false);
    } else {
      const now = Date.now();
      startRef.current = now - elapsed * 1000;
      blocStartRef.current = now - blocElapsed * 1000;
      setActive(true);
      intervalRef.current = setInterval(() => {
        const t = Date.now();
        setElapsed(Math.floor((t - startRef.current) / 1000));
        const bEl = Math.floor((t - blocStartRef.current) / 1000);
        setBlocElapsed(bEl);
        if (blocs && bEl >= currentBlocSec && currentBlocSec > 0) {
          if (blocIdx < blocs.length - 1) {
            setBlocIdx(i => i + 1);
            setBlocElapsed(0);
            blocStartRef.current = t;
          }
        }
      }, 1000);
    }
  };

  const nextBloc = () => {
    if (!blocs || blocIdx >= blocs.length - 1) return;
    setBlocIdx(i => i + 1);
    setBlocElapsed(0);
    blocStartRef.current = Date.now();
  };

  useEffect(() => () => clearInterval(intervalRef.current), []);

  if (typeof document === 'undefined') return null;

  const accent = currentBloc?.color || '#FF0040';

  return createPortal(
    <div style={{ position:'fixed', inset:0, zIndex:9999, background:'#07080b', display:'flex', flexDirection:'column', fontFamily:'Syne, sans-serif' }}>
      {/* Header */}
      <div style={{ padding:'env(safe-area-inset-top, 16px) 16px 0', paddingTop:'calc(env(safe-area-inset-top, 16px) + 12px)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <button onClick={onClose} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.4)', fontSize:13, cursor:'pointer', fontFamily:'DM Mono, monospace', letterSpacing:'0.08em' }}>← QUITTER</button>
        <div style={{ fontSize:9, color:'rgba(255,255,255,0.3)', fontFamily:'DM Mono, monospace', letterSpacing:'0.15em' }}>SESSION LIVE</div>
        <div style={{ width:60 }}/>
      </div>

      {/* Session info */}
      <div style={{ padding:'16px 20px 0' }}>
        <div style={{ fontSize:9, color:`${accent}80`, fontFamily:'DM Mono, monospace', textTransform:'uppercase', letterSpacing:'0.15em', marginBottom:4 }}>{session.tag}</div>
        <div style={{ fontSize:22, fontWeight:900, letterSpacing:'-0.03em', marginBottom:4 }}>{session.title}</div>
      </div>

      {/* Main timer */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'0 20px' }}>
        {/* Bloc courant */}
        {blocs && currentBloc && (
          <div style={{ marginBottom:24, textAlign:'center' }}>
            <div style={{ fontSize:11, color:`${accent}`, fontFamily:'DM Mono, monospace', textTransform:'uppercase', letterSpacing:'0.2em', marginBottom:8 }}>{currentBloc.label}</div>
            {/* Arc progress */}
            <div style={{ position:'relative', width:200, height:200, margin:'0 auto 16px' }}>
              <svg width={200} height={200} style={{ transform:'rotate(-90deg)' }}>
                <circle cx={100} cy={100} r={90} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={8}/>
                <circle cx={100} cy={100} r={90} fill="none" stroke={accent} strokeWidth={8}
                  strokeDasharray={`${2 * Math.PI * 90}`}
                  strokeDashoffset={`${2 * Math.PI * 90 * (1 - blocPct/100)}`}
                  strokeLinecap="round"
                  style={{ transition:'stroke-dashoffset 1s linear', filter:`drop-shadow(0 0 8px ${accent})` }}/>
              </svg>
              <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                <div style={{ fontSize:48, fontWeight:900, fontFamily:'DM Mono, monospace', color:accent, lineHeight:1 }}>
                  {currentBlocSec > 0 ? fmt(Math.max(0, currentBlocSec - blocElapsed)) : fmt(blocElapsed)}
                </div>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', fontFamily:'DM Mono, monospace', marginTop:4 }}>
                  {currentBlocSec > 0 ? 'restant' : 'écoulé'}
                </div>
              </div>
            </div>
            {/* Allures */}
            {session.allures?.filter(a => {
              if (currentBloc.type === 'effort') return a.label.toLowerCase().includes('effort') || a.label.toLowerCase().includes('seuil') || a.label.toLowerCase().includes('css') || a.label.toLowerCase().includes('z');
              if (currentBloc.type === 'recov') return a.label.toLowerCase().includes('récup') || a.label.toLowerCase().includes('z1');
              return true;
            }).slice(0,1).map((a,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(255,255,255,0.04)', borderRadius:10, padding:'8px 16px' }}>
                <span style={{ width:8, height:8, borderRadius:'50%', background:a.dot }}/>
                <span style={{ fontSize:11, color:'rgba(255,255,255,0.5)' }}>{a.label}</span>
                <span style={{ fontSize:16, fontFamily:'DM Mono, monospace', fontWeight:800, color:'#fff', marginLeft:'auto' }}>{a.val}</span>
              </div>
            ))}
          </div>
        )}

        {/* Timer total si pas de blocs */}
        {!blocs && (
          <div style={{ textAlign:'center', marginBottom:24 }}>
            <div style={{ fontSize:72, fontWeight:900, fontFamily:'DM Mono, monospace', color:active?'#FF0040':'rgba(255,255,255,0.6)', lineHeight:1, transition:'color 0.3s' }}>{fmt(elapsed)}</div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', fontFamily:'DM Mono, monospace', marginTop:8, letterSpacing:'0.1em' }}>TEMPS ÉCOULÉ</div>
            {/* Allures */}
            <div style={{ marginTop:20, display:'flex', flexDirection:'column', gap:8 }}>
              {session.allures?.map((a,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(255,255,255,0.04)', borderRadius:10, padding:'8px 16px' }}>
                  <span style={{ width:8, height:8, borderRadius:'50%', background:a.dot }}/>
                  <span style={{ fontSize:11, color:'rgba(255,255,255,0.5)' }}>{a.label}</span>
                  <span style={{ fontSize:16, fontFamily:'DM Mono, monospace', fontWeight:800, color:'#fff', marginLeft:'auto' }}>{a.val}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Blocs progress si fractionné */}
        {blocs && (
          <div style={{ display:'flex', gap:4, marginBottom:24 }}>
            {blocs.map((b,i) => (
              <div key={i} style={{ flex:1, height:4, borderRadius:99, background:i < blocIdx ? b.color : i === blocIdx ? `${b.color}60` : 'rgba(255,255,255,0.1)', transition:'all 0.3s' }}/>
            ))}
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{ padding:'0 20px', paddingBottom:'calc(env(safe-area-inset-bottom, 16px) + 16px)', display:'flex', flexDirection:'column', gap:10 }}>
        <div style={{ display:'flex', gap:10 }}>
          {/* Play/Pause */}
          <button onClick={toggle} style={{ flex:2, height:56, borderRadius:16, border:'none', background:active?'rgba(245,158,11,0.2)':`linear-gradient(135deg, ${accent}30, ${accent}10)`, color:active?'#f59e0b':accent, fontSize:20, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, fontFamily:'DM Mono, monospace', fontWeight:800, border:`1px solid ${active?'rgba(245,158,11,0.3)':accent}30` }}>
            {active ? '⏸ PAUSE' : elapsed === 0 ? '▶ DÉMARRER' : '▶ REPRENDRE'}
          </button>
          {/* Bloc suivant */}
          {blocs && blocIdx < blocs.length - 1 && (
            <button onClick={nextBloc} style={{ flex:1, height:56, borderRadius:16, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.5)', fontSize:11, cursor:'pointer', fontFamily:'DM Mono, monospace', letterSpacing:'0.06em' }}>SUIVANT →</button>
          )}
        </div>
        {/* Terminer */}
        <button onClick={() => { onComplete(session.id); onClose(); }} style={{ width:'100%', height:48, borderRadius:14, background:'rgba(34,197,94,0.12)', border:'1px solid rgba(34,197,94,0.25)', color:'#22c55e', fontSize:13, fontWeight:800, cursor:'pointer', fontFamily:'DM Mono, monospace', letterSpacing:'0.08em' }}>
          ✓ TERMINER LA SÉANCE
        </button>
      </div>
    </div>,
    document.body
  );
}
