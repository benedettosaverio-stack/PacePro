'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

// ═══════════════════════════════════════════════════════════════════════════════
// DATABASE — Base de données relationnelle des exercices
// ═══════════════════════════════════════════════════════════════════════════════
const DB = [
  // PECTORAUX
  { id:'e001', name:'Développé couché barre',    primary:'pecs',     secondary:['triceps','epaules'], equipment:['barre','banc'], curve:'peak', difficulty:2, tags:['pousser','compound','force'] },
  { id:'e002', name:'Développé couché haltères', primary:'pecs',     secondary:['triceps','epaules'], equipment:['halteres','banc'], curve:'stretch', difficulty:2, tags:['pousser','compound'] },
  { id:'e003', name:'Développé incliné barre',   primary:'pecs',     secondary:['epaules','triceps'], equipment:['barre','banc'], curve:'peak', difficulty:2, tags:['pousser','compound','pecs_haut'] },
  { id:'e004', name:'Écarté haltères',           primary:'pecs',     secondary:[], equipment:['halteres','banc'], curve:'stretch', difficulty:1, tags:['pousser','isolation','pecs'] },
  { id:'e005', name:'Écarté poulie',             primary:'pecs',     secondary:[], equipment:['poulie'], curve:'constant', difficulty:1, tags:['pousser','isolation'] },
  { id:'e006', name:'Dips',                      primary:'triceps',  secondary:['pecs','epaules'], equipment:['barre_dips'], curve:'stretch', difficulty:2, tags:['pousser','compound'] },
  { id:'e007', name:'Pompes',                    primary:'pecs',     secondary:['triceps','epaules'], equipment:[], curve:'peak', difficulty:1, tags:['pousser','compound','maison'] },
  { id:'e008', name:'Pec deck machine',          primary:'pecs',     secondary:[], equipment:['machine'], curve:'constant', difficulty:1, tags:['pousser','isolation'] },
  // DOS
  { id:'e010', name:'Tractions prise large',     primary:'dos',      secondary:['biceps','epaules'], equipment:['barre_traction'], curve:'stretch', difficulty:3, tags:['tirer','compound','poids_corps'] },
  { id:'e011', name:'Tirage horizontal câble',   primary:'dos',      secondary:['biceps','lombaires'], equipment:['poulie'], curve:'constant', difficulty:1, tags:['tirer','compound'] },
  { id:'e012', name:'Rowing haltère',            primary:'dos',      secondary:['biceps','lombaires'], equipment:['halteres','banc'], curve:'stretch', difficulty:2, tags:['tirer','compound','unilateral'] },
  { id:'e013', name:'Rowing barre',              primary:'dos',      secondary:['biceps','lombaires'], equipment:['barre'], curve:'stretch', difficulty:3, tags:['tirer','compound','force'] },
  { id:'e014', name:'Soulevé de terre',          primary:'dos',      secondary:['lombaires','fessiers','quadris'], equipment:['barre'], curve:'peak', difficulty:4, tags:['tirer','compound','force','full_body'] },
  { id:'e015', name:'Tirage nuque câble',        primary:'dos',      secondary:['biceps'], equipment:['poulie'], curve:'constant', difficulty:1, tags:['tirer','compound'] },
  { id:'e016', name:'Pull-over câble',           primary:'dos',      secondary:['pecs'], equipment:['poulie'], curve:'stretch', difficulty:1, tags:['tirer','isolation'] },
  // ÉPAULES
  { id:'e020', name:'Développé militaire barre', primary:'epaules',  secondary:['triceps','pecs'], equipment:['barre'], curve:'peak', difficulty:3, tags:['pousser','compound','force'] },
  { id:'e021', name:'Développé haltères assis',  primary:'epaules',  secondary:['triceps'], equipment:['halteres','banc'], curve:'peak', difficulty:2, tags:['pousser','compound'] },
  { id:'e022', name:'Élévations latérales',      primary:'epaules',  secondary:[], equipment:['halteres'], curve:'stretch', difficulty:1, tags:['isolation','deltoide_lateral'] },
  { id:'e023', name:'Élévations frontales',      primary:'epaules',  secondary:[], equipment:['halteres'], curve:'stretch', difficulty:1, tags:['isolation','deltoide_ant'] },
  { id:'e024', name:'Face pull câble',           primary:'epaules',  secondary:['dos'], equipment:['poulie'], curve:'constant', difficulty:1, tags:['tirer','isolation','deltoide_post','sante'] },
  { id:'e025', name:'Arnold press',              primary:'epaules',  secondary:['triceps'], equipment:['halteres','banc'], curve:'peak', difficulty:2, tags:['pousser','compound'] },
  // BICEPS
  { id:'e030', name:'Curl barre',                primary:'biceps',   secondary:['avant_bras'], equipment:['barre'], curve:'peak', difficulty:1, tags:['tirer','isolation','force'] },
  { id:'e031', name:'Curl haltères alterné',     primary:'biceps',   secondary:['avant_bras'], equipment:['halteres'], curve:'peak', difficulty:1, tags:['tirer','isolation','unilateral'] },
  { id:'e032', name:'Curl concentré',            primary:'biceps',   secondary:[], equipment:['halteres','banc'], curve:'peak', difficulty:1, tags:['tirer','isolation','pic'] },
  { id:'e033', name:'Hammer curl',              primary:'biceps',   secondary:['avant_bras'], equipment:['halteres'], curve:'peak', difficulty:1, tags:['tirer','isolation','brachioradial'] },
  { id:'e034', name:'Curl câble basse',         primary:'biceps',   secondary:[], equipment:['poulie'], curve:'constant', difficulty:1, tags:['tirer','isolation'] },
  { id:'e035', name:'Chin-up',                  primary:'biceps',   secondary:['dos'], equipment:['barre_traction'], curve:'stretch', difficulty:3, tags:['tirer','compound','poids_corps'] },
  // TRICEPS
  { id:'e040', name:'Extensions poulie haute',  primary:'triceps',  secondary:[], equipment:['poulie'], curve:'constant', difficulty:1, tags:['pousser','isolation'] },
  { id:'e041', name:'Barre au front',           primary:'triceps',  secondary:[], equipment:['barre','banc'], curve:'stretch', difficulty:2, tags:['pousser','isolation','long_chef'] },
  { id:'e042', name:'Développé serré',          primary:'triceps',  secondary:['pecs'], equipment:['barre','banc'], curve:'peak', difficulty:2, tags:['pousser','compound','force'] },
  { id:'e043', name:'Kickback haltère',         primary:'triceps',  secondary:[], equipment:['halteres'], curve:'peak', difficulty:1, tags:['pousser','isolation','unilateral'] },
  { id:'e044', name:'Extensions nuque haltère', primary:'triceps',  secondary:[], equipment:['halteres'], curve:'stretch', difficulty:1, tags:['pousser','isolation','long_chef'] },
  // QUADRICEPS
  { id:'e050', name:'Squat barre',              primary:'quadris',  secondary:['fessiers','lombaires'], equipment:['barre','rack'], curve:'stretch', difficulty:4, tags:['pousser','compound','force','full_body'] },
  { id:'e051', name:'Gobelet squat',            primary:'quadris',  secondary:['fessiers'], equipment:['halteres'], curve:'stretch', difficulty:2, tags:['pousser','compound','technique'] },
  { id:'e052', name:'Presse à cuisses',         primary:'quadris',  secondary:['fessiers'], equipment:['machine'], curve:'stretch', difficulty:1, tags:['pousser','compound'] },
  { id:'e053', name:'Fentes avant haltères',    primary:'quadris',  secondary:['fessiers'], equipment:['halteres'], curve:'stretch', difficulty:2, tags:['pousser','compound','unilateral'] },
  { id:'e054', name:'Leg extension',            primary:'quadris',  secondary:[], equipment:['machine'], curve:'peak', difficulty:1, tags:['pousser','isolation'] },
  { id:'e055', name:'Bulgarian split squat',    primary:'quadris',  secondary:['fessiers'], equipment:['halteres','banc'], curve:'stretch', difficulty:3, tags:['pousser','compound','unilateral','force'] },
  { id:'e056', name:'Hack squat machine',       primary:'quadris',  secondary:['fessiers'], equipment:['machine'], curve:'stretch', difficulty:2, tags:['pousser','compound'] },
  // ISCHIO / FESSIERS
  { id:'e060', name:'Hip thrust barre',         primary:'fessiers', secondary:['ischio'], equipment:['barre','banc'], curve:'peak', difficulty:2, tags:['pousser','compound','fessiers'] },
  { id:'e061', name:'Soulevé de terre roumain', primary:'ischio',   secondary:['fessiers','lombaires'], equipment:['barre'], curve:'stretch', difficulty:3, tags:['tirer','compound','force'] },
  { id:'e062', name:'Leg curl couché',          primary:'ischio',   secondary:[], equipment:['machine'], curve:'peak', difficulty:1, tags:['tirer','isolation'] },
  { id:'e063', name:'Good morning',             primary:'ischio',   secondary:['lombaires'], equipment:['barre'], curve:'stretch', difficulty:3, tags:['tirer','compound'] },
  { id:'e064', name:'Nordic curl',              primary:'ischio',   secondary:[], equipment:['barre_dips'], curve:'stretch', difficulty:4, tags:['tirer','isolation','excentrique'] },
  // MOLLETS / ABDOS
  { id:'e070', name:'Mollets debout machine',   primary:'mollets',  secondary:[], equipment:['machine'], curve:'stretch', difficulty:1, tags:['pousser','isolation'] },
  { id:'e071', name:'Mollets à la presse',      primary:'mollets',  secondary:[], equipment:['machine'], curve:'stretch', difficulty:1, tags:['pousser','isolation'] },
  { id:'e080', name:'Planche',                  primary:'abdos',    secondary:['lombaires'], equipment:[], curve:'constant', difficulty:1, tags:['gainage','core','maison'] },
  { id:'e081', name:'Relevé de jambes suspendu',primary:'abdos',    secondary:[], equipment:['barre_traction'], curve:'stretch', difficulty:2, tags:['gainage','isolation','abdos_bas'] },
  { id:'e082', name:'Ab wheel',                 primary:'abdos',    secondary:['lombaires'], equipment:['ab_wheel'], curve:'stretch', difficulty:3, tags:['gainage','core'] },
  { id:'e083', name:'Russian twist',            primary:'abdos',    secondary:[], equipment:['halteres'], curve:'peak', difficulty:1, tags:['gainage','obliques','rotation'] },
  { id:'e084', name:'Crunch câble',             primary:'abdos',    secondary:[], equipment:['poulie'], curve:'constant', difficulty:1, tags:['gainage','isolation'] },
  // LOMBAIRES
  { id:'e090', name:'Hyperextension',           primary:'lombaires',secondary:['fessiers','ischio'], equipment:['machine'], curve:'stretch', difficulty:1, tags:['tirer','isolation','sante'] },
  { id:'e091', name:'Bird dog',                 primary:'lombaires',secondary:['abdos'], equipment:[], curve:'constant', difficulty:1, tags:['gainage','core','maison','sante'] },
];

