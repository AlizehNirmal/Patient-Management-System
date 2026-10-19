import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth, homeFor } from '../../context/AuthContext';
import api, { getError } from '../../api/axios';
import { Card, Field, ErrorMsg, SuccessMsg, inputCls, btnCls, btnLightCls } from '../../components/UI';

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('PATIENT');
  const [form, setForm] = useState({
    fullName: '', email: '', password: '',
    specialization: '', licenseNo: '', hospitalName: '',
  });
  // Step 1 = fill in details, step 2 = type the code we emailed
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={homeFor(user.role)} replace />;

  const set = (name) => (e) => setForm({ ...form, [name]: e.target.value });

  // Step 1: ask the server to email a 6-digit code
  async function sendCode(e) {
    e?.preventDefault();
    setError('');
    setInfo('');
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setBusy(true);
    try {
      await api.post('/auth/send-code', { email: form.email });
      setCodeSent(true);
      setInfo(`We sent a 6-digit code to ${form.email}. It is valid for 10 minutes.`);
    } catch (err) {
      setError(getError(err));
    } finally {
      setBusy(false);
    }
  }

  // Step 2: create the account with the code
  async function createAccount(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      // Only send doctor fields when registering as a doctor
      const body = { role, fullName: form.fullName, email: form.email, password: form.password, code };
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
      <Card title={codeSent ? 'Check your email' : 'Create your account'}>
        {!codeSent && (
          <>
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

            <form onSubmit={sendCode} className="space-y-4">
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
                {busy ? 'Sending code...' : 'Send verification code'}
              </button>
            </form>
          </>
        )}

        {codeSent && (
          <form onSubmit={createAccount} className="space-y-4">
            <SuccessMsg>{info}</SuccessMsg>
            <Field label="Verification code">
              <input required inputMode="numeric" maxLength={6} placeholder="6 digits" className={inputCls}
                value={code} onChange={(e) => setCode(e.target.value)} />
            </Field>
            <ErrorMsg>{error}</ErrorMsg>
            <button className={`${btnCls} w-full`} disabled={busy}>
              {busy ? 'Please wait...' : 'Create account'}
            </button>
            <div className="flex justify-between text-sm">
              <button type="button" className="text-teal-700 hover:underline" onClick={() => sendCode()}>
                Send a new code
              </button>
              <button type="button" className="text-slate-600 hover:underline" onClick={() => setCodeSent(false)}>
                Change my details
              </button>
            </div>
          </form>
        )}

        <p className="mt-4 text-sm text-slate-600">
          Already registered?{' '}
          <Link to="/login" className="text-teal-700 hover:underline">Log in</Link>
        </p>
      </Card>
    </main>
  );
}
