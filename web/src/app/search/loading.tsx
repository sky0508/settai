export default function SearchLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <span
        className="material-symbols-outlined text-[48px] animate-spin"
        style={{ color: '#c2a15a', animationDuration: '1s' }}
      >
        progress_activity
      </span>
      <p className="text-[14px] font-medium" style={{ color: '#8a93a4' }}>店舗を検索中...</p>
    </div>
  );
}
