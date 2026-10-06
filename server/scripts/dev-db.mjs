// Starts a local PostgreSQL for development, so nothing has to be installed on the PC.
// Data is kept in server/.pgdata. Stop it with Ctrl+C.
// If you already have PostgreSQL installed, you do not need this script.
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import EmbeddedPostgres from 'embedded-postgres';

const url = new URL(process.env.DATABASE_URL);
const dbName = url.pathname.slice(1);
const dataDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.pgdata');

const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  port: Number(url.port || 5432),
  persistent: true,
  onLog: () => {},
});

const firstRun = !fs.existsSync(path.join(dataDir, 'PG_VERSION'));
if (firstRun) await pg.initialise();
await pg.start();
if (firstRun) await pg.createDatabase(dbName);

console.log(`Database "${dbName}" is running on port ${url.port || 5432}. Press Ctrl+C to stop.`);

async function stop() {
  await pg.stop();
  process.exit(0);
}
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
