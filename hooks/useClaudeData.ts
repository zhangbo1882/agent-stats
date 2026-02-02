'use client';

import { useState, useEffect } from 'react';
import { ClaudeStats, Settings, Plugin, Marketplace, MCPServer, Plan, Project, Skill, AgentTask, ModelUsage } from '@/lib/types';

export interface ClaudeData {
  stats: ClaudeStats | null;
  settings: Settings | null;
  history: any[] | null;
  plugins: { installed: Plugin[]; marketplaces: Marketplace[] };
  mcp: MCPServer[];
  plans: Plan[];
  projects: Project[];
  debugLogs: string[];
  skills: Array<Skill & { usageCount?: number; lastUsed?: string }>;
  tasks: AgentTask[];
  unifiedModelUsage: Record<string, ModelUsage>;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useClaudeData(): ClaudeData {
  const [data, setData] = useState({
    stats: null as ClaudeStats | null,
    settings: null as Settings | null,
    history: null as any[] | null,
    plugins: { installed: [], marketplaces: [] },
    mcp: [] as MCPServer[],
    plans: [] as Plan[],
    projects: [] as Project[],
    debugLogs: [] as string[],
    skills: [] as Array<Skill & { usageCount?: number; lastUsed?: string }>,
    tasks: [] as AgentTask[],
    unifiedModelUsage: {} as Record<string, ModelUsage>,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/data', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      
      const loadedData = await response.json();
      
      setData(loadedData);
    } catch (err) {
      console.error('Error loading Claude data:', err);
      setError('Failed to load data, please ensure ~/.claude directory exists and is accessible');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return {
    ...data,
    loading,
    error,
    refresh: loadData,
  };
}
