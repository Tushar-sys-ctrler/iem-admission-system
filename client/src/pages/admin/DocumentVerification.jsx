import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';
import { useToast } from '../../components/common/Toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import { formatCurrency, formatDate } from '../../utils/helpers';
import {
  FileCheck2,
  CheckCircle,
  XCircle,
  Eye,
  ArrowLeft,
  User,
  GraduationCap,
  ListOrdered,
  AlertTriangle,
  Award,
  Clock,
  ShieldCheck,
} from 'lucide-react';

export default function DocumentVerification() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [application, setApplication] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Rejection modal state
  const [rejectionModal, setRejectionModal] = useState({
    isOpen: false,
    docType: '',
    reason: '',
  });

  const fetchApplication = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/applications/${id}`);
      if (res.data.success) {
        setApplication(res.data.data.application);
        setPayments(res.data.data.payments || []);
      }
    } catch (err) {
      toast.error('Failed to load application details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplication();
  }, [id]);

  const handleVerifyDoc = async (docType) => {
    try {
      setActionLoading(true);
      const res = await api.put(`/admin/applications/${id}/verify-document`, {
        docType,
        status: 'Verified',
      });
      if (res.data.success) {
        toast.success(`Document marked as Verified.`);
        fetchApplication();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenRejectModal = (docType) => {
    setRejectionModal({
      isOpen: true,
      docType,
      reason: '',
    });
  };

  const handleConfirmRejectDoc = async () => {
    if (!rejectionModal.reason.trim()) {
      toast.warning('A mandatory rejection reason is required (FR-11).');
      return;
    }

    try {
      setActionLoading(true);
      const res = await api.put(`/admin/applications/${id}/verify-document`, {
        docType: rejectionModal.docType,
        status: 'Rejected',
        rejectionReason: rejectionModal.reason,
      });
      if (res.data.success) {
        toast.error(`Document marked as Rejected.`);
        setRejectionModal({ isOpen: false, docType: '', reason: '' });
        fetchApplication();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Rejection failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleShortlist = async () => {
    try {
      setActionLoading(true);
      const res = await api.post(`/admin/applications/${id}/shortlist`);
      if (res.data.success) {
        toast.success('Applicant shortlisted & seat allocated in top eligible course!');
        fetchApplication();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Shortlisting failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      setActionLoading(true);
      const res = await api.put(`/admin/applications/${id}/status`, { status: newStatus });
      if (res.data.success) {
        toast.info(`Application status changed to ${newStatus}`);
        fetchApplication();
      }
    } catch (err) {
      toast.error('Failed to change status.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading candidate dossier..." />;
  }

  if (!application) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Application not found.</p>
        <Link to="/dashboard/admin/applications" className="text-iem-blue-700 underline text-xs mt-2 block">
          Back to list
        </Link>
      </div>
    );
  }

  const docLabels = {
    tenthMarkSheet: '10th Standard Mark Sheet',
    twelfthMarkSheet: '12th Standard Mark Sheet',
    idProof: 'Government ID Proof',
    photo: 'Passport Size Photograph',
    signature: 'Digital Signature',
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Link
            to="/dashboard/admin/applications"
            className="text-xs font-semibold text-iem-blue-700 hover:text-iem-blue-900 flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Applications Roster
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">
              {application.applicant?.name || 'Applicant Dossier'}
            </h1>
            <StatusBadge status={application.status} />
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Application ID: <strong className="text-slate-700">{application.applicationId || 'N/A'}</strong> • Email: {application.applicant?.email}
          </p>
        </div>

        {/* Global Shortlist / Reject Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {application.status !== 'Shortlisted' && application.status !== 'Admitted' && (
            <button
              type="button"
              onClick={handleShortlist}
              disabled={actionLoading}
              className="px-4 py-2 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition"
            >
              <Award className="w-3.5 h-3.5" /> Shortlist & Allot Seat (FR-18)
            </button>
          )}

          {application.status === 'Submitted' && (
            <button
              type="button"
              onClick={() => handleUpdateStatus('Under Review')}
              disabled={actionLoading}
              className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 transition"
            >
              <Clock className="w-3.5 h-3.5" /> Mark Under Review
            </button>
          )}

          {application.status !== 'Rejected' && application.status !== 'Withdrawn' && (
            <button
              type="button"
              onClick={() => handleUpdateStatus('Rejected')}
              disabled={actionLoading}
              className="px-4 py-2 rounded-lg border border-red-300 text-red-700 hover:bg-red-50 text-xs font-semibold transition"
            >
              Reject Application
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Candidate Academic & Personal Profile */}
        <div className="space-y-6">
          {/* Personal Info */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3 text-xs">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 font-bold text-slate-800">
              <User className="w-4 h-4 text-iem-blue-700" /> Personal Identity
            </div>
            <div className="space-y-1.5 text-slate-600">
              <div>
                <span className="text-slate-400">Date of Birth:</span>{' '}
                <strong className="text-slate-700">{formatDate(application.personalDetails?.dob)}</strong>
              </div>
              <div>
                <span className="text-slate-400">Gender / Category:</span>{' '}
                <strong className="text-slate-700">
                  {application.personalDetails?.gender} / {application.personalDetails?.category}
                </strong>
              </div>
              <div>
                <span className="text-slate-400">Guardian Name:</span>{' '}
                <strong className="text-slate-700">{application.personalDetails?.guardianName}</strong>
              </div>
              <div>
                <span className="text-slate-400">Guardian Phone:</span>{' '}
                <strong className="text-slate-700">{application.personalDetails?.guardianPhone}</strong>
              </div>
              <div>
                <span className="text-slate-400">Aadhaar No:</span>{' '}
                <strong className="text-slate-700 font-mono">{application.personalDetails?.aadhaarNumber}</strong>
              </div>
              <div>
                <span className="text-slate-400">Address:</span>{' '}
                <span className="text-slate-700">{application.personalDetails?.address}</span>
              </div>
            </div>
          </div>

          {/* Academic Info */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3 text-xs">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 font-bold text-slate-800">
              <GraduationCap className="w-4 h-4 text-iem-blue-700" /> Academic Scores & Cutoff
            </div>
            <div className="space-y-2 text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-400">10th Percentage:</span>
                <strong className="text-slate-800">{application.academicDetails?.tenthPercentage}%</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">12th Aggregate:</span>
                <strong className="text-slate-800">{application.academicDetails?.twelfthPercentage}%</strong>
              </div>
              <div className="flex justify-between bg-iem-blue-50/70 p-2 rounded-lg border border-iem-blue-100">
                <span className="font-semibold text-iem-blue-900">PCM Average:</span>
                <strong className="text-iem-blue-900 font-mono text-sm">
                  {application.academicDetails?.pcmPercentage || 0}%
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Entrance Examination:</span>
                <strong className="text-slate-800">
                  {application.academicDetails?.entranceExam}{' '}
                  {application.academicDetails?.entranceRank ? `(#${application.academicDetails.entranceRank})` : ''}
                </strong>
              </div>
            </div>
          </div>

          {/* Course Choice Preferences */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3 text-xs">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 font-bold text-slate-800">
              <ListOrdered className="w-4 h-4 text-iem-blue-700" /> Course Choices & Eligibility
            </div>
            <div className="space-y-1.5">
              {application.coursePreferences?.map((p, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100"
                >
                  <span className="font-medium text-slate-800">
                    {p.priority || idx + 1}. {p.course?.name || 'Selected Program'}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      p.isEligible ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {p.isEligible ? 'Meets Cutoff' : 'Ineligible (FR-12)'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Document Verification Drawer (FR-11) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-iem-blue-800" />
                <h3 className="font-bold text-slate-800">Uploaded Credentials & Verification (FR-11)</h3>
              </div>
              <span className="text-[11px] text-slate-400">Mandatory staff verification</span>
            </div>

            <div className="space-y-4">
              {Object.keys(docLabels).map((docType) => {
                const doc = application.documents?.[docType];
                const hasUrl = Boolean(doc?.url);
                const isVerified = doc?.status === 'Verified';
                const isRejected = doc?.status === 'Rejected';

                return (
                  <div
                    key={docType}
                    className={`p-4 rounded-xl border transition-all ${
                      isVerified
                        ? 'bg-emerald-50/30 border-emerald-200'
                        : isRejected
                        ? 'bg-rose-50/40 border-rose-300'
                        : 'bg-slate-50/60 border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">{docLabels[docType]}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isVerified
                                ? 'bg-emerald-100 text-emerald-800'
                                : isRejected
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            Status: {doc?.status || 'Pending'}
                          </span>
                          {hasUrl && (
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-iem-blue-700 hover:text-iem-blue-900 font-semibold inline-flex items-center gap-1 underline"
                            >
                              <Eye className="w-3.5 h-3.5" /> Preview Scanned File
                            </a>
                          )}
                        </div>
                        {isRejected && doc?.rejectionReason && (
                          <p className="text-[11px] text-rose-700 bg-rose-100/70 p-2 rounded-lg mt-2 font-medium">
                            Mandatory Rejection Note: "{doc.rejectionReason}"
                          </p>
                        )}
                      </div>

                      {/* Verification Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleVerifyDoc(docType)}
                          disabled={actionLoading || isVerified}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs disabled:opacity-40 transition flex items-center gap-1"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Verify
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenRejectModal(docType)}
                          disabled={actionLoading || isRejected}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs disabled:opacity-40 transition flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Mandatory Rejection Reason Modal (FR-11) */}
      {rejectionModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-bold text-slate-900 text-sm">
                Enforce Rejection Reason (FR-11)
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Per university compliance, you must state why the document for{' '}
              <strong>{docLabels[rejectionModal.docType]}</strong> is being rejected. This explanation is dispatched directly to the candidate dashboard.
            </p>

            <textarea
              rows={3}
              value={rejectionModal.reason}
              onChange={(e) =>
                setRejectionModal({ ...rejectionModal, reason: e.target.value })
              }
              placeholder="e.g. Scanned marksheet is blurry; marks and board seal are illegible. Please re-upload high resolution copy."
              className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 text-slate-800"
              required
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectionModal({ isOpen: false, docType: '', reason: '' })}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRejectDoc}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
              >
                Confirm Document Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
