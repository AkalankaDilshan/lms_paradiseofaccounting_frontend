import { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Plus, Search, Edit, Archive } from 'lucide-react';

export function QuestionBank() {
  const [search, setSearch] = useState('');

  // Mock data
  const questions = [
    { id: 'q1', text: 'මූලික ගිණුම්කරණ සමීකරණය කුමක්ද?', tags: ['Basics'], options: 3 },
    { id: 'q2', text: 'වත්කමක් යනු කුමක්ද?', tags: ['Definitions', 'Assets'], options: 4 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Question Bank</h1>
          <p className="text-muted-foreground mt-1">Manage and create quiz questions.</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Question
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search questions or tags..." 
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50%]">Question</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Options</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions.map((q) => (
                <TableRow key={q.id}>
                  <TableCell className="font-sinhala text-base truncate max-w-xs">{q.text}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {q.tags.map(t => (
                        <span key={t} className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs">
                          {t}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{q.options}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon"><Edit className="w-4 h-4 text-muted-foreground" /></Button>
                    <Button variant="ghost" size="icon"><Archive className="w-4 h-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
