import { MCPServer } from '../types';
import * as fs from 'fs';

export function parseMCPConfig(mcpData: any): MCPServer[] {
  const servers: MCPServer[] = [];

  if (!mcpData || typeof mcpData !== 'object') {
    return servers;
  }

  for (const [name, config] of Object.entries(mcpData)) {
    if (config && typeof config === 'object') {
      const server: MCPServer = {
        name: name,
        type: (config as any).type || 'unknown',
        url: (config as any).url,
        source: (config as any).source,
      };

      // Extract tools if available
      if ((config as any).tools && Array.isArray((config as any).tools)) {
        server.tools = (config as any).tools;
      }

      servers.push(server);
    }
  }

  return servers;
}

export function readMCPConfig(filePath: string): MCPServer[] {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);
    return parseMCPConfig(data);
  } catch {
    return [];
  }
}

export function getAllMCPConfigs(configPaths: string[]): MCPServer[] {
  const allServers: MCPServer[] = [];

  for (const configPath of configPaths) {
    const servers = readMCPConfig(configPath);
    allServers.push(...servers);
  }

  // Remove duplicates based on name
  const uniqueServers = new Map<string, MCPServer>();
  for (const server of allServers) {
    uniqueServers.set(server.name, server);
  }

  return Array.from(uniqueServers.values());
}

export function groupMCPByType(servers: MCPServer[]): Map<string, MCPServer[]> {
  const grouped = new Map<string, MCPServer[]>();

  for (const server of servers) {
    const type = server.type || 'unknown';
    if (!grouped.has(type)) {
      grouped.set(type, []);
    }
    grouped.get(type)!.push(server);
  }

  return grouped;
}
