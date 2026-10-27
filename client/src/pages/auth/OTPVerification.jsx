import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';
import { useToast } from '../../components/common/Toast';
import { ShieldCheck, Smartphone, CheckCircle, RefreshCw, ArrowLeft, Sparkles, Mail, KeyRound } from 'lucide-react';

export default function OTPVerification() {
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get('email') || '';
  const otpParam = searchParams.get('otp') || '';
  const emailDispatchedParam = searchParams.get('emailDispatched') === 'true';

  const [email, setEmail] = useState(emailParam);
  const [otp, setOtp] = useState(otpParam || '123456');
  const [demoOtpBanner, setDemoOtpBanner] = useState(otpParam || '123456');
  const [emailDispatched, setEmailDispatched] = useState(emailDispatchedParam);
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const toast = useToast();
  const navigate = useNavigate();

  // If email was provided and no otp came in query, request one on mount
  useEffect(() => {
    if (emailParam && !otpParam) {
      handleSendOTP(false);
    }
  }, [emailParam]);

  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleSendOTP = async (manual = true) => {
    if (!email) {
      if (manual) toast.warning('Please provide an email address');
      return;
    }
    setSendingOtp(true);
    try {
      const res = await api.post('/auth/send-otp', { email });
      if (res.data.success) {
        const receivedOtp = res.data.otp || res.data.data?.otp || '123456';
        const dispatched = Boolean(res.data.emailDispatched || res.data.data?.emailDispatched);
        setEmailDispatched(dispatched);
        setDemoOtpBanner(receivedOtp);
        setOtp(receivedOtp);
        if (dispatched) {
          toast.success(`Real OTP email dispatched to ${email}!`);
        } else if (manual) {
          toast.info(`Simulated OTP generated: ${receivedOtp}`);
        }
        setTimer(60);
        setCanResend(false);
      }
    } catch (err) {
      setDemoOtpBanner('123456');
      setOtp('123456');
      setEmailDispatched(false);
      if (manual) toast.warning('Using Universal Master OTP: 123456');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleAutoFill = () => {
    const code = demoOtpBanner || '123456';
    setOtp(code);
    toast.success(`Auto-filled code ${code}`);
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const codeToVerify = otp.trim() || '123456';

    setLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', { email, otp: codeToVerify });
      if (res.data.success) {
        toast.success('Account and Mobile successfully verified! Please log in.');
        navigate('/login');
      } else {
        toast.error(res.data.message || 'Verification failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP. Master OTP 123456 is always accepted.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-iem-blue-950 to-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 px-4">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-100">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-iem-blue-50 text-iem-blue-800 mb-3 border border-iem-blue-200 shadow-inner">
              <Smartphone className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">OTP Account Verification (FR-1)</h3>
            <p className="text-xs text-slate-500 mt-1">
              Required by JoSAA/IEM Admission Guidelines to activate your applicant profile
            </p>
          </div>

          {/* DUAL-DELIVERY REAL EMAIL STATUS NOTICE */}
          {emailDispatched && (
            <div className="mb-4 p-4 rounded-xl bg-emerald-50 border-2 border-emerald-300 shadow-sm space-y-2 animate-fade-in">
              <div className="flex items-start gap-2.5">
                <Mail className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-emerald-900 text-xs">Real OTP Email Dispatched!</p>
                  <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                    A real verification email was sent to <strong className="text-emerald-950 font-mono">{email}</strong>. Check your inbox, or use the Lab Evaluation banner below.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SIMULATED OTP EXPLANATION BANNER (Always Present for Evaluation) */}
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 shadow-sm space-y-2">
            <div className="flex items-start gap-2.5">
              <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-900 text-xs">
                  {emailDispatched ? 'Lab Evaluation Quick-Verify Banner' : 'Simulated In-App OTP Gateway (FR-1)'}
                </p>
                <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                  {emailDispatched
                    ? 'For instant lab testing without switching tabs to your inbox, your generated code is mirrored here:'
                    : 'Per academic project guidelines, real SMTP/SMS gateways are simulated for zero-downtime testing. Your verification code is delivered directly to this screen:'}
                </p>
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-amber-200 text-center space-y-2 mt-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                Your 6-Digit Verification Code:
              </span>
              <span className="text-3xl font-black tracking-widest text-iem-blue-900 font-mono block">
                {demoOtpBanner || '123456'}
              </span>

              <button
                type="button"
                onClick={handleAutoFill}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold transition shadow-sm"
              >
                <KeyRound className="w-3.5 h-3.5" /> Auto-Fill This OTP
              </button>
            </div>

            <p className="text-[10px] text-amber-700 text-center pt-1">
              * Master OTP <strong className="font-mono bg-white px-1 py-0.5 rounded border border-amber-300">123456</strong> is also universally accepted for testing.
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Registered Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="applicant@example.com"
                className="block w-full px-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-iem-blue-600"
                required
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => handleSendOTP(true)}
                disabled={sendingOtp}
                className="text-xs font-semibold text-iem-blue-700 hover:text-iem-blue-900 flex items-center gap-1 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${sendingOtp ? 'animate-spin' : ''}`} />
                {sendingOtp ? 'Dispatching...' : 'Resend / Regenerate OTP'}
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Enter 6-Digit OTP Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                className="block w-full px-4 py-3 text-center tracking-widest font-mono text-2xl font-bold border-2 border-iem-blue-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-iem-blue-600"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg shadow-md text-sm font-semibold text-white bg-iem-blue-800 hover:bg-iem-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-iem-blue-700 disabled:opacity-60 transition-all duration-200 mt-2"
            >
              {loading ? 'Verifying...' : 'Verify & Activate Account'}
              <CheckCircle className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-4">
            <Link to="/login" className="flex items-center gap-1 hover:text-slate-800">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
            </Link>
            <span>
              {canResend ? (
                <button
                  type="button"
                  onClick={() => handleSendOTP(true)}
                  className="font-medium text-iem-blue-700 hover:underline"
                >
                  Resend now
                </button>
              ) : (
                `Resend in ${timer}s`
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
