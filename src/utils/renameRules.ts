export interface RenameOptions {
  mode: 'random' | 'custom';
  // Random mode options
  randomLength: number;
  randomPrefix: string;
  randomSuffix: string;
  // Custom mode options
  findText: string;
  replaceText: string;
  prefix: string;
  suffix: string;
  truncateLength: number; // 0 means no limit
  addDate: boolean;
  dateFormat: 'YYYYMMDD' | 'YYYY-MM-DD' | 'YYYYMMDD_HHmmss';
  addIndex: boolean;
  startIndex: number;
}

// Generate random string
export function generateRandomString(length: number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Format date
export function getFormattedDate(format: RenameOptions['dateFormat']): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  if (format === 'YYYYMMDD') {
    return `${year}${month}${day}`;
  } else if (format === 'YYYY-MM-DD') {
    return `${year}-${month}-${day}`;
  } else {
    return `${year}${month}${day}_${hours}${minutes}${seconds}`;
  }
}

// Apply rename rule to a single file
export function applyRenameRule(
  filename: string,
  options: RenameOptions,
  index: number,
  randomCache?: Set<string>
): string {
  // Extract extension
  const dotIndex = filename.lastIndexOf('.');
  let name = dotIndex === -1 ? filename : filename.substring(0, dotIndex);
  const ext = dotIndex === -1 ? '' : filename.substring(dotIndex);

  if (options.mode === 'random') {
    let randName = '';
    // Prevent duplicate random strings
    do {
      randName = generateRandomString(options.randomLength);
    } while (randomCache && randomCache.has(randName));
    
    if (randomCache) {
      randomCache.add(randName);
    }

    const prefix = options.randomPrefix || '';
    const suffix = options.randomSuffix || '';
    return `${prefix}${randName}${suffix}${ext}`;
  }

  // Custom rename options logic
  // 1. Find and replace text
  if (options.findText) {
    // Escape regex characters
    const escaped = options.findText.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(escaped, 'g');
    name = name.replace(regex, options.replaceText || '');
  }

  // 2. Truncate length
  if (options.truncateLength > 0 && name.length > options.truncateLength) {
    name = name.substring(0, options.truncateLength);
  }

  // 3. Add date
  if (options.addDate) {
    const dateStr = getFormattedDate(options.dateFormat);
    name = `${name}_${dateStr}`;
  }

  // 4. Add index
  if (options.addIndex) {
    const idxStr = String(options.startIndex + index);
    name = `${name}_${idxStr}`;
  }

  // 5. Add prefix & suffix
  const prefix = options.prefix || '';
  const suffix = options.suffix || '';

  return `${prefix}${name}${suffix}${ext}`;
}

// Helper to rename an entire list with uniqueness checks and memoization
export function previewRenameList(
  filenames: string[],
  options: RenameOptions
): string[] {
  const result: string[] = [];
  const randomCache = new Set<string>();

  for (let i = 0; i < filenames.length; i++) {
    result.push(applyRenameRule(filenames[i], options, i, randomCache));
  }
  
  return result;
}
