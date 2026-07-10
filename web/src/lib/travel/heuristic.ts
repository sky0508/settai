type LatLng = { lat: number; lng: number };

const EARTH_RADIUS_KM = 6371;
const AVERAGE_SPEED_KMH = 25;

export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * sinLng * sinLng;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function estimateHeuristicMinutes(a: LatLng, b: LatLng): number {
  const km = haversineKm(a, b);
  return Math.round((km / AVERAGE_SPEED_KMH) * 60);
}
