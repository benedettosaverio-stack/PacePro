'use client';
import { useState, useEffect } from 'react';

const card = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px 18px' };
const lbl = { fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 8 };
const inp = () => ({ background: 'var(--bg-input)', border: '1px solid var(--border-input)', color: 'var(--text-primary)', borderRadius: 12, padding: '10px 14px', width: '100%', fontSize: 14, fontFamily: 'inherit', outline: 'none' });
const btnRed = { background: '#FF0040', color: '#000', border: 'none', borderRadius: 12, padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' };
const btnGhost = { background: 'var(--btn-ghost-bg)', border: '1px solid var(--btn-ghost-border)', color: 'var(--btn-ghost-color)', borderRadius: 12, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' };

const SESSION_TYPES = [
  { id: 'push', label: 'Push', emoji: '🔺', color: '#FF0040' },
  { id: 'pull', label: 'Pull', emoji: '🔻', color: '#60a5fa' },
  { id: 'legs', label: 'Legs', emoji: '🦵', color: '#22c55e' },
  { id: 'full_body', label: 'Full Body', emoji: '💪', color: '#f59e0b' },
  { id: 'upper', label: 'Upper', emoji: '⬆️', color: '#a78bfa' },
  { id: 'lower', label: 'Lower', emoji: '⬇️', color: '#f97316' },
  { id: 'cardio', label: 'Cardio', emoji: '🏃', color: '#2dd4bf' },
  { id: 'custom', label: 'Custom', emoji: '✏️', color: '#9ca3af' },
];

function ExerciseRow({ exercise, onUpdate, onDelete, editable }) {
  return (
    <div style={{ background: 'var(--bg-input)', borderRadius: 12, padding: '12px 14px', marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: editable ? 10 : 4 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{exercise.name}</div>
          {exercise.muscle && <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{exercise.muscle}</div>}
        </div>
        {editable && (
          <button onClick={onDelete} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '3px 8px', color: 'rgba(239,68,68,0.7)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>✕</button>
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
          {exercise.rest && <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-muted)', borderRadius: 6, padding: '2px 8px' }}>⏱ {exercise.rest}s</span>}
        </div>
      )}
      {exercise.notes && !editable && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, fontStyle: 'italic' }}>{exercise.notes}</div>}
    </div>
  );
}

function WorkoutEditor({ workout, onSave, onCancel }) {
  const [form, setForm] = useState(workout || { name: '', type: 'full_body', duration: 60, exercises: [], notes: '' });
  const [newExName, setNewExName] = useState('');
  const [newExMuscle, setNewExMuscle] = useState('');
  const addExercise = () => {
    if (!newExName.trim()) return;
    setForm(f => ({ ...f, exercises: [...f.exercises, { name: newExName, muscle: newExMuscle, sets: 3, reps: '10', weight: 0, rest: 90, notes: '' }] }));
    setNewExName(''); setNewExMuscle('');
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div><label style={lbl}>Nom de la séance</label><input style={inp()} placeholder="Ex: Push A" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
      <div>
        <label style={lbl}>Type</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {SESSION_TYPES.map(t => (
            <button key={t.id} onClick={() => setForm(f => ({ ...f, type: t.id }))}
              style={{ background: form.type === t.id ? `${t.color}20` : 'var(--btn-ghost-bg)', border: `1px solid ${form.type === t.id ? t.color + '60' : 'var(--btn-ghost-border)'}`, color: form.type === t.id ? t.color : 'var(--btn-ghost-color)', borderRadius: 10, padding: '8px 4px', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center' }}>
              {t.emoji}<br />{t.label}
            </button>
          ))}
        </div>
      </div>
      <div><label style={lbl}>Durée (min)</label><input type="number" style={inp()} min="10" max="180" step="5" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: +e.target.value }))} /></div>
      <div>
        <label style={lbl}>Exercices ({form.exercises.length})</label>
        {form.exercises.map((ex, i) => (
          <ExerciseRow key={i} exercise={ex} editable onUpdate={ex => setForm(f => ({ ...f, exercises: f.exercises.map((e, idx) => idx === i ? ex : e) }))} onDelete={() => setForm(f => ({ ...f, exercises: f.exercises.filter((_, idx) => idx !== i) }))} />
        ))}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <input style={{ ...inp(), flex: 2 }} placeholder="Nom exercice" value={newExName} onChange={e => setNewExName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addExercise()} />
          <input style={{ ...inp(), flex: 1 }} placeholder="Muscle" value={newExMuscle} onChange={e => setNewExMuscle(e.target.value)} onKeyDown={e => e.key === 'Enter' && addExercise()} />
          <button onClick={addExercise} style={{ ...btnRed, padding: '10px 14px' }}>+</button>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onCancel} style={{ ...btnGhost, flex: 1 }}>Annuler</button>
        <button onClick={() => form.name && form.exercises.length > 0 && onSave(form)} style={{ ...btnRed, flex: 2, opacity: form.name && form.exercises.length > 0 ? 1 : 0.4 }}>Sauvegarder</button>
      </div>
    </div>
  );
}

