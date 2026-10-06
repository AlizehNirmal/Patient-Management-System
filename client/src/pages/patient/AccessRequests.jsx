import { useState } from 'react';
import api, { getError } from '../../api/axios';
import useFetch from '../../hooks/useFetch';
import {
  Page, Card, Loading, ErrorMsg, Empty, Badge,
  btnCls, btnLightCls, btnDangerCls, fmtDateTime,
} from '../../components/UI';

const durations = [
  { label: '1 hour', hours: 1 },
  { label: '24 hours', hours: 24 },
  { label: '7 days', hours: 168 },
];

function RequestRow({ r, onChanged, setError }) {
  const [hours, setHours] = useState(1);

  // Calls approve / deny / revoke and refreshes the list
  async function act(action, body) {
    setError('');
    try {
      await api.patch(`/access/${r.id}/${action}`, body);
      onChanged();
    } catch (err) {
      setError(getError(err));
    }
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div className="text-sm">
        <p className="font-medium text-slate-900">
          {r.doctor?.fullName || 'Doctor'}{' '}
          <span className="font-normal text-slate-500">
            {r.doctor?.specialization} {r.doctor?.hospitalName && `at ${r.doctor.hospitalName}`}
          </span>
        </p>
        {r.reason && <p className="text-slate-600">Reason: {r.reason}</p>}
        {r.status === 'APPROVED' && <p className="text-slate-500">Expires {fmtDateTime(r.expiresAt)}</p>}
      </div>

      {r.status === 'PENDING' && (
        <div className="flex items-center gap-2">
          <select
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
            className="rounded-lg border border-slate-300 px-2 py-2 text-sm"
          >
            {durations.map((d) => (
              <option key={d.hours} value={d.hours}>{d.label}</option>
            ))}
          </select>
          <button className={btnCls} onClick={() => act('approve', { durationHours: hours })}>Approve</button>
          <button className={btnLightCls} onClick={() => act('deny')}>Deny</button>
        </div>
      )}
      {r.status === 'APPROVED' && (
        <button className={btnDangerCls} onClick={() => act('revoke')}>Revoke access</button>
      )}
    </li>
  );
}

export default function AccessRequests() {
  const { data, loading, error, reload } = useFetch('/access/requests');
  const [actionError, setActionError] = useState('');

  const now = new Date();
  const pending = (data || []).filter((r) => r.status === 'PENDING');
  // A grant is only active if APPROVED and not expired
  const active = (data || []).filter((r) => r.status === 'APPROVED' && new Date(r.expiresAt) > now);
  const past = (data || []).filter((r) => !pending.includes(r) && !active.includes(r));

  return (
    <Page title="Who can see my records">
      {loading && <Loading />}
      <ErrorMsg>{error || actionError}</ErrorMsg>

      {data && (
        <Card title="Pending requests">
          {pending.length === 0 ? <Empty>No pending requests.</Empty> : (
            <ul className="divide-y divide-slate-100">
              {pending.map((r) => <RequestRow key={r.id} r={r} onChanged={reload} setError={setActionError} />)}
            </ul>
          )}
        </Card>
      )}

      {data && (
        <Card title="Active access">
          {active.length === 0 ? <Empty>No doctor currently has access.</Empty> : (
            <ul className="divide-y divide-slate-100">
              {active.map((r) => <RequestRow key={r.id} r={r} onChanged={reload} setError={setActionError} />)}
            </ul>
          )}
        </Card>
      )}

      {past.length > 0 && (
        <Card title="Past requests">
          <ul className="divide-y divide-slate-100 text-sm">
            {past.map((r) => (
              <li key={r.id} className="flex justify-between py-2">
                <span>{r.doctor?.fullName || 'Doctor'}</span>
                <Badge status={r.status === 'APPROVED' ? 'EXPIRED' : r.status} />
              </li>
            ))}
          </ul>
        </Card>
      )}
    </Page>
  );
}
