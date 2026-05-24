import { db } from '../src/infrastructure/config/firebase.config';

const defaultCollections = ['tables', 'order_items', 'payment', 'inventory'];

function getArgValue(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

async function main() {
  const confirm = process.argv.includes('--confirm');
  const requested = getArgValue('collections');
  const collections = requested
    ? requested.split(',').map((name) => name.trim()).filter(Boolean)
    : defaultCollections;

  console.log('Candidate unused collections:', collections.join(', '));
  if (!confirm) {
    console.log('Dry run only. Add --confirm to delete these collections.');
  }

  for (const name of collections) {
    const ref = db.collection(name);
    const snapshot = await ref.limit(5).get();
    console.log(`- ${name}: ${snapshot.empty ? 'empty/not found' : `has documents, sample ${snapshot.size}`}`);

    if (confirm && !snapshot.empty) {
      await (db as any).recursiveDelete(ref);
      console.log(`  deleted ${name}`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Cleanup failed:', error);
    process.exit(1);
  });
