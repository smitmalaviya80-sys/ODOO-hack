import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Truck,
  MapPin,
  Wrench,
  Fuel,
  UserCircle,
  BarChart3,
  LogOut,
} from 'lucide-react';
import clsx from 'clsx';

const nav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Command Center' },
  { to: '/vehicles', icon: Truck, label: 'Vehicle Registry' },
  { to: '/trips', icon: MapPin, label: 'Trip Dispatcher' },
  { to: '/maintenance', icon: Wrench, label: 'Maintenance' },
  { to: '/expenses', icon: Fuel, label: 'Fuel & Expenses' },
  { to: '/drivers', icon: UserCircle, label: 'Driver Profiles' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-slate-950">
      <aside className="w-56 bg-slate-900/80 border-r border-slate-800 flex flex-col">
        <div className="p-4 border-b border-slate-800">
          <h1 className="font-bold text-fleet-400 text-lg">Fleet Hub</h1>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                  isActive
                    ? 'bg-fleet-500/20 text-fleet-400'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                )
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-2 border-t border-slate-800">
          <div className="px-3 py-2 text-xs text-slate-500 truncate">{user?.email}</div>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-red-400"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
