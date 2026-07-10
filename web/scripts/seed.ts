import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import { venues, brandRules } from '../src/lib/db/schema';
import kyobashiSeed from '../../data/venues.seed.json';
import ginzaSeed from '../../data/venues.ginza.seed.json';
import brandRulesSeed from '../../data/brand-rules.seed.json';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

// 京橋/八重洲/日本橋 30件 + 銀座 20件 = 50件（ginza は _flag 等の追加キーがあるが下で明示マップするので無視される）
const venuesSeed = [...kyobashiSeed, ...(ginzaSeed as typeof kyobashiSeed)];

async function seed() {
  console.log(`▶ seeding venues... (${venuesSeed.length}件)`);
  for (const v of venuesSeed) {
    const existing = await db.select().from(venues)
      .where(eq(venues.slug, v.slug))
      .limit(1);
    if (existing.length > 0) {
      console.log(`  skip: ${v.slug}`);
      continue;
    }
    await db.insert(venues).values({
      slug: v.slug,
      name: v.name,
      genre: v.genre,
      area: v.area,
      address: v.address,
      nearestStation: v.nearestStation,
      walkMinutes: v.walkMinutes,
      budgetMin: v.budgetMin,
      budgetMax: v.budgetMax,
      photoUrl: v.photoUrl ?? null,
      websiteUrl: v.websiteUrl ?? null,
      phone: v.phone ?? null,
      formalityGrade: v.formalityGrade,
      privateRoomType: v.privateRoomType,
      privateRoomNote: v.privateRoomNote ?? null,
      beerAffiliation: v.beerAffiliation,
      beerConfidence: v.beerConfidence,
      beerSourceUrl: v.beerSourceUrl ?? null,
      tags: v.tags ?? [],
      requiresReservation: v.requiresReservation ?? false,
      curationNote: v.curationNote ?? null,
      source: v.source,
    });
    console.log(`  inserted: ${v.slug}`);
  }

  console.log('▶ seeding brand_rules...');
  const existingCount = await db.select().from(brandRules);
  if (existingCount.length >= brandRulesSeed.length) {
    console.log(`  skip: brand_rules already seeded (${existingCount.length} rows)`);
  } else {
    await db.delete(brandRules);
    for (const r of brandRulesSeed) {
      await db.insert(brandRules).values({
        company: r.company,
        affiliation: r.affiliation,
        effect: r.effect,
        label: r.label,
      });
      console.log(`  inserted: ${r.company} / ${r.affiliation}`);
    }
  }

  console.log('✅ seed complete');
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
