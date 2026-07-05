# 族谱网站部署指南

本文档介绍如何将族谱网站从本地开发环境部署到 Linux 生产服务器。

## 1. 环境要求

- **操作系统**：Ubuntu 20.04+ / CentOS 7+ / Debian 10+
- **Node.js**：v18 或更高版本
- **包管理器**：npm（自带）或 pnpm
- **Web 服务器**：Nginx（推荐）
- **进程守护**：PM2（推荐）

## 2. 服务器目录准备

在服务器上创建项目目录，例如：

```bash
sudo mkdir -p /www/wwwroot/family
sudo chown -R $USER:$USER /www/wwwroot/family
```

后续把项目文件上传到这个目录。

## 3. 上传项目文件

从本地 Windows 开发项目时，不要把 `node_modules/`、`.next/`、日志文件传上去。需要上传的内容：

```
族谱网站/
├── data/
│   └── family.json
├── images/
├── css/
├── js/
├── admin.html
├── index.html
├── package.json
├── server.js
├── ecosystem.config.js
└── README.md
```

上传方式任选其一：

- **SCP / rsync**：`scp -r . user@server:/www/wwwroot/family/`
- **FTP / SFTP**：使用 FileZilla、WinSCP 等工具
- **Git**：服务器 `git clone` 拉取仓库

> 注意：如果 `images/` 或 `data/family.json` 里有真实数据，务必一起上传或后续导入。

## 4. 安装依赖

登录服务器，进入项目目录：

```bash
cd /www/wwwroot/family
npm install
```

## 5. 启动服务

### 5.1 临时启动（测试用）

```bash
npm start
```

默认监听 `http://0.0.0.0:3000`。浏览器访问 `http://服务器IP:3000` 测试是否正常。

按 `Ctrl+C` 停止。

### 5.2 生产环境使用 PM2 守护

全局安装 PM2（如未安装）：

```bash
npm install -g pm2
```

启动项目：

```bash
pm2 start ecosystem.config.js
```

常用命令：

```bash
pm2 status                 # 查看运行状态
pm2 logs family-tree       # 查看日志
pm2 restart family-tree    # 重启
pm2 stop family-tree       # 停止
pm2 delete family-tree     # 删除进程
pm2 startup                # 生成开机自启脚本
pm2 save                   # 保存当前进程列表
```

## 6. Nginx 反向代理

安装 Nginx：

```bash
sudo apt update
sudo apt install nginx
```

新建站点配置文件：

```bash
sudo nano /etc/nginx/sites-available/family
```

写入以下内容：

```nginx
server {
    listen 80;
    server_name yourdomain.com;  # 改成你的域名或服务器IP

    client_max_body_size 20M;

    # 头像图片目录：上传后由 Node.js 保存到 /www/wwwroot/family/images/，Nginx 直接读取
    location ^~ /images/ {
        alias /www/wwwroot/family/images/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    location ^~ /css/ {
        alias /www/wwwroot/family/css/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    location ^~ /js/ {
        alias /www/wwwroot/family/js/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # 上传接口 /api/upload 和数据接口 /api/data 由 Node.js 处理
    # Nginx 通过 location / 把请求转发给后端
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/family /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 7. 配置 HTTPS（可选）

使用 Certbot 申请免费 SSL 证书：

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

证书会自动续期。

## 8. 数据备份与迁移

### 8.1 备份

重要数据包括：

- `data/family.json`：所有成员数据
- `images/`：所有头像图片

定期备份：

```bash
rsync -avz /www/wwwroot/family/data/ backup/family/data/
rsync -avz /www/wwwroot/family/images/ backup/family/images/
```

### 8.2 迁移到新服务器

1. 在新服务器安装 Node.js、Nginx、PM2。
2. 上传项目文件。
3. 复制 `data/family.json` 和 `images/` 到新服务器对应位置。
4. 运行 `npm install`。
5. 启动 PM2 并配置 Nginx。

## 9. 更新代码

更新代码后，在服务器执行：

```bash
cd /www/wwwroot/family
git pull          # 如果用 Git 部署
npm install       # 依赖有变化时
pm2 restart family-tree
```

## 10. 常见问题

### 10.1 图片上传后 404

族谱网站的上传流程是：前端 → Nginx → Node.js `/api/upload` → 保存到服务器 `/www/wwwroot/family/images/` → 浏览器通过 `http://yourdomain.com/images/xxx.jpg` 读取。

上传后如果读取 404，请检查：

1. Nginx 配置里的 `location ^~ /images/` 路径是否指向正确目录。
2. `images/` 文件夹是否存在，Nginx 是否有读取权限。
3. `data/family.json` 里的 `photo` 字段是否保存为 `/images/xxx.jpg` 格式。

```bash
ls -la /www/wwwroot/family/images/
```

### 10.2 后台保存后数据丢失

确保 PM2 运行的是 `server.js`，且 `data/family.json` 文件有写入权限：

```bash
chmod 664 /www/wwwroot/family/data/family.json
```

### 10.3 端口被占用

如果 3000 端口被占用，可以修改 `ecosystem.config.js` 和 `server.js` 中的端口，或在启动时指定：

```bash
PORT=3001 npm start
```

### 10.4 上传大文件失败

确保 Nginx 配置了 `client_max_body_size 20M;`，且 Node.js 的 Multer 限制足够大。

## 11. 默认访问地址

- 前台：`http://yourdomain.com/`
- 后台：`http://yourdomain.com/admin.html`
- 默认后台密码：`admin123`（部署后请自行修改）