// Substituants selon pathologie/équipement
const SUBSTITUTES = {
  'e050': { lombalgie: 'e051', sans_rack: 'e051', machine_only: 'e052' },
  'e013': { lombalgie: 'e011', sans_barre: 'e012' },
  'e020': { lombalgie: 'e021', sans_barre: 'e021' },
  'e010': { debutant: 'e015', sans_traction: 'e015' },
  'e014': { lombalgie: 'e061', debutant: 'e090' },
};

// Groupes musculaires UI
const MUSCLES = [
  { id:'pecs',     label:'Pectoraux',    emoji:'🫁', color:'#FF0040' },
  { id:'dos',      label:'Dos',          emoji:'🔙', color:'#60a5fa' },
  { id:'epaules',  label:'Épaules',      emoji:'🎽', color:'#a78bfa' },
  { id:'biceps',   label:'Biceps',       emoji:'💪', color:'#f59e0b' },
  { id:'triceps',  label:'Triceps',      emoji:'🔱', color:'#f97316' },
  { id:'quadris',  label:'Quadriceps',   emoji:'🦵', color:'#22c55e' },
  { id:'ischio',   label:'Ischio',       emoji:'🦿', color:'#2dd4bf' },
  { id:'fessiers', label:'Fessiers',     emoji:'🍑', color:'#ec4899' },
  { id:'mollets',  label:'Mollets',      emoji:'🦶', color:'#84cc16' },
  { id:'abdos',    label:'Abdos/Core',   emoji:'⚡', color:'#eab308' },
  { id:'lombaires',label:'Lombaires',    emoji:'🔧', color:'#6366f1' },
];

const EQUIPMENT_LIST = [
  { id:'barre', label:'Barre' }, { id:'halteres', label:'Haltères' },
  { id:'poulie', label:'Poulie' }, { id:'machine', label:'Machine' },
  { id:'barre_traction', label:'Barre traction' }, { id:'barre_dips', label:'Barres dips' },
  { id:'rack', label:'Rack' }, { id:'banc', label:'Banc' },
  { id:'ab_wheel', label:'Ab wheel' },
];

const PATHOLOGIES = [
  { id:'lombalgie', label:'Lombalgie' }, { id:'sans_rack', label:'Pas de rack' },
  { id:'sans_barre', label:'Pas de barre' }, { id:'machine_only', label:'Machines seulement' },
  { id:'debutant', label:'Débutant' },
];

