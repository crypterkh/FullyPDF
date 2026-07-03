import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { saveWorkHistory } from '../lib/history';
import { FileDropzone } from '../components/ui/file-dropzone';
import { Button } from '../components/ui/button';
import { motion } from 'motion/react';
import { Loader2, ArrowLeft, FileText, Copy, Check, Download, ScanText, FileSearch } from 'lucide-react';
import { Link } from 'react-router-dom';
import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export function PdfToText() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<{ status: string; progress: number }>({ status: '', progress: 0 });
  const [extractedText, setExtractedText] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);
  const [mode, setMode] = useState<'standard' | 'ocr'>('standard');

  const handleExtract = async (forcedMode?: 'standard' | 'ocr') => {
    if (!file) return;
    const currentMode = forcedMode || mode;
    setIsProcessing(true);
    setExtractedText('');
    setProgress({ status: 'Initializing...', progress: 0 });

    try {
      if (file.type === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const numPages = pdf.numPages;
        let fullText = '';

        if (currentMode === 'standard') {
          for (let i = 1; i <= numPages; i++) {
            setProgress({ status: `Extracting text from page ${i} of ${numPages}...`, progress: i / numPages });
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            fullText += `--- Page ${i} ---\n${pageText}\n\n`;
          }

          // If standard extraction yielded very little text, suggest OCR
          if (fullText.replace(/--- Page \d+ ---|\s/g, '').length < 50 && numPages > 0) {
             if (confirm("Standard extraction yielded very little text. This might be a scanned PDF. Would you like to use OCR instead?")) {
               setIsProcessing(false);
               handleExtract('ocr');
               return;
             }
          }
        } else {
          // OCR Mode
          for (let i = 1; i <= numPages; i++) {
            setProgress({ status: `Rendering page ${i}/${numPages} for OCR...`, progress: (i - 1) / numPages });
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 2.0 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            if (!context) continue;
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            await page.render({ canvasContext: context, viewport: viewport }).promise;
            const imageUrl = canvas.toDataURL('image/png');

            const result = await Tesseract.recognize(imageUrl, 'eng', {
              logger: m => {
                if (m.status === 'recognizing text') {
                  setProgress({ 
                    status: `Performing OCR on page ${i}/${numPages}...`, 
                    progress: ((i - 1) + m.progress) / numPages 
                  });
                }
              }
            });
            fullText += `--- Page ${i} (OCR) ---\n${result.data.text}\n\n`;
          }
        }
        
        setExtractedText(fullText);
        await saveWorkHistory(user?.uid, file.name, `PDF to Text (${currentMode.toUpperCase()})`);
      } else {
        alert("Please upload a PDF file.");
      }
    } catch (error) {
      console.error("Extraction failed:", error);
      alert("Failed to extract text from the PDF.");
    } finally {
      setIsProcessing(false);
      setProgress({ status: '', progress: 0 });
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(extractedText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const downloadAsTxt = () => {
    const blob = new Blob([extractedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${file ? file.name.replace(/\.[^/.]+$/, "") : "extracted"}.txt`;
    link.click();
    URL.revokeObjectURL(url);
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
        <h1 className="text-3xl font-bold tracking-tight mb-2">PDF to Text</h1>
        <p className="text-zinc-500">Extract text from searchable or scanned PDF documents with high accuracy.</p>
      </div>

      {!extractedText ? (
        <div className="space-y-6">
          <FileDropzone 
            onFilesSelected={(selected) => setFile(selected[0])} 
            maxFiles={1}
            description="Drag and drop a PDF here"
            accept={{ 'application/pdf': ['.pdf'] }}
          />
          
          {file && (
            <div className="flex flex-col gap-6">
              <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-zinc-400" />
                  <span className="font-medium truncate mr-4">{file.name}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setFile(null)}>Remove</Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                  onClick={() => setMode('standard')}
                  className={`p-4 rounded-xl border text-left transition-all ${mode === 'standard' ? 'border-zinc-900 dark:border-zinc-50 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900' : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900'}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <FileSearch className="w-4 h-4" />
                    <span className="font-semibold text-sm">Standard Extraction</span>
                  </div>
                  <p className="text-xs opacity-80">Best for searchable PDFs. Fast and preserves structure.</p>
                </button>

                <button 
                  onClick={() => setMode('ocr')}
                  className={`p-4 rounded-xl border text-left transition-all ${mode === 'ocr' ? 'border-zinc-900 dark:border-zinc-50 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900' : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900'}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <ScanText className="w-4 h-4" />
                    <span className="font-semibold text-sm">OCR Extraction</span>
                  </div>
                  <p className="text-xs opacity-80">Best for scanned PDFs. Slower but extracts text from images.</p>
                </button>
              </div>
              
              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">{progress.status}</span>
                    <span className="font-medium">{Math.round(progress.progress * 100)}%</span>
                  </div>
                  <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2">
                    <div 
                      className="bg-zinc-900 dark:bg-zinc-50 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.round(progress.progress * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              <Button 
                onClick={() => handleExtract()} 
                disabled={isProcessing}
                className="w-full h-12"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Start Extraction
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-xl p-6 flex flex-col h-[600px]"
        >
          <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
            <h2 className="text-lg font-semibold">Extracted Text</h2>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={downloadAsTxt} className="text-xs">
                <Download className="w-3.5 h-3.5 mr-2" />
                Download TXT
              </Button>
              <Button variant="outline" size="sm" onClick={copyToClipboard} className="gap-2 text-xs">
                {isCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                {isCopied ? 'Copied!' : 'Copy'}
              </Button>
              <Button size="sm" onClick={() => { setFile(null); setExtractedText(''); }} className="gap-2 text-xs">
                Extract Another
              </Button>
            </div>
          </div>
          
          <div className="flex-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 overflow-auto">
            <pre className="text-sm font-mono whitespace-pre-wrap leading-relaxed">{extractedText}</pre>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
