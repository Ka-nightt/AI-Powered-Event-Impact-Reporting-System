import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, Target, LogOut } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/events', label: 'Events', icon: CalendarDays },
  { to: '/sdg', label: 'SDG Reference', icon: Target },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="hidden md:flex md:flex-col w-64 shrink-0 bg-ink text-gray-200 min-h-screen">
      <div className="px-6 py-6 border-b border-white/10">
        <p className="text-xs tracking-widest text-brand-100 uppercase">Impact</p>
        <h1 className="font-display text-xl font-bold text-white leading-tight">Event Impact<br />Reporting</h1>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive ? 'bg-brand-500 text-white' : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-4 py-4 border-t border-white/10">
        {user && (
          <div className="flex items-center justify-between gap-2 px-2">
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.full_name}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
            <button
              onClick={logout}
              title="Log out"
              className="shrink-0 text-gray-400 hover:text-white p-1.5 rounded-md hover:bg-white/5 transition-colors"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
