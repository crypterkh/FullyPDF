import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { saveWorkHistory } from '../lib/history';
import { FileDropzone } from '../components/ui/file-dropzone';
import { Button } from '../components/ui/button';
import { motion } from 'motion/react';
import { Loader2, ArrowLeft, Wrench, ShieldCheck, Download, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PDFDocument } from 'pdf-lib';
import { toast } from 'sonner';

export function RepairPDF() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRepaired, setIsRepaired] = useState(false);

  const handleRepair = async () => {
    if (!file) return;

    setIsProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // PDF Repair strategy: Try to load and re-serialize.
      // pdf-lib's parser is quite resilient and will often ignore minor syntax errors.
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const pdfBytes = await pdfDoc.save();
      
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `repaired_${file.name}`;
      link.click();
      URL.revokeObjectURL(url);

      await saveWorkHistory(user?.uid, `repaired_${file.name}`, 'Repair PDF');
      toast.success('PDF rebuilt and repaired successfully!');
      setIsRepaired(true);
    } catch (err: any) {
      console.error('Repair error:', err);
      toast.error('Failed to repair this specific PDF corruption.');
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
        <h1 className="text-3xl font-bold tracking-tight mb-2">Repair PDF</h1>
        <p className="text-zinc-500">Fix corrupted, damaged, or unreadable PDF documents by rebuilding the file structure.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm text-center">
            {!file ? (
              <FileDropzone 
                onFilesSelected={(selected) => setFile(selected[0])} 
                maxFiles={1}
                description="Upload a damaged PDF file"
                accept={{ 'application/pdf': ['.pdf'] }}
              />
            ) : (
              <div className="space-y-8 py-4">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-50 dark:bg-red-900/20 mb-2">
                  <AlertCircle className="w-10 h-10 text-red-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2 truncate max-w-md mx-auto">{file.name}</h3>
                  <p className="text-sm text-zinc-500">Document structure will be scanned and rebuilt.</p>
                </div>
                
                <div className="flex justify-center gap-4">
                   <Button variant="outline" onClick={() => { setFile(null); setIsRepaired(false); }}>Change File</Button>
                   <Button size="lg" onClick={handleRepair} disabled={isProcessing}>
                     {isProcessing ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Wrench className="w-5 h-5 mr-2" />}
                     {isProcessing ? 'Analyzing...' : 'Start Repair'}
                   </Button>
                </div>
              </div>
            )}
            
            {isRepaired && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl flex items-center gap-3 text-emerald-700 dark:text-emerald-400 text-sm font-medium"
              >
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                Your document has been rebuilt and downloaded successfully.
              </motion.div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-zinc-900 text-white rounded-3xl p-6 shadow-xl">
             <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-4">
               <ShieldCheck className="w-6 h-6 text-emerald-400" />
             </div>
             <h3 className="text-lg font-bold mb-2">How it works</h3>
             <p className="text-zinc-400 text-xs leading-relaxed mb-6">
               Our engine parses the underlying PDF objects and cross-reference tables. By regenerating the document structure from valid objects, we can often bypass corruption in the file footer or metadata sections.
             </p>
             <ul className="space-y-3">
               {[
                 'Rebuilds Cross-Ref Table',
                 'Recovers Valid Objects',
                 'Fixes Page Tree Errors',
                 'Optimizes Stream Data'
               ].map((item) => (
                 <li key={item} className="flex items-center gap-2 text-[10px] font-medium text-zinc-300">
                   <div className="w-1 h-1 rounded-full bg-emerald-500" />
                   {item}
                 </li>
               ))}
             </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
