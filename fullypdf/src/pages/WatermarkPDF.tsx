import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { saveWorkHistory } from '../lib/history';
import { FileDropzone } from '../components/ui/file-dropzone';
import { Button } from '../components/ui/button';
import { PDFDocument, rgb, degrees } from 'pdf-lib';
import { motion } from 'motion/react';
import { Download, Loader2, Type, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export function WatermarkPDF() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [watermarkText, setWatermarkText] = useState("CONFIDENTIAL");
  const [isProcessing, setIsProcessing] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const handleApplyWatermark = async () => {
    if (!file || !watermarkText.trim()) return;
    setIsProcessing(true);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();
      
      for (const page of pages) {
        const { width, height } = page.getSize();
        
        page.drawText(watermarkText, {
          x: width / 2 - 150,
          y: height / 2,
          size: 60,
          color: rgb(0.7, 0.7, 0.7),
          rotate: degrees(45),
          opacity: 0.3,
        });
      }
      
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setPdfUrl(URL.createObjectURL(blob));
      await saveWorkHistory(user?.uid, file.name, "Watermarked", blob);
    } catch (error) {
      console.error("Watermark failed:", error);
      alert("Failed to apply watermark.");
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
        <h1 className="text-3xl font-bold tracking-tight mb-2">Add Watermark</h1>
        <p className="text-zinc-500">Stamp text across your PDF document.</p>
      </div>

      {!pdfUrl ? (
        <div className="space-y-6">
          {!file ? (
            <FileDropzone 
              onFilesSelected={(selected) => setFile(selected[0])} 
              maxFiles={1}
              description="Drag and drop a PDF here"
            />
          ) : (
            <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-xl p-6">
              <div className="font-medium mb-6 pb-4 border-b border-zinc-200 dark:border-zinc-800">{file.name}</div>
              
              <div className="space-y-4 mb-8">
                <label className="block text-sm font-medium">Watermark Text</label>
                <input 
                  type="text" 
                  value={watermarkText}
                  onChange={e => setWatermarkText(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>
              
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setFile(null)}>Cancel</Button>
                <Button onClick={handleApplyWatermark} disabled={isProcessing || !watermarkText.trim()}>
                  {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Type className="mr-2 h-4 w-4" />
                  Apply Watermark
                </Button>
              </div>
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
          <h2 className="text-xl font-semibold mb-2">Watermark Applied!</h2>
          
          <div className="flex gap-4 mt-8">
            <Button variant="outline" onClick={() => { setFile(null); setPdfUrl(null); }}>
              Watermark Another
            </Button>
            <Button asChild>
              <a href={pdfUrl} download="watermarked.pdf">Download PDF</a>
            </Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
