const prisma = require('../config/db');
const HttpError = require('../utils/httpError');

// Sets req.patient to the logged-in patient's own profile
async function loadPatient(req, res, next) {
  const patient = await prisma.patient.findUnique({ where: { userId: req.user.id } });
  if (!patient) throw new HttpError(404, 'Patient profile not found');
  req.patient = patient;
  next();
}

// Sets req.doctor to the logged-in doctor's profile (any verification status)
async function loadDoctor(req, res, next) {
  const doctor = await prisma.doctor.findUnique({ where: { userId: req.user.id } });
  if (!doctor) throw new HttpError(404, 'Doctor profile not found');
  req.doctor = doctor;
  next();
}

// Same as loadDoctor, but blocks doctors the admin has not approved
async function loadApprovedDoctor(req, res, next) {
  await loadDoctor(req, res, () => {});
  if (req.doctor.verificationStatus !== 'APPROVED') {
    throw new HttpError(403, 'Your account is not approved by the admin yet');
  }
  next();
}

module.exports = { loadPatient, loadDoctor, loadApprovedDoctor };
