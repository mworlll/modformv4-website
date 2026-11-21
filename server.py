#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
MODFORM 汽车用品与车居美学独立站 · 全栈安全加固服务端 (Python 3 + SQLite 零依赖版)
安全加固清单：
1. 静态目录严格白名单隔离，禁止外部下载 auto_studio.db / catalog_base.json / server.py 等敏感文件
2. 全站响应注入安全头 (X-Content-Type-Options / X-Frame-Options / Referrer-Policy / Permissions-Policy)
3. /api/bootstrap 仅返回公开商品与脱敏支付配置（绝不泄露订单、用户 PII 与 webhookSecret）
4. /api/admin/bootstrap、/api/store、/api/admin/backup、/api/admin/restore 强制管理员 Token 鉴权
5. 管理员与买家双会话 Token + TTL 过期 + 主动登出吊销 + IP 登录防爆破限流
6. /api/orders/create 从服务端权威目录 catalog_base.json 核价与计算组合购折扣，彻底杜绝前端改价
7. /api/pay/webhook 强制 HMAC-SHA256 验签或管理员 Token，防止伪造支付回调
8. /api/orders/rma 区分买家归属校验与管理员审批鉴权，退款同步回滚总库存与 SKU 库存
9. /api/upload-image 强制登录鉴权、5MB 体积限制与真实图片二进制魔数校验
"""

import base64
import hashlib
import hmac
import json
import os
import re
import secrets
import sqlite3
import threading
import time
from collections import defaultdict
from datetime import datetime
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def load_dotenv_file():
    env_path = os.path.join(BASE_DIR, ".env")
    if not os.path.exists(env_path):
        return
    try:
        with open(env_path, "r", encoding="utf-8") as fh:
            for raw_line in fh:
                line = raw_line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                k = k.strip()
                v = v.strip().strip('"').strip("'")
                if k:
                    os.environ.setdefault(k, v)
    except Exception:
        pass

load_dotenv_file()

_legacy_db = os.path.join(BASE_DIR, "auto_studio.db")
_default_db = _legacy_db if os.path.exists(_legacy_db) else os.path.join(BASE_DIR, "modform.db")
DB_PATH = os.environ.get("MODFORM_DB_PATH") or _default_db
CATALOG_BASE_PATH = os.path.join(BASE_DIR, "catalog_base.json")
UPLOAD_DIR = os.path.join(BASE_DIR, "assets", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

DB_LOCK = threading.RLock()
AUTH_LOCK = threading.RLock()

# 仅允许公网公开读取的商店配置与商品键（绝不包含订单、用户或支付私钥）
PUBLIC_BOOTSTRAP_KEYS = {
    "auto_shop_custom_products",
    "auto_shop_deleted_ids",
    "auto_shop_product_overrides",
    "auto_shop_stock_map",
    "auto_shop_sku_stock_map",
    "auto_shop_reviews",
    "auto_shop_qa",
    "auto_shop_discounts",
    "auto_shop_cms",
    "auto_shop_pay_settings",
}

# 管理员后台专用全量键
ADMIN_ALL_KEYS = PUBLIC_BOOTSTRAP_KEYS | {
    "auto_shop_orders",
    "auto_shop_users",
    "auto_shop_subscribers",
    "auto_shop_contact_messages",
    "auto_shop_audit_logs",
}

# 允许管理员通过 /api/store 写入的键（禁止通过 /api/store 修改管理员密码）
ADMIN_WRITABLE_KEYS = ADMIN_ALL_KEYS

# 静态文件访问严格白名单
STATIC_ROOT_ALLOWLIST = {
    "/index.html",
    "/admin.html",
    "/style.css",
    "/data.js",
    "/script.js",
    "/admin.js",
    "/wechat-qr.jpg",
    "/robots.txt",
    "/sitemap.xml",
    "/manifest.json",
}
STATIC_ASSET_EXT_ALLOWLIST = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".json"}

# 会话与防爆破配置
ADMIN_TOKEN_TTL = 12 * 3600       # 12 小时
BUYER_TOKEN_TTL = 7 * 24 * 3600   # 7 天
RATE_LIMIT_WINDOW = 300           # 5 分钟
RATE_LIMIT_MAX_ATTEMPTS = 5
MAX_JSON_BODY_BYTES = 8 * 1024 * 1024
MAX_UPLOAD_IMAGE_BYTES = 5 * 1024 * 1024

ACTIVE_ADMIN_TOKENS = {}  # token -> expires_at
ACTIVE_BUYER_TOKENS = {}  # token -> {"phone": ..., "name": ..., "expires_at": ...}
LOGIN_FAILURES = defaultdict(list)  # ip -> [timestamp, ...]
ADMIN_RESET_CODES = {}  # contact_lower -> {"code": ..., "expires_at": ...}


def load_base_catalog():
    try:
        if os.path.exists(CATALOG_BASE_PATH):
            with open(CATALOG_BASE_PATH, "r", encoding="utf-8") as f:
                items = json.load(f)
                if isinstance(items, list):
                    return {str(item["id"]): item for item in items if isinstance(item, dict) and item.get("id")}
    except Exception as exc:
        print(f"[WARN] 加载 catalog_base.json 失败: {exc}")
    return {}


BASE_CATALOG_MAP = load_base_catalog()


def hash_password(password: str, salt: str = None) -> str:
    if not salt:
        salt = secrets.token_hex(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000)
    return f"pbkdf2_sha256${salt}${dk.hex()}"


def verify_password(password: str, stored_hash: str) -> bool:
    if not stored_hash:
        return False
    stored_str = str(stored_hash)
    if stored_str.startswith("pbkdf2_sha256$"):
        parts = stored_str.split("$")
        if len(parts) == 3:
            expected = hash_password(password, parts[1])
            return hmac.compare_digest(expected, stored_str)
        return False
    # 仅兼容极早期迁移数据
    return hmac.compare_digest(password, stored_str)


def detect_image_magic(raw_bytes: bytes):
    if len(raw_bytes) < 12:
        return None
    if raw_bytes.startswith(b"\xff\xd8\xff"):
        return "jpg"
    if raw_bytes.startswith(b"\x89PNG\r\n\x1a\n"):
        return "png"
    if raw_bytes.startswith((b"GIF87a", b"GIF89a")):
        return "gif"
    if raw_bytes[:4] == b"RIFF" and raw_bytes[8:12] == b"WEBP":
        return "webp"
    return None


def get_db_conn():
    conn = sqlite3.connect(DB_PATH, timeout=15)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with DB_LOCK, get_db_conn() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS kv_store (
                key TEXT PRIMARY KEY,
                value_json TEXT NOT NULL,
                updated_at REAL NOT NULL
            )
            """
        )
        cur = conn.execute("SELECT value_json FROM kv_store WHERE key = 'auto_shop_admin_pwd'")
        if not cur.fetchone():
            init_pwd = os.environ.get("ADMIN_INIT_PASSWORD", "admin123")
            conn.execute(
                "INSERT INTO kv_store (key, value_json, updated_at) VALUES (?, ?, ?)",
                ("auto_shop_admin_pwd", json.dumps(hash_password(init_pwd)), time.time()),
            )
        conn.commit()


def read_kv(key, default=None):
    with DB_LOCK, get_db_conn() as conn:
        cur = conn.execute("SELECT value_json FROM kv_store WHERE key = ?", (key,))
        row = cur.fetchone()
        if not row:
            return default
        try:
            return json.loads(row["value_json"])
        except Exception:
            return default


