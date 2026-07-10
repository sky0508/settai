import type { RouteResult } from './types';

const EKISPERT_BASE_URL = 'https://api.ekispert.jp/v1/json/search/course/extreme';

type EkispertRoute = {
  timeOnBoard?: string;
  timeWalk?: string;
  transferCount?: string;
};

type EkispertResponse = {
  ResultSet?: {
    Course?: { Route?: EkispertRoute } | Array<{ Route?: EkispertRoute }>;
  };
};

export async function fetchEkispertRoute(fromStation: string, toStation: string): Promise<RouteResult | null> {
  const apiKey = process.env.EKISPERT_API_KEY;
  if (!apiKey) return null;

  const url = `${EKISPERT_BASE_URL}?key=${encodeURIComponent(apiKey)}&viaList=${encodeURIComponent(fromStation)}:${encodeURIComponent(toStation)}`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = (await res.json()) as EkispertResponse;
    const course = data.ResultSet?.Course;
    if (!course) return null;

    const route = Array.isArray(course) ? course[0]?.Route : course.Route;
    if (!route || route.timeOnBoard == null || route.timeWalk == null || route.transferCount == null) {
      return null;
    }

    const minutes = parseInt(route.timeOnBoard, 10) + parseInt(route.timeWalk, 10);
    const transfers = parseInt(route.transferCount, 10);
    if (Number.isNaN(minutes) || Number.isNaN(transfers)) return null;

    return { minutes, transfers, source: 'ekispert' };
  } catch (err) {
    console.error('[ekispert] route fetch failed', err);
    return null;
  }
}
