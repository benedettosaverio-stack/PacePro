'use client';
import { useState, useEffect, useRef } from 'react';
import Icon from './Icons';

function getToken() {
  try {
    const exp = parseInt(localStorage.getItem('strava_expires_at') || '0');
    if (Date.now() / 1000 < exp) return localStorage.getItem('strava_token');
  } catch {}
  return null;
}

function mpsToMinKm(mps) {
  if (!mps || mps === 0) return '--';
  const sec = 1000 / mps;
  return `${Math.floor(sec / 60)}'${String(Math.round(sec % 60)).padStart(2, '0')}"`;
}

function analyseActivities(activities) {
  const runs = activities.filter(a => a.type === 'Run' || a.sport_type === 'Run');
  const muscus = activities.filter(a =>
    ['WeightTraining', 'Workout', 'Crossfit'].includes(a.type) ||
    ['WeightTraining', 'Workout', 'Crossfit'].includes(a.sport_type)
  );
  const weeks = [0, 1, 2, 3].map(w => {
    const now = Date.now();
    const start = now - (w + 1) * 7 * 86400000;
    const end = now - w * 7 * 86400000;
    const weekRuns = runs.filter(a => {
      const t = new Date(a.start_date).getTime();
      return t >= start && t < end;
    });
    return {
      label: w === 0 ? 'S.' : `-${w}`,
      value: parseFloat((weekRuns.reduce((s, a) => s + a.distance, 0) / 1000).toFixed(1)),
    };
  }).reverse();

  const totalRunKm = runs.reduce((s, a) => s + a.distance, 0) / 1000;
  const avgPace = runs.length ? runs.reduce((s, a) => s + (a.average_speed || 0), 0) / runs.length : 0;
  const avgHR = runs.filter(a => a.average_heartrate).length
    ? runs.filter(a => a.average_heartrate).reduce((s, a) => s + a.average_heartrate, 0) / runs.filter(a => a.average_heartrate).length
    : null;
  const longestRun = runs.length ? Math.max(...runs.map(a => a.distance)) / 1000 : 0;
  const scoreVolume = Math.min(Math.round((totalRunKm / 40) * 100), 100);
  const scoreRegularite = Math.min(Math.round((runs.length / 8) * 100), 100);
  const scoreMuscu = Math.min(Math.round((muscus.length / 4) * 100), 100);
  return { runs, muscus, totalRunKm, avgPace, avgHR, longestRun, weeks, scoreVolume, scoreRegularite, scoreMuscu };
}

