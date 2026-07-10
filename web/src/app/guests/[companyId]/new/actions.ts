'use server';

import { db } from '@/lib/db/client';
import { companies, guests } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

export async function addGuestToCompany(companySlug: string, formData: FormData) {
    const name = formData.get('name') as string;
    const title = formData.get('title') as string;
    const memoText = formData.get('memo') as string;

    if (!name || !title) {
        throw new Error('氏名と役職は必須項目です。');
    }

    // 1. 会社を slug で取得
    const [company] = await db
        .select()
        .from(companies)
        .where(eq(companies.slug, companySlug))
        .limit(1);

    if (!company) {
        throw new Error('該当する取引先企業が見つかりませんでした。');
    }

    // 2. 拡張フィールド群
    const ngFoodsChecked = formData.getAll('ngFoods').map(s => s.toString().trim()).filter(Boolean);
    const ngFoodsString = formData.get('ngFoodsCustom') as string || '';
    const customNgFoods = ngFoodsString.split(',').map(s => s.trim()).filter(Boolean);
    const ngFoods = Array.from(new Set([...ngFoodsChecked, ...customNgFoods]));

    const allergiesString = formData.get('allergies') as string || '';
    const allergies = allergiesString.split(',').map(s => s.trim()).filter(Boolean);

    const alcohol = formData.get('alcohol') as string || null;
    const dietary = formData.get('dietary') as string || null;
    const healthNotes = formData.get('healthNotes') as string || null;
    const origin = formData.get('origin') as string || null;

    // 3. 好み
    const preferencesChecked = formData.getAll('preferences').map(s => s.toString().trim()).filter(Boolean);

    const preferences = [...preferencesChecked];
    if (memoText.includes('日本酒')) preferences.push('日本酒');
    if (memoText.includes('個室')) preferences.push('個室');
    if (memoText.includes('寿司') || memoText.includes('すし')) preferences.push('寿司');
    if (memoText.includes('ワイン')) preferences.push('ワイン');
    if (preferences.length === 0) {
        preferences.push('和食'); // デフォルト好み
    }
    const finalPreferences = Array.from(new Set(preferences));

    // 4. ゲストを挿入
    await db.insert(guests).values({
        companyId: company.id,
        name,
        title,
        preferences: finalPreferences,
        ngFoods,
        allergies,
        alcohol,
        dietary,
        healthNotes,
        origin,
        memo: memoText || null,
    });

    redirect(`/guests/${companySlug}`);
}
