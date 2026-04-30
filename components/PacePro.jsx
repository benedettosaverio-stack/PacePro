'use client';

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPA_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function supaFetch(path, options = {}) {
  try {
    const res = await fetch(SUPA_URL + '/rest/v1/' + path, {
      ...options,
      headers: {
        'apikey': SUPA_KEY,
        'Authorization': 'Bearer ' + SUPA_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
        ...options.headers,
      },
    });
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  } catch(e) { return null; }
}

async function syncPlans(plans) {
  const userId = localStorage.getItem('pp_user_id');
  if (!userId || !plans.length) return;
  try {
    await supaFetch('plans?user_id=eq.' + userId, { method: 'DELETE' });
    await supaFetch('plans', {
      method: 'POST',
      body: JSON.stringify(plans.map(p => ({ user_id: userId, plan_data: p, plan_name: p.profile?.goal || 'Plan' }))),
    });
  } catch(e) {}
}

async function loadPlans() {
  const userId = localStorage.getItem('pp_user_id');
  if (!userId) return null;
  try {
    const data = await supaFetch('plans?user_id=eq.' + userId + '&order=created_at.asc');
    if (data && data.length > 0) return data.map(d => d.plan_data);
    return null;
  } catch(e) { return null; }
}

import { useState, useEffect } from 'react';
import Muscu from './MusculationModule';
import StravaModule from './StravaModule';
import HomeModule from './HomeModule';
import HistoriqueModule from './HistoriqueModule';
import AuthModule from './AuthModule';
import { Icon } from './Icons';

// ─── Thème clair/sombre automatique ──────────────────────────────────────────
function ThemeStyles() {
  return (
    <style>{`
      :root {
        --bg-primary: #07080b;
        --bg-card: rgba(19,22,31,0.85);
        --bg-surface: rgba(10,12,18,0.92);
        --bg-input: rgba(255,255,255,0.04);
        --bg-nav: rgba(7,8,11,0.88);
        --bg-modal: #13161f;
        --text-primary: #ffffff;
        --text-secondary: rgba(255,255,255,0.45);
        --text-muted: rgba(255,255,255,0.25);
        --text-ultra-muted: rgba(255,255,255,0.15);
        --border: rgba(255,255,255,0.07);
        --border-input: rgba(255,255,255,0.10);
        --border-nav: rgba(255,255,255,0.06);
        --btn-ghost-bg: rgba(255,255,255,0.05);
        --btn-ghost-border: rgba(255,255,255,0.08);
        --btn-ghost-color: rgba(255,255,255,0.4);
        --onboarding-bg: #07080b;
        --session-bg: rgba(10,12,18,0.9);
        --session-border: rgba(255,255,255,0.06);
        --week-tabs-inactive: rgba(255,255,255,0.04);
        --week-tabs-border: rgba(255,255,255,0.07);
        --week-tabs-color: rgba(255,255,255,0.35);
        --next-session-bg: rgba(255,0,64,0.06);
        --next-session-border: rgba(255,0,64,0.2);
        --chip-bg: rgba(255,255,255,0.04);
        --chip-border: rgba(255,255,255,0.07);
        --progress-track: rgba(255,255,255,0.06);
        --svg-text: rgba(255,255,255,0.25);
        --svg-text-val: rgba(255,255,255,0.4);
        --plans-bg: #07080b;
      }
      @media (prefers-color-scheme: light) {
        :root {
          --bg-primary: #f0f2f5;
          --bg-card: rgba(255,255,255,0.92);
          --bg-surface: rgba(255,255,255,0.98);
          --bg-input: rgba(10,11,15,0.06);
          --bg-nav: rgba(240,242,245,0.92);
          --bg-modal: #ffffff;
          --text-primary: #0a0b0f;
          --text-secondary: #444750;
          --text-muted: #6b6f7a;
          --text-ultra-muted: #9296a0;
          --border: rgba(10,11,15,0.12);
          --border-input: rgba(10,11,15,0.18);
          --border-nav: rgba(10,11,15,0.10);
          --btn-ghost-bg: rgba(10,11,15,0.06);
          --btn-ghost-border: rgba(10,11,15,0.12);
          --btn-ghost-color: #555860;
          --onboarding-bg: #f0f2f5;
          --session-bg: rgba(255,255,255,0.96);
          --session-border: rgba(10,11,15,0.10);
          --week-tabs-inactive: rgba(10,11,15,0.06);
          --week-tabs-border: rgba(10,11,15,0.10);
          --week-tabs-color: #6b6f7a;
          --next-session-bg: rgba(255,0,64,0.04);
          --next-session-border: rgba(255,0,64,0.18);
          --chip-bg: rgba(10,11,15,0.06);
          --chip-border: rgba(10,11,15,0.12);
          --progress-track: rgba(10,11,15,0.09);
          --svg-text: #9296a0;
          --svg-text-val: #6b6f7a;
          --plans-bg: #f0f2f5;
        }
      }
      * { box-sizing: border-box; }
      body { background: var(--bg-primary); }
      input, select, button { font-family: inherit; }
    `}</style>
  );
}

