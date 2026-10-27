import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-iem-blue-100 text-iem-blue-800 flex items-center justify-center mx-auto mb-4">
        <GraduationCap className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">404</h1>
      <h2 className="text-lg font-bold text-slate-700 mt-2">Page Not Found</h2>
      <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">
        The admission portal route or document you are looking for does not exist or has been relocated.
      </p>
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-iem-blue-800 text-white font-semibold text-xs hover:bg-iem-blue-900 shadow-sm transition"
      >
        <ArrowLeft className="w-4 h-4" /> Return to Dashboard
      </Link>
    </div>
  );
}
