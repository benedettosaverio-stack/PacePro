'use client';
import { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function StravaSuccessInner() {
  const params = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const token = params.get('token');
    const athlete = params.get('athlete');
    if (token) {
      localStorage.setItem('strava_token', token);
      if (athlete) localStorage.setItem('strava_athlete', athlete);
    }
    router.replace('/');
  }, []);

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#07080b', color:'#fff', fontFamily:'Syne, sans-serif' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:48, marginBottom:16 }}>✅</div>
        <div style={{ fontSize:18, fontWeight:700 }}>Connexion réussie !</div>
        <div style={{ fontSize:14, color:'rgba(255,255,255,0.5)', marginTop:8 }}>Redirection...</div>
      </div>
    </div>
  );
}

export default function StravaSuccess() {
  return (
    <Suspense fallback={<div style={{ minHeight:'100vh', background:'#07080b' }}/>}>
      <StravaSuccessInner />
    </Suspense>
  );
}
