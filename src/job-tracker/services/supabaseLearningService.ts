import { supabase } from './supabaseClient';

async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
}

export async function recordCompanyIndustry(companyName: string, industryId: string): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId || !companyName || !industryId) return;

  const { data: existing } = await supabase
    .from('learnings')
    .select('*')
    .eq('type', 'company')
    .eq('original_name', companyName)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    if (existing.category_id !== industryId) {
      await supabase
        .from('learnings')
        .update({ category_id: industryId, created_at: new Date().toISOString() })
        .eq('id', existing.id)
        .eq('user_id', userId);
    }
  } else {
    await supabase
      .from('learnings')
      .insert({ user_id: userId, type: 'company', original_name: companyName, category_id: industryId });
  }
}

export async function recordPositionCategory(positionName: string, categoryId: string): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId || !positionName || !categoryId) return;

  const { data: existing } = await supabase
    .from('learnings')
    .select('*')
    .eq('type', 'position')
    .eq('original_name', positionName)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    if (existing.category_id !== categoryId) {
      await supabase
        .from('learnings')
        .update({ category_id: categoryId, created_at: new Date().toISOString() })
        .eq('id', existing.id)
        .eq('user_id', userId);
    }
  } else {
    await supabase
      .from('learnings')
      .insert({ user_id: userId, type: 'position', original_name: positionName, category_id: categoryId });
  }
}

export async function getLearnedIndustry(companyName: string): Promise<string | null> {
  const userId = await getCurrentUserId();
  if (!userId || !companyName) return null;

  const { data } = await supabase
    .from('learnings')
    .select('category_id')
    .eq('type', 'company')
    .eq('original_name', companyName)
    .eq('user_id', userId)
    .maybeSingle();

  return data?.category_id || null;
}

export async function getLearnedPosition(positionName: string): Promise<string | null> {
  const userId = await getCurrentUserId();
  if (!userId || !positionName) return null;

  const { data } = await supabase
    .from('learnings')
    .select('category_id')
    .eq('type', 'position')
    .eq('original_name', positionName)
    .eq('user_id', userId)
    .maybeSingle();

  return data?.category_id || null;
}
