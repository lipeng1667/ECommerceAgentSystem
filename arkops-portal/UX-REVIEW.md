# AllMall Portal — UX Review

Date: 2026-07-22
Scope: full frontend walkthrough of `arkops-portal/` (mock-data MVP) across four areas: onboarding & stores, daily operations, agents & approvals, and app shell & secondary surfaces.

**TLDR:** The information architecture, trust-building copy, and navigation order are genuinely good. The biggest UX risks are (1) trust-critical screens showing wrong or fabricated data, (2) journeys that end in dead ends or dead controls, and (3) an English mode that is half Chinese.

---

## Priority themes

### Theme 1 — Trust integrity (highest priority)

The product's promise is "AI acts, humans approve." These findings directly undermine it:

| # | Severity | Finding | Location |
| --- | --- | --- | --- |
| 1.1 | High | Approval detail fabricates before/after evidence: built by English keyword-matching on the title, renders hardcoded values (¥5,000→¥8,000) instead of the real `beforeValue`/`afterValue` fields on the Approval type. Chinese titles never match, so zh users get no comparison at all. | `src/pages/approvals/ApprovalDetailPage.tsx:35-77` |
| 1.2 | High | Order "取消并退款" (cancel+refund) and fraud "放行" (release) execute instantly from small table buttons — no confirmation, no reason capture — while mere product deletion gets a Popconfirm. | `src/pages/orders/OrderAutomationPage.tsx:352,359` |
| 1.3 | High | Approve/Reject on approvals is single-click: no confirmation step, no comment/reject-reason field, no expiry countdown (despite `timeoutHours`/`timeoutAction` existing), no dual-approval progress UI, `taskId` shown as plain text instead of a link to the run. | `src/pages/approvals/ApprovalDetailPage.tsx` |
| 1.4 | High | "一键启用全部" bulk-enables every disabled agent — including high-risk pricing/ads — behind a Popconfirm showing only a count, not which agents or their risk/approval implications. | `src/pages/agents/AgentListPage.tsx:107-141,404-416` |
| 1.5 | Medium | Strategy config auto-saves high-stakes parameters silently: no success feedback, no validation (`floorPrice` can exceed `ceilingPrice`, `dailyCap` can be 0), mode switches silently reset sub-fields. | `src/pages/agents/strategy-config/sharedUtils.ts`, `PricingRuleSection.tsx` |
| 1.6 | Low | Live console narrates hardcoded policy thresholds ("5%以内变动自动通过") not read from the agent's actual `strategyConfig` — if the merchant tightens a threshold, the console still narrates the old one. | `src/components/AgentLiveConsole.tsx` |

**Fixes:** always render real `beforeValue`/`afterValue` and delete the keyword heuristic; add confirm dialogs showing evidence + reason capture for refund/fraud/approve/reject; replace bulk-enable with a review modal grouped by risk with per-agent checkboxes; explicit Save/Reset (or debounced "Saved ✓") with cross-field validation on strategy config; interpolate real configured thresholds into console copy.

### Theme 2 — Dead ends and dead controls

