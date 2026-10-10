const { z } = require('zod');

// Small building blocks
const text = (max = 200) => z.string().trim().min(1, 'This field is required').max(max);
const optionalText = (max = 200) => z.string().trim().max(max).nullable().optional();
// Accepts "2026-10-10", a full date string, null, or nothing. "" counts as null.
const optionalDate = z.preprocess(
  (v) => (v === '' ? null : v),
  z.coerce.date().nullable().optional()
);

// ---------- Auth ----------
const account = {
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
  fullName: text(100),
};

// Only PATIENT and DOCTOR can register. ADMIN is rejected here.
const register = z.discriminatedUnion(
  'role',
  [
    z.object({ role: z.literal('PATIENT'), ...account }),
    z.object({
      role: z.literal('DOCTOR'),
      ...account,
      specialization: text(),
      licenseNo: text(50),
      hospitalName: text(),
    }),
  ],
  { error: 'Role must be PATIENT or DOCTOR' }
);

const login = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

// ---------- Patient ----------
const profile = z.object({
  fullName: text(100).optional(),
  dob: optionalDate,
  gender: optionalText(30),
  phone: optionalText(30),
  bloodGroup: optionalText(10),
  address: optionalText(300),
  emergencyContactName: optionalText(100),
  emergencyContactPhone: optionalText(30),
});

const allergy = z.object({
  allergen: text(100),
  reaction: optionalText(),
  severity: optionalText(50),
});

const condition = z.object({
  name: text(100),
  diagnosedOn: optionalDate,
  status: optionalText(50),
});

const emergencyCard = z.object({ enabled: z.boolean() });

const document = z.object({
  title: text(100),
  category: z.enum(['Report', 'Prescription', 'Test result', 'Other']),
});

// ---------- Access ----------
const accessRequest = z.object({
  healthId: text(20),
  reason: text(300),
});

const approve = z.object({
  durationHours: z.number().int().min(1).max(24 * 30),
});

// ---------- Records ----------
const record = z.object({
  chiefComplaint: text(500),
  diagnosis: text(500),
  notes: optionalText(2000),
  followUpDate: optionalDate,
  prescriptionItems: z
    .array(
      z.object({
        medicineName: text(),
        dosage: text(100),
        frequency: text(100),
        durationDays: z.number().int().min(1).max(365).nullable().optional(),
        instructions: optionalText(500),
      })
    )
    .max(30)
    .default([]),
});

// ---------- Admin ----------
const verifyDoctor = z.object({ status: z.enum(['APPROVED', 'REJECTED']) });

module.exports = {
  register, login, profile, allergy, condition, emergencyCard, document,
  accessRequest, approve, record, verifyDoctor,
};
