export type AppointmentStatus =
  | 'Scheduled'
  | 'Confirmed'
  | 'Checked In'
  | 'Waiting'
  | 'In Consultation'
  | 'Completed'
  | 'No-show'
  | 'Cancelled';

export type PatientStatus = 'Active' | 'Follow-up Due' | 'Archived';

export type DoctorStatus = 'Active' | 'On Leave' | 'Archived';

export type RoomType =
  | 'Consultation'
  | 'Procedure'
  | 'Diagnostic'
  | 'Telehealth Booth'
  | 'Triage';

export type StaffRole =
  | 'Clinic Administrator'
  | 'Receptionist'
  | 'Doctor'
  | 'Billing Staff'
  | 'Nurse Coordinator'
  | 'Operations Manager';

export type DemoRole =
  | 'Clinic Administrator'
  | 'Receptionist'
  | 'Doctor'
  | 'Billing Staff';

export type InvoiceStatus =
  | 'Draft'
  | 'Issued'
  | 'Partially Paid'
  | 'Paid'
  | 'Voided';

export type PaymentMethod =
  | 'Simulated Card'
  | 'Simulated Bank Transfer'
  | 'Simulated Clinic Account'
  | 'Simulated Cash Receipt';

export type DocumentType = 'Sample Prescription' | 'Visit Summary';

export type ActivityEventType =
  | 'patient_registered'
  | 'patient_updated'
  | 'appointment_booked'
  | 'appointment_rescheduled'
  | 'appointment_status_changed'
  | 'patient_checked_in'
  | 'consultation_started'
  | 'consultation_completed'
  | 'document_generated'
  | 'invoice_created'
  | 'invoice_voided'
  | 'payment_recorded'
  | 'payment_reversed'
  | 'schedule_updated'
  | 'settings_updated';

export interface Patient {
  id: string;
  fullName: string;
  birthYear: number;
  gender: 'Female' | 'Male' | 'Non-binary' | 'Prefer not to say';
  phone: string;
  email: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  bloodGroupLabel: string;
  allergyNote: string; // Fictional, non-clinical administrative note
  preferredDoctorId?: string;
  registrationDate: string; // YYYY-MM-DD
  lastVisitDate?: string; // YYYY-MM-DD
  status: PatientStatus;
  administrativeNotes: string;
}

export interface DaySchedule {
  dayOfWeek: number; // 0 = Sunday ... 6 = Saturday
  isWorking: boolean;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  breakStart?: string; // HH:mm
  breakEnd?: string; // HH:mm
}

export interface DoctorAvailability {
  doctorId: string;
  weeklySchedule: DaySchedule[];
}

export interface ScheduleException {
  id: string;
  date: string; // YYYY-MM-DD
  doctorId?: string; // undefined = entire clinic holiday/closure
  title: string;
  isClosedAllDay: boolean;
  blockedStart?: string; // HH:mm
  blockedEnd?: string; // HH:mm
}

export interface Doctor {
  id: string;
  fullName: string;
  title: string;
  specialty: string;
  department: string;
  email: string;
  phone: string;
  avatarInitials: string;
  colorTag: string;
  defaultConsultationDuration: number; // minutes
  serviceIds: string[];
  assignedRoomId?: string;
  status: DoctorStatus;
  bio: string;
}

export interface ClinicService {
  id: string;
  code: string;
  name: string;
  category:
    | 'General Consultation'
    | 'Specialist Review'
    | 'Preventive Screening'
    | 'Follow-up Care'
    | 'Diagnostic Assessment'
    | 'Wellness Counseling';
  durationMinutes: number;
  price: number;
  requiresRoom: boolean;
  description: string;
  doctorIds: string[];
  isActive: boolean;
}

export interface ClinicRoom {
  id: string;
  code: string;
  name: string;
  type: RoomType;
  floor: string;
  equipmentSummary: string;
  isExclusive: boolean;
  isActive: boolean;
}

