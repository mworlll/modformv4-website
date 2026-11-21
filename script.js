// ==========================================
// 0. 全站双语核心词典与工具函数（置于顶部避免任何初始化顺序错误）
// ==========================================
var currentSiteLang = (function() {
  try { return localStorage.getItem('modform_lang') === 'en' ? 'en' : 'zh'; } catch (e) { return 'zh'; }
})();

var PRODUCT_EN_MAP = {
  int1: 'Italian Alcantara Steering Wheel Cover',
  int2: 'Dashboard Hidden 64-Color Ambient Light Strip',
  int3: 'Aerospace Aluminum Shift Paddle Extensions',
  int4: 'Nappa Leather Memory Foam Neck & Lumbar Set',
  int5: 'Dry Carbon Fiber Center Console Trim Kit',
  int6: 'Brushed Stainless No-Drill Pedal Covers',
  int7: 'Microfiber Leather Armrest Memory Foam Pad',
  int8: 'Fighter-Jet Rotary Push-Start Button Cover',
  int9: 'USB Sound-Reactive Starlight Cabin Projector',
  int10: 'Odorless TPE Dual-Layer Custom Floor Mats',
  ext1: 'Dry Carbon Horn-Style Mirror Caps',
  ext2: '3-Piece Sport Front Bumper Lip Splitter',
  ext3: 'No-Drill Carbon Fiber Rear Trunk Spoiler',
  ext4: '2m Side Skirt Anti-Scratch Winglet Extensions',
  ext5: 'Invisible PPF Door Edge Protection Strips',
  ext6: 'Aerodynamic Shark Fin Roof Antenna Cover',
  ext7: 'High-Elastic TPE Wheel Rim Protectors (4-Pack)',
  ext8: 'Blackout Front Grille Tri-Color Metal Emblem',
  ext9: 'Carbon Fiber Door Handle Cup Protectors (8pcs)',
  ext10: 'Smoked Sequential LED Side Mirror Turn Signals',
  sto1: 'Nappa Leather Seat Gap Filler Organizer',
  sto2: 'Heavy-Duty Foldable Velvet Trunk Organizer',
  sto3: 'Seatback Folding Tray & Multi-Pocket Organizer',
  sto4: 'Magnetic Sun Visor Sunglass & Card Holder',
  sto5: 'Air Vent Leather Phone & Pocket Caddy',
  sto6: 'Behind-Screen Magnetic Tissue & Tray Mount',
  sto7: 'Full-Car Silicone Door Slot Anti-Rattle Mats',
  sto8: 'Hidden Carbon Seatback Dual Hooks (Pair)',
  sto9: 'Waterproof Folding Car Trash Bin with LED',
  sto10: 'Flocked Dual-Tier Armrest Storage Tray',
  sce1: 'Aerospace Aluminum Vent Essential Oil Diffuser',
  sce2: 'Solar-Powered Turbine Rotating Car Diffuser',
  sce3: 'Retro Vinyl Record Spinning Vent Freshener',
  sce4: 'Amber Glass Cupholder Natural Solid Balm',
  sce5: 'Magnetic Hidden Metal Vent Scent Bar (Gift Box)',
  sce6: 'Astronaut Capsule Gravity Car Diffuser',
  sce7: 'French Perfumer Woody Hanging Scent Cards (3pk)',
  sce8: 'Smart Auto-Start Ultrasonic Mist Diffuser',
  sce9: 'Natural Lava Stone Diffuser + 10ml Essential Oil',
  sce10: 'Activated Carbon & Botanical Odor Purifier Box'
};

var BADGE_EN_MAP = {
  '口碑热销': 'Hot Pick', '夜行氛围': 'Night Glow', '操控升级': 'Pro Control',
  '舒适驾乘': 'Comfort', '碳纤内饰': 'Carbon', '防滑操控': 'Anti-Slip',
  '舒适升级': 'Comfort+', '点火仪式感': 'Ignition', '星空座舱': 'Starlight',
  '专车定制': 'Custom Fit', '运动黑化': 'Blackout', '低趴姿态': 'Sport Lip',
  '空力尾翼': 'Aero Wing', '侧裙风刀': 'Side Skirt', '隐形防护': 'Clear Shield',
  '降风阻设计': 'Aero Fin', '轮毂护圈': 'Rim Guard', '中网改色标': 'Grille Badge',
  '实用防护': 'Door Guard', '流水动态': 'Sequential', '座舱收纳': 'Organizer',
  '尾箱收纳': 'Trunk Box', '后排拓展': 'Rear Tray', '随手拿取': 'Quick Access',
  '小巧能装': 'Compact', '新能源专享': 'EV Ready', '告别异响': 'Anti-Rattle',
  '实用配件': 'Utility', '防漏防水': 'Waterproof', '空间翻倍': '2x Space',
  '留香60天': '60-Day Scent', '有光即转': 'Solar Spin', '复古潮玩': 'Retro Style',
  '持久淡雅': 'Long Lasting', '极简隐形': 'Minimalist', '潮玩摆件': 'Collectible',
  '木质扩香': 'Woody Notes', '智能雾化': 'Smart Mist', '自然原石': 'Lava Stone',
  '新车除醛': 'Air Purify', '新品首推': 'NEW DROP'
};

var CATEGORY_META_EN = {
  all: { title: 'All Automotive Accessories', desc: 'Curated cabin aesthetics, exterior upgrades, smart storage & signature fragrances.' },
  interior: { title: 'Interior Styling', desc: 'Non-destructive cabin upgrades crafted for tactile precision and daily driving comfort.' },
  exterior: { title: 'Exterior Upgrades', desc: 'Clean aerodynamic accents and protective trim engineered for seamless fitment.' },
  storage: { title: 'Smart Storage', desc: 'Minimalist organizers designed to keep your cockpit and trunk clutter-free.' },
  scent: { title: 'Car Fragrance', desc: 'Architectural diffusers paired with botanical essential oils for a refined cabin.' }
};

var I18N_MAP = {
  zh: {
    langBtn: 'EN', navHome: '首页', navCatalog: '车品目录', navContact: 'Contact',
    garageBtn: '我的爱车', shopAll: '浏览全部车品 →', viewAll: '查看全部车品 →',
    backHome: '← 返回首页', inStock: '仅看有货', bottomSwitch: '切换品类浏览',
    newsHeading: '订阅我们的邮件 · SUBSCRIBE TO OUR EMAILS',
    newsSub: '第一时间获取 MODFORM 限量车品套装与车主专属优惠。',
    newsPlaceholder: '输入您的邮箱地址 / Email',
    contactTitle: 'Contact · 联系我们',
    contactDesc: '车型适配核验、批量定制采购或售后安装协助，MODFORM 专属车品顾问为您提供一对一响应。',
    contactSubmit: '发送留言 →',
    cats: { all: '全部商品', interior: '内饰美学', exterior: '外观升级', storage: '车载储物', scent: '车载香薰' }
  },
  en: {
    langBtn: '中文', navHome: 'Home', navCatalog: 'Catalog', navContact: 'Contact',
    garageBtn: 'My Garage', shopAll: 'Shop All →', viewAll: 'View All →',
    backHome: '← Back to Home', inStock: 'In Stock Only', bottomSwitch: 'Browse Categories',
    newsHeading: 'SUBSCRIBE TO OUR EMAILS',
    newsSub: 'Get early access to MODFORM limited automotive sets & exclusive member offers.',
    newsPlaceholder: 'Enter your email address',
    contactTitle: 'Contact Us',
    contactDesc: 'Vehicle fitment checks, bulk orders, or installation support — our MODFORM specialists respond one-on-one.',
    contactSubmit: 'Send Message →',
    cats: { all: 'All Products', interior: 'Interior', exterior: 'Exterior', storage: 'Storage', scent: 'Fragrance' }
  }
};

function getLocalizedProductName(product) {
  if (!product) return '';
  if (currentSiteLang === 'en') {
    return (product.nameEn && String(product.nameEn).trim()) || PRODUCT_EN_MAP[product.id] || product.name;
  }
  return product.name;
}

function getLocalizedBadge(badge) {
  if (!badge) return '';
  if (currentSiteLang === 'en') return BADGE_EN_MAP[badge] || badge;
  return badge;
}

// ==========================================
// 1. 站点配置、商品数据合并（支持多SKU、多图画廊、装车前后对比与服务端同步）
// ==========================================
let siteCms = readLocalData('auto_shop_cms', {});
let freeShippingThreshold = Number(siteCms.freeShipping) || PAYMENT_CONFIG.freeShippingThreshold;

function applyCmsToView() {
  siteCms = readLocalData('auto_shop_cms', {});
  freeShippingThreshold = Number(siteCms.freeShipping) || PAYMENT_CONFIG.freeShippingThreshold;
  if (siteCms.announcement) {
    document.getElementById('site-announcement-text').textContent = siteCms.announcement;
  }
  const trustFreeEl = document.getElementById('trust-free-shipping');
  if (trustFreeEl) trustFreeEl.textContent = freeShippingThreshold;

  const heroTitleEl = document.getElementById('hero-title');
  if (heroTitleEl && siteCms.heroTitle) {
    heroTitleEl.textContent = siteCms.heroTitle;
  }
  const heroVisualImg = document.querySelector('.ride-hero-visual img');
  if (heroVisualImg && siteCms.heroBg1) {
    heroVisualImg.src = resolveProductImage(siteCms.heroBg1);
  }
  // 兼容旧版轮播配置
  if (siteCms.heroTitle) HERO_SLIDES[0].title = siteCms.heroTitle;
  if (siteCms.heroSubtitle) HERO_SLIDES[0].subtitle = siteCms.heroSubtitle;
  if (siteCms.heroBg1) HERO_SLIDES[0].bg = resolveProductImage(siteCms.heroBg1);
  if (siteCms.heroTitle2) HERO_SLIDES[1].title = siteCms.heroTitle2;
  if (siteCms.heroSubtitle2) HERO_SLIDES[1].subtitle = siteCms.heroSubtitle2;
  if (siteCms.heroBg2) HERO_SLIDES[1].bg = resolveProductImage(siteCms.heroBg2);
  if (siteCms.heroTitle3) HERO_SLIDES[2].title = siteCms.heroTitle3;
  if (siteCms.heroSubtitle3) HERO_SLIDES[2].subtitle = siteCms.heroSubtitle3;
  if (siteCms.heroBg3) HERO_SLIDES[2].bg = resolveProductImage(siteCms.heroBg3);

  // 支持后台动态修改 4 大信任保障条
  if (Array.isArray(siteCms.trustItems)) {
    siteCms.trustItems.forEach((txt, idx) => {
      const el = document.getElementById(`trust-item-${idx}`);
      if (el && txt) el.textContent = txt;
    });
  }
  updateHeroSlide();
}

let customCatalog = readLocalData('auto_shop_custom_products', []);
let deletedProductIds = readLocalData('auto_shop_deleted_ids', []);
let productOverrides = readLocalData('auto_shop_product_overrides', {});
let stockMap = readLocalData('auto_shop_stock_map', {});
let skuStockMap = readLocalData('auto_shop_sku_stock_map', {});
let orders = readLocalData('auto_shop_orders', []);
let PRODUCTS = [];

function showToast(message, type = 'success') {
  const region = document.getElementById('toast-region');
  if (!region) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type === 'error' ? 'is-error' : ''}`;
  toast.textContent = message;
  region.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

async function compressBuyerImage(file, maxWidth = 650) {
  return new Promise((resolve) => {
    if (!file || !/^image\/(jpeg|png|webp|gif)$/i.test(file.type) || file.size > 10 * 1024 * 1024) {
      showToast('请选择 10MB 以内的图片', 'error');
      resolve('');
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => resolve('');
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => resolve('');
      img.onload = async () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(''); return; }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        if (window.location.protocol.startsWith('http')) {
          try {
            const res = await fetch('/api/upload-image', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Buyer-Token': getBuyerToken()
              },
              body: JSON.stringify({ dataUrl, filename: file.name })
            });
            if (res.status === 401) {
              showToast('请先登录车主账号后再上传实拍图片', 'error');
              resolve('');
              return;
            }
            if (res.ok) {
              const data = await res.json();
              if (data && data.url) { resolve(data.url); return; }
            }
          } catch (err) {}
        }
        resolve(dataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function getProductRealSales(productId, baseSales = 0) {
  let realSold = 0;
  orders
    .filter(o => o.status !== '已取消' && o.status !== '已退款')
    .forEach(o => (o.items || []).forEach(item => {
      if (item.id === productId) realSold += Number(item.quantity || 1);
    }));
  const cleanBase = Number.isFinite(Number(baseSales)) ? Math.max(0, Number(baseSales)) : 0;
  return cleanBase + realSold;
}

function rebuildProductsList() {
  orders = readLocalData('auto_shop_orders', []);
  customCatalog = readLocalData('auto_shop_custom_products', []);
  deletedProductIds = readLocalData('auto_shop_deleted_ids', []);
  productOverrides = readLocalData('auto_shop_product_overrides', {});
  stockMap = readLocalData('auto_shop_stock_map', {});
  skuStockMap = readLocalData('auto_shop_sku_stock_map', {});

  const combined = [...customCatalog, ...BASE_CATALOG]
    .filter(item => !deletedProductIds.includes(item.id))
    .map(item => {
      const ov = productOverrides[item.id] || {};
      return { ...item, ...ov };
    })
    .filter(item => item.onSale !== false);

  PRODUCTS = combined.map(item => {
    const basePrice = Number(item.price) || 59;
    const totalStock = stockMap[item.id] !== undefined
      ? Number(stockMap[item.id])
      : (item.stock !== undefined ? Number(item.stock) : 20);
    const variantSkus = parseVariantSkus(item.variantSkus || item.variants, basePrice, totalStock, item.id, skuStockMap);
    const mainImage = resolveProductImage(item.img, item.cat);
    const rawGallery = Array.isArray(item.gallery) ? item.gallery : (typeof item.gallery === 'string' ? item.gallery.split(/[,，]/).map(s => s.trim()).filter(Boolean) : []);
    const gallery = Array.from(new Set([mainImage, ...rawGallery.map(g => resolveProductImage(g, item.cat))]));

    return {
      id: item.id,
      name: item.name,
      nameEn: item.nameEn || '',
      subEn: item.subEn || '',
      category: item.cat,
      categoryLabel: (CATEGORY_META[item.cat] || CATEGORY_META.all).title,
      fitment: item.fit,
      fitBrands: item.fitBrands || 'universal',
      fitYears: item.fitYears || '2015-2026',
      fitmentLabel: item.fitText,
      price: basePrice,
      stock: totalStock,
      badge: item.badge || '',
      redirectUrl: item.redirectUrl || '',
      videoUrl: item.videoUrl || '',
      beforeImg: item.beforeImg ? resolveProductImage(item.beforeImg, item.cat) : '',
      afterImg: item.afterImg ? resolveProductImage(item.afterImg, item.cat) : '',
      gallery,
      isTemplate: Boolean(item.isTemplate) && !item.isEditedByMerchant,
      isNewArrival: Boolean(item.isNewArrival),
      sales: getProductRealSales(item.id, item.baseSales),
      specs: item.specs || ['原车开模', '无损安装'],
      image: mainImage,
      subtitle: item.sub,
      description: `${item.sub}。精选车规级材质打造，兼顾原车座舱/外观协调性与日常驾驶体验。`,
      variants: variantSkus.map(v => v.name),
      variantSkus,
      params: {
        '所属类目': (CATEGORY_META[item.cat] || CATEGORY_META.all).title,
        '主体材质': item.material || '车规级精选环保材质',
        '适配车型': item.fitText,
        '适用年份': item.fitYears || '2015-2026 款',
        '质保服务': '7天无理由退换 · 运输破损包赔'
      },
      installGuide: item.install || '直接卡入或使用附赠3M无损背胶固定，不破坏原车线路与内饰。',
      diyDifficulty: item.diyDifficulty || '',
      diyDuration: item.diyDuration || '',
      boxContents: Array.isArray(item.boxContents) ? item.boxContents.filter(Boolean) : [],
      reviews: []
    };
  });

  const counts = { all: PRODUCTS.length, interior: 0, exterior: 0, storage: 0, scent: 0 };
  PRODUCTS.forEach(p => { if (counts[p.category] !== undefined) counts[p.category]++; });

  const topTotalEl = document.getElementById('top-total-products');
  if (topTotalEl) topTotalEl.textContent = counts.all;
  const heroMetricEl = document.getElementById('hero-metric-products');
  if (heroMetricEl) heroMetricEl.textContent = counts.all;

  ['interior', 'exterior', 'storage', 'scent'].forEach(cat => {
    const homeEl = document.getElementById(`home-count-${cat}`);
    const tabEl = document.getElementById(`tab-count-${cat}`);
    const tabBottomEl = document.getElementById(`tab-bottom-count-${cat}`);
    const navEl = document.getElementById(`nav-count-${cat}`);
    if (homeEl) homeEl.textContent = counts[cat];
    if (tabEl) tabEl.textContent = counts[cat];
    if (tabBottomEl) tabBottomEl.textContent = counts[cat];
    if (navEl) navEl.textContent = counts[cat];
  });
  const tabAllEl = document.getElementById('tab-count-all');
  if (tabAllEl) tabAllEl.textContent = counts.all;
  const tabBottomAllEl = document.getElementById('tab-bottom-count-all');
  if (tabBottomAllEl) tabBottomAllEl.textContent = counts.all;
  const navAllEl = document.getElementById('nav-count-all');
  if (navAllEl) navAllEl.textContent = counts.all;
  renderFeaturedProducts();
}

// ==========================================
// 2. 全局状态、三视图导航与 URL 独立路由 (?product=xxx & ?cat=xxx)
// ==========================================
let cart = readLocalData('auto_shop_cart', []);
let wishlist = readLocalData('auto_shop_wishlist', []);
let garage = readLocalData('auto_shop_garage_v2', { make: '', makeLabel: '', year: '', model: '', inferredFit: 'all' });
let currentUser = readLocalData('auto_shop_user', null);
let allUsers = readLocalData('auto_shop_users', []);
let userReviews = readLocalData('auto_shop_reviews', {});

let activeCategory = 'interior';
let searchKeyword = '';
let sortMode = 'sales-desc';
let inStockOnly = false;
let filterByGarage = true;
let priceRangeFilter = 'all';
let buyerOrderStatusFilter = 'all';
let compareProductIds = [];
let reviewSameCarOnly = false;
let appliedCouponObj = null;
let activeBundleDiscount = Number(readLocalData('auto_shop_bundle_discount', 0)) || 0;
let currentPayMethod = 'wechat';
let currentDetailProductId = null;
let lastCreatedOrderId = null;
let heroSlideIndex = 0;

const homeViewEl = document.getElementById('home-view');
const categoryViewEl = document.getElementById('category-view');
const detailViewEl = document.getElementById('product-detail-view');
const checkoutViewEl = document.getElementById('checkout-view');

function updateUrlQuery(paramsObj, replace = false) {
  try {
    const url = new URL(window.location.href);
    url.search = '';
    Object.entries(paramsObj).forEach(([k, v]) => {
      if (v) url.searchParams.set(k, v);
    });
    if (replace) window.history.replaceState(paramsObj, '', url.toString());
    else window.history.pushState(paramsObj, '', url.toString());
  } catch (e) {}
}

function showHomeView(pushHistory = true) {
  document.getElementById('nav-home-link')?.classList.add('is-active');
  document.getElementById('nav-shop-all')?.classList.remove('is-active');
  currentDetailProductId = null;
  homeViewEl.style.display = 'block';
  categoryViewEl.style.display = 'none';
  detailViewEl.style.display = 'none';
  if (checkoutViewEl) checkoutViewEl.style.display = 'none';
  if (pushHistory) updateUrlQuery({});
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openCategoryView(cat = 'all', pushHistory = true) {
  document.getElementById('nav-home-link')?.classList.remove('is-active');
  document.getElementById('nav-shop-all')?.classList.add('is-active');
  currentDetailProductId = null;
  activeCategory = cat;
  homeViewEl.style.display = 'none';
  detailViewEl.style.display = 'none';
  if (checkoutViewEl) checkoutViewEl.style.display = 'none';
  categoryViewEl.style.display = 'block';

  const meta = CATEGORY_META[cat] || CATEGORY_META.all;
  document.getElementById('cat-en-label').textContent = meta.en;
  const activeMeta = (currentSiteLang === 'en' && typeof CATEGORY_META_EN !== 'undefined' && CATEGORY_META_EN[activeCategory]) ? CATEGORY_META_EN[activeCategory] : meta;
  document.getElementById('cat-view-title').textContent = activeMeta.title;
  const catDescEl = document.getElementById('cat-view-desc');
  if (catDescEl) catDescEl.textContent = activeMeta.desc;

  document.querySelectorAll('.pill-switch').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.category === cat);
  });

  if (pushHistory) updateUrlQuery({ cat, search: searchKeyword.trim() || '' });
  renderProducts();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function handleRouteFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const prodId = params.get('product');
  const cat = params.get('cat');
  const kw = params.get('search');
  if (kw) {
    searchKeyword = kw;
    const sIn = document.getElementById('search-input');
    if (sIn) sIn.value = kw;
  }
  if (prodId && PRODUCTS.some(p => p.id === prodId)) {
    openProductDetail(prodId, true, false);
  } else if (cat) {
    openCategoryView(cat, false);
  } else if (kw) {
    openCategoryView('all', false);
  }
}

window.addEventListener('popstate', () => {
  const params = new URLSearchParams(window.location.search);
  const prodId = params.get('product');
  const cat = params.get('cat');
  if (prodId && PRODUCTS.some(p => p.id === prodId)) openProductDetail(prodId, false, false);
  else if (cat) openCategoryView(cat, false);
  else showHomeView(false);
});

document.querySelectorAll('.collection-card').forEach(card => {
  const openCollection = () => openCategoryView(card.dataset.category);
  card.addEventListener('click', openCollection);
  card.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openCollection();
    }
  });
});
document.querySelectorAll('.pill-switch').forEach(btn => {
  btn.addEventListener('click', () => {
    searchKeyword = '';
    document.getElementById('search-input').value = '';
    openCategoryView(btn.dataset.category);
  });
});

document.getElementById('logo-home-btn').addEventListener('click', (e) => { e.preventDefault(); showHomeView(); });
document.getElementById('cat-back-home-btn').addEventListener('click', () => showHomeView());
document.getElementById('detail-back-btn').addEventListener('click', () => openCategoryView(activeCategory));
(function initNavCatalogDropdown() {
  const wrap = document.getElementById('nav-catalog-dropdown');
  const trigger = document.getElementById('nav-shop-all');
  const menu = document.getElementById('nav-catalog-menu');
  if (!wrap || !trigger || !menu) return;
  const setOpen = (open) => {
    wrap.classList.toggle('open', open);
    trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
  };
  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    setOpen(!wrap.classList.contains('open'));
  });
  menu.querySelectorAll('.nav-catalog-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const cat = item.dataset.category || 'all';
      setOpen(false);
      openCategoryView(cat);
    });
  });
  document.addEventListener('click', (e) => {
    if (!wrap.contains(e.target)) setOpen(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setOpen(false);
  });
})();
const topAllShopBtn = document.getElementById('top-all-shop-btn');
if (topAllShopBtn) topAllShopBtn.addEventListener('click', () => openCategoryView('all'));

document.getElementById('share-product-link-btn').addEventListener('click', async () => {
  if (!currentDetailProductId) return;
  const shareUrl = new URL(window.location.href);
  shareUrl.search = `?product=${encodeURIComponent(currentDetailProductId)}`;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(shareUrl.toString());
    }
    showToast('商品直达链接已复制，可直接发给车友！');
  } catch (e) {
    showToast(`链接：${shareUrl.toString()}`);
  }
});

function scrollToCollections() {
  showHomeView();
  setTimeout(() => document.getElementById('collection-section').scrollIntoView({ behavior: 'smooth' }), 60);
}

const navMenuColBtn = document.getElementById('nav-menu-collections');
if (navMenuColBtn) navMenuColBtn.addEventListener('click', scrollToCollections);
document.getElementById('featured-shop-all').addEventListener('click', () => openCategoryView('all'));
document.getElementById('mobile-home-btn').addEventListener('click', () => showHomeView());
document.getElementById('mobile-shop-btn').addEventListener('click', () => openCategoryView('all'));
document.getElementById('mobile-collections-btn').addEventListener('click', scrollToCollections);
document.getElementById('mobile-orders-btn').addEventListener('click', () => document.getElementById('orders-nav-btn').click());
['hero-garage-btn', 'ownership-garage-btn', 'mobile-garage-btn'].forEach(id => {
  const btn = document.getElementById(id);
  if (!btn) return;
  btn.addEventListener('click', () => {
    toggleGarageBar();
  });
});

// ==========================================
// 3. 首屏轮播与联网车型匹配
// ==========================================
function updateHeroSlide() {
  const slide = HERO_SLIDES[heroSlideIndex] || HERO_SLIDES[0];
  const titleEl = document.getElementById('hero-title');
  const subEl = document.getElementById('hero-subtitle');
  const bgEl = document.getElementById('hero-bg-layer');
  const progEl = document.getElementById('hero-progress');
  const countEl = document.getElementById('hero-slide-count');
  if (bgEl) bgEl.style.backgroundImage = `url('${slide.bg}')`;
  if (titleEl && bgEl) titleEl.textContent = slide.title;
  if (subEl && bgEl) subEl.textContent = slide.subtitle;
  if (progEl) progEl.style.width = `${((heroSlideIndex + 1) / HERO_SLIDES.length) * 100}%`;
  if (countEl) countEl.textContent = `${String(heroSlideIndex + 1).padStart(2, '0')} / ${String(HERO_SLIDES.length).padStart(2, '0')}`;
}
applyCmsToView();

function changeHeroSlide(direction) {
  heroSlideIndex = (heroSlideIndex + direction + HERO_SLIDES.length) % HERO_SLIDES.length;
  updateHeroSlide();
}
const heroPrevBtn = document.getElementById('hero-prev');
const heroNextBtn = document.getElementById('hero-next');
if (heroPrevBtn) heroPrevBtn.addEventListener('click', () => changeHeroSlide(-1));
if (heroNextBtn) heroNextBtn.addEventListener('click', () => changeHeroSlide(1));

const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
let heroTimer = null;
function startHeroAutoplay() {
  clearInterval(heroTimer);
  if (!reduceMotionQuery.matches && document.getElementById('nitro-hero')) {
    heroTimer = setInterval(() => changeHeroSlide(1), 7000);
  }
}
const heroSection = document.getElementById('nitro-hero');
if (heroSection) {
  heroSection.addEventListener('mouseenter', () => clearInterval(heroTimer));
  heroSection.addEventListener('mouseleave', startHeroAutoplay);
  heroSection.addEventListener('focusin', () => clearInterval(heroTimer));
  heroSection.addEventListener('focusout', startHeroAutoplay);
  document.addEventListener('visibilitychange', () => document.hidden ? clearInterval(heroTimer) : startHeroAutoplay());
}
startHeroAutoplay();

const garageModalEl = document.getElementById('garage-modal');
const garageBtnTextEl = document.getElementById('garage-btn-text');
const makeSelect = document.getElementById('car-make-select');
const yearSelect = document.getElementById('car-year-select');
const modelSelect = document.getElementById('car-model-select');
const resetCarBtn = document.getElementById('reset-car-btn');
const garageStatusEl = document.getElementById('garage-status');

function toggleGarageBar() {
  if (!garageModalEl) return;
  const willOpen = !garageModalEl.classList.contains('active');
  garageModalEl.classList.toggle('active', willOpen);
  if (willOpen && floatingSearchBar && floatingSearchBar.style.display !== 'none') setSearchOpen(false);
  if (willOpen && makeSelect) setTimeout(() => makeSelect.focus(), 60);
}
const closeGarageModalBtn = document.getElementById('close-garage-modal');
if (closeGarageModalBtn && garageModalEl) {
  closeGarageModalBtn.addEventListener('click', () => garageModalEl.classList.remove('active'));
}
const garageApplyBtn = document.getElementById('garage-apply-btn');
if (garageApplyBtn && garageModalEl) {
  garageApplyBtn.addEventListener('click', () => {
    updateGarageUI();
    garageModalEl.classList.remove('active');
    if (garage.make && garage.model) {
      saveCarToGarageList(garage);
      showToast(`已确认爱车：${garage.year}款 ${garage.makeLabel} ${garage.model}`);
    } else {
      showToast('已更新车型设置');
    }
    if (categoryViewEl.style.display === 'block') renderProducts();
    if (currentDetailProductId) openProductDetail(currentDetailProductId, false, false);
  });
}

// 热门车系直达快捷按钮
document.querySelectorAll('.hot-car-pill').forEach(pill => {
  pill.addEventListener('click', async () => {
    const make = pill.dataset.make || '';
    const makeLabel = pill.dataset.makeLabel || '';
    const model = pill.dataset.model || '';
    if (!make || !model) return;
    document.querySelectorAll('.hot-car-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    garage = {
      make,
      makeLabel,
      year: '2025',
      model,
      inferredFit: inferVehicleFitment(make, model)
    };
    filterByGarage = true;
    writeLocalData('auto_shop_garage_v2', garage);
    makeSelect.value = make;
    yearSelect.value = '2025';
    await fetchModelsFromNetwork(make, '2025', model);
    updateGarageUI();
    showToast(`已匹配爱车：2025款 ${makeLabel} ${model}`);
    openCategoryView('all');
  });
});
const garageToggleBtn = document.getElementById('garage-toggle-btn');
if (garageToggleBtn) garageToggleBtn.addEventListener('click', toggleGarageBar);
const navGarageShortcut = document.getElementById('nav-garage-shortcut');
if (navGarageShortcut) navGarageShortcut.addEventListener('click', toggleGarageBar);

CAR_BRANDS.forEach(b => {
  const opt = document.createElement('option');
  opt.value = b.apiMake;
  opt.textContent = b.label;
  makeSelect.appendChild(opt);
});
const currentModelYear = new Date().getFullYear();
for (let y = currentModelYear; y >= 2015; y--) {
  const opt = document.createElement('option');
  opt.value = y;
  opt.textContent = `${y} 款`;
  yearSelect.appendChild(opt);
}

function inferVehicleFitment(make, model) {
  const text = `${make} ${model}`.toLowerCase();
  if (/tesla|byd|nio|xiaomi|su7|model|汉|海豹|宋|秦|元|海豚|海鸥|理想|蔚来|小鹏|极氪|id\.|ev|taycan/.test(text)) return 'ev';
  if (/suv|cr-v|rav4|highlander|tiguan|x3|x5|glc|q5|q3|rogue|qashqai|edge|macan|cayenne|卡宴|荣放|汉兰达|途观|星越|博越|奇骏|逍客|锐界|l6|l7|l8|l9|唐/.test(text)) return 'suv';
  return 'sedan';
}

async function fetchModelsFromNetwork(apiMake, year, preselectModel = '') {
  const brandObj = CAR_BRANDS.find(b => b.apiMake === apiMake);
  modelSelect.disabled = true;
  modelSelect.innerHTML = '<option value="">正在检索适配车型库...</option>';
  garageStatusEl.textContent = '正在加载品牌车型数据库...';

  let onlineModels = [];
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4500);
  try {
    const res = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/${encodeURIComponent(apiMake)}/modelyear/${encodeURIComponent(year)}?format=json`, { signal: controller.signal });
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.Results)) onlineModels = data.Results.map(r => r.Model_Name).filter(Boolean);
    }
  } catch (err) {} finally {
    clearTimeout(timeoutId);
  }

  const hotList = brandObj ? brandObj.hotModels : [];
  const combined = Array.from(new Set([...hotList, ...onlineModels])).slice(0, 45);
  modelSelect.innerHTML = '<option value="">3. 选择具体型号</option>';
  combined.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m;
    opt.textContent = m;
    modelSelect.appendChild(opt);
  });
  modelSelect.disabled = false;
  if (preselectModel) modelSelect.value = preselectModel;
  garageStatusEl.textContent = onlineModels.length > 0 ? `已同步 ${combined.length} 款登记车型` : `已加载该品牌 ${combined.length} 款主力升级车型`;
}

