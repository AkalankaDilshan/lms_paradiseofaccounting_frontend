import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';

interface TrendItem {
  quizId: string;
  quizTitle: string;
  score: number;
  maxScore: number;
  submittedAt: string;
}

export function StudentTrend() {
  const { user } = useAuth();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['trend', user?.username],
    queryFn: async () => {
      // In a real app, use the user ID from Auth context. For mock, it's fine.
      const res = await apiClient.get(`/analytics/students/${user?.username}/trend`);
      return res.data.items as TrendItem[];
    },
    enabled: !!user?.username,
  });

  if (isLoading) return <div className="p-8 text-center">Loading trend data...</div>;
  if (error || !data) return <div className="p-8 text-center text-destructive">Failed to load trend data.</div>;

  // Format data for Recharts: converting score to percentage
  const chartData = data.map(item => ({
    name: new Date(item.submittedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    percentage: Math.round((item.score / item.maxScore) * 100),
    title: item.quizTitle,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Performance Trend</h1>
        <p className="text-muted-foreground mt-1">Track your progress over time.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Score Progression</CardTitle>
          <CardDescription>Your marks as a percentage across recent quizzes.</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-10" />
              <XAxis dataKey="name" stroke="currentColor" className="text-xs opacity-50" tickLine={false} axisLine={false} />
              <YAxis unit="%" stroke="currentColor" className="text-xs opacity-50" tickLine={false} axisLine={false} domain={[0, 100]} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)', borderRadius: '8px' }}
                itemStyle={{ color: 'var(--foreground)' }}
              />
              <Line 
                type="monotone" 
                dataKey="percentage" 
                stroke="var(--primary)" 
                strokeWidth={3}
                dot={{ fill: 'var(--primary)', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: 'var(--accent)', stroke: 'transparent' }}
                name="Score"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attempt History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Quiz</TableHead>
                <TableHead className="text-right">Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium text-muted-foreground">
                    {new Date(item.submittedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{item.quizTitle}</TableCell>
                  <TableCell className="text-right font-bold">
                    {item.score} <span className="text-muted-foreground text-sm font-normal">/ {item.maxScore}</span>
                  </TableCell>
                </TableRow>
              ))}
              {data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                    No attempts recorded yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
