import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Clock, Calendar, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface QuizItem {
  id: string;
  title: string;
  openAt: string;
  closeAt: string;
  duration: number;
  maxAttempts: number;
  attemptsUsed: number;
}

export function StudentDashboard() {
  const navigate = useNavigate();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['studentQuizzes'],
    queryFn: async () => {
      const res = await apiClient.get('/quizzes');
      return res.data.items as QuizItem[];
    }
  });

  if (isLoading) return <div className="flex justify-center p-8">Loading quizzes...</div>;
  if (error) return <div className="text-destructive p-4 text-center">Failed to load quizzes.</div>;

  const activeQuizzes = data?.filter(q => new Date(q.closeAt) > new Date()) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Your Dashboard</h1>
        <p className="text-muted-foreground mt-1">Available assignments and quizzes.</p>
      </div>

      {activeQuizzes.length === 0 ? (
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <CheckCircle2 className="w-12 h-12 text-success/50 mb-4" />
            <p>You're all caught up! No active quizzes available.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeQuizzes.map((quiz) => {
            const isClosed = new Date() > new Date(quiz.closeAt);
            const isMaxedOut = quiz.attemptsUsed >= quiz.maxAttempts;
            const disabled = isClosed || isMaxedOut;

            return (
              <Card key={quiz.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-lg line-clamp-2">{quiz.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="w-4 h-4 mr-2 text-accent" />
                    {quiz.duration} mins
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4 mr-2 text-primary/70" />
                    Due: {new Date(quiz.closeAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center justify-between text-sm pt-2 border-t">
                    <span className="text-muted-foreground">Attempts:</span>
                    <span className={`font-medium ${isMaxedOut ? 'text-destructive' : 'text-foreground'}`}>
                      {quiz.attemptsUsed} / {quiz.maxAttempts}
                    </span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    disabled={disabled}
                    onClick={() => navigate(`/student/quizzes/${quiz.id}/attempt`)}
                  >
                    {isMaxedOut ? 'Completed' : 'Start Quiz'}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
