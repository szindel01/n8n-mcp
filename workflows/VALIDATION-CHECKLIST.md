# ✅ Email Management - Validation Checklist

## Pre-Setup Verification

- [ ] n8n is installed and running
- [ ] n8n-mcp MCP server is running (`npm start:http`)
- [ ] MCP server is accessible at configured URL
- [ ] Gmail account with API access configured (for Gmail)
- [ ] Outlook app password generated (for Outlook)
- [ ] Slack workspace and bot token ready (optional)

---

## Step 1: Environment Setup

### 1.1 - MCP Server Check
```bash
# Terminal command:
npm start:http

# Expected output:
✓ MCP server running on http://localhost:3000
✓ Database initialized
✓ All tools loaded
```

- [ ] MCP server started successfully
- [ ] No connection errors in console
- [ ] Server responds to health check

### 1.2 - n8n Setup
```bash
# Verify n8n running:
docker logs n8n  # or check n8n dashboard

# Expected:
✓ n8n running on http://localhost:5678
✓ Database connected
✓ Ready to accept requests
```

- [ ] n8n Dashboard accessible
- [ ] Can create/edit workflows
- [ ] Credentials system working

---

## Step 2: Credential Configuration

### 2.1 - MCP Connection Credential
In n8n Dashboard:
1. Go to Credentials
2. Create new "MCP Connection"
3. Set:
   - Name: `n8n-mcp`
   - URL: `http://localhost:3000`
   - Auth Token: (if required)

- [ ] Credential created
- [ ] Can save without errors
- [ ] Connection test passes (click "Test")

### 2.2 - Email Account Configuration (if using Slack)
1. Create "Slack" credential
2. Paste bot token: `xoxb-...`
3. Test connection

- [ ] Slack credential created
- [ ] Test message sends successfully

---

## Step 3: Workflow Import

### 3.1 - Import Master Setup Workflow
1. Download: `email-complete-setup-orchestration.json`
2. In n8n: Create → Import from File
3. Upload the JSON

- [ ] Workflow imported without errors
- [ ] All nodes visible
- [ ] No red error indicators

### 3.2 - Verify MCP Tool Nodes
Click each MCP Tool node and verify:
- [ ] "🚨 Fetch Urgent Emails" node configured
- [ ] "📧 Add Email Account" node configured
- [ ] "✅ List All Configured Accounts" node configured
- [ ] All use correct credentials: `n8n-mcp`

---

## Step 4: Configuration

### 4.1 - Edit Email Accounts
In workflow, find node: "📋 Define Complete Configuration"
Edit the JSON accounts array:

```json
{
  "accountName": "Your Gmail",
  "email": "you@gmail.com",
  "provider": "gmail",
  "refreshToken": "YOUR_TOKEN_HERE",
  "customUrgentKeywords": ["urgent", "ASAP"]
}
```

Validation:
- [ ] Valid JSON format (no syntax errors)
- [ ] Email field matches account email
- [ ] Provider is "gmail" or "imap"
- [ ] RefreshToken/Password filled in
- [ ] Keywords are non-empty arrays

### 4.2 - Save Configuration
- [ ] Click "Save" on the workflow
- [ ] No save errors

---

## Step 5: Test Account Setup

### 5.1 - Manual Test Run
1. Click "Execute Workflow" (Play button)
2. Wait for completion

Expected flow:
```
✓ Node 1: Define Configuration → Complete
✓ Node 2: Add Email Account → Success
✓ Node 3: List All Accounts → Shows your accounts
✓ Node 4: Display Dashboard → Shows results
```

Validation:
- [ ] Workflow starts without errors
- [ ] All nodes execute (green checkmarks)
- [ ] No timeout errors
- [ ] No MCP connection errors

### 5.2 - Verify Results
In final HTML dashboard check:
- [ ] "✅ Configured Accounts" section visible
- [ ] Your account names listed
- [ ] Provider shows correctly (GMAIL/IMAP)
- [ ] "Setup Complete!" message appears

If failed:
- [ ] Check MCP server logs: `npm start:http` output
- [ ] Verify credentials in workflow
- [ ] Test MCP connection manually

---

## Step 6: Email Retrieval Test

### 6.1 - Test Email Search
1. Import: `email-search-urgent-workflow.json`
2. Click "Execute Workflow"
3. Wait for completion

Expected:
- [ ] "🚨 Fetch Urgent Emails" node executes
- [ ] Returns email data
- [ ] Dashboard shows results

### 6.2 - Verify Email Data
In dashboard check:
- [ ] "Urgent Emails" section present
- [ ] Shows count of urgent emails
- [ ] Subjects visible
- [ ] Sender emails visible
- [ ] Urgency scores shown

If no results:
- [ ] Check if emails actually exist in account
- [ ] Try different search query: `is:unread`
- [ ] Check account access permissions
- [ ] Verify API tokens are valid

---

## Step 7: Custom Search Test

### 7.1 - Test Advanced Search
1. Import: `email-custom-search-workflow.json`
2. Edit "Set Search Parameters" node:
   ```json
   {
     "query": "is:unread",
     "maxResults": 50,
     "minUrgency": 0
   }
   ```
3. Click "Execute Workflow"

- [ ] Workflow executes without errors
- [ ] Results displayed
- [ ] Correct email count

### 7.2 - Test Complex Query
Edit query to: `from:someone@example.com is:unread`
- [ ] Workflow still works
- [ ] Filters applied correctly
- [ ] Results filtered appropriately

---

## Step 8: Slack Integration (Optional)

