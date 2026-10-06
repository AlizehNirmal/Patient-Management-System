const express = require('express');
const prisma = require('../config/db');
const HttpError = require('../utils/httpError');
const validate = require('../middleware/validate');
const { authenticate, requireRole } = require('../middleware/auth');
const schemas = require('../validators/schemas');

const router = express.Router();
router.use(authenticate, requireRole('ADMIN'));

const statuses = ['PENDING', 'APPROVED', 'REJECTED'];

// GET /api/admin/doctors?status=PENDING
router.get('/doctors', async (req, res) => {
  const { status } = req.query;
  if (status && !statuses.includes(status)) throw new HttpError(400, 'Unknown status');

  const doctors = await prisma.doctor.findMany({
    where: status ? { verificationStatus: status } : {},
    orderBy: { id: 'desc' },
    include: { user: { select: { email: true } } },
  });
  res.json(doctors);
});

// PATCH /api/admin/doctors/:id/verify
router.patch('/doctors/:id/verify', validate(schemas.verifyDoctor), async (req, res) => {
  const id = Number(req.params.id);
  const doctor = Number.isInteger(id) ? await prisma.doctor.findUnique({ where: { id } }) : null;
  if (!doctor) throw new HttpError(404, 'Doctor not found');

  const updated = await prisma.doctor.update({
    where: { id },
    data: {
      verificationStatus: req.body.status,
      verifiedAt: req.body.status === 'APPROVED' ? new Date() : null,
    },
  });
  res.json(updated);
});

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  const [patients, doctors, pendingDoctors, activeGrants] = await Promise.all([
    prisma.patient.count(),
    prisma.doctor.count(),
    prisma.doctor.count({ where: { verificationStatus: 'PENDING' } }),
    prisma.accessRequest.count({ where: { status: 'APPROVED', expiresAt: { gt: new Date() } } }),
  ]);
  res.json({ patients, doctors, pendingDoctors, activeGrants });
});

module.exports = router;
