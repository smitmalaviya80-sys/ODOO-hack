import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { db } from '../db.js';

const router = Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM drivers ORDER BY name').all();
  res.json(rows);
});

router.get('/available', (req, res) => {
  const rows = db.prepare(`
    SELECT * FROM drivers
    WHERE status = 'on_duty'
    AND (license_expiry IS NULL OR date(license_expiry) > date('now'))
    ORDER BY name
  `).all();
  res.json(rows);
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM drivers WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Driver not found' });
  res.json(row);
});

router.post('/', requireRole('manager', 'safety_officer'), (req, res) => {
  const { name, email, license_number, license_category, license_expiry } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  const result = db.prepare(`
    INSERT INTO drivers (name, email, license_number, license_category, license_expiry, status)
    VALUES (?, ?, ?, ?, ?, 'off_duty')
  `).run(name || null, email || null, license_number || null, license_category || null, license_expiry || null);
  const driver = db.prepare('SELECT * FROM drivers WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(driver);
});

router.patch('/:id', requireRole('manager', 'safety_officer'), (req, res) => {
  const { name, email, license_number, license_category, license_expiry, status, safety_score, trip_completion_rate } = req.body;
  const id = req.params.id;
  const updates = [];
  const params = [];
  if (name !== undefined) { updates.push('name = ?'); params.push(name); }
  if (email !== undefined) { updates.push('email = ?'); params.push(email); }
  if (license_number !== undefined) { updates.push('license_number = ?'); params.push(license_number); }
  if (license_category !== undefined) { updates.push('license_category = ?'); params.push(license_category); }
  if (license_expiry !== undefined) { updates.push('license_expiry = ?'); params.push(license_expiry); }
  if (status !== undefined) { updates.push('status = ?'); params.push(status); }
  if (safety_score !== undefined) { updates.push('safety_score = ?'); params.push(safety_score); }
  if (trip_completion_rate !== undefined) { updates.push('trip_completion_rate = ?'); params.push(trip_completion_rate); }
  if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });
  updates.push('updated_at = CURRENT_TIMESTAMP');
  params.push(id);
  db.prepare(`UPDATE drivers SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  const driver = db.prepare('SELECT * FROM drivers WHERE id = ?').get(id);
  res.json(driver);
});
