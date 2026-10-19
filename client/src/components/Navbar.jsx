import { NavLink, Link, useNavigate } from 'react-router-dom';
import { HeartPulse, ShieldCheck, QrCode, Clock, FileText, ScrollText, LayoutDashboard, Users, LogOut } from 'lucide-react';
import { useAuth, homeFor } from '../context/AuthContext';

// [path, label (shown on hover), icon]
const links = {
  PATIENT: [
    ['/patient', 'Access', ShieldCheck],
    ['/patient/card', 'Health card', QrCode],
    ['/patient/timeline', 'Timeline', Clock],
    ['/patient/documents', 'Documents', FileText],
    ['/patient/logs', 'Access log', ScrollText],
    ['/patient', 'Access'],
    ['/patient/profile', 'Profile'],
    ['/patient/card', 'Health card'],
    ['/patient/timeline', 'Timeline'],
    ['/patient/documents', 'Documents'],
    ['/patient/logs', 'Access log'],
  ],
  DOCTOR: [
    ['/doctor', 'Dashboard', LayoutDashboard],
    ['/doctor/patients', 'My patients', Users],
  ],
  ADMIN: [['/admin', 'Dashboard', LayoutDashboard]],
};

const iconClass = ({ isActive }) =>
  `flex h-11 w-11 items-center justify-center rounded-xl transition ${
    isActive ? 'bg-teal-50 text-teal-700' : 'text-slate-500 hover:bg-slate-100 hover:text-teal-700'
  }`;

export default function Navbar() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  // Avatar shows the first letters of the user's name
  const name = profile?.fullName || user?.email || '';
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  const profilePath = user?.role === 'PATIENT' ? '/patient/profile' : homeFor(user?.role);

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-2">
        {/* Logo */}
        <Link to={user ? homeFor(user.role) : '/login'} className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
            <HeartPulse size={18} />
          </span>
          <span className="font-logo text-2xl bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent">
            MediPass
          </span>
        </Link>

        {user && (
          <>
            {/* Icon bar: bottom of the screen on phones, top on larger screens */}
            <nav className="fixed inset-x-0 bottom-0 flex items-center justify-around border-t border-slate-200 bg-white py-1 sm:static sm:justify-center sm:gap-2 sm:border-0 sm:bg-transparent sm:py-0">
              {links[user.role].map(([to, label, Icon]) => (
                <NavLink key={to} to={to} end title={label} aria-label={label} className={iconClass}>
                  <Icon size={24} strokeWidth={1.8} />
                </NavLink>
              ))}
            </nav>

            {/* Right side: profile avatar + log out */}
            <div className="flex items-center gap-1">
              <NavLink to={profilePath} title="Profile" aria-label="Profile"
                className={({ isActive }) =>
                  `rounded-full p-0.5 ${isActive ? 'ring-2 ring-teal-600' : 'ring-2 ring-transparent hover:ring-slate-300'}`}>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 text-sm font-semibold text-white">
                  {initials}
                </span>
              </NavLink>
              <button onClick={handleLogout} title="Log out" aria-label="Log out"
                className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-red-50 hover:text-red-600">
                <LogOut size={18} />
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}