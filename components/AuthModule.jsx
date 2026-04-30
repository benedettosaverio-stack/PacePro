'use client';
import { useState } from 'react';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const inp = (extra={}) => ({ background:'var(--bg-input)', border:'1px solid var(--border-input)', color:'var(--text-primary)', borderRadius:12, padding:'12px 16px', width:'100%', fontSize:14, fontFamily:'inherit', outline:'none', ...extra });
const btnRed = { background:'#FF0040', color:'#000', border:'none', borderRadius:12, padding:'14px', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit', width:'100%' };
const btnGhost = { background:'var(--btn-ghost-bg)', border:'1px solid var(--btn-ghost-border)', color:'var(--btn-ghost-color)', borderRadius:12, padding:'14px', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit', width:'100%' };
const card = { background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:'24px' };

async function supaFetch(path, options = {}) {
  try {
    const res = await fetch(SUPABASE_URL + '/rest/v1/' + path, {
      ...options,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
        ...options.headers,
      },
    });
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  } catch(e) { return null; }
}

// Hash simple du mot de passe (SHA-256 via Web Crypto)
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'pacepro_salt_2026');
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2,'0')).join('');
}

async function signUp(email, password, name) {
  const hash = await hashPassword(password);
  // Vérifie si email existe déjà
  const existing = await supaFetch('users?email=eq.' + encodeURIComponent(email) + '&limit=1');
  if (existing && existing.length > 0) throw new Error('Cet email est déjà utilisé');
  const data = await supaFetch('users', {
    method: 'POST',
    body: JSON.stringify({ email, password_hash: hash, name: name || email.split('@')[0], photo: null }),
  });
  if (!data || !data[0]) throw new Error('Erreur lors de la création du compte');
  return data[0];
}

async function signIn(email, password) {
  const hash = await hashPassword(password);
  const data = await supaFetch('users?email=eq.' + encodeURIComponent(email) + '&password_hash=eq.' + hash + '&limit=1');
  if (!data || data.length === 0) throw new Error('Email ou mot de passe incorrect');
  return data[0];
}

