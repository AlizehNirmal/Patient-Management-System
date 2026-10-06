import { Link } from 'react-router-dom';
import useFetch from '../../hooks/useFetch';
import { Page, Card, Loading, ErrorMsg, Empty, NeedsApproval, btnCls } from '../../components/UI';

// Turns an expiry time into text like "2h 15m left"
function timeLeft(expiresAt) {
  const mins = Math.floor((new Date(expiresAt) - new Date()) / 60000);
  if (mins <= 0) return 'expired';
  if (mins < 60) return `${mins}m left`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ${mins % 60}m left`;
  return `${Math.floor(mins / 1440)} days left`;
}

export default function MyPatients() {
  const { data, loading, error } = useFetch('/access/active');

  return (
    <Page title="My patients">
      <NeedsApproval>
        {loading && <Loading />}
        <ErrorMsg>{error}</ErrorMsg>
        {data && data.length === 0 && (
          <Empty>No patient has approved your access right now.</Empty>
        )}
        {data?.map((g) => {
          const patient = g.patient || g;
          return (
            <Card key={g.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{patient.fullName}</p>
                  <p className="text-sm text-slate-500">
                    {patient.healthId} - {timeLeft(g.expiresAt)}
                  </p>
                </div>
                <Link to={`/doctor/patients/${patient.healthId}`} className={btnCls}>
                  Open records
                </Link>
              </div>
            </Card>
          );
        })}
      </NeedsApproval>
    </Page>
  );
}
