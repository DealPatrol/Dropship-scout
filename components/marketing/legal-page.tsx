import { Breadcrumbs } from '@/components/marketing/breadcrumbs'
import { SiteFrame } from '@/components/marketing/site-frame'

export interface LegalSection {
  heading: string
  body: React.ReactNode
}

export function LegalPage({
  title,
  intro,
  updated,
  sections,
  path,
}: {
  title: string
  intro: React.ReactNode
  updated?: string
  sections: LegalSection[]
  path: string
}) {
  return (
    <SiteFrame>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: title, href: path }]} />
        <h1 className="mt-3 text-4xl font-bold tracking-tight">{title}</h1>
        {updated ? <p className="mt-2 text-sm text-muted-foreground">Last updated {updated}</p> : null}
        <div className="mt-6 text-lg text-muted-foreground leading-relaxed">{intro}</div>
        <div className="mt-10 flex flex-col gap-8">
          {sections.map(section => (
            <section key={section.heading}>
              <h2 className="text-xl font-semibold">{section.heading}</h2>
              <div className="mt-3 text-sm text-muted-foreground leading-relaxed space-y-3">{section.body}</div>
            </section>
          ))}
        </div>
      </div>
    </SiteFrame>
  )
}
