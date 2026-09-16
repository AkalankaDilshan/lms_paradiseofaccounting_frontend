import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { FileText, FileImage, File, Download, Upload, Search, Filter, X, Plus, Library } from 'lucide-react';
import { motion } from 'motion/react';

const GROUPS = [
  'ALL', 'G12-GINIGATHHENA', 'G12-HATTON', 'G12-NAWALAPITIYA',
  'G13-GINIGATHHENA', 'G13-HATTON', 'G13-NAWALAPITIYA', 'REVISION',
];

const FILE_ICONS: Record<string, typeof FileText> = {
  pdf: FileText,
  image: FileImage,
  doc: File,
};

interface Material {
  materialId: string;
  title: string;
  description: string;
  targetGroups: string[];
  fileKey: string;
  fileType: string;
  fileSizeBytes: number;
  tags: string[];
  createdAt: string;
}

interface MaterialsPageProps {
  role?: 'teacher';
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MaterialsPage({ role }: MaterialsPageProps) {
  const isTeacher = role === 'teacher';
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'pdf' | 'image' | 'doc'>('all');
  const [showModal, setShowModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');

  // Upload form
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formTags, setFormTags] = useState('');
  const [formGroups, setFormGroups] = useState<string[]>(['ALL']);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['materials'],
    queryFn: async () => {
      const res = await apiClient.get('/materials');
      return res.data.items as Material[];
    },
  });

  const uploadMaterial = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error('No file selected');
      setUploadProgress('Getting upload URL...');

      const urlRes = await apiClient.get('/materials/upload-url', {
        params: { filename: selectedFile.name, contentType: selectedFile.type }
      });
      const { uploadUrl, fileKey } = urlRes.data;

      setUploadProgress('Uploading file...');
      await fetch(uploadUrl, {
        method: 'PUT',
        body: selectedFile,
        headers: { 'Content-Type': selectedFile.type },
      });

      setUploadProgress('Saving metadata...');
      const fileType = selectedFile.type.startsWith('image/') ? 'image'
        : selectedFile.name.endsWith('.pdf') ? 'pdf' : 'doc';

      await apiClient.post('/materials', {
        title: formTitle,
        description: formDesc,
        targetGroups: formGroups,
        fileKey,
        fileType,
        fileSizeBytes: selectedFile.size,
        tags: formTags.split(',').map(t => t.trim()).filter(Boolean),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      setShowModal(false);
      setUploadProgress('');
      setFormTitle(''); setFormDesc(''); setFormTags('');
      setFormGroups(['ALL']); setSelectedFile(null);
    },
    onError: () => setUploadProgress('Upload failed. Please try again.'),
  });

  const deleteMaterial = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/materials/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['materials'] }),
  });

  const filtered = (data ?? []).filter(m => {
    const matchSearch = m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchType = typeFilter === 'all' || m.fileType === typeFilter;
    return matchSearch && matchType;
  });

  const toggleGroup = (g: string) => {
    if (g === 'ALL') { setFormGroups(['ALL']); return; }
    setFormGroups(prev => {
      const next = prev.filter(x => x !== 'ALL');
      return next.includes(g) ? next.filter(x => x !== g) : [...next, g];
    });
  };

  if (isLoading) return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {[...Array(4)].map((_, i) => <div key={i} className="h-32 rounded-xl bg-white/5 animate-pulse" />)}
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
      className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm font-medium text-primary">{isTeacher ? 'Teacher' : 'Student'}</p>
          <h1 className="text-3xl font-bold tracking-tight">Study Materials</h1>
          <p className="mt-1 text-muted-foreground">
            {isTeacher ? 'Upload and manage study resources.' : 'Browse and download your study materials.'}
          </p>
        </div>
        {isTeacher && (
          <Button onClick={() => setShowModal(true)} className="shrink-0">
            <Upload className="w-4 h-4 mr-2" /> Upload Material
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search materials or tags..."
            value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10" />
        </div>
        <div className="flex gap-2">
          {(['all', 'pdf', 'image', 'doc'] as const).map(t => (
            <Button key={t} variant={typeFilter === t ? 'secondary' : 'outline'} size="sm"
              onClick={() => setTypeFilter(t)} className="h-10 uppercase text-xs">{t}</Button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <Library className="mx-auto mb-3 h-8 w-8 opacity-30" />
          <p className="text-sm">No materials found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(m => {
            const Icon = FILE_ICONS[m.fileType] || File;
            return (
              <motion.div key={m.materialId}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}>
                <Card className="h-full hover:border-primary/30 transition-colors group">
                  <CardContent className="p-5 flex flex-col h-full">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm line-clamp-2">{m.title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{m.description}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {m.tags.map(t => (
                        <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-muted-foreground">{t}</span>
                      ))}
                    </div>
                    <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
                      <span>{formatBytes(m.fileSizeBytes)}</span>
                      <span>{new Date(m.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <a href={m.fileKey} target="_blank" rel="noreferrer" className="flex-1">
                        <Button variant="outline" size="sm" className="w-full h-9">
                          <Download className="w-3.5 h-3.5 mr-1.5" /> Download
                        </Button>
                      </a>
                      {isTeacher && (
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-rose-400 shrink-0"
                          onClick={() => deleteMaterial.mutate(m.materialId)}>
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {m.targetGroups.map(g => (
                        <span key={g} className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">{g}</span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg">
            <Card>
              <div className="flex items-center justify-between p-5 border-b border-white/10">
                <h3 className="font-semibold text-lg">Upload Material</h3>
                <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
              </div>
              <CardContent className="p-5 space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="Material title" className="h-10" />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="Brief description" className="h-10" />
                </div>
                <div className="space-y-2">
                  <Label>Tags (comma-separated)</Label>
                  <Input value={formTags} onChange={e => setFormTags(e.target.value)} placeholder="e.g. Partnership, Grade 13" className="h-10" />
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
                <div className="space-y-2">
                  <Label>File (PDF, image, doc — max 20MB)</Label>
                  <div
                    className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-white/20 rounded-lg p-6 hover:border-primary/40 cursor-pointer transition-colors"
                    onClick={() => fileRef.current?.click()}
                  >
                    <Upload className="w-6 h-6 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {selectedFile ? selectedFile.name : 'Click to choose a file'}
                    </p>
                    <input ref={fileRef} type="file" className="hidden" accept=".pdf,.doc,.docx,image/*"
                      onChange={e => setSelectedFile(e.target.files?.[0] || null)} />
                  </div>
                </div>
                {uploadProgress && (
                  <p className="text-sm text-primary">{uploadProgress}</p>
                )}
                <div className="flex gap-3">
                  <Button className="flex-1" onClick={() => uploadMaterial.mutate()}
                    disabled={uploadMaterial.isPending || !selectedFile || !formTitle}>
                    {uploadMaterial.isPending ? 'Uploading...' : 'Upload'}
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
