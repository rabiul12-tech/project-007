import Link from 'next/link';
import {
  Calendar,
  ClipboardList,
  Users,
  Stethoscope,
  FileText,
  Receipt,
  ArrowRight,
  ShieldCheck,
  Clock,
  CheckCircle2,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F7FAFC] dark:bg-[#0B1520] text-[#173042] dark:text-[#F8FAFC]">
      {/* Top Bar Contract: Zone 1 Brand — Zone 2 4-5 Nav Links — Zone 3 1 Primary Action */}
      <header className="flex items-center justify-between gap-8 px-6 lg:px-12 py-4 bg-white dark:bg-[#11202D] border-b border-[#E2EAF0] dark:border-[#304B5B]">
        <Link
          href="/dashboard"
          className="text-lg font-bold tracking-tight text-[#173042] dark:text-white whitespace-nowrap shrink-0"
        >
          MEDORA Health
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#64748B] dark:text-[#9BB0BE]">
          <Link
            href="/dashboard/queue"
            className="hover:text-[#0891B2] transition-colors whitespace-nowrap shrink-0"
          >
            Reception Queue
          </Link>
          <Link
            href="/dashboard/calendar"
            className="hover:text-[#0891B2] transition-colors whitespace-nowrap shrink-0"
          >
            Doctor Scheduler
          </Link>
          <Link
            href="/dashboard/patients"
            className="hover:text-[#0891B2] transition-colors whitespace-nowrap shrink-0"
          >
            Patient 360°
          </Link>
          <Link
            href="/dashboard/billing"
            className="hover:text-[#0891B2] transition-colors whitespace-nowrap shrink-0"
          >
            Clinic Billing
          </Link>
          <Link
            href="/dashboard/help"
            className="hover:text-[#0891B2] transition-colors whitespace-nowrap shrink-0"
          >
            Documentation
          </Link>
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/dashboard"
            className="px-4 py-2 text-xs font-semibold text-white bg-[#0891B2] rounded-lg hover:bg-cyan-700 transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1.5"
          >
            <span>Enter Demo Workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero Split */}
      <main className="flex-1 max-w-[1360px] w-full mx-auto px-6 lg:px-12 py-12 lg:py-16 space-y-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
            <div className="text-xs font-medium text-[#0891B2] dark:text-[#22D3EE]">
              Outpatient Clinic Operations Suite · Browser-Local Portfolio Demo
            </div>
            <h1
              className="text-3xl sm:text-5xl font-bold tracking-tight text-[#173042] dark:text-white leading-[1.12]"
              style={{ textWrap: 'balance' }}
            >
              Better Care. Better Operations. Coordinated in One Calm Workspace.
            </h1>
            <p className="text-base text-[#64748B] dark:text-[#9BB0BE] max-w-2xl leading-relaxed">
              MEDORA Health unifies outpatient appointment scheduling, conflict-free doctor calendars, live reception queue tracking, non-clinical consultation documentation, and decimal-accurate billing — running entirely in your browser with zero external backend dependencies.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/dashboard"
                className="px-5 py-2.5 rounded-xl bg-[#0891B2] hover:bg-cyan-700 text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors"
              >
                <span>Launch Clinic Overview</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/dashboard/calendar"
                className="px-5 py-2.5 rounded-xl border border-[#E2EAF0] dark:border-[#304B5B] bg-white dark:bg-[#172B39] hover:border-[#0891B2] text-sm font-medium text-[#173042] dark:text-slate-100 transition-colors"
              >
                Explore Doctor Scheduler
              </Link>
              <Link
                href="/dashboard/patients/PAT-1001"
                className="px-5 py-2.5 rounded-xl border border-[#E2EAF0] dark:border-[#304B5B] bg-white dark:bg-[#172B39] hover:border-[#0891B2] text-sm font-medium text-[#173042] dark:text-slate-100 transition-colors"
              >
                Inspect Patient 360°
              </Link>
            </div>
          </div>

          {/* Right Live Operational Preview Surface */}
          <div className="lg:col-span-5 rounded-xl bg-white dark:bg-[#172B39] border border-[#E2EAF0] dark:border-[#304B5B] p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#E2EAF0] dark:border-[#304B5B] pb-3">
                <div>
                  <h2 className="text-sm font-semibold text-[#173042] dark:text-white">
                    Bayview Pavilion — Suite 400
                  </h2>
                  <p className="text-xs text-[#64748B] dark:text-[#9BB0BE]">
                    Pre-seeded Deterministic Outpatient Dataset
                  </p>
                </div>
                <span className="text-xs font-mono tabular-nums text-[#0891B2] dark:text-[#22D3EE]">
                  2026-11-13
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3.5 rounded-lg bg-[#F7FAFC] dark:bg-[#11202D] border border-[#E2EAF0] dark:border-[#304B5B]">
                  <div className="text-xs text-[#64748B] dark:text-[#9BB0BE]">
                    Fictional Patients
                  </div>
                  <div className="text-2xl font-bold font-mono tabular-nums mt-1">
                    150
                  </div>
                </div>
                <div className="p-3.5 rounded-lg bg-[#F7FAFC] dark:bg-[#11202D] border border-[#E2EAF0] dark:border-[#304B5B]">
                  <div className="text-xs text-[#64748B] dark:text-[#9BB0BE]">
                    Clinicians & Rooms
                  </div>
                  <div className="text-2xl font-bold font-mono tabular-nums mt-1">
                    12 · 8
                  </div>
                </div>
                <div className="p-3.5 rounded-lg bg-[#F7FAFC] dark:bg-[#11202D] border border-[#E2EAF0] dark:border-[#304B5B]">
                  <div className="text-xs text-[#64748B] dark:text-[#9BB0BE]">
                    Appointments & Visits
                  </div>
                  <div className="text-2xl font-bold font-mono tabular-nums mt-1">
                    350 · 200+
                  </div>
                </div>
                <div className="p-3.5 rounded-lg bg-[#F7FAFC] dark:bg-[#11202D] border border-[#E2EAF0] dark:border-[#304B5B]">
                  <div className="text-xs text-[#64748B] dark:text-[#9BB0BE]">
                    Invoices & Receipts
                  </div>
                  <div className="text-2xl font-bold font-mono tabular-nums mt-1">
                    200 · 250
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E2EAF0] dark:border-[#304B5B] text-xs text-[#64748B] dark:text-[#9BB0BE] space-y-1.5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
                <span>Half-open interval [start, end) conflict-free scheduling engine</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#0891B2] shrink-0" />
                <span>Instant browser LocalStorage persistence with JSON backup & restore</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#D97706] shrink-0" />
                <span>Strictly fictional non-clinical records with watermarked sample PDFs</span>
              </div>
            </div>
          </div>
        </div>

        {/* Core Experience Navigation Cards */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#173042] dark:text-white">
              Signature Clinic Workflows
            </h2>
            <span className="text-xs text-[#64748B] dark:text-[#9BB0BE]">
              20 interconnected operational routes sharing one live dataset
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                title: '01. Patient 360° Workspace',
                desc: 'Comprehensive 7-tab patient profile connecting appointments, visit timeline, sample consultation notes, downloadable PDFs, and billing ledger.',
                href: '/dashboard/patients/PAT-1001',
                icon: Users,
              },
              {
                title: '02. Doctor Scheduling Calendar',
                desc: 'Day, Week, Month, and Clinician schedule views with working hours, break exclusions, room conflict detection, and click-to-book slots.',
                href: '/dashboard/calendar',
                icon: Calendar,
              },
              {
                title: '03. Reception & Patient Queue',
                desc: 'Interactive front-desk queue board tracking check-in timestamps, waiting duration, active consultations, and status transitions.',
                href: '/dashboard/queue',
                icon: ClipboardList,
              },
              {
                title: '04. Consultation Workspace Demo',
                desc: 'Simulated outpatient documentation with prewritten non-clinical observations, free-text clinician notes, and one-click visit completion.',
                href: '/dashboard/consultations',
                icon: Stethoscope,
              },
              {
                title: '05. Sample Prescription & Visit PDFs',
                desc: 'Client-side A4 PDF generator with prominent "SAMPLE — NOT VALID FOR MEDICAL USE" watermarks and non-actionable wellness items.',
                href: '/dashboard/prescriptions',
                icon: FileText,
              },
              {
                title: '06. Clinic Billing & Payment Engine',
                desc: 'Decimal.js financial calculations, price snapshots, partial payment allocations, payment reversals, and printable invoice statements.',
                href: '/dashboard/billing',
                icon: Receipt,
              },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <Link
                  key={card.href}
                  href={card.href}
                  className="group p-5 rounded-xl bg-white dark:bg-[#172B39] border border-[#E2EAF0] dark:border-[#304B5B] hover:border-[#0891B2] transition-colors flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-base text-[#173042] dark:text-white group-hover:text-[#0891B2] transition-colors">
                        {card.title}
                      </span>
                      <Icon className="w-4 h-4 text-[#0891B2] shrink-0" />
                    </div>
                    <p className="text-xs text-[#64748B] dark:text-[#9BB0BE] leading-relaxed">
                      {card.desc}
                    </p>
                  </div>
                  <div className="text-xs font-medium text-[#0891B2] dark:text-[#22D3EE] inline-flex items-center gap-1">
                    <span>Open Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="border-t border-[#E2EAF0] dark:border-[#304B5B] bg-white dark:bg-[#11202D] px-6 lg:px-12 py-4 text-xs text-[#64748B] dark:text-[#9BB0BE] flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>
          MEDORA Health — Project 007 Portfolio Demonstration. Fictional data only.
        </span>
        <span>
          Not a certified EHR, medical device, or clinical decision system.
        </span>
      </footer>
    </div>
  );
}
