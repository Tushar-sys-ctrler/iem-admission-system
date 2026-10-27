import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Menu,
  X,
  Bell,
  ChevronDown,
  User,
  LogOut,
  GraduationCap,
  HelpCircle,
} from 'lucide-react';

export default function Navbar({ onToggleSidebar, sidebarOpen }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-gradient-to-r from-iem-blue-800 to-iem-blue-950 text-white shadow-lg sticky top-0 z-40">
      <div className="px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Left section */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors lg:hidden"
            >
              {sidebarOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>

            <Link to="/dashboard" className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-base font-bold leading-tight">IEM Admission Portal</h1>
                <p className="text-[10px] text-blue-200 leading-tight">Institute of Engineering & Management</p>
              </div>
            </Link>
          </div>

          {/* Right section */}
          <div className="flex items-center gap-2">
            <Link
              to="/helpdesk"
              className="p-2 rounded-lg hover:bg-white/10 transition-colors hidden sm:flex items-center gap-1.5 text-sm"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="hidden md:inline">Help</span>
            </Link>

            <button className="p-2 rounded-lg hover:bg-white/10 transition-colors relative">
              <Bell className="w-5 h-5" />
            </button>

            {/* User menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm font-semibold">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <span className="hidden md:block text-sm font-medium max-w-[120px] truncate">
                  {user?.name || 'User'}
                </span>
                <ChevronDown className={`w-4 h-4 hidden md:block transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1 animate-scale-in">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
                    <p className="text-xs text-slate-500">{user?.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 bg-iem-blue-100 text-iem-blue-800 text-[10px] font-medium rounded-full capitalize">
                      {user?.role}
                    </span>
                  </div>
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <User className="w-4 h-4" />
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
