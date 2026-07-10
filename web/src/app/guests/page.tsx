import Link from 'next/link';
import { db } from '@/lib/db/client';
import { companies, guests } from '@/lib/db/schema';
import { eq, count } from 'drizzle-orm';
import { deleteCompany } from './actions';
import GuestsList from './GuestsList';

export default async function GuestsPage() {
  const rows = await db
    .select({
      id: companies.id,
      slug: companies.slug,
      name: companies.name,
      nameKana: companies.nameKana,
      industry: companies.industry,
      initial: companies.initial,
      drinkAffiliation: companies.drinkAffiliation,
      memo: companies.memo,
      guestCount: count(guests.id),
    })
    .from(companies)
    .leftJoin(guests, eq(guests.companyId, companies.id))
    .groupBy(companies.id)
    .orderBy(companies.name);

  const guestRows = await db
    .select({
      id: guests.id,
      companyId: guests.companyId,
      companyName: companies.name,
      name: guests.name,
      nameKana: guests.nameKana,
      title: guests.title,
      preferences: guests.preferences,
      ngFoods: guests.ngFoods,
      memo: guests.memo,
    })
    .from(guests)
    .leftJoin(companies, eq(companies.id, guests.companyId))
    .orderBy(guests.name);

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', padding: 'clamp(16px,3vw,36px)' }}>
      <div className="flex items-end gap-3 flex-wrap mb-5">
        <div>
          <h1 className="font-serif font-bold text-[clamp(24px,3vw,32px)] m-0" style={{ color: '#17253f' }}>
            ゲスト管理
          </h1>
          <div className="text-[13.5px] mt-1" style={{ color: '#6f7a8f' }}>
            取引先と担当者の好み・履歴を一元管理
          </div>
        </div>
        <Link
          href="/guests/new"
          className="ml-auto flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13.5px] font-bold"
          style={{ background: '#fff', border: '1px solid #d8bd78', color: '#a37f2b' }}
        >
          <span className="material-symbols-outlined text-[18px]">domain_add</span>
          取引先を追加
        </Link>
      </div>

      <GuestsList rows={rows} guestRows={guestRows} />

      <Link
        href="/guests/new"
        className="flex items-center justify-center gap-2 mt-3 py-4 rounded-[14px] font-bold text-[14.5px]"
        style={{ border: '1.5px dashed #d8bd78', color: '#a37f2b', background: '#fdfaf2' }}
      >
        <span className="material-symbols-outlined text-[20px]">domain_add</span>
        取引先を追加
      </Link>
    </div>
  );
}
