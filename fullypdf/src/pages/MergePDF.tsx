import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { saveWorkHistory } from '../lib/history';
import { FileDropzone } from '../components/ui/file-dropzone';
import { Button } from '../components/ui/button';
import { PDFDocument } from 'pdf-lib';
import { motion } from 'motion/react';
import { Download, Loader2, ArrowLeft, ArrowUp, ArrowDown, Trash2, File as FileIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PDFEditor } from '../components/pdf-editor/PDFEditor';

export function MergePDF() {
  const { user } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mergedPdfUrl, setMergedPdfUrl] = useState<string | null>(null);

  const handleMerge = async () => {
    if (files.length < 2) return;
    
    setIsProcessing(true);
    try {
      const mergedPdf = await PDFDocument.create();

      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => {
          mergedPdf.addPage(page);
        });
      }

      const mergedPdfFile = await mergedPdf.save();
      const blob = new Blob([mergedPdfFile], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setMergedPdfUrl(url);
      await saveWorkHistory(user?.uid, files.length > 0 ? files[0].name + " (and others)" : "merged.pdf", "Merged", blob);
    } catch (error) {
      console.error("Failed to merge PDFs:", error);
      alert("Failed to merge PDFs. Please try again with valid PDF files.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFiles([]);
    setMergedPdfUrl(null);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newFiles = [...files];
    const temp = newFiles[index];
    newFiles[index] = newFiles[index - 1];
    newFiles[index - 1] = temp;
    setFiles(newFiles);
  };

  const moveDown = (index: number) => {
    if (index === files.length - 1) return;
    const newFiles = [...files];
    const temp = newFiles[index];
    newFiles[index] = newFiles[index + 1];
    newFiles[index + 1] = temp;
    setFiles(newFiles);
  };

  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full h-full flex flex-col"
    >
      {!mergedPdfUrl ? (
        <div className="max-w-3xl mx-auto w-full pt-4">
          <div className="mb-8">
            <Link to="/" className="inline-flex items-center text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Merge PDF Files</h1>
            <p className="text-zinc-500">Combine multiple PDFs into a single document in the order you want.</p>
          </div>

          <div className="space-y-6">
            <FileDropzone 
              onFilesSelected={(selectedFiles) => setFiles(prev => [...prev, ...selectedFiles])} 
              description="Drag and drop PDFs here, or click to select"
              accept={{ 'application/pdf': ['.pdf'] }}
            />

            {files.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Files to Merge</h3>
                <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden divide-y divide-zinc-200 dark:divide-zinc-800">
                  {files.map((file, idx) => (
                    <div key={`${file.name}-${idx}`} className="p-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors text-sm">
                      <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
                        <FileIcon className="w-5 h-5 text-zinc-400 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate text-xs">{file.name}</p>
                          <p className="text-[10px] text-zinc-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => moveUp(idx)}
                          disabled={idx === 0}
                        >
                          <ArrowUp className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => moveDown(idx)}
                          disabled={idx === files.length - 1}
                        >
                          <ArrowDown className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                          onClick={() => removeFile(idx)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {files.length > 0 && (
              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <Button variant="outline" onClick={handleReset}>Clear All</Button>
                <Button onClick={handleMerge} disabled={files.length < 2 || isProcessing}>
                  {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Merge PDFs
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden relative">
          <PDFEditor 
            file={new File([mergedPdfUrl as any], "merged.pdf", { type: 'application/pdf' })} 
            title="Merged Document"
          />
          <button 
            onClick={handleReset}
            className="absolute top-3 right-4 z-[60] px-3 py-1.5 bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-opacity"
          >
            Start Over
          </button>
        </div>
      )}
    </motion.div>
  );
}
