import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Card } from '../../components/common/Card';
import { PDFViewerModal } from '../../components/common/PDFViewerModal';
import {
  BookOpen,
  Plus,
  Search,
  FileText,
  Download,
  Eye,
  Trash2,
  Folder,
  Layers,
  Upload,
  X,
  AlertCircle,
} from 'lucide-react';
import { Course, Subject, Chapter, Note } from '../../types';

export const AdminNotes: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isChapterOpen, setIsChapterOpen] = useState(false);
  const [previewNote, setPreviewNote] = useState<Note | null>(null);

  // Upload Form
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // New Chapter Form
  const [newChapterSubjId, setNewChapterSubjId] = useState('');
  const [newChapterNum, setNewChapterNum] = useState(3);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [newChapterDesc, setNewChapterDesc] = useState('');

  const loadTree = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notes/tree', { params: { search } });
      setCourses(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTree();
  }, [search]);

  // Extract all subjects and chapters for dropdown selection
  const allSubjects = courses.flatMap((c) => c.subjects || []);
  const availableChapters = allSubjects.find((s) => s.id === selectedSubjectId)?.chapters || [];

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !selectedChapterId || !uploadTitle) {
      alert('Please fill all required fields and select a PDF file.');
      return;
    }

    setUploading(true);
    const data = new FormData();
    data.append('file', uploadFile);
    data.append('chapterId', selectedChapterId);
    data.append('title', uploadTitle);
    data.append('description', uploadDesc);

    try {
      await api.post('/notes/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setIsUploadOpen(false);
      setUploadTitle('');
      setUploadDesc('');
      setUploadFile(null);
      loadTree();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleCreateChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/notes/chapter', {
        subjectId: newChapterSubjId,
        chapterNumber: Number(newChapterNum),
        title: newChapterTitle,
        description: newChapterDesc,
      });
      setIsChapterOpen(false);
      setNewChapterTitle('');
      setNewChapterDesc('');
      loadTree();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create chapter');
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (confirm('Delete this study note file?')) {
      try {
        await api.delete(`/notes/${id}`);
        loadTree();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Curriculum Notes & Study Material</h1>
          <p className="text-xs text-slate-500">
            Hierarchy: Program → Subject → Chapter → PDF Study Sheets
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (allSubjects.length > 0) setNewChapterSubjId(allSubjects[0].id);
              setIsChapterOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition-all"
          >
            <Folder className="w-4 h-4 text-slate-500" />
            <span>Add Chapter</span>
          </button>

          <button
            onClick={() => {
              if (allSubjects.length > 0) {
                setSelectedSubjectId(allSubjects[0].id);
                if (allSubjects[0].chapters && allSubjects[0].chapters.length > 0) {
                  setSelectedChapterId(allSubjects[0].chapters[0].id);
                }
              }
              setIsUploadOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-indigo-500/20 transition-all"
          >
            <Upload className="w-4 h-4" />
            <span>Upload PDF Note</span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <Card className="p-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes by title, chapter or filename..."
            className="w-full bg-slate-50 border border-slate-200 pl-9 pr-4 py-2 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </Card>

      {/* Hierarchical Study Material Tree */}
      <div className="space-y-8">
        {loading ? (
          <div className="py-12 text-center text-slate-400">Loading study material hierarchy...</div>
        ) : courses.length === 0 ? (
          <div className="py-12 text-center text-slate-400">No study notes found matching search.</div>
        ) : (
          courses.map((course) => (
            <div key={course.id} className="space-y-4">
              {/* Course Title Badge */}
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <h2 className="text-base font-extrabold text-slate-800 tracking-tight">{course.name}</h2>
                <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                  {course.code}
                </span>
              </div>

              {/* Subjects Under Course */}
              <div className="grid grid-cols-1 gap-4">
                {course.subjects?.map((sub) => (
                  <Card key={sub.id} className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-3.5 h-3.5 rounded-full"
                          style={{ backgroundColor: sub.colorHex }}
                        />
                        <h3 className="font-bold text-sm text-slate-800">{sub.name}</h3>
                        <span className="text-[10px] text-slate-400 font-medium">({sub.code})</span>
                      </div>
                      <span className="text-xs text-slate-400 font-semibold">
                        {sub.chapters?.length || 0} Chapters
                      </span>
                    </div>

                    {/* Chapters List */}
                    <div className="space-y-3 pl-3 border-l-2 border-slate-100">
                      {sub.chapters?.map((ch) => (
                        <div key={ch.id} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                              Ch. {ch.chapterNumber}: {ch.title}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {ch.notes?.length || 0} Files
                            </span>
                          </div>

                          {/* Notes Files */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                            {ch.notes?.length === 0 ? (
                              <p className="text-[11px] text-slate-400 italic">No notes uploaded yet for this chapter.</p>
                            ) : (
                              ch.notes?.map((n) => (
                                <div
                                  key={n.id}
                                  className="p-3 bg-slate-50 hover:bg-indigo-50/50 rounded-2xl border border-slate-200 hover:border-indigo-200 transition-all flex flex-col justify-between space-y-2 group"
                                >
                                  <div className="flex items-start gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                                      <FileText className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-bold text-slate-800 text-xs truncate leading-tight">
                                        {n.title}
                                      </p>
                                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{n.fileName}</p>
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-200/60">
                                    <span className="text-[10px] text-slate-400">
                                      {(n.fileSize / 1024).toFixed(0)} KB • v{n.version}
                                    </span>
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => setPreviewNote(n)}
                                        className="p-1 rounded-lg hover:bg-white text-indigo-600 transition-colors"
                                        title="Preview PDF"
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                      </button>
                                      <a
                                        href={`http://localhost:5000${n.fileUrl}`}
                                        download={n.fileName}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="p-1 rounded-lg hover:bg-white text-slate-600 hover:text-indigo-600 transition-colors"
                                        title="Download"
                                      >
                                        <Download className="w-3.5 h-3.5" />
                                      </a>
                                      <button
                                        onClick={() => handleDeleteNote(n.id)}
                                        className="p-1 rounded-lg hover:bg-white text-slate-400 hover:text-rose-600 transition-colors"
                                        title="Delete note"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
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
              <div>
                <h3 className="text-base font-bold text-slate-800">Upload Study Material</h3>
                <p className="text-xs text-slate-400">Upload authentic faculty notes and chapter formula sheets</p>
              </div>
              <button
                onClick={() => setIsUploadOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Subject Discipline *</label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => {
                    setSelectedSubjectId(e.target.value);
                    const sub = allSubjects.find((s) => s.id === e.target.value);
                    if (sub?.chapters && sub.chapters.length > 0) {
                      setSelectedChapterId(sub.chapters[0].id);
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-semibold"
                >
                  {allSubjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Chapter Module *</label>
                <select
                  value={selectedChapterId}
                  onChange={(e) => setSelectedChapterId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-semibold"
                >
                  {availableChapters.map((c) => (
                    <option key={c.id} value={c.id}>
                      Ch. {c.chapterNumber}: {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Document Title *</label>
                <input
                  type="text"
                  required
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. Kinematics Derivation Sheet"
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Summary / Notes Context</label>
                <textarea
                  rows={2}
                  value={uploadDesc}
                  onChange={(e) => setUploadDesc(e.target.value)}
                  placeholder="Formula derivations and solved numerical questions..."
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Select PDF File *</label>
                <input
                  type="file"
                  required
                  accept=".pdf"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-500/20"
                >
                  {uploading ? 'Uploading...' : 'Upload Material'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Chapter Modal */}
      {isChapterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800">Add Syllabus Chapter</h3>
                <p className="text-xs text-slate-400">Create new chapter topic under a subject</p>
              </div>
              <button
                onClick={() => setIsChapterOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateChapter} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Subject Discipline *</label>
                <select
                  value={newChapterSubjId}
                  onChange={(e) => setNewChapterSubjId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-semibold"
                >
                  {allSubjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Chapter # *</label>
                  <input
                    type="number"
                    required
                    value={newChapterNum}
                    onChange={(e) => setNewChapterNum(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-bold"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="font-bold text-slate-700">Chapter Title *</label>
                  <input
                    type="text"
                    required
                    value={newChapterTitle}
                    onChange={(e) => setNewChapterTitle(e.target.value)}
                    placeholder="e.g. Thermodynamics & Heat"
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Description</label>
                <textarea
                  rows={2}
                  value={newChapterDesc}
                  onChange={(e) => setNewChapterDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsChapterOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-500/20"
                >
                  Save Chapter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PDF Viewer Modal */}
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

