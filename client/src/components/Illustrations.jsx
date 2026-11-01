// Hand-drawn SVG scenes in the Gapper palette: a student on a winding path toward a distant city.

function Leaf({ x, y, rotate = 0, scale = 1, fill }) {
  return (
    <path
      d="M0 0C-11-26-6-54 8-74 22-52 19-24 0 0Z"
      fill={fill}
      transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}
    />
  );
}

export function HeroIllustration({ className, label }) {
  return (
    <svg className={className} viewBox="0 0 600 440" role="img" aria-label={label}>
      <path d="M118 170C150 70 270 18 390 30c120 12 205 88 205 190v220H70c-10-90 18-190 48-270Z" fill="#f3d9ae" />

      <g fill="#c4c796">
        <rect x="392" y="122" width="22" height="98" rx="2" />
        <rect x="418" y="78" width="26" height="142" rx="2" />
        <rect x="448" y="104" width="22" height="116" rx="2" />
        <rect x="474" y="52" width="30" height="168" rx="2" />
        <path d="M489 24l9 28h-18z" />
        <rect x="508" y="112" width="24" height="108" rx="2" />
        <rect x="536" y="140" width="20" height="80" rx="2" />
      </g>
      <g fill="#e6e3be">
        <rect x="423" y="92" width="5" height="7" /><rect x="433" y="92" width="5" height="7" />
        <rect x="423" y="110" width="5" height="7" /><rect x="433" y="110" width="5" height="7" />
        <rect x="481" y="70" width="5" height="7" /><rect x="492" y="70" width="5" height="7" />
        <rect x="481" y="88" width="5" height="7" /><rect x="492" y="88" width="5" height="7" />
        <rect x="481" y="106" width="5" height="7" /><rect x="492" y="106" width="5" height="7" />
        <rect x="514" y="126" width="5" height="7" /><rect x="522" y="126" width="5" height="7" />
      </g>

      <path d="M140 236c90-56 180-40 260-44 70-4 140 4 200-6v254H140Z" fill="#c9ce96" />
      <path d="M0 300c90-48 200-58 300-34 84 20 170-14 300-6v180H0Z" fill="#efcb98" />

      <path d="M200 440c50-30 190-40 190-92" fill="none" stroke="#fbf1dc" strokeWidth="46" strokeLinecap="round" />
      <path d="M390 348c-6-40-74-56-20-86" fill="none" stroke="#fbf1dc" strokeWidth="26" strokeLinecap="round" />
      <path d="M370 262c40-22 82-30 98-48" fill="none" stroke="#fbf1dc" strokeWidth="12" strokeLinecap="round" />

      <path d="M0 336c70-40 150-36 220-2v106H0Z" fill="#8fa14e" />
      <path d="M340 372c80-46 170-50 260-64v132H340Z" fill="#5f7a2e" />
      <circle cx="74" cy="318" r="16" fill="#748c3a" />
      <circle cx="96" cy="322" r="11" fill="#5f7a2e" />
      <circle cx="430" cy="352" r="12" fill="#4e6825" />

      <g fill="#f3e6cc" stroke="#d8c49c" strokeWidth="1.5">
        <ellipse cx="246" cy="420" rx="28" ry="8.5" />
        <ellipse cx="330" cy="392" rx="24" ry="7.5" />
        <ellipse cx="384" cy="362" rx="17" ry="5.5" />
        <ellipse cx="380" cy="300" rx="12" ry="4" />
      </g>

      <g>
        <ellipse cx="330" cy="391" rx="20" ry="4" fill="#c9b48b" opacity=".7" />
        <rect x="318" y="328" width="10" height="60" rx="4" fill="#4b4a36" />
        <rect x="332" y="328" width="10" height="60" rx="4" fill="#413f2e" />
        <ellipse cx="322" cy="389" rx="8" ry="4" fill="#2b2a1e" />
        <ellipse cx="338" cy="389" rx="8" ry="4" fill="#2b2a1e" />
        <rect x="306" y="286" width="9" height="42" rx="4.5" fill="#d2982f" />
        <rect x="345" y="286" width="9" height="42" rx="4.5" fill="#d2982f" />
        <rect x="312" y="280" width="36" height="56" rx="10" fill="#dda63c" />
        <rect x="314" y="284" width="32" height="42" rx="9" fill="#33491f" />
        <rect x="319" y="306" width="22" height="14" rx="4" fill="#2a3d19" />
        <rect x="326" y="270" width="8" height="10" rx="3" fill="#b9835a" />
        <circle cx="330" cy="260" r="14" fill="#2b2418" />
      </g>

      <Leaf x={548} y={444} rotate={-28} scale={1.15} fill="#33491f" />
      <Leaf x={566} y={444} rotate={6} scale={1.3} fill="#557028" />
      <Leaf x={584} y={444} rotate={30} scale={1} fill="#33491f" />
      <Leaf x={530} y={444} rotate={-52} scale={.8} fill="#7f973f" />
      <Leaf x={24} y={444} rotate={-14} scale={.75} fill="#7f973f" />
      <Leaf x={40} y={444} rotate={18} scale={.9} fill="#46601f" />
      <Leaf x={10} y={444} rotate={-40} scale={.6} fill="#46601f" />
    </svg>
  );
}

export function HillsIllustration({ className, label }) {
  return (
    <svg className={className} viewBox="0 0 480 220" role="img" aria-label={label}>
      <path d="M0 120c70-40 150-60 240-44 90 16 160-12 240-28v172H0Z" fill="#d9d9a6" />
      <path d="M0 150c90-30 170-22 250-6 80 16 150 0 230-20v96H0Z" fill="#a7b560" />
      <path d="M0 184c110-34 250-40 480-14v50H0Z" fill="#5f7a2e" />
      <g transform="translate(250 150)">
        <path d="M0 0c0-14 1-26-1-38" stroke="#33491f" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        <path d="M-1-30c-16-2-26-12-28-26 16 0 26 10 28 26Z" fill="#557028" />
        <path d="M-1-38c14-6 26-4 34 6-12 8-26 6-34-6Z" fill="#33491f" />
      </g>
    </svg>
  );
}
