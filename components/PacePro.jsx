'use client';
import { useState, useEffect, useRef } from 'react';

// ─── Utilitaires allures ───────────────────────────────────────────────────────
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

// ─── Générateur de plan ───────────────────────────────────────────────────────
function generatePlan(profile) {
  const { vma, level, type, weeks } = profile;
  const paces = calcPaces(vma);
  const isTrail = type === 'trail';
  const baseKm = { beginner:6, intermediate:9, advanced:12, expert:15 }[level];
  const mult   = { beginner:0.8, intermediate:1.0, advanced:1.2, expert:1.5 }[level];

  const phaseMap = [];
  if (weeks <= 8) {
    [3,3,1,1].forEach((n,pi) => { for(let i=0;i<n;i++) phaseMap.push(['base','build','peak','taper'][pi]); });
  } else {
    [4,4,2,2].forEach((n,pi) => { for(let i=0;i<n;i++) phaseMap.push(['base','build','peak','taper'][pi]); });
  }

  const phaseInfo = {
    base:  { label:'Construction',  color:'#22c55e', bg:'rgba(34,197,94,0.12)'   },
    build: { label:'Progression',   color:'#f59e0b', bg:'rgba(245,158,11,0.12)'  },
    peak:  { label:'Pic de charge', color:'#ef4444', bg:'rgba(239,68,68,0.12)'   },
    taper: { label:'Affûtage',      color:'#a78bfa', bg:'rgba(167,139,250,0.12)' },
  };

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - startDate.getDay() + 1);

  return phaseMap.slice(0, weeks).map((phase, idx) => {
    const wStart = new Date(startDate); wStart.setDate(startDate.getDate() + idx*7);
    const wEnd   = new Date(wStart);   wEnd.setDate(wStart.getDate() + 6);
    const fmt = d => d.toLocaleDateString('fr-FR',{day:'numeric',month:'short'});

    const km = Math.round(baseKm * mult * (1 + idx * 0.04));
    const reps = Math.min(4 + idx, phase==='taper'?4:8);

    let s1, s2;
    if (phase === 'base') {
      s1 = { type:'frac',  tag:'Fractionné court', tagColor:'#60a5fa', tagBg:'rgba(96,165,250,0.12)',
        title:`${reps} × 1 min / 1 min`,
        detail:`Échauffement 15 min. ${reps} répétitions 1 min vif / 1 min trot. Retour calme 10 min.`,
        allures:[{dot:'#ef4444',label:'Effort (1 min)',val:paces.vma90},{dot:'#22c55e',label:'Récup (1 min)',val:paces.recov}] };
      s2 = isTrail
        ? { type:'trail', tag:'Trail côtes', tagColor:'#f59e0b', tagBg:'rgba(245,158,11,0.12)',
            title:`${Math.round(km*0.65)} km terrain`,
            detail:`Dénivelé recherché. Marche active dans les montées, technique en descente.`,
            allures:[{dot:'#22c55e',label:'Plat/descente',val:paces.ef},{dot:'#a78bfa',label:'Montées',val:'marche active'}] }
        : { type:'ef',    tag:'Endurance fondamentale', tagColor:'#22c55e', tagBg:'rgba(34,197,94,0.12)',
            title:`${Math.round(km*0.65)} km EF`,
            detail:`Allure conversation tout du long. Terrain varié idéal.`,
            allures:[{dot:'#22c55e',label:'Sortie entière',val:paces.ef}] };
    } else if (phase === 'build') {
      const blocs = Math.min(3 + Math.floor(idx/2), 5);
      const dur   = Math.min(8 + idx, 12);
      s1 = { type:'frac', tag:'Fractionné long', tagColor:'#60a5fa', tagBg:'rgba(96,165,250,0.12)',
        title:`${blocs} × ${dur} min / ${Math.round(dur*0.4)} min`,
        detail:`Échauffement 15 min. ${blocs} blocs à allure seuil. Récup trot entre chaque.`,
        allures:[{dot:'#FF0040',label:`Effort (${dur} min)`,val:paces.threshold},{dot:'#22c55e',label:'Récup',val:paces.recov}] };
      s2 = { type:'long', tag:'Sortie longue', tagColor:'#f59e0b', tagBg:'rgba(245,158,11,0.12)',
        title:`${Math.round(km*0.8)} km ${isTrail?'trail':'route'}`,
        detail:`Allure maîtrisée. Accélération progressive sur le dernier tiers.`,
        allures:[{dot:'#22c55e',label:'Début (2/3)',val:paces.ef},{dot:'#f59e0b',label:'Fin (1/3)',val:paces.tempo}] };
    } else if (phase === 'peak') {
      s1 = { type:'frac', tag:'Fractionné court', tagColor:'#ef4444', tagBg:'rgba(239,68,68,0.12)',
        title:`${Math.min(reps+2,10)} × 1 min / 1 min`,
        detail:`Pic de charge. Même structure, volume augmenté. Reste vigilant sur la récup.`,
        allures:[{dot:'#ef4444',label:'Effort',val:paces.vma90},{dot:'#22c55e',label:'Récup',val:paces.recov}] };
      s2 = { type:'key',  tag:'Sortie clé ⭐', tagColor:'#FF0040', tagBg:'rgba(249,115,22,0.15)',
        title:`${Math.round(km*0.9)} km — Répétition générale`,
        detail:`Même équipement et ravito qu'en course. Simule le jour J. Gère l'allure.`,
        allures:[{dot:'#22c55e',label:'Plat/descente',val:paces.ef},{dot:'#a78bfa',label:'Montées',val:'marche active'}] };
    } else {
      s1 = { type:'frac', tag:'Fractionné léger', tagColor:'#a78bfa', tagBg:'rgba(167,139,250,0.12)',
        title:'4 × 30 sec / 1:30',
        detail:'Juste pour garder la vivacité. Bien en dessous des limites, pas de fatigue.',
        allures:[{dot:'#ef4444',label:'Effort (30s)',val:paces.vma90},{dot:'#22c55e',label:'Récup (1:30)',val:paces.recov}] };
      s2 = { type:'ef',   tag:'Décrassage', tagColor:'#22c55e', tagBg:'rgba(34,197,94,0.12)',
        title:'20–25 min très léger',
        detail:'Uniquement si tu te sens bien. Objectif : arriver reposé le jour J.',
        allures:[{dot:'#22c55e',label:'Sortie entière',val:paces.recov}] };
    }

    const weeklyKm = [s1,s2].reduce((a,s)=>{ const m=s.title.match(/(\d+)\s*km/); return a+(m?+m[1]:0); },0);

    return {
      week: idx+1, phase, ...phaseInfo[phase],
      dateRange: `${fmt(wStart)} – ${fmt(wEnd)}`,
      sessions: [s1,s2].map((s,i)=>({...s, id:`w${idx+1}_s${i}`, completed:false})),
      weeklyKm, isKey: phase==='peak',
    };
  });
}

