import { Link, useNavigate } from 'react-router-dom';
import { useAuth, homeFor } from '../context/AuthContext';

const links = {
  PATIENT: [
    ['/patient', 'Access'],
    ['/patient/profile', 'Profile'],
    ['/patient/card', 'Health card'],
    ['/patient/timeline', 'Timeline'],
    ['/patient/documents', 'Documents'],
    ['/patient/logs', 'Access log'],
  ],
  DOCTOR: [
    ['/doctor', 'Dashboard'],
    ['/doctor/patients', 'My patients'],
  ],
  ADMIN: [['/admin', 'Dashboard']],
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex max-w-4xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3">
        <Link to={user ? homeFor(user.role) : '/login'} className="text-lg font-bold text-teal-700">
          MediPass
        </Link>
        {user &&
          links[user.role].map(([to, label]) => (
            <Link key={to} to={to} className="text-sm text-slate-600 hover:text-teal-700">
              {label}
            </Link>
          ))}
        {user && (
          <button onClick={handleLogout} className="ml-auto text-sm text-slate-600 hover:text-red-600">
            Log out
          </button>
        )}
      </nav>
    </header>
  );
}
