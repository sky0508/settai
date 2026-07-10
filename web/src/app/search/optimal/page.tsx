import { db } from '@/lib/db/client';
import { users, companies } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import OptimalClient from './OptimalClient';

export default async function OptimalVenuePage() {
  const [admin] = await db.select().from(users).where(eq(users.role, 'admin')).limit(1);
  const allCompanies = await db
    .select({ id: companies.id, name: companies.name, nearestStation: companies.nearestStation })
    .from(companies)
    .orderBy(companies.name);

  const officeReady = !!admin?.officeNearestStation;

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <h1 className="font-serif text-2xl font-semibold text-navy mb-2">最適な場所を探す</h1>
      <p className="text-sm text-navy/50 mb-5">参加企業を追加すると、全員の移動コストが小さい店舗から順に表示します。</p>
      <OptimalClient officeReady={officeReady} allCompanies={allCompanies} />
    </div>
  );
}
