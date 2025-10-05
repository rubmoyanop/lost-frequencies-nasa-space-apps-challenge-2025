/**
 * Viewer component extracted from App.jsx
 * Encapsula la lógica de capas, hooks y render del mapa.
 */
import { useMemo } from 'react'
import Map from '../Map/Map'
import { GeoJSONLayer, GeoTIFFLayer, TilesLayer } from '../Layers'
import LayerControl from '../LayerControl'
import Legend from '../Legend/Legend'
import { useLayerControl } from '../../hooks/useLayerControl'

function Viewer() {
  // Available layers (memoized to avoid re-creation between renders)
  const initialLayers = useMemo(
    () => [
      {
        id: 'parcelas-siose',
        name: 'Agricultural Parcels (SIOSE)',
        description: 'Spanish Land Use/Cover Information System (SIOSE)',
        type: 'GeoJSON',
        icon: '🌾',
        url: '/capas/parcelas-agricolas-siose.geojson',
        visible: false,
        style: {
          color: '#2b6cb0',
          weight: 0.6,
          fillColor: '#90cdf4',
          fillOpacity: 0.25
        }
      },

      {
        id: 'cambio-vh-2017-2024',
        name: 'VH Change 2017–2024',
        description: 'GeoTIFF generated from GEE showing VH changes (2017 vs 2024)',
        type: 'GeoTIFF',
        icon: '🛰️',
        url: '/capas/cambio_vh_2017_2024.tif',
        visible: false,
        options: {
          opacity: 0.8,
          // Palette meaning: red = change to less moisture, white = little change, green = more moisture
          // Assumption: values are centered near 0; use a symmetric range for visualization
          min: -3,
          max: 3,
          palette: ['FF0000', 'FFFFFF', '00AA00']
        }
      },

      {
        id: 'inundaciones_mar_menor_201909',
        name: 'Mar Menor Floods (Sep 2019)',
        description: 'Flood extent derived for Mar Menor (September 2019)',
        type: 'GeoTIFF',
        icon: '🌊',
        url: '/capas/inundaciones_mar_menor_201909.tif',
        visible: false,
        options: {
          opacity: 1,
          // Use 0 as transparent, blue palette
          min: 0,
          max: 1,
          palette: ['0000FF'],
          zeroAsTransparent: true
        }
      },

      {
        id: 'cambio_reflectividad_mar_menor_201909',
        name: 'Reflectivity Change (Sep 2019)',
        description: 'Reflectivity difference for Mar Menor (September 2019)',
        type: 'GeoTIFF',
        icon: '🔆',
        url: '/capas/cambio_reflectividad_mar_menor_201909.tif',
        visible: false,
        options: {
          opacity: 1,
          // Visualization params emulating vis_params_cambio from the notebook
          min: -3,
          max: 10,
          palette: ['000000', 'FFFFFF', 'FF0000']
        }
      },
      {
        id: 'fertilidad_superficie',
        name: 'Fertilizer Use (Mar Menor)',
        description: 'Proxy for NDVI / fertilizer-related signal',
        type: 'GeoTIFF',
        icon: '🌱',
        url: '/capas/fertilizers.tif',
        visible: false,
        options: {
          opacity: 1,
          // Visualization params emulating vis_params_cambio from the notebook
          min: 1000,
          max: 2500000,
          // palette: lightgreen, green, darkgreen, black -> hex values
          palette: ['90EE90', '008000', '006400', '000000'],
          // treat zero values as transparent to avoid visual background
          zeroAsTransparent: true
        }
      }
    ],
    []
  )

  // Hook to manage layer state
  const { layers, toggleLayer, setLayerOptions } = useLayerControl(initialLayers)

  // Callback al hacer click en un feature GeoJSON
  const handleFeatureClick = (feature) => {
    console.log('Feature clicked:', feature.properties)
  }

  // Visible layers (memoized)
  const visibleLayers = useMemo(() => layers.filter((l) => l.visible), [layers])

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <img src="/logo-lost-frequencies.webp" alt="Lost Frequencies" className="app-logo" />
        <div className="app-title-container">
          <h1 className="app-title">Lost Frequencies</h1>
          <span className="app-subtitle">Geospatial Data Viewer</span>
        </div>
      </header>

      {/* Map */}
      <div className="map-wrapper">
        <Map>
          {(mapInstance) => (
            <>
              {/* Render visible layers */}
              {visibleLayers.map((layer) => {
                if (layer.type === 'GeoTIFF' || layer.type === 'GeoTIFF') {
                  return (
                    <GeoTIFFLayer key={layer.id} map={mapInstance} url={layer.url} options={layer.options} />
                  )
                }

                if (layer.type === 'TILES') {
                  return (
                    <TilesLayer key={layer.id} map={mapInstance} urlTemplate={layer.url} options={layer.options} />
                  )
                }

                // Default: GeoJSON
                return (
                  <GeoJSONLayer
                    key={layer.id}
                    map={mapInstance}
                    url={layer.url}
                    style={layer.style}
                    onFeatureClick={handleFeatureClick}
                    fitBounds={false}
                  />
                )
              })}
            </>
          )}
        </Map>

  <LayerControl
          layers={layers}
          onLayerToggle={toggleLayer}
          onSetLayerOptions={setLayerOptions}
          position="top-right"
          collapsible
          title="Layers"
        />
  {/* Legend */}
  <Legend layers={layers} />
      </div>
    </div>
  )
}

export default Viewer
