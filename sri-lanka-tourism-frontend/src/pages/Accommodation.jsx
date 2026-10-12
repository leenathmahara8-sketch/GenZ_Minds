import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  FiSearch, FiMapPin, FiHome, FiUsers, FiChevronLeft, FiChevronRight,
  FiAlertTriangle, FiStar, FiGrid, FiCompass, FiArrowLeft, FiMap,
} from 'react-icons/fi'
import { getAccommodations, getFilters, formatLKR } from '../services/tourismApi'
import AccommodationMap from '../components/AccommodationMap'
import LocationMedia from '../components/LocationMedia'

const PER_PAGE = 24

/* The spreadsheet's raw type strings contain typos / stray spaces, so display
   labels are normalised while filtering still keys off the raw value. */
const TYPE_LABELS = {
  Bangalows: 'Bungalows',
  'Classified Hotels( 1-5 Star)': 'Classified Hotels',
  'Home Stay Units': 'Home Stays',
  'Rented Apartments': 'Apartments',
}
const typeLabel = (raw) => TYPE_LABELS[raw] || raw || 'Property'

const GRADE_LABELS = {
  ONE: '1 Star', TWO: '2 Star', THREE: '3 Star', FOUR: '4 Star', FIVE: '5 Star',
}
const gradeLabel = (raw) => {
  if (!raw || raw === '-') return null
  return GRADE_LABELS[raw] || raw
}

const TYPE_ICONS = {
  'Guest Houses': FiHome,
  'Home Stay Units': FiHome,
  Bangalows: FiHome,
  'Boutique Villas': FiHome,
  'Rented Homes': FiHome,
  'Tourist Hotels': FiStar,
  'Classified Hotels( 1-5 Star)': FiStar,
  'Boutique Hotels': FiStar,
  'Rented Apartments': FiGrid,
  'Heritage Bungalows': FiCompass,
  'Heritage Homes': FiCompass,
}
const typeIcon = (raw) => TYPE_ICONS[raw] || FiMapPin

/** Price bands matching the reference "Budget / Mid-range / Luxury" filter. */
const BUDGETS = [
  { id: 'any', label: 'Any' },
  { id: 'budget', label: 'Budget', min: '', max: '9999' },
  { id: 'mid', label: 'Mid-range', min: '10000', max: '30000' },
  { id: 'lux', label: 'Luxury', min: '30001', max: '' },
]

const SORTS = [
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'name', label: 'Name (A-Z)' },
  { value: 'rooms_desc', label: 'Most rooms' },
  { value: 'district', label: 'District' },
]

const tierOf = (price) => {
  if (price < 10000) return { key: 'budget', label: 'Budget' }
  if (price <= 30000) return { key: 'mid', label: 'Mid-range' }
  return { key: 'lux', label: 'Luxury' }
}

