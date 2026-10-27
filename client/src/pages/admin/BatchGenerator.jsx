import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useToast } from '../../components/common/Toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDate } from '../../utils/helpers';
import { Layers, Users, Sparkles, BookOpen, ChevronRight, UserCheck, CheckCircle2 } from 'lucide-react';

export default function BatchGenerator() {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [maxStrength, setMaxStrength] = useState(60);
  const [sections, setSections] = useState([]);
  const [selectedSectionRoster, setSelectedSectionRoster] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [rosterLoading, setRosterLoading] = useState(false);
  const toast = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [coursesRes, sectionsRes] = await Promise.all([
        api.get('/courses'),
        api.get('/sections'),
      ]);

      if (coursesRes.data.success) {
        const cList = coursesRes.data.data || [];
        setCourses(cList);
        if (cList.length > 0 && !selectedCourseId) {
          setSelectedCourseId(cList[0]._id);
        }
      }

      if (sectionsRes.data.success) {
        setSections(sectionsRes.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching section data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!selectedCourseId) {
      toast.warning('Please select a course to generate sections for.');
      return;
    }

    setGenerating(true);
    try {
      const res = await api.post('/sections/generate', {
        courseId: selectedCourseId,
        maxStrength: Number(maxStrength),
      });

      if (res.data.success) {
        toast.success(res.data.message || 'Sections and Roll Numbers successfully generated!');
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate sections.');
    } finally {
      setGenerating(false);
    }
  };

  const handleViewRoster = async (sectionId) => {
    try {
      setRosterLoading(true);
      const res = await api.get(`/sections/${sectionId}/roster`);
      if (res.data.success) {
        setSelectedSectionRoster(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load section student roster.');
    } finally {
      setRosterLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading batch and section configurations..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-6 h-6 text-iem-blue-800" /> Automated Batch & Section Generator (FR-13, FR-14)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Divide officially admitted candidates into academic sections and assign permanent roll numbers
          </p>
        </div>
      </div>

      {/* Generator Configuration Form */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <form onSubmit={handleGenerate} className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4 items-end text-xs">
          <div>
            <label className="block text-slate-700 font-medium mb-1">Select Degree Program *</label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-iem-blue-600 font-medium text-slate-800"
            >
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.code}) — {c.filledSeats} Admitted
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">Max Students / Section *</label>
            <input
              type="number"
              min={10}
              max={120}
              value={maxStrength}
              onChange={(e) => setMaxStrength(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-iem-blue-600 font-mono text-slate-800"
              placeholder="e.g. 60"
              required
            />
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={generating}
              className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-iem-blue-800 hover:bg-iem-blue-900 text-white font-bold text-xs shadow-md disabled:opacity-40 transition flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              {generating ? 'Allotting Students...' : 'Auto-Generate Sections & Allot Students'}
            </button>
          </div>
        </form>
      </div>

      {/* Existing Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center justify-between">
              <span>Formed Academic Sections</span>
              <span className="text-xs text-slate-400 font-mono">{sections.length} section(s)</span>
            </h3>

            {sections.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No sections generated yet. Select a course above with admitted students and click Auto-Generate.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {sections.map((s) => (
                  <div
                    key={s._id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-iem-blue-400 transition-all shadow-sm space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-slate-900 font-mono">
                        {s.sectionName}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-iem-blue-100 text-iem-blue-800 font-bold font-mono">
                        {s.studentCount} / {s.maxStrength} Enrolled
                      </span>
                    </div>

                    <p className="text-xs text-slate-500">{s.course?.name || 'Department'}</p>

                    <button
                      type="button"
                      onClick={() => handleViewRoster(s._id)}
                      className="w-full mt-2 py-1.5 px-3 rounded-lg bg-white border border-slate-200 text-iem-blue-700 hover:bg-iem-blue-50 text-xs font-semibold flex items-center justify-center gap-1 transition"
                    >
                      View Student Roster <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Section Roster Drawer */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 pb-2 border-b border-slate-100 flex items-center justify-between">
            <span>Enrolled Section Roster</span>
            {selectedSectionRoster && (
              <span className="font-mono text-iem-blue-800 font-bold text-xs">
                {selectedSectionRoster.sectionName}
              </span>
            )}
          </h3>

          {rosterLoading ? (
            <LoadingSpinner message="Fetching roster..." />
          ) : !selectedSectionRoster ? (
            <p className="text-xs text-slate-400 text-center py-12">
              Select a section card on the left to inspect students and roll numbers.
            </p>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {selectedSectionRoster.students?.length === 0 ? (
                <p className="text-xs text-slate-400">No students currently in this section.</p>
              ) : (
                selectedSectionRoster.students.map((st, idx) => (
                  <div
                    key={st._id}
                    className="p-2.5 rounded-lg border border-slate-100 bg-slate-50 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">
                        {st.applicant?.name || 'Candidate'}
                      </span>
                      <span className="font-mono text-[11px] font-bold text-iem-blue-800 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                        {st.rollNumber || `ROLL-${idx + 1}`}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>{st.applicationId}</span>
                      <span>{st.personalDetails?.category || 'General'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
