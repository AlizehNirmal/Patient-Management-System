const prisma = require('../config/db');

// Makes a Health ID like MP-482913 and retries if it is already taken
module.exports = async function generateHealthId() {
  for (;;) {
    const healthId = `MP-${Math.floor(100000 + Math.random() * 900000)}`;
    const taken = await prisma.patient.findUnique({ where: { healthId } });
    if (!taken) return healthId;
  }
};