function ScoreCard({ score, label, color, icon }) {
  const [animated, setAnimated] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(score), 200);
    return () => clearTimeout(t);
  }, [score]);
  const r = 32, circ = 2 * Math.PI * r;
  const dash = (animated / 100) * circ;
  return (
    <div style={{ flex:1, position:'relative', borderRadius:16, overflow:'hidden', border:`1px solid ${color}25`, background:`linear-gradient(135deg, ${color}08 0%, transparent 60%)` }}>
      <div style={{ position:'absolute', top:-20, right:-20, width:80, height:80, borderRadius:'50%', background:`radial-gradient(circle, ${color}15 0%, transparent 70%)`, pointerEvents:'none' }}/>
      <div style={{ padding:'14px 10px', display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
        <div style={{ position:'relative', width:70, height:70 }}>
          <svg width={70} height={70} style={{ transform:'rotate(-90deg)' }}>
            <circle cx={35} cy={35} r={r} fill="none" stroke={`${color}20`} strokeWidth={4} />
            <circle cx={35} cy={35} r={r} fill="none" stroke={color} strokeWidth={4}
              strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
              style={{ transition:'stroke-dasharray 1.2s cubic-bezier(0.22,1,0.36,1)', filter:`drop-shadow(0 0 4px ${color})` }} />
          </svg>
          <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
            <span style={{ fontSize:16, fontWeight:900, color, fontFamily:'DM Mono, monospace', lineHeight:1 }}>{score}</span>
          </div>
        </div>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:10, fontWeight:800, color:'var(--text-primary)', letterSpacing:'-0.01em' }}>{label}</div>
          <div style={{ fontSize:8, color, marginTop:2, fontFamily:'DM Mono, monospace', letterSpacing:'0.08em', textTransform:'uppercase', opacity:0.8 }}>{score < 40 ? 'À améliorer' : score < 70 ? 'Correct' : score < 90 ? 'Bien' : 'Excellent'}</div>
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value, unit, color, max, icon }) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(Math.min((parseFloat(value) / max) * 100, 100)), 300); return () => clearTimeout(t); }, [value, max]);
  return (
    <div style={{ marginBottom:12 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
        <span style={{ fontSize:10, color:'var(--text-muted)', fontFamily:'DM Mono, monospace', textTransform:'uppercase', letterSpacing:'0.08em' }}>{label}</span>
        <span style={{ fontSize:14, fontWeight:900, color:'var(--text-primary)', fontFamily:'DM Mono, monospace' }}>{value}<span style={{ fontSize:9, fontWeight:400, color, marginLeft:3 }}>{unit}</span></span>
      </div>
      <div style={{ height:3, background:'rgba(255,255,255,0.05)', borderRadius:99, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${w}%`, background:`linear-gradient(90deg, ${color}, ${color}aa)`, borderRadius:99, transition:'width 1.2s cubic-bezier(0.22,1,0.36,1)', boxShadow:`0 0 8px ${color}60` }} />
      </div>
    </div>
  );
}

function BarChart({ data, color }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:80 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4, height:'100%', justifyContent:'flex-end' }}>
          {d.value > 0 && <div style={{ fontSize:9, color:color, fontFamily:'DM Mono, monospace', fontWeight:700 }}>{d.value}</div>}
          <div style={{ width:'100%', borderRadius:'4px 4px 0 0', background:d.value > 0 ? `linear-gradient(180deg, ${color}, ${color}60)` : 'rgba(255,255,255,0.04)', height:`${Math.max((d.value/max)*60, d.value>0?8:3)}px`, transition:'height 1s cubic-bezier(0.22,1,0.36,1)', boxShadow:d.value>0?`0 0 12px ${color}40`:'' }} />
          <div style={{ fontSize:8, color:'var(--text-muted)', fontFamily:'DM Mono, monospace', letterSpacing:'0.06em' }}>{d.label}</div>
        </div>
      ))}
    </div>
  );
}

export default function BilanModule({ onBack }) {
  const [status, setStatus] = useState('idle');
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState(null);

  const didFetch = useRef(false);

  useEffect(() => {
    if (didFetch.current) return;
    didFetch.current = true;
    const token = getToken();
    if (!token) { setStatus('no_token'); return; }
    setStatus('loading');
    const refreshToken = localStorage.getItem('strava_refresh_token') || '';
    const expiresAt = localStorage.getItem('strava_expires_at') || '0';
    fetch(`/api/strava?action=activities&token=${token}&refresh_token=${refreshToken}&expires_at=${expiresAt}`)
      .then(r => r.json())
      .then(data => {
        if (data.newToken) {
          localStorage.setItem('strava_token', data.newToken);
          localStorage.setItem('strava_refresh_token', data.newRefresh);
          localStorage.setItem('strava_expires_at', String(data.newExpires));
        }
        const activities = data.activities || data;
        if (!Array.isArray(activities)) { setStatus('error'); return; }
        data = activities;
        setActivities(data);
        setStats(analyseActivities(data));
        setStatus('done');
      })
      .catch(() => setStatus('error'));
  }, []);

  if (!stats) return (
    <div style={{ padding: '24px 16px', color: 'var(--text-primary)', fontFamily: 'Syne, sans-serif', textAlign: 'center', paddingTop: 80 }}>
      {status === 'loading' && <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Chargement des activités Strava…</div>}
      {status === 'no_token' && <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Connecte ton compte Strava pour accéder au bilan.</div>}
      {status === 'error' && <div style={{ color: '#FF0040', fontSize: 13 }}>Impossible de charger les activités.</div>}
    </div>
  );

  const settings = (() => { try { return JSON.parse(localStorage.getItem('pp_user_settings') || '{}'); } catch { return {}; } })();
  const plans = (() => { try { return JSON.parse(localStorage.getItem('pp_plans') || '[]'); } catch { return []; } })();
  const workouts = (() => { try { return JSON.parse(localStorage.getItem('pp_workouts_pro') || '[]'); } catch { return []; } })();
  const activePlan = plans[plans.length - 1];

  return (
    <div style={{ padding: '20px 16px 100px', color: 'var(--text-primary)', fontFamily: 'Syne, sans-serif', background: 'var(--bg-primary)', minHeight: '100%' }}>

      {/* Header terminal */}
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:9, color:'var(--text-muted)', fontFamily:'DM Mono, monospace', textTransform:'uppercase', letterSpacing:'0.2em', marginBottom:6, display:'flex', alignItems:'center', gap:6 }}>
          <div style={{ width:5, height:5, borderRadius:'50%', background:'#6366f1', boxShadow:'0 0 6px #6366f1' }}/>
          PACEPRO · HEALTH LAB
        </div>
        <h1 style={{ fontSize:26, fontWeight:900, letterSpacing:'-0.04em', marginBottom:4, background:'linear-gradient(135deg, #fff 60%, rgba(255,255,255,0.4))', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Bilan Santé</h1>
        <p style={{ fontSize:10, color:'var(--text-muted)', fontFamily:'DM Mono, monospace', textTransform:'uppercase', letterSpacing:'0.1em' }}>IA · Profil · Composition corporelle</p>
      </div>

      {/* Profil utilisateur */}
      {(settings.weight || settings.height || settings.age) && (
        <div style={{ position:'relative', borderRadius:18, overflow:'hidden', marginBottom:14, border:'1px solid rgba(99,102,241,0.2)', background:'linear-gradient(135deg, rgba(99,102,241,0.06) 0%, transparent 60%)' }}>
          <div style={{ padding:'10px 16px', borderBottom:'1px solid rgba(99,102,241,0.12)', display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ display:'flex', gap:4 }}>
              <div style={{ width:5, height:5, borderRadius:'50%', background:'rgba(99,102,241,0.6)' }}/>
              <div style={{ width:5, height:5, borderRadius:'50%', background:'rgba(245,158,11,0.4)' }}/>
              <div style={{ width:5, height:5, borderRadius:'50%', background:'rgba(34,197,94,0.4)' }}/>
            </div>
            <div style={{ fontSize:8, fontFamily:'DM Mono, monospace', color:'rgba(99,102,241,0.7)', letterSpacing:'0.15em' }}>PROFIL · DONNÉES BIOMÉTRIQUES</div>
          </div>
          <div style={{ padding:'14px 16px', display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
            {[
              { label:'Poids', value: settings.weight ? `${settings.weight}` : '—', unit:'kg', color:'#6366f1' },
              { label:'Taille', value: settings.height ? `${settings.height}` : '—', unit:'cm', color:'#38bdf8' },
              { label:'IMC', value: (settings.weight && settings.height) ? (settings.weight / ((settings.height/100)**2)).toFixed(1) : '—', unit:'', color:'#22c55e' },
            ].map(({label, value, unit, color}) => (
              <div key={label} style={{ position:'relative', borderRadius:10, border:`1px solid ${color}18`, background:`${color}06`, padding:'10px 8px', textAlign:'center', overflow:'hidden' }}>
                <div style={{ fontSize:8, color:'var(--text-muted)', fontFamily:'DM Mono, monospace', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>{label}</div>
                <div style={{ fontSize:20, fontWeight:900, color, fontFamily:'DM Mono, monospace', lineHeight:1 }}>{value}</div>
                <div style={{ fontSize:8, color:`${color}80`, fontFamily:'DM Mono, monospace', marginTop:2 }}>{unit}</div>
              </div>
            ))}
          </div>
          {activePlan && (
            <div style={{ padding:'0 16px 14px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              <div style={{ background:'rgba(255,255,255,0.02)', borderRadius:10, padding:'8px 12px', border:'1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize:8, color:'var(--text-muted)', fontFamily:'DM Mono, monospace', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:3 }}>Programme actif</div>
                <div style={{ fontSize:11, fontWeight:700, color:'var(--text-primary)', fontFamily:'DM Mono, monospace' }}>{activePlan.profile?.raceName || 'En cours'}</div>
              </div>
              <div style={{ background:'rgba(255,255,255,0.02)', borderRadius:10, padding:'8px 12px', border:'1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize:8, color:'var(--text-muted)', fontFamily:'DM Mono, monospace', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:3 }}>Séances muscu</div>
                <div style={{ fontSize:11, fontWeight:700, color:'var(--text-primary)', fontFamily:'DM Mono, monospace' }}>{workouts.length} enregistrées</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Données Strava si dispo */}
      {stats && (
        <div style={{ position:'relative', borderRadius:18, overflow:'hidden', marginBottom:14, border:'1px solid rgba(255,0,64,0.15)', background:'linear-gradient(135deg, rgba(255,0,64,0.04) 0%, transparent 60%)' }}>
          <div style={{ padding:'10px 16px', borderBottom:'1px solid rgba(255,0,64,0.1)', display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ display:'flex', gap:4 }}>
              <div style={{ width:5, height:5, borderRadius:'50%', background:'rgba(255,0,64,0.5)' }}/>
              <div style={{ width:5, height:5, borderRadius:'50%', background:'rgba(245,158,11,0.4)' }}/>
              <div style={{ width:5, height:5, borderRadius:'50%', background:'rgba(34,197,94,0.4)' }}/>
            </div>
            <div style={{ fontSize:8, fontFamily:'DM Mono, monospace', color:'rgba(255,0,64,0.6)', letterSpacing:'0.15em' }}>STRAVA · DONNÉES SPORTIVES 30J</div>
          </div>
          <div style={{ padding:'14px 16px', display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
            {[
              { label:'Km total', value: stats.totalRunKm.toFixed(1), unit:'km', color:'#FF0040' },
              { label:'Allure moy', value: mpsToMinKm(stats.avgPace), unit:'/km', color:'#f59e0b' },
              { label:'FC moy', value: stats.avgHR ? Math.round(stats.avgHR) : '—', unit:'bpm', color:'#6366f1' },
            ].map(({label, value, unit, color}) => (
              <div key={label} style={{ position:'relative', borderRadius:10, border:`1px solid ${color}18`, background:`${color}06`, padding:'10px 8px', textAlign:'center', overflow:'hidden' }}>
                <div style={{ fontSize:8, color:'var(--text-muted)', fontFamily:'DM Mono, monospace', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>{label}</div>
                <div style={{ fontSize:18, fontWeight:900, color, fontFamily:'DM Mono, monospace', lineHeight:1 }}>{value}</div>
                <div style={{ fontSize:8, color:`${color}80`, fontFamily:'DM Mono, monospace', marginTop:2 }}>{unit}</div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
