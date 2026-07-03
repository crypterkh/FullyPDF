import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { saveWorkHistory } from '../lib/history';
import { FileDropzone } from '../components/ui/file-dropzone';
import { Button } from '../components/ui/button';
import { motion } from 'motion/react';
import { Loader2, ArrowLeft, FileCode, Download, Settings2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import html2pdf from 'html2pdf.js';

export function HtmlToPdf() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [options, setOptions] = useState({
    format: 'a4',
    orientation: 'portrait' as 'portrait' | 'landscape',
    margin: 10
  });

  const handleConvert = async () => {
    let content = '';
    let fileName = 'document.pdf';

    if (file) {
      content = await file.text();
      fileName = file.name.replace(/\.[^/.]+$/, "") + ".pdf";
    } else if (htmlContent) {
      content = htmlContent;
      fileName = "converted_html.pdf";
    } else {
      return;
    }

    setIsProcessing(true);
    try {
      // Create a temporary container to render the HTML
      const container = document.createElement('div');
      container.innerHTML = content;
      container.style.padding = `${options.margin}px`;
      
      // Inject some basic styles to ensure images and tables look okay
      const style = document.createElement('style');
      style.textContent = `
        img { max-width: 100%; height: auto; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        body { font-family: sans-serif; }
      `;
      container.appendChild(style);

      const opt = {
        margin: options.margin,
        filename: fileName,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: options.format, orientation: options.orientation }
      };

      await html2pdf().from(container).set(opt).save();
      await saveWorkHistory(user?.uid, fileName, "HTML to PDF");
    } catch (error) {
      console.error("Conversion failed:", error);
      alert("Failed to convert HTML to PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto w-full h-full flex flex-col pt-4"
    >
      <div className="mb-8">
        <Link to="/" className="inline-flex items-center text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold tracking-tight mb-2">HTML to PDF</h1>
        <p className="text-zinc-500">Convert HTML files or code snippets into high-quality PDF documents.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
            <h2 className="text-sm font-semibold mb-4 uppercase tracking-wider text-zinc-400">Input Method</h2>
            
            <div className="space-y-4">
              {!htmlContent && (
                <FileDropzone 
                  onFilesSelected={(selected) => setFile(selected[0])} 
                  maxFiles={1}
                  description="Drag and drop an HTML file here"
                  accept={{ 'text/html': ['.html', '.htm'] }}
                />
              )}

              {!file && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-500">Or paste HTML code here:</label>
                  <textarea
                    value={htmlContent}
                    onChange={(e) => setHtmlContent(e.target.value)}
                    className="w-full h-64 p-4 text-sm font-mono bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-all"
                    placeholder="<html><body><h1>Hello World</h1></body></html>"
                  />
                </div>
              )}

              {(file || htmlContent) && (
                <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <FileCode className="w-4 h-4 text-zinc-400" />
                    <span className="text-sm font-medium truncate max-w-[200px]">
                      {file ? file.name : "Pasted HTML content"}
                    </span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => { setFile(null); setHtmlContent(''); }}
                    className="h-8 px-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    Clear
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2 uppercase tracking-wider text-zinc-400">
              <Settings2 className="w-4 h-4" />
              Options
            </h2>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-500">Page Format</label>
                <select 
                  value={options.format}
                  onChange={(e) => setOptions({ ...options, format: e.target.value })}
                  className="w-full p-2 text-sm bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                >
                  <option value="a4">A4</option>
                  <option value="letter">Letter</option>
                  <option value="legal">Legal</option>
                  <option value="a3">A3</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-500">Orientation</label>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant={options.orientation === 'portrait' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setOptions({ ...options, orientation: 'portrait' })}
                    className="text-xs"
                  >
                    Portrait
                  </Button>
                  <Button 
                    variant={options.orientation === 'landscape' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setOptions({ ...options, orientation: 'landscape' })}
                    className="text-xs"
                  >
                    Landscape
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-500">Margin (mm)</label>
                <input 
                  type="number"
                  value={options.margin}
                  onChange={(e) => setOptions({ ...options, margin: parseInt(e.target.value) || 0 })}
                  className="w-full p-2 text-sm bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                  min="0"
                  max="50"
                />
              </div>

              <Button 
                className="w-full mt-4" 
                onClick={handleConvert}
                disabled={isProcessing || (!file && !htmlContent)}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Convert to PDF
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
