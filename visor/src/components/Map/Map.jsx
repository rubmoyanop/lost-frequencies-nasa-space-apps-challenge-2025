/**
 * Componente principal del mapa
 */

import { useMap } from '../../hooks/useMap'
import 'leaflet/dist/leaflet.css'

/**
 * Componente Map - Renderiza un mapa de Leaflet
 * @param {Object} props
 * @param {React.ReactNode} props.children - Capas y controles a añadir al mapa
 * @param {Object} props.config - Configuración personalizada del mapa
 * @param {string} props.className - Clases CSS adicionales
 */
function Map({ children, config, className = 'h-full w-full' }) {
  const { mapRef, mapInstance } = useMap(config)

  return (
    <div className={className}>
      <div ref={mapRef} id="map" className="h-full w-full">
        {/* Renderizar hijos con la instancia del mapa */}
        {mapInstance &&
          children &&
          typeof children === 'function' &&
          children(mapInstance)}
      </div>
    </div>
  )
}

export default Map
