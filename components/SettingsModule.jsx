'use client';
import { useState, useEffect } from 'react';
import Icon from './Icons';

const STORAGE_KEY = 'pp_user_settings';

function loadSettings() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
}

function saveSettings(s) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
}

function Toggle({ value, onChange, color = '#FF0040' }) {
  return (
    <div onClick={() => onChange(!value)} style={{ width: 44, height: 26, borderRadius: 99, background: value ? color : 'rgba(255,255,255,0.1)', cursor: 'pointer', position: 'relative', transition: 'background 0.3s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 3, left: value ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.3s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }}/>
    </div>
  );
}

function SegmentedControl({ options, value, onChange, color = '#FF0040' }) {
  return (
    <div style={{ display: 'flex', background: 'var(--bg-input)', borderRadius: 12, padding: 3, gap: 2 }}>
      {options.map(([v, l]) => (
        <button key={v} onClick={() => onChange(v)} style={{ flex: 1, padding: '8px 4px', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: 'Syne, sans-serif', fontSize: 11, fontWeight: 700, transition: 'all 0.2s', background: value === v ? color : 'transparent', color: value === v ? '#fff' : 'var(--text-muted)' }}>{l}</button>
      ))}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', fontFamily: 'DM Mono, monospace', marginBottom: 10, paddingLeft: 4 }}>{title}</div>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 18, overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );
}

function Row({ label, sub, children, last }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: last ? 'none' : '1px solid var(--border)', gap: 12 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
      </div>
      {children}
    </div>
  );
}

function NumberInput({ value, onChange, min, max, unit }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <button onClick={() => onChange(Math.max(min, value - 1))} style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
      <div style={{ minWidth: 50, textAlign: 'center' }}>
        <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'DM Mono, monospace' }}>{value}</span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 3 }}>{unit}</span>
      </div>
      <button onClick={() => onChange(Math.min(max, value + 1))} style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
    </div>
  );
}

export default function SettingsModule({ onBack, user }) {
  const [s, setS] = useState({
    weight: 70, height: 175, age: 25,
    goal: 'performance',
    vma: 14, level: 'intermediate',
    units: 'metric',
    theme: 'auto',
    notifTraining: true, notifHydration: true, notifRecovery: false,
    ...loadSettings()
  });

  useEffect(() => {
    const saved = loadSettings();
    if (Object.keys(saved).length > 0) {
      setS(prev => ({ ...prev, ...saved }));
    }
  }, []);
  const [saved, setSaved] = useState(false);

  const update = (key, val) => setS(prev => ({ ...prev, [key]: val }));

  const handleSave = () => {
    saveSettings(s);
    // Sync avec pp_nutrition_profile
    try { localStorage.setItem('pp_nutrition_profile', JSON.stringify({ weight: s.weight, goal: s.goal })); } catch {}
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const bmi = (s.weight / ((s.height / 100) ** 2)).toFixed(1);
  const bmiLabel = bmi < 18.5 ? 'Insuffisant' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Surpoids' : 'Obésité';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'Syne, sans-serif', paddingBottom: 100 }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px 16px 0' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <Icon name="arrow_left" size={22} color="var(--text-secondary)" />
          </button>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em' }}>Paramètres</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>{user?.name || 'Mon profil'}</div>
          </div>
        </div>

        {/* Profil physique */}
        <Section title="Profil physique">
          <Row label="Poids" sub={`IMC : ${bmi} — ${bmiLabel}`}>
            <NumberInput value={s.weight} onChange={v => update('weight', v)} min={30} max={200} unit={s.units === 'metric' ? 'kg' : 'lb'} />
          </Row>
          <Row label="Taille">
            <NumberInput value={s.height} onChange={v => update('height', v)} min={100} max={250} unit={s.units === 'metric' ? 'cm' : 'in'} />
          </Row>
          <Row label="Âge" last>
            <NumberInput value={s.age} onChange={v => update('age', v)} min={10} max={100} unit="ans" />
          </Row>
        </Section>

        {/* Objectif sportif */}
        <Section title="Objectif sportif">
          <div style={{ padding: '14px 16px' }}>
            <SegmentedControl
              options={[['performance','🏃 Perf.'],['prise','💪 Masse'],['sante','🌿 Santé']]}
              value={s.goal}
              onChange={v => update('goal', v)}
            />
          </div>
          <Row label="Niveau running" last>
            <SegmentedControl
              options={[['beginner','Déb.'],['intermediate','Inter.'],['advanced','Avancé']]}
              value={s.level}
              onChange={v => update('level', v)}
              color="#6366f1"
            />
          </Row>
        </Section>

        {/* Running */}
        <Section title="Running & VMA">
          <Row label="VMA" sub="Vitesse Maximale Aérobie">
            <NumberInput value={s.vma} onChange={v => update('vma', v)} min={6} max={25} unit="km/h" />
          </Row>
          <Row label="Allure EF" sub="Endurance fondamentale" last>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 13, fontWeight: 700, color: '#22c55e' }}>
              {Math.floor(60/(s.vma*0.72))}:{String(Math.round(((60/(s.vma*0.72))%1)*60)).padStart(2,'0')}–{Math.floor(60/(s.vma*0.75))}:{String(Math.round(((60/(s.vma*0.75))%1)*60)).padStart(2,'0')} /km
            </div>
          </Row>
        </Section>

        {/* Unités */}
        <Section title="Unités & Affichage">
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 10 }}>Système d'unités</div>
            <SegmentedControl
              options={[['metric','Métrique (kg, km)'],['imperial','Impérial (lb, mi)']]}
              value={s.units}
              onChange={v => update('units', v)}
              color="#f59e0b"
            />
          </div>
          <div style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 10 }}>Thème</div>
            <SegmentedControl
              options={[['auto','🌗 Auto'],['dark','🌙 Sombre'],['light','☀️ Clair']]}
              value={s.theme}
              onChange={v => update('theme', v)}
              color="#a78bfa"
            />
          </div>
        </Section>

        {/* Notifications */}
        <Section title="Notifications">
          <Row label="Rappels d'entraînement" sub="Notif. avant ta prochaine séance">
            <Toggle value={s.notifTraining} onChange={v => update('notifTraining', v)} />
          </Row>
          <Row label="Hydratation" sub="Rappels toutes les 2h">
            <Toggle value={s.notifHydration} onChange={v => update('notifHydration', v)} color="#38bdf8" />
          </Row>
          <Row label="Récupération" sub="Conseils post-séance" last>
            <Toggle value={s.notifRecovery} onChange={v => update('notifRecovery', v)} color="#22c55e" />
          </Row>
        </Section>

        {/* Save */}
        <button onClick={handleSave} style={{ width: '100%', background: saved ? '#22c55e' : '#FF0040', border: 'none', borderRadius: 16, padding: '16px', fontSize: 14, fontWeight: 800, color: '#fff', cursor: 'pointer', fontFamily: 'Syne, sans-serif', transition: 'background 0.3s', letterSpacing: '0.02em' }}>
          {saved ? '✓ Paramètres sauvegardés' : 'Enregistrer les modifications'}
        </button>

      </div>
    </div>
  );
}
