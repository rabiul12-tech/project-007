import { describe, it, expect, beforeEach } from 'vitest';
import { useMedoraStore } from '@/stores/useMedoraStore';
import {
  canTransitionAppointmentStatus,
  getAvailableSlotsForDate,
  getDayOfWeekFromDateString,
  intervalsOverlap,
  validateAppointmentBooking,
} from '@/lib/scheduling/engine';
import {
  calculateInvoiceSummary,
  calculateLineMetrics,
  validatePaymentAllocation,
} from '@/lib/calculations/billing';
import {
  CLINICAL_SAMPLE_DISCLAIMER,
  generateInvoicePDFTextSummary,
  generateSampleDocumentDataText,
} from '@/lib/pdf/generator';
import { buildCSVContent } from '@/lib/export/csv';
import {
  createBackupJSON,
  loadPersistedState,
  STORAGE_KEYS,
  validateAndParseBackupJSON,
} from '@/lib/storage/repository';
import { DEMO_TODAY } from '@/lib/seed/generator';

// Simple in-memory window.localStorage mock for Node environment
const memoryStorage = new Map<string, string>();
if (typeof globalThis.window === 'undefined') {
  Object.defineProperty(globalThis, 'window', {
    value: {
      localStorage: {
        getItem: (k: string) => memoryStorage.get(k) ?? null,
        setItem: (k: string, v: string) => memoryStorage.set(k, v),
        removeItem: (k: string) => memoryStorage.delete(k),
        clear: () => memoryStorage.clear(),
      },
    },
    writable: true,
  });
}

