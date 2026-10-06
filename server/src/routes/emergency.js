const express = require('express');
const prisma = require('../config/db');
const HttpError = require('../utils/httpError');

const router = express.Router();

// GET /api/emergency/:qrToken  (public, no login). Returns only the minimal card.
router.get('/:qrToken', async (req, res) => {
  const patient = await prisma.patient.findUnique({
    where: { qrToken: req.params.qrToken },
    include: { allergies: { select: { allergen: true, reaction: true, severity: true } } },
  });
  // Same answer for "does not exist" and "turned off", so the token cannot be probed
  if (!patient || !patient.emergencyCardEnabled) throw new HttpError(404, 'Emergency card not available');

  res.json({
    fullName: patient.fullName,
    bloodGroup: patient.bloodGroup,
    allergies: patient.allergies,
    emergencyContactName: patient.emergencyContactName,
    emergencyContactPhone: patient.emergencyContactPhone,
  });
});

module.exports = router;
