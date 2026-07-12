type IllustrationProps = {
  className?: string;
};

export function RescueHeroIllustration({ className = "" }: IllustrationProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      focusable="false"
      viewBox="0 0 720 430"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="rescue-sky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#dff8f7" />
          <stop offset="1" stopColor="#fff7dd" />
        </linearGradient>
        <linearGradient id="rescue-sea" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#21a5bd" />
          <stop offset="1" stopColor="#07556f" />
        </linearGradient>
      </defs>

      <rect width="720" height="430" rx="34" fill="url(#rescue-sky)" />
      <circle cx="596" cy="82" r="43" fill="#ffd459" />
      <path d="M74 112c18-18 36-18 54 0 18-18 36-18 54 0" fill="none" stroke="#4b8796" strokeLinecap="round" strokeWidth="7" />
      <path d="M225 80c12-12 25-12 38 0 12-12 25-12 38 0" fill="none" stroke="#4b8796" strokeLinecap="round" strokeWidth="6" />

      <path d="M0 237c81-26 147 28 227 1s151 25 235 0 162 11 258-4v196H0Z" fill="url(#rescue-sea)" />
      <path d="M0 258c76-25 142 25 221 0s151 23 235-2 166 8 264-7" fill="none" stroke="#9be5e3" strokeLinecap="round" strokeWidth="9" />
      <path d="M8 315c74-23 135 22 211-1s145 22 227-1 162 7 260-7" fill="none" opacity=".38" stroke="#baf2ed" strokeLinecap="round" strokeWidth="6" />

      <g transform="translate(190 102)">
        <path d="m18 118 330 4-51 83H80Z" fill="#fffdf7" stroke="#08384c" strokeLinejoin="round" strokeWidth="8" />
        <path d="m71 172 242 2-17 31H80Z" fill="#ec6b55" />
        <rect x="124" y="55" width="112" height="70" rx="8" fill="#f7faf5" stroke="#08384c" strokeWidth="8" />
        <rect x="144" y="72" width="34" height="28" rx="3" fill="#8bd8df" />
        <rect x="188" y="72" width="28" height="28" rx="3" fill="#8bd8df" />
        <path d="M116 56h129l-17-25h-92Z" fill="#ec6b55" stroke="#08384c" strokeLinejoin="round" strokeWidth="8" />
        <path d="M171 31V0" stroke="#08384c" strokeLinecap="round" strokeWidth="8" />
        <path d="m175 4 76 25h-76Z" fill="#ffcf57" stroke="#08384c" strokeLinejoin="round" strokeWidth="6" />
        <path d="M68 112V76m0 0 32-26m-32 26L41 52" fill="none" stroke="#08384c" strokeLinecap="round" strokeWidth="7" />
        <path d="M38 52h64" stroke="#ec6b55" strokeLinecap="round" strokeWidth="10" />
        <circle cx="282" cy="82" r="20" fill="#ffd0a2" stroke="#08384c" strokeWidth="6" />
        <path d="M261 78c3-26 39-27 44-3-12-5-29-6-44 3Z" fill="#ffcf57" stroke="#08384c" strokeLinejoin="round" strokeWidth="6" />
        <path d="M283 103v28m0-17-24 18m24-15 30 14" fill="none" stroke="#08384c" strokeLinecap="round" strokeWidth="7" />
        <path d="M260 105h46v53h-46Z" fill="#15a6a0" stroke="#08384c" strokeLinejoin="round" strokeWidth="6" />
        <path d="m312 131 58 39" stroke="#08384c" strokeLinecap="round" strokeWidth="6" />
        <path d="m366 167 31 50-53-18Z" fill="#b9ebe3" stroke="#08384c" strokeLinejoin="round" strokeWidth="5" />
      </g>

      <g fill="#ffd45d" stroke="#08384c" strokeLinejoin="round" strokeWidth="4">
        <path d="M81 344c22-22 59-22 81 0-22 23-59 23-81 0Zm0 0-25-17v34Z" />
        <path d="M447 350c20-20 52-20 72 0-20 20-52 20-72 0Zm72 0 22-15v30Z" />
        <path d="M576 305c18-18 48-18 66 0-18 19-48 19-66 0Zm0 0-21-15v30Z" />
      </g>
      <g fill="#dff8f7" opacity=".9">
        <circle cx="115" cy="302" r="7" /><circle cx="93" cy="281" r="4" />
        <circle cx="618" cy="273" r="6" /><circle cx="640" cy="253" r="4" />
        <circle cx="486" cy="310" r="5" />
      </g>
    </svg>
  );
}

