# 用户登录串流 PoC — 三方案验证文档

> 目标:让终端用户在 SaaS 页面里，对一个 **由 OpenClaw 控制的远程浏览器** 亲手完成电商平台登录（含人机校验 / 滑块 / 扫码 / 短信设备验证），登录成功后会话留在该浏览器的 profile 里，交给 Agent 托管后续运营操作。
>
> 本文档目的：给出 3 个"只推这个浏览器"的实现方案，后端同学各自试跑，判定哪个能跑通，作为产品版的起点。
>
> **本轮先不管出口 IP（住宅代理）问题**，只验证"登录流程 + 会话落盘"能不能通。⚠️ 但见文末【出口 IP 备注】，PoC 阶段就要记一笔。

---

## 0. 结论 / 选型建议

| 方案 | 推什么 | 改动量 | 定位 |
|---|---|---|---|
| **① kiosk Chrome + noVNC** | 桌面缩到只剩浏览器 | 最小（复用现有 noVNC） | **今天先跑通登录流程** |
| **② CDP 截屏流 + 输入回传** | 只推那一个标签页 | 中（写一个薄中继） | **产品目标形态** |
| **③ xpra（应用级串流）** | 只推 Chrome 窗口 | 中 | 需要真实 headful 又想轻 |

**建议路径**：先用 ① 今天把"用户登录 → 会话落盘"整条链路验证通；产品版切 ②。③ 作为 ① 的更干净替代备选。

---

## 1. 前置 & 名词

- **OpenClaw**：跑在 VPS 上的浏览器自动化 runtime（下文泛指"驱动浏览器的那套程序"）。
- **profile / user-data-dir**：浏览器的持久化用户目录（cookie、localStorage、登录态都在这）。**每店一个，持久化保存。**
- **串流**：把远程浏览器的画面推到用户的浏览器里，并把用户的鼠标键盘操作回传。
- **CDP**：Chrome DevTools Protocol，Chromium 的远程控制协议（Playwright/Puppeteer 底层就是它）。
- **storageState**：Playwright/Puppeteer 导出的会话快照（cookies + localStorage），用于免登录复用。

前置条件（三方案通用）：
- 一台能跑 Chromium 的 Linux VPS（当前腾讯云那台即可，仅作**算力/串流主机**用）。
- 已安装 `google-chrome` 或 `chromium`。
- 方案 ①③ 需要虚拟显示 `Xvfb`；方案 ② 不需要显示，headless/headful 都行。

---

## 2. 通用流程（不管哪个方案，骨架一样）

```
SaaS「连接店铺 / 重新登录」
   │ 1. 后端签发短时、一次性、绑定[当前用户+目标店铺]的 token
   ▼
前端 iframe/弹窗  src = https://你的网关/login-stream?token=...
   │ 2. 网关校验 token → OpenClaw 起/复用该店 profile 的浏览器 → 打开平台登录页
   │ 3. 把该浏览器画面推给用户（①/②/③ 三选一）
   ▼
用户亲手操作：过滑块/人机校验 → 扫码 或 手机号+验证码 → 登录成功
   │ 4. OpenClaw 检测登录成功
   │ 5. 落盘 storageState（加密），标记 store.status = connected
   ▼
关闭串流会话；之后 Agent 用这个 profile 免登录跑运营操作
```

**会话状态机（后端实现参考）**：
```
created → launching → waiting_user → (challenge_detected) → logged_in → captured → closed
                                   └→ failed / timeout
```

---

## 3. 方案① — kiosk Chrome + 现有 noVNC（最快）

**原理**：你们现在 noVNC 推的是整个桌面。只要让那个 X 桌面上**只有 Chrome、全屏无边框**，推出来的就"只是浏览器"。改动最小。

### 步骤

```bash
# 1. 虚拟显示（可能已有）
Xvfb :1 -screen 0 1280x800x24 &

# 2. Chrome 以 app 模式起，窗口即浏览器，无地址栏无标签栏
DISPLAY=:1 google-chrome \
  --app=https://login.taobao.com \
  --start-fullscreen --window-size=1280,800 \
  --user-data-dir=/profiles/store_1001    # 每店独立、持久化

# 3. noVNC / websockify 指向 :1（你们现在已有这一步）
#    → 用户在框里看到的就只有这个浏览器
```

