// PacePro Custom SVG Icons
// Usage: <Icon name="running" size={24} color="currentColor" />

const icons = {
  // Navigation
  home: (s, c) => (
    <svg width={s} height={s} viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" fill={c}>
      <g transform="translate(0,512) scale(0.1,-0.1)">
        <path d="M2455 4783 c-27 -10 -61 -26 -74 -35 -14 -10 -512 -483 -1107 -1053 -715 -684 -1088 -1047 -1099 -1071 -32 -69 -9 -148 59 -198 43 -32 132 -29 177 5 19 15 412 388 875 830 462 442 931 891 1042 997 171 163 206 192 232 192 25 0 50 -19 139 -102 59 -57 534 -510 1055 -1008 520 -498 961 -913 979 -923 40 -23 117 -18 155 10 64 48 88 126 59 194 -10 24 -139 154 -400 404 l-387 369 -2 572 c-3 560 -3 573 -24 600 -11 15 -33 37 -48 48 -26 20 -43 21 -312 24 -318 3 -331 1 -382 -66 -27 -35 -27 -38 -32 -221 l-5 -185 -300 287 c-219 210 -314 294 -353 314 -71 35 -175 41 -247 16z"/>
        <path d="M2432 4037 c-53 -51 -455 -434 -892 -851 -437 -417 -819 -782 -848 -811 l-52 -54 2 -883 3 -883 24 -50 c32 -63 92 -124 156 -155 l50 -25 552 0 c541 0 552 0 579 21 15 11 37 33 48 48 21 27 21 40 26 758 l5 730 24 19 c22 18 45 19 451 19 406 0 429 -1 451 -19 l24 -19 5 -730 c5 -718 5 -731 26 -758 11 -15 33 -37 48 -48 27 -21 38 -21 579 -21 l552 0 50 25 c64 31 124 92 156 155 l24 50 3 883 2 884 -57 58 c-32 32 -418 401 -858 821 -440 419 -839 800 -886 846 -117 112 -120 112 -247 -10z"/>
      </g>
    </svg>
  ),
  running: (s, c) => (
    <svg width={s} height={s} viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" fill={c}>
      <g transform="translate(0,512) scale(0.1,-0.1)">
        <path d="M2830 3821 c-80 -26 -133 -81 -150 -157 -8 -36 -7 -38 66 -115 104 -110 129 -165 129 -289 0 -88 -3 -101 -33 -163 -32 -64 -54 -86 -419 -417 -462 -420 -455 -415 -633 -415 -105 0 -120 2 -170 27 -30 15 -94 59 -142 98 l-87 71 -268 -134 c-147 -73 -344 -166 -438 -206 -299 -129 -289 -124 -268 -132 11 -4 105 -12 209 -18 751 -44 1553 57 2225 279 323 107 676 266 937 422 l123 73 -76 17 c-290 67 -538 345 -724 813 -33 82 -71 163 -84 181 -42 52 -138 84 -197 65z"/>
        <path d="M2565 3379 c-156 -228 -518 -530 -929 -774 -77 -46 -95 -61 -84 -69 8 -6 35 -28 59 -48 61 -50 109 -69 180 -69 104 -1 129 17 524 378 271 247 366 339 383 373 40 80 25 166 -45 244 -18 20 -34 36 -36 36 -2 0 -25 -32 -52 -71z"/>
        <path d="M4164 3326 c-12 -8 -47 -59 -79 -112 -105 -176 -156 -214 -293 -222 l-83 -5 31 -18 c214 -130 559 -36 709 194 49 74 53 116 16 152 -23 24 -30 25 -152 25 -96 0 -134 -4 -149 -14z"/>
        <path d="M4345 2851 c-38 -26 -126 -86 -195 -135 -677 -477 -1556 -785 -2518 -881 -244 -24 -572 -38 -774 -33 -104 3 -188 3 -188 1 0 -14 81 -108 111 -127 51 -34 92 -43 279 -60 463 -42 897 -26 1300 50 175 32 280 60 525 139 416 133 759 216 1265 305 110 19 414 60 446 60 11 0 14 5 9 18 -4 9 -15 69 -26 132 -27 159 -33 180 -89 300 -40 85 -51 121 -59 188 -5 46 -11 85 -12 87 -2 1 -35 -18 -74 -44z"/>
        <path d="M4610 2745 c0 -8 13 -39 29 -68 16 -28 34 -69 41 -90 13 -41 34 -46 54 -15 8 14 2 35 -32 103 -36 73 -45 85 -67 85 -16 0 -25 -6 -25 -15z"/>
        <path d="M4640 2013 c-217 -17 -642 -88 -982 -163 -236 -52 -371 -88 -593 -157 -383 -119 -434 -134 -565 -163 -314 -68 -587 -94 -980 -93 -287 0 -546 17 -680 44 -82 16 -164 64 -218 127 -101 118 -126 138 -212 171 -45 17 -84 31 -86 31 -13 0 0 -84 19 -120 40 -77 196 -147 485 -220 473 -118 901 -170 1422 -171 303 0 492 10 735 42 319 41 361 43 613 30 319 -17 573 0 862 60 160 33 198 47 247 92 58 54 85 107 90 182 3 51 -3 79 -39 185 -29 83 -48 125 -58 126 -8 0 -35 -1 -60 -3z"/>
      </g>
    </svg>
  ),
  muscle: (s, c) => (
    <svg width={s} height={s} viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" fill={c}>
      <g transform="translate(0,512) scale(0.1,-0.1)">
        <path d="M780 3651 c-82 -25 -151 -94 -175 -175 -22 -74 -22 -1758 0 -1832 18 -61 62 -116 123 -152 47 -27 48 -27 265 -30 260 -4 293 3 368 78 83 83 79 33 79 1020 0 986 4 937 -79 1020 -73 73 -106 80 -350 79 -113 0 -217 -4 -231 -8z"/>
        <path d="M3857 3646 c-47 -17 -99 -57 -127 -97 -50 -70 -50 -62 -50 -989 0 -987 -4 -937 79 -1020 75 -75 108 -82 368 -78 217 3 218 3 265 30 25 16 60 45 78 65 61 75 60 51 60 1003 0 962 2 929 -66 1008 -70 82 -88 87 -344 89 -171 2 -234 0 -263 -11z"/>
        <path d="M384 3160 c-70 -34 -130 -89 -150 -136 -11 -27 -14 -120 -14 -464 0 -477 -1 -467 66 -533 35 -35 146 -97 173 -97 8 0 11 176 11 630 0 497 -3 630 -12 630 -7 0 -40 -14 -74 -30z"/>
        <path d="M4650 2560 c0 -454 3 -630 11 -630 27 0 138 62 173 97 67 66 66 56 66 533 0 477 1 467 -66 533 -35 35 -146 97 -173 97 -8 0 -11 -176 -11 -630z"/>
        <path d="M1560 2560 l0 -230 1000 0 1000 0 0 230 0 230 -1000 0 -1000 0 0 -230z"/>
      </g>
    </svg>
  ),
  strava: (s, c) => (
    <svg width={s} height={s} viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg" fill={c}>
      <path d="M 8.6935,9.972 7.649,7.914 l -1.5325,0 2.577,5.086 2.575,-5.086 -1.533,0 m -3.504,-2.7995 1.418,2.799 2.086,0 L 6.2315,1 l -3.5,6.914 2.0845,0"/>
    </svg>
  ),
  history: (s, c) => (
    <svg width={s} height={s} viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" fill={c}>
      <g transform="translate(0,512) scale(0.1,-0.1)">
        <path d="M2450 4615 c-632 -89 -1172 -439 -1503 -975 -64 -104 -159 -308 -193 -412 -15 -49 -31 -88 -35 -88 -3 0 -28 34 -56 75 l-49 74 -132 -87 c-72 -48 -132 -89 -132 -92 0 -16 339 -507 362 -523 38 -28 116 -34 159 -12 33 18 475 309 493 326 6 5 -26 62 -77 139 -99 148 -81 141 -189 68 -32 -21 -58 -37 -58 -35 0 23 64 179 115 282 314 629 1000 1016 1698 957 316 -27 590 -122 853 -297 119 -80 286 -231 377 -342 432 -532 519 -1261 222 -1879 -225 -468 -653 -816 -1160 -942 -158 -40 -226 -47 -430 -47 -167 1 -219 5 -315 24 -281 56 -520 162 -742 329 -89 67 -244 218 -320 311 l-36 44 -126 -92 c-69 -51 -126 -96 -126 -100 0 -14 202 -239 267 -297 509 -453 1172 -635 1826 -499 933 193 1611 993 1654 1950 21 487 -143 984 -455 1379 -30 39 -103 118 -161 176 -331 329 -754 532 -1231 590 -115 14 -384 11 -500 -5z"/>
        <path d="M2560 3105 c0 -471 3 -581 14 -608 8 -18 126 -144 263 -280 l249 -248 112 113 113 112 -216 216 -215 215 0 528 0 527 -160 0 -160 0 0 -575z"/>
      </g>
    </svg>
  ),
  nutrition: (s, c) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a7 7 0 017 7c0 5-7 13-7 13S5 14 5 9a7 7 0 017-7z"/>
      <circle cx="12" cy="9" r="2.5"/>
    </svg>
  ),
  // Actions
  close: (s, c) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  check: (s, c) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  arrow_right: (s, c) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
  arrow_left: (s, c) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"/>
      <polyline points="12 19 5 12 12 5"/>
    </svg>
  ),
  plus: (s, c) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  trash: (s, c) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14H6L5 6"/>
      <path d="M10 11v6M14 11v6"/>
      <path d="M9 6V4h6v2"/>
    </svg>
  ),
  edit: (s, c) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  sync: (s, c) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/>
      <polyline points="1 20 1 14 7 14"/>
      <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
    </svg>
  ),
  play: (s, c) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={c} stroke="none">
      <polygon points="5 3 19 12 5 21 5 3"/>
    </svg>
  ),
  pause: (s, c) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round">
      <line x1="6" y1="4" x2="6" y2="20"/>
      <line x1="18" y1="4" x2="18" y2="20"/>
    </svg>
  ),
  timer: (s, c) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="13" r="8"/>
      <polyline points="12 9 12 13 15 16"/>
      <path d="M9 3h6"/>
      <path d="M12 3v2"/>
    </svg>
  ),
  // Fitness
  weight: (s, c) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4h2a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2z"/>
      <path d="M16 4h2a2 2 0 012 2v12a2 2 0 01-2 2h-2a2 2 0 01-2-2V6a2 2 0 012-2z"/>
      <line x1="10" y1="12" x2="14" y2="12"/>
    </svg>
  ),
  heart: (s, c) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
    </svg>
  ),
  chart: (s, c) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
      <line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  ),
  fire: (s, c) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2c0 0-5 5-5 10a5 5 0 0010 0c0-3-2-6-2-6s-1 3-3 3c0-3 0-7 0-7z"/>
    </svg>
  ),
  lightning: (s, c) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  // User
  user: (s, c) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  logout: (s, c) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  settings: (s, c) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
    </svg>
  ),
  // Misc
  cloud: (s, c) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"/>
    </svg>
  ),
  map: (s, c) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
      <line x1="8" y1="2" x2="8" y2="18"/>
      <line x1="16" y1="6" x2="16" y2="22"/>
    </svg>
  ),
  star: (s, c) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
};

export function Icon({ name, size = 24, color = 'currentColor', style = {} }) {
  const fn = icons[name];
  if (!fn) return null;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0, ...style }}>
      {fn(size, color)}
    </span>
  );
}

export default Icon;
