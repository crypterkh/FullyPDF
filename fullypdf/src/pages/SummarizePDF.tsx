import React, { useState, useEffect } from 'react';
import { FileDropzone } from '../components/ui/file-dropzone';
import { Button } from '../components/ui/button';
import { motion } from 'motion/react';
import { FileText, Loader2, ArrowLeft, Bot, Sparkles, Copy, Check } from 'lucide-react';
import { extractTextFromPdf } from '../lib/pdfTextExtractor';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { saveWorkHistory } from '../lib/history';
import * as pdfjsLib from 'pdfjs-dist';

export function SummarizePDF() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [summary, setSummary] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);
  const { user } = useAuth();

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

  const handleSummarize = async () => {
    if (!file) return;
    
    setIsProcessing(true);
    setSummary('');
    
    try {
      const text = await extractTextFromPdf(file);
      
      const response = await fetch('/api/gemini/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSummary(data.summary);
        await saveWorkHistory(user?.uid, file.name, "Summarized PDF");
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to summarize the document. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(summary);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
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
        <h1 className="text-3xl font-bold tracking-tight mb-2">Summarize PDF</h1>
        <p className="text-zinc-500 text-sm">Upload a PDF document to generate a concise AI summary of its contents.</p>
      </div>

      {!summary ? (
        <div className="space-y-6">
          <FileDropzone 
            onFilesSelected={(selected) => setFile(selected[0])} 
            maxFiles={1}
            description="Drag and drop a PDF document to summarize (max 20 pages extracted)"
          />
          
          {file && (
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
                <span className="font-medium truncate text-sm mr-4">{file.name}</span>
                <div className="flex items-center gap-4 shrink-0">
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/viewer" state={{ file }}>View</Link>
                  </Button>
                  <span className="text-xs text-zinc-500 whitespace-nowrap">{(file.size / 1024 / 1024).toFixed(2)} MB • {pageCount !== null ? `${pageCount} pages` : ''}</span>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setFile(null)} disabled={isProcessing}>Clear</Button>
                <Button onClick={handleSummarize} disabled={isProcessing}>
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4 text-amber-500" />
                      Summarize
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-xl p-6 flex flex-col min-h-[400px] h-full"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Bot className="w-5 h-5 text-purple-500" />
              Summary Result
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyToClipboard} className="gap-2">
                {isCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                {isCopied ? 'Copied!' : 'Copy'}
              </Button>
              <Button size="sm" onClick={() => { setFile(null); setSummary(''); }} className="gap-2">
                Summarize Another
              </Button>
            </div>
          </div>
          
          <div className="flex-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 overflow-auto">
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap leading-relaxed text-zinc-700 dark:text-zinc-300">
              {summary}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
