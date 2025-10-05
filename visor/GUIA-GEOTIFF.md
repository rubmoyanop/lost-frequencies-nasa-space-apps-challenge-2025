# Guía de Implementación de Capas GeoTIFF

Esta guía te ayudará a completar la implementación de las capas GeoTIFF en tu aplicación.

## 1. Instalar Dependencias

```bash
npm install georaster georaster-layer-for-leaflet
```

## 2. Actualizar el componente GeoTIFFLayer

Reemplaza el contenido de `src/components/Layers/GeoTIFFLayer.jsx` con:

```jsx
import { useEffect, useState } from 'react'
import parseGeoraster from 'georaster'
import GeoRasterLayer from 'georaster-layer-for-leaflet'

function GeoTIFFLayer({ map, url, options = {} }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!map || !url) return

    setLoading(true)
    setError(null)
    let currentLayer = null

    // Cargar y parsear GeoTIFF
    fetch(url)
      .then(response => {
        if (!response.ok) throw new Error(`Failed to fetch GeoTIFF: ${response.status}`)
        return response.arrayBuffer()
      })
      .then(arrayBuffer => parseGeoraster(arrayBuffer))
      .then(georaster => {
        console.log('GeoTIFF loaded:', georaster)
        
        // Crear capa
        const layer = new GeoRasterLayer({
          georaster: georaster,
          opacity: options.opacity || 0.7,
          pixelValuesToColorFn: options.colorFunction || defaultColorFunction,
          resolution: options.resolution || 256,
          ...options.layerOptions
        })
        
        layer.addTo(map)
        currentLayer = layer
        
        // Ajustar bounds si se solicita
        if (options.fitBounds !== false) {
          try {
            const bbox = georaster.bbox
            if (bbox) {
              map.fitBounds([
                [bbox.ymin, bbox.xmin],
                [bbox.ymax, bbox.xmax]
              ])
            }
          } catch (e) {
            console.warn('Could not fit bounds to GeoTIFF layer', e)
          }
        }
        
        setLoading(false)
      })
      .catch(err => {
        console.error('Error loading GeoTIFF:', err)
        setError(err.message)
        setLoading(false)
      })

    // Cleanup
    return () => {
      if (currentLayer) {
        try {
          if (map.hasLayer(currentLayer)) {
            map.removeLayer(currentLayer)
          }
        } catch (err) {
          console.warn('Error removing GeoTIFF layer:', err)
        }
      }
    }
  }, [map, url, options])

  if (loading) console.log(`Loading GeoTIFF from ${url}...`)
  if (error) console.error(`Error loading GeoTIFF: ${error}`)

  return null
}

// Función de color por defecto - Gradiente azul a rojo
function defaultColorFunction(values) {
  const value = values[0]
  
  // Sin datos / transparente
  if (value === null || value === undefined || value === 0) {
    return null
  }
  
  // Normalizar entre 0 y 1
  const normalized = Math.min(Math.max(value / 255, 0), 1)
  
  // Gradiente de azul a rojo
  const r = Math.floor(normalized * 255)
  const b = Math.floor((1 - normalized) * 255)
  
  return `rgb(${r}, 0, ${b})`
}

export default GeoTIFFLayer
```

## 3. Funciones de Color Predefinidas

Crea un archivo `src/utils/colorFunctions.js`:

