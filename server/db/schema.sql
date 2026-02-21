-- Fleet Management Hub - Database Schema
-- Relational structure linking Expenses/Trips to Vehicle ID

-- Users & RBAC
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('manager', 'dispatcher', 'safety_officer', 'financial_analyst')),
  name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Vehicle Types
CREATE TABLE IF NOT EXISTS vehicle_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);
INSERT OR IGNORE INTO vehicle_types (id, name) VALUES (1, 'Truck'), (2, 'Van'), (3, 'Bike');

-- Vehicles (Asset Registry)
CREATE TABLE IF NOT EXISTS vehicles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  model TEXT,
  license_plate TEXT UNIQUE NOT NULL,
  vehicle_type_id INTEGER NOT NULL DEFAULT 2,
  max_capacity_kg INTEGER NOT NULL,
  odometer INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available', 'on_trip', 'in_shop', 'out_of_service')),
  region TEXT,
  acquisition_cost REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_type_id) REFERENCES vehicle_types(id)
);

-- Drivers
CREATE TABLE IF NOT EXISTS drivers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  license_number TEXT,
  license_category TEXT,
  license_expiry DATE,
  status TEXT NOT NULL DEFAULT 'off_duty' CHECK(status IN ('on_duty', 'off_duty', 'suspended', 'on_trip')),
  safety_score REAL DEFAULT 100,
  trip_completion_rate REAL DEFAULT 100,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Cargo / Shipments
CREATE TABLE IF NOT EXISTS cargo (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  description TEXT,
  weight_kg REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'assigned', 'delivered', 'cancelled')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Trips
CREATE TABLE IF NOT EXISTS trips (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id INTEGER NOT NULL,
  driver_id INTEGER NOT NULL,
  cargo_id INTEGER,
  origin TEXT,
  destination TEXT,
  cargo_weight_kg REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'dispatched', 'completed', 'cancelled')),
  start_odometer INTEGER,
  end_odometer INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  created_by INTEGER,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  FOREIGN KEY (driver_id) REFERENCES drivers(id),
  FOREIGN KEY (cargo_id) REFERENCES cargo(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Maintenance / Service Logs
CREATE TABLE IF NOT EXISTS maintenance_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id INTEGER NOT NULL,
  description TEXT NOT NULL,
  service_type TEXT CHECK(service_type IN ('preventive', 'reactive')),
  cost REAL DEFAULT 0,
  performed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  created_by INTEGER,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Fuel Logs
CREATE TABLE IF NOT EXISTS fuel_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id INTEGER NOT NULL,
  trip_id INTEGER,
  liters REAL NOT NULL,
  cost REAL NOT NULL,
  date DATE NOT NULL,
  odometer INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  FOREIGN KEY (trip_id) REFERENCES trips(id)
);

-- Expense Logs (non-fuel)
CREATE TABLE IF NOT EXISTS expense_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id INTEGER NOT NULL,
  trip_id INTEGER,
  description TEXT,
  cost REAL NOT NULL,
  category TEXT,
  date DATE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  FOREIGN KEY (trip_id) REFERENCES trips(id)
);
