import { SupplierComparison } from '@/components/marketing/supplier-comparison'
import {
  isSupplierComparison,
  parseSupplierComparison,
  supplierComparisonRequested,
  supplierFieldsFromSearch,
} from '@/lib/marketing/supplier-comparison'

export function SupplierComparisonPanel({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const fields = supplierFieldsFromSearch(searchParams)
  const parsed = supplierComparisonRequested(searchParams) ? parseSupplierComparison(fields) : null
  const initialResult = parsed && isSupplierComparison(parsed) ? parsed : null
  const initialError = parsed && !isSupplierComparison(parsed) ? parsed.error : null

  return (
    <SupplierComparison
      fields={fields}
      initialResult={initialResult}
      initialError={initialError}
    />
  )
}
