import { supabase } from './supabaseClient';

type SyncItem = {
  table: 'deliveries' | 'learnings' | 'todos' | 'interview_notes';
  operation: 'create' | 'update' | 'delete';
  data: any;
  retries: number;
};

class SyncQueue {
  private queue: SyncItem[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;
  private isProcessing = false;
  private readonly BATCH_INTERVAL = 5000; // 5秒批量同步一次
  private readonly MAX_RETRIES = 3;

  async getCurrentUserId(): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  }

  enqueue(item: Omit<SyncItem, 'retries'>) {
    this.queue.push({ ...item, retries: 0 });
    this.scheduleProcess();
  }

  private scheduleProcess() {
    if (this.timer) return;
    this.timer = setTimeout(() => this.processQueue(), this.BATCH_INTERVAL);
  }

  private async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;
    this.timer = null;

    const userId = await this.getCurrentUserId();
    if (!userId) {
      this.isProcessing = false;
      return;
    }

    // 去重：同一ID同一表的更新，只保留最后一次
    const deduped = this.deduplicate(this.queue);
    this.queue = [];

    for (const item of deduped) {
      try {
        await this.syncItem(item, userId);
      } catch (error: any) {
        if (error.status === 503 || error.status === 429 || error.status >= 500) {
          // 服务端错误，重试
          if (item.retries < this.MAX_RETRIES) {
            const delay = Math.pow(2, item.retries) * 1000; // 1s, 2s, 4s
            setTimeout(() => {
              this.queue.push({ ...item, retries: item.retries + 1 });
              this.scheduleProcess();
            }, delay);
          } else {
            console.error('Sync failed after max retries:', item);
          }
        } else {
          console.error('Sync error:', error);
        }
      }
    }

    this.isProcessing = false;

    // 如果队列里还有数据（重试加入的），继续调度
    if (this.queue.length > 0) {
      this.scheduleProcess();
    }
  }

  private deduplicate(items: SyncItem[]): SyncItem[] {
    const map = new Map<string, SyncItem>();
    for (const item of items) {
      const key = `${item.table}:${item.data.id}`;
      map.set(key, item); // 后面的覆盖前面的
    }
    return Array.from(map.values());
  }

  private async syncItem(item: SyncItem, userId: string) {
    const { table, operation, data } = item;

    if (operation === 'delete') {
      await supabase.from(table).delete().eq('id', data.id).eq('user_id', userId);
      return;
    }

    const payload = this.buildPayload(table, data, userId);

    if (operation === 'create') {
      // 先检查是否存在，避免重复插入
      const { data: existing } = await supabase.from(table).select('id').eq('id', data.id).eq('user_id', userId).maybeSingle();
      if (existing) {
        await supabase.from(table).update(payload).eq('id', data.id).eq('user_id', userId);
      } else {
        await supabase.from(table).insert(payload);
      }
    } else {
      await supabase.from(table).update(payload).eq('id', data.id).eq('user_id', userId);
    }
  }

  private buildPayload(table: string, data: any, userId: string): any {
    switch (table) {
      case 'deliveries':
        return {
          id: data.id,
          user_id: userId,
          company_name: data.companyName,
          position_name: data.positionName,
          delivery_method: data.deliveryMethod,
          delivery_date: data.deliveryDate,
          interview_date: data.interviewDate,
          status: data.status,
          industry_name: data.industryName || null,
          position_type_name: data.positionTypeName || null,
          location: data.location || null,
          salary: data.salary || null,
          remark: data.remark || null,

          links: data.links || [],
          files: data.files || [],
          timeline: data.timeline || [],
          sort_order: data.sortOrder || 0,
          created_at: data.createdAt,
          updated_at: data.updatedAt,
        };
      case 'learnings':
        return {
          id: data.id,
          user_id: userId,
          type: data.type,
          original_name: data.originalName,
          category_id: data.categoryId,
          created_at: data.createdAt,
        };
      case 'todos':
        return {
          id: data.id,
          user_id: userId,
          delivery_id: data.deliveryId,
          company_name: data.companyName,
          position_name: data.positionName,
          content: data.content,
          completed: data.completed,
          due_date: data.dueDate || null,
          priority: data.priority,
          sort_order: data.sortOrder || 0,
          created_at: data.createdAt,
          updated_at: data.updatedAt,
        };
      case 'interview_notes':
        return {
          id: data.id,
          user_id: userId,
          delivery_id: data.deliveryId,
          company_name: data.companyName,
          position_name: data.positionName,
          title: data.title,
          interview_round: data.interviewRound,
          interviewer: data.interviewer,
          interview_date: data.interviewDate || null,
          content: data.content,
          sort_order: data.sortOrder || 0,
          created_at: data.createdAt,
          updated_at: data.updatedAt,
        };
      default:
        return data;
    }
  }

  // 立即同步（用于手动触发）
  async flush() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    await this.processQueue();
  }
}

export const syncQueue = new SyncQueue();
