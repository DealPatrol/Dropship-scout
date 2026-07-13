'use client'

import { useEffect, useState } from 'react'
import { getSavedProducts, deleteProduct } from '@/app/actions/products'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Trash2 } from 'lucide-react'

export function SavedProductsView() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const saved = await getSavedProducts()
        setProducts(saved)
      } catch (err) {
        console.error('Failed to load:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleDelete(id: number) {
    setDeletingId(id)
    try {
      await deleteProduct(id)
      setProducts(p => p.filter(x => x.id !== id))
    } catch (err) {
      console.error('Failed to delete:', err)
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-surface-raised rounded" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-semibold text-foreground mb-4">Saved Products</h1>
      <p className="text-sm text-muted-foreground mb-6">
        {products.length} product{products.length !== 1 ? 's' : ''} saved
      </p>
      
      {products.length === 0 ? (
        <Card>
          <CardContent className="py-12 flex flex-col items-center justify-center text-center">
            <div className="h-10 w-10 text-muted-foreground mb-3">📚</div>
            <h3 className="text-base font-medium text-foreground">No saved products yet</h3>
            <p className="text-sm text-muted-foreground mt-1">Search and save products from the dashboard</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product) => (
            <Card key={product.id}>
              <CardContent className="pt-4 flex flex-col h-full">
                {product.image && (
                  <img 
                    src={product.image} 
                    alt={product.title}
                    className="w-full h-40 object-cover rounded-md mb-3"
                  />
                )}
                <h3 className="font-medium text-foreground line-clamp-2">{product.title}</h3>
                {product.price && (
                  <p className="text-sm text-primary font-semibold mt-2">${product.price}</p>
                )}
                {product.supplier && (
                  <p className="text-xs text-muted-foreground mt-1">{product.supplier}</p>
                )}
                {product.notes && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{product.notes}</p>
                )}
                <div className="flex gap-2 mt-auto pt-3">
                  {product.url && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="flex-1"
                      onClick={() => window.open(product.url, '_blank')}
                    >
                      View
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={deletingId === product.id}
                    onClick={() => handleDelete(product.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
