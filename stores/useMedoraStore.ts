'use client';

import { create } from 'zustand';
import {
  ActivityEventType,
  Appointment,
  AppointmentStatus,
  ClinicRoom,
  ClinicService,
  ClinicStaff,
  Consultation,
  DaySchedule,
  DemoDocument,
  DemoPrescriptionItem,
  DemoRole,
  DocumentType,
  Doctor,
  Invoice,
  InvoiceLine,
  MedoraDataset,
  MedoraUIState,
  Patient,
  Payment,
  PaymentMethod,
  SavedReportConfig,
  ScheduleException,
  Visit,
  WorkspaceSettings,
} from '@/types/medora';
import {
  createDefaultSettings,
  createDefaultUIState,
  DEMO_TODAY,
  generateSeedDataset,
} from '@/lib/seed/generator';
import {
  createBackupJSON,
  loadPersistedState,
  savePersistedDataset,
  savePersistedSettings,
  savePersistedUI,
  validateAndParseBackupJSON,
} from '@/lib/storage/repository';
import {
  canTransitionAppointmentStatus,
  validateAppointmentBooking,
} from '@/lib/scheduling/engine';
import {
  calculateInvoiceSummary,
  validatePaymentAllocation,
} from '@/lib/calculations/billing';
import { CLINICAL_SAMPLE_DISCLAIMER } from '@/lib/pdf/generator';

export type QuickDialogType =
  | null
  | 'add_patient'
  | 'book_appointment'
  | 'add_doctor'
  | 'create_service'
  | 'create_invoice'
  | 'command_palette';

export interface BookingPrefill {
  patientId?: string;
  doctorId?: string;
  serviceId?: string;
  roomId?: string;
  date?: string;
  startTime?: string;
  rescheduleAppointmentId?: string;
}

interface MedoraStoreState {
  hydrated: boolean;
  dataset: MedoraDataset;
  settings: WorkspaceSettings;
  ui: MedoraUIState;
  activeQuickDialog: QuickDialogType;
  bookingPrefill: BookingPrefill | null;

  hydrate: () => void;
  setQuickDialog: (dialog: QuickDialogType, prefill?: BookingPrefill | null) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setActiveRole: (role: DemoRole) => void;
  setSelectedDate: (date: string) => void;
  setActiveWorkspace: (workspace: string) => void;

  // Patient actions
  addPatient: (
    data: Omit<Patient, 'id' | 'registrationDate'> & { registrationDate?: string }
  ) => Patient;
  updatePatient: (id: string, patch: Partial<Patient>) => void;
  archivePatient: (id: string) => void;
  recordPatientAccess: (patientId: string) => void;
  clearRecentPatients: () => void;

  // Doctor & Schedule actions
  addDoctor: (
    data: Omit<Doctor, 'id' | 'avatarInitials'>,
    weeklySchedule?: DaySchedule[]
  ) => Doctor;
  updateDoctor: (id: string, patch: Partial<Doctor>) => void;
  archiveDoctor: (id: string) => void;
  updateDoctorAvailability: (doctorId: string, weeklySchedule: DaySchedule[]) => void;
  addScheduleException: (ex: Omit<ScheduleException, 'id'>) => ScheduleException;
  removeScheduleException: (id: string) => void;

  // Service actions
  addService: (data: Omit<ClinicService, 'id'>) => ClinicService;
  updateService: (id: string, patch: Partial<ClinicService>) => void;
  archiveService: (id: string) => void;

  // Room actions
  addRoom: (data: Omit<ClinicRoom, 'id'>) => ClinicRoom;
  updateRoom: (id: string, patch: Partial<ClinicRoom>) => void;
  archiveRoom: (id: string) => void;

  // Staff actions
  addStaff: (data: Omit<ClinicStaff, 'id'>) => ClinicStaff;
  updateStaff: (id: string, patch: Partial<ClinicStaff>) => void;
  archiveStaff: (id: string) => void;

  // Appointment & Queue actions
  bookAppointment: (input: {
    patientId: string;
    doctorId: string;
    serviceId: string;
    roomId?: string;
    date: string;
    startTime: string;
    reasonForVisit: string;
    administrativeNotes?: string;
  }) => { success: boolean; errors: string[]; appointment?: Appointment };

  rescheduleAppointment: (
    appointmentId: string,
    updates: {
      date: string;
      startTime: string;
      doctorId?: string;
      serviceId?: string;
      roomId?: string;
      reasonForVisit?: string;
    }
  ) => { success: boolean; errors: string[]; appointment?: Appointment };

  transitionAppointmentStatus: (
    appointmentId: string,
    nextStatus: AppointmentStatus
  ) => { success: boolean; error?: string; visitId?: string };

  // Consultation & Sample Document actions
  updateConsultation: (
    consultationId: string,
    patch: Partial<
      Pick<
        Consultation,
        | 'reasonForVisit'
        | 'demoObservations'
        | 'clinicianFreeTextNotes'
        | 'sampleAssessmentText'
        | 'administrativeFollowUp'
        | 'status'
      >
    >
  ) => void;

  completeConsultationAndVisit: (consultationId: string) => void;

  generateSampleDocument: (input: {
    visitId: string;
    type: DocumentType;
    title: string;
    sampleEntries: DemoPrescriptionItem[];
    demoNotes: string;
  }) => DemoDocument | null;

  // Billing & Payment actions
  createInvoice: (input: {
    patientId: string;
    appointmentId?: string;
    visitId?: string;
    issueDate: string;
    dueDate: string;
    lines: Array<Omit<InvoiceLine, 'id'>>;
    taxRatePercent?: number;
    status?: 'Draft' | 'Issued';
    notes?: string;
  }) => Invoice;

