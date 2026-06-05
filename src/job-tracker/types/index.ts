export type DeliveryMethod = string;

export type DeliveryStatus =
  | '待投递'
  | '仅沟通'
  | '已投递'
  | '通过初筛'
  | '笔试'
  | '一面'
  | '二面'
  | '三面'
  | '已Offer'
  | '未通过'
  | '已接受'
  | '已拒绝'
  | '已放弃';

export type InterviewType = '视频面试' | '电话面试' | '现场面试';

export interface TimelineEntry {
  id: string;
  time: string;
  from: DeliveryStatus | null;
  to: DeliveryStatus;
  note?: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  data?: string;
}

export interface Delivery {
  id: string;
  companyName: string;
  positionName: string;
  deliveryMethod: DeliveryMethod;
  deliveryDate: string;
  interviewDate?: string;
  status: DeliveryStatus;
  industryName: string;
  positionTypeName: string;
  location?: string;
  salary?: string;
  tags: string[];
  remark?: string;
  links: string[];
  files: Attachment[];
  timeline: TimelineEntry[];
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Interview {
  id: string;
  deliveryId: string;
  round: string;
  interviewTime: string;
  interviewType: InterviewType;
  feedback?: string;
  createdAt: string;
}

export interface LearningRecord {
  id: string;
  type: 'company' | 'position';
  originalName: string;
  categoryId: string;
  createdAt: string;
}

export interface CreateDeliveryDTO {
  companyName: string;
  positionName: string;
  deliveryMethod: DeliveryMethod;
  deliveryDate?: string;
  interviewDate?: string;
  status: DeliveryStatus;
  industryName?: string;
  positionTypeName?: string;
  location?: string;
  salary?: string;
  remark?: string;
  links?: string[];
  files?: Attachment[];
}

export interface UpdateDeliveryDTO extends Partial<CreateDeliveryDTO> {
  status?: DeliveryStatus;
}

export interface DeliveryFilter {
  keyword?: string;
  status?: DeliveryStatus;
  industryName?: string;
  positionTypeName?: string;
  location?: string;
  deliveryMethod?: DeliveryMethod;
  startDate?: string;
  endDate?: string;
}

export interface CreateInterviewDTO {
  deliveryId: string;
  round: string;
  interviewTime: string;
  interviewType: InterviewType;
  feedback?: string;
}

export interface UpdateInterviewDTO extends Partial<CreateInterviewDTO> {}

export interface DeliveryStats {
  total: number;
  pending: number;
  communicating: number;
  applied: number;
  screening: number;
  exam: number;
  firstInterview: number;
  secondInterview: number;
  thirdInterview: number;
  offer: number;
  rejected: number;
  accepted: number;
  selfRejected: number;
  abandoned: number;
}

export interface TodoItem {
  id: string;
  deliveryId?: string;
  companyName?: string;
  positionName?: string;
  content: string;
  completed: boolean;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTodoDTO {
  deliveryId?: string;
  companyName?: string;
  positionName?: string;
  content: string;
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high';
  sortOrder?: number;
}

export interface UpdateTodoDTO extends Partial<CreateTodoDTO> {
  completed?: boolean;
}

export interface InterviewNote {
  id: string;
  deliveryId?: string;
  companyName?: string;
  positionName?: string;
  title: string;
  content: string;
  interviewer?: string;
  interviewRound?: string;
  interviewDate?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInterviewNoteDTO {
  deliveryId?: string;
  companyName?: string;
  positionName?: string;
  title: string;
  content: string;
  interviewer?: string;
  interviewRound?: string;
  interviewDate?: string;
  sortOrder?: number;
}

export interface UpdateInterviewNoteDTO extends Partial<CreateInterviewNoteDTO> {}

export const ACTIVE_STATUSES: DeliveryStatus[] = [
  '待投递', '仅沟通', '已投递', '通过初筛', '笔试', '一面', '二面', '三面', '已Offer'
];

export const END_STATUSES: DeliveryStatus[] = ['未通过', '已放弃', '已接受', '已拒绝'];

export const STATUS_ORDER: DeliveryStatus[] = [...ACTIVE_STATUSES, ...END_STATUSES];

export const INTERVIEW_STATUSES: DeliveryStatus[] = ['笔试', '一面', '二面', '三面', '已Offer', '已接受', '已拒绝'];

export function getNextStatuses(current: DeliveryStatus): { advance?: DeliveryStatus; reject?: DeliveryStatus; abandon?: DeliveryStatus; accept?: DeliveryStatus } {
  switch (current) {
    case '待投递':
      return { advance: '仅沟通', abandon: '已放弃' };
    case '仅沟通':
      return { advance: '已投递', reject: '未通过', abandon: '已放弃' };
    case '已投递':
      return { advance: '通过初筛', reject: '未通过', abandon: '已放弃' };
    case '通过初筛':
      return { advance: '笔试', reject: '未通过', abandon: '已放弃' };
    case '笔试':
      return { advance: '一面', reject: '未通过', abandon: '已放弃' };
    case '一面':
      return { advance: '二面', reject: '未通过', abandon: '已放弃' };
    case '二面':
      return { advance: '三面', reject: '未通过', abandon: '已放弃' };
    case '三面':
      return { advance: '已Offer', reject: '未通过', abandon: '已放弃' };
    case '已Offer':
      return { accept: '已接受', reject: '已拒绝' };
    default:
      return {};
  }
}

export const STATUS_COLORS: Record<DeliveryStatus, { color: string; bgColor: string }> = {
  '待投递': { color: '#8B7355', bgColor: '#F5F0E8' },
  '仅沟通': { color: '#7B8B6F', bgColor: '#EEF2E8' },
  '已投递': { color: '#6B7B8B', bgColor: '#E8EEF2' },
  '通过初筛': { color: '#8B8B6B', bgColor: '#F2F2E8' },
  '笔试': { color: '#7B6B8B', bgColor: '#EDE8F2' },
  '一面': { color: '#8B7B6B', bgColor: '#F2EDE8' },
  '二面': { color: '#6B8B7B', bgColor: '#E8F2EE' },
  '三面': { color: '#8B6B7B', bgColor: '#F2E8EE' },
  '已Offer': { color: '#6B8B6B', bgColor: '#E8F2E8' },
  '未通过': { color: '#9B8B7B', bgColor: '#F5F2EE' },
  '已接受': { color: '#7B8B7B', bgColor: '#EEF2F2' },
  '已拒绝': { color: '#8B8B7B', bgColor: '#F2F2EE' },
  '已放弃': { color: '#A99B8B', bgColor: '#F8F5F0' }
};