```javascript
/**
 * Funciones de color para renderizar GeoTIFFs
 */

// Gradiente de elevación
export function elevationColor(values) {
  const elevation = values[0]
  if (elevation === null || elevation < 0) return null
  
  if (elevation < 100) return 'rgb(34, 139, 34)'      // Verde
  if (elevation < 500) return 'rgb(154, 205, 50)'     // Verde amarillento
  if (elevation < 1000) return 'rgb(255, 255, 0)'     // Amarillo
  if (elevation < 2000) return 'rgb(255, 165, 0)'     // Naranja
  if (elevation < 3000) return 'rgb(139, 69, 19)'     // Marrón
  return 'rgb(255, 255, 255)'                         // Blanco (nieve)
}

// NDVI (Índice de Vegetación)
export function ndviColor(values) {
  const ndvi = values[0]
  if (ndvi === null) return null
  
  if (ndvi < -0.2) return 'rgb(0, 0, 255)'       // Agua
  if (ndvi < 0) return 'rgb(139, 69, 19)'        // Suelo desnudo
  if (ndvi < 0.2) return 'rgb(210, 180, 140)'    // Vegetación muy escasa
  if (ndvi < 0.4) return 'rgb(255, 255, 0)'      // Vegetación escasa
  if (ndvi < 0.6) return 'rgb(154, 205, 50)'     // Vegetación moderada
  if (ndvi < 0.8) return 'rgb(34, 139, 34)'      // Vegetación densa
  return 'rgb(0, 100, 0)'                        // Vegetación muy densa
}

// Temperatura (grados Celsius)
export function temperatureColor(values) {
  const temp = values[0]
  if (temp === null) return null
  
  if (temp < 0) return 'rgb(0, 0, 139)'          // Azul oscuro (muy frío)
  if (temp < 10) return 'rgb(0, 191, 255)'       // Azul cielo (frío)
  if (temp < 20) return 'rgb(0, 255, 0)'         // Verde (templado)
  if (temp < 30) return 'rgb(255, 255, 0)'       // Amarillo (cálido)
  if (temp < 40) return 'rgb(255, 165, 0)'       // Naranja (caluroso)
  return 'rgb(255, 0, 0)'                        // Rojo (muy caluroso)
}

// Precipitación (mm)
export function precipitationColor(values) {
  const precip = values[0]
  if (precip === null || precip < 0) return null
  
  if (precip < 10) return 'rgb(255, 255, 224)'   // Beige claro (muy seco)
  if (precip < 50) return 'rgb(173, 216, 230)'   // Azul claro
  if (precip < 100) return 'rgb(135, 206, 250)'  // Azul cielo
  if (precip < 200) return 'rgb(0, 191, 255)'    // Azul profundo
  if (precip < 400) return 'rgb(0, 0, 255)'      // Azul
  return 'rgb(0, 0, 139)'                        // Azul oscuro (muy húmedo)
}

// Humedad del suelo (%)
export function soilMoistureColor(values) {
  const moisture = values[0]
  if (moisture === null || moisture < 0) return null
  
  if (moisture < 10) return 'rgb(139, 69, 19)'   // Marrón (muy seco)
  if (moisture < 20) return 'rgb(210, 180, 140)' // Marrón claro
  if (moisture < 40) return 'rgb(244, 164, 96)'  // Arena
  if (moisture < 60) return 'rgb(154, 205, 50)'  // Verde amarillento
  if (moisture < 80) return 'rgb(0, 255, 127)'   // Verde primavera
  return 'rgb(0, 139, 139)'                      // Cian oscuro (saturado)
}

// Escala de grises
export function grayscaleColor(values) {
  const value = values[0]
  if (value === null) return null
  
  const normalized = Math.min(Math.max(value / 255, 0), 1)
  const gray = Math.floor(normalized * 255)
  
  return `rgb(${gray}, ${gray}, ${gray})`
}

// Heat map (mapa de calor)
export function heatmapColor(values) {
  const value = values[0]
  if (value === null) return null
  
  const normalized = Math.min(Math.max(value / 255, 0), 1)
  
  // Paleta de calor: negro -> rojo -> amarillo -> blanco
  if (normalized < 0.25) {
    const factor = normalized / 0.25
    return `rgb(${Math.floor(factor * 255)}, 0, 0)`
  } else if (normalized < 0.5) {
    const factor = (normalized - 0.25) / 0.25
    return `rgb(255, ${Math.floor(factor * 255)}, 0)`
  } else if (normalized < 0.75) {
    const factor = (normalized - 0.5) / 0.25
    return `rgb(255, 255, ${Math.floor(factor * 255)})`
  } else {
    return 'rgb(255, 255, 255)'
  }
}
```

## 4. Ejemplo de Uso con GeoTIFF

