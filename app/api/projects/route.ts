import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

function getProjectsPath(): string {
  const homeDir = process.env.HOME || process.env.USERPROFILE || '';
  return path.join(homeDir, '.claude', 'projects');
}

/**
 * DELETE /api/projects
 * Delete a project from the stats
 *
 * Request body:
 * {
 *   projectName: string;
 * }
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectName } = body;

    if (!projectName || typeof projectName !== 'string') {
      return NextResponse.json(
        { error: 'Invalid project name' },
        { status: 400 }
      );
    }

    const projectsPath = getProjectsPath();
    const projectPath = path.join(projectsPath, projectName);

    // Check if project directory exists
    try {
      await fs.access(projectPath);
    } catch {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Delete the project directory recursively
    await fs.rm(projectPath, { recursive: true, force: true });

    return NextResponse.json({
      success: true,
      message: `Project "${projectName}" deleted successfully`,
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete project',
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
