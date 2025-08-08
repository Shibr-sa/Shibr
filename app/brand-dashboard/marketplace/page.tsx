"use client"

import { MarketplaceContent } from "@/components/marketplace/marketplace-content"

export default function BrandMarketplacePage() {
  return (
    <MarketplaceContent 
      linkPrefix="/marketplace"
      showTitle={true}
    />
  )
}