# AllMall Portal — UX Improvement Plan (parallel workstreams)

Source: `UX-REVIEW.md` (Part 1 detail findings 1.1–6.13, Part 2 strategic items S1–S7).
Date: 2026-07-22. **Status update 2026-07-23: WS-A…WS-F and the Phase-2 integration pass have all merged to `main`** (branches `ws-a-onboarding` … `ws-f-secondary`, integration commit `4b9e878`). Resolution detail per finding lives in `UX-REVIEW.md` §"Resolution status". Remaining work: the deferred multilingual final phase (M1–M4) and the follow-ups listed at the bottom.

Six workstreams (WS-A … WS-F) were designed to run **in parallel by different agents**. Each stream owned a distinct set of files; shared files followed the coordination protocol below. Phase 0 contained product decisions that gated some streams; Phase 2 was a short integration pass after streams landed.

---

## Phase 0 — Decisions required before/while streams run (owner: product/you) — ✅ all decided, recorded in `product-design.md` §五 (commit `dfe6434`)

- [x] **D1 — DECIDED (gated WS-D):** Scenario-first configuration model (S2) confirmed: scenarios are the primary activation/config surface; per-agent config is "advanced". Scenario bundles and agent mapping implemented in `/setup`.
- [x] **D2 — DECIDED (gated WS-B):** Action Inbox IA (S1) confirmed: one unified queue at `/inbox` containing approvals + exceptions + re-login items; `/agents/approvals` and `/agents/exceptions` are filtered views.
- [x] **D3 — DECIDED (gated parts of WS-C):** Store scoping (S5) confirmed: global workspace with one persistent shell-level store filter (implemented by WS-E as StoreScope context, consumed by WS-C in Phase 2).
- [x] **D4 — DECIDED (2026-07-22): multilingual frozen.** Language switchers hidden behind `LANGUAGE_SWITCHER_ENABLED` (false) in `src/app/i18n.tsx`; UI pinned to Chinese; i18n infrastructure retained. All i18n-completion work moves to the "Final phase — multilingual completion" section below. README "Multilingual Status" section documents this.
- [x] **D5 — DECIDED:** Autonomy levels (S3) confirmed: L1 approve-everything / L2 approve-risky-only / L3 notify-only per scenario.

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

## WS-A — Onboarding & store journey — ✅ complete (merged `261b4a6`)

**Goal:** the new-merchant path runs end-to-end with no dead ends and finishes at the first approval decision.
**Owns:** `src/pages/stores/*`, `src/pages/auth/LoginPage.tsx`, `src/components/OnboardingTour.tsx`, `src/components/StoreConnectionEmptyState.tsx`, `src/app/auth.tsx`, `src/app/loginAccounts.ts`.

- [x] A1. Wizard completion creates a real store record (via `storesApi.create` / mockRepository) and flips the persona/experience flag so `/stores`, dashboard, and nav reflect the connected store (2.1).
- [x] A2. Fix `/stores/new` breadcrumb/back/cancel to `/stores` (2.4); adopted PageHeader breadcrumb prop from WS-E.
- [x] A3. Unify add-store entries: wizard is the single entry; legacy form is an "advanced" branch with domestic-platform-appropriate copy (removed `shpat_` placeholder, password fields) (6.1).
- [x] A4. Simulated failure paths per wizard stage (auth rejected, sync interrupted) with retry/recovery CTAs (2.3).
- [x] A5. Wizard progress persisted (localStorage) with resume (2.5).
- [x] A6. Migration journey fixes: target-store authorization step, dead buttons wired/removed, "批量上架" step renamed to "确认并创建草稿", blocked-state labels unified, category viewer added (2.9, 6.3).
- [x] A7. Final-step CTA emphasis swapped: primary "进入经营总览", secondary migration upsell; sync auto-starts on entering the sync step (6.13).
- [x] A8. Store revoke: dedicated confirm modal with consequences + re-authorize CTA in revoked state (2.12).
- [x] A9. **First-agent moment (S6):** after first sync, guided step recommends one low-risk read-only agent; enabling it seeds one mock run producing one pending approval, deep-linked to the first approve. Unconditional `completeOnboarding()` removed from LoginPage (2.7).

**Acceptance met:** log in as `new@allmall.cn` → finish wizard → store visible everywhere → guided to first agent → complete first approval, with failure/retry paths along the way.

