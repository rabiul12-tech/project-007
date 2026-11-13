'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import {
  Calendar,
  UserCheck,
  Clock,
  Stethoscope,
  CheckCircle2,
  UserRound,
  Receipt,
  CreditCard,
  Plus,
  ArrowRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { useMedoraStore } from '@/stores/useMedoraStore';
import { formatCurrency } from '@/lib/calculations/billing';
import { AppointmentStatusBadge } from '@/components/ui/StatusBadge';

export default function DashboardOverviewPage() {
  const {
    dataset,
    settings,
    ui,
    setQuickDialog,
    transitionAppointmentStatus,
  } = useMedoraStore();

  const selectedDate = ui.selectedDate;

  const todaysAppointments = useMemo(
    () =>
      dataset.appointments
        .filter((a) => a.date === selectedDate)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [dataset.appointments, selectedDate]
  );

  const metrics = useMemo(() => {
    const checkedIn = todaysAppointments.filter(
      (a) => a.status === 'Checked In'
    ).length;
    const waiting = todaysAppointments.filter(
      (a) => a.status === 'Waiting'
    ).length;
    const inConsultation = todaysAppointments.filter(
      (a) => a.status === 'In Consultation'
    ).length;
    const completedToday = todaysAppointments.filter(
      (a) => a.status === 'Completed'
    ).length;
    const availableDoctors = dataset.doctors.filter(
      (d) => d.status === 'Active'
    ).length;

    const pendingInvoices = dataset.invoices.filter(
      (i) => i.status === 'Issued' || i.status === 'Partially Paid'
    );
    const pendingBalance = pendingInvoices.reduce(
      (acc, i) => acc + i.outstandingBalance,
      0
    );

    const collectedPayments = dataset.payments
      .filter((p) => !p.isReversed)
      .reduce((acc, p) => acc + p.amount, 0);

    return {
      totalToday: todaysAppointments.length,
      checkedIn,
      waiting,
      inConsultation,
      completedToday,
      availableDoctors,
      pendingInvoicesCount: pendingInvoices.length,
      pendingBalance,
      collectedPayments,
    };
  }, [todaysAppointments, dataset.doctors, dataset.invoices, dataset.payments]);

  // Appointment Trend by Month/Week from actual dataset
  const trendData = useMemo(() => {
    const map = new Map<string, { period: string; total: number; completed: number }>();
    for (const apt of dataset.appointments) {
      const monthKey = apt.date.slice(0, 7); // YYYY-MM
      const existing = map.get(monthKey) || {
        period: monthKey,
        total: 0,
        completed: 0,
      };
      existing.total += 1;
      if (apt.status === 'Completed') existing.completed += 1;
      map.set(monthKey, existing);
    }
    return Array.from(map.values()).sort((a, b) =>
      a.period.localeCompare(b.period)
    );
  }, [dataset.appointments]);

  // Status distribution across all appointments
  const statusDistribution = useMemo(() => {
    const counts: Record<string, number> = {
      Completed: 0,
      Scheduled: 0,
      Confirmed: 0,
      Waiting: 0,
      'Checked In': 0,
      'In Consultation': 0,
      'No-show': 0,
      Cancelled: 0,
    };
    for (const a of dataset.appointments) {
      counts[a.status] = (counts[a.status] || 0) + 1;
    }
    return [
      { status: 'Completed', count: counts.Completed, color: '#059669' },
      { status: 'Scheduled', count: counts.Scheduled, color: '#0891B2' },
      { status: 'Confirmed', count: counts.Confirmed, color: '#0D9488' },
      {
        status: 'Active Queue',
        count:
          counts.Waiting + counts['Checked In'] + counts['In Consultation'],
        color: '#D97706',
      },
      { status: 'No-show', count: counts['No-show'], color: '#DC2626' },
      { status: 'Cancelled', count: counts.Cancelled, color: '#64748B' },
    ];
  }, [dataset.appointments]);

  // Doctor workload from actual dataset
  const doctorWorkload = useMemo(() => {
    return dataset.doctors
      .filter((d) => d.status === 'Active')
      .slice(0, 6)
      .map((doc) => {
        const total = dataset.appointments.filter(
          (a) => a.doctorId === doc.id && a.status !== 'Cancelled'
        ).length;
        const todayCount = todaysAppointments.filter(
          (a) => a.doctorId === doc.id && a.status !== 'Cancelled'
        ).length;
        return {
          id: doc.id,
          name: doc.fullName.replace('Dr. ', ''),
          specialty: doc.specialty,
          total,
          todayCount,
        };
      });
  }, [dataset.doctors, dataset.appointments, todaysAppointments]);

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

  return (
    <div className="space-y-6">
      {/* Page Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#173042] dark:text-white">
            Clinic Operations Overview
          </h1>
          <p className="text-xs text-[#64748B] dark:text-[#9BB0BE] mt-0.5">
            Live metrics computed from {dataset.appointments.length} appointments,{' '}
            {dataset.patients.length} fictional patients, and{' '}
            {dataset.invoices.length} invoices · Active Date: {selectedDate}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setQuickDialog('book_appointment')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0891B2] hover:bg-cyan-700 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Book Appointment</span>
          </button>
          <button
            onClick={() => setQuickDialog('add_patient')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E2EAF0] dark:border-[#304B5B] bg-white dark:bg-[#172B39] hover:border-[#0891B2] text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors whitespace-nowrap shrink-0"
          >
            <span>Register Patient</span>
          </button>
          <Link
            href="/dashboard/queue"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E2EAF0] dark:border-[#304B5B] bg-white dark:bg-[#172B39] hover:border-[#0891B2] text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors whitespace-nowrap shrink-0"
          >
            <span>Open Reception Queue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 8 KPI Cards derived strictly from actual application records */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-white dark:bg-[#172B39] border border-[#E2EAF0] dark:border-[#304B5B]">
          <div className="flex items-center justify-between text-xs text-[#64748B] dark:text-[#9BB0BE]">
            <span>Today&apos;s Appointments</span>
            <Calendar className="w-4 h-4 text-[#0891B2]" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums mt-2">
            {metrics.totalToday}
          </div>
          <div className="text-[11px] text-[#64748B] dark:text-[#9BB0BE] mt-1">
            Scheduled on {selectedDate}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#172B39] border border-[#E2EAF0] dark:border-[#304B5B]">
          <div className="flex items-center justify-between text-xs text-[#64748B] dark:text-[#9BB0BE]">
            <span>Checked-In Patients</span>
            <UserCheck className="w-4 h-4 text-[#0D9488]" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums mt-2">
            {metrics.checkedIn}
          </div>
          <div className="text-[11px] text-[#64748B] dark:text-[#9BB0BE] mt-1">
            Arrived at front desk
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#172B39] border border-[#E2EAF0] dark:border-[#304B5B]">
          <div className="flex items-center justify-between text-xs text-[#64748B] dark:text-[#9BB0BE]">
            <span>Waiting Patients</span>
            <Clock className="w-4 h-4 text-[#D97706]" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums mt-2">
            {metrics.waiting}
          </div>
          <div className="text-[11px] text-[#64748B] dark:text-[#9BB0BE] mt-1">
            Ready in reception lounge
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#172B39] border border-[#E2EAF0] dark:border-[#304B5B]">
          <div className="flex items-center justify-between text-xs text-[#64748B] dark:text-[#9BB0BE]">
            <span>In Consultation</span>
            <Stethoscope className="w-4 h-4 text-[#0891B2]" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums mt-2">
            {metrics.inConsultation}
          </div>
          <div className="text-[11px] text-[#64748B] dark:text-[#9BB0BE] mt-1">
            Active room sessions
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#172B39] border border-[#E2EAF0] dark:border-[#304B5B]">
          <div className="flex items-center justify-between text-xs text-[#64748B] dark:text-[#9BB0BE]">
            <span>Completed Today</span>
            <CheckCircle2 className="w-4 h-4 text-[#059669]" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums mt-2">
            {metrics.completedToday}
          </div>
          <div className="text-[11px] text-[#64748B] dark:text-[#9BB0BE] mt-1">
            Total history: {dataset.visits.length} visits
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#172B39] border border-[#E2EAF0] dark:border-[#304B5B]">
          <div className="flex items-center justify-between text-xs text-[#64748B] dark:text-[#9BB0BE]">
            <span>Available Doctors</span>
            <UserRound className="w-4 h-4 text-[#0891B2]" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums mt-2">
            {metrics.availableDoctors} / {dataset.doctors.length}
          </div>
          <div className="text-[11px] text-[#64748B] dark:text-[#9BB0BE] mt-1">
            Active roster clinicians
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#172B39] border border-[#E2EAF0] dark:border-[#304B5B]">
          <div className="flex items-center justify-between text-xs text-[#64748B] dark:text-[#9BB0BE]">
            <span>Pending Invoices ({metrics.pendingInvoicesCount})</span>
            <Receipt className="w-4 h-4 text-[#D97706]" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums mt-2">
            {formatCurrency(metrics.pendingBalance, settings.currency)}
          </div>
          <div className="text-[11px] text-[#64748B] dark:text-[#9BB0BE] mt-1">
            Outstanding demo balance
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#172B39] border border-[#E2EAF0] dark:border-[#304B5B]">
          <div className="flex items-center justify-between text-xs text-[#64748B] dark:text-[#9BB0BE]">
            <span>Collected Payments</span>
            <CreditCard className="w-4 h-4 text-[#059669]" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums mt-2">
            {formatCurrency(metrics.collectedPayments, settings.currency)}
          </div>
          <div className="text-[11px] text-[#64748B] dark:text-[#9BB0BE] mt-1">
            {dataset.payments.filter((p) => !p.isReversed).length} valid receipts
          </div>
        </div>
      </div>

      {/* Charts Row: Appointment Trend + Status Distribution + Doctor Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5 p-5 rounded-xl bg-white dark:bg-[#172B39] border border-[#E2EAF0] dark:border-[#304B5B]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-[#173042] dark:text-white">
                Appointment Volume Trend
              </h2>
              <p className="text-xs text-[#64748B] dark:text-[#9BB0BE]">
                Monthly total bookings vs completed visits
              </p>
            </div>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <XAxis
                  dataKey="period"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="total"
                  name="Total Booked"
                  stroke="#0891B2"
                  fill="#0891B2"
                  fillOpacity={0.18}
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  name="Completed"
                  stroke="#059669"
                  fill="#059669"
                  fillOpacity={0.22}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 p-5 rounded-xl bg-white dark:bg-[#172B39] border border-[#E2EAF0] dark:border-[#304B5B]">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-[#173042] dark:text-white">
              Appointment Status Distribution
            </h2>
            <p className="text-xs text-[#64748B] dark:text-[#9BB0BE]">
              Across all {dataset.appointments.length} clinic records
            </p>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusDistribution} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis
                  type="category"
                  dataKey="status"
                  width={90}
                  tick={{ fontSize: 11, fill: '#64748B' }}
                />
                <Tooltip />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {statusDistribution.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-3 p-5 rounded-xl bg-white dark:bg-[#172B39] border border-[#E2EAF0] dark:border-[#304B5B] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[#173042] dark:text-white">
                Doctor Workload
              </h2>
              <Link
                href="/dashboard/doctors"
                className="text-xs text-[#0891B2] hover:underline"
              >
                All Doctors →
              </Link>
            </div>
            <div className="space-y-3">
              {doctorWorkload.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between text-xs pb-2 border-b border-slate-100 dark:border-[#304B5B] last:border-none"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-slate-900 dark:text-slate-100 truncate">
                      Dr. {doc.name}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {doc.specialty}
                    </div>
                  </div>
                  <div className="text-right font-mono tabular-nums shrink-0 ml-2">
                    <div className="font-semibold text-[#0891B2] dark:text-[#22D3EE]">
                      {doc.todayCount} today
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {doc.total} total
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Today's Schedule Table + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 rounded-xl bg-white dark:bg-[#172B39] border border-[#E2EAF0] dark:border-[#304B5B] overflow-hidden">
          <div className="p-4 border-b border-[#E2EAF0] dark:border-[#304B5B] flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[#173042] dark:text-white">
                Today&apos;s Outpatient Schedule ({selectedDate})
              </h2>
              <p className="text-xs text-[#64748B] dark:text-[#9BB0BE]">
                Direct check-in and consultation actions update the shared clinic queue
              </p>
            </div>
            <Link
              href="/dashboard/appointments"
              className="text-xs font-medium text-[#0891B2] hover:underline"
            >
              View All Appointments →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E2EAF0] dark:border-[#304B5B] bg-slate-50/70 dark:bg-[#11202D] text-[#64748B] dark:text-[#9BB0BE]">
                  <th className="py-2.5 px-3 font-medium">Time</th>
                  <th className="py-2.5 px-3 font-medium">Patient</th>
                  <th className="py-2.5 px-3 font-medium">Doctor</th>
                  <th className="py-2.5 px-3 font-medium">Service</th>
                  <th className="py-2.5 px-3 font-medium">Status</th>
                  <th className="py-2.5 px-3 font-medium text-right">
                    Quick Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#304B5B]">
                {todaysAppointments.slice(0, 10).map((apt) => {
                  const pat = patientMap.get(apt.patientId);
                  const doc = doctorMap.get(apt.doctorId);
                  const srv = serviceMap.get(apt.serviceId);
                  return (
                    <tr
                      key={apt.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-[#203847]/60"
                    >
                      <td className="py-2.5 px-3 font-mono tabular-nums whitespace-nowrap font-medium">
                        {apt.startTime}–{apt.endTime}
                      </td>
                      <td className="py-2.5 px-3">
                        <Link
                          href={`/dashboard/patients/${apt.patientId}`}
                          className="font-medium text-slate-900 dark:text-slate-100 hover:text-[#0891B2]"
                        >
                          {pat?.fullName ?? apt.patientId}
                        </Link>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                        {doc?.fullName ?? apt.doctorId}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 truncate max-w-[180px]">
                        {srv?.name ?? apt.serviceId}
                      </td>
                      <td className="py-2.5 px-3">
                        <AppointmentStatusBadge status={apt.status} />
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        {(apt.status === 'Scheduled' ||
                          apt.status === 'Confirmed') && (
                          <button
                            onClick={() =>
                              transitionAppointmentStatus(apt.id, 'Checked In')
                            }
                            className="px-2.5 py-1 rounded-md bg-teal-600 hover:bg-teal-700 text-white font-medium"
                          >
                            Check In
                          </button>
                        )}
                        {(apt.status === 'Checked In' ||
                          apt.status === 'Waiting') && (
                          <button
                            onClick={() =>
                              transitionAppointmentStatus(
                                apt.id,
                                'In Consultation'
                              )
                            }
                            className="px-2.5 py-1 rounded-md bg-[#0891B2] hover:bg-cyan-700 text-white font-medium"
                          >
                            Start Consult
                          </button>
                        )}
                        {apt.status === 'In Consultation' && (
                          <button
                            onClick={() =>
                              transitionAppointmentStatus(apt.id, 'Completed')
                            }
                            className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                          >
                            Complete
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {todaysAppointments.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-8 text-center text-slate-500 dark:text-slate-400"
                    >
                      No appointments scheduled for {selectedDate}. Use &ldquo;Book Appointment&rdquo; to schedule a visit.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="lg:col-span-4 rounded-xl bg-white dark:bg-[#172B39] border border-[#E2EAF0] dark:border-[#304B5B] p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E2EAF0] dark:border-[#304B5B]">
              <h2 className="text-sm font-semibold text-[#173042] dark:text-white">
                Recent Clinic Activity
              </h2>
              <Link
                href="/dashboard/activity"
                className="text-xs text-[#0891B2] hover:underline"
              >
                Full Feed →
              </Link>
            </div>
            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {dataset.activities.slice(0, 8).map((act) => (
                <div
                  key={act.id}
                  className="text-xs pb-2.5 border-b border-slate-100 dark:border-[#304B5B] last:border-none"
                >
                  <div className="font-medium text-slate-900 dark:text-slate-100">
                    {act.title}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {act.description}
                  </div>
                  <div className="text-[10px] font-mono tabular-nums text-slate-400 mt-0.5">
                    {act.actorName} · {act.timestamp.slice(0, 16).replace('T', ' ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
