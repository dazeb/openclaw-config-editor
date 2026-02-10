/**
 * Get a nested value from an object using a dot-separated path.
 * Supports keys with hyphens (e.g. "plugins.entries.chromadb-memory.enabled").
 */
export function getPath(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

/**
 * Set a nested value in an object using a dot-separated path.
 * Returns a new object (immutable update).
 */
export function setPath(
  obj: Record<string, unknown>,
  path: string,
  value: unknown
): Record<string, unknown> {
  const parts = path.split('.');
  const result = deepClone(obj) as Record<string, unknown>;
  let current = result as Record<string, unknown>;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (current[part] === null || current[part] === undefined || typeof current[part] !== 'object') {
      current[part] = {};
    }
    current = current[part] as Record<string, unknown>;
  }

  const lastPart = parts[parts.length - 1];
  current[lastPart] = value;
  return result;
}

/**
 * Deep clone a value using JSON serialization.
 */
export function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

/**
 * Validate a field value against its schema definition.
 */
export function validateField(
  value: unknown,
  type: string,
  options?: string[],
  min?: number,
  max?: number,
  required?: boolean
): string | null {
  if (value === undefined || value === null || value === '') {
    if (required) return 'This field is required.';
    return null;
  }

  switch (type) {
    case 'boolean':
      if (typeof value !== 'boolean') return 'Must be true or false.';
      break;
    case 'number':
      if (typeof value !== 'number' || isNaN(value)) return 'Must be a valid number.';
      if (min !== undefined && value < min) return `Must be at least ${min}.`;
      if (max !== undefined && value > max) return `Must be at most ${max}.`;
      break;
    case 'enum':
      if (options && !options.includes(value as string)) {
        return `Must be one of: ${options.join(', ')}.`;
      }
      break;
    case 'array':
      if (!Array.isArray(value)) return 'Must be an array.';
      break;
    case 'string':
      if (typeof value !== 'string') return 'Must be a string.';
      break;
  }
  return null;
}

/**
 * Download an object as a JSON file.
 */
export function downloadJson(data: unknown, filename: string): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Copy text to clipboard.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    return true;
  }
}

/**
 * Remove sensitive fields from a config object.
 */
export function clearSensitiveFields(
  config: Record<string, unknown>,
  sensitiveFields: string[]
): Record<string, unknown> {
  let result = deepClone(config);
  for (const path of sensitiveFields) {
    result = setPath(result, path, '') as Record<string, unknown>;
  }
  return result;
}
