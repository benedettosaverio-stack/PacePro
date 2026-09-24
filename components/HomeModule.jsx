'use client';
import { useState, useEffect } from 'react';
import Icon from './Icons';

export default function HomeModule({ onNavigate }) {
  const [athlete, setAthlete] = useState(null);
  const [plans, setPlans] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [time, setTime] = useState(new Date());

  const [motivation, setMotivation] = useState(() => {
    try {
      const cached = JSON.parse(localStorage.getItem('pp_motivation') || '{}');
      const today = new Date().toISOString().split('T')[0];
      if (cached.date === today) return cached.text;
    } catch {}
    return null;
  });
  const [motivLoading, setMotivLoading] = useState(false);
  const [displayed, setDisplayed] = useState('');
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    if (!motivation) return;
    // Une seule phrase max
    const match = motivation.match(/^[^.!?]*[.!?]/);
    const sentence = match ? match[0].trim() : motivation.trim();
    let i = 0;
    setDisplayed('');
    // Pause de 800ms avant de commencer
    const pause = setTimeout(() => {
      const interval = setInterval(() => {
        if (i < sentence.length) {
          setDisplayed(sentence.slice(0, i + 1));
          i++;
        } else {
          clearInterval(interval);
          setShowCursor(false);
        }
      }, 28);
      return () => clearInterval(interval);
    }, 800);
    return () => clearTimeout(pause);
  }, [motivation]);

  useEffect(() => {
    try {
      const ppUser = localStorage.getItem('pp_user');
      if (ppUser) setAthlete(JSON.parse(ppUser));
      const p = localStorage.getItem('pp_plans');
      if (p) setPlans(JSON.parse(p));
      const w = localStorage.getItem('pp_workouts_pro');
      if (w) setWorkouts(JSON.parse(w));
    } catch {}
    const t = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    generateMotivation();
  }, []);

  // Pool de citations statiques, tirées selon le ton choisi.
  // Une citation est tirée par jour, selon le ton choisi (goggins = dur, inspirant = bienveillant).
  const QUOTES_GOGGINS = [
    "{name}, personne ne va le faire à ta place. Lève-toi et bouge !",
    "{name}, la douleur d'aujourd'hui est la force de demain. Aucune excuse.",
    "{name}, ton esprit lâche bien avant ton corps. Repousse la limite.",
    "{name}, les autres dorment. C'est exactement pour ça que tu vas gagner.",
    "{name}, arrête de négocier avec toi-même. Enfile tes chaussures.",
    "{name}, le confort est ton pire ennemi. Va le chercher.",
    "{name}, tu ne dépasseras jamais tes limites en restant dans ta zone.",
    "{name}, personne ne se souvient des excuses. Tout le monde se souvient des résultats.",
  ];
  const QUOTES_INSPIRANT = [
    "{name}, chaque séance te rapproche un peu plus de ton objectif. Continue !",
    "{name}, la régularité bat le talent. Tu es sur la bonne voie.",
    "{name}, sois fier du chemin parcouru — et prêt pour la suite.",
    "{name}, ton corps peut le faire, c'est ton mental qu'il faut convaincre.",
    "{name}, un petit pas aujourd'hui, une grande victoire demain.",
    "{name}, la progression n'est pas toujours visible, mais elle est bien là.",
    "{name}, respire, avance, et fais-toi confiance.",
    "{name}, tu construis quelque chose de solide, séance après séance.",
  ];

  const generateMotivation = () => {
    try {
      const settings = JSON.parse(localStorage.getItem('pp_user_settings') || '{}');
      const tone = settings.motivationTone || 'inspirant';
      const ppUser = JSON.parse(localStorage.getItem('pp_user') || '{}');
      const name = ppUser.name?.split(' ')[0] || 'Athlete';
      const pool = tone === 'goggins' ? QUOTES_GOGGINS : QUOTES_INSPIRANT;
      // Index stable sur la journée, pour ne pas changer à chaque rendu
      const dayIndex = Math.floor(Date.now() / 86400000);
      const text = pool[dayIndex % pool.length].replace('{name}', name);
      setMotivation(text);
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem('pp_motivation', JSON.stringify({ date: today, text }));
    } catch {}
    setMotivLoading(false);
  };

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
    { id: 'historique', icon: 'history', label: 'Historique', color: '#22c55e', desc: 'Voir tout' },
  ];

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'Syne, sans-serif', padding: 'calc(env(safe-area-inset-top, 44px) + 16px) 16px calc(env(safe-area-inset-bottom, 20px) + 90px)', position: 'relative', overflow: 'hidden' }}>

      {/* Glow background — unique halo autorisé sur l'écran d'accueil, discret */}
      <div style={{ position: 'fixed', top: -120, left: '50%', transform: 'translateX(-50%)', width: 480, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,0,64,0.05) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* HERO CARD — clock + stats + motivation */}
        <div style={{ position:'relative', borderRadius:18, overflow:'hidden', border:'1px solid var(--border)', background:'var(--bg-card)', marginBottom:14 }}>
          <div style={{ padding:'16px', position:'relative', zIndex:2 }}>
            {/* Top row: greeting + clock */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
              <div>
                <div style={{ fontSize:10, color:'var(--text-muted)', fontFamily:'DM Mono, monospace', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:5, display:'flex', alignItems:'center', gap:6 }}>
                  <div style={{ width:5, height:5, borderRadius:'50%', background:'#FF0040' }}/>
                  {greeting}
                </div>
                <div style={{ fontSize:28, fontWeight:900, letterSpacing:'-0.03em', lineHeight:1, color:'var(--text-primary)' }}>{firstName}</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:22, fontWeight:800, color:'#FF0040', fontFamily:'DM Mono, monospace', lineHeight:1 }}>{time.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</div>
                <div style={{ fontSize:9, color:'var(--text-muted)', fontFamily:'DM Mono, monospace', letterSpacing:'0.06em', marginTop:2 }}>{time.toLocaleDateString('fr-FR',{weekday:'short',day:'numeric',month:'short'}).toUpperCase()}</div>
              </div>
            </div>
            {/* Motivation */}
            {(motivation || motivLoading) && (
              <div style={{ fontSize:12, color:'var(--text-secondary)', fontStyle:'italic', lineHeight:1.5, marginBottom:14, borderLeft:'2px solid rgba(255,0,64,0.4)', paddingLeft:10 }}>
                {motivLoading ? '...' : <>{displayed}<span style={{ opacity:showCursor?1:0, color:'#FF0040', fontStyle:'normal' }}>|</span></>}
              </div>
            )}
            {/* Stats KPI */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
              {[
                { label:'Programme', value: activePlan ? `${progress}%` : '—', color:'#FF0040' },
                { label:'Séances', value: activePlan ? `${doneSessions}/${totalSessions}` : '—', color:'var(--text-primary)' },
                { label:'VMA', value: activePlan ? `${activePlan.profile?.vma?.toFixed(1)||'—'}` : '—', color:'var(--text-primary)' },
              ].map(({label,value,color})=>(
                <div key={label} style={{ background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:10, padding:'8px', textAlign:'center' }}>
                  <div style={{ fontSize:16, fontWeight:800, color, fontFamily:'DM Mono, monospace', lineHeight:1 }}>{value}</div>
                  <div style={{ fontSize:9, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginTop:3 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Progress bar */}
          <div style={{ height:2, background:'var(--border)' }}>
            <div style={{ height:'100%', width:`${activePlan?progress:0}%`, background:'#FF0040', transition:'width 1s' }}/>
          </div>
        </div>

        {/* Next session card */}
        {nextSession ? (
          <div onClick={() => onNavigate('running')} style={{ borderRadius: 18, marginBottom: 16, cursor: 'pointer', position: 'relative', overflow: 'hidden', background: 'var(--bg-card)', border: '1px solid var(--border)', minHeight: 160 }}>
            {/* SVG background */}
            <img src="/topo.svg" alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', borderRadius:18, opacity:0.25 }} />
            <div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0.2) 100%)', borderRadius:18 }} />

            {/* Content */}
            <div style={{ position: 'relative', zIndex: 1, padding: '18px 14px 48px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: '#FF0040', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>S{nextSession.week} · {nextSession.day} · {nextSession.tag}</div>
                  <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 6, color: '#fff' }}>{nextSession.title}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{nextSession.detail}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0, marginLeft: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(255,0,64,0.15)', border: '1px solid rgba(255,0,64,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="#FF0040"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  </div>
                  <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Go</span>
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
          <div onClick={() => onNavigate('running')} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 18, padding: '18px', marginBottom: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255,0,64,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="running" size={24} color="#FF0040" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>Créer un programme</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Plan personnalisé selon ton profil</div>
            </div>
            <Icon name="arrow_right" size={16} color="var(--text-muted)" style={{ marginLeft: 'auto' }} />
          </div>
        )}

        {/* Nav grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>

          {/* Running */}
          <button onClick={() => onNavigate('running')} style={{ position:'relative', border:'1px solid var(--border)', borderRadius:18, padding:'16px', cursor:'pointer', fontFamily:'Syne, sans-serif', display:'flex', flexDirection:'column', alignItems:'flex-start', gap:8, textAlign:'left', background:'var(--bg-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'flex-start' }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,0,64,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="running" size={18} color="#FF0040" />
              </div>
              {activePlan && <span style={{ fontSize: 18, fontWeight: 800, color: '#FF0040', fontFamily: 'DM Mono, monospace', lineHeight: 1 }}>{progress}%</span>}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 2 }}>Running</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>{activePlan ? `${doneSessions}/${totalSessions} séances` : 'Créer un plan'}</div>
            </div>
            {activePlan && (
              <div style={{ width: '100%', height: 3, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: '#FF0040', borderRadius: 99 }} />
              </div>
            )}
          </button>

          {/* Muscu */}
          <button onClick={() => onNavigate('muscu')} style={{ position:'relative', border:'1px solid var(--border)', borderRadius:18, padding:'16px', cursor:'pointer', fontFamily:'Syne, sans-serif', display:'flex', flexDirection:'column', alignItems:'flex-start', gap:8, textAlign:'left', background:'var(--bg-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'flex-start' }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="muscle" size={18} color="#6366f1" />
              </div>
              {workouts.length > 0 && <span style={{ fontSize: 18, fontWeight: 800, color: '#6366f1', fontFamily: 'DM Mono, monospace', lineHeight: 1 }}>{workouts.length}</span>}
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

          {/* Nutrition */}
          <button onClick={() => onNavigate('nutrition')} style={{ position:'relative', border:'1px solid var(--border)', borderRadius:18, padding:'16px', cursor:'pointer', fontFamily:'Syne, sans-serif', display:'flex', flexDirection:'column', alignItems:'flex-start', gap:8, textAlign:'left', background:'var(--bg-card)' }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(56,189,248,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="nutrition" size={18} color="#38bdf8" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 2 }}>Nutrition</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>Macros · Hydratation</div>
            </div>
          </button>

        </div>

        {/* Logo footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 32, opacity: 0.3 }}>
          <img src="/logo.svg" alt="PacePro" style={{ width: 20, height: 20, objectFit: 'contain' }} />
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '-0.02em', fontFamily: 'DM Mono, monospace' }}>PACEPRO</span>
        </div>

      </div>
    </div>
  );
}
