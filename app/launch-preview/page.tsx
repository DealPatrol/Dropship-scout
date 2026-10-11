import { LaunchWorkbench } from '@/components/dashboard/launch-workbench'
import { SiteFrame } from '@/components/marketing/site-frame'
import { pageMetadata } from '@/lib/seo'
export const metadata = pageMetadata({ title: 'Profit-first launch workspace', description: 'Calculate advertising limits, assemble a campaign draft, and track your product test. Try the interactive preview before signing up.', path: '/launch-preview' })
export default function LaunchPreviewPage() { return <SiteFrame><LaunchWorkbench preview /></SiteFrame> }
