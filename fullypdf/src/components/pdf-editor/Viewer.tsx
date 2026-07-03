
import React, { useRef, useEffect } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { usePDFEditorStore } from './PDFEditorStore';
import { PageRenderer } from './PageRenderer';

export const Viewer = () => {
  const { pages, zoom, viewMode, setCurrentPage } = usePDFEditorStore();
  const virtuosoRef = useRef<any>(null);

  const handleScroll = (index: number) => {
    setCurrentPage(index + 1);
  };

  if (pages.length === 0) return null;

  return (
    <div className="flex-1 bg-zinc-100 dark:bg-zinc-950/50 overflow-hidden relative">
      <Virtuoso
        ref={virtuosoRef}
        data={pages}
        className="h-full custom-scrollbar"
        itemContent={(index, page) => (
          <div 
            id={`pdf-page-${index + 1}`}
            className="flex justify-center p-12 transition-all"
          >
            <PageRenderer 
              id={page.id}
              pageIndex={page.originalIndex} 
              rotation={page.rotation} 
              zoom={zoom} 
              displayIndex={index + 1}
            />
          </div>
        )}
        rangeChanged={(range) => handleScroll(range.startIndex)}
        increaseViewportBy={1000} // Pre-render pages for smoother scrolling
      />
      
      {/* Zoom Info overlay */}
      <div className="absolute bottom-6 right-6 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 text-[10px] font-bold shadow-xl flex items-center gap-2 select-none">
        <span className="text-zinc-400">PAGE</span>
        <span>{usePDFEditorStore.getState().currentPage} / {pages.length}</span>
      </div>
    </div>
  );
};
