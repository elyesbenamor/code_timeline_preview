"use client";

import React from 'react';

export function FilterDialog({ 
  isOpen, 
  onClose, 
  onApply, 
  filters, 
  darkMode 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`w-96 rounded-lg shadow-lg ${
        darkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className={`p-4 border-b ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h3 className={`text-lg font-semibold ${
            darkMode ? 'text-gray-200' : 'text-gray-800'
          }`}>
            Filter Timeline
          </h3>
        </div>
        
        <div className="p-4 space-y-4">
          {Object.entries(filters).map(([key, value]) => (
            <label key={key} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => onApply({ ...filters, [key]: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className={`${
                darkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </span>
            </label>
          ))}
        </div>
        
        <div className={`p-4 border-t ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg ${
              darkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