function updateGarageUI() {
  if (garage.make && garage.year && garage.model) {
    garageBtnTextEl.textContent = `我的爱车 · ${garage.year}款 ${garage.makeLabel} ${garage.model}`;
    garageStatusEl.textContent = `✓ 已启用精准防错核验：${garage.year}款 ${garage.makeLabel} ${garage.model}`;
    resetCarBtn.style.display = 'inline-block';
  } else {
    garageBtnTextEl.textContent = '我的爱车';
    resetCarBtn.style.display = garage.make ? 'inline-block' : 'none';
  }
}

makeSelect.addEventListener('change', () => {
  const brandObj = CAR_BRANDS.find(b => b.apiMake === makeSelect.value);
  garage.make = makeSelect.value;
  garage.makeLabel = brandObj ? brandObj.label.split(' ')[0] : '';
  garage.model = '';
  garage.inferredFit = 'all';
  writeLocalData('auto_shop_garage_v2', garage);
  if (garage.make && !yearSelect.value) { yearSelect.value = '2025'; garage.year = '2025'; }
  if (garage.make && garage.year) fetchModelsFromNetwork(garage.make, garage.year);
  else { modelSelect.innerHTML = '<option value="">3. 先选品牌与年份</option>'; modelSelect.disabled = true; garageStatusEl.textContent = ''; }
  updateGarageUI();
  renderProducts();
});

yearSelect.addEventListener('change', () => {
  garage.year = yearSelect.value;
  garage.model = '';
  garage.inferredFit = 'all';
  writeLocalData('auto_shop_garage_v2', garage);
  if (garage.make && garage.year) fetchModelsFromNetwork(garage.make, garage.year);
  updateGarageUI();
  renderProducts();
});

modelSelect.addEventListener('change', () => {
  garage.model = modelSelect.value;
  garage.inferredFit = garage.model ? inferVehicleFitment(garage.make, garage.model) : 'all';
  writeLocalData('auto_shop_garage_v2', garage);
  updateGarageUI();
  if (currentDetailProductId) openProductDetail(currentDetailProductId, false, false);
  else renderProducts();
});

resetCarBtn.addEventListener('click', () => {
  garage = { make: '', makeLabel: '', year: '', model: '', inferredFit: 'all' };
  writeLocalData('auto_shop_garage_v2', garage);
  makeSelect.value = '';
  yearSelect.value = '';
  modelSelect.innerHTML = '<option value="">3. 先选品牌与年份</option>';
  modelSelect.disabled = true;
  garageStatusEl.textContent = '';
  updateGarageUI();
  if (currentDetailProductId) openProductDetail(currentDetailProductId, false, false);
  else renderProducts();
});

if (garage.make && garage.year) {
  makeSelect.value = garage.make;
  yearSelect.value = garage.year;
  fetchModelsFromNetwork(garage.make, garage.year, garage.model).then(updateGarageUI);
}

// ==========================================
// 4. 搜索与商品列表渲染（含精准适配防错标签与多SKU起步价）
// ==========================================
const floatingSearchBar = document.getElementById('floating-search-bar');
const searchInputEl = document.getElementById('search-input');

function setSearchOpen(isOpen) {
  floatingSearchBar.style.display = isOpen ? 'block' : 'none';
  document.getElementById('search-toggle-btn').setAttribute('aria-expanded', String(isOpen));
  if (isOpen) { if (garageModalEl) garageModalEl.classList.remove('active'); searchInputEl.focus(); }
}
document.getElementById('search-toggle-btn').addEventListener('click', () => {
  setSearchOpen(floatingSearchBar.style.display === 'none');
});
document.getElementById('close-search-btn').addEventListener('click', () => setSearchOpen(false));
let searchDebounceTimer = null;
searchInputEl.addEventListener('input', (e) => {
  searchKeyword = e.target.value;
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    if (searchKeyword.trim() !== '' && categoryViewEl.style.display === 'none') openCategoryView('all');
    else if (categoryViewEl.style.display === 'block') renderProducts();
  }, 160);
});
searchInputEl.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    searchInputEl.value = '';
    searchKeyword = '';
    setSearchOpen(false);
    if (categoryViewEl.style.display === 'block') renderProducts();
  }
});
document.getElementById('sort-select').addEventListener('change', (e) => { sortMode = e.target.value; renderProducts(); });

function getBuyerPurchasedCountMap() {
  const allOrders = readLocalData('auto_shop_orders', []);
  const savedAddr = readLocalData('auto_shop_saved_checkout_addr', {});
  const myPhone = currentUser ? currentUser.phone : (savedAddr.phone || '');
  const map = {};
  (Array.isArray(allOrders) ? allOrders : []).forEach(o => {
    if (!o || o.status === '已取消' || o.status === '已退款') return;
    if (myPhone && o.phone && o.phone !== myPhone && o.buyerPhone !== myPhone) return;
    (o.items || []).forEach(i => {
      if (i && i.id) {
        map[i.id] = (map[i.id] || 0) + (Number(i.quantity) || 1);
      }
    });
  });
  return map;
}

function getProductCardHTML(product) {
  const isLiked = wishlist.includes(product.id);
  const outOfStock = product.stock <= 0;
  const productId = encodeURIComponent(String(product.id));
  const firstSku = product.variantSkus[0] || { name: '标准通用款', price: product.price };
  const firstVariant = encodeURIComponent(String(firstSku.name));
  const name = escapeHTML(typeof getLocalizedProductName === 'function' ? getLocalizedProductName(product) : product.name);

  // 精准车型核验角标
  const fitCheck = checkVehicleFitmentPrecision(product, garage);
  const matchTag = fitCheck.badgeText
    ? `<span class="fit-match-pill ${fitCheck.status === 'mismatch' ? 'is-mismatch' : ''}">${escapeHTML(fitCheck.badgeText)}</span>`
    : '';

  const hasMultiPrice = product.variantSkus.some(s => s.price !== firstSku.price);
  const minPrice = Math.min(...product.variantSkus.map(s => s.price));

  const boughtMap = getBuyerPurchasedCountMap();
  const boughtCount = boughtMap[product.id] || 0;

  // 图片左上角单一清爽角标：常购优先，不遮挡文字内容
  let topLeftBadge = '';
  if (boughtCount > 0) {
    topLeftBadge = `<span class="frequent-buy-badge">★ ${currentSiteLang === 'en' ? (boughtCount >= 2 ? `Frequent ×${boughtCount}` : 'Frequent') : (boughtCount >= 2 ? `常购 ×${boughtCount}` : '常购')}</span>`;
  } else if (outOfStock) {
    topLeftBadge = `<span class="product-badge" style="background:#f43f5e;color:#fff;">${currentSiteLang === 'en' ? 'Sold Out' : '已售罄'}</span>`;
  } else if (product.isNewArrival) {
    topLeftBadge = `<span class="product-badge">${currentSiteLang === 'en' ? 'NEW DROP' : '新品首推'}</span>`;
  } else if (product.badge) {
    topLeftBadge = `<span class="product-badge">${escapeHTML(typeof getLocalizedBadge === 'function' ? getLocalizedBadge(product.badge) : product.badge)}</span>`;
  }

  return `
    <article class="product-card product-card-minimal ${outOfStock ? 'is-sold-out' : ''} ${boughtCount > 0 ? 'is-frequent-buy' : ''}">
      <div class="product-img-box">
        ${topLeftBadge}
        ${matchTag}
        <button type="button" class="product-image-link" onclick="openProductDetail(decodeURIComponent('${productId}'))" aria-label="查看 ${name}">
          <img src="${safeImageUrl(product.image, product.category)}" alt="${name}" loading="lazy" decoding="async" width="800" height="800" onerror="this.onerror=null;this.src='assets/hero-auto-minimal.webp';">
        </button>
        <button type="button" class="wish-icon-btn ${isLiked ? 'liked' : ''}" onclick="toggleWishlist(event, decodeURIComponent('${productId}'))" aria-label="${isLiked ? '取消收藏' : '收藏'} ${name}" title="${isLiked ? '取消收藏' : '加入心愿单'}">${isLiked ? '♥' : '♡'}</button>
      </div>
      <h3 class="product-title"><button type="button" class="product-title-link" onclick="openProductDetail(decodeURIComponent('${productId}'))">${name}</button></h3>
      <div class="product-bottom">
        <span class="product-price">¥${Number(minPrice).toFixed(1)}${hasMultiPrice ? '<small style="font-size:0.72rem;color:#8e95a2;font-weight:400;"> 起</small>' : ''}</span>
        ${outOfStock ? '<span style="font-size:0.72rem;color:#f43f5e;">缺货</span>' : ''}
      </div>
    </article>`;
}

function getProductRatingScore(product) {
  const revs = Array.isArray(userReviews[product.id]) ? userReviews[product.id] : [];
  const avgRating = revs.length
    ? revs.reduce((sum, r) => sum + (Number(r.rating) || 5), 0) / revs.length
    : 4.9;
  const sales = Number(product.sales) || 0;
  return { avgRating, sales, score: avgRating * 200 + sales };
}

function buildEditorialSpotlightCard(product, isHero, boughtCount) {
  const pid = encodeURIComponent(String(product.id));
  const name = escapeHTML(typeof getLocalizedProductName === 'function' ? getLocalizedProductName(product) : product.name);
  const minPrice = Math.min(...(product.variantSkus || [{ price: product.price }]).map(s => s.price));
  const tagText = boughtCount > 0 ? '★ 常购' : (product.isNewArrival ? 'NEW DROP' : escapeHTML(product.categoryLabel || 'FEATURED'));
  if (isHero) {
    return `
      <article class="editorial-hero-drop" onclick="openProductDetail(decodeURIComponent('${pid}'))" role="button" tabindex="0" aria-label="查看 ${name}">
        <div class="editorial-hero-media">
          <span class="editorial-drop-tag">${tagText}</span>
          <img src="${safeImageUrl(product.image, product.category)}" alt="${name}" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='assets/hero-auto-minimal.webp';">
        </div>
        <div class="editorial-hero-body">
          <span class="editorial-hero-cat">${escapeHTML(product.categoryLabel || '')}</span>
          <h3 class="editorial-hero-title">${name}</h3>
          <div class="editorial-hero-foot">
            <span class="editorial-hero-price">¥${Number(minPrice).toFixed(1)}</span>
            <span class="editorial-hero-cta">探索详情 →</span>
          </div>
        </div>
      </article>`;
  }
  return `
    <article class="editorial-row-drop" onclick="openProductDetail(decodeURIComponent('${pid}'))" role="button" tabindex="0" aria-label="查看 ${name}">
      <div class="editorial-row-thumb">
        ${boughtCount > 0 ? '<span class="editorial-mini-tag">★ 常购</span>' : ''}
        <img src="${safeImageUrl(product.image, product.category)}" alt="${name}" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='assets/hero-auto-minimal.webp';">
      </div>
      <div class="editorial-row-info">
        <span class="editorial-row-cat">${tagText}</span>
        <h3 class="editorial-row-title">${name}</h3>
        <span class="editorial-row-price">¥${Number(minPrice).toFixed(1)}</span>
      </div>
      <span class="editorial-row-arrow" aria-hidden="true">→</span>
    </article>`;
}

function renderNewArrivals() {
  const grid = document.getElementById('new-arrivals-grid');
  const jumpWrap = document.getElementById('new-drop-top-jump-wrap');
  const titleEl = document.getElementById('new-arrivals-title');
  const pillEl = document.getElementById('new-arrivals-pill');
  if (!grid) return;

  const boughtMap = getBuyerPurchasedCountMap();
  const inStock = PRODUCTS.filter(p => p.stock > 0);
  const pool = inStock.length >= 4 ? inStock : [...PRODUCTS];

  // 仅当商家上架了新品（设为新品首推或新增自定义商品）时，才显示主页顶部动画跳转箭头
  const actualNewArrivals = pool
    .filter(p => p.isNewArrival === true || String(p.id).startsWith('custom_'))
    .sort((a, b) => (boughtMap[b.id] || 0) - (boughtMap[a.id] || 0));

  const hasNewArrivals = actualNewArrivals.length > 0;
  if (jumpWrap) jumpWrap.style.display = hasNewArrivals ? '' : 'none';

  let picks = [];
  if (hasNewArrivals) {
    if (titleEl) titleEl.textContent = '新品首推';
    if (pillEl) { pillEl.textContent = 'NEW DROP'; pillEl.style.display = ''; }
    picks = actualNewArrivals.slice(0, 4);
  } else {
    if (titleEl) titleEl.textContent = '精选首发企划';
    if (pillEl) { pillEl.textContent = 'CURATED'; pillEl.style.display = ''; }
    const pickedIds = new Set();
    for (const cat of ['interior', 'exterior', 'storage', 'scent']) {
      const cand = pool.find(p => p.category === cat && !pickedIds.has(p.id));
      if (cand) { picks.push(cand); pickedIds.add(cand.id); }
    }
  }

  if (!picks.length) {
    grid.innerHTML = '<div class="empty-state"><strong>新品正在筹备上架中</strong></div>';
    return;
  }

  const heroProd = picks[0];
  const sideProds = picks.slice(1, 4);
  grid.innerHTML = `
    <div class="editorial-bento-left">
      ${buildEditorialSpotlightCard(heroProd, true, boughtMap[heroProd.id] || 0)}
    </div>
    <div class="editorial-bento-right">
      ${sideProds.map(p => buildEditorialSpotlightCard(p, false, boughtMap[p.id] || 0)).join('')}
    </div>`;
}

function renderCatalogBestsellers() {
  const sec = document.getElementById('catalog-bestsellers-section');
  const grid = document.getElementById('catalog-bestsellers-grid');
  const titleEl = document.getElementById('catalog-bestsellers-title');
  if (!sec || !grid) return;

  const basePool = activeCategory === 'all'
    ? PRODUCTS.filter(p => p.stock > 0)
    : PRODUCTS.filter(p => p.category === activeCategory && p.stock > 0);
  const pool = basePool.length ? basePool : PRODUCTS;
  const top4 = [...pool]
    .sort((a, b) => getProductRatingScore(b).score - getProductRatingScore(a).score)
    .slice(0, 4);

  if (!top4.length) {
    sec.style.display = 'none';
    return;
  }
  sec.style.display = '';
  if (titleEl) {
    const catMeta = CATEGORY_META[activeCategory] || CATEGORY_META.all;
    titleEl.textContent = activeCategory === 'all'
      ? '全站口碑高销量 TOP 4'
      : `${catMeta.title} · 销量热榜 TOP 4`;
  }
  grid.innerHTML = top4.map((p, idx) => {
    const pid = encodeURIComponent(String(p.id));
    const minPrice = Math.min(...(p.variantSkus || [{ price: p.price }]).map(s => s.price));
    return `
      <article class="bestseller-mini-card" onclick="openProductDetail(decodeURIComponent('${pid}'))" role="button" tabindex="0">
        <span class="bestseller-rank-badge">TOP ${idx + 1}</span>
        <img src="${safeImageUrl(p.image, p.category)}" alt="${escapeHTML(p.name)}" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='assets/hero-auto-minimal.webp';">
        <div class="bestseller-mini-info">
          <div class="bestseller-mini-name">${escapeHTML(p.name)}</div>
          <div class="bestseller-mini-foot">
            <span class="bestseller-mini-price">¥${Number(minPrice).toFixed(1)}</span>
            <span class="bestseller-mini-sales">已售 ${Number(p.sales) || 0}</span>
          </div>
        </div>
      </article>`;
  }).join('');
}

const newArrivalsAllBtn = document.getElementById('new-arrivals-all-btn');
if (newArrivalsAllBtn) {
  newArrivalsAllBtn.addEventListener('click', () => openCategoryView('all'));
}

function renderFeaturedProducts() {
  renderNewArrivals();
  const grid = document.getElementById('featured-grid');
  if (!grid) return;
  const sorted = [...PRODUCTS].sort((a, b) => {
    if (a.isTemplate !== b.isTemplate) return a.isTemplate ? 1 : -1;
    return b.sales - a.sales;
  });
  const featured = sorted.slice(0, 4);
  grid.innerHTML = featured.length
    ? featured.map(getProductCardHTML).join('')
    : '<div class="empty-state"><strong>新品正在筹备上架中</strong><p>请稍后再来逛逛，或通过顶部搜索查找其他车品。</p></div>';
}

window.clearProductFilters = function() {
  searchKeyword = '';
  searchInputEl.value = '';
  inStockOnly = false;
  filterByGarage = true;
  priceRangeFilter = 'all';
  const ps = document.getElementById('price-range-select'); if (ps) ps.value = 'all';
  const cb = document.getElementById('in-stock-only-toggle');
  if (cb) cb.checked = false;
  document.querySelectorAll('.hot-car-pill').forEach(p => p.classList.remove('active'));
  if (garage.make) document.getElementById('reset-car-btn').click();
  openCategoryView('all');
};

function renderActiveFilterBar() {
  const bar = document.getElementById('active-filter-bar');
  if (!bar) return;
  const chips = [];
  if (garage.model) {
    const carTitle = `${garage.year ? garage.year + '款 ' : ''}${garage.makeLabel || ''} ${garage.model}`.trim();
    if (filterByGarage) {
      chips.push(`<button type="button" class="filter-chip" onclick="toggleGarageFilterMode()">🚗 仅看适配 ${escapeHTML(carTitle)}（点击查看全部）✕</button>`);
    } else {
      chips.push(`<button type="button" class="filter-chip is-neutral" onclick="toggleGarageFilterMode()">🚗 当前车型：${escapeHTML(carTitle)}（已显示全站商品，点击仅看适配）</button>`);
    }
  }
  if (searchKeyword.trim() !== '') {
    chips.push(`<button type="button" class="filter-chip" onclick="clearSearchFilter()">🔍 搜索：${escapeHTML(searchKeyword.trim())} ✕</button>`);
  }
  if (inStockOnly) {
    chips.push(`<button type="button" class="filter-chip" onclick="clearInStockFilter()">📦 仅看有货 ✕</button>`);
  }
  if (priceRangeFilter !== 'all') {
    const pLabel = priceRangeFilter === '0-50' ? '¥50 以下' : (priceRangeFilter === '50-100' ? '¥50–100' : '¥100 以上');
    chips.push(`<button type="button" class="filter-chip" onclick="clearPriceFilter()">💰 ${pLabel} ✕</button>`);
  }
  if (chips.length === 0) {
    bar.style.display = 'none';
    bar.innerHTML = '';
    return;
  }
  bar.style.display = 'flex';
  bar.innerHTML = `<span class="active-filter-label">当前筛选：</span>${chips.join('')}<button type="button" class="filter-chip is-neutral" onclick="clearProductFilters()">重置全部</button>`;
}

window.toggleGarageFilterMode = function() {
  filterByGarage = !filterByGarage;
  renderProducts();
};
window.clearSearchFilter = function() {
  searchKeyword = '';
  searchInputEl.value = '';
  renderProducts();
};
window.clearInStockFilter = function() {
  inStockOnly = false;
  const cb = document.getElementById('in-stock-only-toggle');
  if (cb) cb.checked = false;
  renderProducts();
};
window.clearPriceFilter = function() {
  priceRangeFilter = 'all';
  const sel = document.getElementById('price-range-select');
  if (sel) sel.value = 'all';
  renderProducts();
};
const priceRangeSelEl = document.getElementById('price-range-select');
if (priceRangeSelEl) {
  priceRangeSelEl.addEventListener('change', (e) => {
    priceRangeFilter = e.target.value;
    renderProducts();
  });
}

const inStockToggleEl = document.getElementById('in-stock-only-toggle');
if (inStockToggleEl) {
  inStockToggleEl.addEventListener('change', (e) => {
    inStockOnly = e.target.checked;
    renderProducts();
  });
}

function renderProducts() {
  const productGridEl = document.getElementById('product-grid');
  let list = [...PRODUCTS];

  if (activeCategory !== 'all') list = list.filter(p => p.category === activeCategory);
  if (garage.model && filterByGarage && garage.inferredFit !== 'all') {
    list = list.filter(p => {
      const check = checkVehicleFitmentPrecision(p, garage);
      return check.status !== 'mismatch';
    });
  }
  if (inStockOnly) {
    list = list.filter(p => p.stock > 0);
  }
  if (priceRangeFilter === '0-50') list = list.filter(p => p.price < 50);
  else if (priceRangeFilter === '50-100') list = list.filter(p => p.price >= 50 && p.price <= 100);
  else if (priceRangeFilter === '100+') list = list.filter(p => p.price > 100);
  if (searchKeyword.trim() !== '') {
    const kw = searchKeyword.trim().toLowerCase();
    list = list.filter(p =>
      String(p.name).toLowerCase().includes(kw) ||
      String(p.subtitle).toLowerCase().includes(kw) ||
      String(p.categoryLabel).includes(kw) ||
      String(p.fitmentLabel).toLowerCase().includes(kw) ||
      String(p.fitBrands || '').toLowerCase().includes(kw)
    );
  }

  const boughtMap = getBuyerPurchasedCountMap();
  if (sortMode === 'sales-desc') list.sort((a, b) => b.sales - a.sales);
  else if (sortMode === 'price-asc') list.sort((a, b) => a.price - b.price);
  else if (sortMode === 'price-desc') list.sort((a, b) => b.price - a.price);
  else {
    // 默认综合排序：将买家已购买过的商品自动置顶排在首位（按购买次数降序）
    list.sort((a, b) => {
      const cA = boughtMap[a.id] || 0;
      const cB = boughtMap[b.id] || 0;
      if (cA !== cB) return cB - cA;
      return 0;
    });
  }

  renderActiveFilterBar();
  document.getElementById('result-count-label').textContent = `共 ${list.length} 件商品`;
  productGridEl.innerHTML = list.length === 0
    ? '<div class="empty-state"><strong>没有找到匹配当前筛选的商品</strong><p>试试其他关键词，或点击下方按钮重置筛选条件。</p><button type="button" class="dark-outline-btn" style="margin-top:16px;" onclick="clearProductFilters()">清除筛选</button></div>'
    : list.map(getProductCardHTML).join('');
}

// ==========================================
// 5. 收藏与独立商品详情页（多图画廊、装车前后对比滑块、多SKU独立价、组合购、晒图评价）
// ==========================================
window.toggleWishlist = function(e, productId) {
  if (e) { e.stopPropagation(); e.preventDefault(); }
  wishlist = wishlist.includes(productId) ? wishlist.filter(id => id !== productId) : [...wishlist, productId];
  writeLocalData('auto_shop_wishlist', wishlist);
  document.getElementById('wishlist-count').textContent = wishlist.length;
  renderProducts();
  renderFeaturedProducts();
  if (document.getElementById('wishlist-modal').classList.contains('active')) renderWishlistModal();
  if (currentDetailProductId === productId) {
    const detailWishBtn = document.getElementById('detail-wish-btn');
    if (detailWishBtn) {
      const liked = wishlist.includes(productId);
      detailWishBtn.className = `detail-wish-btn ${liked ? 'liked' : ''}`;
      detailWishBtn.textContent = liked ? '♥ 已收藏' : '♡ 收藏';
    }
  }
};

const wishlistModal = document.getElementById('wishlist-modal');
function renderWishlistModal() {
  const container = document.getElementById('wishlist-container');
  const likedProducts = PRODUCTS.filter(p => wishlist.includes(p.id));
  container.innerHTML = likedProducts.length === 0
    ? '<div class="empty-state"><strong>心愿单还是空的</strong><p>点击商品右上角的 ♡，把喜欢的车品先收藏起来。</p></div>'
    : likedProducts.map(p => {
      const id = encodeURIComponent(String(p.id));
      const variant = encodeURIComponent(String(p.variants[0] || '标准通用款'));
      return `<div class="wish-row"><button type="button" class="wish-image-btn" onclick="wishlistModal.classList.remove('active');openProductDetail(decodeURIComponent('${id}'))"><img src="${safeImageUrl(p.image, p.category)}" alt="${escapeHTML(p.name)}"></button><div style="flex:1;min-width:0;"><div style="font-weight:600;font-size:0.92rem;">${escapeHTML(p.name)}</div><div style="font-size:0.84rem;color:#8e95a2;">¥${p.price.toFixed(1)} · 库存 ${p.stock} 件</div></div><button type="button" class="quick-add-btn" ${p.stock <= 0 ? 'disabled' : `onclick="addToCart(decodeURIComponent('${id}'),decodeURIComponent('${variant}'),1,this)"`}>${p.stock <= 0 ? '缺货' : '加购'}</button><button type="button" class="close-btn" aria-label="取消收藏 ${escapeHTML(p.name)}" onclick="toggleWishlist(event,decodeURIComponent('${id}'))">✕</button></div>`;
    }).join('');
}
document.getElementById('wishlist-nav-btn').addEventListener('click', () => { renderWishlistModal(); wishlistModal.classList.add('active'); });
document.getElementById('close-wishlist-modal').addEventListener('click', () => wishlistModal.classList.remove('active'));

function computeRealRatingSummary(reviewsList) {
  if (!Array.isArray(reviewsList) || reviewsList.length === 0) {
    return { stars: '☆☆☆☆☆', avgText: '暂无评分', countText: '暂无车主评价（欢迎首位车主晒单）' };
  }
  const scores = reviewsList.map(r => {
    const starCount = (String(r.rating || '★★★★★').match(/★/g) || []).length;
    return Math.min(5, Math.max(1, starCount || 5));
  });
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const rounded = Math.round(avg);
  const stars = '★'.repeat(rounded) + '☆'.repeat(5 - rounded);
  return {
    stars,
    avgText: avg.toFixed(1),
    countText: `${reviewsList.length} 条真实车主评价`
  };
}

