import { useEffect, useState } from 'react';
import { api, Vehicle } from '../lib/api';
import StatusPill from '../components/StatusPill';

export default function VehicleRegistry() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [types, setTypes] = useState<{ id: number; name: string }[]>([]);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [form, setForm] = useState({
    name: '',
    model: '',
    license_plate: '',
    vehicle_type_id: 2,
    max_capacity_kg: '',
    region: '',
    status: 'available' as Vehicle['status'],
  });
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    api.vehicles.list().then(setVehicles);
    api.vehicles.types().then(setTypes);
  }, []);

  const load = () => api.vehicles.list().then(setVehicles);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.vehicles.update(editing.id, {
          name: form.name,
          model: form.model || undefined,
          odometer: undefined,
          status: form.status,
          region: form.region || undefined,
        });
      } else {
        await api.vehicles.create({
          name: form.name,
          model: form.model || undefined,
          license_plate: form.license_plate,
          vehicle_type_id: form.vehicle_type_id,
          max_capacity_kg: Number(form.max_capacity_kg),
          region: form.region || undefined,
        });
      }
      setShowCreate(false);
      setEditing(null);
      resetForm();
      load();
    } catch (err: unknown) {
      alert((err as Error).message);
    }
  };

  const resetForm = () => {
    setForm({
      name: '',
      model: '',
      license_plate: '',
      vehicle_type_id: 2,
      max_capacity_kg: '',
      region: '',
      status: 'available',
    });
  };

  const toggleOutOfService = async (v: Vehicle) => {
    const next = v.status === 'out_of_service' ? 'available' : 'out_of_service';
    try {
      await api.vehicles.update(v.id, { status: next });
      load();
    } catch (err: unknown) {
      alert((err as Error).message);
    }
  };

  const startEdit = (v: Vehicle) => {
    setEditing(v);
    setForm({
      name: v.name,
      model: v.model || '',
      license_plate: v.license_plate,
      vehicle_type_id: v.vehicle_type_id,
      max_capacity_kg: String(v.max_capacity_kg),
      region: v.region || '',
      status: v.status,
    });
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Vehicle Registry</h1>
          <p className="text-slate-400">CRUD for physical assets</p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            resetForm();
            setShowCreate(!showCreate);
          }}
          className="px-4 py-2 bg-fleet-600 hover:bg-fleet-500 text-white font-medium rounded-lg"
        >
          {showCreate ? 'Cancel' : 'Add Vehicle'}
        </button>
      </div>

      {(showCreate || editing) && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4"
        >
          <h3 className="font-semibold">{editing ? 'Edit Vehicle' : 'New Vehicle'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Model</label>
              <input
                value={form.model}
                onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">License Plate</label>
              <input
                value={form.license_plate}
                onChange={(e) => setForm((f) => ({ ...f, license_plate: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg font-mono"
                required
                disabled={!!editing}
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Type</label>
              <select
                value={form.vehicle_type_id}
                onChange={(e) => setForm((f) => ({ ...f, vehicle_type_id: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg"
                disabled={!!editing}
              >
                {types.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Max Capacity (kg)</label>
              <input
                type="number"
                value={form.max_capacity_kg}
                onChange={(e) => setForm((f) => ({ ...f, max_capacity_kg: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg"
                required
                disabled={!!editing}
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Region</label>
              <input
                value={form.region}
                onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg"
              />
            </div>
            {editing && (
              <div>
                <label className="block text-sm text-slate-400 mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Vehicle['status'] }))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg"
                >
                  <option value="available">Available</option>
                  <option value="on_trip">On Trip</option>
                  <option value="in_shop">In Shop</option>
                  <option value="out_of_service">Out of Service</option>
                </select>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-fleet-600 hover:bg-fleet-500 rounded-lg">
              {editing ? 'Update' : 'Create'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCreate(false);
                setEditing(null);
                resetForm();
              }}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="px-4 py-3 text-slate-400 font-medium">Name / Model</th>
              <th className="px-4 py-3 text-slate-400 font-medium">License Plate</th>
              <th className="px-4 py-3 text-slate-400 font-medium">Max Capacity</th>
              <th className="px-4 py-3 text-slate-400 font-medium">Odometer</th>
              <th className="px-4 py-3 text-slate-400 font-medium">Status</th>
              <th className="px-4 py-3 text-slate-400 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((v) => (
              <tr key={v.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                <td className="px-4 py-3">
                  <span className="font-medium">{v.name}</span>
                  {v.model && <span className="text-slate-500 ml-2">{v.model}</span>}
                </td>
                <td className="px-4 py-3 font-mono text-slate-300">{v.license_plate}</td>
                <td className="px-4 py-3 text-slate-300">{v.max_capacity_kg} kg</td>
                <td className="px-4 py-3 text-slate-300">{v.odometer} km</td>
                <td className="px-4 py-3"><StatusPill status={v.status} /></td>
                <td className="px-4 py-3 flex gap-2">
                  <button
                    onClick={() => startEdit(v)}
                    className="text-fleet-400 hover:underline text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => toggleOutOfService(v)}
                    className={`text-sm ${v.status === 'out_of_service' ? 'text-emerald-400' : 'text-orange-400'} hover:underline`}
                  >
                    {v.status === 'out_of_service' ? 'Restore' : 'Out of Service'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
