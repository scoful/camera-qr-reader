# 📷 Camera QR Reader

一个基于 Next.js 的现代化二维码工具，支持 PC 摄像头扫码、二维码生成、文件上传和短链接服务。专为电脑↔手机跨设备传输场景设计。

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fscoful%2Fcamera-qr-reader&project-name=camera-qr-reader&repository-name=camera-qr-reader)

## ✨ 核心功能

### 📸 二维码扫描
- 使用 PC 摄像头实时扫描二维码
- 自动识别并高亮文本中的多个 URL
- 识别 R2 图片链接，支持进入图片编辑模式
- 自动解析短链接，还原原始内容
- 扫描历史记录管理，一键复制

### 🎨 二维码生成
- 输入文本或 URL 即时生成二维码
- 支持短码模式：长内容转短链接，生成更清晰的二维码
- 下载为 PNG 图片

### 📤 文件上传
- 上传文件到 Cloudflare R2，自动生成公开访问链接
- 支持 Ctrl+V 粘贴截图直接上传
- 密码保护，防止未授权上传

### 🔗 短链接服务
- 长文本/URL 转短码（基于 Cloudflare KV）
- 扫码自动识别并解析短链接
- 7 天自动过期
- 密码保护

### 📱 iOS 快捷指令集成
- 通过分享菜单触发上传
- 手动触发：剪贴板生成二维码 / 扫描到剪贴板
- 支持根据内容长度自动选择是否使用短码

### 🌐 国际化
- 中文 / English 双语支持

## 🛠️ 技术栈

- **框架**: [Next.js 15](https://nextjs.org) (Pages Router, React 19)
- **语言**: TypeScript
- **样式**: [Tailwind CSS 4](https://tailwindcss.com)
- **代码质量**: [Biome](https://biomejs.dev)
- **二维码扫描**: [html5-qrcode](https://github.com/mebjas/html5-qrcode)
- **二维码生成**: [qrcode.react](https://github.com/zpao/qrcode.react)
- **国际化**: [next-intl](https://next-intl-docs.vercel.app)
- **对象存储**: Cloudflare R2 (via AWS S3 SDK)
- **键值存储**: Cloudflare KV (短链接)
- **包管理器**: pnpm

## 🚀 快速开始

### 环境要求
- Node.js 20+
- pnpm 9.6.0+

### 安装依赖
```bash
pnpm install
```

### 配置环境变量
```bash
cp .env.example .env
```

编辑 `.env` 文件，填入你的配置：

| 变量 | 必填 | 说明 |
|------|------|------|
| `R2_ACCOUNT_ID` | ✅ | Cloudflare 账户 ID |
| `R2_ACCESS_KEY_ID` | ✅ | R2 Access Key ID |
| `R2_SECRET_ACCESS_KEY` | ✅ | R2 Secret Access Key |
| `R2_BUCKET_NAME` | ✅ | R2 存储桶名称 |
| `R2_PUBLIC_DOMAIN` | ✅ | R2 公共访问域名 |
| `NEXT_PUBLIC_R2_PUBLIC_DOMAIN` | ✅ | 同上（客户端可访问） |
| `ACCESS_PASSWORD` | 可选 | 上传和短链接的访问密码 |
| `CF_KV_NAMESPACE_ID` | 可选 | Cloudflare KV 命名空间 ID（短链接功能） |
| `CF_KV_API_TOKEN` | 可选 | Cloudflare KV API Token（短链接功能） |

### 开发模式
```bash
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

### 构建生产版本
```bash
pnpm build
pnpm start
```

## 📜 可用脚本

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动开发服务器 (Turbo 模式) |
| `pnpm build` | 构建生产版本 |
| `pnpm start` | 启动生产服务器 |
| `pnpm preview` | 构建并预览生产版本 |
| `pnpm check` | 运行 Biome 代码检查 |
| `pnpm check:write` | 自动修复代码问题 |
| `pnpm typecheck` | TypeScript 类型检查 |

## 📁 项目结构

```
camera-qr-reader/
├── src/
│   ├── components/
│   │   ├── QrScanner.tsx          # 二维码扫描器（html5-qrcode 封装）
│   │   ├── ScanTab.tsx            # 扫描标签页
│   │   ├── GenerateTab.tsx        # 生成标签页（输入 + 短码 + 上传）
│   │   ├── GeneratedQrPreview.tsx # 二维码预览与下载
│   │   ├── ScanHistory.tsx        # 扫描历史列表
│   │   ├── HelpModal.tsx          # 帮助弹窗
│   │   └── PasswordModal.tsx      # 密码认证弹窗
│   ├── hooks/
│   │   ├── useFileUpload.ts       # 文件上传与密码认证
│   │   ├── useScanHistory.ts      # 扫描历史与短码解析
│   │   └── useShortCode.ts        # 短码生成
│   ├── lib/
│   │   └── kv.ts                  # Cloudflare KV 操作封装
│   ├── pages/
│   │   ├── _app.tsx               # App 入口
│   │   ├── index.tsx              # 主页面（布局与组合）
│   │   ├── download.tsx           # 图片预览与编辑
│   │   ├── s/[code].tsx           # 短链接重定向/展示
│   │   └── api/
│   │       ├── shorten.ts         # 短链接 API
│   │       └── r2/
│   │           ├── presign.ts     # R2 预签名 URL
│   │           └── download.ts    # R2 文件下载
│   ├── types/
│   │   └── index.ts               # 共享类型定义
│   ├── utils/
│   │   └── url.ts                 # URL 提取与 R2 工具函数
│   ├── config/
│   │   └── constants.ts           # 常量配置
│   └── env.js                     # 环境变量校验（t3-env）
├── messages/
│   ├── en.json                    # 英文翻译
│   └── zh.json                    # 中文翻译
├── version.json                   # 版本信息
└── package.json
```

## 🌐 浏览器兼容性

- Chrome/Edge 90+
- Safari 14+
- Firefox 88+

**注意**: 摄像头功能需要 HTTPS 环境（localhost 除外）

## 📝 开发说明

### 代码规范
项目使用 Biome 进行代码格式化和 Lint 检查：
- 自动排序 import 语句
- 自动排序 Tailwind CSS 类名
- 强制类型安全

## 📦 部署

### Vercel (推荐)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fscoful%2Fcamera-qr-reader&project-name=camera-qr-reader&repository-name=camera-qr-reader)

部署时在 Vercel 项目设置中配置环境变量即可。如果暂时不需要 R2/KV 功能，可以设置 `SKIP_ENV_VALIDATION=1` 跳过环境变量校验。

## 🙏 致谢

基于 [T3 Stack](https://create.t3.gg/) 构建。
