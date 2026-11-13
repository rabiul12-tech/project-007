import {
  Appointment,
  AppointmentStatus,
  ClinicRoom,
  ClinicService,
  Doctor,
  DoctorAvailability,
  Patient,
  ScheduleException,
  WorkspaceSettings,
} from '@/types/medora';

/**
 * Validated Appointment Status Transition Model.
 * Prevents invalid status mutations (e.g., Completed -> Waiting or Cancelled -> In Consultation).
 */
export const ALLOWED_STATUS_TRANSITIONS: Record<
  AppointmentStatus,
  AppointmentStatus[]
> = {
  Scheduled: ['Confirmed', 'Checked In', 'Waiting', 'No-show', 'Cancelled'],
  Confirmed: ['Checked In', 'Waiting', 'No-show', 'Cancelled'],
  'Checked In': ['Waiting', 'In Consultation', 'No-show', 'Cancelled'],
  Waiting: ['In Consultation', 'No-show', 'Cancelled'],
  'In Consultation': ['Completed'],
  Completed: [], // Terminal state — cannot be silently transformed back into active booking
  'No-show': ['Scheduled'], // Explicit administrative reschedule recovery only
  Cancelled: ['Scheduled'], // Explicit administrative re-booking only
};

export function canTransitionAppointmentStatus(
  currentStatus: AppointmentStatus,
  nextStatus: AppointmentStatus
): boolean {
  if (currentStatus === nextStatus) return true;
  return ALLOWED_STATUS_TRANSITIONS[currentStatus]?.includes(nextStatus) ?? false;
}

/**
 * Converts HH:mm string into minutes from midnight [0, 1440).
 */
export function timeToMinutes(timeStr: string): number {
  const parts = timeStr.trim().split(':');
  if (parts.length !== 2) return -1;
  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);
  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return -1;
  }
  return hours * 60 + minutes;
}

/**
 * Converts minutes from midnight into zero-padded HH:mm string.
 */
export function minutesToTime(totalMinutes: number): string {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, Math.round(totalMinutes)));
  const hours = Math.floor(clamped / 60);
  const minutes = clamped % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Calculates endTime HH:mm from startTime HH:mm and durationMinutes.
 */
export function calculateEndTime(
  startTime: string,
  durationMinutes: number
): string {
  const startMins = timeToMinutes(startTime);
  if (startMins < 0) return startTime;
  return minutesToTime(startMins + durationMinutes);
}

/**
 * Half-open time interval overlap test: [startA, endA) and [startB, endB)
 * Overlap iff startA < endB AND startB < endA.
 * Back-to-back intervals (e.g. [09:00, 09:30) and [09:30, 10:00)) return false.
 */
export function intervalsOverlap(
  startA: number,
  endA: number,
  startB: number,
  endB: number
): boolean {
  return startA < endB && startB < endA;
}

/**
 * Returns day of week (0 = Sunday ... 6 = Saturday) in local calendar arithmetic
 * from YYYY-MM-DD without UTC timezone drift.
 */
export function getDayOfWeekFromDateString(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return -1;
  const localDate = new Date(y, m - 1, d, 12, 0, 0);
  if (Number.isNaN(localDate.getTime())) return -1;
  return localDate.getDay();
}

export function isValidDateString(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d, 12, 0, 0);
  return (
    dt.getFullYear() === y &&
    dt.getMonth() === m - 1 &&
    dt.getDate() === d
  );
}

/**
 * Active booking statuses that block doctor/room availability.
 * Cancelled and No-show appointments do NOT block availability.
 */
export function isBlockingStatus(status: AppointmentStatus): boolean {
  return status !== 'Cancelled' && status !== 'No-show';
}

export interface SchedulingValidationInput {
  patientId: string;
  doctorId: string;
  serviceId: string;
  roomId?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  durationMinutes?: number;
  excludeAppointmentId?: string; // When rescheduling or editing an existing appointment
}

export interface SchedulingContext {
  patients: Patient[];
  doctors: Doctor[];
  services: ClinicService[];
  rooms: ClinicRoom[];
  availabilities: DoctorAvailability[];
  scheduleExceptions: ScheduleException[];
  appointments: Appointment[];
  settings?: WorkspaceSettings;
}

export interface SchedulingValidationResult {
  valid: boolean;
  errors: string[];
  computedEndTime: string;
  computedDuration: number;
}

/**
 * Centralized Scheduling Engine validation covering all 12 required rules:
 * 1. Patient must exist and not be archived.
 * 2. Doctor must exist and be active.
 * 3. Service must exist and be active.
 * 4. Doctor must provide the selected service.
 * 5. Date must be valid.
 * 6. Duration must be positive.
 * 7. Appointment must fit within doctor's available working hours.
 * 8. Appointment must not conflict with doctor breaks.
 * 9. Appointment must not overlap another active booking for that doctor.
 * 10. Required room must exist, be active, and be available without conflict.
 * 11. Clinic closures and doctor schedule exceptions must be respected.
 * 12. Cancelled / No-show appointments do not block availability.
 */
