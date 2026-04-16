# SME Yacht Sales Website

面向小微企业的游艇售卖网站 MVP。
当前阶段重点：
- 保持 Next.js App Router + TypeScript + Tailwind CSS + Prisma + PostgreSQL 工程基座稳定
- 保持前台真实链路可演示：首页 / 游艇列表 / 游艇详情 / 询盘提交
- 保持后台最小管理闭环可演示：查看询盘、查看/新增/编辑/删除游艇
- 补上最小管理员鉴权保护：登录、后台页保护、后台管理接口保护、退出登录

## 技术栈

- Next.js 16
- TypeScript
- Tailwind CSS 4
- Prisma
- PostgreSQL

## 本地运行

1. 安装依赖

```bash
npm install
```

2. 启动本地 PostgreSQL

```bash
npm run db:up
```

默认会启动一个 Docker PostgreSQL：
- host: `127.0.0.1`
- port: `55433`
- database: `sme_yacht_sales`
- username: `yacht_sales`
- password: `yacht_sales_dev_password`

3. 复制环境变量

```bash
cp .env.example .env
```

Windows PowerShell 可使用：

```powershell
Copy-Item .env.example .env
```

4. 生成 Prisma Client

```bash
npm run prisma:generate
```

5. 执行迁移

```bash
npm run prisma:migrate:dev -- --name init
```

6. 写入演示数据与默认管理员

```bash
npm run prisma:seed
```

默认管理员账号取自环境变量：
- email: `ADMIN_EMAIL`
- password: `ADMIN_PASSWORD`

`.env.example` 默认值：
- `ADMIN_EMAIL=admin@example.com`
- `ADMIN_PASSWORD=change-me-please`
- `ADMIN_SESSION_SECRET=replace-with-a-long-random-string`

7. 启动开发服务器

```bash
npm run dev
```

## 当前可演示链路

1. 打开首页：`http://localhost:3000`
2. 进入游艇列表：`http://localhost:3000/yachts`
3. 点击任意游艇进入详情页：`http://localhost:3000/yachts/<id>`
4. 在详情页提交询盘表单
5. 访问后台登录页：`http://localhost:3000/admin/login`
6. 登录后进入后台游艇管理：`http://localhost:3000/admin/yachts`
7. 在后台完成游艇新增、编辑、删除
8. 打开后台询盘查看：`http://localhost:3000/admin/inquiries`
9. 点击退出登录后，再访问后台页面或后台管理接口会被重新拦回登录页

## 常用命令

```bash
npm run test
npm run lint
npm run typecheck
npm run build
npm run db:down
```

## 当前目录说明

- `src/app`: 页面、路由与 Route Handlers
- `src/components`: 页面公共结构组件与后台交互组件
- `src/lib`: Prisma 连接、鉴权与接口辅助工具
- `src/server`: 服务端读取与写入逻辑
- `prisma`: 数据库 schema、迁移与 seed
- `public`: 静态资源

## 当前限制

- 当前管理员鉴权仍为最小实现，只区分“已登录管理员”与“未登录”
- 当前未实现复杂 RBAC、多角色权限系统或操作审计
- 当前筛选、搜索、分页尚未开始实现
- 当前只验证了 Windows + Docker，未在 Ubuntu 24 实机验证
- 默认管理员账号仅用于本地演示，正式环境必须替换密码和会话密钥
