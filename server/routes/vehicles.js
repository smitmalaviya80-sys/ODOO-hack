import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { db } from '../db.js';

const router = Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT v.*, vt.name as vehicle_type
    FROM vehicles v
    JOIN vehicle_types vt ON v.vehicle_type_id = vt.id
    ORDER BY v.name
  `).all();
  res.json(rows);
});

router.get('/available', (req, res) => {
  const rows = db.prepare(`
    SELECT v.*, vt.name as vehicle_type
    FROM vehicles v
    JOIN vehicle_types vt ON v.vehicle_type_id = vt.id
    WHERE v.status = 'available'
    ORDER BY v.name
  `).all();
  res.json(rows);
});

router.get('/types', (req, res) => {
  const rows = db.prepare('SELECT * FROM vehicle_types').all();
  res.json(rows);
});

router.get('/:id', (req, res) => {
  const row = db.prepare(`
    SELECT v.*, vt.name as vehicle_type
    FROM vehicles v
    JOIN vehicle_types vt ON v.vehicle_type_id = vt.id
    WHERE v.id = ?
  `).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Vehicle not found' });
  res.json(row);
});

router.post('/', requireRole('manager', 'dispatcher'), (req, res) => {
  const { name, model, license_plate, vehicle_type_id, max_capacity_kg, region, acquisition_cost } = req.body;
  if (!name || !license_plate || !max_capacity_kg) {
    return res.status(400).json({ error: 'Name, license_plate, and max_capacity_kg required' });
  }
  try {
    const result = db.prepare(`
      INSERT INTO vehicles (name, model, license_plate, vehicle_type_id, max_capacity_kg, region, acquisition_cost)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(name || null, model || null, license_plate, vehicle_type_id || 2, max_capacity_kg, region || null, acquisition_cost || 0);
    const vehicle = db.prepare(`
      SELECT v.*, vt.name as vehicle_type FROM vehicles v
      JOIN vehicle_types vt ON v.vehicle_type_id = vt.id
      WHERE v.id = ?
    `).get(result.lastInsertRowid);
    res.status(201).json(vehicle);
  } catch (e) {
    if (e.message.includes('UNIQUE')) res.status(400).json({ error: 'License plate already exists' });
    else throw e;
  }
});

router.patch('/:id', requireRole('manager', 'dispatcher'), (req, res) => {
  const { name, model, odometer, status, region } = req.body;
  const id = req.params.id;
  const updates = [];
  const params = [];
  if (name !== undefined) { updates.push('name = ?'); params.push(name); }
  if (model !== undefined) { updates.push('model = ?'); params.push(model); }
  if (odometer !== undefined) { updates.push('odometer = ?'); params.push(odometer); }
  if (status !== undefined) { updates.push('status = ?'); params.push(status); }
  if (region !== undefined) { updates.push('region = ?'); params.push(region); }
  if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });
  updates.push('updated_at = CURRENT_TIMESTAMP');
  params.push(id);
  db.prepare(`UPDATE vehicles SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  const vehicle = db.prepare(`
    SELECT v.*, vt.name as vehicle_type FROM vehicles v
    JOIN vehicle_types vt ON v.vehicle_type_id = vt.id
    WHERE v.id = ?
  `).get(id);
  res.json(vehicle);
});
