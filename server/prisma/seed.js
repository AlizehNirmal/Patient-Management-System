// Fills the database with demo accounts and sample data.
// Safe to run more than once: accounts that already exist are skipped.
require('dotenv').config();
const bcrypt = require('bcryptjs');
const prisma = require('../src/config/db');

// On a public deployment, set SEED_PASSWORD so the accounts do not use the password written here
const DEMO_PASSWORD = process.env.SEED_PASSWORD || 'Demo@1234';

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10); // same hashing as the register endpoint

  async function createUser(email, role, profile) {
    const existing = await prisma.user.findUnique({
      where: { email },
      include: { patient: true, doctor: true },
    });
    if (existing) return existing;
    return prisma.user.create({
      data: { email, passwordHash, role, ...profile },
      include: { patient: true, doctor: true },
    });
  }

  await createUser('admin@medipass.test', 'ADMIN', {});

  const doctor1 = await createUser('doctor1@medipass.test', 'DOCTOR', {
    doctor: {
      create: {
        fullName: 'Ayesha Khan',
        specialization: 'General Physician',
        licenseNo: 'PMDC-10001',
        hospitalName: 'City Care Hospital',
        verificationStatus: 'APPROVED',
        verifiedAt: new Date(),
      },
    },
  });

  await createUser('doctor2@medipass.test', 'DOCTOR', {
    doctor: {
      create: {
        fullName: 'Bilal Ahmed',
        specialization: 'Cardiologist',
        licenseNo: 'PMDC-10002',
        hospitalName: 'National Heart Centre',
      },
    },
  });

  const patients = [
    {
      email: 'patient1@medipass.test',
      healthId: 'MP-100001',
      fullName: 'Sara Malik',
      dob: new Date('1998-04-12'),
      gender: 'Female',
      phone: '0300-1111111',
      bloodGroup: 'B+',
      address: 'Gulberg, Lahore',
      emergencyContactName: 'Imran Malik',
      emergencyContactPhone: '0300-2222222',
      allergies: [{ allergen: 'Penicillin', reaction: 'Skin rash', severity: 'severe' }],
      conditions: [{ name: 'Asthma', diagnosedOn: new Date('2015-06-01'), status: 'ongoing' }],
    },
    {
      email: 'patient2@medipass.test',
      healthId: 'MP-100002',
      fullName: 'Usman Tariq',
      dob: new Date('1985-11-03'),
      gender: 'Male',
      phone: '0301-3333333',
      bloodGroup: 'O+',
      address: 'Saddar, Karachi',
      emergencyContactName: 'Hina Tariq',
      emergencyContactPhone: '0301-4444444',
      allergies: [{ allergen: 'Aspirin', reaction: 'Breathing difficulty', severity: 'severe' }],
      conditions: [{ name: 'Type 2 diabetes', diagnosedOn: new Date('2019-02-15'), status: 'ongoing' }],
    },
    {
      email: 'patient3@medipass.test',
      healthId: 'MP-100003',
      fullName: 'Fatima Noor',
      dob: new Date('2001-08-25'),
      gender: 'Female',
      phone: '0302-5555555',
      bloodGroup: 'A-',
      address: 'F-8, Islamabad',
      emergencyContactName: 'Noor Ahmed',
      emergencyContactPhone: '0302-6666666',
      allergies: [],
      conditions: [],
    },
  ];

  for (const { email, allergies, conditions, ...profile } of patients) {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) continue;

    const user = await createUser(email, 'PATIENT', {
      patient: {
        create: { ...profile, allergies: { create: allergies }, conditions: { create: conditions } },
      },
    });

    // Give the first patient one past visit so the timeline is not empty
    if (email === 'patient1@medipass.test') {
      await prisma.medicalRecord.create({
        data: {
          patientId: user.patient.id,
          doctorId: doctor1.doctor.id,
          hospitalName: doctor1.doctor.hospitalName,
          visitDate: new Date('2026-09-20'),
          chiefComplaint: 'Fever and sore throat for three days',
          diagnosis: 'Viral throat infection',
          notes: 'Rest and plenty of fluids.',
          prescriptions: {
            create: {
              items: {
                create: [
                  { medicineName: 'Paracetamol', dosage: '500mg', frequency: '3x daily', durationDays: 5, instructions: 'After meals' },
                ],
              },
            },
          },
        },
      });
    }
  }

  console.log('Seed finished. Demo accounts:');
  console.log('  admin@medipass.test');
  console.log('  doctor1@medipass.test (approved), doctor2@medipass.test (pending)');
  console.log('  patient1@medipass.test, patient2@medipass.test, patient3@medipass.test');
  console.log(`  Password for all of them: ${DEMO_PASSWORD}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
