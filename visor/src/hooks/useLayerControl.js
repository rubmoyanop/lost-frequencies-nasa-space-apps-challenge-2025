/**
 * Custom hook to manage the state of multiple layers
 */

import { useState, useCallback } from 'react'

/**
 * Hook to manage layer visibility state
 * @param {Array} initialLayers - Initial array of layers with their state
 * @returns {Object} State and layer control functions
 */
export function useLayerControl(initialLayers = []) {
  const [layers, setLayers] = useState(
    initialLayers.map((layer, index) => ({
  id: layer.id || `layer-${index}`,
  name: layer.name || `Layer ${index + 1}`,
      visible: layer.visible !== undefined ? layer.visible : true,
      description: layer.description || '',
      type: layer.type || 'GeoJSON',
      icon: layer.icon || null,
      url: layer.url || '',
      style: layer.style || null,
      options: layer.options || {}
    }))
  )

  /**
   * Toggle visibility for a layer
   */
  const toggleLayer = useCallback((layerId, visible) => {
    setLayers(prevLayers =>
      prevLayers.map(layer =>
        layer.id === layerId
          ? { ...layer, visible: visible !== undefined ? visible : !layer.visible }
          : layer
      )
    )
  }, [])

  /**
   * Show all layers
   */
  const showAllLayers = useCallback(() => {
    setLayers(prevLayers =>
      prevLayers.map(layer => ({ ...layer, visible: true }))
    )
  }, [])

  /**
   * Hide all layers
   */
  const hideAllLayers = useCallback(() => {
    setLayers(prevLayers =>
      prevLayers.map(layer => ({ ...layer, visible: false }))
    )
  }, [])

  /**
   * Add a new layer
   */
  const addLayer = useCallback((newLayer) => {
    setLayers(prevLayers => [
      ...prevLayers,
      {
  id: newLayer.id || `layer-${prevLayers.length}`,
  name: newLayer.name || `Layer ${prevLayers.length + 1}`,
        visible: newLayer.visible !== undefined ? newLayer.visible : true,
        description: newLayer.description || '',
        type: newLayer.type || 'GeoJSON',
        icon: newLayer.icon || null,
        url: newLayer.url || '',
        style: newLayer.style || null,
        options: newLayer.options || {}
      }
    ])
  }, [])

  /**
   * Remove a layer
   */
  const removeLayer = useCallback((layerId) => {
    setLayers(prevLayers => prevLayers.filter(layer => layer.id !== layerId))
  }, [])

  /**
   * Get a layer by its ID
   */
  const getLayer = useCallback((layerId) => {
    return layers.find(layer => layer.id === layerId)
  }, [layers])

  /**
   * Get all visible layers
   */
  const getVisibleLayers = useCallback(() => {
    return layers.filter(layer => layer.visible)
  }, [layers])

  /**
   * Update layer options (for example opacity)
   */
  const setLayerOptions = useCallback((layerId, newOptions) => {
    setLayers(prevLayers => prevLayers.map(layer => (
      layer.id === layerId ? { ...layer, options: { ...layer.options, ...newOptions } } : layer
    )))
  }, [])

  return {
    layers,
    toggleLayer,
    showAllLayers,
    hideAllLayers,
    addLayer,
    removeLayer,
    getLayer,
    getVisibleLayers
  , setLayerOptions
  }
}
