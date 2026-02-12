/**
 * Email Client Factory
 * Creates appropriate email clients (Gmail or IMAP) based on provider
 */

import { GmailClient } from './gmail-client';
import { ImapClient } from './imap-client';
import { EmailAccount } from './email-account-service';

export type EmailClient = GmailClient | ImapClient;

export class EmailClientFactory {
  /**
   * Create email client based on account provider
   */
  static createClient(account: EmailAccount): EmailClient {
    switch (account.provider) {
      case 'gmail':
        return new GmailClient(account);

      case 'imap':
        return new ImapClient(account);

      default:
        throw new Error(`Unsupported email provider: ${account.provider}`);
    }
  }
}

export { GmailClient, ImapClient };
