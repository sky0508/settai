import { addVenue } from '../actions';
import Link from 'next/link';
import { db } from '@/lib/db/client';
import { tags as tagsTable } from '@/lib/db/schema';
import VenueFormAutofill from './VenueFormAutofill';

export default async function NewVenuePage() {
    const allTags = await db.select().from(tagsTable).orderBy(tagsTable.category, tagsTable.name);
    return (
        <div style={{ maxWidth: 800, margin: '0 auto', padding: 'clamp(18px,2.8vw,36px)' }}>
            {/* パンくず */}
            <nav className="text-xs text-navy/50 mb-4 flex items-center gap-1">
                <Link href="/search" className="hover:text-gold">お店を探す</Link>
                <span>›</span>
                <span className="font-medium text-navy/70">新しい店舗を登録</span>
            </nav>

            <h1 className="font-serif font-bold text-[clamp(24px,3vw,32px)] m-0 mb-1" style={{ color: '#14233f' }}>
                店舗を新規登録する
            </h1>
            <div className="w-14 h-[3px] rounded mb-7" style={{ background: '#c2a15a' }} />

            <form
                action={addVenue}
                className="flex flex-col gap-6 p-[clamp(20px,2.6vw,32px)]"
                style={{
                    background: '#fff',
                    border: '1px solid #eee6d8',
                    borderRadius: 18,
                    boxShadow: '0 10px 30px rgba(20,35,63,0.06)',
                }}
            >
                {/* Google Places 自動入力 */}
                <VenueFormAutofill />

                {/* 基本情報セクション */}
                <div>
                    <h3 className="text-[15px] font-bold mb-3 pb-1.5" style={{ color: '#14233f', borderBottom: '1px solid #f0ece3' }}>
                        基本情報
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[13px] font-bold text-navy/70">店舗名 <span className="text-red-500">*</span></label>
                            <input type="text" name="name" required className="w-full border border-[#dfe3ea] focus:border-[#c2a15a] rounded-xl px-4 py-2.5 text-[14px] outline-none" placeholder="例：日本料理 ゆかり" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[13px] font-bold text-navy/70">ジャンル <span className="text-red-500">*</span></label>
                            <input type="text" name="genre" required className="w-full border border-[#dfe3ea] focus:border-[#c2a15a] rounded-xl px-4 py-2.5 text-[14px] outline-none" placeholder="例：日本料理、懐石、焼肉" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[13px] font-bold text-navy/70">エリア <span className="text-red-500">*</span></label>
                            <input type="text" name="area" required className="w-full border border-[#dfe3ea] focus:border-[#c2a15a] rounded-xl px-4 py-2.5 text-[14px] outline-none" placeholder="例：日本橋、京橋" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[13px] font-bold text-navy/70">住所 <span className="text-red-500">*</span></label>
                            <input type="text" name="address" required className="w-full border border-[#dfe3ea] focus:border-[#c2a15a] rounded-xl px-4 py-2.5 text-[14px] outline-none" placeholder="例：東京都中央区京橋1-2-3" />
                        </div>
                    </div>
                </div>

                {/* 立地・予約セクション */}
                <div>
                    <h3 className="text-[15px] font-bold mb-3 pb-1.5" style={{ color: '#14233f', borderBottom: '1px solid #f0ece3' }}>
                        アクセス・予算・予約
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[13px] font-bold text-navy/70">最寄駅</label>
                            <input type="text" name="nearestStation" className="w-full border border-[#dfe3ea] focus:border-[#c2a15a] rounded-xl px-4 py-2.5 text-[14px] outline-none" placeholder="例：東京、京橋" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[13px] font-bold text-navy/70">緯度 (lat) / 経度 (lng)</label>
                            <div className="flex gap-2">
                                <input type="number" step="0.0000001" name="lat" className="w-full border border-[#dfe3ea] focus:border-[#c2a15a] rounded-xl px-4 py-2.5 text-[14px] outline-none" placeholder="35.6811" />
                                <input type="number" step="0.0000001" name="lng" className="w-full border border-[#dfe3ea] focus:border-[#c2a15a] rounded-xl px-4 py-2.5 text-[14px] outline-none" placeholder="139.7670" />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[13px] font-bold text-navy/70">徒歩分数 (分)</label>
                            <input type="number" name="walkMinutes" min={0} defaultValue={5} className="w-full border border-[#dfe3ea] focus:border-[#c2a15a] rounded-xl px-4 py-2.5 text-[14px] outline-none" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[13px] font-bold text-navy/70">最小予算 (円)</label>
                            <input type="number" name="budgetMin" min={0} defaultValue={10000} className="w-full border border-[#dfe3ea] focus:border-[#c2a15a] rounded-xl px-4 py-2.5 text-[14px] outline-none" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[13px] font-bold text-navy/70">最大予算 (円)</label>
                            <input type="number" name="budgetMax" min={0} defaultValue={15000} className="w-full border border-[#dfe3ea] focus:border-[#c2a15a] rounded-xl px-4 py-2.5 text-[14px] outline-none" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[13px] font-bold text-navy/70">公式サイトURL</label>
                            <input type="url" name="websiteUrl" className="w-full border border-[#dfe3ea] focus:border-[#c2a15a] rounded-xl px-4 py-2.5 text-[14px] outline-none" placeholder="https://example.com" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[13px] font-bold text-navy/70">電話番号</label>
                            <input type="tel" name="phone" className="w-full border border-[#dfe3ea] focus:border-[#c2a15a] rounded-xl px-4 py-2.5 text-[14px] outline-none" placeholder="例：03-1234-5678" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[13px] font-bold text-navy/70">予約の要否</label>
                            <select name="requiresReservation" className="w-full border border-[#dfe3ea] focus:border-[#c2a15a] rounded-xl px-4 py-2.5 text-[14px] outline-none bg-white">
                                <option value="true">必須（要予約）</option>
                                <option value="false">不要（予約なし可）</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* マナー・個室セクション */}
                <div>
                    <h3 className="text-[15px] font-bold mb-3 pb-1.5" style={{ color: '#14233f', borderBottom: '1px solid #f0ece3' }}>
                        マナー・席・飲料制約
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[13px] font-bold text-navy/70">格式グレード <span className="text-red-500">*</span></label>
                            <select name="formalityGrade" required className="w-full border border-[#dfe3ea] focus:border-[#c2a15a] rounded-xl px-4 py-2.5 text-[14px] outline-none bg-white">
                                <option value="S">S（役員・社長接待向け極上店）</option>
                                <option value="A">A（部長・課長接待向け上質店）</option>
                                <option value="B">B（一般接待・カジュアル店）</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[13px] font-bold text-navy/70">格式グレード手動上書き</label>
                            <select name="formalityOverride" className="w-full border border-[#dfe3ea] focus:border-[#c2a15a] rounded-xl px-4 py-2.5 text-[14px] outline-none bg-white">
                                <option value="">上書きなし</option>
                                <option value="S">Sクラスとして判定</option>
                                <option value="A">Aクラスとして判定</option>
                                <option value="B">Bクラスとして判定</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[13px] font-bold text-navy/70">完全個室フラグ</label>
                            <select name="hasPrivateRoom" className="w-full border border-[#dfe3ea] focus:border-[#c2a15a] rounded-xl px-4 py-2.5 text-[14px] outline-none bg-white">
                                <option value="true">あり</option>
                                <option value="false">なし</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[13px] font-bold text-navy/70">個室タイプ</label>
                            <select name="privateRoomType" className="w-full border border-[#dfe3ea] focus:border-[#c2a15a] rounded-xl px-4 py-2.5 text-[14px] outline-none bg-white">
                                <option value="完全個室">完全個室</option>
                                <option value="半個室">半個室</option>
                                <option value="座敷">座敷</option>
                                <option value="なし">なし</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[13px] font-bold text-navy/70">座席スタイル</label>
                            <select name="seatStyle" className="w-full border border-[#dfe3ea] focus:border-[#c2a15a] rounded-xl px-4 py-2.5 text-[14px] outline-none bg-white">
                                <option value="unknown">不明</option>
                                <option value="椅子">椅子</option>
                                <option value="掘りごたつ">掘りごたつ</option>
                                <option value="座敷">座敷</option>
                                <option value="混在">混在</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[13px] font-bold text-navy/70">個室の防音等級</label>
                            <select name="soundproof" className="w-full border border-[#dfe3ea] focus:border-[#c2a15a] rounded-xl px-4 py-2.5 text-[14px] outline-none bg-white">
                                <option value="unknown">不明</option>
                                <option value="可">可 (密談可)</option>
                                <option value="不可">不可 (声が漏れる)</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-1.5 md:col-span-2">
                            <label className="text-[13px] font-bold text-navy/70">個室の詳細説明</label>
                            <input type="text" name="privateRoomNote" className="w-full border border-[#dfe3ea] focus:border-[#c2a15a] rounded-xl px-4 py-2.5 text-[14px] outline-none" placeholder="例：椅子テーブル式（密談可・防音）" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[13px] font-bold text-navy/70">ビール系列 <span className="text-red-500">*</span></label>
                            <select name="beerAffiliation" required className="w-full border border-[#dfe3ea] focus:border-[#c2a15a] rounded-xl px-4 py-2.5 text-[14px] outline-none bg-white">
                                <option value="unknown">不明</option>
                                <option value="kirin">キリン系</option>
                                <option value="asahi">アサヒ系</option>
                                <option value="suntory">サントリー系</option>
                                <option value="sapporo">サッポロ系</option>
                                <option value="mixed">混在</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[13px] font-bold text-navy/70">ビール確信度 <span className="text-red-500">*</span></label>
                            <select name="beerConfidence" required className="w-full border border-[#dfe3ea] focus:border-[#c2a15a] rounded-xl px-4 py-2.5 text-[14px] outline-none bg-white">
                                <option value="unknown">不明</option>
                                <option value="confirmed">確実 (confirmed)</option>
                                <option value="estimated">推定 (estimated)</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-1.5 md:col-span-2">
                            <label className="text-[13px] font-bold text-navy/70">ビール情報根拠URL</label>
                            <input type="url" name="beerSourceUrl" className="w-full border border-[#dfe3ea] focus:border-[#c2a15a] rounded-xl px-4 py-2.5 text-[14px] outline-none" placeholder="公式サイトやメニュー画像のURL" />
                        </div>
                    </div>
                </div>

                {/* 付加情報セクション */}
                <div>
                    <h3 className="text-[15px] font-bold mb-3 pb-1.5" style={{ color: '#14233f', borderBottom: '1px solid #f0ece3' }}>
                        おすすめタグ・画像・キュレーション
                    </h3>
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-[13px] font-bold text-navy/70">タグ（店舗の特徴・属性）</label>
                            <div className="flex flex-wrap gap-2 mb-2 p-3 border border-navy/10 rounded-xl bg-slate-50">
                                {allTags.map(tag => (
                                    <label key={tag.id} className="flex items-center gap-1.5 text-xs text-navy bg-white px-2 py-1 rounded border border-navy/10 cursor-pointer hover:border-gold">
                                        <input type="checkbox" name="tags" value={tag.name} className="accent-gold w-3.5 h-3.5" />
                                        <span>{tag.name}</span>
                                    </label>
                                ))}
                            </div>
                            <input type="text" name="tagsCustom" className="w-full border border-[#dfe3ea] focus:border-[#c2a15a] rounded-xl px-4 py-2 text-[14px] outline-none" placeholder="その他のタグ（カンマ区切りで入力）" />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-[13px] font-bold text-navy/70">おすすめ理由・アピールポイント</label>
                            <textarea name="curationNote" rows={3} className="w-full border border-[#dfe3ea] focus:border-[#c2a15a] rounded-xl px-4 py-2.5 text-[14px] outline-none resize-y" placeholder="例：個室は防音に優れ、周囲を気にせず商談可能。女将の気配りが素晴らしく接待向き。" />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-[13px] font-bold text-navy/70 font-semibold text-gold">店舗写真のアップロード</label>
                            <div className="border-2 border-dashed border-[#d8bd78] rounded-xl p-6 text-center bg-[#fdfaf2] hover:bg-[#fbf5e6] transition-colors relative cursor-pointer">
                                <input
                                    type="file"
                                    name="photoFile"
                                    accept="image/*"
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                />
                                <span className="material-symbols-outlined text-[36px]" style={{ color: '#b8944a' }}>add_photo_alternate</span>
                                <p className="text-[13px] font-bold mt-1" style={{ color: '#8a6a1f' }}>ファイルを選択またはドラッグ＆ドロップ</p>
                                <p className="text-[11px]" style={{ color: '#9aa0ab' }}>PNG, JPG, JPEG (最大5MB)</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 送信ボタン */}
                <div className="flex gap-3 justify-end mt-4">
                    <Link href="/search" className="px-6 py-3 rounded-xl border border-[#e2dccf] text-navy/70 text-[14px] font-bold hover:bg-slate-50 transition-colors">
                        キャンセル
                    </Link>
                    <button
                        type="submit"
                        className="px-8 py-3 rounded-xl text-white text-[14px] font-bold cursor-pointer"
                        style={{ background: 'linear-gradient(180deg,#c9a860,#b8944a)', boxShadow: '0 6px 16px rgba(184,148,74,0.3)' }}
                    >
                        新店を登録する
                    </button>
                </div>
            </form>
        </div>
    );
}
