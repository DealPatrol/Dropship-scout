import type Stripe from 'stripe'
import { assertCommercePaymentsAllowed, connectCountry } from '@/lib/commerce/modes'
import { env } from '@/lib/env'
import { getStripe } from '@/lib/stripe'

export function recipientTransfersStatus(account: Stripe.V2.Core.Account): string {
  return account.configuration?.recipient?.capabilities?.stripe_balance?.stripe_transfers?.status ?? 'pending'
}

export async function createRecipientAccount(input: {
  email: string
  displayName: string
  userId: string
}): Promise<string> {
  assertCommercePaymentsAllowed()
  const account = await getStripe().v2.core.accounts.create({
    contact_email: input.email,
    display_name: input.displayName.slice(0, 100),
    dashboard: 'express',
    identity: { country: connectCountry() },
    defaults: {
      responsibilities: {
        fees_collector: 'application',
        losses_collector: 'application',
      },
    },
    configuration: {
      recipient: {
        capabilities: {
          stripe_balance: {
            stripe_transfers: { requested: true },
          },
        },
      },
    },
    include: ['configuration.recipient'],
    metadata: { userId: input.userId },
  })
  return account.id
}

export async function retrieveRecipientAccount(accountId: string): Promise<Stripe.V2.Core.Account> {
  return getStripe().v2.core.accounts.retrieve(accountId, {
    include: ['configuration.recipient'],
  })
}

export async function createRecipientOnboardingLink(accountId: string): Promise<string> {
  assertCommercePaymentsAllowed()
  const link = await getStripe().v2.core.accountLinks.create({
    account: accountId,
    use_case: {
      type: 'account_onboarding',
      account_onboarding: {
        configurations: ['recipient'],
        refresh_url: `${env.appUrl}/api/connect/refresh`,
        return_url: `${env.appUrl}/dashboard/store?connect=return`,
      },
    },
  })
  return link.url
}

export async function createRecipientDashboardLink(accountId: string): Promise<string> {
  assertCommercePaymentsAllowed()
  const stripe = getStripe()
  try {
    const login = await stripe.accounts.createLoginLink(accountId)
    return login.url
  } catch {
    const link = await stripe.v2.core.accountLinks.create({
      account: accountId,
      use_case: {
        type: 'account_update',
        account_update: {
          configurations: ['recipient'],
          refresh_url: `${env.appUrl}/api/connect/refresh`,
          return_url: `${env.appUrl}/dashboard/store`,
        },
      },
    })
    return link.url
  }
}
