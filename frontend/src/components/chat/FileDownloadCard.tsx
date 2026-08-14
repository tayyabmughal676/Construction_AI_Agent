import React from 'react';
import { Download } from 'lucide-react';

interface FileDownloadCardProps {
  data?: any;
  messageText: string;
}

export const FileDownloadCard: React.FC<FileDownloadCardProps> = ({ data, messageText }) => {
  const downloadUrl =
    data?.downloadUrl ||
    (data?.filename
      ? data.filename.endsWith('.csv')
        ? `/api/files/csv/${data.filename}`
        : data.filename.endsWith('.xlsx')
        ? `/api/files/excel/${data.filename}`
        : data.filename.endsWith('.pdf')
        ? `/api/files/pdfs/${data.filename}`
        : null
      : null) ||
    (() => {
      const match = messageText.match(/([a-zA-Z0-9_-]+\.(csv|xlsx|pdf))/i);
      if (!match) return null;
      const fn = match[1];
      const ext = match[2].toLowerCase();
      const folder = ext === 'csv' ? 'csv' : ext === 'xlsx' ? 'excel' : 'pdfs';
      return `/api/files/${folder}/${fn}`;
    })();

  if (!downloadUrl) return null;

  const fileName = downloadUrl.split('/').pop() || 'file';
  const fileExt = fileName.split('.').pop()?.toUpperCase() || 'FILE';

  return (
    <div className="mt-3 p-3 rounded-xl bg-slate-900/80 border border-amber-500/30 flex items-center justify-between gap-3 shadow-lg">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
          <span className="text-xs font-mono font-bold text-amber-400">{fileExt}</span>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-white truncate">{fileName}</p>
          <p className="text-[10px] text-slate-500">Ready for download</p>
        </div>
      </div>
      <a
        href={downloadUrl}
        download={fileName}
        target="_blank"
        rel="noopener noreferrer"
        className="px-3.5 py-1.5 bg-amber-400 hover:bg-yellow-500 text-slate-950 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shrink-0 shadow-md shadow-amber-400/20"
      >
        <Download className="w-3.5 h-3.5" strokeWidth={2.5} />
        <span>Download</span>
      </a>
    </div>
  );
};
