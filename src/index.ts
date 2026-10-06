import { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
};

type BookingInput = {
  equipmentId: string;
  borrowerName: string;
  startAt: string;
  endAt: string;
  purpose: string;
};

type BookingRow = {
  id: string;
  equipment_id: string;
  borrower_name: string;
  start_at: string;
  end_at: string;
  purpose: string;
};

const app = new Hono<{ Bindings: Bindings }>();
const api = app.basePath('/api');

const frontend = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Campus Equipment Booking</title>
    <style>
      :root { font-family: Georgia, serif; color: #1f2933; background: #f4f1ea; }
      * { box-sizing: border-box; }
      body { margin: 0; }
      main { width: min(900px, calc(100% - 32px)); margin: 48px auto; }
      header { display: flex; justify-content: space-between; align-items: end; gap: 24px; margin-bottom: 32px; }
      h1 { margin: 0; font-size: clamp(2rem, 5vw, 3.5rem); line-height: 1; }
      .subtitle { max-width: 300px; margin: 0; color: #66727d; line-height: 1.5; }
      section { background: #fffdf8; border: 1px solid #ded8ca; border-radius: 8px; padding: 24px; margin-top: 18px; }
      h2 { margin: 0 0 18px; font-size: 1.25rem; }
      .equipment { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; }
      .equipment article { border-left: 3px solid #d4774c; padding: 4px 12px; }
      .equipment strong, .equipment span { display: block; }
      .equipment span, .meta { color: #66727d; font-size: .9rem; }
      form { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
      label { display: grid; gap: 6px; font-size: .9rem; color: #66727d; }
      input, select, button { font: inherit; }
      input, select { width: 100%; padding: 10px; border: 1px solid #c8c1b3; border-radius: 4px; background: #fff; color: #1f2933; }
      .wide { grid-column: 1 / -1; }
      button { border: 0; border-radius: 4px; padding: 10px 16px; background: #1f2933; color: #fffdf8; cursor: pointer; }
      button:hover { background: #d4774c; }
      .booking { display: flex; justify-content: space-between; align-items: center; gap: 16px; border-top: 1px solid #ded8ca; padding: 15px 0; }
      .booking:first-child { border-top: 0; padding-top: 0; }
      .booking p { margin: 4px 0; }
      .booking-actions { display: flex; flex-wrap: wrap; justify-content: end; gap: 8px; }
      .booking button { background: transparent; border: 1px solid #c8c1b3; color: #1f2933; padding: 7px 10px; }
      #message { min-height: 1.5em; margin: 14px 0 0; color: #a44d2b; }
      @media (max-width: 600px) { header { display: block; } .subtitle { margin-top: 12px; } form { grid-template-columns: 1fr; } .wide { grid-column: auto; } .booking { align-items: start; } }
    </style>
  </head>
  <body>
    <main>
      <header>
        <h1>Equipment bookings</h1>
        <p class="subtitle">A small live view of the campus reservation API.</p>
      </header>
      <section>
        <h2>Available equipment</h2>
        <div id="equipment" class="equipment">Loading...</div>
      </section>
      <section>
        <h2>New booking</h2>
        <form id="booking-form">
          <label>Equipment<select id="equipmentId" required></select></label>
          <label>Borrower name<input id="borrowerName" required /></label>
          <label>Starts<input id="startAt" type="datetime-local" required /></label>
          <label>Ends<input id="endAt" type="datetime-local" required /></label>
          <label class="wide">Purpose<input id="purpose" required /></label>
          <button class="wide" type="submit">Create booking</button>
        </form>
        <p id="message" role="status"></p>
      </section>
      <section>
        <h2>Current bookings</h2>
        <button id="refresh-bookings" type="button">Refresh bookings</button>
        <div id="bookings">Loading...</div>
      </section>
    </main>
    <script>
      const equipmentElement = document.querySelector('#equipment');
      const equipmentSelect = document.querySelector('#equipmentId');
      const bookingsElement = document.querySelector('#bookings');
      const messageElement = document.querySelector('#message');
      const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[character]));
      const formatDate = (value) => new Date(value).toLocaleString();
      const loadEquipment = async () => {
        const response = await fetch('/api/equipment');
        const equipment = await response.json();
        equipmentElement.innerHTML = equipment.map((item) => '<article><strong>' + escapeHtml(item.name) + '</strong><span>' + escapeHtml(item.location) + '</span></article>').join('');
        equipmentSelect.innerHTML = equipment.map((item) => '<option value="' + escapeHtml(item.id) + '">' + escapeHtml(item.name) + '</option>').join('');
      };
      const loadBookings = async () => {
        const response = await fetch('/api/bookings');
        const bookings = await response.json();
        bookingsElement.innerHTML = bookings.length ? bookings.map((booking) => '<article class="booking"><div><strong>' + escapeHtml(booking.borrowerName) + '</strong><p>' + escapeHtml(booking.purpose) + '</p><span class="meta">' + escapeHtml(booking.equipmentId) + ' · ' + escapeHtml(formatDate(booking.startAt)) + ' to ' + escapeHtml(formatDate(booking.endAt)) + '</span></div><div class="booking-actions"><button data-action="view" data-id="' + escapeHtml(booking.id) + '">View JSON</button><button data-action="edit" data-id="' + escapeHtml(booking.id) + '">Edit purpose</button><button data-action="delete" data-id="' + escapeHtml(booking.id) + '">Delete</button></div></article>').join('') : '<p class="meta">No bookings yet.</p>';
        bookingsElement.querySelectorAll('button').forEach((button) => button.addEventListener('click', async () => {
          const id = button.dataset.id;
          if (button.dataset.action === 'view') {
            const response = await fetch('/api/bookings/' + id);
            const result = await response.json();
            messageElement.textContent = response.ok ? JSON.stringify(result) : result.error;
            return;
          }
          if (button.dataset.action === 'edit') {
            const purpose = window.prompt('New purpose');
            if (!purpose) return;
            const response = await fetch('/api/bookings/' + id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ purpose }) });
            const result = await response.json();
            messageElement.textContent = response.ok ? 'Booking updated.' : result.error;
            if (response.ok) await loadBookings();
            return;
          }
          const response = await fetch('/api/bookings/' + id, { method: 'DELETE' });
          messageElement.textContent = response.ok ? 'Booking deleted.' : 'Could not delete booking.';
          await loadBookings();
        }));
      };
      document.querySelector('#refresh-bookings').addEventListener('click', loadBookings);
      document.querySelector('#booking-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        const value = (id) => document.querySelector('#' + id).value;
        const response = await fetch('/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ equipmentId: value('equipmentId'), borrowerName: value('borrowerName'), startAt: new Date(value('startAt')).toISOString(), endAt: new Date(value('endAt')).toISOString(), purpose: value('purpose') }) });
        const result = await response.json();
        messageElement.textContent = response.ok ? 'Booking created.' : result.error;
        if (response.ok) { event.target.reset(); await loadBookings(); }
      });
      Promise.all([loadEquipment(), loadBookings()]).catch(() => { messageElement.textContent = 'Could not connect to the API.'; });
    </script>
  </body>
</html>`;

app.get('/', () => new Response(frontend, { headers: { 'Content-Type': 'text/html; charset=UTF-8' } }));

app.get('/api', (context) =>
  context.json({
    name: 'Campus Equipment Booking API',
    endpoints: [
      'GET /api/equipment',
      'GET /api/bookings',
      'GET /api/bookings/:id',
      'POST /api/bookings',
      'PATCH /api/bookings/:id',
      'DELETE /api/bookings/:id',
    ],
  }),
);

function toBooking(row: BookingRow) {
  return {
    id: row.id,
    equipmentId: row.equipment_id,
    borrowerName: row.borrower_name,
    startAt: row.start_at,
    endAt: row.end_at,
    purpose: row.purpose,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateBooking(value: unknown): { input?: BookingInput; error?: string } {
  if (!isRecord(value)) {
    return { error: 'Request body must be a JSON object' };
  }

  const fields = ['equipmentId', 'borrowerName', 'startAt', 'endAt', 'purpose'];
  for (const field of fields) {
    if (typeof value[field] !== 'string' || value[field].trim() === '') {
      return { error: `${field} is required` };
    }
  }

  const input = value as unknown as BookingInput;
  const startTime = Date.parse(input.startAt);
  const endTime = Date.parse(input.endAt);
  if (Number.isNaN(startTime) || Number.isNaN(endTime)) {
    return { error: 'startAt and endAt must be valid date/time values' };
  }
  if (startTime >= endTime) {
    return { error: 'startAt must be before endAt' };
  }

  return {
    input: {
      ...input,
      startAt: new Date(startTime).toISOString(),
      endAt: new Date(endTime).toISOString(),
    },
  };
}

async function hasConflict(
  db: D1Database,
  input: BookingInput,
  excludedId?: string,
): Promise<boolean> {
  let statement = db
    .prepare(
      'SELECT id FROM bookings WHERE equipment_id = ? AND start_at < ? AND end_at > ?',
    )
    .bind(input.equipmentId, input.endAt, input.startAt);

  if (excludedId) {
    statement = db
      .prepare(
        'SELECT id FROM bookings WHERE equipment_id = ? AND start_at < ? AND end_at > ? AND id != ?',
      )
      .bind(input.equipmentId, input.endAt, input.startAt, excludedId);
  }

  return (await statement.first<{ id: string }>()) !== null;
}

api.get('/equipment', async (context) => {
  const result = await context.env.DB.prepare(
    'SELECT id, name, location FROM equipment ORDER BY id',
  ).all();
  return context.json(result.results);
});

api.get('/bookings', async (context) => {
  const result = await context.env.DB.prepare(
    'SELECT id, equipment_id, borrower_name, start_at, end_at, purpose FROM bookings ORDER BY start_at',
  ).all<BookingRow>();
  return context.json(result.results.map(toBooking));
});

api.get('/bookings/:id', async (context) => {
  const row = await context.env.DB.prepare(
    'SELECT id, equipment_id, borrower_name, start_at, end_at, purpose FROM bookings WHERE id = ?',
  )
    .bind(context.req.param('id'))
    .first<BookingRow>();

  if (!row) {
    return context.json({ error: 'Booking not found' }, 404);
  }
  return context.json(toBooking(row));
});

api.post('/bookings', async (context) => {
  let body: unknown;
  try {
    body = await context.req.json();
  } catch {
    return context.json({ error: 'Request body must be valid JSON' }, 400);
  }

  const validation = validateBooking(body);
  if (validation.error || !validation.input) {
    return context.json({ error: validation.error ?? 'Invalid booking data' }, 400);
  }

  const equipment = await context.env.DB.prepare('SELECT id FROM equipment WHERE id = ?')
    .bind(validation.input.equipmentId)
    .first();
  if (!equipment) {
    return context.json({ error: 'Equipment not found' }, 400);
  }

  if (await hasConflict(context.env.DB, validation.input)) {
    return context.json({ error: 'Booking time conflicts with an existing booking' }, 409);
  }

  const id = crypto.randomUUID();
  await context.env.DB.prepare(
    'INSERT INTO bookings (id, equipment_id, borrower_name, start_at, end_at, purpose) VALUES (?, ?, ?, ?, ?, ?)',
  )
    .bind(
      id,
      validation.input.equipmentId,
      validation.input.borrowerName,
      validation.input.startAt,
      validation.input.endAt,
      validation.input.purpose,
    )
    .run();

  return context.json({ id, ...validation.input }, 201);
});

api.patch('/bookings/:id', async (context) => {
  const id = context.req.param('id');
  const existing = await context.env.DB.prepare(
    'SELECT id, equipment_id, borrower_name, start_at, end_at, purpose FROM bookings WHERE id = ?',
  )
    .bind(id)
    .first<BookingRow>();
  if (!existing) {
    return context.json({ error: 'Booking not found' }, 404);
  }

  let body: unknown;
  try {
    body = await context.req.json();
  } catch {
    return context.json({ error: 'Request body must be valid JSON' }, 400);
  }
  if (!isRecord(body)) {
    return context.json({ error: 'Request body must be a JSON object' }, 400);
  }

  const merged = {
    equipmentId: body.equipmentId ?? existing.equipment_id,
    borrowerName: body.borrowerName ?? existing.borrower_name,
    startAt: body.startAt ?? existing.start_at,
    endAt: body.endAt ?? existing.end_at,
    purpose: body.purpose ?? existing.purpose,
  };
  const validation = validateBooking(merged);
  if (validation.error || !validation.input) {
    return context.json({ error: validation.error ?? 'Invalid booking data' }, 400);
  }

  const equipment = await context.env.DB.prepare('SELECT id FROM equipment WHERE id = ?')
    .bind(validation.input.equipmentId)
    .first();
  if (!equipment) {
    return context.json({ error: 'Equipment not found' }, 400);
  }
  if (await hasConflict(context.env.DB, validation.input, id)) {
    return context.json({ error: 'Booking time conflicts with an existing booking' }, 409);
  }

  await context.env.DB.prepare(
    'UPDATE bookings SET equipment_id = ?, borrower_name = ?, start_at = ?, end_at = ?, purpose = ? WHERE id = ?',
  )
    .bind(
      validation.input.equipmentId,
      validation.input.borrowerName,
      validation.input.startAt,
      validation.input.endAt,
      validation.input.purpose,
      id,
    )
    .run();

  return context.json({ id, ...validation.input });
});

api.delete('/bookings/:id', async (context) => {
  const result = await context.env.DB.prepare('DELETE FROM bookings WHERE id = ?')
    .bind(context.req.param('id'))
    .run();
  if (!result.meta.changes) {
    return context.json({ error: 'Booking not found' }, 404);
  }
  return context.body(null, 204);
});

api.notFound((context) => context.json({ error: 'Resource not found' }, 404));
app.onError((error, context) => {
  console.error(error);
  return context.json({ error: 'Internal server error' }, 500);
});

export default app;