const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const HttpError = require('../utils/httpError');
const sendEmail = require('./email');

const MINUTES_VALID = 10;
const MAX_WRONG_TRIES = 5;

// Makes a new 6-digit code for this email, saves a scrambled copy, and emails the real one
async function sendEmailCode(email) {
  const code = String(crypto.randomInt(100000, 1000000));
  const data = {
    codeHash: await bcrypt.hash(code, 10),
    expiresAt: new Date(Date.now() + MINUTES_VALID * 60 * 1000),
    attempts: 0,
  };
  // upsert = update the row if this email already has a code, otherwise create it
  await prisma.emailCode.upsert({ where: { email }, create: { email, ...data }, update: data });

  await sendEmail(
    email,
    'Your MediPass verification code',
    `Your MediPass verification code is ${code}. It expires in ${MINUTES_VALID} minutes.`
  );
}

// Throws an error unless the code is the right one for this email
async function checkEmailCode(email, code) {
  const saved = await prisma.emailCode.findUnique({ where: { email } });
  if (!saved || saved.expiresAt < new Date()) {
    throw new HttpError(400, 'The code has expired. Please request a new one.');
  }
  if (saved.attempts >= MAX_WRONG_TRIES) {
    throw new HttpError(400, 'Too many wrong tries. Please request a new code.');
  }
  if (!(await bcrypt.compare(code, saved.codeHash))) {
    await prisma.emailCode.update({ where: { email }, data: { attempts: { increment: 1 } } });
    throw new HttpError(400, 'Wrong verification code');
  }
}

module.exports = { sendEmailCode, checkEmailCode };