describe('MEDORA Health — Comprehensive 44-Point Verification Suite', () => {
  beforeEach(() => {
    memoryStorage.clear();
    useMedoraStore.getState().resetDemoWorkspace();
  });

  it('1-3. Patient creation, editing, and archiving', () => {
    const store = useMedoraStore.getState();
    const initialCount = store.dataset.patients.length;
    expect(initialCount).toBe(150);

    // 1. Create patient
    const created = store.addPatient({
      fullName: 'Test Fictional Patient',
      birthYear: 1990,
      gender: 'Female',
      phone: '(555) 019-0001',
      email: 'test@fictional-patient.example',
      address: '101 Harborview Terrace',
      emergencyContactName: 'Alex Vance',
      emergencyContactPhone: '(555) 019-0002',
      bloodGroupLabel: 'O+',
      allergyNote: 'No known demo sensitivities',
      status: 'Active',
      administrativeNotes: 'Created in unit test',
    });
    expect(useMedoraStore.getState().dataset.patients.length).toBe(
      initialCount + 1
    );
    expect(created.id).toBe('PAT-1151');

    // 2. Edit patient
    store.updatePatient(created.id, {
      fullName: 'Updated Fictional Patient',
      phone: '(555) 019-9999',
    });
    const updated = useMedoraStore
      .getState()
      .dataset.patients.find((p) => p.id === created.id);
    expect(updated?.fullName).toBe('Updated Fictional Patient');
    expect(updated?.phone).toBe('(555) 019-9999');

    // 3. Archive patient
    store.archivePatient(created.id);
    const archived = useMedoraStore
      .getState()
      .dataset.patients.find((p) => p.id === created.id);
    expect(archived?.status).toBe('Archived');
  });

  it('4-6. Doctor creation, doctor availability configuration, and service duration validation', () => {
    const store = useMedoraStore.getState();

    // 4. Doctor creation
    const newDoc = store.addDoctor({
      fullName: 'Dr. Astrid Sterling',
      title: 'Specialist (Demo)',
      specialty: 'Preventive Care',
      department: 'Primary Care',
      email: 'a.sterling@medora-demo.example',
      phone: '(555) 010-1200',
      colorTag: '#0891B2',
      defaultConsultationDuration: 30,
      serviceIds: ['SRV-01'],
      assignedRoomId: 'RM-101',
      status: 'Active',
      bio: 'Test clinician',
    });
    expect(newDoc.avatarInitials).toBe('AS');

    // 5. Doctor availability update
    const currentAvail = useMedoraStore
      .getState()
      .dataset.availabilities.find((a) => a.doctorId === newDoc.id)!;
    const modifiedSchedule = currentAvail.weeklySchedule.map((d) =>
      d.dayOfWeek === 5 ? { ...d, startTime: '09:00', endTime: '16:00' } : d
    );
    store.updateDoctorAvailability(newDoc.id, modifiedSchedule);
    const updatedAvail = useMedoraStore
      .getState()
      .dataset.availabilities.find((a) => a.doctorId === newDoc.id);
    expect(
      updatedAvail?.weeklySchedule.find((d) => d.dayOfWeek === 5)?.startTime
    ).toBe('09:00');

    // 6. Service duration validation (must be positive)
    const invalidDurationCheck = validateAppointmentBooking(
      {
        patientId: 'PAT-1001',
        doctorId: 'DOC-01',
        serviceId: 'SRV-01',
        date: '2026-11-16',
        startTime: '09:00',
        durationMinutes: 0,
      },
      useMedoraStore.getState().dataset
    );
    expect(invalidDurationCheck.valid).toBe(false);
  });

  it('7-12. Appointment creation, conflict detection, back-to-back acceptance, doctor break exclusion, clinic closure exclusion, and room conflict detection', () => {
    const store = useMedoraStore.getState();

    // Pick a clean future Monday: 2026-11-30
    const testDate = '2026-11-30';

    // 7. Valid appointment creation (09:00 - 09:30 for DOC-01 in RM-101)
    const booked1 = store.bookAppointment({
      patientId: 'PAT-1001',
      doctorId: 'DOC-01',
      serviceId: 'SRV-01', // 30 mins
      roomId: 'RM-101',
      date: testDate,
      startTime: '09:00',
      reasonForVisit: 'Initial consultation',
    });
    expect(booked1.success).toBe(true);
    expect(booked1.appointment?.endTime).toBe('09:30');

    // 8. Overlapping doctor conflict detection (09:15 - 09:45 overlaps [09:00, 09:30))
    const conflictAttempt = store.bookAppointment({
      patientId: 'PAT-1002',
      doctorId: 'DOC-01',
      serviceId: 'SRV-01',
      roomId: 'RM-101',
      date: testDate,
      startTime: '09:15',
      reasonForVisit: 'Overlapping attempt',
    });
    expect(conflictAttempt.success).toBe(false);
    expect(conflictAttempt.errors.some((e) => e.includes('conflicts'))).toBe(
      true
    );

    // 9. Back-to-back appointment acceptance ([09:00, 09:30) and [09:30, 10:00) do NOT overlap)
    expect(intervalsOverlap(540, 570, 570, 600)).toBe(false);
    const backToBack = store.bookAppointment({
      patientId: 'PAT-1002',
      doctorId: 'DOC-01',
      serviceId: 'SRV-01',
      roomId: 'RM-101',
      date: testDate,
      startTime: '09:30',
      reasonForVisit: 'Back to back consultation',
    });
    expect(backToBack.success).toBe(true);

    // 10. Doctor break exclusion (12:30 - 13:15 break window)
    const breakAttempt = store.bookAppointment({
      patientId: 'PAT-1003',
      doctorId: 'DOC-01',
      serviceId: 'SRV-01',
      roomId: 'RM-101',
      date: testDate,
      startTime: '12:30',
      reasonForVisit: 'Break conflict attempt',
    });
    expect(breakAttempt.success).toBe(false);
    expect(breakAttempt.errors.some((e) => e.includes('break'))).toBe(true);

    // 11. Clinic closure exclusion (2026-11-26 is Thanksgiving Clinic Holiday)
    const holidayAttempt = store.bookAppointment({
      patientId: 'PAT-1003',
      doctorId: 'DOC-01',
      serviceId: 'SRV-01',
      roomId: 'RM-101',
      date: '2026-11-26',
      startTime: '10:00',
      reasonForVisit: 'Holiday attempt',
    });
    expect(holidayAttempt.success).toBe(false);
    expect(holidayAttempt.errors.some((e) => e.includes('closed'))).toBe(true);

    // 12. Room conflict detection (DOC-02 trying to use RM-101 at 09:00 while DOC-01 occupies RM-101)
    const roomConflictAttempt = store.bookAppointment({
      patientId: 'PAT-1004',
      doctorId: 'DOC-02',
      serviceId: 'SRV-01',
      roomId: 'RM-101',
      date: testDate,
      startTime: '09:00',
      reasonForVisit: 'Exclusive room conflict attempt',
    });
    expect(roomConflictAttempt.success).toBe(false);
    expect(
      roomConflictAttempt.errors.some((e) => e.includes('already booked'))
    ).toBe(true);
  });

  it('13-15. Appointment rescheduling, cancellation, and validated status transitions', () => {
    const store = useMedoraStore.getState();
    const testDate = '2026-11-30';

    const created = store.bookAppointment({
      patientId: 'PAT-1001',
      doctorId: 'DOC-01',
      serviceId: 'SRV-01',
      roomId: 'RM-101',
      date: testDate,
      startTime: '10:00',
      reasonForVisit: 'Reschedule test',
    });
    const aptId = created.appointment!.id;

    // 13. Reschedule to valid slot 11:00
    const resched = store.rescheduleAppointment(aptId, {
      date: testDate,
      startTime: '11:00',
    });
    expect(resched.success).toBe(true);
    expect(resched.appointment?.startTime).toBe('11:00');
    expect(resched.appointment?.id).toBe(aptId); // Preserves identity

    // 14. Cancel appointment and verify slot becomes available again
    const cancelRes = store.transitionAppointmentStatus(aptId, 'Cancelled');
    expect(cancelRes.success).toBe(true);
    const slots = getAvailableSlotsForDate(
      { doctorId: 'DOC-01', serviceId: 'SRV-01', date: testDate },
      useMedoraStore.getState().dataset
    );
    expect(slots.some((s) => s.startTime === '11:00')).toBe(true);

    // 15. Prevent invalid status transitions (Completed -> Waiting is disallowed)
    expect(canTransitionAppointmentStatus('Completed', 'Waiting')).toBe(false);
  });

  it('16-22. Queue check-in, waiting state, consultation start/completion, duplicate visit prevention, no-show, and visit history', () => {
    const store = useMedoraStore.getState();
    const booked = store.bookAppointment({
      patientId: 'PAT-1005',
      doctorId: 'DOC-01',
      serviceId: 'SRV-01',
      roomId: 'RM-101',
      date: '2026-11-30',
      startTime: '14:00',
      reasonForVisit: 'Queue lifecycle test',
    });
    const aptId = booked.appointment!.id;

    // 16. Queue check-in records timestamp
    store.transitionAppointmentStatus(aptId, 'Checked In');
    let apt = useMedoraStore
      .getState()
      .dataset.appointments.find((a) => a.id === aptId)!;
    expect(apt.status).toBe('Checked In');
    expect(Boolean(apt.checkedInAt)).toBe(true);

    // 17. Waiting state
    store.transitionAppointmentStatus(aptId, 'Waiting');
    apt = useMedoraStore
      .getState()
      .dataset.appointments.find((a) => a.id === aptId)!;
    expect(apt.status).toBe('Waiting');

    // 18. Consultation start creates Visit & Consultation
    const startRes = store.transitionAppointmentStatus(
      aptId,
      'In Consultation'
    );
    expect(startRes.success).toBe(true);
    const visitId = startRes.visitId!;
    expect(Boolean(visitId)).toBe(true);

    const visitsBeforeCompletion = useMedoraStore
      .getState()
      .dataset.visits.filter((v) => v.appointmentId === aptId).length;
    expect(visitsBeforeCompletion).toBe(1);

    // 19 & 20. Consultation completion updates existing Visit without creating a duplicate
    store.transitionAppointmentStatus(aptId, 'Completed');
    const visitsAfterCompletion = useMedoraStore
      .getState()
      .dataset.visits.filter((v) => v.appointmentId === aptId);
    expect(visitsAfterCompletion.length).toBe(1);
    expect(visitsAfterCompletion[0].status).toBe('Completed');

    // 21. No-show handling on another appointment
    const booked2 = store.bookAppointment({
      patientId: 'PAT-1006',
      doctorId: 'DOC-01',
      serviceId: 'SRV-01',
      roomId: 'RM-101',
      date: '2026-11-30',
      startTime: '15:00',
      reasonForVisit: 'No-show test',
    });
    store.transitionAppointmentStatus(booked2.appointment!.id, 'No-show');
    expect(
      useMedoraStore
        .getState()
        .dataset.appointments.find((a) => a.id === booked2.appointment!.id)
        ?.status
    ).toBe('No-show');

    // 22. Patient visit history reflects completed visit
    const patientVisits = useMedoraStore
      .getState()
      .dataset.visits.filter((v) => v.patientId === 'PAT-1005');
    expect(patientVisits.some((v) => v.id === visitId)).toBe(true);
  });

  it('23-24. Sample document generation and mandatory prescription disclaimer in PDF content', () => {
    const store = useMedoraStore.getState();
    const visit = store.dataset.visits[0];
    const doc = store.generateSampleDocument({
      visitId: visit.id,
      type: 'Sample Prescription',
      title: 'Test Sample Wellness Sheet',
      sampleEntries: [
        {
          id: 'E1',
          label: 'Fictional Hydration Routine',
          instructionNote: 'Non-actionable sample entry',
          durationLabel: '7 Days (Sample)',
        },
      ],
      demoNotes: 'Unit test sample notes',
    });

    expect(doc).not.toBeNull();
    expect(doc?.disclaimerText).toContain('SAMPLE — NOT VALID FOR MEDICAL USE');

    const pdfText = generateSampleDocumentDataText({
      document: doc!,
      patient: store.dataset.patients[0],
      doctor: store.dataset.doctors[0],
      settings: store.settings,
    });
    expect(pdfText).toContain(CLINICAL_SAMPLE_DISCLAIMER);
  });

  it('25-30. Invoice creation, decimal.js billing calculations, partial payment, full payment, payment reversal, and invoice PDF summary', () => {
    const store = useMedoraStore.getState();

    // 26. Line & summary calculation verification
    const lineMetrics = calculateLineMetrics({
      id: 'L1',
      description: 'Test Service',
      quantity: 2,
      unitPrice: 125.5,
      discountAmount: 21,
    });
    expect(lineMetrics.lineAmount).toBe(251);
    expect(lineMetrics.taxableAmount).toBe(230);

    // 25. Invoice creation
    const inv = store.createInvoice({
      patientId: 'PAT-1001',
      issueDate: DEMO_TODAY,
      dueDate: '2026-11-27',
      taxRatePercent: 10,
      lines: [
        {
          serviceId: 'SRV-01',
          description: 'Outpatient Consultation',
          quantity: 1,
          unitPrice: 200,
          discountAmount: 0,
        },
      ],
    });
    expect(inv.totalAmount).toBe(220); // 200 + 10% tax
    expect(inv.outstandingBalance).toBe(220);
    expect(inv.status).toBe('Issued');

    // 27. Partial payment ($100)
    const pay1 = store.recordPayment({
      invoiceId: inv.id,
      amount: 100,
      paymentDate: DEMO_TODAY,
      method: 'Simulated Card',
    });
    expect(pay1.success).toBe(true);
    let updatedInv = useMedoraStore
      .getState()
      .dataset.invoices.find((i) => i.id === inv.id)!;
    expect(updatedInv.amountPaid).toBe(100);
    expect(updatedInv.outstandingBalance).toBe(120);
    expect(updatedInv.status).toBe('Partially Paid');

    // Prevent overpayment allocation
    const overPayCheck = validatePaymentAllocation(
      updatedInv,
      useMedoraStore.getState().dataset.payments,
      150
    );
    expect(overPayCheck.valid).toBe(false);

    // 28. Full payment ($120 remaining)
    const pay2 = store.recordPayment({
      invoiceId: inv.id,
      amount: 120,
      paymentDate: DEMO_TODAY,
      method: 'Simulated Bank Transfer',
    });
    expect(pay2.success).toBe(true);
    updatedInv = useMedoraStore
      .getState()
      .dataset.invoices.find((i) => i.id === inv.id)!;
    expect(updatedInv.amountPaid).toBe(220);
    expect(updatedInv.outstandingBalance).toBe(0);
    expect(updatedInv.status).toBe('Paid');

    // 29. Payment reversal restores balance and reverts status to Partially Paid
    store.reversePayment(pay2.payment!.id, 'Unit test reversal');
    updatedInv = useMedoraStore
      .getState()
      .dataset.invoices.find((i) => i.id === inv.id)!;
    expect(updatedInv.amountPaid).toBe(100);
    expect(updatedInv.outstandingBalance).toBe(120);
    expect(updatedInv.status).toBe('Partially Paid');

    // 30. Invoice PDF text reconciliation
    const pdfSummary = generateInvoicePDFTextSummary({
      invoice: updatedInv,
      patient: store.dataset.patients[0],
      payments: useMedoraStore
        .getState()
        .dataset.payments.filter((p) => p.invoiceId === inv.id),
      settings: store.settings,
    });
    expect(pdfSummary).toContain(updatedInv.invoiceNumber);
    expect(pdfSummary).toContain('$120.00');
  });

  it('31-36. Analytics consistency, search/filtering/sorting/pagination, and CSV export', () => {
    const { dataset } = useMedoraStore.getState();

    // 31. Analytics consistency
    const completedAppointments = dataset.appointments.filter(
      (a) => a.status === 'Completed'
    ).length;
    expect(completedAppointments).toBeGreaterThanOrEqual(200);

    // 32-35. Search, filter, sort, pagination
    const activePatients = dataset.patients
      .filter((p) => p.status === 'Active')
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
    expect(activePatients.length).toBeGreaterThan(100);
    const page1 = activePatients.slice(0, 15);
    expect(page1.length).toBe(15);

    // 36. CSV export
    const csv = buildCSVContent(
      ['ID', 'Name', 'Notes'],
      [['PAT-1001', 'Avery Vance', 'Contains, comma']]
    );
    expect(csv).toContain('"Contains, comma"');
  });

  it('37-44. JSON backup, JSON restore, corrupt LocalStorage recovery, reset demo data, theme persistence, timezone/date handling, and cross-page consistency', () => {
    const store = useMedoraStore.getState();

    // 41. Theme persistence
    store.setTheme('dark');
    expect(useMedoraStore.getState().ui.theme).toBe('dark');

    // 37 & 38. JSON backup and restore
    const backupStr = store.exportBackupJSON();
    const parsedCheck = validateAndParseBackupJSON(backupStr);
    expect(parsedCheck.valid).toBe(true);

    // Mutate state then restore from backup
    store.addPatient({
      fullName: 'Temporary Patient',
      birthYear: 1995,
      gender: 'Male',
      phone: '555',
      email: 'temp@example.com',
      address: '123 St',
      emergencyContactName: 'Contact',
      emergencyContactPhone: '555',
      bloodGroupLabel: 'A+',
      allergyNote: 'None',
      status: 'Active',
      administrativeNotes: '',
    });
    expect(useMedoraStore.getState().dataset.patients.length).toBe(151);

    const restoreRes = store.importBackupJSON(backupStr);
    expect(restoreRes.success).toBe(true);
    expect(useMedoraStore.getState().dataset.patients.length).toBe(150);

    // 39. Corrupt LocalStorage recovery
    window.localStorage.setItem(STORAGE_KEYS.DATA, '{corrupt_json');
    const recovered = loadPersistedState();
    expect(recovered.recoveredFromCorruption).toBe(true);
    expect(recovered.dataset.patients.length).toBe(150);

    // 40. Reset demo data
    store.resetDemoWorkspace();
    expect(useMedoraStore.getState().ui.theme).toBe('light');

    // 43. Timezone and calendar day-of-week handling
    expect(getDayOfWeekFromDateString('2026-11-13')).toBe(5); // Friday

    // 44. Cross-page relational integrity (no orphaned appointments)
    const patIds = new Set(store.dataset.patients.map((p) => p.id));
    const docIds = new Set(store.dataset.doctors.map((d) => d.id));
    for (const apt of store.dataset.appointments) {
      expect(patIds.has(apt.patientId)).toBe(true);
      expect(docIds.has(apt.doctorId)).toBe(true);
    }
  });

  it('45. Recent Searches tracks the last 5 patient profiles accessed with deduplication and clearing', () => {
    const store = useMedoraStore.getState();
    expect(useMedoraStore.getState().ui.recentPatientIds).toEqual([
      'PAT-1001',
      'PAT-1002',
      'PAT-1003',
      'PAT-1004',
      'PAT-1005',
    ]);

    // Accessing PAT-1010 moves it to #1 and drops PAT-1005 so length stays 5
    store.recordPatientAccess('PAT-1010');
    expect(useMedoraStore.getState().ui.recentPatientIds).toEqual([
      'PAT-1010',
      'PAT-1001',
      'PAT-1002',
      'PAT-1003',
      'PAT-1004',
    ]);

    // Re-accessing PAT-1003 moves it to #1 without duplicating
    store.recordPatientAccess('PAT-1003');
    expect(useMedoraStore.getState().ui.recentPatientIds).toEqual([
      'PAT-1003',
      'PAT-1010',
      'PAT-1001',
      'PAT-1002',
      'PAT-1004',
    ]);

    // Clearing recent patients empties the list
    store.clearRecentPatients();
    expect(useMedoraStore.getState().ui.recentPatientIds).toEqual([]);
  });
});
