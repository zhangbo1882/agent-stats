import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    // Security check: only allow .txt files (matching data-loader logic)
    if (!filename.endsWith('.txt')) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    // Get Claude config directory
    const homeDir = process.env.HOME || process.env.USERPROFILE || '';
    const claudeDir = path.join(homeDir, '.claude');
    const logPath = path.join(claudeDir, 'debug', filename);

    // Security check: ensure the path is within the Claude directory
    const resolvedLogPath = path.resolve(logPath);
    const resolvedClaudeDir = path.resolve(claudeDir);
    if (!resolvedLogPath.startsWith(resolvedClaudeDir)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check if file exists
    if (!fs.existsSync(resolvedLogPath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Read file content
    const content = fs.readFileSync(resolvedLogPath, 'utf-8');

    // Get file stats
    const stats = fs.statSync(resolvedLogPath);

    return NextResponse.json({
      filename,
      content,
      size: stats.size,
      modified: stats.mtime,
    });
  } catch (error) {
    console.error('Error reading debug log:', error);
    return NextResponse.json(
      { error: 'Failed to read log file' },
      { status: 500 }
    );
  }
}
