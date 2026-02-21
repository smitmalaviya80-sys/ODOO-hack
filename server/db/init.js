import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import bcrypt from 'bcryptjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, 'fleet.db');
const db = new Database(dbPath);

const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

// Seed default user (password: fleet123)
const passwordHash = bcrypt.hashSync('fleet123', 10);
db.prepare(`
  INSERT OR IGNORE INTO users (id, email, password_hash, role, name)
  VALUES (1, 'manager@fleet.com', ?, 'manager', 'Fleet Manager'),
         (2, 'dispatcher@fleet.com', ?, 'dispatcher', 'Dispatcher')
`).run(passwordHash, passwordHash);

// Seed sample data
const typeIds = { Truck: 1, Van: 2, Bike: 3 };
const vehicles = [
  ['Van-01', 'Ford Transit', 'ABC-1234', 2, 500, 'available', 'North'],
  ['Van-02', 'Mercedes Sprinter', 'DEF-5678', 2, 750, 'available', 'South'],
  ['Truck-01', 'Isuzu NPR', 'GHI-9012', 1, 3000, 'available', 'North'],
  ['Bike-01', 'Honda PCX', 'JKL-3456', 3, 50, 'available', 'Central'],
];
vehicles.forEach(([name, model, plate, typeId, cap, status, region]) => {
  db.prepare(`
    INSERT OR IGNORE INTO vehicles (name, model, license_plate, vehicle_type_id, max_capacity_kg, status, region)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(name, model, plate, typeId, cap, status, region);
});

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 365);
const drivers = [
  ['Alex Johnson', 'alex@fleet.com', 'DL-001', 'Van', tomorrow.toISOString().split('T')[0]],
  ['Maria Garcia', 'maria@fleet.com', 'DL-002', 'Truck', tomorrow.toISOString().split('T')[0]],
];
drivers.forEach(([name, email, license, category, expiry], i) => {
  const status = i === 0 ? 'on_duty' : 'off_duty'; // Alex is on duty for demo
  db.prepare(`
    INSERT OR IGNORE INTO drivers (name, email, license_number, license_category, license_expiry, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(name, email, license, category, expiry, status);
});

db.prepare(`
  INSERT OR IGNORE INTO cargo (description, weight_kg, status) VALUES
  ('Electronics shipment', 450, 'pending'),
  ('Office supplies', 120, 'pending'),
  ('Heavy machinery parts', 2800, 'pending')
`).run();

console.log('Database initialized at', dbPath);
db.close();
