import { pdfjs } from 'react-pdf';

// Use CDN legacy build - includes JPEG2000 (OpenJPEG) support
// Version 4.4.168 matches react-pdf@9.1.1
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@4.4.168/legacy/build/pdf.worker.min.mjs`;
