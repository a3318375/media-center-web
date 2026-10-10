# FRAME 媒体中心 Web

基于 React、TypeScript、Vite、Tailwind CSS 4 和 shadcn/ui 的媒体管理前端。

## 本地开发

```bash
pnpm install
pnpm dev
```

开发环境使用 MSW 模拟登录相关接口。演示账号为 `admin`，密码为 `123456`。生产构建不会启用模拟接口，需由后端提供对应的认证 API。

## 常用命令

```bash
pnpm lint
pnpm build
pnpm preview
```

## 目录说明

- `src/layouts/media-shell`：应用侧栏、顶栏、导航和用户面板。
- `src/components`：登录页、设置页和 shadcn/ui 组件。
- `src/lib/auth-api.ts`：登录、登出和当前用户 API 封装。
- `src/mocks`：开发环境的 MSW 认证接口。
