import { useEffect } from 'react'
import L from 'leaflet'

/**
 * TilesLayer - capa de teselas (XYZ) simple para rásters pre-generados
 * @param {Object} props
 * @param {Object} props.map - instancia Leaflet
 * @param {string} props.urlTemplate - URL template de tiles: e.g. '/capas/mylayer_tiles/{z}/{x}/{y}.png'
 * @param {Object} props.options - opciones: opacity, attribution, minZoom, maxZoom
 */
function TilesLayer({ map, urlTemplate, options = {} }) {
  useEffect(() => {
    if (!map || !urlTemplate) return

    const tileOptions = {
      opacity: typeof options.opacity === 'number' ? options.opacity : 0.7,
      minZoom: options.minZoom || 0,
      maxZoom: options.maxZoom || 22,
      attribution: options.attribution || ''
    }

    const tileLayer = L.tileLayer(urlTemplate, tileOptions)
    tileLayer.addTo(map)

    return () => {
      try {
        if (map && map.hasLayer(tileLayer)) map.removeLayer(tileLayer)
      } catch (err) {
        console.warn('TilesLayer: error removing layer', err)
      }
    }
  }, [map, urlTemplate, options])

  return null
}

export default TilesLayer
