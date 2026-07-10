import { db } from '@/lib/db/client';
import { venues, guests, companies } from '@/lib/db/schema';
import { createReservation } from '../actions';
import Link from 'next/link';
import { eq } from 'drizzle-orm';

export default async function NewReservationPage({ searchParams }: { searchParams: Promise<{ venueId?: string, guestId?: string }> }) {
    const { venueId, guestId } = await searchParams;

    const allVenues = await db.select().from(venues).orderBy(venues.name);
    // Fetch all guests with their company info
    const guestListRows = await db
        .select({
            id: guests.id,
            name: guests.name,
            title: guests.title,
            companyName: companies.name,
        })
        .from(guests)
        .leftJoin(companies, eq(guests.companyId, companies.id));

    return (
        <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5">
            <nav className="text-xs text-navy/50 flex items-center gap-1">
                <Link href="/dashboard" className="hover:text-gold">ダッシュボード</Link>
                <span>›</span>
                <span>予定を作成</span>
            </nav>

            <h1 className="font-serif text-xl font-semibold text-navy">
                今後の接待予定を登録
            </h1>

            <form action={createReservation} className="bg-white rounded-xl shadow-sm p-6 space-y-5">
                <div>
                    <label className="block text-xs font-semibold text-navy/60 mb-1.5">利用する店舗 <span className="text-red-500">*</span></label>
                    <select name="venueId" required defaultValue={venueId ?? ''} className="w-full border border-navy/20 rounded-lg px-3 py-2 text-sm text-navy bg-white outline-none focus:ring-2 focus:ring-gold/40">
                        <option value="" disabled>店舗を選択してください</option>
                        {allVenues.map(v => (
                            <option key={v.id} value={v.id}>{v.name} ({v.area} / {v.genre})</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-navy/60 mb-1.5">接待対象のゲスト <span className="text-red-500">*</span></label>
                    <select name="guestId" required defaultValue={guestId ?? ''} className="w-full border border-navy/20 rounded-lg px-3 py-2 text-sm text-navy bg-white outline-none focus:ring-2 focus:ring-gold/40">
                        <option value="" disabled>ゲストを選択してください</option>
                        {guestListRows.map(g => (
                            <option key={g.id} value={g.id}>{g.companyName} - {g.title} {g.name}</option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-navy/60 mb-1.5">日時 <span className="text-red-500">*</span></label>
                        <input type="datetime-local" name="scheduledAt" required className="w-full border border-navy/20 rounded-lg px-3 py-2 text-sm text-navy outline-none focus:ring-2 focus:ring-gold/40" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-navy/60 mb-1.5">参加人数</label>
                        <input type="number" name="headcount" min={1} defaultValue={2} className="w-full border border-navy/20 rounded-lg px-3 py-2 text-sm text-navy outline-none focus:ring-2 focus:ring-gold/40" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label className="block text-xs font-semibold text-navy/60 mb-1.5">接待の目的・用途</label>
                        <select name="purpose" className="w-full border border-navy/20 rounded-lg px-3 py-2 text-sm text-navy bg-white outline-none focus:ring-2 focus:ring-gold/40">
                            <option value="顔合わせ">顔合わせ・ご挨拶</option>
                            <option value="親睦">親睦・キックオフ</option>
                            <option value="クロージング">クロージング（重要）</option>
                            <option value="御礼">御礼・慰労</option>
                            <option value="お詫び">お詫び</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-navy/60 mb-1.5">事前に店舗に伝えておくメモ（アレルギー等）</label>
                    <textarea name="note" rows={3} placeholder="例: エビアレルギーがあるので、コースメニューからの除外を事前連絡済み。" className="w-full border border-navy/20 rounded-lg px-3 py-2 text-sm text-navy resize-y outline-none focus:ring-2 focus:ring-gold/40" />
                </div>

                <div className="flex gap-3 justify-end pt-2">
                    <Link href="/dashboard" className="px-6 py-2.5 rounded-xl border border-navy/20 text-navy font-semibold text-sm hover:bg-navy/5 transition-colors">
                        キャンセル
                    </Link>
                    <button type="submit" className="px-8 py-2.5 rounded-xl text-white font-semibold text-sm cursor-pointer shadow-md" style={{ background: 'linear-gradient(135deg, #c2a15a 0%, #b8944a 100%)' }}>
                        予約予定を登録する
                    </button>
                </div>
            </form>
        </div>
    );
}
