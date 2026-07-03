
import React from 'react';
import { 
  Undo2, Redo2, ZoomIn, ZoomOut, Maximize2, 
  RotateCw, Trash2, Copy, Scissors, 
  Type, Highlighter, PenTool, StickyNote, Square, Circle, 
  Save, Download, Layout, LayoutPanelLeft, 
  Columns2, FilePlus, Eye, Search, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Button } from '../ui/button';
import { usePDFEditorStore } from './PDFEditorStore';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export const Toolbar = () => {
  const { 
    zoom, setZoom, undo, redo, history, 
    viewMode, setViewMode, sidebarOpen, setSidebarOpen,
    pages, file, selectedPageIds, clearSelection,
    searchQuery, setSearchQuery, searchResults, setSearchResults,
    currentSearchResultIndex, setCurrentSearchResultIndex,
    pdfDoc, setCurrentPage,
    currentTool, setTool
  } = usePDFEditorStore();

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query || !pdfDoc) {
      setSearchResults([]);
      setCurrentSearchResultIndex(-1);
      return;
    }

    const results: { pageIndex: number; matchIndex: number }[] = [];
    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const page = await pdfDoc.getPage(i);
      const textContent = await page.getTextContent();
      const text = textContent.items.map((item: any) => item.str).join(' ');
      
      let index = text.toLowerCase().indexOf(query.toLowerCase());
      while (index !== -1) {
        results.push({ pageIndex: i, matchIndex: index });
        index = text.toLowerCase().indexOf(query.toLowerCase(), index + 1);
      }
    }
    setSearchResults(results);
    if (results.length > 0) {
      setCurrentSearchResultIndex(0);
      setCurrentPage(results[0].pageIndex);
      const el = document.getElementById(`pdf-page-${results[0].pageIndex}`);
      el?.scrollIntoView({ behavior: 'smooth' });
    } else {
      setCurrentSearchResultIndex(-1);
    }
  };

  const navigateSearch = (direction: 'next' | 'prev') => {
    if (searchResults.length === 0) return;
    let nextIndex = direction === 'next' ? currentSearchResultIndex + 1 : currentSearchResultIndex - 1;
    if (nextIndex >= searchResults.length) nextIndex = 0;
    if (nextIndex < 0) nextIndex = searchResults.length - 1;
    
    setCurrentSearchResultIndex(nextIndex);
    const result = searchResults[nextIndex];
    setCurrentPage(result.pageIndex);
    const el = document.getElementById(`pdf-page-${result.pageIndex}`);
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleExtract = async () => {
    if (!file || selectedPageIds.length === 0) return;
    try {
      const { extractPages } = await import('./PDFOperations');
      const selectedIndices = pages
        .filter(p => selectedPageIds.includes(p.id))
        .map(p => p.originalIndex);
        
      const blob = await extractPages(file, selectedIndices);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `extracted_${file.name}`;
      link.click();
      URL.revokeObjectURL(url);
      clearSelection();
      toast.success(`${selectedIndices.length} pages extracted`);
    } catch (error) {
      console.error('Extract error:', error);
      toast.error('Failed to extract pages');
    }
  };

  const handleDownload = async () => {
    if (!file || pages.length === 0) return;
    
    try {
      const { savePDFChanges } = await import('./PDFOperations');
      const blob = await savePDFChanges(file, pages);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `edited_${file.name}`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  return (
    <TooltipProvider>
      <div className="h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center justify-between px-4 sticky top-0 z-50">
        <div className="flex items-center gap-1">
          <Tooltip content="Toggle Sidebar">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className={sidebarOpen ? 'text-indigo-600' : ''}>
              <LayoutPanelLeft className="w-4 h-4" />
            </Button>
          </Tooltip>
          
          <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800 mx-2" />
          
          <Tooltip content="Undo">
            <Button variant="ghost" size="icon" onClick={undo} disabled={history.past.length === 0}>
              <Undo2 className="w-4 h-4" />
            </Button>
          </Tooltip>
          
          <Tooltip content="Redo">
            <Button variant="ghost" size="icon" onClick={redo} disabled={history.future.length === 0}>
              <Redo2 className="w-4 h-4" />
            </Button>
          </Tooltip>
        </div>

        <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
          <Search className="w-3.5 h-3.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent border-none outline-none text-xs w-24 xl:w-40 placeholder:text-zinc-500"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
          {searchResults.length > 0 && (
            <div className="flex items-center gap-1 pl-2 border-l border-zinc-200 dark:border-zinc-800">
              <span className="text-[9px] font-medium text-zinc-500 min-w-[30px] text-center">
                {currentSearchResultIndex + 1}/{searchResults.length}
              </span>
              <button onClick={() => navigateSearch('prev')} className="p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded transition-colors">
                <ChevronLeft className="w-3 h-3 text-zinc-500" />
              </button>
              <button onClick={() => navigateSearch('next')} className="p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded transition-colors">
                <ChevronRight className="w-3 h-3 text-zinc-500" />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 rounded-lg p-1">
          <Tooltip content="Zoom Out">
            <Button variant="ghost" size="icon" onClick={() => setZoom(Math.max(0.1, zoom - 0.1))} className="h-8 w-8">
              <ZoomOut className="w-4 h-4" />
            </Button>
          </Tooltip>
          
          <div className="px-2 min-w-[60px] text-center text-xs font-bold">
            {Math.round(zoom * 100)}%
          </div>

          <Tooltip content="Zoom In">
            <Button variant="ghost" size="icon" onClick={() => setZoom(Math.min(5, zoom + 0.1))} className="h-8 w-8">
              <ZoomIn className="w-4 h-4" />
            </Button>
          </Tooltip>
          
          <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 mx-1" />
          
          <Tooltip content={viewMode === 'continuous' ? 'Continuous View' : 'Single Page View'}>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setViewMode(viewMode === 'continuous' ? 'single' : 'continuous')} 
              className={`h-8 w-8 ${viewMode === 'continuous' ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : ''}`}
            >
              {viewMode === 'continuous' ? <Layout className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </Tooltip>
        </div>

        <div className="flex items-center gap-1 border-x border-zinc-200 dark:border-zinc-800 px-4 h-full">
          <Tooltip content="Highlight">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setTool(currentTool === 'highlight' ? 'select' : 'highlight')}
              className={`hover:text-indigo-600 ${currentTool === 'highlight' ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : ''}`}
            >
              <Highlighter className="w-4 h-4" />
            </Button>
          </Tooltip>
          <Tooltip content="Add Text">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setTool(currentTool === 'text' ? 'select' : 'text')}
              className={`hover:text-indigo-600 ${currentTool === 'text' ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : ''}`}
            >
              <Type className="w-4 h-4" />
            </Button>
          </Tooltip>
          <Tooltip content="Draw">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setTool(currentTool === 'draw' ? 'select' : 'draw')}
              className={`hover:text-indigo-600 ${currentTool === 'draw' ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : ''}`}
            >
              <PenTool className="w-4 h-4" />
            </Button>
          </Tooltip>
          <Tooltip content="Sticky Note">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setTool(currentTool === 'sticky' ? 'select' : 'sticky')}
              className={`hover:text-indigo-600 ${currentTool === 'sticky' ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : ''}`}
            >
              <StickyNote className="w-4 h-4" />
            </Button>
          </Tooltip>
        </div>

        <div className="flex items-center gap-2">
           <AnimatePresence>
             {selectedPageIds.length > 0 && (
               <motion.div
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: 20 }}
               >
                 <Button variant="outline" size="sm" onClick={handleExtract} className="bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100">
                   <Scissors className="w-4 h-4 mr-2" />
                   Extract ({selectedPageIds.length})
                 </Button>
               </motion.div>
             )}
           </AnimatePresence>
           <Button variant="outline" size="sm" className="hidden lg:flex">
             <FilePlus className="w-4 h-4 mr-2" />
             Merge
           </Button>
           <Button onClick={handleDownload} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 dark:shadow-none">
             <Download className="w-4 h-4 mr-2" />
             Download
           </Button>
        </div>
      </div>
    </TooltipProvider>
  );
};
