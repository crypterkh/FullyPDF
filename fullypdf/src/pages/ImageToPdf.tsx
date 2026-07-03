import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { saveWorkHistory } from '../lib/history';
import { FileDropzone } from '../components/ui/file-dropzone';
import { Button } from '../components/ui/button';
import { PDFDocument } from 'pdf-lib';
import { motion } from 'motion/react';
import { Download, Loader2, ImageIcon, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export function ImageToPdf() {
  const { user } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const handleConvert = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    
    try {
      const pdfDoc = await PDFDocument.create();
      
      for (const file of files) {
        const imageBytes = await file.arrayBuffer();
        let image;
        
        if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
          image = await pdfDoc.embedJpg(imageBytes);
        } else if (file.type === 'image/png') {
          image = await pdfDoc.embedPng(imageBytes);
        } else {
          continue; // skip unsupported
        }
        
        const { width, height } = image.scale(1);
        const page = pdfDoc.addPage([width, height]);
        page.drawImage(image, {
          x: 0,
          y: 0,
          width,
          height,
        });
      }
      
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setPdfUrl(URL.createObjectURL(blob));
      await saveWorkHistory(user?.uid, files.length > 0 ? files[0].name + " (and others)" : "image.pdf", "Image to PDF", blob);
    } catch (error) {
      console.error("Conversion failed:", error);
      alert("Failed to convert images to PDF.");
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
        <h1 className="text-3xl font-bold tracking-tight mb-2">Image to PDF</h1>
        <p className="text-zinc-500">Convert JPG and PNG images into a single PDF document.</p>
      </div>

      {!pdfUrl ? (
        <div className="space-y-6">
          <FileDropzone 
            onFilesSelected={(selected) => setFiles(selected)} 
            description="Drag and drop images here (JPG, PNG)"
            accept={{ 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] }}
          />
          
          {files.length > 0 && (
            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <Button variant="outline" onClick={() => setFiles([])}>Clear</Button>
              <Button onClick={handleConvert} disabled={isProcessing}>
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <ImageIcon className="mr-2 h-4 w-4" />
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
          <p className="text-zinc-500 mb-8">Your images have been converted into a PDF.</p>
          
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => { setFiles([]); setPdfUrl(null); }}>
              Convert More
            </Button>
            <Button asChild>
              <a href={pdfUrl} download="images.pdf">Download PDF</a>
            </Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
