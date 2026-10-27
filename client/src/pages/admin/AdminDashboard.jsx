import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import { formatCurrency, formatDate } from '../../utils/helpers';
import {
  Users,
  FileCheck2,
  Clock,
  Award,
  CheckCircle,
  AlertOctagon,
  ArrowRight,
  TrendingUp,
  CreditCard,
  Building2,
  Layers,
  BarChart3,
  ShieldAlert,
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentApps, setRecentApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        setLoading(true);
        const [dashRes, appsRes] = await Promise.all([
          api.get('/admin/dashboard'),
          api.get('/admin/applications?limit=5'),
        ]);

        if (dashRes.data.success) {
          setStats(dashRes.data.data);
        }
        if (appsRes.data.success) {
          setRecentApps(appsRes.data.data?.applications || []);
        }
      } catch (err) {
        console.error('Error fetching admin dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminStats();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Loading Executive Admin Analytics..." />;
  }

  const byStatus = stats?.byStatus || {};

  return (
    <div className="space-y-6">
      {/* Title Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-iem-blue-800 uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" /> Institute of Engineering & Management • Admin Portal
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Admission Season Overview (2026-27)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time applicant funnel, seat fill ratio, and fee ledger analytics
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/dashboard/admin/applications"
            className="px-4 py-2 bg-iem-blue-800 hover:bg-iem-blue-900 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
          >
            Review Applications <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Apps</span>
            <Users className="w-4 h-4 text-iem-blue-700" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{stats?.totalApplications || 0}</p>
          <span className="text-[10px] text-slate-500">Across all courses</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-sm">
          <div className="flex items-center justify-between text-amber-600">
            <span className="text-[11px] font-bold uppercase tracking-wider">Under Review</span>
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-amber-900 mt-2">{byStatus['Under Review'] || 0}</p>
          <span className="text-[10px] text-amber-700">Awaiting doc verification</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-purple-200 bg-purple-50/20 shadow-sm">
          <div className="flex items-center justify-between text-purple-600">
            <span className="text-[11px] font-bold uppercase tracking-wider">Shortlisted</span>
            <Award className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-purple-900 mt-2">{byStatus['Shortlisted'] || 0}</p>
          <span className="text-[10px] text-purple-700">Seat allotted (FR-18)</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-sm">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-[11px] font-bold uppercase tracking-wider">Admitted</span>
            <CheckCircle className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-emerald-900 mt-2">{byStatus['Admitted'] || 0}</p>
          <span className="text-[10px] text-emerald-700">Fee paid & enrolled</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/20 shadow-sm">
          <div className="flex items-center justify-between text-rose-600">
            <span className="text-[11px] font-bold uppercase tracking-wider">Not Eligible</span>
            <AlertOctagon className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-rose-900 mt-2">{byStatus['Not Eligible'] || 0}</p>
          <span className="text-[10px] text-rose-700">Cutoff flag (FR-12)</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Withdrawn</span>
            <ShieldAlert className="w-4 h-4 text-slate-600" />
          </div>
          <p className="text-2xl font-black text-slate-700 mt-2">{stats?.withdrawals || 0}</p>
          <span className="text-[10px] text-slate-400">Refund released</span>
        </div>
      </div>

      {/* Revenue & Seat Intake Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Total Revenue Card */}
        <div className="bg-gradient-to-br from-iem-blue-900 via-iem-blue-950 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-iem-blue-800/40 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-iem-blue-300 uppercase tracking-wider">
                Total Fees Collected
              </span>
              <CreditCard className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="mt-4">
              <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white">
                {formatCurrency(stats?.totalRevenue || 0)}
              </span>
              <p className="text-xs text-iem-blue-200 mt-1">
                Net collections across Application, Enrollment, and Semester fees
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-iem-blue-800/50 mt-6 flex justify-between items-center text-xs">
            <span className="text-slate-300">Detailed Accounting:</span>
            <Link
              to="/dashboard/admin/reports"
              className="text-amber-300 font-semibold hover:underline flex items-center gap-1"
            >
              View Revenue Report <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Course Seat Fill Ratio */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-iem-blue-700" />
              <h3 className="font-bold text-slate-800">Seat Capacity & Fill Ratio</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">Real-time JoSAA pool</span>
          </div>

          <div className="space-y-3">
            {stats?.seatsByCoourse?.map((c) => {
              const pct = Math.round(((c.filledSeats || 0) / (c.totalSeats || 1)) * 100);
              return (
                <div key={c.code} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-800">
                      {c.name} <span className="font-mono text-slate-400">({c.code})</span>
                    </span>
                    <span className="text-slate-500 font-mono">
                      {c.filledSeats} / {c.totalSeats} seats ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-500 ${
                        pct > 80 ? 'bg-emerald-500' : pct > 40 ? 'bg-iem-blue-600' : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Applications Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-iem-blue-700" />
            <h3 className="font-bold text-slate-800">Recently Submitted Applications</h3>
          </div>
          <Link
            to="/dashboard/admin/applications"
            className="text-xs font-semibold text-iem-blue-700 hover:text-iem-blue-900"
          >
            View All ({stats?.totalApplications || 0}) →
          </Link>
        </div>

        <div className="overflow-x-auto mt-3">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-2.5 px-3">App ID</th>
                <th className="py-2.5 px-3">Candidate</th>
                <th className="py-2.5 px-3">PCM %</th>
                <th className="py-2.5 px-3">1st Choice</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Submission</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentApps.map((app) => (
                <tr key={app._id} className="hover:bg-slate-50/70">
                  <td className="py-2.5 px-3 font-mono font-bold text-iem-blue-800">
                    {app.applicationId || 'DRAFT'}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-800">
                    {app.applicant?.name || 'Applicant'}
                  </td>
                  <td className="py-2.5 px-3 font-mono">
                    {app.academicDetails?.pcmPercentage || 0}%
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">
                    {app.coursePreferences?.[0]?.course?.name || '—'}
                  </td>
                  <td className="py-2.5 px-3">
                    <StatusBadge status={app.status} />
                  </td>
                  <td className="py-2.5 px-3 text-slate-400">
                    {formatDate(app.createdAt)}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <Link
                      to={`/dashboard/admin/applications/${app._id}`}
                      className="text-xs font-semibold text-iem-blue-700 hover:underline"
                    >
                      Verify Docs
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