export function validateAppointmentBooking(
  input: SchedulingValidationInput,
  ctx: SchedulingContext
): SchedulingValidationResult {
  const errors: string[] = [];

  // 1. Patient must exist
  const patient = ctx.patients.find((p) => p.id === input.patientId);
  if (!patient) {
    errors.push('Selected patient does not exist.');
  } else if (patient.status === 'Archived') {
    errors.push('Cannot book an appointment for an archived patient.');
  }

  // 2. Doctor must exist and be active
  const doctor = ctx.doctors.find((d) => d.id === input.doctorId);
  if (!doctor) {
    errors.push('Selected doctor does not exist.');
  } else if (doctor.status !== 'Active') {
    errors.push(`Doctor ${doctor.fullName} is currently not active (${doctor.status}).`);
  }

  // 3. Service must exist and be active
  const service = ctx.services.find((s) => s.id === input.serviceId);
  if (!service) {
    errors.push('Selected clinic service does not exist.');
  } else if (!service.isActive) {
    errors.push(`Service "${service.name}" is inactive.`);
  }

  // 4. Doctor must provide the selected service
  if (doctor && service) {
    const doctorProvidesService =
      doctor.serviceIds.includes(service.id) ||
      service.doctorIds.includes(doctor.id);
    if (!doctorProvidesService) {
      errors.push(
        `${doctor.fullName} is not configured to provide "${service.name}".`
      );
    }
  }

  // 5. Date must be valid
  if (!isValidDateString(input.date)) {
    errors.push('Appointment date must be a valid YYYY-MM-DD date.');
  }

  // 6. Duration must be positive
  const duration =
    input.durationMinutes !== undefined
      ? input.durationMinutes
      : service?.durationMinutes ?? doctor?.defaultConsultationDuration ?? 30;

  if (!duration || duration <= 0) {
    errors.push('Appointment duration must be greater than zero minutes.');
  }

  const startMins = timeToMinutes(input.startTime);
  if (startMins < 0) {
    errors.push('Start time must be a valid HH:mm time.');
  }

  const endMins = startMins + (duration > 0 ? duration : 30);
  if (endMins > 24 * 60) {
    errors.push('Appointment cannot extend past midnight.');
  }

  const computedEndTime = minutesToTime(endMins);

  if (errors.length > 0) {
    return {
      valid: false,
      errors,
      computedEndTime,
      computedDuration: duration,
    };
  }

  // 11. Clinic closures and doctor schedule exceptions must be respected
  const exceptionsOnDate = ctx.scheduleExceptions.filter(
    (ex) =>
      ex.date === input.date &&
      (!ex.doctorId || ex.doctorId === input.doctorId)
  );

  for (const ex of exceptionsOnDate) {
    if (ex.isClosedAllDay) {
      errors.push(
        ex.doctorId
          ? `${doctor!.fullName} is unavailable on ${input.date}: ${ex.title}.`
          : `Clinic is closed on ${input.date}: ${ex.title}.`
      );
    } else if (ex.blockedStart && ex.blockedEnd) {
      const blockStart = timeToMinutes(ex.blockedStart);
      const blockEnd = timeToMinutes(ex.blockedEnd);
      if (intervalsOverlap(startMins, endMins, blockStart, blockEnd)) {
        errors.push(
          `Requested time conflicts with schedule exception "${ex.title}" (${ex.blockedStart}–${ex.blockedEnd}).`
        );
      }
    }
  }

  // 7 & 8. Appointment must fit within doctor's available working hours and not conflict with break
  const dayOfWeek = getDayOfWeekFromDateString(input.date);
  const doctorAvailability = ctx.availabilities.find(
    (a) => a.doctorId === input.doctorId
  );
  const daySchedule = doctorAvailability?.weeklySchedule.find(
    (d) => d.dayOfWeek === dayOfWeek
  );

  if (!daySchedule || !daySchedule.isWorking) {
    errors.push(
      `${doctor!.fullName} does not have working hours scheduled on this day of the week.`
    );
  } else {
    const workStart = timeToMinutes(daySchedule.startTime);
    const workEnd = timeToMinutes(daySchedule.endTime);

    if (startMins < workStart || endMins > workEnd) {
      errors.push(
        `Appointment (${input.startTime}–${computedEndTime}) falls outside ${doctor!.fullName}'s working hours (${daySchedule.startTime}–${daySchedule.endTime}).`
      );
    }

    if (daySchedule.breakStart && daySchedule.breakEnd) {
      const breakStart = timeToMinutes(daySchedule.breakStart);
      const breakEnd = timeToMinutes(daySchedule.breakEnd);
      if (intervalsOverlap(startMins, endMins, breakStart, breakEnd)) {
        errors.push(
          `Appointment conflicts with ${doctor!.fullName}'s scheduled break (${daySchedule.breakStart}–${daySchedule.breakEnd}).`
        );
      }
    }
  }

  // 9 & 12. Appointment must not overlap another active booking for that doctor (Cancelled/No-show do not block)
  const activeAppointmentsOnDate = ctx.appointments.filter(
    (apt) =>
      apt.date === input.date &&
      apt.id !== input.excludeAppointmentId &&
      isBlockingStatus(apt.status)
  );

  for (const existing of activeAppointmentsOnDate) {
    const exStart = timeToMinutes(existing.startTime);
    const exEnd = timeToMinutes(existing.endTime);

    if (
      existing.doctorId === input.doctorId &&
      intervalsOverlap(startMins, endMins, exStart, exEnd)
    ) {
      errors.push(
        `Time slot conflicts with an existing appointment for ${doctor!.fullName} (${existing.startTime}–${existing.endTime}).`
      );
    }
  }

  // 10. Required room must be available
  const effectiveRoomId = input.roomId || doctor?.assignedRoomId;
  if (service?.requiresRoom && !effectiveRoomId) {
    errors.push(`Service "${service.name}" requires an assigned clinic room.`);
  }

  if (effectiveRoomId) {
    const room = ctx.rooms.find((r) => r.id === effectiveRoomId);
    if (!room) {
      errors.push('Selected clinic room does not exist.');
    } else if (!room.isActive) {
      errors.push(`Room "${room.name}" is currently inactive.`);
    } else if (room.isExclusive) {
      for (const existing of activeAppointmentsOnDate) {
        if (existing.roomId === effectiveRoomId) {
          const exStart = timeToMinutes(existing.startTime);
          const exEnd = timeToMinutes(existing.endTime);
          if (intervalsOverlap(startMins, endMins, exStart, exEnd)) {
            errors.push(
              `Room "${room.name}" is already booked during ${existing.startTime}–${existing.endTime}.`
            );
          }
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    computedEndTime,
    computedDuration: duration,
  };
}

export interface AvailableTimeSlot {
  startTime: string;
  endTime: string;
  durationMinutes: number;
}

/**
 * Generates all valid bookable time slots for a given doctor, service, room, and date.
 */
export function getAvailableSlotsForDate(
  params: {
    doctorId: string;
    serviceId: string;
    date: string;
    roomId?: string;
    slotStepMinutes?: number;
    excludeAppointmentId?: string;
  },
  ctx: SchedulingContext
): AvailableTimeSlot[] {
  const doctor = ctx.doctors.find((d) => d.id === params.doctorId);
  const service = ctx.services.find((s) => s.id === params.serviceId);
  if (!doctor || !service || doctor.status !== 'Active' || !service.isActive) {
    return [];
  }

  const dayOfWeek = getDayOfWeekFromDateString(params.date);
  if (dayOfWeek < 0) return [];

  const availability = ctx.availabilities.find(
    (a) => a.doctorId === params.doctorId
  );
  const daySchedule = availability?.weeklySchedule.find(
    (d) => d.dayOfWeek === dayOfWeek
  );
  if (!daySchedule || !daySchedule.isWorking) {
    return [];
  }

  const workStart = timeToMinutes(daySchedule.startTime);
  const workEnd = timeToMinutes(daySchedule.endTime);
  const duration = service.durationMinutes || doctor.defaultConsultationDuration || 30;
  const step = params.slotStepMinutes || ctx.settings?.slotIntervalMinutes || 15;

  // Pick a dummy active patient or first active patient solely to check slot availability
  const placeholderPatientId =
    ctx.patients.find((p) => p.status !== 'Archived')?.id ?? '';
  if (!placeholderPatientId) return [];

  const slots: AvailableTimeSlot[] = [];

  for (
    let cursor = workStart;
    cursor + duration <= workEnd;
    cursor += step
  ) {
    const startTime = minutesToTime(cursor);
    const result = validateAppointmentBooking(
      {
        patientId: placeholderPatientId,
        doctorId: params.doctorId,
        serviceId: params.serviceId,
        roomId: params.roomId ?? doctor.assignedRoomId,
        date: params.date,
        startTime,
        durationMinutes: duration,
        excludeAppointmentId: params.excludeAppointmentId,
      },
      ctx
    );

    if (result.valid) {
      slots.push({
        startTime,
        endTime: result.computedEndTime,
        durationMinutes: duration,
      });
    }
  }

  return slots;
}
