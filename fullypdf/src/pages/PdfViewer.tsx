import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { saveWorkHistory } from '../lib/history';
import { FileDropzone } from '../components/ui/file-dropzone';
import { motion } from 'motion/react';
import { ArrowLeft, Search } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { PDFEditor } from '../components/pdf-editor/PDFEditor';

export function PdfViewer() {
  const { user } = useAuth();
  const location = useLocation();
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (location.state?.file) {
      setFile(location.state.file);
    }
  }, [location.state]);

  const handleFileUpload = (selected: File[]) => {
    setFile(selected[0]);
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
                <Search className="w-5 h-5 text-indigo-500" />
                PDF Viewer & Editor
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
                onFilesSelected={handleFileUpload} 
                maxFiles={1}
                accept={{ 'application/pdf': ['.pdf'] }}
                description="Upload a PDF to access our professional editing suite."
              />
            </motion.div>
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-hidden relative">
          <PDFEditor 
            file={file} 
            onSave={async (blob) => {
              await saveWorkHistory(user?.uid, file.name, 'View & Edit');
            }} 
          />
          <Link 
            to="/" 
            className="absolute top-3 left-4 z-[60] p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg transition-colors bg-white/50 dark:bg-zinc-950/50 backdrop-blur-sm md:bg-transparent"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
