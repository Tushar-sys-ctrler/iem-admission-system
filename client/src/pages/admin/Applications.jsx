import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import { formatDate } from '../../utils/helpers';
import {
  Search,
  Filter,
  FileCheck2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Eye,
  Calendar,
} from 'lucide-react';

export default function Applications() {
  const [applications, setApplications] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [course, setCourse] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (status) params.append('status', status);
      if (course) params.append('course', course);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      params.append('page', page);
      params.append('limit', 10);

      const [appRes, courseRes] = await Promise.all([
        api.get(`/admin/applications?${params.toString()}`),
        api.get('/courses'),
      ]);

      if (appRes.data.success) {
        setApplications(appRes.data.data?.applications || []);
        setTotalPages(appRes.data.data?.pages || 1);
        setTotalRecords(appRes.data.data?.total || 0);
      }
      if (courseRes.data.success) {
        setCourses(courseRes.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [page, status, course]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchApplications();
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatus('');
    setCourse('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
    fetchApplications();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileCheck2 className="w-6 h-6 text-iem-blue-800" />
            Applicant Management (FR-10)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Filter, review, and verify student applications for JoSAA merit counselling
          </p>
        </div>

        <div className="text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          Showing <strong className="text-slate-800">{applications.length}</strong> of{' '}
          <strong className="text-slate-800">{totalRecords}</strong> total record(s)
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
          {/* Search Box */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID or candidate name..."
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-iem-blue-600"
            />
          </div>

          {/* Status Dropdown */}
          <div>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-iem-blue-600"
            >
              <option value="">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Submitted">Submitted</option>
              <option value="Under Review">Under Review</option>
              <option value="Shortlisted">Shortlisted</option>
              <option value="Admitted">Admitted</option>
              <option value="Not Eligible">Not Eligible</option>
              <option value="Rejected">Rejected</option>
              <option value="Withdrawn">Withdrawn</option>
            </select>
          </div>

          {/* Course Dropdown */}
          <div>
            <select
              value={course}
              onChange={(e) => {
                setCourse(e.target.value);
                setPage(1);
              }}
              className="w-full py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-iem-blue-600"
            >
              <option value="">All Courses</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date From */}
          <div>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full py-2 px-3 border border-slate-300 rounded-lg text-slate-600"
              title="From date"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 py-2 px-3 bg-iem-blue-800 text-white rounded-lg font-semibold hover:bg-iem-blue-900 transition flex items-center justify-center gap-1 shadow-sm"
            >
              <Filter className="w-3.5 h-3.5" /> Filter
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="py-2 px-3 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 transition"
              title="Reset"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12">
            <LoadingSpinner message="Querying applications..." />
          </div>
        ) : applications.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            <FileCheck2 className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            No applications match the specified criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Application ID</th>
                  <th className="py-3 px-4">Candidate Name</th>
                  <th className="py-3 px-4">PCM %</th>
                  <th className="py-3 px-4">Entrance Rank</th>
                  <th className="py-3 px-4">1st Preference</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map((app) => (
                  <tr key={app._id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-iem-blue-900">
                      {app.applicationId || 'DRAFT'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800 block">
                        {app.applicant?.name || 'Applicant'}
                      </span>
                      <span className="text-[11px] text-slate-400">{app.applicant?.email}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                      {app.academicDetails?.pcmPercentage || 0}%
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {app.academicDetails?.entranceRank ? `#${app.academicDetails.entranceRank}` : 'Direct'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      {app.coursePreferences?.[0]?.course?.name || '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {formatDate(app.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/dashboard/admin/applications/${app._id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-iem-blue-50 text-iem-blue-800 font-semibold hover:bg-iem-blue-100 transition"
                      >
                        <Eye className="w-3.5 h-3.5" /> Review (FR-11)
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded border border-slate-300 disabled:opacity-30 hover:bg-slate-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded border border-slate-300 disabled:opacity-30 hover:bg-slate-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
