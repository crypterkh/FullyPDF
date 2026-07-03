const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'src', 'pages');

const filesToProcess = [
  { name: 'MergePDF.tsx', operation: 'Merged', fileVar: 'files.length > 0 ? files[0].name + " (and others)" : "merged.pdf"' },
  { name: 'SplitPDF.tsx', operation: 'Split', fileVar: 'file.name' },
  { name: 'ExtractPDF.tsx', operation: 'Extracted Pages', fileVar: 'file.name' },
  { name: 'RotatePDF.tsx', operation: 'Rotated', fileVar: 'file.name' },
  { name: 'OCR.tsx', operation: 'OCR Extracted', fileVar: 'file.name' },
  { name: 'ImageToPdf.tsx', operation: 'Image to PDF', fileVar: 'files.length > 0 ? files[0].name + " (and others)" : "image.pdf"' },
  { name: 'WatermarkPDF.tsx', operation: 'Watermarked', fileVar: 'file.name' },
  { name: 'WordToPdf.tsx', operation: 'Word to PDF', fileVar: 'file.name' },
];

for (const { name, operation, fileVar } of filesToProcess) {
  const filePath = path.join(pagesDir, name);
  if (!fs.existsSync(filePath)) continue;

  let content = fs.readFileSync(filePath, 'utf8');
  
  if (content.includes('saveWorkHistory')) continue; // Already added

  // Add imports
  if (!content.includes('useAuth')) {
    content = content.replace(/(import React.*?from 'react';)/, `$1\nimport { useAuth } from '../context/AuthContext';\nimport { saveWorkHistory } from '../lib/history';`);
  } else {
    content = content.replace(/(import { useAuth } from '..\/context\/AuthContext';)/, `$1\nimport { saveWorkHistory } from '../lib/history';`);
  }

  // Find the component function and add useAuth if it doesn't have it
  const componentName = name.replace('.tsx', '');
  const functionRegex = new RegExp(`export function ${componentName}\\(\\) {`);
  if (!content.includes('const { user } = useAuth();')) {
    content = content.replace(functionRegex, `export function ${componentName}() {\n  const { user } = useAuth();`);
  }

  // Find where setPdfUrl(URL.createObjectURL(blob)) is called, or setExtractedText
  if (name === 'OCR.tsx') {
    content = content.replace(/(setExtractedText\(.*?\);)/g, `$1\n        await saveWorkHistory(user?.uid, ${fileVar}, "${operation}");`);
  } else if (name === 'WordToPdf.tsx') {
      content = content.replace(/(setPdfUrl\(URL.createObjectURL\(blob\)\);)/g, `$1\n      await saveWorkHistory(user?.uid, ${fileVar}, "${operation}");`);
  } else {
    content = content.replace(/(setPdfUrl\(URL\.createObjectURL\(.*?\)\);)/g, `$1\n      await saveWorkHistory(user?.uid, ${fileVar}, "${operation}");`);
  }

  fs.writeFileSync(filePath, content);
}
