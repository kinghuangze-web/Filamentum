
# 部署指南：将 3D 工坊发布到 Vercel

本指南将指导您将 **3D 创作工坊** 部署到 Vercel 云平台，并绑定您的自定义域名。

## 前置准备：提交代码

您的项目目前已经初始化了 Git，但需要提交代码。请在终端执行以下命令：

1. **配置身份** (如果之前没配过):
   ```powershell
   git config user.name "Your Name"
   git config user.email "your@email.com"
   ```

2. **提交代码**:
   ```powershell
   git add .
   git commit -m "Initial commit"
   ```

## 第一步：推送到 GitHub

1. 登录 [GitHub](https://github.com/)，点击右上角 **+** 号，选择 **New repository**。
2. **Repository name** 填入 `my-3d-app` (或任意名字)。
3. 选择 **Private** (推荐，保护您的代码) 或 Public。
4. 点击 **Create repository**。
5. 在创建完成的页面，找到 "...or push an existing repository from the command line" 这一栏，复制那三行代码，在您的 VS Code 终端里运行：

   ```powershell
   git remote add origin https://github.com/您的用户名/my-3d-app.git
   git branch -M main
   git push -u origin main
   ```

## 第二步：在 Vercel 导入

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard) 并登录 (推荐直接用 GitHub 登录)。
2. 点击 **Add New...** -> **Project**。
3. 在左侧列表里找到您刚才创建的 `my-3d-app`，点击 **Import**。
4. **Configure Project** 页面：
   *   **Framework Preset**: Next.js (默认)
   *   **Root Directory**: `./` (默认)
   *   其他不用动。
5. 点击 **Deploy**。

等待约 1-2 分钟，看到满屏彩带喷射，说明部署成功！

## 第三步：绑定域名

1. 在 Vercel 项目页面，点击顶部的 **Settings** -> **Domains**。
2. 输入您的 `xyz` 域名 (例如 `workshop.yourname.xyz`)，点击 **Add**。
3. Vercel 会给您提示 DNS 记录。
4. 去您的域名注册商 (阿里云/腾讯云等) 后台，添加一条 **CNAME 记录**：
   *   **记录类型**: CNAME
   *   **主机记录**: `workshop` (如果是主域名填 `@`)
   *   **记录值**: `cname.vercel-dns.com`
5. 回到 Vercel 等待验证通过 (通常几分钟)。

## 第四步：关键！数据怎么存？

Vercel 是"无状态"的，这意味着它**不能保存**您在网页上添加的耗材数据到服务器。一旦刷新或重新部署，数据就会重置。

**解决办法：连接本地保险箱**

1. 打开您部署好的网站链接。
2. 点击右上角的 **"连接本地保险箱"** 按钮。
3. 浏览器会弹窗请求权限，请选择您电脑上 `my-3d-app` 文件夹里的 `data` 目录（或者任意您想用来存数据的文件夹）。
4. **成功连接后**：
   *   网站会直接读取您电脑这个文件夹里的 `filaments.json`。
   *   您在网站上新增/修改/删除耗材，都会直接保存到您电脑的硬盘里！
   *   这样既享受了云端访问并分享给朋友的便利，数据又安全地在自己手里。

---
**常见问题**

*   **Q: 修改代码怎么更新？**
    *   A: 本地修改完代码 -> `git add .` -> `git commit -m "update"` -> `git push`。Vercel 会自动检测到 GitHub 的变化并自动重新部署。
*   **Q: 只有我能访问本地数据吗？**
    *   A: 是的。File System Access API 是浏览器和您本机的文件交互。即使把网站发给朋友，他打开后连的是**他自己**的保险箱（如果他有数据的话），看不到您的本地数据。这非常适合作为个人工具使用。
