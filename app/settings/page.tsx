'use client';

import { useClaudeData } from '@/hooks/useClaudeData';
import { Layout } from '@/components/layout/Layout';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { Copy, Check, RefreshCw, Plus, Edit, Trash2, Save, Loader2 } from 'lucide-react';
import { useState, useCallback, useTransition, useEffect } from 'react';
import { EnvVariableEditor } from '@/components/settings/EnvVariableEditor';
import { PluginToggle } from '@/components/settings/PluginToggle';
import { PermissionsEditor } from '@/components/settings/PermissionsEditor';
import { ProfileSelector } from '@/components/settings/ProfileSelector';
import { ProfileManager } from '@/components/settings/ProfileManager';
import { JsonViewer } from '@/components/ui/JsonViewer';
import { Settings, ProfileStorage } from '@/lib/types';
import { isSensitiveVar, maskSensitiveValue } from '@/lib/settings-utils';
import { Modal } from '@/components/ui/Modal';
import { AlertTriangle } from 'lucide-react';

// List of keys that should be masked
const SENSITIVE_KEYS = ['API_KEY', 'SECRET', 'TOKEN', 'PASSWORD', 'KEY', 'AUTH'];

function isSensitiveKey(key: string): boolean {
  const upperKey = key.toUpperCase();
  return SENSITIVE_KEYS.some(sensitive => upperKey.includes(sensitive));
}

function maskValue(value: string): string {
  if (value.length <= 8) {
    return '*'.repeat(value.length);
  }
  return value.substring(0, 4) + '*'.repeat(value.length - 8) + value.substring(value.length - 4);
}

type SaveStatus = 'idle' | 'saving' | 'success' | 'error';

