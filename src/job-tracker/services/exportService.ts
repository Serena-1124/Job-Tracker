import * as XLSX from 'xlsx';
import { deliveryService } from './deliveryService';
import { todoService } from './todoService';
import { interviewNoteService } from './interviewNoteService';
import type { Delivery, TodoItem, InterviewNote } from '../types';

export interface ExportData {
  deliveries: Delivery[];
  exportDate: string;
  version: string;
}

// ========== 投递记录导出字段配置 ==========

export const DELIVERY_EXPORT_FIELDS = [
  { key: 'companyName', label: '公司名称', default: true },
  { key: 'positionName', label: '岗位名称', default: true },
  { key: 'deliveryMethod', label: '投递方式', default: true },
  { key: 'deliveryDate', label: '投递日期', default: true },
  { key: 'interviewDate', label: '面试日期', default: true },
  { key: 'status', label: '当前状态', default: true },
  { key: 'industryName', label: '行业', default: true },
  { key: 'positionTypeName', label: '岗位类型', default: true },
  { key: 'location', label: '工作地点', default: true },
  { key: 'salary', label: '薪资范围', default: true },
  { key: 'remark', label: '备注', default: false },
  { key: 'links', label: '链接', default: false },
  { key: 'createdAt', label: '创建时间', default: false },
  { key: 'updatedAt', label: '更新时间', default: false }
] as const;

export type DeliveryExportFieldKey = typeof DELIVERY_EXPORT_FIELDS[number]['key'];

// ========== 待办事项导出字段配置 ==========

export const TODO_EXPORT_FIELDS = [
  { key: 'companyName', label: '关联公司', default: true },
  { key: 'positionName', label: '关联岗位', default: true },
  { key: 'content', label: '待办内容', default: true },
  { key: 'priority', label: '优先级', default: true },
  { key: 'completed', label: '完成状态', default: true },
  { key: 'dueDate', label: '截止日期', default: true },
  { key: 'createdAt', label: '创建时间', default: false },
  { key: 'updatedAt', label: '更新时间', default: false }
] as const;

export type TodoExportFieldKey = typeof TODO_EXPORT_FIELDS[number]['key'];

// ========== 面经记录导出字段配置 ==========

export const INTERVIEW_NOTE_EXPORT_FIELDS = [
  { key: 'companyName', label: '关联公司', default: true },
  { key: 'positionName', label: '关联岗位', default: true },
  { key: 'title', label: '标题', default: true },
  { key: 'interviewRound', label: '面试轮次', default: true },
  { key: 'interviewer', label: '面试官', default: true },
  { key: 'interviewDate', label: '面试日期', default: true },
  { key: 'content', label: '内容', default: true },
  { key: 'createdAt', label: '创建时间', default: false },
  { key: 'updatedAt', label: '更新时间', default: false }
] as const;

export type InterviewNoteExportFieldKey = typeof INTERVIEW_NOTE_EXPORT_FIELDS[number]['key'];

// ========== 投递记录导出 ==========

export async function exportDeliveriesToExcel(
  deliveries: Delivery[],
  selectedFields: DeliveryExportFieldKey[]
): Promise<void> {
  const exportData = deliveries.map(d => {
    const row: Record<string, string> = {};
    if (selectedFields.includes('companyName')) row['公司名称'] = d.companyName;
    if (selectedFields.includes('positionName')) row['岗位名称'] = d.positionName;
    if (selectedFields.includes('deliveryMethod')) row['投递方式'] = d.deliveryMethod;
    if (selectedFields.includes('deliveryDate')) row['投递日期'] = d.deliveryDate;
    if (selectedFields.includes('interviewDate')) row['面试日期'] = d.interviewDate || '';
    if (selectedFields.includes('status')) row['当前状态'] = d.status;
    if (selectedFields.includes('industryName')) row['行业'] = d.industryName || '';
    if (selectedFields.includes('positionTypeName')) row['岗位类型'] = d.positionTypeName || '';
    if (selectedFields.includes('location')) row['工作地点'] = d.location || '';
    if (selectedFields.includes('salary')) row['薪资范围'] = d.salary || '';
    if (selectedFields.includes('remark')) row['备注'] = d.remark || '';
    if (selectedFields.includes('links')) row['链接'] = d.links.join('\n');
    if (selectedFields.includes('createdAt')) row['创建时间'] = d.createdAt;
    if (selectedFields.includes('updatedAt')) row['更新时间'] = d.updatedAt;
    return row;
  });

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '投递记录');

  const colWidths = selectedFields.map(() => ({ wch: 20 }));
  ws['!cols'] = colWidths;

  XLSX.writeFile(wb, `投递记录_${formatDate(new Date())}.xlsx`);
}

