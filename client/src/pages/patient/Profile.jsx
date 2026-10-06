import { useEffect, useState } from 'react';
import api, { getError } from '../../api/axios';
import CrudList from '../../components/CrudList';
import { Page, Card, Field, Loading, ErrorMsg, SuccessMsg, inputCls, btnCls, fmtDate } from '../../components/UI';

const fields = [
  ['fullName', 'Full name', 'text'],
  ['dob', 'Date of birth', 'date'],
  ['gender', 'Gender', 'text'],
  ['phone', 'Phone', 'text'],
  ['bloodGroup', 'Blood group', 'select'],
  ['address', 'Address', 'text'],
  ['emergencyContactName', 'Emergency contact name', 'text'],
  ['emergencyContactPhone', 'Emergency contact phone', 'text'],
];

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function Profile() {
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get('/patients/me')
      .then((res) => {
        const p = res.data;
        // Fill empty values with '' and cut the date to yyyy-mm-dd for the date input
        const values = {};
        fields.forEach(([name]) => (values[name] = p[name] ?? ''));
        values.dob = values.dob ? String(values.dob).slice(0, 10) : '';
        setForm({ ...values, healthId: p.healthId });
      })
      .catch((err) => setError(getError(err)));
  }, []);

  async function save(e) {
    e.preventDefault();
    setError('');
    setSaved(false);
    try {
      // A cleared field is sent as null so the server empties it
      const body = {};
      fields.forEach(([name]) => (body[name] = form[name] === '' ? null : form[name]));
      await api.put('/patients/me', body);
      setSaved(true);
    } catch (err) {
      setError(getError(err));
    }
  }

  if (!form) return <Page>{error ? <ErrorMsg>{error}</ErrorMsg> : <Loading />}</Page>;

  return (
    <Page title="My profile">
      <Card title={`Health ID: ${form.healthId}`}>
        <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
          {fields.map(([name, label, type]) => (
            <Field key={name} label={label}>
              {type === 'select' ? (
                <select className={inputCls} value={form[name]}
                  onChange={(e) => setForm({ ...form, [name]: e.target.value })}>
                  <option value="">Not set</option>
                  {/* Keep an older free-text value selectable */}
                  {form[name] && !bloodGroups.includes(form[name]) && <option>{form[name]}</option>}
                  {bloodGroups.map((g) => <option key={g}>{g}</option>)}
                </select>
              ) : (
                <input type={type} required={name === 'fullName'} className={inputCls} value={form[name]}
                  onChange={(e) => setForm({ ...form, [name]: e.target.value })} />
              )}
            </Field>
          ))}
          <div className="space-y-2 sm:col-span-2">
            <ErrorMsg>{error}</ErrorMsg>
            <SuccessMsg>{saved && 'Profile saved.'}</SuccessMsg>
            <button className={btnCls}>Save profile</button>
          </div>
        </form>
      </Card>

      <CrudList
        title="Allergies"
        url="/patients/me/allergies"
        fields={[
          { name: 'allergen', label: 'Allergen (e.g. Penicillin)', required: true },
          { name: 'reaction', label: 'Reaction' },
          { name: 'severity', label: 'Severity (mild / severe)' },
        ]}
        show={(a) => `${a.allergen}${a.reaction ? ` - ${a.reaction}` : ''}${a.severity ? ` (${a.severity})` : ''}`}
      />

      <CrudList
        title="Chronic conditions"
        url="/patients/me/conditions"
        fields={[
          { name: 'name', label: 'Condition', required: true },
          { name: 'diagnosedOn', label: 'Diagnosed on', type: 'date' },
          { name: 'status', label: 'Status (e.g. ongoing)' },
        ]}
        show={(c) => `${c.name}${c.diagnosedOn ? ` - since ${fmtDate(c.diagnosedOn)}` : ''}${c.status ? ` (${c.status})` : ''}`}
      />
    </Page>
  );
}
