import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import { GraduationCap, Mail, Lock, User, Phone, Check, X, ArrowRight } from 'lucide-react';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const { name, email, mobile, password, confirmPassword } = formData;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Password rules
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const isPasswordValid = hasMinLength && hasUppercase && hasNumber && hasSpecial;
  const passwordsMatch = password && password === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isPasswordValid) {
      toast.error('Password does not meet the complexity requirements.');
      return;
    }
    if (!passwordsMatch) {
      toast.error('Passwords do not match.');
      return;
    }
    if (mobile.length < 10) {
      toast.error('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    try {
      const res = await register(name, email, mobile, password);
      const generatedOtp = res.otp || res.data?.otp || '';
      const emailSent = Boolean(res.emailDispatched || res.data?.emailDispatched);
      if (emailSent) {
        toast.success('Registration successful! Real verification email sent to your inbox.');
      } else {
        toast.info('Registration successful! Simulated in-app OTP generated.');
      }
      navigate(
        `/verify-otp?email=${encodeURIComponent(email)}${generatedOtp ? `&otp=${generatedOtp}` : ''}&emailDispatched=${emailSent}`
      );
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-iem-blue-950 to-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 px-4">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-iem-blue-700 to-iem-blue-500 shadow-xl shadow-iem-blue-900/50 mb-4 border border-iem-blue-400/30">
          <GraduationCap className="w-9 h-9 text-white" />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">IEM Kolkata</h2>
        <p className="mt-1 text-sm text-iem-blue-200">
          New Applicant Registration Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-100">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-slate-900">Create an Applicant Account</h3>
            <p className="text-sm text-slate-500 mt-1">
              Begin your JoSAA-style admission journey for Session 2026-27
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  name="name"
                  value={name}
                  onChange={handleChange}
                  placeholder="e.g. Sourav Mukherjee"
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-iem-blue-600 focus:border-iem-blue-600 text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={email}
                  onChange={handleChange}
                  placeholder="applicant@example.com"
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-iem-blue-600 focus:border-iem-blue-600 text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Number (10 digits)</label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="h-5 w-5" />
                </div>
                <input
                  type="tel"
                  name="mobile"
                  value={mobile}
                  onChange={handleChange}
                  maxLength={10}
                  placeholder="9876543210"
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-iem-blue-600 focus:border-iem-blue-600 text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type="password"
                  name="password"
                  value={password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-iem-blue-600 focus:border-iem-blue-600 text-sm"
                  required
                />
              </div>

              {/* Password strength checklist */}
              <div className="mt-2.5 p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5">
                <p className="font-semibold text-slate-600">Password requirements (NFR-2):</p>
                <div className="grid grid-cols-2 gap-1.5">
                  <div className={`flex items-center gap-1 ${hasMinLength ? 'text-green-600' : 'text-slate-400'}`}>
                    {hasMinLength ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    <span>8+ characters</span>
                  </div>
                  <div className={`flex items-center gap-1 ${hasUppercase ? 'text-green-600' : 'text-slate-400'}`}>
                    {hasUppercase ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    <span>1 uppercase letter</span>
                  </div>
                  <div className={`flex items-center gap-1 ${hasNumber ? 'text-green-600' : 'text-slate-400'}`}>
                    {hasNumber ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    <span>1 number (0-9)</span>
                  </div>
                  <div className={`flex items-center gap-1 ${hasSpecial ? 'text-green-600' : 'text-slate-400'}`}>
                    {hasSpecial ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    <span>1 special symbol</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type="password"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-iem-blue-600 focus:border-iem-blue-600 text-sm"
                  required
                />
              </div>
              {confirmPassword && (
                <p className={`text-xs mt-1 ${passwordsMatch ? 'text-green-600' : 'text-red-500'}`}>
                  {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg shadow-md text-sm font-semibold text-white bg-iem-blue-800 hover:bg-iem-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-iem-blue-700 disabled:opacity-60 transition-all duration-200 mt-4"
            >
              {loading ? 'Creating Account...' : 'Continue to Mobile/OTP Verification'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-600">
            Already registered?{' '}
            <Link to="/login" className="font-semibold text-iem-blue-700 hover:text-iem-blue-800">
              Sign in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
