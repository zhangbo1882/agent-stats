'use client';

import { useState } from 'react';
import { memo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { FolderOpen, Clock, Activity, Trash2 } from 'lucide-react';
import { Project } from '@/lib/types';
import { formatNumber, formatDate } from '@/lib/utils';
import { Modal } from '../ui/Modal';
import { AlertTriangle } from 'lucide-react';

interface ProjectListProps {
  projects: Project[];
  mostActiveProject?: string;
  onProjectDelete?: (projectPath: string) => void;
  makeClickable?: boolean;
}

// rerender-memo: Use React.memo to prevent unnecessary re-renders
export const ProjectList = memo(function ProjectList({ projects, mostActiveProject, onProjectDelete, makeClickable = false }: ProjectListProps) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pendingDeleteProject, setPendingDeleteProject] = useState<string | null>(null);
  const [pendingDeleteDisplayName, setPendingDeleteDisplayName] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  if (projects.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FolderOpen className="h-12 w-12 mx-auto mb-4" />
        <p>No projects</p>
      </div>
    );
  }

  const handleDeleteClick = (projectPath: string, projectName: string) => {
    setPendingDeleteProject(projectPath);
    setPendingDeleteDisplayName(projectName);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteProject || !onProjectDelete) return;

    setIsDeleting(true);
    try {
      await onProjectDelete(pendingDeleteProject);
      setDeleteConfirmOpen(false);
      setPendingDeleteProject(null);
      setPendingDeleteDisplayName(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmOpen(false);
    setPendingDeleteProject(null);
    setPendingDeleteDisplayName(null);
  };

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => {
          const cardContent = (
            <Card
              key={project.name}
              className={`hover:shadow-md transition-all ${makeClickable ? 'cursor-pointer hover:border-primary/50' : ''}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <FolderOpen className="h-5 w-5 text-primary flex-shrink-0" />
                      <CardTitle className="text-lg truncate">{project.name}</CardTitle>
                    </div>
                    {project.path && (
                      <CardDescription className="font-mono text-xs truncate">
                        {project.path}
                      </CardDescription>
                    )}
                  </div>
                  {onProjectDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(project.path, project.name);
                      }}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive focus-visible:text-destructive"
                      title="Delete Project"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {project.name === mostActiveProject && (
                    <Badge variant="default" className="w-fit">
                      Most Active
                    </Badge>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Activity className="h-4 w-4" />
                      <span>Sessions</span>
                    </div>
                    <span className="font-semibold">
                      {formatNumber(project.sessionCount)}
                    </span>
                  </div>
                  {project.lastActive && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>Last active {formatDate(project.lastActive)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );

          if (makeClickable) {
            return (
              <Link
                key={project.name}
                href={`/projects/${encodeURIComponent(project.path)}`}
                className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
              >
                {cardContent}
              </Link>
            );
          }

          return cardContent;
        })}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmOpen}
        onClose={cancelDelete}
        title="Confirm Delete"
        size="sm"
        footer={
          <>
            <Button
              variant="outline"
              onClick={cancelDelete}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting…' : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Confirm Delete
                </>
              )}
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium mb-1">Are you sure you want to delete this project?</p>
            <p className="text-sm text-muted-foreground mb-3">
              This will delete the project and all related session records. This action cannot be undone.
            </p>
            <div className="bg-muted rounded-md p-3">
              <p className="text-sm font-semibold">{pendingDeleteDisplayName}</p>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
});
