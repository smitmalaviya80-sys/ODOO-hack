import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { db } from '../db.js';

const router = Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  const { vehicle_id } = req.query;
  let sql = `
    SELECT f.*, v.name as vehicle_name, v.license_plate
    FROM fuel_logs f
    JOIN vehicles v ON f.vehicle_id = v.id
  `;
  const params = [];
  if (vehicle_id) { sql += ' WHERE f.vehicle_id = ?'; params.push(vehicle_id); }
  sql += ' ORDER BY f.date DESC';
  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

router.post('/', requireRole('manager', 'dispatcher', 'financial_analyst'), (req, res) => {
  const { vehicle_id, trip_id, liters, cost, date, odometer } = req.body;
  if (!vehicle_id || !liters || !cost || !date) {
    return res.status(400).json({ error: 'vehicle_id, liters, cost, date required' });
  }
  const result = db.prepare(`
    INSERT INTO fuel_logs (vehicle_id, trip_id, liters, cost, date, odometer)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(vehicle_id, trip_id || null, liters, cost, date, odometer || null);

  const log = db.prepare(`
    SELECT f.*, v.name as vehicle_name FROM fuel_logs f
    JOIN vehicles v ON f.vehicle_id = v.id WHERE f.id = ?
  `).get(result.lastInsertRowid);
  res.status(201).json(log);
});