| # | Severity | Finding | Location |
| --- | --- | --- | --- |
| 2.1 | High | Wizard completion produces nothing: after finishing the import wizard ("拼多多旗舰店已准备就绪, 1,236 商品"), `/stores` still shows "你还没有连接任何店铺" — the wizard never creates a store record or flips `user.experience`. The first success is denied by the very next screen. | `src/pages/stores/StoreOnboardingPage.tsx`, `StoreListPage.tsx` |
| 2.2 | High | Header notification bell has no `onClick`, no badge, no popover — despite `pendingApprovals`/`exceptionCenterPending` already being fetched every 30s. | `src/app/layout/AppShell.tsx:269` |
| 2.3 | High | No error/failure/retry states anywhere in onboarding: `connectStore` always succeeds; no designed state for auth rejected, session expired mid-sync, or partial failure — even though the welcome screen advertises "支持断点续传". | `src/pages/stores/StoreOnboardingPage.tsx` |
| 2.4 | High | `/stores/new` breadcrumb, back button, AND cancel all navigate to `/setup` (automation config) instead of `/stores`. | `src/pages/stores/StoreDetailPage.tsx:119,127,284` |
| 2.5 | Medium | "稍后继续 / 任务会在后台继续执行" is false: wizard state is component-local; leaving resets to step 0 with no confirmation and no resume. | `src/pages/stores/StoreOnboardingPage.tsx` |
| 2.6 | Medium | Built-in task cards on every agent detail page have hover/clickable styling (`onClick` exists on the type) but are never wired — purely decorative. Task creation is a separate generic modal with no templates. | `src/pages/agents/AgentBuiltinTasksSection.tsx`, `src/components/agents/AgentTaskCard.tsx` |
| 2.7 | Medium | `OnboardingTour` never shows: login unconditionally calls `completeOnboarding()`. The tour is also the only fully i18n'd onboarding surface. | `src/components/OnboardingTour.tsx`, `src/pages/auth/LoginPage.tsx:45` |
| 2.8 | Medium | `DashboardLiveFeed` is imported nowhere (dead component); as designed it replays fake templated events on a 1.2s infinite loop with fresh timestamps. Delete or rebuild as a real deduplicated event log. | `src/components/DashboardLiveFeed.tsx` |
| 2.9 | Medium | Dead buttons in onboarding: "查看开店指引" and "查看全部 1,108 个商品" have no handlers; migrate journey's Continue is always enabled and never authorizes the target store it claims to write drafts into. | `src/pages/stores/StoreOnboardingPage.tsx` |
| 2.10 | Medium | Notification settings are inert on the product's most critical channel: per-channel `Switch` has `checked` but no `onChange`, "Add channel" has no handler, events are a comma-joined string. No test-notification button. | `src/pages/settings/NotificationsSettingsPage.tsx` |
| 2.11 | Medium | Approval detail (3 levels deep, reachable from audit-log deep links) has zero back affordance; `PageHeader` has no breadcrumb/onBack slot. Only StoreDetailPage rolls its own breadcrumb. | `src/components/PageHeader.tsx`, `ApprovalDetailPage.tsx` |
| 2.12 | Medium | Store revoke uses `t('common.confirmDelete')` ("确认删除?") — wrong verb, no consequence explanation, and once revoked there is no re-authorize CTA. | `src/pages/stores/StoreDetailPage.tsx:422-426` |

### Theme 3 — English mode isn't English

| # | Severity | Finding | Location |
| --- | --- | --- | --- |
| 3.1 | High | Hardcoded Chinese throughout (~40 TSX files): AppShell tenant label/logout tooltip/demo tag, entire onboarding wizard, billing tab labels, the whole usage guide, dashboard AI brief + to-dos + Segmented options, empty-state descriptions in agents/approvals/exceptions. | `AppShell.tsx`, `StoreOnboardingPage.tsx`, `BillingSettingsPage.tsx`, `UsageGuideSettingsPage.tsx`, `DashboardPage.tsx:385-403,458-476,554-576`, others |
| 3.2 | High | Ant Design locale pinned to `zhCN` regardless of the language toggle — pagination, empty states, Popconfirm defaults stay Chinese in EN mode. | `src/app/providers.tsx` |
| 3.3 | Medium | Dictionary drift: 9 zh-only keys render as raw keys (`dashboard.colStore`) for English users; 5 en-only keys leak English into zh mode; 6 en values contain CJK. | `src/app/i18n.tsx` |
| 3.4 | Medium | LoginPage shows an EN/中文 toggle but every string on the page is hardcoded Chinese. | `src/pages/auth/LoginPage.tsx` |
| 3.5 | Low | Dates forced to `'zh-CN'` locale in agent config; console mixes languages ("bound 拼多多 browser profile"). | `AgentConfigPage.tsx`, `AgentLiveConsole.tsx` |

**Fixes:** drive antd locale from the toggle (`language === 'zh' ? zhCN : enUS`); type both dictionaries with `satisfies Record<TranslationKey, string>` for compile-time parity; add a CI grep for CJK in TSX outside `i18n.tsx`; either finish i18n or hide the EN toggle until real.

### Theme 4 — "What needs my attention" is buried, then repeated

