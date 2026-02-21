import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { db } from '../db.js';

const router = Router();
router.use(authMiddleware);

router.get('/by-vehicle', (req, res) => {
  const { vehicle_id } = req.query;
  if (!vehicle_id) return res.status(400).json({ error: 'vehicle_id required' });

  const fuel = db.prepare(`
    SELECT COALESCE(SUM(cost), 0) as total FROM fuel_logs WHERE vehicle_id = ?
  `).get(vehicle_id);
  const maintenance = db.prepare(`
    SELECT COALESCE(SUM(cost), 0) as total FROM maintenance_logs WHERE vehicle_id = ?
  `).get(vehicle_id);
  const other = db.prepare(`
    SELECT COALESCE(SUM(cost), 0) as total FROM expense_logs WHERE vehicle_id = ?
  `).get(vehicle_id);

  res.json({
    fuel: fuel.total,
    maintenance: maintenance.total,
    other: other.total,
    total: fuel.total + maintenance.total + other.total,
  });
});

router.get('/logs', (req, res) => {
  const { vehicle_id } = req.query;
  let sql = `
    SELECT e.*, v.name as vehicle_name
    FROM expense_logs e
    JOIN vehicles v ON e.vehicle_id = v.id
  `;
  const params = [];
  if (vehicle_id) { sql += ' WHERE e.vehicle_id = ?'; params.push(vehicle_id); }
  sql += ' ORDER BY e.date DESC';
  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

router.post('/logs', requireRole('manager', 'financial_analyst'), (req, res) => {
  const { vehicle_id, trip_id, description, cost, category, date } = req.body;
  if (!vehicle_id || !cost || !date) {
    return res.status(400).json({ error: 'vehicle_id, cost, date required' });
  }
  const result = db.prepare(`
    INSERT INTO expense_logs (vehicle_id, trip_id, description, cost, category, date)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(vehicle_id, trip_id || null, description || null, cost, category || null, date);

  const log = db.prepare('SELECT * FROM expense_logs WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(log);
});
