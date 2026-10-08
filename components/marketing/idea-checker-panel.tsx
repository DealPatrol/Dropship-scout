import { IdeaChecker } from '@/components/marketing/idea-checker'
import { platformFeeBps, stripeFeeConfig } from '@/lib/commerce/modes'
import { ideaQueryFromSearch, isIdeaCheckResult, type IdeaCheckFees } from '@/lib/marketing/idea-check'

export function IdeaCheckerPanel({
  searchParams,
  shareBase = '/research/idea-checker',
}: {
  searchParams: Record<string, string | string[] | undefined>
  shareBase?: string
}) {
  const cardFee = stripeFeeConfig()
  const fees: IdeaCheckFees = {
    platformFeeBps: platformFeeBps(),
    stripeFeeBps: cardFee.bps,
    stripeFeeFixedCents: cardFee.fixedCents,
  }
  const query = ideaQueryFromSearch(searchParams, fees)
  const initialResult = query.result && isIdeaCheckResult(query.result) ? query.result : null
  const initialError = query.result && !isIdeaCheckResult(query.result) ? query.result.error : null
  return (
    <IdeaChecker
      fields={query.fields}
      fees={fees}
      initialResult={initialResult}
      initialError={initialError}
      shareBase={shareBase}
    />
  )
}
