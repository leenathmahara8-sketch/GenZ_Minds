import axios from 'axios'

/**
 * Client for the Flask tourism API (dataset + ML price estimator).
 *
 * Separate from services/api.js on purpose: that instance redirects to
 * /login on any 401, which would be wrong for these public endpoints.
 * Vite proxies /api -> http://localhost:5000 (see vite.config.js).
 */

const client = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

/** Surface Flask's {"error": "..."} body as a real Error.message. */
function friendly(error) {
  const body = error.response?.data
  const msg =
    (body && (body.error || body.detail || body.message)) ||
    (error.code === 'ECONNABORTED'
      ? 'The tourism server took too long to respond.'
      : null) ||
    'Could not reach the tourism server. Is it running on port 5000?'
  const e = new Error(msg)
  e.status = error.response?.status
  return e
}

export async function getHealth() {
  try {
    const { data } = await client.get('/health')
    return data
  } catch (err) {
    throw friendly(err)
  }
}

export async function getMetrics() {
  try {
    const { data } = await client.get('/metrics')
    return data
  } catch (err) {
    throw friendly(err)
  }
}

export async function getFilters() {
  try {
    const { data } = await client.get('/filters')
    return data
  } catch (err) {
    throw friendly(err)
  }
}

/** @param {object} params - q, district, type, grade, meal, min_price, max_price, sort, page, per_page */
export async function getAccommodations(params = {}) {
  try {
    const clean = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== '' && v != null && v !== 0)
    )
    const { data } = await client.get('/accommodations', { params: clean })
    return data
  } catch (err) {
    throw friendly(err)
  }
}

export async function getAccommodation(id) {
  try {
    const { data } = await client.get(`/accommodations/${id}`)
    return data
  } catch (err) {
    throw friendly(err)
  }
}

export async function getPriceList() {
  try {
    const { data } = await client.get('/price-list')
    return data
  } catch (err) {
    throw friendly(err)
  }
}

/**
 * Ask the model for a nightly price.
 * @returns {{recommended:number, random_forest?:number, decision_tree?:number, rate_card?:object}}
 */
export async function predictPrice(features) {
  try {
    const { data } = await client.post('/predict', features)
    return data
  } catch (err) {
    throw friendly(err)
  }
}

/** LKR formatting — the dataset is entirely in Sri Lankan Rupees. */
export function formatLKR(value, { compact = false } = {}) {
  if (value == null || Number.isNaN(Number(value))) return '—'
  const n = Number(value)
  if (compact && Math.abs(n) >= 1000) {
    return `LKR ${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`
  }
  return `LKR ${Math.round(n).toLocaleString('en-LK')}`
}

/** Bootstrap badge colour for a price delta between list and predicted price. */
export function deltaBadge(delta) {
  if (delta == null) return { cls: 'bg-secondary', label: 'No estimate' }
  const pct = Math.abs(delta)
  if (pct <= 500) return { cls: 'bg-success', label: 'Matches estimate' }
  if (delta > 0) return { cls: 'bg-warning text-dark', label: 'Above estimate' }
  return { cls: 'bg-info', label: 'Below estimate' }
}

export default client
