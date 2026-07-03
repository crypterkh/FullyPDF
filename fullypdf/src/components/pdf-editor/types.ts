
export interface PageAnnotation {
  id: string;
  type: 'highlight' | 'underline' | 'strike' | 'draw' | 'text' | 'shape';
  color: string;
  opacity?: number;
  points?: { x: number; y: number }[]; // For draw
  rect?: { x: number; y: number; width: number; height: number }; // For highlight, shapes
  text?: string;
  fontSize?: number;
}

export interface PDFPageState {
  id: string;
  originalIndex: number;
  rotation: number;
  isDeleted: boolean;
  annotations: PageAnnotation[];
}

export type ViewMode = 'single' | 'continuous';

export interface PDFEditorState {
  file: File | null;
  pdfDoc: any | null; // pdfjsDoc
  pages: PDFPageState[];
  currentPage: number;
  zoom: number;
  viewMode: ViewMode;
  sidebarOpen: boolean;
  selectedPageIds: string[];
  searchQuery: string;
  searchResults: { pageIndex: number; matchIndex: number }[];
  currentSearchResultIndex: number;
  currentTool: 'select' | 'highlight' | 'text' | 'draw' | 'sticky';
  history: {
    past: PDFPageState[][];
    future: PDFPageState[][];
  };
}
