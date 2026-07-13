'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Search, Loader2 } from 'lucide-react'

export function SearchView() {
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearching(true)
    try {
      // Real search integration coming soon
      console.log('Search for:', query)
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground mb-4">Search Products</h1>
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="Search for products..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={searching}
            className="max-w-md"
          />
          <Button type="submit" disabled={searching} className="gap-2">
            {searching ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                Search
              </>
            )}
          </Button>
        </form>
      </div>

      <Card>
        <CardContent className="py-12 flex flex-col items-center justify-center text-center">
          <Search className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
          <h3 className="text-lg font-medium text-foreground">Real product search coming soon</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Integration with AliExpress, Amazon, and other platforms
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
