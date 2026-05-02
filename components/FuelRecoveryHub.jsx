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

function useTypewriter(text, speed = 22) {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    setDisplayed('');
    let i = 0;
    const t = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(t);
    }, speed);
    return () => clearInterval(t);
  }, [text]);
  return displayed;
}

// ── Wave SVG animée ─────────────────────────────────────────────────────────
function WaveHydration({ pct, color }) {
  const clipped = Math.min(Math.max(pct, 0), 100);
  const yPos = 100 - clipped;
  return (
    <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
      <defs>
        <clipPath id="circle-clip">
          <circle cx="50" cy="50" r="46"/>
        </clipPath>
        <linearGradient id="waveGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.9"/>
          <stop offset="100%" stopColor={color} stopOpacity="0.4"/>
        </linearGradient>
      </defs>
      {/* Background circle */}
      <circle cx="50" cy="50" r="46" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
      {/* Water fill with wave */}
      <g clipPath="url(#circle-clip)">
        <rect x="0" y={yPos} width="100" height={clipped + 5} fill="url(#waveGrad)"/>
        <path style={{ animation: 'wave 2.5s linear infinite' }}
          d={`M-20 ${yPos + 3} Q-5 ${yPos - 3} 10 ${yPos + 3} Q25 ${yPos + 9} 40 ${yPos + 3} Q55 ${yPos - 3} 70 ${yPos + 3} Q85 ${yPos + 9} 100 ${yPos + 3} Q115 ${yPos - 3} 130 ${yPos + 3} L130 120 L-20 120 Z`}
          fill={color} opacity="0.6"/>
      </g>
      {/* Border glow */}
      <circle cx="50" cy="50" r="46" fill="none" stroke={color} strokeWidth="1.5" opacity="0.4"/>
      {/* Text */}
      <text x="50" y="46" textAnchor="middle" fill="white" fontSize="16" fontWeight="900" fontFamily="DM Mono, monospace">{Math.round(clipped)}%</text>
      <text x="50" y="58" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="7" fontFamily="DM Mono, monospace">HYDRATATION</text>
    </svg>
  );
}

// ── Macro bar ────────────────────────────────────────────────────────────────
function MacroBar({ label, value, max, color, unit = 'g' }) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(Math.min((value/max)*100,100)), 150); return () => clearTimeout(t); }, [value, max]);
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'DM Mono, monospace' }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 800, color: '#fff', fontFamily: 'DM Mono, monospace' }}>{value}{unit}</span>
      </div>
      <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.03)', borderRadius: 99 }}/>
        <div style={{ height: '100%', width: `${w}%`, background: color, borderRadius: 99, transition: 'width 1.3s cubic-bezier(0.22,1,0.36,1)', boxShadow: `0 0 8px ${color}60` }}/>
      </div>
    </div>
  );
}