| # | Severity | Finding | Location |
| --- | --- | --- | --- |
| 4.1 | High | Dashboard renders 10+ stacked sections; the same urgent alerts (re-login, approvals) appear four times (AI brief, 今日待办, ApprovalQueue, bottom status bar) while the actionable list sits third. Promote one consolidated attention strip to the top; delete duplicates. | `src/pages/dashboard/DashboardPage.tsx` |
| 4.2 | High | KPI cards are not clickable: "差评待回复 3" and "低库存 SKU 5" don't link anywhere; store comparison table cells likewise. | `DashboardPage.tsx:429-453` |
| 4.3 | High | Store/time-range filters silently don't apply to most dashboard sections: 7d mode still shows "较昨日" deltas; ROI, reviews, inventory, to-dos, donut, quota all ignore both filters; store orders come from a hardcoded name-keyed map. | `DashboardPage.tsx:350-354` |
| 4.4 | High | Metric overload: ~20 numbers, mixed granularity; "预计利润" is literally `GMV * 0.21` presented as a metric. Keep ≤4 top KPIs; label estimates as estimates. | `DashboardPage.tsx:434` |
| 4.5 | Medium | Approval list: pending and decided mixed, no status filter, no pending-first sort, no age/deadline column despite timeout policies. Merchants can't answer "what needs me right now". | `src/pages/approvals/ApprovalListPage.tsx` |
| 4.6 | Medium | Exception center: "Resolve"/"Ignore" come before the deep-link "去处理" and look identical; one click marks resolved with no note; batch ops have no confirmation; `suggestedAction` is passive text with no CTA. "Ignore" semantics are undefined. | `src/pages/operations/exceptionCenterColumns.tsx:110-143`, `ExceptionCenterPage.tsx` |
| 4.7 | Medium | Dashboard's low-stock link lands on a products page with no low-stock rollup card, filter, or sort; data inconsistency (stock 35 but `out_of_stock`; stock 0 but `inactive`). | `src/pages/products/ProductManagementPage.tsx` |
| 4.8 | Medium | Orders: three overlapping status filter systems (tabs + status Select + badges) can produce silent empty tables; "全部订单" tab count changes with filters while reading as a total; `auto_processing` missing from the Select; duplicate auto-count and auto-rate cards; cancelled orders inflate the automation-rate metric. | `src/pages/orders/OrderAutomationPage.tsx:233` |
| 4.9 | Medium | No global search / command palette — with an order ID or store name in hand, a merchant must guess the right nav section. | `src/app/layout/AppShell.tsx` |

### Theme 5 — Responsive and dark-mode gaps

| # | Severity | Finding | Location |
| --- | --- | --- | --- |
| 5.1 | High | Sidebar never collapses: `<Sider width={248}>` with no `breakpoint`/`collapsible`; media queries never touch `.app-sider`. On a 375px phone the nav permanently consumes ~2/3 of the viewport. | `AppShell.tsx`, `src/styles/global.css` |
| 5.2 | High | Dark theme breaks on trust-critical surfaces: hardcoded light hexes (`#fef2f2`, `#f0fdf4`, `#f0f5ff`, gradients) render light-on-light text in approval detail, exception center, and the usage guide. The token system (`--ark-panel-soft`) exists but is bypassed. | `ApprovalDetailPage.tsx`, `ExceptionCenterPage.tsx`, `UsageGuideSettingsPage.tsx` |
| 5.3 | Medium | Pervasive 10–11px text; dashboard store-comparison table has ~730px fixed columns with no `scroll={{ x }}`. Establish a 12px floor; define a mobile KPI priority. | `DashboardPage.tsx`, `global.css` |
| 5.4 | Medium | Charts: dual-axis bars with hardcoded maxima (35000 / 500) so heights aren't comparable and clip on real data; values hover-only (no touch); donut is non-interactive with no aria; legend CSS classes still named `legend-runs`/`legend-approvals` for GMV/orders. | `src/components/charts/TrendBarChart.tsx`, `DashboardPage.tsx:208-227` |

### Theme 6 — Consistency and comprehension