```jsx
import Map from './components/Map/Map'
import { GeoTIFFLayer } from './components/Layers'
import { ndviColor, elevationColor } from './utils/colorFunctions'

function App() {
  return (
    <div className="h-screen w-full">
      <Map>
        {(mapInstance) => (
          <>
            {/* Capa de elevación */}
            <GeoTIFFLayer
              map={mapInstance}
              url="/data/elevation.tif"
              options={{
                opacity: 0.6,
                colorFunction: elevationColor,
                resolution: 256
              }}
            />
            
            {/* Capa de NDVI */}
            <GeoTIFFLayer
              map={mapInstance}
              url="/data/ndvi.tif"
              options={{
                opacity: 0.7,
                colorFunction: ndviColor,
                resolution: 128
              }}
            />
          </>
        )}
      </Map>
    </div>
  )
}
```

## 5. Trabajar con Bandas Múltiples

Para GeoTIFFs con múltiples bandas (ej: RGB, multiespectrales):

```javascript
// Función para RGB verdadero
export function rgbColor(values) {
  const r = values[0]
  const g = values[1]
  const b = values[2]
  
  if (r === null || g === null || b === null) return null
  
  return `rgb(${r}, ${g}, ${b})`
}

// Función para infrarrojo falso color (NIR, R, G)
export function falseColorInfrared(values) {
  const nir = values[0]
  const red = values[1]
  const green = values[2]
  
  if (nir === null || red === null || green === null) return null
  
  return `rgb(${nir}, ${red}, ${green})`
}
```

## 6. Optimizaciones

### Cachear GeoTIFFs
```javascript
const georasterCache = new Map()

async function loadGeoTIFF(url) {
  if (georasterCache.has(url)) {
    return georasterCache.get(url)
  }
  
  const response = await fetch(url)
  const arrayBuffer = await response.arrayBuffer()
  const georaster = await parseGeoraster(arrayBuffer)
  
  georasterCache.set(url, georaster)
  return georaster
}
```

### Usar tiles pregenerados
Para GeoTIFFs muy grandes, considera usar servicios de tiles como:
- GeoServer
- MapServer
- TileServer GL
- COG (Cloud Optimized GeoTIFF)

### Generar tiles locales con gdal2tiles
Si prefieres servir tiles estáticos desde la carpeta `public/capas`, puedes generar un conjunto de tiles XYZ con `gdal2tiles.py` (incluido en GDAL):

```bash
# Crear carpeta de salida dentro de public/capas
mkdir -p visor-nasa/public/capas/cambio_vh_tiles

# Generar tiles (ejemplo: web mercator EPSG:3857, formato PNG)
gdal2tiles.py -z 0-12 -r average -w none -p raster -t "Cambio VH 2017-2024" /ruta/a/cambio_vh_2017_2024.tif visor-nasa/public/capas/cambio_vh_tiles
```

Esto crea una estructura `.../cambio_vh_tiles/{z}/{x}/{y}.png` dentro de `public/capas` que se sirve estáticamente.

Ejemplo de configuración en `src/App.jsx` para usar la capa como `TILES`:

```js
{
  id: 'cambio-vh-tiles',
  name: 'Cambio VH (Tiles)',
  type: 'TILES',
  url: '/capas/cambio_vh_tiles/{z}/{x}/{y}.png',
  visible: false,
  options: { opacity: 0.75 }
}
```

Con esto, el `LayerControl` mostrará un slider de opacidad para ajustar la transparencia en tiempo real.

## 7. Cloud Optimized GeoTIFF (COG)

Para mejores tiempos de carga con archivos grandes:

```bash
# Convertir GeoTIFF normal a COG usando GDAL
gdal_translate input.tif output.tif \
  -co TILED=YES \
  -co COPY_SRC_OVERVIEWS=YES \
  -co COMPRESS=DEFLATE
```

## 8. Recursos Adicionales

- [Georaster Documentation](https://github.com/GeoTIFF/georaster)
- [Georaster Layer for Leaflet](https://github.com/GeoTIFF/georaster-layer-for-leaflet)
- [Cloud Optimized GeoTIFF](https://www.cogeo.org/)
- [GDAL Tools](https://gdal.org/)
