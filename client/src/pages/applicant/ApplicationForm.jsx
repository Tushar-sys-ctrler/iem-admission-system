import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useToast } from '../../components/common/Toast';
import StepProgress from '../../components/common/StepProgress';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PaymentModal from '../../components/payment/PaymentModal';
import { formatCurrency, formatDateTime } from '../../utils/helpers';
import {
  User,
  GraduationCap,
  ListOrdered,
  Upload,
  CheckCircle,
  Save,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  FileCheck,
  ShieldCheck,
  Eye,
} from 'lucide-react';

const STEPS = [
  'Personal Details',
  'Academic History',
  'Course Preferences',
  'Document Uploads',
  'Review & Submit',
];

export default function ApplicationForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [applicationId, setApplicationId] = useState(null);
  const [applicationMongoId, setApplicationMongoId] = useState(null);
  const [appStatus, setAppStatus] = useState('Draft');
  const [loading, setLoading] = useState(true);
  const [savingDraft, setSavingDraft] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [courses, setCourses] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [applicationFee, setApplicationFee] = useState(1500);

  const toast = useToast();
  const navigate = useNavigate();

  // Form state
  const [personalDetails, setPersonalDetails] = useState({
    dob: '',
    gender: 'Male',
    category: 'General',
    guardianName: '',
    guardianPhone: '',
    address: '',
    aadhaarNumber: '',
  });

  const [academicDetails, setAcademicDetails] = useState({
    tenthBoard: '',
    tenthYear: '',
    tenthPercentage: '',
    twelfthBoard: '',
    twelfthYear: '',
    physicsMarks: '',
    chemistryMarks: '',
    mathMarks: '',
    twelfthPercentage: '',
    pcmPercentage: 0,
    entranceExam: 'JEE Main',
    entranceRank: '',
  });

  const [coursePreferences, setCoursePreferences] = useState([]);
  const [documents, setDocuments] = useState({
    tenthMarkSheet: { url: '', status: 'Pending' },
    twelfthMarkSheet: { url: '', status: 'Pending' },
    idProof: { url: '', status: 'Pending' },
    photo: { url: '', status: 'Pending' },
    signature: { url: '', status: 'Pending' },
  });

  // Calculate PCM automatically whenever Physics, Chemistry, or Math changes
  useEffect(() => {
    const p = parseFloat(academicDetails.physicsMarks) || 0;
    const c = parseFloat(academicDetails.chemistryMarks) || 0;
    const m = parseFloat(academicDetails.mathMarks) || 0;
    if (p > 0 || c > 0 || m > 0) {
      const avg = ((p + c + m) / 3).toFixed(2);
      setAcademicDetails((prev) => ({ ...prev, pcmPercentage: parseFloat(avg) }));
    }
  }, [academicDetails.physicsMarks, academicDetails.chemistryMarks, academicDetails.mathMarks]);

  // Load existing application and course catalogue
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const [cRes, appRes] = await Promise.all([
          api.get('/courses'),
          api.get('/applications/my-application').catch(() => ({ data: { success: false } })),
        ]);

        if (cRes.data.success) {
          setCourses(cRes.data.data || []);
          if (cRes.data.data?.[0]?.applicationFee) {
            setApplicationFee(cRes.data.data[0].applicationFee);
          }
        }

        if (appRes.data?.success && appRes.data.data) {
          const app = appRes.data.data;
          setApplicationMongoId(app._id);
          setApplicationId(app.applicationId);
          setAppStatus(app.status);
          setCurrentStep(app.currentStep || 1);
          setLastSaved(app.lastSavedAt);

          if (app.personalDetails) {
            setPersonalDetails({
              ...app.personalDetails,
              dob: app.personalDetails.dob ? app.personalDetails.dob.substring(0, 10) : '',
            });
          }
          if (app.academicDetails) {
            setAcademicDetails(app.academicDetails);
          }
          if (app.coursePreferences && app.coursePreferences.length > 0) {
            setCoursePreferences(
              app.coursePreferences.map((p) => ({
                course: p.course?._id || p.course,
                courseData: p.course,
                priority: p.priority,
                isEligible: p.isEligible,
              }))
            );
          }
          if (app.documents) {
            setDocuments(app.documents);
          }
        }
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Save Draft logic (FR-6)
  const saveDraft = useCallback(
    async (showNotification = false) => {
      try {
        setSavingDraft(true);
        const payload = {
          personalDetails,
          academicDetails,
          coursePreferences: coursePreferences.map((p, idx) => ({
            course: p.course,
            priority: idx + 1,
          })),
          currentStep,
        };

        let res;
        if (applicationMongoId) {
          res = await api.put(`/applications/${applicationMongoId}/save-draft`, payload);
        } else {
          res = await api.post('/applications', payload);
          if (res.data.success) {
            setApplicationMongoId(res.data.data._id);
          }
        }

        const now = new Date();
        setLastSaved(now);
        if (showNotification) {
          toast.success('Draft saved successfully! (Valid for 30 days)');
        }
      } catch (err) {
        console.error('Save draft error:', err);
        if (showNotification) {
          toast.error('Failed to save draft application.');
        }
      } finally {
        setSavingDraft(false);
      }
    },
    [personalDetails, academicDetails, coursePreferences, currentStep, applicationMongoId, toast]
  );

  // Auto-save every 2 minutes (FR-6)
  useEffect(() => {
    if (appStatus !== 'Draft') return;
    const interval = setInterval(() => {
      saveDraft(false);
    }, 120000); // 2 minutes
    return () => clearInterval(interval);
  }, [saveDraft, appStatus]);

  // Real-time eligibility evaluation (FR-12)
  const isCourseEligible = (courseId) => {
    const course = courses.find((c) => c._id === courseId);
    if (!course) return true;
    const pcm = parseFloat(academicDetails.pcmPercentage) || 0;
    return pcm >= course.minCutoff;
  };

  // Step 3: Course preference actions
  const handleAddCourse = (course) => {
    if (coursePreferences.some((p) => p.course === course._id)) {
      toast.warning('This course is already in your preference list.');
      return;
    }
    const eligible = isCourseEligible(course._id);
    const newPrefs = [
      ...coursePreferences,
      {
        course: course._id,
        courseData: course,
        priority: coursePreferences.length + 1,
        isEligible: eligible,
      },
    ];
    setCoursePreferences(newPrefs);
  };

  const handleRemoveCourse = (courseId) => {
    const updated = coursePreferences
      .filter((p) => p.course !== courseId)
      .map((p, idx) => ({ ...p, priority: idx + 1 }));
    setCoursePreferences(updated);
  };

  const handleMoveCourse = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= coursePreferences.length) return;
    const reordered = [...coursePreferences];
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;
    const finalized = reordered.map((p, idx) => ({ ...p, priority: idx + 1 }));
    setCoursePreferences(finalized);
  };

  // Step 4: Document upload handling (FR-3, FR-4)
  const handleFileUpload = async (e, docType) => {
    const file = e.target.files[0];
    if (!file) return;

    // Strict validation (max 2MB, PDF/JPG/JPEG/PNG)
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file format. Only PDF, JPG, JPEG, and PNG are allowed.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size exceeds 2MB limit.');
      return;
    }

    try {
      // Ensure application exists first
      let currentAppId = applicationMongoId;
      if (!currentAppId) {
        const createRes = await api.post('/applications', {
          personalDetails,
          academicDetails,
          currentStep,
        });
        currentAppId = createRes.data.data._id;
        setApplicationMongoId(currentAppId);
      }

      const formData = new FormData();
      formData.append('document', file);

      const res = await api.post(`/applications/${currentAppId}/upload/${docType}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        setDocuments((prev) => ({
          ...prev,
          [docType]: {
            url: res.data.data.url,
            status: 'Pending',
            rejectionReason: '',
          },
        }));
        toast.success(`${file.name} uploaded successfully!`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Document upload failed.');
    }
  };

  // Final Submission (FR-5, FR-8)
  const handleSubmitApplication = async () => {
    // Validation
    if (!personalDetails.guardianName || !personalDetails.address || !personalDetails.aadhaarNumber) {
      toast.error('Please complete all mandatory personal details (Step 1).');
      setCurrentStep(1);
      return;
    }
    if (!academicDetails.tenthPercentage || !academicDetails.twelfthPercentage) {
      toast.error('Please complete all mandatory academic scores (Step 2).');
      setCurrentStep(2);
      return;
    }
    if (coursePreferences.length === 0) {
      toast.error('Please select at least one course preference (Step 3).');
      setCurrentStep(3);
      return;
    }

    setSubmitting(true);
    try {
      await saveDraft(false);
      const res = await api.post(`/applications/${applicationMongoId}/submit`);
      if (res.data.success) {
        setApplicationId(res.data.data.applicationId);
        setAppStatus('Submitted');
        toast.success(`Application submitted! Application ID: ${res.data.data.applicationId}`);
        // Prompt for Application Fee checkout (FR-8)
        setShowPaymentModal(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Application submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplicationFeeComplete = (result) => {
    setShowPaymentModal(false);
    toast.success('Application Fee confirmed! An automated SMS & Email receipt was dispatched.');
    navigate('/dashboard');
  };

  if (loading) {
    return <LoadingSpinner message="Loading application wizard..." />;
  }

  // If application is already locked and under review, show view mode
  const isReadOnly = appStatus !== 'Draft';

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isReadOnly ? 'Admission Application Review' : 'Undergraduate Admission Wizard'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            IEM Kolkata • 2026-27 JoSAA-Pattern Admission Portal
          </p>
        </div>

        <div className="flex items-center gap-3">
          {lastSaved && (
            <span className="text-xs text-slate-400">
              Auto-saved at {formatDateTime(lastSaved)} (30 days validity)
            </span>
          )}
          {!isReadOnly && (
            <button
              type="button"
              onClick={() => saveDraft(true)}
              disabled={savingDraft}
              className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 shadow-sm transition"
            >
              <Save className="w-3.5 h-3.5" />
              {savingDraft ? 'Saving...' : 'Save Draft'}
            </button>
          )}
        </div>
      </div>

      {/* 5-Step Progress Bar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <StepProgress
          currentStep={currentStep}
          steps={STEPS}
          onStepClick={(step) => {
            if (!isReadOnly) setCurrentStep(step);
          }}
        />
      </div>

      {/* Wizard Step Content */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm min-h-[450px]">
        {/* STEP 1: Personal Details */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5 text-iem-blue-800" /> Step 1: Personal Information
              </h2>
              <p className="text-xs text-slate-500">Provide official identity and guardian details</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Date of Birth *</label>
                <input
                  type="date"
                  disabled={isReadOnly}
                  value={personalDetails.dob}
                  onChange={(e) => setPersonalDetails({ ...personalDetails, dob: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-iem-blue-600 disabled:bg-slate-50"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Gender *</label>
                <select
                  disabled={isReadOnly}
                  value={personalDetails.gender}
                  onChange={(e) => setPersonalDetails({ ...personalDetails, gender: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-iem-blue-600 disabled:bg-slate-50"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Category *</label>
                <select
                  disabled={isReadOnly}
                  value={personalDetails.category}
                  onChange={(e) => setPersonalDetails({ ...personalDetails, category: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-iem-blue-600 disabled:bg-slate-50"
                >
                  <option value="General">General</option>
                  <option value="OBC">OBC</option>
                  <option value="SC">SC</option>
                  <option value="ST">ST</option>
                  <option value="EWS">EWS</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Guardian's Full Name *</label>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={personalDetails.guardianName}
                  onChange={(e) => setPersonalDetails({ ...personalDetails, guardianName: e.target.value })}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-iem-blue-600 disabled:bg-slate-50"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Guardian's Phone *</label>
                <input
                  type="tel"
                  disabled={isReadOnly}
                  value={personalDetails.guardianPhone}
                  onChange={(e) => setPersonalDetails({ ...personalDetails, guardianPhone: e.target.value })}
                  placeholder="10-digit number"
                  maxLength={10}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-iem-blue-600 disabled:bg-slate-50"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Aadhaar / ID Card Number *</label>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={personalDetails.aadhaarNumber}
                  onChange={(e) => setPersonalDetails({ ...personalDetails, aadhaarNumber: e.target.value })}
                  placeholder="12-digit Aadhaar"
                  maxLength={12}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-iem-blue-600 disabled:bg-slate-50"
                  required
                />
              </div>

              <div className="sm:col-span-2 md:col-span-3">
                <label className="block text-xs font-medium text-slate-700 mb-1">Permanent Residential Address *</label>
                <textarea
                  rows={2}
                  disabled={isReadOnly}
                  value={personalDetails.address}
                  onChange={(e) => setPersonalDetails({ ...personalDetails, address: e.target.value })}
                  placeholder="Full street address, city, state, and pin code"
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-iem-blue-600 disabled:bg-slate-50"
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Academic History */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-iem-blue-800" /> Step 2: Academic Record & Board Scores
              </h2>
              <p className="text-xs text-slate-500">
                Enter your 10th and 12th marks. The system automatically computes your PCM average for cutoff eligibility.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">10th Standard / Matriculation</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Board *</label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={academicDetails.tenthBoard}
                    onChange={(e) => setAcademicDetails({ ...academicDetails, tenthBoard: e.target.value })}
                    placeholder="e.g. CBSE / ICSE / WBBSE"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-iem-blue-600 disabled:bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Passing Year *</label>
                  <input
                    type="number"
                    disabled={isReadOnly}
                    value={academicDetails.tenthYear}
                    onChange={(e) => setAcademicDetails({ ...academicDetails, tenthYear: e.target.value })}
                    placeholder="2022"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-iem-blue-600 disabled:bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">10th Percentage (%) *</label>
                  <input
                    type="number"
                    disabled={isReadOnly}
                    value={academicDetails.tenthPercentage}
                    onChange={(e) => setAcademicDetails({ ...academicDetails, tenthPercentage: e.target.value })}
                    placeholder="88.5"
                    step="0.1"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-iem-blue-600 disabled:bg-slate-50"
                  />
                </div>
              </div>

              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 pt-3">
                12th Standard / Higher Secondary (PCM Evaluation)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">12th Board *</label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={academicDetails.twelfthBoard}
                    onChange={(e) => setAcademicDetails({ ...academicDetails, twelfthBoard: e.target.value })}
                    placeholder="e.g. CBSE / ISC / WBCHSE"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-iem-blue-600 disabled:bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">12th Aggregate Percentage (%) *</label>
                  <input
                    type="number"
                    disabled={isReadOnly}
                    value={academicDetails.twelfthPercentage}
                    onChange={(e) => setAcademicDetails({ ...academicDetails, twelfthPercentage: e.target.value })}
                    placeholder="85.0"
                    step="0.1"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-iem-blue-600 disabled:bg-slate-50"
                  />
                </div>
              </div>

              {/* Subject Marks Breakdown */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-700 block">
                  Individual Science Marks (Out of 100)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Physics Marks</label>
                    <input
                      type="number"
                      disabled={isReadOnly}
                      value={academicDetails.physicsMarks}
                      onChange={(e) => setAcademicDetails({ ...academicDetails, physicsMarks: e.target.value })}
                      placeholder="80"
                      className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Chemistry Marks</label>
                    <input
                      type="number"
                      disabled={isReadOnly}
                      value={academicDetails.chemistryMarks}
                      onChange={(e) => setAcademicDetails({ ...academicDetails, chemistryMarks: e.target.value })}
                      placeholder="85"
                      className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Mathematics Marks</label>
                    <input
                      type="number"
                      disabled={isReadOnly}
                      value={academicDetails.mathMarks}
                      onChange={(e) => setAcademicDetails({ ...academicDetails, mathMarks: e.target.value })}
                      placeholder="90"
                      className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs font-semibold text-slate-800">
                  <span>Computed PCM Average (Auto):</span>
                  <span className="text-sm font-bold text-iem-blue-800 font-mono bg-white px-3 py-1 rounded-lg border border-slate-200">
                    {academicDetails.pcmPercentage || 0}%
                  </span>
                </div>
              </div>

              {/* Entrance Exam */}
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 pt-3">
                Competitive Entrance Exam (Optional / Recommended)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Exam Type</label>
                  <select
                    disabled={isReadOnly}
                    value={academicDetails.entranceExam}
                    onChange={(e) => setAcademicDetails({ ...academicDetails, entranceExam: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-iem-blue-600 disabled:bg-slate-50"
                  >
                    <option value="JEE Main">JEE Main</option>
                    <option value="WBJEE">WBJEE</option>
                    <option value="None">Direct / Board Merit</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">General Rank (AIR / GMR)</label>
                  <input
                    type="number"
                    disabled={isReadOnly}
                    value={academicDetails.entranceRank}
                    onChange={(e) => setAcademicDetails({ ...academicDetails, entranceRank: e.target.value })}
                    placeholder="e.g. 5420"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-iem-blue-600 disabled:bg-slate-50"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: JoSAA-Style Course Preferences (FR-7, FR-12) */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ListOrdered className="w-5 h-5 text-iem-blue-800" /> Step 3: JoSAA Course Preference Ordering
              </h2>
              <p className="text-xs text-slate-500">
                Add courses and arrange them in order of preference. The system checks your PCM marks ({academicDetails.pcmPercentage}%) in real-time against each course cutoff.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Available Courses Pool */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-700 uppercase">Available Courses</span>
                  <span className="text-[11px] text-slate-500">{courses.length} courses offered</span>
                </div>

                <div className="space-y-2">
                  {courses.map((c) => {
                    const isAdded = coursePreferences.some((p) => p.course === c._id);
                    const meetsCutoff = (academicDetails.pcmPercentage || 0) >= c.minCutoff;

                    return (
                      <div
                        key={c._id}
                        className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                          isAdded
                            ? 'bg-slate-100 border-slate-200 opacity-60'
                            : meetsCutoff
                            ? 'bg-white border-slate-200 hover:border-iem-blue-400 shadow-sm'
                            : 'bg-rose-50/50 border-rose-200'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{c.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                              {c.code}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                            <span>Cutoff: <strong className="text-slate-700">{c.minCutoff}% PCM</strong></span>
                            <span>Intake: {c.totalSeats} seats</span>
                          </div>
                          {!meetsCutoff && (
                            <span className="text-[10px] text-rose-600 font-semibold block mt-0.5">
                              ⚠️ Cutoff {c.minCutoff}% (Your PCM: {academicDetails.pcmPercentage || 0}%)
                            </span>
                          )}
                        </div>

                        {!isReadOnly && (
                          <button
                            type="button"
                            onClick={() => handleAddCourse(c)}
                            disabled={isAdded}
                            className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                              isAdded
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                : 'bg-iem-blue-800 text-white hover:bg-iem-blue-900 shadow-sm'
                            }`}
                          >
                            <Plus className="w-3.5 h-3.5" /> Add
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Selected Preferences (Ordered) */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-700 uppercase">
                    Your Choice Preferences (In Order of Priority)
                  </span>
                  <span className="text-[11px] text-iem-blue-700 font-bold">
                    {coursePreferences.length} chosen
                  </span>
                </div>

                {coursePreferences.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    <ListOrdered className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    No course preferences added yet. Click "+ Add" on the available courses list.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {coursePreferences.map((pref, idx) => {
                      const courseObj = courses.find((c) => c._id === pref.course) || pref.courseData;
                      const eligible = (academicDetails.pcmPercentage || 0) >= (courseObj?.minCutoff || 0);

                      return (
                        <div
                          key={pref.course}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                            eligible
                              ? 'bg-slate-50 border-slate-200'
                              : 'bg-rose-50 border-rose-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-iem-blue-800 text-white font-bold text-xs flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <div>
                              <span className="text-xs font-bold text-slate-900 block">
                                {courseObj?.name || 'Selected Program'}
                              </span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span
                                  className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                    eligible
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-rose-100 text-rose-800'
                                  }`}
                                >
                                  {eligible ? 'Qualifies Cutoff' : 'Not Eligible (FR-12)'}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  Cutoff: {courseObj?.minCutoff}%
                                </span>
                              </div>
                            </div>
                          </div>

                          {!isReadOnly && (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleMoveCourse(idx, -1)}
                                disabled={idx === 0}
                                className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 text-slate-600"
                                title="Move Priority Up"
                              >
                                <MoveUp className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveCourse(idx, 1)}
                                disabled={idx === coursePreferences.length - 1}
                                className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 text-slate-600"
                                title="Move Priority Down"
                              >
                                <MoveDown className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveCourse(pref.course)}
                                className="p-1 rounded hover:bg-red-100 text-red-600 ml-1"
                                title="Remove Choice"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Document Uploads (FR-3, FR-4) */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Upload className="w-5 h-5 text-iem-blue-800" /> Step 4: Mandatory Document Uploads
              </h2>
              <p className="text-xs text-slate-500">
                Upload scanned documents in PDF or JPG/PNG format. Maximum file size is strictly 2MB per file (FR-3).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[
                { key: 'tenthMarkSheet', title: '10th Standard Mark Sheet', desc: 'Board certificate / mark memo' },
                { key: 'twelfthMarkSheet', title: '12th Standard Mark Sheet', desc: 'Science marksheet with PCM' },
                { key: 'idProof', title: 'Government ID Proof', desc: 'Aadhaar Card, Passport, or PAN' },
                { key: 'photo', title: 'Recent Passport Photograph', desc: 'Formal color photograph' },
                { key: 'signature', title: 'Digital Signature', desc: 'Clear sign on white background' },
              ].map(({ key, title, desc }) => {
                const doc = documents[key];
                const isUploaded = Boolean(doc?.url);

                return (
                  <div
                    key={key}
                    className={`p-4 rounded-xl border transition-all ${
                      isUploaded ? 'bg-emerald-50/40 border-emerald-200' : 'bg-slate-50/50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">{title}</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">{desc}</p>
                      </div>
                      {isUploaded && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          <CheckCircle className="w-3 h-3" /> Uploaded
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex items-center gap-3">
                      {!isReadOnly && (
                        <label className="cursor-pointer px-3 py-1.5 rounded-lg border border-iem-blue-700 text-iem-blue-800 text-xs font-semibold hover:bg-iem-blue-50 transition inline-flex items-center gap-1.5">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{isUploaded ? 'Replace File' : 'Upload File'}</span>
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => handleFileUpload(e, key)}
                            className="hidden"
                          />
                        </label>
                      )}

                      {isUploaded && (
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-slate-600 hover:text-slate-900 underline flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" /> View Document
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 5: Review & Submit (FR-5, FR-6) */}
        {currentStep === 5 && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-iem-blue-800" /> Step 5: Final Review & Submission
              </h2>
              <p className="text-xs text-slate-500">
                Carefully review all submitted information. Once submitted, an Application ID will be generated and you will be directed to pay the Application Fee ({formatCurrency(applicationFee)}).
              </p>
            </div>

            {/* Review Sections */}
            <div className="space-y-4 text-xs">
              {/* Section 1 summary */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="font-bold text-slate-800 uppercase">1. Personal Information</span>
                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="text-iem-blue-700 hover:underline font-semibold"
                    >
                      Edit
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-slate-600">
                  <div>
                    <span className="text-slate-400 block">DOB:</span> {personalDetails.dob || 'N/A'}
                  </div>
                  <div>
                    <span className="text-slate-400 block">Gender:</span> {personalDetails.gender}
                  </div>
                  <div>
                    <span className="text-slate-400 block">Category:</span> {personalDetails.category}
                  </div>
                  <div>
                    <span className="text-slate-400 block">Aadhaar:</span> {personalDetails.aadhaarNumber || 'N/A'}
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block">Guardian:</span> {personalDetails.guardianName} ({personalDetails.guardianPhone})
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block">Address:</span> {personalDetails.address || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Section 2 summary */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="font-bold text-slate-800 uppercase">2. Academic Record</span>
                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="text-iem-blue-700 hover:underline font-semibold"
                    >
                      Edit
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-slate-600">
                  <div>
                    <span className="text-slate-400 block">10th:</span> {academicDetails.tenthBoard} ({academicDetails.tenthPercentage}%)
                  </div>
                  <div>
                    <span className="text-slate-400 block">12th Aggregate:</span> {academicDetails.twelfthPercentage}%
                  </div>
                  <div>
                    <span className="text-slate-400 block">PCM Average:</span>{' '}
                    <strong className="text-iem-blue-800">{academicDetails.pcmPercentage}%</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Entrance Exam:</span> {academicDetails.entranceExam} ({academicDetails.entranceRank || 'Direct'})
                  </div>
                </div>
              </div>

              {/* Section 3 summary */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="font-bold text-slate-800 uppercase">3. Course Choice Order</span>
                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="text-iem-blue-700 hover:underline font-semibold"
                    >
                      Edit
                    </button>
                  )}
                </div>
                <div className="space-y-1 pt-2">
                  {coursePreferences.map((p, idx) => {
                    const cObj = courses.find((c) => c._id === p.course) || p.courseData;
                    return (
                      <div key={idx} className="flex justify-between items-center text-slate-700">
                        <span>
                          {idx + 1}. {cObj?.name}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 font-semibold">
                          Cutoff: {cObj?.minCutoff}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Section 4 summary */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="font-bold text-slate-800 uppercase">4. Uploaded Credentials</span>
                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={() => setCurrentStep(4)}
                      className="text-iem-blue-700 hover:underline font-semibold"
                    >
                      Edit
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
                  {Object.entries(documents).map(([k, d]) => (
                    <div key={k} className="flex items-center gap-1.5 text-slate-600">
                      <FileCheck className={`w-3.5 h-3.5 ${d?.url ? 'text-green-600' : 'text-slate-300'}`} />
                      <span className="capitalize">{k.replace(/([A-Z])/g, ' $1')}:</span>
                      <span className="font-semibold">{d?.url ? 'Uploaded' : 'Missing'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Declaration & Submit Button */}
            {!isReadOnly && (
              <div className="pt-4 border-t border-slate-200 space-y-4">
                <div className="flex items-start gap-2.5 text-xs text-slate-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                  <ShieldCheck className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p>
                    I hereby certify that all information submitted is true to the best of my knowledge. I understand that submitting false academic records will forfeit admission rights.
                  </p>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleSubmitApplication}
                    disabled={submitting}
                    className="px-8 py-3 rounded-xl bg-iem-blue-800 hover:bg-iem-blue-900 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2"
                  >
                    {submitting ? 'Submitting Application...' : 'Lock & Submit Application (FR-5)'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step Navigation Bar */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setCurrentStep((prev) => Math.max(prev - 1, 1))}
            disabled={currentStep === 1}
            className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-30 flex items-center gap-1.5 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Previous
          </button>

          {currentStep < 5 && (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => Math.min(prev + 1, 5))}
              className="px-6 py-2.5 rounded-lg bg-iem-blue-800 text-white text-xs font-semibold hover:bg-iem-blue-900 shadow-sm flex items-center gap-1.5 transition"
            >
              Next Step <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Mock Payment Gateway Modal (FR-8) */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        amount={applicationFee}
        feeType="application_fee"
        onPaymentComplete={handleApplicationFeeComplete}
      />
    </div>
  );
}
