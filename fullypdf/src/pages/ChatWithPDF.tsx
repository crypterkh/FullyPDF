import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { saveWorkHistory } from '../lib/history';
import { FileDropzone } from '../components/ui/file-dropzone';
import { Button } from '../components/ui/button';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Loader2, ArrowLeft, MessageSquare, Send, 
  FileText, Bot, User, Sparkles, Plus, Trash2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import * as pdfjsLib from 'pdfjs-dist';
import Markdown from 'react-markdown';
import { toast } from 'sonner';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function ChatWithPDF() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleFileUpload = async (selected: File[]) => {
    const selectedFile = selected[0];
    setFile(selectedFile);
    setIsExtracting(true);
    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let text = '';
      const numPages = Math.min(pdf.numPages, 15); // Extract first 15 pages for context
      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        text += textContent.items.map((item: any) => item.str).join(' ') + '\n';
      }
      setExtractedText(text);
      setMessages([{
        id: 'initial',
        role: 'assistant',
        content: `I've analyzed **${selectedFile.name}**. How can I help you understand this document?`,
        timestamp: new Date()
      }]);
      toast.success('PDF analyzed successfully!');
    } catch (error) {
      console.error('Extraction error:', error);
      toast.error('Failed to analyze PDF');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !extractedText || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    try {
      const response = await fetch('/api/gemini/summarize', { // Reusing summarize route for chat-like behavior or adding a specific chat route
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: `PDF Context: ${extractedText.substring(0, 8000)}\n\nUser Question: ${input}` 
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');
      
      const { summary } = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: summary,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      await saveWorkHistory(user?.uid, `Chat with ${file?.name}`, 'AI Chat');
    } catch (err: any) {
      console.error('Chat error:', err);
      toast.error('AI is currently unavailable');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-5xl mx-auto w-full h-[calc(100vh-12rem)] flex flex-col pt-4"
    >
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link to="/" className="inline-flex items-center text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 mb-2 transition-colors">
            <ArrowLeft className="w-3 h-3 mr-1" />
            Dashboard
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">AI PDF Chat</h1>
        </div>
        
        {file && (
          <Button variant="outline" size="sm" onClick={() => { setFile(null); setMessages([]); setExtractedText(''); }} className="text-red-500">
            <Trash2 className="w-4 h-4 mr-2" />
            Close Document
          </Button>
        )}
      </div>

      {!file ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="max-w-md w-full">
            <FileDropzone 
              onFilesSelected={handleFileUpload} 
              maxFiles={1}
              description="Upload a PDF to start a conversation"
              accept={{ 'application/pdf': ['.pdf'] }}
            />
          </div>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl">
             {[
               { icon: <MessageSquare className="w-4 h-4" />, text: "Ask questions about content" },
               { icon: <Sparkles className="w-4 h-4" />, text: "Get instant summaries" },
               { icon: <FileText className="w-4 h-4" />, text: "Extract key data points" }
             ].map((item, i) => (
               <div key={i} className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 text-center">
                  <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3 shadow-sm">
                    {item.icon}
                  </div>
                  <p className="text-[10px] font-medium text-zinc-500">{item.text}</p>
               </div>
             ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden flex flex-col shadow-sm">
          {/* Chat Header */}
          <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-950/50">
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                 <Bot className="w-5 h-5 text-white" />
               </div>
               <div>
                 <p className="text-xs font-bold">OmniPDF AI Assistant</p>
                 <p className="text-[9px] text-zinc-500">Document Context: {file.name}</p>
               </div>
             </div>
             {isExtracting && (
               <div className="flex items-center gap-2 text-[10px] text-zinc-500 animate-pulse">
                 <Loader2 className="w-3 h-3 animate-spin" />
                 Analyzing...
               </div>
             )}
          </div>

          {/* Messages Area */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar"
          >
            {messages.map((msg) => (
              <motion.div 
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center shadow-sm ${msg.role === 'user' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600'}`}>
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={`p-4 rounded-2xl text-xs leading-relaxed ${msg.role === 'user' ? 'bg-zinc-900 text-white rounded-tr-none' : 'bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 rounded-tl-none border border-zinc-100 dark:border-zinc-800'}`}>
                    <div className="markdown-body prose prose-xs prose-zinc dark:prose-invert">
                      <Markdown>{msg.content}</Markdown>
                    </div>
                    <p className={`mt-2 text-[8px] ${msg.role === 'user' ? 'text-zinc-400' : 'text-zinc-500'}`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
            {isProcessing && (
              <div className="flex justify-start">
                <div className="flex gap-3 max-w-[85%]">
                  <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center animate-pulse">
                    <Bot className="w-4 h-4 text-zinc-400" />
                  </div>
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl rounded-tl-none border border-zinc-100 dark:border-zinc-800">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-300 animate-bounce" />
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-300 animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-300 animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-6 bg-zinc-50/50 dark:bg-zinc-950/50 border-t border-zinc-100 dark:border-zinc-800">
             <div className="relative group">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask a question about the document..."
                  className="w-full h-14 pl-6 pr-16 bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm focus:ring-4 focus:ring-zinc-900/5 focus:border-zinc-900 dark:focus:border-zinc-100 transition-all outline-none"
                  disabled={isProcessing || isExtracting}
                />
                <button 
                  onClick={handleSend}
                  disabled={!input.trim() || isProcessing || isExtracting}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl flex items-center justify-center disabled:opacity-50 hover:scale-105 transition-all shadow-lg"
                >
                  <Send className="w-4 h-4" />
                </button>
             </div>
             <p className="mt-3 text-[9px] text-center text-zinc-400">
               AI can make mistakes. Verify important information.
             </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
