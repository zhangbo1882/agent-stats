import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    const skillName = decodeURIComponent(name);
    const skillsPath = path.join(process.env.HOME || '', '.claude', 'skills');

    // Get the actual path from the symlink
    const skillLinkPath = path.join(skillsPath, skillName);

    if (!fs.existsSync(skillLinkPath)) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
    }

    // Resolve the symlink to get the actual path
    const relativePath = fs.readlinkSync(skillLinkPath);
    const skillPath = path.resolve(path.dirname(skillLinkPath), relativePath);

    // Try to read SKILL.md
    const skillMdPath = path.join(skillPath, 'SKILL.md');
    let skillMdContent = '';
    if (fs.existsSync(skillMdPath)) {
      skillMdContent = fs.readFileSync(skillMdPath, 'utf-8');
    }

    // Try to read AGENTS.md (full documentation)
    const agentsMdPath = path.join(skillPath, 'AGENTS.md');
    let agentsMdContent = '';
    if (fs.existsSync(agentsMdPath)) {
      agentsMdContent = fs.readFileSync(agentsMdPath, 'utf-8');
    }

    // Check if there's a rules directory
    const rulesPath = path.join(skillPath, 'rules');
    let rules: string[] = [];
    if (fs.existsSync(rulesPath)) {
      rules = fs.readdirSync(rulesPath)
        .filter(file => file.endsWith('.md'))
        .sort();
    }

    // Recursively read directory structure
    function readDirectory(dirPath: string, relativePath = ''): any[] {
      const items: any[] = [];
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        // Skip node_modules and hidden files
        if (entry.name.startsWith('.') || entry.name === 'node_modules') {
          continue;
        }

        const fullEntryPath = path.join(dirPath, entry.name);
        const entryRelativePath = path.join(relativePath, entry.name);

        if (entry.isDirectory()) {
          items.push({
            name: entry.name,
            type: 'directory',
            path: entryRelativePath,
            children: readDirectory(fullEntryPath, entryRelativePath),
          });
        } else if (entry.isFile()) {
          items.push({
            name: entry.name,
            type: 'file',
            path: entryRelativePath,
            extension: path.extname(entry.name),
          });
        }
      }

      return items.sort((a, b) => {
        // Directories first, then files
        if (a.type === 'directory' && b.type === 'file') return -1;
        if (a.type === 'file' && b.type === 'directory') return 1;
        // Then alphabetically
        return a.name.localeCompare(b.name);
      });
    }

    const directoryStructure = readDirectory(skillPath);

    return NextResponse.json({
      name: skillName,
      path: skillPath,
      skillMd: skillMdContent,
      agentsMd: agentsMdContent,
      rules,
      directoryStructure,
    });
  } catch (error) {
    console.error('Error loading skill:', error);
    return NextResponse.json(
      { error: 'Failed to load skill' },
      { status: 500 }
    );
  }
}
