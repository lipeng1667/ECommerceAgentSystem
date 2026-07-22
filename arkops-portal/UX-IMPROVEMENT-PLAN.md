# AllMall Portal — UX Improvement Plan (parallel workstreams)

Source: `UX-REVIEW.md` (Part 1 detail findings 1.1–6.13, Part 2 strategic items S1–S7).
Date: 2026-07-22.

Six workstreams (WS-A … WS-F) are designed to run **in parallel by different agents**. Each stream owns a distinct set of files; shared files follow the coordination protocol below. Phase 0 contains product decisions that gate some streams; Phase 2 is a short integration pass after streams land.

---

## Phase 0 — Decisions required before/while streams run (owner: product/you)

- [ ] **D1 (gates WS-D):** Confirm scenario-first configuration model (S2): scenarios are the primary activation/config surface; per-agent config becomes "advanced". Define the 4–6 scenario bundles and which of the 15 agents map into each.
- [ ] **D2 (gates WS-B):** Confirm the Action Inbox IA (S1): one unified queue at `/inbox` (or repurposed Action Center) containing approvals + exceptions + re-login items; `/agents/approvals` and `/agents/exceptions` become filtered views.
- [ ] **D3 (gates parts of WS-C):** Store scoping decision (S5): global workspace with one persistent shell-level store filter. If confirmed, the store filter moves out of DashboardPage into the shell (implemented by WS-E, consumed by WS-C).
- [x] **D4 — DECIDED (2026-07-22): multilingual frozen.** Language switchers hidden behind `LANGUAGE_SWITCHER_ENABLED` (false) in `src/app/i18n.tsx`; UI pinned to Chinese; i18n infrastructure retained. All i18n-completion work moves to the "Final phase — multilingual completion" section below. README "Multilingual Status" section documents this.
- [ ] **D5:** Autonomy levels naming/tiers (S3): confirm L1 approve-everything / L2 approve-risky-only / L3 notify-only per scenario.

Update `product-design.md` with D1–D3 outcomes before the affected streams start (repo rule: product-design.md → README → router).

---

## Shared-file coordination protocol (all agents must follow)

| Shared file | Owner | Rule for other streams |
| --- | --- | --- |
| `src/app/i18n.tsx` | WS-F | Others **append only**, keys namespaced per stream (e.g. `inbox.*`, `onboarding.*`, `scenario.*`). No edits to existing keys. Per D4: zh values required, en values may temporarily mirror zh. Do not touch `LANGUAGE_SWITCHER_ENABLED`. |
| `src/app/router.tsx` | WS-B (adds inbox route) | Others touch only their own route lines; no reordering. |
| `src/app/layout/AppShell.tsx` | WS-E | WS-B may wire the bell → inbox link only; all other shell edits go through WS-E. |
| `src/types/domain.ts` | append-only for all | New types appended with a stream-tag comment; no changes to existing fields. |
| `src/components/PageHeader.tsx` | WS-E (adds breadcrumb/onBack prop) | Land early; WS-A/WS-B consume the new prop. |
| `src/api/mockData.ts`, `mockRepository.ts` | append-only for all | New mock records/APIs appended; mutations via mockRepository helpers. |

Every stream: all new user-facing strings go through `t()` with i18n keys (zh required; en may mirror zh per D4); run `npm run build` before handoff; do not add navigation items without a matching `product-design.md` update.

---

## WS-A — Onboarding & store journey (findings 2.1, 2.3, 2.4, 2.5, 2.9, 2.12, 6.1, 6.3, 6.13; strategic S6)

**Goal:** the new-merchant path runs end-to-end with no dead ends and finishes at the first approval decision.
**Owns:** `src/pages/stores/*`, `src/pages/auth/LoginPage.tsx`, `src/components/OnboardingTour.tsx`, `src/components/StoreConnectionEmptyState.tsx`, `src/app/auth.tsx`, `src/app/loginAccounts.ts`.

