'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { X, Search, Download, Copy, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogViewerProps {
  filename: string;
  content: string;
  onClose: () => void;
}

export function LogViewer({ filename, content, onClose }: LogViewerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMatch, setCurrentMatch] = useState(0);
  const [copied, setCopied] = useState(false);

  // Split content into lines
  const lines = useMemo(() => {
    return content.split('\n');
  }, [content]);

  // Search functionality
  const matches = useMemo(() => {
    if (!searchQuery) return [];
    const query = searchQuery.toLowerCase();
    const matches: number[] = [];
    lines.forEach((line, index) => {
      if (line.toLowerCase().includes(query)) {
        matches.push(index);
      }
    });
    return matches;
  }, [lines, searchQuery]);

  // Reset current match when search query changes
  useEffect(() => {
    setCurrentMatch(0);
  }, [searchQuery]);

  // Navigate to next/previous match
  const goToNextMatch = useCallback(() => {
    if (matches.length === 0) return;
    setCurrentMatch((prev) => (prev + 1) % matches.length);
  }, [matches.length]);

  const goToPrevMatch = useCallback(() => {
    if (matches.length === 0) return;
    setCurrentMatch((prev) => (prev - 1 + matches.length) % matches.length);
  }, [matches.length]);

  // Handle copy
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [content]);

  // Handle download
  const handleDownload = useCallback(() => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, [content, filename]);

  // Highlight search matches
  const highlightLine = useCallback((line: string, index: number) => {
    if (!searchQuery || !matches.includes(index)) {
      return line;
    }

    const regex = new RegExp(`(${searchQuery})`, 'gi');
    const parts = line.split(regex);

    return (
      <>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 text-black dark:text-white rounded px-0.5">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  }, [searchQuery, matches]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl h-[90vh] flex flex-col">
        <CardHeader className="border-b shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="truncate">{filename}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {lines.length} lines
                {matches.length > 0 && ` · Found ${matches.length} matches`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-4 py-1.5 border rounded-md bg-background text-sm w-48 focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {matches.length > 0 && (
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1 text-xs text-muted-foreground">
                    <button
                      onClick={goToPrevMatch}
                      className="hover:text-foreground px-1"
                    >
                      ←
                    </button>
                    <span>{currentMatch + 1}/{matches.length}</span>
                    <button
                      onClick={goToNextMatch}
                      className="hover:text-foreground px-1"
                    >
                      →
                    </button>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <Button
                onClick={handleCopy}
                variant="outline"
                size="sm"
              >
                <Copy className="h-4 w-4 mr-1" />
                {copied ? 'Copied' : 'Copy'}
              </Button>
              <Button
                onClick={handleDownload}
                variant="outline"
                size="sm"
              >
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                size="sm"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto p-0">
          <div className="font-mono text-xs">
            {lines.map((line, index) => {
              const lineNum = index + 1;
              const isMatch = matches.includes(index);
              const isCurrentMatch = matches[currentMatch] === index;

              return (
                <div
                  key={index}
                  className={cn(
                    'flex hover:bg-muted/50',
                    isCurrentMatch && 'bg-yellow-100 dark:bg-yellow-900/30',
                    isMatch && !isCurrentMatch && 'bg-yellow-50 dark:bg-yellow-900/10'
                  )}
                >
                  <span className="select-none text-muted-foreground text-right pr-4 pl-4 w-16 shrink-0 sticky left-0 bg-background">
                    {lineNum}
                  </span>
                  <span className="flex-1 break-all whitespace-pre-wrap">
                    {highlightLine(line || ' ', index)}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
