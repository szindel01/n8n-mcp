/**
 * Email Search Service
 * Searches emails across multiple mailboxes and classifies them as urgent/important
 */

import Database from 'better-sqlite3';
import { EmailAccountService, EmailAccount } from './email-account-service';
import { EmailClientFactory } from './email-client-factory';

export interface SearchCriteria {
  query: string;
  accounts?: number[];        // Specific account IDs to search
  mailboxes?: string[];       // Specific mailboxes to search
  maxResults?: number;
  minUrgencyScore?: number;
  minImportanceScore?: number;
}

export interface ClassifiedEmail {
  id: string;
  accountId: number;
  accountName: string;
  subject: string;
  from: string;
  recipients: string[];
  snippet: string;
  receivedAt: Date;
  isRead: boolean;
  hasAttachments: boolean;
  isUrgent: boolean;
  isImportant: boolean;
  urgencyScore: number;
  importanceScore: number;
  importanceReason: string[];
}

const DEFAULT_URGENT_KEYWORDS = [
  'urgent', 'asap', 'critical', 'emergency', 'immediately', 'rush',
  'time-sensitive', 'deadline', 'important', 'high priority',
  'action required', 'attention needed'
];

const DEFAULT_IMPORTANT_KEYWORDS = [
  'meeting', 'conference', 'presentation', 'proposal', 'deal',
  'contract', 'agreement', 'approval', 'review', 'approval needed',
  'signature', 'confirmation', 'important'
];

export class EmailSearchService {
  private accountService: EmailAccountService;

  constructor(private db: Database.Database) {
    this.accountService = new EmailAccountService(db);
  }

  /**
   * Search emails across multiple accounts
   */
  async searchEmails(criteria: SearchCriteria): Promise<ClassifiedEmail[]> {
    const { query, accounts, mailboxes, maxResults = 50 } = criteria;

    // Get accounts to search
    const accountsToSearch: EmailAccount[] = accounts
      ? accounts.map(id => this.accountService.getAccountById(id)).filter(Boolean) as EmailAccount[]
      : this.accountService.listActiveAccounts();

    if (accountsToSearch.length === 0) {
      throw new Error('No email accounts available for search');
    }

    const allResults: ClassifiedEmail[] = [];
    const seen = new Set<string>();

    // Search in each account
    for (const account of accountsToSearch) {
      try {
        const client = EmailClientFactory.createClient(account);
        const messages = await client.search({
          query,
          maxResults: maxResults * 2
        });

        // Classify messages
        for (const msg of messages) {
          const key = `${account.id}:${msg.id}`;
          if (!seen.has(key)) {
            seen.add(key);

            const { isUrgent, isImportant, urgencyScore, importanceScore, reasons } =
              this.classifyEmail(msg, account);

            // Store in cache
            this.cacheSearchResult(account.id, msg, {
              isUrgent,
              isImportant,
              urgencyScore,
              importanceScore,
              reasons
            });

            allResults.push({
              id: msg.id,
              accountId: account.id,
              accountName: account.accountName,
              subject: msg.subject,
              from: msg.from,
              recipients: msg.to,
              snippet: msg.snippet,
              receivedAt: msg.receivedAt,
              isRead: msg.isRead,
              hasAttachments: msg.hasAttachments,
              isUrgent,
              isImportant,
              urgencyScore,
              importanceScore,
              importanceReason: reasons
            });
          }
        }
      } catch (error) {
        console.error(`Error searching account ${account.accountName}:`, error);
        // Continue with next account
      }
    }

    // Sort by importance/urgency
    allResults.sort((a, b) => {
      const aScore = a.urgencyScore * 2 + a.importanceScore;
      const bScore = b.urgencyScore * 2 + b.importanceScore;
      return bScore - aScore;
    });

    return allResults.slice(0, maxResults);
  }

