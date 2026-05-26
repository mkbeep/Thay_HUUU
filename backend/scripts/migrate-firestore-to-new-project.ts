/**
 * Migrate Firestore data from the project in backend/.env to a new Firebase project.
 *
 * Usage:
 *   npx ts-node scripts/migrate-firestore-to-new-project.ts --target ../serviceAccountKey.json --clear-target
 */

import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

type Args = {
  sourceEnv: string;
  target?: string;
  clearTarget: boolean;
  collections?: string[];
};

const parseArgs = (): Args => {
  const args = process.argv.slice(2);
  const parsed: Args = {
    sourceEnv: path.join(__dirname, '../.env'),
    clearTarget: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--target') {
      parsed.target = args[index + 1];
      index += 1;
      continue;
    }

    if (arg === '--source-env') {
      parsed.sourceEnv = path.isAbsolute(args[index + 1])
        ? args[index + 1]
        : path.resolve(process.cwd(), args[index + 1]);
      index += 1;
      continue;
    }

    if (arg === '--clear-target') {
      parsed.clearTarget = true;
      continue;
    }

    if (arg === '--collections') {
      parsed.collections = args[index + 1]
        ?.split(',')
        .map((collection) => collection.trim())
        .filter(Boolean);
      index += 1;
    }
  }

  return parsed;
};

const getSourceCredential = (): admin.ServiceAccount => ({
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
});

const loadServiceAccount = (serviceAccountPath: string): admin.ServiceAccount => {
  const absolutePath = path.isAbsolute(serviceAccountPath)
    ? serviceAccountPath
    : path.resolve(process.cwd(), serviceAccountPath);
  const raw = JSON.parse(fs.readFileSync(absolutePath, 'utf-8'));

  return {
    projectId: raw.project_id,
    privateKey: raw.private_key,
    clientEmail: raw.client_email,
  };
};

const commitBatch = async (
  db: FirebaseFirestore.Firestore,
  writes: Array<(batch: FirebaseFirestore.WriteBatch) => void>,
) => {
  if (writes.length === 0) {
    return;
  }

  const batch = db.batch();
  writes.forEach((write) => write(batch));
  await batch.commit();
};

const clearCollection = async (
  db: FirebaseFirestore.Firestore,
  collectionPath: string,
): Promise<number> => {
  let deleted = 0;

  while (true) {
    const snapshot = await db.collection(collectionPath).limit(400).get();

    if (snapshot.empty) {
      break;
    }

    const writes = snapshot.docs.map((doc) => (batch: FirebaseFirestore.WriteBatch) => {
      batch.delete(doc.ref);
    });

    await commitBatch(db, writes);
    deleted += snapshot.size;
  }

  return deleted;
};

const copyDocument = async (
  sourceDoc: FirebaseFirestore.DocumentSnapshot,
  targetDoc: FirebaseFirestore.DocumentReference,
): Promise<number> => {
  if (!sourceDoc.exists) {
    return 0;
  }

  await targetDoc.set(sourceDoc.data() ?? {});

  let copied = 1;
  const subcollections = await sourceDoc.ref.listCollections();

  for (const subcollection of subcollections) {
    copied += await copyCollection(subcollection, targetDoc.collection(subcollection.id));
  }

  return copied;
};

const copyCollection = async (
  sourceCollection: FirebaseFirestore.CollectionReference,
  targetCollection: FirebaseFirestore.CollectionReference,
): Promise<number> => {
  let copied = 0;
  let lastDoc: FirebaseFirestore.QueryDocumentSnapshot | undefined;

  while (true) {
    let query = sourceCollection.orderBy(admin.firestore.FieldPath.documentId()).limit(250);

    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }

    const snapshot = await query.get();

    if (snapshot.empty) {
      break;
    }

    for (const doc of snapshot.docs) {
      copied += await copyDocument(doc, targetCollection.doc(doc.id));
    }

    lastDoc = snapshot.docs[snapshot.docs.length - 1];
  }

  return copied;
};

const main = async () => {
  const args = parseArgs();
  dotenv.config({ path: args.sourceEnv });

  if (!args.target) {
    throw new Error('Missing --target <service-account-json-path>');
  }

  const sourceApp = admin.initializeApp(
    {
      credential: admin.credential.cert(getSourceCredential()),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    },
    'source',
  );

  const targetServiceAccount = loadServiceAccount(args.target);
  const targetApp = admin.initializeApp(
    {
      credential: admin.credential.cert(targetServiceAccount),
      databaseURL: `https://${targetServiceAccount.projectId}.firebaseio.com`,
    },
    'target',
  );

  const sourceDb = sourceApp.firestore();
  const targetDb = targetApp.firestore();

  sourceDb.settings({ ignoreUndefinedProperties: true });
  targetDb.settings({ ignoreUndefinedProperties: true });

  const sourceCollections = args.collections?.length
    ? args.collections.map((collectionName) => sourceDb.collection(collectionName))
    : await sourceDb.listCollections();

  console.log(`Source project: ${process.env.FIREBASE_PROJECT_ID}`);
  console.log(`Target project: ${targetServiceAccount.projectId}`);
  console.log(`Collections: ${sourceCollections.map((collection) => collection.id).join(', ')}`);

  const summary: Array<{ collection: string; sourceCount: number; deleted: number; copied: number }> = [];

  for (const sourceCollection of sourceCollections) {
    const collectionName = sourceCollection.id;
    let sourceCount = -1;

    try {
      const countSnapshot = await sourceCollection.count().get();
      sourceCount = countSnapshot.data().count;
    } catch (error) {
      console.warn(`Could not count ${collectionName}; continuing with document copy.`);
    }
    let deleted = 0;

    if (args.clearTarget) {
      deleted = await clearCollection(targetDb, collectionName);
    }

    const copied = await copyCollection(sourceCollection, targetDb.collection(collectionName));
    summary.push({ collection: collectionName, sourceCount, deleted, copied });
    console.log(`Synced ${collectionName}: source=${sourceCount}, deleted=${deleted}, copied=${copied}`);
  }

  console.log('\nMigration summary');
  for (const row of summary) {
    console.log(`${row.collection}: source=${row.sourceCount}, targetCopied=${row.copied}`);
  }

  await Promise.all([sourceApp.delete(), targetApp.delete()]);
};

main().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
