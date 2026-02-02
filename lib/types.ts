export interface DailyActivity {
  date: string;
  messageCount: number;
  sessionCount: number;
  toolCallCount: number;
  [key: string]: string | number;
}

export interface DailyModelTokens {
  date: string;
  tokensByModel: Record<string, number>;
}

export interface ModelUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadInputTokens: number;
  cacheCreationInputTokens: number;
  webSearchRequests: number;
  costUSD: number;
  contextWindow: number;
  maxOutputTokens: number;
}

export interface LongestSession {
  sessionId: string;
  duration: number;
  messageCount: number;
  timestamp: string;
  project?: string;
}

export interface HourCounts {
  [hour: string]: number;
}

export interface ClaudeStats {
  version: number;
  lastComputedDate: string;
  dailyActivity: DailyActivity[];
  dailyModelTokens: DailyModelTokens[];
  modelUsage: Record<string, ModelUsage>;
  totalSessions: number;
  totalMessages: number;
  longestSession: LongestSession;
  firstSessionDate: string;
  hourCounts: HourCounts;
}

export interface Settings {
  env?: Record<string, string | undefined>;
  enabledPlugins?: Record<string, boolean>;
  permissions?: {
    defaultMode?: string;
    [key: string]: any;
  };
  [key: string]: any; // Allow arbitrary additional fields
}

export interface HistoryEntry {
  display: string;
  pastedContents: Record<string, any>;
  timestamp: number;
  project?: string;
  sessionId: string;
}

export interface Plugin {
  name: string;
  marketplace: string;
  version: string;
  installedAt: string;
  lastUpdated: string;
  gitCommitSha: string;
  installPath: string;
}

export interface Marketplace {
  name: string;
  source: string;
  installLocation: string;
  lastUpdated: string;
}

export interface MCPServer {
  name: string;
  type: string;
  url?: string;
  tools?: string[];
  source?: string;
}

export interface Plan {
  id: string;
  title: string;
  summary: string;
  filesToModify: string[];
  createdAt: string;
  content: string;
  project?: string;
}

export interface Session {
  id: string;
  timestamp: string;
  messageCount: number;
  project?: string;
  duration?: number;
}

export interface Project {
  name: string;
  path: string;
  sessionCount: number;
  lastActive?: string;
}

export interface DebugLog {
  id: string;
  timestamp: string;
  level: string;
  message: string;
}

export interface Skill {
  name: string;
  path: string;
  description?: string;
  category?: string;
  usageCount?: number;
  lastUsed?: string;
}

export interface TodoItem {
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
  activeForm: string;
}

export interface AgentTask {
  sessionId: string;
  agentId: string;
  todos: TodoItem[];
  filename: string;
  createdAt?: string;
}
