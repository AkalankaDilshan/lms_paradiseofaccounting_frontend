import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { Label } from '../../components/ui/label';
import { Clock, AlertCircle, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Question {
  questionId: string;
  questionText: string;
  options: { index: number; text: string }[];
}

interface AttemptData {
  attemptId: string;
  quizId: string;
  durationMinutes: number;
  questions: Question[];
}

export function QuizAttempt() {
  const { id: quizId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  // answers: key=questionId, value=selectedOptionIndex
  const [answers, setAnswers] = useState<Record<string, number>>({});
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

  // Use durationMinutes from server response
  useEffect(() => {
    if (data && timeLeft === null) {
      setTimeLeft(data.durationMinutes * 60);
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

  // Submit Mutation — answers are { [questionId]: selectedOptionIndex }
  const submitAttempt = useMutation({
    mutationFn: async () => {
      const payload = {
        answersGiven: answers,
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

  if (isLoading) return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-36 rounded-xl bg-white/5 animate-pulse" />
      ))}
    </div>
  );
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
              isWarning ? 'bg-amber-500/10 text-amber-400' : 'bg-primary/10 text-primary'}`}>
            <Clock className="w-5 h-5" />
            {timeLeft !== null ? formatTime(timeLeft) : '--:--'}
          </div>
        </div>
        {isWarning && !isDanger && (
          <p className="text-amber-400 text-sm font-medium flex items-center mt-2">
            <AlertTriangle className="w-4 h-4 mr-1" /> 5 minutes remaining — start wrapping up!
          </p>
        )}
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
              key={q.questionId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg leading-relaxed font-sinhala">
                    <span className="text-muted-foreground mr-2">{index + 1}.</span>
                    {q.questionText}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={answers[q.questionId] !== undefined ? String(answers[q.questionId]) : ''}
                    onValueChange={(val: string) => setAnswers(prev => ({ ...prev, [q.questionId]: Number(val) }))}
                    className="space-y-3"
                  >
                    {q.options.map((opt) => (
                      <div key={opt.index} className="flex items-start space-x-3 space-y-0 p-3 rounded-md border hover:bg-muted/50 transition-colors cursor-pointer"
                           onClick={() => setAnswers(prev => ({ ...prev, [q.questionId]: opt.index }))}>
                        <RadioGroupItem value={String(opt.index)} id={`${q.questionId}-${opt.index}`} className="mt-1" />
                        <Label htmlFor={`${q.questionId}-${opt.index}`} className="font-normal font-sinhala text-base cursor-pointer flex-1">
                          {opt.text}
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
