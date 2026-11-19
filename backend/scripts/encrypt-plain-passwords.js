/**
 * One-time migration: moves each student's legacy plain-text `plainPassword` into the
 * encrypted `passwordEnc` field and removes the plain copy. Admins keep seeing the same
 * password in the panel; it just isn't readable in the database any more.
 *
 * Usage (from backend/, with the production .env):
 *   node scripts/encrypt-plain-passwords.js           # dry run, only counts
 *   node scripts/encrypt-plain-passwords.js --apply   # encrypts and removes plain copies
 */
import '../src/config/env.js';
import mongoose from 'mongoose';
import { encryptPassword, decryptPassword } from '../src/utils/passwordVault.js';

const apply = process.argv.includes('--apply');

const run = async () => {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not set');
  await mongoose.connect(process.env.MONGODB_URI);
  const students = mongoose.connection.db.collection('students');

  const cursor = students.find(
    { plainPassword: { $exists: true } },
    { projection: { _id: 1, plainPassword: 1, passwordEnc: 1 } }
  );

  let found = 0;
  let migrated = 0;
  for await (const doc of cursor) {
    found += 1;
    if (!apply) continue;

    const update = { $unset: { plainPassword: '' } };
    // Keep an existing encrypted value (it is newer); otherwise encrypt the legacy one
    if (doc.plainPassword && !decryptPassword(doc.passwordEnc)) {
      update.$set = { passwordEnc: encryptPassword(doc.plainPassword) };
    }
    await students.updateOne({ _id: doc._id }, update);
    migrated += 1;
  }

  console.log(`Students with a plain-text password: ${found}`);
  console.log(apply ? `Encrypted and removed plain copies: ${migrated}` : 'Dry run only. Re-run with --apply.');
  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error(err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
