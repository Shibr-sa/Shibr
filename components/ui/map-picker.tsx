"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { Loader2, Search, MapPin } from "lucide-react"
import { useLanguage } from "@/contexts/localization-context"
import { loadGoogleMaps } from "@/lib/google-maps-loader"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface MapPickerProps {
  defaultLocation?: {
    lat: number
    lng: number
    address?: string
  }
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void
  height?: string
  zoom?: number
}

declare global {
  interface Window {
    google: any
    initMap: () => void
  }
}

export function MapPicker({
  defaultLocation = { lat: 24.7136, lng: 46.6753 }, // Default to Riyadh
  onLocationSelect,
  height = "300px",
  zoom = 15
}: MapPickerProps) {
  const { language, direction, t } = useLanguage()
  const [isLoading, setIsLoading] = useState(true)
  const [selectedLocation, setSelectedLocation] = useState(defaultLocation)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [placesError, setPlacesError] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const geocoderRef = useRef<any>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<any>(null)
  const placesServiceRef = useRef<any>(null)

  // Initialize Google Maps (no dependencies to prevent re-initialization)
  const initializeMap = () => {
    if (!mapRef.current || !window.google) return

    // Create map instance
    const map = new window.google.maps.Map(mapRef.current, {
      center: defaultLocation,
      zoom: zoom,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    })

    mapInstanceRef.current = map

    // Create geocoder for reverse geocoding
    geocoderRef.current = new window.google.maps.Geocoder()

    // Create Places service
    placesServiceRef.current = new window.google.maps.places.PlacesService(map)

    // Initialize Places Autocomplete with better handling
    if (searchInputRef.current) {
      try {
        // Set up autocomplete with Saudi Arabia bounds
        const saudiBounds = new window.google.maps.LatLngBounds(
          new window.google.maps.LatLng(16.0, 34.0), // Southwest corner
          new window.google.maps.LatLng(32.5, 56.0)  // Northeast corner
        )

        // Create autocomplete but prevent it from modifying input value
        const input = searchInputRef.current

        autocompleteRef.current = new window.google.maps.places.Autocomplete(input, {
          bounds: saudiBounds,
          componentRestrictions: { country: "sa" }, // Restrict to Saudi Arabia
          fields: ["place_id", "geometry", "formatted_address", "name", "types"],
          types: ["establishment", "geocode"], // Allow both businesses and addresses
          strictBounds: false
        })

        // Store original input handling
        const originalValue = input.value

        // Handle place selection from autocomplete
        autocompleteRef.current.addListener("place_changed", () => {
          const place = autocompleteRef.current.getPlace()

          if (!place.geometry || !place.geometry.location) {
            console.error("No geometry for selected place")
            return
          }

          const lat = place.geometry.location.lat()
          const lng = place.geometry.location.lng()

          // Update map and marker
          mapInstanceRef.current.setCenter(place.geometry.location)
          mapInstanceRef.current.setZoom(17) // Zoom in closer for selected place
          markerRef.current.setPosition(place.geometry.location)

          // Update location with place name and address
          const address = place.name
            ? `${place.name}, ${place.formatted_address}`
            : place.formatted_address

          const location = { lat, lng, address }
          setSelectedLocation(location)
          onLocationSelect(location)

          // Clear search after selection
          setSearchQuery("")
        })

        // Override the default pac-container styling for better RTL support
        const style = document.createElement('style')
        style.innerHTML = `
          .pac-container {
            font-family: inherit !important;
            border-radius: 8px !important;
            margin-top: 4px !important;
            direction: ${direction} !important;
          }
          .pac-item {
            padding: 8px 12px !important;
            cursor: pointer !important;
            direction: ${direction} !important;
          }
          .pac-item-query {
            font-size: 14px !important;
          }
        `
        document.head.appendChild(style)
      } catch (error) {
        console.warn("Places API not available. Search functionality disabled.", error)
        setPlacesError(true)
      }
    }

    // Create marker
    const marker = new window.google.maps.Marker({
      position: defaultLocation,
      map: map,
      draggable: true,
      animation: window.google.maps.Animation.DROP,
    })

    markerRef.current = marker

    // Get initial address
    getAddressFromCoordinates(defaultLocation.lat, defaultLocation.lng)

    // Handle marker drag
    marker.addListener("dragend", () => {
      const position = marker.getPosition()
      if (position) {
        const lat = position.lat()
        const lng = position.lng()
        getAddressFromCoordinates(lat, lng)
      }
    })

    // Handle map click
    map.addListener("click", (event: any) => {
      const lat = event.latLng.lat()
      const lng = event.latLng.lng()
      
      // Move marker to clicked position
      marker.setPosition(event.latLng)
      
      // Get address for the new location
      getAddressFromCoordinates(lat, lng)
    })

    setIsLoading(false)
  }

  // Get address from coordinates using Google Geocoding API
  const getAddressFromCoordinates = useCallback((lat: number, lng: number) => {
    // For now, just use coordinates as address since Geocoding API needs to be enabled
    // You can enable it at: https://console.cloud.google.com/apis/library/geocoding-backend.googleapis.com
    const location = { 
      lat, 
      lng, 
      address: language === "ar" 
        ? `الموقع: ${lat.toFixed(6)}, ${lng.toFixed(6)}` 
        : `Location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`
    }
    setSelectedLocation(location)
    onLocationSelect(location)
    
    // Try geocoding if available (optional - will fail silently if not enabled)
    if (geocoderRef.current) {
      geocoderRef.current.geocode(
        { location: { lat, lng } },
        (results: any[], status: string) => {
          if (status === "OK" && results[0]) {
            const address = results[0].formatted_address
            const locationWithAddress = { lat, lng, address }
            setSelectedLocation(locationWithAddress)
            onLocationSelect(locationWithAddress)
          }
          // If geocoding fails, we already have coordinates set above
        }
      )
    }
  }, [language, onLocationSelect])

  // Load Google Maps script only once
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      setIsLoading(false)
      return
    }

    // Only initialize once, don't re-initialize on language change
    if (mapInstanceRef.current) {
      return
    }

    loadGoogleMaps(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY, language === "ar" ? "ar" : "en")
      .then(() => {
        initializeMap()
      })
      .catch((error) => {
        console.error("Failed to load Google Maps:", error)
        setIsLoading(false)
      })
  }, []) // Empty dependency array - only run once on mount

  // Handle manual search
  const handleSearch = useCallback(() => {
    if (!searchQuery.trim() || !placesServiceRef.current || !mapInstanceRef.current) return

    setIsSearching(true)

    // Use text search which works better with Arabic text
    const request = {
      query: searchQuery,
      location: mapInstanceRef.current.getCenter(),
      radius: 50000, // 50km radius
      region: 'sa', // Saudi Arabia
      language: language === 'ar' ? 'ar' : 'en'
    }

    placesServiceRef.current.textSearch(request, (results: any[], status: string) => {
      setIsSearching(false)

      if (status === window.google.maps.places.PlacesServiceStatus.OK && results && results[0]) {
        const place = results[0]

        if (place.geometry && place.geometry.location) {
          const lat = place.geometry.location.lat()
          const lng = place.geometry.location.lng()

          // Update map and marker
          mapInstanceRef.current.setCenter(place.geometry.location)
          mapInstanceRef.current.setZoom(17)
          markerRef.current.setPosition(place.geometry.location)

          // Update location - keep the original search query if it's the name
          const address = place.name && place.formatted_address
            ? `${place.name}, ${place.formatted_address}`
            : place.formatted_address || searchQuery

          const location = { lat, lng, address }
          setSelectedLocation(location)
          onLocationSelect(location)

          // Keep the user's original text in the search box
          setSearchQuery(searchQuery)
        }
      } else {
        // No results found - try geocoding as fallback
        if (geocoderRef.current) {
          geocoderRef.current.geocode(
            {
              address: searchQuery,
              region: 'SA',
              componentRestrictions: { country: 'sa' }
            },
            (results: any[], status: string) => {
              if (status === "OK" && results[0]) {
                const location = results[0].geometry.location
                const lat = location.lat()
                const lng = location.lng()

                mapInstanceRef.current.setCenter(location)
                mapInstanceRef.current.setZoom(17)
                markerRef.current.setPosition(location)

                const locationData = {
                  lat,
                  lng,
                  address: results[0].formatted_address
                }
                setSelectedLocation(locationData)
                onLocationSelect(locationData)
              }
            }
          )
        }
      }
    })
  }, [searchQuery, onLocationSelect, language])

  // Update map center and marker when location changes (without re-rendering)
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current && window.google && window.google.maps) {
      const newPosition = new window.google.maps.LatLng(defaultLocation.lat, defaultLocation.lng)
      // Smoothly pan to new location instead of jumping
      mapInstanceRef.current.panTo(newPosition)
      // Update marker position
      markerRef.current.setPosition(newPosition)
    }
  }, [defaultLocation.lat, defaultLocation.lng]) // Only depend on lat/lng values, not the whole object

  return (
    <div className="relative w-full">
      {/* Search Box - Above the map, only show if Places API is available */}
      {!placesError && (
        <div className="mb-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleSearch()
                  }
                }}
                placeholder={language === "ar"
                  ? "ابحث عن متجرك (مثال: اسم المتجر، العنوان، المنطقة...)"
                  : "Search for your store (e.g., store name, address, area...)"}
                className="ps-10 pe-3 text-ellipsis"
                style={{ minHeight: '40px' }}
                dir={direction}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {language === "ar"
              ? "ابحث عن موقع متجرك بالاسم أو العنوان، أو انقر على الخريطة لتحديد الموقع"
              : "Search for your store location by name or address, or click on the map to select"}
          </p>
        </div>
      )}

      {/* Map Container */}
      <div className="relative w-full" style={{ height }}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg z-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        <div
          ref={mapRef}
          className="w-full h-full rounded-lg border"
          dir="ltr" // Always LTR for maps
        />
        {!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground text-center px-4">
              {language === "ar"
                ? "مفتاح Google Maps API غير مُعرّف. يرجى إضافة NEXT_PUBLIC_GOOGLE_MAPS_API_KEY إلى ملف .env.local"
                : "Google Maps API key not configured. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env.local file"}
            </p>
          </div>
        )}
      </div>

      {/* Show message if Places API is not available - below the map */}
      {placesError && (
        <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            {language === "ar"
              ? "البحث عن الأماكن غير متاح حالياً. يمكنك النقر على الخريطة لتحديد موقع متجرك."
              : "Place search is currently unavailable. You can click on the map to select your store location."}
          </p>
        </div>
      )}
    </div>
  )
}