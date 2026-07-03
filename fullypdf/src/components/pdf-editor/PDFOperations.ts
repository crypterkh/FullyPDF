
import { PDFDocument, degrees } from 'pdf-lib';
import { PDFPageState } from './types';

export const savePDFChanges = async (
  originalFile: File,
  pages: PDFPageState[]
): Promise<Blob> => {
  const arrayBuffer = await originalFile.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const newPdf = await PDFDocument.create();

  // Create a map for quick access to copies of pages
  // We handle duplicates by copying the same original page multiple times
  for (const pageState of pages) {
    const [copiedPage] = await newPdf.copyPages(pdfDoc, [pageState.originalIndex]);
    
    if (pageState.rotation !== 0) {
      copiedPage.setRotation(degrees(pageState.rotation));
    }
    
    // In a full implementation, we would apply annotations here
    // e.g. copiedPage.drawText, drawRectangle, etc.
    
    newPdf.addPage(copiedPage);
  }

  const pdfBytes = await newPdf.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
};

export const extractPages = async (
  originalFile: File,
  pageIndices: number[]
): Promise<Blob> => {
  const arrayBuffer = await originalFile.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const newPdf = await PDFDocument.create();

  const copiedPages = await newPdf.copyPages(pdfDoc, pageIndices);
  copiedPages.forEach(page => newPdf.addPage(page));

  const pdfBytes = await newPdf.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
};
