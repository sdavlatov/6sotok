'use client';
import { useState } from 'react';

export function CopyLinkButton({ id }: { id: string | number }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <button
      onClick={handleCopy}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        height: 32, padding: '0 12px', borderRadius: 8,
        background: copied ? 'var(--emerald-50, #ecf7f1)' : '#fff',
        border: `1px solid ${copied ? 'rgba(26,122,99,0.25)' : 'var(--line, #e3e1d9)'}`,
        color: copied ? 'var(--emerald-700, #15614e)' : 'var(--ink-500, #5b5e54)',
        fontSize: 13, fontWeight: 500, cursor: 'pointer',
        transition: 'all 0.2s', whiteSpace: 'nowrap',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
      }}
    >
      {copied ? (
        <>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5"/>
          </svg>
          Ссылка скопирована
        </>
      ) : (
        <>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98"/>
          </svg>
          Поделиться
        </>
      )}
    </button>
  );
}
