# Stock Monitor - GitHub Actions Deployment

Real-time stock price monitoring with custom stock management and price alerts.

## 🚀 GitHub Actions 部署方案

### 方案1：部署到你自己的服务器（推荐）

使用 `.github/workflows/deploy.yml`

**配置步骤：**

1. **Fork 或创建 GitHub 仓库**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/stock-monitor.git
   git push -u origin main
   ```

2. **配置 GitHub Secrets**
   
   在 GitHub 仓库页面：Settings > Secrets and variables > Actions > New repository secret
   
   添加以下 secrets：
   
   | Secret Name | Description | Example |
   |------------|-------------|---------|
   | `SSH_PRIVATE_KEY` | 你的服务器 SSH 私钥 | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
   | `SSH_HOST` | 服务器 IP 或域名 | `123.45.67.89` 或 `yourdomain.com` |
   | `SSH_USER` | SSH 用户名 | `root` 或 `ubuntu` |
   | `SSH_PORT` | SSH 端口（可选，默认22）| `22` |

3. **准备你的服务器**
   
   确保服务器已安装：
   ```bash
   # Node.js 20
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # 或者使用 nvm
   ```

4. **推送代码触发部署**
   ```bash
   git push origin main
   ```

   GitHub Actions 会自动：
   - ✅ 构建 React 前端
   - ✅ 打包应用
   - ✅ SSH 连接到你的服务器
   - ✅ 上传并部署
   - ✅ 启动服务

---

### 方案2：在 GitHub Actions Runner 上临时运行

使用 `.github/workflows/run-on-github.yml`

**特点：**
- 完全免费，不需要自己的服务器
- 使用 ngrok 获取公网访问地址
- 每次最多运行 6 小时
- 适合临时测试或演示

**使用方法：**

1. **配置 ngrok token**
   
   注册 [ngrok](https://ngrok.com/) 获取 authtoken
   
   添加到 GitHub Secrets：`NGROK_AUTHTOKEN`

2. **手动触发工作流**
   
   GitHub 仓库页面 > Actions > "Run Stock Monitor on GitHub Actions Runner" > Run workflow

3. **查看日志获取访问地址**
   
   在 workflow 日志中会显示：
   ```
   🎉 Application is running!
   
   🔗 Public URLs:
      Frontend: https://xxxxx.ngrok.io
   ```

---

### 方案3：Docker 部署（独立服务器或云主机）

```bash
# 克隆代码
git clone https://github.com/yourusername/stock-monitor.git
cd stock-monitor

# Docker Compose 启动
docker-compose up -d

# 查看日志
docker-compose logs -f
```

---

## 📋 目录结构

```
.
├── .github/
│   └── workflows/
│       ├── deploy.yml              # 部署到自有服务器
│       └── run-on-github.yml       # 在 GitHub Actions 运行
├── src/                            # React 前端源码
├── server.js                       # Express 后端
├── Dockerfile                      # Docker 构建
├── docker-compose.yml              # Docker Compose 配置
└── package.json
```

---

## 🔧 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm start          # React 开发服务器 (port 3000)
node server.js     # 后端 API (port 3001) - 另开终端

# 生产构建
npm run build
./start.sh         # 启动前后端
```

---

## 🔒 安全配置

### 生成 SSH 密钥对

```bash
# 在本地生成密钥对
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions

# 查看私钥（复制到 GitHub Secrets）
cat ~/.ssh/github_actions

# 添加公钥到服务器
cat ~/.ssh/github_actions.pub | ssh user@your-server "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

### 防火墙设置

确保服务器开放端口：
- `3000` - 前端
- `3001` - 后端 API

```bash
# Ubuntu/Debian
sudo ufw allow 3000/tcp
sudo ufw allow 3001/tcp
```

---

## 🐛 故障排除

### 部署失败

查看 GitHub Actions 日志：
Actions 标签 > 点击失败的 workflow > 查看具体步骤日志

### 服务无法访问

SSH 到服务器检查：
```bash
# 检查进程
ps aux | grep node

# 检查端口
sudo lsof -i :3000
sudo lsof -i :3001

# 查看日志
tail -f ~/stock-monitor/server.log
tail -f ~/stock-monitor/frontend.log
```

### 权限问题

确保部署目录权限正确：
```bash
chmod 755 ~/
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

---

## 💡 推荐使用场景

| 场景 | 推荐方案 | 成本 | 稳定性 |
|-----|---------|------|--------|
| 个人使用/测试 | GitHub Actions + ngrok | 免费 | ⭐⭐ |
| 长期运行 | 自己的 VPS/云服务器 | $5-10/月 | ⭐⭐⭐⭐⭐ |
| 团队使用 | 自己的 VPS/云服务器 | $5-10/月 | ⭐⭐⭐⭐⭐ |
| 高可用 | 多台服务器 + 负载均衡 | $20+/月 | ⭐⭐⭐⭐⭐ |

---

## 📞 支持

有问题请提交 GitHub Issue。

**API 端点：**
- `GET /api/health` - 健康检查
- `GET /api/stocks` - 股票列表
- `POST /api/stocks` - 添加股票
- `GET /api/stock/:key` - 获取股票数据
- `GET /api/alerts` - 价格提醒
