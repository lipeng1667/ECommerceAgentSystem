# 待办中心三合一 — 执行方案（D9）

> **给执行者**：本文档是可直接执行的施工单。所有文件路径、函数名、i18n key、验收标准都已核实过，**不要自行推测或替换**。每个节点做完必须跑完该节点的「验收」才能进入下一个节点。

---

## 零、硬性规则（违反任何一条都算本次任务失败）

1. **只移动，不删除**。本次是把两个页面的能力**搬进**收件箱，不是把它们删掉。第五节列出了必须存活的能力清单，逐条打勾。
   - 上一轮的教训：计划写的是"把 KPI 卡改成 stat-card 样式"，执行时把四张 KPI 卡整个删了。**改样式 ≠ 删功能**。
2. **所有用户可见文案必须走 i18n**，中英两套字典都要加（`src/app/i18n.tsx` 里有两个 dictionary，搜 `'inbox.title'` 能看到两处）。禁止在 tsx 里写中文字面量。本文档第六节给出了**全部需要新增的 key 和中英文案**，照抄即可，不要自己编。
3. **禁止引用不存在的 CSS 变量**。可用的 token 只有 `src/styles/tokens.css` 里定义的那些（`--ark-blue/green/orange/purple/red/teal/amber/muted/ink/panel/panel-soft/border/border-soft/on-accent`）。需要浅色底就用 `color-mix(in srgb, var(--ark-red) 8%, var(--ark-panel))` 这种写法。
   - 上一轮的教训：写了 `var(--ark-yellow, #d97706)`，该 token 不存在，于是硬编码 hex 上线且 `check-hex` 挂了。**`check-hex` 查不出"引用了不存在的变量"，只能靠你自己核对。**
4. **改动不能只落在一个文件**。本方案涉及 7 个文件，第二节列了完整清单。如果你只改了页面组件，说明依赖（路由、导航、i18n、计数）没跟上，一定会出问题。
5. **每个节点必须自测后再提交**。第七节给出了可复制粘贴的验证命令和浏览器检查脚本。**没跑过就写 commit 说"已完成"，等于交付了一个未知状态的东西。**
6. **commit message 只描述你真正做了的事**。做了一半就写一半。

---

## 一、目标（一句话）

把 `待办中心` 下的三个页面合成一个页面三个 tab：**待处理 / 处理记录 / 规则与日志**，导航只留一个入口，并修掉侧边栏徽标数字对不上的 bug。

### 现状（已核实）

| 菜单项 | 路由 | 文件 | 行数 |
|---|---|---|---|
| 行动收件箱 | `/inbox` | `src/pages/inbox/InboxPage.tsx` | 826 |
| 异常中心 | `/agents/exceptions` | `src/pages/operations/ExceptionCenterPage.tsx` | 537 |
| 审批中心 | `/agents/approvals` | `src/pages/approvals/ApprovalListPage.tsx` | 231 |

三者的**待处理数据完全重复**：收件箱里的「审批 (4)」「异常 (4)」就是另外两页的待处理列表。但另外两页各自有收件箱没有的能力（历史、批量、指派、策略、Agent 日志），**这些能力必须保住**。

### 目标结构

```
待办中心（一级菜单，直接指向 /inbox，不再有子菜单）
└── /inbox
    ├── Tab 1「待处理」   ← 现有收件箱队列 + 批量勾选 + 指派负责人
    ├── Tab 2「处理记录」 ← 异常的已处理/已忽略 + 审批的已同意/已拒绝/已过期，合成一个列表
    └── Tab 3「规则与日志」← 审批策略表（只读）+ Agent 自动处理日志
```

`/agents/exceptions` 和 `/agents/approvals` 改为重定向到 `/inbox?type=...`，两个页面组件删除（它们的能力已迁移）。审批详情页 `/agents/approvals/:approvalId` **保持不动**。

### 三个已定的决策（不要再纠结，照做）

| 编号 | 决策 | 说明 |
|---|---|---|
| D9-1 | 审批策略表放 Tab 3，**只读** | 它本质是配置，长期应该移到平台设置；本轮先原样搬过来，不做交互改造 |
| D9-2 | Agent 自动处理日志放 Tab 3 | 与审计日志的合并是下一轮的事，本轮只搬 |
| D9-3 | 批量勾选 + 指派负责人 搬进 Tab 1 | 这是异常中心最容易在迁移中丢掉的能力，必须保住 |

