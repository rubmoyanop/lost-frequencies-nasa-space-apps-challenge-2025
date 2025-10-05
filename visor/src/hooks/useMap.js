/**
 * Hook personalizado para inicializar y gestionar una instancia de Leaflet
 */

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import { MAP_CONFIG } from '../constants/mapConfig'

/**
 * Hook para crear y gestionar un mapa de Leaflet
 * @param {Object} options - Opciones de configuración del mapa
 * @returns {Object} Referencia al contenedor del mapa y la instancia del mapa
 */
export function useMap(options = {}) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)

  const config = {
    ...MAP_CONFIG,
    ...options
  }

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    // Inicializar el mapa
    const map = L.map(mapRef.current).setView(config.center, config.zoom)

    // Añadir capa base
    L.tileLayer(config.tileLayer.url, {
      maxZoom: config.maxZoom,
      attribution: config.tileLayer.attribution
    }).addTo(map)

    mapInstanceRef.current = map

    // Cleanup al desmontar
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    mapRef,
    mapInstance: mapInstanceRef.current
  }
}
