"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Download, Github, BarChart2, MinusCircle, PlusCircle, Activity, ChevronDown, Sun, Moon, History, Trash2, X, Share2, AlertTriangle } from "lucide-react";
import html2canvas from "html2canvas";
import AceEditor from "react-ace";
import { validateCodeInput, parseCodeChanges, getTokenType } from "@/lib/utils";
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

  const [mounted, setMounted] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [timelineData, setTimelineData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [showComplexity, setShowComplexity] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 0 });
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
    punctuation: true
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Initialize state from localStorage after mount
  useEffect(() => {
    setMounted(true);
    try {
      const savedDarkMode = localStorage.getItem('darkMode');
      const savedTimelineData = localStorage.getItem('timelineData');
      const savedHistory = localStorage.getItem('codeHistory');

      if (savedDarkMode !== null) {
        setDarkMode(JSON.parse(savedDarkMode));
      }
      if (savedTimelineData) {
        setTimelineData(JSON.parse(savedTimelineData));
      }
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  }, []);

  // Save state to localStorage
  useEffect(() => {
    if (!mounted) return;
    
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    localStorage.setItem('timelineData', JSON.stringify(timelineData));
    localStorage.setItem('codeHistory', JSON.stringify(history));
  }, [darkMode, timelineData, history, mounted]);

  const timelineRef = useRef(null);
  const timelineContainerRef = useRef(null);
  const tooltipRef = useRef(null);

  const theme = {
    background: darkMode ? '#1a1a1a' : '#ffffff',
    surface: darkMode ? '#2d2d2d' : '#f8f9fa',
    text: {
      primary: darkMode ? '#ffffff' : '#000000',
      secondary: darkMode ? '#a0aec0' : '#4a5568',
    },
    border: darkMode ? '#404040' : '#e2e8f0',
    accent: '#3182ce',
    severity: {
      low: '#48bb78',
      medium: '#ecc94b',
      high: '#e53e3e',
    },
    complexity: {
      low: '#48bb78',
      medium: '#ecc94b',
      high: '#e53e3e',
    }
  };

  const elementTypes = {
    keyword: '#c678dd',
    string: '#98c379',
    number: '#d19a66',
    comment: '#5c6370',
    operator: '#56b6c2',
    bracket: '#abb2bf',
    punctuation: '#abb2bf',
    variable: '#e06c75',
    function: '#61afef',
    class: '#e5c07b',
    default: darkMode ? '#abb2bf' : '#383a42',
    space: 'transparent',
  };

  const getSegmentColor = (segment, analysis) => {
    if (showComplexity) {
      const complexity = analysis.complexity || 0;
      if (complexity > 0.7) return theme.severity.high;
      if (complexity > 0.4) return theme.severity.medium;
      return theme.severity.low;
    }
    return elementTypes[segment.type] || elementTypes.default;
  };

  const getSegmentOpacity = (analysis) => {
    if (showComplexity) {
      const complexity = analysis.complexity || 0;
      return 0.3 + (complexity * 0.7);
    }
    return 1;
  };

  const getSegmentHeight = (complexity) => {
    const minHeight = 20;
    const maxHeight = 40;
    return minHeight + (complexity * (maxHeight - minHeight));
  };

  const getSegmentWidth = (text) => {
    const baseWidth = 12;
    return text.length * baseWidth;
  };

  const analyzeCodeSegment = (code) => {
    if (!code) return { complexity: 0, codeSmells: [] };

    let complexity = 0;
    const codeSmells = [];

    // Complexity factors
    const keywordComplexity = (code.match(/\b(if|else|for|while|switch|case|try|catch)\b/g) || []).length * 0.1;
    const operatorComplexity = (code.match(/[&|=!<>+\-*/%]+/g) || []).length * 0.05;
    const nestingComplexity = (code.match(/[{[(]/g) || []).length * 0.1;
    const lengthComplexity = Math.min(code.length / 100, 0.5);

    complexity = keywordComplexity + operatorComplexity + nestingComplexity + lengthComplexity;

    // Code smells detection
    if (code.length > 80) {
      codeSmells.push({ message: 'Line is too long (> 80 characters)' });
    }
    if ((code.match(/\t/g) || []).length > 0) {
      codeSmells.push({ message: 'Uses tabs instead of spaces' });
    }
    if (code.match(/console\.(log|debug|info)/)) {
      codeSmells.push({ message: 'Contains console statement' });
    }
    if (code.match(/var\s/)) {
      codeSmells.push({ message: 'Uses var instead of const/let' });
    }

    return {
      complexity: Math.min(complexity, 1),
      codeSmells
    };
  };

  const handleDelete = useCallback(() => {
    setTimelineData([]);
    setCodeInput('');
    addToHistory(codeInput, 'deleted');
  }, [codeInput]);

  const parseCodeChanges = (code) => {
    if (!code) return [];
    
    const lines = code.split('\n');
    return lines.map((line, index) => {
      const tokens = tokenizeLine(line);
      return {
        id: index + 1,
        segments: tokens.map(token => ({
          text: token.text,
          type: token.type,
          width: getSegmentWidth(token.text)
        }))
      };
    });
  };

  const tokenizeLine = (line) => {
    if (!line) return [];

    const tokens = [];
    let currentToken = '';
    let currentType = 'default';

    const addToken = (text, type) => {
      if (text) {
        tokens.push({ text, type });
      }
    };

    const isKeyword = (word) => {
      const keywords = ['function', 'const', 'let', 'var', 'if', 'else', 'return', 'for', 'while', 'class', 'import', 'export', 'default', 'try', 'catch'];
      return keywords.includes(word);
    };

    const isOperator = (char) => {
      return '+-*/%=<>!&|^~'.includes(char);
    };

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === ' ' || char === '\t') {
        addToken(currentToken, currentType);
        addToken(char, 'space');
        currentToken = '';
        currentType = 'default';
        continue;
      }

      if (char === '"' || char === "'") {
        addToken(currentToken, currentType);
        currentToken = char;
        let j = i + 1;
        while (j < line.length && line[j] !== char) {
          currentToken += line[j];
          j++;
        }
        if (j < line.length) {
          currentToken += line[j];
        }
        addToken(currentToken, 'string');
        i = j;
        currentToken = '';
        currentType = 'default';
        continue;
      }

      if (char === '/' && i + 1 < line.length && line[i + 1] === '/') {
        addToken(currentToken, currentType);
        addToken(line.slice(i), 'comment');
        break;
      }

      if ('(){}[]'.includes(char)) {
        addToken(currentToken, currentType);
        addToken(char, 'bracket');
        currentToken = '';
        currentType = 'default';
        continue;
      }

      if ('.,:;'.includes(char)) {
        addToken(currentToken, currentType);
        addToken(char, 'punctuation');
        currentToken = '';
        currentType = 'default';
        continue;
      }

      if (isOperator(char)) {
        addToken(currentToken, currentType);
        currentToken = char;
        while (i + 1 < line.length && isOperator(line[i + 1])) {
          i++;
          currentToken += line[i];
        }
        addToken(currentToken, 'operator');
        currentToken = '';
        currentType = 'default';
        continue;
      }

      if (/[0-9]/.test(char)) {
        if (currentType !== 'number') {
          addToken(currentToken, currentType);
          currentToken = '';
          currentType = 'number';
        }
      } else if (/[a-zA-Z_$]/.test(char)) {
        if (currentType !== 'variable' && currentType !== 'keyword') {
          addToken(currentToken, currentType);
          currentToken = '';
          currentType = 'variable';
        }
      } else {
        if (currentType !== 'default') {
          addToken(currentToken, currentType);
          currentToken = '';
          currentType = 'default';
        }
      }

      currentToken += char;

      if (currentType === 'variable' && isKeyword(currentToken)) {
        currentType = 'keyword';
      }
    }

    addToken(currentToken, currentType);
    return tokens;
  };

  const handleCodeInput = useCallback((value) => {
    setCodeInput(value);
    const newTimelineData = parseCodeChanges(value);
    console.log('New timeline data:', newTimelineData); // Debug log
    setTimelineData(newTimelineData);
  }, []);

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

  // Filter timeline data based on search term and filters
  const filteredTimelineData = useMemo(() => {
    if (!timelineData || !Array.isArray(timelineData)) return [];
    
    return timelineData
      .filter(row => row && Array.isArray(row.segments))
      .map(row => ({
        ...row,
        segments: row.segments.filter(segment => {
          if (!segment || !segment.type) return false;
          const type = segment.type;
          return filters[type] && 
            (!searchTerm || segment.text.toLowerCase().includes(searchTerm.toLowerCase()));
        })
      }))
      .filter(row => row.segments.length > 0);
  }, [timelineData, searchTerm, filters]);

  const handleDownload = async () => {
    try {
      // Get the timeline element
      const timelineElement = timelineRef.current;
      if (!timelineElement) return;

      // Use html2canvas to create an image
      const canvas = await html2canvas(timelineElement);
      
      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (!blob) return;
        
        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'code-timeline.png';
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Cleanup
        URL.revokeObjectURL(url);
      }, 'image/png');
    } catch (error) {
      console.error('Error downloading timeline:', error);
    }
  };

  const handleFileUpload = useCallback((event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === 'string') {
        setCodeInput(content);
        const newTimelineData = parseCodeChanges(content);
        setTimelineData(newTimelineData);
        localStorage.setItem('timelineData', JSON.stringify(newTimelineData));
      }
    };
    reader.readAsText(file);
  }, []);

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
    const timeline = timelineRef.current;
    if (timeline) {
      timeline.addEventListener('wheel', (e) => {
        e.preventDefault();
        timeline.scrollTop += e.deltaY;
      }, { passive: false });
    }
  }, []);

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

  // History management
  const addToHistory = (code, type = 'deleted') => {
    const newHistoryEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      code,
      type,
      timelineData: timelineData
    };
    
    setHistory(prevHistory => {
      const updatedHistory = [newHistoryEntry, ...prevHistory].slice(0, 50);
      localStorage.setItem('codeHistory', JSON.stringify(updatedHistory));
      return updatedHistory;
    });
  };

  const restoreFromHistory = (entry) => {
    if (window.confirm('This will replace your current code. Continue?')) {
      setCodeInput(entry.code);
      setTimelineData(entry.timelineData);
      setShowHistory(false);
    }
  };

  const clearHistory = () => {
    if (window.confirm('Are you sure you want to clear all history?')) {
      setHistory([]);
      localStorage.removeItem('codeHistory');
    }
  };

  const FilterDialog = ({ isOpen, onClose, onApply, filters, darkMode }) => {
    if (!isOpen) return null;

    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <div
          className={`w-96 p-6 rounded-lg ${
            darkMode ? "bg-gray-800" : "bg-white"
          }`}
          onClick={e => e.stopPropagation()}
        >
          <h3 className={`text-lg font-semibold mb-4 ${
            darkMode ? "text-white" : "text-gray-800"
          }`}>
            Filter Code Elements
          </h3>
          
          <div className="space-y-3">
            {Object.entries(filters).map(([key, value]) => (
              <label key={key} className="flex items-center">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => {
                    onApply({ ...filters, [key]: e.target.checked });
                  }}
                  className="mr-2"
                />
                <span className={darkMode ? "text-gray-300" : "text-gray-700"}>
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </span>
              </label>
            ))}
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded ${
                darkMode
                  ? "bg-gray-700 hover:bg-gray-600 text-white"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-800"
              }`}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  const DiffModal = ({ isOpen, onClose, segment, darkMode }) => {
    if (!isOpen || !segment) return null;

    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={onClose}
        style={{
          animation: 'fadeIn 0.2s ease-out'
        }}
      >
        <div
          className={`w-3/4 max-h-[80vh] rounded-lg ${
            darkMode ? "bg-gray-800" : "bg-white"
          } transform transition-all duration-200 ease-out`}
          onClick={e => e.stopPropagation()}
          style={{
            animation: 'slideIn 0.3s ease-out'
          }}
        >
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center border-b pb-4">
              <h3 className={`text-xl font-bold ${
                darkMode ? "text-white" : "text-gray-800"
              }`}>
                Code Segment Analysis
              </h3>
              <button
                onClick={onClose}
                className={`p-2 rounded-full hover:bg-opacity-80 transition-colors ${
                  darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                }`}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="grid grid-cols-2 gap-6">
              {/* Left Column - Context */}
              <div className="space-y-4">
                <div>
                  <h4 className={`text-lg font-semibold mb-2 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}>
                    Code Context
                  </h4>
                  <div className={`p-4 rounded-lg font-mono text-sm ${
                    darkMode ? "bg-gray-900" : "bg-gray-50"
                  } border ${
                    darkMode ? "border-gray-700" : "border-gray-200"
                  }`}>
                    <pre className="whitespace-pre-wrap overflow-x-auto">
                      <code className={darkMode ? "text-gray-300" : "text-gray-800"}>
                        {segment.context}
                      </code>
                    </pre>
                  </div>
                </div>
              </div>

              {/* Right Column - Details & Analysis */}
              <div className="space-y-6">
                {/* Segment Details */}
                <div>
                  <h4 className={`text-lg font-semibold mb-4 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}>
                    Segment Details
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`p-4 rounded-lg ${
                      darkMode ? "bg-gray-900" : "bg-gray-50"
                    } border ${
                      darkMode ? "border-gray-700" : "border-gray-200"
                    }`}>
                      <div className="space-y-2">
                        <p className={`${
                          darkMode ? "text-gray-400" : "text-gray-600"
                        }`}>
                          Type
                          <span className={`block text-lg font-medium ${
                            darkMode ? "text-gray-200" : "text-gray-800"
                          }`}>
                            {segment.type.charAt(0).toUpperCase() + segment.type.slice(1)}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className={`p-4 rounded-lg ${
                      darkMode ? "bg-gray-900" : "bg-gray-50"
                    } border ${
                      darkMode ? "border-gray-700" : "border-gray-200"
                    }`}>
                      <div className="space-y-2">
                        <p className={`${
                          darkMode ? "text-gray-400" : "text-gray-600"
                        }`}>
                          Position
                          <span className={`block text-lg font-medium ${
                            darkMode ? "text-gray-200" : "text-gray-800"
                          }`}>
                            Line {segment.line}, Pos {segment.position}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Complexity Analysis */}
                <div>
                  <h4 className={`text-lg font-semibold mb-4 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}>
                    Complexity Analysis
                  </h4>
                  <div className={`p-4 rounded-lg ${
                    darkMode ? "bg-gray-900" : "bg-gray-50"
                  } border ${
                    darkMode ? "border-gray-700" : "border-gray-200"
                  }`}>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className={darkMode ? "text-gray-400" : "text-gray-600"}>
                            Complexity Score
                          </span>
                          <span className={`font-medium ${
                            segment.complexity > 0.7 ? "text-red-500" :
                            segment.complexity > 0.4 ? "text-yellow-500" :
                            "text-green-500"
                          }`}>
                            {(segment.complexity * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              segment.complexity > 0.7 ? "bg-red-500" :
                              segment.complexity > 0.4 ? "bg-yellow-500" :
                              "bg-green-500"
                            }`}
                            style={{
                              width: `${segment.complexity * 100}%`,
                              transition: 'width 0.5s ease-out'
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Code Smells */}
                {segment.codeSmells?.length > 0 && (
                  <div>
                    <h4 className={`text-lg font-semibold mb-4 ${
                      darkMode ? "text-yellow-400" : "text-yellow-600"
                    }`}>
                      Code Smells
                    </h4>
                    <div className={`p-4 rounded-lg ${
                      darkMode ? "bg-gray-900" : "bg-gray-50"
                    } border ${
                      darkMode ? "border-gray-700" : "border-gray-200"
                    }`}>
                      <ul className="space-y-2">
                        {segment.codeSmells.map((smell, index) => (
                          <li
                            key={index}
                            className={`flex items-start gap-2 ${
                              darkMode ? "text-gray-300" : "text-gray-600"
                            }`}
                          >
                            <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                            <span>{smell.message}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 h-screen" style={{ background: theme.background }}>
      {mounted ? (
        <>
          <div className="flex items-center justify-between mb-6">
            <h1 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
              Code Timeline Visualizer
            </h1>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-64 px-4 py-2 rounded border ${
                      darkMode 
                        ? "bg-gray-800 border-gray-700 text-gray-200" 
                        : "bg-white border-gray-300"
                    }`}
                  />
                </div>
                <button
                  onClick={handleDelete}
                  className={`p-2 rounded ${
                    darkMode 
                      ? "bg-red-600 hover:bg-red-700 text-white" 
                      : "bg-red-500 hover:bg-red-600 text-white"
                  }`}
                  title="Clear code"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
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
                  onClick={() => setShowComplexity(!showComplexity)}
                  className={`p-2 rounded transition-colors ${
                    darkMode
                      ? `${showComplexity ? "bg-gray-700" : ""} hover:bg-gray-700 text-gray-300`
                      : `${showComplexity ? "bg-gray-100" : ""} hover:bg-gray-100 text-gray-700`
                  }`}
                  title={showComplexity ? "Show syntax highlighting" : "Show complexity"}
                >
                  <Activity className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`p-2 rounded ${
                    darkMode 
                      ? "bg-gray-800 hover:bg-gray-700 border border-gray-700" 
                      : "bg-white hover:bg-gray-100 border border-gray-300"
                  }`}
                >
                  {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className={`p-2 rounded ${
                    darkMode 
                      ? "bg-gray-800 hover:bg-gray-700 border border-gray-700" 
                      : "bg-white hover:bg-gray-100 border border-gray-300"
                  }`}
                >
                  <History className="w-5 h-5" />
                </button>
                <button
                  onClick={handleDownload}
                  className={`p-2 rounded ${
                    darkMode 
                      ? "bg-gray-800 hover:bg-gray-700 border border-gray-700" 
                      : "bg-white hover:bg-gray-100 border border-gray-300"
                  }`}
                >
                  <Download className="w-5 h-5" />
                </button>
                <label 
                  className={`p-2 rounded cursor-pointer ${
                    darkMode 
                      ? "bg-gray-800 hover:bg-gray-700 border border-gray-700" 
                      : "bg-white hover:bg-gray-100 border border-gray-300"
                  }`}
                >
                  <input
                    type="file"
                    accept="*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Share2 className="w-5 h-5" />
                </label>
              </div>
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
              <div className="relative flex-1 overflow-hidden">
                <div
                  ref={timelineRef}
                  className={`w-full h-full p-4 rounded-lg border overflow-y-auto ${
                    darkMode
                      ? "bg-gray-800 border-gray-700"
                      : "bg-white border border-gray-200 shadow-sm"
                  }`}
                  style={{
                    scrollBehavior: 'smooth'
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
                                  width: `${getSegmentWidth(segment.text)}px`,
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
                          style={{ backgroundColor: theme.severity.low }}
                        />
                        <span className={darkMode ? "text-gray-300" : "text-gray-700"}>
                          Low Severity
                        </span>
                      </div>
                      <div className="flex items-center">
                        <div
                          className="w-3 h-3 mr-1 rounded shadow-sm"
                          style={{ backgroundColor: theme.severity.medium }}
                        />
                        <span className={darkMode ? "text-gray-300" : "text-gray-700"}>
                          Medium Severity
                        </span>
                      </div>
                      <div className="flex items-center">
                        <div
                          className="w-3 h-3 mr-1 rounded shadow-sm"
                          style={{ backgroundColor: theme.severity.high }}
                        />
                        <span className={darkMode ? "text-gray-300" : "text-gray-700"}>
                          High Severity
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

          {/* History Modal */}
          {showHistory && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
              onClick={() => setShowHistory(false)}
            >
              <div 
                className="relative w-3/4 max-h-[80vh] rounded-lg p-6 overflow-hidden"
                style={{ background: theme.surface }}
                onClick={e => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold" style={{ color: theme.text.primary }}>
                    Code History
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={clearHistory}
                      className={`p-2 rounded transition-colors ${
                        darkMode 
                          ? "bg-red-600 hover:bg-red-700 text-white" 
                          : "bg-red-500 hover:bg-red-600 text-white"
                      }`}
                      title="Clear History"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShowHistory(false)}
                      className="p-2 rounded hover:bg-opacity-80"
                      style={{ background: theme.surface, color: theme.text.primary }}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="overflow-y-auto max-h-[calc(80vh-8rem)]">
                  {history.length === 0 ? (
                    <p className="text-center py-4" style={{ color: theme.text.secondary }}>
                      No history available
                    </p>
                  ) : (
                    history.map(entry => (
                      <div
                        key={entry.id}
                        className="mb-4 p-4 rounded-lg"
                        style={{ 
                          background: theme.background,
                          border: `1px solid ${theme.border}`
                        }}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span style={{ color: theme.text.secondary }}>
                            {new Date(entry.timestamp).toLocaleString()}
                          </span>
                          <div className="flex gap-2">
                            <span
                              className="px-2 py-1 rounded text-sm"
                              style={{
                                background: entry.type === 'deleted' ? theme.complexity.high : theme.complexity.medium,
                                color: 'white'
                              }}
                            >
                              {entry.type}
                            </span>
                            <button
                              onClick={() => restoreFromHistory(entry)}
                              className="px-2 py-1 rounded text-sm"
                              style={{
                                background: theme.accent,
                                color: 'white'
                              }}
                            >
                              Restore
                            </button>
                          </div>
                        </div>
                        <pre
                          className="mt-2 p-2 rounded overflow-x-auto"
                          style={{
                            background: theme.surface,
                            color: theme.text.primary,
                            maxHeight: '200px'
                          }}
                        >
                          {entry.code}
                        </pre>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
};

export default CodeTimeline;
