# AllMall Portal Frontend

This directory contains the React + TypeScript frontend for the AllMall SaaS management console.

The current implementation has been updated according to `product-design.md`. It focuses on the frontend page structure, mock data, navigation, and user-facing management workflows. Backend APIs and database implementation have not started yet.

> Note: the package and directory are still named `arkops-portal` for legacy reasons. Product-facing documentation should use `AllMall`.

## Current Status

Frontend status:

- The main SaaS console pages have been implemented with mock data.
- The navigation has been updated to match the latest product design.
- Agent tasks are now managed inside Agent detail pages rather than through standalone task list/detail pages.
- Billing ledger is available from the main navigation; the standalone subscription page has been removed from the latest navigation.
- Exception Center, Order Automation, Operations Center, and Usage Guide are available from the main navigation.
- Model Center has been redesigned around Agent-to-model assignment.
- The approval badge in the sidebar reflects pending approvals from mock summary data.
- Light, dark, and system theme switching are available.
- Chinese and English language switching is available.
- Routes are lazy-loaded so page modules are split into separate Vite chunks.
- AllMall-owned mock entity IDs now use numeric values in frontend types and data.

Not started yet:

- Real backend API integration
- Database schema and migrations
- Authentication / session backend
- Real MuleRun runtime calls
- Real billing, payment, invoice, and subscription APIs
- Real model provider API key validation

## Product Design Source

The source product design document is:

```text
arkops-portal/product-design.md
```

This document defines:

- SaaS and private deployment product modes
- User roles and permissions
- Current P0/P1/P2 roadmap
- Navigation structure
- Implemented frontend module scope
- Dashboard, exceptions, orders, stores, agents, models, operations, approvals, billing, guide, and settings behavior

When changing page scope or navigation, update `product-design.md` first, then update this README and frontend routes.

## Fixed Frontend Stack

- React 18
- TypeScript
- Vite
- Ant Design
- React Router
- TanStack Query
- Day.js

Scripts:

```bash
npm install
npm run dev
npm run build
npm run preview
```

The dev server runs with:

```bash
vite --host 0.0.0.0
```

Default local URL:

```text
http://localhost:5173/
```

## Implemented Navigation

| Route | Page | Status | Purpose |
| --- | --- | --- | --- |
| `/login` | Login | Implemented | User authentication entry page with mock flow. |
| `/dashboard` | Dashboard | Implemented | Business overview, Agent monitoring, and new user onboarding wizard. |
| `/setup` | Quick Setup | Implemented | Centralized config for pricing, ads, customer, and inventory across all agents. |
| `/exception-center` | Exception Center | Implemented | High-priority issues that require operator intervention. |
| `/approvals` | Approval List | Implemented | Pending approval list. |
| `/approvals/:approvalId` | Approval Detail | Implemented | Approve or reject high-risk actions. |
| `/orders` | Order Automation | Implemented | Order handling, automation progress, and exception workflows. |
| `/stores` | Store List | Implemented | Store list, authorization status, service tags, add-store entry. |
| `/stores/new` | Add Store | Implemented | Store creation / onboarding flow. |
| `/stores/:storeId` | Store Detail | Implemented | Store business overview and settings tabs. |
| `/agents` | Agent Center | Implemented | My Agents and available Agents panels. |
| `/agents/:agentType` | Agent Detail | Implemented | Agent stats, run instructions, task history, task creation modal. |
| `/models` | Model Center | Implemented | Agent model assignment, custom models, monthly usage. |
| `/operations` | Operations Center | Implemented | Business, cost, product, and efficiency analysis. |
| `/audit-logs` | Audit Logs | Implemented | System and execution audit records. |
| `/billing` | Billing Ledger | Implemented | Usage, monthly cost, bills, invoices. |
| `/guide` | Usage Guide | Implemented | Product usage guide and core workflow explanations. |
| `/settings/members` | Members | Implemented | Member list and invitations. |
| `/settings/notifications` | Notifications | Implemented | Notification channels and preferences. |

Removed from the latest navigation:

- `/tasks`
- `/tasks/new`
- `/tasks/:taskId`
- `/subscription`
- `/settings/approval-policy`

Task creation and task history now belong to each Agent detail page.
Subscription, payment, invoice, and enterprise plan content now belong to `/billing`.
Approval rules are configured in Agent/risk-control contexts rather than through a standalone approval policy page.

