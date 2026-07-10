import Link from 'next/link';
import { addCompanyWithGuest } from './actions';

export default function NewGuestPage() {
  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5">
      <nav className="text-xs text-navy/50">
        <Link href="/guests" className="hover:text-gold">ゲスト管理</Link>
        <span className="mx-1">›</span>
        <span>新しい取引先を追加</span>
      </nav>
      <h1 className="font-serif text-xl font-semibold text-navy">新しい取引先の追加</h1>

      <form action={addCompanyWithGuest} className="bg-white rounded-xl shadow-sm p-6 space-y-5">
        <div>
          <label className="block text-xs font-semibold text-navy/60 mb-1.5">会社名 / 取引先企業名 (必須)</label>
          <input
            type="text"
            name="company"
            required
            placeholder="例: キリンビール株式会社"
            className="w-full border border-navy/20 rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold/40"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-navy/60 mb-1.5">本社所在地（任意）</label>
          <input
            type="text"
            name="address"
            placeholder="例: 東京都中野区中野4-10-2"
            className="w-full border border-navy/20 rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold/40"
          />
          <p className="text-[10px] text-navy/40 mt-1">※お店探しの「相手の拠点（動線）」に自動で使われます</p>
        </div>

        <div className="h-px bg-navy/5" />

        <h2 className="text-[13.5px] font-bold text-navy">初期登録の担当者情報</h2>

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
              placeholder="例: 部長"
              className="w-full border border-navy/20 rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold/40"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-navy/60 mb-1.5">好み・アレルギー・メモ</label>
          <textarea
            name="memo"
            rows={4}
            placeholder="例: 日本酒好き、個室希望。甲殻類アレルギーあり..."
            className="w-full border border-navy/20 rounded-lg px-3 py-2 text-sm text-navy resize-none focus:outline-none focus:ring-2 focus:ring-gold/40"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Link
            href="/guests"
            className="flex-1 py-3 border border-navy/20 rounded-xl text-center text-navy font-semibold text-sm hover:bg-navy/5 transition-colors"
          >
            キャンセル
          </Link>
          <button
            type="submit"
            className="flex-1 py-3 rounded-xl text-white font-semibold text-sm cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #c2a15a 0%, #b8944a 100%)' }}
          >
            取引先を追加する
          </button>
        </div>
      </form>
    </div>
  );
}
