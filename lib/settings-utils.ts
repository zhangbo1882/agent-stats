/**
 * Validates environment variable name according to common conventions
 * @param name - The environment variable name to validate
 * @returns true if valid, false otherwise
 */
export function validateEnvVarName(name: string): boolean {
  if (!name || typeof name !== 'string') {
    return false;
  }

  // Env var names should: start with letter or underscore, contain only letters, numbers, underscores
  const validNameRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
  return validNameRegex.test(name);
}

/**
 * Checks if a variable name is likely to contain sensitive information
 * @param name - The environment variable name to check
 * @returns true if likely sensitive, false otherwise
 */
export function isSensitiveVar(name: string): boolean {
  if (!name || typeof name !== 'string') {
    return false;
  }

  const sensitiveKeywords = [
    'API_KEY',
    'SECRET',
    'TOKEN',
    'PASSWORD',
    'KEY',
    'AUTH',
    'CREDENTIAL',
    'PRIVATE',
    'CERT',
  ];

  const upperName = name.toUpperCase();
  return sensitiveKeywords.some((keyword) => upperName.includes(keyword));
}

/**
 * Masks sensitive value for display
 * @param value - The value to mask
 * @param name - The variable name (for context)
 * @returns Masked value
 */
export function maskSensitiveValue(value: string, name: string): string {
  if (!value || value.length <= 8) {
    return '****';
  }

  // Show first 4 and last 4 characters
  const start = value.slice(0, 4);
  const end = value.slice(-4);
  const middle = '*'.repeat(Math.min(value.length - 8, 20));

  return `${start}${middle}${end}`;
}

/**
 * Deep merges two objects
 * @param target - The target object
 * @param source - The source object to merge in
 * @returns Merged object
 */
export function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result: any = { ...target };

  for (const key in source) {
    // If the value is undefined or null, delete the key from result
    if (source[key] === undefined || source[key] === null) {
      delete result[key];
    } else if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key] as any);
    } else {
      result[key] = source[key];
    }
  }

  return result;
}
