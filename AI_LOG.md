# AI Assistance Log

## Prompt/Task

Help implement the Midterm Practical Lab Test: Campus Equipment Booking API using the existing TypeScript, Hono, Wrangler, and SQLite/D1 stack.

## AI Output Used

The implementation uses a Hono API with D1 parameterized SQL, seeded equipment, booking CRUD routes, input validation, and overlap checks. It also includes the API contract and setup documentation.

For the quality-gate improvement, I chose to normalize accepted date/time values to UTC ISO 8601 strings before the overlap query. This keeps SQLite text comparisons chronological even when clients send timezone offsets. I also kept the SQL conflict rule as `existing.startAt < new.endAt AND existing.endAt > new.startAt`, so touching bookings remain allowed.

## My Verification

I ran `npm run typecheck` successfully, applied `npm run db:migrate` successfully, and started the API with `npm run dev` at `http://localhost:8787`. Curl checks returned:

- `GET /equipment`: `200`, with `eq-1` and `eq-2`.
- `GET /bookings`: `200`.
- Valid `POST /bookings`: `201`.
- Unknown `equipmentId`: JSON `400`.
- `startAt >= endAt`: JSON `400`.
- Overlapping booking: JSON `409`.
- Existing booking lookup: `200`.
- Missing booking lookup: JSON `404`.
- PATCH with the existing time slot unchanged: `200`, confirming the current booking is excluded from its own conflict query.
- DELETE: `204`.

During review I also tested timezone-offset timestamps and back-to-back bookings after the normalization change. The overlapping UTC-equivalent booking returned `409`, while a booking starting exactly when another ended returned `201`.