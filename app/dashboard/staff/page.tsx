'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Plus, Edit3, Archive, X } from 'lucide-react';
import { useMedoraStore } from '@/stores/useMedoraStore';
import { ClinicStaff, DemoRole, StaffRole } from '@/types/medora';

export default function StaffDirectoryPage() {
  const {
    dataset,
    ui,
    setActiveRole,
    addStaff,
    updateStaff,
    archiveStaff,
  } = useMedoraStore();

  const [createOpen, setCreateOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<ClinicStaff | null>(null);

  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<StaffRole>('Receptionist');
  const [newDept, setNewDept] = useState('Front Desk');
  const [newArea, setNewArea] = useState('Main Lobby Check-In Desk');
  const [newShift, setNewShift] = useState('Mon–Fri 08:30–17:00');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#173042] dark:text-white">
            Clinic Staff Directory &amp; Demo Roles
          </h1>
          <p className="text-xs text-[#64748B] dark:text-[#9BB0BE] mt-0.5">
            {dataset.staff.length} fictional staff records · Active simulated role: <strong>{ui.activeRole}</strong>
          </p>
        </div>

        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0891B2] hover:bg-cyan-700 text-white text-xs font-semibold"
        >
          <Plus className="w-4 h-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Simulated Role Switcher Banner */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#172B39] border border-[#E2EAF0] dark:border-[#304B5B] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div>
          <div className="font-semibold text-slate-900 dark:text-white">
            Simulated Operator Role Switcher
          </div>
          <p className="text-slate-500">
            Role selection changes simulated activity attribution in the browser demo. It does not provide real authentication or security.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              'Clinic Administrator',
              'Receptionist',
              'Doctor',
              'Billing Staff',
            ] as DemoRole[]
          ).map((r) => (
            <button
              key={r}
              onClick={() => {
                setActiveRole(r);
                toast.success(`Switched simulated demo role to "${r}"`);
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                ui.activeRole === r
                  ? 'bg-[#0891B2] text-white'
                  : 'bg-slate-100 dark:bg-[#11202D] text-slate-700 dark:text-slate-300'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Staff Table */}
      <div className="rounded-xl bg-white dark:bg-[#172B39] border border-[#E2EAF0] dark:border-[#304B5B] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E2EAF0] dark:border-[#304B5B] bg-slate-50/70 dark:bg-[#11202D] text-[#64748B] dark:text-[#9BB0BE]">
                <th className="py-3 px-3.5 font-medium">ID</th>
                <th className="py-3 px-3.5 font-medium">Fictional Name</th>
                <th className="py-3 px-3.5 font-medium">Role</th>
                <th className="py-3 px-3.5 font-medium">Department</th>
                <th className="py-3 px-3.5 font-medium">Operational Area</th>
                <th className="py-3 px-3.5 font-medium">Work Schedule</th>
                <th className="py-3 px-3.5 font-medium">Status</th>
                <th className="py-3 px-3.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#304B5B]">
              {dataset.staff.map((st) => (
                <tr
                  key={st.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-[#203847]/60"
                >
                  <td className="py-2.5 px-3.5 font-mono font-semibold text-[#0891B2]">
                    {st.id}
                  </td>
                  <td className="py-2.5 px-3.5">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {st.fullName}
                    </div>
                    <div className="text-[11px] text-slate-400">{st.email}</div>
                  </td>
                  <td className="py-2.5 px-3.5 font-medium">{st.role}</td>
                  <td className="py-2.5 px-3.5">{st.department}</td>
                  <td className="py-2.5 px-3.5 text-slate-600 dark:text-slate-300">
                    {st.assignedArea}
                  </td>
                  <td className="py-2.5 px-3.5 font-mono text-[11px]">
                    {st.shiftSchedule}
                  </td>
                  <td className="py-2.5 px-3.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                        st.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {st.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        onClick={() => setEditingStaff(st)}
                        className="p-1.5 rounded border border-slate-200 dark:border-[#304B5B]"
                        aria-label={`Edit ${st.fullName}`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      {st.status !== 'Archived' && (
                        <button
                          onClick={() => {
                            archiveStaff(st.id);
                            toast.info(`Archived staff member ${st.fullName}`);
                          }}
                          className="p-1.5 rounded border border-slate-200 dark:border-[#304B5B] text-rose-600"
                          aria-label={`Archive ${st.fullName}`}
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

      {/* Add Staff Modal */}
      {createOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-xl bg-white dark:bg-[#172B39] border border-slate-200 dark:border-[#304B5B] p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#304B5B]">
              <h2 className="text-base font-bold">Add Fictional Staff Member</h2>
              <button onClick={() => setCreateOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (!newName.trim()) return;
                const created = addStaff({
                  fullName: newName.trim(),
                  role: newRole,
                  department: newDept.trim(),
                  email: `${newName.toLowerCase().replace(/\s+/g, '.')}@medora-demo.example`,
                  phone: '(555) 014-8890',
                  assignedArea: newArea.trim(),
                  shiftSchedule: newShift.trim(),
                  status: 'Active',
                });
                toast.success(`Added staff member ${created.fullName}`);
                setNewName('');
                setCreateOpen(false);
              }}
            >
              <div>
                <label className="block font-medium mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Morgan Ellis"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as StaffRole)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D]"
                  >
                    <option value="Clinic Administrator">
                      Clinic Administrator
                    </option>
                    <option value="Receptionist">Receptionist</option>
                    <option value="Nurse Coordinator">Nurse Coordinator</option>
                    <option value="Billing Staff">Billing Staff</option>
                    <option value="Operations Manager">
                      Operations Manager
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-1">Department</label>
                  <input
                    type="text"
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D]"
                  />
                </div>
              </div>
              <div>
                <label className="block font-medium mb-1">
                  Assigned Operational Area
                </label>
                <input
                  type="text"
                  value={newArea}
                  onChange={(e) => setNewArea(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D]"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Work Schedule</label>
                <input
                  type="text"
                  value={newShift}
                  onChange={(e) => setNewShift(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-lg bg-[#0891B2] text-white font-semibold"
                >
                  Save Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {editingStaff && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-xl bg-white dark:bg-[#172B39] border border-slate-200 dark:border-[#304B5B] p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#304B5B]">
              <h2 className="text-base font-bold">
                Edit Staff ({editingStaff.id})
              </h2>
              <button onClick={() => setEditingStaff(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                updateStaff(editingStaff.id, {
                  fullName: editingStaff.fullName,
                  role: editingStaff.role,
                  assignedArea: editingStaff.assignedArea,
                  shiftSchedule: editingStaff.shiftSchedule,
                });
                toast.success(`Updated ${editingStaff.fullName}`);
                setEditingStaff(null);
              }}
            >
              <div>
                <label className="block font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  value={editingStaff.fullName}
                  onChange={(e) =>
                    setEditingStaff({
                      ...editingStaff,
                      fullName: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D]"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">
                  Assigned Operational Area
                </label>
                <input
                  type="text"
                  value={editingStaff.assignedArea}
                  onChange={(e) =>
                    setEditingStaff({
                      ...editingStaff,
                      assignedArea: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
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