// 检查当前买家是否真实买过该商品（自动打上 [✓ 已购车主认证] 标签）
function hasBuyerPurchasedProduct(productId) {
  const savedAddr = readLocalData('auto_shop_saved_checkout_addr', {});
  const myPhone = currentUser ? currentUser.phone : (savedAddr.phone || '');
  return orders.some(o =>
    o.status !== '已取消' &&
    (!myPhone || o.phone === myPhone) &&
    (o.items || []).some(i => i.id === productId)
  );
}

let pendingReviewPhotos = [];

window.openProductDetail = function(productId, shouldScroll = true, pushHistory = true) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  userReviews = readLocalData('auto_shop_reviews', {});
  currentDetailProductId = productId;
  activeCategory = product.category;
  let recentIds = readLocalData('auto_shop_recent_views', []);
  if (!Array.isArray(recentIds)) recentIds = [];
  recentIds = [productId, ...recentIds.filter(id => id !== productId)].slice(0, 6);
  try { localStorage.setItem('auto_shop_recent_views', JSON.stringify(recentIds)); } catch (e) {}
  pendingReviewPhotos = [];
  homeViewEl.style.display = 'none';
  categoryViewEl.style.display = 'none';
  detailViewEl.style.display = 'block';
  if (checkoutViewEl) checkoutViewEl.style.display = 'none';
  if (pushHistory) updateUrlQuery({ product: productId });
  if (shouldScroll) window.scrollTo({ top: 0, behavior: 'smooth' });

  document.getElementById('detail-back-btn').textContent = `← 返回 ${product.categoryLabel}`;
  document.getElementById('detail-breadcrumb').textContent = `首页 / ${product.categoryLabel} / ${product.name}`;

  const isLiked = wishlist.includes(product.id);
  let selectedSku = product.variantSkus[0] || { name: product.variants[0] || '标准通用款', price: product.price, stock: product.stock, skuCode: `${product.id.toUpperCase()}-01` };
  let detailQty = 1;

  const allProductReviews = [...(userReviews[product.id] || [])];
  const ratingSummary = computeRealRatingSummary(allProductReviews);
  const relatedProducts = PRODUCTS.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);
  const bundlePartner = relatedProducts.find(p => p.stock > 0) || PRODUCTS.find(p => p.id !== product.id && p.stock > 0);
  const carFullName = garage.model ? `${garage.year}款 ${garage.makeLabel} ${garage.model}` : '';

  const fitCheck = checkVehicleFitmentPrecision(product, garage);
  const fitAlertClass = fitCheck.status === 'mismatch' ? 'is-mismatch' : (fitCheck.status === 'exact' || fitCheck.status === 'universal' ? 'is-exact' : '');

  const view = {
    name: escapeHTML(product.name),
    categoryLabel: escapeHTML(product.categoryLabel),
    fitmentLabel: escapeHTML(product.fitmentLabel),
    description: escapeHTML(product.description),
    installGuide: escapeHTML(product.installGuide || ''),
    image: safeImageUrl(product.image, product.category),
    badge: escapeHTML(product.badge || '严选车品')
  };

  // 多图画廊缩略图
  const galleryThumbsHTML = product.gallery.length > 1
    ? `<div class="detail-gallery-thumbs">${product.gallery.map((gUrl, idx) => `
        <button type="button" class="gallery-thumb-btn ${idx === 0 ? 'active' : ''}" data-gallery-src="${escapeHTML(gUrl)}" aria-label="查看商品图片 ${idx + 1}">
          <img src="${escapeHTML(gUrl)}" alt="">
        </button>`).join('')}</div>`
    : '';

  // 装车前后对比滑块 (Before / After)
  const beforeAfterHTML = (product.beforeImg && product.afterImg)
    ? `<div class="ba-compare-box">
        <div class="ba-compare-header">
          <strong style="color:var(--neon-lime);">⚡ 装车前后效果对比 (Before / After)</strong>
          <span>左右拖动滑块查看升级效果</span>
        </div>
        <div class="ba-stage">
          <img src="${escapeHTML(product.beforeImg)}" alt="原车未升级状态">
          <span class="ba-badge before">BEFORE 原车素车</span>
          <div class="ba-after-layer" id="ba-after-layer" style="width:55%;">
            <img src="${escapeHTML(product.afterImg)}" alt="升级后效果">
          </div>
          <div class="ba-divider-knob" id="ba-divider-knob">↔</div>
          <span class="ba-badge after">AFTER 质感升级后</span>
        </div>
        <input type="range" class="ba-slider-input" id="ba-slider-input" min="5" max="95" value="55" aria-label="拖动对比装车前后效果">
      </div>`
    : '';

  // 安装视频模块
  const videoBlockHTML = product.videoUrl
    ? (/\.mp4($|\?)/i.test(product.videoUrl)
      ? `<div style="margin-top:14px;"><strong style="font-size:0.84rem;color:var(--neon-lime);">🎬 30秒无损安装实拍视频：</strong><video src="${escapeHTML(product.videoUrl)}" controls style="width:100%;border-radius:8px;margin-top:6px;max-height:240px;background:#000;"></video></div>`
      : `<div style="margin-top:14px;"><a href="${escapeHTML(safeExternalUrl(product.videoUrl))}" target="_blank" rel="noopener noreferrer" class="dark-outline-btn" style="display:inline-block;text-decoration:none;font-size:0.82rem;">🎬 观看官方无损安装视频教程 ↗</a></div>`)
    : '';

  // 关联搭配套餐 Bundle 组合购
  let bundleHTML = '';
  if (bundlePartner && product.stock > 0) {
    const p1Price = selectedSku.price;
    const p2Sku = bundlePartner.variantSkus[0] || { name: bundlePartner.variants[0], price: bundlePartner.price };
    const origCombo = p1Price + p2Sku.price;
    const saveAmt = origCombo >= 120 ? 25 : 15;
    const comboPrice = Math.max(1, origCombo - saveAmt);
    const encPartnerId = encodeURIComponent(bundlePartner.id);
    const encPartnerVar = encodeURIComponent(p2Sku.name);
    bundleHTML = `
      <div class="bundle-combo-box">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;">
          <strong style="color:var(--neon-lime);font-size:0.92rem;">🔥 经常一起搭配 · 组合套餐立减 ¥${saveAmt}</strong>
          <span style="font-size:0.78rem;color:#8e95a2;">两件组合直接享顺丰包邮</span>
        </div>
        <div class="bundle-items-row">
          <div class="bundle-mini-card">
            <img src="${view.image}" alt="">
            <div style="font-size:0.8rem;">
              <div style="font-weight:600;">${view.name}</div>
              <div style="color:#d8ff00;">¥${p1Price.toFixed(1)}</div>
            </div>
          </div>
          <span class="bundle-plus-sign">+</span>
          <div class="bundle-mini-card">
            <img src="${safeImageUrl(bundlePartner.image, bundlePartner.category)}" alt="">
            <div style="font-size:0.8rem;">
              <div style="font-weight:600;">${escapeHTML(bundlePartner.name)}</div>
              <div style="color:#d8ff00;">¥${p2Sku.price.toFixed(1)}</div>
            </div>
          </div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
          <div style="font-size:0.84rem;">
            套餐组合价：<strong style="font-size:1.15rem;color:#d8ff00;">¥${comboPrice.toFixed(1)}</strong>
            <span style="text-decoration:line-through;color:#8e95a2;margin-left:6px;">原价 ¥${origCombo.toFixed(1)}</span>
          </div>
          <button type="button" class="neon-primary-btn" style="padding:7px 14px;font-size:0.82rem;" onclick="addBundleToCart('${encodeURIComponent(product.id)}', '${ encPartnerId }', '${encPartnerVar}', ${saveAmt})">一键加购两件套 (立省 ¥${saveAmt})</button>
        </div>
      </div>`;
  }

  const paramsRows = Object.entries(product.params || {}).map(([k, v]) => `<tr><th>${escapeHTML(k)}</th><td>${escapeHTML(v)}</td></tr>`).join('');
  const reviewsHTML = allProductReviews.length === 0
    ? '<div class="review-card" style="text-align:center;color:#8e95a2;padding:22px 12px;">当前商品暂无评价，购买安装后欢迎在下方晒出您的真实升级照片与体验！</div>'
    : allProductReviews.map(r => {
      const photosHTML = Array.isArray(r.photos) && r.photos.length
        ? `<div class="review-photos-row">${r.photos.map(ph => `<img src="${escapeHTML(ph)}" alt="买家秀实拍" onclick="openImageLightbox(this.src)">`).join('')}</div>`
        : '';
      const verifiedBadge = r.verifiedPurchase
        ? '<span class="verified-owner-badge">✓ 已购车主认证</span>'
        : '';
      return `
        <div class="review-card">
          <div class="review-header">
            <div><strong>${escapeHTML(r.user)}</strong> <span class="review-car-badge">${escapeHTML(r.car)}</span>${verifiedBadge}</div>
            <span class="stars-text">${escapeHTML(r.rating || '★★★★★')}</span>
          </div>
          <p style="font-size:0.86rem;color:#cbd5e1;">${escapeHTML(r.text)}</p>
          ${photosHTML}
          ${r.merchantReply ? `<div style="margin-top:6px;padding:6px 10px;background:rgba(216,255,0,0.08);border-left:2px solid #d8ff00;font-size:0.8rem;color:#d8ff00;">官方回复：${escapeHTML(r.merchantReply)}</div>` : ''}
        </div>`;
    }).join('');
  const buyBtnLabel = product.redirectUrl ? '前往官方合作渠道购买 ↗' : '立即购买';

  document.getElementById('detail-page-content').innerHTML = `
    <div class="detail-main-grid">
      <div>
        <div class="detail-main-img-wrap" onclick="openImageLightbox(document.getElementById('detail-hero-img').src)">
          <img id="detail-hero-img" src="${view.image}" alt="${view.name}" width="1000" height="1000" onerror="this.onerror=null;this.src='assets/hero-auto-minimal.webp';">
          <span class="detail-zoom-hint">🔍 点击查看大图</span>
        </div>
        ${galleryThumbsHTML}
      </div>
      <div>
        <span class="neon-tag">${view.categoryLabel} · ${view.badge}</span>
        <h1 class="detail-title">${view.name}</h1>
        <div class="detail-rating-row">
          <span class="stars-text">${ratingSummary.stars} ${ratingSummary.avgText}</span><span>(${ratingSummary.countText})</span><span>·</span><span>已售 ${product.sales} 件</span><span>·</span><span id="detail-sku-stock-text">当前规格库存 ${selectedSku.stock} 件</span><span>·</span><span id="detail-sku-code-text" style="color:#8e95a2;font-family:monospace;">SKU: ${escapeHTML(selectedSku.skuCode)}</span>
        </div>
        <div class="detail-price-box">
          <span class="detail-price-now" id="detail-dynamic-price">¥${selectedSku.price.toFixed(1)}</span>
          <span class="detail-price-tag">满 ¥${freeShippingThreshold} 顺丰包邮</span>
        </div>
        <div class="fitment-alert-box ${fitAlertClass}">${fitCheck.detailNotice}${fitCheck.status !== 'mismatch' ? ' <span style="display:inline-block;margin-left:6px;color:#34d399;font-weight:600;">· 不适配免运费退换</span>' : ''}</div>
        ${(() => {
          const diyInfo = getProductDiyMeta(product);
          return `<div class="diy-spec-strip">
            <div class="diy-spec-cell"><span>DIY 安装难度</span><strong>${diyInfo.difficulty}</strong></div>
            <div class="diy-spec-cell"><span>预计安装耗时</span><strong>${diyInfo.duration}</strong></div>
            <div class="diy-spec-cell"><span>所需安装工具</span><strong>${diyInfo.tools}</strong></div>
          </div>`;
        })()}
        <div class="spec-pills">${product.specs.map(s => `<span class="spec-tag">✓ ${escapeHTML(s)}</span>`).join('')}</div>
        <p style="font-size:0.9rem;color:#8e95a2;margin-bottom:16px;">${view.description}</p>
        <span class="section-label">选择颜色 / 规格（不同规格独立定价与库存）：</span>
        <div class="qv-variants">${product.variantSkus.map((sku, idx) => `<button type="button" class="variant-pill ${idx === 0 ? 'active' : ''} ${sku.stock <= 0 ? 'is-out' : ''}" data-sku-idx="${idx}" aria-pressed="${idx === 0}">${escapeHTML(sku.name)} · ¥${sku.price.toFixed(1)}${sku.stock <= 0 ? ' (缺货)' : ''}</button>`).join('')}</div>
        <div class="detail-qty-row">
          <span class="section-label" style="margin-bottom:0;">购买数量：</span>
          <div class="detail-qty-control">
            <button type="button" id="detail-qty-minus" aria-label="减少数量">-</button><span id="detail-qty-val" aria-live="polite">1</span><button type="button" id="detail-qty-plus" aria-label="增加数量">+</button>
          </div>
        </div>
        ${getDeliveryEtaHTML(selectedSku.stock > 0)}
        <div class="detail-cta-group">
          <button type="button" class="neon-primary-btn" id="detail-add-cart-btn" ${selectedSku.stock <= 0 ? 'disabled' : ''}>${selectedSku.stock <= 0 ? '该规格暂时缺货' : '加入购物袋'}</button>
          <button type="button" class="buy-now-btn" id="detail-buy-now-btn" ${selectedSku.stock <= 0 ? 'disabled' : ''}>${selectedSku.stock <= 0 ? '暂时缺货' : buyBtnLabel}</button>
          <button type="button" class="detail-wish-btn ${isLiked ? 'liked' : ''}" id="detail-wish-btn" aria-pressed="${isLiked}">${isLiked ? '♥ 已收藏' : '♡ 收藏'}</button>
        </div>
        ${bundleHTML}
        <div class="service-guarantees">
          <div class="service-item-svg"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#d8ff00" stroke-width="2" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> 破损包赔保障</div>
          <div class="service-item-svg"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#d8ff00" stroke-width="2" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> 48小时内极速发货</div>
          <div class="service-item-svg"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#d8ff00" stroke-width="2" aria-hidden="true"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg> 7天无理由退换</div>
        </div>
      </div>
    </div>
    <div class="detail-lower-section">
      <div>
        <h3 class="detail-block-title">规格参数与安装指南</h3>
        <table class="params-table"><tbody>${paramsRows}</tbody></table>
        <div class="install-guide-box">
          <strong>包装清单（随箱附赠）：</strong>
          <div class="box-contents-list">${getProductBoxContents(product).map(c => `<span class="box-contents-pill">✓ ${escapeHTML(c)}</span>`).join('')}</div>
          <strong style="display:block;margin-top:14px;">无损安装说明：</strong>
          <p style="margin-top:6px;color:#8e95a2;">${view.installGuide}</p>
          ${videoBlockHTML}
        </div>
      </div>
      <div>
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:10px;">
          <h3 class="detail-block-title" style="margin-bottom:0;">车主真实评价与买家秀 (${allProductReviews.length})</h3>
          ${garage.model ? `<label class="filter-toggle-chip" style="font-size:0.74rem;padding:4px 10px;"><input type="checkbox" id="review-same-car-toggle" ${reviewSameCarOnly ? 'checked' : ''}> 仅看 ${escapeHTML(garage.model)} 车友评价</label>` : ''}
        </div>
        <div id="detail-reviews-list">${reviewsHTML}</div>
        <form id="add-review-form" class="review-form-box clean-form">
          <label for="review-text-input">发表您的升级体验（系统将自动核验已购车主身份）：</label>
          <div class="form-row-2" style="margin-bottom:8px;">
            <input type="text" id="review-car-input" aria-label="您的车型" placeholder="您的爱车车型 (如：24款思域)" value="${escapeHTML(carFullName)}" maxlength="40" required>
            <select id="review-rating-select" class="dark-select" aria-label="评价星级">
              <option value="★★★★★">★★★★★ 5星好评</option>
              <option value="★★★★☆">★★★★☆ 4星满意</option>
              <option value="★★★☆☆">★★★☆☆ 3星一般</option>
              <option value="★★☆☆☆">★★☆☆☆ 2星欠佳</option>
              <option value="★☆☆☆☆">★☆☆☆☆ 1星不满意</option>
            </select>
          </div>
          <div style="margin-bottom:8px;">
            <label style="font-size:0.76rem;color:#8e95a2;display:block;margin-bottom:4px;">上传装车买家秀实拍图（选填，最多3张）：</label>
            <input type="file" id="review-photo-input" accept="image/*" multiple style="font-size:0.78rem;">
            <div id="review-photo-preview-row" class="review-photos-row"></div>
          </div>
          <div style="display:flex;gap:8px;">
            <input type="text" id="review-text-input" placeholder="写下真实安装感受与贴合度…" maxlength="200" style="flex:1;" required>
            <button type="submit" class="dark-outline-btn" style="padding:7px 14px;font-size:0.84rem;white-space:nowrap;">提交评价</button>
          </div>
        </form>
        <div class="qa-section-box">
          <h3 class="detail-block-title" style="margin-bottom:10px;">车友问答 Q&amp;A (<span id="detail-qa-count">0</span>)</h3>
          <div id="detail-qa-list"></div>
          <form id="add-qa-form" class="clean-form" style="display:flex;gap:8px;margin-top:10px;">
            <input type="text" id="qa-question-input" placeholder="对适配车型、材质或安装有疑问？向车友或顾问提问…" maxlength="160" style="flex:1;" required>
            <button type="submit" class="dark-outline-btn" style="padding:7px 14px;font-size:0.82rem;white-space:nowrap;">提交提问</button>
          </form>
        </div>
      </div>
    </div>
    <div class="related-section">
      <h3 class="detail-block-title">同专区升级搭配推荐</h3>
      <div class="product-grid">${relatedProducts.map(getProductCardHTML).join('')}</div>
    </div>
    ${(() => {
      const recents = (readLocalData('auto_shop_recent_views', []) || [])
        .filter(id => id !== product.id)
        .map(id => PRODUCTS.find(p => p.id === id))
        .filter(Boolean)
        .slice(0, 4);
      if (!recents.length) return '';
      return `<div class="related-section" style="margin-top:28px;">
        <h3 class="detail-block-title">最近浏览</h3>
        <div class="product-grid">${recents.map(getProductCardHTML).join('')}</div>
      </div>`;
    })()}
    <div class="mobile-detail-buybar" id="mobile-detail-buybar">
      <div>
        <div style="font-size:0.7rem;color:#8e95a2;">当前规格实付</div>
        <div class="m-price" id="mobile-detail-price">¥${selectedSku.price.toFixed(1)}</div>
      </div>
      <div class="m-actions">
        <button type="button" class="dark-outline-btn" id="mobile-detail-add-btn" ${selectedSku.stock <= 0 ? 'disabled' : ''}>加购物袋</button>
        <button type="button" class="neon-primary-btn" id="mobile-detail-buy-btn" ${selectedSku.stock <= 0 ? 'disabled' : ''}>${selectedSku.stock <= 0 ? '缺货' : '立即购买'}</button>
      </div>
    </div>
  `;

  // 多图画廊缩略图点击切换
  document.querySelectorAll('#detail-page-content .gallery-thumb-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#detail-page-content .gallery-thumb-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('detail-hero-img').src = btn.dataset.gallerySrc;
    });
  });

  // Before / After 装车对比滑块交互
  const baSlider = document.getElementById('ba-slider-input');
  const baAfterLayer = document.getElementById('ba-after-layer');
  const baKnob = document.getElementById('ba-divider-knob');
  if (baSlider && baAfterLayer) {
    baSlider.addEventListener('input', (e) => {
      baAfterLayer.style.width = `${e.target.value}%`;
      if (baKnob) baKnob.style.left = `${e.target.value}%`;
    });
  }

  // 多 SKU 规格切换：实时联动更新价格、规格库存与按钮状态
  document.querySelectorAll('#detail-page-content .variant-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('#detail-page-content .variant-pill').forEach(p => {
        p.classList.remove('active');
        p.setAttribute('aria-pressed', 'false');
      });
      pill.classList.add('active');
      pill.setAttribute('aria-pressed', 'true');
      const idx = Number(pill.dataset.skuIdx) || 0;
      selectedSku = product.variantSkus[idx] || product.variantSkus[0];
      document.getElementById('detail-dynamic-price').textContent = `¥${selectedSku.price.toFixed(1)}`;
      const heroImgEl = document.getElementById('detail-hero-img');
      if (heroImgEl) {
        if (selectedSku.img) {
          heroImgEl.src = resolveProductImage(selectedSku.img, product.category);
        } else if (Array.isArray(product.gallery) && product.gallery[idx]) {
          heroImgEl.src = safeImageUrl(product.gallery[idx], product.category);
        }
      }
      document.getElementById('detail-sku-stock-text').textContent = `当前规格库存 ${selectedSku.stock} 件`;
      document.getElementById('detail-sku-code-text').textContent = `SKU: ${selectedSku.skuCode}`;
      const addBtn = document.getElementById('detail-add-cart-btn');
      const buyBtn = document.getElementById('detail-buy-now-btn');
      const mPriceEl = document.getElementById('mobile-detail-price');
      const mAddBtn = document.getElementById('mobile-detail-add-btn');
      const mBuyBtn = document.getElementById('mobile-detail-buy-btn');
      const out = selectedSku.stock <= 0;
      addBtn.disabled = out;
      buyBtn.disabled = out;
      addBtn.textContent = out ? '该规格暂时缺货' : '加入购物袋';
      buyBtn.textContent = out ? '暂时缺货' : buyBtnLabel;
      if (mPriceEl) mPriceEl.textContent = `¥${selectedSku.price.toFixed(1)}`;
      if (mAddBtn) mAddBtn.disabled = out;
      if (mBuyBtn) {
        mBuyBtn.disabled = out;
        mBuyBtn.textContent = out ? '缺货' : '立即购买';
      }
      if (detailQty > selectedSku.stock && selectedSku.stock > 0) {
        detailQty = selectedSku.stock;
        document.getElementById('detail-qty-val').textContent = detailQty;
      }
    });
  });

  document.getElementById('detail-qty-minus').addEventListener('click', () => { if (detailQty > 1) document.getElementById('detail-qty-val').textContent = --detailQty; });
  document.getElementById('detail-qty-plus').addEventListener('click', () => { if (detailQty < selectedSku.stock) document.getElementById('detail-qty-val').textContent = ++detailQty; });
  document.getElementById('detail-add-cart-btn').addEventListener('click', (e) => addToCart(product.id, selectedSku.name, detailQty, e.target));
  const mAddBtnEl = document.getElementById('mobile-detail-add-btn');
  if (mAddBtnEl) mAddBtnEl.addEventListener('click', () => document.getElementById('detail-add-cart-btn').click());
  const mBuyBtnEl = document.getElementById('mobile-detail-buy-btn');
  if (mBuyBtnEl) mBuyBtnEl.addEventListener('click', () => document.getElementById('detail-buy-now-btn').click());

  document.getElementById('detail-buy-now-btn').addEventListener('click', () => {
    if (product.redirectUrl) {
      const targetUrl = safeExternalUrl(product.redirectUrl);
      if (!targetUrl) { showToast('购买链接暂不可用，请联系在线客服', 'error'); return; }
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    addToCart(product.id, selectedSku.name, detailQty, null);
    openCheckoutModal();
  });
  document.getElementById('detail-wish-btn').addEventListener('click', (e) => toggleWishlist(e, product.id));

  // 买家秀照片选择预览
  const revPhotoInput = document.getElementById('review-photo-input');
  if (revPhotoInput) {
    revPhotoInput.addEventListener('change', async (e) => {
      const files = Array.from(e.target.files || []).slice(0, 3);
      pendingReviewPhotos = [];
      const previewRow = document.getElementById('review-photo-preview-row');
      previewRow.innerHTML = '';
      for (const f of files) {
        const url = await compressBuyerImage(f, 600);
        if (url) {
          pendingReviewPhotos.push(url);
          const img = document.createElement('img');
          img.src = url;
          previewRow.appendChild(img);
        }
      }
    });
  }

  document.getElementById('add-review-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const car = document.getElementById('review-car-input').value.trim();
    const rating = document.getElementById('review-rating-select').value;
    const text = document.getElementById('review-text-input').value.trim();
    if (!car || text.length < 2) { showToast('请填写车型和至少 2 个字的使用感受', 'error'); return; }

    if (window.location.protocol.startsWith('http')) {
      try {
        const res = await fetch('/api/reviews/add', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Buyer-Token': getBuyerToken()
          },
          body: JSON.stringify({
            productId: product.id,
            car,
            rating,
            text,
            photos: [...pendingReviewPhotos]
          })
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.ok) {
          await syncStoreFromServer();
          userReviews = readLocalData('auto_shop_reviews', {});
          showToast(data.review && data.review.verifiedPurchase ? '评价已发布（服务端核验为 ✓ 已购车主认证）' : '感谢您的真实评价！');
          openProductDetail(product.id, false, false);
          return;
        } else if (data && data.error) {
          showToast(data.error, 'error');
          return;
        }
      } catch (err) {}
    }

    if (!userReviews[product.id]) userReviews[product.id] = [];
    const isVerified = hasBuyerPurchasedProduct(product.id);
    userReviews[product.id].unshift({
      id: 'rev_' + Date.now(),
      user: currentUser ? currentUser.name : '车主车友',
      car,
      rating,
      text,
      photos: [...pendingReviewPhotos],
      verifiedPurchase: isVerified,
      merchantReply: '',
      time: new Date().toLocaleDateString('zh-CN')
    });
    if (writeLocalData('auto_shop_reviews', userReviews)) {
      showToast(isVerified ? '评价已发布（已自动标记为 ✓ 已购车主认证）' : '感谢您的真实评价！');
      openProductDetail(product.id, false, false);
    }
  });

  // 同车系评价筛选
  const sameCarToggle = document.getElementById('review-same-car-toggle');
  if (sameCarToggle) {
    sameCarToggle.addEventListener('change', (e) => {
      reviewSameCarOnly = e.target.checked;
      const revListEl = document.getElementById('detail-reviews-list');
      if (!revListEl) return;
      const filtered = reviewSameCarOnly && garage.model
        ? allProductReviews.filter(r => String(r.car || '').toLowerCase().includes(String(garage.model).toLowerCase()) || String(r.car || '').includes(String(garage.makeLabel || '')))
        : allProductReviews;
      revListEl.innerHTML = filtered.length === 0
        ? '<div class="review-card" style="text-align:center;color:#8e95a2;padding:18px 12px;">暂无该车系评价，欢迎成为首位晒单车主！</div>'
        : filtered.map(r => `<div class="review-card"><div class="review-header"><div><strong>${escapeHTML(r.user)}</strong> <span class="review-car-badge">${escapeHTML(r.car)}</span>${r.verifiedPurchase ? '<span class="verified-owner-badge">✓ 已购车主认证</span>' : ''}</div><span class="stars-text">${escapeHTML(r.rating || '★★★★★')}</span></div><p style="font-size:0.86rem;color:#cbd5e1;">${escapeHTML(r.text)}</p></div>`).join('');
    });
  }

  // 车友问答 Q&A 渲染与提交
  renderProductQaList(product.id);
  const qaForm = document.getElementById('add-qa-form');
  if (qaForm) {
    qaForm.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const qInput = document.getElementById('qa-question-input');
      const question = qInput ? qInput.value.trim() : '';
      if (question.length < 2) { showToast('请输入至少 2 个字的提问内容', 'error'); return; }
      const carLabel = garage.model ? `${garage.year}款 ${garage.makeLabel} ${garage.model}` : '通用车友';
      if (window.location.protocol.startsWith('http')) {
        try {
          const res = await fetch('/api/qa/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Buyer-Token': getBuyerToken() },
            body: JSON.stringify({ productId: product.id, question, car: carLabel })
          });
          if (res.ok) {
            await syncStoreFromServer();
            qInput.value = '';
            renderProductQaList(product.id);
            showToast('提问已发布！');
            return;
          }
        } catch (err) {}
      }
      const qaMap = readLocalData('auto_shop_qa', {});
      if (!Array.isArray(qaMap[product.id])) qaMap[product.id] = [];
      qaMap[product.id].unshift({
        id: 'qa_' + Date.now(),
        user: currentUser ? currentUser.name : '访客车主',
        car: carLabel,
        question,
        answer: '',
        time: new Date().toLocaleDateString('zh-CN')
      });
      try { localStorage.setItem('auto_shop_qa', JSON.stringify(qaMap)); } catch (err) {}
      qInput.value = '';
      renderProductQaList(product.id);
      showToast('提问已发布！');
    });
  }
};

