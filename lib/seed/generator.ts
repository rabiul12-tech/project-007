import {
  Activity,
  Appointment,
  AppointmentStatus,
  AppNotification,
  ClinicRoom,
  ClinicService,
  ClinicStaff,
  Consultation,
  DaySchedule,
  DemoDocument,
  Doctor,
  DoctorAvailability,
  Invoice,
  MedoraDataset,
  MedoraUIState,
  Patient,
  Payment,
  SavedReportConfig,
  ScheduleException,
  Visit,
  WorkspaceSettings,
} from '@/types/medora';
import { calculateEndTime } from '@/lib/scheduling/engine';
import { calculateInvoiceSummary } from '@/lib/calculations/billing';

export const DEMO_TODAY = '2026-11-13'; // Friday

const FIRST_NAMES = [
  'Avery', 'Elena', 'Marcus', 'Clara', 'Julian', 'Nora', 'Liam', 'Maya',
  'Gideon', 'Tessa', 'Owen', 'Hannah', 'Caleb', 'Sylvia', 'Rowan', 'Iris',
  'Mateo', 'Freya', 'Declan', 'Camila', 'Ezra', 'Naomi', 'Soren', 'Lydia',
  'Arthur', 'Vera', 'Milo', 'Eliza', 'Felix', 'Audrey',
];

const LAST_NAMES = [
  'Vance', 'Mercer', 'Callahan', 'Kensington', 'Whitaker', 'Aldridge', 'Sterling',
  'Linden', 'Thorne', 'Hawthorne', 'Pemberton', 'Sutherland', 'Ashford', 'Winslow',
  'Hollis', 'Fairchild', 'Bellingham', 'Langley', 'Montague', 'Prescott',
];

const STREETS = [
  'Harborview Terrace', 'Cedar Ridge Pkwy', 'Bayside Commons', 'Waverly Way',
  'Juniper Court', 'Alderwood Ave', 'Sycamore Walk', 'Beacon Hill Rd',
  'Maplewood Promenade', 'Pacific Crest Blvd',
];

const ALLERGY_NOTES = [
  'No known demo sensitivities recorded',
  'Fictional note: Prefers fragrance-free waiting area',
  'Fictional note: Sensitive to adhesive tape in demo chart',
  'Fictional note: Seasonal pollen sensitivity (demo entry)',
  'No administrative alerts on file',
];

const SAMPLE_REASONS = [
  'Annual wellness check & preventive lifestyle check-in',
  'Routine follow-up consultation for seasonal wellness',
  'Ergonomic posture & joint mobility evaluation',
  'Preventive cardiovascular baseline screening',
  'Sleep hygiene & stress resilience consultation',
  'Nutritional wellness & hydration counseling',
  'Dermatology preventive skin check (demo)',
  'Pre-travel preventive health briefing',
];

const SAMPLE_OBSERVATIONS = [
  'Demo entry: Patient arrived comfortably on time; routine intake questionnaire completed at reception.',
  'Demo entry: General wellness parameters reviewed in simulated outpatient room; calm demeanor noted.',
  'Demo entry: Mobility and ergonomic range reviewed during simulated demonstration session.',
  'Demo entry: Preventive screening checklist completed with no administrative flags.',
];

const SAMPLE_ASSESSMENTS = [
  'Simulated Assessment (Non-Clinical): Routine outpatient wellness visit completed according to schedule.',
  'Simulated Assessment (Non-Clinical): Preventive check-in documented; educational wellness handout provided.',
  'Simulated Assessment (Non-Clinical): Follow-up demonstration milestone recorded for administrative continuity.',
];

const SAMPLE_FOLLOWUPS = [
  'Schedule routine 6-month administrative follow-up at reception.',
  'Provide printed sample visit summary and educational lifestyle brochure.',
  'Book optional follow-up wellness check in 4 weeks if desired.',
];

export function createDefaultSettings(): WorkspaceSettings {
  return {
    clinicName: 'MEDORA Health Outpatient Center',
    tagline: 'Better Care. Better Operations.',
    workspaceBranch: 'Bayview Pavilion — Suite 400 (Demo)',
    address: '400 Harborview Terrace, Suite 400, Bayview, CA 94107',
    phone: '(555) 019-2840',
    email: 'operations@medora-demo.example',
    operatingHoursStart: '08:00',
    operatingHoursEnd: '18:00',
    weekStart: 'Monday',
    timezone: 'America/Los_Angeles',
    slotIntervalMinutes: 15,
    defaultServiceDurationMinutes: 30,
    cancellationNoticeHours: 24,
    currency: 'USD',
    defaultTaxRatePercent: 0,
    invoicePrefix: 'INV-2026-',
    paymentTermsDays: 14,
    enableQueueAlerts: true,
    enableBillingNotifications: true,
  };
}

export function createDefaultUIState(): MedoraUIState {
  return {
    theme: 'light',
    sidebarCollapsed: false,
    activeRole: 'Clinic Administrator',
    selectedDate: DEMO_TODAY,
    activeWorkspace: 'Bayview Pavilion — Suite 400',
    recentPatientIds: ['PAT-1001', 'PAT-1002', 'PAT-1003', 'PAT-1004', 'PAT-1005'],
  };
}

function createStandardWeeklySchedule(
  startHour = '08:30',
  endHour = '17:30',
  workSaturday = false
): DaySchedule[] {
  return [
    { dayOfWeek: 0, isWorking: false, startTime: '09:00', endTime: '13:00' },
    {
      dayOfWeek: 1,
      isWorking: true,
      startTime: startHour,
      endTime: endHour,
      breakStart: '12:30',
      breakEnd: '13:15',
    },
    {
      dayOfWeek: 2,
      isWorking: true,
      startTime: startHour,
      endTime: endHour,
      breakStart: '12:30',
      breakEnd: '13:15',
    },
    {
      dayOfWeek: 3,
      isWorking: true,
      startTime: startHour,
      endTime: endHour,
      breakStart: '12:30',
      breakEnd: '13:15',
    },
    {
      dayOfWeek: 4,
      isWorking: true,
      startTime: startHour,
      endTime: endHour,
      breakStart: '12:30',
      breakEnd: '13:15',
    },
    {
      dayOfWeek: 5,
      isWorking: true,
      startTime: startHour,
      endTime: endHour,
      breakStart: '12:30',
      breakEnd: '13:15',
    },
    {
      dayOfWeek: 6,
      isWorking: workSaturday,
      startTime: '09:00',
      endTime: '14:00',
    },
  ];
}

