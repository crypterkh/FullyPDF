import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { saveWorkHistory } from '../lib/history';
import { FileDropzone } from '../components/ui/file-dropzone';
import { Button } from '../components/ui/button';
import { motion } from 'motion/react';
import { Loader2, ArrowLeft, ScanText, Copy, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export function OCR() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<{ status: string; progress: number }>({ status: '', progress: 0 });
  const [extractedText, setExtractedText] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (file && file.type === 'application/pdf') {
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

  const handleExtract = async () => {
    if (!file) return;
    setIsProcessing(true);
    setExtractedText('');
    setProgress({ status: 'Starting OCR...', progress: 0 });

    try {
      if (file.type === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const numPages = pdf.numPages;
        let fullText = '';

        for (let i = 1; i <= numPages; i++) {
          setProgress({ status: `Processing page ${i} of ${numPages}...`, progress: (i - 1) / numPages });
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better OCR
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
                  status: `Recognizing text on page ${i}/${numPages}...`, 
                  progress: ((i - 1) + m.progress) / numPages 
                });
              }
            }
          });
          fullText += `--- Page ${i} ---\n${result.data.text}\n\n`;
        }
        setExtractedText(fullText);
        await saveWorkHistory(user?.uid, file.name, "OCR Extracted");
      } else if (file.type.startsWith('image/')) {
        const imageUrl = URL.createObjectURL(file);
        const result = await Tesseract.recognize(imageUrl, 'eng', {
          logger: m => {
            if (m.status === 'recognizing text') {
              setProgress({ status: 'Recognizing text...', progress: m.progress });
            }
          }
        });
        setExtractedText(result.data.text);
        await saveWorkHistory(user?.uid, file.name, "OCR Extracted");
      } else {
        alert("Unsupported file format. Please upload a PDF or an Image.");
      }
    } catch (error) {
      console.error("OCR extraction failed:", error);
      alert("Failed to extract text from the file.");
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
    link.download = `${file ? file.name.replace(/\.[^/.]+$/, "") : "extracted"}_ocr.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadAsDocx = () => {
    const escapeHtml = (textString: string) => {
      return textString
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };

    const paragraphs = extractedText.split('\n');
    const htmlContent = paragraphs.map(p => {
      const trimmed = p.trim();
      if (!trimmed) return '<p>&nbsp;</p>';
      return `<p>${escapeHtml(p)}</p>`;
    }).join('\n');

    const htmlString = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' 
            xmlns:w='urn:schemas-microsoft-com:office:word' 
            xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <title>OCR Extracted Text</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Normal</w:View>
            <w:Zoom>0</w:Zoom>
            <w:Compatibility>
              <w:BreakWrappedTables/>
              <w:SnapToGridInCell/>
              <w:WrapTextWithPunct/>
              <w:UseAsianBreakRules/>
            </w:Compatibility>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            margin: 1in;
          }
          p {
            margin-bottom: 12px;
          }
        </style>
      </head>
      <body>
        ${htmlContent}
      </body>
      </html>
    `;
    
    const blob = new Blob(['\ufeff' + htmlString], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${file ? file.name.replace(/\.[^/.]+$/, "") : "extracted"}_ocr.doc`;
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
        <h1 className="text-3xl font-bold tracking-tight mb-2">OCR Text Extraction</h1>
        <p className="text-zinc-500">Extract text from scanned PDFs and images using Optical Character Recognition.</p>
      </div>

      {!extractedText ? (
        <div className="space-y-6">
          <FileDropzone 
            onFilesSelected={(selected) => setFile(selected[0])} 
            maxFiles={1}
            description="Drag and drop a PDF or Image here"
            accept={{ 'application/pdf': ['.pdf'], 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] }}
          />
          
          {file && (
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
                <span className="font-medium truncate mr-4">{file.name}</span>
                <div className="flex items-center gap-4 shrink-0">
                  {file.type === 'application/pdf' && (
                    <Button variant="ghost" size="sm" asChild>
                      <Link to="/viewer" state={{ file }}>View</Link>
                    </Button>
                  )}
                  <span className="text-sm text-zinc-500 whitespace-nowrap">{(file.size / 1024 / 1024).toFixed(2)} MB {pageCount !== null ? `• ${pageCount} pages` : ''}</span>
                </div>
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

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setFile(null)} disabled={isProcessing}>Clear</Button>
                <Button onClick={handleExtract} disabled={isProcessing}>
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ScanText className="mr-2 h-4 w-4" />
                      Extract Text
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
          className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-xl p-6 flex flex-col h-[500px]"
        >
          <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
            <h2 className="text-lg font-semibold">Extracted Text</h2>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={downloadAsTxt} className="text-xs">
                Download as TXT
              </Button>
              <Button variant="outline" size="sm" onClick={downloadAsDocx} className="text-xs">
                Download as DOCX
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
          
          <div className="flex-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 overflow-auto">
            <pre className="text-sm font-mono whitespace-pre-wrap">{extractedText}</pre>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
