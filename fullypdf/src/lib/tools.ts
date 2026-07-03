import { 
  Files, Scissors, FileDown, MessageSquare, ImageIcon, Type, 
  KeySquare, FileText, FileCode2, RotateCw, FileUp, ScanText, 
  Sparkles, FileCode, Table, Presentation, Trash2, Layers, 
  Copy, Crop, Unlock, Wrench, MousePointer2, Signature, 
  FormInput, FileSearch, Languages, Lightbulb, PenTool,
  CheckSquare, ListChecks, Search, Hash
} from 'lucide-react';
import { Tool } from '../types/tool';

export const ALL_TOOLS: Tool[] = [
  // Organize
  { id: 'view', icon: Search, label: 'View & Edit', desc: 'Read and edit PDF documents.', path: '/viewer', color: 'text-zinc-900 dark:text-zinc-100', bg: 'bg-zinc-900/10 dark:bg-zinc-100/10', category: 'Organize', isNew: true },
  { id: 'page-numbers', icon: Hash, label: 'Add Page Numbers', desc: 'Add page numbering to your PDF.', path: '/add-page-numbers', color: 'text-indigo-500', bg: 'bg-indigo-500/10', category: 'Edit', isNew: true },
  { id: 'merge', icon: Files, label: 'Merge PDF', desc: 'Combine multiple PDFs into one.', path: '/merge', color: 'text-blue-500', bg: 'bg-blue-500/10', category: 'Organize' },
  { id: 'split', icon: Scissors, label: 'Split PDF', desc: 'Split PDF files into individual pages.', path: '/split', color: 'text-orange-500', bg: 'bg-orange-500/10', category: 'Organize' },
  { id: 'extract', icon: FileUp, label: 'Extract Pages', desc: 'Extract pages from a PDF document.', path: '/extract', color: 'text-pink-500', bg: 'bg-pink-500/10', category: 'Organize' },
  { id: 'rotate', icon: RotateCw, label: 'Rotate PDF', desc: 'Rotate pages in your PDF.', path: '/rotate', color: 'text-teal-500', bg: 'bg-teal-500/10', category: 'Organize' },
  { id: 'delete', icon: Trash2, label: 'Delete Pages', desc: 'Remove unwanted pages from PDF.', path: '/delete', color: 'text-red-500', bg: 'bg-red-500/10', category: 'Organize', isNew: true },
  { id: 'reorder', icon: Layers, label: 'Reorder Pages', desc: 'Rearrange pages with drag and drop.', path: '/reorder', color: 'text-indigo-500', bg: 'bg-indigo-500/10', category: 'Organize', isNew: true },
  
  // AI
  { id: 'summarize', icon: Sparkles, label: 'Summarize PDF', desc: 'AI-generated summary of your document.', path: '/summarize', color: 'text-amber-500', bg: 'bg-amber-500/10', category: 'AI' },
  { id: 'ai-chat', icon: MessageSquare, label: 'AI Chat', desc: 'Ask questions about your PDF.', path: '/ai-chat', color: 'text-purple-500', bg: 'bg-purple-500/10', category: 'AI' },
  { id: 'translate', icon: Languages, label: 'Translate PDF', desc: 'Translate PDF while keeping format.', path: '/translate', color: 'text-blue-600', bg: 'bg-blue-600/10', category: 'AI', isNew: true },
  { id: 'explain', icon: Lightbulb, label: 'Explain Text', desc: 'Explain complex concepts in PDF.', path: '/explain', color: 'text-yellow-600', bg: 'bg-yellow-600/10', category: 'AI', isNew: true },
  
  // Convert
  { id: 'image-to-pdf', icon: ImageIcon, label: 'Image to PDF', desc: 'Convert JPG/PNG to PDF.', path: '/image-to-pdf', color: 'text-yellow-500', bg: 'bg-yellow-500/10', category: 'Convert' },
  { id: 'pdf-to-image', icon: FileText, label: 'PDF to Image', desc: 'Convert PDF pages into images.', path: '/pdf-to-image', color: 'text-rose-500', bg: 'bg-rose-500/10', category: 'Convert' },
  { id: 'word-to-pdf', icon: FileCode2, label: 'Word to PDF', desc: 'Convert Word docs to PDF.', path: '/word-to-pdf', color: 'text-indigo-500', bg: 'bg-indigo-500/10', category: 'Convert' },
  { id: 'html-to-pdf', icon: FileCode, label: 'HTML to PDF', desc: 'Convert HTML files or code to PDF.', path: '/html-to-pdf', color: 'text-emerald-500', bg: 'bg-emerald-500/10', category: 'Convert' },
  { id: 'excel-to-pdf', icon: Table, label: 'Excel to PDF', desc: 'Convert Excel spreadsheets to PDF.', path: '/excel-to-pdf', color: 'text-green-600', bg: 'bg-green-600/10', category: 'Convert' },
  { id: 'ppt-to-pdf', icon: Presentation, label: 'PPT to PDF', desc: 'Convert PowerPoint slides to PDF.', path: '/ppt-to-pdf', color: 'text-orange-600', bg: 'bg-orange-600/10', category: 'Convert' },
  
  // Optimize & OCR
  { id: 'ocr', icon: ScanText, label: 'OCR Extract', desc: 'Extract text from scanned PDFs.', path: '/ocr', color: 'text-indigo-500', bg: 'bg-indigo-500/10', category: 'Optimize' },
  { id: 'pdf-to-text', icon: FileText, label: 'PDF to Text', desc: 'Extract text from searchable PDFs.', path: '/pdf-to-text', color: 'text-blue-600', bg: 'bg-blue-500/10', category: 'Optimize' },
  { id: 'compress', icon: FileDown, label: 'Compress', desc: 'Reduce file size while keeping quality.', path: '/compress', color: 'text-green-500', bg: 'bg-green-500/10', category: 'Optimize' },
  { id: 'repair', icon: Wrench, label: 'Repair PDF', desc: 'Fix corrupted PDF documents.', path: '/repair', color: 'text-red-600', bg: 'bg-red-600/10', category: 'Optimize', isNew: true },
  
  // Security & Sign
  { id: 'watermark', icon: Type, label: 'Watermark', desc: 'Stamp text or image on PDF.', path: '/watermark', color: 'text-cyan-500', bg: 'bg-cyan-500/10', category: 'Security' },
  { id: 'protect', icon: KeySquare, label: 'Protect', desc: 'Add a password to your PDF.', path: '/protect', color: 'text-slate-500', bg: 'bg-slate-500/10', category: 'Security' },
  { id: 'unlock', icon: Unlock, label: 'Unlock PDF', desc: 'Remove password protection.', path: '/unlock', color: 'text-zinc-600', bg: 'bg-zinc-600/10', category: 'Security', isNew: true },
  { id: 'sign', icon: Signature, label: 'Sign PDF', desc: 'E-sign documents with ease.', path: '/sign', color: 'text-blue-700', bg: 'bg-blue-700/10', category: 'Security', isNew: true },
  { id: 'flatten', icon: Layers, label: 'Flatten PDF', desc: 'Make form fields permanent.', path: '/flatten', color: 'text-slate-700', bg: 'bg-slate-700/10', category: 'Security', isNew: true },
];
