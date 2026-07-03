import React, { useCallback, useState } from 'react';
import { useDropzone, DropzoneOptions } from 'react-dropzone';
import { FileUp, File as FileIcon, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';

interface FileDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  accept?: DropzoneOptions['accept'];
  maxFiles?: number;
  description?: string;
  className?: string;
}

export function FileDropzone({
  onFilesSelected,
  accept = { 'application/pdf': ['.pdf'] },
  maxFiles = 0,
  description = "Drag & drop your files here or click to browse",
  className,
}: FileDropzoneProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setSelectedFiles(prev => {
      const newFiles = [...prev, ...acceptedFiles];
      if (maxFiles > 0 && newFiles.length > maxFiles) {
        return newFiles.slice(0, maxFiles);
      }
      return newFiles;
    });
    onFilesSelected(acceptedFiles);
  }, [maxFiles, onFilesSelected]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles: maxFiles > 0 ? maxFiles : undefined
  });

  const removeFile = (index: number) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);
    // In a real app we'd want to communicate removals back up, 
    // but for simplicity here the parent relies on state or we trigger onFilesSelected with remaining
    onFilesSelected(newFiles);
  };

  return (
    <div className={cn("w-full", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 transition-colors cursor-pointer flex flex-col items-center justify-center text-center",
          isDragActive 
            ? "border-zinc-900 bg-zinc-50 dark:border-zinc-50 dark:bg-zinc-900/50" 
            : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/50"
        )}
      >
        <input {...getInputProps()} />
        <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
          <FileUp className="w-6 h-6 text-zinc-600 dark:text-zinc-400" />
        </div>
        <h3 className="text-sm font-medium mb-1">Upload files</h3>
        <p className="text-sm text-zinc-500 mb-4">{description}</p>
        <Button variant="outline" size="sm" type="button">Select Files</Button>
      </div>

      {selectedFiles.length > 0 && (
        <div className="mt-6 space-y-2">
          {selectedFiles.map((file, i) => (
            <div key={`${file.name}-${i}`} className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
              <div className="flex items-center gap-3 overflow-hidden">
                <FileIcon className="w-5 h-5 text-zinc-500 shrink-0" />
                <span className="text-sm font-medium truncate">{file.name}</span>
                <span className="text-xs text-zinc-500 shrink-0">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 shrink-0 text-zinc-500 hover:text-red-500"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(i);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
