import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { saveWorkHistory } from '../lib/history';
import { FileDropzone } from '../components/ui/file-dropzone';
import { Button } from '../components/ui/button';
import { motion } from 'motion/react';
import { 
  Loader2, ArrowLeft, Download, Hash, FileText, 
  Settings2, Type, Palette, AlignLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { toast } from 'sonner';

export function AddPageNumbers() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [position, setPosition] = useState<'bottom-right' | 'bottom-center' | 'bottom-left' | 'top-right' | 'top-center' | 'top-left'>('bottom-center');
  const [startNumber, setStartNumber] = useState(1);
  const [format, setFormat] = useState('Page {n}');

  const handleAddNumbers = async () => {
    if (!file) return;
    setIsProcessing(true);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontSize = 10;

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const { width, height } = page.getSize();
        const text = format.replace('{n}', (i + startNumber).toString());
        const textWidth = font.widthOfTextAtSize(text, fontSize);
        
        let x = 0;
        let y = 0;

        // X coordinate
        if (position.includes('left')) x = 30;
        else if (position.includes('center')) x = width / 2 - textWidth / 2;
        else if (position.includes('right')) x = width - textWidth - 30;

        // Y coordinate
        if (position.includes('bottom')) y = 20;
        else if (position.includes('top')) y = height - 30;

        page.drawText(text, {
          x,
          y,
          size: fontSize,
          font,
          color: rgb(0.4, 0.4, 0.4),
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `numbered_${file.name}`;
      link.click();
      
      await saveWorkHistory(user?.uid, file.name, 'Add Page Numbers');
      toast.success('Page numbers added successfully!');
    } catch (error) {
      console.error('Error adding numbers:', error);
      toast.error('Failed to add page numbers');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link to="/" className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Hash className="w-6 h-6 text-indigo-500" />
            Add Page Numbers
          </h1>
          <p className="text-zinc-500">Insert page numbering into your PDF document.</p>
        </div>
      </div>

      {!file ? (
        <FileDropzone 
          onFilesSelected={(files) => setFile(files[0])} 
          maxFiles={1}
          accept={{ 'application/pdf': ['.pdf'] }}
        />
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm"
        >
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                <FileText className="w-6 h-6 text-indigo-500" />
              </div>
              <div>
                <p className="font-bold">{file.name}</p>
                <p className="text-xs text-zinc-500">{(file.size / 1024 / 1024).toFixed(2)} MB • PDF Document</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/viewer" state={{ file }}>View</Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setFile(null)} className="text-red-500">Remove</Button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest block mb-3 flex items-center gap-2">
                  <Settings2 className="w-3.5 h-3.5" />
                  Position
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'] as const).map((pos) => (
                    <button
                      key={pos}
                      onClick={() => setPosition(pos)}
                      className={`p-3 rounded-xl border-2 text-[10px] font-bold transition-all ${position === pos ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600' : 'border-zinc-100 dark:border-zinc-800 hover:border-zinc-200'}`}
                    >
                      {pos.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest block mb-3 flex items-center gap-2">
                  <Type className="w-3.5 h-3.5" />
                  Numbering Options
                </label>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium w-32">Start at:</span>
                    <input 
                      type="number" 
                      value={startNumber}
                      onChange={(e) => setStartNumber(parseInt(e.target.value) || 1)}
                      className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2 text-sm w-full outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium w-32">Format:</span>
                    <input 
                      type="text" 
                      value={format}
                      onChange={(e) => setFormat(e.target.value)}
                      placeholder="e.g. Page {n}"
                      className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2 text-sm w-full outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <p className="text-[10px] text-zinc-500">Use {'{n}'} as a placeholder for the page number.</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-end">
              <Button 
                onClick={handleAddNumbers} 
                disabled={isProcessing}
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none"
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Download className="w-5 h-5 mr-2" />}
                {isProcessing ? 'Processing...' : 'Add Numbers & Download'}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