function WorkoutCard({ workout, onOpen, onDelete }) {
  const t = SESSION_TYPES.find(t => t.id === workout.type) || SESSION_TYPES[3];
  return (
    <div onClick={onOpen} style={{ ...card, cursor: 'pointer', borderColor: `${t.color}30` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `${t.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{t.emoji}</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{workout.name}</div>
            <div style={{ fontSize: 11, color: t.color, fontWeight: 600 }}>{t.label}</div>
          </div>
        </div>
        <button onClick={e => { e.stopPropagation(); onDelete(); }} style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 8, padding: '4px 8px', color: 'rgba(239,68,68,0.6)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>Supprimer</button>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-muted)' }}>💪 {workout.exercises.length} exercices · ⏱ {workout.duration} min</span>
        {workout.aiGenerated && <span style={{ fontSize: 10, background: 'rgba(96,165,250,0.1)', color: '#60a5fa', borderRadius: 6, padding: '1px 7px', fontWeight: 600 }}>✨ IA</span>}
      </div>
    </div>
  );
}

function WorkoutDetail({ workout, onBack, onEdit }) {
  const t = SESSION_TYPES.find(t => t.id === workout.type) || SESSION_TYPES[3];
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} style={{ ...btnGhost, padding: '8px 14px', fontSize: 13 }}>← Retour</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{workout.name}</div>
          <div style={{ fontSize: 11, color: t.color, fontWeight: 600 }}>{t.label} · {workout.duration} min</div>
        </div>
        <button onClick={onEdit} style={{ ...btnGhost, padding: '8px 14px', fontSize: 13 }}>✏️ Éditer</button>
      </div>
      {workout.exercises.map((ex, i) => <ExerciseRow key={i} exercise={ex} editable={false} />)}
      {workout.notes && <div style={{ ...card, marginTop: 16, fontSize: 13, color: 'var(--text-secondary)', fontStyle: 'italic' }}>📝 {workout.notes}</div>}
    </div>
  );
}

function AIGenerator({ onSave, onCancel }) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);

  const suggestions = [
    'Séance push hypertrophie 60 min en salle',
    'Full body débutant à la maison sans matériel',
    'Séance legs avec squat et deadlift',
    'Upper body 45 min pour gain de force',
    'Séance pull dos et biceps',
  ];

  const generate = async () => {
    if (!prompt.trim()) return;
    setLoading(true); setError(''); setPreview(null);
    try {
      const fullPrompt = `Tu es un coach musculation expert. Génère une séance de sport en JSON UNIQUEMENT. Pas de texte avant ou après. Juste le JSON.
Demande: ${prompt}
JSON à retourner (respecte exactement cette structure):
{"name":"Nom de la séance","type":"push","duration":60,"exercises":[{"name":"Nom exercice","muscle":"Muscle ciblé","sets":4,"reps":"8-12","rest":90,"notes":"conseil"}]}
Types valides: push, pull, legs, full_body, upper, lower, cardio, custom`;

      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: fullPrompt })
      });
      const data = await res.json();
      const raw = data.text || '';
      if (!raw) throw new Error('Réponse vide du serveur');

      // Extract JSON from response
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Format invalide reçu: ' + raw.slice(0, 100));
      const workout = JSON.parse(jsonMatch[0]);
      if (!workout.exercises || !Array.isArray(workout.exercises)) throw new Error('Structure invalide');
      setPreview({ ...workout, aiGenerated: true, id: Date.now() });
    } catch (e) {
      setError('Erreur : ' + e.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ ...card, background: 'rgba(96,165,250,0.06)', borderColor: 'rgba(96,165,250,0.2)' }}>
        <div style={{ fontSize: 11, color: '#60a5fa', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'monospace' }}>✨ Génération par IA</div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>Décris ta séance idéale — l'IA génère les exercices, séries et reps adaptés.</p>
      </div>
      <div>
        <label style={lbl}>Décris ta séance</label>
        <textarea style={{ ...inp(), minHeight: 80, resize: 'vertical', lineHeight: 1.6 }}
          placeholder="Ex: Séance push hypertrophie 60 min en salle, 4 exercices..."
          value={prompt} onChange={e => setPrompt(e.target.value)} />
      </div>
      <div>
        <label style={{ ...lbl, marginBottom: 10 }}>Suggestions</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {suggestions.map(s => (
            <button key={s} onClick={() => setPrompt(s)} style={{ ...btnGhost, textAlign: 'left', padding: '8px 12px', fontSize: 12 }}>{s}</button>
          ))}
        </div>
      </div>
      {error && <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: '10px 14px', fontSize: 12, color: 'rgba(239,68,68,0.9)' }}>{error}</div>}
      {!preview && (
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{ ...btnGhost, flex: 1 }}>Annuler</button>
          <button onClick={generate} disabled={loading || !prompt.trim()} style={{ ...btnRed, flex: 2, opacity: loading || !prompt.trim() ? 0.5 : 1 }}>
            {loading ? '⏳ Génération en cours...' : '✨ Générer la séance'}
          </button>
        </div>
      )}
      {preview && (
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, textAlign: 'center' }}>✅ Séance générée — vérifie et sauvegarde</div>
          <div style={{ ...card, marginBottom: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{preview.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>⏱ {preview.duration} min · {preview.exercises.length} exercices</div>
            {preview.exercises.map((ex, i) => <ExerciseRow key={i} exercise={ex} editable={false} />)}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => { setPreview(null); }} style={{ ...btnGhost, flex: 1 }}>Régénérer</button>
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
              <button onClick={() => { setView('ai'); setSelected(null); }} style={{ background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.25)', color: '#60a5fa', borderRadius: 12, padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>✨ IA</button>
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
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Aucune séance pour l'instant</div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>Crée ta première séance manuellement ou laisse l'IA en générer une.</p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button onClick={() => setView('ai')} style={{ background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.25)', color: '#60a5fa', borderRadius: 12, padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>✨ Générer avec l'IA</button>
                <button onClick={() => setView('create')} style={btnRed}>+ Créer manuellement</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {workouts.map(w => <WorkoutCard key={w.id} workout={w} onOpen={() => { setSelected(w); setView('detail'); }} onDelete={() => save(workouts.filter(x => x.id !== w.id))} />)}
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
