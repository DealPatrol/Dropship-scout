import { ProfitCalculator } from '@/components/marketing/profit-calculator'
import { platformFeeBps, stripeFeeConfig } from '@/lib/commerce/modes'
import {
  isProfitQuote,
  isProfitResult,
  parseProfitQuote,
  profitFieldsFromSearch,
  runProfitQuote,
  type ProfitFeeDefaults,
} from '@/lib/marketing/profit-calculator'

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

export function ProfitCalculatorPanel({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const card = stripeFeeConfig()
  const fees: ProfitFeeDefaults = {
    paymentFeePercent: card.bps / 100,
    paymentFeeFlat: card.fixedCents / 100,
    platformFeePercent: platformFeeBps() / 100,
  }
  const fields = profitFieldsFromSearch(searchParams, fees)
  const priced = firstParam(searchParams.price) !== undefined
  const parsed = priced ? parseProfitQuote(fields) : null
  const outcome = parsed && isProfitQuote(parsed) ? runProfitQuote(parsed) : null
  const initialResult = outcome && isProfitResult(outcome) ? outcome : null
  const initialError = parsed && !isProfitQuote(parsed)
    ? parsed.error
    : outcome && !isProfitResult(outcome)
      ? outcome.error
      : null

  return (
    <ProfitCalculator
      fields={fields}
      fees={fees}
      initialResult={initialResult}
      initialError={initialError}
    />
  )
}
