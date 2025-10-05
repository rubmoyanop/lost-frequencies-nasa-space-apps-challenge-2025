/**
 * Componente para renderizar capas GeoJSON en el mapa
 */

import { useEffect, useRef } from 'react'
import { useGeoJSONLayer } from '../../hooks/useGeoJSONLayer'

/**
 * Componente GeoJSONLayer - Carga y renderiza una capa GeoJSON
 * @param {Object} props
 * @param {Object} props.map - Instancia del mapa de Leaflet
 * @param {string} props.url - URL del archivo GeoJSON
 * @param {Object} props.style - Estilo de la capa
 * @param {Function} props.onFeatureClick - Callback al hacer clic en un feature
 * @param {boolean} props.fitBounds - Si debe ajustar el zoom a los bounds de la capa
 */
function GeoJSONLayer({ map, url, style, onFeatureClick, fitBounds }) {
  const { loading, error, featureCount } = useGeoJSONLayer(map, url, {
    style,
    onFeatureClick,
    fitBounds
  })

  const hasLoggedRef = useRef(false)

  // Este componente no renderiza nada en el DOM, solo gestiona la capa en Leaflet
  useEffect(() => {
    if (loading && !hasLoggedRef.current) {
      console.log(`Loading GeoJSON from ${url}...`)
    }

    if (error && !hasLoggedRef.current) {
      console.error(`Error loading GeoJSON: ${error}`)
      hasLoggedRef.current = true
    }

    if (featureCount > 0 && !hasLoggedRef.current) {
      console.log(`GeoJSON loaded: ${featureCount} features`)
      hasLoggedRef.current = true
    }
  }, [loading, error, featureCount, url])

  return null
}

export default GeoJSONLayer