// 一键加购关联搭配套餐 Bundle
window.addBundleToCart = function(encId1, encId2, encVar2, saveAmt) {
  const id1 = decodeURIComponent(encId1);
  const id2 = decodeURIComponent(encId2);
  const var2 = decodeURIComponent(encVar2);
  const p1 = PRODUCTS.find(p => p.id === id1);
  if (!p1) return;
  const activePill = document.querySelector('#detail-page-content .variant-pill.active');
  const skuIdx = activePill ? Number(activePill.dataset.skuIdx) || 0 : 0;
  const sku1 = p1.variantSkus[skuIdx] || p1.variantSkus[0];

  const ok1 = addToCart(id1, sku1.name, 1, null);
  const ok2 = addToCart(id2, var2, 1, null);
  if (ok1 && ok2) {
    activeBundleDiscount = Number(saveAmt) || 15;
    writeLocalData('auto_shop_bundle_discount', activeBundleDiscount);
    renderCart();
    openCart();
    showToast(`已加购升级两件套，已享套餐立减 ¥${activeBundleDiscount}！`);
  }
};

// ==========================================
// 6. 购物袋、满包邮、组合购立减与多折扣码校验
// ==========================================
const cartDrawer = document.getElementById('cart-drawer');
const cartOverlay = document.getElementById('cart-overlay');
function syncBodyOverlayState() {
  const hasOverlay = !!document.querySelector('.modal-backdrop.active, .drawer.active');
  document.body.classList.toggle('has-overlay', hasOverlay);
}
let selectedCartKeys = new Set();

function openCart() {
  cart = readLocalData('auto_shop_cart', []);
  renderCart();
  cartDrawer.classList.add('active');
  cartOverlay.classList.add('active');
  document.getElementById('cart-btn').setAttribute('aria-expanded', 'true');
  syncBodyOverlayState();
}
function closeCart() {
  cartDrawer.classList.remove('active');
  cartOverlay.classList.remove('active');
  document.getElementById('cart-btn').setAttribute('aria-expanded', 'false');
  syncBodyOverlayState();
}

document.getElementById('cart-btn').addEventListener('click', openCart);
document.getElementById('close-cart').addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);

window.addToCart = function(productId, variant, qty = 1, btnEl = null) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product || product.stock <= 0) { showToast('该商品暂时缺货', 'error'); return false; }
  const matchedSku = product.variantSkus.find(s => s.name === variant) || product.variantSkus[0];
  if (!matchedSku || matchedSku.stock <= 0) { showToast('该规格暂时缺货', 'error'); return false; }

  const selectedVariant = matchedSku.name;
  const amount = Math.max(1, Math.floor(Number(qty) || 1));
  const key = `${productId}_${selectedVariant}`;
  const existing = cart.find(item => item.key === key);
  const currentQty = existing ? existing.quantity : 0;
  const maxAllowed = Math.min(product.stock, matchedSku.stock);
  if (currentQty >= maxAllowed) { showToast(`该规格库存仅剩 ${maxAllowed} 件`, 'error'); return false; }

  if (existing) {
    existing.quantity = Math.min(maxAllowed, currentQty + amount);
    existing.price = matchedSku.price;
    existing.skuCode = matchedSku.skuCode;
  } else {
    cart.push({
      key,
      id: product.id,
      name: product.name,
      variant: selectedVariant,
      skuCode: matchedSku.skuCode,
      price: matchedSku.price,
      image: product.image,
      quantity: Math.min(maxAllowed, amount)
    });
  }
  saveAndRenderCart();
  showToast(`已加入购物袋 · ${product.name}`);
  if (btnEl) {
    const oldText = btnEl.textContent;
    btnEl.textContent = '已加入 ✓';
    setTimeout(() => { btnEl.textContent = oldText; }, 650);
  }
  return true;
};

function getSubtotal() { return cart.reduce((sum, item) => sum + item.price * item.quantity, 0); }

function getEffectiveBundleDiscount() {
  const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
  if (totalQty < 2 || activeBundleDiscount <= 0) return 0;
  return Math.min(activeBundleDiscount, getSubtotal() * 0.25);
}

function getCalculatedDiscount() {
  const sub = getSubtotal();
  if (sub === 0 || !appliedCouponObj) return 0;
  if (sub < (appliedCouponObj.minSpend || 0)) return 0;
  if (appliedCouponObj.type === 'percent') {
    return sub * (1 - appliedCouponObj.value / 100);
  }
  return Math.min(sub, appliedCouponObj.value);
}

function getFinalTotal() {
  return Math.max(0.1, getSubtotal() - getCalculatedDiscount() - getEffectiveBundleDiscount());
}
function saveAndRenderCart() { writeLocalData('auto_shop_cart', cart); renderCart(); }

