import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

import { ClaudeStats, Settings, Plugin, Marketplace, MCPServer, Plan, Project, Skill, AgentTask } from './types';
import { SkillUsage } from './parsers/skill-usage-parser';

import { parseStats, calculateTotalToolCalls, calculateActiveDays, formatDuration } from './parsers/stats-parser';
import { parseSettings } from './parsers/settings-parser';
import { readHistoryFile, extractSessionsFromHistory, groupSessionsByProject, scanProjectSessions } from './parsers/history-parser';
import { readInstalledPlugins, readMarketplaces, scanMCPConfigs } from './parsers/plugin-parser';
import { getAllMCPConfigs } from './parsers/mcp-parser';
import { readAllPlans } from './parsers/plan-parser';
import { getSkillUsageStats } from './parsers/skill-usage-parser';
import { readAllTasks } from './parsers/task-parser';

export class ClaudeDataLoader {
  private claudePath: string;

  constructor() {
    this.claudePath = path.join(os.homedir(), '.claude');
  }

  private ensurePathExists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }

  async loadStats(): Promise<ClaudeStats | null> {
    const statsPath = path.join(this.claudePath, 'stats-cache.json');

    if (!this.ensurePathExists(statsPath)) {
      return null;
    }

    try {
      const content = fs.readFileSync(statsPath, 'utf-8');
      const data = JSON.parse(content);
      return parseStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
      return null;
    }
  }

  async loadSettings(): Promise<Settings | null> {
    const settingsPath = path.join(this.claudePath, 'settings.json');

    if (!this.ensurePathExists(settingsPath)) {
      return null;
    }

    try {
      const content = fs.readFileSync(settingsPath, 'utf-8');
      const data = JSON.parse(content);
      return parseSettings(data);
    } catch (error) {
      console.error('Error loading settings:', error);
      return null;
    }
  }

  async loadHistory(): Promise<{ entries: any[], sessions: any[] } | null> {
    const historyPath = path.join(this.claudePath, 'history.jsonl');

    if (!this.ensurePathExists(historyPath)) {
      return null;
    }

    try {
      const entries = readHistoryFile(historyPath);
      const sessions = extractSessionsFromHistory(entries);
      return { entries, sessions };
    } catch (error) {
      console.error('Error loading history:', error);
      return null;
    }
  }

  async loadPlugins(): Promise<{ installed: Plugin[], marketplaces: Marketplace[] }> {
    const pluginsPath = path.join(this.claudePath, 'plugins');

    try {
      const installed = readInstalledPlugins(pluginsPath);
      const marketplaces = readMarketplaces(pluginsPath);
      return { installed, marketplaces };
    } catch (error) {
      console.error('Error loading plugins:', error);
      return { installed: [], marketplaces: [] };
    }
  }

  async loadMCP(): Promise<MCPServer[]> {
    const pluginsPath = path.join(this.claudePath, 'plugins', 'marketplaces');

    try {
      const mcpConfigPaths = scanMCPConfigs(pluginsPath);
      const servers = getAllMCPConfigs(mcpConfigPaths);
      return servers;
    } catch (error) {
      console.error('Error loading MCP:', error);
      return [];
    }
  }

  async loadPlans(): Promise<Plan[]> {
    const plansPath = path.join(this.claudePath, 'plans');

    try {
      return readAllPlans(plansPath);
    } catch (error) {
      console.error('Error loading plans:', error);
      return [];
    }
  }

  async loadProjects(): Promise<Project[]> {
    const projectsPath = path.join(this.claudePath, 'projects');

    if (!this.ensurePathExists(projectsPath)) {
      return [];
    }

    try {
      const projectDirs = fs.readdirSync(projectsPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

      const projects: Project[] = [];

      for (const projectDir of projectDirs) {
        const projectPath = path.join(projectsPath, projectDir);
        const files = fs.readdirSync(projectPath);
        const sessionCount = files.filter(f => f.endsWith('.jsonl')).length;

        // Convert directory name back to friendly project name
        // e.g., "-Users-zhangbo-Public-go-github-com-agent-stats" -> "agent-stats"
        const displayName = this.formatProjectName(projectDir);

        // Get last modified time for the project
        const stats = fs.statSync(projectPath);
        const lastActive = stats.mtime;

        projects.push({
          name: displayName,
          path: projectDir,
          sessionCount,
          lastActive: lastActive.toISOString(),
        });
      }

      return projects.sort((a, b) => b.sessionCount - a.sessionCount);
    } catch (error) {
      console.error('Error loading projects:', error);
      return [];
    }
  }

  /**
   * Convert Claude's project directory name to a friendly display name
   * e.g., "-Users-zhangbo-Public-go-github-com-agent-stats" -> "agent-stats"
   * e.g., "-Users-zhangbo--claude" -> ".claude"
   * e.g., "-Users-zhangbo-WeChatProjects-miniprogram-1" -> "miniprogram-1"
   * e.g., "-Users-zhangbo-Public-go-github-com-mytrader" -> "mytrader"
   */
  private formatProjectName(dirName: string): string {
    // Remove leading dash and split by dashes
    const parts = dirName.replace(/^-/, '').split('-');

    // Common path prefixes and patterns to skip
    const skipPatterns = [
      'Users', 'home', 'mnt', 'var',  // Unix paths
      'zhangbo',  // Username
      'Public', 'Private', 'Shared',  // Common folder names
      'go', 'src',  // Language folders
      'github', 'com', 'org', 'io',  // Domain parts
      'WeChatProjects', 'Documents', 'Downloads', 'Desktop',  // Common user folders
    ];

    // Find the last meaningful part
    for (let i = parts.length - 1; i >= 0; i--) {
      const part = parts[i];

      // Skip empty parts (from double dashes like "--claude")
      if (!part || part.length === 0) {
        continue;
      }

      // Skip common path prefixes
      if (skipPatterns.includes(part)) {
        continue;
      }

      // Found a meaningful part - use it
      // Check if the previous part is also meaningful (e.g., "miniprogram-1", "agent-stats")
      if (i > 0 && parts[i - 1] && !skipPatterns.includes(parts[i - 1])) {
        // Check if we should include even more parts (e.g., "go-github-com-agent-stats")
        if (i > 1 && parts[i - 2] && !skipPatterns.includes(parts[i - 2])) {
          return `${parts[i - 2]}-${parts[i - 1]}-${part}`;
        }
        return `${parts[i - 1]}-${part}`;
      }

      return part;
    }

    return dirName;
  }

  async loadDebugLogs(): Promise<string[]> {
    const debugPath = path.join(this.claudePath, 'debug');

    if (!this.ensurePathExists(debugPath)) {
      return [];
    }

    try {
      const files = fs.readdirSync(debugPath)
        .filter(file => file.endsWith('.txt'))
        .sort((a, b) => {
          const statA = fs.statSync(path.join(debugPath, a));
          const statB = fs.statSync(path.join(debugPath, b));
          return statB.mtime.getTime() - statA.mtime.getTime();
        });

      return files.slice(0, 50); // Limit to 50 most recent
    } catch (error) {
      console.error('Error loading debug logs:', error);
      return [];
    }
  }

  async loadDebugLogContent(filename: string): Promise<string | null> {
    const debugPath = path.join(this.claudePath, 'debug', filename);

    if (!this.ensurePathExists(debugPath)) {
      return null;
    }

    try {
      return fs.readFileSync(debugPath, 'utf-8');
    } catch (error) {
      console.error('Error loading debug log content:', error);
      return null;
    }
  }

  async loadSkills(): Promise<Skill[]> {
    const skillsPath = path.join(this.claudePath, 'skills');

    if (!this.ensurePathExists(skillsPath)) {
      return [];
    }

    try {
      const files = fs.readdirSync(skillsPath, { withFileTypes: true })
        .filter(dirent => dirent.isSymbolicLink() || dirent.isDirectory())
        .map(dirent => dirent.name);

      const skills: Skill[] = [];

      for (const file of files) {
        const skillPath = path.join(skillsPath, file);
        const targetPath = fs.readlinkSync(skillPath);
        const description = this.extractSkillDescription(targetPath);

        skills.push({
          name: file,
          path: targetPath,
          description,
        });
      }

      return skills;
    } catch (error) {
      console.error('Error loading skills:', error);
      return [];
    }
  }

  async loadSkillUsage(): Promise<SkillUsage[]> {
    const configPath = path.join(os.homedir(), '.claude.json');

    try {
      return getSkillUsageStats(configPath);
    } catch (error) {
      console.error('Error loading skill usage:', error);
      return [];
    }
  }

  async loadTasks(): Promise<AgentTask[]> {
    const todosPath = path.join(this.claudePath, 'todos');

    try {
      return readAllTasks(todosPath);
    } catch (error) {
      console.error('Error loading tasks:', error);
      return [];
    }
  }

  private extractSkillDescription(skillPath: string): string | undefined {
    try {
      const readmePath = path.join(skillPath, 'README.md');
      if (fs.existsSync(readmePath)) {
        const content = fs.readFileSync(readmePath, 'utf-8');
        const lines = content.split('\n');
        for (const line of lines) {
          if (line.trim() && !line.startsWith('#')) {
            return line.trim();
          }
        }
      }
    } catch {
      // Ignore errors
    }
    return undefined;
  }

  async loadAllData() {
    const [stats, settings, history, plugins, mcp, plans, projects, debugLogs, skills, skillUsage, tasks] = await Promise.all([
      this.loadStats(),
      this.loadSettings(),
      this.loadHistory(),
      this.loadPlugins(),
      this.loadMCP(),
      this.loadPlans(),
      this.loadProjects(),
      this.loadDebugLogs(),
      this.loadSkills(),
      this.loadSkillUsage(),
      this.loadTasks(),
    ]);

    // Merge skill usage into skills
    const skillUsageMap = new Map<string, { usageCount: number; lastUsed: string }>();
    for (const usage of skillUsage) {
      skillUsageMap.set(usage.skillName, {
        usageCount: usage.usageCount,
        lastUsed: usage.lastUsed,
      });
    }

    const skillsWithUsage = skills.map(skill => ({
      ...skill,
      usageCount: skillUsageMap.get(skill.name)?.usageCount,
      lastUsed: skillUsageMap.get(skill.name)?.lastUsed,
    }));

    return {
      stats,
      settings,
      history,
      plugins,
      mcp,
      plans,
      projects,
      debugLogs,
      skills: skillsWithUsage,
      tasks,
    };
  }
}

export const dataLoader = new ClaudeDataLoader();
