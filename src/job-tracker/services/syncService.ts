import { supabase } from './supabaseClient';
import { getDb } from './db';

async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
}

// 带重试的 Supabase 查询
async function retryQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  maxRetries = 3,
  delay = 2000
): Promise<T | null> {
  for (let i = 0; i < maxRetries; i++) {
    const { data, error } = await queryFn();
    if (!error) return data;
    
    console.warn(`[Retry] 第 ${i + 1}/${maxRetries} 次重试...`, error.message);
    if (i < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Supabase 服务暂时不可用，请稍后重试');
}

// 同步单张表：插入新增 + 删除云端多余
async function syncTable<T extends { id: string }>(
  tableName: string,
  localItems: T[],
  userId: string,
  toRow: (item: T) => any
): Promise<{ inserted: number; deleted: number }> {
  console.log(`[Sync] ${tableName}: 本地 ${localItems.length} 条`);

  // 1. 获取云端该用户的所有记录
  const cloudItems = await retryQuery(() =>
    supabase
      .from(tableName)
      .select('id')
      .eq('user_id', userId)
  );

  const cloudIds = new Set(cloudItems?.map((d: any) => d.id) || []);
  const localIds = new Set(localItems.map(d => d.id));

  // 2. 需要插入的：本地有但云端没有
  const toInsert = localItems.filter(d => !cloudIds.has(d.id));
  console.log(`[Sync] ${tableName}: 需要插入 ${toInsert.length} 条`);

  let inserted = 0;
  if (toInsert.length > 0) {
    const { error } = await supabase.from(tableName).insert(toInsert.map(toRow));
    if (error) {
      console.error(`[Sync] ${tableName} 插入失败:`, error);
      throw new Error(`${tableName} 插入失败: ${error.message}`);
    }
    inserted = toInsert.length;
    console.log(`[Sync] ${tableName}: 插入成功 ${inserted} 条`);
  }

  // 3. 需要删除的：云端有但本地没有
  const toDelete = Array.from(cloudIds).filter(id => !localIds.has(id));
  console.log(`[Sync] ${tableName}: 需要删除 ${toDelete.length} 条`);

  let deleted = 0;
  if (toDelete.length > 0) {
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('user_id', userId)
      .in('id', toDelete);
    if (error) {
      console.error(`[Sync] ${tableName} 删除失败:`, error);
      throw new Error(`${tableName} 删除失败: ${error.message}`);
    }
    deleted = toDelete.length;
    console.log(`[Sync] ${tableName}: 删除成功 ${deleted} 条`);
  }

  return { inserted, deleted };
}

export async function syncLocalDataToCloud(): Promise<{
  deliveries: { inserted: number; deleted: number };
  todos: { inserted: number; deleted: number };
  interviewNotes: { inserted: number; deleted: number };
}> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('未登录，无法同步');

  console.log('[Sync] 开始双向同步，用户ID:', userId);

  // 1. 同步投递记录
  const db = getDb();
  const localDeliveries = await db.deliveries.toArray();
  const deliveryResult = await syncTable(
    'deliveries',
    localDeliveries,
    userId,
    (d) => ({
      id: d.id,
      user_id: userId,
      company_name: d.companyName,
      position_name: d.positionName,
      delivery_method: d.deliveryMethod,
      delivery_date: d.deliveryDate,
      interview_date: d.interviewDate,
      status: d.status,
      industry_name: d.industryName || null,
      position_type_name: d.positionTypeName || null,
      location: d.location || null,
      salary: d.salary || null,
      remark: d.remark || null,
      links: d.links || [],
      files: d.files || [],
      timeline: d.timeline || [],
      sort_order: d.sortOrder || 0,
      created_at: d.createdAt,
      updated_at: d.updatedAt,
    })
  );

  // 2. 同步待办事项
  const localTodos = await db.todos.toArray();
  const todoResult = await syncTable(
    'todos',
    localTodos,
    userId,
    (t) => ({
      id: t.id,
      user_id: userId,
      delivery_id: t.deliveryId || null,
      company_name: t.companyName || null,
      position_name: t.positionName || null,
      content: t.content,
      completed: t.completed,
      due_date: t.dueDate || null,
      priority: t.priority,
      sort_order: t.sortOrder || 0,
      created_at: t.createdAt,
      updated_at: t.updatedAt,
    })
  );

  // 3. 同步面经记录
  const localNotes = await db.interviewNotes.toArray();
  const noteResult = await syncTable(
    'interview_notes',
    localNotes,
    userId,
    (n) => ({
      id: n.id,
      user_id: userId,
      delivery_id: n.deliveryId || null,
      company_name: n.companyName || null,
      position_name: n.positionName || null,
      round: n.interviewRound || null,
      interviewer: n.interviewer || null,
      content: n.content,
      sort_order: n.sortOrder || 0,
      created_at: n.createdAt,
      updated_at: n.updatedAt,
    })
  );

  console.log('[Sync] 双向同步完成:', {
    deliveries: deliveryResult,
    todos: todoResult,
    interviewNotes: noteResult,
  });

  return {
    deliveries: deliveryResult,
    todos: todoResult,
    interviewNotes: noteResult,
  };
}

// 检查本地是否有数据
export async function checkLocalDataExists(): Promise<boolean> {
  const db = getDb();
  const deliveryCount = await db.deliveries.count();
  const todoCount = await db.todos.count();
  const noteCount = await db.interviewNotes.count();
  return deliveryCount > 0 || todoCount > 0 || noteCount > 0;
}

// 检查云端是否已有数据
export async function checkCloudDataExists(): Promise<boolean> {
  const userId = await getCurrentUserId();
  if (!userId) return false;

  try {
    const deliveries = await retryQuery(() =>
      supabase.from('deliveries').select('id').eq('user_id', userId).limit(1)
    );

    const todos = await retryQuery(() =>
      supabase.from('todos').select('id').eq('user_id', userId).limit(1)
    );

    const notes = await retryQuery(() =>
      supabase.from('interview_notes').select('id').eq('user_id', userId).limit(1)
    );

    return !!(deliveries?.length || todos?.length || notes?.length);
  } catch (e) {
    console.warn('[checkCloudDataExists] 检查失败:', e);
    return false;
  }
}

// 获取云端数据统计
export async function getCloudDataStats(): Promise<{
  deliveries: number;
  todos: number;
  interviewNotes: number;
}> {
  const userId = await getCurrentUserId();
  if (!userId) return { deliveries: 0, todos: 0, interviewNotes: 0 };

  console.log('[CloudStats] 获取云端统计，用户ID:', userId);

  try {
    const deliveries = await retryQuery(() =>
      supabase.from('deliveries').select('id').eq('user_id', userId)
    );

    const todos = await retryQuery(() =>
      supabase.from('todos').select('id').eq('user_id', userId)
    );

    const notes = await retryQuery(() =>
      supabase.from('interview_notes').select('id').eq('user_id', userId)
    );

    const stats = {
      deliveries: deliveries?.length || 0,
      todos: todos?.length || 0,
      interviewNotes: notes?.length || 0,
    };
    console.log('[CloudStats] 云端统计:', stats);
    return stats;
  } catch (e: any) {
    console.error('[CloudStats] 获取云端统计失败:', e);
    throw new Error('云端服务暂时不可用，请稍后重试');
  }
}
