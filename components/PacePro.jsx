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

// ── Sync universelle ─────────────────────────────────────────────────────────
async function syncData(key, value) {
  const userId = localStorage.getItem('pp_user_id');
  if (!userId) return;
  try {
    await supaFetch('user_data?user_id=eq.' + userId + '&data_key=eq.' + key, { method: 'DELETE' });
    await supaFetch('user_data', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, data_key: key, data_value: value }),
    });
  } catch(e) {}
}

async function loadData(key) {
  const userId = localStorage.getItem('pp_user_id');
  if (!userId) return null;
  try {
    const data = await supaFetch('user_data?user_id=eq.' + userId + '&data_key=eq.' + key);
    if (data && data.length > 0) return data[0].data_value;
    return null;
  } catch(e) { return null; }
}

async function loadAllUserData() {
  const userId = localStorage.getItem('pp_user_id');
  if (!userId) return null;
  try {
    const data = await supaFetch('user_data?user_id=eq.' + userId);
    if (!data || !data.length) return null;
    const result = {};
    data.forEach(d => { result[d.data_key] = d.data_value; });
    return result;
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
import FuelRecoveryHub from './FuelRecoveryHub';
import SettingsModule from './SettingsModule';
import RaceNutritionStrategy from './RaceNutritionStrategy';

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
        --progress-track: rgba(255,255,255,0.15);
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
          --onboarding-bg: #f5f5f7;
          --session-bg: rgba(255,255,255,0.96);
          --session-border: rgba(10,11,15,0.10);
          --week-tabs-inactive: rgba(10,11,15,0.06);
          --week-tabs-border: rgba(10,11,15,0.10);
          --week-tabs-color: #6b6f7a;
          --next-session-bg: rgba(255,0,64,0.04);
          --next-session-border: rgba(255,0,64,0.18);
          --chip-bg: rgba(10,11,15,0.06);
          --chip-border: rgba(10,11,15,0.12);
          --progress-track: rgba(10,11,15,0.18);
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
      @keyframes navActivate {
        0%   { transform: scale(1); opacity: 0.5; }
        50%  { transform: scale(1.15); opacity: 1; }
        100% { transform: scale(1); opacity: 1; }
      }
      @keyframes navDot {
        from { transform: scaleX(0); opacity: 0; }
        to   { transform: scaleX(1); opacity: 1; }
      }
      .nav-btn-active svg {
        animation: navActivate 0.3s cubic-bezier(0.22, 1, 0.36, 1) both;
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

function generatePlanCycling(profile) {
  const {
    vma: ftp = 200, weeks = 12, sessionsPerWeek = 4, trainingDays = [],
    cyclingBackground = 'intermediate', cyclingProfile = 'rouleur',
    cyclingWeakPoint = 'climbs', cyclingLikesVariety = true,
    cyclingSolo = true, cyclingMaterial = 'road',
    cyclingHasPower = false, cyclingFCmax = 185,
    cyclingSleep = 'good', cyclingStress = 'medium',
    raceDistanceKm = 100, elevationM = 1000,
    cyclingWeeklyHours = 8,
  } = profile;

  const ftpNum = parseFloat(ftp) || 200;
  const fcmax = parseFloat(cyclingFCmax) || 185;

  // Adapter le volume selon sleep/stress
  const recoveryFactor = (cyclingSleep === 'bad' || cyclingStress === 'high') ? 0.85 : (cyclingSleep === 'good' && cyclingStress === 'low') ? 1.1 : 1.0;

  const baseKm = Math.round({ beginner:40, intermediate:60, advanced:80, expert:100 }[cyclingBackground] * recoveryFactor);

  // Phases adaptées selon durée du plan
  const buildPhases = weeks <= 8
    ? ['base','base','build','taper']
    : weeks <= 12
    ? ['base','base','base','build','build','peak','taper','taper']
    : ['base','base','base','base','build','build','build','peak','peak','taper','taper','taper'];
  const phaseMap = Array.from({length:weeks},(_,i) => buildPhases[Math.floor(i/(weeks/buildPhases.length))] || 'base');

  const phaseInfo = {
    base: { label:'Endurance de base', color:'#22c55e', bg:'rgba(34,197,94,0.12)' },
    build: { label:'Développement', color:'#f59e0b', bg:'rgba(245,158,11,0.12)' },
    peak: { label:'Pic de forme', color:'#ef4444', bg:'rgba(239,68,68,0.12)' },
    taper: { label:'Affûtage', color:'#a78bfa', bg:'rgba(167,139,250,0.12)' },
  };

  const useWatts = cyclingHasPower;
  const metric = (z, pct) => useWatts ? `${Math.round(ftpNum*pct)}W` : `${Math.round(fcmax*pct)} bpm`;

  // Séances adaptées selon profil
  const buildSessions = (phase, km, days) => days.map((day, si) => {
    const isLast = si === days.length - 1;
    const isFirst = si === 0;
    const hasManyDays = days.length >= 4;

    // Sortie longue — toujours en dernier
    if (isLast) {
      const longKm = Math.round(km * (phase === 'peak' ? 0.75 : 0.6));
      return {
        id:`w_s${si}`, day, type:'long', tag:'Sortie longue',
        tagColor:'#f59e0b', tagBg:'rgba(245,158,11,0.12)',
        title:`${longKm} km endurance`,
        detail:`Allure Z2 constante. ${elevationM > 500 ? 'Intègre du dénivelé si possible.' : 'Terrain plat ou vallonné.'} ${cyclingMaterial === 'home_trainer' ? 'Home-trainer : film ou musique conseillé.' : ''}`,
        allures:[{dot:'#22c55e',label:'Z2',val:useWatts?`${Math.round(ftpNum*0.6)}-${Math.round(ftpNum*0.75)}W`:`${Math.round(fcmax*0.65)}-${Math.round(fcmax*0.75)} bpm`}]
      };
    }

    // Séance intense — 1ère ou 2ème selon profil
    if (isFirst && phase !== 'base') {
      // Adapter selon point faible — si déteste les intervalles, faire du tempo
      if (cyclingWeakPoint === 'intervals' || !cyclingLikesVariety) {
        return {
          id:`w_s${si}`, day, type:'tempo', tag:'Tempo',
          tagColor:'#6366f1', tagBg:'rgba(99,102,241,0.12)',
          title:`${Math.round(km*0.4)} km tempo`,
          detail:'Effort soutenu à allure de course. Plus confortable que les intervalles courts, très efficace pour progresser.',
          allures:[{dot:'#6366f1',label:'Tempo',val:useWatts?`${Math.round(ftpNum*0.88)}-${Math.round(ftpNum*0.95)}W`:`${Math.round(fcmax*0.80)}-${Math.round(fcmax*0.87)} bpm`}]
        };
      }
      // Adapter selon profil grimpeur/sprinteur
      if (cyclingProfile === 'grimpeur' || cyclingWeakPoint === 'climbs') {
        return {
          id:`w_s${si}`, day, type:'frac', tag:'Côtes',
          tagColor:'#FF0040', tagBg:'rgba(255,0,64,0.12)',
          title:`6 × 8 min ascension`,
          detail:`6 répétitions en montée de 8 min. Récupération 5 min en descente. ${cyclingProfile === 'grimpeur' ? 'Ton point fort — pousse fort !' : 'Développe ta force en montée.'}`,
          allures:[{dot:'#FF0040',label:'Montée',val:useWatts?`${Math.round(ftpNum*0.95)}-${Math.round(ftpNum*1.05)}W`:`${Math.round(fcmax*0.85)}-${Math.round(fcmax*0.92)} bpm`},{dot:'#22c55e',label:'Descente',val:'Z1 — récupération active'}]
        };
      }
      return {
        id:`w_s${si}`, day, type:'frac', tag:'Intervalles',
        tagColor:'#FF0040', tagBg:'rgba(255,0,64,0.12)',
        title:`5 × 5 min / 3 min récup`,
        detail:`Échauffement 20 min. 5 blocs intensité haute. Retour calme 15 min. ${cyclingSolo ? 'Seul : focus sur tes sensations.' : 'En groupe : attention à ne pas te laisser emporter.'}`,
        allures:[{dot:'#FF0040',label:'Effort',val:useWatts?`${Math.round(ftpNum*0.95)}-${Math.round(ftpNum*1.05)}W`:`${Math.round(fcmax*0.87)}-${Math.round(fcmax*0.93)} bpm`},{dot:'#22c55e',label:'Récup',val:useWatts?`<${Math.round(ftpNum*0.55)}W`:`<${Math.round(fcmax*0.65)} bpm`}]
      };
    }

    // Séance récup ou endurance
    if (hasManyDays && si === 1) {
      return {
        id:`w_s${si}`, day, type:'recov', tag:'Récupération',
        tagColor:'#22c55e', tagBg:'rgba(34,197,94,0.12)',
        title:`${Math.round(km*0.25)} km récup active`,
        detail:`Sortie légère, jambes libres. Cadence élevée (90+ rpm). ${cyclingMaterial === 'home_trainer' ? 'Home-trainer : 45-60 min max.' : 'Terrain plat uniquement.'}`,
        allures:[{dot:'#22c55e',label:'Z1',val:useWatts?`<${Math.round(ftpNum*0.55)}W`:`<${Math.round(fcmax*0.65)} bpm`}]
      };
    }

    return {
      id:`w_s${si}`, day, type:'ef', tag:'Endurance',
      tagColor:'#22c55e', tagBg:'rgba(34,197,94,0.12)',
      title:`${Math.round(km*0.35)} km Z2`,
      detail:`Endurance aérobie. ${cyclingLikesVariety ? 'Varie les parcours pour rester motivé.' : 'Même parcours de référence pour mesurer ta progression.'}`,
      allures:[{dot:'#22c55e',label:'Z2',val:useWatts?`${Math.round(ftpNum*0.56)}-${Math.round(ftpNum*0.75)}W`:`${Math.round(fcmax*0.60)}-${Math.round(fcmax*0.72)} bpm`}]
    };
  });

  const startDate = new Date();
  return Array.from({length:weeks},(_,idx)=>{
    const phase = phaseMap[idx] || 'base';
    // Volume progressif avec décharge toutes les 4 semaines
    const isDeload = (idx+1) % 4 === 0;
    const km = isDeload ? Math.round(baseKm*(1+idx*0.04)*0.7) : Math.round(baseKm*(1+idx*0.04));
    const wStart = new Date(startDate); wStart.setDate(startDate.getDate()+idx*7);
    const wEnd = new Date(wStart); wEnd.setDate(wStart.getDate()+6);
    const fmt = d => d.toLocaleDateString('fr-FR',{day:'numeric',month:'short'});
    const defaultDays = ['Lundi','Mercredi','Vendredi','Samedi','Mardi','Jeudi','Dimanche'];
    const activeDays = (trainingDays && trainingDays.length >= sessionsPerWeek)
      ? trainingDays.slice(0, sessionsPerWeek)
      : defaultDays.slice(0, sessionsPerWeek);
    const sessions = buildSessions(phase, km, activeDays).map((s,i)=>({...s, id:`w${idx+1}_s${i}`}));
    return {
      week:idx+1, phase, ...phaseInfo[phase],
      dateRange:`${fmt(wStart)} – ${fmt(wEnd)}`,
      sessions, weeklyKm:km, isKey:phase==='peak',
      isDeload,
    };
  });
}

function generatePlanSwimming(profile) {
  const { vma, level, weeks, sessionsPerWeek, trainingDays, raceDistanceKm } = profile;
  const baseM = { beginner:1500, intermediate:2500, advanced:3500, expert:5000 }[level];
  const phaseInfo = {
    base: { label:'Technique', color:'#38bdf8', bg:'rgba(56,189,248,0.12)' },
    build: { label:'Volume', color:'#6366f1', bg:'rgba(99,102,241,0.12)' },
    peak: { label:'Vitesse', color:'#FF0040', bg:'rgba(255,0,64,0.12)' },
    taper: { label:'Affûtage', color:'#a78bfa', bg:'rgba(167,139,250,0.12)' },
  };
  const phaseMap = weeks<=4 ? Array(weeks).fill(0).map((_,i)=>i<weeks-1?'base':'taper') : ['base','base','build','build','peak','taper'].slice(0,weeks);
  const startDate = new Date();
  return Array.from({length:weeks},(_,idx)=>{
    const phase = phaseMap[idx] || 'base';
    const m = Math.round(baseM*(1+idx*0.05));
    const wStart = new Date(startDate); wStart.setDate(startDate.getDate()+idx*7);
    const wEnd = new Date(wStart); wEnd.setDate(wStart.getDate()+6);
    const fmt = d => d.toLocaleDateString('fr-FR',{day:'numeric',month:'short'});
    const days = trainingDays.slice(0,sessionsPerWeek);
    const sessions = days.map((day,si) => {
      if (si===0) return { id:`w${idx+1}_s${si}`, day, type:'frac', tag:'Séries 🏊', tagColor:'#38bdf8', tagBg:'rgba(56,189,248,0.12)', title:`10 × 100m`, detail:'Échauffement 400m. 10 × 100m avec 20s récup. Retour calme 200m.', allures:[{dot:'#38bdf8',label:'Effort',val:`85-90% FCmax`},{dot:'#22c55e',label:'Récup',val:`20 sec`}] };
      return { id:`w${idx+1}_s${si}`, day, type:'ef', tag:'Endurance 🏊', tagColor:'#6366f1', tagBg:'rgba(99,102,241,0.12)', title:`${m}m continu`, detail:'Nage continue à allure confortable. Focus technique et respiration.', allures:[{dot:'#6366f1',label:'Allure',val:`70-75% FCmax`}] };
    });
    return { week:idx+1, phase, ...phaseInfo[phase], dateRange:`${fmt(wStart)} – ${fmt(wEnd)}`, sessions, weeklyKm:Math.round(m/100)/10, isKey:phase==='peak' };
  });
}

function generatePlanTriathlon(profile) {
  const { vma, level, weeks, sessionsPerWeek, trainingDays, raceDistanceKm } = profile;
  const phaseInfo = {
    base: { label:'Base', color:'#22c55e', bg:'rgba(34,197,94,0.12)' },
    build: { label:'Build', color:'#f59e0b', bg:'rgba(245,158,11,0.12)' },
    peak: { label:'Peak', color:'#FF0040', bg:'rgba(255,0,64,0.12)' },
    taper: { label:'Taper', color:'#a78bfa', bg:'rgba(167,139,250,0.12)' },
  };
  const phaseMap = weeks<=4 ? Array(weeks).fill(0).map((_,i)=>i<weeks-1?'base':'taper') : ['base','base','build','build','peak','taper'].slice(0,weeks);
  const startDate = new Date();
  const triSessions = ['Natation','Vélo','Course','🔄 Brique vélo+course'];
  return Array.from({length:weeks},(_,idx)=>{
    const phase = phaseMap[idx] || 'base';
    const wStart = new Date(startDate); wStart.setDate(startDate.getDate()+idx*7);
    const wEnd = new Date(wStart); wEnd.setDate(wStart.getDate()+6);
    const fmt = d => d.toLocaleDateString('fr-FR',{day:'numeric',month:'short'});
    const days = trainingDays.slice(0,sessionsPerWeek);
    const sessions = days.map((day,si) => {
      const sport = triSessions[si % triSessions.length];
      const isBrique = sport.includes('Brique');
      return { id:`w${idx+1}_s${si}`, day, type:isBrique?'key':'ef', tag:sport, tagColor:isBrique?'#FF0040':'#22c55e', tagBg:isBrique?'rgba(255,0,64,0.12)':'rgba(34,197,94,0.12)', title:isBrique?'40km vélo + 5km course':'Entraînement spécifique', detail:isBrique?'Enchaînement clé. Transition rapide. Pace modéré sur la course.':'Séance technique sur ta discipline.', allures:[{dot:'#22c55e',label:'Intensité',val:'Z2-Z3'}] };
    });
    return { week:idx+1, phase, ...phaseInfo[phase], dateRange:`${fmt(wStart)} – ${fmt(wEnd)}`, sessions, weeklyKm:0, isKey:phase==='peak' };
  });
}

function generatePlan(profile) {
  const discipline = profile.discipline || 'running';
  if (discipline === 'cycling') return generatePlanCycling(profile);
  if (discipline === 'swimming') return generatePlanSwimming(profile);
  if (discipline === 'triathlon') return generatePlanTriathlon(profile);
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
const lbl = {fontSize:11,fontWeight:700,color:'var(--text-muted)',display:'block',marginBottom:10,textTransform:'uppercase',letterSpacing:'0.08em',fontFamily:'DM Mono, monospace'};
const inp = () => ({background:'var(--bg-card)',border:'1.5px solid var(--border)',color:'var(--text-primary)',borderRadius:16,padding:'14px 16px',width:'100%',fontSize:15,fontFamily:'Syne, sans-serif',outline:'none',boxSizing:'border-box',transition:'border-color 0.2s'});
const tog = (a) => ({background:a?'#FF0040':'var(--bg-card)',border:`1.5px solid ${a?'#FF0040':'var(--border)'}`,color:a?'#fff':'var(--text-primary)',borderRadius:14,padding:'13px 12px',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'Syne, sans-serif',transition:'all 0.15s',outline:'none'});

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
  const [form, setForm] = useState(() => {
    try {
      if (typeof window === 'undefined') return { name:'', discipline:'running', type:'trail', level:'intermediate', vmaMode:'direct', vma:'14', raceDistKm:'10', raceTimeMins:'', raceDistanceKm:'15', elevationM:'150', sessionsPerWeek:2, trainingDays:[], weeks:8, raceName:'', raceDate:'', cyclingBackground:'intermediate', cyclingInjuries:'none', cyclingWeeklyHours:8, cyclingHasPower:false, cyclingHasHR:true, cyclingProfile:'rouleur', cyclingStrongPoint:'endurance', cyclingWeakPoint:'climbs', cyclingMaterial:'road', cyclingTrainNight:false, cyclingSolo:true, cyclingLikesVariety:true, cyclingFCmax:'185', cyclingSleep:'good', cyclingStress:'medium', swimLevel:'intermediate', swimStrokes:'crawl', swimFloatability:'normal', swimHasTurns:false, swimBreathing:'one_side', swimCSS:'2:00', swimTime100:'2:00', swimTime400:'8:00', swimSwolf:'45', swimKick:'2beat', swimGoal:'pool', swimOpenWater:false, swimPool:'25m', swimMaterial:'basic', swimShoulderPain:false, swimPPG:false, swimMobility:'medium', swimWeeklyHours:4, swimSessions:3, triFormat:'olympic', triSwimLevel:'intermediate', triCyclingLevel:'intermediate', triRunLevel:'intermediate', triDominant:'cycling', triWeakDiscipline:'swimming', triHasCombinaiison:false, triHasTTBike:false, triTransition:'slow', triWeeklyHours:10, triSessions:5, triFCmax:'185', triSwimTime:'30', triCyclingFTP:'200', triRunVMA:'12', triFormat:'olympic', triSwimLevel:'intermediate', triCyclingLevel:'intermediate', triRunLevel:'intermediate', triDominant:'cycling', triWeakDiscipline:'swimming', triHasCombinaiison:false, triHasTTBike:false, triTransition:'slow', triWeeklyHours:10, triSessions:5, triFCmax:'185', triSwimTime:'30', triCyclingFTP:'200', triRunVMA:'12' };
      const athlete = JSON.parse(localStorage.getItem('strava_athlete') || '{}');
      const user = JSON.parse(localStorage.getItem('pp_user') || '{}');
      const firstName = athlete.name?.split(' ')[0] || user.name?.split(' ')[0] || '';
      return { name:firstName, discipline:'running', type:'trail', level:'intermediate', vmaMode:'direct', vma:'14', raceDistKm:'10', raceTimeMins:'', raceDistanceKm:'15', elevationM:'150', sessionsPerWeek:2, trainingDays:[], weeks:8, raceName:'', raceDate:'', cyclingBackground:'intermediate', cyclingInjuries:'none', cyclingWeeklyHours:8, cyclingHasPower:false, cyclingHasHR:true, cyclingProfile:'rouleur', cyclingStrongPoint:'endurance', cyclingWeakPoint:'climbs', cyclingMaterial:'road', cyclingTrainNight:false, cyclingSolo:true, cyclingLikesVariety:true, cyclingFCmax:'185', cyclingSleep:'good', cyclingStress:'medium', swimLevel:'intermediate', swimStrokes:'crawl', swimFloatability:'normal', swimHasTurns:false, swimBreathing:'one_side', swimCSS:'2:00', swimTime100:'2:00', swimTime400:'8:00', swimSwolf:'45', swimKick:'2beat', swimGoal:'pool', swimOpenWater:false, swimPool:'25m', swimMaterial:'basic', swimShoulderPain:false, swimPPG:false, swimMobility:'medium', swimWeeklyHours:4, swimSessions:3, triFormat:'olympic', triSwimLevel:'intermediate', triCyclingLevel:'intermediate', triRunLevel:'intermediate', triDominant:'cycling', triWeakDiscipline:'swimming', triHasCombinaiison:false, triHasTTBike:false, triTransition:'slow', triWeeklyHours:10, triSessions:5, triFCmax:'185', triSwimTime:'30', triCyclingFTP:'200', triRunVMA:'12', triFormat:'olympic', triSwimLevel:'intermediate', triCyclingLevel:'intermediate', triRunLevel:'intermediate', triDominant:'cycling', triWeakDiscipline:'swimming', triHasCombinaiison:false, triHasTTBike:false, triTransition:'slow', triWeeklyHours:10, triSessions:5, triFCmax:'185', triSwimTime:'30', triCyclingFTP:'200', triRunVMA:'12', swimLevel:'intermediate', swimStrokes:'crawl', swimFloatability:'normal', swimHasTurns:false, swimBreathing:'one_side', swimCSS:'2:00', swimTime100:'2:00', swimTime400:'8:00', swimSwolf:'45', swimKick:'2beat', swimGoal:'pool', swimOpenWater:false, swimPool:'25m', swimMaterial:'basic', swimShoulderPain:false, swimPPG:false, swimMobility:'medium', swimWeeklyHours:4, swimSessions:3, triFormat:'olympic', triSwimLevel:'intermediate', triCyclingLevel:'intermediate', triRunLevel:'intermediate', triDominant:'cycling', triWeakDiscipline:'swimming', triHasCombinaiison:false, triHasTTBike:false, triTransition:'slow', triWeeklyHours:10, triSessions:5, triFCmax:'185', triSwimTime:'30', triCyclingFTP:'200', triRunVMA:'12', triFormat:'olympic', triSwimLevel:'intermediate', triCyclingLevel:'intermediate', triRunLevel:'intermediate', triDominant:'cycling', triWeakDiscipline:'swimming', triHasCombinaiison:false, triHasTTBike:false, triTransition:'slow', triWeeklyHours:10, triSessions:5, triFCmax:'185', triSwimTime:'30', triCyclingFTP:'200', triRunVMA:'12' };
    } catch { return { name:'', discipline:'running', type:'trail', level:'intermediate', vmaMode:'direct', vma:'14', raceDistKm:'10', raceTimeMins:'', raceDistanceKm:'15', elevationM:'150', sessionsPerWeek:2, trainingDays:[], weeks:8, raceName:'', raceDate:'', cyclingBackground:'intermediate', cyclingInjuries:'none', cyclingWeeklyHours:8, cyclingHasPower:false, cyclingHasHR:true, cyclingProfile:'rouleur', cyclingStrongPoint:'endurance', cyclingWeakPoint:'climbs', cyclingMaterial:'road', cyclingTrainNight:false, cyclingSolo:true, cyclingLikesVariety:true, cyclingFCmax:'185', cyclingSleep:'good', cyclingStress:'medium', swimLevel:'intermediate', swimStrokes:'crawl', swimFloatability:'normal', swimHasTurns:false, swimBreathing:'one_side', swimCSS:'2:00', swimTime100:'2:00', swimTime400:'8:00', swimSwolf:'45', swimKick:'2beat', swimGoal:'pool', swimOpenWater:false, swimPool:'25m', swimMaterial:'basic', swimShoulderPain:false, swimPPG:false, swimMobility:'medium', swimWeeklyHours:4, swimSessions:3, triFormat:'olympic', triSwimLevel:'intermediate', triCyclingLevel:'intermediate', triRunLevel:'intermediate', triDominant:'cycling', triWeakDiscipline:'swimming', triHasCombinaiison:false, triHasTTBike:false, triTransition:'slow', triWeeklyHours:10, triSessions:5, triFCmax:'185', triSwimTime:'30', triCyclingFTP:'200', triRunVMA:'12', triFormat:'olympic', triSwimLevel:'intermediate', triCyclingLevel:'intermediate', triRunLevel:'intermediate', triDominant:'cycling', triWeakDiscipline:'swimming', triHasCombinaiison:false, triHasTTBike:false, triTransition:'slow', triWeeklyHours:10, triSessions:5, triFCmax:'185', triSwimTime:'30', triCyclingFTP:'200', triRunVMA:'12', swimLevel:'intermediate', swimStrokes:'crawl', swimFloatability:'normal', swimHasTurns:false, swimBreathing:'one_side', swimCSS:'2:00', swimTime100:'2:00', swimTime400:'8:00', swimSwolf:'45', swimKick:'2beat', swimGoal:'pool', swimOpenWater:false, swimPool:'25m', swimMaterial:'basic', swimShoulderPain:false, swimPPG:false, swimMobility:'medium', swimWeeklyHours:4, swimSessions:3, triFormat:'olympic', triSwimLevel:'intermediate', triCyclingLevel:'intermediate', triRunLevel:'intermediate', triDominant:'cycling', triWeakDiscipline:'swimming', triHasCombinaiison:false, triHasTTBike:false, triTransition:'slow', triWeeklyHours:10, triSessions:5, triFCmax:'185', triSwimTime:'30', triCyclingFTP:'200', triRunVMA:'12', triFormat:'olympic', triSwimLevel:'intermediate', triCyclingLevel:'intermediate', triRunLevel:'intermediate', triDominant:'cycling', triWeakDiscipline:'swimming', triHasCombinaiison:false, triHasTTBike:false, triTransition:'slow', triWeeklyHours:10, triSessions:5, triFCmax:'185', triSwimTime:'30', triCyclingFTP:'200', triRunVMA:'12' }; }
  });
  const upd = (k,v) => setForm(f=>({...f,[k]:v}));
  const computedVma = form.vmaMode==='direct' ? +form.vma : (form.raceTimeMins?estimateVMA(+form.raceDistKm,+form.raceTimeMins):0);

  const toggleDay = (day) => {
    if (form.trainingDays.includes(day)) { upd('trainingDays',form.trainingDays.filter(d=>d!==day)); }
    else if (form.trainingDays.length < form.sessionsPerWeek) { upd('trainingDays',[...form.trainingDays,day]); }
  };
  const isCycling = form.discipline === 'cycling';
  const isSwimming = form.discipline === 'swimming';
  const isTriathlon = form.discipline === 'triathlon';

  const cyclingSteps = [
    { title:'Profil & antécédents', sub:'Regardons d\'abord dans le rétroviseur', ok:true, body:(
      <div style={{display:'flex',flexDirection:'column',gap:16}}>
        <div><label style={lbl}>Ton prénom</label><input style={inp()} placeholder="Alex" value={form.name} onChange={e=>upd('name',e.target.value)}/></div>
        <div><label style={lbl}>Niveau actuel</label><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>{[['beginner','Débutant'],['intermediate','Intermédiaire'],['advanced','Avancé'],['expert','Expert']].map(([v,l])=><button key={v} onClick={()=>upd('cyclingBackground',v)} style={tog(form.cyclingBackground===v)}>{l}</button>)}</div></div>
        <div><label style={lbl}>Blessures chroniques</label><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>{[['none','Aucune'],['knees','Genoux'],['back','Dos/cervicales'],['other','Autres']].map(([v,l])=><button key={v} onClick={()=>upd('cyclingInjuries',v)} style={tog(form.cyclingInjuries===v)}>{l}</button>)}</div></div>
        <div><label style={lbl}>Capteurs disponibles</label><div style={{display:'flex',gap:8}}>{[['cyclingHasPower','Capteur de puissance'],['cyclingHasHR','Fréquence cardiaque']].map(([k,l])=><button key={k} onClick={()=>upd(k,!form[k])} style={{...tog(form[k]),flex:1}}>{l}</button>)}</div></div>
      </div>
    )},
    { title:'Objectifs & profil', sub:'On ne s\'entraîne pas pareil pour tous les objectifs', ok:form.raceName.length>0, body:(
      <div style={{display:'flex',flexDirection:'column',gap:16}}>
        <div><label style={lbl}>Ton profil de cycliste</label><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>{[['grimpeur','Grimpeur'],['rouleur','Rouleur'],['sprinteur','Sprinteur'],['polyvalent','Polyvalent']].map(([v,l])=><button key={v} onClick={()=>upd('cyclingProfile',v)} style={tog(form.cyclingProfile===v)}>{l}</button>)}</div></div>
        <div><label style={lbl}>Point fort</label><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>{[['endurance','Endurance'],['power','Puissance'],['climbs','Ascensions'],['speed','Vitesse']].map(([v,l])=><button key={v} onClick={()=>upd('cyclingStrongPoint',v)} style={tog(form.cyclingStrongPoint===v)}>{l}</button>)}</div></div>
        <div><label style={lbl}>Objectif principal</label><input style={inp()} placeholder="Ex: La Marmotte, Ventoux..." value={form.raceName} onChange={e=>upd('raceName',e.target.value)}/></div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <div><label style={lbl}>Distance (km)</label><input type="number" style={inp()} value={form.raceDistanceKm} onChange={e=>upd('raceDistanceKm',e.target.value)}/></div>
          <div><label style={lbl}>D+ (m)</label><input type="number" style={inp()} value={form.elevationM} onChange={e=>upd('elevationM',e.target.value)}/></div>
        </div>
        <div><label style={lbl}>Date de l'épreuve</label><input type="date" style={inp()} value={form.raceDate} onChange={e=>upd('raceDate',e.target.value)}/></div>
      </div>
    )},
    { title:'Contraintes & logistique', sub:'Un bon plan c\'est un plan tenu', ok:true, body:(
      <div style={{display:'flex',flexDirection:'column',gap:16}}>
        <div><label style={lbl}>Volume hebdo réaliste (heures)</label><div style={{display:'flex',alignItems:'center',gap:12}}><input type="range" min={3} max={20} step={1} value={form.cyclingWeeklyHours} onChange={e=>upd('cyclingWeeklyHours',+e.target.value)} style={{flex:1,accentColor:'#f59e0b'}}/><span style={{fontSize:16,fontWeight:800,color:'#f59e0b',fontFamily:'DM Mono,monospace',minWidth:40}}>{form.cyclingWeeklyHours}h</span></div></div>
        <div><label style={lbl}>Nombre de séances/semaine</label><div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>{[3,4,5,6].map(v=><button key={v} onClick={()=>upd('sessionsPerWeek',v)} style={tog(form.sessionsPerWeek===v)}>{v}x</button>)}</div></div>
        <div><label style={lbl}>Matériel disponible</label><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>{[['road','Vélo de route'],['gravel','Gravel'],['home_trainer','Home-trainer'],['mountain','VTT']].map(([v,l])=><button key={v} onClick={()=>upd('cyclingMaterial',v)} style={tog(form.cyclingMaterial===v)}>{l}</button>)}</div></div>
        <div><label style={lbl}>Durée du programme (semaines)</label><div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>{[8,12,16,20].map(v=><button key={v} onClick={()=>upd('weeks',v)} style={tog(form.weeks===v)}>{v}sem</button>)}</div></div>
      </div>
    )},
    { title:'Physiologie', sub:'Définissons ton moteur actuel', ok:true, body:(
      <div style={{display:'flex',flexDirection:'column',gap:16}}>
        <div><label style={lbl}>{form.cyclingHasPower?'FTP actuelle (watts)':'FCmax estimée (bpm)'}</label><input type="number" style={inp()} value={form.cyclingHasPower?form.vma:form.cyclingFCmax} onChange={e=>form.cyclingHasPower?upd('vma',e.target.value):upd('cyclingFCmax',e.target.value)} placeholder={form.cyclingHasPower?'Ex: 220':'Ex: 185'}/><p style={{fontSize:11,color:'var(--text-muted)',marginTop:6}}>{form.cyclingHasPower?'FTP moyenne loisir : 150–250W':'FCmax = 220 - ton âge (approximation)'}</p></div>
        <div><label style={lbl}>Qualité du sommeil</label><div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>{[['good','Bon'],['medium','Moyen'],['bad','Mauvais']].map(([v,l])=><button key={v} onClick={()=>upd('cyclingSleep',v)} style={tog(form.cyclingSleep===v)}>{l}</button>)}</div></div>
        <div><label style={lbl}>Niveau de stress</label><div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>{[['low','Faible'],['medium','Modéré'],['high','Élevé']].map(([v,l])=><button key={v} onClick={()=>upd('cyclingStress',v)} style={tog(form.cyclingStress===v)}>{l}</button>)}</div></div>
      </div>
    )},
    { title:'Psychologie & préférences', sub:'Pour un plan que tu aimeras suivre', ok:true, body:(
      <div style={{display:'flex',flexDirection:'column',gap:16}}>
        <div><label style={lbl}>Tu préfères t'entraîner</label><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>{[['true','Seul'],['false','En groupe']].map(([v,l])=><button key={v} onClick={()=>upd('cyclingSolo',v==='true')} style={tog(String(form.cyclingSolo)===v)}>{l}</button>)}</div></div>
        <div><label style={lbl}>Tu aimes la variété ?</label><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>{[['true','Oui, beaucoup'],['false','Non, routine']].map(([v,l])=><button key={v} onClick={()=>upd('cyclingLikesVariety',v==='true')} style={tog(String(form.cyclingLikesVariety)===v)}>{l}</button>)}</div></div>
        <div><label style={lbl}>Tu peux t'entraîner tôt/tard ?</label><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>{[['true','Oui'],['false','Non']].map(([v,l])=><button key={v} onClick={()=>upd('cyclingTrainNight',v==='true')} style={tog(String(form.cyclingTrainNight)===v)}>{l}</button>)}</div></div>
        <div><label style={lbl}>Ce que tu détestes à l\'entraînement</label><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>{[['intervals','Les intervalles'],['long','Les longues sorties'],['climbing','Grimper'],['speed','Le sprint']].map(([v,l])=><button key={v} onClick={()=>upd('cyclingWeakPoint',v)} style={tog(form.cyclingWeakPoint===v)}>{l}</button>)}</div></div>
      </div>
    )},
  ];

  const swimmingSteps = [
    { title:'Profil technique', sub:'En natation, la glisse avant le moteur', ok:true, body:(
      <div style={{display:'flex',flexDirection:'column',gap:16}}>
        <div><label style={lbl}>Ton prénom</label><input style={inp()} placeholder="Alex" value={form.name} onChange={e=>upd('name',e.target.value)}/></div>
        <div><label style={lbl}>Niveau aquatique</label><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>{[['beginner','Débutant'],['intermediate','Intermédiaire'],['advanced','Avancé'],['expert','Expert']].map(([v,l])=><button key={v} onClick={()=>upd('swimLevel',v)} style={tog(form.swimLevel===v)}>{l}</button>)}</div></div>
        <div><label style={lbl}>Nages maîtrisées</label><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>{[['crawl','Crawl uniquement'],['4nages','4 nages'],['crawl_dos','Crawl + Dos'],['crawl_brasse','Crawl + Brasse']].map(([v,l])=><button key={v} onClick={()=>upd('swimStrokes',v)} style={tog(form.swimStrokes===v)}>{l}</button>)}</div></div>
        <div><label style={lbl}>Respiration</label><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>{[['one_side','Un seul côté'],['bilateral','Bilatérale'],['every2','Tous les 2 cycles'],['every3','Tous les 3 cycles']].map(([v,l])=><button key={v} onClick={()=>upd('swimBreathing',v)} style={tog(form.swimBreathing===v)}>{l}</button>)}</div></div>
        <div><label style={lbl}>Flottabilité naturelle</label><div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>{[['good','Bonne'],['normal','Normale'],['poor','Jambes qui coulent']].map(([v,l])=><button key={v} onClick={()=>upd('swimFloatability',v)} style={tog(form.swimFloatability===v)}>{l}</button>)}</div></div>
        <div style={{display:'flex',gap:8}}><button onClick={()=>upd('swimHasTurns',!form.swimHasTurns)} style={{...tog(form.swimHasTurns),flex:1}}>Culbutes maîtrisées</button><button onClick={()=>upd('swimPPG',!form.swimPPG)} style={{...tog(form.swimPPG),flex:1}}>PPG / renforcement</button></div>
      </div>
    )},
    { title:'Chronos & efficience', sub:'Le CSS est ton FTP de nageur', ok:true, body:(
      <div style={{display:'flex',flexDirection:'column',gap:16}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <div><label style={lbl}>Temps 100m (min:sec)</label><input style={inp()} placeholder="Ex: 1:45" value={form.swimTime100} onChange={e=>upd('swimTime100',e.target.value)}/></div>
          <div><label style={lbl}>Temps 400m (min:sec)</label><input style={inp()} placeholder="Ex: 7:30" value={form.swimTime400} onChange={e=>upd('swimTime400',e.target.value)}/></div>
        </div>
        <div><label style={lbl}>SWOLF (mouvements/longueur)</label><input type="number" style={inp()} placeholder="Ex: 42" value={form.swimSwolf} onChange={e=>upd('swimSwolf',e.target.value)}/><p style={{fontSize:11,color:'var(--text-muted)',marginTop:4}}>Compter tes bras + tes battements de jambes sur 25m</p></div>
        <div><label style={lbl}>Battement de jambes</label><div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>{[['2beat','2 temps'],['4beat','4 temps'],['6beat','6 temps']].map(([v,l])=><button key={v} onClick={()=>upd('swimKick',v)} style={tog(form.swimKick===v)}>{l}</button>)}</div></div>
      </div>
    )},
    { title:'Objectif & milieu', sub:'Bassin ou eau libre — pas le même programme', ok:form.raceName.length>0, body:(
      <div style={{display:'flex',flexDirection:'column',gap:16}}>
        <div><label style={lbl}>Objectif principal</label><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>{[['pool_speed','Vitesse bassin'],['open_water','Eau libre'],['triathlon','Triathlon'],['endurance','Endurance']].map(([v,l])=><button key={v} onClick={()=>upd('swimGoal',v)} style={tog(form.swimGoal===v)}>{l}</button>)}</div></div>
        <div><label style={lbl}>Nom de ta compétition</label><input style={inp()} placeholder="Ex: Traversée du lac..." value={form.raceName} onChange={e=>upd('raceName',e.target.value)}/></div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <div><label style={lbl}>Distance (m)</label><input type="number" style={inp()} value={form.raceDistanceKm} onChange={e=>upd('raceDistanceKm',e.target.value)}/></div>
          <div><label style={lbl}>Date</label><input type="date" style={inp()} value={form.raceDate} onChange={e=>upd('raceDate',e.target.value)}/></div>
        </div>
        <div style={{display:'flex',gap:8}}><button onClick={()=>upd('swimOpenWater',!form.swimOpenWater)} style={{...tog(form.swimOpenWater),flex:1}}>Eau libre / mer</button></div>
      </div>
    )},
    { title:'Logistique & accès', sub:'L\'accès aux lignes d\'eau, le vrai défi', ok:true, body:(
      <div style={{display:'flex',flexDirection:'column',gap:16}}>
        <div><label style={lbl}>Bassin disponible</label><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>{[['25m','25m'],['50m','50m'],['open','Eau libre / mer'],['both','Les deux']].map(([v,l])=><button key={v} onClick={()=>upd('swimPool',v)} style={tog(form.swimPool===v)}>{l}</button>)}</div></div>
        <div><label style={lbl}>Matériel disponible</label><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>{[['basic','Basique (lunettes)'],['pullbuoy','Pull-buoy'],['paddles','Palmes + plaquettes'],['full','Matériel complet']].map(([v,l])=><button key={v} onClick={()=>upd('swimMaterial',v)} style={tog(form.swimMaterial===v)}>{l}</button>)}</div></div>
        <div><label style={lbl}>Séances par semaine</label><div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>{[2,3,4,5].map(v=><button key={v} onClick={()=>upd('sessionsPerWeek',v)} style={tog(form.sessionsPerWeek===v)}>{v}x</button>)}</div></div>
        <div><label style={lbl}>Durée du programme</label><div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>{[8,10,12,16].map(v=><button key={v} onClick={()=>upd('weeks',v)} style={tog(form.weeks===v)}>{v}sem</button>)}</div></div>
      </div>
    )},
    { title:'Santé & prévention', sub:'L\'épaule du nageur — la blessure à éviter', ok:true, body:(
      <div style={{display:'flex',flexDirection:'column',gap:16}}>
        <div><label style={lbl}>Douleurs épaules / cervicales</label><div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>{[['none','Aucune'],['mild','Légères'],['chronic','Chroniques']].map(([v,l])=><button key={v} onClick={()=>upd('swimShoulderPain',v)} style={tog(form.swimShoulderPain===v)}>{l}</button>)}</div></div>
        <div><label style={lbl}>Mobilité scapulaire</label><div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>{[['good','Bonne'],['medium','Moyenne'],['poor','Limitée']].map(([v,l])=><button key={v} onClick={()=>upd('swimMobility',v)} style={tog(form.swimMobility===v)}>{l}</button>)}</div></div>
        <div><label style={lbl}>Heures d'entraînement/semaine</label><div style={{display:'flex',alignItems:'center',gap:12}}><input type="range" min={2} max={15} step={0.5} value={form.swimWeeklyHours} onChange={e=>upd('swimWeeklyHours',+e.target.value)} style={{flex:1,accentColor:'#38bdf8'}}/><span style={{fontSize:16,fontWeight:800,color:'#38bdf8',fontFamily:'DM Mono,monospace',minWidth:40}}>{form.swimWeeklyHours}h</span></div></div>
      </div>
    )},
  ];

  const TRI_FORMATS = {
    sprint:   { label:'Sprint',        swim:750,  bike:20,  run:5  },
    olympic:  { label:'Olympique',     swim:1500, bike:40,  run:10 },
    half:     { label:'Half Ironman',  swim:1900, bike:90,  run:21 },
    ironman:  { label:'Ironman',       swim:3800, bike:180, run:42 },
  };

  const triathlonSteps = [
    { title:'Ton profil triathlete', sub:'3 disciplines, 1 seul athlète', ok:form.name.length>0, body:(
      <div style={{display:'flex',flexDirection:'column',gap:16}}>
        <div><label style={lbl}>Ton prénom</label><input style={inp()} placeholder="Alex" value={form.name} onChange={e=>upd('name',e.target.value)}/></div>
        <div><label style={lbl}>Niveau par discipline</label>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {[['triSwimLevel','🏊 Natation'],['triCyclingLevel','🚴 Vélo'],['triRunLevel','🏃 Course']].map(([key,label])=>(
              <div key={key}>
                <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:4,fontFamily:'DM Mono,monospace'}}>{label}</div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6}}>{[['beginner','Déb.'],['intermediate','Inter.'],['advanced','Avancé'],['expert','Expert']].map(([v,l])=><button key={v} onClick={()=>upd(key,v)} style={{...tog(form[key]===v),fontSize:11,padding:'8px 4px'}}>{l}</button>)}</div>
              </div>
            ))}
          </div>
        </div>
        <div><label style={lbl}>Discipline dominante</label><div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>{[['swimming','Natation'],['cycling','Vélo'],['running','Course']].map(([v,l])=><button key={v} onClick={()=>upd('triDominant',v)} style={tog(form.triDominant===v)}>{l}</button>)}</div></div>
        <div><label style={lbl}>Discipline à améliorer</label><div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>{[['swimming','Natation'],['cycling','Vélo'],['running','Course']].map(([v,l])=><button key={v} onClick={()=>upd('triWeakDiscipline',v)} style={tog(form.triWeakDiscipline===v)}>{l}</button>)}</div></div>
      </div>
    )},
    { title:'Format & objectif', sub:'Sprint, Olympique, Half ou Full ?', ok:form.raceName.length>0, body:(
      <div style={{display:'flex',flexDirection:'column',gap:16}}>
        <div><label style={lbl}>Format de triathlon</label>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
            {Object.entries(TRI_FORMATS).map(([v,f])=>(
              <button key={v} onClick={()=>{upd('triFormat',v);upd('raceDistanceKm',f.bike);upd('elevationM',0);}} style={tog(form.triFormat===v)}>
                <div style={{fontWeight:700}}>{f.label}</div>
                <div style={{fontSize:10,opacity:0.7,marginTop:2}}>{f.swim}m · {f.bike}km · {f.run}km</div>
              </button>
            ))}
          </div>
        </div>
        {form.triFormat && (
          <div style={{background:'var(--bg-input)',borderRadius:12,padding:'12px 14px',fontSize:12,color:'var(--text-secondary)'}}>
            🏊 {TRI_FORMATS[form.triFormat].swim}m · 🚴 {TRI_FORMATS[form.triFormat].bike}km · 🏃 {TRI_FORMATS[form.triFormat].run}km
          </div>
        )}
        <div><label style={lbl}>Nom de l'épreuve</label><input style={inp()} placeholder="Ironman Nice, Triathlon de Paris..." value={form.raceName} onChange={e=>upd('raceName',e.target.value)}/></div>
        <div><label style={lbl}>Date de l'épreuve</label><input type="date" style={inp()} value={form.raceDate} onChange={e=>upd('raceDate',e.target.value)}/></div>
      </div>
    )},
    { title:'Performances actuelles', sub:'Tes chrono de référence par discipline', ok:true, body:(
      <div style={{display:'flex',flexDirection:'column',gap:16}}>
        <div><label style={lbl}>Temps natation 400m (ex: 7:30)</label><input style={inp()} placeholder="7:30" value={form.triSwimTime} onChange={e=>upd('triSwimTime',e.target.value)}/></div>
        <div><label style={lbl}>{form.triCyclingLevel==='beginner'?'FCmax estimée (bpm)':'FTP (watts)'}</label><input type="number" style={inp()} placeholder={form.triCyclingLevel==='beginner'?'185':'200'} value={form.triCyclingFTP} onChange={e=>upd('triCyclingFTP',e.target.value)}/></div>
        <div><label style={lbl}>VMA course à pied (km/h)</label><input type="number" style={inp()} placeholder="12" value={form.triRunVMA} onChange={e=>upd('triRunVMA',e.target.value)}/></div>
        <div><label style={lbl}>FCmax (bpm)</label><input type="number" style={inp()} placeholder="185" value={form.triFCmax} onChange={e=>upd('triFCmax',e.target.value)}/></div>
        <div><label style={lbl}>Gestion des transitions</label><div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>{[['fast','Rapide'],['medium','Moyenne'],['slow','À améliorer']].map(([v,l])=><button key={v} onClick={()=>upd('triTransition',v)} style={tog(form.triTransition===v)}>{l}</button>)}</div></div>
      </div>
    )},
    { title:'Logistique & matériel', sub:'Un bon plan s\'adapte à ta réalité', ok:true, body:(
      <div style={{display:'flex',flexDirection:'column',gap:16}}>
        <div><label style={lbl}>Volume hebdo réaliste (heures)</label><div style={{display:'flex',alignItems:'center',gap:12}}><input type="range" min={4} max={20} step={1} value={form.triWeeklyHours} onChange={e=>upd('triWeeklyHours',+e.target.value)} style={{flex:1,accentColor:'#a78bfa'}}/><span style={{fontSize:16,fontWeight:800,color:'#a78bfa',fontFamily:'DM Mono,monospace',minWidth:40}}>{form.triWeeklyHours}h</span></div></div>
        <div><label style={lbl}>Séances par semaine</label><div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>{[4,5,6,8].map(v=><button key={v} onClick={()=>upd('triSessions',v)} style={tog(form.triSessions===v)}>{v}x</button>)}</div></div>
        <div><label style={lbl}>Matériel</label>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            <button onClick={()=>upd('triHasCombinaiison',!form.triHasCombinaiison)} style={{...tog(form.triHasCombinaiison),flex:1}}>Combinaison néoprène</button>
            <button onClick={()=>upd('triHasTTBike',!form.triHasTTBike)} style={{...tog(form.triHasTTBike),flex:1}}>Vélo TT / Triathlon</button>
          </div>
        </div>
        <div><label style={lbl}>Durée du programme</label><div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>{[8,12,16,20].map(v=><button key={v} onClick={()=>upd('weeks',v)} style={tog(form.weeks===v)}>{v}sem</button>)}</div></div>
      </div>
    )},
  ];

  const steps = isCycling ? cyclingSteps : isSwimming ? swimmingSteps : isTriathlon ? triathlonSteps : [
    { title:'Qui es-tu ?', sub:'Ton profil sportif', ok:form.name.length>0, body:(
      <div style={{display:'flex',flexDirection:'column',gap:16}}>
        <div><label style={lbl}>Ton prénom</label><input style={inp()} placeholder="Alex" value={form.name} onChange={e=>upd('name',e.target.value)}/></div>
        <div><label style={lbl}>Discipline</label><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>{[['running','Course'],['cycling','Vélo'],['swimming','Natation'],['triathlon','Triathlon']].map(([v,l])=><button key={v} onClick={()=>upd('discipline',v)} style={tog(form.discipline===v)}>{l}</button>)}</div></div>
        {form.discipline==='running' && <div><label style={lbl}>Type de course</label><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>{[['trail','Trail'],['road','Route']].map(([v,l])=><button key={v} onClick={()=>upd('type',v)} style={tog(form.type===v)}>{l}</button>)}</div></div>}
        <div><label style={lbl}>Niveau</label><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>{[['beginner','Débutant'],['intermediate','Intermédiaire'],['advanced','Avancé'],['expert','Expert']].map(([v,l])=><button key={v} onClick={()=>upd('level',v)} style={tog(form.level===v)}>{l}</button>)}</div></div>
      </div>
    )},
    { title:'Ta condition physique', sub:form.discipline==='swimming'?'On calcule tes allures bassin':form.discipline==='cycling'?'On calcule tes allures vélo':'On calcule tes allures personnalisées', ok:computedVma>0, body:(
      <div style={{display:'flex',flexDirection:'column',gap:16}}>
        <div><label style={lbl}>Comment saisir {form.discipline==='cycling'?'ton FTP':form.discipline==='swimming'?'ton allure':'ta VMA'} ?</label><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>{[['direct',`Je connais ${form.discipline==='cycling'?'mon FTP':'ma VMA'}`],['race','Depuis un chrono récent']].map(([v,l])=><button key={v} onClick={()=>upd('vmaMode',v)} style={tog(form.vmaMode===v)}>{l}</button>)}</div></div>
        {form.vmaMode==='direct' ? (
          <div><label style={lbl}>{form.discipline==='cycling'?'FTP (watts)':form.discipline==='swimming'?'Allure 400m (min)':'VMA (km/h)'}</label><input type="number" style={inp()} min="8" max="500" step={form.discipline==='cycling'?5:0.5} value={form.vma} onChange={e=>upd('vma',e.target.value)}/><p style={{fontSize:11,color:'var(--text-muted)',marginTop:6}}>{form.discipline==='cycling'?'FTP moyen loisir : 150–220W':form.discipline==='swimming'?'Allure 400m typique : 7-12 min':'Moyenne loisir : 12–15 km/h'}</p></div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <div><label style={lbl}>Distance récente</label><select style={inp()} value={form.raceDistKm} onChange={e=>upd('raceDistKm',e.target.value)}>
              {form.discipline==='cycling' && [[20,'20 km'],[40,'40 km'],[80,'80 km'],[100,'100 km'],[160,'Gran Fondo']].map(([v,l])=><option key={v} value={v}>{l}</option>)}
              {form.discipline==='swimming' && [[0.4,'400m'],[0.75,'750m'],[1.5,'1500m'],[3.8,'3800m (ironman)']].map(([v,l])=><option key={v} value={v}>{l}</option>)}
              {form.discipline==='triathlon' && [[51.5,'Sprint (51.5km)'],[113,'Half Ironman'],[226,'Ironman']].map(([v,l])=><option key={v} value={v}>{l}</option>)}
              {(!form.discipline||form.discipline==='running') && [[1,'1 km'],[3,'3 km'],[5,'5 km'],[10,'10 km'],[15,'15 km'],[21.1,'Semi-marathon'],[42.2,'Marathon']].map(([v,l])=><option key={v} value={v}>{l}</option>)}
            </select></div>
            <div><label style={lbl}>Chrono (en minutes)</label><input type="number" style={inp()} placeholder="ex: 55" value={form.raceTimeMins} onChange={e=>upd('raceTimeMins',e.target.value)}/></div>
            {computedVma>0 && <div style={{background:'rgba(255,0,64,0.08)',border:'1px solid rgba(255,0,64,0.2)',borderRadius:12,padding:'10px 14px',fontSize:12,color:'var(--text-secondary)'}}>VMA estimée : <span style={{color:'#FF0040',fontWeight:700,fontFamily:'monospace'}}>{computedVma.toFixed(1)} km/h</span></div>}
          </div>
        )}
      </div>
    )},
    { title:'Ton objectif', sub:form.discipline==='triathlon'?'Dis-nous tout sur ton triathlon':form.discipline==='cycling'?'Ta course ou sortie cible':form.discipline==='swimming'?'Ta compétition ou objectif natation':'Dis-nous tout sur ton objectif', ok:form.raceName.length>0, body:(
      <div style={{display:'flex',flexDirection:'column',gap:16}}>
        <div><label style={lbl}>Nom de la course</label><input style={inp()} placeholder="Trail de la Fraise" value={form.raceName} onChange={e=>upd('raceName',e.target.value)}/></div>
        <div><label style={lbl}>Date de la course</label><input type="date" style={inp()} value={form.raceDate} onChange={e=>upd('raceDate',e.target.value)}/></div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <div><label style={lbl}>{form.discipline==='swimming'?'Distance (m)':'Distance (km)'}</label><input type="number" style={inp()} min="1" max={form.discipline==='swimming'?50000:1000} step={form.discipline==='swimming'?50:0.5} value={form.raceDistanceKm} onChange={e=>upd('raceDistanceKm',e.target.value)}/></div>
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
    onComplete({...form,vma:finalVma,weeks:+form.weeks,raceDistanceKm:+form.raceDistanceKm,elevationM:+form.elevationM,discipline:form.discipline||'running'});
  };
  return (
    <>{(() => {
      const disciplineTheme = {
        running: { accent:'#FF0040', glow:'rgba(255,0,64,0.12)', decor:(
          <img src="/courir.svg" alt="" style={{position:'fixed',right:0,bottom:60,width:260,height:260,objectFit:'contain',opacity:0.12,pointerEvents:'none',mixBlendMode:'screen'}}/>
        )},
        cycling: { accent:'#f59e0b', glow:'rgba(245,158,11,0.12)', decor:(
          <img src="/cyclisme.svg" alt="" style={{position:'fixed',right:0,bottom:60,width:240,height:240,objectFit:'contain',opacity:0.12,pointerEvents:'none',mixBlendMode:'screen'}}/>
        )},
        swimming: { accent:'#38bdf8', glow:'rgba(56,189,248,0.15)', decor:(
          <img src="/nager.svg" alt="" style={{position:'fixed',right:0,bottom:60,width:240,height:240,objectFit:'contain',opacity:0.12,pointerEvents:'none',mixBlendMode:'screen'}}/>
        )},
        triathlon: { accent:'#a78bfa', glow:'rgba(167,139,250,0.12)', decor:(
          <img src="/triathlon.svg" alt="" style={{position:'fixed',right:0,bottom:60,width:240,height:240,objectFit:'contain',opacity:0.12,pointerEvents:'none',mixBlendMode:'screen'}}/>
        )},
      };
      const theme = disciplineTheme[form.discipline] || disciplineTheme.running;
      const accentColor = step === 0 ? theme.accent : (disciplineTheme[form.discipline]||disciplineTheme.running).accent;

      return (
    <div style={{minHeight:'100vh',background:'var(--onboarding-bg)',display:'flex',flexDirection:'column',position:'relative',overflow:'hidden'}}>
      {/* Discipline glow */}
      <div style={{position:'fixed',top:-100,right:-100,width:400,height:400,borderRadius:'50%',background:`radial-gradient(circle, ${theme.glow} 0%, transparent 70%)`,pointerEvents:'none',transition:'background 0.5s',zIndex:0}}/>
      {/* Discipline decor */}
      <div style={{position:'fixed',bottom:100,right:0,pointerEvents:'none',zIndex:0}}>{theme.decor}</div>

      {/* Progress bar top */}
      <div style={{height:3,background:'var(--progress-track)',position:'fixed',top:0,left:0,right:0,zIndex:10}}>
        <div style={{height:'100%',width:`${((step+1)/steps.length)*100}%`,background:`linear-gradient(90deg,${theme.accent},${theme.accent}aa)`,transition:'width 0.4s cubic-bezier(0.22,1,0.36,1)'}}/>
      </div>

      <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',padding:'60px 20px 40px'}}>
        <div style={{width:'100%',maxWidth:420}}>

          {/* Header */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:40}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <img src="/logo.svg" alt="" style={{width:28,height:28,objectFit:'contain'}}/>
              <span style={{fontWeight:800,fontSize:16,letterSpacing:'-0.02em',color:'var(--text-primary)',fontFamily:'Syne,sans-serif'}}>PacePro</span>
            </div>
            <span style={{fontSize:11,color:'var(--text-muted)',fontFamily:'DM Mono,monospace'}}>{step+1} / {steps.length}</span>
          </div>

          {/* Step indicators */}
          <div style={{display:'flex',gap:4,marginBottom:32}}>
            {steps.map((_,i)=>(
              <div key={i} style={{flex:1,height:3,borderRadius:99,background:i<=step?theme.accent:'var(--progress-track)',transition:'background 0.3s'}}/>
            ))}
          </div>

          {/* Title */}
          <div style={{marginBottom:28}}>
            <div style={{fontSize:11,fontWeight:700,color:theme.accent,fontFamily:'DM Mono,monospace',textTransform:'uppercase',letterSpacing:'0.15em',marginBottom:10}}>Étape {step+1}</div>
            <h2 style={{fontSize:28,fontWeight:900,letterSpacing:'-0.04em',marginBottom:6,color:'var(--text-primary)',fontFamily:'Syne,sans-serif',lineHeight:1.1}}>{steps[step].title}</h2>
            <p style={{fontSize:13,color:'var(--text-muted)',lineHeight:1.5}}>{steps[step].sub}</p>
          </div>

          {/* Body */}
          <div style={{marginBottom:28}}>{steps[step].body}</div>

          {/* Actions */}
          <div style={{display:'flex',gap:10}}>
            {step>0 && (
              <button onClick={()=>setStep(s=>s-1)} style={{width:48,height:48,borderRadius:14,background:'var(--bg-card)',border:'1px solid var(--border)',color:'var(--text-primary)',cursor:'pointer',fontFamily:'inherit',fontSize:18,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>←</button>
            )}
            <button onClick={step<steps.length-1?()=>setStep(s=>s+1):handleFinish} disabled={!steps[step].ok} style={{flex:1,height:52,background:steps[step].ok?theme.accent:'var(--progress-track)',color:steps[step].ok?'#fff':'var(--text-muted)',border:'none',borderRadius:14,fontSize:15,fontWeight:800,cursor:steps[step].ok?'pointer':'not-allowed',fontFamily:'Syne,sans-serif',letterSpacing:'-0.01em',transition:'all 0.2s',boxShadow:steps[step].ok?`0 4px 20px ${theme.glow}`:'none'}}>
              {step<steps.length-1?'Continuer →':'Générer mon programme'}
            </button>
          </div>
        </div>
      </div>
    </div>
      );
    })()}</>
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
  const [showNutrition, setShowNutrition] = useState(false);
  const discipline = profile.discipline || 'running';
  const isCyclingDash = discipline === 'cycling';
  const isSwimmingDash = discipline === 'swimming';
  const isTriathlonDash = discipline === 'triathlon';

  // Calcul des allures selon discipline
  const paces = (() => {
    if (isCyclingDash) {
      const ftp = parseFloat(profile.vma) || 200;
      const fcmax = parseFloat(profile.cyclingFCmax) || 185;
      const useW = profile.cyclingHasPower;
      return {
        ef: useW ? `${Math.round(ftp*0.56)}-${Math.round(ftp*0.75)}W` : `${Math.round(fcmax*0.60)}-${Math.round(fcmax*0.72)} bpm`,
        tempo: useW ? `${Math.round(ftp*0.76)}-${Math.round(ftp*0.90)}W` : `${Math.round(fcmax*0.72)}-${Math.round(fcmax*0.82)} bpm`,
        threshold: useW ? `${Math.round(ftp*0.91)}-${Math.round(ftp*1.05)}W` : `${Math.round(fcmax*0.82)}-${Math.round(fcmax*0.89)} bpm`,
        vma90: useW ? `${Math.round(ftp*1.06)}-${Math.round(ftp*1.20)}W` : `${Math.round(fcmax*0.90)}-${Math.round(fcmax*0.95)} bpm`,
        recov: useW ? `<${Math.round(ftp*0.55)}W` : `<${Math.round(fcmax*0.60)} bpm`,
        swim: null, bike: null, run: null,
      };
    }
    if (isSwimmingDash) {
      const t100 = profile.swimTime100 || '2:00';
      const [m,s] = t100.split(':').map(Number);
      const secPer100 = (m||2)*60+(s||0);
      const css = secPer100 * 0.95;
      const toSwimPace = (factor) => { const total = Math.round(secPer100*factor); return `${Math.floor(total/60)}:${String(total%60).padStart(2,'0')}/100m`; };
      return {
        ef: toSwimPace(1.10),
        tempo: toSwimPace(1.02),
        threshold: `${Math.floor(css/60)}:${String(Math.round(css%60)).padStart(2,'0')}/100m (CSS)`,
        vma90: toSwimPace(0.92),
        recov: toSwimPace(1.20),
        swim: null, bike: null, run: null,
      };
    }
    if (isTriathlonDash) {
      const vmaRun = parseFloat(profile.triRunVMA) || 12;
      const ftp = parseFloat(profile.triCyclingFTP) || 200;
      const t400 = profile.triSwimTime || '8:00';
      const [tm,ts] = t400.split(':').map(Number);
      const sec400 = (tm||8)*60+(ts||0);
      const css = Math.round(sec400/4*0.95);
      return {
        ef: `${toPace(vmaRun*0.70)}–${toPace(vmaRun*0.75)}`,
        tempo: `${toPace(vmaRun*0.80)}–${toPace(vmaRun*0.85)}`,
        threshold: `${toPace(vmaRun*0.87)}–${toPace(vmaRun*0.92)}`,
        vma90: `${toPace(vmaRun*0.92)}–${toPace(vmaRun*1.00)}`,
        recov: `${toPace(vmaRun*0.60)}–${toPace(vmaRun*0.65)}`,
        swim: `${Math.floor(css/60)}:${String(css%60).padStart(2,'0')}/100m`,
        bike: `${Math.round(ftp*0.65)}-${Math.round(ftp*0.80)}W`,
        run: `${toPace(vmaRun*0.70)}–${toPace(vmaRun*0.75)}/km`,
      };
    }
    return calcPaces(profile.vma);
  })();
  const totalSessions = plan.reduce((a,w)=>a+w.sessions.length,0);
  const doneCount = Object.values(completed).filter(Boolean).length;
  const progress = Math.round((doneCount/totalSessions)*100);
  const week = plan[activeWeek] || plan[0] || {sessions:[], phase:'base', label:'', color:'#FF0040', bg:'', dateRange:'', weeklyKm:0};
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
      {showNutrition && <RaceNutritionStrategy profile={profile} userSettings={JSON.parse(typeof window!=='undefined'?localStorage.getItem('pp_user_settings')||'{}':'{}')} onClose={()=>setShowNutrition(false)}/>}
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
            {(isTriathlonDash ? [
                ['Nage CSS',paces.swim||'—','#38bdf8'],['Vélo Z2',paces.bike||'—','#f59e0b'],['Course EF',paces.run||'—','#22c55e'],['Course Seuil',paces.threshold,'#FF0040']
              ] : isCyclingDash ? [
                ['Z1-Z2',paces.ef,'#22c55e'],['Tempo',paces.tempo,'#f59e0b'],['Seuil',paces.threshold,'#FF0040'],['VO2Max',paces.vma90,'#ef4444'],['Récup',paces.recov,'var(--text-muted)']
              ] : isSwimmingDash ? [
                ['Endurance',paces.ef,'#22c55e'],['CSS',paces.threshold,'#38bdf8'],['Vitesse',paces.vma90,'#FF0040'],['Récup',paces.recov,'var(--text-muted)']
              ] : [
                ['EF',paces.ef,'#22c55e'],['Tempo',paces.tempo,'#f59e0b'],['Seuil',paces.threshold,'#FF0040'],['VMA 90%',paces.vma90,'#ef4444'],['Récup',paces.recov,'var(--text-muted)']
              ]).map(([l,v,col])=>(
              <div key={l} style={{background:'var(--bg-input)',borderRadius:10,padding:'8px 10px',display:'flex',alignItems:'center',gap:8}}>
                <span style={{width:8,height:8,borderRadius:'50%',background:col,flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:9,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.08em'}}>{l}</div>
                  <div style={{fontSize:12,fontFamily:'DM Mono, monospace',fontWeight:700,color:'var(--text-primary)'}}>{v}{!isCyclingDash&&!isSwimmingDash&&!isTriathlonDash?' /km':''}</div>
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
              {(week.sessions || []).map(s => {
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
                <div style={{fontSize:12,color:'var(--text-secondary)',marginBottom:12}}>
                  {profile.raceDistanceKm} km{profile.elevationM>0?` · D+${profile.elevationM}m`:''} · Allure cible : <span style={{color:'var(--text-primary)',fontFamily:'monospace'}}>{paces.ef} /km</span>
                </div>
                <button onClick={()=>setShowNutrition(true)} style={{display:'flex',alignItems:'center',gap:8,background:'rgba(245,158,11,0.1)',border:'1px solid rgba(245,158,11,0.3)',borderRadius:12,padding:'10px 14px',cursor:'pointer',fontFamily:'Syne,sans-serif',width:'100%'}}>
                  <span style={{fontSize:16}}>🥗</span>
                  <div style={{flex:1,textAlign:'left'}}>
                    <div style={{fontSize:12,fontWeight:700,color:'#f59e0b'}}>Stratégie nutritionnelle</div>
                    <div style={{fontSize:10,color:'rgba(245,158,11,0.6)',fontFamily:'DM Mono,monospace'}}>Plan adapté à ta course · IA</div>
                  </div>
                  <span style={{color:'rgba(245,158,11,0.5)',fontSize:14}}>›</span>
                </button>
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
                      <span style={{fontSize:10,fontWeight:700,padding:'3px 8px',borderRadius:99,background:'var(--btn-ghost-bg)',color:'var(--text-muted)',border:'1px solid var(--border)',fontFamily:'monospace'}}>{p.profile.type==='trail'?'Trail':'Route'}</span>
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

        {/* Settings */}
        <button onClick={() => { onNavigate('settings'); onClose(); }} style={{ width:'100%', background:'var(--bg-input)', border:'1px solid var(--border)', borderRadius:16, padding:'14px', fontSize:13, fontWeight:700, color:'var(--text-secondary)', cursor:'pointer', fontFamily:'Syne, sans-serif', marginBottom:10, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
          ⚙️ Paramètres & Profil
        </button>
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
  const [showSplash, setShowSplash] = useState(() => {
    try { return !sessionStorage.getItem('pp_splash_shown'); } catch { return true; }
  });
  const [splashOut, setSplashOut] = useState(false);

  useEffect(() => {
    if (!showSplash) return;
    const t1 = setTimeout(() => setSplashOut(true), 2500);
    const t2 = setTimeout(() => {
      setShowSplash(false);
      try { sessionStorage.setItem('pp_splash_shown', '1'); } catch {}
    }, 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [showSplash]);
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
    ['pp_user','pp_user_id','strava_token','strava_access_token',
     'strava_athlete','strava_expires_at','pp_plans','pp_motivation',
     'pp_water','pp_weight_log'].forEach(k => localStorage.removeItem(k));
    setUser(null);
    setPlans([]);
  };

  if (!user) return <AuthModule onAuth={handleAuth} />;
   // 'running' | 'muscu'
  const [view, setView] = useState('list');
  const [plans, setPlans] = useState([]);
  const [activePlan, setActivePlan] = useState(null);
  useEffect(()=>{
  const recalcWeeklyKm = (plans) => plans.map(p => {
    // Ne pas recalculer les plans IA (vélo, natation, triathlon)
    const discipline = p.profile?.discipline || 'running';
    if (discipline === 'cycling' || discipline === 'swimming' || discipline === 'triathlon') return p;
    return ({
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
  });});
  const init = async () => {
    // Charger toutes les données depuis Supabase
    const [cloud, allData] = await Promise.all([loadPlans(), loadAllUserData()]);
    if (cloud && cloud.length > 0) {
      const recalculated = recalcWeeklyKm(cloud);
      setPlans(recalculated);
      try { localStorage.setItem('pp_plans', JSON.stringify(recalculated)); } catch {}
    } else {
      try { const s = localStorage.getItem('pp_plans'); if(s) setPlans(recalcWeeklyKm(JSON.parse(s))); } catch {}
    }
    if (allData) {
      const keys = ['pp_workouts_pro','pp_weight_log','pp_water','pp_user_settings','pp_nutrition_profile'];
      keys.forEach(key => {
        if (allData[key] !== undefined) {
          try { localStorage.setItem(key, JSON.stringify(allData[key])); } catch {}
          if (key === 'pp_workouts_pro') setWorkouts(allData[key]);
        }
      });
    }
  };
  init();
},[]);
  const savePlans = (p) => {
    setPlans(p);
    try { localStorage.setItem('pp_plans', JSON.stringify(p)); } catch {}
    syncPlans(p);
  };

  // Fonction de sync universelle
  const syncKey = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
    syncData(key, value);
  };
  const [workouts, setWorkouts] = useState(() => { try { const s = localStorage.getItem('pp_workouts_pro'); return s ? JSON.parse(s) : []; } catch { return []; } });
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [generatingDiscipline, setGeneratingDiscipline] = useState('vélo');

  const handleOnboarding = async (profile) => {
    if (profile.discipline === 'cycling' || profile.discipline === 'swimming' || profile.discipline === 'triathlon') {
      const disciplineLabels = {'cycling':'vélo','swimming':'natation','triathlon':'triathlon'};
      setGeneratingDiscipline(disciplineLabels[profile.discipline] || 'sport');
      setGeneratingPlan(true);
      const isCycling = profile.discipline === 'cycling';
      try {
        const aiWeeks = Math.min(profile.weeks || 8, profile.discipline === 'triathlon' ? 4 : 6); // Max tokens
        const raceKm = parseFloat(profile.raceDistanceKm) || 100;
        const weeklyHours = profile.cyclingWeeklyHours || 8;
        const avgSpeed = profile.cyclingBackground === 'beginner' ? 22 : profile.cyclingBackground === 'intermediate' ? 27 : profile.cyclingBackground === 'advanced' ? 32 : 36;
        const maxWeeklyKm = Math.round(weeklyHours * avgSpeed * 0.8);
        const longRideTarget = Math.round(raceKm * 0.85);
        const prompt = isCycling ? `Tu es un coach cycliste expert. Génère un plan d'entraînement cycliste en JSON.

RÈGLES IMPORTANTES :
- L'objectif est ${raceKm}km. La sortie longue finale doit atteindre ${longRideTarget}km.
- Volume hebdo max : ${maxWeeklyKm}km/semaine (${weeklyHours}h × ${avgSpeed}km/h moyen).
- Progression linéaire : semaine 1 = ${Math.round(maxWeeklyKm*0.5)}km → semaine ${aiWeeks} = ${maxWeeklyKm}km.
- Décharge toutes les 4 semaines : réduire le volume de 30%.
- La sortie longue = 60-85% du volume hebdo selon la phase.

Profil :
- Niveau : ${profile.cyclingBackground} | Profil : ${profile.cyclingProfile}
- FTP : ${profile.vma}W | FCmax : ${profile.cyclingFCmax} bpm | Puissancemètre : ${profile.cyclingHasPower ? 'oui' : 'non'}
- Blessures : ${profile.cyclingInjuries} | Sommeil : ${profile.cyclingSleep} | Stress : ${profile.cyclingStress}
- Matériel : ${profile.cyclingMaterial} | Préfère : ${profile.cyclingSolo ? 'solo' : 'groupe'}
- Déteste : ${profile.cyclingWeakPoint} | Point fort : ${profile.cyclingStrongPoint}
- Durée : ${aiWeeks} semaines | ${profile.sessionsPerWeek} séances/sem

Génère exactement ${aiWeeks} semaines, ${profile.sessionsPerWeek} séances max par semaine.
Jours : Lundi, Mercredi, Vendredi, Samedi.
Descriptions concises (max 100 chars).
Adapte intensité selon blessures/stress.

Réponds UNIQUEMENT en JSON valide sans markdown :
[{"week":1,"phase":"base","label":"Endurance de base","color":"#22c55e","bg":"rgba(34,197,94,0.12)","dateRange":"","weeklyKm":80,"isKey":false,"isDeload":false,"sessions":[{"id":"w1_s0","day":"Lundi","type":"ef","tag":"Endurance","tagColor":"#22c55e","tagBg":"rgba(34,197,94,0.12)","title":"80 km Z2","detail":"...","allures":[{"dot":"#22c55e","label":"Z2","val":"150-180W"}]}]}]`
        : profile.discipline === 'triathlon' ? `Tu es un coach triathlon expert. Génère un plan d'entraînement triathlon complet en JSON.

Format : ${profile.triFormat} — Nage ${{'sprint':750,'olympic':1500,'half':1900,'ironman':3800}[profile.triFormat]}m · Vélo ${{'sprint':20,'olympic':40,'half':90,'ironman':180}[profile.triFormat]}km · Course ${{'sprint':5,'olympic':10,'half':21,'ironman':42}[profile.triFormat]}km
Épreuve : ${profile.raceName} le ${profile.raceDate}
Niveaux : Natation ${profile.triSwimLevel} | Vélo ${profile.triCyclingLevel} | Course ${profile.triRunLevel}
Dominant : ${profile.triDominant} | À améliorer : ${profile.triWeakDiscipline}
Chrono natation 400m : ${profile.triSwimTime} | FTP vélo : ${profile.triCyclingFTP}W | VMA course : ${profile.triRunVMA} km/h
FCmax : ${profile.triFCmax} bpm | Transitions : ${profile.triTransition}
Volume hebdo : ${profile.triWeeklyHours}h | ${profile.triSessions} séances/sem
Combinaison : ${profile.triHasCombinaiison ? 'oui' : 'non'} | Vélo TT : ${profile.triHasTTBike ? 'oui' : 'non'}
Durée : ${aiWeeks} semaines

RÈGLES :
- Alterner les 3 disciplines + séances BRIQUE (vélo→course enchaînés) chaque semaine
- Mettre l'accent sur ${profile.triWeakDiscipline} (30% du volume)
- Séances brique = tag "Brique" tagColor "#FF0040"
- Natation tag "#38bdf8", Vélo "#f59e0b", Course "#22c55e"
- Transitions dédiées si ${profile.triTransition} === 'slow'
- Génère ${aiWeeks} semaines, ${profile.triSessions} séances max, descriptions concises

Réponds UNIQUEMENT en JSON valide sans markdown :
[{"week":1,"phase":"base","label":"Base triathlon","color":"#a78bfa","bg":"rgba(167,139,250,0.12)","dateRange":"","weeklyKm":0,"isKey":false,"isDeload":false,"sessions":[{"id":"w1_s0","day":"Lundi","type":"swim","tag":"Natation","tagColor":"#38bdf8","tagBg":"rgba(56,189,248,0.12)","title":"1500m technique","detail":"Travail technique crawl, respiration bilatérale","allures":[{"dot":"#38bdf8","label":"CSS","val":"1:55/100m"}]}]}`
        : `Tu es un coach natation expert. Génère un plan d'entraînement natation complet en JSON.

Profil du nageur :
- Niveau : ${profile.swimLevel}
- Nages : ${profile.swimStrokes}
- Respiration : ${profile.swimBreathing}
- Flottabilité : ${profile.swimFloatability}
- Culbutes : ${profile.swimHasTurns ? 'oui' : 'non'}
- Temps 100m : ${profile.swimTime100} / Temps 400m : ${profile.swimTime400}
- SWOLF : ${profile.swimSwolf} / Battement : ${profile.swimKick}
- Objectif : ${profile.swimGoal} — ${profile.raceName} ${profile.raceDistanceKm}m le ${profile.raceDate}
- Eau libre : ${profile.swimOpenWater ? 'oui' : 'non'}
- Bassin : ${profile.swimPool}
- Matériel : ${profile.swimMaterial}
- Douleurs épaules : ${profile.swimShoulderPain}
- Mobilité scapulaire : ${profile.swimMobility}
- PPG : ${profile.swimPPG ? 'oui' : 'non'}
- Séances/semaine : ${profile.sessionsPerWeek}
- Heures/semaine : ${profile.swimWeeklyHours}h
- Durée plan : ${aiWeeks} semaines

Génère exactement ${aiWeeks} semaines. Chaque semaine a ${profile.sessionsPerWeek} séances maximum (3 max).
Les jours : Lundi, Mercredi, Vendredi.
Sois concis dans les descriptions (max 80 chars par detail).
Utilise des couleurs bleues (#38bdf8) pour la natation.
Si douleurs épaules chroniques : réduire le volume et éviter les nages trop sollicitantes.
Intègre du travail technique (pull-buoy, plaquettes) si matériel disponible.
Si eau libre : ajouter des séances spécifiques orientation et drafting.

Réponds UNIQUEMENT en JSON valide sans markdown :
[{"week":1,"phase":"base","label":"Technique & endurance","color":"#38bdf8","bg":"rgba(56,189,248,0.12)","dateRange":"","weeklyKm":3,"isKey":false,"isDeload":false,"sessions":[{"id":"w1_s0","day":"Lundi","type":"ef","tag":"Technique","tagColor":"#38bdf8","tagBg":"rgba(56,189,248,0.12)","title":"2000m technique","detail":"...","allures":[{"dot":"#38bdf8","label":"CSS","val":"1:55/100m"}]}]}]`;

        const res = await fetch('/api/gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt })
        });
        const d = await res.json();
        let text = (d.text || '').replace(/\`\`\`json|\`\`\`/g, '').trim();
        // Extraire uniquement le JSON entre [ et ]
        const jsonStart = text.indexOf('[');
        const jsonEnd = text.lastIndexOf(']');
        if (jsonStart >= 0 && jsonEnd > jsonStart) {
          text = text.slice(jsonStart, jsonEnd + 1);
        }
        console.log('Parsing JSON, length:', text.length);
        const aiPlan = JSON.parse(text);
        console.log('AI Plan week count:', aiPlan.length);
        console.log('Week 1 sessions:', aiPlan[0]?.sessions?.length, JSON.stringify(aiPlan[0]?.sessions?.[0]).slice(0,200));
        // Ajouter dateRange si manquant
        const startDate = new Date();
        const enrichedPlan = aiPlan.map((week, idx) => {
          const wStart = new Date(startDate);
          wStart.setDate(startDate.getDate() + idx * 7);
          const wEnd = new Date(wStart);
          wEnd.setDate(wStart.getDate() + 6);
          const fmt = dt => dt.toLocaleDateString('fr-FR', {day:'numeric', month:'short'});
          return {
            ...week,
            dateRange: week.dateRange || `${fmt(wStart)} – ${fmt(wEnd)}`,
            sessions: (week.sessions || []).map((s, si) => ({
              ...s,
              id: s.id || `w${idx+1}_s${si}`,
            }))
          };
        });
        const newPlans = [...plans, { profile, plan: enrichedPlan }];
        console.log('Saving plan, weeks:', enrichedPlan.length, 'first week sessions:', enrichedPlan[0]?.sessions?.length);
        savePlans(newPlans);
        setActivePlan(newPlans.length - 1);
        setView('dashboard');
      } catch(e) {
        console.error('AI plan error:', e);
        // Fallback — plan minimaliste de 4 semaines
        const fallbackPlan = Array.from({length:4},(_,idx)=>({
          week:idx+1, phase:'base', label:'Base', color:'#6366f1', bg:'rgba(99,102,241,0.12)',
          dateRange:'', weeklyKm:0, isKey:false, isDeload:false,
          sessions:[
            {id:`w${idx+1}_s0`,day:'Lundi',type:'ef',tag:'Séance 1',tagColor:'#6366f1',tagBg:'rgba(99,102,241,0.12)',title:'Entraînement',detail:'Séance à adapter selon ta discipline.',allures:[{dot:'#6366f1',label:'Intensité',val:'Modérée'}]},
            {id:`w${idx+1}_s1`,day:'Mercredi',type:'ef',tag:'Séance 2',tagColor:'#22c55e',tagBg:'rgba(34,197,94,0.12)',title:'Endurance',detail:'Sortie longue à allure confortable.',allures:[{dot:'#22c55e',label:'Allure',val:'Facile'}]},
            {id:`w${idx+1}_s2`,day:'Samedi',type:'long',tag:'Sortie longue',tagColor:'#f59e0b',tagBg:'rgba(245,158,11,0.12)',title:'Sortie clé',detail:'Sortie principale de la semaine.',allures:[{dot:'#f59e0b',label:'Allure',val:'Modérée'}]},
          ]
        }));
        const newPlans = [...plans, { profile, plan: fallbackPlan }];
        savePlans(newPlans);
        setActivePlan(newPlans.length - 1);
        setView('dashboard');
      }
      setGeneratingPlan(false);
      return;
    }
    if (profile.discipline === 'cycling_old') {
      const plan = generatePlan(profile);
      const newPlans = [...plans, { profile, plan }];
      savePlans(newPlans);
      setActivePlan(newPlans.length - 1);
      setView('dashboard');
    }
  };
  const handleDelete = (idx) => { savePlans(plans.filter((_,i)=>i!==idx)); setView('list'); };

  // Bottom nav
  const BottomNav = () => (
    <div className='bottom-nav' style={{position:'fixed',bottom:0,left:0,right:0,zIndex:100,background:'var(--bg-nav)',backdropFilter:'blur(20px)',borderTop:'1px solid var(--border-nav)',display:'flex',alignItems:'flex-start',paddingTop:8}}>
      {[['home','home','Accueil'],['running','running','Cardio'],['muscu','muscle','Muscu'],['strava','strava','Strava'],['historique','history','Historique'],['nutrition','nutrition','Nutrition']].map(([t,icon,label])=>(
        <button key={t} onClick={()=>setTab(t)}
          className={tab===t ? 'nav-btn-active' : ''} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:2,background:'none',border:'none',cursor:'pointer',fontFamily:'Syne,sans-serif',color:tab===t?'#FF0040':'var(--text-muted)',transition:'color 0.2s'}}>
          <Icon name={icon} size={22} color={tab===t?'#FF0040':'var(--text-muted)'}/>
          <span style={{fontSize:9,fontWeight:tab===t?700:400,letterSpacing:'0.04em',color:tab===t?'#FF0040':'var(--text-muted)'}}>{label}</span>
          <div style={{width:16,height:2,borderRadius:99,background:'#FF0040',opacity:tab===t?1:0,transition:'opacity 0.25s, transform 0.25s',transform:tab===t?'scaleX(1)':'scaleX(0)',transformOrigin:'center'}}/>
        </button>
      ))}
    </div>
  );

  const AppHeader = ({ actions }) => (
    <div style={{ position:'sticky', top:0, zIndex:100, background:'var(--bg-nav)', backdropFilter:'blur(20px)', borderBottom:'1px solid var(--border-nav)' }}>
      <div style={{ height:'env(safe-area-inset-top, 0px)', background:'transparent' }}/>
      <div style={{ height:52, display:'flex', alignItems:'center', padding:'0 12px', gap:8 }}>
        <div style={{ width:36, flexShrink:0 }}>
          <button onClick={() => setShowProfile(true)} style={{ display:'flex', alignItems:'center', background:'none', border:'none', cursor:'pointer', padding:0 }}>
            {user?.photo
              ? <img src={user.photo} alt="" style={{ width:32, height:32, borderRadius:'50%', objectFit:'cover', border:'2px solid rgba(255,0,64,0.3)' }} />
              : <div style={{ width:32, height:32, borderRadius:'50%', background:'rgba(255,0,64,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>👤</div>
            }
          </button>
        </div>
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, pointerEvents:'none' }}>
          <img src="/logo.svg" alt="PacePro" style={{ width:20, height:20, objectFit:'contain' }}/>
          <span style={{ fontSize:13, fontWeight:800, letterSpacing:'-0.02em', color:'var(--text-primary)' }}>PacePro</span>
        </div>
        <div style={{ display:'flex', gap:6, alignItems:'center', justifyContent:'flex-end', minWidth:36 }}>{actions}</div>
      </div>
    </div>
  );


  // Splash overlay pour utilisateurs connectés
  const SplashOverlay = () => showSplash ? (
    <div style={{ position:'fixed', inset:0, background:'var(--bg-primary)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', zIndex:9999, opacity: splashOut ? 0 : 1, transition:'opacity 0.5s ease', pointerEvents: splashOut ? 'none' : 'all' }}>
      <div style={{ position:'absolute', top:'40%', left:'50%', transform:'translate(-50%,-50%)', width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle, rgba(255,0,64,0.15) 0%, transparent 70%)', filter:'blur(40px)', pointerEvents:'none' }}/>
      <img src="/logo.svg" alt="PacePro" className="splash-logo" style={{ width:100, height:100, objectFit:'contain', marginBottom:24 }}/>
      <div className="splash-text" style={{ textAlign:'center', marginBottom:48 }}>
        <div style={{ fontSize:36, fontWeight:900, letterSpacing:'-0.05em', color:'#fff', lineHeight:1, marginBottom:8 }}>PacePro</div>
        <div style={{ fontSize:12, color:'rgba(255,255,255,0.3)', fontFamily:'DM Mono, monospace', textTransform:'uppercase', letterSpacing:'0.25em' }}>Your training companion</div>
      </div>
      <div style={{ width:120, height:2, background:'var(--progress-track)', borderRadius:99, overflow:'hidden' }}>
        <div className="splash-bar" style={{ height:'100%', background:'linear-gradient(90deg,#FF0040,#fbbf24)', borderRadius:99 }}/>
      </div>
    </div>
  ) : null;

  if (showSplash && user) return (
    <div style={{ position:'fixed', inset:0, background:'var(--bg-primary)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', zIndex:9999, transition:'opacity 0.5s ease', opacity: splashOut ? 0 : 1 }}>
      <div style={{ position:'absolute', top:'40%', left:'50%', transform:'translate(-50%,-50%)', width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle, rgba(255,0,64,0.15) 0%, transparent 70%)', filter:'blur(40px)', pointerEvents:'none' }}/>
      <img src="/logo.svg" alt="PacePro" className="splash-logo" style={{ width:100, height:100, objectFit:'contain', marginBottom:24 }}/>
      <div className="splash-text" style={{ textAlign:'center', marginBottom:48 }}>
        <div style={{ fontSize:36, fontWeight:900, letterSpacing:'-0.05em', color:'var(--text-primary)', lineHeight:1, marginBottom:8 }}>PacePro</div>
        <div style={{ fontSize:12, color:'var(--text-muted)', fontFamily:'DM Mono, monospace', textTransform:'uppercase', letterSpacing:'0.25em' }}>Your training companion</div>
      </div>
      <div style={{ width:120, height:2, background:'var(--progress-track)', borderRadius:99, overflow:'hidden' }}>
        <div className="splash-bar" style={{ height:'100%', background:'linear-gradient(90deg,#FF0040,#fbbf24)', borderRadius:99 }}/>
      </div>
    </div>
  );

  if (tab === 'historique') {
    return (
      <div className='app-shell'>
        <ThemeStyles/>
        {showProfile && <ProfileSheet user={user} onClose={() => setShowProfile(false)} onLogout={() => { handleLogout(); setShowProfile(false); }} onNavigate={setTab} />}
        <AppHeader />
        <div className='app-content tab-enter' style={{paddingBottom:80}}><HistoriqueModule/></div>
        <BottomNav/>
      </div>
    );
  }
  if (tab === 'settings') return (
    <div className='app-shell'>
      <ThemeStyles/>
      {showProfile && <ProfileSheet user={user} onClose={() => setShowProfile(false)} onLogout={() => { handleLogout(); setShowProfile(false); }} onNavigate={setTab} />}
      <AppHeader />
      <div className='app-content tab-enter' style={{paddingBottom:80}}><SettingsModule onBack={() => setTab('home')} user={user} onSync={syncKey} /></div>
      <BottomNav/>
    </div>
  );
  if (tab === 'nutrition') return (
    <div className='app-shell'>
      <ThemeStyles/>
      {showProfile && <ProfileSheet user={user} onClose={() => setShowProfile(false)} onLogout={() => { handleLogout(); setShowProfile(false); }} onNavigate={setTab} />}
      <AppHeader />
      <div className='app-content tab-enter' style={{paddingBottom:80}}><FuelRecoveryHub onSync={syncKey} /></div>
      <BottomNav/>
    </div>
  );
  if (tab === 'bilan') return (
    <div className='app-shell'>
      <ThemeStyles/>
      {showProfile && <ProfileSheet user={user} onClose={() => setShowProfile(false)} onLogout={() => { handleLogout(); setShowProfile(false); }} onNavigate={setTab} />}
      <AppHeader />
      <div className='app-content tab-enter'><BilanModule onBack={() => setTab('home')} /></div>
    </div>
  );
  if (tab === 'home') {
    return (
      <div className='app-shell'>
        <ThemeStyles/>
        {showProfile && <ProfileSheet user={user} onClose={() => setShowProfile(false)} onLogout={() => { handleLogout(); setShowProfile(false); }} onNavigate={setTab} />}
        <AppHeader />
        <div className='app-content tab-enter'><HomeModule onNavigate={setTab}/></div>
        <BottomNav/>
      </div>
    );
  }
  if (tab === 'strava') {
    return (
      <div className='app-shell'>
        <ThemeStyles/>
        {showProfile && <ProfileSheet user={user} onClose={() => setShowProfile(false)} onLogout={() => { handleLogout(); setShowProfile(false); }} onNavigate={setTab} />}
        <AppHeader />
        <div className='app-content tab-enter' style={{paddingBottom:80}}><StravaModule/></div>
        <BottomNav/>
      </div>
    );
  }
  if (tab === 'muscu') {
    return (
      <div className='app-shell'>
        <ThemeStyles/>
        {showProfile && <ProfileSheet user={user} onClose={() => setShowProfile(false)} onLogout={() => { handleLogout(); setShowProfile(false); }} onNavigate={setTab} />}
        <AppHeader actions={<><button onClick={()=>{}} style={{background:'rgba(96,165,250,0.08)',border:'1px solid rgba(96,165,250,0.2)',color:'#60a5fa',borderRadius:10,padding:'6px 12px',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>✨ IA</button><button onClick={()=>{}} style={{background:'#FF0040',border:'none',color:'#fff',borderRadius:10,padding:'6px 12px',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>+ Créer</button></>} />
        <div className='app-content tab-enter' style={{paddingBottom:80}}><Muscu onSync={syncKey} initialWorkouts={workouts} onWorkoutsChange={setWorkouts}/></div>
        <BottomNav/>
      </div>
    );
  }

  // Running tab
  if (generatingPlan) return (
    <div className='app-shell'><ThemeStyles/>
      <div style={{position:'fixed',inset:0,background:'var(--bg-primary)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:24,zIndex:9999}}>
        <div style={{width:60,height:60,borderRadius:'50%',border:'3px solid rgba(245,158,11,0.2)',borderTopColor:'#f59e0b',animation:'spin 1s linear infinite'}}/>
        <div style={{textAlign:'center'}}>
          <div style={{fontSize:18,fontWeight:800,color:'var(--text-primary)',marginBottom:8}}>L'IA crée ton plan vélo</div>
          <div style={{fontSize:13,color:'var(--text-muted)'}}>Analyse de ton profil en cours...</div>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (view==='onboarding') return <div className='app-shell'><ThemeStyles/>{showProfile && <ProfileSheet user={user} onClose={() => setShowProfile(false)} onLogout={() => { handleLogout(); setShowProfile(false); }} onNavigate={setTab} />}<AppHeader /><div className='app-content tab-enter' style={{paddingBottom:80}}><Onboarding onComplete={handleOnboarding}/></div><BottomNav/></div>;
  if (view==='dashboard' && activePlan!==null && plans[activePlan]) {
    return (
      <div className='app-shell'>
        <ThemeStyles/>
        {showProfile && <ProfileSheet user={user} onClose={() => setShowProfile(false)} onLogout={() => { handleLogout(); setShowProfile(false); }} onNavigate={setTab} />}
        <AppHeader actions={<button onClick={()=>setView('list')} style={{background:'var(--btn-ghost-bg)',border:'1px solid var(--btn-ghost-border)',borderRadius:10,padding:'6px 12px',color:'var(--btn-ghost-color)',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>📋 Plans</button>} />
        <div className='app-content tab-enter' style={{paddingBottom:80}}>

          <Dashboard profile={plans[activePlan].profile} plan={plans[activePlan].plan} initialCompleted={plans[activePlan].completed||{}} initialFeedbacks={plans[activePlan].feedbacks||{}} onReset={()=>setView('onboarding')} onSave={(newPlan, newCompleted, newFeedbacks) => { const updated = plans.map((p,i) => i===activePlan ? {...p, plan:newPlan, completed:newCompleted, feedbacks:newFeedbacks} : p); savePlans(updated); }}/>
        </div>
        <BottomNav/>
      </div>
    );
  }
  if (plans.length===0) return <div className='app-shell'><ThemeStyles/>{showProfile && <ProfileSheet user={user} onClose={() => setShowProfile(false)} onLogout={() => { handleLogout(); setShowProfile(false); }} onNavigate={setTab} />}<AppHeader /><div className='app-content tab-enter' style={{paddingBottom:80}}><Onboarding onComplete={handleOnboarding}/></div><BottomNav/></div>;
  return <div className='app-shell'><ThemeStyles/>{showProfile && <ProfileSheet user={user} onClose={() => setShowProfile(false)} onLogout={() => { handleLogout(); setShowProfile(false); }} onNavigate={setTab} />}<AppHeader actions={<button onClick={()=>setView('onboarding')} style={{background:'#FF0040',border:'none',color:'#fff',borderRadius:10,padding:'6px 14px',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>+ Nouveau</button>} /><div className='app-content' style={{paddingBottom:80}}><PlansList plans={plans} onSelect={i=>{setActivePlan(i);setView('dashboard');}} onNew={()=>setView('onboarding')} onDelete={handleDelete}/></div><BottomNav/></div>;
}
