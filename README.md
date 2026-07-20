# AllMall AI Commerce Platform

AllMall is a cloud-based, multi-tenant AI commerce operations platform. It turns business goals into governed, auditable agent workflows for multi-store and multi-platform e-commerce teams.

AllMall is designed to help teams manage operations with autonomous AI agents, controlled execution, tenant isolation, and human approval for high-risk actions.

The platform targets scenarios where official platform APIs are limited, traditional RPA scripts are brittle, and manual operations cannot keep up with real-time changes in traffic, ROI, compliance rules, and customer behavior.

## Project Vision

Modern e-commerce operations are increasingly complex:

- Merchants often run multiple stores across several marketplaces.
- Advertising ROI, CPC, CTR, inventory risk, and customer activity change continuously.
- Platform compliance rules and risk-control policies evolve frequently.
- Many high-value actions are not fully covered by official APIs.
- Manual workflows are slow, expensive, and difficult to audit at scale.

AllMall addresses these problems with a four-layer multi-agent architecture that combines LLM reasoning, visual browser automation, compliance controls, isolated execution environments, and Human-in-the-Loop approval.

## Core Architecture

AllMall is organized into four vertical layers:

```text
Portal Layer
    |
Master Layer
    |
Manager Layer
    |
Worker Layer
```

### 1. Portal Layer

The Portal is the user-facing entry point for tenants and operators.

Main responsibilities:

- Multi-store operations dashboard
- Real-time GMV, ROI, advertising spend, and task status views
- Tenant and store configuration
- SOP threshold management
- Webhook, Feishu, DingTalk, and alert channel configuration
- Billing, subscription, quota, and AI token usage tracking

### 2. Master Layer

The Master layer acts as the global orchestration brain.

Main responsibilities:

- Receive user instructions from the Portal
- Coordinate company-level resources
- Manage task priority and global risk policies
- Retrieve platform rules, category policies, historical cases, and tenant SOPs through RAG
- Enforce multi-tenant RBAC
- Generate candidate strategies through LLM-based decision engines

Key modules:

- CEO Orchestrator
- Global Knowledge Base / RAG
- Multi-Tenant RBAC
- AI Decision Engine

### 3. Manager Layer

The Manager layer validates strategies and dispatches domain-specific agents.

Main responsibilities:

- Review AI-generated content, images, and operational actions
- Block prohibited words, risky claims, and infringing assets
- Apply tenant-specific thresholds and compliance policies
- Dispatch specialized agents for traffic, product launch, CRM, and finance workflows

Key agents:

- Compliance Guard
- Traffic Agent
- Launch and CRM Agent
- Finance Agent

### 4. Worker Layer

The Worker layer performs isolated execution.

Main responsibilities:

- Run store-level browser automation in isolated Docker environments
- Execute Playwright-based actions such as clicking, scrolling, price changes, customer replies, and review submissions
- Maintain isolated browser profiles, cookies, credentials, and execution contexts per store
- Apply network, frequency, concurrency, and circuit-breaker controls
- Capture screenshots, browser traces, step logs, and execution evidence

Key modules:

- Docker Claw Runner
- Playwright Automation
- Session and Environment Isolation
- Network and Frequency Governance

## Automation Workflows

AllMall is designed around reusable workflows that can be executed by agents and controlled by risk policies.

### Advertising Agent

Capabilities:

- Monitor ROI, CPC, and CTR in real time
- Adjust bids and routine budgets
- Replace low-conversion creative assets
- Dynamically shift traffic allocation

Risk controls:

- Trigger a circuit breaker after 2-3 consecutive days without conversions
- Trigger approval when ROI drops below configured targets
- Require human confirmation for large budget changes

### Product Launch Agent

Capabilities:

- Generate SEO-friendly titles
- Fill product attributes
- Build product detail page structures
- Run A/B tests

Risk controls:

- Raise warnings when performance is below category benchmarks for several days
- Suspend execution when infringing images or prohibited marketing claims are detected

### CRM Retention Agent

Capabilities:

- Segment users by value
- Identify repurchase windows
- Wake dormant users
- Issue coupons automatically

Risk controls:

- Move users into win-back flows after long inactivity periods
- Apply tenant-level messaging and coupon limits

### Finance Audit Agent

Capabilities:

- Calculate real-time profit
- Track platform fees
- Identify risky inventory
- Generate automated reports

Risk controls:

- Reserve 10%-15% of sales as a configurable risk buffer
- Surface abnormal cost, fee, or inventory patterns for review

## Human-in-the-Loop Control

AllMall does not assume that every AI-generated action should be executed automatically.

Human approval is required for high-risk operations such as:

- Large advertising budget changes
- Bulk price updates
- Bulk coupon issuance
- Product delisting
- Compliance-sensitive content
- Suspicious platform behavior

Approval channels can include:

