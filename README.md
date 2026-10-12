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

## TMDB 探索

开发时连接真实后端会话与设置，并保留未实现页面的 mock：

```bash
VITE_BACKEND_AUTH=true VITE_API_PROXY_TARGET=http://127.0.0.1:18080 pnpm dev
```

后端对应设置 `HTTP_ADDR=127.0.0.1:18080`，先初始化/登录，再在「全局设置 → TMDB」输入官方 API Key。未配置时探索显示服务端错误，不回退演示作品。探索 TMDB 请求和原生 ID 详情、TMDB 设置始终穿透 MSW；其他页面仍保留原有 mock。生产环境需要同源 `/api` 反向代理，Vite 开发代理不包含在 dist 中。

探索支持电影/电视剧、各自类型、产地、年份、排序、服务端分页（20 条）和卡片详情。标题搜索期间类型/产地/排序筛选禁用，保留媒体类型和年份。筛选变更取消旧请求、重置分页，详情使用原生 providerId 与 mediaType，不转换 demo ID。未知年份、海报或评分展示缺失状态，不生成真实作品数据。

正式媒体契约位于 `src/lib/media-contract.ts`；mock 契约文件只重导出正式类型，mock 卡片类型依赖正式 Summary。身份含 provider/mediaType/providerId，mediaId 带类型，source/sourceId 保留兼容。探索响应直接使用 Summary，移除 people 和演示卡片必填字段，total 可为 null；详情类型必传 movie/tv。接口、错误语义与缓存取舍详见后端 README。

2026-10-12 实际验证：`pnpm run typecheck`（tsc --noEmit）、`pnpm run lint`（eslint .）、`pnpm run build`（tsc -b + Vite）均退出 0。构建转换 2393 个模块，主 JS 约 588 kB，存在超过 500 kB 的 chunk 警告。后端 build/vet/test 同样通过；所有上游测试使用进程内 httptest 假上游。没有真实 Key，未验证真实 TMDB/图片 CDN 与浏览器联调；其他来源、人物、榜单、下载和资源搜索不在本轮范围。
