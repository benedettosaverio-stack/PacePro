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
          <div onClick={() => onNavigate('running')} style={{ borderRadius: 20, marginBottom: 16, cursor: 'pointer', position: 'relative', overflow: 'hidden', background: '#0d0608', border: '1px solid rgba(255,0,64,0.25)', minHeight: 160 }}>
            {/* Topographic texture */}
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.1 }} viewBox="0 0 400 160" preserveAspectRatio="xMidYMid slice">
              <ellipse cx="200" cy="175" rx="180" ry="50" fill="none" stroke="#FF0040" strokeWidth="1"/>
              <ellipse cx="200" cy="175" rx="150" ry="40" fill="none" stroke="#FF0040" strokeWidth="1"/>
              <ellipse cx="200" cy="175" rx="120" ry="30" fill="none" stroke="#FF0040" strokeWidth="1"/>
              <ellipse cx="200" cy="175" rx="90" ry="20" fill="none" stroke="#FF0040" strokeWidth="1"/>
              <ellipse cx="200" cy="175" rx="60" ry="12" fill="none" stroke="#FF0040" strokeWidth="1"/>
              <ellipse cx="120" cy="168" rx="80" ry="22" fill="none" stroke="#FF0040" strokeWidth="0.8"/>
              <ellipse cx="300" cy="170" rx="70" ry="18" fill="none" stroke="#FF0040" strokeWidth="0.8"/>
            </svg>
            {/* Glow */}
            <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 200, height: 80, background: 'radial-gradient(circle, rgba(255,0,64,0.25) 0%, transparent 70%)', pointerEvents: 'none' }} />
            {/* Elevation profile */}
            <svg style={{ position: 'absolute', bottom: 0, left: 0, right: 0, width: '100%', opacity: 0.6 }} viewBox="0 0 400 60" preserveAspectRatio="none">
              <defs>
                <linearGradient id="elev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF0040" stopOpacity="0.6"/>
                  <stop offset="100%" stopColor="#FF0040" stopOpacity="0"/>
                </linearGradient>
              </defs>
              <path d="M0 60 L0 45 Q20 42 40 38 Q70 30 100 35 Q130 40 160 28 Q190 16 220 20 Q250 24 280 18 Q310 12 340 22 Q370 32 400 28 L400 60 Z" fill="url(#elev)"/>
              <path d="M0 45 Q20 42 40 38 Q70 30 100 35 Q130 40 160 28 Q190 16 220 20 Q250 24 280 18 Q310 12 340 22 Q370 32 400 28" fill="none" stroke="#FF0040" strokeWidth="1.5"/>
              {/* Dot on peak */}
              <circle cx="310" cy="12" r="3" fill="#FF0040"/>
              <line x1="310" y1="12" x2="310" y2="60" stroke="#FF0040" strokeWidth="0.5" strokeDasharray="3,3" opacity="0.4"/>
            </svg>
            {/* Content */}
            <div style={{ position: 'relative', zIndex: 1, padding: '16px 16px 48px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 9, color: 'rgba(255,0,64,0.8)', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>‹ Prochaine séance · S{nextSession.week} · {nextSession.day}</div>
                  <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 4, color: '#fff' }}>{nextSession.title}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{nextSession.detail}</div>
                </div>
                <button onClick={e => { e.stopPropagation(); onNavigate('running'); }} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: 12, padding: '10px 14px', cursor: 'pointer', flexShrink: 0, marginLeft: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 900, color: '#0d0608', letterSpacing: '0.05em' }}>START</span>
                  <span style={{ fontSize: 14, color: '#FF0040' }}>▶</span>
                </button>
              </div>
            </div>
            {/* Progress bar */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3 }}>
              <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg,#FF0040,#fbbf24)' }} />
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
          {nav.map(item => (
            <button key={item.id} onClick={() => onNavigate(item.id)} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 18, padding: '16px', cursor: 'pointer', fontFamily: 'Syne, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10, position: 'relative', overflow: 'hidden', textAlign: 'left' }}>
              <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, borderRadius: '50%', background: `radial-gradient(circle, ${item.color}12 0%, transparent 70%)`, pointerEvents: 'none' }} />
              <div style={{ width: 40, height: 40, borderRadius: 12, background: `${item.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={item.icon} size={20} color={item.color} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 2 }}>{item.label}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>{item.desc}</div>
              </div>
            </button>
          ))}
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
