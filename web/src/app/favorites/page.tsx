import { db } from '@/lib/db/client';
import { venues, favorites, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import FavoritesClient from './FavoritesClient';

export default async function FavoritesPage() {
  const [adminUser] = await db.select({ id: users.id }).from(users).where(eq(users.role, 'admin')).limit(1);

  const favoritedVenues = adminUser ? await db
    .select({
      id: venues.id,
      name: venues.name,
      genre: venues.genre,
      area: venues.area,
      budgetMin: venues.budgetMin,
      budgetMax: venues.budgetMax,
      formalityGrade: venues.formalityGrade,
      privateRoomType: venues.privateRoomType,
      tags: venues.tags,
      nearestStation: venues.nearestStation,
      walkMinutes: venues.walkMinutes,
      photoUrl: venues.photoUrl,
    })
    .from(venues)
    .innerJoin(favorites, and(eq(venues.id, favorites.venueId), eq(favorites.userId, adminUser.id)))
    : [];

  return <FavoritesClient venues={favoritedVenues} />;
}
