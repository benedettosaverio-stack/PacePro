'use client';

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPA_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function supaFetch(path, options = {}) {
  try {
    const res = await fetch(SUPA_URL + '/rest/v1/' + path, {
      ...options,
      headers: {
        'apikey': SUPA_KEY,
        'Authorization': 'Bearer ' + SUPA_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
        ...options.headers,
      },
    });
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  } catch(e) { return null; }
}

async function syncPlans(plans) {
  const userId = localStorage.getItem('pp_user_id');
  if (!userId || !plans.length) return;
  try {
    await supaFetch('plans?user_id=eq.' + userId, { method: 'DELETE' });
    await supaFetch('plans', {
      method: 'POST',
      body: JSON.stringify(plans.map(p => ({ user_id: userId, plan_data: p, plan_name: p.profile?.goal || 'Plan' }))),
    });
  } catch(e) {}
}

async function loadPlans() {
  const userId = localStorage.getItem('pp_user_id');
  if (!userId) return null;
  try {
    const data = await supaFetch('plans?user_id=eq.' + userId + '&order=created_at.asc');
    if (data && data.length > 0) return data.map(d => d.plan_data);
    return null;
  } catch(e) { return null; }
}

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Muscu from './MusculationModule';
import StravaModule from './StravaModule';
import HomeModule from './HomeModule';
import HistoriqueModule from './HistoriqueModule';
import AuthModule from './AuthModule';
import { Icon } from './Icons';
import BilanModule from './BilanModule';

// ─── Thème clair/sombre automatique ──────────────────────────────────────────
function ThemeStyles() {
  return (
    <style>{`
      :root {
        --bg-primary: #07080b;
        --bg-card: rgba(19,22,31,0.85);
        --bg-surface: rgba(10,12,18,0.92);
        --bg-input: rgba(255,255,255,0.04);
        --bg-nav: rgba(7,8,11,0.88);
        --bg-modal: #13161f;
        --text-primary: #ffffff;
        --text-secondary: rgba(255,255,255,0.45);
        --text-muted: rgba(255,255,255,0.25);
        --text-ultra-muted: rgba(255,255,255,0.15);
        --border: rgba(255,255,255,0.07);
        --border-input: rgba(255,255,255,0.10);
        --border-nav: rgba(255,255,255,0.06);
        --btn-ghost-bg: rgba(255,255,255,0.05);
        --btn-ghost-border: rgba(255,255,255,0.08);
        --btn-ghost-color: rgba(255,255,255,0.4);
        --onboarding-bg: #07080b;
        --session-bg: rgba(10,12,18,0.9);
        --session-border: rgba(255,255,255,0.06);
        --week-tabs-inactive: rgba(255,255,255,0.04);
        --week-tabs-border: rgba(255,255,255,0.07);
        --week-tabs-color: rgba(255,255,255,0.35);
        --next-session-bg: rgba(255,0,64,0.06);
        --next-session-border: rgba(255,0,64,0.2);
        --chip-bg: rgba(255,255,255,0.04);
        --chip-border: rgba(255,255,255,0.07);
        --progress-track: rgba(255,255,255,0.06);
        --svg-text: rgba(255,255,255,0.25);
        --svg-text-val: rgba(255,255,255,0.4);
        --plans-bg: #07080b;
      }
      @media (prefers-color-scheme: light) {
        :root {
          --bg-primary: #eef0f4;
          --bg-card: rgba(255,255,255,0.98);
          --bg-surface: rgba(255,255,255,1);
          --bg-input: rgba(10,11,15,0.07);
          --bg-nav: rgba(238,240,244,0.95);
          --bg-modal: #ffffff;
          --text-primary: #05060a;
          --text-secondary: #23262f;
          --text-muted: #4a4e5a;
          --text-ultra-muted: #6b6f7a;
          --border: rgba(10,11,15,0.16);
          --border-input: rgba(10,11,15,0.22);
          --border-nav: rgba(10,11,15,0.13);
          --btn-ghost-bg: rgba(10,11,15,0.07);
          --btn-ghost-border: rgba(10,11,15,0.16);
          --btn-ghost-color: #33363f;
          --onboarding-bg: #f0f2f5;
          --session-bg: rgba(255,255,255,0.96);
          --session-border: rgba(10,11,15,0.10);
          --week-tabs-inactive: rgba(10,11,15,0.06);
          --week-tabs-border: rgba(10,11,15,0.10);
          --week-tabs-color: #6b6f7a;
          --next-session-bg: rgba(255,0,64,0.04);
          --next-session-border: rgba(255,0,64,0.18);
          --chip-bg: rgba(10,11,15,0.06);
          --chip-border: rgba(10,11,15,0.12);
          --progress-track: rgba(10,11,15,0.09);
          --svg-text: #9296a0;
          --svg-text-val: #6b6f7a;
          --plans-bg: #f0f2f5;
        }
      }
      * { box-sizing: border-box; }
      body { background: var(--bg-primary); }
      input, select, button { font-family: inherit; }
      @keyframes fadeSlideUp {
        from { opacity: 0; transform: translateY(16px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes fadeIn {
        from { opacity: 0; }
        to   { opacity: 1; }
      }
      @keyframes navPop {
        0%   { transform: translateY(0) scale(1); }
        45%  { transform: translateY(-5px) scale(1.25); }
        100% { transform: translateY(0) scale(1); }
      }
      @keyframes scaleIn {
        from { opacity: 0; transform: scale(0.96); }
        to   { opacity: 1; transform: scale(1); }
      }
      .tab-enter {
        animation: fadeSlideUp 0.3s cubic-bezier(0.22, 1, 0.36, 1) both;
      }
      .modal-enter {
        animation: scaleIn 0.22s cubic-bezier(0.22, 1, 0.36, 1) both;
      }
      .nav-btn-active svg, .nav-btn-active span {
        animation: navPop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both;
      }
      .card-hover {
        transition: transform 0.15s ease, box-shadow 0.15s ease;
      }
      .card-hover:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 32px rgba(0,0,0,0.18);
      }
    `}</style>
  );
}

function toPace(speedKmh) {
  const mPerKm = 60 / speedKmh;
  const m = Math.floor(mPerKm);
  const s = Math.round((mPerKm - m) * 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
function calcPaces(vma) {
  return {
    ef:        `${toPace(vma*0.70)}–${toPace(vma*0.75)}`,
    tempo:     `${toPace(vma*0.80)}–${toPace(vma*0.85)}`,
    threshold: `${toPace(vma*0.87)}–${toPace(vma*0.92)}`,
    vma90:     `${toPace(vma*0.92)}–${toPace(vma*1.00)}`,
    recov:     `${toPace(vma*0.60)}–${toPace(vma*0.65)}`,
  };
}
function estimateVMA(distKm, timeMins) {
  const speed = distKm / (timeMins / 60);
  const factors = [[1,.95],[3,.90],[5,.87],[10,.84],[21.1,.78],[42.2,.72]];
  const [,f] = factors.reduce((p,c) => Math.abs(c[0]-distKm)<Math.abs(p[0]-distKm)?c:p);
  return +(speed / f).toFixed(1);
}
const DAYS_FR = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];

function generatePlan(profile) {
  const { vma, level, type, weeks, sessionsPerWeek, trainingDays, raceDistanceKm, elevationM } = profile;
  const paces = calcPaces(vma);
  const isTrail = type === 'trail';
  const hasElevation = elevationM > 100;
  const baseKm = { beginner:5, intermediate:8, advanced:11, expert:14 }[level];
  const mult   = { beginner:0.8, intermediate:1.0, advanced:1.2, expert:1.5 }[level];
  const phaseMap = [];
  if (weeks === 2) { phaseMap.push('base','taper'); }
  else if (weeks <= 4) { for(let i=0;i<weeks;i++) phaseMap.push(i<Math.ceil(weeks*0.6)?'base':i<weeks-1?'peak':'taper'); }
  else if (weeks <= 8) { [3,3,1,1].forEach((n,pi)=>{ for(let i=0;i<n&&phaseMap.length<weeks;i++) phaseMap.push(['base','build','peak','taper'][pi]); }); }
  else { [4,4,2,2].forEach((n,pi)=>{ for(let i=0;i<n&&phaseMap.length<weeks;i++) phaseMap.push(['base','build','peak','taper'][pi]); }); }
  const phaseInfo = {
    base:  { label:'Construction',  color:'#22c55e', bg:'rgba(34,197,94,0.12)'   },
    build: { label:'Progression',   color:'#f59e0b', bg:'rgba(245,158,11,0.12)'  },
    peak:  { label:'Pic de charge', color:'#ef4444', bg:'rgba(239,68,68,0.12)'   },
    taper: { label:'Affûtage',      color:'#a78bfa', bg:'rgba(167,139,250,0.12)' },
  };
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - startDate.getDay() + 1);
  const makeSession = (phase, idx, sessionIdx, km) => {
    const reps = Math.min(4 + idx, phase==='taper'?4:8);
    const isLast = sessionIdx === sessionsPerWeek - 1;
    const isFirst = sessionIdx === 0;
    if (phase === 'taper') {
      if (isFirst) return { type:'frac', tag:'Fractionné léger', tagColor:'#a78bfa', tagBg:'rgba(167,139,250,0.12)', title:'4 × 30 sec / 1:30', detail:'Juste pour garder la vivacité. Pas de fatigue.', allures:[{dot:'#ef4444',label:'Effort',val:paces.vma90},{dot:'#22c55e',label:'Récup',val:paces.recov}] };
      return { type:'ef', tag:'Décrassage', tagColor:'#22c55e', tagBg:'rgba(34,197,94,0.12)', title:'20–25 min léger', detail:'Arriver reposé le jour J.', allures:[{dot:'#22c55e',label:'Sortie',val:paces.recov}] };
    }
    if (phase === 'peak' && isLast) return { type:'key', tag:'Sortie clé ⭐', tagColor:'#FF0040', tagBg:'rgba(255,0,64,0.12)', title:`${Math.round(raceDistanceKm*0.85)} km — Répétition générale`, detail:`Simule le jour J. Même équipement${hasElevation?' et dénivelé':''}.`, allures:[{dot:'#22c55e',label:'Plat',val:paces.ef},{dot:'#a78bfa',label:'Montées',val:'marche active'}] };
    if (isLast) {
      const longKm = Math.round(km*(phase==='peak'?0.9:phase==='build'?0.8:0.65));
      return isTrail && hasElevation
        ? { type:'trail', tag:'Trail dénivelé', tagColor:'#f59e0b', tagBg:'rgba(245,158,11,0.12)', title:`${longKm} km D+${Math.round(elevationM*0.6)}m`, detail:'Marche active en montée, technique en descente.', allures:[{dot:'#22c55e',label:'Plat',val:paces.ef},{dot:'#a78bfa',label:'Montées',val:'marche active'}] }
        : { type:'long', tag:'Sortie longue', tagColor:'#f59e0b', tagBg:'rgba(245,158,11,0.12)', title:`${longKm} km`, detail:'Allure maîtrisée. Progression sur le dernier tiers.', allures:[{dot:'#22c55e',label:'Début 2/3',val:paces.ef},{dot:'#f59e0b',label:'Fin 1/3',val:paces.tempo}] };
    }
    if (isFirst) {
      if (phase === 'build') {
        const blocs = Math.min(3+Math.floor(idx/2),5);
        const dur = Math.min(8+idx,12);
        return { type:'frac', tag:'Fractionné long', tagColor:'#60a5fa', tagBg:'rgba(96,165,250,0.12)', title:`${blocs} × ${dur} min / ${Math.round(dur*0.4)} min`, detail:`Échauffement 15 min. ${blocs} blocs seuil. Récup trot.`, allures:[{dot:'#FF0040',label:`Effort (${dur} min)`,val:paces.threshold},{dot:'#22c55e',label:'Récup',val:paces.recov}] };
      }
      return { type:'frac', tag:'Fractionné court', tagColor:'#60a5fa', tagBg:'rgba(96,165,250,0.12)', title:`${reps} × 1 min / 1 min`, detail:`Échauffement 15 min. ${reps} répétitions vif/trot. Retour calme 10 min.`, allures:[{dot:'#ef4444',label:'Effort',val:paces.vma90},{dot:'#22c55e',label:'Récup',val:paces.recov}] };
    }
    const efKm = Math.round(km*0.55);
    return { type:'ef', tag:'Endurance fondamentale', tagColor:'#22c55e', tagBg:'rgba(34,197,94,0.12)', title:`${efKm} km EF`, detail:'Allure conversation. Terrain varié idéal.', allures:[{dot:'#22c55e',label:'Sortie entière',val:paces.ef}] };
  };
  return phaseMap.slice(0,weeks).map((phase,idx) => {
    const wStart = new Date(startDate); wStart.setDate(startDate.getDate()+idx*7);
    const wEnd = new Date(wStart); wEnd.setDate(wStart.getDate()+6);
    const fmt = d => d.toLocaleDateString('fr-FR',{day:'numeric',month:'short'});
    const km = Math.round(baseKm*mult*(1+idx*0.04));
    const eff = weeks<=2 ? Math.max(sessionsPerWeek,4) : sessionsPerWeek;
    const days = weeks<=2 && eff>trainingDays.length ? [...trainingDays,...DAYS_FR.filter(d=>!trainingDays.includes(d))].slice(0,eff) : trainingDays.slice(0,eff);
    const sessions = days.map((day,si) => ({...makeSession(phase,idx,si,km), id:`w${idx+1}_s${si}`, day}));
    const weeklyKm = Math.round(sessions.reduce((a,s)=>{ 
      // Distance explicite (ex: "5 km", "10 km")
      const mKm = s.title.match(/(\d+)\s*km/);
      if (mKm) return a + +mKm[1];
      // Fractionné : "N × D min / R min" → estimer distance
      const mFrac = s.title.match(/(\d+)\s*×\s*(\d+)\s*min/);
      if (mFrac) {
        const reps = +mFrac[1], effortMin = +mFrac[2];
        // Vitesse effort ~VMA 90% = vma*0.92, récup ~60% = vma*0.6
        const recovMin = parseFloat((s.title.match(/\/\s*(\d+(?:\.\d+)?)\s*min/)||[])[1]||effortMin);
        const effortKm = (vma * 0.92 / 60) * effortMin * reps;
        const recovKm  = (vma * 0.60 / 60) * recovMin  * reps;
        const warmup = (vma * 0.65 / 60) * 15; // 15 min échauffement
        const cooldown = (vma * 0.60 / 60) * 10; // 10 min retour calme
        return a + effortKm + recovKm + warmup + cooldown;
      }
      // Fractionné long : "N × D min" sans récup explicite
      const mFracLong = s.title.match(/(\d+)\s*×\s*(\d+)\s*min/);
      if (mFracLong) {
        const reps = +mFracLong[1], dur = +mFracLong[2];
        return a + (vma * 0.87 / 60) * dur * reps + (vma * 0.65 / 60) * 20;
      }
      // "20-25 min léger" → estimer
      const mMins = s.title.match(/(\d+)[–\-](\d+)\s*min/);
      if (mMins) {
        const avgMin = (+mMins[1] + +mMins[2]) / 2;
        return a + (vma * 0.65 / 60) * avgMin;
      }
      const mMin = s.title.match(/(\d+)\s*min/);
      if (mMin) return a + (vma * 0.65 / 60) * +mMin[1];
      return a;
    }, 0) * 10) / 10;
    return { week:idx+1, phase, ...phaseInfo[phase], dateRange:`${fmt(wStart)} – ${fmt(wEnd)}`, sessions, weeklyKm, isKey:phase==='peak' };
  });
}

