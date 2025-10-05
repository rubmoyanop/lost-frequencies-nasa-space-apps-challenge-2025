/**
 * Hook to manage GeoJSON layers on a Leaflet map
 */

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { GEOJSON_STYLE, PERFORMANCE_THRESHOLDS, POPUP_CONFIG } from '../constants/mapConfig'
import { featureContainsPoint } from '../utils/geojsonUtils'
import { buildPopupContent } from '../utils/popupUtils'

  // Helper: force a repaint / redraw when adding canvas-based layers.
function forceLayerRender(mapInstance, layerInstance) {
  try {
    const renderer = layerInstance && (layerInstance._renderer || (layerInstance.getRenderer && layerInstance.getRenderer()))

    // Try renderer internal update methods first
    if (renderer) {
      if (typeof renderer._update === 'function') {
        try { renderer._update() } catch { /* noop */ }
      }
      if (typeof renderer._updatePaths === 'function') {
        try { renderer._updatePaths() } catch { /* noop */ }
      }

      // If there's a canvas container, toggle display briefly to force a repaint
      const canvasEl = renderer._container || (renderer.getContainer && renderer.getContainer())
      if (canvasEl && canvasEl.style) {
        try {
          canvasEl.style.display = 'none'
          requestAnimationFrame(() => {
            canvasEl.style.display = ''
          })
        } catch {
          // noop
        }
      }
    } else if (layerInstance && typeof layerInstance.redraw === 'function') {
      // Fallback to public redraw API
      try { layerInstance.redraw() } catch { /* noop */ }
    }

    // Also ask Leaflet to validate size in next frame (lightweight)
    requestAnimationFrame(() => {
      try {
        if (mapInstance && typeof mapInstance.invalidateSize === 'function') {
          mapInstance.invalidateSize(false)
        }
      } catch {
        // noop
      }
    })
  } catch {
    // noop: best-effort only
  }
}

/**
 * Hook to load and manage a GeoJSON layer
 * @param {Object} map - Leaflet map instance
 * @param {string} url - GeoJSON file URL
 * @param {Object} options - Configuration options
 * @returns {Object} Layer state and methods
 */
