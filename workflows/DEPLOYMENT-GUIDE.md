# 🚀 Email Management - Deployment Guide

Complete guide to deploy the email management system in production.

## 📦 What You Get

- **Multi-Account Email Management**: Gmail + IMAP (Outlook, Yahoo, etc.)
- **Intelligent Filtering**: Urgency & importance scoring
- **24/7 Monitoring**: Automated checks with real-time alerts
- **Slack Integration**: Critical email notifications
- **HTML Dashboards**: Beautiful reporting interface
- **Custom Keywords**: Tailored to your organization
- **Production-Ready**: Tested and reliable

---

## 🎯 Deployment Paths

### Path 1: Quick Start (15 minutes)
Best for: Testing, PoC, Small teams

```
1. Start MCP Server (2 min)
2. Import Orchestration Workflow (2 min)
3. Configure Accounts (5 min)
4. Run Setup & Test (3 min)
5. View Dashboard (3 min)
```

→ See: QUICK-START.md

### Path 2: Full Production (1-2 hours)
Best for: Enterprise, Multi-team deployment

```
1. Environment Setup (15 min)
2. Credential Configuration (20 min)
3. Import All Workflows (15 min)
4. Configure Automation (15 min)
5. Integration Setup (20 min)
6. Testing & Validation (20 min)
7. Monitoring & Alerts (15 min)
```

→ See: This document

### Path 3: Custom Deployment (2-4 hours)
Best for: Complex requirements, Custom integrations

```
1. Full Production Setup
2. Custom Workflow Development
3. API Integrations (Jira, ServiceNow, etc.)
4. Advanced Analytics
5. Performance Tuning
6. Security Hardening
```

→ Consult your team architect

---

## Production Deployment Steps

### Phase 1: Infrastructure (30 minutes)

#### 1.1 - System Requirements
```
✓ Docker/Container: n8n + MCP Server
✓ Disk Space: 10GB minimum (with backups)
✓ Memory: 4GB minimum (8GB recommended)
✓ Network: Stable internet, no blocking of port 993
✓ Firewall: Allow outbound HTTPS, IMAP (993), SMTP (587)
```

#### 1.2 - MCP Server Deployment
```bash
# Production setup:
npm install
npm run build
npm start:http

# Or with Docker:
docker run -p 3000:3000 n8n-mcp:latest
```

Environment variables:
```bash
N8N_MCP_PORT=3000
N8N_MCP_LOG_LEVEL=info
N8N_MCP_MAX_SESSIONS=100
DATABASE_URL=sqlite:///data/mcp.db
```

- [ ] MCP server starts without errors
- [ ] Logs show "Server running on http://0.0.0.0:3000"
- [ ] Database initialized
- [ ] Health endpoint responds: curl http://localhost:3000/health

#### 1.3 - n8n Deployment
```bash
# Docker (recommended):
docker run -d \
  -p 5678:5678 \
  -v n8n_data:/home/node/.n8n \
  -e DB_TYPE=sqlite \
  -e DB_SQLITE_PATH=/home/node/.n8n/database.sqlite \
  n8nio/n8n

# Or local:
npm install -g n8n
n8n start
```

- [ ] n8n accessible at http://localhost:5678
- [ ] Database initialized
- [ ] Admin user created
- [ ] Can create workflows

---

### Phase 2: Credentials Setup (30 minutes)

#### 2.1 - Gmail Configuration (if using Gmail)
```bash
# Get Gmail Refresh Token:
1. Go: https://console.cloud.google.com
2. Create project: "Email Management"
3. Enable: Gmail API
4. Create OAuth 2.0 credentials (Desktop)
5. Download credentials.json
6. Run OAuth flow to get refresh token
```

In n8n Credentials:
```
Name: gmail-account
Type: Google credentials
Refresh Token: 1//0gF8...
```

- [ ] Credentials created
- [ ] Test connection passes
- [ ] Can read emails

#### 2.2 - Outlook Configuration (if using IMAP)
```bash
# App Password:
1. Go: https://account.microsoft.com/security
2. Advanced security settings
3. Create "App password"
4. Copy password (only shown once!)
```

