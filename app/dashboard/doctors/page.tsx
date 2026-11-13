'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Plus,
  Calendar,
  Clock,
  Edit3,
  Archive,
  X,
  CheckCircle2,
} from 'lucide-react';
import { useMedoraStore } from '@/stores/useMedoraStore';
import { DaySchedule, Doctor, DoctorStatus } from '@/types/medora';
import { DoctorStatusBadge } from '@/components/ui/StatusBadge';

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export default function DoctorsManagementPage() {
  const {
    dataset,
    setQuickDialog,
    updateDoctor,
    archiveDoctor,
    updateDoctorAvailability,
  } = useMedoraStore();

  const [editingDoc, setEditingDoc] = useState<Doctor | null>(null);
  const [scheduleDocId, setScheduleDocId] = useState<string | null>(null);
  const [scheduleDraft, setScheduleDraft] = useState<DaySchedule[]>([]);

  const serviceMap = useMemo(
    () => new Map(dataset.services.map((s) => [s.id, s])),
    [dataset.services]
  );
  const roomMap = useMemo(
    () => new Map(dataset.rooms.map((r) => [r.id, r])),
    [dataset.rooms]
  );

  const openScheduleEditor = (docId: string) => {
    const avail = dataset.availabilities.find((a) => a.doctorId === docId);
    setScheduleDocId(docId);
    setScheduleDraft(
      avail?.weeklySchedule
        ? avail.weeklySchedule.map((d) => ({ ...d }))
        : []
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#173042] dark:text-white">
            Clinician Directory &amp; Schedules (Demo)
          </h1>
          <p className="text-xs text-[#64748B] dark:text-[#9BB0BE] mt-0.5">
            {dataset.doctors.length} fictional clinicians · Configure working hours, break windows, and assigned outpatient services
          </p>
        </div>

        <button
          onClick={() => setQuickDialog('add_doctor')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0891B2] hover:bg-cyan-700 text-white text-xs font-semibold"
        >
          <Plus className="w-4 h-4" />
          <span>Add Fictional Clinician</span>
        </button>
      </div>

      {/* Clinicians Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dataset.doctors.map((doc) => {
          const aptCount = dataset.appointments.filter(
            (a) => a.doctorId === doc.id && a.status !== 'Cancelled'
          ).length;
          const room = doc.assignedRoomId
            ? roomMap.get(doc.assignedRoomId)
            : undefined;
          const avail = dataset.availabilities.find(
            (a) => a.doctorId === doc.id
          );
          const workingDaysCount =
            avail?.weeklySchedule.filter((d) => d.isWorking).length ?? 5;

          return (
            <div
              key={doc.id}
              className="p-5 rounded-xl bg-white dark:bg-[#172B39] border border-[#E2EAF0] dark:border-[#304B5B] flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-xl text-white font-bold text-sm flex items-center justify-center shrink-0"
                      style={{ backgroundColor: doc.colorTag || '#0891B2' }}
                    >
                      {doc.avatarInitials}
                    </div>
                    <div>
                      <h2 className="font-bold text-sm text-[#173042] dark:text-white">
                        {doc.fullName}
                      </h2>
                      <p className="text-xs text-[#0891B2] dark:text-[#22D3EE]">
                        {doc.specialty}
                      </p>
                    </div>
                  </div>
                  <DoctorStatusBadge status={doc.status} />
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-300 leading-relaxed">
                  {doc.bio}
                </p>

                <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-slate-50 dark:bg-[#11202D] text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">
                      Consult Duration
                    </span>
                    <span className="font-mono font-semibold">
                      {doc.defaultConsultationDuration} mins
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">
                      Total Bookings
                    </span>
                    <span className="font-mono font-semibold">
                      {aptCount} appointments
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">
                      Assigned Room
                    </span>
                    <span className="font-mono">
                      {room ? room.code : doc.assignedRoomId ?? '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">
                      Weekly Schedule
                    </span>
                    <span>{workingDaysCount} days/wk</span>
                  </div>
                </div>

                <div className="text-xs">
                  <span className="text-slate-400 text-[11px] block mb-1">
                    Assigned Clinic Services ({doc.serviceIds.length}):
                  </span>
                  <div className="text-slate-600 dark:text-slate-300 truncate">
                    {doc.serviceIds
                      .map((id) => serviceMap.get(id)?.name ?? id)
                      .join(' · ')}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-[#304B5B] flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openScheduleEditor(doc.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#EAF8FB] dark:bg-[#203847] text-[#0891B2] dark:text-[#22D3EE] font-medium"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Availability</span>
                  </button>
                  <Link
                    href="/dashboard/calendar"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#304B5B] font-medium"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Calendar</span>
                  </Link>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditingDoc(doc)}
                    className="p-1.5 rounded border border-slate-200 dark:border-[#304B5B]"
                    aria-label={`Edit ${doc.fullName}`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  {doc.status !== 'Archived' && (
                    <button
                      onClick={() => {
                        archiveDoctor(doc.id);
                        toast.info(`Archived clinician ${doc.fullName}`);
                      }}
                      className="p-1.5 rounded border border-slate-200 dark:border-[#304B5B] text-rose-600"
                      aria-label={`Archive ${doc.fullName}`}
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Doctor Modal */}
      {editingDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-xl bg-white dark:bg-[#172B39] border border-slate-200 dark:border-[#304B5B] p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#304B5B]">
              <h2 className="text-base font-bold">
                Edit Clinician ({editingDoc.id})
              </h2>
              <button onClick={() => setEditingDoc(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                updateDoctor(editingDoc.id, {
                  fullName: editingDoc.fullName,
                  specialty: editingDoc.specialty,
                  defaultConsultationDuration:
                    editingDoc.defaultConsultationDuration,
                  status: editingDoc.status,
                  assignedRoomId: editingDoc.assignedRoomId,
                });
                toast.success(`Updated ${editingDoc.fullName}`);
                setEditingDoc(null);
              }}
            >
              <div>
                <label className="block font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  value={editingDoc.fullName}
                  onChange={(e) =>
                    setEditingDoc({ ...editingDoc, fullName: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">Specialty</label>
                  <input
                    type="text"
                    value={editingDoc.specialty}
                    onChange={(e) =>
                      setEditingDoc({
                        ...editingDoc,
                        specialty: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D]"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Status</label>
                  <select
                    value={editingDoc.status}
                    onChange={(e) =>
                      setEditingDoc({
                        ...editingDoc,
                        status: e.target.value as DoctorStatus,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D]"
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingDoc(null)}
                  className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-lg bg-[#0891B2] text-white font-semibold"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Weekly Schedule Availability Modal */}
      {scheduleDocId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-2xl rounded-xl bg-white dark:bg-[#172B39] border border-slate-200 dark:border-[#304B5B] p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#304B5B]">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Configure Weekly Schedule &amp; Breaks
                </h2>
                <p className="text-slate-500">
                  Changes immediately govern slot generation and conflict validation in the scheduling engine.
                </p>
              </div>
              <button onClick={() => setScheduleDocId(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {scheduleDraft.map((day, idx) => (
                <div
                  key={day.dayOfWeek}
                  className="grid grid-cols-1 sm:grid-cols-12 items-center gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-[#11202D] border border-slate-200 dark:border-[#304B5B]"
                >
                  <label className="sm:col-span-3 flex items-center gap-2 font-semibold">
                    <input
                      type="checkbox"
                      checked={day.isWorking}
                      onChange={(e) => {
                        const next = [...scheduleDraft];
                        next[idx] = {
                          ...day,
                          isWorking: e.target.checked,
                        };
                        setScheduleDraft(next);
                      }}
                    />
                    <span>{DAY_NAMES[day.dayOfWeek]}</span>
                  </label>

                  {day.isWorking ? (
                    <>
                      <div className="sm:col-span-4 flex items-center gap-1.5">
                        <span className="text-slate-400">Hours:</span>
                        <input
                          type="time"
                          value={day.startTime}
                          onChange={(e) => {
                            const next = [...scheduleDraft];
                            next[idx] = { ...day, startTime: e.target.value };
                            setScheduleDraft(next);
                          }}
                          className="px-2 py-1 rounded border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#172B39] font-mono"
                        />
                        <span>–</span>
                        <input
                          type="time"
                          value={day.endTime}
                          onChange={(e) => {
                            const next = [...scheduleDraft];
                            next[idx] = { ...day, endTime: e.target.value };
                            setScheduleDraft(next);
                          }}
                          className="px-2 py-1 rounded border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#172B39] font-mono"
                        />
                      </div>

                      <div className="sm:col-span-5 flex items-center gap-1.5">
                        <span className="text-slate-400">Break:</span>
                        <input
                          type="time"
                          value={day.breakStart || '12:30'}
                          onChange={(e) => {
                            const next = [...scheduleDraft];
                            next[idx] = { ...day, breakStart: e.target.value };
                            setScheduleDraft(next);
                          }}
                          className="px-2 py-1 rounded border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#172B39] font-mono"
                        />
                        <span>–</span>
                        <input
                          type="time"
                          value={day.breakEnd || '13:15'}
                          onChange={(e) => {
                            const next = [...scheduleDraft];
                            next[idx] = { ...day, breakEnd: e.target.value };
                            setScheduleDraft(next);
                          }}
                          className="px-2 py-1 rounded border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#172B39] font-mono"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="sm:col-span-9 text-slate-400 italic">
                      Off duty / Non-working day
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-[#304B5B]">
              <button
                onClick={() => setScheduleDocId(null)}
                className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  updateDoctorAvailability(scheduleDocId, scheduleDraft);
                  toast.success('Updated weekly clinician schedule.');
                  setScheduleDocId(null);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0891B2] text-white font-semibold"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Schedule</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
