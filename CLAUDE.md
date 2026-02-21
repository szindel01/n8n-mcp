# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

n8n-mcp is a comprehensive documentation and knowledge server that provides AI assistants with complete access to n8n node information through the Model Context Protocol (MCP). It serves as a bridge between n8n's workflow automation platform and AI models, enabling them to understand and work with n8n nodes effectively.

**Current version: 2.29.0**

### Current Architecture:
```
src/
├── config/
│   └── n8n-api.ts             # Zod-validated n8n API configuration loader
├── constants/
│   └── type-structures.ts     # 22 complete type structures (filter, resourceMapper, etc.)
├── data/
│   └── canonical-ai-tool-examples.json  # Canonical examples for AI tool nodes
├── database/
│   ├── schema.sql             # SQLite schema
│   ├── node-repository.ts     # Data access layer
│   └── database-adapter.ts    # Universal database adapter (better-sqlite3 / sql.js)
├── errors/
│   └── validation-service-error.ts  # Custom error class for validation failures
├── loaders/
│   └── node-loader.ts         # NPM package loader for n8n packages
├── mappers/
│   └── docs-mapper.ts         # Documentation mapping with fixes
├── mcp/
│   ├── server.ts              # MCP server (stdio + HTTP modes, full tool registry)
│   ├── tools.ts               # Core tool definitions (discovery, config, validation)
│   ├── tools-n8n-manager.ts   # n8n management tool definitions (CRUD workflows)
│   ├── tools-n8n-friendly.ts  # Adapts tool definitions for n8n native node
│   ├── email-tools.ts         # Email management tool definitions
│   ├── email-tools-handlers.ts # Email tool handler implementations
│   ├── handlers-n8n-manager.ts # n8n management tool handlers
│   ├── handlers-workflow-diff.ts # Diff-based workflow update handler
│   ├── tools-documentation.ts # Tool documentation system
│   ├── stdio-wrapper.ts       # stdio mode wrapper
│   ├── workflow-examples.ts   # Workflow example strings for tool docs
│   ├── index.ts               # Main entry point with mode selection
│   └── tool-docs/             # Organized per-tool documentation
│       ├── configuration/     # get-node docs
│       ├── discovery/         # search-nodes docs
│       ├── guides/            # ai-agents-guide
│       ├── system/            # diagnostic, health-check, tools-documentation docs
│       ├── templates/         # get-template, search-templates docs
│       ├── validation/        # validate-node, validate-workflow docs
│       └── workflow_management/ # All n8n_* workflow management tool docs
├── n8n/
│   ├── MCPNode.node.ts        # Native n8n node for using MCP tools inside n8n
│   └── MCPApi.credentials.ts  # Credentials type for the native n8n node
├── parsers/
│   ├── node-parser.ts         # Enhanced parser with version support
│   └── property-extractor.ts  # Dedicated property/operation extraction
├── scripts/
│   ├── rebuild.ts             # Database rebuild with validation
│   ├── rebuild-optimized.ts   # Optimized database rebuild
│   ├── validate.ts            # Node validation
│   ├── fetch-templates.ts     # Fetch workflow templates from n8n.io
│   ├── fetch-templates-robust.ts  # Robust template fetcher with retries
│   ├── sanitize-templates.ts  # Sanitize template data
│   ├── seed-canonical-ai-examples.ts  # Seed canonical AI tool examples
│   ├── test-*.ts              # Various integration test scripts
│   └── validation-summary.ts  # Validation summary reporting
├── services/
│   ├── ai-node-validator.ts   # AI Agent/Chat Trigger/LLM Chain validation
│   ├── ai-tool-validators.ts  # AI tool sub-node validation
│   ├── breaking-change-detector.ts  # Detects breaking changes in node versions
│   ├── breaking-changes-registry.ts # Registry of known breaking changes
│   ├── confidence-scorer.ts   # Scores fix confidence (high/medium/low)
│   ├── config-validator.ts    # Multi-profile configuration validation
│   ├── email-account-service.ts     # Email account management (Gmail + IMAP)
│   ├── email-client-factory.ts      # Email client factory
│   ├── email-search-service.ts      # Multi-mailbox email search
│   ├── enhanced-config-validator.ts # Operation-aware validation
│   ├── example-generator.ts   # Generates working node configuration examples
│   ├── execution-processor.ts # Processes n8n execution results
│   ├── expression-format-validator.ts # Expression format validation
│   ├── expression-validator.ts # n8n expression syntax validation
│   ├── gmail-client.ts        # Gmail API client
│   ├── imap-client.ts         # IMAP client
│   ├── n8n-api-client.ts      # n8n REST API client
│   ├── n8n-validation.ts      # n8n-specific workflow validation
│   ├── n8n-version.ts         # n8n version handling utilities
│   ├── node-documentation-service.ts # Node documentation fetching/caching
│   ├── node-migration-service.ts    # Node migration between versions
│   ├── node-sanitizer.ts      # Node data sanitization
│   ├── node-similarity-service.ts   # Fuzzy node type matching
│   ├── node-specific-validators.ts  # Node-specific validation rules
│   ├── node-version-service.ts      # Node version management
│   ├── operation-similarity-service.ts # Operation fuzzy matching
│   ├── post-update-validator.ts     # Validates after auto-fix operations
│   ├── property-dependencies.ts     # Property dependency analysis
│   ├── property-filter.ts     # Filters properties to AI-friendly essentials
│   ├── resource-similarity-service.ts # Resource fuzzy matching
│   ├── sqlite-storage-service.ts    # SQLite-based persistent storage
│   ├── task-templates.ts      # Pre-configured node settings templates
│   ├── type-structure-service.ts    # Complex type structure validation
│   ├── universal-expression-validator.ts # Combined expression validation
│   ├── workflow-auto-fixer.ts # Auto-generates diff operations to fix workflows
│   ├── workflow-diff-engine.ts # Applies diff operations to workflows
│   ├── workflow-validator.ts  # Complete workflow structure validation
│   └── workflow-versioning-service.ts # Workflow version history management
├── telemetry/
│   ├── index.ts               # Telemetry module exports
│   ├── telemetry-manager.ts   # Central telemetry coordinator
│   ├── telemetry-types.ts     # Telemetry event type definitions
│   ├── config-manager.ts      # Telemetry configuration (opt-in/opt-out)
│   ├── batch-processor.ts     # Batches events before sending
│   ├── early-error-logger.ts  # Captures errors before telemetry is initialized
│   ├── error-sanitization-utils.ts  # Strips PII from error reports
│   ├── error-sanitizer.ts     # Error sanitization
│   ├── event-tracker.ts       # Tracks individual events
│   ├── event-validator.ts     # Validates event shapes before sending
│   ├── intent-classifier.ts   # Classifies tool usage intent
│   ├── intent-sanitizer.ts    # Strips sensitive intent data
│   ├── mutation-tracker.ts    # Tracks workflow mutation operations
│   ├── mutation-types.ts      # Mutation type definitions
│   ├── mutation-validator.ts  # Validates mutation events
│   ├── performance-monitor.ts # Tracks tool execution performance
│   ├── rate-limiter.ts        # Rate-limits telemetry events
│   ├── startup-checkpoints.ts # Tracks startup phase completion
│   └── workflow-sanitizer.ts  # Strips sensitive data from workflow payloads
├── templates/
│   ├── template-fetcher.ts    # Fetches templates from n8n.io API
│   ├── template-repository.ts # Template database operations
│   └── template-service.ts    # Template business logic
├── triggers/
│   ├── index.ts               # Trigger module exports
│   ├── trigger-detector.ts    # Detects trigger type from workflow
│   ├── trigger-registry.ts    # Plugin-style registry for trigger handlers
│   ├── types.ts               # Trigger type definitions
│   └── handlers/
│       ├── base-handler.ts    # Abstract base for all trigger handlers
│       ├── webhook-handler.ts # HTTP webhook trigger handler
│       ├── form-handler.ts    # Form submission trigger handler
│       └── chat-handler.ts    # Chat/AI trigger handler
├── types/
│   ├── index.ts               # Exported type definitions
│   ├── instance-context.ts    # Multi-tenant instance configuration
│   ├── n8n-api.ts             # n8n API response/request types
│   ├── node-types.ts          # n8n node type definitions
│   ├── session-state.ts       # Session persistence types
│   ├── type-structures.ts     # Type structure definitions
│   └── workflow-diff.ts       # Workflow diff operation types
├── utils/
│   ├── auth.ts                # Auth token loading and validation
│   ├── bridge.ts              # Bridge utilities for n8n native node
│   ├── cache-utils.ts         # Cache utility helpers
│   ├── console-manager.ts     # Console output isolation (HTTP mode)
│   ├── documentation-fetcher.ts  # Fetches node docs from n8n.io
│   ├── enhanced-documentation-fetcher.ts # Enhanced doc fetcher with caching
│   ├── error-handler.ts       # Centralized error handling
│   ├── example-generator.ts   # Example generation utilities
│   ├── expression-utils.ts    # n8n expression parsing utilities
│   ├── fixed-collection-validator.ts # Validates fixedCollection structures
│   ├── logger.ts              # Logging utility with HTTP awareness
│   ├── mcp-client.ts          # MCP client for n8n native node bridge
│   ├── n8n-errors.ts          # n8n-specific error types
│   ├── node-classification.ts # Classifies nodes by category
│   ├── node-source-extractor.ts # Extracts node source from packages
│   ├── node-type-normalizer.ts  # Normalizes node type strings
│   ├── node-type-utils.ts     # Node type utility functions
│   ├── node-utils.ts          # General node utilities
│   ├── npm-version-checker.ts # Checks npm for package updates
│   ├── protocol-version.ts    # MCP protocol version negotiation
│   ├── simple-cache.ts        # In-memory LRU cache
│   ├── ssrf-protection.ts     # SSRF attack prevention (configurable modes)
│   ├── template-node-resolver.ts  # Resolves node types in templates
│   ├── template-sanitizer.ts  # Sanitizes template data
│   ├── url-detector.ts        # Detects and constructs server URLs
│   ├── validation-schemas.ts  # Zod validation schemas for tool inputs
│   └── version.ts             # PROJECT_VERSION constant
├── http-server.ts             # Fixed HTTP server (recommended, USE_FIXED_HTTP=true)
├── http-server-single-session.ts  # Single-session HTTP server with session persistence API
├── mcp-engine.ts              # Full service integration API with session persistence wrappers
├── mcp-tools-engine.ts        # Simplified MCP engine for benchmarking
└── index.ts                   # Library exports
```

