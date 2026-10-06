import { useState } from 'react';
import api, { getError } from '../../api/axios';
import useFetch from '../../hooks/useFetch';
import { Page, Card, Loading, ErrorMsg, Empty, btnCls, btnDangerCls } from '../../components/UI';

export default function AdminDashboard() {
  const stats = useFetch('/admin/stats');
  const doctors = useFetch('/admin/doctors?status=PENDING');
  const [error, setError] = useState('');

  async function verify(id, status) {
    setError('');
    try {
      await api.patch(`/admin/doctors/${id}/verify`, { status });
      doctors.reload();
      stats.reload();
    } catch (err) {
      setError(getError(err));
    }
  }

  const cards = [
    ['Patients', stats.data?.patients],
    ['Doctors', stats.data?.doctors],
    ['Pending doctors', stats.data?.pendingDoctors],
    ['Active grants', stats.data?.activeGrants],
  ];

  return (
    <Page title="Admin dashboard">
      <ErrorMsg>{error || stats.error}</ErrorMsg>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {cards.map(([label, value]) => (
          <Card key={label}>
            <p className="text-3xl font-bold text-teal-700">{value ?? '-'}</p>
            <p className="text-sm text-slate-600">{label}</p>
          </Card>
        ))}
      </div>

      <Card title="Doctors waiting for approval">
        {doctors.loading && <Loading />}
        <ErrorMsg>{doctors.error}</ErrorMsg>
        {doctors.data?.length === 0 && <Empty>No doctors are waiting.</Empty>}
        {doctors.data?.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-slate-500">
                <tr>
                  <th className="py-2">Name</th>
                  <th>Specialization</th>
                  <th>License</th>
                  <th>Hospital</th>
                  <th></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {doctors.data.map((d) => (
                  <tr key={d.id}>
                    <td className="py-2">{d.fullName}</td>
                    <td>{d.specialization}</td>
                    <td>{d.licenseNo}</td>
                    <td>{d.hospitalName}</td>
                    <td className="space-x-2 whitespace-nowrap py-2 text-right">
                      <button className={btnCls} onClick={() => verify(d.id, 'APPROVED')}>Approve</button>
                      <button className={btnDangerCls} onClick={() => verify(d.id, 'REJECTED')}>Reject</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </Page>
  );
}
