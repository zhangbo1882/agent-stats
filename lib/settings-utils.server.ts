import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

/**
 * Creates a backup of the settings file
 * @param filePath - Path to the settings file
 * @returns Promise that resolves when backup is created
 */
export async function backupSettings(filePath: string): Promise<void> {
  try {
    const backupPath = `${filePath}.bak`;
    const content = await fs.readFile(filePath, 'utf-8');
    await fs.writeFile(backupPath, content, 'utf-8');
  } catch (error) {
    // If file doesn't exist, that's okay - we'll create it fresh
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }
}

/**
 * Atomically writes content to a file
 * Uses a temporary file and rename to ensure atomicity
 * @param filePath - The target file path
 * @param content - The content to write
 * @returns Promise that resolves when write is complete
 */
export async function atomicWrite(filePath: string, content: string): Promise<void> {
  const tempPath = `${filePath}.tmp`;

  try {
    // Write to temp file
    await fs.writeFile(tempPath, content, 'utf-8');

    // Atomic rename
    await fs.rename(tempPath, filePath);
  } catch (error) {
    // Clean up temp file if something went wrong
    try {
      await fs.unlink(tempPath);
    } catch {
      // Ignore cleanup errors
    }
    throw error;
  }
}

/**
 * Gets the path to the Claude settings directory
 * @returns Path to the Claude settings directory
 */
export function getClaudeSettingsPath(): string {
  const homeDir = os.homedir();
  return path.join(homeDir, '.claude', 'settings.json');
}

/**
 * Validates that a path is within the Claude settings directory
 * @param filePath - The file path to validate
 * @returns true if path is safe, false otherwise
 */
export function isSafePath(filePath: string): boolean {
  const claudeDir = path.join(os.homedir(), '.claude');
  const resolvedPath = path.resolve(filePath);
  const resolvedClaudeDir = path.resolve(claudeDir);

  return resolvedPath.startsWith(resolvedClaudeDir);
}
