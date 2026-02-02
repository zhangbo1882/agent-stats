'use client';

import { memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Code, TrendingUp, Clock } from 'lucide-react';
import { Skill } from '@/lib/types';
import { formatNumber, formatDate } from '@/lib/utils';

interface SkillListProps {
  skills: Array<Skill & { usageCount?: number; lastUsed?: string }>;
  onSkillClick?: (skillName: string) => void;
}

// rerender-memo: Use React.memo to prevent unnecessary re-renders
export const SkillList = memo(function SkillList({ skills, onSkillClick }: SkillListProps) {
  if (skills.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Code className="h-12 w-12 mx-auto mb-4" />
        <p>No Skills</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {skills.map((skill) => (
        <Card
          key={skill.name}
          className={`hover:shadow-md transition-all cursor-pointer ${
            onSkillClick ? 'hover:border-primary/50' : ''
          }`}
          onClick={() => onSkillClick && onSkillClick(skill.name)}
        >
          <CardHeader>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Code className="h-5 w-5 text-primary" />
                <Badge variant="secondary">Enabled</Badge>
              </div>
            </div>
            <CardTitle className="text-lg">{skill.name}</CardTitle>
            {skill.description && (
              <CardDescription>{skill.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  <span>Call Count</span>
                </div>
                <span className="font-semibold">
                  {formatNumber(skill.usageCount || 0)}
                </span>
              </div>
              {skill.lastUsed && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Last used: {formatDate(skill.lastUsed)}</span>
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                <p className="truncate">{skill.path}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
});
