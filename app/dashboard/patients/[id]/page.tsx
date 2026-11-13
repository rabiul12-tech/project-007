'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Calendar,
  FileText,
  Receipt,
  Download,
  Plus,
  Clock,
  Stethoscope,
  Activity as ActivityIcon,
  ShieldAlert,
} from 'lucide-react';
import { useMedoraStore } from '@/stores/useMedoraStore';
import {
  AppointmentStatusBadge,
  InvoiceStatusBadge,
  PatientStatusBadge,
} from '@/components/ui/StatusBadge';
import { formatCurrency } from '@/lib/calculations/billing';
import {
  downloadInvoicePDF,
  downloadSampleDocumentPDF,
  downloadVisitSummaryPDF,
} from '@/lib/pdf/generator';
import { DEMO_TODAY } from '@/lib/seed/generator';

type ProfileTab =
  | 'overview'
  | 'appointments'
  | 'visits'
  | 'consultations'
  | 'documents'
  | 'billing'
  | 'activity';

export default function Patient360WorkspacePage() {
  const params = useParams<{ id: string }>();
  const patientId = decodeURIComponent(params.id || 'PAT-1001');

  const {
    dataset,
    settings,
    setQuickDialog,
    updatePatient,
    generateSampleDocument,
    recordPatientAccess,
  } = useMedoraStore();

  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');
  const [adminNotesDraft, setAdminNotesDraft] = useState<string | null>(null);

  const patient = useMemo(
    () =>
      dataset.patients.find((p) => p.id === patientId) || dataset.patients[0],
    [dataset.patients, patientId]
  );

  useEffect(() => {
    if (patient?.id) {
      recordPatientAccess(patient.id);
    }
  }, [patient?.id, recordPatientAccess]);

  const doctorMap = useMemo(
    () => new Map(dataset.doctors.map((d) => [d.id, d])),
    [dataset.doctors]
  );
  const serviceMap = useMemo(
    () => new Map(dataset.services.map((s) => [s.id, s])),
    [dataset.services]
  );

  const patientAppointments = useMemo(
    () =>
      dataset.appointments
        .filter((a) => a.patientId === patient.id)
        .sort((a, b) =>
          `${b.date} ${b.startTime}`.localeCompare(`${a.date} ${a.startTime}`)
        ),
    [dataset.appointments, patient.id]
  );

  const patientVisits = useMemo(
    () =>
      dataset.visits
        .filter((v) => v.patientId === patient.id)
        .sort((a, b) => b.visitDate.localeCompare(a.visitDate)),
    [dataset.visits, patient.id]
  );

  const patientConsultations = useMemo(
    () =>
      dataset.consultations
        .filter((c) => c.patientId === patient.id)
        .sort((a, b) => b.visitDate.localeCompare(a.visitDate)),
    [dataset.consultations, patient.id]
  );

  const patientDocuments = useMemo(
    () =>
      dataset.documents
        .filter((d) => d.patientId === patient.id)
        .sort((a, b) => b.visitDate.localeCompare(a.visitDate)),
    [dataset.documents, patient.id]
  );

  const patientInvoices = useMemo(
    () =>
      dataset.invoices
        .filter((i) => i.patientId === patient.id)
        .sort((a, b) => b.issueDate.localeCompare(a.issueDate)),
    [dataset.invoices, patient.id]
  );

  const patientPayments = useMemo(
    () =>
      dataset.payments
        .filter((p) => p.patientId === patient.id)
        .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate)),
    [dataset.payments, patient.id]
  );

  const patientActivities = useMemo(
    () =>
      dataset.activities.filter((act) => act.relatedPatientId === patient.id),
    [dataset.activities, patient.id]
  );

  const upcomingAppointment = useMemo(
    () =>
      patientAppointments.find(
        (a) =>
          a.date >= DEMO_TODAY &&
          a.status !== 'Cancelled' &&
          a.status !== 'No-show'
      ),
    [patientAppointments]
  );

  const totalOutstanding = useMemo(
    () =>
      patientInvoices.reduce((acc, inv) => acc + inv.outstandingBalance, 0),
    [patientInvoices]
  );

  const initials = patient.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const assignedDoctor = patient.preferredDoctorId
    ? doctorMap.get(patient.preferredDoctorId)
    : undefined;

  return (
    <div className="space-y-6">
      {/* Back navigation */}
      <div>
        <Link
          href="/dashboard/patients"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#64748B] dark:text-[#9BB0BE] hover:text-[#0891B2]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Patient Directory</span>
        </Link>
      </div>

      {/* Patient 360° Header */}
      <div className="p-6 rounded-xl bg-white dark:bg-[#172B39] border border-[#E2EAF0] dark:border-[#304B5B] flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#0891B2] text-white font-bold text-xl flex items-center justify-center shrink-0">
            {initials}
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-[#173042] dark:text-white">
                {patient.fullName}
              </h1>
              <span className="text-xs font-mono tabular-nums text-[#0891B2] dark:text-[#22D3EE]">
                {patient.id}
              </span>
              <PatientStatusBadge status={patient.status} />
            </div>
            <div className="text-xs text-[#64748B] dark:text-[#9BB0BE] flex flex-wrap items-center gap-2">
              <span>
                Born {patient.birthYear} ({2026 - patient.birthYear} yrs)
              </span>
              <span>·</span>
              <span>{patient.gender}</span>
              <span>·</span>
              <span>{patient.phone}</span>
              <span>·</span>
              <span>{patient.email}</span>
              <span>·</span>
              <span>Blood Group: {patient.bloodGroupLabel}</span>
            </div>
          </div>
        </div>

        {/* Header Quick Actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() =>
              setQuickDialog('book_appointment', { patientId: patient.id })
            }
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0891B2] hover:bg-cyan-700 text-white text-xs font-semibold whitespace-nowrap shrink-0"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Book Appointment</span>
          </button>
          <button
            onClick={() => setQuickDialog('create_invoice')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E2EAF0] dark:border-[#304B5B] bg-white dark:bg-[#11202D] text-xs font-medium whitespace-nowrap shrink-0"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Create Invoice</span>
          </button>
        </div>
      </div>

      {/* 7-Tab Navigation Bar */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-white dark:bg-[#172B39] border border-[#E2EAF0] dark:border-[#304B5B] overflow-x-auto">
        {(
          [
            { id: 'overview', label: 'Overview' },
            {
              id: 'appointments',
              label: `Appointments (${patientAppointments.length})`,
            },
            {
              id: 'visits',
              label: `Visit Timeline (${patientVisits.length})`,
            },
            {
              id: 'consultations',
              label: `Consultation Notes (${patientConsultations.length})`,
            },
            {
              id: 'documents',
              label: `Sample Documents (${patientDocuments.length})`,
            },
            {
              id: 'billing',
              label: `Billing (${patientInvoices.length})`,
            },
            {
              id: 'activity',
              label: `Activity (${patientActivities.length})`,
            },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              activeTab === tab.id
                ? 'bg-[#EAF8FB] text-[#0891B2] dark:bg-[#203847] dark:text-[#22D3EE]'
                : 'text-slate-600 dark:text-[#9BB0BE] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-white dark:bg-[#172B39] border border-[#E2EAF0] dark:border-[#304B5B]">
                <div className="text-xs text-slate-500">
                  Upcoming Appointment
                </div>
                <div className="text-sm font-bold font-mono tabular-nums mt-1.5">
                  {upcomingAppointment
                    ? `${upcomingAppointment.date} · ${upcomingAppointment.startTime}`
                    : 'None Scheduled'}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {upcomingAppointment
                    ? doctorMap.get(upcomingAppointment.doctorId)?.fullName
                    : 'Click Book Appointment above'}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-[#172B39] border border-[#E2EAF0] dark:border-[#304B5B]">
                <div className="text-xs text-slate-500">Last Completed Visit</div>
                <div className="text-sm font-bold font-mono tabular-nums mt-1.5">
                  {patient.lastVisitDate ?? 'No prior visit'}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {patientVisits.length} total visits on record
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-[#172B39] border border-[#E2EAF0] dark:border-[#304B5B]">
                <div className="text-xs text-slate-500">
                  Outstanding Billing Balance
                </div>
                <div className="text-sm font-bold font-mono tabular-nums mt-1.5">
                  {formatCurrency(totalOutstanding, settings.currency)}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Across {patientInvoices.length} patient invoices
                </div>
              </div>
            </div>

            {/* Recent Appointments Preview */}
            <div className="rounded-xl bg-white dark:bg-[#172B39] border border-[#E2EAF0] dark:border-[#304B5B] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">
                  Appointment History for {patient.fullName}
                </h2>
                <button
                  onClick={() => setActiveTab('appointments')}
                  className="text-xs text-[#0891B2] hover:underline"
                >
                  All Appointments →
                </button>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-[#304B5B] text-xs">
                {patientAppointments.slice(0, 5).map((apt) => (
                  <div
                    key={apt.id}
                    className="py-2.5 flex items-center justify-between gap-2"
                  >
                    <div>
                      <span className="font-mono tabular-nums font-semibold">
                        {apt.date} {apt.startTime}
                      </span>
                      <span className="mx-2 text-slate-400">·</span>
                      <span className="font-medium">
                        {serviceMap.get(apt.serviceId)?.name ?? apt.serviceId}
                      </span>
                      <div className="text-[11px] text-slate-500">
                        {doctorMap.get(apt.doctorId)?.fullName ?? apt.doctorId}
                      </div>
                    </div>
                    <AppointmentStatusBadge status={apt.status} />
                  </div>
                ))}
                {patientAppointments.length === 0 && (
                  <div className="py-6 text-center text-slate-500">
                    No appointments recorded for {patient.fullName} yet.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Assigned Doctor, Demo Alerts & Administrative Notes */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-4 rounded-xl bg-white dark:bg-[#172B39] border border-[#E2EAF0] dark:border-[#304B5B] space-y-3 text-xs">
              <h2 className="text-sm font-semibold">
                Patient Demographics &amp; Assigned Care
              </h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Preferred Clinician:</span>
                  <span className="font-medium">
                    {assignedDoctor?.fullName ?? 'General Outpatient Roster'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Emergency Contact:</span>
                  <span>{patient.emergencyContactName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Emergency Phone:</span>
                  <span className="font-mono">{patient.emergencyContactPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Address:</span>
                  <span className="text-right max-w-[200px]">
                    {patient.address}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-[#304B5B]">
                  <span className="text-slate-500 block mb-1">
                    Demo Sensitivity / Administrative Note:
                  </span>
                  <span className="font-medium text-amber-700 dark:text-amber-300">
                    {patient.allergyNote}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-[#172B39] border border-[#E2EAF0] dark:border-[#304B5B] space-y-3 text-xs">
              <h2 className="text-sm font-semibold">Administrative Notes</h2>
              <textarea
                rows={4}
                value={adminNotesDraft ?? patient.administrativeNotes}
                onChange={(e) => setAdminNotesDraft(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-slate-50 dark:bg-[#11202D]"
              />
              <button
                onClick={() => {
                  if (adminNotesDraft !== null) {
                    updatePatient(patient.id, {
                      administrativeNotes: adminNotesDraft,
                    });
                    toast.success('Saved administrative notes.');
                  }
                }}
                className="px-3.5 py-1.5 rounded-lg bg-[#0891B2] text-white font-medium"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: APPOINTMENTS */}
      {activeTab === 'appointments' && (
        <div className="rounded-xl bg-white dark:bg-[#172B39] border border-[#E2EAF0] dark:border-[#304B5B] p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">
              Appointments for {patient.fullName} ({patient.id})
            </h2>
            <button
              onClick={() =>
                setQuickDialog('book_appointment', { patientId: patient.id })
              }
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0891B2] text-white text-xs font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Book New Appointment</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E2EAF0] dark:border-[#304B5B] text-slate-500">
                  <th className="py-2.5 px-3">ID</th>
                  <th className="py-2.5 px-3">Date &amp; Time</th>
                  <th className="py-2.5 px-3">Clinician</th>
                  <th className="py-2.5 px-3">Service</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#304B5B]">
                {patientAppointments.map((apt) => (
                  <tr key={apt.id}>
                    <td className="py-2.5 px-3 font-mono font-semibold">
                      {apt.id}
                    </td>
                    <td className="py-2.5 px-3 font-mono tabular-nums">
                      {apt.date} · {apt.startTime}–{apt.endTime}
                    </td>
                    <td className="py-2.5 px-3">
                      {doctorMap.get(apt.doctorId)?.fullName ?? apt.doctorId}
                    </td>
                    <td className="py-2.5 px-3">
                      {serviceMap.get(apt.serviceId)?.name ?? apt.serviceId}
                    </td>
                    <td className="py-2.5 px-3">
                      <AppointmentStatusBadge status={apt.status} />
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {apt.status !== 'Completed' && (
                        <button
                          onClick={() =>
                            setQuickDialog('book_appointment', {
                              rescheduleAppointmentId: apt.id,
                            })
                          }
                          className="px-2.5 py-1 rounded border border-slate-200 dark:border-[#304B5B] hover:border-cyan-500"
                        >
                          Reschedule
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: VISIT TIMELINE */}
      {activeTab === 'visits' && (
        <div className="rounded-xl bg-white dark:bg-[#172B39] border border-[#E2EAF0] dark:border-[#304B5B] p-5 space-y-4">
          <h2 className="text-sm font-semibold">
            Outpatient Visit Timeline ({patientVisits.length})
          </h2>
          <div className="space-y-3">
            {patientVisits.map((v) => {
              const doc = doctorMap.get(v.doctorId);
              const srv = serviceMap.get(v.serviceId);
              const con = dataset.consultations.find(
                (c) => c.visitId === v.id
              );
              return (
                <div
                  key={v.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-[#304B5B] bg-slate-50/50 dark:bg-[#11202D] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#0891B2]">
                        {v.id}
                      </span>
                      <span className="font-mono tabular-nums text-slate-500">
                        {v.visitDate}
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {srv?.name ?? v.summaryTitle}
                      </span>
                    </div>
                    <div className="text-slate-600 dark:text-slate-300">
                      Clinician: {doc?.fullName ?? v.doctorId} · Status:{' '}
                      <strong>{v.status}</strong>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      downloadVisitSummaryPDF({
                        visit: v,
                        consultation: con,
                        patient,
                        doctor: doc,
                        serviceName: srv?.name ?? v.summaryTitle,
                        settings,
                      });
                      toast.success(`Downloaded Visit Summary PDF for ${v.id}`);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#172B39] font-medium shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Visit Summary PDF</span>
                  </button>
                </div>
              );
            })}
            {patientVisits.length === 0 && (
              <p className="text-xs text-slate-500 py-6 text-center">
                No completed visits recorded for this patient yet.
              </p>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: CONSULTATION NOTES */}
      {activeTab === 'consultations' && (
        <div className="rounded-xl bg-white dark:bg-[#172B39] border border-[#E2EAF0] dark:border-[#304B5B] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">
                Simulated Consultation Notes ({patientConsultations.length})
              </h2>
              <p className="text-xs text-slate-500">
                Fictional, non-actionable consultation entries for portfolio demonstration
              </p>
            </div>
            <Link
              href="/dashboard/consultations"
              className="text-xs text-[#0891B2] hover:underline"
            >
              Open Consultation Workspace →
            </Link>
          </div>

          <div className="space-y-3">
            {patientConsultations.map((con) => (
              <div
                key={con.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-[#304B5B] bg-slate-50/50 dark:bg-[#11202D] space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[#0891B2]">
                    {con.id} · Visit {con.visitId} ({con.visitDate})
                  </span>
                  <span className="font-medium">
                    {doctorMap.get(con.doctorId)?.fullName ?? con.doctorId}
                  </span>
                </div>
                <div>
                  <strong>Reason (Demo):</strong> {con.reasonForVisit}
                </div>
                <div>
                  <strong>Observations:</strong> {con.demoObservations}
                </div>
                <div>
                  <strong>Clinician Free-Text Note:</strong>{' '}
                  {con.clinicianFreeTextNotes}
                </div>
                <div className="text-slate-500">
                  <strong>Follow-Up:</strong> {con.administrativeFollowUp}
                </div>
              </div>
            ))}
            {patientConsultations.length === 0 && (
              <p className="text-xs text-slate-500 py-6 text-center">
                No consultation documentation recorded for this patient yet.
              </p>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: SAMPLE DOCUMENTS */}
      {activeTab === 'documents' && (
        <div className="rounded-xl bg-white dark:bg-[#172B39] border border-[#E2EAF0] dark:border-[#304B5B] p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold">
                Sample Visit &amp; Prescription Documents ({patientDocuments.length})
              </h2>
              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                SAMPLE — NOT VALID FOR MEDICAL USE OR PHARMACY DISPENSING
              </p>
            </div>
            {patientVisits[0] && (
              <button
                onClick={() => {
                  const docCreated = generateSampleDocument({
                    visitId: patientVisits[0].id,
                    type: 'Sample Prescription',
                    title: `Sample Wellness Sheet — ${patient.fullName}`,
                    sampleEntries: [
                      {
                        id: `ITEM-${Date.now()}`,
                        label: 'Fictional Hydration & Ergonomic Routine (Demo Item)',
                        instructionNote:
                          'Non-actionable portfolio demonstration item.',
                        durationLabel: '14 Days (Sample)',
                      },
                    ],
                    demoNotes:
                      'Generated from Patient 360° Workspace for demonstration.',
                  });
                  if (docCreated) {
                    toast.success(
                      `Generated sample document ${docCreated.referenceNumber}`
                    );
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0891B2] text-white text-xs font-medium"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Generate Sample Document</span>
              </button>
            )}
          </div>

          <div className="space-y-3">
            {patientDocuments.map((docItem) => {
              const docClinician = doctorMap.get(docItem.doctorId);
              return (
                <div
                  key={docItem.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-[#304B5B] bg-slate-50/50 dark:bg-[#11202D] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#0891B2]">
                        {docItem.referenceNumber}
                      </span>
                      <span className="font-semibold">{docItem.type}</span>
                      <span className="text-slate-400">·</span>
                      <span className="font-mono">{docItem.visitDate}</span>
                    </div>
                    <div className="text-slate-600 dark:text-slate-300">
                      {docItem.title} · Demo Clinician:{' '}
                      {docClinician?.fullName ?? docItem.doctorId}
                    </div>
                    <div className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                      {docItem.disclaimerText}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      downloadSampleDocumentPDF({
                        document: docItem,
                        patient,
                        doctor: docClinician,
                        settings,
                      });
                      toast.success(`Downloaded ${docItem.referenceNumber}.pdf`);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0891B2] text-white font-medium shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Sample PDF</span>
                  </button>
                </div>
              );
            })}
            {patientDocuments.length === 0 && (
              <p className="text-xs text-slate-500 py-6 text-center">
                No sample documents generated for this patient yet.
              </p>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: BILLING */}
      {activeTab === 'billing' && (
        <div className="rounded-xl bg-white dark:bg-[#172B39] border border-[#E2EAF0] dark:border-[#304B5B] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">
                Patient Invoices &amp; Simulated Payments
              </h2>
              <p className="text-xs text-slate-500">
                Outstanding Balance:{' '}
                <strong className="font-mono tabular-nums">
                  {formatCurrency(totalOutstanding, settings.currency)}
                </strong>
              </p>
            </div>
            <button
              onClick={() => setQuickDialog('create_invoice')}
              className="px-3 py-1.5 rounded-lg bg-[#0891B2] text-white text-xs font-medium"
            >
              + Create Invoice
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E2EAF0] dark:border-[#304B5B] text-slate-500">
                  <th className="py-2.5 px-3">Invoice #</th>
                  <th className="py-2.5 px-3">Issue Date</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                  <th className="py-2.5 px-3 text-right">Paid</th>
                  <th className="py-2.5 px-3 text-right">Balance</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#304B5B]">
                {patientInvoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="py-2.5 px-3 font-mono font-semibold">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-2.5 px-3 font-mono tabular-nums">
                      {inv.issueDate}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                      {formatCurrency(inv.totalAmount, settings.currency)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-emerald-600">
                      {formatCurrency(inv.amountPaid, settings.currency)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold">
                      {formatCurrency(inv.outstandingBalance, settings.currency)}
                    </td>
                    <td className="py-2.5 px-3">
                      <InvoiceStatusBadge status={inv.status} />
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => {
                          downloadInvoicePDF({
                            invoice: inv,
                            patient,
                            payments: patientPayments.filter(
                              (p) => p.invoiceId === inv.id
                            ),
                            settings,
                          });
                          toast.success(`Downloaded ${inv.invoiceNumber}.pdf`);
                        }}
                        className="px-2.5 py-1 rounded border border-slate-200 dark:border-[#304B5B] hover:border-cyan-500"
                      >
                        PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 7: ACTIVITY */}
      {activeTab === 'activity' && (
        <div className="rounded-xl bg-white dark:bg-[#172B39] border border-[#E2EAF0] dark:border-[#304B5B] p-5 space-y-3">
          <h2 className="text-sm font-semibold">
            Patient Administrative Activity Timeline ({patientActivities.length})
          </h2>
          <div className="divide-y divide-slate-100 dark:divide-[#304B5B] text-xs">
            {patientActivities.map((act) => (
              <div key={act.id} className="py-2.5 flex justify-between gap-4">
                <div>
                  <div className="font-medium text-slate-900 dark:text-white">
                    {act.title}
                  </div>
                  <div className="text-slate-500">{act.description}</div>
                </div>
                <div className="text-right font-mono tabular-nums text-slate-400 shrink-0">
                  <div>{act.actorName}</div>
                  <div>{act.timestamp.slice(0, 16).replace('T', ' ')}</div>
                </div>
              </div>
            ))}
            {patientActivities.length === 0 && (
              <p className="text-xs text-slate-500 py-6 text-center">
                No administrative activity recorded for this patient yet.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