const INTENSITY_MODS = [
  { id:'normal', label:'Normal', desc:'Séries classiques' },
  { id:'drop_set', label:'Drop Set', desc:'-20% poids sans repos' },
  { id:'myo_reps', label:'Myo-reps', desc:'Mini-séries après failure' },
  { id:'rest_pause', label:'Rest-Pause', desc:'10-15s de pause intra-série' },
  { id:'tempo', label:'Tempo 4-0-2', desc:'Excentrique lent 4s' },
  { id:'amrap', label:'AMRAP', desc:'Max reps à poids fixe' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════
const card = { background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:'14px 16px' };
const inp = (extra={}) => ({ background:'var(--bg-input)', border:'1px solid var(--border-input)', color:'var(--text-primary)', borderRadius:10, padding:'8px 12px', fontSize:13, fontFamily:'inherit', outline:'none', ...extra });
const btnRed = { background:'#FF0040', color:'#000', border:'none', borderRadius:10, padding:'9px 16px', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' };
const btnGhost = { background:'var(--btn-ghost-bg)', border:'1px solid var(--btn-ghost-border)', color:'var(--btn-ghost-color)', borderRadius:10, padding:'9px 14px', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' };
const chip = (color, active) => ({ background: active ? `${color}25` : 'var(--bg-input)', border:`1.5px solid ${active ? color : 'transparent'}`, borderRadius:20, padding:'4px 10px', fontSize:11, fontWeight:600, cursor:'pointer', color: active ? color : 'var(--text-muted)', fontFamily:'inherit', whiteSpace:'nowrap' });

// Calcule volume par muscle dans la séance
function computeVolume(entries) {
  const vol = {};
  entries.forEach(e => {
    if (!e.exercise) return;
    const ex = DB.find(x => x.id === e.exercise.id);
    if (!ex) return;
    const sets = e.sets || 3;
    vol[ex.primary] = (vol[ex.primary] || 0) + sets;
    (ex.secondary || []).forEach(m => { vol[m] = (vol[m] || 0) + sets * 0.4; });
  });
  return vol;
}

// Détecte déséquilibres push/pull
function detectImbalance(vol) {
  const PUSH_M = ['pecs','epaules','triceps','quadris','fessiers'];
  const PULL_M = ['dos','biceps','ischio','lombaires'];
  const push = PUSH_M.reduce((s,m) => s + (vol[m]||0), 0);
  const pull = PULL_M.reduce((s,m) => s + (vol[m]||0), 0);
  if (push > 0 && pull === 0) return { type:'danger', msg:'Aucun exercice de tirage ! Ajoute du dos/biceps.' };
  if (pull > 0 && push === 0) return { type:'danger', msg:'Aucun exercice de poussée.' };
  const ratio = push / (pull || 1);
  if (ratio > 2.5) return { type:'warn', msg:`Trop de poussée vs tirage (${ratio.toFixed(1)}:1). Idéal: ~1.5:1` };
  if (ratio < 0.5) return { type:'warn', msg:'Trop de tirage vs poussée.' };
  return null;
}

// Fatigue théorique selon position
function fatigueMultiplier(position, total) {
  return 1 - (position / total) * 0.25;
}

// Suggère substitut
function getSub(exId, constraints) {
  const subs = SUBSTITUTES[exId] || {};
  for (const c of constraints) { if (subs[c]) return DB.find(x => x.id === subs[c]); }
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPOSANTS
// ═══════════════════════════════════════════════════════════════════════════════

// Badge de volume par muscle
function VolumeBar({ muscleId, sets, max }) {
  const m = MUSCLES.find(x => x.id === muscleId);
  if (!m || sets < 0.5) return null;
  const pct = Math.min(100, (sets / max) * 100);
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
      <span style={{ fontSize:10, minWidth:64, color:'var(--text-muted)', fontFamily:'monospace' }}>{m.emoji} {m.label}</span>
      <div style={{ flex:1, height:5, background:'var(--bg-input)', borderRadius:4, overflow:'hidden' }}>
        <div style={{ width:`${pct}%`, height:'100%', background:m.color, borderRadius:4, transition:'width 0.3s' }}/>
      </div>
      <span style={{ fontSize:10, color:m.color, fontFamily:'monospace', minWidth:28 }}>{Math.round(sets)}s</span>
    </div>
  );
}

// Ligne d'exercice avec drag handle, intensity, superset
function ExerciseEntry({ entry, index, total, onUpdate, onDelete, onMoveUp, onMoveDown, constraints, superset }) {
  const [open, setOpen] = useState(false);
  const ex = entry.exercise;
  const fatigue = fatigueMultiplier(index, total);
  const sub = ex ? getSub(ex.id, constraints) : null;
  const musInfo = ex ? MUSCLES.find(m => m.id === ex.primary) : null;

  return (
    <div style={{ marginBottom: superset ? 2 : 10 }}>
      {superset && <div style={{ fontSize:9, color:'#f59e0b', fontFamily:'monospace', marginLeft:12, marginBottom:2 }}>⚡ SUPERSET</div>}
      <div style={{ ...card, borderLeft:`3px solid ${musInfo?.color || 'var(--border)'}`, padding:'10px 12px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom: open ? 12 : 0 }}>
          {/* Drag / ordre */}
          <div style={{ display:'flex', flexDirection:'column', gap:1 }}>
            <button onClick={onMoveUp} disabled={index===0} style={{ background:'none', border:'none', color:'var(--text-muted)', fontSize:10, cursor:'pointer', padding:'1px 3px', opacity: index===0 ? 0.3 : 1 }}>▲</button>
            <button onClick={onMoveDown} disabled={index===total-1} style={{ background:'none', border:'none', color:'var(--text-muted)', fontSize:10, cursor:'pointer', padding:'1px 3px', opacity: index===total-1 ? 0.3 : 1 }}>▼</button>
          </div>
          <div style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'monospace', minWidth:16 }}>#{index+1}</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)' }}>{ex?.name || '—'}</div>
            <div style={{ display:'flex', gap:6, marginTop:2, flexWrap:'wrap' }}>
              {musInfo && <span style={{ fontSize:9, color:musInfo.color, fontFamily:'monospace' }}>{musInfo.emoji} {musInfo.label}</span>}
              {fatigue < 0.85 && <span style={{ fontSize:9, color:'#f59e0b', fontFamily:'monospace' }}>⚡ -{Math.round((1-fatigue)*100)}% force</span>}
              {entry.modifier !== 'normal' && <span style={{ fontSize:9, background:'rgba(96,165,250,0.15)', color:'#60a5fa', borderRadius:4, padding:'1px 6px', fontFamily:'monospace' }}>{INTENSITY_MODS.find(m=>m.id===entry.modifier)?.label}</span>}
            </div>
          </div>
          <div style={{ display:'flex', gap:4, alignItems:'center' }}>
            <span style={{ fontSize:11, fontFamily:'monospace', color:'var(--text-muted)' }}>{entry.sets}×{entry.reps}</span>
            {entry.weight > 0 && <span style={{ fontSize:11, fontFamily:'monospace', color:'#22c55e', marginLeft:4 }}>{entry.weight}kg</span>}
            <button onClick={() => setOpen(!open)} style={{ ...btnGhost, padding:'4px 8px', fontSize:11, marginLeft:4 }}>{open ? '▲' : '▼'}</button>
            <button onClick={onDelete} style={{ background:'none', border:'none', color:'rgba(239,68,68,0.5)', cursor:'pointer', fontSize:14, padding:'0 4px' }}>✕</button>
          </div>
        </div>

        {open && (
          <div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:10 }}>
              <div>
                <label style={{ fontSize:10, color:'var(--text-muted)', display:'block', marginBottom:4 }}>Séries</label>
                <input type="number" style={inp({ width:'100%' })} min="1" max="20" value={entry.sets} onChange={e=>onUpdate({...entry,sets:+e.target.value})} />
              </div>
              <div>
                <label style={{ fontSize:10, color:'var(--text-muted)', display:'block', marginBottom:4 }}>Reps</label>
                <input style={inp({ width:'100%' })} value={entry.reps} onChange={e=>onUpdate({...entry,reps:e.target.value})} placeholder="8-12" />
              </div>
              <div>
                <label style={{ fontSize:10, color:'var(--text-muted)', display:'block', marginBottom:4 }}>Poids (kg)</label>
                <input type="number" style={inp({ width:'100%' })} min="0" step="2.5" value={entry.weight||''} onChange={e=>onUpdate({...entry,weight:+e.target.value})} placeholder="—" />
              </div>
            </div>
            <div>
              <label style={{ fontSize:10, color:'var(--text-muted)', display:'block', marginBottom:6 }}>Repos (sec)</label>
              <input type="number" style={inp({ width:'80px' })} min="30" max="300" step="15" value={entry.rest||90} onChange={e=>onUpdate({...entry,rest:+e.target.value})} />
            </div>
            {/* Modificateurs d'intensité */}
            <div style={{ marginTop:10 }}>
              <label style={{ fontSize:10, color:'var(--text-muted)', display:'block', marginBottom:6 }}>Technique d'intensité</label>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {INTENSITY_MODS.map(m => (
                  <button key={m.id} onClick={()=>onUpdate({...entry,modifier:m.id})}
                    style={chip('#60a5fa', entry.modifier===m.id)} title={m.desc}>{m.label}</button>
                ))}
              </div>
            </div>
            {/* Substitut suggéré */}
            {sub && (
              <div style={{ marginTop:10, background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:8, padding:'8px 10px' }}>
                <div style={{ fontSize:10, color:'#f59e0b', fontWeight:600, marginBottom:4 }}>💡 Substitut suggéré pour ta contrainte</div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:12, color:'var(--text-primary)' }}>{sub.name}</span>
                  <button onClick={()=>onUpdate({...entry,exercise:sub})} style={{ ...btnGhost, padding:'3px 8px', fontSize:11 }}>Remplacer</button>
                </div>
              </div>
            )}
            {/* Superset toggle */}
            <div style={{ marginTop:10, display:'flex', alignItems:'center', gap:8 }}>
              <button onClick={()=>onUpdate({...entry, superset:!entry.superset})}
                style={chip('#f59e0b', entry.superset)}>⚡ Superset avec suivant</button>
              <span style={{ fontSize:10, color:'var(--text-muted)' }}>{entry.superset ? 'Enchaîné sans repos' : ''}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Panneau de recherche / ajout d'exercice
function ExercisePicker({ onAdd, constraints }) {
  const [muscle, setMuscle] = useState(null);
  const [tagFilters, setTagFilters] = useState([]);
  const [search, setSearch] = useState('');
  const [customName, setCustomName] = useState('');

  const allTags = [...new Set(DB.flatMap(e=>e.tags))].sort();

  const filtered = DB.filter(ex => {
    if (muscle && ex.primary !== muscle && !ex.secondary.includes(muscle)) return false;
    if (tagFilters.length && !tagFilters.every(t => ex.tags.includes(t))) return false;
    if (search && !ex.name.toLowerCase().includes(search.toLowerCase())) return false;
    // Filtre équipement si contrainte machine_only
    if (constraints.includes('machine_only') && !ex.equipment.includes('machine') && ex.equipment.length > 0) return false;
    return true;
  });

  const addEx = (ex) => onAdd({ exercise:ex, sets:3, reps:'10', weight:0, rest:90, modifier:'normal', superset:false });
  const addCustom = () => {
    if (!customName.trim()) return;
    onAdd({ exercise:{id:'c'+Date.now(), name:customName.trim(), primary:muscle||'abdos', secondary:[], equipment:[], curve:'peak', difficulty:1, tags:['custom']}, sets:3, reps:'10', weight:0, rest:90, modifier:'normal', superset:false });
    setCustomName('');
  };

  return (
    <div>
      {/* Filtres muscles */}
      <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:6, marginBottom:10 }}>
        <button onClick={()=>setMuscle(null)} style={chip('var(--text-primary)', !muscle)}>Tous</button>
        {MUSCLES.map(m => (
          <button key={m.id} onClick={()=>setMuscle(muscle===m.id ? null : m.id)} style={chip(m.color, muscle===m.id)}>
            {m.emoji} {m.label}
          </button>
        ))}
      </div>
      {/* Tags croisés */}
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:10 }}>
        {['compound','isolation','pousser','tirer','unilateral','maison','force','sante'].map(t => (
          <button key={t} onClick={()=>setTagFilters(prev => prev.includes(t) ? prev.filter(x=>x!==t) : [...prev,t])}
            style={chip('#a78bfa', tagFilters.includes(t))}>{t}</button>
        ))}
      </div>
      {/* Search */}
      <input style={{ ...inp(), width:'100%', marginBottom:10 }} placeholder="Rechercher un exercice..." value={search} onChange={e=>setSearch(e.target.value)} />
      {/* Liste */}
      <div style={{ maxHeight:220, overflowY:'auto', display:'flex', flexDirection:'column', gap:4 }}>
        {filtered.slice(0,20).map(ex => {
          const m = MUSCLES.find(x=>x.id===ex.primary);
          const sub = getSub(ex.id, constraints);
          return (
            <button key={ex.id} onClick={()=>addEx(sub || ex)}
              style={{ background:'var(--bg-input)', border:`1px solid ${m?.color||'var(--border)'}22`, borderRadius:10, padding:'8px 12px', cursor:'pointer', fontFamily:'inherit', textAlign:'left', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontSize:12, fontWeight:600, color:'var(--text-primary)' }}>
                  {sub ? <span style={{ textDecoration:'line-through', opacity:0.4 }}>{ex.name}</span> : ex.name}
                  {sub && <span style={{ color:'#f59e0b', marginLeft:4 }}> → {sub.name}</span>}
                </div>
                <div style={{ fontSize:10, color:'var(--text-muted)', display:'flex', gap:6, marginTop:1 }}>
                  <span style={{ color:m?.color }}>{m?.emoji} {m?.label}</span>
                  {ex.secondary.slice(0,2).map(s => <span key={s} style={{ opacity:0.6 }}>+{s}</span>)}
                  {'⭐'.repeat(ex.difficulty)}
                </div>
              </div>
              <span style={{ color:m?.color||'#FF0040', fontSize:18 }}>+</span>
            </button>
          );
        })}
      </div>
      {/* Custom */}
      <div style={{ borderTop:'1px solid var(--border)', paddingTop:12, marginTop:12 }}>
        <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:6, fontFamily:'monospace', textTransform:'uppercase' }}>Exercice personnalisé</div>
        <div style={{ display:'flex', gap:8 }}>
          <input style={{ ...inp(), flex:1 }} placeholder="Nom de l'exercice..." value={customName} onChange={e=>setCustomName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addCustom()} />
          <button onClick={addCustom} disabled={!customName.trim()} style={{ ...btnRed, opacity:customName.trim()?1:0.4 }}>+ Ajouter</button>
        </div>
      </div>
    </div>
  );
}

