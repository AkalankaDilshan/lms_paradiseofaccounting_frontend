import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Plus, X, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { motion } from 'motion/react';

interface OptionDraft {
  index: number;
  text: string;
}

export function QuestionForm() {
  const { id: questionId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!questionId;

  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState<OptionDraft[]>([
    { index: 0, text: '' },
    { index: 1, text: '' },
    { index: 2, text: '' },
    { index: 3, text: '' },
  ]);
  const [correctIndex, setCorrectIndex] = useState<number>(0);
  const [explanation, setExplanation] = useState('');
  const [tags, setTags] = useState('');
  const [imageKey, setImageKey] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const [error, setError] = useState('');

  // Load for edit
  useQuery({
    queryKey: ['questionDetail', questionId],
    queryFn: async () => {
      const res = await apiClient.get('/questions');
      const all = res.data.items as any[];
      const q = all.find((x: any) => x.questionId === questionId);
      if (q) {
        setQuestionText(q.questionText);
        setOptions(q.options);
        setCorrectIndex(q.correctAnswerIndex);
        setExplanation(q.explanation || '');
        setTags((q.tags || []).join(', '));
        setImageKey(q.imageKey || '');
      }
      return q;
    },
    enabled: isEdit,
  });

  const saveQuestion = useMutation({
    mutationFn: async () => {
      const payload = {
        questionText,
        options: options.filter(o => o.text.trim()),
        correctAnswerIndex: correctIndex,
        explanation,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        imageKey: imageKey || undefined,
      };
      if (isEdit) {
        await apiClient.put(`/questions/${questionId}`, payload);
      } else {
        await apiClient.post('/questions', payload);
      }
    },
    onSuccess: () => navigate('/teacher/questions'),
    onError: () => setError('Failed to save question.'),
  });

  const addOption = () => {
    if (options.length >= 5) return;
    setOptions(prev => [...prev, { index: prev.length, text: '' }]);
  };

  const removeOption = (idx: number) => {
    if (options.length <= 2) return;
    setOptions(prev => prev.filter((_, i) => i !== idx).map((o, i) => ({ ...o, index: i })));
    if (correctIndex >= options.length - 1) setCorrectIndex(0);
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;
    setImageUploading(true);
    try {
      // Get presigned URL
      const res = await apiClient.get('/questions/image-upload-url', {
        params: { filename: file.name, contentType: file.type }
      });
      const { uploadUrl, imageKey: key } = res.data;
      // Upload directly to S3
      await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      setImageKey(key);
    } catch {
      setError('Image upload failed.');
    } finally {
      setImageUploading(false);
    }
  };

  const handleSubmit = () => {
    if (!questionText.trim()) { setError('Question text is required.'); return; }
    if (options.filter(o => o.text.trim()).length < 2) { setError('At least 2 options are required.'); return; }
    setError('');
    saveQuestion.mutate();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="max-w-3xl mx-auto space-y-6 pb-16"
    >
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/teacher/questions')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <p className="text-sm font-medium text-primary">Question Bank</p>
          <h1 className="text-3xl font-bold tracking-tight">{isEdit ? 'Edit Question' : 'New Question'}</h1>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b border-white/10">
          <CardTitle>Question Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          {/* Question text */}
          <div className="space-y-2">
            <Label htmlFor="qtext">Question Text (Sinhala/English)</Label>
            <textarea
              id="qtext"
              className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm font-sinhala text-base resize-y focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="ප්‍රශ්නය මෙහි ඇතුළත් කරන්න..."
              value={questionText}
              onChange={e => setQuestionText(e.target.value)}
            />
          </div>

          {/* Options */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Answer Options</Label>
              <Button variant="outline" size="sm" onClick={addOption} disabled={options.length >= 5}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Option
              </Button>
            </div>
            {options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <input
                  type="radio"
                  name="correct"
                  className="accent-primary shrink-0"
                  checked={correctIndex === idx}
                  onChange={() => setCorrectIndex(idx)}
                  title="Mark as correct answer"
                />
                <Input
                  placeholder={`Option ${idx + 1}...`}
                  value={opt.text}
                  onChange={e => setOptions(prev => prev.map((o, i) => i === idx ? { ...o, text: e.target.value } : o))}
                  className={`h-10 flex-1 font-sinhala ${correctIndex === idx ? 'border-success/50' : ''}`}
                />
                <button onClick={() => removeOption(idx)} className="text-muted-foreground hover:text-destructive" title="Remove option">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <p className="text-xs text-muted-foreground">Select the radio button next to the correct answer.</p>
          </div>

          {/* Explanation */}
          <div className="space-y-2">
            <Label htmlFor="explanation">Explanation (Optional)</Label>
            <textarea
              id="explanation"
              className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm font-sinhala resize-y focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="පිළිතුරු පැහැදිලි කිරීම..."
              value={explanation}
              onChange={e => setExplanation(e.target.value)}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              placeholder="e.g. Assets, 2027 Batch, Depreciation"
              value={tags}
              onChange={e => setTags(e.target.value)}
              className="h-10"
            />
          </div>

          {/* Image upload */}
          <div className="space-y-2">
            <Label>Question Image (Optional)</Label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer px-4 py-2 rounded-md border border-dashed border-white/20 hover:border-primary/50 transition-colors text-sm text-muted-foreground hover:text-foreground">
                <ImageIcon className="w-4 h-4" />
                {imageUploading ? 'Uploading...' : 'Choose image'}
                <input type="file" accept="image/*" className="hidden"
                  onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0])} />
              </label>
              {imageKey && (
                <div className="flex items-center gap-2 text-sm text-success">
                  <span className="truncate max-w-xs">Image uploaded ✓</span>
                  <button onClick={() => setImageKey('')} className="hover:text-destructive">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
            {imageKey && (
              <img src={imageKey} alt="Question" className="max-h-40 rounded-md border border-white/10 object-contain" />
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-3 pt-2 border-t border-white/10">
            <Button onClick={handleSubmit} disabled={saveQuestion.isPending}>
              {saveQuestion.isPending ? 'Saving...' : isEdit ? 'Update Question' : 'Save Question'}
            </Button>
            <Button variant="outline" onClick={() => navigate('/teacher/questions')}>Cancel</Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
