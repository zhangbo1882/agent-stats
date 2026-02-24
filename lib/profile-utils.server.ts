import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { ModelProfile, ProfileStorage } from './types';
import { getClaudeSettingsPath, atomicWrite } from './settings-utils.server';

const PROFILES_FILE = path.join(os.homedir(), '.claude', 'profiles.json');
const BACKUP_DIR = path.join(os.homedir(), '.claude', 'backups');

export class ProfileManager {
  /**
   * Load all profiles from .claude/profiles.json
   */
  async loadProfiles(): Promise<ProfileStorage> {
    // Default structure
    const defaultStorage: ProfileStorage = {
      activeProfile: 'default',
      profiles: {
        default: {
          id: 'default',
          name: 'Default Profile',
          description: 'Default model configuration',
          color: '#6b7280',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          env: {}
        }
      }
    };

    try {
      const content = await fs.readFile(PROFILES_FILE, 'utf-8');
      return JSON.parse(content);
    } catch {
      return defaultStorage;
    }
  }

  /**
   * Save profiles to .claude/profiles.json
   */
  async saveProfiles(storage: ProfileStorage): Promise<void> {
    await fs.mkdir(path.dirname(PROFILES_FILE), { recursive: true });
    await atomicWrite(PROFILES_FILE, JSON.stringify(storage, null, 2));
  }

  /**
   * Switch active profile - writes to ~/.claude/settings.json
   * Only updates env, preserves existing enabledPlugins and permissions
   */
  async switchProfile(profileId: string): Promise<void> {
    const storage = await this.loadProfiles();
    const profile = storage.profiles[profileId];

    if (!profile) {
      throw new Error(`Profile not found: ${profileId}`);
    }

    // Backup current settings
    await this.backupCurrentSettings();

    // Read existing settings to preserve plugins and permissions
    const claudeSettingsPath = getClaudeSettingsPath();
    let existingSettings = { enabledPlugins: {}, permissions: {} };
    try {
      const content = await fs.readFile(claudeSettingsPath, 'utf-8');
      existingSettings = JSON.parse(content);
    } catch {
      // File doesn't exist, use defaults
    }

    // Write profile to Claude's settings.json (only env, preserve plugins/permissions)
    const settingsContent = {
      env: profile.env,
      enabledPlugins: existingSettings.enabledPlugins || {},
      permissions: existingSettings.permissions || {}
    };

    await atomicWrite(claudeSettingsPath, JSON.stringify(settingsContent, null, 2));

    // Update active profile
    storage.activeProfile = profileId;
    await this.saveProfiles(storage);
  }

  /**
   * Backup current ~/.claude/settings.json before switch
   */
  private async backupCurrentSettings(): Promise<void> {
    const claudeSettingsPath = getClaudeSettingsPath();
    await fs.mkdir(BACKUP_DIR, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(BACKUP_DIR, `settings-backup-${timestamp}.json`);

    try {
      const content = await fs.readFile(claudeSettingsPath, 'utf-8');
      await fs.writeFile(backupPath, content);
    } catch {
      // File might not exist, skip backup
    }
  }

  /**
   * Create new profile
   */
  async createProfile(profile: ModelProfile): Promise<void> {
    const storage = await this.loadProfiles();

    if (storage.profiles[profile.id]) {
      throw new Error(`Profile ID already exists: ${profile.id}`);
    }

    profile.createdAt = new Date().toISOString();
    profile.updatedAt = new Date().toISOString();

    storage.profiles[profile.id] = profile;
    await this.saveProfiles(storage);
  }

  /**
   * Update existing profile
   */
  async updateProfile(profileId: string, updates: Partial<ModelProfile>): Promise<void> {
    const storage = await this.loadProfiles();
    const profile = storage.profiles[profileId];

    if (!profile) {
      throw new Error(`Profile not found: ${profileId}`);
    }

    Object.assign(profile, updates, { updatedAt: new Date().toISOString() });
    await this.saveProfiles(storage);
  }

  /**
   * Delete profile
   */
  async deleteProfile(profileId: string): Promise<void> {
    const storage = await this.loadProfiles();

    if (profileId === storage.activeProfile) {
      throw new Error('Cannot delete active profile');
    }

    if (Object.keys(storage.profiles).length <= 1) {
      throw new Error('Cannot delete the last profile');
    }

    delete storage.profiles[profileId];
    await this.saveProfiles(storage);
  }

  /**
   * Get current Claude settings as profile (only env)
   */
  async getCurrentSettingsAsProfile(): Promise<Partial<ModelProfile>> {
    const claudeSettingsPath = getClaudeSettingsPath();
    try {
      const content = await fs.readFile(claudeSettingsPath, 'utf-8');
      const settings = JSON.parse(content);
      return {
        env: settings.env || {}
      };
    } catch {
      return { env: {} };
    }
  }
}
