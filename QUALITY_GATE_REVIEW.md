# Quality Gate Review

Review date: 2026-10-06

## Snapshot note

The original pre-30-minute snapshot was not preserved in the starter project, so this document does not claim to reproduce that historical snapshot. The findings below are based on the current implementation, an actual review of the source, and repeatable HTTP checks run after the fixes.

## Finding 1: timezone offsets could bypass overlap detection

### What I found

The API validated timestamps with `Date.parse`, but stored the original strings. The SQL overlap query compares timestamp text. Two valid timestamps representing overlapping UTC times could therefore be ordered incorrectly as strings.

### How I fixed it

The booking validator now converts valid `startAt` and `endAt` values to `toISOString()` before conflict checks, inserts, updates, and responses. The database now compares one consistent UTC format.

### Evidence

After the fix, a booking from `13:00-14:00-04:00` was followed by an equivalent overlapping booking from `17:30-18:30Z`. The second request returned JSON `409`.

## Finding 2: the edge-case test evidence did not cover timestamp formats or touching bookings

### What I found

The original curl evidence covered the required CRUD, validation, not-found, and ordinary overlap cases, but it did not demonstrate the timezone-format edge case or prove that a booking ending exactly when another starts is allowed.

### How I fixed it

I added these cases to the quality review and repeated them against the running API. The test bookings were deleted after verification.

### Evidence

- Overlapping timezone-equivalent booking: JSON `409`.
- Back-to-back booking where the first ends at `11:00Z` and the next starts at `11:00Z`: `201`.
- PATCHing a booking without changing its time: `200`, confirming the current booking is excluded from its own conflict query.

## Finding 3: the AI log did not explain the main decisions in my own words

### What I found

The original AI log recorded the generated implementation and basic checks, but it did not explain why the status codes, parameter binding, UTC normalization, and PATCH exclusion are important.

### How I fixed it

I added a short explanation of the timestamp decision and overlap rule to `AI_LOG.md`, alongside the observed verification results. I can explain the remaining design decisions from `API_CONTRACT.md` and the route code.

### Evidence

`AI_LOG.md` now records the UTC normalization decision, the strict overlap formula, and the observed `409`, `201`, and `200` results from the review tests.

## Remaining limitation

The API performs the conflict query and insert as separate operations. Concurrent requests could theoretically pass the check at the same time. This was not required by the practical brief and was not changed because it would require a larger transaction/concurrency design.