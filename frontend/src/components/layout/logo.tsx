export function Logo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-auto aspect-square">
        <circle cx="60" cy="60" r="58" fill="white" stroke="#E4E4E7" strokeWidth="2" />
        
        {/* Sky / Blue waves */}
        <path d="M10 60 C30 40, 70 40, 110 60 C90 20, 40 10, 10 60" fill="#A3D2F0" opacity="0.6" />
        <path d="M20 50 C40 35, 80 45, 115 50 C95 20, 50 20, 20 50" fill="#D0E9FA" opacity="0.8" />
        <path d="M30 65 C50 50, 90 55, 118 65 C100 35, 60 40, 30 65" fill="#EAF5FE" />

        {/* Fields / Green waves */}
        <path d="M2 70 C40 60, 80 75, 118 70 L118 100 C80 120, 40 120, 2 100 Z" fill="#2CA64E" />
        <path d="M4 82 C50 72, 90 90, 110 82 L110 115 C70 125, 30 115, 4 95 Z" fill="#1B853A" />
        <path d="M15 95 C60 85, 90 105, 105 100 L105 120 C70 130, 40 125, 15 110 Z" fill="#066F36" />

        {/* Number '6' */}
        <path d="M35 85 C25 85, 15 75, 15 55 C15 35, 30 20, 45 20 L50 20 L45 35 C35 35, 30 40, 30 55 C35 48, 45 48, 50 55 C55 62, 50 75, 40 82 C38 84, 36 85, 35 85 Z M35 70 C38 70, 40 65, 38 60 C36 55, 32 55, 32 60 C32 65, 34 70, 35 70 Z" fill="#066F36" />
        
        {/* 'COTOK' abstract representation */}
        <text x="45" y="70" fontFamily="sans-serif" fontSize="20" fontWeight="900" fill="#066F36">
          COTOK
        </text>
      </svg>
    </div>
  );
}
