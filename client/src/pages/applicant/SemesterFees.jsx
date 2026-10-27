import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import PaymentModal from '../../components/payment/PaymentModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import { generateFeeReceipt } from '../../components/pdf/FeeReceipt';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { CreditCard, Download, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export default function SemesterFees() {
  const { user } = useAuth();
  const toast = useToast();

  const [application, setApplication] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [appRes, payRes] = await Promise.all([
        api.get('/applications/my-application'),
        api.get('/payments/history'),
      ]);

      if (appRes.data.success) {
        setApplication(appRes.data.data);
      }
      if (payRes.data.success) {
        setPayments(payRes.data.data || []);
      }
    } catch (err) {
      console.error('Error loading semester fee ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const courseSemFee = application?.allottedCourse?.semesterFee || 75000;

  // Build 8 semesters data
  const semesters = Array.from({ length: 8 }, (_, i) => {
    const semNum = i + 1;
    const paidRecord = payments.find(
      (p) => p.type === 'semester_fee' && p.semester === semNum && p.status === 'success'
    );
    let status = 'Upcoming';
    if (paidRecord) {
      status = 'Paid';
    } else if (semNum === 1 || semesters?.slice(0, i).every((s) => s.status === 'Paid')) {
      status = 'Unpaid';
    }

    return {
      semester: semNum,
      amount: courseSemFee,
      status,
      payment: paidRecord,
    };
  });

  const handlePayNow = (sem) => {
    setSelectedSemester(sem);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async (result) => {
    setShowPaymentModal(false);
    toast.success(`Semester ${selectedSemester.semester} fee payment confirmed!`);
    fetchData();
  };

  const handleDownloadReceipt = (payment, semNum) => {
    const receiptData = {
      receiptNumber: payment.receiptNumber || 'RCPT-SEM-2026',
      studentName: user?.name,
      applicationId: application?.applicationId || 'N/A',
      course: application?.allottedCourse?.name || 'B.Tech Program',
      feeType: `SEMESTER ${semNum} TUITION FEE`,
      amount: payment.amount || courseSemFee,
      paymentMethod: payment.method || 'Online UPI',
      transactionDate: payment.transactionDate,
    };
    generateFeeReceipt(receiptData);
    toast.success('Semester fee receipt downloaded.');
  };

  if (loading) {
    return <LoadingSpinner message="Loading semester fee ledger..." />;
  }

  const totalPaid = payments
    .filter((p) => p.status === 'success')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const totalDegreeFee = courseSemFee * 8;
  const balanceRemaining = Math.max(0, totalDegreeFee - totalPaid);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-iem-blue-800" /> Semester Fee Ledger (FR-15)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Program: <strong className="text-slate-800">{application?.allottedCourse?.name || 'Enrolled Program'}</strong> • Standard Semester Tuition: {formatCurrency(courseSemFee)}
          </p>
        </div>

        <div className="flex gap-4 text-right">
          <div>
            <span className="text-[11px] text-slate-400 block uppercase">Total Fees Cleared</span>
            <span className="text-lg font-bold text-emerald-600 font-mono">
              {formatCurrency(totalPaid)}
            </span>
          </div>
        </div>
      </div>

      {/* 8-Semester Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">8-Semester Tuition & Fee Schedule</h3>
          <span className="text-xs text-slate-400">Computerized Ledger</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Semester</th>
                <th className="py-3 px-4">Amount Due</th>
                <th className="py-3 px-4">Payment Status</th>
                <th className="py-3 px-4">Transaction Date</th>
                <th className="py-3 px-4">Receipt Ref</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {semesters.map((s) => (
                <tr key={s.semester} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-800">
                    Semester {s.semester}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-700 font-mono">
                    {formatCurrency(s.amount)}
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={s.status} />
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">
                    {s.payment?.transactionDate ? formatDate(s.payment.transactionDate) : '—'}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-600">
                    {s.payment?.receiptNumber || '—'}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {s.status === 'Paid' && s.payment && (
                      <button
                        onClick={() => handleDownloadReceipt(s.payment, s.semester)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-iem-blue-700 hover:bg-slate-50 font-semibold"
                      >
                        <Download className="w-3.5 h-3.5" /> PDF
                      </button>
                    )}
                    {s.status === 'Unpaid' && (
                      <button
                        onClick={() => handlePayNow(s)}
                        className="inline-flex items-center gap-1 px-4 py-1.5 rounded-lg bg-iem-blue-800 text-white font-semibold hover:bg-iem-blue-900 shadow-sm"
                      >
                        Pay Now
                      </button>
                    )}
                    {s.status === 'Upcoming' && (
                      <span className="text-slate-400 italic">Not Opened</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      {selectedSemester && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          amount={selectedSemester.amount}
          feeType="semester_fee"
          semester={selectedSemester.semester}
          onPaymentComplete={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
