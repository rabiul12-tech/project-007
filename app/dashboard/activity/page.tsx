'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, Activity as ActivityIcon } from 'lucide-react';
import { useMedoraStore } from '@/stores/useMedoraStore';
import { ActivityEventType } from '@/types/medora';

export default function ActivityTimelinePage() {
  const { dataset } = useMedoraStore();

  const [typeFilter, setTypeFilter] = useState<'all' | ActivityEventType>('all');
  const [dateFilter, setDateFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredActivities = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return dataset.activities.filter((act) => {
      if (typeFilter !== 'all' && act.type !== typeFilter) return false;
      if (dateFilter && !act.timestamp.startsWith(dateFilter)) return false;
      if (q) {
        const hay = `${act.title} ${act.description} ${act.actorName}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [dataset.activities, typeFilter, dateFilter, searchQuery]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#173042] dark:text-white">
          Local Operational Activity Feed
        </h1>
        <p className="text-xs text-[#64748B] dark:text-[#9BB0BE] mt-0.5">
          {filteredActivities.length} administrative events recorded in browser LocalStorage · Local operational log, not a tamper-proof clinical audit trail
        </p>
      </div>

      {/* Filters */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#172B39] border border-[#E2EAF0] dark:border-[#304B5B] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search event title, description, or actor..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#E2EAF0] dark:border-[#304B5B] bg-slate-50 dark:bg-[#11202D]"
          />
        </div>

        <select
          aria-label="Filter by event type"
          value={typeFilter}
          onChange={(e) =>
            setTypeFilter(e.target.value as 'all' | ActivityEventType)
          }
          className="px-3 py-2 rounded-lg border border-[#E2EAF0] dark:border-[#304B5B] bg-white dark:bg-[#11202D]"
        >
          <option value="all">All Event Categories</option>
          <option value="patient_registered">Patient Registered</option>
          <option value="appointment_booked">Appointment Booked</option>
          <option value="appointment_rescheduled">
            Appointment Rescheduled
          </option>
          <option value="patient_checked_in">Patient Checked In</option>
          <option value="consultation_started">Consultation Started</option>
          <option value="consultation_completed">Consultation Completed</option>
          <option value="invoice_created">Invoice Created</option>
          <option value="payment_recorded">Payment Recorded</option>
          <option value="schedule_updated">Schedule Updated</option>
        </select>

        <input
          type="date"
          aria-label="Filter by activity date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-[#E2EAF0] dark:border-[#304B5B] bg-white dark:bg-[#11202D] font-mono tabular-nums"
        />
      </div>

      {/* Activity Feed */}
      <div className="rounded-xl bg-white dark:bg-[#172B39] border border-[#E2EAF0] dark:border-[#304B5B] divide-y divide-slate-100 dark:divide-[#304B5B] text-xs">
        {filteredActivities.slice(0, 60).map((act) => (
          <div
            key={act.id}
            className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-[#203847]/50"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-[#EAF8FB] dark:bg-[#203847] text-[#0891B2] dark:text-[#22D3EE] shrink-0">
                <ActivityIcon className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <div className="font-semibold text-slate-900 dark:text-white">
                  {act.title}
                </div>
                <div className="text-slate-500 dark:text-slate-300">
                  {act.description}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="text-slate-400">
                    Actor: <strong>{act.actorName}</strong> ({act.actorRole})
                  </span>
                  {act.relatedPatientId && (
                    <Link
                      href={`/dashboard/patients/${act.relatedPatientId}`}
                      className="text-[#0891B2] hover:underline"
                    >
                      Patient {act.relatedPatientId} →
                    </Link>
                  )}
                  {act.relatedAppointmentId && (
                    <Link
                      href="/dashboard/appointments"
                      className="text-[#0891B2] hover:underline"
                    >
                      Appointment {act.relatedAppointmentId} →
                    </Link>
                  )}
                  {act.relatedInvoiceId && (
                    <Link
                      href="/dashboard/billing"
                      className="text-[#0891B2] hover:underline"
                    >
                      Invoice {act.relatedInvoiceId} →
                    </Link>
                  )}
                </div>
              </div>
            </div>

            <div className="font-mono tabular-nums text-slate-400 shrink-0 sm:text-right">
              <div>{act.timestamp.slice(0, 10)}</div>
              <div className="text-[11px]">{act.timestamp.slice(11, 16)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