In n8n Credentials:
```
Name: outlook-account
Type: MCP Connection
Host: outlook.office365.com
Port: 993
Username: name@company.com
Password: (app password)
```

- [ ] Credentials created
- [ ] Test connection passes
- [ ] Can connect to mailbox

#### 2.3 - Slack Configuration (Optional)
```bash
# Get Slack Bot Token:
1. Go: https://api.slack.com/apps
2. Create app: "Email Bot"
3. Grant permissions: chat:write
4. Install to workspace
5. Copy Bot Token (xoxb-...)
```

In n8n Credentials:
```
Name: slack-bot
Type: Slack
Token: xoxb-...
```

- [ ] Credentials created
- [ ] Can post test messages
- [ ] Bot active in Slack

---

### Phase 3: Workflow Deployment (45 minutes)

#### 3.1 - Import Master Workflows
```bash
# Option A: Via n8n UI
1. Dashboard → Create → Import from File
2. Select: email-complete-setup-orchestration.json
3. Click Import
4. Save workflow

# Option B: Via API
curl -X POST http://localhost:5678/api/v1/workflows \
  -H "Content-Type: application/json" \
  -d @email-complete-setup-orchestration.json
```

Import order:
1. ✅ email-complete-setup-orchestration.json (Master)
2. ✅ email-monitoring-24-7.json (Monitoring)
3. ✅ email-account-management-workflow.json (Admin)

- [ ] All workflows imported
- [ ] No error indicators
- [ ] Can open each workflow

#### 3.2 - Configure Accounts
For each workflow, edit "Define Configuration" node:

```json
{
  "accounts": [
    {
      "accountName": "Corporate Gmail",
      "email": "corp@company.com",
      "provider": "gmail",
      "refreshToken": "1//0gF8...",
      "customUrgentKeywords": ["urgent", "critical", "ASAP"],
      "customImportantKeywords": ["meeting", "budget", "contract"]
    },
    {
      "accountName": "Sales Outlook",
      "email": "sales@company.com",
      "provider": "imap",
      "host": "outlook.office365.com",
      "port": 993,
      "username": "sales@company.com",
      "password": "app_password_here"
    }
  ]
}
```

- [ ] Valid JSON format
- [ ] All accounts configured
- [ ] Keywords customized for company
- [ ] Credentials filled in

#### 3.3 - Save & Validate
- [ ] Click "Save" on each workflow
- [ ] No save errors
- [ ] Workflows appear in list

---

### Phase 4: Testing & Validation (45 minutes)

#### 4.1 - Unit Testing
Test each workflow individually:

```bash
# Test 1: Complete Setup
1. Open: email-complete-setup-orchestration.json
2. Click: Execute Workflow
3. Verify: All nodes complete (green)
4. Check: Dashboard displays correctly
5. Confirm: Accounts are registered
```

- [ ] Workflow completes without errors
- [ ] Dashboard visible
- [ ] Account list accurate

```bash
# Test 2: Email Retrieval
1. Open: email-search-urgent-workflow.json
2. Click: Execute Workflow
3. Verify: Email data fetched
4. Check: Urgency scores computed
5. Confirm: Results displayed
```

- [ ] Emails retrieved successfully
- [ ] Scoring algorithm working
- [ ] Results formatted correctly

```bash
# Test 3: Custom Search
1. Open: email-custom-search-workflow.json
2. Edit: Search query (e.g., "is:unread")
3. Click: Execute Workflow
4. Verify: Results filtered correctly
```

- [ ] Search works correctly
- [ ] Results grouped by account
- [ ] Pagination works

#### 4.2 - Integration Testing
Test workflow interactions:

```bash
# Test Data Flow
1. Run Setup → Verify accounts created
2. Run Monitoring → Verify fetches emails
3. Run Search → Verify results match
```

- [ ] Data flows between workflows
- [ ] No duplicate processing
- [ ] Consistent results

