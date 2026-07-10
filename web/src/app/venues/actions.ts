'use server';

import { db } from '@/lib/db/client';
import { venues } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import fs from 'fs';
import path from 'path';

import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper to save uploaded file (Cloudinary if configured, fallback to local)
async function saveUploadedFile(file: File | null): Promise<string | null> {
    if (!file || file.size === 0) return null;
    const buffer = Buffer.from(await file.arrayBuffer());

    if (process.env.CLOUDINARY_CLOUD_NAME) {
        const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                { folder: 'settai', resource_type: 'image' },
                (err, res) => { if (err || !res) reject(err); else resolve(res as { secure_url: string }); }
            ).end(buffer);
        });
        return result.secure_url;
    }

    // ローカルフォールバック（開発環境用）
    const uploadDir = path.join(process.cwd(), 'public/uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    const ext = path.extname(file.name) || '.jpg';
    const fileName = `${crypto.randomUUID()}${ext}`;
    await fs.promises.writeFile(path.join(uploadDir, fileName), buffer);
    return `/uploads/${fileName}`;
}

export async function addVenue(formData: FormData) {
    const name = (formData.get('name') as string).trim();
    const genre = (formData.get('genre') as string).trim();
    const area = (formData.get('area') as string).trim();
    const address = (formData.get('address') as string).trim();
    const nearestStation = (formData.get('nearestStation') as string).trim();
    const walkMinutes = Number(formData.get('walkMinutes') ?? 0);
    const budgetMin = Number(formData.get('budgetMin') ?? 0);
    const budgetMax = Number(formData.get('budgetMax') ?? 0);
    const websiteUrl = (formData.get('websiteUrl') as string || '').trim();
    const phone = (formData.get('phone') as string || '').trim();
    const formalityGrade = formData.get('formalityGrade') as string;
    const privateRoomType = formData.get('privateRoomType') as string;
    const privateRoomNote = (formData.get('privateRoomNote') as string || '').trim();
    const beerAffiliation = formData.get('beerAffiliation') as string;
    const beerConfidence = formData.get('beerConfidence') as string;
    const beerSourceUrl = (formData.get('beerSourceUrl') as string || '').trim();
    const curationNote = (formData.get('curationNote') as string || '').trim();
    const requiresReservation = formData.get('requiresReservation') === 'true';
    const latStr = formData.get('lat') as string;
    const lngStr = formData.get('lng') as string;
    const hasPrivateRoom = formData.get('hasPrivateRoom') === 'true';
    const seatStyle = (formData.get('seatStyle') as string) || null;
    const soundproof = (formData.get('soundproof') as string) || null;
    const formalityOverride = (formData.get('formalityOverride') as string) || null;

    const selectedTags = formData.getAll('tags').map(t => t.toString().trim()).filter(Boolean);
    const tagsCustomStr = (formData.get('tagsCustom') as string || '').trim();
    const customTags = tagsCustomStr ? tagsCustomStr.split(',').map(t => t.trim()).filter(Boolean) : [];
    const tags = Array.from(new Set([...selectedTags, ...customTags]));

    const file = formData.get('photoFile') as File | null;
    const photoUrl = await saveUploadedFile(file);

    const slug = `venue-${crypto.randomUUID().slice(0, 8)}`;

    await db.insert(venues).values({
        slug,
        name,
        genre,
        area,
        address,
        nearestStation,
        walkMinutes,
        budgetMin,
        budgetMax,
        photoUrl,
        photos: photoUrl ? [photoUrl] : [],
        websiteUrl: websiteUrl || null,
        phone: phone || null,
        formalityGrade,
        formalityOverride,
        hasPrivateRoom,
        privateRoomType,
        seatStyle,
        soundproof,
        privateRoomNote: privateRoomNote || null,
        beerAffiliation,
        beerConfidence,
        beerSourceUrl: beerSourceUrl || null,
        tags,
        requiresReservation,
        curationNote: curationNote || null,
        lat: latStr ? latStr : null,
        lng: lngStr ? lngStr : null,
        source: 'user',
    });

    revalidatePath('/search');
    redirect('/search');
}