- [ ] A1. Wizard completion creates a real store record (via `storesApi.create` / mockRepository) and flips the persona/experience flag so `/stores`, dashboard, and nav reflect the connected store (2.1).
- [ ] A2. Fix `/stores/new` breadcrumb/back/cancel to `/stores` (2.4); adopt PageHeader breadcrumb prop once WS-E lands it.
- [ ] A3. Unify add-store entries: wizard becomes the single entry; legacy form becomes an "advanced" branch with domestic-platform-appropriate copy (remove `shpat_` placeholder, password fields) (6.1).
- [ ] A4. Add at least one simulated failure path per wizard stage (auth rejected, sync interrupted) with retry/recovery CTAs (2.3).
- [ ] A5. Persist wizard progress (localStorage) with resume, or add a leave-confirmation and remove the "后台继续执行/稍后继续" claims (2.5).
- [ ] A6. Migration journey fixes: target-store authorization step, wire or remove dead buttons ("查看开店指引", "查看全部"), rename "批量上架" step to "确认并创建草稿", unify blocked-state labels, add category picker or viewer (2.9, 6.3).
- [ ] A7. Swap final-step CTA emphasis: primary "进入经营总览", secondary migration upsell; auto-start sync on entering the sync step (6.13).
- [ ] A8. Store revoke: dedicated confirm modal with consequences + re-authorize CTA in revoked state (2.12).
- [ ] A9. **First-agent moment (S6):** after first sync, guided step recommending one low-risk read-only agent; enabling it seeds one mock run that produces one pending approval, deep-linked so the merchant completes their first approve. Remove the unconditional `completeOnboarding()` in LoginPage and repurpose or delete OnboardingTour (2.7).

**Acceptance:** log in as `new@allmall.cn` → finish wizard → store visible everywhere → guided to first agent → complete first approval, with at least one demonstrable failure/retry path along the way.

## WS-B — Action Inbox, approvals & exceptions (findings 1.1, 1.3, 2.2, 2.11, 4.5, 4.6; strategic S1, parts of S7)

**Goal:** one trustworthy "what needs me" surface with decision-grade evidence.
**Owns:** `src/pages/approvals/*`, `src/pages/operations/*`, new `src/pages/inbox/*`, `src/api/approvals.ts`, `src/api/exceptions.ts`.

- [ ] B1. Build the unified Action Inbox page (per D2): approvals + exceptions + re-login items as one urgency/expiry-ordered queue, type filters, inline quick actions, deep links to detail (S1).
- [ ] B2. Repoint existing approval/exception routes as filtered views; add the inbox route to router.tsx; wire the header bell to the inbox with a count badge (2.2 — coordinate one-line AppShell change with WS-E).
- [ ] B3. Approval detail: render real `beforeValue`/`afterValue` (structure them in mock data), delete the English keyword heuristic, compute deltas from data (1.1).
- [ ] B4. Approval detail decision safeguards: confirm step with optional note on approve/reject, expiry countdown + timeout consequence, dual-approval progress when policy requires it, `taskId` as a link to the run/live console (1.3).
- [ ] B5. Approval list: default to pending, status segmented control, "requested X ago / expires in Y" column with color escalation (4.5).
- [ ] B6. Exception center: "去处理" becomes the primary first action; resolve/ignore demoted behind confirm + note; wire `suggestedAction` to its target; Popconfirm on batch ops; define ignore semantics with helper text and actor/timestamp (4.6).
- [ ] B7. Mobile-ready detail pages (S7 groundwork): approval detail self-contained and readable at 375px, back navigation via PageHeader onBack (2.11).
- [ ] B8. Theme-token cleanup in owned pages: replace hardcoded hexes with `var(--ark-panel-soft)` etc. (5.2 partial).

**Acceptance:** from a cold start, a merchant reaches every pending item from one queue, sees真实 before/after evidence, and cannot commit a decision without a confirm; all owned pages readable in dark mode and at phone width.

## WS-C — Dashboard & daily operations (findings 4.1–4.4, 4.7, 4.8, 5.3, 5.4, 1.2, 2.8; strategic S4 groundwork)

**Goal:** the dashboard answers "am I done?" in 5 seconds; operational pages support the drill-down.
**Owns:** `src/pages/dashboard/*`, `src/pages/orders/*`, `src/pages/products/*`, `src/components/DashboardLiveFeed.tsx`, `src/components/charts/TrendBarChart.tsx`, `src/api/businessDashboard.ts`.

