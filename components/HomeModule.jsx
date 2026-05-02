'use client';
import { useState, useEffect } from 'react';
import Icon from './Icons';

export default function HomeModule({ onNavigate }) {
  const [athlete, setAthlete] = useState(null);
  const [plans, setPlans] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    try {
      const a = localStorage.getItem('strava_athlete');
      if (a) setAthlete(JSON.parse(a));
      const p = localStorage.getItem('pp_plans');
      if (p) setPlans(JSON.parse(p));
      const w = localStorage.getItem('pp_workouts_pro');
      if (w) setWorkouts(JSON.parse(w));
    } catch {}
    const t = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const hour = time.getHours();
  const greeting = hour < 6 ? 'Bonne nuit' : hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
  const firstName = athlete?.name?.split(' ')[0] || 'Athlete';

  // Stats rapides
  const activePlan = plans[plans.length - 1];
  const totalSessions = activePlan?.plan?.reduce((a, w) => a + w.sessions.length, 0) || 0;
  const doneSessions = activePlan ? Object.values(activePlan.completed || {}).filter(Boolean).length : 0;
  const progress = totalSessions > 0 ? Math.round((doneSessions / totalSessions) * 100) : 0;
  const nextSession = activePlan?.plan?.flatMap(w => w.sessions.map(s => ({ ...s, week: w.week }))).find(s => !(activePlan.completed || {})[s.id]);

  const nav = [
    { id: 'running', icon: 'running', label: 'Running', color: '#FF0040', desc: activePlan ? `${progress}% complété` : 'Créer un plan' },
    { id: 'muscu', icon: 'muscle', label: 'Muscu', color: '#6366f1', desc: `${workouts.length} séance${workouts.length !== 1 ? 's' : ''}` },
    { id: 'strava', icon: 'strava', label: 'Strava', color: '#f59e0b', desc: athlete ? 'Connecté' : 'Se connecter' },
    { id: 'historique', icon: 'history', label: 'Historique', color: '#22c55e', desc: 'Voir tout' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'Syne, sans-serif', padding: 'calc(env(safe-area-inset-top, 44px) + 16px) 16px calc(env(safe-area-inset-bottom, 20px) + 90px)', position: 'relative', overflow: 'hidden' }}>

      {/* Glow background */}
      <div style={{ position: 'fixed', top: -100, left: '50%', transform: 'translateX(-50%)', width: 600, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,0,64,0.06) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* Greeting */}
        <div style={{ marginBottom: 24, paddingTop: 8, paddingRight: 120 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 4 }}>{greeting}</div>
          <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.1 }}>{firstName} 👋</div>
        </div>

        {/* Next session card */}
        {nextSession ? (
          <div onClick={() => onNavigate('running')} style={{ borderRadius: 20, marginBottom: 16, cursor: 'pointer', position: 'relative', overflow: 'hidden', background: '#111114', borderTop: '1px solid rgba(255,0,64,0.12)', borderLeft: '1px solid rgba(255,0,64,0.12)', borderRight: '1px solid rgba(255,0,64,0.12)', borderBottom: 'none', minHeight: 160 }}>
            {/* SVG background */}
            <img src="/topo.svg" alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', borderRadius:20, opacity:0.45 }} />
            <div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.2) 100%)', borderRadius:20 }} />


            {/* Content */}
            <div style={{ position: 'relative', zIndex: 1, padding: '16px 16px 48px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 9, color: 'rgba(255,0,64,0.8)', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>‹ Prochaine séance · S{nextSession.week} · {nextSession.day}</div>
                  <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 4, color: '#fff' }}>{nextSession.title}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{nextSession.detail}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0, marginLeft: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,0,64,0.15)', border: '1px solid rgba(255,0,64,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="#FF0040"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  </div>
                  <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Go</span>
                </div>
              </div>
            </div>
            {/* Elevation profile progress — inspired by UTMB */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 40, overflow: 'hidden' }}>
              <svg viewBox="0 0 400 40" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
                <defs>
                  <linearGradient id="progGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#FF0040"/>
                    <stop offset="60%" stopColor="#f59e0b"/>
                    <stop offset="100%" stopColor="#fbbf24"/>
                  </linearGradient>
                  <linearGradient id="fillGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#FF0040" stopOpacity="0.3"/>
                    <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.1"/>
                  </linearGradient>
                  <clipPath id={`prog-${progress}`}>
                    <rect x="0" y="0" width={`${progress * 4}`} height="40"/>
                  </clipPath>
                </defs>
                {/* Profil complet en gris */}
                <path d="M0 38 L0 32 Q10 31 20 28 Q30 24 40 26 Q55 29 65 22 Q75 14 85 10 Q95 6 105 8 Q115 11 125 18 Q135 24 145 20 Q155 15 165 8 Q175 2 185 4 Q195 7 205 14 Q215 20 225 16 Q235 11 245 6 Q255 1 265 4 Q275 8 285 14 Q295 20 305 24 Q315 28 325 22 Q335 15 345 20 Q355 26 365 30 Q375 34 385 32 Q392 31 400 32 L400 40 Z"
                  fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" fill-opacity="1"/>
                {/* Profil complété en couleur */}
                <g clipPath={`url(#prog-${progress})`}>
                  <path d="M0 32 Q10 31 20 28 Q30 24 40 26 Q55 29 65 22 Q75 14 85 10 Q95 6 105 8 Q115 11 125 18 Q135 24 145 20 Q155 15 165 8 Q175 2 185 4 Q195 7 205 14 Q215 20 225 16 Q235 11 245 6 Q255 1 265 4 Q275 8 285 14 Q295 20 305 24 Q315 28 325 22 Q335 15 345 20 Q355 26 365 30 Q375 34 385 32 Q392 31 400 32"
                    fill="none" stroke="url(#progGrad)" strokeWidth="2" strokeLinecap="round"/>
                </g>

              </svg>
            </div>
          </div>
        ) : (
          <div onClick={() => onNavigate('running')} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: '18px', marginBottom: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,0,64,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="running" size={24} color="#FF0040" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>Créer un programme</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Plan personnalisé avec IA</div>
            </div>
            <Icon name="arrow_right" size={16} color="var(--text-muted)" style={{ marginLeft: 'auto' }} />
          </div>
        )}

        {/* Nav grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>

          {/* Running */}
          <button onClick={() => onNavigate('running')} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 18, padding: '16px', cursor: 'pointer', fontFamily: 'Syne, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8, position: 'relative', overflow: 'hidden', textAlign: 'left' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,0,64,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'flex-start' }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: 'rgba(255,0,64,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="running" size={18} color="#FF0040" />
              </div>
              {activePlan && <span style={{ fontSize: 18, fontWeight: 900, color: '#FF0040', fontFamily: 'DM Mono, monospace', lineHeight: 1 }}>{progress}%</span>}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 2 }}>Running</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>{activePlan ? `${doneSessions}/${totalSessions} séances` : 'Créer un plan'}</div>
            </div>
            {activePlan && (
              <div style={{ width: '100%', height: 3, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg,#FF0040,#fbbf24)', borderRadius: 99 }} />
              </div>
            )}
          </button>

          {/* Muscu */}
          <button onClick={() => onNavigate('muscu')} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 18, padding: '16px', cursor: 'pointer', fontFamily: 'Syne, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8, position: 'relative', overflow: 'hidden', textAlign: 'left' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'flex-start' }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="muscle" size={18} color="#6366f1" />
              </div>
              {workouts.length > 0 && <span style={{ fontSize: 18, fontWeight: 900, color: '#6366f1', fontFamily: 'DM Mono, monospace', lineHeight: 1 }}>{workouts.length}</span>}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 2 }}>Muscu</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>{workouts.length > 0 ? `${Math.round(workouts.reduce((a,w)=>a+(w.entries||[]).length,0)/workouts.length)} ex. en moy.` : 'Aucune séance'}</div>
            </div>
            {workouts.length > 0 && (
              <div style={{ display: 'flex', gap: 3 }}>
                {workouts.slice(-5).map((_, i) => <div key={i} style={{ width: 6, height: 6, borderRadius: 2, background: '#6366f1', opacity: 0.4 + i * 0.15 }} />)}
              </div>
            )}
          </button>

          {/* Strava */}
          <button onClick={() => onNavigate('strava')} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 18, padding: '16px', cursor: 'pointer', fontFamily: 'Syne, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8, position: 'relative', overflow: 'hidden', textAlign: 'left' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'flex-start' }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="strava" size={18} color="#f59e0b" />
              </div>
              {athlete && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', marginTop: 4 }} />}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 2 }}>Strava</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>{athlete ? athlete.name?.split(' ')[0] + ' · Connecté' : 'Se connecter'}</div>
            </div>
            {athlete && <div style={{ fontSize: 9, color: '#f59e0b', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Sync activée</div>}
          </button>

          {/* Nutrition */}
          <button onClick={() => onNavigate('nutrition')} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 18, padding: '16px', cursor: 'pointer', fontFamily: 'Syne, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8, position: 'relative', overflow: 'hidden', textAlign: 'left' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ width: 38, height: 38, borderRadius: 11, background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="nutrition" size={18} color="#6366f1" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 2 }}>Nutrition</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>Macros · Hydratation</div>
            </div>
            <div style={{ fontSize: 9, color: '#6366f1', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Fuel & Recovery</div>
          </button>

        </div>

        {/* Bilan IA */}
        <button onClick={() => onNavigate('bilan')} style={{ width: '100%', background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(99,102,241,0.04))', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 18, padding: '16px 18px', cursor: 'pointer', fontFamily: 'Syne, sans-serif', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 13, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="lightning" size={22} color="#6366f1" />
          </div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 2 }}>Bilan physique IA</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Analyse Strava · Recommandations</div>
          </div>
          <Icon name="arrow_right" size={16} color="rgba(99,102,241,0.6)" />
        </button>

        {/* Logo footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 32, opacity: 0.3 }}>
          <img src="/logo.svg" alt="PacePro" style={{ width: 20, height: 20, objectFit: 'contain' }} />
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '-0.02em', fontFamily: 'DM Mono, monospace' }}>PACEPRO</span>
        </div>

      </div>
    </div>
  );
}
