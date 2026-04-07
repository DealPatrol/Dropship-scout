'use client'

import * as React from 'react'
import { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastClose } from './toast'

interface ToastState {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
}

interface ToasterContextType {
  toast: (opts: Omit<ToastState, 'id'>) => void
}

const ToasterContext = React.createContext<ToasterContextType>({ toast: () => {} })

export function useToast() {
  return React.useContext(ToasterContext)
}

export function Toaster({ children }: { children?: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastState[]>([])

  const toast = React.useCallback((opts: Omit<ToastState, 'id'>) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, ...opts }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  return (
    <ToasterContext.Provider value={{ toast }}>
      {children}
      <ToastProvider>
        {toasts.map(t => (
          <Toast key={t.id} variant={t.variant}>
            {t.title && <ToastTitle>{t.title}</ToastTitle>}
            {t.description && <ToastDescription>{t.description}</ToastDescription>}
            <ToastClose />
          </Toast>
        ))}
        <ToastViewport />
      </ToastProvider>
    </ToasterContext.Provider>
  )
}
