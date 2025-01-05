"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Download, Github, BarChart2, MinusCircle, PlusCircle, Activity, ChevronDown, Sun, Moon } from "lucide-react";
import html2canvas from "html2canvas";
import AceEditor from "react-ace";
import { validateCodeInput, parseCodeChanges, getTokenType } from "@/lib/utils";
import { analyzeCodeSegment, getComplexityColor } from "@/lib/analysis";
import { Alert } from "@/components/ui/alert";
import { TimelineControls } from "@/components/ui/timeline-controls";
import { FilterDialog } from "@/components/ui/filter-dialog";
import { MiniMap } from "@/components/ui/mini-map";
import { FileUpload } from "@/components/ui/file-upload";
import { DiffModal } from "@/components/ui/diff-modal";
import jsPDF from 'jspdf';

import "ace-builds/src-noconflict/mode-dart";
import "ace-builds/src-noconflict/theme-dracula";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/ext-language_tools";

const CodeTimeline = () => {
  // Load initial state from localStorage
  const loadFromStorage = (key, defaultValue) => {
    if (typeof window === 'undefined') return defaultValue;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  };

  const [darkMode, setDarkMode] = useState(() => loadFromStorage('darkMode', true));
  const [codeInput, setCodeInput] = useState("");
  const [timelineData, setTimelineData] = useState(() => loadFromStorage('timelineData', []));
  const [error, setError] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showComplexity, setShowComplexity] = useState(false);
  const [filters, setFilters] = useState({
    keyword: true,
    class: true,
    function: true,
    variable: true,
    operator: true,
    string: true,
    number: true,
    boolean: true,
    comment: true,
    decorator: true,
    bracket: true,
    punctuation: true,
  });
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });
  const [tooltipPosition, setTooltipPosition] = useState({ top: true });
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);

  const timelineRef = useRef(null);
  const timelineContainerRef = useRef(null);
  const tooltipRef = useRef(null);

  // Theme configurations
  const themes = {
    dark: {
      name: 'Dark',
      background: '#1a1b26',
      surface: '#24283b',
      border: '#414868',
      text: {
        primary: '#c0caf5',
        secondary: '#a9b1d6',
        muted: '#565f89'
      },
      syntax: {
        keyword: '#ff7b72',
        class: '#7ee787',
        function: '#d2a8ff',
        variable: '#79c0ff',
        operator: '#ffb757',
        string: '#a5d6ff',
        number: '#ffa657',
        boolean: '#ff7b72',
        comment: '#8b949e',
        decorator: '#ffa657',
        bracket: '#8b949e',
        punctuation: '#8b949e'
      },
      complexity: {
        low: '#4ade80',
        medium: '#facc15',
        high: '#fb923c',
        veryHigh: '#f87171',
        extreme: '#ef4444'
      },
      accent: '#7aa2f7',
      hover: 'rgba(122, 162, 247, 0.1)',
      shadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
    },
    light: {
      name: 'Light',
      background: '#ffffff',
      surface: '#f8fafc',
      border: '#e2e8f0',
      text: {
        primary: '#1e293b',
        secondary: '#475569',
        muted: '#94a3b8'
      },
      syntax: {
        keyword: '#d32f2f',
        class: '#2e7d32',
        function: '#6200ea',
        variable: '#0277bd',
        operator: '#f57c00',
        string: '#0277bd',
        number: '#c62828',
        boolean: '#d32f2f',
        comment: '#757575',
        decorator: '#f57c00',
        bracket: '#546e7a',
        punctuation: '#546e7a'
      },
      complexity: {
        low: '#4ade80',
        medium: '#facc15',
        high: '#fb923c',
        veryHigh: '#f87171',
        extreme: '#ef4444'
      },
      accent: '#2563eb',
      hover: 'rgba(37, 99, 235, 0.1)',
      shadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    }
  };

  // Custom theme hook
  const useTheme = (darkMode) => {
    const theme = darkMode ? themes.dark : themes.light;
    
    return {
      ...theme,
      // Helper functions
      getElementColor: (type) => theme.syntax[type] || theme.text.primary,
      getComplexityColor: (complexity) => {
        if (complexity <= 2) return theme.complexity.low;
        if (complexity <= 4) return theme.complexity.medium;
        if (complexity <= 6) return theme.complexity.high;
        if (complexity <= 8) return theme.complexity.veryHigh;
        return theme.complexity.extreme;
      }
    };
  };

  const theme = useTheme(darkMode);

  const elementTypes = {
    keyword: theme.syntax.keyword,
    class: theme.syntax.class,
    function: theme.syntax.function,
    variable: theme.syntax.variable,
    operator: theme.syntax.operator,
    string: theme.syntax.string,
    number: theme.syntax.number,
    boolean: theme.syntax.boolean,
    comment: theme.syntax.comment,
    decorator: theme.syntax.decorator,
    bracket: theme.syntax.bracket,
    punctuation: theme.syntax.punctuation,
    default: theme.text.primary,
    space: 'transparent'
  };

  const getSegmentHeight = (complexity) => {
    // Scale height based on complexity
    const baseHeight = 16;
    return Math.min(baseHeight + (complexity * 2), 40);
  };

  const getSegmentColor = (segment, analysis) => {
    if (segment.color === 'transparent') return 'transparent';
    
    if (showComplexity) {
      return theme.getComplexityColor(analysis.complexity);
    }
    return segment.color;
  };

  const getSegmentOpacity = (analysis) => {
    if (showComplexity) {
      // Scale opacity with complexity
      return Math.min(0.4 + (analysis.complexity * 0.1), 1);
    }
    return 1;
  };

  const handleCodeInput = (value) => {
    setCodeInput(value);
    setError(null);
    try {
      validateCodeInput(value);
      const lines = parseCodeChanges(value);
      const newTimelineData = lines.map((line, index) => {
        const analysis = analyzeCodeSegment(line);
        return {
          id: index + 1,
          complexity: analysis.complexity,
          segments: line.split(/(\s+|[{}()[\],;.])/)
            .map(token => {
              if (!token) return null;
              
              if (token.trim() === "") {
                return {
                  text: token,
                  color: "transparent",
                  width: token.length * 8,
                };
              }

              const type = getTokenType(token);
              return {
                text: token,
                type,
                color: elementTypes[type] || elementTypes.default,
                width: token.length * 8,
              };
            })
            .filter(Boolean)
        };
      });
      setTimelineData(newTimelineData);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.2, 2));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const filteredTimelineData = useMemo(() => {
    return timelineData
      .map(row => ({
        ...row,
        segments: row.segments.filter(segment => {
          const type = segment.type;
          return filters[type] && 
            (!searchTerm || segment.text.toLowerCase().includes(searchTerm.toLowerCase()));
        })
      }))
      .filter(row => row.segments.length > 0);
  }, [timelineData, filters, searchTerm]);

  const exportFormats = [
    { 
      id: 'png-hq', 
      label: 'PNG (High Quality)', 
      handler: () => exportAsPNG({ scale: 3, quality: 1 }) 
    },
    { 
      id: 'png', 
      label: 'PNG (Standard)', 
      handler: () => exportAsPNG({ scale: 2, quality: 0.9 }) 
    },
    { 
      id: 'jpeg-hq', 
      label: 'JPEG (High Quality)', 
      handler: () => exportAsJPEG({ quality: 1, scale: 3 }) 
    },
    { 
      id: 'jpeg', 
      label: 'JPEG (Compressed)', 
      handler: () => exportAsJPEG({ quality: 0.8, scale: 2 }) 
    },
    { 
      id: 'pdf-hq', 
      label: 'PDF (High Quality)', 
      handler: () => exportAsPDF({ scale: 3, compress: false }) 
    },
    { 
      id: 'pdf', 
      label: 'PDF (Compressed)', 
      handler: () => exportAsPDF({ scale: 2, compress: true }) 
    },
    { 
      id: 'svg', 
      label: 'SVG Vector', 
      handler: exportAsSVG 
    },
    { 
      id: 'html', 
      label: 'HTML Document', 
      handler: exportAsHTML 
    },
    { 
      id: 'json', 
      label: 'JSON Data', 
      handler: exportAsJSON 
    }
  ];

  async function exportAsPNG({ scale = 2, quality = 0.9 }) {
    try {
      const element = timelineRef.current;
      if (!element) return;

      const canvas = await html2canvas(element, {
        backgroundColor: theme.background,
        scale: scale,
        useCORS: true,
        logging: false,
        allowTaint: true,
        imageTimeout: 0,
        removeContainer: true
      });
      
      const dataUrl = canvas.toDataURL('image/png', quality);
      const link = document.createElement('a');
      link.download = `code-timeline-${scale}x.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error exporting as PNG:', error);
    }
  }

  async function exportAsJPEG({ quality = 0.9, scale = 2 }) {
    try {
      const element = timelineRef.current;
      if (!element) return;

      const canvas = await html2canvas(element, {
        backgroundColor: theme.background,
        scale: scale,
        useCORS: true,
        logging: false,
        allowTaint: true,
        imageTimeout: 0
      });
      
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      const link = document.createElement('a');
      link.download = `code-timeline-${quality * 100}q.jpg`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error exporting as JPEG:', error);
    }
  }

  async function exportAsPDF({ scale = 2, compress = true }) {
    try {
      const element = timelineRef.current;
      if (!element) return;

      const canvas = await html2canvas(element, {
        backgroundColor: theme.background,
        scale: scale,
        useCORS: true,
        logging: false,
        allowTaint: true
      });
      
      const imgData = canvas.toDataURL('image/jpeg', compress ? 0.8 : 1);
      
      // Calculate optimal page size
      const pageWidth = canvas.width;
      const pageHeight = canvas.height;
      const pdf = new jsPDF({
        orientation: pageWidth > pageHeight ? 'landscape' : 'portrait',
        unit: 'px',
        format: [pageWidth, pageHeight],
        compress: compress
      });
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight);
      pdf.save(`code-timeline-${compress ? 'compressed' : 'hq'}.pdf`);
    } catch (error) {
      console.error('Error exporting as PDF:', error);
    }
  }

  async function exportAsHTML() {
    try {
      const element = timelineRef.current;
      if (!element) return;
      
      // Create a full HTML document with styles
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Code Timeline Export</title>
          <style>
            ${Array.from(document.styleSheets)
              .map(sheet => {
                try {
                  return Array.from(sheet.cssRules)
                    .map(rule => rule.cssText)
                    .join('\n');
                } catch (e) {
                  return '';
                }
              })
              .join('\n')}
          </style>
        </head>
        <body style="background: ${theme.background}">
          ${element.outerHTML}
        </body>
        </html>
      `;
      
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = 'code-timeline.html';
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting as HTML:', error);
    }
  }

  async function exportAsJSON() {
    try {
      const data = {
        timeline: timelineData,
        metadata: {
          darkMode,
          filters,
          exportDate: new Date().toISOString(),
          version: '1.0'
        }
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = 'code-timeline.json';
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting as JSON:', error);
    }
  }

  async function exportAsSVG() {
    try {
      const element = timelineRef.current;
      if (!element) return;
      
      const clone = element.cloneNode(true);
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(clone);
      
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.download = 'code-timeline.svg';
      link.href = url;
      link.click();
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting as SVG:', error);
    }
  }

  const handleScroll = () => {
    if (!timelineContainerRef.current) return;
    
    const container = timelineContainerRef.current;
    const { scrollTop, clientHeight, scrollHeight } = container;
    
    // Calculate visible lines based on scroll position and container height
    const totalLines = timelineData.length;
    const lineHeight = scrollHeight / totalLines;
    
    const start = Math.floor(scrollTop / lineHeight);
    const end = Math.min(Math.ceil((scrollTop + clientHeight) / lineHeight), totalLines);
    
    setVisibleRange({ start, end });
  };

  const handleTooltipPosition = (e, tooltip) => {
    const rect = tooltip.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const spaceAbove = rect.top;
    const spaceBelow = viewportHeight - rect.bottom;
    
    setTooltipPosition({ top: spaceBelow < 100 && spaceAbove > spaceBelow });
  };

  useEffect(() => {
    const container = timelineContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      // Initial calculation
      handleScroll();
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [timelineData.length]);

  useEffect(() => {
    handleScroll();
  }, [zoom]);

  // Save to localStorage when state changes
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('timelineData', JSON.stringify(timelineData));
  }, [timelineData]);

  // Clear all timeline data and code input
  const handleClearTimeline = () => {
    if (window.confirm('Are you sure you want to clear all code snippets and editor content?')) {
      setTimelineData([]);
      setCodeInput('');
      setError(null);
      localStorage.removeItem('timelineData');
      localStorage.removeItem('codeInput');
    }
  };

  return (
    <div className="p-6 h-screen" style={{ background: theme.background }}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold" style={{ color: theme.text.primary }}>
          Code Timeline Visualizer
        </h2>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg transition-colors"
            style={{
              background: theme.surface,
              color: theme.text.primary,
              border: `1px solid ${theme.border}`,
              boxShadow: theme.shadow
            }}
          >
            {darkMode ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          <a
            href="https://github.com/elyesbenamor/code_timeline_preview"
            target="_blank"
            rel="noopener noreferrer"
            className={`p-2 rounded-lg transition-colors ${
              darkMode
                ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
                : "bg-gray-200 hover:bg-gray-300 text-gray-700"
            }`}
          >
            <Github className="w-4 h-4" />
          </a>

          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-1 p-2 rounded-lg transition-colors"
              style={{
                background: theme.surface,
                color: theme.text.primary,
                border: `1px solid ${theme.border}`,
                boxShadow: theme.shadow
              }}
            >
              <Download size={20} />
              <ChevronDown size={16} />
            </button>
            
            {showExportMenu && (
              <div 
                className="absolute right-0 mt-2 py-2 w-48 rounded-lg"
                style={{
                  background: theme.surface,
                  border: `1px solid ${theme.border}`,
                  boxShadow: theme.shadow,
                  zIndex: 9999
                }}
              >
                {exportFormats.map(format => (
                  <button
                    key={format.id}
                    onClick={() => {
                      format.handler();
                      setShowExportMenu(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm ${
                      darkMode
                        ? "hover:bg-gray-700 text-gray-300"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    {format.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <FileUpload 
            onFileContent={handleCodeInput}
            className={`${
              darkMode
                ? "bg-gray-700 text-gray-200"
                : "bg-gray-200 text-gray-700"
            }`}
          />
        </div>
      </div>

      {error && (
        <Alert 
          type="error" 
          message={error} 
          onClose={() => setError(null)}
          className="mb-4"
        />
      )}

      <div className="flex gap-6 h-[calc(100vh-8rem)]">
        <div className="flex flex-col w-1/2">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full px-4 py-2 rounded border ${
                  darkMode 
                    ? "bg-gray-800 border-gray-700 text-gray-200" 
                    : "bg-white border-gray-300"
                }`}
              />
            </div>
            <button
              onClick={() => setIsFilterOpen(true)}
              className={`p-2 rounded ${
                darkMode 
                  ? "bg-gray-800 hover:bg-gray-700 border border-gray-700" 
                  : "bg-white hover:bg-gray-100 border border-gray-300"
              }`}
              title="Filter code elements"
            >
              <BarChart2 className="w-5 h-5" />
            </button>
            <button
              onClick={handleClearTimeline}
              className={`p-2 rounded transition-colors ${
                darkMode 
                  ? "bg-red-600 hover:bg-red-700 text-white" 
                  : "bg-red-500 hover:bg-red-600 text-white"
              }`}
              title="Clear all code snippets"
            >
              <MinusCircle className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1">
            <AceEditor
              placeholder="Paste your code here..."
              theme={darkMode ? "dracula" : "github"}
              value={codeInput}
              mode="javascript"
              width="100%"
              height="100%"
              onChange={handleCodeInput}
              className={`rounded-lg shadow-sm h-full ${
                darkMode 
                  ? "border border-gray-700" 
                  : "border border-gray-200"
              }`}
              setOptions={{
                showLineNumbers: true,
                showGutter: true,
                fontSize: 14,
                tabSize: 2,
                useWorker: false
              }}
            />
          </div>
        </div>

        <div className="flex flex-col w-1/2">
          <div className={`flex items-center justify-between p-3 rounded-lg mb-4 ${
            darkMode
              ? "bg-gray-800 border border-gray-700"
              : "bg-white border border-gray-200 shadow-sm"
          }`}>
            <div className="flex items-center gap-2">
              <button
                onClick={handleZoomOut}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode
                    ? "hover:bg-gray-700 text-gray-300"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
                disabled={zoom <= 0.5}
              >
                <MinusCircle className="w-4 h-4" />
              </button>
              <span className={darkMode ? "text-gray-300" : "text-gray-700"}>
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode
                    ? "hover:bg-gray-700 text-gray-300"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
                disabled={zoom >= 2}
              >
                <PlusCircle className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowComplexity(!showComplexity)}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode
                    ? `${showComplexity ? "bg-gray-700" : ""} hover:bg-gray-700 text-gray-300`
                    : `${showComplexity ? "bg-gray-100" : ""} hover:bg-gray-100 text-gray-700`
                }`}
                title={showComplexity ? "Show syntax highlighting" : "Show complexity"}
              >
                <Activity className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex gap-4 flex-1 min-h-0">
            <div
              ref={timelineContainerRef}
              className={`flex-1 overflow-y-auto overflow-x-hidden rounded-lg border ${
                darkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200 shadow-sm"
              }`}
              style={{ position: 'relative' }}
            >
              <div 
                ref={timelineRef}
                className="p-4 space-y-1" 
                style={{ 
                  transform: `scale(${zoom})`, 
                  transformOrigin: 'top left',
                  minHeight: '100%',
                  position: 'relative'
                }}
              >
                {filteredTimelineData.map((row) => {
                  const analysis = analyzeCodeSegment(row.segments.map(s => s.text).join(''));
                  return (
                    <div key={row.id} className="flex items-center" style={{ position: 'relative' }}>
                      <span
                        className={`w-8 text-sm font-mono select-none ${
                          darkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {row.id}
                      </span>
                      <div className="flex items-center flex-1" style={{ position: 'relative' }}>
                        {row.segments.map((segment, segIndex) => (
                          <div
                            key={segIndex}
                            className="relative"
                          >
                            <div
                              className="rounded mx-[1px] hover:opacity-80"
                              style={{
                                backgroundColor: getSegmentColor(segment, analysis),
                                opacity: getSegmentOpacity(analysis),
                                height: `${getSegmentHeight(analysis.complexity)}px`,
                                width: `${segment.width}px`,
                                cursor: 'pointer'
                              }}
                              onClick={() => {
                                setSelectedSegment({
                                  ...segment,
                                  complexity: analysis.complexity,
                                  codeSmells: analysis.codeSmells,
                                  line: row.id,
                                  position: segIndex + 1,
                                  context: timelineData[row.id - 2]?.segments.map(s => s.text).join('') + '\n' +
                                          timelineData[row.id - 1]?.segments.map(s => s.text).join('') + '\n' +
                                          timelineData[row.id]?.segments.map(s => s.text).join('') + '\n' +
                                          timelineData[row.id + 1]?.segments.map(s => s.text).join('') + '\n' +
                                          timelineData[row.id + 2]?.segments.map(s => s.text).join('')
                                });
                                setIsDiffModalOpen(true);
                              }}
                              onMouseEnter={(e) => {
                                const tooltip = e.currentTarget.nextElementSibling;
                                if (tooltip) {
                                  tooltip.style.display = 'block';
                                }
                              }}
                              onMouseLeave={(e) => {
                                const tooltip = e.currentTarget.nextElementSibling;
                                if (tooltip) {
                                  tooltip.style.display = 'none';
                                }
                              }}
                            />
                            <div 
                              className={`absolute hidden p-2 rounded-lg shadow-lg ${
                                darkMode 
                                  ? "bg-gray-800 text-gray-200 border border-gray-700" 
                                  : "bg-white text-gray-700 border border-gray-200"
                              }`}
                              style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                width: '200px',
                                zIndex: 9999,
                                pointerEvents: 'none'
                              }}
                            >
                              <div className="text-sm font-semibold mb-1">{segment.text}</div>
                              <div className="text-xs space-y-1">
                                <div>Type: {segment.type}</div>
                                <div>Complexity: {analysis.complexity.toFixed(1)}</div>
                                {analysis.codeSmells?.length > 0 && (
                                  <div className={darkMode ? "text-yellow-400" : "text-yellow-600"}>
                                    Code Smells:
                                    <ul className="ml-2 mt-1">
                                      {analysis.codeSmells.map((smell, i) => (
                                        <li key={i}>• {smell.message}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <MiniMap
              timelineData={timelineData}
              visibleRange={visibleRange}
              onNavigate={(position) => {
                if (timelineContainerRef.current) {
                  const scrollHeight = timelineContainerRef.current.scrollHeight;
                  const scrollPosition = (position / timelineData.length) * scrollHeight;
                  timelineContainerRef.current.scrollTop = scrollPosition;
                }
              }}
              darkMode={darkMode}
            />
          </div>

          <div className={`mt-4 p-4 rounded-lg border ${
            darkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border border-gray-200 shadow-sm"
          }`}>
            <div className="flex flex-wrap gap-3 text-xs">
              {showComplexity ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 mr-1 rounded shadow-sm"
                      style={{ backgroundColor: theme.complexity.low }}
                    />
                    <span className={darkMode ? "text-gray-300" : "text-gray-700"}>
                      Low Complexity
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 mr-1 rounded shadow-sm"
                      style={{ backgroundColor: theme.complexity.medium }}
                    />
                    <span className={darkMode ? "text-gray-300" : "text-gray-700"}>
                      Medium Complexity
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 mr-1 rounded shadow-sm"
                      style={{ backgroundColor: theme.complexity.high }}
                    />
                    <span className={darkMode ? "text-gray-300" : "text-gray-700"}>
                      High Complexity
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 mr-1 rounded shadow-sm"
                      style={{ backgroundColor: theme.complexity.veryHigh }}
                    />
                    <span className={darkMode ? "text-gray-300" : "text-gray-700"}>
                      Very High Complexity
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 mr-1 rounded shadow-sm"
                      style={{ backgroundColor: theme.complexity.extreme }}
                    />
                    <span className={darkMode ? "text-gray-300" : "text-gray-700"}>
                      Extreme Complexity
                    </span>
                  </div>
                </div>
              ) : (
                Object.entries(elementTypes).map(
                  ([key, color]) =>
                    key !== "space" &&
                    key !== "default" && (
                      <div key={key} className="flex items-center">
                        <div
                          className="w-3 h-3 mr-1 rounded shadow-sm"
                          style={{ backgroundColor: color }}
                        />
                        <span
                          className={darkMode ? "text-gray-300" : "text-gray-700"}
                        >
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </span>
                      </div>
                    )
                )
              )}
            </div>
          </div>
        </div>
      </div>

      <FilterDialog
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={handleFilterChange}
        filters={filters}
        darkMode={darkMode}
      />
      <DiffModal
        isOpen={isDiffModalOpen}
        onClose={() => setIsDiffModalOpen(false)}
        segment={selectedSegment}
        darkMode={darkMode}
      />
    </div>
  );
};

export default CodeTimeline;
