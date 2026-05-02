'use client';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
function MealCard({ meal, tag, accent, onClick }) {
  return (
    <div onClick={onClick} style={{ borderRadius: 16, padding: '14px 16px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${accent}25`, position: 'relative', overflow: 'hidden', cursor: 'pointer' }}>
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
  { name: 'Pasta Thon · Tomate', desc: 'Pâtes complètes, thon en boîte, sauce tomate maison, basilic frais, parmesan', kcal: 620, prot: 40, carbs: 75, fat: 12,
    ingredients: ['200g de pâtes complètes', '1 boîte de thon au naturel (150g)', '200ml de sauce tomate', '1 gousse d\'ail', 'Basilic frais', '20g de parmesan râpé', 'Sel, poivre, huile d\'olive'],
    steps: ['Cuire les pâtes al dente dans de l\'eau salée (8-10 min).', 'Faire revenir l\'ail émincé 1 min dans un filet d\'huile d\'olive.', 'Ajouter la sauce tomate et laisser mijoter 5 min à feu doux.', 'Égoutter le thon et l\'incorporer à la sauce. Chauffer 2 min.', 'Mélanger les pâtes avec la sauce. Servir avec basilic et parmesan.'],
    time: '15 min', difficulty: 'Facile', tip: 'Idéal dans les 30-60 min post-effort pour recharger le glycogène.' },
  { name: 'Bowl Poulet · Patate Douce', desc: 'Riz complet, poulet grillé, patate douce rôtie, avocat, graines de courge', kcal: 660, prot: 44, carbs: 70, fat: 18,
    ingredients: ['150g de riz complet cuit', '150g de blanc de poulet', '1 patate douce moyenne', '½ avocat', '1 c.s. de graines de courge', 'Citron, cumin, paprika, huile d\'olive'],
    steps: ['Préchauffer le four à 200°C. Couper la patate douce en cubes, assaisonner d\'huile et cumin, rôtir 20 min.', 'Assaisonner le poulet de paprika, sel et poivre. Cuire à la poêle 6-7 min de chaque côté.', 'Trancher le poulet. Disposer dans un bol : riz, poulet, patate douce, avocat en tranches.', 'Parsemer de graines de courge. Arroser de jus de citron.'],
    time: '30 min', difficulty: 'Facile', tip: 'La patate douce est une source excellente de glucides complexes et de bêta-carotène.' },
];
const MEALS_REST = [
  { name: 'Omelette · Légumes', desc: 'Œufs entiers, courgettes, poivrons, fromage de chèvre, herbes fraîches', kcal: 380, prot: 28, carbs: 12, fat: 24,
    ingredients: ['3 œufs entiers', '½ courgette', '½ poivron rouge', '40g de fromage de chèvre', 'Ciboulette fraîche', 'Sel, poivre, huile d\'olive'],
    steps: ['Couper les légumes en petits dés. Les faire revenir 5 min dans une poêle huilée.', 'Battre les œufs avec sel et poivre. Verser sur les légumes.', 'Cuire à feu moyen 3 min. Ajouter le fromage de chèvre émietté.', 'Replier l\'omelette et servir parsemée de ciboulette.'],
    time: '12 min', difficulty: 'Facile', tip: 'Riche en protéines complètes et faible en glucides — parfait pour un jour de récupération.' },
  { name: 'Salade Quinoa · Avocat', desc: 'Quinoa, avocat, tomates cerises, feta, graines de chanvre, citron', kcal: 420, prot: 18, carbs: 38, fat: 22,
    ingredients: ['150g de quinoa cuit', '1 avocat mûr', '100g de tomates cerises', '50g de feta', '2 c.s. de graines de chanvre', 'Jus d\'1 citron, huile d\'olive, sel'],
    steps: ['Rincer et cuire le quinoa 12 min dans 2x son volume d\'eau. Laisser refroidir.', 'Couper les tomates en deux, l\'avocat en cubes. Émietter la feta.', 'Mélanger tous les ingrédients dans un saladier.', 'Assaisonner avec citron, huile d\'olive et sel. Ajouter les graines de chanvre.'],
    time: '20 min', difficulty: 'Facile', tip: 'Le quinoa est une protéine complète — idéal pour la synthèse musculaire au repos.' },
];

// ── Recipe Sheet ────────────────────────────────────────────────────────────
function RecipeSheet({ meal, tag, accent, onClose }) {
  if (!meal) return null;
  return createPortal(
    <div style={{ position:'fixed', inset:0, zIndex:9999, display:'flex', flexDirection:'column', justifyContent:'flex-end' }} onClick={onClose}>
      <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(6px)' }}/>
      <div onClick={e=>e.stopPropagation()} className='sheet-enter' style={{ position:'relative', width:'100%', background:'#13161f', borderRadius:'24px 24px 0 0', padding:'12px 20px 48px', maxHeight:'85vh', overflowY:'auto', zIndex:1 }}>
        <div style={{ width:36, height:4, background:'rgba(255,255,255,0.15)', borderRadius:99, margin:'0 auto 16px' }}/>
        {/* Header */}
        <div style={{ marginBottom:16, paddingBottom:14, borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize:9, color:accent, fontFamily:'DM Mono, monospace', textTransform:'uppercase', letterSpacing:'0.15em', marginBottom:6 }}>{tag}</div>
          <div style={{ fontSize:22, fontWeight:900, color:'#fff', letterSpacing:'-0.03em', marginBottom:4 }}>{meal.name}</div>
          <div style={{ display:'flex', gap:12 }}>
            <span style={{ fontSize:10, color:'rgba(255,255,255,0.4)', fontFamily:'DM Mono, monospace' }}>⏱ {meal.time}</span>
            <span style={{ fontSize:10, color:'rgba(255,255,255,0.4)', fontFamily:'DM Mono, monospace' }}>👨‍🍳 {meal.difficulty}</span>
          </div>
        </div>
        {/* Macros */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:20 }}>
          {[['Kcal', meal.kcal, '#fff'], ['Prot.', `${meal.prot}g`, '#FF0040'], ['Carbs', `${meal.carbs}g`, accent], ['Lip.', `${meal.fat}g`, '#a78bfa']].map(([l,v,c]) => (
            <div key={l} style={{ background:'rgba(255,255,255,0.05)', borderRadius:12, padding:'10px 8px', textAlign:'center' }}>
              <div style={{ fontSize:15, fontWeight:800, color:c, fontFamily:'DM Mono, monospace' }}>{v}</div>
              <div style={{ fontSize:8, color:'rgba(255,255,255,0.3)', textTransform:'uppercase', marginTop:2 }}>{l}</div>
            </div>
          ))}
        </div>
        {/* Ingrédients */}
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.15em', fontFamily:'DM Mono, monospace', marginBottom:12 }}>Ingrédients</div>
          {meal.ingredients.map((ing, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:accent, flexShrink:0 }}/>
              <span style={{ fontSize:13, color:'rgba(255,255,255,0.8)' }}>{ing}</span>
            </div>
          ))}
        </div>
        {/* Étapes */}
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.15em', fontFamily:'DM Mono, monospace', marginBottom:12 }}>Préparation</div>
          {meal.steps.map((step, i) => (
            <div key={i} style={{ display:'flex', gap:12, marginBottom:12, alignItems:'flex-start' }}>
              <div style={{ width:24, height:24, borderRadius:8, background:`${accent}20`, border:`1px solid ${accent}40`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <span style={{ fontSize:11, fontWeight:800, color:accent, fontFamily:'DM Mono, monospace' }}>{i+1}</span>
              </div>
              <span style={{ fontSize:13, color:'rgba(255,255,255,0.75)', lineHeight:1.6, paddingTop:2 }}>{step}</span>
            </div>
          ))}
        </div>
        {/* Tip */}
        <div style={{ background:`${accent}10`, border:`1px solid ${accent}25`, borderRadius:14, padding:'12px 14px' }}>
          <div style={{ fontSize:9, color:accent, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', fontFamily:'DM Mono, monospace', marginBottom:6 }}>💡 Conseil nutritionnel</div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.7)', lineHeight:1.6 }}>{meal.tip}</div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function FuelRecoveryHub() {
  const [status, setStatus] = useState('loading');
  const [activity, setActivity] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [weightLog, setWeightLog] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pp_weight_log') || '[]'); } catch { return []; }
  });
  const [newWeight, setNewWeight] = useState('');
  const [showWeightInput, setShowWeightInput] = useState(false);
  const [aiRequest, setAiRequest] = useState('');
  const [aiMeals, setAiMeals] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiMeals, setShowAiMeals] = useState(false);
  const [water, setWater] = useState(() => { try { return parseInt(localStorage.getItem('pp_water') || '0'); } catch { return 0; } });
  const [profile, setProfile] = useState(() => {
    try {
      const settings = JSON.parse(localStorage.getItem('pp_user_settings') || '{}');
      const nutrition = JSON.parse(localStorage.getItem('pp_nutrition_profile') || '{}');
      return { ...nutrition, ...settings };
    } catch { return {}; }
  });

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

  const lastWeightEntry = weightLog.length > 0 ? [...weightLog].sort((a,b) => a.date.localeCompare(b.date)).slice(-1)[0].weight : null;
  const w = lastWeightEntry || profile.weight || 70;
  const isPostRun = !!activity;
  const isIntense = activity && (activity.moving_time > 3600 || activity.total_elevation_gain > 50 || activity.average_heartrate > 140);
  const elevation = activity?.total_elevation_gain || 0;
  const distKm = (activity?.distance || 0) / 1000;

  // Hydration goal
  const waterGoalMl = isIntense ? 3500 : isPostRun ? 2800 : 2000;
  const waterPct = Math.min((water / waterGoalMl) * 100, 100);

  // Macros
  const goal = profile?.goal || 'performance';
  const isPerte = goal === 'perte';
  const isPrise = goal === 'prise';

  // Macros adaptées selon objectif
  const protein = Math.round(w * (isPerte ? 2.2 : isPrise ? 2.0 : isPostRun ? 2.0 : 1.6));
  const carbs = isPerte
    ? Math.round(w * (isIntense ? 3.5 : isPostRun ? 2.5 : 1.5) + elevation * 0.01)
    : Math.round(w * (isIntense ? 7 : isPostRun ? 5 : 3) + elevation * 0.02);
  const fat = Math.round(w * (isPerte ? 0.7 : isPrise ? 1.1 : 0.9));
  const baseKcal = Math.round(protein * 4 + carbs * 4 + fat * 9);
  const deficit = isPerte ? Math.round(w * 4) : 0; // ~500 kcal déficit selon poids
  const kcal = Math.max(baseKcal - deficit, 1200);

  // Colors
  const waterColor = '#38bdf8';
  const energyColor = isIntense ? '#f59e0b' : isPostRun ? '#FF0040' : '#22c55e';

  // AI advice
  const aiText = isPerte
    ? isIntense
      ? `Séance intense avec objectif perte de poids — bravo ! Tu as brûlé environ ${Math.round(distKm*w*1.1)} kcal. Recharge avec ${carbs}g de glucides complexes et ${protein}g de protéines pour préserver ta masse musculaire. Objectif calorique du jour : ${kcal} kcal en déficit modéré.`
      : isPostRun
      ? `Bonne séance ! En mode perte de poids, vise ${protein}g de protéines pour éviter la fonte musculaire. Limite les glucides à ${carbs}g. Déficit calorique cible : ${deficit} kcal.`
      : `Jour de repos en mode perte de poids. Protéines élevées (${protein}g) pour préserver le muscle, glucides bas (${carbs}g), lipides sains. Total : ${kcal} kcal — déficit de ${deficit} kcal.`
    : isIntense
    ? `Séance intense détectée — ${distKm.toFixed(1)}km avec ${Math.round(elevation)}m D+. Recharge en ${carbs}g de glucides complexes dans les 30 minutes. ${waterGoalMl/1000}L d'eau minimum aujourd'hui, avec électrolytes.`
    : isPostRun
    ? `Activité modérée détectée. Récupération optimale : ${protein}g de protéines et ${carbs}g de glucides suffisent. Maintiens une bonne hydratation.`
    : `Journée de repos. Priorité aux protéines (${protein}g) et aux lipides sains. Limite les glucides simples. ${waterGoalMl/1000}L d'eau pour la récupération cellulaire.`;

  const typedAI = useTypewriter(status === 'done' ? aiText : '', 20);
  const MEALS_PERTE = [
    { name: 'Bowl Blanc de Poulet · Légumes', desc: 'Blanc de poulet grillé, brocoli vapeur, carottes, concombre, sauce yaourt citron', kcal: 320, prot: 42, carbs: 14, fat: 8,
      ingredients: ['180g blanc de poulet', '150g brocoli', '1 carotte', '½ concombre', '100g yaourt grec 0%', 'Citron, herbes, sel'],
      steps: ['Cuire le poulet à la poêle avec herbes 8 min.', 'Cuire le brocoli et la carotte vapeur 5 min.', 'Préparer la sauce yaourt + citron + herbes.', 'Disposer dans un bol et napper de sauce.'],
      time: '15 min', difficulty: 'Facile', tip: 'Riche en protéines, faible en calories — idéal pour préserver le muscle en déficit.' },
    { name: 'Salade Thon · Œuf · Épinards', desc: 'Épinards frais, thon au naturel, œuf dur, tomates cerises, vinaigrette légère', kcal: 280, prot: 35, carbs: 8, fat: 12,
      ingredients: ['100g épinards frais', '1 boîte thon naturel', '2 œufs durs', '100g tomates cerises', '1 c.s. huile d\'olive', 'Vinaigre balsamique, sel'],
      steps: ['Cuire les œufs durs 10 min.', 'Disposer les épinards dans un grand bol.', 'Ajouter le thon égoutté, les œufs coupés, les tomates.', 'Assaisonner avec huile d\'olive et vinaigre.'],
      time: '12 min', difficulty: 'Facile', tip: 'Combo parfait : protéines complètes + oméga-3 + faible densité calorique.' },
  ];
  const meals = isPerte ? MEALS_PERTE : isPostRun ? MEALS_POST : MEALS_REST;
  const mealTag = isIntense ? 'Post-run intense' : isPostRun ? 'Post-training' : 'Jour de repos';

  const addWeight = () => {
    const val = parseFloat(newWeight.replace(',', '.'));
    if (!val || val < 30 || val > 300) return;
    const today = new Date().toISOString().split('T')[0];
    const entry = { date: today, weight: val };
    const existing = weightLog.findIndex(e => e.date === today);
    const updated = existing >= 0
      ? weightLog.map((e, i) => i === existing ? entry : e)
      : [...weightLog, entry].slice(-60);
    setWeightLog([...updated]); // forcer re-render avec nouvelle référence
    try { localStorage.setItem('pp_weight_log', JSON.stringify(updated)); } catch {}
    setNewWeight('');
    setShowWeightInput(false);
    // Sync poids avec settings
    try {
      const s = JSON.parse(localStorage.getItem('pp_user_settings') || '{}');
      s.weight = val;
      localStorage.setItem('pp_user_settings', JSON.stringify(s));
      localStorage.setItem('pp_nutrition_profile', JSON.stringify({...s, weight: val}));
      setProfile(prev => ({ ...prev, weight: val }));
    } catch {}
  };

  const generateAiMeals = async () => {
    if (!aiRequest.trim()) return;
    setAiLoading(true);
    setAiMeals([]);
    setShowAiMeals(true);
    const prompt = `Tu es un nutritionniste expert en sport. L'utilisateur veut : "${aiRequest}". Ses macros disponibles aujourd'hui : ${carbs}g glucides, ${protein}g protéines, ${fat}g lipides, ${kcal} kcal total. Mode : ${isIntense ? 'post-entraînement intense' : isPostRun ? 'post-entraînement modéré' : 'jour de repos'}. Génère exactement 3 recettes adaptées. Réponds UNIQUEMENT en JSON valide, sans markdown, sans texte avant ou après : [{"name":"...","desc":"...","ingredients":["..."],"steps":["..."],"kcal":0,"prot":0,"carbs":0,"fat":0,"time":"...","tip":"..."}]`;
    try {
      const res = await fetch('/api/gemini', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ prompt }) });
      const d = await res.json();
      const text = d.text || '';
      const clean = text.replace(/\`\`\`json|\`\`\`/g, '').trim();
      const meals = JSON.parse(clean);
      setAiMeals(meals);
    } catch {
      setAiMeals([{ name:'Erreur', desc:'Impossible de générer les recettes. Réessaie.', ingredients:[], steps:[], kcal:0, prot:0, carbs:0, fat:0, time:'—', tip:'' }]);
    }
    setAiLoading(false);
  };

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
          <div style={{ display:'flex', gap:6, alignItems:'center' }}>
            {isPerte && <span style={{ fontSize:9, padding:'2px 7px', borderRadius:99, background:'rgba(255,100,0,0.15)', color:'#f97316', border:'1px solid rgba(255,100,0,0.3)', fontFamily:'DM Mono, monospace', fontWeight:700 }}>-{deficit} kcal déficit</span>}
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'DM Mono, monospace' }}>{kcal} kcal/j</span>
          </div>
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
        <MealCard meal={meals[0]} tag={mealTag} accent={energyColor} onClick={() => setSelectedMeal(meals[0])} />
        {meals[1] && <div style={{marginTop:10}}><MealCard meal={meals[1]} tag={mealTag} accent={energyColor} onClick={() => setSelectedMeal(meals[1])} /></div>}
        {selectedMeal && <RecipeSheet meal={selectedMeal} tag={mealTag} accent={energyColor} onClose={() => setSelectedMeal(null)} />}

        {/* Suivi du poids */}
        {isPerte && (
          <div style={{ marginTop: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(249,115,22,0.25)', borderRadius: 20, padding: '18px', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#f97316', textTransform: 'uppercase', letterSpacing: '0.15em', fontFamily: 'DM Mono, monospace' }}>🔥 Suivi du poids</div>
              <button onClick={() => setShowWeightInput(!showWeightInput)} style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: 8, padding: '5px 12px', fontSize: 11, fontWeight: 700, color: '#f97316', cursor: 'pointer', fontFamily: 'inherit' }}>
                + Peser
              </button>
            </div>

            {showWeightInput && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <input type="number" value={newWeight} onChange={e => setNewWeight(e.target.value)} placeholder="Ex: 74.5" step="0.1" style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '10px 12px', color: '#fff', fontSize: 14, fontFamily: 'DM Mono, monospace', outline: 'none' }} />
                <button onClick={addWeight} style={{ background: '#f97316', border: 'none', borderRadius: 10, padding: '10px 16px', fontSize: 12, fontWeight: 800, color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>OK</button>
              </div>
            )}

            {weightLog.length >= 2 ? (() => {
              const sorted = [...weightLog].sort((a,b) => a.date.localeCompare(b.date));
              const first = sorted[0].weight;
              const last = sorted[sorted.length-1].weight;
              const min = Math.min(...sorted.map(e=>e.weight));
              const max = Math.max(...sorted.map(e=>e.weight));
              const diff = (last - first).toFixed(1);
              const target = profile.weight || first;
              const W = 300, H = 80;
              const xStep = W / (sorted.length - 1);
              const yRange = max - min || 1;
              const toY = v => H - ((v - min) / yRange) * (H - 10) - 5;
              const points = sorted.map((e,i) => `${i*xStep},${toY(e.weight)}`).join(' ');
              return (
                <div>
                  {/* KPIs */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 14 }}>
                    {[
                      ['Actuel', `${last} kg`, diff <= 0 ? '#22c55e' : '#FF0040'],
                      ['Évolution', `${diff > 0 ? '+' : ''}${diff} kg`, diff <= 0 ? '#22c55e' : '#FF0040'],
                      ['Mesures', `${sorted.length}j`, '#f97316'],
                    ].map(([l,v,col]) => (
                      <div key={l} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px', textAlign: 'center' }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: col, fontFamily: 'DM Mono, monospace' }}>{v}</div>
                        <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginTop: 2 }}>{l}</div>
                      </div>
                    ))}
                  </div>
                  {/* Courbe SVG */}
                  <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: '10px 8px 4px', marginBottom: 10 }}>
                    <svg width="100%" viewBox={`0 0 ${W} ${H+20}`} style={{ overflow: 'visible' }}>
                      <defs>
                        <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f97316" stopOpacity="0.3"/>
                          <stop offset="100%" stopColor="#f97316" stopOpacity="0"/>
                        </linearGradient>
                      </defs>
                      {/* Grille */}
                      {[0,1,2,3].map(i => (
                        <line key={i} x1={0} y1={i*(H/3)} x2={W} y2={i*(H/3)} stroke="rgba(255,255,255,0.04)" strokeWidth={1}/>
                      ))}
                      {/* Zone remplie */}
                      <polygon points={`0,${toY(sorted[0].weight)} ${points} ${(sorted.length-1)*xStep},${H} 0,${H}`} fill="url(#weightGrad)"/>
                      {/* Ligne */}
                      <polyline points={points} fill="none" stroke="#f97316" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
                      {/* Points */}
                      {sorted.map((e,i) => (
                        <g key={i}>
                          <circle cx={i*xStep} cy={toY(e.weight)} r={3} fill="#f97316"/>
                          {(i === 0 || i === sorted.length-1) && (
                            <text x={i*xStep} y={toY(e.weight)-8} textAnchor={i===0?'start':'end'} fill="rgba(255,255,255,0.6)" fontSize={8} fontFamily="monospace">{e.weight}kg</text>
                          )}
                        </g>
                      ))}
                      {/* Labels dates */}
                      {[sorted[0], sorted[sorted.length-1]].map((e,i) => (
                        <text key={i} x={i===0?0:(sorted.length-1)*xStep} y={H+14} textAnchor={i===0?'start':'end'} fill="rgba(255,255,255,0.25)" fontSize={7} fontFamily="monospace">
                          {new Date(e.date).toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}
                        </text>
                      ))}
                    </svg>
                  </div>
                  {diff < 0 && <div style={{ fontSize: 11, color: '#22c55e', textAlign: 'center', fontFamily: 'DM Mono, monospace' }}>🎯 {Math.abs(diff)} kg perdus depuis le début</div>}
                </div>
              );
            })() : (
              <div style={{ textAlign: 'center', padding: '16px 0', color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
                Ajoute au moins 2 mesures pour voir ta courbe d'évolution
              </div>
            )}
          </div>
        )}

        {/* Générateur IA personnalisé */}
        <div style={{ marginTop: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 20, padding: '18px' }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.15em', fontFamily: 'DM Mono, monospace', marginBottom: 10 }}>✦ Créer mes propres recettes</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 12, lineHeight: 1.5 }}>Ces repas ne te conviennent pas ? Dis à l'IA ce dont tu as envie et elle crée 3 recettes adaptées à tes macros.</div>
          <textarea
            value={aiRequest}
            onChange={e => setAiRequest(e.target.value)}
            placeholder="Ex: j'ai envie de quelque chose d'asiatique avec du riz, léger et rapide à faire..."
            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 14px', color: '#fff', fontSize: 12, fontFamily: 'Syne, sans-serif', outline: 'none', resize: 'none', minHeight: 72, lineHeight: 1.6, boxSizing: 'border-box' }}
          />
          <button onClick={generateAiMeals} disabled={aiLoading || !aiRequest.trim()} style={{ width: '100%', marginTop: 10, background: aiLoading ? 'rgba(99,102,241,0.3)' : 'linear-gradient(135deg, #6366f1, #4f46e5)', border: 'none', borderRadius: 12, padding: '13px', fontSize: 13, fontWeight: 800, color: '#fff', cursor: aiLoading ? 'not-allowed' : 'pointer', fontFamily: 'Syne, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {aiLoading ? '⏳ Génération en cours...' : '✨ Générer 3 recettes personnalisées'}
          </button>
        </div>

        {/* Recettes IA générées */}
        {showAiMeals && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.15em', fontFamily: 'DM Mono, monospace', marginBottom: 12 }}>Recettes générées pour toi</div>
            {aiLoading ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>L'IA cuisine pour toi...</div>
            ) : (
              aiMeals.map((meal, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <MealCard meal={meal} tag="Recette IA" accent="#6366f1" onClick={() => setSelectedMeal(meal)} />
                </div>
              ))
            )}
          </div>
        )}

      </div>

      <style>{`
        @keyframes wave { 0%{transform:translateX(0)} 100%{transform:translateX(40px)} }
        @keyframes fadeSlideUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}