## Implemented Modules

### Dashboard

Two tabs are implemented:

- Business Overview
- Agent Monitoring

The dashboard includes:

- GMV, orders, average order value, and store count
- GMV and order trend chart
- Advertising ROI panel
- After-sales metrics
- Inventory and product health
- Top product ranking
- Store GMV ranking
- Task status distribution
- Agent run overview
- Quota usage
- Runtime health signals
- Live event feed

### Store Management

Implemented:

- Store list
- Store creation
- Store detail
- Store business overview tab
- Store settings tab
- Service connection display
- Authorization status display

The latest design removed technical columns such as execution environment and last validation from the store list. Store rows now emphasize business-facing service tags such as Qianchuan and Feige.

### Agent Center

Implemented:

- My Agents panel
- Available Agents panel
- Agent activation entry
- Agent detail page
- Run statistics
- Run instructions
- Task history
- New task modal
- Product launch image upload support

Implemented Agent types:

- Login Guide Agent
- Product Launch Agent
- Advertising Optimization Agent
- Pricing Strategy Agent
- CRM Repurchase Agent
- Review Management Agent
- Customer Service Agent
- After-sales Agent
- Market Intelligence Agent
- Creative Factory Agent
- Inventory Alert Agent
- Finance Reconciliation Agent
- Risk Control Agent
- Promotion Campaign Agent
- Live Stream Operations Agent

Future P2 scope:

- Agent template marketplace
- Agent workflow orchestration

### Model Center

Implemented:

- Agent-to-model assignment
- Automatic model selection
- Ark commerce vertical model option
- Custom model creation and deletion
- Monthly usage chart

The current frontend uses mock data. Real provider validation and billing integration are not implemented.

### Approval Center

Implemented:

- Approval list
- Approval detail
- Approve / reject actions
- Sidebar pending approval badge

### Exception Center

Implemented:

- Login-required issues
- Failed Agent runs
- Approval timeouts
- Data uncertainty and runtime issues
- Operator action buttons and links back to related stores, Agents, or approvals

### Order Automation

Implemented:

- Order automation metrics
- Order tabs and filters
- Exception handling actions
- Order detail modal and execution timeline

### Operations Center

Implemented:

- Business and efficiency analysis panels
- Cost and product performance views
- Operational insights for follow-up automation work

### Billing

Billing ledger includes:

- Current plan summary
- Monthly cost
- Usage percentage
- Estimated labor savings
- Next payment date
- Monthly usage chart
- Current bill details
- Historical invoice list
- Subscription, payment, invoice, and enterprise plan sections

### Usage Guide

Implemented:

- Product usage guide
- Core workflow explanations
- Beta capability boundaries

### Settings

Implemented:

- Member management
- Notification settings

## Data Layer

The current frontend uses local mock APIs under:

```text
src/api/
```

Important mock API groups:

- `businessDashboard.ts`
- `storeBusiness.ts`
- `dashboard.ts`
- `agents.ts`
- `agentMockData.ts`
- `models.ts`
- `approvalPolicies.ts`
- `finance.ts`
- `settings.ts`
- `stores.ts`
- `storeMockData.ts`
- `tasks.ts`
- `approvals.ts`
- `auditLogs.ts`

Mock API state changes should go through `mockRepository.ts` helpers where practical. This keeps create, update, replace, and remove behavior centralized while the app is still frontend-only.

Current frontend type conventions:

- AllMall-owned IDs use numeric `AllMallId` values.
- Route params are parsed with `src/utils/id.ts` before calling mock APIs.
- External or vendor identifiers, such as model provider IDs, invoice references, campaign codes, SKU codes, and runtime references, remain strings.
- Large static Agent detail mock datasets are kept outside the page component in `src/pages/agents/agentConfigMockData.ts`.

Backend integration has not started. When backend work begins, replace mock implementations with typed API clients while preserving the UI-facing response shapes where practical.

## Backend Boundary

The frontend must call only AllMall backend APIs:

```text
Portal -> AllMall Backend -> MuleRun / Agent Runtime
```

The frontend must not call MuleRun directly.

MuleRun session binding, runtime events, approvals, artifacts, and audit logs should be represented through AllMall backend APIs.

## API and Database Contract Notes

Future API and database work must follow the repository-level conventions in the root `README.md`:

