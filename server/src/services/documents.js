const prisma = require('../config/db');
const HttpError = require('../utils/httpError');

// Everything about a document except the file itself (used for lists)
const details = {
  id: true, title: true, category: true, fileName: true, mimeType: true, size: true, uploadedAt: true,
};

function listDocuments(patientId) {
  return prisma.document.findMany({
    where: { patientId },
    orderBy: { uploadedAt: 'desc' },
    select: details,
  });
}

// Sends the file to the browser. patientId in the filter means only that patient's files can be read.
async function sendDocument(res, id, patientId) {
  const doc = Number.isInteger(id)
    ? await prisma.document.findFirst({ where: { id, patientId } })
    : null;
  if (!doc) throw new HttpError(404, 'Document not found');

  res.set('Content-Type', doc.mimeType);
  res.send(Buffer.from(doc.data));
  return doc;
}

module.exports = { details, listDocuments, sendDocument };
