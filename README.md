# MediPass: Patient Management System

A full-stack personal health record system. Patients keep their medical records in one place and
decide which doctor can see them, and for how long. Every access is logged.

- `server/` — the API (Node, Express, PostgreSQL, Prisma)
- `client/` — the website (React, Vite, Tailwind)

## Run it on your computer

You need **Node.js** (LTS) installed. Nothing else.

### First time only

Open a terminal in the `server` folder:

```
npm install
```

Copy `server/.env.example` to `server/.env`. Change `JWT_SECRET` to any long random text.

Open a terminal in the `client` folder:

```
npm install
```

Copy `client/.env.example` to `client/.env`.

### Every time (three terminals)

**Terminal 1, the database** (in `server`). Leave it running:

```
npm run db
```

This starts a local PostgreSQL that lives in `server/.pgdata`. If you have your own PostgreSQL
installed, skip this and put its password in `DATABASE_URL` in `server/.env`.

**Terminal 2, the API** (in `server`):

```
npx prisma migrate deploy
npm run seed
npm run dev
```

The first two lines create the tables and the demo accounts. They are only needed the first time,
but running them again does no harm. The API runs on `http://localhost:5000`.

**Terminal 3, the website** (in `client`):

```
npm run dev
```

Open `http://localhost:5173`.

## Demo accounts

Created by `npm run seed`. All use the password `Demo@1234`.

| Role | Email |
|---|---|
| Admin | `admin@medipass.test` |
| Doctor (approved) | `doctor1@medipass.test` |
| Doctor (waiting for approval) | `doctor2@medipass.test` |
| Patient (Health ID MP-100001) | `patient1@medipass.test` |
| Patient (Health ID MP-100002) | `patient2@medipass.test` |
| Patient (Health ID MP-100003) | `patient3@medipass.test` |

These are for local demos only. Do not use this password on a public deployment.

## Try the main flow

1. Log in as `doctor1`, enter Health ID `MP-100001`, send a request.
2. Log in as `patient1` (another browser or a private window), approve it for 1 hour.
3. As the doctor, open **My patients**, open the record, add a visit. Prescribe "Penicillin" to see
   the allergy warning.
4. As the patient, check **Timeline** and **Access log**, then revoke access.
5. As the doctor, refresh: access is blocked.
6. As the patient, open **Health card** and scan the QR, or open the emergency page in a private window.

## API overview

| Area | Routes |
|---|---|
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` |
| Patient | `/api/patients/me` (profile, allergies, conditions, emergency-card, records, logs) |
| Consent | `/api/access/request`, `/requests`, `/active`, `/:id/approve`, `/:id/deny`, `/:id/revoke` |
| Doctor | `/api/doctors/patients/:healthId/summary`, `/records` |
| Admin | `/api/admin/doctors`, `/doctors/:id/verify`, `/stats` |
| Emergency | `GET /api/emergency/:qrToken` (public) |

Doctor routes go through this chain on every request:
`authenticate -> requireRole('DOCTOR') -> loadApprovedDoctor -> hasActiveGrant -> route`

## Security notes

- Passwords are hashed with bcrypt. Login and register are rate-limited.
- Every protected route checks the role on the server, and patient routes only ever touch the
  logged-in patient's own data.
- A doctor needs an approved, unexpired grant on every request. Expiry is checked each time.
- The access log has no update or delete route. Medical records have no delete route.
- Known limitation: the login token is kept in the browser's `localStorage` for simplicity.

## Future work

OTP approval, document upload, break-glass emergency access, FHIR support.
