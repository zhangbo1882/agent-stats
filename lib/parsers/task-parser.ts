import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { AgentTask, TodoItem, Session } from '../types';

export function readAllTasks(todosPath: string, sessions?: Session[]): AgentTask[] {
  if (!fs.existsSync(todosPath)) {
    return [];
  }

  try {
    const files = fs.readdirSync(todosPath)
      .filter(file => file.endsWith('.json'));

    const tasks: AgentTask[] = [];

    for (const file of files) {
      const filePath = path.join(todosPath, file);

      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const todos = JSON.parse(content) as TodoItem[];

        // Skip empty arrays
        if (!Array.isArray(todos) || todos.length === 0) {
          continue;
        }

        // Only include tasks that have at least one in_progress todo
        const hasInProgress = todos.some(todo => todo.status === 'in_progress');
        if (!hasInProgress) {
          continue; // Skip completed or fully pending tasks
        }

        // Parse filename to extract session ID and agent ID
        // Format: {sessionId}-agent-{agentId}.json
        const match = file.match(/^(.+)-agent-(.+)\.json$/);

        if (!match) {
          continue;
        }

        const [, sessionId, agentId] = match;

        // Get file creation time
        const stats = fs.statSync(filePath);
        const createdAt = stats.birthtime.toISOString();

        // Find the session to get project information
        const session = sessions?.find(s => s.id === sessionId);
        const projectPath = session?.project;

        tasks.push({
          sessionId,
          agentId,
          todos,
          filename: file,
          createdAt,
          projectPath,
        });
      } catch (error) {
        console.error(`Error reading task file ${file}:`, error);
      }
    }

    // Sort by creation time, most recent first
    return tasks.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });
  } catch (error) {
    console.error('Error reading tasks:', error);
    return [];
  }
}

export function getTasksFromPath(): AgentTask[] {
  const todosPath = path.join(os.homedir(), '.claude', 'todos');
  return readAllTasks(todosPath);
}
