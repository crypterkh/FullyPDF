import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { saveWorkHistory } from '../lib/history';
import { FileDropzone } from '../components/ui/file-dropzone';
import { Button } from '../components/ui/button';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { motion } from 'motion/react';
import { Download, Loader2, ArrowLeft, FileCode2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import * as mammoth from 'mammoth';

export function WordToPdf() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const handleConvert = async () => {
    if (!file) return;
    setIsProcessing(true);
    
    try {
      // Extract text from Word document using mammoth
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      const text = result.value || "Empty document.";

      // Create a basic PDF with the extracted text preserving paragraphs
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      
      const fontSize = 12;
      const margin = 50;
      let page = pdfDoc.addPage();
      const { width, height } = page.getSize();
      
      const maxWidth = width - 2 * margin;
      let yOffset = height - margin;

      // Split text into paragraphs to maintain layout
      const paragraphs = text.split(/\r?\n/);

      for (const para of paragraphs) {
        const trimmedPara = para.trim();
        if (!trimmedPara) {
          // Empty paragraph acts as a vertical break
          yOffset -= 12;
          if (yOffset < margin) {
            page = pdfDoc.addPage();
            yOffset = height - margin;
          }
          continue;
        }

        const words = trimmedPara.split(/\s+/);
        let line = '';

        for (let i = 0; i < words.length; i++) {
          const testLine = line + words[i] + ' ';
          const textWidth = font.widthOfTextAtSize(testLine, fontSize);

          if (textWidth > maxWidth && line.length > 0) {
            page.drawText(line.trim(), { x: margin, y: yOffset, size: fontSize, font });
            line = words[i] + ' ';
            yOffset -= 18; // line height
            
            // Add new page if text overflows
            if (yOffset < margin) {
              page = pdfDoc.addPage();
              yOffset = height - margin;
            }
          } else {
            line = testLine;
          }
        }
        
        // Draw last line of the paragraph
        if (line.trim().length > 0) {
          page.drawText(line.trim(), { x: margin, y: yOffset, size: fontSize, font });
          yOffset -= 18;
          if (yOffset < margin) {
            page = pdfDoc.addPage();
            yOffset = height - margin;
          }
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setPdfUrl(URL.createObjectURL(blob));
      await saveWorkHistory(user?.uid, file.name, "Word to PDF", blob);
    } catch (error) {
      console.error("Conversion failed:", error);
      alert("Failed to convert Word document to PDF.");
    } finally {
      setIsProcessing(false);
    }
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
        <h1 className="text-3xl font-bold tracking-tight mb-2">Word to PDF</h1>
        <p className="text-zinc-500">Convert Word (.docx) documents into a PDF file.</p>
      </div>

      {!pdfUrl ? (
        <div className="space-y-6">
          <FileDropzone 
            onFilesSelected={(selected) => setFile(selected[0])} 
            maxFiles={1}
            description="Drag and drop a Word document here (.docx)"
            accept={{ 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] }}
          />
          
          {file && (
            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <Button variant="outline" onClick={() => setFile(null)}>Clear</Button>
              <Button onClick={handleConvert} disabled={isProcessing}>
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <FileCode2 className="mr-2 h-4 w-4" />
                Convert to PDF
              </Button>
            </div>
          )}
        </div>
      ) : (
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-xl p-8 text-center flex flex-col items-center"
        >
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
            <Download className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Conversion Complete!</h2>
          <p className="text-zinc-500 mb-8">Your Word document has been converted into a PDF.</p>
          
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => { setFile(null); setPdfUrl(null); }}>
              Convert Another
            </Button>
            <Button asChild>
              <a href={pdfUrl} download="converted.pdf">Download PDF</a>
            </Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
