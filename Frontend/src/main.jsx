import { StrictMode, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import './index.css';

import App from './App.jsx';

// Layouts — kept eager (tiny, always needed)
import Layout from './layouts/Layout.jsx';
import PatientDashboardLayout from './layouts/PatientDashboardLayout.jsx';

// Pages — lazy loaded so Suspense in App.jsx triggers while chunks download
const Home               = lazy(() => import('./pages/Home.jsx'));
const VerifyEmail        = lazy(() => import('./pages/VerifyEmail.jsx'));
const HospitalAuth       = lazy(() => import('./pages/HospitalAuth.jsx'));
const PatientLogin       = lazy(() => import('./pages/PatientLogin.jsx'));
const PatientRegister    = lazy(() => import('./pages/PatientRegistration.jsx'));
const SuperAdminLogin    = lazy(() => import('./pages/SuperAdminLogin.jsx'));
const PatientDashboard   = lazy(() => import('./pages/PatientDashboard.jsx'));
const Prescriptions      = lazy(() => import('./pages/Prescriptions.jsx'));
const SuperAdminDashboard = lazy(() => import('./pages/SuperAdminDashboard.jsx'));
const HospitalDashboard  = lazy(() => import('./pages/Hospitaldashboard.jsx'));
const PatientManagement  = lazy(() => import('./pages/PatientManagement.jsx'));
const Features           = lazy(() => import('./pages/Features.jsx'));
const Contact            = lazy(() => import('./pages/Contact.jsx'));
const Security           = lazy(() => import('./pages/Security.jsx'));
const Pricing            = lazy(() => import('./pages/Pricing.jsx'));

const StaffLogin         = lazy(() => import('./pages/StaffLogin.jsx'));
const SubscriptionGuard  = lazy(() => import('./pages/SubscriptionGuard.jsx'));
const StaffDashboard     = lazy(() => import('./pages/Staffdashboard.jsx'));


/* ─── Auth helpers ───────────────────────────────────────────────────────────── */
function getToken() { return localStorage.getItem('token'); }
function getUser() {
  try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
}

/* ─── Public-only home ───────────────────────────────────────────────────────── */
const PublicOnlyHome = () => {
  const token = getToken();
  const user = getUser();
  const isHospital = token && user && (user.role === 'hospital_admin' || user.hospital_id);
  if (isHospital) return <Navigate to="/hospitaldashboard" replace />;
  return <Home />;
};

/* ─── Hospital login guard ───────────────────────────────────────────────────── */
const HospitalAuthGuard = () => {
  const token = getToken();
  const user = getUser();
  if (!token || !user) return <Navigate to="/hospital/auth" replace />;
  const isHospital = user.role === 'hospital_admin' || user.hospital_id;
  if (!isHospital) return <Navigate to="/unauthorized" replace />;
  return <Outlet />;
};

/* ─── Staff login guard ──────────────────────────────────────────────────────── */
const StaffAuthGuard = () => {
  const token = getToken();
  const user = getUser();
  if (!token || !user) return <Navigate to="/stafflogin" replace />;
  const EXCLUDED = ['hospital_admin', 'patient', 'super_admin'];
  const isStaff = user.role && !EXCLUDED.includes(user.role.toLowerCase());
  if (!isStaff) return <Navigate to="/unauthorized" replace />;
  return <Outlet />;
};

/* ─── Super Admin guard ──────────────────────────────────────────────────────── */
const SuperAdminGuard = () => {
  const token = getToken();
  const user = getUser();
  if (!token || !user) return <Navigate to="/superadminlogin" replace />;
  if (user.role !== 'super_admin') return <Navigate to="/unauthorized" replace />;
  return <Outlet />;
};

/* ─── Patient guard ──────────────────────────────────────────────────────────── */
const PatientGuard = () => {
  const token = getToken();
  const user = getUser();
  if (!token || !user) return <Navigate to="/patientlogin" replace />;
  if (user.role !== 'patient') return <Navigate to="/unauthorized" replace />;
  return <Outlet />;
};

/* ─── Router ─────────────────────────────────────────────────────────────────── */
const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [

      // ── Routes WITH navbar + footer (Layout) ──────────────────────────────
      {
        path: '/',
        element: <Layout />,
        children: [
          { index: true, element: <PublicOnlyHome /> },

          { path: 'hospital/auth',       element: <HospitalAuth /> },
          { path: 'patientregistration', element: <PatientRegister /> },
          { path: 'superadminlogin',     element: <SuperAdminLogin /> },
          { path: 'verify-email',        element: <VerifyEmail /> },
          { path: 'features',            element: <Features /> },
          { path: 'contact',             element: <Contact /> },
          { path: 'security',            element: <Security /> },
          { path: 'pricing',             element: <Pricing /> },
          {
            path: 'unauthorized',
            element: (
              <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center p-10 bg-red-900/20 rounded-lg border border-red-500">
                  <h1 className="text-2xl font-bold mb-2 text-white">Access Denied</h1>
                  <p className="text-white">You do not have permission to view this page.</p>
                </div>
              </div>
            ),
          },

          { path: '*', element: <Navigate to="/" replace /> },
        
        ],
      },

      // ── Routes WITHOUT navbar + footer ────────────────────────────────────

      { path: 'patientlogin', element: <PatientLogin /> },
      { path: 'stafflogin',   element: <StaffLogin /> },

      // Hospital Admin
      {
        element: <HospitalAuthGuard />,
        children: [
          {
            element: <SubscriptionGuard />,
            children: [
              { path: 'hospitaldashboard', element: <HospitalDashboard /> },
              { path: 'patientmanagement', element: <PatientManagement /> },
            ],
          },
        ],
      },

      // Staff
      {
        element: <StaffAuthGuard />,
        children: [
          { path: 'staffdashboard', element: <StaffDashboard /> },
        ],
      },

      // Super Admin
      {
        element: <SuperAdminGuard />,
        children: [
          { path: 'superadmindashboard', element: <SuperAdminDashboard /> },
        ],
      },

      // Patient
      {
        element: <PatientGuard />,
        children: [
          {
            path: 'patientdashboard',
            element: <PatientDashboardLayout />,
            children: [
              { index: true, element: <PatientDashboard /> },
              { path: 'prescriptions', element: <Prescriptions /> },
            ],
          },
        ],
      },

    ],
  },
]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);