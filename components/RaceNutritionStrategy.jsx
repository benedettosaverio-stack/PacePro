'use client';
import { useState } from 'react';
import { createPortal } from 'react-dom';

function useTypewriter(text, speed = 15) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const ref = { current: null };
  if (typeof window !== 'undefined' && text && !done) {
    // handled via useEffect below
  }
  return displayed;
}

function Section({ title, color, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${color}50, transparent)` }}/>
        <span style={{ fontSize: 9, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.2em', fontFamily: 'DM Mono, monospace', whiteSpace: 'nowrap' }}>{title}</span>
        <div style={{ flex: 1, height: 1, background: `linear-gradient(270deg, ${color}50, transparent)` }}/>
      </div>
      {children}
    </div>
  );
}

function NutritionCard({ title, items, color, icon }) {
  return (
    <div style={{ background: 'var(--bg-input)', border: `1px solid ${color}25`, borderRadius: 16, padding: '14px 16px', marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>{title}</span>
      </div>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0, marginTop: 5 }}/>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item}</span>
        </div>
      ))}
    </div>
  );
}

function TimelineRow({ time, label, detail, color }) {
  return (
    <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}15`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 9, fontWeight: 800, color, fontFamily: 'DM Mono, monospace', textAlign: 'center', lineHeight: 1.2 }}>{time}</span>
        </div>
        <div style={{ width: 1, flex: 1, background: `${color}20`, marginTop: 4 }}/>
      </div>
      <div style={{ paddingTop: 8, flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3 }}>{label}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>{detail}</div>
      </div>
    </div>
  );
}

