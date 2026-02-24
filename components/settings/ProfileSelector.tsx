'use client';

import { ModelProfile, ProfileStorage } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileSelectorProps {
  storage: ProfileStorage;
  onSwitch: (profileId: string) => void;
  onManage: () => void;
  disabled?: boolean;
}

export function ProfileSelector({ storage, onSwitch, onManage, disabled }: ProfileSelectorProps) {
  const activeProfile = storage.profiles[storage.activeProfile];

  const handleSwitch = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSwitch(e.target.value);
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground">Active Profile:</span>
      <select
        value={storage.activeProfile}
        onChange={handleSwitch}
        disabled={disabled}
        className={cn(
          "border rounded px-3 py-1.5 text-sm bg-background",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        {Object.values(storage.profiles).map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      {activeProfile?.color && (
        <div
          className="w-4 h-4 rounded-full border"
          style={{ backgroundColor: activeProfile.color }}
          title={activeProfile.name}
        />
      )}
      <Button variant="outline" size="sm" onClick={onManage} disabled={disabled}>
        <Settings className="h-4 w-4 mr-2" />
        Manage
      </Button>
    </div>
  );
}