## Common Development Commands

```bash
# Build and Setup
npm run build          # Build TypeScript (always run after changes)
npm run rebuild        # Rebuild node database from n8n packages
npm run validate       # Validate all node data in database

# Testing
npm test               # Run all tests (vitest)
npm run test:unit      # Run unit tests only
npm run test:integration # Run integration tests
npm run test:coverage  # Run tests with coverage report
npm run test:watch     # Run tests in watch mode
npm run test:ci        # Run tests in CI mode (with JUnit reporter)

# Run a single test file
npm test -- tests/unit/services/property-filter.test.ts

# Benchmarks
npm run benchmark      # Run performance benchmarks
npm run benchmark:ci   # Run benchmarks in CI mode

# Linting and Type Checking
npm run lint           # Check TypeScript types (alias for typecheck)
npm run typecheck      # Check TypeScript types

# Running the Server
npm start              # Start MCP server in stdio mode
npm run start:http     # Start MCP server in HTTP mode
npm run start:http:fixed  # Start with fixed HTTP implementation (recommended)
npm run start:n8n      # Start in n8n native mode (N8N_MODE=true)
npm run dev            # Build, rebuild database, and validate
npm run dev:http       # Run HTTP server with auto-reload

# Update n8n Dependencies
npm run update:n8n:check  # Check for n8n updates (dry run)
npm run update:n8n        # Update n8n packages to latest

# Database Management
npm run db:rebuild     # Rebuild database from scratch
npm run migrate:fts5   # Migrate to FTS5 search (if needed)

# Template Management
npm run fetch:templates        # Fetch latest workflow templates from n8n.io
npm run fetch:templates:update # Update existing templates
npm run fetch:templates:robust # Fetch with retry logic
npm run sanitize:templates     # Sanitize template data
npm run test:templates         # Test template functionality

# Release Management
npm run prepare:release        # Prepare release artifacts
npm run sync:runtime-version   # Sync runtime version numbers
npm run update:readme-version  # Update version in README
```

