# arkops-portal 专用分支开发约定

本分支专门用于 `arkops-portal` 前端开发。

- 应用代码、配置、资源、脚本和依赖放在 `arkops-portal/`；根目录仅放仓库说明和开发约定。
- 产品文档放在 `arkops-portal/docs/product/`，前端接口契约和外部服务接入文档放在 `arkops-portal/docs/integration/`。
- 开发前阅读 `arkops-portal/README.md` 和 `arkops-portal/product-design.md`；导航或页面范围变化时同步更新产品设计、README 和路由。
- 复用现有组件、领域类型和 Mock API；用户可见文案遵循现有 i18n 约定。
- 修改前端代码、依赖或构建配置后，在 `arkops-portal/` 运行 `npm run build`。
- 不提交 `.env.local`、凭据、`node_modules` 或构建产物。
- 不在此分支添加其他应用或后端服务；跨项目需求以接入契约或文档记录。
