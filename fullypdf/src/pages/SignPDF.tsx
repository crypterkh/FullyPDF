import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { saveWorkHistory } from '../lib/history';
import { FileDropzone } from '../components/ui/file-dropzone';
import { Button } from '../components/ui/button';
import { motion } from 'motion/react';
import { 
  Loader2, ArrowLeft, Signature as SignIcon, 
  Download, Eraser, MousePointer2, Check,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { PDFDocument } from 'pdf-lib';
import SignatureCanvas from 'react-signature-canvas';
import { toast } from 'sonner';

export function SignPDF() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const sigCanvas = useRef<SignatureCanvas | null>(null);
  const [isSigned, setIsSigned] = useState(false);

  const clear = () => {
    sigCanvas.current?.clear();
    setSignatureData(null);
  };

  const saveSignature = () => {
    if (sigCanvas.current?.isEmpty()) {
      toast.error('Please draw a signature first');
      return;
    }
    const data = sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png');
    if (data) {
      setSignatureData(data);
      toast.success('Signature captured!');
    }
  };

  const handleSign = async () => {
    if (!file || !signatureData) return;

    setIsProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();
      const firstPage = pages[0]; // Placing on first page for now
      
      const sigImage = await pdfDoc.embedPng(signatureData);
      const { width, height } = sigImage.scale(0.25);
      
      // Place signature at bottom right of first page
      firstPage.drawImage(sigImage, {
        x: firstPage.getWidth() - width - 50,
        y: 50,
        width,
        height,
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `signed_${file.name}`;
      link.click();
      URL.revokeObjectURL(url);

      await saveWorkHistory(user?.uid, `signed_${file.name}`, 'Sign PDF');
      toast.success('Document signed and downloaded!');
      setIsSigned(true);
    } catch (err: any) {
      console.error('Sign error:', err);
      toast.error('Failed to sign document');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto w-full h-full flex flex-col pt-4 pb-20"
    >
      <div className="mb-8">
        <Link to="/" className="inline-flex items-center text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Sign PDF</h1>
        <p className="text-zinc-500">Create your digital signature and apply it securely to your documents.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-8">
          <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
            <h2 className="text-sm font-bold mb-6 flex items-center gap-2">
              <MousePointer2 className="w-4 h-4 text-blue-500" />
              1. Draw your Signature
            </h2>
            
            <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden mb-4">
              <SignatureCanvas 
                ref={sigCanvas}
                penColor="black"
                canvasProps={{ 
                  className: "w-full h-64 cursor-crosshair",
                }}
              />
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={clear} className="flex-1">
                <Eraser className="w-4 h-4 mr-2" />
                Clear
              </Button>
              <Button size="sm" onClick={saveSignature} className="flex-1">
                <Check className="w-4 h-4 mr-2" />
                Capture
              </Button>
            </div>
            
            {signatureData && (
              <div className="mt-6 p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl flex items-center gap-4">
                <div className="bg-white dark:bg-zinc-800 p-2 rounded-lg border border-zinc-100 dark:border-zinc-700">
                  <img src={signatureData} alt="Signature Preview" className="h-10 object-contain" referrerPolicy="no-referrer" />
                </div>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Signature ready to be applied.</p>
              </div>
            )}
          </section>
        </div>

        <div className="space-y-8">
           <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
            <h2 className="text-sm font-bold mb-6 flex items-center gap-2">
              <SignIcon className="w-4 h-4 text-purple-500" />
              2. Upload & Apply
            </h2>
            
            {!file ? (
              <FileDropzone 
                onFilesSelected={(selected) => setFile(selected[0])} 
                maxFiles={1}
                description="Upload the PDF to sign"
                accept={{ 'application/pdf': ['.pdf'] }}
              />
            ) : (
              <div className="space-y-6">
                <div className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800">
                   <p className="text-sm font-medium mb-1 truncate">{file.name}</p>
                   <p className="text-[10px] text-zinc-500">{(file.size / 1024).toFixed(2)} KB</p>
                </div>
                
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 rounded-xl flex items-start gap-3">
                   <AlertCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                   <p className="text-[10px] text-blue-700 dark:text-blue-400 leading-relaxed">
                     By clicking "Apply & Sign", your captured signature will be embedded in the bottom-right corner of the first page.
                   </p>
                </div>

                <Button 
                  className="w-full h-12 rounded-xl" 
                  disabled={!signatureData || isProcessing}
                  onClick={handleSign}
                >
                  {isProcessing ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <SignIcon className="w-5 h-5 mr-2" />}
                  {isProcessing ? 'Signing...' : 'Apply & Sign PDF'}
                </Button>
                
                <Button variant="ghost" className="w-full text-xs" asChild>
                  <Link to="/viewer" state={{ file }}>View Original</Link>
                </Button>
                <Button variant="ghost" className="w-full text-xs text-red-500" onClick={() => setFile(null)}>
                  Remove File
                </Button>
              </div>
            )}
          </section>
        </div>
      </div>
    </motion.div>
  );
}