function renderCartUpsellAndCoupons(subtotal) {
  const upsellBox = document.getElementById('cart-upsell-box');
  if (upsellBox) {
    if (subtotal > 0 && subtotal < freeShippingThreshold) {
      const diff = (freeShippingThreshold - subtotal).toFixed(1);
      const cartIds = new Set(cart.map(i => i.id));
      const candidate = PRODUCTS.find(p => p.stock > 0 && !cartIds.has(p.id) && p.price <= Math.max(45, Number(diff) + 20));
      if (candidate) {
        const pid = encodeURIComponent(String(candidate.id));
        const firstSku = (candidate.variantSkus && candidate.variantSkus[0]) || { name: '标准通用款', price: candidate.price };
        const pvar = encodeURIComponent(String(firstSku.name));
        upsellBox.style.display = 'block';
        upsellBox.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:0.76rem;">
            <span style="color:#e2e8f0;">凑单推荐：<strong>${escapeHTML(candidate.name)}</strong> (¥${Number(firstSku.price).toFixed(1)})</span>
            <button type="button" class="coupon-quick-pill" onclick="addToCart(decodeURIComponent('${pid}'), decodeURIComponent('${pvar}'), 1)">+ 凑单</button>
          </div>`;
      } else {
        upsellBox.style.display = 'none';
      }
    } else {
      upsellBox.style.display = 'none';
    }
  }

  const pillsBox = document.getElementById('cart-coupon-pills');
  if (pillsBox) {
    const activeDiscounts = getAvailableDiscounts().filter(d => d && d.active);
    if (!activeDiscounts.length || subtotal === 0) {
      pillsBox.innerHTML = '';
    } else {
      pillsBox.innerHTML = activeDiscounts.slice(0, 3).map(d => {
        const desc = d.type === 'percent' ? `${(Number(d.value) / 10).toFixed(1)}折` : `减¥${d.value}`;
        const minStr = Number(d.minSpend) > 0 ? `满¥${d.minSpend}` : '无门槛';
        const code = escapeHTML(d.code);
        return `<button type="button" class="coupon-quick-pill" onclick="document.getElementById('coupon-input').value='${code}';document.getElementById('apply-coupon-btn').click();">${code} · ${minStr}${desc}</button>`;
      }).join('');
    }
  }
}

function renderCart() {
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.getElementById('cart-count').textContent = totalCount;
  const subtotal = getSubtotal();
  if (subtotal === 0) {
    appliedCouponObj = null;
    activeBundleDiscount = 0;
    writeLocalData('auto_shop_bundle_discount', 0);
  }
  const bundleDiscVal = getEffectiveBundleDiscount();
  const discountVal = getCalculatedDiscount();
  const finalTotal = subtotal === 0 ? 0 : getFinalTotal();

  const shippingTextEl = document.getElementById('shipping-text');
  const shippingFillEl = document.getElementById('shipping-fill');
  if (subtotal >= freeShippingThreshold) {
    shippingTextEl.textContent = '已解锁顺丰包邮特权！';
    shippingFillEl.style.width = '100%';
  } else {
    shippingTextEl.textContent = `再买 ¥${(freeShippingThreshold - subtotal).toFixed(1)} 即可享受顺丰包邮`;
    shippingFillEl.style.width = `${Math.min(100, (subtotal / freeShippingThreshold) * 100)}%`;
  }

  document.getElementById('subtotal-price').textContent = `¥${subtotal.toFixed(1)}`;
  document.getElementById('total-price').textContent = `¥${finalTotal.toFixed(1)}`;

  const bundleRow = document.getElementById('bundle-discount-row');
  if (bundleRow) {
    bundleRow.style.display = bundleDiscVal > 0 ? 'flex' : 'none';
    if (bundleDiscVal > 0) document.getElementById('bundle-discount-amount').textContent = `-¥${bundleDiscVal.toFixed(1)}`;
  }

  const discountRow = document.getElementById('discount-row');
  discountRow.style.display = discountVal > 0 ? 'flex' : 'none';
  if (discountVal > 0) document.getElementById('discount-amount').textContent = `-¥${discountVal.toFixed(1)}`;

  renderCartUpsellAndCoupons(subtotal);
  const clearCartBtn = document.getElementById('clear-cart-btn');
  if (clearCartBtn) clearCartBtn.style.display = cart.length > 0 ? 'inline-block' : 'none';
  const checkoutBtnEl = document.getElementById('checkout-btn');
  if (checkoutBtnEl) checkoutBtnEl.disabled = cart.length === 0;

  // 清理已不存在的勾选项
  const validKeys = new Set(cart.map(i => i.key));
  selectedCartKeys.forEach(k => { if (!validKeys.has(k)) selectedCartKeys.delete(k); });

  const batchBar = document.getElementById('cart-batch-bar');
  const selectAllCb = document.getElementById('cart-select-all');
  const batchDelBtn = document.getElementById('cart-batch-delete-btn');
  if (batchBar) batchBar.style.display = cart.length > 0 ? 'flex' : 'none';
  if (selectAllCb) selectAllCb.checked = cart.length > 0 && selectedCartKeys.size === cart.length;
  if (batchDelBtn) {
    batchDelBtn.disabled = selectedCartKeys.size === 0;
    batchDelBtn.textContent = `批量删除 (${selectedCartKeys.size})`;
  }

  const container = document.getElementById('cart-items');
  if (cart.length === 0) {
    container.innerHTML = '<div class="empty-state" style="margin-top:40px;"><strong>购物袋还是空的</strong><p>挑选心仪的车品与车用配件加入购物袋吧~</p></div>';
    return;
  }
  container.innerHTML = cart.map(item => {
    const key = encodeURIComponent(String(item.key));
    const pid = encodeURIComponent(String(item.id));
    const checked = selectedCartKeys.has(item.key) ? 'checked' : '';
    const product = PRODUCTS.find(p => p.id === item.id);
    const matchedSku = product ? product.variantSkus.find(s => s.name === item.variant) : null;
    const maxStock = matchedSku ? Math.min(product.stock, matchedSku.stock) : (product ? product.stock : item.quantity);
    return `
      <div class="cart-item">
        <input type="checkbox" class="cart-item-check" ${checked} aria-label="选择 ${escapeHTML(item.name)}" onchange="toggleCartItemSelect(decodeURIComponent('${key}'), this.checked)">
        <button type="button" class="cart-item-link" onclick="closeCart();openProductDetail(decodeURIComponent('${pid}'))" aria-label="查看 ${escapeHTML(item.name)}">
          <img src="${safeImageUrl(item.image)}" class="cart-item-thumb" alt="${escapeHTML(item.name)}">
        </button>
        <div class="cart-item-detail">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:6px;">
            <button type="button" class="cart-item-link" onclick="closeCart();openProductDetail(decodeURIComponent('${pid}'))"><h4>${escapeHTML(item.name)}</h4></button>
            <button type="button" class="cart-remove-btn" aria-label="移除 ${escapeHTML(item.name)}" onclick="removeCartItem(decodeURIComponent('${key}'))">移除</button>
          </div>
          <div class="cart-item-variant">规格：${escapeHTML(item.variant)} ${item.skuCode ? `<span style="opacity:0.65;">(${escapeHTML(item.skuCode)})</span>` : ''}</div>
          <div class="cart-item-actions">
            <span style="font-weight:700;color:#d8ff00;font-size:0.9rem;">¥${(item.price * item.quantity).toFixed(1)}</span>
            <div class="qty-box">
              <button type="button" aria-label="减少 ${escapeHTML(item.name)} 数量" onclick="updateCartQty(decodeURIComponent('${key}'),-1)">-</button><span>${item.quantity}</span><button type="button" aria-label="增加 ${escapeHTML(item.name)} 数量" ${item.quantity >= maxStock ? 'disabled' : ''} onclick="updateCartQty(decodeURIComponent('${key}'),1)">+</button>
            </div>
          </div>
        </div>
      </div>`;
  }).join('');
}

window.updateCartQty = function(key, delta) {
  const item = cart.find(i => i.key === key);
  if (!item) return;
  const product = PRODUCTS.find(p => p.id === item.id);
  const matchedSku = product ? product.variantSkus.find(s => s.name === item.variant) : null;
  const maxAllowed = matchedSku ? Math.min(product.stock, matchedSku.stock) : (product ? product.stock : 20);
  const nextQuantity = item.quantity + delta;
  if (delta > 0 && nextQuantity > maxAllowed) {
    showToast(`该规格库存仅剩 ${maxAllowed} 件`, 'error');
    return;
  }
  item.quantity = nextQuantity;
  if (item.quantity <= 0) cart = cart.filter(i => i.key !== key);
  saveAndRenderCart();
};

function getAvailableDiscounts() {
  const saved = readLocalData('auto_shop_discounts', null);
  return Array.isArray(saved) ? saved : [];
}

document.getElementById('apply-coupon-btn').addEventListener('click', () => {
  const code = document.getElementById('coupon-input').value.trim().toUpperCase();
  const msgEl = document.getElementById('coupon-msg');
  const subtotal = getSubtotal();
  const showCouponMessage = (message, success = false) => {
    msgEl.textContent = message;
    msgEl.className = `coupon-msg ${success ? 'is-success' : 'is-error'}`;
  };
  appliedCouponObj = null;
  if (subtotal === 0) { showCouponMessage('请先添加商品后再使用优惠码'); renderCart(); return; }
  if (!code) { showCouponMessage('请输入优惠码'); renderCart(); return; }

  const discounts = getAvailableDiscounts();
  const found = discounts.find(d => d.code === code && d.active);
  if (!found) { showCouponMessage('无效或已停用的优惠码'); renderCart(); return; }
  if (subtotal < (found.minSpend || 0)) { showCouponMessage(`该优惠码需满 ¥${found.minSpend} 方可使用`); renderCart(); return; }
  appliedCouponObj = found;
  showCouponMessage(found.type === 'fixed'
    ? `✓ 已应用「${found.code}」立减 ¥${found.value}`
    : `✓ 已应用「${found.code}」享 ${(found.value / 10).toFixed(1)} 折优惠`, true);
  renderCart();
});

// ==========================================
// 7. 全国省 / 市 / 旗县区 / 直辖市三级联动 + 自动记忆地址
// ==========================================
let CHINA_REGIONS = {
  '北京市': { '市辖区': ['东城区', '西城区', '朝阳区', '丰台区', '石景山区', '海淀区', '顺义区', '通州区', '大兴区', '昌平区'] },
  '上海市': { '市辖区': ['黄浦区', '徐汇区', '长宁区', '静安区', '普陀区', '虹口区', '杨浦区', '闵行区', '宝山区', '浦东新区'] },
  '天津市': { '市辖区': ['和平区', '河东区', '河西区', '南开区', '河北区', '红桥区', '滨海新区', '西青区', '津南区'] },
  '重庆市': { '市辖区': ['渝中区', '江北区', '南岸区', '九龙坡区', '沙坪坝区', '渝北区', '巴南区', '两江新区'] },
  '广东省': {
    '广州市': ['天河区', '越秀区', '海珠区', '荔湾区', '白云区', '黄埔区', '番禺区', '花都区', '南沙区', '增城区'],
    '深圳市': ['福田区', '罗湖区', '南山区', '宝安区', '龙岗区', '盐田区', '龙华区', '坪山区', '光明区'],
    '江门市': ['蓬江区', '江海区', '新会区', '台山市', '开平市', '鹤山市', '恩平市'],
    '珠海市': ['香洲区', '斗门区', '金湾区'],
    '佛山市': ['禅城区', '南海区', '顺德区', '三水区', '高明区'],
    '东莞市': ['莞城街道', '南城街道', '东城街道', '万江街道', '长安镇', '虎门镇']
  },
  '内蒙古自治区': {
    '呼和浩特市': ['新城区', '回民区', '玉泉区', '赛罕区', '土默特左旗', '托克托县'],
    '赤峰市': ['红山区', '元宝山区', '松山区', '阿鲁科尔沁旗', '巴林左旗', '巴林右旗', '克什克腾旗', '翁牛特旗', '喀喇沁旗', '宁城县', '敖汉旗'],
    '包头市': ['东河区', '昆都仑区', '青山区', '九原区', '土默特右旗', '达尔罕茂明安联合旗']
  },
  '浙江省': {
    '杭州市': ['上城区', '拱墅区', '西湖区', '滨江区', '萧山区', '余杭区', '临平区', '钱塘区'],
    '宁波市': ['海曙区', '江北区', '北仑区', '镇海区', '鄞州区', '奉化区']
  },
  '江苏省': {
    '南京市': ['玄武区', '秦淮区', '建邺区', '鼓楼区', '浦口区', '栖霞区', '雨花台区', '江宁区'],
    '苏州市': ['虎丘区', '吴中区', '相城区', '姑苏区', '吴江区', '昆山市']
  },
  '四川省': {
    '成都市': ['锦江区', '青羊区', '金牛区', '武侯区', '成华区', '龙泉驿区', '双流区', '郫都区']
  }
};

const provSel = document.getElementById('addr-province');
const citySel = document.getElementById('addr-city');
const distSel = document.getElementById('addr-district');

function initRegionSelectors(savedAddrObj = null) {
  const curProv = savedAddrObj ? savedAddrObj.province : provSel.value;
  provSel.innerHTML = '<option value="">选择省份/直辖市</option>';
  Object.keys(CHINA_REGIONS).forEach(p => {
    const opt = document.createElement('option');
    opt.value = p;
    opt.textContent = p;
    provSel.appendChild(opt);
  });
  if (curProv && CHINA_REGIONS[curProv]) {
    provSel.value = curProv;
    populateCities(curProv, savedAddrObj ? savedAddrObj.city : '', savedAddrObj ? savedAddrObj.district : '');
  }
}

function populateCities(prov, preCity = '', preDist = '') {
  citySel.innerHTML = '<option value="">选择城市/辖区</option>';
  distSel.innerHTML = '<option value="">选择区/县/旗</option>';
  if (!prov || !CHINA_REGIONS[prov]) return;
  const cities = Object.keys(CHINA_REGIONS[prov]);
  cities.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    citySel.appendChild(opt);
  });
  const targetCity = preCity && CHINA_REGIONS[prov][preCity] ? preCity : (cities.length === 1 ? cities[0] : '');
  if (targetCity) {
    citySel.value = targetCity;
    populateDistricts(prov, targetCity, preDist);
  }
}

function populateDistricts(prov, city, preDist = '') {
  distSel.innerHTML = '<option value="">选择区/县/旗</option>';
  if (!prov || !city || !CHINA_REGIONS[prov] || !CHINA_REGIONS[prov][city]) return;
  CHINA_REGIONS[prov][city].forEach(d => {
    const opt = document.createElement('option');
    opt.value = d;
    opt.textContent = d;
    distSel.appendChild(opt);
  });
  if (preDist) distSel.value = preDist;
}

provSel.addEventListener('change', () => { populateCities(provSel.value); autoSaveCheckoutAddress(); });
citySel.addEventListener('change', () => { populateDistricts(provSel.value, citySel.value); autoSaveCheckoutAddress(); });
distSel.addEventListener('change', autoSaveCheckoutAddress);

let chinaRegionsLoadPromise = null;
function ensureChinaRegionsLoaded() {
  if (CHINA_REGIONS && CHINA_REGIONS['北京市'] && Object.keys(CHINA_REGIONS).length > 10) {
    return Promise.resolve(CHINA_REGIONS);
  }
  if (chinaRegionsLoadPromise) return chinaRegionsLoadPromise;
  const regionController = new AbortController();
  const regionTimeoutId = setTimeout(() => regionController.abort(), 5000);
  chinaRegionsLoadPromise = fetch('assets/china-regions.json', { signal: regionController.signal })
    .then(res => res.ok ? res.json() : null)
    .then(data => {
      if (data && data['北京市']) {
        CHINA_REGIONS = data;
        const saved = readLocalData('auto_shop_saved_checkout_addr', null);
        initRegionSelectors(saved);
      }
      return CHINA_REGIONS;
    })
    .catch(() => {
      chinaRegionsLoadPromise = null;
      return CHINA_REGIONS;
    })
    .finally(() => clearTimeout(regionTimeoutId));
  return chinaRegionsLoadPromise;
}

if (provSel) {
  provSel.addEventListener('focus', () => { ensureChinaRegionsLoaded(); }, { once: true });
}

function autoSaveCheckoutAddress() {
  const addrData = {
    name: document.getElementById('receiver-name').value.trim(),
    phone: document.getElementById('receiver-phone').value.trim(),
    province: provSel.value,
    city: citySel.value,
    district: distSel.value,
    detail: document.getElementById('receiver-address').value.trim()
  };
  writeLocalData('auto_shop_saved_checkout_addr', addrData);
  if (currentUser) {
    currentUser.savedName = addrData.name || currentUser.savedName;
    currentUser.savedPhone = addrData.phone || currentUser.savedPhone;
    currentUser.savedAddress = `${addrData.province}${addrData.city}${addrData.district}${addrData.detail}`;
    writeLocalData('auto_shop_user', currentUser);
  }
}

['receiver-name', 'receiver-phone', 'receiver-address'].forEach(id => {
  document.getElementById(id).addEventListener('input', autoSaveCheckoutAddress);
});

// ==========================================
// 8. 用户加密认证、服务端原子结账、支付回调验签、物流轨迹与 RMA 售后
// ==========================================
const authModal = document.getElementById('auth-modal');

function getVisibleBuyerOrders(searchFilter = '') {
  orders = readLocalData('auto_shop_orders', []);
  const savedAddr = readLocalData('auto_shop_saved_checkout_addr', {});
  const myPhone = currentUser ? currentUser.phone : (savedAddr.phone || '');
  const kw = searchFilter.trim().toLowerCase();

  if (kw) {
    return orders.filter(o =>
      String(o.orderId || '').toLowerCase().includes(kw) ||
      String(o.phone || '').toLowerCase().includes(kw) ||
      String(o.name || '').toLowerCase().includes(kw)
    );
  }
  if (myPhone) {
    const mine = orders.filter(o => o.phone === myPhone);
    if (mine.length > 0) return mine;
  }
  return orders;
}

function updateUserUI() {
  document.getElementById('user-short-name').textContent = currentUser ? currentUser.name : '';
  document.getElementById('order-count').textContent = getVisibleBuyerOrders().length;
  document.getElementById('wishlist-count').textContent = wishlist.length;
}

document.getElementById('user-nav-btn').addEventListener('click', () => {
  if (currentUser) {
    document.getElementById('auth-forms-view').style.display = 'none';
    document.getElementById('profile-view').style.display = 'block';
    document.getElementById('profile-username').textContent = currentUser.name;
    document.getElementById('profile-phone').textContent = currentUser.phone;
    document.getElementById('saved-name').value = currentUser.savedName || currentUser.name;
    document.getElementById('saved-phone').value = currentUser.savedPhone || currentUser.phone;
    document.getElementById('saved-address').value = currentUser.savedAddress || '';
  } else {
    document.getElementById('auth-forms-view').style.display = 'block';
    document.getElementById('profile-view').style.display = 'none';
  }
  authModal.classList.add('active');
});

document.getElementById('close-auth-modal').addEventListener('click', () => authModal.classList.remove('active'));
document.getElementById('tab-login').addEventListener('click', (e) => {
  e.target.classList.add('active'); document.getElementById('tab-register').classList.remove('active');
  document.getElementById('login-form').style.display = 'block'; document.getElementById('register-form').style.display = 'none';
});
document.getElementById('tab-register').addEventListener('click', (e) => {
  e.target.classList.add('active'); document.getElementById('tab-login').classList.remove('active');
  document.getElementById('register-form').style.display = 'block'; document.getElementById('login-form').style.display = 'none';
});

document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('reg-name').value.trim();
  const phone = document.getElementById('reg-phone').value.trim();
  const password = document.getElementById('reg-password').value;
  if (!name) { showToast('请输入车主昵称', 'error'); return; }
  if (!/^1[3-9]\d{9}$/.test(phone)) { showToast('请输入正确的 11 位手机号', 'error'); return; }
  if (password.length < 6) { showToast('密码至少需要 6 位字符', 'error'); return; }

  // 优先调用服务端 PBKDF2 加密注册接口
  if (window.location.protocol.startsWith('http')) {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, password })
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        currentUser = data.user;
        if (data.buyerToken) sessionStorage.setItem('auto_shop_buyer_token', data.buyerToken);
        writeLocalData('auto_shop_user', currentUser);
        await syncStoreFromServer();
        await syncBuyerOrdersFromServer();
        updateUserUI();
        authModal.classList.remove('active');
        syncBodyOverlayState();
        e.target.reset();
        showToast('账号创建成功，欢迎加入 MODFORM');
        return;
      } else if (data && data.error) {
        showToast(data.error, 'error');
        return;
      }
    } catch (err) {}
  }

  // 离线降级：使用 SHA-256 哈希保存，不存明文密码
  allUsers = readLocalData('auto_shop_users', []);
  if (allUsers.some(user => user.phone === phone)) { showToast('该手机号已注册，请直接登录', 'error'); return; }
  const passwordHash = await hashPasswordClient(password);
  const newUser = { name, phone, passwordHash, savedName: name, savedPhone: phone, savedAddress: '' };
  allUsers.push(newUser);
  if (!writeLocalData('auto_shop_users', allUsers)) return;
  const { passwordHash: ignored, ...sessionUser } = newUser;
  currentUser = sessionUser;
  writeLocalData('auto_shop_user', currentUser);
  updateUserUI();
  authModal.classList.remove('active');
  syncBodyOverlayState();
  e.target.reset();
  showToast('账号创建成功，已登录');
});

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const account = document.getElementById('login-account').value.trim();
  const password = document.getElementById('login-password').value;

  if (window.location.protocol.startsWith('http')) {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account, password })
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        currentUser = data.user;
        if (data.buyerToken) sessionStorage.setItem('auto_shop_buyer_token', data.buyerToken);
        writeLocalData('auto_shop_user', currentUser);
        await syncBuyerOrdersFromServer();
        updateUserUI();
        authModal.classList.remove('active');
        syncBodyOverlayState();
        e.target.reset();
        showToast(`欢迎回来，${currentUser.name}`);
        return;
      } else if (res.status === 401) {
        showToast('账号或密码不正确', 'error');
        return;
      }
    } catch (err) {}
  }

  allUsers = readLocalData('auto_shop_users', []);
  const clientHash = await hashPasswordClient(password);
  const found = allUsers.find(u =>
    (u.phone === account || u.name === account) &&
    (u.passwordHash === clientHash || u.password === password)
  );
  if (!found) { showToast('账号或密码不正确，新用户请先注册', 'error'); return; }
  const { password: ignoredPassword, passwordHash: ignoredHash, ...sessionUser } = found;
  currentUser = sessionUser;
  writeLocalData('auto_shop_user', currentUser);
  updateUserUI();
  authModal.classList.remove('active');
  syncBodyOverlayState();
  e.target.reset();
  showToast(`欢迎回来，${currentUser.name}`);
});

document.getElementById('profile-address-form').addEventListener('submit', (e) => {
  e.preventDefault();
  if (!currentUser) return;
  currentUser.savedName = document.getElementById('saved-name').value.trim();
  currentUser.savedPhone = document.getElementById('saved-phone').value.trim();
  currentUser.savedAddress = document.getElementById('saved-address').value.trim();
  writeLocalData('auto_shop_user', currentUser);
  showToast('默认收货信息已保存');
  authModal.classList.remove('active');
});

document.getElementById('logout-btn').addEventListener('click', async () => {
  const token = getBuyerToken();
  if (token && window.location.protocol.startsWith('http')) {
    try { await fetch('/api/auth/logout', { method: 'POST', headers: { 'X-Buyer-Token': token } }); } catch (e) {}
  }
  currentUser = null;
  sessionStorage.removeItem('auto_shop_buyer_token');
  localStorage.removeItem('auto_shop_user');
  localStorage.removeItem('auto_shop_orders');
  orders = [];
  updateUserUI();
  authModal.classList.remove('active');
});

const checkoutModal = document.getElementById('checkout-view');
let selectedCourierCompany = '顺丰标快';
let expressDeliveryConfirmed = false;
const EXPRESS_SHIPPING_FEE = 15.0;
const checkoutForm = document.getElementById('checkout-form');
const orderSuccessView = document.getElementById('order-success-view');

function updatePaymentDisplay() {
  const latestPay = readLocalData('auto_shop_pay_settings', {});
  const wechatImg = latestPay.wechatQrImage || PAYMENT_CONFIG.wechatQrImage;
  const alipayImg = latestPay.alipayQrImage || PAYMENT_CONFIG.alipayQrImage;
  const stripeUrl = latestPay.stripePaymentLink || PAYMENT_CONFIG.stripePaymentLink;

  const isExpress = selectedCourierCompany === '极速达';
  const expressFee = isExpress ? EXPRESS_SHIPPING_FEE : 0;
  const amount = (getFinalTotal() + expressFee).toFixed(1);
  const subEl = document.getElementById('checkout-subtotal-text');
  if (subEl) subEl.textContent = `¥${getSubtotal().toFixed(1)}`;
  const discTotal = getCalculatedDiscount() + getEffectiveBundleDiscount();
  const discRowEl = document.getElementById('checkout-discount-row');
  if (discRowEl) {
    discRowEl.style.display = discTotal > 0 ? 'flex' : 'none';
    const dt = document.getElementById('checkout-discount-text');
    if (dt) dt.textContent = `-¥${discTotal.toFixed(1)}`;
  }
  const cLabelEl = document.getElementById('checkout-courier-label');
  if (cLabelEl) cLabelEl.textContent = selectedCourierCompany;
  const sFeeEl = document.getElementById('checkout-shipping-fee');
  if (sFeeEl) sFeeEl.textContent = expressFee > 0 ? `+¥${expressFee.toFixed(1)}` : '¥0.0 (免邮)';
  document.getElementById('modal-total-price').textContent = `¥${amount}`;
  const qrPanel = document.getElementById('qr-pay-panel');
  const extPanel = document.getElementById('external-pay-panel');
  const qrImg = document.getElementById('payment-qr-img');
  const guideText = document.getElementById('pay-guide-text');

  if (currentPayMethod === 'stripe') {
    qrPanel.style.display = 'none';
    extPanel.style.display = 'block';
    const payLink = document.getElementById('external-pay-link');
    const targetUrl = safeExternalUrl(stripeUrl);
    payLink.classList.toggle('is-disabled', !targetUrl);
    payLink.setAttribute('aria-disabled', String(!targetUrl));
    payLink.textContent = targetUrl ? '前往安全收银台 ↗' : '暂不支持在线银行卡直付，请使用微信或支付宝扫码付款';
    if (targetUrl) payLink.href = targetUrl;
    else payLink.removeAttribute('href');
    return;
  }

  qrPanel.style.display = 'block';
  extPanel.style.display = 'none';
  const qrSource = currentPayMethod === 'wechat' ? wechatImg : alipayImg;
  const payName = currentPayMethod === 'wechat' ? '微信' : '支付宝';
  qrImg.onerror = () => {
    qrImg.style.display = 'none';
    guideText.textContent = '收款码加载失败，请联系在线客服确认付款方式';
  };
  if (qrSource) {
    qrImg.style.display = 'inline-block';
    qrImg.src = resolveProductImage(qrSource);
    guideText.textContent = `应付金额 ¥${amount} · 请使用${payName}扫码付款后提交订单`;
  } else {
    qrImg.style.display = 'none';
    qrImg.removeAttribute('src');
    guideText.textContent = `暂未开通${payName}扫码收款，请选择其他支付方式或联系客服`;
  }
}

function openCheckoutModal() {
  ensureChinaRegionsLoaded();
  if (cart.length === 0) { showToast('购物袋为空，请先选购商品', 'error'); return; }
  closeCart();

  const savedAddr = readLocalData('auto_shop_saved_checkout_addr', {});
  document.getElementById('receiver-name').value = savedAddr.name || (currentUser ? (currentUser.savedName || currentUser.name) : '');
  document.getElementById('receiver-phone').value = savedAddr.phone || (currentUser ? (currentUser.savedPhone || currentUser.phone) : '');
  document.getElementById('receiver-address').value = savedAddr.detail || '';
  if (savedAddr.province) initRegionSelectors(savedAddr);

  if (garage.model) {
    document.getElementById('order-note').value = `匹配车型：${garage.year}款 ${garage.makeLabel} ${garage.model}`;
  }
  // 渲染结账页右侧商品清单
  const summaryEl = document.getElementById('checkout-items-summary');
  if (summaryEl) {
    summaryEl.innerHTML = cart.map(item => `
      <div class="checkout-mini-row">
        <img src="${safeImageUrl(item.image)}" alt="${escapeHTML(item.name)}">
        <div style="flex:1;min-width:0;">
          <div style="font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHTML(item.name)}</div>
          <div style="font-size:0.74rem;color:var(--text-muted);">${escapeHTML(item.variant)} × ${item.quantity}</div>
        </div>
        <strong style="color:var(--neon-lime);">¥${(item.price * item.quantity).toFixed(1)}</strong>
      </div>`).join('');
  }

  // 重置快递为默认顺丰标快，关闭极速达确认框
  selectedCourierCompany = '顺丰标快';
  expressDeliveryConfirmed = false;
  document.querySelectorAll('#courier-options-grid input[name="courierCompany"]').forEach(r => {
    r.checked = r.value === '顺丰标快';
    r.closest('.courier-card')?.classList.toggle('active', r.checked);
  });
  syncExpressConfirmUI();

  checkoutForm.style.display = 'grid';
  orderSuccessView.style.display = 'none';
  document.getElementById('checkout-modal-title').textContent = '确认订单信息';
  updatePaymentDisplay();

  homeViewEl.style.display = 'none';
  categoryViewEl.style.display = 'none';
  detailViewEl.style.display = 'none';
  if (checkoutViewEl) checkoutViewEl.style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function syncExpressConfirmUI() {
  const box = document.getElementById('express-confirm-box');
  const btn = document.getElementById('confirm-express-btn');
  if (!box || !btn) return;
  if (selectedCourierCompany === '极速达') {
    box.style.display = 'flex';
    box.classList.toggle('is-confirmed', expressDeliveryConfirmed);
    btn.textContent = expressDeliveryConfirmed ? '✓ 已确认使用极速达' : '确认使用极速达';
  } else {
    box.style.display = 'none';
    box.classList.remove('is-confirmed');
  }
}

document.querySelectorAll('#courier-options-grid input[name="courierCompany"]').forEach(radio => {
  radio.addEventListener('change', () => {
    selectedCourierCompany = radio.value;
    expressDeliveryConfirmed = false;
    document.querySelectorAll('#courier-options-grid .courier-card').forEach(card => {
      card.classList.toggle('active', card.querySelector('input') === radio);
    });
    syncExpressConfirmUI();
    updatePaymentDisplay();
  });
});

const confirmExpressBtn = document.getElementById('confirm-express-btn');
if (confirmExpressBtn) {
  confirmExpressBtn.addEventListener('click', () => {
    expressDeliveryConfirmed = true;
    syncExpressConfirmUI();
    showToast('已确认使用极速达加急配送（+¥15.0）');
  });
}

document.getElementById('checkout-btn').addEventListener('click', openCheckoutModal);
document.querySelectorAll('.pay-method-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.pay-method-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentPayMethod = btn.dataset.method;
    updatePaymentDisplay();
  });
});
document.getElementById('close-checkout-modal').addEventListener('click', () => openCategoryView(activeCategory || 'all'));
document.getElementById('finish-order-btn').addEventListener('click', () => showHomeView());

checkoutForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (cart.length === 0) { showToast('购物袋为空，请先选购商品', 'error'); return; }
  rebuildProductsList();
  autoSaveCheckoutAddress();

  const name = document.getElementById('receiver-name').value.trim();
  const phone = document.getElementById('receiver-phone').value.trim();
  if (!name || !/^1[3-9]\d{9}$/.test(phone)) { showToast('请填写收货人和正确的 11 位手机号', 'error'); return; }
  if (!provSel.value || !citySel.value || !distSel.value) { showToast('请完整选择省、市、区县', 'error'); return; }
  if (selectedCourierCompany === '极速达' && !expressDeliveryConfirmed) {
    showToast('您选择了「极速达」，请先点击「确认使用极速达」按钮后再提交订单', 'error');
    document.getElementById('express-confirm-box')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  const fullAddress = `${provSel.value} ${citySel.value} ${distSel.value} ${document.getElementById('receiver-address').value.trim()}`;
  const rawNote = document.getElementById('order-note').value.trim();
  const note = rawNote ? `${rawNote} ｜ 配送：${selectedCourierCompany}` : `配送：${selectedCourierCompany}`;
  const payLabel = currentPayMethod === 'wechat' ? '微信支付' : (currentPayMethod === 'alipay' ? '支付宝' : 'Stripe在线支付');
  const couponCode = appliedCouponObj ? appliedCouponObj.code : '';
  const bundleDiscount = getEffectiveBundleDiscount();

  let createdOrder = null;

  // 1. 若服务端在线，优先走 /api/orders/create 执行服务端原子价格核算与库存事务锁
  if (window.location.protocol.startsWith('http')) {
    try {
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Buyer-Token': getBuyerToken()
        },
        body: JSON.stringify({
          items: cart,
          couponCode,
          applyBundle: activeBundleDiscount > 0,
          courierCompany: selectedCourierCompany,
          payLabel,
          name,
          phone,
          address: fullAddress,
          note
        })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        showToast((data && data.error) || '库存或价格校验未通过', 'error');
        await syncStoreFromServer();
        rebuildProductsList();
        renderCart();
        return;
      }
      createdOrder = data.order;
      orders = readLocalData('auto_shop_orders', []);
      if (!orders.some(o => o.orderId === createdOrder.orderId)) {
        orders.unshift(createdOrder);
        try { localStorage.setItem('auto_shop_orders', JSON.stringify(orders)); } catch (e) {}
      }
      await syncStoreFromServer();
    } catch (err) {
      // 离线模式自动走下方本地闭环
    }
  }

  // 2. 离线/纯静态模式本地降级闭环
  if (!createdOrder) {
    const unavailableItem = cart.find(item => {
      const product = PRODUCTS.find(p => p.id === item.id);
      return !product || item.quantity > product.stock || product.stock <= 0;
    });
    if (unavailableItem) {
      showToast(`「${unavailableItem.name}」当前库存不足，请调整数量`, 'error');
      renderCart();
      return;
    }

    const total = (getFinalTotal() + (selectedCourierCompany === '极速达' ? EXPRESS_SHIPPING_FEE : 0)).toFixed(1);
    const orderId = `AT${Date.now()}${Math.floor(Math.random() * 90 + 10)}`;
    const timeStr = new Date().toLocaleString('zh-CN', { hour12: false });

    cart.forEach(item => {
      const prod = PRODUCTS.find(p => p.id === item.id);
      const curStock = prod ? prod.stock : 20;
      stockMap[item.id] = Math.max(0, curStock - item.quantity);
      const skuKey = `${item.id}__${item.variant}`;
      const matchedSku = prod ? prod.variantSkus.find(s => s.name === item.variant) : null;
      if (matchedSku) {
        skuStockMap[skuKey] = Math.max(0, matchedSku.stock - item.quantity);
      }
    });
    writeLocalData('auto_shop_stock_map', stockMap);
    writeLocalData('auto_shop_sku_stock_map', skuStockMap);

    if (appliedCouponObj) {
      const allDisc = getAvailableDiscounts();
      const target = allDisc.find(d => d.code === appliedCouponObj.code);
      if (target) {
        target.usedCount = (target.usedCount || 0) + 1;
        writeLocalData('auto_shop_discounts', allDisc);
      }
    }

    createdOrder = {
      orderId,
      time: timeStr,
      payLabel,
      total,
      name,
      phone,
      address: fullAddress,
      note,
      status: '待核验收款',
      stockRestored: false,
      courierCompany: selectedCourierCompany,
      trackingNo: '',
      rma: null,
      timeline: [{ time: timeStr, title: '订单已提交，商品库存已锁定', desc: '等待支付核验与仓库排单' }],
      items: [...cart]
    };
    orders.unshift(createdOrder);
    writeLocalData('auto_shop_orders', orders);
  }

  lastCreatedOrderId = createdOrder.orderId;
  const itemsText = (createdOrder.items || []).map(i => `• ${i.name} [${i.variant}] × ${i.quantity} (¥${(i.price * i.quantity).toFixed(1)})`).join('\n');
  const courierStr = createdOrder.courierCompany || selectedCourierCompany || '顺丰标快';
  const feeStr = Number(createdOrder.shippingFee || (courierStr === '极速达' ? 15 : 0)) > 0 ? `（含极速达加急费 ¥${Number(createdOrder.shippingFee || 15).toFixed(1)}）` : '（包邮）';
  const receipt = `订单编号：${createdOrder.orderId}\n下单时间：${createdOrder.time}\n配送方式：${courierStr}${feeStr}\n支付方式：${createdOrder.payLabel}（核定实付 ¥${createdOrder.total}）\n订单状态：${createdOrder.status}\n----------------------------\n商品清单：\n${itemsText}\n----------------------------\n收货人：${createdOrder.name} (${createdOrder.phone})\n收货地址：${createdOrder.address}\n车型/备注：${createdOrder.note}`;

  cart = [];
  appliedCouponObj = null;
  activeBundleDiscount = 0;
  writeLocalData('auto_shop_bundle_discount', 0);
  saveAndRenderCart();
  rebuildProductsList();
  if (categoryViewEl.style.display === 'block') renderProducts();
  if (currentDetailProductId) openProductDetail(currentDetailProductId, false, false);
  updateUserUI();

  document.getElementById('checkout-modal-title').textContent = '订单提交成功';
  document.getElementById('order-receipt').textContent = receipt;
  const simBtn = document.getElementById('simulate-webhook-pay-btn');
  if (simBtn) {
    simBtn.disabled = false;
    simBtn.textContent = '✓ 我已完成付款（立即确认订单）';
  }
  checkoutForm.style.display = 'none';
  orderSuccessView.style.display = 'block';
});

// 安全加固：已移除公开模拟支付核销按钮，订单付款仅由服务端验签 Webhook 或商家后台核销。

document.getElementById('copy-order-btn').addEventListener('click', async (e) => {
  const text = document.getElementById('order-receipt').textContent;
  try {
    if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(text);
    else {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
    }
    e.target.textContent = '已复制到剪贴板 ✓';
    setTimeout(() => { e.target.textContent = '复制订单凭证'; }, 1500);
  } catch (error) {
    showToast('复制失败，请手动选择订单文本', 'error');
  }
});

// 买家查看订单、按手机号/单号检索、取消未付款订单与发起售后退换货 (RMA)
const ordersModal = document.getElementById('orders-modal');
const trackingModal = document.getElementById('tracking-modal');
const rmaModal = document.getElementById('rma-modal');
const buyerOrderSearchInput = document.getElementById('buyer-order-search-input');

function renderBuyerOrdersList() {
  const filterKw = buyerOrderSearchInput ? buyerOrderSearchInput.value : '';
  let visibleOrders = getVisibleBuyerOrders(filterKw);
  if (buyerOrderStatusFilter !== 'all') {
    visibleOrders = visibleOrders.filter(o => (o.status || '待核验收款') === buyerOrderStatusFilter);
  }
  updateUserUI();
  const listEl = document.getElementById('orders-list-container');
  listEl.innerHTML = visibleOrders.length === 0
    ? '<div class="empty-state"><strong>暂无匹配的订单记录</strong><p>您可输入下单时的 11 位手机号或 AT 开头的订单号查询发货进度与售后服务。</p></div>'
    : visibleOrders.map((o) => {
      const status = o.status || '待核验收款';
      const isCancelled = status === '已取消' || status === '已退款';
      const canCancel = status === '待核验收款';
      const canApplyRma = ['已付款·待发货', '已发货', '已完成'].includes(status);
      const items = Array.isArray(o.items) ? o.items : [];
      const encodedOrderId = encodeURIComponent(String(o.orderId));
      const rmaBanner = o.rma
        ? `<div style="background:rgba(245,158,11,0.12);border:1px solid rgba(245,158,11,0.35);color:#fde68a;padding:7px 10px;border-radius:6px;font-size:0.78rem;margin-bottom:8px;">
            <strong>售后进度（${escapeHTML(o.rma.type)}）：${escapeHTML(o.rma.status)}</strong>
            <div>申请原因：${escapeHTML(o.rma.reason)} ${o.rma.merchantNote ? `｜ 客服处理意见：${escapeHTML(o.rma.merchantNote)}` : ''}</div>
          </div>`
        : '';

      return `
        <div class="order-history-card" style="${isCancelled ? 'opacity:0.7;' : ''}">
          <div class="order-history-top">
            <span>单号：${escapeHTML(o.orderId)}</span>
            <span class="status-pill ${['已发货', '已完成', '已付款·待发货'].includes(status) ? 'shipped' : ''}" style="${isCancelled ? 'color:#f43f5e;' : ''}">${escapeHTML(status)}</span>
          </div>
          <div style="color:#8e95a2;font-size:0.8rem;margin-bottom:8px;">${escapeHTML(o.time)} · ${escapeHTML(o.payLabel)} ${o.paidTradeNo ? `(流水号: ${escapeHTML(o.paidTradeNo)})` : ''}</div>
          <div style="margin-bottom:8px;">${items.map(i => `<div>${escapeHTML(i.name)} (${escapeHTML(i.variant)}) × ${Number(i.quantity) || 1}</div>`).join('')}</div>
          ${rmaBanner}
          <div style="background:rgba(216,255,0,0.08);color:#d8ff00;padding:8px 10px;border-radius:4px;font-size:0.8rem;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">
            <span>${o.trackingNo ? `${escapeHTML(o.courierCompany || '合作快递')}：<strong>${escapeHTML(o.trackingNo)}</strong>` : '订单状态与仓库履约轨迹已生成'}</span>
            <button type="button" class="quick-add-btn" style="padding:3px 9px;font-size:0.75rem;" onclick="openTrackingModalById(decodeURIComponent('${encodedOrderId}'))">查看物流与订单轨迹</button>
          </div>
          <div style="font-size:0.8rem;color:#8e95a2;margin-bottom:6px;overflow-wrap:anywhere;">收货地址：${escapeHTML(o.address)}</div>
          <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid rgba(255,255,255,0.12);padding-top:8px;gap:8px;flex-wrap:wrap;">
            <span>收货人：${escapeHTML(o.name)} (${escapeHTML(o.phone)})</span>
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
              ${canCancel ? `<button type="button" class="dark-outline-btn" style="padding:3px 8px;font-size:0.75rem;color:#f43f5e;" onclick="cancelBuyerOrder(decodeURIComponent('${encodedOrderId}'))">取消订单</button>` : ''}
              ${canApplyRma ? `<button type="button" class="dark-outline-btn" style="padding:3px 8px;font-size:0.75rem;color:#f59e0b;" onclick="openRmaModal(decodeURIComponent('${encodedOrderId}'))">申请售后/退换货</button>` : ''}
              <strong style="color:#d8ff00;">实付：¥${escapeHTML(o.total)}</strong>
            </div>
          </div>
        </div>`;
    }).join('');
}

window.cancelBuyerOrder = async function(orderId) {
  orders = readLocalData('auto_shop_orders', []);
  const target = orders.find(o => o.orderId === orderId);
  if (!target || target.status !== '待核验收款') return;
  if (!await siteConfirm(`确定要取消订单 ${orderId} 吗？取消后占用的商品库存将自动退回。`)) return;

  if (window.location.protocol.startsWith('http')) {
    try {
      const res = await fetch('/api/orders/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Buyer-Token': getBuyerToken()
        },
        body: JSON.stringify({ orderId, phone: target.phone || (currentUser && currentUser.phone) || '' })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        const idx = orders.findIndex(o => o.orderId === orderId);
        if (idx >= 0) orders[idx] = data.order;
        try { localStorage.setItem('auto_shop_orders', JSON.stringify(orders)); } catch (e) {}
        await syncStoreFromServer();
        rebuildProductsList();
        renderBuyerOrdersList();
        showToast('订单已取消，对应商品与 SKU 库存已恢复');
        return;
      } else if (data && data.error) {
        showToast(data.error, 'error');
        return;
      }
    } catch (err) {}
  }
  target.status = '已取消';
  const nowStr = new Date().toLocaleString('zh-CN', { hour12: false });
  if (!Array.isArray(target.timeline)) target.timeline = [];
  target.timeline.unshift({ time: nowStr, title: '买家主动取消订单，占用库存已原路释放', desc: '订单已关闭' });

  if (!target.stockRestored) {
    (target.items || []).forEach(item => {
      const prod = PRODUCTS.find(p => p.id === item.id);
      const curStock = prod ? prod.stock : (stockMap[item.id] || 0);
      stockMap[item.id] = curStock + (Number(item.quantity) || 1);
      const skuKey = `${item.id}__${item.variant}`;
      if (skuStockMap[skuKey] !== undefined) {
        skuStockMap[skuKey] = Number(skuStockMap[skuKey]) + (Number(item.quantity) || 1);
      }
    });
    target.stockRestored = true;
    writeLocalData('auto_shop_stock_map', stockMap);
    writeLocalData('auto_shop_sku_stock_map', skuStockMap);
  }
  writeLocalData('auto_shop_orders', orders);
  rebuildProductsList();
  renderBuyerOrdersList();
  showToast('订单已取消，对应商品库存已恢复');
};

// 买家发起售后退换货 (RMA)
let pendingRmaProofImg = '';
window.openRmaModal = function(orderId) {
  pendingRmaProofImg = '';
  document.getElementById('rma-order-id').value = orderId;
  document.getElementById('rma-order-display').value = orderId;
  document.getElementById('rma-reason-input').value = '';
  document.getElementById('rma-return-track').value = '';
  document.getElementById('rma-proof-file').value = '';
  rmaModal.classList.add('active');
};

document.getElementById('close-rma-modal').addEventListener('click', () => rmaModal.classList.remove('active'));
document.getElementById('rma-proof-file').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  pendingRmaProofImg = await compressBuyerImage(file, 600);
});

document.getElementById('rma-apply-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const orderId = document.getElementById('rma-order-id').value;
  const rmaType = document.getElementById('rma-type-select').value;
  const reason = document.getElementById('rma-reason-input').value.trim();
  const returnTrackingNo = document.getElementById('rma-return-track').value.trim();
  if (!orderId || !reason) return;

  if (window.location.protocol.startsWith('http')) {
    try {
      const localTarget = orders.find(o => o.orderId === orderId);
      const res = await fetch('/api/orders/rma', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Buyer-Token': getBuyerToken()
        },
        body: JSON.stringify({
          action: 'apply',
          orderId,
          phone: (localTarget && localTarget.phone) || (currentUser && currentUser.phone) || '',
          rmaType,
          reason,
          returnTrackingNo,
          proofImg: pendingRmaProofImg
        })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        const idx = orders.findIndex(o => o.orderId === orderId);
        if (idx >= 0 && data.order) orders[idx] = data.order;
        try { localStorage.setItem('auto_shop_orders', JSON.stringify(orders)); } catch (e) {}
        await syncStoreFromServer();
        rmaModal.classList.remove('active');
        renderBuyerOrdersList();
        showToast('售后申请已提交，客服将尽快为您审核处理');
        return;
      } else if (data && data.error) {
        showToast(data.error, 'error');
        return;
      }
    } catch (err) {}
  }

  orders = readLocalData('auto_shop_orders', []);
  const target = orders.find(o => o.orderId === orderId);
  if (target) {
    const nowStr = new Date().toLocaleString('zh-CN', { hour12: false });
    target.rma = {
      type: rmaType,
      reason,
      returnTrackingNo,
      proofImg: pendingRmaProofImg,
      status: '待客服审核',
      appliedAt: nowStr,
      merchantNote: ''
    };
    target.status = '售后处理中';
    if (!Array.isArray(target.timeline)) target.timeline = [];
    target.timeline.unshift({ time: nowStr, title: `买家发起售后申请（${rmaType}）`, desc: reason });
    writeLocalData('auto_shop_orders', orders);
  }
  rmaModal.classList.remove('active');
  renderBuyerOrdersList();
  showToast('售后申请已提交，我们将尽快为您处理');
});

document.getElementById('orders-nav-btn').addEventListener('click', () => {
  syncStoreFromServer(() => {
    renderBuyerOrdersList();
    ordersModal.classList.add('active');
  });
});

if (buyerOrderSearchInput) {
  buyerOrderSearchInput.addEventListener('input', renderBuyerOrdersList);
}

// 动态物流与订单生命轨迹弹窗
window.openTrackingModalById = function(orderId) {
  const o = orders.find(item => item.orderId === orderId);
  if (!o) return;
  const company = o.courierCompany || '待分配承运商';
  const trackNo = o.trackingNo || '待揽收出库';
  const kuaidi100Url = o.trackingNo
    ? `https://www.kuaidi100.com/chaxun?nu=${encodeURIComponent(o.trackingNo)}`
    : 'https://www.kuaidi100.com/';

  // 构建真实动态时间轴节点
  const dynamicSteps = [];
  if (Array.isArray(o.timeline) && o.timeline.length > 0) {
    o.timeline.forEach((step, idx) => {
      dynamicSteps.push({
        active: idx === 0,
        title: step.title,
        desc: `${step.time} · ${step.desc || ''}`
      });
    });
  } else {
    if (o.status === '已完成') {
      dynamicSteps.push({ active: true, title: '快件已签收，订单完成', desc: `承运商：${company} · 单号：${trackNo}` });
    }
    if (o.trackingNo) {
      dynamicSteps.push({ active: o.status !== '已完成', title: `快件已由【${company}】揽收发往目的地`, desc: `运单号：${trackNo} · 包装防震核验通过` });
    }
    if (o.paidTradeNo || o.status === '已付款·待发货' || o.trackingNo) {
      dynamicSteps.push({ active: !o.trackingNo, title: '付款核验通过，仓库正在配货打包', desc: `核对适配车型：${o.note || '标准通用件'}` });
    }
    dynamicSteps.push({ active: dynamicSteps.length === 0, title: '订单已提交并锁定库存', desc: o.time });
  }

  const timelineHTML = dynamicSteps.map(s => `
    <div class="timeline-step ${s.active ? 'active' : ''}">
      <div class="tl-dot"></div>
      <div>
        <strong>${escapeHTML(s.title)}</strong>
        <div style="font-size:0.76rem; color:var(--text-muted);">${escapeHTML(s.desc)}</div>
      </div>
    </div>`).join('');

  document.getElementById('tracking-modal-body').innerHTML = `
    <div style="background:var(--bg-elevated); padding:12px; border-radius:6px; margin-bottom:16px; font-size:0.85rem;">
      <div>当前状态：<strong style="color:var(--neon-lime);">${escapeHTML(o.status || '待核验收款')}</strong></div>
      <div style="margin-top:4px;">承运快递：<strong>${escapeHTML(company)}</strong> · 单号：<strong style="color:var(--neon-lime);">${escapeHTML(trackNo)}</strong></div>
      <div style="margin-top:4px; color:var(--text-muted);">收货地址：${escapeHTML(o.address)}</div>
    </div>
    <div class="timeline-box">${timelineHTML}</div>
    ${o.trackingNo ? `<a href="${kuaidi100Url}" target="_blank" rel="noopener noreferrer" class="neon-primary-btn full-width" style="display:block; text-align:center; text-decoration:none; margin-top:16px;">前往快递100查询实时路由轨迹 ↗</a>` : ''}
  `;
  trackingModal.classList.add('active');
};

document.getElementById('close-orders-modal').addEventListener('click', () => ordersModal.classList.remove('active'));
document.getElementById('close-tracking-modal').addEventListener('click', () => trackingModal.classList.remove('active'));

// 弹窗可访问性：焦点圈定、Esc 关闭、点击遮罩关闭与焦点恢复
const dialogFocusOrigins = new WeakMap();
const dialogElements = [...document.querySelectorAll('.modal-backdrop'), cartDrawer];
const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

dialogElements.forEach(dialog => {
  const isDrawer = dialog === cartDrawer;
  const label = isDrawer ? '我的购物袋' : (dialog.querySelector('.modal-title')?.textContent || '操作弹窗');
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-label', label);
  dialog.setAttribute('aria-hidden', dialog.classList.contains('active') ? 'false' : 'true');
  dialog.querySelectorAll('.modal-close, .close-btn').forEach(btn => {
    if (!btn.getAttribute('aria-label')) btn.setAttribute('aria-label', '关闭弹窗');
  });

  if (!isDrawer) {
    dialog.addEventListener('click', event => {
      if (event.target === dialog) {
        dialog.classList.remove('active');
        syncBodyOverlayState();
      }
    });
  }

  new MutationObserver(() => {
    const isActive = dialog.classList.contains('active');
    dialog.setAttribute('aria-hidden', String(!isActive));
    if (isActive) {
      if (!dialogFocusOrigins.has(dialog)) dialogFocusOrigins.set(dialog, document.activeElement);
      const closeButton = dialog.querySelector('.modal-close, .close-btn');
      if (closeButton) setTimeout(() => closeButton.focus(), 0);
    } else if (dialogFocusOrigins.has(dialog)) {
      const origin = dialogFocusOrigins.get(dialog);
      dialogFocusOrigins.delete(dialog);
      if (origin && document.contains(origin)) origin.focus();
    }
    syncBodyOverlayState();
  }).observe(dialog, { attributes: true, attributeFilter: ['class'] });
});

document.addEventListener('keydown', event => {
  const activeDialogs = dialogElements.filter(dialog => dialog.classList.contains('active'));
  const activeDialog = activeDialogs[activeDialogs.length - 1];
  if (event.key === 'Escape') {
    if (activeDialog) {
      activeDialog.classList.remove('active');
      if (activeDialog === cartDrawer) closeCart();
      syncBodyOverlayState();
      event.preventDefault();
    } else if (floatingSearchBar.style.display !== 'none') {
      setSearchOpen(false);
    }
    return;
  }
  if (event.key === 'Tab' && activeDialog) {
    const focusable = [...activeDialog.querySelectorAll(focusableSelector)].filter(el => el.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { last.focus(); event.preventDefault(); }
    else if (!event.shiftKey && document.activeElement === last) { first.focus(); event.preventDefault(); }
  }
});

window.addEventListener('storage', event => {
  if (!event.key || !event.key.startsWith('auto_shop_')) return;
  refreshBuyerAllViews();
});

function refreshBuyerAllViews() {
  cart = readLocalData('auto_shop_cart', []);
  wishlist = readLocalData('auto_shop_wishlist', []);
  orders = readLocalData('auto_shop_orders', []);
  currentUser = readLocalData('auto_shop_user', null);
  allUsers = readLocalData('auto_shop_users', []);
  applyCmsToView();
  rebuildProductsList();
  renderCart();
  updateUserUI();
  if (categoryViewEl.style.display === 'block') renderProducts();
  if (currentDetailProductId) openProductDetail(currentDetailProductId, false, false);
  const footerSyncEl = document.getElementById('footer-sync-status');
  if (footerSyncEl) {
    footerSyncEl.textContent = window.AUTO_SHOP_SERVER_ONLINE
      ? '🟢 实时库存与订单服务在线'
      : '汽车用品与车居美学商城';
  }
}

// 初始化：渲染本地并同步服务端，同时解析 URL 独立路由 (?product=xxx 或 ?cat=xxx)
refreshBuyerAllViews();
handleRouteFromUrl();
syncStoreFromServer(() => {
  refreshBuyerAllViews();
  handleRouteFromUrl();
});


// ==========================================
// 9. 买家端增强交互：购物袋单品移除/清空、跨设备服务端查单、图片灯箱与返回顶部
// ==========================================
window.removeCartItem = function(key) {
  cart = cart.filter(i => i.key !== key);
  saveAndRenderCart();
  showToast('已从购物袋移除');
};

const clearCartBtnEl = document.getElementById('clear-cart-btn');
if (clearCartBtnEl) {
  clearCartBtnEl.addEventListener('click', async () => {
    if (!cart.length) return;
    if (!await siteConfirm('确定要清空购物袋中的所有商品吗？')) return;
    cart = [];
    appliedCouponObj = null;
    activeBundleDiscount = 0;
    writeLocalData('auto_shop_bundle_discount', 0);
    saveAndRenderCart();
    showToast('购物袋已清空');
  });
}

// 跨设备游客精准查单 (/api/orders/lookup)
const guestLookupForm = document.getElementById('guest-order-lookup-form');
if (guestLookupForm) {
  guestLookupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const orderId = document.getElementById('guest-lookup-order-id').value.trim();
    const phone = document.getElementById('guest-lookup-phone').value.trim();
    if (!orderId || !/^1[3-9]\d{9}$/.test(phone)) {
      showToast('请输入完整的 AT 订单号与 11 位下单手机号', 'error');
      return;
    }
    if (!window.location.protocol.startsWith('http')) {
      showToast('本地离线模式下仅支持在本机记录中检索', 'error');
      return;
    }
    try {
      const res = await fetch('/api/orders/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, phone })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok && data.order) {
        orders = readLocalData('auto_shop_orders', []);
        const idx = orders.findIndex(o => o.orderId === data.order.orderId);
        if (idx >= 0) orders[idx] = data.order;
        else orders.unshift(data.order);
        try { localStorage.setItem('auto_shop_orders', JSON.stringify(orders)); } catch (err) {}
        if (buyerOrderSearchInput) buyerOrderSearchInput.value = data.order.orderId;
        renderBuyerOrdersList();
        showToast('已从服务端同步该笔订单');
      } else {
        showToast((data && data.error) || '未找到匹配的订单', 'error');
      }
    } catch (err) {
      showToast('查单服务暂不可用', 'error');
    }
  });
}

// 沉浸式图片放大灯箱
const lightboxModal = document.getElementById('image-lightbox-modal');
const lightboxImg = document.getElementById('lightbox-img');
window.openImageLightbox = function(src) {
  if (!lightboxModal || !lightboxImg || !src) return;
  lightboxImg.src = src;
  lightboxModal.classList.add('active');
};
const closeLightboxBtn = document.getElementById('close-lightbox-modal');
if (closeLightboxBtn) {
  closeLightboxBtn.addEventListener('click', () => lightboxModal.classList.remove('active'));
}

// 返回顶部悬浮按钮
const backToTopBtn = document.getElementById('back-to-top-btn');
if (backToTopBtn) {
  window.addEventListener('scroll', () => {
    backToTopBtn.classList.toggle('visible', window.scrollY > 480);
  }, { passive: true });
  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}


// ==========================================
// 10. 页脚「车品顾问客服」与「退换货与安装保障」弹窗
// ==========================================
const servicePolicyModal = document.getElementById('service-policy-modal');
const servicePolicyTitle = document.getElementById('service-policy-title');
const servicePolicyBody = document.getElementById('service-policy-body');
const closeServicePolicyBtn = document.getElementById('close-service-policy-modal');

if (closeServicePolicyBtn && servicePolicyModal) {
  closeServicePolicyBtn.addEventListener('click', () => servicePolicyModal.classList.remove('active'));
}

const footerServiceBtn = document.getElementById('footer-service-btn');
if (footerServiceBtn && servicePolicyModal) {
  footerServiceBtn.addEventListener('click', () => {
    servicePolicyTitle.textContent = '车品顾问客服支持';
    servicePolicyBody.innerHTML = `
      <div class="service-policy-card">
        <strong>在线升级适配咨询</strong>
        <p>服务时间：每日 09:30 – 22:00（节假日正常值班），下单前可提供车型年份为您核验卡扣与尺寸。</p>
      </div>
      <div class="service-policy-card">
        <strong>订单履约与售后直达</strong>
        <p>如需查询物流单号、修改收货信息或申请退换货，请直接前往「我的订单」发起在线处理。</p>
      </div>
      <div style="display:flex; gap:10px; margin-top:14px; flex-wrap:wrap;">
        <button type="button" class="neon-primary-btn" style="flex:1;" onclick="servicePolicyModal.classList.remove('active');document.getElementById('orders-nav-btn').click();">前往我的订单</button>
        <button type="button" class="dark-outline-btn" style="flex:1;" onclick="servicePolicyModal.classList.remove('active');toggleGarageBar();">打开车型匹配</button>
      </div>`;
    servicePolicyModal.classList.add('active');
  });
}

const footerPolicyBtn = document.getElementById('footer-policy-btn');
if (footerPolicyBtn && servicePolicyModal) {
  footerPolicyBtn.addEventListener('click', () => {
    servicePolicyTitle.textContent = '退换货与无损安装保障';
    servicePolicyBody.innerHTML = `
      <div class="service-policy-card">
        <strong>1. 7 天无理由退换货</strong>
        <p>签收后 7 日内，商品未撕背胶、未装车磨损且配件包装完好，支持在线提交退货退款或换货补发。</p>
      </div>
      <div class="service-policy-card">
        <strong>2. 车型错配与运输破损包赔</strong>
        <p>若收货发现运输破损或按 Garage 核验仍不适配，请拍照上传凭证，商家审核后优先补发或全额退款。</p>
      </div>
      <div class="service-policy-card">
        <strong>3. 3M 无损安装与质保</strong>
        <p>全店件均按原车数据开模，免破线免打孔安装；非人为损坏享质保服务，满 ¥${freeShippingThreshold} 顺丰包邮。</p>
      </div>
      <button type="button" class="neon-primary-btn full-width" style="margin-top:10px;" onclick="servicePolicyModal.classList.remove('active');document.getElementById('orders-nav-btn').click();">在我的订单中申请售后 ↗</button>`;
    servicePolicyModal.classList.add('active');
  });
}


// ==========================================
// 11. MODFORM 导航高亮与底部邮件订阅交互
// ==========================================
const navHomeLink = document.getElementById('nav-home-link');
if (navHomeLink) {
  navHomeLink.addEventListener('click', () => showHomeView());
}

const newsletterForm = document.getElementById('newsletter-form');
if (newsletterForm) {
  newsletterForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const emailInput = document.getElementById('newsletter-email');
    const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      showToast('请输入有效的电子邮箱地址', 'error');
      return;
    }
    if (window.location.protocol.startsWith('http')) {
      try {
        const res = await fetch('/api/newsletter/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.ok) {
          showToast(data.alreadySubscribed ? '该邮箱已订阅过 MODFORM 新品推送' : `订阅成功！新品与升级折扣将发送至 ${email}`);
          e.target.reset();
          return;
        }
      } catch (err) {}
    }
    const localSubs = readLocalData('auto_shop_subscribers', []);
    if (!localSubs.some(s => s && String(s.email).toLowerCase() === email)) {
      localSubs.unshift({ email, subscribedAt: new Date().toLocaleString('zh-CN', { hour12: false }) });
      try { localStorage.setItem('auto_shop_subscribers', JSON.stringify(localSubs)); } catch (err) {}
      showToast(`订阅成功！新品与升级折扣将发送至 ${email}`);
    } else {
      showToast('该邮箱已订阅过 MODFORM 新品推送');
    }
    e.target.reset();
  });
}

