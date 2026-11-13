import { jsPDF } from 'jspdf';
import {
  Consultation,
  DemoDocument,
  Doctor,
  Invoice,
  Patient,
  Payment,
  Visit,
  WorkspaceSettings,
} from '@/types/medora';
import { formatCurrency } from '@/lib/calculations/billing';

export const CLINICAL_SAMPLE_DISCLAIMER =
  'SAMPLE — NOT VALID FOR MEDICAL USE, PHARMACY DISPENSING, OR CLINICAL CARE';

function drawSampleWatermark(doc: jsPDF) {
  doc.saveGraphicsState();
  doc.setTextColor(220, 38, 38);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.rect(14, 10, 182, 9);
  doc.text(CLINICAL_SAMPLE_DISCLAIMER, 105, 16, { align: 'center' });
  doc.restoreGraphicsState();
}

export function generateSampleDocumentDataText(params: {
  document: DemoDocument;
  patient?: Patient;
  doctor?: Doctor;
  settings: WorkspaceSettings;
}): string {
  const { document, patient, doctor, settings } = params;
  return [
    CLINICAL_SAMPLE_DISCLAIMER,
    `Clinic: ${settings.clinicName}`,
    `Document Type: ${document.type}`,
    `Reference: ${document.referenceNumber}`,
    `Patient: ${patient?.fullName ?? document.patientId} (${document.patientId})`,
    `Clinician (Demo): ${doctor?.fullName ?? document.doctorId}`,
    `Visit Date: ${document.visitDate}`,
    ...document.sampleEntries.map(
      (e) => `- ${e.label}: ${e.instructionNote} [${e.durationLabel}]`
    ),
    `Notes: ${document.demoNotes}`,
    `Disclaimer: ${document.disclaimerText}`,
  ].join('\n');
}

export function downloadSampleDocumentPDF(params: {
  document: DemoDocument;
  patient?: Patient;
  doctor?: Doctor;
  settings: WorkspaceSettings;
}): string {
  const { document, patient, doctor, settings } = params;
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  pdf.setProperties({
    title: `${document.referenceNumber} - ${CLINICAL_SAMPLE_DISCLAIMER}`,
    subject: 'MEDORA Health Portfolio Demonstration Document',
    creator: 'MEDORA Health Demo',
  });

  drawSampleWatermark(pdf);

  // Header
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.setTextColor(23, 48, 66);
  pdf.text(settings.clinicName, 14, 30);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9.5);
  pdf.setTextColor(100, 116, 139);
  pdf.text(`${settings.workspaceBranch} · ${settings.address}`, 14, 36);
  pdf.text(`${settings.phone} · ${settings.email}`, 14, 41);

  pdf.setDrawColor(226, 234, 240);
  pdf.line(14, 46, 196, 46);

  // Document Metadata Box
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  pdf.setTextColor(8, 145, 178);
  pdf.text(
    `${document.type.toUpperCase()} (PORTFOLIO DEMO)`,
    14,
    55
  );

  pdf.setFontSize(10);
  pdf.setTextColor(23, 48, 66);
  pdf.text(`Reference: ${document.referenceNumber}`, 14, 63);
  pdf.text(`Visit Date: ${document.visitDate}`, 120, 63);

  pdf.text(
    `Fictional Patient: ${patient?.fullName ?? 'Demo Patient'} (${document.patientId})`,
    14,
    70
  );
  pdf.text(
    `Birth Year: ${patient?.birthYear ?? 'N/A'}`,
    120,
    70
  );

  pdf.text(
    `Demo Clinician: ${doctor?.fullName ?? 'Demo Clinician'} (${doctor?.specialty ?? 'General'})`,
    14,
    77
  );

  pdf.line(14, 83, 196, 83);

  // Entries
  let y = 93;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.text('Non-Actionable Demonstration Entries', 14, y);
  y += 8;

  for (const item of document.sampleEntries) {
    if (y > 240) {
      pdf.addPage();
      drawSampleWatermark(pdf);
      y = 30;
    }
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(23, 48, 66);
    pdf.text(`• ${item.label}  [${item.durationLabel}]`, 16, y);
    y += 5.5;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9.5);
    pdf.setTextColor(71, 85, 105);
    const wrapped = pdf.splitTextToSize(item.instructionNote, 174);
    pdf.text(wrapped, 20, y);
    y += wrapped.length * 5 + 4;
  }

  y += 4;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10.5);
  pdf.setTextColor(23, 48, 66);
  pdf.text('Administrative Demonstration Notes:', 14, y);
  y += 6;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9.5);
  const wrappedNotes = pdf.splitTextToSize(document.demoNotes, 180);
  pdf.text(wrappedNotes, 14, y);
  y += wrappedNotes.length * 5 + 12;

  // Non-signature verification block
  pdf.setDrawColor(203, 213, 225);
  pdf.rect(14, y, 182, 22);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9.5);
  pdf.setTextColor(185, 28, 28);
  pdf.text(
    'NO CLINICIAN SIGNATURE — SIMULATED PORTFOLIO RECORD ONLY',
    20,
    y + 8
  );
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.setTextColor(100, 116, 139);
  pdf.text(
    'This document was generated in the MEDORA Health browser-local demonstration. It is not a medical order or prescription.',
    20,
    y + 15
  );

  // Footer
  pdf.setFontSize(8.5);
  pdf.setTextColor(185, 28, 28);
  pdf.text(CLINICAL_SAMPLE_DISCLAIMER, 105, 285, { align: 'center' });

  const filename = `${document.referenceNumber.toLowerCase()}.pdf`;
  pdf.save(filename);
  return generateSampleDocumentDataText(params);
}

