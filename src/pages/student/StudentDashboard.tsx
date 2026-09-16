import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { Avatar } from '../../components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { CalendarDays, CheckCircle2, Clock3, ArrowUpRight, BookOpen, Target, Pin, Download, FileText, FileImage, File } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Leaderboard } from '../../components/Leaderboard';
import { useAuth } from '../../contexts/AuthContext';

interface QuizItem { quizId: string; title: string; openAt: string; closeAt: string; durationMinutes: number; maxAttempts: number; archived: boolean; allowedGroups: string[]; }
interface Announcement { announcementId: string; title: string; body: string; isPinned: boolean; createdAt: string; targetGroups: string[] }
interface Material { materialId: string; title: string; description: string; fileKey: string; fileType: string; createdAt: string; }

// TODO: Replace recentAttempts with real API call once attempts history endpoint exists
const recentAttempts = [
  { id: 'att-1', title: 'Partnership Accounts — Paper 1', date: '14 Sep 2026', score: 86, status: 'Completed' },
  { id: 'att-2', title: 'Depreciation Methods — Revision Paper', date: '11 Sep 2026', score: 72, status: 'Completed' },
  { id: 'att-3', title: 'Control Accounts — Grade 13', date: '08 Sep 2026', score: 91, status: 'Completed' },
];

const FILE_ICONS: Record<string, typeof FileText> = { pdf: FileText, image: FileImage, doc: File };

