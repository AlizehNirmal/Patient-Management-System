const prisma = require('../config/db');

async function generateHealthId() {
  let healthId, exists = true;
  while (exists) {
    const num = Math.floor(100000 + Math.random() * 900000);
    healthId = `MP-${num}`;
    exists = await prisma.patient.findUnique({ where: { healthId } });
  }
  return healthId;
}

module.exports = { generateHealthId };