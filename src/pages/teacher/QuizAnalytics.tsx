import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Leaderboard } from '../../components/Leaderboard';

export function QuizAnalytics() {
  const { id: quizId } = useParams<{ id: string }>();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Quiz Analytics</h1>
        <p className="text-muted-foreground mt-1">Detailed breakdown of class performance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Class Average</CardTitle>
            <CardDescription>Based on all completed attempts</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center h-32">
            <span className="text-5xl font-bold text-primary">82%</span>
          </CardContent>
        </Card>
        
        {/* Placeholder for Recharts BarChart */}
        <Card>
          <CardHeader>
            <CardTitle>Per-Question Accuracy</CardTitle>
          </CardHeader>
          <CardContent className="h-32 flex items-center justify-center text-muted-foreground border-dashed border rounded-md m-4 mt-0">
            [ BarChart Component ]
          </CardContent>
        </Card>
      </div>

      <Leaderboard quizId={quizId!} />
    </div>
  );
}
