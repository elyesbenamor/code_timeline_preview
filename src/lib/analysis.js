// Code complexity analysis utilities

// Code Analysis Constants
const COMPLEXITY_WEIGHTS = {
  CONTROL_FLOW: 2,    // if, for, while, etc.
  NESTING: 1.5,       // Nested blocks
  LOGICAL_OPS: 1,     // &&, ||, !
  TERNARY: 1.5,       // ? :
  FUNCTION_CALLS: 1,  // Function invocations
  RECURSION: 2,       // Recursive calls
};

const CODE_SMELL_PATTERNS = {
  // ESLint-inspired patterns
  NO_UNUSED_VARS: { 
    pattern: /(?:let|const|var)\s+([a-zA-Z_$][0-9a-zA-Z_$]*)\s*=.*?(?![\s\S]*\1)/, 
    message: 'Unused variable detected', 
    severity: 'warning' 
  },
  NO_CONSOLE: { 
    pattern: /console\.(log|debug|info|warn|error)/, 
    message: 'Unexpected console statement', 
    severity: 'warning' 
  },
  MAX_LEN: { 
    pattern: /.{120,}/, 
    message: 'Line exceeds maximum length (120 characters)', 
    severity: 'warning' 
  },
  NO_EVAL: { 
    pattern: /\beval\(/, 
    message: 'eval() is dangerous and should be avoided', 
    severity: 'error' 
  },
  NO_ALERT: { 
    pattern: /\b(alert|confirm|prompt)\(/, 
    message: 'Unexpected alert/confirm/prompt', 
    severity: 'warning' 
  },
  NO_NESTED_TERNARY: { 
    pattern: /\?.*\?/, 
    message: 'Nested ternary expressions are hard to read', 
    severity: 'warning' 
  },
  PREFER_CONST: { 
    pattern: /let\s+([a-zA-Z_$][0-9a-zA-Z_$]*)\s*=\s*[^;,\n]*(?![\s\S]*\1\s*=)/, 
    message: 'Use const instead of let for values that are never reassigned', 
    severity: 'info' 
  },
  NO_MULTIPLE_EMPTY_LINES: { 
    pattern: /\n\s*\n\s*\n/, 
    message: 'Multiple empty lines detected', 
    severity: 'info' 
  },
  NO_DEBUGGER: { 
    pattern: /debugger;?/, 
    message: 'Unexpected debugger statement', 
    severity: 'error' 
  },
  CALLBACK_RETURN: { 
    pattern: /function.*callback.*\{(?![^}]*return)/, 
    message: 'Expected return in callback function', 
    severity: 'warning' 
  },
  NO_SHADOW: { 
    pattern: /(?:let|const|var)\s+([a-zA-Z_$][0-9a-zA-Z_$]*).+?(?:let|const|var)\s+\1/, 
    message: 'Variable shadows another variable', 
    severity: 'warning' 
  },
  CAMELCASE: { 
    pattern: /(?:let|const|var)\s+[a-z]+[_][a-z]+/, 
    message: 'Use camelCase for variable names', 
    severity: 'info' 
  },
  NO_MAGIC_NUMBERS: { 
    pattern: /(?<![\w\d.])[0-9]{4,}(?![\w\d.])/, 
    message: 'Avoid magic numbers, use named constants', 
    severity: 'info' 
  },
  NO_NESTED_CALLBACKS: { 
    pattern: /callback.*callback|promise.*then.*then|async.*await.*await/i, 
    message: 'Avoid nested callbacks/promises, consider async/await', 
    severity: 'warning' 
  },
  NO_LARGE_SWITCH: { 
    pattern: /switch[^{]*\{(?:[^}]*case[^:]*:[^}]*){5,}\}/, 
    message: 'Large switch statement, consider using a map/object', 
    severity: 'warning' 
  },
  NO_COMMENTED_CODE: { 
    pattern: /\/\/.*\b(if|for|while|function)\b|\*.*\b(if|for|while|function)\b/, 
    message: 'Commented code detected, should be removed', 
    severity: 'info' 
  }
};

const PERFORMANCE_PATTERNS = {
  ARRAY_INSIDE_LOOP: { 
    pattern: /for.*\.(map|filter|reduce)/g, 
    message: 'Array method inside loop',
    impact: 'high'
  },
  DEEP_NESTING: { 
    pattern: /{[^}]*{[^}]*{[^}]*}/g, 
    message: 'Deep nesting detected',
    impact: 'medium'
  },
  LARGE_OBJECT_LITERAL: { 
    pattern: /{(?:[^{}]*{[^{}]*})*[^{}]*}/g, 
    message: 'Large object literal',
    impact: 'medium'
  }
};

