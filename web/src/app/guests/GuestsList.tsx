'use client';
import { useState } from 'react';
import Link from 'next/link';
import DeleteButton from '@/components/ui/DeleteButton';
import { deleteCompany } from './actions';
import { deleteGuestFromList } from './guestListActions';

type GuestRow = {
    id: string;
    companyId: string;
    companyName: string | null;
    name: string;
    nameKana: string | null;
    title: string;
    preferences: string[];
    ngFoods: string[];
    memo: string | null;
};

type CompanyRow = {
    id: string;
    slug: string;
    name: string;
    nameKana: string | null;
    industry: string;
    initial: string;
    drinkAffiliation: string;
    memo: string | null;
    guestCount: number;
};
const normalize = (str: string) => {
    if (!str) return '';
    return str
        .toLowerCase()
        // ひらがな -> カタカナ
        .replace(/[\u3041-\u3096]/g, (match) => String.fromCharCode(match.charCodeAt(0) + 0x60))
        // 全角英数 -> 半角
        .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (match) => String.fromCharCode(match.charCodeAt(0) - 0xFEE0));
};

export default function GuestsList({ rows, guestRows }: { rows: CompanyRow[], guestRows: GuestRow[] }) {
    const [q, setQ] = useState('');
    const [tab, setTab] = useState<'company' | 'person'>('company');

    // 人物詳細は /guests/[会社slug]/[人物id] なので companyId → slug を引けるようにする
    const slugByCompanyId = new Map(rows.map((c) => [c.id, c.slug]));

    const normQ = normalize(q);
    const filtered = rows.filter(c => {
        if (!normQ) return true;

        const normName = normalize(c.name);
        const normKana = normalize(c.nameKana || '');
        const normMemo = normalize(c.memo || '');
        const normSlug = normalize(c.slug); // 読み（kirinなど）として活用

        return normName.includes(normQ) || normKana.includes(normQ) || normMemo.includes(normQ) || normSlug.includes(normQ);
    });

    const filteredGuests = guestRows.filter(g => {
        if (!normQ) return true;
        const normName = normalize(g.name);
        const normKana = normalize(g.nameKana || '');
        const normMemo = normalize(g.memo || '');
        const normComp = normalize(g.companyName || '');
        return normName.includes(normQ) || normKana.includes(normQ) || normMemo.includes(normQ) || normComp.includes(normQ);
    });

    return (
        <div className="flex flex-col gap-4">
            {/* タブ切り替え */}
            <div className="flex bg-[#eee6d8] p-1 rounded-xl w-full max-w-sm mx-auto shadow-inner">
                <button
                    type="button"
                    onClick={() => setTab('company')}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${tab === 'company' ? 'bg-white text-navy shadow-sm' : 'text-navy/50'}`}
                >
                    企業で探す
                </button>
                <button
                    type="button"
                    onClick={() => setTab('person')}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${tab === 'person' ? 'bg-white text-navy shadow-sm' : 'text-navy/50'}`}
                >
                    人で探す
                </button>
            </div>

            {/* 検索バー */}
            <div className="bg-white rounded-xl shadow-sm border border-navy/10 p-2 flex items-center mb-2">
                <span className="material-symbols-outlined text-navy/40 ml-2">search</span>
                <input
                    type="text"
                    placeholder="取引先名・メモから検索..."
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="flex-1 bg-transparent px-3 py-2 text-sm text-navy outline-none"
                />
            </div>

            {tab === 'company' && filtered.map((c) => {
                const doDelete = deleteCompany.bind(null, c.id);
                return (
                    <div
                        key={c.id}
                        className="flex items-center gap-4 flex-wrap"
                        style={{
                            background: '#fff',
                            border: '1px solid #eee6d8',
                            borderRadius: 16,
                            boxShadow: '0 6px 18px rgba(20,35,63,0.05)',
                            padding: '18px 20px',
                        }}
                    >
                        <Link href={`/guests/${c.slug}`} className="flex items-center gap-4 flex-1 min-w-0 group">
                            <div
                                className="w-[58px] h-[58px] rounded-[14px] flex items-center justify-center shrink-0"
                                style={{ background: '#14233f' }}
                            >
                                <span className="font-serif font-bold text-[24px]" style={{ color: '#e0c07a' }}>
                                    {c.initial}
                                </span>
                            </div>

                            <div className="flex-1 min-w-[200px]">
                                <div className="font-serif font-bold text-[18px] group-hover:text-gold transition-colors" style={{ color: '#17253f' }}>
                                    {c.name}
                                </div>
                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                    <span className="text-[12px] rounded px-2.5 py-0.5" style={{ color: '#7a8296', background: '#f2efe8' }}>
                                        {c.industry}
                                    </span>
                                    <span className="flex items-center gap-1 text-[12.5px]" style={{ color: '#7a8296' }}>
                                        <span className="material-symbols-outlined text-[15px]" style={{ color: '#c2a15a' }}>local_bar</span>
                                        {c.drinkAffiliation === 'none' ? '制約なし' : `${c.drinkAffiliation}系`}
                                    </span>
                                    {c.memo && (
                                        <span className="flex items-center gap-1 text-[12px]" style={{ color: '#9aa0ab' }}>
                                            <span className="material-symbols-outlined text-[14px]">sticky_note_2</span>
                                            {c.memo.slice(0, 22)}{c.memo.length > 22 ? '…' : ''}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-3 ml-auto">
                                <span className="flex items-center gap-1.5 text-[13px]" style={{ color: '#6f7a8f' }}>
                                    <span className="material-symbols-outlined text-[17px]">group</span>
                                    {c.guestCount}名
                                </span>
                                <span className="material-symbols-outlined text-[22px] group-hover:text-gold transition-colors" style={{ color: '#c3ccd8' }}>
                                    chevron_right
                                </span>
                            </div>
                        </Link>

                        {/* 取引先削除ボタン */}
                        <form action={doDelete}>
                            <DeleteButton
                                className="text-navy/25 hover:text-ng transition-colors cursor-pointer"
                                title="取引先を削除"
                            >
                                <span className="material-symbols-outlined text-[20px]">domain_disabled</span>
                            </DeleteButton>
                        </form>
                    </div>
                );
            })}

            {tab === 'person' && filteredGuests.map(g => {
                const doDelete = deleteGuestFromList.bind(null, g.companyId, g.id);
                const slug = slugByCompanyId.get(g.companyId);
                return (
                    <div
                        key={g.id}
                        className="flex items-center gap-4 flex-wrap"
                        style={{
                            background: '#fff',
                            border: '1px solid #eee6d8',
                            borderRadius: 16,
                            boxShadow: '0 6px 18px rgba(20,35,63,0.05)',
                            padding: '16px 20px',
                        }}
                    >
                        <Link
                            href={slug ? `/guests/${slug}/${g.id}` : '#'}
                            className="flex items-center gap-4 flex-1 min-w-0 group"
                        >
                            <div className="flex-1 min-w-[200px]">
                                <div className="text-[12px] text-navy/60 font-bold mb-0.5">{g.companyName}</div>
                                <div className="font-serif font-bold text-[18px] group-hover:text-gold transition-colors" style={{ color: '#17253f' }}>
                                    {g.name} <span className="text-[13px] font-normal text-navy/70 ml-2">{g.title}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                    {g.preferences.length > 0 && (
                                        <span className="flex items-center gap-1 text-[11px] font-bold text-gold-dark bg-gold/10 px-2 py-0.5 rounded-sm">
                                            <span className="material-symbols-outlined text-[14px]">restaurant_menu</span>
                                            {g.preferences.join('・')}
                                        </span>
                                    )}
                                    {g.ngFoods.length > 0 && (
                                        <span className="flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-sm">
                                            <span className="material-symbols-outlined text-[14px]">block</span>
                                            {g.ngFoods.join('・')}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <span className="material-symbols-outlined text-[22px] ml-auto group-hover:text-gold transition-colors" style={{ color: '#c3ccd8' }}>
                                chevron_right
                            </span>
                        </Link>

                        {/* ゲスト削除ボタン */}
                        <form action={doDelete}>
                            <DeleteButton
                                className="text-navy/25 hover:text-ng transition-colors cursor-pointer"
                                title="ゲストを削除"
                            >
                                <span className="material-symbols-outlined text-[20px]">person_remove</span>
                            </DeleteButton>
                        </form>
                    </div>
                );
            })}

            {tab === 'company' && filtered.length === 0 && (
                <div className="p-8 text-center text-navy/50 text-sm">見つかりませんでした。</div>
            )}
            {tab === 'person' && filteredGuests.length === 0 && (
                <div className="p-8 text-center text-navy/50 text-sm">見つかりませんでした。</div>
            )}
        </div>
    );
}
