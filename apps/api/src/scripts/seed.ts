import 'reflect-metadata';
import { loadConfig } from '../config/app-config.js';
import { loadRootEnvFile } from '../config/env-file.js';
import { PrismaService } from '../database/prisma.service.js';
import { generateSeedEvents } from '../seed/generate-seed-events.js';
import { reseedAuditEvents } from '../seed/reseed-audit-events.js';

/** `pnpm db:seed`: replaces all audit events with deterministic demo data. Development only. */
loadRootEnvFile();
const config = loadConfig(process.env);

if (config.nodeEnv === 'production') {
  console.error('Refusing to seed: NODE_ENV is production. Seeding deletes every audit event.');
  process.exit(1);
}

const prisma = new PrismaService(config);
try {
  const events = generateSeedEvents({ now: new Date() });
  const inserted = await reseedAuditEvents(prisma, events);

  const database = new URL(config.databaseUrl).pathname.slice(1);
  const byType = Object.entries(
    events.reduce<Record<string, number>>((counts, event) => {
      counts[event.eventType] = (counts[event.eventType] ?? 0) + 1;
      return counts;
    }, {}),
  )
    .sort(([, a], [, b]) => b - a)
    .map(([type, count]) => `${type} ${count}`)
    .join(', ');

  console.log(`Reset audit_events in "${database}" and inserted ${inserted} demo events.`);
  console.log(`By event type: ${byType}`);
} finally {
  await prisma.$disconnect();
}
