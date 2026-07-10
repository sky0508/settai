'use client';

import { useMemo, useState } from 'react';

type Props = {
  title: string;
  note?: string | null;
  purpose?: string | null;
  shareUrl: string;
  /** 日程確定済みなら確定日時の表示文字列を渡す */
  confirmedLabel?: string | null;
  /** 宛先候補（回答者のメール）。mailto の To に入れる */
  recipientEmails?: string[];
};

function buildSubject(title: string, confirmedLabel?: string | null) {
  return confirmedLabel ? `【日程確定】${title}` : `【日程調整のお願い】${title}`;
}

function buildBody({
  title,
  note,
  purpose,
  shareUrl,
  confirmedLabel,
}: Omit<Props, 'recipientEmails'>) {
  const lines: string[] = [];
  lines.push('お世話になっております。');
  lines.push('');
  if (confirmedLabel) {
    lines.push(`先般ご調整いただいた「${title}」につきまして、下記の日程で確定いたしました。`);
    lines.push('');
    lines.push(`　日時：${confirmedLabel}`);
    if (purpose) lines.push(`　目的：${purpose}`);
    lines.push('');
    lines.push('お店の詳細が決まり次第、改めてご案内いたします。');
    lines.push('何卒よろしくお願いいたします。');
  } else {
    lines.push(`「${title}」の日程を調整させていただきたく存じます。`);
    if (purpose) lines.push(`（目的：${purpose}）`);
    lines.push('');
    lines.push('お手数ですが、下記のリンクよりご都合のよい時間帯をお選びください。');
    lines.push('ログイン不要でご回答いただけます。');
    lines.push('');
    lines.push(`　回答フォーム：${shareUrl}`);
    if (note) {
      lines.push('');
      lines.push(note);
    }
    lines.push('');
    lines.push('お忙しいところ恐れ入りますが、何卒よろしくお願いいたします。');
  }
  return lines.join('\n');
}

export default function InviteMailPreview({
  title,
  note,
  purpose,
  shareUrl,
  confirmedLabel,
  recipientEmails = [],
}: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const subject = useMemo(() => buildSubject(title, confirmedLabel), [title, confirmedLabel]);
  const defaultBody = useMemo(
    () => buildBody({ title, note, purpose, shareUrl, confirmedLabel }),
    [title, note, purpose, shareUrl, confirmedLabel]
  );
  const [body, setBody] = useState(defaultBody);

  const mailto = useMemo(() => {
    const to = recipientEmails.join(',');
    const params = `subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    return `mailto:${encodeURIComponent(to)}?${params}`;
  }, [recipientEmails, subject, body]);

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(`件名：${subject}\n\n${body}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* noop */
    }
  };

  return (
    <div className="p-5" style={{ background: '#fff', border: '1px solid #eee6d8', borderRadius: 16, boxShadow: '0 6px 22px rgba(20,35,63,.05)' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 cursor-pointer"
      >
        <span className="material-symbols-outlined text-[20px]" style={{ color: '#c2a15a' }}>mail</span>
        <b className="font-serif text-[15px]" style={{ color: '#17253f' }}>参加者への招待メール</b>
        <span className="ml-auto text-[11.5px] font-bold rounded-full px-2.5 py-0.5" style={{ background: '#eef1f6', color: '#3a4661' }}>文面プレビュー</span>
        <span className="material-symbols-outlined text-[20px]" style={{ color: '#9aa0ab' }}>{open ? 'expand_less' : 'expand_more'}</span>
      </button>

      {open && (
        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-[11.5px] font-bold mb-1" style={{ color: '#5a6478' }}>件名</label>
            <div className="rounded-lg px-3 py-2 text-[13px] font-mono" style={{ background: '#f6f3ec', border: '1px solid #eee6d8', color: '#22314f' }}>
              {subject}
            </div>
          </div>

          <div>
            <label className="block text-[11.5px] font-bold mb-1" style={{ color: '#5a6478' }}>本文（編集できます）</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={11}
              className="w-full rounded-lg px-3 py-2 text-[13px] leading-relaxed outline-none resize-y"
              style={{ background: '#fff', border: '1px solid #d9d2c4', color: '#17253f' }}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copyAll}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12.5px] font-bold cursor-pointer"
              style={{ border: '1px solid #e2dccf', color: copied ? '#3d8a5c' : '#17253f', background: '#fff' }}
            >
              <span className="material-symbols-outlined text-[16px]">{copied ? 'check' : 'content_copy'}</span>
              {copied ? 'コピーしました' : '件名＋本文をコピー'}
            </button>
            <a
              href={mailto}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12.5px] font-bold text-white cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #c2a15a 0%, #b8944a 100%)' }}
            >
              <span className="material-symbols-outlined text-[16px]">open_in_new</span>
              メールソフトで開く
            </a>
          </div>
          <p className="text-[11px]" style={{ color: '#9aa0ab' }}>
            ※ 実際の送信は行いません。文面をコピーするか、お使いのメールソフトで開いて送信してください。
            {recipientEmails.length > 0 && `（宛先候補 ${recipientEmails.length} 名を自動セット）`}
          </p>
        </div>
      )}
    </div>
  );
}
