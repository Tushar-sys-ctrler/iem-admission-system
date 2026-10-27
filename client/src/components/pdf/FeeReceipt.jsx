import jsPDF from 'jspdf';
import { generateIEMHeader, formatDate, formatCurrency } from '../../utils/helpers';

export function generateFeeReceipt(data) {
  const doc = new jsPDF();
  let y = generateIEMHeader(doc);

  // Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('FEE RECEIPT', 105, y, { align: 'center' });
  y += 8;
  doc.setDrawColor(30, 58, 138);
  doc.setLineWidth(0.5);
  doc.line(60, y, 150, y);
  y += 12;

  // Receipt info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Receipt No: ${data.receiptNumber || 'N/A'}`, 20, y);
  doc.text(`Date: ${formatDate(data.date || new Date())}`, 150, y);
  y += 15;

  // Student info
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Student Information', 20, y);
  y += 8;

  doc.setFontSize(10);
  const studentInfo = [
    ['Student Name', data.studentName || 'N/A'],
    ['Application ID', data.applicationId || 'N/A'],
    ['Email', data.email || 'N/A'],
  ];

  studentInfo.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, 25, y);
    doc.setFont('helvetica', 'normal');
    doc.text(String(value), 80, y);
    y += 7;
  });

  y += 10;

  // Payment details
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Payment Details', 20, y);
  y += 8;

  // Table
  doc.setFillColor(30, 58, 138);
  doc.setTextColor(255, 255, 255);
  doc.rect(20, y, 170, 8, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Description', 25, y + 5.5);
  doc.text('Amount', 155, y + 5.5);
  y += 8;

  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.setFillColor(248, 250, 252);
  doc.rect(20, y, 170, 8, 'F');
  doc.text(data.feeType || 'Fee Payment', 25, y + 5.5);
  doc.text(formatCurrency(data.amount || 0), 155, y + 5.5);
  y += 8;

  doc.setDrawColor(30, 58, 138);
  doc.setLineWidth(0.5);
  doc.line(20, y, 190, y);
  y += 1;
  doc.setFillColor(30, 58, 138);
  doc.setTextColor(255, 255, 255);
  doc.rect(20, y, 170, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('Total Paid', 25, y + 5.5);
  doc.text(formatCurrency(data.amount || 0), 155, y + 5.5);
  y += 15;

  doc.setTextColor(0, 0, 0);

  // Payment method
  const paymentDetails = [
    ['Payment Method', data.method || 'Online'],
    ['Transaction Date', formatDate(data.date || new Date())],
    ['Transaction ID', data.transactionId || data.receiptNumber || 'N/A'],
    ['Status', 'Paid'],
  ];

  paymentDetails.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, 25, y);
    doc.setFont('helvetica', 'normal');
    doc.text(String(value), 80, y);
    y += 7;
  });

  // Footer note
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text('This is a computer-generated receipt and does not require a physical signature.', 105, 275, { align: 'center' });
  doc.text('For any queries, contact: admissions@iem.edu.in | +91 33 2357 2995', 105, 281, { align: 'center' });

  doc.save(`IEM_Fee_Receipt_${data.receiptNumber || 'receipt'}.pdf`);
}