---

## 二、涉及文件清单（7 个，一个都不能少）

| 文件 | 改动性质 |
|---|---|
| `src/pages/inbox/InboxPage.tsx` | 主要改动：加三 tab 结构、批量、指派 |
| `src/pages/inbox/InboxHistoryTab.tsx` | **新建**：处理记录 tab |
| `src/pages/inbox/InboxRulesTab.tsx` | **新建**：规则与日志 tab |
| `src/app/router.tsx` | 两条路由改为重定向 |
| `src/app/layout/AppShell.tsx` | 菜单从分组改为单项；修徽标计数 |
| `src/app/i18n.tsx` | 新增 key（中英各一份） |
| `src/api/dashboard.ts` | 徽标计数口径修正 |

删除：`src/pages/operations/ExceptionCenterPage.tsx`、`src/pages/approvals/ApprovalListPage.tsx`（**在能力迁移完成并验收通过之后才删**）。
保留不动：`src/pages/operations/exceptionCenterColumns.tsx`、`exceptionCenterMockData.ts`、`src/api/exceptions.ts`、`src/pages/approvals/ApprovalDetailPage.tsx`。

---

## 三、节点拆分

> 每个节点一个 commit。**做完一个节点，跑完它的验收，再开始下一个。**

### 节点 1 — 徽标计数口径修正（先做，独立可验证）

**问题**：`src/app/layout/AppShell.tsx:160`

```ts
const inboxCount = pendingApprovals + exceptionPending + loginRequiredStores;  // = 4+4+1 = 9
```

但收件箱页面实际有 **18** 项（还包含订单 3、商品草稿 3、疑似重复 2 等）。每次新增待办类型都会漏算，因为这个公式是手写的加法。

**改法**：计数逻辑下沉到 API 层，页面和徽标读同一个来源。

1. 在 `src/api/dashboard.ts` 的 `getSummary()` 里，把 `inboxTotal` 算全：需要把商品侧（`newProductCandidates` / `mergeSuggestions` / `fieldConflicts` / draft listings）和订单侧（已有 `countActionableOrders()`，见 `src/api/orders.ts`）都加进来。参考 `src/api/orders.ts` 里 `countActionableOrders()` 的写法——**它就是上一轮为了修同类 bug 加的，照着做**。
2. 新增返回字段 `inboxTotal`，不要改动现有 `pendingApprovals` / `exceptionCenterPending` 字段（其他地方在用）。
3. `AppShell.tsx` 用 `dashboard?.inboxTotal ?? 0` 替换那行手写加法。

**验收**（必须实际打开浏览器验证）：
- 侧边栏「待办中心」徽标数字 == 收件箱页面「全部 (N)」里的 N。
- 在收件箱处理掉一条（比如点某个订单项的「接受推荐」），徽标数字**跟着减少**。

**commit**：`fix(inbox): count every inbox kind in the sidebar badge`

---

### 节点 2 — 导航与路由收敛

**改法**：

1. `src/app/router.tsx`（改这两行，第 123–124 行附近已有同类重定向可参照）：
   ```ts
   // 原：{ path: 'agents/exceptions', element: guarded('/agents/exceptions', <ExceptionCenterPage />) },
   { path: 'agents/exceptions', element: <Navigate to="/inbox?type=exception" replace /> },
   // 原：{ path: 'agents/approvals', element: guarded('/agents/approvals', <ApprovalListPage />) },
   { path: 'agents/approvals', element: <Navigate to="/inbox?type=approval" replace /> },
   ```
   `agents/approvals/:approvalId`（审批详情）**保持原样，不要动**。同时把 `exception-center` / `approvals` 这两条老重定向的目标也改成 `/inbox?type=...`。

2. `src/app/layout/AppShell.tsx:208-256`：把 `todo-group` 这个带 `children` 的分组，改成**单个菜单项**：
   ```ts
   { key: '/inbox', icon: <InboxOutlined />, label: (<span>{t('nav.todoCenter')}{badge}</span>) }
   ```
   即：保留 `nav.todoCenter`（"待办中心"）作为菜单名，指向 `/inbox`，去掉三个子项。
   注意同时检查该文件里的 `getSelectedMenuKey` / `getActiveMenuGroup` / 顶部的路由白名单数组（约第 84 行有 `'/orders'` 那种列表），把 `/agents/exceptions`、`/agents/approvals` 的相关条目一并清理，否则菜单高亮会错。