export function StudentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: quizzes, isLoading: loadingQuizzes } = useQuery({ 
    queryKey: ['studentQuizzes'], 
    queryFn: async () => (await apiClient.get('/quizzes')).data as QuizItem[] 
  });
  
  const { data: announcements } = useQuery({
    queryKey: ['announcements'],
    queryFn: async () => (await apiClient.get('/announcements')).data.items as Announcement[]
  });

  const { data: materials } = useQuery({
    queryKey: ['materials'],
    queryFn: async () => (await apiClient.get('/materials')).data.items as Material[]
  });

  if (loadingQuizzes) return <div className="animate-pulse space-y-4"><div className="h-40 rounded-2xl bg-white/5" /><div className="h-24 rounded-2xl bg-white/5" /></div>;
  
  const activeQuizzes = quizzes?.filter((quiz) => new Date(quiz.closeAt) > new Date()) || [];
  const nextQuizzes = activeQuizzes.sort((a, b) => new Date(a.closeAt).getTime() - new Date(b.closeAt).getTime()).slice(0, 3);
  const nextQuiz = nextQuizzes[0];

  const pinnedAnnouncements = announcements?.filter(a => a.isPinned).slice(0, 2) || [];
  const recentMaterials = materials?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 2) || [];

  return <div className="space-y-6">
    <section className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/25 via-[#181525] to-[#111116] p-6 md:p-8">
      <div className="absolute -right-10 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
      <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div>
          <p className="mb-2 text-sm font-medium text-primary-foreground/70">{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Welcome back, {user?.username || 'Student'}.</h1>
          <p className="mt-2 max-w-lg text-sm text-muted-foreground">Keep your momentum going. You are <span className="font-semibold text-foreground">4.2%</span> above your class average this month.</p>
        </div>
        <div className="flex items-center gap-3">
          <Avatar id={user?.sub || 'student'} name={user?.username || 'Student'} size="lg" className="h-14 w-14" />
          <div>
            <p className="font-semibold">Grade 13</p>
            <p className="text-sm text-muted-foreground">Hatton group</p>
          </div>
        </div>
      </div>
    </section>

    {pinnedAnnouncements.length > 0 && (
      <section className="grid gap-4 sm:grid-cols-2">
        {pinnedAnnouncements.map(ann => (
          <Card key={ann.announcementId} className="border-l-4 border-l-amber-400 bg-amber-400/5">
            <CardContent className="p-4">
              <div className="flex gap-2 items-start">
                <Pin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-sm">{ann.title}</h3>
                  <p className="text-xs text-foreground/80 mt-1 line-clamp-2 font-sinhala">{ann.body}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    )}

    <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatCard icon={Target} label="My average score" value="83.6%" trend="+4.2%" tone="text-primary" />
      <StatCard icon={CheckCircle2} label="Quizzes completed" value="18" trend="of 24 assigned" tone="text-emerald-400" />
      <StatCard icon={BookOpen} label="Class position" value="#07" trend="top 10% of class" tone="text-amber-400" />
    </section>

    <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-6">
        <Card className="overflow-hidden border-primary/20 bg-primary/5">
          <CardHeader className="flex flex-row items-start justify-between border-b border-white/10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Next quiz window</p>
              <CardTitle className="mt-2 text-xl">{nextQuiz?.title || 'No upcoming quizzes'}</CardTitle>
            </div>
            <CalendarDays className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent className="grid gap-5 p-6 sm:grid-cols-3">
            <Metric icon={Clock3} label="Duration" value={nextQuiz ? `${nextQuiz.durationMinutes} minutes` : '—'} />
            <Metric icon={CalendarDays} label="Closes" value={nextQuiz ? new Date(nextQuiz.closeAt).toLocaleDateString() : '—'} />
            <div className="sm:text-right">
              <Button disabled={!nextQuiz} onClick={() => nextQuiz && navigate(`/student/quizzes/${nextQuiz.quizId}/attempt`)}>Start quiz<ArrowUpRight className="ml-2 h-4 w-4" /></Button>
            </div>
          </CardContent>
        </Card>

        {nextQuizzes.length > 1 && (
          <Card>
            <CardHeader className="border-b border-white/10 py-3">
              <CardTitle className="text-sm">Upcoming Schedule</CardTitle>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-white/10">
              {nextQuizzes.slice(1).map(q => (
                <div key={q.quizId} className="flex justify-between items-center p-3 px-4">
                  <div>
                    <p className="text-sm font-medium">{q.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Closes {new Date(q.closeAt).toLocaleDateString()}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => navigate(`/student/quizzes/${q.quizId}/attempt`)}>Start</Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader className="border-b border-white/10 py-3">
            <CardTitle className="text-sm">Your progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            <div className="flex items-end justify-between"><span className="text-sm text-muted-foreground">Syllabus completed</span><span className="text-2xl font-bold">74%</span></div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[74%] rounded-full bg-primary" /></div>
            <p className="text-xs text-muted-foreground">You are on track for your September target.</p>
          </CardContent>
        </Card>

        {recentMaterials.length > 0 && (
          <Card>
            <CardHeader className="border-b border-white/10 flex flex-row items-center justify-between py-3">
              <CardTitle className="text-sm">Recent Materials</CardTitle>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => navigate('/student/materials')}>View all</Button>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-white/10">
              {recentMaterials.map(m => {
                const Icon = FILE_ICONS[m.fileType] || File;
                return (
                  <div key={m.materialId} className="flex items-start gap-3 p-3 px-4 hover:bg-muted/30">
                    <Icon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">{m.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{new Date(m.createdAt).toLocaleDateString()}</p>
                    </div>
                    <a href={m.fileKey} target="_blank" rel="noreferrer" className="shrink-0 text-muted-foreground hover:text-foreground">
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )}
      </div>
    </section>

    <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b border-white/10">
          <div><CardTitle className="text-lg">My recent attempts</CardTitle><p className="mt-1 text-sm text-muted-foreground">Your latest accounting quiz results.</p></div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/student/trend')}>View history <ArrowUpRight className="ml-1 h-3 w-3" /></Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-white/10">
            {recentAttempts.map((attempt) => (
              <div key={attempt.id} className="flex items-center justify-between gap-4 px-6 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar id={attempt.id} name={attempt.title} size="sm" className="rounded-lg" />
                  <div className="min-w-0"><p className="truncate text-sm font-medium">{attempt.title}</p><p className="text-xs text-muted-foreground">{attempt.date}</p></div>
                </div>
                <div className="text-right"><p className="font-bold text-emerald-400">{attempt.score}%</p><p className="text-xs text-muted-foreground">{attempt.status}</p></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Leaderboard quizId="q1" />
    </section>
  </div>;
}

function StatCard({ icon: Icon, label, value, trend, tone }: { icon: typeof Target; label: string; value: string; trend: string; tone: string }) { return <Card><CardContent className="p-5"><div className="mb-4 flex items-center justify-between"><span className="text-sm text-muted-foreground">{label}</span><Icon className={`h-5 w-5 ${tone}`} /></div><p className="text-3xl font-bold tracking-tight">{value}</p><p className="mt-1 text-xs text-muted-foreground">{trend}</p></CardContent></Card>; }
function Metric({ icon: Icon, label, value }: { icon: typeof Clock3; label: string; value: string }) { return <div className="flex items-center gap-3"><Icon className="h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">{label}</p><p className="text-sm font-semibold">{value}</p></div></div>; }
