'use client';
import { useState, useEffect } from 'react';

// ─── Styles communs ───────────────────────────────────────────────────────────
const card = {background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:16,padding:'16px 18px'};
const lbl = {fontSize:12,color:'var(--text-muted)',display:'block',marginBottom:8};
const inp = () => ({background:'var(--bg-input)',border:'1px solid var(--border-input)',color:'var(--text-primary)',borderRadius:12,padding:'10px 14px',width:'100%',fontSize:14,fontFamily:'inherit',outline:'none'});
const tog = (a) => ({background:a?'rgba(255,0,64,0.15)':'var(--btn-ghost-bg)',border:`1px solid ${a?'rgba(255,0,64,0.5)':'var(--btn-ghost-border)'}`,color:a?'#FF0040':'var(--btn-ghost-color)',borderRadius:12,padding:'8px 12px',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit',transition:'all 0.2s'});
const btnPrimary = {background:'#FF0040',color:'#000',border:'none',borderRadius:12,padding:'12px 20px',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'inherit',transition:'all 0.2s'};
const btnGhost = {background:'var(--btn-ghost-bg)',border:'1px solid var(--btn-ghost-border)',color:'var(--btn-ghost-color)',borderRadius:12,padding:'10px 16px',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit'};

// ─── Exercices prédéfinis ─────────────────────────────────────────────────────
const EXERCISES = {
  'Poitrine':     ['Développé couché','Développé incliné','Écarté haltères','Pompes','Dips'],
  'Dos':          ['Tractions','Tirage horizontal','Rowing haltère','Soulevé de terre','Pull-over'],
  'Épaules':      ['Développé militaire','Élévations latérales','Face pull','Arnold press'],
  'Biceps':       ['Curl haltères','Curl barre','Curl concentré','Hammer curl'],
  'Triceps':      ['Dips','Extensions triceps','Kickback','Barre au front'],
  'Jambes':       ['Squat','Presse à cuisses','Fentes','Leg curl','Mollets'],
  'Abdos':        ['Crunch','Planche','Relevé de jambes','Russian twist','Gainage'],
  'Fonctionnel':  ['Burpees','Box jump','Kettlebell swing','Turkish get-up','Bear crawl'],
};

const MUSCLE_GROUPS = Object.keys(EXERCISES);

// ─── Utilitaires ──────────────────────────────────────────────────────────────
function genId() { return Math.random().toString(36).slice(2,9); }
function fmtDate(iso) { return new Date(iso).toLocaleDateString('fr-FR',{weekday:'short',day:'numeric',month:'short'}); }
function fmtDuration(mins) { return mins >= 60 ? `${Math.floor(mins/60)}h${mins%60>0?String(mins%60).padStart(2,'0'):''}` : `${mins} min`; }

// ─── Composant série ──────────────────────────────────────────────────────────
function SetRow({ set, idx, onChange, onDelete }) {
  return (
    <div style={{display:'grid',gridTemplateColumns:'28px 1fr 1fr 1fr 32px',gap:6,alignItems:'center',marginBottom:6}}>
      <div style={{fontSize:11,color:'var(--text-muted)',fontFamily:'monospace',textAlign:'center'}}>{idx+1}</div>
      <input type="number" placeholder="kg" value={set.weight} onChange={e=>onChange({...set,weight:e.target.value})}
        style={{...inp(),padding:'8px 10px',fontSize:13,textAlign:'center'}}/>
      <input type="number" placeholder="reps" value={set.reps} onChange={e=>onChange({...set,reps:e.target.value})}
        style={{...inp(),padding:'8px 10px',fontSize:13,textAlign:'center'}}/>
      <button onClick={()=>onChange({...set,done:!set.done})}
        style={{...tog(set.done),padding:'8px',fontSize:12,borderRadius:8}}>
        {set.done ? '✓ Ok' : '○'}
      </button>
      <button onClick={onDelete} style={{background:'none',border:'none',color:'rgba(239,68,68,0.5)',cursor:'pointer',fontSize:16,padding:0}}>×</button>
    </div>
  );
}

// ─── Composant exercice ───────────────────────────────────────────────────────
function ExerciseCard({ exercise, onChange, onDelete }) {
  const addSet = () => onChange({...exercise, sets:[...exercise.sets,{id:genId(),weight:'',reps:'',done:false}]});
  const updateSet = (i,s) => onChange({...exercise,sets:exercise.sets.map((x,xi)=>xi===i?s:x)});
  const deleteSet = (i) => onChange({...exercise,sets:exercise.sets.filter((_,xi)=>xi!==i)});
  const allDone = exercise.sets.length>0 && exercise.sets.every(s=>s.done);

  return (
    <div style={{...card,marginBottom:10,borderColor:allDone?'rgba(34,197,94,0.3)':'var(--border)',background:allDone?'rgba(34,197,94,0.04)':'var(--bg-card)'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <div>
          <div style={{fontSize:15,fontWeight:700,color:'var(--text-primary)'}}>{exercise.name}</div>
          {exercise.muscleGroup && <div style={{fontSize:11,color:'var(--text-muted)',marginTop:2}}>{exercise.muscleGroup}</div>}
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          {allDone && <span style={{fontSize:18}}>✅</span>}
          <button onClick={onDelete} style={{...btnGhost,padding:'4px 10px',fontSize:11,color:'rgba(239,68,68,0.6)',borderColor:'rgba(239,68,68,0.2)'}}>Suppr.</button>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'28px 1fr 1fr 1fr 32px',gap:6,marginBottom:6}}>
        <div/>
        <div style={{fontSize:10,color:'var(--text-muted)',textAlign:'center',fontFamily:'monospace'}}>KG</div>
        <div style={{fontSize:10,color:'var(--text-muted)',textAlign:'center',fontFamily:'monospace'}}>REPS</div>
        <div style={{fontSize:10,color:'var(--text-muted)',textAlign:'center',fontFamily:'monospace'}}>FAIT</div>
        <div/>
      </div>
      {exercise.sets.map((s,i) => (
        <SetRow key={s.id} set={s} idx={i} onChange={s=>updateSet(i,s)} onDelete={()=>deleteSet(i)}/>
      ))}
      <button onClick={addSet} style={{...btnGhost,width:'100%',marginTop:6,fontSize:12,padding:'7px'}}>+ Ajouter une série</button>
      {exercise.notes !== undefined && (
        <input placeholder="Notes (optionnel)" value={exercise.notes} onChange={e=>onChange({...exercise,notes:e.target.value})}
          style={{...inp(),marginTop:8,fontSize:12,padding:'8px 12px'}}/>
      )}
    </div>
  );
}

// ─── Modal ajout exercice ─────────────────────────────────────────────────────
function AddExerciseModal({ onAdd, onClose }) {
  const [mode, setMode] = useState('list'); // 'list' | 'custom'
  const [group, setGroup] = useState('Poitrine');
  const [custom, setCustom] = useState('');

  const handleAdd = (name, grp) => {
    onAdd({ id:genId(), name, muscleGroup:grp, sets:[{id:genId(),weight:'',reps:'',done:false}], notes:'' });
    onClose();
  };

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',zIndex:200,display:'flex',alignItems:'flex-end',justifyContent:'center',padding:'0 0 0 0'}}>
      <div style={{width:'100%',maxWidth:500,background:'var(--bg-modal)',borderRadius:'20px 20px 0 0',padding:'24px 20px 40px',maxHeight:'85vh',overflowY:'auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <span style={{fontSize:16,fontWeight:700,color:'var(--text-primary)'}}>Ajouter un exercice</span>
          <button onClick={onClose} style={{...btnGhost,padding:'4px 10px',fontSize:13}}>×</button>
        </div>
        <div style={{display:'flex',gap:8,marginBottom:16}}>
          <button onClick={()=>setMode('list')} style={tog(mode==='list')}>📋 Liste</button>
          <button onClick={()=>setMode('custom')} style={tog(mode==='custom')}>✏️ Personnalisé</button>
        </div>
        {mode==='custom' ? (
          <div>
            <label style={lbl}>Nom de l'exercice</label>
            <input style={inp()} placeholder="Ex: Hip thrust, Good morning..." value={custom} onChange={e=>setCustom(e.target.value)}/>
            <div style={{marginTop:12}}>
              <label style={lbl}>Groupe musculaire</label>
              <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                {MUSCLE_GROUPS.map(g=><button key={g} onClick={()=>setGroup(g)} style={{...tog(group===g),fontSize:11,padding:'5px 10px'}}>{g}</button>)}
              </div>
            </div>
            <button onClick={()=>custom&&handleAdd(custom,group)} style={{...btnPrimary,width:'100%',marginTop:16,opacity:custom?1:0.4}}>Ajouter</button>
          </div>
        ) : (
          <div>
            <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:14}}>
              {MUSCLE_GROUPS.map(g=><button key={g} onClick={()=>setGroup(g)} style={{...tog(group===g),fontSize:11,padding:'5px 10px'}}>{g}</button>)}
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {EXERCISES[group].map(ex=>(
                <button key={ex} onClick={()=>handleAdd(ex,group)}
                  style={{...btnGhost,textAlign:'left',padding:'10px 14px',fontSize:13,color:'var(--text-primary)'}}>
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Générateur IA ────────────────────────────────────────────────────────────
function AIGenerator({ onGenerate, onClose }) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const suggestions = [
    'Full body 45 min en salle, objectif force',
    'Séance pectoraux et triceps hypertrophie',
    'Jambes maison sans matériel, je suis fatigué',
    'Push pull legs - jour push, niveau intermédiaire',
    'Séance rapide 30 min abdos et cardio',
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: `Tu es un coach sportif expert. Génère une séance de musculation basée sur cette demande : "${prompt}".

Réponds UNIQUEMENT en JSON valide, sans markdown, sans backticks, sans texte avant ou après. Format exact :
{
  "name": "Nom de la séance",
  "duration": 45,
  "exercises": [
    {
      "name": "Nom exercice",
      "muscleGroup": "Groupe musculaire",
      "sets": [
        {"weight": "80", "reps": "8"},
        {"weight": "80", "reps": "8"},
        {"weight": "75", "reps": "10"}
      ],
      "notes": "Conseil technique court"
    }
  ]
}

Règles :
- 4 à 7 exercices selon la durée
- 2 à 5 séries par exercice
- Poids adaptés à un niveau intermédiaire (ajuste si précisé)
- Notes courtes et utiles
- muscleGroup doit être parmi : Poitrine, Dos, Épaules, Biceps, Triceps, Jambes, Abdos, Fonctionnel`
          }]
        })
      });
      const data = await response.json();
      const text = data.content?.[0]?.text || '';
      const clean = text.replace(/```json|```/g,'').trim();
      const parsed = JSON.parse(clean);
      // Normalize
      const session = {
        id: genId(),
        name: parsed.name || 'Séance IA',
        duration: parsed.duration || 45,
        date: new Date().toISOString(),
        exercises: (parsed.exercises || []).map(ex => ({
          id: genId(),
          name: ex.name,
          muscleGroup: ex.muscleGroup || '',
          notes: ex.notes || '',
          sets: (ex.sets || []).map(s => ({
            id: genId(),
            weight: String(s.weight || ''),
            reps: String(s.reps || ''),
            done: false,
          }))
        })),
        fromAI: true,
        aiPrompt: prompt,
        completed: false,
      };
      onGenerate(session);
    } catch(e) {
      setError('Erreur lors de la génération. Réessaie.');
    }
    setLoading(false);
  };

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{width:'100%',maxWidth:460,background:'var(--bg-modal)',border:'1px solid var(--border)',borderRadius:20,padding:'28px 24px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
          <span style={{fontSize:16,fontWeight:700,color:'var(--text-primary)'}}>🤖 Générer une séance</span>
          <button onClick={onClose} style={{...btnGhost,padding:'4px 10px',fontSize:13}}>×</button>
        </div>
        <p style={{fontSize:12,color:'var(--text-muted)',marginBottom:20}}>Décris ta séance idéale et l'IA la crée pour toi.</p>

        <label style={lbl}>Ton objectif du jour</label>
        <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Ex: Full body 45 min en salle, je suis en forme aujourd'hui, objectif hypertrophie..."
          style={{...inp(),height:80,resize:'none',lineHeight:1.5,marginBottom:12}}/>

        <div style={{marginBottom:16}}>
          <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:8}}>Suggestions rapides</div>
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            {suggestions.map((s,i)=>(
              <button key={i} onClick={()=>setPrompt(s)}
                style={{...btnGhost,textAlign:'left',fontSize:12,padding:'8px 12px',color:'var(--text-secondary)'}}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {error && <div style={{color:'#ef4444',fontSize:12,marginBottom:12}}>{error}</div>}

        <button onClick={handleGenerate} disabled={loading||!prompt.trim()}
          style={{...btnPrimary,width:'100%',opacity:loading||!prompt.trim()?0.5:1}}>
          {loading ? '⏳ Génération en cours...' : '✨ Générer la séance'}
        </button>
      </div>
    </div>
  );
}

// ─── Vue séance active ────────────────────────────────────────────────────────
function ActiveSession({ session, onSave, onCancel }) {
  const [exercises, setExercises] = useState(session.exercises);
  const [showAddEx, setShowAddEx] = useState(false);
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now()-startTime)/60000)), 10000);
    return () => clearInterval(t);
  }, []);

  const updateEx = (i, ex) => setExercises(exs => exs.map((x,xi)=>xi===i?ex:x));
  const deleteEx = (i) => setExercises(exs => exs.filter((_,xi)=>xi!==i));
  const addEx = (ex) => setExercises(exs => [...exs, ex]);

  const totalSets = exercises.reduce((a,ex)=>a+ex.sets.length,0);
  const doneSets = exercises.reduce((a,ex)=>a+ex.sets.filter(s=>s.done).length,0);
  const progress = totalSets > 0 ? Math.round((doneSets/totalSets)*100) : 0;

  const handleSave = () => {
    onSave({
      ...session,
      exercises,
      duration: elapsed || session.duration,
      completed: true,
      completedAt: new Date().toISOString(),
    });
  };

  return (
    <div style={{minHeight:'100vh',background:'var(--bg-primary)',color:'var(--text-primary)',fontFamily:'Syne,sans-serif',paddingBottom:100}}>
      {showAddEx && <AddExerciseModal onAdd={addEx} onClose={()=>setShowAddEx(false)}/>}

      {/* Header */}
      <div style={{position:'sticky',top:0,zIndex:50,background:'var(--bg-nav)',backdropFilter:'blur(20px)',borderBottom:'1px solid var(--border-nav)',padding:'12px 20px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:'var(--text-primary)'}}>{session.name}</div>
            <div style={{fontSize:11,color:'var(--text-muted)',fontFamily:'monospace'}}>{elapsed} min · {doneSets}/{totalSets} séries</div>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button onClick={onCancel} style={{...btnGhost,fontSize:12,padding:'6px 12px'}}>Annuler</button>
            <button onClick={handleSave} style={{...btnPrimary,fontSize:12,padding:'6px 14px'}}>Terminer ✓</button>
          </div>
        </div>
        <div style={{height:3,background:'var(--progress-track)',borderRadius:99}}>
          <div style={{height:'100%',borderRadius:99,background:'linear-gradient(90deg,#FF0040,#f59e0b)',width:`${progress}%`,transition:'width 0.4s'}}/>
        </div>
      </div>

      <div style={{padding:'16px 16px 0'}}>
        {exercises.map((ex,i) => (
          <ExerciseCard key={ex.id} exercise={ex} onChange={ex=>updateEx(i,ex)} onDelete={()=>deleteEx(i)}/>
        ))}
        <button onClick={()=>setShowAddEx(true)} style={{...btnGhost,width:'100%',padding:'12px',fontSize:13,marginTop:4}}>
          + Ajouter un exercice
        </button>
      </div>
    </div>
  );
}

// ─── Historique séance ────────────────────────────────────────────────────────
function SessionHistory({ session, onClose }) {
  return (
    <div style={{position:'fixed',inset:0,background:'var(--bg-primary)',zIndex:150,overflowY:'auto'}}>
      <div style={{position:'sticky',top:0,background:'var(--bg-nav)',backdropFilter:'blur(20px)',borderBottom:'1px solid var(--border-nav)',padding:'14px 20px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <div style={{fontSize:15,fontWeight:700,color:'var(--text-primary)'}}>{session.name}</div>
          <div style={{fontSize:11,color:'var(--text-muted)',fontFamily:'monospace'}}>{fmtDate(session.date)} · {fmtDuration(session.duration)}</div>
        </div>
        <button onClick={onClose} style={{...btnGhost,fontSize:13,padding:'6px 12px'}}>← Retour</button>
      </div>
      <div style={{padding:16}}>
        {session.aiPrompt && (
          <div style={{...card,marginBottom:12,borderColor:'rgba(255,0,64,0.2)',background:'rgba(255,0,64,0.04)'}}>
            <div style={{fontSize:10,color:'#FF0040',fontFamily:'monospace',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:4}}>Généré par IA</div>
            <div style={{fontSize:12,color:'var(--text-secondary)'}}>{session.aiPrompt}</div>
          </div>
        )}
        {session.exercises.map(ex => (
          <div key={ex.id} style={{...card,marginBottom:10}}>
            <div style={{fontSize:14,fontWeight:700,color:'var(--text-primary)',marginBottom:2}}>{ex.name}</div>
            <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:10}}>{ex.muscleGroup}</div>
            <div style={{display:'grid',gridTemplateColumns:'28px 1fr 1fr 1fr',gap:6,marginBottom:6}}>
              <div/><div style={{fontSize:10,color:'var(--text-muted)',fontFamily:'monospace',textAlign:'center'}}>KG</div>
              <div style={{fontSize:10,color:'var(--text-muted)',fontFamily:'monospace',textAlign:'center'}}>REPS</div>
              <div style={{fontSize:10,color:'var(--text-muted)',fontFamily:'monospace',textAlign:'center'}}>STATUT</div>
            </div>
            {ex.sets.map((s,i) => (
              <div key={s.id} style={{display:'grid',gridTemplateColumns:'28px 1fr 1fr 1fr',gap:6,marginBottom:4,alignItems:'center'}}>
                <div style={{fontSize:11,color:'var(--text-muted)',fontFamily:'monospace',textAlign:'center'}}>{i+1}</div>
                <div style={{fontSize:13,textAlign:'center',color:'var(--text-primary)',fontFamily:'monospace'}}>{s.weight||'—'} kg</div>
                <div style={{fontSize:13,textAlign:'center',color:'var(--text-primary)',fontFamily:'monospace'}}>{s.reps||'—'}</div>
                <div style={{fontSize:12,textAlign:'center',color:s.done?'#22c55e':'var(--text-muted)'}}>{s.done?'✓':'○'}</div>
              </div>
            ))}
            {ex.notes && <div style={{fontSize:11,color:'var(--text-muted)',marginTop:8,fontStyle:'italic'}}>{ex.notes}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page principale Muscu ────────────────────────────────────────────────────
export default function Muscu() {
  const [view, setView] = useState('home'); // 'home' | 'active' | 'history-detail'
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [detailSession, setDetailSession] = useState(null);
  const [showAI, setShowAI] = useState(false);
  const [showNewSession, setShowNewSession] = useState(false);
  const [newName, setNewName] = useState('');

  // Load from localStorage
  useEffect(() => {
    try { const s=localStorage.getItem('muscu_sessions'); if(s) setSessions(JSON.parse(s)); } catch{}
  },[]);

  const saveSessions = (s) => { setSessions(s); try{localStorage.setItem('muscu_sessions',JSON.stringify(s));}catch{} };

  const startSession = (session) => {
    setActiveSession(session);
    setView('active');
    setShowAI(false);
    setShowNewSession(false);
  };

  const startNew = () => {
    if (!newName.trim()) return;
    startSession({ id:genId(), name:newName, duration:0, date:new Date().toISOString(), exercises:[], fromAI:false, completed:false });
    setNewName('');
  };

  const saveSession = (session) => {
    const updated = [session, ...sessions];
    saveSessions(updated);
    setView('home');
    setActiveSession(null);
  };

  const deleteSession = (id) => {
    saveSessions(sessions.filter(s=>s.id!==id));
  };

  // Stats
  const totalSessions = sessions.filter(s=>s.completed).length;
  const totalVolume = sessions.filter(s=>s.completed).reduce((a,s)=>
    a + s.exercises.reduce((b,ex)=>
      b + ex.sets.filter(st=>st.done).reduce((c,st)=>c+(+st.weight||0)*(+st.reps||0),0),0),0);
  const avgDuration = totalSessions > 0
    ? Math.round(sessions.filter(s=>s.completed).reduce((a,s)=>a+s.duration,0)/totalSessions) : 0;

  if (view==='active' && activeSession) {
    return <ActiveSession session={activeSession} onSave={saveSession} onCancel={()=>{setView('home');setActiveSession(null);}}/>;
  }
  if (view==='history-detail' && detailSession) {
    return <SessionHistory session={detailSession} onClose={()=>{setView('home');setDetailSession(null);}}/>;
  }

  return (
    <div style={{minHeight:'100vh',background:'var(--bg-primary)',color:'var(--text-primary)',fontFamily:'Syne,sans-serif',paddingBottom:80}}>
      {showAI && <AIGenerator onGenerate={startSession} onClose={()=>setShowAI(false)}/>}

      {/* Header */}
      <div style={{padding:'20px 16px 0'}}>
        <h1 style={{fontSize:24,fontWeight:800,letterSpacing:'-0.03em',marginBottom:4}}>Musculation 💪</h1>
        <p style={{fontSize:13,color:'var(--text-muted)',marginBottom:20}}>Crée ou génère ta séance du jour</p>

        {/* Stats */}
        {totalSessions > 0 && (
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:20}}>
            {[
              ['Séances',totalSessions,''],
              ['Volume',`${Math.round(totalVolume/1000)}k`,'kg'],
              ['Durée moy.',avgDuration,'min'],
            ].map(([l,v,u])=>(
              <div key={l} style={card}>
                <div style={{fontSize:10,color:'var(--text-muted)',fontFamily:'monospace',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:4}}>{l}</div>
                <div style={{fontSize:20,fontWeight:800,fontFamily:'monospace',color:'var(--text-primary)'}}>{v}<span style={{fontSize:11,color:'var(--text-muted)'}}>{u}</span></div>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:20}}>
          <button onClick={()=>setShowNewSession(!showNewSession)}
            style={{...btnPrimary,padding:'14px',display:'flex',flexDirection:'column',alignItems:'center',gap:4,borderRadius:14}}>
            <span style={{fontSize:22}}>➕</span>
            <span style={{fontSize:13}}>Nouvelle séance</span>
          </button>
          <button onClick={()=>setShowAI(true)}
            style={{background:'rgba(255,0,64,0.08)',border:'1px solid rgba(255,0,64,0.25)',color:'#FF0040',borderRadius:14,padding:'14px',display:'flex',flexDirection:'column',alignItems:'center',gap:4,cursor:'pointer',fontFamily:'inherit'}}>
            <span style={{fontSize:22}}>🤖</span>
            <span style={{fontSize:13,fontWeight:700}}>Générer avec IA</span>
          </button>
        </div>

        {/* New session form */}
        {showNewSession && (
          <div style={{...card,marginBottom:16,borderColor:'rgba(255,0,64,0.2)'}}>
            <label style={lbl}>Nom de la séance</label>
            <div style={{display:'flex',gap:8}}>
              <input style={{...inp(),flex:1}} placeholder="Ex: Push Day, Full Body..." value={newName} onChange={e=>setNewName(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&startNew()}/>
              <button onClick={startNew} disabled={!newName.trim()} style={{...btnPrimary,padding:'10px 16px',opacity:newName.trim()?1:0.4}}>
                Démarrer →
              </button>
            </div>
            <div style={{marginTop:12}}>
              <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:8}}>Ou choisir un template :</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                {['Push Day','Pull Day','Leg Day','Full Body','Upper Body','Abdos & Cardio'].map(t=>(
                  <button key={t} onClick={()=>{ setNewName(t); }} style={{...tog(newName===t),fontSize:11,padding:'5px 10px'}}>{t}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Historique */}
        {sessions.length > 0 && (
          <div>
            <div style={{fontSize:12,color:'var(--text-muted)',fontFamily:'monospace',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12}}>Historique</div>
            {sessions.map(s => {
              const doneSets = s.exercises.reduce((a,ex)=>a+ex.sets.filter(st=>st.done).length,0);
              const totalS = s.exercises.reduce((a,ex)=>a+ex.sets.length,0);
              const vol = s.exercises.reduce((a,ex)=>a+ex.sets.filter(st=>st.done).reduce((b,st)=>b+(+st.weight||0)*(+st.reps||0),0),0);
              return (
                <div key={s.id} style={{...card,marginBottom:10,cursor:'pointer'}} onClick={()=>{setDetailSession(s);setView('history-detail');}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                    <div style={{flex:1}}>
                      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                        <span style={{fontSize:14,fontWeight:700,color:'var(--text-primary)'}}>{s.name}</span>
                        {s.fromAI && <span style={{fontSize:9,background:'rgba(255,0,64,0.12)',color:'#FF0040',padding:'1px 6px',borderRadius:99,fontWeight:700}}>IA</span>}
                        {s.completed && <span style={{fontSize:12}}>✅</span>}
                      </div>
                      <div style={{fontSize:11,color:'var(--text-muted)',fontFamily:'monospace'}}>
                        {fmtDate(s.date)} · {fmtDuration(s.duration)} · {s.exercises.length} exercices · {doneSets}/{totalS} séries
                      </div>
                      {vol > 0 && <div style={{fontSize:11,color:'var(--text-muted)',fontFamily:'monospace',marginTop:2}}>Volume : {vol.toLocaleString('fr-FR')} kg</div>}
                    </div>
                    <div style={{display:'flex',gap:6,alignItems:'center',marginLeft:10,flexShrink:0}}>
                      <span style={{fontSize:16,color:'#FF0040',fontWeight:800}}>→</span>
                      <button onClick={e=>{e.stopPropagation();deleteSession(s.id);}}
                        style={{background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.15)',borderRadius:8,padding:'3px 7px',color:'rgba(239,68,68,0.5)',fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>
                        ×
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {sessions.length === 0 && (
          <div style={{textAlign:'center',padding:'40px 20px',color:'var(--text-muted)'}}>
            <div style={{fontSize:40,marginBottom:12}}>🏋️</div>
            <div style={{fontSize:14,fontWeight:600,color:'var(--text-secondary)',marginBottom:4}}>Aucune séance encore</div>
            <div style={{fontSize:12}}>Crée ta première séance ou génère-en une avec l'IA !</div>
          </div>
        )}
      </div>
    </div>
  );
}
