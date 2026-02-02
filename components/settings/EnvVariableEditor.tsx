'use client';

import * as React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { isSensitiveVar, validateEnvVarName } from '@/lib/settings-utils';

export interface EnvVariableEditorProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSave?: (key: string, value: string) => void;
  onDelete?: (key: string) => void;
  editKey?: string;
  editValue?: string;
  existingKeys?: string[];
}

export function EnvVariableEditor({
  isOpen = false,
  onClose,
  onSave,
  onDelete,
  editKey = '',
  editValue = '',
  existingKeys = [],
}: EnvVariableEditorProps) {
  const [key, setKey] = React.useState(editKey);
  const [value, setValue] = React.useState(editValue);
  const [keyError, setKeyError] = React.useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [error, setError] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);

  const isEditing = editKey !== '';
  const isSensitive = isSensitiveVar(key);

  // Reset form when modal opens/closes or editKey changes
  React.useEffect(() => {
    setKey(editKey);
    setValue(editValue);
    setKeyError('');
    setError('');
    setShowDeleteConfirm(false);
  }, [isOpen, editKey, editValue]);

  const validateKey = (keyValue: string): string => {
    if (!keyValue) {
      return 'Environment variable name is required';
    }

    if (!validateEnvVarName(keyValue)) {
      return 'Invalid name. Use only letters, numbers, and underscores. Must start with letter or underscore.';
    }

    if (!isEditing && existingKeys.includes(keyValue)) {
      return 'This variable name already exists';
    }

    return '';
  };

  const handleKeyChange = (newKey: string) => {
    setKey(newKey);
    setKeyError(validateKey(newKey));
  };

  const handleSave = async () => {
    const validationError = validateKey(key);
    if (validationError) {
      setKeyError(validationError);
      return;
    }

    if (!value) {
      setError('Value is required');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      await onSave?.(key, value);
      onClose?.();
    } catch (err) {
      setError((err as Error).message || 'Failed to save environment variable');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      await onDelete?.(key);
      onClose?.();
    } catch (err) {
      setError((err as Error).message || 'Failed to delete environment variable');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Environment Variable' : 'Add Environment Variable'}
      size="md"
      footer={
        <>
          {isEditing && onDelete && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isSaving}
            >
              {showDeleteConfirm ? 'Confirm Delete' : 'Delete'}
            </Button>
          )}
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
              disabled={isSaving || !!keyError}
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

        {isEditing && showDeleteConfirm && (
          <Alert variant="warning">
            Are you sure you want to delete this environment variable? This action cannot be undone.
          </Alert>
        )}

        {isSensitive && (
          <Alert variant="warning">
            This appears to be a sensitive variable. Be careful when sharing or storing this value.
          </Alert>
        )}

        <Input
          label="Variable Name"
          placeholder="MY_API_KEY"
          value={key}
          onChange={(e) => handleKeyChange(e.target.value.toUpperCase())}
          error={keyError}
          disabled={isSaving || isEditing}
          helperText="Use uppercase letters, numbers, and underscores. Must start with a letter or underscore."
          autoFocus={!isEditing}
        />

        <Input
          label="Value"
          placeholder="Enter the value"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={isSaving}
          type={isSensitive ? 'password' : 'text'}
          helperText={isSensitive ? 'Value is hidden for security' : undefined}
          autoFocus={isEditing}
        />
      </div>
    </Modal>
  );
}

export default EnvVariableEditor;
