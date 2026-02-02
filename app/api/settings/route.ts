import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import {
  getClaudeSettingsPath,
  isSafePath,
  backupSettings,
  atomicWrite,
} from '@/lib/settings-utils.server';
import { deepMerge } from '@/lib/settings-utils';

/**
 * GET /api/settings
 * Fetches the current settings
 */
export async function GET() {
  try {
    const settingsPath = getClaudeSettingsPath();

    // Check if settings file exists
    try {
      await fs.access(settingsPath);
    } catch {
      // File doesn't exist, return empty settings
      return NextResponse.json({});
    }

    const content = await fs.readFile(settingsPath, 'utf-8');
    const settings = JSON.parse(content);

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error reading settings:', error);
    return NextResponse.json(
      { error: 'Failed to read settings', message: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/settings
 * Updates the settings file
 *
 * Request body:
 * {
 *   env?: { [key: string]: string | undefined }
 *   enabledPlugins?: { [key: string]: boolean | undefined }
 *   permissions?: any
 *   [key: string]: any
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const updates = await request.json();

    // Validate input
    if (!updates || typeof updates !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body', message: 'Request body must be an object' },
        { status: 400 }
      );
    }

    const settingsPath = getClaudeSettingsPath();

    // Validate path is safe
    if (!isSafePath(settingsPath)) {
      return NextResponse.json(
        { error: 'Invalid path', message: 'Settings path is not safe' },
        { status: 403 }
      );
    }

    // Ensure directory exists
    const settingsDir = path.dirname(settingsPath);
    try {
      await fs.mkdir(settingsDir, { recursive: true });
    } catch (mkdirError) {
      return NextResponse.json(
        { error: 'Failed to create settings directory', message: (mkdirError as Error).message },
        { status: 500 }
      );
    }

    // Read existing settings
    let existingSettings = {};
    try {
      const content = await fs.readFile(settingsPath, 'utf-8');
      existingSettings = JSON.parse(content);
    } catch (readError) {
      if ((readError as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw readError;
      }
      // File doesn't exist, start with empty object
    }

    // Create backup before making changes
    try {
      await backupSettings(settingsPath);
    } catch (backupError) {
      console.warn('Failed to create backup:', backupError);
      // Continue anyway - backup failure shouldn't block the update
    }

    // Deep merge updates
    // deepMerge handles null/undefined values by deleting keys
    let mergedSettings = deepMerge(existingSettings, updates);

    // Write updated settings atomically
    const content = JSON.stringify(mergedSettings, null, 2);
    await atomicWrite(settingsPath, content);

    return NextResponse.json({
      success: true,
      settings: mergedSettings,
      message: 'Settings updated successfully',
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      {
        error: 'Failed to update settings',
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/settings
 * Alias for POST for compatibility
 */
export async function PUT(request: NextRequest) {
  return POST(request);
}
