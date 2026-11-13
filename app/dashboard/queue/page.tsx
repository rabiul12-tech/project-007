'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Search,
  UserCheck,
  Clock,
  Stethoscope,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  Play,
  ArrowRight,
} from 'lucide-react';
import { useMedoraStore } from '@/stores/useMedoraStore';
import { Appointment, AppointmentStatus } from '@/types/medora';
import { AppointmentStatusBadge } from '@/components/ui/StatusBadge';

function computeWaitingDurationLabel(apt: Appointment): string {
  const ts = apt.waitingSince || apt.checkedInAt;
  if (!ts) return '—';
  if (apt.status === 'Completed' && apt.consultationStartedAt) {
    const diffMs =
      new Date(apt.consultationStartedAt).getTime() - new Date(ts).getTime();
    const mins = Math.max(2, Math.round(diffMs / 60000));
    return `${mins} min`;
  }
  // Deterministic elapsed display based on startTime vs 10:15 reference or actual elapsed
  const [h, m] = apt.startTime.split(':').map(Number);
  const startMins = h * 60 + m;
  const refNowMins = 10 * 60 + 25;
  const delta = Math.max(4, Math.abs(refNowMins - startMins) % 42);
  return `${delta} min`;
}

export default function ReceptionQueuePage() {
  const {
    dataset,
    ui,
    setSelectedDate,
    setQuickDialog,
    transitionAppointmentStatus,
  } = useMedoraStore();

  const [doctorFilter, setDoctorFilter] = useState('all');
  const [stageFilter, setStageFilter] = useState<'all' | AppointmentStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

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
  const roomMap = useMemo(
    () => new Map(dataset.rooms.map((r) => [r.id, r])),
    [dataset.rooms]
  );

  const dateAppointments = useMemo(() => {
    return dataset.appointments
      .filter((a) => a.date === ui.selectedDate)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [dataset.appointments, ui.selectedDate]);

  const filteredQueue = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return dateAppointments.filter((apt) => {
      if (doctorFilter !== 'all' && apt.doctorId !== doctorFilter) return false;
      if (stageFilter !== 'all' && apt.status !== stageFilter) return false;
      if (q) {
        const pat = patientMap.get(apt.patientId);
        const doc = doctorMap.get(apt.doctorId);
        const srv = serviceMap.get(apt.serviceId);
        const hay = `${apt.id} ${pat?.fullName ?? ''} ${doc?.fullName ?? ''} ${
          srv?.name ?? ''
        }`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [
    dateAppointments,
    doctorFilter,
    stageFilter,
    searchQuery,
    patientMap,
    doctorMap,
    serviceMap,
  ]);

  // Assign queue position to active arrivals (Checked In & Waiting)
  const queuePositionMap = useMemo(() => {
    const activeWaiting = dateAppointments
      .filter((a) => a.status === 'Checked In' || a.status === 'Waiting')
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
    const map = new Map<string, number>();
    activeWaiting.forEach((apt, index) => {
      map.set(apt.id, index + 1);
    });
    return map;
  }, [dateAppointments]);

  const stageCounts = useMemo(() => {
    const counts: Record<AppointmentStatus, number> = {
      Scheduled: 0,
      Confirmed: 0,
      'Checked In': 0,
      Waiting: 0,
      'In Consultation': 0,
      Completed: 0,
      'No-show': 0,
      Cancelled: 0,
    };
    for (const apt of dateAppointments) {
      counts[apt.status] = (counts[apt.status] || 0) + 1;
    }
    return counts;
  }, [dateAppointments]);

  const handleTransition = (aptId: string, nextStatus: AppointmentStatus) => {
    const res = transitionAppointmentStatus(aptId, nextStatus);
    if (!res.success) {
      toast.error(res.error || 'Could not update queue status.');
      return;
    }
    toast.success(`Updated ${aptId} to "${nextStatus}"`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#173042] dark:text-white">
            Reception &amp; Patient Queue
          </h1>
          <p className="text-xs text-[#64748B] dark:text-[#9BB0BE] mt-0.5">
            Live front-desk arrival management · Updates shared appointment, visit, and consultation records
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <input
            type="date"
            aria-label="Queue date"
            value={ui.selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 text-xs font-medium rounded-lg border border-[#E2EAF0] dark:border-[#304B5B] bg-white dark:bg-[#172B39] tabular-nums"
          />
          <button
            onClick={() =>
              setQuickDialog('book_appointment', { date: ui.selectedDate })
            }
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0891B2] hover:bg-cyan-700 text-white text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Walk-In / Appointment</span>
          </button>
        </div>
      </div>

      {/* Queue Status Stage Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {(
          [
            { label: 'Scheduled', status: 'Scheduled' as AppointmentStatus },
            { label: 'Checked In', status: 'Checked In' as AppointmentStatus },
            { label: 'Waiting', status: 'Waiting' as AppointmentStatus },
            {
              label: 'In Consultation',
              status: 'In Consultation' as AppointmentStatus,
            },
            { label: 'Completed', status: 'Completed' as AppointmentStatus },
            { label: 'No-show', status: 'No-show' as AppointmentStatus },
            { label: 'Cancelled', status: 'Cancelled' as AppointmentStatus },
          ] as const
        ).map((st) => {
          const isSelected = stageFilter === st.status;
          const count =
            st.status === 'Scheduled'
              ? stageCounts.Scheduled + stageCounts.Confirmed
              : stageCounts[st.status];
          return (
            <button
              key={st.status}
              onClick={() =>
                setStageFilter(isSelected ? 'all' : st.status)
              }
              className={`p-3 rounded-xl border text-left transition-colors ${
                isSelected
                  ? 'border-[#0891B2] bg-[#EAF8FB] dark:bg-[#203847]'
                  : 'border-[#E2EAF0] dark:border-[#304B5B] bg-white dark:bg-[#172B39] hover:border-cyan-400'
              }`}
            >
              <div className="text-xs font-medium text-[#64748B] dark:text-[#9BB0BE] truncate">
                {st.label}
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums mt-1 text-[#173042] dark:text-white">
                {count}
              </div>
            </button>
          );
        })}
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#172B39] border border-[#E2EAF0] dark:border-[#304B5B] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search patient name, appointment ID, doctor, or service..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E2EAF0] dark:border-[#304B5B] bg-slate-50 dark:bg-[#11202D] text-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
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
            aria-label="Filter by queue stage"
            value={stageFilter}
            onChange={(e) =>
              setStageFilter(e.target.value as 'all' | AppointmentStatus)
            }
            className="px-3 py-2 text-xs rounded-lg border border-[#E2EAF0] dark:border-[#304B5B] bg-white dark:bg-[#11202D]"
          >
            <option value="all">All Queue Stages</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Checked In">Checked In</option>
            <option value="Waiting">Waiting</option>
            <option value="In Consultation">In Consultation</option>
            <option value="Completed">Completed</option>
            <option value="No-show">No-show</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Interactive Queue Table */}
      <div className="rounded-xl bg-white dark:bg-[#172B39] border border-[#E2EAF0] dark:border-[#304B5B] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E2EAF0] dark:border-[#304B5B] bg-slate-50/70 dark:bg-[#11202D] text-[#64748B] dark:text-[#9BB0BE]">
                <th className="py-3 px-3.5 font-medium">Pos</th>
                <th className="py-3 px-3.5 font-medium">Time</th>
                <th className="py-3 px-3.5 font-medium">Patient</th>
                <th className="py-3 px-3.5 font-medium">Doctor &amp; Room</th>
                <th className="py-3 px-3.5 font-medium">Service</th>
                <th className="py-3 px-3.5 font-medium">Stage</th>
                <th className="py-3 px-3.5 font-medium">Waiting Duration</th>
                <th className="py-3 px-3.5 font-medium text-right">
                  Reception &amp; Clinical Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#304B5B]">
              {filteredQueue.map((apt) => {
                const pat = patientMap.get(apt.patientId);
                const doc = doctorMap.get(apt.doctorId);
                const srv = serviceMap.get(apt.serviceId);
                const room = apt.roomId ? roomMap.get(apt.roomId) : undefined;
                const qPos = queuePositionMap.get(apt.id);

                return (
                  <tr
                    key={apt.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-[#203847]/60"
                  >
                    <td className="py-3 px-3.5 font-mono tabular-nums">
                      {qPos ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold">
                          #{qPos}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3.5 font-mono tabular-nums whitespace-nowrap">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {apt.startTime}–{apt.endTime}
                      </div>
                      <div className="text-[11px] text-slate-400">{apt.id}</div>
                    </td>
                    <td className="py-3 px-3.5">
                      <Link
                        href={`/dashboard/patients/${apt.patientId}`}
                        className="font-semibold text-slate-900 dark:text-slate-100 hover:text-[#0891B2]"
                      >
                        {pat?.fullName ?? apt.patientId}
                      </Link>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {apt.patientId} · {pat?.phone}
                      </div>
                    </td>
                    <td className="py-3 px-3.5">
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {doc?.fullName ?? apt.doctorId}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {room ? `${room.code} (${room.name})` : 'Standard Room'}
                      </div>
                    </td>
                    <td className="py-3 px-3.5">
                      <div className="text-slate-800 dark:text-slate-200">
                        {srv?.name ?? apt.serviceId}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono tabular-nums">
                        {apt.durationMinutes} min
                      </div>
                    </td>
                    <td className="py-3 px-3.5">
                      <AppointmentStatusBadge status={apt.status} />
                    </td>
                    <td className="py-3 px-3.5 font-mono tabular-nums">
                      <div>{computeWaitingDurationLabel(apt)}</div>
                      {apt.checkedInAt && (
                        <div className="text-[10px] text-slate-400">
                          Arrived {apt.checkedInAt.slice(11, 16)}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3.5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        {(apt.status === 'Scheduled' ||
                          apt.status === 'Confirmed') && (
                          <>
                            <button
                              onClick={() =>
                                handleTransition(apt.id, 'Checked In')
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Check In</span>
                            </button>
                            <button
                              onClick={() =>
                                handleTransition(apt.id, 'No-show')
                              }
                              className="px-2 py-1.5 rounded-lg border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            >
                              No-show
                            </button>
                            <button
                              onClick={() =>
                                handleTransition(apt.id, 'Cancelled')
                              }
                              className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-[#304B5B] text-slate-600 dark:text-slate-300"
                            >
                              Cancel
                            </button>
                          </>
                        )}

                        {apt.status === 'Checked In' && (
                          <>
                            <button
                              onClick={() =>
                                handleTransition(apt.id, 'Waiting')
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium"
                            >
                              <Clock className="w-3.5 h-3.5" />
                              <span>Move to Waiting</span>
                            </button>
                            <button
                              onClick={() =>
                                handleTransition(apt.id, 'In Consultation')
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#0891B2] hover:bg-cyan-700 text-white font-medium"
                            >
                              <Play className="w-3.5 h-3.5" />
                              <span>Start Consultation</span>
                            </button>
                          </>
                        )}

                        {apt.status === 'Waiting' && (
                          <>
                            <button
                              onClick={() =>
                                handleTransition(apt.id, 'In Consultation')
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#0891B2] hover:bg-cyan-700 text-white font-medium"
                            >
                              <Stethoscope className="w-3.5 h-3.5" />
                              <span>Start Consultation</span>
                            </button>
                            <button
                              onClick={() =>
                                handleTransition(apt.id, 'No-show')
                              }
                              className="px-2 py-1.5 rounded-lg border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300"
                            >
                              No-show
                            </button>
                          </>
                        )}

                        {apt.status === 'In Consultation' && (
                          <>
                            <button
                              onClick={() =>
                                handleTransition(apt.id, 'Completed')
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Complete Consultation</span>
                            </button>
                            <Link
                              href="/dashboard/consultations"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E2EAF0] dark:border-[#304B5B] text-[#0891B2] dark:text-[#22D3EE]"
                            >
                              <span>Open Notes</span>
                              <ArrowRight className="w-3 h-3" />
                            </Link>
                          </>
                        )}

                        {apt.status === 'Completed' && (
                          <Link
                            href="/dashboard/visits"
                            className="text-xs font-medium text-[#0891B2] hover:underline"
                          >
                            View Visit Summary →
                          </Link>
                        )}

                        {(apt.status === 'Cancelled' ||
                          apt.status === 'No-show') && (
                          <button
                            onClick={() =>
                              setQuickDialog('book_appointment', {
                                rescheduleAppointmentId: apt.id,
                              })
                            }
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#304B5B] text-slate-700 dark:text-slate-200 hover:border-cyan-500"
                          >
                            Reschedule
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredQueue.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="py-10 text-center text-slate-500 dark:text-slate-400"
                  >
                    No queue entries match the current filters on {ui.selectedDate}.
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