function addDaysToDateStr(baseDate: string, offsetDays: number): string {
  const [y, m, d] = baseDate.split('-').map(Number);
  const dt = new Date(y, m - 1, d + offsetDays, 12, 0, 0);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

export function generateSeedDataset(): MedoraDataset {
  // 1. 8 Rooms
  const rooms: ClinicRoom[] = [
    {
      id: 'RM-101',
      code: 'C-101',
      name: 'Consultation Suite 101',
      type: 'Consultation',
      floor: 'Floor 1 — West Wing',
      equipmentSummary: 'Standard examination table, digital vitals station, dual display',
      isExclusive: true,
      isActive: true,
    },
    {
      id: 'RM-102',
      code: 'C-102',
      name: 'Consultation Suite 102',
      type: 'Consultation',
      floor: 'Floor 1 — West Wing',
      equipmentSummary: 'Standard examination table, acoustic privacy insulation',
      isExclusive: true,
      isActive: true,
    },
    {
      id: 'RM-103',
      code: 'C-103',
      name: 'Consultation Suite 103',
      type: 'Consultation',
      floor: 'Floor 1 — East Wing',
      equipmentSummary: 'Ergonomic assessment space, family seating',
      isExclusive: true,
      isActive: true,
    },
    {
      id: 'RM-104',
      code: 'C-104',
      name: 'Consultation Suite 104',
      type: 'Consultation',
      floor: 'Floor 1 — East Wing',
      equipmentSummary: 'Preventive care station, patient education monitor',
      isExclusive: true,
      isActive: true,
    },
    {
      id: 'RM-201',
      code: 'D-201',
      name: 'Diagnostic Assessment Room 201',
      type: 'Diagnostic',
      floor: 'Floor 2 — North Wing',
      equipmentSummary: 'Simulated screening suite, automated height/weight station',
      isExclusive: true,
      isActive: true,
    },
    {
      id: 'RM-202',
      code: 'P-202',
      name: 'Procedure & Mobility Suite 202',
      type: 'Procedure',
      floor: 'Floor 2 — North Wing',
      equipmentSummary: 'Adjustable physiotherapy & orthopedic review station',
      isExclusive: true,
      isActive: true,
    },
    {
      id: 'RM-301',
      code: 'T-301',
      name: 'Telehealth & Counseling Pod 301',
      type: 'Telehealth Booth',
      floor: 'Floor 3 — Quiet Zone',
      equipmentSummary: 'Acoustic booth, 4K conferencing rig, dual monitors',
      isExclusive: false,
      isActive: true,
    },
    {
      id: 'RM-302',
      code: 'TR-302',
      name: 'Intake & Triage Bay 302',
      type: 'Triage',
      floor: 'Floor 1 — Reception Annex',
      equipmentSummary: 'Rapid check-in intake station',
      isExclusive: false,
      isActive: true,
    },
  ];

  // 2. 12 Fictional Doctors
  const doctors: Doctor[] = [
    {
      id: 'DOC-01',
      fullName: 'Dr. Helena Vance',
      title: 'Lead Outpatient Clinician (Demo)',
      specialty: 'Internal & Preventive Wellness',
      department: 'Primary Care',
      email: 'h.vance@medora-demo.example',
      phone: '(555) 010-1101',
      avatarInitials: 'HV',
      colorTag: '#0891B2',
      defaultConsultationDuration: 30,
      serviceIds: ['SRV-01', 'SRV-02', 'SRV-03', 'SRV-07', 'SRV-13'],
      assignedRoomId: 'RM-101',
      status: 'Active',
      bio: 'Fictional lead clinician specializing in preventive outpatient coordination and annual wellness screenings.',
    },
    {
      id: 'DOC-02',
      fullName: 'Dr. Julian Mercer',
      title: 'Senior Clinician (Demo)',
      specialty: 'Cardiometabolic Prevention',
      department: 'Specialist Care',
      email: 'j.mercer@medora-demo.example',
      phone: '(555) 010-1102',
      avatarInitials: 'JM',
      colorTag: '#0D9488',
      defaultConsultationDuration: 30,
      serviceIds: ['SRV-01', 'SRV-04', 'SRV-05', 'SRV-14'],
      assignedRoomId: 'RM-102',
      status: 'Active',
      bio: 'Fictional specialist focused on outpatient lifestyle baseline assessments and preventive screening.',
    },
    {
      id: 'DOC-03',
      fullName: 'Dr. Clara Callahan',
      title: 'Mobility & Rehabilitation Specialist (Demo)',
      specialty: 'Musculoskeletal & Ergonomics',
      department: 'Rehabilitation',
      email: 'c.callahan@medora-demo.example',
      phone: '(555) 010-1103',
      avatarInitials: 'CC',
      colorTag: '#2563EB',
      defaultConsultationDuration: 45,
      serviceIds: ['SRV-06', 'SRV-08', 'SRV-15'],
      assignedRoomId: 'RM-202',
      status: 'Active',
      bio: 'Fictional clinician demonstrating orthopedic posture reviews and movement consultations.',
    },
    {
      id: 'DOC-04',
      fullName: 'Dr. Marcus Kensington',
      title: 'Family Care Clinician (Demo)',
      specialty: 'General Outpatient Medicine',
      department: 'Primary Care',
      email: 'm.kensington@medora-demo.example',
      phone: '(555) 010-1104',
      avatarInitials: 'MK',
      colorTag: '#059669',
      defaultConsultationDuration: 30,
      serviceIds: ['SRV-01', 'SRV-02', 'SRV-03', 'SRV-09', 'SRV-16'],
      assignedRoomId: 'RM-103',
      status: 'Active',
      bio: 'Fictional family practice clinician managing routine visits and continuity follow-ups.',
    },
    {
      id: 'DOC-05',
      fullName: 'Dr. Nora Whitaker',
      title: 'Preventive Dermatology Clinician (Demo)',
      specialty: 'Dermatology & Skin Wellness',
      department: 'Specialist Care',
      email: 'n.whitaker@medora-demo.example',
      phone: '(555) 010-1105',
      avatarInitials: 'NW',
      colorTag: '#7C3AED',
      defaultConsultationDuration: 30,
      serviceIds: ['SRV-10', 'SRV-11', 'SRV-17'],
      assignedRoomId: 'RM-104',
      status: 'Active',
      bio: 'Fictional specialist conducting non-invasive visual skin wellness checks in the demo clinic.',
    },
    {
      id: 'DOC-06',
      fullName: 'Dr. Liam Aldridge',
      title: 'Diagnostic Screening Specialist (Demo)',
      specialty: 'Preventive Diagnostics',
      department: 'Diagnostics',
      email: 'l.aldridge@medora-demo.example',
      phone: '(555) 010-1106',
      avatarInitials: 'LA',
      colorTag: '#D97706',
      defaultConsultationDuration: 30,
      serviceIds: ['SRV-04', 'SRV-07', 'SRV-12', 'SRV-18'],
      assignedRoomId: 'RM-201',
      status: 'Active',
      bio: 'Fictional diagnostic coordinator overseeing baseline wellness metrics and preventive checkups.',
    },
    {
      id: 'DOC-07',
      fullName: 'Dr. Maya Sterling',
      title: 'Behavioral & Sleep Wellness Specialist (Demo)',
      specialty: 'Sleep & Stress Resilience',
      department: 'Wellness',
      email: 'm.sterling@medora-demo.example',
      phone: '(555) 010-1107',
      avatarInitials: 'MS',
      colorTag: '#0284C7',
      defaultConsultationDuration: 45,
      serviceIds: ['SRV-09', 'SRV-13', 'SRV-16'],
      assignedRoomId: 'RM-301',
      status: 'Active',
      bio: 'Fictional wellness counselor focused on sleep architecture education and workplace stress balance.',
    },
    {
      id: 'DOC-08',
      fullName: 'Dr. Gideon Linden',
      title: 'Outpatient Physician (Demo)',
      specialty: 'General Practice',
      department: 'Primary Care',
      email: 'g.linden@medora-demo.example',
      phone: '(555) 010-1108',
      avatarInitials: 'GL',
      colorTag: '#0F766E',
      defaultConsultationDuration: 30,
      serviceIds: ['SRV-01', 'SRV-02', 'SRV-03', 'SRV-14'],
      assignedRoomId: 'RM-101',
      status: 'Active',
      bio: 'Fictional outpatient generalist supporting afternoon and weekend clinic hours.',
    },
    {
      id: 'DOC-09',
      fullName: 'Dr. Tessa Thorne',
      title: 'Clinical Nutrition Specialist (Demo)',
      specialty: 'Metabolic & Nutritional Counseling',
      department: 'Wellness',
      email: 't.thorne@medora-demo.example',
      phone: '(555) 010-1109',
      avatarInitials: 'TT',
      colorTag: '#15803D',
      defaultConsultationDuration: 45,
      serviceIds: ['SRV-05', 'SRV-13', 'SRV-16'],
      assignedRoomId: 'RM-301',
      status: 'Active',
      bio: 'Fictional nutrition advisor guiding structured dietary habits and hydration planning.',
    },
    {
      id: 'DOC-10',
      fullName: 'Dr. Owen Hawthorne',
      title: 'Respiratory & Allergy Specialist (Demo)',
      specialty: 'Environmental Wellness',
      department: 'Specialist Care',
      email: 'o.hawthorne@medora-demo.example',
      phone: '(555) 010-1110',
      avatarInitials: 'OH',
      colorTag: '#4F46E5',
      defaultConsultationDuration: 30,
      serviceIds: ['SRV-01', 'SRV-12', 'SRV-18'],
      assignedRoomId: 'RM-201',
      status: 'Active',
      bio: 'Fictional clinician reviewing seasonal environmental wellness and breathing comfort.',
    },
    {
      id: 'DOC-11',
      fullName: 'Dr. Hannah Pemberton',
      title: 'Senior Outpatient Clinician (Demo)',
      specialty: 'Longevity & Preventive Care',
      department: 'Primary Care',
      email: 'h.pemberton@medora-demo.example',
      phone: '(555) 010-1111',
      avatarInitials: 'HP',
      colorTag: '#0369A1',
      defaultConsultationDuration: 30,
      serviceIds: ['SRV-01', 'SRV-03', 'SRV-07', 'SRV-15'],
      assignedRoomId: 'RM-103',
      status: 'Active',
      bio: 'Fictional clinician dedicated to healthy aging consultations and mobility preservation.',
    },
    {
      id: 'DOC-12',
      fullName: 'Dr. Caleb Sutherland',
      title: 'Visiting Consultant (Demo)',
      specialty: 'Travel & Occupational Readiness',
      department: 'Primary Care',
      email: 'c.sutherland@medora-demo.example',
      phone: '(555) 010-1112',
      avatarInitials: 'CS',
      colorTag: '#64748B',
      defaultConsultationDuration: 30,
      serviceIds: ['SRV-01', 'SRV-02', 'SRV-17'],
      assignedRoomId: 'RM-302',
      status: 'On Leave',
      bio: 'Fictional consultant currently on scheduled sabbatical leave in the demonstration dataset.',
    },
  ];

  // 3. 18 Clinic Services
  const services: ClinicService[] = [
    {
      id: 'SRV-01',
      code: 'GEN-100',
      name: 'Comprehensive Outpatient Consultation',
      category: 'General Consultation',
      durationMinutes: 30,
      price: 165,
      requiresRoom: true,
      description: 'Standard 30-minute fictional outpatient visit and general wellness review.',
      doctorIds: ['DOC-01', 'DOC-02', 'DOC-04', 'DOC-08', 'DOC-10', 'DOC-11', 'DOC-12'],
      isActive: true,
    },
    {
      id: 'SRV-02',
      code: 'FOL-110',
      name: 'Focused Follow-Up Visit',
      category: 'Follow-up Care',
      durationMinutes: 15,
      price: 95,
      requiresRoom: true,
      description: 'Brief 15-minute progress check and administrative continuity review.',
      doctorIds: ['DOC-01', 'DOC-04', 'DOC-08', 'DOC-12'],
      isActive: true,
    },
    {
      id: 'SRV-03',
      code: 'PRV-200',
      name: 'Annual Preventive Wellness Review',
      category: 'Preventive Screening',
      durationMinutes: 45,
      price: 240,
      requiresRoom: true,
      description: 'Extended 45-minute annual preventive screening and lifestyle planning session.',
      doctorIds: ['DOC-01', 'DOC-04', 'DOC-08', 'DOC-11'],
      isActive: true,
    },
    {
      id: 'SRV-04',
      code: 'CRD-210',
      name: 'Cardiometabolic Baseline Assessment',
      category: 'Specialist Review',
      durationMinutes: 30,
      price: 210,
      requiresRoom: true,
      description: 'Simulated specialist review of cardiovascular fitness and lifestyle indicators.',
      doctorIds: ['DOC-02', 'DOC-06'],
      isActive: true,
    },
    {
      id: 'SRV-05',
      code: 'NUT-220',
      name: 'Metabolic & Nutritional Strategy Session',
      category: 'Wellness Counseling',
      durationMinutes: 45,
      price: 185,
      requiresRoom: false,
      description: 'Structured dietary and hydration planning session with a demo wellness specialist.',
      doctorIds: ['DOC-02', 'DOC-09'],
      isActive: true,
    },
    {
      id: 'SRV-06',
      code: 'MSK-300',
      name: 'Ergonomic & Posture Mobility Evaluation',
      category: 'Specialist Review',
      durationMinutes: 45,
      price: 225,
      requiresRoom: true,
      description: 'Comprehensive functional movement and workplace ergonomics assessment.',
      doctorIds: ['DOC-03'],
      isActive: true,
    },
    {
      id: 'SRV-07',
      code: 'DIA-310',
      name: 'Executive Health Baseline Panel',
      category: 'Diagnostic Assessment',
      durationMinutes: 60,
      price: 340,
      requiresRoom: true,
      description: 'Full 60-minute multi-parameter preventive screening demonstration.',
      doctorIds: ['DOC-01', 'DOC-06', 'DOC-11'],
      isActive: true,
    },
    {
      id: 'SRV-08',
      code: 'MSK-320',
      name: 'Joint Recovery Follow-Up Check',
      category: 'Follow-up Care',
      durationMinutes: 30,
      price: 145,
      requiresRoom: true,
      description: 'Follow-up mobility check and guided stretching protocol review.',
      doctorIds: ['DOC-03'],
      isActive: true,
    },
    {
      id: 'SRV-09',
      code: 'SLP-400',
      name: 'Sleep Hygiene & Circadian Consultation',
      category: 'Wellness Counseling',
      durationMinutes: 45,
      price: 195,
      requiresRoom: false,
      description: 'Non-clinical consultation focused on rest patterns and circadian routines.',
      doctorIds: ['DOC-04', 'DOC-07'],
      isActive: true,
    },
    {
      id: 'SRV-10',
      code: 'DRM-410',
      name: 'Preventive Skin Wellness Screening',
      category: 'Preventive Screening',
      durationMinutes: 30,
      price: 190,
      requiresRoom: true,
      description: 'Routine visual skin health check and sun-protection education.',
      doctorIds: ['DOC-05'],
      isActive: true,
    },
    {
      id: 'SRV-11',
      code: 'DRM-420',
      name: 'Dermatology Follow-Up Review',
      category: 'Follow-up Care',
      durationMinutes: 15,
      price: 110,
      requiresRoom: true,
      description: 'Short 15-minute skin care routine progress check.',
      doctorIds: ['DOC-05'],
      isActive: true,
    },
    {
      id: 'SRV-12',
      code: 'DIA-500',
      name: 'Respiratory & Seasonal Comfort Check',
      category: 'Diagnostic Assessment',
      durationMinutes: 30,
      price: 175,
      requiresRoom: true,
      description: 'Simulated spirometry comfort demonstration and seasonal wellness briefing.',
      doctorIds: ['DOC-06', 'DOC-10'],
      isActive: true,
    },
    {
      id: 'SRV-13',
      code: 'WEL-510',
      name: 'Stress Resilience & Burnout Prevention',
      category: 'Wellness Counseling',
      durationMinutes: 45,
      price: 180,
      requiresRoom: false,
      description: 'Structured lifestyle pacing and recovery consultation.',
      doctorIds: ['DOC-01', 'DOC-07', 'DOC-09'],
      isActive: true,
    },
    {
      id: 'SRV-14',
      code: 'FOL-520',
      name: 'Blood Pressure & Vitals Check-In',
      category: 'Follow-up Care',
      durationMinutes: 15,
      price: 85,
      requiresRoom: true,
      description: '15-minute baseline vitals logging and administrative chart update.',
      doctorIds: ['DOC-02', 'DOC-08'],
      isActive: true,
    },
    {
      id: 'SRV-15',
      code: 'PRV-600',
      name: 'Healthy Longevity & Balance Screening',
      category: 'Preventive Screening',
      durationMinutes: 45,
      price: 230,
      requiresRoom: true,
      description: 'Stability, gait, and healthy aging wellness consultation.',
      doctorIds: ['DOC-03', 'DOC-11'],
      isActive: true,
    },
    {
      id: 'SRV-16',
      code: 'WEL-610',
      name: 'Telehealth Wellness Check-In',
      category: 'Wellness Counseling',
      durationMinutes: 30,
      price: 130,
      requiresRoom: false,
      description: 'Remote-simulated wellness consultation from the Telehealth Pod.',
      doctorIds: ['DOC-04', 'DOC-07', 'DOC-09'],
      isActive: true,
    },
    {
      id: 'SRV-17',
      code: 'PRV-620',
      name: 'Pre-Travel Readiness Briefing',
      category: 'Preventive Screening',
      durationMinutes: 30,
      price: 150,
      requiresRoom: true,
      description: 'General travel wellness and itinerary preparation consultation.',
      doctorIds: ['DOC-05', 'DOC-12'],
      isActive: true,
    },
    {
      id: 'SRV-18',
      code: 'DIA-630',
      name: 'Environmental Sensitivity Review',
      category: 'Diagnostic Assessment',
      durationMinutes: 30,
      price: 195,
      requiresRoom: true,
      description: 'Review of workplace and household environmental wellness factors.',
      doctorIds: ['DOC-06', 'DOC-10'],
      isActive: true,
    },
  ];

  // 4. Doctor Availabilities
  const availabilities: DoctorAvailability[] = doctors.map((doc, idx) => ({
    doctorId: doc.id,
    weeklySchedule: createStandardWeeklySchedule(
      idx % 2 === 0 ? '08:00' : '08:30',
      idx % 3 === 0 ? '18:00' : '17:30',
      idx < 6 // First 6 doctors also work Saturday mornings
    ),
  }));

  // 5. Schedule Exceptions (holidays & doctor blocks)
  const scheduleExceptions: ScheduleException[] = [
    {
      id: 'EXC-01',
      date: '2026-11-26',
      title: 'Thanksgiving Clinic Holiday',
      isClosedAllDay: true,
    },
    {
      id: 'EXC-02',
      date: '2026-12-25',
      title: 'Winter Holiday Closure',
      isClosedAllDay: true,
    },
    {
      id: 'EXC-03',
      date: DEMO_TODAY,
      doctorId: 'DOC-05',
      title: 'Clinical Department Briefing',
      isClosedAllDay: false,
      blockedStart: '15:00',
      blockedEnd: '16:30',
    },
  ];

  // 6. 15 Fictional Staff Members
  const staffRoles: Array<{
    role: ClinicStaff['role'];
    dept: string;
    area: string;
    shift: string;
  }> = [
    { role: 'Clinic Administrator', dept: 'Administration', area: 'Executive Operations Suite', shift: 'Mon–Fri 08:00–17:00' },
    { role: 'Operations Manager', dept: 'Administration', area: 'Clinic Floor Command', shift: 'Mon–Fri 08:30–17:30' },
    { role: 'Receptionist', dept: 'Front Desk', area: 'Main Lobby Check-In Desk A', shift: 'Mon–Fri 07:45–16:15' },
    { role: 'Receptionist', dept: 'Front Desk', area: 'Main Lobby Check-In Desk B', shift: 'Mon–Fri 09:30–18:00' },
    { role: 'Receptionist', dept: 'Front Desk', area: 'East Wing Reception', shift: 'Tue–Sat 08:30–17:00' },
    { role: 'Nurse Coordinator', dept: 'Patient Care', area: 'West Wing Consultation Suites', shift: 'Mon–Fri 08:00–16:30' },
    { role: 'Nurse Coordinator', dept: 'Patient Care', area: 'East Wing Consultation Suites', shift: 'Mon–Fri 08:30–17:00' },
    { role: 'Nurse Coordinator', dept: 'Diagnostics', area: 'Floor 2 Diagnostic Center', shift: 'Mon–Fri 08:00–16:30' },
    { role: 'Billing Staff', dept: 'Finance & Billing', area: 'Billing Office Suite 410', shift: 'Mon–Fri 08:30–17:00' },
    { role: 'Billing Staff', dept: 'Finance & Billing', area: 'Patient Accounts Desk', shift: 'Mon–Fri 09:00–17:30' },
    { role: 'Clinic Administrator', dept: 'Quality & Scheduling', area: 'Scheduling Operations', shift: 'Mon–Fri 08:00–16:30' },
    { role: 'Receptionist', dept: 'Front Desk', area: 'Telehealth Support Desk', shift: 'Mon–Fri 08:30–17:00' },
    { role: 'Nurse Coordinator', dept: 'Rehabilitation', area: 'Mobility Suite 202', shift: 'Mon–Fri 08:30–17:00' },
    { role: 'Billing Staff', dept: 'Finance & Billing', area: 'Claims & Receipts Reconciliation', shift: 'Mon–Fri 08:30–17:00' },
    { role: 'Operations Manager', dept: 'Facilities', area: 'Room & Resource Coordination', shift: 'Mon–Fri 08:00–17:00' },
  ];

  const staff: ClinicStaff[] = staffRoles.map((item, i) => {
    const fn = FIRST_NAMES[(i * 3 + 2) % FIRST_NAMES.length];
    const ln = LAST_NAMES[(i * 5 + 1) % LAST_NAMES.length];
    return {
      id: `STF-${String(i + 1).padStart(2, '0')}`,
      fullName: `${fn} ${ln}`,
      role: item.role,
      department: item.dept,
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}@medora-demo.example`,
      phone: `(555) 014-${String(2000 + i)}`,
      assignedArea: item.area,
      shiftSchedule: item.shift,
      status: i === 14 ? 'Off Duty' : 'Active',
    };
  });

  // 7. 150 Fictional Patients
  const bloodGroups = ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-'];
  const genders: Patient['gender'][] = ['Female', 'Male', 'Non-binary', 'Female', 'Male'];

  const patients: Patient[] = [];
  for (let i = 0; i < 150; i++) {
    const fn = FIRST_NAMES[i % FIRST_NAMES.length];
    const ln = LAST_NAMES[(Math.floor(i / FIRST_NAMES.length) * 3 + i) % LAST_NAMES.length];
    const suffix = i >= 60 ? ` ${String.fromCharCode(65 + (i % 26))}.` : '';
    const fullName = `${fn}${suffix} ${ln}`;
    const id = `PAT-${String(1001 + i)}`;
    const birthYear = 1948 + ((i * 11) % 56); // 1948..2003
    const regOffset = -180 + (i % 165);
    const registrationDate = addDaysToDateStr(DEMO_TODAY, regOffset);
    const preferredDoc = doctors[i % 11].id;

    patients.push({
      id,
      fullName,
      birthYear,
      gender: genders[i % genders.length],
      phone: `(555) 018-${String(1000 + i).padStart(4, '0')}`,
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}${i + 1}@fictional-patient.example`,
      address: `${100 + i * 4} ${STREETS[i % STREETS.length]}, Apt ${1 + (i % 12)}, Bayview, CA`,
      emergencyContactName: `${FIRST_NAMES[(i + 7) % FIRST_NAMES.length]} ${ln}`,
      emergencyContactPhone: `(555) 019-${String(3000 + i).padStart(4, '0')}`,
      bloodGroupLabel: bloodGroups[i % bloodGroups.length],
      allergyNote: ALLERGY_NOTES[i % ALLERGY_NOTES.length],
      preferredDoctorId: preferredDoc,
      registrationDate,
      status: i > 0 && i % 29 === 0 ? 'Archived' : i > 0 && i % 7 === 0 ? 'Follow-up Due' : 'Active',
      administrativeNotes:
        'Fictional demonstration patient record. Prefers SMS reminder simulation 24h prior to appointment.',
    });
  }

  // 8. 350 Appointments across past 75 days, DEMO_TODAY, and next 14 days
  const appointments: Appointment[] = [];
  const visits: Visit[] = [];
  const consultations: Consultation[] = [];
  const documents: DemoDocument[] = [];
  const invoices: Invoice[] = [];
  const payments: Payment[] = [];
  const activities: Activity[] = [];

  // Candidate non-overlapping morning & afternoon start slots that never touch 12:30-13:15 break
  const safeSlots = [
    '08:30',
    '09:30',
    '10:30',
    '11:30',
    '13:30',
    '14:30',
    '15:30',
    '16:15',
  ];

  let aptCounter = 1;
  let visitCounter = 1;
  let conCounter = 1;
  let docCounter = 1;
  let invCounter = 1;
  let payCounter = 1;
  let actCounter = 1;

  // Helper to push an appointment safely
  const createSeededAppointment = (params: {
    date: string;
    slotTime: string;
    doctorIndex: number;
    patientIndex: number;
    status: AppointmentStatus;
  }) => {
    const doc = doctors[params.doctorIndex % 11]; // Active doctors 0..10
    const pat = patients[params.patientIndex % patients.length];
    const srvId = doc.serviceIds[aptCounter % doc.serviceIds.length];
    const srv = services.find((s) => s.id === srvId) || services[0];
    const duration = srv.durationMinutes;
    const endTime = calculateEndTime(params.slotTime, duration);
    const aptId = `APT-${String(1000 + aptCounter)}`;
    aptCounter++;

    const createdIso = `${addDaysToDateStr(params.date, -3)}T09:15:00.000Z`;
    let checkedInAt: string | undefined;
    let waitingSince: string | undefined;
    let consultationStartedAt: string | undefined;
    let consultationCompletedAt: string | undefined;

    if (
      params.status === 'Checked In' ||
      params.status === 'Waiting' ||
      params.status === 'In Consultation' ||
      params.status === 'Completed'
    ) {
      checkedInAt = `${params.date}T${params.slotTime}:00.000Z`;
      waitingSince = `${params.date}T${params.slotTime}:00.000Z`;
    }
    if (params.status === 'In Consultation' || params.status === 'Completed') {
      consultationStartedAt = `${params.date}T${params.slotTime}:00.000Z`;
    }
    if (params.status === 'Completed') {
      consultationCompletedAt = `${params.date}T${endTime}:00.000Z`;
    }

    const reason = SAMPLE_REASONS[(aptCounter + params.patientIndex) % SAMPLE_REASONS.length];

    const appointment: Appointment = {
      id: aptId,
      patientId: pat.id,
      doctorId: doc.id,
      serviceId: srv.id,
      roomId: doc.assignedRoomId,
      date: params.date,
      startTime: params.slotTime,
      endTime,
      durationMinutes: duration,
      status: params.status,
      reasonForVisit: reason,
      administrativeNotes: `Booked via MEDORA Demo Scheduler (${srv.code}).`,
      checkedInAt,
      waitingSince,
      consultationStartedAt,
      consultationCompletedAt,
      createdAt: createdIso,
      updatedAt: createdIso,
    };

    appointments.push(appointment);

    // Update patient lastVisitDate if completed
    if (params.status === 'Completed') {
      if (!pat.lastVisitDate || params.date > pat.lastVisitDate) {
        pat.lastVisitDate = params.date;
      }
    }

    // Create Visit if In Consultation or Completed
    if (params.status === 'Completed' || params.status === 'In Consultation') {
      const visitId = `VIS-${String(1000 + visitCounter)}`;
      visitCounter++;

      const visit: Visit = {
        id: visitId,
        appointmentId: aptId,
        patientId: pat.id,
        doctorId: doc.id,
        serviceId: srv.id,
        roomId: doc.assignedRoomId,
        visitDate: params.date,
        status: params.status === 'Completed' ? 'Completed' : 'In Progress',
        summaryTitle: `${srv.name} — ${doc.fullName}`,
        createdAt: `${params.date}T${params.slotTime}:00.000Z`,
      };
      visits.push(visit);

      // Create Consultation for first 105 visits or any active today
      if (consultations.length < 105 || params.date === DEMO_TODAY) {
        const conId = `CON-${String(1000 + conCounter)}`;
        conCounter++;
        const consultation: Consultation = {
          id: conId,
          visitId,
          appointmentId: aptId,
          patientId: pat.id,
          doctorId: doc.id,
          visitDate: params.date,
          status: params.status === 'Completed' ? 'Completed' : 'Active',
          reasonForVisit: reason,
          demoObservations:
            SAMPLE_OBSERVATIONS[conCounter % SAMPLE_OBSERVATIONS.length],
          clinicianFreeTextNotes: `Fictional demonstration note recorded by ${doc.fullName} for ${pat.fullName}. All parameters are non-clinical portfolio placeholders.`,
          sampleAssessmentText:
            SAMPLE_ASSESSMENTS[conCounter % SAMPLE_ASSESSMENTS.length],
          administrativeFollowUp:
            SAMPLE_FOLLOWUPS[conCounter % SAMPLE_FOLLOWUPS.length],
          updatedAt: `${params.date}T${endTime}:00.000Z`,
        };
        consultations.push(consultation);
      }

      // Create DemoDocument for first 75 completed visits
      if (params.status === 'Completed' && documents.length < 75) {
        const docId = `DOCM-${String(1000 + docCounter)}`;
        const isPrescription = docCounter % 2 === 1;
        docCounter++;

        const demoDoc: DemoDocument = {
          id: docId,
          referenceNumber: isPrescription
            ? `RX-SAMPLE-${String(2000 + docCounter)}`
            : `VS-SAMPLE-${String(2000 + docCounter)}`,
          visitId,
          appointmentId: aptId,
          patientId: pat.id,
          doctorId: doc.id,
          visitDate: params.date,
          type: isPrescription ? 'Sample Prescription' : 'Visit Summary',
          title: isPrescription
            ? `Sample Wellness Sheet — ${pat.fullName}`
            : `Outpatient Visit Summary — ${pat.fullName}`,
          sampleEntries: isPrescription
            ? [
                {
                  id: `${docId}-1`,
                  label: 'Fictional Hydration & Electrolyte Routine (Demo Placeholder)',
                  instructionNote:
                    'Sample non-actionable entry: Maintain balanced daily water intake with meals.',
                  durationLabel: '14 Days (Sample Only)',
                },
                {
                  id: `${docId}-2`,
                  label: 'Simulated Ergonomic Mobility Break Protocol (Demo Item)',
                  instructionNote:
                    'Sample non-actionable entry: 5-minute standing stretch interval every 60 minutes of desk work.',
                  durationLabel: 'Ongoing Wellness Demo',
                },
              ]
            : [
                {
                  id: `${docId}-1`,
                  label: `Outpatient Service: ${srv.name}`,
                  instructionNote:
                    'Completed routine simulated outpatient consultation and lifestyle discussion.',
                  durationLabel: `${srv.durationMinutes} mins`,
                },
              ],
          demoNotes:
            'Demonstrative outpatient document generated in MEDORA Health portfolio environment. Contains fictional entries only.',
          disclaimerText:
            'SAMPLE — NOT VALID FOR MEDICAL USE, PHARMACY DISPENSING, OR CLINICAL CARE.',
          createdAt: `${params.date}T${endTime}:00.000Z`,
        };
        documents.push(demoDoc);
      }

      // Create Invoice for first 200 visits
      if (invoices.length < 200) {
        const invId = `INV-${String(1000 + invCounter)}`;
        const invoiceNumber = `INV-2026-${String(1000 + invCounter)}`;
        invCounter++;

        const lineId = `${invId}-L1`;
        const discountAmount = invCounter % 6 === 0 ? 15 : 0;
        const lines = [
          {
            id: lineId,
            serviceId: srv.id,
            description: `${srv.name} (${srv.code})`,
            quantity: 1,
            unitPrice: srv.price,
            discountAmount,
          },
        ];

        const dueDate = addDaysToDateStr(params.date, 14);
        const invoicePayments: Payment[] = [];

        // Decide payment state: ~70% Paid, ~18% Partially Paid, ~12% Issued unpaid
        const mod = invCounter % 10;
        const netTotal = srv.price - discountAmount;

        if (mod <= 6) {
          // Full payment
          const payId = `PAY-${String(1000 + payCounter)}`;
          payCounter++;
          const pay: Payment = {
            id: payId,
            paymentReference: `RCPT-${String(5000 + payCounter)}`,
            invoiceId: invId,
            patientId: pat.id,
            amount: netTotal,
            paymentDate: params.date,
            method:
              payCounter % 3 === 0
                ? 'Simulated Bank Transfer'
                : payCounter % 2 === 0
                ? 'Simulated Clinic Account'
                : 'Simulated Card',
            notes: 'Simulated full settlement recorded at reception.',
            isReversed: false,
            createdAt: `${params.date}T${endTime}:00.000Z`,
          };
          payments.push(pay);
          invoicePayments.push(pay);
        } else if (mod === 7 || mod === 8) {
          // Two partial payments or single partial payment
          const firstHalf = Math.floor(netTotal / 2);
          const payId1 = `PAY-${String(1000 + payCounter)}`;
          payCounter++;
          const pay1: Payment = {
            id: payId1,
            paymentReference: `RCPT-${String(5000 + payCounter)}`,
            invoiceId: invId,
            patientId: pat.id,
            amount: firstHalf,
            paymentDate: params.date,
            method: 'Simulated Card',
            notes: 'Initial simulated partial deposit.',
            isReversed: false,
            createdAt: `${params.date}T${endTime}:00.000Z`,
          };
          payments.push(pay1);
          invoicePayments.push(pay1);

          if (mod === 8 && payments.length < 250) {
            const payId2 = `PAY-${String(1000 + payCounter)}`;
            payCounter++;
            const pay2: Payment = {
              id: payId2,
              paymentReference: `RCPT-${String(5000 + payCounter)}`,
              invoiceId: invId,
              patientId: pat.id,
              amount: 25,
              paymentDate: addDaysToDateStr(params.date, 2),
              method: 'Simulated Bank Transfer',
              notes: 'Second simulated installment.',
              isReversed: false,
              createdAt: `${params.date}T${endTime}:00.000Z`,
            };
            payments.push(pay2);
            invoicePayments.push(pay2);
          }
        }

        const summary = calculateInvoiceSummary({
          lines,
          taxRatePercent: 0,
          payments: invoicePayments,
          currentStatus: 'Issued',
        });

        const invoice: Invoice = {
          id: invId,
          invoiceNumber,
          patientId: pat.id,
          appointmentId: aptId,
          visitId,
          issueDate: params.date,
          dueDate,
          lines,
          taxRatePercent: 0,
          subtotal: summary.subtotal,
          discountTotal: summary.discountTotal,
          taxAmount: summary.taxAmount,
          totalAmount: summary.totalAmount,
          amountPaid: summary.amountPaid,
          outstandingBalance: summary.outstandingBalance,
          status: summary.status,
          notes: 'Fictional outpatient billing statement — non-financial portfolio demo.',
          createdAt: `${params.date}T${endTime}:00.000Z`,
        };
        invoices.push(invoice);
      }
    }

    // Add Activity log entry
    if (activities.length < 350) {
      activities.push({
        id: `ACT-${String(1000 + actCounter)}`,
        type:
          params.status === 'Completed'
            ? 'consultation_completed'
            : params.status === 'In Consultation'
            ? 'consultation_started'
            : params.status === 'Waiting' || params.status === 'Checked In'
            ? 'patient_checked_in'
            : 'appointment_booked',
        title:
          params.status === 'Completed'
            ? `Completed consultation for ${pat.fullName}`
            : params.status === 'In Consultation'
            ? `Started consultation with ${pat.fullName}`
            : params.status === 'Waiting' || params.status === 'Checked In'
            ? `Checked in ${pat.fullName} at reception`
            : `Booked ${srv.name} for ${pat.fullName}`,
        description: `${doc.fullName} · ${params.date} at ${params.slotTime} (${params.status})`,
        actorName: doc.fullName,
        actorRole: 'Doctor',
        relatedPatientId: pat.id,
        relatedAppointmentId: aptId,
        relatedDoctorId: doc.id,
        timestamp: `${params.date}T${params.slotTime}:00.000Z`,
      });
      actCounter++;
    }
  };

  // Seed Today's Queue & Schedule (24 appointments on DEMO_TODAY across doctors)
  const todayStatuses: AppointmentStatus[] = [
    'Completed',
    'Completed',
    'Completed',
    'Completed',
    'Completed',
    'In Consultation',
    'In Consultation',
    'In Consultation',
    'Waiting',
    'Waiting',
    'Waiting',
    'Waiting',
    'Checked In',
    'Checked In',
    'Checked In',
    'Confirmed',
    'Confirmed',
    'Confirmed',
    'Scheduled',
    'Scheduled',
    'Scheduled',
    'Scheduled',
    'No-show',
    'Cancelled',
  ];

  for (let i = 0; i < 24; i++) {
    const docIdx = i % 6; // 6 doctors active today with distinct rooms (DOC-01..DOC-06 have distinct rooms RM-101,102,202,103,104,201)
    const slotIdx = Math.floor(i / 6); // 0..3 -> 08:30, 09:30, 10:30, 11:30
    createSeededAppointment({
      date: DEMO_TODAY,
      slotTime: safeSlots[slotIdx],
      doctorIndex: docIdx,
      patientIndex: i * 3,
      status: todayStatuses[i],
    });
  }

  // Seed historical days (past 65 weekdays) to reach ~205 completed visits and ~310 historical appointments
  let dayCursor = -1;
  while (visits.length < 202 || appointments.length < 320) {
    const dateStr = addDaysToDateStr(DEMO_TODAY, dayCursor);
    const [y, m, d] = dateStr.split('-').map(Number);
    const dow = new Date(y, m - 1, d, 12, 0, 0).getDay();

    if (dow >= 1 && dow <= 5) {
      // 6 appointments per weekday on distinct room doctors (DOC-01..DOC-06)
      for (let slotIdx = 0; slotIdx < 6; slotIdx++) {
        if (appointments.length >= 325 && visits.length >= 202) break;
        const docIdx = slotIdx % 6;
        const patIdx = (Math.abs(dayCursor) * 7 + slotIdx * 5) % 140;
        let status: AppointmentStatus = 'Completed';
        if (visits.length >= 202) {
          status =
            slotIdx % 3 === 0
              ? 'Cancelled'
              : slotIdx % 2 === 0
              ? 'No-show'
              : 'Completed';
        } else if ((Math.abs(dayCursor) + slotIdx) % 11 === 0) {
          status = 'No-show';
        } else if ((Math.abs(dayCursor) + slotIdx) % 13 === 0) {
          status = 'Cancelled';
        }

        createSeededAppointment({
          date: dateStr,
          slotTime: safeSlots[slotIdx],
          doctorIndex: docIdx,
          patientIndex: patIdx,
          status,
        });
      }
    }
    dayCursor--;
    if (dayCursor < -120) break;
  }

  // Seed upcoming appointments (next 10 weekdays) to reach 350 total appointments
  let futureCursor = 1;
  while (appointments.length < 350) {
    const dateStr = addDaysToDateStr(DEMO_TODAY, futureCursor);
    const [y, m, d] = dateStr.split('-').map(Number);
    const dow = new Date(y, m - 1, d, 12, 0, 0).getDay();

    if (dow >= 1 && dow <= 5 && dateStr !== '2026-11-26') {
      for (let slotIdx = 0; slotIdx < 5; slotIdx++) {
        if (appointments.length >= 350) break;
        const docIdx = slotIdx % 6;
        const patIdx = (futureCursor * 9 + slotIdx * 4) % 140;
        createSeededAppointment({
          date: dateStr,
          slotTime: safeSlots[slotIdx],
          doctorIndex: docIdx,
          patientIndex: patIdx,
          status: slotIdx % 2 === 0 ? 'Confirmed' : 'Scheduled',
        });
      }
    }
    futureCursor++;
    if (futureCursor > 30) break;
  }

  const notifications: AppNotification[] = [
    {
      id: 'NOTIF-01',
      title: '4 Patients Waiting in Reception Queue',
      message: 'Patients checked in for morning consultations are ready in the waiting lounge.',
      category: 'Queue',
      isRead: false,
      linkUrl: '/dashboard/queue',
      createdAt: `${DEMO_TODAY}T09:35:00.000Z`,
    },
    {
      id: 'NOTIF-02',
      title: '3 Active Consultations in Progress',
      message: 'Suites C-101, C-102, and P-202 are currently in active demo consultation.',
      category: 'Appointment',
      isRead: false,
      linkUrl: '/dashboard/consultations',
      createdAt: `${DEMO_TODAY}T09:40:00.000Z`,
    },
    {
      id: 'NOTIF-03',
      title: 'Pending Invoices Ready for Settlement',
      message: 'Review open outpatient invoices in the Billing Workspace.',
      category: 'Billing',
      isRead: false,
      linkUrl: '/dashboard/billing',
      createdAt: `${DEMO_TODAY}T08:15:00.000Z`,
    },
  ];

  const savedReports: SavedReportConfig[] = [
    {
      id: 'REP-01',
      name: 'Monthly Outpatient Operations Summary',
      reportType: 'operations',
      dateFrom: '2026-10-01',
      dateTo: DEMO_TODAY,
    },
    {
      id: 'REP-02',
      name: 'Primary Care Utilization & Schedule Audit',
      reportType: 'doctor_schedule',
      dateFrom: '2026-11-01',
      dateTo: '2026-11-30',
      doctorId: 'DOC-01',
    },
    {
      id: 'REP-03',
      name: 'Q4 Billing & Payment Collection Reconciliation',
      reportType: 'billing_summary',
      dateFrom: '2026-10-01',
      dateTo: DEMO_TODAY,
    },
  ];

  return {
    version: 1,
    patients,
    doctors,
    availabilities,
    scheduleExceptions,
    services,
    rooms,
    staff,
    appointments,
    visits,
    consultations,
    documents,
    invoices,
    payments,
    activities,
    notifications,
    savedReports,
  };
}
