# SME Yacht Sales Website

面向小微企业的游艇售卖网站 MVP。

## 核心能力

- **前台展示**：首页 → 游艇列表 → 游艇详情 → 提交询盘，完整演示闭环
- **后台管理**：管理员登录 → 游艇 CRUD → 询盘查看 → 退出登录
- **本地图片上传**：后台支持直接从电脑选择图片上传为游艇封面，无需填写外部 URL
- **响应式设计**：桌面端与移动端自适应布局，移动端汉堡菜单导航

## 技术栈

| 层级 | 技术 |
| :--- | :--- |
| 前端框架 | Next.js 16 + TypeScript |
| 样式 | Tailwind CSS 4 |
| ORM | Prisma |
| 数据库 | PostgreSQL (Docker) |
| 进程守护 | PM2 (生产环境) |

## 本地运行（Windows / macOS）

### 前置条件
- Node.js 20+
- Docker Desktop（用于运行 PostgreSQL）

### 步骤

```bash
# 1. 安装依赖
npm install

# 2. 启动数据库
npm run db:up

# 3. 配置环境变量
cp .env.example .env
# Windows PowerShell: Copy-Item .env.example .env

# 4. 同步数据库结构
npx prisma db push

# 5. 注入演示数据与默认管理员账号
npm run prisma:seed

# 6. 启动开发服务器
npm run dev
```

访问 `http://localhost:3000` 即可查看网站。

### 默认管理员账号

| 字段 | 默认值 |
| :--- | :--- |
| 邮箱 | `admin@example.com` |
| 密码 | `change-me-please` |

> ⚠️ 以上为本地演示账号，正式环境请务必修改 `.env` 中的 `ADMIN_PASSWORD` 和 `ADMIN_SESSION_SECRET`。

## Ubuntu 24.04 服务器部署

项目提供了一键部署脚本 `deploy.sh`，适用于自建 Ubuntu 24.04 服务器。

### 首次部署

SSH 登录服务器后执行：

```bash
# 下载部署脚本
curl -O https://raw.githubusercontent.com/weikaixuan222-cell/SME-Yacht-Sales-Website/main/deploy.sh
chmod +x deploy.sh

# 首次初始化（自动安装 Node.js、Docker、PM2，克隆代码，启动数据库与应用）
./deploy.sh --init
```

> 首次运行时脚本会在创建 `.env` 后暂停，提示您修改默认密码。修改完成后再次执行 `./deploy.sh --init` 即可完成部署。

### 后续更新

在 Windows 上改完代码并 `git push` 后，SSH 到服务器执行：

```bash
./deploy.sh
```

脚本会自动拉取最新代码 → 安装依赖 → 同步数据库 → 重新构建 → 重启服务。

### 部署完成后

在浏览器访问：`http://服务器IP:3000`

## 演示路径

| 步骤 | 页面 | 说明 |
| :--- | :--- | :--- |
| 1 | `/` | 首页，查看品牌展示与 CTA |
| 2 | `/yachts` | 游艇列表，浏览在售游艇卡片 |
| 3 | `/yachts/<id>` | 游艇详情，查看参数与图片 |
| 4 | 详情页表单 | 填写并提交询盘 |
| 5 | `/admin/login` | 管理员登录 |
| 6 | `/admin/yachts` | 后台游艇管理，支持新增/编辑/删除/上传封面图 |
| 7 | `/admin/inquiries` | 后台询盘查看，确认刚才提交的询盘 |

## 常用命令

```bash
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run start        # 启动生产服务器
npm run typecheck    # TypeScript 类型检查
npm run lint         # ESLint 检查
npm run test         # 运行测试
npm run smoke        # 页面级 Smoke 测试
npm run db:up        # 启动 PostgreSQL 容器
npm run db:down      # 停止 PostgreSQL 容器
npm run prisma:seed  # 注入演示数据
```

## 目录结构

```
src/
├── app/                   # 页面、路由与 API Route Handlers
│   ├── admin/             # 后台管理页面
│   ├── api/               # REST API (游艇、询盘、上传、鉴权)
│   ├── contact/           # 联系我们页
│   └── yachts/            # 游艇列表与详情页
├── components/            # 公共组件与后台交互组件
├── lib/                   # Prisma 连接、鉴权与工具函数
└── server/                # 服务端业务逻辑
prisma/                    # 数据库 Schema、迁移与 Seed
scripts/                   # 辅助脚本 (Smoke 测试等)
deploy.sh                  # Ubuntu 一键部署脚本
```

## 当前限制

- 管理员鉴权为最小实现，只区分"已登录"与"未登录"，无多角色权限
- 前后台列表页尚未接入搜索、筛选与分页
- 图片上传目前仅支持游艇封面图的本地落盘，图库多图仍需手动填写 URL
- 上传的图片存储在服务器本地磁盘（`public/uploads/`），不适用于 Vercel 等无状态平台
