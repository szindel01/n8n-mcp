# 🚀 Email Management - Quick Start Guide

## 5 Minutes Setup

### Step 1: Copy Workflow JSON
```bash
# Choose one of these files:
- email-complete-setup-orchestration.json   (Recommended - Full Setup)
- email-monitoring-24-7.json               (Monitoring - Continuous)
- email-setup-workflow.json                (Manual Account Setup)
- email-search-urgent-workflow.json        (Urgent Emails - Automated)
- email-custom-search-workflow.json        (Custom Search)
- email-account-management-workflow.json   (Admin Dashboard)
```

### Step 2: Import into n8n
1. Open n8n Dashboard
2. Click **"Create"** → **"Import from File"** or **"Import from URL"**
3. Paste the workflow JSON content
4. Click **"Import"**

### Step 3: Configure MCP Connection
1. In the workflow, click **any MCP Tool node**
2. Find credential: `MCP Connection`
3. Click **"Create New"**
4. Enter:
   - **Name**: n8n-mcp
   - **URL**: `http://localhost:3000` (or your URL)
   - **Auth Token**: (if required)
5. Click **"Save"**

### Step 4: Edit Configuration
1. Find **"Define Configuration"** or **"Set Parameters"** node
2. Edit the JSON:

```json
{
  "accounts": [
    {
      "accountName": "My Gmail",
      "email": "you@gmail.com",
      "provider": "gmail",
      "refreshToken": "YOUR_TOKEN_HERE",
      "customUrgentKeywords": ["urgent", "ASAP"]
    }
  ]
}
```

### Step 5: Test & Activate
1. Click **"Execute Workflow"** (Play button)
2. Check the results
3. If OK, toggle **"Active"** to enable automation
4. Done! ✅

---

## 📊 Workflow Selection Guide

| Workflow | Purpose | Trigger | Best For |
|----------|---------|---------|----------|
| **Complete Setup** | Full system setup | Manual | First-time setup |
| **Monitoring 24/7** | Continuous monitoring | Hourly + Daily | Production monitoring |
| **Setup** | Add accounts | Manual | Adding new accounts |
| **Search Urgent** | Find urgent emails | Every 5 min | Live alerts |
| **Custom Search** | Advanced search | Manual | Custom queries |
| **Account Management** | Admin tasks | Manual | Account maintenance |

---

## 🔑 Gmail Setup (OAuth)

### Get Gmail Refresh Token
```bash
1. Go to: https://console.cloud.google.com
2. Create a new project
3. Enable Gmail API
4. Create OAuth 2.0 credentials (Desktop app)
5. Download credentials JSON
6. Use Google's OAuth flow to get refresh token
7. Copy refresh token to workflow config
```

**Minimum Scopes Needed:**
```
- https://www.googleapis.com/auth/gmail.readonly
- https://www.googleapis.com/auth/gmail.modify
```

---

## 🔐 IMAP Setup (Outlook/Other)

### For Microsoft Outlook
```json
{
  "accountName": "Work Outlook",
  "email": "name@company.com",
  "provider": "imap",
  "host": "outlook.office365.com",
  "port": 993,
  "username": "name@company.com",
  "password": "YOUR_APP_PASSWORD"
}
```

⚠️ **Important:** Use **App Password**, not your regular password
- Go to: https://account.microsoft.com/security
- Create "App password"
- Use that password in workflow

### For Other IMAP Servers
```json
{
  "host": "imap.example.com",
  "port": 993,
  "username": "your@email.com",
  "password": "your_password"
}
```

Common IMAP hosts:
- Gmail: `imap.gmail.com` (port 993)
- Yahoo: `imap.mail.yahoo.com` (port 993)
- ProtonMail: `imap.protonmail.com` (port 993)

---

## 📧 Custom Keywords

Customize what counts as "urgent" or "important":

```json
{
  "customUrgentKeywords": [
    "urgent",
    "ASAP",
    "critical",
    "emergency",
    "immediately",
    "deadline",
    "action required"
  ],
  "customImportantKeywords": [
    "meeting",
    "contract",
    "proposal",
    "approval",
    "decision",
    "budget",
    "strategy"
  ]
}
```

---

## 🔔 Slack Integration (Optional)

### Setup Slack Notifications

1. **Create Slack App**
   - Go to: https://api.slack.com/apps
   - Click "Create New App"
   - Choose "From scratch"
   - Name: "Email Bot"
   - Select your workspace