## WS-B — Action Inbox, approvals & exceptions — ✅ complete (merged `b6908c6`)

**Goal:** one trustworthy "what needs me" surface with decision-grade evidence.
**Owns:** `src/pages/approvals/*`, `src/pages/operations/*`, new `src/pages/inbox/*`, `src/api/approvals.ts`, `src/api/exceptions.ts`.

- [x] B1. Unified Action Inbox page (per D2): approvals + exceptions + re-login items as one urgency/expiry-ordered queue, type filters, inline quick actions, deep links to detail (S1).
- [x] B2. Existing approval/exception routes repointed as filtered views; inbox route added to router.tsx; header bell wired to the inbox with a count badge (2.2).
- [x] B3. Approval detail: renders real `beforeValue`/`afterValue` (structured in mock data), English keyword heuristic deleted, deltas computed from data (1.1).
- [x] B4. Approval detail decision safeguards: confirm step with optional note on approve/reject, expiry countdown + timeout consequence, dual-approval progress, `taskId` links to the run/live console (1.3).
- [x] B5. Approval list: defaults to pending, status segmented control, "requested X ago / expires in Y" column with color escalation (4.5).
- [x] B6. Exception center: "去处理" is the primary first action; resolve/ignore demoted behind confirm + note; `suggestedAction` wired to its target; Popconfirm on batch ops; ignore semantics defined with helper text and actor/timestamp (4.6).
- [x] B7. Mobile-ready detail pages (S7 groundwork): approval detail self-contained and readable at 375px, back navigation via PageHeader onBack (2.11).
- [x] B8. Theme-token cleanup in owned pages: hardcoded hexes replaced with `var(--ark-panel-soft)` etc. (5.2 partial — tree-wide burn-down continues, see follow-ups).

**Acceptance met:** from a cold start, a merchant reaches every pending item from one queue, sees real before/after evidence, and cannot commit a decision without a confirm; owned pages readable in dark mode and at phone width.

## WS-C — Dashboard & daily operations — ✅ complete (merged `aeb8fb4`)

**Goal:** the dashboard answers "am I done?" in 5 seconds; operational pages support the drill-down.
**Owns:** `src/pages/dashboard/*`, `src/pages/orders/*`, `src/pages/products/*`, `src/components/DashboardLiveFeed.tsx`, `src/components/charts/TrendBarChart.tsx`, `src/api/businessDashboard.ts`.

