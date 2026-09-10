# 拼多多商家账号登录 & 登录态共享 — 技术实现文档

> 版本：2026-08-31（含端到端实测验证）
> 目标：让终端用户在 SaaS 页面里，对一个由 OpenClaw 控制的远程浏览器亲手完成拼多多商家后台登录（手机号+短信验证码），登录态落盘到该店独立 profile，之后同主机任意 agent 免登录复用，直接采集商家后台数据。
>
> 本文讲 **方法②（CDP 串流）**。

---

## 0. 方法选择

采用 **方法②（CDP 串流）**：只推那一个标签页，组件最轻（只要 Chrome + CDP，不依赖 VNC/xpra），靠 Chrome 的 `--remote-debugging-port` + CDP 协议推流 + 回传输入。已端到端走通。

---

## 1. 总体架构

```
┌─────────────┐        ① POST /api/session            ┌──────────────────────────────┐
│ 后端 / SaaS  │ ───────────────────────────────────▶ │  kiosk-gateway (Node)        │
│             │   {userId, storeId, loginUrl, mode}   │  HTTPS/wss  0.0.0.0:8090      │
└─────────────┘        ② 签发 HMAC token              │  ─ TLS + HMAC token 校验      │
                       ◀─────────────────────────────  └───────────┬──────────────────┘
                              {token, shortCode}                   │
┌─────────────┐  ③ GET /login-stream?token= 或 /s/<code>          │ 起/复用 kiosk 会话
│ 终端用户浏览器 │ ────────────────────────────────────────────────┤   pdd-kiosk.sh start
│  (SaaS 页面) │                                                   │
│             │  ④ WSS /stream?token=***                          │
│             │ ◀════════════════════════════════════════════════ │
│   canvas    │   frame(base64 jpeg) / mouse / key / insertText   │
└─────────────┘                                                   ▼
                                              ┌──────────────────────────────────────┐
                                              │ Xvfb :slot  +  Chrome --app=<loginUrl>│
                                              │  --user-data-dir=profiles/store_<id> │
                                              │  --remote-debugging-port=19000+slot  │
                                              └──────────────────────────────────────┘
```

**方法②数据流**：

- 网关 → 前端：`Page.startScreencast`（jpeg, quality 90）→ `Page.screencastFrame` → base64 帧 → `<canvas>` 绘制
- 前端 → 网关：`Input.dispatchMouseEvent` / `Input.dispatchKeyEvent` / `Input.insertText` → CDP → 页面
- 登录检测：网关每 3s 用 CDP `Network.getAllCookies` 轮询鉴权 cookie

---

## 2. 登录过程详解（方法②）

### 2.1 会话签发

后端调用网关签发一个绑定 `[用户 + 店铺]` 的短时签名 token：

```bash
curl -sk -X POST https://127.0.0.1:8090/api/session \
  -H 'Content-Type: application/json' \
  -d '{"userId":"user_888","storeId":"store_2001","loginUrl":"https://mms.pinduoduo.com/login/","mode":"cdp"}'

# → {"token":"***","storeId":"store_2001","ttlMs":300000,"mode":"cdp","shortCode":"xxxx","shortPath":"/s/xxxx"}
```

- `userId` + `storeId` 必填，token 绑定 [用户+店铺]
- `mode:"cdp"` = 方法② 商家后台
- `loginUrl`：商家后台 `https://mms.pinduoduo.com/login/`；买家端 `https://mobile.yangkeduo.com/login.html`
- token 结构：`<base64url payload>.<hmac-sha256 sig>`，160 字符，默认 5 分钟 TTL（`--ttl 0` 不设过期）
- ⚠️ 转发给用户时**必须完整**，中间截断（省略号/打码）会 401；所以另发 8 位短码 `/s/<code>`

### 2.2 浏览器拉起（kiosk）

网关先 `kioskInfo(storeId)` 看该店是否已有会话：

- 已有且 CDP `19000+slot` 应答 `GET /json/version` = 200 → 复用（用户可继续上次未完成的登录）
- 陈旧 conf（进程死但注册表残留）→ `cdpAlive()` 判死 → `kioskStop` 清理 → 重起
- 无 → `pdd-kiosk.sh start <storeId> <loginUrl> cdp`

