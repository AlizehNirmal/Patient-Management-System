const express = require('express');
const prisma = require('../config/db');
const validate = require('../middleware/validate');
const { authenticate, requireRole } = require('../middleware/auth');
const { loadApprovedDoctor } = require('../middleware/loadProfile');
const hasActiveGrant = require('../middleware/hasActiveGrant');
const logAccess = require('../services/accessLog');
const schemas = require('../validators/schemas');

const router = express.Router();

// Every route here needs: logged in -> doctor -> approved by admin -> active grant for this patient
const guard = [authenticate, requireRole('DOCTOR'), loadApprovedDoctor, hasActiveGrant];

const recordDetails = {
  doctor: { select: { fullName: true, specialization: true } },
  prescriptions: { include: { items: true } },
};

const logView = (req) =>
  logAccess({
    patientId: req.patient.id,
    actorUserId: req.user.id,
    actorName: `Dr. ${req.doctor.fullName}`,
    action: 'viewed your records',
  });

// GET /api/doctors/patients/:healthId/summary
router.get('/patients/:healthId/summary', guard, async (req, res) => {
  const p = req.patient;
  const [allergies, conditions] = await Promise.all([
    prisma.allergy.findMany({ where: { patientId: p.id } }),
    prisma.condition.findMany({ where: { patientId: p.id } }),
  ]);
  await logView(req);

  res.json({
    profile: {
      fullName: p.fullName,
      healthId: p.healthId,
      dob: p.dob,
      gender: p.gender,
      bloodGroup: p.bloodGroup,
      phone: p.phone,
    },
    allergies,
    conditions,
  });
});

// GET /api/doctors/patients/:healthId/records
router.get('/patients/:healthId/records', guard, async (req, res) => {
  const records = await prisma.medicalRecord.findMany({
    where: { patientId: req.patient.id },
    orderBy: { visitDate: 'desc' },
    include: recordDetails,
  });
  await logView(req);
  res.json(records);
});

// POST /api/doctors/patients/:healthId/records  (visit + prescription in one request)
router.post('/patients/:healthId/records', guard, validate(schemas.record), async (req, res) => {
  const { prescriptionItems, ...visit } = req.body;

  // Nested create runs as one transaction: the visit and its medicines are saved together or not at all
  const record = await prisma.medicalRecord.create({
    data: {
      ...visit,
      notes: visit.notes || null,
      patientId: req.patient.id,
      doctorId: req.doctor.id,
      hospitalName: req.doctor.hospitalName,
      prescriptions: prescriptionItems.length
        ? {
            create: {
              items: {
                create: prescriptionItems.map((m) => ({ ...m, instructions: m.instructions || null })),
              },
            },
          }
        : undefined,
    },
    include: recordDetails,
  });

  // Allergy check: compare each medicine name with the patient's allergens, ignoring case
  const allergies = await prisma.allergy.findMany({ where: { patientId: req.patient.id } });
  const allergyWarnings = [];
  for (const allergy of allergies) {
    const allergen = allergy.allergen.toLowerCase();
    const match = prescriptionItems.some((m) => {
      const medicine = m.medicineName.toLowerCase();
      return medicine.includes(allergen) || allergen.includes(medicine);
    });
    if (match) allergyWarnings.push(`Patient is allergic to ${allergy.allergen}`);
  }

  await logAccess({
    patientId: req.patient.id,
    actorUserId: req.user.id,
    actorName: `Dr. ${req.doctor.fullName}`,
    action: 'added a visit record',
    resourceType: 'MedicalRecord',
    resourceId: record.id,
  });

  res.status(201).json({ ...record, allergyWarnings });
});

module.exports = router;
