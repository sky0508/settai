'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import Link from 'next/link';
import 'leaflet/dist/leaflet.css';

type Pin = {
  id: string;
  name: string;
  genre: string;
  area: string;
  lat: number;
  lng: number;
  count: number;
  avgRating: number | null;
};

function ratingColor(avgRating: number | null): string {
  if (avgRating == null) return '#8a93a4';
  if (avgRating >= 4.2) return '#3d8a5c';
  if (avgRating >= 3.5) return '#c2a15a';
  return '#c0504b';
}

function makeIcon(pin: Pin) {
  // 数字（利用回数）はやめ、色（評価）＋アイコンで区別する。
  // 会食実績あり → 星アイコン＆やや大きめ / 実績なし → フォーク＆ニュートラル。
  const color = ratingColor(pin.avgRating);
  const hasRecord = pin.count > 0;
  const size = hasRecord ? 38 : 30;
  const icon = hasRecord ? 'star' : 'restaurant';
  return L.divIcon({
    className: '',
    html: `
      <div style="
        width:${size}px;height:${size}px;border-radius:50% 50% 50% 0;
        background:${color};transform:rotate(-45deg);
        display:flex;align-items:center;justify-content:center;
        box-shadow:0 3px 10px rgba(20,35,63,0.35);border:2px solid #fff;
      ">
        <span class="material-symbols-outlined" style="
          transform:rotate(45deg);color:#fff;
          font-size:${hasRecord ? 18 : 15}px;font-variation-settings:'FILL' 1;
        ">${icon}</span>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

export default function MapClient({ pins }: { pins: Pin[] }) {
  if (pins.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white border border-[#eee6d8] rounded-2xl text-navy/40">
        <span className="material-symbols-outlined text-5xl mb-3 text-gold">location_off</span>
        <p className="text-sm font-semibold text-navy">まだ地図に出せる店舗がありません</p>
        <p className="text-xs mt-1">店舗に座標を登録すると、ここに地図でピンが表示されます</p>
      </div>
    );
  }

  // 単純な平均だと、離れた場所にある店舗（例: 東京と沖縄）が混在すると
  // 中心が両者の間の海上になり、全ピンを収めようとして極端にズームアウトされ、
  // ピンが1箇所に重なって黒い塊になり数字も潰れてしまう。
  // 外れ値に強い「中央値」を中心にし、多数派（東京）が読める縮尺で表示する。
  // 他エリア（沖縄など）の店は地図下の「エリア別おすすめ」から辿れる。
  const median = (arr: number[]) => {
    const s = [...arr].sort((a, b) => a - b);
    return s[Math.floor(s.length / 2)];
  };
  const center: [number, number] = [median(pins.map((p) => p.lat)), median(pins.map((p) => p.lng))];

  return (
    <div className="rounded-2xl overflow-hidden border border-[#eee6d8] shadow-sm" style={{ height: 560 }}>
      <MapContainer center={center} zoom={14} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {pins.map((pin) => (
          <Marker key={pin.id} position={[pin.lat, pin.lng]} icon={makeIcon(pin)}>
            <Popup>
              <div style={{ minWidth: 180 }}>
                <div className="font-serif font-bold text-[15px] mb-1" style={{ color: '#17253f' }}>{pin.name}</div>
                <div className="text-xs text-navy/60 mb-2">{pin.genre} · {pin.area}</div>
                <div className="flex items-center gap-3 text-xs mb-2">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px]" style={{ color: '#c2a15a' }}>history</span>
                    {pin.count > 0 ? `${pin.count}回利用` : '会食記録なし'}
                  </span>
                  {pin.avgRating != null && (
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px]" style={{ color: '#e0aa33', fontVariationSettings: "'FILL' 1" }}>star</span>
                      {pin.avgRating}
                    </span>
                  )}
                </div>
                <Link href={`/venues/${pin.id}`} className="text-xs font-bold" style={{ color: '#c2a15a' }}>
                  店舗詳細を見る →
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
