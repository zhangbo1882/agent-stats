import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

import { ClaudeStats, Settings, Plugin, Marketplace, MCPServer, Plan, Project, Skill, AgentTask, ModelUsage } from './types';
import { SkillUsage } from './parsers/skill-usage-parser';

import { parseStats, calculateTotalToolCalls, calculateActiveDays, formatDuration } from './parsers/stats-parser';
import { parseSettings } from './parsers/settings-parser';
import { readHistoryFile, extractSessionsFromHistory, groupSessionsByProject, scanProjectSessions } from './parsers/history-parser';
import { readInstalledPlugins, readMarketplaces, scanMCPConfigs } from './parsers/plugin-parser';
import { getAllMCPConfigs } from './parsers/mcp-parser';
import { readAllPlans } from './parsers/plan-parser';
import { getSkillUsageStats } from './parsers/skill-usage-parser';
import { readAllTasks } from './parsers/task-parser';
import { ModelUsageUnifier } from './model-usage-unifier';
import { APIUsageStats } from './types';

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
    const skills: Skill[] = [];

    // Load skills from ~/.claude/skills directory (local skills)
    const localSkillsPath = path.join(this.claudePath, 'skills');

    if (this.ensurePathExists(localSkillsPath)) {
      try {
        const files = fs.readdirSync(localSkillsPath, { withFileTypes: true })
          .filter(dirent => dirent.isSymbolicLink() || dirent.isDirectory())
          .map(dirent => dirent.name);

        for (const file of files) {
          const skillPath = path.join(localSkillsPath, file);
          const targetPath = fs.readlinkSync(skillPath);
          // Resolve relative symlink target to absolute path
          const absoluteTargetPath = path.resolve(path.dirname(skillPath), targetPath);
          const description = this.extractSkillDescription(absoluteTargetPath);

          skills.push({
            name: file,
            path: absoluteTargetPath,
            description,
            source: 'local',
          });
        }
      } catch (error) {
        console.error('Error loading local skills:', error);
      }
    }

    // Load skills from ~/.claude/plugins/cache directory (plugin skills)
    const pluginsCachePath = path.join(this.claudePath, 'plugins', 'cache');

    if (this.ensurePathExists(pluginsCachePath)) {
      try {
        // Find all marketplace/plugin directories (e.g., zai-coding-plugins)
        const marketplaceDirs = fs.readdirSync(pluginsCachePath, { withFileTypes: true })
          .filter(dirent => dirent.isDirectory())
          .map(dirent => dirent.name);

        for (const marketplaceDir of marketplaceDirs) {
          const marketplacePath = path.join(pluginsCachePath, marketplaceDir);

          // Find all plugin directories (e.g., glm-plan-usage, glm-plan-bug)
          const pluginDirs = fs.readdirSync(marketplacePath, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

          for (const pluginDir of pluginDirs) {
            const pluginPath = path.join(marketplacePath, pluginDir);

            // Find all version directories (e.g., 0.0.1)
            const versionDirs = fs.readdirSync(pluginPath, { withFileTypes: true })
              .filter(dirent => dirent.isDirectory())
              .map(dirent => dirent.name);

            for (const versionDir of versionDirs) {
              const versionPath = path.join(pluginPath, versionDir);
              const skillsDir = path.join(versionPath, 'skills');

              if (!fs.existsSync(skillsDir)) {
                continue;
              }

              // Find all skill directories
              const skillDirs = fs.readdirSync(skillsDir, { withFileTypes: true })
                .filter(dirent => dirent.isDirectory())
                .map(dirent => dirent.name);

              for (const skillDir of skillDirs) {
                const skillPath = path.join(skillsDir, skillDir);
                const skillMdPath = path.join(skillPath, 'SKILL.md');

                if (!fs.existsSync(skillMdPath)) {
                  continue;
                }

                // Parse SKILL.md to get name and description
                const { name, description } = this.extractSkillInfo(skillMdPath);

                // For plugin skills, use the format "plugin-name:skill-name" to match usage data in ~/.claude.json
                const skillName = name || skillDir;
                const fullSkillName = `${pluginDir}:${skillName}`;

                skills.push({
                  name: fullSkillName,
                  path: skillPath,
                  description,
                  source: 'plugin',
                });
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading plugin skills:', error);
      }
    }

    return skills;
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

  /**
   * Load API usage configuration from Claude settings
   */
  private async loadUsageConfig(): Promise<{ baseUrl: string; authToken: string } | null> {
    const settingsPath = path.join(os.homedir(), '.claude', 'settings.json');

    if (!fs.existsSync(settingsPath)) {
      return null;
    }

    try {
      const content = fs.readFileSync(settingsPath, 'utf-8');
      const settings = JSON.parse(content);

      const baseUrl = settings.env?.ANTHROPIC_BASE_URL;
      const authToken = settings.env?.ANTHROPIC_AUTH_TOKEN;

      if (!baseUrl || !authToken) {
        return null;
      }

      return { baseUrl, authToken };
    } catch (error) {
      console.error('Failed to load usage config:', error);
      return null;
    }
  }

  /**
   * Query API usage from ZHIPU/ZAI API
   */
  private async queryAPIUsage(config: { baseUrl: string; authToken: string }): Promise<APIUsageStats | null> {
    const baseUrl = config.baseUrl;
    const authToken = config.authToken;

    // Detect platform
    let platform: 'ZHIPU' | 'ZAI' | null = null;
    if (baseUrl.includes('open.bigmodel.cn') || baseUrl.includes('dev.bigmodel.cn')) {
      platform = 'ZHIPU';
    } else if (baseUrl.includes('api.z.ai')) {
      platform = 'ZAI';
    } else {
      return null;
    }

    try {
      const parsedBaseUrl = new URL(baseUrl);
      const baseDomain = `${parsedBaseUrl.protocol}//${parsedBaseUrl.host}`;

      // API endpoints
      const modelUsageUrl = `${baseDomain}/api/monitor/usage/model-usage`;
      const toolUsageUrl = `${baseDomain}/api/monitor/usage/tool-usage`;
      const quotaLimitUrl = `${baseDomain}/api/monitor/usage/quota/limit`;

      // Time window: last 24 hours
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, now.getHours(), 0, 0, 0);
      const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 59, 59, 999);

      const formatDateTime = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      };

      const startTime = formatDateTime(startDate);
      const endTime = formatDateTime(endDate);
      const queryParams = `?startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}`;

      // Fetch all data in parallel
      const [modelUsageResponse, toolUsageResponse, quotaLimitResponse] = await Promise.all([
        fetch(modelUsageUrl + queryParams, {
          headers: {
            'Authorization': authToken,
            'Accept-Language': 'en-US,en',
            'Content-Type': 'application/json',
          },
        }),
        fetch(toolUsageUrl + queryParams, {
          headers: {
            'Authorization': authToken,
            'Accept-Language': 'en-US,en',
            'Content-Type': 'application/json',
          },
        }),
        fetch(quotaLimitUrl + queryParams, {
          headers: {
            'Authorization': authToken,
            'Accept-Language': 'en-US,en',
            'Content-Type': 'application/json',
          },
        }),
      ]);

      const [modelUsageData, toolUsageData, quotaLimitData] = await Promise.all([
        modelUsageResponse.json(),
        toolUsageResponse.json(),
        quotaLimitResponse.json(),
      ]);

      // Parse model usage
      const hourlyUsage: { hour: string; callCount: number; tokenCount: number }[] = [];
      let totalCalls = 0;
      let totalTokens = 0;

      const apiData = modelUsageData.data || modelUsageData;
      if (apiData && apiData.x_time && Array.isArray(apiData.x_time)) {
        const times = apiData.x_time;
        const counts = apiData.modelCallCount || [];
        const tokens = apiData.tokensUsage || [];

        for (let i = 0; i < times.length; i++) {
          const count = counts[i] || 0;
          const token = tokens[i] || 0;
          hourlyUsage.push({
            hour: times[i],
            callCount: count,
            tokenCount: token,
          });
          totalCalls += count;
          totalTokens += token;
        }
      }

      return {
        platform,
        modelUsage: hourlyUsage,
        totalCalls,
        totalTokens,
        toolUsage: [],
        quotaLimits: [],
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Failed to query API usage:', error);
      return null;
    }
  }

  async loadAPIUsage(): Promise<APIUsageStats | null> {
    try {
      const config = await this.loadUsageConfig();
      if (!config) {
        return null;
      }
      return await this.queryAPIUsage(config);
    } catch (error) {
      console.error('Error loading API usage:', error);
      return null;
    }
  }

  async loadUnifiedModelUsage(): Promise<Record<string, ModelUsage>> {
    try {
      const [stats, apiUsage] = await Promise.all([
        this.loadStats(),
        this.loadAPIUsage()
      ]);

      if (!stats) {
        return {};
      }

      return ModelUsageUnifier.mergeModelUsage(
        stats.modelUsage || {},
        apiUsage
      );
    } catch (error) {
      console.error('Error loading unified model usage:', error);
      return {};
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

  private extractSkillInfo(skillMdPath: string): { name?: string; description?: string } {
    try {
      const content = fs.readFileSync(skillMdPath, 'utf-8');
      const lines = content.split('\n');

      // Parse frontmatter (between --- markers)
      let inFrontmatter = false;
      let name: string | undefined = undefined;
      let description: string | undefined = undefined;

      for (const line of lines) {
        if (line.trim() === '---') {
          inFrontmatter = !inFrontmatter;
          continue;
        }

        if (inFrontmatter) {
          if (line.startsWith('name:')) {
            name = line.replace(/^name:\s*/, '').trim().replace(/^["']|["']$/g, '');
          } else if (line.startsWith('description:')) {
            description = line.replace(/^description:\s*/, '').trim().replace(/^["']|["']$/g, '');
          }
        }
      }

      return { name, description };
    } catch {
      return { name: undefined, description: undefined };
    }
  }

  async loadAllData() {
    const [stats, settings, history, plugins, mcp, plans, projects, debugLogs, skills, skillUsage, tasks, unifiedModelUsage] = await Promise.all([
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
      this.loadUnifiedModelUsage(),
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
      unifiedModelUsage,
    };
  }
}

export const dataLoader = new ClaudeDataLoader();
