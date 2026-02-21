import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { db } from '../db.js';

const router = Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  const { status } = req.query;
  let sql = `
    SELECT t.*, v.name as vehicle_name, v.license_plate, v.max_capacity_kg,
           d.name as driver_name, c.description as cargo_description
    FROM trips t
    JOIN vehicles v ON t.vehicle_id = v.id
    JOIN drivers d ON t.driver_id = d.id
    LEFT JOIN cargo c ON t.cargo_id = c.id
  `;
  const params = [];
  if (status) { sql += ' WHERE t.status = ?'; params.push(status); }
  sql += ' ORDER BY t.id DESC';
  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

router.post('/', requireRole('manager', 'dispatcher'), (req, res) => {
  const { vehicle_id, driver_id, cargo_id, origin, destination, cargo_weight_kg } = req.body;

  if (!vehicle_id || !driver_id || !cargo_weight_kg) {
    return res.status(400).json({ error: 'vehicle_id, driver_id, and cargo_weight_kg required' });
  }

  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(vehicle_id);
  if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
  if (vehicle.status !== 'available') {
    return res.status(400).json({ error: 'Vehicle not available (may be on trip or in shop)' });
  }

  const driver = db.prepare('SELECT * FROM drivers WHERE id = ?').get(driver_id);
  if (!driver) return res.status(404).json({ error: 'Driver not found' });
  if (driver.status !== 'on_duty') {
    return res.status(400).json({ error: 'Driver not on duty' });
  }
  if (driver.license_expiry && new Date(driver.license_expiry) < new Date()) {
    return res.status(400).json({ error: 'Driver license expired - cannot assign' });
  }

  if (cargo_weight_kg > vehicle.max_capacity_kg) {
    return res.status(400).json({
      error: `Cargo weight (${cargo_weight_kg}kg) exceeds vehicle max capacity (${vehicle.max_capacity_kg}kg)`,
    });
  }

  const result = db.prepare(`
    INSERT INTO trips (vehicle_id, driver_id, cargo_id, origin, destination, cargo_weight_kg, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, 'draft', ?)
  `).run(vehicle_id, driver_id, cargo_id || null, origin || null, destination || null, cargo_weight_kg, req.user?.id || null);

  const trip = db.prepare(`
    SELECT t.*, v.name as vehicle_name, v.license_plate, d.name as driver_name, c.description as cargo_description
    FROM trips t JOIN vehicles v ON t.vehicle_id = v.id
    JOIN drivers d ON t.driver_id = d.id
    LEFT JOIN cargo c ON t.cargo_id = c.id
    WHERE t.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(trip);
});

router.patch('/:id/status', requireRole('manager', 'dispatcher'), (req, res) => {
  const { status } = req.body;
  const id = req.params.id;
  if (!['draft', 'dispatched', 'completed', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(id);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });

  const prevStatus = trip.status;

  if (status === 'dispatched') {
    db.prepare('UPDATE vehicles SET status = ? WHERE id = ?').run('on_trip', trip.vehicle_id);
    db.prepare('UPDATE drivers SET status = ? WHERE id = ?').run('on_trip', trip.driver_id);
    if (trip.cargo_id) {
      db.prepare('UPDATE cargo SET status = ? WHERE id = ?').run('assigned', trip.cargo_id);
    }
  }

  if (status === 'completed' || status === 'cancelled') {
    db.prepare('UPDATE vehicles SET status = ? WHERE id = ?').run('available', trip.vehicle_id);
    db.prepare('UPDATE drivers SET status = ? WHERE id = ?').run('on_duty', trip.driver_id);
    if (trip.cargo_id && status === 'completed') {
      db.prepare('UPDATE cargo SET status = ? WHERE id = ?').run('delivered', trip.cargo_id);
    } else if (trip.cargo_id && status === 'cancelled') {
      db.prepare('UPDATE cargo SET status = ? WHERE id = ?').run('pending', trip.cargo_id);
    }
  }

  const updates = ['status = ?'];
  const params = [status];
  if (status === 'completed' && req.body.end_odometer != null) {
    updates.push('end_odometer = ?', 'completed_at = CURRENT_TIMESTAMP');
    params.push(req.body.end_odometer);
    db.prepare('UPDATE vehicles SET odometer = ? WHERE id = ?').run(req.body.end_odometer, trip.vehicle_id);
  }
  if (status === 'dispatched' && req.body.start_odometer != null) {
    updates.push('start_odometer = ?');
    params.push(req.body.start_odometer);
  }
  params.push(id);
  db.prepare(`UPDATE trips SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  const updated = db.prepare(`
    SELECT t.*, v.name as vehicle_name, v.license_plate, d.name as driver_name, c.description as cargo_description
    FROM trips t JOIN vehicles v ON t.vehicle_id = v.id
    JOIN drivers d ON t.driver_id = d.id
    LEFT JOIN cargo c ON t.cargo_id = c.id
    WHERE t.id = ?
  `).get(id);

  res.json(updated);
});

router.patch('/:id', requireRole('manager', 'dispatcher'), (req, res) => {
  const { origin, destination, end_odometer } = req.body;
  const id = req.params.id;
  const updates = [];
  const params = [];
  if (origin !== undefined) { updates.push('origin = ?'); params.push(origin); }
  if (destination !== undefined) { updates.push('destination = ?'); params.push(destination); }
  if (end_odometer !== undefined) {
    updates.push('end_odometer = ?');
    params.push(end_odometer);
    const trip = db.prepare('SELECT vehicle_id FROM trips WHERE id = ?').get(id);
    if (trip) db.prepare('UPDATE vehicles SET odometer = ? WHERE id = ?').run(end_odometer, trip.vehicle_id);
  }
  if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });
  params.push(id);
  db.prepare(`UPDATE trips SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  const trip = db.prepare(`
    SELECT t.*, v.name as vehicle_name, v.license_plate, d.name as driver_name
    FROM trips t JOIN vehicles v ON t.vehicle_id = v.id JOIN drivers d ON t.driver_id = d.id WHERE t.id = ?
  `).get(id);
  res.json(trip);
});
