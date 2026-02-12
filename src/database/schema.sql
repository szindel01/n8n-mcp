-- Ultra-simple schema for MVP
CREATE TABLE IF NOT EXISTS nodes (
  node_type TEXT PRIMARY KEY,
  package_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  development_style TEXT CHECK(development_style IN ('declarative', 'programmatic')),
  is_ai_tool INTEGER DEFAULT 0,
  is_trigger INTEGER DEFAULT 0,
  is_webhook INTEGER DEFAULT 0,
  is_versioned INTEGER DEFAULT 0,
  version TEXT,
  documentation TEXT,
  properties_schema TEXT,
  operations TEXT,
  credentials_required TEXT,
  outputs TEXT, -- JSON array of output definitions
  output_names TEXT, -- JSON array of output names
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Minimal indexes for performance
CREATE INDEX IF NOT EXISTS idx_package ON nodes(package_name);
CREATE INDEX IF NOT EXISTS idx_ai_tool ON nodes(is_ai_tool);
CREATE INDEX IF NOT EXISTS idx_category ON nodes(category);

-- FTS5 full-text search index for nodes
CREATE VIRTUAL TABLE IF NOT EXISTS nodes_fts USING fts5(
  node_type,
  display_name,
  description,
  documentation,
  operations,
  content=nodes,
  content_rowid=rowid
);

-- Triggers to keep FTS5 in sync with nodes table
CREATE TRIGGER IF NOT EXISTS nodes_fts_insert AFTER INSERT ON nodes
BEGIN
  INSERT INTO nodes_fts(rowid, node_type, display_name, description, documentation, operations)
  VALUES (new.rowid, new.node_type, new.display_name, new.description, new.documentation, new.operations);
END;

CREATE TRIGGER IF NOT EXISTS nodes_fts_update AFTER UPDATE ON nodes
BEGIN
  UPDATE nodes_fts
  SET node_type = new.node_type,
      display_name = new.display_name,
      description = new.description,
      documentation = new.documentation,
      operations = new.operations
  WHERE rowid = new.rowid;
END;

CREATE TRIGGER IF NOT EXISTS nodes_fts_delete AFTER DELETE ON nodes
BEGIN
  DELETE FROM nodes_fts WHERE rowid = old.rowid;
END;

-- Templates table for n8n workflow templates
CREATE TABLE IF NOT EXISTS templates (
  id INTEGER PRIMARY KEY,
  workflow_id INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  author_name TEXT,
  author_username TEXT,
  author_verified INTEGER DEFAULT 0,
  nodes_used TEXT, -- JSON array of node types
  workflow_json TEXT, -- Complete workflow JSON (deprecated, use workflow_json_compressed)
  workflow_json_compressed TEXT, -- Compressed workflow JSON (base64 encoded gzip)
  categories TEXT, -- JSON array of categories
  views INTEGER DEFAULT 0,
  created_at DATETIME,
  updated_at DATETIME,
  url TEXT,
  scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  metadata_json TEXT, -- Structured metadata from OpenAI (JSON)
  metadata_generated_at DATETIME -- When metadata was generated
);

-- Templates indexes
CREATE INDEX IF NOT EXISTS idx_template_nodes ON templates(nodes_used);
CREATE INDEX IF NOT EXISTS idx_template_updated ON templates(updated_at);
CREATE INDEX IF NOT EXISTS idx_template_name ON templates(name);
CREATE INDEX IF NOT EXISTS idx_template_metadata ON templates(metadata_generated_at);

-- Pre-extracted node configurations from templates
-- This table stores the top node configurations from popular templates
-- Provides fast access to real-world configuration examples
CREATE TABLE IF NOT EXISTS template_node_configs (
  id INTEGER PRIMARY KEY,
  node_type TEXT NOT NULL,
  template_id INTEGER NOT NULL,
  template_name TEXT NOT NULL,
  template_views INTEGER DEFAULT 0,

  -- Node configuration (extracted from workflow)
  node_name TEXT,                  -- Node name in workflow (e.g., "HTTP Request")
  parameters_json TEXT NOT NULL,   -- JSON: node.parameters
  credentials_json TEXT,            -- JSON: node.credentials (if present)

  -- Pre-calculated metadata for filtering
  has_credentials INTEGER DEFAULT 0,
  has_expressions INTEGER DEFAULT 0,  -- Contains {{...}} or $json/$node
  complexity TEXT CHECK(complexity IN ('simple', 'medium', 'complex')),
  use_cases TEXT,                   -- JSON array from template.metadata.use_cases

  -- Pre-calculated ranking (1 = best, 2 = second best, etc.)
  rank INTEGER DEFAULT 0,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_config_node_type_rank
  ON template_node_configs(node_type, rank);

CREATE INDEX IF NOT EXISTS idx_config_complexity
  ON template_node_configs(node_type, complexity, rank);

CREATE INDEX IF NOT EXISTS idx_config_auth
  ON template_node_configs(node_type, has_credentials, rank);

-- View for easy querying of top configs
CREATE VIEW IF NOT EXISTS ranked_node_configs AS
SELECT
  node_type,
  template_name,
  template_views,
  parameters_json,
  credentials_json,
  has_credentials,
  has_expressions,
  complexity,
  use_cases,
  rank
FROM template_node_configs
WHERE rank <= 5  -- Top 5 per node type
ORDER BY node_type, rank;

-- Note: Template FTS5 tables are created conditionally at runtime if FTS5 is supported
-- See template-repository.ts initializeFTS5() method
-- Node FTS5 table (nodes_fts) is created above during schema initialization

-- Email accounts table for multi-mailbox management
-- Stores credentials for Gmail and IMAP accounts
CREATE TABLE IF NOT EXISTS email_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_name TEXT NOT NULL UNIQUE,           -- User-friendly name (e.g., "Personal Gmail", "Work IMAP")
  email TEXT NOT NULL,                          -- Email address
  provider TEXT NOT NULL CHECK(provider IN ('gmail', 'imap')), -- Email provider type

  -- Provider-specific credentials (encrypted in production)
  provider_config TEXT NOT NULL,                -- JSON: {refreshToken, accessToken} for Gmail or {host, port, username, password} for IMAP

  -- Account metadata
  is_active INTEGER DEFAULT 1,                  -- 1 = active, 0 = disabled
  last_sync_at DATETIME,                        -- Last time emails were synced
  sync_error TEXT,                              -- Error message from last sync (if any)

  -- Filtering & Organization
  default_mailbox TEXT,                         -- Default mailbox for searches (e.g., "INBOX")
  include_sent INTEGER DEFAULT 0,               -- 1 = include sent items
  include_archived INTEGER DEFAULT 0,           -- 1 = include archived items

  -- Importance detection settings
  auto_detect_priority INTEGER DEFAULT 1,       -- 1 = auto-detect urgent/important
  custom_urgent_keywords TEXT,                  -- JSON array of custom urgent keywords
  custom_important_keywords TEXT,               -- JSON array of custom important keywords

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for email accounts
CREATE INDEX IF NOT EXISTS idx_email_accounts_provider ON email_accounts(provider);
CREATE INDEX IF NOT EXISTS idx_email_accounts_active ON email_accounts(is_active);
CREATE INDEX IF NOT EXISTS idx_email_accounts_email ON email_accounts(email);

-- Email search cache table for performance optimization
-- Stores search results to reduce API calls to email providers
CREATE TABLE IF NOT EXISTS email_search_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id INTEGER NOT NULL,                  -- Foreign key to email_accounts
  search_query TEXT NOT NULL,                   -- Search criteria (JSON)

  -- Email metadata
  message_id TEXT NOT NULL,                     -- Provider-specific message ID
  subject TEXT,                                 -- Email subject
  sender TEXT,                                  -- From address
  recipients TEXT,                              -- JSON array of recipients

  -- Content & Classification
  snippet TEXT,                                 -- First 200 chars of email body
  labels TEXT,                                  -- JSON array of labels/tags from provider

  -- Importance classification
  is_urgent INTEGER DEFAULT 0,                  -- 1 = marked as urgent/high priority
  is_important INTEGER DEFAULT 0,               -- 1 = marked as important
  urgency_score REAL DEFAULT 0.0,               -- Score from 0.0 to 1.0
  importance_score REAL DEFAULT 0.0,            -- Score from 0.0 to 1.0
  importance_reason TEXT,                       -- Reason for importance classification (JSON)

  -- Date tracking
  received_at DATETIME,                         -- Email received date
  cached_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- When we cached this result

  -- Cache validity
  is_read INTEGER DEFAULT 0,                    -- Email read status (from provider)
  has_attachments INTEGER DEFAULT 0,            -- Has attachments flag

  FOREIGN KEY (account_id) REFERENCES email_accounts(id) ON DELETE CASCADE,
  UNIQUE(account_id, message_id)
);

-- Indexes for email search results
CREATE INDEX IF NOT EXISTS idx_search_results_account ON email_search_results(account_id);
CREATE INDEX IF NOT EXISTS idx_search_results_urgent ON email_search_results(is_urgent);
CREATE INDEX IF NOT EXISTS idx_search_results_important ON email_search_results(is_important);
CREATE INDEX IF NOT EXISTS idx_search_results_urgency_score ON email_search_results(urgency_score DESC);
CREATE INDEX IF NOT EXISTS idx_search_results_importance_score ON email_search_results(importance_score DESC);
CREATE INDEX IF NOT EXISTS idx_search_results_received_at ON email_search_results(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_results_cached_at ON email_search_results(cached_at);

-- Node versions table for tracking all available versions of each node
-- Enables version upgrade detection and migration
CREATE TABLE IF NOT EXISTS node_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  node_type TEXT NOT NULL,                -- e.g., "n8n-nodes-base.executeWorkflow"
  version TEXT NOT NULL,                  -- e.g., "1.0", "1.1", "2.0"
  package_name TEXT NOT NULL,             -- e.g., "n8n-nodes-base"
  display_name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  is_current_max INTEGER DEFAULT 0,      -- 1 if this is the latest version
  properties_schema TEXT,                 -- JSON schema for this specific version
  operations TEXT,                        -- JSON array of operations for this version
  credentials_required TEXT,              -- JSON array of required credentials
  outputs TEXT,                           -- JSON array of output definitions
  minimum_n8n_version TEXT,               -- Minimum n8n version required (e.g., "1.0.0")
  breaking_changes TEXT,                  -- JSON array of breaking changes from previous version
  deprecated_properties TEXT,             -- JSON array of removed/deprecated properties
  added_properties TEXT,                  -- JSON array of newly added properties
  released_at DATETIME,                   -- When this version was released
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(node_type, version),
  FOREIGN KEY (node_type) REFERENCES nodes(node_type) ON DELETE CASCADE
);

-- Indexes for version queries
CREATE INDEX IF NOT EXISTS idx_version_node_type ON node_versions(node_type);
CREATE INDEX IF NOT EXISTS idx_version_current_max ON node_versions(is_current_max);
CREATE INDEX IF NOT EXISTS idx_version_composite ON node_versions(node_type, version);

-- Version property changes for detailed migration tracking
-- Records specific property-level changes between versions
CREATE TABLE IF NOT EXISTS version_property_changes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  node_type TEXT NOT NULL,
  from_version TEXT NOT NULL,             -- Version where change occurred (e.g., "1.0")
  to_version TEXT NOT NULL,               -- Target version (e.g., "1.1")
  property_name TEXT NOT NULL,            -- Property path (e.g., "parameters.inputFieldMapping")
  change_type TEXT NOT NULL CHECK(change_type IN (
    'added',                              -- Property added (may be required)
    'removed',                            -- Property removed/deprecated
    'renamed',                            -- Property renamed
    'type_changed',                       -- Property type changed
    'requirement_changed',                -- Required → Optional or vice versa
    'default_changed'                     -- Default value changed
  )),
  is_breaking INTEGER DEFAULT 0,          -- 1 if this is a breaking change
  old_value TEXT,                         -- For renamed/type_changed: old property name or type
  new_value TEXT,                         -- For renamed/type_changed: new property name or type
  migration_hint TEXT,                    -- Human-readable migration guidance
  auto_migratable INTEGER DEFAULT 0,      -- 1 if can be automatically migrated
  migration_strategy TEXT,                -- JSON: strategy for auto-migration
  severity TEXT CHECK(severity IN ('LOW', 'MEDIUM', 'HIGH')), -- Impact severity
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (node_type, from_version) REFERENCES node_versions(node_type, version) ON DELETE CASCADE
);

