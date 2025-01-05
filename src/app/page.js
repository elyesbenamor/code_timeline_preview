"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Download, Github, BarChart2, MinusCircle, PlusCircle, Activity } from "lucide-react";
import html2canvas from "html2canvas";
import AceEditor from "react-ace";
import { validateCodeInput, parseCodeChanges, getTokenType } from "@/lib/utils";
import { analyzeCodeSegment, getComplexityColor } from "@/lib/analysis";
import { Alert } from "@/components/ui/alert";
import { TimelineControls } from "@/components/ui/timeline-controls";
import { FilterDialog } from "@/components/ui/filter-dialog";
import { MiniMap } from "@/components/ui/mini-map";

import "ace-builds/src-noconflict/mode-dart";
import "ace-builds/src-noconflict/theme-dracula";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/ext-language_tools";

const CodeTimeline = () => {
  const [codeInput, setCodeInput] = useState("");
  const [timelineData, setTimelineData] = useState([]);
  const [darkMode, setDarkMode] = useState(true);
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

  const timelineRef = useRef(null);
  const timelineContainerRef = useRef(null);

  const elementTypes = {
    keyword: darkMode ? '#FF7B72' : '#D32F2F',     // Deeper red
    class: darkMode ? '#7EE787' : '#2E7D32',       // Richer green
    function: darkMode ? '#D2A8FF' : '#6200EA',    // Deeper purple
    variable: darkMode ? '#79C0FF' : '#0277BD',    // Richer blue
    operator: darkMode ? '#FFB757' : '#F57C00',    // Warmer orange
    string: darkMode ? '#A5D6FF' : '#0277BD',      // Ocean blue
    number: darkMode ? '#FFA657' : '#C62828',      // Ruby red
    boolean: darkMode ? '#FF7B72' : '#D32F2F',     // Crimson red
    comment: darkMode ? '#8B949E' : '#757575',     // Neutral gray
    decorator: darkMode ? '#FFA657' : '#F57C00',   // Bright orange
    bracket: darkMode ? '#8B949E' : '#546E7A',     // Steel blue-gray
    punctuation: darkMode ? '#8B949E' : '#546E7A', // Steel blue-gray
    default: darkMode ? '#C9D1D9' : '#24292E',     // Default text color
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
      return analysis.color;
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

  const downloadImage = async () => {
    if (!timelineRef.current) return;
    
    try {
      const canvas = await html2canvas(timelineRef.current, {
        backgroundColor: darkMode ? "#2D2D2D" : "#FFFFFF",
        scale: window.devicePixelRatio,
      });
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = "code-timeline.png";
      link.click();
    } catch (err) {
      setError("Failed to download image: " + err.message);
    }
  };

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

  return (
    <div className={`p-6 h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <div className="flex items-center justify-between mb-4">
        <h2
          className={`text-xl font-semibold ${
            darkMode ? "text-white" : "text-gray-800"
          }`}
        >
          Code Timeline Visualizer
        </h2>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-full ${
              darkMode
                ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
                : "bg-gray-200 hover:bg-gray-300 text-gray-700"
            }`}
          >
            {darkMode ? "Light Mode" : "Dark Mode"}
          </button>

          <a
            href="https://github.com/elyesbenamor/code_timeline_preview"
            target="_blank"
            rel="noopener noreferrer"
            className={`p-2 rounded-full ${
              darkMode
                ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
                : "bg-gray-200 hover:bg-gray-300 text-gray-700"
            }`}
          >
            <Github className="w-4 h-4" />
          </a>

          <button
            onClick={downloadImage}
            className={`p-2 rounded-full ${
              darkMode
                ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
                : "bg-gray-200 hover:bg-gray-300 text-gray-700"
            }`}
          >
            <Download className="w-4 h-4" />
          </button>
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
          <AceEditor
            placeholder="Paste your code here..."
            theme={darkMode ? "dracula" : "github"}
            value={codeInput}
            mode="javascript"
            width="100%"
            height="100%"
            onChange={handleCodeInput}
            className={`rounded-lg shadow-sm ${
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
              <button
                onClick={() => downloadImage()}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode
                    ? "hover:bg-gray-700 text-gray-300"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                <Download className="w-4 h-4" />
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
            >
              <div 
                ref={timelineRef}
                className="p-4 space-y-1" 
                style={{ 
                  transform: `scale(${zoom})`, 
                  transformOrigin: 'top left',
                  minHeight: '100%'
                }}
              >
                {filteredTimelineData.map((row) => {
                  const analysis = analyzeCodeSegment(row.segments.map(s => s.text).join(''));
                  return (
                    <div key={row.id} className="flex items-center">
                      <span
                        className={`w-8 text-sm font-mono select-none ${
                          darkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {row.id}
                      </span>
                      <div className="flex items-center flex-1">
                        {row.segments.map((segment, segIndex) => (
                          <div
                            key={segIndex}
                            className="relative hover:z-10"
                            onMouseEnter={(e) => {
                              const tooltip = e.currentTarget.querySelector('.segment-tooltip');
                              if (tooltip) {
                                tooltip.style.display = 'block';
                              }
                            }}
                            onMouseLeave={(e) => {
                              const tooltip = e.currentTarget.querySelector('.segment-tooltip');
                              if (tooltip) {
                                tooltip.style.display = 'none';
                              }
                            }}
                          >
                            <div
                              className={`rounded transition-all duration-200 hover:opacity-80 mx-[1px] ${
                                darkMode ? "" : "hover:shadow-sm"
                              }`}
                              style={{
                                backgroundColor: getSegmentColor(segment, analysis),
                                opacity: getSegmentOpacity(analysis),
                                height: `${getSegmentHeight(analysis.complexity)}px`,
                                width: `${segment.width}px`,
                                cursor: 'pointer'
                              }}
                            />
                            <div 
                              className={`segment-tooltip absolute hidden p-3 rounded z-50 text-xs font-mono min-w-[200px] max-w-[300px] ${
                                darkMode 
                                  ? "bg-gray-800 text-gray-200 border border-gray-700" 
                                  : "bg-white text-gray-700 border border-gray-200 shadow-lg"
                              }`}
                              style={{
                                left: segIndex > row.segments.length / 2 ? 'auto' : '0',
                                right: segIndex > row.segments.length / 2 ? '0' : 'auto',
                                bottom: '100%',
                                marginBottom: '10px',
                                maxHeight: '300px',
                                overflow: 'auto'
                              }}
                            >
                              <div className="font-bold mb-2 break-all">{segment.text}</div>
                              <div className="space-y-1">
                                <div>Type: {segment.type}</div>
                                <div>Complexity: {analysis.complexity.toFixed(1)}</div>
                                {analysis.codeSmells.length > 0 && (
                                  <div className="text-yellow-500">
                                    Code Smells:
                                    <ul className="ml-2 mt-1">
                                      {analysis.codeSmells.map((smell, i) => (
                                        <li key={i} className="break-normal">• {smell.message}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {analysis.performanceImpact.length > 0 && (
                                  <div className="text-orange-500">
                                    Performance Issues:
                                    <ul className="ml-2 mt-1">
                                      {analysis.performanceImpact.map((issue, i) => (
                                        <li key={i} className="break-normal">• {issue.message}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {analysis.changeImpact && (
                                  <div className={`
                                    ${analysis.changeImpact.riskLevel === 'high' ? 'text-red-500' : 
                                      analysis.changeImpact.riskLevel === 'medium' ? 'text-yellow-500' : 
                                      'text-green-500'}
                                  `}>
                                    Change Impact: {analysis.changeImpact.riskLevel}
                                  </div>
                                )}
                              </div>
                              <div 
                                className={`absolute w-2 h-2 transform rotate-45 ${
                                  darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                                } border-b border-r`}
                                style={{
                                  bottom: '-5px',
                                  left: segIndex > row.segments.length / 2 ? '90%' : '10%'
                                }}
                              />
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
              : "bg-white border-gray-200 shadow-sm"
          }`}>
            <div className="flex flex-wrap gap-3 text-xs">
              {showComplexity ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 mr-1 rounded shadow-sm"
                      style={{ backgroundColor: '#4CAF50' }}
                    />
                    <span className={darkMode ? "text-gray-300" : "text-gray-700"}>
                      Low Complexity
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 mr-1 rounded shadow-sm"
                      style={{ backgroundColor: '#FFC107' }}
                    />
                    <span className={darkMode ? "text-gray-300" : "text-gray-700"}>
                      Medium Complexity
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 mr-1 rounded shadow-sm"
                      style={{ backgroundColor: '#FF9800' }}
                    />
                    <span className={darkMode ? "text-gray-300" : "text-gray-700"}>
                      High Complexity
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 mr-1 rounded shadow-sm"
                      style={{ backgroundColor: '#F44336' }}
                    />
                    <span className={darkMode ? "text-gray-300" : "text-gray-700"}>
                      Very High Complexity
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
    </div>
  );
};

export default CodeTimeline;
