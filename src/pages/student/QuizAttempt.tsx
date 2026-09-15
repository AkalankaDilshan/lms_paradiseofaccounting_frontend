import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { Label } from '../../components/ui/label';
import { Clock, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Question {
  id: string;
  text: string;
  options: string[];
}

interface AttemptData {
  attemptId: string;
  quizId: string;
  status: string;
  questions: Question[];
}

export function QuizAttempt() {
  const { id: quizId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // 1. Fetch Attempt (Start Quiz)
  const { data, isLoading, error } = useQuery({
    queryKey: ['attempt', quizId],
    queryFn: async () => {
      const res = await apiClient.post(`/quizzes/${quizId}/attempts`);
      return res.data as AttemptData;
    },
    refetchOnWindowFocus: false,
  });

  // For this mock, we assume 30 minutes duration.
  // In a real app, the server would return the exact deadline or remaining time.
  useEffect(() => {
    if (data && timeLeft === null) {
      setTimeLeft(30 * 60); // 30 minutes in seconds
    }
  }, [data]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev && prev <= 1) {
          clearInterval(timer);
          submitAttempt.mutate();
          return 0;
        }
        return prev ? prev - 1 : 0;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // Submit Mutation
  const submitAttempt = useMutation({
    mutationFn: async () => {
      const payload = {
        answers: Object.keys(answers).map(qId => ({
          questionId: qId,
          selectedOption: answers[qId]
        }))
      };
      await apiClient.put(`/quizzes/${quizId}/attempts/${data?.attemptId}`, payload);
    },
    onSuccess: () => {
      navigate(`/student/quizzes/${quizId}/results/${data?.attemptId}`);
    }
  });

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (isLoading) return <div className="p-8 text-center">Starting quiz...</div>;
  if (error || !data) return <div className="p-8 text-center text-destructive">Failed to start quiz. Max attempts reached or quiz closed.</div>;

  const isWarning = timeLeft !== null && timeLeft <= 300; // 5 mins
  const isDanger = timeLeft !== null && timeLeft <= 60;   // 1 min

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      {/* Sticky Header with Timer */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur pt-4 pb-4 border-b">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold line-clamp-1">Quiz in Progress</h1>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-mono text-lg font-bold
            ${isDanger ? 'bg-destructive/10 text-destructive animate-pulse' : 
              isWarning ? 'bg-accent/20 text-accent-foreground' : 'bg-primary/10 text-primary'}`}>
            <Clock className="w-5 h-5" />
            {timeLeft !== null ? formatTime(timeLeft) : '--:--'}
          </div>
        </div>
        {isDanger && (
          <p className="text-destructive text-sm font-medium flex items-center mt-2">
            <AlertCircle className="w-4 h-4 mr-1" /> Less than a minute remaining!
          </p>
        )}
      </div>

      {/* Questions List */}
      <div className="space-y-8">
        <AnimatePresence>
          {data.questions.map((q, index) => (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg leading-relaxed font-sinhala">
                    <span className="text-muted-foreground mr-2">{index + 1}.</span>
                    {q.text}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup 
                    value={answers[q.id] || ''} 
                    onValueChange={(val: string) => setAnswers(prev => ({ ...prev, [q.id]: val }))}
                    className="space-y-3"
                  >
                    {q.options.map((opt, i) => (
                      <div key={i} className="flex items-start space-x-3 space-y-0 p-3 rounded-md border hover:bg-muted/50 transition-colors cursor-pointer"
                           onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))}>
                        <RadioGroupItem value={opt} id={`${q.id}-${i}`} className="mt-1" />
                        <Label htmlFor={`${q.id}-${i}`} className="font-normal font-sinhala text-base cursor-pointer flex-1">
                          {opt}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Submit Button */}
      <div className="pt-6 border-t flex justify-end">
        <Button 
          size="lg" 
          onClick={() => submitAttempt.mutate()}
          disabled={submitAttempt.isPending}
          className="w-full sm:w-auto"
        >
          {submitAttempt.isPending ? 'Submitting...' : 'Submit Quiz'}
        </Button>
      </div>
    </div>
  );
}
