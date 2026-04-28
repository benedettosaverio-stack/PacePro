'use client';
import { useState, useEffect } from 'react';

// ─── Styles partagés ──────────────────────────────────────────────────────────
const card = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px 18px' };
const lbl = { fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 8 };
const inp = () => ({ background: 'var(--bg-input)', border: '1px solid var(--border-input)', color: 'var(--text-primary)', borderRadius: 12, padding: '10px 14px', width: '100%', fontSize: 14, fontFamily: 'inherit', outline: 'none' });
const btnRed = { background: '#FF0040', color: '#000', border: 'none', borderRadius: 12, padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' };
const btnGhost = { background: 'var(--btn-ghost-bg)', border: '1px solid var(--btn-ghost-border)', color: 'var(--btn-ghost-color)', borderRadius: 12, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' };

// ─── Types de séances ─────────────────────────────────────────────────────────
const SESSION_TYPES = [
  { id: 'ppl_push', label: 'Push', emoji: '🔺', color: '#FF0040' },
  { id: 'ppl_pull', label: 'Pull', emoji: '🔻', color: '#60a5fa' },
  { id: 'ppl_legs', label: 'Legs', emoji: '🦵', color: '#22c55e' },
  { id: 'full_body', label: 'Full Body', emoji: '💪', color: '#f59e0b' },
  { id: 'upper', label: 'Upper', emoji: '⬆️', color: '#a78bfa' },
  { id: 'lower', label: 'Lower', emoji: '⬇️', color: '#f97316' },
  { id: 'cardio', label: 'Cardio', emoji: '🏃', color: '#2dd4bf' },
  { id: 'custom', label: 'Custom', emoji: '✏️', color: '#9ca3af' },
];

// ─── Appel Gemini ─────────────────────────────────────────────────────────────
async function callGemini(prompt) {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 2000 }
    })
  });
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// ─── Générateur de séance par IA ──────────────────────────────────────────────
async function generateWorkoutAI(prompt, context) {
  const systemPrompt = `Tu es un coach de musculation expert. Génère un entraînement structuré en JSON strict.
Contexte utilisateur : ${context}
Demande : ${prompt}

Réponds UNIQUEMENT avec ce JSON (pas de markdown, pas d'explication) :
{
  "name": "Nom de la séance",
  "type": "push|pull|legs|full_body|upper|lower|cardio|custom",
  "duration": 60,
  "exercises": [
    {
      "name": "Nom exercice",
      "muscle": "Muscle ciblé",
      "sets": 4,
      "reps": "8-12",
      "rest": 90,
      "notes": "Conseil technique optionnel"
    }
  ]
}`;
  const raw = await callGemini(systemPrompt);
  const clean = raw.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

// ─── Composant exercice dans une séance ───────────────────────────────────────
function ExerciseRow({ exercise, onUpdate, onDelete, editable }) {
  return (
    <div style={{ background: 'var(--bg-input)', borderRadius: 12, padding: '12px 14px', marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: editable ? 10 : 4 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{exercise.name}</div>
          {exercise.muscle && <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{exercise.muscle}</div>}
        </div>
        {editable && (
          <button onClick={onDelete} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '3px 8px', color: 'rgba(239,68,68,0.7)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>✕</button>
        )}
      </div>
      {editable ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <div>
            <label style={{ ...lbl, fontSize: 10 }}>Séries</label>
            <input type="number" style={{ ...inp(), padding: '6px 10px', fontSize: 13 }} min="1" max="20" value={exercise.sets}
              onChange={e => onUpdate({ ...exercise, sets: +e.target.value })} />
          </div>
          <div>
            <label style={{ ...lbl, fontSize: 10 }}>Répétitions</label>
            <input style={{ ...inp(), padding: '6px 10px', fontSize: 13 }} value={exercise.reps}
              onChange={e => onUpdate({ ...exercise, reps: e.target.value })} placeholder="8-12" />
          </div>
          <div>
            <label style={{ ...lbl, fontSize: 10 }}>Poids (kg)</label>
            <input type="number" style={{ ...inp(), padding: '6px 10px', fontSize: 13 }} min="0" step="2.5" value={exercise.weight || ''}
              onChange={e => onUpdate({ ...exercise, weight: +e.target.value })} placeholder="—" />
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 6 }}>
          <span style={{ fontSize: 11, fontFamily: 'monospace', background: 'rgba(255,0,64,0.1)', color: '#FF0040', borderRadius: 6, padding: '2px 8px' }}>{exercise.sets} séries</span>
          <span style={{ fontSize: 11, fontFamily: 'monospace', background: 'var(--btn-ghost-bg)', color: 'var(--text-secondary)', borderRadius: 6, padding: '2px 8px' }}>{exercise.reps} reps</span>
          {exercise.weight > 0 && <span style={{ fontSize: 11, fontFamily: 'monospace', background: 'rgba(34,197,94,0.1)', color: '#22c55e', borderRadius: 6, padding: '2px 8px' }}>{exercise.weight} kg</span>}
          {exercise.rest && <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-muted)', borderRadius: 6, padding: '2px 8px' }}>⏱ {exercise.rest}s</span>}
        </div>
      )}
      {exercise.notes && !editable && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, fontStyle: 'italic' }}>{exercise.notes}</div>
      )}
    </div>
  );
}

