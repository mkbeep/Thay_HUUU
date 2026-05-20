import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../.env') });

import { TableRepository } from '../src/infrastructure/database/repositories/TableRepository';

async function main() {
  const repo = new TableRepository();
  const db = (await import('../src/infrastructure/config/firebase.config')).db;

  console.log('Project:', process.env.FIREBASE_PROJECT_ID);

  const raw = await db.collection('dining_table').get();
  console.log('dining_table count (no orderBy):', raw.size);
  raw.docs.forEach((d) => {
    const data = d.data();
    console.log(' -', d.id, 'number=', data.table_number, 'status=', data.status, 'location=', data.location);
  });

  try {
    const tables = await repo.findAll();
    console.log('\nfindAll() count:', tables.length);
  } catch (e) {
    console.error('\nfindAll() FAILED:', e instanceof Error ? e.message : e);
  }

  try {
    const withSessions = await repo.findAllWithSessions();
    console.log('findAllWithSessions() count:', withSessions.length);
  } catch (e) {
    console.error('findAllWithSessions() FAILED:', e instanceof Error ? e.message : e);
  }

  const sessions = await db.collection('table_session').where('is_active', '==', true).get();
  console.log('\nactive table_session count:', sessions.size);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
