import { NextRequest, NextResponse } from 'next/server';

const CLIENT_ID = process.env.STRAVA_CLIENT_ID;
const CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;

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
      // Page HTML qui stocke le token et ferme la fenêtre
      const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="background:#07080b;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;text-align:center;">
<div>
  <div style="font-size:48px;margin-bottom:16px">✅</div>
  <div style="font-size:20px;font-weight:700;margin-bottom:8px">Connexion réussie !</div>
  <div style="font-size:14px;opacity:0.5">Retourne sur PacePro</div>
</div>
<script>
  const token = ${JSON.stringify(token)};
  const athlete = ${athlete};
  // Stocke dans localStorage
  try {
    localStorage.setItem('strava_token', token);
    localStorage.setItem('strava_athlete', JSON.stringify(athlete));
  } catch(e) {}
  // Envoie au parent si popup
  try { window.opener && window.opener.postMessage({type:'strava_token',token,athlete},'*'); } catch(e) {}
  // Ferme après 1 sec
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
