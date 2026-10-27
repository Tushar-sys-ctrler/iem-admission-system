import jsPDF from 'jspdf';
import 'jspdf-autotable';

export function formatDate(date) {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(date) {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getStatusColor(status) {
  const colors = {
    Draft: 'bg-gray-100 text-gray-700',
    Submitted: 'bg-blue-100 text-blue-700',
    'Under Review': 'bg-amber-100 text-amber-700',
    Shortlisted: 'bg-purple-100 text-purple-700',
    Admitted: 'bg-green-100 text-green-700',
    'Not Eligible': 'bg-red-100 text-red-700',
    Rejected: 'bg-red-100 text-red-700',
    Withdrawn: 'bg-slate-100 text-slate-700',
    Verified: 'bg-green-100 text-green-700',
    Pending: 'bg-amber-100 text-amber-700',
    Paid: 'bg-green-100 text-green-700',
    Unpaid: 'bg-red-100 text-red-700',
    Upcoming: 'bg-slate-100 text-slate-600',
    success: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
    pending: 'bg-amber-100 text-amber-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
}

export function getStatusDot(status) {
  const dots = {
    Draft: 'bg-gray-400',
    Submitted: 'bg-blue-500',
    'Under Review': 'bg-amber-500',
    Shortlisted: 'bg-purple-500',
    Admitted: 'bg-green-500',
    'Not Eligible': 'bg-red-500',
    Rejected: 'bg-red-500',
    Withdrawn: 'bg-slate-400',
  };
  return dots[status] || 'bg-gray-400';
}

export function generateIEMHeader(doc) {
  doc.setFillColor(30, 58, 138);
  doc.rect(0, 0, 210, 35, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Institute of Engineering & Management', 105, 15, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Sector V, Salt Lake, Kolkata - 700091 | Phone: +91 33 2357 2995', 105, 23, { align: 'center' });
  doc.text('www.iem.edu.in | admissions@iem.edu.in', 105, 29, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  return 45;
}

export function downloadCSV(data, headers, filename) {
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(h => {
        const val = row[h] || '';
        return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
      }).join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function truncateText(text, maxLength = 30) {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

export function calculateTimeRemaining(deadline) {
  if (!deadline) return null;
  const now = new Date().getTime();
  const target = new Date(deadline).getTime();
  const diff = target - now;

  if (diff <= 0) return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 };

  return {
    expired: false,
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
  };
}
