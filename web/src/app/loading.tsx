export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
      <span
        className="material-symbols-outlined text-[48px] animate-spin"
        style={{ color: '#c2a15a', animationDuration: '1s' }}
      >
        progress_activity
      </span>
      <p className="mt-3 text-[14px] font-medium" style={{ color: '#8a93a4' }}>読み込み中...</p>
    </div>
  );
}
