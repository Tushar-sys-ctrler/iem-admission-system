import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useToast } from '../../components/common/Toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import { formatDate } from '../../utils/helpers';
import { Target, Award, Users, CheckCircle, Clock, Sparkles } from 'lucide-react';

export default function SeatAllocation() {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allocating, setAllocating] = useState(false);
  const [deadlineDays, setDeadlineDays] = useState(7);
  const toast = useToast();

  const fetchCoursesAndApps = async () => {
    try {
      setLoading(true);
      const [coursesRes, appsRes] = await Promise.all([
        api.get('/courses'),
        api.get('/admin/applications?limit=50'),
      ]);

      if (coursesRes.data.success) {
        const fetchedCourses = coursesRes.data.data || [];
        setCourses(fetchedCourses);
        if (fetchedCourses.length > 0 && !selectedCourseId) {
          setSelectedCourseId(fetchedCourses[0]._id);
        }
      }

      if (appsRes.data.success) {
        setApplications(appsRes.data.data?.applications || []);
      }
    } catch (err) {
      console.error('Error fetching allocation data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoursesAndApps();
  }, []);

  const activeCourse = courses.find((c) => c._id === selectedCourseId);

  // Filter candidates who picked this course as one of their preferences
  const courseCandidates = applications
    .filter((app) =>
      app.coursePreferences?.some(
        (p) => (p.course?._id || p.course) === selectedCourseId && p.isEligible
      )
    )
    .sort((a, b) => {
      // Sort by entrance rank if present, else by PCM percentage
      const rankA = a.academicDetails?.entranceRank || 999999;
      const rankB = b.academicDetails?.entranceRank || 999999;
      if (rankA !== rankB) return rankA - rankB;
      return (b.academicDetails?.pcmPercentage || 0) - (a.academicDetails?.pcmPercentage || 0);
    });

  const handleAllocate = async (appId) => {
    try {
      setAllocating(true);
      const res = await api.post(`/admin/applications/${appId}/shortlist`, {
        courseId: selectedCourseId,
        deadlineDays,
      });
      if (res.data.success) {
        toast.success('Seat provisionally allotted! Enrollment timer activated.');
        fetchCoursesAndApps();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Seat allocation failed.');
    } finally {
      setAllocating(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading JoSAA Seat Allotment Matrix..." />;
  }

  const seatsLeft = (activeCourse?.totalSeats || 0) - (activeCourse?.filledSeats || 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Target className="w-6 h-6 text-iem-blue-800" /> JoSAA-Style Merit Seat Allocation (FR-18)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Shortlist top-ranked candidates according to merit rank and applicant preference choices
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-600">Default Payment Deadline:</label>
          <select
            value={deadlineDays}
            onChange={(e) => setDeadlineDays(Number(e.target.value))}
            className="text-xs py-1.5 px-3 border border-slate-300 rounded-lg font-bold text-iem-blue-900"
          >
            <option value={3}>3 Days</option>
            <option value={5}>5 Days</option>
            <option value={7}>7 Days (Standard)</option>
            <option value={10}>10 Days</option>
          </select>
        </div>
      </div>

      {/* Course Selector Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {courses.map((c) => {
          const isSelected = c._id === selectedCourseId;
          const left = c.totalSeats - c.filledSeats;
          return (
            <button
              key={c._id}
              onClick={() => setSelectedCourseId(c._id)}
              className={`px-4 py-3 rounded-xl border text-left flex-shrink-0 transition-all ${
                isSelected
                  ? 'bg-iem-blue-800 text-white border-iem-blue-800 shadow-md'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="text-xs font-bold">{c.name}</div>
              <div
                className={`text-[10px] mt-0.5 ${
                  isSelected ? 'text-iem-blue-200' : 'text-slate-400'
                }`}
              >
                {left} / {c.totalSeats} seats available • Cutoff: {c.minCutoff}%
              </div>
            </button>
          );
        })}
      </div>

      {/* Allocation Capacity Banner */}
      <div className="bg-gradient-to-r from-iem-blue-950 via-slate-900 to-iem-blue-900 text-white p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-iem-blue-800/80 border border-iem-blue-600/40 flex items-center justify-center font-bold text-lg font-mono">
            {activeCourse?.code || 'CSE'}
          </div>
          <div>
            <h3 className="font-extrabold text-base">{activeCourse?.name}</h3>
            <p className="text-xs text-iem-blue-200">
              Min. Cutoff: <strong>{activeCourse?.minCutoff}% PCM</strong> • Enrollment Fee: ₹
              {activeCourse?.enrollmentFee?.toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        <div className="flex gap-4 text-xs font-mono">
          <div className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/20">
            <span className="text-[10px] text-slate-300 block">Total Intake</span>
            <span className="font-bold text-base text-white">{activeCourse?.totalSeats}</span>
          </div>
          <div className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/20">
            <span className="text-[10px] text-slate-300 block">Admitted / Locked</span>
            <span className="font-bold text-base text-emerald-400">{activeCourse?.filledSeats}</span>
          </div>
          <div className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/20">
            <span className="text-[10px] text-slate-300 block">Open Quota</span>
            <span className="font-bold text-base text-amber-300">{seatsLeft}</span>
          </div>
        </div>
      </div>

      {/* Merit Candidates Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Merit List for {activeCourse?.name} (Sorted by Rank / Score)
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {courseCandidates.length} eligible applicant(s)
          </span>
        </div>

        {courseCandidates.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No applicants currently list this course as an eligible choice.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Merit Pos</th>
                  <th className="py-3 px-4">App ID</th>
                  <th className="py-3 px-4">Candidate</th>
                  <th className="py-3 px-4">Entrance Rank</th>
                  <th className="py-3 px-4">PCM Average</th>
                  <th className="py-3 px-4">Preference Priority</th>
                  <th className="py-3 px-4">Current Status</th>
                  <th className="py-3 px-4 text-right">Seat Allocation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {courseCandidates.map((app, idx) => {
                  const pref = app.coursePreferences?.find(
                    (p) => (p.course?._id || p.course) === selectedCourseId
                  );
                  const isAllotted = app.status === 'Shortlisted' || app.status === 'Admitted';

                  return (
                    <tr key={app._id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-400 font-mono">
                        #{idx + 1}
                      </td>
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
                        {app.academicDetails?.entranceRank ? `#${app.academicDetails.entranceRank}` : 'Direct'}
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        {app.academicDetails?.pcmPercentage || 0}%
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-semibold">
                        Choice #{pref?.priority || 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={app.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {isAllotted ? (
                          <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 inline-flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Seat Assigned
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAllocate(app._id)}
                            disabled={allocating || seatsLeft <= 0}
                            className="px-3.5 py-1.5 rounded-lg bg-iem-blue-800 hover:bg-iem-blue-900 text-white font-semibold text-xs shadow-sm disabled:opacity-40 transition flex items-center gap-1 ml-auto"
                          >
                            <Award className="w-3.5 h-3.5" /> Allot Seat
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