## High-Level Architecture

### Core Components

1. **MCP Server** (`mcp/server.ts`)
   - Implements Model Context Protocol for AI assistants
   - Provides tools for searching, validating, and managing n8n nodes
   - Supports both stdio (Claude Desktop) and HTTP modes
   - Protocol version negotiation for compatibility with different clients (including n8n native node)
   - Integrates telemetry for anonymous usage statistics

2. **Database Layer** (`database/`)
   - SQLite database storing all n8n node information
   - Universal adapter pattern supporting both better-sqlite3 and sql.js
   - Full-text search capabilities with FTS5

3. **Node Processing Pipeline**
   - **Loader** (`loaders/node-loader.ts`): Loads nodes from n8n packages
   - **Parser** (`parsers/node-parser.ts`): Extracts node metadata and structure
   - **Property Extractor** (`parsers/property-extractor.ts`): Deep property analysis
   - **Docs Mapper** (`mappers/docs-mapper.ts`): Maps external documentation

4. **Service Layer** (`services/`)
   - **Property Filter**: Reduces node properties to AI-friendly essentials
   - **Config Validator**: Multi-profile validation system (minimal, runtime, ai-friendly, strict)
   - **Type Structure Service**: Validates complex type structures (filter, resourceMapper, etc.)
   - **Expression Validator**: Validates n8n expression syntax
   - **Workflow Validator**: Complete workflow structure validation
   - **Workflow Auto-Fixer**: Generates diff operations to automatically fix common errors
   - **Workflow Diff Engine**: Applies typed diff operations to n8n workflows
   - **AI Node Validator**: Specialized validation for AI Agent, Chat Trigger, LLM Chain nodes
   - **Breaking Change Detector**: Detects incompatible changes between node versions
   - **Email Services**: Multi-mailbox email management (Gmail OAuth2 + IMAP)

