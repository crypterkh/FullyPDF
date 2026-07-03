import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { saveWorkHistory } from '../lib/history';
import { FileDropzone } from '../components/ui/file-dropzone';
import { Button } from '../components/ui/button';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Loader2, ArrowLeft, Lightbulb, Send, 
  BookOpen, Search, Copy, Check, MessageSquare
} from 'lucide-react';
import { Link } from 'react-router-dom';
import * as pdfjsLib from 'pdfjs-dist';
import Markdown from 'react-markdown';
import { toast } from 'sonner';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface Explanation {
  id: string;
  query: string;
  answer: string;
  timestamp: Date;
}

export function ExplainText() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [inputText, setInputText] = useState('');
  const [explanations, setExplanations] = useState<Explanation[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleFileUpload = async (selected: File[]) => {
    const selectedFile = selected[0];
    setFile(selectedFile);
    setIsProcessing(true);
    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let text = '';
      const numPages = Math.min(pdf.numPages, 10); // Limit to first 10 pages for explanation
      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        text += textContent.items.map((item: any) => item.str).join(' ') + '\n';
      }
      setInputText(text);
      toast.success('PDF text extracted! You can now ask for explanations.');
    } catch (error) {
      console.error('Text extraction error:', error);
      toast.error('Failed to extract text from PDF');
    } finally {
      setIsProcessing(false);
    }
  };

  const getExplanation = async () => {
    if (!inputText.trim()) return;

    setIsProcessing(true);
    try {
      const response = await fetch('/api/gemini/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: inputText.length > 5000 ? inputText.substring(0, 5000) + '...' : inputText,
          context: 'Provide a detailed but simple explanation for a general audience.' 
        }),
      });

      if (!response.ok) throw new Error('Explanation failed');
      
      const { explanation } = await response.json();
      
      const newExp: Explanation = {
        id: Math.random().toString(36).substr(2, 9),
        query: inputText.substring(0, 100) + (inputText.length > 100 ? '...' : ''),
        answer: explanation,
        timestamp: new Date()
      };
      
      setExplanations([newExp, ...explanations]);
      await saveWorkHistory(user?.uid, `Explanation for ${file?.name || 'pasted text'}`, 'Explain Text');
    } catch (err: any) {
      console.error('Explanation error:', err);
      toast.error('Failed to get explanation');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-5xl mx-auto w-full h-full flex flex-col pt-4 pb-20"
    >
      <div className="mb-8">
        <Link to="/" className="inline-flex items-center text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Explain Text</h1>
        <p className="text-zinc-500">Paste complex document content or upload a PDF to get instant, AI-powered explanations.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 flex-1 min-h-0">
        {/* Input Section */}
        <div className="flex flex-col gap-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Input Content</h2>
              {!file && (
                <button className="text-[10px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 underline transition-colors" onClick={() => setInputText('')}>
                  Clear text
                </button>
              )}
            </div>
            
            {!file ? (
              <div className="flex-1 flex flex-col gap-4">
                <textarea 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Paste complex text here or upload a PDF below..."
                  className="flex-1 w-full p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-all outline-none resize-none"
                />
                
                <div className="pt-2">
                  <FileDropzone 
                    onFilesSelected={handleFileUpload} 
                    maxFiles={1}
                    description="Or upload a PDF to extract text"
                    accept={{ 'application/pdf': ['.pdf'] }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col gap-4">
                <div className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                     <BookOpen className="w-5 h-5 text-zinc-400" />
                     <div className="min-w-0">
                        <p className="text-sm font-semibold truncate max-w-[150px]">{file.name}</p>
                        <p className="text-[10px] text-zinc-500">Text Extracted</p>
                     </div>
                   </div>
                   <Button variant="ghost" size="sm" onClick={() => { setFile(null); setInputText(''); }} className="text-red-500">Change</Button>
                </div>
                <div className="flex-1 p-4 bg-zinc-50/50 dark:bg-zinc-950/50 border border-zinc-100 dark:border-zinc-900 rounded-2xl overflow-y-auto text-[10px] text-zinc-500 leading-relaxed italic">
                  {inputText.substring(0, 500)}...
                </div>
              </div>
            )}

            <div className="mt-6">
               <Button 
                className="w-full h-12 rounded-xl font-bold" 
                onClick={getExplanation}
                disabled={isProcessing || !inputText.trim()}
               >
                 {isProcessing ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Lightbulb className="w-5 h-5 mr-2" />}
                 Get AI Explanation
               </Button>
            </div>
          </div>
        </div>

        {/* Output Section */}
        <div className="flex flex-col gap-6">
           <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex-1 flex flex-col overflow-hidden">
             <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-6">Explanations</h2>
             
             <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
                <AnimatePresence mode="popLayout">
                  {explanations.length === 0 ? (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="h-full flex flex-col items-center justify-center text-center p-10 opacity-50"
                    >
                       <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-6">
                          <MessageSquare className="w-8 h-8 text-zinc-300" />
                       </div>
                       <h3 className="text-sm font-bold mb-2">No explanations yet</h3>
                       <p className="text-[10px] text-zinc-500 max-w-[200px]">Paste text and click "Get AI Explanation" to start.</p>
                    </motion.div>
                  ) : (
                    explanations.map((exp) => (
                      <motion.div 
                        key={exp.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                      >
                         <div className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-900">
                           <div className="flex items-start justify-between mb-3">
                              <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Query Preview</span>
                              <button 
                                onClick={() => copyToClipboard(exp.answer, exp.id)}
                                className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
                              >
                                {copiedId === exp.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                           </div>
                           <p className="text-xs text-zinc-500 italic mb-4 line-clamp-2">"{exp.query}"</p>
                           <div className="prose prose-zinc dark:prose-invert prose-xs max-w-none text-zinc-800 dark:text-zinc-200">
                             <div className="markdown-body">
                               <Markdown>{exp.answer}</Markdown>
                             </div>
                           </div>
                         </div>
                         <div className="h-px bg-zinc-100 dark:bg-zinc-800 mx-4" />
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
             </div>
           </div>
        </div>
      </div>
    </motion.div>
  );
}
