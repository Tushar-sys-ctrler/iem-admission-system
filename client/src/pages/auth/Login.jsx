import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import { GraduationCap, Lock, Mail, ArrowRight, UserCheck, ShieldCheck } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.warning('Please enter both email and password');
      return;
    }
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.name}!`);
      if (user.role === 'admin') {
        navigate('/dashboard/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    toast.info(`Filled credentials for ${demoEmail}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-iem-blue-950 to-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 px-4">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-iem-blue-700 to-iem-blue-500 shadow-xl shadow-iem-blue-900/50 mb-4 border border-iem-blue-400/30">
          <GraduationCap className="w-9 h-9 text-white" />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">IEM Kolkata</h2>
        <p className="mt-1 text-sm text-iem-blue-200">
          University Admission & Student Management System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-100">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-slate-900">Sign in to your account</h3>
            <p className="text-sm text-slate-500 mt-1">
              Access your admission application or staff dashboard
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-iem-blue-600 focus:border-iem-blue-600 text-sm transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-iem-blue-600 focus:border-iem-blue-600 text-sm transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg shadow-md text-sm font-semibold text-white bg-iem-blue-800 hover:bg-iem-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-iem-blue-700 disabled:opacity-60 transition-all duration-200 mt-2"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Logins Section */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-iem-blue-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-iem-blue-700" />
                Quick Demo Accounts (Evaluation)
              </span>
              <span className="text-[11px] text-slate-400">Click to autofill</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@iem.edu.in', 'Admin@123')}
                className="flex items-center justify-between p-2.5 rounded-lg border border-purple-200 bg-purple-50/70 hover:bg-purple-100/70 text-purple-900 transition-colors text-left"
              >
                <div>
                  <p className="font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-purple-600 inline-block"></span>
                    Admin Staff
                  </p>
                  <p className="text-[11px] text-purple-700">admin@iem.edu.in</p>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-200">ADMIN</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('rahul@example.com', 'Test@1234')}
                className="flex items-center justify-between p-2.5 rounded-lg border border-blue-200 bg-blue-50/70 hover:bg-blue-100/70 text-blue-900 transition-colors text-left"
              >
                <div>
                  <p className="font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-600 inline-block"></span>
                    Rahul Sharma
                  </p>
                  <p className="text-[11px] text-blue-700">Under Review</p>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-200">FR-11</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('amit@example.com', 'Test@1234')}
                className="flex items-center justify-between p-2.5 rounded-lg border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100/70 text-indigo-900 transition-colors text-left"
              >
                <div>
                  <p className="font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block"></span>
                    Amit Kumar
                  </p>
                  <p className="text-[11px] text-indigo-700">Shortlisted (Seat Allotted)</p>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-200">FR-18</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('sneha@example.com', 'Test@1234')}
                className="flex items-center justify-between p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/70 text-emerald-900 transition-colors text-left"
              >
                <div>
                  <p className="font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block"></span>
                    Sneha Das
                  </p>
                  <p className="text-[11px] text-emerald-700">Admitted Student</p>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-200">FR-15</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('priya@example.com', 'Test@1234')}
                className="flex items-center justify-between p-2.5 rounded-lg border border-rose-200 bg-rose-50/70 hover:bg-rose-100/70 text-rose-900 transition-colors text-left"
              >
                <div>
                  <p className="font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-600 inline-block"></span>
                    Priya Patel
                  </p>
                  <p className="text-[11px] text-rose-700">Auto Not-Eligible</p>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-200">FR-12</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('arjun@example.com', 'Test@1234')}
                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 transition-colors text-left"
              >
                <div>
                  <p className="font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-slate-400 inline-block"></span>
                    Arjun Roy
                  </p>
                  <p className="text-[11px] text-slate-600">Draft Application</p>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200">FR-6</span>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-sm text-slate-600">
            Don't have an application account?{' '}
            <Link to="/register" className="font-semibold text-iem-blue-700 hover:text-iem-blue-800">
              Register here
            </Link>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          5th-Semester Software Engineering (PCCCS504) • Team DevSphere
        </p>
      </div>
    </div>
  );
}