5. **Template System** (`templates/`)
   - Fetches and stores workflow templates from n8n.io
   - Provides pre-built workflow examples
   - Supports template search and validation

6. **Trigger System** (`triggers/`)
   - Plugin-style registry for trigger handlers
   - Supports webhook, form, and chat/AI trigger types
   - Used by `n8n_test_workflow` to send test payloads to active workflows

7. **Telemetry System** (`telemetry/`)
   - Anonymous usage statistics (opt-out via `TELEMETRY_ENABLED=false`)
   - Sanitizes all data before sending (no PII, no credentials, no workflow content)
   - Tracks tool usage, errors, and performance metrics
   - Batches events before transmission

8. **n8n Native Node** (`n8n/`)
   - `MCPNode` and `MCPApi` allow using this MCP server as a native n8n node
   - Enables n8n workflows to call MCP tools directly

### Key Design Patterns

1. **Repository Pattern**: All database operations go through repository classes
2. **Service Layer**: Business logic separated from data access
3. **Validation Profiles**: Different validation strictness levels (minimal, runtime, ai-friendly, strict)
4. **Diff-Based Updates**: Efficient workflow updates using operation diffs (saves 80-90% tokens)
5. **Plugin Registry**: Trigger handlers registered at startup via `TriggerRegistry`
6. **SSRF Protection**: Configurable security modes for webhook URL validation