function toPace(speedKmh) {
  const mPerKm = 60 / speedKmh;
  const m = Math.floor(mPerKm);
  const s = Math.round((mPerKm - m) * 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
function calcPaces(vma) {
  return {
    ef:        `${toPace(vma*0.70)}–${toPace(vma*0.75)}`,
    tempo:     `${toPace(vma*0.80)}–${toPace(vma*0.85)}`,
    threshold: `${toPace(vma*0.87)}–${toPace(vma*0.92)}`,
    vma90:     `${toPace(vma*0.92)}–${toPace(vma*1.00)}`,
    recov:     `${toPace(vma*0.60)}–${toPace(vma*0.65)}`,
  };
}
function estimateVMA(distKm, timeMins) {
  const speed = distKm / (timeMins / 60);
  const factors = [[1,.95],[3,.90],[5,.87],[10,.84],[21.1,.78],[42.2,.72]];
  const [,f] = factors.reduce((p,c) => Math.abs(c[0]-distKm)<Math.abs(p[0]-distKm)?c:p);
  return +(speed / f).toFixed(1);
}
const DAYS_FR = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];

function generatePlan(profile) {
  const { vma, level, type, weeks, sessionsPerWeek, trainingDays, raceDistanceKm, elevationM } = profile;
  const paces = calcPaces(vma);
  const isTrail = type === 'trail';
  const hasElevation = elevationM > 100;
  const baseKm = { beginner:5, intermediate:8, advanced:11, expert:14 }[level];
  const mult   = { beginner:0.8, intermediate:1.0, advanced:1.2, expert:1.5 }[level];
  const phaseMap = [];
  if (weeks === 2) { phaseMap.push('base','taper'); }
  else if (weeks <= 4) { for(let i=0;i<weeks;i++) phaseMap.push(i<Math.ceil(weeks*0.6)?'base':i<weeks-1?'peak':'taper'); }
  else if (weeks <= 8) { [3,3,1,1].forEach((n,pi)=>{ for(let i=0;i<n&&phaseMap.length<weeks;i++) phaseMap.push(['base','build','peak','taper'][pi]); }); }
  else { [4,4,2,2].forEach((n,pi)=>{ for(let i=0;i<n&&phaseMap.length<weeks;i++) phaseMap.push(['base','build','peak','taper'][pi]); }); }
  const phaseInfo = {
    base:  { label:'Construction',  color:'#22c55e', bg:'rgba(34,197,94,0.12)'   },
    build: { label:'Progression',   color:'#f59e0b', bg:'rgba(245,158,11,0.12)'  },
    peak:  { label:'Pic de charge', color:'#ef4444', bg:'rgba(239,68,68,0.12)'   },
    taper: { label:'Affûtage',      color:'#a78bfa', bg:'rgba(167,139,250,0.12)' },
  };
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - startDate.getDay() + 1);
  const makeSession = (phase, idx, sessionIdx, km) => {
    const reps = Math.min(4 + idx, phase==='taper'?4:8);
    const isLast = sessionIdx === sessionsPerWeek - 1;
    const isFirst = sessionIdx === 0;
    if (phase === 'taper') {
      if (isFirst) return { type:'frac', tag:'Fractionné léger', tagColor:'#a78bfa', tagBg:'rgba(167,139,250,0.12)', title:'4 × 30 sec / 1:30', detail:'Juste pour garder la vivacité. Pas de fatigue.', allures:[{dot:'#ef4444',label:'Effort',val:paces.vma90},{dot:'#22c55e',label:'Récup',val:paces.recov}] };
      return { type:'ef', tag:'Décrassage', tagColor:'#22c55e', tagBg:'rgba(34,197,94,0.12)', title:'20–25 min léger', detail:'Arriver reposé le jour J.', allures:[{dot:'#22c55e',label:'Sortie',val:paces.recov}] };
    }
    if (phase === 'peak' && isLast) return { type:'key', tag:'Sortie clé ⭐', tagColor:'#FF0040', tagBg:'rgba(255,0,64,0.12)', title:`${Math.round(raceDistanceKm*0.85)} km — Répétition générale`, detail:`Simule le jour J. Même équipement${hasElevation?' et dénivelé':''}.`, allures:[{dot:'#22c55e',label:'Plat',val:paces.ef},{dot:'#a78bfa',label:'Montées',val:'marche active'}] };
    if (isLast) {
      const longKm = Math.round(km*(phase==='peak'?0.9:phase==='build'?0.8:0.65));
      return isTrail && hasElevation
        ? { type:'trail', tag:'Trail dénivelé', tagColor:'#f59e0b', tagBg:'rgba(245,158,11,0.12)', title:`${longKm} km D+${Math.round(elevationM*0.6)}m`, detail:'Marche active en montée, technique en descente.', allures:[{dot:'#22c55e',label:'Plat',val:paces.ef},{dot:'#a78bfa',label:'Montées',val:'marche active'}] }
        : { type:'long', tag:'Sortie longue', tagColor:'#f59e0b', tagBg:'rgba(245,158,11,0.12)', title:`${longKm} km`, detail:'Allure maîtrisée. Progression sur le dernier tiers.', allures:[{dot:'#22c55e',label:'Début 2/3',val:paces.ef},{dot:'#f59e0b',label:'Fin 1/3',val:paces.tempo}] };
    }
    if (isFirst) {
      if (phase === 'build') {
        const blocs = Math.min(3+Math.floor(idx/2),5);
        const dur = Math.min(8+idx,12);
        return { type:'frac', tag:'Fractionné long', tagColor:'#60a5fa', tagBg:'rgba(96,165,250,0.12)', title:`${blocs} × ${dur} min / ${Math.round(dur*0.4)} min`, detail:`Échauffement 15 min. ${blocs} blocs seuil. Récup trot.`, allures:[{dot:'#FF0040',label:`Effort (${dur} min)`,val:paces.threshold},{dot:'#22c55e',label:'Récup',val:paces.recov}] };
      }
      return { type:'frac', tag:'Fractionné court', tagColor:'#60a5fa', tagBg:'rgba(96,165,250,0.12)', title:`${reps} × 1 min / 1 min`, detail:`Échauffement 15 min. ${reps} répétitions vif/trot. Retour calme 10 min.`, allures:[{dot:'#ef4444',label:'Effort',val:paces.vma90},{dot:'#22c55e',label:'Récup',val:paces.recov}] };
    }
    const efKm = Math.round(km*0.55);
    return { type:'ef', tag:'Endurance fondamentale', tagColor:'#22c55e', tagBg:'rgba(34,197,94,0.12)', title:`${efKm} km EF`, detail:'Allure conversation. Terrain varié idéal.', allures:[{dot:'#22c55e',label:'Sortie entière',val:paces.ef}] };
  };
  return phaseMap.slice(0,weeks).map((phase,idx) => {
    const wStart = new Date(startDate); wStart.setDate(startDate.getDate()+idx*7);
    const wEnd = new Date(wStart); wEnd.setDate(wStart.getDate()+6);
    const fmt = d => d.toLocaleDateString('fr-FR',{day:'numeric',month:'short'});
    const km = Math.round(baseKm*mult*(1+idx*0.04));
    const eff = weeks<=2 ? Math.max(sessionsPerWeek,4) : sessionsPerWeek;
    const days = weeks<=2 && eff>trainingDays.length ? [...trainingDays,...DAYS_FR.filter(d=>!trainingDays.includes(d))].slice(0,eff) : trainingDays.slice(0,eff);
    const sessions = days.map((day,si) => ({...makeSession(phase,idx,si,km), id:`w${idx+1}_s${si}`, day}));
    const weeklyKm = sessions.reduce((a,s)=>{ const m=s.title.match(/(\d+)\s*km/); return a+(m?+m[1]:0); },0);
    return { week:idx+1, phase, ...phaseInfo[phase], dateRange:`${fmt(wStart)} – ${fmt(wEnd)}`, sessions, weeklyKm, isKey:phase==='peak' };
  });
}

function applyFeedback(plan, sessionId, feedback) {
  const effort = feedback.effort;
  const adjust = effort<=4?'up':effort>=8?'down':'ok';
  if (adjust==='ok') return plan;
  return plan.map(week => ({
    ...week,
    sessions: week.sessions.map(s => {
      if (s.id===sessionId || s.type!=='frac') return s;
      const match = s.title.match(/^(\d+)\s*×/);
      if (!match) return s;
      const cur = parseInt(match[1]);
      const newR = adjust==='up' ? Math.min(cur+2,12) : Math.max(cur-2,3);
      return { ...s, title:s.title.replace(/^\d+/,newR), detail:s.detail.replace(/\d+ répétitions/,`${newR} répétitions`), adjusted:adjust };
    })
  }));
}