// 独立结账页优惠码实时应用
const checkoutApplyCouponBtn = document.getElementById('checkout-apply-coupon-btn');
if (checkoutApplyCouponBtn) {
  checkoutApplyCouponBtn.addEventListener('click', () => {
    const inp = document.getElementById('checkout-coupon-input');
    const msgEl = document.getElementById('checkout-coupon-msg');
    const code = inp ? inp.value.trim().toUpperCase() : '';
    const subtotal = getSubtotal();
    appliedCouponObj = null;
    if (!code) {
      if (msgEl) { msgEl.textContent = '已清除优惠码'; msgEl.className = 'coupon-msg'; }
      updatePaymentDisplay();
      return;
    }
    const found = getAvailableDiscounts().find(d => d.code === code && d.active);
    if (!found) {
      if (msgEl) { msgEl.textContent = '无效或已停用的优惠码'; msgEl.className = 'coupon-msg is-error'; }
      updatePaymentDisplay();
      return;
    }
    if (subtotal < (found.minSpend || 0)) {
      if (msgEl) { msgEl.textContent = `该优惠码需满 ¥${found.minSpend} 方可使用`; msgEl.className = 'coupon-msg is-error'; }
      updatePaymentDisplay();
      return;
    }
    appliedCouponObj = found;
    if (msgEl) {
      msgEl.textContent = found.type === 'fixed' ? `✓ 已应用「${found.code}」立减 ¥${found.value}` : `✓ 已应用「${found.code}」享 ${(found.value / 10).toFixed(1)} 折`;
      msgEl.className = 'coupon-msg is-success';
    }
    updatePaymentDisplay();
  });
}

// 我的订单状态筛选 Tab
document.querySelectorAll('#buyer-order-tabs .order-filter-pill').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#buyer-order-tabs .order-filter-pill').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    buyerOrderStatusFilter = btn.dataset.orderStatus || 'all';
    renderBuyerOrdersList();
  });
});

window.toggleCartItemSelect = function(key, checked) {
  if (checked) selectedCartKeys.add(key);
  else selectedCartKeys.delete(key);
  const selectAllCb = document.getElementById('cart-select-all');
  const batchDelBtn = document.getElementById('cart-batch-delete-btn');
  if (selectAllCb) selectAllCb.checked = cart.length > 0 && selectedCartKeys.size === cart.length;
  if (batchDelBtn) {
    batchDelBtn.disabled = selectedCartKeys.size === 0;
    batchDelBtn.textContent = `批量删除 (${selectedCartKeys.size})`;
  }
};

const cartSelectAllEl = document.getElementById('cart-select-all');
if (cartSelectAllEl) {
  cartSelectAllEl.addEventListener('change', (e) => {
    if (e.target.checked) cart.forEach(i => selectedCartKeys.add(i.key));
    else selectedCartKeys.clear();
    renderCart();
  });
}

const cartBatchDeleteBtn = document.getElementById('cart-batch-delete-btn');
if (cartBatchDeleteBtn) {
  cartBatchDeleteBtn.addEventListener('click', async () => {
    if (selectedCartKeys.size === 0) return;
    const count = selectedCartKeys.size;
    if (!await siteConfirm(`确定要批量删除已勾选的 ${count} 件商品吗？`)) return;
    cart = cart.filter(i => !selectedCartKeys.has(i.key));
    selectedCartKeys.clear();
    saveAndRenderCart();
    showToast(`已批量删除 ${count} 件商品`);
  });
}

const jumpNewArrivalsBtn = document.getElementById('jump-new-arrivals-btn');
if (jumpNewArrivalsBtn) {
  jumpNewArrivalsBtn.addEventListener('click', () => {
    const sec = document.getElementById('new-arrivals-section');
    if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

// 商品展示呈现方式切换（标准网格 / 大图陈列 / 横向列表）
let productLayoutMode = readLocalData('auto_shop_layout_mode', 'grid');
function applyProductLayoutMode() {
  const grid = document.getElementById('product-grid');
  if (!grid) return;
  grid.classList.remove('layout-grid', 'layout-large', 'layout-list');
  grid.classList.add(`layout-${productLayoutMode}`);
  document.querySelectorAll('#layout-mode-switcher .layout-mode-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.layout === productLayoutMode);
  });
}
document.querySelectorAll('#layout-mode-switcher .layout-mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    productLayoutMode = btn.dataset.layout || 'grid';
    try { localStorage.setItem('auto_shop_layout_mode', JSON.stringify(productLayoutMode)); } catch (e) {}
    applyProductLayoutMode();
  });
});
applyProductLayoutMode();


// ==========================================
// 12. 汽车垂直旗舰功能：DIY难度/包装清单/动态送达时效/车友问答/商品对比/多车库
// ==========================================
function getProductDiyMeta(product) {
  const cat = product.category;
  let defaults;
  if (cat === 'exterior') {
    defaults = { difficulty: '★★☆☆☆ 轻度 DIY', duration: '约 10–15 分钟', tools: '附赠 3M 助粘剂 / 螺丝' };
  } else if (cat === 'interior') {
    defaults = { difficulty: '★☆☆☆☆ 新手无损', duration: '约 3–5 分钟', tools: '免工具 / 附赠无损撬棒' };
  } else if (cat === 'storage') {
    defaults = { difficulty: '★☆☆☆☆ 即放即用', duration: '约 1 分钟', tools: '免工具直接卡入' };
  } else {
    defaults = { difficulty: '★☆☆☆☆ 极简安装', duration: '约 30 秒', tools: '免工具磁吸/夹扣' };
  }
  return {
    difficulty: (product.diyDifficulty && String(product.diyDifficulty).trim()) || defaults.difficulty,
    duration: (product.diyDuration && String(product.diyDuration).trim()) || defaults.duration,
    tools: defaults.tools
  };
}

function getProductBoxContents(product) {
  if (Array.isArray(product.boxContents) && product.boxContents.length > 0) {
    return product.boxContents;
  }
  const base = [`${product.name} 主体 ×1`];
  if (product.category === 'exterior') base.push('车规级 3M 助粘剂 ×1', '酒精清洁棉片 ×2', '定位安装指引卡 ×1');
  else if (product.category === 'interior') base.push('无损内饰撬棒 ×1', '清洁擦拭布 ×1', '质保服务卡 ×1');
  else if (product.category === 'storage') base.push('防滑消音垫片 ×1', '收纳使用说明 ×1');
  else base.push('植物精油替换香芯 ×2', '出风口硅胶保护夹 ×1');
  return base;
}

function getDeliveryEtaHTML(inStock) {
  if (!inStock) {
    return '<div class="delivery-eta-box" style="background:rgba(244,63,94,0.08);border-color:rgba(244,63,94,0.35);color:#ffe4e6;"><span>当前规格补货中 · 预计 3–5 天恢复发货</span></div>';
  }
  const now = new Date();
  const sameDay = now.getHours() < 16;
  const stdDate = new Date(now.getTime() + (sameDay ? 2 : 3) * 86400000);
  const expDate = new Date(now.getTime() + (sameDay ? 1 : 2) * 86400000);
  const fmt = d => `${d.getMonth() + 1}月${d.getDate()}日`;
  return `<div class="delivery-eta-box">
    <span>🚚 <strong>现货速发</strong> · ${sameDay ? '今日 16:00 前下单当天发出' : '明日上午优先排单发出'}</span>
    <span>顺丰预计 <strong>${fmt(stdDate)}</strong> 达 · 极速达预计 <strong>${fmt(expDate)}</strong> 达</span>
  </div>`;
}

function renderProductQaList(productId) {
  const listEl = document.getElementById('detail-qa-list');
  const countEl = document.getElementById('detail-qa-count');
  if (!listEl) return;
  const qaMap = readLocalData('auto_shop_qa', {});
  const items = Array.isArray(qaMap[productId]) ? qaMap[productId] : [];
  if (countEl) countEl.textContent = items.length;
  if (items.length === 0) {
    listEl.innerHTML = '<p style="font-size:0.8rem;color:var(--text-muted);padding:8px 0;">暂无车友提问，有车型适配或安装细节疑问可直接提问。</p>';
    return;
  }
  listEl.innerHTML = items.map(q => `
    <div class="qa-item-card">
      <div style="margin-bottom:4px;"><span class="qa-q-tag">问</span><strong>${escapeHTML(q.question)}</strong></div>
      <div style="font-size:0.74rem;color:var(--text-muted);margin-bottom:${q.answer ? '6px' : '0'};">${escapeHTML(q.user)} · ${escapeHTML(q.car)} · ${escapeHTML(q.time || '')}</div>
      ${q.answer ? `<div><span class="qa-a-tag">答</span><span style="color:#cbd5e1;">${escapeHTML(q.answer)}</span></div>` : ''}
    </div>`).join('');
}

// --- 同类商品横向对比 ---
window.toggleCompareProduct = function(e, productId) {
  if (e) { e.stopPropagation(); e.preventDefault(); }
  if (compareProductIds.includes(productId)) {
    compareProductIds = compareProductIds.filter(id => id !== productId);
  } else {
    if (compareProductIds.length >= 3) {
      showToast('最多同时对比 3 款车品，请先移除 1 款', 'error');
      return;
    }
    compareProductIds.push(productId);
  }
  renderCompareDock();
  if (categoryViewEl.style.display === 'block') renderProducts();
  renderNewArrivals();
};

function renderCompareDock() {
  const dock = document.getElementById('compare-dock');
  const itemsEl = document.getElementById('compare-dock-items');
  if (!dock || !itemsEl) return;
  if (compareProductIds.length === 0) {
    dock.style.display = 'none';
    return;
  }
  dock.style.display = 'flex';
  const prods = compareProductIds.map(id => PRODUCTS.find(p => p.id === id)).filter(Boolean);
  itemsEl.innerHTML = prods.map(p => `
    <span class="compare-chip">
      <span>${escapeHTML(p.name.slice(0, 12))}${p.name.length > 12 ? '…' : ''}</span>
      <button type="button" onclick="toggleCompareProduct(event, '${encodeURIComponent(p.id)}')" aria-label="移除对比">✕</button>
    </span>`).join('');
}

const openCompareBtn = document.getElementById('open-compare-modal-btn');
const compareModal = document.getElementById('compare-modal');
const closeCompareBtn = document.getElementById('close-compare-modal');
const clearCompareBtn = document.getElementById('clear-compare-btn');

if (closeCompareBtn && compareModal) {
  closeCompareBtn.addEventListener('click', () => compareModal.classList.remove('active'));
}
if (clearCompareBtn) {
  clearCompareBtn.addEventListener('click', () => {
    compareProductIds = [];
    renderCompareDock();
    if (categoryViewEl.style.display === 'block') renderProducts();
    renderNewArrivals();
  });
}
if (openCompareBtn && compareModal) {
  openCompareBtn.addEventListener('click', () => {
    if (compareProductIds.length < 2) {
      showToast('请至少选择 2 款商品进行横向对比', 'error');
      return;
    }
    const prods = compareProductIds.map(id => PRODUCTS.find(p => p.id === id)).filter(Boolean);
    const tableBox = document.getElementById('compare-table-container');
    if (tableBox) {
      tableBox.innerHTML = `
        <table class="compare-table">
          <tbody>
            <tr><th>商品预览</th>${prods.map(p => `<td><img src="${safeImageUrl(p.image, p.category)}" alt="" style="width:92px;height:92px;object-fit:cover;border-radius:8px;margin-bottom:6px;display:block;"><strong>${escapeHTML(p.name)}</strong></td>`).join('')}</tr>
            <tr><th>起步价格</th>${prods.map(p => `<td><strong style="color:var(--neon-lime);font-size:1.05rem;">¥${Number(p.price).toFixed(1)}</strong></td>`).join('')}</tr>
            <tr><th>适配范围</th>${prods.map(p => `<td>${escapeHTML(p.fitmentLabel)}</td>`).join('')}</tr>
            <tr><th>材质工艺</th>${prods.map(p => `<td>${escapeHTML((p.params && p.params['主体材质']) || '车规级精选材质')}</td>`).join('')}</tr>
            <tr><th>安装耗时</th>${prods.map(p => `<td>${escapeHTML(getProductDiyMeta(p).duration)} (${escapeHTML(getProductDiyMeta(p).difficulty)})</td>`).join('')}</tr>
            <tr><th>库存状态</th>${prods.map(p => `<td>${p.stock > 0 ? `现货 ${p.stock} 件` : '<span style="color:#f43f5e;">暂时缺货</span>'}</td>`).join('')}</tr>
            <tr><th>操作</th>${prods.map(p => `<td><button type="button" class="neon-primary-btn" style="padding:6px 12px;font-size:0.78rem;" onclick="compareModal.classList.remove('active');openProductDetail('${encodeURIComponent(p.id)}')">查看详情</button></td>`).join('')}</tr>
          </tbody>
        </table>`;
    }
    compareModal.classList.add('active');
  });
}

// --- 多辆爱车车库保存与一键切换 ---
function saveCarToGarageList(carObj) {
  if (!carObj || !carObj.make || !carObj.model) return;
  let saved = readLocalData('auto_shop_saved_cars', []);
  if (!Array.isArray(saved)) saved = [];
  const key = `${carObj.make}_${carObj.year}_${carObj.model}`;
  saved = [{ ...carObj, key }, ...saved.filter(c => c.key !== key)].slice(0, 3);
  try { localStorage.setItem('auto_shop_saved_cars', JSON.stringify(saved)); } catch (e) {}
  renderSavedCarsBar();
}

function renderSavedCarsBar() {
  const bar = document.getElementById('saved-cars-bar');
  if (!bar) return;
  const saved = readLocalData('auto_shop_saved_cars', []);
  if (!Array.isArray(saved) || saved.length === 0) {
    bar.style.display = 'none';
    return;
  }
  bar.style.display = 'flex';
  const curKey = `${garage.make}_${garage.year}_${garage.model}`;
  bar.innerHTML = `<span style="font-size:0.74rem;color:var(--text-muted);width:100%;">已保存爱车（点击一键切换）：</span>` +
    saved.map((c, idx) => `<button type="button" class="saved-car-chip ${c.key === curKey ? 'active' : ''}" onclick="switchSavedCar(${idx})">🚗 ${escapeHTML(c.year)}款 ${escapeHTML(c.makeLabel)} ${escapeHTML(c.model)}</button>`).join('');
}

window.switchSavedCar = async function(idx) {
  const saved = readLocalData('auto_shop_saved_cars', []);
  const target = Array.isArray(saved) ? saved[idx] : null;
  if (!target) return;
  garage = { make: target.make, makeLabel: target.makeLabel, year: target.year, model: target.model, inferredFit: target.inferredFit || inferVehicleFitment(target.make, target.model) };
  writeLocalData('auto_shop_garage_v2', garage);
  makeSelect.value = garage.make;
  yearSelect.value = garage.year;
  await fetchModelsFromNetwork(garage.make, garage.year, garage.model);
  updateGarageUI();
  renderSavedCarsBar();
  showToast(`已切换爱车：${garage.year}款 ${garage.makeLabel} ${garage.model}`);
};
renderSavedCarsBar();


// ==========================================
// Contact 联系方式导航、一键复制与留言表单
// ==========================================
(function initContactSection() {
  const navContact = document.getElementById('nav-contact-link');
  if (navContact) {
    navContact.addEventListener('click', () => {
      if (typeof showHomeView === 'function') showHomeView();
      setTimeout(() => {
        const sec = document.getElementById('contact-section');
        if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
    });
  }

  document.querySelectorAll('.contact-copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const val = btn.dataset.copy || '';
      if (!val) return;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(val).catch(() => {});
      }
      const oldText = btn.textContent;
      btn.textContent = '已复制 ✓';
      setTimeout(() => { btn.textContent = oldText; }, 1600);
    });
  });

  const form = document.getElementById('contact-inquiry-form');
  const feedback = document.getElementById('contact-form-feedback');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = (document.getElementById('contact-name')?.value || '').trim() || '匿名车友';
      const car = (document.getElementById('contact-car')?.value || '').trim() || '未填写车型';
      const way = (document.getElementById('contact-way')?.value || '').trim();
      const msg = (document.getElementById('contact-msg')?.value || '').trim();
      if (!way || !msg) return;
      const list = readLocalData('auto_shop_contact_messages', []);
      list.unshift({ name, car, way, msg, status: '待处理', time: new Date().toLocaleString('zh-CN', { hour12: false }) });
      if (window.location.protocol.startsWith('http')) {
        fetch('/api/contact/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, car, way, msg })
        }).catch(() => {});
      }
      try { localStorage.setItem('auto_shop_contact_messages', JSON.stringify(list.slice(0, 50))); } catch (err) {}
      form.reset();
      if (feedback) {
        feedback.textContent = '留言已收到，MODFORM 专属车品顾问将在 2 小时内联系您！';
        feedback.style.display = 'block';
      }
    });
  }
})();


// ==========================================
// 统一双语切换引擎与 CMS 联系方式同步（单一入口，无嵌套包装）
// ==========================================
(function syncCmsContactToStorefront() {
  const cms = readLocalData('auto_shop_cms', {});
  const cards = document.querySelectorAll('#contact-section .contact-info-card');
  if (cards.length >= 3) {
    if (cms.contactEmail) {
      const v = cards[0].querySelector('.contact-card-val');
      const b = cards[0].querySelector('.contact-copy-btn');
      if (v) v.textContent = cms.contactEmail;
      if (b) b.dataset.copy = cms.contactEmail;
    }
    if (cms.contactWechat) {
      const v = cards[1].querySelector('.contact-card-val');
      const b = cards[1].querySelector('.contact-copy-btn');
      if (v) v.textContent = cms.contactWechat;
      if (b) b.dataset.copy = cms.contactWechat;
    }
    if (cms.contactHours) {
      const v = cards[2].querySelector('.contact-card-val');
      if (v) v.textContent = cms.contactHours;
    }
  }
})();