| # | Severity | Finding | Location |
| --- | --- | --- | --- |
| 6.1 | High | Two parallel add-store flows: friendly wizard vs. legacy `/stores/new` form asking for a Shopify-format API key (`shpat_...`) and raw account/password — wrong and alarming for 拼多多/淘宝/京东 merchants. Make the wizard the single entry; fold manual/API into an "advanced" branch. | `StoreListPage.tsx`, `StoreDetailPage.tsx` |
| 6.2 | Medium | Vocabulary drift: both `canceled` and `cancelled` in the status color map; task columns reuse `stores.*` i18n keys; three near-identical red/orange tag vocabularies (risk, exception severity, task-trigger type) with no legend; 添加/连接/导入/同步店铺 used interchangeably; approval routes inconsistent (`/approvals/:id` vs `/agents/approvals`). | `src/components/StatusBadge.tsx` and consumers |
| 6.3 | Medium | Migration wizard contradictions: final step titled "批量上架" while content promises "仅创建草稿"; `blocked` state called both "需要处理" and "暂不支持迁移"; "按分类选择" offers no category picker; "平台拒绝 (2%)" result has no explanation or remediation. | `StoreOnboardingPage.tsx` |
| 6.4 | Medium | Model Center assumes a technical user: headerless binding table (rows of unlabeled Selects), no plain-language model guidance or recommended default, no API-key verification step, cryptic "T" token prefix, custom models marked only by hardcoded "（自有）". | `src/pages/models/ModelListPage.tsx` |
| 6.5 | Medium | Billing is retrospective, not predictable: no overage unit rates, usage-% only covers `agentCalls`, no limit lines on trend charts, `nextBillDate` hardcoded to `2026-07-01` (already past). Add a rate card and projected month-end total. | `src/pages/billing/billing-sections/*` |
| 6.6 | Medium | Header role Select is an unlabeled trapdoor: silently removes sidebar items, any user can self-promote to Owner, indistinguishable from a real control. Avatar isn't clickable; logout is icon-only with a Chinese-only tooltip. Mark as demo ("View as:") and consolidate identity/role/logout into an avatar Dropdown. | `AppShell.tsx:270-283` |
| 6.7 | Medium | Agent detail table semantics differ per agent via `hasExclusiveCard` branching: active tasks and history merge into one "logs" table with no cancel action for running tasks. Unify to Active (with cancel) + History for all agents. | `AgentConfigPage.tsx:200-203,441-452` |
| 6.8 | Medium | Product draft lifecycle is inconsistent: a `draft` can be Approved (skipping review) but not Rejected; approving silently sets `stock: 100`. Unify draft → pending_review → active; require stock/price confirmation at approval. | `ProductManagementPage.tsx:155` |
| 6.9 | Medium | SetupConfigPage scope contradiction: labeled "全局适用" but stored per-store (writes under key `''` when no store selected — also a setState-during-render anti-pattern); config UI hidden behind unmarked clickable rows below the fold; page silently collapses after save. | `src/pages/setup/SetupConfigPage.tsx:84-89` |
| 6.10 | Low | Audit log: "System" segment count merges `system_event + store_session` but the filter matches only `system_event` (counts lie); 9 categories, only 5 filterable; no date-range or actor filter. | `src/pages/audit/AuditLogsPage.tsx:83` |
| 6.11 | Low | Sidebar accordion force-closes other groups on navigation (`openKeys` overwritten by effect). Allow multiple open groups; auto-open additively. | `AppShell.tsx:114-118,233-236` |
| 6.12 | Low | Help is a destination, not a companion: the genuinely useful guide has no section anchors and nothing links to it at the moment of need (no "?" tooltips on task labels, no concept links from Approval/Model Center). | `UsageGuideSettingsPage.tsx` |
| 6.13 | Low | Onboarding flow polish: sync step idle at 0% under a heading claiming "正在智能同步" and needs a below-fold manual click (auto-start it); import completion pushes the migration upsell as primary CTA over "进入经营总览" (swap emphasis). | `StoreOnboardingPage.tsx` |

---

## What's already strong — keep and build on these