export function useGeoJSONLayer(map, url, options = {}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [featureCount, setFeatureCount] = useState(0)
  const layerRef = useRef(null)
  const controlRef = useRef(null)
  const abortControllerRef = useRef(null)
  const eventHandlersRef = useRef({})

  const {
    style = GEOJSON_STYLE,
    onFeatureClick,
    fitBounds = true
  } = options

  useEffect(() => {
    if (!map || !url) return
    
  // If a layer instance already exists, do nothing
    if (layerRef.current) {
      return
    }

  // Local flag to track if the effect was cancelled
    let cancelled = false

  // Create a new AbortController for this fetch
    abortControllerRef.current = new AbortController()
    
    setLoading(true)
    setError(null)

    // Cargar GeoJSON con señal de abort
    fetch(url, { signal: abortControllerRef.current.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`GeoJSON fetch failed: ${response.status}`)
        return response.json()
      })
      .then((data) => {
  // Check if the effect was cancelled
        if (cancelled) return
        
        const count = (data.features && data.features.length) || 0
        setFeatureCount(count)

  // Use Canvas renderer for better performance with many vectors
        const canvasRenderer = L.canvas({ padding: PERFORMANCE_THRESHOLDS.canvasPadding })

  // If the dataset is large, disable per-feature interactivity
        const isLarge = count > PERFORMANCE_THRESHOLDS.largeDataset

        const geojsonLayer = L.geoJSON(data, {
          renderer: canvasRenderer,
          interactive: !isLarge,
          style: typeof style === 'function' ? style : () => style,
          onEachFeature: !isLarge
            ? (feature, layer) => {
                const content = buildPopupContent(feature.properties)
                layer.bindPopup(content)
                if (onFeatureClick) {
                  layer.on('click', () => onFeatureClick(feature))
                }
              }
            : undefined,
        })

  // Store data for click-based spatial queries
        geojsonLayer.geojsonData = data
        layerRef.current = geojsonLayer

  // Use module-level forceLayerRender helper to ensure immediate painting

  // Large-dataset handling
        if (isLarge) {
          setupLargeDatasetHandling(map, geojsonLayer, count, onFeatureClick, fitBounds)
        } else {
          geojsonLayer.addTo(map)
          // Force a redraw so the canvas renderer appears immediately (avoids needing to zoom)
          forceLayerRender(map, geojsonLayer)
          if (fitBounds) {
            try {
              const bounds = geojsonLayer.getBounds()
              if (bounds && bounds.isValid()) map.fitBounds(bounds)
            } catch {
              console.warn('Could not fit bounds to GeoJSON layer')
            }
          }
        }

        if (!cancelled) {
          setLoading(false)
        }
      })
      .catch((err) => {
        // Ignorar errores de abort
        if (err.name === 'AbortError') {
          return
        }
        
        if (!cancelled) {
          console.error('Error loading GeoJSON:', err)
          setError(err.message)
          setLoading(false)
        }
      })

    return () => {
  cancelled = true
      
  // Abort the fetch request if in progress
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      
  // Remove the layer from the map
      if (layerRef.current) {
        try {
          if (map.hasLayer(layerRef.current)) {
            map.removeLayer(layerRef.current)
          }
        } catch {
          // Ignorar errores si el mapa ya fue destruido
        }
        layerRef.current = null
      }
      
  // Remove control if exists
      if (controlRef.current) {
        try {
          if (map.removeControl) {
            map.removeControl(controlRef.current)
          }
        } catch {
          // Ignorar errores si el mapa ya fue destruido
        }
        controlRef.current = null
      }
      
  // Remove event handlers registered on the map (click, zoom, etc.)
      try {
        const handlers = eventHandlersRef.current || {}
        if (handlers.click) map.off('click', handlers.click)
        if (handlers.zoom) map.off('zoomend', handlers.zoom)
        eventHandlersRef.current = {}
      } catch {
  // ignore if the map no longer exists
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, url])

  /**
   * Setup handling for large datasets
   */
  function setupLargeDatasetHandling(map, geojsonLayer, count, onFeatureClick, fitBounds) {
    const minZoomToLoad = PERFORMANCE_THRESHOLDS.minZoomToLoad

    // Create an informational control
    const control = L.control({ position: 'topright' })
    control.onAdd = function () {
      const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control')
      div.style.padding = '6px'
      div.style.background = 'white'
      div.innerHTML = `Zoom >= ${minZoomToLoad} to load features (${count})`
      return div
    }
    control.addTo(map)
    controlRef.current = control

    // Intentar cargar cuando se alcance el zoom mínimo
    function tryLoad() {
      if (map.getZoom() >= minZoomToLoad) {
        if (!map.hasLayer(geojsonLayer)) {
          geojsonLayer.addTo(map)
          // Force redraw after adding large-layer to make sure it is visible immediately
          forceLayerRender(map, geojsonLayer)
          // Only fit bounds if requested
          if (fitBounds) {
            try {
              const bounds = geojsonLayer.getBounds()
              if (bounds && bounds.isValid()) map.fitBounds(bounds)
            } catch {
              console.warn('Could not fit bounds to GeoJSON layer')
            }
          }
        }
        map.removeControl(control)
        controlRef.current = null
      }
    }

  // Click handler for spatial queries
    function onMapClickForLarge(e) {
      if (!geojsonLayer || !geojsonLayer.geojsonData) return
      const lng = e.latlng.lng
      const lat = e.latlng.lat
      const features = geojsonLayer.geojsonData.features || []

  // Linear search (could be optimized with a spatial index)
      for (let i = 0; i < features.length; i++) {
        const feature = features[i]
        if (featureContainsPoint(feature, lng, lat)) {
          const content = buildPopupContent(feature.properties)
          L.popup({ maxWidth: POPUP_CONFIG.maxWidth })
            .setLatLng(e.latlng)
            .setContent(content)
            .openOn(map)
          
          if (onFeatureClick) onFeatureClick(feature)
          return
        }
      }
    }

  // register handlers and save references so they can be removed on cleanup
  map.on('click', onMapClickForLarge)
  map.on('zoomend', tryLoad)
  eventHandlersRef.current.click = onMapClickForLarge
  eventHandlersRef.current.zoom = tryLoad

  // Adjust bounds so the user knows where the data is (only if requested)
    if (fitBounds) {
      try {
        const bounds = geojsonLayer.getBounds()
        if (bounds && bounds.isValid()) map.fitBounds(bounds)
      } catch (e) {
        console.warn('Could not fit bounds to GeoJSON layer', e)
      }
    }
  }

  return {
    layer: layerRef.current,
    loading,
    error,
    featureCount
  }
}
