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
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 18, padding: '16px 8px' }}>
      <div style={{ position: 'relative', width: 80, height: 80 }}>
        <svg width={80} height={80} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={40} cy={40} r={r} fill="none" stroke="var(--progress-track)" strokeWidth={5} />
          <circle cx={40} cy={40} r={r} fill="none" stroke={color} strokeWidth={5}
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.22,1,0.36,1)' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 18, fontWeight: 900, color, fontFamily: 'DM Mono, monospace', lineHeight: 1 }}>{score}</span>
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>{label}</div>
        <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>{score < 40 ? 'À améliorer' : score < 70 ? 'Correct' : score < 90 ? 'Bien' : 'Excellent'}</div>
      </div>
    </div>
  );
}

function StatRow({ label, value, unit, color, max, icon }) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(Math.min((parseFloat(value) / max) * 100, 100)), 300); return () => clearTimeout(t); }, [value, max]);
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'DM Mono, monospace' }}>{value}<span style={{ fontSize: 10, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 2 }}>{unit}</span></span>
      </div>
      <div style={{ height: 5, background: 'var(--progress-track)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${w}%`, background: color, borderRadius: 99, transition: 'width 1.2s cubic-bezier(0.22,1,0.36,1)' }} />
      </div>
    </div>
  );
}

function BarChart({ data, color }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 70 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
          {d.value > 0 && <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>{d.value}</div>}
          <div style={{ width: '100%', borderRadius: '6px 6px 0 0', background: d.value > 0 ? color : 'var(--progress-track)', height: `${Math.max((d.value / max) * 52, d.value > 0 ? 8 : 4)}px`, transition: 'height 1s ease', opacity: d.value > 0 ? 0.85 : 0.3 }} />
          <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>{d.label}</div>
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
  const didFetch = useRef(false);

  useEffect(() => {
    if (didFetch.current) return;
    didFetch.current = true;
    const token = getToken();
    if (!token) { setStatus('no_token'); return; }
    setStatus('loading');
    fetch(`/api/strava?action=activities&token=${token}`)
      .then(r => r.json())
      .then(data => {
        if (!Array.isArray(data)) { setStatus('error'); return; }
        setActivities(data);
        setStats(analyseActivities(data));
        setStatus('done');
      })
      .catch(() => setStatus('error'));
  }, []);

  async function getAIBilan() {
    if (!stats) return;
    setAiLoading(true);
    setAiText('');
    const prompt = `Tu es un coach sportif expert. Voici les données Strava des 20 dernières activités :
- Courses à pied : ${stats.runs.length} séances, ${stats.totalRunKm.toFixed(1)} km total
- Allure moyenne : ${mpsToMinKm(stats.avgPace)} min/km
- FC moyenne : ${stats.avgHR ? Math.round(stats.avgHR) + ' bpm' : 'non disponible'}
- Sortie la plus longue : ${stats.longestRun.toFixed(1)} km
- Séances muscu/sport : ${stats.muscus.length}
- Score volume : ${stats.scoreVolume}/100
- Score régularité : ${stats.scoreRegularite}/100
- Score muscu : ${stats.scoreMuscu}/100

Fais un bilan physique court et percutant (3-4 lignes max), puis donne 3 recommandations concrètes numérotées. Sois direct, sans intro ni outro. Langue : français.`;

    try {
      const res = await fetch('/api/gemini', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) });
      const d = await res.json();
      setAiText(d.text || 'Erreur IA.');
    } catch { setAiText('Erreur lors de la génération.'); }
    setAiLoading(false);
  }

  if (!stats) return (
    <div style={{ padding: '24px 16px', color: 'var(--text-primary)', fontFamily: 'Syne, sans-serif', textAlign: 'center', paddingTop: 80 }}>
      {status === 'loading' && <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Chargement des activités Strava…</div>}
      {status === 'no_token' && <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Connecte ton compte Strava pour accéder au bilan.</div>}
      {status === 'error' && <div style={{ color: '#FF0040', fontSize: 13 }}>Impossible de charger les activités.</div>}
    </div>
  );

  return (
    <div style={{ padding: '20px 16px 100px', color: 'var(--text-primary)', fontFamily: 'Syne, sans-serif', background: 'var(--bg-primary)', minHeight: '100vh' }}>

      {/* Scores */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', fontFamily: 'DM Mono, monospace', marginBottom: 12 }}>Scores globaux</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <ScoreCard score={stats.scoreVolume} label="Volume" color="#FF0040" />
          <ScoreCard score={stats.scoreRegularite} label="Régularité" color="#F59E0B" />
          <ScoreCard score={stats.scoreMuscu} label="Muscu" color="#6366F1" />
        </div>
      </div>

      {/* Course à pied */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: '3px solid #FF0040', borderRadius: 18, padding: '16px', marginBottom: 12 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', fontFamily: 'DM Mono, monospace', marginBottom: 14 }}>Course à pied</div>
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
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: '3px solid #F59E0B', borderRadius: 18, padding: '16px', marginBottom: 12 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', fontFamily: 'DM Mono, monospace', marginBottom: 14 }}>Évolution · km/semaine</div>
        <BarChart data={stats.weeks} color="#F59E0B" />
      </div>

      {/* Muscu */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: '3px solid #6366F1', borderRadius: 18, padding: '16px', marginBottom: 12 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', fontFamily: 'DM Mono, monospace', marginBottom: 14 }}>Musculation & sport</div>
        <StatRow label="Séances muscu" value={stats.muscus.length} unit="" color="#6366F1" max={8} />
        {stats.muscus.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Aucune séance muscu détectée sur Strava.</div>}
      </div>

      {/* Bilan IA */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: '3px solid #FF0040', borderRadius: 18, padding: '16px' }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', fontFamily: 'DM Mono, monospace', marginBottom: 14 }}>Bilan IA</div>
        {!aiText && !aiLoading && (
          <button onClick={getAIBilan} style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #FF0040, #b91c1c)', color: '#fff', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Icon name="lightning" size={16} color="#fff" /> Générer mon bilan IA
          </button>
        )}
        {aiLoading && (
          <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-muted)', fontSize: 13 }}>Analyse en cours…</div>
        )}
        {aiText && (
          <div>
            {aiText.split('\n').map((line, i) => {
              const trimmed = line.trim();
              if (!trimmed) return null;
              const isReco = /^[1-9][.)]\s/.test(trimmed);
              const isTitle = /^(Bilan|Recommandation|Points?|État|Analyse)/i.test(trimmed) && trimmed.endsWith(':');
              if (isTitle) return <div key={i} style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', marginTop: 14, marginBottom: 8, fontFamily: 'DM Mono, monospace' }}>{trimmed.replace(/:$/, '')}</div>;
              if (isReco) return (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ minWidth: 22, height: 22, borderRadius: 7, background: 'rgba(255,0,64,0.12)', color: '#FF0040', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Mono, monospace', flexShrink: 0 }}>{trimmed[0]}</div>
                  <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)' }}>{trimmed.replace(/^[1-9][.)]\s*/, '')}</div>
                </div>
              );
              return <div key={i} style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text-secondary)', marginBottom: 6 }}>{trimmed}</div>;
            })}
            <button onClick={getAIBilan} style={{ marginTop: 14, background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 14px', fontSize: 11, color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'Syne, sans-serif', display: 'flex', alignItems: 'center', gap: 6 }}>↻ Régénérer</button>
          </div>
        )}
      </div>
    </div>
  );
}
