import type { SearchInput, RankedVenue, FormalityBand } from './types';
import { budgetToFormality, ROLE_FORMALITY } from './types';

type DbVenue = {
  id: string;
  slug: string;
  name: string;
  nameKana: string | null;
  genre: string;
  area: string;
  address: string;
  nearestStation: string;
  walkMinutes: number;
  lat: string | null;
  lng: string | null;
  budgetMin: number;
  budgetMax: number;
  photoUrl: string | null;
  websiteUrl: string | null;
  phone: string | null;
  formalityGrade: string;
  privateRoomType: string;
  privateRoomNote: string | null;
  beerAffiliation: string;
  beerConfidence: string;
  beerSourceUrl: string | null;
  tags: string[];
  requiresReservation: boolean;
  curationNote: string | null;
  source: string;
  createdAt: Date;
  updatedAt: Date;
};

type DbBrandRule = {
  id: string;
  company: string;
  affiliation: string;
  effect: string;
  label: string;
};

type DbCompany = {
  id: string;
  slug: string;
  name: string;
  nameKana: string | null;
  industry: string;
  initial: string;
  drinkAffiliation: string;
  memo: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type DbGuest = {
  id: string;
  companyId: string;
  name: string;
  nameKana: string | null;
  title: string;
  preferences: string[];
  ngFoods: string[];
  memo: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  freq: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type DbRecord = {
  id: string;
  venueId: string | null;
  guestId: string | null;
  decidedAt: Date;
  rating: number | null;
  wentWell: string | null;
  reflection: string | null;
  businessOutcome: string | null;
  createdAt: Date;
};

// 役職×目的から要求格式バンドを導出
function requiredFormality(roles: string[], purposes: string[]): FormalityBand {
  const highRoles = roles.filter((r) => ROLE_FORMALITY[r] === 'S');
  if (highRoles.length > 0) return 'S';
  const midRoles = roles.filter((r) => ROLE_FORMALITY[r] === 'A');
  if (midRoles.length > 0) return 'A';
  // 目的で補正
  if (purposes.includes('新規開拓') || purposes.includes('謝罪')) return 'A';
  return 'B';
}

// 格式判定の精緻化（A軸 格式の釣り合い）
function formalityScore(venueGrade: string, required: FormalityBand): { score: number; percent: number; reason: string } {
  const order: Record<string, number> = { B: 0, A: 1, S: 2 };
  const vOrd = order[venueGrade] ?? 0;
  const rOrd = order[required] ?? 0;

  if (vOrd === rOrd) {
    return { score: 30, percent: 100, reason: `格式${venueGrade}：ゲストの役職・目的に完全に適合` };
  }
  if (vOrd > rOrd) {
    return { score: 20, percent: 75, reason: `格式${venueGrade}：要求の${required}に対して十分な格式（やや恐縮させる可能性があります）` };
  }
  // vOrd < rOrd
  if (vOrd === rOrd - 1) {
    return { score: 5, percent: 40, reason: `格式${venueGrade}：要求格式${required}に対して一段階不足（事前確認を推奨）` };
  }
  return { score: -45, percent: 10, reason: `格式${venueGrade}：要求格式${required}に対して不足しており、失礼にあたるリスクが高いです` };
}

// 予算判定（予算軸）
function budgetScore(venue: DbVenue, input: SearchInput): { score: number; percent: number; reason: string } {
  const maxOk = venue.budgetMax <= input.budgetMax;
  const minOk = venue.budgetMin >= input.budgetMin;

  if (maxOk && minOk) {
    return { score: 30, percent: 100, reason: `予算${venue.budgetMin.toLocaleString()}〜${venue.budgetMax.toLocaleString()}円：ご指定の範囲内` };
  }
  if (maxOk) {
    return { score: 20, percent: 70, reason: `予算上限内ですが、下限（${venue.budgetMin.toLocaleString()}円）は想定レンジを下回ります` };
  }
  return { score: -30, percent: 20, reason: `予算範囲外（${venue.budgetMax.toLocaleString()}円）：上限金額（${input.budgetMax.toLocaleString()}円）の超過` };
}

// ビール飲料（G軸 相手企業・業界タブー）
function beerScore(
  venue: DbVenue,
  input: SearchInput,
  brandRules: DbBrandRule[],
): { score: number; percent: number; badge: 'OK' | '注意' | 'NG'; reason: string } {
  // 1. 企業名から brand_rules で競合判定
  if (input.companyName) {
    const rules = brandRules.filter((r) => r.company === input.companyName);
    for (const rule of rules) {
      if (rule.affiliation === venue.beerAffiliation) {
        if (rule.effect === 'ng') {
          if (venue.beerConfidence === 'confirmed') {
            return { score: -50, percent: 0, badge: 'NG', reason: `${rule.label}専売：${input.companyName}様との競合飲料タブー（致命的）` };
          }
          return { score: -20, percent: 30, badge: '注意', reason: `${rule.label}の可能性あり（要予約時確認）` };
        }
        if (rule.effect === 'prefer') {
          return { score: 20, percent: 100, badge: 'OK', reason: `${rule.label}取扱い：${input.companyName}様会食に適合` };
        }
      }
    }
  }

  // 2. 手動除外（competition beer filter）
  const { mode, makers } = input.beerExclude;
  if (makers.length > 0 && venue.beerAffiliation !== 'unknown' && venue.beerAffiliation !== 'mixed') {
    const hit = makers.includes(venue.beerAffiliation);
    if (mode === 'exclude' && hit) {
      return { score: -30, percent: 10, badge: 'NG', reason: `手動除外指定のビール（${venue.beerAffiliation}）を取扱い` };
    }
    if (mode === 'keep' && !hit) {
      return { score: -30, percent: 10, badge: 'NG', reason: `指定以外のビール（${venue.beerAffiliation}）を取扱い` };
    }
  }

  // 3. 不明
  if (venue.beerAffiliation === 'unknown' || venue.beerConfidence === 'unknown') {
    return { score: 0, percent: 50, badge: '注意', reason: 'ビール系統不明：予約時に提供銘柄をご確認ください' };
  }

  return { score: 0, percent: 100, badge: 'OK', reason: '' };
}

// 個室の質（B軸 個室の"質"）
function privateRoomScore(
  venue: DbVenue,
  input: SearchInput,
): { score: number; percent: number; isAttention: boolean; reason: string } {
  const isSenior = input.roles.includes('役員・経営層') || input.roles.includes('部長');

  if (venue.privateRoomType === '完全個室') {
    return { score: 15, percent: 100, isAttention: false, reason: '完全個室：壁と扉の完全個室で、機密性の高い商談も安心です' };
  }

  if (venue.privateRoomType === '半個室') {
    return { score: 5, percent: 70, isAttention: false, reason: '半個室：適度に遮断された空間でお話しがしやすい環境です' };
  }

  if (venue.privateRoomType === '座敷') {
    if (isSenior) {
      // 役職の高いゲストにとって、長時間の正座は足腰の大きな負担になり得るため警告
      return { score: -30, percent: 20, isAttention: true, reason: '座敷（正座）：役職の高いゲストにとって負担となる可能性があります（椅子・掘りごたつ推奨）' };
    }
    return { score: 5, percent: 50, isAttention: false, reason: '座敷個室：伝統的な和の座敷での案内です' };
  }

  return { score: 0, percent: 0, isAttention: false, reason: '個室なし：テーブル席などオープンな空間でのご案内です' };
}

// 立地・動線（D軸 立地・動線）
function locationScore(venue: DbVenue, input: SearchInput): { score: number; percent: number; reason: string } {
  let score = 0;
  let percent = 80;
  const reasons = [];

  // 駅からの距離
  if (venue.walkMinutes <= 2) {
    score += 10;
    percent = Math.min(100, percent + 20);
    reasons.push(`駅から徒歩${venue.walkMinutes}分：非常に駅近で移動がスムーズです`);
  } else if (venue.walkMinutes >= 5) {
    score -= 5;
    percent = Math.max(10, percent - 20);
    reasons.push(`駅から徒歩${venue.walkMinutes}分：最寄駅から少し離れています（当日はタクシー考慮）`);
  } else {
    score += 5;
    percent = Math.min(100, percent + 5);
    reasons.push(`駅から徒歩${venue.walkMinutes}分：十分に近く移動しやすい立地です`);
  }

  // ゲスト拠点との距離感
  if (input.guestBase) {
    const isClose = venue.area.includes(input.guestBase) || venue.nearestStation.includes(input.guestBase) || input.guestBase.includes(venue.area) || input.guestBase.includes(venue.nearestStation);
    if (isClose) {
      score += 15;
      percent = Math.min(100, Math.round(percent + 20));
      reasons.unshift(`拠点（${input.guestBase}）至近のエリアです`);
    } else {
      score -= 5;
      percent = Math.max(10, Math.round(percent - 10));
      reasons.unshift(`拠点（${input.guestBase}）からの移動距離にご注意ください`);
    }
  }

  // 参加人数
  if (input.partySize && input.partySize >= 6) {
    score -= 10;
    percent = Math.max(10, Math.round(percent - 15));
    reasons.push(`【注意】${input.partySize}名以上の大人数利用：予約時に十分な広さの個室があるか確認推奨`);
  }

  return { score, percent: Math.round(percent), reason: reasons.join(' / ') };
}

// シーン・アライメント（F軸 シーン適合 × E軸 料理）
function sceneScore(
  venue: DbVenue,
  input: SearchInput,
): { score: number; percent: number; reason: string } {
  // 謝罪目的の場合
  if (input.purposes.includes('謝罪')) {
    if (['焼肉', 'イタリアン', '中華'].includes(venue.genre)) {
      return { score: -30, percent: 10, reason: '謝罪会食：カジュアルまたは騒がしくなりがちなジャンル（焼肉・イタリアン・中華）です（和食個室推奨）' };
    }
    if (venue.privateRoomType !== '完全個室') {
      return { score: -20, percent: 20, reason: '謝罪会食：静かに話し合えないオープン席または半個室です' };
    }
    if (['日本料理', '釜飯', '懐石', '割烹', '寿司'].includes(venue.genre) && venue.privateRoomType === '完全個室') {
      return { score: 20, percent: 100, reason: '謝罪会食：厳かで静粛な雰囲気が保てる、完全個室かつ確かな和食処です' };
    }
    return { score: 0, percent: 50, reason: '謝罪会食：誠意が伝わる静かな名店か、念入りな事前確認を推奨' };
  }

  // 関係強化・新規開拓
  if (input.purposes.includes('関係強化') || input.purposes.includes('新規開拓')) {
    const hasWineOrSake = venue.tags.includes('日本酒充実') || venue.tags.includes('ワイン充実');
    if (hasWineOrSake) {
      return { score: 15, percent: 100, reason: 'お酒の強み：豊富な酒種（日本酒・ワイン等）で会食が盛り上がります' };
    }
    if (venue.tags.includes('隠れ家') || venue.tags.includes('少人数向き')) {
      return { score: 15, percent: 95, reason: '隠れ家的な店舗：プライベートな会話が弾みやすく関係性の融和に有効です' };
    }
    if (venue.tags.includes('会食向き')) {
      return { score: 10, percent: 90, reason: '店舗の品格：会食向きと定評のある行き届いたサービスが期待できます' };
    }
  }

  // 御礼・慰労・お祝い
  if (input.purposes.includes('御礼') || input.purposes.includes('慰労') || input.purposes.includes('祝い事にも')) {
    if (venue.tags.includes('フレンチの名店') || venue.tags.includes('記念日') || venue.tags.includes('祝い事にも')) {
      return { score: 15, percent: 95, reason: '特別なシーン：感謝や労いを伝えるのにふさわしい、華やかで美しいお料理を提供します' };
    }
  }

  return { score: 10, percent: 70, reason: '定番のビジネス会食に適したジャンルと店舗雰囲気です' };
}

// 過去の会食履歴・フィードバック連携（C軸/H軸/I軸 重複回避と社内評判）
function historyScore(
  venue: DbVenue,
  input: SearchInput,
  records?: DbRecord[],
  guests?: DbGuest[],
  companies?: DbCompany[],
): { score: number; percent: number; reason: string } {
  if (!records || records.length === 0) {
    return { score: 0, percent: 70, reason: '' };
  }

  let finalScore = 0;
  let finalPercent = 70;
  const reasons: string[] = [];

  // 1. パーソナライズ（特定ゲストの重複回避）
  if (input.guestId) {
    const guestRecords = records.filter((r) => r.venueId === venue.id && r.guestId === input.guestId);
    if (guestRecords.length > 0) {
      finalScore -= 30;
      finalPercent = Math.max(10, finalPercent - 50);
      reasons.push(`重複回避（本人）：対象ゲストご本人が過去にこの店舗で会食を受けています`);
    }
  }

  // 2. 相手企業全体の重複回避
  if (input.companyName && !reasons.some(r => r.includes('重複回避（本人）'))) {
    const companyObj = companies?.find((c) => c.name === input.companyName || c.slug === input.companyName);
    if (companyObj) {
      const targetGuestIds = guests?.filter((g) => g.companyId === companyObj.id).map((g) => g.id) || [];
      const companyRecordsAtVenue = records.filter(
        (r) => r.venueId === venue.id && r.guestId && targetGuestIds.includes(r.guestId)
      );

      if (companyRecordsAtVenue.length > 0) {
        finalScore -= 15;
        finalPercent = Math.max(10, finalPercent - 30);
        reasons.push(`重複回避：${input.companyName}様（別の方）との会食に本店舗を利用した実績があります`);
      }
    }
  }

  // 2. この店に対する社内全体のフィードバック集計（C軸/H軸）
  const allRecordsAtVenue = records.filter((r) => r.venueId === venue.id);
  const ratings = allRecordsAtVenue.map((r) => r.rating).filter((val): val is number => val !== null);

  if (ratings.length > 0) {
    const avgRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
    if (avgRating >= 4.0) {
      finalScore += 15;
      finalPercent = Math.min(100, finalPercent + 30);
      reasons.push(`社内高評価：過去の社内利用（平均★${avgRating.toFixed(1)} / ${ratings.length}件）にて好評を博しています`);
    } else if (avgRating <= 2.5) {
      finalScore -= 20;
      finalPercent = Math.max(10, finalPercent - 40);
      reasons.push(`過去トラブル注意：社内の評価実績が低め（平均★${avgRating.toFixed(1)}）です`);
    } else {
      reasons.push(`社内利用実績：過去に社内で${ratings.length}回利用されています（平均★${avgRating.toFixed(1)}）`);
    }
  }

  return {
    score: finalScore,
    percent: finalPercent,
    reason: reasons.join('、'),
  };
}

// NG食物適合判定
function ngFoodScore(
  venue: DbVenue,
  input: SearchInput
): { score: number; percent: number; isAttention: boolean; reason: string } {
  if (!input.ngFoods || input.ngFoods.length === 0) {
    return { score: 0, percent: 100, isAttention: false, reason: '' };
  }

  const ngMatched: string[] = [];
  for (const ng of input.ngFoods) {
    const cleanNg = ng.trim();
    if (!cleanNg) continue;
    const regex = new RegExp(cleanNg, 'i');
    if (regex.test(venue.genre) || venue.tags.some(tag => regex.test(tag))) {
      ngMatched.push(cleanNg);
    }
  }

  if (ngMatched.length > 0) {
    return {
      score: -45,
      percent: 15,
      isAttention: true,
      reason: `NG食材注意：ゲストの苦手・NG食材である【${ngMatched.join(', ')}】が含まれる懸念があります`
    };
  }

  return { score: 0, percent: 100, isAttention: false, reason: '' };
}

const normalize = (str: string) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[\u3041-\u3096]/g, (match) => String.fromCharCode(match.charCodeAt(0) + 0x60))
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (match) => String.fromCharCode(match.charCodeAt(0) - 0xFEE0));
};

