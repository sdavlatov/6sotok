'use client';
import { useEffect } from 'react';

const LS_KEY = '6sotok_viewed';
const MAX = 30;

export function ViewTracker({ id, slug }: { id: string; slug?: string }) {
  useEffect(() => {
    try {
      const keys = [id, ...(slug && slug !== id ? [slug] : [])];
      const prev: string[] = JSON.parse(localStorage.getItem(LS_KEY) ?? '[]');
      const next = [...keys, ...prev.filter(x => !keys.includes(x))].slice(0, MAX);
      localStorage.setItem(LS_KEY, JSON.stringify(next));
    } catch {}

    fetch('/api/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    }).catch(() => {});
  }, [id, slug]);

  return null;
}
