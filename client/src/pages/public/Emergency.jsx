import { useParams } from 'react-router-dom';
import useFetch from '../../hooks/useFetch';
import { Loading } from '../../components/UI';

// Public page: no login, no navbar. Made to read clearly on a phone.
export default function Emergency() {
  const { qrToken } = useParams();
  const { data, loading, error } = useFetch(`/emergency/${qrToken}`);

  if (loading) return <Loading />;

  if (error || !data) {
    return (
      <main className="mx-auto max-w-md px-4 py-12 text-center">
        <p className="text-lg font-semibold text-slate-900">Emergency card not available</p>
        <p className="mt-2 text-sm text-slate-600">
          The patient has turned this card off, or the code is not valid.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md space-y-4 px-4 py-8">
      <h1 className="rounded-xl bg-red-600 px-4 py-3 text-center text-lg font-bold text-white">
        Emergency medical card
      </h1>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-2xl font-bold text-slate-900">{data.fullName}</p>
        <p className="mt-2 text-slate-600">Blood group</p>
        <p className="text-4xl font-bold text-red-600">{data.bloodGroup || 'Unknown'}</p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="font-semibold text-slate-900">Allergies</p>
        {data.allergies?.length ? (
          <ul className="mt-1 list-inside list-disc text-slate-800">
            {data.allergies.map((a, i) => (
              <li key={a.id ?? i}>{typeof a === 'string' ? a : `${a.allergen}${a.reaction ? ` - ${a.reaction}` : ''}`}</li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-500">None recorded.</p>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="font-semibold text-slate-900">Emergency contact</p>
        <p className="text-slate-800">{data.emergencyContactName || 'Not set'}</p>
        {data.emergencyContactPhone && (
          <a href={`tel:${data.emergencyContactPhone}`} className="text-lg font-semibold text-teal-700 underline">
            {data.emergencyContactPhone}
          </a>
        )}
      </section>
    </main>
  );
}
