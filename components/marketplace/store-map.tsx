"use client"

import { useState, useCallback, memo, useEffect } from "react"
import { GoogleMap, LoadScript, Marker, InfoWindow, useJsApiLoader } from "@react-google-maps/api"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin } from "lucide-react"
import { useLanguage } from "@/contexts/localization-context"

interface Branch {
  _id: string
  branchName: string
  city: string
  address?: string
  latitude?: number
  longitude?: number
  location?: {
    lat: number
    lng: number
    address: string
  }
  ownerName?: string
  ownerImage?: string
  availableShelvesCount: number
  priceRange: {
    min: number
    max: number
  }
  productTypes: string[]
  earliestAvailable?: number
  images?: Array<{
    url: string | null
    type: string
    storageId?: string
    order?: number
  }>
  status?: string
  qrCodeUrl?: string
  shelves?: unknown[]
}

interface StoreMapProps {
  stores: Branch[]
  selectedStoreId?: string
  onStoreSelect?: (data: Branch | string) => void
  isFullscreen?: boolean
}

// Default center for Saudi Arabia (Riyadh)
const DEFAULT_CENTER = {
  lat: 24.7136,
  lng: 46.6753,
}

// Map container style
const containerStyle = {
  width: '100%',
  height: '100%',
}

// Map options
const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  scaleControl: true,
  streetViewControl: false,
  rotateControl: false,
  fullscreenControl: true,
}

