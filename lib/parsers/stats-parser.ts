import { ClaudeStats, DailyActivity } from '../types';

export function parseStats(statsData: any): ClaudeStats {
  return {
    version: statsData.version || 0,
    lastComputedDate: statsData.lastComputedDate || '',
    dailyActivity: statsData.dailyActivity || [],
    dailyModelTokens: statsData.dailyModelTokens || [],
    modelUsage: statsData.modelUsage || {},
    totalSessions: statsData.totalSessions || 0,
    totalMessages: statsData.totalMessages || 0,
    longestSession: statsData.longestSession || {
      sessionId: '',
      duration: 0,
      messageCount: 0,
      timestamp: '',
    },
    firstSessionDate: statsData.firstSessionDate || '',
    hourCounts: statsData.hourCounts || {},
  };
}

export function calculateTotalToolCalls(stats: ClaudeStats): number {
  return stats.dailyActivity.reduce((sum, day) => sum + day.toolCallCount, 0);
}

export function calculateActiveDays(stats: ClaudeStats): number {
  return stats.dailyActivity.length;
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

export function getTopActiveDays(stats: ClaudeStats, limit: number = 5): DailyActivity[] {
  return [...stats.dailyActivity]
    .sort((a, b) => b.messageCount - a.messageCount)
    .slice(0, limit);
}