// ─── Composants UI ─────────────────────────────────────────────────────────────
function AllureChip({ dot, label, val }) {
  return (
    <div style={{display:'inline-flex',alignItems:'center',gap:6,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:99,padding:'3px 10px',fontFamily:'monospace',fontSize:11}}>
      <span style={{width:7,height:7,borderRadius:'50%',background:dot,flexShrink:0,display:'inline-block'}}/>
      <span style={{color:'rgba(255,255,255,0.35)'}}>{label}</span>
      <span style={{color:'#fff',fontWeight:500}}>{val}</span>
    </div>
  );
}

function SessionCard({ session, day, onComplete }) {
  return (
    <div style={{
      background: session.completed ? 'rgba(34,197,94,0.04)' : 'rgba(10,12,18,0.9)',
      border: `1px solid ${session.completed ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.06)'}`,
      borderRadius:16, padding:20, transition:'all 0.25s',
    }}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}>
        <div>
          <div style={{fontSize:10,color:'rgba(255,255,255,0.3)',textTransform:'uppercase',letterSpacing:'0.12em',marginBottom:6,fontFamily:'monospace'}}>{day}</div>
          <span style={{display:'inline-block',fontSize:10,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',padding:'2px 9px',borderRadius:99,background:session.tagBg,color:session.tagColor,border:`1px solid ${session.tagColor}40`}}>
            {session.tag}
          </span>
        </div>
        {session.completed && (
          <div style={{width:24,height:24,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(34,197,94,0.15)',fontSize:12}}>✓</div>
        )}
      </div>
      <div style={{fontSize:18,fontWeight:700,letterSpacing:'-0.02em',marginBottom:6}}>{session.title}</div>
      <p style={{fontSize:12,color:'rgba(255,255,255,0.4)',lineHeight:1.6,marginBottom:14}}>{session.detail}</p>
      <div style={{display:'flex',flexDirection:'column',gap:5,marginBottom:16}}>
        {session.allures.map((a,i) => <AllureChip key={i} {...a}/>)}
      </div>
      {!session.completed && onComplete && (
        <button onClick={() => onComplete(session.id)}
          style={{width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:12,padding:'8px 16px',color:'rgba(255,255,255,0.4)',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
          Marquer comme terminé
        </button>
      )}
    </div>
  );
}

// ─── Onboarding (stepper 3 étapes) ───────────────────────────────────────────
function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name:'', type:'trail', level:'intermediate',
    vmaMode:'direct', vma:'14', raceDistKm:'10', raceTimeMins:'55',
    weeks:8, raceName:'', raceDate:'',
  });
  const upd = (k,v) => setForm(f => ({...f,[k]:v}));

  const computedVma = form.vmaMode==='direct' ? +form.vma : estimateVMA(+form.raceDistKm, +form.raceTimeMins);

  const steps = [
    {
      title:'Qui es-tu ?',
      sub:'Ton profil de coureur',
      ok: form.name.length > 0,
      body: (
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <div>
            <label style={lbl}>Ton prénom</label>
            <input style={inp} placeholder="Alex" value={form.name} onChange={e=>upd('name',e.target.value)}/>
          </div>
          <div>
            <label style={lbl}>Type de course</label>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              {[['trail','🏔️ Trail'],['road','🏙️ Route']].map(([v,l])=>(
                <button key={v} onClick={()=>upd('type',v)} style={toggle(form.type===v)}>{l}</button>
              ))}
            </div>
          </div>
          <div>
            <label style={lbl}>Niveau</label>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              {[['beginner','🌱 Débutant'],['intermediate','🏃 Intermédiaire'],['advanced','⚡ Avancé'],['expert','🔥 Expert']].map(([v,l])=>(
                <button key={v} onClick={()=>upd('level',v)} style={toggle(form.level===v)}>{l}</button>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      title:'Ta condition physique',
      sub:'On calcule tes allures personnalisées',
      ok: computedVma > 0,
      body: (
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <div>
            <label style={lbl}>Comment saisir ta VMA ?</label>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              {[['direct','Je connais ma VMA'],['race','Depuis un chrono récent']].map(([v,l])=>(
                <button key={v} onClick={()=>upd('vmaMode',v)} style={toggle(form.vmaMode===v)}>{l}</button>
              ))}
            </div>
          </div>
          {form.vmaMode==='direct' ? (
            <div>
              <label style={lbl}>VMA (km/h)</label>
              <input type="number" style={inp} min="8" max="25" step="0.5" value={form.vma} onChange={e=>upd('vma',e.target.value)}/>
              <p style={{fontSize:11,color:'rgba(255,255,255,0.25)',marginTop:6}}>Moyenne loisir : 12–15 km/h</p>
            </div>
          ) : (
            <>
              <div>
                <label style={lbl}>Distance récente</label>
                <select style={inp} value={form.raceDistKm} onChange={e=>upd('raceDistKm',e.target.value)}>
                  {[[1,'1 km'],[3,'3 km'],[5,'5 km'],[10,'10 km'],[15,'15 km'],[21.1,'Semi-marathon'],[42.2,'Marathon']].map(([v,l])=>(
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={lbl}>Chrono (en minutes)</label>
                <input type="number" style={inp} placeholder="ex: 55" value={form.raceTimeMins} onChange={e=>upd('raceTimeMins',e.target.value)}/>
              </div>
              {form.raceTimeMins && (
                <div style={{background:'rgba(249,115,22,0.08)',border:'1px solid rgba(249,115,22,0.2)',borderRadius:12,padding:'10px 14px',fontSize:12,color:'rgba(255,255,255,0.5)'}}>
                  VMA estimée : <span style={{color:'#FF0040',fontWeight:700,fontFamily:'monospace'}}>{computedVma.toFixed(1)} km/h</span>
                </div>
              )}
            </>
          )}
        </div>
      )
    },
    {
      title:'Ton objectif course',
      sub:'Définissons la durée du programme',
      ok: true,
      body: (
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <div>
            <label style={lbl}>Nom de la course</label>
            <input style={inp} placeholder="Trail de la Fraise" value={form.raceName} onChange={e=>upd('raceName',e.target.value)}/>
          </div>
          <div>
            <label style={lbl}>Date de la course</label>
            <input type="date" style={inp} value={form.raceDate} onChange={e=>upd('raceDate',e.target.value)}/>
          </div>
          <div>
            <label style={lbl}>Durée du programme</label>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
              {[[8,'8 sem.'],[10,'10 sem.'],[12,'12 sem.']].map(([v,l])=>(
                <button key={v} onClick={()=>upd('weeks',v)} style={toggle(form.weeks===v)}>{l}</button>
              ))}
            </div>
          </div>
        </div>
      )
    }
  ];

  const lbl = {fontSize:12,color:'rgba(255,255,255,0.4)',display:'block',marginBottom:8};
  const inp = {background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',color:'#fff',borderRadius:12,padding:'12px 14px',width:'100%',fontSize:14,fontFamily:'inherit',outline:'none'};
  const toggle = (active) => ({
    background: active ? 'rgba(249,115,22,0.15)' : 'rgba(255,255,255,0.04)',
    border: `1px solid ${active ? 'rgba(249,115,22,0.5)' : 'rgba(255,255,255,0.08)'}`,
    color: active ? '#FF0040' : 'rgba(255,255,255,0.5)',
    borderRadius:12, padding:'10px 12px', fontSize:13, fontWeight:600,
    cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s',
  });

  const handleFinish = () => {
    onComplete({ ...form, vma: computedVma, weeks: +form.weeks });
  };

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:'24px 16px',background:'#07080b'}}>
      <div style={{width:'100%',maxWidth:460,background:'rgba(19,22,31,0.9)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:24,padding:'36px 32px'}}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:32}}>
          <div style={{width:34,height:34,borderRadius:10,background:'#FF0040',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:16,color:'#000'}}>P</div>
          <span style={{fontWeight:700,fontSize:18,letterSpacing:'-0.02em'}}>PacePro</span>
        </div>
        <div style={{display:'flex',gap:6,marginBottom:28,alignItems:'center'}}>
          {steps.map((_,i) => (
            <div key={i} style={{width: i===step?20:8, height:8, borderRadius:99, background: i===step?'#FF0040':i<step?'#22c55e':'rgba(255,255,255,0.15)', transition:'all 0.3s'}}/>
          ))}
          <span style={{fontSize:11,color:'rgba(255,255,255,0.25)',fontFamily:'monospace',marginLeft:8}}>{step+1}/{steps.length}</span>
        </div>
        <h2 style={{fontSize:22,fontWeight:800,letterSpacing:'-0.03em',marginBottom:4}}>{steps[step].title}</h2>
        <p style={{fontSize:13,color:'rgba(255,255,255,0.4)',marginBottom:24}}>{steps[step].sub}</p>
        {steps[step].body}
        <div style={{display:'flex',gap:10,marginTop:28}}>
          {step > 0 && (
            <button onClick={()=>setStep(s=>s-1)}
              style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:12,padding:'12px 16px',color:'rgba(255,255,255,0.4)',cursor:'pointer',fontFamily:'inherit'}}>
              ←
            </button>
          )}
          <button onClick={step < steps.length-1 ? ()=>setStep(s=>s+1) : handleFinish}
            disabled={!steps[step].ok}
            style={{flex:1,background:'#FF0040',color:'#000',border:'none',borderRadius:12,padding:'12px 20px',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'inherit',opacity:steps[step].ok?1:0.4,transition:'all 0.2s'}}>
            {step < steps.length-1 ? 'Continuer →' : '🚀 Générer mon programme'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────
function Dashboard({ profile, plan, onReset }) {
  const [activeWeek, setActiveWeek] = useState(0);
  const [completed, setCompleted] = useState({});
  const paces = calcPaces(profile.vma);
  const totalSessions = plan.reduce((a,w)=>a+w.sessions.length,0);
  const doneCount = Object.values(completed).filter(Boolean).length;
  const progress = Math.round((doneCount/totalSessions)*100);
  const week = plan[activeWeek];
  const sessionDays = ['Mardi','Sam. / Dim.'];
  const nextSession = plan.flatMap(w=>w.sessions.map(s=>({...s,week:w.week}))).find(s=>!completed[s.id]);

  const navStyle = {position:'sticky',top:0,zIndex:50,background:'rgba(7,8,11,0.85)',backdropFilter:'blur(20px)',borderBottom:'1px solid rgba(255,255,255,0.06)',padding:'0 20px',height:56,display:'flex',alignItems:'center',justifyContent:'space-between'};

  return (
    <div style={{minHeight:'100vh',background:'#07080b',color:'#fff',fontFamily:'Syne, sans-serif'}}>
      {/* Nav */}
      <nav style={navStyle}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:30,height:30,borderRadius:8,background:'#FF0040',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:14,color:'#000'}}>P</div>
          <span style={{fontWeight:700,fontSize:16,letterSpacing:'-0.02em'}}>PacePro</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <span style={{fontSize:13,color:'rgba(255,255,255,0.5)'}}>{profile.name}</span>
          <button onClick={onReset} style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:8,padding:'4px 10px',color:'rgba(255,255,255,0.3)',fontSize:12,cursor:'pointer',fontFamily:'inherit'}}>
            Nouveau plan
          </button>
        </div>
      </nav>

      <main style={{maxWidth:1000,margin:'0 auto',padding:'28px 20px 60px'}}>
        {/* Bento stats */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:12,marginBottom:20}}>
          <div style={{...card, gridColumn:'span 2'}}>
            <div style={{fontSize:10,color:'rgba(255,255,255,0.3)',textTransform:'uppercase',letterSpacing:'0.1em',fontFamily:'monospace',marginBottom:10}}>Progression globale</div>
            <div style={{fontSize:15,fontWeight:700,marginBottom:8}}>{profile.raceName || 'Mon objectif'}</div>
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
            <div style={{fontSize:10,color:'rgba(255,255,255,0.3)',fontFamily:'monospace',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:4}}>Durée</div>
            <div style={{fontSize:28,fontWeight:800,fontFamily:'monospace'}}>{profile.weeks}</div>
            <div style={{fontSize:11,color:'rgba(255,255,255,0.3)'}}>semaines</div>
          </div>
        </div>

        {/* Allures */}
        <div style={{...card,marginBottom:20}}>
          <div style={{fontSize:11,color:'rgba(255,255,255,0.3)',fontFamily:'monospace',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12}}>Tes allures personnalisées</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
            {[['EF',paces.ef,'#22c55e'],['Tempo',paces.tempo,'#f59e0b'],['Seuil',paces.threshold,'#FF0040'],['VMA 90%',paces.vma90,'#ef4444'],['Récup',paces.recov,'rgba(255,255,255,0.3)']].map(([l,v,c])=>(
              <AllureChip key={l} dot={c} label={l} val={v+' /km'}/>
            ))}
          </div>
        </div>

        {/* Prochaine séance */}
        {nextSession && (
          <div style={{background:'rgba(249,115,22,0.06)',border:'1px solid rgba(249,115,22,0.2)',borderRadius:14,padding:'14px 18px',marginBottom:20}}>
            <div style={{fontSize:10,color:'#FF0040',textTransform:'uppercase',letterSpacing:'0.12em',fontFamily:'monospace',marginBottom:4}}>Prochaine séance — Semaine {nextSession.week}</div>
            <div style={{fontSize:15,fontWeight:700}}>{nextSession.title}</div>
            <div style={{fontSize:12,color:'rgba(255,255,255,0.4)',marginTop:2}}>{nextSession.detail}</div>
          </div>
        )}

        {/* Week tabs */}
        <div style={{display:'flex',gap:6,overflowX:'auto',paddingBottom:4,marginBottom:18}}>
          {plan.map((w,i)=>(
            <button key={i} onClick={()=>setActiveWeek(i)}
              style={{flexShrink:0,borderRadius:12,padding:'6px 14px',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit',transition:'all 0.2s',
                background: activeWeek===i?'rgba(249,115,22,0.15)':'rgba(255,255,255,0.04)',
                border:`1px solid ${activeWeek===i?'rgba(249,115,22,0.4)':'rgba(255,255,255,0.07)'}`,
                color: activeWeek===i?'#FF0040':'rgba(255,255,255,0.35)'}}>
              S{w.week}{w.isKey?' ★':''}
            </button>
          ))}
        </div>

        {/* Week header */}
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
          <button onClick={()=>setActiveWeek(w=>Math.max(0,w-1))} style={navBtn}>←</button>
          <div style={{flex:1}}>
            <div style={{fontSize:10,color:'rgba(255,255,255,0.2)',fontFamily:'monospace',letterSpacing:'0.1em'}}>{week.dateRange}</div>
            <div style={{display:'flex',alignItems:'center',gap:8,marginTop:4}}>
              <span style={{fontSize:17,fontWeight:700,letterSpacing:'-0.02em'}}>Semaine {week.week}</span>
              <span style={{fontSize:10,fontWeight:700,padding:'2px 9px',borderRadius:99,textTransform:'uppercase',letterSpacing:'0.08em',background:week.bg,color:week.color,border:`1px solid ${week.color}40`}}>{week.label}</span>
              {week.weeklyKm>0 && <span style={{fontSize:10,color:'rgba(255,255,255,0.2)',fontFamily:'monospace'}}>{week.weeklyKm} km est.</span>}
            </div>
          </div>
          <button onClick={()=>setActiveWeek(w=>Math.min(plan.length-1,w+1))} style={navBtn}>→</button>
        </div>

        {/* Sessions */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:12}}>
          {week.sessions.map((s,i)=>(
            <SessionCard key={s.id} session={{...s,completed:!!completed[s.id]}} day={sessionDays[i]}
              onComplete={id=>setCompleted(c=>({...c,[id]:!c[id]}))}/>
          ))}
        </div>

        {/* Race day */}
        {activeWeek===plan.length-1 && profile.raceName && (
          <div style={{marginTop:16,background:'rgba(245,158,11,0.07)',border:'1px solid rgba(245,158,11,0.25)',borderRadius:14,padding:'20px 24px'}}>
            <div style={{fontSize:10,color:'rgba(245,158,11,0.7)',fontFamily:'monospace',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:6}}>
              {profile.raceDate ? new Date(profile.raceDate).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'}) : 'Jour J'}
            </div>
            <div style={{fontSize:16,fontWeight:700,marginBottom:4}}>{profile.raceName} 🎯</div>
            <div style={{fontSize:12,color:'rgba(255,255,255,0.4)'}}>Allure cible plat : <span style={{color:'#fff',fontFamily:'monospace'}}>{paces.ef} /km</span></div>
          </div>
        )}
      </main>
    </div>
  );
}

const card = {background:'rgba(19,22,31,0.8)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:16,padding:'16px 18px'};
const navBtn = {background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:12,padding:'8px 12px',color:'rgba(255,255,255,0.4)',cursor:'pointer',fontFamily:'inherit',fontSize:16};

// ─── App principale ────────────────────────────────────────────────────────────
export default function PacePro() {
  const [profile, setProfile] = useState(null);
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    try {
      const p = localStorage.getItem('pp_profile');
      const pl = localStorage.getItem('pp_plan');
      if (p && pl) { setProfile(JSON.parse(p)); setPlan(JSON.parse(pl)); }
    } catch {}
  }, []);

  const handleOnboarding = (p) => {
    const generated = generatePlan(p);
    setProfile(p); setPlan(generated);
    try {
      localStorage.setItem('pp_profile', JSON.stringify(p));
      localStorage.setItem('pp_plan', JSON.stringify(generated));
    } catch {}
  };

  const handleReset = () => {
    setProfile(null); setPlan(null);
    try { localStorage.removeItem('pp_profile'); localStorage.removeItem('pp_plan'); } catch {}
  };

  if (!profile || !plan) return <Onboarding onComplete={handleOnboarding}/>;
  return <Dashboard profile={profile} plan={plan} onReset={handleReset}/>;
}
