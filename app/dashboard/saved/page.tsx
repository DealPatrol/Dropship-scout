import { createClient } from '@/lib/supabase/server'
import { SavedProductsView } from '@/components/dashboard/saved-products-view'

export default async function SavedProductsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return <SavedProductsView userId={user?.id ?? ''} />
}