- Sidebar IA order matches the merchant mental model (Overview → Stores → Products → Orders → Action Center → Agent Center → Settings); disciplined badge design (parent sums, child splits); adaptive nav for onboarding personas; legacy-route redirects.
- Persona-routed first run: new merchants land directly in the import wizard; ~7 clicks from login to "data synced"; task-framed journey choice.
- Trust engineering copy: "只读访问", drafts-not-publish, read/write asymmetry explained, recommended defaults.
- The 今日待办 priority list pattern (severity-tagged, count + arrow, correct deep links) — should become the dashboard centerpiece.
- Order detail timeline with human-action appends; fraud evidence lists (rules hit 3/5) — exactly right for approve/reject decisions.
- Agent list layer color-coding, dependency warnings, flow diagram, risk-control "guarded" badge; approval policy reference table; `BaseWorkflowModal` standardization across 28 modals.
- Theme architecture is sound at the base (CSS tokens with dark variants synced to antd `darkAlgorithm`) — breakages are per-component hardcoding, not systemic.
- Audit CSV export with UTF-8 BOM, deep links, cross-field keyword search.

## Suggested fix order

1. **Trust fixes** (1.1–1.4): approval evidence from real data, confirmations on refund/fraud/approve/reject, bulk-enable review modal. Small diffs, highest stakes.
2. **Onboarding dead end** (2.1): wizard creates a store + flips the persona flag — this is the demo's money path. Plus 2.4 (misdirected /stores/new nav).
3. **Attention flow** (4.1–4.5): top attention strip, clickable KPIs, honest filters, pending-first approvals.
4. **EN mode** (theme 3): finish or hide.
5. **Shell** (2.2, 5.1, 5.2, 2.11): notification bell, collapsible sidebar, dark-mode token audit, breadcrumbs.
6. **Consistency backlog** (theme 6) as ongoing cleanup alongside feature work.

---

## Part 2 — Strategic review: overall flow and information architecture

Date: 2026-07-22. This section looks past individual screens at whether the journeys and IA match the product's actual job.

## What is already logical

- The sidebar order (Overview → Stores → Products → Orders → Action Center → Agent Center → Settings) follows a merchant's mental model: daily operations first, configuration last.
- The two-persona split (new vs. established merchant) with a dedicated import wizard is the right first-run design, and clicks-to-first-value is low.
- The trust-building copy strategy (read-only first, drafts-not-publish, explicit approval gates) is the correct narrative arc for an AI-agent product.

## S1 — The IA is a management console, but the product's job is a supervision loop

The navigation is organized by *entity* (stores, products, orders, agents) like a traditional ERP. But the merchant's actual daily job in this product is a *loop*: agents act → some actions need a human → the human decides → agents continue. The surfaces serving that loop — approvals, exceptions, re-login requests — are fragmented across three pages plus four duplicated dashboard renderings, none of which is the clear "start here."

**Direction:** make a unified **Action Inbox** the spine of the product — one queue containing approvals, exceptions, and re-login requests as typed items, ordered by urgency/expiry, with approve/resolve inline and deep links for detail. Approvals and Exception Center become filtered views of it. The dashboard stops trying to be an inbox and becomes a clean overview. The header bell, sidebar badge, and IM notifications all point at this one place. Success metric: a merchant who opens the app knows within 5 seconds whether they are "done for now."

## S2 — 15 agents is an engineering decomposition; merchants think in goals

The Agent Center asks merchants to understand, enable, and individually configure 15 agent types, including their inter-dependencies. A merchant's mental model is goals: "keep my ads profitable," "handle customer messages," "don't run out of stock." The Quick Setup page's "scenario" concept (托管场景/全托管) is actually the right model — but it now *competes* with per-agent strategy config as a second configuration surface with unclear precedence, and the two are inconsistently scoped (global vs. per-store).

**Direction:** commit to scenarios/goals as the *primary* activation and configuration model — e.g., 4–6 packages (advertising hosting, customer service hosting, pricing guard, stock guard) that bundle the underlying agents, with one risk-level dial per scenario. The per-agent view remains as the "advanced" layer for power users. One configuration hierarchy with explicit precedence: scenario defaults → per-store overrides → per-agent advanced settings. This also resolves the current Quick Setup/Agent Center overlap.

## S3 — The trust-growth journey has no mechanism

The product's premise is that merchants start supervising everything and gradually grant autonomy. But nothing in the flow *carries* that progression: approval thresholds are static config knobs buried in strategy forms; there is no notion of an agent "earning" trust, no prompt like "定价 Agent 最近 30 次调价全部获批准 — 要将 5% 以内的调价改为自动通过吗?", and no periodic digest ("this week agents handled 152 actions autonomously; here are the 6 you decided"). Without this, the merchant either stays stuck approving everything (fatigue → churn) or blindly enables autonomy (fear → churn).

