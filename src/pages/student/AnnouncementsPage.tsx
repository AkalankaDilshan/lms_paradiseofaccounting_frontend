import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Megaphone, Pin, X, Plus, Edit2 } from 'lucide-react';
import { motion } from 'motion/react';
import { GroupBadge } from '../../components/GroupBadge';
import { groupToggleClasses } from '../../lib/groupColors';

const GROUPS = [
  'ALL', '2028-GINIGATHHENA', '2028-HATTON', '2028-NAWALAPITIYA', '2028-ONLINE',
  '2027-GINIGATHHENA', '2027-HATTON', '2027-NAWALAPITIYA', '2027-ONLINE', 'REVISION',
];

interface Announcement {
  announcementId: string;
  title: string;
  body: string;
  targetGroups: string[];
  isPinned: boolean;
  status: 'published' | 'draft';
  createdAt: string;
}

interface AnnouncementsPageProps {
  role?: 'teacher';
}

export function AnnouncementsPage({ role }: AnnouncementsPageProps) {
  const isTeacher = role === 'teacher';
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Announcement | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formBody, setFormBody] = useState('');
  const [formGroups, setFormGroups] = useState<string[]>(['ALL']);
  const [formPinned, setFormPinned] = useState(false);

  // Track read state in localStorage
  const markRead = (id: string) => {
    const read = JSON.parse(localStorage.getItem('lms-read-ann') || '{}');
    read[id] = true;
    localStorage.setItem('lms-read-ann', JSON.stringify(read));
  };
  const isRead = (id: string) => {
    const read = JSON.parse(localStorage.getItem('lms-read-ann') || '{}');
    return !!read[id];
  };

  const { data, isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      const res = await apiClient.get('/announcements');
      return (res.data.items as Announcement[]).sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    },
  });

  const createAnn = useMutation({
    mutationFn: async () => {
      if (editItem) {
        await apiClient.put(`/announcements/${editItem.announcementId}`, {
          title: formTitle, body: formBody, targetGroups: formGroups, isPinned: formPinned, status: 'published',
        });
      } else {
        await apiClient.post('/announcements', {
          title: formTitle, body: formBody, targetGroups: formGroups, isPinned: formPinned, status: 'published',
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      closeModal();
    },
  });

  const deleteAnn = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/announcements/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['announcements'] }),
  });

  const openCreate = () => {
    setEditItem(null);
    setFormTitle(''); setFormBody(''); setFormGroups(['ALL']); setFormPinned(false);
    setShowModal(true);
  };

  const openEdit = (a: Announcement) => {
    setEditItem(a);
    setFormTitle(a.title); setFormBody(a.body); setFormGroups(a.targetGroups); setFormPinned(a.isPinned);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false); setEditItem(null);
  };

  const toggleGroup = (g: string) => {
    if (g === 'ALL') { setFormGroups(['ALL']); return; }
    setFormGroups(prev => {
      const next = prev.filter(x => x !== 'ALL');
      return next.includes(g) ? next.filter(x => x !== g) : [...next, g];
    });
  };

  if (isLoading) return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-28 rounded-xl bg-white/5 animate-pulse" />
      ))}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="max-w-3xl mx-auto space-y-6 pb-16"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">{isTeacher ? 'Teacher' : 'Student'}</p>
          <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
          <p className="mt-1 text-muted-foreground">
            {isTeacher ? 'Post updates and notices for your students.' : 'Stay up to date with class notices.'}
          </p>
        </div>
        {isTeacher && (
          <Button onClick={openCreate} className="shrink-0">
            <Plus className="w-4 h-4 mr-2" /> New Announcement
          </Button>
        )}
      </div>

      {(data ?? []).length === 0 && (
        <div className="py-16 text-center text-muted-foreground">
          <Megaphone className="mx-auto mb-3 h-8 w-8 opacity-30" />
          <p className="text-sm">No announcements yet.</p>
        </div>
      )}

      <div className="space-y-4">
        {(data ?? []).map((ann) => {
          const unread = !isRead(ann.announcementId);
          return (
            <Card
              key={ann.announcementId}
              className={`border-l-4 transition-colors ${ann.isPinned ? 'border-l-amber-400' : 'border-l-primary/30'} ${unread && !isTeacher ? 'bg-primary/3' : ''}`}
              onClick={() => { if (!isTeacher) markRead(ann.announcementId); }}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-3 justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      {unread && !isTeacher && (
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                      )}
                      {ann.isPinned && (
                        <span className="flex items-center gap-1 text-xs font-medium text-accent">
                          <Pin className="w-3 h-3" /> Pinned
                        </span>
                      )}
                      <h3 className="font-semibold text-base">{ann.title}</h3>
                    </div>
                    <p className="text-sm text-foreground/80 font-sinhala leading-relaxed mb-3">{ann.body}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 items-center">
                      <span className="text-xs text-muted-foreground">
                        {new Date(ann.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      {ann.targetGroups.map(g => (
                        <GroupBadge key={g} group={g} />
                      ))}
                    </div>
                  </div>
                  {isTeacher && (
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(ann)}>
                        <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteAnn.mutate(ann.announcementId)}>
                        <X className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg">
            <Card>
              <div className="flex items-center justify-between p-5 border-b border-white/10">
                <h3 className="font-semibold text-lg">{editItem ? 'Edit Announcement' : 'New Announcement'}</h3>
                <button onClick={closeModal} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <CardContent className="p-5 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ann-title">Title</Label>
                  <Input id="ann-title" value={formTitle} onChange={e => setFormTitle(e.target.value)}
                    placeholder="Announcement title" className="h-10" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ann-body">Body (Sinhala/English)</Label>
                  <textarea
                    id="ann-body"
                    className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm font-sinhala resize-y focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Announcement content..."
                    value={formBody}
                    onChange={e => setFormBody(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Target Groups</Label>
                  <div className="flex flex-wrap gap-2">
                    {GROUPS.map(g => (
                      <button key={g} type="button"
                        onClick={() => toggleGroup(g)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${groupToggleClasses(g, formGroups.includes(g))}`}>
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" className="accent-primary" checked={formPinned}
                    onChange={e => setFormPinned(e.target.checked)} />
                  Pin this announcement (shows at top)
                </label>
                <div className="flex gap-3 pt-2">
                  <Button className="flex-1" onClick={() => createAnn.mutate()} disabled={createAnn.isPending}>
                    {createAnn.isPending ? 'Saving...' : editItem ? 'Update' : 'Publish'}
                  </Button>
                  <Button variant="outline" onClick={closeModal}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