export async function exportDeliveriesToCSV(
  deliveries: Delivery[],
  selectedFields: DeliveryExportFieldKey[]
): Promise<void> {
  const fieldMap: Record<DeliveryExportFieldKey, string> = {
    companyName: '公司名称',
    positionName: '岗位名称',
    deliveryMethod: '投递方式',
    deliveryDate: '投递日期',
    interviewDate: '面试日期',
    status: '当前状态',
    industryName: '行业',
    positionTypeName: '岗位类型',
    location: '工作地点',
    salary: '薪资范围',
    remark: '备注',
    links: '链接',
    createdAt: '创建时间',
    updatedAt: '更新时间'
  };

  const headers = selectedFields.map(f => fieldMap[f]);

  const rows = deliveries.map(d => selectedFields.map(f => {
    switch (f) {
      case 'companyName': return d.companyName;
      case 'positionName': return d.positionName;
      case 'deliveryMethod': return d.deliveryMethod;
      case 'deliveryDate': return d.deliveryDate;
      case 'interviewDate': return d.interviewDate || '';
      case 'status': return d.status;
      case 'industryName': return d.industryName || '';
      case 'positionTypeName': return d.positionTypeName || '';
      case 'location': return d.location || '';
      case 'salary': return d.salary || '';
      case 'remark': return d.remark || '';
      case 'links': return d.links.join('\n');
      case 'createdAt': return d.createdAt;
      case 'updatedAt': return d.updatedAt;
      default: return '';
    }
  }));

  downloadCSV([headers, ...rows], `投递记录_${formatDate(new Date())}.csv`);
}

// ========== 待办事项导出 ==========

export async function exportTodosToExcel(
  todos: TodoItem[],
  selectedFields: TodoExportFieldKey[]
): Promise<void> {
  const exportData = todos.map(t => {
    const row: Record<string, string> = {};
    if (selectedFields.includes('companyName')) row['关联公司'] = t.companyName || '';
    if (selectedFields.includes('positionName')) row['关联岗位'] = t.positionName || '';
    if (selectedFields.includes('content')) row['待办内容'] = t.content;
    if (selectedFields.includes('priority')) row['优先级'] = t.priority === 'high' ? '高' : t.priority === 'medium' ? '中' : '低';
    if (selectedFields.includes('completed')) row['完成状态'] = t.completed ? '已完成' : '待完成';
    if (selectedFields.includes('dueDate')) row['截止日期'] = t.dueDate || '';
    if (selectedFields.includes('createdAt')) row['创建时间'] = t.createdAt;
    if (selectedFields.includes('updatedAt')) row['更新时间'] = t.updatedAt;
    return row;
  });

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '待办事项');

  const colWidths = selectedFields.map(() => ({ wch: 20 }));
  ws['!cols'] = colWidths;

  XLSX.writeFile(wb, `待办事项_${formatDate(new Date())}.xlsx`);
}

export async function exportTodosToCSV(
  todos: TodoItem[],
  selectedFields: TodoExportFieldKey[]
): Promise<void> {
  const fieldMap: Record<TodoExportFieldKey, string> = {
    companyName: '关联公司',
    positionName: '关联岗位',
    content: '待办内容',
    priority: '优先级',
    completed: '完成状态',
    dueDate: '截止日期',
    createdAt: '创建时间',
    updatedAt: '更新时间'
  };

  const headers = selectedFields.map(f => fieldMap[f]);

  const rows = todos.map(t => selectedFields.map(f => {
    switch (f) {
      case 'companyName': return t.companyName;
      case 'positionName': return t.positionName;
      case 'content': return t.content;
      case 'priority': return t.priority === 'high' ? '高' : t.priority === 'medium' ? '中' : '低';
      case 'completed': return t.completed ? '已完成' : '待完成';
      case 'dueDate': return t.dueDate || '';
      case 'createdAt': return t.createdAt;
      case 'updatedAt': return t.updatedAt;
      default: return '';
    }
  }));

  downloadCSV([headers, ...rows], `待办事项_${formatDate(new Date())}.csv`);
}

