import React, { useState, useRef, useEffect } from 'react';
import { FileDropzone } from '../components/ui/file-dropzone';
import { Button } from '../components/ui/button';
import { motion } from 'motion/react';
import { Bot, Loader2, Send, User, ArrowLeft } from 'lucide-react';
import { extractTextFromPdf } from '../lib/pdfTextExtractor';
import { Link } from 'react-router-dom';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function AiChat() {
  const [file, setFile] = useState<File | null>(null);
  const [pdfText, setPdfText] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFile = async (files: File[]) => {
    if (files.length === 0) return;
    const selectedFile = files[0];
    setFile(selectedFile);
    setIsExtracting(true);
    
    try {
      const text = await extractTextFromPdf(selectedFile);
      setPdfText(text);
      
      // Automatically generate a summary
      await generateSummary(text);
    } catch (error) {
      console.error(error);
      alert("Failed to read PDF. Ensure it's a valid text-based PDF.");
      setFile(null);
    } finally {
      setIsExtracting(false);
    }
  };

  const generateSummary = async (text: string) => {
    setIsTyping(true);
    try {
      const response = await fetch('/api/gemini/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      
      const data = await response.json();
      if (response.ok) {
        setMessages([{ role: 'assistant', content: data.summary }]);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      setMessages([{ role: 'assistant', content: "Sorry, I couldn't summarize this document. Please try again." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !pdfText) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsTyping(true);

    try {
      // In a real app we'd maintain chat history. Here we just send the text and the question
      const prompt = `Based on the following PDF text, answer this question: "${userMsg}"\n\nPDF TEXT:\n${pdfText}`;
      
      const response = await fetch('/api/gemini/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: prompt })
      });
      
      const data = await response.json();
      if (response.ok) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.summary }]);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col pt-4">
      <div className="mb-6 shrink-0">
        <Link to="/" className="inline-flex items-center text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold tracking-tight mb-2">AI PDF Assistant</h1>
        <p className="text-zinc-500">Upload a PDF to get an instant summary and ask questions about its content.</p>
      </div>

      {!file ? (
        <FileDropzone 
          onFilesSelected={handleFile}
          maxFiles={1}
          description="Upload a PDF document to analyze (max 20 pages extracted)"
        />
      ) : (
        <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
          <div className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 p-4 flex items-center justify-between">
            <div className="font-medium truncate">{file.name}</div>
            <Button variant="ghost" size="sm" onClick={() => { setFile(null); setMessages([]); }}>
              Upload Different File
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {isExtracting ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-500">
                <Loader2 className="w-8 h-8 animate-spin mb-4" />
                <p>Reading document...</p>
              </div>
            ) : (
              <>
                {messages.map((msg, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-4 max-w-4xl mx-auto ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'}`}>
                      {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    <div className={`flex-1 px-4 py-3 rounded-2xl ${msg.role === 'user' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-900 dark:text-blue-100' : 'bg-zinc-50 dark:bg-zinc-900'}`}>
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</div>
                    </div>
                  </motion.div>
                ))}
                {isTyping && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-4 max-w-4xl mx-auto"
                  >
                    <div className="w-8 h-8 shrink-0 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="flex-1 px-4 py-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900">
                      <div className="flex gap-1.5 items-center">
                        <div className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
          
          <div className="p-4 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800">
            <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask a question about the document..."
                disabled={isExtracting || isTyping}
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full px-6 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 disabled:opacity-50"
              />
              <button 
                type="submit"
                disabled={!input.trim() || isExtracting || isTyping}
                className="absolute right-2 p-2 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
