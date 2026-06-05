import Dexie, { type Table } from 'dexie';
import type { Delivery, Interview, LearningRecord, TodoItem, InterviewNote } from '../types';

interface AchievementRecord {
  id: string;
  unlockedAt: string;
}

export interface RecycledDelivery extends Delivery {
  deletedAt: string;
  originalId: string;
}

export class JobTrackerDB extends Dexie {
  deliveries!: Table<Delivery, string>;
  interviews!: Table<Interview, string>;
  learnings!: Table<LearningRecord, string>;
  achievements!: Table<AchievementRecord, string>;
  todos!: Table<TodoItem, string>;
  interviewNotes!: Table<InterviewNote, string>;
  recycleBin!: Table<RecycledDelivery, string>;

  constructor(dbName: string) {
    super(dbName);
    this.version(12).stores({
      deliveries: 'id, companyName, positionName, status, deliveryDate, industryName, positionTypeName, sortOrder, createdAt',
      interviews: 'id, deliveryId, interviewTime',
      learnings: 'id, type, originalName, categoryId, [type+originalName]',
      achievements: 'id, unlockedAt',
      todos: 'id, completed, dueDate, sortOrder, createdAt',
      interviewNotes: 'id, deliveryId, sortOrder, createdAt',
      recycleBin: 'id, originalId, deletedAt'
    });
  }
}

// 当前数据库实例（按账号隔离）
let currentDb: JobTrackerDB | null = null;
let currentDbName: string = 'JobTrackerDB';

// 获取当前数据库实例
export function getDb(): JobTrackerDB {
  if (!currentDb) {
    currentDb = new JobTrackerDB(currentDbName);
  }
  return currentDb;
}

// 为了兼容旧代码，保留 db 导出
export const db = getDb();

// 切换数据库（用于账号切换时）
export async function switchDatabase(userId: string | null) {
  const newDbName = userId ? `JobTrackerDB_${userId}` : 'JobTrackerDB';

  // 如果数据库名称没有变化，不需要切换
  if (newDbName === currentDbName && currentDb?.isOpen()) {
    return;
  }

  // 关闭旧数据库
  if (currentDb && currentDb.isOpen()) {
    currentDb.close();
  }

  // 创建新数据库实例
  currentDbName = newDbName;
  currentDb = new JobTrackerDB(newDbName);

  // 重置初始化状态
  dbInitPromise = null;

  // 初始化新数据库
  await ensureDbInitialized();
}

// 数据库初始化 Promise，确保所有操作等待初始化完成
let dbInitPromise: Promise<void> | null = null;

export async function ensureDbInitialized(): Promise<void> {
  if (dbInitPromise) return dbInitPromise;

  dbInitPromise = (async () => {
    const database = getDb();
    // 等待数据库打开
    if (!database.isOpen()) {
      await database.open();
    }
    // 初始化默认数据
    await initializeData();
  })();

  return dbInitPromise;
}

// 不再预设任何默认分类数据，所有分类由用户手动添加

export async function resetDatabase() {
  const database = getDb();
  await database.delete();
  dbInitPromise = null;
  await ensureDbInitialized();
}

export async function initializeData() {
  const database = getDb();
  // 不再初始化任何默认分类数据，所有分类由用户手动添加
  // 仅处理数据库schema版本不匹配的情况
  try {
    // 简单访问一下数据库，确认数据库正常
    await database.deliveries.count();
  } catch (e: any) {
    // Schema version mismatch error from Dexie
    if (e?.name === 'VersionChangeError' || e?.message?.includes('Version')) {
      console.warn('Database schema version mismatch, resetting...');
      await database.delete();
      window.location.reload();
      return;
    }
    console.warn('Database access error:', e);
  }
}

// 回收站自动清理逻辑
async function cleanupExpiredRecycleBin() {
  await ensureDbInitialized();
  const database = getDb();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const expiredItems = await database.recycleBin
    .where('deletedAt')
    .below(thirtyDaysAgo.toISOString())
    .toArray();

  for (const item of expiredItems) {
    await database.recycleBin.delete(item.id);
  }
}

// 启动回收站自动清理定时器（每24小时执行一次）
function startRecycleBinCleanupTimer() {
  // 等待数据库初始化完成后再执行清理
  ensureDbInitialized().then(() => {
    cleanupExpiredRecycleBin().catch(console.error);
  }).catch(console.error);

  // 每24小时执行一次
  setInterval(() => {
    cleanupExpiredRecycleBin().catch(console.error);
  }, 24 * 60 * 60 * 1000);
}

// 应用启动时启动定时器
startRecycleBinCleanupTimer();
