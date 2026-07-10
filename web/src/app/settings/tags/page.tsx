import { db } from '@/lib/db/client';
import { tags } from '@/lib/db/schema';
import Link from 'next/link';
import { addTag, deleteTag } from './actions';
import DeleteButton from '@/components/ui/DeleteButton';

export default async function TagsSettingsPage() {
    const allTags = await db.select().from(tags).orderBy(tags.category, tags.name);

    return (
        <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-2 mb-2 text-sm text-navy/60">
                <Link href="/settings" className="hover:text-gold transition-colors">設定</Link>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <span className="font-semibold text-navy">タグマスタ管理</span>
            </div>

            <h1 className="font-serif text-2xl font-bold text-navy flex items-center gap-2">
                <span className="material-symbols-outlined text-[28px] text-gold">sell</span>
                タグ・マスターデータ管理
            </h1>
            <p className="text-sm text-navy/70">
                店舗の特徴やゲストの好みを正規化するためのタグ一覧です。表記揺れを防ぎ、精度の高い検索を実現します。
            </p>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-navy/10">
                <h3 className="text-base font-semibold text-navy mb-4 border-b border-navy/5 pb-2">新規タグを追加</h3>
                <form action={addTag} className="flex flex-col sm:flex-row items-end gap-3">
                    <div className="flex-1 w-full">
                        <label className="block text-xs font-semibold text-navy/60 mb-1.5">タグ名称 <span className="text-red-500">*</span></label>
                        <input type="text" name="name" required placeholder="例: 日本酒豊富, 痛風配慮" className="w-full border border-navy/20 rounded-lg px-3 py-2 text-sm text-navy outline-none focus:ring-2 focus:ring-gold/40" />
                    </div>
                    <div className="flex-1 w-full">
                        <label className="block text-xs font-semibold text-navy/60 mb-1.5">カテゴリ</label>
                        <select name="category" className="w-full border border-navy/20 rounded-lg px-3 py-2 text-sm text-navy outline-none focus:ring-2 focus:ring-gold/40 bg-white">
                            <option value="venue_feature">店舗の特徴 (雰囲気・設備)</option>
                            <option value="food_preference">食事の好み (ジャンル・食材)</option>
                            <option value="health_dietary">健康・禁忌 (アレルギー・宗教)</option>
                            <option value="general">その他 (汎用)</option>
                        </select>
                    </div>
                    <button type="submit" className="w-full sm:w-auto px-6 py-2.5 rounded-lg text-white font-semibold text-sm cursor-pointer whitespace-nowrap bg-navy hover:bg-navy/90 transition-colors">
                        追加する
                    </button>
                </form>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-navy/10">
                <h3 className="text-base font-semibold text-navy mb-4 border-b border-navy/5 pb-2">登録済みのタグ</h3>
                {allTags.length === 0 ? (
                    <div className="py-8 text-center text-sm text-navy/50">タグが登録されていません</div>
                ) : (
                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {allTags.map((tag) => {
                            return (
                                <div key={tag.id} className="flex items-center justify-between p-3 rounded-lg border border-navy/10 bg-slate-50 hover:bg-slate-100 transition-colors group">
                                    <div>
                                        <div className="text-sm font-semibold text-navy">{tag.name}</div>
                                        <div className="text-[10px] text-navy/50 font-medium uppercase tracking-wider">{tag.category}</div>
                                    </div>
                                    <form action={deleteTag.bind(null, tag.id)}>
                                        <DeleteButton message={`「${tag.name}」を削除しますか？`} className="w-8 h-8 rounded-md flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer" title="削除">
                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                        </DeleteButton>
                                    </form>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
