"use client";

import React, { useEffect, useRef } from 'react';

export function MiniMap({ 
  timelineData, 
  visibleRange, 
  onNavigate,
  darkMode,
  width = 150,
  height = 100
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !timelineData.length) return;

    const ctx = canvas.getContext('2d');
    const totalLines = timelineData.length;
    
    // Clear canvas
    ctx.fillStyle = darkMode ? '#1f2937' : '#f9fafb';
    ctx.fillRect(0, 0, width, height);

    // Calculate dimensions
    const lineHeight = height / totalLines;

    // Draw timeline segments
    timelineData.forEach((row, index) => {
      const y = (index / totalLines) * height;
      
      // Draw background for the entire line
      ctx.fillStyle = darkMode ? '#374151' : '#e5e7eb';
      ctx.fillRect(0, y, width, Math.max(1, lineHeight));

      // Draw segments
      let currentX = 0;
      row.segments.forEach(segment => {
        if (segment.color !== 'transparent') {
          const segmentWidth = (segment.width / 8) * (width / 100);
          ctx.fillStyle = segment.color;
          ctx.fillRect(currentX, y, Math.max(1, segmentWidth), Math.max(1, lineHeight));
          currentX += segmentWidth;
        }
      });
    });

    // Draw visible range indicator
    if (visibleRange) {
      const { start, end } = visibleRange;
      const visibleStart = (start / totalLines) * height;
      const visibleHeight = ((end - start) / totalLines) * height;

      // Draw semi-transparent overlay for non-visible areas
      ctx.fillStyle = `rgba(0, 0, 0, ${darkMode ? 0.5 : 0.2})`;
      ctx.fillRect(0, 0, width, visibleStart);
      ctx.fillRect(0, visibleStart + visibleHeight, width, height - (visibleStart + visibleHeight));

      // Draw border around visible area
      ctx.strokeStyle = darkMode ? '#60a5fa' : '#3b82f6';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, visibleStart, width, visibleHeight);
    }
  }, [timelineData, visibleRange, darkMode, width, height]);

  const handleClick = (e) => {
    if (!timelineData.length) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const clickedPosition = Math.floor((y / height) * timelineData.length);
    
    onNavigate(Math.max(0, Math.min(clickedPosition, timelineData.length - 1)));
  };

  return (
    <div 
      className={`p-2 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}
      style={{ minWidth: width + 16 }} // Add padding to width
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onClick={handleClick}
        className="cursor-pointer rounded"
        style={{
          width: `${width}px`,
          height: `${height}px`,
        }}
      />
    </div>
  );
}
