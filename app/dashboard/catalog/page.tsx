import { createClient } from '@/lib/supabase/server'
import { CatalogView } from '@/components/merchandising/catalog-view'

export default async function CatalogPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return <CatalogView userId={user?.id ?? ''} />
}