- All AllMall-owned IDs use `int64` / `long`.
- `platformId` is the database relationship field.
- `platformCode` and `platformName` are display and Agent-context fields.
- External runtime values use `*Ref`, for example `runtimeSessionRef`.
- Public responses should return numeric status and error codes.
- Error explanations should stay in documentation, SDK enums, internal logs, or frontend-localized copy.

Relevant interface document:

```text
../docs/architecture/AllMall_SaaS_Agent_Interface_Specification_V0.1.html
```

## Suggested Directory Structure

Current structure:

```text
arkops-portal/
  product-design.md
  README.md
  index.html
  package.json
  src/
    api/
    app/
      i18n.tsx
      layout/
      providers.tsx
      router.tsx
      theme.tsx
    components/
    pages/
      agents/
      approvals/
      audit/
      auth/
      billing/
      dashboard/
      guide/
      models/
      operations/
      orders/
      settings/
      stores/
    styles/
    types/
```

The implementation groups page-level modules by product domain under `src/pages/` and keeps mock API modules under `src/api/`.

Implementation notes:

- Routes in `src/app/router.tsx` use `React.lazy` and `Suspense` for page-level code splitting.
- Translation dictionaries live in `src/app/i18n.tsx` and expose a typed `TranslationKey`.
- Repeated Agent task card styling is centralized in `src/styles/global.css`.

## Directory and File Reference

Use this table as the first stop when a collaborator or AI coding tool needs to decide where to make a change.

### Project root

| Path | Type | Purpose | Change when |
| --- | --- | --- | --- |
| `README.md` | Documentation | Frontend implementation guide, directory map, collaboration rules, and AI-assisted coding workflow. | Project structure, coding workflow, navigation, or collaboration conventions change. |
| `product-design.md` | Product spec | Canonical product scope for navigation, roles, modules, and roadmap. | Page scope, navigation, user roles, or module behavior changes. |
| `package.json` | Config | Defines scripts and frontend dependencies. | Adding/removing packages or scripts. |
| `package-lock.json` | Lockfile | Locks exact dependency versions. | `npm install` changes dependencies. |
| `index.html` | App shell | Vite HTML entry point. | App title, root container, or global meta tags change. |
| `vite.config.ts` | Build config | Vite and dev-server configuration. | Build behavior, dev host/port, aliases, or plugins change. |
| `tsconfig.json` | TypeScript config | Type checking for app source. | TypeScript compiler behavior changes. |
| `tsconfig.node.json` | TypeScript config | Type checking for Node-side config files. | Vite/config TypeScript behavior changes. |
| `.gitignore` | Git config | Excludes local dependencies, build output, and local-only files. | New generated/local files should not be tracked. |

### Source root

| Path | Type | Purpose | Change when |
| --- | --- | --- | --- |
| `src/main.tsx` | Entry point | Mounts React app and global providers. | App bootstrap or global provider setup changes. |
| `src/vite-env.d.ts` | Type declarations | Vite environment type declarations. | Vite environment typing changes. |
| `src/types/domain.ts` | Domain types | Shared frontend domain models for stores, tasks, Agents, approvals, billing, and models. | A UI-facing data shape changes. |
| `src/utils/id.ts` | Utility | Parses route params into numeric AllMall IDs. | Route ID parsing rules change. |
| `src/styles/global.css` | Global styles | Layout, shared component styling, page-level utility classes. | Shared styling or repeated UI patterns change. |
| `src/styles/tokens.css` | Design tokens | Theme variables and token-level styling. | Color, spacing, or token conventions change. |

### App infrastructure

| Path | Type | Purpose | Change when |
| --- | --- | --- | --- |
| `src/app/router.tsx` | Router | Defines lazy-loaded routes and route-to-page mapping. | Adding/removing/renaming a page route. |
| `src/app/layout/AppShell.tsx` | Layout | Main SaaS frame, sidebar navigation, badges, header, theme and language controls. | Navigation, shell layout, badge behavior, or header controls change. |
| `src/app/providers.tsx` | Providers | Root app providers such as query client, theme, and i18n wrappers. | Global provider setup changes. |
| `src/app/theme.tsx` | Theme | Light/dark/system theme state and Ant Design theme integration. | Theme behavior or token mapping changes. |
| `src/app/i18n.tsx` | I18n | Chinese/English dictionaries, typed translation keys, and language state. | Any user-facing text is added or changed. |

