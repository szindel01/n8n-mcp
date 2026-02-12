/**
 * Email Management Tools Handlers
 * Implements handlers for all email management MCP tools
 */

import Database from 'better-sqlite3';
import { EmailAccountService, EmailAccountConfig } from '../services/email-account-service';
import { EmailSearchService } from '../services/email-search-service';

export interface EmailToolsHandlers {
  addEmailAccount(params: any): Promise<any>;
  removeEmailAccount(params: any): Promise<any>;
  listEmailAccounts(params: any): Promise<any>;
  searchEmails(params: any): Promise<any>;
  getUrgentEmails(params: any): Promise<any>;
  disableEmailAccount(params: any): Promise<any>;
  enableEmailAccount(params: any): Promise<any>;
  updateEmailAccount(params: any): Promise<any>;
}

export function createEmailToolsHandlers(db: Database.Database): EmailToolsHandlers {
  const accountService = new EmailAccountService(db);
  const searchService = new EmailSearchService(db);

  return {
    async addEmailAccount(params: any) {
      const {
        accountName,
        email,
        provider,
        refreshToken,
        host,
        port,
        username,
        password,
        defaultMailbox,
        customUrgentKeywords,
        customImportantKeywords
      } = params;

      // Validate required fields
      if (!accountName || !email || !provider) {
        throw new Error('Missing required fields: accountName, email, provider');
      }

      if (provider === 'gmail' && !refreshToken) {
        throw new Error('Gmail provider requires refreshToken');
      }

      if (provider === 'imap' && (!host || !port || !username || !password)) {
        throw new Error('IMAP provider requires host, port, username, password');
      }

      // Build provider config
      let providerConfig: any;
      if (provider === 'gmail') {
        providerConfig = { refreshToken };
      } else {
        providerConfig = { host, port, username, password, tls: true };
      }

      const config: EmailAccountConfig = {
        accountName,
        email,
        provider: provider as 'gmail' | 'imap',
        providerConfig,
        defaultMailbox,
        customUrgentKeywords,
        customImportantKeywords
      };

      const account = accountService.addAccount(config);

      return {
        success: true,
        accountId: account.id,
        accountName: account.accountName,
        email: account.email,
        provider: account.provider,
        message: `Email account "${accountName}" added successfully`
      };
    },

    async removeEmailAccount(params: any) {
      const { accountId } = params;

      if (!accountId) {
        throw new Error('Missing required field: accountId');
      }

      const account = accountService.getAccountById(accountId);
      if (!account) {
        throw new Error(`Account with ID ${accountId} not found`);
      }

      const deleted = accountService.deleteAccount(accountId);

      if (!deleted) {
        throw new Error('Failed to delete account');
      }

      return {
        success: true,
        message: `Email account "${account.accountName}" removed successfully`
      };
    },

    async listEmailAccounts(params: any) {
      const { includeInactive = false } = params;

      const accounts = includeInactive
        ? accountService.listAllAccounts()
        : accountService.listActiveAccounts();

      return {
        success: true,
        count: accounts.length,
        accounts: accounts.map(acc => ({
          id: acc.id,
          accountName: acc.accountName,
          email: acc.email,
          provider: acc.provider,
          isActive: acc.isActive,
          lastSyncAt: acc.lastSyncAt,
          syncError: acc.syncError,
          defaultMailbox: acc.defaultMailbox,
          createdAt: acc.createdAt
        }))
      };
    },

    async searchEmails(params: any) {
      const {
        query,
        accounts,
        mailboxes,
        maxResults = 50,
        minUrgencyScore,
        minImportanceScore
      } = params;

      if (!query) {
        throw new Error('Missing required field: query');
      }

      if (maxResults > 500) {
        throw new Error('maxResults cannot exceed 500');
      }

      const results = await searchService.searchEmails({
        query,
        accounts,
        mailboxes,
        maxResults,
        minUrgencyScore,
        minImportanceScore
      });

      // Filter by scores if specified
      const filtered = results.filter(email => {
        if (minUrgencyScore && email.urgencyScore < minUrgencyScore) return false;
        if (minImportanceScore && email.importanceScore < minImportanceScore) return false;
        return true;
      });

      return {
        success: true,
        query,
        totalResults: filtered.length,
        results: filtered.map(email => ({
          id: email.id,
          accountName: email.accountName,
          subject: email.subject,
          from: email.from,
          recipients: email.recipients,
          snippet: email.snippet,
          receivedAt: email.receivedAt,
          isRead: email.isRead,
          hasAttachments: email.hasAttachments,
          isUrgent: email.isUrgent,
          isImportant: email.isImportant,
          urgencyScore: email.urgencyScore.toFixed(2),
          importanceScore: email.importanceScore.toFixed(2),
          importanceReason: email.importanceReason
        }))
      };
    },

    async getUrgentEmails(params: any) {
      const {
        maxResults = 20,
        accounts,
        onlyUnread = false
      } = params;

      if (maxResults > 500) {
        throw new Error('maxResults cannot exceed 500');
      }

      const { urgent, important } = await searchService.getUrgentAndImportantEmails(maxResults);

      // Filter if needed
      const filteredUrgent = onlyUnread ? urgent.filter(e => !e.isRead) : urgent;
      const filteredImportant = onlyUnread ? important.filter(e => !e.isRead) : important;

      return {
        success: true,
        urgent: {
          count: filteredUrgent.length,
          emails: filteredUrgent.map(email => ({
            id: email.id,
            accountName: email.accountName,
            subject: email.subject,
            from: email.from,
            snippet: email.snippet,
            receivedAt: email.receivedAt,
            isRead: email.isRead,
            hasAttachments: email.hasAttachments,
            urgencyScore: email.urgencyScore.toFixed(2),
            importanceReason: email.importanceReason
          }))
        },
        important: {
          count: filteredImportant.length,
          emails: filteredImportant.map(email => ({
            id: email.id,
            accountName: email.accountName,
            subject: email.subject,
            from: email.from,
            snippet: email.snippet,
            receivedAt: email.receivedAt,
            isRead: email.isRead,
            hasAttachments: email.hasAttachments,
            importanceScore: email.importanceScore.toFixed(2),
            importanceReason: email.importanceReason
          }))
        }
      };
    },

    async disableEmailAccount(params: any) {
      const { accountId } = params;

      if (!accountId) {
        throw new Error('Missing required field: accountId');
      }

      const account = accountService.getAccountById(accountId);
      if (!account) {
        throw new Error(`Account with ID ${accountId} not found`);
      }

      const updated = accountService.disableAccount(accountId);

      return {
        success: true,
        accountId: updated.id,
        accountName: updated.accountName,
        isActive: updated.isActive,
        message: `Account "${updated.accountName}" has been disabled`
      };
    },

    async enableEmailAccount(params: any) {
      const { accountId } = params;

      if (!accountId) {
        throw new Error('Missing required field: accountId');
      }

      const account = accountService.getAccountById(accountId);
      if (!account) {
        throw new Error(`Account with ID ${accountId} not found`);
      }

      const updated = accountService.enableAccount(accountId);

      return {
        success: true,
        accountId: updated.id,
        accountName: updated.accountName,
        isActive: updated.isActive,
        message: `Account "${updated.accountName}" has been enabled`
      };
    },

    async updateEmailAccount(params: any) {
      const {
        accountId,
        defaultMailbox,
        customUrgentKeywords,
        customImportantKeywords
      } = params;

      if (!accountId) {
        throw new Error('Missing required field: accountId');
      }

      const account = accountService.getAccountById(accountId);
      if (!account) {
        throw new Error(`Account with ID ${accountId} not found`);
      }

      const updates: Partial<EmailAccountConfig> = {};
      if (defaultMailbox) updates.defaultMailbox = defaultMailbox;
      if (customUrgentKeywords) updates.customUrgentKeywords = customUrgentKeywords;
      if (customImportantKeywords) updates.customImportantKeywords = customImportantKeywords;

      const updated = accountService.updateAccount(accountId, updates);

      return {
        success: true,
        accountId: updated.id,
        accountName: updated.accountName,
        defaultMailbox: updated.defaultMailbox,
        message: `Account "${updated.accountName}" updated successfully`
      };
    }
  };
}
