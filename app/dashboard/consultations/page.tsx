'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Stethoscope,
  CheckCircle2,
  FileText,
  Save,
  ShieldAlert,
  Play,
  ExternalLink,
} from 'lucide-react';
import { useMedoraStore } from '@/stores/useMedoraStore';
import { Consultation } from '@/types/medora';
import { downloadSampleDocumentPDF } from '@/lib/pdf/generator';

export default function ConsultationsWorkspacePage() {
  const {
    dataset,
    settings,
    updateConsultation,
    completeConsultationAndVisit,
    generateSampleDocument,
    transitionAppointmentStatus,
  } = useMedoraStore();

  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Completed'>('all');
  const [selectedId, setSelectedId] = useState<string>(
    dataset.consultations[0]?.id || ''
  );

  const patientMap = useMemo(
    () => new Map(dataset.patients.map((p) => [p.id, p])),
    [dataset.patients]
  );
  const doctorMap = useMemo(
    () => new Map(dataset.doctors.map((d) => [d.id, d])),
    [dataset.doctors]
  );

  // Also surface Today's Waiting/Checked-In appointments that can be started as a consultation
  const scheduledWaitingQueue = useMemo(
    () =>
      dataset.appointments.filter(
        (a) => a.status === 'Waiting' || a.status === 'Checked In'
      ),
    [dataset.appointments]
  );

  const filteredConsultations = useMemo(() => {
    return dataset.consultations.filter((c) => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      return true;
    });
  }, [dataset.consultations, statusFilter]);

  const activeConsultation: Consultation | undefined = useMemo(
    () =>
      dataset.consultations.find((c) => c.id === selectedId) ||
      filteredConsultations[0],
    [dataset.consultations, selectedId, filteredConsultations]
  );

  const [reasonDraft, setReasonDraft] = useState('');
  const [obsDraft, setObsDraft] = useState('');
  const [notesDraft, setNotesDraft] = useState('');
  const [assessDraft, setAssessDraft] = useState('');
  const [followDraft, setFollowDraft] = useState('');

  const selectConsultationRecord = (c: Consultation) => {
    setSelectedId(c.id);
    setReasonDraft(c.reasonForVisit);
    setObsDraft(c.demoObservations);
    setNotesDraft(c.clinicianFreeTextNotes);
    setAssessDraft(c.sampleAssessmentText);
    setFollowDraft(c.administrativeFollowUp);
  };

  // Sync draft values if initial consultation wasn't loaded into draft yet
  const currentReason = reasonDraft || activeConsultation?.reasonForVisit || '';
  const currentObs = obsDraft || activeConsultation?.demoObservations || '';
  const currentNotes =
    notesDraft || activeConsultation?.clinicianFreeTextNotes || '';
  const currentAssess =
    assessDraft || activeConsultation?.sampleAssessmentText || '';
  const currentFollow =
    followDraft || activeConsultation?.administrativeFollowUp || '';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#173042] dark:text-white">
            Clinical Consultation Workspace (Demo)
          </h1>
          <p className="text-xs text-[#64748B] dark:text-[#9BB0BE] mt-0.5">
            UI and workflow demonstration only · Uses fictional, prewritten example notes and user-entered demo entries
          </p>
        </div>

        <div className="inline-flex items-center p-1 rounded-lg bg-white dark:bg-[#172B39] border border-[#E2EAF0] dark:border-[#304B5B] text-xs">
          {(['all', 'Active', 'Completed'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-md font-medium ${
                statusFilter === tab
                  ? 'bg-[#EAF8FB] text-[#0891B2] dark:bg-[#203847] dark:text-[#22D3EE]'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {tab === 'all' ? 'All Consultations' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Scheduled / Waiting Patients Ready to Enter Consultation */}
      {scheduledWaitingQueue.length > 0 && (
        <div className="p-4 rounded-xl bg-white dark:bg-[#172B39] border border-[#E2EAF0] dark:border-[#304B5B] space-y-2.5">
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
            Checked-In / Waiting Patients Ready to Start Consultation ({scheduledWaitingQueue.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {scheduledWaitingQueue.slice(0, 6).map((apt) => {
              const pat = patientMap.get(apt.patientId);
              const doc = doctorMap.get(apt.doctorId);
              return (
                <div
                  key={apt.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#11202D] border border-slate-200 dark:border-[#304B5B] text-xs"
                >
                  <div>
                    <span className="font-semibold">
                      {pat?.fullName ?? apt.patientId}
                    </span>
                    <span className="text-slate-400 ml-1.5">
                      ({doc?.fullName ?? apt.doctorId} · {apt.startTime})
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      const res = transitionAppointmentStatus(
                        apt.id,
                        'In Consultation'
                      );
                      if (res.success) {
                        toast.success(
                          `Started consultation for ${pat?.fullName ?? apt.patientId}`
                        );
                      }
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#0891B2] text-white font-medium"
                  >
                    <Play className="w-3 h-3" />
                    <span>Start</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Split Workspace: Left Consultation Queue List + Right Documentation Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left List */}
        <div className="lg:col-span-4 rounded-xl bg-white dark:bg-[#172B39] border border-[#E2EAF0] dark:border-[#304B5B] overflow-hidden">
          <div className="p-3.5 border-b border-[#E2EAF0] dark:border-[#304B5B] text-xs font-semibold">
            Consultation Records ({filteredConsultations.length})
          </div>
          <div className="divide-y divide-slate-100 dark:divide-[#304B5B] max-h-[600px] overflow-y-auto">
            {filteredConsultations.slice(0, 35).map((c) => {
              const pat = patientMap.get(c.patientId);
              const doc = doctorMap.get(c.doctorId);
              const isSelected = activeConsultation?.id === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => selectConsultationRecord(c)}
                  className={`w-full p-3.5 text-left text-xs transition-colors ${
                    isSelected
                      ? 'bg-[#EAF8FB] dark:bg-[#203847]'
                      : 'hover:bg-slate-50 dark:hover:bg-[#11202D]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[#0891B2] dark:text-[#22D3EE]">
                      {c.id}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                        c.status === 'Active'
                          ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                  <div className="font-semibold text-slate-900 dark:text-white mt-1">
                    {pat?.fullName ?? c.patientId}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {doc?.fullName ?? c.doctorId} · {c.visitDate}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Detail Editor */}
        <div className="lg:col-span-8 rounded-xl bg-white dark:bg-[#172B39] border border-[#E2EAF0] dark:border-[#304B5B] p-6 space-y-5">
          {activeConsultation ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E2EAF0] dark:border-[#304B5B]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-[#0891B2]">
                      {activeConsultation.id} · Visit {activeConsultation.visitId} · Appt {activeConsultation.appointmentId}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                    {patientMap.get(activeConsultation.patientId)?.fullName ??
                      activeConsultation.patientId}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Assigned Clinician:{' '}
                    {doctorMap.get(activeConsultation.doctorId)?.fullName ??
                      activeConsultation.doctorId}{' '}
                    · Visit Date: {activeConsultation.visitDate}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/dashboard/patients/${activeConsultation.patientId}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#304B5B] text-xs font-medium"
                  >
                    <span>Patient 360°</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                  {activeConsultation.status !== 'Completed' && (
                    <button
                      onClick={() => {
                        completeConsultationAndVisit(activeConsultation.id);
                        toast.success(
                          `Finished consultation ${activeConsultation.id} and marked visit Completed.`
                        );
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Finish Consultation</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Non-Clinical Notice */}
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#11202D] border border-slate-200 dark:border-[#304B5B] text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#0891B2] shrink-0" />
                <span>
                  Non-Clinical Demonstration Record: No automated diagnosis, dosage, or medical advice is generated.
                </span>
              </div>

              {/* Form Sections */}
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    1. Fictional Reason for Visit
                  </label>
                  <input
                    type="text"
                    value={currentReason}
                    onChange={(e) => setReasonDraft(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    2. Demo Observations
                  </label>
                  <textarea
                    rows={2}
                    value={currentObs}
                    onChange={(e) => setObsDraft(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    3. Clinician-Entered Free-Text Notes (Demo)
                  </label>
                  <textarea
                    rows={3}
                    value={currentNotes}
                    onChange={(e) => setNotesDraft(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    4. Non-Actionable Sample Assessment Text
                  </label>
                  <textarea
                    rows={2}
                    value={currentAssess}
                    onChange={(e) => setAssessDraft(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    5. Administrative Follow-Up
                  </label>
                  <input
                    type="text"
                    value={currentFollow}
                    onChange={(e) => setFollowDraft(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D]"
                  />
                </div>
              </div>

              {/* Action Bar */}
              <div className="pt-4 border-t border-[#E2EAF0] dark:border-[#304B5B] flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={() => {
                    const doc = generateSampleDocument({
                      visitId: activeConsultation.visitId,
                      type: 'Sample Prescription',
                      title: `Sample Wellness Handout — ${
                        patientMap.get(activeConsultation.patientId)?.fullName ??
                        activeConsultation.patientId
                      }`,
                      sampleEntries: [
                        {
                          id: `E-${Date.now()}`,
                          label:
                            'Fictional Daily Hydration & Ergonomic Stretch Routine (Sample Only)',
                          instructionNote:
                            'Non-actionable demonstration entry recorded during simulated consultation.',
                          durationLabel: '14 Days (Sample)',
                        },
                      ],
                      demoNotes: currentFollow,
                    });
                    if (doc) {
                      downloadSampleDocumentPDF({
                        document: doc,
                        patient: patientMap.get(activeConsultation.patientId),
                        doctor: doctorMap.get(activeConsultation.doctorId),
                        settings,
                      });
                      toast.success(
                        `Generated and downloaded ${doc.referenceNumber}.pdf`
                      );
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E2EAF0] dark:border-[#304B5B] hover:border-[#0891B2] text-xs font-medium"
                >
                  <FileText className="w-4 h-4 text-[#0891B2]" />
                  <span>Generate Sample Visit Document PDF</span>
                </button>

                <button
                  onClick={() => {
                    updateConsultation(activeConsultation.id, {
                      reasonForVisit: currentReason,
                      demoObservations: currentObs,
                      clinicianFreeTextNotes: currentNotes,
                      sampleAssessmentText: currentAssess,
                      administrativeFollowUp: currentFollow,
                    });
                    toast.success('Saved consultation demonstration notes.');
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0891B2] hover:bg-cyan-700 text-white text-xs font-semibold"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Documentation</span>
                </button>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-xs text-slate-500">
              Select a consultation from the left list to view or edit notes.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