function buildStrategy(profile, userSettings) {
  const dist = parseFloat(profile.raceDistanceKm) || 10;
  const elev = parseFloat(profile.elevationM) || 0;
  const w = userSettings?.weight || 70;
  const vma = parseFloat(profile.vma) || 12;
  const isTrail = profile.type === 'trail';

  // Estimation temps de course
  const efPace = 60 / (vma * 0.72); // min/km
  const trailFactor = 1 + (elev / dist) * 0.01;
  const estTimeMin = Math.round(dist * efPace * (isTrail ? trailFactor : 1) * 0.9);
  const estH = Math.floor(estTimeMin / 60);
  const estM = estTimeMin % 60;
  const estTimeStr = estH > 0 ? `${estH}h${estM.toString().padStart(2,'0')}` : `${estM} min`;

  // Catégorie
  const cat = dist <= 5 ? 'sprint' : dist <= 12 ? 'dix' : dist <= 22 ? 'semi' : dist <= 43 ? 'marathon' : 'ultra';

  // Calories estimées
  const kcalRace = Math.round(w * dist * (isTrail ? 1.3 : 1.0) * (elev > 0 ? 1 + elev/5000 : 1));

  const strategies = {
    sprint: {
      label: '5–10 km · Allure haute',
      color: '#FF0040',
      jMinus3: { carbs: Math.round(w * 5), prot: Math.round(w * 1.8), fat: Math.round(w * 0.8), kcal: Math.round(w * 35) },
      jMinus1: { carbs: Math.round(w * 6), prot: Math.round(w * 1.6), fat: Math.round(w * 0.7), kcal: Math.round(w * 38) },
      morning: ['Petit-déjeuner 3h avant : pain complet, beurre de cacahuète, banane, café', 'Éviter les fibres et les graisses le matin', '500ml d\'eau avec électrolytes au réveil'],
      during: ['< 45 min : eau uniquement', '45–90 min : 1 gel énergétique à mi-course', 'Boire 150ml toutes les 20 min'],
      after: [`${kcalRace} kcal à recharger dans les 30 min`, `${Math.round(w*0.3)}g de protéines dans l'heure`, 'Smoothie banane + whey + lait d\'amande idéal'],
      tips: ['Teste ta nutrition à l\'entraînement avant le jour J', 'Rien de nouveau le jour de course', 'La caféine 60 min avant améliore la performance de 3-5%'],
    },
    dix: {
      label: '10–15 km · Endurance',
      color: '#f59e0b',
      jMinus3: { carbs: Math.round(w * 5.5), prot: Math.round(w * 1.8), fat: Math.round(w * 0.9), kcal: Math.round(w * 38) },
      jMinus1: { carbs: Math.round(w * 7), prot: Math.round(w * 1.6), fat: Math.round(w * 0.7), kcal: Math.round(w * 42) },
      morning: ['Petit-déjeuner 3h avant : flocons d\'avoine, banane, miel, café', '300ml eau + électrolytes 2h avant', 'Gel ou barre énergétique 30 min avant le départ'],
      during: ['1 gel toutes les 45 min', '150-200ml eau toutes les 15-20 min', 'Sel si > 1h de course par temps chaud'],
      after: [`${kcalRace} kcal à recharger`, `Pasta ou riz dans les 2h post-course`, `${Math.round(w*0.35)}g protéines pour la récupération`],
      tips: ['Commence à allure confortable — tu peux accélérer en 2ème moitié', 'Hydrate-toi la veille — urines claires = bonne hydratation', 'Évite les aliments riches en fibres 48h avant'],
    },
    semi: {
      label: 'Semi-marathon · 21km',
      color: '#6366f1',
      jMinus3: { carbs: Math.round(w * 6), prot: Math.round(w * 1.7), fat: Math.round(w * 0.9), kcal: Math.round(w * 40) },
      jMinus1: { carbs: Math.round(w * 8), prot: Math.round(w * 1.5), fat: Math.round(w * 0.6), kcal: Math.round(w * 45) },
      morning: ['Petit-déjeuner 3h avant : pain blanc, confiture, banane, café', 'Gel énergétique 15 min avant le départ', '500ml eau + électrolytes 90 min avant'],
      during: ['1 gel toutes les 40 min (à partir du km 7)', '200ml eau à chaque ravitaillement', 'Coca ou boisson sucrée en fin de course si fatigue'],
      after: [`${kcalRace} kcal — repas complet dans les 2h`, 'Bowl riz + poulet + légumes cuits', `Massage et ${Math.round(w*0.3)}g protéines dans l'heure`],
      tips: ['La charge en glucides commence J-3', 'Teste les gels de la course en entraînement', 'Dormir 8-9h les 2 nuits avant est crucial'],
    },
    marathon: {
      label: 'Marathon · 42km',
      color: '#22c55e',
      jMinus3: { carbs: Math.round(w * 7), prot: Math.round(w * 1.6), fat: Math.round(w * 0.8), kcal: Math.round(w * 44) },
      jMinus1: { carbs: Math.round(w * 9), prot: Math.round(w * 1.4), fat: Math.round(w * 0.5), kcal: Math.round(w * 48) },
      morning: ['Petit-déjeuner 3-4h avant : pain blanc, beurre, confiture, banane x2', '750ml eau + électrolytes dans les 2h avant', '2 gels dans la poche — 1 en réserve'],
      during: ['1 gel toutes les 35 min dès le km 10', 'Eau ET boisson isotonique aux ravitaillements', 'Banane ou orange aux ravitaillements si disponible', 'Sel en tablette si > 3h de course'],
      after: [`${kcalRace} kcal — récupération sur 48h`, 'Glucides simples immédiatement, complexes après', `${Math.round(w*0.4)}g protéines en 2 prises sur 4h`, 'Anti-inflammatoires naturels : curcuma, oméga-3'],
      tips: ['Le mur du marathon se combat à l\'entraînement ET à la nutrition', 'Ne jamais dépasser 80% de ta FCmax les 25 premiers km', 'La caféine est ton alliée — gel caféiné au km 30'],
    },
    ultra: {
      label: 'Ultra · +42km',
      color: '#a78bfa',
      jMinus3: { carbs: Math.round(w * 8), prot: Math.round(w * 1.8), fat: Math.round(w * 1.0), kcal: Math.round(w * 50) },
      jMinus1: { carbs: Math.round(w * 9), prot: Math.round(w * 1.6), fat: Math.round(w * 0.8), kcal: Math.round(w * 52) },
      morning: ['Petit-déjeuner solide 3-4h avant : porridge, fruits secs, café', 'Prépare 2 sacs de ravitaillement personnalisés', 'Flasques : 1 eau, 1 boisson glucidique'],
      during: ['60-90g de glucides/heure dès la 1ère heure', 'Nourriture solide acceptée : sandwiches, patates, bouillon', 'Alterner sucré/salé pour éviter l\'écourement', 'Sel crucial — 500-1000mg/heure par temps chaud'],
      after: ['Récupération sur 72h minimum', 'Soupe, bouillon, aliments faciles à digérer', `${Math.round(w*0.4)}g protéines/jour pendant 3 jours`, 'Sommeil prioritaire sur tout le reste'],
      tips: ['Entraîne ton intestin à absorber des glucides en courant', 'La stratégie ultra : marche en montée, course en descente', 'Pense à la santé intestinale — probiotiques 2 semaines avant'],
    },
  };

  return { ...strategies[cat], estTimeStr, kcalRace, dist, elev, isTrail, cat };
}

