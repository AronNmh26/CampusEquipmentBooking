# Campus Equipment Booking API

An API for reserving shared campus equipment without allowing overlapping bookings for the same equipment.

## Technology

- TypeScript
- Hono
- Cloudflare Workers
- Cloudflare D1 (SQLite)
- Wrangler

## Setup and run

```bash
npm install
npm run db:migrate
npm run dev
```

The local API base URL is `http://localhost:8787/api`.

The deployed Cloudflare API base URL is `https://campus-equipment-booking.aron078.workers.dev/api`.

Open `http://localhost:8787` in a browser to use the minimalist frontend. It loads equipment and bookings from the API and supports creating and deleting bookings.

## Endpoints

- `GET /equipment`
- `GET /bookings`
- `GET /bookings/:id`
- `POST /bookings`
- `PATCH /bookings/:id`
- `DELETE /bookings/:id`

The schema and complete contract are in [API_CONTRACT.md](API_CONTRACT.md). SQL request values are passed through D1 bindings.

## Curl examples

```bash
curl http://localhost:8787/api/equipment
curl http://localhost:8787/api/bookings

curl -X POST http://localhost:8787/api/bookings \
  -H 'Content-Type: application/json' \
  -d '{"equipmentId":"eq-1","borrowerName":"Somchai Jaidee","startAt":"2026-10-20T09:00:00.000Z","endAt":"2026-10-20T11:00:00.000Z","purpose":"Class presentation"}'
```

## Database

`npm run db:migrate` applies the migration and seeds `eq-1` and `eq-2` to the local D1 database. `npm run typecheck` checks the TypeScript source.

## Test summary

Curl checks were run against the local Wrangler server on 2026-10-06:

- `GET /equipment` -> `200`
- `GET /bookings` -> `200`
- Valid `POST /bookings` -> `201`
- Unknown equipment and invalid time order -> `400`
- Overlapping `POST /bookings` -> `409`
- Existing and missing booking lookup -> `200` and `404`
- `PATCH /bookings/:id` -> `200`
- `DELETE /bookings/:id` -> `204`

The complete observed responses are recorded in [AI_LOG.md](AI_LOG.md).