window.applySiteLanguage = function(lang) {
  currentSiteLang = lang === 'en' ? 'en' : 'zh';
  const isEn = currentSiteLang === 'en';
  try { localStorage.setItem('modform_lang', currentSiteLang); } catch (e) {}
  document.documentElement.lang = isEn ? 'en' : 'zh-CN';
  const t = I18N_MAP[currentSiteLang];

  const langBtn = document.getElementById('lang-toggle-btn');
  if (langBtn) langBtn.textContent = t.langBtn;

  const annEl = document.getElementById('site-announcement-text');
  if (annEl) {
    if (isEn) {
      if (!annEl.dataset.zhText) annEl.dataset.zhText = annEl.textContent;
      annEl.textContent = 'Free SF Express shipping over ¥99 · 7-day hassle-free returns';
    } else if (annEl.dataset.zhText) {
      annEl.textContent = annEl.dataset.zhText;
    }
  }
  const searchIn = document.getElementById('search-input');
  if (searchIn) searchIn.placeholder = isEn ? 'Search Alcantara, carbon trim, storage, diffuser or vehicle...' : '搜索翻毛皮、碳纤维、尾翼、储物盒、香薰或适用车型…';

  const navHome = document.getElementById('nav-home-link');
  if (navHome) navHome.textContent = t.navHome;
  const navShop = document.getElementById('nav-shop-all');
  if (navShop) navShop.innerHTML = `${t.navCatalog} <span class="nav-caret" aria-hidden="true">▾</span>`;
  const navContact = document.getElementById('nav-contact-link');
  if (navContact) navContact.textContent = t.navContact;

  const garageText = document.getElementById('garage-btn-text');
  if (garageText && (!garage || !garage.make)) garageText.textContent = t.garageBtn;
  const featAll = document.getElementById('featured-shop-all');
  if (featAll) featAll.textContent = t.shopAll;
  const naAll = document.getElementById('new-arrivals-all-btn');
  if (naAll) naAll.textContent = t.viewAll;
  const backHome = document.getElementById('cat-back-home-btn');
  if (backHome) backHome.textContent = t.backHome;
  const inStockLabel = document.querySelector('#in-stock-filter-label span');
  if (inStockLabel) inStockLabel.textContent = t.inStock;
  const bottomLabel = document.querySelector('.catalog-bottom-label');
  if (bottomLabel) bottomLabel.textContent = t.bottomSwitch;

  // Newsletter
  const newsH = document.getElementById('newsletter-heading');
  if (newsH) newsH.textContent = t.newsHeading;
  const newsS = document.getElementById('newsletter-sub');
  if (newsS) newsS.textContent = t.newsSub;
  const newsI = document.getElementById('newsletter-email');
  if (newsI) newsI.placeholder = t.newsPlaceholder;

  // Contact section
  const cTitle = document.getElementById('contact-sec-title');
  if (cTitle) cTitle.textContent = t.contactTitle;
  const cDesc = document.querySelector('.contact-band-desc');
  if (cDesc) cDesc.textContent = t.contactDesc;
  const cSubmit = document.querySelector('#contact-inquiry-form button[type="submit"]');
  if (cSubmit) cSubmit.textContent = t.contactSubmit;
  const cFormTitle = document.querySelector('#contact-inquiry-form h3');
  const cFormSub = document.querySelector('#contact-inquiry-form p');
  if (cFormTitle) cFormTitle.textContent = isEn ? 'Quick Inquiry' : '快速留言咨询';
  if (cFormSub) cFormSub.textContent = isEn ? 'Share your vehicle and request — our team replies within 2 hours.' : '留下您的车型与需求，顾问将在 2 小时内回复。';
  const cName = document.getElementById('contact-name');
  const cCar = document.getElementById('contact-car');
  const cWay = document.getElementById('contact-way');
  const cMsg = document.getElementById('contact-msg');
  if (cName) cName.placeholder = isEn ? 'Your Name (Optional)' : '您的称呼（选填）';
  if (cCar) cCar.placeholder = isEn ? 'Vehicle & Year (e.g. 2024 Tesla Model 3)' : '您的车型与年份（如 2024款 小米 SU7）';
  if (cWay) cWay.placeholder = isEn ? 'WeChat / Phone / Email *' : '微信号 / 手机号 / 邮箱 *';
  if (cMsg) cMsg.placeholder = isEn ? 'Product inquiry, fitment question, or order request *' : '想咨询的商品、适配问题或合作需求 *';
  const copyBtns = document.querySelectorAll('#contact-section .contact-copy-btn');
  if (copyBtns[0]) copyBtns[0].textContent = isEn ? 'Copy Email' : '复制邮箱';
  if (copyBtns[1]) copyBtns[1].textContent = isEn ? 'Copy WeChat' : '复制微信号';
  const cSub = document.querySelector('#contact-section .contact-card-sub');
  if (cSub) cSub.textContent = isEn ? 'Online daily, weekdays & weekends' : '工作日 & 周末均在线';

  // Dropdown, category pills & homepage category cards
  document.querySelectorAll('.nav-catalog-item').forEach(btn => {
    const cat = btn.dataset.category;
    const span = btn.querySelector('span');
    if (span && t.cats[cat]) span.textContent = t.cats[cat];
  });
  document.querySelectorAll('.pill-switch').forEach(btn => {
    const cat = btn.dataset.category;
    const countSpan = btn.querySelector('span');
    if (t.cats[cat] && countSpan) {
      btn.innerHTML = `${t.cats[cat]} (<span id="${countSpan.id}">${countSpan.textContent}</span>)`;
    }
  });
  document.querySelectorAll('.ride-cat-card').forEach(card => {
    const cat = card.dataset.category;
    const h3 = card.querySelector('.collection-card-title');
    if (h3 && t.cats[cat]) h3.textContent = t.cats[cat];
    const meta = card.querySelector('.collection-card-meta');
    const cntSpan = document.getElementById(`home-count-${cat}`);
    if (meta && cntSpan) {
      meta.innerHTML = isEn
        ? `<span id="home-count-${cat}">${cntSpan.textContent}</span> items`
        : `<span id="home-count-${cat}">${cntSpan.textContent}</span> 款商品`;
    }
  });

  // Catalog banner, selects & count
  const catTitle = document.getElementById('cat-view-title');
  const catDesc = document.getElementById('cat-view-desc');
  const activeMeta = isEn ? CATEGORY_META_EN[activeCategory] : CATEGORY_META[activeCategory];
  if (activeMeta) {
    if (catTitle) catTitle.textContent = activeMeta.title;
    if (catDesc) catDesc.textContent = activeMeta.desc;
  }
  const priceSel = document.getElementById('price-range-select');
  if (priceSel && priceSel.options && priceSel.options.length >= 4) {
    const pLabels = isEn ? ['All Prices', 'Under ¥50', '¥50 – ¥100', '¥100+'] : ['全部价格', '¥50 以下', '¥50 – ¥100', '¥100 以上'];
    pLabels.forEach((lbl, i) => { if (priceSel.options[i]) priceSel.options[i].textContent = lbl; });
  }
  const sortSel = document.getElementById('sort-select');
  if (sortSel && sortSel.options && sortSel.options.length >= 3) {
    const sLabels = isEn ? ['Best Selling', 'Price: Low to High', 'Price: High to Low'] : ['销量：从高到低', '价格：从低到高', '价格：从高到低'];
    sLabels.forEach((lbl, i) => { if (sortSel.options[i]) sortSel.options[i].textContent = lbl; });
  }
  const resCount = document.getElementById('result-count-label');
  if (resCount) {
    const numMatch = String(resCount.textContent).match(/\d+/);
    if (numMatch) resCount.textContent = isEn ? `${numMatch[0]} items` : `共 ${numMatch[0]} 件商品`;
  }

  // Cart drawer, Garage modal, Detail static buttons & Footer
  const cartTitle = document.querySelector('#cart-drawer .drawer-header h3');
  if (cartTitle) cartTitle.textContent = isEn ? 'Shopping Bag' : '我的购物袋';
  const checkoutBtn = document.getElementById('go-checkout-btn');
  if (checkoutBtn) checkoutBtn.textContent = isEn ? 'Proceed to Checkout →' : '去结算中心 →';
  const garageTitle = document.querySelector('#garage-modal .modal-title');
  if (garageTitle) garageTitle.textContent = isEn ? 'My Garage · Vehicle Fitment' : '我的爱车 · 专属车型适配库';
  const garageApply = document.getElementById('apply-garage-btn');
  if (garageApply) garageApply.textContent = isEn ? 'Confirm' : '确认';
  const dBack = document.getElementById('detail-back-btn');
  if (dBack) dBack.textContent = isEn ? '← Back to Catalog' : '← 返回当前类目';
  const dShare = document.getElementById('share-product-link-btn');
  if (dShare) dShare.textContent = isEn ? '🔗 Copy Product Link' : '🔗 复制商品直达链接';
  const footSupport = document.getElementById('footer-support-btn');
  if (footSupport) footSupport.textContent = isEn ? 'Customer Support' : '车品顾问客服';
  const footWarranty = document.getElementById('footer-warranty-btn');
  if (footWarranty) footWarranty.textContent = isEn ? 'Returns & Warranty' : '退换货与安装保障';

  // Re-render dynamic grids & active detail view
  if (typeof renderNewArrivals === 'function') renderNewArrivals();
  if (typeof renderProducts === 'function') renderProducts();
  const detailView = document.getElementById('product-detail-view');
  if (detailView && detailView.style.display !== 'none' && currentDetailProductId && typeof openProductDetail === 'function') {
    openProductDetail(currentDetailProductId, false);
  }
};

(function initLangToggle() {
  const btn = document.getElementById('lang-toggle-btn');
  if (btn) {
    btn.addEventListener('click', () => {
      window.applySiteLanguage(currentSiteLang === 'zh' ? 'en' : 'zh');
    });
  }
  window.applySiteLanguage(currentSiteLang);
})();

(function syncCmsCategoryCovers() {
  const cms = readLocalData('auto_shop_cms', {});
  const map = {
    interior: cms.catImgInterior,
    exterior: cms.catImgExterior,
    storage: cms.catImgStorage,
    scent: cms.catImgScent
  };
  Object.keys(map).forEach(cat => {
    const val = map[cat];
    if (!val) return;
    const imgEl = document.getElementById(`home-cat-img-${cat}`);
    if (imgEl) imgEl.src = resolveProductImage(val, cat);
  });
})();


// ==========================================
// 全量 CMS 主题实时渲染引擎（接管买家端所有可编辑元素）
// ==========================================
window.applyFullCmsTheme = function() {
  const cms = readLocalData('auto_shop_cms', {});
  if (!cms || typeof cms !== 'object') return;

  // 1. 品牌名称 & 主强调色
  if (cms.brandName) {
    document.querySelectorAll('.brand-wordmark, .ride-brand-logo, .footer-brand').forEach(el => {
      el.textContent = cms.brandName;
    });
    if (document.title && document.title.includes('MODFORM')) {
      document.title = document.title.replace(/MODFORM/g, cms.brandName);
    }
  }
  if (cms.accentColor && /^#[0-9a-fA-F]{6}$/.test(cms.accentColor)) {
    document.documentElement.style.setProperty('--neon-lime', cms.accentColor);
    document.documentElement.style.setProperty('--accent', cms.accentColor);
  }

  // 2. 顶部公告栏显隐与双语文案
  const annBar = document.querySelector('.announcement-bar, .top-announcement');
  if (annBar && cms.showAnnouncement === false) annBar.style.display = 'none';
  else if (annBar && cms.showAnnouncement === true) annBar.style.display = '';
  const annEl = document.getElementById('site-announcement-text');
  if (annEl) {
    if (currentSiteLang === 'en' && cms.announcementEn) annEl.textContent = cms.announcementEn;
    else if (cms.announcement) { annEl.textContent = cms.announcement; annEl.dataset.zhText = cms.announcement; }
  }

  // 3. 首屏 Hero 文案、按钮与大图
  const heroTitleEl = document.getElementById('hero-title');
  if (heroTitleEl && cms.heroTitle) heroTitleEl.textContent = cms.heroTitle;
  const heroGarageBtn = document.getElementById('hero-garage-btn');
  if (heroGarageBtn && cms.showHeroGarageBtn === false) heroGarageBtn.style.display = 'none';
  else if (heroGarageBtn) heroGarageBtn.style.display = '';
  const garageBtnText = document.getElementById('garage-btn-text');
  if (garageBtnText && cms.heroBtnText && (!garage || !garage.make) && currentSiteLang !== 'en') {
    garageBtnText.textContent = cms.heroBtnText;
  }
  const heroImg = document.querySelector('.ride-hero-visual img');
  if (heroImg && cms.heroBg1) heroImg.src = resolveProductImage(cms.heroBg1);

  // 4. 四大品类名称、英文标、封面图与显隐
  const catCfg = {
    interior: { title: cms.catTitleInterior, en: cms.catEnInterior, img: cms.catImgInterior, vis: cms.catVisInterior },
    exterior: { title: cms.catTitleExterior, en: cms.catEnExterior, img: cms.catImgExterior, vis: cms.catVisExterior },
    storage: { title: cms.catTitleStorage, en: cms.catEnStorage, img: cms.catImgStorage, vis: cms.catVisStorage },
    scent: { title: cms.catTitleScent, en: cms.catEnScent, img: cms.catImgScent, vis: cms.catVisScent }
  };
  Object.keys(catCfg).forEach(cat => {
    const c = catCfg[cat];
    if (c.title && CATEGORY_META[cat]) CATEGORY_META[cat].title = c.title;
    if (c.title && I18N_MAP && I18N_MAP.zh && I18N_MAP.zh.cats) I18N_MAP.zh.cats[cat] = c.title;
    const card = document.querySelector(`.ride-cat-card[data-category="${cat}"]`);
    if (card) {
      if (c.vis === false) card.style.display = 'none';
      else if (c.vis === true) card.style.display = '';
      const h3 = card.querySelector('.collection-card-title');
      if (h3 && c.title && currentSiteLang !== 'en') h3.textContent = c.title;
      const pill = card.querySelector('.ride-cat-pill');
      if (pill && c.en) pill.textContent = c.en;
    }
    const imgEl = document.getElementById(`home-cat-img-${cat}`);
    if (imgEl && c.img) imgEl.src = resolveProductImage(c.img, cat);

    document.querySelectorAll(`.nav-catalog-item[data-category="${cat}"], .pill-switch[data-category="${cat}"]`).forEach(btn => {
      if (c.vis === false) btn.style.display = 'none';
      else if (c.vis === true) btn.style.display = '';
      if (c.title && currentSiteLang !== 'en') {
        const sp = btn.querySelector('span');
        if (btn.classList.contains('nav-catalog-item') && sp) sp.textContent = c.title;
        else if (btn.classList.contains('pill-switch') && sp) {
          btn.innerHTML = `${c.title} (<span id="${sp.id}">${sp.textContent}</span>)`;
        }
      }
    });
  });

  // 5. 新品板块与邮件订阅横幅
  const naSec = document.getElementById('new-arrivals-section');
  if (naSec && cms.showNewArrivalsSection === false) naSec.style.display = 'none';
  else if (naSec) naSec.style.display = '';
  const naTitle = document.getElementById('new-arrivals-title');
  if (naTitle && cms.newArrivalsTitle) naTitle.textContent = cms.newArrivalsTitle;

  const newsBand = document.querySelector('.ride-newsletter-band');
  if (newsBand && cms.showNewsletterBand === false) newsBand.style.display = 'none';
  else if (newsBand) newsBand.style.display = '';
  const newsH = document.getElementById('newsletter-heading');
  const newsS = document.getElementById('newsletter-sub');
  if (newsH && cms.newsletterHeading && currentSiteLang !== 'en') newsH.textContent = cms.newsletterHeading;
  if (newsS && cms.newsletterSub && currentSiteLang !== 'en') newsS.textContent = cms.newsletterSub;

  // 6. Contact 板块显隐与文案
  const contactSec = document.getElementById('contact-section');
  const navContactBtn = document.getElementById('nav-contact-link');
  if (contactSec && cms.showContactSection === false) {
    contactSec.style.display = 'none';
    if (navContactBtn) navContactBtn.style.display = 'none';
  } else if (contactSec) {
    contactSec.style.display = '';
    if (navContactBtn) navContactBtn.style.display = '';
  }
  const cTitle = document.getElementById('contact-sec-title');
  const cDesc = document.querySelector('.contact-band-desc');
  if (cTitle && cms.contactTitle && currentSiteLang !== 'en') cTitle.textContent = cms.contactTitle;
  if (cDesc && cms.contactDesc && currentSiteLang !== 'en') cDesc.textContent = cms.contactDesc;

  if (cms.contactEmail) {
    const emailVal = document.getElementById('contact-email-val');
    const emailBtn = document.getElementById('contact-email-copy-btn');
    if (emailVal) emailVal.textContent = cms.contactEmail;
    if (emailBtn) emailBtn.setAttribute('data-copy', cms.contactEmail);
  }
  if (cms.contactWechat) {
    const wxVal = document.getElementById('contact-wechat-val');
    const wxBtn = document.getElementById('contact-wechat-copy-btn');
    if (wxVal) wxVal.textContent = cms.contactWechat;
    if (wxBtn) wxBtn.setAttribute('data-copy', cms.contactWechat);
  }
  if (cms.contactHours) {
    const hrVal = document.getElementById('contact-hours-val');
    if (hrVal) hrVal.textContent = cms.contactHours;
  }

  const cmsAnnBar = document.querySelector('.ride-announcement-bar');
  if (cmsAnnBar) {
    if (cms.announcementBg && /^#[0-9a-fA-F]{6}$/.test(cms.announcementBg)) {
      cmsAnnBar.style.backgroundColor = cms.announcementBg;
    }
    if (cms.announcementColor && /^#[0-9a-fA-F]{6}$/.test(cms.announcementColor)) {
      cmsAnnBar.style.color = cms.announcementColor;
    }
    const rawLink = String(cms.announcementLink || '').trim();
    const safeLink = rawLink.startsWith('#') ? rawLink : (typeof safeExternalUrl === 'function' ? safeExternalUrl(rawLink) : '');
    if (safeLink) {
      cmsAnnBar.style.cursor = 'pointer';
      cmsAnnBar.onclick = () => {
        if (safeLink.startsWith('#')) {
          const target = document.querySelector(safeLink);
          if (target) target.scrollIntoView({ behavior: 'smooth' });
        } else {
          window.open(safeLink, '_blank', 'noopener,noreferrer');
        }
      };
    } else {
      cmsAnnBar.style.cursor = '';
      cmsAnnBar.onclick = null;
    }
  }

  const heroSubEl = document.getElementById('hero-subtitle');
  if (heroSubEl) {
    if (cms.heroSubtitle) {
      heroSubEl.textContent = cms.heroSubtitle;
      heroSubEl.style.display = 'block';
    } else {
      heroSubEl.textContent = '';
      heroSubEl.style.display = 'none';
    }
  }
  if (cms.heroOverlay !== undefined && !isNaN(Number(cms.heroOverlay))) {
    const alpha = Math.min(0.85, Math.max(0, Number(cms.heroOverlay) / 100));
    document.documentElement.style.setProperty('--hero-overlay-alpha', String(alpha));
  }
  document.body.dataset.heroAlign = cms.heroAlign || 'center';

  // 7. 页脚版权、ICP 备案号 & 客服/售后保障弹窗自定义正文
  const copyEl = document.querySelector('.footer-copyright, .ride-footer-copy');
  if (copyEl && cms.footerCopyright) copyEl.textContent = cms.footerCopyright;
  const icpEl = document.getElementById('footer-icp-link');
  if (icpEl) {
    if (cms.footerIcp) {
      icpEl.textContent = cms.footerIcp;
      const safeIcpUrl = typeof safeExternalUrl === 'function' ? safeExternalUrl(cms.footerIcpUrl) : '';
      icpEl.href = safeIcpUrl || 'https://beian.miit.gov.cn/';
      icpEl.style.display = 'inline-block';
    } else {
      icpEl.style.display = 'none';
    }
  }
  if (cms.policySupportText) {
    const supBody = document.querySelector('#support-modal .modal-body, #support-modal p');
    if (supBody) supBody.textContent = cms.policySupportText;
  }
  if (cms.policyWarrantyText) {
    const warBody = document.querySelector('#warranty-modal .modal-body, #warranty-modal p');
    if (warBody) warBody.textContent = cms.policyWarrantyText;
  }
};

window.applyFullCmsTheme();


// ==========================================
// 布局引擎前端接管 + 跨标签页实时自动同步（改完后台前台秒刷新）
// ==========================================
window.applyCmsLayoutAndNav = function() {
  const cms = readLocalData('auto_shop_cms', {});
  if (!cms || typeof cms !== 'object') return;

  // 1. 首页板块动态排序 (hero, collections, new-arrivals, contact, newsletter)
  const homeView = document.getElementById('home-view');
  if (homeView && Array.isArray(cms.sectionOrder) && cms.sectionOrder.length) {
    const secMap = {
      hero: document.getElementById('minimal-hero'),
      collections: document.getElementById('collection-section'),
      'new-arrivals': document.getElementById('new-arrivals-section'),
      contact: document.getElementById('contact-section'),
      newsletter: document.querySelector('.ride-newsletter-band')
    };
    cms.sectionOrder.forEach(key => {
      const el = secMap[key];
      if (el && el.parentNode === homeView) homeView.appendChild(el);
    });
  }

  // 2. 首页品类入口布局模式 / 商品页列数 / 卡片圆角 / 图片比例 / 字体
  document.body.dataset.catLayout = cms.catLayoutMode || 'staggered';
  document.body.dataset.catalogCols = String(cms.catalogCols || '3');
  document.body.dataset.cardRadius = cms.cardRadius || 'default';
  document.body.dataset.cardAspect = cms.cardAspect || '16/11';
  document.body.dataset.fontStyle = cms.fontStyle || 'modern';

  // 3. 顶部自定义导航菜单渲染
  const navBar = document.querySelector('.ride-center-nav');
  if (navBar) {
    navBar.querySelectorAll('.custom-cms-nav-link').forEach(el => el.remove());
    const customLinks = Array.isArray(cms.customNavLinks) ? cms.customNavLinks : [];
    customLinks.forEach(item => {
      if (!item || !item.label || !item.url) return;
      if (!/^https?:\/\//i.test(item.url) && !item.url.startsWith('#')) return;
      const a = document.createElement('a');
      a.className = 'ride-nav-link custom-cms-nav-link';
      a.textContent = item.label;
      a.href = item.url;
      if (/^https?:\/\//i.test(item.url)) {
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
      }
      navBar.appendChild(a);
    });
  }
};

window.applyCmsLayoutAndNav();

// 跨标签页实时自动同步：商家端在另一标签页保存任意商品/主题/问答后，买家端无需刷新自动同步！
window.addEventListener('storage', (e) => {
  if (!e || !e.key || !e.key.startsWith('auto_shop_')) return;
  if (typeof refreshBuyerAllViews === 'function') refreshBuyerAllViews();
  if (typeof window.applyFullCmsTheme === 'function') window.applyFullCmsTheme();
  if (typeof window.applyCmsLayoutAndNav === 'function') window.applyCmsLayoutAndNav();
});


// ==========================================
// 买家端《用户服务协议》与《隐私政策》弹窗及 CMS/双语同步
// ==========================================
(function initBuyerLegalModals() {
  const termsModal = document.getElementById('terms-modal');
  const privacyModal = document.getElementById('privacy-modal');
  const openTerms = () => { if (termsModal) termsModal.classList.add('active'); };
  const openPrivacy = () => { if (privacyModal) privacyModal.classList.add('active'); };

  ['footer-terms-btn', 'checkout-terms-link'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', openTerms);
  });
  ['footer-privacy-btn', 'checkout-privacy-link'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', openPrivacy);
  });

  const closeT = document.getElementById('close-terms-modal');
  if (closeT && termsModal) closeT.addEventListener('click', () => termsModal.classList.remove('active'));
  const closeP = document.getElementById('close-privacy-modal');
  if (closeP && privacyModal) closeP.addEventListener('click', () => privacyModal.classList.remove('active'));
  if (termsModal) termsModal.addEventListener('click', (e) => { if (e.target === termsModal) termsModal.classList.remove('active'); });
  if (privacyModal) privacyModal.addEventListener('click', (e) => { if (e.target === privacyModal) privacyModal.classList.remove('active'); });

  const syncLegalCopy = () => {
    const cms = readLocalData('auto_shop_cms', {}) || {};
    const tBody = document.getElementById('terms-modal-body');
    const pBody = document.getElementById('privacy-modal-body');
    if (tBody && cms.policyTermsText) tBody.textContent = cms.policyTermsText;
    if (pBody && cms.policyPrivacyText) pBody.textContent = cms.policyPrivacyText;
    const isEn = currentSiteLang === 'en';
    const fTerms = document.getElementById('footer-terms-btn');
    const fPriv = document.getElementById('footer-privacy-btn');
    if (fTerms) fTerms.textContent = isEn ? 'Terms of Service' : '用户服务协议';
    if (fPriv) fPriv.textContent = isEn ? 'Privacy Policy' : '隐私政策';
  };
  syncLegalCopy();

  const prevTheme = window.applyFullCmsTheme;
  window.applyFullCmsTheme = function() {
    if (typeof prevTheme === 'function') prevTheme();
    syncLegalCopy();
  };
  const prevLang = window.applySiteLanguage;
  window.applySiteLanguage = function(lang) {
    if (typeof prevLang === 'function') prevLang(lang);
    syncLegalCopy();
  };
})();


