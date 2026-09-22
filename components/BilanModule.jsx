'use client';

// NOTE: this file didn't exist in the repo (PacePro.jsx and HomeModule.jsx
// both reference a "Bilan Santé IA" screen, but no component or backend logic
// for it was ever committed) — that's one of the two missing files that broke
// every deploy. This is a clean placeholder, not a fabricated AI report: there
// is no AI health-analysis logic anywhere in the codebase to wire up yet.

const card = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '24px', textAlign: 'center' };
const btnGhost = { background: 'var(--bg-input)', border: '1px solid var(--border-input)', color: 'var(--text-secondary)', borderRadius: 12, padding: '12px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' };

export default function BilanModule({ onBack }) {
  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={card}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <span style={{ fontSize: 24 }}>🩺</span>
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Syne, sans-serif', marginBottom: 8 }}>
          Bilan Santé IA
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
          Bientôt disponible : une analyse de tes séances, ta charge d'entraînement et ta récupération, générée à partir de tes données PacePro.
        </p>
        {onBack && <button onClick={onBack} style={btnGhost}>← Retour</button>}
      </div>
    </div>
  );
}