### MCP Tools Architecture

The MCP server exposes tools in several categories:

1. **Discovery Tools**: `search_nodes`, `get_node`, `get_node_essentials`
2. **Configuration Tools**: `get_node_info`, `get_node_details`, `validate_node_config`
3. **Validation Tools**: `validate_workflow`, `n8n_validate_workflow`
4. **Workflow Tools**: `n8n_create_workflow`, `n8n_get_workflow`, `n8n_update_full_workflow`, `n8n_update_partial_workflow`, `n8n_delete_workflow`, `n8n_list_workflows`, `n8n_deploy_template`, `n8n_autofix_workflow`, `n8n_test_workflow`, `n8n_executions`, `n8n_workflow_versions`
5. **Documentation Tools**: `tools_documentation`, `get_template`, `search_templates`
6. **System Tools**: `n8n_health_check`, `n8n_diagnostic`, `n8n_list_available_tools`
7. **Email Tools**: `add_email_account`, `search_emails`, `get_email`, `list_email_accounts`

Tool documentation is organized in `mcp/tool-docs/` by category for maintainability.

### Security Features

- **SSRF Protection** (`utils/ssrf-protection.ts`): Configurable modes (strict/moderate/permissive) block access to internal networks, cloud metadata endpoints, and localhost (in strict mode). Configured via `WEBHOOK_SECURITY_MODE` env var.
- **Auth Token**: Bearer token authentication for HTTP mode via `AUTH_TOKEN` env var or file.
- **Rate Limiting**: Protects auth endpoint from brute force (configurable via `AUTH_RATE_LIMIT_*`).
- **Input Validation**: All tool inputs validated with Zod schemas (`utils/validation-schemas.ts`).
- **Tool Disabling**: Individual tools can be disabled at startup via `DISABLED_TOOLS` env var.

## Environment Variables

Key environment variables (see `.env.example` for full reference):

```bash
# Server Mode
MCP_MODE=stdio            # or 'http'
USE_FIXED_HTTP=true       # Use fixed HTTP implementation (recommended)
PORT=3000
HOST=0.0.0.0
BASE_URL=                 # Override auto-detected URL (for reverse proxy setups)
TRUST_PROXY=0             # Set to 1 when behind a reverse proxy

# Authentication (HTTP mode)
AUTH_TOKEN=               # Bearer token (required for HTTP mode)
AUTH_TOKEN_FILE=          # Alternative: load token from file

# Security
WEBHOOK_SECURITY_MODE=strict  # strict | moderate | permissive
DISABLED_TOOLS=           # Comma-separated list of tool names to disable

# n8n API (enables management tools)
N8N_API_URL=              # e.g., https://your-n8n-instance.com
N8N_API_KEY=              # From Settings > API in n8n
N8N_API_TIMEOUT=30000     # milliseconds
N8N_API_MAX_RETRIES=3

# Multi-tenant
ENABLE_MULTI_TENANT=false
MULTI_TENANT_SESSION_STRATEGY=instance
N8N_MCP_MAX_SESSIONS=100  # Max concurrent sessions

# Session Management
SESSION_TIMEOUT=1800000   # 30 minutes in milliseconds

# Database
NODE_DB_PATH=./data/nodes.db
REBUILD_ON_START=false

# OpenAI (for template metadata generation)
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
METADATA_GENERATION_ENABLED=false

# Telemetry
TELEMETRY_ENABLED=true    # Set to false to opt out
```

## Memories and Notes for Development

### Development Workflow Reminders
- When you make changes to MCP server, you need to ask the user to reload it before you test
- When the user asks to review issues, you should use GH CLI to get the issue and all the comments
- When the task can be divided into separated subtasks, you should spawn separate sub-agents to handle them in parallel
- Use the best sub-agent for the task as per their descriptions

