const prisma = require('../config/db');
const { updateProfileSchema } = require('../validators/patient.validator');

async function getMe(req, res) {
  const patient = await prisma.patient.findUnique({ where: { userId: req.user.id } });
  if (!patient) return res.status(404).json({ error: 'Patient profile not found' });
  res.json(patient);
}

async function updateMe(req, res) {
  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  const patient = await prisma.patient.findUnique({ where: { userId: req.user.id } });
  if (!patient) return res.status(404).json({ error: 'Patient profile not found' });

  const updated = await prisma.patient.update({
    where: { userId: req.user.id },
    data: parsed.data,
  });
  res.json(updated);
}

module.exports = { getMe, updateMe };