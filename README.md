# MEDORA Health — Better Care. Better Operations.

**Project 007: Premium Clinic & Healthcare Operations Management SaaS (Portfolio Demonstration)**

MEDORA Health is a cohesive, browser-local outpatient clinic operations application built with **Next.js App Router, React 19, TypeScript, Tailwind CSS, Zustand, Recharts, Decimal.js, Zod, and jsPDF**.

---

## Portfolio Demonstration vs Production Healthcare Software

This application is designed and built **exclusively for software engineering portfolio demonstration** using deterministic fictional data:

- **Fictional Data Only:** All 150 patients, 12 clinicians, 18 clinic services, 8 rooms, 15 staff members, 350 appointments, 200+ visits, sample consultation notes, and 200 invoices are entirely fictional. Do not enter real patient or personal health information.
- **Simulated Clinical Workflows:** The Consultation Workspace and Sample Prescription generator use prewritten, non-actionable demonstration entries. The application does not diagnose conditions, calculate medication dosages, or provide clinical decision support. All generated clinical sample PDFs prominently display the `"SAMPLE — NOT VALID FOR MEDICAL USE"` watermark and omit clinician signatures.
- **Browser-Local Persistence Only:** All application state is persisted locally in the user's browser via versioned `LocalStorage` keys (`medora:version`, `medora:data`, `medora:settings`, `medora:ui`) with Zod validation, corrupt-state recovery, JSON backup/restore, and one-click demo reset. No external database or backend server is used.
- **No Real Authentication:** Operator role switching (`Clinic Administrator`, `Receptionist`, `Doctor`, `Billing Staff`) simulates operational view context and activity attribution in the browser without real access-control security.
- **No Healthcare Compliance Certification:** This portfolio demonstration makes no claim of HIPAA, GDPR, HL7/FHIR, or regulated medical-device compliance.

---

## Key Architectural Highlights

1. **Centralized Appointment Scheduling Engine (`/lib/scheduling/engine.ts`):**
   - Enforces all 12 scheduling validations (active patient, active doctor, doctor-service assignment, positive service duration, working hours, break windows `12:30–13:15`, clinic holiday closures, doctor overlap prevention, and exclusive room conflict detection).
   - Uses half-open time intervals `[startTime, endTime)` (`startA < endB && startB < endA`), allowing back-to-back appointments (`09:00–09:30` followed by `09:30–10:00`) while blocking overlapping slots.
2. **Patient 360° Workspace (`/app/dashboard/patients/[id]/page.tsx`):**
   - Synchronized 7-tab patient profile (`Overview`, `Appointments`, `Visit Timeline`, `Consultation Notes`, `Sample Documents`, `Billing`, `Activity`) referencing one unified patient ID.
3. **Reception Queue & Consultation Engine (`/app/dashboard/queue/page.tsx` & `/app/dashboard/consultations/page.tsx`):**
   - Validated state transition model (`Scheduled` / `Confirmed` → `Checked In` → `Waiting` → `In Consultation` → `Completed`, plus `No-show` and `Cancelled`) with duplicate-visit prevention.
4. **Billing Calculation Engine (`/lib/calculations/billing.ts`):**
   - Powered by `decimal.js` for exact line subtotals, discounts, configurable taxes, partial payments, full settlements, and payment reversals while preserving historical service price snapshots.
5. **Client-Side PDF & CSV Exports (`/lib/pdf/generator.ts` & `/lib/export/csv.ts`):**
   - Generates A4 Sample Prescription PDFs, Visit Summary PDFs, and Invoice PDFs on demand without storing heavy binary blobs in `LocalStorage`.
