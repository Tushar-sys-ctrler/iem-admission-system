import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/common/Toast';
import ProtectedRoute from './components/common/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import OTPVerification from './pages/auth/OTPVerification';

// Applicant Pages
import ApplicantDashboard from './pages/applicant/Dashboard';
import ApplicationForm from './pages/applicant/ApplicationForm';
import SemesterFees from './pages/applicant/SemesterFees';
import Withdrawal from './pages/applicant/Withdrawal';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import Applications from './pages/admin/Applications';
import DocumentVerification from './pages/admin/DocumentVerification';
import SeatAllocation from './pages/admin/SeatAllocation';
import BatchGenerator from './pages/admin/BatchGenerator';
import SystemConfig from './pages/admin/SystemConfig';
import Reports from './pages/admin/Reports';

// Global & Error Pages
import Helpdesk from './pages/Helpdesk';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-otp" element={<OTPVerification />} />

            {/* Authenticated Dashboard Layout */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              {/* Applicant Area */}
              <Route index element={<ApplicantDashboard />} />
              <Route path="application" element={<ApplicationForm />} />
              <Route path="semester-fees" element={<SemesterFees />} />
              <Route path="withdrawal" element={<Withdrawal />} />

              {/* Admin Area (Strictly Role-Guarded) */}
              <Route
                path="admin"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/applications"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <Applications />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/applications/:id"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <DocumentVerification />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/seat-allocation"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <SeatAllocation />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/batch-generator"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <BatchGenerator />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/system-config"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <SystemConfig />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/reports"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <Reports />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Helpdesk Route (accessible within layout or top-level) */}
            <Route
              path="/helpdesk"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Helpdesk />} />
            </Route>

            {/* 404 Catch-All */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
