import { db } from '@/lib/db/client';
import { venues, tags as tagsTable } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { updateVenue, deleteVenue } from '../../actions';
import Link from 'next/link';
import DeleteButton from '@/components/ui/DeleteButton';

export default async function EditVenuePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const rows = await db.select().from(venues).where(eq(venues.id, id)).limit(1);
    if (rows.length === 0) notFound();
    const v = rows[0];

    const allTags = await db.select().from(tagsTable).orderBy(tagsTable.category, tagsTable.name);

    const doUpdate = updateVenue.bind(null, v.id);
    const doDelete = deleteVenue.bind(null, v.id);

    return (
        <div style={{ maxWidth: 800, margin: '0 auto', padding: 'clamp(18px,2.8vw,36px)' }}>
            {/* パンくず */}
            <nav className="text-xs text-navy/50 mb-4 flex items-center gap-1">
                <Link href="/search" className="hover:text-gold">お店を探す</Link>
                <span>›</span>
                <Link href={`/venues/${v.id}`} className="hover:text-gold">{v.name}</Link>
                <span>›</span>
                <span className="font-medium text-navy/70">店舗情報を編集</span>
            </nav>

            <div className="flex items-center justify-between gap-4 flex-wrap mb-1">
                <h1 className="font-serif font-bold text-[clamp(24px,3vw,32px)] m-0" style={{ color: '#14233f' }}>
                    店舗情報を編集する
                </h1>
                {/* 削除フォーム */}
                <form action={doDelete}>
                    <DeleteButton
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] border cursor-pointer transition-colors"
                        style={{ background: '#fff', border: '1px solid #e2dccf', color: '#c0504b' }}
                    >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                        店舗を削除
                    </DeleteButton>
                </form>
            </div>
            <div className="w-14 h-[3px] rounded mb-7" style={{ background: '#c2a15a' }} />

            <form
                action={doUpdate}
                className="flex flex-col gap-6 p-[clamp(20px,2.6vw,32px)]"
                style={{
                    background: '#fff',
                    border: '1px solid #eee6d8',
                    borderRadius: 18,
                    boxShadow: '0 10px 30px rgba(20,35,63,0.06)',
                }}
            >
                {/* 基本情報セクション */}
                <div>
                    <h3 className="text-[15px] font-bold mb-3 pb-1.5" style={{ color: '#14233f', borderBottom: '1px solid #f0ece3' }}>
                        基本情報
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[13px] font-bold text-navy/70">店舗名 <span className="text-red-500">*</span></label>
                            <input type="text" name="name" required defaultValue={v.name} className="w-full border border-[#dfe3ea] focus:border-[#c2a15a] rounded-xl px-4 py-2.5 text-[14px] outline-none" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[13px] font-bold text-navy/70">ジャンル <span className="text-red-500">*</span></label>
                            <input type="text" name="genre" required defaultValue={v.genre} className="w-full border border-[#dfe3ea] focus:border-[#c2a15a] rounded-xl px-4 py-2.5 text-[14px] outline-none" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[13px] font-bold text-navy/70">エリア <span className="text-red-500">*</span></label>
                            <input type="text" name="area" required defaultValue={v.area} className="w-full border border-[#dfe3ea] focus:border-[#c2a15a] rounded-xl px-4 py-2.5 text-[14px] outline-none" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[13px] font-bold text-navy/70">住所 <span className="text-red-500">*</span></label>
                            <input type="text" name="address" required defaultValue={v.address} className="w-full border border-[#dfe3ea] focus:border-[#c2a15a] rounded-xl px-4 py-2.5 text-[14px] outline-none" />
                        </div>
                    </div>
                </div>

                {/* 立地・予算セクション */}
                <div>
                    <h3 className="text-[15px] font-bold mb-3 pb-1.5" style={{ color: '#14233f', borderBottom: '1px solid #f0ece3' }}>
                        アクセス・予算・予約
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[13px] font-bold text-navy/70">最寄駅</label>
                            <input type="text" name="nearestStation" defaultValue={v.nearestStation ?? ''} className="w-full border border-[#dfe3ea] focus:border-[#c2a15a] rounded-xl px-4 py-2.5 text-[14px] outline-none" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[13px] font-bold text-navy/70">緯度 (lat) / 経度 (lng)</label>
                            <div className="flex gap-2">
                                <input type="number" step="0.0000001" name="lat" defaultValue={v.lat ? Number(v.lat) : undefined} className="w-full border border-[#dfe3ea] focus:border-[#c2a15a] rounded-xl px-4 py-2.5 text-[14px] outline-none" placeholder="35.6811" />
                                <input type="number" step="0.0000001" name="lng" defaultValue={v.lng ? Number(v.lng) : undefined} className="w-full border border-[#dfe3ea] focus:border-[#c2a15a] rounded-xl px-4 py-2.5 text-[14px] outline-none" placeholder="139.7670" />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[13px] font-bold text-navy/70">徒歩分数 (分)</label>
                            <input type="number" name="walkMinutes" min={0} defaultValue={v.walkMinutes ?? ''} className="w-full border border-[#dfe3ea] focus:border-[#c2a15a] rounded-xl px-4 py-2.5 text-[14px] outline-none" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[13px] font-bold text-navy/70">最小予算 (円)</label>
                            <input type="number" name="budgetMin" min={0} defaultValue={v.budgetMin ?? ''} className="w-full border border-[#dfe3ea] focus:border-[#c2a15a] rounded-xl px-4 py-2.5 text-[14px] outline-none" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[13px] font-bold text-navy/70">最大予算 (円)</label>
                            <input type="number" name="budgetMax" min={0} defaultValue={v.budgetMax ?? ''} className="w-full border border-[#dfe3ea] focus:border-[#c2a15a] rounded-xl px-4 py-2.5 text-[14px] outline-none" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[13px] font-bold text-navy/70">公式サイトURL</label>
                            <input type="url" name="websiteUrl" defaultValue={v.websiteUrl ?? ''} className="w-full border border-[#dfe3ea] focus:border-[#c2a15a] rounded-xl px-4 py-2.5 text-[14px] outline-none" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[13px] font-bold text-navy/70">電話番号</label>
                            <input type="tel" name="phone" defaultValue={v.phone ?? ''} className="w-full border border-[#dfe3ea] focus:border-[#c2a15a] rounded-xl px-4 py-2.5 text-[14px] outline-none" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[13px] font-bold text-navy/70">予約の要否</label>
                            <select name="requiresReservation" defaultValue={String(v.requiresReservation)} className="w-full border border-[#dfe3ea] focus:border-[#c2a15a] rounded-xl px-4 py-2.5 text-[14px] outline-none bg-white">
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
                            <select name="formalityGrade" required defaultValue={v.formalityGrade} className="w-full border border-[#dfe3ea] focus:border-[#c2a15a] rounded-xl px-4 py-2.5 text-[14px] outline-none bg-white">
                                <option value="S">S（役員・社長会食向け極上店）</option>
                                <option value="A">A（部長・課長会食向け上質店）</option>
                                <option value="B">B（一般会食・カジュアル店）</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[13px] font-bold text-navy/70">格式グレード手動上書き</label>
                            <select name="formalityOverride" defaultValue={v.formalityOverride ?? ''} className="w-full border border-[#dfe3ea] focus:border-[#c2a15a] rounded-xl px-4 py-2.5 text-[14px] outline-none bg-white">
                                <option value="">上書きなし</option>
                                <option value="S">Sクラスとして判定</option>
                                <option value="A">Aクラスとして判定</option>
                                <option value="B">Bクラスとして判定</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[13px] font-bold text-navy/70">完全個室フラグ</label>
                            <select name="hasPrivateRoom" defaultValue={String(v.hasPrivateRoom)} className="w-full border border-[#dfe3ea] focus:border-[#c2a15a] rounded-xl px-4 py-2.5 text-[14px] outline-none bg-white">
                                <option value="true">あり</option>
                                <option value="false">なし</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[13px] font-bold text-navy/70">個室タイプ</label>
                            <select name="privateRoomType" defaultValue={v.privateRoomType ?? ''} className="w-full border border-[#dfe3ea] focus:border-[#c2a15a] rounded-xl px-4 py-2.5 text-[14px] outline-none bg-white">
                                <option value="完全個室">完全個室</option>
                                <option value="半個室">半個室</option>
                                <option value="座敷">座敷</option>
                                <option value="なし">なし</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[13px] font-bold text-navy/70">座席スタイル</label>
                            <select name="seatStyle" defaultValue={v.seatStyle ?? 'unknown'} className="w-full border border-[#dfe3ea] focus:border-[#c2a15a] rounded-xl px-4 py-2.5 text-[14px] outline-none bg-white">
                                <option value="unknown">不明</option>
                                <option value="椅子">椅子</option>
                                <option value="掘りごたつ">掘りごたつ</option>
                                <option value="座敷">座敷</option>
                                <option value="混在">混在</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[13px] font-bold text-navy/70">個室の防音等級</label>
                            <select name="soundproof" defaultValue={v.soundproof ?? 'unknown'} className="w-full border border-[#dfe3ea] focus:border-[#c2a15a] rounded-xl px-4 py-2.5 text-[14px] outline-none bg-white">
                                <option value="unknown">不明</option>
                                <option value="可">可 (密談可)</option>
                                <option value="不可">不可 (声が漏れる)</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-1.5 md:col-span-2">
                            <label className="text-[13px] font-bold text-navy/70">個室の詳細説明</label>
                            <input type="text" name="privateRoomNote" defaultValue={v.privateRoomNote ?? ''} className="w-full border border-[#dfe3ea] focus:border-[#c2a15a] rounded-xl px-4 py-2.5 text-[14px] outline-none" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[13px] font-bold text-navy/70">ビール系列 <span className="text-red-500">*</span></label>
                            <select name="beerAffiliation" required defaultValue={v.beerAffiliation} className="w-full border border-[#dfe3ea] focus:border-[#c2a15a] rounded-xl px-4 py-2.5 text-[14px] outline-none bg-white">
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
                            <select name="beerConfidence" required defaultValue={v.beerConfidence} className="w-full border border-[#dfe3ea] focus:border-[#c2a15a] rounded-xl px-4 py-2.5 text-[14px] outline-none bg-white">
                                <option value="unknown">不明</option>
                                <option value="confirmed">確実 (confirmed)</option>
                                <option value="estimated">推定 (estimated)</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-1.5 md:col-span-2">
                            <label className="text-[13px] font-bold text-navy/70">ビール情報根拠URL</label>
                            <input type="url" name="beerSourceUrl" defaultValue={v.beerSourceUrl ?? ''} className="w-full border border-[#dfe3ea] focus:border-[#c2a15a] rounded-xl px-4 py-2.5 text-[14px] outline-none" />
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
                                        <input type="checkbox" name="tags" value={tag.name} defaultChecked={v.tags.includes(tag.name)} className="accent-gold w-3.5 h-3.5" />
                                        <span>{tag.name}</span>
                                    </label>
                                ))}
                            </div>
                            <input type="text" name="tagsCustom" defaultValue={v.tags.filter(t => !allTags.some(at => at.name === t)).join(', ')} className="w-full border border-[#dfe3ea] focus:border-[#c2a15a] rounded-xl px-4 py-2 text-[14px] outline-none" placeholder="その他のタグ（カンマ区切りで入力）" />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-[13px] font-bold text-navy/70">おすすめ理由・アピールポイント</label>
                            <textarea name="curationNote" rows={3} defaultValue={v.curationNote ?? ''} className="w-full border border-[#dfe3ea] focus:border-[#c2a15a] rounded-xl px-4 py-2.5 text-[14px] outline-none resize-y" />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[13px] font-bold text-gold">写真（最大3枚・スロットごとに差し替え）</label>
                            <div className="grid grid-cols-3 gap-3">
                                {[0, 1, 2].map((i) => {
                                    const cur = v.photos?.[i] ?? '';
                                    return (
                                        <div key={i} className="flex flex-col gap-1.5">
                                            {/* 触らなければ現状維持するための既存URL */}
                                            <input type="hidden" name={`existingPhoto${i}`} defaultValue={cur} />
                                            <label className="relative block w-full h-24 rounded-lg overflow-hidden border border-[#e2dccf] bg-[#fdfaf2] flex items-center justify-center cursor-pointer hover:border-[#d8bd78] transition-colors">
                                                {cur ? (
                                                    <img src={cur} alt={`${i + 1}枚目`} className="object-cover w-full h-full" />
                                                ) : (
                                                    <span className="material-symbols-outlined text-[28px]" style={{ color: '#b8944a' }}>add_photo_alternate</span>
                                                )}
                                                <input
                                                    type="file"
                                                    name={`photoFile${i}`}
                                                    accept="image/*"
                                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                                />
                                            </label>
                                            <span className="text-[11px] text-navy/50 text-center">{i === 0 ? '代表写真' : `${i + 1}枚目`}</span>
                                        </div>
                                    );
                                })}
                            </div>
                            <p className="text-[11px]" style={{ color: '#9aa0ab' }}>各スロットをクリックしてファイルを選ぶと差し替え（触らなければ現状維持）。保存後に反映されます。1枚目が代表写真です。</p>
                        </div>
                    </div>
                </div>

                {/* 送信ボタン */}
                <div className="flex gap-3 justify-end mt-4">
                    <Link href={`/venues/${v.id}`} className="px-6 py-3 rounded-xl border border-[#e2dccf] text-navy/70 text-[14px] font-bold hover:bg-slate-50 transition-colors">
                        キャンセル
                    </Link>
                    <button
                        type="submit"
                        className="px-8 py-3 rounded-xl text-white text-[14px] font-bold cursor-pointer"
                        style={{ background: 'linear-gradient(180deg,#c9a860,#b8944a)', boxShadow: '0 6px 16px rgba(184,148,74,0.3)' }}
                    >
                        変更を保存する
                    </button>
                </div>
            </form>
        </div>
    );
}
