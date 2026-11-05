import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Leaderboard } from '../../components/Leaderboard';
import { ArrowUpRight, BarChart3, CheckCircle2, CircleAlert } from 'lucide-react';

interface QuestionStat {
  position: number;
  questionId: string;
  questionText: string;
  correct: number;
  incorrect: number;
  accuracy: number | null;
}

interface QuizStats {
  quizId: string;
  quizTitle: string;
  totalAttempts: number;
  studentsAttempted: number;
  averagePercentage: number;
  perQuestion: QuestionStat[];
}

interface QuizSummary {
  quizId: string;
  title: string;
  openAt: string;
  closeAt: string;
}

// Questions answered correctly by fewer than this share of attempts are flagged for review
const NEEDS_REVIEW_BELOW = 50;

export function QuizAnalytics() {
  const { id: quizId } = useParams<{ id: string }>();
  return quizId ? <QuizStatsView quizId={quizId} /> : <QuizPicker />;
}

function Header({ subtitle }: { subtitle: string }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium uppercase tracking-[0.16em] text-primary">Quiz performance</p>
      <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Quiz analytics</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

// /teacher/analytics (sidebar) — choose which quiz to analyse
function QuizPicker() {
  const { data, isLoading } = useQuery({
    queryKey: ['teacherQuizzes'],
    meta: { errorContext: 'load quizzes' },
    queryFn: async () => (await apiClient.get('/quizzes')).data as QuizSummary[],
  });
  const quizzes = [...(data ?? [])].sort((a, b) => b.openAt.localeCompare(a.openAt));

  return (
    <div className="space-y-6">
      <Header subtitle="Pick a quiz to see class performance." />
      <Card>
        <CardContent className="divide-y divide-border p-0">
          {isLoading && <p className="p-6 text-sm text-muted-foreground">Loading quizzes...</p>}
          {!isLoading && quizzes.length === 0 && <p className="p-6 text-sm text-muted-foreground">No quizzes yet.</p>}
          {quizzes.map(q => (
            <Link key={q.quizId} to={`/teacher/quizzes/${q.quizId}/analytics`}
              className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
              <div>
                <p className="font-medium font-sinhala">{q.title}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(q.openAt).toLocaleString()} – {new Date(q.closeAt).toLocaleString()}
                </p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-primary" />
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function QuizStatsView({ quizId }: { quizId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['quizStats', quizId],
    meta: { errorContext: 'load quiz analytics' },
    queryFn: async () => (await apiClient.get(`/analytics/quizzes/${quizId}`)).data as QuizStats,
  });

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading analytics...</div>;
  if (error || !data) return <div className="p-8 text-center text-destructive">Failed to load analytics.</div>;

  const answered = data.perQuestion.filter(q => q.accuracy !== null);
  const needsReview = answered
    .filter(q => (q.accuracy ?? 0) < NEEDS_REVIEW_BELOW)
    .sort((a, b) => (a.accuracy ?? 0) - (b.accuracy ?? 0));

  return (
    <div className="space-y-6">
      <Header subtitle={data.quizTitle} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Metric label="Class average" value={data.totalAttempts ? `${data.averagePercentage}%` : '—'}
          note={`across ${data.totalAttempts} submitted attempt${data.totalAttempts === 1 ? '' : 's'}`}
          icon={BarChart3} color="text-primary" />
        <Metric label="Students attempted" value={String(data.studentsAttempted)}
          note="with at least one submitted attempt" icon={CheckCircle2} color="text-success" />
        <Metric label="Needs review" value={String(needsReview.length)}
          note={`questions under ${NEEDS_REVIEW_BELOW}% correct`} icon={CircleAlert} color="text-warning" />
      </div>

      <Card>
        <CardHeader className="border-b border-border"><CardTitle className="text-lg">Per-question accuracy</CardTitle></CardHeader>
        <CardContent className="p-6">
          {answered.length === 0 ? (
            <p className="text-sm text-muted-foreground">No submitted attempts yet.</p>
          ) : (
            <div className="flex h-56 items-end gap-3 sm:gap-6">
              {data.perQuestion.map(q => (
                <div key={q.questionId} className="flex flex-1 flex-col items-center gap-2"
                  title={`${q.questionText}\n${q.correct} correct · ${q.incorrect} incorrect`}>
                  <span className="text-xs font-semibold">{q.accuracy === null ? '—' : `${Math.round(q.accuracy)}%`}</span>
                  <div className={`w-full rounded-t-lg ${(q.accuracy ?? 100) < NEEDS_REVIEW_BELOW ? 'bg-warning/80' : 'bg-primary/80'}`}
                    style={{ height: `${(q.accuracy ?? 0) * 1.8}px` }} />
                  <span className="text-xs text-muted-foreground">Q{q.position}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b border-border">
          <CardTitle className="text-lg">Questions to revisit</CardTitle>
          <CircleAlert className="h-4 w-4 text-warning" />
        </CardHeader>
        <CardContent className="p-6 text-sm">
          {needsReview.length === 0 ? (
            <p className="text-muted-foreground">
              {answered.length === 0 ? 'Appears once students submit attempts.' : `Every question was answered correctly by at least ${NEEDS_REVIEW_BELOW}% of attempts.`}
            </p>
          ) : (
            <ul className="space-y-3">
              {needsReview.map(q => (
                <li key={q.questionId} className="flex items-start justify-between gap-4">
                  <span className="font-sinhala"><span className="mr-2 text-muted-foreground">Q{q.position}.</span>{q.questionText}</span>
                  <span className="shrink-0 font-semibold text-warning">{Math.round(q.accuracy ?? 0)}%</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Leaderboard quizId={quizId} />
    </div>
  );
}

function Metric({ label, value, note, icon: Icon, color }: { label: string; value: string; note: string; icon: typeof BarChart3; color: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{label}</span>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <p className="text-3xl font-bold">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{note}</p>
      </CardContent>
    </Card>
  );
}
