import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import api from '../../utils/api';
import { useToast } from '../../components/common/Toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import { generateIEMHeader, downloadCSV, formatCurrency, formatDate } from '../../utils/helpers';
import { BarChart3, Download, FileSpreadsheet, FileText, Filter, RefreshCw } from 'lucide-react';

export default function Reports() {
  const [reportType, setReportType] = useState('applications');
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const toast = useToast();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get('/courses');
        if (res.data.success) {
          setCourses(res.data.data || []);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchCourses();
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCourse) params.append('course', selectedCourse);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);

      let endpoint = '/reports/applications';
      if (reportType === 'seats') endpoint = '/reports/seats';
      if (reportType === 'revenue') endpoint = '/reports/revenue';

      const res = await api.get(`${endpoint}?${params.toString()}`);
      if (res.data.success) {
        if (reportType === 'applications') {
          setData(res.data.data?.report || []);
        } else if (reportType === 'seats') {
          setData(res.data.data || []);
        } else if (reportType === 'revenue') {
          setData(res.data.data?.recentTransactions || []);
        }
      }
    } catch (err) {
      toast.error('Failed to generate report dataset.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [reportType, selectedCourse]);

  // CSV Export
  const handleExportCSV = () => {
    if (!data || data.length === 0) {
      toast.warning('No data available to export.');
      return;
    }

    if (reportType === 'applications') {
      const headers = ['applicationId', 'applicantName', 'email', 'status', 'pcmPercentage', 'allottedCourse', 'rollNumber'];
      downloadCSV(data, headers, `IEM_Applications_Report_${Date.now()}.csv`);
    } else if (reportType === 'seats') {
      const headers = ['courseName', 'courseCode', 'totalSeats', 'filledSeats', 'availableSeats', 'occupancyRate'];
      downloadCSV(data, headers, `IEM_Seats_Report_${Date.now()}.csv`);
    } else if (reportType === 'revenue') {
      const headers = ['receiptNumber', 'type', 'amount', 'method', 'status', 'transactionDate'];
      downloadCSV(data, headers, `IEM_Revenue_Report_${Date.now()}.csv`);
    }
    toast.success('CSV Report downloaded successfully.');
  };

  // PDF Export using jsPDF and autoTable (FR-20)
  const handleExportPDF = () => {
    if (!data || data.length === 0) {
      toast.warning('No data available to export.');
      return;
    }

    const doc = new jsPDF();
    const startY = generateIEMHeader(doc);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    const titleMap = {
      applications: 'OFFICIAL APPLICATIONS & ADMISSION STATUS REPORT',
      seats: 'SEATS CAPACITY & OCCUPANCY RATIO REPORT',
      revenue: 'ADMISSION FEE COLLECTIONS & REVENUE REPORT',
    };
    doc.text(titleMap[reportType], 14, startY + 6);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 14, startY + 12);

    if (reportType === 'applications') {
      const tableHead = [['App ID', 'Candidate', 'Status', 'PCM %', 'Allotted Program', 'Roll No']];
      const tableBody = data.map((d) => [
        d.applicationId,
        d.applicantName,
        d.status,
        `${d.pcmPercentage}%`,
        d.allottedCourse || '—',
        d.rollNumber || '—',
      ]);
      doc.autoTable({
        startY: startY + 16,
        head: tableHead,
        body: tableBody,
        theme: 'striped',
        headStyles: { fillColor: [30, 58, 138] },
        styles: { fontSize: 8 },
      });
    } else if (reportType === 'seats') {
      const tableHead = [['Course Name', 'Code', 'Total Seats', 'Filled', 'Available', 'Fill Rate %']];
      const tableBody = data.map((d) => [
        d.courseName,
        d.courseCode,
        d.totalSeats,
        d.filledSeats,
        d.availableSeats,
        `${d.occupancyRate}%`,
      ]);
      doc.autoTable({
        startY: startY + 16,
        head: tableHead,
        body: tableBody,
        theme: 'striped',
        headStyles: { fillColor: [30, 58, 138] },
        styles: { fontSize: 8 },
      });
    } else if (reportType === 'revenue') {
      const tableHead = [['Receipt No', 'Type', 'Amount', 'Method', 'Status', 'Date']];
      const tableBody = data.map((d) => [
        d.receiptNumber,
        (d.type || '').toUpperCase(),
        formatCurrency(d.amount),
        d.method,
        d.status,
        formatDate(d.transactionDate),
      ]);
      doc.autoTable({
        startY: startY + 16,
        head: tableHead,
        body: tableBody,
        theme: 'striped',
        headStyles: { fillColor: [30, 58, 138] },
        styles: { fontSize: 8 },
      });
    }

    doc.save(`IEM_${reportType.toUpperCase()}_REPORT_${Date.now()}.pdf`);
    toast.success('Official PDF Report downloaded.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-iem-blue-800" />
            University Reports & Audit Exports (FR-20)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Filter and generate official accreditation CSV and PDF reports
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export CSV
          </button>
          <button
            type="button"
            onClick={handleExportPDF}
            className="px-4 py-2 rounded-lg bg-iem-blue-800 hover:bg-iem-blue-900 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
          >
            <FileText className="w-4 h-4" /> Export PDF
          </button>
        </div>
      </div>

      {/* Report Type Selector Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-2xl px-6 pt-3 gap-6 text-xs font-semibold">
        {[
          { id: 'applications', label: 'Applications Received' },
          { id: 'seats', label: 'Seats Filled & Capacity' },
          { id: 'revenue', label: 'Revenue & Fees Collected' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setReportType(tab.id)}
            className={`pb-3 border-b-2 transition-all ${
              reportType === tab.id
                ? 'border-iem-blue-800 text-iem-blue-800 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-b-2xl p-5 border border-t-0 border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-slate-500 mb-1">Filter by Degree Program</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg"
            >
              <option value="">All Programs</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-500 mb-1">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg text-slate-700"
            />
          </div>

          <div>
            <label className="block text-slate-500 mb-1">To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg text-slate-700"
            />
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={fetchReportData}
              className="w-full p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Report Preview Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center text-xs">
          <span className="font-bold text-slate-800 uppercase tracking-wider">
            Live Preview ({data.length} records)
          </span>
          <span className="text-slate-400">PDF and CSV exports include this dataset</span>
        </div>

        {loading ? (
          <div className="py-12">
            <LoadingSpinner message="Generating report table..." />
          </div>
        ) : data.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No report data found for this selection.
          </div>
        ) : (
          <div className="overflow-x-auto">
            {reportType === 'applications' && (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">App ID</th>
                    <th className="py-2.5 px-3">Candidate</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">PCM %</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Allotted Course</th>
                    <th className="py-2.5 px-3">Roll Number</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3 font-mono font-bold text-iem-blue-900">{row.applicationId}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{row.applicantName}</td>
                      <td className="py-2.5 px-3 text-slate-500">{row.category}</td>
                      <td className="py-2.5 px-3 font-mono">{row.pcmPercentage}%</td>
                      <td className="py-2.5 px-3">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">{row.allottedCourse}</td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-800">{row.rollNumber}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {reportType === 'seats' && (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Course Name</th>
                    <th className="py-2.5 px-3">Code</th>
                    <th className="py-2.5 px-3">Total Quota</th>
                    <th className="py-2.5 px-3">Enrolled</th>
                    <th className="py-2.5 px-3">Available</th>
                    <th className="py-2.5 px-3">Occupancy %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3 font-bold text-slate-800">{row.courseName}</td>
                      <td className="py-2.5 px-3 font-mono">{row.courseCode}</td>
                      <td className="py-2.5 px-3 font-mono">{row.totalSeats}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-600">{row.filledSeats}</td>
                      <td className="py-2.5 px-3 font-mono text-amber-600">{row.availableSeats}</td>
                      <td className="py-2.5 px-3 font-mono font-bold">{row.occupancyRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {reportType === 'revenue' && (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Receipt No</th>
                    <th className="py-2.5 px-3">Fee Type</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Method</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Transaction Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{row.receiptNumber}</td>
                      <td className="py-2.5 px-3 uppercase text-slate-600">{row.type}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{formatCurrency(row.amount)}</td>
                      <td className="py-2.5 px-3 text-slate-500">{row.method}</td>
                      <td className="py-2.5 px-3">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">{formatDate(row.transactionDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
