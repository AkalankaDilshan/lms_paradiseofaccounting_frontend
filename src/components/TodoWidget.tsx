import { useState } from 'react';
import { useAtom } from 'jotai';
import { todosAtom, type Todo } from '../atoms/todoAtoms';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { CheckSquare, Square, Trash2, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const PRIORITY_DOT: Record<Todo['priority'], string> = {
  high: 'bg-rose-500',
  medium: 'bg-amber-500',
  low: 'bg-emerald-500',
};

const PRIORITY_ORDER: Record<Todo['priority'], number> = {
  high: 0, medium: 1, low: 2,
};

export function TodoWidget() {
  const [todos, setTodos] = useAtom(todosAtom);
  const [text, setText] = useState('');
  const [priority, setPriority] = useState<Todo['priority']>('medium');
  const [dueDate, setDueDate] = useState('');
  const [showDone, setShowDone] = useState(false);

  const addTodo = () => {
    if (!text.trim()) return;
    const newTodo: Todo = {
      id: `todo-${Date.now()}`,
      text: text.trim(),
      priority,
      completed: false,
      createdAt: new Date().toISOString(),
      dueDate: dueDate || undefined,
    };
    setTodos(prev => [...prev, newTodo]);
    setText('');
    setDueDate('');
  };

  const toggle = (id: string) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const remove = (id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id));
  };

  const pending = todos
    .filter(t => !t.completed)
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
  const done = todos.filter(t => t.completed);

  return (
    <Card>
      <CardHeader className="border-b border-white/10 flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-primary" />
          To-Do
          {pending.length > 0 && (
            <span className="text-xs font-normal bg-primary/15 text-primary px-1.5 py-0.5 rounded-full">
              {pending.length}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {/* Pending */}
        <AnimatePresence>
          {pending.map(todo => (
            <motion.div
              key={todo.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="group flex items-start gap-2 p-2 rounded-lg hover:bg-muted/40 transition-colors"
            >
              <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${PRIORITY_DOT[todo.priority]}`} />
              <button className="shrink-0 mt-0.5" onClick={() => toggle(todo.id)}>
                <Square className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm">{todo.text}</p>
                {todo.dueDate && (
                  <p className="text-xs text-muted-foreground">Due: {todo.dueDate}</p>
                )}
              </div>
              <button
                onClick={() => remove(todo.id)}
                className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-rose-400"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {pending.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-2">All done! 🎉</p>
        )}

        {/* Done items */}
        {done.length > 0 && (
          <div>
            <button
              onClick={() => setShowDone(v => !v)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {showDone ? 'Hide' : 'Show'} {done.length} completed
            </button>
            {showDone && (
              <div className="mt-2 space-y-1">
                {done.map(todo => (
                  <div key={todo.id} className="group flex items-center gap-2 p-2 rounded-lg">
                    <span className="w-2 h-2 rounded-full bg-white/20 shrink-0" />
                    <button className="shrink-0" onClick={() => toggle(todo.id)}>
                      <CheckSquare className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <p className="text-sm text-muted-foreground line-through flex-1">{todo.text}</p>
                    <button onClick={() => remove(todo.id)}
                      className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-rose-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Add item */}
        <div className="pt-2 border-t border-white/10 space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="New task..."
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTodo()}
              className="h-8 text-sm flex-1"
            />
            <Button size="sm" className="h-8 px-2 shrink-0" onClick={addTodo}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex gap-2 items-center">
            <div className="flex gap-1">
              {(['high', 'medium', 'low'] as const).map(p => (
                <button key={p} onClick={() => setPriority(p)}
                  className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                    priority === p ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'
                  }`}>
                  {p}
                </button>
              ))}
            </div>
            <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
              className="h-7 text-xs flex-1" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
