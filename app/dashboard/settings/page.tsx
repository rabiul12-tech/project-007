'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import {
  Save,
  Download,
  Upload,
  RotateCcw,
  Sun,
  Moon,
} from 'lucide-react';
import { useMedoraStore } from '@/stores/useMedoraStore';

export default function ClinicSettingsPage() {
  const {
    settings,
    ui,
    updateSettings,
    setTheme,
    setSidebarCollapsed,
    exportBackupJSON,
    importBackupJSON,
    resetDemoWorkspace,
  } = useMedoraStore();

  const [formState, setFormState] = useState(settings);
  const [restoreJsonText, setRestoreJsonText] = useState('');

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formState);
    toast.success('Persisted clinic workspace settings to LocalStorage.');
  };

  const handleDownloadBackup = () => {
    const json = exportBackupJSON();
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'medora-health-backup.json');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Downloaded full MEDORA JSON backup bundle.');
  };

  const handleRestoreBackup = () => {
    if (!restoreJsonText.trim()) {
      toast.error('Paste or load a valid JSON backup bundle first.');
      return;
    }
    const res = importBackupJSON(restoreJsonText);
    if (!res.success) {
      toast.error(res.error || 'Invalid backup JSON.');
      return;
    }
    toast.success('Restored MEDORA Health workspace from JSON backup.');
    setRestoreJsonText('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#173042] dark:text-white">
          Clinic Settings &amp; LocalStorage Persistence
        </h1>
        <p className="text-xs text-[#64748B] dark:text-[#9BB0BE] mt-0.5">
          Configure clinic profile, scheduling parameters, billing rules, theme preferences, and JSON backup/restore
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Clinic & Scheduling & Billing Form */}
        <form
          onSubmit={handleSaveSettings}
          className="lg:col-span-7 rounded-xl bg-white dark:bg-[#172B39] border border-[#E2EAF0] dark:border-[#304B5B] p-6 space-y-5 text-xs"
        >
          <h2 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-[#304B5B] pb-2.5">
            Clinic Identity &amp; Operating Hours
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">Clinic Name</label>
              <input
                type="text"
                value={formState.clinicName}
                onChange={(e) =>
                  setFormState({ ...formState, clinicName: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D]"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Tagline</label>
              <input
                type="text"
                value={formState.tagline}
                onChange={(e) =>
                  setFormState({ ...formState, tagline: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D]"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Phone</label>
              <input
                type="text"
                value={formState.phone}
                onChange={(e) =>
                  setFormState({ ...formState, phone: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D]"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Email</label>
              <input
                type="email"
                value={formState.email}
                onChange={(e) =>
                  setFormState({ ...formState, email: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D]"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium mb-1">Clinic Address</label>
            <input
              type="text"
              value={formState.address}
              onChange={(e) =>
                setFormState({ ...formState, address: e.target.value })
              }
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D]"
            />
          </div>

          <h2 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-[#304B5B] pb-2.5 pt-2">
            Scheduling &amp; Billing Defaults
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-medium mb-1">Opening Hour</label>
              <input
                type="time"
                value={formState.operatingHoursStart}
                onChange={(e) =>
                  setFormState({
                    ...formState,
                    operatingHoursStart: e.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D] font-mono"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Closing Hour</label>
              <input
                type="time"
                value={formState.operatingHoursEnd}
                onChange={(e) =>
                  setFormState({
                    ...formState,
                    operatingHoursEnd: e.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D] font-mono"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Slot Interval</label>
              <select
                value={formState.slotIntervalMinutes}
                onChange={(e) =>
                  setFormState({
                    ...formState,
                    slotIntervalMinutes: Number(e.target.value) as 15 | 20 | 30,
                  })
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D]"
              >
                <option value={15}>15 minutes</option>
                <option value={20}>20 minutes</option>
                <option value={30}>30 minutes</option>
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1">Timezone</label>
              <select
                value={formState.timezone}
                onChange={(e) =>
                  setFormState({ ...formState, timezone: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D]"
              >
                <option value="America/Los_Angeles">America/Los_Angeles</option>
                <option value="America/New_York">America/New_York</option>
                <option value="Europe/London">Europe/London</option>
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1">Currency</label>
              <select
                value={formState.currency}
                onChange={(e) =>
                  setFormState({ ...formState, currency: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D]"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1">
                Default Tax Rate (%)
              </label>
              <input
                type="number"
                min={0}
                max={25}
                step="0.5"
                value={formState.defaultTaxRatePercent}
                onChange={(e) =>
                  setFormState({
                    ...formState,
                    defaultTaxRatePercent: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D] font-mono"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-[#304B5B] flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0891B2] hover:bg-cyan-700 text-white font-semibold"
            >
              <Save className="w-4 h-4" />
              <span>Save Workspace Settings</span>
            </button>
          </div>
        </form>

        {/* Right: Theme, Backup, Restore & Reset */}
        <div className="lg:col-span-5 space-y-5 text-xs">
          {/* Theme & Interface Preferences */}
          <div className="p-5 rounded-xl bg-white dark:bg-[#172B39] border border-[#E2EAF0] dark:border-[#304B5B] space-y-3">
            <h2 className="text-sm font-bold">
              Theme &amp; Sidebar Preferences
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTheme('light')}
                className={`flex-1 py-2 px-3 rounded-lg border font-medium flex items-center justify-center gap-1.5 ${
                  ui.theme === 'light'
                    ? 'border-[#0891B2] bg-[#EAF8FB] text-[#0891B2]'
                    : 'border-slate-200 dark:border-[#304B5B]'
                }`}
              >
                <Sun className="w-4 h-4" />
                <span>Light Mode</span>
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex-1 py-2 px-3 rounded-lg border font-medium flex items-center justify-center gap-1.5 ${
                  ui.theme === 'dark'
                    ? 'border-[#22D3EE] bg-[#203847] text-[#22D3EE]'
                    : 'border-slate-200 dark:border-[#304B5B]'
                }`}
              >
                <Moon className="w-4 h-4" />
                <span>Dark Mode</span>
              </button>
            </div>

            <label className="flex items-center justify-between pt-2">
              <span>Compact Icon-Only Sidebar (Desktop)</span>
              <input
                type="checkbox"
                checked={ui.sidebarCollapsed}
                onChange={(e) => setSidebarCollapsed(e.target.checked)}
              />
            </label>
          </div>

          {/* JSON Backup & Restore */}
          <div className="p-5 rounded-xl bg-white dark:bg-[#172B39] border border-[#E2EAF0] dark:border-[#304B5B] space-y-3">
            <h2 className="text-sm font-bold">
              JSON Backup &amp; Restore
            </h2>
            <p className="text-slate-500">
              Export your entire browser-local dataset (`medora:data`, `medora:settings`, `medora:ui`) as a portable JSON bundle or restore a saved snapshot.
            </p>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleDownloadBackup}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0891B2] text-white font-semibold"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download JSON Backup</span>
              </button>
              <button
                type="button"
                onClick={() => setRestoreJsonText(exportBackupJSON())}
                className="px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] font-medium"
              >
                Load Current State into Editor
              </button>
            </div>

            <textarea
              rows={4}
              value={restoreJsonText}
              onChange={(e) => setRestoreJsonText(e.target.value)}
              placeholder="Paste MEDORA Health backup JSON here to restore..."
              className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-slate-50 dark:bg-[#11202D] font-mono text-[11px]"
            />

            <button
              type="button"
              onClick={handleRestoreBackup}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#0891B2] text-[#0891B2] dark:text-[#22D3EE] font-semibold"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Restore from JSON</span>
            </button>
          </div>

          {/* Reset Demo Data */}
          <div className="p-5 rounded-xl bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 space-y-2.5">
            <h2 className="text-sm font-bold text-rose-800 dark:text-rose-200">
              Reset Demo Dataset
            </h2>
            <p className="text-rose-700/80 dark:text-rose-300">
              Re-initializes all 150 fictional patients, 12 doctors, 350 appointments, and 200 invoices back to the clean deterministic seed state.
            </p>
            <button
              type="button"
              onClick={() => {
                resetDemoWorkspace();
                setFormState(useMedoraStore.getState().settings);
                toast.success('Reset MEDORA Health demo dataset to clean seed state.');
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Demo Data</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
