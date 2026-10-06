const express = require('express');
const prisma = require('../config/db');
const HttpError = require('../utils/httpError');
const validate = require('../middleware/validate');
const { authenticate, requireRole } = require('../middleware/auth');
const { loadPatient, loadDoctor, loadApprovedDoctor } = require('../middleware/loadProfile');
const schemas = require('../validators/schemas');

const router = express.Router();
router.use(authenticate);

const withPatient = { patient: { select: { fullName: true, healthId: true } } };
const withDoctor = { doctor: { select: { fullName: true, specialization: true, hospitalName: true } } };

// POST /api/access/request  (approved doctor asks for access by Health ID)
router.post(
  '/request',
  requireRole('DOCTOR'),
  loadApprovedDoctor,
  validate(schemas.accessRequest),
  async (req, res) => {
    const patient = await prisma.patient.findUnique({ where: { healthId: req.body.healthId } });
    if (!patient) throw new HttpError(404, 'No patient found with this Health ID');

    // One open request per doctor and patient: not while pending, not while a grant is active
    const open = await prisma.accessRequest.findFirst({
      where: {
        patientId: patient.id,
        doctorId: req.doctor.id,
        OR: [{ status: 'PENDING' }, { status: 'APPROVED', expiresAt: { gt: new Date() } }],
      },
    });
    if (open) {
      throw new HttpError(
        409,
        open.status === 'PENDING'
          ? 'You already have a pending request for this patient'
          : 'You already have active access to this patient'
      );
    }

    const created = await prisma.accessRequest.create({
      data: { patientId: patient.id, doctorId: req.doctor.id, reason: req.body.reason },
      include: withPatient,
    });
    res.status(201).json(created);
  }
);

// GET /api/access/requests  (the caller's own requests, newest first)
router.get('/requests', requireRole('PATIENT', 'DOCTOR'), async (req, res) => {
  if (req.user.role === 'PATIENT') {
    await loadPatient(req, res, () => {});
    return res.json(
      await prisma.accessRequest.findMany({
        where: { patientId: req.patient.id },
        orderBy: { requestedAt: 'desc' },
        include: withDoctor,
      })
    );
  }

  await loadDoctor(req, res, () => {});
  res.json(
    await prisma.accessRequest.findMany({
      where: { doctorId: req.doctor.id },
      orderBy: { requestedAt: 'desc' },
      include: withPatient,
    })
  );
});

// GET /api/access/active  (patients this doctor can open right now)
router.get('/active', requireRole('DOCTOR'), loadApprovedDoctor, async (req, res) => {
  const grants = await prisma.accessRequest.findMany({
    where: { doctorId: req.doctor.id, status: 'APPROVED', expiresAt: { gt: new Date() } },
    orderBy: { expiresAt: 'asc' },
    include: withPatient,
  });
  res.json(grants);
});

// Finds the request and makes sure it belongs to the logged-in patient
async function ownRequest(req) {
  const id = Number(req.params.id);
  const request = Number.isInteger(id)
    ? await prisma.accessRequest.findUnique({ where: { id } })
    : null;
  if (!request || request.patientId !== req.patient.id) throw new HttpError(404, 'Request not found');
  return request;
}

const patientOnly = [requireRole('PATIENT'), loadPatient];

// PATCH /api/access/:id/approve
router.patch('/:id/approve', patientOnly, validate(schemas.approve), async (req, res) => {
  const request = await ownRequest(req);
  if (request.status !== 'PENDING') throw new HttpError(409, 'Only a pending request can be approved');

  const now = new Date();
  const updated = await prisma.accessRequest.update({
    where: { id: request.id },
    data: {
      status: 'APPROVED',
      approvedAt: now,
      expiresAt: new Date(now.getTime() + req.body.durationHours * 60 * 60 * 1000),
    },
    include: withDoctor,
  });
  res.json(updated);
});

// PATCH /api/access/:id/deny
router.patch('/:id/deny', patientOnly, async (req, res) => {
  const request = await ownRequest(req);
  if (request.status !== 'PENDING') throw new HttpError(409, 'Only a pending request can be denied');

  const updated = await prisma.accessRequest.update({
    where: { id: request.id },
    data: { status: 'DENIED' },
    include: withDoctor,
  });
  res.json(updated);
});

// PATCH /api/access/:id/revoke
router.patch('/:id/revoke', patientOnly, async (req, res) => {
  const request = await ownRequest(req);
  if (request.status !== 'APPROVED') throw new HttpError(409, 'Only approved access can be revoked');

  const updated = await prisma.accessRequest.update({
    where: { id: request.id },
    data: { status: 'REVOKED', revokedAt: new Date() },
    include: withDoctor,
  });
  res.json(updated);
});

module.exports = router;
