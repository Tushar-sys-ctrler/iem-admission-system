import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  CreditCard,
  HelpCircle,
  Users,
  BookOpen,
  BarChart3,
  Settings,
  Layers,
  Target,
  X,
} from 'lucide-react';

const applicantLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/dashboard/application', icon: FileText, label: 'My Application' },
  { to: '/dashboard/semester-fees', icon: CreditCard, label: 'Payments' },
  { to: '/helpdesk', icon: HelpCircle, label: 'Helpdesk' },
];

const adminLinks = [
  { to: '/dashboard/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/dashboard/admin/applications', icon: FileText, label: 'Applications' },
  { to: '/dashboard/admin/seat-allocation', icon: Target, label: 'Seat Allocation' },
  { to: '/dashboard/admin/batch-generator', icon: Layers, label: 'Sections' },
  { to: '/dashboard/admin/reports', icon: BarChart3, label: 'Reports' },
  { to: '/dashboard/admin/system-config', icon: Settings, label: 'System Config' },
];

export default function Sidebar({ isOpen, onClose }) {
  const { isAdmin } = useAuth();
  const links = isAdmin ? adminLinks : applicantLinks;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-16 left-0 bottom-0 w-64 bg-white border-r border-slate-200 z-30 transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:top-0`}
      >
        <div className="flex flex-col h-full">
          {/* Close button - mobile */}
          <div className="flex items-center justify-between p-4 border-b border-slate-100 lg:hidden">
            <span className="text-sm font-semibold text-slate-600">Navigation</span>
            <button onClick={onClose} className="p-1 rounded hover:bg-slate-100">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* Navigation links */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            <p className="px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {isAdmin ? 'Administration' : 'Menu'}
            </p>
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-iem-blue-50 text-iem-blue-800 border-r-2 border-iem-blue-800'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`
                  }
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span>{link.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100">
            <div className="text-[10px] text-slate-400 text-center">
              <p>IEM Admission Portal v1.0</p>
              <p className="mt-0.5">© 2024 IEM, Kolkata</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