export default function SettingsPage() {
  const { settings, loading, error, refresh } = useClaudeData();
  const [isPending, startTransition] = useTransition();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [saveError, setSaveError] = useState('');

  // Modal states
  const [envEditorOpen, setEnvEditorOpen] = useState(false);
  const [editingEnvKey, setEditingEnvKey] = useState<string>('');
  const [editingEnvValue, setEditingEnvValue] = useState<string>('');
  const [permissionsEditorOpen, setPermissionsEditorOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pendingDeleteKey, setPendingDeleteKey] = useState<string>('');

  // Profile states
  const [profileStorage, setProfileStorage] = useState<ProfileStorage | null>(null);
  const [profileManagerOpen, setProfileManagerOpen] = useState(false);

  const handleRefresh = useCallback(() => {
    startTransition(async () => {
      await refresh();
    });
  }, [refresh]);

  // Load profiles on mount
  useEffect(() => {
    const loadProfiles = async () => {
      try {
        const response = await fetch('/api/profiles');
        if (response.ok) {
          const data = await response.json();
          setProfileStorage(data);
        }
      } catch (error) {
        console.error('Failed to load profiles:', error);
      }
    };
    loadProfiles();
  }, []);

  const handleSwitchProfile = async (profileId: string) => {
    const response = await fetch('/api/profiles/switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId })
    });
    if (response.ok) {
      await refresh();
      // Reload profile storage
      const r = await fetch('/api/profiles');
      if (r.ok) {
        setProfileStorage(await r.json());
      }
    } else {
      const data = await response.json();
      alert(`Failed to switch profile: ${data.message || 'Unknown error'}`);
    }
  };

  const handleCopy = useCallback(async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, []);

  // API call to update settings
  const updateSettings = async (updates: Partial<Settings>): Promise<void> => {
    setSaveStatus('saving');
    setSaveError('');

    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update settings');
      }

      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);

      // Refresh data
      await refresh();
    } catch (err) {
      setSaveStatus('error');
      setSaveError((err as Error).message || 'Failed to save settings');
      throw err;
    }
  };

  // Environment variable handlers
  const handleAddEnvVar = () => {
    setEditingEnvKey('');
    setEditingEnvValue('');
    setEnvEditorOpen(true);
  };

  const handleEditEnvVar = (key: string, value: string) => {
    setEditingEnvKey(key);
    setEditingEnvValue(value);
    setEnvEditorOpen(true);
  };

  const handleSaveEnvVar = async (key: string, value: string) => {
    const existingKeys = Object.keys(settings?.env || {});
    const isEditing = editingEnvKey !== '';

    if (!isEditing && existingKeys.includes(key)) {
      throw new Error('Environment variable already exists');
    }

    // If editing and key changed, delete old key
    if (isEditing && editingEnvKey !== key) {
      await updateSettings({
        env: {
          [editingEnvKey]: undefined,
          [key]: value,
        } as Record<string, string | undefined>,
      });
    } else {
      await updateSettings({
        env: {
          [key]: value,
        },
      });
    }
  };

  const handleDeleteEnvVar = (key: string) => {
    setPendingDeleteKey(key);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteEnvVar = async () => {
    if (!pendingDeleteKey) return;

    try {
      await updateSettings({
        env: {
          [pendingDeleteKey]: undefined,
        },
      });
      setDeleteConfirmOpen(false);
      setPendingDeleteKey('');
    } catch (err) {
      // Error is already handled by updateSettings
    }
  };

  const cancelDeleteEnvVar = () => {
    setDeleteConfirmOpen(false);
    setPendingDeleteKey('');
  };

  // Plugin toggle handler
  const handleTogglePlugin = async (pluginName: string, enabled: boolean) => {
    await updateSettings({
      enabledPlugins: {
        [pluginName]: enabled,
      },
    });
  };

  // Permissions handler
  const handleEditPermissions = () => {
    setPermissionsEditorOpen(true);
  };

  const handleSavePermissions = async (permissions: Settings['permissions']) => {
    await updateSettings({ permissions });
  };

  if (loading) {
    return (
      <Layout currentPage="/settings">
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Settings</h1>
          <div className="text-center py-12 text-muted-foreground">
            <LoadingSpinner size="lg" />
            <p>Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout currentPage="/settings">
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Settings</h1>
          <Card className="border-destructive">
            <CardContent className="p-6">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (!settings) {
    return (
      <Layout currentPage="/settings">
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Settings</h1>
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground">No settings data available</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const envEntries = Object.entries(settings.env || {}).sort((a, b) => a[0].localeCompare(b[0]));
  const pluginEntries = Object.entries(settings.enabledPlugins || {}).sort((a, b) => a[0].localeCompare(b[0]));

  // Get all fields, excluding known special fields
  const knownFields = ['env', 'enabledPlugins', 'permissions'];
  const otherFields = Object.entries(settings)
    .filter(([key]) => !knownFields.includes(key))
    .sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <Layout currentPage="/settings">
      <div className="space-y-6">
        {/* Save Status Indicator */}
        {saveStatus !== 'idle' && (
          <Alert
            variant={saveStatus === 'success' ? 'success' : saveStatus === 'error' ? 'error' : 'info'}
            onClose={() => {
              if (saveStatus === 'success') setSaveStatus('idle');
              if (saveStatus === 'error') {
                setSaveStatus('idle');
                setSaveError('');
              }
            }}
            autoClose={saveStatus === 'success'}
          >
            {saveStatus === 'saving' && 'Saving changes...'}
            {saveStatus === 'success' && 'Settings saved successfully!'}
            {saveStatus === 'error' && saveError}
          </Alert>
        )}

        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Settings</h1>
              <p className="text-sm text-muted-foreground mt-1">Claude Configuration and Environment Variables</p>
            </div>
            <div className="flex gap-2 items-center">
              {saveStatus === 'saving' && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </div>
              )}
              <Button
                onClick={handleRefresh}
                disabled={isPending || saveStatus === 'saving'}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isPending ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Profile Selector */}
          {profileStorage && (
            <div className="flex items-center justify-between border-b pb-4">
              <div className="text-sm text-muted-foreground">
                Switch between different model configuration profiles
              </div>
              <ProfileSelector
                storage={profileStorage}
                onSwitch={handleSwitchProfile}
                onManage={() => setProfileManagerOpen(true)}
                disabled={saveStatus === 'saving'}
              />
            </div>
          )}
        </div>

        {/* Environment Variables */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Environment Variables</CardTitle>
                <CardDescription>
                  {envEntries.length} Configuration Items (sensitive values are hidden)
                </CardDescription>
              </div>
              <Button
                onClick={handleAddEnvVar}
                size="sm"
                disabled={saveStatus === 'saving'}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Variable
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {envEntries.length === 0 ? (
              <p className="text-muted-foreground text-sm">No environment variables</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3 font-medium">Variable Name</th>
                      <th className="text-left py-2 px-3 font-medium">Value</th>
                      <th className="text-right py-2 px-3 font-medium w-32">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {envEntries.map(([key, value]) => {
                      if (value === undefined) return null;
                      const isSensitive = isSensitiveKey(key);
                      const displayValue = isSensitive ? maskValue(value) : value;
                      const isCopied = copiedKey === key;

                      return (
                        <tr key={key} className="border-b hover:bg-muted/50">
                          <td className="py-2 px-3 font-mono text-xs">{key}</td>
                          <td className="py-2 px-3 font-mono text-xs break-all">{displayValue}</td>
                          <td className="py-2 px-3 text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                onClick={() => handleCopy(key, value)}
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                title="Copy value"
                              >
                                {isCopied ? (
                                  <Check className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                onClick={() => handleEditEnvVar(key, value)}
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                title="Edit variable"
                                disabled={saveStatus === 'saving'}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                onClick={() => handleDeleteEnvVar(key)}
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                title="Delete variable"
                                disabled={saveStatus === 'saving'}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enabled Plugins */}
        <Card>
          <CardHeader>
            <CardTitle>Enabled Plugins</CardTitle>
            <CardDescription>
              {pluginEntries.filter(([_, enabled]) => enabled).length} / {pluginEntries.length} Plugins Enabled
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pluginEntries.length === 0 ? (
              <p className="text-muted-foreground text-sm">No plugins</p>
            ) : (
              <div className="space-y-2">
                {pluginEntries.map(([plugin, enabled]) => (
                  <div
                    key={plugin}
                    className="flex items-center justify-between py-2 px-3 rounded-md border bg-card"
                  >
                    <span className="font-mono text-sm">{plugin}</span>
                    <PluginToggle
                      pluginName={plugin}
                      enabled={enabled}
                      onToggle={handleTogglePlugin}
                      disabled={saveStatus === 'saving'}
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Permissions */}
        {settings.permissions && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Permissions</CardTitle>
                  <CardDescription>
                    Claude Code Permissions Configuration
                  </CardDescription>
                </div>
                <Button
                  onClick={handleEditPermissions}
                  size="sm"
                  variant="outline"
                  disabled={saveStatus === 'saving'}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(settings.permissions).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between py-2 px-3 rounded-md border bg-card"
                  >
                    <span className="font-medium text-sm">{key}</span>
                    <span className="font-mono text-xs text-muted-foreground">{String(value)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Other Fields (Dynamic) */}
        {otherFields.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Other Settings</CardTitle>
              <CardDescription>
                {otherFields.length} Additional Configuration Items (JSON format, collapsible)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <JsonViewer data={Object.fromEntries(otherFields)} expandDepth={Infinity} />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Environment Variable Editor Modal */}
      <EnvVariableEditor
        isOpen={envEditorOpen}
        onClose={() => setEnvEditorOpen(false)}
        onSave={handleSaveEnvVar}
        onDelete={handleDeleteEnvVar}
        editKey={editingEnvKey}
        editValue={editingEnvValue}
        existingKeys={Object.keys(settings?.env || {})}
      />

      {/* Permissions Editor Modal */}
      <PermissionsEditor
        isOpen={permissionsEditorOpen}
        onClose={() => setPermissionsEditorOpen(false)}
        onSave={handleSavePermissions}
        permissions={settings.permissions}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmOpen}
        onClose={cancelDeleteEnvVar}
        title="Confirm Delete"
        size="sm"
        footer={
          <>
            <Button
              variant="outline"
              onClick={cancelDeleteEnvVar}
              disabled={saveStatus === 'saving'}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteEnvVar}
              disabled={saveStatus === 'saving'}
            >
              {saveStatus === 'saving' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
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
            <p className="text-sm font-medium mb-1">Are you sure you want to delete this environment variable?</p>
            <p className="text-sm text-muted-foreground mb-3">
              This action cannot be undone. The variable will be permanently deleted.
            </p>
            <div className="bg-muted rounded-md p-3">
              <p className="text-xs font-mono font-medium">{pendingDeleteKey}</p>
            </div>
          </div>
        </div>
      </Modal>

      {/* Profile Manager Modal */}
      {profileStorage && (
        <ProfileManager
          isOpen={profileManagerOpen}
          onClose={() => setProfileManagerOpen(false)}
          storage={profileStorage}
          onUpdate={async () => {
            const r = await fetch('/api/profiles');
            if (r.ok) {
              setProfileStorage(await r.json());
            }
          }}
          onSwitch={handleSwitchProfile}
        />
      )}
    </Layout>
  );
}
