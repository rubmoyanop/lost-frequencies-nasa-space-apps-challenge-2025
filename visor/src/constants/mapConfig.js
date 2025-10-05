// Configuración general del mapa
export const MAP_CONFIG = {
  center: [37.707887080446845, -0.8613857940601074], // Centro de España
  zoom: 12,
  maxZoom: 19,
  tileLayer: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors'
  }
}

// Configuración de estilos para capas GeoJSON
export const GEOJSON_STYLE = {
  color: '#2b6cb0',
  weight: 0.6,
  fillColor: '#90cdf4',
  fillOpacity: 0.35
}

// Umbrales de rendimiento
export const PERFORMANCE_THRESHOLDS = {
  largeDataset: 2000, // Número de features para considerar un dataset grande
  minZoomToLoad: 12, // Zoom mínimo para cargar datasets grandes
  canvasPadding: 0.5
}

// Configuración de popups
export const POPUP_CONFIG = {
  maxWidth: 400,
  maxHeight: 260,
  textMaxLength: 160
}
