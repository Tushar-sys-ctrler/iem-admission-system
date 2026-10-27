import React, { useState } from 'react';
import { useToast } from '../components/common/Toast';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Send,
  MessageSquare,
  Building2,
  FileQuestion,
} from 'lucide-react';

const FAQS = [
  {
    q: 'How does the JoSAA-style course preference ordering work?',
    a: 'Applicants can rank multiple academic programs (e.g. B.Tech CSE, CSE AI&ML, ECE, BCA) in order of personal preference. The system verifies your 12th PCM cutoff in real-time. During seat allotment, the admission committee considers your highest-priority eligible preference first.',
  },
  {
    q: 'What are the minimum qualifying cutoffs for engineering degrees?',
    a: 'For B.Tech CSE (AI & ML), the cutoff is 80% PCM aggregate. For B.Tech CSE, it is 75% PCM. For B.Tech ECE, it is 70% PCM, and for BCA, it is 60% 12th aggregate marks.',
  },
  {
    q: 'How does the automated draft auto-save feature work (FR-6)?',
    a: 'The application wizard automatically syncs and saves your progress every 2 minutes. You can also click the manual "Save Draft" button anytime. Draft applications remain valid on your account for 30 days.',
  },
  {
    q: 'What is the seat acceptance deadline after being shortlisted (FR-18)?',
    a: 'Once an applicant is shortlisted and allotted a provisional seat, a real-time countdown timer appears on their dashboard. Applicants must accept the seat and complete the enrollment fee payment before the deadline expires, after which the seat is automatically returned to the counseling pool.',
  },
  {
    q: 'Can I withdraw my admission after enrollment, and will I receive a refund (FR-17)?',
    a: 'Yes. Admitted students can submit a formal withdrawal request through their student dashboard. Upon confirmation, the allotted seat is immediately released, and the enrollment fee is refunded after deducting a standard 10% administrative processing fee.',
  },
  {
    q: 'What documents are required for upload, and what are the file limits (FR-3)?',
    a: 'You must upload your 10th Standard Mark Sheet, 12th Science Mark Sheet, Government Identity Proof (Aadhaar/Passport/PAN), Recent Passport Photo, and Digital Signature. Files must be in PDF, JPG, JPEG, or PNG format with a maximum size of 2MB per file.',
  },
];

export default function Helpdesk() {
  const [openFaq, setOpenFaq] = useState(0);
  const [ticket, setTicket] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const handleTicketSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      toast.success('Your enquiry has been logged! Support ticket #IEM-HELP-892 created.');
      setTicket({ name: '', email: '', subject: '', message: '' });
      setSubmitting(false);
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-iem-blue-900 via-iem-blue-800 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-md">
        <div className="flex items-center gap-2 text-iem-blue-200 text-xs font-semibold uppercase tracking-wider mb-2">
          <HelpCircle className="w-4 h-4 text-amber-300" />
          University Admission Helpdesk
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          How can we help your admission journey?
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
          Get in touch with the IEM Salt Lake admission office or browse frequently asked questions regarding counseling, cutoffs, and document verification.
        </p>
      </div>

      {/* Contact Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-xl bg-iem-blue-50 text-iem-blue-800 flex items-center justify-center">
            <Phone className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Admission Hotlines</h3>
          <p className="text-xs text-slate-600 font-mono">+91 33 2357 2995</p>
          <p className="text-xs text-slate-600 font-mono">+91 33 2357 2059</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-xl bg-iem-blue-50 text-iem-blue-800 flex items-center justify-center">
            <Mail className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Official Email</h3>
          <p className="text-xs text-slate-600 font-mono">admissions@iem.edu.in</p>
          <p className="text-xs text-slate-400">Response within 24 business hours</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-xl bg-iem-blue-50 text-iem-blue-800 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Office Hours</h3>
          <p className="text-xs text-slate-600">Mon - Fri: 10:00 AM – 5:00 PM</p>
          <p className="text-xs text-slate-600">Saturday: 10:00 AM – 1:00 PM</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-xl bg-iem-blue-50 text-iem-blue-800 flex items-center justify-center">
            <MapPin className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Campus Location</h3>
          <p className="text-xs text-slate-600">IEM Salt Lake, Sector V</p>
          <p className="text-xs text-slate-400">Kolkata, West Bengal - 700091</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* FAQ Accordion */}
        <div className="lg:col-span-3 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <FileQuestion className="w-5 h-5 text-iem-blue-800" />
            <h3 className="font-bold text-slate-900 text-sm">Frequently Asked Questions (FAQ)</h3>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 overflow-hidden transition"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-4 text-left font-semibold text-xs text-slate-800 bg-slate-50 hover:bg-slate-100/70 flex justify-between items-center transition"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-slate-500 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="p-4 bg-white text-xs text-slate-600 leading-relaxed border-t border-slate-100">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Support Ticket Submission */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <MessageSquare className="w-5 h-5 text-iem-blue-800" />
            <h3 className="font-bold text-slate-900 text-sm">Submit an Admission Query</h3>
          </div>

          <form onSubmit={handleTicketSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Your Full Name *</label>
              <input
                type="text"
                value={ticket.name}
                onChange={(e) => setTicket({ ...ticket, name: e.target.value })}
                placeholder="e.g. Ananya Sen"
                className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-iem-blue-600"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Email Address *</label>
              <input
                type="email"
                value={ticket.email}
                onChange={(e) => setTicket({ ...ticket, email: e.target.value })}
                placeholder="candidate@example.com"
                className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-iem-blue-600"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Subject / Query Topic *</label>
              <input
                type="text"
                value={ticket.subject}
                onChange={(e) => setTicket({ ...ticket, subject: e.target.value })}
                placeholder="e.g. PCM Cutoff Clarification for CSE"
                className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-iem-blue-600"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Message Details *</label>
              <textarea
                rows={4}
                value={ticket.message}
                onChange={(e) => setTicket({ ...ticket, message: e.target.value })}
                placeholder="Describe your question or issue in detail..."
                className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-iem-blue-600"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 rounded-lg bg-iem-blue-800 hover:bg-iem-blue-900 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              {submitting ? 'Dispatching Query...' : 'Send Message to Helpdesk'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
