import { Plugin, Marketplace } from '../types';
import * as fs from 'fs';
import * as path from 'path';

export function parseInstalledPlugins(pluginsData: any): Plugin[] {
  const plugins: Plugin[] = [];

  if (!pluginsData.plugins) {
    return plugins;
  }

  for (const [key, pluginList] of Object.entries(pluginsData.plugins)) {
    if (Array.isArray(pluginList)) {
      for (const plugin of pluginList) {
        if (plugin && typeof plugin === 'object') {
          const [name, marketplace] = key.split('@');
          
          plugins.push({
            name: name || key,
            marketplace: marketplace || 'unknown',
            version: plugin.version || '0.0.0',
            installedAt: plugin.installedAt || '',
            lastUpdated: plugin.lastUpdated || '',
            gitCommitSha: plugin.gitCommitSha || '',
            installPath: plugin.installPath || '',
          });
        }
      }
    }
  }

  return plugins.sort((a, b) => 
    new Date(b.installedAt).getTime() - new Date(a.installedAt).getTime()
  );
}

export function parseMarketplaces(marketplacesData: any): Marketplace[] {
  const marketplaces: Marketplace[] = [];

  if (!marketplacesData) {
    return marketplaces;
  }

  for (const [name, data] of Object.entries(marketplacesData)) {
    if (data && typeof data === 'object') {
      marketplaces.push({
        name: name,
        source: (data as any).source?.source || 'unknown',
        installLocation: (data as any).installLocation || '',
        lastUpdated: (data as any).lastUpdated || '',
      });
    }
  }

  return marketplaces.sort((a, b) => 
    new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
  );
}

export function readInstalledPlugins(pluginsPath: string): Plugin[] {
  const filePath = path.join(pluginsPath, 'installed_plugins.json');
  
  if (!fs.existsSync(filePath)) {
    return [];
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);
    return parseInstalledPlugins(data);
  } catch {
    return [];
  }
}

export function readMarketplaces(pluginsPath: string): Marketplace[] {
  const filePath = path.join(pluginsPath, 'known_marketplaces.json');
  
  if (!fs.existsSync(filePath)) {
    return [];
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);
    return parseMarketplaces(data);
  } catch {
    return [];
  }
}

export function scanMCPConfigs(marketplacesPath: string): string[] {
  const mcpConfigs: string[] = [];

  if (!fs.existsSync(marketplacesPath)) {
    return mcpConfigs;
  }

  const walk = (dir: string) => {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        walk(filePath);
      } else if (file === '.mcp.json') {
        mcpConfigs.push(filePath);
      }
    }
  };

  walk(marketplacesPath);
  return mcpConfigs;
}
