import Link from 'next/link';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { updateOffice } from './actions';

export default async function OfficeSettingsPage() {
  const [admin] = await db.select().from(users).where(eq(users.role, 'admin')).limit(1);

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      <nav className="text-xs text-navy/50">
        <Link href="/settings" className="hover:text-gold">設定</Link>
        <span className="mx-1">›</span>
        <span>自社拠点</span>
      </nav>

      <h1 className="font-serif text-xl font-semibold text-navy">自社拠点</h1>
      <p className="text-sm text-navy/60">
        「最適な場所を探す」機能で、自社からの移動コストを計算するために使用します。
      </p>

      <form action={updateOffice} className="bg-white rounded-xl shadow-sm p-5 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-navy/60 mb-1">住所（任意）</label>
          <input
            name="officeAddress"
            type="text"
            defaultValue={admin?.officeAddress ?? ''}
            placeholder="例: 東京都中央区京橋1-1-1"
            className="w-full border border-navy/20 rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold/40"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-navy/60 mb-1">最寄駅（必須：移動コスト計算に使用）</label>
          <input
            name="officeNearestStation"
            type="text"
            defaultValue={admin?.officeNearestStation ?? ''}
            placeholder="例: 京橋"
            className="w-full border border-navy/20 rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold/40"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-navy/60 mb-1">緯度 (lat)（任意・未設定時は概算精度が下がる）</label>
            <input
              name="officeLat"
              type="number"
              step="0.0000001"
              defaultValue={admin?.officeLat ?? ''}
              placeholder="35.6811"
              className="w-full border border-navy/20 rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold/40"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-navy/60 mb-1">経度 (lng)</label>
            <input
              name="officeLng"
              type="number"
              step="0.0000001"
              defaultValue={admin?.officeLng ?? ''}
              placeholder="139.7670"
              className="w-full border border-navy/20 rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold/40"
            />
          </div>
        </div>
        <button
          type="submit"
          className="w-full py-2.5 rounded-xl text-white font-semibold text-sm"
          style={{ background: 'linear-gradient(135deg, #c2a15a 0%, #b8944a 100%)' }}
        >
          保存
        </button>
      </form>
    </div>
  );
}