### Testing Best Practices
- Always run `npm run build` before testing changes
- Use `npm run dev` to rebuild database after package updates
- Check coverage with `npm run test:coverage`
- Integration tests require a clean database state
- Integration tests against real n8n require `N8N_API_URL` and `N8N_API_KEY` configured

### Common Pitfalls
- The MCP server needs to be reloaded in Claude Desktop after changes
- HTTP mode requires proper CORS and auth token configuration
- Database rebuilds can take 2-3 minutes due to n8n package size
- Always validate workflows before deployment to n8n
- `n8n_test_workflow` only works with active workflows that have webhook, form, or chat triggers

### Performance Considerations
- Use `get_node_essentials()` instead of `get_node_info()` for faster responses
- Batch validation operations when possible
- The diff-based update system saves 80-90% tokens on workflow updates

### Agent Interaction Guidelines
- Sub-agents are not allowed to spawn further sub-agents
- When you use sub-agents, do not allow them to commit and push. That should be done by you

### Development Best Practices
- Run typecheck and lint after every code change

### Session Persistence Feature (v2.24.1)

**Location:**
- Types: `src/types/session-state.ts`
- Implementation: `src/http-server-single-session.ts` (lines 698-702, 1444-1584)
- Wrapper: `src/mcp-engine.ts` (lines 123-169)
- Tests: `tests/unit/http-server/session-persistence.test.ts`, `tests/unit/mcp-engine/session-persistence.test.ts`

**Key Features:**
- **Export/Restore API**: `exportSessionState()` and `restoreSessionState()` methods
- **Multi-tenant support**: Enables zero-downtime deployments for SaaS platforms
- **Security-first**: API keys exported as plaintext - downstream MUST encrypt
- **Dormant sessions**: Restored sessions recreate transports on first request
- **Automatic expiration**: Respects `sessionTimeout` setting (default 30 min)
- **MAX_SESSIONS limit**: Caps at 100 concurrent sessions (configurable via N8N_MCP_MAX_SESSIONS env var)

**Important Implementation Notes:**
- Only exports sessions with valid n8nApiUrl and n8nApiKey in context
- Skips expired sessions during both export and restore
- Uses `validateInstanceContext()` for data integrity checks
- Handles null/invalid session gracefully with warnings
- Session metadata (timestamps) and context (credentials) are persisted
- Transport and server objects are NOT persisted (recreated on-demand)

**Testing:**
- 22 unit tests covering export, restore, edge cases, and round-trip cycles
- Tests use current timestamps to avoid expiration issues
- Integration with multi-tenant backends documented in README.md

### Workflow Auto-Fix Feature

**Location:** `src/services/workflow-auto-fixer.ts`

**Purpose:** Automatically generates diff operations to fix common workflow validation errors.

**Fix types:** `expression-format`, `typeversion-correction`, `error-output-config`, `missing-required-field`, `unknown-node-type`, `operation-correction`, `resource-correction`

**Confidence levels:** `high` (safe to auto-apply), `medium` (review suggested), `low` (manual review required)

**Used by:** `n8n_autofix_workflow` MCP tool

### Trigger System Feature

**Location:** `src/triggers/`

**Purpose:** Enables `n8n_test_workflow` to send test payloads to active n8n workflows that use trigger nodes.

**Supported triggers:** `webhook`, `form`, `chat`

**Architecture:** Plugin-style registry — new trigger types can be added by registering a handler class that extends `BaseTriggerHandler`.

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.
- When you make changes to MCP server, you need to ask the user to reload it before you test
- When the user asks to review issues, you should use GH CLI to get the issue and all the comments
- When the task can be divided into separated subtasks, you should spawn separate sub-agents to handle them in paralel
- Use the best sub-agent for the task as per their descriptions
- Do not use hyperbolic or dramatic language in comments and documentation
- Add to every commit and PR: Concieved by Romuald Członkowski - and then link to www.aiadvisors.pl/en. Don't add it in conversations