// Custom map styles for a cleaner look
const mapStyles = [
  {
    featureType: "poi",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "transit",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
]

function StoreMapContent({
  stores,
  selectedStoreId,
  onStoreSelect,
  isFullscreen = false
}: StoreMapProps) {
  const { t, direction, language } = useLanguage()
  const [selectedMarker, setSelectedMarker] = useState<Branch | null>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)

  // Get Google Maps API key from environment variable
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""

  // Use the hook for loading Google Maps - language is not included to prevent reinitialization errors
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: googleMapsApiKey,
  })

  // Note: User location is not requested automatically in the marketplace
  // This respects user privacy and avoids unnecessary permission prompts

  // Filter stores with valid coordinates
  const storesWithCoordinates = stores.filter(
    store => store.latitude && store.longitude
  )
  
  // Create a key based on store IDs to force map updates
  const storesKey = storesWithCoordinates.map(s => s._id).join(',')

  // Handle map load - only runs once when map is created
  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map)

    // Set initial center - use user location if available, otherwise default
    if (userLocation) {
      map.setCenter(userLocation)
      map.setZoom(13)
    } else {
      map.setCenter(DEFAULT_CENTER)
      map.setZoom(11)
    }
  }, [userLocation]) // Update when user location is available

  const onUnmount = useCallback(() => {
    setMap(null)
  }, [])

  // Request and track user's current location
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported")
      return
    }

    const handleLocationSuccess = (position: GeolocationPosition) => {
      setUserLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      })
    }

    const handleLocationError = (error: GeolocationPositionError) => {
      // Silently handle errors - map will use default center
      const errorMessages: Record<number, string> = {
        1: "Location permission denied",
        2: "Location unavailable",
        3: "Location request timeout",
      }
      setLocationError(errorMessages[error.code] || "Unable to get location")
    }

    // Request user's current position
    navigator.geolocation.getCurrentPosition(handleLocationSuccess, handleLocationError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000, // Cache for 5 minutes
    })
  }, [])

  // Handle marker click
  const handleMarkerClick = (branch: Branch) => {
    setSelectedMarker(branch)
    if (onStoreSelect) {
      // In fullscreen mode, pass the entire branch object; otherwise pass just the ID
      onStoreSelect(isFullscreen ? branch : branch._id)
    }
  }

  // Update map bounds when stores change
  useEffect(() => {
    if (!map || !isLoaded) return
    
    // Force recalculation of bounds when stores change
    const updateBounds = () => {
      if (storesWithCoordinates.length > 0) {
        const bounds = new window.google.maps.LatLngBounds()
        
        // Add all store coordinates to bounds
        storesWithCoordinates.forEach(store => {
          if (store.latitude && store.longitude) {
            bounds.extend(new window.google.maps.LatLng(store.latitude, store.longitude))
          }
        })
        
        // Different behavior based on number of stores
        if (storesWithCoordinates.length === 1) {
          // Single store - center and zoom
          const store = storesWithCoordinates[0]
          if (store.latitude && store.longitude) {
            map.setCenter({ lat: store.latitude, lng: store.longitude })
            map.setZoom(15)
          }
        } else {
          // Multiple stores - fit all in view
          // First pan to bounds to ensure all markers are visible
          map.panToBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 })
          
          // Then adjust zoom to fit
          setTimeout(() => {
            map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 })
          }, 100)
        }
      } else {
        // No stores - reset to default
        map.setCenter(DEFAULT_CENTER)
        map.setZoom(11)
      }
    }
    
    // Use requestAnimationFrame for smoother updates
    const frameId = requestAnimationFrame(updateBounds)
    
    return () => cancelAnimationFrame(frameId)
  }, [map, isLoaded, storesKey, storesWithCoordinates]) // Watch all dependencies

  // Error handling
  if (loadError) {
    return (
      <Card className="h-full">
        <CardContent className="p-0 h-full">
          <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center">
              <MapPin className="h-12 w-12 text-destructive mx-auto mb-2" />
              <p className="text-muted-foreground">{t("marketplace.map_error")}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Loading state
  if (!isLoaded) {
    return (
      <Card className="h-full">
        <CardContent className="p-0 h-full">
          <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center">
              <MapPin className="h-12 w-12 text-primary mx-auto mb-2 animate-pulse" />
              <p className="text-muted-foreground">{t("common.loading")}...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // No API key fallback
  if (!googleMapsApiKey) {
    return (
      <Card className="h-full">
        <CardContent className="p-0 h-full">
          <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center">
              <MapPin className="h-12 w-12 text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {storesWithCoordinates.length} {t("marketplace.stores_available")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardContent className="p-0 h-full">
        <GoogleMap
          mapContainerStyle={containerStyle}
          onLoad={onLoad}
          onUnmount={onUnmount}
          options={{
            ...mapOptions,
            styles: mapStyles,
            gestureHandling: 'greedy', // Allow single finger pan on mobile
          }}
        >
          {/* User Location Marker */}
          {userLocation && (
            <Marker
              position={userLocation}
              options={{
                icon: {
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 8,
                  fillColor: "#4285F4",
                  fillOpacity: 1,
                  strokeColor: "white",
                  strokeWeight: 2,
                } as google.maps.Symbol,
                title: t("marketplace.your_location") || "Your Location"
              }}
            />
          )}

          {/* Store/Branch Markers */}
          {storesWithCoordinates.map((store) => {
            // Determine marker icon - use store logo if available, fallback to purple circle
            const markerIcon = store.ownerImage
              ? {
                  url: store.ownerImage,
                  scaledSize: new window.google.maps.Size(40, 40),
                  anchor: new window.google.maps.Point(20, 40), // Bottom center
                }
              : {
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 15,
                  fillColor: "#725CAD",
                  fillOpacity: 1,
                  strokeColor: "white",
                  strokeWeight: 2,
                }

            return (
              <Marker
                key={store._id}
                position={{
                  lat: store.latitude!,
                  lng: store.longitude!,
                }}
                onClick={() => handleMarkerClick(store)}
                options={{
                  icon: markerIcon as google.maps.Icon | google.maps.Symbol,
                }}
              />
            )
          })}

          {/* Info Window */}
          {selectedMarker && (
            <InfoWindow
              position={{
                lat: selectedMarker.latitude!,
                lng: selectedMarker.longitude!,
              }}
              onCloseClick={() => setSelectedMarker(null)}
            >
              <div className="p-2 min-w-[250px]">
                <h3 className="font-bold text-sm mb-1">{selectedMarker.branchName}</h3>
                <p className="text-xs text-muted-foreground mb-2">
                  {selectedMarker.city} {selectedMarker.address ? `- ${selectedMarker.address}` : ""}
                </p>
                <div className="mb-2">
                  <p className="text-xs text-muted-foreground mb-1">{t("marketplace.available_shelves")}:</p>
                  <p className="text-sm font-medium">{selectedMarker.availableShelvesCount}</p>
                </div>
                <div className="mb-2">
                  <p className="text-xs text-muted-foreground mb-1">{t("marketplace.price_from")}:</p>
                  <p className="text-sm font-medium">
                    {t("common.currency_symbol")} {selectedMarker.priceRange.min} - {selectedMarker.priceRange.max}
                  </p>
                </div>
                {selectedMarker.productTypes.length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs text-muted-foreground mb-1">{t("marketplace.product_types")}:</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedMarker.productTypes.slice(0, 3).map((type) => (
                        <Badge key={type} variant="secondary" className="text-xs">
                          {t(`product_categories.${type}`) || type}
                        </Badge>
                      ))}
                      {selectedMarker.productTypes.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{selectedMarker.productTypes.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
                {selectedMarker.ownerName && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {t("marketplace.owner")}: {selectedMarker.ownerName}
                  </p>
                )}
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </CardContent>
    </Card>
  )
}

export const StoreMap = memo(StoreMapContent)

// Default export for dynamic imports
export default StoreMap