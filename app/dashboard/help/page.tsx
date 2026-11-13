'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  BookOpen,
  Calendar,
  ClipboardList,
  FileText,
  Receipt,
  HardDrive,
} from 'lucide-react';

export default function HelpDocumentationPage() {
  const sections = [
    {
      title: 'Getting Started & Portfolio Scope',
      icon: BookOpen,
      body: 'MEDORA Health (Project 007) is an interactive outpatient clinic operations demonstration. All patients, clinicians, consultation notes, and billing statements are fictional and persisted exclusively in your browser LocalStorage.',
    },
    {
      title: 'Patient Directory & Patient 360° Workspace',
      icon: HardDrive,
      body: 'Navigate to Patients to search, filter, register, edit, or archive fictional patients. Clicking any patient opens the 7-tab Patient 360° Workspace connecting Overview, Appointments, Visit Timeline, Consultation Notes, Sample Documents, Billing, and Activity.',
    },
    {
      title: 'Appointment Scheduling & Conflict Prevention',
      icon: Calendar,
      body: 'The centralized Scheduling Engine validates all 12 rules using half-open time intervals [startTime, endTime). Back-to-back bookings (e.g. 09:00–09:30 and 09:30–10:00) are permitted, while overlapping doctor or exclusive room bookings, break windows (12:30–13:15), and clinic holidays are blocked.',
    },
    {
      title: 'Reception Queue & Consultation Workflow',
      icon: ClipboardList,
      body: 'Arriving patients transition from Scheduled/Confirmed → Checked In → Waiting → In Consultation → Completed. Starting or completing a consultation automatically creates or updates the linked Visit and Consultation record while preventing duplicate visits.',
    },
    {
      title: 'Sample Prescription & Visit Summary PDFs',
      icon: FileText,
      body: 'Client-side A4 PDFs are generated on demand via jsPDF. Every clinical sample document carries the mandatory "SAMPLE — NOT VALID FOR MEDICAL USE" watermark, uses non-actionable demonstration entries, and omits real clinician signatures.',
    },
    {
      title: 'Clinic Billing & Decimal.js Calculations',
      icon: Receipt,
      body: 'Invoices snapshot service prices at creation time so subsequent service fee changes never corrupt historical invoices. Partial payments, full settlements, and payment reversals automatically reconcile invoice balances using decimal.js.',
    },
  ];

  const faqs = [
    {
      q: 'Is any real patient data or external database used?',
      a: 'No. MEDORA Health uses 100% fictional data stored in browser LocalStorage (medora:data, medora:settings, medora:ui). No external database, backend server, or third-party healthcare API is connected.',
    },
    {
      q: 'Why can two appointments share a boundary time like 09:30?',
      a: 'The scheduling engine uses half-open intervals [startTime, endTime) where overlap is defined as startA < endB AND startB < endA. An appointment ending at 09:30 does not conflict with one starting at 09:30.',
    },
    {
      q: 'How do I back up or reset my browser changes?',
      a: 'Open Settings (/dashboard/settings) to export a full JSON backup bundle, restore from a JSON snapshot, or click "Reset Demo Data" to re-seed the initial dataset.',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#173042] dark:text-white">
          Help, Architecture &amp; Non-Clinical Disclaimer
        </h1>
        <p className="text-xs text-[#64748B] dark:text-[#9BB0BE] mt-0.5">
          Operational guide, scheduling rules, LocalStorage limitations, and safety disclosures
        </p>
      </div>

      {/* Prominent Safety & Privacy Disclaimer */}
      <div className="p-5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-2 text-xs">
        <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200 text-sm">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>
            Portfolio Demonstration vs Production Healthcare Software
          </span>
        </div>
        <p className="text-amber-800 dark:text-amber-300 leading-relaxed">
          MEDORA Health is exclusively a software engineering portfolio demonstration using fictional data. It is <strong>not</strong> a certified Electronic Health Record (EHR) system, regulated medical device, clinical decision support system, or HIPAA/GDPR-compliant database. Do not enter real patient information, medical diagnoses, or real financial details.
        </p>
      </div>

      {/* Guide Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((sec) => {
          const Icon = sec.icon;
          return (
            <div
              key={sec.title}
              className="p-5 rounded-xl bg-white dark:bg-[#172B39] border border-[#E2EAF0] dark:border-[#304B5B] space-y-2.5 text-xs"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-sm text-slate-900 dark:text-white">
                  {sec.title}
                </h2>
                <Icon className="w-4 h-4 text-[#0891B2] shrink-0" />
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {sec.body}
              </p>
            </div>
          );
        })}
      </div>

      {/* FAQ Section */}
      <div className="p-6 rounded-xl bg-white dark:bg-[#172B39] border border-[#E2EAF0] dark:border-[#304B5B] space-y-4 text-xs">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">
          Frequently Asked Questions &amp; LocalStorage Limitations
        </h2>
        <div className="space-y-3 divide-y divide-slate-100 dark:divide-[#304B5B]">
          {faqs.map((item) => (
            <div key={item.q} className="pt-3 first:pt-0 space-y-1">
              <div className="font-semibold text-slate-900 dark:text-white">
                {item.q}
              </div>
              <p className="text-slate-600 dark:text-slate-300">{item.a}</p>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-[#304B5B] flex flex-wrap gap-3">
          <Link
            href="/dashboard/settings"
            className="text-[#0891B2] font-semibold hover:underline"
          >
            Go to Backup &amp; Reset Settings →
          </Link>
          <Link
            href="/dashboard/calendar"
            className="text-[#0891B2] font-semibold hover:underline"
          >
            Open Doctor Scheduling Calendar →
          </Link>
        </div>
      </div>
    </div>
  );
}
