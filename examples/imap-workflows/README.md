# IMAP Email Management Workflows for n8n

This directory contains example n8n workflows for managing emails via IMAP. These workflows demonstrate common email automation patterns and can be customized for your specific needs.

## Workflows Overview

### 1. Basic Email Monitoring (`01-basic-email-monitoring.json`)

**Purpose:** Simple email monitoring and logging

**Features:**
- Monitors IMAP INBOX for new emails
- Extracts basic email information (from, subject, date, body)
- Logs email details to console

**Use Cases:**
- Getting started with IMAP email automation
- Testing IMAP connectivity
- Basic email logging

---

### 2. Email Filtering with Notifications (`02-email-filtering-notification.json`)

**Purpose:** Filter important/urgent emails and send notifications

**Features:**
- Monitors IMAP mailbox continuously
- Filters emails containing "urgent" or "important" in subject
- Formats and sends notifications
- Placeholder for integration with notification services (Slack, Discord, SMS, etc.)

**Use Cases:**
- Alert systems for critical emails
- VIP email notifications
- Emergency email monitoring

**Customization:**
- Replace the placeholder in "Send Notification" node with actual notification service
- Adjust filter conditions for your specific keywords
- Add additional notification channels

---

### 3. Email Attachment Processing (`03-email-attachment-processing.json`)

**Purpose:** Process and route email attachments by file type

**Features:**
- Monitors emails with attachments
- Extracts attachment metadata (filename, type, size)
- Routes attachments by type (PDF, images, etc.)
- Separate processing paths for different file types

**Use Cases:**
- Automatic invoice processing (PDF extraction)
- Image handling and storage
- Document management automation
- File type-specific workflows

**Customization:**
- Add more file type filters (Excel, Word, etc.)
- Implement storage solutions (Google Drive, Dropbox, S3)
- Add OCR or document parsing
- Create file validation logic

---

### 4. Email Auto-Categorization (`04-email-auto-categorization.json`)

**Purpose:** Automatically categorize and route emails by content

**Features:**
- Intelligent email categorization (finance, support, orders, automated, meetings, general)
- Priority detection (urgent, high, normal, low)
- Category-based routing to specialized handlers
- Timestamp tracking

**Categories:**
- **Finance:** Invoices, payments, receipts
- **Orders:** Order confirmations, shipping, delivery
- **Support:** Help requests, issues
- **Automated:** No-reply emails
- **Meetings:** Calendar invites, meeting requests
- **General:** Everything else

**Use Cases:**
- Email triage automation
- Department-specific email routing
- Customer service automation
- Order processing workflows

**Customization:**
- Add custom categories
- Enhance categorization logic with AI/ML
- Integrate with CRM or ticketing systems
- Add database storage for email records

---

### 5. Email to Slack Integration (`05-email-to-slack-integration.json`)

**Purpose:** Forward email notifications to Slack with rich formatting

**Features:**
- Monitors IMAP mailbox
- Determines email priority automatically
- Formats rich Slack messages with blocks
- Color-coded by urgency
- Shows attachment status
- Displays email preview

**Priority Levels:**
- 🚨 **Urgent:** Contains "urgent", "critical", "asap" (red)
- ⚠️ **High:** Contains "important" (orange)
- 🤖 **Low:** Automated emails (gray)
- 📧 **Normal:** All other emails (green)

**Use Cases:**
- Team email notifications
- Customer inquiry alerts
- Order notification system
- Support ticket monitoring

**Customization:**
- Change Slack channel
- Adjust priority detection keywords
- Add more emoji indicators
- Include attachments in Slack message
- Add action buttons for quick responses
- Integrate with Discord or other chat platforms

---

## Setup Instructions

### Prerequisites

1. **n8n installation:** Ensure n8n is installed and running
2. **IMAP account:** Email account with IMAP access enabled
3. **Credentials:** Set up IMAP credentials in n8n

### IMAP Credentials Setup

1. Go to n8n → Credentials → Add Credential
2. Select "IMAP"
3. Enter your email provider's IMAP settings:
   - **Host:** (e.g., imap.gmail.com, outlook.office365.com)
   - **Port:** Usually 993 for SSL/TLS
   - **User:** Your email address
   - **Password:** Your email password or app-specific password
   - **SSL/TLS:** Enable

**Common IMAP Settings:**

| Provider | Host | Port | SSL |
|----------|------|------|-----|
| Gmail | imap.gmail.com | 993 | Yes |
| Outlook/Office 365 | outlook.office365.com | 993 | Yes |
| Yahoo | imap.mail.yahoo.com | 993 | Yes |
| iCloud | imap.mail.me.com | 993 | Yes |

**Important for Gmail:**
- Enable "Less secure app access" OR use an App Password
- Enable IMAP in Gmail settings

### Importing Workflows

1. Copy the JSON content from any workflow file
2. In n8n, click "Import from File" or "Import from URL"
3. Paste the JSON content
4. Save the workflow
5. Configure your IMAP credentials
6. Activate the workflow

