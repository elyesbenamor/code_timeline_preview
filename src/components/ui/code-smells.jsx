import React from 'react';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

export function CodeSmells({ smells, darkMode }) {
  if (!smells || smells.length === 0) {
    return (
      <div className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
        No code smells detected
      </div>
    );
  }

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'error':
        return <AlertCircle className="w-4 h-4" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'error':
        return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'warning':
        return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      default:
        return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    }
  };

  // Group smells by severity
  const groupedSmells = smells.reduce((acc, smell) => {
    acc[smell.severity] = acc[smell.severity] || [];
    acc[smell.severity].push(smell);
    return acc;
  }, {});

  const severityOrder = ['error', 'warning', 'info'];

  return (
    <div className="space-y-4">
      {severityOrder.map(severity => 
        groupedSmells[severity] && (
          <div key={severity} className="space-y-2">
            <h4 className={`text-sm font-medium flex items-center gap-2 ${
              darkMode ? "text-gray-300" : "text-gray-700"
            }`}>
              {getSeverityIcon(severity)}
              {severity.charAt(0).toUpperCase() + severity.slice(1)}s
              <span className={`text-xs px-2 py-0.5 rounded-full ${getSeverityColor(severity)}`}>
                {groupedSmells[severity].length}
              </span>
            </h4>
            <div className="space-y-2">
              {groupedSmells[severity].map((smell, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${getSeverityColor(severity)}`}
                >
                  <div className="font-medium mb-1">
                    {smell.type.split('_').map(word => 
                      word.charAt(0) + word.slice(1).toLowerCase()
                    ).join(' ')}
                  </div>
                  <p className={`text-sm ${
                    darkMode ? "text-gray-300" : "text-gray-600"
                  }`}>
                    {smell.message}
                  </p>
                  {smell.line && (
                    <div className={`mt-2 text-xs ${
                      darkMode ? "text-gray-400" : "text-gray-500"
                    }`}>
                      Line {smell.line}
                    </div>
                  )}
                  {smell.code && (
                    <pre className={`mt-2 p-2 text-xs rounded ${
                      darkMode ? "bg-gray-700/50" : "bg-gray-100"
                    } overflow-x-auto`}>
                      {smell.code}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
}