export function rankVenues(
  venues: DbVenue[],
  input: SearchInput,
  brandRules: DbBrandRule[],
  records?: DbRecord[],
  guests?: DbGuest[],
  companies?: DbCompany[],
): RankedVenue[] {
  const reqFormality = requiredFormality(input.roles, input.purposes);

  const results: RankedVenue[] = [];

  const normKeyword = input.keyword ? normalize(input.keyword) : '';

  for (const v of venues) {
    if (normKeyword) {
      const match = normalize(v.name).includes(normKeyword) ||
        normalize(v.nameKana ?? '').includes(normKeyword) ||
        normalize(v.address).includes(normKeyword) ||
        normalize(v.nearestStation).includes(normKeyword) ||
        normalize(v.genre).includes(normKeyword) ||
        v.tags.some(t => normalize(t).includes(normKeyword));
      if (!match) continue;
    }

    // --- エリアフィルタ ---
    if (input.area && v.area !== input.area) continue;

    // --- ジャンルフィルタ ---
    if (input.genres.length > 0 && !input.genres.includes(v.genre)) continue;

    // --- 個室フィルタ ---
    if (input.privateRoom && v.privateRoomType === 'なし') continue;
    if (input.quietRoom && !['完全個室'].includes(v.privateRoomType)) continue;

    // --- スコアリング ---
    const fmt = formalityScore(v.formalityGrade, reqFormality);
    const bud = budgetScore(v, input);
    const beer = beerScore(v, input, brandRules);
    const room = privateRoomScore(v, input);
    const loc = locationScore(v, input);
    const scene = sceneScore(v, input);
    const hist = historyScore(v, input, records, guests, companies);
    const ngFood = ngFoodScore(v, input);

    // 加減点の合算
    const totalRaw = fmt.score + bud.score + beer.score + room.score + loc.score + scene.score + hist.score + ngFood.score;
    const totalScore = Math.max(0, Math.min(100, totalRaw));

    // バッジ判定
    const badge = beer.badge === 'NG' ? 'NG'
      : beer.badge === '注意' ? '注意'
        : room.isAttention || ngFood.isAttention ? '注意'
          : totalScore >= 60 ? 'OK' : '注意';

    // 理由文の統合
    const reasons = [
      fmt.reason,
      bud.reason,
      beer.reason,
      room.reason,
      loc.reason,
      scene.reason,
      hist.reason,
      ngFood.reason
    ].filter((r) => r !== '');

    // 4軸レーティングバーの返り値の構築
    const roomUrlSafePercent = Math.max(0, Math.min(100, Math.round((room.percent + beer.percent) / 2)));
    const bars = [
      { label: '好み・シーン', val: Math.round((scene.percent + hist.percent + ngFood.percent) / 3) },
      { label: '格式', val: fmt.percent },
      { label: '予算', val: bud.percent },
      { label: '個室・ドリンク', val: roomUrlSafePercent },
    ];

    results.push({
      id: v.id,
      slug: v.slug,
      name: v.name,
      genre: v.genre,
      area: v.area,
      address: v.address,
      nearestStation: v.nearestStation,
      walkMinutes: v.walkMinutes,
      budgetMin: v.budgetMin,
      budgetMax: v.budgetMax,
      photoUrl: v.photoUrl,
      websiteUrl: v.websiteUrl,
      phone: v.phone,
      formalityGrade: v.formalityGrade,
      privateRoomType: v.privateRoomType,
      privateRoomNote: v.privateRoomNote,
      beerAffiliation: v.beerAffiliation,
      beerConfidence: v.beerConfidence,
      tags: v.tags,
      requiresReservation: v.requiresReservation,
      curationNote: v.curationNote,
      score: totalScore,
      badge,
      reasons,
      bars,
    });
  }

  // NG は後ろ、同バッジ内はスコア降順
  results.sort((a, b) => {
    const badgeOrder = { OK: 0, '注意': 1, NG: 2 };
    const ba = badgeOrder[a.badge];
    const bb = badgeOrder[b.badge];
    if (ba !== bb) return ba - bb;
    return b.score - a.score;
  });

  return results;
}
