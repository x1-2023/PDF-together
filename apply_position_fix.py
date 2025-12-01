#!/usr/bin/env python3
"""
Safe script to apply per-user position persistence fixes
with automatic git stash backup
"""

import os
import subprocess
import sys
from pathlib import Path

# Color codes for terminal output
GREEN = '\033[92m'
YELLOW = '\033[93m'
RED = '\033[91m'
RESET = '\033[0m'
BLUE = '\033[94m'

def run_command(cmd, cwd=None):
    """Run a shell command and return output"""
    try:
        result = subprocess.run(
            cmd,
            shell=True,
            cwd=cwd,
            capture_output=True,
            text=True,
            check=True
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        print(f"{RED}Error running command: {cmd}{RESET}")
        print(f"{RED}{e.stderr}{RESET}")
        return None

def backup_with_git_stash(repo_path):
    """Create a git stash backup"""
    print(f"{BLUE}📦 Creating git stash backup...{RESET}")
    stash_msg = "Backup before applying position persistence fix"
    result = run_command(f'git stash push -m "{stash_msg}"', cwd=repo_path)
    if result is not None:
        print(f"{GREEN}✅ Backup created successfully{RESET}")
        return True
    return False

def apply_reader_changes(file_path):
    """Apply changes to Reader.tsx"""
    print(f"{BLUE}📝 Applying changes to Reader.tsx...{RESET}")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Step 1: Add useMemo to imports
    content = content.replace(
        'import { useEffect, useState } from "react";',
        'import { useEffect, useState, useMemo } from "react";'
    )
    
    # Step 2: Add savedPage state
    content = content.replace(
        '  const [jumpToPage, setJumpToPage] = useState("");',
        '  const [jumpToPage, setJumpToPage] = useState("");\n  const [savedPage, setSavedPage] = useState<number | null>(null);'
    )
    
    # Step 3: Replace userId and WebSocket hook
    old_websocket = '''  // WebSocket
  const { sendAnnotation, sendMessage, messages } = useWebSocket(id || 'default', 'user-' + Math.floor(Math.random() * 1000), 'Guest');'''
    
    new_websocket = '''
  // Generate stable userId (persisted in localStorage)
  const userId = useMemo(() => {
    const stored = localStorage.getItem('pdf-reader-userId');
    if (stored) {
      return stored;
    }
    const newUserId = 'user-' + Math.floor(Math.random() * 10000);
    localStorage.setItem('pdf-reader-userId', newUserId);
    return newUserId;
  }, []);

  // WebSocket
  const { sendAnnotation, sendMessage, messages, savePosition, loadPosition, isConnected } = useWebSocket(id || 'default', userId, 'Guest');'''
    
    content = content.replace(old_websocket, new_websocket)
    
    # Step 4: Add position management useEffects after handleJumpToPage
    position_effects = '''
  // Load user's saved position when PDF opens AND WebSocket is connected
  useEffect(() => {
    if (id && loadPosition && isConnected) {
      console.log('🔄 WebSocket connected, loading position for PDF:', id);
      loadPosition(id);
    }
  }, [id, loadPosition, isConnected]);

  // Listen for position loaded from WebSocket
  useEffect(() => {
    // This will be set by useWebSocket when position_loaded message is received
    // We need to update savedPage when currentPage changes from position_loaded
    if (currentPage > 1 && savedPage === null) {
      setSavedPage(currentPage);
    }
  }, [currentPage, savedPage]);

  // Auto-save position on page change (debounced)
  useEffect(() => {
    if (!id || !currentPage || !savePosition) return;
    
    // Debounce: save after 2 seconds of no page change
    const timer = setTimeout(() => {
      savePosition(id, currentPage, 0);
    }, 2000);

    return () => clearTimeout(timer);
  }, [id, currentPage, savePosition]);
'''
    
    # Find the position after handleJumpToPage function
    marker = '''  };

  const tools = ['''
    
    content = content.replace(marker, f'''  }};
{position_effects}
  const tools = [''')
    
    # Step 5: Update VirtualizedPDFCanvas prop
    content = content.replace(
        '<VirtualizedPDFCanvas onAnnotationCreate={sendAnnotation} />',
        '<VirtualizedPDFCanvas onAnnotationCreate={sendAnnotation} initialPage={savedPage || undefined} />'
    )
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"{GREEN}✅ Reader.tsx updated successfully{RESET}")