### 加固（PoC 也建议做）
- noVNC 端口**绑 localhost**，前面套你网关的 **token 校验 + TLS（wss）**，不要像现在这样公网裸 6080。
- 一个会话一个 `:display`（`:1 / :2 / ...`），会话之间隔离。
- VNC 密码换强随机、一次性。

### 优缺点
- ✅ 改动最小，复用现有 noVNC，今天能出结果。
- ❌ 仍是 VNC 传输（较重）；一个会话起一个 X server，横向扩展成本高；本质是"桌面恰好只有浏览器"。

### 验证点
- kiosk Chrome 起来后，noVNC 里是否**只有浏览器、能正常鼠标键盘操作**？
- 能否在框里**手动完成一次真实登录**（滑块/扫码任意）？

---

## 4. 方案② — CDP 截屏流 + 输入回传（产品级）

**原理**：Browserbase/Steel 的 "live view" 底层原理。OpenClaw 用 CDP 驱动 Chromium，写一个薄中继：把标签页的截屏帧推给前端 canvas，把前端的鼠标键盘事件回放进浏览器。**只推那一个标签页**，不涉及桌面。

### 后端中继（Node + Playwright/Puppeteer，示意 ~50 行）

```js
// 推流：浏览器 → 前端
const cdp = await context.newCDPSession(page);
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 60, everyNthFrame: 1 });
cdp.on('Page.screencastFrame', async ({ data, sessionId }) => {
  ws.send(JSON.stringify({ type: 'frame', data }));          // data = base64 JPEG
  await cdp.send('Page.screencastFrameAck', { sessionId });  // 必须 ack，否则不再推下一帧
});

// 回传输入：前端 → 浏览器
ws.on('message', (raw) => {
  const e = JSON.parse(raw);
  if (e.type === 'mouse') {
    cdp.send('Input.dispatchMouseEvent', {
      type: e.action,          // mousePressed / mouseReleased / mouseMoved
      x: e.x, y: e.y, button: 'left', clickCount: 1,
    });
  } else if (e.type === 'key') {
    cdp.send('Input.dispatchKeyEvent', {
      type: e.action,          // keyDown / keyUp / char
      text: e.text, key: e.key, code: e.code,
    });
  }
});
```

### 前端（canvas + 输入采集，示意）

```html
<canvas id="screen" width="1280" height="800"></canvas>
<script>
  const ws = new WebSocket('wss://你的网关/stream?token=...');
  const ctx = document.getElementById('screen').getContext('2d');
  const img = new Image();
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.type === 'frame') { img.onload = () => ctx.drawImage(img, 0, 0); img.src = 'data:image/jpeg;base64,' + msg.data; }
  };
  const cv = document.getElementById('screen');
  cv.addEventListener('mousedown', (ev) => {
    const r = cv.getBoundingClientRect();
    ws.send(JSON.stringify({ type:'mouse', action:'mousePressed', x: ev.clientX - r.left, y: ev.clientY - r.top }));
  });
  // 同理 mouseup / mousemove / keydown（注意坐标要换算成页面视口坐标）
</script>
```

### 步骤
1. 确认 OpenClaw 的 Chromium 是 CDP 可控的（Playwright：`context.newCDPSession(page)`；Puppeteer：`page.target().createCDPSession()`）。
2. 写上面的 `screencast → websocket → canvas` 中继（Node 原型即可）。
3. 前端 canvas 渲染 + 鼠标键盘回传（坐标换算是关键）。
4. 外层套 token 校验 + `wss://` + 网关。

### 优缺点
- ✅ 只推标签页，轻（JPEG 帧）；headless/headful 都行；天然可嵌 iframe；product-grade。
- ❌ 输入回传要自己实现（坐标换算、组合键、中文输入法要处理）；帧式非视频，精度够登录用但不是像素级流畅。

### 验证点
- 前端 canvas 能否看到实时画面、点击/输入是否**准确回放**（重点测坐标换算和中文输入）？
- 滑块能否用鼠标拖动完成？

---

## 5. 方案③ — xpra（应用级串流，headful 又只推窗口）

**原理**：xpra 是"应用级的 VNC"——只转发**单个应用窗口**而不是整个桌面，自带 HTML5 客户端。适合"必须用真实 headful Chrome（更利于过人机校验）但又不想推整个桌面"。

