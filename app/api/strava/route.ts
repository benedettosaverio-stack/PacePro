import { NextRequest, NextResponse } from 'next/server';

const CLIENT_ID = process.env.STRAVA_CLIENT_ID;
const CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;

async function refreshAccessToken(refreshToken: string) {
  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, refresh_token: refreshToken, grant_type: 'refresh_token' }),
  });
  return res.json();
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
      const athlete = { id: data.athlete?.id, name: `${data.athlete?.firstname} ${data.athlete?.lastname}`, photo: data.athlete?.profile_medium };
      // Page HTML qui sauvegarde les tokens ET redirige vers l'appli
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="background:#07080b;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;text-align:center;">
<div><div style="font-size:48px;margin-bottom:16px">✅</div><div style="font-size:20px;font-weight:700;margin-bottom:8px">Connexion réussie !</div><div style="font-size:14px;opacity:0.5">Retour sur PacePro...</div></div>
<script>
try {
  localStorage.setItem('strava_token', ${JSON.stringify(data.access_token)});
  localStorage.setItem('strava_refresh_token', ${JSON.stringify(data.refresh_token)});
  localStorage.setItem('strava_expires_at', '${data.expires_at}');
  localStorage.setItem('strava_athlete', JSON.stringify(${JSON.stringify(athlete)}));
} catch(e) {}
// Redirige vers l'appli après 1 seconde
setTimeout(() => { window.location.href = 'https://pacepro-virid.vercel.app'; }, 1000);
</script>
</body></html>`;
      return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }
    return new NextResponse('Erreur auth Strava', { status: 400 });
  }

  if (action === 'activities') {
    let token = searchParams.get('token');
    const refreshToken = searchParams.get('refresh_token');
    const expiresAt = parseInt(searchParams.get('expires_at') || '0');
    let newToken = null, newRefresh = null, newExpires = null;

    // Auto-refresh si token expiré ou expire dans moins de 5 min
    const now = Math.floor(Date.now() / 1000);
    if (expiresAt && now >= expiresAt - 300 && refreshToken) {
      const refreshed = await refreshAccessToken(refreshToken);
      if (refreshed.access_token) {
        token = refreshed.access_token;
        newToken = refreshed.access_token;
        newRefresh = refreshed.refresh_token;
        newExpires = refreshed.expires_at;
      }
    }

    const res = await fetch('https://www.strava.com/api/v3/athlete/activities?per_page=20', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    return NextResponse.json({ activities: data, newToken, newRefresh, newExpires });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action, token, refreshToken, expiresAt } = body;

  if (action === 'create_activity') {
    const { name, duration, start_time, description } = body;

    let activeToken = token;
    let newRefresh = null;
    let newExpires = null;
    let newToken = null;

    const now = Math.floor(Date.now() / 1000);
    if (!expiresAt || now >= expiresAt - 300) {
      if (refreshToken) {
        const refreshed = await refreshAccessToken(refreshToken);
        if (refreshed.access_token) {
          activeToken = refreshed.access_token;
          newToken = refreshed.access_token;
          newRefresh = refreshed.refresh_token;
          newExpires = refreshed.expires_at;
        }
      }
    }

    const res = await fetch('https://www.strava.com/api/v3/activities', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${activeToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name || 'Séance PacePro',
        type: 'WeightTraining',
        sport_type: 'WeightTraining',
        start_date_local: start_time || new Date().toISOString(),
        elapsed_time: Math.max(duration || 60, 60),
        description: description || '',
        trainer: true,
        commute: false,
      }),
    });

    const data = await res.json();
    if (data.id) {
      return NextResponse.json({ success: true, activity: data, newToken, newRefresh, newExpires });
    }
    return NextResponse.json({ success: false, error: data }, { status: 400 });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
