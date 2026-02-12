/**
 * Email Account Service
 * Manages email account credentials and configurations
 * Supports Gmail and IMAP providers with persistent database storage
 */

import Database from 'better-sqlite3';
import crypto from 'crypto';

export interface EmailAccountConfig {
  accountName: string;
  email: string;
  provider: 'gmail' | 'imap';
  providerConfig: GmailConfig | ImapConfig;
  defaultMailbox?: string;
  includeSent?: boolean;
  includeArchived?: boolean;
  autoDetectPriority?: boolean;
  customUrgentKeywords?: string[];
  customImportantKeywords?: string[];
}

export interface GmailConfig {
  refreshToken: string;
  accessToken?: string;
  expiresAt?: number;
}

export interface ImapConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  tls?: boolean;
}

export interface EmailAccount {
  id: number;
  accountName: string;
  email: string;
  provider: 'gmail' | 'imap';
  providerConfig: GmailConfig | ImapConfig;
  isActive: boolean;
  lastSyncAt?: Date;
  syncError?: string;
  defaultMailbox?: string;
  includeSent: boolean;
  includeArchived: boolean;
  autoDetectPriority: boolean;
  customUrgentKeywords: string[];
  customImportantKeywords: string[];
  createdAt: Date;
  updatedAt: Date;
}

export class EmailAccountService {
  constructor(private db: Database.Database) {}

