import Link from 'next/link';
import { createPoll } from '../actions';

const gold = 'linear-gradient(135deg, #c2a15a 0%, #b8944a 100%)';

export default function NewSchedulePage() {
  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5">
      <nav className="text-xs flex items-center gap-1" style={{ color: 'rgba(23,37,63,.5)' }}>
        <Link href="/schedules" className="hover:text-gold">会食を作る</Link>
        <span>›</span>
        <span>日程調整をつくる</span>
      </nav>

      <div>
        <h1 className="font-serif text-xl font-semibold" style={{ color: '#17253f' }}>日程調整をつくる</h1>
        <p className="text-[13px] mt-1" style={{ color: '#6f7a8f' }}>
          候補の日付範囲と時間帯を決めると、参加者に配る投票リンクが発行されます。参加者はログイン不要で回答できます。
        </p>
      </div>

      <form action={createPoll} className="bg-white rounded-xl shadow-sm p-6 space-y-5" style={{ border: '1px solid #eee6d8' }}>
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5a6478' }}>タイトル <span style={{ color: '#c0504b' }}>*</span></label>
          <input name="title" required placeholder="例: A社 役員会食 日程調整" className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2" style={{ border: '1px solid #d9d2c4', color: '#17253f' }} />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5a6478' }}>ひとことメモ（参加者に表示）</label>
          <input name="note" placeholder="ご都合のよい時間帯をお選びください。" className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2" style={{ border: '1px solid #d9d2c4', color: '#17253f' }} />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5a6478' }}>会食の用途</label>
          <select name="purpose" className="w-full rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2" style={{ border: '1px solid #d9d2c4', color: '#17253f' }}>
            <option value="顔合わせ">顔合わせ・ご挨拶</option>
            <option value="親睦">親睦・キックオフ</option>
            <option value="クロージング">クロージング（重要）</option>
            <option value="御礼">御礼・慰労</option>
            <option value="お詫び">お詫び</option>
          </select>
        </div>

        <div className="pt-1" style={{ borderTop: '1px dashed #e2dccf' }} />
        <div className="text-[11px] font-bold" style={{ color: '#9aa0ab' }}>候補にする範囲</div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5a6478' }}>開始日 <span style={{ color: '#c0504b' }}>*</span></label>
            <input type="date" name="dateFrom" required className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2" style={{ border: '1px solid #d9d2c4', color: '#17253f' }} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5a6478' }}>終了日 <span style={{ color: '#c0504b' }}>*</span></label>
            <input type="date" name="dateTo" required className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2" style={{ border: '1px solid #d9d2c4', color: '#17253f' }} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5a6478' }}>開始時刻 <span style={{ color: '#c0504b' }}>*</span></label>
            <input type="time" name="timeFrom" required defaultValue="18:00" className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2" style={{ border: '1px solid #d9d2c4', color: '#17253f' }} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5a6478' }}>終了時刻 <span style={{ color: '#c0504b' }}>*</span></label>
            <input type="time" name="timeTo" required defaultValue="21:00" className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2" style={{ border: '1px solid #d9d2c4', color: '#17253f' }} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5a6478' }}>スロットの粒度</label>
            <select name="slotMinutes" defaultValue="30" className="w-full rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2" style={{ border: '1px solid #d9d2c4', color: '#17253f' }}>
              <option value="30">30分ごと</option>
              <option value="60">60分ごと</option>
              <option value="15">15分ごと</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5a6478' }}>想定人数（任意）</label>
            <input type="number" name="headcount" min={1} placeholder="4" className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2" style={{ border: '1px solid #d9d2c4', color: '#17253f' }} />
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <Link href="/schedules" className="px-6 py-2.5 rounded-xl font-semibold text-sm" style={{ border: '1px solid #e2dccf', color: '#17253f' }}>
            キャンセル
          </Link>
          <button type="submit" className="px-8 py-2.5 rounded-xl text-white font-semibold text-sm cursor-pointer shadow-md flex items-center gap-2" style={{ background: gold }}>
            <span className="material-symbols-outlined text-[18px]">link</span>
            候補を作成して共有リンクを発行
          </button>
        </div>
      </form>
    </div>
  );
}
