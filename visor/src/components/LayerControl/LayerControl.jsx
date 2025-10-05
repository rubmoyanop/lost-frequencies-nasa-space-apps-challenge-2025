/**
 * Layer control component for showing/hiding map layers
 */

import { useState } from 'react'
import './LayerControl.css'

/**
 * LayerControl - Panel to manage layer visibility
 * @param {Object} props
 * @param {Array} props.layers - Array de objetos de capa {id, name, visible, description, type}
 * @param {Function} props.onLayerToggle - Callback cuando se cambia la visibilidad: (layerId, visible) => void
 * @param {string} props.position - Posición del control: 'top-left', 'top-right', 'bottom-left', 'bottom-right'
 * @param {boolean} props.collapsible - Si el panel puede colapsarse
 */
function LayerControl({ 
  layers = [], 
  onLayerToggle,
  onSetLayerOptions,
  position = 'top-right',
  collapsible = true,
  title = 'Layers'
}) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  }

  const handleToggle = (layerId) => {
    const layer = layers.find(l => l.id === layerId)
    if (layer && onLayerToggle) {
      onLayerToggle(layerId, !layer.visible)
    }
  }

  const handleOpacityChange = (layerId, value) => {
    if (typeof onSetLayerOptions === 'function') {
      onSetLayerOptions(layerId, { opacity: value })
    }
  }

  const toggleAll = (visible) => {
    layers.forEach(layer => {
      if (onLayerToggle) {
        onLayerToggle(layer.id, visible)
      }
    })
  }

  return (
    <div className={`layer-control ${positionClasses[position]}`}>
      <div className="layer-control-header">
        <h3 className="layer-control-title">{title}</h3>
    {collapsible && (
          <button
            className="layer-control-collapse-btn"
      onClick={() => setIsCollapsed(!isCollapsed)}
      aria-label={isCollapsed ? 'Expand' : 'Collapse'}
          >
            {isCollapsed ? '▼' : '▲'}
          </button>
        )}
      </div>

      {!isCollapsed && (
        <>
          <div className="layer-control-actions">
            <button
              className="layer-control-action-btn"
              onClick={() => toggleAll(true)}
              disabled={layers.every(l => l.visible)}
            >
              Show all
            </button>
            <button
              className="layer-control-action-btn"
              onClick={() => toggleAll(false)}
              disabled={layers.every(l => !l.visible)}
            >
              Hide all
            </button>
          </div>

          <div className="layer-control-list">
            {layers.length === 0 ? (
              <p className="layer-control-empty">No layers available</p>
            ) : (
              layers.map((layer) => (
                <div key={layer.id} className="layer-control-item">
                  <label className="layer-control-label">
                    <input
                      type="checkbox"
                      checked={layer.visible}
                      onChange={() => handleToggle(layer.id)}
                      className="layer-control-checkbox"
                    />
                    <span className="layer-control-name">
                      {layer.icon && <span className="layer-control-icon">{layer.icon}</span>}
                      {layer.name}
                    </span>
                  </label>
                  {layer.description && (
                    <p className="layer-control-description">{layer.description}</p>
                  )}
                  {layer.type && (
                    <span className="layer-control-type">{layer.type}</span>
                  )}
          {/* If the layer is raster, show opacity control */}
                  {(layer.type === 'GeoTIFF' || layer.type === 'TILES') && (
                    <div className="layer-control-opacity">
            <label>Opacity: {Math.round((layer.options && layer.options.opacity ? layer.options.opacity : 0.7) * 100)}%</label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={layer.options && typeof layer.options.opacity === 'number' ? layer.options.opacity : 0.7}
                        onChange={(e) => handleOpacityChange(layer.id, parseFloat(e.target.value))}
                      />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default LayerControl
