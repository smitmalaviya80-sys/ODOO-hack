import { useEffect, useState } from 'react';
import { api, FuelLog, Vehicle, VehicleCosts } from '../lib/api';

export default function ExpenseFuelLogging() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<number | null>(null);
  const [costs, setCosts] = useState<VehicleCosts | null>(null);
  const [form, setForm] = useState({
    vehicle_id: '',
    trip_id: '',
    liters: '',
    cost: '',
    date: new Date().toISOString().split('T')[0],
    odometer: '',
  });

  useEffect(() => {
    api.vehicles.list().then(setVehicles);
    api.fuel.list().then(setFuelLogs);
  }, []);

  useEffect(() => {
    if (selectedVehicle) {
      api.expenses.byVehicle(selectedVehicle).then(setCosts);
      api.fuel.list(selectedVehicle).then(setFuelLogs);
    } else {
      setCosts(null);
      api.fuel.list().then(setFuelLogs);
    }
  }, [selectedVehicle]);

  const load = () => {
    api.fuel.list(selectedVehicle || undefined).then(setFuelLogs);
    if (selectedVehicle) api.expenses.byVehicle(selectedVehicle).then(setCosts);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.fuel.create({
        vehicle_id: Number(form.vehicle_id),
        liters: Number(form.liters),
        cost: Number(form.cost),
        date: form.date,
        odometer: form.odometer ? Number(form.odometer) : undefined,
      });
      setForm({ vehicle_id: '', trip_id: '', liters: '', cost: '', date: new Date().toISOString().split('T')[0], odometer: '' });
      load();
    } catch (err: unknown) {
      alert((err as Error).message);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-100 mb-2">Completed Trip, Expense & Fuel Logging</h1>
      <p className="text-slate-400 mb-6">Financial tracking per asset. Total Operational Cost = Fuel + Maintenance per Vehicle.</p>

      <div className="flex gap-4 mb-6">
        <select
          value={selectedVehicle ?? ''}
          onChange={(e) => setSelectedVehicle(e.target.value ? Number(e.target.value) : null)}
          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg"
        >
          <option value="">All Vehicles</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>{v.name} ({v.license_plate})</option>
          ))}
        </select>
      </div>

      {selectedVehicle && costs && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <p className="text-slate-400 text-sm">Fuel Cost</p>
            <p className="text-xl font-bold text-fleet-400">${costs.fuel.toFixed(2)}</p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <p className="text-slate-400 text-sm">Maintenance Cost</p>
            <p className="text-xl font-bold text-amber-400">${costs.maintenance.toFixed(2)}</p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <p className="text-slate-400 text-sm">Other Expenses</p>
            <p className="text-xl font-bold text-slate-300">${costs.other.toFixed(2)}</p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <p className="text-slate-400 text-sm">Total Operational Cost</p>
            <p className="text-xl font-bold text-emerald-400">${costs.total.toFixed(2)}</p>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="mb-6 p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4"
      >
        <h3 className="font-semibold">Log Fuel</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Vehicle</label>
            <select
              value={form.vehicle_id}
              onChange={(e) => setForm((f) => ({ ...f, vehicle_id: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg"
              required
            >
              <option value="">Select</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Liters</label>
            <input
              type="number"
              step="0.01"
              value={form.liters}
              onChange={(e) => setForm((f) => ({ ...f, liters: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Cost ($)</label>
            <input
              type="number"
              step="0.01"
              value={form.cost}
              onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Odometer (optional)</label>
            <input
              type="number"
              value={form.odometer}
              onChange={(e) => setForm((f) => ({ ...f, odometer: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg"
            />
          </div>
        </div>
        <button type="submit" className="px-4 py-2 bg-fleet-600 hover:bg-fleet-500 rounded-lg">
          Add Fuel Log
        </button>
      </form>

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="px-4 py-3 text-slate-400 font-medium">Vehicle</th>
              <th className="px-4 py-3 text-slate-400 font-medium">Liters</th>
              <th className="px-4 py-3 text-slate-400 font-medium">Cost</th>
              <th className="px-4 py-3 text-slate-400 font-medium">Date</th>
              <th className="px-4 py-3 text-slate-400 font-medium">Odometer</th>
            </tr>
          </thead>
          <tbody>
            {fuelLogs.map((f) => (
              <tr key={f.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                <td className="px-4 py-3">{f.vehicle_name}</td>
                <td className="px-4 py-3">{f.liters} L</td>
                <td className="px-4 py-3">${f.cost}</td>
                <td className="px-4 py-3">{new Date(f.date).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-slate-300">{f.odometer ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
