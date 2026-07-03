import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { saveWorkHistory } from '../lib/history';
import { FileDropzone } from '../components/ui/file-dropzone';
import { Button } from '../components/ui/button';
import { motion } from 'motion/react';
import { Loader2, ArrowLeft, Unlock, Lock, Download, AlertTriangle, Key } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PDFDocument } from 'pdf-lib';
import { toast } from 'sonner';

export function UnlockPDF() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUnlock = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    try {
      const arrayBuffer = await file.arrayBuffer();
      let pdfDoc;

      try {
        // Try to load with provided password
        pdfDoc = await PDFDocument.load(arrayBuffer, { password } as any);
      } catch (e: any) {
        if (e.message.includes('password')) {
          throw new Error('Incorrect password. Please try again.');
        }
        throw e;
      }

      // To "unlock", we just save it again. pdf-lib saves decrypted by default if loaded with password.
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `unlocked_${file.name}`;
      link.click();
      URL.revokeObjectURL(url);

      await saveWorkHistory(user?.uid, `unlocked_${file.name}`, 'Unlock PDF');
      toast.success('PDF unlocked successfully!');
      setFile(null);
      setPassword('');
    } catch (err: any) {
      console.error('Unlock error:', err);
      setError(err.message || 'Failed to unlock PDF.');
      toast.error(err.message || 'Failed to unlock PDF.');
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
        <h1 className="text-3xl font-bold tracking-tight mb-2">Unlock PDF</h1>
        <p className="text-zinc-500">Remove password protection and security restrictions from your PDF documents.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <h2 className="text-sm font-semibold mb-6 uppercase tracking-wider text-zinc-400">Secure Upload</h2>
            
            {!file ? (
              <FileDropzone 
                onFilesSelected={(selected) => setFile(selected[0])} 
                maxFiles={1}
                description="Upload a password-protected PDF"
                accept={{ 'application/pdf': ['.pdf'] }}
              />
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <div className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                    <Lock className="w-6 h-6 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{file.name}</p>
                    <p className="text-[10px] text-zinc-500">{(file.size / 1024).toFixed(2)} KB • Protected</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to="/viewer" state={{ file }}>View</Link>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => { setFile(null); setPassword(''); setError(null); }} className="text-red-500">Remove</Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-500 flex items-center gap-2">
                      <Key className="w-3 h-3" />
                      Document Password
                    </label>
                    <input 
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password to unlock..."
                      className="w-full px-4 py-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-all"
                    />
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-xs border border-red-100 dark:border-red-900/50">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <p>{error}</p>
                    </div>
                  )}

                  <Button 
                    className="w-full h-12 rounded-xl text-sm font-bold" 
                    onClick={handleUnlock}
                    disabled={isProcessing || !password}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Decrypting...
                      </>
                    ) : (
                      <>
                        <Unlock className="mr-2 h-4 w-4" />
                        Unlock & Download
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-500" />
              Privacy Matters
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Unlock PDF happens entirely in your browser. Your password and document content are never sent to our servers. We value your data security above all else.
            </p>
          </div>

          <div className="space-y-4">
             <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-1">Common Questions</h4>
             <div className="space-y-2">
               <details className="group bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900 rounded-xl overflow-hidden">
                 <summary className="p-4 text-xs font-medium cursor-pointer list-none flex items-center justify-between group-open:bg-zinc-50 dark:group-open:bg-zinc-900 transition-colors">
                   What if I don't know the password?
                   <ChevronRight className="w-3 h-3 group-open:rotate-90 transition-transform" />
                 </summary>
                 <div className="p-4 text-[10px] text-zinc-500 border-t border-zinc-100 dark:border-zinc-900 leading-relaxed">
                   This tool is designed to remove protection from documents you have the right to access. It does not perform "brute-force" attacks on unknown passwords.
                 </div>
               </details>
             </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function Shield({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}
