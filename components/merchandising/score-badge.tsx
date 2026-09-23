import { cn } from '@/lib/utils'

function scoreColor(score: number): string {
  if (score >= 85) return 'text-green-400'
  if (score >= 70) return 'text-primary'
  if (score >= 55) return 'text-yellow-400'
  return 'text-red-400'
}

function scoreBg(score: number): string {
  if (score >= 85) return 'bg-green-400'
  if (score >= 70) return 'bg-primary'
  if (score >= 55) return 'bg-yellow-400'
  return 'bg-red-400'
}

export function ScoreBadge({ score, label = 'Opportunity' }: { score: number; label?: string }) {
  return (
    <div className="flex items-center gap-1.5" title={`${label} Score: ${score}/100`}>
      <span className={cn('text-sm font-bold tabular-nums', scoreColor(score))}>{score}</span>
      <span className="text-xs text-muted-foreground">/100</span>
    </div>
  )
}

export function ScoreBar({ score, className }: { score: number; className?: string }) {
  return (
    <div className={cn('h-1.5 bg-surface-raised rounded-full overflow-hidden', className)}>
      <div
        className={cn('h-full rounded-full transition-all', scoreBg(score))}
        style={{ width: `${Math.min(100, score)}%` }}
      />
    </div>
  )
}

export function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const stroke = 8
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - Math.min(score, 100) / 100)

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-surface-raised"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn(
            score >= 85 ? 'stroke-green-400' : score >= 70 ? 'stroke-primary' : score >= 55 ? 'stroke-yellow-400' : 'stroke-red-400'
          )}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-bold text-foreground tabular-nums">{score}</span>
        <span className="text-xs text-muted-foreground">/100</span>
      </div>
    </div>
  )
}
