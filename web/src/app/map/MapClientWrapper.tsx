'use client';

import dynamic from 'next/dynamic';

const MapClient = dynamic(() => import('./MapClient'), {
  ssr: false,
  loading: () => (
    <div className="rounded-2xl border border-[#eee6d8] flex items-center justify-center" style={{ height: 560 }}>
      <span className="material-symbols-outlined text-[32px] animate-spin" style={{ color: '#c2a15a', animationDuration: '1s' }}>progress_activity</span>
    </div>
  ),
});

export default MapClient;
