import type { EmailAdapter } from 'payload'

/**
 * Минимальный email-адаптер Payload поверх Resend HTTP API — без доп. зависимостей.
 * Ключ берётся из RESEND_API_KEY (env). Если ключа нет, адаптер не подключается
 * (см. payload.config.ts) и Payload логирует письма в консоль, как раньше.
 *
 * ВАЖНО про отправителя: Resend шлёт письма только с адреса на подтверждённом
 * домене. Пока домен 6sotok.kz не подтверждён в Resend, работает лишь
 * onboarding@resend.dev и только на email владельца аккаунта. Для боевой рассылки
 * всем пользователям нужно подтвердить домен в Resend и задать EMAIL_FROM.
 */

type Addr = string | { address?: string; name?: string } | Array<string | { address?: string; name?: string }>

function toList(a: Addr | undefined): string[] {
  if (!a) return []
  const arr = Array.isArray(a) ? a : [a]
  return arr.map(x => (typeof x === 'string' ? x : x.address ?? '')).filter(Boolean)
}

export const resendAdapter = (opts: { apiKey: string; defaultFromAddress: string; defaultFromName: string }): EmailAdapter =>
  () => ({
    name: 'resend',
    defaultFromAddress: opts.defaultFromAddress,
    defaultFromName: opts.defaultFromName,
    sendEmail: async (message) => {
      const to = toList(message.to as Addr)
      const from = (message.from as string) || `${opts.defaultFromName} <${opts.defaultFromAddress}>`
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${opts.apiKey}`,
        },
        body: JSON.stringify({
          from,
          to,
          subject: message.subject ?? '',
          html: typeof message.html === 'string' ? message.html : undefined,
          text: typeof message.text === 'string' ? message.text : undefined,
        }),
      })
      if (!res.ok) {
        const detail = await res.text().catch(() => '')
        // не роняем запрос пользователя из-за письма — логируем
        console.error('[resend] send failed:', res.status, detail.slice(0, 300))
      }
      return res.json().catch(() => ({}))
    },
  })
