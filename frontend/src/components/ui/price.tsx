'use client';

import { useCurrency } from '@/context/currency-context';

/** Динамическая цена: пересчитывается ₸↔$ при переключении валюты в хедере. */
export function Price({
  value,
  compact,
  perSotka,
  className,
}: {
  value?: number | null;
  compact?: boolean;
  perSotka?: boolean;
  className?: string;
}) {
  const { format } = useCurrency();
  return <span className={className}>{format(value, { compact, perSotka })}</span>;
}
