import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth, homeFor } from '../../context/AuthContext';
import { getError } from '../../api/axios';
import { Card, Field, ErrorMsg, inputCls, btnCls, btnLightCls } from '../../components/UI';

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('PATIENT');
  const [form, setForm] = useState({
    fullName: '', email: '', password: '',
    specialization: '', licenseNo: '', hospitalName: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={homeFor(user.role)} replace />;

  const set = (name) => (e) => setForm({ ...form, [name]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setBusy(true);
    try {
      // Only send doctor fields when registering as a doctor
      const body = { role, fullName: form.fullName, email: form.email, password: form.password };
      if (role === 'DOCTOR') {
        body.specialization = form.specialization;
        body.licenseNo = form.licenseNo;
        body.hospitalName = form.hospitalName;
      }
      const me = await register(body);
      navigate(homeFor(me.role));
    } catch (err) {
      setError(getError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <Card title="Create your account">
        <div className="mb-4 grid grid-cols-2 gap-2">
          {['PATIENT', 'DOCTOR'].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={role === r ? btnCls : btnLightCls}
            >
              I am a {r === 'PATIENT' ? 'patient' : 'doctor'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Full name">
            <input required className={inputCls} value={form.fullName} onChange={set('fullName')} />
          </Field>
          <Field label="Email">
            <input type="email" required className={inputCls} value={form.email} onChange={set('email')} />
          </Field>
          <Field label="Password (8+ characters)">
            <input type="password" required className={inputCls} value={form.password} onChange={set('password')} />
          </Field>

          {role === 'DOCTOR' && (
            <>
              <Field label="Specialization">
                <input required className={inputCls} value={form.specialization} onChange={set('specialization')} />
              </Field>
              <Field label="License number">
                <input required className={inputCls} value={form.licenseNo} onChange={set('licenseNo')} />
              </Field>
              <Field label="Hospital name">
                <input required className={inputCls} value={form.hospitalName} onChange={set('hospitalName')} />
              </Field>
            </>
          )}

          <ErrorMsg>{error}</ErrorMsg>
          <button className={`${btnCls} w-full`} disabled={busy}>
            {busy ? 'Creating account...' : 'Create account'}
          </button>
        </form>
        <p className="mt-4 text-sm text-slate-600">
          Already registered?{' '}
          <Link to="/login" className="text-teal-700 hover:underline">Log in</Link>
        </p>
      </Card>
    </main>
  );
}