-- Indexes for property change queries
CREATE INDEX IF NOT EXISTS idx_prop_changes_node ON version_property_changes(node_type);
CREATE INDEX IF NOT EXISTS idx_prop_changes_versions ON version_property_changes(node_type, from_version, to_version);
CREATE INDEX IF NOT EXISTS idx_prop_changes_breaking ON version_property_changes(is_breaking);
CREATE INDEX IF NOT EXISTS idx_prop_changes_auto ON version_property_changes(auto_migratable);

-- Workflow versions table for rollback and version history tracking
-- Stores full workflow snapshots before modifications for guaranteed reversibility
-- Auto-prunes to 10 versions per workflow to prevent memory leaks
CREATE TABLE IF NOT EXISTS workflow_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workflow_id TEXT NOT NULL,              -- n8n workflow ID
  version_number INTEGER NOT NULL,        -- Incremental version number (1, 2, 3...)
  workflow_name TEXT NOT NULL,            -- Workflow name at time of backup
  workflow_snapshot TEXT NOT NULL,        -- Full workflow JSON before modification
  trigger TEXT NOT NULL CHECK(trigger IN (
    'partial_update',                     -- Created by n8n_update_partial_workflow
    'full_update',                        -- Created by n8n_update_full_workflow
    'autofix'                             -- Created by n8n_autofix_workflow
  )),
  operations TEXT,                        -- JSON array of diff operations (if partial update)
  fix_types TEXT,                         -- JSON array of fix types (if autofix)
  metadata TEXT,                          -- Additional context (JSON)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(workflow_id, version_number)
);

-- Indexes for workflow version queries
CREATE INDEX IF NOT EXISTS idx_workflow_versions_workflow_id ON workflow_versions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_versions_created_at ON workflow_versions(created_at);
CREATE INDEX IF NOT EXISTS idx_workflow_versions_trigger ON workflow_versions(trigger);