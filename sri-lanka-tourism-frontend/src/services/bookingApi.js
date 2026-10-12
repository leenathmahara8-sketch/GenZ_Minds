import axios from 'axios'

/**
 * Booking.com hotel search & details, via RapidAPI.
 *
 * Docs: https://rapidapi.com/DataCrawler/api/booking-com
 * Host: booking-com.p.rapidapi.com
 *
 * NOTE: these endpoints are READ-ONLY (search / details / rooms / reviews).
 * They cannot create a reservation or take a payment — that requires
 * Booking.com's official Demand API /orders endpoints, which need an
 * approved partner agreement.
 */

const BASE_URL = 'https://booking-com.p.rapidapi.com'
const LOCALE = 'en-gb'

const API_KEY = import.meta.env.VITE_RAPIDAPI_KEY
const API_HOST = import.meta.env.VITE_RAPIDAPI_HOST || 'booking-com.p.rapidapi.com'

export const isBookingConfigured = () => Boolean(API_KEY)

/** Raised when the key is missing, so the UI can show setup help instead of a raw 401. */
export class BookingNotConfiguredError extends Error {
  constructor() {
    super('Missing VITE_RAPIDAPI_KEY. Add it to .env and restart the dev server.')
    this.name = 'BookingNotConfiguredError'
  }
}

const client = axios.create({ baseURL: BASE_URL, timeout: 20000 })

client.interceptors.request.use((config) => {
  if (!API_KEY) throw new BookingNotConfiguredError()
  config.headers['X-RapidAPI-Key'] = API_KEY
  config.headers['X-RapidAPI-Host'] = API_HOST
  return config
})

/**
 * Turn an axios error into something the UI can actually display.
 * RapidAPI returns useful detail in `error.response.data` — keep it.
 */
function toFriendlyError(error) {
  if (error instanceof BookingNotConfiguredError) return error

  const status = error.response?.status
  const detail =
    error.response?.data?.message ||
    error.response?.data?.error ||
    error.response?.data?.detail ||
    error.message

  if (status === 429) {
    const err = new Error('Rate limit reached on the Booking.com API. Try again in a moment.')
    err.status = 429
    return err
  }
  if (status === 401 || status === 403) {
    const err = new Error('Booking.com API rejected the key. Check VITE_RAPIDAPI_KEY and your RapidAPI subscription.')
    err.status = status
    return err
  }

  const err = new Error(detail || 'Could not reach the Booking.com API.')
  err.status = status
  return err
}

async function get(path, params) {
  try {
    const { data } = await client.get(path, { params: { locale: LOCALE, ...params } })
    return data
  } catch (error) {
    throw toFriendlyError(error)
  }
}

/**
 * Resolve free text ("Kandy", "Ella", "Sigiriya") into a Booking.com dest_id.
 * Always returns an array; pick `[0]` for the top match.
 */
export async function searchLocations(name) {
  const query = name?.trim()
  if (!query) return []
  const data = await get('/v1/hotels/locations', { name: query })
  return Array.isArray(data) ? data : []
}

/**
 * Search available hotels for a destination.
 * Returns `{ results, total }` — `total` is null when the API omits a count.
 * @param {object} search - { destId, destType, checkin, checkout, adults, children, rooms, currency, orderBy, page }
 */
export async function searchHotels({
  destId,
  destType = 'city',
  checkin,
  checkout,
  adults = 2,
  children = 0,
  childrenAges = '',
  rooms = 1,
  currency = 'USD',
  orderBy = 'popularity',
  page = 0,
} = {}) {
  const data = await get('/v1/hotels/search', {
    dest_id: destId,
    dest_type: destType,
    checkin_date: checkin,
    checkout_date: checkout,
    adults_number: adults,
    room_number: rooms,
    filter_by_currency: currency,
    order_by: orderBy,
    units: 'metric',
    page_number: page,
    ...(children > 0 ? { children_number: children, children_ages: childrenAges } : {}),
  })

  const results = data?.result ?? []
  // The count field name has changed across API versions — probe the common ones.
  const total =
    data?.total_count ??
    data?.count ??
    data?.result?.total_count ??
    null

  return { results: Array.isArray(results) ? results : [], total }
}