- [ ] C1. Consolidate attention surfacing: one top attention strip (linking into WS-B's inbox); delete the duplicated AI-brief restatements, ApprovalQueue duplication, and bottom status bar repeat (4.1).
- [ ] C2. Make every exception-type KPI and store-table cell clickable to its action page (4.2).
- [ ] C3. Honest filters: time-range and store filters either apply to every section (delta labels per range) or are visually scoped to what they control; remove the hardcoded store-name orders map (4.3). Consume the shell-level store filter if D3 lands in time.
- [ ] C4. Metric diet: ≤4 top KPIs; label "预计利润" as an estimate with its assumption or remove; collapse achievements card to one line (4.4) — becomes real in S4 later.
- [ ] C5. Charts: data-derived maxima, visible values/tooltip layer, split or dual-axis GMV/orders properly, donut segments clickable + aria labels, fix legacy legend class names (5.4).
- [ ] C6. Orders: confirm dialogs with evidence + reason for cancel-refund and fraud-release, logged to the timeline (1.2); collapse to one status-filter axis; fix tab counts; add `auto_processing` option; merge duplicate auto cards; exclude cancellations from automation rate (4.8).
- [ ] C7. Products: low-stock rollup card + stock filter; derive `out_of_stock` from stock; unify draft lifecycle (draft → pending_review → active) with stock/price confirmation at approval (4.7, 6.8).
- [ ] C8. Delete `DashboardLiveFeed.tsx` or rebuild as a real deduplicated event log (2.8).
- [ ] C9. 12px text floor and horizontal scroll on the store-comparison table (5.3).

**Acceptance:** dashboard top screen = attention strip + ≤4 KPIs + trend; every alert clickable; filters never lie; risky order actions require confirmation with evidence.

## WS-D — Scenario-first configuration & agent trust (findings 1.4, 1.5, 1.6, 2.6, 6.7, 6.9; strategic S2, S3, S4)

**Goal:** merchants activate goals, not 15 agents; autonomy is an explicit, earned dial.
**Owns:** `src/pages/setup/*`, `src/pages/agents/*` (list, config, strategy-config, workflow-modals), `src/api/agents.ts`, `src/api/agentMockData.ts`, `src/components/AgentLiveConsole.tsx`, `src/components/agents/*`.

- [ ] D1. Rebuild SetupConfigPage as the scenario activation surface (per Phase-0 D1): 4–6 scenario bundles mapping to underlying agents, one risk dial each; fix the global-vs-per-store contradiction and the setState-during-render bug; explicit per-store "配置" button; keep context after save (S2, 6.9).
- [ ] D2. Define the config hierarchy: scenario defaults → per-store overrides → per-agent advanced; agent strategy pages become the "advanced" layer and state their precedence (S2).
- [ ] D3. Autonomy levels (per Phase-0 D5): visible L1/L2/L3 dial per scenario; mock "earned trust" suggestion (e.g., after N approved runs, prompt to loosen); weekly digest view stub (S3).
- [ ] D4. Replace "一键启用全部" with a review modal grouping agents by risk, showing approval implications, per-agent checkboxes (1.4); unify list-page vs detail-page enable confirmation via a shared pre-enable drawer (built-in tasks + cadence + risk/approval policy) (findings 1.4, and list/detail inconsistency).
- [ ] D5. Strategy config: explicit Save/Reset or debounced "Saved ✓", cross-field validation (floor ≤ ceiling, caps > 0), warning when a change loosens a guardrail (1.5).
- [ ] D6. Wire built-in task cards to their workflow modal or pre-filled task creation; add per-agent goal templates to the new-task modal (2.6).
- [ ] D7. Unify agent detail tables: Active tasks (with cancel) + History for every agent type; remove `hasExclusiveCard` content branching (6.7).
- [ ] D8. AgentLiveConsole narrates thresholds interpolated from actual `strategyConfig`, not hardcoded copy (1.6).
- [ ] D9. **Outcomes groundwork (S4):** add a mock "decisions & outcomes" section to agent detail (action → metric before → after 3/7d → assessment) defining the future data contract.

**Acceptance:** a merchant can activate a scenario in ≤3 clicks understanding its risk level; no agent can be bulk-enabled without seeing what it does; guardrail fields validate; console claims match config.

## WS-E — App shell, navigation & responsive/theme foundation (findings 5.1, 6.6, 6.11, 2.11 (component), 3.2 partial; strategic S5 implementation)

**Goal:** the frame works on any screen, in both themes, with sane navigation affordances.
**Owns:** `src/app/layout/AppShell.tsx`, `src/app/providers.tsx`, `src/components/PageHeader.tsx`, `src/styles/global.css`, `src/styles/tokens.css`, `src/components/PageSkeleton.tsx`.

- [ ] E1. Collapsible sidebar: `breakpoint="lg"`, `collapsedWidth={0}`, hamburger trigger; drawer nav under 768px (5.1).
- [ ] E2. Add `breadcrumb`/`onBack` props to PageHeader early (other streams consume it) (2.11/6.6-adjacent).
- [ ] E3. Consolidate identity: avatar Dropdown with user, role, logout; mark the role Select as a demo "View as:" control or move it into the demo banner (6.6).
- [ ] E4. Sidebar accordion: allow multiple open groups; auto-open the active group additively (6.11).
- [x] E5. ~~Drive antd `ConfigProvider` locale from the language toggle~~ — deferred to the multilingual final phase per D4 (UI pinned to zh, so `zhCN` locale is currently correct).
- [ ] E6. Shell-level persistent store-scope filter (per Phase-0 D3), exposed via context for WS-C to consume (S5).
- [ ] E7. Global dark-mode audit tooling: grep for hex backgrounds outside tokens.css, fix any in owned files, and publish the token usage rule (5.2 systemic). (CJK check script deferred to the multilingual final phase per D4.)
- [ ] E8. (Stretch, per S1/S7) Cmd+K command palette stub searching stores/orders/agents/approvals (4.9).

**Acceptance:** app usable at 375px; PageHeader breadcrumb adopted by ≥2 detail pages; antd chrome follows language; store filter available in the shell.

## WS-F — Secondary surfaces (findings 6.4, 6.5, 6.10, 6.12, 2.10, 6.2)

**Goal:** models/billing/notifications/audit/guide reach baseline quality. (i18n completion moved to the multilingual final phase per D4; WS-F still owns `i18n.tsx` as the append-only registry for other streams' new keys.)
**Owns:** `src/app/i18n.tsx` (registry stewardship only), `src/pages/models/*`, `src/pages/billing/*`, `src/pages/settings/*`, `src/pages/audit/*`, `src/pages/guide/*`, `src/components/StatusBadge.tsx`.

- [ ] F1. Vocabulary normalization: single spelling of `cancelled`, dedicated task-label keys (stop reusing `stores.*`), legend/tooltips distinguishing risk vs severity vs trigger-type tags, one term per concept (添加/连接/导入店铺) (6.2).
- [ ] F2. Model Center for non-technical users: table headers, plain-language model descriptors + recommended default, verify-key step, cost estimates instead of raw token counts, proper "custom" badge (6.4). Consider demoting Model Center behind an "advanced" settings position (strategic S-adjacent) — flag for product sign-off.
- [ ] F3. Billing predictability: overage rate card, limit lines on all metered trends, projected month-end total, computed (not hardcoded) next bill date (6.5).
- [ ] F4. Notifications: working event × channel matrix (approval needed / re-login / run failed × Feishu/DingTalk/Webhook), add-channel flow, test-send action (2.10; S7 groundwork).
- [ ] F5. Audit log: fix System-segment count/filter mismatch, expose all 9 categories, add date-range + actor filters (6.10).
- [ ] F6. Guide as companion: section anchor IDs, "learn more" links from Approval/Model/Agent surfaces, fix hardcoded light backgrounds for dark mode (6.12, 5.2 partial).

**Acceptance:** a merchant can predict next month's bill; notification matrix is interactive with a test send; audit filters don't lie.

---

## Phase 2 — Integration pass (single agent, after streams land)

- [ ] I1. Merge review: router/product-design.md/README consistency; update the README navigation table and `product-design.md` for the inbox + scenario changes (repo rule).
- [ ] I2. Dark-mode hex grep across the whole tree (tool from E7).
- [ ] I3. Cross-stream journey test: new-merchant end-to-end (WS-A) → inbox decisions (WS-B) → dashboard drill-downs (WS-C) → scenario activation (WS-D), at desktop and 375px, both themes (Chinese UI only, per D4).
- [ ] I4. `npm run build` + fix chunk/type regressions; update `UX-REVIEW.md` findings with resolved/remaining status.

## Final phase — multilingual completion (deferred per D4; run once the core project is mostly complete)

Findings 3.1–3.5 and related. A single dedicated stream, run after the core streams and Phase 2 are done, so it sweeps a stable codebase once instead of chasing moving pages.

- [ ] M1. Dictionary parity: type zh as `satisfies Record<TranslationKey, string>`; reconcile zh-only/en-only keys; purge CJK from en values; write real English for keys that temporarily mirrored Chinese (3.3).
- [ ] M2. Full CJK sweep: move every hardcoded Chinese string in TSX (≈40 files incl. AppShell, onboarding wizard, dashboard, billing, guide, LoginPage) into the dictionaries (3.1, 3.4); add the CJK CI check script.
- [ ] M3. Drive antd `ConfigProvider` locale from the language state (`zhCN`/`enUS`) (3.2); locale-aware date formatting everywhere (3.5).
- [ ] M4. QA both languages across all journeys; then flip `LANGUAGE_SWITCHER_ENABLED` to `true` and update the README "Multilingual Status" section.

**Acceptance:** EN mode contains zero Chinese outside data values; switcher visible again; CI guard prevents regressions.

## Dependency summary

- **Start immediately:** WS-A (except A9 fine-tuning), WS-C, WS-E, WS-F.
- **Needs Phase-0 decision first:** WS-B (D2), WS-D (D1, D5), E6 (D3).
- **Land early because others consume it:** E2 (PageHeader breadcrumb), E6 (store filter context).
- **Run last:** Phase 2 integration, then the deferred multilingual final phase (M1–M4).
- **Known contested files:** `AppShell.tsx` (WS-E owns; WS-B one-line bell wiring), `i18n.tsx` (append-only), `router.tsx` (WS-B adds inbox; others own-lines-only).
