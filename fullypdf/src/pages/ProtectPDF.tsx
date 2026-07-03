import React, { useState } from 'react';
import { FileDropzone } from '../components/ui/file-dropzone';
import { Button } from '../components/ui/button';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Loader2, ArrowLeft, KeySquare, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PDFDocument } from 'pdf-lib';
import { useAuth } from '../context/AuthContext';
import { saveWorkHistory } from '../lib/history';

export function ProtectPDF() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const { user } = useAuth();

  const handleProtect = async () => {
    if (!file || !password) return;
    setIsProcessing(true);
    
    try {
      const fileBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(fileBuffer, { ignoreEncryption: false });
      
      pdfDoc.encrypt({
        userPassword: password,
        ownerPassword: password,
        permissions: {
          printing: 'highResolution',
          modifying: false,
          copying: false,
          annotating: false,
          fillingForms: false,
          contentAccessibility: false,
          documentAssembly: false
        }
      });
      
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setPdfUrl(URL.createObjectURL(blob));
      await saveWorkHistory(user?.uid, file.name, "Password Protected", blob);
    } catch (error: any) {
      console.error("Failed to protect PDF:", error);
      if (error.name === 'EncryptedPDFError' || (error.message && error.message.includes('encrypted'))) {
        alert("This PDF is already encrypted. Please upload an unprotected PDF.");
      } else {
        alert("Failed to protect PDF.");
      }
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
        <h1 className="text-3xl font-bold tracking-tight mb-2">Protect PDF</h1>
        <p className="text-zinc-500 text-sm">Add a password to encrypt and secure your PDF document.</p>
      </div>

      {!pdfUrl ? (
        <div className="space-y-6">
          <FileDropzone 
            onFilesSelected={(files) => setFile(files[0])} 
            maxFiles={1}
            description="Drag and drop a PDF to protect"
          />
          
          <AnimatePresence>
            {file && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-4"
              >
                <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
                  <span className="font-medium truncate text-sm mr-4">{file.name}</span>
                  <span className="text-xs text-zinc-500 whitespace-nowrap">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
                
                <div className="flex flex-col gap-2">
                  <label htmlFor="password" className="text-sm font-medium">Password</label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter a secure password"
                    className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-50"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/viewer" state={{ file }}>View</Link>
                  </Button>
                  <Button variant="outline" onClick={() => { setFile(null); setPassword(''); }} disabled={isProcessing}>Clear</Button>
                  <Button onClick={handleProtect} disabled={isProcessing || !password}>
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Encrypting...
                      </>
                    ) : (
                      <>
                        <KeySquare className="mr-2 h-4 w-4" />
                        Protect PDF
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 rounded-xl p-8 flex flex-col items-center justify-center text-center min-h-[400px]"
        >
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-6">
            <Check className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold mb-2">PDF Protected!</h2>
          <p className="text-zinc-500 mb-8 max-w-md">
            Your document has been successfully encrypted. You will need the password to open it.
          </p>
          
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => {
              setPdfUrl(null);
              setFile(null);
              setPassword('');
            }}>
              Protect Another
            </Button>
            <Button asChild>
              <a href={pdfUrl} download={`protected_${file?.name}`}>
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </a>
            </Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
