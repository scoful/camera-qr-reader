# 📷 Camera QR Reader

一个基于 Next.js 的现代化二维码工具,支持PC摄像头扫码和二维码生成。

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fscoful%2Fcamera-qr-reader&project-name=camera-qr-reader&repository-name=camera-qr-reader)

## ✨ 核心功能

### 📸 二维码扫描
- 使用PC摄像头实时扫描二维码
- 自动识别 URL 并提供跳转功能
- 扫描历史记录管理
- 一键复制扫描结果

### 🎨 二维码生成
- 输入文本或 URL 生成二维码
- 实时预览生成结果
- 支持下载为 PNG 图片
- 快捷键支持 (Ctrl + Enter)

## 🛠️ 技术栈

- **框架**: [Next.js 15](https://nextjs.org) (React 19)
- **语言**: TypeScript
- **样式**: [Tailwind CSS 4](https://tailwindcss.com)
- **代码质量**: [Biome](https://biomejs.dev)
- **二维码扫描**: [html5-qrcode](https://github.com/mebjas/html5-qrcode)
- **二维码生成**: [qrcode.react](https://github.com/zpao/qrcode.react)
- **包管理器**: pnpm

## 🚀 快速开始

### 环境要求
- Node.js 20+
- pnpm 9.6.0+

### 安装依赖
```bash
pnpm install
```

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
│   │   ├── QrScanner.tsx      # 二维码扫描组件
│   │   ├── QrGenerator.tsx    # 二维码生成组件
│   │   └── QrPreview.tsx      # 二维码预览组件
│   ├── pages/
│   │   ├── _app.tsx           # App 入口
│   │   └── index.tsx          # 主页面
│   ├── styles/
│   │   └── globals.css        # 全局样式
│   └── env.js                 # 环境变量配置
├── public/                    # 静态资源
├── version.json               # 版本信息
└── package.json
```

## 🌐 浏览器兼容性

- Chrome/Edge 90+
- Safari 14+
- Firefox 88+

**注意**: 摄像头功能需要 HTTPS 环境 (localhost 除外)

## 📝 开发说明

### 代码规范
项目使用 Biome 进行代码格式化和 Lint 检查:
- 自动排序 import 语句
- 自动排序 Tailwind CSS 类名
- 强制类型安全

### 组件设计
- **QrScanner**: 封装 html5-qrcode,处理摄像头权限和扫描逻辑
- **QrGenerator**: 文本输入和生成触发
- **QrPreview**: 二维码展示、下载、复制功能

## 🔧 配置

### 环境变量
参考 `.env.example` 创建 `.env` 文件 (如需要)。

### Next.js 配置
查看 `next.config.js` 了解详细配置。

## 📦 部署

### Vercel (推荐)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fscoful%2Fcamera-qr-reader&project-name=camera-qr-reader&repository-name=camera-qr-reader)

## 🙏 致谢

基于 [T3 Stack](https://create.t3.gg/) 构建。
