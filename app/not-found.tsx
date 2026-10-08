import Link from 'next/link'
import { SiteFrame } from '@/components/marketing/site-frame'
import { Button } from '@/components/ui/button'
import { pageMetadata } from '@/lib/seo'

export const metadata = pageMetadata({
  title: 'Page not found',
  description: 'That page is not on Dropship Scout.',
  path: '/404',
  noIndex: true,
})

export default function NotFound() {
  return (
    <SiteFrame>
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <h1 className="text-3xl font-bold">Page not found</h1>
        <p className="mt-3 text-muted-foreground">That link does not match a page on Dropship Scout.</p>
        <Link href="/" className="inline-block mt-6"><Button>Back to the homepage</Button></Link>
      </div>
    </SiteFrame>
  )
}
