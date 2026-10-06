const { z } = require('zod');

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['PATIENT', 'DOCTOR']),
  fullName: z.string().min(1),
  specialization: z.string().optional(),
  licenseNo: z.string().optional(),
  hospitalName: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

module.exports = { registerSchema, loginSchema };