export interface ClinicStaff {
  id: string;
  fullName: string;
  role: StaffRole;
  department: string;
  email: string;
  phone: string;
  assignedArea: string;
  shiftSchedule: string;
  status: 'Active' | 'Off Duty' | 'Archived';
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  serviceId: string;
  roomId?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  durationMinutes: number;
  status: AppointmentStatus;
  reasonForVisit: string;
  administrativeNotes?: string;
  checkedInAt?: string; // ISO string
  waitingSince?: string; // ISO string
  consultationStartedAt?: string; // ISO string
  consultationCompletedAt?: string; // ISO string
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface Visit {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  serviceId: string;
  roomId?: string;
  visitDate: string; // YYYY-MM-DD
  status: 'In Progress' | 'Completed';
  summaryTitle: string;
  createdAt: string;
}

export interface Consultation {
  id: string;
  visitId: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  visitDate: string; // YYYY-MM-DD
  status: 'Scheduled' | 'Active' | 'Completed';
  reasonForVisit: string;
  demoObservations: string;
  clinicianFreeTextNotes: string;
  sampleAssessmentText: string;
  administrativeFollowUp: string;
  updatedAt: string;
}

export interface DemoPrescriptionItem {
  id: string;
  label: string;
  instructionNote: string;
  durationLabel: string;
}

export interface DemoDocument {
  id: string;
  referenceNumber: string;
  visitId: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  visitDate: string; // YYYY-MM-DD
  type: DocumentType;
  title: string;
  sampleEntries: DemoPrescriptionItem[];
  demoNotes: string;
  disclaimerText: string;
  createdAt: string;
}

export interface InvoiceLine {
  id: string;
  serviceId?: string;
  description: string;
  quantity: number;
  unitPrice: number; // Snapshot price preserved at creation
  discountAmount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  appointmentId?: string;
  visitId?: string;
  issueDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  lines: InvoiceLine[];
  taxRatePercent: number;
  subtotal: number;
  discountTotal: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  outstandingBalance: number;
  status: InvoiceStatus;
  notes?: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  paymentReference: string;
  invoiceId: string;
  patientId: string;
  amount: number;
  paymentDate: string; // YYYY-MM-DD
  method: PaymentMethod;
  notes?: string;
  isReversed: boolean;
  reversedAt?: string;
  reversalReason?: string;
  createdAt: string;
}

export interface Activity {
  id: string;
  type: ActivityEventType;
  title: string;
  description: string;
  actorName: string;
  actorRole: DemoRole;
  relatedPatientId?: string;
  relatedAppointmentId?: string;
  relatedDoctorId?: string;
  relatedInvoiceId?: string;
  timestamp: string; // ISO string
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  category: 'Queue' | 'Appointment' | 'Billing' | 'System';
  isRead: boolean;
  linkUrl?: string;
  createdAt: string;
}

export interface SavedReportConfig {
  id: string;
  name: string;
  reportType:
    | 'appointments'
    | 'doctor_schedule'
    | 'operations'
    | 'service_usage'
    | 'no_show'
    | 'billing_summary'
    | 'payment_report'
    | 'patient_registration';
  dateFrom: string;
  dateTo: string;
  doctorId?: string;
  serviceId?: string;
  status?: string;
}

export interface WorkspaceSettings {
  clinicName: string;
  tagline: string;
  workspaceBranch: string;
  address: string;
  phone: string;
  email: string;
  operatingHoursStart: string; // HH:mm
  operatingHoursEnd: string; // HH:mm
  weekStart: 'Monday' | 'Sunday';
  timezone: string;
  slotIntervalMinutes: 15 | 20 | 30;
  defaultServiceDurationMinutes: number;
  cancellationNoticeHours: number;
  currency: string;
  defaultTaxRatePercent: number;
  invoicePrefix: string;
  paymentTermsDays: number;
  enableQueueAlerts: boolean;
  enableBillingNotifications: boolean;
}

export interface MedoraUIState {
  theme: 'light' | 'dark';
  sidebarCollapsed: boolean;
  activeRole: DemoRole;
  selectedDate: string; // YYYY-MM-DD (Defaults to reference demo operational date)
  activeWorkspace: string;
  recentPatientIds?: string[];
}

export interface MedoraDataset {
  version: number;
  patients: Patient[];
  doctors: Doctor[];
  availabilities: DoctorAvailability[];
  scheduleExceptions: ScheduleException[];
  services: ClinicService[];
  rooms: ClinicRoom[];
  staff: ClinicStaff[];
  appointments: Appointment[];
  visits: Visit[];
  consultations: Consultation[];
  documents: DemoDocument[];
  invoices: Invoice[];
  payments: Payment[];
  activities: Activity[];
  notifications: AppNotification[];
  savedReports: SavedReportConfig[];
}