### 8.1 - Setup Slack Notification
1. Import: `email-monitoring-24-7.json`
2. Find "Send Slack Alert (Critical)" node
3. Verify credentials: `Slack`
4. Verify channel: `#emails-critical`

- [ ] Slack credential selected
- [ ] Channel exists in Slack workspace
- [ ] Bot has permission to post

### 8.2 - Test Slack Alert
1. Execute workflow manually
2. Check Slack channel

- [ ] Message appears in Slack
- [ ] Format is readable
- [ ] Includes email subject
- [ ] Includes urgency score

If message doesn't appear:
- [ ] Check Slack channel name (with #)
- [ ] Verify bot token is valid
- [ ] Check bot permissions in Slack
- [ ] Verify n8n can reach Slack API

---

## Step 9: Automation Setup

### 9.1 - Activate Monitoring Workflow
1. Open: `email-monitoring-24-7.json`
2. Toggle "Active" ON (top right)
3. Verify schedules:
   - ⏰ "Every Hour" trigger visible
   - 📅 "Every Day at 9 AM" trigger visible

- [ ] Workflow activated
- [ ] No error messages
- [ ] Triggers configured correctly

### 9.2 - Verify Schedules
Check n8n admin panel:
- [ ] Workflow listed as "Active"
- [ ] Next execution time shown
- [ ] Can be deactivated if needed

---

## Step 10: Final Validation

### 10.1 - Dashboard Check
Run each workflow and verify dashboards:

**Complete Setup Dashboard:**
- [ ] Shows configured accounts
- [ ] Shows urgent email count
- [ ] Shows important email count
- [ ] HTML renders properly
- [ ] Colors display correctly

**Monitoring Dashboard:**
- [ ] Severity breakdown visible
- [ ] Critical/High/Medium/Low counts shown
- [ ] Hourly report generated
- [ ] Daily summary available

**Search Dashboard:**
- [ ] Results grouped by account
- [ ] Scores displayed correctly
- [ ] Sender information visible
- [ ] Date stamps shown

### 10.2 - Error Checking
- [ ] No red error indicators
- [ ] Console logs are clean
- [ ] MCP server has no errors
- [ ] n8n logs show no issues

---

## Troubleshooting Matrix

| Issue | Symptom | Solution |
|-------|---------|----------|
| **MCP Connection Failed** | Red "connection refused" error | `npm start:http` - start MCP server |
| **Gmail 401 Unauthorized** | "Invalid refresh token" error | Refresh OAuth token via Google Console |
| **IMAP Connection Timeout** | "Connection timed out" on IMAP node | Verify host: outlook.office365.com, port: 993 |
| **No Emails Found** | Empty results | Try `is:unread` query, check account has emails |
| **Slack Message Failed** | "Channel not found" | Verify channel name with # in Slack field |
| **Workflow Won't Save** | "Invalid JSON" error | Check JSON syntax in configuration node |
| **Node Not Executing** | Grey node, no output | Check credentials, verify MCP connection |
| **Dashboard Not Showing** | Blank HTML page | Check HTML node syntax, verify data flow |

---

## Performance Checklist

### For Production Deployment:
- [ ] All workflows tested 3+ times
- [ ] No errors in last 5 test runs
- [ ] Response time < 5 seconds
- [ ] Slack notifications reliable
- [ ] MCP server stable (no restarts needed)
- [ ] Email account sync working
- [ ] Database performance acceptable
- [ ] Logs archived and monitored
- [ ] Backup strategy in place
- [ ] Error notifications configured

### Load Testing:
- [ ] Workflow handles 100+ emails without timeout
- [ ] Multiple simultaneous executions work
- [ ] Database queries optimized
- [ ] Memory usage stable

---

## Security Checklist

- [ ] Gmail refresh token stored securely
- [ ] IMAP passwords encrypted in transit
- [ ] Slack bot token not logged
- [ ] Credentials never exposed in logs
- [ ] n8n credentials encrypted at rest
- [ ] MCP server has no public exposure
- [ ] Firewall configured correctly
- [ ] No hardcoded passwords in workflows

---

## Maintenance Schedule

### Daily:
- [ ] Monitor critical email alerts
- [ ] Check workflow execution logs
- [ ] Verify MCP server is running

### Weekly:
- [ ] Review automation reports
- [ ] Check for failed executions
- [ ] Verify account sync status
- [ ] Monitor storage usage

### Monthly:
- [ ] Refresh OAuth tokens
- [ ] Review and adjust keywords
- [ ] Backup workflow configurations
- [ ] Update n8n if needed
- [ ] Security audit

### Quarterly:
- [ ] Full disaster recovery test
- [ ] Performance optimization review
- [ ] Email archival/cleanup
- [ ] Team training on new features

---

## Sign-Off

| Item | Status | Date | Signature |
|------|--------|------|-----------|
| Setup complete | ☐ Pass / ☐ Fail | _____ | __________ |
| Testing complete | ☐ Pass / ☐ Fail | _____ | __________ |
| Production ready | ☐ Yes / ☐ No | _____ | __________ |
| Team trained | ☐ Yes / ☐ No | _____ | __________ |

---

## Emergency Contacts

- **MCP Server Issues**: Check logs, restart with `npm start:http`
- **n8n Issues**: Check n8n logs, restart container
- **Email Sync Issues**: Verify credentials, check account access
- **Slack Issues**: Verify bot token, check permissions
- **General Help**: See QUICK-START.md or README.md

---

**Version:** 1.0
**Last Updated:** 2025-02-12
**Status:** Ready for Production ✅

---

Generated with ❤️ for the email management team
