import { NextRequest, NextResponse } from 'next/server';

const CLIENT_ID = process.env.STRAVA_CLIENT_ID;
const CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');
  const code = searchParams.get('code');

  // Échange le code contre un token
  if (action === 'callback' && code) {
    const res = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
      }),
    });
    const data = await res.json();
    if (data.access_token) {
      // Redirige vers l'app avec le token
      const url = new URL('/strava-success', req.url);
      url.searchParams.set('token', data.access_token);
      url.searchParams.set('refresh', data.refresh_token);
      url.searchParams.set('athlete', JSON.stringify({
        id: data.athlete?.id,
        name: `${data.athlete?.firstname} ${data.athlete?.lastname}`,
        photo: data.athlete?.profile_medium,
      }));
      return NextResponse.redirect(url);
    }
    return NextResponse.json({ error: 'Auth failed' }, { status: 400 });
  }

  // Refresh token
  if (action === 'refresh') {
    const refresh_token = searchParams.get('refresh_token');
    const res = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        refresh_token,
        grant_type: 'refresh_token',
      }),
    });
    const data = await res.json();
    return NextResponse.json(data);
  }

  // Récupère les activités récentes
  if (action === 'activities') {
    const token = searchParams.get('token');
    const res = await fetch(
      'https://www.strava.com/api/v3/athlete/activities?per_page=20',
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await res.json();
    return NextResponse.json(data);
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
