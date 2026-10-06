import useFetch from '../../hooks/useFetch';
import { Page, Card, Loading, ErrorMsg, Empty, fmtDate } from '../../components/UI';

export default function Timeline() {
  const { data, loading, error } = useFetch('/patients/me/records');

  return (
    <Page title="My visit timeline">
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
