#!/usr/bin/env bash
# =============================================================================
# SME Yacht Sales Website - Ubuntu 24.04 一键部署脚本（增强版）
# =============================================================================

set -euo pipefail

# ----------------------------- 配置区 --------------------------------
APP_NAME="yacht-sales"
REPO_URL="https://github.com/weikaixuan222-cell/SME-Yacht-Sales-Website.git"
MIRROR_REPO_URL="https://mirror.ghproxy.com/https://github.com/weikaixuan222-cell/SME-Yacht-Sales-Website.git"
ARCHIVE_URL="https://codeload.github.com/weikaixuan222-cell/SME-Yacht-Sales-Website/tar.gz/refs/heads/main"
APP_DIR="$HOME/SME-Yacht-Sales-Website"
NODE_VERSION="20"
PORT=3000
DEFAULT_POSTGRES_IMAGE="postgres:16-alpine"
MIRROR_POSTGRES_IMAGE="docker.m.daocloud.io/library/postgres:16-alpine"
# ---------------------------------------------------------------------

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
fail() { echo -e "${RED}[✗]${NC} $1"; exit 1; }

detect_ubuntu_codename() {
  if [ -r /etc/os-release ]; then
    # 优先使用系统标准字段，避免硬编码发行版代号。
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

  if command -v lsb_release >/dev/null 2>&1; then
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
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://mirrors.tuna.tsinghua.edu.cn/nodesource/deb/node_${NODE_VERSION}.x ${ubuntu_codename} main" | sudo tee /etc/apt/sources.list.d/nodesource.list >/dev/null

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

download_repo_archive() {
  local archive_file
  local extract_dir
  local extracted_root

  archive_file="$(mktemp /tmp/sme-yacht-sales.XXXXXX.tar.gz)"
  extract_dir="$(mktemp -d /tmp/sme-yacht-sales.XXXXXX)"

  log "尝试下载仓库归档包..."
  if ! curl --http1.1 -fL --retry 3 --connect-timeout 20 "$ARCHIVE_URL" -o "$archive_file"; then
    rm -f "$archive_file"
    rm -rf "$extract_dir"
    return 1
  fi

  if ! tar -xzf "$archive_file" -C "$extract_dir"; then
    rm -f "$archive_file"
    rm -rf "$extract_dir"
    return 1
  fi

  extracted_root="$(find "$extract_dir" -mindepth 1 -maxdepth 1 -type d | head -n 1)"
  if [ -z "$extracted_root" ]; then
    rm -f "$archive_file"
    rm -rf "$extract_dir"
    return 1
  fi

  rm -rf "$APP_DIR"
  mkdir -p "$APP_DIR"
  cp -a "$extracted_root"/. "$APP_DIR"/

  rm -f "$archive_file"
  rm -rf "$extract_dir"
  return 0
}

clone_repository() {
  log "尝试克隆仓库..."
  git config --global http.postBuffer 524288000
  git config --global http.version HTTP/1.1

  if git clone "$REPO_URL" "$APP_DIR"; then
    return 0
  fi

  warn "官方地址连接失败，尝试镜像加速..."
  if git clone "$MIRROR_REPO_URL" "$APP_DIR"; then
    return 0
  fi

  warn "镜像克隆失败，尝试下载仓库归档包..."
  if download_repo_archive; then
    return 0
  fi

  return 1
}

upsert_env_value() {
  local file_path="$1"
  local env_key="$2"
  local env_value="$3"

  if [ ! -f "$file_path" ]; then
    return 1
  fi

  if grep -q "^${env_key}=" "$file_path"; then
    sed -i "s|^${env_key}=.*|${env_key}=\"${env_value}\"|" "$file_path"
  else
    printf '\n%s="%s"\n' "$env_key" "$env_value" >>"$file_path"
  fi
}

ensure_env_file() {
  if [ ! -f ".env" ] && [ -f ".env.example" ]; then
    cp .env.example .env
    warn "已根据 .env.example 创建 .env，请在部署完成后及时修改默认管理账号和密钥。"
  fi
}

load_env_file() {
  if [ -f ".env" ]; then
    set -a
    . ./.env
    set +a
  fi
}

start_database() {
  local postgres_image
  local candidates=(
    "${POSTGRES_IMAGE:-$DEFAULT_POSTGRES_IMAGE}"
    "$MIRROR_POSTGRES_IMAGE"
  )

  for postgres_image in "${candidates[@]}"; do
    log "尝试启动数据库镜像: ${postgres_image}"
    if sudo env POSTGRES_IMAGE="$postgres_image" docker compose up -d db; then
      if [ -f ".env" ]; then
        upsert_env_value ".env" "POSTGRES_IMAGE" "$postgres_image" || true
      fi
      return 0
    fi

    warn "数据库镜像启动失败: ${postgres_image}"
  done

  fail "数据库启动失败。已依次尝试 Docker Hub 和镜像源拉取 PostgreSQL 镜像。若仍失败，请检查服务器到 Docker 镜像站的网络连通性，或手动设置 POSTGRES_IMAGE 后重试。"
}

init_environment() {
  log "开始环境初始化..."

  log "优化 DNS 解析..."
  echo "nameserver 223.5.5.5" | sudo tee /etc/resolv.conf >/dev/null

  log "安装基础工具..."
  reset_nodesource_repo
  sudo apt update
  sudo apt install -y curl git wget ca-certificates gnupg build-essential unzip

  if command -v node >/dev/null 2>&1 && node -v | grep -qE "v(2[0-9]|22)"; then
    log "Node.js 已安装且版本符合要求: $(node -v)"
  else
    install_nodejs
  fi

  if command -v docker >/dev/null 2>&1; then
    log "Docker 已安装: $(docker --version)"
  else
    log "安装 Docker..."
    sudo apt install -y docker.io docker-compose-v2
    sudo systemctl enable --now docker
    sudo usermod -aG docker "$USER"
    warn "已将当前用户加入 docker 组，如果报错请重新登录 SSH。"
  fi

  log "配置 PM2（使用 npmmirror）..."
  sudo npm install -g pm2 --registry=https://registry.npmmirror.com

  if [ ! -d "$APP_DIR" ]; then
    clone_repository || fail "代码获取失败。已依次尝试官方 Git、镜像 Git、仓库归档包下载。若仍失败，请从本地上传 ZIP 包到服务器后解压到 $APP_DIR。"
  fi

  cd "$APP_DIR"
  ensure_env_file
  load_env_file

  log "安装项目依赖（使用 npmmirror）..."
  npm install --registry=https://registry.npmmirror.com

  log "启动数据库..."
  start_database

  log "同步数据库结构..."
  npx prisma db push
  npm run prisma:seed

  log "构建生产版本..."
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
  load_env_file
  git config --global http.version HTTP/1.1
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
