import jsPDF from 'jspdf';
import { generateIEMHeader, formatDate, formatCurrency } from '../../utils/helpers';

export function generateAdmissionLetter(data) {
  const doc = new jsPDF();
  let y = generateIEMHeader(doc);

  // Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('ADMISSION CONFIRMATION LETTER', 105, y, { align: 'center' });
  y += 8;
  doc.setDrawColor(30, 58, 138);
  doc.setLineWidth(0.5);
  doc.line(40, y, 170, y);
  y += 12;

  // Reference info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${formatDate(new Date())}`, 150, y);
  doc.text(`Ref: IEM/ADM/${new Date().getFullYear()}/${data.applicationId || 'N/A'}`, 20, y);
  y += 15;

  // Student details
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Student Details', 20, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const details = [
    ['Student Name', data.name || 'N/A'],
    ['Application ID', data.applicationId || 'N/A'],
    ['Allotted Course', data.course || 'N/A'],
    ['Section', data.section || 'To be assigned'],
    ['Roll Number', data.rollNumber || 'To be assigned'],
    ['Category', data.category || 'N/A'],
    ['Academic Year', `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`],
  ];

  details.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, 25, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 80, y);
    y += 7;
  });

  y += 10;

  // Congratulations text
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const congratsText = `Dear ${data.name || 'Student'},\n\nCongratulations! We are pleased to inform you that you have been admitted to the ${data.course || 'selected program'} at the Institute of Engineering & Management (IEM), Kolkata for the academic year ${new Date().getFullYear()}-${new Date().getFullYear() + 1}.\n\nYour enrollment has been confirmed upon receipt of the enrollment fee. Please ensure you complete all formalities as per the academic calendar.\n\nWe look forward to welcoming you to the IEM family.`;

  const lines = doc.splitTextToSize(congratsText, 170);
  doc.text(lines, 20, y);
  y += lines.length * 5 + 15;

  // Fee receipt
  if (data.receiptNumber) {
    doc.setFont('helvetica', 'bold');
    doc.text(`Fee Receipt Number: ${data.receiptNumber}`, 20, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.text(`Amount Paid: ${formatCurrency(data.amountPaid || 0)}`, 20, y);
    y += 15;
  }

  // Signatures
  y = Math.max(y, 230);
  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.line(20, y, 70, y);
  doc.line(130, y, 180, y);
  y += 5;
  doc.setFontSize(9);
  doc.text('Student Signature', 25, y);
  doc.text('Dean of Admissions', 135, y);
  y += 5;
  doc.text('', 25, y);
  doc.text('IEM, Kolkata', 145, y);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text('This is a computer-generated document. No physical signature is required.', 105, 285, { align: 'center' });

  doc.save(`IEM_Admission_Letter_${data.applicationId || 'draft'}.pdf`);
}
