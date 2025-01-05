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
 * Detect code smells in a code segment
 */
export function detectCodeSmells(code) {
  const smells = [];
  const lines = code.split('\n');
  
  // Check each line for code smells
  lines.forEach((line, lineNumber) => {
    Object.entries(CODE_SMELL_PATTERNS).forEach(([type, { pattern, message, severity }]) => {
      if (pattern.test(line)) {
        smells.push({
          type,
          message,
          severity,
          line: lineNumber + 1,
          code: line.trim()
        });
      }
    });
  });

  // Check entire code block for multi-line patterns
  Object.entries(CODE_SMELL_PATTERNS).forEach(([type, { pattern, message, severity }]) => {
    if (pattern.test(code)) {
      // Avoid duplicate reports for patterns that were already caught line by line
      const alreadyReported = smells.some(smell => 
        smell.type === type && smell.code === code.match(pattern)?.[0]?.trim()
      );
      
      if (!alreadyReported) {
        smells.push({
          type,
          message,
          severity,
          code: code.match(pattern)?.[0]?.trim() || ''
        });
      }
    }
  });
  
  // Sort by severity (error > warning > info)
  return smells.sort((a, b) => {
    const severityOrder = { error: 0, warning: 1, info: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
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

/**
 * Main analysis function for code segments
 */
export function analyzeCodeSegment(code) {
  const complexity = calculateComplexity(code);
  const dependencies = analyzeDependencies(code);
  const sizeScore = calculateSizeScore(code);
  const codeSmells = detectCodeSmells(code);
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
