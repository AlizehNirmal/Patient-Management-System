import { jsPDF } from 'jspdf';
import api from '../api/axios';

const date = (d) => (d ? new Date(d).toLocaleDateString() : '-');

// Builds a PDF of the patient's whole health record and downloads it.
export default async function downloadHealthSummary() {
  // 1. Load everything the patient owns
  const [profile, allergies, conditions, records] = await Promise.all(
    ['/patients/me', '/patients/me/allergies', '/patients/me/conditions', '/patients/me/records'].map(
      (url) => api.get(url).then((res) => res.data)
    )
  );

  // 2. Small helpers that write text and move down the page
  const pdf = new jsPDF(); // A4 page, sizes in millimetres
  const left = 15;
  const width = 180;
  let y = 20;

  function write(text, { size = 11, bold = false, gap = 6 } = {}) {
    pdf.setFontSize(size);
    pdf.setFont('helvetica', bold ? 'bold' : 'normal');
    // Long text is cut into lines that fit the page width
    for (const line of pdf.splitTextToSize(String(text), width)) {
      if (y > 280) {
        pdf.addPage();
        y = 20;
      }
      pdf.text(line, left, y);
      y += gap;
    }
  }
  const heading = (text) => {
    y += 4;
    write(text, { size: 14, bold: true, gap: 8 });
  };

  // 3. Write the content
  write('MediPass Health Summary', { size: 20, bold: true, gap: 10 });
  write(`Generated on ${new Date().toLocaleString()}`, { size: 9 });

  heading('Patient');
  write(`Name: ${profile.fullName}`);
  write(`Health ID: ${profile.healthId}`);
  write(`Date of birth: ${date(profile.dob)}     Gender: ${profile.gender || '-'}     Blood group: ${profile.bloodGroup || '-'}`);
  write(`Phone: ${profile.phone || '-'}`);
  write(`Address: ${profile.address || '-'}`);
  write(`Emergency contact: ${profile.emergencyContactName || '-'} ${profile.emergencyContactPhone || ''}`);

  heading('Allergies');
  if (allergies.length === 0) write('None recorded.');
  allergies.forEach((a) =>
    write(`- ${a.allergen}${a.reaction ? `, reaction: ${a.reaction}` : ''}${a.severity ? ` (${a.severity})` : ''}`)
  );

  heading('Long-term conditions');
  if (conditions.length === 0) write('None recorded.');
  conditions.forEach((c) =>
    write(`- ${c.name}${c.diagnosedOn ? `, since ${date(c.diagnosedOn)}` : ''}${c.status ? ` (${c.status})` : ''}`)
  );

  heading('Visits and prescriptions');
  if (records.length === 0) write('No visits recorded.');
  records.forEach((r) => {
    y += 2;
    write(`${date(r.visitDate)} - ${r.diagnosis}`, { bold: true });
    write(`Doctor: ${r.doctor?.fullName || '-'} at ${r.hospitalName}`);
    write(`Complaint: ${r.chiefComplaint}`);
    if (r.notes) write(`Notes: ${r.notes}`);
    if (r.followUpDate) write(`Follow-up: ${date(r.followUpDate)}`);
    r.prescriptions.forEach((rx) =>
      rx.items.forEach((m) =>
        write(
          `   Medicine: ${m.medicineName} ${m.dosage}, ${m.frequency}` +
            `${m.durationDays ? ` for ${m.durationDays} days` : ''}${m.instructions ? ` (${m.instructions})` : ''}`
        )
      )
    );
  });

  // 4. Save the file on the user's device
  pdf.save(`${profile.healthId}-health-summary.pdf`);
}
