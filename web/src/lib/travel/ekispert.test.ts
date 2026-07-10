import { describe, it, expect, afterEach, vi } from 'vitest';
import { fetchEkispertRoute } from './ekispert';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('fetchEkispertRoute', () => {
  it('APIキー未設定ならnullを返す（fetchは呼ばない）', async () => {
    vi.stubEnv('EKISPERT_API_KEY', '');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchEkispertRoute('東京', '京橋');

    expect(result).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('正常なレスポンスを分数・乗換回数に変換する', async () => {
    vi.stubEnv('EKISPERT_API_KEY', 'test-key');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ResultSet: {
          Course: {
            Route: { timeOnBoard: '7', timeWalk: '5', transferCount: '1' },
          },
        },
      }),
    }));

    const result = await fetchEkispertRoute('高円寺', '阿佐ヶ谷');

    expect(result).toEqual({ minutes: 12, transfers: 1, source: 'ekispert' });
  });

  it('Courseが配列で返る場合も最初の候補を使う', async () => {
    vi.stubEnv('EKISPERT_API_KEY', 'test-key');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ResultSet: {
          Course: [
            { Route: { timeOnBoard: '10', timeWalk: '3', transferCount: '0' } },
          ],
        },
      }),
    }));

    const result = await fetchEkispertRoute('東京', '品川');

    expect(result).toEqual({ minutes: 13, transfers: 0, source: 'ekispert' });
  });

  it('HTTPエラー時はnullを返す', async () => {
    vi.stubEnv('EKISPERT_API_KEY', 'test-key');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));

    const result = await fetchEkispertRoute('東京', '京橋');

    expect(result).toBeNull();
  });

  it('fetch自体が例外を投げてもnullを返す', async () => {
    vi.stubEnv('EKISPERT_API_KEY', 'test-key');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));

    const result = await fetchEkispertRoute('東京', '京橋');

    expect(result).toBeNull();
  });
});
