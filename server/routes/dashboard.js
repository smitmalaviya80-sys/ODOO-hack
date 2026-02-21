import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { db } from '../db.js';

const router = Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  const activeFleet = db.prepare(
    "SELECT COUNT(*) as count FROM vehicles WHERE status = 'on_trip'"
  ).get();
  const maintenanceAlerts = db.prepare(
    "SELECT COUNT(*) as count FROM vehicles WHERE status = 'in_shop'"
  ).get();
  const totalVehicles = db.prepare('SELECT COUNT(*) as count FROM vehicles WHERE status != ?').get('out_of_service');
  const assignedCount = db.prepare(
    "SELECT COUNT(*) as count FROM vehicles WHERE status IN ('on_trip', 'in_shop')"
  ).get();
  const utilization = totalVehicles.count > 0
    ? Math.round((assignedCount.count / totalVehicles.count) * 100)
    : 0;
  const pendingCargo = db.prepare(
    "SELECT COUNT(*) as count FROM cargo WHERE status = 'pending'"
  ).get();

  res.json({
    activeFleet: activeFleet.count,
    maintenanceAlerts: maintenanceAlerts.count,
    utilizationRate: utilization,
    pendingCargo: pendingCargo.count,
  });
});

router.get('/vehicles', (req, res) => {
  const { type, status, region } = req.query;
  let sql = `
    SELECT v.*, vt.name as vehicle_type
    FROM vehicles v
    JOIN vehicle_types vt ON v.vehicle_type_id = vt.id
    WHERE v.status != 'out_of_service'
  `;
  const params = [];
  if (type) { sql += ' AND vt.name = ?'; params.push(type); }
  if (status) { sql += ' AND v.status = ?'; params.push(status); }
  if (region) { sql += ' AND v.region = ?'; params.push(region); }
  sql += ' ORDER BY v.name';
  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});
