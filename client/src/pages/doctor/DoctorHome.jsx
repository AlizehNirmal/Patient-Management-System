import { useState } from 'react';
import api, { getError } from '../../api/axios';
import useFetch from '../../hooks/useFetch';
import { useAuth } from '../../context/AuthContext';
import {
  Page, Card, Field, Loading, ErrorMsg, SuccessMsg, Empty, Badge,
  NeedsApproval, inputCls, btnCls, fmtDateTime,
} from '../../components/UI';

function RequestForm({ onSent }) {
  const [healthId, setHealthId] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  async function send(e) {
    e.preventDefault();
    setError('');
    setOk('');
    try {
      await api.post('/access/request', { healthId: healthId.trim(), reason });
      setOk('Request sent. The patient must approve it before you can see any data.');
      setHealthId('');
      setReason('');
      onSent();
    } catch (err) {
      setError(getError(err));
    }
  }

  return (
    <Card title="Request access to a patient">
      <form onSubmit={send} className="grid gap-3 sm:grid-cols-2">
        <Field label="Patient Health ID (e.g. MP-123456)">
          <input required className={inputCls} value={healthId} onChange={(e) => setHealthId(e.target.value)} />
        </Field>
        <Field label="Reason for access">
          <input required className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
        <div className="space-y-2 sm:col-span-2">
          <ErrorMsg>{error}</ErrorMsg>
          <SuccessMsg>{ok}</SuccessMsg>
          <button className={btnCls}>Send request</button>
        </div>
      </form>
    </Card>
  );
}

export default function DoctorHome() {
  const { profile } = useAuth();
  const { data, loading, error, reload } = useFetch('/access/requests');

  return (
    <Page title={`Welcome, Dr. ${profile?.fullName || ''}`}>
      <NeedsApproval>
        <RequestForm onSent={reload} />

        <Card title="My requests">
          {loading && <Loading />}
          <ErrorMsg>{error}</ErrorMsg>
          {data && data.length === 0 && <Empty>You have not requested access to anyone yet.</Empty>}
          <ul className="divide-y divide-slate-100 text-sm">
            {data?.map((r) => {
              const expired = r.status === 'APPROVED' && new Date(r.expiresAt) <= new Date();
              return (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span>
                    {r.patient?.fullName || 'Patient'}{' '}
                    <span className="text-slate-500">{r.patient?.healthId}</span>
                  </span>
                  <span className="flex items-center gap-3">
                    {r.status === 'APPROVED' && !expired && (
                      <span className="text-slate-500">until {fmtDateTime(r.expiresAt)}</span>
                    )}
                    <Badge status={expired ? 'EXPIRED' : r.status} />
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>
      </NeedsApproval>
    </Page>
  );
}
