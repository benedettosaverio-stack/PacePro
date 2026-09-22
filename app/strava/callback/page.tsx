'use client';
import { useEffect, useState } from 'react';

// Strava redirects back here after the user approves the connection (see
// components/StravaModule.jsx). We exchange the one-time `code` for tokens
// via /api/strava (server-side, needs the Strava app secret), store them the
// same way the rest of the app already expects (localStorage), then send the
// user back into the app.

export default function StravaCallbackPage() {
  const [status, setStatus] = useState<'exchanging' | 'error' | 'denied'>('exchanging');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    const code = params.get('code');

    if (error) {
      setStatus('denied');
      return;
    }
    if (!code) {
      setStatus('error');
      setMessage('Code de connexion manquant.');
      return;
    }

    fetch('/api/strava', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'exchange_code', code }),
    })
      .then(r => r.json())
      .then(d => {
        if (!d.success) {
          setStatus('error');
          setMessage(d.error || "Impossible de finaliser la connexion Strava.");
          return;
        }
        localStorage.setItem('strava_token', d.accessToken);
        localStorage.setItem('strava_refresh_token', d.refreshToken);
        localStorage.setItem('strava_expires_at', String(d.expiresAt));
        localStorage.setItem('strava_athlete', JSON.stringify(d.athlete));
        window.location.href = '/';
      })
      .catch(() => {
        setStatus('error');
        setMessage('Erreur réseau pendant la connexion Strava.');
      });
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#07080b', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Syne, sans-serif', textAlign: 'center' }}>
      {status === 'exchanging' && <p style={{ color: 'rgba(255,255,255,0.6)' }}>Connexion à Strava en cours…</p>}
      {status === 'denied' && (
        <>
          <p style={{ marginBottom: 16 }}>Connexion Strava annulée.</p>
          <a href="/" style={{ color: '#FF0040' }}>Retour à PacePro</a>
        </>
      )}
      {status === 'error' && (
        <>
          <p style={{ marginBottom: 8 }}>La connexion Strava a échoué.</p>
          {message && <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>{message}</p>}
          <a href="/" style={{ color: '#FF0040' }}>Retour à PacePro</a>
        </>
      )}
    </div>
  );
}
