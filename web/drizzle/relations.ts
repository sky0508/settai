import { relations } from "drizzle-orm/relations";
import { companies, guests, users, venues, venueTags, tags, favorites, reservations, guestTags, records } from "./schema";

export const guestsRelations = relations(guests, ({one, many}) => ({
	company: one(companies, {
		fields: [guests.companyId],
		references: [companies.id]
	}),
	user: one(users, {
		fields: [guests.ownerId],
		references: [users.id]
	}),
	reservations: many(reservations),
	guestTags: many(guestTags),
	records: many(records),
}));

export const companiesRelations = relations(companies, ({one, many}) => ({
	guests: many(guests),
	user: one(users, {
		fields: [companies.ownerId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	guests: many(guests),
	favorites: many(favorites),
	reservations: many(reservations),
	companies: many(companies),
	venues: many(venues),
	records: many(records),
}));

export const venueTagsRelations = relations(venueTags, ({one}) => ({
	venue: one(venues, {
		fields: [venueTags.venueId],
		references: [venues.id]
	}),
	tag: one(tags, {
		fields: [venueTags.tagId],
		references: [tags.id]
	}),
}));

export const venuesRelations = relations(venues, ({one, many}) => ({
	venueTags: many(venueTags),
	favorites: many(favorites),
	reservations: many(reservations),
	user: one(users, {
		fields: [venues.ownerId],
		references: [users.id]
	}),
	records: many(records),
}));

export const tagsRelations = relations(tags, ({many}) => ({
	venueTags: many(venueTags),
	guestTags: many(guestTags),
}));

export const favoritesRelations = relations(favorites, ({one}) => ({
	venue: one(venues, {
		fields: [favorites.venueId],
		references: [venues.id]
	}),
	user: one(users, {
		fields: [favorites.userId],
		references: [users.id]
	}),
}));

export const reservationsRelations = relations(reservations, ({one}) => ({
	user: one(users, {
		fields: [reservations.ownerId],
		references: [users.id]
	}),
	venue: one(venues, {
		fields: [reservations.venueId],
		references: [venues.id]
	}),
	guest: one(guests, {
		fields: [reservations.guestId],
		references: [guests.id]
	}),
}));

export const guestTagsRelations = relations(guestTags, ({one}) => ({
	guest: one(guests, {
		fields: [guestTags.guestId],
		references: [guests.id]
	}),
	tag: one(tags, {
		fields: [guestTags.tagId],
		references: [tags.id]
	}),
}));

export const recordsRelations = relations(records, ({one}) => ({
	venue: one(venues, {
		fields: [records.venueId],
		references: [venues.id]
	}),
	guest: one(guests, {
		fields: [records.guestId],
		references: [guests.id]
	}),
	user: one(users, {
		fields: [records.ownerId],
		references: [users.id]
	}),
}));