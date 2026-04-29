'use client';
import { useState, useEffect } from 'react';

const card = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px 18px' };
const lbl = { fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 8 };
const inp = () => ({ background: 'var(--bg-input)', border: '1px solid var(--border-input)', color: 'var(--text-primary)', borderRadius: 12, padding: '10px 14px', width: '100%', fontSize: 14, fontFamily: 'inherit', outline: 'none' });
const btnRed = { background: '#FF0040', color: '#000', border: 'none', borderRadius: 12, padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' };
const btnGhost = { background: 'var(--btn-ghost-bg)', border: '1px solid var(--btn-ghost-border)', color: 'var(--btn-ghost-color)', borderRadius: 12, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' };

const MUSCLE_GROUPS = [
  { id: 'pecs',       label: 'Pectoraux',    emoji: '🫁', color: '#FF0040' },
  { id: 'dos',        label: 'Dos',          emoji: '🔙', color: '#60a5fa' },
  { id: 'epaules',    label: 'Épaules',      emoji: '🎽', color: '#a78bfa' },
  { id: 'biceps',     label: 'Biceps',       emoji: '💪', color: '#f59e0b' },
  { id: 'triceps',    label: 'Triceps',      emoji: '🔱', color: '#f97316' },
  { id: 'quadris',    label: 'Quadriceps',   emoji: '🦵', color: '#22c55e' },
  { id: 'ischio',     label: 'Ischio-jamb.', emoji: '🦿', color: '#2dd4bf' },
  { id: 'fessiers',   label: 'Fessiers',     emoji: '🍑', color: '#ec4899' },
  { id: 'mollets',    label: 'Mollets',      emoji: '🦶', color: '#84cc16' },
  { id: 'abdos',      label: 'Abdos / Core', emoji: '⚡', color: '#eab308' },
  { id: 'lombaires',  label: 'Lombaires',    emoji: '🔧', color: '#6366f1' },
  { id: 'avant_bras', label: 'Avant-bras',   emoji: '🤜', color: '#9ca3af' },
];

const EXERCISES_BY_MUSCLE = {
  pecs: [
    { name: 'Développé couché barre',       detail: 'Exercice de base pectoraux' },
    { name: 'Développé couché haltères',    detail: "Plus d'amplitude que la barre" },
    { name: 'Développé incliné',            detail: 'Pectoraux hauts' },
    { name: 'Développé décliné',            detail: 'Pectoraux bas' },
    { name: 'Écarté haltères',              detail: 'Isolation pectoraux' },
    { name: 'Écarté à la poulie',           detail: 'Tension constante' },
    { name: 'Dips',                         detail: 'Pecs + triceps' },
    { name: 'Pompes',                       detail: 'Sans matériel' },
    { name: 'Pull-over',                    detail: 'Grand dorsal + pecs' },
    { name: 'Pec deck / Machine butterfly', detail: 'Isolation parfaite' },
  ],
  dos: [
    { name: 'Tractions (pull-up)',          detail: 'Exercice de base dos' },
    { name: 'Tirage horizontal',            detail: 'Épaisseur du dos' },
    { name: 'Rowing haltère unilatéral',    detail: 'Grand dorsal / rhomboïdes' },
    { name: 'Rowing barre',                 detail: 'Masse dorsale' },
    { name: 'Soulevé de terre',             detail: 'Dos entier + chaîne post.' },
    { name: 'Tirage nuque / devant',        detail: 'Grand dorsal' },
    { name: 'Rowing à la poulie basse',     detail: 'Dos médian' },
    { name: "Shrugs / Haussement d'épaules", detail: 'Trapèzes' },
    { name: 'Pull-over',                    detail: 'Grand dorsal' },
    { name: 'Hyperextension',               detail: 'Lombaires + dos' },
  ],
  epaules: [
    { name: 'Développé militaire barre',    detail: 'Deltoïdes antérieurs' },
    { name: 'Développé haltères assis',     detail: "Ensemble de l'épaule" },
    { name: 'Élévations latérales',         detail: 'Deltoïdes latéraux' },
    { name: 'Élévations frontales',         detail: 'Deltoïdes antérieurs' },
    { name: 'Face pull',                    detail: 'Deltoïdes postérieurs' },
    { name: 'Oiseau / Reverse fly',         detail: 'Épaules arrière' },
    { name: 'Arnold press',                 detail: 'Full épaule' },
    { name: 'Upright row',                  detail: 'Trapèzes + deltoïdes' },
    { name: 'Tirage menton',               detail: 'Deltoïdes + trapèzes' },
    { name: 'Rotation externe poulie',      detail: 'Coiffe des rotateurs' },
  ],
  biceps: [
    { name: 'Curl barre',                   detail: 'Exercice de base biceps' },
    { name: 'Curl haltères alterné',        detail: 'Concentration maximale' },
    { name: 'Curl concentré',              detail: 'Isolation biceps' },
    { name: 'Hammer curl',                 detail: 'Biceps + avant-bras' },
    { name: 'Curl incliné',               detail: 'Étirement complet' },
    { name: 'Curl à la poulie basse',     detail: 'Tension constante' },
    { name: 'Curl barre EZ',              detail: 'Moins de pression poignets' },
    { name: 'Curl araignée',              detail: 'Isolation biceps' },
    { name: 'Curl marteau câble',         detail: 'Long biceps' },
    { name: 'Chin-up',                    detail: 'Prise supination' },
  ],
  triceps: [
    { name: 'Dips',                        detail: 'Exercice de base triceps' },
    { name: 'Extensions triceps poulie',   detail: 'Isolation triceps' },
    { name: 'Barre au front (Skull crusher)', detail: 'Long triceps' },
    { name: 'Développé serré',            detail: 'Triceps + pecs intérieurs' },
    { name: 'Kickback haltère',           detail: 'Isolation triceps' },
    { name: 'Extensions nuque haltère',   detail: 'Long faisceau' },
    { name: 'Pushdown corde',             detail: 'Séparation des faisceaux' },
    { name: 'Diamond push-up',            detail: 'Sans matériel' },
    { name: 'JM press',                   detail: 'Triceps + force' },
    { name: 'Extensions une main poulie', detail: 'Unilatéral' },
  ],
  quadris: [
    { name: 'Squat',                      detail: 'Roi des exercices jambes' },
    { name: 'Presse à cuisses',           detail: 'Volume quadriceps' },
    { name: 'Fentes avant',              detail: 'Quadris + fessiers' },
    { name: 'Fentes arrière',            detail: 'Équilibre et stabilité' },
    { name: 'Leg extension',             detail: 'Isolation quadriceps' },
    { name: 'Hack squat',               detail: 'Quadriceps + fessiers' },
    { name: 'Gobelet squat',            detail: 'Technique et gainage' },
    { name: 'Bulgarian split squat',    detail: 'Unilatéral quadris/fessiers' },
    { name: 'Step-up',                  detail: 'Unilatéral fonctionnel' },
    { name: 'Sissy squat',              detail: 'Isolation quadriceps' },
  ],
  ischio: [
    { name: 'Leg curl couché',           detail: 'Isolation ischio-jambiers' },
    { name: 'Leg curl assis',            detail: 'Ischio-jambiers' },
    { name: 'Soulevé de terre jambes tendues (RDL)', detail: 'Ischio + lombaires' },
    { name: 'Soulevé de terre sumo',     detail: 'Ischio + adducteurs' },
    { name: 'Good morning',             detail: 'Ischio + lombaires' },
    { name: 'Nordic curl',              detail: 'Ischio excentrique' },
    { name: 'Glute ham raise',          detail: 'Ischio + fessiers' },
    { name: 'Hip hinge kettlebell',     detail: 'Chaîne postérieure' },
    { name: 'Swiss ball leg curl',      detail: 'Instabilité + ischio' },
    { name: 'Good morning assis',       detail: 'Étirement ischio' },
  ],
  fessiers: [
    { name: 'Hip thrust',               detail: 'Meilleur exercice fessiers' },
    { name: 'Squat bulgare',            detail: 'Fessiers + quadriceps' },
    { name: 'Soulevé de terre roumain', detail: 'Fessiers + ischio' },
    { name: 'Abduction hanche machine', detail: 'Fessiers latéraux' },
    { name: 'Donkey kick',             detail: 'Fessiers isolés' },
    { name: 'Fentes latérales',        detail: 'Fessiers + adducteurs' },
    { name: 'Step-up haltères',        detail: 'Unilatéral' },
    { name: 'Clamshell',               detail: 'Moyen fessier' },
    { name: 'Cable kickback',          detail: 'Isolation fessier' },
    { name: 'Squat sumo',              detail: 'Fessiers + adducteurs' },
  ],
  mollets: [
    { name: 'Mollets debout machine',   detail: 'Gastrocnémien' },
    { name: 'Mollets assis machine',    detail: 'Soléaire' },
    { name: 'Mollets à la presse',     detail: 'Volume mollets' },
    { name: 'Mollets debout haltères', detail: 'Sans machine' },
    { name: 'Mollets unilatéral',      detail: 'Force et équilibre' },
    { name: 'Sauts à la corde',        detail: 'Cardio + mollets' },
    { name: 'Montées sur pointes',     detail: 'Fonctionnel' },
    { name: 'Tibial raise',            detail: 'Tibiais antérieurs' },
  ],
  abdos: [
    { name: 'Crunch',                   detail: 'Exercice de base abdos' },
    { name: 'Relevé de jambes suspendu', detail: 'Abdos bas' },
    { name: 'Planche',                  detail: 'Core stabilisateur' },
    { name: 'Gainage latéral',         detail: 'Obliques' },
    { name: 'Russian twist',           detail: 'Obliques + rotation' },
    { name: 'Ab wheel',               detail: 'Core complet' },
    { name: 'Hollow body',            detail: 'Core profond' },
    { name: 'Pallof press',           detail: 'Anti-rotation' },
    { name: 'Dragon flag',            detail: 'Abdos avancé' },
    { name: 'Dead bug',               detail: 'Core fonctionnel' },
  ],
  lombaires: [
    { name: 'Hyperextension',          detail: 'Érecteurs du rachis' },
    { name: 'Soulevé de terre conventionnel', detail: 'Lombaires + dos complet' },
    { name: 'Good morning',           detail: 'Lombaires + ischio' },
    { name: 'Superman',               detail: 'Lombaires sans matériel' },
    { name: 'Bird dog',               detail: 'Stabilisation lombaire' },
    { name: 'Planche',                detail: 'Lombaires + core' },
    { name: 'Gainage arrière',        detail: 'Chaîne postérieure' },
    { name: 'Reverse hyper',          detail: 'Lombaires + fessiers' },
  ],
  avant_bras: [
    { name: 'Wrist curl flexion',      detail: 'Fléchisseurs avant-bras' },
    { name: 'Reverse wrist curl',     detail: 'Extenseurs avant-bras' },
    { name: 'Hammer curl',            detail: 'Brachioradial' },
    { name: "Farmer's walk",          detail: 'Force de préhension' },
    { name: 'Deadhang',               detail: 'Grip + avant-bras' },
    { name: 'Pronation / Supination', detail: 'Rotation avant-bras' },
    { name: 'Plate pinch',            detail: 'Force bout des doigts' },
    { name: 'Towel pull-up',          detail: 'Grip extrême' },
  ],
};

function ExerciseRow({ exercise, onUpdate, onDelete, editable }) {
  return (
    <div style={{ background: 'var(--bg-input)', borderRadius: 12, padding: '12px 14px', marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: editable ? 10 : 4 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{exercise.name}</div>
          {exercise.detail && <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{exercise.detail}</div>}
        </div>
        {editable && (
          <button onClick={onDelete} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '3px 8px', color: 'rgba(239,68,68,0.7)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0, marginLeft: 8 }}>✕</button>
        )}
      </div>
      {editable ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <div>
            <label style={{ ...lbl, fontSize: 10 }}>Séries</label>
            <input type="number" style={{ ...inp(), padding: '6px 10px', fontSize: 13 }} min="1" max="20" value={exercise.sets} onChange={e => onUpdate({ ...exercise, sets: +e.target.value })} />
          </div>
          <div>
            <label style={{ ...lbl, fontSize: 10 }}>Répétitions</label>
            <input style={{ ...inp(), padding: '6px 10px', fontSize: 13 }} value={exercise.reps} onChange={e => onUpdate({ ...exercise, reps: e.target.value })} placeholder="8-12" />
          </div>
          <div>
            <label style={{ ...lbl, fontSize: 10 }}>Poids (kg)</label>
            <input type="number" style={{ ...inp(), padding: '6px 10px', fontSize: 13 }} min="0" step="2.5" value={exercise.weight || ''} onChange={e => onUpdate({ ...exercise, weight: +e.target.value })} placeholder="—" />
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
          <span style={{ fontSize: 11, fontFamily: 'monospace', background: 'rgba(255,0,64,0.1)', color: '#FF0040', borderRadius: 6, padding: '2px 8px' }}>{exercise.sets} séries</span>
          <span style={{ fontSize: 11, fontFamily: 'monospace', background: 'var(--btn-ghost-bg)', color: 'var(--text-secondary)', borderRadius: 6, padding: '2px 8px' }}>{exercise.reps} reps</span>
          {exercise.weight > 0 && <span style={{ fontSize: 11, fontFamily: 'monospace', background: 'rgba(34,197,94,0.1)', color: '#22c55e', borderRadius: 6, padding: '2px 8px' }}>{exercise.weight} kg</span>}
        </div>
      )}
    </div>
  );
}

function ExercisePicker({ onAdd }) {
  const [activeMuscle, setActiveMuscle] = useState(null);
  const [customName, setCustomName] = useState('');
  const selectedGroup = MUSCLE_GROUPS.find(g => g.id === activeMuscle);
  const suggestions = activeMuscle ? EXERCISES_BY_MUSCLE[activeMuscle] || [] : [];

  const addSuggestion = (ex) => onAdd({ name: ex.name, detail: ex.detail, sets: 3, reps: '10', weight: 0 });
  const addCustom = () => {
    if (!customName.trim()) return;
    onAdd({ name: customName.trim(), detail: '', sets: 3, reps: '10', weight: 0 });
    setCustomName('');
  };

  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
        Choisir un groupe musculaire
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
        {MUSCLE_GROUPS.map(g => (
          <button key={g.id} onClick={() => setActiveMuscle(activeMuscle === g.id ? null : g.id)}
            style={{ borderRadius: 12, padding: '10px 8px', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center', transition: 'all 0.15s', background: activeMuscle === g.id ? `${g.color}20` : 'var(--bg-input)', border: `2px solid ${activeMuscle === g.id ? g.color : 'transparent'}` }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>{g.emoji}</div>
            <div style={{ fontSize: 10, fontWeight: 600, color: activeMuscle === g.id ? g.color : 'var(--text-secondary)', lineHeight: 1.2 }}>{g.label}</div>
          </button>
        ))}
      </div>

      {activeMuscle && selectedGroup && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: selectedGroup.color, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, fontWeight: 600 }}>
            {selectedGroup.emoji} {selectedGroup.label} — clique pour ajouter
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {suggestions.map(ex => (
              <button key={ex.name} onClick={() => addSuggestion(ex)}
                style={{ background: 'var(--bg-card)', border: `1px solid ${selectedGroup.color}25`, borderRadius: 10, padding: '10px 14px', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 1 }}>{ex.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{ex.detail}</div>
                </div>
                <span style={{ fontSize: 20, color: selectedGroup.color, flexShrink: 0, marginLeft: 8 }}>+</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
          Ou ajoute ton propre exercice
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input style={{ ...inp(), flex: 1 }} placeholder="Nom de l'exercice..." value={customName}
            onChange={e => setCustomName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCustom()} />
          <button onClick={addCustom} disabled={!customName.trim()}
            style={{ ...btnRed, padding: '10px 16px', opacity: customName.trim() ? 1 : 0.4, flexShrink: 0 }}>+ Ajouter</button>
        </div>
      </div>
    </div>
  );
}

function WorkoutEditor({ workout, onSave, onCancel }) {
  const [form, setForm] = useState(workout || { name: '', duration: 60, exercises: [] });
  const updateExercise = (i, ex) => setForm(f => ({ ...f, exercises: f.exercises.map((e, xi) => xi === i ? ex : e) }));
  const deleteExercise = (i) => setForm(f => ({ ...f, exercises: f.exercises.filter((_, xi) => xi !== i) }));
  const canSave = form.name.trim() && form.exercises.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={lbl}>Nom de la séance</label>
        <input style={inp()} placeholder="Ex: Push A — Semaine 1" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
      </div>
      <div>
        <label style={lbl}>Durée estimée (min)</label>
        <input type="number" style={inp()} min="10" max="180" step="5" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: +e.target.value }))} />
      </div>
      {form.exercises.length > 0 && (
        <div>
          <label style={{ ...lbl, marginBottom: 10 }}>Exercices sélectionnés ({form.exercises.length})</label>
          {form.exercises.map((ex, i) => (
            <ExerciseRow key={i} exercise={ex} editable onUpdate={ex => updateExercise(i, ex)} onDelete={() => deleteExercise(i)} />
          ))}
        </div>
      )}
      <div style={{ ...card, background: 'var(--bg-input)' }}>
        <ExercisePicker onAdd={ex => setForm(f => ({ ...f, exercises: [...f.exercises, ex] }))} />
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onCancel} style={{ ...btnGhost, flex: 1 }}>Annuler</button>
        <button onClick={() => canSave && onSave(form)} style={{ ...btnRed, flex: 2, opacity: canSave ? 1 : 0.4 }}>Sauvegarder</button>
      </div>
    </div>
  );
}

function WorkoutCard({ workout, onOpen, onDelete }) {
  return (
    <div onClick={onOpen} style={{ ...card, cursor: 'pointer' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{workout.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', gap: 12 }}>
            <span>💪 {workout.exercises.length} exercices</span>
            <span>⏱ {workout.duration} min</span>
            {workout.aiGenerated && <span style={{ background: 'rgba(96,165,250,0.1)', color: '#60a5fa', borderRadius: 6, padding: '1px 7px', fontWeight: 600 }}>✨ IA</span>}
          </div>
        </div>
        <button onClick={e => { e.stopPropagation(); onDelete(); }}
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 8, padding: '4px 10px', color: 'rgba(239,68,68,0.6)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
          Supprimer
        </button>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {[...new Set(workout.exercises.map(e => e.detail).filter(Boolean))].slice(0, 3).map(d => (
          <span key={d} style={{ fontSize: 10, color: 'var(--text-muted)', background: 'var(--bg-input)', borderRadius: 6, padding: '2px 8px' }}>{d}</span>
        ))}
      </div>
    </div>
  );
}

function WorkoutDetail({ workout, onBack, onEdit }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} style={{ ...btnGhost, padding: '8px 14px', fontSize: 13 }}>← Retour</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{workout.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{workout.exercises.length} exercices · {workout.duration} min</div>
        </div>
        <button onClick={onEdit} style={{ ...btnGhost, padding: '8px 14px', fontSize: 13 }}>✏️ Éditer</button>
      </div>
      {workout.exercises.map((ex, i) => <ExerciseRow key={i} exercise={ex} editable={false} />)}
    </div>
  );
}

function AIGenerator({ onSave, onCancel }) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);
  const suggestions = [
    'Séance pectoraux hypertrophie 60 min en salle',
    'Full body débutant à la maison sans matériel',
    'Séance dos et biceps 45 min',
    'Jambes complètes squat + ischio + fessiers',
    'Épaules et triceps 40 min',
  ];

  const generate = async () => {
    if (!prompt.trim()) return;
    setLoading(true); setError(''); setPreview(null);
    try {
      const fullPrompt = `Tu es un coach musculation expert. Génère une séance de sport en JSON UNIQUEMENT. Pas de texte avant ou après. Juste le JSON.
Demande: ${prompt}
JSON: {"name":"Nom séance","duration":60,"exercises":[{"name":"Nom exercice","detail":"muscle ciblé","sets":4,"reps":"8-12","weight":0}]}`;
      const res = await fetch('/api/gemini', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: fullPrompt }) });
      const data = await res.json();
      const raw = data.text || '';
      if (!raw) throw new Error('Réponse vide');
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Format invalide');
      const workout = JSON.parse(jsonMatch[0]);
      if (!workout.exercises?.length) throw new Error('Aucun exercice généré');
      setPreview({ ...workout, aiGenerated: true, id: Date.now() });
    } catch (e) { setError('Erreur : ' + e.message); }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ ...card, background: 'rgba(96,165,250,0.06)', borderColor: 'rgba(96,165,250,0.2)' }}>
        <div style={{ fontSize: 11, color: '#60a5fa', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'monospace' }}>✨ Génération par IA</div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>Décris ta séance — l'IA génère les exercices, séries et reps.</p>
      </div>
      <div>
        <label style={lbl}>Décris ta séance</label>
        <textarea style={{ ...inp(), minHeight: 80, resize: 'vertical', lineHeight: 1.6 }} placeholder="Ex: Séance pectoraux hypertrophie 60 min..." value={prompt} onChange={e => setPrompt(e.target.value)} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {suggestions.map(s => <button key={s} onClick={() => setPrompt(s)} style={{ ...btnGhost, textAlign: 'left', padding: '8px 12px', fontSize: 12 }}>{s}</button>)}
      </div>
      {error && <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: '10px 14px', fontSize: 12, color: 'rgba(239,68,68,0.9)' }}>{error}</div>}
      {!preview && (
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{ ...btnGhost, flex: 1 }}>Annuler</button>
          <button onClick={generate} disabled={loading || !prompt.trim()} style={{ ...btnRed, flex: 2, opacity: loading || !prompt.trim() ? 0.5 : 1 }}>
            {loading ? '⏳ Génération...' : '✨ Générer'}
          </button>
        </div>
      )}
      {preview && (
        <div>
          <div style={{ ...card, marginBottom: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{preview.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>⏱ {preview.duration} min · {preview.exercises.length} exercices</div>
            {preview.exercises.map((ex, i) => <ExerciseRow key={i} exercise={ex} editable={false} />)}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setPreview(null)} style={{ ...btnGhost, flex: 1 }}>Régénérer</button>
            <button onClick={() => onSave(preview)} style={{ ...btnRed, flex: 2 }}>💾 Sauvegarder</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MusculationModule() {
  const [workouts, setWorkouts] = useState([]);
  const [view, setView] = useState('list');
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    try { const s = localStorage.getItem('pp_workouts'); if (s) setWorkouts(JSON.parse(s)); } catch {}
  }, []);

  const save = (list) => { setWorkouts(list); try { localStorage.setItem('pp_workouts', JSON.stringify(list)); } catch {} };

  const handleSave = (workout) => {
    const w = { ...workout, id: workout.id || Date.now() };
    const list = editing ? workouts.map(x => x.id === selected.id ? w : x) : [...workouts, w];
    save(list); setSelected(w); setView('detail'); setEditing(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'Syne, sans-serif', paddingBottom: 60 }}>
      <div style={{ padding: '20px 20px 0', maxWidth: 700, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 2 }}>Musculation 💪</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{workouts.length} séance{workouts.length !== 1 ? 's' : ''}</p>
          </div>
          {view === 'list' && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setView('ai'); setSelected(null); }}
                style={{ background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.25)', color: '#60a5fa', borderRadius: 12, padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                ✨ IA
              </button>
              <button onClick={() => { setView('create'); setSelected(null); setEditing(false); }} style={{ ...btnRed, padding: '8px 14px', fontSize: 12 }}>+ Créer</button>
            </div>
          )}
        </div>
      </div>
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 20px' }}>
        {view === 'list' && (
          workouts.length === 0 ? (
            <div style={{ ...card, textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🏋️</div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Aucune séance</div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>Crée ta première séance ou laisse l'IA en générer une.</p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button onClick={() => setView('ai')} style={{ background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.25)', color: '#60a5fa', borderRadius: 12, padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>✨ IA</button>
                <button onClick={() => setView('create')} style={btnRed}>+ Créer</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {workouts.map(w => (
                <WorkoutCard key={w.id} workout={w} onOpen={() => { setSelected(w); setView('detail'); }} onDelete={() => save(workouts.filter(x => x.id !== w.id))} />
              ))}
            </div>
          )
        )}
        {(view === 'create' || (view === 'detail' && editing)) && (
          <WorkoutEditor workout={editing ? selected : null} onSave={handleSave} onCancel={() => { setView(editing ? 'detail' : 'list'); setEditing(false); }} />
        )}
        {view === 'detail' && !editing && selected && (
          <WorkoutDetail workout={selected} onBack={() => setView('list')} onEdit={() => setEditing(true)} />
        )}
        {view === 'ai' && (
          <AIGenerator onSave={handleSave} onCancel={() => setView('list')} />
        )}
      </div>
    </div>
  );
}
