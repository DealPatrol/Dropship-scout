'use client'

import { useState, useEffect, useCallback } from 'react'
import { getPushHistory } from '@/lib/api'
import type { PushHistoryEntry } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { History, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react'

interface PushHistoryViewProps {
  userId: string
}

export function PushHistoryView({ userId }: PushHistoryViewProps) {
  const [history, setHistory] = useState<PushHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getPushHistory(userId)
      setHistory(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="h-7 bg-surface-raised rounded w-40 animate-pulse mb-6" />
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 bg-surface-raised rounded-md animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto flex flex-col items-center justify-center py-20 gap-3">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" size="sm" onClick={load}>Try again</Button>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Push History</h1>
        <p className="text-sm text-muted-foreground mt-1">
          All products pushed to your Shopify store
        </p>
      </div>

      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <History className="h-10 w-10 text-muted-foreground mb-3" />
          <h3 className="text-base font-medium text-foreground">No push history</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Products you push to Shopify will appear here
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          {/* Table header — desktop */}
          <div className="hidden md:grid grid-cols-[1fr_100px_120px_160px_40px] gap-4 px-4 py-2.5 bg-surface text-xs font-medium text-muted-foreground border-b border-border">
            <span>Product</span>
            <span>Price</span>
            <span>Status</span>
            <span>Pushed at</span>
            <span />
          </div>

          <div className="divide-y divide-border">
            {history.map(entry => (
              <div
                key={entry.id}
                className="flex flex-col md:grid md:grid-cols-[1fr_100px_120px_160px_40px] gap-1 md:gap-4 px-4 py-3 items-start md:items-center hover:bg-surface-raised/50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{entry.productName}</p>
                  {entry.shopifyProductId && (
                    <p className="text-xs text-muted-foreground">ID: {entry.shopifyProductId}</p>
                  )}
                </div>
                <span className="text-sm text-foreground">${entry.sellPrice}</span>
                <div className="flex items-center gap-1.5">
                  {entry.status === 'success' ? (
                    <>
                      <CheckCircle className="h-3.5 w-3.5 text-green-400" />
                      <span className="text-xs font-medium text-green-400">Success</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3.5 w-3.5 text-destructive" />
                      <span className="text-xs font-medium text-destructive">Failed</span>
                    </>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(entry.pushedAt).toLocaleString()}
                </span>
                {entry.errorMessage && (
                  <span className="text-xs text-destructive truncate max-w-xs md:max-w-none col-span-full md:col-span-1">
                    {entry.errorMessage}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
