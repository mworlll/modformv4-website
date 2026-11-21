// ==========================================
// 共享配置：前后端双模存储引擎、SKU解析器、精准车型匹配矩阵与汽车用品模板库
// ==========================================

window.AUTO_SHOP_SERVER_ONLINE = false;
window.AUTO_SHOP_SYNC_READY = false;

function readLocalData(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    console.warn(`本地数据 ${key} 读取失败，已使用默认值。`, error);
    return fallback;
  }
}

function writeLocalData(key, value) {
  let localOk = true;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`本地数据 ${key} 保存失败。`, error);
    localOk = false;
  }

  if (typeof fetch === 'function' && window.location.protocol.startsWith('http')) {
    const adminToken = sessionStorage.getItem('auto_shop_admin_token') || '';
    if (adminToken && key !== 'auto_shop_admin_pwd') {
      fetch('/api/store', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': adminToken
        },
        body: JSON.stringify({ key, value })
      })
        .then(res => {
          if (res.ok) window.AUTO_SHOP_SERVER_ONLINE = true;
        })
        .catch(() => {});
    }
  }

  if (!localOk && !window.AUTO_SHOP_SERVER_ONLINE) {
    alert('浏览器存储空间不足，请清理部分缓存后重试。');
    return false;
  }
  return true;
}

function getBuyerToken() {
  try { return sessionStorage.getItem('auto_shop_buyer_token') || ''; } catch (e) { return ''; }
}

async function syncBuyerOrdersFromServer() {
  const token = getBuyerToken();
  if (!token || typeof fetch !== 'function' || !window.location.protocol.startsWith('http')) return null;
  try {
    const res = await fetch('/api/orders/my', {
      headers: { 'X-Buyer-Token': token },
      cache: 'no-store'
    });
    if (res.ok) {
      const payload = await res.json();
      if (payload && Array.isArray(payload.orders)) {
        try { localStorage.setItem('auto_shop_orders', JSON.stringify(payload.orders)); } catch (e) {}
        return payload.orders;
      }
    }
  } catch (e) {}
  return null;
}

async function syncStoreFromServer(onSyncedCallback, isAdminMode = false) {
  if (typeof fetch !== 'function' || !window.location.protocol.startsWith('http')) {
    window.AUTO_SHOP_SERVER_ONLINE = false;
    window.AUTO_SHOP_SYNC_READY = true;
    if (typeof onSyncedCallback === 'function') onSyncedCallback(false);
    return false;
  }
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const adminToken = sessionStorage.getItem('auto_shop_admin_token') || '';
    const useAdminEndpoint = Boolean(isAdminMode && adminToken);
    const url = useAdminEndpoint ? '/api/admin/bootstrap' : '/api/bootstrap';
    const headers = useAdminEndpoint ? { 'X-Admin-Token': adminToken } : {};
    const res = await fetch(url, { signal: controller.signal, cache: 'no-store', headers });
    clearTimeout(timer);
    if (!res.ok) throw new Error('API not available');
    const payload = await res.json();
    if (payload && payload.store && typeof payload.store === 'object') {
      window.AUTO_SHOP_SERVER_ONLINE = true;
      Object.entries(payload.store).forEach(([k, v]) => {
        try {
          localStorage.setItem(k, JSON.stringify(v));
        } catch (e) {}
      });
      if (!useAdminEndpoint && getBuyerToken()) {
        await syncBuyerOrdersFromServer();
      }
      window.AUTO_SHOP_SYNC_READY = true;
      if (typeof onSyncedCallback === 'function') onSyncedCallback(true);
      return true;
    }
  } catch (e) {
    window.AUTO_SHOP_SERVER_ONLINE = false;
  }
  window.AUTO_SHOP_SYNC_READY = true;
  if (typeof onSyncedCallback === 'function') onSyncedCallback(false);
  return false;
}

