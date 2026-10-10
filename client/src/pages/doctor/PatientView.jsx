import { useState } from 'react';
import { useParams } from 'react-router-dom';
import api, { getError } from '../../api/axios';
import useFetch from '../../hooks/useFetch';
import DocumentList from '../../components/DocumentList';
import {
  Page, Card, Field, Loading, ErrorMsg, Empty, NeedsApproval,
  inputCls, btnCls, btnLightCls, fmtDate,
} from '../../components/UI';

const emptyMedicine = { medicineName: '', dosage: '', frequency: '', durationDays: '', instructions: '' };

function AddVisit({ healthId, onSaved }) {
  const [form, setForm] = useState({ chiefComplaint: '', diagnosis: '', notes: '', followUpDate: '' });
  const [medicines, setMedicines] = useState([{ ...emptyMedicine }]);
  const [error, setError] = useState('');
  const [warnings, setWarnings] = useState([]);
  const [saved, setSaved] = useState(false);

  const setMed = (i, name, value) =>
    setMedicines(medicines.map((m, idx) => (idx === i ? { ...m, [name]: value } : m)));

  async function save(e) {
    e.preventDefault();
    setError('');
    setSaved(false);
    setWarnings([]);

    // Only send medicines that have a name, and turn days into a number
    const items = medicines
      .filter((m) => m.medicineName.trim())
      .map((m) => ({
        ...m,
        durationDays: m.durationDays ? Number(m.durationDays) : undefined,
      }));
    const body = { ...form, prescriptionItems: items };
    if (!body.followUpDate) delete body.followUpDate;

    try {
      const res = await api.post(`/doctors/patients/${healthId}/records`, body);
      setWarnings(res.data.allergyWarnings || []);
      setSaved(true);
      setForm({ chiefComplaint: '', diagnosis: '', notes: '', followUpDate: '' });
      setMedicines([{ ...emptyMedicine }]);
      onSaved();
    } catch (err) {
      setError(getError(err));
    }
  }

  return (
    <Card title="Add a visit">
      <form onSubmit={save} className="space-y-3">
        <Field label="Chief complaint">
          <input required className={inputCls} value={form.chiefComplaint}
            onChange={(e) => setForm({ ...form, chiefComplaint: e.target.value })} />
        </Field>
        <Field label="Diagnosis">
          <input required className={inputCls} value={form.diagnosis}
            onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} />
        </Field>
        <Field label="Notes">
          <textarea rows={2} className={inputCls} value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </Field>
        <Field label="Follow-up date">
          <input type="date" className={inputCls} value={form.followUpDate}
            onChange={(e) => setForm({ ...form, followUpDate: e.target.value })} />
        </Field>

        <p className="pt-2 text-sm font-medium text-slate-700">Prescription</p>
        {medicines.map((m, i) => (
          <div key={i} className="grid gap-2 rounded-lg bg-slate-50 p-3 sm:grid-cols-5">
            <input placeholder="Medicine" className={inputCls} value={m.medicineName}
              onChange={(e) => setMed(i, 'medicineName', e.target.value)} />
            <input placeholder="Dosage (500mg)" className={inputCls} value={m.dosage}
              required={!!m.medicineName.trim()}
              onChange={(e) => setMed(i, 'dosage', e.target.value)} />
            <input placeholder="Frequency (3x daily)" className={inputCls} value={m.frequency}
              required={!!m.medicineName.trim()}
              onChange={(e) => setMed(i, 'frequency', e.target.value)} />
            <input placeholder="Days" type="number" min="1" className={inputCls} value={m.durationDays}
              onChange={(e) => setMed(i, 'durationDays', e.target.value)} />
            <input placeholder="Instructions" className={inputCls} value={m.instructions}
              onChange={(e) => setMed(i, 'instructions', e.target.value)} />
            {medicines.length > 1 && (
              <button type="button" className="text-left text-sm text-red-600 hover:underline sm:col-span-5"
                onClick={() => setMedicines(medicines.filter((_, idx) => idx !== i))}>
                Remove medicine
              </button>
            )}
          </div>
        ))}
        <button type="button" className={btnLightCls}
          onClick={() => setMedicines([...medicines, { ...emptyMedicine }])}>
          Add another medicine
        </button>

        <ErrorMsg>{error}</ErrorMsg>
        {warnings.length > 0 && (
          <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">
            <p className="font-semibold">Allergy warning</p>
            <ul className="list-inside list-disc">
              {warnings.map((w) => <li key={w}>{w}</li>)}
            </ul>
          </div>
        )}
        {saved && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">Visit saved.</p>}
        <div><button className={btnCls}>Save visit</button></div>
      </form>
    </Card>
  );
}

