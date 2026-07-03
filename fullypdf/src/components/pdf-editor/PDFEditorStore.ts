
import { create } from 'zustand';
import { PDFEditorState, PDFPageState, ViewMode, PageAnnotation } from './types';
import { nanoid } from 'nanoid';

interface PDFEditorActions {
  setFile: (file: File | null) => void;
  setPdfDoc: (doc: any) => void;
  setPages: (pages: PDFPageState[]) => void;
  setCurrentPage: (page: number) => void;
  setZoom: (zoom: number) => void;
  setViewMode: (mode: ViewMode) => void;
  setSidebarOpen: (open: boolean) => void;
  togglePageSelection: (pageId: string) => void;
  clearSelection: () => void;
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: { pageIndex: number; matchIndex: number }[]) => void;
  setCurrentSearchResultIndex: (index: number) => void;
  setTool: (tool: 'select' | 'highlight' | 'text' | 'draw' | 'sticky') => void;
  
  // Actions
  rotatePage: (pageId: string, angle: number) => void;
  deletePage: (pageId: string) => void;
  reorderPages: (activeId: string, overId: string) => void;
  duplicatePage: (pageId: string) => void;
  addAnnotation: (pageId: string, annotation: Omit<PageAnnotation, 'id'>) => void;
  removeAnnotation: (pageId: string, annotationId: string) => void;
  
  // History
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;
}

export const usePDFEditorStore = create<PDFEditorState & PDFEditorActions>((set, get) => ({
  file: null,
  pdfDoc: null,
  pages: [],
  currentPage: 1,
  zoom: 1.0,
  viewMode: 'continuous',
  sidebarOpen: true,
  selectedPageIds: [],
  searchQuery: '',
  searchResults: [],
  currentSearchResultIndex: -1,
  currentTool: 'select',
  
  togglePageSelection: (pageId: string) => {
    set((state) => ({
      selectedPageIds: state.selectedPageIds.includes(pageId)
        ? state.selectedPageIds.filter((id) => id !== pageId)
        : [...state.selectedPageIds, pageId],
    }));
  },

  clearSelection: () => set({ selectedPageIds: [] }),

  history: {
    past: [],
    future: [],
  },

  setFile: (file) => set({ file }),
  setPdfDoc: (pdfDoc) => set({ pdfDoc }),
  setPages: (pages) => set({ pages }),
  setCurrentPage: (currentPage) => set({ currentPage }),
  setZoom: (zoom) => set({ zoom }),
  setViewMode: (viewMode) => set({ viewMode }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSearchResults: (searchResults) => set({ searchResults }),
  setCurrentSearchResultIndex: (currentSearchResultIndex) => set({ currentSearchResultIndex }),
  setTool: (currentTool) => set({ currentTool }),

  pushHistory: () => {
    const { pages, history } = get();
    set({
      history: {
        past: [...history.past, JSON.parse(JSON.stringify(pages))],
        future: [],
      },
    });
  },

  undo: () => {
    const { pages, history } = get();
    if (history.past.length === 0) return;
    
    const previous = history.past[history.past.length - 1];
    const newPast = history.past.slice(0, -1);
    
    set({
      pages: previous,
      history: {
        past: newPast,
        future: [JSON.parse(JSON.stringify(pages)), ...history.future],
      },
    });
  },

  redo: () => {
    const { pages, history } = get();
    if (history.future.length === 0) return;
    
    const next = history.future[0];
    const newFuture = history.future.slice(1);
    
    set({
      pages: next,
      history: {
        past: [...history.past, JSON.parse(JSON.stringify(pages))],
        future: newFuture,
      },
    });
  },

  rotatePage: (pageId, angle) => {
    get().pushHistory();
    set((state) => ({
      pages: state.pages.map((p) =>
        p.id === pageId ? { ...p, rotation: (p.rotation + angle) % 360 } : p
      ),
    }));
  },

  deletePage: (pageId) => {
    get().pushHistory();
    set((state) => ({
      pages: state.pages.filter((p) => p.id !== pageId),
    }));
  },

  reorderPages: (activeId, overId) => {
    get().pushHistory();
    set((state) => {
      const oldIndex = state.pages.findIndex((p) => p.id === activeId);
      const newIndex = state.pages.findIndex((p) => p.id === overId);
      
      const newPages = [...state.pages];
      const [removed] = newPages.splice(oldIndex, 1);
      newPages.splice(newIndex, 0, removed);
      
      return { pages: newPages };
    });
  },

  duplicatePage: (pageId) => {
    get().pushHistory();
    set((state) => {
      const pageIndex = state.pages.findIndex((p) => p.id === pageId);
      const page = state.pages[pageIndex];
      const newPage = { ...page, id: nanoid() };
      const newPages = [...state.pages];
      newPages.splice(pageIndex + 1, 0, newPage);
      return { pages: newPages };
    });
  },

  addAnnotation: (pageId, annotation) => {
    get().pushHistory();
    set((state) => ({
      pages: state.pages.map((p) =>
        p.id === pageId
          ? { ...p, annotations: [...p.annotations, { ...annotation, id: nanoid() }] }
          : p
      ),
    }));
  },

  removeAnnotation: (pageId, annotationId) => {
    get().pushHistory();
    set((state) => ({
      pages: state.pages.map((p) =>
        p.id === pageId
          ? { ...p, annotations: p.annotations.filter((a) => a.id !== annotationId) }
          : p
      ),
    }));
  },
}));
