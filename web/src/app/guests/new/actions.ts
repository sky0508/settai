'use server';

import { db } from '@/lib/db/client';
import { companies, guests } from '@/lib/db/schema';
import { redirect } from 'next/navigation';

export async function addCompanyWithGuest(formData: FormData) {
    const companyName = formData.get('company') as string;
    const name = formData.get('name') as string;
    const title = formData.get('title') as string;
    const memoText = formData.get('memo') as string;

    if (!companyName || !name || !title) {
        throw new Error('必須項目が入力されていません。');
    }

    // 1. ビール系列を会社名から自動推測
    let drinkAffiliation = 'none';
    const nameLower = companyName.toLowerCase();
    if (nameLower.includes('キリン')) {
        drinkAffiliation = 'kirin';
    } else if (nameLower.includes('アサヒ')) {
        drinkAffiliation = 'asahi';
    } else if (nameLower.includes('サントリー')) {
        drinkAffiliation = 'suntory';
    } else if (nameLower.includes('サッポロ')) {
        drinkAffiliation = 'sapporo';
    }

    // 2. 会社頭文字
    const initial = companyName.charAt(0) || '無';

    // 3. 一意の slug 生成
    const slug = `c-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    // 4. 会社を挿入
    const [newCompany] = await db.insert(companies).values({
        slug,
        name: companyName,
        industry: '一般企業',
        initial,
        drinkAffiliation,
        memo: `自動作成された取引先マスタです。 ${memoText ? `メモ: ${memoText}` : ''}`,
    }).returning();

    // 5. メモから仮好みを抽出
    const preferences: string[] = [];
    if (memoText.includes('日本酒')) preferences.push('日本酒');
    if (memoText.includes('個室')) preferences.push('個室');
    if (memoText.includes('寿司') || memoText.includes('すし')) preferences.push('寿司');
    if (memoText.includes('天ぷら') || memoText.includes('てんぷら')) preferences.push('天ぷら');
    if (preferences.length === 0) {
        preferences.push('和食'); // デフォルト好み
    }

    // 6. ゲストを挿入
    await db.insert(guests).values({
        companyId: newCompany.id,
        name,
        title,
        preferences,
        ngFoods: [],
        memo: memoText || null,
    });

    redirect('/guests');
}
