import { useEffect, useState } from 'react';
import { api, FuelEfficiencyRow, VehicleRoiRow, OperationalCostRow } from '../lib/api';

export default function Analytics() {
  const [fuelEff, setFuelEff] = useState<FuelEfficiencyRow[]>([]);
  const [roi, setRoi] = useState<VehicleRoiRow[]>([]);
  const [costs, setCosts] = useState<OperationalCostRow[]>([]);

  useEffect(() => {
    api.analytics.fuelEfficiency().then(setFuelEff);
    api.analytics.vehicleRoi().then(setRoi);
    api.analytics.operationalCosts().then(setCosts);
  }, []);

  const handleExport = async (url: string, filename: string) => {
    const token = localStorage.getItem('token');
    const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!res.ok) throw new Error('Export failed');
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-100 mb-2">Operational Analytics & Financial Reports</h1>
      <p className="text-slate-400 mb-6">Fuel efficiency, Vehicle ROI, one-click CSV/PDF exports</p>

      <div className="flex gap-4 mb-8">
        <button
          onClick={() => handleExport(api.analytics.exportCsv('vehicles'), 'vehicles-export.csv')}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm"
        >
          Export Vehicles CSV
        </button>
        <button
          onClick={() => handleExport(api.analytics.exportCsv('drivers'), 'drivers-export.csv')}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm"
        >
          Export Drivers CSV
        </button>
        <button
          onClick={() => handleExport(api.analytics.exportCsv('trips'), 'trips-export.csv')}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm"
        >
          Export Trips CSV
        </button>
        <button
          onClick={() => handleExport('/api/analytics/export/pdf', 'fleet-health-audit.pdf')}
          className="px-4 py-2 bg-fleet-600 hover:bg-fleet-500 rounded-lg text-sm"
        >
          Export Health Audit PDF
        </button>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="text-lg font-semibold text-slate-200 mb-4">Fuel Efficiency (km/L)</h2>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="px-4 py-3 text-slate-400 font-medium">Vehicle</th>
                  <th className="px-4 py-3 text-slate-400 font-medium">License</th>
                  <th className="px-4 py-3 text-slate-400 font-medium">Total KM</th>
                  <th className="px-4 py-3 text-slate-400 font-medium">Total Liters</th>
                  <th className="px-4 py-3 text-slate-400 font-medium">km/L</th>
                </tr>
              </thead>
              <tbody>
                {fuelEff.map((r) => (
                  <tr key={r.id} className="border-b border-slate-800/50">
                    <td className="px-4 py-3">{r.name}</td>
                    <td className="px-4 py-3 font-mono">{r.license_plate}</td>
                    <td className="px-4 py-3">{r.total_km}</td>
                    <td className="px-4 py-3">{r.total_liters}</td>
                    <td className="px-4 py-3 font-medium text-fleet-400">{r.km_per_liter}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-200 mb-4">Vehicle ROI</h2>
          <p className="text-sm text-slate-500 mb-2">Formula: (Revenue - Maintenance - Fuel) / Acquisition Cost (simplified)</p>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="px-4 py-3 text-slate-400 font-medium">Vehicle</th>
                  <th className="px-4 py-3 text-slate-400 font-medium">Acquisition Cost</th>
                  <th className="px-4 py-3 text-slate-400 font-medium">Maintenance</th>
                  <th className="px-4 py-3 text-slate-400 font-medium">Fuel</th>
                  <th className="px-4 py-3 text-slate-400 font-medium">Total Cost</th>
                  <th className="px-4 py-3 text-slate-400 font-medium">ROI %</th>
                </tr>
              </thead>
              <tbody>
                {roi.map((r) => (
                  <tr key={r.id} className="border-b border-slate-800/50">
                    <td className="px-4 py-3">{r.name}</td>
                    <td className="px-4 py-3">${r.acquisition_cost?.toFixed(2) ?? 0}</td>
                    <td className="px-4 py-3">${r.maintenance_cost.toFixed(2)}</td>
                    <td className="px-4 py-3">${r.fuel_cost.toFixed(2)}</td>
                    <td className="px-4 py-3">${r.total_cost.toFixed(2)}</td>
                    <td className="px-4 py-3">{r.roi != null ? `${r.roi}%` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-200 mb-4">Operational Costs by Vehicle</h2>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="px-4 py-3 text-slate-400 font-medium">Vehicle</th>
                  <th className="px-4 py-3 text-slate-400 font-medium">Fuel</th>
                  <th className="px-4 py-3 text-slate-400 font-medium">Maintenance</th>
                  <th className="px-4 py-3 text-slate-400 font-medium">Other</th>
                  <th className="px-4 py-3 text-slate-400 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {costs.map((r) => (
                  <tr key={r.id} className="border-b border-slate-800/50">
                    <td className="px-4 py-3">{r.name}</td>
                    <td className="px-4 py-3">${r.fuel_cost.toFixed(2)}</td>
                    <td className="px-4 py-3">${r.maintenance_cost.toFixed(2)}</td>
                    <td className="px-4 py-3">${r.other_cost.toFixed(2)}</td>
                    <td className="px-4 py-3 font-medium">
                      ${(r.fuel_cost + r.maintenance_cost + r.other_cost).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
