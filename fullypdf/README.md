# FullyPDF

A high-performance, AI-powered PDF toolkit for merging, splitting, converting, and enhancing documents — all in one place.

## Features

- **Merge & Split** — Combine multiple PDFs into one, or split a document into individual pages/ranges
- **Extract Pages** — Pull specific pages out of a PDF into a new file
- **Rotate & Organize** — Rotate pages and reorder documents with drag-and-drop
- **OCR** — Extract text from scanned documents using Tesseract.js
- **Word ⇄ PDF** — Convert between `.docx` and PDF formats
- **Image to PDF** — Turn images into PDF documents
- **Watermarking** — Add custom watermarks to documents
- **E-signatures** — Sign documents directly in the browser
- **AI Tools** — Summarize, translate, and get plain-language explanations of PDF content, powered by Google Gemini
- **Work History** — Signed-in users get a synced history of recent operations via Firestore

## Tech Stack

**Frontend**
- React 19 + TypeScript
- Vite 6
- Tailwind CSS 4
- Zustand for state management
- `@dnd-kit` for drag-and-drop
- `react-router-dom` for routing

**PDF & Document Processing**
- `pdf-lib` (with encryption support) for PDF generation/editing
- `pdfjs-dist` for rendering
- `jspdf` + `html2pdf.js` / `html2canvas` for HTML-to-PDF export
- `tesseract.js` for OCR
- `mammoth` for Word document conversion
- `jszip` for archive handling

**Backend**
- Express server (`server.ts`) serving the app and API routes
- Google Gemini API (`@google/genai`) for AI-powered chat, summarization, translation, and explanations

**Auth & Data**
- Firebase Authentication
- Firestore (with locked-down security rules — see `firestore.rules`)

## Project Structure

```
.
├── src/                        # Application source (pages, components, context, lib)
├── server.ts                   # Express server + Gemini API routes
├── index.html                  # App entry HTML
├── vite.config.ts              # Vite build configuration
├── tsconfig.json               # TypeScript configuration
├── firestore.rules             # Firestore security rules
├── firebase-applet-config.json # Firebase client configuration
├── firebase-blueprint.json     # Firestore schema reference
├── add-history.cjs             # Codegen script: wires up work-history tracking across tool pages
└── package.json
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- A [Google Gemini API key](https://ai.google.dev/)
- A [Firebase project](https://console.firebase.google.com/) (for Auth + Firestore, optional for local PDF-only usage)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
   cd YOUR-REPO-NAME
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Copy the example env file and fill in your own values:
   ```bash
   cp .env.example .env
   ```
   Then set `GEMINI_API_KEY` in `.env` to your Gemini API key.

4. **Run the development server**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`.

### Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Build the client and bundle the server for production |
| `npm start` | Run the production build |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Type-check the project with `tsc` |
| `npm run clean` | Remove build artifacts |

## Deployment

Build the app and server bundle:

```bash
npm run build
```

This produces:
- A static client build (via Vite)
- A bundled server at `dist/server.cjs`

Run the production server with:

```bash
npm start
```

Set `NODE_ENV=production` and provide `GEMINI_API_KEY` in your hosting environment's configuration.

## Firebase Setup

This project uses Firebase for authentication and to store per-user work history.

1. Create a Firebase project and enable **Authentication** and **Firestore**.
2. Deploy the included security rules:
   ```bash
   firebase deploy --only firestore:rules
   ```
3. Update `firebase-applet-config.json` with your own project's configuration if you're not using the one included.

The Firestore rules enforce a default-deny policy, requiring signed-in and verified users, with strict field validation on writes (see `firestore.rules`).
