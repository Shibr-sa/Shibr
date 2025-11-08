"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MapPin, Store as StoreIcon, Building, Package, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/contexts/localization-context"

interface StoreCardProps {
  store: {
    _id: string
    storeName: string
    businessCategory?: string
    logo?: string | null
    branchCount: number
    cities: string[]
    totalAvailableShelves: number
    priceRange: {
      min: number
      max: number
    }
  }
}

export function StoreCard({ store }: StoreCardProps) {
  const { t } = useLanguage()

  return (
    <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300 border-2 border-border/50 bg-card h-full group shadow-lg">
      <Link
        href={`/marketplace/store/${store._id}`}
        className="block h-full"
        aria-label={`View branches for ${store.storeName}`}
      >
        <CardContent className="p-0 flex flex-col h-full">
          {/* Logo Section - Top Center */}
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-8 text-center border-b-2 border-border/30">
            <Avatar className="h-32 w-32 mx-auto mb-4 ring-4 ring-primary/30 shadow-xl border-2 border-primary/20">
              {store.logo ? (
                <AvatarImage src={store.logo} alt={store.storeName} className="object-cover" />
              ) : null}
              <AvatarFallback className="bg-primary text-primary-foreground">
                <StoreIcon className="h-16 w-16" />
              </AvatarFallback>
            </Avatar>

            {/* Store Name - BIGGEST */}
            <h3 className="text-2xl font-bold text-foreground mb-2">
              {store.storeName}
            </h3>

            {/* Business Category */}
            {store.businessCategory && (
              <Badge variant="secondary" className="text-xs font-medium">
                {t(`business_categories.${store.businessCategory}`) || store.businessCategory}
              </Badge>
            )}
          </div>

          {/* Store Info Section */}
          <div className="p-6 flex-1 space-y-4">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Branches */}
              <div className="text-center p-3 bg-muted/50 rounded-lg border border-border/50 shadow-sm">
                <Building className="h-5 w-5 mx-auto mb-1 text-primary" />
                <div className="text-2xl font-bold text-foreground">{store.branchCount}</div>
                <div className="text-xs text-muted-foreground">
                  {store.branchCount === 1 ? t("marketplace.branch") : t("marketplace.branches")}
                </div>
              </div>

              {/* Shelves */}
              <div className="text-center p-3 bg-muted/50 rounded-lg border border-border/50 shadow-sm">
                <Package className="h-5 w-5 mx-auto mb-1 text-primary" />
                <div className="text-2xl font-bold text-foreground">{store.totalAvailableShelves}</div>
                <div className="text-xs text-muted-foreground">{t("marketplace.available")}</div>
              </div>
            </div>

            {/* Locations */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t("marketplace.locations")}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {store.cities.map((city, index) => (
                  <Badge
                    key={city}
                    variant="secondary"
                    className="text-xs font-medium"
                  >
                    {t(`cities.${city.toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_")}`) || city}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Price */}
            {store.priceRange.min > 0 && (
              <div className="text-center pt-2">
                <div className="text-xs text-muted-foreground mb-1">
                  {t("marketplace.price_from")}
                </div>
                <div className="text-2xl font-bold text-primary">
                  {t("common.currency_symbol")} {store.priceRange.min.toLocaleString()}
                  <span className="text-sm font-normal text-muted-foreground">/{t("common.month")}</span>
                </div>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="px-6 pb-6">
            <div className="bg-primary/10 hover:bg-primary/20 transition-all rounded-lg p-3 flex items-center justify-center gap-2 group-hover:gap-3 border border-primary/20 shadow-sm hover:shadow-md">
              <span className="text-sm font-semibold text-primary">
                {t("marketplace.view_branches")}
              </span>
              <ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </CardContent>
      </Link>
    </Card>
  )
}