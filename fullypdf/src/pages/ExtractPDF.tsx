import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { saveWorkHistory } from '../lib/history';
import { FileDropzone } from '../components/ui/file-dropzone';
import { Button } from '../components/ui/button';
import { PDFDocument } from 'pdf-lib';
import { motion } from 'motion/react';
import { Download, Loader2, ArrowLeft, FileUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { extractTextFromPdf } from '../lib/pdfTextExtractor';

export function ExtractPDF() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pageCount, setPageCount] = useState<number>(0);
  const [extractRange, setExtractRange] = useState<string>("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>("");

  useEffect(() => {
    if (!file) return;
    const loadPdf = async () => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        setPageCount(pdf.getPageCount());
      } catch (err) {
        console.error(err);
      }
    };
    loadPdf();
  }, [file]);

  const handleExtract = async () => {
    if (!file) return;
    if (!extractRange.trim()) {
      alert("Please specify a range of pages to extract.");
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const totalPages = pdf.getPageCount();
      
      const ranges = extractRange.split(',').map(r => r.trim());
      const indicesToCopy = new Set<number>();
      
      for (const range of ranges) {
        const parts = range.split('-');
        let start = parseInt(parts[0], 10) - 1;
        let end = parts.length > 1 ? parseInt(parts[1], 10) - 1 : start;
        
        if (!isNaN(start) && !isNaN(end)) {
          start = Math.max(0, Math.min(start, totalPages - 1));
          end = Math.max(0, Math.min(end, totalPages - 1));
          
          if (start > end) {
            const temp = start; start = end; end = temp;
          }
          
          for (let p = start; p <= end; p++) {
            indicesToCopy.add(p);
          }
        }
      }
      
      if (indicesToCopy.size === 0) {
        alert("Invalid page range specified.");
        setIsProcessing(false);
        return;
      }
      
      const sortedIndices = Array.from(indicesToCopy).sort((a, b) => a - b);
      
      const newPdf = await PDFDocument.create();
      const copiedPages = await newPdf.copyPages(pdf, sortedIndices);
      copiedPages.forEach(p => newPdf.addPage(p));
      
      const bytes = await newPdf.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      setPdfUrl(URL.createObjectURL(blob));
      await saveWorkHistory(user?.uid, file.name, "Extracted Pages", blob);

      try {
        const tempFile = new File([blob], "extracted.pdf", { type: "application/pdf" });
        const text = await extractTextFromPdf(tempFile);
        setExtractedText(text);
      } catch (err) {
        console.error("Failed to extract text from extracted pages:", err);
      }
      
    } catch (error) {
      console.error("Failed to extract PDF pages:", error);
      alert("Failed to extract PDF pages.");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadAsTxt = () => {
    if (!extractedText) return;
    const blob = new Blob([extractedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `extracted_text_${file ? file.name.replace(/\.[^/.]+$/, "") : "pages"}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadAsDocx = () => {
    if (!extractedText) return;
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
        <title>Extracted Pages Text</title>
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
    link.download = `extracted_text_${file ? file.name.replace(/\.[^/.]+$/, "") : "pages"}.doc`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-3xl mx-auto w-full h-full flex flex-col pt-4"
    >
      <div className="mb-8">
        <Link to="/" className="inline-flex items-center text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Extract Pages</h1>
        <p className="text-zinc-500">Extract specific pages from your PDF into a new document.</p>
      </div>

      {!file ? (
        <FileDropzone 
          onFilesSelected={(files) => setFile(files[0])} 
          maxFiles={1}
          description="Drag and drop a PDF here, or click to select"
        />
      ) : !pdfUrl ? (
        <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-200 dark:border-zinc-800">
            <div className="font-medium">{file.name}</div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/viewer" state={{ file }}>View</Link>
              </Button>
              <div className="text-sm text-zinc-500">{pageCount} pages</div>
            </div>
          </div>
          
          <div className="space-y-4 mb-8">
            <label className="block text-sm font-medium">Pages to Extract</label>
            <input 
              type="text" 
              placeholder="e.g., 1-5, 8, 11-13"
              value={extractRange}
              onChange={e => setExtractRange(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
            <p className="text-xs text-zinc-500">Use commas to separate multiple pages or ranges.</p>
          </div>
          
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setFile(null)}>Cancel</Button>
            <Button onClick={handleExtract} disabled={isProcessing || !extractRange.trim()}>
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <FileUp className="mr-2 h-4 w-4" />
              Extract Pages
            </Button>
          </div>
        </div>
      ) : (
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-xl p-8"
        >
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
              <Download className="w-8 h-8" />
            </div>
          </div>
          <h2 className="text-xl font-semibold mb-2 text-center">Extraction Complete!</h2>
          <p className="text-zinc-500 mb-8 text-center">Your requested pages have been extracted to a new PDF.</p>
          
          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={() => { setFile(null); setPdfUrl(null); setExtractRange(''); setExtractedText(''); }}>
              Extract Another File
            </Button>
            <Button asChild>
              <a href={pdfUrl} download={`extracted-${file.name}`}>
                Download PDF
              </a>
            </Button>
          </div>

          {extractedText && (
            <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800 text-center">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">Export Extracted Text</p>
              <div className="flex justify-center gap-3">
                <Button variant="outline" size="sm" onClick={downloadAsTxt}>
                  Download as TXT
                </Button>
                <Button variant="outline" size="sm" onClick={downloadAsDocx}>
                  Download as DOCX
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
