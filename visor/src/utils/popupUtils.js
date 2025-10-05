/**
 * Utilidades para crear y formatear popups
 */

import { POPUP_CONFIG } from '../constants/mapConfig'

/**
 * Escapa caracteres HTML para prevenir XSS
 * @param {*} str - String a escapar
 * @returns {string}
 */
export function escapeHtml(str) {
  if (str === null || str === undefined) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Parsea XML de SIOSE y lo convierte en HTML legible
 * @param {string} xmlString - String XML a parsear
 * @returns {string} HTML formateado
 */
export function parseSioseXml(xmlString) {
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(xmlString, 'application/xml')
    const err = doc.querySelector('parsererror')
    
    if (err) {
      return formatRawXml(xmlString)
    }

    const pol = doc.querySelector('POLIGONO') || doc.documentElement

    function renderCobertura(node) {
      const id = node.getAttribute('ID') || ''
      const desc = node.getAttribute('Desc') || ''
      const sup = node.getAttribute('Sup') || node.getAttribute('Sup_ha') || ''
      let out = `<div style="margin-bottom:6px"><div style="font-weight:700">${escapeHtml(id)} ${escapeHtml(desc)} ${sup ? `(${escapeHtml(sup)})` : ''}</div>`
      
      // Renderizar atributos
      const atributos = Array.from(node.childNodes).filter(
        n => n.nodeType === 1 && n.nodeName === 'ATRIBUTO'
      )
      if (atributos.length) {
        out += '<ul style="margin:6px 0 0 12px;padding:0;list-style:disc">'
        for (const a of atributos) {
          const aid = a.getAttribute('ID') || ''
          const ad = a.getAttribute('Desc') || ''
          out += `<li style="margin:2px 0">${escapeHtml(aid)} - ${escapeHtml(ad)}</li>`
        }
        out += '</ul>'
      }
      
      // Renderizar coberturas anidadas
      const kids = Array.from(node.childNodes).filter(
        n => n.nodeType === 1 && n.nodeName === 'COBERTURA'
      )
      if (kids.length) {
        out += '<div style="margin-top:6px; margin-left:8px">'
        for (const k of kids) out += renderCobertura(k)
        out += '</div>'
      }
      out += '</div>'
      return out
    }

    // Renderizar información de nivel superior y coberturas
    let htmlOut = `<div style="max-height:${POPUP_CONFIG.maxHeight}px;overflow:auto">`
    const polId = pol.getAttribute && (pol.getAttribute('Id') || pol.getAttribute('Id'))
    const code = pol.getAttribute && (pol.getAttribute('code') || pol.getAttribute('code'))
    
    if (polId || code) {
      htmlOut += `<div style="font-weight:700;margin-bottom:6px">${escapeHtml(polId || '')} ${escapeHtml(code || '')}</div>`
    }
    
    const topCob = Array.from(pol.childNodes).filter(
      n => n.nodeType === 1 && n.nodeName === 'COBERTURA'
    )
    for (const c of topCob) htmlOut += renderCobertura(c)
    htmlOut += '</div>'
    
    return htmlOut
  } catch {
    return formatRawXml(xmlString)
  }
}

/**
 * Formatea XML crudo en un bloque pre
 * @param {string} xmlString - String XML
 * @returns {string} HTML con XML formateado
 */
function formatRawXml(xmlString) {
  return `<pre style="white-space:pre-wrap;max-height:200px;overflow:auto;margin:0;background:#f8f8f8;padding:6px;border-radius:4px;">${escapeHtml(xmlString)}</pre>`
}

/**
 * Construye el contenido HTML de un popup a partir de las propiedades de un feature
 * @param {Object} properties - Propiedades del feature GeoJSON
 * @returns {string} HTML del popup
 */
export function buildPopupContent(properties) {
  if (!properties) return '<div>No properties</div>'
  
  const entries = Object.entries(properties)
  let html = '<div style="max-width:320px;font-size:13px">'
  html += '<table style="width:100%;border-collapse:collapse">'
  
  for (const [key, value] of entries) {
    const val = value === null || value === undefined ? '' : String(value)
    
    if (key === 'SIOSE_XML' && val.length > 0) {
      // Parsear y renderizar XML de SIOSE
      const parsed = parseSioseXml(val)
      html += `<tr><td style="vertical-align:top;font-weight:600;padding:4px 6px;border-bottom:1px solid #eee">${escapeHtml(key)}</td><td style="padding:4px 6px;border-bottom:1px solid #eee">${parsed}</td></tr>`
    } else {
      // Truncar valores largos
      const short = val.length > POPUP_CONFIG.textMaxLength 
        ? escapeHtml(val.slice(0, POPUP_CONFIG.textMaxLength)) + '…' 
        : escapeHtml(val)
      html += `<tr><td style="vertical-align:top;font-weight:600;padding:4px 6px;border-bottom:1px solid #eee">${escapeHtml(key)}</td><td style="padding:4px 6px;border-bottom:1px solid #eee">${short}</td></tr>`
    }
  }
  
  html += '</table></div>'
  return html
}
