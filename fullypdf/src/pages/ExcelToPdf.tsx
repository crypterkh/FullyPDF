import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { saveWorkHistory } from '../lib/history';
import { FileDropzone } from '../components/ui/file-dropzone';
import { Button } from '../components/ui/button';
import { motion } from 'motion/react';
import { Loader2, ArrowLeft, Table, Download, Settings2, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export function ExcelToPdf() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [selectedSheet, setSelectedSheet] = useState<string>('all');
  const [options, setOptions] = useState({
    orientation: 'portrait' as 'portrait' | 'landscape',
  });

  const handleFileSelect = async (selected: File[]) => {
    const selectedFile = selected[0];
    setFile(selectedFile);
    
    try {
      const data = await selectedFile.arrayBuffer();
      const wb = XLSX.read(data);
      setWorkbook(wb);
      setSelectedSheet('all');
    } catch (error) {
      console.error("Failed to read Excel file:", error);
      alert("Invalid Excel file.");
      setFile(null);
    }
  };

  const handleConvert = async () => {
    if (!workbook || !file) return;

    setIsProcessing(true);
    try {
      const doc = new jsPDF({
        orientation: options.orientation,
        unit: 'mm',
        format: 'a4'
      });

      const sheetsToProcess = selectedSheet === 'all' 
        ? workbook.SheetNames 
        : [selectedSheet];

      sheetsToProcess.forEach((sheetName, index) => {
        if (index > 0) {
          doc.addPage();
        }

        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        if (jsonData.length === 0) return;

        doc.setFontSize(14);
        doc.text(sheetName, 14, 15);
        
        autoTable(doc, {
          head: [jsonData[0]],
          body: jsonData.slice(1),
          startY: 20,
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [40, 40, 40] },
          margin: { top: 20 },
        });
      });

      const fileName = file.name.replace(/\.[^/.]+$/, "") + ".pdf";
      doc.save(fileName);
      await saveWorkHistory(user?.uid, fileName, "Excel to PDF");
    } catch (error) {
      console.error("Conversion failed:", error);
      alert("Failed to convert Excel to PDF.");
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
        <h1 className="text-3xl font-bold tracking-tight mb-2">Excel to PDF</h1>
        <p className="text-zinc-500">Convert your spreadsheets into professional PDF documents while preserving structure and formatting.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
            <h2 className="text-sm font-semibold mb-4 uppercase tracking-wider text-zinc-400">File Upload</h2>
            
            {!file ? (
              <FileDropzone 
                onFilesSelected={handleFileSelect} 
                maxFiles={1}
                description="Drag and drop an Excel file (.xlsx, .xls) here"
                accept={{ 
                  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
                  'application/vnd.ms-excel': ['.xls']
                }}
              />
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <Table className="w-5 h-5 text-green-600" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-[10px] text-zinc-500">{(file.size / 1024).toFixed(2)} KB • {workbook?.SheetNames.length} Sheets</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => { setFile(null); setWorkbook(null); }}
                    className="text-red-500"
                  >
                    Remove
                  </Button>
                </div>

                {workbook && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Select Worksheet</label>
                      <div className="flex flex-wrap gap-2">
                        <Button 
                          variant={selectedSheet === 'all' ? 'default' : 'outline'} 
                          size="sm"
                          onClick={() => setSelectedSheet('all')}
                          className="text-xs"
                        >
                          All Sheets
                        </Button>
                        {workbook.SheetNames.map(name => (
                          <Button 
                            key={name}
                            variant={selectedSheet === name ? 'default' : 'outline'} 
                            size="sm"
                            onClick={() => setSelectedSheet(name)}
                            className="text-xs"
                          >
                            {name}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
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
                <label className="text-xs font-medium text-zinc-500">Page Orientation</label>
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

              <div className="pt-4">
                <Button 
                  className="w-full" 
                  onClick={handleConvert}
                  disabled={isProcessing || !file}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Converting...
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

          <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800">
            <h4 className="text-xs font-semibold mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
              Pro Tip
            </h4>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Landscape orientation is recommended for spreadsheets with many columns to prevent text clipping.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
