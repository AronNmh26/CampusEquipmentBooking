PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS equipment (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  equipment_id TEXT NOT NULL,
  borrower_name TEXT NOT NULL,
  start_at TEXT NOT NULL,
  end_at TEXT NOT NULL,
  purpose TEXT NOT NULL,
  FOREIGN KEY (equipment_id) REFERENCES equipment(id)
);

INSERT OR IGNORE INTO equipment (id, name, location)
VALUES ('eq-1', 'Projector A', 'Building 1');

INSERT OR IGNORE INTO equipment (id, name, location)
VALUES ('eq-2', 'Camera A', 'Building 2');