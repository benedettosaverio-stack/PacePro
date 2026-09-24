'use client';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icons';

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
      <text x="50" y="46" textAnchor="middle" fill="var(--text-primary)" fontSize="16" fontWeight="900" fontFamily="DM Mono, monospace">{Math.round(clipped)}%</text>
      <text x="50" y="58" textAnchor="middle" fill="var(--text-muted)" fontSize="7" fontFamily="DM Mono, monospace">HYDRATATION</text>
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
        <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'DM Mono, monospace' }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'DM Mono, monospace' }}>{value}{unit}</span>
      </div>
      <div style={{ height: 6, background: 'var(--progress-track)', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${w}%`, background: color, borderRadius: 999, transition: 'width 1.3s cubic-bezier(0.22,1,0.36,1)' }}/>
      </div>
    </div>
  );
}

// ── Meal card ────────────────────────────────────────────────────────────────
function MealCard({ meal, tag, accent, onClick }) {
  return (
    <div onClick={onClick} className="card-hover" style={{ borderRadius:14, overflow:'hidden', border:'1px solid var(--border)', background:'var(--bg-card)', cursor:'pointer' }}>
      <div style={{ padding:'12px 14px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:8 }}>
        <div style={{ width:28, height:28, borderRadius:8, background:`${accent}14`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <Icon name="nutrition" size={14} color={accent} />
        </div>
        <span style={{ fontSize:14, fontWeight:800, color:'var(--text-primary)', letterSpacing:'-0.02em', flex:1, minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{meal.name}</span>
        <span style={{ flexShrink:0, fontSize:9, fontWeight:700, padding:'3px 8px', borderRadius:6, background:`${accent}14`, color:accent, textTransform:'uppercase', letterSpacing:'0.06em' }}>{tag}</span>
      </div>
      <div style={{ padding:'12px 14px' }}>
        <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:12, lineHeight:1.5 }}>{meal.desc}</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6 }}>
          {[['Kcal', meal.kcal, 'var(--text-primary)'], ['Prot', `${meal.prot}g`, '#FF0040'], ['Carbs', `${meal.carbs}g`, accent], ['Lip', `${meal.fat}g`, '#a78bfa']].map(([l, v, c]) => (
            <div key={l} style={{ background:'var(--bg-input)', border:'1px solid var(--border)', borderRadius:10, padding:'8px 4px', textAlign:'center' }}>
              <div style={{ fontSize:8, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', fontFamily:'DM Mono, monospace', marginBottom:3 }}>{l}</div>
              <div style={{ fontSize:14, fontWeight:900, color:c, fontFamily:'DM Mono, monospace', lineHeight:1 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ label, color, icon }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
      <div style={{ width:26, height:26, borderRadius:8, background:`${color}14`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        {icon}
      </div>
      <span className="section-title" style={{ fontSize: 15 }}>{label}</span>
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
      <div onClick={e=>e.stopPropagation()} className='sheet-enter' style={{ position:'relative', width:'100%', background:'var(--bg-modal)', borderRadius:'24px 24px 0 0', padding:'12px 20px 48px', maxHeight:'85vh', overflowY:'auto', zIndex:1 }}>
        <div style={{ width:36, height:4, background:'rgba(255,255,255,0.15)', borderRadius:99, margin:'0 auto 16px' }}/>
        {/* Header */}
        <div style={{ marginBottom:16, paddingBottom:14, borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize:9, color:accent, fontFamily:'DM Mono, monospace', textTransform:'uppercase', letterSpacing:'0.15em', marginBottom:6 }}>{tag}</div>
          <div style={{ fontSize:22, fontWeight:900, color:'var(--text-primary)', letterSpacing:'-0.03em', marginBottom:4 }}>{meal.name}</div>
          <div style={{ display:'flex', gap:12 }}>
            <span style={{ fontSize:10, color:'var(--text-muted)', fontFamily:'DM Mono, monospace' }}>⏱ {meal.time}</span>
            <span style={{ fontSize:10, color:'var(--text-muted)', fontFamily:'DM Mono, monospace' }}>👨‍🍳 {meal.difficulty}</span>
          </div>
        </div>
        {/* Macros */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:20 }}>
          {[['Kcal', meal.kcal, 'var(--text-primary)'], ['Prot.', `${meal.prot}g`, '#FF0040'], ['Carbs', `${meal.carbs}g`, accent], ['Lip.', `${meal.fat}g`, '#a78bfa']].map(([l,v,c]) => (
            <div key={l} style={{ background:'var(--bg-input)', borderRadius:12, padding:'10px 8px', textAlign:'center' }}>
              <div style={{ fontSize:15, fontWeight:800, color:c, fontFamily:'DM Mono, monospace' }}>{v}</div>
              <div style={{ fontSize:8, color:'var(--text-muted)', textTransform:'uppercase', marginTop:2 }}>{l}</div>
            </div>
          ))}
        </div>
        {/* Ingrédients */}
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:9, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.15em', fontFamily:'DM Mono, monospace', marginBottom:12 }}>Ingrédients</div>
          {meal.ingredients.map((ing, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:accent, flexShrink:0 }}/>
              <span style={{ fontSize:13, color:'var(--text-secondary)' }}>{ing}</span>
            </div>
          ))}
        </div>
        {/* Étapes */}
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:9, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.15em', fontFamily:'DM Mono, monospace', marginBottom:12 }}>Préparation</div>
          {meal.steps.map((step, i) => (
            <div key={i} style={{ display:'flex', gap:12, marginBottom:12, alignItems:'flex-start' }}>
              <div style={{ width:24, height:24, borderRadius:8, background:`${accent}20`, border:`1px solid ${accent}40`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <span style={{ fontSize:11, fontWeight:800, color:accent, fontFamily:'DM Mono, monospace' }}>{i+1}</span>
              </div>
              <span style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.6, paddingTop:2 }}>{step}</span>
            </div>
          ))}
        </div>
        {/* Tip */}
        <div style={{ background:`${accent}10`, border:`1px solid ${accent}25`, borderRadius:14, padding:'12px 14px' }}>
          <div style={{ fontSize:9, color:accent, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', fontFamily:'DM Mono, monospace', marginBottom:6 }}>💡 Conseil nutritionnel</div>
          <div style={{ fontSize:12, color:'var(--text-secondary)', lineHeight:1.6 }}>{meal.tip}</div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function FuelRecoveryHub({ onSync, onOpenScanner }) {
  const [status, setStatus] = useState('loading');
  const [activity, setActivity] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [weightLog, setWeightLog] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pp_weight_log') || '[]'); } catch { return []; }
  });
  const [newWeight, setNewWeight] = useState('');
  const [showWeightInput, setShowWeightInput] = useState(false);

  const [scannedItems, setScannedItems] = useState(() => { try { return JSON.parse(localStorage.getItem('pp_scanned_items') || '[]'); } catch { return []; } });
  const [water, setWater] = useState(() => { try { return parseInt(localStorage.getItem('pp_water') || '0'); } catch { return 0; } });
  const [profile, setProfile] = useState(() => {
    try {
      const settings = JSON.parse(localStorage.getItem('pp_user_settings') || '{}');
      const nutrition = JSON.parse(localStorage.getItem('pp_nutrition_profile') || '{}');
      return { ...nutrition, ...settings };
    } catch { return {}; }
  });

  useEffect(() => {
    setStatus('done');
  }, []);

  const addScannedItem = (item) => {
    const updated = [...scannedItems, { ...item, ts: Date.now(), date: new Date().toLocaleDateString('fr-FR') }];
    setScannedItems(updated);
    try { localStorage.setItem('pp_scanned_items', JSON.stringify(updated.slice(-50))); } catch {}
  };

  const addWater = (ml) => {
    const next = water + ml;
    setWater(next);
    try { localStorage.setItem('pp_water', String(next)); } catch {}
    if (onSync) onSync('pp_water', next);
  };

  const lastWeightEntry = weightLog.length > 0 ? [...weightLog].sort((a,b) => (a.ts||0) - (b.ts||0)).slice(-1)[0].weight : null;
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

  // Nutrition advice
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
    const now = Date.now();
    const entry = { date: today, weight: val, ts: now };
    // Toujours ajouter — on garde la dernière par jour pour l'affichage
    const updated = [...weightLog, entry].slice(-90);
    setWeightLog([...updated]); // forcer re-render avec nouvelle référence
    try { localStorage.setItem('pp_weight_log', JSON.stringify(updated)); } catch {}
    if (onSync) onSync('pp_weight_log', updated);
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

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'Syne, sans-serif', paddingBottom: 100 }}>

      <div style={{ padding: '16px 16px 0' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, marginBottom:20, flexWrap:'wrap' }}>
          <div>
            <div className="eyebrow" style={{ marginBottom:6 }}>Nutrition</div>
            <div style={{ fontSize:26, fontWeight:900, letterSpacing:'-0.03em', color:'var(--text-primary)' }}>
              {isIntense ? 'Post-intensif' : isPostRun ? 'Post-entraînement' : 'Jour de repos'}
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            {isPerte && <span style={{ fontSize:10, padding:'4px 9px', borderRadius:999, background:'var(--chip-bg)', border:'1px solid var(--chip-border)', color:'var(--text-secondary)', fontFamily:'DM Mono, monospace', fontWeight:700 }}>-{deficit} kcal</span>}
            <span style={{ fontSize:12, color:'var(--text-muted)', fontFamily:'DM Mono, monospace' }}>{kcal} kcal/j</span>
          </div>
        </div>

        {/* ── SCANNER PRODUITS ── */}
        <div style={{ marginBottom:14 }}>
          <button onClick={() => onOpenScanner && onOpenScanner()} className="card-hover btn-ripple" style={{ width:'100%', borderRadius:14, border:'1px solid var(--border)', background:'var(--bg-card)', padding:'14px 16px', cursor:'pointer', display:'flex', alignItems:'center', gap:12, fontFamily:'Syne, sans-serif' }}>
            <div className="icon-tile" style={{ background:'var(--accent-soft)' }}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinecap="round"><rect x="3" y="3" width="5" height="5"/><rect x="16" y="3" width="5" height="5"/><rect x="3" y="16" width="5" height="5"/><line x1="16" y1="16" x2="21" y2="16"/><line x1="16" y1="19" x2="21" y2="19"/><line x1="16" y1="16" x2="16" y2="21"/></svg>
            </div>
            <div style={{ flex:1, textAlign:'left' }}>
              <div style={{ fontSize:14, fontWeight:800, color:'var(--text-primary)', marginBottom:2 }}>Scanner un produit</div>
              <div style={{ fontSize:11, color:'var(--text-muted)' }}>Code-barre → macros automatiques</div>
            </div>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth={2}><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
        </div>

        {/* Produits scannés aujourd'hui */}
        {scannedItems.filter(i => i.date === new Date().toLocaleDateString('fr-FR')).length > 0 && (
          <div className="card" style={{ marginBottom:14, padding:0, borderRadius:14, overflow:'hidden' }}>
            <div style={{ padding:'10px 14px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:8 }}>
              <span className="eyebrow">Scannés aujourd'hui</span>
              <div style={{ marginLeft:'auto', fontSize:11, color:'var(--text-secondary)', fontFamily:'DM Mono, monospace', fontWeight:700 }}>
                {scannedItems.filter(i => i.date === new Date().toLocaleDateString('fr-FR')).reduce((s,i) => s+i.kcal, 0)} kcal
              </div>
            </div>
            <div style={{ padding:'8px' }}>
              {scannedItems.filter(i => i.date === new Date().toLocaleDateString('fr-FR')).map((item, idx) => (
                <div key={idx} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 8px', borderRadius:10, marginBottom:4, background:'var(--bg-input)' }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:'var(--text-primary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{item.name}</div>
                    <div style={{ fontSize:9, color:'var(--text-muted)', fontFamily:'DM Mono, monospace' }}>{item.desc}</div>
                  </div>
                  <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                    {[['Kcal',item.kcal,'var(--text-primary)'],['P',`${item.prot}g`,'#FF0040'],['C',`${item.carbs}g`,'#60a5fa'],['L',`${item.fat}g`,'#a78bfa']].map(([l,v,c]) => (
                      <div key={l} style={{ textAlign:'center' }}>
                        <div style={{ fontSize:7, color:'var(--text-muted)', fontFamily:'DM Mono, monospace', textTransform:'uppercase' }}>{l}</div>
                        <div style={{ fontSize:11, fontWeight:800, color:c, fontFamily:'DM Mono, monospace' }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => {
                    const updated = scannedItems.filter((_,i) => i !== scannedItems.indexOf(item));
                    setScannedItems(updated);
                    try { localStorage.setItem('pp_scanned_items', JSON.stringify(updated)); } catch {}
                  }} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:14, padding:'2px 4px' }}>×</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── HYDRATATION ── */}
        <SectionHeader label="Hydratation" color={waterColor} icon={<svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={waterColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 2s7 8 7 13a7 7 0 01-14 0c0-5 7-13 7-13z"/></svg>} />
        <div className="card" style={{ marginBottom:16, padding:0, borderRadius:18, overflow:'hidden' }}>
          {/* Header */}
          <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:13, fontWeight:800, color:'var(--text-primary)' }}>Suivi hydrique</span>
            <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background: waterPct >= 100 ? '#22c55e' : waterPct > 50 ? waterColor : '#f59e0b' }}/>
              <span style={{ fontSize:11, fontFamily:'DM Mono, monospace', color:'var(--text-secondary)' }}>{Math.round(waterPct)}%</span>
            </div>
          </div>
          <div style={{ padding:'16px' }}>
            {/* Progress arc + value */}
            <div style={{ display:'flex', gap:16, alignItems:'center', marginBottom:16 }}>
              <div style={{ width:90, height:90, flexShrink:0, position:'relative' }}>
                {/* Arc SVG */}
                <svg viewBox="0 0 90 90" style={{ width:'100%', height:'100%', transform:'rotate(-90deg)' }}>
                  <circle cx="45" cy="45" r="38" fill="none" stroke="var(--progress-track)" strokeWidth="6"/>
                  <circle cx="45" cy="45" r="38" fill="none" stroke={waterColor} strokeWidth="6"
                    strokeDasharray={`${2 * Math.PI * 38}`}
                    strokeDashoffset={`${2 * Math.PI * 38 * (1 - waterPct/100)}`}
                    strokeLinecap="round"
                    style={{ transition:'stroke-dashoffset 1s cubic-bezier(0.22,1,0.36,1)' }}/>
                </svg>
                <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                  <div style={{ fontSize:18, fontWeight:900, color:'var(--text-primary)', fontFamily:'DM Mono, monospace', lineHeight:1 }}>{(water/1000).toFixed(1)}</div>
                  <div style={{ fontSize:7, color:'var(--text-muted)', fontFamily:'DM Mono, monospace', marginTop:2 }}>litres</div>
                </div>
              </div>
              <div style={{ flex:1 }}>
                <div className="eyebrow" style={{ marginBottom:6 }}>Objectif journalier</div>
                <div style={{ fontSize:22, fontWeight:900, color:'var(--text-primary)', fontFamily:'DM Mono, monospace', lineHeight:1, marginBottom:4 }}>{(waterGoalMl/1000).toFixed(1)}<span style={{ fontSize:11, color:'var(--text-muted)', fontWeight:400 }}>L</span></div>
                <div style={{ height:4, background:'var(--progress-track)', borderRadius:999, overflow:'hidden', marginBottom:12 }}>
                  <div style={{ height:'100%', width:`${waterPct}%`, background:waterColor, borderRadius:999, transition:'width 1s cubic-bezier(0.22,1,0.36,1)' }}/>
                </div>
                <div style={{ display:'flex', gap:6 }}>
                  {[[250,'+ 25cl'],[500,'+ 50cl']].map(([ml, label]) => (
                    <button key={ml} onClick={() => addWater(ml)} style={{ flex:1, background:'var(--btn-ghost-bg)', border:'1px solid var(--btn-ghost-border)', borderRadius:10, padding:'9px 6px', fontSize:10, fontWeight:700, color:'var(--text-primary)', cursor:'pointer', fontFamily:'DM Mono, monospace', letterSpacing:'0.05em' }}>{label}</button>
                  ))}
                  <button onClick={() => { setWater(0); try { localStorage.setItem('pp_water','0'); } catch {} }} style={{ background:'var(--bg-input)', border:'1px solid var(--border)', borderRadius:10, padding:'9px 10px', fontSize:11, color:'var(--text-muted)', cursor:'pointer', fontFamily:'inherit' }}>↺</button>
                </div>
              </div>
            </div>
            {/* Stats row */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
              {[
                { label:"Bu aujourd'hui", value:`${water}ml` },
                { label:'Restant', value:`${Math.max(0,waterGoalMl-water)}ml` },
                { label:'Statut', value: waterPct >= 100 ? 'Hydraté' : waterPct > 60 ? 'Bon' : 'À boire' },
              ].map(({ label, value }) => (
                <div key={label} style={{ background:'var(--bg-input)', border:'1px solid var(--border)', borderRadius:10, padding:'8px', textAlign:'center' }}>
                  <div className="eyebrow" style={{ fontSize:8, marginBottom:4 }}>{label}</div>
                  <div style={{ fontSize:11, fontWeight:800, color:'var(--text-primary)', fontFamily:'DM Mono, monospace' }}>{value}</div>
                </div>
              ))}
            </div>
            {isIntense && (
              <div style={{ marginTop:10, background:'var(--bg-input)', border:'1px solid var(--border)', borderRadius:10, padding:'8px 12px', display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:5, height:5, borderRadius:'50%', background:waterColor, flexShrink:0 }}/>
                <span style={{ fontSize:10, color:'var(--text-secondary)', lineHeight:1.5, fontFamily:'DM Mono, monospace' }}>Ajoute des électrolytes post-effort pour optimiser la récupération.</span>
              </div>
            )}
          </div>
        </div>

        {/* ── ÉNERGIE & MACROS ── */}
        <SectionHeader label="Énergie & macros" color={energyColor} icon={<svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={energyColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M13 2 3 14h7l-1 8 10-12h-7z"/></svg>} />
        <div className="card" style={{ marginBottom:16, padding:0, borderRadius:18, overflow:'hidden' }}>
          {/* Header */}
          <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:13, fontWeight:800, color:'var(--text-primary)' }}>Bilan du jour</span>
            <span style={{ marginLeft:'auto', fontSize:11, fontFamily:'DM Mono, monospace', color:'var(--text-secondary)' }}>{kcal} kcal/j</span>
          </div>
          <div style={{ padding:'16px' }}>
            {/* KPI row */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:16 }}>
              {[
                { label:'Glucides', value:carbs, unit:'g', color:energyColor, max:700 },
                { label:'Protéines', value:protein, unit:'g', color:'#FF0040', max:300 },
                { label:'Lipides', value:fat, unit:'g', color:'#a78bfa', max:150 },
              ].map(({ label, value, unit, color, max }) => (
                <div key={label} style={{ borderRadius:12, border:'1px solid var(--border)', background:'var(--bg-input)', padding:'10px 8px', textAlign:'center' }}>
                  <div style={{ fontSize:8, color:'var(--text-muted)', fontFamily:'DM Mono, monospace', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>{label}</div>
                  <div style={{ fontSize:20, fontWeight:900, color, fontFamily:'DM Mono, monospace', lineHeight:1 }}>{value}</div>
                  <div style={{ fontSize:7, color:'var(--text-muted)', fontFamily:'DM Mono, monospace', marginBottom:6 }}>{unit}</div>
                  <div style={{ height:3, background:'var(--progress-track)', borderRadius:999, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${Math.min(value/max*100,100)}%`, background:color, borderRadius:999 }}/>
                  </div>
                </div>
              ))}
            </div>
            {/* Conseil nutrition */}
            <div style={{ marginBottom:activity?12:0, background:'var(--bg-input)', borderRadius:12, padding:'12px 14px', border:'1px solid var(--border)' }}>
              <div className="eyebrow" style={{ marginBottom:6 }}>Conseil nutrition</div>
              <div style={{ fontSize:11, color:'var(--text-secondary)', lineHeight:1.7, minHeight:32, fontFamily:'DM Mono, monospace' }}>
                {status === 'loading' ? '> Analyse en cours...' : typedAI}
                {status === 'done' && typedAI.length < aiText.length && <span style={{ opacity:0.5 }}>_</span>}
              </div>
            </div>
            {/* Expand activité */}
            {activity && (
              <button onClick={() => setExpanded(!expanded)} style={{ width:'100%', background:'var(--bg-input)', border:'1px solid var(--border)', borderRadius:10, padding:'8px 14px', cursor:'pointer', fontFamily:'DM Mono, monospace', display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:expanded?10:0, transition:'all 0.3s' }}>
                <span style={{ fontSize:9, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em' }}>Détails activité</span>
                <span style={{ fontSize:11, color:energyColor, transition:'transform 0.3s', display:'inline-block', transform:expanded?'rotate(180deg)':'rotate(0deg)' }}>▾</span>
              </button>
            )}
            {expanded && activity && (
              <div style={{ background:'var(--bg-input)', borderRadius:10, padding:'10px 12px', marginBottom:0, border:'1px solid var(--border)' }}>
                {[
                  ['Activité', activity.name],
                  ['Distance', `${distKm.toFixed(1)} km`],
                  ['Dénivelé +', `${Math.round(elevation)} m`],
                  ['Durée', `${Math.round(activity.moving_time/60)} min`],
                  ['FC moy.', activity.average_heartrate ? `${Math.round(activity.average_heartrate)} bpm` : '—'],
                  ['Calories', activity.calories ? `${activity.calories} kcal` : '—'],
                ].map(([k, v]) => (
                  <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderBottom:'1px solid var(--border)' }}>
                    <span style={{ fontSize:9, color:'var(--text-muted)', fontFamily:'DM Mono, monospace', textTransform:'uppercase', letterSpacing:'0.08em' }}>{k}</span>
                    <span style={{ fontSize:10, color:'var(--text-primary)', fontFamily:'DM Mono, monospace', fontWeight:700 }}>{v}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── REPAS RECOMMANDÉ ── */}
        <SectionHeader label="Repas recommandé" color={energyColor} icon={<Icon name="nutrition" size={13} color={energyColor} />} />
        <MealCard meal={meals[0]} tag={mealTag} accent={energyColor} onClick={() => setSelectedMeal(meals[0])} />
        {meals[1] && <div style={{marginTop:10}}><MealCard meal={meals[1]} tag={mealTag} accent={energyColor} onClick={() => setSelectedMeal(meals[1])} /></div>}
        {selectedMeal && <RecipeSheet meal={selectedMeal} tag={mealTag} accent={energyColor} onClose={() => setSelectedMeal(null)} />}

        {/* Suivi du poids */}
        <SectionHeader label="Suivi du poids" color="#f97316" icon={<Icon name="weight" size={13} color="#f97316" />} />
        <div className="card" style={{ padding:0, borderRadius:18, overflow:'hidden', marginBottom:16 }}>
          <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:13, fontWeight:800, color:'var(--text-primary)' }}>Évolution</span>
            <button onClick={() => setShowWeightInput(!showWeightInput)} style={{ marginLeft:'auto', background:'var(--btn-ghost-bg)', border:'1px solid var(--btn-ghost-border)', borderRadius:8, padding:'5px 12px', fontSize:11, fontWeight:700, color:'var(--text-primary)', cursor:'pointer', fontFamily:'Syne, sans-serif' }}>
              + Peser
            </button>
          </div>
          <div style={{ padding:'14px 16px' }}>
            {showWeightInput && (
              <div style={{ display:'flex', gap:8, marginBottom:14 }}>
                <input type="number" inputMode="decimal" value={newWeight} onChange={e => setNewWeight(e.target.value)} placeholder="Ex: 74.5" step="0.1" style={{ flex:1, background:'var(--bg-input)', border:'1px solid var(--border-input)', borderRadius:10, padding:'10px 12px', color:'var(--text-primary)', fontSize:16, fontFamily:'DM Mono, monospace', outline:'none' }} />
                <button onClick={addWeight} className="btn-ripple" style={{ background:'var(--accent)', border:'none', borderRadius:10, padding:'10px 18px', fontSize:12, fontWeight:800, color:'#fff', cursor:'pointer', fontFamily:'DM Mono, monospace' }}>OK</button>
              </div>
            )}

            {weightLog.length >= 1 ? (() => {
              // Afficher toutes les mesures triées par timestamp
              const sorted = [...weightLog].sort((a,b) => (a.ts||0) - (b.ts||0));
              const first = sorted[0].weight;
              const last = sorted[sorted.length-1].weight;
              const min = Math.min(...sorted.map(e=>e.weight));
              const max = Math.max(...sorted.map(e=>e.weight));
              const diff = (last - first).toFixed(1);
              const target = profile.weight || first;
              const W = 300, H = 80;
              const xStep = sorted.length > 1 ? W / (sorted.length - 1) : W;
              const yRange = max - min || 2;
              const toY = v => sorted.length === 1 ? H/2 : H - ((v - min) / yRange) * (H - 10) - 5;
              const points = sorted.map((e,i) => `${sorted.length > 1 ? i*xStep : W/2},${toY(e.weight)}`).join(' ');
              return (
                <div>
                  {/* KPIs */}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                    <div style={{ fontSize:9, color:'var(--text-muted)', fontFamily:'DM Mono, monospace' }}>{sorted.length} mesure{sorted.length>1?'s':''}</div>
                    <button onClick={() => { setWeightLog([]); try { localStorage.removeItem('pp_weight_log'); } catch {} }} style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, padding:'3px 10px', fontSize:10, color:'rgba(239,68,68,0.6)', cursor:'pointer', fontFamily:'inherit' }}>Tout effacer</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 14 }}>
                    {[
                      ['Actuel', `${last} kg`, diff <= 0 ? '#22c55e' : '#FF0040'],
                      ['Évolution', `${diff > 0 ? '+' : ''}${diff} kg`, diff <= 0 ? '#22c55e' : '#FF0040'],
                      ['Mesures', `${sorted.length}j`, '#f97316'],
                    ].map(([l,v,col]) => (
                      <div key={l} style={{ borderRadius:10, border:'1px solid var(--border)', background:'var(--bg-input)', padding:'10px 8px', textAlign:'center' }}>
                        <div style={{ fontSize:8, color:'var(--text-muted)', fontFamily:'DM Mono, monospace', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>{l}</div>
                        <div style={{ fontSize:16, fontWeight:900, color:col, fontFamily:'DM Mono, monospace', lineHeight:1 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  {/* Courbe SVG */}
                  <div style={{ background: 'var(--bg-input)', border:'1px solid var(--border)', borderRadius: 12, padding: '8px', marginBottom: 10 }}>
                    <svg viewBox="0 0 300 90" style={{ width:'100%', height:90, display:'block' }}>
                      <defs>
                        <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f97316" stopOpacity="0.25"/>
                          <stop offset="100%" stopColor="#f97316" stopOpacity="0"/>
                        </linearGradient>
                      </defs>
                      {[0,1,2].map(i => <line key={i} x1={0} y1={10+i*25} x2={300} y2={10+i*25} stroke="rgba(255,255,255,0.04)" strokeWidth={1}/>)}
                      {sorted.length > 1 && <polygon points={`${sorted.map((e,i)=>`${i*xStep},${toY(e.weight)}`).join(' ')} ${(sorted.length-1)*xStep},75 0,75`} fill="url(#wg)"/>}
                      {sorted.length > 1 && <polyline points={sorted.map((e,i)=>`${i*xStep},${toY(e.weight)}`).join(' ')} fill="none" stroke="#f97316" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>}
                      {sorted.map((e,i) => (
                        <g key={i}>
                          <circle cx={sorted.length>1?i*xStep:150} cy={toY(e.weight)} r={2.5} fill="#f97316"/>
                          {(i===0||i===sorted.length-1) && (
                            <text x={sorted.length>1?i*xStep:150} y={toY(e.weight)-5} textAnchor={i===0||sorted.length===1?'start':'end'} fill="rgba(255,255,255,0.55)" fontSize={6} fontFamily="monospace">{e.weight}kg</text>
                          )}
                        </g>
                      ))}
                      <text x={2} y={86} fill="rgba(255,255,255,0.2)" fontSize={6} fontFamily="monospace">{sorted[0].date}</text>
                      {sorted.length>1 && <text x={298} y={86} textAnchor="end" fill="rgba(255,255,255,0.2)" fontSize={6} fontFamily="monospace">{sorted[sorted.length-1].date}</text>}
                    </svg>
                  </div>
                  {diff < 0 && <div style={{ fontSize: 11, color: '#22c55e', textAlign: 'center', fontFamily: 'DM Mono, monospace', marginBottom:10 }}>🎯 {Math.abs(diff)} kg perdus depuis le début</div>}
                  {/* Liste des mesures */}
                  <div style={{ maxHeight:120, overflowY:'auto' }}>
                    {[...sorted].reverse().map((e,i) => (
                      <div key={e.ts||i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'5px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                        <span style={{ fontSize:10, color:'var(--text-muted)', fontFamily:'DM Mono, monospace' }}>{e.date}</span>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <span style={{ fontSize:12, fontWeight:700, color:'#f97316', fontFamily:'DM Mono, monospace' }}>{e.weight} kg</span>
                          <button onClick={() => {
                            const updated = weightLog.filter(x => x.ts !== e.ts && !(x.date===e.date && !x.ts && !e.ts));
                            setWeightLog(updated);
                            try { localStorage.setItem('pp_weight_log', JSON.stringify(updated)); } catch {}
    if (onSync) onSync('pp_weight_log', updated);
                          }} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(239,68,68,0.4)', fontSize:12, padding:'2px 4px' }}>✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })() : (
              <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-muted)', fontSize: 12 }}>
                Ajoute une 2ème mesure dans quelques jours pour voir ta courbe d'évolution
              </div>
            )}
          </div>
        </div>

      </div>

      <style>{`
        @keyframes wave { 0%{transform:translateX(0)} 100%{transform:translateX(40px)} }
      `}</style>
    </div>
  );
}
