'use client';
import { useState, useEffect } from 'react';

const card = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px 18px' };
const btnRed = { background: '#FF0040', color: '#000', border: 'none', borderRadius: 12, padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' };
const btnGhost = { background: 'var(--btn-ghost-bg)', border: '1px solid var(--btn-ghost-border)', color: 'var(--btn-ghost-color)', borderRadius: 12, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' };

const STRAVA_CLIENT_ID = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID;
const REDIRECT_URI = typeof window !== 'undefined'
  ? `${window.location.origin}/api/strava?action=callback`
  : '';

function formatPace(metersPerSecond) {
  if (!metersPerSecond) return '—';
  const secsPerKm = 1000 / metersPerSecond;
  const mins = Math.floor(secsPerKm / 60);
  const secs = Math.round(secsPerKm % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatDist(meters) {
  return (meters / 1000).toFixed(2) + ' km';
}

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h${m.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
}

function ActivityCard({ activity, planPaces }) {
  const isRun = activity.type === 'Run' || activity.type === 'TrailRun';
  const pace = formatPace(activity.average_speed);
  const typeEmoji = activity.type === 'TrailRun' ? '🏔️' : activity.type === 'Run' ? '🏃' : '🚴';
  const elevColor = activity.total_elevation_gain > 200 ? '#f59e0b' : 'var(--text-muted)';

  return (
    <div style={{ ...card, marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 18 }}>{typeEmoji}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{activity.name}</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{formatDate(activity.start_date_local)}</div>
        </div>
        {activity.map?.summary_polyline && (
          <div style={{ width: 48, height: 48, borderRadius: 10, background: 'rgba(255,0,64,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🗺️</div>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {[
          ['Distance', formatDist(activity.distance), '#FF0040'],
          ['Durée', formatDuration(activity.moving_time), 'var(--text-primary)'],
          ['Allure', `${pace}/km`, '#22c55e'],
          ['D+', `${Math.round(activity.total_elevation_gain)}m`, elevColor],
        ].map(([label, value, color]) => (
          <div key={label} style={{ background: 'var(--bg-input)', borderRadius: 10, padding: '8px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 3 }}>{label}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color, fontFamily: 'monospace' }}>{value}</div>
          </div>
        ))}
      </div>
      {activity.average_heartrate && (
        <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)', display: 'flex', gap: 12 }}>
          <span>❤️ {Math.round(activity.average_heartrate)} bpm moy.</span>
          {activity.max_heartrate && <span>⬆️ {Math.round(activity.max_heartrate)} bpm max</span>}
          {activity.suffer_score && <span>😅 Souffrance: {activity.suffer_score}</span>}
        </div>
      )}
    </div>
  );
}

function Stats({ activities }) {
  const runs = activities.filter(a => a.type === 'Run' || a.type === 'TrailRun');
  const totalKm = runs.reduce((a, r) => a + r.distance, 0) / 1000;
  const totalTime = runs.reduce((a, r) => a + r.moving_time, 0);
  const avgPace = runs.length ? formatPace(runs.reduce((a, r) => a + r.average_speed, 0) / runs.length) : '—';
  const totalElev = runs.reduce((a, r) => a + (r.total_elevation_gain || 0), 0);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 20 }}>
      {[
        ['Total km', `${totalKm.toFixed(0)} km`, '#FF0040'],
        ['Sorties', `${runs.length}`, '#22c55e'],
        ['Allure moy.', `${avgPace}/km`, '#f59e0b'],
        ['Dénivelé', `${Math.round(totalElev)}m`, '#a78bfa'],
      ].map(([label, value, color]) => (
        <div key={label} style={{ ...card, textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
          <div style={{ fontSize: 22, fontWeight: 800, color, fontFamily: 'monospace' }}>{value}</div>
        </div>
      ))}
    </div>
  );
}

export default function StravaModule() {
  const [token, setToken] = useState(null);
  const [athlete, setAthlete] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const saved = localStorage.getItem('strava_token');
    const savedAthlete = localStorage.getItem('strava_athlete');
    if (saved) setToken(saved);
    if (savedAthlete) try { setAthlete(JSON.parse(savedAthlete)); } catch {}
  }, []);

  useEffect(() => {
    if (token) loadActivities();
  }, [token]);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/strava?action=activities&token=${token}`);
      const data = await res.json();
      if (Array.isArray(data)) setActivities(data);
    } catch {}
    setLoading(false);
  };

  const connectStrava = () => {
    const scope = 'read,activity:read_all';
    const url = `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&redirect_uri=${encodeURIComponent(window.location.origin + '/api/strava?action=callback')}&response_type=code&scope=${scope}`;
    window.location.href = url;
  };

  const disconnect = () => {
    localStorage.removeItem('strava_token');
    localStorage.removeItem('strava_athlete');
    setToken(null);
    setAthlete(null);
    setActivities([]);
  };

  const filtered = activities.filter(a => {
    if (filter === 'run') return a.type === 'Run' || a.type === 'TrailRun';
    if (filter === 'trail') return a.type === 'TrailRun';
    if (filter === 'other') return a.type !== 'Run' && a.type !== 'TrailRun';
    return true;
  });

  if (!token) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'Syne, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 60, marginBottom: 16 }}>🚴</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.03em' }}>Connecte Strava</h2>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 32, lineHeight: 1.6 }}>Importe tes sorties automatiquement et compare tes allures réelles avec ton plan PacePro.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
            {['📍 Sorties GPS importées automatiquement', '⚡ Allures réelles vs allures prévues', '❤️ Fréquence cardiaque et zones', '📈 Stats des 20 dernières activités'].map(f => (
              <div key={f} style={{ ...card, textAlign: 'left', fontSize: 13, color: 'var(--text-secondary)' }}>{f}</div>
            ))}
          </div>
          <button onClick={connectStrava} style={{ ...btnRed, width: '100%', padding: '14px', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>🔗</span> Connecter Strava
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'Syne, sans-serif', paddingBottom: 80 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'var(--bg-nav)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border-nav)', padding: '0 20px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {athlete?.photo && <img src={athlete.photo} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />}
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{athlete?.name || 'Strava'}</div>
            <div style={{ fontSize: 10, color: '#FC4C02', fontWeight: 600, fontFamily: 'monospace' }}>● CONNECTÉ</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={loadActivities} style={{ ...btnGhost, padding: '6px 12px', fontSize: 12 }}>↻ Sync</button>
          <button onClick={disconnect} style={{ ...btnGhost, padding: '6px 12px', fontSize: 12, color: 'rgba(239,68,68,0.7)' }}>Déco.</button>
        </div>
      </div>

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '20px 16px' }}>
        {activities.length > 0 && <Stats activities={activities} />}

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
          {[['all', 'Tout'], ['run', '🏃 Running'], ['trail', '🏔️ Trail'], ['other', '🚴 Autre']].map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)}
              style={{ flexShrink: 0, borderRadius: 12, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', background: filter === v ? 'rgba(255,0,64,0.15)' : 'var(--btn-ghost-bg)', border: `1px solid ${filter === v ? 'rgba(255,0,64,0.4)' : 'var(--btn-ghost-border)'}`, color: filter === v ? '#FF0040' : 'var(--btn-ghost-color)' }}>
              {l}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
            <div>Chargement des activités...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏃</div>
            <div>Aucune activité trouvée</div>
          </div>
        ) : (
          filtered.map(a => <ActivityCard key={a.id} activity={a} />)
        )}
      </div>
    </div>
  );
}
