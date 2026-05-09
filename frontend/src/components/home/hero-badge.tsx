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
      {/* №1 badge with pulse */}
      <motion.span
        className="relative flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-black text-[12px] leading-none flex-shrink-0"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, duration: 0.4, type: 'spring', stiffness: 260, damping: 18 }}
      >
        <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-30" />
        №1
      </motion.span>

      <span className="text-[12.5px] font-semibold text-zinc-900 tracking-tight">
        Маркетплейс земельных участков в Казахстане
      </span>

      <span className="w-1 h-1 rounded-full bg-zinc-300 flex-shrink-0" />

      <span className="text-[12px] font-medium text-zinc-500 whitespace-nowrap">
        с 2021 года
      </span>
    </motion.div>
  );
}
