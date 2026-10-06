const prisma = require('../config/db');

// Adds one row to the patient's access log. The log is append-only:
// there is no code anywhere that updates or deletes these rows.
// Opening one page calls several endpoints, so the same view by the same
// person within a minute is written only once.
module.exports = async function logAccess({ patientId, actorUserId, actorName, action, resourceType, resourceId }) {
  if (!resourceId) {
    const recent = await prisma.accessLog.findFirst({
      where: {
        patientId,
        actorUserId,
        action,
        createdAt: { gt: new Date(Date.now() - 60 * 1000) },
      },
    });
    if (recent) return;
  }

  await prisma.accessLog.create({
    data: { patientId, actorUserId, actorName, action, resourceType, resourceId },
  });
};