export async function updateVenue(id: string, formData: FormData) {
    const name = (formData.get('name') as string).trim();
    const genre = (formData.get('genre') as string).trim();
    const area = (formData.get('area') as string).trim();
    const address = (formData.get('address') as string).trim();
    const nearestStation = (formData.get('nearestStation') as string).trim();
    const walkMinutes = Number(formData.get('walkMinutes') ?? 0);
    const budgetMin = Number(formData.get('budgetMin') ?? 0);
    const budgetMax = Number(formData.get('budgetMax') ?? 0);
    const websiteUrl = (formData.get('websiteUrl') as string || '').trim();
    const phone = (formData.get('phone') as string || '').trim();
    const formalityGrade = formData.get('formalityGrade') as string;
    const privateRoomType = formData.get('privateRoomType') as string;
    const privateRoomNote = (formData.get('privateRoomNote') as string || '').trim();
    const beerAffiliation = formData.get('beerAffiliation') as string;
    const beerConfidence = formData.get('beerConfidence') as string;
    const beerSourceUrl = (formData.get('beerSourceUrl') as string || '').trim();
    const curationNote = (formData.get('curationNote') as string || '').trim();
    const requiresReservation = formData.get('requiresReservation') === 'true';
    const latStr = formData.get('lat') as string;
    const lngStr = formData.get('lng') as string;
    const hasPrivateRoom = formData.get('hasPrivateRoom') === 'true';
    const seatStyle = (formData.get('seatStyle') as string) || null;
    const soundproof = (formData.get('soundproof') as string) || null;
    const formalityOverride = (formData.get('formalityOverride') as string) || null;

    const selectedTags = formData.getAll('tags').map(t => t.toString().trim()).filter(Boolean);
    const tagsCustomStr = (formData.get('tagsCustom') as string || '').trim();
    const customTags = tagsCustomStr ? tagsCustomStr.split(',').map(t => t.trim()).filter(Boolean) : [];
    const tags = Array.from(new Set([...selectedTags, ...customTags]));

    // 写真3スロット: 新規アップがあればそれ、無ければ既存URLを維持。photos[] を組み立て photoUrl=1枚目
    const photoSlots: string[] = [];
    for (let i = 0; i < 3; i++) {
        const slotFile = formData.get(`photoFile${i}`) as File | null;
        const existing = (formData.get(`existingPhoto${i}`) as string) || '';
        const uploaded = await saveUploadedFile(slotFile);
        const url = uploaded ?? existing;
        if (url) photoSlots.push(url);
    }

    const updateFields: any = {
        name,
        genre,
        area,
        address,
        nearestStation,
        walkMinutes,
        budgetMin,
        budgetMax,
        websiteUrl: websiteUrl || null,
        phone: phone || null,
        formalityGrade,
        formalityOverride,
        hasPrivateRoom,
        privateRoomType,
        seatStyle,
        soundproof,
        privateRoomNote: privateRoomNote || null,
        beerAffiliation,
        beerConfidence,
        beerSourceUrl: beerSourceUrl || null,
        tags,
        requiresReservation,
        curationNote: curationNote || null,
        lat: latStr ? latStr : null,
        lng: lngStr ? lngStr : null,
        photos: photoSlots,
        photoUrl: photoSlots[0] ?? null,
        updatedAt: new Date(),
    };

    await db.update(venues).set(updateFields).where(eq(venues.id, id));

    revalidatePath(`/venues/${id}`);
    revalidatePath('/search');
    redirect(`/venues/${id}`);
}

export async function deleteVenue(id: string) {
    await db.delete(venues).where(eq(venues.id, id));
    revalidatePath('/search');
    redirect('/search');
}

import { favorites, users } from '@/lib/db/schema';
import { and } from 'drizzle-orm';

export async function toggleFavorite(venueId: string) {
    // 仮実装: 最初のadminユーザーをログインユーザーとみなす
    const [user] = await db.select().from(users).where(eq(users.role, 'admin')).limit(1);
    if (!user) return;

    const existing = await db.select().from(favorites).where(and(eq(favorites.userId, user.id), eq(favorites.venueId, venueId))).limit(1);

    if (existing.length > 0) {
        await db.delete(favorites).where(eq(favorites.id, existing[0].id));
    } else {
        await db.insert(favorites).values({
            userId: user.id,
            venueId: venueId
        });
    }

    revalidatePath(`/venues/${venueId}`);
    revalidatePath('/search');
}
