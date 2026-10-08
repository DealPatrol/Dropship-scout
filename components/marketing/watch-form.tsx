'use client'

import { useState } from 'react'
import type { WatchSource } from '@/lib/watch-email'

export function WatchForm({ source }: { source: WatchSource }) {
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState<string | null>(null)

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setStatus('saving')
    setMessage(null)
    try {
      const response = await fetch('/api/watch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source, company }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setStatus('error')
        setMessage(typeof data.error === 'string' ? data.error : 'Could not save that email. Try again.')
        return
      }
      setStatus('done')
      setEmail('')
      setMessage('You’re on the list. Dropship Scout stores the address. This app does not send the email.')
    } catch {
      setStatus('error')
      setMessage('Could not save that email. Try again.')
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-lg border border-border bg-card p-5">
      <h2 className="text-lg font-semibold">Products to watch</h2>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
        Leave an email for a weekly shortlist. The address is stored in this app’s database. Dropship Scout does not send mail, so the note goes out only when the owner exports the list.
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor={`watch-email-${source}`}>Email</label>
        <input
          id={`watch-email-${source}`}
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={event => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm"
        />
        <button
          type="submit"
          disabled={status === 'saving' || status === 'done'}
          className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {status === 'saving' ? 'Saving…' : 'Join the list'}
        </button>
      </div>
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <label htmlFor={`watch-company-${source}`}>Company</label>
        <input
          id={`watch-company-${source}`}
          name="company"
          tabIndex={-1}
          autoComplete="off"
          value={company}
          onChange={event => setCompany(event.target.value)}
        />
      </div>
      {message && (
        <p role="status" className={`mt-3 text-sm ${status === 'error' ? 'text-destructive' : 'text-muted-foreground'}`}>
          {message}
        </p>
      )}
    </form>
  )
}
