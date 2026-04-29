'use client';
import { useState, useEffect } from 'react';

export default function HomeModule({ onNavigate }) {
  const [athlete, setAthlete] = useState(null);

  useEffect(() => {
    try {
      const a = localStorage.getItem('strava_athlete');
      if (a) setAthlete(JSON.parse(a));
    } catch {}
  }, []);

  const nav = [
    { id: 'running', icon: '🏃', label: 'Running' },
    { id: 'muscu', icon: '💪', label: 'Muscu' },
    { id: 'strava', icon: '🟠', label: 'Strava' },
    { id: 'historique', icon: '📊', label: 'Historique' },
  ];

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-primary)', color:'var(--text-primary)', fontFamily:'Syne, sans-serif', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'0 24px 80px', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'500px', height:'500px', borderRadius:'50%', background:'radial-gradient(circle, rgba(219,59,61,0.07) 0%, transparent 70%)', pointerEvents:'none' }} />
      {athlete && (
        <div style={{ position:'absolute', top:20, right:20, display:'flex', alignItems:'center', gap:8 }}>
          {athlete.photo && <img src={athlete.photo} alt="" style={{ width:32, height:32, borderRadius:'50%', objectFit:'cover' }} />}
          <div style={{ fontSize:12, color:'var(--text-muted)' }}>{athlete.name?.split(' ')[0]}</div>
        </div>
      )}
      <div style={{ marginBottom:20 }}>
        <img src="/logo.svg" alt="PacePro" style={{ width:'clamp(100px, 22vw, 160px)', height:'clamp(100px, 22vw, 160px)', objectFit:'contain', filter:'drop-shadow(0 0 40px rgba(219,59,61,0.3))' }} />
      </div>
      <h1 style={{ fontSize:'clamp(44px, 10vw, 88px)', fontWeight:800, letterSpacing:'-0.05em', lineHeight:1, marginBottom:10, background:'var(--text-primary)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>PacePro</h1>
      <div style={{ fontFamily:'DM Mono, monospace', fontSize:'clamp(10px, 2vw, 13px)', letterSpacing:'0.2em', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:48 }}>
        Powered by <span style={{ color:'#DB3B3D', opacity:0.9 }}>passion</span>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:12, width:'100%', maxWidth:360, marginBottom:40 }}>
        {nav.map(item => (
          <button key={item.id} onClick={() => onNavigate(item.id)} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:'20px 16px', cursor:'pointer', fontFamily:'Syne, sans-serif', display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:28 }}>{item.icon}</span>
            <span style={{ fontSize:12, fontWeight:700, color:'var(--text-secondary)' }}>{item.label}</span>
          </button>
        ))}
      </div>
      <div style={{ display:'flex', gap:28, alignItems:'center' }}>
        {[['IA','Coaching'],['GPS','Strava sync'],['☁️','Cloud sync']].map(([val, label], i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:28 }}>
            {i > 0 && <div style={{ width:1, height:28, background:'var(--border)' }} />}
            <div style={{ textAlign:'center' }}>
              <div style={{ fontFamily:'DM Mono, monospace', fontSize:16, fontWeight:500, color:'#DB3B3D' }}>{val}</div>
              <div style={{ fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', marginTop:2 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