2. **Add Permissions**
   - Go to "OAuth & Permissions"
   - Add scope: `chat:write`
   - Install app to workspace

3. **Get Token**
   - Copy "Bot User OAuth Token" (starts with `xoxb-`)

4. **Add to n8n**
   - In workflow, click Slack node
   - Create Slack credential
   - Paste token
   - Select channel: `#emails`

5. **Create Channels**
   - `#emails` - All emails
   - `#emails-critical` - Critical only
   - `#emails-urgent` - Urgent emails

---

## 🧪 Test Your Setup

### Test 1: Account Connection
```bash
1. Run: email-complete-setup-orchestration.json
2. Check: "✅ List All Configured Accounts" node
3. Should see: Your accounts listed
```

### Test 2: Email Retrieval
```bash
1. Run: email-search-urgent-workflow.json (manual trigger)
2. Check: Urgent emails found?
3. Check: Correct account names?
```

### Test 3: Search
```bash
1. Run: email-custom-search-workflow.json
2. Edit: Change search query
3. Try: from:someone@example.com
4. Check: Results display correctly
```

### Test 4: Slack Integration
```bash
1. Add Slack node to a workflow
2. Test: Send test message
3. Check: Message appears in channel
```

---

## 🐛 Troubleshooting

### Problem: "MCP Connection Error"
```
❌ Solution:
1. Check MCP server is running: npm start:http
2. Verify URL/port in credential
3. Check firewall settings
```

### Problem: "Gmail: 401 Unauthorized"
```
❌ Solution:
1. Refresh token may be expired
2. Re-run OAuth flow to get new token
3. Check scopes include gmail.readonly
```

### Problem: "IMAP: Connection Timeout"
```
❌ Solution:
1. Verify host: outlook.office365.com, not smtp
2. Use port 993 (TLS), not 587 (SMTP)
3. Check firewall blocks port 993
4. Use App Password (not regular password)
```

### Problem: "No Emails Found"
```
❌ Solution:
1. Accounts properly configured?
2. Any emails in the account?
3. Try simpler search: is:unread
4. Check account is marked "active"
```

### Problem: "Workflow Keeps Failing"
```
❌ Solution:
1. Check n8n logs: docker logs n8n
2. Check MCP logs: check console output
3. Verify all credentials are valid
4. Try running with test data first
```

---

## 📈 Production Checklist

```
Before going live:

☐ Test all workflows manually first
☐ Verify MCP server is stable
☐ Backup existing email configuration
☐ Enable monitoring workflows
☐ Setup Slack notifications
☐ Configure backup storage
☐ Setup error alerts
☐ Test account failover
☐ Document custom keywords
☐ Setup retention policies
☐ Enable logging
☐ Schedule maintenance windows
```

---

## 🎯 Next Steps

1. **Import Master Workflow**: `email-complete-setup-orchestration.json`
2. **Configure Email Accounts**: Add your Gmail/IMAP credentials
3. **Test Account Connection**: Run setup workflow
4. **Enable Monitoring**: Activate `email-monitoring-24-7.json`
5. **Setup Notifications**: Connect Slack (optional)
6. **Customize Keywords**: Adjust urgent/important keywords
7. **Monitor Dashboard**: Check reports daily

---

## 💡 Pro Tips

### Tip 1: Batch Processing
Use "Loop" nodes to process multiple accounts efficiently

### Tip 2: Custom Scores
Adjust urgency/importance thresholds in code nodes

### Tip 3: Archive Strategy
Create workflow to auto-archive old emails

### Tip 4: Integration
Add Slack, Jira, or other integrations to workflows

### Tip 5: Analytics
Export reports to Google Sheets for analytics

---

## 📞 Need Help?

1. Check logs: `docker logs n8n` or n8n Web UI
2. Verify credentials: Test each service separately
3. Review configuration: Check JSON syntax
4. Test MCP: Run test queries manually
5. Check permissions: Verify email account permissions

---

## 🎓 Learn More

- [n8n Documentation](https://docs.n8n.io)
- [MCP Protocol](https://modelcontextprotocol.io)
- [Gmail API Docs](https://developers.google.com/gmail/api)
- [IMAP Protocol](https://tools.ietf.org/html/rfc3501)

---

**Ready to go live?** 🚀 Start with the Complete Setup workflow!

Generated: 2025-02-12 | Version: 1.0
