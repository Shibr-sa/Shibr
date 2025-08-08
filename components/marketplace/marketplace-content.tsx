"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, MapPin, Star, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/contexts/language-context"
import { useState } from "react"

interface MarketplaceContentProps {
  // Allow customization of link behavior
  linkPrefix?: string
  // Allow hiding certain elements for different contexts
  showTitle?: boolean
  // Custom title if needed
  customTitle?: string
}

export function MarketplaceContent({ 
  linkPrefix = "/marketplace",
  showTitle = true,
  customTitle
}: MarketplaceContentProps) {
  const { t, direction } = useLanguage()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCity, setSelectedCity] = useState("all")
  const [selectedArea, setSelectedArea] = useState("all")
  const [selectedStoreType, setSelectedStoreType] = useState("all")

  const stores = [
    {
      id: 1,
      name: t("marketplace.mock.store_name_1"),
      image: "/placeholder.svg?height=200&width=300",
      rating: 4.8,
      price: "2000",
      period: t("marketplace.mock.monthly"),
      discount: "+18%",
      location: t("marketplace.mock.location_riyadh"),
      owner: "Esther Howard",
      services: [t("marketplace.mock.service_type"), t("marketplace.riyadh"), t("marketplace.mock.through_april")],
    },
    {
      id: 2,
      name: t("marketplace.mock.store_name_1"),
      image: "/placeholder.svg?height=200&width=300",
      rating: 4.8,
      price: "2000",
      period: t("marketplace.mock.monthly"),
      discount: "+18%",
      location: t("marketplace.mock.location_riyadh"),
      owner: "Esther Howard",
      services: [t("marketplace.mock.service_type"), t("marketplace.riyadh"), t("marketplace.mock.through_april")],
    },
    {
      id: 3,
      name: t("marketplace.mock.store_name_1"),
      image: "/placeholder.svg?height=200&width=300",
      rating: 4.8,
      price: "2000",
      period: t("marketplace.mock.monthly"),
      discount: "+18%",
      location: t("marketplace.mock.location_riyadh"),
      owner: "Esther Howard",
      services: [t("marketplace.mock.service_type"), t("marketplace.riyadh"), t("marketplace.mock.through_april")],
    },
  ]

  const filteredStores = stores.filter(store => {
    const matchesSearch = searchQuery === "" || 
      store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.location.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCity = selectedCity === "all" || store.location.includes(selectedCity)
    const matchesArea = selectedArea === "all"
    const matchesType = selectedStoreType === "all"
    
    return matchesSearch && matchesCity && matchesArea && matchesType
  })

  return (
    <div className="space-y-6" dir={direction}>
      {/* Page Title */}
      {showTitle && (
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {customTitle || t("marketplace.title")}
          </h1>
        </div>
      )}

      {/* Search Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Search Input */}
            <div className="lg:col-span-2">
              <Label htmlFor="search" className="sr-only">
                {t("common.search")}
              </Label>
              <div className="relative">
                <Input
                  id="search"
                  placeholder={t("marketplace.search_placeholder")}
                  className="ps-10 h-12"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  dir={direction}
                />
                <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            {/* City Selector */}
            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder={t("marketplace.all_cities")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("marketplace.all_cities")}</SelectItem>
                <SelectItem value="riyadh">{t("marketplace.riyadh")}</SelectItem>
                <SelectItem value="jeddah">{t("marketplace.jeddah")}</SelectItem>
                <SelectItem value="dammam">{t("marketplace.dammam")}</SelectItem>
              </SelectContent>
            </Select>

            {/* Area Selector */}
            <Select value={selectedArea} onValueChange={setSelectedArea}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder={t("marketplace.all_areas")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("marketplace.all_areas")}</SelectItem>
                <SelectItem value="north">{t("marketplace.north")}</SelectItem>
                <SelectItem value="south">{t("marketplace.south")}</SelectItem>
                <SelectItem value="east">{t("marketplace.east")}</SelectItem>
                <SelectItem value="west">{t("marketplace.west")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            {/* Price Range */}
            <div className="lg:col-span-2">
              <Label className="text-sm font-medium mb-2 block">{t("marketplace.price_range")}</Label>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">0 {t("common.currency_symbol")}</span>
                <div className="flex-1 h-2 bg-muted rounded-full relative">
                  <div className="absolute start-0 top-0 h-full w-3/4 bg-primary rounded-full"></div>
                  <div className="absolute start-3/4 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-primary rounded-full border-2 border-background"></div>
                </div>
                <span className="text-sm text-muted-foreground">9000 {t("common.currency_symbol")}</span>
              </div>
            </div>

            {/* Store Type */}
            <Select value={selectedStoreType} onValueChange={setSelectedStoreType}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder={t("marketplace.store_type")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("marketplace.all_types")}</SelectItem>
                <SelectItem value="coffee">{t("marketplace.coffee")}</SelectItem>
                <SelectItem value="restaurant">{t("marketplace.restaurant")}</SelectItem>
                <SelectItem value="retail">{t("marketplace.retail")}</SelectItem>
              </SelectContent>
            </Select>

            {/* Search Button */}
            <Button className="h-12 text-base">
              <Search className="me-2 h-4 w-4" />
              {t("marketplace.search_stores")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Content Grid */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Map Section */}
        <div className="order-2 lg:order-1">
          <Card className="h-full">
            <CardContent className="p-0 h-full">
              <div className="w-full h-full min-h-[400px] bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-blue-100">
                  {/* Simulated Map */}
                  <div className="w-full h-full relative">
                    {/* Map markers */}
                    <div className="absolute top-1/4 end-1/3 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      1
                    </div>
                    <div className="absolute top-1/2 end-1/4 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      2
                    </div>
                    <div className="absolute bottom-1/3 end-2/3 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      3
                    </div>
                    <div className="absolute top-3/4 start-1/4 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      4
                    </div>
                  </div>
                </div>
                <div className="text-center z-10">
                  <MapPin className="h-12 w-12 text-primary mx-auto mb-2" />
                  <p className="text-muted-foreground">{t("marketplace.stores_map")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Store Listings */}
        <div className="grid grid-cols-1 gap-6 order-1 lg:order-2">
          {filteredStores.map((store) => (
            <Link href={`${linkPrefix}/${store.id}`} key={store.id}>
              <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-0">
                  <div className="flex">
                    {/* Store Image */}
                    <div className="w-1/3">
                      <div className="w-full h-full min-h-[150px] bg-muted" />
                    </div>

                    {/* Store Info */}
                    <div className="flex-1 p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-foreground mb-2">{store.name}</h3>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm font-medium">{store.rating}</span>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {store.period} / {store.price} {t("common.currency_symbol")}
                            </span>
                            <Badge variant="secondary" className="text-green-600">
                              {store.discount}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-4">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{store.location}</span>
                      </div>

                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium">EH</span>
                          </div>
                          <span className="text-sm font-medium">{store.owner}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {store.services.map((service, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {service}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}

          {/* Pagination */}
          <div className="flex items-center justify-center gap-2 pt-6">
            <Button variant="outline" size="sm">
              {direction === "rtl" ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
            <Button variant="default" size="sm">
              1
            </Button>
            <Button variant="outline" size="sm">
              2
            </Button>
            <span className="px-2">...</span>
            <Button variant="outline" size="sm">
              {direction === "rtl" ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}