import clientPromise from './mongodb';
import { hashPassword } from './auth-pass';
import { RULES } from './mock-rules';
import { MOCK_CANDIDATES } from './mock-candidates';
import { runInference } from './inference-engine';

export async function seedDatabase() {
  try {
    const client = await clientPromise;
    const db = client.db();

    // 1. Seed Users if empty
    const usersCol = db.collection('users');
    const userCount = await usersCol.countDocuments();
    if (userCount === 0) {
      console.log('Seeding default users...');
      await usersCol.insertMany([
        {
          username: 'admin',
          name: 'Administrator',
          password: hashPassword('adminpassword'),
          role: 'admin',
          createdAt: new Date(),
        },
        {
          username: 'hrd',
          name: 'HR Manager',
          password: hashPassword('hrdpassword'),
          role: 'hr',
          createdAt: new Date(),
        },
      ]);
      console.log('Default users seeded successfully!');
    }

    // 2. Seed Rules if empty
    const rulesCol = db.collection('rules');
    const ruleCount = await rulesCol.countDocuments();
    if (ruleCount === 0) {
      console.log('Seeding default rules from mock-rules...');
      await rulesCol.insertMany(
        RULES.map((rule) => ({
          ...rule,
          createdAt: new Date(),
        }))
      );
      console.log('Default rules seeded successfully!');
    }

    // 3. Seed Candidates if empty
    const candidatesCol = db.collection('candidates');
    const candidateCount = await candidatesCol.countDocuments();
    if (candidateCount === 0) {
      console.log('Seeding default candidates from mock-candidates...');
      const records = MOCK_CANDIDATES.map((cand) => {
        const inferenceResult = runInference(cand.facts);
        return {
          id: cand.id,
          tanggal: cand.tanggal,
          facts: cand.facts,
          result: inferenceResult,
          createdAt: new Date(cand.tanggal + 'T12:00:00Z'),
        };
      });
      await candidatesCol.insertMany(records);
      console.log('Default candidates seeded successfully!');
    }
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}