export default function RaceNutritionStrategy({ profile, userSettings, onClose }) {
  const [tab, setTab] = useState('avant');
  const strat = buildStrategy(profile, userSettings);
  const accent = strat.color;

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div style={{ position:'fixed', inset:0, zIndex:9999, display:'flex', flexDirection:'column', justifyContent:'flex-end' }} onClick={onClose}>
      <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(8px)' }}/>
      <div onClick={e=>e.stopPropagation()} className='sheet-enter' style={{ position:'relative', width:'100%', background:'var(--bg-primary)', borderRadius:'24px 24px 0 0', padding:'12px 20px 48px', maxHeight:'90vh', overflowY:'auto', zIndex:1 }}>

        {/* Handle + close */}
        <div style={{ display:'flex', alignItems:'center', marginBottom:16 }}>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', padding:'4px 8px 4px 0', color:'var(--text-muted)', display:'flex', alignItems:'center', gap:4 }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            <span style={{ fontSize:11, fontFamily:'DM Mono, monospace' }}>retour</span>
          </button>
          <div style={{ flex:1, display:'flex', justifyContent:'center' }}>
            <div style={{ width:36, height:4, background:'rgba(255,255,255,0.15)', borderRadius:99 }}/>
          </div>
          <div style={{ width:60 }}/>
        </div>

        {/* Header */}
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:9, color:accent, fontFamily:'DM Mono, monospace', textTransform:'uppercase', letterSpacing:'0.15em', marginBottom:6 }}>Stratégie nutritionnelle · {strat.label}</div>
          <div style={{ fontSize:22, fontWeight:900, color:'var(--text-primary)', letterSpacing:'-0.03em', marginBottom:8 }}>{profile.raceName || 'Ma course'}</div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <span style={{ fontSize:10, padding:'3px 10px', borderRadius:99, background:`${accent}15`, color:accent, border:`1px solid ${accent}30`, fontFamily:'DM Mono, monospace', fontWeight:700 }}>{profile.raceDistanceKm} km</span>
            {profile.elevationM > 0 && <span style={{ fontSize:10, padding:'3px 10px', borderRadius:99, background:'rgba(245,158,11,0.1)', color:'#f59e0b', border:'1px solid rgba(245,158,11,0.3)', fontFamily:'DM Mono, monospace', fontWeight:700 }}>D+{profile.elevationM}m</span>}
            <span style={{ fontSize:10, padding:'3px 10px', borderRadius:99, background:'var(--bg-input)', color:'var(--text-muted)', fontFamily:'DM Mono, monospace' }}>~{strat.estTimeStr}</span>
            <span style={{ fontSize:10, padding:'3px 10px', borderRadius:99, background:'rgba(255,0,64,0.1)', color:'#FF0040', fontFamily:'DM Mono, monospace' }}>~{strat.kcalRace} kcal</span>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', background:'var(--bg-input)', borderRadius:14, padding:4, gap:3, marginBottom:20 }}>
          {[['avant','Avant'],['pendant','Pendant'],['apres','Après'],['conseils','Conseils']].map(([v,l]) => (
            <button key={v} onClick={() => setTab(v)} style={{ flex:1, padding:'8px 4px', borderRadius:10, border:'none', cursor:'pointer', fontFamily:'Syne, sans-serif', fontSize:11, fontWeight:700, transition:'all 0.2s', background:tab===v?accent:'transparent', color:tab===v?'#fff':'rgba(255,255,255,0.4)' }}>{l}</button>
          ))}
        </div>

        {/* Avant */}
        {tab === 'avant' && (
          <div>
            <Section title="J-3 à J-1 · Charge glucidique" color={accent}>
              <div style={{ background:'var(--bg-card)', border:`1px solid ${accent}20`, borderRadius:16, padding:'16px' }}>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10, marginBottom:14 }}>
                  {[['Glucides',`${strat.jMinus3.carbs}g/j`,accent],['Protéines',`${strat.jMinus3.prot}g/j`,'#FF0040'],['Lipides',`${strat.jMinus3.fat}g/j`,'#a78bfa'],['Calories',`${strat.jMinus3.kcal} kcal`,'#fff']].map(([l,v,c])=>(
                    <div key={l} style={{ background:'var(--bg-input)', borderRadius:10, padding:'10px', textAlign:'center' }}>
                      <div style={{ fontSize:16, fontWeight:800, color:c, fontFamily:'DM Mono, monospace' }}>{v}</div>
                      <div style={{ fontSize:9, color:'var(--text-muted)', textTransform:'uppercase', marginTop:2 }}>{l}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize:11, color:'var(--text-muted)', lineHeight:1.6 }}>Augmente progressivement les glucides. Réduis les fibres et les graisses à J-1. Hydrate-toi abondamment.</div>
              </div>
            </Section>
            <Section title="Matin de la course" color="#38bdf8">
              <NutritionCard title="Protocole matinal" items={strat.morning} color="#38bdf8" icon="🌅" />
            </Section>
            <Section title="J-1 · Veille de course" color="#22c55e">
              <div style={{ background:'rgba(34,197,94,0.05)', border:'1px solid rgba(34,197,94,0.2)', borderRadius:16, padding:'14px 16px' }}>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8, marginBottom:10 }}>
                  {[['Glucides',`${strat.jMinus1.carbs}g`,accent],['Protéines',`${strat.jMinus1.prot}g`,'#FF0040']].map(([l,v,c])=>(
                    <div key={l} style={{ background:'var(--bg-input)', borderRadius:10, padding:'10px', textAlign:'center' }}>
                      <div style={{ fontSize:18, fontWeight:800, color:c, fontFamily:'DM Mono, monospace' }}>{v}</div>
                      <div style={{ fontSize:9, color:'var(--text-muted)', textTransform:'uppercase', marginTop:2 }}>{l}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize:11, color:'var(--text-muted)' }}>Pasta, riz blanc, pain — evite les sauces lourdes. Dîner léger à 19h max.</div>
              </div>
            </Section>
          </div>
        )}

        {/* Pendant */}
        {tab === 'pendant' && (
          <div>
            <Section title="Stratégie de course" color={accent}>
              <div style={{ marginBottom:16 }}>
                {strat.during.map((item, i) => (
                  <div key={i} style={{ display:'flex', gap:12, marginBottom:12, alignItems:'flex-start' }}>
                    <div style={{ width:24, height:24, borderRadius:8, background:`${accent}15`, border:`1px solid ${accent}30`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <span style={{ fontSize:10, fontWeight:800, color:accent, fontFamily:'DM Mono, monospace' }}>{i+1}</span>
                    </div>
                    <span style={{ fontSize:13, color:'rgba(255,255,255,0.75)', lineHeight:1.6, paddingTop:2 }}>{item}</span>
                  </div>
                ))}
              </div>
            </Section>
            <Section title="Timeline de ravitaillement" color="#38bdf8">
              <TimelineRow time="Dép." label="Départ" detail="En bonne condition, bien hydraté, énergie disponible" color="#22c55e" />
              {strat.dist > 10 && <TimelineRow time={`${Math.round(strat.dist*0.3)}km`} label="1er gel / ravitaillement" detail="Même si tu te sens bien — anticipe avant la fatigue" color={accent} />}
              {strat.dist > 20 && <TimelineRow time={`${Math.round(strat.dist*0.5)}km`} label="Mi-course · Bilan" detail="Ajuste le rythme selon les sensations et les réserves" color="#f59e0b" />}
              {strat.dist > 30 && <TimelineRow time={`${Math.round(strat.dist*0.75)}km`} label="Zone de combat" detail="Gel caféiné, motivation mentale, réduis le rythme si besoin" color="#FF0040" />}
              <TimelineRow time="Arr." label="Arrivée" detail="Félicitations — récupération immédiate dans les 30 min" color="#a78bfa" />
            </Section>
          </div>
        )}

        {/* Après */}
        {tab === 'apres' && (
          <div>
            <Section title="Récupération immédiate (0-30 min)" color="#22c55e">
              <NutritionCard title="Fenêtre anabolique" items={strat.after} color="#22c55e" icon="⚡" />
            </Section>
            <Section title="Repas de récupération" color={accent}>
              <div style={{ background:`${accent}08`, border:`1px solid ${accent}20`, borderRadius:16, padding:'14px 16px' }}>
                <div style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)', marginBottom:6 }}>
                  {strat.cat === 'sprint' ? 'Bowl protéiné · Riz + Poulet' :
                   strat.cat === 'dix' ? 'Pasta Bolognaise · Salade verte' :
                   strat.cat === 'semi' ? 'Pizza complète + dessert sucré' :
                   strat.cat === 'marathon' ? 'Repas festif libre — tu l\'as mérité !' :
                   'Bouillon, soupe, aliments doux — digestion prioritaire'}
                </div>
                <div style={{ fontSize:11, color:'var(--text-muted)', lineHeight:1.6 }}>
                  Fais-toi plaisir tout en rechargeant. Priorité aux glucides complexes et protéines de qualité dans les 2h.
                </div>
              </div>
            </Section>
          </div>
        )}

        {/* Conseils */}
        {tab === 'conseils' && (
          <div>
            <Section title="Conseils clés" color={accent}>
              {strat.tips.map((tip, i) => (
                <div key={i} style={{ background:'var(--bg-card)', border:`1px solid ${accent}15`, borderRadius:14, padding:'12px 14px', marginBottom:10, display:'flex', gap:10, alignItems:'flex-start' }}>
                  <span style={{ fontSize:16 }}>{'💡⚠️🎯🔥⚡'.split('').filter((_,j)=>j%2===0)[i%3]}</span>
                  <span style={{ fontSize:12, color:'rgba(255,255,255,0.75)', lineHeight:1.6 }}>{tip}</span>
                </div>
              ))}
            </Section>
            <Section title="À éviter absolument" color="#FF0040">
              <NutritionCard title="Erreurs fréquentes" color="#FF0040" icon="🚫" items={[
                'Tester quelque chose de nouveau le jour J (aliment, gel, chaussures)',
                'Partir trop vite — la nutrition ne compensera pas un mauvais rythme',
                'Sauter le petit-déjeuner même si tu n\'as pas faim',
                'Boire trop d\'eau sans sel — risque d\'hyponatrémie sur les longues distances',
                'Ignorer les signaux de ton corps en course',
              ]}/>
            </Section>
          </div>
        )}

      </div>
    </div>,
    document.body
  );
}
