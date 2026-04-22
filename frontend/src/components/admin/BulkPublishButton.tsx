'use client'

import { useSelection } from '@payloadcms/ui'
import { useState } from 'react'

export function BulkPublishButton() {
  const { selected } = useSelection()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const selectedIds = Object.entries(selected ?? {})
    .filter(([, v]) => v === true)
    .map(([id]) => id)

  const handlePublish = async () => {
    setLoading(true)
    setMessage('')
    try {
      const res = await fetch('/api/listings/bulk-publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
        credentials: 'include',
      })
      const data = await res.json()
      setMessage(`Опубликовано: ${data.updated}`)
      setTimeout(() => window.location.reload(), 800)
    } catch {
      setMessage('Ошибка')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
      <button
        onClick={handlePublish}
        disabled={loading || selectedIds.length === 0}
        style={{
          background: selectedIds.length > 0 ? '#16a34a' : '#d1d5db',
          color: 'white',
          border: 'none',
          borderRadius: 6,
          padding: '7px 18px',
          fontWeight: 600,
          fontSize: 13,
          cursor: selectedIds.length > 0 && !loading ? 'pointer' : 'not-allowed',
          opacity: loading ? 0.7 : 1,
          transition: 'background 0.2s',
        }}
      >
        {loading
          ? 'Публикация...'
          : selectedIds.length > 0
          ? `✓ Опубликовать выбранные (${selectedIds.length})`
          : 'Выберите объявления'}
      </button>
      {message && (
        <span style={{ color: '#16a34a', fontSize: 13, fontWeight: 600 }}>{message}</span>
      )}
    </div>
  )
}
