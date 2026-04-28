'use client';
import { useState, useEffect } from 'react';

// ─── Utilitaires ──────────────────────────────────────────────────────────────
function toPace(speedKmh) {
  const mPerKm = 60 / speedKmh;
  const m = Math.floor(mPerKm);
  const s = Math.round((mPerKm - m) * 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function calcPaces(vma) {
  return {
    ef:        `${toPace(vma * 0.70)}–${toPace(vma * 0.75)}`,
    tempo:     `${toPace(vma * 0.80)}–${toPace(vma * 0.85)}`,
    threshold: `${toPace(vma * 0.87)}–${toPace(vma * 0.92)}`,
    vma90:     `${toPace(vma * 0.92)}–${toPace(vma * 1.00)}`,
    recov:     `${toPace(vma * 0.60)}–${toPace(vma * 0.65)}`,
  };
}

function estimateVMA(distKm, timeMins) {
  const speed = distKm / (timeMins / 60);
  const factors = [[1,.95],[3,.90],[5,.87],[10,.84],[21.1,.78],[42.2,.72]];
  const [,f] = factors.reduce((p,c) => Math.abs(c[0]-distKm)<Math.abs(p[0]-distKm)?c:p);
  return +(speed / f).toFixed(1);
}

const DAYS_FR = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];

// ─── Générateur de plan ───────────────────────────────────────────────────────
function generatePlan(profile) {
  const { vma, level, type, weeks, sessionsPerWeek, trainingDays, raceDistanceKm, elevationM } = profile;
  const paces = calcPaces(vma);
  const isTrail = type === 'trail';
  const hasElevation = elevationM > 100;
  const baseKm = { beginner:5, intermediate:8, advanced:11, expert:14 }[level];
  const mult   = { beginner:0.8, intermediate:1.0, advanced:1.2, expert:1.5 }[level];

  const phaseMap = [];
  if (weeks === 2) {
    phaseMap.push('base','taper');
  } else if (weeks <= 4) {
    for(let i=0;i<weeks;i++) phaseMap.push(i<Math.ceil(weeks*0.6)?'base':i<weeks-1?'peak':'taper');
  } else if (weeks <= 8) {
    [3,3,1,1].forEach((n,pi)=>{ for(let i=0;i<n&&phaseMap.length<weeks;i++) phaseMap.push(['base','build','peak','taper'][pi]); });
  } else {
    [4,4,2,2].forEach((n,pi)=>{ for(let i=0;i<n&&phaseMap.length<weeks;i++) phaseMap.push(['base','build','peak','taper'][pi]); });
  }

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
      if (isFirst) return { type:'frac', tag:'Fractionné léger', tagColor:'#a78bfa', tagBg:'rgba(167,139,250,0.12)',
        title:'4 × 30 sec / 1:30', detail:'Juste pour garder la vivacité. Pas de fatigue.',
        allures:[{dot:'#ef4444',label:'Effort',val:paces.vma90},{dot:'#22c55e',label:'Récup',val:paces.recov}] };
      return { type:'ef', tag:'Décrassage', tagColor:'#22c55e', tagBg:'rgba(34,197,94,0.12)',
        title:'20–25 min léger', detail:'Arriver reposé le jour J.',
        allures:[{dot:'#22c55e',label:'Sortie',val:paces.recov}] };
    }

    if (phase === 'peak' && isLast) return { type:'key', tag:'Sortie clé ⭐', tagColor:'#FF0040', tagBg:'rgba(249,115,22,0.15)',
      title:`${Math.round(raceDistanceKm*0.85)} km — Répétition générale`,
      detail:`Simule le jour J. Même équipement${hasElevation?' et dénivelé':''}.`,
      allures:[{dot:'#22c55e',label:'Plat',val:paces.ef},{dot:'#a78bfa',label:'Montées',val:'marche active'}] };

    if (isLast) {
      const longKm = Math.round(km * (phase==='peak'?0.9:phase==='build'?0.8:0.65));
      return isTrail && hasElevation
        ? { type:'trail', tag:'Trail dénivelé', tagColor:'#f59e0b', tagBg:'rgba(245,158,11,0.12)',
            title:`${longKm} km D+${Math.round(elevationM*0.6)}m`,
            detail:'Recherche du dénivelé. Marche active en montée, technique en descente.',
            allures:[{dot:'#22c55e',label:'Plat',val:paces.ef},{dot:'#a78bfa',label:'Montées',val:'marche active'}] }
        : { type:'long', tag:'Sortie longue', tagColor:'#f59e0b', tagBg:'rgba(245,158,11,0.12)',
            title:`${longKm} km`,
            detail:'Allure maîtrisée. Progression sur le dernier tiers.',
            allures:[{dot:'#22c55e',label:'Début 2/3',val:paces.ef},{dot:'#f59e0b',label:'Fin 1/3',val:paces.tempo}] };
    }

    if (isFirst) {
      if (phase === 'build') {
        const blocs = Math.min(3+Math.floor(idx/2),5);
        const dur = Math.min(8+idx,12);
        return { type:'frac', tag:'Fractionné long', tagColor:'#60a5fa', tagBg:'rgba(96,165,250,0.12)',
          title:`${blocs} × ${dur} min / ${Math.round(dur*0.4)} min`,
          detail:`Échauffement 15 min. ${blocs} blocs seuil. Récup trot.`,
          allures:[{dot:'#FF0040',label:`Effort (${dur} min)`,val:paces.threshold},{dot:'#22c55e',label:'Récup',val:paces.recov}] };
      }
      return { type:'frac', tag:'Fractionné court', tagColor:'#60a5fa', tagBg:'rgba(96,165,250,0.12)',
        title:`${reps} × 1 min / 1 min`,
        detail:`Échauffement 15 min. ${reps} répétitions vif/trot. Retour calme 10 min.`,
        allures:[{dot:'#ef4444',label:'Effort',val:paces.vma90},{dot:'#22c55e',label:'Récup',val:paces.recov}] };
    }

    const efKm = Math.round(km * 0.55);
    return { type:'ef', tag:'Endurance fondamentale', tagColor:'#22c55e', tagBg:'rgba(34,197,94,0.12)',
      title:`${efKm} km EF`,
      detail:'Allure conversation. Terrain varié idéal.',
      allures:[{dot:'#22c55e',label:'Sortie entière',val:paces.ef}] };
  };

  return phaseMap.slice(0, weeks).map((phase, idx) => {
    const wStart = new Date(startDate); wStart.setDate(startDate.getDate() + idx*7);
    const wEnd   = new Date(wStart);    wEnd.setDate(wStart.getDate() + 6);
    const fmt = d => d.toLocaleDateString('fr-FR',{day:'numeric',month:'short'});
    const km = Math.round(baseKm * mult * (1 + idx * 0.04));

    const effectiveSessions = weeks <= 2 ? Math.max(sessionsPerWeek, 4) : sessionsPerWeek;
    const effectiveDays = weeks <= 2 && effectiveSessions > trainingDays.length
      ? [...trainingDays, ...DAYS_FR.filter(d=>!trainingDays.includes(d))].slice(0, effectiveSessions)
      : trainingDays.slice(0, effectiveSessions);

    const sessions = effectiveDays.map((day, si) => ({
      ...makeSession(phase, idx, si, km),
      id: `w${idx+1}_s${si}`, day, completed: false,
    }));

    const weeklyKm = sessions.reduce((a,s)=>{ const m=s.title.match(/(\d+)\s*km/); return a+(m?+m[1]:0); },0);

    return {
      week: idx+1, phase, ...phaseInfo[phase],
      dateRange: `${fmt(wStart)} – ${fmt(wEnd)}`,
      sessions, weeklyKm, isKey: phase==='peak',
    };
  });
}

