// Code complexity analysis utilities

/**
 * Calculate cognitive complexity of a code segment
 * This is a simplified version that looks for common complexity indicators
 */
export function calculateComplexity(code) {
  let score = 0;
  
  // Control flow statements
  const controlFlow = (code.match(/if|else|for|while|do|switch|case|try|catch|finally/g) || []).length;
  score += controlFlow * 2;
  
  // Nesting level
  const nesting = (code.match(/{/g) || []).length;
  score += nesting;
  
  // Logical operators
  const logicalOps = (code.match(/&&|\|\||!(?!=)/g) || []).length;
  score += logicalOps;
  
  // Ternary operators
  const ternary = (code.match(/\?.*:/g) || []).length;
  score += ternary * 2;
  
  return score;
}

/**
 * Analyze code structure to find dependencies between different parts
 */
export function analyzeDependencies(code) {
  const imports = (code.match(/import.*from|require\(.*\)/g) || []).length;
  return imports;
}

/**
 * Calculate the relative size score of a code segment
 */
export function calculateSizeScore(code) {
  const lines = code.split('\n').length;
  const characters = code.length;
  return Math.log(lines * characters + 1);
}

/**
 * Generate a complexity color based on the complexity score
 */
export function getComplexityColor(complexity) {
  if (complexity <= 2) {
    return '#4CAF50'; // Low complexity - Green
  } else if (complexity <= 5) {
    return '#FFC107'; // Medium complexity - Yellow
  } else {
    return '#F44336'; // High complexity - Red
  }
}

/**
 * Generate metrics for a code segment
 */
export function analyzeCodeSegment(code) {
  const complexity = calculateComplexity(code);
  return {
    complexity,
    dependencies: analyzeDependencies(code),
    sizeScore: calculateSizeScore(code)
  };
}