#### 4.3 - Load Testing
```bash
# Simulate Load:
1. Configure with 5+ email accounts
2. Set search to return 200+ emails
3. Run all workflows in parallel
4. Monitor: Memory, CPU, Response time
```

- [ ] No timeouts (< 30 seconds)
- [ ] Memory stable (< 2GB)
- [ ] All emails processed

#### 4.4 - Error Simulation
```bash
# Test Error Handling:
1. Disconnect MCP server
2. Run workflow → Should fail gracefully
3. Check error message is helpful
4. Reconnect MCP server
5. Workflow should work again
```

- [ ] Errors handled gracefully
- [ ] No cryptic messages
- [ ] Recovery is possible

---

### Phase 5: Automation & Monitoring (30 minutes)

#### 5.1 - Activate Monitoring Workflow
```bash
1. Open: email-monitoring-24-7.json
2. Toggle: "Active" (top right)
3. Verify: Green checkmark shows
4. Check: Next execution time displayed
```

- [ ] Workflow activated
- [ ] Triggers configured
- [ ] Status shows "Active"

#### 5.2 - Configure Schedules
Check automated execution times:

```
⏰ Hourly Check: :00 (every hour)
📅 Daily Report: 09:00 AM
🚨 Critical Alert: Real-time
```

- [ ] All schedules set correctly
- [ ] Times match business needs
- [ ] Timezone set to your region

#### 5.3 - Setup Notifications
```bash
# Slack Notifications:
1. Create Slack channels:
   - #emails (all)
   - #emails-critical (urgent only)
   - #emails-digest (daily)

2. Verify bot can post to each channel

3. Configure notification levels:
   - Critical: Immediate via Slack
   - Urgent: Hourly digest
   - Important: Daily digest
```

- [ ] Channels created
- [ ] Bot has permissions
- [ ] Notifications tested

#### 5.4 - Setup Alerts
```bash
# Email Alerts:
Configure to send email when:
- [ ] Critical email found
- [ ] Workflow fails
- [ ] MCP server down
```

---

### Phase 6: Optimization & Tuning (30 minutes)

#### 6.1 - Performance Optimization
```bash
# Check Performance:
1. Monitor MCP server CPU/Memory
2. Review database queries
3. Optimize search queries
4. Cache frequent results
5. Archive old data
```

Optimization checklist:
- [ ] Average query time < 2 seconds
- [ ] Memory usage stable
- [ ] No database bottlenecks
- [ ] Search indexes created

#### 6.2 - Keyword Customization
Fine-tune based on results:

```json
// Review after 1 week:
- Are we catching all urgent emails?
- Any false positives?
- Missing any important emails?

// Adjust keywords:
"customUrgentKeywords": [
  "urgent",     // Keep
  "critical",   // Keep
  "asap",       // Add? (was it requested?)
  "deadline"    // Add? (is it common?)
]
```

- [ ] Reviewed first week's emails
- [ ] Keywords adjusted
- [ ] Scores improved

#### 6.3 - Database Maintenance
```bash
# Weekly maintenance:
1. Archive emails older than 90 days
2. Vacuum database: VACUUM;
3. Rebuild search indexes
4. Backup database
```

- [ ] Backup strategy in place
- [ ] Archive working
- [ ] Database size manageable

---

### Phase 7: Security Hardening (20 minutes)

#### 7.1 - Credential Security
```bash
✓ All passwords encrypted at rest
✓ API tokens stored securely
✓ No secrets in logs
✓ Credentials rotated monthly
✓ Access limited to authorized users
```

- [ ] Encryption enabled
- [ ] No plaintext credentials in logs
- [ ] Rotation schedule set

#### 7.2 - Network Security
```bash
✓ MCP server not publicly exposed
✓ n8n dashboard behind authentication
✓ HTTPS for all external connections
✓ Firewall rules configured
✓ Rate limiting enabled
```

- [ ] MCP server behind firewall
- [ ] Authentication required
- [ ] HTTPS enabled
- [ ] DDoS protection active

#### 7.3 - Access Control
```bash
✓ Users have minimum required permissions
✓ Admin access restricted
✓ Workflow edits audited
✓ Execution logs retained
```

