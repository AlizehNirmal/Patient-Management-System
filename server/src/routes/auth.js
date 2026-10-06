const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const prisma = require('../config/db');
const HttpError = require('../utils/httpError');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const generateHealthId = require('../services/healthId');
const schemas = require('../validators/schemas');

const router = express.Router();

// Slows down password guessing: 20 tries per 15 minutes from one address
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: { error: 'Too many attempts. Please wait a few minutes and try again.' },
});

const publicUser = (user) => ({ id: user.id, email: user.email, role: user.role });
const signToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

// POST /api/auth/register
router.post('/register', authLimiter, validate(schemas.register), async (req, res) => {
  const { role, email, password, fullName, specialization, licenseNo, hospitalName } = req.body;

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) throw new HttpError(409, 'An account with this email already exists');

  const passwordHash = await bcrypt.hash(password, 10);
  const profile =
    role === 'PATIENT'
      ? { patient: { create: { fullName, healthId: await generateHealthId() } } }
      : { doctor: { create: { fullName, specialization, licenseNo, hospitalName } } };

  const user = await prisma.user.create({ data: { email, passwordHash, role, ...profile } });
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

// POST /api/auth/login
router.post('/login', authLimiter, validate(schemas.login), async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  const ok = user && (await bcrypt.compare(password, user.passwordHash));
  if (!ok) throw new HttpError(401, 'Wrong email or password');

  res.json({ token: signToken(user), user: publicUser(user) });
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { patient: true, doctor: true },
  });
  if (!user) throw new HttpError(401, 'Account not found. Please log in again');

  res.json({ user: publicUser(user), profile: user.patient || user.doctor || null });
});

module.exports = router;
