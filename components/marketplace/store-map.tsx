"use client"

import { useState, useCallback, memo, useEffect } from "react"
import { GoogleMap, LoadScript, Marker, InfoWindow, useJsApiLoader } from "@react-google-maps/api"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin } from "lucide-react"
import { useLanguage } from "@/contexts/localization-context"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"

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

// City coordinates mapping for Saudi Arabia
const CITY_COORDINATES: Record<string, { center: { lat: number; lng: number }; zoom: number }> = {
  riyadh: { center: { lat: 24.7136, lng: 46.6753 }, zoom: 11 },
  jeddah: { center: { lat: 21.5433, lng: 39.1728 }, zoom: 11 },
  dammam: { center: { lat: 26.3927, lng: 49.9777 }, zoom: 12 },
  khobar: { center: { lat: 26.2172, lng: 50.1971 }, zoom: 12 },
  al_khobar: { center: { lat: 26.2172, lng: 50.1971 }, zoom: 12 }, // Alias for Khobar
  abha: { center: { lat: 18.2164, lng: 42.5053 }, zoom: 12 },
  medina: { center: { lat: 24.5247, lng: 39.5692 }, zoom: 11 },
  madinah: { center: { lat: 24.5247, lng: 39.5692 }, zoom: 11 }, // Alias
  mecca: { center: { lat: 21.3891, lng: 39.8579 }, zoom: 11 },
  makkah: { center: { lat: 21.3891, lng: 39.8579 }, zoom: 11 }, // Alias
  taif: { center: { lat: 21.2703, lng: 40.4158 }, zoom: 12 },
  buraidah: { center: { lat: 26.3662, lng: 43.9750 }, zoom: 12 },
  buraydah: { center: { lat: 26.3662, lng: 43.9750 }, zoom: 12 }, // Alias
  tabuk: { center: { lat: 28.3838, lng: 36.5550 }, zoom: 12 },
  hail: { center: { lat: 27.5114, lng: 41.7208 }, zoom: 12 },
  najran: { center: { lat: 17.5065, lng: 44.1316 }, zoom: 12 },
  jazan: { center: { lat: 16.8892, lng: 42.5611 }, zoom: 12 },
  jizan: { center: { lat: 16.8892, lng: 42.5611 }, zoom: 12 }, // Alias
  yanbu: { center: { lat: 24.0943, lng: 38.0618 }, zoom: 12 },
  hafar_al_batin: { center: { lat: 28.4337, lng: 45.9601 }, zoom: 12 },
  jubail: { center: { lat: 27.0046, lng: 49.6469 }, zoom: 12 },
  al_jubail: { center: { lat: 27.0046, lng: 49.6469 }, zoom: 12 }, // Alias
  khamis_mushait: { center: { lat: 18.3060, lng: 42.7297 }, zoom: 12 },
  al_kharj: { center: { lat: 24.1556, lng: 47.3347 }, zoom: 12 },
  al_ahsa: { center: { lat: 25.3794, lng: 49.5877 }, zoom: 11 },
  dhahran: { center: { lat: 26.2361, lng: 50.0393 }, zoom: 12 },
  al_qatif: { center: { lat: 26.5196, lng: 50.0115 }, zoom: 12 },
  unaizah: { center: { lat: 26.0840, lng: 43.9935 }, zoom: 12 },
  arar: { center: { lat: 30.9753, lng: 41.0381 }, zoom: 12 },
  sakaka: { center: { lat: 29.9697, lng: 40.2064 }, zoom: 12 },
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

// Helper function to normalize city names to match coordinate keys
function normalizeCityName(cityName: string): string {
  return cityName.toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_")
    .replace(/al_/g, "al_") // Keep al_ prefix consistent
}

// Helper function to find closest city to user location
function findClosestCity(userLat: number, userLng: number): string | null {
  let closestCity: string | null = null
  let minDistance = Infinity

  Object.entries(CITY_COORDINATES).forEach(([cityKey, cityData]) => {
    const distance = Math.sqrt(
      Math.pow(userLat - cityData.center.lat, 2) +
      Math.pow(userLng - cityData.center.lng, 2)
    )

    if (distance < minDistance && distance < 2) { // Within ~200km radius
      minDistance = distance
      closestCity = cityKey
    }
  })

  return closestCity
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
  const [selectedCity, setSelectedCity] = useState<string>("all")
  const [userCity, setUserCity] = useState<string | null>(null)

  // Get Google Maps API key from environment variable
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""

  // Use the hook for loading Google Maps - language is not included to prevent reinitialization errors
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: googleMapsApiKey,
  })

  // Get available cities from Convex
  const availableCities = useQuery(api.stores.getAvailableCities)

  // Filter stores with valid coordinates
  const storesWithCoordinates = stores.filter(
    store => store.latitude && store.longitude
  )
  
  // Create a key based on store IDs to force map updates
  const storesKey = storesWithCoordinates.map(s => s._id).join(',')

  // Handle map load - only runs once when map is created
  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map)

    // Set initial center based on user's city or location
    if (userCity && CITY_COORDINATES[userCity]) {
      // Zoom to user's city
      const cityData = CITY_COORDINATES[userCity]
      map.setCenter(cityData.center)
      map.setZoom(cityData.zoom)
    } else if (userLocation) {
      // Center on exact user location
      map.setCenter(userLocation)
      map.setZoom(13)
    } else {
      // Default to Riyadh
      map.setCenter(DEFAULT_CENTER)
      map.setZoom(11)
    }
  }, [userLocation, userCity])

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
      const lat = position.coords.latitude
      const lng = position.coords.longitude

      setUserLocation({ lat, lng })

      // Find the closest city to user's location
      const closestCity = findClosestCity(lat, lng)
      if (closestCity) {
        setUserCity(closestCity)

        // Find matching city name from available cities (to get proper case)
        if (availableCities) {
          const matchingCity = availableCities.find(city =>
            normalizeCityName(city) === closestCity
          )
          if (matchingCity) {
            setSelectedCity(matchingCity)
          }
        }

        // If map is already loaded, zoom to the city
        if (map && CITY_COORDINATES[closestCity]) {
          const cityData = CITY_COORDINATES[closestCity]
          map.setCenter(cityData.center)
          map.setZoom(cityData.zoom)
        }
      }
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
  }, [map, availableCities])

  // Handle city selection from dropdown
  const handleCityChange = useCallback((cityKey: string) => {
    setSelectedCity(cityKey)

    if (!map) return

    if (cityKey === "all") {
      // Fit all stores when "all" is selected
      if (storesWithCoordinates.length > 0) {
        const bounds = new window.google.maps.LatLngBounds()
        storesWithCoordinates.forEach(store => {
          if (store.latitude && store.longitude) {
            bounds.extend(new window.google.maps.LatLng(store.latitude, store.longitude))
          }
        })
        map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 })
      } else {
        map.setCenter(DEFAULT_CENTER)
        map.setZoom(11)
      }
    } else {
      // Zoom to selected city
      const normalizedKey = normalizeCityName(cityKey)
      const cityData = CITY_COORDINATES[normalizedKey]
      if (cityData) {
        map.setCenter(cityData.center)
        map.setZoom(cityData.zoom)
      }
    }
  }, [map, storesWithCoordinates])

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
      <CardContent className="p-0 h-full relative">
        {/* City Selector Dropdown Overlay */}
        <div className="absolute top-4 start-4 z-10">
          <Select value={selectedCity} onValueChange={handleCityChange}>
            <SelectTrigger className="w-[200px] bg-white shadow-lg border-gray-300" dir={direction}>
              <SelectValue placeholder={t("marketplace.all_cities")} />
            </SelectTrigger>
            <SelectContent dir={direction}>
              <SelectItem value="all">{t("marketplace.all_cities")}</SelectItem>
              {availableCities?.map((city) => (
                <SelectItem key={city} value={city}>
                  {t(`cities.${normalizeCityName(city)}`) || city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* Show indicator if user's city was auto-detected */}
          {userCity && normalizeCityName(selectedCity) === userCity && (
            <p className="text-xs text-green-600 mt-1 bg-white px-2 py-1 rounded shadow-sm">
              {t("marketplace.detected_your_city") || "📍 Detected your location"}
            </p>
          )}
        </div>

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
                  scale: 10,
                  fillColor: "#3B82F6",
                  fillOpacity: 0.4,
                  strokeColor: "#3B82F6",
                  strokeWeight: 3,
                } as google.maps.Symbol,
                title: t("marketplace.your_location") || "Your Location",
                zIndex: 1000,
              }}
            />
          )}

          {/* Store/Branch Markers */}
          {storesWithCoordinates.map((store) => {
            const isSelected = selectedMarker?._id === store._id

            // Enhanced circle markers with better styling
            const markerIcon = store.ownerImage
              ? {
                  url: store.ownerImage,
                  scaledSize: new window.google.maps.Size(isSelected ? 48 : 40, isSelected ? 48 : 40),
                  anchor: new window.google.maps.Point(isSelected ? 24 : 20, isSelected ? 48 : 40),
                }
              : {
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: isSelected ? 18 : 15,
                  fillColor: isSelected ? "#5B21B6" : "#8B5CF6",
                  fillOpacity: 1,
                  strokeColor: "white",
                  strokeWeight: isSelected ? 3 : 2,
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
                  animation: isSelected ? window.google.maps.Animation.BOUNCE : undefined,
                  zIndex: isSelected ? 999 : undefined,
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