import { useEffect, useState } from 'react';
import { api, Vehicle, Driver, Cargo, Trip } from '../lib/api';
import StatusPill from '../components/StatusPill';

export default function TripDispatcher() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [cargoList, setCargoList] = useState<Cargo[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    vehicle_id: '',
    driver_id: '',
    cargo_id: '',
    origin: '',
    destination: '',
    cargo_weight_kg: '',
  });

  useEffect(() => {
    api.trips.list().then(setTrips);
  }, []);

  useEffect(() => {
    if (showCreate) {
      api.vehicles.available().then(setVehicles);
      api.drivers.available().then(setDrivers);
      api.cargo.list('pending').then(setCargoList);
    }
  }, [showCreate]);

  const load = () => api.trips.list().then(setTrips);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.trips.create({
        vehicle_id: Number(form.vehicle_id),
        driver_id: Number(form.driver_id),
        cargo_id: form.cargo_id ? Number(form.cargo_id) : undefined,
        origin: form.origin || undefined,
        destination: form.destination || undefined,
        cargo_weight_kg: Number(form.cargo_weight_kg),
      });
      setShowCreate(false);
      setForm({ vehicle_id: '', driver_id: '', cargo_id: '', origin: '', destination: '', cargo_weight_kg: '' });
      load();
    } catch (err: unknown) {
      alert((err as Error).message);
    }
  };

  const updateStatus = async (trip: Trip, status: Trip['status'], extra?: { start_odometer?: number; end_odometer?: number }) => {
    try {
      await api.trips.updateStatus(trip.id, status, extra);
      load();
    } catch (err: unknown) {
      alert((err as Error).message);
    }
  };

  const selectedVehicle = vehicles.find((v) => v.id === Number(form.vehicle_id));
  const capacityExceeded = selectedVehicle && form.cargo_weight_kg && Number(form.cargo_weight_kg) > selectedVehicle.max_capacity_kg;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Trip Dispatcher</h1>
          <p className="text-slate-400">Create and manage trips from Point A to Point B</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 bg-fleet-600 hover:bg-fleet-500 text-white font-medium rounded-lg"
        >
          {showCreate ? 'Cancel' : 'Create Trip'}
        </button>
      </div>

      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="mb-6 p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4"
        >
          <h3 className="font-semibold">New Trip</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Vehicle (Available)</label>
              <select
                value={form.vehicle_id}
                onChange={(e) => setForm((f) => ({ ...f, vehicle_id: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg"
                required
              >
                <option value="">Select vehicle</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>{v.name} ({v.license_plate}) - {v.max_capacity_kg}kg</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Driver (On Duty)</label>
              <select
                value={form.driver_id}
                onChange={(e) => setForm((f) => ({ ...f, driver_id: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg"
                required
              >
                <option value="">Select driver</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Cargo Weight (kg)</label>
              <input
                type="number"
                step="0.01"
                value={form.cargo_weight_kg}
                onChange={(e) => setForm((f) => ({ ...f, cargo_weight_kg: e.target.value }))}
                className={`w-full px-3 py-2 bg-slate-800 border rounded-lg ${capacityExceeded ? 'border-red-500' : 'border-slate-700'}`}
                required
              />
              {selectedVehicle && (
                <p className="text-xs mt-1 text-slate-500">
                  Max: {selectedVehicle.max_capacity_kg} kg
                  {capacityExceeded && <span className="text-red-400 ml-2">Exceeds capacity!</span>}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Cargo (Optional)</label>
              <select
                value={form.cargo_id}
                onChange={(e) => setForm((f) => ({ ...f, cargo_id: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg"
              >
                <option value="">None</option>
                {cargoList.map((c) => (
                  <option key={c.id} value={c.id}>{c.description || c.id} - {c.weight_kg}kg</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Origin</label>
              <input
                value={form.origin}
                onChange={(e) => setForm((f) => ({ ...f, origin: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Destination</label>
              <input
                value={form.destination}
                onChange={(e) => setForm((f) => ({ ...f, destination: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={!!capacityExceeded}
            className="px-4 py-2 bg-fleet-600 hover:bg-fleet-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
          >
            Create Trip (Draft)
          </button>
        </form>
      )}

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="px-4 py-3 text-slate-400 font-medium">ID</th>
              <th className="px-4 py-3 text-slate-400 font-medium">Vehicle</th>
              <th className="px-4 py-3 text-slate-400 font-medium">Driver</th>
              <th className="px-4 py-3 text-slate-400 font-medium">Cargo</th>
              <th className="px-4 py-3 text-slate-400 font-medium">Route</th>
              <th className="px-4 py-3 text-slate-400 font-medium">Status</th>
              <th className="px-4 py-3 text-slate-400 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {trips.map((t) => (
              <tr key={t.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                <td className="px-4 py-3 font-mono">#{t.id}</td>
                <td className="px-4 py-3">{t.vehicle_name} ({t.license_plate})</td>
                <td className="px-4 py-3">{t.driver_name}</td>
                <td className="px-4 py-3">{t.cargo_weight_kg} kg</td>
                <td className="px-4 py-3 text-slate-300">{t.origin || '-'} → {t.destination || '-'}</td>
                <td className="px-4 py-3"><StatusPill status={t.status} /></td>
                <td className="px-4 py-3">
                  {t.status === 'draft' && (
                    <button
                      onClick={() => updateStatus(t, 'dispatched')}
                      className="text-fleet-400 hover:underline text-sm mr-2"
                    >
                      Dispatch
                    </button>
                  )}
                  {t.status === 'dispatched' && (
                    <button
                      onClick={() => {
                        const odom = prompt('End odometer reading:');
                        if (odom) updateStatus(t, 'completed', { end_odometer: Number(odom) });
                      }}
                      className="text-emerald-400 hover:underline text-sm mr-2"
                    >
                      Complete
                    </button>
                  )}
                  {(t.status === 'draft' || t.status === 'dispatched') && (
                    <button
                      onClick={() => updateStatus(t, 'cancelled')}
                      className="text-red-400 hover:underline text-sm"
                    >
                      Cancel
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
