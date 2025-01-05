"use client";

import React from 'react';
import { Search, ZoomIn, ZoomOut, Filter } from 'lucide-react';

export function TimelineControls({ 
  onZoomIn, 
  onZoomOut, 
  onSearch, 
  onFilter,
  darkMode 
}) {
  return (
    <div className={`flex items-center gap-2 mb-4 ${
      darkMode ? 'text-gray-200' : 'text-gray-700'
    }`}>
      <div className="flex-1 relative">
        <input
          type="text"
          placeholder="Search in timeline..."
          onChange={(e) => onSearch(e.target.value)}
          className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
            darkMode 
              ? 'bg-gray-800 border-gray-700 text-gray-200' 
              : 'bg-white border-gray-200 text-gray-700'
          }`}
        />
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
      </div>
      
      <button
        onClick={onZoomIn}
        className={`p-2 rounded-lg ${
          darkMode
            ? 'bg-gray-800 hover:bg-gray-700'
            : 'bg-white hover:bg-gray-50 border border-gray-200'
        }`}
        title="Zoom In"
      >
        <ZoomIn className="w-4 h-4" />
      </button>
      
      <button
        onClick={onZoomOut}
        className={`p-2 rounded-lg ${
          darkMode
            ? 'bg-gray-800 hover:bg-gray-700'
            : 'bg-white hover:bg-gray-50 border border-gray-200'
        }`}
        title="Zoom Out"
      >
        <ZoomOut className="w-4 h-4" />
      </button>
      
      <button
        onClick={onFilter}
        className={`p-2 rounded-lg ${
          darkMode
            ? 'bg-gray-800 hover:bg-gray-700'
            : 'bg-white hover:bg-gray-50 border border-gray-200'
        }`}
        title="Filter"
      >
        <Filter className="w-4 h-4" />
      </button>
    </div>
  );
}