  /**
   * Get urgent and important emails
   */
  async getUrgentAndImportantEmails(
    maxResults: number = 20
  ): Promise<{ urgent: ClassifiedEmail[]; important: ClassifiedEmail[] }> {
    const accounts = this.accountService.listActiveAccounts();

    if (accounts.length === 0) {
      throw new Error('No email accounts configured');
    }

    const urgentEmails: ClassifiedEmail[] = [];
    const importantEmails: ClassifiedEmail[] = [];
    const seen = new Set<string>();

    // Fetch from each account
    for (const account of accounts) {
      try {
        const client = EmailClientFactory.createClient(account);
        const messages = await client.getUrgentEmails(maxResults * 2);

        for (const msg of messages) {
          const key = `${account.id}:${msg.id}`;
          if (!seen.has(key)) {
            seen.add(key);

            const { isUrgent, isImportant, urgencyScore, importanceScore, reasons } =
              this.classifyEmail(msg, account);

            const classified: ClassifiedEmail = {
              id: msg.id,
              accountId: account.id,
              accountName: account.accountName,
              subject: msg.subject,
              from: msg.from,
              recipients: msg.to,
              snippet: msg.snippet,
              receivedAt: msg.receivedAt,
              isRead: msg.isRead,
              hasAttachments: msg.hasAttachments,
              isUrgent,
              isImportant,
              urgencyScore,
              importanceScore,
              importanceReason: reasons
            };

            if (isUrgent) urgentEmails.push(classified);
            if (isImportant) importantEmails.push(classified);
          }
        }
      } catch (error) {
        console.error(`Error fetching urgent emails from ${account.accountName}:`, error);
      }
    }

    // Sort by score
    urgentEmails.sort((a, b) => b.urgencyScore - a.urgencyScore);
    importantEmails.sort((a, b) => b.importanceScore - a.importanceScore);

    return {
      urgent: urgentEmails.slice(0, maxResults),
      important: importantEmails.slice(0, maxResults)
    };
  }

  /**
   * Classify email as urgent/important with scoring
   */
  private classifyEmail(
    message: any,
    account: EmailAccount
  ): {
    isUrgent: boolean;
    isImportant: boolean;
    urgencyScore: number;
    importanceScore: number;
    reasons: string[];
  } {
    const reasons: string[] = [];
    let urgencyScore = 0;
    let importanceScore = 0;

    const text = `${message.subject} ${message.snippet}`.toLowerCase();
    const urgentKeywords = account.customUrgentKeywords.length > 0
      ? account.customUrgentKeywords
      : DEFAULT_URGENT_KEYWORDS;
    const importantKeywords = account.customImportantKeywords.length > 0
      ? account.customImportantKeywords
      : DEFAULT_IMPORTANT_KEYWORDS;

    // Check for urgent keywords
    for (const keyword of urgentKeywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = text.match(regex) || [];
      if (matches.length > 0) {
        urgencyScore += Math.min(matches.length * 0.15, 0.5);
        reasons.push(`Contains urgent keyword: "${keyword}"`);
      }
    }

    // Check for important keywords
    for (const keyword of importantKeywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = text.match(regex) || [];
      if (matches.length > 0) {
        importanceScore += Math.min(matches.length * 0.15, 0.5);
        reasons.push(`Contains important keyword: "${keyword}"`);
      }
    }

    // Check if unread
    if (!message.isRead) {
      urgencyScore += 0.2;
      importanceScore += 0.1;
      reasons.push('Email is unread');
    }

    // Check if has attachments
    if (message.hasAttachments) {
      importanceScore += 0.25;
      reasons.push('Email has attachments');
    }

    // Check for Gmail-specific important labels
    if (account.provider === 'gmail' && message.labels) {
      if (message.labels.includes('IMPORTANT') || message.labels.includes('STARRED')) {
        urgencyScore = Math.min(urgencyScore + 0.3, 1.0);
        importanceScore = Math.min(importanceScore + 0.3, 1.0);
        reasons.push('Marked as important/starred in Gmail');
      }
    }

    // Check for recent emails
    const daysSinceReceived = (Date.now() - message.receivedAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceReceived < 1) {
      urgencyScore += 0.15;
      reasons.push('Received within last 24 hours');
    }

    return {
      isUrgent: urgencyScore >= 0.3,
      isImportant: importanceScore >= 0.3,
      urgencyScore: Math.min(urgencyScore, 1.0),
      importanceScore: Math.min(importanceScore, 1.0),
      reasons
    };
  }

  /**
   * Cache search result in database
   */
  private cacheSearchResult(
    accountId: number,
    message: any,
    classification: {
      isUrgent: boolean;
      isImportant: boolean;
      urgencyScore: number;
      importanceScore: number;
      reasons: string[];
    }
  ): void {
    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO email_search_results (
          account_id, search_query, message_id, subject, sender, recipients,
          snippet, labels, is_urgent, is_important, urgency_score, importance_score,
          importance_reason, received_at, is_read, has_attachments
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        accountId,
        '', // search_query would be set based on actual search
        message.id,
        message.subject,
        message.from,
        JSON.stringify(message.to),
        message.snippet,
        JSON.stringify(message.labels || []),
        classification.isUrgent ? 1 : 0,
        classification.isImportant ? 1 : 0,
        classification.urgencyScore,
        classification.importanceScore,
        JSON.stringify(classification.reasons),
        new Date(message.receivedAt).toISOString(),
        message.isRead ? 1 : 0,
        message.hasAttachments ? 1 : 0
      );
    } catch (error) {
      console.error('Error caching search result:', error);
    }
  }
}
