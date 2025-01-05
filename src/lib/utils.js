import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const validateCodeInput = (input) => {
  if (!input || typeof input !== 'string') {
    throw new Error('Input must be a non-empty string');
  }

  // Basic code structure validation
  const lines = input.split('\n');
  if (lines.length === 0) {
    throw new Error('Input must contain at least one line of code');
  }

  return true;
};

export const parseCodeChanges = (input) => {
  try {
    // Remove any BOM and normalize line endings
    const normalizedInput = input.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
    
    // Split into lines and filter out empty lines
    return normalizedInput.split('\n');
  } catch (error) {
    throw new Error(`Failed to parse code changes: ${error.message}`);
  }
};

export const getTokenType = (token) => {
  if (!token) return 'default';
  
  const patterns = {
    keyword: /^(class|function|const|let|var|if|else|for|while|return|import|from|async|await|try|catch|throw|new|this|super)$/,
    class: /^[A-Z][a-zA-Z0-9]*$/,
    function: /^[a-z][a-zA-Z0-9]*(?=\()/,
    variable: /^[a-z][a-zA-Z0-9]*$/,
    operator: /[+\-*/%=<>!&|^~]/,
    string: /^(['"]).*\1$/,
    number: /^\d+$/,
    boolean: /^(true|false)$/,
    comment: /^\/\//,
    decorator: /^@/,
    bracket: /[{}()[\]]/,
    punctuation: /[.,;]/
  };

  for (const [type, pattern] of Object.entries(patterns)) {
    if (pattern.test(token)) {
      return type;
    }
  }

  return 'default';
};
