'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

function getFracBlocs(session) {
  const t = session.title.match(/(\d+)\s*×\s*(\d+)\s*min/);
  if (!t || session.type === 'ef' || session.type === 'long' || session.type === 'trail') return null;
  const reps = +t[1], effortMin = +t[2];
  const recovMin = parseFloat((session.title.match(/\/\s*(\d+(?:\.\d+)?)\s*min/) || [])[1] || effortMin);
  const blocs = [];
  blocs.push({ label: 'Échauffement', min: 15, color: '#22c55e', type: 'warmup' });
  for (let i = 0; i < reps; i++) {
    blocs.push({ label: `Effort ${i+1}/${reps}`, min: effortMin, color: '#FF0040', type: 'effort' });
    if (i < reps - 1) blocs.push({ label: 'Récupération', min: recovMin, color: '#60a5fa', type: 'recov' });
  }
  blocs.push({ label: 'Retour calme', min: 10, color: '#22c55e', type: 'cooldown' });
  return blocs;
}

// Calcul distance entre 2 coords GPS (Haversine)
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// Convertir coords GPS en pixels SVG
function coordsToSVG(points, W=300, H=180) {
  if (points.length < 2) return [];
  const lats = points.map(p => p.lat);
  const lons = points.map(p => p.lon);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLon = Math.min(...lons), maxLon = Math.max(...lons);
  const pad = 20;
  return points.map(p => ({
    x: pad + (p.lon - minLon) / (maxLon - minLon || 1) * (W - 2*pad),
    y: pad + (1 - (p.lat - minLat) / (maxLat - minLat || 1)) * (H - 2*pad),
    pace: p.pace,
    ele: p.ele,
  }));
}

// Composant carte Leaflet
function RouteMap({ points }) {
  const mapRef = useRef(null);
  const leafletRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current || points.length < 2) return;
    if (typeof window === 'undefined') return;

    const initMap = async () => {
      const L = await import('leaflet');
      await import('leaflet/dist/leaflet.css');

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      const map = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
      }).addTo(map);

      // Tracé coloré par allure
      const minPace = Math.min(...points.filter(p => p.pace > 0).map(p => p.pace));
      const maxPace = Math.max(...points.map(p => p.pace || 0));

      const paceColor = (pace) => {
        if (!pace || pace <= 0) return '#60a5fa';
        const ratio = Math.max(0, Math.min(1, (pace - minPace) / (maxPace - minPace || 1)));
        const r = Math.round(34 + ratio * 221);
        const g = Math.round(197 - ratio * 197);
        const b = Math.round(94 - ratio * 94);
        return `rgb(${r},${g},${b})`;
      };

      // Dessiner segments colorés
      for (let i = 1; i < points.length; i++) {
        const color = paceColor(points[i].pace);
        L.polyline([
          [points[i-1].lat, points[i-1].lon],
          [points[i].lat, points[i].lon],
        ], { color, weight: 4, opacity: 0.9 }).addTo(map);
      }

      // Marqueurs départ/arrivée
      const startIcon = L.divIcon({ html: '<div style="width:12px;height:12px;border-radius:50%;background:#22c55e;border:2px solid #07080b;box-shadow:0 0 6px #22c55e"></div>', className: '', iconSize: [12,12], iconAnchor: [6,6] });
      const endIcon = L.divIcon({ html: '<div style="width:12px;height:12px;border-radius:50%;background:#FF0040;border:2px solid #07080b;box-shadow:0 0 6px #FF0040"></div>', className: '', iconSize: [12,12], iconAnchor: [6,6] });

      L.marker([points[0].lat, points[0].lon], { icon: startIcon }).addTo(map);
      L.marker([points[points.length-1].lat, points[points.length-1].lon], { icon: endIcon }).addTo(map);

      // Fit bounds
      const bounds = L.latLngBounds(points.map(p => [p.lat, p.lon]));
      map.fitBounds(bounds, { padding: [30, 30] });

      mapInstanceRef.current = map;
    };

    initMap();
    return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } };
  }, [points]);

  if (points.length < 2) return null;

  return (
    <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div ref={mapRef} style={{ width: '100%', height: 280 }}/>
      <div style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.4)', display: 'flex', gap: 16, fontSize: 9, fontFamily: 'DM Mono, monospace' }}>
        <span style={{ color: '#22c55e' }}>● Départ</span>
        <span style={{ color: '#FF0040' }}>● Arrivée</span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ color: '#22c55e' }}>rapide</span>
          <div style={{ width: 30, height: 3, borderRadius: 99, background: 'linear-gradient(90deg, #22c55e, #FF0040)' }}/>
          <span style={{ color: '#FF0040' }}>lent</span>
        </div>
      </div>
    </div>
  );
}

