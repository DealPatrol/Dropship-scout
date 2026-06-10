'use client'

import { useState, useEffect } from 'react'
import { getAnalytics } from '@/lib/api'
import type { AnalyticsData } from '@/lib/types'
import { cn } from '@/lib/utils'

interface AnalyticsSummaryProps {
  userId: string
}

export function AnalyticsSummary({ userId }: AnalyticsSummaryProps) {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAnalytics(userId)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [userId])

  // Hide entirely for new users with no saved products
  if (!loading && (!data || data.saved.total === 0)) return null

  return (
    <div className="px-6 pt-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Saved Products"
          value={loading ? null : String(data?.saved.total ?? 0)}
          loading={loading}
        />
        <StatCard
          label="Avg Score"
          value={loading ? null : `${data?.saved.avgScore ?? 0} / 10`}
          loading={loading}
        />
        <StatCard
          label="Pushed to Shopify"
          value={loading ? null : String(data?.shopify.totalPushed ?? 0)}
          loading={loading}
        />
        <StatCard
          label="Success Rate"
          value={loading ? null : `${data?.shopify.successRate ?? 0}%`}
          loading={loading}
          valueClass={
            !loading && data
              ? data.shopify.successRate >= 80
                ? 'text-green-400'
                : data.shopify.successRate >= 50
                ? 'text-yellow-400'
                : data.shopify.totalPushed + data.shopify.totalFailed === 0
                ? undefined
                : 'text-red-400'
              : undefined
          }
        />
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  loading,
  valueClass,
}: {
  label: string
  value: string | null
  loading: boolean
  valueClass?: string
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      {loading ? (
        <div className="h-6 bg-surface-raised rounded w-16 animate-pulse" />
      ) : (
        <p className={cn('text-xl font-semibold text-foreground', valueClass)}>{value}</p>
      )}
    </div>
  )
}