3. `src/app/rolePermissions.ts`：搜索 `'/agents/exceptions'` 和 `'/agents/approvals'`，这两个 key 在多个角色配置里出现。**保留它们**（详情页仍然受权限控制），只需确认 `/inbox` 在所有该有的角色里是 true。

**验收**：
- 访问 `/agents/exceptions` → 自动跳到 `/inbox?type=exception`，且收件箱落在「异常」筛选。
- 访问 `/agents/approvals` → 跳到 `/inbox?type=approval`。
- 访问 `/agents/approvals/5004` → 仍然打开审批详情页（**不能被重定向吃掉**）。
- 侧边栏「待办中心」是单个可点项，没有展开箭头；点击后当前项高亮。

**commit**：`refactor(inbox): fold exception/approval centres into a single nav entry`

---

### 节点 3 — 收件箱三 tab 骨架 + 待处理 tab 补齐批量与指派

**改法**：

1. `InboxPage.tsx` 外层加 antd `<Tabs>`，三个 tab：
   ```
   key='pending'  label={t('inbox.tabPending')}   → 现有的全部内容（Segmented 筛选 + List）
   key='history'  label={t('inbox.tabHistory')}   → <InboxHistoryTab />
   key='rules'    label={t('inbox.tabRules')}     → <InboxRulesTab />
   ```
   - **现有的 `?type=` 参数行为必须保持**：`/inbox?type=approval` 仍然落在「待处理」tab 且 Segmented 选中「审批」。tab 状态用另一个参数，比如 `?tab=history`，不要和 `type` 混用。
   - 顶部的「一键接受推荐 (N)」按钮只在「待处理」tab 显示。

2. **把异常中心的批量能力搬进「待处理」tab**（对应 D9-3）：
   - 现有的 `<List>` 每项前面加 checkbox（antd `Checkbox`），维护 `selectedKeys` state。
   - 只有 `kind === 'exception'` 的条目可勾选（`exceptionsApi.batchResolve` / `batchIgnore` 只接受异常 id）。其他类型的 checkbox 置灰 + `title` 提示。
   - 选中后在列表上方出现操作条：`已选 N 项` + 「批量完成」+「批量忽略」+「取消选择」。
   - 调用现成的 API：`exceptionsApi.batchResolve(ids)` / `exceptionsApi.batchIgnore(ids)`（见 `src/api/exceptions.ts:78/97`，**已经存在，不要重写**）。
   - 成功后 `queryClient.invalidateQueries({ queryKey: ['exceptions'] })` 和 `['dashboard']`。

3. **指派负责人**：异常条目的快捷操作里增加「指派」按钮，弹 `Modal` + `Select`，选项用 `ASSIGNEE_OPTIONS`（`exceptionCenterMockData.ts:44`），调 `exceptionsApi.assign(id, assignee)`（`src/api/exceptions.ts:69`）。已指派的在条目上显示负责人名字。

**验收**：
- 三个 tab 可切换，URL 带 `?tab=`，刷新后停在同一 tab。
- `/inbox?type=approval` 仍然落在「待处理」且筛选为审批。
- 勾选两条异常 → 点「批量完成」→ 两条从列表消失，徽标数字减 2。
- 非异常条目的 checkbox 不可勾选。
- 指派一条异常 → 条目上出现负责人名字，刷新后仍在。

**commit**：`feat(inbox): three-tab layout, batch resolve/ignore and assignee`

---

### 节点 4 — 「处理记录」tab

**新建** `src/pages/inbox/InboxHistoryTab.tsx`。

**数据来源**（两类合并成一个列表）：

| 来源 | 取哪些 | 时间字段 | 处理人字段 | 结果 |
|---|---|---|---|---|
| `exceptionsApi.list()` | `resolved === true` 或 `ignored === true` | `resolvedAt` / `ignoredAt` | `resolvedBy` / `ignoredBy` | 已完成 / 已忽略 |
| `approvalsApi.list()` | `status !== 'pending'` | `decidedAt` | `decidedBy` | 已同意 / 已拒绝 / 已过期 |

