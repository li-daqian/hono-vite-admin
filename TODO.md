- 保护免费数据库额度
    READ_ONLY_MODE 允许 login/refresh/logout：apps/server/src/middleware/readonly.middleware.ts:6，但登录成功会创建 refresh token，refresh 会更新 token，错误
    登录还可能更新失败次数：apps/server/src/modules/auth/auth.service.ts:87。
    可以做：限制登录频率、清理过期 refresh token、缩短 demo session、避免公开真实管理员凭据、确保数据库用连接池/pooled URL。
- 把 Dashboard 从占位改成 demo 首页
    现在 Dashboard 只是 Dashboard Page：apps/admin/src/pages/DashboardPage.vue:4。
    可以做：展示用户数、角色数、部门树概览、最近登录/操作日志、当前 READ_ONLY_MODE 状态、API/Swagger 链接。这对 demo 价值最高。
- 整理 README 和 TODO
    README 前半是你的部署说明，但后面还有 Turborepo starter 模板残留：README.md:87。TODO.md 目前为空。
    可以做：改成项目介绍、线上 demo 地址、登录方式、只读限制、架构图、部署 runbook、免费服务注意事项。
- 补部署前质量门禁
    GitHub Actions 现在主要是安装、迁移、部署：.github/workflows/deploy-vercel-production.yml:116。
    可以做：部署前跑 check-types、关键测试、admin build、server build:vercel。免费项目不需要复杂 CI，但至少避免坏包直接上生产。
- 补 demo 数据故事
    seed 已经有部门、用户和菜单权限：apps/server/prisma/seed.ts:9。
    可以做：让 demo 用户/部门/角色更贴近真实后台场景，准备一个低权限账号展示 RBAC 差异，而不是所有人都用 admin。
- 暂时不建议做的事
    不建议现在上重型功能：文件上传、后台任务、实时推送、大量审计写入、多租户、复杂报表。你的约束是 Vercel 免费 + demo + read-only，优先应该是稳定、可展示、少
    写库、少冷启动。

- 菜单/权限管理前端化
    现在菜单和 action 是 seed 固定出来的，适合加“菜单管理、按钮权限管理、排序、启停”。这是后台模板核心能力，写入很多也没关系，线上只读会挡住。
- 系统配置 / 字典管理
    比如站点名称、登录页标题、默认分页大小、用户状态字典、审计模块字典等。很适合 admin demo，功能完整但成本低。
- 用户安全策略管理
    把 LOGIN_MAX_FAILED_ATTEMPTS、LOGIN_LOCK_DURATION 这类东西做成后台配置页。线上只读展示配置，本地可修改。
- 操作审计增强
    加导出、详情 diff、按操作者/模块/时间筛选、失败原因筛选。审计是现有项目强项，继续做会显得完整。
- 角色权限体验增强
    权限模板、复制角色、权限差异预览、批量授权。这比继续加普通 CRUD 更能体现 RBAC 后台的价值。
- 组织架构增强
    部门负责人选择用户、部门用户统计、部门树拖拽优化、部门禁用后的用户影响提示。这个和现有部门模块贴得很紧。
- 批量导入/导出
    用户导入、部门导入、角色导出、审计导出。线上只读下可以保留“导出”，导入提交时提示 read-only。