内部实际执行（`mode=cdp` 时不启 x11vnc/websockify，只要 Xvfb + Chrome）：

```
Xvfb :slot -screen 0 1280x800x24 -nolisten tcp
DISPLAY=:slot google-chrome \
  --app="https://mms.pinduoduo.com/login/" \
  --start-fullscreen --window-size=1280,800 \
  --remote-debugging-port=19000+slot --remote-allow-origins='*' \
  --user-data-dir=/root/.openclaw/browser/openclaw/profiles/store_<storeId> \
  --no-sandbox --no-first-run --disable-gpu --disable-dev-shm-usage ...
```

关键点：

- **每店独立 profile**：`--user-data-dir=.../profiles/store_<storeId>`，登录态就落在这里，是后续共享的根
- **headful**（挂 Xvfb 显示），画面靠 CDP 截屏推流，不走 VNC
- 端口规划：slot 递增 → `display=:slot`、`cdp=19000+slot`（vnc/ws 端口 cdp 模式不占用）

### 2.3 串流建立（CDP screencast + 输入回传）

前端 `serveLoginPage` 拿到 `isCdp=true` 后走 `startCdp(token, info)`：

1. `new WebSocket('wss://<host>/stream?token=***')`
2. 网关 `handleCdpStream`：
   - `Runtime.evaluate` 取视口 `{w,h,dpr}` → `{type:'viewport'}`（坐标换算基准）
   - `Page.startScreencast {format:'jpeg', quality:90, everyNthFrame:1}`
   - 收到 `Page.screencastFrame` → `{type:'frame', data}` 转发 → **必须回 `Page.screencastFrameAck`，否则不再推下一帧**
3. 前端 canvas 高清渲染（canvas 内部分辨率乘 `devicePixelRatio`）

**输入回传协议**（前端 → 网关 → CDP）：

| 前端消息 | CDP 方法 | 用途 |
|---|---|---|
| `{type:'mouse', action, x, y, button, buttons}` | `Input.dispatchMouseEvent` | 鼠标（按下/移动/松开/拖拽） |
| `{type:'key', action, key, code, windowsVirtualKeyCode}` | `Input.dispatchKeyEvent` | 控制键/组合键（Backspace/Enter/Tab/Arrow…） |
| `{type:'insertText', text}` | `Input.insertText` | 可见字符 / 中文整段（React 靠它触发 onChange） |

**中文输入**（方法②关键）：canvas 页没有任何可编辑元素，浏览器不激活输入法、`compositionend` 永不触发。解法是前端顶栏加一个真实 `<input id="ime">` 承载本地输入法：

- 焦点在 `#ime` 时按键全部留给本地输入法组词
- `keydown` 两道闸：`if (e.isComposing) return` + `if (e.target === ime) return`
- Enter → 整段 `Input.insertText` 发远端
- 远端 Xvfb **不需要装输入法**，靠本地输入法出结果文本

### 2.4 用户登录

用户打开 `https://<网关>:8090/login-stream?token=<完整token>`（或短链 `/s/<code>`），自签证书点「高级 → 继续前往」。在 canvas 里完成登录。

**商家后台账号的登录方式（实测）**：手机号 + 短信验证码，目前只遇到这一种：

1. 输入手机号 → 点「获取验证码」
2. PDD 发短信到手机 → 用户读 6 位验证码
3. 在 canvas 输入验证码（数字走顶栏 `#ime` 输入框，Enter 整段 `Input.insertText`）→ 登录成功

> ⚠️ 「选收货地址 + 选购买商品」的人机校验是**买家端新设备登录**场景（`mobile.yangkeduo.com`），商家后台账号目前未遇到。

### 2.5 登录成功检测（`checkLoggedIn`）

网关 `watchLogin` 每 3s 轮询（最长 `CDP_TIMEOUT_MS`，默认 15 分钟），**只用鉴权 cookie 作铁证**：

```js
// 通过 CDP Network.getAllCookies 拿完整 cookie（含 httpOnly，document.cookie 读不到）
const hasAuthCookie = /PASS_ID|SUB_PASS_ID|L_PASS_ID|PDDAccessToken/i.test(cookieNames);
const loggedIn = hasAuthCookie;   // 唯一铁证
```

