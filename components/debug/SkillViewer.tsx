'use client';

import { memo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { X, Code, FileText, FolderOpen, Loader2, File, Folder } from 'lucide-react';
import { Skill } from '@/lib/types';

interface DirectoryItem {
  name: string;
  type: 'file' | 'directory';
  path: string;
  extension?: string;
  children?: DirectoryItem[];
}

interface SkillDetail {
  name: string;
  path: string;
  skillMd: string;
  agentsMd: string;
  rules: string[];
  directoryStructure: DirectoryItem[];
}

interface SkillViewerProps {
  skill: Skill;
  onClose: () => void;
}

interface FileTreeProps {
  items: DirectoryItem[];
  selectedFile: string | null;
  onSelectFile: (filePath: string) => void;
  level?: number;
}

function FileTree({ items, selectedFile, onSelectFile, level = 0 }: FileTreeProps) {
  return (
    <div className="space-y-1">
      {items.map((item) => (
        <div key={item.path}>
          <div
            className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-muted/50 transition-colors ${
              selectedFile === item.path ? 'bg-muted' : ''
            }`}
            style={{ paddingLeft: `${level * 16 + 8}px` }}
            onClick={() => {
              if (item.type === 'file') {
                onSelectFile(item.path);
              }
            }}
          >
            {item.type === 'directory' ? (
              <Folder className="h-4 w-4 text-blue-500" />
            ) : (
              <File className="h-4 w-4 text-gray-500" />
            )}
            <span className="text-sm">{item.name}</span>
          </div>
          {item.type === 'directory' && item.children && (
            <FileTree
              items={item.children}
              selectedFile={selectedFile}
              onSelectFile={onSelectFile}
              level={level + 1}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export const SkillViewer = memo(function SkillViewer({ skill, onClose }: SkillViewerProps) {
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<SkillDetail | null>(null);
  const [activeRule, setActiveRule] = useState<string | null>(null);
  const [ruleContent, setRuleContent] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');

  useEffect(() => {
    async function loadSkillDetail() {
      try {
        const response = await fetch(`/api/skills/${encodeURIComponent(skill.name)}`);
        if (response.ok) {
          const data = await response.json();
          setDetail(data);
        }
      } catch (error) {
        console.error('Error loading skill detail:', error);
      } finally {
        setLoading(false);
      }
    }

    loadSkillDetail();
  }, [skill.name]);

  async function loadRuleContent(ruleName: string) {
    try {
      const response = await fetch(`/api/skills/${encodeURIComponent(skill.name)}/rules/${encodeURIComponent(ruleName)}`);
      if (response.ok) {
        const data = await response.json();
        setRuleContent(data.content);
      }
    } catch (error) {
      console.error('Error loading rule:', error);
    }
  }

  async function loadFileContent(filePath: string) {
    try {
      const response = await fetch(`/api/skills/${encodeURIComponent(skill.name)}/files/${encodeURIComponent(filePath)}`);
      if (response.ok) {
        const data = await response.json();
        setFileContent(data.content);
      }
    } catch (error) {
      console.error('Error loading file:', error);
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-4xl h-[400px] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </Card>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-4xl">
          <CardHeader>
            <CardTitle>Load Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Unable to load Skill details</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl h-[90vh] flex flex-col">
        <CardHeader className="border-b shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Code className="h-5 w-5 text-primary flex-shrink-0" />
                <CardTitle className="text-xl">{detail.name}</CardTitle>
                <Badge variant="secondary">Skill</Badge>
              </div>
              <p className="text-sm text-muted-foreground font-mono truncate">
                {detail.path}
              </p>
            </div>
            <Button
              onClick={onClose}
              variant="outline"
              size="sm"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto p-6">
          {detail.skillMd === '' && detail.agentsMd === '' && detail.rules.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Code className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">This Skill does not provide detailed documentation</p>
              <p className="text-sm text-muted-foreground mt-2">
                Skill Path: {detail.path}
              </p>
            </div>
          ) : (
            <Tabs defaultValue="overview" className="w-full h-full flex flex-col">
              <TabsList className="shrink-0">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                {detail.skillMd !== '' && <TabsTrigger value="skill">Skill Description</TabsTrigger>}
                {detail.agentsMd !== '' && <TabsTrigger value="agents">Full Documentation</TabsTrigger>}
                {detail.rules.length > 0 && <TabsTrigger value="rules">Rules ({detail.rules.length})</TabsTrigger>}
                <TabsTrigger value="files">Files</TabsTrigger>
              </TabsList>

            <div className="flex-1 overflow-auto mt-4">
              <TabsContent value="overview" className="space-y-4">
                {detail.skillMd ? (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Introduction</h3>
                    <div className="p-4 bg-muted rounded-lg">
                      <pre className="text-sm whitespace-pre-wrap break-words font-mono max-h-[300px] overflow-auto">
                        {detail.skillMd.split('\n').slice(0, 20).join('\n')}
                        ...
                      </pre>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">This Skill does not provide documentation</p>
                )}

                {detail.agentsMd && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Complete guide with {detail.rules.length} rules
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      View "Full Documentation" tab for more details
                    </p>
                  </div>
                )}

                {detail.rules.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <FolderOpen className="h-4 w-4" />
                      Rule List ({detail.rules.length})
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Click to view rule details, or switch to "Rules" tab to view all rules
                    </p>
                    <div className="grid gap-2">
                      {detail.rules.slice(0, 8).map((rule) => (
                        <div
                          key={rule}
                          className="p-3 bg-muted rounded-lg hover:bg-muted/80 cursor-pointer transition-colors"
                          onClick={() => {
                            setActiveRule(rule);
                            loadRuleContent(rule);
                          }}
                        >
                          <code className="text-sm">{rule}</code>
                        </div>
                      ))}
                      {detail.rules.length > 8 && (
                        <p className="text-sm text-muted-foreground text-center pt-2">
                          {detail.rules.length - 8} more rules...
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>

              {detail.skillMd && (
                <TabsContent value="skill">
                  <div className="p-4 bg-muted rounded-lg">
                    <pre className="text-sm whitespace-pre-wrap break-words font-mono">
                      {detail.skillMd}
                    </pre>
                  </div>
                </TabsContent>
              )}

              {detail.agentsMd && (
                <TabsContent value="agents">
                  <div className="p-4 bg-muted rounded-lg max-h-[600px] overflow-auto">
                    <pre className="text-sm whitespace-pre-wrap break-words font-mono">
                      {detail.agentsMd}
                    </pre>
                  </div>
                </TabsContent>
              )}

              {detail.rules.length > 0 && (
                <TabsContent value="rules">
                  <div className="space-y-4">
                    {activeRule ? (
                      <div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setActiveRule(null);
                            setRuleContent('');
                          }}
                          className="mb-4"
                        >
                          ← Back to List
                        </Button>
                        <h3 className="text-lg font-semibold mb-3">{activeRule}</h3>
                        <div className="p-4 bg-muted rounded-lg">
                          {ruleContent ? (
                            <pre className="text-sm whitespace-pre-wrap break-words font-mono">
                              {ruleContent}
                            </pre>
                          ) : (
                            <Loader2 className="h-6 w-6 animate-spin" />
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="grid gap-2">
                        {detail.rules.map((rule) => (
                          <div
                            key={rule}
                            className="p-3 bg-muted rounded-lg hover:bg-muted/80 cursor-pointer transition-colors"
                            onClick={() => {
                              setActiveRule(rule);
                              loadRuleContent(rule);
                            }}
                          >
                            <code className="text-sm">{rule}</code>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
              )}

              <TabsContent value="files">
                <div className="flex h-full gap-4">
                  {/* File Tree */}
                  <div className="w-1/3 overflow-auto border rounded-lg p-4">
                    <FileTree
                      items={detail.directoryStructure}
                      selectedFile={selectedFile}
                      onSelectFile={(filePath) => {
                        setSelectedFile(filePath);
                        loadFileContent(filePath);
                      }}
                    />
                  </div>

                  {/* File Content */}
                  <div className="flex-1 overflow-auto border rounded-lg p-4">
                    {selectedFile ? (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold">{selectedFile.split('/').pop()}</h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedFile(null);
                              setFileContent('');
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="p-4 bg-muted rounded-lg">
                          <pre className="text-sm whitespace-pre-wrap break-words font-mono max-h-[600px] overflow-auto">
                            {fileContent || <Loader2 className="h-6 w-6 animate-spin" />}
                          </pre>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                        <File className="h-12 w-12 mb-4" />
                        <p>Select a file to view content</p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        )}
        </CardContent>
      </Card>
    </div>
  );
});
