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

Le rapport d'impédancemètre joint contient la composition corporelle détaillée.
Analyse ce rapport et le profil pour produire :

1. BILAN COMPOSITION CORPORELLE (3-4 lignes) : masse grasse %, masse musculaire, hydratation, métabolisme de base — compare aux normes pour cet athlète
2. BILAN PERFORMANCE SPORTIVE (2-3 lignes) : lien entre composition et performances actuelles
3. RECOMMANDATIONS (3 points numérotés) : actions concrètes sur nutrition, entraînement et récupération
4. OBJECTIF 4 SEMAINES : 1 objectif prioritaire mesurable

Sois précis, chiffré, sans intro ni outro. Langue : français.`;
    } else {
      prompt = `Tu es un coach sportif et médecin du sport expert.
${profileContext}${stravaContext}

Fais un bilan santé et performance (4-5 lignes), puis 3 recommandations concrètes numérotées adaptées au profil. Sans intro ni outro. Langue : français.`;
    }

    try {
      const body = pdfData ? { prompt, pdf: pdfData } : { prompt };
      const res = await fetch('/api/gemini', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const d = await res.json();
      setAiText(d.text || 'Erreur IA.');
    } catch { setAiText('Erreur lors de la génération.'); }
    setAiLoading(false);
  }

  function handlePdfUpload(e) {
    const file = e.target.files[0];
    if (!file || file.type !== 'application/pdf') return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      setPdfData(base64);
      setPdfName(file.name);
    };
    reader.readAsDataURL(file);
  }

  if (!stats) return (
    <div style={{ padding: '24px 16px', color: 'var(--text-primary)', fontFamily: 'Syne, sans-serif', textAlign: 'center', paddingTop: 80 }}>
      {status === 'loading' && <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Chargement des activités Strava…</div>}
      {status === 'no_token' && <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Connecte ton compte Strava pour accéder au bilan.</div>}
      {status === 'error' && <div style={{ color: '#FF0040', fontSize: 13 }}>Impossible de charger les activités.</div>}
    </div>
  );

  return (
    <div style={{ padding: '20px 16px 100px', color: 'var(--text-primary)', fontFamily: 'Syne, sans-serif', background: 'var(--bg-primary)', minHeight: '100%' }}>

      {/* KPIs clés */}
      <div style={{ marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
          <div style={{ fontSize:9, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.15em', fontFamily:'DM Mono, monospace' }}>30 derniers jours</div>
          <div style={{ flex:1, height:1, background:'linear-gradient(90deg, rgba(255,255,255,0.06), transparent)' }}/>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
          {[
            { label:'Km total', value: stats.totalRunKm.toFixed(1), unit:'km', color:'#FF0040' },
            { label:'Séances', value: stats.runs.length, unit:'runs', color:'#f59e0b' },
            { label:'FC moy', value: stats.avgHR ? Math.round(stats.avgHR) : '—', unit:'bpm', color:'#6366f1' },
          ].map(({label, value, unit, color}) => (
            <div key={label} style={{ position:'relative', borderRadius:14, border:`1px solid ${color}20`, background:`linear-gradient(135deg, ${color}08, transparent)`, padding:'12px 10px', overflow:'hidden' }}>
              <div style={{ position:'absolute', bottom:-10, right:-10, width:50, height:50, borderRadius:'50%', background:`radial-gradient(circle, ${color}15, transparent)`, pointerEvents:'none' }}/>
              <div style={{ fontSize:9, color:'var(--text-muted)', fontFamily:'DM Mono, monospace', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>{label}</div>
              <div style={{ fontSize:22, fontWeight:900, color, fontFamily:'DM Mono, monospace', lineHeight:1 }}>{value}</div>
              <div style={{ fontSize:9, color:`${color}80`, fontFamily:'DM Mono, monospace', marginTop:2 }}>{unit}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Course à pied */}
      <div style={{ position:'relative', background:'linear-gradient(135deg, rgba(255,0,64,0.06) 0%, transparent 60%)', border:'1px solid rgba(255,0,64,0.2)', borderRadius:18, padding:'16px', marginBottom:12, overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-30, right:-30, width:120, height:120, borderRadius:'50%', background:'radial-gradient(circle, rgba(255,0,64,0.08) 0%, transparent 70%)', pointerEvents:'none' }}/>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
          <div style={{ width:3, height:14, background:'#FF0040', borderRadius:2, boxShadow:'0 0 8px #FF0040' }}/>
          <div style={{ fontSize:9, fontWeight:700, color:'#FF0040', textTransform:'uppercase', letterSpacing:'0.15em', fontFamily:'DM Mono, monospace' }}>Course à pied</div>
        </div>
        <StatRow label="Volume total" value={stats.totalRunKm.toFixed(1)} unit="km" color="#FF0040" max={60} />
        <StatRow label="Séances" value={stats.runs.length} unit="" color="#FF0040" max={12} />
        {stats.avgHR && <StatRow label="FC moyenne" value={Math.round(stats.avgHR)} unit="bpm" color="#F59E0B" max={200} />}
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <div style={{ flex: 1, background: 'var(--bg-input)', borderRadius: 12, padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#FF0040', fontFamily: 'DM Mono, monospace' }}>{mpsToMinKm(stats.avgPace)}</div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 4, letterSpacing: '0.08em' }}>Allure moy.</div>
          </div>
          <div style={{ flex: 1, background: 'var(--bg-input)', borderRadius: 12, padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#FF0040', fontFamily: 'DM Mono, monospace' }}>{stats.longestRun.toFixed(1)}</div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 4, letterSpacing: '0.08em' }}>Km max sortie</div>
          </div>
        </div>
      </div>

      {/* Évolution */}
      <div style={{ position:'relative', background:'linear-gradient(135deg, rgba(245,158,11,0.06) 0%, transparent 60%)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:18, padding:'16px', marginBottom:12, overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-30, right:-30, width:120, height:120, borderRadius:'50%', background:'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)', pointerEvents:'none' }}/>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
          <div style={{ width:3, height:14, background:'#F59E0B', borderRadius:2, boxShadow:'0 0 8px #F59E0B' }}/>
          <div style={{ fontSize:9, fontWeight:700, color:'#F59E0B', textTransform:'uppercase', letterSpacing:'0.15em', fontFamily:'DM Mono, monospace' }}>Évolution · km/semaine</div>
        </div>
        <BarChart data={stats.weeks} color="#F59E0B" />
      </div>

      {/* Muscu */}
      <div style={{ position:'relative', background:'linear-gradient(135deg, rgba(99,102,241,0.06) 0%, transparent 60%)', border:'1px solid rgba(99,102,241,0.2)', borderRadius:18, padding:'16px', marginBottom:12, overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-30, right:-30, width:120, height:120, borderRadius:'50%', background:'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)', pointerEvents:'none' }}/>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
          <div style={{ width:3, height:14, background:'#6366F1', borderRadius:2, boxShadow:'0 0 8px #6366F1' }}/>
          <div style={{ fontSize:9, fontWeight:700, color:'#6366F1', textTransform:'uppercase', letterSpacing:'0.15em', fontFamily:'DM Mono, monospace' }}>Musculation & sport</div>
        </div>
        <StatRow label="Séances muscu" value={stats.muscus.length} unit="" color="#6366F1" max={8} />
        {stats.muscus.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Aucune séance muscu détectée sur Strava.</div>}
      </div>

      {/* Bilan IA — design premium */}
      <div style={{ position:'relative', borderRadius: 20, overflow:'hidden', marginBottom: 12 }}>
        {/* Fond glassmorphism + glow */}
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg, rgba(255,0,64,0.06) 0%, rgba(99,102,241,0.04) 50%, rgba(0,0,0,0) 100%)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', top:-40, right:-40, width:200, height:200, borderRadius:'50%', background:'radial-gradient(circle, rgba(255,0,64,0.08) 0%, transparent 70%)', pointerEvents:'none' }}/>
        <div style={{ position:'relative', border:'1px solid rgba(255,0,64,0.2)', borderRadius: 20, padding:'20px' }}>
          {/* Header terminal */}
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16, paddingBottom:12, borderBottom:'1px solid rgba(255,0,64,0.1)' }}>
            <div style={{ display:'flex', gap:5 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:'rgba(255,0,64,0.4)' }}/>
              <div style={{ width:8, height:8, borderRadius:'50%', background:'rgba(245,158,11,0.4)' }}/>
              <div style={{ width:8, height:8, borderRadius:'50%', background:'rgba(34,197,94,0.4)' }}/>
            </div>
            <div style={{ fontSize:9, fontFamily:'DM Mono, monospace', color:'rgba(255,0,64,0.7)', letterSpacing:'0.2em', textTransform:'uppercase' }}>PACEPRO · AI ANALYSIS v2.0</div>
            <div style={{ marginLeft:'auto', width:6, height:6, borderRadius:'50%', background:'#FF0040', boxShadow:'0 0 8px #FF0040', animation:'pulse 2s infinite' }}/>
          </div>

          {!aiText && !aiLoading && (
            <div style={{ textAlign:'center', padding:'8px 0 4px' }}>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.2)', fontFamily:'DM Mono, monospace', marginBottom:20, letterSpacing:'0.1em' }}>{'>'} SYSTÈME PRÊT · EN ATTENTE D'INITIALISATION</div>
              <button onClick={getAIBilan} style={{ position:'relative', width:'100%', padding:'16px', borderRadius:14, border:'1px solid rgba(255,0,64,0.4)', background:'linear-gradient(135deg, rgba(255,0,64,0.15), rgba(255,0,64,0.05))', color:'#FF0040', fontFamily:'DM Mono, monospace', fontWeight:800, fontSize:13, cursor:'pointer', letterSpacing:'0.1em', textTransform:'uppercase', overflow:'hidden' }}>
                <div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg, transparent, rgba(255,0,64,0.05), transparent)', animation:'scan 2s linear infinite' }}/>
                ◈ LANCER L'ANALYSE IA
              </button>
            </div>
          )}

          {aiLoading && (
            <div style={{ padding:'8px 0' }}>
              <div style={{ fontFamily:'DM Mono, monospace', fontSize:11, color:'rgba(255,0,64,0.6)', marginBottom:12, letterSpacing:'0.08em' }}>{'>'} INITIALISATION DU MODÈLE...</div>
              {['Lecture des données Strava', 'Analyse biomécanique', "Calcul des zones d'effort", 'Génération des recommandations'].map((step, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8, opacity: 0.6 + i*0.1 }}>
                  <div style={{ width:14, height:14, borderRadius:4, border:'1px solid rgba(255,0,64,0.3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <div style={{ width:6, height:6, borderRadius:2, background:'#FF0040', animation:'pulse 1s infinite', animationDelay:`${i*0.2}s` }}/>
                  </div>
                  <div style={{ fontSize:10, fontFamily:'DM Mono, monospace', color:'var(--text-muted)', letterSpacing:'0.06em' }}>{step}</div>
                </div>
              ))}
            </div>
          )}

          {aiText && (
            <div>
              {aiText.split('\n').map((line, i) => {
                const trimmed = line.trim();
                if (!trimmed) return null;
                const isReco = /^[1-9][.)]\s/.test(trimmed);
                const isTitle = /^(Bilan|Recommandation|Points?|État|Analyse)/i.test(trimmed) && trimmed.endsWith(':');
                if (isTitle) return (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginTop:16, marginBottom:10 }}>
                    <div style={{ width:3, height:12, background:'#FF0040', borderRadius:2 }}/>
                    <div style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.15em', color:'#FF0040', fontFamily:'DM Mono, monospace' }}>{trimmed.replace(/:$/, '')}</div>
                  </div>
                );
                if (isReco) return (
                  <div key={i} style={{ display:'flex', gap:12, alignItems:'flex-start', marginBottom:12, padding:'10px 12px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.04)', borderRadius:12 }}>
                    <div style={{ minWidth:24, height:24, borderRadius:8, background:'linear-gradient(135deg,rgba(255,0,64,0.2),rgba(255,0,64,0.05))', border:'1px solid rgba(255,0,64,0.3)', color:'#FF0040', fontSize:11, fontWeight:900, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'DM Mono, monospace', flexShrink:0 }}>{trimmed[0]}</div>
                    <div style={{ fontSize:12, lineHeight:1.7, color:'var(--text-secondary)', paddingTop:2 }}>{trimmed.replace(/^[1-9][.)]\s*/, '')}</div>
                  </div>
                );
                return (
                  <div key={i} style={{ fontSize:13, lineHeight:1.8, color:'var(--text-primary)', marginBottom:4, fontFamily:'Syne, sans-serif', paddingLeft:4, borderLeft:'2px solid rgba(255,0,64,0.15)' }}>{trimmed}</div>
                );
              })}
              <button onClick={getAIBilan} style={{ marginTop:16, background:'none', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'8px 16px', fontSize:10, color:'var(--text-muted)', cursor:'pointer', fontFamily:'DM Mono, monospace', letterSpacing:'0.08em', display:'flex', alignItems:'center', gap:6 }}>↻ RÉGÉNÉRER</button>
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes scan { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
      `}</style>
    </div>
  );
}