**Direction:** introduce an explicit **autonomy level** per scenario (e.g., L1 approve everything / L2 approve risky only / L3 notify only), shown as a simple visible dial; drive "loosen the reins" suggestions from approval history; add a weekly digest view. This is the retention engine of the product and deserves first-class UI, not scattered thresholds.

## S4 — Actions have no outcomes: the value loop never closes

Approvals show before/after at decision time, and a dashboard card claims "hours saved / revenue uplift" — but nothing connects an agent's action to what happened afterward. A merchant who approved a price change never finds out what it did to sales; the claimed savings are unfalsifiable vanity numbers. This matters commercially: billing asks merchants to keep paying, and the only honest justification is visible outcomes.

**Direction:** a "decisions & outcomes" surface (could live on the agent detail page and in the weekly digest): each significant action → metric before → metric after 3/7 days → agent's own assessment. Even mocked, this defines the data contract the backend will need, and it converts the achievements card from marketing into evidence.

## S5 — Store scoping is undecided: global workspace or store-first?

Today the answer differs per page: the dashboard has a store filter that mostly doesn't apply; Quick Setup half-stores config per store while labeling it global; agents are enabled globally; store detail duplicates a mini-dashboard. Multi-store operation is the core target scenario, so this ambiguity compounds everywhere.

**Direction:** decide once — the natural fit for this product is **global workspace with a persistent, honest store filter** (agents work across stores; the merchant supervises the whole business). That means: one global store-scope control in the shell (not per-page), every list/metric respecting it, and store detail reduced to store-specific settings + authorization health rather than a duplicate dashboard.

## S6 — The bridge from onboarding to the daily loop is missing: no designed "first agent" moment

The import wizard ends by upselling cross-platform migration, then drops the merchant on a dashboard with zero agents running — an empty supervision loop. The aha moment of this product is *watching an agent do real work and approving its first action*, and no flow leads there.

**Direction:** after first sync completes, a guided step: "根据你的店铺数据，建议先开启 [评价管理 Agent]（只读，低风险）" → agent runs on the just-imported data → produces its first approval request → the merchant experiences the approve flow with training wheels. Onboarding should end at the first approval decision, not at data import. (The Login Guide Agent and imported reviews/orders make this demoable today with mock data.)

## S7 — The daily loop cannot be portal-only

Approvals expire in hours; Chinese merchants live in WeChat/Feishu/DingTalk, not in a browser tab. The architecture docs promise multi-channel approval, but the portal treats notifications as a dead settings page, which makes the whole approval SLA story incoherent: the product demands timely human decisions while providing no channel to request them.

**Direction:** treat IM-channel approval cards as the *primary* decision surface (before/after values + approve/reject inline) and the portal as the deep-dive/audit surface. In the frontend MVP this means: a working notification-routing settings page (event × channel matrix, test send), and approval detail pages designed to be deep-linked from IM (mobile-friendly, self-contained context — which also motivates fixing the missing back-navigation and sidebar collapse).

## Target journey (reference)

- **Day 0:** login → import store (wizard) → data synced → guided first agent (read-only) → first approval decision → notification channel connected.
- **Days 1–7:** IM pings → open Action Inbox → decide 3–5 items/day → check dashboard overview occasionally.
- **Weeks 2–4:** weekly digest shows outcomes → accept "raise autonomy" suggestions scenario by scenario → daily decisions shrink to exceptions only.
- **Steady state:** merchant supervises by digest + exceptions; portal visits are mostly for outcomes review and expansion (new stores/scenarios).

## Strategic priority

1. **S1 Action Inbox** — restructures existing pages; highest leverage on daily usability.
2. **S6 first-agent moment** — completes the onboarding arc; biggest demo/conversion impact.
3. **S2 scenario-first configuration** — resolves the Setup/Agent Center conflict before more agents are added.
4. **S3 autonomy levels + S4 outcomes** — the retention loop; design the data contracts now, even with mocks.
5. **S5 store scoping decision** — cheap to decide now, expensive to retrofit later.
6. **S7 IM-first approvals** — frontend can only mock it, but the approval detail page and notification settings should be built for it.
