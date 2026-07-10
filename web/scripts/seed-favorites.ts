import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, and } from 'drizzle-orm';
import { favorites, users, venues } from '../src/lib/db/schema';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function main() {
  const [adminUser] = await db.select().from(users).where(eq(users.role, 'admin')).limit(1);
  if (!adminUser) {
    console.error('No admin user found. Run the main seed first.');
    process.exit(1);
  }

  console.log(`▶ seeding favorites for user: ${adminUser.email}`);

  const allVenues = await db.select({ id: venues.id, name: venues.name }).from(venues);

  for (const venue of allVenues) {
    const existing = await db.select().from(favorites)
      .where(and(eq(favorites.userId, adminUser.id), eq(favorites.venueId, venue.id)))
      .limit(1);

    if (existing.length > 0) {
      console.log(`  skip (already favorited): ${venue.name}`);
      continue;
    }

    await db.insert(favorites).values({ userId: adminUser.id, venueId: venue.id });
    console.log(`  added: ${venue.name}`);
  }

  console.log('✓ done');
}

main().catch(console.error);
