
import React from 'react';
import { usePDFEditorStore } from './PDFEditorStore';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { RotateCw, Trash2, Copy, GripVertical, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PageRenderer } from './PageRenderer';

interface SortableThumbnailProps {
  id: string;
  index: number;
  originalIndex: number;
  rotation: number;
  isActive: boolean;
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
}

const SortableThumbnail = ({ id, index, originalIndex, rotation, isActive, isSelected, onClick }: SortableThumbnailProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 1,
  };

  const { rotatePage, deletePage, duplicatePage, togglePageSelection } = usePDFEditorStore();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group rounded-xl border-2 transition-all p-2 bg-white dark:bg-zinc-950 shadow-sm ${
        isDragging ? 'opacity-50 scale-105 shadow-2xl border-indigo-500' : ''
      } ${
        isActive ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-900/10' : 
        isSelected ? 'border-indigo-400 bg-indigo-50/20 dark:bg-indigo-900/5' : 'border-transparent hover:border-zinc-200 dark:hover:border-zinc-800'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors">
          <GripVertical className="w-3 h-3 text-zinc-400" />
        </div>
        <div className="flex items-center gap-2">
          <input 
            type="checkbox" 
            checked={isSelected}
            onChange={() => togglePageSelection(id)}
            onClick={(e) => e.stopPropagation()}
            className="w-3 h-3 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-[10px] font-bold text-zinc-400">#{index + 1}</span>
        </div>
      </div>
      
      <div className="aspect-[3/4] bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center overflow-hidden relative shadow-inner">
        <PageRenderer 
          id={id}
          pageIndex={originalIndex} 
          rotation={rotation} 
          zoom={0.15} 
          displayIndex={index + 1}
        />
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex gap-0.5">
          <button 
            onClick={(e) => { e.stopPropagation(); rotatePage(id, 90); }} 
            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500 hover:text-indigo-600"
          >
            <RotateCw className="w-3 h-3" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); duplicatePage(id); }} 
            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500 hover:text-indigo-600"
          >
            <Copy className="w-3 h-3" />
          </button>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); deletePage(id); }} 
          className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export const Sidebar = () => {
  const { pages, currentPage, setCurrentPage, reorderPages, sidebarOpen } = usePDFEditorStore();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderPages(active.id as string, over.id as string);
    }
  };

  return (
    <AnimatePresence>
      {sidebarOpen && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 280, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          className="bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 h-full flex flex-col overflow-hidden"
        >
          <div className="p-4 border-b border-zinc-100 dark:border-zinc-900 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Thumbnails</h3>
            <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] px-1.5 py-0.5 rounded font-bold">
              {pages.length} Pages
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={pages.map(p => p.id)}
                strategy={verticalListSortingStrategy}
              >
                {pages.map((page, index) => (
                  <SortableThumbnail
                    key={page.id}
                    id={page.id}
                    index={index}
                    originalIndex={page.originalIndex}
                    rotation={page.rotation}
                    isActive={currentPage === index + 1}
                    isSelected={usePDFEditorStore.getState().selectedPageIds.includes(page.id)}
                    onClick={(e) => {
                      if (e.shiftKey) {
                        usePDFEditorStore.getState().togglePageSelection(page.id);
                      } else {
                        setCurrentPage(index + 1);
                        const el = document.getElementById(`pdf-page-${index + 1}`);
                        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
