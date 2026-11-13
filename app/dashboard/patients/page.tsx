'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Search,
  UserPlus,
  Edit3,
  Archive,
  Eye,
  X,
  ArrowRight,
  Calendar,
  Clock,
  Trash2,
} from 'lucide-react';
import { useMedoraStore } from '@/stores/useMedoraStore';
import { Patient, PatientStatus } from '@/types/medora';
import { PatientStatusBadge } from '@/components/ui/StatusBadge';
import { DEMO_TODAY } from '@/lib/seed/generator';

export default function PatientDirectoryPage() {
  const {
    dataset,
    ui,
    setQuickDialog,
    updatePatient,
    archivePatient,
    recordPatientAccess,
    clearRecentPatients,
  } = useMedoraStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isRecentOpen, setIsRecentOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | PatientStatus>('all');
  const [page, setPage] = useState(1);
  const [drawerPatient, setDrawerPatient] = useState<Patient | null>(null);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);
  const pageSize = 15;

  // Close Recent Searches dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsRecentOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Resolve the last 5 accessed patient profiles
  const recentPatients = useMemo(() => {
    const ids = ui.recentPatientIds ?? [
      'PAT-1001',
      'PAT-1002',
      'PAT-1003',
      'PAT-1004',
      'PAT-1005',
    ];
    const patientMap = new Map(dataset.patients.map((p) => [p.id, p]));
    return ids
      .map((id) => patientMap.get(id))
      .filter((p): p is Patient => Boolean(p))
      .slice(0, 5);
  }, [ui.recentPatientIds, dataset.patients]);

  // Map upcoming appointment per patient
  const upcomingAptMap = useMemo(() => {
    const map = new Map<string, string>();
    const sorted = [...dataset.appointments]
      .filter(
        (a) =>
          a.date >= DEMO_TODAY &&
          a.status !== 'Cancelled' &&
          a.status !== 'No-show'
      )
      .sort((a, b) => a.date.localeCompare(b.date));
    for (const a of sorted) {
      if (!map.has(a.patientId)) {
        map.set(a.patientId, `${a.date} ${a.startTime}`);
      }
    }
    return map;
  }, [dataset.appointments]);

  const filteredPatients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return dataset.patients.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (q) {
        const hay = `${p.id} ${p.fullName} ${p.email} ${p.phone}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [dataset.patients, statusFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredPatients.length / pageSize));
  const paginated = filteredPatients.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#173042] dark:text-white">
            Patient Directory
          </h1>
          <p className="text-xs text-[#64748B] dark:text-[#9BB0BE] mt-0.5">
            {filteredPatients.length} fictional demonstration records · Click any patient to open the Patient 360° Workspace
          </p>
        </div>

        <button
          onClick={() => setQuickDialog('add_patient')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0891B2] hover:bg-cyan-700 text-white text-xs font-semibold"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register Demo Patient</span>
        </button>
      </div>

      {/* Search & Status Filter */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#172B39] border border-[#E2EAF0] dark:border-[#304B5B] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div ref={searchContainerRef} className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onFocus={() => setIsRecentOpen(true)}
            onClick={() => setIsRecentOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setIsRecentOpen(false);
              }
            }}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
              setIsRecentOpen(true);
            }}
            aria-label="Search patients"
            placeholder="Search fictional patient by name, ID (PAT-1001), phone, or email..."
            className="w-full pl-9 pr-28 py-2 text-xs rounded-lg border border-[#E2EAF0] dark:border-[#304B5B] bg-slate-50 dark:bg-[#11202D] focus:outline-none focus:ring-2 focus:ring-[#0891B2]/30 focus:border-[#0891B2]"
          />

          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setPage(1);
                }}
                aria-label="Clear search query"
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              aria-expanded={isRecentOpen}
              aria-controls="recent-patient-searches-dropdown"
              onClick={() => setIsRecentOpen((prev) => !prev)}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-white dark:bg-[#172B39] border border-[#E2EAF0] dark:border-[#304B5B] text-[#64748B] dark:text-[#9BB0BE] hover:text-[#0891B2] dark:hover:text-[#22D3EE]"
            >
              <Clock className="w-3 h-3 text-[#0891B2] dark:text-[#22D3EE]" />
              <span>Recent ({recentPatients.length})</span>
            </button>
          </div>

          {/* Recent Searches Dropdown */}
          {isRecentOpen && (
            <div
              id="recent-patient-searches-dropdown"
              role="listbox"
              aria-label="Recent Searches"
              className="absolute left-0 right-0 top-full mt-1.5 z-40 rounded-xl bg-white dark:bg-[#172B39] border border-[#E2EAF0] dark:border-[#304B5B] shadow-lg overflow-hidden"
            >
              <div className="px-3.5 py-2.5 border-b border-[#E2EAF0] dark:border-[#304B5B] bg-slate-50/80 dark:bg-[#11202D] flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#0891B2] dark:text-[#22D3EE]" />
                  <span className="text-xs font-semibold text-[#173042] dark:text-slate-100">
                    Recent Searches
                  </span>
                  <span className="text-[11px] text-[#64748B] dark:text-[#9BB0BE]">
                    · Last {recentPatients.length} patient profiles accessed
                  </span>
                </div>
                {recentPatients.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      clearRecentPatients();
                      toast.info('Cleared recent patient search history');
                    }}
                    className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 font-medium"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                )}
              </div>

              {recentPatients.length === 0 ? (
                <div className="px-4 py-5 text-center text-xs text-slate-500 dark:text-slate-400">
                  No recently accessed patient profiles yet. Click any patient record below to view their profile.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-[#304B5B]">
                  {recentPatients.map((rp, index) => {
                    const initials = rp.fullName
                      .split(' ')
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase();
                    const age = 2026 - rp.birthYear;

                    return (
                      <div
                        key={rp.id}
                        role="option"
                        aria-selected={searchQuery === rp.fullName || searchQuery === rp.id}
                        className="px-3.5 py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-[#203847]/70 transition-colors"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            recordPatientAccess(rp.id);
                            setSearchQuery(rp.fullName);
                            setPage(1);
                            setIsRecentOpen(false);
                          }}
                          className="flex items-center gap-3 text-left flex-1 min-w-0"
                        >
                          <div className="w-7 h-7 rounded-lg bg-[#EAF8FB] dark:bg-[#203847] text-[#0891B2] dark:text-[#22D3EE] font-semibold text-[11px] flex items-center justify-center shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                                {rp.fullName}
                              </span>
                              <span className="text-[11px] font-mono tabular-nums px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#11202D] text-[#0891B2] dark:text-[#22D3EE] font-medium">
                                {rp.id}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">
                                #{index + 1}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                              <span className="font-mono tabular-nums">
                                {age} yrs ({rp.birthYear})
                              </span>
                              <span>·</span>
                              <span className="font-mono tabular-nums">{rp.phone}</span>
                              {rp.lastVisitDate && (
                                <>
                                  <span>·</span>
                                  <span>Last visit {rp.lastVisitDate}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </button>

                        <div className="flex items-center gap-2 shrink-0">
                          <PatientStatusBadge status={rp.status} />
                          <button
                            type="button"
                            onClick={() => {
                              recordPatientAccess(rp.id);
                              setDrawerPatient(rp);
                              setIsRecentOpen(false);
                            }}
                            title={`Quick view ${rp.fullName}`}
                            className="p-1.5 rounded-md border border-slate-200 dark:border-[#304B5B] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#11202D]"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <Link
                            href={`/dashboard/patients/${rp.id}`}
                            onClick={() => {
                              recordPatientAccess(rp.id);
                              setIsRecentOpen(false);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#EAF8FB] dark:bg-[#203847] text-[#0891B2] dark:text-[#22D3EE] text-[11px] font-semibold hover:bg-cyan-100/80"
                          >
                            <span>360° Profile</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <select
            aria-label="Filter patient status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as 'all' | PatientStatus);
              setPage(1);
            }}
            className="px-3 py-2 text-xs rounded-lg border border-[#E2EAF0] dark:border-[#304B5B] bg-white dark:bg-[#11202D]"
          >
            <option value="all">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Follow-up Due">Follow-up Due</option>
            <option value="Archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Patient Directory Table */}
      <div className="rounded-xl bg-white dark:bg-[#172B39] border border-[#E2EAF0] dark:border-[#304B5B] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E2EAF0] dark:border-[#304B5B] bg-slate-50/70 dark:bg-[#11202D] text-[#64748B] dark:text-[#9BB0BE]">
                <th className="py-3 px-3.5 font-medium">Patient ID</th>
                <th className="py-3 px-3.5 font-medium">Fictional Name</th>
                <th className="py-3 px-3.5 font-medium">Age / Birth Year</th>
                <th className="py-3 px-3.5 font-medium">Contact (Demo)</th>
                <th className="py-3 px-3.5 font-medium">Last Visit</th>
                <th className="py-3 px-3.5 font-medium">Upcoming</th>
                <th className="py-3 px-3.5 font-medium">Status</th>
                <th className="py-3 px-3.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#304B5B]">
              {paginated.map((p) => {
                const age = 2026 - p.birthYear;
                const upcoming = upcomingAptMap.get(p.id);

                return (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-[#203847]/60"
                  >
                    <td className="py-2.5 px-3.5 font-mono tabular-nums font-semibold">
                      <Link
                        href={`/dashboard/patients/${p.id}`}
                        onClick={() => recordPatientAccess(p.id)}
                        className="text-[#0891B2] dark:text-[#22D3EE] hover:underline"
                      >
                        {p.id}
                      </Link>
                    </td>
                    <td className="py-2.5 px-3.5">
                      <Link
                        href={`/dashboard/patients/${p.id}`}
                        onClick={() => recordPatientAccess(p.id)}
                        className="font-semibold text-slate-900 dark:text-slate-100 hover:text-[#0891B2]"
                      >
                        {p.fullName}
                      </Link>
                      <div className="text-[11px] text-slate-400">
                        Registered {p.registrationDate}
                      </div>
                    </td>
                    <td className="py-2.5 px-3.5 font-mono tabular-nums">
                      {age} yrs ({p.birthYear})
                    </td>
                    <td className="py-2.5 px-3.5">
                      <div>{p.phone}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                        {p.email}
                      </div>
                    </td>
                    <td className="py-2.5 px-3.5 font-mono tabular-nums text-slate-600 dark:text-slate-300">
                      {p.lastVisitDate ?? '—'}
                    </td>
                    <td className="py-2.5 px-3.5 font-mono tabular-nums text-xs">
                      {upcoming ? (
                        <span className="text-[#0891B2] dark:text-[#22D3EE] font-medium">
                          {upcoming}
                        </span>
                      ) : (
                        <span className="text-slate-400">None scheduled</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3.5">
                      <PatientStatusBadge status={p.status} />
                    </td>
                    <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <Link
                          href={`/dashboard/patients/${p.id}`}
                          onClick={() => recordPatientAccess(p.id)}
                          className="px-2.5 py-1 rounded-md bg-[#EAF8FB] dark:bg-[#203847] text-[#0891B2] dark:text-[#22D3EE] font-medium"
                        >
                          360° Profile
                        </Link>
                        <button
                          onClick={() => {
                            recordPatientAccess(p.id);
                            setDrawerPatient(p);
                          }}
                          aria-label={`Quick view ${p.fullName}`}
                          className="p-1.5 rounded border border-slate-200 dark:border-[#304B5B] text-slate-600 dark:text-slate-300"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingPatient(p)}
                          aria-label={`Edit ${p.fullName}`}
                          className="p-1.5 rounded border border-slate-200 dark:border-[#304B5B] text-slate-600 dark:text-slate-300"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {p.status !== 'Archived' && (
                          <button
                            onClick={() => {
                              archivePatient(p.id);
                              toast.info(`Archived patient ${p.fullName}`);
                            }}
                            aria-label={`Archive ${p.fullName}`}
                            className="p-1.5 rounded border border-slate-200 dark:border-[#304B5B] text-rose-600"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-3.5 border-t border-[#E2EAF0] dark:border-[#304B5B] flex items-center justify-between text-xs text-slate-500">
          <span className="tabular-nums">
            Showing {(page - 1) * pageSize + 1}–
            {Math.min(page * pageSize, filteredPatients.length)} of{' '}
            {filteredPatients.length} patients
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

      {/* Patient Detail Drawer */}
      {drawerPatient && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-slate-950/50 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-white dark:bg-[#172B39] h-full p-6 overflow-y-auto border-l border-[#E2EAF0] dark:border-[#304B5B] flex flex-col justify-between">
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#304B5B]">
                <div>
                  <span className="text-xs font-mono text-[#0891B2]">
                    {drawerPatient.id}
                  </span>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {drawerPatient.fullName}
                  </h2>
                </div>
                <button
                  onClick={() => setDrawerPatient(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#11202D] border border-slate-200 dark:border-[#304B5B] space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Birth Year / Age:</span>
                  <span className="font-mono tabular-nums">
                    {drawerPatient.birthYear} ({2026 - drawerPatient.birthYear}{' '}
                    yrs)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Gender:</span>
                  <span>{drawerPatient.gender}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Demo Phone:</span>
                  <span>{drawerPatient.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Fictional Email:</span>
                  <span>{drawerPatient.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Blood Group Label:</span>
                  <span className="font-mono">{drawerPatient.bloodGroupLabel}</span>
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <div className="font-semibold">Administrative Note</div>
                <p className="p-3 rounded-lg border border-slate-200 dark:border-[#304B5B] text-slate-600 dark:text-slate-300">
                  {drawerPatient.administrativeNotes}
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Link
                  href={`/dashboard/patients/${drawerPatient.id}`}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#0891B2] text-white text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <span>Open Full Patient 360° Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => {
                    const pid = drawerPatient.id;
                    setDrawerPatient(null);
                    setQuickDialog('book_appointment', { patientId: pid });
                  }}
                  className="w-full py-2 px-4 rounded-lg border border-slate-200 dark:border-[#304B5B] text-xs font-medium flex items-center justify-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Book Appointment for {drawerPatient.fullName}</span>
                </button>
              </div>
            </div>

            <button
              onClick={() => setDrawerPatient(null)}
              className="w-full py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] text-xs font-medium"
            >
              Close Drawer
            </button>
          </div>
        </div>
      )}

      {/* Edit Patient Modal */}
      {editingPatient && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-xl bg-white dark:bg-[#172B39] border border-slate-200 dark:border-[#304B5B] shadow-xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#304B5B]">
              <h2 className="text-base font-bold">
                Edit Fictional Patient ({editingPatient.id})
              </h2>
              <button
                onClick={() => setEditingPatient(null)}
                className="p-1 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              className="mt-4 space-y-3.5 text-xs"
              onSubmit={(e) => {
                e.preventDefault();
                updatePatient(editingPatient.id, {
                  fullName: editingPatient.fullName,
                  phone: editingPatient.phone,
                  email: editingPatient.email,
                  address: editingPatient.address,
                  status: editingPatient.status,
                  administrativeNotes: editingPatient.administrativeNotes,
                });
                toast.success(`Updated patient ${editingPatient.fullName}`);
                setEditingPatient(null);
              }}
            >
              <div>
                <label className="block font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editingPatient.fullName}
                  onChange={(e) =>
                    setEditingPatient({
                      ...editingPatient,
                      fullName: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">Demo Phone</label>
                  <input
                    type="text"
                    value={editingPatient.phone}
                    onChange={(e) =>
                      setEditingPatient({
                        ...editingPatient,
                        phone: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D]"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Status</label>
                  <select
                    value={editingPatient.status}
                    onChange={(e) =>
                      setEditingPatient({
                        ...editingPatient,
                        status: e.target.value as PatientStatus,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D]"
                  >
                    <option value="Active">Active</option>
                    <option value="Follow-up Due">Follow-up Due</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-medium mb-1">Address</label>
                <input
                  type="text"
                  value={editingPatient.address}
                  onChange={(e) =>
                    setEditingPatient({
                      ...editingPatient,
                      address: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D]"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">
                  Administrative Notes
                </label>
                <textarea
                  rows={2}
                  value={editingPatient.administrativeNotes}
                  onChange={(e) =>
                    setEditingPatient({
                      ...editingPatient,
                      administrativeNotes: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-[#304B5B]">
                <button
                  type="button"
                  onClick={() => setEditingPatient(null)}
                  className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-lg bg-[#0891B2] text-white font-semibold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