// Écran résumé post-séance
function SessionSummary({ gpsPoints, elapsed, onComplete, onClose, session }) {
  const distM = gpsPoints.reduce((acc, p, i) => {
    if (i === 0) return 0;
    return acc + haversine(gpsPoints[i-1].lat, gpsPoints[i-1].lon, p.lat, p.lon);
  }, 0);
  const distKm = distM / 1000;
  const paceSecKm = distKm > 0 ? elapsed / distKm : 0;
  const paceStr = paceSecKm > 0 ? `${Math.floor(paceSecKm/60)}'${String(Math.round(paceSecKm%60)).padStart(2,'0')}"` : '—';
  const elevGain = gpsPoints.reduce((acc, p, i) => {
    if (i === 0 || !p.ele || !gpsPoints[i-1].ele) return acc;
    const diff = p.ele - gpsPoints[i-1].ele;
    return acc + (diff > 0 ? diff : 0);
  }, 0);
  const fmt = (s) => `${String(Math.floor(s/3600)).padStart(2,'0')}:${String(Math.floor((s%3600)/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#07080b', display: 'flex', flexDirection: 'column', fontFamily: 'Syne, sans-serif', overflowY: 'auto' }}>
      <div style={{ padding: 'calc(env(safe-area-inset-top, 16px) + 20px) 20px 20px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap:8, marginBottom: 20 }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e' }}/>
          <div style={{ fontSize: 9, fontFamily: 'DM Mono, monospace', color: 'rgba(34,197,94,0.7)', letterSpacing: '0.2em' }}>SÉANCE TERMINÉE</div>
        </div>
        <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 4 }}>{session.title}</div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'DM Mono, monospace', marginBottom: 20 }}>{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'Distance', value: distKm > 0 ? `${distKm.toFixed(2)}` : '—', unit: 'km', color: '#FF0040' },
            { label: 'Durée', value: fmt(elapsed), unit: '', color: '#60a5fa' },
            { label: 'Allure moy.', value: paceStr, unit: '/km', color: '#f59e0b' },
            { label: 'Dénivelé +', value: elevGain > 0 ? `${Math.round(elevGain)}` : '—', unit: 'm', color: '#a78bfa' },
          ].map(({ label, value, unit, color }) => (
            <div key={label} style={{ position: 'relative', borderRadius: 14, border: `1px solid ${color}20`, background: `${color}08`, padding: '14px 12px', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', bottom: -8, right: -8, width: 40, height: 40, borderRadius: '50%', background: `radial-gradient(circle, ${color}20, transparent)`, pointerEvents: 'none' }}/>
              <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color, fontFamily: 'DM Mono, monospace', lineHeight: 1 }}>{value}</div>
              {unit && <div style={{ fontSize: 9, color: `${color}80`, fontFamily: 'DM Mono, monospace', marginTop: 2 }}>{unit}</div>}
            </div>
          ))}
        </div>

        {/* Carte GPS */}
        {gpsPoints.length > 2 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 3, height: 14, background: '#60a5fa', borderRadius: 2, boxShadow: '0 0 8px #60a5fa' }}/>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.15em', fontFamily: 'DM Mono, monospace' }}>Tracé GPS · Couleur = allure</div>
            </div>
            <RouteMap points={gpsPoints}/>
          </div>
        )}
        {gpsPoints.length <= 2 && (
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '16px', textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontFamily: 'DM Mono, monospace' }}>GPS non disponible — séance chronométrée uniquement</div>
          </div>
        )}

        {/* Allures par km */}
        {distKm > 1 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 3, height: 14, background: '#f59e0b', borderRadius: 2, boxShadow: '0 0 8px #f59e0b' }}/>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.15em', fontFamily: 'DM Mono, monospace' }}>Allures par km</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {Array.from({ length: Math.floor(distKm) }, (_, kmIdx) => {
                const kmStart = kmIdx * 1000;
                const kmEnd = (kmIdx + 1) * 1000;
                let d = 0, pts = [];
                for (let i = 1; i < gpsPoints.length; i++) {
                  const seg = haversine(gpsPoints[i-1].lat, gpsPoints[i-1].lon, gpsPoints[i].lat, gpsPoints[i].lon);
                  if (d + seg >= kmStart && d <= kmEnd) pts.push(gpsPoints[i]);
                  d += seg;
                }
                if (pts.length < 2) return null;
                const t1 = pts[0].ts, t2 = pts[pts.length-1].ts;
                const secPerKm = (t2 - t1) / 1000;
                if (secPerKm <= 0 || secPerKm > 1800) return null;
                const ratio = Math.max(0, Math.min(1, (secPerKm - 180) / 420));
                const barColor = `rgb(${Math.round(34+ratio*221)},${Math.round(197-ratio*197)},${Math.round(94-ratio*94)})`;
                return (
                  <div key={kmIdx} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontFamily: 'DM Mono, monospace', width: 28 }}>km {kmIdx+1}</div>
                    <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(1-ratio)*100}%`, background: barColor, borderRadius: 99 }}/>
                    </div>
                    <div style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', fontWeight: 700, color: barColor, width: 40, textAlign: 'right' }}>
                      {Math.floor(secPerKm/60)}'{String(Math.round(secPerKm%60)).padStart(2,'0')}"
                    </div>
                  </div>
                );
              }).filter(Boolean)}
            </div>
          </div>
        )}

        {/* Actions */}
        <button onClick={() => { onComplete(); onClose(); }} style={{ width: '100%', height: 52, borderRadius: 16, background: 'linear-gradient(135deg, #22c55e, #16a34a)', border: 'none', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'Syne, sans-serif', boxShadow: '0 4px 20px rgba(34,197,94,0.3)', marginBottom: 12 }}>
          ✓ Valider la séance
        </button>
        <button onClick={onClose} style={{ width: '100%', height: 42, borderRadius: 14, background: 'none', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', fontSize: 12, cursor: 'pointer', fontFamily: 'DM Mono, monospace', letterSpacing: '0.08em' }}>
          FERMER SANS VALIDER
        </button>
      </div>
    </div>
  );
}

