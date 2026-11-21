# MODFORM · Your car. Styled your way.

MODFORM 汽车用品与车居美学独立站（Python 3 + SQLite 零依赖全栈架构），包含买家双语商城前台、全量可视化装修与商品运营后台、服务端原子核价及安全加固接口。

## 目录结构

| 文件 / 目录 | 职责说明 |
| :--- | :--- |
| `server.py` | 唯一权威后端服务（Python 3 标准库 + SQLite），提供静态文件白名单隔离、安全响应头、PBKDF2 鉴权、服务端核价与 HMAC-SHA256 支付回调验签 |
| `index.html` / `script.js` | 买家商城前台（支持中英双语、车型适配筛选、购物车、结算、订单与售后查询） |
| `admin.html` / `admin.js` | 商家运营与 CMS 装修后台（商品多 SKU 管理、订单发货、RMA 审批、390px 实时预览、数据备份） |
| `data.js` / `style.css` | 共享配置、辅助函数与暗黑极简视觉样式系统 |
| `assets/` | 经 WebP 压缩优化的静态图片、品牌 SVG 图标及按需懒加载的全国省市区数据 (`china-regions.json`) |
| `.env.example` / `.gitignore` | 环境变量模板与版本控制忽略规则 |
| `robots.txt` / `sitemap.xml` / `manifest.json` | 搜索引擎爬虫与 PWA 基础清单 |

## 快速启动

1. 复制环境变量模板并设置强密码：
   ```bash
   cp .env.example .env
   # 编辑 .env 中的 ADMIN_INIT_PASSWORD
   ```
2. 启动服务（要求 Python 3.8+）：
   ```bash
   python3 server.py
   ```
3. 访问地址：
   - 买家前台：`http://localhost:8000/index.html`
   - 商家后台：`http://localhost:8000/admin.html`

## 核心 API 概览

- 公开接口：`GET /api/bootstrap`、`POST /api/auth/register`、`POST /api/auth/login`、`POST /api/orders/create`、`POST /api/orders/lookup`、`POST /api/newsletter/subscribe`、`POST /api/contact/add`、`POST /api/qa/add`
- 买家鉴权接口（`X-Buyer-Token`）：`GET /api/orders/my`、`POST /api/orders/cancel`、`POST /api/orders/rma`、`POST /api/reviews/add`、`POST /api/upload-image`
- 管理员鉴权接口（`X-Admin-Token`）：`POST /api/admin/login`、`GET /api/admin/verify`、`GET /api/admin/bootstrap`、`POST /api/store`、`POST /api/admin/change-password`、`GET /api/admin/backup`、`POST /api/admin/restore`
- 支付回调接口：`POST /api/pay/webhook`（强制 `X-Webhook-Signature` HMAC-SHA256 验签或管理员 Token）

## 公网上线前检查清单

- [ ] 通过 `.env` 设置高强度 `ADMIN_INIT_PASSWORD`，并在首次登录后在后台修改密码
- [ ] 在 Nginx / Caddy / Cloudflare 反向代理层开启 HTTPS、HSTS 与 Gzip/Brotli 压缩
- [ ] 在前台页脚、用户协议与隐私政策中补充真实运营主体名称、客服邮箱及 ICP/网安备案信息
- [ ] 配置定时备份脚本定期导出 SQLite 数据库文件（`modform.db`）
