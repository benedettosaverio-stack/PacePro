'use client';
import { useState, useEffect } from 'react';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const card = { background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:'14px 16px' };
const btnRed = { background:'#FF0040', color:'#000', border:'none', borderRadius:10, padding:'9px 16px', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' };
const btnGhost = { background:'var(--btn-ghost-bg)', border:'1px solid var(--btn-ghost-border)', color:'var(--btn-ghost-color)', borderRadius:10, padding:'9px 14px', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' };

// Client Supabase léger sans dépendance
async function supaFetch(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...options.headers,
    },
  });
  if (!res.ok) { const e = await res.text(); throw new Error(e); }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function upsertUser(stravaId, name, photo) {
  // D'abord cherche si l'user existe
  const existing = await supaFetch(`users?strava_id=eq.${stravaId}&limit=1`);
  if (existing && existing.length > 0) return existing[0];
  // Sinon crée-le
  const data = await supaFetch('users', {
    method: 'POST',
    body: JSON.stringify({ strava_id: stravaId, name, photo }),
  });
  return Array.isArray(data) ? data[0] : data;
}

async function saveSessionDB(userId, session) {
  const data = await supaFetch('sessions', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, ...session }),
  });
  return Array.isArray(data) ? data[0] : data;
}

async function getSessions(userId) {
  return supaFetch(`sessions?user_id=eq.${userId}&order=date.desc&limit=50`);
}

async function deleteSession(sessionId) {
  await supaFetch(`sessions?id=eq.${sessionId}`, { method: 'DELETE' });
}

