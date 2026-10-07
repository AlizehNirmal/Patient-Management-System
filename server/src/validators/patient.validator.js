const { z } = require('zod');

const updateProfileSchema = z.object({
  fullName: z.string().min(1).optional(),
  dob: z.string().optional(),
  gender: z.string().optional(),
  phone: z.string().optional(),
  bloodGroup: z.string().optional(),
  address: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
});

module.exports = { updateProfileSchema };