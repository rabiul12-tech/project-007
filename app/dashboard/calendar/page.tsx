'use client';

import React, { useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  Coffee,
  AlertTriangle,
} from 'lucide-react';
import { useMedoraStore } from '@/stores/useMedoraStore';
import { AppointmentStatusBadge } from '@/components/ui/StatusBadge';
import { getDayOfWeekFromDateString, timeToMinutes } from '@/lib/scheduling/engine';

type CalendarViewMode = 'day' | 'week' | 'month' | 'doctor_grid';

const TIME_SLOTS = [
  '08:00',
  '08:30',
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '12:00',
  '12:30',
  '13:00',
  '13:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
  '17:00',
];

function addDays(dateStr: string, offset: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d + offset, 12, 0, 0);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(dt.getDate()).padStart(2, '0')}`;
}

export default function DoctorSchedulingCalendarPage() {
  const {
    dataset,
    ui,
    setSelectedDate,
    setQuickDialog,
  } = useMedoraStore();

  const [viewMode, setViewMode] = useState<CalendarViewMode>('doctor_grid');
  const [doctorFilter, setDoctorFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [roomFilter, setRoomFilter] = useState('all');

  const activeDoctors = useMemo(() => {
    const list = dataset.doctors.filter((d) => d.status === 'Active');
    if (doctorFilter !== 'all') {
      return list.filter((d) => d.id === doctorFilter);
    }
    return list.slice(0, 6);
  }, [dataset.doctors, doctorFilter]);

  const patientMap = useMemo(
    () => new Map(dataset.patients.map((p) => [p.id, p])),
    [dataset.patients]
  );
  const serviceMap = useMemo(
    () => new Map(dataset.services.map((s) => [s.id, s])),
    [dataset.services]
  );

  const filteredAppointments = useMemo(() => {
    return dataset.appointments.filter((apt) => {
      if (apt.status === 'Cancelled') return false;
      if (doctorFilter !== 'all' && apt.doctorId !== doctorFilter) return false;
      if (serviceFilter !== 'all' && apt.serviceId !== serviceFilter)
        return false;
      if (roomFilter !== 'all' && apt.roomId !== roomFilter) return false;
      return true;
    });
  }, [dataset.appointments, doctorFilter, serviceFilter, roomFilter]);

  // Week days starting Monday around ui.selectedDate
  const weekDates = useMemo(() => {
    const dow = getDayOfWeekFromDateString(ui.selectedDate);
    const diffToMon = dow === 0 ? -6 : 1 - dow;
    const mon = addDays(ui.selectedDate, diffToMon);
    return Array.from({ length: 6 }, (_, i) => addDays(mon, i)); // Mon..Sat
  }, [ui.selectedDate]);

  // Month dates for selectedDate's month
  const monthDays = useMemo(() => {
    const [y, m] = ui.selectedDate.split('-').map(Number);
    const daysInMonth = new Date(y, m, 0).getDate();
    return Array.from(
      { length: daysInMonth },
      (_, i) =>
        `${y}-${String(m).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`
    );
  }, [ui.selectedDate]);

  const exceptionsToday = useMemo(
    () =>
      dataset.scheduleExceptions.filter((ex) => ex.date === ui.selectedDate),
    [dataset.scheduleExceptions, ui.selectedDate]
  );

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#173042] dark:text-white">
            Doctor Scheduling Calendar
          </h1>
          <p className="text-xs text-[#64748B] dark:text-[#9BB0BE] mt-0.5">
            Click any open slot to book · Enforces working hours, break windows (12:30–13:15), and room availability
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Date Stepper */}
          <div className="inline-flex items-center rounded-lg border border-[#E2EAF0] dark:border-[#304B5B] bg-white dark:bg-[#172B39] p-0.5">
            <button
              onClick={() => setSelectedDate(addDays(ui.selectedDate, -1))}
              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-[#203847]"
              aria-label="Previous day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <input
              type="date"
              value={ui.selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-2 py-1 text-xs font-mono tabular-nums bg-transparent focus:outline-none"
            />
            <button
              onClick={() => setSelectedDate(addDays(ui.selectedDate, 1))}
              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-[#203847]"
              aria-label="Next day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* View Switcher */}
          <div className="inline-flex items-center p-1 rounded-lg bg-slate-100 dark:bg-[#11202D] border border-[#E2EAF0] dark:border-[#304B5B] text-xs">
            {(
              [
                { id: 'doctor_grid', label: 'Doctor Schedule' },
                { id: 'day', label: 'Day' },
                { id: 'week', label: 'Week' },
                { id: 'month', label: 'Month' },
              ] as const
            ).map((v) => (
              <button
                key={v.id}
                onClick={() => setViewMode(v.id)}
                className={`px-3 py-1 rounded-md font-medium transition-colors whitespace-nowrap shrink-0 ${
                  viewMode === v.id
                    ? 'bg-white dark:bg-[#172B39] text-[#0891B2] dark:text-[#22D3EE] shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>

          <button
            onClick={() =>
              setQuickDialog('book_appointment', { date: ui.selectedDate })
            }
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0891B2] hover:bg-cyan-700 text-white text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Book Slot</span>
          </button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="p-3.5 rounded-xl bg-white dark:bg-[#172B39] border border-[#E2EAF0] dark:border-[#304B5B] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            aria-label="Filter by doctor"
            value={doctorFilter}
            onChange={(e) => setDoctorFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-[#E2EAF0] dark:border-[#304B5B] bg-slate-50 dark:bg-[#11202D]"
          >
            <option value="all">All Active Clinicians</option>
            {dataset.doctors
              .filter((d) => d.status === 'Active')
              .map((d) => (
                <option key={d.id} value={d.id}>
                  {d.fullName} ({d.specialty})
                </option>
              ))}
          </select>

          <select
            aria-label="Filter by service"
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-[#E2EAF0] dark:border-[#304B5B] bg-slate-50 dark:bg-[#11202D]"
          >
            <option value="all">All Clinic Services</option>
            {dataset.services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.durationMinutes}m)
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by room"
            value={roomFilter}
            onChange={(e) => setRoomFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-[#E2EAF0] dark:border-[#304B5B] bg-slate-50 dark:bg-[#11202D]"
          >
            <option value="all">All Clinic Rooms</option>
            {dataset.rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.code} — {r.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-4 text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-1">
            <Coffee className="w-3.5 h-3.5 text-amber-600" />
            <span>Break Window: 12:30–13:15</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-[#0891B2]" />
            <span>Current Time Indicator: 10:15</span>
          </span>
        </div>
      </div>

      {/* Holiday / Exception Notice */}
      {exceptionsToday.length > 0 && (
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <div>
            {exceptionsToday.map((ex) => (
              <span key={ex.id} className="mr-4">
                <strong>{ex.title}:</strong>{' '}
                {ex.isClosedAllDay
                  ? 'All-day clinic holiday closure'
                  : `Blocked ${ex.blockedStart}–${ex.blockedEnd}`}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 1: DOCTOR SCHEDULE GRID OR DAY VIEW */}
      {(viewMode === 'doctor_grid' || viewMode === 'day') && (
        <div className="rounded-xl bg-white dark:bg-[#172B39] border border-[#E2EAF0] dark:border-[#304B5B] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E2EAF0] dark:border-[#304B5B] bg-slate-50 dark:bg-[#11202D]">
                  <th className="py-3 px-3 text-left font-medium text-slate-500 w-20">
                    Time
                  </th>
                  {activeDoctors.map((doc) => (
                    <th
                      key={doc.id}
                      className="py-3 px-3 text-left font-semibold text-slate-900 dark:text-white border-l border-[#E2EAF0] dark:border-[#304B5B] min-w-[200px]"
                    >
                      <div className="truncate">{doc.fullName}</div>
                      <div className="text-[11px] font-normal text-slate-500 truncate">
                        {doc.specialty} · Room {doc.assignedRoomId}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#304B5B]">
                {TIME_SLOTS.map((slot) => {
                  const isBreakSlot = slot === '12:30' || slot === '13:00';
                  const isCurrentTimeRow = slot === '10:00';
                  const slotMins = timeToMinutes(slot);

                  return (
                    <tr
                      key={slot}
                      className={
                        isBreakSlot
                          ? 'bg-amber-50/40 dark:bg-amber-950/20'
                          : isCurrentTimeRow
                          ? 'bg-cyan-50/30 dark:bg-cyan-950/20'
                          : ''
                      }
                    >
                      <td className="py-2.5 px-3 font-mono tabular-nums text-slate-500 whitespace-nowrap align-top">
                        <div>{slot}</div>
                        {isCurrentTimeRow && (
                          <span className="text-[10px] font-sans font-semibold text-[#0891B2]">
                            Now
                          </span>
                        )}
                      </td>

                      {activeDoctors.map((doc) => {
                        if (isBreakSlot) {
                          return (
                            <td
                              key={doc.id}
                              className="py-2 px-3 border-l border-[#E2EAF0] dark:border-[#304B5B] text-[11px] text-amber-700 dark:text-amber-300"
                            >
                              Clinician Break (12:30–13:15)
                            </td>
                          );
                        }

                        // Find appointment overlapping this 30-min slot for this doctor on selectedDate
                        const apt = filteredAppointments.find((a) => {
                          if (
                            a.date !== ui.selectedDate ||
                            a.doctorId !== doc.id
                          )
                            return false;
                          const aStart = timeToMinutes(a.startTime);
                          const aEnd = timeToMinutes(a.endTime);
                          return aStart < slotMins + 30 && slotMins < aEnd;
                        });

                        if (apt) {
                          const pat = patientMap.get(apt.patientId);
                          const srv = serviceMap.get(apt.serviceId);
                          return (
                            <td
                              key={doc.id}
                              className="p-1.5 border-l border-[#E2EAF0] dark:border-[#304B5B] align-top"
                            >
                              <div className="p-2.5 rounded-lg bg-[#EAF8FB] dark:bg-[#203847] border border-cyan-200 dark:border-cyan-800 space-y-1">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="font-mono tabular-nums font-semibold text-[11px] text-[#0891B2] dark:text-[#22D3EE]">
                                    {apt.startTime}–{apt.endTime}
                                  </span>
                                  <AppointmentStatusBadge status={apt.status} />
                                </div>
                                <div className="font-semibold text-slate-900 dark:text-white truncate">
                                  {pat?.fullName ?? apt.patientId}
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-300 truncate">
                                  {srv?.name ?? apt.serviceId}
                                </div>
                                {apt.status !== 'Completed' && (
                                  <div className="pt-1 flex justify-end">
                                    <button
                                      onClick={() =>
                                        setQuickDialog('book_appointment', {
                                          rescheduleAppointmentId: apt.id,
                                        })
                                      }
                                      className="text-[11px] font-medium text-[#0891B2] dark:text-[#22D3EE] hover:underline"
                                    >
                                      Reschedule
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                          );
                        }

                        // Open bookable slot
                        return (
                          <td
                            key={doc.id}
                            className="p-1.5 border-l border-[#E2EAF0] dark:border-[#304B5B]"
                          >
                            <button
                              onClick={() =>
                                setQuickDialog('book_appointment', {
                                  doctorId: doc.id,
                                  serviceId: doc.serviceIds[0],
                                  roomId: doc.assignedRoomId,
                                  date: ui.selectedDate,
                                  startTime: slot,
                                })
                              }
                              className="w-full py-2 px-2.5 rounded-lg border border-dashed border-slate-200 dark:border-[#304B5B] hover:border-[#0891B2] hover:bg-cyan-50/40 dark:hover:bg-[#203847]/50 text-left text-[11px] text-slate-400 hover:text-[#0891B2] transition-colors"
                            >
                              + Available {slot}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: WEEK VIEW */}
      {viewMode === 'week' && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {weekDates.map((dStr) => {
            const dayApts = filteredAppointments
              .filter((a) => a.date === dStr)
              .sort((a, b) => a.startTime.localeCompare(b.startTime));
            const isSelected = dStr === ui.selectedDate;
            return (
              <div
                key={dStr}
                className={`rounded-xl border p-3.5 space-y-3 bg-white dark:bg-[#172B39] ${
                  isSelected
                    ? 'border-[#0891B2]'
                    : 'border-[#E2EAF0] dark:border-[#304B5B]'
                }`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#304B5B]">
                  <button
                    onClick={() => setSelectedDate(dStr)}
                    className="font-mono tabular-nums font-bold text-xs hover:text-[#0891B2]"
                  >
                    {dStr}
                  </button>
                  <span className="text-[11px] text-slate-500">
                    {dayApts.length} visits
                  </span>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {dayApts.map((apt) => (
                    <div
                      key={apt.id}
                      className="p-2 rounded-lg bg-slate-50 dark:bg-[#11202D] border border-slate-200 dark:border-[#304B5B] text-xs space-y-1"
                    >
                      <div className="font-mono tabular-nums text-[11px] font-semibold text-[#0891B2]">
                        {apt.startTime}–{apt.endTime}
                      </div>
                      <div className="font-medium truncate">
                        {patientMap.get(apt.patientId)?.fullName ??
                          apt.patientId}
                      </div>
                      <AppointmentStatusBadge status={apt.status} />
                    </div>
                  ))}
                  <button
                    onClick={() =>
                      setQuickDialog('book_appointment', { date: dStr })
                    }
                    className="w-full py-1.5 rounded-lg border border-dashed border-slate-300 dark:border-[#304B5B] text-[11px] text-slate-500 hover:text-[#0891B2]"
                  >
                    + Book on {dStr.slice(5)}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 3: MONTH VIEW */}
      {viewMode === 'month' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {monthDays.map((dStr) => {
            const dayApts = filteredAppointments.filter((a) => a.date === dStr);
            const holiday = dataset.scheduleExceptions.find(
              (ex) => ex.date === dStr && ex.isClosedAllDay
            );
            return (
              <div
                key={dStr}
                onClick={() => {
                  setSelectedDate(dStr);
                  setViewMode('doctor_grid');
                }}
                className="cursor-pointer p-3 rounded-xl bg-white dark:bg-[#172B39] border border-[#E2EAF0] dark:border-[#304B5B] hover:border-[#0891B2] min-h-28 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono tabular-nums font-semibold">
                    {dStr.slice(8)}
                  </span>
                  {dayApts.length > 0 && (
                    <span className="text-[11px] font-mono tabular-nums text-[#0891B2]">
                      {dayApts.length} booked
                    </span>
                  )}
                </div>
                {holiday ? (
                  <div className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">
                    Closed: {holiday.title}
                  </div>
                ) : (
                  <div className="space-y-1 mt-2">
                    {dayApts.slice(0, 2).map((a) => (
                      <div
                        key={a.id}
                        className="text-[10px] truncate px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#11202D]"
                      >
                        {a.startTime}{' '}
                        {patientMap.get(a.patientId)?.fullName.split(' ')[0]}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
