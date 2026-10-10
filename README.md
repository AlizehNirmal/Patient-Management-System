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
| Patient (Health ID MP-100004) | `patient4@medipass.test` |
| Patient (Health ID MP-100005) | `patient5@medipass.test` |
| Patient (Health ID MP-100006) | `patient6@medipass.test` |

These are for local demos only. Do not use this password on a public deployment.

## Try the main flow

1. Log in as `doctor1`, enter Health ID `MP-100001`, send a request.
2. Log in as `patient1` (another browser or a private window), approve it for 1 hour.
3. As the doctor, open **My patients**, open the record, add a visit. Prescribe "Penicillin" to see
   the allergy warning.
4. As the patient, check **Timeline** and **Access log**, then revoke access.
5. As the doctor, refresh: access is blocked.
6. As the patient, open **Health card** and scan the QR, or open the emergency page in a private window.
7. As the patient, open **Documents** and upload a report (PDF, JPG or PNG, up to 5 MB). A doctor
   with active access sees it on the patient's page.
8. As the patient, open **Timeline** and click **Download health summary (PDF)**.

## API overview

| Area | Routes |
|---|---|
| Auth | `POST /api/auth/send-code`, `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` |
| Patient | `/api/patients/me` (profile, allergies, conditions, documents, emergency-card, records, logs) |
| Consent | `/api/access/request`, `/requests`, `/active`, `/:id/approve`, `/:id/deny`, `/:id/revoke` |
| Doctor | `/api/doctors/patients/:healthId/summary`, `/records`, `/documents` |
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

OTP approval, break-glass emergency access, FHIR support.

## Deployment

| Part | Service | Settings |
|---|---|---|
| Database | Neon | Create a project and copy the connection string |
| API | Render (Web Service) | Root directory `server`. Build: `npm install && npx prisma migrate deploy`. Start: `npm start`. |
| Website | Vercel | Root directory `client`. Framework: Vite. |

Environment variables on Render: `DATABASE_URL` (from Neon), `JWT_SECRET` (long random text),
`CLIENT_URL` (the Vercel address, no slash at the end), and `SEED_PASSWORD` (your own password for
the demo accounts). Environment variable on Vercel: `VITE_API_URL` = the Render address followed by `/api`.

To create the demo accounts on the hosted database, run `npm run seed` once from the Render shell,
or from your PC with `DATABASE_URL` and `SEED_PASSWORD` set to the hosted values.

Uploaded documents are stored inside the database, so no separate file storage is needed.

### Email verification codes

A new user must type a 6-digit code that is emailed to them before the account is created.
Emails are sent through Brevo (brevo.com, free plan). On Render add two more environment variables:
`BREVO_API_KEY` (from Brevo, under SMTP & API, API keys) and `MAIL_FROM` (the sender email you
verified in Brevo). On your own PC leave them empty: the code is printed in the API terminal instead.