// ─── Styles communs ───────────────────────────────────────────────────────────
const card = {background:'rgba(19,22,31,0.8)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:16,padding:'16px 18px'};
const navBtn = {background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:12,padding:'8px 12px',color:'rgba(255,255,255,0.4)',cursor:'pointer',fontFamily:'inherit',fontSize:16};
const lbl = {fontSize:12,color:'rgba(255,255,255,0.4)',display:'block',marginBottom:8};
const inp = () => ({background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',color:'#fff',borderRadius:12,padding:'12px 14px',width:'100%',fontSize:14,fontFamily:'inherit',outline:'none'});
const toggle = (active) => ({background:active?'rgba(249,115,22,0.15)':'rgba(255,255,255,0.04)',border:`1px solid ${active?'rgba(249,115,22,0.5)':'rgba(255,255,255,0.08)'}`,color:active?'#FF0040':'rgba(255,255,255,0.5)',borderRadius:12,padding:'10px 12px',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit',transition:'all 0.2s'});

// ─── AllureChip ───────────────────────────────────────────────────────────────
// ─── Icônes SVG custom ────────────────────────────────────────────────────────
const SessionIcons = {
  frac: () => (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <circle cx="18" cy="18" r="18" fill="rgba(255,0,64,0.12)"/>
      <path d="M12 24 L18 10 L24 24" stroke="#FF0040" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M14 20 L22 20" stroke="#FF0040" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="18" cy="10" r="2" fill="#FF0040"/>
    </svg>
  ),
  ef: () => (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <circle cx="18" cy="18" r="18" fill="rgba(34,197,94,0.12)"/>
      <path d="M10 20 Q14 14 18 18 Q22 22 26 16" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <circle cx="10" cy="20" r="1.5" fill="#22c55e"/>
      <circle cx="26" cy="16" r="1.5" fill="#22c55e"/>
      <path d="M15 24 Q18 26 21 24" stroke="#22c55e" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.5"/>
    </svg>
  ),
  long: () => (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <circle cx="18" cy="18" r="18" fill="rgba(245,158,11,0.12)"/>
      <path d="M10 22 L14 16 L18 19 L22 13 L26 17" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <circle cx="26" cy="17" r="2.5" fill="#f59e0b" opacity="0.3"/>
      <circle cx="26" cy="17" r="1.5" fill="#f59e0b"/>
    </svg>
  ),
  trail: () => (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <circle cx="18" cy="18" r="18" fill="rgba(245,158,11,0.12)"/>
      <path d="M9 25 L18 11 L27 25" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M13 25 L18 17 L23 25" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.5"/>
      <circle cx="18" cy="11" r="2" fill="#f59e0b"/>
    </svg>
  ),
  key: () => (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <circle cx="18" cy="18" r="18" fill="rgba(255,0,64,0.12)"/>
      <path d="M18 10 L20 16 L26 16 L21.5 20 L23.5 26 L18 22.5 L12.5 26 L14.5 20 L10 16 L16 16 Z" stroke="#FF0040" strokeWidth="1.5" strokeLinejoin="round" fill="rgba(255,0,64,0.15)"/>
    </svg>
  ),
  taper: () => (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <circle cx="18" cy="18" r="18" fill="rgba(167,139,250,0.12)"/>
      <path d="M12 14 Q18 10 24 14 Q28 18 24 22 Q18 26 12 22 Q8 18 12 14Z" stroke="#a78bfa" strokeWidth="1.5" fill="none"/>
      <path d="M15 18 L17 20 L21 16" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};
function AllureChip({ dot, label, val }) {
  return (
    <div style={{display:'inline-flex',alignItems:'center',gap:6,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:99,padding:'3px 10px',fontFamily:'monospace',fontSize:11}}>
      <span style={{width:7,height:7,borderRadius:'50%',background:dot,flexShrink:0,display:'inline-block'}}/>
      <span style={{color:'rgba(255,255,255,0.35)'}}>{label}</span>
      <span style={{color:'#fff',fontWeight:500}}>{val}</span>
    </div>
  );
}

// ─── SessionCard ──────────────────────────────────────────────────────────────
function SessionCard({ session, onComplete }) {
  return (
    <div <div style={{display:'flex',alignItems:'center',gap:8}}>
  {SessionIcons[session.type] ? SessionIcons[session.type]() : SessionIcons.ef()}
  {session.completed && <div style={{width:24,height:24,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(34,197,94,0.15)',fontSize:12}}>✓</div>}
</div>
        <div>
          <div style={{fontSize:10,color:'rgba(255,255,255,0.3)',textTransform:'uppercase',letterSpacing:'0.12em',marginBottom:6,fontFamily:'monospace'}}>{session.day}</div>
          <span style={{display:'inline-block',fontSize:10,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',padding:'2px 9px',borderRadius:99,background:session.tagBg,color:session.tagColor,border:`1px solid ${session.tagColor}40`}}>{session.tag}</span>
        </div>
        {session.completed && <div style={{width:24,height:24,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(34,197,94,0.15)',fontSize:12}}>✓</div>}
      </div>
      <div style={{fontSize:18,fontWeight:700,letterSpacing:'-0.02em',marginBottom:6}}>{session.title}</div>
      <p style={{fontSize:12,color:'rgba(255,255,255,0.4)',lineHeight:1.6,marginBottom:14}}>{session.detail}</p>
      <div style={{display:'flex',flexDirection:'column',gap:5,marginBottom:16}}>
        {session.allures.map((a,i)=><AllureChip key={i} {...a}/>)}
      </div>
      {!session.completed && onComplete && (
        <button onClick={()=>onComplete(session.id)} style={{width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:12,padding:'8px 16px',color:'rgba(255,255,255,0.4)',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
          Marquer comme terminé
        </button>
      )}
    </div>
  );
}

// ─── Onboarding ───────────────────────────────────────────────────────────────
function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name:'', type:'trail', level:'intermediate',
    vmaMode:'direct', vma:'14', raceDistKm:'10', raceTimeMins:'',
    raceDistanceKm:'15', elevationM:'150',
    sessionsPerWeek:2, trainingDays:[],
    weeks:8, raceName:'', raceDate:'',
  });
  const upd = (k,v) => setForm(f=>({...f,[k]:v}));
  const computedVma = form.vmaMode==='direct' ? +form.vma : (form.raceTimeMins?estimateVMA(+form.raceDistKm,+form.raceTimeMins):0);

  const toggleDay = (day) => {
    const days = form.trainingDays;
    if (days.includes(day)) { upd('trainingDays',days.filter(d=>d!==day)); }
    else if (days.length < form.sessionsPerWeek) { upd('trainingDays',[...days,day]); }
  };

  const steps = [
    {
      title:'Qui es-tu ?', sub:'Ton profil de coureur', ok: form.name.length>0,
      body:(
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <div><label style={lbl}>Ton prénom</label><input style={inp()} placeholder="Alex" value={form.name} onChange={e=>upd('name',e.target.value)}/></div>
          <div>
            <label style={lbl}>Type de course</label>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              {[['trail','🏔️ Trail'],['road','🏙️ Route']].map(([v,l])=><button key={v} onClick={()=>upd('type',v)} style={toggle(form.type===v)}>{l}</button>)}
            </div>
          </div>
          <div>
            <label style={lbl}>Niveau</label>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              {[['beginner','🌱 Débutant'],['intermediate','🏃 Intermédiaire'],['advanced','⚡ Avancé'],['expert','🔥 Expert']].map(([v,l])=><button key={v} onClick={()=>upd('level',v)} style={toggle(form.level===v)}>{l}</button>)}
            </div>
          </div>
        </div>
      )
    },
    {
      title:'Ta condition physique', sub:'On calcule tes allures personnalisées', ok: computedVma>0,
      body:(
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <div>
            <label style={lbl}>Comment saisir ta VMA ?</label>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              {[['direct','Je connais ma VMA'],['race','Depuis un chrono récent']].map(([v,l])=><button key={v} onClick={()=>upd('vmaMode',v)} style={toggle(form.vmaMode===v)}>{l}</button>)}
            </div>
          </div>
          {form.vmaMode==='direct'?(
            <div>
              <label style={lbl}>VMA (km/h)</label>
              <input type="number" style={inp()} min="8" max="25" step="0.5" value={form.vma} onChange={e=>upd('vma',e.target.value)}/>
              <p style={{fontSize:11,color:'rgba(255,255,255,0.25)',marginTop:6}}>Moyenne loisir : 12–15 km/h</p>
            </div>
          ):(
            <>
              <div>
                <label style={lbl}>Distance récente</label>
                <select style={inp()} value={form.raceDistKm} onChange={e=>upd('raceDistKm',e.target.value)}>
                  {[[1,'1 km'],[3,'3 km'],[5,'5 km'],[10,'10 km'],[15,'15 km'],[21.1,'Semi-marathon'],[42.2,'Marathon']].map(([v,l])=><option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Chrono (en minutes)</label>
                <input type="number" style={inp()} placeholder="ex: 55" value={form.raceTimeMins} onChange={e=>upd('raceTimeMins',e.target.value)}/>
              </div>
              {computedVma>0&&<div style={{background:'rgba(249,115,22,0.08)',border:'1px solid rgba(249,115,22,0.2)',borderRadius:12,padding:'10px 14px',fontSize:12,color:'rgba(255,255,255,0.5)'}}>VMA estimée : <span style={{color:'#FF0040',fontWeight:700,fontFamily:'monospace'}}>{computedVma.toFixed(1)} km/h</span></div>}
            </>
          )}
        </div>
      )
    },
    {
      title:'Ta course cible', sub:'Dis-nous tout sur ton objectif', ok: form.raceName.length>0,
      body:(
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <div><label style={lbl}>Nom de la course</label><input style={inp()} placeholder="Trail de la Fraise" value={form.raceName} onChange={e=>upd('raceName',e.target.value)}/></div>
          <div><label style={lbl}>Date de la course</label><input type="date" style={inp()} value={form.raceDate} onChange={e=>upd('raceDate',e.target.value)}/></div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div><label style={lbl}>Distance (km)</label><input type="number" style={inp()} min="1" max="200" step="0.5" value={form.raceDistanceKm} onChange={e=>upd('raceDistanceKm',e.target.value)}/></div>
            <div><label style={lbl}>Dénivelé + (m)</label><input type="number" style={inp()} min="0" max="5000" step="50" value={form.elevationM} onChange={e=>upd('elevationM',e.target.value)} placeholder="0 si plat"/></div>
          </div>
        </div>
      )
    },
    {
      title:'Ton planning', sub:'Organisation de tes entraînements',
      ok: form.trainingDays.length===form.sessionsPerWeek,
      body:(
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <div>
            <label style={lbl}>Durée du programme</label>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
              {[[2,'2 sem.'],[4,'4 sem.'],[8,'8 sem.'],[12,'12 sem.']].map(([v,l])=><button key={v} onClick={()=>upd('weeks',v)} style={toggle(form.weeks===v)}>{l}</button>)}
            </div>
          </div>
          <div>
            <label style={lbl}>Séances par semaine</label>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
              {[2,3,4,5].map(n=><button key={n} onClick={()=>{upd('sessionsPerWeek',n);upd('trainingDays',[]);}} style={toggle(form.sessionsPerWeek===n)}>{n}×</button>)}
            </div>
          </div>
          <div>
            <label style={lbl}>Choisis tes {form.sessionsPerWeek} jours ({form.trainingDays.length}/{form.sessionsPerWeek} sélectionnés)</label>
            <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8}}>
              {DAYS_FR.map(day=>{
                const selected=form.trainingDays.includes(day);
                const disabled=!selected&&form.trainingDays.length>=form.sessionsPerWeek;
                return <button key={day} onClick={()=>!disabled&&toggleDay(day)} style={{...toggle(selected),opacity:disabled?0.35:1,cursor:disabled?'not-allowed':'pointer'}}>{day}</button>;
              })}
            </div>
          </div>
        </div>
      )
    }
  ];

  const handleFinish = () => {
    const finalVma = form.vmaMode==='direct'?+form.vma:estimateVMA(+form.raceDistKm,+form.raceTimeMins);
    onComplete({...form,vma:finalVma,weeks:+form.weeks,raceDistanceKm:+form.raceDistanceKm,elevationM:+form.elevationM});
  };

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:'24px 16px',background:'#07080b'}}>
      <div style={{width:'100%',maxWidth:460,background:'rgba(19,22,31,0.9)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:24,padding:'36px 32px'}}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:32}}>
          <div style={{width:34,height:34,borderRadius:10,background:'#FF0040',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:16,color:'#000'}}>P</div>
          <span style={{fontWeight:700,fontSize:18,letterSpacing:'-0.02em'}}>PacePro</span>
        </div>
        <div style={{display:'flex',gap:6,marginBottom:28,alignItems:'center'}}>
          {steps.map((_,i)=><div key={i} style={{width:i===step?20:8,height:8,borderRadius:99,background:i===step?'#FF0040':i<step?'#22c55e':'rgba(255,255,255,0.15)',transition:'all 0.3s'}}/>)}
          <span style={{fontSize:11,color:'rgba(255,255,255,0.25)',fontFamily:'monospace',marginLeft:8}}>{step+1}/{steps.length}</span>
        </div>
        <h2 style={{fontSize:22,fontWeight:800,letterSpacing:'-0.03em',marginBottom:4}}>{steps[step].title}</h2>
        <p style={{fontSize:13,color:'rgba(255,255,255,0.4)',marginBottom:24}}>{steps[step].sub}</p>
        {steps[step].body}
        <div style={{display:'flex',gap:10,marginTop:28}}>
          {step>0&&<button onClick={()=>setStep(s=>s-1)} style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:12,padding:'12px 16px',color:'rgba(255,255,255,0.4)',cursor:'pointer',fontFamily:'inherit'}}>←</button>}
          <button onClick={step<steps.length-1?()=>setStep(s=>s+1):handleFinish} disabled={!steps[step].ok}
            style={{flex:1,background:'#FF0040',color:'#000',border:'none',borderRadius:12,padding:'12px 20px',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'inherit',opacity:steps[step].ok?1:0.4,transition:'all 0.2s'}}>
            {step<steps.length-1?'Continuer →':'🚀 Générer mon programme'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ profile, plan, onReset }) {
  const [activeWeek, setActiveWeek] = useState(0);
  const [completed, setCompleted] = useState({});
  const paces = calcPaces(profile.vma);
  const totalSessions = plan.reduce((a,w)=>a+w.sessions.length,0);
  const doneCount = Object.values(completed).filter(Boolean).length;
  const progress = Math.round((doneCount/totalSessions)*100);
  const week = plan[activeWeek];
  const nextSession = plan.flatMap(w=>w.sessions.map(s=>({...s,week:w.week}))).find(s=>!completed[s.id]);

  return (
    <div style={{minHeight:'100vh',background:'#07080b',color:'#fff',fontFamily:'Syne,sans-serif'}}>
      <nav style={{position:'sticky',top:0,zIndex:50,background:'rgba(7,8,11,0.85)',backdropFilter:'blur(20px)',borderBottom:'1px solid rgba(255,255,255,0.06)',padding:'0 20px',height:56,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
         <img src="/logo.png" alt="PacePro" style={{width:36,height:36,objectFit:'contain'}}/>
          <span style={{fontWeight:700,fontSize:16,letterSpacing:'-0.02em'}}>PacePro</span>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <span style={{fontSize:13,color:'rgba(255,255,255,0.5)'}}>{profile.name}</span>
          <button onClick={onReset} style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:8,padding:'4px 10px',color:'rgba(255,255,255,0.3)',fontSize:12,cursor:'pointer',fontFamily:'inherit'}}>Nouveau plan</button>
        </div>
      </nav>
      <main style={{maxWidth:1000,margin:'0 auto',padding:'28px 20px 60px'}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:12,marginBottom:20}}>
          <div style={{...card,gridColumn:'span 2'}}>
            <div style={{fontSize:10,color:'rgba(255,255,255,0.3)',fontFamily:'monospace',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:10}}>Progression</div>
            <div style={{fontSize:15,fontWeight:700,marginBottom:8}}>{profile.raceName} · {profile.raceDistanceKm} km{profile.elevationM>0?` D+${profile.elevationM}m`:''}</div>
            <div style={{height:3,background:'rgba(255,255,255,0.06)',borderRadius:99}}>
              <div style={{height:'100%',borderRadius:99,background:'linear-gradient(90deg,#FF0040,#fbbf24)',width:`${progress}%`,transition:'width 0.6s'}}/>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',marginTop:6,fontSize:11,color:'rgba(255,255,255,0.3)',fontFamily:'monospace'}}>
              <span>{doneCount}/{totalSessions} séances</span><span>{progress}%</span>
            </div>
          </div>
          <div style={card}>
            <div style={{fontSize:10,color:'rgba(255,255,255,0.3)',fontFamily:'monospace',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:4}}>VMA</div>
            <div style={{fontSize:28,fontWeight:800,color:'#FF0040',fontFamily:'monospace'}}>{profile.vma.toFixed(1)}</div>
            <div style={{fontSize:11,color:'rgba(255,255,255,0.3)'}}>km/h</div>
          </div>
          <div style={card}>
            <div style={{fontSize:10,color:'rgba(255,255,255,0.3)',fontFamily:'monospace',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:4}}>Séances/sem.</div>
            <div style={{fontSize:20,fontWeight:800,fontFamily:'monospace'}}>{profile.sessionsPerWeek}×</div>
            <div style={{fontSize:10,color:'rgba(255,255,255,0.25)',marginTop:2,lineHeight:1.4}}>{profile.trainingDays.join(', ')}</div>
          </div>
        </div>

        <div style={{...card,marginBottom:20}}>
          <div style={{fontSize:11,color:'rgba(255,255,255,0.3)',fontFamily:'monospace',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12}}>Tes allures personnalisées</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
            {[['EF',paces.ef,'#22c55e'],['Tempo',paces.tempo,'#f59e0b'],['Seuil',paces.threshold,'#FF0040'],['VMA 90%',paces.vma90,'#ef4444'],['Récup',paces.recov,'rgba(255,255,255,0.3)']].map(([l,v,c])=>(
              <AllureChip key={l} dot={c} label={l} val={v+' /km'}/>
            ))}
          </div>
        </div>

        {nextSession&&(
          <div style={{background:'rgba(249,115,22,0.06)',border:'1px solid rgba(249,115,22,0.2)',borderRadius:14,padding:'14px 18px',marginBottom:20}}>
            <div style={{fontSize:10,color:'#FF0040',textTransform:'uppercase',letterSpacing:'0.12em',fontFamily:'monospace',marginBottom:4}}>Prochaine séance — Semaine {nextSession.week} · {nextSession.day}</div>
            <div style={{fontSize:15,fontWeight:700}}>{nextSession.title}</div>
            <div style={{fontSize:12,color:'rgba(255,255,255,0.4)',marginTop:2}}>{nextSession.detail}</div>
          </div>
        )}

        <div style={{display:'flex',gap:6,overflowX:'auto',paddingBottom:4,marginBottom:18}}>
          {plan.map((w,i)=>(
            <button key={i} onClick={()=>setActiveWeek(i)}
              style={{flexShrink:0,borderRadius:12,padding:'6px 14px',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit',transition:'all 0.2s',
                background:activeWeek===i?'rgba(249,115,22,0.15)':'rgba(255,255,255,0.04)',
                border:`1px solid ${activeWeek===i?'rgba(249,115,22,0.4)':'rgba(255,255,255,0.07)'}`,
                color:activeWeek===i?'#FF0040':'rgba(255,255,255,0.35)'}}>
              S{w.week}{w.isKey?' ★':''}
            </button>
          ))}
        </div>

        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
          <button onClick={()=>setActiveWeek(w=>Math.max(0,w-1))} style={navBtn}>←</button>
          <div style={{flex:1}}>
            <div style={{fontSize:10,color:'rgba(255,255,255,0.2)',fontFamily:'monospace',letterSpacing:'0.1em'}}>{week.dateRange}</div>
            <div style={{display:'flex',alignItems:'center',gap:8,marginTop:4,flexWrap:'wrap'}}>
              <span style={{fontSize:17,fontWeight:700,letterSpacing:'-0.02em'}}>Semaine {week.week}</span>
              <span style={{fontSize:10,fontWeight:700,padding:'2px 9px',borderRadius:99,textTransform:'uppercase',letterSpacing:'0.08em',background:week.bg,color:week.color,border:`1px solid ${week.color}40`}}>{week.label}</span>
              {week.weeklyKm>0&&<span style={{fontSize:10,color:'rgba(255,255,255,0.2)',fontFamily:'monospace'}}>{week.weeklyKm} km est.</span>}
            </div>
          </div>
          <button onClick={()=>setActiveWeek(w=>Math.min(plan.length-1,w+1))} style={navBtn}>→</button>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:12}}>
          {week.sessions.map(s=>(
            <SessionCard key={s.id} session={{...s,completed:!!completed[s.id]}}
              onComplete={id=>setCompleted(c=>({...c,[id]:!c[id]}))}/>
          ))}
        </div>

        {activeWeek===plan.length-1&&profile.raceName&&(
          <div style={{marginTop:16,background:'rgba(245,158,11,0.07)',border:'1px solid rgba(245,158,11,0.25)',borderRadius:14,padding:'20px 24px'}}>
            <div style={{fontSize:10,color:'rgba(245,158,11,0.7)',fontFamily:'monospace',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:6}}>
              {profile.raceDate?new Date(profile.raceDate).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'}):'Jour J'}
            </div>
            <div style={{fontSize:16,fontWeight:700,marginBottom:4}}>{profile.raceName} 🎯</div>
            <div style={{fontSize:12,color:'rgba(255,255,255,0.4)'}}>
              {profile.raceDistanceKm} km{profile.elevationM>0?` · D+${profile.elevationM}m`:''} · Allure cible : <span style={{color:'#fff',fontFamily:'monospace'}}>{paces.ef} /km</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Liste des plans ──────────────────────────────────────────────────────────
function PlansList({ plans, onSelect, onNew, onDelete }) {
  return (
    <div style={{minHeight:'100vh',background:'#07080b',color:'#fff',fontFamily:'Syne,sans-serif'}}>
      <nav style={{position:'sticky',top:0,zIndex:50,background:'rgba(7,8,11,0.85)',backdropFilter:'blur(20px)',borderBottom:'1px solid rgba(255,255,255,0.06)',padding:'0 20px',height:56,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <img src="/logo.png" alt="PacePro" style={{width:36,height:36,objectFit:'contain'}}/>
          <span style={{fontWeight:700,fontSize:16,letterSpacing:'-0.02em'}}>PacePro</span>
        </div>
        <button onClick={onNew} style={{background:'#FF0040',color:'#000',border:'none',borderRadius:10,padding:'6px 14px',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>+ Nouveau plan</button>
      </nav>
      <main style={{maxWidth:700,margin:'0 auto',padding:'32px 20px'}}>
        <h1 style={{fontSize:24,fontWeight:800,letterSpacing:'-0.03em',marginBottom:6}}>Mes plans d'entraînement</h1>
        <p style={{fontSize:13,color:'rgba(255,255,255,0.4)',marginBottom:28}}>{plans.length} plan{plans.length>1?'s':''} sauvegardé{plans.length>1?'s':''}</p>
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {plans.map((p,i)=>(
            <div key={i} style={{...card,cursor:'pointer',transition:'all 0.2s'}} onClick={()=>onSelect(i)}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:16,fontWeight:700,marginBottom:4}}>{p.profile.raceName||'Mon programme'}</div>
                  <div style={{fontSize:12,color:'rgba(255,255,255,0.4)',lineHeight:1.6}}>
                    {p.profile.raceDistanceKm} km{p.profile.elevationM>0?` · D+${p.profile.elevationM}m`:''} · {p.profile.weeks} semaines · {p.profile.sessionsPerWeek}×/sem.
                  </div>
                  <div style={{fontSize:11,color:'rgba(255,255,255,0.25)',fontFamily:'monospace',marginTop:4}}>
                    VMA {p.profile.vma.toFixed(1)} km/h · {p.profile.type==='trail'?'🏔️ Trail':'🏙️ Route'}
                    {p.profile.raceDate&&` · ${new Date(p.profile.raceDate).toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'})}`}
                  </div>
                  <div style={{fontSize:10,color:'rgba(255,255,255,0.2)',marginTop:4}}>{p.profile.trainingDays?.join(', ')}</div>
                </div>
                <div style={{display:'flex',gap:8,alignItems:'center',marginLeft:12,flexShrink:0}}>
                  <span style={{fontSize:18,fontWeight:800,color:'#FF0040'}}>→</span>
                  <button onClick={e=>{e.stopPropagation();onDelete(i);}}
                    style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:8,padding:'4px 8px',color:'rgba(239,68,68,0.6)',fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

// ─── App principale ────────────────────────────────────────────────────────────
export default function PacePro() {
  const [view, setView] = useState('list');
  const [plans, setPlans] = useState([]);
  const [activePlan, setActivePlan] = useState(null);

  useEffect(()=>{
    try { const s=localStorage.getItem('pp_plans'); if(s) setPlans(JSON.parse(s)); } catch{}
  },[]);

  const savePlans = (p) => { setPlans(p); try{localStorage.setItem('pp_plans',JSON.stringify(p));}catch{} };

  const handleOnboarding = (profile) => {
    const plan = generatePlan(profile);
    const newPlans = [...plans,{profile,plan}];
    savePlans(newPlans);
    setActivePlan(newPlans.length-1);
    setView('dashboard');
  };

  const handleDelete = (idx) => {
    const newPlans = plans.filter((_,i)=>i!==idx);
    savePlans(newPlans);
    setView('list');
  };

  if (view==='onboarding') return <Onboarding onComplete={handleOnboarding}/>;

  if (view==='dashboard' && activePlan!==null && plans[activePlan]) {
    return (
      <div>
        <button onClick={()=>setView('list')} style={{position:'fixed',bottom:20,right:20,zIndex:100,background:'rgba(19,22,31,0.95)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:99,padding:'10px 18px',color:'rgba(255,255,255,0.6)',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'Syne,sans-serif',backdropFilter:'blur(12px)'}}>
          📋 Mes plans
        </button>
        <Dashboard profile={plans[activePlan].profile} plan={plans[activePlan].plan} onReset={()=>setView('onboarding')}/>
      </div>
    );
  }

  if (plans.length===0) return <Onboarding onComplete={handleOnboarding}/>;
  return <PlansList plans={plans} onSelect={i=>{setActivePlan(i);setView('dashboard');}} onNew={()=>setView('onboarding')} onDelete={handleDelete}/>;
}