def write_kv(key, value):
    with DB_LOCK, get_db_conn() as conn:
        conn.execute(
            """
            INSERT INTO kv_store (key, value_json, updated_at)
            VALUES (?, ?, ?)
            ON CONFLICT(key) DO UPDATE SET
                value_json = excluded.value_json,
                updated_at = excluded.updated_at
            """,
            (key, json.dumps(value, ensure_ascii=False), time.time()),
        )
        conn.commit()


def sanitize_user_for_client(user_obj: dict) -> dict:
    clean = dict(user_obj)
    clean.pop("password", None)
    clean.pop("passwordHash", None)
    return clean


def sanitize_pay_settings_for_public(pay_settings) -> dict:
    if not isinstance(pay_settings, dict):
        return {}
    return {
        "wechatQrImage": pay_settings.get("wechatQrImage", ""),
        "alipayQrImage": pay_settings.get("alipayQrImage", ""),
        "stripePaymentLink": pay_settings.get("stripePaymentLink", ""),
    }


def read_public_bootstrap_store():
    store = {}
    with DB_LOCK, get_db_conn() as conn:
        cur = conn.execute("SELECT key, value_json FROM kv_store")
        for row in cur.fetchall():
            k = row["key"]
            if k not in PUBLIC_BOOTSTRAP_KEYS:
                continue
            try:
                val = json.loads(row["value_json"])
                if k == "auto_shop_pay_settings":
                    val = sanitize_pay_settings_for_public(val)
                store[k] = val
            except Exception:
                pass
    return store


def read_admin_bootstrap_store():
    store = {}
    with DB_LOCK, get_db_conn() as conn:
        cur = conn.execute("SELECT key, value_json FROM kv_store")
        for row in cur.fetchall():
            k = row["key"]
            if k not in ADMIN_ALL_KEYS:
                continue
            try:
                val = json.loads(row["value_json"])
                if k == "auto_shop_users" and isinstance(val, list):
                    val = [sanitize_user_for_client(u) for u in val if isinstance(u, dict)]
                store[k] = val
            except Exception:
                pass
    return store


def build_authoritative_catalog():
    """构建服务端权威商品目录（内置 40 款 + 商家自定义商品 + 后台覆盖配置 - 已删商品）"""
    overrides = read_kv("auto_shop_product_overrides", {}) or {}
    custom_prods = read_kv("auto_shop_custom_products", []) or []
    deleted_ids = set(read_kv("auto_shop_deleted_ids", []) or [])

    catalog = {}
    for pid, base_item in BASE_CATALOG_MAP.items():
        if pid not in deleted_ids:
            catalog[pid] = dict(base_item)
    for cp in custom_prods:
        if isinstance(cp, dict) and cp.get("id"):
            pid = str(cp["id"])
            if pid not in deleted_ids:
                catalog[pid] = dict(cp)
    for pid, ov in overrides.items():
        if pid in catalog and isinstance(ov, dict):
            catalog[pid] = {**catalog[pid], **ov}
    return catalog


def is_rate_limited(client_ip: str) -> bool:
    now = time.time()
    with AUTH_LOCK:
        attempts = [t for t in LOGIN_FAILURES[client_ip] if now - t < RATE_LIMIT_WINDOW]
        LOGIN_FAILURES[client_ip] = attempts
        return len(attempts) >= RATE_LIMIT_MAX_ATTEMPTS


def record_login_failure(client_ip: str):
    with AUTH_LOCK:
        LOGIN_FAILURES[client_ip].append(time.time())


def clear_login_failures(client_ip: str):
    with AUTH_LOCK:
        LOGIN_FAILURES.pop(client_ip, None)


class ModformHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def end_headers(self):
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "SAMEORIGIN")
        self.send_header("Referrer-Policy", "strict-origin-when-cross-origin")
        self.send_header("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
        self.send_header(
            "Content-Security-Policy",
            "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://miaoda.feishu.cn; "
            "font-src 'self' https://miaoda.feishu.cn data:; img-src 'self' data: https:; "
            "connect-src 'self' https://vpic.nhtsa.dot.gov; frame-ancestors 'self'; object-src 'none'; base-uri 'self'"
        )
        super().end_headers()

    def get_client_ip(self) -> str:
        return self.client_address[0] if self.client_address else "unknown"

    def send_json(self, status_code, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def read_raw_body(self, max_bytes=MAX_JSON_BODY_BYTES):
        try:
            length = int(self.headers.get("Content-Length", "0") or "0")
        except ValueError:
            return None, 400
        if length < 0:
            return None, 400
        if length > max_bytes:
            return None, 413
        if length == 0:
            return b"", 200
        return self.rfile.read(length), 200

    def read_json_body(self, max_bytes=MAX_JSON_BODY_BYTES):
        raw, status = self.read_raw_body(max_bytes=max_bytes)
        if status != 200 or not raw:
            return None, status
        try:
            return json.loads(raw.decode("utf-8")), 200
        except Exception:
            return None, 400

    def is_admin_authenticated(self) -> bool:
        token = self.headers.get("X-Admin-Token", "").strip()
        if not token:
            return False
        now = time.time()
        with AUTH_LOCK:
            exp = ACTIVE_ADMIN_TOKENS.get(token)
            if not exp:
                return False
            if exp < now:
                ACTIVE_ADMIN_TOKENS.pop(token, None)
                return False
            return True

    def get_authenticated_buyer(self):
        token = self.headers.get("X-Buyer-Token", "").strip()
        if not token:
            return None
        now = time.time()
        with AUTH_LOCK:
            session = ACTIVE_BUYER_TOKENS.get(token)
            if not session:
                return None
            if session["expires_at"] < now:
                ACTIVE_BUYER_TOKENS.pop(token, None)
                return None
            return session

    def is_safe_static_path(self, req_path: str) -> bool:
        if req_path == "/":
            return True
        if req_path in STATIC_ROOT_ALLOWLIST:
            return True
        if req_path.startswith("/assets/"):
            rel = req_path.lstrip("/")
            full = os.path.realpath(os.path.join(BASE_DIR, rel))
            assets_root = os.path.realpath(os.path.join(BASE_DIR, "assets"))
            if not full.startswith(assets_root + os.sep):
                return False
            ext = os.path.splitext(full)[1].lower()
            return ext in STATIC_ASSET_EXT_ALLOWLIST and os.path.isfile(full)
        return False

    def do_GET(self):
        parsed = urlparse(self.path)

        # 公开前台数据（不含任何订单、用户 PII 或支付密钥）
        if parsed.path == "/api/bootstrap":
            self.send_json(200, {"ok": True, "store": read_public_bootstrap_store()})
            return

        # 管理员鉴权校验
        if parsed.path == "/api/admin/verify":
            if self.is_admin_authenticated():
                self.send_json(200, {"ok": True})
            else:
                self.send_json(401, {"ok": False, "error": "管理员会话无效或已过期"})
            return

        # 管理员全量数据（严格鉴权）
        if parsed.path == "/api/admin/bootstrap":
            if not self.is_admin_authenticated():
                self.send_json(401, {"ok": False, "error": "需要管理员权限"})
                return
            self.send_json(200, {"ok": True, "store": read_admin_bootstrap_store()})
            return

        # 买家查询自己的订单（严格按登录会话隔离）
        if parsed.path == "/api/orders/my":
            buyer = self.get_authenticated_buyer()
            if not buyer:
                self.send_json(401, {"ok": False, "error": "请先登录车主账号查看订单"})
                return
            orders = read_kv("auto_shop_orders", []) or []
            my_orders = [
                o for o in orders
                if isinstance(o, dict) and (o.get("buyerPhone") == buyer["phone"] or o.get("phone") == buyer["phone"])
            ]
            self.send_json(200, {"ok": True, "orders": my_orders})
            return

        # 全站备份导出（严格管理员鉴权）
        if parsed.path == "/api/admin/backup":
            if not self.is_admin_authenticated():
                self.send_json(401, {"ok": False, "error": "需要管理员权限"})
                return
            with DB_LOCK, get_db_conn() as conn:
                cur = conn.execute("SELECT key, value_json FROM kv_store WHERE key != 'auto_shop_admin_pwd'")
                backup_data = {}
                for row in cur.fetchall():
                    try:
                        backup_data[row["key"]] = json.loads(row["value_json"])
                    except Exception:
                        pass
            self.send_json(
                200,
                {
                    "ok": True,
                    "version": "3.0-secured",
                    "exportedAt": datetime.now().isoformat(),
                    "data": backup_data,
                },
            )
            return

        # 静态资源白名单隔离（禁止下载数据库、服务端源码与配置文件）
        if not self.is_safe_static_path(parsed.path):
            self.send_json(403, {"ok": False, "error": "禁止访问受保护的系统文件"})
            return

        if parsed.path == "/":
            self.path = "/index.html"
        return super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        client_ip = self.get_client_ip()

        # 1. 商家管理员登录 / 登出 / 改密
        if parsed.path == "/api/admin/login":
            if is_rate_limited(client_ip):
                self.send_json(429, {"ok": False, "error": "登录尝试过于频繁，请 5 分钟后再试"})
                return
            data, status = self.read_json_body()
            if status != 200 or not isinstance(data, dict):
                self.send_json(status, {"ok": False, "error": "请求格式无效"})
                return
            input_pwd = str(data.get("password") or "")
            stored_pwd = str(read_kv("auto_shop_admin_pwd", ""))
            if stored_pwd and verify_password(input_pwd, stored_pwd):
                clear_login_failures(client_ip)
                token = secrets.token_hex(32)
                with AUTH_LOCK:
                    ACTIVE_ADMIN_TOKENS[token] = time.time() + ADMIN_TOKEN_TTL
                self.send_json(200, {"ok": True, "token": token, "expiresIn": ADMIN_TOKEN_TTL})
            else:
                record_login_failure(client_ip)
                self.send_json(401, {"ok": False, "error": "管理员密码不正确"})
            return

        if parsed.path == "/api/admin/logout":
            token = self.headers.get("X-Admin-Token", "").strip()
            with AUTH_LOCK:
                ACTIVE_ADMIN_TOKENS.pop(token, None)
            self.send_json(200, {"ok": True})
            return

        if parsed.path == "/api/admin/bind-contact":
            if not self.is_admin_authenticated():
                self.send_json(401, {"ok": False, "error": "未授权操作"})
                return
            data, status = self.read_json_body()
            if status != 200 or not isinstance(data, dict):
                self.send_json(status, {"ok": False, "error": "请求格式无效"})
                return
            email = str(data.get("email") or "").strip().lower()[:120]
            phone = str(data.get("phone") or "").strip()[:30]
            if email and not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email):
                self.send_json(400, {"ok": False, "error": "请输入有效的电子邮箱地址"})
                return
            if phone and not re.match(r"^\+?[0-9\-]{6,20}$", phone):
                self.send_json(400, {"ok": False, "error": "请输入有效的手机号"})
                return
            write_kv("auto_shop_admin_contact", {"email": email, "phone": phone})
            self.send_json(200, {"ok": True, "contact": {"email": email, "phone": phone}})
            return

        if parsed.path == "/api/admin/forgot/send-code":
            client_ip = self.get_client_ip()
            if is_rate_limited(client_ip):
                self.send_json(429, {"ok": False, "error": "请求过于频繁，请 5 分钟后再试"})
                return
            data, status = self.read_json_body()
            if status != 200 or not isinstance(data, dict):
                self.send_json(status, {"ok": False, "error": "请求格式无效"})
                return
            contact = str(data.get("contact") or "").strip().lower()
            if not contact:
                self.send_json(400, {"ok": False, "error": "请输入绑定的管理员邮箱或手机号"})
                return
            saved_c = read_kv("auto_shop_admin_contact", {}) or {}
            allowed = set()
            for v in [saved_c.get("email"), saved_c.get("phone"), os.environ.get("ADMIN_EMAIL"), os.environ.get("ADMIN_PHONE")]:
                if v and str(v).strip():
                    allowed.add(str(v).strip().lower())
            if not allowed:
                self.send_json(400, {"ok": False, "error": "尚未绑定找回邮箱或手机号，请先登录后台绑定，或在 .env 中填写 ADMIN_EMAIL / ADMIN_PHONE 后重启服务"})
                return
            if contact not in allowed:
                record_login_failure(client_ip)
                self.send_json(404, {"ok": False, "error": "该邮箱或手机号与管理员绑定信息不匹配"})
                return
            code = f"{secrets.randbelow(900000) + 100000}"
            with AUTH_LOCK:
                ADMIN_RESET_CODES[contact] = {"code": code, "expires_at": time.time() + 300}
            sent_via = "console"
            smtp_host = os.environ.get("SMTP_HOST", "").strip()
            smtp_user = os.environ.get("SMTP_USER", "").strip()
            smtp_pass = os.environ.get("SMTP_PASS", "").strip()
            if "@" in contact and smtp_host and smtp_user and smtp_pass:
                try:
                    import smtplib
                    from email.message import EmailMessage
                    msg = EmailMessage()
                    msg["Subject"] = "MODFORM 商家后台密码重置验证码"
                    msg["From"] = smtp_user
                    msg["To"] = contact
                    msg.set_content(f"您的 MODFORM 商家后台密码重置验证码为：{code}（5 分钟内有效）。如非本人操作请忽略。")
                    smtp_port = int(os.environ.get("SMTP_PORT", "465"))
                    with smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=8) as s:
                        s.login(smtp_user, smtp_pass)
                        s.send_message(msg)
                    sent_via = "email"
                except Exception as exc:
                    print(f"⚠️ SMTP 发送失败，已回退至服务端控制台输出: {exc}")
            print(f"🔐 [MODFORM 密码找回验证码] 目标: {contact} | 验证码: {code} (5 分钟内有效)")
            hint = "验证码已发送至您的绑定邮箱，请查收（5 分钟内有效）" if sent_via == "email" else "验证码已生成（本地运行模式请查看服务端黑色窗口中的 6 位验证码，5 分钟内有效）"
            self.send_json(200, {"ok": True, "channel": sent_via, "message": hint})
            return

        if parsed.path == "/api/admin/forgot/verify-reset":
            client_ip = self.get_client_ip()
            if is_rate_limited(client_ip):
                self.send_json(429, {"ok": False, "error": "尝试次数过多，请 5 分钟后再试"})
                return
            data, status = self.read_json_body()
            if status != 200 or not isinstance(data, dict):
                self.send_json(status, {"ok": False, "error": "请求格式无效"})
                return
            contact = str(data.get("contact") or "").strip().lower()
            code = str(data.get("code") or "").strip()
            new_pwd = str(data.get("newPassword") or "")
            if len(new_pwd) < 8:
                self.send_json(400, {"ok": False, "error": "新密码长度至少为 8 位"})
                return
            with AUTH_LOCK:
                rec = ADMIN_RESET_CODES.get(contact)
                if not rec or rec["expires_at"] < time.time() or not hmac.compare_digest(rec["code"], code):
                    record_login_failure(client_ip)
                    self.send_json(401, {"ok": False, "error": "验证码错误或已过期"})
                    return
                ADMIN_RESET_CODES.pop(contact, None)
            clear_login_failures(client_ip)
            write_kv("auto_shop_admin_pwd", hash_password(new_pwd))
            with AUTH_LOCK:
                ACTIVE_ADMIN_TOKENS.clear()
            self.send_json(200, {"ok": True, "message": "密码已重置，请使用新密码登录"})
            return

        if parsed.path == "/api/admin/reset-password":
            client_ip = self.get_client_ip()
            if is_rate_limited(client_ip):
                self.send_json(429, {"ok": False, "error": "尝试次数过多，请 5 分钟后再试"})
                return
            data, status = self.read_json_body()
            if status != 200 or not isinstance(data, dict):
                self.send_json(status, {"ok": False, "error": "请求格式无效"})
                return
            recovery_key = os.environ.get("ADMIN_RECOVERY_KEY", "").strip()
            if not recovery_key:
                self.send_json(400, {"ok": False, "error": "服务端尚未配置恢复密钥，请在 .env 中设置 ADMIN_RECOVERY_KEY 并重启 server.py"})
                return
            submitted_key = str(data.get("recoveryKey") or "").strip()
            new_pwd = str(data.get("newPassword") or "")
            if not submitted_key or not hmac.compare_digest(submitted_key, recovery_key):
                record_login_failure(client_ip)
                self.send_json(401, {"ok": False, "error": "安全恢复密钥不正确"})
                return
            if len(new_pwd) < 8:
                self.send_json(400, {"ok": False, "error": "新密码长度至少为 8 位"})
                return
            clear_login_failures(client_ip)
            write_kv("auto_shop_admin_pwd", hash_password(new_pwd))
            with AUTH_LOCK:
                ACTIVE_ADMIN_TOKENS.clear()
            self.send_json(200, {"ok": True, "message": "管理员密码已重置，请使用新密码登录"})
            return

        if parsed.path == "/api/admin/change-password":
            if not self.is_admin_authenticated():
                self.send_json(401, {"ok": False, "error": "未授权操作"})
                return
            data, status = self.read_json_body()
            if status != 200 or not isinstance(data, dict):
                self.send_json(status, {"ok": False, "error": "请求格式无效"})
                return
            new_pwd = str(data.get("newPassword") or "").strip()
            if len(new_pwd) < 8:
                self.send_json(400, {"ok": False, "error": "为了安全起见，新密码长度至少 8 位"})
                return
            write_kv("auto_shop_admin_pwd", hash_password(new_pwd))
            # 改密后使其他旧会话失效，保留当前会话
            cur_token = self.headers.get("X-Admin-Token", "").strip()
            with AUTH_LOCK:
                ACTIVE_ADMIN_TOKENS.clear()
                if cur_token:
                    ACTIVE_ADMIN_TOKENS[cur_token] = time.time() + ADMIN_TOKEN_TTL
            self.send_json(200, {"ok": True})
            return

        # 2. 买家注册、登录（签发服务端会话 Token）与登出
        if parsed.path == "/api/auth/register":
            data, status = self.read_json_body()
            if status != 200 or not isinstance(data, dict):
                self.send_json(status, {"ok": False, "error": "请求格式无效"})
                return
            name = str(data.get("name") or "").strip()[:40]
            phone = str(data.get("phone") or "").strip()
            password = str(data.get("password") or "")
            if not name or not re.match(r"^1[3-9]\d{9}$", phone) or len(password) < 6:
                self.send_json(400, {"ok": False, "error": "请填写合法的昵称、11位手机号与至少6位密码"})
                return
            with DB_LOCK:
                users = read_kv("auto_shop_users", [])
                if not isinstance(users, list):
                    users = []
                if any(u.get("phone") == phone for u in users if isinstance(u, dict)):
                    self.send_json(409, {"ok": False, "error": "该手机号已注册，请直接登录"})
                    return
                new_user = {
                    "name": name,
                    "phone": phone,
                    "passwordHash": hash_password(password),
                    "savedName": name,
                    "savedPhone": phone,
                    "savedAddress": "",
                    "createdAt": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                }
                users.append(new_user)
                write_kv("auto_shop_users", users)
            buyer_token = secrets.token_hex(32)
            with AUTH_LOCK:
                ACTIVE_BUYER_TOKENS[buyer_token] = {
                    "phone": phone,
                    "name": name,
                    "expires_at": time.time() + BUYER_TOKEN_TTL,
                }
            self.send_json(200, {"ok": True, "user": sanitize_user_for_client(new_user), "buyerToken": buyer_token})
            return

        if parsed.path == "/api/auth/login":
            if is_rate_limited(client_ip):
                self.send_json(429, {"ok": False, "error": "登录尝试过于频繁，请 5 分钟后再试"})
                return
            data, status = self.read_json_body()
            if status != 200 or not isinstance(data, dict):
                self.send_json(status, {"ok": False, "error": "请求格式无效"})
                return
            account = str(data.get("account") or "").strip()
            password = str(data.get("password") or "")
            users = read_kv("auto_shop_users", [])
            if not isinstance(users, list):
                users = []
            for u in users:
                if not isinstance(u, dict):
                    continue
                if u.get("phone") == account or u.get("name") == account:
                    stored = u.get("passwordHash") or u.get("password") or ""
                    if verify_password(password, stored):
                        clear_login_failures(client_ip)
                        if "password" in u and "passwordHash" not in u:
                            u["passwordHash"] = hash_password(password)
                            u.pop("password", None)
                            write_kv("auto_shop_users", users)
                        buyer_token = secrets.token_hex(32)
                        with AUTH_LOCK:
                            ACTIVE_BUYER_TOKENS[buyer_token] = {
                                "phone": u.get("phone", ""),
                                "name": u.get("name", ""),
                                "expires_at": time.time() + BUYER_TOKEN_TTL,
                            }
                        self.send_json(200, {"ok": True, "user": sanitize_user_for_client(u), "buyerToken": buyer_token})
                        return
            record_login_failure(client_ip)
            self.send_json(401, {"ok": False, "error": "账号或密码不正确"})
            return

        if parsed.path == "/api/auth/logout":
            token = self.headers.get("X-Buyer-Token", "").strip()
            with AUTH_LOCK:
                ACTIVE_BUYER_TOKENS.pop(token, None)
            self.send_json(200, {"ok": True})
            return

        # 3. 服务端权威下单：全量商品查库核价、服务端核算折扣、原子扣减总库存与 SKU 库存
        if parsed.path == "/api/orders/create":
            data, status = self.read_json_body()
            if status != 200 or not isinstance(data, dict):
                self.send_json(status, {"ok": False, "error": "请求格式无效"})
                return
            items = data.get("items") or []
            if not isinstance(items, list) or len(items) == 0 or len(items) > 50:
                self.send_json(400, {"ok": False, "error": "购物袋为空或商品数量超出限制"})
                return

            receiver_name = str(data.get("name") or "").strip()[:50]
            receiver_phone = str(data.get("phone") or "").strip()
            receiver_address = str(data.get("address") or "").strip()[:200]
            if not receiver_name or not re.match(r"^1[3-9]\d{9}$", receiver_phone) or len(receiver_address) < 4:
                self.send_json(400, {"ok": False, "error": "请填写完整的收货人、11位手机号和收货地址"})
                return

            buyer_session = self.get_authenticated_buyer()

            with DB_LOCK:
                catalog = build_authoritative_catalog()
                stock_map = read_kv("auto_shop_stock_map", {}) or {}
                sku_stock_map = read_kv("auto_shop_sku_stock_map", {}) or {}
                discounts = read_kv("auto_shop_discounts", None)
                if not isinstance(discounts, list):
                    discounts = []

                verified_items = []
                subtotal = 0.0
                # 先合并校验同一商品/SKU 总请求量，避免拆分行绕过库存检查
                requested_prod_qty = defaultdict(int)
                requested_sku_qty = defaultdict(int)

                for item in items:
                    if not isinstance(item, dict):
                        self.send_json(400, {"ok": False, "error": "订单商品数据格式无效"})
                        return
                    pid = str(item.get("id") or "").strip()
                    if pid not in catalog:
                        self.send_json(400, {"ok": False, "error": f"商品「{pid}」不存在或已下架"})
                        return
                    prod_info = catalog[pid]
                    if prod_info.get("onSale") is False:
                        self.send_json(400, {"ok": False, "error": f"商品「{prod_info.get('name', pid)}」已下架"})
                        return

                    variant = str(item.get("variant") or "标准通用款").strip()[:80]
                    try:
                        qty = int(item.get("quantity"))
                    except (TypeError, ValueError):
                        self.send_json(400, {"ok": False, "error": "商品数量无效"})
                        return
                    if qty < 1 or qty > 99:
                        self.send_json(400, {"ok": False, "error": "单件商品购买数量需在 1~99 件之间"})
                        return

                    # 严格从服务端权威目录核定单价（绝不信任客户端传来的 price）
                    unit_price = float(prod_info.get("price") or 0)
                    sku_code = ""
                    matched_sku_default_stock = None
                    for vs in (prod_info.get("variantSkus") or []):
                        if isinstance(vs, dict) and str(vs.get("name", "")).strip() == variant:
                            if vs.get("price") and float(vs["price"]) > 0:
                                unit_price = float(vs["price"])
                            sku_code = str(vs.get("skuCode") or "")
                            if vs.get("stock") is not None:
                                matched_sku_default_stock = int(vs["stock"])
                            break
                    if unit_price <= 0:
                        self.send_json(400, {"ok": False, "error": f"商品「{prod_info.get('name', pid)}」定价异常，请联系商家"})
                        return

                    sku_key = f"{pid}__{variant}"
                    requested_prod_qty[pid] += qty
                    requested_sku_qty[sku_key] += qty

                    cur_total_stock = int(stock_map.get(pid, prod_info.get("stock", 20)))
                    if cur_total_stock < requested_prod_qty[pid]:
                        self.send_json(409, {"ok": False, "error": f"商品「{prod_info.get('name', pid)}」库存仅剩 {cur_total_stock} 件"})
                        return

                    cur_sku_stock = sku_stock_map.get(sku_key, matched_sku_default_stock)
                    if cur_sku_stock is not None and int(cur_sku_stock) < requested_sku_qty[sku_key]:
                        self.send_json(409, {"ok": False, "error": f"规格「{variant}」库存不足（仅剩 {int(cur_sku_stock)} 件）"})
                        return

                    subtotal += unit_price * qty
                    verified_items.append(
                        {
                            "key": f"{pid}_{variant}",
                            "id": pid,
                            "name": str(prod_info.get("name") or pid),
                            "variant": variant,
                            "skuCode": sku_code,
                            "price": round(unit_price, 2),
                            "image": str(prod_info.get("img") or ""),
                            "quantity": qty,
                        }
                    )

                # 服务端核定优惠码
                coupon_code = str(data.get("couponCode") or "").strip().upper()
                coupon_discount = 0.0
                if coupon_code:
                    found_disc = next((d for d in discounts if d.get("code") == coupon_code and d.get("active")), None)
                    if found_disc and subtotal >= float(found_disc.get("minSpend") or 0):
                        if found_disc.get("type") == "percent":
                            pct = max(10.0, min(100.0, float(found_disc.get("value") or 100)))
                            coupon_discount = subtotal * (1.0 - pct / 100.0)
                        else:
                            coupon_discount = min(subtotal, max(0.0, float(found_disc.get("value") or 0)))
                        found_disc["usedCount"] = int(found_disc.get("usedCount") or 0) + 1
                        write_kv("auto_shop_discounts", discounts)

                # 服务端核定组合购优惠（仅当包含 >= 2 种不同商品且请求启用组合购时按规则核算）
                distinct_pids = {vi["id"] for vi in verified_items}
                apply_bundle = bool(data.get("applyBundle")) or float(data.get("bundleDiscount") or 0) > 0
                if apply_bundle and len(distinct_pids) >= 2:
                    bundle_discount = 25.0 if subtotal >= 120.0 else 15.0
                else:
                    bundle_discount = 0.0

                courier_company = str(data.get("courierCompany") or "顺丰标快").strip()[:30]
                cms_cfg = read_kv("auto_shop_cms", {}) or {}
                try:
                    express_cfg = max(0.0, float(cms_cfg.get("expressFee", 15.0)))
                except Exception:
                    express_cfg = 15.0
                shipping_fee = express_cfg if courier_company == "极速达" else 0.0
                final_total = max(0.1, round(subtotal - coupon_discount - bundle_discount + shipping_fee, 1))

                # 原子扣减总库存与 SKU 库存
                for vi in verified_items:
                    pid = vi["id"]
                    sku_key = f"{pid}__{vi['variant']}"
                    prod_info = catalog[pid]
                    cur_stock = int(stock_map.get(pid, prod_info.get("stock", 20)))
                    stock_map[pid] = max(0, cur_stock - vi["quantity"])
                    if sku_key in sku_stock_map:
                        sku_stock_map[sku_key] = max(0, int(sku_stock_map[sku_key]) - vi["quantity"])
                    else:
                        for vs in (prod_info.get("variantSkus") or []):
                            if isinstance(vs, dict) and str(vs.get("name", "")).strip() == vi["variant"] and vs.get("stock") is not None:
                                sku_stock_map[sku_key] = max(0, int(vs["stock"]) - vi["quantity"])
                                break

                write_kv("auto_shop_stock_map", stock_map)
                write_kv("auto_shop_sku_stock_map", sku_stock_map)

                order_id = f"AT{int(time.time() * 1000)}{secrets.randbelow(90) + 10}"
                time_str = datetime.now().strftime("%Y/%m/%d %H:%M:%S")
                new_order = {
                    "orderId": order_id,
                    "time": time_str,
                    "payLabel": str(data.get("payLabel") or "微信支付")[:30],
                    "subtotal": f"{subtotal:.1f}",
                    "discountAmount": f"{(coupon_discount + bundle_discount):.1f}",
                    "couponCode": coupon_code,
                    "total": f"{final_total:.1f}",
                    "name": receiver_name,
                    "phone": receiver_phone,
                    "buyerPhone": buyer_session["phone"] if buyer_session else receiver_phone,
                    "address": receiver_address,
                    "note": str(data.get("note") or "无").strip()[:200],
                    "status": "待核验收款",
                    "stockRestored": False,
                    "courierCompany": courier_company,
                    "shippingFee": f"{shipping_fee:.1f}",
                    "trackingNo": "",
                    "rma": None,
                    "timeline": [
                        {"time": time_str, "title": "订单已提交，商品库存已锁定", "desc": "等待支付核验与仓库排单"}
                    ],
                    "items": verified_items,
                }
                orders = read_kv("auto_shop_orders", [])
                if not isinstance(orders, list):
                    orders = []
                orders.insert(0, new_order)
                write_kv("auto_shop_orders", orders)

            self.send_json(200, {"ok": True, "order": new_order})
            return

        # 3.1 游客精准查单（必须同时匹配完整订单号 + 下单手机号，防止遍历拖库）
        if parsed.path == "/api/orders/lookup":
            data, status = self.read_json_body()
            if status != 200 or not isinstance(data, dict):
                self.send_json(status, {"ok": False, "error": "请求格式无效"})
                return
            order_id = str(data.get("orderId") or "").strip()
            phone = str(data.get("phone") or "").strip()
            if not order_id or not re.match(r"^1[3-9]\d{9}$", phone):
                self.send_json(400, {"ok": False, "error": "请输入完整的 AT 订单号和 11 位收货手机号"})
                return
            orders = read_kv("auto_shop_orders", []) or []
            matched = next(
                (o for o in orders if isinstance(o, dict) and o.get("orderId") == order_id and o.get("phone") == phone),
                None,
            )
            if not matched:
                self.send_json(404, {"ok": False, "error": "未找到匹配的订单，请核对订单号与手机号"})
                return
            self.send_json(200, {"ok": True, "order": matched})
            return

        # 3.2 买家取消未付款订单（需登录归属校验或单号+手机号核验，同步回滚总库存与 SKU 库存）
        if parsed.path == "/api/orders/cancel":
            data, status = self.read_json_body()
            if status != 200 or not isinstance(data, dict):
                self.send_json(status, {"ok": False, "error": "请求格式无效"})
                return
            order_id = str(data.get("orderId") or "").strip()
            phone = str(data.get("phone") or "").strip()
            buyer = self.get_authenticated_buyer()

            with DB_LOCK:
                orders = read_kv("auto_shop_orders", []) or []
                target = next((o for o in orders if isinstance(o, dict) and o.get("orderId") == order_id), None)
                if not target:
                    self.send_json(404, {"ok": False, "error": "订单不存在"})
                    return
                owner_ok = (
                    (buyer and (target.get("buyerPhone") == buyer["phone"] or target.get("phone") == buyer["phone"]))
                    or (phone and target.get("phone") == phone)
                )
                if not owner_ok:
                    self.send_json(403, {"ok": False, "error": "无权操作该订单，请先登录或核对下单手机号"})
                    return
                if target.get("status") != "待核验收款":
                    self.send_json(409, {"ok": False, "error": "仅待核验收款状态的订单可直接取消"})
                    return

                now_str = datetime.now().strftime("%Y/%m/%d %H:%M:%S")
                target["status"] = "已取消"
                if not isinstance(target.get("timeline"), list):
                    target["timeline"] = []
                target["timeline"].insert(0, {"time": now_str, "title": "买家主动取消订单，占用库存已释放", "desc": "订单已关闭"})

                if not target.get("stockRestored"):
                    catalog = build_authoritative_catalog()
                    stock_map = read_kv("auto_shop_stock_map", {}) or {}
                    sku_stock_map = read_kv("auto_shop_sku_stock_map", {}) or {}
                    for item in target.get("items") or []:
                        pid = item.get("id")
                        variant = item.get("variant") or "标准通用款"
                        qty = int(item.get("quantity") or 1)
                        base_stock = int(catalog.get(pid, {}).get("stock", 20))
                        stock_map[pid] = int(stock_map.get(pid, base_stock)) + qty
                        sku_key = f"{pid}__{variant}"
                        if sku_key in sku_stock_map:
                            sku_stock_map[sku_key] = int(sku_stock_map[sku_key]) + qty
                    target["stockRestored"] = True
                    write_kv("auto_shop_stock_map", stock_map)
                    write_kv("auto_shop_sku_stock_map", sku_stock_map)

                write_kv("auto_shop_orders", orders)
            self.send_json(200, {"ok": True, "order": target})
            return

        # 3.3 买家提交晒图评价（服务端核验是否真实已购，防止前端伪造已购认证）
        if parsed.path == "/api/reviews/add":
            data, status = self.read_json_body()
            if status != 200 or not isinstance(data, dict):
                self.send_json(status, {"ok": False, "error": "请求格式无效"})
                return
            product_id = str(data.get("productId") or "").strip()
            car = str(data.get("car") or "").strip()[:50]
            rating = str(data.get("rating") or "★★★★★").strip()[:10]
            text = str(data.get("text") or "").strip()[:500]
            photos = data.get("photos") if isinstance(data.get("photos"), list) else []
            safe_photos = [str(p) for p in photos[:3] if isinstance(p, str) and p.startswith("assets/uploads/")]

            if not product_id or not car or len(text) < 2:
                self.send_json(400, {"ok": False, "error": "请填写车型和至少 2 个字的评价内容"})
                return

            buyer = self.get_authenticated_buyer()
            with DB_LOCK:
                orders = read_kv("auto_shop_orders", []) or []
                verified = False
                if buyer:
                    for o in orders:
                        if not isinstance(o, dict):
                            continue
                        if o.get("status") in ("已取消", "已退款", "待核验收款"):
                            continue
                        if o.get("buyerPhone") == buyer["phone"] or o.get("phone") == buyer["phone"]:
                            if any(i.get("id") == product_id for i in (o.get("items") or [])):
                                verified = True
                                break
                reviews = read_kv("auto_shop_reviews", {}) or {}
                if not isinstance(reviews, dict):
                    reviews = {}
                if not isinstance(reviews.get(product_id), list):
                    reviews[product_id] = []
                new_review = {
                    "id": f"rev_{int(time.time() * 1000)}",
                    "user": buyer["name"] if buyer else "车主车友",
                    "car": car,
                    "rating": rating,
                    "text": text,
                    "photos": safe_photos,
                    "verifiedPurchase": verified,
                    "merchantReply": "",
                    "time": datetime.now().strftime("%Y/%m/%d"),
                }
                reviews[product_id].insert(0, new_review)
                write_kv("auto_shop_reviews", reviews)
            self.send_json(200, {"ok": True, "review": new_review})
            return

        # 4. 支付网关 Webhook 回调（强制 HMAC-SHA256 验签或管理员 Token 鉴权）
        if parsed.path == "/api/pay/webhook":
            raw_body, status = self.read_raw_body()
            if status != 200 or not raw_body:
                self.send_json(status, {"ok": False, "error": "请求格式无效"})
                return

            is_admin = self.is_admin_authenticated()
            if not is_admin:
                pay_settings = read_kv("auto_shop_pay_settings", {}) or {}
                secret = str(pay_settings.get("webhookSecret") or os.environ.get("PAY_WEBHOOK_SECRET") or "").strip()
                provided_sig = self.headers.get("X-Webhook-Signature", "").strip()
                if not secret or not provided_sig:
                    self.send_json(403, {"ok": False, "error": "支付回调缺少有效签名，已拒绝未授权核销"})
                    return
                expected_sig = hmac.new(secret.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()
                if not hmac.compare_digest(provided_sig.lower(), expected_sig.lower()):
                    self.send_json(403, {"ok": False, "error": "支付回调签名校验失败"})
                    return

            try:
                data = json.loads(raw_body.decode("utf-8"))
            except Exception:
                self.send_json(400, {"ok": False, "error": "JSON 解析失败"})
                return

            order_id = str(data.get("orderId") or "").strip()
            trade_no = str(data.get("tradeNo") or f"PAY{int(time.time())}").strip()[:64]
            with DB_LOCK:
                orders = read_kv("auto_shop_orders", []) or []
                target = next((o for o in orders if o.get("orderId") == order_id), None)
                if not target:
                    self.send_json(404, {"ok": False, "error": "订单不存在"})
                    return
                if target.get("status") != "待核验收款":
                    self.send_json(409, {"ok": False, "error": f"当前订单状态为「{target.get('status')}」，不可重复核销"})
                    return
                now_str = datetime.now().strftime("%Y/%m/%d %H:%M:%S")
                target["status"] = "已付款·待发货"
                target["paidTradeNo"] = trade_no
                target["paidAt"] = now_str
                if not isinstance(target.get("timeline"), list):
                    target["timeline"] = []
                target["timeline"].insert(
                    0,
                    {"time": now_str, "title": "支付核验通过（已确认收款）", "desc": f"支付流水号：{trade_no} · 订单已进入待发货队列"},
                )
                write_kv("auto_shop_orders", orders)
            self.send_json(200, {"ok": True, "order": target})
            return

        # 5. 售后退换货 (RMA)：严格区分买家申请归属校验与管理员审批鉴权
        if parsed.path == "/api/orders/rma":
            data, status = self.read_json_body()
            if status != 200 or not isinstance(data, dict):
                self.send_json(status, {"ok": False, "error": "请求格式无效"})
                return
            order_id = str(data.get("orderId") or "").strip()
            action = str(data.get("action") or "apply")

            if action != "apply" and not self.is_admin_authenticated():
                self.send_json(401, {"ok": False, "error": "售后审批操作仅限管理员执行"})
                return

            with DB_LOCK:
                orders = read_kv("auto_shop_orders", []) or []
                target = next((o for o in orders if isinstance(o, dict) and o.get("orderId") == order_id), None)
                if not target:
                    self.send_json(404, {"ok": False, "error": "未找到该订单"})
                    return
                now_str = datetime.now().strftime("%Y/%m/%d %H:%M:%S")
                if not isinstance(target.get("timeline"), list):
                    target["timeline"] = []

                if action == "apply":
                    buyer = self.get_authenticated_buyer()
                    phone = str(data.get("phone") or "").strip()
                    owner_ok = (
                        self.is_admin_authenticated()
                        or (buyer and (target.get("buyerPhone") == buyer["phone"] or target.get("phone") == buyer["phone"]))
                        or (phone and target.get("phone") == phone)
                    )
                    if not owner_ok:
                        self.send_json(403, {"ok": False, "error": "无权为该订单发起售后，请先登录下单账号"})
                        return
                    if target.get("status") not in ("已付款·待发货", "已发货", "已完成"):
                        self.send_json(409, {"ok": False, "error": "当前订单状态暂不支持发起售后申请"})
                        return
                    proof_img = str(data.get("proofImg") or "").strip()
                    if proof_img and not proof_img.startswith("assets/uploads/"):
                        proof_img = ""
                    target["rma"] = {
                        "type": str(data.get("rmaType") or "退货退款")[:30],
                        "reason": str(data.get("reason") or "").strip()[:300],
                        "proofImg": proof_img,
                        "returnTrackingNo": str(data.get("returnTrackingNo") or "").strip()[:60],
                        "status": "待商家审核",
                        "appliedAt": now_str,
                        "merchantNote": "",
                    }
                    target["status"] = "售后处理中"
                    target["timeline"].insert(
                        0,
                        {"time": now_str, "title": f"买家发起售后申请（{target['rma']['type']}）", "desc": target["rma"]["reason"]},
                    )
                else:
                    if not target.get("rma"):
                        target["rma"] = {"type": "退货退款", "reason": "商家后台直接发起售后", "appliedAt": now_str}
                    merchant_note = str(data.get("merchantNote") or "").strip()[:300]
                    target["rma"]["merchantNote"] = merchant_note
                    target["rma"]["handledAt"] = now_str
                    if action == "approve_refund":
                        target["rma"]["status"] = "已退款·库存已退回"
                        target["status"] = "已退款"
                        if not target.get("stockRestored"):
                            catalog = build_authoritative_catalog()
                            stock_map = read_kv("auto_shop_stock_map", {}) or {}
                            sku_stock_map = read_kv("auto_shop_sku_stock_map", {}) or {}
                            for item in target.get("items") or []:
                                pid = item.get("id")
                                variant = item.get("variant") or "标准通用款"
                                qty = int(item.get("quantity") or 1)
                                base_stock = int(catalog.get(pid, {}).get("stock", 20))
                                stock_map[pid] = int(stock_map.get(pid, base_stock)) + qty
                                sku_key = f"{pid}__{variant}"
                                if sku_key in sku_stock_map:
                                    sku_stock_map[sku_key] = int(sku_stock_map[sku_key]) + qty
                            target["stockRestored"] = True
                            write_kv("auto_shop_stock_map", stock_map)
                            write_kv("auto_shop_sku_stock_map", sku_stock_map)
                        target["timeline"].insert(
                            0,
                            {"time": now_str, "title": "商家已同意退款并恢复商品与 SKU 库存", "desc": merchant_note or "退款原路返回"},
                        )
                    elif action == "approve_exchange":
                        target["rma"]["status"] = "已同意换货补发"
                        target["status"] = "已发货"
                        target["timeline"].insert(
                            0,
                            {"time": now_str, "title": "商家已同意换货并安排补发", "desc": merchant_note or "换货商品已安排发出"},
                        )
                    elif action == "reject":
                        target["rma"]["status"] = "售后已驳回"
                        target["status"] = "已发货" if target.get("trackingNo") else "已付款·待发货"
                        target["timeline"].insert(
                            0,
                            {"time": now_str, "title": "售后申请未通过审核", "desc": merchant_note or "请联系客服沟通详情"},
                        )
                    else:
                        self.send_json(400, {"ok": False, "error": "不支持的售后操作类型"})
                        return
                write_kv("auto_shop_orders", orders)
            self.send_json(200, {"ok": True, "order": target})
            return

        # 6. 全站数据库备份恢复接口（严格管理员鉴权）
        if parsed.path == "/api/admin/restore":
            if not self.is_admin_authenticated():
                self.send_json(401, {"ok": False, "error": "需要管理员权限"})
                return
            data, status = self.read_json_body()
            if status != 200 or not isinstance(data, dict):
                self.send_json(status, {"ok": False, "error": "请求格式无效"})
                return
            backup_map = data.get("data")
            if not isinstance(backup_map, dict):
                self.send_json(400, {"ok": False, "error": "备份文件结构无效"})
                return
            restored_count = 0
            for k, v in backup_map.items():
                if k in ADMIN_WRITABLE_KEYS:
                    write_kv(k, v)
                    restored_count += 1
            self.send_json(200, {"ok": True, "restoredKeys": restored_count})
            return

        # 7. 商家管理键值同步接口（严格强制管理员鉴权，彻底禁止匿名写入与改密）
        if parsed.path == "/api/store":
            if not self.is_admin_authenticated():
                self.send_json(401, {"ok": False, "error": "未授权：仅管理员可写入商店配置与后台数据"})
                return
            data, status = self.read_json_body()
            if status != 200 or not isinstance(data, dict) or "key" not in data:
                self.send_json(400, {"ok": False, "error": "请求格式无效"})
                return
            key = str(data["key"])
            if key == "auto_shop_admin_pwd":
                self.send_json(403, {"ok": False, "error": "请使用专用 /api/admin/change-password 接口修改管理员密码"})
                return
            if key not in ADMIN_WRITABLE_KEYS:
                self.send_json(200, {"ok": True, "ignored": True})
                return
            write_kv(key, data.get("value"))
            self.send_json(200, {"ok": True})
            return

        # 8. 图片上传（强制登录鉴权 + 5MB 限制 + 二进制魔数校验）
        if parsed.path == "/api/upload-image":
            if not self.is_admin_authenticated() and not self.get_authenticated_buyer():
                self.send_json(401, {"ok": False, "error": "请先登录账号后再上传图片"})
                return
            data, status = self.read_json_body(max_bytes=int(MAX_UPLOAD_IMAGE_BYTES * 1.4))
            if status != 200 or not isinstance(data, dict):
                self.send_json(status, {"ok": False, "error": "图片体积过大或请求格式无效（最大 5MB）"})
                return
            data_url = str(data.get("dataUrl") or "")
            match = re.match(r"^data:image/(jpeg|jpg|png|webp|gif);base64,([A-Za-z0-9+/=\s]+)$", data_url, re.I)
            if not match:
                self.send_json(400, {"ok": False, "error": "不支持的图片数据格式"})
                return
            try:
                raw_bytes = base64.b64decode(match.group(2), validate=True)
            except Exception:
                self.send_json(400, {"ok": False, "error": "图片 Base64 编码无效"})
                return
            if len(raw_bytes) == 0 or len(raw_bytes) > MAX_UPLOAD_IMAGE_BYTES:
                self.send_json(413, {"ok": False, "error": "图片大小不能超过 5MB"})
                return
            real_ext = detect_image_magic(raw_bytes)
            if not real_ext:
                self.send_json(400, {"ok": False, "error": "文件内容校验失败：非合法的 JPG/PNG/WebP/GIF 图片"})
                return
            digest = hashlib.sha1(raw_bytes).hexdigest()[:12]
            filename = f"img_{int(time.time())}_{digest}.{real_ext}"
            rel_path = f"assets/uploads/{filename}"
            full_path = os.path.join(UPLOAD_DIR, filename)
            with open(full_path, "wb") as f:
                f.write(raw_bytes)
            self.send_json(200, {"ok": True, "url": rel_path})
            return


        # 8.1 买家邮件订阅持久化接口
        if parsed.path == "/api/newsletter/subscribe":
            data, status = self.read_json_body()
            if status != 200 or not isinstance(data, dict):
                self.send_json(status, {"ok": False, "error": "请求格式无效"})
                return
            email = str(data.get("email") or "").strip().lower()[:120]
            if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email):
                self.send_json(400, {"ok": False, "error": "请输入有效的电子邮箱地址"})
                return
            with DB_LOCK:
                subs = read_kv("auto_shop_subscribers", [])
                if not isinstance(subs, list):
                    subs = []
                if any(isinstance(s, dict) and str(s.get("email", "")).lower() == email for s in subs):
                    self.send_json(200, {"ok": True, "alreadySubscribed": True})
                    return
                subs.insert(0, {
                    "email": email,
                    "subscribedAt": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                })
                write_kv("auto_shop_subscribers", subs)
            self.send_json(200, {"ok": True, "alreadySubscribed": False})
            return


        # 8.2 车友问答 (Q&A) 提问接口
        if parsed.path == "/api/contact/add":
            data, status = self.read_json_body()
            if status != 200 or not isinstance(data, dict):
                self.send_json(status, {"ok": False, "error": "请求格式无效"})
                return
            way = str(data.get("way") or "").strip()[:120]
            msg = str(data.get("msg") or "").strip()[:1000]
            name = str(data.get("name") or "匿名车友").strip()[:60] or "匿名车友"
            car = str(data.get("car") or "未填写车型").strip()[:80] or "未填写车型"
            if not way or not msg:
                self.send_json(400, {"ok": False, "error": "请填写联系方式与留言内容"})
                return
            with DB_LOCK:
                items = read_kv("auto_shop_contact_messages", []) or []
                if not isinstance(items, list):
                    items = []
                entry = {
                    "id": f"MSG-{int(time.time()*1000)}",
                    "name": name, "car": car, "way": way, "msg": msg,
                    "status": "待处理",
                    "time": datetime.now().strftime("%Y-%m-%d %H:%M")
                }
                items.insert(0, entry)
                write_kv("auto_shop_contact_messages", items[:100])
            self.send_json(200, {"ok": True, "item": entry})
            return

        if parsed.path == "/api/qa/add":
            data, status = self.read_json_body()
            if status != 200 or not isinstance(data, dict):
                self.send_json(status, {"ok": False, "error": "请求格式无效"})
                return
            product_id = str(data.get("productId") or "").strip()
            question = str(data.get("question") or "").strip()[:200]
            car = str(data.get("car") or "").strip()[:40]
            if not product_id or len(question) < 2:
                self.send_json(400, {"ok": False, "error": "请输入至少 2 个字的提问内容"})
                return
            buyer = self.get_authenticated_buyer()
            with DB_LOCK:
                qa_map = read_kv("auto_shop_qa", {}) or {}
                if not isinstance(qa_map, dict):
                    qa_map = {}
                if not isinstance(qa_map.get(product_id), list):
                    qa_map[product_id] = []
                entry = {
                    "id": f"qa_{int(time.time() * 1000)}",
                    "user": buyer["name"] if buyer else "访客车主",
                    "car": car or "通用车友",
                    "question": question,
                    "answer": "",
                    "time": datetime.now().strftime("%Y/%m/%d")
                }
                qa_map[product_id].insert(0, entry)
                write_kv("auto_shop_qa", qa_map)
            self.send_json(200, {"ok": True, "item": entry})
            return

        self.send_json(404, {"ok": False, "error": "未知 API 路径"})


def main():
    init_db()
    port = int(os.environ.get("PORT", "8000"))
    server = ThreadingHTTPServer((os.environ.get("HOST", "0.0.0.0"), port), ModformHandler)
    print("======================================================")
    print("🚗 MODFORM 全栈安全加固服务已启动 (Python + SQLite)")
    print(f"👉 买家商城前台: http://localhost:{port}/index.html")
    print(f"👉 商家运营后台: http://localhost:{port}/admin.html")
    print("🔒 安全提示: 请通过 .env 中 ADMIN_INIT_PASSWORD 配置初始强密码，首次登录后建议立即在后台修改。")
    print(f"💾 数据库文件:   {DB_PATH}（已禁止公网静态访问）")
    print("======================================================")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n正在关闭服务...")
        server.server_close()


if __name__ == "__main__":
    main()
