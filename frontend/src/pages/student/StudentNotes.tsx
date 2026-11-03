import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Card } from '../../components/common/Card';
import { PDFViewerModal } from '../../components/common/PDFViewerModal';
import { BookOpen, FileText, Download, Eye, Layers } from 'lucide-react';
import { Course, Note } from '../../types';

export const StudentNotes: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewNote, setPreviewNote] = useState<Note | null>(null);

  useEffect(() => {
    const loadNotes = async () => {
      try {
        setLoading(true);
        const res = await api.get('/notes/tree');
        setCourses(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadNotes();
  }, []);

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Study Materials & Handouts</h1>
        <p className="text-xs text-slate-500">Official faculty notes, formula sheets, and chapter concept maps</p>
      </div>

      <div className="space-y-6">
        {loading ? (
          <div className="py-12 text-center text-slate-400">Loading study materials...</div>
        ) : (
          courses.map((course) => (
            <div key={course.id} className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm font-extrabold text-slate-800 tracking-tight">{course.name}</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {course.subjects?.map((sub) => (
                  <Card key={sub.id} className="p-5 space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: sub.colorHex }} />
                      <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">{sub.name}</h3>
                    </div>

                    <div className="space-y-3">
                      {sub.chapters?.map((ch) => (
                        <div key={ch.id} className="space-y-2">
                          <p className="text-xs font-semibold text-slate-700 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                            Ch. {ch.chapterNumber}: {ch.title}
                          </p>

                          <div className="space-y-2 pl-2">
                            {ch.notes?.map((n) => (
                              <div
                                key={n.id}
                                className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between text-xs hover:border-indigo-300 transition-colors"
                              >
                                <div className="flex items-center gap-2.5 truncate">
                                  <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                                    <FileText className="w-4 h-4" />
                                  </div>
                                  <div className="truncate">
                                    <p className="font-bold text-slate-800 truncate">{n.title}</p>
                                    <p className="text-[10px] text-slate-400">{(n.fileSize / 1024).toFixed(0)} KB</p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => setPreviewNote(n)}
                                    className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 font-bold"
                                    title="Preview"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <a
                                    href={`http://localhost:5000${n.fileUrl}`}
                                    download={n.fileName}
                                    className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-slate-100"
                                    title="Download"
                                  >
                                    <Download className="w-4 h-4" />
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