### Mock API layer

| Path | Type | Purpose | Change when |
| --- | --- | --- | --- |
| `src/api/client.ts` | API utility | Mock delay and connect-token helper functions. | Shared mock API utilities change. |
| `src/api/mockRepository.ts` | Mock state helper | Centralized insert, replace, remove, and update helpers for in-memory mock state. | Mock state mutation patterns change. |
| `src/api/mockData.ts` | Mock data | Shared mock stores, tasks, approvals, audit logs, and dashboard-ish entities. | Shared demo records change. |
| `src/api/storeMockData.ts` | Mock data | Store config mock records. | Store settings/config demos change. |
| `src/api/agentMockData.ts` | Mock data | Agent configs, stats, dependencies, strategy config, and Agent demo records. | Agent catalog, dependencies, or strategy demos change. |
| `src/api/dashboard.ts` | Mock API | Sidebar summary and global dashboard counts. | Sidebar badges or summary data change. |
| `src/api/businessDashboard.ts` | Mock API | Business dashboard metric data. | Dashboard business metrics change. |
| `src/api/storeBusiness.ts` | Mock API | Store detail business metrics. | Store detail business panels change. |
| `src/api/stores.ts` | Mock API | Store list, creation, connection, status, and config APIs. | Store workflows change. |
| `src/api/agents.ts` | Mock API | Agent list/detail/task/config APIs. | Agent workflows, task creation, or strategy state changes. |
| `src/api/tasks.ts` | Mock API | Task-oriented access layer. | Cross-Agent task behavior changes. |
| `src/api/approvals.ts` | Mock API | Approval list/detail/actions. | Approval workflows change. |
| `src/api/approvalPolicies.ts` | Mock API | Approval-policy mock data for legacy or embedded policy views. | Agent approval rule demos change. |
| `src/api/auditLogs.ts` | Mock API | Audit log records. | Audit trail demos change. |
| `src/api/models.ts` | Mock API | Model center, model assignment, and custom model mocks. | Model center behavior changes. |
| `src/api/finance.ts` | Mock API | Billing, subscription, invoice, and usage mocks. | Billing or subscription demos change. |
| `src/api/settings.ts` | Mock API | Members and notification settings mocks. | Settings pages change. |

### Shared components

| Path | Type | Purpose | Change when |
| --- | --- | --- | --- |
| `src/components/PageHeader.tsx` | Shared component | Standard page title, subtitle, and action row. | Page header layout changes globally. |
| `src/components/StatusBadge.tsx` | Shared component | Localized status and risk tags. | Status/risk display mapping changes. |
| `src/components/EmptyState.tsx` | Shared component | Common empty-state UI. | Empty state style or behavior changes. |
| `src/components/AgentLiveConsole.tsx` | Shared component | Task-level simulated Agent/runtime execution console. | Agent task live-console behavior changes. |
| `src/components/DashboardLiveFeed.tsx` | Shared component | Dashboard-level rolling event feed. | Global live-feed behavior changes. |
| `src/components/metrics/MetricCard.tsx` | Shared component | KPI/stat card wrapper. | Metric card layout changes across pages. |
| `src/components/charts/TrendBarChart.tsx` | Shared component | Compact multi-bar trend chart. | Reusable trend visualization changes. |
| `src/components/table/DataTableCard.tsx` | Shared component | Card-wrapped Ant Design table with toolbar/description support. | Table container behavior changes. |
| `src/components/table/TableActionGroup.tsx` | Shared component | Compact row action wrapper. | Table action spacing changes. |
| `src/components/filters/PageFilterBar.tsx` | Shared component | Inline or card-style filter bar. | Filter layout changes across pages. |
| `src/components/detail/DetailSection.tsx` | Shared component | Detail card wrapper. | Detail section spacing/card behavior changes. |
| `src/components/detail/DescriptionPanel.tsx` | Shared component | Reusable `Descriptions` panel inside `DetailSection`. | Description panel layout changes. |
| `src/components/agents/AgentTaskCard.tsx` | Shared component | Agent built-in task card and grid. | Built-in task card UI changes. |

### Page domains

