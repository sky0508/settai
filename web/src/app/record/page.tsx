import { db } from '@/lib/db/client';
import { venues, guests, companies } from '@/lib/db/schema';
import RecordForm from './RecordForm';

export default async function RecordPage() {
    const allVenues = await db.select({ id: venues.id, name: venues.name }).from(venues).orderBy(venues.name);
    const allGuests = await db.select({ id: guests.id, name: guests.name, title: guests.title, companyId: guests.companyId }).from(guests).orderBy(guests.name);
    const allComps = await db.select({ id: companies.id, name: companies.name }).from(companies).orderBy(companies.name);

    return (
        <RecordForm
            allVenues={allVenues}
            allGuests={allGuests}
            allComps={allComps}
        />
    );
}
