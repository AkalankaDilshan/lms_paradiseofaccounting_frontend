import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Mail, Send, X } from 'lucide-react';
import { motion } from 'motion/react';

const GROUPS = [
  'ALL', 'G12-GINIGATHHENA', 'G12-HATTON', 'G12-NAWALAPITIYA',
  'G13-GINIGATHHENA', 'G13-HATTON', 'G13-NAWALAPITIYA',
];

interface Message {
  messageId: string;
  subject: string;
  body: string;
  fromUserId: string;
  sentAt: string;
  targetGroups: string[];
}

interface MessagesPageProps {
  role?: 'teacher';
}

export function MessagesPage({ role }: MessagesPageProps) {
  const isTeacher = role === 'teacher';
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<Message | null>(null);
  const [formSubject, setFormSubject] = useState('');
  const [formBody, setFormBody] = useState('');
  const [formGroups, setFormGroups] = useState<string[]>(['ALL']);

  const { data, isLoading } = useQuery({
    queryKey: ['messages'],
    queryFn: async () => {
      const res = await apiClient.get('/messages');
      return (res.data.items as Message[]).sort((a, b) =>
        new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
      );
    },
  });

  const sendMessage = useMutation({
    mutationFn: async () => {
      await apiClient.post('/messages', {
        subject: formSubject,
        body: formBody,
        targetGroups: formGroups,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      setShowModal(false);
      setFormSubject(''); setFormBody(''); setFormGroups(['ALL']);
    },
  });

  const toggleGroup = (g: string) => {
    if (g === 'ALL') { setFormGroups(['ALL']); return; }
    setFormGroups(prev => {
      const next = prev.filter(x => x !== 'ALL');
      return next.includes(g) ? next.filter(x => x !== g) : [...next, g];
    });
  };

  if (isLoading) return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse" />)}
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
      className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">{isTeacher ? 'Teacher' : 'Student'}</p>
          <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
          <p className="mt-1 text-muted-foreground">
            {isTeacher ? 'Broadcast messages to your students.' : 'Messages from your teacher.'}
          </p>
        </div>
        {isTeacher && (
          <Button onClick={() => setShowModal(true)} className="shrink-0">
            <Send className="w-4 h-4 mr-2" /> New Message
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] gap-6">
        {/* Message list */}
        <Card>
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-base">Inbox</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {(data ?? []).length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <Mail className="mx-auto mb-3 h-8 w-8 opacity-30" />
                <p className="text-sm">No messages yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {(data ?? []).map(msg => (
                  <button key={msg.messageId}
                    onClick={() => setSelected(msg)}
                    className={`w-full text-left p-4 hover:bg-muted/40 transition-colors ${selected?.messageId === msg.messageId ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}>
                    <p className="font-medium text-sm line-clamp-1">{msg.subject}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{msg.body}</p>
                    <p className="text-[10px] text-muted-foreground mt-1.5">
                      {new Date(msg.sentAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Message detail */}
        <Card>
          <CardContent className="p-6">
            {!selected ? (
              <div className="py-16 text-center text-muted-foreground">
                <Mail className="mx-auto mb-3 h-8 w-8 opacity-30" />
                <p className="text-sm">Select a message to read.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold">{selected.subject}</h2>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selected.targetGroups.map(g => (
                      <span key={g} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{g}</span>
                    ))}
                    <span className="text-xs text-muted-foreground">
                      {new Date(selected.sentAt).toLocaleString('en-US', {
                        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
                <p className="text-sm font-sinhala leading-relaxed whitespace-pre-wrap text-foreground/90">{selected.body}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Send Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg">
            <Card>
              <div className="flex items-center justify-between p-5 border-b border-white/10">
                <h3 className="font-semibold text-lg">New Message</h3>
                <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
              </div>
              <CardContent className="p-5 space-y-4">
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input value={formSubject} onChange={e => setFormSubject(e.target.value)}
                    placeholder="Message subject" className="h-10" />
                </div>
                <div className="space-y-2">
                  <Label>Body (Sinhala/English)</Label>
                  <textarea
                    className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm font-sinhala resize-y focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Message content..."
                    value={formBody}
                    onChange={e => setFormBody(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Target Groups</Label>
                  <div className="flex flex-wrap gap-2">
                    {GROUPS.map(g => (
                      <button key={g} type="button" onClick={() => toggleGroup(g)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          formGroups.includes(g) ? 'bg-primary text-primary-foreground' : 'bg-white/10 text-muted-foreground hover:bg-white/20'
                        }`}>{g}</button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button className="flex-1" onClick={() => sendMessage.mutate()} disabled={sendMessage.isPending}>
                    <Send className="w-4 h-4 mr-2" />
                    {sendMessage.isPending ? 'Sending...' : 'Send Message'}
                  </Button>
                  <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
