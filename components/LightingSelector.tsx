
import React from 'react';
import type { Lighting } from '../types';

interface LightingSelectorProps {
  label: string;
  value: Lighting;
  options: readonly Lighting[];
  onChange: (value: Lighting) => void;
}

// A generic person silhouette to use as the subject in each icon
const Subject: React.FC<{ fill?: string; opacity?: number }> = ({ fill = 'currentColor', opacity = 0.8 }) => (
    <path 
      d="M12 11a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM12 13c-2.67 0-8 1.34-8 4v1h16v-1c0-2.66-5.33-4-8-4z" 
      fill={fill}
      opacity={opacity}
    />
);

const lightingIcons: Record<Lighting, React.ReactNode> = {
  'None': (
    <svg viewBox="0 0 24 24">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2.25c.414 0 .75.336.75.75v.5a.75.75 0 01-1.5 0v-.5c0-.414.336-.75.75-.75zM5.106 5.106a.75.75 0 011.06 0l.354.354a.75.75 0 01-1.06 1.06l-.354-.354a.75.75 0 010-1.06zM3 12a.75.75 0 01.75-.75h.5a.75.75 0 010 1.5h-.5A.75.75 0 013 12zm2.106 6.894a.75.75 0 010 1.06l-.354.354a.75.75 0 01-1.06-1.06l.354-.354zM12 21a.75.75 0 01.75.75v.5a.75.75 0 01-1.5 0v-.5a.75.75 0 01.75-.75zm6.894-2.106a.75.75 0 011.06 0l.354-.354a.75.75 0 011.06 1.06l-.354.354a.75.75 0 01-1.06 0zM21 12a.75.75 0 01-.75.75h-.5a.75.75 0 010-1.5h.5a.75.75 0 01.75.75zm-2.106-6.894a.75.75 0 010-1.06l.354-.354a.75.75 0 011.06 1.06l-.354.354a.75.75 0 01-1.06 0z" fill="#64748b" opacity="0.4"/>
      <path d="M12 18a6 6 0 100-12 6 6 0 000 12z" stroke="#64748b" strokeWidth="1.5" strokeDasharray="2 2" fill="none" opacity="0.4"/>
    </svg>
  ),
  'Cinematic': (
    <svg viewBox="0 0 24 24">
      <defs><filter id="glow"><feGaussianBlur stdDeviation="1.5" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
      <Subject fill="#334155"/>
      <circle cx="5" cy="9" r="2" fill="#fbbf24" filter="url(#glow)"/>
      <circle cx="19" cy="11" r="1.5" fill="#60a5fa" filter="url(#glow)" opacity="0.7"/>
      <circle cx="16" cy="19" r="1.25" fill="#f43f5e" filter="url(#glow)"/>
    </svg>
  ),
  'Film Noir': (
    <svg viewBox="0 0 24 24">
        <Subject fill="#0f172a"/>
        <path d="M12 2L2 22h20L12 2z" fill="#000" opacity="0.4" style={{ clipPath: 'url(#clip-subject)' }} />
        <clipPath id="clip-subject"><path d="M12 11a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM12 13c-2.67 0-8 1.34-8 4v1h16v-1c0-2.66-5.33-4-8-4z" /></clipPath>
    </svg>
  ),
  'Natural Light': (
    <svg viewBox="0 0 24 24">
      <defs><linearGradient id="natural" x1="0%" y1="0%" x2="100%" y2="50%"><stop offset="0%" stopColor="#fef3c7" stopOpacity="0.8"/><stop offset="100%" stopColor="#fff" stopOpacity="0"/></linearGradient></defs>
      <Subject fill="#334155"/>
      <rect x="0" y="0" width="24" height="24" fill="url(#natural)" style={{ clipPath: 'url(#clip-subject)' }}/>
    </svg>
  ),
  'Morning Natural Light': (
    <svg viewBox="0 0 24 24">
      <defs><linearGradient id="morning" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#bae6fd" stopOpacity="0.6"/><stop offset="100%" stopColor="#bae6fd" stopOpacity="0"/></linearGradient></defs>
      <Subject fill="#334155"/>
      <rect x="0" y="0" width="24" height="24" fill="url(#morning)" style={{ clipPath: 'url(#clip-subject)' }}/>
    </svg>
  ),
  'Bright Daylight': (
    <svg viewBox="0 0 24 24">
      <defs><radialGradient id="daylight"><stop offset="0%" stopColor="#f0f9ff" stopOpacity="0.9"/><stop offset="100%" stopColor="#f0f9ff" stopOpacity="0"/></radialGradient></defs>
      <Subject fill="#334155"/>
      <circle cx="12" cy="-5" r="15" fill="url(#daylight)" style={{ clipPath: 'url(#clip-subject)' }} />
      <ellipse cx="12" cy="19" rx="4" ry="1" fill="black" opacity="0.1" />
    </svg>
  ),
  'Sunset / Golden Hour': (
    <svg viewBox="0 0 24 24">
      <defs><linearGradient id="golden" x1="0%" y1="50%" x2="100%" y2="50%"><stop offset="0%" stopColor="#fbbf24" stopOpacity="0.6"/><stop offset="100%" stopColor="#fbbf24" stopOpacity="0"/></linearGradient></defs>
      <Subject fill="#334155"/>
      <rect x="0" y="0" width="24" height="24" fill="url(#golden)" style={{ clipPath: 'url(#clip-subject)' }}/>
    </svg>
  ),
  'Blue Hour': (
    <svg viewBox="0 0 24 24">
      <defs><linearGradient id="blue" x1="0%" y1="50%" x2="100%" y2="50%"><stop offset="0%" stopColor="#6366f1" stopOpacity="0.6"/><stop offset="100%" stopColor="#6366f1" stopOpacity="0"/></linearGradient></defs>
      <Subject fill="#334155"/>
      <rect x="0" y="0" width="24" height="24" fill="url(#blue)" style={{ clipPath: 'url(#clip-subject)' }}/>
    </svg>
  ),
  'Night Cinematic': (
    <svg viewBox="0 0 24 24">
       <rect width="24" height="24" fill="#0f172a" rx="4"/>
      <defs><radialGradient id="night-light"><stop offset="10%" stopColor="#fbbf24" stopOpacity="0.8"/><stop offset="100%" stopColor="#fbbf24" stopOpacity="0"/></radialGradient></defs>
      <Subject fill="white" />
      <circle cx="18" cy="4" r="10" fill="url(#night-light)" style={{ clipPath: 'url(#clip-subject)' }} />
    </svg>
  ),
  'High Key': (
    <svg viewBox="0 0 24 24">
      <rect width="24" height="24" fill="#f8fafc" rx="4"/>
      <Subject fill="#94a3b8" opacity={1}/>
    </svg>
  ),
  'Low Key': (
    <svg viewBox="0 0 24 24">
      <rect width="24" height="24" fill="#1e293b" rx="4"/>
      <defs><linearGradient id="lowkey" x1="0%" y1="50%" x2="100%" y2="50%"><stop offset="0%" stopColor="white" stopOpacity="0.4"/><stop offset="30%" stopColor="white" stopOpacity="0"/></linearGradient></defs>
      <Subject fill="white"/>
      <rect x="0" y="0" width="24" height="24" fill="url(#lowkey)" style={{ clipPath: 'url(#clip-subject)' }}/>
    </svg>
  ),
  'Horror Dim Light': (
    <svg viewBox="0 0 24 24">
      <rect width="24" height="24" fill="#1e293b" rx="4"/>
      <defs><linearGradient id="horror" x1="50%" y1="100%" x2="50%" y2="0%"><stop offset="0%" stopColor="#cbd5e1" stopOpacity="0.6"/><stop offset="60%" stopColor="#cbd5e1" stopOpacity="0"/></linearGradient></defs>
      <Subject fill="white"/>
      <rect x="0" y="0" width="24" height="24" fill="url(#horror)" style={{ clipPath: 'url(#clip-subject)' }}/>
    </svg>
  ),
  'Neon Cyberpunk': (
    <svg viewBox="0 0 24 24">
      <defs><filter id="neon-glow"><feGaussianBlur stdDeviation="1" result="coloredBlur"/></filter></defs>
      <Subject fill="#334155"/>
      <path d="M16 4 C18 8, 18 16, 16 20" stroke="#d946ef" strokeWidth="1.5" fill="none" filter="url(#neon-glow)"/>
      <path d="M8 20 C6 16, 6 8, 8 4" stroke="#06b6d4" strokeWidth="1.5" fill="none" filter="url(#neon-glow)"/>
    </svg>
  ),
  'Candlelight / Firelight': (
    <svg viewBox="0 0 24 24">
      <rect width="24" height="24" fill="#1E1B18" rx="4"/>
      <defs><radialGradient id="candle"><stop offset="0%" stopColor="#f59e0b" stopOpacity="0.7"/><stop offset="100%" stopColor="#f59e0b" stopOpacity="0"/></radialGradient></defs>
      <Subject fill="white"/>
      <circle cx="12" cy="28" r="10" fill="url(#candle)" style={{ clipPath: 'url(#clip-subject)' }} />
    </svg>
  ),
  'Flashlight / Dramatic': (
    <svg viewBox="0 0 24 24">
      <rect width="24" height="24" fill="#0f172a" rx="4"/>
      <defs><polygon id="flashlight-beam" points="4,8 20,4 20,20 4,16" /></defs>
      <Subject fill="white"/>
      <rect width="24" height="24" fill="white" opacity="0.6" style={{ clipPath: 'url(#flashlight-beam) url(#clip-subject)' }}/>
    </svg>
  ),
};

export const LightingSelector: React.FC<LightingSelectorProps> = ({ label, value, options, onChange }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-indigo-700 mb-2">{label}</label>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
        {options.map((option) => {
          const isSelected = value === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={`flex flex-col items-center justify-start p-2 rounded-lg border transition-all duration-200 text-center aspect-square ${
                isSelected
                  ? 'bg-indigo-50 border-orange-400 shadow-sm'
                  : 'bg-white/40 border-slate-200 hover:border-indigo-300 hover:bg-white/60'
              }`}
              aria-pressed={isSelected}
            >
              <div className={`flex items-center justify-center h-10 w-10 mb-1 transition-colors`}>
                {lightingIcons[option]}
              </div>
              <span className={`text-[10px] leading-tight font-semibold transition-colors ${isSelected ? 'text-indigo-700' : 'text-slate-500'}`}>
                {option}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};