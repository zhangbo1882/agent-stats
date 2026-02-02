'use client';

import * as React from 'react';
import { Switch } from '@/components/ui/Switch';
import { Alert } from '@/components/ui/Alert';
import { Loader2 } from 'lucide-react';

export interface PluginToggleProps {
  pluginName: string;
  enabled: boolean;
  onToggle?: (pluginName: string, enabled: boolean) => Promise<void>;
  disabled?: boolean;
}

export function PluginToggle({
  pluginName,
  enabled,
  onToggle,
  disabled = false,
}: PluginToggleProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [optimisticEnabled, setOptimisticEnabled] = React.useState(enabled);

  // Update optimistic state when enabled prop changes
  React.useEffect(() => {
    setOptimisticEnabled(enabled);
  }, [enabled]);

  const handleToggle = async (newEnabled: boolean) => {
    setIsLoading(true);
    setError('');

    // Optimistic update
    setOptimisticEnabled(newEnabled);

    try {
      await onToggle?.(pluginName, newEnabled);
    } catch (err) {
      // Revert on error
      setOptimisticEnabled(!newEnabled);
      setError((err as Error).message || 'Failed to update plugin status');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      ) : (
        <Switch
          checked={optimisticEnabled}
          onChange={handleToggle}
          disabled={disabled || isLoading}
          aria-label={`Toggle ${pluginName} plugin`}
        />
      )}
      <span className="text-sm">
        {optimisticEnabled ? 'Enabled' : 'Disabled'}
      </span>
      {error && (
        <Alert variant="error" onClose={() => setError('')} className="mt-2">
          {error}
        </Alert>
      )}
    </div>
  );
}

export default PluginToggle;
