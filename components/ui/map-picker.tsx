"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { Loader2 } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { loadGoogleMaps } from "@/lib/google-maps-loader"

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
  const { language, direction } = useLanguage()
  const [isLoading, setIsLoading] = useState(true)
  const [selectedLocation, setSelectedLocation] = useState(defaultLocation)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const geocoderRef = useRef<any>(null)

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
  )
}