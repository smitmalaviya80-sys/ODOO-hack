import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { db } from '../db.js';

const router = Router();
router.use(authMiddleware);

// Adding a vehicle to a Service Log automatically switches its status to "In Shop"
router.post('/', requireRole('manager'), (req, res) => {
  const { vehicle_id, description, service_type, cost } = req.body;
  if (!vehicle_id || !description) {
    return res.status(400).json({ error: 'vehicle_id and description required' });
  }
  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(vehicle_id);
  if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

  const result = db.prepare(`
    INSERT INTO maintenance_logs (vehicle_id, description, service_type, cost, created_by)
    VALUES (?, ?, ?, ?, ?)
  `).run(vehicle_id, description, service_type || 'reactive', cost || 0, req.user?.id || null);

  db.prepare('UPDATE vehicles SET status = ? WHERE id = ?').run('in_shop', vehicle_id);

  const log = db.prepare(`
    SELECT m.*, v.name as vehicle_name, v.license_plate
    FROM maintenance_logs m
    JOIN vehicles v ON m.vehicle_id = v.id
    WHERE m.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(log);
});

router.patch('/:id/complete', requireRole('manager'), (req, res) => {
  const id = req.params.id;
  const log = db.prepare('SELECT * FROM maintenance_logs WHERE id = ?').get(id);
  if (!log) return res.status(404).json({ error: 'Log not found' });

  db.prepare('UPDATE maintenance_logs SET completed_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);

  const activeCount = db.prepare(`
    SELECT COUNT(*) as c FROM maintenance_logs
    WHERE vehicle_id = ? AND completed_at IS NULL
  `).get(log.vehicle_id);
  if (activeCount.c === 0) {
    db.prepare('UPDATE vehicles SET status = ? WHERE id = ?').run('available', log.vehicle_id);
  }

  const updated = db.prepare(`
    SELECT m.*, v.name as vehicle_name FROM maintenance_logs m
    JOIN vehicles v ON m.vehicle_id = v.id WHERE m.id = ?
  `).get(id);
  res.json(updated);
});

router.get('/', (req, res) => {
  const { vehicle_id } = req.query;
  let sql = `
    SELECT m.*, v.name as vehicle_name, v.license_plate
    FROM maintenance_logs m
    JOIN vehicles v ON m.vehicle_id = v.id
  `;
  const params = [];
  if (vehicle_id) { sql += ' WHERE m.vehicle_id = ?'; params.push(vehicle_id); }
  sql += ' ORDER BY m.id DESC';
  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});
