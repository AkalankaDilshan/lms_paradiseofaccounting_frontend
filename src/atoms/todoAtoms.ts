import { atomWithStorage } from 'jotai/utils';

export interface Todo {
  id: string;
  text: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  createdAt: string;
  dueDate?: string;
}

export const todosAtom = atomWithStorage<Todo[]>('teacher-todos', []);