// ─── Éditeur principal ────────────────────────────────────────────────────────
function WorkoutEditor({ workout, onSave, onCancel }) {
  const [form, setForm] = useState(workout || { name:'', duration:60, entries:[], notes:'' });
  const [constraints, setConstraints] = useState([]);
  const [equipment, setEquipment] = useState(EQUIPMENT_LIST.map(e=>e.id));
  const [tab, setTab] = useState('build'); // 'build' | 'volume' | 'settings'
  const [showPicker, setShowPicker] = useState(false);

  const vol = computeVolume(form.entries);
  const imbalance = detectImbalance(vol);
  const maxVol = Math.max(...Object.values(vol), 1);
  const canSave = form.name.trim() && form.entries.length > 0;

  const updateEntry = (i, entry) => setForm(f => ({ ...f, entries: f.entries.map((e,xi)=>xi===i?entry:e) }));
  const deleteEntry = (i) => setForm(f => ({ ...f, entries: f.entries.filter((_,xi)=>xi!==i) }));
  const moveUp = (i) => {
    if (i===0) return;
    setForm(f => { const arr=[...f.entries]; [arr[i-1],arr[i]]=[arr[i],arr[i-1]]; return {...f,entries:arr}; });
  };
  const moveDown = (i) => {
    setForm(f => { if (i>=f.entries.length-1) return f; const arr=[...f.entries]; [arr[i],arr[i+1]]=[arr[i+1],arr[i]]; return {...f,entries:arr}; });
  };
  const addEntry = (entry) => { setForm(f => ({ ...f, entries:[...f.entries, entry] })); setShowPicker(false); };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom:16 }}>
        <input style={{ ...inp(), width:'100%', fontSize:16, fontWeight:700, marginBottom:8 }}
          placeholder="Nom de la séance..." value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} />
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <label style={{ fontSize:11, color:'var(--text-muted)' }}>Durée</label>
          <input type="number" style={inp({ width:70 })} min="10" max="240" step="5" value={form.duration} onChange={e=>setForm(f=>({...f,duration:+e.target.value}))} />
          <span style={{ fontSize:11, color:'var(--text-muted)' }}>min</span>
          <span style={{ fontSize:11, color:'var(--text-muted)', marginLeft:8 }}>💪 {form.entries.length} exercices</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:6, marginBottom:16 }}>
        {[['build','🏗️ Construire'],['volume','📊 Volume'],['settings','⚙️ Paramètres']].map(([id,label]) => (
          <button key={id} onClick={()=>setTab(id)}
            style={{ ...btnGhost, flex:1, fontSize:11, padding:'6px 8px', background: tab===id ? 'rgba(255,0,64,0.1)' : 'var(--btn-ghost-bg)', borderColor: tab===id ? 'rgba(255,0,64,0.3)' : 'var(--btn-ghost-border)', color: tab===id ? '#FF0040' : 'var(--btn-ghost-color)' }}>
            {label}
          </button>
        ))}
      </div>

      {/* TAB: BUILD */}
      {tab==='build' && (
        <div>
          {/* Alerte déséquilibre */}
          {imbalance && form.entries.length >= 2 && (
            <div style={{ background: imbalance.type==='danger' ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)', border:`1px solid ${imbalance.type==='danger' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`, borderRadius:10, padding:'8px 12px', marginBottom:12, fontSize:12, color: imbalance.type==='danger' ? 'rgba(239,68,68,0.9)' : '#f59e0b' }}>
              {imbalance.type==='danger' ? '⚠️' : '💡'} {imbalance.msg}
            </div>
          )}

          {/* Liste exercices */}
          {form.entries.length === 0 && (
            <div style={{ ...card, textAlign:'center', padding:'24px', marginBottom:12 }}>
              <div style={{ fontSize:28, marginBottom:8 }}>🏋️</div>
              <div style={{ fontSize:13, color:'var(--text-muted)' }}>Ajoute ton premier exercice ci-dessous</div>
            </div>
          )}
          {form.entries.map((entry, i) => (
            <ExerciseEntry key={i} entry={entry} index={i} total={form.entries.length}
              onUpdate={e=>updateEntry(i,e)} onDelete={()=>deleteEntry(i)}
              onMoveUp={()=>moveUp(i)} onMoveDown={()=>moveDown(i)}
              constraints={constraints}
              superset={form.entries[i-1]?.superset} />
          ))}

          {/* Picker */}
          {showPicker ? (
            <div style={{ ...card, marginBottom:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                <span style={{ fontSize:12, fontWeight:700, color:'var(--text-primary)' }}>Ajouter un exercice</span>
                <button onClick={()=>setShowPicker(false)} style={{ ...btnGhost, padding:'3px 8px', fontSize:11 }}>✕ Fermer</button>
              </div>
              <ExercisePicker onAdd={addEntry} constraints={constraints} />
            </div>
          ) : (
            <button onClick={()=>setShowPicker(true)} style={{ ...btnGhost, width:'100%', marginBottom:12, borderStyle:'dashed', fontSize:13 }}>
              + Ajouter un exercice
            </button>
          )}
        </div>
      )}

      {/* TAB: VOLUME */}
      {tab==='volume' && (
        <div style={{ ...card }}>
          <div style={{ fontSize:12, fontWeight:700, color:'var(--text-primary)', marginBottom:12 }}>Volume par groupe musculaire</div>
          {Object.keys(vol).length === 0 && <div style={{ fontSize:12, color:'var(--text-muted)' }}>Ajoute des exercices pour voir le volume.</div>}
          {MUSCLES.filter(m => vol[m.id] > 0).map(m => (
            <VolumeBar key={m.id} muscleId={m.id} sets={vol[m.id]} max={maxVol} />
          ))}
          {imbalance && (
            <div style={{ marginTop:12, fontSize:12, color: imbalance.type==='danger' ? 'rgba(239,68,68,0.9)' : '#f59e0b', background: imbalance.type==='danger' ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)', borderRadius:8, padding:'8px 10px' }}>
              {imbalance.msg}
            </div>
          )}
        </div>
      )}

      {/* TAB: SETTINGS */}
      {tab==='settings' && (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ ...card }}>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--text-primary)', marginBottom:10, textTransform:'uppercase', letterSpacing:'0.08em' }}>Contraintes / Pathologies</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {PATHOLOGIES.map(p => (
                <button key={p.id} onClick={()=>setConstraints(prev=>prev.includes(p.id)?prev.filter(x=>x!==p.id):[...prev,p.id])}
                  style={chip('#ef4444', constraints.includes(p.id))}>{p.label}</button>
              ))}
            </div>
            {constraints.length > 0 && (
              <div style={{ marginTop:8, fontSize:11, color:'#f59e0b' }}>💡 Les exercices incompatibles seront remplacés automatiquement.</div>
            )}
          </div>
          <div style={{ ...card }}>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--text-primary)', marginBottom:10, textTransform:'uppercase', letterSpacing:'0.08em' }}>Notes</div>
            <textarea style={{ ...inp(), width:'100%', minHeight:80, resize:'vertical', lineHeight:1.6 }}
              placeholder="Notes, objectifs, contexte..." value={form.notes||''} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} />
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display:'flex', gap:10, marginTop:16 }}>
        <button onClick={onCancel} style={{ ...btnGhost, flex:1 }}>Annuler</button>
        <button onClick={()=>canSave&&onSave({...form,constraints})} style={{ ...btnRed, flex:2, opacity:canSave?1:0.4 }}>
          Sauvegarder la séance
        </button>
      </div>
    </div>
  );
}

