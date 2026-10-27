import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useToast } from '../../components/common/Toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency } from '../../utils/helpers';
import { Settings, Plus, Edit2, Save, CheckCircle, ShieldAlert, BookOpen } from 'lucide-react';

export default function SystemConfig() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [showAddCourse, setShowAddCourse] = useState(false);
  const toast = useToast();

  const [newCourse, setNewCourse] = useState({
    name: '',
    code: '',
    minCutoff: 70,
    totalSeats: 60,
    applicationFee: 1500,
    enrollmentFee: 50000,
    semesterFee: 75000,
  });

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/courses');
      if (res.data.success) {
        setCourses(res.data.data || []);
      }
    } catch (err) {
      toast.error('Failed to load system course settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleUpdateCourse = async (courseId, updatedFields) => {
    try {
      setSavingId(courseId);
      const res = await api.put(`/courses/${courseId}`, updatedFields);
      if (res.data.success) {
        toast.success('Course rules and cutoffs updated!');
        fetchCourses();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update course settings.');
    } finally {
      setSavingId(null);
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/courses', newCourse);
      if (res.data.success) {
        toast.success(`New course ${newCourse.name} added!`);
        setShowAddCourse(false);
        setNewCourse({
          name: '',
          code: '',
          minCutoff: 70,
          totalSeats: 60,
          applicationFee: 1500,
          enrollmentFee: 50000,
          semesterFee: 75000,
        });
        fetchCourses();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create course.');
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading admission configuration panel..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-6 h-6 text-iem-blue-800" />
            System Configuration Panel (FR-8, FR-12, FR-18)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure cutoff thresholds, intake quotas, application fees, and counseling parameters
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddCourse(!showAddCourse)}
          className="px-4 py-2 bg-iem-blue-800 text-white rounded-lg text-xs font-semibold hover:bg-iem-blue-900 transition flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          {showAddCourse ? 'Cancel' : 'Add Degree Program'}
        </button>
      </div>

      {/* Add New Course Drawer */}
      {showAddCourse && (
        <div className="bg-white rounded-2xl p-6 border border-iem-blue-300 shadow-md animate-fade-in">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-iem-blue-800" /> Create New Academic Offering
          </h3>
          <form onSubmit={handleCreateCourse} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Course Name *</label>
              <input
                type="text"
                placeholder="e.g. B.Tech Cyber Security"
                value={newCourse.name}
                onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Course Code *</label>
              <input
                type="text"
                placeholder="e.g. CSE-CS"
                value={newCourse.code}
                onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value.toUpperCase() })}
                className="w-full p-2 border border-slate-300 rounded-lg font-mono uppercase"
                required
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Min PCM Cutoff (%) (FR-12) *</label>
              <input
                type="number"
                value={newCourse.minCutoff}
                onChange={(e) => setNewCourse({ ...newCourse, minCutoff: Number(e.target.value) })}
                className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Total Seat Intake *</label>
              <input
                type="number"
                value={newCourse.totalSeats}
                onChange={(e) => setNewCourse({ ...newCourse, totalSeats: Number(e.target.value) })}
                className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Application Fee (₹) *</label>
              <input
                type="number"
                value={newCourse.applicationFee}
                onChange={(e) => setNewCourse({ ...newCourse, applicationFee: Number(e.target.value) })}
                className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Enrollment Fee (₹) *</label>
              <input
                type="number"
                value={newCourse.enrollmentFee}
                onChange={(e) => setNewCourse({ ...newCourse, enrollmentFee: Number(e.target.value) })}
                className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Semester Fee (₹) *</label>
              <input
                type="number"
                value={newCourse.semesterFee}
                onChange={(e) => setNewCourse({ ...newCourse, semesterFee: Number(e.target.value) })}
                className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                required
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm transition"
              >
                Save Course
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Courses List */}
      <div className="space-y-4">
        {courses.map((c) => (
          <div key={c._id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-iem-blue-100 text-iem-blue-800">
                  {c.code}
                </span>
                <h3 className="text-base font-bold text-slate-800">{c.name}</h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {c.filledSeats} / {c.totalSeats} seats currently filled
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 text-xs">
              <div>
                <label className="block text-slate-500 text-[11px] mb-1">Cutoff % (FR-12)</label>
                <input
                  type="number"
                  defaultValue={c.minCutoff}
                  onBlur={(e) => handleUpdateCourse(c._id, { minCutoff: Number(e.target.value) })}
                  className="w-full p-2 border border-slate-300 rounded-lg font-bold font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-500 text-[11px] mb-1">Total Seats</label>
                <input
                  type="number"
                  defaultValue={c.totalSeats}
                  onBlur={(e) => handleUpdateCourse(c._id, { totalSeats: Number(e.target.value) })}
                  className="w-full p-2 border border-slate-300 rounded-lg font-bold font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-500 text-[11px] mb-1">App Fee (₹) (FR-8)</label>
                <input
                  type="number"
                  defaultValue={c.applicationFee}
                  onBlur={(e) => handleUpdateCourse(c._id, { applicationFee: Number(e.target.value) })}
                  className="w-full p-2 border border-slate-300 rounded-lg font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-500 text-[11px] mb-1">Enrollment Fee (₹)</label>
                <input
                  type="number"
                  defaultValue={c.enrollmentFee}
                  onBlur={(e) => handleUpdateCourse(c._id, { enrollmentFee: Number(e.target.value) })}
                  className="w-full p-2 border border-slate-300 rounded-lg font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-500 text-[11px] mb-1">Semester Fee (₹)</label>
                <input
                  type="number"
                  defaultValue={c.semesterFee}
                  onBlur={(e) => handleUpdateCourse(c._id, { semesterFee: Number(e.target.value) })}
                  className="w-full p-2 border border-slate-300 rounded-lg font-mono text-slate-800"
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-400 italic">
              * Edits auto-save immediately on input blur.
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