export default function LiveSessionMode({ session, onComplete, onClose }) {
  const blocs = getFracBlocs(session);
  const [phase, setPhase] = useState('live'); // 'live' | 'summary'
  const [elapsed, setElapsed] = useState(0);
  const [active, setActive] = useState(false);
  const [blocIdx, setBlocIdx] = useState(0);
  const [blocElapsed, setBlocElapsed] = useState(0);
  const [gpsPoints, setGpsPoints] = useState([]);
  const [gpsError, setGpsError] = useState(null);
  const [gpsActive, setGpsActive] = useState(false);

  const intervalRef = useRef(null);
  const startRef = useRef(null);
  const blocStartRef = useRef(null);
  const watchRef = useRef(null);
  const lastPosRef = useRef(null);

  const currentBloc = blocs ? blocs[blocIdx] : null;
  const currentBlocSec = currentBloc ? currentBloc.min * 60 : 0;
  const blocPct = currentBlocSec > 0 ? Math.min(blocElapsed / currentBlocSec * 100, 100) : 0;

  const totalDistM = gpsPoints.reduce((acc, p, i) => {
    if (i === 0) return 0;
    return acc + haversine(gpsPoints[i-1].lat, gpsPoints[i-1].lon, p.lat, p.lon);
  }, 0);
  const distKm = totalDistM / 1000;
  const paceSecKm = distKm > 0.05 ? elapsed / distKm : 0;
  const paceStr = paceSecKm > 0 ? `${Math.floor(paceSecKm/60)}'${String(Math.round(paceSecKm%60)).padStart(2,'0')}"` : '—';

  const fmt = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  };

  const startGPS = useCallback(() => {
    if (!navigator.geolocation) { setGpsError('GPS non disponible'); return; }
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lon, altitude: ele, accuracy } = pos.coords;
        if (accuracy > 50) return; // ignorer les points trop imprécis
        const ts = Date.now();
        const last = lastPosRef.current;
        let pace = 0;
        if (last) {
          const d = haversine(last.lat, last.lon, lat, lon);
          const dt = (ts - last.ts) / 1000;
          pace = d > 2 && dt > 0 ? dt / (d / 1000) : last.pace || 0;
        }
        const pt = { lat, lon, ele: ele || 0, ts, pace };
        lastPosRef.current = pt;
        setGpsPoints(prev => [...prev, pt]);
        setGpsActive(true);
      },
      (err) => setGpsError(err.message),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    );
  }, []);

  const toggle = () => {
    if (active) {
      clearInterval(intervalRef.current);
      setActive(false);
    } else {
      if (!gpsActive && !gpsError) startGPS();
      const now = Date.now();
      startRef.current = now - elapsed * 1000;
      blocStartRef.current = now - blocElapsed * 1000;
      setActive(true);
      intervalRef.current = setInterval(() => {
        const t = Date.now();
        setElapsed(Math.floor((t - startRef.current) / 1000));
        const bEl = Math.floor((t - blocStartRef.current) / 1000);
        setBlocElapsed(bEl);
        if (blocs && bEl >= currentBlocSec && currentBlocSec > 0) {
          if (blocIdx < blocs.length - 1) {
            setBlocIdx(i => i + 1);
            setBlocElapsed(0);
            blocStartRef.current = t;
          }
        }
      }, 1000);
    }
  };

  const nextBloc = () => {
    if (!blocs || blocIdx >= blocs.length - 1) return;
    setBlocIdx(i => i + 1);
    setBlocElapsed(0);
    blocStartRef.current = Date.now();
  };

  const finish = () => {
    clearInterval(intervalRef.current);
    if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current);
    setActive(false);
    setPhase('summary');
  };

  useEffect(() => () => {
    clearInterval(intervalRef.current);
    if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current);
  }, []);

  if (phase === 'summary') {
    return createPortal(
      <SessionSummary
        gpsPoints={gpsPoints}
        elapsed={elapsed}
        session={session}
        onComplete={() => onComplete(session.id)}
        onClose={onClose}
      />,
      document.body
    );
  }

  if (typeof document === 'undefined') return null;
  const accent = currentBloc?.color || '#FF0040';

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#07080b', display: 'flex', flexDirection: 'column', fontFamily: 'Syne, sans-serif' }}>
      {/* Header */}
      <div style={{ padding: 'calc(env(safe-area-inset-top, 16px) + 12px) 16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 13, cursor: 'pointer', fontFamily: 'DM Mono, monospace', letterSpacing: '0.08em' }}>← QUITTER</button>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontFamily: 'DM Mono, monospace', letterSpacing: '0.15em', display: 'flex', alignItems: 'center', gap: 6 }}>
          {gpsActive && <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 5px #22c55e' }}/>}
          {gpsActive ? 'GPS ACTIF' : gpsError ? 'GPS INDISPO' : 'SESSION LIVE'}
        </div>
        <div style={{ width: 60 }}/>
      </div>

      {/* Session info */}
      <div style={{ padding: '12px 20px 0' }}>
        <div style={{ fontSize: 9, color: `${accent}80`, fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 4 }}>{session.tag}</div>
        <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 4 }}>{session.title}</div>
      </div>

      {/* Live stats */}
      {(distKm > 0.05 || elapsed > 0) && (
        <div style={{ padding: '10px 20px 0', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
          {[
            { label: 'Distance', value: distKm > 0.05 ? `${distKm.toFixed(2)}km` : '—', color: '#60a5fa' },
            { label: 'Allure', value: paceStr, color: '#f59e0b' },
            { label: 'D+', value: gpsPoints.length > 1 ? `${Math.round(gpsPoints.reduce((acc, p, i) => { if (i === 0 || !p.ele || !gpsPoints[i-1].ele) return acc; const d = p.ele - gpsPoints[i-1].ele; return acc + (d > 0 ? d : 0); }, 0))}m` : '—', color: '#a78bfa' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: `${color}08`, border: `1px solid ${color}15`, borderRadius: 10, padding: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 900, color, fontFamily: 'DM Mono, monospace', lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Main timer */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 20px' }}>
        {blocs && currentBloc ? (
          <div style={{ textAlign: 'center', width: '100%' }}>
            <div style={{ fontSize: 11, color: accent, fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 16 }}>{currentBloc.label}</div>
            {/* Arc */}
            <div style={{ position: 'relative', width: 180, height: 180, margin: '0 auto 16px' }}>
              <svg width={180} height={180} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={90} cy={90} r={80} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={8}/>
                <circle cx={90} cy={90} r={80} fill="none" stroke={accent} strokeWidth={8}
                  strokeDasharray={`${2 * Math.PI * 80}`}
                  strokeDashoffset={`${2 * Math.PI * 80 * (1 - blocPct/100)}`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1s linear', filter: `drop-shadow(0 0 8px ${accent})` }}/>
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: 44, fontWeight: 900, fontFamily: 'DM Mono, monospace', color: accent, lineHeight: 1 }}>
                  {currentBlocSec > 0 ? fmt(Math.max(0, currentBlocSec - blocElapsed)) : fmt(blocElapsed)}
                </div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontFamily: 'DM Mono, monospace', marginTop: 4 }}>
                  {currentBlocSec > 0 ? 'restant' : 'écoulé'}
                </div>
              </div>
            </div>
            {/* Allure cible */}
            {session.allures?.slice(0,1).map((a,i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '8px 16px', marginBottom: 12 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: a.dot }}/>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{a.label}</span>
                <span style={{ fontSize: 16, fontFamily: 'DM Mono, monospace', fontWeight: 800, color: '#fff', marginLeft: 'auto' }}>{a.val}</span>
              </div>
            ))}
            {/* Blocs progress */}
            <div style={{ display: 'flex', gap: 3 }}>
              {blocs.map((b, i) => (
                <div key={i} style={{ flex: 1, height: 4, borderRadius: 99, background: i < blocIdx ? b.color : i === blocIdx ? `${b.color}60` : 'rgba(255,255,255,0.08)', transition: 'all 0.3s' }}/>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 72, fontWeight: 900, fontFamily: 'DM Mono, monospace', color: active ? '#FF0040' : 'rgba(255,255,255,0.6)', lineHeight: 1, transition: 'color 0.3s' }}>{fmt(elapsed)}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'DM Mono, monospace', marginTop: 8, letterSpacing: '0.1em' }}>TEMPS ÉCOULÉ</div>
            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {session.allures?.map((a,i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '8px 16px' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: a.dot }}/>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{a.label}</span>
                  <span style={{ fontSize: 16, fontFamily: 'DM Mono, monospace', fontWeight: 800, color: '#fff', marginLeft: 'auto' }}>{a.val}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{ padding: '0 20px', paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 16px)', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Timer total */}
        <div style={{ textAlign: 'center', fontSize: 13, fontFamily: 'DM Mono, monospace', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>
          {fmt(elapsed)} total
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={toggle} style={{ flex: 2, height: 56, borderRadius: 16, border: `1px solid ${active ? 'rgba(245,158,11,0.3)' : accent}30`, background: active ? 'rgba(245,158,11,0.15)' : `${accent}20`, color: active ? '#f59e0b' : accent, fontSize: active ? 20 : 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'DM Mono, monospace', fontWeight: 800, letterSpacing: '0.06em' }}>
            {active ? '⏸ PAUSE' : elapsed === 0 ? '▶ DÉMARRER' : '▶ REPRENDRE'}
          </button>
          {blocs && blocIdx < blocs.length - 1 && (
            <button onClick={nextBloc} style={{ flex: 1, height: 56, borderRadius: 16, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontSize: 11, cursor: 'pointer', fontFamily: 'DM Mono, monospace', letterSpacing: '0.06em' }}>SUIVANT →</button>
          )}
        </div>
        <button onClick={finish} style={{ width: '100%', height: 48, borderRadius: 14, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', color: '#22c55e', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'DM Mono, monospace', letterSpacing: '0.08em' }}>
          ✓ TERMINER
        </button>
      </div>
    </div>,
    document.body
  );
}
