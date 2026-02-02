'use client';

import * as React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Settings } from '@/lib/types';

export interface PermissionsEditorProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSave?: (permissions: Settings['permissions']) => void;
  permissions?: Settings['permissions'];
}

export function PermissionsEditor({
  isOpen = false,
  onClose,
  onSave,
  permissions = {},
}: PermissionsEditorProps) {
  const [editedPermissions, setEditedPermissions] = React.useState<Record<string, any>>({});
  const [error, setError] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);

  // Initialize form when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setEditedPermissions(permissions ? { ...permissions } : {});
      setError('');
    }
  }, [isOpen, permissions]);

  const handleFieldChange = (key: string, value: string) => {
    setEditedPermissions((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleAddField = () => {
    const newKey = `field_${Object.keys(editedPermissions).length + 1}`;
    setEditedPermissions((prev) => ({
      ...prev,
      [newKey]: '',
    }));
  };

  const handleRemoveField = (key: string) => {
    setEditedPermissions((prev) => {
      const newPermissions = { ...prev };
      delete newPermissions[key];
      return newPermissions;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');

    try {
      // Convert string values to appropriate types
      const processedPermissions: Record<string, any> = {};
      for (const [key, value] of Object.entries(editedPermissions)) {
        // Try to parse as JSON for complex values
        if (typeof value === 'string') {
          try {
            processedPermissions[key] = JSON.parse(value);
          } catch {
            processedPermissions[key] = value;
          }
        } else {
          processedPermissions[key] = value;
        }
      }

      await onSave?.(processedPermissions);
      onClose?.();
    } catch (err) {
      setError((err as Error).message || 'Failed to save permissions');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Permissions"
      size="lg"
      footer={
        <>
          <Button
            variant="outline"
            onClick={handleAddField}
            disabled={isSaving}
          >
            Add Field
          </Button>
          <div className="flex gap-3 ml-auto">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <Alert variant="error" onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <div className="text-sm text-muted-foreground">
          Configure permission settings. Use JSON format for complex values.
        </div>

        {Object.keys(editedPermissions).length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No permissions configured. Click "Add Field" to create one.
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(editedPermissions).map(([key, value]) => (
              <div key={key} className="flex gap-2 items-start">
                <div className="flex-1 grid grid-cols-[1fr_2fr] gap-2">
                  <Input
                    label="Key"
                    value={key}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setEditedPermissions((prev) => {
                        const newPermissions: Record<string, any> = {};
                        Object.entries(prev).forEach(([k, v]) => {
                          if (k === key) {
                            newPermissions[newValue] = v;
                          } else {
                            newPermissions[k] = v;
                          }
                        });
                        return newPermissions;
                      });
                    }}
                    disabled={isSaving}
                  />
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        label="Value"
                        value={typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                        onChange={(e) => handleFieldChange(key, e.target.value)}
                        disabled={isSaving}
                        helperText={typeof value === 'object' ? 'JSON value' : undefined}
                      />
                    </div>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleRemoveField(key)}
                      disabled={isSaving}
                      className="mt-6"
                    >
                      ×
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}

export default PermissionsEditor;
