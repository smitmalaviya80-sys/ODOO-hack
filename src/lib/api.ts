const API = '/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };
  const res = await fetch(`${API}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data as T;
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    forgotPassword: (email: string) =>
      request<{ message: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),
  },
  dashboard: () => request<DashboardKPIs>('/dashboard'),
  dashboardVehicles: (params?: { type?: string; status?: string; region?: string }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return request<Vehicle[]>(`/dashboard/vehicles${q ? '?' + q : ''}`);
  },
  vehicles: {
    list: () => request<Vehicle[]>('/vehicles'),
    available: () => request<Vehicle[]>('/vehicles/available'),
    types: () => request<{ id: number; name: string }[]>('/vehicles/types'),
    get: (id: number) => request<Vehicle>(`/vehicles/${id}`),
    create: (v: Partial<Vehicle>) => request<Vehicle>('/vehicles', { method: 'POST', body: JSON.stringify(v) }),
    update: (id: number, v: Partial<Vehicle>) => request<Vehicle>(`/vehicles/${id}`, { method: 'PATCH', body: JSON.stringify(v) }),
  },
  drivers: {
    list: () => request<Driver[]>('/drivers'),
    available: () => request<Driver[]>('/drivers/available'),
    get: (id: number) => request<Driver>(`/drivers/${id}`),
    create: (d: Partial<Driver>) => request<Driver>('/drivers', { method: 'POST', body: JSON.stringify(d) }),
    update: (id: number, d: Partial<Driver>) => request<Driver>(`/drivers/${id}`, { method: 'PATCH', body: JSON.stringify(d) }),
  },
  cargo: {
    list: (status?: string) => request<Cargo[]>(`/cargo${status ? '?status=' + status : ''}`),
    create: (c: { description?: string; weight_kg: number }) =>
      request<Cargo>('/cargo', { method: 'POST', body: JSON.stringify(c) }),
  },
  trips: {
    list: (status?: string) => request<Trip[]>(`/trips${status ? '?status=' + status : ''}`),
    create: (t: TripCreate) => request<Trip>('/trips', { method: 'POST', body: JSON.stringify(t) }),
    updateStatus: (id: number, status: Trip['status'], extra?: { start_odometer?: number; end_odometer?: number }) =>
      request<Trip>(`/trips/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, ...extra }) }),
    update: (id: number, t: Partial<Trip>) => request<Trip>(`/trips/${id}`, { method: 'PATCH', body: JSON.stringify(t) }),
  },
  maintenance: {
    list: (vehicle_id?: number) => request<MaintenanceLog[]>(`/maintenance${vehicle_id ? '?vehicle_id=' + vehicle_id : ''}`),
    create: (m: MaintenanceCreate) =>
      request<MaintenanceLog>('/maintenance', { method: 'POST', body: JSON.stringify(m) }),
    complete: (id: number) => request<MaintenanceLog>(`/maintenance/${id}/complete`, { method: 'PATCH' }),
  },
  fuel: {
    list: (vehicle_id?: number) => request<FuelLog[]>(`/fuel${vehicle_id ? '?vehicle_id=' + vehicle_id : ''}`),
    create: (f: FuelCreate) => request<FuelLog>('/fuel', { method: 'POST', body: JSON.stringify(f) }),
  },
  expenses: {
    byVehicle: (vehicle_id: number) => request<VehicleCosts>(`/expenses/by-vehicle?vehicle_id=${vehicle_id}`),
    logs: (vehicle_id?: number) => request<ExpenseLog[]>(`/expenses/logs${vehicle_id ? '?vehicle_id=' + vehicle_id : ''}`),
    createLog: (e: ExpenseCreate) => request<ExpenseLog>('/expenses/logs', { method: 'POST', body: JSON.stringify(e) }),
  },
  analytics: {
    fuelEfficiency: () => request<FuelEfficiencyRow[]>('/analytics/fuel-efficiency'),
    vehicleRoi: () => request<VehicleRoiRow[]>('/analytics/vehicle-roi'),
    operationalCosts: () => request<OperationalCostRow[]>('/analytics/operational-costs'),
    exportCsv: (type: string) => `${API}/analytics/export/csv?type=${type}`,
    exportPdf: () => `${API}/analytics/export/pdf`,
  },
};

export interface User {
  id: number;
  email: string;
  role: string;
  name: string;
}

export interface DashboardKPIs {
  activeFleet: number;
  maintenanceAlerts: number;
  utilizationRate: number;
  pendingCargo: number;
}

export interface Vehicle {
  id: number;
  name: string;
  model?: string;
  license_plate: string;
  vehicle_type_id: number;
  vehicle_type?: string;
  max_capacity_kg: number;
  odometer: number;
  status: 'available' | 'on_trip' | 'in_shop' | 'out_of_service';
  region?: string;
  acquisition_cost?: number;
}

export interface Driver {
  id: number;
  name: string;
  email?: string;
  license_number?: string;
  license_category?: string;
  license_expiry?: string;
  status: 'on_duty' | 'off_duty' | 'suspended' | 'on_trip';
  safety_score: number;
  trip_completion_rate: number;
}

export interface Cargo {
  id: number;
  description?: string;
  weight_kg: number;
  status: string;
}

export interface Trip {
  id: number;
  vehicle_id: number;
  driver_id: number;
  cargo_id?: number;
  origin?: string;
  destination?: string;
  cargo_weight_kg: number;
  status: 'draft' | 'dispatched' | 'completed' | 'cancelled';
  start_odometer?: number;
  end_odometer?: number;
  vehicle_name?: string;
  license_plate?: string;
  driver_name?: string;
  cargo_description?: string;
}

export interface TripCreate {
  vehicle_id: number;
  driver_id: number;
  cargo_id?: number;
  origin?: string;
  destination?: string;
  cargo_weight_kg: number;
}

export interface MaintenanceLog {
  id: number;
  vehicle_id: number;
  vehicle_name?: string;
  license_plate?: string;
  description: string;
  service_type?: string;
  cost: number;
  performed_at: string;
  completed_at?: string;
}

export interface MaintenanceCreate {
  vehicle_id: number;
  description: string;
  service_type?: string;
  cost?: number;
}

export interface FuelLog {
  id: number;
  vehicle_id: number;
  vehicle_name?: string;
  trip_id?: number;
  liters: number;
  cost: number;
  date: string;
  odometer?: number;
}

export interface FuelCreate {
  vehicle_id: number;
  trip_id?: number;
  liters: number;
  cost: number;
  date: string;
  odometer?: number;
}

export interface ExpenseLog {
  id: number;
  vehicle_id: number;
  trip_id?: number;
  description?: string;
  cost: number;
  category?: string;
  date: string;
}

export interface ExpenseCreate {
  vehicle_id: number;
  trip_id?: number;
  description?: string;
  cost: number;
  category?: string;
  date: string;
}

export interface VehicleCosts {
  fuel: number;
  maintenance: number;
  other: number;
  total: number;
}

export interface FuelEfficiencyRow {
  id: number;
  name: string;
  license_plate: string;
  total_km: number;
  total_liters: number;
  km_per_liter: number;
}

export interface VehicleRoiRow {
  id: number;
  name: string;
  license_plate: string;
  acquisition_cost: number;
  maintenance_cost: number;
  fuel_cost: number;
  total_cost: number;
  roi: string | null;
}

export interface OperationalCostRow {
  id: number;
  name: string;
  license_plate: string;
  fuel_cost: number;
  maintenance_cost: number;
  other_cost: number;
}
