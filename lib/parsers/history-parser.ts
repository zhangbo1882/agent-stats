import { HistoryEntry, Session } from '../types';
import * as fs from 'fs';
import * as path from 'path';

export function parseHistoryLine(line: string): HistoryEntry | null {
  try {
    const entry = JSON.parse(line);
    return {
      display: entry.display || '',
      pastedContents: entry.pastedContents || {},
      timestamp: entry.timestamp || Date.now(),
      project: entry.project,
      sessionId: entry.sessionId || '',
    };
  } catch {
    return null;
  }
}

export function parseHistoryFile(content: string): HistoryEntry[] {
  const lines = content.trim().split('\n');
  const entries: HistoryEntry[] = [];

  for (const line of lines) {
    const entry = parseHistoryLine(line);
    if (entry) {
      entries.push(entry);
    }
  }

  return entries.sort((a, b) => a.timestamp - b.timestamp);
}

export function groupEntriesBySession(entries: HistoryEntry[]): Map<string, HistoryEntry[]> {
  const grouped = new Map<string, HistoryEntry[]>();

  for (const entry of entries) {
    const sessionId = entry.sessionId || 'unknown';
    if (!grouped.has(sessionId)) {
      grouped.set(sessionId, []);
    }
    grouped.get(sessionId)!.push(entry);
  }

  return grouped;
}

export function extractSessionsFromHistory(entries: HistoryEntry[]): Session[] {
  const grouped = groupEntriesBySession(entries);
  const sessions: Session[] = [];

  for (const [sessionId, entries] of grouped.entries()) {
    const firstEntry = entries[0];
    const lastEntry = entries[entries.length - 1];
    const project = firstEntry.project;

    sessions.push({
      id: sessionId,
      timestamp: new Date(firstEntry.timestamp).toISOString(),
      messageCount: entries.length,
      project: project,
      duration: lastEntry.timestamp - firstEntry.timestamp,
    });
  }

  return sessions.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export function groupSessionsByProject(sessions: Session[]): Map<string, Session[]> {
  const grouped = new Map<string, Session[]>();

  for (const session of sessions) {
    const project = session.project || 'unknown';
    if (!grouped.has(project)) {
      grouped.set(project, []);
    }
    grouped.get(project)!.push(session);
  }

  return grouped;
}

export function readHistoryFile(historyPath: string): HistoryEntry[] {
  if (!fs.existsSync(historyPath)) {
    return [];
  }

  const content = fs.readFileSync(historyPath, 'utf-8');
  return parseHistoryFile(content);
}

export function scanProjectSessions(projectsPath: string): Map<string, Session[]> {
  const sessionsMap = new Map<string, Session[]>();

  if (!fs.existsSync(projectsPath)) {
    return sessionsMap;
  }

  const projectDirs = fs.readdirSync(projectsPath, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  for (const projectDir of projectDirs) {
    const projectPath = path.join(projectsPath, projectDir);
    const jsonlFiles = fs.readdirSync(projectPath)
      .filter(file => file.endsWith('.jsonl'));

    for (const file of jsonlFiles) {
      const filePath = path.join(projectPath, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.trim().split('\n');
      
      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          if (entry && typeof entry === 'object') {
            const sessionId = file.replace('.jsonl', '');
            
            if (!sessionsMap.has(sessionId)) {
              sessionsMap.set(sessionId, []);
            }
            
            sessionsMap.get(sessionId)!.push({
              id: sessionId,
              timestamp: entry.timestamp || new Date().toISOString(),
              messageCount: 1,
              project: projectDir,
            });
          }
        } catch {
          // Skip invalid JSON
        }
      }
    }
  }

  return sessionsMap;
}
