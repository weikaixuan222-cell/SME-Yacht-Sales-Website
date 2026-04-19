#!/usr/bin/env bash
# =============================================================================
# SME Yacht Sales Website - Ubuntu 24.04 一键部署脚本 (增强版)
# =============================================================================

set -euo pipefail

# ----------------------------- 配置区 --------------------------------
APP_NAME="yacht-sales"
REPO_URL="https://github.com/weikaixuan222-cell/SME-Yacht-Sales-Website.git"
MIRROR_REPO_URL="https://mirror.ghproxy.com/https://github.com/weikaixuan222-cell/SME-Yacht-Sales-Website.git"
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

detect_ubuntu_codename() {
  if [ -r /etc/os-release ]; then
    # 优先使用系统标准字段，避免硬编码 nodistro 导致 apt 源 404。
    # shellcheck disable=SC1091
    . /etc/os-release
    if [ -n "${UBUNTU_CODENAME:-}" ]; then
      printf '%s\n' "$UBUNTU_CODENAME"
      return 0
    fi
    if [ -n "${VERSION_CODENAME:-}" ]; then
      printf '%s\n' "$VERSION_CODENAME"
      return 0
    fi
  fi

  if command -v lsb_release &>/dev/null; then
    lsb_release -cs
    return 0
  fi

  return 1
}

reset_nodesource_repo() {
  sudo rm -f /etc/apt/sources.list.d/nodesource.list
  sudo rm -f /etc/apt/keyrings/nodesource.gpg
}

install_nodejs() {
  local ubuntu_codename
  ubuntu_codename="$(detect_ubuntu_codename)" || fail "无法识别当前 Ubuntu 发行版代号，不能自动配置 Node.js 源。"

  log "检测到 Ubuntu 代号: ${ubuntu_codename}"
  sudo mkdir -p /etc/apt/keyrings

  log "尝试通过清华镜像安装 Node.js v${NODE_VERSION}..."
  reset_nodesource_repo

  if curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg; then
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://mirrors.tuna.tsinghua.edu.cn/nodesource/deb/node_${NODE_VERSION}.x ${ubuntu_codename} main" | sudo tee /etc/apt/sources.list.d/nodesource.list > /dev/null

    if sudo apt update && sudo apt install -y nodejs; then
      log "Node.js 安装完成: $(node -v)"
      return 0
    fi

    warn "清华镜像安装 Node.js 失败，回退到 NodeSource 官方源..."
  else
    warn "NodeSource GPG key 获取失败，回退到 NodeSource 官方源..."
  fi

  reset_nodesource_repo
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_VERSION}.x" | sudo -E bash -
  sudo apt install -y nodejs
  log "Node.js 安装完成: $(node -v)"
}

# 环境初始化
init_environment() {
  log "开始环境初始化..."

  # --- 0. 网络优化 ---
  log "优化 DNS 解析..."
  echo "nameserver 223.5.5.5" | sudo tee /etc/resolv.conf > /dev/null

  # --- 1. 基础工具 ---
  log "安装基础工具..."
  reset_nodesource_repo
  sudo apt update
  sudo apt install -y curl git wget ca-certificates gnupg build-essential unzip

  # --- 2. 安装 Node.js (v20+) ---
  if command -v node &>/dev/null && node -v | grep -qE "v(2[0-9]|22)"; then
    log "Node.js 已安装且版本符合要求: $(node -v)"
  else
    install_nodejs
  fi

  # --- 3. 安装 Docker ---
  if command -v docker &>/dev/null; then
    log "Docker 已安装: $(docker --version)"
  else
    log "安装 Docker..."
    sudo apt install -y docker.io docker-compose-v2
    sudo systemctl enable --now docker
    sudo usermod -aG docker "$USER"
    warn "已将当前用户加入 docker 组，如果报错请尝试重新登录 SSH。"
  fi

  # --- 4. 安装 PM2 ---
  log "配置 PM2 (使用 npmmirror)..."
  sudo npm install -g pm2 --registry=https://registry.npmmirror.com

  # --- 5. 获取代码 ---
  if [ ! -d "$APP_DIR" ]; then
    log "尝试克隆仓库..."
    git config --global http.postBuffer 524288000
    git clone "$REPO_URL" "$APP_DIR" || {
      warn "官方地址连接失败，尝试镜像加速..."
      git clone "$MIRROR_REPO_URL" "$APP_DIR"
    } || {
      fail "代码克隆失败。如果是私有仓库，请检查 Token；如果是网络问题，请尝试从本地上传 ZIP 包。"
    }
  fi

  cd "$APP_DIR"

  # --- 6. 安装依赖 ---
  log "安装项目依赖 (使用 npmmirror)..."
  npm install --registry=https://registry.npmmirror.com

  # --- 7. 数据库与构建 ---
  log "启动数据库..."
  sudo docker compose up -d db
  
  log "同步数据库结构..."
  npx prisma db push
  npm run prisma:seed

  log "构建生产版本..."
  # 提示：代码已移除 Google Fonts 依赖，构建应能顺利通过
  npm run build

  log "启动服务..."
  pm2 delete "$APP_NAME" 2>/dev/null || true
  pm2 start npm --name "$APP_NAME" -- start -- -p "$PORT"
  pm2 save

  log "=========================================="
  log "  部署成功！"
  log "  访问地址: http://$(hostname -I | awk '{print $1}'):${PORT}"
  log "=========================================="
}

update_deploy() {
  log "开始更新部署..."
  cd "$APP_DIR"
  git pull || { warn "Git Pull 失败，尝试切换远程地址..."; git remote set-url origin "$MIRROR_REPO_URL"; git pull; }
  npm install --registry=https://registry.npmmirror.com
  npx prisma db push
  npm run build
  pm2 restart "$APP_NAME"
}

if [ "${1:-}" = "--init" ]; then
  init_environment
else
  update_deploy
fi
