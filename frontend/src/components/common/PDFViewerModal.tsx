import React from 'react';
import { FileText, Download, X, ExternalLink } from 'lucide-react';

interface PDFViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  fileUrl: string;
  fileName: string;
  description?: string;
}

export const PDFViewerModal: React.FC<PDFViewerModalProps> = ({
  isOpen,
  onClose,
  title,
  fileUrl,
  fileName,
  description,
}) => {
  if (!isOpen) return null;

  const fullFileUrl = fileUrl.startsWith('http') ? fileUrl : `http://localhost:5000${fileUrl}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-4xl w-full h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 leading-tight">{title}</h3>
              <p className="text-xs text-slate-500">{fileName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={fullFileUrl}
              download={fileName}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </a>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {description && (
          <div className="px-6 py-2 bg-indigo-50/50 border-b border-indigo-100/50 text-xs text-indigo-900">
            <strong>Summary:</strong> {description}
          </div>
        )}

        {/* Embedded Document View */}
        <div className="flex-1 bg-slate-100 relative">
          <iframe
            src={`${fullFileUrl}#toolbar=1`}
            title={title}
            className="w-full h-full border-none"
          />
        </div>
      </div>
    </div>
  );
};