// ── Meal card ────────────────────────────────────────────────────────────────
function MealCard({ meal, tag, accent }) {
  return (
    <div style={{ borderRadius: 16, padding: '14px 16px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${accent}25`, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, background: `radial-gradient(circle, ${accent}12 0%, transparent 70%)`, pointerEvents: 'none' }}/>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', flex: 1, marginRight: 8 }}>{meal.name}</div>
        <span style={{ fontSize: 8, fontWeight: 700, padding: '3px 7px', borderRadius: 99, background: `${accent}20`, color: accent, border: `1px solid ${accent}40`, fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{tag}</span>
      </div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 10, lineHeight: 1.5 }}>{meal.desc}</div>
      <div style={{ display: 'flex', gap: 6 }}>
        {[['Kcal', meal.kcal, '#fff'], ['Prot', `${meal.prot}g`, '#FF0040'], ['Carbs', `${meal.carbs}g`, accent], ['Lip', `${meal.fat}g`, '#a78bfa']].map(([l, v, c]) => (
          <div key={l} style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '6px 4px', textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: c, fontFamily: 'DM Mono, monospace' }}>{v}</div>
            <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', marginTop: 1 }}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ label, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${color}60, transparent)` }}/>
      <span style={{ fontSize: 9, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.2em', fontFamily: 'DM Mono, monospace', whiteSpace: 'nowrap' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(270deg, ${color}60, transparent)` }}/>
    </div>
  );
}

const MEALS_POST = [
  { name: 'Pasta Thon · Tomate', desc: 'Pâtes complètes, thon en boîte, sauce tomate maison, basilic frais, parmesan', kcal: 620, prot: 40, carbs: 75, fat: 12 },
  { name: 'Bowl Poulet · Patate Douce', desc: 'Riz complet, poulet grillé, patate douce rôtie, avocat, graines de courge', kcal: 660, prot: 44, carbs: 70, fat: 18 },
];
const MEALS_REST = [
  { name: 'Omelette · Légumes', desc: 'Œufs entiers, courgettes, poivrons, fromage de chèvre, herbes fraîches', kcal: 380, prot: 28, carbs: 12, fat: 24 },
  { name: 'Salade Quinoa · Avocat', desc: 'Quinoa, avocat, tomates cerises, feta, graines de chanvre, citron', kcal: 420, prot: 18, carbs: 38, fat: 22 },
];

// ── Main component ───────────────────────────────────────────────────────────
export default function FuelRecoveryHub() {
  const [status, setStatus] = useState('loading');
  const [activity, setActivity] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [water, setWater] = useState(() => { try { return parseInt(localStorage.getItem('pp_water') || '0'); } catch { return 0; } });
  const [profile, setProfile] = useState(() => { try { return JSON.parse(localStorage.getItem('pp_nutrition_profile') || '{}'); } catch { return {}; } });

  useEffect(() => {
    const token = getToken();
    if (!token) { setStatus('done'); return; }
    fetch(`/api/strava?action=activities&token=${token}`)
      .then(r => r.json())
      .then(data => {
        if (!Array.isArray(data)) { setStatus('done'); return; }
        const recent = data.find(a => (Date.now() - new Date(a.start_date).getTime()) < 24 * 3600000);
        if (recent) setActivity(recent);
        setStatus('done');
      })
      .catch(() => setStatus('done'));
  }, []);

  const addWater = (ml) => {
    const next = water + ml;
    setWater(next);
    try { localStorage.setItem('pp_water', String(next)); } catch {}
  };

  const w = profile.weight || 70;
  const isPostRun = !!activity;
  const isIntense = activity && (activity.moving_time > 3600 || activity.total_elevation_gain > 50 || activity.average_heartrate > 140);
  const elevation = activity?.total_elevation_gain || 0;
  const distKm = (activity?.distance || 0) / 1000;

  // Hydration goal
  const waterGoalMl = isIntense ? 3500 : isPostRun ? 2800 : 2000;
  const waterPct = Math.min((water / waterGoalMl) * 100, 100);

  // Macros
  const protein = Math.round(w * (isPostRun ? 2.0 : 1.6));
  const carbs = Math.round(w * (isIntense ? 7 : isPostRun ? 5 : 3) + elevation * 0.02);
  const fat = Math.round(w * 0.9);
  const kcal = Math.round(protein * 4 + carbs * 4 + fat * 9);

  // Colors
  const waterColor = '#38bdf8';
  const energyColor = isIntense ? '#f59e0b' : isPostRun ? '#FF0040' : '#22c55e';

  // AI advice
  const aiText = isIntense
    ? `Séance intense détectée — ${distKm.toFixed(1)}km avec ${Math.round(elevation)}m D+. Recharge en ${carbs}g de glucides complexes dans les 30 minutes. ${waterGoalMl/1000}L d'eau minimum aujourd'hui, avec électrolytes.`
    : isPostRun
    ? `Activité modérée détectée. Récupération optimale : ${protein}g de protéines et ${carbs}g de glucides suffisent. Maintiens une bonne hydratation.`
    : `Journée de repos. Priorité aux protéines (${protein}g) et aux lipides sains. Limite les glucides simples. ${waterGoalMl/1000}L d'eau pour la récupération cellulaire.`;

  const typedAI = useTypewriter(status === 'done' ? aiText : '', 20);
  const meals = isPostRun ? MEALS_POST : MEALS_REST;
  const mealTag = isIntense ? 'Post-run intense' : isPostRun ? 'Post-training' : 'Jour de repos';

  return (
    <div style={{ minHeight: '100vh', background: '#07080b', color: '#fff', fontFamily: 'Syne, sans-serif', paddingBottom: 100 }}>

      {/* Background */}
      <div style={{ position: 'fixed', top: 0, inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: -100, left: '20%', width: 300, height: 300, borderRadius: '50%', background: `radial-gradient(circle, ${waterColor}10 0%, transparent 70%)`, filter: 'blur(40px)' }}/>
        <div style={{ position: 'absolute', top: 50, right: '10%', width: 250, height: 250, borderRadius: '50%', background: `radial-gradient(circle, ${energyColor}10 0%, transparent 70%)`, filter: 'blur(40px)' }}/>
      </div>

      <div style={{ position: 'relative', zIndex: 1, padding: '16px 16px 0' }}>

        {/* Status badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: energyColor, boxShadow: `0 0 10px ${energyColor}` }}/>
            <span style={{ fontSize: 10, fontWeight: 700, color: energyColor, textTransform: 'uppercase', letterSpacing: '0.15em', fontFamily: 'DM Mono, monospace' }}>
              {isIntense ? 'Recharge · Post-Intensif' : isPostRun ? 'Récupération · Post-Run' : 'Maintenance · Repos'}
            </span>
          </div>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'DM Mono, monospace' }}>{kcal} kcal/j</span>
        </div>

        {/* ── HYDRATATION ── */}
        <SectionHeader label="Hydratation" color={waterColor} />
        <div style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${waterColor}20`, borderRadius: 20, padding: '20px', marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 16 }}>
            {/* Wave circle */}
            <div style={{ width: 100, height: 100, flexShrink: 0 }}>
              <WaveHydration pct={waterPct} color={waterColor} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 28, fontWeight: 900, fontFamily: 'DM Mono, monospace', color: '#fff', lineHeight: 1 }}>{(water/1000).toFixed(1)}<span style={{ fontSize: 13, fontWeight: 400, color: 'rgba(255,255,255,0.4)' }}>L</span></div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 12, fontFamily: 'DM Mono, monospace' }}>/ {(waterGoalMl/1000).toFixed(1)}L objectif</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[[250,'+ 25cl'],[500,'+ 50cl']].map(([ml, label]) => (
                  <button key={ml} onClick={() => addWater(ml)} style={{ flex: 1, background: `${waterColor}15`, border: `1px solid ${waterColor}30`, borderRadius: 10, padding: '8px', fontSize: 11, fontWeight: 700, color: waterColor, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>{label}</button>
                ))}
                <button onClick={() => { setWater(0); try { localStorage.setItem('pp_water','0'); } catch {} }} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '8px 10px', fontSize: 11, color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontFamily: 'inherit' }}>↺</button>
              </div>
            </div>
          </div>
          {isIntense && (
            <div style={{ background: `${waterColor}10`, border: `1px solid ${waterColor}25`, borderRadius: 12, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 16 }}>⚡</span>
              <span style={{ fontSize: 11, color: `${waterColor}`, lineHeight: 1.5 }}>Ajoute des électrolytes suite à ta sortie running pour optimiser la récupération.</span>
            </div>
          )}
        </div>

        {/* ── ÉNERGIE & MACROS ── */}
        <SectionHeader label="Énergie & Macros" color={energyColor} />
        <div style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${energyColor}20`, borderRadius: 20, padding: '20px', marginBottom: 16 }}>
          {/* Analyse IA */}
          <div style={{ marginBottom: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: '12px 14px', borderLeft: `3px solid ${energyColor}` }}>
            <div style={{ fontSize: 8, color: energyColor, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', fontFamily: 'DM Mono, monospace', marginBottom: 6 }}>✦ ANALYSE IA</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, minHeight: 40 }}>
              {status === 'loading' ? 'Analyse en cours...' : typedAI}
              {status === 'done' && typedAI.length < aiText.length && <span style={{ opacity: 0.5 }}>|</span>}
            </div>
          </div>

          {/* Expand/collapse activité */}
          {activity && (
            <button onClick={() => setExpanded(!expanded)} style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '10px 14px', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: expanded ? 12 : 0, transition: 'all 0.3s' }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: 'DM Mono, monospace' }}>Détails de l'analyse</span>
              <span style={{ fontSize: 12, color: energyColor, transition: 'transform 0.3s', display: 'inline-block', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
            </button>
          )}
          {expanded && activity && (
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '12px', marginBottom: 12, animation: 'fadeSlideUp 0.25s ease both' }}>
              {[
                ['Activité', activity.name],
                ['Distance', `${distKm.toFixed(1)} km`],
                ['Dénivelé +', `${Math.round(elevation)} m`],
                ['Durée', `${Math.round(activity.moving_time/60)} min`],
                ['FC moy.', activity.average_heartrate ? `${Math.round(activity.average_heartrate)} bpm` : '—'],
                ['Calories', activity.calories ? `${activity.calories} kcal` : '—'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase' }}>{k}</span>
                  <span style={{ fontSize: 11, color: '#fff', fontFamily: 'DM Mono, monospace', fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
          )}

          {/* Macros */}
          <div style={{ marginTop: 8 }}>
            <MacroBar label="Glucides" value={carbs} max={700} color={energyColor} />
            <MacroBar label="Protéines" value={protein} max={300} color="#FF0040" />
            <MacroBar label="Lipides" value={fat} max={150} color="#a78bfa" />
          </div>
        </div>

        {/* ── REPAS RECOMMANDÉ ── */}
        <SectionHeader label="Repas recommandé" color="#a78bfa" />
        <MealCard meal={meals[0]} tag={mealTag} accent={energyColor} />

      </div>

      <style>{`
        @keyframes wave { 0%{transform:translateX(0)} 100%{transform:translateX(40px)} }
        @keyframes fadeSlideUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}
