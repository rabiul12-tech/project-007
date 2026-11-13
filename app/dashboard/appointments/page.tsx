'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Search,
  Plus,
  Download,
  CalendarClock,
  X,
  UserCheck,
  Ban,
  AlertCircle,
  ArrowUpDown,
} from 'lucide-react';
import { useMedoraStore } from '@/stores/useMedoraStore';
import { Appointment, AppointmentStatus } from '@/types/medora';
import { AppointmentStatusBadge } from '@/components/ui/StatusBadge';
import { downloadCSVFile } from '@/lib/export/csv';

export default function AppointmentsManagementPage() {
  const {
    dataset,
    setQuickDialog,
    transitionAppointmentStatus,
  } = useMedoraStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AppointmentStatus>('all');
  const [doctorFilter, setDoctorFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'patient'>('date_desc');
  const [page, setPage] = useState(1);
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null);
  const pageSize = 15;

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

  const filteredAppointments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = dataset.appointments.filter((apt) => {
      if (statusFilter !== 'all' && apt.status !== statusFilter) return false;
      if (doctorFilter !== 'all' && apt.doctorId !== doctorFilter) return false;
      if (q) {
        const pat = patientMap.get(apt.patientId);
        const doc = doctorMap.get(apt.doctorId);
        const srv = serviceMap.get(apt.serviceId);
        const hay = `${apt.id} ${apt.date} ${pat?.fullName ?? ''} ${
          doc?.fullName ?? ''
        } ${srv?.name ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    return list.sort((a, b) => {
      if (sortBy === 'date_asc') {
        return `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`);
      }
      if (sortBy === 'patient') {
        const pa = patientMap.get(a.patientId)?.fullName ?? '';
        const pb = patientMap.get(b.patientId)?.fullName ?? '';
        return pa.localeCompare(pb);
      }
      return `${b.date} ${b.startTime}`.localeCompare(`${a.date} ${a.startTime}`);
    });
  }, [
    dataset.appointments,
    statusFilter,
    doctorFilter,
    searchQuery,
    sortBy,
    patientMap,
    doctorMap,
    serviceMap,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredAppointments.length / pageSize));
  const paginated = filteredAppointments.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const handleExportCSV = () => {
    downloadCSVFile(
      'medora-appointments.csv',
      [
        'Appointment ID',
        'Date',
        'Start Time',
        'End Time',
        'Patient ID',
        'Patient Name',
        'Doctor',
        'Service',
        'Room',
        'Status',
      ],
      filteredAppointments.map((a) => [
        a.id,
        a.date,
        a.startTime,
        a.endTime,
        a.patientId,
        patientMap.get(a.patientId)?.fullName ?? a.patientId,
        doctorMap.get(a.doctorId)?.fullName ?? a.doctorId,
        serviceMap.get(a.serviceId)?.name ?? a.serviceId,
        a.roomId ?? '',
        a.status,
      ])
    );
    toast.success(`Exported ${filteredAppointments.length} appointments to CSV.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#173042] dark:text-white">
            Appointment Management
          </h1>
          <p className="text-xs text-[#64748B] dark:text-[#9BB0BE] mt-0.5">
            {filteredAppointments.length} matching records · Validated status transition engine and conflict-free rescheduling
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E2EAF0] dark:border-[#304B5B] bg-white dark:bg-[#172B39] text-xs font-medium"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setQuickDialog('book_appointment')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0891B2] hover:bg-cyan-700 text-white text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Book Appointment</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#172B39] border border-[#E2EAF0] dark:border-[#304B5B] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search ID, patient, doctor, date..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E2EAF0] dark:border-[#304B5B] bg-slate-50 dark:bg-[#11202D]"
          />
        </div>

        <select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as 'all' | AppointmentStatus);
            setPage(1);
          }}
          className="px-3 py-2 text-xs rounded-lg border border-[#E2EAF0] dark:border-[#304B5B] bg-white dark:bg-[#11202D]"
        >
          <option value="all">All Statuses</option>
          <option value="Scheduled">Scheduled</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Checked In">Checked In</option>
          <option value="Waiting">Waiting</option>
          <option value="In Consultation">In Consultation</option>
          <option value="Completed">Completed</option>
          <option value="No-show">No-show</option>
          <option value="Cancelled">Cancelled</option>
        </select>

        <select
          aria-label="Filter by clinician"
          value={doctorFilter}
          onChange={(e) => {
            setDoctorFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 text-xs rounded-lg border border-[#E2EAF0] dark:border-[#304B5B] bg-white dark:bg-[#11202D]"
        >
          <option value="all">All Clinicians</option>
          {dataset.doctors.map((d) => (
            <option key={d.id} value={d.id}>
              {d.fullName}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            aria-label="Sort appointments"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-[#E2EAF0] dark:border-[#304B5B] bg-white dark:bg-[#11202D]"
          >
            <option value="date_desc">Date &amp; Time (Newest First)</option>
            <option value="date_asc">Date &amp; Time (Oldest First)</option>
            <option value="patient">Patient Name (A–Z)</option>
          </select>
        </div>
      </div>

      {/* Appointments Table */}
      <div className="rounded-xl bg-white dark:bg-[#172B39] border border-[#E2EAF0] dark:border-[#304B5B] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E2EAF0] dark:border-[#304B5B] bg-slate-50/70 dark:bg-[#11202D] text-[#64748B] dark:text-[#9BB0BE]">
                <th className="py-3 px-3.5 font-medium">ID</th>
                <th className="py-3 px-3.5 font-medium">Date &amp; Time</th>
                <th className="py-3 px-3.5 font-medium">Patient</th>
                <th className="py-3 px-3.5 font-medium">Doctor</th>
                <th className="py-3 px-3.5 font-medium">Service</th>
                <th className="py-3 px-3.5 font-medium">Room</th>
                <th className="py-3 px-3.5 font-medium">Status</th>
                <th className="py-3 px-3.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#304B5B]">
              {paginated.map((apt) => {
                const pat = patientMap.get(apt.patientId);
                const doc = doctorMap.get(apt.doctorId);
                const srv = serviceMap.get(apt.serviceId);
                const room = apt.roomId ? roomMap.get(apt.roomId) : undefined;

                return (
                  <tr
                    key={apt.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-[#203847]/60"
                  >
                    <td className="py-2.5 px-3.5 font-mono tabular-nums font-semibold">
                      <button
                        onClick={() => setSelectedApt(apt)}
                        className="text-[#0891B2] dark:text-[#22D3EE] hover:underline"
                      >
                        {apt.id}
                      </button>
                    </td>
                    <td className="py-2.5 px-3.5 font-mono tabular-nums whitespace-nowrap">
                      <div className="font-medium text-slate-900 dark:text-slate-100">
                        {apt.date}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {apt.startTime}–{apt.endTime} ({apt.durationMinutes}m)
                      </div>
                    </td>
                    <td className="py-2.5 px-3.5">
                      <Link
                        href={`/dashboard/patients/${apt.patientId}`}
                        className="font-medium text-slate-900 dark:text-slate-100 hover:text-[#0891B2]"
                      >
                        {pat?.fullName ?? apt.patientId}
                      </Link>
                      <div className="text-[11px] text-slate-400">
                        {apt.patientId}
                      </div>
                    </td>
                    <td className="py-2.5 px-3.5 text-slate-700 dark:text-slate-200">
                      {doc?.fullName ?? apt.doctorId}
                    </td>
                    <td className="py-2.5 px-3.5 text-slate-600 dark:text-slate-300 max-w-[200px] truncate">
                      {srv?.name ?? apt.serviceId}
                    </td>
                    <td className="py-2.5 px-3.5 font-mono tabular-nums text-slate-500">
                      {room?.code ?? apt.roomId ?? '—'}
                    </td>
                    <td className="py-2.5 px-3.5">
                      <AppointmentStatusBadge status={apt.status} />
                    </td>
                    <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        {(apt.status === 'Scheduled' ||
                          apt.status === 'Confirmed') && (
                          <button
                            onClick={() => {
                              const r = transitionAppointmentStatus(
                                apt.id,
                                'Checked In'
                              );
                              if (r.success) toast.success(`Checked in ${apt.id}`);
                            }}
                            className="px-2 py-1 rounded bg-teal-600 hover:bg-teal-700 text-white font-medium"
                          >
                            Check In
                          </button>
                        )}
                        {apt.status !== 'Completed' && (
                          <button
                            onClick={() =>
                              setQuickDialog('book_appointment', {
                                rescheduleAppointmentId: apt.id,
                              })
                            }
                            className="px-2 py-1 rounded border border-slate-200 dark:border-[#304B5B] hover:border-cyan-500"
                          >
                            Reschedule
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedApt(apt)}
                          className="px-2 py-1 rounded border border-slate-200 dark:border-[#304B5B] text-slate-600 dark:text-slate-300"
                        >
                          Details
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3.5 border-t border-[#E2EAF0] dark:border-[#304B5B] flex items-center justify-between text-xs text-slate-500">
          <span className="tabular-nums">
            Showing {(page - 1) * pageSize + 1}–
            {Math.min(page * pageSize, filteredAppointments.length)} of{' '}
            {filteredAppointments.length} appointments
          </span>
          <div className="flex items-center gap-1.5">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 rounded border border-slate-200 dark:border-[#304B5B] disabled:opacity-40"
            >
              Previous
            </button>
            <span className="px-2 font-mono tabular-nums">
              Page {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 rounded border border-slate-200 dark:border-[#304B5B] disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Appointment Details Drawer */}
      {selectedApt && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-slate-950/50 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-white dark:bg-[#172B39] h-full p-6 overflow-y-auto border-l border-[#E2EAF0] dark:border-[#304B5B] flex flex-col justify-between">
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#304B5B]">
                <div>
                  <span className="text-xs font-mono text-[#0891B2] dark:text-[#22D3EE]">
                    {selectedApt.id}
                  </span>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Appointment Details
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedApt(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Current Status</span>
                <AppointmentStatusBadge status={selectedApt.status} />
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#11202D] border border-slate-200 dark:border-[#304B5B] space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Patient:</span>
                  <Link
                    href={`/dashboard/patients/${selectedApt.patientId}`}
                    className="font-semibold text-[#0891B2] hover:underline"
                  >
                    {patientMap.get(selectedApt.patientId)?.fullName ??
                      selectedApt.patientId}
                  </Link>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Clinician:</span>
                  <span className="font-medium">
                    {doctorMap.get(selectedApt.doctorId)?.fullName ??
                      selectedApt.doctorId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Service:</span>
                  <span className="font-medium">
                    {serviceMap.get(selectedApt.serviceId)?.name ??
                      selectedApt.serviceId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date &amp; Time:</span>
                  <span className="font-mono tabular-nums font-medium">
                    {selectedApt.date} · {selectedApt.startTime}–
                    {selectedApt.endTime}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Room:</span>
                  <span className="font-mono">
                    {selectedApt.roomId ?? 'Unassigned'}
                  </span>
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <div className="font-semibold text-slate-700 dark:text-slate-300">
                  Reason for Visit (Demo)
                </div>
                <p className="p-3 rounded-lg border border-slate-200 dark:border-[#304B5B] text-slate-600 dark:text-slate-300">
                  {selectedApt.reasonForVisit}
                </p>
              </div>

              {selectedApt.status !== 'Completed' && (
                <div className="space-y-2 pt-2">
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Validated Status Transitions
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(selectedApt.status === 'Scheduled' ||
                      selectedApt.status === 'Confirmed') && (
                      <button
                        onClick={() => {
                          transitionAppointmentStatus(
                            selectedApt.id,
                            'Checked In'
                          );
                          setSelectedApt(null);
                          toast.success('Patient checked in.');
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-medium"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Check In Patient</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        const id = selectedApt.id;
                        setSelectedApt(null);
                        setQuickDialog('book_appointment', {
                          rescheduleAppointmentId: id,
                        });
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0891B2] text-white text-xs font-medium"
                    >
                      <CalendarClock className="w-3.5 h-3.5" />
                      <span>Reschedule</span>
                    </button>

                    <button
                      onClick={() => {
                        transitionAppointmentStatus(selectedApt.id, 'No-show');
                        setSelectedApt(null);
                        toast.info('Marked appointment as No-show.');
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 text-xs font-medium"
                    >
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Mark No-show</span>
                    </button>

                    <button
                      onClick={() => {
                        transitionAppointmentStatus(selectedApt.id, 'Cancelled');
                        setSelectedApt(null);
                        toast.info('Cancelled appointment.');
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 dark:text-slate-300 text-xs font-medium"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>Cancel</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedApt(null)}
              className="w-full py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] text-xs font-medium"
            >
              Close Drawer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
