# 腾讯云生产环境一键部署脚本
# 使用方法：在服务器上运行 bash deploy.sh

set -e

echo "=========================================="
echo "  参天AI - 生产环境部署脚本"
echo "=========================================="

# ─── 配置变量（根据实际情况修改） ───
APP_DIR="/opt/cantian-ai"
NODE_VERSION="22"
DOMAIN="${DOMAIN:-cantian.yourdomain.com}"  # 替换为你的域名
DIFY_ENDPOINT="${DIFY_ENDPOINT:-https://api.dify.ai/v1}"

# ─── 1. 系统更新与基础依赖 ───
echo ""
echo "[1/6] 安装系统依赖..."
sudo apt-get update -y
sudo apt-get install -y curl git nginx certbot python3-certbot-nginx ufw

# ─── 2. 安装 Node.js ───
echo ""
echo "[2/6] 安装 Node.js ${NODE_VERSION}..."
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
echo "Node.js $(node -v) 已就绪"

# ─── 3. 安装 Docker ───
echo ""
echo "[3/6] 安装 Docker..."
if ! command -v docker &> /dev/null; then
  curl -fsSL https://get.docker.com | sudo bash
  sudo usermod -aG docker $USER
fi
echo "Docker $(docker --version) 已就绪"

# ─── 4. 部署 Dify（自部署版） ───
echo ""
echo "[4/6] 部署 Dify..."
DIFY_DIR="/opt/dify"

if [ ! -d "$DIFY_DIR" ]; then
  sudo mkdir -p $DIFY_DIR
  sudo chown $USER:$USER $DIFY_DIR
  git clone https://github.com/langgenius/dify.git $DIFY_DIR
  cd $DIFY_DIR/docker

  # 复制环境变量模板
  cp .env.example .env

  # 生成随机密钥
  SECRET_KEY=$(openssl rand -hex 32)
  sed -i "s/SECRET_KEY=.*/SECRET_KEY=$SECRET_KEY/" .env

  # 启动 Dify（精简模式：关闭不需要的 sandbox、weaviate）
  cat >> .env << 'EOF'

# ─── 精简配置（省内存） ───
SANDBOX_ENABLED=false
WEAVIATE_ENABLED=false
EOF

  docker compose up -d
  echo "Dify 部署完成，访问 http://localhost:3000"
else
  echo "Dify 已存在，跳过安装。更新请进入 $DIFY_DIR/docker 执行 git pull && docker compose up -d"
fi

# ─── 5. 部署参天AI 应用 ───
echo ""
echo "[5/6] 部署参天AI 应用..."

# 创建应用目录
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR

# 复制项目文件（假设在用户目录下）
if [ -d "$HOME/cantian-project" ]; then
  cp -r $HOME/cantian-project/* $APP_DIR/
fi

cd $APP_DIR

# 安装依赖
npm install

# 创建 .env 配置
cat > .env << EOF
API_PORT=8788
DIFY_API_ENDPOINT=${DIFY_ENDPOINT}
DIFY_API_KEY=${DIFY_API_KEY:-请替换为你的Dify API Key}
EOF

# 构建前端
npm run build

# 创建 PM2 进程管理配置
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: "cantian-api",
    script: "server/index.js",
    env: {
      NODE_ENV: "production",
      API_PORT: 8788
    }
  }]
};
EOF

# 安装 PM2
if ! command -v pm2 &> /dev/null; then
  sudo npm install -g pm2
fi

pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u $USER --hp $HOME

# ─── 6. 配置 Nginx 反向代理 ───
echo ""
echo "[6/6] 配置 Nginx..."

sudo tee /etc/nginx/sites-available/cantian-ai << 'NGINX_EOF'
server {
    listen 80;
    server_name _;

    # 前端静态文件
    root /opt/cantian-ai/dist;
    index index.html;

    # Gzip 压缩（节省带宽）
    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;
    gzip_min_length 256;

    # 静态资源缓存
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API 代理到 Node.js 后端
    location /api/ {
        proxy_pass http://127.0.0.1:8788;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # SSE 流式支持
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 120s;
    }

    # Dify 管理后台代理（可选，建议生产环境用 VPN 或 IP 白名单限制）
    # location /dify/ {
    #     proxy_pass http://127.0.0.1:3000/;
    #     proxy_http_version 1.1;
    #     proxy_set_header Host $host;
    #     proxy_set_header X-Real-IP $remote_addr;
    # }

    # SPA 路由回退
    location / {
        try_files $uri $uri/ /index.html;
    }
}
NGINX_EOF

sudo ln -sf /etc/nginx/sites-available/cantian-ai /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# ─── 7. 配置防火墙 ───
echo ""
echo "配置防火墙..."
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable

# ─── 完成 ───
echo ""
echo "=========================================="
echo "  部署完成！"
echo "=========================================="
echo ""
echo "  前端页面:  http://$(curl -s ifconfig.me)"
echo "  Dify 后台: http://$(curl -s ifconfig.me):3000"
echo "  API 健康:  http://$(curl -s ifconfig.me)/api/health"
echo ""
echo "  后续步骤："
echo "  1. 访问 Dify 后台 http://服务器IP:3000 设置管理员账号"
echo "  2. 在 Dify 中创建工作流应用（参考 docs/dify-workflow-setup.md）"
echo "  3. 将 Dify API Key 填入 .env 文件"
echo "  4. pm2 restart cantian-api"
echo "  5. （可选）配置 SSL 证书: sudo certbot --nginx"
echo ""