- [ ] User roles configured
- [ ] Audit logging enabled
- [ ] Only admins can modify workflows

---

## 📊 Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| Setup Time | < 5 min | ____ |
| Account Configuration | < 10 min | ____ |
| First Email Fetch | < 10 sec | ____ |
| Search Query Time | < 5 sec | ____ |
| Dashboard Load Time | < 3 sec | ____ |
| Slack Notification Latency | < 1 min | ____ |
| System Uptime | 99.9% | ____ |
| Error Rate | < 0.1% | ____ |

---

## 🔄 Maintenance Schedule

### Daily
```
□ 08:00 - Check overnight alerts
□ 17:00 - Monitor daily execution
□ 22:00 - Verify backup completed
```

### Weekly
```
□ Monday - Review urgent/important trends
□ Wednesday - Optimize keywords if needed
□ Friday - Full system health check
```

### Monthly
```
□ 1st - Archive old emails
□ 15th - Refresh OAuth tokens
□ 25th - Full backup & disaster recovery test
```

### Quarterly
```
□ Update n8n to latest version
□ Security audit
□ Performance review
□ Team training on new features
```

---

## 🚨 Incident Response

### Issue: Workflow Not Executing

```
1. Check MCP server is running:
   ps aux | grep "npm start:http"

2. Check n8n is running:
   docker ps | grep n8n

3. Check MCP logs:
   tail -f mcp-server.log

4. Check n8n logs:
   docker logs n8n | tail -50

5. Restart if needed:
   npm start:http
   docker restart n8n
```

### Issue: Emails Not Found

```
1. Verify credentials:
   - Gmail token valid?
   - IMAP password correct?
   - Account permissions OK?

2. Check account access:
   - Can manually login to email?
   - Account not locked/disabled?

3. Verify search query:
   - Try simple: "is:unread"
   - Check mailbox has emails
   - Try broader date range
```

### Issue: Slack Not Sending

```
1. Check bot token:
   - Token valid? (xoxb-...)
   - Not expired?

2. Check channel:
   - Channel exists?
   - Bot member of channel?
   - Permissions granted?

3. Check n8n Slack credential:
   - Token correct?
   - Connection test passes?
```

---

## ✅ Go-Live Checklist

- [ ] All systems tested and validated
- [ ] Backups in place and tested
- [ ] Monitoring and alerts active
- [ ] Team trained on procedures
- [ ] Documentation complete
- [ ] Disaster recovery plan ready
- [ ] Stakeholders notified
- [ ] Launch date confirmed
- [ ] Rollback plan documented
- [ ] Go/No-Go decision made

---

## 📈 Success Metrics

Track these after 1 month of production:

- [ ] 95% of urgent emails caught within 5 min
- [ ] < 5% false positive rate
- [ ] 99% workflow success rate
- [ ] < 30 sec avg response time
- [ ] Team satisfaction > 4/5
- [ ] No critical incidents
- [ ] Reduced email response time by 30%
- [ ] Improved priority management

---

## 🎓 Team Training

### For Administrators
- [ ] System architecture
- [ ] Credential management
- [ ] Workflow configuration
- [ ] Troubleshooting guide
- [ ] Backup/recovery procedures

### For End Users
- [ ] How to view dashboards
- [ ] Interpreting scores
- [ ] Slack notifications
- [ ] FAQ and common issues
- [ ] Who to contact for help

---

## 📞 Support Contacts

| Role | Name | Contact |
|------|------|---------|
| System Admin | __________ | __________ |
| MCP Support | __________ | __________ |
| n8n Support | __________ | __________ |
| Email Support | __________ | __________ |
| Escalation | __________ | __________ |

---

## Final Approval

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Project Manager | __________ | __/__ | __________ |
| System Admin | __________ | __/__ | __________ |
| Security | __________ | __/__ | __________ |
| Executive | __________ | __/__ | __________ |

**Status**: 🟢 Ready for Production Deployment

---

Generated: 2025-02-12 | Version: 1.0