**表格列**：`处理时间 | 类型（异常/审批 Tag）| 事项标题 | 归属店铺 | 结果（Tag）| 处理人 | 备注 | 操作(查看)`

- 默认按处理时间倒序。
- 筛选：类型（全部/异常/审批）、结果、时间范围。用 `PageFilterBar` + `DataTableCard`（**复用现成共享组件，不要自己写表格**，参考 `src/pages/orders/OrderAutomationPage.tsx` 的用法）。
- 备注取 `resolutionNote` / `ignoreNote` / `decisionNote`。
- 「查看」：审批 → `/agents/approvals/:id`；异常 → 打开详情弹窗（可复用异常中心原有的详情 Modal 代码，把它一起搬过来）。
- 空状态用 `EmptyState` 组件。
- 「已忽略」的异常保留「恢复」操作（`exceptionsApi.unignore`，`src/api/exceptions.ts:57`）——这是原异常中心的能力，别丢。

**验收**：
- 列表里同时能看到异常和审批的历史记录（当前 mock 至少有 1 条 resolved 异常和 1 条 approved 审批）。
- 按类型筛选能正确过滤。
- 点审批记录的「查看」跳到审批详情页。
- 已忽略的异常能「恢复」，恢复后它回到「待处理」tab 且徽标 +1。

**commit**：`feat(inbox): history tab merging exception and approval records`

---

### 节点 5 — 「规则与日志」tab

**新建** `src/pages/inbox/InboxRulesTab.tsx`。

内容是两块，上下排列：

1. **审批策略**（从 `ApprovalListPage.tsx:120-200` 整块搬过来）
   - 数据：`agentsApi.list()` + `approvalPolicyApi.list()`，按 `riskLevel` 关联。
   - 三列：Agent / 风险等级 / 审批规则 / 说明（原来是 4 列，照搬）。
   - 原来是可折叠卡片，搬过来后**默认展开**（它已经是独立 tab 了，不需要再折叠）。
   - 只读，不加编辑功能（D9-1）。
   - 上方加一句说明 + 指向 `/setup` 的链接：策略在场景配置里调整。

2. **Agent 自动处理日志**（从 `ExceptionCenterPage.tsx` 的第二个 tab 搬过来）
   - 数据 `agentLogData`（`exceptionCenterMockData.ts:100`），列定义直接用现成的 `createAgentLogColumns(t)`（`exceptionCenterColumns.tsx:168`）。
   - 用 `DataTableCard` 包一层，加标题「Agent 自动处理日志」。

**验收**：
- 审批策略表有数据（每个 Agent 一行，带风险等级和审批档位）。
- Agent 日志表有数据（mock 里有 11 条）。
- 两块都不报错、不空白。

**commit**：`feat(inbox): rules tab with approval policy and agent log`

---

### 节点 6 — 删除旧页面 + 文档

**前置条件：节点 3/4/5 的验收全部通过**（第五节的能力清单全部打勾）。

1. 删除 `src/pages/operations/ExceptionCenterPage.tsx`、`src/pages/approvals/ApprovalListPage.tsx`。
2. 清理它们在 `router.tsx` 里的 import。
3. 检查是否还有别处引用这两个组件：`grep -rn "ExceptionCenterPage\|ApprovalListPage" src/`，结果应为空。
4. 文档：
   - `product-design.md`：新增决策 **D9 — 待办中心三合一**，写清并入关系、三 tab 职责、保留的重定向；并更新 §二 的模块表里「异常中心」「审批中心」两行（改为"已并入行动收件箱"）。
   - `README.md`：更新「Implemented Navigation」路由表（两行改为 redirect），以及页面域说明里 `operations/` 和 `approvals/` 的描述。

**commit**：`refactor(inbox): remove merged pages; docs: record D9`

---

## 四、i18n key 清单（照抄，不要自己编）

`src/app/i18n.tsx` 有两个 dictionary（英文在前，中文在后），**每个 key 都要加两遍**。

