'use client';

import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Edit3, Archive, X, DoorOpen } from 'lucide-react';
import { useMedoraStore } from '@/stores/useMedoraStore';
import { ClinicRoom, RoomType } from '@/types/medora';

export default function RoomsManagementPage() {
  const {
    dataset,
    ui,
    addRoom,
    updateRoom,
    archiveRoom,
  } = useMedoraStore();

  const [createOpen, setCreateOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<ClinicRoom | null>(null);
  const [newCode, setNewCode] = useState('C-105');
  const [newName, setNewName] = useState('Consultation Suite 105');
  const [newType, setNewType] = useState<RoomType>('Consultation');
  const [newFloor, setNewFloor] = useState('Floor 1 — West Wing');
  const [newEquip, setNewEquip] = useState(
    'Standard examination station, digital vitals display'
  );

  const patientMap = useMemo(
    () => new Map(dataset.patients.map((p) => [p.id, p])),
    [dataset.patients]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#173042] dark:text-white">
            Room &amp; Resource Management
          </h1>
          <p className="text-xs text-[#64748B] dark:text-[#9BB0BE] mt-0.5">
            Exclusive rooms prevent overlapping appointments in the scheduling engine · Viewing bookings for {ui.selectedDate}
          </p>
        </div>

        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0891B2] hover:bg-cyan-700 text-white text-xs font-semibold"
        >
          <Plus className="w-4 h-4" />
          <span>Add Clinic Room</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {dataset.rooms.map((room) => {
          const todaysRoomApts = dataset.appointments
            .filter(
              (a) =>
                a.roomId === room.id &&
                a.date === ui.selectedDate &&
                a.status !== 'Cancelled'
            )
            .sort((a, b) => a.startTime.localeCompare(b.startTime));

          return (
            <div
              key={room.id}
              className="p-5 rounded-xl bg-white dark:bg-[#172B39] border border-[#E2EAF0] dark:border-[#304B5B] flex flex-col justify-between space-y-4 text-xs"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono font-bold text-[#0891B2] dark:text-[#22D3EE]">
                      {room.code}
                    </span>
                    <h2 className="font-bold text-sm text-slate-900 dark:text-white">
                      {room.name}
                    </h2>
                    <div className="text-[11px] text-slate-500">
                      {room.type} · {room.floor}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                      room.isActive
                        ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {room.isActive ? 'Available' : 'Archived'}
                  </span>
                </div>

                <p className="text-slate-500 dark:text-slate-300">
                  {room.equipmentSummary}
                </p>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#11202D] border border-slate-200 dark:border-[#304B5B] space-y-1.5">
                  <div className="font-semibold text-slate-700 dark:text-slate-200 flex justify-between">
                    <span>Schedule ({ui.selectedDate})</span>
                    <span className="font-mono">{todaysRoomApts.length} slots</span>
                  </div>
                  {todaysRoomApts.slice(0, 4).map((a) => (
                    <div
                      key={a.id}
                      className="flex justify-between text-[11px] text-slate-600 dark:text-slate-300"
                    >
                      <span className="font-mono tabular-nums">
                        {a.startTime}–{a.endTime}
                      </span>
                      <span className="truncate max-w-[110px]">
                        {patientMap.get(a.patientId)?.fullName ?? a.patientId}
                      </span>
                    </div>
                  ))}
                  {todaysRoomApts.length === 0 && (
                    <div className="text-[11px] text-slate-400">
                      All slots open today
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-[#304B5B] flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  {room.isExclusive ? 'Exclusive Conflict Lock' : 'Shared Bay'}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditingRoom(room)}
                    className="p-1.5 rounded border border-slate-200 dark:border-[#304B5B]"
                    aria-label={`Edit ${room.name}`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  {room.isActive && (
                    <button
                      onClick={() => {
                        archiveRoom(room.id);
                        toast.info(`Archived room ${room.name}`);
                      }}
                      className="p-1.5 rounded border border-slate-200 dark:border-[#304B5B] text-rose-600"
                      aria-label={`Archive ${room.name}`}
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

      {/* Create Room Modal */}
      {createOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-xl bg-white dark:bg-[#172B39] border border-slate-200 dark:border-[#304B5B] p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#304B5B]">
              <h2 className="text-base font-bold">Add Clinic Room</h2>
              <button onClick={() => setCreateOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                const created = addRoom({
                  code: newCode.trim(),
                  name: newName.trim(),
                  type: newType,
                  floor: newFloor.trim(),
                  equipmentSummary: newEquip.trim(),
                  isExclusive: true,
                  isActive: true,
                });
                toast.success(`Created room ${created.code} — ${created.name}`);
                setCreateOpen(false);
              }}
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">Room Code</label>
                  <input
                    type="text"
                    required
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D]"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Room Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as RoomType)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D]"
                  >
                    <option value="Consultation">Consultation</option>
                    <option value="Procedure">Procedure</option>
                    <option value="Diagnostic">Diagnostic</option>
                    <option value="Telehealth Booth">Telehealth Booth</option>
                    <option value="Triage">Triage</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-medium mb-1">Room Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D]"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Floor / Wing</label>
                <input
                  type="text"
                  value={newFloor}
                  onChange={(e) => setNewFloor(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D]"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">
                  Equipment Summary
                </label>
                <input
                  type="text"
                  value={newEquip}
                  onChange={(e) => setNewEquip(e.target.value)}
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
                  Save Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Room Modal */}
      {editingRoom && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-xl bg-white dark:bg-[#172B39] border border-slate-200 dark:border-[#304B5B] p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#304B5B]">
              <h2 className="text-base font-bold">
                Edit Room ({editingRoom.code})
              </h2>
              <button onClick={() => setEditingRoom(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                updateRoom(editingRoom.id, {
                  name: editingRoom.name,
                  floor: editingRoom.floor,
                  equipmentSummary: editingRoom.equipmentSummary,
                  isActive: editingRoom.isActive,
                });
                toast.success(`Updated room ${editingRoom.code}`);
                setEditingRoom(null);
              }}
            >
              <div>
                <label className="block font-medium mb-1">Room Name</label>
                <input
                  type="text"
                  value={editingRoom.name}
                  onChange={(e) =>
                    setEditingRoom({ ...editingRoom, name: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D]"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">
                  Equipment Summary
                </label>
                <input
                  type="text"
                  value={editingRoom.equipmentSummary}
                  onChange={(e) =>
                    setEditingRoom({
                      ...editingRoom,
                      equipmentSummary: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingRoom(null)}
                  className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-lg bg-[#0891B2] text-white font-semibold"
                >
                  Save Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