  updateDraftInvoice: (
    invoiceId: string,
    patch: {
      dueDate?: string;
      lines?: InvoiceLine[];
      taxRatePercent?: number;
      status?: 'Draft' | 'Issued';
      notes?: string;
    }
  ) => { success: boolean; error?: string };

  voidInvoice: (invoiceId: string) => { success: boolean; error?: string };

  recordPayment: (input: {
    invoiceId: string;
    amount: number;
    paymentDate: string;
    method: PaymentMethod;
    notes?: string;
  }) => { success: boolean; error?: string; payment?: Payment };

  reversePayment: (
    paymentId: string,
    reason: string
  ) => { success: boolean; error?: string };

  // Notifications & Reports & Settings
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  saveReportConfig: (config: Omit<SavedReportConfig, 'id'>) => SavedReportConfig;
  deleteReportConfig: (id: string) => void;
  updateSettings: (patch: Partial<WorkspaceSettings>) => void;

  // Backup / Restore / Reset
  exportBackupJSON: () => string;
  importBackupJSON: (rawJson: string) => { success: boolean; error?: string };
  resetDemoWorkspace: () => void;
}

function createActivityRecord(params: {
  type: ActivityEventType;
  title: string;
  description: string;
  role: DemoRole;
  relatedPatientId?: string;
  relatedAppointmentId?: string;
  relatedDoctorId?: string;
  relatedInvoiceId?: string;
}) {
  return {
    id: `ACT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type: params.type,
    title: params.title,
    description: params.description,
    actorName: `Demo ${params.role}`,
    actorRole: params.role,
    relatedPatientId: params.relatedPatientId,
    relatedAppointmentId: params.relatedAppointmentId,
    relatedDoctorId: params.relatedDoctorId,
    relatedInvoiceId: params.relatedInvoiceId,
    timestamp: new Date().toISOString(),
  };
}

export const useMedoraStore = create<MedoraStoreState>((set, get) => ({
  hydrated: false,
  dataset: generateSeedDataset(),
  settings: createDefaultSettings(),
  ui: createDefaultUIState(),
  activeQuickDialog: null,
  bookingPrefill: null,

  hydrate: () => {
    if (get().hydrated) return;
    const loaded = loadPersistedState();
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle(
        'dark',
        loaded.ui.theme === 'dark'
      );
    }
    set({
      hydrated: true,
      dataset: loaded.dataset,
      settings: loaded.settings,
      ui: loaded.ui,
    });
  },

  setQuickDialog: (dialog, prefill = null) => {
    set({ activeQuickDialog: dialog, bookingPrefill: prefill });
  },

  setTheme: (theme) => {
    const nextUI = { ...get().ui, theme };
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
    savePersistedUI(nextUI);
    set({ ui: nextUI });
  },

  toggleTheme: () => {
    const nextTheme = get().ui.theme === 'dark' ? 'light' : 'dark';
    get().setTheme(nextTheme);
  },

  setSidebarCollapsed: (collapsed) => {
    const nextUI = { ...get().ui, sidebarCollapsed: collapsed };
    savePersistedUI(nextUI);
    set({ ui: nextUI });
  },

  setActiveRole: (activeRole) => {
    const nextUI = { ...get().ui, activeRole };
    savePersistedUI(nextUI);
    set({ ui: nextUI });
  },

  setSelectedDate: (selectedDate) => {
    const nextUI = { ...get().ui, selectedDate };
    savePersistedUI(nextUI);
    set({ ui: nextUI });
  },

  setActiveWorkspace: (activeWorkspace) => {
    const nextUI = { ...get().ui, activeWorkspace };
    savePersistedUI(nextUI);
    set({ ui: nextUI });
  },

  recordPatientAccess: (patientId) => {
    const state = get();
    if (!patientId) return;
    const exists = state.dataset.patients.some((p) => p.id === patientId);
    if (!exists) return;
    const current = state.ui.recentPatientIds ?? [
      'PAT-1001',
      'PAT-1002',
      'PAT-1003',
      'PAT-1004',
      'PAT-1005',
    ];
    if (current[0] === patientId && current.length <= 5) {
      return;
    }
    const nextRecent = [
      patientId,
      ...current.filter((id) => id !== patientId),
    ].slice(0, 5);
    const nextUI: MedoraUIState = {
      ...state.ui,
      recentPatientIds: nextRecent,
    };
    savePersistedUI(nextUI);
    set({ ui: nextUI });
  },

  clearRecentPatients: () => {
    const nextUI: MedoraUIState = {
      ...get().ui,
      recentPatientIds: [],
    };
    savePersistedUI(nextUI);
    set({ ui: nextUI });
  },

  addPatient: (data) => {
    const state = get();
    const nextNum = state.dataset.patients.length + 1001;
    const newPatient: Patient = {
      ...data,
      id: `PAT-${nextNum}`,
      registrationDate: data.registrationDate || DEMO_TODAY,
    };

    const act = createActivityRecord({
      type: 'patient_registered',
      title: `Registered demo patient ${newPatient.fullName}`,
      description: `Patient ID ${newPatient.id} · Birth Year ${newPatient.birthYear}`,
      role: state.ui.activeRole,
      relatedPatientId: newPatient.id,
    });

    const nextDataset: MedoraDataset = {
      ...state.dataset,
      patients: [newPatient, ...state.dataset.patients],
      activities: [act, ...state.dataset.activities],
    };
    savePersistedDataset(nextDataset);
    set({ dataset: nextDataset });
    return newPatient;
  },

  updatePatient: (id, patch) => {
    const state = get();
    const target = state.dataset.patients.find((p) => p.id === id);
    if (!target) return;

    const updated = { ...target, ...patch };
    const act = createActivityRecord({
      type: 'patient_updated',
      title: `Updated patient record for ${updated.fullName}`,
      description: `Patient ID ${id} (${updated.status})`,
      role: state.ui.activeRole,
      relatedPatientId: id,
    });

    const nextDataset: MedoraDataset = {
      ...state.dataset,
      patients: state.dataset.patients.map((p) => (p.id === id ? updated : p)),
      activities: [act, ...state.dataset.activities],
    };
    savePersistedDataset(nextDataset);
    set({ dataset: nextDataset });
  },

  archivePatient: (id) => {
    get().updatePatient(id, { status: 'Archived' });
  },

  addDoctor: (data, weeklySchedule) => {
    const state = get();
    const nextNum = state.dataset.doctors.length + 1;
    const initials = data.fullName
      .replace(/^Dr\.\s*/i, '')
      .split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    const newDoctor: Doctor = {
      ...data,
      id: `DOC-${String(nextNum).padStart(2, '0')}`,
      avatarInitials: initials || 'DR',
    };

    const defaultSchedule: DaySchedule[] = weeklySchedule ?? [
      { dayOfWeek: 0, isWorking: false, startTime: '09:00', endTime: '13:00' },
      { dayOfWeek: 1, isWorking: true, startTime: '08:30', endTime: '17:30', breakStart: '12:30', breakEnd: '13:15' },
      { dayOfWeek: 2, isWorking: true, startTime: '08:30', endTime: '17:30', breakStart: '12:30', breakEnd: '13:15' },
      { dayOfWeek: 3, isWorking: true, startTime: '08:30', endTime: '17:30', breakStart: '12:30', breakEnd: '13:15' },
      { dayOfWeek: 4, isWorking: true, startTime: '08:30', endTime: '17:30', breakStart: '12:30', breakEnd: '13:15' },
      { dayOfWeek: 5, isWorking: true, startTime: '08:30', endTime: '17:30', breakStart: '12:30', breakEnd: '13:15' },
      { dayOfWeek: 6, isWorking: false, startTime: '09:00', endTime: '13:00' },
    ];

    const updatedServices = state.dataset.services.map((srv) =>
      newDoctor.serviceIds.includes(srv.id) && !srv.doctorIds.includes(newDoctor.id)
        ? { ...srv, doctorIds: [...srv.doctorIds, newDoctor.id] }
        : srv
    );

    const act = createActivityRecord({
      type: 'schedule_updated',
      title: `Added clinician profile ${newDoctor.fullName}`,
      description: `${newDoctor.specialty} · ${newDoctor.department}`,
      role: state.ui.activeRole,
      relatedDoctorId: newDoctor.id,
    });

    const nextDataset: MedoraDataset = {
      ...state.dataset,
      doctors: [newDoctor, ...state.dataset.doctors],
      availabilities: [
        ...state.dataset.availabilities,
        { doctorId: newDoctor.id, weeklySchedule: defaultSchedule },
      ],
      services: updatedServices,
      activities: [act, ...state.dataset.activities],
    };
    savePersistedDataset(nextDataset);
    set({ dataset: nextDataset });
    return newDoctor;
  },

  updateDoctor: (id, patch) => {
    const state = get();
    const nextDoctors = state.dataset.doctors.map((d) =>
      d.id === id ? { ...d, ...patch } : d
    );
    const nextDataset: MedoraDataset = {
      ...state.dataset,
      doctors: nextDoctors,
    };
    savePersistedDataset(nextDataset);
    set({ dataset: nextDataset });
  },

  archiveDoctor: (id) => {
    get().updateDoctor(id, { status: 'Archived' });
  },

  updateDoctorAvailability: (doctorId, weeklySchedule) => {
    const state = get();
    const exists = state.dataset.availabilities.some(
      (a) => a.doctorId === doctorId
    );
    const nextAvail = exists
      ? state.dataset.availabilities.map((a) =>
          a.doctorId === doctorId ? { doctorId, weeklySchedule } : a
        )
      : [...state.dataset.availabilities, { doctorId, weeklySchedule }];

    const doc = state.dataset.doctors.find((d) => d.id === doctorId);
    const act = createActivityRecord({
      type: 'schedule_updated',
      title: `Updated working schedule for ${doc?.fullName ?? doctorId}`,
      description: 'Weekly availability and break hours updated.',
      role: state.ui.activeRole,
      relatedDoctorId: doctorId,
    });

    const nextDataset: MedoraDataset = {
      ...state.dataset,
      availabilities: nextAvail,
      activities: [act, ...state.dataset.activities],
    };
    savePersistedDataset(nextDataset);
    set({ dataset: nextDataset });
  },

  addScheduleException: (ex) => {
    const state = get();
    const newEx: ScheduleException = {
      ...ex,
      id: `EXC-${Date.now()}`,
    };
    const nextDataset: MedoraDataset = {
      ...state.dataset,
      scheduleExceptions: [...state.dataset.scheduleExceptions, newEx],
    };
    savePersistedDataset(nextDataset);
    set({ dataset: nextDataset });
    return newEx;
  },

  removeScheduleException: (id) => {
    const state = get();
    const nextDataset: MedoraDataset = {
      ...state.dataset,
      scheduleExceptions: state.dataset.scheduleExceptions.filter(
        (e) => e.id !== id
      ),
    };
    savePersistedDataset(nextDataset);
    set({ dataset: nextDataset });
  },

  addService: (data) => {
    const state = get();
    const newSrv: ClinicService = {
      ...data,
      id: `SRV-${String(state.dataset.services.length + 1).padStart(2, '0')}`,
    };
    const nextDoctors = state.dataset.doctors.map((doc) =>
      newSrv.doctorIds.includes(doc.id) && !doc.serviceIds.includes(newSrv.id)
        ? { ...doc, serviceIds: [...doc.serviceIds, newSrv.id] }
        : doc
    );
    const nextDataset: MedoraDataset = {
      ...state.dataset,
      services: [newSrv, ...state.dataset.services],
      doctors: nextDoctors,
    };
    savePersistedDataset(nextDataset);
    set({ dataset: nextDataset });
    return newSrv;
  },

  updateService: (id, patch) => {
    const state = get();
    const nextDataset: MedoraDataset = {
      ...state.dataset,
      services: state.dataset.services.map((s) =>
        s.id === id ? { ...s, ...patch } : s
      ),
    };
    savePersistedDataset(nextDataset);
    set({ dataset: nextDataset });
  },

  archiveService: (id) => {
    get().updateService(id, { isActive: false });
  },

  addRoom: (data) => {
    const state = get();
    const newRoom: ClinicRoom = {
      ...data,
      id: `RM-${String(400 + state.dataset.rooms.length + 1)}`,
    };
    const nextDataset: MedoraDataset = {
      ...state.dataset,
      rooms: [...state.dataset.rooms, newRoom],
    };
    savePersistedDataset(nextDataset);
    set({ dataset: nextDataset });
    return newRoom;
  },

  updateRoom: (id, patch) => {
    const state = get();
    const nextDataset: MedoraDataset = {
      ...state.dataset,
      rooms: state.dataset.rooms.map((r) =>
        r.id === id ? { ...r, ...patch } : r
      ),
    };
    savePersistedDataset(nextDataset);
    set({ dataset: nextDataset });
  },

  archiveRoom: (id) => {
    get().updateRoom(id, { isActive: false });
  },

  addStaff: (data) => {
    const state = get();
    const newStaff: ClinicStaff = {
      ...data,
      id: `STF-${String(state.dataset.staff.length + 1).padStart(2, '0')}`,
    };
    const nextDataset: MedoraDataset = {
      ...state.dataset,
      staff: [newStaff, ...state.dataset.staff],
    };
    savePersistedDataset(nextDataset);
    set({ dataset: nextDataset });
    return newStaff;
  },

  updateStaff: (id, patch) => {
    const state = get();
    const nextDataset: MedoraDataset = {
      ...state.dataset,
      staff: state.dataset.staff.map((s) =>
        s.id === id ? { ...s, ...patch } : s
      ),
    };
    savePersistedDataset(nextDataset);
    set({ dataset: nextDataset });
  },

  archiveStaff: (id) => {
    get().updateStaff(id, { status: 'Archived' });
  },

  bookAppointment: (input) => {
    const state = get();
    const doc = state.dataset.doctors.find((d) => d.id === input.doctorId);
    const effectiveRoomId = input.roomId || doc?.assignedRoomId;

    const validation = validateAppointmentBooking(
      {
        patientId: input.patientId,
        doctorId: input.doctorId,
        serviceId: input.serviceId,
        roomId: effectiveRoomId,
        date: input.date,
        startTime: input.startTime,
      },
      {
        ...state.dataset,
        settings: state.settings,
      }
    );

    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

    const nowIso = new Date().toISOString();
    const nextIdNum = state.dataset.appointments.length + 1001;
    const newApt: Appointment = {
      id: `APT-${nextIdNum}`,
      patientId: input.patientId,
      doctorId: input.doctorId,
      serviceId: input.serviceId,
      roomId: effectiveRoomId,
      date: input.date,
      startTime: input.startTime,
      endTime: validation.computedEndTime,
      durationMinutes: validation.computedDuration,
      status: 'Scheduled',
      reasonForVisit: input.reasonForVisit || 'Routine outpatient consultation',
      administrativeNotes: input.administrativeNotes,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const pat = state.dataset.patients.find((p) => p.id === input.patientId);
    const srv = state.dataset.services.find((s) => s.id === input.serviceId);

    const act = createActivityRecord({
      type: 'appointment_booked',
      title: `Booked ${srv?.name ?? 'appointment'} for ${pat?.fullName ?? input.patientId}`,
      description: `${doc?.fullName ?? input.doctorId} · ${input.date} at ${input.startTime}–${validation.computedEndTime}`,
      role: state.ui.activeRole,
      relatedPatientId: input.patientId,
      relatedAppointmentId: newApt.id,
      relatedDoctorId: input.doctorId,
    });

    const nextDataset: MedoraDataset = {
      ...state.dataset,
      appointments: [newApt, ...state.dataset.appointments],
      activities: [act, ...state.dataset.activities],
    };
    savePersistedDataset(nextDataset);
    set({ dataset: nextDataset });

    return { success: true, errors: [], appointment: newApt };
  },

  rescheduleAppointment: (appointmentId, updates) => {
    const state = get();
    const existing = state.dataset.appointments.find(
      (a) => a.id === appointmentId
    );
    if (!existing) {
      return { success: false, errors: ['Appointment not found.'] };
    }
    if (existing.status === 'Completed') {
      return {
        success: false,
        errors: ['Completed appointments cannot be rescheduled.'],
      };
    }

    const nextDoctorId = updates.doctorId ?? existing.doctorId;
    const nextServiceId = updates.serviceId ?? existing.serviceId;
    const doc = state.dataset.doctors.find((d) => d.id === nextDoctorId);
    const nextRoomId =
      updates.roomId !== undefined
        ? updates.roomId
        : existing.roomId || doc?.assignedRoomId;

    const validation = validateAppointmentBooking(
      {
        patientId: existing.patientId,
        doctorId: nextDoctorId,
        serviceId: nextServiceId,
        roomId: nextRoomId,
        date: updates.date,
        startTime: updates.startTime,
        excludeAppointmentId: appointmentId,
      },
      {
        ...state.dataset,
        settings: state.settings,
      }
    );

    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

    const updatedApt: Appointment = {
      ...existing,
      doctorId: nextDoctorId,
      serviceId: nextServiceId,
      roomId: nextRoomId,
      date: updates.date,
      startTime: updates.startTime,
      endTime: validation.computedEndTime,
      durationMinutes: validation.computedDuration,
      reasonForVisit: updates.reasonForVisit ?? existing.reasonForVisit,
      status:
        existing.status === 'Cancelled' || existing.status === 'No-show'
          ? 'Scheduled'
          : existing.status,
      updatedAt: new Date().toISOString(),
    };

    const pat = state.dataset.patients.find((p) => p.id === existing.patientId);
    const act = createActivityRecord({
      type: 'appointment_rescheduled',
      title: `Rescheduled appointment ${appointmentId} for ${pat?.fullName ?? existing.patientId}`,
      description: `Moved from ${existing.date} ${existing.startTime} to ${updates.date} ${updates.startTime} (${doc?.fullName ?? nextDoctorId})`,
      role: state.ui.activeRole,
      relatedPatientId: existing.patientId,
      relatedAppointmentId: appointmentId,
      relatedDoctorId: nextDoctorId,
    });

    const nextDataset: MedoraDataset = {
      ...state.dataset,
      appointments: state.dataset.appointments.map((a) =>
        a.id === appointmentId ? updatedApt : a
      ),
      activities: [act, ...state.dataset.activities],
    };
    savePersistedDataset(nextDataset);
    set({ dataset: nextDataset });

    return { success: true, errors: [], appointment: updatedApt };
  },

  transitionAppointmentStatus: (appointmentId, nextStatus) => {
    const state = get();
    const apt = state.dataset.appointments.find((a) => a.id === appointmentId);
    if (!apt) {
      return { success: false, error: 'Appointment record not found.' };
    }

    if (!canTransitionAppointmentStatus(apt.status, nextStatus)) {
      return {
        success: false,
        error: `Invalid status transition from "${apt.status}" to "${nextStatus}".`,
      };
    }

    const nowIso = new Date().toISOString();
    const updatedApt: Appointment = {
      ...apt,
      status: nextStatus,
      updatedAt: nowIso,
    };

    if (nextStatus === 'Checked In') {
      updatedApt.checkedInAt = updatedApt.checkedInAt || nowIso;
      updatedApt.waitingSince = updatedApt.waitingSince || nowIso;
    } else if (nextStatus === 'Waiting') {
      updatedApt.checkedInAt = updatedApt.checkedInAt || nowIso;
      updatedApt.waitingSince = updatedApt.waitingSince || nowIso;
    } else if (nextStatus === 'In Consultation') {
      updatedApt.checkedInAt = updatedApt.checkedInAt || nowIso;
      updatedApt.consultationStartedAt =
        updatedApt.consultationStartedAt || nowIso;
    } else if (nextStatus === 'Completed') {
      updatedApt.consultationStartedAt =
        updatedApt.consultationStartedAt || nowIso;
      updatedApt.consultationCompletedAt = nowIso;
    }

    let nextVisits = [...state.dataset.visits];
    let nextConsultations = [...state.dataset.consultations];
    let nextPatients = [...state.dataset.patients];
    let createdOrFoundVisitId: string | undefined;

    // Prevent duplicate visit creation when entering In Consultation or Completed
    if (nextStatus === 'In Consultation' || nextStatus === 'Completed') {
      const existingVisit = nextVisits.find(
        (v) => v.appointmentId === appointmentId
      );
      const doc = state.dataset.doctors.find((d) => d.id === apt.doctorId);
      const srv = state.dataset.services.find((s) => s.id === apt.serviceId);

      if (existingVisit) {
        createdOrFoundVisitId = existingVisit.id;
        if (nextStatus === 'Completed' && existingVisit.status !== 'Completed') {
          nextVisits = nextVisits.map((v) =>
            v.id === existingVisit.id ? { ...v, status: 'Completed' } : v
          );
        }
      } else {
        const newVisitId = `VIS-${String(1000 + nextVisits.length + 1)}`;
        createdOrFoundVisitId = newVisitId;
        const newVisit: Visit = {
          id: newVisitId,
          appointmentId: apt.id,
          patientId: apt.patientId,
          doctorId: apt.doctorId,
          serviceId: apt.serviceId,
          roomId: apt.roomId,
          visitDate: apt.date,
          status: nextStatus === 'Completed' ? 'Completed' : 'In Progress',
          summaryTitle: `${srv?.name ?? 'Outpatient Visit'} — ${doc?.fullName ?? apt.doctorId}`,
          createdAt: nowIso,
        };
        nextVisits = [newVisit, ...nextVisits];
      }

      // Ensure Consultation record exists without duplication
      const existingCon = nextConsultations.find(
        (c) => c.appointmentId === appointmentId
      );
      if (existingCon) {
        nextConsultations = nextConsultations.map((c) =>
          c.id === existingCon.id
            ? {
                ...c,
                status: nextStatus === 'Completed' ? 'Completed' : 'Active',
                updatedAt: nowIso,
              }
            : c
        );
      } else {
        const newCon: Consultation = {
          id: `CON-${String(1000 + nextConsultations.length + 1)}`,
          visitId: createdOrFoundVisitId,
          appointmentId: apt.id,
          patientId: apt.patientId,
          doctorId: apt.doctorId,
          visitDate: apt.date,
          status: nextStatus === 'Completed' ? 'Completed' : 'Active',
          reasonForVisit: apt.reasonForVisit,
          demoObservations:
            'Demo entry: Patient checked in at reception and entered consultation room.',
          clinicianFreeTextNotes:
            'Fictional outpatient demonstration notes recorded during simulated visit.',
          sampleAssessmentText:
            'Simulated Assessment (Non-Clinical): Routine outpatient check-in.',
          administrativeFollowUp:
            'Schedule routine administrative follow-up if needed.',
          updatedAt: nowIso,
        };
        nextConsultations = [newCon, ...nextConsultations];
      }
    }

    if (nextStatus === 'Completed') {
      nextPatients = nextPatients.map((p) =>
        p.id === apt.patientId
          ? {
              ...p,
              lastVisitDate:
                !p.lastVisitDate || apt.date > p.lastVisitDate
                  ? apt.date
                  : p.lastVisitDate,
            }
          : p
      );
    }

    const pat = state.dataset.patients.find((p) => p.id === apt.patientId);
    const actType: ActivityEventType =
      nextStatus === 'Checked In' || nextStatus === 'Waiting'
        ? 'patient_checked_in'
        : nextStatus === 'In Consultation'
        ? 'consultation_started'
        : nextStatus === 'Completed'
        ? 'consultation_completed'
        : 'appointment_status_changed';

    const act = createActivityRecord({
      type: actType,
      title: `Appointment ${apt.id} marked "${nextStatus}" for ${pat?.fullName ?? apt.patientId}`,
      description: `${apt.date} at ${apt.startTime}`,
      role: state.ui.activeRole,
      relatedPatientId: apt.patientId,
      relatedAppointmentId: apt.id,
      relatedDoctorId: apt.doctorId,
    });

    const nextDataset: MedoraDataset = {
      ...state.dataset,
      appointments: state.dataset.appointments.map((a) =>
        a.id === appointmentId ? updatedApt : a
      ),
      visits: nextVisits,
      consultations: nextConsultations,
      patients: nextPatients,
      activities: [act, ...state.dataset.activities],
    };

    savePersistedDataset(nextDataset);
    set({ dataset: nextDataset });

    return { success: true, visitId: createdOrFoundVisitId };
  },

  updateConsultation: (consultationId, patch) => {
    const state = get();
    const nextDataset: MedoraDataset = {
      ...state.dataset,
      consultations: state.dataset.consultations.map((c) =>
        c.id === consultationId
          ? { ...c, ...patch, updatedAt: new Date().toISOString() }
          : c
      ),
    };
    savePersistedDataset(nextDataset);
    set({ dataset: nextDataset });
  },

  completeConsultationAndVisit: (consultationId) => {
    const state = get();
    const con = state.dataset.consultations.find((c) => c.id === consultationId);
    if (!con) return;

    get().updateConsultation(consultationId, { status: 'Completed' });
    const apt = state.dataset.appointments.find(
      (a) => a.id === con.appointmentId
    );
    if (apt && apt.status !== 'Completed') {
      // Transition to In Consultation first if needed, then Completed
      if (apt.status === 'Scheduled' || apt.status === 'Confirmed') {
        get().transitionAppointmentStatus(apt.id, 'Checked In');
      }
      if (
        get().dataset.appointments.find((a) => a.id === apt.id)?.status !==
        'In Consultation'
      ) {
        get().transitionAppointmentStatus(apt.id, 'In Consultation');
      }
      get().transitionAppointmentStatus(apt.id, 'Completed');
    }
  },

  generateSampleDocument: (input) => {
    const state = get();
    const visit = state.dataset.visits.find((v) => v.id === input.visitId);
    if (!visit) return null;

    const nextNum = state.dataset.documents.length + 2001;
    const isRx = input.type === 'Sample Prescription';
    const newDoc: DemoDocument = {
      id: `DOCM-${nextNum}`,
      referenceNumber: isRx ? `RX-SAMPLE-${nextNum}` : `VS-SAMPLE-${nextNum}`,
      visitId: visit.id,
      appointmentId: visit.appointmentId,
      patientId: visit.patientId,
      doctorId: visit.doctorId,
      visitDate: visit.visitDate,
      type: input.type,
      title: input.title,
      sampleEntries: input.sampleEntries,
      demoNotes: input.demoNotes,
      disclaimerText: CLINICAL_SAMPLE_DISCLAIMER,
      createdAt: new Date().toISOString(),
    };

    const pat = state.dataset.patients.find((p) => p.id === visit.patientId);
    const act = createActivityRecord({
      type: 'document_generated',
      title: `Generated ${input.type} (${newDoc.referenceNumber})`,
      description: `For ${pat?.fullName ?? visit.patientId} · Non-clinical sample document`,
      role: state.ui.activeRole,
      relatedPatientId: visit.patientId,
      relatedAppointmentId: visit.appointmentId,
      relatedDoctorId: visit.doctorId,
    });

    const nextDataset: MedoraDataset = {
      ...state.dataset,
      documents: [newDoc, ...state.dataset.documents],
      activities: [act, ...state.dataset.activities],
    };
    savePersistedDataset(nextDataset);
    set({ dataset: nextDataset });
    return newDoc;
  },

  createInvoice: (input) => {
    const state = get();
    const nextNum = state.dataset.invoices.length + 1001;
    const invId = `INV-${nextNum}`;
    const invoiceNumber = `${state.settings.invoicePrefix}${nextNum}`;
    const taxRate =
      input.taxRatePercent !== undefined
        ? input.taxRatePercent
        : state.settings.defaultTaxRatePercent;

    const lines: InvoiceLine[] = input.lines.map((l, idx) => ({
      ...l,
      id: `${invId}-L${idx + 1}`,
    }));

    const summary = calculateInvoiceSummary({
      lines,
      taxRatePercent: taxRate,
      payments: [],
      currentStatus: input.status ?? 'Issued',
    });

    const newInvoice: Invoice = {
      id: invId,
      invoiceNumber,
      patientId: input.patientId,
      appointmentId: input.appointmentId,
      visitId: input.visitId,
      issueDate: input.issueDate,
      dueDate: input.dueDate,
      lines,
      taxRatePercent: taxRate,
      subtotal: summary.subtotal,
      discountTotal: summary.discountTotal,
      taxAmount: summary.taxAmount,
      totalAmount: summary.totalAmount,
      amountPaid: 0,
      outstandingBalance: summary.outstandingBalance,
      status: summary.status,
      notes: input.notes,
      createdAt: new Date().toISOString(),
    };

    const pat = state.dataset.patients.find((p) => p.id === input.patientId);
    const act = createActivityRecord({
      type: 'invoice_created',
      title: `Created invoice ${invoiceNumber} for ${pat?.fullName ?? input.patientId}`,
      description: `Total $${summary.totalAmount.toFixed(2)} (${summary.status})`,
      role: state.ui.activeRole,
      relatedPatientId: input.patientId,
      relatedAppointmentId: input.appointmentId,
      relatedInvoiceId: invId,
    });

    const nextDataset: MedoraDataset = {
      ...state.dataset,
      invoices: [newInvoice, ...state.dataset.invoices],
      activities: [act, ...state.dataset.activities],
    };
    savePersistedDataset(nextDataset);
    set({ dataset: nextDataset });
    return newInvoice;
  },

  updateDraftInvoice: (invoiceId, patch) => {
    const state = get();
    const inv = state.dataset.invoices.find((i) => i.id === invoiceId);
    if (!inv) return { success: false, error: 'Invoice not found.' };
    if (inv.status !== 'Draft' && inv.status !== 'Issued') {
      return {
        success: false,
        error: 'Only Draft or unpaid Issued invoices can be edited.',
      };
    }

    const nextLines = patch.lines ?? inv.lines;
    const nextTaxRate = patch.taxRatePercent ?? inv.taxRatePercent;
    const relatedPayments = state.dataset.payments.filter(
      (p) => p.invoiceId === invoiceId
    );

    const summary = calculateInvoiceSummary({
      lines: nextLines,
      taxRatePercent: nextTaxRate,
      payments: relatedPayments,
      currentStatus: patch.status ?? inv.status,
    });

    const updated: Invoice = {
      ...inv,
      dueDate: patch.dueDate ?? inv.dueDate,
      lines: nextLines,
      taxRatePercent: nextTaxRate,
      subtotal: summary.subtotal,
      discountTotal: summary.discountTotal,
      taxAmount: summary.taxAmount,
      totalAmount: summary.totalAmount,
      amountPaid: summary.amountPaid,
      outstandingBalance: summary.outstandingBalance,
      status: summary.status,
      notes: patch.notes ?? inv.notes,
    };

    const nextDataset: MedoraDataset = {
      ...state.dataset,
      invoices: state.dataset.invoices.map((i) =>
        i.id === invoiceId ? updated : i
      ),
    };
    savePersistedDataset(nextDataset);
    set({ dataset: nextDataset });
    return { success: true };
  },

  voidInvoice: (invoiceId) => {
    const state = get();
    const inv = state.dataset.invoices.find((i) => i.id === invoiceId);
    if (!inv) return { success: false, error: 'Invoice not found.' };

    const validPayments = state.dataset.payments.filter(
      (p) => p.invoiceId === invoiceId && !p.isReversed
    );
    if (validPayments.length > 0) {
      return {
        success: false,
        error:
          'Cannot void an invoice with active payments. Reverse payments first.',
      };
    }

    const updated: Invoice = {
      ...inv,
      status: 'Voided',
      outstandingBalance: 0,
    };

    const act = createActivityRecord({
      type: 'invoice_voided',
      title: `Voided invoice ${inv.invoiceNumber}`,
      description: `Patient ID ${inv.patientId}`,
      role: state.ui.activeRole,
      relatedPatientId: inv.patientId,
      relatedInvoiceId: inv.id,
    });

    const nextDataset: MedoraDataset = {
      ...state.dataset,
      invoices: state.dataset.invoices.map((i) =>
        i.id === invoiceId ? updated : i
      ),
      activities: [act, ...state.dataset.activities],
    };
    savePersistedDataset(nextDataset);
    set({ dataset: nextDataset });
    return { success: true };
  },

  recordPayment: (input) => {
    const state = get();
    const inv = state.dataset.invoices.find((i) => i.id === input.invoiceId);
    if (!inv) return { success: false, error: 'Invoice not found.' };

    const check = validatePaymentAllocation(
      inv,
      state.dataset.payments,
      input.amount
    );
    if (!check.valid) {
      return { success: false, error: check.error };
    }

    const nextNum = state.dataset.payments.length + 5001;
    const newPay: Payment = {
      id: `PAY-${nextNum}`,
      paymentReference: `RCPT-${nextNum}`,
      invoiceId: inv.id,
      patientId: inv.patientId,
      amount: Number(input.amount.toFixed(2)),
      paymentDate: input.paymentDate,
      method: input.method,
      notes: input.notes,
      isReversed: false,
      createdAt: new Date().toISOString(),
    };

    const nextPayments = [newPay, ...state.dataset.payments];
    const invoicePayments = nextPayments.filter((p) => p.invoiceId === inv.id);

    const summary = calculateInvoiceSummary({
      lines: inv.lines,
      taxRatePercent: inv.taxRatePercent,
      payments: invoicePayments,
      currentStatus: 'Issued',
    });

    const updatedInvoice: Invoice = {
      ...inv,
      amountPaid: summary.amountPaid,
      outstandingBalance: summary.outstandingBalance,
      status: summary.status,
    };

    const pat = state.dataset.patients.find((p) => p.id === inv.patientId);
    const act = createActivityRecord({
      type: 'payment_recorded',
      title: `Recorded simulated payment ${newPay.paymentReference} ($${newPay.amount.toFixed(2)})`,
      description: `Invoice ${inv.invoiceNumber} · ${pat?.fullName ?? inv.patientId} (${updatedInvoice.status})`,
      role: state.ui.activeRole,
      relatedPatientId: inv.patientId,
      relatedInvoiceId: inv.id,
    });

    const nextDataset: MedoraDataset = {
      ...state.dataset,
      payments: nextPayments,
      invoices: state.dataset.invoices.map((i) =>
        i.id === inv.id ? updatedInvoice : i
      ),
      activities: [act, ...state.dataset.activities],
    };
    savePersistedDataset(nextDataset);
    set({ dataset: nextDataset });

    return { success: true, payment: newPay };
  },

  reversePayment: (paymentId, reason) => {
    const state = get();
    const pay = state.dataset.payments.find((p) => p.id === paymentId);
    if (!pay) return { success: false, error: 'Payment record not found.' };
    if (pay.isReversed) {
      return { success: false, error: 'Payment is already reversed.' };
    }

    const updatedPay: Payment = {
      ...pay,
      isReversed: true,
      reversedAt: new Date().toISOString(),
      reversalReason: reason || 'Administrative payment reversal',
    };

    const nextPayments = state.dataset.payments.map((p) =>
      p.id === paymentId ? updatedPay : p
    );

    const inv = state.dataset.invoices.find((i) => i.id === pay.invoiceId);
    let nextInvoices = state.dataset.invoices;

    if (inv) {
      const invoicePayments = nextPayments.filter(
        (p) => p.invoiceId === inv.id
      );
      const summary = calculateInvoiceSummary({
        lines: inv.lines,
        taxRatePercent: inv.taxRatePercent,
        payments: invoicePayments,
        currentStatus: inv.status === 'Voided' ? 'Voided' : 'Issued',
      });
      const updatedInv: Invoice = {
        ...inv,
        amountPaid: summary.amountPaid,
        outstandingBalance: summary.outstandingBalance,
        status: summary.status,
      };
      nextInvoices = state.dataset.invoices.map((i) =>
        i.id === inv.id ? updatedInv : i
      );
    }

    const act = createActivityRecord({
      type: 'payment_reversed',
      title: `Reversed payment ${pay.paymentReference} ($${pay.amount.toFixed(2)})`,
      description: `Reason: ${updatedPay.reversalReason}`,
      role: state.ui.activeRole,
      relatedPatientId: pay.patientId,
      relatedInvoiceId: pay.invoiceId,
    });

    const nextDataset: MedoraDataset = {
      ...state.dataset,
      payments: nextPayments,
      invoices: nextInvoices,
      activities: [act, ...state.dataset.activities],
    };
    savePersistedDataset(nextDataset);
    set({ dataset: nextDataset });
    return { success: true };
  },

  markNotificationRead: (id) => {
    const state = get();
    const nextDataset: MedoraDataset = {
      ...state.dataset,
      notifications: state.dataset.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      ),
    };
    savePersistedDataset(nextDataset);
    set({ dataset: nextDataset });
  },

  markAllNotificationsRead: () => {
    const state = get();
    const nextDataset: MedoraDataset = {
      ...state.dataset,
      notifications: state.dataset.notifications.map((n) => ({
        ...n,
        isRead: true,
      })),
    };
    savePersistedDataset(nextDataset);
    set({ dataset: nextDataset });
  },

  saveReportConfig: (config) => {
    const state = get();
    const newRep: SavedReportConfig = {
      ...config,
      id: `REP-${Date.now()}`,
    };
    const nextDataset: MedoraDataset = {
      ...state.dataset,
      savedReports: [newRep, ...state.dataset.savedReports],
    };
    savePersistedDataset(nextDataset);
    set({ dataset: nextDataset });
    return newRep;
  },

  deleteReportConfig: (id) => {
    const state = get();
    const nextDataset: MedoraDataset = {
      ...state.dataset,
      savedReports: state.dataset.savedReports.filter((r) => r.id !== id),
    };
    savePersistedDataset(nextDataset);
    set({ dataset: nextDataset });
  },

  updateSettings: (patch) => {
    const state = get();
    const nextSettings = { ...state.settings, ...patch };
    const act = createActivityRecord({
      type: 'settings_updated',
      title: 'Updated clinic workspace configuration',
      description: `${nextSettings.clinicName} (${nextSettings.timezone})`,
      role: state.ui.activeRole,
    });
    const nextDataset: MedoraDataset = {
      ...state.dataset,
      activities: [act, ...state.dataset.activities],
    };
    savePersistedSettings(nextSettings);
    savePersistedDataset(nextDataset);
    set({ settings: nextSettings, dataset: nextDataset });
  },

  exportBackupJSON: () => {
    const state = get();
    return createBackupJSON(state.dataset, state.settings, state.ui);
  },

  importBackupJSON: (rawJson) => {
    const result = validateAndParseBackupJSON(rawJson);
    if (!result.valid || !result.bundle) {
      return { success: false, error: result.error };
    }
    const { dataset, settings, ui } = result.bundle;
    savePersistedDataset(dataset);
    savePersistedSettings(settings);
    savePersistedUI(ui);
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', ui.theme === 'dark');
    }
    set({ dataset, settings, ui });
    return { success: true };
  },

  resetDemoWorkspace: () => {
    const dataset = generateSeedDataset();
    const settings = createDefaultSettings();
    const ui = createDefaultUIState();
    savePersistedDataset(dataset);
    savePersistedSettings(settings);
    savePersistedUI(ui);
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', ui.theme === 'dark');
    }
    set({ dataset, settings, ui });
  },
}));
