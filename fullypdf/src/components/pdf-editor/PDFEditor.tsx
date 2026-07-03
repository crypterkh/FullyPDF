
import React, { useEffect, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { usePDFEditorStore } from './PDFEditorStore';
import { Toolbar } from './Toolbar';
import { Sidebar } from './Sidebar';
import { Viewer } from './Viewer';
import { Loader2, AlertCircle, FileText } from 'lucide-react';
import { toast } from 'sonner';

// Configure PDF.js Worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface PDFEditorProps {
  file: File | Blob;
  onSave?: (blob: Blob) => void;
  title?: string;
}

export const PDFEditor = ({ file, onSave, title }: PDFEditorProps) => {
  const { setFile, setPdfDoc, setPages, pages, sidebarOpen } = usePDFEditorStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPDF = async () => {
      try {
        setLoading(true);
        setError(null);
        // If it's a blob from a merge, we might want to wrap it in a File object if name is needed
        const fileToSet = file instanceof File ? file : new File([file], title || 'document.pdf', { type: 'application/pdf' });
        setFile(fileToSet);

        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        
        setPdfDoc(pdf);
        
        const initialPages = Array.from({ length: pdf.numPages }, (_, i) => ({
          id: `page-${i + 1}-${Math.random().toString(36).substr(2, 9)}`,
          originalIndex: i,
          rotation: 0,
          isDeleted: false,
          annotations: []
        }));
        
        setPages(initialPages);
        toast.success('Document loaded successfully');
      } catch (err: any) {
        console.error('Error loading PDF:', err);
        setError('Failed to load PDF. The file might be corrupted or protected.');
        toast.error('Failed to load PDF');
      } finally {
        setLoading(false);
      }
    };

    loadPDF();
  }, [file]);

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 space-y-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center animate-pulse">
            <FileText className="w-8 h-8 text-indigo-500" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
          </div>
        </div>
        <div className="text-center">
          <h3 className="text-sm font-bold">Opening PDF...</h3>
          <p className="text-xs text-zinc-500">Preparing high-performance viewer</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-lg font-bold mb-2">Something went wrong</h3>
        <p className="text-sm text-zinc-500 max-w-xs mb-6">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white dark:bg-zinc-950 font-sans selection:bg-indigo-100 selection:text-indigo-600">
      <Toolbar />
      <div className="flex-1 flex overflow-hidden relative">
        <Sidebar />
        <Viewer />
      </div>
    </div>
  );
};
