'use client';

import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Search, Plus, Edit3, Archive, X } from 'lucide-react';
import { useMedoraStore } from '@/stores/useMedoraStore';
import { ClinicService } from '@/types/medora';
import { formatCurrency } from '@/lib/calculations/billing';

export default function ServicesManagementPage() {
  const {
    dataset,
    settings,
    setQuickDialog,
    updateService,
    archiveService,
  } = useMedoraStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [editingService, setEditingService] = useState<ClinicService | null>(null);

  const doctorMap = useMemo(
    () => new Map(dataset.doctors.map((d) => [d.id, d])),
    [dataset.doctors]
  );

  const filteredServices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return dataset.services.filter((s) => {
      if (categoryFilter !== 'all' && s.category !== categoryFilter)
        return false;
      if (q) {
        const hay = `${s.code} ${s.name} ${s.category} ${s.description}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [dataset.services, categoryFilter, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#173042] dark:text-white">
            Clinic Services &amp; Fee Schedule
          </h1>
          <p className="text-xs text-[#64748B] dark:text-[#9BB0BE] mt-0.5">
            Service duration governs appointment slot length · Price updates apply to new invoices while preserving historical invoice snapshots
          </p>
        </div>

        <button
          onClick={() => setQuickDialog('create_service')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0891B2] hover:bg-cyan-700 text-white text-xs font-semibold"
        >
          <Plus className="w-4 h-4" />
          <span>Create Clinic Service</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#172B39] border border-[#E2EAF0] dark:border-[#304B5B] flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search service code, name, or description..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E2EAF0] dark:border-[#304B5B] bg-slate-50 dark:bg-[#11202D]"
          />
        </div>

        <select
          aria-label="Filter by service category"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-lg border border-[#E2EAF0] dark:border-[#304B5B] bg-white dark:bg-[#11202D]"
        >
          <option value="all">All Service Categories</option>
          <option value="General Consultation">General Consultation</option>
          <option value="Specialist Review">Specialist Review</option>
          <option value="Preventive Screening">Preventive Screening</option>
          <option value="Follow-up Care">Follow-up Care</option>
          <option value="Diagnostic Assessment">Diagnostic Assessment</option>
          <option value="Wellness Counseling">Wellness Counseling</option>
        </select>
      </div>

      {/* Services Table */}
      <div className="rounded-xl bg-white dark:bg-[#172B39] border border-[#E2EAF0] dark:border-[#304B5B] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E2EAF0] dark:border-[#304B5B] bg-slate-50/70 dark:bg-[#11202D] text-[#64748B] dark:text-[#9BB0BE]">
                <th className="py-3 px-3.5 font-medium">Code</th>
                <th className="py-3 px-3.5 font-medium">Service Name</th>
                <th className="py-3 px-3.5 font-medium">Category</th>
                <th className="py-3 px-3.5 font-medium text-right">Duration</th>
                <th className="py-3 px-3.5 font-medium text-right">Standard Fee</th>
                <th className="py-3 px-3.5 font-medium">Assigned Clinicians</th>
                <th className="py-3 px-3.5 font-medium">Status</th>
                <th className="py-3 px-3.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#304B5B]">
              {filteredServices.map((srv) => (
                <tr
                  key={srv.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-[#203847]/60"
                >
                  <td className="py-3 px-3.5 font-mono font-semibold text-[#0891B2] dark:text-[#22D3EE]">
                    {srv.code}
                  </td>
                  <td className="py-3 px-3.5">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {srv.name}
                    </div>
                    <div className="text-[11px] text-slate-500 max-w-md truncate">
                      {srv.description}
                    </div>
                  </td>
                  <td className="py-3 px-3.5 text-slate-600 dark:text-slate-300">
                    {srv.category}
                  </td>
                  <td className="py-3 px-3.5 text-right font-mono tabular-nums font-medium">
                    {srv.durationMinutes} min
                  </td>
                  <td className="py-3 px-3.5 text-right font-mono tabular-nums font-semibold">
                    {formatCurrency(srv.price, settings.currency)}
                  </td>
                  <td className="py-3 px-3.5 text-slate-600 dark:text-slate-300 max-w-[220px] truncate">
                    {srv.doctorIds
                      .map((id) => doctorMap.get(id)?.fullName ?? id)
                      .join(', ')}
                  </td>
                  <td className="py-3 px-3.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                        srv.isActive
                          ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {srv.isActive ? 'Active' : 'Archived'}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        onClick={() => setEditingService(srv)}
                        className="p-1.5 rounded border border-slate-200 dark:border-[#304B5B]"
                        aria-label={`Edit ${srv.name}`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      {srv.isActive && (
                        <button
                          onClick={() => {
                            archiveService(srv.id);
                            toast.info(`Archived service ${srv.name}`);
                          }}
                          className="p-1.5 rounded border border-slate-200 dark:border-[#304B5B] text-rose-600"
                          aria-label={`Archive ${srv.name}`}
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Service Modal */}
      {editingService && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-xl bg-white dark:bg-[#172B39] border border-slate-200 dark:border-[#304B5B] p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#304B5B]">
              <h2 className="text-base font-bold">
                Edit Service ({editingService.code})
              </h2>
              <button onClick={() => setEditingService(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                updateService(editingService.id, {
                  name: editingService.name,
                  durationMinutes: Number(editingService.durationMinutes) || 30,
                  price: Number(editingService.price) || 100,
                  description: editingService.description,
                  isActive: editingService.isActive,
                });
                toast.success(`Updated service "${editingService.name}"`);
                setEditingService(null);
              }}
            >
              <div>
                <label className="block font-medium mb-1">Service Name</label>
                <input
                  type="text"
                  value={editingService.name}
                  onChange={(e) =>
                    setEditingService({
                      ...editingService,
                      name: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">
                    Duration (minutes)
                  </label>
                  <select
                    value={editingService.durationMinutes}
                    onChange={(e) =>
                      setEditingService({
                        ...editingService,
                        durationMinutes: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D]"
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-1">Price ($)</label>
                  <input
                    type="number"
                    min={10}
                    value={editingService.price}
                    onChange={(e) =>
                      setEditingService({
                        ...editingService,
                        price: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D] font-mono tabular-nums"
                  />
                </div>
              </div>
              <div>
                <label className="block font-medium mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingService.description}
                  onChange={(e) =>
                    setEditingService({
                      ...editingService,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingService(null)}
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
