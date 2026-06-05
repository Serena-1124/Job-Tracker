import { supabase } from './supabaseClient';
import { getDb } from './db';

async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
}

export async function restoreFromCloud(): Promise<{
  deliveries: number;
  todos: number;
  interviewNotes: number;
}> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('未登录，无法恢复');

  console.log('[Restore] 开始从云端恢复数据...');

  const db = getDb();
  let deliveryCount = 0;
  let todoCount = 0;
  let noteCount = 0;

  // 1. 恢复投递记录
  const { data: cloudDeliveries, error: dError } = await supabase
    .from('deliveries')
    .select('*')
    .eq('user_id', userId);

  if (dError) throw new Error('获取云端投递记录失败: ' + dError.message);

  if (cloudDeliveries && cloudDeliveries.length > 0) {
    await db.deliveries.clear();
    await db.deliveries.bulkAdd(cloudDeliveries.map(d => ({
      id: d.id,
      companyName: d.company_name,
      positionName: d.position_name,
      deliveryMethod: d.delivery_method,
      deliveryDate: d.delivery_date,
      interviewDate: d.interview_date,
      status: d.status,
      industryName: d.industry_name,
      positionTypeName: d.position_type_name,
      location: d.location,
      salary: d.salary,
      remark: d.remark,
      links: d.links || [],
      files: d.files || [],
      timeline: d.timeline || [],
      sortOrder: d.sort_order || 0,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    })));
    deliveryCount = cloudDeliveries.length;
    console.log('[Restore] 投递记录恢复:', deliveryCount, '条');
  }

  // 2. 恢复待办事项
  const { data: cloudTodos, error: tError } = await supabase
    .from('todos')
    .select('*')
    .eq('user_id', userId);

  if (tError) throw new Error('获取云端待办失败: ' + tError.message);

  if (cloudTodos && cloudTodos.length > 0) {
    await db.todos.clear();
    await db.todos.bulkAdd(cloudTodos.map(t => ({
      id: t.id,
      deliveryId: t.delivery_id,
      companyName: t.company_name,
      positionName: t.position_name,
      content: t.content,
      completed: t.completed,
      dueDate: t.due_date,
      priority: t.priority,
      sortOrder: t.sort_order || 0,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
    })));
    todoCount = cloudTodos.length;
    console.log('[Restore] 待办事项恢复:', todoCount, '条');
  }

  // 3. 恢复面经记录
  const { data: cloudNotes, error: nError } = await supabase
    .from('interview_notes')
    .select('*')
    .eq('user_id', userId);

  if (nError) throw new Error('获取云层面经失败: ' + nError.message);

  if (cloudNotes && cloudNotes.length > 0) {
    await db.interviewNotes.clear();
    await db.interviewNotes.bulkAdd(cloudNotes.map(n => ({
      id: n.id,
      deliveryId: n.delivery_id,
      companyName: n.company_name,
      positionName: n.position_name,
      title: n.title,
      interviewRound: n.interview_round,
      interviewer: n.interviewer,
      interviewDate: n.interview_date,
      content: n.content,
      sortOrder: n.sort_order || 0,
      createdAt: n.created_at,
      updatedAt: n.updated_at,
    })));
    noteCount = cloudNotes.length;
    console.log('[Restore] 面经记录恢复:', noteCount, '条');
  }

  console.log('[Restore] 恢复完成:', { deliveries: deliveryCount, todos: todoCount, interviewNotes: noteCount });
  return {
    deliveries: deliveryCount,
    todos: todoCount,
    interviewNotes: noteCount,
  };
}
