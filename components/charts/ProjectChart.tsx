'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  TooltipProps,
} from 'recharts';
import { Project } from '@/lib/types';

interface ProjectChartProps {
  data: Project[];
}

// Extract a clean project name from the Claude-style directory name
// e.g., "-Users-zhangbo-Public-go-github-com-agent-stats" -> "agent-stats"
function extractProjectName(dirName: string): string {
  // Remove leading/trailing hyphens
  const cleanName = dirName.replace(/^-+|-+$/g, '');

  // Split by hyphens
  const parts = cleanName.split('-').filter(p => p.length > 0);

  // Common path components that should be skipped
  const pathPrefixes = ['Users', 'home', 'var', 'opt', 'usr', 'private',
                        'Public', 'go', 'src', 'code', 'work',
                        'Desktop', 'Downloads', 'Developer', 'Library', 'Applications',
                        'github', 'gitlab', 'bitbucket', 'com', 'org', 'io', 'co', 'app',
                        'www', 'http', 'https', 'node_modules', 'dist', 'build',
                        'WeChatProjects', 'Projects'];

  // Special handling for GitHub-style paths: look for patterns like "github-com-username-repo"
  const githubIndex = parts.indexOf('github');
  if (githubIndex >= 0 && githubIndex + 2 < parts.length) {
    // Found "github-com-X-Y" pattern, take parts after "com"
    const comIndex = parts.indexOf('com', githubIndex);
    if (comIndex >= 0 && comIndex + 1 < parts.length) {
      // Take parts after "com"
      const repoParts = parts.slice(comIndex + 1);
      // Filter out any remaining path prefixes
      const meaningfulParts = repoParts.filter(p => !pathPrefixes.includes(p));

      if (meaningfulParts.length > 0) {
        if (meaningfulParts.length >= 2) {
          return meaningfulParts.slice(-2).join('-');
        }
        return meaningfulParts[0];
      }
    }
  }

  // For non-GitHub paths, filter out path prefixes
  let meaningfulParts = parts.filter(p => !pathPrefixes.includes(p) && p.length >= 1);

  // If the first meaningful part is likely a username (starts with lowercase, short-ish), skip it
  if (meaningfulParts.length > 1) {
    const firstPart = meaningfulParts[0];
    // Check if it looks like a username (all lowercase or contains common username patterns)
    if (firstPart.length < 15 && firstPart === firstPart.toLowerCase() && !firstPart.includes('-')) {
      meaningfulParts = meaningfulParts.slice(1);
    }
  }

  // If we have meaningful parts, use the last 1-2
  if (meaningfulParts.length > 0) {
    if (meaningfulParts.length >= 2) {
      // Take last 2 parts for projects
      const lastParts = meaningfulParts.slice(-2);
      return lastParts.join('-');
    }

    // Only one meaningful part
    return meaningfulParts[0];
  }

  // Fall back to last 2 parts of original name
  if (parts.length >= 2) {
    return parts.slice(-2).join('-');
  }

  return cleanName;
}

export function ProjectChart({ data }: ProjectChartProps) {
  const chartData = data
    .slice(0, 10) // Limit to top 10
    .map((project) => {
      const cleanName = extractProjectName(project.name);
      return {
        name: cleanName.substring(0, 25),
        sessions: project.sessionCount,
        fullName: cleanName,
      };
    })
    .sort((a, b) => b.sessions - a.sessions);

  const getBarColor = (index: number) => {
    const colors = [
      'hsl(var(--chart-1))',
      'hsl(var(--chart-2))',
      'hsl(var(--chart-3))',
      'hsl(var(--chart-4))',
      'hsl(var(--chart-5))',
    ];
    return colors[index % colors.length];
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) {
      return null;
    }
    const data = payload[0].payload;
    return (
      <div
        style={{
          backgroundColor: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          borderRadius: '8px',
          padding: '8px 12px',
          fontSize: '13px',
          fontWeight: 500,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ marginBottom: '4px', color: 'hsl(var(--foreground))' }}>
          {data.fullName}
        </div>
        <div style={{ color: 'hsl(var(--muted-foreground))' }}>
          {data.sessions} sessions
        </div>
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" className="stroke-[1px]" horizontal={false} />
        <XAxis
          type="number"
          style={{ fontSize: '12px', fill: 'hsl(var(--muted-foreground))' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          dataKey="name"
          type="category"
          width={150}
          style={{ fontSize: '12px', fill: 'hsl(var(--muted-foreground))' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="sessions" radius={[0, 6, 6, 0]} maxBarSize={40}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getBarColor(index)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
