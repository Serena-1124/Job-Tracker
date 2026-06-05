import { create } from 'zustand';
import type { TodoItem, CreateTodoDTO, UpdateTodoDTO } from '../types';
import { todoService } from '../services/todoService';

interface TodoState {
  todos: TodoItem[];
  loading: boolean;
  error: string | null;

  fetchTodos: () => Promise<void>;
  createTodo: (data: CreateTodoDTO) => Promise<TodoItem>;
  updateTodo: (id: string, data: UpdateTodoDTO) => Promise<TodoItem | undefined>;
  deleteTodo: (id: string) => Promise<void>;
  toggleComplete: (id: string) => Promise<void>;
  moveUp: (id: string) => Promise<void>;
  moveDown: (id: string) => Promise<void>;
  getPendingCount: () => number;
  getTodosByDelivery: (deliveryId: string) => TodoItem[];
}

export const useTodoStore = create<TodoState>((set, get) => ({
  todos: [],
  loading: false,
  error: null,

  fetchTodos: async () => {
    set({ loading: true, error: null });
    try {
      const todos = await todoService.getAll();
      set({ todos, loading: false });
    } catch (error) {
      set({ error: '获取待办事项失败', loading: false });
    }
  },

  createTodo: async (data: CreateTodoDTO) => {
    set({ loading: true, error: null });
    try {
      const todo = await todoService.create(data);
      set(state => ({
        todos: [todo, ...state.todos],
        loading: false
      }));
      return todo;
    } catch (error) {
      set({ error: '创建待办事项失败', loading: false });
      throw error;
    }
  },

  updateTodo: async (id: string, data: UpdateTodoDTO) => {
    set({ loading: true, error: null });
    try {
      const updated = await todoService.update(id, data);
      if (updated) {
        set(state => ({
          todos: state.todos.map(t => t.id === id ? updated : t),
          loading: false
        }));
      }
      return updated;
    } catch (error) {
      set({ error: '更新待办事项失败', loading: false });
      throw error;
    }
  },

  deleteTodo: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await todoService.delete(id);
      set(state => ({
        todos: state.todos.filter(t => t.id !== id),
        loading: false
      }));
    } catch (error) {
      set({ error: '删除待办事项失败', loading: false });
      throw error;
    }
  },

  toggleComplete: async (id: string) => {
    const updated = await todoService.toggleComplete(id);
    if (updated) {
      set(state => ({
        todos: state.todos.map(t => t.id === id ? updated : t)
      }));
    }
  },

  moveUp: async (id: string) => {
    const { todos } = get();
    const currentIndex = todos.findIndex(t => t.id === id);
    if (currentIndex <= 0) return;

    const prevId = todos[currentIndex - 1].id;
    await todoService.swapOrder(id, prevId);
    
    const updatedTodos = await todoService.getAll();
    set({ todos: updatedTodos });
  },

  moveDown: async (id: string) => {
    const { todos } = get();
    const currentIndex = todos.findIndex(t => t.id === id);
    if (currentIndex === -1 || currentIndex >= todos.length - 1) return;

    const nextId = todos[currentIndex + 1].id;
    await todoService.swapOrder(id, nextId);
    
    const updatedTodos = await todoService.getAll();
    set({ todos: updatedTodos });
  },

  getPendingCount: () => {
    return get().todos.filter(t => !t.completed).length;
  },

  getTodosByDelivery: (deliveryId: string) => {
    return get().todos.filter(t => t.deliveryId === deliveryId);
  }
}));
