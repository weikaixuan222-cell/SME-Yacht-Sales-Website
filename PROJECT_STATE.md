# PROJECT_STATE.md

## 项目
小微企业游艇售卖网站

## 当前阶段
项目已进入“前后台最小真实闭环 + 最小管理员鉴权保护 + SecuAI 最小接入层已打通”的阶段。

## 已确认方向
- 继续以 MVP 为边界推进，不扩展支付、多商家、复杂 CRM / ERP。
- 前台主链路保持：首页 -> 游艇列表 -> 游艇详情 -> 提交询盘。
- 后台主链路保持：管理员登录 -> 后台查看询盘 -> 后台查看/新增/编辑/删除游艇。
- 当前工程基座固定为 Next.js App Router + TypeScript + Tailwind CSS + Prisma + PostgreSQL。
- SecuAI 接入只在仓库代码层完成，不处理 Nginx、远程虚拟机网络或部署架构。

## 当前能力
- 已完成 Docker PostgreSQL 本地启动方式、Prisma migration 与 seed。
- 已完成前台游艇列表、详情、询盘提交真实数据库链路。
- 已完成后台询盘查看与后台游艇 CRUD 真实数据库链路。
- 已完成最小管理员登录、后台页面保护、后台管理接口保护、退出登录。
- 已完成 SecuAI 最小接入层：环境变量配置、请求封装、Next.js middleware 页面请求检查、默认 fail-open、平台明确 block 时返回 403。

## 最新验证
- 已执行 `npm run test -- tests/secuai.test.ts`。
- 已执行 `npm run typecheck`。
- 已执行 `npm run build`。
- 已执行 `npm run smoke`。
- 已执行本地基本访问验证，确认未配置真实 SecuAI 平台时站点按 fail-open/disabled 方式继续可访问。

## 当前风险
- SecuAI 真实平台联调尚未在本仓库内完成，需要填入真实 `SECUAI_PLATFORM_URL`、`SECUAI_SITE_ID` 与 `SECUAI_SITE_INGESTION_KEY` 后再验证 allow / monitor / block。
- 当前 SecuAI 接入只覆盖页面请求，主动跳过 `_next`、静态资源和 `/api` 路由。
- 当前管理员鉴权仍未做到复杂角色权限、密码重置、会话吊销。
- 当前只验证了 Windows 本地环境，Ubuntu 24 尚未实机验证。

## 下一步建议
- 先由使用方手动完成 SecuAI 平台地址、站点 ID、ingestion key 与远端网络连通配置。
- 再做一次真实平台联调，分别验证 allow、monitor、block 和平台不可用时 fail-open。
- 如联调稳定，再考虑是否把部分关键 API 也纳入 SecuAI 检查；当前轮次不扩展。
