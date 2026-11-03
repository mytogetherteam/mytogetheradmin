import { apiClient } from './apiClient';
import { config } from '@/config/config';

export interface BackupItem {
  filename: string;
  sizeBytes: number;
  sizeFormatted: string;
  createdAt: string;
}

class DatabaseBackupService {
  async getBackups(): Promise<BackupItem[]> {
    return apiClient.get<BackupItem[]>(
      config.endpoints.admin.system.databaseBackup.base,
    );
  }

  async createBackup(): Promise<BackupItem> {
    return apiClient.post<BackupItem>(
      config.endpoints.admin.system.databaseBackup.create,
      {},
    );
  }

  async deleteBackup(filename: string): Promise<void> {
    return apiClient.delete(
      config.endpoints.admin.system.databaseBackup.delete(filename),
    );
  }

  async downloadBackup(filename: string): Promise<void> {
    const token = localStorage.getItem(config.storage.tokenKey);
    const endpoint =
      config.endpoints.admin.system.databaseBackup.download(filename);
    const url = `${config.apiBaseUrl}${endpoint}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(errText || `Failed to download: ${response.statusText}`);
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  }
}

export const databaseBackupService = new DatabaseBackupService();
