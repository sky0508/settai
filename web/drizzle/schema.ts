import { pgTable, uuid, text, foreignKey, jsonb, integer, timestamp, boolean, unique, numeric } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const brandRules = pgTable("brand_rules", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	company: text().notNull(),
	affiliation: text().notNull(),
	effect: text().notNull(),
	label: text().notNull(),
});

export const guests = pgTable("guests", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id").notNull(),
	name: text().notNull(),
	title: text().notNull(),
	preferences: jsonb().default([]).notNull(),
	ngFoods: jsonb("ng_foods").default([]).notNull(),
	memo: text(),
	budgetMin: integer("budget_min"),
	budgetMax: integer("budget_max"),
	freq: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	allergies: jsonb().default([]).notNull(),
	dietary: text(),
	healthNotes: text("health_notes"),
	alcohol: text(),
	origin: text(),
	ownerId: uuid("owner_id"),
	nameKana: text("name_kana"),
	isInternal: boolean("is_internal").default(false).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "guests_company_id_companies_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.ownerId],
			foreignColumns: [users.id],
			name: "guests_owner_id_users_id_fk"
		}).onDelete("set null"),
]);

export const venueTags = pgTable("venue_tags", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	venueId: uuid("venue_id").notNull(),
	tagId: uuid("tag_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.venueId],
			foreignColumns: [venues.id],
			name: "venue_tags_venue_id_venues_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.tagId],
			foreignColumns: [tags.id],
			name: "venue_tags_tag_id_tags_id_fk"
		}).onDelete("cascade"),
]);

export const favorites = pgTable("favorites", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	venueId: uuid("venue_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	userId: uuid("user_id"),
}, (table) => [
	foreignKey({
			columns: [table.venueId],
			foreignColumns: [venues.id],
			name: "favorites_venue_id_venues_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "favorites_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const reservations = pgTable("reservations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	ownerId: uuid("owner_id"),
	venueId: uuid("venue_id"),
	guestId: uuid("guest_id"),
	scheduledAt: timestamp("scheduled_at", { mode: 'string' }),
	status: text().default('pending').notNull(),
	headcount: integer(),
	purpose: text(),
	note: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	companionIds: jsonb("companion_ids").default([]).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.ownerId],
			foreignColumns: [users.id],
			name: "reservations_owner_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.venueId],
			foreignColumns: [venues.id],
			name: "reservations_venue_id_venues_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.guestId],
			foreignColumns: [guests.id],
			name: "reservations_guest_id_guests_id_fk"
		}).onDelete("set null"),
]);

export const guestTags = pgTable("guest_tags", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	guestId: uuid("guest_id").notNull(),
	tagId: uuid("tag_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.guestId],
			foreignColumns: [guests.id],
			name: "guest_tags_guest_id_guests_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.tagId],
			foreignColumns: [tags.id],
			name: "guest_tags_tag_id_tags_id_fk"
		}).onDelete("cascade"),
]);

export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: text().notNull(),
	passwordHash: text("password_hash").notNull(),
	name: text().notNull(),
	companyName: text("company_name"),
	role: text().default('user').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("users_email_unique").on(table.email),
]);

export const tags = pgTable("tags", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	category: text().default('general').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("tags_name_unique").on(table.name),
]);

export const companies = pgTable("companies", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	slug: text().notNull(),
	name: text().notNull(),
	industry: text().notNull(),
	initial: text().notNull(),
	drinkAffiliation: text("drink_affiliation").default('none').notNull(),
	memo: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	ownerId: uuid("owner_id"),
	nameKana: text("name_kana"),
}, (table) => [
	foreignKey({
			columns: [table.ownerId],
			foreignColumns: [users.id],
			name: "companies_owner_id_users_id_fk"
		}).onDelete("set null"),
	unique("companies_slug_unique").on(table.slug),
]);

export const venues = pgTable("venues", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	slug: text().notNull(),
	name: text().notNull(),
	genre: text().notNull(),
	area: text().notNull(),
	address: text().notNull(),
	nearestStation: text("nearest_station").notNull(),
	walkMinutes: integer("walk_minutes").notNull(),
	budgetMin: integer("budget_min").notNull(),
	budgetMax: integer("budget_max").notNull(),
	photoUrl: text("photo_url"),
	websiteUrl: text("website_url"),
	phone: text(),
	formalityGrade: text("formality_grade").notNull(),
	privateRoomType: text("private_room_type").notNull(),
	privateRoomNote: text("private_room_note"),
	beerAffiliation: text("beer_affiliation").notNull(),
	beerConfidence: text("beer_confidence").notNull(),
	beerSourceUrl: text("beer_source_url"),
	tags: jsonb().default([]).notNull(),
	requiresReservation: boolean("requires_reservation").default(false).notNull(),
	curationNote: text("curation_note"),
	source: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	lat: numeric(),
	lng: numeric(),
	formalityOverride: text("formality_override"),
	hasPrivateRoom: boolean("has_private_room").default(false),
	seatStyle: text("seat_style"),
	soundproof: text(),
	ownerId: uuid("owner_id"),
	nameKana: text("name_kana"),
}, (table) => [
	foreignKey({
			columns: [table.ownerId],
			foreignColumns: [users.id],
			name: "venues_owner_id_users_id_fk"
		}).onDelete("set null"),
	unique("venues_slug_unique").on(table.slug),
]);

export const records = pgTable("records", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	venueId: uuid("venue_id"),
	decidedAt: timestamp("decided_at", { mode: 'string' }).defaultNow().notNull(),
	rating: integer(),
	wentWell: text("went_well"),
	reflection: text(),
	businessOutcome: text("business_outcome"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	guestId: uuid("guest_id"),
	purpose: text(),
	partySize: integer("party_size"),
	reservationOk: boolean("reservation_ok"),
	shareScope: text("share_scope").default('self').notNull(),
	ownerId: uuid("owner_id"),
	companionIds: jsonb("companion_ids").default([]).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.venueId],
			foreignColumns: [venues.id],
			name: "records_venue_id_venues_id_fk"
		}),
	foreignKey({
			columns: [table.guestId],
			foreignColumns: [guests.id],
			name: "records_guest_id_guests_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.ownerId],
			foreignColumns: [users.id],
			name: "records_owner_id_users_id_fk"
		}).onDelete("set null"),
]);