// ─── Carte séance ─────────────────────────────────────────────────────────────
function WorkoutCard({ workout, onOpen, onDelete, onDuplicate }) {
  const vol = computeVolume(workout.entries || []);
  const muscles = Object.keys(vol).filter(m => vol[m] >= 1);
  const topMuscle = MUSCLES.find(x=>x.id===muscles[0]);
  const accentColor = topMuscle?.color || '#FF0040';
  return (
    <div onClick={onOpen} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:20, padding:'18px 16px', cursor:'pointer', transition:'all 0.15s', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:accentColor, borderRadius:'20px 20px 0 0' }}/>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:16, fontWeight:800, letterSpacing:'-0.02em', color:'var(--text-primary)', marginBottom:6 }}>{workout.name}</div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            <span style={{ fontSize:10, padding:'3px 8px', borderRadius:99, background:'var(--bg-input)', color:'var(--text-secondary)', fontFamily:'DM Mono, monospace' }}>💪 {(workout.entries||[]).length} exercices</span>
            <span style={{ fontSize:10, padding:'3px 8px', borderRadius:99, background:'var(--bg-input)', color:'var(--text-secondary)', fontFamily:'DM Mono, monospace' }}>⏱ {workout.duration} min</span>
            {workout.aiGenerated && <span style={{ fontSize:10, padding:'3px 8px', borderRadius:99, background:'rgba(96,165,250,0.1)', color:'#60a5fa', border:'1px solid rgba(96,165,250,0.2)', fontWeight:700 }}>✨ IA</span>}
          </div>
        </div>
        <div style={{ display:'flex', gap:6 }} onClick={e=>e.stopPropagation()}>
          <button onClick={onDuplicate} style={{ width:32, height:32, borderRadius:10, background:'var(--bg-input)', border:'1px solid var(--border)', color:'var(--text-muted)', fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }} title="Dupliquer +surcharge">📋</button>
          <button onClick={onDelete} style={{ width:32, height:32, borderRadius:10, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.15)', color:'rgba(239,68,68,0.6)', fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
        </div>
      </div>
      {muscles.length > 0 && (
        <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
          {muscles.slice(0,5).map(m => {
            const info = MUSCLES.find(x=>x.id===m);
            return info ? (
              <span key={m} style={{ fontSize:9, fontWeight:700, color:info.color, background:`${info.color}12`, border:`1px solid ${info.color}25`, borderRadius:99, padding:'3px 8px' }}>
                {info.emoji} {info.label}
              </span>
            ) : null;
          })}
        </div>
      )}
      <div style={{ position:'absolute', bottom:16, right:16, color:'var(--text-muted)', fontSize:16 }}>›</div>
    </div>
  );
}

