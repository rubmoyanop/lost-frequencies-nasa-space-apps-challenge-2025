/**
 * Utilidades para trabajar con datos GeoJSON
 */

/**
 * Algoritmo ray-casting para determinar si un punto está dentro de un anillo lineal
 * @param {number} x - Longitud del punto
 * @param {number} y - Latitud del punto
 * @param {Array} ring - Array de coordenadas [lng, lat]
 * @returns {boolean}
 */
export function pointInRing(x, y, ring) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1]
    const xj = ring[j][0], yj = ring[j][1]
    const intersect = (yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}

/**
 * Verifica si un punto está dentro de un polígono (considerando agujeros)
 * @param {number} lng - Longitud del punto
 * @param {number} lat - Latitud del punto
 * @param {Array} polygonCoords - Array de anillos
 * @returns {boolean}
 */
export function pointInPolygon(lng, lat, polygonCoords) {
  if (!polygonCoords || polygonCoords.length === 0) return false
  
  const outer = polygonCoords[0]
  if (!pointInRing(lng, lat, outer)) return false
  
  // Si está dentro de algún agujero, entonces no está dentro del polígono
  for (let i = 1; i < polygonCoords.length; i++) {
    if (pointInRing(lng, lat, polygonCoords[i])) return false
  }
  
  return true
}

/**
 * Verifica si un feature contiene un punto (soporta Polygon y MultiPolygon)
 * @param {Object} feature - Feature GeoJSON
 * @param {number} lng - Longitud del punto
 * @param {number} lat - Latitud del punto
 * @returns {boolean}
 */
export function featureContainsPoint(feature, lng, lat) {
  const geom = feature.geometry
  if (!geom) return false
  
  if (geom.type === 'Polygon') {
    return pointInPolygon(lng, lat, geom.coordinates)
  } else if (geom.type === 'MultiPolygon') {
    for (const poly of geom.coordinates) {
      if (pointInPolygon(lng, lat, poly)) return true
    }
    return false
  }
  
  return false
}

/**
 * Encuentra features que contienen un punto dado
 * @param {Array} features - Array de features GeoJSON
 * @param {number} lng - Longitud del punto
 * @param {number} lat - Latitud del punto
 * @returns {Array} Features que contienen el punto
 */
export function findFeaturesAtPoint(features, lng, lat) {
  return features.filter(feature => featureContainsPoint(feature, lng, lat))
}
