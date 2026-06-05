import { v4 as uuidv4 } from 'uuid';
import { getDb, ensureDbInitialized } from './db';
import { syncQueue } from './syncQueue';
import type { LearningRecord } from '../types';

export class LearningService {
  async recordCompanyIndustry(companyName: string, industryId: string): Promise<void> {
    if (!companyName || !industryId) return;
    await ensureDbInitialized();

    const existing = await getDb().learnings
      .where('[type+originalName]')
      .equals(['company', companyName])
      .first();

    if (existing) {
      if (existing.categoryId !== industryId) {
        const updated = {
          categoryId: industryId,
          createdAt: new Date().toISOString()
        };
        await getDb().learnings.update(existing.id, updated);
        syncQueue.enqueue({ table: 'learnings', operation: 'update', data: { ...existing, ...updated } });
      }
    } else {
      const record: LearningRecord = {
        id: uuidv4(),
        type: 'company',
        originalName: companyName,
        categoryId: industryId,
        createdAt: new Date().toISOString()
      };
      await getDb().learnings.add(record);
      syncQueue.enqueue({ table: 'learnings', operation: 'create', data: record });
    }
  }

  async recordPositionCategory(positionName: string, categoryId: string): Promise<void> {
    if (!positionName || !categoryId) return;
    await ensureDbInitialized();

    const existing = await getDb().learnings
      .where('[type+originalName]')
      .equals(['position', positionName])
      .first();

    if (existing) {
      if (existing.categoryId !== categoryId) {
        const updated = {
          categoryId: categoryId,
          createdAt: new Date().toISOString()
        };
        await getDb().learnings.update(existing.id, updated);
        syncQueue.enqueue({ table: 'learnings', operation: 'update', data: { ...existing, ...updated } });
      }
    } else {
      const record: LearningRecord = {
        id: uuidv4(),
        type: 'position',
        originalName: positionName,
        categoryId: categoryId,
        createdAt: new Date().toISOString()
      };
      await getDb().learnings.add(record);
      syncQueue.enqueue({ table: 'learnings', operation: 'create', data: record });
    }
  }

  async getLearnedIndustry(companyName: string): Promise<string | null> {
    if (!companyName) return null;
    await ensureDbInitialized();

    const record = await getDb().learnings
      .where('[type+originalName]')
      .equals(['company', companyName])
      .first();

    return record?.categoryId || null;
  }

  async getLearnedPosition(positionName: string): Promise<string | null> {
    if (!positionName) return null;
    await ensureDbInitialized();

    const record = await getDb().learnings
      .where('[type+originalName]')
      .equals(['position', positionName])
      .first();

    return record?.categoryId || null;
  }

  async getRecentCompanies(): Promise<string[]> {
    await ensureDbInitialized();
    const recent = await getDb().learnings
      .where('type')
      .equals('company')
      .reverse()
      .limit(20)
      .toArray();

    return recent.map(r => r.originalName);
  }

  async searchLearnedCompanies(keyword: string): Promise<{ company: string; industryId: string }[]> {
    if (!keyword) return [];
    await ensureDbInitialized();

    const all = await getDb().learnings
      .where('type')
      .equals('company')
      .toArray();

    return all
      .filter(r => r.originalName.toLowerCase().includes(keyword.toLowerCase()))
      .map(r => ({ company: r.originalName, industryId: r.categoryId }));
  }

  async getLearningSuggestions(): Promise<{ companies: number; positions: number }> {
    await ensureDbInitialized();
    const companies = await getDb().learnings
      .where('type')
      .equals('company')
      .count();

    const positions = await getDb().learnings
      .where('type')
      .equals('position')
      .count();

    return { companies, positions };
  }

  async clearLearnings(): Promise<void> {
    await ensureDbInitialized();
    await getDb().learnings.clear();
  }


}

export const learningService = new LearningService();
