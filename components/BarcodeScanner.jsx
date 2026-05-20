'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

export default function BarcodeScanner({ onAdd, onClose }) {
  const [phase, setPhase] = useState('scan');
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState('100');
  const [loading, setLoading] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const controlsRef = useRef(null);

  const stopCamera = useCallback(() => {
    if (controlsRef.current) { try { controlsRef.current.stop(); } catch {} }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
  }, []);

  const fetchProduct = async (barcode) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await res.json();
      if (data.status !== 1 || !data.product) {
        setError('Produit non trouvé dans OpenFoodFacts');
        setLoading(false);
        return;
      }
      const p = data.product;
      const n = p.nutriments || {};
      setProduct({
        name: p.product_name_fr || p.product_name || 'Produit inconnu',
        brand: p.brands || '',
        kcalPer100: Math.round(n['energy-kcal_100g'] || n['energy-kcal'] || 0),
        protPer100: Math.round((n['proteins_100g'] || 0) * 10) / 10,
        carbsPer100: Math.round((n['carbohydrates_100g'] || 0) * 10) / 10,
        fatPer100: Math.round((n['fat_100g'] || 0) * 10) / 10,
        imageUrl: p.image_small_url || null,
      });
      setPhase('confirm');
    } catch {
      setError('Erreur réseau');
    }
    setLoading(false);
  };

  const startScanner = useCallback(async () => {
    setScanning(true);
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      const { BrowserMultiFormatReader } = await import('@zxing/browser');
      const reader = new BrowserMultiFormatReader();
      const controls = await reader.decodeFromStream(stream, videoRef.current, (result) => {
        if (result) {
          stopCamera();
          setScanning(false);
          fetchProduct(result.getText());
        }
      });
      controlsRef.current = controls;
    } catch {
      setError("Impossible d'acceder a la camera");
      setScanning(false);
    }
  }, [stopCamera]);

  useEffect(() => { startScanner(); return () => stopCamera(); }, []);

  const computed = product ? {
    kcal: Math.round(product.kcalPer100 * parseFloat(quantity || 0) / 100),
    prot: Math.round(product.protPer100 * parseFloat(quantity || 0) / 100 * 10) / 10,
    carbs: Math.round(product.carbsPer100 * parseFloat(quantity || 0) / 100 * 10) / 10,
    fat: Math.round(product.fatPer100 * parseFloat(quantity || 0) / 100 * 10) / 10,
  } : null;

  const handleAdd = () => {
    if (!product || !computed) return;
    onAdd({ name: `${product.name}${product.brand ? ' · '+product.brand : ''}`, desc: `${quantity}g`, kcal: computed.kcal, prot: computed.prot, carbs: computed.carbs, fat: computed.fat });
    onClose();
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:9999, background:'#07080b', display:'flex', flexDirection:'column', fontFamily:'Syne, sans-serif' }}>
      <div style={{ padding:'calc(env(safe-area-inset-top,16px) + 12px) 16px 0', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
        <button onClick={() => { stopCamera(); onClose(); }} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.4)', fontSize:13, cursor:'pointer', fontFamily:'DM Mono, monospace' }}>FERMER</button>
        <div style={{ fontSize:9, color:'rgba(255,255,255,0.3)', fontFamily:'DM Mono, monospace', letterSpacing:'0.15em' }}>SCANNER PRODUIT</div>
        <div style={{ width:60 }}/>
      </div>

      {phase === 'scan' && (
        <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'16px' }}>
          <div style={{ position:'relative', width:'100%', maxWidth:340, aspectRatio:'1/1', borderRadius:20, overflow:'hidden', marginBottom:20 }}>
            <video ref={videoRef} autoPlay playsInline muted style={{ width:'100%', height:'100%', objectFit:'cover', background:'#000' }}/>
            <div style={{ position:'absolute', top:20, left:20, width:32, height:32, borderTop:'2px solid #FF0040', borderLeft:'2px solid #FF0040', borderRadius:'4px 0 0 0' }}/>
            <div style={{ position:'absolute', top:20, right:20, width:32, height:32, borderTop:'2px solid #FF0040', borderRight:'2px solid #FF0040', borderRadius:'0 4px 0 0' }}/>
            <div style={{ position:'absolute', bottom:20, left:20, width:32, height:32, borderBottom:'2px solid #FF0040', borderLeft:'2px solid #FF0040', borderRadius:'0 0 0 4px' }}/>
            <div style={{ position:'absolute', bottom:20, right:20, width:32, height:32, borderBottom:'2px solid #FF0040', borderRight:'2px solid #FF0040', borderRadius:'0 0 4px 0' }}/>
            {loading && <div style={{ position:'absolute', inset:0, background:'rgba(7,8,11,0.85)', display:'flex', alignItems:'center', justifyContent:'center' }}><div style={{ fontSize:10, color:'#FF0040', fontFamily:'DM Mono, monospace', letterSpacing:'0.15em' }}>RECHERCHE...</div></div>}
          </div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', fontFamily:'DM Mono, monospace', textAlign:'center', marginBottom:16 }}>
            {scanning ? 'Pointe vers le code barre' : 'Initialisation...'}
          </div>
          {error && <div style={{ background:'rgba(255,0,64,0.08)', border:'1px solid rgba(255,0,64,0.2)', borderRadius:12, padding:'10px 14px', marginBottom:16, textAlign:'center' }}><div style={{ fontSize:11, color:'#FF0040', fontFamily:'DM Mono, monospace' }}>{error}</div></div>}
          <div style={{ width:'100%', maxWidth:340 }}>
            <div style={{ fontSize:9, color:'rgba(255,255,255,0.2)', fontFamily:'DM Mono, monospace', textTransform:'uppercase', letterSpacing:'0.1em', textAlign:'center', marginBottom:8 }}>ou saisir manuellement</div>
            <div style={{ display:'flex', gap:8 }}>
              <input value={manualBarcode} onChange={e => setManualBarcode(e.target.value)} placeholder="Code barre..." inputMode="numeric" style={{ flex:1, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'10px 12px', color:'#fff', fontSize:13, fontFamily:'DM Mono, monospace', outline:'none' }}/>
              <button onClick={() => manualBarcode.trim() && fetchProduct(manualBarcode.trim())} style={{ background:'rgba(255,0,64,0.15)', border:'1px solid rgba(255,0,64,0.3)', borderRadius:10, padding:'10px 14px', color:'#FF0040', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'DM Mono, monospace' }}>OK</button>
            </div>
          </div>
        </div>
      )}

      {phase === 'confirm' && product && (
        <div style={{ flex:1, overflowY:'auto', padding:'16px' }}>
          <div style={{ borderRadius:14, border:'1px solid rgba(34,197,94,0.2)', background:'rgba(34,197,94,0.05)', padding:'14px', marginBottom:14, display:'flex', gap:12, alignItems:'center' }}>
            {product.imageUrl && <img src={product.imageUrl} alt="" style={{ width:52, height:52, borderRadius:10, objectFit:'cover' }}/>}
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:14, fontWeight:800, color:'#fff', marginBottom:2 }}>{product.name}</div>
              {product.brand && <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', fontFamily:'DM Mono, monospace' }}>{product.brand}</div>}
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:14 }}>
            {[['Kcal',product.kcalPer100,'#fff'],['Prot',`${product.protPer100}g`,'#FF0040'],['Carbs',`${product.carbsPer100}g`,'#60a5fa'],['Lip',`${product.fatPer100}g`,'#a78bfa']].map(([l,v,c]) => (
              <div key={l} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:'8px 6px', textAlign:'center' }}>
                <div style={{ fontSize:7, color:'rgba(255,255,255,0.3)', fontFamily:'DM Mono, monospace', textTransform:'uppercase', marginBottom:2 }}>{l}/100g</div>
                <div style={{ fontSize:13, fontWeight:900, color:c, fontFamily:'DM Mono, monospace' }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:'14px', marginBottom:14 }}>
            <div style={{ fontSize:9, color:'rgba(255,255,255,0.4)', fontFamily:'DM Mono, monospace', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:10 }}>Quantite (g)</div>
            <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:10 }}>
              <input type="number" inputMode="decimal" value={quantity} onChange={e => setQuantity(e.target.value)} style={{ flex:1, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'12px', color:'#fff', fontSize:22, fontFamily:'DM Mono, monospace', fontWeight:900, outline:'none', textAlign:'center' }}/>
              <span style={{ fontSize:12, color:'rgba(255,255,255,0.4)', fontFamily:'DM Mono, monospace' }}>g / ml</span>
            </div>
            <div style={{ display:'flex', gap:6 }}>
              {['50','100','150','200','250'].map(q => (
                <button key={q} onClick={() => setQuantity(q)} style={{ flex:1, padding:'6px 0', borderRadius:8, background:quantity===q?'rgba(255,0,64,0.15)':'rgba(255,255,255,0.04)', border:`1px solid ${quantity===q?'rgba(255,0,64,0.3)':'rgba(255,255,255,0.07)'}`, color:quantity===q?'#FF0040':'rgba(255,255,255,0.4)', fontSize:10, fontFamily:'DM Mono, monospace', cursor:'pointer' }}>{q}</button>
              ))}
            </div>
          </div>
          {computed && (
            <div style={{ background:'rgba(255,0,64,0.06)', border:'1px solid rgba(255,0,64,0.2)', borderRadius:14, padding:'14px', marginBottom:16 }}>
              <div style={{ fontSize:9, color:'rgba(255,0,64,0.6)', fontFamily:'DM Mono, monospace', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:10 }}>Pour {quantity}g</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
                {[['Kcal',computed.kcal,'#fff'],['Prot',`${computed.prot}g`,'#FF0040'],['Carbs',`${computed.carbs}g`,'#60a5fa'],['Lip',`${computed.fat}g`,'#a78bfa']].map(([l,v,c]) => (
                  <div key={l} style={{ textAlign:'center' }}>
                    <div style={{ fontSize:7, color:'rgba(255,255,255,0.3)', fontFamily:'DM Mono, monospace', textTransform:'uppercase', marginBottom:2 }}>{l}</div>
                    <div style={{ fontSize:20, fontWeight:900, color:c, fontFamily:'DM Mono, monospace' }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <button onClick={handleAdd} style={{ width:'100%', height:52, borderRadius:14, background:'linear-gradient(135deg,#FF0040,#cc0033)', border:'none', color:'#fff', fontSize:14, fontWeight:800, cursor:'pointer', fontFamily:'Syne, sans-serif', boxShadow:'0 4px 20px rgba(255,0,64,0.3)', marginBottom:10 }}>+ Ajouter a mes macros</button>
          <button onClick={() => { setPhase('scan'); setProduct(null); startScanner(); }} style={{ width:'100%', height:42, borderRadius:12, background:'none', border:'1px solid rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.4)', fontSize:12, cursor:'pointer', fontFamily:'DM Mono, monospace', letterSpacing:'0.08em' }}>SCANNER UN AUTRE</button>
        </div>
      )}
    </div>
  );
}
