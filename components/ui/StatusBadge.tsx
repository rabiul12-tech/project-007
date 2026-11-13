'use client';

import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  UserCheck,
  Stethoscope,
  CalendarCheck,
  FileText,
  Ban,
} from 'lucide-react';
import {
  AppointmentStatus,
  DoctorStatus,
  InvoiceStatus,
  PatientStatus,
} from '@/types/medora';

export function AppointmentStatusBadge({
  status,
}: {
  status: AppointmentStatus;
}) {
  const config: Record<
    AppointmentStatus,
    { classes: string; icon: React.ReactNode }
  > = {
    Scheduled: {
      classes:
        'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700',
      icon: <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
    },
    Confirmed: {
      classes:
        'bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800',
      icon: (
        <CalendarCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      ),
    },
    'Checked In': {
      classes:
        'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800',
      icon: <UserCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
    },
    Waiting: {
      classes:
        'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
      icon: <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
    },
    'In Consultation': {
      classes:
        'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800',
      icon: <Stethoscope className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
    },
    Completed: {
      classes:
        'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
      icon: (
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      ),
    },
    'No-show': {
      classes:
        'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
      icon: <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
    },
    Cancelled: {
      classes:
        'bg-slate-100 text-slate-500 border-slate-200 line-through dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800',
      icon: <XCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
    },
  };

  const item = config[status] || config.Scheduled;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium border whitespace-nowrap shrink-0 ${item.classes}`}
      aria-label={`Appointment status: ${status}`}
    >
      {item.icon}
      <span>{status}</span>
    </span>
  );
}

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const config: Record<
    InvoiceStatus,
    { classes: string; icon: React.ReactNode }
  > = {
    Draft: {
      classes:
        'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
      icon: <FileText className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
    },
    Issued: {
      classes:
        'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
      icon: <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
    },
    'Partially Paid': {
      classes:
        'bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800',
      icon: <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
    },
    Paid: {
      classes:
        'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
      icon: (
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      ),
    },
    Voided: {
      classes:
        'bg-slate-100 text-slate-500 border-slate-200 line-through dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800',
      icon: <Ban className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
    },
  };

  const item = config[status] || config.Issued;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium border whitespace-nowrap shrink-0 ${item.classes}`}
      aria-label={`Invoice status: ${status}`}
    >
      {item.icon}
      <span>{status}</span>
    </span>
  );
}

export function PatientStatusBadge({ status }: { status: PatientStatus }) {
  const config: Record<
    PatientStatus,
    { classes: string; icon: React.ReactNode }
  > = {
    Active: {
      classes:
        'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
      icon: (
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      ),
    },
    'Follow-up Due': {
      classes:
        'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
      icon: <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
    },
    Archived: {
      classes:
        'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
      icon: <Ban className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
    },
  };

  const item = config[status] || config.Active;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium border whitespace-nowrap shrink-0 ${item.classes}`}
      aria-label={`Patient status: ${status}`}
    >
      {item.icon}
      <span>{status}</span>
    </span>
  );
}

export function DoctorStatusBadge({ status }: { status: DoctorStatus }) {
  const config: Record<
    DoctorStatus,
    { classes: string; icon: React.ReactNode }
  > = {
    Active: {
      classes:
        'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
      icon: (
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      ),
    },
    'On Leave': {
      classes:
        'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
      icon: <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
    },
    Archived: {
      classes:
        'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
      icon: <Ban className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
    },
  };

  const item = config[status] || config.Active;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium border whitespace-nowrap shrink-0 ${item.classes}`}
      aria-label={`Doctor status: ${status}`}
    >
      {item.icon}
      <span>{status}</span>
    </span>
  );
}
