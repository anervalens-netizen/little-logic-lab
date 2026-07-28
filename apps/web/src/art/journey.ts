import { svg } from "./svg";

export type JourneyStopState = "completed" | "current" | "upcoming";

const stateAlpha = (state: JourneyStopState): number =>
  state === "upcoming" ? 0.48 : 1;

export function journeyBackdrop(): string {
  return `<svg viewBox="0 0 1200 720" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="journey-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#DDF4FF"/>
        <stop offset="1" stop-color="#FFF8DF"/>
      </linearGradient>
      <linearGradient id="journey-grass" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#BCE59C"/>
        <stop offset="1" stop-color="#8DCA72"/>
      </linearGradient>
    </defs>
    <rect width="1200" height="720" fill="url(#journey-sky)"/>
    <circle cx="1040" cy="115" r="62" fill="#FFD35C" opacity="0.92"/>
    <path d="M0 350 Q170 280 345 355 T700 342 T1200 330 V720 H0Z" fill="#D7EEB7"/>
    <path d="M0 430 Q210 360 405 432 T790 420 T1200 402 V720 H0Z" fill="url(#journey-grass)"/>
    <path d="M-80 710 C160 540 300 610 470 470 C630 338 790 435 1280 245" fill="none" stroke="#D3A46E" stroke-width="138" stroke-linecap="round"/>
    <path d="M-80 710 C160 540 300 610 470 470 C630 338 790 435 1280 245" fill="none" stroke="#F0D2A8" stroke-width="96" stroke-linecap="round"/>
    <path d="M-80 710 C160 540 300 610 470 470 C630 338 790 435 1280 245" fill="none" stroke="#FFFFFF" stroke-width="8" stroke-dasharray="28 32" stroke-linecap="round" opacity="0.86"/>
    <g opacity="0.9">
      <rect x="85" y="382" width="190" height="155" rx="26" fill="#FFF8EC" stroke="#A67B5B" stroke-width="8"/>
      <path d="M65 390 L180 286 L295 390" fill="#F25C4C" stroke="#A3483C" stroke-width="8" stroke-linejoin="round"/>
      <rect x="122" y="427" width="116" height="110" rx="18" fill="#CFE6F5" stroke="#6E9DB9" stroke-width="7"/>
      <path d="M180 430 V533" stroke="#6E9DB9" stroke-width="6"/>
    </g>
    <g opacity="0.72">
      <circle cx="935" cy="356" r="44" fill="#7FC86B"/>
      <rect x="926" y="388" width="18" height="82" rx="8" fill="#9B6D4B"/>
      <circle cx="1010" cy="385" r="34" fill="#64B45A"/>
      <rect x="1002" y="411" width="16" height="60" rx="8" fill="#9B6D4B"/>
    </g>
  </svg>`;
}

function statusBadge(state: JourneyStopState): string {
  if (state === "completed") {
    return `<circle cx="96" cy="24" r="16" fill="#7FC86B" stroke="#FFFFFF" stroke-width="4"/><path d="M87 24 L93 30 L105 17" fill="none" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  if (state === "current") {
    return `<circle cx="96" cy="24" r="16" fill="#FFD35C" stroke="#FFFFFF" stroke-width="4"/><path d="M91 16 L104 24 L91 32 Z" fill="#4A3F35"/>`;
  }
  return `<circle cx="96" cy="24" r="13" fill="#E3DED5" stroke="#FFFFFF" stroke-width="4"/>`;
}

export function journeyStopArtwork(
  gameId: string,
  state: JourneyStopState,
): string {
  const alpha = stateAlpha(state);
  if (gameId === "same-picture") {
    return svg(`
      <g opacity="${alpha}">
        <rect x="15" y="38" width="90" height="64" rx="22" fill="#FFF8EC" stroke="#D6A541" stroke-width="5"/>
        <g transform="translate(17 42)">
          <path d="M12 35 L24 18 H52 L65 35 V56 H12Z" fill="#F25C4C" stroke="#A94438" stroke-width="4" stroke-linejoin="round"/>
          <circle cx="25" cy="57" r="9" fill="#4A3F35"/><circle cx="53" cy="57" r="9" fill="#4A3F35"/>
          <rect x="29" y="23" width="19" height="13" rx="4" fill="#DDF4FF"/>
        </g>
        <g transform="translate(45 44) scale(.72)">
          <path d="M12 35 L24 18 H52 L65 35 V56 H12Z" fill="#F25C4C" stroke="#A94438" stroke-width="4" stroke-linejoin="round"/>
          <circle cx="25" cy="57" r="9" fill="#4A3F35"/><circle cx="53" cy="57" r="9" fill="#4A3F35"/>
          <rect x="29" y="23" width="19" height="13" rx="4" fill="#DDF4FF"/>
        </g>
        ${statusBadge(state)}
      </g>
    `);
  }
  if (gameId === "sort-by-color") {
    return svg(`
      <g opacity="${alpha}">
        <rect x="10" y="44" width="45" height="56" rx="12" fill="#FFE1DC" stroke="#F25C4C" stroke-width="5"/>
        <rect x="65" y="44" width="45" height="56" rx="12" fill="#DCEEFF" stroke="#4FA8E8" stroke-width="5"/>
        <circle cx="34" cy="29" r="13" fill="#F25C4C" stroke="#A94438" stroke-width="4"/>
        <circle cx="84" cy="27" r="13" fill="#4FA8E8" stroke="#2D7FB9" stroke-width="4"/>
        <path d="M33 42 V58 M84 40 V58" stroke="#4A3F35" stroke-width="4" stroke-linecap="round" opacity=".35"/>
        ${statusBadge(state)}
      </g>
    `);
  }
  return svg(`
    <g opacity="${alpha}">
      <rect x="15" y="30" width="90" height="76" rx="18" fill="#FFF2F8" stroke="#C77DA0" stroke-width="5"/>
      <path d="M42 82 L29 69 C17 57 31 41 43 53 C55 40 70 57 57 69Z" fill="#FF9EC6" stroke="#C75E8B" stroke-width="4"/>
      <circle cx="79" cy="66" r="18" fill="#FFD35C" stroke="#D6A541" stroke-width="4"/>
      <path d="M42 82 L29 69 C17 57 31 41 43 53 C55 40 70 57 57 69Z" fill="none" stroke="#FFFFFF" stroke-width="3" opacity=".75" transform="translate(0 -1)"/>
      ${statusBadge(state)}
    </g>
  `);
}
