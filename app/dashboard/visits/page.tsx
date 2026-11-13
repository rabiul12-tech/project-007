'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Search, Download, Printer, Eye, X } from 'lucide-react';
import { useMedoraStore } from '@/stores/useMedoraStore';
import { Visit } from '@/types/medora';
import { downloadVisitSummaryPDF } from '@/lib/pdf/generator';

export default function VisitHistoryPage() {
  const { dataset, settings } = useMedoraStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Completed' | 'In Progress'>('all');
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);

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

  const filteredVisits = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return dataset.visits.filter((v) => {
      if (doctorFilter !== 'all' && v.doctorId !== doctorFilter) return false;
      if (statusFilter !== 'all' && v.status !== statusFilter) return false;
      if (q) {
        const pat = patientMap.get(v.patientId);
        const doc = doctorMap.get(v.doctorId);
        const srv = serviceMap.get(v.serviceId);
        const hay = `${v.id} ${v.appointmentId} ${v.visitDate} ${
          pat?.fullName ?? ''
        } ${doc?.fullName ?? ''} ${srv?.name ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [
    dataset.visits,
    doctorFilter,
    statusFilter,
    searchQuery,
    patientMap,
    doctorMap,
    serviceMap,
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#173042] dark:text-white">
            Outpatient Visit History
          </h1>
          <p className="text-xs text-[#64748B] dark:text-[#9BB0BE] mt-0.5">
            {filteredVisits.length} visit records linked to validated appointments, patients, and clinicians
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E2EAF0] dark:border-[#304B5B] bg-white dark:bg-[#172B39] text-xs font-medium"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print Summary</span>
        </button>
      </div>

      {/* Filters */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#172B39] border border-[#E2EAF0] dark:border-[#304B5B] grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search visit ID, patient, appointment, or date..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E2EAF0] dark:border-[#304B5B] bg-slate-50 dark:bg-[#11202D]"
          />
        </div>

        <select
          aria-label="Filter by doctor"
          value={doctorFilter}
          onChange={(e) => setDoctorFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-lg border border-[#E2EAF0] dark:border-[#304B5B] bg-white dark:bg-[#11202D]"
        >
          <option value="all">All Clinicians</option>
          {dataset.doctors.map((d) => (
            <option key={d.id} value={d.id}>
              {d.fullName}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by visit status"
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as typeof statusFilter)
          }
          className="px-3 py-2 text-xs rounded-lg border border-[#E2EAF0] dark:border-[#304B5B] bg-white dark:bg-[#11202D]"
        >
          <option value="all">All Visit Statuses</option>
          <option value="Completed">Completed</option>
          <option value="In Progress">In Progress</option>
        </select>
      </div>

      {/* Visit Table */}
      <div className="rounded-xl bg-white dark:bg-[#172B39] border border-[#E2EAF0] dark:border-[#304B5B] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E2EAF0] dark:border-[#304B5B] bg-slate-50/70 dark:bg-[#11202D] text-[#64748B] dark:text-[#9BB0BE]">
                <th className="py-3 px-3.5 font-medium">Visit ID</th>
                <th className="py-3 px-3.5 font-medium">Visit Date</th>
                <th className="py-3 px-3.5 font-medium">Patient</th>
                <th className="py-3 px-3.5 font-medium">Doctor</th>
                <th className="py-3 px-3.5 font-medium">Appointment</th>
                <th className="py-3 px-3.5 font-medium">Service</th>
                <th className="py-3 px-3.5 font-medium">Status</th>
                <th className="py-3 px-3.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#304B5B]">
              {filteredVisits.slice(0, 40).map((v) => {
                const pat = patientMap.get(v.patientId);
                const doc = doctorMap.get(v.doctorId);
                const srv = serviceMap.get(v.serviceId);
                const con = dataset.consultations.find(
                  (c) => c.visitId === v.id
                );

                return (
                  <tr
                    key={v.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-[#203847]/60"
                  >
                    <td className="py-2.5 px-3.5 font-mono font-semibold text-[#0891B2] dark:text-[#22D3EE]">
                      {v.id}
                    </td>
                    <td className="py-2.5 px-3.5 font-mono tabular-nums">
                      {v.visitDate}
                    </td>
                    <td className="py-2.5 px-3.5">
                      <Link
                        href={`/dashboard/patients/${v.patientId}`}
                        className="font-medium text-slate-900 dark:text-white hover:text-[#0891B2]"
                      >
                        {pat?.fullName ?? v.patientId}
                      </Link>
                    </td>
                    <td className="py-2.5 px-3.5">
                      {doc?.fullName ?? v.doctorId}
                    </td>
                    <td className="py-2.5 px-3.5 font-mono text-slate-500">
                      {v.appointmentId}
                    </td>
                    <td className="py-2.5 px-3.5 truncate max-w-[200px]">
                      {srv?.name ?? v.summaryTitle}
                    </td>
                    <td className="py-2.5 px-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                          v.status === 'Completed'
                            ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-sky-50 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300'
                        }`}
                      >
                        {v.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => setSelectedVisit(v)}
                          className="p-1.5 rounded border border-slate-200 dark:border-[#304B5B]"
                          title="Inspect visit details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            downloadVisitSummaryPDF({
                              visit: v,
                              consultation: con,
                              patient: pat,
                              doctor: doc,
                              serviceName: srv?.name ?? v.summaryTitle,
                              settings,
                            });
                            toast.success(
                              `Downloaded Visit Summary PDF (${v.id})`
                            );
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#0891B2] text-white font-medium"
                        >
                          <Download className="w-3 h-3" />
                          <span>Report PDF</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visit Detail Modal */}
      {selectedVisit && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-xl bg-white dark:bg-[#172B39] border border-slate-200 dark:border-[#304B5B] p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#304B5B]">
              <div>
                <span className="font-mono text-[#0891B2]">
                  {selectedVisit.id} · Appointment {selectedVisit.appointmentId}
                </span>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {selectedVisit.summaryTitle}
                </h2>
              </div>
              <button
                onClick={() => setSelectedVisit(null)}
                className="p-1 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 p-3.5 rounded-lg bg-slate-50 dark:bg-[#11202D]">
              <div className="flex justify-between">
                <span className="text-slate-500">Patient:</span>
                <span className="font-semibold">
                  {patientMap.get(selectedVisit.patientId)?.fullName ??
                    selectedVisit.patientId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Clinician:</span>
                <span>
                  {doctorMap.get(selectedVisit.doctorId)?.fullName ??
                    selectedVisit.doctorId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Visit Date:</span>
                <span className="font-mono">{selectedVisit.visitDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="font-semibold">{selectedVisit.status}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedVisit(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
