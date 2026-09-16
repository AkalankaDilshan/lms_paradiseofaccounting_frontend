import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { Leaderboard } from '../../components/Leaderboard';

interface QuestionResult {
  questionId: string;
  questionText: string;
  options: { index: number; text: string }[];
  givenAnswerIndex: number | null;
  correctAnswerIndex: number;
  correctAnswerText: string;
  isCorrect: boolean;
  explanation?: string;
}

interface ResultsData {
  attemptId: string;
  score: number;
  maxScore: number;
  percentage: number;
  results: QuestionResult[];
}

export function QuizResults() {
  const { id: quizId, attemptId } = useParams<{ id: string; attemptId: string }>();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ['results', quizId, attemptId],
    queryFn: async () => {
      const res = await apiClient.get(`/quizzes/${quizId}/attempts/${attemptId}/results`);
      return res.data as ResultsData;
    }
  });

  if (isLoading) return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-36 rounded-xl bg-white/5 animate-pulse" />
      ))}
    </div>
  );
  if (error || !data) return <div className="p-8 text-center text-destructive">Failed to load results.</div>;

  const percentage = data.percentage ?? Math.round((data.score / data.maxScore) * 100);
  const isExcellent = percentage >= 80;

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20">
      
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/student')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold">Quiz Results</h1>
      </div>

      {/* Score Card with Celebration */}
      <Card className="text-center overflow-hidden relative">
        {isExcellent && (
          <motion.div 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.1 }}
            transition={{ duration: 0.5 }}
            className="absolute -top-20 -right-20 w-64 h-64 bg-accent rounded-full blur-3xl pointer-events-none" 
          />
        )}
        <CardHeader>
          <CardTitle className="text-lg text-muted-foreground">Your Score</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', bounce: 0.5 }}
            className={`text-6xl font-bold ${isExcellent ? 'text-primary' : 'text-foreground'}`}
          >
            {data.score} <span className="text-3xl text-muted-foreground">/ {data.maxScore}</span>
          </motion.div>
          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="text-2xl font-semibold text-muted-foreground"
          >
            {percentage}%
          </motion.p>
          {isExcellent && (
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-success font-medium text-lg"
            >
              Excellent work! Keep it up. 🚀
            </motion.p>
          )}
        </CardContent>
      </Card>

      {/* Breakdown */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold">Question Breakdown</h2>
        {data.results.map((item, index) => (
          <Card key={item.questionId} className={`border-l-4 ${item.isCorrect ? 'border-l-success' : 'border-l-destructive'}`}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-4">
                <CardTitle className="text-lg leading-relaxed font-sinhala">
                  <span className="text-muted-foreground mr-2">{index + 1}.</span>
                  {item.questionText}
                </CardTitle>
                {item.isCorrect ? (
                  <CheckCircle2 className="w-6 h-6 text-success shrink-0" />
                ) : (
                  <XCircle className="w-6 h-6 text-destructive shrink-0" />
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="bg-muted p-3 rounded-md">
                  <span className="text-muted-foreground block text-xs mb-1">Your Answer</span>
                  <span className={`font-sinhala text-base ${item.isCorrect ? 'text-success' : 'text-destructive font-medium'}`}>
                    {item.givenAnswerIndex !== null
                      ? (item.options?.find(o => o.index === item.givenAnswerIndex)?.text ?? '— Unknown —')
                      : '— No Answer —'}
                  </span>
                </div>
                {!item.isCorrect && (
                  <div className="bg-success/10 p-3 rounded-md">
                    <span className="text-success/80 block text-xs mb-1">Correct Answer</span>
                    <span className="text-success font-medium font-sinhala text-base">{item.correctAnswerText}</span>
                  </div>
                )}
              </div>
              
              {item.explanation && (
                <div className="bg-primary/5 p-4 rounded-md border border-primary/10 mt-4">
                  <h4 className="text-xs font-semibold uppercase text-primary tracking-wider mb-2">Explanation</h4>
                  <p className="font-sinhala text-foreground/90 leading-relaxed text-[15px]">{item.explanation}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {data.results.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            <CheckCircle2 className="mx-auto mb-3 h-8 w-8 opacity-30" />
            <p className="text-sm">No question breakdown available.</p>
          </div>
        )}
      </div>

      <Leaderboard quizId={quizId!} />
    </div>
  );
}
