import { z } from 'zod';
import {
  MedoraDataset,
  MedoraUIState,
  WorkspaceSettings,
} from '@/types/medora';
import {
  createDefaultSettings,
  createDefaultUIState,
  generateSeedDataset,
} from '@/lib/seed/generator';

export const STORAGE_KEYS = {
  VERSION: 'medora:version',
  DATA: 'medora:data',
  SETTINGS: 'medora:settings',
  UI: 'medora:ui',
} as const;

export const CURRENT_SCHEMA_VERSION = 1;

const DatasetSchema = z.object({
  version: z.number(),
  patients: z.array(z.any()),
  doctors: z.array(z.any()),
  availabilities: z.array(z.any()),
  scheduleExceptions: z.array(z.any()),
  services: z.array(z.any()),
  rooms: z.array(z.any()),
  staff: z.array(z.any()),
  appointments: z.array(z.any()),
  visits: z.array(z.any()),
  consultations: z.array(z.any()),
  documents: z.array(z.any()),
  invoices: z.array(z.any()),
  payments: z.array(z.any()),
  activities: z.array(z.any()),
  notifications: z.array(z.any()),
  savedReports: z.array(z.any()),
});

const SettingsSchema = z.object({
  clinicName: z.string().min(1),
  tagline: z.string(),
  workspaceBranch: z.string(),
  address: z.string(),
  phone: z.string(),
  email: z.string(),
  operatingHoursStart: z.string(),
  operatingHoursEnd: z.string(),
  weekStart: z.enum(['Monday', 'Sunday']),
  timezone: z.string(),
  slotIntervalMinutes: z.union([z.literal(15), z.literal(20), z.literal(30)]),
  defaultServiceDurationMinutes: z.number(),
  cancellationNoticeHours: z.number(),
  currency: z.string(),
  defaultTaxRatePercent: z.number(),
  invoicePrefix: z.string(),
  paymentTermsDays: z.number(),
  enableQueueAlerts: z.boolean(),
  enableBillingNotifications: z.boolean(),
});

const UIStateSchema = z.object({
  theme: z.enum(['light', 'dark']),
  sidebarCollapsed: z.boolean(),
  activeRole: z.enum([
    'Clinic Administrator',
    'Receptionist',
    'Doctor',
    'Billing Staff',
  ]),
  selectedDate: z.string(),
  activeWorkspace: z.string(),
  recentPatientIds: z.array(z.string()).optional(),
});

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function loadPersistedState(): {
  dataset: MedoraDataset;
  settings: WorkspaceSettings;
  ui: MedoraUIState;
  recoveredFromCorruption: boolean;
} {
  if (!isBrowser()) {
    return {
      dataset: generateSeedDataset(),
      settings: createDefaultSettings(),
      ui: createDefaultUIState(),
      recoveredFromCorruption: false,
    };
  }

  let recoveredFromCorruption = false;
  let dataset: MedoraDataset | null = null;
  let settings: WorkspaceSettings | null = null;
  let ui: MedoraUIState | null = null;

  try {
    const rawData = window.localStorage.getItem(STORAGE_KEYS.DATA);
    if (rawData) {
      const parsed = JSON.parse(rawData);
      const validated = DatasetSchema.safeParse(parsed);
      if (validated.success && parsed.patients?.length > 0) {
        dataset = parsed as MedoraDataset;
      } else {
        recoveredFromCorruption = true;
      }
    }
  } catch {
    recoveredFromCorruption = true;
  }

  try {
    const rawSettings = window.localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (rawSettings) {
      const parsed = JSON.parse(rawSettings);
      const validated = SettingsSchema.safeParse(parsed);
      if (validated.success) {
        settings = validated.data;
      } else {
        recoveredFromCorruption = true;
      }
    }
  } catch {
    recoveredFromCorruption = true;
  }

  try {
    const rawUI = window.localStorage.getItem(STORAGE_KEYS.UI);
    if (rawUI) {
      const parsed = JSON.parse(rawUI);
      const validated = UIStateSchema.safeParse(parsed);
      if (validated.success) {
        ui = validated.data;
      }
    }
  } catch {
    // Fallback UI state silently
  }

  const finalDataset = dataset ?? generateSeedDataset();
  const finalSettings = settings ?? createDefaultSettings();
  const finalUI = ui ?? createDefaultUIState();

  savePersistedDataset(finalDataset);
  savePersistedSettings(finalSettings);
  savePersistedUI(finalUI);

  return {
    dataset: finalDataset,
    settings: finalSettings,
    ui: finalUI,
    recoveredFromCorruption,
  };
}

export function savePersistedDataset(dataset: MedoraDataset): boolean {
  if (!isBrowser()) return false;
  try {
    window.localStorage.setItem(
      STORAGE_KEYS.VERSION,
      String(CURRENT_SCHEMA_VERSION)
    );
    window.localStorage.setItem(STORAGE_KEYS.DATA, JSON.stringify(dataset));
    return true;
  } catch {
    return false;
  }
}

export function savePersistedSettings(settings: WorkspaceSettings): boolean {
  if (!isBrowser()) return false;
  try {
    window.localStorage.setItem(
      STORAGE_KEYS.SETTINGS,
      JSON.stringify(settings)
    );
    return true;
  } catch {
    return false;
  }
}

export function savePersistedUI(ui: MedoraUIState): boolean {
  if (!isBrowser()) return false;
  try {
    window.localStorage.setItem(STORAGE_KEYS.UI, JSON.stringify(ui));
    return true;
  } catch {
    return false;
  }
}

export interface MedoraBackupBundle {
  schemaVersion: number;
  exportedAt: string;
  application: 'MEDORA Health';
  dataset: MedoraDataset;
  settings: WorkspaceSettings;
  ui: MedoraUIState;
}

export function createBackupJSON(
  dataset: MedoraDataset,
  settings: WorkspaceSettings,
  ui: MedoraUIState
): string {
  const bundle: MedoraBackupBundle = {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    application: 'MEDORA Health',
    dataset,
    settings,
    ui,
  };
  return JSON.stringify(bundle, null, 2);
}

export function validateAndParseBackupJSON(rawJson: string): {
  valid: boolean;
  error?: string;
  bundle?: MedoraBackupBundle;
} {
  try {
    const parsed = JSON.parse(rawJson);
    if (!parsed || typeof parsed !== 'object') {
      return { valid: false, error: 'Backup file is not a valid JSON object.' };
    }
    const dsCheck = DatasetSchema.safeParse(parsed.dataset);
    if (!dsCheck.success) {
      return {
        valid: false,
        error: 'Backup JSON is missing required MEDORA dataset collections.',
      };
    }
    const setCheck = SettingsSchema.safeParse(parsed.settings);
    if (!setCheck.success) {
      return {
        valid: false,
        error: 'Backup JSON contains invalid clinic settings configuration.',
      };
    }
    return {
      valid: true,
      bundle: {
        schemaVersion: parsed.schemaVersion ?? CURRENT_SCHEMA_VERSION,
        exportedAt: parsed.exportedAt ?? new Date().toISOString(),
        application: 'MEDORA Health',
        dataset: parsed.dataset as MedoraDataset,
        settings: setCheck.data,
        ui: UIStateSchema.safeParse(parsed.ui).success
          ? parsed.ui
          : createDefaultUIState(),
      },
    };
  } catch {
    return { valid: false, error: 'Failed to parse JSON backup file.' };
  }
}
