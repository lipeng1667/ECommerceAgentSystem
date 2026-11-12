# AllMall Portal (arkops-portal)

本分支 `codex/arkops-portal-only` 专门用于 `arkops-portal` 前端开发。

## 开发范围

- 前端源码、配置、资源和依赖均位于 `arkops-portal/`。
- 产品设计、审计记录和业务场景文档位于 `arkops-portal/docs/product/`。
- 前端对接所需的 API 契约和店铺登录文档位于 `arkops-portal/docs/integration/`；外部后端及 Agent runtime 的实现由独立项目负责。
- 后续开发保持此范围，项目根目录仅维护仓库说明和开发约定。

## 本地开发

技术栈：React 18、TypeScript、Vite、Ant Design、React Router、TanStack Query、Day.js。

```bash
cd arkops-portal
npm ci
npm run dev
```

默认开发地址：`http://localhost:5174/`。

```bash
npm run build
```

拼多多登录网关配置见 [环境变量示例](arkops-portal/.env.example)；本地配置存入 `.env.local`。

## 文档入口

- [前端开发指南](arkops-portal/README.md)
- [产品设计](arkops-portal/product-design.md)
- [API 和数据约定](arkops-portal/docs/integration/api-data-conventions.md)
- [SaaS API 规格](arkops-portal/docs/integration/AllMall_SaaS_API_Specification_V0.2.html)
- [SaaS 与 Agent 接口规格](arkops-portal/docs/integration/AllMall_SaaS_Agent_Interface_Specification_V0.3.html)
- [拼多多店铺登录接入](arkops-portal/docs/integration/pdd-login-method2.md)
