import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  numeric,
  unique,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  companyName: text('company_name'),
  role: text('role').default('user').notNull(), // admin, user
  // 自社拠点（最適店検索の起点。admin ロール行に保存）
  officeAddress: text('office_address'),
  officeNearestStation: text('office_nearest_station'),
  officeLat: numeric('office_lat'),
  officeLng: numeric('office_lng'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const companies = pgTable('companies', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').unique().notNull(),
  ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  nameKana: text('name_kana'),
  industry: text('industry').notNull(),
  initial: text('initial').notNull(),
  drinkAffiliation: text('drink_affiliation').notNull().default('none'), // kirin/asahi/suntory/sapporo/none
  memo: text('memo'),
  // 企業拠点（本社所在地。お店検索の「相手の拠点（動線）」＆最適店検索の起点に使う）
  address: text('address'),
  nearestStation: text('nearest_station'),
  lat: numeric('lat'),
  lng: numeric('lng'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const guests = pgTable('guests', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  nameKana: text('name_kana'),
  title: text('title').notNull(),
  isInternal: boolean('is_internal').notNull().default(false),
  preferences: jsonb('preferences').$type<string[]>().notNull().default([]),
  ngFoods: jsonb('ng_foods').$type<string[]>().notNull().default([]),
  allergies: jsonb('allergies').$type<string[]>().notNull().default([]),
  dietary: text('dietary'),
  healthNotes: text('health_notes'),
  alcohol: text('alcohol'),
  origin: text('origin'),
  memo: text('memo'),
  budgetMin: integer('budget_min'),
  budgetMax: integer('budget_max'),
  freq: text('freq'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const venues = pgTable('venues', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').unique().notNull(),
  ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  nameKana: text('name_kana'),
  genre: text('genre').notNull(),
  area: text('area').notNull(),
  address: text('address').notNull(),
  nearestStation: text('nearest_station').notNull(),
  walkMinutes: integer('walk_minutes').notNull(),
  lat: numeric('lat'),
  lng: numeric('lng'),
  budgetMin: integer('budget_min').notNull(),
  budgetMax: integer('budget_max').notNull(),
  photoUrl: text('photo_url'), // 代表写真（= photos[0]。map/検索カード等の既存UI用）
  photos: jsonb('photos').$type<string[]>().notNull().default([]), // 店舗写真ギャラリー（最大3枚）
  websiteUrl: text('website_url'),
  phone: text('phone'),
  formalityGrade: text('formality_grade').notNull(), // S/A/B
  formalityOverride: text('formality_override'), // S/A/B
  hasPrivateRoom: boolean('has_private_room').default(false),
  privateRoomType: text('private_room_type').notNull(), // 完全個室/半個室/座敷/なし
  seatStyle: text('seat_style'), // 椅子/掘りごたつ/座敷/混在/unknown
  soundproof: text('soundproof'), // 可/不可/unknown
  privateRoomNote: text('private_room_note'),
  beerAffiliation: text('beer_affiliation').notNull(), // kirin/asahi/suntory/sapporo/mixed/unknown
  beerConfidence: text('beer_confidence').notNull(),   // confirmed/estimated/unknown
  beerSourceUrl: text('beer_source_url'),
  tags: jsonb('tags').$type<string[]>().notNull().default([]),
  requiresReservation: boolean('requires_reservation').notNull().default(false),
  curationNote: text('curation_note'),
  source: text('source').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const brandRules = pgTable('brand_rules', {
  id: uuid('id').defaultRandom().primaryKey(),
  company: text('company').notNull(),
  affiliation: text('affiliation').notNull(),
  effect: text('effect').notNull(), // ng / prefer
  label: text('label').notNull(),
});

export const records = pgTable('records', {
  id: uuid('id').defaultRandom().primaryKey(),
  venueId: uuid('venue_id').references(() => venues.id),
  guestId: uuid('guest_id').references(() => guests.id, { onDelete: 'set null' }),
  companionIds: jsonb('companion_ids').$type<string[]>().notNull().default([]),
  ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'set null' }),
  purpose: text('purpose'),
  partySize: integer('party_size'),
  decidedAt: timestamp('decided_at').defaultNow().notNull(),
  rating: integer('rating'),
  wentWell: text('went_well'),
  reflection: text('reflection'),
  businessOutcome: text('business_outcome'),
  reservationOk: boolean('reservation_ok'),
  shareScope: text('share_scope').default('self').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const favorites = pgTable('favorites', {
  id: uuid('id').defaultRandom().primaryKey(),
  venueId: uuid('venue_id').references(() => venues.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================
// B: Reservations (これからの予定・スケジュール管理)
// ============================================
export const reservations = pgTable('reservations', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'cascade' }),
  venueId: uuid('venue_id').references(() => venues.id, { onDelete: 'set null' }),
  guestId: uuid('guest_id').references(() => guests.id, { onDelete: 'set null' }),
  companionIds: jsonb('companion_ids').$type<string[]>().notNull().default([]),
  scheduledAt: timestamp('scheduled_at'),
  status: text('status').default('pending').notNull(), // pending, confirmed, cancelled, completed
  headcount: integer('headcount'),
  purpose: text('purpose'),
  note: text('note'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================
// C: Tags Master and Relations (タグの正規化)
// ============================================
export const tags = pgTable('tags', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').unique().notNull(),
  category: text('category').default('general').notNull(), // venue_feature, food_preference, atmosphere, etc.
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const venueTags = pgTable('venue_tags', {
  id: uuid('id').defaultRandom().primaryKey(),
  venueId: uuid('venue_id').references(() => venues.id, { onDelete: 'cascade' }).notNull(),
  tagId: uuid('tag_id').references(() => tags.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const guestTags = pgTable('guest_tags', {
  id: uuid('id').defaultRandom().primaryKey(),
  guestId: uuid('guest_id').references(() => guests.id, { onDelete: 'cascade' }).notNull(),
  tagId: uuid('tag_id').references(() => tags.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================
// D: 会食を作る / 日程調整 (LettuceMeet 型・候補日程投票)
// ============================================
// フロー: 主催者が候補スロットを作成 → 参加者が公開URLで空き申告
//        → 主催者が1枠に確定（reservations 行を生成）→ 店紐付け
export const schedulePolls = pgTable('schedule_polls', {
  id: uuid('id').defaultRandom().primaryKey(),
  // login seam: 現状 null 固定。auth 実装時に owner を紐付ける
  ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'set null' }),
  title: text('title').notNull(),                 // 例: "A社 役員会食 日程調整"
  note: text('note'),                             // 参加者に見せる一言
  timezone: text('timezone').notNull().default('Asia/Tokyo'),
  // 2種類のトークン（調整さん方式）: 参加者用 / 主催者用
  publicToken: text('public_token').unique().notNull(),  // /s/<publicToken>
  adminToken: text('admin_token').unique().notNull(),    // /host/<adminToken>
  status: text('status').notNull().default('open'), // open / date_confirmed / venue_decided / cancelled
  confirmedSlotId: uuid('confirmed_slot_id'),     // 確定枠（循環回避のため hard FK にしない・コードで検証）
  reservationId: uuid('reservation_id').references(() => reservations.id, { onDelete: 'set null' }),
  headcountHint: integer('headcount_hint'),       // 想定人数（任意・作成時のヒント）
  purpose: text('purpose'),                       // reservations にコピーする用途
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const scheduleSlots = pgTable('schedule_slots', {
  id: uuid('id').defaultRandom().primaryKey(),
  pollId: uuid('poll_id').references(() => schedulePolls.id, { onDelete: 'cascade' }).notNull(),
  startsAt: timestamp('starts_at').notNull(),     // スロット開始（JST wall-clock を保存）
  slotMinutes: integer('slot_minutes').notNull().default(30),
  sortIndex: integer('sort_index').notNull(),     // グリッド安定ソート
  blocked: boolean('blocked').notNull().default(false), // 主催者が「不可枠」に指定（参加者選択不可・確定候補から除外）
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const scheduleParticipants = pgTable('schedule_participants', {
  id: uuid('id').defaultRandom().primaryKey(),
  pollId: uuid('poll_id').references(() => schedulePolls.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  email: text('email').notNull(),                 // (pollId,email) で upsert
  // guest 台帳紐付け seam: 将来 email → guests 突合でアレルギー/予算を引き継ぐ
  guestId: uuid('guest_id').references(() => guests.id, { onDelete: 'set null' }),
  editToken: text('edit_token').notNull(),        // 本人が自分の回答を再編集する用
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  pollEmailUnique: unique('schedule_participants_poll_email_unique').on(t.pollId, t.email),
}));

export const scheduleResponses = pgTable('schedule_responses', {
  id: uuid('id').defaultRandom().primaryKey(),
  participantId: uuid('participant_id').references(() => scheduleParticipants.id, { onDelete: 'cascade' }).notNull(),
  slotId: uuid('slot_id').references(() => scheduleSlots.id, { onDelete: 'cascade' }).notNull(),
  // MVP: 行の存在 = 参加OK。将来 maybe を足すなら 'yes'/'maybe'
  available: text('available').notNull().default('yes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  participantSlotUnique: unique('schedule_responses_participant_slot_unique').on(t.participantId, t.slotId),
}));

// ============================================
// E: 最適店検索の駅間ルートキャッシュ（okinawa 1050 移植）
// ============================================
export const stationRoutes = pgTable('station_routes', {
  id: uuid('id').defaultRandom().primaryKey(),
  fromStation: text('from_station').notNull(),
  toStation: text('to_station').notNull(),
  minutes: integer('minutes').notNull(),
  transfers: integer('transfers'),
  source: text('source').notNull(), // 'ekispert' | 'heuristic'
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('station_routes_from_to_idx').on(table.fromStation, table.toStation),
]);
