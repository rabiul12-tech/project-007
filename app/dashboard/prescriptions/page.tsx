'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  FileText,
  Download,
  Printer,
  Plus,
  Search,
  ShieldAlert,
} from 'lucide-react';
import { useMedoraStore } from '@/stores/useMedoraStore';
import {
  CLINICAL_SAMPLE_DISCLAIMER,
  downloadSampleDocumentPDF,
} from '@/lib/pdf/generator';

export default function SamplePrescriptionsPage() {
  const {
    dataset,
    settings,
    generateSampleDocument,
  } = useMedoraStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocId, setSelectedDocId] = useState(
    dataset.documents[0]?.id || ''
  );

  const patientMap = useMemo(
    () => new Map(dataset.patients.map((p) => [p.id, p])),
    [dataset.patients]
  );
  const doctorMap = useMemo(
    () => new Map(dataset.doctors.map((d) => [d.id, d])),
    [dataset.doctors]
  );

  const filteredDocs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return dataset.documents.filter((d) => {
      if (!q) return true;
      const pat = patientMap.get(d.patientId);
      const doc = doctorMap.get(d.doctorId);
      return `${d.referenceNumber} ${d.title} ${pat?.fullName ?? ''} ${
        doc?.fullName ?? ''
      }`
        .toLowerCase()
        .includes(q);
    });
  }, [dataset.documents, searchQuery, patientMap, doctorMap]);

  const activeDoc = useMemo(
    () =>
      dataset.documents.find((d) => d.id === selectedDocId) ||
      filteredDocs[0],
    [dataset.documents, selectedDocId, filteredDocs]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#173042] dark:text-white">
            Sample Prescription &amp; Visit Document Workspace
          </h1>
          <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold mt-0.5">
            {CLINICAL_SAMPLE_DISCLAIMER}
          </p>
        </div>

        <button
          onClick={() => {
            const firstVisit = dataset.visits[0];
            if (!firstVisit) return;
            const pat = patientMap.get(firstVisit.patientId);
            const created = generateSampleDocument({
              visitId: firstVisit.id,
              type: 'Sample Prescription',
              title: `Sample Wellness Sheet — ${pat?.fullName ?? firstVisit.patientId}`,
              sampleEntries: [
                {
                  id: `ITEM-${Date.now()}-1`,
                  label:
                    'Fictional Daily Hydration & Ergonomic Mobility Routine (Demo Placeholder)',
                  instructionNote:
                    'Sample non-actionable entry: Maintain regular hydration and 5-minute ergonomic stretch breaks.',
                  durationLabel: '14 Days (Sample Only)',
                },
              ],
              demoNotes:
                'Created in MEDORA Health Sample Document Workspace. Not valid for pharmacy dispensing.',
            });
            if (created) {
              setSelectedDocId(created.id);
              toast.success(
                `Created sample document ${created.referenceNumber}`
              );
            }
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0891B2] hover:bg-cyan-700 text-white text-xs font-semibold"
        >
          <Plus className="w-4 h-4" />
          <span>Create Sample Document</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-3.5 rounded-xl bg-white dark:bg-[#172B39] border border-[#E2EAF0] dark:border-[#304B5B]">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by document reference (RX-SAMPLE-...), patient name, or clinician..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E2EAF0] dark:border-[#304B5B] bg-slate-50 dark:bg-[#11202D]"
          />
        </div>
      </div>

      {/* Master-Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Document List */}
        <div className="lg:col-span-5 rounded-xl bg-white dark:bg-[#172B39] border border-[#E2EAF0] dark:border-[#304B5B] overflow-hidden">
          <div className="p-3.5 border-b border-[#E2EAF0] dark:border-[#304B5B] text-xs font-semibold">
            Sample Documents ({filteredDocs.length})
          </div>
          <div className="divide-y divide-slate-100 dark:divide-[#304B5B] max-h-[600px] overflow-y-auto">
            {filteredDocs.map((doc) => {
              const pat = patientMap.get(doc.patientId);
              const clinician = doctorMap.get(doc.doctorId);
              const isSelected = activeDoc?.id === doc.id;
              return (
                <button
                  key={doc.id}
                  onClick={() => setSelectedDocId(doc.id)}
                  className={`w-full p-3.5 text-left text-xs transition-colors ${
                    isSelected
                      ? 'bg-[#EAF8FB] dark:bg-[#203847]'
                      : 'hover:bg-slate-50 dark:hover:bg-[#11202D]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[#0891B2] dark:text-[#22D3EE]">
                      {doc.referenceNumber}
                    </span>
                    <span className="font-mono tabular-nums text-slate-400">
                      {doc.visitDate}
                    </span>
                  </div>
                  <div className="font-semibold text-slate-900 dark:text-white mt-1">
                    {pat?.fullName ?? doc.patientId}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {doc.type} · {clinician?.fullName ?? doc.doctorId}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Document Preview with Mandatory Watermark */}
        <div className="lg:col-span-7 rounded-xl bg-white dark:bg-[#172B39] border border-[#E2EAF0] dark:border-[#304B5B] p-6 space-y-5">
          {activeDoc ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#E2EAF0] dark:border-[#304B5B]">
                <div>
                  <span className="text-xs font-mono text-[#0891B2]">
                    {activeDoc.referenceNumber}
                  </span>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {activeDoc.title}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#304B5B] text-xs font-medium"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print</span>
                  </button>
                  <button
                    onClick={() => {
                      downloadSampleDocumentPDF({
                        document: activeDoc,
                        patient: patientMap.get(activeDoc.patientId),
                        doctor: doctorMap.get(activeDoc.doctorId),
                        settings,
                      });
                      toast.success(
                        `Downloaded ${activeDoc.referenceNumber}.pdf`
                      );
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0891B2] hover:bg-cyan-700 text-white text-xs font-semibold"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>

              {/* Document Sheet Preview */}
              <div className="p-6 rounded-xl border-2 border-dashed border-rose-300 dark:border-rose-800 bg-slate-50/60 dark:bg-[#11202D] space-y-5 text-xs">
                {/* Prominent Watermark Banner */}
                <div className="p-2.5 rounded-lg bg-rose-100 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 text-center font-bold text-rose-800 dark:text-rose-200 tracking-wide">
                  SAMPLE — NOT VALID FOR MEDICAL USE
                </div>

                <div className="flex flex-col sm:flex-row justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#304B5B]">
                  <div>
                    <div className="font-bold text-sm text-slate-900 dark:text-white">
                      {settings.clinicName}
                    </div>
                    <div className="text-slate-500">{settings.address}</div>
                    <div className="text-slate-500">{settings.phone}</div>
                  </div>
                  <div className="sm:text-right font-mono tabular-nums">
                    <div>Ref: {activeDoc.referenceNumber}</div>
                    <div>Visit Date: {activeDoc.visitDate}</div>
                    <div>Visit ID: {activeDoc.visitId}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-lg bg-white dark:bg-[#172B39] border border-slate-200 dark:border-[#304B5B]">
                  <div>
                    <span className="text-slate-400 block">
                      Fictional Patient:
                    </span>
                    <Link
                      href={`/dashboard/patients/${activeDoc.patientId}`}
                      className="font-semibold text-[#0891B2] hover:underline"
                    >
                      {patientMap.get(activeDoc.patientId)?.fullName ??
                        activeDoc.patientId}
                    </Link>{' '}
                    ({activeDoc.patientId})
                  </div>
                  <div>
                    <span className="text-slate-400 block">
                      Demo Clinician:
                    </span>
                    <span className="font-semibold">
                      {doctorMap.get(activeDoc.doctorId)?.fullName ??
                        activeDoc.doctorId}
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    Non-Actionable Sample Entries:
                  </div>
                  {activeDoc.sampleEntries.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-lg bg-white dark:bg-[#172B39] border border-slate-200 dark:border-[#304B5B] space-y-1"
                    >
                      <div className="flex items-center justify-between font-semibold">
                        <span>{item.label}</span>
                        <span className="font-mono text-[#0891B2]">
                          {item.durationLabel}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300">
                        {item.instructionNote}
                      </p>
                    </div>
                  ))}
                </div>

                <div>
                  <div className="font-semibold mb-1">Demo Notes:</div>
                  <p className="text-slate-600 dark:text-slate-300">
                    {activeDoc.demoNotes}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-[#304B5B] flex items-center gap-2 text-rose-700 dark:text-rose-300 font-medium">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>
                    No clinician signature is rendered. This portfolio sample document is not valid for pharmacy dispensing or clinical care.
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-xs text-slate-500">
              Select a sample document to preview or download.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