def apply_canvas_changes(file_path):
    """Apply changes to VirtualizedPDFCanvas.tsx"""
    print(f"{BLUE}📝 Applying changes to VirtualizedPDFCanvas.tsx...{RESET}")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Step 1: Update interface
    old_interface = '''interface VirtualizedPDFCanvasProps {
    userId?: string;
    onAnnotationCreate?: (annotation: Annotation) => void;
}'''
    
    new_interface = '''interface VirtualizedPDFCanvasProps {
    userId?: string;
    onAnnotationCreate?: (annotation: Annotation) => void;
    initialPage?: number;
}'''
    
    content = content.replace(old_interface, new_interface)
    
    # Step 2: Update component signature
    content = content.replace(
        'export const VirtualizedPDFCanvas: React.FC<VirtualizedPDFCanvasProps> = ({ userId, onAnnotationCreate }) => {',
        'export const VirtualizedPDFCanvas: React.FC<VirtualizedPDFCanvasProps> = ({ userId, onAnnotationCreate, initialPage }) => {'
    )
    
    # Step 3: Add hasScrolledToInitial ref
    content = content.replace(
        '    const containerRef = useRef<HTMLDivElement>(null);',
        '    const containerRef = useRef<HTMLDivElement>(null);\n    const hasScrolledToInitial = useRef(false);'
    )
    
    # Step 4: Update handleDocumentLoadSuccess
    old_handler = '''    const handleDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
        console.log(`PDF loaded: ${numPages} pages`);
    };'''
    
    new_handler = '''    const handleDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
        console.log(`PDF loaded: ${numPages} pages`);
        
        // Scroll to initial page if provided and not already scrolled
        if (initialPage && initialPage > 1 && !hasScrolledToInitial.current && virtuosoRef.current) {
            console.log(`📜 Scrolling to initial page: ${initialPage}`);
            setTimeout(() => {
                virtuosoRef.current?.scrollToIndex({
                    index: initialPage - 1,
                    align: 'start',
                    behavior: 'auto'
                });
                hasScrolledToInitial.current = true;
            }, 100); // Small delay to ensure Virtuoso is ready
        }
    };'''
    
    content = content.replace(old_handler, new_handler)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"{GREEN}✅ VirtualizedPDFCanvas.tsx updated successfully{RESET}")

def main():
    print(f"{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}  Per-User Position Persistence Fix - Safe Installer{RESET}")
    print(f"{BLUE}{'='*60}{RESET}\n")
    
    # Get repo path
    repo_path = Path(__file__).parent
    print(f"{YELLOW}📂 Working directory: {repo_path}{RESET}\n")
    
    # File paths
    reader_path = repo_path / "frontend" / "src" / "pages" / "Reader.tsx"
    canvas_path = repo_path / "frontend" / "src" / "components" / "reader" / "VirtualizedPDFCanvas.tsx"
    
    # Check if files exist
    if not reader_path.exists():
        print(f"{RED}❌ Reader.tsx not found at: {reader_path}{RESET}")
        sys.exit(1)
    
    if not canvas_path.exists():
        print(f"{RED}❌ VirtualizedPDFCanvas.tsx not found at: {canvas_path}{RESET}")
        sys.exit(1)
    
    print(f"{GREEN}✅ All files found{RESET}\n")
    
    # Create git stash backup
    if not backup_with_git_stash(repo_path):
        print(f"{YELLOW}⚠️  Warning: Could not create git stash backup{RESET}")
        response = input(f"{YELLOW}Continue anyway? (y/N): {RESET}")
        if response.lower() != 'y':
            print(f"{RED}Aborted by user{RESET}")
            sys.exit(1)
    
    print()
    
    try:
        # Apply changes
        apply_reader_changes(reader_path)
        apply_canvas_changes(canvas_path)
        
        print(f"\n{GREEN}{'='*60}{RESET}")
        print(f"{GREEN}✅ All changes applied successfully!{RESET}")
        print(f"{GREEN}{'='*60}{RESET}\n")
        
        print(f"{BLUE}📋 Next steps:{RESET}")
        print(f"  1. Test the application")
        print(f"  2. If everything works: {GREEN}git add . && git commit{RESET}")
        print(f"  3. If something breaks: {YELLOW}git stash pop{RESET} to restore\n")
        
    except Exception as e:
        print(f"\n{RED}{'='*60}{RESET}")
        print(f"{RED}❌ Error occurred: {e}{RESET}")
        print(f"{RED}{'='*60}{RESET}\n")
        print(f"{YELLOW}To restore your files, run: git stash pop{RESET}\n")
        sys.exit(1)

if __name__ == "__main__":
    main()
