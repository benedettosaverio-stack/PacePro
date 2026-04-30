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

function metersToKm(m) { return (m / 1000).toFixed(1); }
function mpsToMinKm(mps) {
  if (!mps || mps === 0) return '--';
  const sec = 1000 / mps;
  return `${Math.floor(sec / 60)}'${String(Math.round(sec % 60)).padStart(2, '0')}"`;
}

function ScoreRing({ score, label, color }) {
  const r = 28, circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <svg width={72} height={72} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={36} cy={36} r={r} fill="none" stroke="var(--border)" strokeWidth={5} />
        <circle cx={36} cy={36} r={r} fill="none" stroke={color} strokeWidth={5}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }} />
        <text x={36} y={36} textAnchor="middle" dominantBaseline="middle"
          style={{ fill: 'var(--text-primary)', fontSize: 14, fontWeight: 700, fontFamily: 'DM Mono, monospace', transform: 'rotate(90deg)', transformOrigin: '36px 36px' }}>
          {score}
        </text>
      </svg>
      <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center' }}>{label}</span>
    </div>
  );
}

function Gauge({ value, max, label, unit, color }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', color: 'var(--text-primary)', fontWeight: 600 }}>{value}{unit}</span>
      </div>
      <div style={{ height: 6, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width 1s ease' }} />
      </div>
    </div>
  );
}

function MiniBarChart({ data, color }) {
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 60, marginTop: 8 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{ width: '100%', background: color, borderRadius: '4px 4px 0 0', opacity: 0.85,
            height: `${Math.max((d.value / max) * 52, d.value > 0 ? 4 : 0)}px`, transition: 'height 1s ease' }} />
          <span style={{ fontSize: 8, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.2 }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function Card({ title, children, accent }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16,
      padding: '18px 16px', marginBottom: 12, borderLeft: accent ? `3px solid ${accent}` : undefined }}>
      {title && <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em',
        color: 'var(--text-muted)', marginBottom: 14 }}>{title}</div>}
      {children}
    </div>
  );
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
    const prompt = `Tu es un coach sportif expert. Voici les données Strava des 20 dernières activités d'un athlète :
- Courses à pied : ${stats.runs.length} séances, ${stats.totalRunKm.toFixed(1)} km total
- Allure moyenne : ${mpsToMinKm(stats.avgPace)} min/km
- FC moyenne : ${stats.avgHR ? Math.round(stats.avgHR) + ' bpm' : 'non disponible'}
- Sortie la plus longue : ${stats.longestRun.toFixed(1)} km
- Séances muscu/sport : ${stats.muscus.length}
- Score volume : ${stats.scoreVolume}/100
- Score régularité : ${stats.scoreRegularite}/100
- Score muscu : ${stats.scoreMuscu}/100

Fais un bilan physique court et percutant (5-6 lignes max), puis donne 3 recommandations concrètes numérotées. Sois direct, sans intro ni outro. Langue : français.`;

    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const d = await res.json();
      setAiText(d.text || 'Erreur IA.');
    } catch {
      setAiText('Erreur lors de la génération.');
    }
    setAiLoading(false);
  }

  const headerStyle = { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, paddingTop: 4 };

  if (status === 'no_token') return (
    <div style={{ padding: '24px 16px', color: 'var(--text-primary)', fontFamily: 'Syne, sans-serif' }}>
      <div style={headerStyle}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <Icon name="arrow_left" size={22} color="var(--text-secondary)" />
        </button>
        <span style={{ fontWeight: 700, fontSize: 18 }}>Bilan physique</span>
      </div>
      <Card><div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 14 }}>Connecte ton compte Strava pour accéder au bilan.</div></Card>
    </div>
  );

  if (status === 'loading') return (
    <div style={{ padding: '24px 16px', color: 'var(--text-primary)', fontFamily: 'Syne, sans-serif' }}>
      <div style={headerStyle}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <Icon name="arrow_left" size={22} color="var(--text-secondary)" />
        </button>
        <span style={{ fontWeight: 700, fontSize: 18 }}>Bilan physique</span>
      </div>
      <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)', fontSize: 13 }}>Chargement des activités Strava…</div>
    </div>
  );

  if (status === 'error') return (
    <div style={{ padding: '24px 16px', color: 'var(--text-primary)', fontFamily: 'Syne, sans-serif' }}>
      <div style={headerStyle}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <Icon name="arrow_left" size={22} color="var(--text-secondary)" />
        </button>
        <span style={{ fontWeight: 700, fontSize: 18 }}>Bilan physique</span>
      </div>
      <Card><div style={{ textAlign: 'center', padding: '20px 0', color: '#DB3B3D', fontSize: 14 }}>Impossible de charger les activités. Vérifie ta connexion Strava.</div></Card>
    </div>
  );

  return (
    <div style={{ padding: '24px 16px 100px', color: 'var(--text-primary)', fontFamily: 'Syne, sans-serif', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <div style={headerStyle}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <Icon name="arrow_left" size={22} color="var(--text-secondary)" />
        </button>
        <div>
          <div style={{ fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em' }}>Bilan physique</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            {activities.length} activités analysées
          </div>
        </div>
      </div>

      <Card title="Scores globaux">
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          <ScoreRing score={stats.scoreVolume} label="Volume" color="#DB3B3D" />
          <ScoreRing score={stats.scoreRegularite} label="Régularité" color="#F59E0B" />
          <ScoreRing score={stats.scoreMuscu} label="Muscu" color="#6366F1" />
        </div>
      </Card>

      <Card title="Course à pied" accent="#DB3B3D">
        <Gauge value={parseFloat(stats.totalRunKm.toFixed(1))} max={60} label="Volume total" unit=" km" color="#DB3B3D" />
        <Gauge value={stats.runs.length} max={12} label="Séances" unit="" color="#DB3B3D" />
        {stats.avgHR && <Gauge value={Math.round(stats.avgHR)} max={200} label="FC moyenne" unit=" bpm" color="#F59E0B" />}
        <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
          <div style={{ flex: 1, background: 'var(--bg-primary)', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'DM Mono, monospace', color: '#DB3B3D' }}>{mpsToMinKm(stats.avgPace)}</div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 2 }}>Allure moy.</div>
          </div>
          <div style={{ flex: 1, background: 'var(--bg-primary)', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'DM Mono, monospace', color: '#DB3B3D' }}>{stats.longestRun.toFixed(1)}</div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 2 }}>Km max sortie</div>
          </div>
        </div>
      </Card>

      <Card title="Évolution — km / semaine" accent="#F59E0B">
        <MiniBarChart data={stats.weeks} color="#F59E0B" />
      </Card>

      <Card title="Musculation & sport" accent="#6366F1">
        <Gauge value={stats.muscus.length} max={8} label="Séances muscu" unit="" color="#6366F1" />
        {stats.muscus.length === 0 && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Aucune séance muscu détectée sur Strava.</div>
        )}
      </Card>

      <Card title="Bilan IA" accent="#DB3B3D">
        {!aiText && !aiLoading && (
          <button onClick={getAIBilan} style={{
            width: '100%', padding: '13px', borderRadius: 12, border: 'none',
            background: 'linear-gradient(135deg, #DB3B3D, #b91c1c)', color: '#fff',
            fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <Icon name="lightning" size={16} color="#fff" />
            Générer mon bilan IA
          </button>
        )}
        {aiLoading && (
          <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-muted)', fontSize: 13 }}>Analyse en cours…</div>
        )}
        {aiText && (
          <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
            {aiText}
            <button onClick={getAIBilan} style={{
              marginTop: 14, background: 'none', border: '1px solid var(--border)',
              borderRadius: 8, padding: '6px 12px', fontSize: 11, color: 'var(--text-muted)',
              cursor: 'pointer', fontFamily: 'Syne, sans-serif',
            }}>↻ Régénérer</button>
          </div>
        )}
      </Card>
    </div>
  );
}
