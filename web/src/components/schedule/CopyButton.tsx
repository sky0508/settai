'use client';

import { useState } from 'react';

export default function CopyButton({ text, label = 'コピー' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        } catch {
          /* noop */
        }
      }}
      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] font-bold shrink-0"
      style={{ border: '1px solid #e2dccf', color: copied ? '#3d8a5c' : '#17253f', background: '#fff' }}
    >
      <span className="material-symbols-outlined text-[15px]">{copied ? 'check' : 'content_copy'}</span>
      {copied ? 'コピーしました' : label}
    </button>
  );
}