// ========== 面经记录导出 ==========

export async function exportInterviewNotesToExcel(
  notes: InterviewNote[],
  selectedFields: InterviewNoteExportFieldKey[]
): Promise<void> {
  const exportData = notes.map(n => {
    const row: Record<string, string> = {};
    if (selectedFields.includes('companyName')) row['关联公司'] = n.companyName || '';
    if (selectedFields.includes('positionName')) row['关联岗位'] = n.positionName || '';
    if (selectedFields.includes('title')) row['标题'] = n.title;
    if (selectedFields.includes('interviewRound')) row['面试轮次'] = n.interviewRound || '';
    if (selectedFields.includes('interviewer')) row['面试官'] = n.interviewer || '';
    if (selectedFields.includes('interviewDate')) row['面试日期'] = n.interviewDate || '';
    if (selectedFields.includes('content')) row['内容'] = n.content;
    if (selectedFields.includes('createdAt')) row['创建时间'] = n.createdAt;
    if (selectedFields.includes('updatedAt')) row['更新时间'] = n.updatedAt;
    return row;
  });

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '面经记录');

  const colWidths = selectedFields.map(() => ({ wch: 20 }));
  ws['!cols'] = colWidths;

  XLSX.writeFile(wb, `面经记录_${formatDate(new Date())}.xlsx`);
}

export async function exportInterviewNotesToCSV(
  notes: InterviewNote[],
  selectedFields: InterviewNoteExportFieldKey[]
): Promise<void> {
  const fieldMap: Record<InterviewNoteExportFieldKey, string> = {
    companyName: '关联公司',
    positionName: '关联岗位',
    title: '标题',
    interviewRound: '面试轮次',
    interviewer: '面试官',
    interviewDate: '面试日期',
    content: '内容',
    createdAt: '创建时间',
    updatedAt: '更新时间'
  };

  const headers = selectedFields.map(f => fieldMap[f]);

  const rows = notes.map(n => selectedFields.map(f => {
    switch (f) {
      case 'companyName': return n.companyName || '';
      case 'positionName': return n.positionName || '';
      case 'title': return n.title;
      case 'interviewRound': return n.interviewRound || '';
      case 'interviewer': return n.interviewer || '';
      case 'interviewDate': return n.interviewDate || '';
      case 'content': return n.content;
      case 'createdAt': return n.createdAt;
      case 'updatedAt': return n.updatedAt;
      default: return '';
    }
  }));

  downloadCSV([headers, ...rows], `面经记录_${formatDate(new Date())}.csv`);
}

// ========== 通用导出函数（兼容旧接口） ==========

export async function exportToExcel(data: ExportData): Promise<void> {
  const defaultFields = DELIVERY_EXPORT_FIELDS.filter(f => f.default).map(f => f.key);
  await exportDeliveriesToExcel(data.deliveries, defaultFields as DeliveryExportFieldKey[]);
}

export async function exportToCSV(data: ExportData): Promise<void> {
  const defaultFields = DELIVERY_EXPORT_FIELDS.filter(f => f.default).map(f => f.key);
  await exportDeliveriesToCSV(data.deliveries, defaultFields as DeliveryExportFieldKey[]);
}

// ========== 辅助函数 ==========

function downloadCSV(rows: any[][], filename: string): void {
  const csvContent = rows
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0].replace(/-/g, '');
}

// ========== 导入功能（兼容旧接口） ==========

export interface ParsedDeliveryDTO {
  companyName: string;
  positionName: string;
  deliveryMethod: string;
  deliveryDate?: string;
  interviewDate?: string;
  status: string;
  industryName?: string;
  positionTypeName?: string;
  location?: string;
  salary?: string;
  remark?: string;
  links?: string[];
  files?: { name: string; url: string; size: number; type: string }[];
}