// ─── Détail séance ─────────────────────────────────────────────────────────────
function WorkoutDetail({ workout, onBack, onEdit, onStart }) {
  const vol = computeVolume(workout.entries || []);
  const maxVol = Math.max(...Object.values(vol), 1);
  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
        <button onClick={onBack} style={{ ...btnGhost, padding:'7px 12px', fontSize:12 }}>← Retour</button>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:17, fontWeight:800, color:'var(--text-primary)' }}>{workout.name}</div>
          <div style={{ fontSize:11, color:'var(--text-muted)' }}>{(workout.entries||[]).length} exercices · {workout.duration} min</div>
        </div>
        <button onClick={onEdit} style={{ ...btnGhost, padding:'7px 12px', fontSize:12 }}>✏️ Éditer</button>
        <button onClick={onStart} style={{ ...btnRed, padding:'7px 14px', fontSize:12 }}>▶ Démarrer</button>
      </div>
      {/* Volume */}
      {Object.keys(vol).length > 0 && (
        <div style={{ ...card, marginBottom:12 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'var(--text-primary)', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.06em' }}>Volume musculaire</div>
          {MUSCLES.filter(m=>vol[m.id]>0).map(m => <VolumeBar key={m.id} muscleId={m.id} sets={vol[m.id]} max={maxVol} />)}
        </div>
      )}
      {(workout.entries||[]).map((entry, i) => {
        const ex = entry.exercise;
        const m = ex ? MUSCLES.find(x=>x.id===ex.primary) : null;
        return (
          <div key={i} style={{ ...card, marginBottom:8, borderLeft:`3px solid ${m?.color||'var(--border)'}` }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)' }}>{ex?.name||'—'}</div>
                <div style={{ fontSize:10, color:'var(--text-muted)' }}>{m?.emoji} {m?.label}</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:13, fontFamily:'monospace', color:'var(--text-primary)' }}>{entry.sets}×{entry.reps}</div>
                {entry.weight > 0 && <div style={{ fontSize:11, color:'#22c55e', fontFamily:'monospace' }}>{entry.weight} kg</div>}
                {entry.modifier !== 'normal' && <div style={{ fontSize:9, color:'#60a5fa', fontFamily:'monospace' }}>{INTENSITY_MODS.find(m=>m.id===entry.modifier)?.label}</div>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Générateur IA ─────────────────────────────────────────────────────────────
function AIGenerator({ onSave, onCancel }) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);
  const suggestions = [
    'Séance pectoraux hypertrophie 60 min, 4 exercices',
    'Full body force débutant sans rack ni barre de traction',
    'Séance dos et biceps 45 min, focus épaisseur',
    'Jambes complètes avec squat, leg curl, hip thrust',
    'Push pull legs — jour Push 60 min',
  ];

  const generate = async () => {
    if (!prompt.trim()) return;
    setLoading(true); setError(''); setPreview(null);
    try {
      const fullPrompt = `Tu es coach musculation expert. Génère une séance en JSON UNIQUEMENT, zéro texte autour.
Demande: ${prompt}
JSON requis: {"name":"Nom","duration":60,"entries":[{"exercise":{"id":"custom","name":"Nom exercice","primary":"pecs","secondary":[],"equipment":[],"curve":"peak","difficulty":2,"tags":[]},"sets":4,"reps":"8-12","weight":0,"rest":90,"modifier":"normal","superset":false}]}
Groupes musculaires valides: pecs, dos, epaules, biceps, triceps, quadris, ischio, fessiers, mollets, abdos, lombaires`;
      const res = await fetch('/api/gemini', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({prompt:fullPrompt}) });
      const data = await res.json();
      const raw = data.text || '';
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Format JSON invalide');
      const workout = JSON.parse(jsonMatch[0]);
      if (!workout.entries?.length) throw new Error('Aucun exercice généré');
      setPreview({ ...workout, aiGenerated:true, id:Date.now() });
    } catch(e) { setError('Erreur : ' + e.message); }
    setLoading(false);
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ ...card, background:'rgba(96,165,250,0.06)', borderColor:'rgba(96,165,250,0.2)' }}>
        <div style={{ fontSize:11, color:'#60a5fa', fontWeight:700, marginBottom:4, textTransform:'uppercase', letterSpacing:'0.08em' }}>✨ Génération IA</div>
        <p style={{ fontSize:12, color:'var(--text-secondary)', lineHeight:1.6, margin:0 }}>Décris ta séance, l'IA génère exercices, séries, reps et techniques d'intensité.</p>
      </div>
      <div>
        <textarea style={{ ...inp(), width:'100%', minHeight:72, resize:'vertical', lineHeight:1.6 }}
          placeholder="Ex: Séance pectoraux hypertrophie 60 min, 4 exercices, avec drop set sur le dernier..."
          value={prompt} onChange={e=>setPrompt(e.target.value)} />
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
        {suggestions.map(s => <button key={s} onClick={()=>setPrompt(s)} style={{ ...btnGhost, textAlign:'left', padding:'7px 12px', fontSize:11 }}>{s}</button>)}
      </div>
      {error && <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:10, padding:'8px 12px', fontSize:12, color:'rgba(239,68,68,0.9)' }}>{error}</div>}
      {!preview && (
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onCancel} style={{ ...btnGhost, flex:1 }}>Annuler</button>
          <button onClick={generate} disabled={loading||!prompt.trim()} style={{ ...btnRed, flex:2, opacity:loading||!prompt.trim()?0.5:1 }}>
            {loading ? '⏳ Génération...' : '✨ Générer'}
          </button>
        </div>
      )}
      {preview && (
        <div>
          <div style={{ ...card, marginBottom:14 }}>
            <div style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)', marginBottom:4 }}>{preview.name}</div>
            <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:10 }}>⏱ {preview.duration} min · {preview.entries?.length} exercices</div>
            {(preview.entries||[]).map((e,i) => (
              <div key={i} style={{ background:'var(--bg-input)', borderRadius:8, padding:'7px 10px', marginBottom:5 }}>
                <div style={{ fontSize:12, fontWeight:600, color:'var(--text-primary)' }}>{e.exercise?.name}</div>
                <div style={{ fontSize:10, color:'var(--text-muted)' }}>{e.sets}×{e.reps} — {INTENSITY_MODS.find(m=>m.id===e.modifier)?.label||'Normal'}</div>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={()=>setPreview(null)} style={{ ...btnGhost, flex:1 }}>Régénérer</button>
            <button onClick={()=>onSave(preview)} style={{ ...btnRed, flex:2 }}>💾 Sauvegarder</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════
export default function MusculationModule() {
  const [workouts, setWorkouts] = useState([]);
  const [view, setView] = useState('list');
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    try { const s = localStorage.getItem('pp_workouts_pro'); if (s) setWorkouts(JSON.parse(s)); } catch {}
  }, []);

  const persist = (list) => { setWorkouts(list); try { localStorage.setItem('pp_workouts_pro', JSON.stringify(list)); } catch {} };

  const handleSave = (workout) => {
    const w = { ...workout, id: workout.id || Date.now() };
    const list = editing ? workouts.map(x=>x.id===selected.id?w:x) : [...workouts, w];
    persist(list); setSelected(w); setView('detail'); setEditing(false);
  };

  // Duplication avec surcharge progressive (+2kg lifts, +1 rep isolation)
  const handleDuplicate = (workout) => {
    const w = {
      ...workout,
      id: Date.now(),
      name: workout.name + ' (S+1)',
      entries: (workout.entries||[]).map(e => {
        const ex = e.exercise;
        const isCompound = ex?.tags?.includes('compound');
        return {
          ...e,
          weight: isCompound && e.weight > 0 ? e.weight + 2 : e.weight,
          reps: !isCompound && typeof e.reps === 'string' && /^\d+$/.test(e.reps) ? String(+e.reps + 1) : e.reps,
        };
      })
    };
    persist([...workouts, w]);
  };

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-primary)', color:'var(--text-primary)', fontFamily:'Syne, sans-serif', paddingBottom:70 }}>
      <div style={{ maxWidth:700, margin:'0 auto', padding:'18px 16px 0' }}>

        {/* Header */}
        <div style={{ marginBottom:20 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
            <div>
              <h1 style={{ fontSize:26, fontWeight:800, letterSpacing:'-0.04em', marginBottom:4 }}>Musculation</h1>
              <p style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'DM Mono, monospace', textTransform:'uppercase', letterSpacing:'0.1em' }}>{workouts.length} séance{workouts.length!==1?'s':''} sauvegardée{workouts.length!==1?'s':''}</p>
            </div>
            {view==='list' && (
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={()=>{setView('ai');setSelected(null);}} style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(96,165,250,0.08)', border:'1px solid rgba(96,165,250,0.2)', color:'#60a5fa', borderRadius:12, padding:'9px 14px', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                  ✨ IA
                </button>
                <button onClick={()=>{setView('create');setSelected(null);setEditing(false);}} style={{ display:'flex', alignItems:'center', gap:6, background:'#FF0040', border:'none', color:'#fff', borderRadius:12, padding:'9px 14px', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                  + Créer
                </button>
              </div>
            )}
          </div>

          {/* Stats rapides si séances */}
          {view==='list' && workouts.length>0 && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:4 }}>
              {[
                { label:'Séances', value:workouts.length, color:'#FF0040' },
                { label:'Exercices moy.', value:workouts.length>0?Math.round(workouts.reduce((a,w)=>a+(w.entries||[]).length,0)/workouts.length):0, color:'#60a5fa' },
                { label:'Durée moy.', value:`${workouts.length>0?Math.round(workouts.reduce((a,w)=>a+(w.duration||0),0)/workouts.length):0} min`, color:'#f59e0b' },
              ].map(({label,value,color})=>(
                <div key={label} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14, padding:'12px', textAlign:'center' }}>
                  <div style={{ fontSize:18, fontWeight:800, color, fontFamily:'DM Mono, monospace', lineHeight:1, marginBottom:4 }}>{value}</div>
                  <div style={{ fontSize:9, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em' }}>{label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {view==='list' && (
          workouts.length===0 ? (
            <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:20, padding:'48px 24px', textAlign:'center', position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:200, height:200, borderRadius:'50%', background:'radial-gradient(circle,rgba(96,165,250,0.05) 0%,transparent 70%)', pointerEvents:'none' }}/>
              <div style={{ fontSize:52, marginBottom:16 }}>💪</div>
              <div style={{ fontSize:18, fontWeight:800, letterSpacing:'-0.02em', marginBottom:8 }}>Aucune séance</div>
              <p style={{ fontSize:13, color:'var(--text-muted)', marginBottom:28, lineHeight:1.6 }}>Crée ta première séance manuellement<br/>ou laisse l'IA en générer une pour toi.</p>
              <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
                <button onClick={()=>setView('ai')} style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(96,165,250,0.08)', border:'1px solid rgba(96,165,250,0.25)', color:'#60a5fa', borderRadius:14, padding:'12px 20px', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>✨ Générer avec l'IA</button>
                <button onClick={()=>setView('create')} style={{ background:'#FF0040', border:'none', color:'#fff', borderRadius:14, padding:'12px 20px', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>+ Créer</button>
              </div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {workouts.map(w => (
                <WorkoutCard key={w.id} workout={w}
                  onOpen={()=>{setSelected(w);setView('detail');}}
                  onDelete={()=>persist(workouts.filter(x=>x.id!==w.id))}
                  onDuplicate={()=>handleDuplicate(w)} />
              ))}
            </div>
          )
        )}

        {(view==='create'||(view==='detail'&&editing)) && (
          <WorkoutEditor workout={editing?selected:null} onSave={handleSave}
            onCancel={()=>{setView(editing?'detail':'list');setEditing(false);}} />
        )}
        {view==='detail'&&!editing&&selected && (
          <WorkoutDetail workout={selected} onBack={()=>setView('list')} onEdit={()=>setEditing(true)} onStart={()=>setView('live')} />
        )}
        {view==='live'&&selected && (
          <LiveSession workout={selected} onEnd={()=>setView('detail')} />
        )}
        {view==='ai' && (
          <AIGenerator onSave={handleSave} onCancel={()=>setView('list')} />
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODE SÉANCE EN DIRECT
// ═══════════════════════════════════════════════════════════════════════════════
function LiveSession({ workout, onEnd }) {
  const entries = workout.entries || [];
  const [exIdx, setExIdx] = useState(0);
  const [setIdx, setSetIdx] = useState(0);
  const [phase, setPhase] = useState('active'); // 'active' | 'rest' | 'done'
  const [restLeft, setRestLeft] = useState(0);
  const [completed, setCompleted] = useState({}); // {exIdx_setIdx: {reps, weight}}
  const [elapsed, setElapsed] = useState(0);
  const [notes, setNotes] = useState('');
  const timerRef = useRef(null);
  const startRef = useRef(Date.now());

  // Chrono global
  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  // Countdown repos
  useEffect(() => {
    if (phase !== 'rest') return;
    if (restLeft <= 0) { setPhase('active'); return; }
    timerRef.current = setTimeout(() => setRestLeft(r => r - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [phase, restLeft]);

  const currentEntry = entries[exIdx];
  const currentEx = currentEntry?.exercise;
  const totalSets = currentEntry?.sets || 3;
  const totalExercises = entries.length;
  const mInfo = currentEx ? MUSCLES.find(m => m.id === currentEx.primary) : null;

  const formatTime = (s) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;

  const completedSetsForEx = (ei) => Object.keys(completed).filter(k => k.startsWith(`${ei}_`)).length;
  const totalCompletedSets = entries.reduce((sum, _, ei) => sum + completedSetsForEx(ei), 0);
  const totalSetsAll = entries.reduce((sum, e) => sum + (e.sets || 3), 0);
  const progress = totalSetsAll > 0 ? totalCompletedSets / totalSetsAll : 0;

  const key = `${exIdx}_${setIdx}`;
  const [curReps, setCurReps] = useState('');
  const [curWeight, setCurWeight] = useState('');

  // Reset inputs when set changes
  useEffect(() => {
    const prev = completed[key];
    setCurReps(prev?.reps || currentEntry?.reps || '');
    setCurWeight(prev?.weight !== undefined ? String(prev.weight) : String(currentEntry?.weight || 0));
  }, [exIdx, setIdx]);

  const validateSet = () => {
    const newCompleted = { ...completed, [key]: { reps: curReps, weight: +curWeight } };
    setCompleted(newCompleted);
    const rest = currentEntry?.rest || 90;

    // Avance
    if (setIdx + 1 < totalSets) {
      setSetIdx(s => s + 1);
      setPhase('rest');
      setRestLeft(rest);
    } else if (exIdx + 1 < totalExercises) {
      setExIdx(e => e + 1);
      setSetIdx(0);
      setPhase('rest');
      setRestLeft(rest);
    } else {
      setPhase('done');
    }
  };

  const skipRest = () => {
    clearTimeout(timerRef.current);
    setRestLeft(0);
    setPhase('active');
  };

  const addRest = (s) => setRestLeft(r => r + s);


  const [stravaStatus, setStravaStatus] = useState('idle');
  const startTimeRef = useRef(new Date().toISOString());

  useEffect(() => {
    if (phase !== 'done') return;
    // Sauvegarde dans localStorage ET Supabase
    const log = { id: Date.now(), workoutId: workout.id, workoutName: workout.name, date: new Date().toISOString(), duration: elapsed, totalVolume: Object.entries(completed).reduce((s,[,v])=>s+(v.weight||0)*(parseInt(v.reps)||0),0), completedSets: completed, entries: workout.entries||[] };
    try { const logs = JSON.parse(localStorage.getItem('pp_session_logs') || '[]'); localStorage.setItem('pp_session_logs', JSON.stringify([log, ...logs].slice(0, 50))); } catch {}
    // Sync directe vers Supabase si user connecté
    try {
      const userId = localStorage.getItem('pp_user_id');
      if (userId) {
        const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        fetch(SUPABASE_URL + '/rest/v1/sessions', {
          method: 'POST',
          headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
          body: JSON.stringify({ user_id: userId, workout_name: workout.name, duration: elapsed, total_volume: log.totalVolume, completed_sets: completed, entries: workout.entries||[], date: new Date().toISOString() })
        });
        // Vide le localStorage pour éviter les doublons lors de la sync
        localStorage.setItem('pp_session_logs', '[]');
      }
    } catch {}
    const token = localStorage.getItem('strava_token');
    const refreshToken = localStorage.getItem('strava_refresh_token');
    const expiresAt = parseInt(localStorage.getItem('strava_expires_at') || '0');
    if (!token) { setStravaStatus('no_token'); return; }
    setStravaStatus('syncing');
    const desc = (workout.entries||[]).map(e => (e.exercise?.name||'') + ': ' + e.sets + 'x' + e.reps + (e.weight ? ' @ ' + e.weight + 'kg' : '')).join('\n');
    fetch('/api/strava', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create_activity', token, refreshToken, expiresAt, name: '💪 ' + workout.name, duration: elapsed, start_time: startTimeRef.current, description: 'Séance PacePro\n\n' + desc }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.success) { setStravaStatus('ok'); if (d.newToken) localStorage.setItem('strava_token', d.newToken); if (d.newRefresh) localStorage.setItem('strava_refresh_token', d.newRefresh); if (d.newExpires) localStorage.setItem('strava_expires_at', String(d.newExpires)); }
        else if (d.needsReauth) { setStravaStatus('reauth'); }
        else { setStravaStatus('error'); }
      })
      .catch(() => setStravaStatus('error'));
  }, [phase]);

  if (phase === 'done') {
    const totalVol = Object.entries(completed).reduce((sum, [k, v]) => {
      const [ei] = k.split('_').map(Number);
      return sum + (v.weight || 0) * (parseInt(v.reps) || 0);
    }, 0);
    return (
      <div style={{ minHeight:'100vh', background:'var(--bg-primary)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24, fontFamily:'Syne, sans-serif' }}>
        <div style={{ fontSize:60, marginBottom:16 }}>🏆</div>
        <h2 style={{ fontSize:24, fontWeight:800, color:'var(--text-primary)', marginBottom:4, textAlign:'center' }}>Séance terminée !</h2>
        <p style={{ fontSize:13, color:'var(--text-muted)', marginBottom:32, textAlign:'center' }}>{workout.name}</p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, width:'100%', maxWidth:340, marginBottom:32 }}>
          {[
            ['⏱ Durée', formatTime(elapsed)],
            ['💪 Séries', `${totalCompletedSets}/${totalSetsAll}`],
            ['🔥 Volume', `${Math.round(totalVol)} kg`],
            ['✅ Exercices', `${totalExercises}`],
          ].map(([label, value]) => (
            <div key={label} style={{ ...card, textAlign:'center' }}>
              <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:4, fontFamily:'monospace' }}>{label}</div>
              <div style={{ fontSize:20, fontWeight:800, color:'var(--text-primary)', fontFamily:'monospace' }}>{value}</div>
            </div>
          ))}
        </div>
        {stravaStatus === 'syncing' && <div style={{ width:'100%', maxWidth:340, marginBottom:10, background:'rgba(252,76,2,0.08)', border:'1px solid rgba(252,76,2,0.3)', borderRadius:12, padding:'10px 14px', display:'flex', alignItems:'center', gap:10 }}><span style={{ fontSize:18 }}>🟠</span><div><div style={{ fontSize:12, fontWeight:700, color:'#FC4C02' }}>Synchronisation Strava...</div><div style={{ fontSize:11, color:'var(--text-muted)' }}>Création de l'activité</div></div></div>}
        {stravaStatus === 'ok' && <div style={{ width:'100%', maxWidth:340, marginBottom:10, background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.3)', borderRadius:12, padding:'10px 14px', display:'flex', alignItems:'center', gap:10 }}><span style={{ fontSize:18 }}>✅</span><div><div style={{ fontSize:12, fontWeight:700, color:'#22c55e' }}>Activité créée sur Strava !</div><div style={{ fontSize:11, color:'var(--text-muted)' }}>WeightTraining synchronisé</div></div></div>}
        {stravaStatus === 'error' && <div style={{ width:'100%', maxWidth:340, marginBottom:10, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:12, padding:'10px 14px', display:'flex', alignItems:'center', gap:10 }}><span style={{ fontSize:18 }}>⚠️</span><div><div style={{ fontSize:12, fontWeight:700, color:'rgba(239,68,68,0.9)' }}>Erreur Strava</div><div style={{ fontSize:11, color:'var(--text-muted)' }}>Séance sauvegardée localement</div></div></div>}
        {stravaStatus === 'no_token' && <div style={{ width:'100%', maxWidth:340, marginBottom:10, background:'var(--bg-input)', border:'1px solid var(--border)', borderRadius:12, padding:'10px 14px', display:'flex', alignItems:'center', gap:10 }}><span style={{ fontSize:18 }}>🔗</span><div><div style={{ fontSize:12, fontWeight:700, color:'var(--text-primary)' }}>Strava non connecté</div><div style={{ fontSize:11, color:'var(--text-muted)' }}>Connecte Strava pour synchroniser</div></div></div>}
        {stravaStatus === 'reauth' && <div style={{ width:'100%', maxWidth:340, marginBottom:10, background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:12, padding:'10px 14px', display:'flex', alignItems:'center', gap:10 }}><span style={{ fontSize:18 }}>🔄</span><div><div style={{ fontSize:12, fontWeight:700, color:'#f59e0b' }}>Session Strava expirée</div><div style={{ fontSize:11, color:'var(--text-muted)' }}>Reconnecte-toi dans l'onglet Strava</div></div></div>}
        <div style={{ width:'100%', maxWidth:340, marginBottom:10, fontSize:11, color:'var(--text-muted)', textAlign:'center', fontFamily:'monospace' }}>💾 Séance sauvegardée localement</div>
        <button onClick={onEnd} style={{ ...btnRed, width:'100%', maxWidth:340, padding:14, fontSize:14 }}>
          Terminer la séance
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-primary)', color:'var(--text-primary)', fontFamily:'Syne, sans-serif', paddingBottom:80 }}>

      {/* Header sticky */}
      <div style={{ position:'sticky', top:0, zIndex:50, background:'var(--bg-nav)', backdropFilter:'blur(20px)', borderBottom:'1px solid var(--border-nav)', padding:'0 16px', height:52, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <button onClick={onEnd} style={{ ...btnGhost, padding:'5px 10px', fontSize:12 }}>✕ Arrêter</button>
        <div style={{ fontSize:13, fontFamily:'monospace', color:'var(--text-primary)', fontWeight:700 }}>⏱ {formatTime(elapsed)}</div>
        <div style={{ fontSize:12, color:'var(--text-muted)', fontFamily:'monospace' }}>{exIdx+1}/{totalExercises}</div>
      </div>

      {/* Barre de progression globale */}
      <div style={{ height:3, background:'var(--bg-input)' }}>
        <div style={{ height:'100%', background:'#FF0040', width:`${progress*100}%`, transition:'width 0.4s' }} />
      </div>

      <div style={{ maxWidth:480, margin:'0 auto', padding:'20px 16px' }}>

        {/* PHASE REPOS */}
        {phase === 'rest' && (
          <div style={{ ...card, textAlign:'center', padding:'32px 20px', marginBottom:16, borderColor:'rgba(96,165,250,0.3)' }}>
            <div style={{ fontSize:11, color:'#60a5fa', fontFamily:'monospace', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:12 }}>Temps de repos</div>
            <div style={{ fontSize:64, fontWeight:900, fontFamily:'monospace', color: restLeft <= 10 ? '#FF0040' : '#60a5fa', marginBottom:16, lineHeight:1 }}>
              {formatTime(restLeft)}
            </div>
            {/* Arc progress */}
            <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:16 }}>
              Prochain : {exIdx + (setIdx + 1 < totalSets ? 0 : 1) < totalExercises
                ? `${setIdx + 1 < totalSets ? `Série ${setIdx+2}` : `${entries[exIdx+1]?.exercise?.name}`}`
                : 'Dernier exercice !'}
            </div>
            <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
              <button onClick={() => addRest(15)} style={{ ...btnGhost, padding:'6px 12px', fontSize:12 }}>+15s</button>
              <button onClick={skipRest} style={{ ...btnRed, padding:'8px 20px', fontSize:13 }}>⏭ Passer</button>
              <button onClick={() => addRest(-15)} style={{ ...btnGhost, padding:'6px 12px', fontSize:12 }}>-15s</button>
            </div>
          </div>
        )}

        {/* EXERCICE EN COURS */}
        {phase === 'active' && currentEntry && (
          <div>
            {/* Nom + muscle */}
            <div style={{ marginBottom:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
                {mInfo && <span style={{ fontSize:22 }}>{mInfo.emoji}</span>}
                <div>
                  <div style={{ fontSize:18, fontWeight:800, color:'var(--text-primary)', letterSpacing:'-0.02em' }}>{currentEx?.name}</div>
                  {mInfo && <div style={{ fontSize:11, color:mInfo.color, fontFamily:'monospace', fontWeight:600 }}>{mInfo.label}</div>}
                </div>
              </div>
              {currentEntry.modifier && currentEntry.modifier !== 'normal' && (
                <div style={{ display:'inline-block', background:'rgba(96,165,250,0.12)', border:'1px solid rgba(96,165,250,0.25)', borderRadius:8, padding:'3px 10px', fontSize:11, color:'#60a5fa', fontFamily:'monospace' }}>
                  ⚡ {INTENSITY_MODS.find(m=>m.id===currentEntry.modifier)?.label} — {INTENSITY_MODS.find(m=>m.id===currentEntry.modifier)?.desc}
                </div>
              )}
            </div>

            {/* Indicateur de série */}
            <div style={{ display:'flex', gap:6, marginBottom:20 }}>
              {Array.from({length:totalSets}).map((_,i) => {
                const done = completed[`${exIdx}_${i}`];
                const current = i === setIdx;
                return (
                  <div key={i} style={{ flex:1, height:6, borderRadius:4, background: done ? '#22c55e' : current ? '#FF0040' : 'var(--bg-input)', transition:'all 0.3s' }} />
                );
              })}
            </div>
            <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:16, fontFamily:'monospace' }}>
              Série <span style={{ color:'#FF0040', fontWeight:700 }}>{setIdx+1}</span> / {totalSets}
            </div>

            {/* Inputs reps + poids */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
              <div style={{ ...card, textAlign:'center', padding:'16px 12px' }}>
                <div style={{ fontSize:10, color:'var(--text-muted)', fontFamily:'monospace', textTransform:'uppercase', marginBottom:8 }}>Répétitions</div>
                <input type="number" inputMode="numeric"
                  style={{ ...inp(), width:'100%', fontSize:28, fontWeight:800, textAlign:'center', fontFamily:'monospace', padding:'8px 4px', background:'transparent', border:'none', outline:'none' }}
                  value={curReps} onChange={e=>setCurReps(e.target.value)} placeholder="—" />
                <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:4 }}>Cible: {currentEntry.reps}</div>
              </div>
              <div style={{ ...card, textAlign:'center', padding:'16px 12px' }}>
                <div style={{ fontSize:10, color:'var(--text-muted)', fontFamily:'monospace', textTransform:'uppercase', marginBottom:8 }}>Poids (kg)</div>
                <input type="number" inputMode="decimal" step="0.5"
                  style={{ ...inp(), width:'100%', fontSize:28, fontWeight:800, textAlign:'center', fontFamily:'monospace', padding:'8px 4px', background:'transparent', border:'none', outline:'none' }}
                  value={curWeight} onChange={e=>setCurWeight(e.target.value)} placeholder="0" />
                <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:4 }}>Prévu: {currentEntry.weight||0} kg</div>
              </div>
            </div>

            {/* Bouton valider */}
            <button onClick={validateSet}
              style={{ ...btnRed, width:'100%', padding:16, fontSize:16, fontWeight:800, marginBottom:12, borderRadius:14 }}>
              ✅ Série validée
            </button>

            {/* Séries passées */}
            {setIdx > 0 && (
              <div style={{ ...card, padding:'10px 14px' }}>
                <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:8, fontFamily:'monospace', textTransform:'uppercase' }}>Séries précédentes</div>
                {Array.from({length:setIdx}).map((_,i) => {
                  const s = completed[`${exIdx}_${i}`];
                  return s ? (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--text-secondary)', marginBottom:4 }}>
                      <span style={{ color:'var(--text-muted)' }}>Série {i+1}</span>
                      <span style={{ fontFamily:'monospace' }}>{s.reps} reps × {s.weight} kg</span>
                    </div>
                  ) : null;
                })}
              </div>
            )}
          </div>
        )}

        {/* Liste exercices restants */}
        <div style={{ marginTop:20 }}>
          <div style={{ fontSize:10, color:'var(--text-muted)', fontFamily:'monospace', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>Programme</div>
          {entries.map((e, ei) => {
            const ex = e.exercise;
            const m = ex ? MUSCLES.find(x=>x.id===ex.primary) : null;
            const doneCount = completedSetsForEx(ei);
            const isDone = doneCount >= (e.sets||3);
            const isCurrent = ei === exIdx;
            return (
              <div key={ei} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderRadius:10, marginBottom:6, background: isCurrent ? `${m?.color||'#FF0040'}15` : isDone ? 'rgba(34,197,94,0.06)' : 'var(--bg-input)', border:`1px solid ${isCurrent ? `${m?.color||'#FF0040'}40` : isDone ? 'rgba(34,197,94,0.2)' : 'transparent'}` }}>
                <span style={{ fontSize:16 }}>{isDone ? '✅' : isCurrent ? '▶️' : m?.emoji || '⬜'}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight: isCurrent ? 700 : 500, color: isDone ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: isDone ? 'line-through' : 'none' }}>{ex?.name}</div>
                  <div style={{ fontSize:10, color:'var(--text-muted)', fontFamily:'monospace' }}>{doneCount}/{e.sets||3} séries</div>
                </div>
                {isCurrent && <div style={{ width:6, height:6, borderRadius:'50%', background:'#FF0040' }} />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
