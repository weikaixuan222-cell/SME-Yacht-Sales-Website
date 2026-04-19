# SME Yacht Sales Website

面向小微企业的游艇售卖网站 MVP。

## 核心能力

- **前台展示**：首页 → 游艇列表 → 游艇详情 → 提交询盘，完整演示闭环
- **后台管理**：管理员登录 → 游艇 CRUD → 询盘查看 → 退出登录
- **本地图片上传**：后台支持直接从电脑选择图片上传为游艇封面
- **响应式设计**：桌面端与移动端自适应布局

## 技术栈

| 层级 | 技术 |
| :--- | :--- |
| 前端框架 | Next.js 16 + TypeScript |
| 样式 | Tailwind CSS 4 (System Fonts) |
| ORM | Prisma |
| 数据库 | PostgreSQL (Docker) |
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

访问 `http://localhost:3000` 即可查看。默认账号：`admin@example.com` / `change-me-please`。

---

## Ubuntu 24.04 服务器部署

针对受限网络环境（如中国大陆机房）进行了深度优化，移除了 Google Fonts 依赖，并内置镜像加速。

### 首次部署

#### 场景 A：网络环境良好
```bash
sudo apt update && sudo apt install -y curl git
curl -O https://raw.githubusercontent.com/weikaixuan222-cell/SME-Yacht-Sales-Website/main/deploy.sh
chmod +x deploy.sh
./deploy.sh --init
```

#### 场景 B：受限网络/私有仓库（推荐）
如果 `curl` 报 404 或连接失败，请直接在终端执行以下“全自动注入”命令：

```bash
cat << 'EOF' > deploy.sh
# (在此处粘贴项目根目录 deploy.sh 的内容)
EOF
chmod +x deploy.sh
./deploy.sh --init
```

### 常见部署问题 (FAQ)

| 问题 | 原因 | 解决方法 |
| :--- | :--- | :--- |
| `curl` 报 404 | 仓库为私有 (Private) | 使用上述 `cat << 'EOF'` 方案手动创建脚本。 |
| `git clone` 失败/卡住 | GitHub 连接不稳定 | 脚本会先强制 Git 使用 HTTP/1.1，再自动尝试 `ghproxy` 镜像；若镜像也失败，会继续下载 GitHub 仓库归档包。 |
| `GnuTLS recv error (-110)` | 服务器到 GitHub 的 TLS 连接中断 | 最新脚本会优先把 Git 切到 HTTP/1.1，并在 clone 失败后自动回退到仓库归档包下载。 |
| `Prisma version error` | Node.js 版本低于 20 | 脚本会自动识别 Ubuntu 代号并安装 Node.js 20；若镜像失败会自动回退到 NodeSource 官方源。 |
| `apt update` 提示 `nodistro Release 404` | 旧版部署脚本写入了错误的 NodeSource 源 | 先执行 `sudo rm -f /etc/apt/sources.list.d/nodesource.list /etc/apt/keyrings/nodesource.gpg && sudo apt update`，再重新下载最新 `deploy.sh` 执行。 |
| `next/font` 构建失败 | 无法连接 Google 字体 | 项目已默认移除 Geist 字体改用系统字体，解决了此问题。 |

### 后续更新

在本地 `git push` 后，到服务器执行：
```bash
./deploy.sh
```

---

## 常用命令

```bash
npm run build        # 生产环境构建
npm run smoke        # 页面级 Smoke 测试
npm run db:up        # 启动数据库容器
npm run prisma:seed  # 重新注入演示数据
```
