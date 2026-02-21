import { useEffect, useState } from 'react';
import { api, Driver } from '../lib/api';
import StatusPill from '../components/StatusPill';

export default function DriverProfiles() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [editing, setEditing] = useState<Driver | null>(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    license_number: '',
    license_category: '',
    license_expiry: '',
    status: 'off_duty' as Driver['status'],
    safety_score: '',
    trip_completion_rate: '',
  });
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    api.drivers.list().then(setDrivers);
  }, []);

  const load = () => api.drivers.list().then(setDrivers);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.drivers.update(editing.id, {
          name: form.name,
          email: form.email || undefined,
          license_number: form.license_number || undefined,
          license_category: form.license_category || undefined,
          license_expiry: form.license_expiry || undefined,
          status: form.status,
          safety_score: form.safety_score ? Number(form.safety_score) : undefined,
          trip_completion_rate: form.trip_completion_rate ? Number(form.trip_completion_rate) : undefined,
        });
      } else {
        await api.drivers.create({
          name: form.name,
          email: form.email || undefined,
          license_number: form.license_number || undefined,
          license_category: form.license_category || undefined,
          license_expiry: form.license_expiry || undefined,
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
      email: '',
      license_number: '',
      license_category: '',
      license_expiry: '',
      status: 'off_duty',
      safety_score: '',
      trip_completion_rate: '',
    });
  };

  const startEdit = (d: Driver) => {
    setEditing(d);
    setForm({
      name: d.name,
      email: d.email || '',
      license_number: d.license_number || '',
      license_category: d.license_category || '',
      license_expiry: d.license_expiry || '',
      status: d.status,
      safety_score: String(d.safety_score),
      trip_completion_rate: String(d.trip_completion_rate),
    });
  };

  const isExpired = (expiry?: string) => expiry && new Date(expiry) < new Date();

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Driver Performance & Safety Profiles</h1>
          <p className="text-slate-400">Compliance, license expiry, trip completion, safety scores</p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            resetForm();
            setShowCreate(!showCreate);
          }}
          className="px-4 py-2 bg-fleet-600 hover:bg-fleet-500 text-white font-medium rounded-lg"
        >
          {showCreate ? 'Cancel' : 'Add Driver'}
        </button>
      </div>

      {(showCreate || editing) && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4"
        >
          <h3 className="font-semibold">{editing ? 'Edit Driver' : 'New Driver'}</h3>
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
              <label className="block text-sm text-slate-400 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">License Number</label>
              <input
                value={form.license_number}
                onChange={(e) => setForm((f) => ({ ...f, license_number: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">License Category</label>
              <input
                value={form.license_category}
                onChange={(e) => setForm((f) => ({ ...f, license_category: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg"
                placeholder="Van, Truck, etc."
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">License Expiry</label>
              <input
                type="date"
                value={form.license_expiry}
                onChange={(e) => setForm((f) => ({ ...f, license_expiry: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg"
              />
            </div>
            {editing && (
              <>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Driver['status'] }))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg"
                  >
                    <option value="on_duty">On Duty</option>
                    <option value="off_duty">Off Duty</option>
                    <option value="suspended">Suspended</option>
                    <option value="on_trip">On Trip</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Safety Score</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.safety_score}
                    onChange={(e) => setForm((f) => ({ ...f, safety_score: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Trip Completion Rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.trip_completion_rate}
                    onChange={(e) => setForm((f) => ({ ...f, trip_completion_rate: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg"
                  />
                </div>
              </>
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
              <th className="px-4 py-3 text-slate-400 font-medium">Name</th>
              <th className="px-4 py-3 text-slate-400 font-medium">License</th>
              <th className="px-4 py-3 text-slate-400 font-medium">Expiry</th>
              <th className="px-4 py-3 text-slate-400 font-medium">Status</th>
              <th className="px-4 py-3 text-slate-400 font-medium">Safety</th>
              <th className="px-4 py-3 text-slate-400 font-medium">Completion</th>
              <th className="px-4 py-3 text-slate-400 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((d) => (
              <tr key={d.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                <td className="px-4 py-3 font-medium">{d.name}</td>
                <td className="px-4 py-3 text-slate-300 font-mono">{d.license_number || '-'}</td>
                <td className="px-4 py-3">
                  {d.license_expiry ? (
                    <span className={isExpired(d.license_expiry) ? 'text-red-400' : 'text-slate-300'}>
                      {new Date(d.license_expiry).toLocaleDateString()}
                      {isExpired(d.license_expiry) && ' (Expired)'}
                    </span>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="px-4 py-3"><StatusPill status={d.status} /></td>
                <td className="px-4 py-3">{d.safety_score}%</td>
                <td className="px-4 py-3">{d.trip_completion_rate}%</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => startEdit(d)}
                    className="text-fleet-400 hover:underline text-sm"
                  >
                    Edit
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