| key | 英文 | 中文 |
|---|---|---|
| `inbox.tabPending` | `To handle` | `待处理` |
| `inbox.tabHistory` | `History` | `处理记录` |
| `inbox.tabRules` | `Rules & logs` | `规则与日志` |
| `inbox.selectedCount` | `{count} selected` | `已选 {count} 项` |
| `inbox.batchResolve` | `Resolve selected` | `批量完成` |
| `inbox.batchIgnore` | `Ignore selected` | `批量忽略` |
| `inbox.clearSelection` | `Clear selection` | `取消选择` |
| `inbox.onlyExceptionsSelectable` | `Only exception items support bulk actions` | `仅异常事项支持批量处理` |
| `inbox.assign` | `Assign` | `指派` |
| `inbox.assignTitle` | `Assign an owner` | `指派负责人` |
| `inbox.assignedTo` | `Owner: {name}` | `负责人：{name}` |
| `inbox.assignSuccess` | `Assigned` | `已指派` |
| `inbox.batchResolveDone` | `{count} item(s) resolved` | `已完成 {count} 项` |
| `inbox.batchIgnoreDone` | `{count} item(s) ignored` | `已忽略 {count} 项` |
| `inbox.historyTime` | `Handled at` | `处理时间` |
| `inbox.historyKind` | `Type` | `类型` |
| `inbox.historyItem` | `Item` | `事项` |
| `inbox.historyResult` | `Result` | `结果` |
| `inbox.historyActor` | `Handled by` | `处理人` |
| `inbox.historyNote` | `Note` | `备注` |
| `inbox.historyResult_resolved` | `Resolved` | `已完成` |
| `inbox.historyResult_ignored` | `Ignored` | `已忽略` |
| `inbox.historyResult_approved` | `Approved` | `已同意` |
| `inbox.historyResult_rejected` | `Rejected` | `已拒绝` |
| `inbox.historyResult_expired` | `Expired` | `已过期` |
| `inbox.historyFilterKind` | `All types` | `全部类型` |
| `inbox.historyFilterResult` | `All results` | `全部结果` |
| `inbox.historyEmpty` | `Nothing has been handled yet.` | `还没有处理记录。` |
| `inbox.restore` | `Restore` | `恢复` |
| `inbox.restored` | `Restored to the queue` | `已恢复到待处理` |
| `inbox.rulesPolicyTitle` | `Approval policy` | `审批策略` |
| `inbox.rulesPolicyHint` | `How each risk level is approved. Adjust it in scenario setup.` | `不同风险等级的审批方式。可在场景配置中调整。` |
| `inbox.rulesPolicyLink` | `Go to scenario setup` | `前往场景配置` |
| `inbox.rulesAgentLogTitle` | `Agent auto-handling log` | `Agent 自动处理日志` |

已有可复用的 key（**不要重复造**）：`inbox.title` `inbox.description` `inbox.empty` `inbox.emptyFiltered` `inbox.viewDetail` `inbox.goHandle` `common.confirm` `common.cancel` `common.view` `common.close` `nav.todoCenter` `exc.*`（异常相关文案）`approvals.*`（审批相关文案）`approval.policyTitle` `approval.rule` `approval.explain`。

---

## 五、能力存活清单（迁移完成前逐条打勾）

这些是两个旧页面**现在就有**的能力。删除旧页面之前，每一条都必须在新收件箱里能找到。

**来自异常中心**
- [ ] 待处理 / 已处理 / 已忽略 / 全部 四种状态都能看到
- [ ] 按 Agent 类型筛选异常
- [ ] 单条「完成」，可填备注
- [ ] 单条「忽略」，可填备注
- [ ] 已忽略的可以「恢复」
- [ ] 勾选多条 → 批量完成 / 批量忽略
- [ ] 指派负责人
- [ ] 异常详情弹窗（含 detail / suggestedAction 字段）
- [ ] 「前往」深链（`linkTo` 字段，跳到对应 Agent 或业务页）
- [ ] Agent 自动处理日志表

**来自审批中心**
- [ ] 待处理 / 已同意 / 已拒绝 / 已过期 / 全部 五种状态
- [ ] 按 Agent 类型筛选审批
- [ ] 到期倒计时显示（`getApprovalUrgency`，`src/pages/inbox/urgency.ts`）
- [ ] 点标题进审批详情页
- [ ] 审批策略表（Agent / 风险等级 / 审批规则 / 说明）

