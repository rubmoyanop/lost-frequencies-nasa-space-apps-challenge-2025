/* eslint-disable no-unused-vars */
/**
 * Componente para renderizar capas GeoTIFF en el mapa
 * Preparado para implementación futura con georaster y georaster-layer-for-leaflet
 */

import { useEffect } from 'react'

/**
 * Componente GeoTIFFLayer - Carga y renderiza una capa GeoTIFF
 * 
 * Para implementar este componente completamente, necesitarás instalar:
 * npm install georaster georaster-layer-for-leaflet
 * 
 * @param {Object} props
 * @param {Object} props.map - Instancia del mapa de Leaflet
 * @param {string} props.url - URL del archivo GeoTIFF
 * @param {Object} props.options - Opciones de renderizado
 */
function GeoTIFFLayer({ map, url, options = {} }) {
  useEffect(() => {
    if (!map || !url) return
    console.log('GeoTIFFLayer: Preparado para cargar', url, 'con opciones:', options)

    // --- Module-level simple caches (reused across mounts) ---
    // Guardamos georaster parseado por URL para evitar re-fetch/parse
    // Nota: caché en memoria, reiniciará al recargar la página.
    if (!window.__geoRasterCache) window.__geoRasterCache = new Map()
    const georasterCache = window.__geoRasterCache

    let currentLayer = null
    let cancelled = false
    const abortController = new AbortController()

    // Parámetros de optimización
    const initialResolution = options.initialResolution || Math.max(32, Math.floor((options.resolution || 256) / 4))
    const targetResolution = options.resolution || 256
    const responsiveByZoom = options.responsiveByZoom !== false // true por defecto

    // Helper: crear capa a partir de georaster con resolución dada
    const createLayer = (GeoRasterLayer, georaster, resolution) => {
      const min = (options && typeof options.min === 'number') ? options.min : -5
      const max = (options && typeof options.max === 'number') ? options.max : 5
      const palette = (options && Array.isArray(options.palette) && options.palette.length > 0)
        ? options.palette
        : ['FF0000', 'FFFFFF', '00FF00']
      const zeroAsTransparent = !!(options && options.zeroAsTransparent)

      function hexToRgb(hex) {
        const h = hex.replace('#', '')
        const bigint = parseInt(h, 16)
        return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 }
      }

      function interpolateColor(v) {
        if (v === null || v === undefined || isNaN(v)) return null
        if (zeroAsTransparent && (v === 0 || v === 0.0)) return null
        const range = max - min
        if (range === 0) {
          const c = hexToRgb(palette[0])
          return `rgb(${c.r},${c.g},${c.b})`
        }
        const t = (v - min) / range
        if (t < 0 || t > 1) return null
        const n = palette.length
        if (n === 1) {
          const c = hexToRgb(palette[0])
          return `rgb(${c.r},${c.g},${c.b})`
        }
        const scaled = t * (n - 1)
        const idx = Math.floor(scaled)
        const frac = scaled - idx
        const c1 = hexToRgb(palette[idx])
        const c2 = hexToRgb(palette[Math.min(idx + 1, n - 1)])
        const r = Math.round(c1.r + (c2.r - c1.r) * frac)
        const g = Math.round(c1.g + (c2.g - c1.g) * frac)
        const b = Math.round(c1.b + (c2.b - c1.b) * frac)
        return `rgb(${r},${g},${b})`
      }

      const pixelValuesToColorFn = (values) => {
        if (!values || values.length === 0) return null
        return interpolateColor(values[0])
      }

      const layer = new GeoRasterLayer({
        georaster,
        opacity: typeof options.opacity === 'number' ? options.opacity : 0.7,
        pixelValuesToColorFn,
        resolution
      })

      return layer
    }

    // Carga perezosa e intentos de reutilizar georaster ya parseado
    ;(async () => {
      try {
        // Import dinámico para evitar aumentar bundle inicial
        const parseGeorasterModule = await import(/* webpackChunkName: "georaster" */ 'georaster')
        const parseGeoraster = parseGeorasterModule.default || parseGeorasterModule
        const GeoRasterLayerModule = await import(/* webpackChunkName: "georaster-layer-for-leaflet" */ 'georaster-layer-for-leaflet')
        const GeoRasterLayer = GeoRasterLayerModule.default || GeoRasterLayerModule

        let georaster = georasterCache.get(url)

        if (!georaster) {
          // Fetch + parse
          const resp = await fetch(url, { signal: abortController.signal })
          if (!resp.ok) throw new Error(`Fetch failed: ${resp.status} ${resp.statusText}`)
          const arrayBuffer = await resp.arrayBuffer()
          // parseGeoraster puede ser costoso; cacheamos el resultado
          georaster = await parseGeoraster(arrayBuffer)
          georasterCache.set(url, georaster)
        } else {
          console.debug('GeoTIFFLayer: usando georaster desde caché para', url)
        }

        if (cancelled) return

        // 1) Añadir capa rápida de baja resolución para respuesta inmediata
        currentLayer = createLayer(GeoRasterLayer, georaster, initialResolution)
        currentLayer.addTo(map)

        // Intentamos ajustar bounds si el georaster provee bbox
        try {
          if (georaster.bbox && Array.isArray(georaster.bbox) && georaster.bbox.length === 4) {
            // No forzamos el fit si el usuario no lo desea
            if (options.fitBounds !== false) {
              map.fitBounds([[georaster.bbox[1], georaster.bbox[0]], [georaster.bbox[3], georaster.bbox[2]]])
            }
          }
        } catch (errFit) {
          console.warn('GeoTIFFLayer: no se pudieron ajustar límites con bbox', errFit)
        }

        console.log('GeoTIFFLayer: capa de baja resolución añadida', { url, initialResolution })

        // 2) Después de añadir baja resolución, reemplazar por la de mayor resolución
        if (targetResolution > initialResolution) {
          // Pequeño retardo para no bloquear UI si hay muchos cambios de capas
          await new Promise(r => setTimeout(r, 300))
          if (cancelled) return

          // Crear capa de mayor resolución y sustituir
          const highResLayer = createLayer(GeoRasterLayer, georaster, targetResolution)
          highResLayer.addTo(map)
          // Remover layer anterior
          try {
            if (map.hasLayer(currentLayer)) map.removeLayer(currentLayer)
          } catch (errRemove) {
            console.warn('GeoTIFFLayer: error removiendo capa anterior', errRemove)
          }
          currentLayer = highResLayer
          console.log('GeoTIFFLayer: reemplazada por capa de alta resolución', { targetResolution })
        }

        // 3) Si se solicita comportamiento responsive por zoom, ajustar resolución al cambiar zoom
        const onZoomEnd = () => {
          if (!currentLayer || !responsiveByZoom) return
          // Heurística: calcular resolución objetivo según zoom
          const z = map.getZoom()
          // ajustar factor: 32 por zoom como referencia; esto es una heurística
          const res = Math.min(targetResolution, Math.max(16, Math.floor(z * 32)))
          if (res === currentLayer.options.resolution) return
          // Recrear capa con nueva resolución (la mayoría de implementaciones requieren recrear)
          try {
            const newLayer = createLayer(GeoRasterLayer, georaster, res)
            newLayer.addTo(map)
            if (map.hasLayer(currentLayer)) map.removeLayer(currentLayer)
            currentLayer = newLayer
            console.debug('GeoTIFFLayer: updated resolution by zoom', res)
          } catch (e) {
            console.warn('GeoTIFFLayer: no se pudo actualizar resolución por zoom', e)
          }
        }

        map.on && map.on('zoomend', onZoomEnd)

      } catch (err) {
        if (err.name === 'AbortError') {
          console.debug('GeoTIFFLayer: fetch abortado para', url)
        } else {
          console.error('GeoTIFFLayer: error cargando o renderizando GeoTIFF', err)
        }
      }
    })()
    // Ejemplo de implementación:
    /*
    import parseGeoraster from 'georaster'
    import GeoRasterLayer from 'georaster-layer-for-leaflet'

    fetch(url)
      .then(response => response.arrayBuffer())
      .then(arrayBuffer => parseGeoraster(arrayBuffer))
      .then(georaster => {
        const layer = new GeoRasterLayer({
          georaster: georaster,
          opacity: options.opacity || 0.7,
          pixelValuesToColorFn: options.colorFunction || defaultColorFunction,
          resolution: options.resolution || 256
        })
        layer.addTo(map)
        currentLayer = layer
        layerRef.current = layer
      })
      .catch(err => console.error('Error loading GeoTIFF:', err))
    */

    // Cleanup
    return () => {
      cancelled = true
      try {
        abortController.abort()
      } catch (e) {
        // ignore
      }
      try {
        if (currentLayer && map && map.hasLayer && map.hasLayer(currentLayer)) {
          map.removeLayer(currentLayer)
        }
      } catch (err) {
        console.warn('Error removing GeoTIFF layer:', err)
      }
      try {
        // remover listeners
        map.off && map.off('zoomend')
      } catch (e) {
        // ignore
      }
    }
  }, [map, url, options])

  return null
}

// Función de ejemplo para colorear píxeles
// eslint-disable-next-line no-unused-vars
function defaultColorFunction(values) {
  const value = values[0]
  if (value === 0) return null // Transparente
  
  // Ejemplo: gradiente de azul a rojo basado en el valor
  const normalized = value / 255
  const r = Math.floor(normalized * 255)
  const b = Math.floor((1 - normalized) * 255)
  return `rgb(${r}, 0, ${b})`
}

export default GeoTIFFLayer
