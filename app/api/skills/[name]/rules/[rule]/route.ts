import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ name: string; rule: string }> }
) {
  try {
    const { name, rule } = await params;
    const skillName = decodeURIComponent(name);
    const ruleName = decodeURIComponent(rule);
    const skillsPath = path.join(process.env.HOME || '', '.claude', 'skills');

    // Get the actual path from the symlink
    const skillLinkPath = path.join(skillsPath, skillName);

    if (!fs.existsSync(skillLinkPath)) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
    }

    // Resolve the symlink to get the actual path
    const relativePath = fs.readlinkSync(skillLinkPath);
    const skillPath = path.resolve(path.dirname(skillLinkPath), relativePath);

    // Read the rule file
    const ruleFilePath = path.join(skillPath, 'rules', ruleName);

    if (!fs.existsSync(ruleFilePath)) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    const content = fs.readFileSync(ruleFilePath, 'utf-8');

    return NextResponse.json({ content });
  } catch (error) {
    console.error('Error loading rule:', error);
    return NextResponse.json(
      { error: 'Failed to load rule' },
      { status: 500 }
    );
  }
}
