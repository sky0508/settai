import Link from 'next/link';

const MENU = [
  { icon: 'storefront', label: 'プレミアム店舗の追加', href: '/venues/new', desc: '会食店を新規に自社DBへ追加' },
  { icon: 'business', label: '会社ルール・メーカー辞書', href: '/settings/rules', desc: 'ビール4社の競合ルールを管理' },
  { icon: 'sell', label: 'タグマスタ管理', href: '/settings/tags', desc: '店舗や好みの分析用タグ辞書を整備' },
  { icon: 'person', label: 'アカウント情報', href: '/settings/account', desc: 'プロフィール・パスワード変更' },
  { icon: 'notifications', label: '通知設定', href: '/settings/notify', desc: '会食前リマインダーなど' },
  { icon: 'help', label: 'ヘルプ・お問い合わせ', href: '/settings/help', desc: '使い方・要望送信' },
  { icon: 'logout', label: 'ログアウト', href: '/settings/logout', desc: null },
];

export default function SettingsPage() {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: 'clamp(18px,2.8vw,36px)' }}>
      <h1 className="font-serif font-bold text-[clamp(24px,3vw,32px)] mb-5" style={{ color: '#17253f' }}>設定</h1>

      <div
        className="overflow-hidden mb-4"
        style={{ background: '#fff', border: '1px solid #eee6d8', borderRadius: 16, boxShadow: '0 6px 18px rgba(20,35,63,0.05)' }}
      >
        {MENU.map((item, i) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3.5 px-5 py-[17px] hover:bg-cream transition-colors group"
            style={{ borderBottom: i < MENU.length - 1 ? '1px solid #f0ece3' : 'none' }}
          >
            <span className="material-symbols-outlined text-[22px]" style={{ color: '#c2a15a' }}>{item.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="text-[14.5px] group-hover:text-gold transition-colors" style={{ color: '#3a4661' }}>
                {item.label}
              </div>
              {item.desc && (
                <div className="text-[12px]" style={{ color: '#9aa0ab' }}>{item.desc}</div>
              )}
            </div>
            <span className="material-symbols-outlined text-[20px]" style={{ color: '#c3ccd8' }}>chevron_right</span>
          </Link>
        ))}
      </div>

      {/* プレミアムバナー */}
      <div
        className="flex items-center gap-3.5 p-5 rounded-2xl"
        style={{ background: '#14233f' }}
      >
        <span className="material-symbols-outlined text-[30px]" style={{ color: '#cfa955' }}>workspace_premium</span>
        <div className="flex-1">
          <div className="font-bold text-[15px]" style={{ color: '#f4ede0' }}>プレミアムプラン</div>
          <div className="text-[12px] mt-0.5" style={{ color: '#9aa6bc' }}>有効期限 2026/12/31</div>
        </div>
        <span className="material-symbols-outlined text-[22px]" style={{ color: '#cfa955' }}>chevron_right</span>
      </div>

      <p className="text-[11px] text-center mt-4" style={{ color: '#9aa0ab' }}>会食ナビ v1.0.0</p>
    </div>
  );
}
