/**
 * Gmail Client
 * Handles email search and retrieval from Gmail using Google API
 */

import { EmailAccount, GmailConfig } from './email-account-service';

export interface EmailMessage {
  id: string;
  subject: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  body: string;
  snippet: string;
  receivedAt: Date;
  isRead: boolean;
  hasAttachments: boolean;
  labels: string[];
}

export interface SearchOptions {
  query: string;
  maxResults?: number;
  pageToken?: string;
}

export class GmailClient {
  private accessToken: string;

  constructor(private account: EmailAccount) {
    const config = account.providerConfig as GmailConfig;
    this.accessToken = config.accessToken || '';
  }

  /**
   * Search emails in Gmail
   */
  async search(options: SearchOptions): Promise<EmailMessage[]> {
    try {
      const messages = await this.searchMessages(options);
      return messages;
    } catch (error) {
      throw new Error(`Gmail search error: ${(error as Error).message}`);
    }
  }

  /**
   * Get urgent emails (with stars, important labels, etc.)
   */
  async getUrgentEmails(maxResults: number = 10): Promise<EmailMessage[]> {
    const queries = [
      'is:important',
      'label:important',
      'is:starred',
      'has:red-star',
      'in:inbox newer_than:1d'
    ];

    const allMessages: EmailMessage[] = [];
    const seen = new Set<string>();

    for (const query of queries) {
      try {
        const messages = await this.search({ query, maxResults });
        for (const msg of messages) {
          if (!seen.has(msg.id)) {
            seen.add(msg.id);
            allMessages.push(msg);
          }
        }
      } catch (error) {
        console.error(`Error searching with query "${query}":`, error);
      }
    }

    return allMessages.slice(0, maxResults);
  }

  /**
   * Search messages in Gmail
   */
  private async searchMessages(options: SearchOptions): Promise<EmailMessage[]> {
    // Build Gmail API search URL
    const params = new URLSearchParams();
    params.append('q', options.query);
    params.append('maxResults', String(options.maxResults || 10));
    if (options.pageToken) {
      params.append('pageToken', options.pageToken);
    }

    const response = await fetch(
      `https://www.googleapis.com/gmail/v1/users/me/messages?${params}`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Gmail API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as any;
    const messageIds = data.messages?.map((m: any) => m.id) || [];

    const messages: EmailMessage[] = [];
    for (const messageId of messageIds) {
      try {
        const msg = await this.getMessageDetails(messageId);
        if (msg) messages.push(msg);
      } catch (error) {
        console.error(`Error fetching message ${messageId}:`, error);
      }
    }

    return messages;
  }

  /**
   * Get message details from Gmail
   */
  private async getMessageDetails(messageId: string): Promise<EmailMessage | null> {
    const response = await fetch(
      `https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch message: ${response.status}`);
    }

    const data = (await response.json()) as any;
    const headers = data.payload?.headers || [];

    const getHeader = (name: string): string => {
      const header = headers.find((h: any) => h.name === name);
      return header?.value || '';
    };

    return {
      id: data.id,
      subject: getHeader('Subject'),
      from: getHeader('From'),
      to: getHeader('To').split(',').map((e: string) => e.trim()),
      cc: getHeader('Cc')
        ? getHeader('Cc')
            .split(',')
            .map((e: string) => e.trim())
        : [],
      body: this.getMessageBody(data),
      snippet: data.snippet,
      receivedAt: new Date(parseInt(data.internalDate)),
      isRead: !data.labelIds?.includes('UNREAD'),
      hasAttachments: !!data.payload?.parts?.some((p: any) => p.filename),
      labels: data.labelIds || []
    };
  }

  /**
   * Extract body from Gmail message
   */
  private getMessageBody(message: any): string {
    const payload = message.payload || {};

    if (payload.body?.data) {
      return Buffer.from(payload.body.data, 'base64').toString('utf-8');
    }

    if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          return Buffer.from(part.body.data, 'base64').toString('utf-8');
        }
      }
    }

    return '';
  }

  /**
   * Refresh access token if needed
   */
  async refreshAccessToken(): Promise<void> {
    const config = this.account.providerConfig as GmailConfig;

    if (!config.refreshToken) {
      throw new Error('No refresh token available');
    }

    // Call Google OAuth2 token endpoint
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        refresh_token: config.refreshToken,
        grant_type: 'refresh_token'
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh access token: ${response.statusText}`);
    }

    const data = (await response.json()) as any;
    this.accessToken = data.access_token;
    config.accessToken = data.access_token;
    config.expiresAt = Date.now() + data.expires_in * 1000;
  }
}
