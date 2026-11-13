'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Calendar,
  CalendarClock,
  ClipboardList,
  Stethoscope,
  FileText,
  History,
  UserRound,
  BriefcaseMedical,
  DoorOpen,
  BadgeCheck,
  Receipt,
  CreditCard,
  BarChart3,
  FileSpreadsheet,
  Activity,
  Settings,
  HelpCircle,
  Search,
  Plus,
  Bell,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
  ShieldAlert,
  ChevronDown,
} from 'lucide-react';
import { useMedoraStore } from '@/stores/useMedoraStore';
import { DemoRole } from '@/types/medora';
import { GlobalQuickDialogs } from '@/components/modals/GlobalQuickDialogs';

interface NavGroup {
  label: string;
  items: Array<{
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
  }>;
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Workspace',
    items: [
      { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
      { name: "Today's Queue", href: '/dashboard/queue', icon: ClipboardList },
      {
        name: 'Appointments',
        href: '/dashboard/appointments',
        icon: CalendarClock,
      },
      { name: 'Calendar', href: '/dashboard/calendar', icon: Calendar },
    ],
  },
  {
    label: 'Patient Care Demo',
    items: [
      { name: 'Patients', href: '/dashboard/patients', icon: Users },
      {
        name: 'Consultations',
        href: '/dashboard/consultations',
        icon: Stethoscope,
      },
      {
        name: 'Prescriptions',
        href: '/dashboard/prescriptions',
        icon: FileText,
      },
      { name: 'Visit History', href: '/dashboard/visits', icon: History },
    ],
  },
  {
    label: 'Clinic Operations',
    items: [
      { name: 'Doctors', href: '/dashboard/doctors', icon: UserRound },
      {
        name: 'Services',
        href: '/dashboard/services',
        icon: BriefcaseMedical,
      },
      { name: 'Rooms', href: '/dashboard/rooms', icon: DoorOpen },
      { name: 'Staff', href: '/dashboard/staff', icon: BadgeCheck },
    ],
  },
  {
    label: 'Financial',
    items: [
      { name: 'Billing', href: '/dashboard/billing', icon: Receipt },
      { name: 'Payments', href: '/dashboard/payments', icon: CreditCard },
    ],
  },
  {
    label: 'Insights',
    items: [
      { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
      { name: 'Reports', href: '/dashboard/reports', icon: FileSpreadsheet },
      { name: 'Activity', href: '/dashboard/activity', icon: Activity },
    ],
  },
  {
    label: 'System',
    items: [
      { name: 'Settings', href: '/dashboard/settings', icon: Settings },
      { name: 'Help', href: '/dashboard/help', icon: HelpCircle },
    ],
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const {
    hydrated,
    hydrate,
    dataset,
    settings,
    ui,
    toggleTheme,
    setSidebarCollapsed,
    setActiveRole,
    setSelectedDate,
    setActiveWorkspace,
    setQuickDialog,
    markAllNotificationsRead,
  } = useMedoraStore();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const unreadCount = dataset.notifications.filter((n) => !n.isRead).length;
  const activeQueueCount = dataset.appointments.filter(
    (a) =>
      a.date === ui.selectedDate &&
      (a.status === 'Checked In' ||
        a.status === 'Waiting' ||
        a.status === 'In Consultation')
  ).length;

  // Breadcrumb calculation
  const segments = pathname.split('/').filter(Boolean);
  const currentBreadcrumb =
    segments.length <= 1
      ? 'Clinic Operations Overview'
      : segments[1] === 'patients' && segments[2]
      ? `Patient 360° Workspace / ${segments[2]}`
      : segments[1]
          .replace(/-/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7FAFC] dark:bg-[#0B1520] text-slate-600 dark:text-slate-300">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#0891B2] animate-pulse" />
          <p className="text-sm font-medium">
            Loading MEDORA Health Workspace...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#F7FAFC] dark:bg-[#0B1520] text-[#173042] dark:text-[#F8FAFC]">
      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        aria-label="Primary Sidebar Navigation"
        className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-white dark:bg-[#11202D] border-r border-[#E2EAF0] dark:border-[#304B5B] transition-all duration-200 lg:static ${
          ui.sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'
        } ${
          mobileOpen
            ? 'translate-x-0 w-64'
            : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Brand + Workspace Selector */}
        <div className="p-4 border-b border-[#E2EAF0] dark:border-[#304B5B]">
          <div className="flex items-center justify-between gap-2">
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 min-w-0"
            >
              <div className="w-9 h-9 rounded-xl bg-[#0891B2] text-white flex items-center justify-center font-bold text-base shrink-0 shadow-xs">
                M
              </div>
              {!ui.sidebarCollapsed && (
                <div className="min-w-0">
                  <div className="font-bold text-base tracking-tight text-[#173042] dark:text-white truncate">
                    MEDORA Health
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    Better Care. Better Operations.
                  </div>
                </div>
              )}
            </Link>
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1 text-slate-400 hover:text-slate-600"
              aria-label="Close navigation drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {!ui.sidebarCollapsed && (
            <div className="mt-3">
              <label className="sr-only" htmlFor="workspace-branch-select">
                Demo Clinic Branch
              </label>
              <select
                id="workspace-branch-select"
                value={ui.activeWorkspace}
                onChange={(e) => setActiveWorkspace(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs font-medium rounded-lg border border-[#E2EAF0] dark:border-[#304B5B] bg-slate-50 dark:bg-[#172B39] text-slate-700 dark:text-slate-200"
              >
                <option value="Bayview Pavilion — Suite 400">
                  Bayview Pavilion — Suite 400
                </option>
                <option value="Harbor North Outpatient Annex">
                  Harbor North Outpatient Annex
                </option>
              </select>
            </div>
          )}
        </div>

        {/* Navigation Groups */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              {!ui.sidebarCollapsed && (
                <div className="px-2.5 mb-1.5 text-[11px] font-semibold tracking-wider text-slate-400 dark:text-slate-400 uppercase">
                  {group.label}
                </div>
              )}
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.href === '/dashboard'
                      ? pathname === '/dashboard'
                      : pathname.startsWith(item.href);

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        title={ui.sidebarCollapsed ? item.name : undefined}
                        className={`flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-[#EAF8FB] text-[#0891B2] dark:bg-[#203847] dark:text-[#22D3EE]'
                            : 'text-slate-600 dark:text-[#9BB0BE] hover:bg-slate-100 dark:hover:bg-[#172B39] hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon className="w-4 h-4 shrink-0" />
                          {!ui.sidebarCollapsed && (
                            <span className="truncate">{item.name}</span>
                          )}
                        </div>
                        {!ui.sidebarCollapsed &&
                          item.href === '/dashboard/queue' && (
                            <span className="text-xs font-mono tabular-nums text-cyan-700 dark:text-cyan-300">
                              {activeQueueCount}
                            </span>
                          )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer: Role Selector + Collapse + Theme */}
        <div className="p-3 border-t border-[#E2EAF0] dark:border-[#304B5B] space-y-2.5">
          {!ui.sidebarCollapsed && (
            <div>
              <label
                htmlFor="demo-role-select"
                className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1"
              >
                Simulated Demo Role
              </label>
              <select
                id="demo-role-select"
                value={ui.activeRole}
                onChange={(e) => setActiveRole(e.target.value as DemoRole)}
                className="w-full px-2.5 py-1.5 text-xs font-medium rounded-lg border border-[#E2EAF0] dark:border-[#304B5B] bg-slate-50 dark:bg-[#172B39] text-slate-800 dark:text-slate-200"
              >
                <option value="Clinic Administrator">
                  Clinic Administrator
                </option>
                <option value="Receptionist">Receptionist</option>
                <option value="Doctor">Doctor</option>
                <option value="Billing Staff">Billing Staff</option>
              </select>
            </div>
          )}

          <div className="flex items-center justify-between gap-2 pt-1">
            {!ui.sidebarCollapsed && (
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                  Demo Operator
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {ui.activeRole}
                </div>
              </div>
            )}
            <div className="flex items-center gap-1 ml-auto">
              <button
                onClick={toggleTheme}
                aria-label="Toggle Light or Dark Theme"
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-[#172B39] dark:text-slate-300"
                title="Toggle theme"
              >
                {ui.theme === 'dark' ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={() => setSidebarCollapsed(!ui.sidebarCollapsed)}
                aria-label="Toggle sidebar width"
                className="hidden lg:inline-flex p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-[#172B39] dark:text-slate-300"
                title={
                  ui.sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'
                }
              >
                {ui.sidebarCollapsed ? (
                  <PanelLeftOpen className="w-4 h-4" />
                ) : (
                  <PanelLeftClose className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT VIEWPORT */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOPBAR */}
        <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#11202D]/95 backdrop-blur-xs border-b border-[#E2EAF0] dark:border-[#304B5B] px-4 lg:px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Mobile Drawer Trigger + Breadcrumbs */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-2 rounded-lg border border-slate-200 dark:border-[#304B5B] text-slate-600 dark:text-slate-200"
                aria-label="Open navigation menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-[#9BB0BE] truncate">
                  <Link
                    href="/dashboard"
                    className="hover:text-[#0891B2] transition-colors"
                  >
                    MEDORA
                  </Link>
                  <span>/</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                    {currentBreadcrumb}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Search + Date Selector + Quick Create + Notifications + Theme */}
            <div className="flex items-center gap-2.5 shrink-0">
              {/* Global Search Cmd+K */}
              <button
                onClick={() => setQuickDialog('command_palette')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#E2EAF0] dark:border-[#304B5B] bg-slate-50 dark:bg-[#172B39] text-xs text-slate-500 dark:text-slate-300 hover:border-cyan-500 transition-colors"
              >
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">
                  Search patients, appointments...
                </span>
                <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-[#11202D] rounded border border-slate-200 dark:border-[#304B5B]">
                  ⌘K
                </kbd>
              </button>

              {/* Operational Date Selector */}
              <div className="hidden md:flex items-center gap-1.5">
                <label htmlFor="topbar-date-picker" className="sr-only">
                  Operational Date
                </label>
                <input
                  id="topbar-date-picker"
                  type="date"
                  value={ui.selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-[#E2EAF0] dark:border-[#304B5B] bg-white dark:bg-[#172B39] text-slate-700 dark:text-slate-200 tabular-nums"
                />
              </div>

              {/* Quick Create Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setQuickCreateOpen(!quickCreateOpen)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0891B2] hover:bg-cyan-700 text-white text-xs font-medium transition-colors whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Quick Create</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                {quickCreateOpen && (
                  <div
                    className="absolute right-0 mt-2 w-48 rounded-xl bg-white dark:bg-[#172B39] border border-slate-200 dark:border-[#304B5B] shadow-lg py-1.5 z-50 text-xs"
                    onMouseLeave={() => setQuickCreateOpen(false)}
                  >
                    <button
                      onClick={() => {
                        setQuickCreateOpen(false);
                        setQuickDialog('book_appointment');
                      }}
                      className="w-full px-3.5 py-2 text-left hover:bg-slate-50 dark:hover:bg-[#203847] font-medium text-slate-700 dark:text-slate-200"
                    >
                      Book Appointment
                    </button>
                    <button
                      onClick={() => {
                        setQuickCreateOpen(false);
                        setQuickDialog('add_patient');
                      }}
                      className="w-full px-3.5 py-2 text-left hover:bg-slate-50 dark:hover:bg-[#203847] font-medium text-slate-700 dark:text-slate-200"
                    >
                      Add Patient
                    </button>
                    <button
                      onClick={() => {
                        setQuickCreateOpen(false);
                        setQuickDialog('add_doctor');
                      }}
                      className="w-full px-3.5 py-2 text-left hover:bg-slate-50 dark:hover:bg-[#203847] font-medium text-slate-700 dark:text-slate-200"
                    >
                      Add Doctor
                    </button>
                    <button
                      onClick={() => {
                        setQuickCreateOpen(false);
                        setQuickDialog('create_service');
                      }}
                      className="w-full px-3.5 py-2 text-left hover:bg-slate-50 dark:hover:bg-[#203847] font-medium text-slate-700 dark:text-slate-200"
                    >
                      Create Service
                    </button>
                    <button
                      onClick={() => {
                        setQuickCreateOpen(false);
                        setQuickDialog('create_invoice');
                      }}
                      className="w-full px-3.5 py-2 text-left hover:bg-slate-50 dark:hover:bg-[#203847] font-medium text-slate-700 dark:text-slate-200"
                    >
                      Create Invoice
                    </button>
                  </div>
                )}
              </div>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setNotifOpen(!notifOpen)}
                  aria-label="Open notifications"
                  className="relative p-2 rounded-lg border border-[#E2EAF0] dark:border-[#304B5B] text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#172B39]"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 px-1 min-w-4 h-4 rounded-full bg-[#0891B2] text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                      {unreadCount}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 rounded-xl bg-white dark:bg-[#172B39] border border-slate-200 dark:border-[#304B5B] shadow-lg p-3 z-50 text-xs">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-[#304B5B]">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        Operational Alerts
                      </span>
                      <button
                        onClick={() => markAllNotificationsRead()}
                        className="text-[#0891B2] hover:underline"
                      >
                        Mark all read
                      </button>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {dataset.notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-2 rounded-lg border ${
                            n.isRead
                              ? 'border-slate-100 dark:border-[#304B5B] opacity-75'
                              : 'border-cyan-200 dark:border-cyan-800 bg-cyan-50/40 dark:bg-[#203847]'
                          }`}
                        >
                          <div className="font-medium text-slate-900 dark:text-slate-100">
                            {n.title}
                          </div>
                          <p className="text-slate-500 dark:text-slate-300 mt-0.5">
                            {n.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                aria-label="Switch Theme"
                className="p-2 rounded-lg border border-[#E2EAF0] dark:border-[#304B5B] text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#172B39]"
              >
                {ui.theme === 'dark' ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Non-Clinical Portfolio Disclaimer Banner */}
        <div className="bg-slate-100/80 dark:bg-[#172B39] border-b border-[#E2EAF0] dark:border-[#304B5B] px-4 lg:px-6 py-1.5 text-[11px] text-slate-600 dark:text-[#9BB0BE] flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <ShieldAlert className="w-3.5 h-3.5 text-[#0891B2] shrink-0" />
            <span className="truncate">
              <strong>Portfolio Demonstration Mode:</strong> Fictional outpatient dataset stored in browser LocalStorage only. Not a clinical EHR or medical device.
            </span>
          </div>
          <span className="hidden sm:inline font-mono tabular-nums shrink-0">
            Active Date: {ui.selectedDate} · Role: {ui.activeRole}
          </span>
        </div>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>

      <GlobalQuickDialogs />
    </div>
  );
}
