import { useState } from 'react';
import useFetch from '../../hooks/useFetch';
import { getError } from '../../api/axios';
import downloadHealthSummary from '../../utils/healthSummaryPdf';
import { Page, Card, Loading, ErrorMsg, Empty, btnCls, fmtDate } from '../../components/UI';

export default function Timeline() {
  const { data, loading, error } = useFetch('/patients/me/records');
  const [pdfError, setPdfError] = useState('');
  const [busy, setBusy] = useState(false);

  async function downloadPdf() {
    setPdfError('');
    setBusy(true);
    try {
      await downloadHealthSummary();
    } catch (err) {
      setPdfError(getError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Page title="My visit timeline">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          Download your profile, allergies, conditions, visits and prescriptions as one PDF to share.
        </p>
        <button className={btnCls} onClick={downloadPdf} disabled={busy}>
          {busy ? 'Preparing...' : 'Download health summary (PDF)'}
        </button>
      </div>
      <ErrorMsg>{pdfError}</ErrorMsg>

      {loading && <Loading />}
      <ErrorMsg>{error}</ErrorMsg>
      {data && data.length === 0 && <Empty>No visits recorded yet.</Empty>}

      {data?.map((r) => (
        <Card key={r.id}>
          <div className="flex flex-wrap justify-between gap-2">
            <p className="font-semibold text-slate-900">{r.diagnosis}</p>
            <p className="text-sm text-slate-500">{fmtDate(r.visitDate)}</p>
          </div>
          <p className="text-sm text-slate-600">
            {r.doctor?.fullName || 'Doctor'} at {r.hospitalName}
          </p>
          <p className="mt-2 text-sm">Complaint: {r.chiefComplaint}</p>
          {r.notes && <p className="text-sm text-slate-600">Notes: {r.notes}</p>}
          {r.followUpDate && <p className="text-sm text-slate-600">Follow-up: {fmtDate(r.followUpDate)}</p>}

          {r.prescriptions?.map((rx) => (
            <ul key={rx.id} className="mt-3 list-inside list-disc rounded-lg bg-slate-50 p-3 text-sm">
              {rx.items?.map((m) => (
                <li key={m.id}>
                  <strong>{m.medicineName}</strong> {m.dosage}, {m.frequency}
                  {m.durationDays ? ` for ${m.durationDays} days` : ''}
                  {m.instructions ? ` (${m.instructions})` : ''}
                </li>
              ))}
            </ul>
          ))}
        </Card>
      ))}
    </Page>
  );
}
