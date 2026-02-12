/**
 * Email Management MCP Tools
 * Provides multi-mailbox email search and management across Gmail and IMAP accounts
 */

import { ToolDefinition } from '../types';

export const emailManagementTools: ToolDefinition[] = [
  {
    name: 'add_email_account',
    description: `Add a new email account (Gmail or IMAP) for multi-mailbox management. Returns account ID.
For Gmail: requires refreshToken from OAuth2 flow.
For IMAP: requires host, port, username, password.`,
    inputSchema: {
      type: 'object',
      properties: {
        accountName: {
          type: 'string',
          description: 'Friendly name for this account (e.g., "Personal Gmail", "Work IMAP")'
        },
        email: {
          type: 'string',
          description: 'Email address'
        },
        provider: {
          type: 'string',
          enum: ['gmail', 'imap'],
          description: 'Email provider type'
        },
        refreshToken: {
          type: 'string',
          description: 'Gmail refresh token (required for Gmail provider)'
        },
        host: {
          type: 'string',
          description: 'IMAP server hostname (required for IMAP provider)'
        },
        port: {
          type: 'number',
          description: 'IMAP server port (typically 993 for TLS, required for IMAP provider)'
        },
        username: {
          type: 'string',
          description: 'IMAP username (required for IMAP provider)'
        },
        password: {
          type: 'string',
          description: 'IMAP password (required for IMAP provider)'
        },
        defaultMailbox: {
          type: 'string',
          description: 'Default mailbox for searches (default: "INBOX")'
        },
        customUrgentKeywords: {
          type: 'array',
          items: { type: 'string' },
          description: 'Custom keywords to detect urgent emails (e.g., ["ASAP", "Critical"])'
        },
        customImportantKeywords: {
          type: 'array',
          items: { type: 'string' },
          description: 'Custom keywords to detect important emails'
        }
      },
      required: ['accountName', 'email', 'provider']
    }
  },

  {
    name: 'remove_email_account',
    description: `Remove an email account from multi-mailbox management. Returns success status.`,
    inputSchema: {
      type: 'object',
      properties: {
        accountId: {
          type: 'number',
          description: 'ID of the account to remove'
        }
      },
      required: ['accountId']
    }
  },

  {
    name: 'list_email_accounts',
    description: `List all configured email accounts. Returns account details including provider and last sync time.`,
    inputSchema: {
      type: 'object',
      properties: {
        includeInactive: {
          type: 'boolean',
          description: 'Include disabled accounts in results (default: false)',
          default: false
        }
      }
    }
  },

  {
    name: 'search_emails',
    description: `Search emails across multiple mailboxes in different accounts. Returns classified results with urgency/importance scores.
Results are automatically sorted by importance. Use minUrgencyScore or minImportanceScore to filter.`,
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query (e.g., "from:john@example.com", "subject:meeting", "deadline")'
        },
        accounts: {
          type: 'array',
          items: { type: 'number' },
          description: 'Specific account IDs to search (default: all active accounts)'
        },
        mailboxes: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific mailboxes to search (default: INBOX)'
        },
        maxResults: {
          type: 'number',
          description: 'Maximum results to return (default: 50, max: 500)',
          default: 50
        },
        minUrgencyScore: {
          type: 'number',
          description: 'Minimum urgency score (0.0-1.0) to include in results',
          minimum: 0,
          maximum: 1
        },
        minImportanceScore: {
          type: 'number',
          description: 'Minimum importance score (0.0-1.0) to include in results',
          minimum: 0,
          maximum: 1
        }
      },
      required: ['query']
    }
  },

  {
    name: 'get_urgent_emails',
    description: `Get urgent and important emails from all configured accounts.
Returns two lists: urgent (flagged, high priority) and important (meetings, contracts, etc.).
Results are sorted by urgency/importance score.`,
    inputSchema: {
      type: 'object',
      properties: {
        maxResults: {
          type: 'number',
          description: 'Maximum results per category (default: 20)',
          default: 20
        },
        accounts: {
          type: 'array',
          items: { type: 'number' },
          description: 'Specific account IDs to search (default: all active accounts)'
        },
        onlyUnread: {
          type: 'boolean',
          description: 'Only include unread emails (default: false)',
          default: false
        }
      }
    }
  },

  {
    name: 'disable_email_account',
    description: `Temporarily disable an email account without deleting it.`,
    inputSchema: {
      type: 'object',
      properties: {
        accountId: {
          type: 'number',
          description: 'ID of the account to disable'
        }
      },
      required: ['accountId']
    }
  },

  {
    name: 'enable_email_account',
    description: `Re-enable a previously disabled email account.`,
    inputSchema: {
      type: 'object',
      properties: {
        accountId: {
          type: 'number',
          description: 'ID of the account to enable'
        }
      },
      required: ['accountId']
    }
  },

  {
    name: 'update_email_account',
    description: `Update email account configuration (keywords, default mailbox, etc.).`,
    inputSchema: {
      type: 'object',
      properties: {
        accountId: {
          type: 'number',
          description: 'ID of the account to update'
        },
        defaultMailbox: {
          type: 'string',
          description: 'New default mailbox'
        },
        customUrgentKeywords: {
          type: 'array',
          items: { type: 'string' },
          description: 'Update custom urgent keywords'
        },
        customImportantKeywords: {
          type: 'array',
          items: { type: 'string' },
          description: 'Update custom important keywords'
        }
      },
      required: ['accountId']
    }
  }
];