export function downloadVisitSummaryPDF(params: {
  visit: Visit;
  consultation?: Consultation;
  patient?: Patient;
  doctor?: Doctor;
  serviceName: string;
  settings: WorkspaceSettings;
}): string {
  const { visit, consultation, patient, doctor, serviceName, settings } = params;
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  drawSampleWatermark(pdf);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.setTextColor(23, 48, 66);
  pdf.text(settings.clinicName, 14, 30);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9.5);
  pdf.setTextColor(100, 116, 139);
  pdf.text(`OUTPATIENT VISIT SUMMARY (DEMO) · Visit ID: ${visit.id}`, 14, 37);

  pdf.line(14, 42, 196, 42);

  pdf.setFontSize(10);
  pdf.setTextColor(23, 48, 66);
  pdf.text(`Patient: ${patient?.fullName ?? visit.patientId} (${visit.patientId})`, 14, 52);
  pdf.text(`Visit Date: ${visit.visitDate}`, 130, 52);
  pdf.text(`Clinician (Demo): ${doctor?.fullName ?? visit.doctorId}`, 14, 59);
  pdf.text(`Service: ${serviceName}`, 14, 66);

  let y = 78;
  const sections = [
    {
      heading: 'Reason for Visit (Fictional)',
      body: consultation?.reasonForVisit ?? visit.summaryTitle,
    },
    {
      heading: 'Demonstration Observations',
      body:
        consultation?.demoObservations ??
        'Routine outpatient demonstration visit recorded in browser-local storage.',
    },
    {
      heading: 'Simulated Assessment Note (Non-Actionable)',
      body:
        consultation?.sampleAssessmentText ??
        'Non-clinical demonstration record only.',
    },
    {
      heading: 'Administrative Follow-Up',
      body:
        consultation?.administrativeFollowUp ??
        'Standard administrative follow-up.',
    },
  ];

  for (const sec of sections) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10.5);
    pdf.setTextColor(8, 145, 178);
    pdf.text(sec.heading, 14, y);
    y += 6;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9.5);
    pdf.setTextColor(51, 65, 85);
    const lines = pdf.splitTextToSize(sec.body, 180);
    pdf.text(lines, 14, y);
    y += lines.length * 5 + 7;
  }

  pdf.setFontSize(8.5);
  pdf.setTextColor(185, 28, 28);
  pdf.text(CLINICAL_SAMPLE_DISCLAIMER, 105, 285, { align: 'center' });

  pdf.save(`visit-summary-${visit.id.toLowerCase()}.pdf`);
  return `${CLINICAL_SAMPLE_DISCLAIMER}\nVisit: ${visit.id}\nPatient: ${patient?.fullName ?? visit.patientId}`;
}

export function generateInvoicePDFTextSummary(params: {
  invoice: Invoice;
  patient?: Patient;
  payments: Payment[];
  settings: WorkspaceSettings;
}): string {
  const { invoice, patient, settings } = params;
  return [
    `INVOICE ${invoice.invoiceNumber} (DEMO BILLING RECORD)`,
    `Clinic: ${settings.clinicName}`,
    `Patient: ${patient?.fullName ?? invoice.patientId} (${invoice.patientId})`,
    `Status: ${invoice.status}`,
    `Subtotal: ${formatCurrency(invoice.subtotal, settings.currency)}`,
    `Discount: ${formatCurrency(invoice.discountTotal, settings.currency)}`,
    `Tax: ${formatCurrency(invoice.taxAmount, settings.currency)}`,
    `Total: ${formatCurrency(invoice.totalAmount, settings.currency)}`,
    `Paid: ${formatCurrency(invoice.amountPaid, settings.currency)}`,
    `Balance: ${formatCurrency(invoice.outstandingBalance, settings.currency)}`,
  ].join('\n');
}

