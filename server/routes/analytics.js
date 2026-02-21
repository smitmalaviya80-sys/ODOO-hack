import { Router } from 'express';
import PDFDocument from 'pdfkit';
import { authMiddleware } from '../middleware/auth.js';
import { db } from '../db.js';

const router = Router();
router.use(authMiddleware);

router.get('/fuel-efficiency', (req, res) => {
  const rows = db.prepare(`
    SELECT v.id, v.name, v.license_plate,
           COALESCE(SUM(t.end_odometer - t.start_odometer), 0) as total_km,
           COALESCE(SUM(f.liters), 0) as total_liters,
           CASE WHEN SUM(f.liters) > 0
             THEN ROUND(SUM(t.end_odometer - t.start_odometer) * 1.0 / SUM(f.liters), 2)
             ELSE 0 END as km_per_liter
    FROM vehicles v
    LEFT JOIN trips t ON v.id = t.vehicle_id AND t.status = 'completed' AND t.end_odometer IS NOT NULL AND t.start_odometer IS NOT NULL
    LEFT JOIN fuel_logs f ON v.id = f.vehicle_id
    GROUP BY v.id
  `).all();
  res.json(rows);
});

router.get('/vehicle-roi', (req, res) => {
  const rows = db.prepare(`
    SELECT v.id, v.name, v.license_plate, v.acquisition_cost,
           COALESCE(SUM(m.cost), 0) as maintenance_cost,
           COALESCE(SUM(f.cost), 0) as fuel_cost
    FROM vehicles v
    LEFT JOIN maintenance_logs m ON v.id = m.vehicle_id
    LEFT JOIN fuel_logs f ON v.id = f.vehicle_id
    GROUP BY v.id
  `).all();
  const withRoi = rows.map(r => ({
    ...r,
    total_cost: r.maintenance_cost + r.fuel_cost,
    roi: r.acquisition_cost > 0
      ? ((0 - (r.maintenance_cost + r.fuel_cost)) / r.acquisition_cost * 100).toFixed(2)
      : null,
  }));
  res.json(withRoi);
});

router.get('/operational-costs', (req, res) => {
  const rows = db.prepare(`
    SELECT v.id, v.name, v.license_plate,
           COALESCE(SUM(f.cost), 0) as fuel_cost,
           COALESCE(SUM(m.cost), 0) as maintenance_cost,
           COALESCE(SUM(e.cost), 0) as other_cost
    FROM vehicles v
    LEFT JOIN fuel_logs f ON v.id = f.vehicle_id
    LEFT JOIN maintenance_logs m ON v.id = m.vehicle_id
    LEFT JOIN expense_logs e ON v.id = e.vehicle_id
    GROUP BY v.id
  `).all();
  res.json(rows);
});

router.get('/export/csv', (req, res) => {
  const { type } = req.query;
  let data, headers;
  if (type === 'vehicles') {
    headers = ['id', 'name', 'license_plate', 'status', 'odometer', 'max_capacity_kg'];
    data = db.prepare('SELECT id, name, license_plate, status, odometer, max_capacity_kg FROM vehicles').all();
  } else if (type === 'drivers') {
    headers = ['id', 'name', 'status', 'license_expiry', 'safety_score', 'trip_completion_rate'];
    data = db.prepare('SELECT id, name, status, license_expiry, safety_score, trip_completion_rate FROM drivers').all();
  } else if (type === 'trips') {
    headers = ['id', 'vehicle_id', 'driver_id', 'status', 'cargo_weight_kg', 'created_at'];
    data = db.prepare('SELECT id, vehicle_id, driver_id, status, cargo_weight_kg, created_at FROM trips').all();
  } else {
    return res.status(400).json({ error: 'Invalid type. Use vehicles, drivers, or trips' });
  }
  const csv = [headers.join(','), ...data.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=${type}-export.csv`);
  res.send(csv);
});

router.get('/export/pdf', (req, res) => {
  const doc = new PDFDocument();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=fleet-health-audit.pdf');
  doc.pipe(res);
  doc.fontSize(20).text('Fleet Health Audit Report', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Generated: ${new Date().toISOString().split('T')[0]}`, { align: 'center' });
  doc.moveDown(2);

  const vehicles = db.prepare(`
    SELECT v.name, v.license_plate, v.status, v.odometer
    FROM vehicles v WHERE v.status != 'out_of_service'
  `).all();
  doc.text('Vehicle Status Summary:', { underline: true });
  doc.moveDown();
  vehicles.forEach(v => {
    doc.text(`${v.name} (${v.license_plate}): ${v.status} | Odometer: ${v.odometer} km`);
  });
  doc.end();
});
