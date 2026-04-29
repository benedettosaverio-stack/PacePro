import { NextRequest, NextResponse } from 'next/server';

const CLIENT_ID = process.env.STRAVA_CLIENT_ID;
const CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;

// Rafraîchit le token si expiré
async function getValidToken(token: string, refreshToken: string): Promise<{access_token: string, refresh_token: string, expires_at: number} | null> {
  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  const data = await res.json();
  if (data.access_token) return data;
  return null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');
  const code = searchParams.get('code');

  if (action === 'callback' && code) {
    const res = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, code, grant_type: 'authorization_code' }),
    });
    const data = await res.json();
    if (data.access_token) {
      const athlete = JSON.stringify({ id: data.athlete?.id, name: `${data.athlete?.firstname} ${data.athlete?.lastname}`, photo: data.athlete?.profile_medium });
      const token = data.access_token;
      const refresh = data.refresh_token;
      const expires = data.expires_at;
      const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="background:#07080b;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;text-align:center;">
<div>
  <div style="font-size:48px;margin-bottom:16px">✅</div>
  <div style="font-size:20px;font-weight:700;margin-bottom:8px">Connexion réussie !</div>
  <div style="font-size:14px;opacity:0.5">Retourne sur PacePro</div>
</div>
<script>
  try {
    localStorage.setItem('strava_token', ${JSON.stringify(token)});
    localStorage.setItem('strava_refresh_token', ${JSON.stringify(refresh)});
    localStorage.setItem('strava_expires_at', ${JSON.stringify(String(expires))});
    localStorage.setItem('strava_athlete', ${athlete});
  } catch(e) {}
  try { window.opener && window.opener.postMessage({type:'strava_token',token:${JSON.stringify(token)},athlete:${athlete}},'*'); } catch(e) {}
  setTimeout(() => { try { window.close(); } catch(e) {} }, 1000);
</script>
</body></html>`;
      return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }
    return new NextResponse('Erreur auth Strava', { status: 400 });
  }

  if (action === 'activities') {
    const token = searchParams.get('token');
    const res = await fetch('https://www.strava.com/api/v3/athlete/activities?per_page=20', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    return NextResponse.json(data);
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action, token, refreshToken, expiresAt } = body;

  if (action === 'create_activity') {
    const { name, duration, start_time, description } = body;

    // Vérifie si le token est expiré (marge 5 min)
    let activeToken = token;
    let newRefresh = refreshToken;
    let newExpires = expiresAt;

    const now = Math.floor(Date.now() / 1000);
    if (expiresAt && now >= expiresAt - 300) {
      // Token expiré → refresh
      const refreshed = await getValidToken(token, refreshToken);
      if (refreshed) {
        activeToken = refreshed.access_token;
        newRefresh = refreshed.refresh_token;
        newExpires = refreshed.expires_at;
      } else {
        return NextResponse.json({ success: false, error: 'Token refresh failed', needsReauth: true }, { status: 401 });
      }
    }

    const res = await fetch('https://www.strava.com/api/v3/activities', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${activeToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: name || 'Séance musculation PacePro',
        type: 'WeightTraining',
        sport_type: 'WeightTraining',
        start_date_local: start_time || new Date().toISOString(),
        elapsed_time: duration || 3600,
        description: description || '',
        trainer: true,
        commute: false,
      }),
    });

    const data = await res.json();
    if (data.id) {
      return NextResponse.json({
        success: true,
        activity: data,
        // Renvoie les nouveaux tokens si rafraîchis
        newToken: activeToken !== token ? activeToken : null,
        newRefresh: newRefresh !== refreshToken ? newRefresh : null,
        newExpires: newExpires !== expiresAt ? newExpires : null,
      });
    }
    return NextResponse.json({ success: false, error: data }, { status: 400 });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
