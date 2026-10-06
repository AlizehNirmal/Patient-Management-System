# MediPass (frontend)

MediPass is a personal health record system. A patient's records are usually scattered across
hospitals; MediPass keeps them in one place and lets the patient decide which doctor can see them,
and for how long.

This folder is the React frontend. It talks to the MediPass API (the `server/` folder).

## Features

- Register and log in as a patient or a doctor; each role gets its own dashboard
- Patient profile, allergies and chronic conditions
- Health card with a Health ID and a downloadable QR code
- Consent-based access: a doctor requests access by Health ID, the patient approves it for
  1 hour, 24 hours or 7 days, and can revoke it at any time
- Doctor view of a patient: summary, past visits, add a visit with a prescription, allergy warnings
- Patient timeline of all visits and prescriptions
- Access log showing who viewed or added to the patient's records
- Public emergency card (no login) opened by scanning the QR code
- Admin dashboard: stats and doctor approval

## Tech stack

React 19, Vite, Tailwind CSS 4, React Router 7, Axios, qrcode.react

## Setup

1. Start the backend first (see the server README). It runs on `http://localhost:5000` by default.
2. In this folder:

```
npm install
```

3. Copy `.env.example` to `.env` and check the API address:

```
VITE_API_URL=http://localhost:5000/api
```

4. Run the app:

```
npm run dev
```

Open `http://localhost:5173`.

Other commands: `npm run build` (production build), `npm run lint` (oxlint).

## Folder structure

```
src/
├── api/          axios instance (adds the token, handles expired sessions)
├── components/   shared UI pieces, Navbar, ProtectedRoute, CrudList
├── context/      AuthContext (current user, login, logout)
├── hooks/        useFetch
└── pages/
    ├── auth/     Login, Register
    ├── patient/  AccessRequests, Profile, HealthCard, Timeline, AccessLog
    ├── doctor/   DoctorHome, MyPatients, PatientView
    ├── admin/    AdminDashboard
    └── public/   Emergency
```

## Deployment (Vercel)

- Root directory: `client`
- Environment variable: `VITE_API_URL=https://<your-backend>/api`
- `vercel.json` sends every path to `index.html`, so page refreshes and QR links
  (`/emergency/<token>`) work.
- After deploying, set `CLIENT_URL` on the backend to the Vercel URL (needed for CORS).

## Demo credentials

TODO: add the seed account emails and the shared demo password once the seed script is written.

## Live link

TODO: add after deployment.

## Known limitations and future work

- The login token is stored in `localStorage` for simplicity. A production system would use safer
  storage and refresh tokens.
- Doctors type the Health ID to request access; scanning the QR to fill it in is future work.
- Future work: OTP approval, document upload, break-glass emergency access, FHIR support.