---

## 六、禁止事项

- ❌ 不要在 tsx 里写中文字面量
- ❌ 不要新造 CSS 变量名，也不要写 hex 色值
- ❌ 不要重写已有的 API 方法（`exceptionsApi.batchResolve` 等都已存在）
- ❌ 不要自己实现表格/筛选栏/空状态，用 `DataTableCard` / `PageFilterBar` / `EmptyState`
- ❌ 不要在节点 3/4/5 验收通过前删除旧页面文件
- ❌ 不要动 `ApprovalDetailPage.tsx` 和 `/agents/approvals/:approvalId` 路由
- ❌ 不要改 `exceptionCenterMockData.ts` 里的数据内容（迁移不是改数据）

---

## 七、验证（每个节点都要跑）

### 命令行（三条都必须通过）

```bash
npx tsc --noEmit
npm run build
scripts/check-hex.sh src/pages/inbox src/app
```

`check-hex` 必须输出 `clean`。如果报出 hex，说明你写了硬编码色值。

### 浏览器（必须实际打开看，不能只看代码）

开发服务器：`npm run dev`（注意实际端口，可能不是 5173）。用 `merchant@allmall.cn` / `demo123` 登录。

关键检查点（在浏览器控制台跑，别只用肉眼）：

```js
// 1. 徽标与页面计数是否一致
JSON.stringify({
  sidebar: [...document.querySelectorAll('.ant-menu-item')].find(m => m.innerText.includes('待办中心'))?.innerText,
  pageTotal: [...document.querySelectorAll('.ant-segmented-item-label')].map(x => x.innerText)[0]
})

// 2. 三个 tab 是否都渲染出内容（切到每个 tab 各跑一次）
JSON.stringify({
  activeTab: document.querySelector('.ant-tabs-tab-active')?.innerText,
  rows: document.querySelectorAll('.ant-table-row').length,
  listItems: document.querySelectorAll('.ant-list-item').length,
  empty: !!document.querySelector('.ant-empty')
})

// 3. 操作按钮是否在视口内（上一轮真实事故：按钮被挤到 x=1294，视口只有 1280）
[...document.querySelectorAll('.ant-table-row')].slice(0,1).map(r => {
  const cell = r.cells[r.cells.length-1];
  return { right: Math.round(cell.getBoundingClientRect().right), viewport: innerWidth };
})
```

### 每个节点提交前自问

1. 我改的文件数量和第二节的清单对得上吗？
2. 第五节的能力清单，这个节点涉及的项都打勾了吗？
3. 三条命令行检查都跑了吗？输出是什么？
4. 浏览器里我**实际点过**这些新功能吗？
5. commit message 里写的，和我真正做完的一致吗？

---

## 八、上一轮的真实事故（照着避坑）

上一次执行订单页方案时发生的问题，按严重程度排列：

1. **按钮点不到**：加了新列后操作列被挤出 1280px 视口，核心功能不可用。→ **加列必须量一下表格总宽**，必要时用 `fixed: 'right'` 或砍列。
2. **假按钮**：「立即同步」只调了 `invalidateQueries`，重读同一份内存数据，点了没有任何反应。→ **每个新按钮都要点一次，确认界面有变化。**
3. **演示数据里看不见新功能**：SLA 阈值是 6 小时，但 mock 里所有订单都是 24-48 小时后到期，新做的倒计时列 7 行全是「—」。→ **新功能要配套造能触发它的 mock 数据。**
4. **默认行为静默失效**：`useEffect(..., [])` 在数据加载完成前跑，判断永远为假。→ **依赖异步数据的 effect，依赖数组要写对。**
5. **改样式改成了删功能**：KPI 卡整排消失。
6. **commit 说做了 O4，实际只做了十分之一。**

---

## 九、交付

全部节点完成后，回复里请包含：

1. 每个节点的 commit hash 和一句话说明
2. 第五节能力清单的完整打勾状态（没做到的**如实说明**，不要假装做了）
3. 三条命令行检查的实际输出
4. 至少三张截图：待处理 tab、处理记录 tab、规则与日志 tab
5. 你**没有**做的部分、以及你觉得方案里有问题的地方（这比假装全做完有价值）