- Portal
- Feishu
- DingTalk
- WeCom / Enterprise WeChat
- Webhook integrations

Every approval records the approver, timestamp, before-and-after values, recommended action, and agent reasoning summary.

## Task Control Plane

The platform uses a unified execution model:

- `Task`: a business goal triggered by a user or system, such as changing price, launching a product, replacing creative assets, or recalling customers.
- `Workflow`: a reusable process template that turns business goals into repeatable SOPs.
- `Run`: a concrete execution instance of a workflow.
- `Step`: an individual executable or reviewable unit within a run.
- `Queue`: a scheduler that dispatches work by tenant, store, priority, and risk level.
- `Approval`: a controlled checkpoint for high-risk actions.
- `Audit Log`: a durable record of decisions, approvals, browser actions, retries, and final outcomes.

This model supports pause, retry, rollback, compensation, and replay.

## API and Data Contract Conventions

All future API specifications, database schemas, frontend type definitions, and Agent integration contracts should follow the same field and enum conventions. These rules are intended to keep storage efficient, joins predictable, and external responses conservative from a security perspective.

### Numeric IDs

All AllMall-owned entity identifiers must use `int64` / `long` numeric IDs in APIs and database tables.

Examples:

- `tenantId`
- `userId`
- `storeId`
- `platformId`
- `authorizationId`
- `runtimeSessionId`
- `taskId`
- `runId`
- `stepId`
- `eventId`
- `artifactId`
- `approvalId`
- `candidateId`

Database column names should use snake_case equivalents such as `tenant_id`, `store_id`, `platform_id`, and `runtime_session_id`.

### Platform Fields

Marketplace platforms must be modeled with a numeric `platformId`. Human-readable strings are allowed only as display or context fields.

Recommended shape:

```json
{
  "platformId": 1,
  "platformCode": "pinduoduo",
  "platformName": "拼多多"
}
```

Rules:

- `platformId` is the database foreign key and API contract field used for joins and filtering.
- `platformCode` is for display, logs, configuration lookup, and Agent-readable context.
- `platformName` is for UI display.
- Do not use strings such as `"pinduoduo"` as the primary database relationship field.

### External References

Opaque IDs returned by external systems should not be stored or exposed as AllMall primary IDs. Use `*Ref` for these values.

Examples:

```json
{
  "runtimeSessionId": 40001,
  "runtimeSessionRef": "mrs_pdd_store_001_20260613",
  "runtimeProfileRef": "profile_pdd_001",
  "externalProductRef": "pdd_goods_123"
}
```

Rules:

- `*Id` means AllMall-owned numeric ID.
- `*Ref` means external opaque reference string.
- `*Token` means short-lived token, such as `connectToken`.
- `requestId` / `traceId` may remain strings because they are used for log correlation rather than business joins.

### Status Codes

API responses should return numeric status codes instead of descriptive status strings. The meaning of each code belongs in documentation, SDK enum definitions, and internal logs.

Store authorization status:

| authStatusCode | Internal enum | Meaning |
| --- | --- | --- |
| `0` | `disconnected` | Store is not bound to a runtime session. |
| `10` | `pending_login` | Login session has been created and is waiting for user login. |
| `20` | `connected` | Store has an active runtime session. |
| `30` | `login_required` | Runtime session expired or requires human verification. |
| `40` | `revoked` | User or admin revoked the authorization. |
| `50` | `failed` | Login binding failed. |

Generic execution status:

| statusCode | Internal enum | Meaning |
| --- | --- | --- |
| `10` | `queued` | Created and waiting for execution. |
| `20` | `running` | Running. |
| `30` | `waiting_approval` | Waiting for human approval. |
| `40` | `succeeded` | Succeeded. |
| `50` | `failed` | Failed. |
| `60` | `cancelled` | Cancelled. |

Approval status:

| approvalStatusCode | Internal enum | Meaning |
| --- | --- | --- |
| `10` | `pending` | Waiting for human decision. |
| `20` | `approved` | Approved. |
| `30` | `rejected` | Rejected. |
| `40` | `expired` | Expired. |

### Error Codes

Production API responses should return numeric error codes only. Do not expose detailed error messages, internal enum names, stack traces, platform page details, or vendor-specific failure descriptions in public responses.

Recommended response:

```json
{
  "success": false,
  "requestId": "req_20260613_001",
  "data": null,
  "error": {
    "errorCode": 1001
  }
}
```

Error code registry:

| errorCode | Internal enum | Meaning |
| --- | --- | --- |
| `1001` | `CONNECT_TOKEN_EXPIRED` | The connect token has expired. |
| `1002` | `CONNECT_TOKEN_CONSUMED` | The connect token has already been consumed. |
| `2001` | `SESSION_NOT_FOUND` | Runtime session was not found. |
| `2002` | `SESSION_EXPIRED` | Runtime session expired. |
| `2003` | `HUMAN_VERIFICATION_REQUIRED` | Human verification is required. |
| `3001` | `PAGE_STRUCTURE_CHANGED` | Target page structure changed. |
| `3002` | `DATA_UNCERTAIN` | Data is incomplete or uncertain. |
| `4001` | `APPROVAL_TIMEOUT` | Human approval timed out. |

