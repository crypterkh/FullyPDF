import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { saveWorkHistory } from '../lib/history';
import { FileDropzone } from '../components/ui/file-dropzone';
import { motion } from 'motion/react';
import { ArrowLeft, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PDFEditor } from '../components/pdf-editor/PDFEditor';

export function OrganizePDF() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);

  const handleReset = () => {
    setFile(null);
  };

  return (
    <div className="h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
      {!file ? (
        <>
          <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-4">
              <Link to="/" className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-lg font-bold flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-500" />
                Organize PDF
              </h1>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-xl w-full"
            >
              <FileDropzone 
                onFilesSelected={(files) => setFile(files[0])} 
                maxFiles={1}
                accept={{ 'application/pdf': ['.pdf'] }}
                description="Upload a PDF to reorder, delete, or duplicate pages visually."
              />
            </motion.div>
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-hidden relative">
          <PDFEditor 
            file={file} 
            onSave={async (blob) => {
              await saveWorkHistory(user?.uid, file.name, "Organize PDF");
            }} 
          />
          <button 
            onClick={handleReset}
            className="absolute top-3 right-4 z-[60] px-3 py-1.5 bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-opacity"
          >
            New Document
          </button>
        </div>
      )}
    </div>
  );
}
