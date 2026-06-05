import { v4 as uuidv4 } from 'uuid';
import { getDb, ensureDbInitialized } from './db';
import { syncQueue } from './syncQueue';
import type {
  Delivery,
  DeliveryFilter,
  CreateDeliveryDTO,
  UpdateDeliveryDTO,
  DeliveryStats,
  TimelineEntry,
  DeliveryStatus
} from '../types';
import type { RecycledDelivery } from './db';

export class DeliveryService {
  private createTimelineEntry(from: DeliveryStatus | null, to: DeliveryStatus, note?: string): TimelineEntry {
    return {
      id: uuidv4(),
      time: new Date().toISOString(),
      from,
      to,
      note
    };
  }

  async create(data: CreateDeliveryDTO): Promise<Delivery> {
    const now = new Date().toISOString();
    const initialTimeline = this.createTimelineEntry(null, data.status, '创建投递');
    const maxOrder = await getDb().deliveries.orderBy('sortOrder').last();
    const sortOrder = maxOrder ? maxOrder.sortOrder + 1 : 0;

    const delivery: Delivery = {
      id: uuidv4(),
      companyName: data.companyName,
      positionName: data.positionName,
      deliveryMethod: data.deliveryMethod,
      deliveryDate: data.deliveryDate || now.split('T')[0],
      interviewDate: data.interviewDate,
      status: data.status,
      industryName: data.industryName || '',
      positionTypeName: data.positionTypeName || '',
      location: data.location || '',
      salary: data.salary || '',
      tags: [],
      remark: data.remark,
      links: data.links || [],
      files: data.files || [],
      timeline: [initialTimeline],
      sortOrder,
      createdAt: now,
      updatedAt: now
    };

    await getDb().deliveries.add(delivery);
    syncQueue.enqueue({ table: 'deliveries', operation: 'create', data: delivery });
    return delivery;
  }

  async update(id: string, data: UpdateDeliveryDTO): Promise<Delivery | undefined> {
    const delivery = await getDb().deliveries.get(id);
    if (!delivery) return undefined;

    const now = new Date().toISOString();
    const timeline = [...delivery.timeline];

    if (data.status && data.status !== delivery.status) {
      timeline.push(this.createTimelineEntry(delivery.status, data.status));
    }

    const statusChanged = data.status && data.status !== delivery.status;
    const interviewDateCleared = data.interviewDate === undefined && !statusChanged;

    const updated: Delivery = {
      ...delivery,
      ...data,
      interviewDate: statusChanged || interviewDateCleared ? undefined : (data.interviewDate !== undefined ? data.interviewDate : delivery.interviewDate),
      timeline,
      updatedAt: now
    };

    await getDb().deliveries.put(updated);
    syncQueue.enqueue({ table: 'deliveries', operation: 'update', data: updated });
    return updated;
  }

  async delete(id: string): Promise<void> {
    const delivery = await getDb().deliveries.get(id);
    if (!delivery) return;

    const recycledItem: RecycledDelivery = {
      ...delivery,
      originalId: delivery.id,
      deletedAt: new Date().toISOString(),
      industryName: delivery.industryName,
      positionTypeName: delivery.positionTypeName,
    };
    await getDb().recycleBin.add(recycledItem);
    await getDb().deliveries.delete(id);

    syncQueue.enqueue({ table: 'deliveries', operation: 'delete', data: { id } });
  }

  async restoreFromRecycleBin(originalId: string): Promise<void> {
    const recycled = await getDb().recycleBin.where('originalId').equals(originalId).first();
    if (!recycled) throw new Error('记录不存在或已过期');

    const { deletedAt, originalId: _, ...deliveryData } = recycled;

    await getDb().deliveries.add(deliveryData as Delivery);
    await getDb().recycleBin.delete(recycled.id);

    syncQueue.enqueue({ table: 'deliveries', operation: 'create', data: deliveryData });
  }

