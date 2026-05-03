'use client';
import { useEffect } from 'react';

export function ViewTracker({ id }: { id: string }) {
  useEffect(() => {
    fetch('/api/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    }).catch(() => {});
  }, [id]);

  return null;
}
