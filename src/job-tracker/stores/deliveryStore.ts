import { create } from 'zustand';
import dayjs from 'dayjs';
import type { Delivery, DeliveryFilter, DeliveryStats, CreateDeliveryDTO, UpdateDeliveryDTO } from '../types';
import type { RecycledDelivery } from '../services/db';
import * as dataSource from '../services/dataSource';

interface DeliveryState {
  deliveries: Delivery[];
  stats: DeliveryStats;
  filter: DeliveryFilter;
  loading: boolean;
  error: string | null;
  recycleBin: RecycledDelivery[];

  fetchDeliveries: () => Promise<void>;
  fetchStats: () => Promise<void>;
  createDelivery: (data: CreateDeliveryDTO) => Promise<Delivery>;
  updateDelivery: (id: string, data: UpdateDeliveryDTO, companyName?: string, positionName?: string) => Promise<Delivery | undefined>;
  deleteDelivery: (id: string) => Promise<void>;
  updateStatus: (id: string, status: Delivery['status']) => Promise<void>;
  checkDuplicate: (companyName: string, positionName: string) => Promise<Delivery | undefined>;
  setFilter: (filter: Partial<DeliveryFilter>) => void;
  clearFilter: () => void;
  getFilteredDeliveries: () => Delivery[];
  getPendingDeliveries: () => Delivery[];
  getDeliveriesWithInterviewDate: () => Delivery[];
  quickApply: (id: string) => Promise<void>;
  reorderDeliveries: (dragId: string, dropId: string) => Promise<void>;
  fetchRecycleBin: () => Promise<void>;
  restoreFromRecycleBin: (originalId: string) => Promise<void>;
  permanentDelete: (originalId: string) => Promise<void>;
}

export const useDeliveryStore = create<DeliveryState>((set, get) => ({
  deliveries: [],
  stats: {
    total: 0,
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
  },
  filter: {},
  loading: false,
  error: null,
  recycleBin: [],

  fetchDeliveries: async () => {
    set({ loading: true, error: null });
    try {
      const deliveries = await dataSource.fetchDeliveries();
      set({ deliveries, loading: false });
    } catch (error) {
      set({ error: '获取投递列表失败', loading: false });
    }
  },
  
  fetchStats: async () => {
    try {
      const deliveries = get().deliveries;
      const stats: DeliveryStats = {
        total: deliveries.length,
        pending: 0, communicating: 0, applied: 0, screening: 0, exam: 0,
        firstInterview: 0, secondInterview: 0, thirdInterview: 0,
        offer: 0, rejected: 0, accepted: 0, selfRejected: 0, abandoned: 0
      };
      for (const d of deliveries) {
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
      set({ stats });
    } catch (error) {
      console.error('获取统计数据失败:', error);
    }
  },
  
  createDelivery: async (data: CreateDeliveryDTO) => {
    set({ loading: true, error: null });
    try {
      const delivery = await dataSource.createDelivery(data);
      
      const deliveries = [delivery, ...get().deliveries];
      set({ deliveries, loading: false });
      get().fetchStats();
      
      return delivery;
    } catch (error) {
      set({ error: '创建投递记录失败', loading: false });
      throw error;
    }
  },
  
  updateDelivery: async (id: string, data: UpdateDeliveryDTO, _companyName?: string, _positionName?: string) => {
    set({ loading: true, error: null });
    try {
      const updated = await dataSource.updateDelivery(id, data);
      if (updated) {
        const deliveries = get().deliveries.map(d => d.id === id ? updated : d);
        set({ deliveries, loading: false });
        get().fetchStats();
      }
      return updated;
    } catch (error) {
      set({ error: '更新投递记录失败', loading: false });
      throw error;
    }
  },
  
  deleteDelivery: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await dataSource.deleteDelivery(id);
      const deliveries = get().deliveries.filter(d => d.id !== id);
      set({ deliveries, loading: false });
      get().fetchStats();
    } catch (error) {
      set({ error: '删除投递记录失败', loading: false });
      throw error;
    }
  },
  
  updateStatus: async (id: string, status: Delivery['status']) => {
    const delivery = get().deliveries.find(d => d.id === id);
    if (!delivery) {
      throw new Error('投递记录不存在');
    }
    await get().updateDelivery(id, { status }, delivery.companyName, delivery.positionName);
  },
  
  checkDuplicate: async (companyName: string, positionName: string) => {
    const deliveries = get().deliveries;
    const normalizedCompany = companyName.trim().toLowerCase();
    const normalizedPosition = positionName.trim().toLowerCase();
    return deliveries.find(d =>
      d.companyName.trim().toLowerCase() === normalizedCompany &&
      d.positionName.trim().toLowerCase() === normalizedPosition
    );
  },
  
  setFilter: (filter: Partial<DeliveryFilter>) => {
    set({ filter: { ...get().filter, ...filter } });
  },
  
  clearFilter: () => {
    set({ filter: {} });
  },
  
  getFilteredDeliveries: () => {
    const { deliveries, filter } = get();
    
    return deliveries.filter(d => {
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
  },
  
  getPendingDeliveries: () => {
    return get().deliveries.filter(d => d.status === '待投递');
  },
  
  getDeliveriesWithInterviewDate: () => {
    return get().deliveries.filter(d => d.interviewDate);
  },
  
  quickApply: async (id: string) => {
    const today = dayjs().format('YYYY-MM-DD');
    await get().updateDelivery(id, { status: '已投递', deliveryDate: today });
  },
  
  reorderDeliveries: async (dragId: string, dropId: string) => {
    const { deliveries } = get();
    if (dragId === dropId) return;

    const dragIndex = deliveries.findIndex(d => d.id === dragId);
    const dropIndex = deliveries.findIndex(d => d.id === dropId);
    if (dragIndex === -1 || dropIndex === -1) return;

    const newDeliveries = [...deliveries];
    const [draggedItem] = newDeliveries.splice(dragIndex, 1);
    if (!draggedItem) return;
    newDeliveries.splice(dropIndex, 0, draggedItem);

    await dataSource.reorderDeliveries(newDeliveries.map((d, index) => ({ id: d.id, sortOrder: index })));
    set({ deliveries: newDeliveries });
  },

  fetchRecycleBin: async () => {
    try {
      const items = await dataSource.getRecycleBin();
      set({ recycleBin: items });
    } catch (error) {
      console.error('获取回收站失败:', error);
    }
  },

  restoreFromRecycleBin: async (originalId: string) => {
    try {
      await dataSource.restoreFromRecycleBin(originalId);
      await get().fetchDeliveries();
      await get().fetchRecycleBin();
    } catch (error) {
      console.error('恢复失败:', error);
      throw error;
    }
  },

  permanentDelete: async (originalId: string) => {
    try {
      await dataSource.permanentDeleteFromRecycleBin(originalId);
      await get().fetchRecycleBin();
    } catch (error) {
      console.error('永久删除失败:', error);
      throw error;
    }
  }
}));