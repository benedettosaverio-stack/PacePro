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
      const athlete = { id: data.athlete?.id, name: `${data.athlete?.firstname} ${data.athlete?.lastname}`, photo: data.athlete?.profile_medium };
      const html = `<!DOCTYPE html><html><body><script>
        localStorage.setItem('strava_token', '${data.access_token}');
        localStorage.setItem('strava_athlete', JSON.stringify(${JSON.stringify(athlete)}));
        window.opener?.postMessage({type:'strava_token',token:'${data.access_token}',athlete:${JSON.stringify(athlete)}},'*');
        window.close();
        setTimeout(()=>{ window.location.href='/'; }, 500);
      </script><p>Connexion réussie ! Fermeture...</p></body></html>`;
      return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
    }
    return NextResponse.json({ error: 'Auth failed' }, { status: 400 });
  }

  if (action === 'exchange' && code) {
    const res = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, code, grant_type: 'authorization_code' }),
    });
    const data = await res.json();
    return NextResponse.json(data);
  }

  if (action === 'activities') {
    const token = searchParams.get('token');
    const res = await fetch('https://www.strava.com/api/v3/athlete/activities?per_page=20', { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    return NextResponse.json(data);
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
