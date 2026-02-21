import { useEffect, useState } from 'react';
import { api, MaintenanceLog, Vehicle } from '../lib/api';

export default function MaintenanceLogs() {
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [form, setForm] = useState({
    vehicle_id: '',
    description: '',
    service_type: 'reactive' as 'preventive' | 'reactive',
    cost: '',
  });

  useEffect(() => {
    api.maintenance.list().then(setLogs);
  }, []);

  useEffect(() => {
    api.vehicles.list().then((v) => setVehicles(v.filter((x) => x.status !== 'out_of_service')));
  }, []);

  const load = () => api.maintenance.list().then(setLogs);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.maintenance.create({
        vehicle_id: Number(form.vehicle_id),
        description: form.description,
        service_type: form.service_type,
        cost: form.cost ? Number(form.cost) : undefined,
      });
      setForm({ vehicle_id: '', description: '', service_type: 'reactive', cost: '' });
      load();
    } catch (err: unknown) {
      alert((err as Error).message);
    }
  };

  const completeLog = async (id: number) => {
    try {
      await api.maintenance.complete(id);
      load();
    } catch (err: unknown) {
      alert((err as Error).message);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-100 mb-2">Maintenance & Service Logs</h1>
      <p className="text-slate-400 mb-6">
        Adding a vehicle to a Service Log automatically switches its status to &quot;In Shop&quot;, removing it from the Dispatcher pool.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mb-6 p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4"
      >
        <h3 className="font-semibold">Log Service</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Vehicle</label>
            <select
              value={form.vehicle_id}
              onChange={(e) => setForm((f) => ({ ...f, vehicle_id: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg"
              required
            >
              <option value="">Select vehicle</option>
              {vehicles
                .filter((v) => v.status !== 'in_shop' && v.status !== 'on_trip')
                .map((v) => (
                  <option key={v.id} value={v.id}>{v.name} ({v.license_plate})</option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Description</label>
            <input
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg"
              placeholder="e.g. Oil Change"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Type</label>
            <select
              value={form.service_type}
              onChange={(e) => setForm((f) => ({ ...f, service_type: e.target.value as 'preventive' | 'reactive' }))}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg"
            >
              <option value="preventive">Preventive</option>
              <option value="reactive">Reactive</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Cost ($)</label>
            <input
              type="number"
              step="0.01"
              value={form.cost}
              onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg"
            />
          </div>
        </div>
        <button type="submit" className="px-4 py-2 bg-fleet-600 hover:bg-fleet-500 rounded-lg">
          Add Service Log
        </button>
      </form>

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="px-4 py-3 text-slate-400 font-medium">Vehicle</th>
              <th className="px-4 py-3 text-slate-400 font-medium">Description</th>
              <th className="px-4 py-3 text-slate-400 font-medium">Type</th>
              <th className="px-4 py-3 text-slate-400 font-medium">Cost</th>
              <th className="px-4 py-3 text-slate-400 font-medium">Date</th>
              <th className="px-4 py-3 text-slate-400 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                <td className="px-4 py-3 font-medium">{l.vehicle_name} ({l.license_plate})</td>
                <td className="px-4 py-3">{l.description}</td>
                <td className="px-4 py-3 text-slate-300 capitalize">{l.service_type}</td>
                <td className="px-4 py-3">${l.cost}</td>
                <td className="px-4 py-3 text-slate-300">{new Date(l.performed_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  {l.completed_at ? (
                    <span className="text-emerald-400">Completed</span>
                  ) : (
                    <button
                      onClick={() => completeLog(l.id)}
                      className="text-fleet-400 hover:underline"
                    >
                      Mark Complete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
