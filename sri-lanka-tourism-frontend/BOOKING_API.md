# Booking.com API integration

Hotel search + property details in the Sri Lanka Tourism app, using the
**Booking.com API on RapidAPI**.

## What it does

| Feature | Endpoint | File |
|---|---|---|
| Destination autocomplete | `GET /v1/hotels/locations` | `src/services/bookingApi.js` |
| Hotel search (dates, guests, price) | `GET /v1/hotels/search` | `src/services/bookingApi.js` |
| Property details + live price | `GET /v2/hotels/details` | `src/services/bookingApi.js` |
| Amenities | `GET /v1/hotels/facilities` | `src/services/bookingApi.js` |
| Description | `GET /v1/hotels/description` | `src/services/bookingApi.js` |
| House rules | `GET /v1/hotels/policies` | `src/services/bookingApi.js` |
| Room list + prices | `GET /v1/hotels/room-list` | `src/services/bookingApi.js` |

Pages: `src/pages/Hotels.jsx` (search) and `src/pages/HotelDetail.jsx` (detail).
Routes: `/hotels` and `/hotels/:id`.

## Setup

1. Create a free account at [RapidAPI](https://rapidapi.com).
2. Open the [Booking.com API](https://rapidapi.com/DataCrawler/api/booking-com) and click **Subscribe**
   (the free tier is enough to start).
3. Copy your `X-RapidAPI-Key` from the RapidAPI dashboard.
4. Copy `.env.example` to `.env` and paste it in:

   ```bash
   cp .env.example .env
   ```

   ```
   VITE_RAPIDAPI_KEY=your_key_here
   VITE_RAPIDAPI_HOST=booking-com.p.rapidapi.com
   ```

5. Restart the dev server — Vite only reads `.env` at startup:

   ```bash
   npm run dev
   ```

Without a key, `/hotels` renders setup instructions instead of failing silently.

## ⚠️ Known limitations

**1. This is a read-only integration.** These endpoints return search results,
prices, photos and reviews — they **cannot create a reservation or take a
payment**. Actual in-app booking lives on Booking.com's official
[ Demand API ](https://developers.booking.com/) `/orders/create`, which requires an
approved partner agreement and is not part of the RapidAPI offering.

Today, "Continue on Booking.com" hands the traveller off via the property's
affiliate URL, so the booking still credits you.

**2. The API key is shipped to the browser.** Any `VITE_`-prefixed variable is
inlined into the public JS bundle — this was a deliberate choice for this
project, but anyone can read the key and consume your quota. Before deploying
publicly:

- keep the free tier's monthly limits in mind, and/or
- move the calls behind a tiny proxy (e.g. a serverless function holding the
  key server-side) and point `bookingApi.js` at it instead.

`.env` is git-ignored via `.gitignore`, so the key will not be committed.

## Error handling

`bookingApi.js` converts raw axios failures into readable messages:

| Status | Shown as |
|---|---|
| missing key | setup instructions panel on `/hotels` |
| `401` / `403` | "API rejected the key — check your subscription" |
| `429` | "Rate limit reached — try again in a moment" |
| anything else | the API's own `message` / `error` field |
