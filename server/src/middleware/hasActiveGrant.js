const prisma = require('../config/db');
const HttpError = require('../utils/httpError');

// The heart of the project: a doctor may touch a patient's data only with an
// approved grant that has not expired. Checked on every request, never cached.
module.exports = async function hasActiveGrant(req, res, next) {
  const patient = await prisma.patient.findUnique({
    where: { healthId: req.params.healthId },
  });
  if (!patient) throw new HttpError(404, 'Patient not found');

  const grant = await prisma.accessRequest.findFirst({
    where: {
      patientId: patient.id,
      doctorId: req.doctor.id, // set by loadApprovedDoctor
      status: 'APPROVED',
      expiresAt: { gt: new Date() },
    },
  });
  if (!grant) throw new HttpError(403, 'No active access grant. Ask the patient to approve your request.');

  req.patient = patient;
  req.grant = grant;
  next();
};