export function downloadInvoicePDF(params: {
  invoice: Invoice;
  patient?: Patient;
  payments: Payment[];
  settings: WorkspaceSettings;
}): string {
  const { invoice, patient, payments, settings } = params;
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  pdf.setProperties({
    title: `Invoice ${invoice.invoiceNumber}`,
    subject: 'MEDORA Health Simulated Billing Statement',
    creator: 'MEDORA Health Demo',
  });

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(17);
  pdf.setTextColor(23, 48, 66);
  pdf.text(settings.clinicName, 14, 22);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9.5);
  pdf.setTextColor(100, 116, 139);
  pdf.text(settings.address, 14, 28);
  pdf.text(`${settings.phone} · ${settings.email}`, 14, 33);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(8, 145, 178);
  pdf.text(`INVOICE #${invoice.invoiceNumber}`, 196, 22, { align: 'right' });

  pdf.setFontSize(10);
  pdf.setTextColor(23, 48, 66);
  pdf.text(`Status: ${invoice.status.toUpperCase()}`, 196, 29, { align: 'right' });
  pdf.text(`Issue Date: ${invoice.issueDate} · Due: ${invoice.dueDate}`, 196, 35, {
    align: 'right',
  });

  pdf.setDrawColor(226, 234, 240);
  pdf.line(14, 41, 196, 41);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text('Bill To (Fictional Patient):', 14, 50);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`${patient?.fullName ?? invoice.patientId} (${invoice.patientId})`, 14, 56);
  if (patient?.address) {
    pdf.text(patient.address, 14, 61);
  }

  // Table header
  let y = 73;
  pdf.setFillColor(241, 245, 249);
  pdf.rect(14, y - 5, 182, 8, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9.5);
  pdf.text('Description', 17, y);
  pdf.text('Qty', 120, y, { align: 'right' });
  pdf.text('Unit Price', 148, y, { align: 'right' });
  pdf.text('Discount', 170, y, { align: 'right' });
  pdf.text('Line Total', 193, y, { align: 'right' });
  y += 9;

  pdf.setFont('helvetica', 'normal');
  for (const line of invoice.lines) {
    const net = Math.max(0, line.quantity * line.unitPrice - line.discountAmount);
    pdf.text(line.description.slice(0, 52), 17, y);
    pdf.text(String(line.quantity), 120, y, { align: 'right' });
    pdf.text(formatCurrency(line.unitPrice, settings.currency), 148, y, {
      align: 'right',
    });
    pdf.text(formatCurrency(line.discountAmount, settings.currency), 170, y, {
      align: 'right',
    });
    pdf.text(formatCurrency(net, settings.currency), 193, y, {
      align: 'right',
    });
    y += 7;
  }

  pdf.line(14, y, 196, y);
  y += 8;

  // Totals
  const totals = [
    ['Subtotal:', formatCurrency(invoice.subtotal, settings.currency)],
    ['Discounts:', `-${formatCurrency(invoice.discountTotal, settings.currency)}`],
    [`Tax (${invoice.taxRatePercent}%):`, formatCurrency(invoice.taxAmount, settings.currency)],
    ['Total Amount:', formatCurrency(invoice.totalAmount, settings.currency)],
    ['Amount Paid:', formatCurrency(invoice.amountPaid, settings.currency)],
    ['Outstanding Balance:', formatCurrency(invoice.outstandingBalance, settings.currency)],
  ];

  for (const [label, val] of totals) {
    const isBold = label === 'Total Amount:' || label === 'Outstanding Balance:';
    pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
    pdf.text(label, 145, y, { align: 'right' });
    pdf.text(val, 193, y, { align: 'right' });
    y += 6.5;
  }

  // Payments list
  const validPayments = payments.filter((p) => !p.isReversed);
  if (validPayments.length > 0) {
    y += 8;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Simulated Payment Receipts:', 14, y);
    y += 6;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    for (const p of validPayments) {
      pdf.text(
        `• ${p.paymentDate} — ${p.paymentReference} (${p.method}): ${formatCurrency(p.amount, settings.currency)}`,
        16,
        y
      );
      y += 5.5;
    }
  }

  pdf.setFontSize(8.5);
  pdf.setTextColor(100, 116, 139);
  pdf.text(
    'SIMULATED BILLING STATEMENT — PORTFOLIO DEMONSTRATION ONLY. NO REAL FINANCIAL TRANSACTION.',
    105,
    285,
    { align: 'center' }
  );

  pdf.save(`${invoice.invoiceNumber.toLowerCase()}.pdf`);
  return generateInvoicePDFTextSummary(params);
}