function applyFeedback(plan, sessionId, feedback) {
  const effort = feedback.effort;
  const adjust = effort<=4?'up':effort>=8?'down':'ok';
  if (adjust==='ok') return plan;
  return plan.map(week => ({
    ...week,
    sessions: week.sessions.map(s => {
      if (s.id===sessionId || s.type!=='frac') return s;
      const match = s.title.match(/^(\d+)\s*×/);
      if (!match) return s;
      const cur = parseInt(match[1]);
      const newR = adjust==='up' ? Math.min(cur+2,12) : Math.max(cur-2,3);
      return { ...s, title:s.title.replace(/^\d+/,newR), detail:s.detail.replace(/\d+ répétitions/,`${newR} répétitions`), adjusted:adjust };
    })
  }));
}

const card = {background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:16,padding:'16px 18px'};
const navBtnS = {background:'var(--btn-ghost-bg)',border:'1px solid var(--btn-ghost-border)',borderRadius:12,padding:'8px 12px',color:'var(--btn-ghost-color)',cursor:'pointer',fontFamily:'inherit',fontSize:16};
const lbl = {fontSize:12,color:'var(--text-secondary)',display:'block',marginBottom:8};
const inp = () => ({background:'var(--bg-input)',border:'1px solid var(--border-input)',color:'var(--text-primary)',borderRadius:12,padding:'12px 14px',width:'100%',fontSize:14,fontFamily:'inherit',outline:'none'});
const tog = (a) => ({background:a?'rgba(255,0,64,0.15)':'var(--btn-ghost-bg)',border:`1px solid ${a?'rgba(255,0,64,0.5)':'var(--btn-ghost-border)'}`,color:a?'#FF0040':'var(--btn-ghost-color)',borderRadius:12,padding:'10px 12px',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit',transition:'all 0.2s'});

const SessionIcons = {
  frac: () => (<svg width="36" height="36" viewBox="0 0 36 36" fill="none"><circle cx="18" cy="18" r="18" fill="rgba(255,0,64,0.12)"/><path d="M12 24 L18 10 L24 24" stroke="#FF0040" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 20 L22 20" stroke="#FF0040" strokeWidth="1.5" strokeLinecap="round"/><circle cx="18" cy="10" r="2" fill="#FF0040"/></svg>),
  ef: () => (<svg width="36" height="36" viewBox="0 0 36 36" fill="none"><circle cx="18" cy="18" r="18" fill="rgba(34,197,94,0.12)"/><path d="M10 20 Q14 14 18 18 Q22 22 26 16" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" fill="none"/><circle cx="10" cy="20" r="1.5" fill="#22c55e"/><circle cx="26" cy="16" r="1.5" fill="#22c55e"/></svg>),
  long: () => (<svg width="36" height="36" viewBox="0 0 36 36" fill="none"><circle cx="18" cy="18" r="18" fill="rgba(245,158,11,0.12)"/><path d="M10 22 L14 16 L18 19 L22 13 L26 17" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/><circle cx="26" cy="17" r="2" fill="#f59e0b"/></svg>),
  trail: () => (<svg width="36" height="36" viewBox="0 0 36 36" fill="none"><circle cx="18" cy="18" r="18" fill="rgba(245,158,11,0.12)"/><path d="M9 25 L18 11 L27 25" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/><path d="M13 25 L18 17 L23 25" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.4"/><circle cx="18" cy="11" r="2" fill="#f59e0b"/></svg>),
  key: () => (<svg width="36" height="36" viewBox="0 0 36 36" fill="none"><circle cx="18" cy="18" r="18" fill="rgba(255,0,64,0.12)"/><path d="M18 10 L20 16 L26 16 L21.5 20 L23.5 26 L18 22.5 L12.5 26 L14.5 20 L10 16 L16 16 Z" stroke="#FF0040" strokeWidth="1.5" strokeLinejoin="round" fill="rgba(255,0,64,0.15)"/></svg>),
  taper: () => (<svg width="36" height="36" viewBox="0 0 36 36" fill="none"><circle cx="18" cy="18" r="18" fill="rgba(167,139,250,0.12)"/><path d="M12 14 Q18 10 24 14 Q28 18 24 22 Q18 26 12 22 Q8 18 12 14Z" stroke="#a78bfa" strokeWidth="1.5" fill="none"/><path d="M15 18 L17 20 L21 16" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>),
};

function AllureChip({ dot, label, val }) {
  return (
    <div style={{display:'inline-flex',alignItems:'center',gap:6,background:'var(--chip-bg)',border:'1px solid var(--chip-border)',borderRadius:99,padding:'3px 10px',fontFamily:'monospace',fontSize:11}}>
      <span style={{width:7,height:7,borderRadius:'50%',background:dot,flexShrink:0,display:'inline-block'}}/>
      <span style={{color:'var(--text-muted)'}}>{label}</span>
      <span style={{color:'var(--text-primary)',fontWeight:500}}>{val}</span>
    </div>
  );
}

function SessionDetailModal({ session, feedback, vma, onClose }) {
  if (!session) return null;

  const paces = calcPaces(vma);

  // Estimation distance
  const estimateKm = (s) => {
    const mKm = s.title.match(/(\d+)\s*km/);
    if (mKm) return +mKm[1];
    const mFrac = s.title.match(/(\d+)\s*×\s*(\d+)\s*min/);
    if (mFrac) {
      const reps = +mFrac[1], effortMin = +mFrac[2];
      const recovMin = parseFloat((s.title.match(/\/\s*(\d+(?:\.\d+)?)\s*min/)||[])[1]||effortMin);
      const effortKm = (vma*0.92/60)*effortMin*reps;
      const recovKm  = (vma*0.60/60)*recovMin*reps;
      return Math.round((effortKm + recovKm + (vma*0.65/60)*15 + (vma*0.60/60)*10)*10)/10;
    }
    const mMins = s.title.match(/(\d+)[–-](\d+)\s*min/);
    if (mMins) return Math.round((vma*0.65/60)*((+mMins[1]+(+mMins[2]))/2)*10)/10;
    const mMin = s.title.match(/(\d+)\s*min/);
    if (mMin) return Math.round((vma*0.65/60)*+mMin[1]*10)/10;
    return null;
  };

  // Blocs fractionné pour visualisation
  const getFracBlocs = (s) => {
    const mFrac = s.title.match(/(\d+)\s*×\s*(\d+)\s*min/);
    if (!mFrac || s.type === 'ef' || s.type === 'long' || s.type === 'trail') return null;
    const reps = +mFrac[1], effortMin = +mFrac[2];
    const recovMin = parseFloat((s.title.match(/\/\s*(\d+(?:\.\d+)?)\s*min/)||[])[1]||effortMin);
    const blocs = [];
    blocs.push({ type:'warmup', min:15, color:'#22c55e', label:'Éch.' });
    for (let i=0; i<reps; i++) {
      blocs.push({ type:'effort', min:effortMin, color:'#FF0040', label:`E${i+1}` });
      if (i<reps-1) blocs.push({ type:'recov', min:recovMin, color:'#60a5fa', label:'R' });
    }
    blocs.push({ type:'cooldown', min:10, color:'#22c55e', label:'RC' });
    return blocs;
  };

  // Explication pédagogique
  const getWhy = (s) => {
    const why = {
      frac: { title:'Pourquoi ce fractionné ?', text:'Le fractionné développe ta VMA et ta capacité à maintenir des efforts intenses. Chaque répétition sollicite ton système cardio-vasculaire à haute intensité, forçant ton corps à s\'adapter. Résultat : tu cours plus vite avec moins d\'effort.', benefit:'↑ VMA · ↑ Économie de course · ↑ Capacité anaérobie' },
      ef: { title:'Pourquoi cette sortie en EF ?', text:'L\'endurance fondamentale développe ton moteur aérobie de base. À allure conversation, tu optimises l\'utilisation des graisses comme carburant et améliores ta récupération. C\'est la fondation de tout programme sérieux.', benefit:'↑ Base aérobie · ↑ Récupération · ↑ Économie lipidique' },
      long: { title:'Pourquoi cette sortie longue ?', text:'La sortie longue adapte ton corps aux efforts prolongés : renforcement des tendons, amélioration du stockage glycogène, adaptation mentale à la durée. Elle simule les exigences de ta course cible.', benefit:'↑ Endurance · ↑ Résistance mentale · ↑ Stockage glycogène' },
      trail: { title:'Pourquoi ce trail dénivelé ?', text:'Le travail en dénivelé renforce les muscles stabilisateurs et améliore la technique en montée/descente. La marche active en côte préserve l\'énergie tout en maintenant une haute intensité cardiaque.', benefit:'↑ Force musculaire · ↑ Technique trail · ↑ Économie en montée' },
      key: { title:'Répétition générale ⭐', text:'Cette séance simule les conditions du jour J. Même équipement, même terrain si possible. L\'objectif est de valider ta stratégie de course et de gagner en confiance.', benefit:'↑ Confiance · ✓ Stratégie validée · ↑ Préparation mentale' },
      taper: { title:'Pourquoi cette séance légère ?', text:'En phase d\'affûtage, l\'objectif est de maintenir la vivacité sans accumuler de fatigue. Ton corps absorbe les adaptations des semaines précédentes. Moins c\'est plus.', benefit:'↓ Fatigue · ↑ Fraîcheur · ✓ Arriver reposé' },
    };
    return why[s.type] || why.ef;
  };

  const estKm = estimateKm(session);
  const blocs = getFracBlocs(session);
  const why = getWhy(session);
  const totalMin = blocs ? blocs.reduce((a,b)=>a+b.min,0) : null;
  const maxMin = blocs ? Math.max(...blocs.map(b=>b.min)) : 1;
  const effortColors = ['','#22c55e','#22c55e','#22c55e','#4ade80','#f59e0b','#f59e0b','#f59e0b','#FF0040','#FF0040','#FF0040'];
  const effortLabels = ['','Très facile','Facile','Facile','Plutôt facile','Modéré','Modéré','Modéré','Difficile','Très difficile','Extrême'];

  const sheetRef = React.useRef(null);
  const touchStartY = React.useRef(0);

  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e) => {
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (dy > 60) onClose();
  };

  if (typeof document === 'undefined') return null;
  return createPortal(
    <div style={{position:'fixed',inset:0,zIndex:9999,display:'flex',flexDirection:'column',justifyContent:'flex-end'}} onClick={onClose}>
      <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.5)',backdropFilter:'blur(6px)'}}/>
      <div ref={sheetRef} onClick={e=>e.stopPropagation()} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} className='sheet-enter' style={{position:'relative',width:'100%',background:'var(--bg-modal)',borderRadius:'24px 24px 0 0',padding:'12px 18px 48px',maxHeight:'82vh',overflowY:'auto',zIndex:1}}>
        {/* Handle + back button */}
        <div style={{display:'flex',alignItems:'center',marginBottom:16}}>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',padding:'4px 8px 4px 0',color:'var(--text-muted)',display:'flex',alignItems:'center',gap:4,opacity:0.5}}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            <span style={{fontSize:11,fontFamily:'DM Mono, monospace'}}>retour</span>
          </button>
          <div style={{flex:1,display:'flex',justifyContent:'center'}}>
            <div style={{width:36,height:4,background:'var(--border)',borderRadius:99}}/>
          </div>
          <div style={{width:60}}/>
        </div>

        {/* Header */}
        <div style={{marginBottom:12,paddingBottom:12,borderBottom:'1px solid var(--border)'}}>
          <div style={{fontSize:9,color:'var(--text-muted)',fontFamily:'DM Mono, monospace',textTransform:'uppercase',letterSpacing:'0.15em',marginBottom:6}}>{session.day} · {session.tag}</div>
          <div style={{fontSize:22,fontWeight:800,letterSpacing:'-0.03em',color:'var(--text-primary)',marginBottom:10}}>{session.title}</div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            {estKm && <span style={{fontSize:11,padding:'4px 10px',borderRadius:99,background:'rgba(255,0,64,0.1)',color:'#FF0040',fontFamily:'DM Mono, monospace',fontWeight:700}}>~{estKm} km estimés</span>}
            {totalMin && <span style={{fontSize:11,padding:'4px 10px',borderRadius:99,background:'var(--bg-input)',color:'var(--text-secondary)',fontFamily:'DM Mono, monospace'}}>~{totalMin} min</span>}
            {session.completed && <span style={{fontSize:11,padding:'4px 10px',borderRadius:99,background:'rgba(34,197,94,0.1)',color:'#22c55e',fontWeight:700}}>✓ Validée</span>}
          </div>
        </div>

        {/* Visualisation blocs fractionné */}
        {blocs && (
          <div style={{marginBottom:10}}>
            <div style={{fontSize:10,fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.12em',fontFamily:'DM Mono, monospace',marginBottom:8}}>Structure de la séance</div>
            <div style={{display:'flex',gap:3,alignItems:'flex-end',height:64,marginBottom:8}}>
              {blocs.map((b,i)=>{
                const heightPct = b.type==='effort' ? 1 : b.type==='warmup'||b.type==='cooldown' ? 0.35 : 0.2;
                return (
                  <div key={i} style={{flex:b.min,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'flex-end',gap:4}}>
                    <div style={{width:'100%',borderRadius:'4px 4px 0 0',background:b.color,opacity:b.type==='recov'?0.5:0.9,
                      height:`${Math.max(heightPct*56,6)}px`,transition:'height 0.5s'}}/>
                    {b.min>=2 && <span style={{fontSize:7,color:'var(--text-muted)',fontFamily:'DM Mono, monospace'}}>{b.label}</span>}
                  </div>
                );
              })}
            </div>
            <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
              {[['#22c55e','Échauffement / RC'],['#FF0040','Effort'],['#60a5fa','Récupération']].map(([color,label])=>(
                <div key={label} style={{display:'flex',alignItems:'center',gap:5}}>
                  <div style={{width:8,height:8,borderRadius:2,background:color}}/>
                  <span style={{fontSize:9,color:'var(--text-muted)'}}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Allures */}
        <div style={{marginBottom:10}}>
          <div style={{fontSize:10,fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.12em',fontFamily:'DM Mono, monospace',marginBottom:8}}>Allures cibles</div>
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            {session.allures.map((a,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:10,background:'var(--bg-input)',borderRadius:10,padding:'8px 12px'}}>
                <span style={{width:10,height:10,borderRadius:'50%',background:a.dot,flexShrink:0}}/>
                <span style={{fontSize:12,color:'var(--text-secondary)',flex:1}}>{a.label}</span>
                <span style={{fontSize:14,fontFamily:'DM Mono, monospace',fontWeight:800,color:'var(--text-primary)'}}>{a.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pourquoi */}
        <div style={{background:'rgba(255,0,64,0.04)',border:'1px solid rgba(255,0,64,0.12)',borderRadius:14,padding:'12px',marginBottom:10}}>
          <div style={{fontSize:12,fontWeight:800,color:'#FF0040',marginBottom:8}}>{why.title}</div>
          <div style={{fontSize:11,color:'var(--text-secondary)',lineHeight:1.6,marginBottom:8}}>{why.text}</div>
          <div style={{fontSize:10,fontFamily:'DM Mono, monospace',color:'var(--text-muted)',background:'var(--bg-input)',borderRadius:8,padding:'6px 10px'}}>{why.benefit}</div>
        </div>

        {/* Feedback si dispo */}
        {feedback && (
          <div style={{background:'var(--bg-input)',borderRadius:14,padding:'12px'}}>
            <div style={{fontSize:10,fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.12em',fontFamily:'DM Mono, monospace',marginBottom:12}}>Ton feedback</div>
            <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
              <div style={{flex:1,background:'var(--bg-card)',borderRadius:12,padding:'12px',textAlign:'center'}}>
                <div style={{fontSize:22,fontWeight:800,color:effortColors[feedback.effort],fontFamily:'DM Mono, monospace'}}>{feedback.effort}/10</div>
                <div style={{fontSize:10,color:'var(--text-muted)',marginTop:2}}>{effortLabels[feedback.effort]}</div>
              </div>
              {feedback.realPace && (
                <div style={{flex:1,background:'var(--bg-card)',borderRadius:12,padding:'12px',textAlign:'center'}}>
                  <div style={{fontSize:22,fontWeight:800,color:'var(--text-primary)',fontFamily:'DM Mono, monospace'}}>{feedback.realPace}</div>
                  <div style={{fontSize:10,color:'var(--text-muted)',marginTop:2}}>min/km réel</div>
                </div>
              )}
              {feedback.sensation && (
                <div style={{flex:1,background:'var(--bg-card)',borderRadius:12,padding:'12px',textAlign:'center'}}>
                  <div style={{fontSize:20}}>{feedback.sensation.split(' ')[0]}</div>
                  <div style={{fontSize:10,color:'var(--text-muted)',marginTop:2}}>{feedback.sensation.split(' ').slice(1).join(' ')}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  , document.body);
}

function SessionCard({ session, onComplete, onDetail }) {
  const IconComp = SessionIcons[session.type] || SessionIcons.ef;
  return (
    <div onClick={onDetail} className='card-hover' style={{background:session.completed?'rgba(34,197,94,0.05)':'var(--session-bg)',border:`1px solid ${session.completed?'rgba(34,197,94,0.25)':'var(--session-border)'}`,borderRadius:20,padding:'18px 16px',position:'relative',overflow:'hidden',cursor:'pointer'}}>
      {session.completed && <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:'#22c55e',borderRadius:'20px 20px 0 0'}}/>}
      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
        <div>
          <div style={{fontSize:9,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.15em',marginBottom:6,fontFamily:'DM Mono, monospace'}}>{session.day}</div>
          <span style={{display:'inline-flex',alignItems:'center',gap:4,fontSize:9,fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',padding:'3px 10px',borderRadius:99,background:session.tagBg,color:session.tagColor,border:`1px solid ${session.tagColor}30`}}>{session.tag}</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          {session.completed
            ? <div style={{width:36,height:36,borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(34,197,94,0.15)',fontSize:18}}>✓</div>
            : <IconComp/>
          }
        </div>
      </div>
      {/* Title */}
      <div style={{fontSize:20,fontWeight:800,letterSpacing:'-0.03em',marginBottom:6,color:session.completed?'rgba(255,255,255,0.5)':'var(--text-primary)',textDecoration:session.completed?'line-through':'none'}}>{session.title}</div>
      <p style={{fontSize:12,color:'var(--text-secondary)',lineHeight:1.65,marginBottom:14}}>{session.detail}</p>
      {/* Allures */}
      <div style={{display:'flex',flexDirection:'column',gap:6,marginBottom:16}}>
        {session.allures.map((a,i) => (
          <div key={i} style={{display:'flex',alignItems:'center',gap:8,background:'var(--bg-input)',borderRadius:10,padding:'7px 10px'}}>
            <span style={{width:8,height:8,borderRadius:'50%',background:a.dot,flexShrink:0}}/>
            <span style={{fontSize:11,color:'var(--text-muted)',flex:1}}>{a.label}</span>
            <span style={{fontSize:12,fontFamily:'DM Mono, monospace',color:'var(--text-primary)',fontWeight:600}}>{a.val}</span>
          </div>
        ))}
      </div>
      {/* Actions */}
      {!session.completed && onComplete && (
        <button onClick={e=>{e.stopPropagation();onComplete(session.id);}} style={{width:'100%',background:'linear-gradient(135deg,rgba(255,0,64,0.12),rgba(255,0,64,0.06))',border:'1px solid rgba(255,0,64,0.25)',borderRadius:12,padding:'11px 16px',color:'#FF0040',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit',letterSpacing:'0.02em'}}>
          Marquer comme terminé ✓
        </button>
      )}
      {session.completed && onComplete && (
        <button onClick={e=>{e.stopPropagation();onComplete(session.id, true);}} style={{width:'100%',background:'rgba(255,255,255,0.03)',border:'1px solid var(--border)',borderRadius:12,padding:'9px 16px',color:'var(--text-muted)',fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
          ↩ Annuler la validation
        </button>
      )}
    </div>
  );
}

function FeedbackModal({ session, onClose, onSubmit }) {
  const [effort, setEffort] = useState(5);
  const [realPace, setRealPace] = useState('');
  const [sensation, setSensation] = useState('');
  const effortColors = ['','#22c55e','#22c55e','#22c55e','#4ade80','#f59e0b','#f59e0b','#f59e0b','#FF0040','#FF0040','#FF0040'];
  const effortLabels = ['','Très facile','Facile','Facile','Plutôt facile','Modéré','Modéré','Modéré','Difficile','Très difficile','Extrême'];
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.9)',zIndex:200,display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
      <div className='modal-enter' style={{width:'100%',maxWidth:480,background:'var(--bg-modal)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'24px 24px 0 0',padding:'12px 20px 36px',maxHeight:'90vh',overflowY:'auto'}}>
        <div style={{width:36,height:4,background:'var(--border)',borderRadius:99,margin:'0 auto 20px'}}/>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20,paddingBottom:16,borderBottom:'1px solid var(--border)'}}>
          <div style={{flex:1}}>
            <div style={{fontSize:9,color:'var(--text-muted)',fontFamily:'DM Mono, monospace',textTransform:'uppercase',letterSpacing:'0.15em',marginBottom:4}}>Feedback séance</div>
            <div style={{fontSize:18,fontWeight:800,letterSpacing:'-0.02em',color:'var(--text-primary)'}}>{session.title}</div>
          </div>
          <button onClick={onClose} style={{width:32,height:32,borderRadius:10,background:'var(--btn-ghost-bg)',border:'1px solid var(--border)',cursor:'pointer',color:'var(--text-muted)',fontSize:18,display:'flex',alignItems:'center',justifyContent:'center'}}>×</button>
        </div>
        <div style={{marginBottom:20}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <label style={{fontSize:11,fontWeight:700,color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'0.08em'}}>Effort ressenti</label>
            <span style={{fontSize:13,fontWeight:800,color:effortColors[effort],fontFamily:'DM Mono, monospace'}}>{effort}/10 — {effortLabels[effort]}</span>
          </div>
          <div style={{display:'flex',gap:3,marginBottom:8}}>
            {[1,2,3,4,5,6,7,8,9,10].map(n => (
              <button key={n} onClick={()=>setEffort(n)} style={{flex:1,height:36,borderRadius:8,border:'none',cursor:'pointer',fontWeight:800,fontSize:11,fontFamily:'DM Mono, monospace',background:n<=effort?effortColors[effort]:'var(--bg-input)',color:n<=effort?'#000':'var(--text-muted)',transition:'all 0.15s',transform:n===effort?'scale(1.1)':'scale(1)'}}>{n}</button>
            ))}
          </div>
          <div style={{height:3,background:'var(--progress-track)',borderRadius:99,overflow:'hidden'}}>
            <div style={{height:'100%',width:`${effort*10}%`,background:effortColors[effort],borderRadius:99,transition:'all 0.3s'}}/>
          </div>
        </div>
        <div style={{marginBottom:20}}>
          <label style={{fontSize:11,fontWeight:700,color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'0.08em',display:'block',marginBottom:8}}>Allure réelle</label>
          <div style={{position:'relative'}}>
            <input style={{...inp(),paddingRight:60}} placeholder="5:30" value={realPace} onChange={e=>setRealPace(e.target.value)}/>
            <span style={{position:'absolute',right:14,top:'50%',transform:'translateY(-50%)',fontSize:11,color:'var(--text-muted)',fontFamily:'DM Mono, monospace',pointerEvents:'none'}}>min/km</span>
          </div>
          <div style={{fontSize:10,color:'var(--text-muted)',marginTop:5}}>Laisse vide si tu n'as pas chronométré</div>
        </div>
        <div style={{marginBottom:20}}>
          <label style={{fontSize:11,fontWeight:700,color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'0.08em',display:'block',marginBottom:10}}>Sensations</label>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
            {[['😴','Jambes lourdes'],['💨','Souffle court'],['💪','Jambes légères'],['🎯','Tout parfait'],['🤕','Douleur'],['⚡',"Plein d'énergie"]].map(([emoji,label]) => {
              const s = `${emoji} ${label}`;
              const sel = sensation===s;
              return (
                <button key={s} onClick={()=>setSensation(sel?'':s)} style={{display:'flex',alignItems:'center',gap:8,padding:'10px 12px',borderRadius:12,border:`1px solid ${sel?'rgba(255,0,64,0.4)':'var(--border)'}`,background:sel?'rgba(255,0,64,0.08)':'var(--bg-input)',cursor:'pointer',fontFamily:'inherit',transition:'all 0.15s',textAlign:'left'}}>
                  <span style={{fontSize:18,lineHeight:1}}>{emoji}</span>
                  <span style={{fontSize:11,fontWeight:600,color:sel?'#FF0040':'var(--text-secondary)'}}>{label}</span>
                </button>
              );
            })}
          </div>
        </div>
        {(effort<=4||effort>=8) && (
          <div style={{display:'flex',gap:10,alignItems:'flex-start',background:effort<=4?'rgba(34,197,94,0.06)':'rgba(255,0,64,0.06)',border:`1px solid ${effort<=4?'rgba(34,197,94,0.2)':'rgba(255,0,64,0.2)'}`,borderRadius:12,padding:'12px 14px',marginBottom:16}}>
            <span style={{fontSize:20}}>{effort<=4?'💪':'🛡️'}</span>
            <div>
              <div style={{fontSize:12,fontWeight:700,color:effort<=4?'#22c55e':'#FF0040',marginBottom:2}}>{effort<=4?'Plan intensifié':'Plan allégé'}</div>
              <div style={{fontSize:11,color:'var(--text-secondary)'}}>{effort<=4?'Les prochains fractionnés gagnent 2 répétitions':'Les prochains fractionnés perdent 2 répétitions'}</div>
            </div>
          </div>
        )}
        <button onClick={()=>onSubmit({effort,realPace,sensation})} style={{width:'100%',background:'#FF0040',color:'#fff',border:'none',borderRadius:14,padding:'14px',fontSize:14,fontWeight:800,cursor:'pointer',fontFamily:'inherit'}}>
          Valider le feedback
        </button>
      </div>
    </div>
  );
}

function KpiCharts({ plan, feedbacks, completed }) {
  const weeks = plan.map(w => {
    const ids = w.sessions.map(s=>s.id);
    const done = ids.filter(id=>completed[id]).length;
    const fbs = ids.map(id=>feedbacks[id]).filter(Boolean);
    const avgEffort = fbs.length ? Math.round(fbs.reduce((a,f)=>a+f.effort,0)/fbs.length) : null;
    return { week:w.week, km:w.weeklyKm, done, total:w.sessions.length, avgEffort, phase:w.phase, color:w.color, label:w.label };
  });
  const maxKm = Math.max(...weeks.map(w=>w.km),1);
  const totalDone = Object.values(completed).filter(Boolean).length;
  const totalAll = plan.reduce((a,w)=>a+w.sessions.length,0);
  const allFbs = Object.values(feedbacks);
  const avgEff = allFbs.length ? (allFbs.reduce((a,f)=>a+f.effort,0)/allFbs.length).toFixed(1) : null;
  const completionPct = totalAll>0 ? Math.round((totalDone/totalAll)*100) : 0;
  const effortColor = (e) => e<=3?'#22c55e':e<=6?'#f59e0b':e<=8?'#FF0040':'#ef4444';

  return (
    <div style={{display:'flex',flexDirection:'column',gap:12}}>

      {/* KPI Cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
        {[
          { label:'Complétion', value:`${completionPct}%`, sub:`${totalDone}/${totalAll} séances`, color:'#22c55e', icon:'✓' },
          { label:'Effort moyen', value:avgEff?`${avgEff}/10`:'—', sub:avgEff?(parseFloat(avgEff)<=4?'Très facile':parseFloat(avgEff)<=6?'Modéré':parseFloat(avgEff)<=8?'Difficile':'Extrême'):'Pas encore de feedback', color:avgEff?effortColor(parseFloat(avgEff)):'var(--text-muted)', icon:'⚡' },
          { label:'Semaines', value:`${weeks.filter(w=>w.done===w.total&&w.total>0).length}/${weeks.length}`, sub:'semaines complètes', color:'#6366f1', icon:'📅' },
        ].map(({label,value,sub,color,icon})=>(
          <div key={label} style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:16,padding:'14px 12px',textAlign:'center'}}>
            <div style={{fontSize:18,marginBottom:6}}>{icon}</div>
            <div style={{fontSize:9,color:'var(--text-muted)',fontFamily:'DM Mono, monospace',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:6}}>{label}</div>
            <div style={{fontSize:20,fontWeight:800,color,fontFamily:'DM Mono, monospace',lineHeight:1,marginBottom:4}}>{value}</div>
            <div style={{fontSize:9,color:'var(--text-muted)',lineHeight:1.3}}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Barre de complétion globale */}
      <div style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:16,padding:'16px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <div style={{fontSize:10,fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.1em',fontFamily:'DM Mono, monospace'}}>Progression du programme</div>
          <div style={{fontSize:12,fontWeight:800,color:'#22c55e',fontFamily:'DM Mono, monospace'}}>{completionPct}%</div>
        </div>
        <div style={{height:8,background:'var(--progress-track)',borderRadius:99,overflow:'hidden',marginBottom:8}}>
          <div style={{height:'100%',width:`${completionPct}%`,background:'linear-gradient(90deg,#22c55e,#4ade80)',borderRadius:99,transition:'width 1s cubic-bezier(0.22,1,0.36,1)'}}/>
        </div>
        <div style={{display:'flex',gap:4}}>
          {weeks.map((w,i)=>{
            const pct = w.total>0?w.done/w.total:0;
            return (
              <div key={i} style={{flex:1,textAlign:'center'}}>
                <div style={{height:4,borderRadius:99,background:pct===1?w.color:pct>0?`${w.color}60`:'var(--progress-track)',marginBottom:4,transition:'all 0.5s'}}/>
                <div style={{fontSize:8,color:'var(--text-muted)',fontFamily:'DM Mono, monospace'}}>S{w.week}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Charge hebdomadaire */}
      <div style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:16,padding:'16px'}}>
        <div style={{fontSize:10,fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.1em',fontFamily:'DM Mono, monospace',marginBottom:16}}>Charge hebdomadaire (km)</div>
        <div style={{display:'flex',gap:8,alignItems:'flex-end',height:80}}>
          {weeks.map((w,i)=>{
            const pct = w.km/maxKm;
            const barColor = w.done===w.total&&w.total>0 ? w.color : w.done>0 ? `${w.color}80` : 'var(--progress-track)';
            return (
              <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4,height:'100%',justifyContent:'flex-end'}}>
                {w.km>0 && <div style={{fontSize:9,fontWeight:700,color:barColor,fontFamily:'DM Mono, monospace'}}>{w.km}</div>}
                <div style={{width:'100%',borderRadius:'6px 6px 0 0',background:barColor,height:`${Math.max(pct*64,w.km>0?6:0)}px`,transition:'height 1s cubic-bezier(0.22,1,0.36,1)',position:'relative'}}>
                  {w.done===w.total&&w.total>0 && <div style={{position:'absolute',top:-8,left:'50%',transform:'translateX(-50%)',fontSize:8}}>✓</div>}
                </div>
                <div style={{fontSize:9,color:'var(--text-muted)',fontFamily:'DM Mono, monospace',textAlign:'center'}}>
                  <div>S{w.week}</div>
                  <div style={{fontSize:7,opacity:0.6}}>{w.done}/{w.total}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Effort par semaine */}
      {allFbs.length>0 && (
        <div style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:16,padding:'16px'}}>
          <div style={{fontSize:10,fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.1em',fontFamily:'DM Mono, monospace',marginBottom:12}}>Effort ressenti par semaine</div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            {weeks.map((w,i)=>{
              const e = w.avgEffort;
              const color = e ? effortColor(e) : 'var(--progress-track)';
              return (
                <div key={i} style={{flex:1,textAlign:'center'}}>
                  <div style={{height:36,borderRadius:10,background:e?`${color}20`:'var(--bg-input)',border:`1px solid ${e?`${color}40`:'var(--border)'}`,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:4}}>
                    <span style={{fontSize:14,fontWeight:800,color:e?color:'var(--text-muted)',fontFamily:'DM Mono, monospace'}}>{e||'—'}</span>
                  </div>
                  <div style={{fontSize:8,color:'var(--text-muted)',fontFamily:'DM Mono, monospace'}}>S{w.week}</div>
                </div>
              );
            })}
          </div>
          <div style={{display:'flex',gap:12,marginTop:12,flexWrap:'wrap'}}>
            {[['#22c55e','Facile (1-3)'],['#f59e0b','Modéré (4-6)'],['#FF0040','Difficile (7-8)'],['#ef4444','Extrême (9-10)']].map(([color,label])=>(
              <div key={label} style={{display:'flex',alignItems:'center',gap:5}}>
                <div style={{width:8,height:8,borderRadius:'50%',background:color}}/>
                <span style={{fontSize:9,color:'var(--text-muted)'}}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Séances détail */}
      <div style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:16,padding:'16px'}}>
        <div style={{fontSize:10,fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.1em',fontFamily:'DM Mono, monospace',marginBottom:12}}>Détail par semaine</div>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {weeks.map((w,i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{width:32,fontSize:10,fontWeight:700,color:w.color,fontFamily:'DM Mono, monospace',flexShrink:0}}>S{w.week}</div>
              <div style={{flex:1,height:6,background:'var(--progress-track)',borderRadius:99,overflow:'hidden'}}>
                <div style={{height:'100%',width:`${w.total>0?(w.done/w.total)*100:0}%`,background:w.color,borderRadius:99,transition:'width 0.8s'}}/>
              </div>
              <div style={{fontSize:9,color:'var(--text-muted)',fontFamily:'DM Mono, monospace',width:32,textAlign:'right'}}>{w.done}/{w.total}</div>
              <div style={{fontSize:9,padding:'2px 6px',borderRadius:99,background:`${w.color}20`,color:w.color,fontWeight:700,fontFamily:'DM Mono, monospace',width:56,textAlign:'center',flexShrink:0}}>{w.label}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name:'', type:'trail', level:'intermediate', vmaMode:'direct', vma:'14', raceDistKm:'10', raceTimeMins:'', raceDistanceKm:'15', elevationM:'150', sessionsPerWeek:2, trainingDays:[], weeks:8, raceName:'', raceDate:'' });
  const upd = (k,v) => setForm(f=>({...f,[k]:v}));
  const computedVma = form.vmaMode==='direct' ? +form.vma : (form.raceTimeMins?estimateVMA(+form.raceDistKm,+form.raceTimeMins):0);
  const toggleDay = (day) => {
    if (form.trainingDays.includes(day)) { upd('trainingDays',form.trainingDays.filter(d=>d!==day)); }
    else if (form.trainingDays.length < form.sessionsPerWeek) { upd('trainingDays',[...form.trainingDays,day]); }
  };
  const steps = [
    { title:'Qui es-tu ?', sub:'Ton profil de coureur', ok:form.name.length>0, body:(
      <div style={{display:'flex',flexDirection:'column',gap:16}}>
        <div><label style={lbl}>Ton prénom</label><input style={inp()} placeholder="Alex" value={form.name} onChange={e=>upd('name',e.target.value)}/></div>
        <div><label style={lbl}>Type de course</label><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>{[['trail','🏔️ Trail'],['road','🏙️ Route']].map(([v,l])=><button key={v} onClick={()=>upd('type',v)} style={tog(form.type===v)}>{l}</button>)}</div></div>
        <div><label style={lbl}>Niveau</label><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>{[['beginner','🌱 Débutant'],['intermediate','🏃 Intermédiaire'],['advanced','⚡ Avancé'],['expert','🔥 Expert']].map(([v,l])=><button key={v} onClick={()=>upd('level',v)} style={tog(form.level===v)}>{l}</button>)}</div></div>
      </div>
    )},
    { title:'Ta condition physique', sub:'On calcule tes allures personnalisées', ok:computedVma>0, body:(
      <div style={{display:'flex',flexDirection:'column',gap:16}}>
        <div><label style={lbl}>Comment saisir ta VMA ?</label><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>{[['direct','Je connais ma VMA'],['race','Depuis un chrono récent']].map(([v,l])=><button key={v} onClick={()=>upd('vmaMode',v)} style={tog(form.vmaMode===v)}>{l}</button>)}</div></div>
        {form.vmaMode==='direct' ? (
          <div><label style={lbl}>VMA (km/h)</label><input type="number" style={inp()} min="8" max="25" step="0.5" value={form.vma} onChange={e=>upd('vma',e.target.value)}/><p style={{fontSize:11,color:'var(--text-muted)',marginTop:6}}>Moyenne loisir : 12–15 km/h</p></div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <div><label style={lbl}>Distance récente</label><select style={inp()} value={form.raceDistKm} onChange={e=>upd('raceDistKm',e.target.value)}>{[[1,'1 km'],[3,'3 km'],[5,'5 km'],[10,'10 km'],[15,'15 km'],[21.1,'Semi-marathon'],[42.2,'Marathon']].map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></div>
            <div><label style={lbl}>Chrono (en minutes)</label><input type="number" style={inp()} placeholder="ex: 55" value={form.raceTimeMins} onChange={e=>upd('raceTimeMins',e.target.value)}/></div>
            {computedVma>0 && <div style={{background:'rgba(255,0,64,0.08)',border:'1px solid rgba(255,0,64,0.2)',borderRadius:12,padding:'10px 14px',fontSize:12,color:'var(--text-secondary)'}}>VMA estimée : <span style={{color:'#FF0040',fontWeight:700,fontFamily:'monospace'}}>{computedVma.toFixed(1)} km/h</span></div>}
          </div>
        )}
      </div>
    )},
    { title:'Ta course cible', sub:'Dis-nous tout sur ton objectif', ok:form.raceName.length>0, body:(
      <div style={{display:'flex',flexDirection:'column',gap:16}}>
        <div><label style={lbl}>Nom de la course</label><input style={inp()} placeholder="Trail de la Fraise" value={form.raceName} onChange={e=>upd('raceName',e.target.value)}/></div>
        <div><label style={lbl}>Date de la course</label><input type="date" style={inp()} value={form.raceDate} onChange={e=>upd('raceDate',e.target.value)}/></div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <div><label style={lbl}>Distance (km)</label><input type="number" style={inp()} min="1" max="200" step="0.5" value={form.raceDistanceKm} onChange={e=>upd('raceDistanceKm',e.target.value)}/></div>
          <div><label style={lbl}>Dénivelé + (m)</label><input type="number" style={inp()} min="0" max="5000" step="50" value={form.elevationM} onChange={e=>upd('elevationM',e.target.value)} placeholder="0 si plat"/></div>
        </div>
      </div>
    )},
    { title:'Ton planning', sub:'Organisation de tes entraînements', ok:form.trainingDays.length===form.sessionsPerWeek, body:(
      <div style={{display:'flex',flexDirection:'column',gap:16}}>
        <div><label style={lbl}>Durée du programme</label><div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>{[[2,'2 sem.'],[4,'4 sem.'],[8,'8 sem.'],[12,'12 sem.']].map(([v,l])=><button key={v} onClick={()=>upd('weeks',v)} style={tog(form.weeks===v)}>{l}</button>)}</div></div>
        <div><label style={lbl}>Séances par semaine</label><div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>{[2,3,4,5].map(n=><button key={n} onClick={()=>{upd('sessionsPerWeek',n);upd('trainingDays',[]);}} style={tog(form.sessionsPerWeek===n)}>{n}×</button>)}</div></div>
        <div>
          <label style={lbl}>Choisis tes {form.sessionsPerWeek} jours ({form.trainingDays.length}/{form.sessionsPerWeek} sélectionnés)</label>
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8}}>
            {DAYS_FR.map(day => { const sel=form.trainingDays.includes(day); const dis=!sel&&form.trainingDays.length>=form.sessionsPerWeek; return <button key={day} onClick={()=>!dis&&toggleDay(day)} style={{...tog(sel),opacity:dis?0.35:1,cursor:dis?'not-allowed':'pointer'}}>{day}</button>; })}
          </div>
        </div>
      </div>
    )},
  ];
  const handleFinish = () => {
    const finalVma = form.vmaMode==='direct'?+form.vma:estimateVMA(+form.raceDistKm,+form.raceTimeMins);
    onComplete({...form,vma:finalVma,weeks:+form.weeks,raceDistanceKm:+form.raceDistanceKm,elevationM:+form.elevationM});
  };
  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:'24px 16px',background:'var(--onboarding-bg)'}}>
      <div style={{width:'100%',maxWidth:460,background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:24,padding:'36px 32px'}}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:32}}>
          <img src="/logo.png" alt="PacePro" style={{width:36,height:36,objectFit:'contain'}}/>
          <span style={{fontWeight:700,fontSize:18,letterSpacing:'-0.02em',color:'var(--text-primary)'}}>PacePro</span>
        </div>
        <div style={{display:'flex',gap:6,marginBottom:28,alignItems:'center'}}>
          {steps.map((_,i)=><div key={i} style={{width:i===step?20:8,height:8,borderRadius:99,background:i===step?'#FF0040':i<step?'#22c55e':'var(--progress-track)',transition:'all 0.3s'}}/>)}
          <span style={{fontSize:11,color:'var(--text-muted)',fontFamily:'monospace',marginLeft:8}}>{step+1}/{steps.length}</span>
        </div>
        <h2 style={{fontSize:22,fontWeight:800,letterSpacing:'-0.03em',marginBottom:4,color:'var(--text-primary)'}}>{steps[step].title}</h2>
        <p style={{fontSize:13,color:'var(--text-secondary)',marginBottom:24}}>{steps[step].sub}</p>
        {steps[step].body}
        <div style={{display:'flex',gap:10,marginTop:28}}>
          {step>0 && <button onClick={()=>setStep(s=>s-1)} style={{background:'var(--btn-ghost-bg)',border:'1px solid var(--btn-ghost-border)',borderRadius:12,padding:'12px 16px',color:'var(--btn-ghost-color)',cursor:'pointer',fontFamily:'inherit'}}>←</button>}
          <button onClick={step<steps.length-1?()=>setStep(s=>s+1):handleFinish} disabled={!steps[step].ok} style={{flex:1,background:'#FF0040',color:'#000',border:'none',borderRadius:12,padding:'12px 20px',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'inherit',opacity:steps[step].ok?1:0.4,transition:'all 0.2s'}}>
            {step<steps.length-1?'Continuer →':'🚀 Générer mon programme'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ profile, plan:initialPlan, onReset, onSave, initialCompleted={}, initialFeedbacks={} }) {
  const [plan, setPlan] = useState(initialPlan);
  const [activeWeek, setActiveWeek] = useState(0);
  const [activeTab, setActiveTab] = useState('plan');
  const [completed, setCompleted] = useState(initialCompleted);
  const [feedbacks, setFeedbacks] = useState(initialFeedbacks);
  const [feedbackSession, setFeedbackSession] = useState(null);
  const [detailSession, setDetailSession] = useState(null);
  const paces = calcPaces(profile.vma);
  const totalSessions = plan.reduce((a,w)=>a+w.sessions.length,0);
  const doneCount = Object.values(completed).filter(Boolean).length;
  const progress = Math.round((doneCount/totalSessions)*100);
  const week = plan[activeWeek];
  const nextSession = plan.flatMap(w=>w.sessions.map(s=>({...s,week:w.week}))).find(s=>!completed[s.id]);
  const handleComplete = (id, undo = false) => {
    if (undo) {
      const newCompleted = {...completed, [id]: false};
      const newFeedbacks = {...feedbacks};
      delete newFeedbacks[id];
      setCompleted(newCompleted);
      setFeedbacks(newFeedbacks);
      const newPlan = applyFeedback(initialPlan, id, {effort: 5});
      setPlan(newPlan);
      onSave && onSave(newPlan, newCompleted, newFeedbacks);
    } else if (!completed[id]) {
      const newCompleted = {...completed, [id]: true};
      setCompleted(newCompleted);
      const s = plan.flatMap(w => w.sessions).find(s => s.id === id);
      setFeedbackSession(s);
      onSave && onSave(plan, newCompleted, feedbacks);
    }
  };
  const handleFeedback = (fb) => {
    const newFeedbacks = {...feedbacks, [feedbackSession.id]: fb};
    const newPlan = applyFeedback(plan, feedbackSession.id, fb);
    setFeedbacks(newFeedbacks);
    setPlan(newPlan);
    setFeedbackSession(null);
    onSave && onSave(newPlan, completed, newFeedbacks);
  };
  const tabBtn = (v,l) => (
    <button onClick={()=>setActiveTab(v)} style={{borderRadius:12,padding:'7px 16px',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit',transition:'all 0.2s',background:activeTab===v?'rgba(255,0,64,0.15)':'var(--btn-ghost-bg)',border:`1px solid ${activeTab===v?'rgba(255,0,64,0.4)':'var(--btn-ghost-border)'}`,color:activeTab===v?'#FF0040':'var(--btn-ghost-color)'}}>{l}</button>
  );
  return (
    <div style={{minHeight:'100vh',background:'var(--bg-primary)',color:'var(--text-primary)',fontFamily:'Syne,sans-serif'}}>
      {feedbackSession && <FeedbackModal session={feedbackSession} onClose={()=>setFeedbackSession(null)} onSubmit={handleFeedback}/>}
      {detailSession && <SessionDetailModal session={detailSession} feedback={feedbacks[detailSession.id]} vma={profile.vma} onClose={()=>setDetailSession(null)}/>}
      {/* Hero Header */}
      <div style={{background:'linear-gradient(180deg,rgba(255,0,64,0.08) 0%,transparent 100%)',borderBottom:'1px solid var(--border-nav)',padding:'16px 20px 20px',position:'sticky',top:0,zIndex:50,backdropFilter:'blur(20px)',background:'var(--bg-nav)'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:0}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <img src="/logo.png" alt="PacePro" style={{width:28,height:28,objectFit:'contain'}}/>
            <span style={{fontWeight:800,fontSize:15,letterSpacing:'-0.02em'}}>PacePro</span>
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <span style={{fontSize:12,color:'var(--text-muted)',fontFamily:'DM Mono, monospace'}}>{profile.name}</span>
            <button onClick={onReset} style={{background:'var(--btn-ghost-bg)',border:'1px solid var(--btn-ghost-border)',borderRadius:8,padding:'5px 12px',color:'var(--btn-ghost-color)',fontSize:11,cursor:'pointer',fontFamily:'inherit',fontWeight:600}}>+ Nouveau</button>
          </div>
        </div>
      </div>
      <main style={{maxWidth:1000,margin:'0 auto',padding:'20px 16px 60px'}}>
        {/* Hero card */}
        <div style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:20,padding:'20px',marginBottom:14,position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,#FF0040,#fbbf24)`,borderRadius:'20px 20px 0 0'}}/>
          <div style={{position:'absolute',top:0,right:0,width:120,height:120,background:'radial-gradient(circle,rgba(255,0,64,0.06) 0%,transparent 70%)',pointerEvents:'none'}}/>
          <div style={{fontSize:9,color:'var(--text-muted)',fontFamily:'DM Mono, monospace',textTransform:'uppercase',letterSpacing:'0.15em',marginBottom:6}}>Objectif</div>
          <div style={{fontSize:22,fontWeight:800,letterSpacing:'-0.03em',marginBottom:4,color:'var(--text-primary)'}}>{profile.raceName||'Mon programme'}</div>
          <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:14}}>
            <span style={{fontSize:10,padding:'2px 8px',borderRadius:99,background:'rgba(255,0,64,0.1)',color:'#FF0040',border:'1px solid rgba(255,0,64,0.2)',fontFamily:'monospace',fontWeight:700}}>{profile.raceDistanceKm} km</span>
            {profile.elevationM>0 && <span style={{fontSize:10,padding:'2px 8px',borderRadius:99,background:'rgba(245,158,11,0.1)',color:'#f59e0b',border:'1px solid rgba(245,158,11,0.2)',fontFamily:'monospace',fontWeight:700}}>D+{profile.elevationM}m</span>}
            {profile.raceDate && <span style={{fontSize:10,padding:'2px 8px',borderRadius:99,background:'var(--btn-ghost-bg)',color:'var(--text-muted)',border:'1px solid var(--border)',fontFamily:'monospace'}}>{new Date(profile.raceDate).toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'})}</span>}
          </div>
          <div style={{marginBottom:8}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
              <span style={{fontSize:10,color:'var(--text-muted)',fontFamily:'DM Mono, monospace',textTransform:'uppercase',letterSpacing:'0.08em'}}>Progression globale</span>
              <span style={{fontSize:12,fontFamily:'DM Mono, monospace',fontWeight:700,color:'var(--text-primary)'}}>{doneCount}/{totalSessions} · {progress}%</span>
            </div>
            <div style={{height:6,background:'var(--progress-track)',borderRadius:99,overflow:'hidden'}}>
              <div style={{height:'100%',borderRadius:99,background:'linear-gradient(90deg,#FF0040,#fbbf24)',width:`${progress}%`,transition:'width 0.8s cubic-bezier(0.22,1,0.36,1)'}}/>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginTop:16}}>
            {[
              {label:'VMA',value:`${profile.vma.toFixed(1)}`,unit:'km/h',color:'#FF0040'},
              {label:'Séances/sem',value:`${profile.sessionsPerWeek}×`,unit:profile.trainingDays.slice(0,2).join(', '),color:'var(--text-primary)'},
              {label:'Programme',value:`${profile.weeks}`,unit:'semaines',color:'#f59e0b'},
            ].map(({label,value,unit,color})=>(
              <div key={label} style={{background:'var(--bg-input)',borderRadius:12,padding:'10px 12px',textAlign:'center'}}>
                <div style={{fontSize:9,color:'var(--text-muted)',fontFamily:'DM Mono, monospace',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:4}}>{label}</div>
                <div style={{fontSize:20,fontWeight:800,color,fontFamily:'DM Mono, monospace',lineHeight:1}}>{value}</div>
                <div style={{fontSize:9,color:'var(--text-muted)',marginTop:3}}>{unit}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:16,padding:'16px',marginBottom:14}}>
          <div style={{fontSize:9,color:'var(--text-muted)',fontFamily:'DM Mono, monospace',textTransform:'uppercase',letterSpacing:'0.15em',marginBottom:12}}>Tes allures personnalisées</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:6}}>
            {[['EF',paces.ef,'#22c55e'],['Tempo',paces.tempo,'#f59e0b'],['Seuil',paces.threshold,'#FF0040'],['VMA 90%',paces.vma90,'#ef4444'],['Récup',paces.recov,'var(--text-muted)']].map(([l,v,col])=>(
              <div key={l} style={{background:'var(--bg-input)',borderRadius:10,padding:'8px 10px',display:'flex',alignItems:'center',gap:8}}>
                <span style={{width:8,height:8,borderRadius:'50%',background:col,flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:9,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.08em'}}>{l}</div>
                  <div style={{fontSize:12,fontFamily:'DM Mono, monospace',fontWeight:700,color:'var(--text-primary)'}}>{v}/km</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {nextSession && (
          <div style={{background:'linear-gradient(135deg,rgba(255,0,64,0.08),rgba(255,0,64,0.03))',border:'1px solid rgba(255,0,64,0.2)',borderRadius:16,padding:'16px 18px',marginBottom:14,display:'flex',gap:14,alignItems:'center'}}>
            <div style={{width:44,height:44,borderRadius:14,background:'rgba(255,0,64,0.15)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:22}}>⚡</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:9,color:'#FF0040',textTransform:'uppercase',letterSpacing:'0.15em',fontFamily:'DM Mono, monospace',marginBottom:4}}>Prochaine · S{nextSession.week} · {nextSession.day}</div>
              <div style={{fontSize:16,fontWeight:800,letterSpacing:'-0.02em',color:'var(--text-primary)',marginBottom:2}}>{nextSession.title}</div>
              <div style={{fontSize:11,color:'var(--text-secondary)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{nextSession.detail}</div>
            </div>
          </div>
        )}
        <div style={{display:'flex',gap:0,marginBottom:16,background:'var(--bg-input)',borderRadius:14,padding:4}}>
          {[['plan','Programme'],['kpi','KPI']].map(([v,l])=>(
            <button key={v} onClick={()=>setActiveTab(v)} style={{flex:1,borderRadius:10,padding:'9px 16px',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit',transition:'all 0.2s',background:activeTab===v?'var(--bg-card)':'transparent',border:activeTab===v?'1px solid var(--border)':'1px solid transparent',color:activeTab===v?'var(--text-primary)':'var(--text-muted)',boxShadow:activeTab===v?'0 2px 8px rgba(0,0,0,0.15)':'none'}}>{l}</button>
          ))}
        </div>
        {activeTab==='kpi' ? (
          <KpiCharts plan={plan} feedbacks={feedbacks} completed={completed}/>
        ) : (
          <div>
            <div style={{display:'flex',gap:6,overflowX:'auto',paddingBottom:4,marginBottom:18}}>
              {plan.map((w,i)=>(
                <button key={i} onClick={()=>setActiveWeek(i)} style={{flexShrink:0,borderRadius:12,padding:'6px 14px',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit',transition:'all 0.2s',background:activeWeek===i?'rgba(255,0,64,0.15)':'var(--week-tabs-inactive)',border:`1px solid ${activeWeek===i?'rgba(255,0,64,0.4)':'var(--week-tabs-border)'}`,color:activeWeek===i?'#FF0040':'var(--week-tabs-color)'}}>
                  S{w.week}{w.isKey?' ★':''}
                </button>
              ))}
            </div>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
              <button onClick={()=>setActiveWeek(w=>Math.max(0,w-1))} style={navBtnS}>←</button>
              <div style={{flex:1}}>
                <div style={{fontSize:10,color:'var(--text-ultra-muted)',fontFamily:'monospace',letterSpacing:'0.1em'}}>{week.dateRange}</div>
                <div style={{display:'flex',alignItems:'center',gap:8,marginTop:4,flexWrap:'wrap'}}>
                  <span style={{fontSize:17,fontWeight:700,letterSpacing:'-0.02em',color:'var(--text-primary)'}}>Semaine {week.week}</span>
                  <span style={{fontSize:10,fontWeight:700,padding:'2px 9px',borderRadius:99,textTransform:'uppercase',letterSpacing:'0.08em',background:week.bg,color:week.color,border:`1px solid ${week.color}40`}}>{week.label}</span>
                  {week.weeklyKm>0 && <span style={{fontSize:10,color:'var(--text-ultra-muted)',fontFamily:'monospace'}}>{week.weeklyKm} km est.</span>}
                </div>
              </div>
              <button onClick={()=>setActiveWeek(w=>Math.min(plan.length-1,w+1))} style={navBtnS}>→</button>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:12}}>
              {week.sessions.map(s => {
                const fb = feedbacks[s.id];
                return (
                  <div key={s.id}>
                    <SessionCard session={{...s,completed:!!completed[s.id]}} onComplete={handleComplete} onDetail={()=>setDetailSession({...s,completed:!!completed[s.id]})}/>
                    {fb && (
                      <div style={{marginTop:6,background:'var(--btn-ghost-bg)',border:'1px solid var(--border)',borderRadius:10,padding:'8px 12px',fontSize:11,color:'var(--text-secondary)',display:'flex',gap:10,flexWrap:'wrap'}}>
                        <span>Effort : <span style={{color:'#f59e0b',fontWeight:600}}>{fb.effort}/10</span></span>
                        {fb.realPace && <span>Allure : <span style={{color:'var(--text-primary)',fontFamily:'monospace'}}>{fb.realPace}/km</span></span>}
                        {fb.sensation && <span>{fb.sensation}</span>}
                        {s.adjusted && <span style={{color:s.adjusted==='up'?'#22c55e':'#FF0040',fontWeight:600}}>{s.adjusted==='up'?'↑ Intensifié':'↓ Allégé'}</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {activeWeek===plan.length-1 && profile.raceName && (
              <div style={{marginTop:16,background:'rgba(245,158,11,0.07)',border:'1px solid rgba(245,158,11,0.25)',borderRadius:14,padding:'20px 24px'}}>
                <div style={{fontSize:10,color:'rgba(245,158,11,0.7)',fontFamily:'monospace',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:6}}>
                  {profile.raceDate?new Date(profile.raceDate).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'}):'Jour J'}
                </div>
                <div style={{fontSize:16,fontWeight:700,marginBottom:4,color:'var(--text-primary)'}}>{profile.raceName} 🎯</div>
                <div style={{fontSize:12,color:'var(--text-secondary)'}}>
                  {profile.raceDistanceKm} km{profile.elevationM>0?` · D+${profile.elevationM}m`:''} · Allure cible : <span style={{color:'var(--text-primary)',fontFamily:'monospace'}}>{paces.ef} /km</span>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function PlansList({ plans, onSelect, onNew, onDelete }) {
  return (
    <div style={{minHeight:'100vh',background:'var(--bg-primary)',color:'var(--text-primary)',fontFamily:'Syne,sans-serif'}}>
      <nav style={{position:'sticky',top:0,zIndex:50,background:'var(--bg-nav)',backdropFilter:'blur(20px)',borderBottom:'1px solid var(--border-nav)',padding:'0 20px',height:56,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <img src="/logo.png" alt="PacePro" style={{width:30,height:30,objectFit:'contain'}}/>
          <span style={{fontWeight:800,fontSize:16,letterSpacing:'-0.03em'}}>PacePro</span>
        </div>
        <button onClick={onNew} style={{background:'#FF0040',color:'#fff',border:'none',borderRadius:12,padding:'8px 16px',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:6}}>
          <span style={{fontSize:16,lineHeight:1}}>+</span> Nouveau plan
        </button>
      </nav>
      <main style={{maxWidth:680,margin:'0 auto',padding:'28px 16px 40px'}}>
        <div style={{marginBottom:28}}>
          <h1 style={{fontSize:28,fontWeight:800,letterSpacing:'-0.04em',marginBottom:4,color:'var(--text-primary)'}}>Mes programmes</h1>
          <p style={{fontSize:12,color:'var(--text-muted)',fontFamily:'DM Mono, monospace',textTransform:'uppercase',letterSpacing:'0.1em'}}>{plans.length} plan{plans.length>1?'s':''} sauvegardé{plans.length>1?'s':''}</p>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          {plans.map((p,i) => {
            const done = Object.values(p.completed||{}).filter(Boolean).length;
            const total = p.plan?.reduce((a,w)=>a+w.sessions.length,0)||0;
            const pct = total>0?Math.round((done/total)*100):0;
            const currentPhase = p.plan?.find(w=>w.sessions.some(s=>!(p.completed||{})[s.id]));
            return (
              <div key={i} onClick={()=>onSelect(i)} className='card-hover' style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:20,padding:'20px',cursor:'pointer',position:'relative',overflow:'hidden'}}>
                {/* Accent bar */}
                <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:'linear-gradient(90deg,#FF0040,#fbbf24)',borderRadius:'20px 20px 0 0',opacity: pct>0?1:0.3}}/>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:18,fontWeight:800,letterSpacing:'-0.02em',marginBottom:6,color:'var(--text-primary)'}}>{p.profile.raceName||'Mon programme'}</div>
                    <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                      <span style={{fontSize:10,fontWeight:700,padding:'3px 8px',borderRadius:99,background:'rgba(255,0,64,0.1)',color:'#FF0040',border:'1px solid rgba(255,0,64,0.2)',fontFamily:'monospace'}}>{p.profile.raceDistanceKm} km</span>
                      {p.profile.elevationM>0 && <span style={{fontSize:10,fontWeight:700,padding:'3px 8px',borderRadius:99,background:'rgba(245,158,11,0.1)',color:'#f59e0b',border:'1px solid rgba(245,158,11,0.2)',fontFamily:'monospace'}}>D+{p.profile.elevationM}m</span>}
                      <span style={{fontSize:10,fontWeight:700,padding:'3px 8px',borderRadius:99,background:'var(--btn-ghost-bg)',color:'var(--text-muted)',border:'1px solid var(--border)',fontFamily:'monospace'}}>{p.profile.weeks} sem.</span>
                      <span style={{fontSize:10,fontWeight:700,padding:'3px 8px',borderRadius:99,background:'var(--btn-ghost-bg)',color:'var(--text-muted)',border:'1px solid var(--border)',fontFamily:'monospace'}}>{p.profile.type==='trail'?'🏔️ Trail':'🏙️ Route'}</span>
                    </div>
                  </div>
                  <div style={{width:44,height:44,borderRadius:12,background:'rgba(255,0,64,0.08)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginLeft:12}}>
                    <span style={{fontSize:18,fontWeight:900,color:'#FF0040'}}>›</span>
                  </div>
                </div>
                {/* Progress */}
                <div style={{marginBottom:10}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
                    <span style={{fontSize:10,color:'var(--text-muted)',fontFamily:'monospace',textTransform:'uppercase',letterSpacing:'0.08em'}}>Progression</span>
                    <span style={{fontSize:10,color:'var(--text-primary)',fontFamily:'monospace',fontWeight:700}}>{done}/{total} séances · {pct}%</span>
                  </div>
                  <div style={{height:4,background:'var(--progress-track)',borderRadius:99,overflow:'hidden'}}>
                    <div style={{height:'100%',width:`${pct}%`,background:'linear-gradient(90deg,#FF0040,#fbbf24)',borderRadius:99,transition:'width 0.6s'}}/>
                  </div>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div style={{fontSize:10,color:'var(--text-muted)',fontFamily:'monospace'}}>
                    VMA {p.profile.vma.toFixed(1)} km/h · {p.profile.sessionsPerWeek}×/sem
                    {p.profile.raceDate && ` · ${new Date(p.profile.raceDate).toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}`}
                  </div>
                  <button onClick={e=>{e.stopPropagation();onDelete(i);}} style={{background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.15)',borderRadius:8,padding:'4px 10px',color:'rgba(239,68,68,0.6)',fontSize:10,cursor:'pointer',fontFamily:'inherit',fontWeight:600}}>Supprimer</button>
                </div>
              </div>
            );
          })}
        </div>
        {plans.length === 0 && (
          <div style={{textAlign:'center',padding:'60px 20px',color:'var(--text-muted)'}}>
            <div style={{fontSize:48,marginBottom:16}}>🏃</div>
            <div style={{fontSize:16,fontWeight:700,marginBottom:8,color:'var(--text-secondary)'}}>Aucun programme</div>
            <div style={{fontSize:13,marginBottom:24}}>Crée ton premier plan d'entraînement personnalisé</div>
            <button onClick={onNew} style={{background:'#FF0040',color:'#fff',border:'none',borderRadius:12,padding:'12px 24px',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>Créer un programme</button>
          </div>
        )}
      </main>
    </div>
  );
}


function ProfileSheet({ user, onClose, onLogout, onNavigate }) {
  const stats = [
    { label: 'Running', icon: 'running', tab: 'running', color: '#FF0040' },
    { label: 'Muscu', icon: 'muscle', tab: 'muscu', color: '#6366f1' },
    { label: 'Strava', icon: 'strava', tab: 'strava', color: '#f59e0b' },
    { label: 'Historique', icon: 'history', tab: 'historique', color: '#22c55e' },
  ];
  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:200, backdropFilter:'blur(8px)' }} />
      <div className='modal-enter' style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:201, background:'var(--bg-modal)', borderRadius:'28px 28px 0 0', padding:'12px 20px 48px', fontFamily:'Syne, sans-serif', maxHeight:'80vh', overflowY:'auto' }}>
        {/* Handle */}
        <div style={{ width:40, height:4, background:'var(--border)', borderRadius:99, margin:'0 auto 24px' }} />

        {/* Hero user card */}
        <div style={{ position:'relative', marginBottom:24, borderRadius:20, overflow:'hidden' }}>
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg,rgba(255,0,64,0.08),rgba(99,102,241,0.08))', borderRadius:20 }}/>
          <div style={{ position:'relative', padding:'20px 18px', display:'flex', alignItems:'center', gap:16 }}>
            <div style={{ position:'relative', flexShrink:0 }}>
              {user?.photo
                ? <img src={user.photo} alt="" style={{ width:64, height:64, borderRadius:'50%', objectFit:'cover', border:'3px solid rgba(255,0,64,0.3)' }} />
                : <div style={{ width:64, height:64, borderRadius:'50%', background:'rgba(255,0,64,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28 }}>👤</div>
              }
              {user?.strava && <div style={{ position:'absolute', bottom:0, right:0, width:22, height:22, borderRadius:'50%', background:'#f59e0b', display:'flex', alignItems:'center', justifyContent:'center', border:'2px solid var(--bg-modal)' }}><Icon name="strava" size={12} color="#fff"/></div>}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:20, fontWeight:800, letterSpacing:'-0.03em', color:'var(--text-primary)', marginBottom:4, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user?.name || 'Athlete'}</div>
              <div style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'DM Mono, monospace', textTransform:'uppercase', letterSpacing:'0.08em' }}>
                {user?.strava ? 'Connecté via Strava' : user?.email || 'PacePro'}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation rapide */}
        <div style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.12em', fontFamily:'DM Mono, monospace', marginBottom:12 }}>Navigation</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:24 }}>
          {stats.map(({ label, icon, tab, color }) => (
            <button key={tab} onClick={() => { onNavigate(tab); onClose(); }} style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', borderRadius:16, background:'var(--bg-input)', border:`1px solid var(--border)`, cursor:'pointer', fontFamily:'Syne, sans-serif', transition:'all 0.15s', textAlign:'left' }}>
              <div style={{ width:36, height:36, borderRadius:10, background:`${color}15`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Icon name={icon} size={18} color={color} />
              </div>
              <span style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)' }}>{label}</span>
            </button>
          ))}
        </div>

        {/* Logout */}
        <button onClick={onLogout} style={{ width:'100%', background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.15)', borderRadius:16, padding:'16px', fontSize:14, fontWeight:700, color:'rgba(239,68,68,0.8)', cursor:'pointer', fontFamily:'Syne, sans-serif', letterSpacing:'0.01em' }}>
          Se déconnecter
        </button>
      </div>
    </>
  );
}

export default function PacePro() {
  const [tab, setTab] = useState('home');
  const [showProfile, setShowProfile] = useState(false);
  const [user, setUser] = useState(() => {
    try {
      // Vérifie d'abord pp_user (email auth)
      const u = localStorage.getItem('pp_user');
      if (u) return JSON.parse(u);
      // Sinon vérifie Strava
      const a = localStorage.getItem('strava_athlete');
      if (a) {
        const athlete = JSON.parse(a);
        if (athlete?.id) {
          // Assure que pp_user_id est défini pour la sync Supabase
          if (!localStorage.getItem('pp_user_id')) {
            // Map Strava ID -> Supabase UUID
            const stravaToSupabase = { '72640323': 'a4ca6b86-652c-4cf4-8dcc-243412260f9c' };
            const uuid = stravaToSupabase[String(athlete.id)];
            if (uuid) localStorage.setItem('pp_user_id', uuid);
          }
          return { id: athlete.id, name: athlete.name, photo: athlete.photo, strava: true };
        }
      }
      return null;
    } catch { return null; }
  });

  const handleAuth = (u) => setUser(u);
  const handleLogout = () => {
    localStorage.removeItem('pp_user');
    localStorage.removeItem('pp_user_id');
    localStorage.removeItem('strava_token');
    localStorage.removeItem('strava_athlete');
    setUser(null);
  };

  if (!user) return <AuthModule onAuth={handleAuth} />;
   // 'running' | 'muscu'
  const [view, setView] = useState('list');
  const [plans, setPlans] = useState([]);
  const [activePlan, setActivePlan] = useState(null);
  useEffect(()=>{
  const recalcWeeklyKm = (plans) => plans.map(p => ({
    ...p,
    plan: (p.plan||[]).map(week => {
      const vma = p.profile?.vma || 12;
      const weeklyKm = Math.round(week.sessions.reduce((a,s) => {
        const mKm = s.title.match(/(\d+)\s*km/);
        if (mKm) return a + +mKm[1];
        const mFrac = s.title.match(/(\d+)\s*×\s*(\d+)\s*min/);
        if (mFrac) {
          const reps = +mFrac[1], effortMin = +mFrac[2];
          const recovMin = parseFloat((s.title.match(/\/\s*(\d+(?:\.\d+)?)\s*min/)||[])[1]||effortMin);
          const effortKm = (vma*0.92/60)*effortMin*reps;
          const recovKm  = (vma*0.60/60)*recovMin*reps;
          return a + effortKm + recovKm + (vma*0.65/60)*15 + (vma*0.60/60)*10;
        }
        const mMins = s.title.match(/(\d+)[–\-](\d+)\s*min/);
        if (mMins) return a + (vma*0.65/60)*((+mMins[1]+(+mMins[2]))/2);
        const mMin = s.title.match(/(\d+)\s*min/);
        if (mMin) return a + (vma*0.65/60)*+mMin[1];
        return a;
      }, 0)*10)/10;
      return { ...week, weeklyKm };
    })
  }));
  const init = async () => {
    const cloud = await loadPlans();
    if (cloud && cloud.length > 0) {
      const recalculated = recalcWeeklyKm(cloud);
      setPlans(recalculated);
      try { localStorage.setItem('pp_plans', JSON.stringify(recalculated)); } catch {}
    } else {
      try { const s = localStorage.getItem('pp_plans'); if(s) setPlans(recalcWeeklyKm(JSON.parse(s))); } catch {}
    }
  };
  init();
},[]);
  const savePlans = (p) => { setPlans(p); try{localStorage.setItem('pp_plans',JSON.stringify(p));}catch{} syncPlans(p); };
  const handleOnboarding = (profile) => {
    const plan = generatePlan(profile);
    const newPlans = [...plans,{profile,plan}];
    savePlans(newPlans);
    setActivePlan(newPlans.length-1);
    setView('dashboard');
  };
  const handleDelete = (idx) => { savePlans(plans.filter((_,i)=>i!==idx)); setView('list'); };

  // Bottom nav
  const BottomNav = () => (
    <div className='bottom-nav' style={{position:'fixed',bottom:0,left:0,right:0,zIndex:100,background:'var(--bg-nav)',backdropFilter:'blur(20px)',borderTop:'1px solid var(--border-nav)',display:'flex',height:56,paddingBottom:0,alignItems:'center'}}>
      {[['home','home','Accueil'],['running','running','Running'],['muscu','muscle','Muscu'],['strava','strava','Strava'],['historique','history','Historique']].map(([t,icon,label])=>(
        <button key={t} onClick={()=>setTab(t)}
          className={tab===t ? 'nav-btn-active' : ''} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:2,background:'none',border:'none',cursor:'pointer',fontFamily:'Syne,sans-serif',color:tab===t?'#FF0040':'var(--text-muted)',transition:'color 0.2s'}}>
          <Icon name={icon} size={22} color={tab===t?'#FF0040':'var(--text-muted)'}/>
          <span style={{fontSize:9,fontWeight:tab===t?700:400,letterSpacing:'0.04em'}}>{label}</span>
        </button>
      ))}
    </div>
  );

  const ProfileBtn = () => (
    <button onClick={() => setShowProfile(true)} style={{ position:'fixed', top:'calc(env(safe-area-inset-top, 0px) + 12px)', right:16, zIndex:150, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:99, padding:'6px 12px 6px 8px', display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontFamily:'Syne, sans-serif', boxShadow:'0 2px 12px rgba(0,0,0,0.1)' }}>
      {user?.photo
        ? <img src={user.photo} alt="" style={{ width:26, height:26, borderRadius:'50%', objectFit:'cover' }} />
        : <div style={{ width:26, height:26, borderRadius:'50%', background:'rgba(219,59,61,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>👤</div>
      }
      <span style={{ fontSize:12, fontWeight:600, color:'var(--text-primary)', maxWidth:80, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.name?.split(' ')[0]}</span>
    </button>
  );

  if (tab === 'historique') {
    return (
      <div className='app-shell'>
        <ThemeStyles/>
        <ProfileBtn/>
        {showProfile && <ProfileSheet user={user} onClose={() => setShowProfile(false)} onLogout={() => { handleLogout(); setShowProfile(false); }} onNavigate={setTab} />}
        <div className='app-content tab-enter' style={{paddingBottom:80}}><HistoriqueModule/></div>
        <BottomNav/>
      </div>
    );
  }
  if (tab === 'bilan') return (
    <div className='app-shell'>
      <ThemeStyles/>
      <ProfileBtn/>
      {showProfile && <ProfileSheet user={user} onClose={() => setShowProfile(false)} onLogout={() => { handleLogout(); setShowProfile(false); }} onNavigate={setTab} />}
      <div className='app-content tab-enter'><BilanModule onBack={() => setTab('home')} /></div>
    </div>
  );
  if (tab === 'home') {
    return (
      <div className='app-shell'>
        <ThemeStyles/>
        <ProfileBtn/>
        {showProfile && <ProfileSheet user={user} onClose={() => setShowProfile(false)} onLogout={() => { handleLogout(); setShowProfile(false); }} onNavigate={setTab} />}
        <div className='app-content tab-enter'><HomeModule onNavigate={setTab}/></div>
        <BottomNav/>
      </div>
    );
  }
  if (tab === 'strava') {
    return (
      <div className='app-shell'>
        <ThemeStyles/>
        <ProfileBtn/>
        {showProfile && <ProfileSheet user={user} onClose={() => setShowProfile(false)} onLogout={() => { handleLogout(); setShowProfile(false); }} onNavigate={setTab} />}
        <div className='app-content tab-enter' style={{paddingBottom:80}}><StravaModule/></div>
        <BottomNav/>
      </div>
    );
  }
  if (tab === 'muscu') {
    return (
      <div className='app-shell'>
        <ThemeStyles/>
        <ProfileBtn/>
        {showProfile && <ProfileSheet user={user} onClose={() => setShowProfile(false)} onLogout={() => { handleLogout(); setShowProfile(false); }} onNavigate={setTab} />}
        <div className='app-content tab-enter' style={{paddingBottom:80}}><Muscu/></div>
        <BottomNav/>
      </div>
    );
  }

  // Running tab
  if (view==='onboarding') return <div className='app-shell'><ThemeStyles/><div className='app-content tab-enter' style={{paddingBottom:80}}><Onboarding onComplete={handleOnboarding}/></div><BottomNav/></div>;
  if (view==='dashboard' && activePlan!==null && plans[activePlan]) {
    return (
      <div className='app-shell'>
        <ThemeStyles/>
        <div className='app-content tab-enter' style={{paddingBottom:80}}>
          <button onClick={()=>setView('list')} style={{position:'fixed',bottom:68,right:20,zIndex:99,background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:99,padding:'8px 14px',color:'var(--text-secondary)',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'Syne,sans-serif',backdropFilter:'blur(12px)'}}>📋 Mes plans</button>
          <Dashboard profile={plans[activePlan].profile} plan={plans[activePlan].plan} initialCompleted={plans[activePlan].completed||{}} initialFeedbacks={plans[activePlan].feedbacks||{}} onReset={()=>setView('onboarding')} onSave={(newPlan, newCompleted, newFeedbacks) => { const updated = plans.map((p,i) => i===activePlan ? {...p, plan:newPlan, completed:newCompleted, feedbacks:newFeedbacks} : p); savePlans(updated); }}/>
        </div>
        <BottomNav/>
      </div>
    );
  }
  if (plans.length===0) return <div className='app-shell'><ThemeStyles/><div className='app-content tab-enter' style={{paddingBottom:80}}><Onboarding onComplete={handleOnboarding}/></div><BottomNav/></div>;
  return <div className='app-shell'><ThemeStyles/><div className='app-content' style={{paddingBottom:80}}><PlansList plans={plans} onSelect={i=>{setActivePlan(i);setView('dashboard');}} onNew={()=>setView('onboarding')} onDelete={handleDelete}/></div><BottomNav/></div>;
}
