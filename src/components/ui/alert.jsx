"use client";

import React from 'react';
import { cn } from '@/lib/utils';

export function Alert({ type = 'info', message, className, onClose }) {
  const baseStyles = 'p-4 mb-4 rounded-lg flex justify-between items-center';
  const typeStyles = {
    error: 'bg-red-100 text-red-800 dark:bg-red-200 dark:text-red-900',
    success: 'bg-green-100 text-green-800 dark:bg-green-200 dark:text-green-900',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-200 dark:text-yellow-900',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-200 dark:text-blue-900',
  };

  return (
    <div className={cn(baseStyles, typeStyles[type], className)}>
      <span>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-auto -mx-1.5 -my-1.5 rounded-lg focus:ring-2 p-1.5 inline-flex items-center justify-center h-8 w-8 hover:bg-opacity-25"
        >
          <span className="sr-only">Close</span>
          <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
          </svg>
        </button>
      )}
    </div>
  );
}
