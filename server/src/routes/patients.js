const express = require('express');
const prisma = require('../config/db');
const HttpError = require('../utils/httpError');
const validate = require('../middleware/validate');
const { authenticate, requireRole } = require('../middleware/auth');
const { loadPatient } = require('../middleware/loadProfile');
const schemas = require('../validators/schemas');

const router = express.Router();

// Every route here works only on the logged-in patient's own data (req.patient)
router.use(authenticate, requireRole('PATIENT'), loadPatient);

// Turns "" into null so cleared fields are stored as empty
const emptyToNull = (obj) =>
  Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, v === '' ? null : v]));

const toId = (value) => {
  const id = Number(value);
  if (!Number.isInteger(id)) throw new HttpError(404, 'Not found');
  return id;
};

// ---------- Profile ----------
router.get('/me', (req, res) => res.json(req.patient));

router.put('/me', validate(schemas.profile), async (req, res) => {
  const updated = await prisma.patient.update({
    where: { id: req.patient.id },
    data: emptyToNull(req.body),
  });
  res.json(updated);
});

router.patch('/me/emergency-card', validate(schemas.emergencyCard), async (req, res) => {
  const updated = await prisma.patient.update({
    where: { id: req.patient.id },
    data: { emergencyCardEnabled: req.body.enabled },
  });
  res.json({ enabled: updated.emergencyCardEnabled });
});

// ---------- Allergies and conditions (same three routes for each) ----------
function listAddDelete(path, model, schema) {
  router.get(`/me/${path}`, async (req, res) => {
    res.json(await model.findMany({ where: { patientId: req.patient.id }, orderBy: { id: 'asc' } }));
  });

  router.post(`/me/${path}`, validate(schema), async (req, res) => {
    const created = await model.create({
      data: { ...emptyToNull(req.body), patientId: req.patient.id },
    });
    res.status(201).json(created);
  });

  router.delete(`/me/${path}/:id`, async (req, res) => {
    // patientId in the filter means a patient can never delete someone else's row
    const result = await model.deleteMany({
      where: { id: toId(req.params.id), patientId: req.patient.id },
    });
    if (result.count === 0) throw new HttpError(404, 'Not found');
    res.json({ success: true });
  });
}
listAddDelete('allergies', prisma.allergy, schemas.allergy);
listAddDelete('conditions', prisma.condition, schemas.condition);

// ---------- Timeline and access log ----------
router.get('/me/records', async (req, res) => {
  const records = await prisma.medicalRecord.findMany({
    where: { patientId: req.patient.id },
    orderBy: { visitDate: 'desc' },
    include: {
      doctor: { select: { fullName: true, specialization: true } },
      prescriptions: { include: { items: true } },
    },
  });
  res.json(records);
});

router.get('/me/logs', async (req, res) => {
  const logs = await prisma.accessLog.findMany({
    where: { patientId: req.patient.id },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  res.json(logs);
});

module.exports = router;
