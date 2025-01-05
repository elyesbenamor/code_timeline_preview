import React from 'react';
import { Upload } from 'lucide-react';

export function FileUpload({ onFileContent, className = '' }) {
  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target.result;
        onFileContent(text);
      };
      reader.readAsText(file);
    }
  };

  return (
    <label 
      className={`p-2 rounded-full cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-700 ${className}`}
      title="Upload Code File"
    >
      <Upload className="w-4 h-4" />
      <input
        type="file"
        className="hidden"
        onChange={handleFileChange}
      />
    </label>
  );
}
