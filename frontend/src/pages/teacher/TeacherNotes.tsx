import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Card } from '../../components/common/Card';
import { PDFViewerModal } from '../../components/common/PDFViewerModal';
import { BookOpen, Upload, FileText, Download, Eye, X } from 'lucide-react';
import { Course, Note } from '../../types';

export const TeacherNotes: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewNote, setPreviewNote] = useState<Note | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Form
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const loadTree = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notes/tree');
      setCourses(res.data);
      const allChapters = res.data.flatMap((c: any) => c.subjects.flatMap((s: any) => s.chapters));
      if (allChapters.length > 0 && !selectedChapterId) {
        setSelectedChapterId(allChapters[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTree();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !selectedChapterId || !title) return;

    setUploading(true);
    const data = new FormData();
    data.append('file', file);
    data.append('chapterId', selectedChapterId);
    data.append('title', title);
    data.append('description', description);

    try {
      await api.post('/notes/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setIsUploadOpen(false);
      setTitle('');
      setDescription('');
      setFile(null);
      loadTree();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to upload note');
    } finally {
      setUploading(false);
    }
  };

  const allSubjects = courses.flatMap((c) => c.subjects || []);
  const allChapters = allSubjects.flatMap((s) => s.chapters || []);

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Faculty Study Material Desk</h1>
          <p className="text-xs text-slate-500">Upload authentic chapter-wise lecture notes and formula guides</p>
        </div>

        <button
          onClick={() => setIsUploadOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-indigo-500/20"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Study Material</span>
        </button>
      </div>

      <div className="space-y-6">
        {loading ? (
          <div className="py-12 text-center text-slate-400">Loading notes...</div>
        ) : (
          courses.map((c) => (
            <div key={c.id} className="space-y-3">
              <h2 className="text-sm font-bold text-slate-700">{c.name}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {c.subjects?.map((sub) => (
                  <Card key={sub.id} className="p-5 space-y-3">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-indigo-700">{sub.name}</h3>
                    <div className="space-y-2">
                      {sub.chapters?.map((ch) => (
                        <div key={ch.id} className="space-y-1">
                          <p className="text-xs font-semibold text-slate-800">
                            Ch. {ch.chapterNumber}: {ch.title}
                          </p>
                          <div className="space-y-1.5 pl-2">
                            {ch.notes?.map((n) => (
                              <div
                                key={n.id}
                                className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <FileText className="w-4 h-4 text-rose-500 shrink-0" />
                                  <span className="font-bold text-slate-700 truncate">{n.title}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => setPreviewNote(n)}
                                    className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                                    title="Preview"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                  <a
                                    href={`http://localhost:5000${n.fileUrl}`}
                                    download={n.fileName}
                                    className="p-1 text-slate-500 hover:bg-slate-200 rounded"
                                    title="Download"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                  </a>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Upload Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800">Upload PDF Chapter Notes</h3>
              <button
                onClick={() => setIsUploadOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Target Chapter *</label>
                <select
                  value={selectedChapterId}
                  onChange={(e) => setSelectedChapterId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-semibold"
                >
                  {allChapters.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      Ch. {ch.chapterNumber}: {ch.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Document Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Physics Formula Sheet"
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">PDF File *</label>
                <input
                  type="file"
                  required
                  accept=".pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-500/20"
                >
                  {uploading ? 'Uploading...' : 'Upload PDF'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {previewNote && (
        <PDFViewerModal
          isOpen={!!previewNote}
          onClose={() => setPreviewNote(null)}
          title={previewNote.title}
          fileUrl={previewNote.fileUrl}
          fileName={previewNote.fileName}
          description={previewNote.description}
        />
      )}
    </div>
  );
};