Detailed messages may be shown in internal logs, developer tools, SDK enum descriptions, and documentation. User-facing product copy should be generated by the frontend or BFF based on numeric codes and locale.

## Multi-Tenant Isolation

AllMall is designed for enterprise-grade multi-tenant operations.

### Data Isolation

- Enterprise tenants can use dedicated databases or dedicated schemas.
- Standard tenants can use a shared database with `tenant_id` and row-level security.
- Orders, products, ads, customers, assets, tasks, and audit logs must always include tenant and store ownership.
- Cross-tenant analytics should only use anonymized platform-level views.

### Secret Isolation

- Store tokens, cookies, platform accounts, webhooks, LLM keys, and proxy settings are stored in a dedicated Secret Vault.
- Workers receive only the minimum required credentials during execution.
- Sensitive access is logged and can be revoked by tenants.

### Resource Quotas

Quotas can be applied by plan, tenant, store, and platform:

- Worker count
- Concurrent tasks
- LLM token usage
- Asset storage
- Browser sessions
- Daily operation count
- Budget-related action limits

Abnormal tenants can be rate-limited, paused, or moved into manual review mode.

## Observability and Replay

AllMall emphasizes traceability for both AI decisions and browser execution.

Evidence collected during execution may include:

- Step screenshots
- Page state summaries
- Browser traces
- Exception screenshots
- RAG hit summaries
- Model input/output summaries
- Risk scores
- Strategy versions
- Click, input, submit, API call, retry, and final result logs

This allows incidents to be reviewed by tenant, store, task, agent, and timeline.

## Internal Beta MuleRun Integration

During the internal beta stage, AllMall can integrate with MuleRun through a lightweight `connectToken` flow. This allows the SaaS platform team and the agent team to work independently while still enabling realistic integration tests.

The recommended beta split is:

- AllMall owns tenants, users, stores, permissions, task records, approvals, audit logs, quotas, and billing.
- MuleRun owns early high-value agent experiments, browser sandbox execution, and persisted browser sessions during beta testing.
- AllMall stores a runtime session reference instead of directly storing MuleRun browser cookies or platform tokens.

### Store Login Bootstrap

For platforms such as Pinduoduo, Taobao, Douyin Shop, TikTok Shop, and other marketplaces, login may require captcha, 2FA, or other human verification. AllMall should model this as a Human Session Bootstrap or Re-authentication flow.

In this flow, the user or operator completes the login manually inside the MuleRun browser sandbox. The agent then reuses the legally established browser session for later operations.

The beta flow is:

```text
1. A user adds a Pinduoduo store in AllMall.
2. AllMall creates a pending Store Authorization record.
3. AllMall generates a short-lived connectToken.
4. The user manually opens the Pinduoduo Login Bootstrap Agent in MuleRun.
5. The user enters the connectToken into the MuleRun Agent.
6. MuleRun opens its browser sandbox/profile.
7. The user manually logs in to Pinduoduo and completes captcha, 2FA, or other checks.
8. MuleRun persists the browser profile/session.
9. MuleRun Agent calls AllMall to bind the session back to the store.
10. AllMall marks the store as connected and stores the MuleRun session reference.
```

The binding callback can use a payload like:

```json
{
  "connectToken": "amct_7F6p9xQ2",
  "authorizationId": 30001,
  "storeId": 20001,
  "platformId": 1,
  "platformCode": "pinduoduo",
  "platformName": "拼多多",
  "runtimeProvider": "mulerun",
  "runtimeSessionRef": "mrs_pdd_store_001_20260613",
  "runtimeProfileRef": "profile_pdd_001",
  "authStatusCode": 20
}
```

AllMall should store the result as a store authorization record:

```json
{
  "storeId": 20001,
  "platformId": 1,
  "platformCode": "pinduoduo",
  "platformName": "拼多多",
  "authMode": "mulerun_browser_profile",
  "runtimeProvider": "mulerun",
  "runtimeSessionId": 40001,
  "runtimeSessionRef": "mrs_pdd_store_001_20260613",
  "authStatusCode": 20
}
```

### Agent Task Execution

After the store session is bound, AllMall can create agent tasks without sending the original store password or long-lived cookies to MuleRun.

Example task payload:

```json
{
  "taskId": 50001,
  "runId": 60001,
  "tenantId": 10001,
  "storeId": 20001,
  "platformId": 1,
  "platformCode": "pinduoduo",
  "platformName": "拼多多",
  "agentType": "competitor_research",
  "runtimeProvider": "mulerun",
  "runtimeSessionId": 40001,
  "runtimeSessionRef": "mrs_pdd_store_001_20260613",
  "input": {
    "targetProduct": {
      "externalProductRef": "pdd_goods_123",
      "title": "夏季女装短袖T恤"
    },
    "researchScope": {
      "keywords": ["夏季女装短袖", "纯棉T恤女"],
      "maxCompetitors": 20
    }
  },
  "callbackUrl": "https://api.allmall.example.com/agent-events"
}
```

MuleRun loads the referenced browser profile, verifies that the session is still valid, runs the agent workflow, and sends status updates, screenshots, logs, approval requests, and final results back to AllMall.

If the session expires or a new human verification step appears, MuleRun should stop automation and send a `login_required` event to AllMall:

```json
{
  "eventType": "login_required",
  "tenantId": 10001,
  "storeId": 20001,
  "runId": 60001,
  "runtimeSessionId": 40001,
  "reasonCode": 2003
}
```

AllMall can then notify the user and start another bootstrap or re-authentication flow.

### Future Upgrade Path

The `connectToken` flow is intentionally simple for beta testing. If MuleRun later provides an API that can create a user-facing browser session URL, AllMall can upgrade to this flow:

```text
AllMall Backend -> MuleRun API -> create session -> return login URL
AllMall Frontend -> opens login URL for the user
MuleRun -> persists browser profile
MuleRun -> callbacks AllMall with session_established
```

Because AllMall stores only a runtime session reference, MuleRun can later be replaced or complemented by a self-hosted Claw Runner without redesigning the tenant, store, task, approval, and audit models.

## MVP Roadmap

### Phase 1: Platform Foundation

- Tenant, user, role, and store authorization models
- Secret Vault
- Quota and billing foundation
- Unified task center with Task, Workflow, Run, Step, Approval, and Audit Log
- Worker sandbox with store-level browser sessions, queue consumption, screenshots, and execution logs

### Phase 2: First High-Value Agent

- Start with the Pinduoduo competitor research agent
- Complete store login binding, browser session reuse, screenshot evidence, raw data capture, and final report callbacks
- Add human approval for competitor selection, price definition, and low-confidence conclusions
- Convert the successful flow into reusable SOP and Agent interface templates

### Phase 3: Scaled Operations

- Extend marketplace adapters for platforms such as Taobao, Douyin, JD, TikTok Shop, Amazon, Shopee, Lazada, Walmart, and Shopify
- Add strategy experiments, A/B testing, automated reports, tenant health scores, and cost dashboards
- Build an operations console for Worker scaling, failure replay, task pause, and tenant-level risk control

## Suggested Technology Stack

- Frontend: React + TypeScript
- UI framework: Ant Design
- Backend: Node.js + NestJS + TypeScript
- ORM: Prisma
- Database: PostgreSQL
- Cache and queue: Redis + BullMQ
- Object storage: S3-compatible storage
- Secret management: HashiCorp Vault
- Beta agent runtime: MuleRun with connectToken-based session binding
- Future agent execution: Claw Runner / OpenClaw-compatible execution engine
- AI reasoning: LLM cluster
- Knowledge retrieval: Vector database / RAG
- Observability: OpenTelemetry + Prometheus + Grafana + Loki

## Repository Contents

This repository currently contains design artifacts, business planning materials, and the AllMall Portal MVP frontend:

- `docs/architecture/AllMall_V0.1.html`: the latest high-level visual architecture document
- `docs/architecture/AllMall_Internal_Technical_Route_V0.3.html`: combined platform architecture, internal technical route, team collaboration plan, and MuleRun beta integration plan
- `docs/architecture/AllMall_SaaS_Technical_Architecture_V0.1.html`: SaaS platform technical architecture
- `docs/architecture/AllMall_SaaS_Database_Design_V0.1.html`: SaaS platform database design
- `docs/architecture/AllMall_SaaS_API_Specification_V0.2.html`: current SaaS platform API specification, including daily operations data collection APIs
- `docs/architecture/AllMall_SaaS_Agent_Interface_Specification_V0.3.html`: current SaaS-to-Agent interface specification for login binding, competitor research, scheduled operations data collection, and full initial store synchronization
- `docs/architecture/AllMall_AI_Vertical_Model_Technical_Route_V0.1.html`: AI vertical model technical architecture and roadmap
- `docs/architecture/system design.html`: an earlier system design document
- `arkops-portal/`: React + TypeScript + Vite + Ant Design frontend MVP; the directory name is legacy, while the product name is AllMall
- `Business Plan/`: business plan markdown, PDF, and architecture diagrams
- `docs/document requirement.docx`: requirement notes

Backend services, infrastructure definitions, and production runtime modules can be added as the MVP is built.