export default function AuthModule({ onAuth }) {
  const [mode, setMode] = useState('choice'); // 'choice' | 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const STRAVA_CLIENT_ID = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID;
  const connectStrava = () => {
    const scope = 'read,activity:read_all,activity:write';
    const url = `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&redirect_uri=${encodeURIComponent('https://pacepro-virid.vercel.app/api/strava?action=callback')}&response_type=code&scope=${scope}`;
    window.location.href = url;
  };

  const handleSignUp = async () => {
    if (!email || !password) { setError('Email et mot de passe requis'); return; }
    if (password.length < 6) { setError('Mot de passe trop court (min 6 caractères)'); return; }
    setLoading(true); setError('');
    try {
      const user = await signUp(email, password, name);
      localStorage.setItem('pp_user_id', user.id);
      localStorage.setItem('pp_user', JSON.stringify({ id: user.id, name: user.name, email: user.email, photo: user.photo }));
      onAuth(user);
    } catch(e) { setError(e.message); }
    setLoading(false);
  };

  const handleSignIn = async () => {
    if (!email || !password) { setError('Email et mot de passe requis'); return; }
    setLoading(true); setError('');
    try {
      const user = await signIn(email, password);
      localStorage.setItem('pp_user_id', user.id);
      localStorage.setItem('pp_user', JSON.stringify({ id: user.id, name: user.name, email: user.email, photo: user.photo }));
      onAuth(user);
    } catch(e) { setError(e.message); }
    setLoading(false);
  };

  if (mode === 'choice') {
    return (
      <div style={{ minHeight:'100vh', background:'var(--bg-primary)', color:'var(--text-primary)', fontFamily:'Syne, sans-serif', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'0 24px 80px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'500px', height:'500px', borderRadius:'50%', background:'radial-gradient(circle, rgba(219,59,61,0.07) 0%, transparent 70%)', pointerEvents:'none' }} />

        <img src="/logo.svg" alt="PacePro" style={{ width:100, height:100, objectFit:'contain', filter:'drop-shadow(0 0 30px rgba(219,59,61,0.3))', marginBottom:16 }} />
        <h1 style={{ fontSize:36, fontWeight:800, letterSpacing:'-0.04em', marginBottom:4 }}>PacePro</h1>
        <p style={{ fontSize:12, fontFamily:'DM Mono, monospace', color:'var(--text-muted)', letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:40 }}>
          Powered by <span style={{ color:'#DB3B3D' }}>passion</span>
        </p>

        <div style={{ width:'100%', maxWidth:380, display:'flex', flexDirection:'column', gap:12 }}>
          <button onClick={connectStrava} style={{ ...btnGhost, display:'flex', alignItems:'center', justifyContent:'center', gap:10, borderColor:'rgba(252,76,2,0.3)', color:'#FC4C02' }}>
            <span style={{ fontSize:20 }}>🟠</span> Continuer avec Strava
          </button>

          <div style={{ display:'flex', alignItems:'center', gap:12, margin:'4px 0' }}>
            <div style={{ flex:1, height:1, background:'var(--border)' }} />
            <span style={{ fontSize:12, color:'var(--text-muted)', fontFamily:'DM Mono, monospace' }}>ou</span>
            <div style={{ flex:1, height:1, background:'var(--border)' }} />
          </div>

          <button onClick={() => setMode('signup')} style={{ ...btnRed }}>
            Créer un compte
          </button>
          <button onClick={() => setMode('login')} style={{ ...btnGhost }}>
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-primary)', color:'var(--text-primary)', fontFamily:'Syne, sans-serif', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'0 24px 80px' }}>
      <div style={{ width:'100%', maxWidth:380 }}>
        <button onClick={() => setMode('choice')} style={{ ...btnGhost, width:'auto', padding:'8px 16px', fontSize:12, marginBottom:24 }}>← Retour</button>

        <div style={card}>
          <h2 style={{ fontSize:22, fontWeight:800, marginBottom:6, letterSpacing:'-0.03em' }}>
            {mode === 'signup' ? 'Créer un compte' : 'Se connecter'}
          </h2>
          <p style={{ fontSize:12, color:'var(--text-muted)', marginBottom:24 }}>
            {mode === 'signup' ? 'Rejoins PacePro gratuitement' : 'Content de te revoir !'}
          </p>

          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {mode === 'signup' && (
              <div>
                <label style={{ fontSize:11, color:'var(--text-muted)', display:'block', marginBottom:6 }}>Prénom</label>
                <input style={inp()} placeholder="Saverio" value={name} onChange={e => setName(e.target.value)} />
              </div>
            )}
            <div>
              <label style={{ fontSize:11, color:'var(--text-muted)', display:'block', marginBottom:6 }}>Email</label>
              <input style={inp()} type="email" placeholder="saverio@exemple.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize:11, color:'var(--text-muted)', display:'block', marginBottom:6 }}>Mot de passe</label>
              <input style={inp()} type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (mode === 'signup' ? handleSignUp() : handleSignIn())} />
            </div>

            {error && (
              <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:10, padding:'10px 14px', fontSize:12, color:'rgba(239,68,68,0.9)' }}>
                {error}
              </div>
            )}

            <button onClick={mode === 'signup' ? handleSignUp : handleSignIn}
              disabled={loading} style={{ ...btnRed, opacity: loading ? 0.6 : 1, marginTop:4 }}>
              {loading ? '⏳ Chargement...' : mode === 'signup' ? 'Créer mon compte' : 'Se connecter'}
            </button>

            <button onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setError(''); }}
              style={{ background:'none', border:'none', color:'var(--text-muted)', fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
              {mode === 'signup' ? 'Déjà un compte ? Se connecter' : 'Pas de compte ? S\'inscrire'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
