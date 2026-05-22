const ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;'
}
const ESCAPE_RE = new RegExp('[' + Object.keys(ESCAPE_MAP).join('') + ']', 'g')

export function escapeHtml(str) {
  if (typeof str !== 'string') return str
  return str.replace(ESCAPE_RE, (ch) => ESCAPE_MAP[ch])
}

export function sanitizeText(str) {
  if (typeof str !== 'string') return str || ''
  return str
    .replace(/[<>&"'/]/g, (ch) => ESCAPE_MAP[ch])
    .trim()
}

export function sanitizeUrl(url) {
  if (!url) return ''
  const s = String(url).trim()
  try {
    const parsed = new URL(s, window.location.origin)
    const protocol = parsed.protocol.toLowerCase()
    if (['https:', 'http:', 'mailto:', 'tel:'].includes(protocol)) {
      return parsed.href
    }
    return ''
  } catch {
    return ''
  }
}

export function sanitizeFileName(name) {
  if (typeof name !== 'string') return 'file'
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 255)
}

export function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj
  const result = Array.isArray(obj) ? [] : {}
  for (const [key, value] of Object.entries(obj)) {
    const safeKey = sanitizeText(String(key))
    if (typeof value === 'string') {
      result[safeKey] = sanitizeText(value)
    } else if (typeof value === 'object' && value !== null) {
      result[safeKey] = sanitizeObject(value)
    } else {
      result[safeKey] = value
    }
  }
  return result
}

export const SAFE_HTML_TAGS = {
  b: 1, i: 1, em: 1, strong: 1, a: { href: 'url' }, span: { class: 1 },
  br: 1, p: 1, ul: 1, ol: 1, li: 1, u: 1, s: 1, sub: 1, sup: 1,
  small: 1, code: 1, pre: 1, blockquote: 1, div: { class: 1 }
}

const TAG_RE = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi
const ATTR_RE = /\s+([a-z-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi

export function sanitizeHtml(html) {
  if (typeof html !== 'string') return ''
  return html.replace(TAG_RE, (match, tagName) => {
    const tag = tagName.toLowerCase()
    if (tag.startsWith('/')) {
      const closeTag = tag.slice(1)
      return SAFE_HTML_TAGS[closeTag] ? `</${closeTag}>` : ''
    }
    if (!SAFE_HTML_TAGS[tag]) return ''
    const allowed = SAFE_HTML_TAGS[tag]
    if (allowed === 1) return `<${tag}>`
    const attrs = []
    let attrMatch
    const attrRe = new RegExp(ATTR_RE.source, 'gi')
    while ((attrMatch = attrRe.exec(match)) !== null) {
      const attrName = attrMatch[1].toLowerCase()
      const attrVal = (attrMatch[2] || attrMatch[3] || '')
      if (allowed[attrName]) {
        if (allowed[attrName] === 'url') {
          const safe = sanitizeUrl(attrVal)
          if (safe) attrs.push(`${attrName}="${sanitizeText(attrVal)}"`)
        } else {
          attrs.push(`${attrName}="${sanitizeText(attrVal)}"`)
        }
      }
    }
    return `<${tag}${attrs.length ? ' ' + attrs.join(' ') : ''}>`
  })
}

export function validateEmail(email) {
  if (typeof email !== 'string') return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function validatePhone(phone) {
  if (typeof phone !== 'string') return false
  return /^\+?[\d\s\-()]{7,20}$/.test(phone)
}

export function validateAmount(amount) {
  const num = typeof amount === 'string' ? parseFloat(amount.replace(/,/g, '')) : Number(amount)
  return !isNaN(num) && num >= 0 && isFinite(num)
}