export default function PatientView() {
  const { healthId } = useParams();
  const summary = useFetch(`/doctors/patients/${healthId}/summary`);
  const records = useFetch(`/doctors/patients/${healthId}/records`);
  const documents = useFetch(`/doctors/patients/${healthId}/documents`);

  // 403 here means the grant is missing, expired or revoked
  const blocked = summary.error;
  const s = summary.data;
  const p = s?.profile || s?.patient || s;

  return (
    <Page title={p?.fullName || `Patient ${healthId}`}>
      <NeedsApproval>
        {summary.loading && <Loading />}
        <ErrorMsg>{blocked}</ErrorMsg>

        {s && (
          <>
            <Card title="Patient summary">
              <p className="text-sm text-slate-600">
                {healthId} - Blood group: {p.bloodGroup || 'not set'} - Gender: {p.gender || 'not set'} - Born: {fmtDate(p.dob)}
              </p>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="font-medium">Allergies</p>
                  {s.allergies?.length ? (
                    <ul className="list-inside list-disc text-sm text-red-700">
                      {s.allergies.map((a) => <li key={a.id}>{a.allergen} {a.reaction && `- ${a.reaction}`}</li>)}
                    </ul>
                  ) : <p className="text-sm text-slate-500">None recorded.</p>}
                </div>
                <div>
                  <p className="font-medium">Conditions</p>
                  {s.conditions?.length ? (
                    <ul className="list-inside list-disc text-sm">
                      {s.conditions.map((c) => <li key={c.id}>{c.name} {c.status && `(${c.status})`}</li>)}
                    </ul>
                  ) : <p className="text-sm text-slate-500">None recorded.</p>}
                </div>
              </div>
            </Card>

            <Card title="Documents uploaded by the patient">
              {documents.loading && <Loading />}
              <ErrorMsg>{documents.error}</ErrorMsg>
              {documents.data && (
                <DocumentList documents={documents.data} url={`/doctors/patients/${healthId}/documents`} />
              )}
            </Card>

            <AddVisit healthId={healthId} onSaved={records.reload} />

            <Card title="Past visits">
              {records.loading && <Loading />}
              <ErrorMsg>{records.error}</ErrorMsg>
              {records.data?.length === 0 && <Empty>No visits recorded yet.</Empty>}
              <ul className="divide-y divide-slate-100 text-sm">
                {records.data?.map((r) => (
                  <li key={r.id} className="py-3">
                    <p className="font-medium">{r.diagnosis} <span className="font-normal text-slate-500">- {fmtDate(r.visitDate)}</span></p>
                    <p className="text-slate-600">{r.doctor?.fullName} at {r.hospitalName}</p>
                    <p>Complaint: {r.chiefComplaint}</p>
                    {r.prescriptions?.map((rx) => (
                      <ul key={rx.id} className="mt-1 list-inside list-disc text-slate-600">
                        {rx.items?.map((m) => <li key={m.id}>{m.medicineName} {m.dosage}, {m.frequency}</li>)}
                      </ul>
                    ))}
                  </li>
                ))}
              </ul>
            </Card>
          </>
        )}
      </NeedsApproval>
    </Page>
  );
}
