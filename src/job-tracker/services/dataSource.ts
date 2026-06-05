import type { CreateDeliveryDTO, Delivery } from '../types';
import { deliveryService } from './deliveryService';
import { learningService } from './learningService';

export type DataSource = 'supabase' | 'local';

let currentSource: DataSource = 'local';

export function setDataSource(source: DataSource) {
  currentSource = source;
}

export function getDataSource(): DataSource {
  return currentSource;
}

// 所有操作统一走本地 Service（本地 Service 内部已实现双写到 Supabase）
export async function fetchDeliveries(): Promise<Delivery[]> {
  return deliveryService.getAll();
}

export async function createDelivery(dto: CreateDeliveryDTO): Promise<Delivery> {
  return deliveryService.create(dto);
}

export async function updateDelivery(id: string, dto: Partial<CreateDeliveryDTO>): Promise<Delivery | undefined> {
  return deliveryService.update(id, dto);
}

export async function deleteDelivery(id: string): Promise<void> {
  return deliveryService.delete(id);
}

export async function getRecycleBin() {
  return deliveryService.getRecycleBin();
}

export async function restoreFromRecycleBin(originalId: string): Promise<void> {
  return deliveryService.restoreFromRecycleBin(originalId);
}

export async function permanentDeleteFromRecycleBin(originalId: string): Promise<void> {
  return deliveryService.permanentDeleteFromRecycleBin(originalId);
}

export async function fetchDeliveryById(id: string): Promise<Delivery | undefined> {
  return deliveryService.getById(id);
}

export async function recordCompanyIndustry(companyName: string, industryId: string): Promise<void> {
  return learningService.recordCompanyIndustry(companyName, industryId);
}

export async function recordPositionCategory(positionName: string, categoryId: string): Promise<void> {
  return learningService.recordPositionCategory(positionName, categoryId);
}

export async function getLearnedIndustry(companyName: string): Promise<string | null> {
  return learningService.getLearnedIndustry(companyName);
}

export async function getLearnedPosition(positionName: string): Promise<string | null> {
  return learningService.getLearnedPosition(positionName);
}

export async function reorderDeliveries(updates: { id: string; sortOrder: number }[]): Promise<void> {
  return deliveryService.reorderDeliveries(updates);
}