判定规则（踩坑结论）：

- ✅ 商家：`PASS_ID`；子账号：`SUB_PASS_ID` / `L_PASS_ID`；买家：`PDDAccessToken`
- ❌ `pdd_user_id` / `api_uid` 是**访客指纹 cookie（未登录也有）**，不能作依据
- ❌ 页面文案「登录」字样会误判（登录页本身含「手机登录/扫码登录」）
- ❌ URL 跳离登录页 / 出现「退出登录」「个人中心」只是辅助信号，不能单独触发（中间的人机验证页 URL 也不含 login）

### 2.6 登录态落盘 & 关闭串流

检测到 `loggedIn` 后：

1. 先关闭串流会话：`kioskStop(storeId)`（**先停 Chrome 再打包，避免 tar 读到写入中的文件**）
2. 加密落盘 profile：

```bash
tar -czf - -C "<profile父目录>" "<profile目录名>" \
  | openssl enc -aes-256-cbc -salt -pbkdf2 -pass pass:<HMAC_SECRET> \
      -out storage/<storeId>.tar.gz.enc
```

3. 状态机流转：`created → launching → waiting_user → logged_in → capturing → captured → closed`（异常 → `timeout`）
4. 前端每 3s 轮询 `/api/status?storeId=`，看到 `logged_in/captured/closed` → 顶栏变绿「✅ 登录成功」

---

## 3. 提取到的用户信息

登录过程中/后，实际拿到的身份信息分三层：

### 3.1 登录态（鉴权 cookie，落盘在 profile 里）

| Cookie | 含义 |
|---|---|
| `PASS_ID` | 商家主账号登录态（铁证） |
| `SUB_PASS_ID` / `L_PASS_ID` | 子账号 / 员工账号登录态 |
| `PDDAccessToken` | 买家端登录态 |

SSO 凭证域（登录一次，三个后台通）：`mms.pinduoduo.com`（商家）、`live.pinduoduo.com`（直播）、`yingxiao.pinduoduo.com`（推广）。

### 3.2 身份标识（登录后采集阶段提取）

登录成功只是拿到 cookie；店铺身份信息在后续数据采集阶段从页面提取：

| 字段 | 来源 | 实测值（store_2003） |
|---|---|---|
| `store_name` 店铺名 | 商家后台顶栏 `规则中心 <店名> <账号>` | `申行百货` |
| `account_name` 账号名 | 同上 | （正则随页面改版需调整） |
| `mallId` 店铺 ID | 页面 HTML `"mallId":\d+` | `527564472`（历史，SPA 页面需 fallback） |
| 用户 ID | 登录结果 | 历史示例 `188669864` |

### 3.3 落盘产物（可复用/可迁移）

| 产物 | 位置 | 用途 |
|---|---|---|
| 活跃 profile | `/root/.openclaw/browser/openclaw/profiles/store_<storeId>` | 同主机直接复用 |
| 加密备份 | `kiosk-gateway/storage/<storeId>.tar.gz.enc` | 跨主机迁移 / 冷备 |
| 会话注册表 | `/root/.openclaw/browser/openclaw/kiosk/sessions/<storeId>.conf` | 端口/profile 索引（600 权限） |

---

## 4. 如何共享给同主机其他 Agent（已走通）

### 4.1 核心机制

> **登录态 = 浏览器 profile 目录（`--user-data-dir`）里的 cookie/session。** 谁用同一个 profile 起 Chrome，谁就带着同一份登录态。

### 4.2 复用方式：直接复用 profile 目录

登录成功后（kiosk 已自动停、profile 已释放），采集 agent 用同一 profile 起自己的浏览器：

```bash
# 用登录落盘的 profile 起采集浏览器（CDP :18800）
bash pdd-collect.sh start store_2003 headless

# 采集脚本侧：initial_full_runner.py 按 STORE_ID 解析 profile
STORE_ID=store_2003 venv/bin/python scripts/initial_full_runner.py --with-browser
```

裸命令验证：

