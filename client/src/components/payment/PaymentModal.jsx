import React, { useState } from 'react';
import Modal from '../common/Modal';
import { CreditCard, Smartphone, Building2, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';

const TABS = [
  { id: 'upi', label: 'UPI', icon: Smartphone },
  { id: 'card', label: 'Card', icon: CreditCard },
  { id: 'netbanking', label: 'Net Banking', icon: Building2 },
];

const BANKS = [
  'State Bank of India',
  'HDFC Bank',
  'ICICI Bank',
  'Axis Bank',
  'Punjab National Bank',
  'Bank of Baroda',
  'Kotak Mahindra Bank',
];

export default function PaymentModal({ isOpen, onClose, amount, feeType, onPaymentComplete }) {
  const [activeTab, setActiveTab] = useState('upi');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [selectedBank, setSelectedBank] = useState('');

  const resetState = () => {
    setActiveTab('upi');
    setProcessing(false);
    setResult(null);
    setUpiId('');
    setCardNumber('');
    setCardExpiry('');
    setCardCvv('');
    setCardName('');
    setSelectedBank('');
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const simulatePayment = async (status) => {
    setProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setProcessing(false);

    if (status === 'success') {
      const receiptNo = 'RCP' + Date.now().toString().slice(-8);
      setResult({ status: 'success', receiptNo });
      if (onPaymentComplete) {
        onPaymentComplete({ status: 'success', receiptNo });
      }
    } else {
      setResult({ status: 'failed', message: 'Payment declined by bank. Please try again.' });
    }
  };

  if (result) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Payment Result" size="sm">
        <div className="p-6 text-center">
          {result.status === 'success' ? (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold text-green-700 mb-2">Payment Successful!</h3>
              <p className="text-sm text-slate-600 mb-1">Amount: {formatCurrency(amount)}</p>
              <p className="text-sm text-slate-600 mb-4">Receipt: {result.receiptNo}</p>
              <button onClick={handleClose} className="btn-primary w-full">
                Done
              </button>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-red-700 mb-2">Payment Failed</h3>
              <p className="text-sm text-slate-600 mb-4">{result.message}</p>
              <button
                onClick={() => setResult(null)}
                className="btn-primary w-full mb-2"
              >
                Retry Payment
              </button>
              <button onClick={handleClose} className="btn-secondary w-full">
                Cancel
              </button>
            </>
          )}
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Payment Gateway" size="md">
      <div className="p-6">
        {/* Amount info */}
        <div className="bg-slate-50 rounded-lg p-4 mb-6 text-center">
          <p className="text-sm text-slate-500">{feeType || 'Fee Payment'}</p>
          <p className="text-2xl font-bold text-iem-blue-800">{formatCurrency(amount)}</p>
        </div>

        {/* Payment method tabs */}
        <div className="flex rounded-lg border border-slate-200 mb-6 overflow-hidden">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-iem-blue-800 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="space-y-4 mb-6">
          {activeTab === 'upi' && (
            <div>
              <label className="label">UPI ID</label>
              <input
                type="text"
                placeholder="yourname@upi"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="input-field"
              />
              <p className="text-xs text-slate-400 mt-1">Enter your UPI ID (e.g., name@paytm, name@ybl)</p>
            </div>
          )}

          {activeTab === 'card' && (
            <>
              <div>
                <label className="label">Card Number</label>
                <input
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  maxLength={19}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label">Cardholder Name</label>
                <input
                  type="text"
                  placeholder="Name on card"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  className="input-field"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Expiry</label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    maxLength={5}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">CVV</label>
                  <input
                    type="password"
                    placeholder="•••"
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value)}
                    maxLength={4}
                    className="input-field"
                  />
                </div>
              </div>
            </>
          )}

          {activeTab === 'netbanking' && (
            <div>
              <label className="label">Select Bank</label>
              <select
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                className="select-field"
              >
                <option value="">Choose your bank</option>
                {BANKS.map((bank) => (
                  <option key={bank} value={bank}>{bank}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Simulation buttons */}
        {processing ? (
          <div className="flex items-center justify-center gap-3 py-6">
            <Loader2 className="w-6 h-6 text-iem-blue-800 animate-spin" />
            <p className="text-sm font-medium text-slate-600">Processing payment...</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-center text-slate-400 font-medium uppercase tracking-wide">
              Demo Mode — Simulate Result
            </p>
            <button
              onClick={() => simulatePayment('success')}
              className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              Simulate Successful Payment
            </button>
            <button
              onClick={() => simulatePayment('failed')}
              className="w-full py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
            >
              <XCircle className="w-5 h-5" />
              Simulate Failed Payment
            </button>
          </div>
        )}

        <p className="text-[10px] text-slate-400 text-center mt-4">
          This is a demo payment gateway. No real transactions are processed.
        </p>
      </div>
    </Modal>
  );
}
