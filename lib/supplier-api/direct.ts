import { ensureSchema, sql } from '@/lib/database'
import type { PlaceOrderResult, RouteGroup, RouteOrderInput } from '@/lib/commerce/order-routing'

async function changeStock(itemId: string, quantity: number, direction: 'decrement' | 'restore'): Promise<boolean> {
  await ensureSchema()
  const rows = await sql`
    update supplier_products
    set stock = case
          when stock is null then null
          when ${direction} = 'decrement' then stock - ${quantity}
          else stock + ${quantity}
        end,
        updated_at = now()
    where id = ${itemId}::uuid
      and (
        stock is null
        or ${direction} = 'restore'
        or stock >= ${quantity}
      )
    returning id
  `
  return rows.length > 0
}

export async function placeDirectOrder(group: RouteGroup, _input: RouteOrderInput): Promise<PlaceOrderResult> {
  const changed: { id: string; quantity: number }[] = []
  for (const item of group.items) {
    if (!item.supplierProductId) {
      return { status: 'rejected', reason: 'Direct supplier product is missing.' }
    }
    const ok = await changeStock(item.supplierProductId, item.quantity, 'decrement')
    if (!ok) {
      for (const previous of changed) {
        await changeStock(previous.id, previous.quantity, 'restore')
      }
      return { status: 'rejected', outOfStock: true, reason: `${item.title} is out of stock.` }
    }
    changed.push({ id: item.supplierProductId, quantity: item.quantity })
  }
  return {
    status: 'accepted',
    externalOrderId: `direct-${group.orderNumber}`,
    sandbox: true,
    chargedCostCents: group.costCents,
  }
}

export async function cancelDirectOrder(group: RouteGroup): Promise<void> {
  for (const item of group.items) {
    if (!item.supplierProductId) continue
    await changeStock(item.supplierProductId, item.quantity, 'restore')
  }
}
