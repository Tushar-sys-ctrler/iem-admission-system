import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { useToast } from '../../components/common/Toast';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PaymentModal from '../../components/payment/PaymentModal';
import { generateAdmissionLetter } from '../../components/pdf/AdmissionLetter';
import { generateFeeReceipt } from '../../components/pdf/FeeReceipt';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/helpers';
import {
  FileText,
  CreditCard,
  Download,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronRight,
  Sparkles,
  Award,
  BellRing,
  BookOpen,
} from 'lucide-react';

export default function ApplicantDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [application, setApplication] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentConfig, setPaymentConfig] = useState({ amount: 0, feeType: 'enrollment_fee' });
  const [timeLeft, setTimeLeft] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [appRes, payRes] = await Promise.allSettled([
        api.get('/applications/my-application'),
        api.get('/payments/history'),
      ]);

      if (appRes.status === 'fulfilled' && appRes.value.data.success) {
        setApplication(appRes.value.data.data);
      }
      if (payRes.status === 'fulfilled' && payRes.value.data.success) {
        setPayments(payRes.value.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Countdown timer for Shortlisted seat acceptance deadline (FR-18)
  useEffect(() => {
    if (!application?.enrollmentDeadline || application?.status !== 'Shortlisted') return;

    const deadline = new Date(application.enrollmentDeadline).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const distance = deadline - now;

      if (distance <= 0) {
        setTimeLeft('EXPIRED');
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [application]);

  const handleEnrollmentPaymentOpen = () => {
    const amount = application?.allottedCourse?.enrollmentFee || 50000;
    setPaymentConfig({ amount, feeType: 'enrollment_fee' });
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async (result) => {
    setShowPaymentModal(false);
    toast.success('Enrollment fee confirmed! Seat locked & Student permanently registered.');
    try {
      await api.post(`/applications/${application._id}/accept-seat`);
      fetchData();
    } catch (err) {
      fetchData();
    }
  };

  const handleDownloadAdmissionLetter = () => {
    if (!application) return;
    const studentData = {
      name: user?.name,
      applicationId: application.applicationId,
      course: application.allottedCourse?.name || 'B.Tech Program',
      section: application.allottedSection || 'Section A',
      rollNumber: application.rollNumber || 'IEM2026CSE001',
      category: application.personalDetails?.category || 'General',
      receiptNumber: payments.find((p) => p.type === 'enrollment_fee')?.receiptNumber || 'RCPT-2026-ENR01',
      enrollmentFee: application.allottedCourse?.enrollmentFee || 50000,
      admissionDate: new Date(),
    };
    generateAdmissionLetter(studentData);
    toast.success('Official Admission Confirmation Letter generated!');
  };

  const handleDownloadReceipt = (payment) => {
    const receiptData = {
      receiptNumber: payment.receiptNumber,
      studentName: user?.name,
      applicationId: application?.applicationId || 'N/A',
      course: application?.allottedCourse?.name || 'Academic Program',
      feeType: payment.type.replace('_', ' ').toUpperCase(),
      amount: payment.amount,
      paymentMethod: payment.method || 'Online UPI',
      transactionDate: payment.transactionDate,
    };
    generateFeeReceipt(receiptData);
    toast.success('Fee receipt downloaded successfully.');
  };

  if (loading) {
    return <LoadingSpinner message="Loading your admission dashboard..." />;
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-iem-blue-900 via-iem-blue-800 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-lg border border-iem-blue-700/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-iem-blue-200 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4 text-amber-300" />
            Session 2026 - 2027 Admission Cycle
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome, {user?.name || 'Applicant'}!
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Registered Email: <span className="font-mono text-white">{user?.email}</span> • Mobile: {user?.mobile}
          </p>
        </div>

        {application?.applicationId && (
          <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/20 text-right">
            <span className="text-[11px] text-iem-blue-200 uppercase tracking-wider block font-semibold">
              Application ID
            </span>
            <span className="text-lg font-mono font-bold text-white tracking-wider">
              {application.applicationId}
            </span>
          </div>
        )}
      </div>

      {/* Main Status Callout */}
      {!application ? (
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center">
          <div className="w-16 h-16 bg-iem-blue-50 text-iem-blue-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">No Admission Application Submitted</h2>
          <p className="text-slate-500 text-sm max-w-md mx-auto mt-2 mb-6">
            Begin the JoSAA-style 5-step application process to apply for engineering and degree programs at IEM Kolkata.
          </p>
          <Link
            to="/dashboard/application"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-iem-blue-800 hover:bg-iem-blue-900 text-white font-semibold text-sm shadow-md transition-all"
          >
            Start New Application <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <>
          {/* Status Alert Cards */}
          {application.status === 'Shortlisted' && (
            <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white rounded-2xl p-6 shadow-xl border border-purple-500/40">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/30 text-purple-200 text-xs font-semibold border border-purple-400/30">
                    <Award className="w-4 h-4 text-amber-300" />
                    Round {application.allotmentRound || 1} JoSAA Seat Allotment
                  </div>
                  <h2 className="text-2xl font-extrabold">
                    Congratulations! Seat Allotted in {application.allottedCourse?.name || 'Selected Program'}
                  </h2>
                  <p className="text-sm text-purple-200 max-w-2xl">
                    You have been provisionally shortlisted based on merit rank. Confirm and lock your seat by paying the mandatory Enrollment Fee before the countdown deadline.
                  </p>
                  <div className="flex items-center gap-2 text-amber-300 font-mono text-sm pt-2">
                    <Clock className="w-4 h-4" />
                    <span>Time Remaining to Accept: </span>
                    <span className="font-bold bg-purple-950/80 px-2.5 py-1 rounded border border-purple-700/50 text-white">
                      {timeLeft || 'Calculating...'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-3 w-full md:w-auto">
                  <button
                    onClick={handleEnrollmentPaymentOpen}
                    className="px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold rounded-xl shadow-lg transition-all text-sm flex items-center justify-center gap-2"
                  >
                    <CreditCard className="w-4 h-4" /> Accept Seat & Pay Enrollment Fee ({formatCurrency(application.allottedCourse?.enrollmentFee || 50000)})
                  </button>
                  <p className="text-[11px] text-purple-300 text-center">
                    * Unpaid seats are automatically released upon deadline expiry (FR-18).
                  </p>
                </div>
              </div>
            </div>
          )}

          {application.status === 'Admitted' && (
            <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-emerald-500/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
                  <CheckCircle2 className="w-4 h-4" /> Permanent Student Registered (FR-16)
                </div>
                <h2 className="text-2xl font-bold">
                  Officially Admitted to IEM Kolkata
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2 text-xs">
                  <div className="bg-white/10 p-2.5 rounded-lg">
                    <span className="text-slate-300 block">Course</span>
                    <span className="font-semibold text-white text-sm">
                      {application.allottedCourse?.name || 'B.Tech CSE'}
                    </span>
                  </div>
                  <div className="bg-white/10 p-2.5 rounded-lg">
                    <span className="text-slate-300 block">Section</span>
                    <span className="font-semibold text-white text-sm">
                      {application.allottedSection || 'Section A'}
                    </span>
                  </div>
                  <div className="bg-white/10 p-2.5 rounded-lg">
                    <span className="text-slate-300 block">Roll Number</span>
                    <span className="font-semibold text-white text-sm font-mono">
                      {application.rollNumber || 'IEM2026CSE001'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row md:flex-col gap-3 w-full md:w-auto">
                <button
                  onClick={handleDownloadAdmissionLetter}
                  className="px-5 py-3 rounded-xl bg-white text-emerald-950 font-bold hover:bg-emerald-50 transition-all text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md"
                >
                  <Download className="w-4 h-4 text-emerald-700" /> Download Admission Letter (FR-19 PDF)
                </button>
                <div className="flex gap-2">
                  <Link
                    to="/dashboard/semester-fees"
                    className="flex-1 px-4 py-2.5 rounded-lg bg-emerald-800/80 hover:bg-emerald-800 text-center text-xs font-semibold text-white border border-emerald-600/40"
                  >
                    Semester Fees
                  </Link>
                  <Link
                    to="/dashboard/withdrawal"
                    className="px-3 py-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-center text-xs text-rose-300 border border-rose-500/30"
                  >
                    Withdraw Seat
                  </Link>
                </div>
              </div>
            </div>
          )}

          {application.status === 'Not Eligible' && (
            <div className="bg-red-50 border-l-4 border-red-500 p-5 rounded-r-xl shadow-sm">
              <div className="flex items-start gap-3">
                <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-base font-bold text-red-900">
                    Automated Eligibility Flag (FR-12)
                  </h3>
                  <p className="text-sm text-red-700 mt-1">
                    {application.eligibilityFlag ||
                      'Your 12th PCM / Aggregate marks did not meet the minimum qualifying cutoff required for your preferred courses.'}
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <Link
                      to="/dashboard/application"
                      className="text-xs font-semibold px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                    >
                      Update Course Preferences
                    </Link>
                    <Link to="/helpdesk" className="text-xs font-medium text-red-700 hover:underline">
                      Contact Admission Helpdesk
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Overview Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Application Overview */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm md:col-span-2 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-iem-blue-700" />
                  <h3 className="font-bold text-slate-800">Application Status</h3>
                </div>
                <StatusBadge status={application.status} />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block">Category</span>
                  <span className="font-semibold text-slate-700">
                    {application.personalDetails?.category || 'General'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">12th Aggregate</span>
                  <span className="font-semibold text-slate-700">
                    {application.academicDetails?.twelfthPercentage || 0}%
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">PCM Marks</span>
                  <span className="font-semibold text-slate-700">
                    {application.academicDetails?.pcmPercentage || 0}%
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Entrance Exam</span>
                  <span className="font-semibold text-slate-700">
                    {application.academicDetails?.entranceExam || 'None'}{' '}
                    {application.academicDetails?.entranceRank ? `(#${application.academicDetails.entranceRank})` : ''}
                  </span>
                </div>
              </div>

              {/* Course Preferences */}
              <div className="pt-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Submitted Course Preferences
                </h4>
                <div className="space-y-1.5">
                  {application.coursePreferences?.map((pref, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs"
                    >
                      <span className="font-medium text-slate-800">
                        {pref.priority || idx + 1}. {pref.course?.name || 'Selected Program'}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          pref.isEligible
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {pref.isEligible ? 'Meets Cutoff' : 'Below Cutoff'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-3 flex items-center justify-between border-t border-slate-100 text-xs">
                <span className="text-slate-400">
                  Last Saved: {formatDateTime(application.lastSavedAt || application.updatedAt)}
                </span>
                <Link
                  to="/dashboard/application"
                  className="font-semibold text-iem-blue-700 hover:text-iem-blue-900 flex items-center gap-1"
                >
                  {application.status === 'Draft' ? 'Continue Application Form' : 'View Full Application'}
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Document Verification Checklist */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <CheckCircle2 className="w-5 h-5 text-iem-blue-700" />
                <h3 className="font-bold text-slate-800">Document Status (FR-11)</h3>
              </div>

              <div className="space-y-2.5 text-xs">
                {application.documents ? (
                  Object.entries(application.documents).map(([key, doc]) => {
                    const labelMap = {
                      tenthMarkSheet: '10th Mark Sheet',
                      twelfthMarkSheet: '12th Mark Sheet',
                      idProof: 'Identity Proof',
                      photo: 'Passport Photo',
                      signature: 'Signature',
                    };
                    return (
                      <div
                        key={key}
                        className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/70 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-700">{labelMap[key] || key}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              doc?.status === 'Verified'
                                ? 'bg-green-100 text-green-700'
                                : doc?.status === 'Rejected'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {doc?.status || 'Pending'}
                          </span>
                        </div>
                        {doc?.status === 'Rejected' && doc?.rejectionReason && (
                          <p className="text-[11px] text-red-600 bg-red-50 p-1.5 rounded">
                            Reason: {doc.rejectionReason}
                          </p>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-slate-400 italic">No documents uploaded yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* Payment History & In-App Logs */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-iem-blue-700" />
                <h3 className="font-bold text-slate-800">Transaction History & Receipts</h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {payments.length} record(s)
              </span>
            </div>

            {payments.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">
                No fee transactions recorded yet.
              </p>
            ) : (
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Receipt No</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Method</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3 text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payments.map((p) => (
                      <tr key={p._id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-700">
                          {p.receiptNumber}
                        </td>
                        <td className="py-2.5 px-3 uppercase text-slate-600">
                          {p.type.replace('_', ' ')}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {formatCurrency(p.amount)}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">{p.method}</td>
                        <td className="py-2.5 px-3">
                          <StatusBadge status={p.status} />
                        </td>
                        <td className="py-2.5 px-3 text-slate-400">
                          {formatDate(p.transactionDate)}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {p.status === 'success' && (
                            <button
                              onClick={() => handleDownloadReceipt(p)}
                              className="inline-flex items-center gap-1 text-iem-blue-700 hover:text-iem-blue-900 font-semibold"
                            >
                              <Download className="w-3.5 h-3.5" /> PDF
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Payment Gateway Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        amount={paymentConfig.amount}
        feeType={paymentConfig.feeType}
        onPaymentComplete={handlePaymentSuccess}
      />
    </div>
  );
}
