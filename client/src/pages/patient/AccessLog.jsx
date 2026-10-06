import useFetch from '../../hooks/useFetch';
import { Page, Card, Loading, ErrorMsg, Empty, fmtDateTime } from '../../components/UI';

export default function AccessLog() {
  const { data, loading, error } = useFetch('/patients/me/logs');

  return (
    <Page title="Access log">
      <p className="text-sm text-slate-600">Every time someone views or adds to your records, it appears here.</p>
      {loading && <Loading />}
      <ErrorMsg>{error}</ErrorMsg>
      {data && data.length === 0 && <Empty>No activity yet.</Empty>}

      {data && data.length > 0 && (
        <Card>
          <ul className="divide-y divide-slate-100 text-sm">
            {data.map((log) => (
              <li key={log.id} className="flex flex-wrap justify-between gap-2 py-2">
                <span>
                  <strong>{log.actorName}</strong> {log.action}
                  {log.resourceType ? ` (${log.resourceType})` : ''}
                  {log.isEmergency && <span className="ml-2 font-medium text-red-600">Emergency</span>}
                </span>
                <span className="text-slate-500">{fmtDateTime(log.createdAt)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </Page>
  );
}
