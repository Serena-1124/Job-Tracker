import { supabase } from './supabaseClient';
import type { CreateDeliveryDTO, Delivery } from '../types';

async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
}

export async function fetchDeliveries(): Promise<Delivery[]> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('deliveries')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapDelivery);
}

export async function fetchDeliveryById(id: string): Promise<Delivery | null> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('deliveries')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  return mapDelivery(data);
}

export async function createDelivery(dto: CreateDeliveryDTO): Promise<Delivery> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('未登录');

  const { data, error } = await supabase
    .from('deliveries')
    .insert({
      user_id: userId,
      company_name: dto.companyName,
      position_name: dto.positionName,
      delivery_method: dto.deliveryMethod,
      delivery_date: dto.deliveryDate,
      interview_date: dto.interviewDate,
      status: dto.status,
      industry_name: dto.industryName || null,
      position_type_name: dto.positionTypeName || null,
      location: dto.location || null,
      salary: dto.salary || null,
      remark: dto.remark || null,
      links: dto.links || [],
      files: dto.files || [],
      sort_order: 0,
    })
    .select()
    .single();

  if (error) throw error;
  return mapDelivery(data);
}

export async function updateDelivery(id: string, dto: Partial<CreateDeliveryDTO>): Promise<Delivery> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('未登录');

  const updateData: Record<string, any> = {};
  if (dto.companyName !== undefined) updateData.company_name = dto.companyName;
  if (dto.positionName !== undefined) updateData.position_name = dto.positionName;
  if (dto.deliveryMethod !== undefined) updateData.delivery_method = dto.deliveryMethod;
  if (dto.deliveryDate !== undefined) updateData.delivery_date = dto.deliveryDate;
  if (dto.interviewDate !== undefined) updateData.interview_date = dto.interviewDate;
  if (dto.status !== undefined) updateData.status = dto.status;
  if (dto.industryName !== undefined) updateData.industry_name = dto.industryName || null;
  if (dto.positionTypeName !== undefined) updateData.position_type_name = dto.positionTypeName || null;
  if (dto.location !== undefined) updateData.location = dto.location || null;
  if (dto.salary !== undefined) updateData.salary = dto.salary || null;
  if (dto.remark !== undefined) updateData.remark = dto.remark;
  if (dto.links !== undefined) updateData.links = dto.links;
  if (dto.files !== undefined) updateData.files = dto.files;

  if (dto.status !== undefined) {
    updateData.interview_date = null;
  } else if (dto.interviewDate === undefined && !('interviewDate' in dto)) {
  } else if (dto.interviewDate === undefined) {
    updateData.interview_date = null;
  }

  const { data, error } = await supabase
    .from('deliveries')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return mapDelivery(data);
}

export async function deleteDelivery(id: string): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('未登录');

  const { error } = await supabase
    .from('deliveries')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;
}

function mapDelivery(row: any): Delivery {
  return {
    id: row.id,
    companyName: row.company_name,
    positionName: row.position_name,
    deliveryMethod: row.delivery_method,
    deliveryDate: row.delivery_date,
    interviewDate: row.interview_date,
    status: row.status,
    industryName: row.industry_name || '',
    positionTypeName: row.position_type_name || '',
    location: row.location || '',
    salary: row.salary || '',
    tags: row.tags || [],
    remark: row.remark,
    links: row.links || [],
    files: row.files || [],
    timeline: row.timeline || [],
    sortOrder: row.sort_order || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at || row.created_at
  };
}