export function FishSchoolIllustration({ className = "" }: IllustrationProps) {
  return (
    <svg aria-hidden="true" className={className} focusable="false" viewBox="0 0 320 190" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 151c52-20 85 18 137-1s89 14 167-7" fill="none" stroke="#7ed8d2" strokeLinecap="round" strokeWidth="10" />
      <g fill="#ffcf57" stroke="#08384c" strokeLinejoin="round" strokeWidth="5">
        <path d="M58 78c28-27 73-27 101 0-28 28-73 28-101 0Zm0 0L25 56v44Z" />
        <path d="M174 122c21-21 56-21 77 0-21 21-56 21-77 0Zm77 0 28-19v38Z" />
        <path d="M190 48c17-17 46-17 63 0-17 18-46 18-63 0Zm0 0-23-16v32Z" fill="#ec6b55" />
      </g>
      <g fill="#0a7893">
        <circle cx="136" cy="73" r="4" /><circle cx="231" cy="117" r="4" /><circle cx="235" cy="44" r="3.5" />
      </g>
      <g fill="none" stroke="#2bb4bd" strokeWidth="4">
        <circle cx="283" cy="58" r="9" /><circle cx="294" cy="31" r="5" /><circle cx="39" cy="131" r="7" />
      </g>
    </svg>
  );
}

export function FishingBoatIllustration({ className = "" }: IllustrationProps) {
  return (
    <svg aria-hidden="true" className={className} focusable="false" viewBox="0 0 360 220" xmlns="http://www.w3.org/2000/svg">
      <circle cx="288" cy="44" r="28" fill="#ffcf57" />
      <path d="M7 172c47-20 77 18 126-1s86 17 129-1 67 9 92-2" fill="none" stroke="#1c9cb5" strokeLinecap="round" strokeWidth="25" />
      <path d="m54 114 236 3-38 62H99Z" fill="#fffdf8" stroke="#08384c" strokeLinejoin="round" strokeWidth="7" />
      <path d="m92 153 178 2-18 24H99Z" fill="#ec6b55" />
      <rect x="120" y="65" width="85" height="52" rx="5" fill="#e8f7f4" stroke="#08384c" strokeWidth="7" />
      <rect x="135" y="79" width="25" height="20" rx="2" fill="#72ced8" /><rect x="168" y="79" width="23" height="20" rx="2" fill="#72ced8" />
      <path d="M164 65V29m0 3 62 21h-62Z" fill="#ffcf57" stroke="#08384c" strokeLinejoin="round" strokeWidth="6" />
      <circle cx="238" cy="84" r="14" fill="#ffd0a2" stroke="#08384c" strokeWidth="5" />
      <path d="M224 81c4-18 28-18 31-1-10-4-20-4-31 1Z" fill="#ffcf57" stroke="#08384c" strokeLinejoin="round" strokeWidth="5" />
      <path d="M238 99v34m0-23-18 14m18-12 21 13" fill="none" stroke="#08384c" strokeLinecap="round" strokeWidth="6" />
      <path d="M220 101h36v40h-36Z" fill="#15a6a0" stroke="#08384c" strokeLinejoin="round" strokeWidth="5" />
      <path d="m259 124 44 31" stroke="#08384c" strokeLinecap="round" strokeWidth="5" />
      <path d="m302 153 24 39-41-14Z" fill="#b9ebe3" stroke="#08384c" strokeLinejoin="round" strokeWidth="4" />
    </svg>
  );
}
