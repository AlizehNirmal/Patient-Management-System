import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Emergency from './pages/public/Emergency';

import AccessRequests from './pages/patient/AccessRequests';
import Profile from './pages/patient/Profile';
import HealthCard from './pages/patient/HealthCard';
import Timeline from './pages/patient/Timeline';
import AccessLog from './pages/patient/AccessLog';

import DoctorHome from './pages/doctor/DoctorHome';
import MyPatients from './pages/doctor/MyPatients';
import PatientView from './pages/doctor/PatientView';

import AdminDashboard from './pages/admin/AdminDashboard';

// Small helper so each route says which role may open it
const guard = (role, page) => <ProtectedRoute role={role}>{page}</ProtectedRoute>;

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <Routes>
        {/* Public emergency page has no navbar */}
        <Route path="/emergency/:qrToken" element={<Emergency />} />

        <Route
          path="*"
          element={
            <>
              <Navbar />
              <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                <Route path="/patient" element={guard('PATIENT', <AccessRequests />)} />
                <Route path="/patient/profile" element={guard('PATIENT', <Profile />)} />
                <Route path="/patient/card" element={guard('PATIENT', <HealthCard />)} />
                <Route path="/patient/timeline" element={guard('PATIENT', <Timeline />)} />
                <Route path="/patient/logs" element={guard('PATIENT', <AccessLog />)} />

                <Route path="/doctor" element={guard('DOCTOR', <DoctorHome />)} />
                <Route path="/doctor/patients" element={guard('DOCTOR', <MyPatients />)} />
                <Route path="/doctor/patients/:healthId" element={guard('DOCTOR', <PatientView />)} />

                <Route path="/admin" element={guard('ADMIN', <AdminDashboard />)} />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </>
          }
        />
      </Routes>
    </div>
  );
}
