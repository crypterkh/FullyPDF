import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { saveWorkHistory } from '../lib/history';
import { FileDropzone } from '../components/ui/file-dropzone';
import { Button } from '../components/ui/button';
import { motion } from 'motion/react';
import { 
  Loader2, ArrowLeft, Languages, Download, 
  Globe, AlertCircle, CheckCircle2, ChevronDown
} from 'lucide-react';
import { Link } from 'react-router-dom';
import * as pdfjsLib from 'pdfjs-dist';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

const LANGUAGES = [
  { code: 'Spanish', label: 'Spanish' },
  { code: 'French', label: 'French' },
  { code: 'German', label: 'German' },
  { code: 'Chinese', label: 'Chinese (Simplified)' },
  { code: 'Japanese', label: 'Japanese' },
  { code: 'Portuguese', label: 'Portuguese' },
  { code: 'Italian', label: 'Italian' },
  { code: 'Russian', label: 'Russian' },
  { code: 'Arabic', label: 'Arabic' },
  { code: 'Hindi', label: 'Hindi' },
];

export function TranslatePDF() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [targetLanguage, setTargetLanguage] = useState('Spanish');
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (file) {
      const loadPageCount = async () => {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          setPageCount(pdf.numPages);
        } catch (e) {
          console.error('Error loading page count', e);
        }
      };
      loadPageCount();
    } else {
      setPageCount(null);
    }
  }, [file]);

  const handleTranslate = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(10);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += `--- Page ${i} ---\n${pageText}\n\n`;
        setProgress(10 + (i / pdf.numPages) * 30);
      }

      const response = await fetch('/api/gemini/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: fullText, targetLanguage }),
      });

      if (!response.ok) throw new Error('Translation failed');
      
      const { translation } = await response.json();
      setProgress(80);

      // Create new PDF with translated text
      const doc = new jsPDF();
      const splitText = doc.splitTextToSize(translation, 180);
      doc.text(splitText, 15, 15);
      
      doc.save(`translated_${targetLanguage}_${file.name}`);
      setProgress(100);

      await saveWorkHistory(user?.uid, `translated_${targetLanguage}_${file.name}`, 'Translate PDF');
      toast.success('PDF translated successfully!');
    } catch (err: any) {
      console.error('Translation error:', err);
      toast.error('Failed to translate PDF.');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto w-full h-full flex flex-col pt-4 pb-20"
    >
      <div className="mb-8">
        <Link to="/" className="inline-flex items-center text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Translate PDF</h1>
        <p className="text-zinc-500">AI-powered document translation that understands context and technical terminology.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm">
            {!file ? (
              <FileDropzone 
                onFilesSelected={(selected) => setFile(selected[0])} 
                maxFiles={1}
                description="Upload a PDF to translate"
                accept={{ 'application/pdf': ['.pdf'] }}
              />
            ) : (
              <div className="space-y-8">
                <div className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                    <Globe className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{file.name}</p>
                    <p className="text-[10px] text-zinc-500">
                      {(file.size / 1024).toFixed(2)} KB • {pageCount !== null ? `${pageCount} pages • ` : ''}Ready for translation
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to="/viewer" state={{ file }}>View</Link>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setFile(null)} className="text-red-500">Remove</Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">Target Language</label>
                    <div className="relative">
                      <select 
                        value={targetLanguage}
                        onChange={(e) => setTargetLanguage(e.target.value)}
                        className="w-full h-12 pl-4 pr-10 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm appearance-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-all outline-none"
                      >
                        {LANGUAGES.map(lang => (
                          <option key={lang.code} value={lang.code}>{lang.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button 
                      className="w-full h-12 rounded-xl font-bold" 
                      onClick={handleTranslate}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Translating... {progress > 0 && `${Math.round(progress)}%`}
                        </>
                      ) : (
                        <>
                          <Languages className="mr-2 h-4 w-4" />
                          Translate PDF
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
           <div className="p-6 bg-zinc-900 text-white rounded-3xl shadow-xl">
             <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
               <AlertCircle className="w-4 h-4 text-amber-400" />
               Premium Translation
             </h3>
             <p className="text-[10px] text-zinc-400 leading-relaxed mb-6">
               Our AI translation engine preserves the context and intent of your document. While layout preservation is best-effort, the text content remains accurate and natural.
             </p>
             <div className="space-y-4">
               <div className="flex items-start gap-3">
                 <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                 </div>
                 <p className="text-[10px] text-zinc-300">Context-aware terminology</p>
               </div>
               <div className="flex items-start gap-3">
                 <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                 </div>
                 <p className="text-[10px] text-zinc-300">Natural language flow</p>
               </div>
               <div className="flex items-start gap-3">
                 <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                 </div>
                 <p className="text-[10px] text-zinc-300">Secure & Confidential</p>
               </div>
             </div>
           </div>
        </div>
      </div>
    </motion.div>
  );
}