function formatTime(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h${m.toString().padStart(2,'0')}`;
  return `${m}:${sec.toString().padStart(2,'0')}`;
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('fr-FR', { weekday:'short', day:'numeric', month:'short', year:'numeric' });
}

// ─── Carte séance ─────────────────────────────────────────────────────────────
function SessionCard({ session, onOpen, onDelete }) {
  return (
    <div style={{ ...card, marginBottom:10 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
        <div onClick={onOpen} style={{ flex:1, cursor:'pointer' }}>
          <div style={{ fontSize:14, fontWeight:700, color:'var(--text-primary)', marginBottom:2 }}>{session.workout_name}</div>
          <div style={{ fontSize:11, color:'var(--text-muted)' }}>{formatDate(session.date)}</div>
        </div>
        <div style={{ display:'flex', gap:6, alignItems:'center' }}>
          {session.strava_activity_id && (
            <span style={{ fontSize:10, background:'rgba(252,76,2,0.1)', color:'#FC4C02', borderRadius:6, padding:'2px 8px', fontWeight:600, fontFamily:'monospace' }}>🟠 Strava</span>
          )}
          <button onClick={e => { e.stopPropagation(); onDelete(); }}
            style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.15)', borderRadius:8, padding:'4px 8px', color:'rgba(239,68,68,0.6)', fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>
            ✕
          </button>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
        {[
          ['⏱ Durée', formatTime(session.duration || 0)],
          ['🔥 Volume', `${Math.round(session.total_volume || 0)} kg`],
          ['💪 Séries', Object.keys(session.completed_sets || {}).length],
        ].map(([label, value]) => (
          <div key={label} style={{ background:'var(--bg-input)', borderRadius:10, padding:'8px', textAlign:'center' }}>
            <div style={{ fontSize:9, color:'var(--text-muted)', marginBottom:2, fontFamily:'monospace' }}>{label}</div>
            <div style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)', fontFamily:'monospace' }}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Détail séance ────────────────────────────────────────────────────────────
function SessionDetail({ session, onBack }) {
  const entries = session.entries || [];
  const completed = session.completed_sets || {};

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
        <button onClick={onBack} style={{ ...btnGhost, padding:'7px 12px', fontSize:12 }}>← Retour</button>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:16, fontWeight:800, color:'var(--text-primary)' }}>{session.workout_name}</div>
          <div style={{ fontSize:11, color:'var(--text-muted)' }}>{formatDate(session.date)}</div>
        </div>
        {session.strava_activity_id && (
          <a href={`https://www.strava.com/activities/${session.strava_activity_id}`} target="_blank"
            style={{ fontSize:11, background:'rgba(252,76,2,0.1)', color:'#FC4C02', borderRadius:8, padding:'5px 10px', fontWeight:600, textDecoration:'none' }}>
            🟠 Voir sur Strava
          </a>
        )}
      </div>

      {/* Stats globales */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:16 }}>
        {[
          ['⏱ Durée', formatTime(session.duration || 0)],
          ['🔥 Volume', `${Math.round(session.total_volume || 0)} kg`],
          ['💪 Exercices', entries.length],
        ].map(([label, value]) => (
          <div key={label} style={{ ...card, textAlign:'center' }}>
            <div style={{ fontSize:9, color:'var(--text-muted)', marginBottom:4, fontFamily:'monospace' }}>{label}</div>
            <div style={{ fontSize:18, fontWeight:800, color:'var(--text-primary)', fontFamily:'monospace' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Exercices */}
      {entries.map((entry, ei) => {
        const ex = entry.exercise;
        const setsForEx = Object.entries(completed)
          .filter(([k]) => k.startsWith(`${ei}_`))
          .map(([k, v]) => ({ setNum: parseInt(k.split('_')[1]) + 1, ...v }))
          .sort((a, b) => a.setNum - b.setNum);

        return (
          <div key={ei} style={{ ...card, marginBottom:10 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)', marginBottom:8 }}>{ex?.name || '—'}</div>
            {setsForEx.length > 0 ? (
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                {setsForEx.map(s => (
                  <div key={s.setNum} style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--text-secondary)', background:'var(--bg-input)', borderRadius:8, padding:'6px 10px' }}>
                    <span style={{ color:'var(--text-muted)' }}>Série {s.setNum}</span>
                    <span style={{ fontFamily:'monospace' }}>{s.reps} reps × {s.weight} kg</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize:11, color:'var(--text-muted)' }}>{entry.sets}×{entry.reps}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Stats globales ───────────────────────────────────────────────────────────
function GlobalStats({ sessions }) {
  const totalVol = sessions.reduce((s, x) => s + (x.total_volume || 0), 0);
  const totalTime = sessions.reduce((s, x) => s + (x.duration || 0), 0);
  const totalSets = sessions.reduce((s, x) => s + Object.keys(x.completed_sets || {}).length, 0);
  const stravaSync = sessions.filter(x => x.strava_activity_id).length;

  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10, marginBottom:20 }}>
      {[
        ['📅 Séances', sessions.length, '#FF0040'],
        ['🔥 Volume total', `${Math.round(totalVol / 1000)}t`, '#f59e0b'],
        ['⏱ Temps total', formatTime(totalTime), '#22c55e'],
        ['🟠 Strava sync', stravaSync, '#FC4C02'],
      ].map(([label, value, color]) => (
        <div key={label} style={{ ...card, textAlign:'center' }}>
          <div style={{ fontSize:9, color:'var(--text-muted)', marginBottom:4, fontFamily:'monospace', textTransform:'uppercase' }}>{label}</div>
          <div style={{ fontSize:20, fontWeight:800, color, fontFamily:'monospace' }}>{value}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Module principal ─────────────────────────────────────────────────────────
export default function HistoriqueModule() {
  const [user, setUser] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    initUser();
  }, []);

  const initUser = async () => {
    setLoading(true);
    try {
      // Récupère l'athlete Strava depuis localStorage
      const athleteStr = localStorage.getItem('strava_athlete');
      if (!athleteStr) { setLoading(false); return; }

      let athlete;
      try { athlete = JSON.parse(athleteStr); } catch { setLoading(false); return; }

      // Essaie les différents formats possibles
      const stravaId = athlete?.id || athlete?.strava_id;
      const name = athlete?.name || athlete?.firstname + ' ' + athlete?.lastname || 'Athlete';
      const photo = athlete?.photo || athlete?.profile_medium || '';

      if (!stravaId) { setLoading(false); return; }

      // Crée ou récupère le compte utilisateur
      const dbUser = await upsertUser(Number(stravaId), name, photo);
      if (!dbUser) { setLoading(false); return; }

      // Sauvegarde localement
      localStorage.setItem('pp_user_id', dbUser.id);
      setUser(dbUser);

      // Charge les séances
      const dbSessions = await getSessions(dbUser.id);
      setSessions(dbSessions || []);
    } catch(e) {
      console.error('initUser error:', e);
    }
    setLoading(false);
  };

  // Sync les séances locales vers Supabase
  const syncLocalSessions = async () => {
    if (!user) return;
    setSyncing(true);
    try {
      const local = JSON.parse(localStorage.getItem('pp_session_logs') || '[]');
      for (const s of local) {
        if (s.synced) continue;
        await saveSessionDB(user.id, {
          workout_name: s.workoutName || 'Séance',
          duration: s.duration || 0,
          total_volume: s.totalVolume || 0,
          completed_sets: s.completedSets || {},
          entries: s.entries || [],
          strava_activity_id: s.stravaActivityId || null,
          date: s.date || new Date().toISOString(),
        });
        s.synced = true;
      }
      localStorage.setItem('pp_session_logs', JSON.stringify(local));
      const refreshed = await getSessions(user.id);
      setSessions(refreshed || []);
    } catch(e) {
      console.error('syncLocalSessions error:', e);
    }
    setSyncing(false);
  };

  if (loading) {
    return (
      <div style={{ minHeight:'100vh', background:'var(--bg-primary)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Syne, sans-serif' }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:36, marginBottom:12 }}>⏳</div>
          <div style={{ fontSize:14, color:'var(--text-muted)' }}>Chargement...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ minHeight:'100vh', background:'var(--bg-primary)', color:'var(--text-primary)', fontFamily:'Syne, sans-serif', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
        <div style={{ maxWidth:380, width:'100%', textAlign:'center' }}>
          <div style={{ fontSize:56, marginBottom:16 }}>📊</div>
          <h2 style={{ fontSize:22, fontWeight:800, marginBottom:8, letterSpacing:'-0.03em' }}>Historique des séances</h2>
          <p style={{ fontSize:13, color:'var(--text-muted)', marginBottom:32, lineHeight:1.6 }}>
            Connecte-toi avec Strava pour synchroniser tes séances sur tous tes appareils et accéder à ton historique complet.
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:24 }}>
            {['📱 Sync multi-appareils', '📈 Stats et progression', '🟠 Lien avec Strava', '☁️ Sauvegarde cloud'].map(f => (
              <div key={f} style={{ ...card, textAlign:'left', fontSize:13, color:'var(--text-secondary)' }}>{f}</div>
            ))}
          </div>
          <p style={{ fontSize:12, color:'var(--text-muted)' }}>
            👉 Va dans l'onglet <strong>🟠 Strava</strong> pour te connecter, puis reviens ici.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-primary)', color:'var(--text-primary)', fontFamily:'Syne, sans-serif', paddingBottom:70 }}>
      <div style={{ maxWidth:700, margin:'0 auto', padding:'18px 16px 0' }}>

        {!selected && (
          <>
            {/* Header user */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                {user.photo && <img src={user.photo} alt="" style={{ width:40, height:40, borderRadius:'50%', objectFit:'cover' }} />}
                <div>
                  <div style={{ fontSize:16, fontWeight:800, color:'var(--text-primary)' }}>{user.name}</div>
                  <div style={{ fontSize:11, color:'#FC4C02', fontWeight:600, fontFamily:'monospace' }}>● Connecté via Strava</div>
                </div>
              </div>
              <button onClick={syncLocalSessions} disabled={syncing}
                style={{ ...btnGhost, padding:'7px 12px', fontSize:11, opacity: syncing ? 0.6 : 1 }}>
                {syncing ? '⏳ Sync...' : '↻ Synchroniser'}
              </button>
            </div>

            {/* Stats */}
            {sessions.length > 0 && <GlobalStats sessions={sessions} />}

            {/* Liste séances */}
            <div style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'monospace', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>
              {sessions.length} séance{sessions.length !== 1 ? 's' : ''} enregistrée{sessions.length !== 1 ? 's' : ''}
            </div>

            {sessions.length === 0 ? (
              <div style={{ ...card, textAlign:'center', padding:'36px 20px' }}>
                <div style={{ fontSize:36, marginBottom:10 }}>🏋️</div>
                <div style={{ fontSize:14, fontWeight:600, marginBottom:6 }}>Aucune séance enregistrée</div>
                <p style={{ fontSize:12, color:'var(--text-muted)', marginBottom:16 }}>Termine une séance dans l'onglet 💪 Muscu pour la voir apparaître ici.</p>
                <button onClick={syncLocalSessions} disabled={syncing} style={{ ...btnRed, opacity: syncing ? 0.6 : 1 }}>
                  {syncing ? '⏳...' : '↻ Sync séances locales'}
                </button>
              </div>
            ) : (
              sessions.map(s => (
                <SessionCard key={s.id} session={s}
                  onOpen={() => setSelected(s)}
                  onDelete={async () => {
                    if (!confirm('Supprimer cette séance ?')) return;
                    await deleteSession(s.id);
                    setSessions(prev => prev.filter(x => x.id !== s.id));
                  }} />
              ))
            )}
          </>
        )}

        {selected && (
          <SessionDetail session={selected} onBack={() => setSelected(null)} />
        )}
      </div>
    </div>
  );
}
