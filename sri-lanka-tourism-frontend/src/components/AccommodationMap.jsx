import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { Link } from 'react-router-dom'
import L from 'leaflet'
import { FiMapPin } from 'react-icons/fi'
import { formatLKR } from '../services/tourismApi'

// Leaflet's default marker icons 404 under Vite because it resolves the
// image paths relative to the CSS. Point them at the CDN instead.
const icon = (color) =>
  L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background:${color};
      width:26px;height:26px;border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      border:2px solid #fff;
      box-shadow:0 2px 6px rgba(0,0,0,.35);
      display:flex;align-items:center;justify-content:center;
    "><span style="transform:rotate(45deg);color:#fff;font-size:12px;">●</span></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 26],
    popupAnchor: [0, -24],
  })

const markerIcon = icon('#0d6efd')

/** Sri Lanka, roughly centred on the island. */
const SL_CENTER = [7.8731, 80.7718]

/** Fit bounds to whatever markers are present. */
function FitBounds({ items }) {
  const map = useMap()
  const pts = useMemo(
    () => items.map((i) => [Number(i.Latitude), Number(i.Longitude)]).filter(([la, lo]) => la && lo),
    [items]
  )

  // Keyed on the point list so we only re-fit when the markers actually change.
  const key = useMemo(() => pts.map((p) => p.join(',')).join('|'), [pts])

  useEffect(() => {
    if (pts.length > 1) {
      map.fitBounds(pts, { padding: [40, 40] })
    } else if (pts.length === 1) {
      map.setView(pts[0], 12)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, map])

  return null
}

export default function AccommodationMap({ items = [] }) {
  const valid = items.filter((i) => i.Latitude && i.Longitude)

  if (valid.length === 0) {
    return (
      <div className="lt-note mb-0">
        <FiMapPin size={16} className="lt-note__icon" />
        <div>No properties on this page have coordinates.</div>
      </div>
    )
  }

  return (
    <div className="lt-map">
      <div className="lt-map__head">
        <h3 className="lt-map__title">
          <FiMapPin size={16} style={{ color: 'var(--lt-amber)' }} />
          Map of this page ({valid.length} propert{valid.length === 1 ? 'y' : 'ies'})
        </h3>
        <span className="lt-map__hint">Markers are clickable</span>
      </div>

      <div className="lt-map__canvas">
        <MapContainer
          center={SL_CENTER}
          zoom={8}
          scrollWheelZoom
        >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds items={valid} />
        {valid.map((r) => (
          <Marker
            key={r._id}
            position={[Number(r.Latitude), Number(r.Longitude)]}
            icon={markerIcon}
          >
            <Popup>
              <div style={{ minWidth: 200 }}>
                <strong>{r.Name || 'Unnamed'}</strong>
                <div className="text-muted small mb-1">{r.Type} · {r.District}</div>
                <div className="fw-bold text-primary mb-1">
                  {formatLKR(r['Price Per Night - Double (LKR)'])} / night
                </div>
                <div className="small text-muted mb-2">
                  {r.Rooms} rooms · {r['Meal Plan (BB/HB/FB)'] || 'BB'}
                </div>
                <Link to={`/accommodation/${r._id}`} className="btn btn-primary btn-sm w-100">
                  View details
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
        </MapContainer>
      </div>
    </div>
  )
}