// ─── Création/édition séance ──────────────────────────────────────────────────
function WorkoutEditor({ workout, onSave, onCancel }) {
  const [form, setForm] = useState(workout || {
    name: '', type: 'full_body', duration: 60, exercises: [], notes: ''
  });
  const [newExName, setNewExName] = useState('');
  const [newExMuscle, setNewExMuscle] = useState('');

  const addExercise = () => {
    if (!newExName.trim()) return;
    setForm(f => ({
      ...f,
      exercises: [...f.exercises, { name: newExName, muscle: newExMuscle, sets: 3, reps: '10', weight: 0, rest: 90, notes: '' }]
    }));
    setNewExName('');
    setNewExMuscle('');
  };

  const updateExercise = (i, ex) => setForm(f => ({ ...f, exercises: f.exercises.map((e, idx) => idx === i ? ex : e) }));
  const deleteExercise = (i) => setForm(f => ({ ...f, exercises: f.exercises.filter((_, idx) => idx !== i) }));
  const sessionType = SESSION_TYPES.find(t => t.id === form.type) || SESSION_TYPES[3];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={lbl}>Nom de la séance</label>
        <input style={inp()} placeholder="Ex: Push A - Poitrine/Épaules" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
      </div>

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

      <div>
        <label style={lbl}>Durée estimée (min)</label>
        <input type="number" style={inp()} min="10" max="180" step="5" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: +e.target.value }))} />
      </div>

      <div>
        <label style={lbl}>Exercices ({form.exercises.length})</label>
        {form.exercises.map((ex, i) => (
          <ExerciseRow key={i} exercise={ex} editable onUpdate={ex => updateExercise(i, ex)} onDelete={() => deleteExercise(i)} />
        ))}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <input style={{ ...inp(), flex: 2 }} placeholder="Nom de l'exercice" value={newExName} onChange={e => setNewExName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addExercise()} />
          <input style={{ ...inp(), flex: 1 }} placeholder="Muscle" value={newExMuscle} onChange={e => setNewExMuscle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addExercise()} />
          <button onClick={addExercise} style={{ ...btnRed, padding: '10px 14px', flexShrink: 0 }}>+</button>
        </div>
      </div>

      <div>
        <label style={lbl}>Notes (optionnel)</label>
        <input style={inp()} placeholder="Ex: Jour de repos avant, objectif force..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
        <button onClick={onCancel} style={{ ...btnGhost, flex: 1 }}>Annuler</button>
        <button onClick={() => form.name && form.exercises.length > 0 && onSave(form)}
          style={{ ...btnRed, flex: 2, opacity: form.name && form.exercises.length > 0 ? 1 : 0.4 }}>
          Sauvegarder la séance
        </button>
      </div>
    </div>
  );
}

