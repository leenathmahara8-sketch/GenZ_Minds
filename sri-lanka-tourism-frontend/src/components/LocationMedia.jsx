import { useEffect, useState } from 'react'

/**
 * The dataset carries coordinates but no photography, so each card renders the
 * OpenStreetMap tile that contains the property instead. Tiles are requested in
 * a burst (one per card), and proxies occasionally drop some of them, so a
 * failed request is retried with a short backoff before falling back to a
 * designed teal panel rather than showing a broken image.
 */

/** Slippy-map tile containing a lat/lon, plus the fractional offset within it. */
function tileXY(lat, lon, z) {
  const n = 2 ** z
  const x = Math.floor(((lon + 180) / 360) * n)
  const rad = (lat * Math.PI) / 180
  const yFloat = ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n
  return { x, y: Math.floor(yFloat), yFloat }
}

function mapTileUrl(lat, lon, z = 14) {
  const { x, y } = tileXY(lat, lon, z)
  return `https://tile.openstreetmap.org/${z}/${x}/${y}.png`
}

/**
 * object-position-y that puts the property at the centre of the frame.
 *
 * A square tile in an `aspect` (w/h) box with object-fit:cover fills the width
 * and crops vertically, so the visible band of the tile moves with the
 * position percentage. Solving for the percentage that centres `fy` gives
 *     t = (fy - 1/(2*aspect)) / (1 - 1/aspect)
 * Clamped to [0,1] because points outside the croppable band can't be centred.
 */
function tilePositionY(lat, lon, z = 14, aspect = 16 / 11) {
  const { yFloat } = tileXY(lat, lon, z)
  const fy = yFloat - Math.floor(yFloat)
  const t = (fy - 1 / (2 * aspect)) / (1 - 1 / aspect)
  return `${Math.round(Math.min(1, Math.max(0, t)) * 100)}%`
}

const isNum = (v) => typeof v === 'number' && Number.isFinite(v)
const MAX_ATTEMPTS = 2

export default function LocationMedia({
  lat,
  lon,
  alt = '',
  zoom = 14,
  aspect = 16 / 11,
  fallbackLabel = 'SL',
  className = '',
}) {
  const [attempt, setAttempt] = useState(0)
  const [failed, setFailed] = useState(false)
  const [timer, setTimer] = useState(null)

  const usable = isNum(lat) && isNum(lon) && !(lat === 0 && lon === 0)
  const url = usable ? mapTileUrl(lat, lon, zoom) : null

  // Drop any pending retry if the record changes or we unmount.
  useEffect(() => () => clearTimeout(timer), [timer])

  if (!url || failed) {
    return (
      <div className={`lt-card__fallback ${className}`} aria-hidden="true">
        <span>{fallbackLabel}</span>
      </div>
    )
  }

  const handleError = () => {
    if (attempt >= MAX_ATTEMPTS) {
      setFailed(true)
      return
    }
    const delay = 350 * (attempt + 1)
    setTimer(
      setTimeout(() => setAttempt((a) => a + 1), delay),
    )
  }

  return (
    <img
      // Remount on each retry so the browser actually re-requests the tile.
      key={attempt}
      className={`lt-card__img ${className}`}
      src={url}
      alt={alt}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      style={{ '--lt-tile-y': tilePositionY(lat, lon, zoom, aspect) }}
      onError={handleError}
    />
  )
}
