'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  X,
  Search,
  Calendar,
  UserPlus,
  Stethoscope,
  BriefcaseMedical,
  Receipt,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useMedoraStore } from '@/stores/useMedoraStore';
import { getAvailableSlotsForDate } from '@/lib/scheduling/engine';
import { DEMO_TODAY } from '@/lib/seed/generator';
import { ClinicService } from '@/types/medora';

export function GlobalQuickDialogs() {
  const router = useRouter();
  const {
    dataset,
    settings,
    activeQuickDialog,
    bookingPrefill,
    setQuickDialog,
    addPatient,
    addDoctor,
    addService,
    bookAppointment,
    rescheduleAppointment,
    createInvoice,
    toggleTheme,
  } = useMedoraStore();

  // Keyboard shortcut Ctrl/Cmd + K for Command Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setQuickDialog(
          activeQuickDialog === 'command_palette' ? null : 'command_palette'
        );
      } else if (e.key === 'Escape' && activeQuickDialog) {
        setQuickDialog(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeQuickDialog, setQuickDialog]);

  // --- ADD PATIENT STATE ---
  const [patName, setPatName] = useState('');
  const [patBirthYear, setPatBirthYear] = useState(1985);
  const [patGender, setPatGender] = useState<'Female' | 'Male' | 'Non-binary' | 'Prefer not to say'>('Female');
  const [patPhone, setPatPhone] = useState('(555) 019-4820');
  const [patEmail, setPatEmail] = useState('');
  const [patAddress, setPatAddress] = useState('220 Harborview Terrace, Bayview, CA');
  const [patEmergencyName, setPatEmergencyName] = useState('Jordan Vance');
  const [patEmergencyPhone, setPatEmergencyPhone] = useState('(555) 019-9910');
  const [patBlood, setPatBlood] = useState('O+');
  const [patAllergy, setPatAllergy] = useState('No known demo sensitivities');
  const [patNotes, setPatNotes] = useState('Registered via MEDORA Demo Workspace.');

  // --- BOOK / RESCHEDULE APPOINTMENT STATE ---
  const activePatients = useMemo(
    () => dataset.patients.filter((p) => p.status !== 'Archived'),
    [dataset.patients]
  );
  const activeDoctors = useMemo(
    () => dataset.doctors.filter((d) => d.status === 'Active'),
    [dataset.doctors]
  );
  const activeServices = useMemo(
    () => dataset.services.filter((s) => s.isActive),
    [dataset.services]
  );
  const activeRooms = useMemo(
    () => dataset.rooms.filter((r) => r.isActive),
    [dataset.rooms]
  );

  const existingRescheduleApt = useMemo(
    () =>
      bookingPrefill?.rescheduleAppointmentId
        ? dataset.appointments.find(
            (a) => a.id === bookingPrefill.rescheduleAppointmentId
          )
        : undefined,
    [bookingPrefill, dataset.appointments]
  );

  const defaultDocId =
    existingRescheduleApt?.doctorId ||
    bookingPrefill?.doctorId ||
    activeDoctors[0]?.id ||
    'DOC-01';
  const defaultDocObj = dataset.doctors.find((d) => d.id === defaultDocId);

  const [aptPatientId, setAptPatientId] = useState('');
  const [aptDoctorId, setAptDoctorId] = useState('');
  const [aptServiceId, setAptServiceId] = useState('');
  const [aptRoomId, setAptRoomId] = useState('');
  const [aptDate, setAptDate] = useState('');
  const [aptStartTime, setAptStartTime] = useState('');
  const [aptReason, setAptReason] = useState('');
  const [aptErrors, setAptErrors] = useState<string[]>([]);

  const effectivePatientId =
    aptPatientId ||
    existingRescheduleApt?.patientId ||
    bookingPrefill?.patientId ||
    activePatients[0]?.id ||
    'PAT-1001';
  const effectiveDoctorId = aptDoctorId || defaultDocId;
  const effectiveServiceId =
    aptServiceId ||
    existingRescheduleApt?.serviceId ||
    bookingPrefill?.serviceId ||
    defaultDocObj?.serviceIds[0] ||
    activeServices[0]?.id ||
    'SRV-01';
  const effectiveRoomId =
    aptRoomId ||
    existingRescheduleApt?.roomId ||
    bookingPrefill?.roomId ||
    defaultDocObj?.assignedRoomId ||
    'RM-101';
  const effectiveDate =
    aptDate ||
    existingRescheduleApt?.date ||
    bookingPrefill?.date ||
    DEMO_TODAY;
  const effectiveStartTime =
    aptStartTime ||
    existingRescheduleApt?.startTime ||
    bookingPrefill?.startTime ||
    '09:00';
  const effectiveReason =
    aptReason ||
    existingRescheduleApt?.reasonForVisit ||
    'Routine outpatient wellness consultation';

  const doctorProvidedServices = useMemo(() => {
    const doc = dataset.doctors.find((d) => d.id === effectiveDoctorId);
    if (!doc) return activeServices;
    return activeServices.filter(
      (s) => doc.serviceIds.includes(s.id) || s.doctorIds.includes(doc.id)
    );
  }, [effectiveDoctorId, dataset.doctors, activeServices]);

  const availableSlots = useMemo(() => {
    if (!effectiveDoctorId || !effectiveServiceId || !effectiveDate) return [];
    return getAvailableSlotsForDate(
      {
        doctorId: effectiveDoctorId,
        serviceId: effectiveServiceId,
        date: effectiveDate,
        roomId: effectiveRoomId || undefined,
        excludeAppointmentId: bookingPrefill?.rescheduleAppointmentId,
      },
      { ...dataset, settings }
    );
  }, [
    effectiveDoctorId,
    effectiveServiceId,
    effectiveDate,
    effectiveRoomId,
    bookingPrefill?.rescheduleAppointmentId,
    dataset,
    settings,
  ]);

  // --- ADD DOCTOR STATE ---
  const [docName, setDocName] = useState('Dr. Evelyn Vance');
  const [docSpecialty, setDocSpecialty] = useState('Preventive Medicine');
  const [docDept, setDocDept] = useState('Primary Care');
  const [docEmail, setDocEmail] = useState('e.vance@medora-demo.example');
  const [docPhone, setDocPhone] = useState('(555) 010-1920');
  const [docDuration, setDocDuration] = useState(30);
  const [docRoomId, setDocRoomId] = useState('RM-101');

  // --- CREATE SERVICE STATE ---
  const [srvName, setSrvName] = useState('');
  const [srvCode, setSrvCode] = useState('PRV-700');
  const [srvCategory, setSrvCategory] =
    useState<ClinicService['category']>('General Consultation');
  const [srvDuration, setSrvDuration] = useState(30);
  const [srvPrice, setSrvPrice] = useState(175);
  const [srvDesc, setSrvDesc] = useState(
    'Fictional outpatient service configured in MEDORA Health demo.'
  );

  // --- CREATE INVOICE STATE ---
  const [invPatientId, setInvPatientId] = useState('PAT-1001');
  const [invServiceId, setInvServiceId] = useState('SRV-01');
  const [invQty, setInvQty] = useState(1);
  const [invDiscount, setInvDiscount] = useState(0);
  const [invStatus, setInvStatus] = useState<'Draft' | 'Issued'>('Issued');

  // --- COMMAND PALETTE STATE ---
  const [cmdQuery, setCmdQuery] = useState('');

  const searchResults = useMemo(() => {
    const q = cmdQuery.trim().toLowerCase();
    const pages = [
      { label: 'Overview Dashboard', href: '/dashboard' },
      { label: "Today's Reception Queue", href: '/dashboard/queue' },
      { label: 'Appointments Directory', href: '/dashboard/appointments' },
      { label: 'Doctor Scheduling Calendar', href: '/dashboard/calendar' },
      { label: 'Patient Directory', href: '/dashboard/patients' },
      { label: 'Consultations Workspace', href: '/dashboard/consultations' },
      { label: 'Sample Prescriptions', href: '/dashboard/prescriptions' },
      { label: 'Visit History', href: '/dashboard/visits' },
      { label: 'Doctors & Schedules', href: '/dashboard/doctors' },
      { label: 'Clinic Services', href: '/dashboard/services' },
      { label: 'Rooms & Resources', href: '/dashboard/rooms' },
      { label: 'Staff Directory', href: '/dashboard/staff' },
      { label: 'Billing & Invoices', href: '/dashboard/billing' },
      { label: 'Payment Records', href: '/dashboard/payments' },
      { label: 'Clinic Analytics', href: '/dashboard/analytics' },
      { label: 'Reporting Center', href: '/dashboard/reports' },
      { label: 'Activity Timeline', href: '/dashboard/activity' },
      { label: 'Clinic Settings & Backup', href: '/dashboard/settings' },
      { label: 'Help & Documentation', href: '/dashboard/help' },
    ];

    if (!q) {
      return {
        patients: dataset.patients.slice(0, 4),
        doctors: dataset.doctors.slice(0, 3),
        appointments: dataset.appointments.slice(0, 3),
        services: dataset.services.slice(0, 3),
        invoices: dataset.invoices.slice(0, 3),
        pages: pages.slice(0, 6),
      };
    }

    return {
      patients: dataset.patients
        .filter(
          (p) =>
            p.fullName.toLowerCase().includes(q) ||
            p.id.toLowerCase().includes(q) ||
            p.email.toLowerCase().includes(q)
        )
        .slice(0, 5),
      doctors: dataset.doctors
        .filter(
          (d) =>
            d.fullName.toLowerCase().includes(q) ||
            d.specialty.toLowerCase().includes(q) ||
            d.id.toLowerCase().includes(q)
        )
        .slice(0, 4),
      appointments: dataset.appointments
        .filter(
          (a) =>
            a.id.toLowerCase().includes(q) ||
            a.reasonForVisit.toLowerCase().includes(q) ||
            a.date.includes(q)
        )
        .slice(0, 4),
      services: dataset.services
        .filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.code.toLowerCase().includes(q)
        )
        .slice(0, 4),
      invoices: dataset.invoices
        .filter(
          (i) =>
            i.invoiceNumber.toLowerCase().includes(q) ||
            i.id.toLowerCase().includes(q)
        )
        .slice(0, 4),
      pages: pages.filter((p) => p.label.toLowerCase().includes(q)),
    };
  }, [cmdQuery, dataset]);

  if (!activeQuickDialog) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      {/* COMMAND PALETTE */}
      {activeQuickDialog === 'command_palette' && (
        <div className="w-full max-w-2xl rounded-xl bg-white dark:bg-[#172B39] border border-slate-200 dark:border-[#304B5B] shadow-2xl overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 dark:border-[#304B5B]">
            <Search className="w-5 h-5 text-cyan-600 dark:text-cyan-400 shrink-0" />
            <input
              type="text"
              autoFocus
              value={cmdQuery}
              onChange={(e) => setCmdQuery(e.target.value)}
              placeholder="Search patients, doctors, appointments, invoices, or run a command..."
              className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
            />
            <button
              onClick={() => setQuickDialog(null)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label="Close command palette"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="max-h-[65vh] overflow-y-auto p-4 space-y-5 text-sm">
            {/* Quick Commands */}
            <div>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-400 mb-2">
                Quick Actions
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  onClick={() => setQuickDialog('add_patient')}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] hover:bg-cyan-50/60 dark:hover:bg-[#203847] text-left font-medium text-slate-700 dark:text-slate-200 transition-colors"
                >
                  <UserPlus className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                  <span className="truncate">Add Patient</span>
                </button>
                <button
                  onClick={() => setQuickDialog('book_appointment')}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] hover:bg-cyan-50/60 dark:hover:bg-[#203847] text-left font-medium text-slate-700 dark:text-slate-200 transition-colors"
                >
                  <Calendar className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                  <span className="truncate">Book Appointment</span>
                </button>
                <button
                  onClick={() => setQuickDialog('create_invoice')}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] hover:bg-cyan-50/60 dark:hover:bg-[#203847] text-left font-medium text-slate-700 dark:text-slate-200 transition-colors"
                >
                  <Receipt className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                  <span className="truncate">Create Invoice</span>
                </button>
                <button
                  onClick={() => {
                    setQuickDialog(null);
                    router.push('/dashboard/calendar');
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] hover:bg-cyan-50/60 dark:hover:bg-[#203847] text-left font-medium text-slate-700 dark:text-slate-200 transition-colors"
                >
                  <Clock className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                  <span className="truncate">Open Calendar</span>
                </button>
                <button
                  onClick={() => {
                    setQuickDialog(null);
                    router.push('/dashboard/queue');
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] hover:bg-cyan-50/60 dark:hover:bg-[#203847] text-left font-medium text-slate-700 dark:text-slate-200 transition-colors"
                >
                  <Stethoscope className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                  <span className="truncate">Today&apos;s Queue</span>
                </button>
                <button
                  onClick={() => {
                    toggleTheme();
                    setQuickDialog(null);
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] hover:bg-cyan-50/60 dark:hover:bg-[#203847] text-left font-medium text-slate-700 dark:text-slate-200 transition-colors"
                >
                  <ArrowRight className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                  <span className="truncate">Switch Theme</span>
                </button>
              </div>
            </div>

            {/* Patients */}
            {searchResults.patients.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-400 mb-1.5">
                  Fictional Patients
                </p>
                <div className="divide-y divide-slate-100 dark:divide-[#304B5B] rounded-lg border border-slate-200 dark:border-[#304B5B]">
                  {searchResults.patients.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setQuickDialog(null);
                        router.push(`/dashboard/patients/${p.id}`);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#203847] text-left"
                    >
                      <div>
                        <span className="font-medium text-slate-900 dark:text-slate-100">
                          {p.fullName}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">
                          {p.id} · Born {p.birthYear}
                        </span>
                      </div>
                      <span className="text-xs text-cyan-600 dark:text-cyan-400">
                        Open 360° →
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Doctors */}
            {searchResults.doctors.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-400 mb-1.5">
                  Clinicians (Demo)
                </p>
                <div className="divide-y divide-slate-100 dark:divide-[#304B5B] rounded-lg border border-slate-200 dark:border-[#304B5B]">
                  {searchResults.doctors.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => {
                        setQuickDialog(null);
                        router.push('/dashboard/doctors');
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#203847] text-left"
                    >
                      <div>
                        <span className="font-medium text-slate-900 dark:text-slate-100">
                          {d.fullName}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">
                          {d.specialty}
                        </span>
                      </div>
                      <span className="text-xs text-cyan-600 dark:text-cyan-400">
                        View Schedule →
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Pages */}
            {searchResults.pages.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-400 mb-1.5">
                  Application Workspaces
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {searchResults.pages.map((pg) => (
                    <button
                      key={pg.href}
                      onClick={() => {
                        setQuickDialog(null);
                        router.push(pg.href);
                      }}
                      className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#203847] text-slate-700 dark:text-slate-200 text-left"
                    >
                      <span>{pg.label}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADD PATIENT MODAL */}
      {activeQuickDialog === 'add_patient' && (
        <div className="w-full max-w-xl rounded-xl bg-white dark:bg-[#172B39] border border-slate-200 dark:border-[#304B5B] shadow-xl p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-[#304B5B]">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Register Demo Patient
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Fictional patient record stored in browser-local persistence only.
              </p>
            </div>
            <button
              onClick={() => setQuickDialog(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form
            className="mt-4 space-y-4 text-sm"
            onSubmit={(e) => {
              e.preventDefault();
              if (!patName.trim()) {
                toast.error('Please enter a fictional patient full name.');
                return;
              }
              const created = addPatient({
                fullName: patName.trim(),
                birthYear: Number(patBirthYear) || 1985,
                gender: patGender,
                phone: patPhone.trim() || '(555) 019-1000',
                email:
                  patEmail.trim() ||
                  `${patName.toLowerCase().replace(/\s+/g, '.')}@fictional-patient.example`,
                address: patAddress.trim(),
                emergencyContactName: patEmergencyName.trim(),
                emergencyContactPhone: patEmergencyPhone.trim(),
                bloodGroupLabel: patBlood,
                allergyNote: patAllergy,
                status: 'Active',
                administrativeNotes: patNotes,
              });
              toast.success(`Registered fictional patient ${created.fullName} (${created.id})`);
              setPatName('');
              setQuickDialog(null);
            }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Fictional Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={patName}
                  onChange={(e) => setPatName(e.target.value)}
                  placeholder="e.g. Seraphina Vance"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D] text-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Birth Year
                  </label>
                  <input
                    type="number"
                    min={1920}
                    max={2026}
                    value={patBirthYear}
                    onChange={(e) => setPatBirthYear(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D] text-slate-900 dark:text-slate-100 tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Gender
                  </label>
                  <select
                    value={patGender}
                    onChange={(e) =>
                      setPatGender(e.target.value as typeof patGender)
                    }
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D] text-slate-900 dark:text-slate-100"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Non-binary">Non-binary</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Demo Phone
                </label>
                <input
                  type="text"
                  value={patPhone}
                  onChange={(e) => setPatPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D] text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Fictional Email
                </label>
                <input
                  type="email"
                  value={patEmail}
                  onChange={(e) => setPatEmail(e.target.value)}
                  placeholder="patient@fictional-patient.example"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D] text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Fictional Street Address
              </label>
              <input
                type="text"
                value={patAddress}
                onChange={(e) => setPatAddress(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D] text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Blood Group Label
                </label>
                <select
                  value={patBlood}
                  onChange={(e) => setPatBlood(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D] text-slate-900 dark:text-slate-100"
                >
                  {['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-'].map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Emergency Contact
                </label>
                <input
                  type="text"
                  value={patEmergencyName}
                  onChange={(e) => setPatEmergencyName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D] text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Emergency Phone
                </label>
                <input
                  type="text"
                  value={patEmergencyPhone}
                  onChange={(e) => setPatEmergencyPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D] text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Demo Sensitivity / Administrative Alert
                </label>
                <input
                  type="text"
                  value={patAllergy}
                  onChange={(e) => setPatAllergy(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D] text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Administrative Notes
                </label>
                <input
                  type="text"
                  value={patNotes}
                  onChange={(e) => setPatNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D] text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-[#304B5B]">
              <button
                type="button"
                onClick={() => setQuickDialog(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#203847]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#0891B2] hover:bg-cyan-700 text-white font-medium"
              >
                Register Patient
              </button>
            </div>
          </form>
        </div>
      )}

      {/* BOOK OR RESCHEDULE APPOINTMENT MODAL */}
      {activeQuickDialog === 'book_appointment' && (
        <div className="w-full max-w-2xl rounded-xl bg-white dark:bg-[#172B39] border border-slate-200 dark:border-[#304B5B] shadow-xl p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-[#304B5B]">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {bookingPrefill?.rescheduleAppointmentId
                  ? `Reschedule Appointment ${bookingPrefill.rescheduleAppointmentId}`
                  : 'Book Outpatient Appointment'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Validated against doctor working hours, break windows, clinic closures, and room conflicts.
              </p>
            </div>
            <button
              onClick={() => setQuickDialog(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form
            className="mt-4 space-y-4 text-sm"
            onSubmit={(e) => {
              e.preventDefault();
              setAptErrors([]);
              if (bookingPrefill?.rescheduleAppointmentId) {
                const res = rescheduleAppointment(
                  bookingPrefill.rescheduleAppointmentId,
                  {
                    doctorId: effectiveDoctorId,
                    serviceId: effectiveServiceId,
                    roomId: effectiveRoomId || undefined,
                    date: effectiveDate,
                    startTime: effectiveStartTime,
                    reasonForVisit: effectiveReason,
                  }
                );
                if (!res.success) {
                  setAptErrors(res.errors);
                  toast.error(res.errors[0] || 'Rescheduling validation failed.');
                  return;
                }
                toast.success(
                  `Rescheduled ${res.appointment?.id} to ${effectiveDate} at ${effectiveStartTime}`
                );
                setQuickDialog(null);
              } else {
                const res = bookAppointment({
                  patientId: effectivePatientId,
                  doctorId: effectiveDoctorId,
                  serviceId: effectiveServiceId,
                  roomId: effectiveRoomId || undefined,
                  date: effectiveDate,
                  startTime: effectiveStartTime,
                  reasonForVisit: effectiveReason,
                });
                if (!res.success) {
                  setAptErrors(res.errors);
                  toast.error(res.errors[0] || 'Booking validation failed.');
                  return;
                }
                toast.success(
                  `Booked appointment ${res.appointment?.id} for ${effectiveDate} at ${effectiveStartTime}`
                );
                setQuickDialog(null);
              }
            }}
          >
            {aptErrors.length > 0 && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Scheduling Conflict Detected:</span>
                </div>
                <ul className="list-disc pl-5 space-y-0.5">
                  {aptErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  1. Select Patient *
                </label>
                <select
                  value={effectivePatientId}
                  disabled={Boolean(bookingPrefill?.rescheduleAppointmentId)}
                  onChange={(e) => setAptPatientId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D] text-slate-900 dark:text-slate-100 disabled:opacity-60"
                >
                  {activePatients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} ({p.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  2. Select Clinician *
                </label>
                <select
                  value={effectiveDoctorId}
                  onChange={(e) => {
                    const nextDocId = e.target.value;
                    setAptDoctorId(nextDocId);
                    const doc = dataset.doctors.find((d) => d.id === nextDocId);
                    if (doc) {
                      if (doc.assignedRoomId) setAptRoomId(doc.assignedRoomId);
                      if (
                        doc.serviceIds.length > 0 &&
                        !doc.serviceIds.includes(effectiveServiceId)
                      ) {
                        setAptServiceId(doc.serviceIds[0]);
                      }
                    }
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D] text-slate-900 dark:text-slate-100"
                >
                  {activeDoctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.fullName} — {d.specialty}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  3. Clinic Service & Duration *
                </label>
                <select
                  value={effectiveServiceId}
                  onChange={(e) => setAptServiceId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D] text-slate-900 dark:text-slate-100"
                >
                  {doctorProvidedServices.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.durationMinutes} min · ${s.price})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  4. Assigned Room
                </label>
                <select
                  value={effectiveRoomId}
                  onChange={(e) => setAptRoomId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D] text-slate-900 dark:text-slate-100"
                >
                  {activeRooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.code} — {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  5. Appointment Date *
                </label>
                <input
                  type="date"
                  value={effectiveDate}
                  onChange={(e) => setAptDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D] text-slate-900 dark:text-slate-100 tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  6. Start Time (HH:mm) *
                </label>
                <input
                  type="time"
                  value={effectiveStartTime}
                  onChange={(e) => setAptStartTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D] text-slate-900 dark:text-slate-100 tabular-nums"
                />
              </div>
            </div>

            {/* Available Slots Picker */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Validated Available Time Slots ({availableSlots.length} open)
                </span>
                <span className="text-xs text-slate-500">
                  Click any open slot to select
                </span>
              </div>
              {availableSlots.length === 0 ? (
                <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/30 text-xs text-amber-800 dark:text-amber-300">
                  No open conflict-free slots on {effectiveDate} for this doctor/room combination. Try selecting another date or room.
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 max-h-32 overflow-y-auto p-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-slate-50/60 dark:bg-[#11202D]">
                  {availableSlots.map((slot) => {
                    const isSelected = slot.startTime === effectiveStartTime;
                    return (
                      <button
                        type="button"
                        key={slot.startTime}
                        onClick={() => setAptStartTime(slot.startTime)}
                        className={`px-2 py-1.5 rounded-md text-xs font-medium tabular-nums transition-colors ${
                          isSelected
                            ? 'bg-[#0891B2] text-white'
                            : 'bg-white dark:bg-[#172B39] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#304B5B] hover:border-cyan-500'
                        }`}
                      >
                        {slot.startTime}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Fictional Reason for Visit
              </label>
              <input
                type="text"
                value={effectiveReason}
                onChange={(e) => setAptReason(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D] text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-[#304B5B]">
              <button
                type="button"
                onClick={() => setQuickDialog(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#0891B2] hover:bg-cyan-700 text-white font-medium inline-flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {bookingPrefill?.rescheduleAppointmentId
                    ? 'Confirm Reschedule'
                    : 'Save Appointment'}
                </span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ADD DOCTOR MODAL */}
      {activeQuickDialog === 'add_doctor' && (
        <div className="w-full max-w-lg rounded-xl bg-white dark:bg-[#172B39] border border-slate-200 dark:border-[#304B5B] shadow-xl p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-[#304B5B]">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Add Fictional Clinician Profile
            </h2>
            <button
              onClick={() => setQuickDialog(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <form
            className="mt-4 space-y-4 text-sm"
            onSubmit={(e) => {
              e.preventDefault();
              if (!docName.trim()) return;
              const created = addDoctor({
                fullName: docName.trim(),
                title: 'Outpatient Specialist (Demo)',
                specialty: docSpecialty.trim(),
                department: docDept.trim(),
                email: docEmail.trim(),
                phone: docPhone.trim(),
                colorTag: '#0891B2',
                defaultConsultationDuration: Number(docDuration) || 30,
                serviceIds: ['SRV-01', 'SRV-02', 'SRV-03'],
                assignedRoomId: docRoomId,
                status: 'Active',
                bio: 'Fictional clinician profile added in the MEDORA Health portfolio workspace.',
              });
              toast.success(`Added clinician ${created.fullName} (${created.id})`);
              setQuickDialog(null);
            }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Fictional Clinician Name *
                </label>
                <input
                  type="text"
                  required
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Specialty *
                </label>
                <input
                  type="text"
                  required
                  value={docSpecialty}
                  onChange={(e) => setDocSpecialty(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={docDept}
                  onChange={(e) => setDocDept(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Default Duration (mins)
                </label>
                <select
                  value={docDuration}
                  onChange={(e) => setDocDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D]"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Demo Email
                </label>
                <input
                  type="email"
                  value={docEmail}
                  onChange={(e) => setDocEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Assigned Room
                </label>
                <select
                  value={docRoomId}
                  onChange={(e) => setDocRoomId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D]"
                >
                  {activeRooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.code} — {r.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-[#304B5B]">
              <button
                type="button"
                onClick={() => setQuickDialog(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#0891B2] text-white font-medium"
              >
                Save Clinician
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CREATE SERVICE MODAL */}
      {activeQuickDialog === 'create_service' && (
        <div className="w-full max-w-lg rounded-xl bg-white dark:bg-[#172B39] border border-slate-200 dark:border-[#304B5B] shadow-xl p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-[#304B5B]">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Create Clinic Service
            </h2>
            <button
              onClick={() => setQuickDialog(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <form
            className="mt-4 space-y-4 text-sm"
            onSubmit={(e) => {
              e.preventDefault();
              if (!srvName.trim()) {
                toast.error('Please enter a service name.');
                return;
              }
              const created = addService({
                code: srvCode.trim() || 'SRV-NEW',
                name: srvName.trim(),
                category: srvCategory,
                durationMinutes: Number(srvDuration) || 30,
                price: Number(srvPrice) || 150,
                requiresRoom: true,
                description: srvDesc,
                doctorIds: ['DOC-01', 'DOC-02', 'DOC-04'],
                isActive: true,
              });
              toast.success(
                `Created service "${created.name}" (${created.durationMinutes}m · $${created.price})`
              );
              setSrvName('');
              setQuickDialog(null);
            }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Service Name *
                </label>
                <input
                  type="text"
                  required
                  value={srvName}
                  onChange={(e) => setSrvName(e.target.value)}
                  placeholder="e.g. Comprehensive Posture Check"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Service Code
                </label>
                <input
                  type="text"
                  value={srvCode}
                  onChange={(e) => setSrvCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={srvCategory}
                  onChange={(e) =>
                    setSrvCategory(e.target.value as ClinicService['category'])
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D]"
                >
                  <option value="General Consultation">General Consultation</option>
                  <option value="Specialist Review">Specialist Review</option>
                  <option value="Preventive Screening">Preventive Screening</option>
                  <option value="Follow-up Care">Follow-up Care</option>
                  <option value="Diagnostic Assessment">Diagnostic Assessment</option>
                  <option value="Wellness Counseling">Wellness Counseling</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Duration (min)
                  </label>
                  <select
                    value={srvDuration}
                    onChange={(e) => setSrvDuration(Number(e.target.value))}
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D]"
                  >
                    <option value={15}>15m</option>
                    <option value={30}>30m</option>
                    <option value={45}>45m</option>
                    <option value={60}>60m</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Price ($)
                  </label>
                  <input
                    type="number"
                    min={10}
                    value={srvPrice}
                    onChange={(e) => setSrvPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D] tabular-nums"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Description
              </label>
              <input
                type="text"
                value={srvDesc}
                onChange={(e) => setSrvDesc(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D]"
              />
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-[#304B5B]">
              <button
                type="button"
                onClick={() => setQuickDialog(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#0891B2] text-white font-medium"
              >
                Create Service
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CREATE INVOICE MODAL */}
      {activeQuickDialog === 'create_invoice' && (
        <div className="w-full max-w-lg rounded-xl bg-white dark:bg-[#172B39] border border-slate-200 dark:border-[#304B5B] shadow-xl p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-[#304B5B]">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Create Outpatient Invoice
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Snapshots current service price and calculates totals via decimal.js.
              </p>
            </div>
            <button
              onClick={() => setQuickDialog(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <form
            className="mt-4 space-y-4 text-sm"
            onSubmit={(e) => {
              e.preventDefault();
              const srv =
                dataset.services.find((s) => s.id === invServiceId) ||
                dataset.services[0];
              const created = createInvoice({
                patientId: invPatientId,
                issueDate: DEMO_TODAY,
                dueDate: '2026-11-27',
                status: invStatus,
                lines: [
                  {
                    serviceId: srv.id,
                    description: `${srv.name} (${srv.code})`,
                    quantity: Math.max(1, Number(invQty) || 1),
                    unitPrice: srv.price,
                    discountAmount: Math.max(0, Number(invDiscount) || 0),
                  },
                ],
                notes: 'Created via MEDORA Billing Workspace (Simulated).',
              });
              toast.success(
                `Created invoice ${created.invoiceNumber} ($${created.totalAmount.toFixed(2)})`
              );
              setQuickDialog(null);
            }}
          >
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Patient *
              </label>
              <select
                value={invPatientId}
                onChange={(e) => setInvPatientId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D]"
              >
                {activePatients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} ({p.id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Clinic Service (Price Snapshot) *
              </label>
              <select
                value={invServiceId}
                onChange={(e) => setInvServiceId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D]"
              >
                {activeServices.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — ${s.price.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={invQty}
                  onChange={(e) => setInvQty(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D] tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Discount ($)
                </label>
                <input
                  type="number"
                  min={0}
                  value={invDiscount}
                  onChange={(e) => setInvDiscount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D] tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Initial Status
                </label>
                <select
                  value={invStatus}
                  onChange={(e) =>
                    setInvStatus(e.target.value as 'Draft' | 'Issued')
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B] bg-white dark:bg-[#11202D]"
                >
                  <option value="Issued">Issued</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-[#304B5B]">
              <button
                type="button"
                onClick={() => setQuickDialog(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-[#304B5B]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#0891B2] text-white font-medium"
              >
                Create Invoice
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
