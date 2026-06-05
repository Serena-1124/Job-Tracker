import { create } from 'zustand';
import type { InterviewNote, CreateInterviewNoteDTO, UpdateInterviewNoteDTO } from '../types';
import { interviewNoteService } from '../services/interviewNoteService';

interface InterviewNoteState {
  notes: InterviewNote[];
  loading: boolean;
  error: string | null;

  fetchNotes: () => Promise<void>;
  createNote: (data: CreateInterviewNoteDTO) => Promise<InterviewNote>;
  updateNote: (id: string, data: UpdateInterviewNoteDTO) => Promise<InterviewNote | undefined>;
  deleteNote: (id: string) => Promise<void>;
  moveUp: (id: string) => Promise<void>;
  moveDown: (id: string) => Promise<void>;
  searchNotes: (keyword: string) => Promise<void>;
}

export const useInterviewNoteStore = create<InterviewNoteState>((set, get) => ({
  notes: [],
  loading: false,
  error: null,

  fetchNotes: async () => {
    set({ loading: true, error: null });
    try {
      const notes = await interviewNoteService.getAll();
      set({ notes, loading: false });
    } catch (error) {
      set({ error: '获取面经记录失败', loading: false });
    }
  },

  createNote: async (data: CreateInterviewNoteDTO) => {
    set({ loading: true, error: null });
    try {
      const note = await interviewNoteService.create(data);
      const notes = [note, ...get().notes];
      set({ notes, loading: false });
      return note;
    } catch (error) {
      set({ error: '创建面经记录失败', loading: false });
      throw error;
    }
  },

  updateNote: async (id: string, data: UpdateInterviewNoteDTO) => {
    set({ loading: true, error: null });
    try {
      const updated = await interviewNoteService.update(id, data);
      if (updated) {
        const notes = get().notes.map(n => n.id === id ? updated : n);
        set({ notes, loading: false });
      }
      return updated;
    } catch (error) {
      set({ error: '更新面经记录失败', loading: false });
      throw error;
    }
  },

  deleteNote: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await interviewNoteService.delete(id);
      const notes = get().notes.filter(n => n.id !== id);
      set({ notes, loading: false });
    } catch (error) {
      set({ error: '删除面经记录失败', loading: false });
      throw error;
    }
  },

  moveUp: async (id: string) => {
    const { notes } = get();
    const currentIndex = notes.findIndex(n => n.id === id);
    if (currentIndex <= 0) return;

    const prevId = notes[currentIndex - 1].id;
    await interviewNoteService.swapOrder(id, prevId);
    
    const updatedNotes = await interviewNoteService.getAll();
    set({ notes: updatedNotes });
  },

  moveDown: async (id: string) => {
    const { notes } = get();
    const currentIndex = notes.findIndex(n => n.id === id);
    if (currentIndex === -1 || currentIndex >= notes.length - 1) return;

    const nextId = notes[currentIndex + 1].id;
    await interviewNoteService.swapOrder(id, nextId);
    
    const updatedNotes = await interviewNoteService.getAll();
    set({ notes: updatedNotes });
  },

  searchNotes: async (keyword: string) => {
    set({ loading: true, error: null });
    try {
      const notes = await interviewNoteService.search(keyword);
      set({ notes, loading: false });
    } catch (error) {
      set({ error: '搜索面经记录失败', loading: false });
    }
  }
}));