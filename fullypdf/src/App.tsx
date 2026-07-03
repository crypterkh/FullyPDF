/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { MergePDF } from './pages/MergePDF';
import { SplitPDF } from './pages/SplitPDF';
import { AiChat } from './pages/AiChat';
import { ImageToPdf } from './pages/ImageToPdf';
import { WatermarkPDF } from './pages/WatermarkPDF';
import { WordToPdf } from './pages/WordToPdf';
import { RotatePDF } from './pages/RotatePDF';
import { ExtractPDF } from './pages/ExtractPDF';
import { OCR } from './pages/OCR';
import { PdfToText } from './pages/PdfToText';
import { OrganizePDF } from './pages/OrganizePDF';
import { UnlockPDF } from './pages/UnlockPDF';
import { RepairPDF } from './pages/RepairPDF';
import { SignPDF } from './pages/SignPDF';
import { FlattenPDF } from './pages/FlattenPDF';
import { TranslatePDF } from './pages/TranslatePDF';
import { ExplainText } from './pages/ExplainText';
import { ChatWithPDF } from './pages/ChatWithPDF';
import { HtmlToPdf } from './pages/HtmlToPdf';
import { ExcelToPdf } from './pages/ExcelToPdf';
import { PptToPdf } from './pages/PptToPdf';
import { SummarizePDF } from './pages/SummarizePDF';
import { ProtectPDF } from './pages/ProtectPDF';
import { PdfViewer } from './pages/PdfViewer';
import { AddPageNumbers } from './pages/AddPageNumbers';
import { ComingSoon } from './components/ui/ComingSoon';

import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Toaster position="top-center" richColors />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="merge" element={<MergePDF />} />
              <Route path="split" element={<SplitPDF />} />
              <Route path="ai-chat" element={<ChatWithPDF />} />
              <Route path="image-to-pdf" element={<ImageToPdf />} />
              <Route path="watermark" element={<WatermarkPDF />} />
              <Route path="word-to-pdf" element={<WordToPdf />} />
              <Route path="html-to-pdf" element={<HtmlToPdf />} />
              <Route path="excel-to-pdf" element={<ExcelToPdf />} />
              <Route path="ppt-to-pdf" element={<PptToPdf />} />
              <Route path="pdf-to-text" element={<PdfToText />} />
              <Route path="rotate" element={<RotatePDF />} />
              <Route path="extract" element={<ExtractPDF />} />
              <Route path="ocr" element={<OCR />} />
              <Route path="summarize" element={<SummarizePDF />} />
              <Route path="viewer" element={<PdfViewer />} />
              <Route path="add-page-numbers" element={<AddPageNumbers />} />
              <Route path="compress" element={<ComingSoon title="Compress PDF" description="Reduce file size while keeping quality." />} />
              <Route path="pdf-to-image" element={<ComingSoon title="PDF to Image" description="Convert PDF pages into images." />} />
              <Route path="protect" element={<ProtectPDF />} />
              
              {/* New Premium Routes */}
              <Route path="delete" element={<OrganizePDF />} />
              <Route path="reorder" element={<OrganizePDF />} />
              <Route path="translate" element={<TranslatePDF />} />
              <Route path="explain" element={<ExplainText />} />
              <Route path="repair" element={<RepairPDF />} />
              <Route path="unlock" element={<UnlockPDF />} />
              <Route path="sign" element={<SignPDF />} />
              <Route path="flatten" element={<FlattenPDF />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}
