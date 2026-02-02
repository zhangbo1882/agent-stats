import * as fs from 'fs';

export interface SkillUsage {
  skillName: string;
  skillId: string;
  usageCount: number;
  lastUsed: string;
}

export interface ClaudeConfig {
  skillUsage?: Record<string, {
    usageCount: number;
    lastUsedAt: string;
  }>;
}

export function parseClaudeConfig(configPath: string): SkillUsage[] {
  const skillUsage: SkillUsage[] = [];

  if (!fs.existsSync(configPath)) {
    return skillUsage;
  }

  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    const config: ClaudeConfig = JSON.parse(content);

    if (!config.skillUsage) {
      return skillUsage;
    }

    for (const [skillId, usage] of Object.entries(config.skillUsage)) {
      skillUsage.push({
        skillName: skillId,
        skillId: skillId,
        usageCount: usage.usageCount,
        lastUsed: new Date(usage.lastUsedAt).toISOString(),
      });
    }

    return skillUsage.sort((a, b) => b.usageCount - a.usageCount);
  } catch (error) {
    console.error('Error parsing Claude config:', error);
    return skillUsage;
  }
}

export function getSkillUsageStats(claudeConfigPath: string): SkillUsage[] {
  return parseClaudeConfig(claudeConfigPath);
}

export function getTopSkills(claudeConfigPath: string, limit: number = 10): SkillUsage[] {
  const stats = getSkillUsageStats(claudeConfigPath);
  return stats.slice(0, limit);
}

export function getSkillUsageByCategory(claudeConfigPath: string): Map<string, SkillUsage[]> {
  const stats = getSkillUsageStats(claudeConfigPath);
  const byCategory = new Map<string, SkillUsage[]>();

  for (const stat of stats) {
    const category = stat.skillName;
    
    if (!byCategory.has(category)) {
      byCategory.set(category, []);
    }
    
    byCategory.get(category)!.push(stat);
  }

  return byCategory;
}
