import Link from 'next/link';
import { db } from '@/lib/db/client';
import { brandRules } from '@/lib/db/schema';
import { addBrandRule, deleteBrandRule } from './actions';

const AFFILIATIONS = [
  { key: 'kirin',   label: 'キリン' },
  { key: 'asahi',   label: 'アサヒ' },
  { key: 'suntory', label: 'サントリー' },
  { key: 'sapporo', label: 'サッポロ' },
  { key: 'mixed',   label: '混合（複数取扱）' },
];

const EFFECT_LABEL: Record<string, { label: string; cls: string }> = {
  ng:     { label: 'NG',    cls: 'bg-ng/10 text-ng' },
  prefer: { label: '優先',  cls: 'bg-ok/10 text-ok' },
};

export default async function RulesPage() {
  const rules = await db.select().from(brandRules).orderBy(brandRules.company);

  // 企業別にグループ化
  const grouped: Record<string, typeof rules> = {};
  for (const r of rules) {
    (grouped[r.company] ??= []).push(r);
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      <nav className="text-xs text-navy/50">
        <Link href="/settings" className="hover:text-gold">設定</Link>
        <span className="mx-1">›</span>
        <span>会社ルール・メーカー辞書</span>
      </nav>

      <h1 className="font-serif text-xl font-semibold text-navy">会社ルール・メーカー辞書</h1>
      <p className="text-sm text-navy/60">
        取引先企業に対してビール系列のNG／優先ルールを登録します。
        検索時に自動で適用されます。
      </p>

      {/* ルール一覧 */}
      {rules.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center text-navy/40 text-sm shadow-sm">
          ルールがまだ登録されていません
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([company, items]) => (
            <div key={company} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-3 bg-navy/5 text-sm font-semibold text-navy border-b border-navy/8">
                {company}
              </div>
              <ul>
                {items.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 px-5 py-3 border-b border-navy/5 last:border-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${EFFECT_LABEL[r.effect]?.cls ?? ''}`}>
                        {EFFECT_LABEL[r.effect]?.label ?? r.effect}
                      </span>
                      <span className="text-sm text-navy truncate">{r.label}</span>
                      <span className="text-xs text-navy/40 shrink-0">{r.affiliation}</span>
                    </div>
                    <form action={deleteBrandRule.bind(null, r.id)}>
                      <button
                        type="submit"
                        className="text-navy/30 hover:text-ng transition-colors"
                        aria-label="削除"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* 追加フォーム */}
      <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
        <h2 className="text-sm font-semibold text-navy">新しいルールを追加</h2>
        <form action={addBrandRule} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-navy/60 mb-1">取引先企業名</label>
            <input
              name="company"
              type="text"
              required
              placeholder="例: キリンビール株式会社"
              className="w-full border border-navy/20 rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold/40"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-navy/60 mb-1">ビールメーカー系列</label>
              <select
                name="affiliation"
                required
                className="w-full border border-navy/20 rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold/40"
              >
                <option value="">選択</option>
                {AFFILIATIONS.map((a) => (
                  <option key={a.key} value={a.key}>{a.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy/60 mb-1">ルール種別</label>
              <select
                name="effect"
                required
                className="w-full border border-navy/20 rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold/40"
              >
                <option value="">選択</option>
                <option value="ng">NG（除外）</option>
                <option value="prefer">優先（加点）</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy/60 mb-1">ラベル（理由の説明）</label>
            <input
              name="label"
              type="text"
              required
              placeholder="例: アサヒ系列専売店"
              className="w-full border border-navy/20 rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold/40"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl text-white font-semibold text-sm"
            style={{ background: 'linear-gradient(135deg, #c2a15a 0%, #b8944a 100%)' }}
          >
            ルールを追加
          </button>
        </form>
      </div>
    </div>
  );
}
