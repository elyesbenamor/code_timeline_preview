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
  LONG_LINE: { pattern: /.{120,}/, message: 'Line too long (>120 characters)', severity: 'warning' },
  NESTED_CALLBACKS: { pattern: /callback.*callback/i, message: 'Nested callbacks detected', severity: 'warning' },
  MAGIC_NUMBERS: { pattern: /(?<![\w\d])-?\d{4,}(?![\w\d])/g, message: 'Magic number detected', severity: 'info' },
  COMPLEX_CONDITION: { pattern: /&&.*&&|\|\|.*\|\|/, message: 'Complex condition', severity: 'warning' },
  TODO_COMMENT: { pattern: /\/\/.*TODO/i, message: 'TODO comment found', severity: 'info' }
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
 * Detect code smells
 */
export function detectCodeSmells(code) {
  const smells = [];
  
  Object.entries(CODE_SMELL_PATTERNS).forEach(([type, { pattern, message, severity }]) => {
    if (pattern.test(code)) {
      smells.push({ type, message, severity });
    }
  });
  
  return smells;
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
