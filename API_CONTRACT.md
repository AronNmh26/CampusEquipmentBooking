# Campus Equipment Booking API Contract

## Base URL

`http://localhost:8787/api`

### `GET /`

Returns API information and the available endpoint list with status `200`. The deployed equivalent is `https://campus-equipment-booking.aron078.workers.dev/api`.

## Equipment

### `GET /equipment`

Returns the available equipment with status `200`.

Example response:

```json
[
  { "id": "eq-1", "name": "Projector A", "location": "Building 1" },
  { "id": "eq-2", "name": "Camera A", "location": "Building 2" }
]
```

## Bookings

All booking responses use this shape:

```json
{
  "id": "booking-id",
  "equipmentId": "eq-1",
  "borrowerName": "Somchai Jaidee",
  "startAt": "2026-10-20T09:00:00.000Z",
  "endAt": "2026-10-20T11:00:00.000Z",
  "purpose": "Class presentation"
}
```

| Method | Path | Success |
| --- | --- | --- |
| GET | `/bookings` | `200`, array of bookings |
| GET | `/bookings/:id` | `200`, one booking |
| POST | `/bookings` | `201`, created booking |
| PATCH | `/bookings/:id` | `200`, updated booking |
| DELETE | `/bookings/:id` | `204`, no response body |

POST and PATCH use JSON fields `equipmentId`, `borrowerName`, `startAt`, `endAt`, and `purpose`. PATCH accepts a partial object and validates the resulting complete booking.

## Validation and errors

- `equipmentId` must identify an existing equipment record.
- All booking fields must be present after a PATCH.
- `startAt` and `endAt` must be valid date/time values.
- `startAt` must be before `endAt`.
- Accepted date/time values are normalized to UTC ISO 8601 strings in stored and returned bookings.
- Invalid or missing data returns `400`.
- A missing booking returns `404`.
- A booking time conflict returns `409`.
- Every error response is JSON: `{ "error": "A readable message" }`.

For the same equipment, a new booking overlaps an existing booking when:

`existing.startAt < new.endAt AND existing.endAt > new.startAt`

An ending time equal to another booking's starting time is allowed. PATCH excludes the booking being updated from its conflict query.

## Schema / ERD

```text
equipment (id PK, name, location)
    1
    |
    many
bookings (id PK, equipment_id FK, borrower_name, start_at, end_at, purpose)
```