// 前端 SHA-256 哈希辅助（用于离线降级时避免明文存储密码）
async function hashPasswordClient(text) {
  const str = `auto_studio_salt_v2::${String(text)}`;
  if (window.crypto && window.crypto.subtle) {
    const buf = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return 'sha256$' + Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return `hash$${Math.abs(h)}`;
}

// 解析 SKU 规格字符串：
// 支持格式："圆盘·曜石黑红线|68|15|INT1-BLK, 圆盘·碳纤拼色|79|10|INT1-CARB" 或普通 "圆盘·曜石黑, D型盘·碳纤"
function parseVariantSkus(variantsRaw, basePrice = 59, baseStock = 20, productId = 'prod', skuStockMap = {}) {
  let list = [];
  if (Array.isArray(variantsRaw)) {
    list = variantsRaw;
  } else if (typeof variantsRaw === 'string') {
    list = variantsRaw.split(/[,，\n]/).map(s => s.trim()).filter(Boolean);
  }
  if (!list.length) list = ['标准通用款'];

  return list.map((entry, idx) => {
    if (entry && typeof entry === 'object') {
      const name = String(entry.name || `规格${idx + 1}`).trim();
      const skuKey = `${productId}__${name}`;
      return {
        name,
        price: Number.isFinite(Number(entry.price)) && Number(entry.price) > 0 ? Number(entry.price) : Number(basePrice),
        stock: skuStockMap[skuKey] !== undefined ? Number(skuStockMap[skuKey]) : (entry.stock !== undefined ? Number(entry.stock) : Number(baseStock)),
        skuCode: String(entry.skuCode || `${String(productId).toUpperCase()}-S${idx + 1}`)
      };
    }
    const parts = String(entry).split('|').map(p => p.trim());
    const name = parts[0] || `规格${idx + 1}`;
    const price = parts[1] && Number.isFinite(Number(parts[1])) && Number(parts[1]) > 0 ? Number(parts[1]) : Number(basePrice);
    const parsedStock = parts[2] !== undefined && parts[2] !== '' && Number.isFinite(Number(parts[2])) ? Math.max(0, Math.floor(Number(parts[2]))) : Number(baseStock);
    const skuCode = parts[3] || `${String(productId).toUpperCase().replace(/^CUSTOM_/, 'C').slice(0, 8)}-0${idx + 1}`;
    const skuKey = `${productId}__${name}`;
    const finalStock = skuStockMap[skuKey] !== undefined ? Number(skuStockMap[skuKey]) : parsedStock;
    return { name, price, stock: finalStock, skuCode };
  });
}

function formatVariantSkusToString(variantSkus, variantsFallback, basePrice, baseStock, productId) {
  const skus = Array.isArray(variantSkus) && variantSkus.length
    ? variantSkus
    : parseVariantSkus(variantsFallback, basePrice, baseStock, productId);
  return skus.map(s => `${s.name}|${Number(s.price).toFixed(1)}|${s.stock}|${s.skuCode}`).join(', ');
}

// 亚马逊 Garage 级精准车型适配矩阵核验
function checkVehicleFitmentPrecision(product, garage) {
  if (!garage || !garage.model) {
    return {
      status: 'none',
      badgeText: '',
      detailNotice: `适用范围：<strong>${escapeHTML(product.fitmentLabel || '全车型通用')}</strong>（可在顶部 Garage 选择您的品牌、年份与车型进行精准防错核验）`
    };
  }
  const carTitle = `${garage.year ? garage.year + '款 ' : ''}${garage.makeLabel || ''} ${garage.model}`.trim();
  const carSearchText = `${garage.make} ${garage.makeLabel} ${garage.model}`.toLowerCase();
  const fitType = product.fitment || product.fit || 'universal';
  const fitBrandsRaw = String(product.fitBrands || '').trim().toLowerCase();
  const fitYearsRaw = String(product.fitYears || '').trim();

  // 1. 检查年份范围（例如 2019-2026）
  let yearMatch = true;
  if (fitYearsRaw && garage.year) {
    const ym = fitYearsRaw.match(/(\d{4})\s*[-~至]\s*(\d{4})/);
    const yNum = Number(garage.year);
    if (ym && yNum) {
      yearMatch = yNum >= Number(ym[1]) && yNum <= Number(ym[2]);
    }
  }

  // 2. 检查指定品牌/车型关键词（如果商家配置了专车关键词，如 "tesla, model 3, model y" 或 "本田, 思域"）
  if (fitBrandsRaw && fitBrandsRaw !== 'all' && fitBrandsRaw !== 'universal' && fitBrandsRaw !== '全车系通用') {
    const tokens = fitBrandsRaw.split(/[,，/、\s]+/).map(t => t.trim()).filter(Boolean);
    const brandMatched = tokens.some(tok => carSearchText.includes(tok));
    if (brandMatched && yearMatch) {
      return {
        status: 'exact',
        badgeText: `✓ 专车精准适配 ${garage.model}`,
        detailNotice: `🟢 <strong>专车精准适配核验通过：</strong>该车用配件支持您的 <strong>${escapeHTML(carTitle)}</strong>（${escapeHTML(product.fitmentLabel)}），原车数据开模无损安装。`
      };
    }
    return {
      status: 'mismatch',
      badgeText: `⚠ 非 ${garage.model} 专车件`,
      detailNotice: `⚠️ <strong>车型不匹配防错预警：</strong>您当前选择的爱车为 <strong>${escapeHTML(carTitle)}</strong>，而本商品限定适配「<strong>${escapeHTML(product.fitBrands)}${fitYearsRaw ? ' (' + escapeHTML(fitYearsRaw) + ')' : ''}</strong>」，请勿误拍或联系客服确认！`
    };
  }

  // 3. 按车身/能源分类 (universal / sedan / suv / ev) 判断
  if (!yearMatch) {
    return {
      status: 'mismatch',
      badgeText: `⚠ 年份可能不符`,
      detailNotice: `⚠️ <strong>年份适配提醒：</strong>本商品适用年份为 <strong>${escapeHTML(fitYearsRaw)}</strong>，您选择的爱车为 <strong>${escapeHTML(carTitle)}</strong>，下单前请核对中控/外观改款年份。`
    };
  }

  if (fitType === 'universal') {
    return {
      status: 'universal',
      badgeText: `✓ 通用适配 ${garage.model}`,
      detailNotice: `🟢 <strong>全车系通用适配：</strong>已核验支持您的 <strong>${escapeHTML(carTitle)}</strong>（${escapeHTML(product.fitmentLabel)}），下单将自动附带您的车型备注。`
    };
  }

  if (garage.inferredFit === 'all' || fitType === garage.inferredFit) {
    return {
      status: 'exact',
      badgeText: `✓ 适配 ${garage.model}`,
      detailNotice: `🟢 <strong>车型结构匹配通过：</strong>已核验适配您的 <strong>${escapeHTML(carTitle)}</strong>（${escapeHTML(product.fitmentLabel)}），仓库发货前将二次核对车型卡扣。`
    };
  }

  const fitTypeNameMap = { sedan: '轿车/轿跑车系', suv: 'SUV/越野车系', ev: '新能源车系' };
  return {
    status: 'mismatch',
    badgeText: `⚠ 仅限${fitTypeNameMap[fitType] || '特定车型'}`,
    detailNotice: `⚠️ <strong>跨车系防错预警：</strong>本商品针对 <strong>${fitTypeNameMap[fitType] || fitType}（${escapeHTML(product.fitmentLabel)}）</strong> 开发，可能不适配您的 <strong>${escapeHTML(carTitle)}</strong>，请仔细核对尺寸后再购买！`
  };
}

function escapeHTML(value = '') {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
}

function safeExternalUrl(value = '') {
  const raw = String(value || '').trim();
  if (!raw) return '';
  try {
    const url = new URL(raw, window.location.href);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch (error) {
    return '';
  }
}

const CATEGORY_IMAGE_MAP = {
  interior: 'assets/interior.webp',
  exterior: 'assets/exterior.webp',
  storage: 'assets/storage.webp',
  scent: 'assets/fragrance.webp'
};

function resolveProductImage(image = '', category = 'interior') {
  const raw = String(image || '').trim();
  if (/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(raw)) return raw;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^(\/?assets\/|wechat-qr\.jpg)/i.test(raw)) return raw.replace(/^\//, '');
  return CATEGORY_IMAGE_MAP[category] || 'assets/hero-auto-minimal.webp';
}

function safeImageUrl(image = '', category = 'interior') {
  return escapeHTML(resolveProductImage(image, category));
}

const savedPaySettings = readLocalData('auto_shop_pay_settings', {});

const PAYMENT_CONFIG = {
  wechatQrImage: savedPaySettings.wechatQrImage || 'wechat-qr.jpg',
  alipayQrImage: savedPaySettings.alipayQrImage || null,
  stripePaymentLink: savedPaySettings.stripePaymentLink || '',
  webhookProvider: savedPaySettings.webhookProvider || 'wechat_official',
  webhookAppId: savedPaySettings.webhookAppId || '',
  webhookSecret: savedPaySettings.webhookSecret || '',
  freeShippingThreshold: 99
};

const HERO_SLIDES = [
  {
    title: 'MODFORM',
    subtitle: 'Your car. Styled your way. · 车居美学与无损好物',
    bg: 'assets/hero-auto-minimal.webp'
  },
  {
    title: 'INTERIOR',
    subtitle: '细腻触感与极简秩序 · 升级日常座舱体验',
    bg: 'assets/interior.webp'
  },
  {
    title: 'EXTERIOR',
    subtitle: '专车数据开模 · 简约质感外观装饰件',
    bg: 'assets/exterior.webp'
  }
];

const DEFAULT_TRUST_ITEMS = [
  '原车数据开模',
  '3M 无损安装',
  '7 天无理由退换',
  '满 ¥99 顺丰包邮'
];

const CAR_BRANDS = [
  { label: '本田 (Honda)', apiMake: 'honda', hotModels: ['思域 Civic', '雅阁 Accord', 'CR-V', '型格 Integra', '皓影 Breeze', '飞度 Fit'] },
  { label: '丰田 (Toyota)', apiMake: 'toyota', hotModels: ['凯美瑞 Camry', '卡罗拉 Corolla', 'RAV4荣放', '汉兰达 Highlander', '雷凌 Levin', '亚洲龙 Avalon'] },
  { label: '特斯拉 (Tesla)', apiMake: 'tesla', hotModels: ['Model 3', 'Model Y', 'Model 3 焕新版', 'Model Y 焕新版', 'Model S', 'Model X'] },
  { label: '比亚迪 (BYD)', apiMake: 'byd', hotModels: ['汉 EV/DM-i', '海豹 Seal', '宋PLUS', '秦PLUS', '元PLUS', '海豚', '海鸥', '唐 DM-i'] },
  { label: '大众 (Volkswagen)', apiMake: 'volkswagen', hotModels: ['速腾 Sagitar', '迈腾 Magotan', '帕萨特 Passat', '高尔夫 Golf GTI', '途观L Tiguan', 'ID.3', 'ID.4'] },
  { label: '宝马 (BMW)', apiMake: 'bmw', hotModels: ['3系 3 Series', '5系 5 Series', 'X3', 'X5', 'i3', 'M3 / M4', '4系'] },
  { label: '奔驰 (Mercedes-Benz)', apiMake: 'mercedes-benz', hotModels: ['C级 C-Class', 'E级 E-Class', 'GLC', 'A级 A-Class', 'AMG C43/C63'] },
  { label: '奥迪 (Audi)', apiMake: 'audi', hotModels: ['A4L', 'A6L', 'Q5L', 'A3', 'Q3', 'A7L', 'S4 / RS4'] },
  { label: '吉利/领克/极氪 (Geely)', apiMake: 'geely', hotModels: ['极氪 001', '极氪 007', '领克 03+', '领克 08', '星越L', '星瑞'] },
  { label: '小米/理想/蔚来/小鹏 (新势力)', apiMake: 'nio', hotModels: ['小米 SU7', '小米 SU7 Ultra', '理想 L6', '理想 L7/L8/L9', '蔚来 ET5/ET5T', '小鹏 P7i/MONA M03'] },
  { label: '保时捷 (Porsche)', apiMake: 'porsche', hotModels: ['Macan', 'Cayenne 卡宴', 'Panamera', '911', 'Taycan'] },
  { label: '日产/福特/马自达 (其他热门)', apiMake: 'ford', hotModels: ['野马 Mustang', '蒙迪欧 Mondeo', '昂克赛拉 Mazda3', '天籁 Altima', '轩逸 Sylphy'] }
];

const CATEGORY_META = {
  all: { title: '全部汽车用品与车居好物', en: 'ALL AUTO ACCESSORIES', desc: '全站车载座舱美学、外观空力套件、车内收纳与车载香氛精选好物' },
  interior: { title: '内饰美学', en: 'INTERIOR UPGRADE', desc: '翻毛皮方向盘、流光氛围灯、CNC换挡拨片、碳纤内饰贴与人体工学头枕' },
  exterior: { title: '外观升级', en: 'EXTERIOR STYLING', desc: '干碳纤维牛角镜壳、运动前唇铲、刀锋尾翼、侧裙风刀与车身防刮套件' },
  storage: { title: '车载储物', en: 'CABIN STORAGE', desc: '座椅缝隙收纳盒、后备箱折叠整理箱、屏幕后隐藏置物架与扶手箱分层托盘' },
  scent: { title: '车载香薰', en: 'AUTO FRAGRANCE', desc: '航空铝合金出风口香薰、太阳能涡轮扩香器、随车启停雾化香氛与新车除醛盒' }
};

// 初始商品目录为空，所有在售商品均由商家后台发布并持久化至服务端 SQLite
const BASE_CATALOG = [];