| Path | Type | Purpose | Change when |
| --- | --- | --- | --- |
| `src/pages/auth/LoginPage.tsx` | Page | Mock login entry. | Login screen or mock auth flow changes. |
| `src/pages/dashboard/DashboardPage.tsx` | Page | Business overview and Agent monitoring dashboard. | Dashboard metrics, tabs, or panels change. |
| `src/pages/stores/StoreListPage.tsx` | Page | Store list and store entry point. | Store table, columns, or add-store entry changes. |
| `src/pages/stores/StoreDetailPage.tsx` | Page | Add-store flow, store business overview, and store settings. | Store onboarding, detail tabs, or service connection flows change. |
| `src/pages/agents/AgentListPage.tsx` | Page | Agent center list, enabled Agents, and available Agent catalog. | Agent catalog/list UI changes. |
| `src/pages/agents/AgentConfigPage.tsx` | Page | Agent detail orchestration, stats, strategy config, task creation, active runs, and logs. | Agent detail behavior changes. |
| `src/pages/agents/AgentBuiltinTasksSection.tsx` | Page section | Agent built-in task entry points. | Built-in task card behavior changes. |
| `src/pages/agents/AgentStrategyConfigSection.tsx` | Page section | Agent strategy configuration dispatcher. | Strategy config routing changes. |
| `src/pages/agents/AgentWorkflowModals.tsx` | Page section | Coordinates Agent workflow modals. | Agent modal wiring changes. |
| `src/pages/agents/strategy-config/*` | Page sections | Strategy config sections for pricing, risk, and advanced/basic options. | Agent strategy forms change. |
| `src/pages/agents/workflow-modals/*` | Page sections | Agent-specific demo workflow modals. | Agent workflow demos change. |
| `src/pages/agents/agentConfigMockData.ts` | Page data | Large Agent detail demo datasets. | Agent detail demo content changes. |
| `src/pages/models/ModelListPage.tsx` | Page | Model center and Agent-to-model assignment. | Model assignment or custom model UI changes. |
| `src/pages/approvals/ApprovalListPage.tsx` | Page | Approval list. | Approval table or filters change. |
| `src/pages/approvals/ApprovalDetailPage.tsx` | Page | Approval detail and approve/reject actions. | Approval decision UI changes. |
| `src/pages/operations/ExceptionCenterPage.tsx` | Page | Operator exception queue. | Exception workflow or filters change. |
| `src/pages/operations/OperationsCenterPage.tsx` | Page | Business, cost, product, and efficiency analysis. | Operations analysis UI changes. |
| `src/pages/operations/exceptionCenterColumns.tsx` | Page helper | Exception center table columns. | Exception table column/action definitions change. |
| `src/pages/operations/exceptionCenterMockData.ts` | Page data | Exception center demo records. | Exception demo content changes. |
| `src/pages/orders/OrderAutomationPage.tsx` | Page | Order automation, exception handling, order detail, and timeline. | Order workflow UI changes. |
| `src/pages/billing/BillingSettingsPage.tsx` | Page | Billing page composition. | Billing page tabs/sections change. |
| `src/pages/billing/billing-sections/*` | Page sections | Subscription and usage billing sections. | Billing sub-sections change. |
| `src/pages/audit/AuditLogsPage.tsx` | Page | Audit log table. | Audit table, filters, or display changes. |
| `src/pages/settings/MembersSettingsPage.tsx` | Page | Member management. | Team/member workflows change. |
| `src/pages/settings/NotificationsSettingsPage.tsx` | Page | Notification settings. | Notification channel/preference UI changes. |
| `src/pages/guide/UsageGuideSettingsPage.tsx` | Page | Usage guide and product help. | Help content changes. |
| `src/pages/setup/SetupConfigPage.tsx` | Page | Centralized quick-setup for all agent core configs. | Quick-setup options change. |

## Component and Page Boundaries

Use this section as the default map for AI-assisted coding.

### Shared components

Cross-page UI belongs in `src/components/`.

Current shared component groups:

- `PageHeader.tsx`: page title, subtitle, and action area.
- `StatusBadge.tsx`: localized status/risk tags.
- `metrics/MetricCard.tsx`: reusable KPI cards.
- `charts/TrendBarChart.tsx`: compact bar trend chart used by dashboard, stores, models, and billing.
- `table/DataTableCard.tsx`: Ant Design table inside a card with optional toolbar and description.
- `table/TableActionGroup.tsx`: compact action button wrapper for table rows.
- `filters/PageFilterBar.tsx`: inline or card-style filter rows.
- `detail/DetailSection.tsx`: detail card wrapper.
- `detail/DescriptionPanel.tsx`: reusable `Descriptions` panel inside `DetailSection`.
- `agents/AgentTaskCard.tsx`: reusable Agent built-in task cards and grids.
- `AgentLiveConsole.tsx`: task-level simulated runtime console.
- `DashboardLiveFeed.tsx`: dashboard-level live event feed.

Guideline:

- If a UI pattern appears on two or more product domains, put it in `src/components/`.
- If a component depends heavily on one page's business rules, keep it under that page folder.
- Do not move page-specific mock datasets into `components/`.

### Page modules

Page-level code belongs in `src/pages/<domain>/`.

Current page domains:

- `agents/`: Agent list, detail, strategy config, built-in task cards, workflow modals, product draft preview.
- `stores/`: store list, add-store flow, store detail, store business overview, store settings.
- `dashboard/`: business dashboard and Agent monitoring.
- `approvals/`: approval list and detail.
- `operations/`: exception center and operations center.
- `orders/`: order automation page and order exception workflows.
- `billing/`: billing page and billing section components.
- `models/`: model center.
- `settings/`: members and notifications.
- `guide/`: usage guide.
- `setup/`: quick setup and centralized config.
- `auth/`: login page.

Guideline:

- Page folders may contain section components, modal components, column builders, and page-only mock data.
- Keep route-level page files focused on composition where practical.
- Large static page datasets should live next to the page, such as `pages/agents/agentConfigMockData.ts`.
- Repeated section patterns should graduate into `src/components/` only after they are reused across domains.

### Known large files

These files are intentionally feature-rich but are good future refactor candidates:

- `src/pages/agents/AgentConfigPage.tsx`: Agent detail orchestration, task modal, recognition flow, and task logs.
- `src/pages/orders/OrderAutomationPage.tsx`: order mock data, filters, actions, detail modal, and timeline.
- `src/components/AgentLiveConsole.tsx` and `src/components/DashboardLiveFeed.tsx`: similar live-console behavior with different scopes.

Future extraction ideas:

- `AgentTaskLogSection`
- `AgentTaskCreateModal`
- `OrderMetricsSection`
- `OrderExceptionModal`
- `OrderTimeline`
- `LiveConsoleShell` or `LiveEventStream` if a third live-feed surface is added.

## AI-Assisted Development Workflow

This project is friendly to "vibe coding" with Codex, Cursor, Claude Code, or similar AI tools, but changes should stay inside the product boundaries above.

Recommended workflow:

1. Read `product-design.md` for product scope.
2. Check `src/app/router.tsx` to find the route and page file.
3. Check `src/types/domain.ts` before inventing new frontend data shapes.
4. Check `src/api/mockData.ts`, `src/api/agentMockData.ts`, or page-local mock data before adding new mock records.
5. Reuse shared components from `src/components/` before creating a new UI pattern.
6. Add page-only components inside the relevant `src/pages/<domain>/` folder.
7. Add translations in `src/app/i18n.tsx` for all user-facing text.
8. Run `npm run build` before handing off code.

Good AI prompts for this repo:

- "Modify only `src/pages/orders/OrderAutomationPage.tsx` and reuse existing shared components."
- "Extract a page-local section component under `src/pages/agents/` without changing routes."
- "Update mock data and types consistently; do not call MuleRun directly from the frontend."
- "Use `MetricCard`, `DataTableCard`, `PageFilterBar`, and `StatusBadge` where possible."

Avoid:

- Adding a new navigation item without updating `product-design.md`, this README, and `src/app/router.tsx`.
- Calling MuleRun, Browserbase, Steel, or any Agent runtime directly from frontend code.
- Storing secrets, API keys, cookies, platform passwords, or runtime tokens in mock data.
- Creating duplicate table/card/filter components inside page folders when a shared component already exists.
- Adding raw string IDs for AllMall-owned entities; use numeric `AllMallId`.

## Documentation and Commenting Conventions

The goal is to make the codebase easy for humans and AI coding tools to navigate without turning comments into a second codebase.

### Ownership model