// Language-specific code smell rules
const languageRules = {
  javascript: {
    patterns: [
      { regex: /console\.(log|warn|error|info|debug)/g, message: "Unexpected console statement" },
      { regex: /var\s/g, message: "Use let/const instead of var" },
      { regex: /==(?!=)/g, message: "Use === instead of ==" },
      { regex: /\.length\s*===?\s*0/g, message: "Use .length > 0 instead of === 0" },
      { regex: /for\s*\(.*\{[\s\S]*\}/g, message: "Consider using array methods instead of for loops" },
      { regex: /catch\s*\(\s*e\s*\)/g, message: "Use more descriptive error variable names" },
      { regex: /setTimeout\s*\(\s*function\s*\(\)/g, message: "Consider using async/await instead of setTimeout" }
    ]
  },
  python: {
    patterns: [
      { regex: /print\s*\([^)]*\)/g, message: "Consider using logging instead of print" },
      { regex: /except:/g, message: "Avoid bare except clause" },
      { regex: /import \*/g, message: "Avoid wildcard imports" },
      { regex: /global\s+[a-zA-Z_]/g, message: "Avoid global variables" },
      { regex: /lambda/g, message: "Consider using a regular function instead of lambda" }
    ]
  },
  java: {
    patterns: [
      { regex: /System\.out\.println/g, message: "Use a logger instead of System.out.println" },
      { regex: /catch\s*\(\s*Exception\s+e\s*\)/g, message: "Avoid catching generic Exception" },
      { regex: /null\s*==/g, message: "Use Objects.isNull() or Optional" },
      { regex: /synchronized/g, message: "Consider using concurrent collections instead" }
    ]
  },
  csharp: {
    patterns: [
      { regex: /Console\.(Write|WriteLine)/g, message: "Use logging framework instead of Console" },
      { regex: /catch\s*\(\s*Exception\s+e\s*\)/g, message: "Avoid catching generic Exception" },
      { regex: /goto/g, message: "Avoid using goto statements" }
    ]
  },
  ruby: {
    patterns: [
      { regex: /puts/g, message: "Use Rails.logger instead of puts" },
      { regex: /rescue\s*$/g, message: "Avoid rescuing without specifying an error class" },
      { regex: /eval/g, message: "Avoid using eval" }
    ]
  },
  php: {
    patterns: [
      { regex: /var_dump|print_r/g, message: "Use proper logging instead of debug functions" },
      { regex: /\$_GET|\$_POST/g, message: "Validate input data before usage" },
      { regex: /mysql_/g, message: "Use PDO or mysqli instead of mysql_* functions" }
    ]
  },
  go: {
    patterns: [
      { regex: /panic\(/g, message: "Avoid using panic" },
      { regex: /\.Error\(\)\s*==\s*""/g, message: "Check error type instead of error string" },
      { regex: /time.Sleep/g, message: "Consider using contexts for timeouts" }
    ]
  },
  rust: {
    patterns: [
      { regex: /unwrap\(\)/g, message: "Handle Result/Option explicitly instead of unwrap" },
      { regex: /panic!\(/g, message: "Avoid using panic!" },
      { regex: /unsafe\s*\{/g, message: "Minimize usage of unsafe blocks" }
    ]
  },
  swift: {
    patterns: [
      { regex: /print\(/g, message: "Use logging framework instead of print" },
      { regex: /try\!/g, message: "Avoid force try" },
      { regex: /as\!/g, message: "Avoid force casting" }
    ]
  },
  kotlin: {
    patterns: [
      { regex: /println\(/g, message: "Use logging framework instead of println" },
      { regex: /!!/g, message: "Avoid using not-null assertion operator" },
      { regex: /lateinit/g, message: "Consider using nullable or lazy properties" }
    ]
  },
  typescript: {
    patterns: [
      { regex: /any/g, message: "Avoid using 'any' type" },
      { regex: /console\.(log|warn|error|info|debug)/g, message: "Unexpected console statement" },
      { regex: /\!=/g, message: "Use !== instead of !=" }
    ]
  }
};

// Detect language based on code content and file extension
function detectLanguage(code, fileExtension = '') {
  // Map file extensions to languages
  const extensionMap = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    java: 'java',
    cs: 'csharp',
    rb: 'ruby',
    php: 'php',
    go: 'go',
    rs: 'rust',
    swift: 'swift',
    kt: 'kotlin'
  };

  // Try to detect from extension first
  if (fileExtension && extensionMap[fileExtension.toLowerCase()]) {
    return extensionMap[fileExtension.toLowerCase()];
  }

  // Fallback to content-based detection
  const languagePatterns = {
    python: /(def|import|from|class|if __name__ == ['"]__main__['"]:)/,
    javascript: /(const|let|var|function|=>|require\(|import\s+.*\s+from)/,
    java: /(public class|private|protected|package|import java)/,
    csharp: /(using System|namespace|public class|private|protected)/,
    ruby: /(require|def|class|module|puts|attr_)/,
    php: /(<\?php|\$[a-zA-Z_]|namespace|use\s+.*?;)/,
    go: /(package main|import \(|func|type struct)/,
    rust: /(fn main|let mut|impl|pub struct)/,
    swift: /(import Foundation|var|func|class|struct)/,
    kotlin: /(fun|val|var|class|package)/,
    typescript: /(interface|type|export|implements)/
  };

  for (const [lang, pattern] of Object.entries(languagePatterns)) {
    if (pattern.test(code)) {
      return lang;
    }
  }

  return 'javascript'; // Default to JavaScript if no match
}

// Detect code smells in a code segment
function detectCodeSmells(code, fileExtension = '') {
  const language = detectLanguage(code, fileExtension);
  const rules = languageRules[language] || languageRules.javascript;
  const smells = [];

  // Apply language-specific rules
  rules.patterns.forEach(pattern => {
    if (pattern.regex.test(code)) {
      smells.push({
        type: 'smell',
        message: pattern.message,
        severity: 'warning'
      });
    }
  });

  // Common patterns across languages
  const commonSmells = [
    { regex: /TODO|FIXME/g, message: "Remove TODO/FIXME comments before committing" },
    { regex: /\/\/\s*hack/gi, message: "Remove hack comments" },
    { regex: /function.*\{[\s\S]{100,}\}/g, message: "Function is too long" },
    { regex: /(if|while).*\{[\s\S]*\1.*\{/g, message: "Nested control structures detected" },
    { regex: /[^\w\s\(\)]{3,}/g, message: "Complex expression detected" }
  ];

  commonSmells.forEach(pattern => {
    if (pattern.regex.test(code)) {
      smells.push({
        type: 'smell',
        message: pattern.message,
        severity: 'info'
      });
    }
  });

  return smells;
}

/**
 * Calculate cognitive complexity of a code segment
 */
export function calculateComplexity(code) {
  let score = 0;
  
  // Control flow statements
  const controlFlow = (code.match(/if|else|for|while|do|switch|case|try|catch|finally/g) || []).length;
  score += controlFlow * COMPLEXITY_WEIGHTS.CONTROL_FLOW;
  
  // Nesting level (count brackets and indentation)
  const nesting = (code.match(/{/g) || []).length;
  score += nesting * COMPLEXITY_WEIGHTS.NESTING;
  
  // Logical operators
  const logicalOps = (code.match(/&&|\|\||!(?!=)/g) || []).length;
  score += logicalOps * COMPLEXITY_WEIGHTS.LOGICAL_OPS;
  
  // Ternary operators
  const ternary = (code.match(/\?.*:/g) || []).length;
  score += ternary * COMPLEXITY_WEIGHTS.TERNARY;
  
  // Function calls
  const functionCalls = (code.match(/\w+\(/g) || []).length;
  score += functionCalls * COMPLEXITY_WEIGHTS.FUNCTION_CALLS;
  
  // Recursion detection
  const functionName = code.match(/function\s+(\w+)/)?.[1];
  if (functionName && code.includes(functionName + '(')) {
    score += COMPLEXITY_WEIGHTS.RECURSION;
  }
  
  return score;
}

/**
 * Analyze dependencies and imports
 */
export function analyzeDependencies(code) {
  const imports = (code.match(/import.*from|require\(.*\)/g) || []);
  const exports = (code.match(/export\s+(default\s+)?(\w+|\{.*\})/g) || []);
  const functionCalls = (code.match(/\w+\(/g) || []).map(call => call.slice(0, -1));
  
  return {
    imports: imports.length,
    exports: exports.length,
    functionCalls,
    totalDependencies: imports.length + exports.length + functionCalls.length
  };
}

/**
 * Calculate size score based on code length and structure
 */
export function calculateSizeScore(code) {
  const lines = code.split('\n').length;
  const chars = code.length;
  return Math.log10(lines * chars) / 2;
}

/**
 * Get color based on complexity score
 */
export function getComplexityColor(complexity) {
  if (complexity <= 3) {
    return '#4CAF50'; // Low complexity - Green
  } else if (complexity <= 6) {
    return '#FFC107'; // Medium complexity - Yellow
  } else if (complexity <= 9) {
    return '#FF9800'; // High complexity - Orange
  } else {
    return '#F44336'; // Very high complexity - Red
  }
}

/**
 * Main analysis function for code segments
 */
export function analyzeCodeSegment(code, fileExtension = '') {
  const complexity = calculateComplexity(code);
  const dependencies = analyzeDependencies(code);
  const sizeScore = calculateSizeScore(code);
  const codeSmells = detectCodeSmells(code, fileExtension);
  const performanceImpact = analyzePerformanceImpact(code);
  const changeImpact = calculateChangeImpact(code);

  return {
    complexity,
    dependencies,
    sizeScore,
    codeSmells,
    performanceImpact,
    changeImpact,
    color: getComplexityColor(complexity)
  };
}

/**
 * Analyze performance impact
 */
export function analyzePerformanceImpact(code) {
  const impacts = [];
  
  Object.entries(PERFORMANCE_PATTERNS).forEach(([type, { pattern, message, impact }]) => {
    if (pattern.test(code)) {
      impacts.push({ type, message, impact });
    }
  });
  
  return impacts;
}

/**
 * Calculate change impact score
 */
export function calculateChangeImpact(code) {
  const complexity = calculateComplexity(code);
  const { totalDependencies } = analyzeDependencies(code);
  const sizeScore = calculateSizeScore(code);
  
  return {
    score: (complexity * 0.4) + (totalDependencies * 0.4) + (sizeScore * 0.2),
    riskLevel: complexity > 7 || totalDependencies > 5 ? 'high' : 
               complexity > 4 || totalDependencies > 3 ? 'medium' : 'low'
  };
}
