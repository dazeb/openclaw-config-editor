export interface EnvEntry {
  type: 'var' | 'comment' | 'blank';
  key?: string;
  value?: string;
  raw?: string;
}

/**
 * Parse a .env file text into structured entries.
 * Handles:
 * - KEY=value
 * - KEY="value"
 * - KEY='value'
 * - export KEY=value
 * - # comments
 * - blank lines
 */
export function parseEnv(text: string): EnvEntry[] {
  const lines = text.split('\n');
  const entries: EnvEntry[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Blank line
    if (trimmed === '') {
      entries.push({ type: 'blank' });
      continue;
    }

    // Comment line
    if (trimmed.startsWith('#')) {
      entries.push({ type: 'comment', raw: trimmed });
      continue;
    }

    // Variable line
    let processedLine = trimmed;

    // Strip leading "export "
    if (processedLine.startsWith('export ')) {
      processedLine = processedLine.slice(7).trim();
    }

    const eqIndex = processedLine.indexOf('=');
    if (eqIndex === -1) {
      // Malformed; treat as comment
      entries.push({ type: 'comment', raw: trimmed });
      continue;
    }

    const key = processedLine.slice(0, eqIndex).trim();
    let value = processedLine.slice(eqIndex + 1);

    // Strip quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    entries.push({ type: 'var', key, value });
  }

  return entries;
}

/**
 * Convert structured entries back to .env format.
 */
export function stringifyEnv(entries: EnvEntry[]): string {
  const lines: string[] = [];

  for (const entry of entries) {
    if (entry.type === 'blank') {
      lines.push('');
    } else if (entry.type === 'comment') {
      lines.push(entry.raw || '');
    } else if (entry.type === 'var' && entry.key && entry.value !== undefined) {
      const formatted = formatValue(entry.value);
      lines.push(`${entry.key}=${formatted}`);
    }
  }

  return lines.join('\n');
}

/**
 * Format a value for .env output.
 * - Double-quote if value has spaces, $, #, !, or ;
 * - Otherwise, use as-is
 */
export function formatValue(value: string): string {
  // Check if value needs quoting
  const needsQuotes = /[\s$#!;]/.test(value);

  if (needsQuotes) {
    // Escape any internal quotes
    const escaped = value.replace(/"/g, '\\"');
    return `"${escaped}"`;
  }

  return value;
}
