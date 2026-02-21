import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { db } from '../db.js';

const router = Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  const { status } = req.query;
  let sql = 'SELECT * FROM cargo';
  const params = [];
  if (status) { sql += ' WHERE status = ?'; params.push(status); }
  sql += ' ORDER BY id DESC';
  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

router.post('/', (req, res) => {
  const { description, weight_kg } = req.body;
  if (!weight_kg || weight_kg <= 0) return res.status(400).json({ error: 'Valid weight_kg required' });
  const result = db.prepare(`
    INSERT INTO cargo (description, weight_kg, status) VALUES (?, ?, 'pending')
  `).run(description || null, weight_kg);
  const cargo = db.prepare('SELECT * FROM cargo WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(cargo);
});
