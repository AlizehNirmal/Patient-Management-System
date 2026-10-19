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
    {
      email: 'patient4@medipass.test',
      healthId: 'MP-100004',
      fullName: 'Ahmed Raza',
      dob: new Date('1972-01-18'),
      gender: 'Male',
      phone: '0303-7777777',
      bloodGroup: 'AB+',
      address: 'Model Town, Lahore',
      emergencyContactName: 'Zainab Raza',
      emergencyContactPhone: '0303-8888888',
      allergies: [{ allergen: 'Ibuprofen', reaction: 'Stomach pain', severity: 'mild' }],
      conditions: [
        { name: 'High blood pressure', diagnosedOn: new Date('2012-09-10'), status: 'ongoing' },
        { name: 'High cholesterol', diagnosedOn: new Date('2018-03-22'), status: 'ongoing' },
      ],
    },
    {
      email: 'patient5@medipass.test',
      healthId: 'MP-100005',
      fullName: 'Maryam Siddiqui',
      dob: new Date('1993-06-30'),
      gender: 'Female',
      phone: '0304-1212121',
      bloodGroup: 'O-',
      address: 'Hayatabad, Peshawar',
      emergencyContactName: 'Kamran Siddiqui',
      emergencyContactPhone: '0304-3434343',
      allergies: [
        { allergen: 'Sulfa', reaction: 'Swelling of the face', severity: 'severe' },
        { allergen: 'Peanuts', reaction: 'Hives', severity: 'mild' },
      ],
      conditions: [{ name: 'Migraine', diagnosedOn: new Date('2020-11-05'), status: 'ongoing' }],
    },
    {
      email: 'patient6@medipass.test',
      healthId: 'MP-100006',
      fullName: 'Hamza Sheikh',
      dob: new Date('2008-12-09'),
      gender: 'Male',
      phone: '0305-5656565',
      bloodGroup: 'A+',
      address: 'Cantt, Multan',
      emergencyContactName: 'Rabia Sheikh',
      emergencyContactPhone: '0305-7878787',
      allergies: [{ allergen: 'Amoxicillin', reaction: 'Skin rash', severity: 'mild' }],
      conditions: [{ name: 'Type 1 diabetes', diagnosedOn: new Date('2016-04-14'), status: 'ongoing' }],
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
  console.log('  patient1@medipass.test to patient6@medipass.test (Health IDs MP-100001 to MP-100006)');
  console.log(`  Password for all of them: ${DEMO_PASSWORD}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
