import { v4 as uuidv4 } from 'uuid';
import { getDb, ensureDbInitialized } from './db';
import { getDataSource } from './dataSource';
import { syncQueue } from './syncQueue';
import type { TodoItem, CreateTodoDTO, UpdateTodoDTO } from '../types';

export class TodoService {
  async create(data: CreateTodoDTO): Promise<TodoItem> {
    const now = new Date().toISOString();
    const allTodos = await this.getAll();
    const maxOrder = allTodos.length > 0 ? Math.max(...allTodos.map(t => t.sortOrder || 0)) : 0;
    
    const todo: TodoItem = {
      id: uuidv4(),
      deliveryId: data.deliveryId,
      companyName: data.companyName,
      positionName: data.positionName,
      content: data.content,
      completed: false,
      dueDate: data.dueDate,
      priority: data.priority || 'medium',
      sortOrder: data.sortOrder ?? maxOrder + 1,
      createdAt: now,
      updatedAt: now
    };

    await getDb().todos.add(todo);

    if (getDataSource() === 'supabase') {
      syncQueue.enqueue({
        table: 'todos',
        operation: 'create',
        data: todo
      });
    }

    return todo;
  }

  async update(id: string, data: UpdateTodoDTO): Promise<TodoItem | undefined> {
    const todo = await getDb().todos.get(id);
    if (!todo) return undefined;

    const updated: TodoItem = {
      ...todo,
      ...data,
      updatedAt: new Date().toISOString()
    };

    await getDb().todos.put(updated);

    if (getDataSource() === 'supabase') {
      syncQueue.enqueue({
        table: 'todos',
        operation: 'update',
        data: updated
      });
    }

    return updated;
  }

  async delete(id: string): Promise<void> {
    await getDb().todos.delete(id);

    if (getDataSource() === 'supabase') {
      syncQueue.enqueue({
        table: 'todos',
        operation: 'delete',
        data: { id }
      });
    }
  }

  async getById(id: string): Promise<TodoItem | undefined> {
    await ensureDbInitialized();
    return await getDb().todos.get(id);
  }

  async getAll(): Promise<TodoItem[]> {
    await ensureDbInitialized();
    return await getDb().todos.orderBy('sortOrder').toArray();
  }

  async reorder(id: string, newOrder: number): Promise<TodoItem | undefined> {
    return await this.update(id, { sortOrder: newOrder });
  }

  async swapOrder(id1: string, id2: string): Promise<void> {
    const todo1 = await getDb().todos.get(id1);
    const todo2 = await getDb().todos.get(id2);
    if (!todo1 || !todo2) return;

    const order1 = todo1.sortOrder;
    const order2 = todo2.sortOrder;
    const now = new Date().toISOString();

    const updatedTodo1 = { ...todo1, sortOrder: order2, updatedAt: now };
    const updatedTodo2 = { ...todo2, sortOrder: order1, updatedAt: now };

    await getDb().todos.put(updatedTodo1);
    await getDb().todos.put(updatedTodo2);

    if (getDataSource() === 'supabase') {
      syncQueue.enqueue({
        table: 'todos',
        operation: 'update',
        data: updatedTodo1
      });
      syncQueue.enqueue({
        table: 'todos',
        operation: 'update',
        data: updatedTodo2
      });
    }
  }

  async getByDeliveryId(deliveryId: string): Promise<TodoItem[]> {
    await ensureDbInitialized();
    return await getDb().todos.where('deliveryId').equals(deliveryId).toArray();
  }

  async getPending(): Promise<TodoItem[]> {
    await ensureDbInitialized();
    return await getDb().todos.where('completed').equals(0).toArray();
  }

  async toggleComplete(id: string): Promise<TodoItem | undefined> {
    const todo = await getDb().todos.get(id);
    if (!todo) return undefined;
    return await this.update(id, { completed: !todo.completed });
  }
}

export const todoService = new TodoService();