export default function Accommodation() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [q, setQ] = useState(searchParams.get('q') || '')
  const [district, setDistrict] = useState(searchParams.get('district') || '')
  const [type, setType] = useState(searchParams.get('type') || '')
  const [grade, setGrade] = useState(searchParams.get('grade') || '')
  const [budget, setBudget] = useState(searchParams.get('budget') || 'any')
  const [sort, setSort] = useState(searchParams.get('sort') || 'price_asc')

  const [filters, setFilters] = useState(null)
  const [data, setData] = useState({ results: [], total: 0, page: 1, pages: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showMap, setShowMap] = useState(false)

  // Facet options (districts, types, grades) — fetched once.
  useEffect(() => {
    let alive = true
    getFilters()
      .then((f) => { if (alive) setFilters(f) })
      .catch((err) => { if (alive) setError(err) })
    return () => { alive = false }
  }, [])

  // Monotonic id so a slow earlier response can't clobber a newer one —
  // clicking a filter while the first fetch is still in flight used to let the
  // stale, unfiltered result land last and reset both the grid and the URL.
  const requestRef = useRef(0)

  const fetchPage = useCallback(async (pageNo) => {
    const seq = ++requestRef.current
    setLoading(true)
    setError(null)
    try {
      const band = BUDGETS.find((b) => b.id === budget) || BUDGETS[0]
      const res = await getAccommodations({
        q,
        district,
        type,
        grade,
        min_price: band.min,
        max_price: band.max,
        sort,
        page: pageNo,
        per_page: PER_PAGE,
      })

      if (seq !== requestRef.current) return // superseded by a newer request

      setData(res)

      const next = {}
      if (q) next.q = q
      if (district) next.district = district
      if (type) next.type = type
      if (grade) next.grade = grade
      if (budget && budget !== 'any') next.budget = budget
      if (sort !== 'price_asc') next.sort = sort
      if (res.page > 1) next.page = String(res.page)
      setSearchParams(next)
    } catch (err) {
      if (seq !== requestRef.current) return
      setError(err)
    } finally {
      if (seq === requestRef.current) setLoading(false)
    }
  }, [q, district, type, grade, budget, sort, setSearchParams])

  // Refetch when any filter changes; always jump back to page 1.
  useEffect(() => {
    fetchPage(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [district, type, grade, budget, sort])

  const onSubmit = (e) => {
    e.preventDefault()
    fetchPage(1)
  }

  const goto = (n) => {
    fetchPage(n)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const clearAll = () => {
    setQ('')
    setDistrict('')
    setType('')
    setGrade('')
    setBudget('any')
    setSort('price_asc')
  }

  const activeFilters = [q, district, type, grade].filter(Boolean).length + (budget !== 'any' ? 1 : 0)

  const results = useMemo(() => data.results || [], [data.results])
  const mappable = useMemo(
    () => results.filter((r) => r.Longitude && r.Latitude),
    [results],
  )

  const districtCount = filters?.districts?.length ?? 25

  return (
    <div className="animate-fade-in">
      {/* ---------------- Teal hero band ---------------- */}
      <header className="lt-band">
        <div className="container">
          <Link to="/" className="lt-band__back">
            <FiArrowLeft size={14} /> Home
          </Link>

          <div className="d-flex flex-wrap justify-content-between align-items-end gap-3">
            <div>
              <span className="lt-eyebrow lt-eyebrow--light">Sri Lanka Tourism Database</span>
              <h1 className="lt-band__title">Stay &amp; Accommodation</h1>
              <p className="lt-band__sub">
                {filters
                  ? `${filters.count.toLocaleString()} properties across ${districtCount} districts, priced in LKR per night.`
                  : 'Loading the property database…'}
              </p>
            </div>

            <div className="lt-band__actions">
              <button
                type="button"
                className={`lt-btn lt-btn--sm ${showMap ? 'lt-btn--amber' : 'lt-btn--on-teal'}`}
                onClick={() => setShowMap((v) => !v)}
              >
                <FiMap size={15} /> {showMap ? 'Hide map' : 'Show map'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ---------------- Cream body ---------------- */}
      <div className="container lt-section">
        {/* Filters */}
        <div className="lt-filters">
          <form className="lt-filters__row" onSubmit={onSubmit}>
            <div className="lt-search">
              <FiSearch size={16} className="lt-search__icon" />
              <input
                className="lt-search__input"
                type="search"
                placeholder="Search name, address or area…"
                aria-label="Search properties"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            <div className="lt-pills">
              <button
                type="button"
                className={`lt-pill ${!type ? 'is-active' : ''}`}
                onClick={() => setType('')}
              >
                <FiMapPin size={14} /> All Types
              </button>
              {(filters?.types || []).map((t) => {
                const Icon = typeIcon(t)
                return (
                  <button
                    key={t}
                    type="button"
                    className={`lt-pill ${type === t ? 'is-active' : ''}`}
                    onClick={() => setType(type === t ? '' : t)}
                    title={t}
                  >
                    <Icon size={14} /> {typeLabel(t)}
                  </button>
                )
              })}
            </div>
          </form>

          <div className="lt-filters__row">
            <span className="lt-filters__label">Budget</span>
            <div className="lt-pills">
              {BUDGETS.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  className={`lt-pill lt-pill--warm ${budget === b.id ? 'is-active' : ''}`}
                  onClick={() => setBudget(b.id)}
                >
                  {b.label}
                </button>
              ))}
            </div>

            <span className="lt-filters__spacer" />

            <select
              className="lt-select"
              aria-label="Filter by district"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
            >
              <option value="">All districts</option>
              {(filters?.districts || []).map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            <select
              className="lt-select"
              aria-label="Filter by grade"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
            >
              <option value="">Any grade</option>
              {(filters?.grades || []).map((g) => (
                <option key={g} value={g}>{g === '-' ? 'No grade' : g}</option>
              ))}
            </select>

            <select
              className="lt-select"
              aria-label="Sort results"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>

            {activeFilters > 0 && (
              <button type="button" className="lt-pill" onClick={clearAll}>
                Clear {activeFilters}
              </button>
            )}
          </div>

          <p className="lt-filters__count">
            {loading ? (
              'Searching…'
            ) : (
              <>
                Showing <strong>{data.total.toLocaleString()}</strong> propert
                {data.total === 1 ? 'y' : 'ies'}
                {district && <> in <strong>{district}</strong></>}
                {type && <> · {typeLabel(type)}</>}
                {budget !== 'any' && (
                  <> · {(BUDGETS.find((b) => b.id === budget) || {}).label}</>
                )}
              </>
            )}
          </p>
        </div>

        {/* Errors */}
        {error && (
          <div className="lt-note" role="alert" style={{ marginBottom: '1.5rem' }}>
            <FiAlertTriangle className="lt-note__icon" size={17} />
            <div>
              <strong>Could not load the dataset.</strong>
              <div>{error.message}</div>
              <button
                type="button"
                className="lt-btn lt-btn--ghost lt-btn--sm"
                style={{ marginTop: '0.6rem' }}
                onClick={() => fetchPage(1)}
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Map */}
        {showMap && !error && (
          <div style={{ marginBottom: '1.75rem' }}>
            <AccommodationMap items={mappable} />
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="lt-grid">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="lt-card"
                aria-hidden="true"
                style={{ pointerEvents: 'none' }}
              >
                <div className="lt-card__media">
                  <div className="lt-skeleton" style={{ position: 'absolute', inset: 0, borderRadius: 0 }} />
                </div>
                <div className="lt-card__body">
                  <div className="lt-skeleton" style={{ width: '45%', height: 11 }} />
                  <div className="lt-skeleton" style={{ width: '100%', height: 12 }} />
                  <div className="lt-skeleton" style={{ width: '80%', height: 12 }} />
                  <div className="lt-chips">
                    <div className="lt-skeleton" style={{ width: 66, height: 22, borderRadius: 999 }} />
                    <div className="lt-skeleton" style={{ width: 54, height: 22, borderRadius: 999 }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cards */}
        {!loading && !error && results.length > 0 && (
          <div className="lt-grid">
            {results.map((r) => {
              const price = r['Price Per Night - Double (LKR)']
              const tier = tierOf(price)
              const Icon = typeIcon(r.Type)
              const grade = gradeLabel(r.Grade)

              return (
                <Link key={r._id} to={`/accommodation/${r._id}`} className="lt-card">
                  <div className="lt-card__media">
                    <LocationMedia
                      lat={r.Latitude}
                      lon={r.Longitude}
                      alt={`Map of ${r.Name || 'property'} in ${r.District}`}
                      fallbackLabel={r.District || 'SL'}
                    />
                    <div className="lt-card__scrim" />
                    <span className="lt-card__tag">
                      <Icon size={13} />
                      <span>{typeLabel(r.Type)}</span>
                    </span>
                    <span className={`lt-tier lt-tier--${tier.key}`}>{tier.label}</span>
                    <div className="lt-card__overlay">
                      <h3 className="lt-card__name">{r.Name || 'Unnamed property'}</h3>
                      <span className="lt-card__price">
                        {formatLKR(price, { compact: true })}
                      </span>
                    </div>
                  </div>

                  <div className="lt-card__body">
                    <div className="lt-card__region">{r.District} District</div>
                    <p className="lt-card__desc">{r.Address || 'Address on file'}</p>

                    <div className="lt-chips">
                      <span className="lt-chip">
                        <FiUsers size={12} /> {r.Rooms} room{r.Rooms !== 1 ? 's' : ''}
                      </span>
                      <span className="lt-chip">{r['Meal Plan (BB/HB/FB)'] || 'BB'}</span>
                      {grade && <span className="lt-chip lt-chip--teal">{grade}</span>}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && results.length === 0 && (
          <div className="lt-empty">
            <FiSearch size={52} className="lt-empty__icon" />
            <h3 className="lt-empty__title">No properties match those filters</h3>
            <p>Try a wider budget band or a different district.</p>
            <button type="button" className="lt-btn lt-btn--teal" onClick={clearAll}>
              Clear all filters
            </button>
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && data.pages > 1 && (
          <nav className="lt-pager" aria-label="Pagination">
            <button
              type="button"
              className="lt-btn lt-btn--ghost lt-btn--sm"
              disabled={data.page <= 1}
              onClick={() => goto(data.page - 1)}
            >
              <FiChevronLeft size={15} /> Previous
            </button>

            <span className="lt-pager__status">
              Page {data.page} of {data.pages} · {data.total.toLocaleString()} total
            </span>

            <button
              type="button"
              className="lt-btn lt-btn--ghost lt-btn--sm"
              disabled={data.page >= data.pages}
              onClick={() => goto(data.page + 1)}
            >
              Next <FiChevronRight size={15} />
            </button>
          </nav>
        )}
      </div>
    </div>
  )
}