// ==========================================
// 买家端 Pro 主题渲染：Logo/Favicon + 高级配色/按钮/SEO/CSS + 自定义推广板块
// ==========================================
window.applyProCmsExtras = function() {
  const cms = readLocalData('auto_shop_cms', {}) || {};

  // 1. 浏览器标签页 Favicon 动态同步
  const favEl = document.getElementById('site-favicon');
  if (favEl && cms.faviconImg) {
    favEl.href = resolveProductImage(cms.faviconImg);
  }

  // 2. 页眉自定义品牌 Logo 图片
  if (cms.brandLogoImg) {
    const logoUrl = resolveProductImage(cms.brandLogoImg);
    document.querySelectorAll('.brand-wordmark, .ride-brand-logo').forEach(el => {
      el.innerHTML = `<img src="${escapeHTML(logoUrl)}" alt="${escapeHTML(cms.brandName || 'MODFORM')}" style="height:26px; max-width:160px; object-fit:contain; display:block;">`;
    });
  }

  // 3. 页面主背景色、卡片底色与按钮圆角风格
  if (cms.bgColor && /^#[0-9a-fA-F]{6}$/.test(cms.bgColor)) {
    document.documentElement.style.setProperty('--bg-page', cms.bgColor);
    document.body.style.backgroundColor = cms.bgColor;
  }
  if (cms.surfaceColor && /^#[0-9a-fA-F]{6}$/.test(cms.surfaceColor)) {
    document.documentElement.style.setProperty('--bg-card', cms.surfaceColor);
  }
  document.body.dataset.btnStyle = cms.btnStyle || 'rounded';

  // 4. SEO Title & Meta Description
  if (cms.seoTitle) document.title = cms.seoTitle;
  if (cms.seoDesc) {
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', cms.seoDesc);
  }

  // 5. 高级自定义 CSS 注入
  let styleTag = document.getElementById('cms-custom-css-tag');
  if (cms.customCss) {
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'cms-custom-css-tag';
      document.head.appendChild(styleTag);
    }
    styleTag.textContent = cms.customCss;
  } else if (styleTag) {
    styleTag.textContent = '';
  }

  // 6. 渲染商家新增的自定义推广内容板块
  const root = document.getElementById('cms-dynamic-sections-root');
  if (root) {
    const blocks = Array.isArray(cms.customBlocks) ? cms.customBlocks.filter(b => b && b.title) : [];
    root.innerHTML = blocks.map(b => {
      const isNeon = b.theme === 'neon';
      const safeUrl = (b.ctaUrl && (/^https?:\/\//i.test(b.ctaUrl) || b.ctaUrl.startsWith('#'))) ? b.ctaUrl : '';
      return `
        <section style="padding:48px 0; background:${isNeon ? '#d8ff00' : '#15181e'}; color:${isNeon ? '#111318' : '#f3f4f6'}; border-top:1px solid rgba(255,255,255,0.06);">
          <div class="section-container" style="display:flex; justify-content:space-between; align-items:center; gap:20px; flex-wrap:wrap;">
            <div style="max-width:680px;">
              ${b.kicker ? `<span style="font-size:0.72rem; letter-spacing:0.16em; font-weight:800; color:${isNeon ? '#111318' : '#d8ff00'}; display:block; margin-bottom:6px;">${escapeHTML(b.kicker)}</span>` : ''}
              <h2 style="margin:0 0 8px; font-size:1.65rem; color:${isNeon ? '#111318' : '#fff'};">${escapeHTML(b.title)}</h2>
              ${b.desc ? `<p style="margin:0; font-size:0.92rem; opacity:0.86; line-height:1.6;">${escapeHTML(b.desc)}</p>` : ''}
            </div>
            ${b.ctaText && safeUrl ? `<a href="${escapeHTML(safeUrl)}" ${/^https?:\/\//i.test(safeUrl) ? 'target="_blank" rel="noopener noreferrer"' : ''} style="padding:11px 22px; border-radius:999px; font-weight:700; font-size:0.86rem; text-decoration:none; background:${isNeon ? '#111318' : '#d8ff00'}; color:${isNeon ? '#d8ff00' : '#111318'};">${escapeHTML(b.ctaText)} →</a>` : ''}
          </div>
        </section>`;
    }).join('');
  }
};

window.applyProCmsExtras();
const _prevCmsThemePro = window.applyFullCmsTheme;
window.applyFullCmsTheme = function() {
  if (typeof _prevCmsThemePro === 'function') _prevCmsThemePro();
  window.applyProCmsExtras();
};


// ==========================================
// 主页轻提示 Toast、站内确认弹窗、全站深度 EN 英文翻译与自定义页面弹窗
// ==========================================
function showSiteToast(message) {
  const el = document.getElementById('site-toast');
  if (!el) return;
  const text = String(message || '');
  el.textContent = text;
  el.classList.remove('error', 'warn');
  if (/失败|错误|无效|不足|无法|failed|error|invalid/i.test(text)) el.classList.add('error');
  el.classList.add('show');
  clearTimeout(window.__siteToastTimer);
  window.__siteToastTimer = setTimeout(() => el.classList.remove('show'), 3000);
}

function siteConfirm(message) {
  return new Promise((resolve) => {
    const modal = document.getElementById('ui-dialog-modal');
    const titleEl = document.getElementById('ui-dialog-title');
    const msgEl = document.getElementById('ui-dialog-msg');
    const okBtn = document.getElementById('ui-dialog-ok');
    const cancelBtn = document.getElementById('ui-dialog-cancel');
    if (!modal || !okBtn || !cancelBtn) { resolve(true); return; }
    const isEn = typeof currentSiteLang !== 'undefined' && currentSiteLang === 'en';
    titleEl.textContent = isEn ? 'Confirm Action' : '操作确认';
    okBtn.textContent = isEn ? 'Confirm' : '确认';
    cancelBtn.textContent = isEn ? 'Cancel' : '取消';
    msgEl.textContent = String(message || '');
    modal.classList.add('active');
    const cleanup = (val) => {
      modal.classList.remove('active');
      okBtn.onclick = null;
      cancelBtn.onclick = null;
      resolve(val);
    };
    okBtn.onclick = () => cleanup(true);
    cancelBtn.onclick = () => cleanup(false);
  });
}

(function initCustomPageModalAndFullEn() {
  const cpModal = document.getElementById('custom-page-modal');
  const cpClose = document.getElementById('close-custom-page-modal');
  if (cpClose && cpModal) cpClose.addEventListener('click', () => cpModal.classList.remove('active'));
  if (cpModal) cpModal.addEventListener('click', (e) => { if (e.target === cpModal) cpModal.classList.remove('active'); });

  window.openCustomNavPage = function(title, content) {
    const m = document.getElementById('custom-page-modal');
    const t = document.getElementById('custom-page-modal-title');
    const b = document.getElementById('custom-page-modal-body');
    if (!m || !t || !b) return;
    t.textContent = title || 'MODFORM';
    b.textContent = content || '';
    m.classList.add('active');
  };

  // Override custom nav & blocks renderer to support in-site page modals, section jumps, EN labels & block images
  const prevLayout = window.applyCmsLayoutAndNav;
  window.applyCmsLayoutAndNav = function() {
    if (typeof prevLayout === 'function') prevLayout();
    const cms = readLocalData('auto_shop_cms', {}) || {};
    const navBar = document.querySelector('.ride-main-nav');
    if (!navBar) return;
    navBar.querySelectorAll('.cms-custom-nav-item').forEach(el => el.remove());
    const customLinks = Array.isArray(cms.customNavLinks) ? cms.customNavLinks : [];
    const isEn = typeof currentSiteLang !== 'undefined' && currentSiteLang === 'en';
    customLinks.forEach(item => {
      if (!item || !item.label) return;
      const displayLabel = (isEn && item.labelEn) ? item.labelEn : item.label;
      if (item.type === 'page' && item.content) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'ride-nav-link cms-custom-nav-item';
        btn.textContent = displayLabel;
        btn.addEventListener('click', () => window.openCustomNavPage(displayLabel, item.content));
        navBar.appendChild(btn);
      } else if (item.type === 'section' || String(item.url || '').startsWith('#')) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'ride-nav-link cms-custom-nav-item';
        btn.textContent = displayLabel;
        btn.addEventListener('click', () => {
          if (item.url === '#all-products' && typeof openCategoryView === 'function') {
            openCategoryView('all');
          } else {
            const target = document.querySelector(item.url);
            if (target) target.scrollIntoView({ behavior: 'smooth' });
          }
        });
        navBar.appendChild(btn);
      } else if (item.url && /^https?:\/\//i.test(item.url)) {
        const a = document.createElement('a');
        a.className = 'ride-nav-link cms-custom-nav-item';
        a.textContent = displayLabel;
        a.href = item.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        navBar.appendChild(a);
      }
    });
  };

  // Enhance custom blocks with optional image & EN title
  const prevExtra = window.applyCmsExtraFeatures;
  window.applyCmsExtraFeatures = function() {
    if (typeof prevExtra === 'function') prevExtra();
    const cms = readLocalData('auto_shop_cms', {}) || {};
    const root = document.getElementById('cms-dynamic-sections-root');
    if (!root) return;
    const blocks = Array.isArray(cms.customBlocks) ? cms.customBlocks.filter(b => b && b.title) : [];
    const isEn = typeof currentSiteLang !== 'undefined' && currentSiteLang === 'en';
    if (!blocks.length) { root.innerHTML = ''; return; }
    root.innerHTML = blocks.map(b => {
      const isNeon = b.theme === 'neon';
      const title = escapeHTML((isEn && b.titleEn) ? b.titleEn : b.title);
      const kicker = b.kicker ? `<span class="editorial-kicker" style="color:${isNeon ? '#090a0c' : 'var(--neon-lime)'};">${escapeHTML(b.kicker)}</span>` : '';
      const desc = b.desc ? `<p style="margin:8px 0 0; font-size:0.9rem; line-height:1.65; color:${isNeon ? '#1e293b' : '#94a3b8'};">${escapeHTML(b.desc)}</p>` : '';
      const imgHtml = b.image ? `<img class="cms-custom-block-media" src="${escapeHTML(resolveProductImage(b.image))}" alt="${title}" loading="lazy" decoding="async">` : '';
      let ctaHtml = '';
      if (b.ctaText && b.ctaUrl) {
        const safeHref = String(b.ctaUrl).startsWith('#') ? escapeHTML(b.ctaUrl) : escapeHTML(safeExternalUrl(b.ctaUrl) || '#');
        const targetAttr = String(b.ctaUrl).startsWith('http') ? ' target="_blank" rel="noopener noreferrer"' : '';
        ctaHtml = `<div style="margin-top:16px;"><a href="${safeHref}"${targetAttr} class="${isNeon ? 'dark-outline-btn' : 'neon-primary-btn'}" style="text-decoration:none; display:inline-block; padding:9px 18px;">${escapeHTML(b.ctaText)}</a></div>`;
      }
      return `<section class="section-container" style="margin:26px auto;"><div style="padding:26px 28px; border-radius:16px; background:${isNeon ? 'var(--neon-lime, #d8ff00)' : 'var(--bg-card, #14171d)'}; border:1px solid ${isNeon ? 'transparent' : 'rgba(255,255,255,0.09)'}; color:${isNeon ? '#090a0c' : '#fff'};">${imgHtml}${kicker}<h2 style="margin:6px 0 0; font-size:1.45rem;">${title}</h2>${desc}${ctaHtml}</div></section>`;
    }).join('');
  };

  // Comprehensive EN translation layer on top of applySiteLanguage
  const EN_TERMS_BODY = `1. Service & Order Formation
MODFORM provides automotive interior/exterior styling accessories, vehicle fitment tools, online ordering, and after-sales service. Prices, inventory, and shipping fees are calculated authoritatively on our server at checkout.

2. Shipping, Returns & Warranty
In-stock items normally ship within 48 hours of payment confirmation. Unused items in original packaging are eligible for 7-day hassle-free returns; transit damage or incorrect shipments are covered at our expense.

3. Account Security & Fair Use
Users must safeguard login credentials and may not attempt automated scraping, price tampering, or fraudulent orders.

4. Liability & Governing Law
In the event of force majeure delays, MODFORM will promptly notify affected customers to coordinate rescheduling or full refunds.`;

  const EN_PRIVACY_BODY = `1. Information We Collect
We collect recipient name, phone number, and delivery address strictly for order fulfillment, shipping updates, and after-sales support. Saved vehicle profiles and inquiries are used solely for fitment matching and customer assistance. Payment card details are never stored on our servers.

2. Data Protection
We use encrypted transport, PBKDF2 password hashing, strict access isolation, and data minimization to safeguard your personal information. We never sell personal data to third parties.

3. Your Rights
You may view, update, or request deletion of your account, vehicle garage, or newsletter subscription at any time via our Contact section.`;

  const origApplyLang = window.applySiteLanguage;
  window.applySiteLanguage = function(lang) {
    if (typeof origApplyLang === 'function') origApplyLang(lang);
    const isEn = currentSiteLang === 'en';
    const cms = readLocalData('auto_shop_cms', {}) || {};

    // Announcement bar
    const annEl = document.getElementById('site-announcement-text');
    if (annEl) {
      if (isEn) {
        if (!annEl.dataset.zhHtml) annEl.dataset.zhHtml = annEl.innerHTML;
        annEl.textContent = cms.announcementEn || 'Free SF Express shipping over ¥99 · 7-day hassle-free returns';
      } else if (annEl.dataset.zhHtml) {
        annEl.innerHTML = annEl.dataset.zhHtml;
      }
    }

    const setT = (sel, zh, en) => {
      const el = typeof sel === 'string' && sel.startsWith('#') ? document.querySelector(sel) : document.querySelector(sel);
      if (el) el.textContent = isEn ? en : zh;
    };
    const setAll = (sel, pairs) => {
      const els = document.querySelectorAll(sel);
      pairs.forEach(([zh, en], i) => { if (els[i]) els[i].textContent = isEn ? en : zh; });
    };

    // Skip link & Hero
    setT('.skip-link', '跳到主要内容', 'Skip to main content');
    setT('#new-arrivals-title', cms.newArrivalsTitle || '新品首推', 'New Arrivals');

    // Contact card labels & hours
    setAll('#contact-section .contact-card-label', [
      ['官方邮箱 EMAIL', 'OFFICIAL EMAIL'],
      ['官方客服微信 WECHAT', 'OFFICIAL WECHAT'],
      ['服务时间 HOURS', 'SERVICE HOURS']
    ]);
    const hrVal = document.getElementById('contact-hours-val');
    if (hrVal && (!cms.contactHours || cms.contactHours.includes('每日'))) {
      hrVal.textContent = isEn ? 'Daily 09:30 – 22:00' : (cms.contactHours || '每日 09:30 – 22:00');
    }

    // Footer buttons & status
    setT('#footer-service-btn', '车品顾问客服', 'Customer Support');
    setT('#footer-policy-btn', '退换货与安装保障', 'Returns & Warranty');
    setT('#footer-terms-btn', '用户服务协议', 'Terms of Service');
    setT('#footer-privacy-btn', '隐私政策', 'Privacy Policy');
    setT('#footer-sync-status', '实时服务状态', 'Live Service');

    // Cart drawer
    setT('#cart-drawer .drawer-header h3', '购物袋', 'Shopping Bag');
    setT('#clear-cart-btn', '清空', 'Clear');
    setT('#checkout-btn', '去结算', 'Checkout');

    // Checkout view
    setT('#checkout-modal-title', '确认订单信息', 'Confirm Your Order');
    setT('#submit-order-btn', '确认并提交订单', 'Place Order');
    const payDisc = document.querySelector('.payment-disclaimer');
    if (payDisc) {
      if (isEn) {
        if (!payDisc.dataset.zhHtml) payDisc.dataset.zhHtml = payDisc.innerHTML;
        payDisc.innerHTML = 'Submitting locks inventory for 30 minutes. By placing an order you agree to our <button type="button" class="inline-legal-link" id="checkout-terms-link" style="background:none;border:none;color:var(--neon-lime);cursor:pointer;padding:0;text-decoration:underline;">Terms of Service</button> &amp; <button type="button" class="inline-legal-link" id="checkout-privacy-link" style="background:none;border:none;color:var(--neon-lime);cursor:pointer;padding:0;text-decoration:underline;">Privacy Policy</button>.';
      } else if (payDisc.dataset.zhHtml) {
        payDisc.innerHTML = payDisc.dataset.zhHtml;
      }
      document.getElementById('checkout-terms-link')?.addEventListener('click', () => document.getElementById('terms-modal')?.classList.add('active'));
      document.getElementById('checkout-privacy-link')?.addEventListener('click', () => document.getElementById('privacy-modal')?.classList.add('active'));
    }

    // Sort dropdown options
    const sortSel = document.getElementById('sort-select');
    if (sortSel && sortSel.options.length >= 4) {
      const enOpts = ['Featured', 'Price: Low to High', 'Price: High to Low', 'Top Rated'];
      const zhOpts = ['综合推荐排序', '价格从低到高', '价格从高到低', '好评率最高'];
      for (let i = 0; i < 4; i++) sortSel.options[i].textContent = isEn ? enOpts[i] : zhOpts[i];
    }

    // Legal modals
    setT('#terms-modal-title', '用户服务协议 · Terms of Service', 'Terms of Service');
    setT('#privacy-modal-title', '隐私政策 · Privacy Policy', 'Privacy Policy');
    const tBody = document.getElementById('terms-modal-body');
    const pBody = document.getElementById('privacy-modal-body');
    if (tBody) {
      if (!tBody.dataset.zhText) tBody.dataset.zhText = tBody.textContent;
      tBody.textContent = isEn ? EN_TERMS_BODY : (cms.policyTermsText || tBody.dataset.zhText);
    }
    if (pBody) {
      if (!pBody.dataset.zhText) pBody.dataset.zhText = pBody.textContent;
      pBody.textContent = isEn ? EN_PRIVACY_BODY : (cms.policyPrivacyText || pBody.dataset.zhText);
    }

    // Garage & Auth & Orders modal headings
    setT('#garage-modal .modal-title', '我的爱车车库（精准防错适配）', 'My Vehicle Garage (Fitment Match)');
    setT('#auth-modal .modal-title', 'MODFORM 车主账号', 'MODFORM Account');
    setT('#orders-modal .modal-title', '我的订单与售后中心', 'My Orders & Returns');
    setT('#support-modal .modal-title', 'MODFORM 车品顾问客服', 'MODFORM Customer Support');
    setT('#warranty-modal .modal-title', '退换货与无损安装保障', 'Returns & Fitment Warranty');

    // Re-render dynamic nav & custom blocks in active language
    if (typeof window.applyCmsLayoutAndNav === 'function') window.applyCmsLayoutAndNav();
    if (typeof window.applyCmsExtraFeatures === 'function') window.applyCmsExtraFeatures();
  };

  window.applySiteLanguage(currentSiteLang);
})();


// ==========================================
// 全站无死角中英双语翻译引擎（覆盖静态节点、动态渲染、弹窗、结账、订单、移动端导航与占位提示）
// ==========================================
(function initExhaustiveBilingualEngine() {
  const EXACT_ZH_TO_EN = {
    '跳到主要内容': 'Skip to main content',
    '首页': 'Home',
    '车品目录': 'Catalog',
    '全部商品': 'All Products',
    '内饰美学': 'Interior',
    '外观升级': 'Exterior',
    '车载储物': 'Storage',
    '车载香薰': 'Fragrance',
    '搜索汽车用品': 'Search Accessories',
    '新品首推 NEW DROP': 'NEW DROP',
    '我的爱车': 'My Vehicle',
    '浏览全部车品': 'Shop All',
    '款商品': 'items',
    '新品首推': 'New Arrivals',
    '查看全部车品': 'View All',
    'Contact · 联系我们': 'Contact Us',
    '车型适配核验、批量定制采购或售后安装协助，MODFORM 专属车品顾问为您提供一对一响应。': 'Need fitment verification, bulk orders, or installation help? Our MODFORM specialists are here for you.',
    '官方邮箱 EMAIL': 'OFFICIAL EMAIL',
    '复制邮箱': 'Copy Email',
    '官方客服微信 WECHAT': 'OFFICIAL WECHAT',
    '复制微信号': 'Copy WeChat',
    '服务时间 HOURS': 'SERVICE HOURS',
    '每日 09:30 – 22:00': 'Daily 09:30 – 22:00',
    '工作日 & 周末均在线': 'Online daily, weekdays & weekends',
    '快速留言咨询': 'Quick Inquiry',
    '留下您的车型与需求，顾问将在 2 小时内回复。': 'Share your vehicle and request — we reply within 2 hours.',
    '发送留言 →': 'Send Message →',
    '订阅我们的邮件 · SUBSCRIBE TO OUR EMAILS': 'SUBSCRIBE TO OUR EMAILS',
    '第一时间获取 MODFORM 限量车品套装与车主专属优惠。': 'Be the first to hear about limited MODFORM drops and member offers.',
    '← 返回首页': '← Back to Home',
    '仅看有货': 'In Stock Only',
    '价格区间筛选': 'Price Range',
    '全部价格': 'All Prices',
    '¥50 以下': 'Under ¥50',
    '¥100 以上': 'Over ¥100',
    '商品排序方式': 'Sort By',
    '销量：从高到低': 'Best Selling',
    '价格：从低到高': 'Price: Low to High',
    '价格：从高到低': 'Price: High to Low',
    '切换品类浏览': 'Switch Category',
    '← 返回当前类目': '← Back to Category',
    '首页 / 类目 / 商品详情': 'Home / Category / Product Detail',
    '🔗 复制商品直达链接': '🔗 Copy Product Link',
    '← 返回继续购物': '← Continue Shopping',
    '首页 / 结账中心': 'Home / Checkout',
    '✓ 收货地址自动记忆': '✓ Address Auto-Saved',
    '确认订单信息': 'Confirm Your Order',
    '1. 收货人及配送地址': '1. Recipient & Shipping Address',
    '收货人姓名 *': 'Full Name *',
    '手机号码 *': 'Phone Number *',
    '所在地区（全国省 / 市 / 旗县区 / 直辖市）*': 'Region (Province / City / District) *',
    '选择省份/直辖市': 'Select Province',
    '选择城市/辖区': 'Select City',
    '选择区/县/旗': 'Select District',
    '街道小区及详细门牌号 *': 'Street Address & Apt / Unit *',
    '适配车型与订单备注': 'Vehicle Fitment & Order Note',
    '2. 选择快递公司': '2. Shipping Method',
    '顺丰标快': 'SF Express Standard',
    '预计 2-3 天送达 · 满 ¥99 包邮': 'Est. 2–3 days · Free over ¥99',
    '免费': 'Free',
    '中通快递': 'ZTO Express',
    '预计 2-4 天送达 · 全国通达': 'Est. 2–4 days · Nationwide',
    '圆通速递': 'YTO Express',
    '预计 2-4 天送达 · 经济实惠': 'Est. 2–4 days · Economy',
    '极速达（顺丰次日/同城加急）': 'Priority Express (Next-Day)',
    '仓库优先出库 · 极速专线直达': 'Priority warehouse dispatch',
    '⚡ 您已选择「极速达」加急配送': '⚡ Priority Express Selected',
    '将额外收取 ¥15.0 加急运费并安排仓库优先打包发出，请点击右侧按钮确认后提交订单。': 'An extra ¥15.0 express fee applies for priority dispatch. Click confirm on the right before submitting.',
    '确认使用极速达': 'Confirm Priority',
    '3. 订单商品清单': '3. Order Summary',
    '应用': 'Apply',
    '商品小计': 'Subtotal',
    '优惠减免': 'Discount',
    '4. 选择支付方式': '4. Payment Method',
    '微信支付': 'WeChat Pay',
    '支付宝': 'Alipay',
    '在线银行卡 / Stripe': 'Card / Stripe',
    '应付总额': 'Total Due',
    '请打开微信扫一扫完成付款': 'Scan with WeChat to complete payment',
    '在线银行卡 / Stripe 收银台：点击下方链接完成支付或使用扫码支付。': 'Card / Stripe Checkout: click below to pay online or scan QR.',
    '暂未配置在线收银链接': 'Online checkout link not configured',
    '《用户服务协议》': 'Terms of Service',
    '与': '&',
    '《隐私政策》': 'Privacy Policy',
    '确认提交订单': 'Place Order',
    '订单已提交，库存已锁定': 'Order Submitted · Inventory Reserved',
    '请在 30 分钟内完成扫码或在线付款。支付成功后，系统将通过支付网关验签回调或商家后台核验自动更新订单状态：': 'Please complete payment within 30 minutes. Order status updates automatically once payment is verified:',
    '复制订单凭证': 'Copy Order Receipt',
    '返回商店': 'Back to Store',
    '车品顾问客服': 'Customer Support',
    '退换货与安装保障': 'Returns & Warranty',
    '用户服务协议': 'Terms of Service',
    '隐私政策': 'Privacy Policy',
    '实时服务状态': 'Live Service',
    '我的购物袋': 'Shopping Bag',
    '清空': 'Clear',
    '满 ¥99 享顺丰包邮': 'Free SF Express shipping over ¥99',
    '全选': 'Select All',
    '升级组合套餐立减': 'Bundle Savings',
    '优惠码减免': 'Promo Discount',
    '实付合计': 'Total',
    '前往结账': 'Checkout',
    '我的心愿单': 'Wishlist',
    '账号登录': 'Sign In',
    '新用户注册': 'Create Account',
    '手机号 / 用户名': 'Phone / Username',
    '密码': 'Password',
    '登录': 'Sign In',
    '车主昵称 *': 'Display Name *',
    '手机号 *': 'Phone Number *',
    '设置密码 *': 'Password *',
    '创建账号并登录': 'Create Account & Sign In',
    '车主中心': 'Member Center',
    '当前登录：': 'Signed in as: ',
    '默认收货人': 'Default Recipient',
    '默认联系电话': 'Default Phone',
    '默认收货地址': 'Default Shipping Address',
    '保存默认地址': 'Save Default Address',
    '退出登录': 'Sign Out',
    '我的订单、物流与售后服务': 'My Orders, Tracking & Returns',
    '全部': 'All',
    '待付款': 'Unpaid',
    '待发货': 'Processing',
    '已发货': 'Shipped',
    '售后中': 'Returns',
    '服务端查单': 'Track Order',
    '实时快递物流与订单轨迹': 'Live Shipment Tracking',
    '申请售后 / 退换货服务': 'Request Return / Exchange',
    '关联订单编号': 'Order Number',
    '售后服务类型 *': 'Request Type *',
    '退货退款（7天无理由 / 退回商品并退款）': 'Return & Refund (7-Day Hassle-Free)',
    '换货补发（尺寸不合 / 运输破损免费换新）': 'Exchange / Replacement (Fitment or Transit Damage)',
    '仅退款（未收到货 / 协商一致仅退款）': 'Refund Only (Not Received / Agreed)',
    '售后原因与问题描述 *': 'Reason & Description *',
    '寄回快递单号（选填，若已寄回请填写）': 'Return Tracking Number (Optional)',
    '上传实拍凭证照片（选填，破损或安装问题照片）': 'Upload Photo Proof (Optional)',
    '提交售后申请': 'Submit Request',
    '车品顾问与购物保障': 'Support & Shopping Guarantee',
    '商品': 'Shop',
    '分类': 'Categories',
    '车型': 'Vehicle',
    '订单': 'Orders',
    '我的爱车 · 精准车型匹配': 'My Vehicle · Precision Fitment',
    '选择您的爱车品牌、年份与型号，支持保存多辆爱车一键切换。': 'Select your make, year, and model to filter compatible products.',
    '1. 汽车品牌': '1. Vehicle Make',
    '选择汽车品牌': 'Select Make',
    '2. 车辆年份': '2. Model Year',
    '选择车辆年份': 'Select Year',
    '3. 具体型号': '3. Model',
    '先选品牌与年份': 'Select Make & Year First',
    '确认': 'Confirm',
    '清除车型': 'Clear Vehicle',
    '品牌专题': 'Featured Story',
    '操作确认': 'Confirm Action',
    '取消': 'Cancel',
    '加入购物袋': 'Add to Bag',
    '立即购买': 'Buy Now',
    '商品详情': 'Product Details',
    '车友评价': 'Customer Reviews',
    '车友问答': 'Q&A',
    '暂无商品，敬请期待新品上架': 'No products yet — new drops coming soon.',
    '购物袋还是空的': 'Your shopping bag is empty',
    '心愿单暂无收藏商品': 'Your wishlist is empty',
    '暂无订单记录': 'No orders yet',
    '待核验收款': 'Awaiting Payment Verification',
    '已付款·待发货': 'Paid · Preparing Shipment',
    '已完成': 'Completed',
    '已取消': 'Cancelled',
    '已退款': 'Refunded',
    '免运费': 'Free Shipping',
    '全场满 ¥99 顺丰包邮 · 支持 7 天无理由退换保障': 'Free SF Express over ¥99 · 7-Day Hassle-Free Returns',
    '提交订单后将为您锁定对应商品库存，请在 30 分钟内完成付款。提交即表示您同意': 'Submitting reserves inventory for 30 minutes. By placing an order you agree to our'
  };

  const ATTR_ZH_TO_EN = {
    '请输入真实姓名': 'Enter full name',
    '11位手机号': 'Phone number',
    '如：XX街道XX花园3栋502室': 'Street, building, apt / unit',
    '如：2026款大众途观L、放丰巢柜': 'e.g. 2025 Xiaomi SU7, leave at front desk',
    '输入优惠码（选填）': 'Promo code (optional)',
    '输入优惠码（选填）': 'Promo code (optional)',
    '请输入账号或手机号': 'Phone or username',
    '请输入密码': 'Enter password',
    '例如：陈先生': 'e.g. Alex Chen',
    '用于登录及查询订单物流': 'Used for sign-in and order tracking',
    '请设置至少 6 位登录密码': 'At least 6 characters',
    '结账时将自动填入': 'Auto-filled at checkout',
    '省 / 市 / 区县旗 / 详细门牌号': 'Province / City / District / Street',
    '在本机订单中按手机号 / AT 订单号筛选...': 'Filter by phone or order ID...',
    '跨设备查单：输入 AT 订单号': 'Order ID (starts with AT...)',
    '下单 11 位手机号': 'Order phone number',
    '请简述原因，例如：拍错车型年份需要更换...': 'Briefly describe your return or exchange reason...',
    '例如：SF987654321': 'e.g. SF987654321',
    '搜索商品': 'Search products',
    '我的订单': 'My Orders',
    '我的收藏': 'Wishlist',
    '登录 / 车主中心': 'Account',
    '购物袋': 'Shopping Bag',
    '返回顶部': 'Back to top'
  };

  const origTextMap = new WeakMap();
  const origAttrMap = new WeakMap();

  function translateTextString(raw) {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    if (EXACT_ZH_TO_EN[trimmed]) {
      return raw.replace(trimmed, EXACT_ZH_TO_EN[trimmed]);
    }
    // Dynamic pattern translations
    let m;
    if ((m = trimmed.match(/^共\s*(\d+)\s*件商品$/))) return raw.replace(trimmed, `${m[1]} items`);
    if ((m = trimmed.match(/^批量删除\s*\((\d+)\)$/))) return raw.replace(trimmed, `Delete Selected (${m[1]})`);
    if ((m = trimmed.match(/^(\d+)\s*款商品$/))) return raw.replace(trimmed, `${m[1]} items`);
    if ((m = trimmed.match(/^配送方式（(.+?)）$/))) return raw.replace(trimmed, `Shipping (${EXACT_ZH_TO_EN[m[1]] || m[1]})`);
    if ((m = trimmed.match(/^配送方式（$/))) return raw.replace(trimmed, 'Shipping (');
    if ((m = trimmed.match(/^(内饰美学|外观升级|车载储物|车载香薰|全部商品)\s*\($/))) {
      return raw.replace(trimmed, `${EXACT_ZH_TO_EN[m[1]]} (`);
    }
    return null;
  }

  function walkAndTranslate(root, isEn) {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    let node;
    while ((node = walker.nextNode())) {
      const parent = node.parentElement;
      if (!parent || parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE' || parent.id === 'lang-toggle-btn') continue;
      if (isEn) {
        if (!origTextMap.has(node)) origTextMap.set(node, node.nodeValue);
        const src = origTextMap.get(node);
        const en = translateTextString(src);
        if (en && node.nodeValue !== en) node.nodeValue = en;
      } else if (origTextMap.has(node)) {
        const orig = origTextMap.get(node);
        if (node.nodeValue !== orig) node.nodeValue = orig;
      }
    }

    const els = root.querySelectorAll ? root.querySelectorAll('input, textarea, button, a, select, option') : [];
    els.forEach(el => {
      if (el.id === 'lang-toggle-btn') return;
      ['placeholder', 'title'].forEach(attr => {
        const val = el.getAttribute(attr);
        if (!val) return;
        let rec = origAttrMap.get(el);
        if (!rec) { rec = {}; origAttrMap.set(el, rec); }
        if (isEn) {
          if (!(attr in rec)) rec[attr] = val;
          const en = ATTR_ZH_TO_EN[rec[attr]] || EXACT_ZH_TO_EN[rec[attr]];
          if (en && val !== en) el.setAttribute(attr, en);
        } else if (attr in rec) {
          if (val !== rec[attr]) el.setAttribute(attr, rec[attr]);
        }
      });
    });
  }

  let translating = false;
  function runFullTranslation() {
    if (translating) return;
    translating = true;
    try {
      walkAndTranslate(document.body, currentSiteLang === 'en');
    } finally {
      translating = false;
    }
  }

  const prevApply = window.applySiteLanguage;
  window.applySiteLanguage = function(lang) {
    if (typeof prevApply === 'function') prevApply(lang);
    runFullTranslation();
  };

  // Auto-translate dynamically rendered DOM (cart items, orders, product detail, search results) when in EN mode
  const observer = new MutationObserver(() => {
    if (currentSiteLang === 'en' && !translating) {
      runFullTranslation();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  if (currentSiteLang === 'en') runFullTranslation();
})();