### 步骤

```bash
xpra start :100 \
  --start="google-chrome --app=https://login.taobao.com --user-data-dir=/profiles/store_1001" \
  --html=on --bind-tcp=0.0.0.0:10000
# 用户打开 xpra 的 HTML5 客户端 → 只看到 Chrome 那个窗口
```

### 加固
- 同样：`bind-tcp` 绑 localhost，网关做 TLS + token；一个会话一个 `:display`。

### 优缺点
- ✅ 只推窗口不推桌面，比 VNC 干净；真实 headful 浏览器（反自动化更友好）；自带 HTML5 客户端，省了写前端渲染。
- ❌ 比方案① 多引一个组件（xpra）；扩展性介于 ①② 之间。

### 验证点
- HTML5 客户端里是否**只有 Chrome 窗口**、操作是否顺畅？
- 能否手动完成一次真实登录？

---

## 6. 通用收尾 — 登录成功检测 & 会话落盘（三方案都一样）

串流只是"让用户操作"的通道。用户登录成功后，收尾三件事对所有方案一致：

```js
// 1. 检测登录成功（三选一或组合，别只靠单一信号）
//    - URL 跳转到卖家中心 / 首页
//    - 出现关键鉴权 cookie（遍历 context.cookies() 找目标 cookie 名）
//    - 出现"已登录"的 DOM 元素（如账号昵称、退出按钮）

// 2. 落盘会话（加密后存，绑定 store_1001）
const state = await context.storageState();   // { cookies, origins(localStorage) }

// 3. 回调 SaaS：store.status = connected；关闭串流会话
```

> 方案①/③ 若不是用 Playwright/Puppeteer 驱动，可直接持久化 `--user-data-dir` 目录（打包加密保存），效果等价。

---

## 7. 安全 Checklist（PoC 也要做的最低项）

- [ ] 串流入口 URL 是**短时、一次性、签名**的 token，绑定 [当前登录用户 + 目标店铺]。
- [ ] 全程 **TLS / wss**，串流端口**绑 localhost**，只经网关暴露，**不要公网裸端口**。
- [ ] 一会话一隔离（独立 `:display` 或独立浏览器 context + 独立 profile）。
- [ ] 落盘的 storageState / profile **加密存储**，当作最高级密钥，访问审计。
- [ ] ⚠️ **当前那个公网 `noVNC + VNC 密码` 的调试入口，验证完立即关闭 / 改密码**（已在群里贴出过，视为已泄露）。

---

## 8. ⚠️ 出口 IP 备注（本轮不解决，但先记一笔）

- 这台腾讯云机器做 **"主机 + 串流"** 没问题（机房 IP 用于串流控制面 OK）。
- 但那个浏览器**登录电商时的出口 IP**，产品化时**必须走住宅/ISP 代理**，不能用这台机房 IP，否则：
  - 冷启动人机校验触发率极高；
  - 多商家共用机房 IP 会被平台**账号关联 / 连坐封号**。
- PoC 阶段可先用机房 IP 验证"登录流程能不能通"；但**验证时如果一直卡人机校验、或登录后很快失效，很可能就是机房 IP 的问题**，届时给浏览器挂一条住宅代理再测一次即可区分。
- 代理是**后端给浏览器配的一个出口参数（每店一条 sticky 住宅 IP），商家零操作、零安装**。

---

## 9. 最终判定 — 哪个方案"跑通"的标准

对每个方案，依次验证（**第 4 步是链路打通的金标准**）：

1. 用户在串流画面里**只看到浏览器**、能正常鼠标键盘操作。
2. 能**手动完成一次真实登录**（滑块 / 扫码 / 短信验证都算）。
3. 登录后 `storageState()`（或 profile 目录）里**拿到了有效 cookie**。
4. ✅ **用这份 cookie 新起一个无人浏览器，能免登录直接进卖家后台** —— 过了这步，"用户登录 → Agent 托管"整条链路就通了。

三个方案哪个先稳定跑到第 4 步，就先用哪个推进；② 作为产品版目标形态。

---

*本文档为登录串流架构 PoC 交接稿，供后端验证选型。会话/凭证相关内容按密钥管理，勿明文外传。*
