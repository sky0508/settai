import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db/client';
import { companies, tags as tagsTable } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { addGuestToCompany } from './actions';

export default async function NewPersonPage({
    params,
}: {
    params: Promise<{ companyId: string }>;
}) {
    const { companyId } = await params;

    const [company] = await db
        .select()
        .from(companies)
        .where(eq(companies.slug, companyId))
        .limit(1);

    if (!company) notFound();

    const allTags = await db.select().from(tagsTable);

    const actionBound = addGuestToCompany.bind(null, companyId);

    return (
        <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5">
            <nav className="text-xs text-navy/50 flex items-center gap-1">
                <Link href="/guests" className="hover:text-gold">ゲスト管理</Link>
                <span>›</span>
                <Link href={`/guests/${companyId}`} className="hover:text-gold">{company.name}</Link>
                <span>›</span>
                <span>担当者を追加</span>
            </nav>

            <h1 className="font-serif text-xl font-semibold text-navy">
                {company.name}に担当者を追加
            </h1>

            <form action={actionBound} className="bg-white rounded-xl shadow-sm p-6 space-y-5">
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-semibold text-navy/60 mb-1.5">氏名 (必須)</label>
                        <input
                            type="text"
                            name="name"
                            required
                            placeholder="例: 田中 一郎"
                            className="w-full border border-navy/20 rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold/40"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-navy/60 mb-1.5">役職 (必須)</label>
                        <input
                            type="text"
                            name="title"
                            required
                            placeholder="例: 課長 / 担当"
                            className="w-full border border-navy/20 rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold/40"
                        />
                    </div>
                </div>

                {/* 嗜好性・タグ */}
                <div className="space-y-4 border-t pt-4 border-navy/10 mt-4">
                    <h3 className="text-sm font-bold text-navy/80">嗜好性・NG</h3>

                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold text-navy/60">好きなもの・お店の好み（タグ）</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {allTags.filter(t => t.category !== 'アレルギー' && t.category !== 'NG').map(tag => (
                                <label key={`pref-${tag.id}`} className="flex items-center gap-1.5 text-xs text-navy bg-slate-50 px-2 py-1 rounded border border-navy/10 cursor-pointer hover:border-gold">
                                    <input type="checkbox" name="preferences" value={tag.name} className="accent-gold w-3.5 h-3.5" />
                                    <span>{tag.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold text-navy/60">NG食材・嫌いなもの（タグ）</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {allTags.map(tag => (
                                <label key={`ng-${tag.id}`} className="flex items-center gap-1.5 text-xs text-navy bg-slate-50 px-2 py-1 rounded border border-navy/10 cursor-pointer hover:border-gold">
                                    <input type="checkbox" name="ngFoods" value={tag.name} className="accent-gold w-3.5 h-3.5" />
                                    <span>{tag.name}</span>
                                </label>
                            ))}
                        </div>
                        <input type="text" name="ngFoodsCustom" placeholder="その他のNG（カンマ区切り）" className="w-full border border-navy/20 rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold/40" />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-navy/60 mb-1.5">アレルギー (カンマ区切り)</label>
                        <input type="text" name="allergies" placeholder="例: エビ, カニ" className="w-full border border-navy/20 rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold/40" />
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
                    <div>
                        <label className="block text-xs font-semibold text-navy/60 mb-1.5">アルコール</label>
                        <select name="alcohol" className="w-full border border-navy/20 rounded-lg px-3 py-2 text-sm text-navy focus:outline-none bg-white focus:ring-2 focus:ring-gold/40">
                            <option value="">不明</option>
                            <option value="下戸">下戸（飲めない）</option>
                            <option value="ビール">ビール党</option>
                            <option value="日本酒">日本酒フリーク</option>
                            <option value="ワイン">ワイン好き</option>
                            <option value="焼酎">焼酎</option>
                            <option value="不問">なんでも可</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-navy/60 mb-1.5">宗教・禁忌食</label>
                        <select name="dietary" className="w-full border border-navy/20 rounded-lg px-3 py-2 text-sm text-navy focus:outline-none bg-white focus:ring-2 focus:ring-gold/40">
                            <option value="">特になし</option>
                            <option value="halal">ハラール</option>
                            <option value="vegetarian">ベジタリアン</option>
                            <option value="vegan">ヴィーガン</option>
                            <option value="kosher">コーシャ</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-navy/60 mb-1.5">健康上の配慮</label>
                        <input type="text" name="healthNotes" placeholder="例: 糖質制限, 痛風" className="w-full border border-navy/20 rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold/40" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-navy/60 mb-1.5">出身地・ゆかり</label>
                        <input type="text" name="origin" placeholder="例: 北海道" className="w-full border border-navy/20 rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold/40" />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-navy/60 mb-1.5">好み・アレルギー・メモ</label>
                    <textarea
                        name="memo"
                        rows={4}
                        placeholder="例: ワイン好き、焼き魚が得意。アレルギーは特になし..."
                        className="w-full border border-navy/20 rounded-lg px-3 py-2 text-sm text-navy resize-none focus:outline-none focus:ring-2 focus:ring-gold/40"
                    />
                </div>

                <div className="flex gap-3 pt-2">
                    <Link
                        href={`/guests/${companyId}`}
                        className="flex-1 py-3 border border-navy/20 rounded-xl text-center text-navy font-semibold text-sm hover:bg-navy/5 transition-colors"
                    >
                        キャンセル
                    </Link>
                    <button
                        type="submit"
                        className="flex-1 py-3 rounded-xl text-white font-semibold text-sm cursor-pointer"
                        style={{ background: 'linear-gradient(135deg, #c2a15a 0%, #b8944a 100%)' }}
                    >
                        担当者を追加する
                    </button>
                </div>
            </form>
        </div>
    );
}