```bash
google-chrome --headless=new --no-sandbox \
  --user-data-dir=/root/.openclaw/browser/openclaw/profiles/store_store_2001 \
  --dump-dom https://mms.pinduoduo.com/ 2>/dev/null | grep -iE "退出登录|店铺|商家"
```

### 4.3 约束

- **单 profile 单 Chrome**：Chrome 对每个 profile 有 `SingletonLock` 锁，同一时刻只能一个 Chrome 进程占用一个 profile（登录用的 kiosk Chrome 登录成功即被 `kioskStop`，profile 已释放，故可复用）。

### 4.4 采集侧 profile 参数化

采集脚本统一支持以下环境变量：

| 变量 | 作用 | 默认 |
|---|---|---|
| `STORE_ID` | 指定店，profile 解析为 `profiles/store_<storeId>` | 空（回退 user-data） |
| `PDD_PROFILE_DIR` | 直接指定 profile 绝对路径 | `.../user-data` |
| `CDP_URL` | 采集连接的 CDP 地址 | `http://127.0.0.1:18800` |

---

## 5. 端到端完整流程（时序）

```
后端            网关(kiosk-gateway)           kiosk(Xvfb+Chrome)          用户浏览器
 │  POST /api/session ───▶│                        │                        │
 │                        │  kioskStart store cdp ─▶│ 起 Xvfb+Chrome(profile) │
 │  ◀── {token,shortCode} │                        │                        │
 │                        │  watchLogin 起轮询      │                        │
 │                        │                        │         用户点 /login-stream?token
 │                        │ ◀─── WSS /stream ───────│────────────── 连上 ────┤
 │                        │   Page.startScreencast ─▶│  帧 base64 ───────────▶│ canvas 绘制
 │                        │                        │  ◀── mouse/key/insertText │ 用户操作
 │                        │                        │        （手机号+短信验证码）
 │                        │  每3s getAllCookies 轮询 │                        │
 │                        │  hasAuthCookie(PASS_ID) ─▶ 判定 logged_in          │
 │                        │  kioskStop ───────────▶│ 停 Chrome(释放 profile)  │
 │                        │  encryptProfile ───────▶│ tar.gz + AES-256 落盘    │
 │                        │  state=captured/closed  │                        │
 │                        │                        │         轮询 /api/status ┤「✅ 登录成功」
 ── 之后 ─────────────────────────────────────────────────────────────────────────
 采集 agent（同主机）
 │ 复用 store_<storeId> profile ─▶ 免登录采集 mms/live/yingxiao
```

---

## 6. 实测验证记录（2026-08-31 端到端跑通）

| 环节 | 结果 | 证据 |
|---|---|---|
| ① 方法②登录 | ✅ | 用户登录后 kiosk Chrome 落到 `mms.pinduoduo.com/home`，`PASS_ID` 已种 |
| ② 自动检测→落盘 | ✅ | 重新签发后 8s 内检测到 PASS_ID → kioskStop（19001 释放）→ 加密落盘 `store_2003.tar.gz.enc`（46.6MB） |
| ③ 复用登录态 | ✅ | `pdd-collect.sh start store_2003 headless` → :18800 → 导航 `mms/home` → `HAS_PASS_ID=true` + 商家后台 UI |
| ④ 采集真实数据 | ✅ | 导航 `goods_list` → 读出店铺名「申行百货」+ 商品块，无「重新登录」提示 |

### 验证中修复的问题

1. **登录检测窗口太短**：`CDP_TIMEOUT_MS` 原硬编码 300s（5 分钟），与 `--ttl 0` 无关。用户 13:08→13:15 登录超过 5 分钟，检测早已放弃。→ 改为可配置 `--cdp-timeout <ms>`，默认 15 分钟（900000ms）。

---

## 7. 关键实现细节 & 踩坑清单

