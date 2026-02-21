# Fleet Management Hub

A centralized, rule-based digital hub that optimizes the lifecycle of a delivery fleet, monitors driver safety, and tracks financial performance.

## Quick Start

```bash
npm install
npm run db:init   # Initialize database (run once)
npm run dev       # Start backend + frontend
```

- **Frontend**: http://localhost:5173  
- **API**: http://localhost:3001  

**Demo login**: `smit@owner.com` / `fleet123`

## Target Users

| Role | Focus |
|------|-------|
| Fleet Manager | Vehicle health, asset lifecycle, scheduling |
| Dispatcher | Trips, driver assignment, cargo validation |
| Safety Officer | Compliance, license expiry, safety scores |
| Financial Analyst | Fuel spend, maintenance ROI, operational costs |

## Features

### 1. Login & RBAC
- Email/Password authentication
- Forgot Password flow
- Role-based access control (Manager, Dispatcher, Safety Officer, Financial Analyst)

### 2. Command Center (Dashboard)
- **Active Fleet**: Vehicles on trip
- **Maintenance Alerts**: Vehicles in shop
- **Utilization Rate**: % assigned vs idle
- **Pending Cargo**: Shipments awaiting assignment
- Filters: Vehicle type, status, region

### 3. Vehicle Registry
- CRUD for vehicles (Name, Model, License Plate, Max Capacity, Odometer)
- Manual "Out of Service" toggle
- Vehicle types: Truck, Van, Bike

### 4. Trip Dispatcher
- Create trips: Select Available Vehicle + Available Driver
- **Validation**: Blocks trip if `CargoWeight > MaxCapacity`
- Lifecycle: Draft → Dispatched → Completed → Cancelled
- Status sync: Vehicle & Driver → On Trip when dispatched

### 5. Maintenance & Service Logs
- Log preventive/reactive maintenance
- **Auto-logic**: Adding vehicle to service log sets status to "In Shop" (removed from Dispatcher pool)
- Mark complete to return vehicle to Available

### 6. Fuel & Expense Logging
- Record liters, cost, date per vehicle
- **Total Operational Cost** = Fuel + Maintenance per Vehicle ID

### 7. Driver Profiles
- License expiry tracking (blocks assignment if expired)
- Trip completion rates & safety scores
- Status: On Duty, Off Duty, Suspended

### 8. Analytics & Reports
- **Fuel Efficiency**: km/L per vehicle
- **Vehicle ROI**: (Revenue - Maintenance - Fuel) / Acquisition Cost
- One-click CSV export (vehicles, drivers, trips)
- PDF health audit export

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, React Router
- **Backend**: Node.js, Express, SQLite (better-sqlite3)
- **Auth**: JWT, bcrypt

## Database

SQLite at `server/db/fleet.db`. Schema and seed data created by `npm run db:init`.
