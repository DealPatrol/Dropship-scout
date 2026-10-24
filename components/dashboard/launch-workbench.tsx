'use client'

import { useRef, useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { ArrowRight, Download, Save, Plus, Trash2, FlaskConical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { CheckoutButton } from '@/components/marketing/checkout-button'
import { SignupLink } from '@/components/marketing/signup-link'
import { PRO_MONTHLY_PRICE_USD } from '@/lib/billing'
import { calculateLaunchEconomics, type LaunchEconomicsInput, type LaunchEconomicsResult } from '@/lib/launch-economics'
import { buildLaunchCampaign, launchWorkspaceCsv, evaluateLaunchExperiment, type LaunchWorkspaceInput } from '@/lib/launch-workspace'

const initial: LaunchWorkspaceInput = {
  title: '', audience: '', benefit: '', supplierUrl: '',
  evidence: { supplierVerified: false, shippingVerified: false, demandVerified: false, checkedAt: '' },
  economics: { sellPrice: 39, unitCost: 12, shippingCost: 5, paymentFeePercent: 2.9, paymentFeeFlat: 0.3, platformFeePercent: 5, returnsReservePercent: 5, adCostPerOrder: 8, testBudget: 100, targetProfitPerOrder: 5 },
  experiment: { spend: 0, orders: 0, revenue: 0, refunds: 0 },
}
const economicFields: [keyof LaunchEconomicsInput, string][] = [
  ['sellPrice', 'Total order revenue, including charged shipping ($)'], ['unitCost', 'Product cost ($)'], ['shippingCost', 'Shipping per order ($)'],
  ['paymentFeePercent', 'Payment fee (%)'], ['paymentFeeFlat', 'Fixed payment fee ($)'], ['platformFeePercent', 'Platform fee (%)'],
  ['returnsReservePercent', 'Returns allowance (%)'], ['adCostPerOrder', 'Expected acquisition cost ($)'], ['testBudget', 'Advertising test budget ($)'], ['targetProfitPerOrder', 'Target profit per order ($)'],
]
type SavedLaunch = { id: string; title: string; payload: LaunchWorkspaceInput }
type SupplierProduct = { id: string; title: string; costCents: number; shippingCents: number; provider: string; externalId: string; available: boolean }
async function fetcher(url: string) {
  const response = await fetch(url)
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'Could not load this workspace.')
  return data
}
function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const a = document.createElement('a'); a.href = url; a.download = name; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
function LaunchUpgradeOffer() {
  return (
    <div className="rounded-md border border-primary/30 bg-primary/5 p-3">
      <p className="text-sm">Pro is ${PRO_MONTHLY_PRICE_USD}/month and includes 50 saved launches. Stripe collects the card.</p>
      <div className="mt-3">
        <CheckoutButton source="launch-limit">Continue to Pro checkout</CheckoutButton>
      </div>
    </div>
  )
}
export function LaunchWorkbench({ preview = false }: { preview?: boolean }) {
  const [form, setForm] = useState<LaunchWorkspaceInput>(initial)
  const [selected, setSelected] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [upgrade, setUpgrade] = useState(false)
  const [listingMessage, setListingMessage] = useState('')
  const savedSnapshot = useRef(JSON.stringify(initial))
  function switchWorkspace(next: LaunchWorkspaceInput, id: string | null) {
    if (busy) return
    if (JSON.stringify(form) !== savedSnapshot.current && !window.confirm('Discard unsaved changes to this launch?')) return
    setForm(next); setSelected(id); savedSnapshot.current = JSON.stringify(next); setMessage(''); setListingMessage(''); setUpgrade(false)
  }
  const { data, error, mutate } = useSWR<{ launches: SavedLaunch[]; limit: number; plan: string }>(preview ? null : '/api/launches', fetcher)
  const { data: storeCosts } = useSWR<{ platformFeeBps: number }>(preview ? null : '/api/store/listings', fetcher)
  const { data: suppliers } = useSWR<{ products: SupplierProduct[] }>(preview ? null : '/api/suppliers/import', fetcher)
  const missingEvidence = [!form.evidence.supplierVerified && 'Confirm supplier availability and product cost.', !form.evidence.shippingVerified && 'Confirm shipping cost for the destination.', !form.evidence.demandVerified && 'Add evidence of customer interest.'].filter((x): x is string => Boolean(x))
  let economics: LaunchEconomicsResult | undefined; let economicsError = ''
  try { economics = calculateLaunchEconomics(form.economics, missingEvidence) } catch (e) { economicsError = e instanceof Error ? e.message : 'Check your costs.' }
  const draft = buildLaunchCampaign(form)
  const actual = evaluateLaunchExperiment(form)
  const experimentInvalid = !Object.values(form.experiment).every(value => Number.isFinite(value) && value >= 0) || form.experiment.refunds > form.experiment.revenue || !Number.isInteger(form.experiment.orders)
  async function createStoreDraft() {
    setBusy(true); setListingMessage('')
    try {
      const response = await fetch('/api/store/listings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ supplierProductId: form.supplierProductId, title: form.title, priceCents: Math.round(form.economics.sellPrice * 100), description: draft.listingDescription, published: false }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Could not create listing draft.')
      setListingMessage('Unpublished store draft created. Review it in Your store before publishing.')
    } catch (e) { setListingMessage(e instanceof Error ? e.message : 'Could not create listing draft.') } finally { setBusy(false) }
  }
  async function save() {
    setBusy(true); setMessage('')
    try {
      setUpgrade(false)
      const response = await fetch(selected ? `/api/launches/${selected}` : '/api/launches', { method: selected ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const result = await response.json()
      if (!response.ok) {
        if (result.code === 'PLAN_LIMIT' && data?.plan !== 'pro') setUpgrade(true)
        throw new Error(result.error || 'Could not save.')
      }
      setSelected(result.launch.id); savedSnapshot.current = JSON.stringify(form); await mutate(); setMessage('Launch saved to your account.')
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Could not save.') } finally { setBusy(false) }
  }
  async function remove() {
    if (!selected) return
    setBusy(true)
    try {
      const response = await fetch(`/api/launches/${selected}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Could not delete launch.')
      setForm(initial); setSelected(null); savedSnapshot.current = JSON.stringify(initial); await mutate(); setMessage('Launch deleted.')
    } catch(e) { setMessage(e instanceof Error ? e.message : 'Could not delete.') } finally { setBusy(false) }
  }
  const money = (n: number | null) => n === null ? '—' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
  return <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-primary text-sm font-medium flex items-center gap-2"><FlaskConical className="h-4 w-4" /> Dropship Scout · Launch workspace</p><h1 className="text-3xl font-semibold mt-2">Know your numbers. Test your offer.</h1><p className="text-muted-foreground mt-2 max-w-2xl">One place for supplier evidence, advertising limits, campaign drafts, and actual results. Calculations use your assumptions, not a sales forecast.</p></div>
      {preview ? <div className="flex flex-wrap gap-2"><SignupLink href="/auth/sign-up" location="launch-preview"><Button>Create a free account <ArrowRight className="h-4 w-4 ml-2" /></Button></SignupLink><SignupLink href="/auth/sign-up?plan=pro" location="launch-preview-pro"><Button variant="outline">Continue to Pro</Button></SignupLink></div> : <Button variant="outline" disabled={busy} onClick={() => switchWorkspace(initial, null)}><Plus className="h-4 w-4 mr-2" />New launch</Button>}
    </div>
    {preview && <p className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">Interactive preview. Starting costs are illustrative. Nothing is saved, published, or purchased.</p>}
    {error && <p role="alert" className="text-destructive">{error.message}</p>}
    {!preview && data && <div className="flex flex-wrap items-center gap-2"><span className="text-sm text-muted-foreground">Saved launches: {data.launches.length}/{data.limit}</span>{data.launches.map(item => <Button key={item.id} size="sm" variant={selected === item.id ? 'default' : 'outline'} disabled={busy} onClick={() => switchWorkspace(item.payload,item.id)}>{item.title}</Button>)}<Link className="text-sm text-primary underline" href="/dashboard/settings">Manage Pro</Link></div>}
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card><CardHeader><CardTitle>1. Choose the offer</CardTitle></CardHeader><CardContent className="space-y-4">
          {!preview && <label className="block text-sm">Start from an imported supplier product<select className="mt-2 block w-full rounded-md border border-input bg-background p-2" value="" disabled={busy} onChange={e => {const p=suppliers?.products.find(p=>p.id===e.target.value);if(p){switchWorkspace({...initial,supplierProductId:p.id,title:p.title,economics:{...initial.economics,unitCost:p.costCents/100,shippingCost:p.shippingCents/100,platformFeePercent:(storeCosts?.platformFeeBps ?? 500)/100},supplierUrl:'',evidence:{...initial.evidence}},null)}}}><option value="">Choose a product (or enter your own below)</option>{suppliers?.products.filter(p=>p.available).map(p=><option key={p.id} value={p.id}>{p.title} · {p.provider}</option>)}</select><span className="block text-xs text-muted-foreground mt-1">Imported costs still need a destination quote. <Link className="underline" href="/dashboard/suppliers">Import a supplier product</Link></span></label>}
          {([['title','Product / offer name'],['audience','Who is it for?'],['benefit','What verified benefit are you selling?'],['supplierUrl','Supplier or evidence link (https://…)']] as const).map(([key,label])=><label key={key} className="block text-sm">{label}<Input disabled={busy} className="mt-2" value={form[key]} maxLength={key==='supplierUrl'?2000:key==='title'?160:500} onChange={e=>setForm({...form,[key]:e.target.value})} /></label>)}
          <div className="rounded-md bg-secondary/50 p-3 space-y-3">{([['supplierVerified','I checked current availability and unit cost.'],['shippingVerified','I checked shipping for my intended destination.'],['demandVerified','I have customer-interest evidence, beyond an AI score.']] as const).map(([key,label])=><label key={key} className="flex gap-2 text-sm items-start"><input type="checkbox" disabled={busy} checked={form.evidence[key]} onChange={e=>setForm({...form,evidence:{...form.evidence,[key]:e.target.checked,checkedAt:new Date().toISOString()}})} />{label}</label>)}<p className="text-xs text-muted-foreground">These are your attestations. The app does not independently verify the source. {form.evidence.checkedAt && `Last recorded ${new Date(form.evidence.checkedAt).toLocaleDateString()}.`}</p></div>
        </CardContent></Card>
        <Card><CardHeader><CardTitle>2. Set a profitable test</CardTitle></CardHeader><CardContent className="grid sm:grid-cols-2 gap-4"><p className="sm:col-span-2 text-xs text-muted-foreground">Order revenue includes any shipping you charge the buyer, before taxes. Shipping cost is what you pay to fulfill the order. The default platform allowance is 5%; adjust it for your channel. Tax, duties and overhead are excluded.</p>{economicFields.map(([key,label])=><label className="text-sm" key={key}>{label}<Input disabled={busy} className="mt-2" type="number" min={key==='sellPrice'?0.01:0} max={key.endsWith('Percent')?100:undefined} step="0.01" value={Number.isFinite(form.economics[key])?form.economics[key]:''} onChange={e=>setForm({...form,economics:{...form.economics,[key]:e.target.value===''?NaN:Number(e.target.value)}})} /></label>)}</CardContent></Card>
        <Card><CardHeader><CardTitle>3. Campaign draft</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-xs text-muted-foreground">Templates assembled from your inputs. Review product claims and policies before publishing. No paid AI generation runs here.</p><h3 className="font-medium">{draft.listingTitle}</h3><p className="whitespace-pre-wrap text-sm">{draft.listingDescription}</p><div><h4 className="text-sm font-medium">Three hooks to test</h4><ul className="list-disc pl-5 text-sm space-y-2 mt-2">{draft.hooks.map((hook,i)=><li key={i}>{hook}</li>)}</ul></div><div><h4 className="text-sm font-medium">Short video script</h4><p className="text-sm whitespace-pre-wrap mt-2">{draft.videoScript}</p></div><ul className="text-sm list-disc pl-5 space-y-1">{draft.checklist.map((item,i)=><li key={i}>{item}</li>)}</ul><div className="flex flex-wrap gap-2"><Button variant="outline" disabled={!!economicsError || !form.title.trim()} onClick={()=>download('launch-campaign.json',JSON.stringify({form,economics,draft},null,2),'application/json')}><Download className="h-4 w-4 mr-2" />Campaign package</Button><Button variant="outline" disabled={!!economicsError || !form.title.trim()} onClick={()=>download('launch-product.csv',launchWorkspaceCsv(form),'text/csv;charset=utf-8')}><Download className="h-4 w-4 mr-2" />Product CSV</Button>{!preview && form.supplierProductId && <Button disabled={busy || !!economicsError || !form.title.trim()} onClick={createStoreDraft}>Create unpublished listing</Button>}{preview ? <SignupLink href="/auth/sign-up" location="launch-preview-store"><Button variant="outline">Open store</Button></SignupLink> : <Button asChild variant="outline"><Link href="/dashboard/store">Open store</Link></Button>}</div><p aria-live="polite" className="text-sm">{listingMessage}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>4. Record the actual test</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-sm text-muted-foreground">Enter totals for this product and test period. Refunds are dollar amounts; revenue is before refunds. This ledger is manual, not automatically synced from ad accounts.</p><div className="grid sm:grid-cols-2 gap-4">{(['spend','orders','revenue','refunds'] as const).map(key=><label key={key} className="text-sm capitalize">{key}{key==='orders'?'':' ($)'}<Input disabled={busy} className="mt-2" type="number" min="0" step={key==='orders'?1:0.01} value={form.experiment[key]} onChange={e=>setForm({...form,experiment:{...form.experiment,[key]:Number(e.target.value)}})} /></label>)}</div>{experimentInvalid || economicsError ? <p role="alert" className="text-sm text-destructive">Check experiment totals. Orders must be whole numbers, and refunds cannot exceed revenue.</p> : <div className="grid sm:grid-cols-3 gap-3">{[['Contribution after test', money(actual.netContribution)], ['Actual acquisition cost', money(actual.acquisitionCost)], ['Actual ROAS', actual.roas === null ? 'No ad spend' : `${actual.roas.toFixed(2)}×`]].map(([label,value])=><div key={label} className="rounded-md bg-secondary/50 p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="font-semibold text-lg mt-1">{value}</p></div>)}<p className="sm:col-span-3 text-sm">{actual.status === 'insufficient-data' ? 'No completed orders recorded yet.' : actual.status === 'positive-contribution' ? 'This test has positive estimated contribution. Check repeatability before increasing spend.' : 'Revise the offer or stop the test before increasing spend.'}</p></div>}<p className="text-xs text-muted-foreground">Product and shipping costs are estimates from step 2. Taxes, overhead, and supplier credits are outside this calculation.</p></CardContent></Card>
      </div>
      <div className="space-y-4 lg:sticky lg:top-4 self-start"><Card><CardHeader><CardTitle>Merchandising manager</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-xs text-muted-foreground">A rules-based decision assistant. It evaluates costs and evidence; it does not predict demand.</p>{economicsError?<p role="alert" className="text-destructive text-sm">{economicsError}</p>:economics&&<><div className="grid grid-cols-2 gap-3">{[['Profit after ads',money(economics.netProfitPerOrder)],['Net margin',`${economics.netMarginPercent.toFixed(1)}%`],['Break-even acquisition cost',money(economics.breakEvenCAC)],['Target acquisition ceiling',money(economics.maxCACForTargetProfit)],['Break-even ROAS',economics.breakEvenROAS===null?'Not viable':`${economics.breakEvenROAS.toFixed(2)}×`],['Orders test budget could fund',economics.affordableTestOrders===null?'Set ad cost':String(economics.affordableTestOrders)]].map(([label,value])=><div className="bg-secondary/50 p-3 rounded-md" key={label}><p className="text-xs text-muted-foreground">{label}</p><p className="text-lg font-semibold mt-1">{value}</p></div>)}</div><p className="text-lg capitalize font-semibold">{economics.recommendation === 'test' ? 'Ready for a controlled test' : economics.recommendation === 'stop' ? 'Revise before spending' : 'Review missing evidence'}</p><ul className="text-sm list-disc pl-5 space-y-2">{[...economics.reasons, ...economics.missingEvidence].map((reason,i)=><li key={i}>{reason}</li>)}</ul></>}
      {!preview&&<div className="flex gap-2"><Button disabled={busy||!!economicsError||experimentInvalid} onClick={save} className="flex-1"><Save className="h-4 w-4 mr-2" />{busy?'Saving…':'Save launch'}</Button>{selected&&<Button variant="outline" disabled={busy} aria-label="Delete selected launch" onClick={remove}><Trash2 className="h-4 w-4" /></Button>}</div>}<div className="space-y-3"><p aria-live="polite" className="text-sm">{message}</p>{upgrade && <LaunchUpgradeOffer />}</div></CardContent></Card><p className="text-xs text-muted-foreground">Free: 3 saved launches. Pro: 50. Campaign drafts and calculations do not incur generation fees. Publishing and fulfillment remain separate, approved actions.</p></div>
    </div>
  </div>
}