- Important files should name an individual responsible developer in the file header.
- Use the real owner or primary maintainer, for example `Author: Li Peng`.
- If ownership changes, add a `Maintainer:` line rather than deleting historical authorship.
- AI tools should not invent an author name. If the owner is unknown, use `Author: TBD` and ask a human to fill it in.
- Git history remains the source of truth for exact line-by-line changes; file headers record responsibility and major design intent.

### File header comments

Add a file header to important files, especially:

- Route and app infrastructure files: `router.tsx`, `AppShell.tsx`, `providers.tsx`, `theme.tsx`, `i18n.tsx`.
- Domain model files: `types/domain.ts`.
- Mock data/API entry points: `mockData.ts`, `agentMockData.ts`, `stores.ts`, `agents.ts`.
- Route-level pages and large page sections: `AgentConfigPage.tsx`, `OrderAutomationPage.tsx`, `StoreDetailPage.tsx`.
- Reusable shared components: `DataTableCard.tsx`, `MetricCard.tsx`, `AgentLiveConsole.tsx`.

Recommended file header format:

```ts
/**
 * File: AgentConfigPage.tsx
 * Purpose: Route-level Agent detail page. Composes Agent status, strategy config,
 * built-in tasks, task creation, active runs, and task logs.
 *
 * Author: <developer name>
 * Maintainer: <developer name or team area>
 * Created: YYYY-MM-DD
 *
 * Main exports:
 * - AgentConfigPage: page component for /agents/:agentType.
 *
 * Major updates:
 * - YYYY-MM-DD: Split strategy config and workflow modals into page-local modules.
 */
```

### Function comments

Use JSDoc for exported functions/components and non-trivial internal functions.

Required for:

- Exported React components.
- Exported helper functions.
- Complex data builders, state transitions, column builders, and mock API mutation helpers.
- Functions whose behavior is not obvious from their name and TypeScript signature.

Optional for:

- Small render helpers.
- Simple event handlers.
- Inline callbacks whose behavior is obvious from surrounding code.

Recommended function comment format:

```ts
/**
 * Builds visible runtime events for the task-level live console.
 *
 * @param task - Current task shown in the Agent detail page.
 * @param language - Active UI language.
 * @returns Ordered live-event list used by AgentLiveConsole.
 *
 * Author: <developer name>
 * Created: YYYY-MM-DD
 */
function buildLiveEvents(task: Task, language: 'en' | 'zh'): LiveEvent[] {
  // ...
}
```

### Change logs

- Use file-level `Major updates` only for large design or ownership changes.
- Do not record every small edit in comments; use Git commits for detailed history.
- When a refactor moves logic across files, update the affected file headers in the same commit.

### README maintenance

- When adding a directory or important file, update the `Directory and File Reference` table.
- When moving page scope or navigation, update `product-design.md`, this README, and `src/app/router.tsx` together.
- When adding a reusable component, update the shared components table and the component boundary notes.

## UX Principles

- Build an operational SaaS console, not a marketing landing page.
- Keep information dense but readable.
- Prefer tables, tabs, descriptions, progress indicators, badges, modals, and segmented controls for management workflows.
- Make status, risk level, pending approval, runtime health, quota usage, and next user action easy to scan.
- Keep Agent execution explainable through run history, evidence, approval records, and audit logs.
- Do not expose MuleRun API keys, raw secrets, or platform credentials in frontend code.

### Create Flow Pattern

Use one of three patterns for creation flows:

- Use a dedicated page for complex creation flows that involve external authorization, multiple steps, failure/retry states, or a URL worth bookmarking. Example: `/stores/new`.
- Use a modal for simple creation flows with only a few fields that belong to the current page context. Examples: adding a custom model and adding a cost item.
- Use a drawer for medium-complexity side workflows when the user should keep the current page context visible.

Dedicated creation pages must include:

- Parent navigation highlighting in the sidebar.
- A visible breadcrumb or page label showing the user is in an add/create flow.
- An in-page back/cancel action so users do not depend on the browser back button.

## Development Notes

- Current implementation is frontend-only with mock data.
- Backend API, database, auth service, and MuleRun runtime integration are still pending.
- Before adding new pages, confirm the navigation and module scope in `product-design.md`.
- Before adding API contracts, follow the root README API/data conventions.
- Before replacing mock APIs, align with the SaaS-to-Agent interface specification and future database design.
- Keep new AllMall-owned mock IDs numeric; use string fields only for external refs or display codes.
