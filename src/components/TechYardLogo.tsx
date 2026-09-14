import React from 'react';

interface TechYardLogoProps {
  /** Size variant */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Display variant:
   * - 'full': Icon with stacked "TECHYARD LABS" and "EMPOWERED BY INNOVATION"
   * - 'horizontal': Icon alongside "TechYard Labs" (great for navbars)
   * - 'mark': Icon only (great for avatars, icons, badges)
   */
  variant?: 'full' | 'horizontal' | 'mark';
  /** Additional custom class */
  className?: string;
  /** Subtitle override for horizontal variant (e.g. "AdServer Pro") */
  subtitle?: string;
  /** Whether to show glowing ambient light */
  withGlow?: boolean;
}

export const TechYardMark: React.FC<{ className?: string; size?: number }> = ({
  className = 'w-10 h-10',
  size,
}) => {
  return (
    <svg
      viewBox="0 0 500 430"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: (size * 430) / 500 } : undefined}
      aria-label="TechYard Labs Emblem"
    >
      <defs>
        {/* Left Wing Gradients (Warm: Red -> Orange -> Yellow) */}
        <linearGradient id="ty-l-wing" x1="50" y1="15" x2="243" y2="135" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#EF233C" />
          <stop offset="45%" stopColor="#FF6B00" />
          <stop offset="100%" stopColor="#FFB703" />
        </linearGradient>

        <linearGradient id="ty-l-core" x1="170" y1="135" x2="243" y2="295" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FF7A00" />
          <stop offset="50%" stopColor="#FFB703" />
          <stop offset="100%" stopColor="#FFD166" />
        </linearGradient>

        <linearGradient id="ty-l-mid" x1="170" y1="135" x2="220" y2="295" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E63946" />
          <stop offset="70%" stopColor="#D90429" />
          <stop offset="100%" stopColor="#C2185B" />
        </linearGradient>

        <linearGradient id="ty-l-bottom" x1="170" y1="295" x2="243" y2="408" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E91E63" />
          <stop offset="60%" stopColor="#D81B60" />
          <stop offset="100%" stopColor="#880E4F" />
        </linearGradient>

        {/* Right Wing Gradients (Cool: Cyan -> Royal Blue -> Violet) */}
        <linearGradient id="ty-r-wing" x1="450" y1="15" x2="257" y2="135" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00F5D4" />
          <stop offset="40%" stopColor="#00B4D8" />
          <stop offset="100%" stopColor="#0077B6" />
        </linearGradient>

        <linearGradient id="ty-r-core" x1="330" y1="135" x2="257" y2="295" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00B4D8" />
          <stop offset="60%" stopColor="#0077B6" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>

        <linearGradient id="ty-r-mid" x1="330" y1="135" x2="280" y2="295" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="60%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>

        <linearGradient id="ty-r-bottom" x1="330" y1="295" x2="257" y2="408" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="60%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#4C1D95" />
        </linearGradient>

        {/* Ambient Subtle Glow */}
        <filter id="ty-glow" x="-15%" y="-15%" width="130%" height="130%">
          <feGaussianBlur stdDeviation="10" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* ==================== LEFT WING (WARM) ==================== */}
      <g id="ty-left-half">
        {/* Upper Wing Blade */}
        <polygon points="50,15 243,135 170,135" fill="url(#ty-l-wing)" />
        {/* Upper Core Golden Facet */}
        <polygon points="170,135 243,135 243,295" fill="url(#ty-l-core)" />
        {/* Mid-Ruby Facet */}
        <polygon points="170,135 243,295 170,295" fill="url(#ty-l-mid)" />
        {/* Lower Magenta / Crimson Shield */}
        <polygon points="170,295 243,295 243,408 170,305" fill="url(#ty-l-bottom)" />
      </g>

      {/* ==================== RIGHT WING (COOL) ==================== */}
      <g id="ty-right-half">
        {/* Upper Wing Blade */}
        <polygon points="450,15 257,135 330,135" fill="url(#ty-r-wing)" />
        {/* Upper Core Blue Facet */}
        <polygon points="330,135 257,135 257,295" fill="url(#ty-r-core)" />
        {/* Mid-Violet Facet */}
        <polygon points="330,135 257,295 330,295" fill="url(#ty-r-mid)" />
        {/* Lower Purple / Indigo Shield */}
        <polygon points="330,295 257,295 257,408 330,305" fill="url(#ty-r-bottom)" />
      </g>
    </svg>
  );
};

export const TechYardLogo: React.FC<TechYardLogoProps> = ({
  size = 'md',
  variant = 'horizontal',
  className = '',
  subtitle,
  withGlow = true,
}) => {
  if (variant === 'mark') {
    const sizeClasses = {
      xs: 'w-6 h-6',
      sm: 'w-8 h-8',
      md: 'w-10 h-10',
      lg: 'w-14 h-14',
      xl: 'w-20 h-20',
    };
    return (
      <div className={`relative inline-flex items-center justify-center ${className}`}>
        {withGlow && (
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 via-cyan-500/20 to-purple-500/20 blur-xl rounded-full pointer-events-none" />
        )}
        <TechYardMark className={`${sizeClasses[size]} relative z-10 transition-transform duration-300 hover:scale-105`} />
      </div>
    );
  }

  if (variant === 'horizontal') {
    const markSizes = {
      xs: 'w-7 h-7',
      sm: 'w-8 h-8',
      md: 'w-9 h-9',
      lg: 'w-12 h-12',
      xl: 'w-16 h-16',
    };

    return (
      <div className={`inline-flex items-center gap-3 ${className}`}>
        <div className="relative shrink-0">
          {withGlow && (
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 via-cyan-500/25 to-purple-500/20 blur-md rounded-xl pointer-events-none" />
          )}
          <TechYardMark className={`${markSizes[size]} relative z-10`} />
        </div>

        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="font-extrabold tracking-tight text-white text-base sm:text-lg">
              TECHYARD
            </span>
            <span className="font-light tracking-wide text-cyan-400 text-base sm:text-lg">
              LABS
            </span>
          </div>

          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[9px] sm:text-[10px] tracking-[0.22em] uppercase font-semibold text-slate-400">
              {subtitle || 'EMPOWERED BY INNOVATION'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Variant === 'full' (Vertical stacked lockup, ideal for login card & hero)
  const markSize = size === 'xl' ? 'w-28 h-28' : size === 'lg' ? 'w-24 h-24' : 'w-20 h-20';

  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      <div className="relative mb-3.5">
        {withGlow && (
          <div className="absolute -inset-4 bg-gradient-to-r from-orange-500/25 via-cyan-500/30 to-purple-500/25 blur-2xl rounded-full pointer-events-none" />
        )}
        <TechYardMark className={`${markSize} relative z-10 transition-transform duration-300 hover:scale-105`} />
      </div>

      <div className="relative z-10">
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase font-sans">
          TECHYARD <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 font-extrabold">LABS</span>
        </h1>
        <p className="text-[10px] sm:text-xs font-semibold tracking-[0.24em] text-slate-400 uppercase mt-1">
          EMPOWERED BY INNOVATION
        </p>
      </div>
    </div>
  );
};