const card = {background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:16,padding:'16px 18px'};
const navBtnS = {background:'var(--btn-ghost-bg)',border:'1px solid var(--btn-ghost-border)',borderRadius:12,padding:'8px 12px',color:'var(--btn-ghost-color)',cursor:'pointer',fontFamily:'inherit',fontSize:16};
const lbl = {fontSize:12,color:'var(--text-secondary)',display:'block',marginBottom:8};
const inp = () => ({background:'var(--bg-input)',border:'1px solid var(--border-input)',color:'var(--text-primary)',borderRadius:12,padding:'12px 14px',width:'100%',fontSize:14,fontFamily:'inherit',outline:'none'});
const tog = (a) => ({background:a?'rgba(255,0,64,0.15)':'var(--btn-ghost-bg)',border:`1px solid ${a?'rgba(255,0,64,0.5)':'var(--btn-ghost-border)'}`,color:a?'#FF0040':'var(--btn-ghost-color)',borderRadius:12,padding:'10px 12px',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit',transition:'all 0.2s'});

const SessionIcons = {
  frac: () => (<svg width="36" height="36" viewBox="0 0 36 36" fill="none"><circle cx="18" cy="18" r="18" fill="rgba(255,0,64,0.12)"/><path d="M12 24 L18 10 L24 24" stroke="#FF0040" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 20 L22 20" stroke="#FF0040" strokeWidth="1.5" strokeLinecap="round"/><circle cx="18" cy="10" r="2" fill="#FF0040"/></svg>),
  ef: () => (<svg width="36" height="36" viewBox="0 0 36 36" fill="none"><circle cx="18" cy="18" r="18" fill="rgba(34,197,94,0.12)"/><path d="M10 20 Q14 14 18 18 Q22 22 26 16" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" fill="none"/><circle cx="10" cy="20" r="1.5" fill="#22c55e"/><circle cx="26" cy="16" r="1.5" fill="#22c55e"/></svg>),
  long: () => (<svg width="36" height="36" viewBox="0 0 36 36" fill="none"><circle cx="18" cy="18" r="18" fill="rgba(245,158,11,0.12)"/><path d="M10 22 L14 16 L18 19 L22 13 L26 17" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/><circle cx="26" cy="17" r="2" fill="#f59e0b"/></svg>),
  trail: () => (<svg width="36" height="36" viewBox="0 0 36 36" fill="none"><circle cx="18" cy="18" r="18" fill="rgba(245,158,11,0.12)"/><path d="M9 25 L18 11 L27 25" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/><path d="M13 25 L18 17 L23 25" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.4"/><circle cx="18" cy="11" r="2" fill="#f59e0b"/></svg>),
  key: () => (<svg width="36" height="36" viewBox="0 0 36 36" fill="none"><circle cx="18" cy="18" r="18" fill="rgba(255,0,64,0.12)"/><path d="M18 10 L20 16 L26 16 L21.5 20 L23.5 26 L18 22.5 L12.5 26 L14.5 20 L10 16 L16 16 Z" stroke="#FF0040" strokeWidth="1.5" strokeLinejoin="round" fill="rgba(255,0,64,0.15)"/></svg>),
  taper: () => (<svg width="36" height="36" viewBox="0 0 36 36" fill="none"><circle cx="18" cy="18" r="18" fill="rgba(167,139,250,0.12)"/><path d="M12 14 Q18 10 24 14 Q28 18 24 22 Q18 26 12 22 Q8 18 12 14Z" stroke="#a78bfa" strokeWidth="1.5" fill="none"/><path d="M15 18 L17 20 L21 16" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>),
};

function AllureChip({ dot, label, val }) {
  return (
    <div style={{display:'inline-flex',alignItems:'center',gap:6,background:'var(--chip-bg)',border:'1px solid var(--chip-border)',borderRadius:99,padding:'3px 10px',fontFamily:'monospace',fontSize:11}}>
      <span style={{width:7,height:7,borderRadius:'50%',background:dot,flexShrink:0,display:'inline-block'}}/>
      <span style={{color:'var(--text-muted)'}}>{label}</span>
      <span style={{color:'var(--text-primary)',fontWeight:500}}>{val}</span>
    </div>
  );
}

function SessionCard({ session, onComplete }) {
  const IconComp = SessionIcons[session.type] || SessionIcons.ef;
  return (
    <div style={{background:session.completed?'rgba(34,197,94,0.06)':'var(--session-bg)',border:`1px solid ${session.completed?'rgba(34,197,94,0.3)':'var(--session-border)'}`,borderRadius:16,padding:20,transition:'all 0.25s'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}>
        <div>
          <div style={{fontSize:10,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.12em',marginBottom:6,fontFamily:'monospace'}}>{session.day}</div>
          <span style={{display:'inline-block',fontSize:10,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',padding:'2px 9px',borderRadius:99,background:session.tagBg,color:session.tagColor,border:`1px solid ${session.tagColor}40`}}>{session.tag}</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <IconComp/>
          {session.completed && <div style={{width:24,height:24,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(34,197,94,0.15)',fontSize:12}}>✓</div>}
        </div>
      </div>
      <div style={{fontSize:18,fontWeight:700,letterSpacing:'-0.02em',marginBottom:6,color:'var(--text-primary)'}}>{session.title}</div>
      <p style={{fontSize:12,color:'var(--text-secondary)',lineHeight:1.6,marginBottom:14}}>{session.detail}</p>
      <div style={{display:'flex',flexDirection:'column',gap:5,marginBottom:16}}>
        {session.allures.map((a,i) => <AllureChip key={i} {...a}/>)}
      </div>
      {!session.completed && onComplete && (
        <button onClick={()=>onComplete(session.id)} style={{width:'100%',background:'var(--btn-ghost-bg)',border:'1px solid var(--btn-ghost-border)',borderRadius:12,padding:'8px 16px',color:'var(--btn-ghost-color)',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
          Marquer comme terminé
        </button>
      )}
      {session.completed && onComplete && (
        <button onClick={()=>onComplete(session.id, true)} style={{width:'100%',background:'rgba(239,68,68,0.06)',border:'1px solid rgba(239,68,68,0.18)',borderRadius:12,padding:'8px 16px',color:'rgba(239,68,68,0.7)',fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:'inherit',marginTop:8}}>
          ↩ Annuler la validation
        </button>
      )}
    </div>
  );
}

function FeedbackModal({ session, onClose, onSubmit }) {
  const [effort, setEffort] = useState(5);
  const [realPace, setRealPace] = useState('');
  const [sensation, setSensation] = useState('');
  const effortColors = ['','#22c55e','#22c55e','#22c55e','#4ade80','#f59e0b','#f59e0b','#f59e0b','#FF0040','#FF0040','#FF0040'];
  const effortLabels = ['','Très facile','Facile','Facile','Plutôt facile','Modéré','Modéré','Modéré','Difficile','Très difficile','Extrême'];
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{width:'100%',maxWidth:420,background:'var(--bg-modal)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:20,padding:'28px 24px'}}>
        <div style={{fontSize:10,color:'var(--text-muted)',fontFamily:'monospace',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:6}}>Feedback séance</div>
        <div style={{fontSize:16,fontWeight:700,marginBottom:20,color:'var(--text-primary)'}}>{session.title}</div>
        <div style={{marginBottom:20}}>
          <label style={{...lbl,marginBottom:12}}>Effort ressenti</label>
          <div style={{display:'flex',gap:4,marginBottom:8}}>
            {[1,2,3,4,5,6,7,8,9,10].map(n => (
              <button key={n} onClick={()=>setEffort(n)} style={{flex:1,height:32,borderRadius:6,border:'none',cursor:'pointer',fontWeight:700,fontSize:11,fontFamily:'monospace',background:n<=effort?effortColors[effort]:'var(--btn-ghost-bg)',color:n<=effort?'#000':'var(--text-muted)',transition:'all 0.15s'}}>{n}</button>
            ))}
          </div>
          <div style={{fontSize:12,color:effortColors[effort],fontWeight:600,textAlign:'center'}}>{effortLabels[effort]}</div>
        </div>
        <div style={{marginBottom:20}}>
          <label style={lbl}>Allure réelle (min:sec/km)</label>
          <input style={inp()} placeholder="Ex: 5:30" value={realPace} onChange={e=>setRealPace(e.target.value)}/>
          <div style={{fontSize:11,color:'var(--text-muted)',marginTop:4}}>Laisse vide si tu n'as pas chronométré</div>
        </div>
        <div style={{marginBottom:20}}>
          <label style={{...lbl,marginBottom:10}}>Sensations physiques</label>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
            {['😴 Jambes lourdes','💨 Souffle court','💪 Jambes légères','🎯 Tout parfait','🤕 Douleur','⚡ Plein d\'énergie'].map(s => (
              <button key={s} onClick={()=>setSensation(s)} style={{...tog(sensation===s),fontSize:11,padding:'8px 10px',textAlign:'left'}}>{s}</button>
            ))}
          </div>
        </div>
        {(effort<=4||effort>=8) && (
          <div style={{background:effort<=4?'rgba(34,197,94,0.08)':'rgba(255,0,64,0.08)',border:`1px solid ${effort<=4?'rgba(34,197,94,0.2)':'rgba(255,0,64,0.2)'}`,borderRadius:10,padding:'10px 14px',marginBottom:16,fontSize:12}}>
            <span style={{color:effort<=4?'#22c55e':'#FF0040',fontWeight:600}}>{effort<=4?'💪 Plan intensifié':'🛡️ Plan allégé'}</span>
            <span style={{color:'var(--text-secondary)',marginLeft:6}}>{effort<=4?'Les prochains fractionnés gagnent 2 répétitions':'Les prochains fractionnés perdent 2 répétitions'}</span>
          </div>
        )}
        <div style={{display:'flex',gap:10}}>
          <button onClick={onClose} style={{...navBtnS,flex:1,fontSize:13}}>Annuler</button>
          <button onClick={()=>onSubmit({effort,realPace,sensation})} style={{flex:2,background:'#FF0040',color:'#000',border:'none',borderRadius:12,padding:'12px',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>Valider le feedback</button>
        </div>
      </div>
    </div>
  );
}

function KpiCharts({ plan, feedbacks, completed }) {
  const weeks = plan.map(w => {
    const ids = w.sessions.map(s=>s.id);
    const done = ids.filter(id=>completed[id]).length;
    const fbs = ids.map(id=>feedbacks[id]).filter(Boolean);
    const avgEffort = fbs.length ? Math.round(fbs.reduce((a,f)=>a+f.effort,0)/fbs.length) : null;
    return { week:w.week, km:w.weeklyKm, done, total:w.sessions.length, avgEffort };
  });
  const maxKm = Math.max(...weeks.map(w=>w.km),1);
  const W=280, H=80;
  const totalDone = Object.values(completed).filter(Boolean).length;
  const totalAll = plan.reduce((a,w)=>a+w.sessions.length,0);
  const allFbs = Object.values(feedbacks);
  const avgEff = allFbs.length ? (allFbs.reduce((a,f)=>a+f.effort,0)/allFbs.length).toFixed(1) : '—';
  return (
    <div style={{...card,marginBottom:20}}>
      <div style={{fontSize:11,color:'var(--text-muted)',fontFamily:'monospace',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:16}}>KPI — Suivi de charge</div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:20}}>
        <div>
          <div style={{fontSize:10,color:'var(--text-muted)',fontFamily:'monospace',marginBottom:4}}>COMPLETION</div>
          <div style={{fontSize:22,fontWeight:800,color:'#22c55e',fontFamily:'monospace'}}>{Math.round((totalDone/totalAll)*100)}%</div>
        </div>
        <div>
          <div style={{fontSize:10,color:'var(--text-muted)',fontFamily:'monospace',marginBottom:4}}>SÉANCES OK</div>
          <div style={{fontSize:22,fontWeight:800,fontFamily:'monospace',color:'var(--text-primary)'}}>{totalDone}<span style={{fontSize:12,color:'var(--text-muted)'}}>/{totalAll}</span></div>
        </div>
        <div>
          <div style={{fontSize:10,color:'var(--text-muted)',fontFamily:'monospace',marginBottom:4}}>EFFORT MOY.</div>
          <div style={{fontSize:22,fontWeight:800,fontFamily:'monospace',color:'#f59e0b'}}>{avgEff}<span style={{fontSize:12,color:'var(--text-muted)'}}>/10</span></div>
        </div>
      </div>
      <div style={{fontSize:10,color:'var(--text-muted)',fontFamily:'monospace',marginBottom:8}}>CHARGE HEBDOMADAIRE (km)</div>
      <svg width="100%" viewBox={`0 0 ${W} ${H+20}`} style={{overflow:'visible'}}>
        {weeks.map((w,i) => {
          const x = (i/(weeks.length-1||1))*(W-20)+10;
          const barH = (w.km/maxKm)*(H-10);
          const y = H - barH;
          const effortColor = w.avgEffort ? (w.avgEffort<=4?'#22c55e':w.avgEffort>=8?'#FF0040':'#f59e0b') : 'var(--progress-track)';
          return (
            <g key={i}>
              <rect x={x-8} y={y} width={16} height={barH} rx={3} fill={w.done===w.total&&w.total>0?effortColor:'var(--progress-track)'}/>
              <text x={x} y={H+14} textAnchor="middle" fill="var(--svg-text)" fontSize={8} fontFamily="monospace">S{w.week}</text>
              {w.km>0 && <text x={x} y={y-4} textAnchor="middle" fill="var(--svg-text-val)" fontSize={8} fontFamily="monospace">{w.km}</text>}
            </g>
          );
        })}
      </svg>
      {allFbs.length>0 && (
        <div>
          <div style={{fontSize:10,color:'var(--text-muted)',fontFamily:'monospace',marginTop:12,marginBottom:8}}>COURBE D'EFFORT RESSENTI</div>
          <svg width="100%" viewBox={`0 0 ${W} 50`}>
            {weeks.filter(w=>w.avgEffort).map((w,i,arr) => {
              const x = (i/(arr.length-1||1))*(W-20)+10;
              const y = 45-(w.avgEffort/10)*40;
              const next = arr[i+1];
              const nx = next?(i+1)/(arr.length-1||1)*(W-20)+10:null;
              const ny = next?45-(next.avgEffort/10)*40:null;
              return (
                <g key={i}>
                  {nx && <line x1={x} y1={y} x2={nx} y2={ny} stroke="rgba(255,0,64,0.4)" strokeWidth={1.5}/>}
                  <circle cx={x} cy={y} r={3} fill="#FF0040"/>
                  <text x={x} y={y-6} textAnchor="middle" fill="var(--svg-text-val)" fontSize={8} fontFamily="monospace">{w.avgEffort}</text>
                </g>
              );
            })}
          </svg>
        </div>
      )}
    </div>
  );
}

function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name:'', type:'trail', level:'intermediate', vmaMode:'direct', vma:'14', raceDistKm:'10', raceTimeMins:'', raceDistanceKm:'15', elevationM:'150', sessionsPerWeek:2, trainingDays:[], weeks:8, raceName:'', raceDate:'' });
  const upd = (k,v) => setForm(f=>({...f,[k]:v}));
  const computedVma = form.vmaMode==='direct' ? +form.vma : (form.raceTimeMins?estimateVMA(+form.raceDistKm,+form.raceTimeMins):0);
  const toggleDay = (day) => {
    if (form.trainingDays.includes(day)) { upd('trainingDays',form.trainingDays.filter(d=>d!==day)); }
    else if (form.trainingDays.length < form.sessionsPerWeek) { upd('trainingDays',[...form.trainingDays,day]); }
  };
  const steps = [
    { title:'Qui es-tu ?', sub:'Ton profil de coureur', ok:form.name.length>0, body:(
      <div style={{display:'flex',flexDirection:'column',gap:16}}>
        <div><label style={lbl}>Ton prénom</label><input style={inp()} placeholder="Alex" value={form.name} onChange={e=>upd('name',e.target.value)}/></div>
        <div><label style={lbl}>Type de course</label><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>{[['trail','🏔️ Trail'],['road','🏙️ Route']].map(([v,l])=><button key={v} onClick={()=>upd('type',v)} style={tog(form.type===v)}>{l}</button>)}</div></div>
        <div><label style={lbl}>Niveau</label><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>{[['beginner','🌱 Débutant'],['intermediate','🏃 Intermédiaire'],['advanced','⚡ Avancé'],['expert','🔥 Expert']].map(([v,l])=><button key={v} onClick={()=>upd('level',v)} style={tog(form.level===v)}>{l}</button>)}</div></div>
      </div>
    )},
    { title:'Ta condition physique', sub:'On calcule tes allures personnalisées', ok:computedVma>0, body:(
      <div style={{display:'flex',flexDirection:'column',gap:16}}>
        <div><label style={lbl}>Comment saisir ta VMA ?</label><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>{[['direct','Je connais ma VMA'],['race','Depuis un chrono récent']].map(([v,l])=><button key={v} onClick={()=>upd('vmaMode',v)} style={tog(form.vmaMode===v)}>{l}</button>)}</div></div>
        {form.vmaMode==='direct' ? (
          <div><label style={lbl}>VMA (km/h)</label><input type="number" style={inp()} min="8" max="25" step="0.5" value={form.vma} onChange={e=>upd('vma',e.target.value)}/><p style={{fontSize:11,color:'var(--text-muted)',marginTop:6}}>Moyenne loisir : 12–15 km/h</p></div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <div><label style={lbl}>Distance récente</label><select style={inp()} value={form.raceDistKm} onChange={e=>upd('raceDistKm',e.target.value)}>{[[1,'1 km'],[3,'3 km'],[5,'5 km'],[10,'10 km'],[15,'15 km'],[21.1,'Semi-marathon'],[42.2,'Marathon']].map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></div>
            <div><label style={lbl}>Chrono (en minutes)</label><input type="number" style={inp()} placeholder="ex: 55" value={form.raceTimeMins} onChange={e=>upd('raceTimeMins',e.target.value)}/></div>
            {computedVma>0 && <div style={{background:'rgba(255,0,64,0.08)',border:'1px solid rgba(255,0,64,0.2)',borderRadius:12,padding:'10px 14px',fontSize:12,color:'var(--text-secondary)'}}>VMA estimée : <span style={{color:'#FF0040',fontWeight:700,fontFamily:'monospace'}}>{computedVma.toFixed(1)} km/h</span></div>}
          </div>
        )}
      </div>
    )},
    { title:'Ta course cible', sub:'Dis-nous tout sur ton objectif', ok:form.raceName.length>0, body:(
      <div style={{display:'flex',flexDirection:'column',gap:16}}>
        <div><label style={lbl}>Nom de la course</label><input style={inp()} placeholder="Trail de la Fraise" value={form.raceName} onChange={e=>upd('raceName',e.target.value)}/></div>
        <div><label style={lbl}>Date de la course</label><input type="date" style={inp()} value={form.raceDate} onChange={e=>upd('raceDate',e.target.value)}/></div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <div><label style={lbl}>Distance (km)</label><input type="number" style={inp()} min="1" max="200" step="0.5" value={form.raceDistanceKm} onChange={e=>upd('raceDistanceKm',e.target.value)}/></div>
          <div><label style={lbl}>Dénivelé + (m)</label><input type="number" style={inp()} min="0" max="5000" step="50" value={form.elevationM} onChange={e=>upd('elevationM',e.target.value)} placeholder="0 si plat"/></div>
        </div>
      </div>
    )},
    { title:'Ton planning', sub:'Organisation de tes entraînements', ok:form.trainingDays.length===form.sessionsPerWeek, body:(
      <div style={{display:'flex',flexDirection:'column',gap:16}}>
        <div><label style={lbl}>Durée du programme</label><div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>{[[2,'2 sem.'],[4,'4 sem.'],[8,'8 sem.'],[12,'12 sem.']].map(([v,l])=><button key={v} onClick={()=>upd('weeks',v)} style={tog(form.weeks===v)}>{l}</button>)}</div></div>
        <div><label style={lbl}>Séances par semaine</label><div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>{[2,3,4,5].map(n=><button key={n} onClick={()=>{upd('sessionsPerWeek',n);upd('trainingDays',[]);}} style={tog(form.sessionsPerWeek===n)}>{n}×</button>)}</div></div>
        <div>
          <label style={lbl}>Choisis tes {form.sessionsPerWeek} jours ({form.trainingDays.length}/{form.sessionsPerWeek} sélectionnés)</label>
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8}}>
            {DAYS_FR.map(day => { const sel=form.trainingDays.includes(day); const dis=!sel&&form.trainingDays.length>=form.sessionsPerWeek; return <button key={day} onClick={()=>!dis&&toggleDay(day)} style={{...tog(sel),opacity:dis?0.35:1,cursor:dis?'not-allowed':'pointer'}}>{day}</button>; })}
          </div>
        </div>
      </div>
    )},
  ];
  const handleFinish = () => {
    const finalVma = form.vmaMode==='direct'?+form.vma:estimateVMA(+form.raceDistKm,+form.raceTimeMins);
    onComplete({...form,vma:finalVma,weeks:+form.weeks,raceDistanceKm:+form.raceDistanceKm,elevationM:+form.elevationM});
  };
  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:'24px 16px',background:'var(--onboarding-bg)'}}>
      <div style={{width:'100%',maxWidth:460,background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:24,padding:'36px 32px'}}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:32}}>
          <img src="/logo.png" alt="PacePro" style={{width:36,height:36,objectFit:'contain'}}/>
          <span style={{fontWeight:700,fontSize:18,letterSpacing:'-0.02em',color:'var(--text-primary)'}}>PacePro</span>
        </div>
        <div style={{display:'flex',gap:6,marginBottom:28,alignItems:'center'}}>
          {steps.map((_,i)=><div key={i} style={{width:i===step?20:8,height:8,borderRadius:99,background:i===step?'#FF0040':i<step?'#22c55e':'var(--progress-track)',transition:'all 0.3s'}}/>)}
          <span style={{fontSize:11,color:'var(--text-muted)',fontFamily:'monospace',marginLeft:8}}>{step+1}/{steps.length}</span>
        </div>
        <h2 style={{fontSize:22,fontWeight:800,letterSpacing:'-0.03em',marginBottom:4,color:'var(--text-primary)'}}>{steps[step].title}</h2>
        <p style={{fontSize:13,color:'var(--text-secondary)',marginBottom:24}}>{steps[step].sub}</p>
        {steps[step].body}
        <div style={{display:'flex',gap:10,marginTop:28}}>
          {step>0 && <button onClick={()=>setStep(s=>s-1)} style={{background:'var(--btn-ghost-bg)',border:'1px solid var(--btn-ghost-border)',borderRadius:12,padding:'12px 16px',color:'var(--btn-ghost-color)',cursor:'pointer',fontFamily:'inherit'}}>←</button>}
          <button onClick={step<steps.length-1?()=>setStep(s=>s+1):handleFinish} disabled={!steps[step].ok} style={{flex:1,background:'#FF0040',color:'#000',border:'none',borderRadius:12,padding:'12px 20px',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'inherit',opacity:steps[step].ok?1:0.4,transition:'all 0.2s'}}>
            {step<steps.length-1?'Continuer →':'🚀 Générer mon programme'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ profile, plan:initialPlan, onReset, onSave, initialCompleted={}, initialFeedbacks={} }) {
  const [plan, setPlan] = useState(initialPlan);
  const [activeWeek, setActiveWeek] = useState(0);
  const [activeTab, setActiveTab] = useState('plan');
  const [completed, setCompleted] = useState(initialCompleted);
  const [feedbacks, setFeedbacks] = useState(initialFeedbacks);
  const [feedbackSession, setFeedbackSession] = useState(null);
  const paces = calcPaces(profile.vma);
  const totalSessions = plan.reduce((a,w)=>a+w.sessions.length,0);
  const doneCount = Object.values(completed).filter(Boolean).length;
  const progress = Math.round((doneCount/totalSessions)*100);
  const week = plan[activeWeek];
  const nextSession = plan.flatMap(w=>w.sessions.map(s=>({...s,week:w.week}))).find(s=>!completed[s.id]);
  const handleComplete = (id, undo = false) => {
    if (undo) {
      const newCompleted = {...completed, [id]: false};
      const newFeedbacks = {...feedbacks};
      delete newFeedbacks[id];
      setCompleted(newCompleted);
      setFeedbacks(newFeedbacks);
      const newPlan = applyFeedback(initialPlan, id, {effort: 5});
      setPlan(newPlan);
      onSave && onSave(newPlan, newCompleted, newFeedbacks);
    } else if (!completed[id]) {
      const newCompleted = {...completed, [id]: true};
      setCompleted(newCompleted);
      const s = plan.flatMap(w => w.sessions).find(s => s.id === id);
      setFeedbackSession(s);
      onSave && onSave(plan, newCompleted, feedbacks);
    }
  };
  const handleFeedback = (fb) => {
    const newFeedbacks = {...feedbacks, [feedbackSession.id]: fb};
    const newPlan = applyFeedback(plan, feedbackSession.id, fb);
    setFeedbacks(newFeedbacks);
    setPlan(newPlan);
    setFeedbackSession(null);
    onSave && onSave(newPlan, completed, newFeedbacks);
  };
  const tabBtn = (v,l) => (
    <button onClick={()=>setActiveTab(v)} style={{borderRadius:12,padding:'7px 16px',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit',transition:'all 0.2s',background:activeTab===v?'rgba(255,0,64,0.15)':'var(--btn-ghost-bg)',border:`1px solid ${activeTab===v?'rgba(255,0,64,0.4)':'var(--btn-ghost-border)'}`,color:activeTab===v?'#FF0040':'var(--btn-ghost-color)'}}>{l}</button>
  );
  return (
    <div style={{minHeight:'100vh',background:'var(--bg-primary)',color:'var(--text-primary)',fontFamily:'Syne,sans-serif'}}>
      {feedbackSession && <FeedbackModal session={feedbackSession} onClose={()=>setFeedbackSession(null)} onSubmit={handleFeedback}/>}
      <nav style={{position:'sticky',top:0,zIndex:50,background:'var(--bg-nav)',backdropFilter:'blur(20px)',borderBottom:'1px solid var(--border-nav)',padding:'0 20px',height:56,paddingBottom:'env(safe-area-inset-bottom)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <img src="/logo.png" alt="PacePro" style={{width:32,height:32,objectFit:'contain'}}/>
          <span style={{fontWeight:700,fontSize:16,letterSpacing:'-0.02em'}}>PacePro</span>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <span style={{fontSize:13,color:'var(--text-secondary)'}}>{profile.name}</span>
          <button onClick={onReset} style={{background:'var(--btn-ghost-bg)',border:'1px solid var(--btn-ghost-border)',borderRadius:8,padding:'4px 10px',color:'var(--btn-ghost-color)',fontSize:12,cursor:'pointer',fontFamily:'inherit'}}>Nouveau plan</button>
        </div>
      </nav>
      <main style={{maxWidth:1000,margin:'0 auto',padding:'28px 20px 60px'}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:12,marginBottom:20}}>
          <div style={{...card,gridColumn:'span 2'}}>
            <div style={{fontSize:10,color:'var(--text-muted)',fontFamily:'monospace',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:10}}>Progression</div>
            <div style={{fontSize:15,fontWeight:700,marginBottom:8,color:'var(--text-primary)'}}>{profile.raceName} · {profile.raceDistanceKm} km{profile.elevationM>0?` D+${profile.elevationM}m`:''}</div>
            <div style={{height:3,background:'var(--progress-track)',borderRadius:99}}>
              <div style={{height:'100%',borderRadius:99,background:'linear-gradient(90deg,#FF0040,#fbbf24)',width:`${progress}%`,transition:'width 0.6s'}}/>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',marginTop:6,fontSize:11,color:'var(--text-muted)',fontFamily:'monospace'}}>
              <span>{doneCount}/{totalSessions} séances</span><span>{progress}%</span>
            </div>
          </div>
          <div style={card}>
            <div style={{fontSize:10,color:'var(--text-muted)',fontFamily:'monospace',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:4}}>VMA</div>
            <div style={{fontSize:28,fontWeight:800,color:'#FF0040',fontFamily:'monospace'}}>{profile.vma.toFixed(1)}</div>
            <div style={{fontSize:11,color:'var(--text-muted)'}}>km/h</div>
          </div>
          <div style={card}>
            <div style={{fontSize:10,color:'var(--text-muted)',fontFamily:'monospace',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:4}}>Séances/sem.</div>
            <div style={{fontSize:20,fontWeight:800,fontFamily:'monospace'}}>{profile.sessionsPerWeek}×</div>
            <div style={{fontSize:10,color:'var(--text-muted)',marginTop:2,lineHeight:1.4}}>{profile.trainingDays.join(', ')}</div>
          </div>
        </div>
        <div style={{...card,marginBottom:20}}>
          <div style={{fontSize:11,color:'var(--text-muted)',fontFamily:'monospace',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12}}>Tes allures personnalisées</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
            {[['EF',paces.ef,'#22c55e'],['Tempo',paces.tempo,'#f59e0b'],['Seuil',paces.threshold,'#FF0040'],['VMA 90%',paces.vma90,'#ef4444'],['Récup',paces.recov,'var(--text-muted)']].map(([l,v,c])=>(
              <AllureChip key={l} dot={c} label={l} val={v+' /km'}/>
            ))}
          </div>
        </div>
        {nextSession && (
          <div style={{background:'var(--next-session-bg)',border:'1px solid var(--next-session-border)',borderRadius:14,padding:'14px 18px',marginBottom:20}}>
            <div style={{fontSize:10,color:'#FF0040',textTransform:'uppercase',letterSpacing:'0.12em',fontFamily:'monospace',marginBottom:4}}>Prochaine séance — Semaine {nextSession.week} · {nextSession.day}</div>
            <div style={{fontSize:15,fontWeight:700,color:'var(--text-primary)'}}>{nextSession.title}</div>
            <div style={{fontSize:12,color:'var(--text-secondary)',marginTop:2}}>{nextSession.detail}</div>
          </div>
        )}
        <div style={{display:'flex',gap:8,marginBottom:20}}>
          {tabBtn('plan','📋 Programme')}
          {tabBtn('kpi','📊 KPI')}
        </div>
        {activeTab==='kpi' ? (
          <KpiCharts plan={plan} feedbacks={feedbacks} completed={completed}/>
        ) : (
          <div>
            <div style={{display:'flex',gap:6,overflowX:'auto',paddingBottom:4,marginBottom:18}}>
              {plan.map((w,i)=>(
                <button key={i} onClick={()=>setActiveWeek(i)} style={{flexShrink:0,borderRadius:12,padding:'6px 14px',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit',transition:'all 0.2s',background:activeWeek===i?'rgba(255,0,64,0.15)':'var(--week-tabs-inactive)',border:`1px solid ${activeWeek===i?'rgba(255,0,64,0.4)':'var(--week-tabs-border)'}`,color:activeWeek===i?'#FF0040':'var(--week-tabs-color)'}}>
                  S{w.week}{w.isKey?' ★':''}
                </button>
              ))}
            </div>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
              <button onClick={()=>setActiveWeek(w=>Math.max(0,w-1))} style={navBtnS}>←</button>
              <div style={{flex:1}}>
                <div style={{fontSize:10,color:'var(--text-ultra-muted)',fontFamily:'monospace',letterSpacing:'0.1em'}}>{week.dateRange}</div>
                <div style={{display:'flex',alignItems:'center',gap:8,marginTop:4,flexWrap:'wrap'}}>
                  <span style={{fontSize:17,fontWeight:700,letterSpacing:'-0.02em',color:'var(--text-primary)'}}>Semaine {week.week}</span>
                  <span style={{fontSize:10,fontWeight:700,padding:'2px 9px',borderRadius:99,textTransform:'uppercase',letterSpacing:'0.08em',background:week.bg,color:week.color,border:`1px solid ${week.color}40`}}>{week.label}</span>
                  {week.weeklyKm>0 && <span style={{fontSize:10,color:'var(--text-ultra-muted)',fontFamily:'monospace'}}>{week.weeklyKm} km est.</span>}
                </div>
              </div>
              <button onClick={()=>setActiveWeek(w=>Math.min(plan.length-1,w+1))} style={navBtnS}>→</button>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:12}}>
              {week.sessions.map(s => {
                const fb = feedbacks[s.id];
                return (
                  <div key={s.id}>
                    <SessionCard session={{...s,completed:!!completed[s.id]}} onComplete={handleComplete}/>
                    {fb && (
                      <div style={{marginTop:6,background:'var(--btn-ghost-bg)',border:'1px solid var(--border)',borderRadius:10,padding:'8px 12px',fontSize:11,color:'var(--text-secondary)',display:'flex',gap:10,flexWrap:'wrap'}}>
                        <span>Effort : <span style={{color:'#f59e0b',fontWeight:600}}>{fb.effort}/10</span></span>
                        {fb.realPace && <span>Allure : <span style={{color:'var(--text-primary)',fontFamily:'monospace'}}>{fb.realPace}/km</span></span>}
                        {fb.sensation && <span>{fb.sensation}</span>}
                        {s.adjusted && <span style={{color:s.adjusted==='up'?'#22c55e':'#FF0040',fontWeight:600}}>{s.adjusted==='up'?'↑ Intensifié':'↓ Allégé'}</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {activeWeek===plan.length-1 && profile.raceName && (
              <div style={{marginTop:16,background:'rgba(245,158,11,0.07)',border:'1px solid rgba(245,158,11,0.25)',borderRadius:14,padding:'20px 24px'}}>
                <div style={{fontSize:10,color:'rgba(245,158,11,0.7)',fontFamily:'monospace',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:6}}>
                  {profile.raceDate?new Date(profile.raceDate).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'}):'Jour J'}
                </div>
                <div style={{fontSize:16,fontWeight:700,marginBottom:4,color:'var(--text-primary)'}}>{profile.raceName} 🎯</div>
                <div style={{fontSize:12,color:'var(--text-secondary)'}}>
                  {profile.raceDistanceKm} km{profile.elevationM>0?` · D+${profile.elevationM}m`:''} · Allure cible : <span style={{color:'var(--text-primary)',fontFamily:'monospace'}}>{paces.ef} /km</span>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function PlansList({ plans, onSelect, onNew, onDelete }) {
  return (
    <div style={{minHeight:'100vh',background:'var(--bg-primary)',color:'var(--text-primary)',fontFamily:'Syne,sans-serif'}}>
      <nav style={{position:'sticky',top:0,zIndex:50,background:'var(--bg-nav)',backdropFilter:'blur(20px)',borderBottom:'1px solid var(--border-nav)',padding:'0 20px',height:56,paddingBottom:'env(safe-area-inset-bottom)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <img src="/logo.png" alt="PacePro" style={{width:32,height:32,objectFit:'contain'}}/>
          <span style={{fontWeight:700,fontSize:16,letterSpacing:'-0.02em'}}>PacePro</span>
        </div>
        <button onClick={onNew} style={{background:'#FF0040',color:'#000',border:'none',borderRadius:10,padding:'6px 14px',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>+ Nouveau plan</button>
      </nav>
      <main style={{maxWidth:700,margin:'0 auto',padding:'32px 20px'}}>
        <h1 style={{fontSize:24,fontWeight:800,letterSpacing:'-0.03em',marginBottom:6,color:'var(--text-primary)'}}>Mes plans d'entraînement</h1>
        <p style={{fontSize:13,color:'var(--text-secondary)',marginBottom:28}}>{plans.length} plan{plans.length>1?'s':''} sauvegardé{plans.length>1?'s':''}</p>
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {plans.map((p,i) => (
            <div key={i} style={{...card,cursor:'pointer',transition:'all 0.2s'}} onClick={()=>onSelect(i)}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:16,fontWeight:700,marginBottom:4,color:'var(--text-primary)'}}>{p.profile.raceName||'Mon programme'}</div>
                  <div style={{fontSize:12,color:'var(--text-secondary)',lineHeight:1.6}}>{p.profile.raceDistanceKm} km{p.profile.elevationM>0?` · D+${p.profile.elevationM}m`:''} · {p.profile.weeks} semaines · {p.profile.sessionsPerWeek}×/sem.</div>
                  <div style={{fontSize:11,color:'var(--text-muted)',fontFamily:'monospace',marginTop:4}}>VMA {p.profile.vma.toFixed(1)} km/h · {p.profile.type==='trail'?'🏔️ Trail':'🏙️ Route'}{p.profile.raceDate&&` · ${new Date(p.profile.raceDate).toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'})}`}</div>
                  <div style={{fontSize:10,color:'var(--text-ultra-muted)',marginTop:4}}>{p.profile.trainingDays?.join(', ')}</div>
                </div>
                <div style={{display:'flex',gap:8,alignItems:'center',marginLeft:12,flexShrink:0}}>
                  <span style={{fontSize:18,fontWeight:800,color:'#FF0040'}}>→</span>
                  <button onClick={e=>{e.stopPropagation();onDelete(i);}} style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:8,padding:'4px 8px',color:'rgba(239,68,68,0.6)',fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>Supprimer</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}


function ProfileSheet({ user, onClose, onLogout }) {
  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:200, backdropFilter:'blur(4px)' }} />
      <div style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:201, background:'var(--bg-card)', borderRadius:'20px 20px 0 0', padding:'12px 20px 40px', fontFamily:'Syne, sans-serif' }}>
        {/* Handle */}
        <div style={{ width:36, height:4, background:'var(--border)', borderRadius:4, margin:'0 auto 20px' }} />

        {/* User info */}
        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:24, padding:'16px', background:'var(--bg-input)', borderRadius:16 }}>
          {user?.photo
            ? <img src={user.photo} alt="" style={{ width:52, height:52, borderRadius:'50%', objectFit:'cover', border:'2px solid rgba(219,59,61,0.3)' }} />
            : <div style={{ width:52, height:52, borderRadius:'50%', background:'rgba(219,59,61,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>👤</div>
          }
          <div>
            <div style={{ fontSize:16, fontWeight:700, color:'var(--text-primary)', marginBottom:2 }}>{user?.name || 'Athlete'}</div>
            <div style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'DM Mono, monospace' }}>
              {user?.strava ? '🟠 Connecté via Strava' : user?.email || 'PacePro'}
            </div>
          </div>
        </div>

        {/* Menu items */}
        <div style={{ display:'flex', flexDirection:'column', gap:2, marginBottom:16 }}>
          {[
            ['🏃', 'Module Running', null],
            ['💪', 'Module Muscu', null],
            ['📊', 'Historique', null],
            ['🟠', 'Strava', null],
          ].map(([icon, label]) => (
            <div key={label} style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', borderRadius:12, cursor:'pointer', color:'var(--text-primary)' }}
              onClick={onClose}>
              <span style={{ fontSize:20, width:28 }}>{icon}</span>
              <span style={{ fontSize:14, fontWeight:600, flex:1 }}>{label}</span>
              <span style={{ color:'var(--text-muted)', fontSize:16 }}>›</span>
            </div>
          ))}
        </div>

        <div style={{ height:1, background:'var(--border)', marginBottom:16 }} />

        {/* Logout */}
        <button onClick={onLogout} style={{ width:'100%', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:12, padding:'14px', fontSize:14, fontWeight:700, color:'rgba(239,68,68,0.9)', cursor:'pointer', fontFamily:'Syne, sans-serif' }}>
          Se déconnecter
        </button>
      </div>
    </>
  );
}

export default function PacePro() {
  const [tab, setTab] = useState('home');
  const [showProfile, setShowProfile] = useState(false);
  const [user, setUser] = useState(() => {
    try {
      // Vérifie d'abord pp_user (email auth)
      const u = localStorage.getItem('pp_user');
      if (u) return JSON.parse(u);
      // Sinon vérifie Strava
      const a = localStorage.getItem('strava_athlete');
      if (a) {
        const athlete = JSON.parse(a);
        if (athlete?.id) return { id: athlete.id, name: athlete.name, photo: athlete.photo, strava: true };
      }
      return null;
    } catch { return null; }
  });

  const handleAuth = (u) => setUser(u);
  const handleLogout = () => {
    localStorage.removeItem('pp_user');
    localStorage.removeItem('pp_user_id');
    localStorage.removeItem('strava_token');
    localStorage.removeItem('strava_athlete');
    setUser(null);
  };

  if (!user) return <AuthModule onAuth={handleAuth} />;
   // 'running' | 'muscu'
  const [view, setView] = useState('list');
  const [plans, setPlans] = useState([]);
  const [activePlan, setActivePlan] = useState(null);
  useEffect(()=>{
  const init = async () => {
    const cloud = await loadPlans();
    if (cloud && cloud.length > 0) {
      setPlans(cloud);
      try { localStorage.setItem('pp_plans', JSON.stringify(cloud)); } catch {}
    } else {
      try { const s = localStorage.getItem('pp_plans'); if(s) setPlans(JSON.parse(s)); } catch {}
    }
  };
  init();
},[]);
  const savePlans = (p) => { setPlans(p); try{localStorage.setItem('pp_plans',JSON.stringify(p));}catch{} syncPlans(p); };
  const handleOnboarding = (profile) => {
    const plan = generatePlan(profile);
    const newPlans = [...plans,{profile,plan}];
    savePlans(newPlans);
    setActivePlan(newPlans.length-1);
    setView('dashboard');
  };
  const handleDelete = (idx) => { savePlans(plans.filter((_,i)=>i!==idx)); setView('list'); };

  // Bottom nav
  const BottomNav = () => (
    <div style={{position:'fixed',bottom:0,left:0,right:0,zIndex:100,background:'var(--bg-nav)',backdropFilter:'blur(20px)',borderTop:'1px solid var(--border-nav)',display:'flex',height:60,paddingBottom:'env(safe-area-inset-bottom,0px)'}}>
      {[['home','home','Accueil'],['running','running','Running'],['muscu','muscle','Muscu'],['strava','strava','Strava'],['historique','history','Historique']].map(([t,icon,label])=>(
        <button key={t} onClick={()=>setTab(t)}
          style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:2,background:'none',border:'none',cursor:'pointer',fontFamily:'Syne,sans-serif',
            color:tab===t?'#FF0040':'var(--text-muted)',transition:'color 0.2s'}}>
          <Icon name={icon} size={20} color={tab===t?'#FF0040':'var(--text-muted)'}/>
          <span style={{fontSize:10,fontWeight:tab===t?700:400,letterSpacing:'0.05em'}}>{label}</span>
        </button>
      ))}
    </div>
  );

  const ProfileBtn = () => (
    <button onClick={() => setShowProfile(true)} style={{ position:'fixed', top:12, right:16, zIndex:150, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:99, padding:'6px 12px 6px 8px', display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontFamily:'Syne, sans-serif', boxShadow:'0 2px 12px rgba(0,0,0,0.1)' }}>
      {user?.photo
        ? <img src={user.photo} alt="" style={{ width:26, height:26, borderRadius:'50%', objectFit:'cover' }} />
        : <div style={{ width:26, height:26, borderRadius:'50%', background:'rgba(219,59,61,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>👤</div>
      }
      <span style={{ fontSize:12, fontWeight:600, color:'var(--text-primary)', maxWidth:80, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.name?.split(' ')[0]}</span>
    </button>
  );

  if (tab === 'historique') {
    return (
      <>
        <ThemeStyles/>
        <ProfileBtn/>
        {showProfile && <ProfileSheet user={user} onClose={() => setShowProfile(false)} onLogout={() => { handleLogout(); setShowProfile(false); }} />}
        <div style={{paddingBottom:60}}><HistoriqueModule/></div>
        <BottomNav/>
      </>
    );
  }
  if (tab === 'home') {
    return (
      <>
        <ThemeStyles/>
        <ProfileBtn/>
        {showProfile && <ProfileSheet user={user} onClose={() => setShowProfile(false)} onLogout={() => { handleLogout(); setShowProfile(false); }} />}
        <HomeModule onNavigate={setTab}/>
        <BottomNav/>
      </>
    );
  }
  if (tab === 'strava') {
    return (
      <>
        <ThemeStyles/>
        <ProfileBtn/>
        {showProfile && <ProfileSheet user={user} onClose={() => setShowProfile(false)} onLogout={() => { handleLogout(); setShowProfile(false); }} />}
        <div style={{paddingBottom:60}}><StravaModule/></div>
        <BottomNav/>
      </>
    );
  }
  if (tab === 'muscu') {
    return (
      <>
        <ThemeStyles/>
        <ProfileBtn/>
        {showProfile && <ProfileSheet user={user} onClose={() => setShowProfile(false)} onLogout={() => { handleLogout(); setShowProfile(false); }} />}
        <div style={{paddingBottom:60}}>
          <Muscu/>
        </div>
        <BottomNav/>
      </>
    );
  }

  // Running tab
  if (view==='onboarding') return <><ThemeStyles/><div style={{paddingBottom:60}}><Onboarding onComplete={handleOnboarding}/></div><BottomNav/></>;
  if (view==='dashboard' && activePlan!==null && plans[activePlan]) {
    return (
      <>
        <ThemeStyles/>
        <div style={{paddingBottom:60}}>
          <button onClick={()=>setView('list')} style={{position:'fixed',bottom:68,right:20,zIndex:99,background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:99,padding:'8px 14px',color:'var(--text-secondary)',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'Syne,sans-serif',backdropFilter:'blur(12px)'}}>📋 Mes plans</button>
          <Dashboard profile={plans[activePlan].profile} plan={plans[activePlan].plan} initialCompleted={plans[activePlan].completed||{}} initialFeedbacks={plans[activePlan].feedbacks||{}} onReset={()=>setView('onboarding')} onSave={(newPlan, newCompleted, newFeedbacks) => { const updated = plans.map((p,i) => i===activePlan ? {...p, plan:newPlan, completed:newCompleted, feedbacks:newFeedbacks} : p); savePlans(updated); }}/>
        </div>
        <BottomNav/>
      </>
    );
  }
  if (plans.length===0) return <><ThemeStyles/><div style={{paddingBottom:60}}><Onboarding onComplete={handleOnboarding}/></div><BottomNav/></>;
  return <><ThemeStyles/><div style={{paddingBottom:60}}><PlansList plans={plans} onSelect={i=>{setActivePlan(i);setView('dashboard');}} onNew={()=>setView('onboarding')} onDelete={handleDelete}/></div><BottomNav/></>;
}
