
import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { usePDFEditorStore } from './PDFEditorStore';
import { Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

interface PageRendererProps {
  id: string;
  pageIndex: number;
  rotation: number;
  zoom: number;
  displayIndex: number;
}

export const PageRenderer = ({ id, pageIndex, rotation, zoom, displayIndex }: PageRendererProps) => {
  const { pdfDoc, currentTool, addAnnotation, pages } = usePDFEditorStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const renderTaskRef = useRef<any>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([]);

  const pageState = pages.find(p => p.id === id);
  const annotations = pageState?.annotations || [];

  const handleMouseDown = (e: React.MouseEvent) => {
    if (currentTool === 'select') return;
    
    setIsDrawing(true);
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    
    if (currentTool === 'text') {
      const text = prompt('Enter text:');
      if (text) {
        addAnnotation(id, {
          type: 'text',
          color: '#000000',
          text,
          rect: { x, y, width: 100, height: 20 },
          fontSize: 14
        });
      }
      setIsDrawing(false);
      return;
    }

    setCurrentPoints([{ x, y }]);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || currentTool === 'select' || currentTool === 'text') return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    
    setCurrentPoints(prev => [...prev, { x, y }]);
  };

  const handleMouseUp = () => {
    if (!isDrawing || currentTool === 'select' || currentTool === 'text') {
      setIsDrawing(false);
      return;
    }

    if (currentPoints.length > 0) {
      if (currentTool === 'draw') {
        addAnnotation(id, {
          type: 'draw',
          color: '#4f46e5',
          points: currentPoints,
          opacity: 1
        });
      } else if (currentTool === 'highlight') {
        const xs = currentPoints.map(p => p.x);
        const ys = currentPoints.map(p => p.y);
        const minX = Math.min(...xs);
        const minY = Math.min(...ys);
        const maxX = Math.max(...xs);
        const maxY = Math.max(...ys);
        
        addAnnotation(id, {
          type: 'highlight',
          color: '#facc15',
          rect: { x: minX, y: minY, width: maxX - minX, height: maxY - minY },
          opacity: 0.3
        });
      }
    }

    setIsDrawing(false);
    setCurrentPoints([]);
  };

  useEffect(() => {
    let isMounted = true;

    const renderPage = async () => {
      if (!pdfDoc || !canvasRef.current) return;

      try {
        setLoading(true);
        const page = await pdfDoc.getPage(pageIndex + 1);
        
        if (!isMounted) return;

        // Cancel previous render task
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
        }

        const viewport = page.getViewport({ scale: zoom * 2, rotation }); // Higher scale for clarity
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (!context) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;
        canvas.style.width = `${viewport.width / 2}px`;
        canvas.style.height = `${viewport.height / 2}px`;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;

        await renderTask.promise;
        if (isMounted) setLoading(false);
      } catch (error: any) {
        if (error.name === 'RenderingCancelledException') return;
        console.error('Error rendering page:', error);
      }
    };

    renderPage();

    return () => {
      isMounted = false;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [pdfDoc, pageIndex, rotation, zoom]);

  return (
    <div className="relative flex flex-col items-center">
      {zoom > 0.3 && (
        <div className="absolute -left-12 top-0 text-[10px] font-bold text-zinc-400 select-none">
          {displayIndex}
        </div>
      )}
      
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-zinc-900 shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-sm overflow-hidden border border-zinc-200 dark:border-zinc-800 relative group"
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 z-10">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        )}
        <canvas ref={canvasRef} className="max-w-full h-auto block" />
        
        {zoom > 0.3 && (
          <div 
            className={`absolute inset-0 ${currentTool !== 'select' ? 'cursor-crosshair' : ''}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            <svg 
              viewBox={`0 0 ${canvasRef.current?.width ? canvasRef.current.width / (zoom * 2) : 0} ${canvasRef.current?.height ? canvasRef.current.height / (zoom * 2) : 0}`}
              className="w-full h-full"
              style={{ pointerEvents: currentTool === 'select' ? 'none' : 'auto' }}
            >
              {annotations.map((ann) => (
                <React.Fragment key={ann.id}>
                  {ann.type === 'highlight' && ann.rect && (
                    <rect 
                      x={ann.rect.x} 
                      y={ann.rect.y} 
                      width={ann.rect.width} 
                      height={ann.rect.height} 
                      fill={ann.color} 
                      fillOpacity={ann.opacity} 
                    />
                  )}
                  {ann.type === 'draw' && ann.points && (
                    <polyline
                      points={ann.points.map(p => `${p.x},${p.y}`).join(' ')}
                      fill="none"
                      stroke={ann.color}
                      strokeWidth={2 / zoom}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity={ann.opacity}
                    />
                  )}
                  {ann.type === 'text' && ann.rect && (
                    <text
                      x={ann.rect.x}
                      y={ann.rect.y + (ann.fontSize || 14)}
                      fill={ann.color}
                      fontSize={ann.fontSize}
                      fontFamily="sans-serif"
                    >
                      {ann.text}
                    </text>
                  )}
                </React.Fragment>
              ))}
              
              {/* Current Drawing Preview */}
              {isDrawing && currentPoints.length > 0 && (
                <>
                  {currentTool === 'draw' && (
                    <polyline
                      points={currentPoints.map(p => `${p.x},${p.y}`).join(' ')}
                      fill="none"
                      stroke="#4f46e5"
                      strokeWidth={2 / zoom}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                  {currentTool === 'highlight' && (
                    <rect
                      x={Math.min(...currentPoints.map(p => p.x))}
                      y={Math.min(...currentPoints.map(p => p.y))}
                      width={Math.max(...currentPoints.map(p => p.x)) - Math.min(...currentPoints.map(p => p.x))}
                      height={Math.max(...currentPoints.map(p => p.y)) - Math.min(...currentPoints.map(p => p.y))}
                      fill="#facc15"
                      fillOpacity={0.3}
                    />
                  )}
                </>
              )}
            </svg>
          </div>
        )}
      </motion.div>
    </div>
  );
};
