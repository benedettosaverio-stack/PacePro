'use client';
import { useEffect, useState } from 'react';
import { Icon } from './Icons';

// NOTE: this file didn't exist in the repo (PacePro.jsx imported it but it was
// never committed), which is why every deploy since it was referenced had been
// failing. This is a minimal, working version of the Strava tab: it drives the
// real Strava OAuth flow (via /strava/callback + /api/strava) so it's not a
// fake connect button, but it needs two env vars set in Vercel before it can
// actually connect anyone:
//   NEXT_PUBLIC_STRAVA_CLIENT_ID   — from https://www.strava.com/settings/api
//   STRAVA_CLIENT_SECRET           — same page (server-side only, used by /api/strava)
// and that Strava app's "Authorization Callback Domain" must be set to this
// app's domain (e.g. pacepro-virid.vercel.app), no https://, no path.
// Until those are set, this screen tells the user Strava isn't configured yet
// instead of pretending to connect.

const card = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '20px' };
const btnRed = { background: '#FF0040', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', width: '100%' };
const btnGhost = { background: 'var(--bg-input)', border: '1px solid var(--border-input)', color: 'var(--text-secondary)', borderRadius: 12, padding: '14px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', width: '100%' };

export default function StravaModule() {
  const [athlete, setAthlete] = useState(null);
  const [clientId, setClientId] = useState(null);

  useEffect(() => {
    try {
      const a = localStorage.getItem('strava_athlete');
      if (a) setAthlete(JSON.parse(a));
    } catch {}
    setClientId(process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID || null);
  }, []);

  const connect = () => {
    if (!clientId) return;
    const redirectUri = window.location.origin + '/strava/callback';
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      approval_prompt: 'auto',
      scope: 'activity:write,activity:read_all',
    });
    window.location.href = 'https://www.strava.com/oauth/authorize?' + params.toString();
  };

  const disconnect = () => {
    ['strava_token', 'strava_refresh_token', 'strava_expires_at', 'strava_athlete', 'strava_access_token'].forEach(k => localStorage.removeItem(k));
    setAthlete(null);
  };

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: athlete ? 16 : 8 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(252,76,2,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="cloud" size={22} color="#FC4C02" />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Syne, sans-serif' }}>Strava</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>
              {athlete ? 'Connecté' : 'Non connecté'}
            </div>
          </div>
        </div>

        {athlete && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, padding: '10px 12px', background: 'var(--bg-input)', borderRadius: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
            <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{athlete.name || 'Athlète Strava'}</div>
          </div>
        )}

        {athlete ? (
          <button onClick={disconnect} style={btnGhost}>Déconnecter Strava</button>
        ) : clientId ? (
          <button onClick={connect} style={btnRed}>Connecter Strava</button>
        ) : (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            L'intégration Strava n'est pas encore configurée sur ce déploiement — il manque les identifiants de l'app Strava (<code>NEXT_PUBLIC_STRAVA_CLIENT_ID</code> et <code>STRAVA_CLIENT_SECRET</code> dans les variables d'environnement Vercel).
          </div>
        )}
      </div>

      <div style={{ fontSize: 11, color: 'var(--text-ultra-muted)', lineHeight: 1.6, padding: '0 4px' }}>
        Une fois connecté, tes séances de musculation sont envoyées automatiquement vers Strava à la fin de chaque entraînement.
      </div>
    </div>
  );
}
