#!/bin/bash
# Copy PDF.js worker to public folder for static serving
cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/ 2>/dev/null || \
cp node_modules/pdfjs-dist/build/pdf.worker.mjs public/pdf.worker.min.mjs 2>/dev/null || \
cp node_modules/pdfjs-dist/build/pdf.worker.js public/pdf.worker.min.mjs 2>/dev/null || \
echo "Warning: Could not find PDF.js worker file"
