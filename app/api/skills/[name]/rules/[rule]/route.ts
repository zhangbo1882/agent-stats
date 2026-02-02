import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import { ClaudeDataLoader } from '@/lib/data-loader';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ name: string; rule: string }> }
) {
  try {
    const { name, rule } = await params;
    const skillName = decodeURIComponent(name);
    const ruleName = decodeURIComponent(rule);

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
