#!/bin/bash
# Copy PDF.js worker to public folder for static serving
# Check both local and root node_modules (for npm workspaces)
cp node_modules/pdfjs-dist/build/pdf.worker.min.js public/ 2>/dev/null || \
cp ../node_modules/pdfjs-dist/build/pdf.worker.min.js public/ 2>/dev/null || \
echo "Warning: Could not find PDF.js worker file"

