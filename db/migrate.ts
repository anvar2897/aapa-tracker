// db/migrate.ts
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db } from './index';
import path from 'path';

migrate(db, { migrationsFolder: path.join(process.cwd(), 'db/migrations') });
console.log('Migrations applied successfully');
