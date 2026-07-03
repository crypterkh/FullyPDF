import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, Star, Clock, Zap, Shield, Sparkles, 
  ChevronRight, ArrowRight, TrendingUp, History,
  FileText, Activity, Send, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ALL_TOOLS } from '../lib/tools';
import { useAuth } from '../context/AuthContext';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Tool } from '../types/tool';

export function Dashboard() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('tool-favorites');
    return saved ? JSON.parse(saved) : ['merge', 'ai-chat', 'ocr'];
  });
  const [recentFiles, setRecentFiles] = useState<any[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatResponse, setChatResponse] = useState<string | null>(null);
  const [isChatLoading, setIsChatLoading] = useState(false);

  const handleQuickChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    setIsChatLoading(true);
    setChatResponse(null);
    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: chatInput }),
      });
      const data = await res.json();
      if (data.response) {
        setChatResponse(data.response);
      } else {
        setChatResponse('Sorry, I couldn\'t process that request.');
      }
    } catch (error) {
      console.error('Chat error:', error);
      setChatResponse('Something went wrong. Please try again.');
    } finally {
      setIsChatLoading(false);
    }
  };

  useEffect(() => {
    localStorage.setItem('tool-favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    if (!user) return;
    setLoadingRecent(true);
    const q = query(
      collection(db, 'users', user.uid, 'history'),
      orderBy('timestamp', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecentFiles(docs);
      setLoadingRecent(false);
    }, (error) => {
      console.error("Dashboard history subscription error:", error);
      setLoadingRecent(false);
      // We don't necessarily want to crash the whole dashboard if history fails
      // but we log it for debugging
    });

    return () => unsubscribe();
  }, [user]);

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const filteredTools = useMemo(() => {
    return ALL_TOOLS.filter(tool => 
      tool.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const favoriteTools = useMemo(() => {
    return ALL_TOOLS.filter(tool => favorites.includes(tool.id));
  }, [favorites]);

  return (
    <div className="w-full h-full flex flex-col pt-4 gap-8 pb-12">
      {/* Hero / Search Section */}
      <section className="relative">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div className="space-y-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-2 text-zinc-900 dark:text-zinc-50">FullyPDF</h1>
              <p className="text-zinc-500 dark:text-zinc-400">The world's most powerful AI-first document toolkit.</p>
            </div>
            
            {/* Try Premium Bar */}
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-3 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-full"
            >
              <div className="flex items-center justify-center w-5 h-5 bg-indigo-600 rounded-full">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
              <span className="text-xs font-medium text-indigo-700 dark:text-indigo-400">
                <span className="font-bold">Try Premium:</span> Unlimited AI summarizing, OCR, translation & batch processing.
              </span>
              <button className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 hover:underline ml-2">
                Learn More
              </button>
            </motion.div>
          </div>
          
          <div className="relative w-full md:w-80 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-zinc-900 dark:group-focus-within:text-zinc-50 transition-colors" />
            <input 
              type="text"
              placeholder="Search for a tool..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-all shadow-sm"
            />
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-8 space-y-10">
          
          {/* Try AI Analysis (Repositioned) */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden"
          >
             <div className="relative z-10">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                 <div className="flex-1">
                   <div className="flex items-center gap-3 mb-2">
                     <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center">
                       <Sparkles className="w-4 h-4 text-white" />
                     </div>
                     <h3 className="text-lg font-bold">Try AI Analysis</h3>
                   </div>
                   <p className="text-white/80 text-xs leading-relaxed max-w-md">
                     Ask anything about PDF processing or get instant document insights. Our AI is optimized to help you work faster.
                   </p>
                 </div>
                 
                 <div className="flex-1 w-full max-w-xl">
                   <form onSubmit={handleQuickChat} className="relative">
                     <input
                       type="text"
                       value={chatInput}
                       onChange={(e) => setChatInput(e.target.value)}
                       placeholder="Ask a document question..."
                       className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pr-12 text-sm text-white placeholder:text-white/50 outline-none focus:ring-2 focus:ring-white/30 transition-all"
                     />
                     <button 
                       type="submit"
                       disabled={isChatLoading || !chatInput.trim()}
                       className="absolute right-1.5 top-1.5 p-2 bg-white text-indigo-600 rounded-lg hover:bg-indigo-50 disabled:opacity-50 disabled:hover:bg-white transition-colors shadow-sm"
                     >
                       {isChatLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                     </button>
                   </form>

                   <AnimatePresence>
                     {chatResponse && (
                       <motion.div 
                         initial={{ opacity: 0, height: 0 }}
                         animate={{ opacity: 1, height: 'auto' }}
                         exit={{ opacity: 0, height: 0 }}
                         className="mt-3 bg-white/10 border border-white/20 rounded-xl p-3 relative"
                       >
                         <p className="text-xs leading-relaxed text-white/90">
                           {chatResponse}
                         </p>
                         <button 
                           onClick={() => { setChatResponse(null); setChatInput(''); }}
                           className="absolute top-2 right-2 text-[10px] uppercase font-bold tracking-widest text-white/40 hover:text-white transition-colors"
                         >
                           Clear
                         </button>
                       </motion.div>
                     )}
                   </AnimatePresence>
                 </div>
               </div>

               <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/10">
                 <Link to="/summarize" className="inline-flex items-center gap-2 text-xs font-semibold hover:gap-3 transition-all">
                   Full Analysis Dashboard
                   <ArrowRight className="w-3.5 h-3.5" />
                 </Link>
                 <span className="w-1 h-1 bg-white/20 rounded-full" />
                 <span className="text-[10px] text-white/60">Powered by Gemini 3.5 Flash</span>
               </div>
             </div>
             <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
          </motion.section>

          {/* Favorites (Only if no search) */}
          {!searchQuery && favorites.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  Your Favorites
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {favoriteTools.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} isFavorite={true} toggleFavorite={toggleFavorite} />
                ))}
              </div>
            </section>
          )}

          {/* Tools Grid */}
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Activity className="w-5 h-5 text-zinc-400" />
                {searchQuery ? `Search Results (${filteredTools.length})` : 'All Toolkit Capabilities'}
              </h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredTools.map((tool, index) => (
                  <motion.div
                    key={tool.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ToolCard 
                      tool={tool} 
                      isFavorite={favorites.includes(tool.id)} 
                      toggleFavorite={toggleFavorite} 
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            
            {filteredTools.length === 0 && (
              <div className="text-center py-20 bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800">
                <Search className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-1">No tools found</h3>
                <p className="text-sm text-zinc-500">Try searching for something else, like "merge" or "AI".</p>
              </div>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <aside className="xl:col-span-4 space-y-8">
          {/* Recent Tasks */}
          <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold flex items-center gap-2">
                <History className="w-4 h-4 text-zinc-400" />
                Recent Tasks
              </h3>
              <Link to="/settings" className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors">View All</Link>
            </div>

            <div className="space-y-4">
              {loadingRecent ? (
                Array(3).fill(0).map((_, i) => (
                  <div key={i} className="h-14 rounded-xl bg-zinc-50 dark:bg-zinc-950 animate-pulse" />
                ))
              ) : recentFiles.length > 0 ? (
                recentFiles.map((item) => (
                  <div key={item.id} className="group flex items-center gap-3 p-2 hover:bg-zinc-50 dark:hover:bg-zinc-950 rounded-xl transition-colors cursor-default">
                    <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-zinc-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.filename}</p>
                      <p className="text-[10px] text-zinc-500">{item.operation} • {new Date(item.timestamp).toLocaleDateString()}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-500 transition-colors" />
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-zinc-50 dark:bg-zinc-950 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Clock className="w-6 h-6 text-zinc-300" />
                  </div>
                  <p className="text-xs text-zinc-500">Your recent activities will appear here.</p>
                </div>
              )}
            </div>
            
            {user && (
              <Link to="/merge" className="mt-6 w-full py-3 bg-zinc-950 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-950 rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                <PlusIcon className="w-4 h-4" />
                New PDF Project
              </Link>
            )}
          </section>

        </aside>
      </div>
    </div>
  );
}

function ToolCard({ tool, isFavorite, toggleFavorite }: { tool: Tool; isFavorite: boolean; toggleFavorite: (e: React.MouseEvent, id: string) => void }) {
  return (
    <Link 
      to={tool.path}
      className="group relative flex flex-col h-full p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:shadow-xl hover:-translate-y-1 transition-all"
    >
      <button 
        onClick={(e) => toggleFavorite(e, tool.id)}
        className={`absolute top-4 right-4 p-1.5 rounded-lg transition-colors z-10 ${isFavorite ? 'text-amber-500 bg-amber-50 dark:bg-amber-500/10' : 'text-zinc-300 hover:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900'}`}
      >
        <Star className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
      </button>
      
      {tool.isNew && (
        <span className="absolute top-4 left-4 px-2 py-0.5 bg-blue-500 text-[10px] font-bold text-white rounded-full uppercase tracking-widest">
          New
        </span>
      )}

      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${tool.bg} ${tool.isNew ? 'mt-4' : ''}`}>
        <tool.icon className={`w-6 h-6 ${tool.color}`} />
      </div>
      
      <div className="mt-auto">
        <h3 className="font-bold text-base mb-1.5 flex items-center gap-2">
          {tool.label}
          <TrendingUp className="w-3 h-3 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        </h3>
        <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2">{tool.desc}</p>
      </div>
    </Link>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}
