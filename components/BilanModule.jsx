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
  const [aiText, setAiText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [pdfData, setPdfData] = useState(null);
  const [pdfName, setPdfName] = useState('');
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

  async function getAIBilan() {
    setAiLoading(true);
    setAiText('');

    // Charger les données profil
    const settings = (() => { try { return JSON.parse(localStorage.getItem('pp_user_settings') || '{}'); } catch { return {}; } })();
    const plans = (() => { try { return JSON.parse(localStorage.getItem('pp_plans') || '[]'); } catch { return []; } })();
    const workouts = (() => { try { return JSON.parse(localStorage.getItem('pp_workouts_pro') || '[]'); } catch { return []; } })();
    const activePlan = plans[plans.length - 1];
    const completed = activePlan?.completed || {};
    const totalSessions = activePlan?.plan?.reduce((a, w) => a + w.sessions.length, 0) || 0;
    const doneSessions = Object.values(completed).filter(Boolean).length;

    const profileContext = `Profil athlète :
- Poids : ${settings.weight || '?'} kg | Taille : ${settings.height || '?'} cm | Âge : ${settings.age || '?'} ans
- VMA : ${settings.vma || '?'} km/h | Niveau : ${settings.level || '?'}
- Discipline principale : ${settings.discipline || 'running'}
- Programme actif : ${activePlan ? `${activePlan.profile?.raceName || 'oui'} — ${doneSessions}/${totalSessions} séances complétées` : 'aucun'}
- Séances muscu : ${workouts.length} enregistrées`;

    const stravaContext = stats ? `
Données sportives (Strava) :
- Courses : ${stats.runs.length} séances, ${stats.totalRunKm.toFixed(1)} km
- Allure moy : ${mpsToMinKm(stats.avgPace)} min/km
- FC moy : ${stats.avgHR ? Math.round(stats.avgHR) + ' bpm' : 'N/A'}` : '';

    let prompt;
    if (pdfData) {
      prompt = `Tu es un médecin du sport et coach expert en composition corporelle.
${profileContext}${stravaContext}

RAPPORT IMPÉDANCEMÈTRE (extrait) :
${pdfData.substring(0, 3000)}

Extrait les données clés du rapport (masse grasse %, masse musculaire, eau corporelle, métabolisme de base, masse osseuse si disponible) et produis :

1. BILAN COMPOSITION CORPORELLE : analyse des valeurs vs normes pour cet athlète
2. BILAN PERFORMANCE : lien composition corporelle et performances sportives
3. RECOMMANDATIONS (3 points numérotés) : nutrition, entraînement, récupération
4. OBJECTIF 4 SEMAINES : 1 objectif prioritaire mesurable

Sois précis, chiffré, sans intro ni outro. Langue : français.`;
    } else {
      prompt = `Tu es un coach sportif et médecin du sport expert.
${profileContext}${stravaContext}

Fais un bilan santé et performance (4-5 lignes), puis 3 recommandations concrètes numérotées adaptées au profil. Sans intro ni outro. Langue : français.`;
    }

    try {
      const body = { prompt };
      const res = await fetch('/api/gemini', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const d = await res.json();
      setAiText(d.text || 'Erreur IA.');
    } catch { setAiText('Erreur lors de la génération.'); }
    setAiLoading(false);
  }

  async function handlePdfUpload(e) {
    const file = e.target.files[0];
    if (!file || file.type !== 'application/pdf') return;
    setPdfName(file.name);
    try {
      // Extraire le texte du PDF avec PDF.js
      const pdfjsLib = await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
      const url = URL.createObjectURL(file);
      // Fallback: lire en base64 et envoyer comme texte encodé
      const reader = new FileReader();
      reader.onload = async () => {
        const arrayBuffer = reader.result;
        // Simple extraction via text decoder
        const bytes = new Uint8Array(arrayBuffer);
        let text = '';
        // Extraire les chaînes lisibles du PDF
        for (let i = 0; i < bytes.length - 1; i++) {
          const c = bytes[i];
          if (c >= 32 && c < 127) {
            text += String.fromCharCode(c);
          } else if (c === 10 || c === 13) {
            text += ' ';
          }
        }
        // Nettoyer et garder que les parties utiles
        const cleaned = text
          .replace(/[^ -~À-ɏ\s]/g, ' ')
          .replace(/\s{3,}/g, ' ')
          .substring(0, 8000); // Max 8000 chars
        setPdfData(cleaned);
      };
      reader.readAsArrayBuffer(file);
    } catch {
      // Fallback simple
      const reader = new FileReader();
      reader.onload = () => setPdfData(reader.result.substring(0, 4000));
      reader.readAsText(file);
    }
  }

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

      {/* Bilan IA */}
      <div style={{ position:'relative', borderRadius:18, overflow:'hidden', marginBottom:14, border:'1px solid rgba(99,102,241,0.25)', background:'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, transparent 60%)' }}>
        <div style={{ position:'absolute', top:0, bottom:0, width:'35%', background:'linear-gradient(90deg, transparent, rgba(99,102,241,0.05), transparent)', animation:'scanLine 14s ease-in-out infinite', zIndex:1, pointerEvents:'none', left:0 }}/>
        <div style={{ padding:'10px 16px', borderBottom:'1px solid rgba(99,102,241,0.15)', display:'flex', alignItems:'center', gap:8, position:'relative', zIndex:2 }}>
          <div style={{ display:'flex', gap:4 }}>
            <div style={{ width:5, height:5, borderRadius:'50%', background:'rgba(99,102,241,0.6)' }}/>
            <div style={{ width:5, height:5, borderRadius:'50%', background:'rgba(245,158,11,0.4)' }}/>
            <div style={{ width:5, height:5, borderRadius:'50%', background:'rgba(34,197,94,0.4)' }}/>
          </div>
          <div style={{ fontSize:8, fontFamily:'DM Mono, monospace', color:'rgba(99,102,241,0.7)', letterSpacing:'0.15em' }}>HEALTH.AI · ANALYSE PERSONNALISÉE</div>
          {pdfData && (
            <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:4 }}>
              <div style={{ width:4, height:4, borderRadius:'50%', background:'#22c55e', boxShadow:'0 0 4px #22c55e' }}/>
              <span style={{ fontSize:8, fontFamily:'DM Mono, monospace', color:'#22c55e' }}>PDF CHARGÉ</span>
            </div>
          )}
        </div>
        <div style={{ padding:'16px', position:'relative', zIndex:2 }}>
          {/* Upload PDF */}
          <div style={{ marginBottom:14 }}>
            {!pdfData ? (
              <label style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:12, border:'1px dashed rgba(99,102,241,0.3)', background:'rgba(99,102,241,0.04)', cursor:'pointer' }}>
                <input type="file" accept="application/pdf" onChange={handlePdfUpload} style={{ display:'none' }} />
                <div style={{ width:32, height:32, borderRadius:8, background:'rgba(99,102,241,0.12)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth={2} strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                </div>
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:'#6366f1', fontFamily:'DM Mono, monospace' }}>Ajouter rapport impédancemètre</div>
                  <div style={{ fontSize:9, color:'var(--text-muted)', fontFamily:'DM Mono, monospace', marginTop:2 }}>PDF · Optionnel · Améliore l'analyse IA</div>
                </div>
              </label>
            ) : (
              <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:12, border:'1px solid rgba(34,197,94,0.25)', background:'rgba(34,197,94,0.05)' }}>
                <div style={{ width:32, height:32, borderRadius:8, background:'rgba(34,197,94,0.12)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth={2} strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:'#22c55e', fontFamily:'DM Mono, monospace', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{pdfName}</div>
                  <div style={{ fontSize:9, color:'rgba(34,197,94,0.6)', fontFamily:'DM Mono, monospace', marginTop:1 }}>Rapport inclus dans l'analyse</div>
                </div>
                <button onClick={() => { setPdfData(null); setPdfName(''); }} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.3)', fontSize:16, padding:'2px 6px' }}>✕</button>
              </div>
            )}
          </div>

          {/* Bouton générer */}
          {!aiText && !aiLoading && (
            <button onClick={getAIBilan} style={{ width:'100%', padding:'14px', borderRadius:12, border:'1px solid rgba(99,102,241,0.4)', background:'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(99,102,241,0.05))', color:'#6366f1', fontFamily:'DM Mono, monospace', fontWeight:800, fontSize:12, cursor:'pointer', letterSpacing:'0.1em', textTransform:'uppercase' }}>
              {pdfData ? '✦ ANALYSER MON BILAN SANTÉ + PDF' : '✦ GÉNÉRER MON BILAN SANTÉ IA'}
            </button>
          )}

          {/* Loading */}
          {aiLoading && (
            <div style={{ textAlign:'center', padding:'20px 0' }}>
              <div style={{ fontSize:9, color:'#6366f1', fontFamily:'DM Mono, monospace', letterSpacing:'0.15em', marginBottom:8 }}>{'>'} ANALYSE EN COURS...</div>
              <div style={{ height:2, background:'rgba(99,102,241,0.1)', borderRadius:99, overflow:'hidden' }}>
                <div style={{ height:'100%', background:'linear-gradient(90deg, #6366f1, #a78bfa)', borderRadius:99, animation:'scanLine 2s ease-in-out infinite', width:'40%' }}/>
              </div>
            </div>
          )}

          {/* Résultat */}
          {aiText && (
            <div>
              <div style={{ fontSize:11, color:'var(--text-secondary)', lineHeight:1.8, fontFamily:'DM Mono, monospace' }}>
                {aiText.split('\n').map((line, i) => {
                  const trimmed = line.trim();
                  if (!trimmed) return <div key={i} style={{ height:8 }}/>;
                  const isTitle = /^[A-Z0-9À-ÿ\s&·:]{4,}$/.test(trimmed) && trimmed.length < 40;
                  if (isTitle) return <div key={i} style={{ fontSize:9, color:'#6366f1', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.15em', marginTop:14, marginBottom:6 }}>{trimmed}</div>;
                  const isNum = /^[1-9][\.\)]/.test(trimmed);
                  if (isNum) return <div key={i} style={{ display:'flex', gap:10, marginBottom:8, alignItems:'flex-start' }}>
                    <span style={{ fontSize:9, color:'#6366f1', fontWeight:800, fontFamily:'DM Mono, monospace', minWidth:16 }}>{trimmed[0]}.</span>
                    <span style={{ fontSize:11, color:'var(--text-secondary)', lineHeight:1.6 }}>{trimmed.slice(2).trim()}</span>
                  </div>;
                  return <p key={i} style={{ fontSize:11, marginBottom:6, lineHeight:1.7 }}>{trimmed}</p>;
                })}
              </div>
              <button onClick={getAIBilan} style={{ marginTop:14, background:'none', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, padding:'7px 14px', fontSize:9, color:'var(--text-muted)', cursor:'pointer', fontFamily:'DM Mono, monospace', letterSpacing:'0.08em' }}>↻ RÉGÉNÉRER</button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
