import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { saveWorkHistory } from '../lib/history';
import { FileDropzone } from '../components/ui/file-dropzone';
import { Button } from '../components/ui/button';
import { motion } from 'motion/react';
import { Loader2, ArrowLeft, Layers, Download, Info, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PDFDocument } from 'pdf-lib';
import { toast } from 'sonner';

export function FlattenPDF() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFlattened, setIsFlattened] = useState(false);

  const handleFlatten = async () => {
    if (!file) return;

    setIsProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      
      const form = pdfDoc.getForm();
      form.flatten(); // This is the magic method in pdf-lib

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `flattened_${file.name}`;
      link.click();
      URL.revokeObjectURL(url);

      await saveWorkHistory(user?.uid, `flattened_${file.name}`, 'Flatten PDF');
      toast.success('PDF flattened successfully!');
      setIsFlattened(true);
    } catch (err: any) {
      console.error('Flatten error:', err);
      toast.error('Failed to flatten PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto w-full h-full flex flex-col pt-4"
    >
      <div className="mb-8">
        <Link to="/" className="inline-flex items-center text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Flatten PDF</h1>
        <p className="text-zinc-500">Make interactive form fields, checkboxes, and annotations a permanent part of the document content.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm">
            {!file ? (
              <FileDropzone 
                onFilesSelected={(selected) => setFile(selected[0])} 
                maxFiles={1}
                description="Upload a PDF with forms or annotations"
                accept={{ 'application/pdf': ['.pdf'] }}
              />
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <div className="w-12 h-12 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                    <Layers className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{file.name}</p>
                    <p className="text-[10px] text-zinc-500">{(file.size / 1024).toFixed(2)} KB • Interactive</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => { setFile(null); setIsFlattened(false); }} className="text-red-500">Remove</Button>
                </div>

                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/50 rounded-xl flex items-start gap-3">
                   <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                   <p className="text-[10px] text-amber-700 dark:text-amber-400 leading-relaxed">
                     Flattening will make all form fields uneditable. This is recommended before sharing signed or completed documents to prevent further changes.
                   </p>
                </div>

                <Button 
                  className="w-full h-12 rounded-xl text-sm font-bold" 
                  onClick={handleFlatten}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Flattening...
                    </>
                  ) : (
                    <>
                      <Layers className="mr-2 h-4 w-4" />
                      Flatten & Download
                    </>
                  )}
                </Button>
              </div>
            )}

            {isFlattened && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl flex items-center gap-3 text-emerald-700 dark:text-emerald-400 text-sm font-medium"
              >
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                PDF flattened successfully. Interactive elements are now static.
              </motion.div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800">
            <h3 className="text-sm font-bold mb-4">Why flatten?</h3>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400 font-bold text-[10px]">1</div>
                <p className="text-[10px] text-zinc-500 leading-relaxed">Prevents others from changing the information you've entered in form fields.</p>
              </li>
              <li className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400 font-bold text-[10px]">2</div>
                <p className="text-[10px] text-zinc-500 leading-relaxed">Ensures the document prints exactly as it appears on screen, including all annotations.</p>
              </li>
              <li className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400 font-bold text-[10px]">3</div>
                <p className="text-[10px] text-zinc-500 leading-relaxed">Improves compatibility with some older PDF viewers that may not support interactive forms.</p>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
