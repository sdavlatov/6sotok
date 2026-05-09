'use client';

import { motion } from 'framer-motion';

export function HeroBadge() {
  return (
    <motion.div
      className="inline-flex items-center gap-2.5 mb-7 pl-1.5 pr-4 py-1 rounded-full bg-white border border-zinc-200 shadow-sm"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Medal badge */}
      <motion.span
        className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-400 text-white font-black text-[13px] leading-none shadow-sm"
        initial={{ scale: 0, rotate: -15 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.2, duration: 0.4, type: 'spring', stiffness: 260, damping: 18 }}
      >
        🥇
      </motion.span>

      <span className="text-[12.5px] font-semibold text-zinc-900 tracking-tight">
        Маркетплейс земельных участков в Казахстане
      </span>

      <span className="w-1 h-1 rounded-full bg-zinc-300 flex-shrink-0" />

      <span className="text-[12px] font-medium text-zinc-500 whitespace-nowrap">
        с 2024 года
      </span>
    </motion.div>
  );
}
