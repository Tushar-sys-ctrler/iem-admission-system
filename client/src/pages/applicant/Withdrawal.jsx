import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { AlertTriangle, ShieldAlert, ArrowLeft, CheckCircle2, FileText, Download } from 'lucide-react';

export default function Withdrawal() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reason, setReason] = useState('Got Better College / Branch');
  const [comments, setComments] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [withdrawnSuccess, setWithdrawnSuccess] = useState(false);

  useEffect(() => {
    const fetchApp = async () => {
      try {
        setLoading(true);
        const res = await api.get('/applications/my-application');
        if (res.data.success) {
          setApplication(res.data.data);
          if (res.data.data.status === 'Withdrawn') {
            setWithdrawnSuccess(true);
          }
        }
      } catch (err) {
        console.error('Error fetching application:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchApp();
  }, []);

  const enrollmentFee = application?.allottedCourse?.enrollmentFee || 50000;
  const processingFee = Math.round(enrollmentFee * 0.1); // 10% processing fee
  const refundAmount = enrollmentFee - processingFee;

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!confirmed) {
      toast.warning('Please confirm the irreversible withdrawal declaration.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post(`/applications/${application._id}/withdraw`, {
        reason: `${reason}: ${comments}`,
      });
      if (res.data.success) {
        toast.success('Admission withdrawn successfully. Refund slip generated.');
        setWithdrawnSuccess(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Withdrawal request failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Checking admission enrollment..." />;
  }

  if (withdrawnSuccess || application?.status === 'Withdrawn') {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center space-y-4">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Admission Formally Withdrawn (FR-17)</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Your seat in <strong className="text-slate-800">{application?.allottedCourse?.name || 'Academic Program'}</strong> has been released back to the counseling pool.
        </p>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-left max-w-md mx-auto space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-500">Application ID:</span>
            <span className="font-mono font-bold text-slate-800">{application?.applicationId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Enrollment Fee Paid:</span>
            <span className="text-slate-800">{formatCurrency(enrollmentFee)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">10% Processing Deduction:</span>
            <span className="text-rose-600 font-semibold">- {formatCurrency(processingFee)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-slate-900">
            <span>Approved Net Refund:</span>
            <span className="text-emerald-600 font-mono text-sm">{formatCurrency(refundAmount)}</span>
          </div>
        </div>

        <div className="pt-4 flex justify-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2.5 rounded-lg bg-iem-blue-800 text-white text-xs font-semibold hover:bg-iem-blue-900"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Warning Card */}
      <div className="bg-rose-50 border-l-4 border-rose-500 p-5 rounded-r-2xl shadow-sm">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-base font-bold text-rose-900">
              Admission Cancellation & Seat Relinquishment (FR-17)
            </h3>
            <p className="text-xs text-rose-700 mt-1">
              Cancelling your admission is an <strong>irreversible action</strong>. Your allotted seat in{' '}
              <strong>{application?.allottedCourse?.name || 'B.Tech Program'}</strong> will be released immediately to waitlisted candidates.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Withdrawal Application Form</h2>
          <p className="text-xs text-slate-500">Provide official reason for record keeping and refund audit</p>
        </div>

        <form onSubmit={handleWithdraw} className="space-y-5 text-xs">
          <div>
            <label className="block text-slate-700 font-medium mb-1">Primary Reason for Withdrawal *</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-iem-blue-600"
              required
            >
              <option value="Got Better College / Branch">Got Better College / Branch</option>
              <option value="Financial Constraints">Financial Constraints</option>
              <option value="Personal / Family Reasons">Personal / Family Reasons</option>
              <option value="Medical Emergency">Medical Emergency</option>
              <option value="Relocation / Outstation Movement">Relocation / Outstation Movement</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">Additional Explanatory Comments</label>
            <textarea
              rows={3}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="State any specific details or remarks regarding this withdrawal request..."
              className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-iem-blue-600"
            />
          </div>

          {/* Refund Calculation Box */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="font-bold text-slate-800 uppercase block">Automated Refund Calculation (FR-17)</span>
            <div className="flex justify-between text-slate-600">
              <span>Enrollment Fee Paid:</span>
              <span className="font-semibold text-slate-800">{formatCurrency(enrollmentFee)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Standard Processing Deduction (10%):</span>
              <span className="text-rose-600 font-semibold">- {formatCurrency(processingFee)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-slate-900 text-sm">
              <span>Net Refund Credited to Source:</span>
              <span className="text-emerald-600 font-mono">{formatCurrency(refundAmount)}</span>
            </div>
          </div>

          {/* Consent Checkbox */}
          <label className="flex items-start gap-2.5 cursor-pointer pt-2">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
            />
            <span className="text-slate-700 leading-tight">
              I solemnly confirm that I wish to permanently forfeit my admission at IEM Kolkata. I acknowledge that the allotted seat cannot be reclaimed under any circumstances.
            </span>
          </label>

          <div className="pt-4 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 font-semibold hover:bg-slate-50 flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
            </button>

            <button
              type="submit"
              disabled={submitting || !confirmed}
              className="px-6 py-2.5 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-700 disabled:opacity-40 shadow-sm transition"
            >
              {submitting ? 'Processing Release...' : 'Confirm Withdrawal & Seat Release'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