### Testing Workflows

1. Import the workflow into n8n
2. Update the IMAP credentials reference
3. Click "Execute Workflow" to test
4. Send a test email to your monitored inbox
5. Check the execution log for results

---

## Customization Guide

### Changing the Monitored Mailbox

In the IMAP Email Trigger node, change the `mailbox` parameter:

```json
"parameters": {
  "mailbox": "INBOX",  // Change to "Sent", "Drafts", "Custom/Folder", etc.
  ...
}
```

### Adjusting Check Frequency

Add or modify the polling options:

```json
"options": {
  "forceReconnect": 10,  // Reconnect every 10 minutes
  "pollingInterval": 60   // Check every 60 seconds (if supported)
}
```

### Adding Email Filters

Use the Filter node or modify the Code node to add custom conditions:

```javascript
const subject = $json.subject.toLowerCase();
const from = $json.from.text.toLowerCase();

// Custom filtering logic
if (from.includes('@important-domain.com') && subject.includes('order')) {
  // Process this email
  return $input.item;
}

// Skip this email
return null;
```

### Integrating with Other Services

Replace placeholder nodes with actual service integrations:

- **Slack:** Use Slack node (as shown in workflow 5)
- **Discord:** Use Discord node
- **SMS:** Use Twilio node
- **Database:** Use PostgreSQL, MySQL, or MongoDB nodes
- **Cloud Storage:** Use Google Drive, Dropbox, or AWS S3 nodes
- **CRM:** Use HubSpot, Salesforce, or Pipedrive nodes

---

## Advanced Use Cases

### Email to Database

Add a database node after email extraction to store email records:

```javascript
// In a Code node, structure data for database
return {
  json: {
    email_id: $json.messageId,
    from_address: $json.from.text,
    subject: $json.subject,
    received_date: $json.date,
    body: $json.textPlain,
    category: $json.category,
    processed: false,
    created_at: new Date().toISOString()
  }
};
```

### AI-Powered Email Classification

Integrate with OpenAI or other AI services for intelligent categorization:

1. Add HTTP Request node to call AI API
2. Send email subject and body for analysis
3. Use AI response to categorize and route emails

### Multi-Mailbox Monitoring

Create separate workflows for different mailboxes or use multiple IMAP trigger nodes with different folder configurations.

### Email Response Automation

Add Email Send node to automatically respond to certain email types:

```javascript
// In a Code node
if ($json.category === 'support') {
  return {
    json: {
      to: $json.from.text,
      subject: `Re: ${$json.subject}`,
      body: 'Thank you for contacting support. We have received your message and will respond within 24 hours.'
    }
  };
}
```

---

## Troubleshooting

### Common Issues

**Connection refused:**
- Check IMAP host and port
- Verify SSL/TLS settings
- Ensure IMAP is enabled in your email provider

**Authentication failed:**
- Use app-specific passwords for Gmail
- Enable "less secure apps" or use OAuth2
- Check username (usually full email address)

**No emails detected:**
- Verify the mailbox name (case-sensitive)
- Check if emails are in the specified folder
- Review filter conditions

**Workflow not triggering:**
- Ensure workflow is activated
- Check execution logs for errors
- Verify polling interval settings

---

## Security Best Practices

1. **Use app-specific passwords** instead of main account passwords
2. **Store credentials securely** in n8n's credential system
3. **Limit mailbox access** to only necessary folders
4. **Enable 2FA** on your email account
5. **Regularly rotate credentials**
6. **Monitor workflow executions** for suspicious activity
7. **Use environment variables** for sensitive configuration

---

## Performance Optimization

1. **Limit polling frequency** to reduce server load
2. **Use specific mailbox folders** instead of monitoring entire inbox
3. **Add filters early** in the workflow to reduce processing
4. **Batch process** attachments instead of individual processing
5. **Archive processed emails** to reduce future scans
6. **Set execution limits** to prevent runaway workflows

---

## Contributing

Feel free to extend these workflows and contribute back:

1. Fork the repository
2. Create your feature branch
3. Add new workflows or enhance existing ones
4. Submit a pull request

---

## License

These workflows are provided as examples for educational and development purposes.

---

## Support

For questions and issues:
- Check the [n8n documentation](https://docs.n8n.io)
- Visit the [n8n community forum](https://community.n8n.io)
- Review the workflow execution logs in n8n

---

## Related Resources

- [n8n IMAP Email Node Documentation](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.emailreadimap/)
- [n8n Email Send Node Documentation](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.emailsend/)
- [n8n Workflow Examples](https://n8n.io/workflows)
- [IMAP RFC Specification](https://tools.ietf.org/html/rfc3501)

---

**Last Updated:** 2025-12-23
**n8n Version:** Compatible with n8n v1.0+
**Workflow Version:** 1.0

Conceived by Romuald Członkowski - [AI Advisors](https://www.aiadvisors.pl/en)
