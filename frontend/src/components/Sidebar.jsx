import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Zap,
  LayoutDashboard,
  TerminalSquare,
  History,
  Users,
  User,
  LogOut,
  Blocks,
  CalendarDays,
  MessageSquareDashed
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ onClose }) => {
  const location = useLocation();
  // Pull the logged-in user and the logout function from global auth state
  const { user, logout } = useAuth();

  const navItems = [
    { name: 'Orchestration', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Sessions', icon: MessageSquareDashed, path: '/sessions' },
    { name: 'Agent Logs', icon: TerminalSquare, path: '/logs' },
    { name: 'Task History', icon: History, path: '/history' },
    { name: 'Global Calendar', icon: CalendarDays, path: '/calendar' },
    { name: 'Integrations', icon: Blocks, path: '/integrations' },
    { name: 'Team', icon: Users, path: '/team' },
    { name: 'My Profile', icon: User, path: '/profile' },
  ];

  // Build initials from the user's name (e.g. "Test User" → "TU")
  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <aside className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
      {/* Brand / Logo */}
      <div className="flex items-center gap-2 px-6 py-8">
        <div className="bg-black text-white p-1 rounded-md">
          <Zap size={20} fill="currentColor" />
        </div>
        <span className="text-xl font-bold tracking-tight">NexusAl</span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive
                ? 'bg-black text-white shadow-md'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                }`}
            >
              <item.icon size={20} className={isActive ? 'text-white' : 'text-gray-400'} />
              <span className="font-medium text-sm">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section: User Profile & Logout */}
      <div className="p-6 border-t border-gray-100 mt-auto">
        {/* Show the real logged-in user's name pulled from the JWT */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200 flex-shrink-0">
            <span className="text-sm font-bold text-gray-700">{initials}</span>
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-bold text-gray-900 truncate">{user?.name || 'User'}</span>
            <span className="text-xs text-gray-500 truncate">{user?.email || ''}</span>
          </div>
        </div>

        {/* Clicking this calls logout() → POST /auth/logout → clears token → /login */}
        <button
          onClick={logout}
          className="flex items-center gap-3 text-gray-500 hover:text-red-600 transition-colors w-full px-2 group"
        >
          <LogOut size={20} className="text-gray-400 group-hover:text-red-500 transition-colors" />
          <span className="font-medium text-sm">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
