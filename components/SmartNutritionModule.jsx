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

function useTypewriter(text, speed = 18) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDisplayed('');
    setDone(false);
    let i = 0;
    const t = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(t); setDone(true); }
    }, speed);
    return () => clearInterval(t);
  }, [text]);
  return { displayed, done };
}

function MacroBar({ label, value, max, color, unit = 'g', animated = true }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(Math.min((value / max) * 100, 100)), 100);
    return () => clearTimeout(t);
  }, [value, max]);
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'Syne, sans-serif' }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'DM Mono, monospace' }}>{value}{unit}</span>
      </div>
      <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${width}%`, background: color, borderRadius: 99, transition: 'width 1.2s cubic-bezier(0.22,1,0.36,1)' }} />
      </div>
    </div>
  );
}

function MealCard({ meal, tag, color }) {
  return (
    <div style={{ background: 'var(--bg-input)', border: `1px solid ${color}30`, borderRadius: 16, padding: '14px 16px', marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>{meal.name}</div>
        <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 99, background: `${color}20`, color, border: `1px solid ${color}40`, fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap', marginLeft: 8 }}>{tag}</span>
      </div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 10, lineHeight: 1.5 }}>{meal.desc}</div>
      <div style={{ display: 'flex', gap: 8 }}>
        {[['Kcal', meal.kcal], ['Prot.', `${meal.prot}g`], ['Carbs', `${meal.carbs}g`], ['Lip.', `${meal.fat}g`]].map(([l, v]) => (
          <div key={l} style={{ flex: 1, background: 'var(--bg-input)', borderRadius: 8, padding: '6px 4px', textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'DM Mono, monospace' }}>{v}</div>
            <div style={{ fontSize: 8, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 1 }}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const MEALS = {
  recharge: [
    { name: 'Bowl Poulet · Patate Douce', desc: 'Riz complet, poulet grillé, patate douce rôtie, avocat, graines de courge', kcal: 620, prot: 42, carbs: 68, fat: 18 },
    { name: 'Pasta Saumon · Épinards', desc: 'Pâtes complètes, saumon fumé, épinards frais, citron, fromage blanc', kcal: 580, prot: 38, carbs: 72, fat: 14 },
  ],
  recovery: [
    { name: 'Omelette · Légumes Verts', desc: 'Œufs entiers, courgettes, poivrons, fromage de chèvre, herbes fraîches', kcal: 380, prot: 28, carbs: 12, fat: 24 },
    { name: 'Smoothie Bowl Protéiné', desc: 'Banane, whey vanille, lait d\'amande, myrtilles, granola maison', kcal: 420, prot: 32, carbs: 48, fat: 10 },
  ],
};

export default function SmartNutritionModule({ onBack }) {
  const [status, setStatus] = useState('loading');
  const [mode, setMode] = useState('recovery'); // 'recharge' | 'recovery'
  const [activity, setActivity] = useState(null);
  const [profile, setProfile] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pp_nutrition_profile') || 'null'); } catch { return null; }
  });
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [weight, setWeight] = useState(profile?.weight || 70);
  const [goal, setGoal] = useState(profile?.goal || 'performance');

  useEffect(() => {
    const token = getToken();
    if (!token) { setStatus('no_token'); return; }
    fetch(`/api/strava?action=activities&token=${token}`)
      .then(r => r.json())
      .then(data => {
        if (!Array.isArray(data)) { setStatus('done'); return; }
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const recent = data.find(a => {
          const d = new Date(a.start_date);
          const diff = (today - d) / 3600000;
          return diff < 24;
        });
        if (recent) {
          setActivity(recent);
          const intense = recent.average_heartrate > 140 || recent.distance > 5000 || recent.total_elevation_gain > 50;
          setMode(intense ? 'recharge' : 'recovery');
        }
        setStatus('done');
      })
      .catch(() => setStatus('done'));
  }, []);

  const isRecharge = mode === 'recharge';
  const accentColor = isRecharge ? '#f59e0b' : '#60a5fa';
  const w = weight || 70;

  // Macros calculées selon poids + objectif + mode
  const baseProtein = Math.round(w * (goal === 'performance' ? 2.0 : goal === 'prise' ? 1.8 : 1.6));
  const baseCarbs = isRecharge ? Math.round(w * (goal === 'performance' ? 6 : 5)) : Math.round(w * 3);
  const baseFat = Math.round(w * 1.0);
  const baseKcal = Math.round(baseProtein * 4 + baseCarbs * 4 + baseFat * 9 + (isRecharge ? 300 : 0));

  const aiText = isRecharge
    ? `Après ${activity ? `ton ${(activity.distance/1000).toFixed(1)}km avec ${Math.round(activity.total_elevation_gain||0)}m de D+` : 'ta séance intense'}, ton corps a besoin de recharger. Vise ${baseCarbs}g de glucides complexes dans les 2h et ${baseProtein}g de protéines pour la réparation musculaire. Hydrate-toi avec au moins 500ml d'eau additionnée d'électrolytes.`
    : `Aujourd'hui, pas de séance détectée. C'est le moment idéal pour optimiser ta récupération et construire ta masse musculaire au repos. Privilégie des protéines de qualité (${baseProtein}g) et des lipides sains. Limite les glucides simples.`;

  const { displayed } = useTypewriter(status === 'done' ? aiText : '', 20);
  const meals = isRecharge ? MEALS.recharge : MEALS.recovery;
  const mealTag = isRecharge ? 'Optimal post-run' : 'Récupération';

  const saveProfile = () => {
    const p = { weight, goal };
    localStorage.setItem('pp_nutrition_profile', JSON.stringify(p));
    setProfile(p);
    setShowProfileSetup(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'Syne, sans-serif', paddingBottom: 100 }}>

      {/* Background glow */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 300, background: `radial-gradient(ellipse at 50% 0%, ${accentColor}15 0%, transparent 70%)`, pointerEvents: 'none', transition: 'background 1s ease', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1, padding: '0 16px 0' }}>

        {/* Mode badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: accentColor, boxShadow: `0 0 8px ${accentColor}` }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: 'DM Mono, monospace' }}>
              {isRecharge ? 'Recharge · Post-Training' : 'Récupération · Maintenance'}
            </span>
          </div>
          <button onClick={() => setShowProfileSetup(true)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-input)', borderRadius: 10, padding: '6px 12px', fontSize: 11, color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit' }}>
            ⚙️ Profil
          </button>
        </div>

        {/* Activité détectée */}
        {activity && (
          <div style={{ background: `rgba(255,255,255,0.04)`, border: `1px solid ${accentColor}30`, borderRadius: 16, padding: '12px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${accentColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name="running" size={18} color={accentColor} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{activity.name}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>
                {(activity.distance/1000).toFixed(1)} km · {Math.round(activity.total_elevation_gain||0)}m D+ · {activity.average_heartrate ? `${Math.round(activity.average_heartrate)} bpm` : ''}
              </div>
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: accentColor, fontFamily: 'DM Mono, monospace' }}>{activity.calories ? `${activity.calories} kcal` : ''}</div>
          </div>
        )}

        {/* Conseil IA */}
        <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', border: `1px solid ${accentColor}25`, borderRadius: 20, padding: '18px', marginBottom: 16 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.15em', fontFamily: 'DM Mono, monospace', marginBottom: 10 }}>✦ Conseil IA</div>
          <div style={{ fontSize: 13, lineHeight: 1.75, color: 'var(--text-secondary)', minHeight: 60 }}>
            {status === 'loading' ? 'Analyse de tes données...' : displayed}
            {status === 'done' && displayed.length < aiText.length && <span style={{ opacity: 0.5, animation: 'blink 1s infinite' }}>|</span>}
          </div>
        </div>

        {/* Objectif calorique */}
        <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', border: `1px solid rgba(255,255,255,0.08)`, borderRadius: 20, padding: '18px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', fontFamily: 'DM Mono, monospace' }}>Objectif du jour</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: accentColor, fontFamily: 'DM Mono, monospace' }}>{baseKcal} <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)' }}>kcal</span></div>
          </div>
          <MacroBar label="Protéines" value={baseProtein} max={300} color="#FF0040" />
          <MacroBar label="Glucides" value={baseCarbs} max={600} color={accentColor} />
          <MacroBar label="Lipides" value={baseFat} max={150} color="#a78bfa" />
        </div>

        {/* Suggestions repas */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', fontFamily: 'DM Mono, monospace', marginBottom: 12 }}>Suggestions de repas</div>
          {meals.map((meal, i) => <MealCard key={i} meal={meal} tag={mealTag} color={accentColor} />)}
        </div>

      </div>

      {/* Profile setup modal */}
      {showProfileSetup && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setShowProfileSetup(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, background: 'var(--bg-modal)', borderRadius: '24px 24px 0 0', padding: '20px 20px 48px' }}>
            <div style={{ width: 36, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 99, margin: '0 auto 20px' }} />
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 20 }}>Mon profil nutritionnel</div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 8 }}>Poids (kg)</label>
              <input type="number" value={weight} onChange={e => setWeight(+e.target.value)} style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-input)', borderRadius: 12, padding: '12px 14px', color: 'var(--text-primary)', fontSize: 16, fontFamily: 'DM Mono, monospace', outline: 'none' }} />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 8 }}>Objectif</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {[['performance', '🏃 Performance'], ['prise', '💪 Prise de masse'], ['sante', '🌿 Santé']].map(([v, l]) => (
                  <button key={v} onClick={() => setGoal(v)} style={{ padding: '10px 8px', borderRadius: 12, border: `1px solid ${goal === v ? accentColor : 'rgba(255,255,255,0.1)'}`, background: goal === v ? `${accentColor}15` : 'transparent', color: goal === v ? accentColor : 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{l}</button>
                ))}
              </div>
            </div>
            <button onClick={saveProfile} style={{ width: '100%', background: accentColor, border: 'none', borderRadius: 14, padding: '14px', fontSize: 14, fontWeight: 800, color: '#000', cursor: 'pointer', fontFamily: 'inherit' }}>Enregistrer</button>
          </div>
        </div>
      )}

      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
    </div>
  );
}
