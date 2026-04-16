#!/usr/bin/env bash
# =============================================================================
# SME Yacht Sales Website - Ubuntu 24.04 一键部署脚本
# 用法：
#   首次部署：  chmod +x deploy.sh && ./deploy.sh --init
#   后续更新：  ./deploy.sh
# =============================================================================

set -euo pipefail

# ----------------------------- 配置区 --------------------------------
APP_NAME="yacht-sales"
REPO_URL="https://github.com/weikaixuan222-cell/SME-Yacht-Sales-Website.git"
APP_DIR="$HOME/SME-Yacht-Sales-Website"
NODE_VERSION="20"
PORT=3000
# ---------------------------------------------------------------------

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()   { echo -e "${GREEN}[✓]${NC} $1"; }
warn()  { echo -e "${YELLOW}[!]${NC} $1"; }
fail()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }

# =====================================================================
# 首次初始化（仅在 --init 参数时执行）
# =====================================================================
init_environment() {
  log "开始首次环境初始化..."

  # --- 1. 系统更新 ---
  log "更新系统软件包..."
  sudo apt update && sudo apt upgrade -y

  # --- 2. 安装 Node.js ---
  if command -v node &>/dev/null; then
    log "Node.js 已安装: $(node -v)"
  else
    log "安装 Node.js v${NODE_VERSION}..."
    curl -fsSL "https://deb.nodesource.com/setup_${NODE_VERSION}.x" | sudo -E bash -
    sudo apt-get install -y nodejs
    log "Node.js 安装完成: $(node -v)"
  fi

  # --- 3. 安装 Docker & Docker Compose ---
  if command -v docker &>/dev/null; then
    log "Docker 已安装: $(docker --version)"
  else
    log "安装 Docker..."
    sudo apt install -y docker.io docker-compose
    sudo systemctl enable docker
    sudo systemctl start docker
    sudo usermod -aG docker "$USER"
    warn "已将当前用户加入 docker 组，如果后续 docker 命令报权限错误，请重新登录 SSH。"
  fi

  # --- 4. 安装 PM2 ---
  if command -v pm2 &>/dev/null; then
    log "PM2 已安装: $(pm2 -v)"
  else
    log "安装 PM2 进程守护..."
    sudo npm install -g pm2
    log "PM2 安装完成"
  fi

  # --- 5. 克隆代码仓库 ---
  if [ -d "$APP_DIR" ]; then
    log "项目目录已存在，跳过克隆"
  else
    log "克隆代码仓库..."
    git clone "$REPO_URL" "$APP_DIR"
  fi

  cd "$APP_DIR"

  # --- 6. 创建 .env ---
  if [ ! -f ".env" ]; then
    cp .env.example .env
    warn "已从模板创建 .env 文件。请务必执行以下命令修改默认密码："
    warn "  nano $APP_DIR/.env"
    warn "修改完成后，再次运行 ./deploy.sh 继续部署。"
    exit 0
  fi

  # --- 7. 创建上传目录 ---
  mkdir -p public/uploads/yachts
  log "已创建图片上传目录 public/uploads/yachts"

  # --- 8. 安装依赖 ---
  log "安装项目依赖..."
  npm install

  # --- 9. 启动数据库 ---
  log "启动 PostgreSQL 容器..."
  sudo docker compose up -d db
  sleep 5

  # --- 10. 数据库初始化 ---
  log "同步数据库结构..."
  npx prisma db push

  log "注入演示数据..."
  npm run prisma:seed

  # --- 11. 构建与启动 ---
  log "构建生产版本..."
  npm run build

  log "使用 PM2 启动应用..."
  pm2 delete "$APP_NAME" 2>/dev/null || true
  pm2 start npm --name "$APP_NAME" -- start -- -p "$PORT"
  pm2 save

  # --- 12. 设置开机自启 ---
  log "配置 PM2 开机自启..."
  pm2 startup systemd -u "$USER" --hp "$HOME" | tail -1 | bash || true
  pm2 save

  echo ""
  log "=========================================="
  log "  首次部署完成！"
  log "  访问地址: http://$(hostname -I | awk '{print $1}'):${PORT}"
  log "=========================================="
}

# =====================================================================
# 日常更新（拉取最新代码、重新构建、重启服务）
# =====================================================================
update_deploy() {
  log "开始更新部署..."

  cd "$APP_DIR" || fail "找不到项目目录 $APP_DIR，请先运行 ./deploy.sh --init"

  # --- 1. 拉取最新代码 ---
  log "拉取最新代码..."
  git pull origin main

  # --- 2. 安装依赖（如果 package.json 有变化） ---
  log "同步依赖..."
  npm install

  # --- 3. 同步数据库（如果 schema 有变化） ---
  log "同步数据库结构..."
  npx prisma db push

  # --- 4. 重新构建 ---
  log "重新构建生产版本..."
  npm run build

  # --- 5. 重启服务 ---
  log "重启应用服务..."
  pm2 restart "$APP_NAME"

  echo ""
  log "=========================================="
  log "  更新部署完成！"
  log "  访问地址: http://$(hostname -I | awk '{print $1}'):${PORT}"
  log "=========================================="
}

# =====================================================================
# 入口
# =====================================================================
if [ "${1:-}" = "--init" ]; then
  init_environment
else
  update_deploy
fi
