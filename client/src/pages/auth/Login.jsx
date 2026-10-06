import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth, homeFor } from '../../context/AuthContext';
import { getError } from '../../api/axios';
import { Card, Field, ErrorMsg, inputCls, btnCls } from '../../components/UI';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={homeFor(user.role)} replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const me = await login(email, password);
      navigate(homeFor(me.role));
    } catch (err) {
      setError(getError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <Card title="Log in to MediPass">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Email">
            <input type="email" required className={inputCls} value={email}
              onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Password">
            <input type="password" required className={inputCls} value={password}
              onChange={(e) => setPassword(e.target.value)} />
          </Field>
          <ErrorMsg>{error}</ErrorMsg>
          <button className={`${btnCls} w-full`} disabled={busy}>
            {busy ? 'Logging in...' : 'Log in'}
          </button>
        </form>
        <p className="mt-4 text-sm text-slate-600">
          New here?{' '}
          <Link to="/register" className="text-teal-700 hover:underline">Create an account</Link>
        </p>
      </Card>
    </main>
  );
}
