'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ModelProfile, ProfileStorage } from '@/lib/types';
import { Plus, Edit, Trash2, Save, Loader2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileManagerProps {
  isOpen: boolean;
  onClose: () => void;
  storage: ProfileStorage;
  onUpdate: () => void;
  onSwitch?: (profileId: string) => void;
}

type SaveStatus = 'idle' | 'saving' | 'error';
type Action = 'create' | 'update' | null;

export function ProfileManager({ isOpen, onClose, storage, onUpdate, onSwitch }: ProfileManagerProps) {
  const [action, setAction] = useState<Action>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [error, setError] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<ModelProfile>>({
    id: '',
    name: '',
    description: '',
    color: '#3b82f6',
    env: {}
  });

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setAction(null);
      setFormData({
        id: '',
        name: '',
        description: '',
        color: '#3b82f6',
        env: {}
      });
      setError('');
      setSaveStatus('idle');
    }
  }, [isOpen]);

  const handleCreate = () => {
    setAction('create');
    setFormData({
      id: '',
      name: '',
      description: '',
      color: '#3b82f6',
      env: {}
    });
  };

  const handleEdit = (profile: ModelProfile) => {
    setAction('update');
    setFormData({ ...profile });
  };

  const handleDelete = (profileId: string) => {
    setPendingDeleteId(profileId);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;

    setSaveStatus('saving');
    setError('');

    try {
      const response = await fetch(`/api/profiles?id=${pendingDeleteId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete profile');
      }

      setDeleteConfirmOpen(false);
      setPendingDeleteId(null);
      onUpdate();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaveStatus('idle');
    }
  };

  const handleSubmit = async () => {
    if (!formData.id || !formData.name) {
      setError('ID and Name are required');
      return;
    }

    setSaveStatus('saving');
    setError('');

    try {
      const url = action === 'create' ? '/api/profiles' : '/api/profiles';
      const method = action === 'create' ? 'POST' : 'PUT';
      const body = action === 'create'
        ? formData
        : { profileId: formData.id, updates: formData };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to save profile');
      }

      setAction(null);
      setFormData({
        id: '',
        name: '',
        description: '',
        color: '#3b82f6',
        env: {}
      });
      onUpdate();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaveStatus('idle');
    }
  };

  const handleCancel = () => {
    setAction(null);
    setError('');
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Manage Profiles" size="lg">
        <div className="space-y-4">
          {/* New Profile Button */}
          <Button onClick={handleCreate} disabled={action !== null}>
            <Plus className="h-4 w-4 mr-2" />
            New Profile
          </Button>

          {/* Error Alert */}
          {error && (
            <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          {action && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <Input
                  label="ID"
                  value={formData.id || ''}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  disabled={action === 'update'}
                  helperText={action === 'update' ? 'ID cannot be changed' : 'Unique identifier (e.g., anthropic, zhipu)'}
                />
                <Input
                  label="Name"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Anthropic Claude"
                />
                <Input
                  label="Description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description"
                />
                <div>
                  <label className="text-sm font-medium">Color</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={formData.color || '#3b82f6'}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value as string })}
                      className="h-10 w-20 rounded border cursor-pointer"
                    />
                    <span className="text-sm text-muted-foreground font-mono">{formData.color}</span>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSubmit} disabled={saveStatus === 'saving'}>
                    {saveStatus === 'saving' ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={handleCancel} disabled={saveStatus === 'saving'}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Profile List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {Object.values(storage.profiles).map((profile) => (
              <Card
                key={profile.id}
                className={cn(
                  profile.id === storage.activeProfile && 'border-primary'
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {profile.color && (
                        <div
                          className="w-8 h-8 rounded border"
                          style={{ backgroundColor: profile.color }}
                        />
                      )}
                      <div>
                        <div className="font-medium">{profile.name}</div>
                        <div className="text-sm text-muted-foreground">ID: {profile.id}</div>
                        {profile.description && (
                          <div className="text-sm text-muted-foreground mt-1">{profile.description}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {profile.id === storage.activeProfile && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded border border-primary/20">
                          Active
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground px-2 py-1 border rounded">
                        {Object.keys(profile.env || {}).length} env vars
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(profile)}
                        disabled={action !== null || saveStatus === 'saving'}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(profile.id)}
                        disabled={profile.id === storage.activeProfile || action !== null || saveStatus === 'saving'}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="Confirm Delete"
        size="sm"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              disabled={saveStatus === 'saving'}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
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
                  Delete
                </>
              )}
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium mb-1">Are you sure you want to delete this profile?</p>
            <p className="text-sm text-muted-foreground">
              This action cannot be undone.
            </p>
            {pendingDeleteId && storage.profiles[pendingDeleteId] && (
              <div className="bg-muted rounded-md p-3 mt-3">
                <p className="text-xs font-medium">{storage.profiles[pendingDeleteId].name}</p>
                <p className="text-xs text-muted-foreground">ID: {pendingDeleteId}</p>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}
