// Singleton for Google Maps loading
let isLoading = false
let isLoaded = false
const callbacks: Array<() => void> = []

export const loadGoogleMaps = (apiKey: string, language: string = 'en'): Promise<void> => {
  return new Promise((resolve, reject) => {
    // If already loaded, resolve immediately
    if (isLoaded && window.google && window.google.maps) {
      resolve()
      return
    }

    // If currently loading, add to callbacks
    if (isLoading) {
      callbacks.push(resolve)
      return
    }

    // Check if script already exists
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
    if (existingScript) {
      // Wait for it to load
      const checkInterval = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(checkInterval)
          isLoaded = true
          resolve()
          callbacks.forEach(cb => cb())
          callbacks.length = 0
        }
      }, 100)
      
      setTimeout(() => {
        clearInterval(checkInterval)
        reject(new Error('Google Maps loading timeout'))
      }, 10000)
      return
    }

    // Start loading
    isLoading = true

    const script = document.createElement('script')
    script.id = 'google-maps-script'
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=${language}`
    script.async = true
    script.defer = true

    script.onload = () => {
      isLoaded = true
      isLoading = false
      resolve()
      callbacks.forEach(cb => cb())
      callbacks.length = 0
    }

    script.onerror = () => {
      isLoading = false
      reject(new Error('Failed to load Google Maps'))
    }

    document.head.appendChild(script)
  })
}