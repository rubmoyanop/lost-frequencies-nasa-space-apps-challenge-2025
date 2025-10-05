import React, { useState, useMemo } from 'react'
import './Legend.css'

function normalizeColor(c) {
  if (!c) return '#000'
  return c.startsWith('#') ? c : `#${c}`
}

function PaletteGradient({ palette = [] }) {
  const colors = (palette || []).map(normalizeColor)
  if (colors.length === 0) return null
  if (colors.length === 1) {
    return <div className="legend-swatch single" style={{ background: colors[0] }} />
  }
  const gradient = `linear-gradient(90deg, ${colors.join(', ')})`
  return <div className="legend-swatch gradient" style={{ background: gradient }} />
}

function PaletteStops({ palette = [], min, max }) {
  const colors = (palette || []).map(normalizeColor)
  if (colors.length === 0) return null

  // If palette length matches steps, map 1:1; otherwise interpolate values for each palette color
  const stops = colors.map((c, i) => {
    const value = (typeof min !== 'undefined' && typeof max !== 'undefined')
      ? (min + (i / Math.max(1, colors.length - 1)) * (max - min))
      : null
    return { color: c, value }
  })

  return (
    <div className="legend-stops">
      {stops.map((s, i) => (
        <div className="legend-stop" key={i}>
          <div className="legend-stop-swatch" style={{ background: s.color }} />
          <div className="legend-stop-label">{s.value !== null ? Number(s.value).toLocaleString() : '-'}</div>
        </div>
      ))}
    </div>
  )
}

export default function Legend({ layers = [] }) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Only show active layers in the legend
  const activeLayers = useMemo(() => layers.filter((l) => l.visible), [layers])

  return (
    <aside className={`legend ${isCollapsed ? 'collapsed' : ''}`} aria-hidden={isCollapsed}>
      <div className="legend-header">
        <div>Legend</div>
        <button
          className="legend-toggle"
          onClick={() => setIsCollapsed((s) => !s)}
          aria-expanded={!isCollapsed}
          title={isCollapsed ? 'Show legend' : 'Hide legend'}
        >
          {isCollapsed ? '▸' : '▾'}
        </button>
      </div>

      {!isCollapsed ? (
        <div className="legend-list">
          {activeLayers.length === 0 ? (
            <div className="legend-empty">No active layers</div>
          ) : (
            activeLayers.map((layer) => (
              <div className="legend-item" key={layer.id}>
                <div className="legend-item-main">
                  <div className="legend-icon">{layer.icon || '📌'}</div>
                  <div className="legend-meta">
                    <div className="legend-name">{layer.name}</div>
                    <div className="legend-type">{layer.type}</div>
                  </div>
                </div>

                {/* Palette / levels for GeoTIFF */}
                {layer.type === 'GeoTIFF' && layer.options && (
                  <div className="legend-body">
                    <PaletteGradient palette={layer.options.palette} />
                    {Array.isArray(layer.options.palette) && layer.options.palette.length > 0 && (
                      <PaletteStops
                        palette={layer.options.palette}
                        min={layer.options.min}
                        max={layer.options.max}
                      />
                    )}
                    {!Array.isArray(layer.options.palette) && (
                      <div className="legend-labels-alt">{typeof layer.options.min !== 'undefined' ? `${layer.options.min} — ${layer.options.max}` : 'values'}</div>
                    )}
                    {/* Special explanatory note for VH change layer */}
                    {layer.id === 'cambio-vh-2017-2024' && (
                      <div className="legend-note">Red = change to less moisture · White = little change · Green = more moisture</div>
                    )}
                  </div>
                )}

                {/* For GeoJSON show simple style swatch if available */}
                {layer.type === 'GeoJSON' && layer.style && (
                  <div className="legend-body">
                    <div className="legend-swatch single" style={{ background: layer.style.fillColor || layer.style.color || '#ccc' }} />
                    <div className="legend-labels-alt">{layer.style.fillOpacity ? `opacity ${layer.style.fillOpacity}` : ''}</div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="legend-collapsed-pill" onClick={() => setIsCollapsed(false)} role="button" tabIndex={0}>
          Legend ({activeLayers.length})
        </div>
      )}
    </aside>
  )
}
