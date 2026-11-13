'use client';

import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Download, Printer, BookmarkPlus, Trash2 } from 'lucide-react';
import { useMedoraStore } from '@/stores/useMedoraStore';
import { SavedReportConfig } from '@/types/medora';
import { downloadCSVFile } from '@/lib/export/csv';
import { formatCurrency } from '@/lib/calculations/billing';
import { DEMO_TODAY } from '@/lib/seed/generator';

const REPORT_TYPES: Array<{
  id: SavedReportConfig['reportType'];
  label: string;
}> = [
  { id: 'appointments', label: 'Appointment Report' },
  { id: 'doctor_schedule', label: 'Doctor Schedule Report' },
  { id: 'operations', label: 'Clinic Operations Report' },
  { id: 'service_usage', label: 'Service Usage Report' },
  { id: 'no_show', label: 'No-show Report' },
  { id: 'billing_summary', label: 'Billing Summary' },
  { id: 'payment_report', label: 'Payment Report' },
  { id: 'patient_registration', label: 'Patient Registration Summary' },
];

export default function ReportingCenterPage() {
  const {
    dataset,
    settings,
    saveReportConfig,
    deleteReportConfig,
  } = useMedoraStore();

  const [reportType, setReportType] =
    useState<SavedReportConfig['reportType']>('appointments');
  const [dateFrom, setDateFrom] = useState('2026-09-01');
  const [dateTo, setDateTo] = useState('2026-11-30');
  const [doctorFilter, setDoctorFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [configName, setConfigName] = useState('');

  const patientMap = useMemo(
    () => new Map(dataset.patients.map((p) => [p.id, p])),
    [dataset.patients]
  );
  const doctorMap = useMemo(
    () => new Map(dataset.doctors.map((d) => [d.id, d])),
    [dataset.doctors]
  );
  const serviceMap = useMemo(
    () => new Map(dataset.services.map((s) => [s.id, s])),
    [dataset.services]
  );

  // Build tabular administrative rows based on selected reportType
  const reportTable = useMemo(() => {
    if (
      reportType === 'appointments' ||
      reportType === 'doctor_schedule' ||
      reportType === 'no_show' ||
      reportType === 'operations'
    ) {
      const rows = dataset.appointments
        .filter((a) => {
          if (a.date < dateFrom || a.date > dateTo) return false;
          if (doctorFilter !== 'all' && a.doctorId !== doctorFilter)
            return false;
          if (serviceFilter !== 'all' && a.serviceId !== serviceFilter)
            return false;
          if (reportType === 'no_show' && a.status !== 'No-show') return false;
          return true;
        })
        .slice(0, 60)
        .map((a) => [
          a.id,
          a.date,
          `${a.startTime}–${a.endTime}`,
          patientMap.get(a.patientId)?.fullName ?? a.patientId,
          doctorMap.get(a.doctorId)?.fullName ?? a.doctorId,
          serviceMap.get(a.serviceId)?.name ?? a.serviceId,
          a.status,
        ]);

      return {
        headers: [
          'Appointment ID',
          'Date',
          'Time Window',
          'Patient (Demo)',
          'Doctor',
          'Service',
          'Status',
        ],
        rows,
      };
    }

    if (reportType === 'service_usage') {
      const rows = dataset.services.map((srv) => {
        const count = dataset.appointments.filter(
          (a) =>
            a.serviceId === srv.id && a.date >= dateFrom && a.date <= dateTo
        ).length;
        return [
          srv.code,
          srv.name,
          srv.category,
          `${srv.durationMinutes}m`,
          formatCurrency(srv.price, settings.currency),
          String(count),
        ];
      });
      return {
        headers: [
          'Service Code',
          'Service Name',
          'Category',
          'Duration',
          'Standard Fee',
          'Bookings in Period',
        ],
        rows,
      };
    }

    if (reportType === 'billing_summary') {
      const rows = dataset.invoices
        .filter((i) => i.issueDate >= dateFrom && i.issueDate <= dateTo)
        .slice(0, 60)
        .map((i) => [
          i.invoiceNumber,
          i.issueDate,
          patientMap.get(i.patientId)?.fullName ?? i.patientId,
          formatCurrency(i.totalAmount, settings.currency),
          formatCurrency(i.amountPaid, settings.currency),
          formatCurrency(i.outstandingBalance, settings.currency),
          i.status,
        ]);
      return {
        headers: [
          'Invoice #',
          'Issue Date',
          'Patient',
          'Total Amount',
          'Amount Paid',
          'Outstanding',
          'Status',
        ],
        rows,
      };
    }

    if (reportType === 'payment_report') {
      const rows = dataset.payments
        .filter((p) => p.paymentDate >= dateFrom && p.paymentDate <= dateTo)
        .slice(0, 60)
        .map((p) => [
          p.paymentReference,
          p.paymentDate,
          patientMap.get(p.patientId)?.fullName ?? p.patientId,
          p.method,
          formatCurrency(p.amount, settings.currency),
          p.isReversed ? 'Reversed' : 'Posted',
        ]);
      return {
        headers: [
          'Payment Ref',
          'Date',
          'Patient',
          'Method',
          'Amount',
          'Status',
        ],
        rows,
      };
    }

    // patient_registration
    const rows = dataset.patients
      .filter((p) => p.registrationDate >= dateFrom && p.registrationDate <= dateTo)
      .slice(0, 60)
      .map((p) => [
        p.id,
        p.fullName,
        String(p.birthYear),
        p.gender,
        p.registrationDate,
        p.status,
      ]);
    return {
      headers: [
        'Patient ID',
        'Fictional Name',
        'Birth Year',
        'Gender',
        'Registration Date',
        'Status',
      ],
      rows,
    };
  }, [
    reportType,
    dataset,
    dateFrom,
    dateTo,
    doctorFilter,
    serviceFilter,
    patientMap,
    doctorMap,
    serviceMap,
    settings.currency,
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#173042] dark:text-white">
            Administrative Reporting Center
          </h1>
          <p className="text-xs text-[#64748B] dark:text-[#9BB0BE] mt-0.5">
            Generate, filter, save, print, and export administrative outpatient reports (excludes sensitive clinical notes by default)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E2EAF0] dark:border-[#304B5B] bg-white dark:bg-[#172B39] text-xs font-medium"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
          <button
            onClick={() => {
              downloadCSVFile(
                `medora-${reportType}-${DEMO_TODAY}.csv`,
                reportTable.headers,
                reportTable.rows
              );
              toast.success('Exported report to CSV.');
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0891B2] hover:bg-cyan-700 text-white text-xs font-semibold"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Saved Report Configurations */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#172B39] border border-[#E2EAF0] dark:border-[#304B5B] space-y-3 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-semibold">
            Saved Report Presets ({dataset.savedReports.length})
          </span>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={configName}
              onChange={(e) => setConfigName(e.target.value)}
              placeholder="Name current filter preset..."
              className="px-2.5 py-1 rounded border border-slate-200 dark:border-[#304B5B] bg-slate-50 dark:bg-[#11202D]"
            />
            <button
              onClick={() => {
                if (!configName.trim()) {
                  toast.error('Enter a preset name first.');
                  return;
                }
                saveReportConfig({
                  name: configName.trim(),
                  reportType,
                  dateFrom,
                  dateTo,
                  doctorId: doctorFilter !== 'all' ? doctorFilter : undefined,
                  serviceId:
                    serviceFilter !== 'all' ? serviceFilter : undefined,
                });
                setConfigName('');
                toast.success('Saved report configuration.');
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#0891B2] text-white font-medium"
            >
              <BookmarkPlus className="w-3.5 h-3.5" />
              <span>Save Preset</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {dataset.savedReports.map((rep) => (
            <div
              key={rep.id}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-slate-50 dark:bg-[#11202D]"
            >
              <button
                onClick={() => {
                  setReportType(rep.reportType);
                  setDateFrom(rep.dateFrom);
                  setDateTo(rep.dateTo);
                  setDoctorFilter(rep.doctorId || 'all');
                  setServiceFilter(rep.serviceId || 'all');
                  toast.info(`Loaded preset "${rep.name}"`);
                }}
                className="font-medium hover:text-[#0891B2]"
              >
                {rep.name}
              </button>
              <button
                onClick={() => deleteReportConfig(rep.id)}
                className="text-slate-400 hover:text-rose-600"
                aria-label={`Delete preset ${rep.name}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Report Selector & Filters */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#172B39] border border-[#E2EAF0] dark:border-[#304B5B] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
        <select
          aria-label="Report type"
          value={reportType}
          onChange={(e) =>
            setReportType(e.target.value as SavedReportConfig['reportType'])
          }
          className="px-3 py-2 rounded-lg border border-[#E2EAF0] dark:border-[#304B5B] bg-white dark:bg-[#11202D] font-semibold"
        >
          {REPORT_TYPES.map((rt) => (
            <option key={rt.id} value={rt.id}>
              {rt.label}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="px-3 py-2 rounded-lg border border-[#E2EAF0] dark:border-[#304B5B] bg-white dark:bg-[#11202D] font-mono"
        />

        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="px-3 py-2 rounded-lg border border-[#E2EAF0] dark:border-[#304B5B] bg-white dark:bg-[#11202D] font-mono"
        />

        <select
          value={doctorFilter}
          onChange={(e) => setDoctorFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-[#E2EAF0] dark:border-[#304B5B] bg-white dark:bg-[#11202D]"
        >
          <option value="all">All Clinicians</option>
          {dataset.doctors.map((d) => (
            <option key={d.id} value={d.id}>
              {d.fullName}
            </option>
          ))}
        </select>

        <select
          value={serviceFilter}
          onChange={(e) => setServiceFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-[#E2EAF0] dark:border-[#304B5B] bg-white dark:bg-[#11202D]"
        >
          <option value="all">All Clinic Services</option>
          {dataset.services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Report Data Table */}
      <div className="rounded-xl bg-white dark:bg-[#172B39] border border-[#E2EAF0] dark:border-[#304B5B] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E2EAF0] dark:border-[#304B5B] bg-slate-50/70 dark:bg-[#11202D] text-[#64748B] dark:text-[#9BB0BE]">
                {reportTable.headers.map((h) => (
                  <th key={h} className="py-3 px-3.5 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#304B5B]">
              {reportTable.rows.map((row, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-slate-50/80 dark:hover:bg-[#203847]/60"
                >
                  {row.map((cell, cIdx) => (
                    <td
                      key={cIdx}
                      className="py-2.5 px-3.5 font-mono tabular-nums"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
              {reportTable.rows.length === 0 && (
                <tr>
                  <td
                    colSpan={reportTable.headers.length}
                    className="py-8 text-center text-slate-500"
                  >
                    No records match the selected report parameters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
