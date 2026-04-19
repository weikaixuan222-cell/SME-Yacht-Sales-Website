# SME Yacht Sales Website

面向小微企业的游艇销售网站 MVP。

## 核心能力

- 前台展示：首页、游艇列表、游艇详情、提交询盘，形成最小可演示闭环
- 后台管理：管理员登录、游艇 CRUD、询盘查看
- 本地图片上传：后台支持直接从电脑选择图片作为游艇封面
- 响应式布局：兼容桌面端与移动端

## 技术栈

| 层级 | 技术 |
| :--- | :--- |
| 前端框架 | Next.js 16 + TypeScript |
| 样式 | Tailwind CSS 4 |
| ORM | Prisma |
| 数据库 | PostgreSQL（Docker） |
| 进程守护 | PM2 |

## 本地运行（Windows / macOS）

### 前置条件

- Node.js 20+
- Docker Desktop

### 步骤

```bash
npm install
npm run db:up
cp .env.example .env
npx prisma db push
npm run prisma:seed
npm run dev
```

仓库已包含 `.env.example` 模板文件；首次运行请先复制为 `.env`，再执行 Prisma 和启动命令。

访问 `http://localhost:3000` 即可查看。默认账号：`admin@example.com` / `change-me-please`。

---

## Ubuntu 24.04 服务器部署

针对受限网络环境做了部署兜底处理，包括：

- Git `HTTP/1.1` 回退
- GitHub 仓库归档包下载回退
- PostgreSQL 镜像源回退
- 部署阶段自动加载 `.env`

### 首次部署

#### 场景 A：网络正常

```bash
sudo apt update && sudo apt install -y curl git
curl -O https://raw.githubusercontent.com/weikaixuan222-cell/SME-Yacht-Sales-Website/main/deploy.sh
chmod +x deploy.sh
./deploy.sh --init
```

#### 场景 B：`raw.githubusercontent.com` 不可达

```bash
curl --http1.1 -fL --connect-timeout 20 --max-time 120 -o sme-yacht-sales.tar.gz https://codeload.github.com/weikaixuan222-cell/SME-Yacht-Sales-Website/tar.gz/refs/heads/main
tar -xzf sme-yacht-sales.tar.gz
mv SME-Yacht-Sales-Website-main SME-Yacht-Sales-Website
cd SME-Yacht-Sales-Website
chmod +x deploy.sh
./deploy.sh --init
```

### 常见部署问题（FAQ）

| 问题 | 原因 | 解决方法 |
| :--- | :--- | :--- |
| `curl` 报 404 | 仓库为私有仓库，或 `raw.githubusercontent.com` 不可达 | 使用仓库归档包下载方案，或手动创建 `deploy.sh`。 |
| `.env.example` 不存在 | 当前目录不是最新仓库根目录，或项目代码未完整更新 | 重新下载最新仓库后再执行；正常仓库根目录应包含 `.env.example`，可直接 `cp .env.example .env`。 |
| `git clone` 失败或卡住 | GitHub 连接不稳定 | 脚本会先强制 Git 使用 HTTP/1.1，再自动尝试 `ghproxy` 镜像；若镜像也失败，会继续下载 GitHub 仓库归档包。 |
| `GnuTLS recv error (-110)` | 服务器到 GitHub 的 TLS 连接中断 | 最新脚本会优先把 Git 切到 HTTP/1.1，并在 `clone` 失败后自动回退到仓库归档包下载。 |
| `failed to resolve reference "docker.io/library/postgres:16-alpine"` | 服务器到 Docker Hub 的网络超时，常见于 IPv6 出口不通或 Docker Hub 受限 | 脚本会先尝试官方 `postgres:16-alpine`，失败后自动回退到 `docker.m.daocloud.io/library/postgres:16-alpine`，并把成功镜像写入 `.env`。 |
| `PrismaConfigEnvError: Cannot resolve environment variable: DATABASE_URL` | 当前 shell 没有加载 `.env`，或目录里缺少 `.env.example` / `.env` | 最新脚本会自动创建 `.env` 并加载环境变量；若手动部署，请先执行 `cp .env.example .env`，再运行 Prisma 命令。 |
| `Prisma version error` | Node.js 版本低于 20 | 脚本会自动识别 Ubuntu 代号并安装 Node.js 20；若镜像失败会自动回退到 NodeSource 官方源。 |
| `apt update` 提示 `nodistro Release 404` | 旧版部署脚本写入了错误的 NodeSource 源 | 先执行 `sudo rm -f /etc/apt/sources.list.d/nodesource.list /etc/apt/keyrings/nodesource.gpg && sudo apt update`，再重新下载最新 `deploy.sh` 执行。 |
| `next/font` 构建失败 | 无法连接 Google 字体 | 项目已默认移除 Geist 字体，改用系统字体。 |

### 后续更新

在本地 `git push` 后，到服务器执行：

```bash
./deploy.sh
```

---

## 常用命令

```bash
npm run build
npm run smoke
npm run db:up
npm run prisma:seed
```