/**
 * Everything the hotel detail page needs, in one call.
 * Requires dates so the API can return live pricing.
 */
export async function getHotelDetails(hotelId, { checkin, checkout, currency = 'USD' } = {}) {
  const data = await get('/v2/hotels/details', {
    hotel_id: hotelId,
    checkin_date: checkin,
    checkout_date: checkout,
    currency,
  })
  return data?.result ?? data
}

/** Amenity list for the detail page. */
export async function getHotelFacilities(hotelId) {
  const data = await get('/v1/hotels/facilities', { hotel_id: hotelId })
  return data?.result ?? []
}

/** Full text description for the detail page. */
export async function getHotelDescription(hotelId) {
  const data = await get('/v1/hotels/description', { hotel_id: hotelId })
  return typeof data?.result === 'string' ? data.result : (data?.result?.description ?? '')
}

/** Check-in/out times and house rules. */
export async function getHotelPolicies(hotelId) {
  const data = await get('/v1/hotels/policies', { hotel_id: hotelId })
  return data?.result ?? {}
}

/** Room types with live prices for the selected dates. */
export async function getRoomList(hotelId, { checkin, checkout, adults = 2, rooms = 1, currency = 'USD' } = {}) {
  const data = await get('/v1/hotels/room-list', {
    hotel_id: hotelId,
    checkin_date: checkin,
    checkout_date: checkout,
    currency,
    units: 'metric',
    adults_number_by_rooms: Array.from({ length: rooms }, () => Math.ceil(adults / rooms)).join(','),
  })
  return data?.result ?? []
}

/** Photo gallery URLs. */
export async function getHotelPhotos(hotelId) {
  if (!hotelId) throw new Error('hotelId is required')
  const data = await get('/v1/hotels/photos', { hotel_id: hotelId })
  return data?.result ?? []
}

/* ------------------------------------------------------------------ *
 * Normalisers — the API is loose about which fields are present, so
 * read defensively and give the UI something predictable.
 * ------------------------------------------------------------------ */

export function normalizeHotel(raw = {}) {
  return {
    id: raw.hotel_id ?? raw.id,
    name: raw.hotel_name ?? raw.name ?? 'Unnamed property',
    address: raw.address_trans ?? raw.address ?? '',
    city: raw.city_name_en ?? raw.city ?? '',
    countryCode: raw.countrycode ?? '',
    distanceToCentre: raw.distance ?? null,
    stars: raw.hotel_class ?? raw.class_is_estimated ?? null,
    reviewScore: raw.review_score ?? null,
    reviewWord: raw.review_score_word ?? '',
    reviewCount: raw.review_count ?? null,
    price: raw.min_total_price ?? raw.price ?? null,
    currency: raw.currency_code ?? 'USD',
    isFreeCancellable: Boolean(raw.is_free_cancellable),
    isMobileDeal: Boolean(raw.is_mobile_deal),
    imageUrl: raw.max_photo_url ?? raw.photo_main_url ?? raw.url ?? null,
    latitude: raw.latitude ?? null,
    longitude: raw.longitude ?? null,
    bookingUrl: raw.url ?? null,
    raw,
  }
}

/** Common review badge colouring, Bootstrap-style. */
export function scoreBadgeClass(score) {
  const n = Number(score)
  if (Number.isNaN(n)) return 'bg-secondary'
  if (n >= 9) return 'bg-success'
  if (n >= 8) return 'bg-primary'
  if (n >= 7) return 'bg-info'
  if (n >= 6) return 'bg-warning text-dark'
  return 'bg-secondary'
}

export { LOCALE }