// ─── Carte séance ─────────────────────────────────────────────────────────────
function WorkoutCard({ workout, onOpen, onDelete }) {
  const sessionType = SESSION_TYPES.find(t => t.id === workout.type) || SESSION_TYPES[3];
  return (
    <div onClick={onOpen} style={{ ...card, cursor: 'pointer', transition: 'all 0.2s', borderColor: `${sessionType.color}30` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `${sessionType.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{sessionType.emoji}</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{workout.name}</div>
            <div style={{ fontSize: 11, color: sessionType.color, fontWeight: 600, marginTop: 1 }}>{sessionType.label}</div>
          </div>
        </div>
        <button onClick={e => { e.stopPropagation(); onDelete(); }}
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 8, padding: '4px 8px', color: 'rgba(239,68,68,0.6)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
          Supprimer
        </button>
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-muted)' }}>💪 {workout.exercises.length} exercices</span>
        <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-muted)' }}>⏱ {workout.duration} min</span>
        {workout.aiGenerated && <span style={{ fontSize: 10, background: 'rgba(96,165,250,0.1)', color: '#60a5fa', borderRadius: 6, padding: '1px 7px', fontWeight: 600 }}>✨ IA</span>}
      </div>
    </div>
  );
}

// ─── Vue détail séance ────────────────────────────────────────────────────────
function WorkoutDetail({ workout, onBack, onEdit }) {
  const sessionType = SESSION_TYPES.find(t => t.id === workout.type) || SESSION_TYPES[3];
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} style={{ ...btnGhost, padding: '8px 14px', fontSize: 13 }}>← Retour</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{workout.name}</div>
          <div style={{ fontSize: 11, color: sessionType.color, fontWeight: 600 }}>{sessionType.label} · {workout.duration} min</div>
        </div>
        <button onClick={onEdit} style={{ ...btnGhost, padding: '8px 14px', fontSize: 13 }}>✏️ Éditer</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {workout.exercises.map((ex, i) => (
          <ExerciseRow key={i} exercise={ex} editable={false} />
        ))}
      </div>
      {workout.notes && (
        <div style={{ ...card, marginTop: 16, fontSize: 13, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
          📝 {workout.notes}
        </div>
      )}
    </div>
  );
}

// ─── Générateur IA ────────────────────────────────────────────────────────────
function AIGenerator({ onSave, onCancel }) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);

  const suggestions = [
    'Séance push hypertrophie 60 min en salle',
    'Full body débutant à la maison sans matériel',
    'Séance legs powerlifting avec squat et deadlift',
    'Upper body 45 min pour gain de force',
    'Séance pull dos et biceps salle complète',
  ];

  const generate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError('');
    setPreview(null);
    try {
      const context = 'Types: cross-training, fitness, hypertrophie, powerlifting. Équipement: salle ou maison.';
      const workout = await generateWorkoutAI(prompt, context);
      setPreview({ ...workout, aiGenerated: true, id: Date.now() });
    } catch (e) {
      setError('Erreur de génération. Vérifie ta clé API Gemini dans .env.local');
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ ...card, background: 'rgba(96,165,250,0.06)', borderColor: 'rgba(96,165,250,0.2)' }}>
        <div style={{ fontSize: 11, color: '#60a5fa', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'monospace' }}>✨ Génération par IA</div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>Décris ta séance idéale en langage naturel — l'IA génère les exercices, séries et répétitions adaptés.</p>
      </div>

      <div>
        <label style={lbl}>Décris ta séance</label>
        <textarea style={{ ...inp(), minHeight: 80, resize: 'vertical', lineHeight: 1.6 }}
          placeholder="Ex: Séance push hypertrophie 60 min en salle, 4 exercices, objectif prise de masse..."
          value={prompt} onChange={e => setPrompt(e.target.value)} />
      </div>

      <div>
        <label style={{ ...lbl, marginBottom: 10 }}>Suggestions rapides</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {suggestions.map(s => (
            <button key={s} onClick={() => setPrompt(s)}
              style={{ ...btnGhost, textAlign: 'left', padding: '8px 12px', fontSize: 12 }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {error && <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: '10px 14px', fontSize: 12, color: 'rgba(239,68,68,0.9)' }}>{error}</div>}

      {!preview && (
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{ ...btnGhost, flex: 1 }}>Annuler</button>
          <button onClick={generate} disabled={loading || !prompt.trim()}
            style={{ ...btnRed, flex: 2, opacity: loading || !prompt.trim() ? 0.5 : 1 }}>
            {loading ? '⏳ Génération...' : '✨ Générer la séance'}
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
            <button onClick={() => { setPreview(null); setPrompt(''); }} style={{ ...btnGhost, flex: 1 }}>Régénérer</button>
            <button onClick={() => onSave(preview)} style={{ ...btnRed, flex: 2 }}>💾 Sauvegarder</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Module principal Muscu ───────────────────────────────────────────────────
export default function MusculationModule() {
  const [workouts, setWorkouts] = useState([]);
  const [view, setView] = useState('list'); // list | create | detail | ai
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    try { const s = localStorage.getItem('pp_workouts'); if (s) setWorkouts(JSON.parse(s)); } catch {}
  }, []);

  const save = (list) => {
    setWorkouts(list);
    try { localStorage.setItem('pp_workouts', JSON.stringify(list)); } catch {}
  };

  const handleSave = (workout) => {
    const w = { ...workout, id: workout.id || Date.now() };
    const list = selected && !editing
      ? workouts.map(x => x.id === selected.id ? w : x)
      : [...workouts, w];
    save(list);
    setSelected(w);
    setView('detail');
    setEditing(false);
  };

  const handleDelete = (id) => {
    save(workouts.filter(w => w.id !== id));
    setView('list');
    setSelected(null);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'Syne, sans-serif', paddingBottom: 60 }}>

      {/* Header */}
      <div style={{ padding: '20px 20px 0', maxWidth: 700, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 2 }}>Musculation 💪</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{workouts.length} séance{workouts.length !== 1 ? 's' : ''} sauvegardée{workouts.length !== 1 ? 's' : ''}</p>
          </div>
          {view === 'list' && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setView('ai'); setSelected(null); }}
                style={{ background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.25)', color: '#60a5fa', borderRadius: 12, padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                ✨ IA
              </button>
              <button onClick={() => { setView('create'); setSelected(null); setEditing(false); }} style={{ ...btnRed, padding: '8px 14px', fontSize: 12 }}>
                + Créer
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 20px' }}>

        {/* Liste */}
        {view === 'list' && (
          <div>
            {workouts.length === 0 ? (
              <div style={{ ...card, textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🏋️</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Aucune séance pour l'instant</div>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>Crée ta première séance manuellement ou laisse l'IA en générer une pour toi.</p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  <button onClick={() => setView('ai')} style={{ background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.25)', color: '#60a5fa', borderRadius: 12, padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>✨ Générer avec l'IA</button>
                  <button onClick={() => setView('create')} style={{ ...btnRed }}>+ Créer manuellement</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {workouts.map(w => (
                  <WorkoutCard key={w.id} workout={w}
                    onOpen={() => { setSelected(w); setView('detail'); }}
                    onDelete={() => handleDelete(w.id)} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Création */}
        {(view === 'create' || (view === 'detail' && editing)) && (
          <WorkoutEditor
            workout={editing ? selected : null}
            onSave={handleSave}
            onCancel={() => { setView(editing ? 'detail' : 'list'); setEditing(false); }} />
        )}

        {/* Détail */}
        {view === 'detail' && !editing && selected && (
          <WorkoutDetail
            workout={selected}
            onBack={() => setView('list')}
            onEdit={() => setEditing(true)} />
        )}

        {/* IA */}
        {view === 'ai' && (
          <AIGenerator
            onSave={(w) => { handleSave(w); }}
            onCancel={() => setView('list')} />
        )}
      </div>
    </div>
  );
}