  /**
   * Add a new email account
   */
  addAccount(config: EmailAccountConfig): EmailAccount {
    const { accountName, email, provider, providerConfig, ...rest } = config;

    const encryptedConfig = this.encryptProviderConfig(providerConfig);

    const stmt = this.db.prepare(`
      INSERT INTO email_accounts (
        account_name, email, provider, provider_config,
        default_mailbox, include_sent, include_archived,
        auto_detect_priority, custom_urgent_keywords, custom_important_keywords
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    try {
      const result = stmt.run(
        accountName,
        email,
        provider,
        encryptedConfig,
        rest.defaultMailbox || 'INBOX',
        rest.includeSent ? 1 : 0,
        rest.includeArchived ? 1 : 0,
        rest.autoDetectPriority !== false ? 1 : 0,
        JSON.stringify(rest.customUrgentKeywords || []),
        JSON.stringify(rest.customImportantKeywords || [])
      );

      return this.getAccountById(result.lastInsertRowid as number)!;
    } catch (error) {
      if ((error as any).message.includes('UNIQUE constraint')) {
        throw new Error(`Account name "${accountName}" already exists`);
      }
      throw error;
    }
  }

  /**
   * Get account by ID
   */
  getAccountById(id: number): EmailAccount | null {
    const stmt = this.db.prepare('SELECT * FROM email_accounts WHERE id = ?');
    const row = stmt.get(id) as any;

    if (!row) return null;

    return this.rowToAccount(row);
  }

  /**
   * Get account by name
   */
  getAccountByName(accountName: string): EmailAccount | null {
    const stmt = this.db.prepare('SELECT * FROM email_accounts WHERE account_name = ?');
    const row = stmt.get(accountName) as any;

    if (!row) return null;

    return this.rowToAccount(row);
  }

  /**
   * Get account by email address
   */
  getAccountByEmail(email: string): EmailAccount | null {
    const stmt = this.db.prepare('SELECT * FROM email_accounts WHERE email = ? AND is_active = 1');
    const row = stmt.get(email) as any;

    if (!row) return null;

    return this.rowToAccount(row);
  }

  /**
   * List all active accounts
   */
  listActiveAccounts(): EmailAccount[] {
    const stmt = this.db.prepare(`
      SELECT * FROM email_accounts WHERE is_active = 1 ORDER BY created_at DESC
    `);

    return (stmt.all() as any[]).map(row => this.rowToAccount(row));
  }

  /**
   * List all accounts
   */
  listAllAccounts(): EmailAccount[] {
    const stmt = this.db.prepare(`
      SELECT * FROM email_accounts ORDER BY created_at DESC
    `);

    return (stmt.all() as any[]).map(row => this.rowToAccount(row));
  }

  /**
   * Update account configuration
   */
  updateAccount(id: number, updates: Partial<EmailAccountConfig>): EmailAccount {
    const account = this.getAccountById(id);
    if (!account) {
      throw new Error(`Account with ID ${id} not found`);
    }

    const updateFields: Record<string, any> = {};
    const params: any[] = [];

    if (updates.accountName && updates.accountName !== account.accountName) {
      updateFields['account_name'] = '?';
      params.push(updates.accountName);
    }

    if (updates.providerConfig) {
      const encryptedConfig = this.encryptProviderConfig(updates.providerConfig);
      updateFields['provider_config'] = '?';
      params.push(encryptedConfig);
    }

    if (updates.defaultMailbox) {
      updateFields['default_mailbox'] = '?';
      params.push(updates.defaultMailbox);
    }

    if (updates.includeSent !== undefined) {
      updateFields['include_sent'] = '?';
      params.push(updates.includeSent ? 1 : 0);
    }

    if (updates.includeArchived !== undefined) {
      updateFields['include_archived'] = '?';
      params.push(updates.includeArchived ? 1 : 0);
    }

    if (updates.autoDetectPriority !== undefined) {
      updateFields['auto_detect_priority'] = '?';
      params.push(updates.autoDetectPriority ? 1 : 0);
    }

    if (updates.customUrgentKeywords) {
      updateFields['custom_urgent_keywords'] = '?';
      params.push(JSON.stringify(updates.customUrgentKeywords));
    }

    if (updates.customImportantKeywords) {
      updateFields['custom_important_keywords'] = '?';
      params.push(JSON.stringify(updates.customImportantKeywords));
    }

    updateFields['updated_at'] = 'CURRENT_TIMESTAMP';

    const setClause = Object.entries(updateFields)
      .map(([key, value]) => `${key.replace(/([A-Z])/g, '_$1').toLowerCase()} = ${value}`)
      .join(', ');

    params.push(id);

    const stmt = this.db.prepare(`
      UPDATE email_accounts SET ${setClause} WHERE id = ?
    `);

    stmt.run(...params);

    return this.getAccountById(id)!;
  }

  /**
   * Delete account
   */
  deleteAccount(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM email_accounts WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * Disable account (soft delete)
   */
  disableAccount(id: number): EmailAccount {
    const stmt = this.db.prepare(`
      UPDATE email_accounts SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `);
    stmt.run(id);
    return this.getAccountById(id)!;
  }

  /**
   * Enable account
   */
  enableAccount(id: number): EmailAccount {
    const stmt = this.db.prepare(`
      UPDATE email_accounts SET is_active = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `);
    stmt.run(id);
    return this.getAccountById(id)!;
  }

  /**
   * Update last sync time
   */
  updateLastSync(id: number, error?: string): void {
    const stmt = this.db.prepare(`
      UPDATE email_accounts SET last_sync_at = CURRENT_TIMESTAMP, sync_error = ? WHERE id = ?
    `);
    stmt.run(error || null, id);
  }

  /**
   * Encrypt provider config (basic encryption - use proper encryption in production)
   */
  private encryptProviderConfig(config: GmailConfig | ImapConfig): string {
    // In production, use proper encryption with key management
    // For now, we do base64 encoding
    const jsonStr = JSON.stringify(config);
    return Buffer.from(jsonStr).toString('base64');
  }

  /**
   * Decrypt provider config
   */
  decryptProviderConfig(encrypted: string): GmailConfig | ImapConfig {
    const jsonStr = Buffer.from(encrypted, 'base64').toString('utf-8');
    return JSON.parse(jsonStr);
  }

  /**
   * Convert database row to EmailAccount object
   */
  private rowToAccount(row: any): EmailAccount {
    return {
      id: row.id,
      accountName: row.account_name,
      email: row.email,
      provider: row.provider,
      providerConfig: this.decryptProviderConfig(row.provider_config),
      isActive: row.is_active === 1,
      lastSyncAt: row.last_sync_at ? new Date(row.last_sync_at) : undefined,
      syncError: row.sync_error,
      defaultMailbox: row.default_mailbox,
      includeSent: row.include_sent === 1,
      includeArchived: row.include_archived === 1,
      autoDetectPriority: row.auto_detect_priority === 1,
      customUrgentKeywords: JSON.parse(row.custom_urgent_keywords || '[]'),
      customImportantKeywords: JSON.parse(row.custom_important_keywords || '[]'),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
}
