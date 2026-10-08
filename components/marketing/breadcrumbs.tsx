import Link from 'next/link'

export function Breadcrumbs({ items }: { items: { name: string; href: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {items.map((item, index) => {
          const last = index === items.length - 1
          return (
            <li key={`${item.href}-${item.name}`} className="flex items-center gap-2">
              {index > 0 && <span aria-hidden="true">/</span>}
              {last ? (
                <span aria-current="page" className="text-foreground">{item.name}</span>
              ) : (
                <Link href={item.href} className="hover:text-foreground">{item.name}</Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
