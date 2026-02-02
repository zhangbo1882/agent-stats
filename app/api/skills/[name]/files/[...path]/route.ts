import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import { ClaudeDataLoader } from '@/lib/data-loader';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ name: string; path: string[] }> }
) {
  try {
    const { name, path: pathSegments } = await params;
    const skillName = decodeURIComponent(name);
    const relativeFilePath = pathSegments.map(decodeURIComponent).join('/');

    // Load all skills to find the one we're looking for
    const dataLoader = new ClaudeDataLoader();
    const allSkills = await dataLoader.loadSkills();
    const skill = allSkills.find(s => s.name === skillName);

    if (!skill) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
    }

    // Use the path from the skill data (works for both local and plugin skills)
    const skillPath = skill.path;

    if (!fs.existsSync(skillPath)) {
      return NextResponse.json({ error: 'Skill path not found' }, { status: 404 });
    }

    // Build the full file path
    const fullPath = path.join(skillPath, relativeFilePath);

    // Security check: ensure the file is within the skill directory
    const resolvedFullPath = path.resolve(fullPath);
    const resolvedSkillPath = path.resolve(skillPath);

    if (!resolvedFullPath.startsWith(resolvedSkillPath)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check if file exists
    if (!fs.existsSync(resolvedFullPath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Check if it's a file (not a directory)
    const stats = fs.statSync(resolvedFullPath);
    if (!stats.isFile()) {
      return NextResponse.json({ error: 'Not a file' }, { status: 400 });
    }

    // Read file content
    const content = fs.readFileSync(resolvedFullPath, 'utf-8');

    return NextResponse.json({
      name: path.basename(resolvedFullPath),
      path: relativeFilePath,
      content,
    });
  } catch (error) {
    console.error('Error reading file:', error);
    return NextResponse.json(
      { error: 'Failed to read file' },
      { status: 500 }
    );
  }
}