| # | 坑 | 结论 / 解法 |
|---|---|---|
| 1 | 登录检测误判 | 未登录也发 `pdd_user_id`/`api_uid`；只用 `PASS_ID`/`PDDAccessToken` + `Network.getAllCookies` |
| 2 | React input 不响应键盘注入 | `dispatchKeyEvent` 不触发 onChange → 用 `Input.insertText` |
| 3 | CDP 是 http 协议 | `/json`、`/json/version` 走 http，不是 https |
| 4 | 截屏推帧会停 | 必须回 `Page.screencastFrameAck`；静态页只在重绘时出新帧，前端缓存最后一帧 |
| 5 | 二维码扫不上 | screencast `quality 60→90` + canvas 乘 `devicePixelRatio` |
| 6 | 中文打不出来 | canvas 无可编辑焦点 → 顶栏 `<input id="ime">` 承载本地输入法，Enter 整段 insertText |
| 7 | token 被截断 401 | 长 token 在 IM 里被打码 → 服务端发 8 位短码 `/s/<code>` |
| 8 | 登录检测窗口太短 | `CDP_TIMEOUT_MS` 可配置，默认 15 分钟（真实登录节奏常超 5 分钟） |

---

## 8. 安全边界

- 串流/CDP 端口只绑 `127.0.0.1`，公网唯一入口是网关（TLS + HMAC token，绑定 userId+storeId）
- token 短时（5min TTL）+ 签名（HMAC-SHA256），短码规避截断
- 每店独立 profile + 独立 display/端口，一会话一隔离
- profile 加密落盘（AES-256-CBC + PBKDF2，密码 = `HMAC_SECRET`）
- `.hmac-secret` 600 权限；生产应从密钥库注入
- ⚠️ 生产前必补：正式 TLS 证书、token 用后即焚、出口住宅/ISP 代理（人机校验根因）、SaaS 状态机回调

---

## 9. 文件清单 & 命令速查

| 文件 | 作用 |
|---|---|
| `kiosk-gateway/server.js` | 登录串流网关（HTTPS/wss + HMAC token + 串流 + 登录检测 + 加密落盘） |
| `pdd-kiosk.sh` | kiosk 会话管理（方法①②：多会话、独立 display/端口/profile） |
| `pdd-collect.sh` | **采集浏览器启动器（方案 A 接线）**：复用 store profile 起采集浏览器 |
| `cdp-cli.js` | 运维小工具：截图 / 注入文本 / 跑 JS / 点坐标 |
| `kiosk-gateway/storage/<storeId>.tar.gz.enc` | profile 加密备份 |
| `/root/.openclaw/browser/openclaw/profiles/store_<storeId>` | 每店活跃 profile（登录态所在） |
| `allmall-operations-api/scripts/*.py` | 采集脚本（支持 STORE_ID / CDP_URL 环境变量） |

```bash
# 起网关（独立 cgroup，勿裸 nohup）
systemd-run --unit=kiosk-gateway --collect \
  --property=WorkingDirectory=/root/.openclaw/workspace/kiosk-gateway \
  --property=StandardOutput=append:/root/.openclaw/workspace/kiosk-gateway/gateway.log \
  --property=StandardError=append:/root/.openclaw/workspace/kiosk-gateway/gateway.log \
  /usr/bin/node server.js --port 8090 --bind 0.0.0.0 --ttl 0 --cdp-timeout 900000

# 签发方法②会话（商家后台）
curl -sk -X POST https://127.0.0.1:8090/api/session \
  -H 'Content-Type: application/json' \
  -d '{"userId":"user_888","storeId":"store_2001","loginUrl":"https://mms.pinduoduo.com/login/","mode":"cdp"}'

# 用户入口（短链更稳，不会被聊天通道截断）
# https://<网关>:8090/s/<shortCode>

# 查状态 / 会话详情
curl -sk "https://127.0.0.1:8090/api/status?storeId=store_2001"
bash pdd-kiosk.sh list        # 所有 kiosk 会话
bash pdd-kiosk.sh info store_2001   # JSON：display/vnc/ws/cdp/profile

# ── 登录完成后：复用登录态采集 ──
bash pdd-collect.sh start store_2001 headless   # 起采集浏览器（复用登录 profile）
bash pdd-collect.sh profile store_2001          # 打印 profile 绝对路径
bash pdd-collect.sh status                      # 采集浏览器状态
bash pdd-collect.sh stop                        # 停止（整组回收，无残留）

# 采集脚本
STORE_ID=store_2001 venv/bin/python scripts/initial_full_runner.py --with-browser
# 或
CDP_URL=http://127.0.0.1:18800 venv/bin/python scripts/pdd_full_sync.py
```