  async getRecycleBin(): Promise<RecycledDelivery[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const items = await getDb().recycleBin.toArray();
    return items
      .filter(item => new Date(item.deletedAt) > thirtyDaysAgo)
      .sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime());
  }

  async permanentDeleteFromRecycleBin(originalId: string): Promise<void> {
    const recycled = await getDb().recycleBin.where('originalId').equals(originalId).first();
    if (recycled) {
      await getDb().recycleBin.delete(recycled.id);
    }
  }

  async cleanupExpiredRecycleBin(): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const expiredItems = await getDb().recycleBin
      .where('deletedAt')
      .below(thirtyDaysAgo.toISOString())
      .toArray();

    for (const item of expiredItems) {
      await getDb().recycleBin.delete(item.id);
    }
  }

  async getById(id: string): Promise<Delivery | undefined> {
    await ensureDbInitialized();
    return await getDb().deliveries.get(id);
  }

  async getAll(): Promise<Delivery[]> {
    await ensureDbInitialized();
    return await getDb().deliveries.orderBy('createdAt').reverse().toArray();
  }

  async getByFilter(filter: DeliveryFilter): Promise<Delivery[]> {
    const all = await this.getAll();

    let filtered = all.filter(d => {
      if (filter.keyword) {
        const kw = filter.keyword.toLowerCase();
        if (!d.companyName.toLowerCase().includes(kw) &&
            !d.positionName.toLowerCase().includes(kw)) {
          return false;
        }
      }

      if (filter.status && d.status !== filter.status) return false;
      if (filter.industryName && d.industryName !== filter.industryName) return false;
      if (filter.positionTypeName && d.positionTypeName !== filter.positionTypeName) return false;
      if (filter.location && d.location !== filter.location) return false;
      if (filter.deliveryMethod && d.deliveryMethod !== filter.deliveryMethod) return false;

      if (filter.startDate && d.deliveryDate < filter.startDate) return false;
      if (filter.endDate && d.deliveryDate > filter.endDate) return false;

      return true;
    });

    return filtered;
  }

  async search(keyword: string): Promise<Delivery[]> {
    if (!keyword) return this.getAll();

    const kw = keyword.toLowerCase();
    const all = await this.getAll();

    return all.filter(d =>
      d.companyName.toLowerCase().includes(kw) ||
      d.positionName.toLowerCase().includes(kw)
    );
  }

  async checkDuplicate(companyName: string, positionName: string): Promise<Delivery | undefined> {
    const all = await this.getAll();
    return all.find(d =>
      d.companyName.toLowerCase() === companyName.toLowerCase() &&
      d.positionName.toLowerCase() === positionName.toLowerCase()
    );
  }

  async getStats(): Promise<DeliveryStats> {
    const all = await this.getAll();

    const stats: DeliveryStats = {
      total: all.length,
      pending: 0,
      communicating: 0,
      applied: 0,
      screening: 0,
      exam: 0,
      firstInterview: 0,
      secondInterview: 0,
      thirdInterview: 0,
      offer: 0,
      rejected: 0,
      accepted: 0,
      selfRejected: 0,
      abandoned: 0
    };

    for (const d of all) {
      switch (d.status) {
        case '待投递': stats.pending++; break;
        case '仅沟通': stats.communicating++; break;
        case '已投递': stats.applied++; break;
        case '通过初筛': stats.screening++; break;
        case '笔试': stats.exam++; break;
        case '一面': stats.firstInterview++; break;
        case '二面': stats.secondInterview++; break;
        case '三面': stats.thirdInterview++; break;
        case '已Offer': stats.offer++; break;
        case '未通过': stats.rejected++; break;
        case '已接受': stats.accepted++; break;
        case '已拒绝': stats.selfRejected++; break;
        case '已放弃': stats.abandoned++; break;
      }
    }

    return stats;
  }

  async updateStatus(id: string, status: DeliveryStatus): Promise<Delivery | undefined> {
    return await this.update(id, { status });
  }

  async bulkImport(deliveries: CreateDeliveryDTO[]): Promise<number> {
    const now = new Date().toISOString();
    const maxOrder = await getDb().deliveries.orderBy('sortOrder').last();
    let startOrder = maxOrder ? maxOrder.sortOrder + 1 : 0;
    const items = deliveries.map((d, index) => ({
      id: uuidv4(),
      companyName: d.companyName,
      positionName: d.positionName,
      deliveryMethod: d.deliveryMethod,
      deliveryDate: d.deliveryDate || now.split('T')[0],
      interviewDate: d.interviewDate,
      status: d.status,
      industryName: d.industryName || '',
      positionTypeName: d.positionTypeName || '',
      location: d.location || '',
      salary: d.salary || '',
      tags: [],
      remark: d.remark,
      links: d.links || [],
      files: d.files || [],
      timeline: [this.createTimelineEntry(null, d.status, '导入创建')],
      sortOrder: startOrder + index,
      createdAt: now,
      updatedAt: now
    }));

    await getDb().deliveries.bulkAdd(items);

    for (const delivery of items) {
      syncQueue.enqueue({ table: 'deliveries', operation: 'create', data: delivery });
    }

    return items.length;
  }

  async reorderDeliveries(updates: { id: string; sortOrder: number }[]): Promise<void> {
    await getDb().transaction('rw', getDb().deliveries, async () => {
      for (const update of updates) {
        const delivery = await getDb().deliveries.get(update.id);
        if (delivery) {
          delivery.sortOrder = update.sortOrder;
          delivery.updatedAt = new Date().toISOString();
          await getDb().deliveries.put(delivery);
          syncQueue.enqueue({ table: 'deliveries', operation: 'update', data: delivery });
        }
      }
    });
  }

  async getPendingDeliveries(): Promise<Delivery[]> {
    const all = await this.getAll();
    return all.filter(d => d.status === '待投递');
  }

  async getDeliveriesWithInterviewDate(): Promise<Delivery[]> {
    const all = await this.getAll();
    return all.filter(d => d.interviewDate);
  }
}

export const deliveryService = new DeliveryService();