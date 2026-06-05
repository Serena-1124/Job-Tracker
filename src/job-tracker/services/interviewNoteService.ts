import { v4 as uuidv4 } from 'uuid';
import { getDb, ensureDbInitialized } from './db';
import { getDataSource } from './dataSource';
import { syncQueue } from './syncQueue';
import type { InterviewNote, CreateInterviewNoteDTO, UpdateInterviewNoteDTO } from '../types';

export class InterviewNoteService {
  async create(data: CreateInterviewNoteDTO): Promise<InterviewNote> {
    const now = new Date().toISOString();
    const allNotes = await this.getAll();
    const maxOrder = allNotes.length > 0 ? Math.max(...allNotes.map(n => n.sortOrder || 0)) : 0;
    
    const note: InterviewNote = {
      id: uuidv4(),
      deliveryId: data.deliveryId,
      companyName: data.companyName,
      positionName: data.positionName,
      title: data.title,
      content: data.content,
      interviewer: data.interviewer,
      interviewRound: data.interviewRound,
      interviewDate: data.interviewDate,
      sortOrder: data.sortOrder ?? maxOrder + 1,
      createdAt: now,
      updatedAt: now
    };

    await getDb().interviewNotes.add(note);

    if (getDataSource() === 'supabase') {
      syncQueue.enqueue({
        table: 'interview_notes',
        operation: 'create',
        data: note
      });
    }

    return note;
  }

  async update(id: string, data: UpdateInterviewNoteDTO): Promise<InterviewNote | undefined> {
    const note = await getDb().interviewNotes.get(id);
    if (!note) return undefined;

    const now = new Date().toISOString();
    const updated: InterviewNote = {
      ...note,
      ...data,
      updatedAt: now
    };

    await getDb().interviewNotes.put(updated);

    if (getDataSource() === 'supabase') {
      syncQueue.enqueue({
        table: 'interview_notes',
        operation: 'update',
        data: updated
      });
    }

    return updated;
  }

  async delete(id: string): Promise<void> {
    await getDb().interviewNotes.delete(id);

    if (getDataSource() === 'supabase') {
      syncQueue.enqueue({
        table: 'interview_notes',
        operation: 'delete',
        data: { id }
      });
    }
  }

  async getById(id: string): Promise<InterviewNote | undefined> {
    await ensureDbInitialized();
    return await getDb().interviewNotes.get(id);
  }

  async getAll(): Promise<InterviewNote[]> {
    await ensureDbInitialized();
    return await getDb().interviewNotes.orderBy('sortOrder').toArray();
  }

  async swapOrder(id1: string, id2: string): Promise<void> {
    const note1 = await getDb().interviewNotes.get(id1);
    const note2 = await getDb().interviewNotes.get(id2);
    if (!note1 || !note2) return;

    const order1 = note1.sortOrder;
    const order2 = note2.sortOrder;
    const now = new Date().toISOString();

    const updatedNote1 = { ...note1, sortOrder: order2, updatedAt: now };
    const updatedNote2 = { ...note2, sortOrder: order1, updatedAt: now };

    await getDb().interviewNotes.put(updatedNote1);
    await getDb().interviewNotes.put(updatedNote2);

    if (getDataSource() === 'supabase') {
      syncQueue.enqueue({
        table: 'interview_notes',
        operation: 'update',
        data: updatedNote1
      });
      syncQueue.enqueue({
        table: 'interview_notes',
        operation: 'update',
        data: updatedNote2
      });
    }
  }

  async getByDeliveryId(deliveryId: string): Promise<InterviewNote[]> {
    await ensureDbInitialized();
    return await getDb().interviewNotes
      .where('deliveryId')
      .equals(deliveryId)
      .reverse()
      .sortBy('createdAt');
  }

  async search(keyword: string): Promise<InterviewNote[]> {
    if (!keyword) return this.getAll();

    const kw = keyword.toLowerCase();
    const all = await this.getAll();

    return all.filter(n =>
      n.title.toLowerCase().includes(kw) ||
      n.content.toLowerCase().includes(kw) ||
      (n.companyName && n.companyName.toLowerCase().includes(kw)) ||
      (n.positionName && n.positionName.toLowerCase().includes(kw))
    );
  }
}

export const interviewNoteService = new InterviewNoteService();