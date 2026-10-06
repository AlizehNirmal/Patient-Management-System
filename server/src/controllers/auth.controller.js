const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const { registerSchema, loginSchema } = require('../validators/auth.validator');
const { generateHealthId } = require('../services/healthId.service');

function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
}

async function register(req, res) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const { email, password, role, fullName, specialization, licenseNo, hospitalName } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({ data: { email, passwordHash, role } });

  if (role === 'PATIENT') {
    const healthId = await generateHealthId();
    await prisma.patient.create({ data: { userId: user.id, healthId, fullName } });
  } else if (role === 'DOCTOR') {
    if (!specialization || !licenseNo || !hospitalName)
      return res.status(400).json({ error: 'Doctor fields required' });
    await prisma.doctor.create({
      data: { userId: user.id, fullName, specialization, licenseNo, hospitalName },
    });
  }

  const token = signToken(user);
  res.status(201).json({ token, user: { id: user.id, email: user.email, role: user.role } });
}

async function login(req, res) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = signToken(user);
  res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
}

async function me(req, res) {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  let profile = null;
  if (user.role === 'PATIENT') profile = await prisma.patient.findUnique({ where: { userId: user.id } });
  if (user.role === 'DOCTOR') profile = await prisma.doctor.findUnique({ where: { userId: user.id } });
  res.json({ user: { id: user.id, email: user.email, role: user.role }, profile });
}

module.exports = { register, login, me };