- [x] C1. Attention surfacing consolidated: one top attention strip (linking into WS-B's inbox); duplicated AI-brief restatements, ApprovalQueue duplication, and bottom status bar repeat deleted (4.1). (`ApprovalQueue.tsx` removed in Phase 2.)
- [x] C2. Every exception-type KPI and store-table cell clickable to its action page (4.2).
- [x] C3. Honest filters: time-range and store filters apply/scope correctly with delta labels; hardcoded store-name orders map removed (4.3). Consumes the shell-level store filter (D3, wired in Phase 2).
- [x] C4. Metric diet: ≤4 top KPIs; "预计利润" labeled as an estimate with its assumption; achievements card collapsed to one line (4.4) — becomes real in S4 later.
- [x] C5. Charts: data-derived maxima, visible values/tooltip layer, GMV/orders split properly, donut segments clickable + aria labels, legacy legend class names fixed (5.4).
- [x] C6. Orders: confirm dialogs with evidence + reason for cancel-refund and fraud-release, logged to the timeline (1.2); one status-filter axis; tab counts fixed; `auto_processing` option added; duplicate auto cards merged; cancellations excluded from automation rate (4.8).
- [x] C7. Products: low-stock rollup card + stock filter; `out_of_stock` derived from stock; unified draft lifecycle (draft → pending_review → active) with stock/price confirmation at approval (4.7, 6.8).
- [x] C8. `DashboardLiveFeed.tsx` deleted (2.8).
- [x] C9. 12px text floor and horizontal scroll on the store-comparison table (5.3).

**Acceptance met:** dashboard top screen = attention strip + ≤4 KPIs + trend; every alert clickable; filters never lie; risky order actions require confirmation with evidence.

## WS-D — Scenario-first configuration & agent trust — ✅ complete (merged `9d7e26a`)

**Goal:** merchants activate goals, not 15 agents; autonomy is an explicit, earned dial.
**Owns:** `src/pages/setup/*`, `src/pages/agents/*` (list, config, strategy-config, workflow-modals), `src/api/agents.ts`, `src/api/agentMockData.ts`, `src/components/AgentLiveConsole.tsx`, `src/components/agents/*`.

- [x] D1. SetupConfigPage rebuilt as the scenario activation surface (per Phase-0 D1): scenario bundles mapping to underlying agents, one risk dial each; global-vs-per-store contradiction and setState-during-render bug fixed; explicit per-store "配置" button; context kept after save (S2, 6.9).
- [x] D2. Config hierarchy defined: scenario defaults → per-store overrides → per-agent advanced; agent strategy pages are the "advanced" layer and state their precedence (S2).
- [x] D3. Autonomy levels (per Phase-0 D5): visible L1/L2/L3 dial per scenario; mock "earned trust" suggestion; weekly digest view stub (S3). (Scenario-level mock state only — see follow-ups.)
- [x] D4. "一键启用全部" replaced with a review modal grouping agents by risk, showing approval implications, per-agent checkboxes (1.4); list-page vs detail-page enable confirmation unified via a shared pre-enable drawer (built-in tasks + cadence + risk/approval policy).
- [x] D5. Strategy config: save feedback, cross-field validation (floor ≤ ceiling, caps > 0), warning when a change loosens a guardrail (1.5).
- [x] D6. Built-in task cards wired to their workflow modal / pre-filled task creation; per-agent goal templates in the new-task modal (2.6).
- [x] D7. Agent detail tables unified: Active tasks (with cancel) + History for every agent type; `hasExclusiveCard` content branching removed (6.7).
- [x] D8. AgentLiveConsole narrates thresholds interpolated from actual `strategyConfig` (1.6).
- [x] D9. **Outcomes groundwork (S4):** mock "decisions & outcomes" section on agent detail (action → metric before → after 3/7d → assessment) defining the future data contract (`AgentOutcomeRecord`).

**Acceptance met:** a merchant can activate a scenario in ≤3 clicks understanding its risk level; no agent can be bulk-enabled without seeing what it does; guardrail fields validate; console claims match config.

## WS-E — App shell, navigation & responsive/theme foundation — ✅ complete (merged `873e240`)

**Goal:** the frame works on any screen, in both themes, with sane navigation affordances.
**Owns:** `src/app/layout/AppShell.tsx`, `src/app/providers.tsx`, `src/components/PageHeader.tsx`, `src/styles/global.css`, `src/styles/tokens.css`, `src/components/PageSkeleton.tsx`.

- [x] E1. Collapsible sidebar: `breakpoint="lg"`, `collapsedWidth={0}`, hamburger trigger; drawer nav under 768px (5.1).
- [x] E2. `breadcrumb`/`onBack` props added to PageHeader early (consumed by WS-A/WS-B) (2.11/6.6-adjacent).
- [x] E3. Identity consolidated: avatar Dropdown with user, role, logout; role Select marked as a demo "View as:" control (6.6).
- [x] E4. Sidebar groups open additively; active group auto-opens additively (6.11).
- [x] E5. ~~Drive antd `ConfigProvider` locale from the language toggle~~ — deferred to the multilingual final phase per D4 (UI pinned to zh, so `zhCN` locale is currently correct).
- [x] E6. Shell-level persistent store-scope filter (per Phase-0 D3), exposed via StoreScope context, consumed by WS-C (S5).
- [x] E7. Global dark-mode audit tooling: `scripts/check-hex.sh` published with the token usage rule; owned files fixed (5.2 systemic — tree-wide burn-down continues, see follow-ups). (CJK check script deferred to the multilingual final phase per D4.)
- [x] E8. (Stretch, per S1/S7) Cmd+K command palette stub searching stores/orders/agents/approvals (4.9).

**Acceptance met:** app usable at 375px; PageHeader breadcrumb adopted by ≥2 detail pages; store filter available in the shell.

## WS-F — Secondary surfaces — ✅ complete (merged `d2d629a`)

**Goal:** models/billing/notifications/audit/guide reach baseline quality. (i18n completion moved to the multilingual final phase per D4; WS-F still owns `i18n.tsx` as the append-only registry for other streams' new keys.)
**Owns:** `src/app/i18n.tsx` (registry stewardship only), `src/pages/models/*`, `src/pages/billing/*`, `src/pages/settings/*`, `src/pages/audit/*`, `src/pages/guide/*`, `src/components/StatusBadge.tsx`.

- [x] F1. Vocabulary normalized: single spelling of `cancelled`, dedicated task-label keys (`tasks.*`, completed in Phase 2), legend/tooltips distinguishing risk vs severity vs trigger-type tags, one term per concept (连接店铺) (6.2).
- [x] F2. Model Center for non-technical users: table headers, plain-language model descriptors + recommended default, verify-key step, cost estimates instead of raw token counts, proper "custom" badge (6.4). ("Demote behind advanced settings" flagged for product sign-off — see follow-ups.)
- [x] F3. Billing predictability: overage rate card, limit lines on all metered trends, projected month-end total, computed next bill date (6.5).
- [x] F4. Notifications: working event × channel matrix (approval needed / re-login / run failed × Feishu/DingTalk/Webhook), add-channel flow, test-send action (2.10; S7 groundwork).
- [x] F5. Audit log: System-segment count/filter mismatch fixed, all 9 categories exposed, date-range + actor filters added (6.10).
- [x] F6. Guide as companion: section anchor IDs, "learn more" links from Approval/Model/Agent surfaces, hardcoded light backgrounds fixed for dark mode (6.12, 5.2 partial).

**Acceptance met:** a merchant can predict next month's bill; notification matrix is interactive with a test send; audit filters don't lie.

---

## Phase 2 — Integration pass — ✅ complete (commit `4b9e878`)

- [x] I1. Merge review: router/product-design.md/README consistency; README navigation table and `product-design.md` updated for the inbox + scenario changes.
- [x] I2. Dark-mode hex grep across the whole tree (`scripts/check-hex.sh` from E7); real dark-mode breaks fixed, ~418 legacy non-breaking lines remain (see follow-ups).
- [x] I3. Cross-stream journey test: new-merchant end-to-end (WS-A) → inbox decisions (WS-B) → dashboard drill-downs (WS-C) → scenario activation (WS-D), at desktop and 375px, both themes (Chinese UI only, per D4).
- [x] I4. `npm run build` green; `UX-REVIEW.md` updated with resolved/remaining status per finding.

## Final phase — multilingual completion (deferred per D4; run once the core project is mostly complete)

Findings 3.1–3.5 and related. A single dedicated stream, run after the core streams and Phase 2 are done, so it sweeps a stable codebase once instead of chasing moving pages. **Not started.**

- [ ] M1. Dictionary parity: type zh as `satisfies Record<TranslationKey, string>`; reconcile zh-only/en-only keys; purge CJK from en values; write real English for keys that temporarily mirrored Chinese (3.3). Orphaned keys flagged during Phase 2: `dashboard.liveFeed*`, `dashboardv2.filterAllStores`.
- [ ] M2. Full CJK sweep: move every hardcoded Chinese string in TSX (≈40 files incl. AppShell, onboarding wizard, dashboard, billing, guide, LoginPage) into the dictionaries (3.1, 3.4); add the CJK CI check script.
- [ ] M3. Drive antd `ConfigProvider` locale from the language state (`zhCN`/`enUS`) (3.2, absorbs deferred E5); locale-aware date formatting everywhere (3.5).
- [ ] M4. QA both languages across all journeys; then flip `LANGUAGE_SWITCHER_ENABLED` to `true` and update the README "Multilingual Status" section.

**Acceptance:** EN mode contains zero Chinese outside data values; switcher visible again; CI guard prevents regressions.

## Remaining follow-ups (from `UX-REVIEW.md` resolution status)

- [ ] R1. Hardcoded-hex burn-down (5.2): `scripts/check-hex.sh` still reports ~418 legacy lines (mostly non-breaking inline colors); burn down incrementally with the script as the gate.
- [ ] R2. S3 autonomy levels are scenario-level mock state; wire them to rewrite member agents' `approvalStrategy` when backend lands.
- [ ] R3. S4 outcomes are a mock data contract (`AgentOutcomeRecord`) pending real metrics.
- [ ] R4. Product sign-off: demote Model Center behind "advanced settings" (F2 flag).
- [ ] R5. Product sign-off: rename `/setup` nav label 自动化配置 → 托管场景 (WS-D flag).