export async function parseExcel(file: File): Promise<ParsedDeliveryDTO[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet);

        const deliveries = json.map((row: any) => ({
          companyName: row['公司名称'] || row['公司'] || '',
          positionName: row['岗位名称'] || row['岗位'] || '',
          deliveryMethod: normalizeDeliveryMethod(row['投递方式'] || row['渠道']),
          deliveryDate: normalizeDate(row['投递日期'] || row['日期']),
          interviewDate: row['面试日期'] ? normalizeDate(row['面试日期']) : undefined,
          status: normalizeStatus(row['当前状态'] || row['状态']),
          industryName: row['行业'] || '',
          positionTypeName: row['岗位类型'] || '',
          location: row['工作地点'] || row['地点'] || '',
          salary: row['薪资范围'] || row['薪资'] || '',
          remark: row['备注'] || '',
          links: parseLinks(row['链接']),
          files: []
        })).filter((d: any) => d.companyName && d.positionName);

        resolve(deliveries);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('读取文件失败'));
    reader.readAsBinaryString(file);
  });
}

function normalizeDeliveryMethod(method: string): string {
  const m = (method || '').trim();
  const lowerM = m.toLowerCase();
  if (lowerM.includes('boss')) return 'BOSS直聘';
  if (lowerM.includes('实习') || lowerM.includes('僧')) return '实习僧';
  if (lowerM.includes('官网')) return '官网';
  if (lowerM.includes('邮箱') || lowerM.includes('邮件')) return '邮箱';

  if (m) {
    const savedMethods = localStorage.getItem('customDeliveryMethods');
    const customMethods: string[] = savedMethods ? JSON.parse(savedMethods) : [];
    if (!customMethods.includes(m)) {
      customMethods.push(m);
      localStorage.setItem('customDeliveryMethods', JSON.stringify(customMethods));
    }
    return m;
  }

  return '官网';
}

function normalizeDate(date: any): string {
  if (!date) return '';
  if (typeof date === 'number') {
    const d = new Date((date - 25569) * 86400 * 1000);
    return d.toISOString().split('T')[0];
  }
  const str = String(date);
  if (str.includes('T')) {
    return str.split('T')[0];
  }
  const parts = str.split(/[\s\-/]/);
  if (parts.length >= 3) {
    const year = parts[0].padStart(4, '0');
    const month = parts[1].padStart(2, '0');
    const day = parts[2].padStart(2, '0');
    const datePart = `${year}-${month}-${day}`;
    const timePart = parts.slice(3).join(':');
    if (timePart) {
      return `${datePart} ${timePart}`;
    }
    return datePart;
  }
  return '';
}

function normalizeStatus(status: string): string {
  const s = status || '';
  if (s.includes('待投递')) return '待投递';
  if (s.includes('仅沟通')) return '仅沟通';
  if (s.includes('已投递') || s.includes('投递')) return '已投递';
  if (s.includes('笔试')) return '笔试';
  if (s.includes('一面') || s.includes('初试')) return '一面';
  if (s.includes('二面') || s.includes('复试')) return '二面';
  if (s.includes('三面')) return '三面';
  if (s.includes('终面') || s.includes('HR')) return '三面';
  if (s.includes('offer') || s.includes('录用')) return '已Offer';
  if (s.includes('未通过') || s.includes('拒绝') || s.includes('挂')) return '未通过';
  if (s.includes('已接受')) return '已接受';
  if (s.includes('已拒') || s.includes('自己拒')) return '已拒绝';
  if (s.includes('已放弃')) return '已放弃';
  return '已投递';
}

function parseLinks(links: string): string[] {
  if (!links) return [];
  return String(links).split(/[\n]/).map(l => l.trim()).filter(Boolean);
}

export async function backupCurrentData(): Promise<void> {
  const deliveries = await deliveryService.getAll();
  const todos = await todoService.getAll();
  const interviewNotes = await interviewNoteService.getAll();

  const backup = {
    deliveries,
    todos,
    interviewNotes,
    exportDate: new Date().toISOString(),
    version: '1.0'
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `数据备份_${formatDate(new Date())}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}
