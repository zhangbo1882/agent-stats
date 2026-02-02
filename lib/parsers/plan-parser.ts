import { Plan } from '../types';
import * as fs from 'fs';
import * as path from 'path';

export function extractPlanMetadata(content: string): Partial<Plan> {
  const lines = content.split('\n');
  const plan: Partial<Plan> = {
    content,
  };

  let inSummary = false;
  let inFiles = false;
  const filesToModify: string[] = [];
  let foundFirstHeader = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Extract title from first header (supports multiple formats)
    if (!foundFirstHeader && trimmed.startsWith('#')) {
      // Prioritize explicit "Plan:" marker
      if (trimmed.startsWith('# Plan:')) {
        plan.title = trimmed.replace('# Plan:', '').trim();
        foundFirstHeader = true;
        continue;
      }

      // Recognize first h1 heading as plan title
      if (trimmed.startsWith('# ') && !trimmed.startsWith('## ')) {
        const potentialTitle = trimmed.replace(/^#\s*/, '').trim();
        // Filter out common non-title content
        const skipPatterns = /^(Summary|Background|Overview|Introduction)$/i;
        if (!skipPatterns.test(potentialTitle)) {
          plan.title = potentialTitle;
          foundFirstHeader = true;
        }
      }
    }

    // Extract summary
    if (trimmed === '## Summary') {
      inSummary = true;
      continue;
    }
    if (inSummary && trimmed.startsWith('## ')) {
      inSummary = false;
    }
    if (inSummary && trimmed) {
      plan.summary = (plan.summary || '') + trimmed + '\n';
    }

    // Extract files to modify
    if (trimmed === '## Files to Modify' || trimmed === '## Files') {
      inFiles = true;
      continue;
    }
    if (inFiles && (trimmed.startsWith('## ') || trimmed.startsWith('---'))) {
      inFiles = false;
      continue;
    }
    if (inFiles && trimmed.startsWith('### ')) {
      const filePath = trimmed.replace('###', '').trim().replace(/`/g, '');
      filesToModify.push(filePath);
    } else if (inFiles && trimmed.includes('/Users/') || trimmed.includes('src/') || trimmed.includes('app/')) {
      const filePath = trimmed.trim().replace(/`/g, '').replace(/['":]/g, '');
      if (filePath && !filesToModify.includes(filePath)) {
        filesToModify.push(filePath);
      }
    }
  }

  plan.summary = plan.summary?.trim();
  plan.filesToModify = filesToModify;

  return plan;
}

export function parsePlanFile(content: string, filename: string): Plan | null {
  const metadata = extractPlanMetadata(content);

  // Prefer explicit title, then use first line of summary as title, finally use filename
  let title = metadata.title;
  if (!title && metadata.summary) {
    // Use first sentence of summary as title (max 100 characters)
    const firstLine = metadata.summary.split('\n')[0].trim();
    title = firstLine.length > 100
      ? firstLine.substring(0, 100) + '...'
      : firstLine;
  }
  if (!title) {
    title = filename.replace('.md', '').replace(/-/g, ' ');
  }

  // Infer project from file paths or content
  let project: string | undefined;
  if (metadata.filesToModify && metadata.filesToModify.length > 0) {
    // Try to extract project path from file paths
    for (const file of metadata.filesToModify) {
      // Match full paths like /Users/xxx/projects/xxx or /Users/xxx/github.com/xxx
      const fullPathMatch = file.match(/(\/Users\/[^\/]+\/[^\/]+\/[^\/]+\/[^\/]+\/[^\/]+)/);
      if (fullPathMatch) {
        project = fullPathMatch[1];
        break;
      }

      // Match paths starting with common project markers (app/, components/, lib/, etc.)
      // and try to infer from other context
      const relativePathMatch = file.match(/(app\/|components\/|lib\/|hooks\/|pages\/)/);
      if (relativePathMatch && !project) {
        // For relative paths, we can't determine the exact project without more context
        // Set project to null and let the frontend handle matching
        project = undefined;
      }
    }
  }

  // If no project was found in file paths, try to extract from summary/title
  if (!project && metadata.summary) {
    // Look for patterns like "for agent-stats", "in mytrader project", etc.
    const projectMentionMatch = metadata.summary.match(/(?:for|in|project)\s+([a-zA-Z0-9\-]+)(?:\s|$|\.|,)/i);
    if (projectMentionMatch && projectMentionMatch[1]) {
      // Only use this if it looks like a project name (contains hyphen or is camelCase)
      const potentialProject = projectMentionMatch[1];
      if (potentialProject.includes('-') || /[a-z][A-Z]/.test(potentialProject)) {
        project = potentialProject;
      }
    }
  }

  return {
    id: filename.replace('.md', ''),
    title,
    summary: metadata.summary || '',
    filesToModify: metadata.filesToModify || [],
    createdAt: '',
    content,
    project,
  };
}

export function readPlanFile(filePath: string): Plan | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const filename = path.basename(filePath);
    const plan = parsePlanFile(content, filename);

    if (plan) {
      // Extract creation date from file stats
      const stats = fs.statSync(filePath);
      plan.createdAt = stats.birthtime.toISOString();
    }

    return plan;
  } catch {
    return null;
  }
}

export function readAllPlans(plansPath: string): Plan[] {
  const plans: Plan[] = [];

  if (!fs.existsSync(plansPath)) {
    return plans;
  }

  const files = fs.readdirSync(plansPath)
    .filter(file => file.endsWith('.md'));

  for (const file of files) {
    const filePath = path.join(plansPath, file);
    const plan = readPlanFile(filePath);
    if (plan) {
      plans.push(plan);
    }
  }

  return plans.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function searchPlans(plans: Plan[], query: string): Plan[] {
  const lowerQuery = query.toLowerCase();

  return plans.filter(plan => 
    plan.title.toLowerCase().includes(lowerQuery) ||
    plan.summary?.toLowerCase().includes(lowerQuery)
  );
}
