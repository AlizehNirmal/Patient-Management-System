import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

// Tailwind class strings reused everywhere
export const inputCls =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20';
export const btnCls =
  'rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-50';
export const btnLightCls =
  'rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50';
export const btnDangerCls =
  'rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700';

export function Page({ title, children }) {
  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      {title && <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>}
      {children}
    </main>
  );
}

export function Card({ title, children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      {title && <h2 className="mb-3 text-lg font-semibold text-slate-900">{title}</h2>}
      {children}
    </section>
  );
}

export function Field({ label, children }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

export function Loading() {
  return <p className="py-6 text-center text-slate-500">Loading...</p>;
}

export function ErrorMsg({ children }) {
  if (!children) return null;
  return <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{children}</p>;
}

export function SuccessMsg({ children }) {
  if (!children) return null;
  return <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{children}</p>;
}

export function Empty({ children }) {
  return <p className="py-4 text-center text-sm text-slate-500">{children}</p>;
}

const badgeColors = {
  PENDING: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-green-100 text-green-800',
  DENIED: 'bg-red-100 text-red-800',
  REVOKED: 'bg-slate-200 text-slate-700',
  EXPIRED: 'bg-slate-200 text-slate-700',
  REJECTED: 'bg-red-100 text-red-800',
};
export function Badge({ status }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeColors[status] || ''}`}>
      {status}
    </span>
  );
}

// Shows a banner instead of the page until an admin approves the doctor
export function NeedsApproval({ children }) {
  const { profile, refresh } = useAuth();
  const status = profile?.verificationStatus;

  // Re-check with the server, so the banner goes away once an admin approves
  useEffect(() => {
    if (status !== 'APPROVED') refresh().catch(() => {});
  }, []);

  if (status === 'APPROVED') return children;
  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-amber-900">
      <p className="font-semibold">
        {status === 'REJECTED' ? 'Your account was rejected by the admin.' : 'Waiting for admin approval'}
      </p>
      <p className="mt-1 text-sm">
        {status === 'REJECTED'
          ? 'Please contact the administrator.'
          : 'You can request patient access once an admin verifies your license.'}
      </p>
    </div>
  );
}

// Formatting helpers
export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : '-');
export const fmtDateTime = (d) => (d ? new Date(d).toLocaleString() : '-');
