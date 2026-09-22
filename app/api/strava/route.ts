import { NextRequest } from 'next/server';

// Server-side Strava proxy. Two callers use this:
//  - app/strava/callback/page.tsx  → { action: 'exchange_code', code }
//  - components/MusculationModule.jsx → { action: 'create_activity', token, refreshToken, expiresAt, name, duration, start_time, description }
//
// Needs STRAVA_CLIENT_ID and STRAVA_CLIENT_SECRET set in the Vercel project's
// environment variables (from https://www.strava.com/settings/api). Without
// them this returns a clear "not configured" error instead of a 500.

const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID || process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID;
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;

async function refreshAccessToken(refreshToken: string) {
  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });
  if (!res.ok) return null;
  return res.json();
}

export async function POST(req: NextRequest) {
  if (!STRAVA_CLIENT_ID || !STRAVA_CLIENT_SECRET) {
    return Response.json({ success: false, error: 'Strava n\'est pas configuré sur ce déploiement (STRAVA_CLIENT_ID / STRAVA_CLIENT_SECRET manquants).' }, { status: 200 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return Response.json({ success: false, error: 'Requête invalide' }, { status: 400 });
  }

  if (body.action === 'exchange_code') {
    try {
      const tokenRes = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: STRAVA_CLIENT_ID,
          client_secret: STRAVA_CLIENT_SECRET,
          code: body.code,
          grant_type: 'authorization_code',
        }),
      });
      const data = await tokenRes.json();
      if (!tokenRes.ok || !data.access_token) {
        return Response.json({ success: false, error: data.message || 'Échange du code Strava refusé' });
      }
      const athlete = data.athlete
        ? { id: data.athlete.id, name: [data.athlete.firstname, data.athlete.lastname].filter(Boolean).join(' '), photo: data.athlete.profile || null }
        : null;
      return Response.json({
        success: true,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: data.expires_at,
        athlete,
      });
    } catch {
      return Response.json({ success: false, error: 'Erreur réseau vers Strava' });
    }
  }

  if (body.action === 'create_activity') {
    try {
      let accessToken: string = body.token;
      let refreshedTokens: { newToken: string; newRefresh: string; newExpires: number } | null = null;

      // Refresh first if the token is expired or about to expire.
      if (!body.expiresAt || Date.now() / 1000 > body.expiresAt - 60) {
        if (!body.refreshToken) {
          return Response.json({ success: false, needsReauth: true });
        }
        const refreshed = await refreshAccessToken(body.refreshToken);
        if (!refreshed || !refreshed.access_token) {
          return Response.json({ success: false, needsReauth: true });
        }
        accessToken = refreshed.access_token;
        refreshedTokens = { newToken: refreshed.access_token, newRefresh: refreshed.refresh_token, newExpires: refreshed.expires_at };
      }

      const activityRes = await fetch('https://www.strava.com/api/v3/activities', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: body.name || 'Séance PacePro',
          type: 'WeightTraining',
          start_date_local: body.start_time ? new Date(body.start_time).toISOString() : new Date().toISOString(),
          elapsed_time: Math.max(1, Math.round((body.duration || 0) / 1000) || Math.round(body.duration || 0)),
          description: body.description || '',
        }),
      });

      if (activityRes.status === 401) {
        return Response.json({ success: false, needsReauth: true });
      }
      if (!activityRes.ok) {
        return Response.json({ success: false, error: 'Strava a refusé la création de l\'activité' });
      }

      return Response.json({
        success: true,
        newToken: refreshedTokens?.newToken,
        newRefresh: refreshedTokens?.newRefresh,
        newExpires: refreshedTokens?.newExpires,
      });
    } catch {
      return Response.json({ success: false, error: 'Erreur réseau vers Strava' });
    }
  }

  return Response.json({ success: false, error: 'Action inconnue' }, { status: 400 });
}
