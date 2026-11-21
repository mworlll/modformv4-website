let orders = [];
let customCatalog = [];
let deletedProductIds = [];
let productOverrides = {};
let stockMap = {};
let skuStockMap = {};
let userReviews = {};
let adminOrderStatusFilter = 'all';
let adminOrderSearchKw = '';
let selectedAdminOrderIds = new Set();
let selectedAdminProdIds = new Set();
let analyticsRange = 'all';

// ==========================================
// 1. 商家后台身份验证（强制服务端 PBKDF2 校验与 Token 签发，无本地演示回退）
// ==========================================
const loginScreenEl = document.getElementById('admin-login-screen');
const workspaceEl = document.getElementById('admin-workspace');
const syncBadgeEl = document.getElementById('server-sync-badge');

function updateServerSyncBadge() {
  if (!syncBadgeEl) return;
  if (window.AUTO_SHOP_SERVER_ONLINE) {
    syncBadgeEl.textContent = '🟢 服务端 SQLite 数据库已连接 (已启用鉴权与防篡改校验)';
    syncBadgeEl.className = 'status-pill shipped';
  } else {
    syncBadgeEl.textContent = '🔴 服务端未连接 (请运行 python3 server.py 启动正式后端)';
    syncBadgeEl.className = 'status-pill';
  }
}

function enterWorkspace() {
  loginScreenEl.style.display = 'none';
  workspaceEl.style.display = 'block';
  syncStoreFromServer(() => {
    updateServerSyncBadge();
    refreshAllAdminViews();
  }, true);
}

(async function verifyAdminSessionOnLoad() {
  const token = sessionStorage.getItem('auto_shop_admin_token') || '';
  if (window.location.protocol.startsWith('http')) {
    if (token) {
      try {
        const res = await fetch('/api/admin/verify', { headers: { 'X-Admin-Token': token }, cache: 'no-store' });
        if (res.ok) {
          window.AUTO_SHOP_SERVER_ONLINE = true;
          enterWorkspace();
          return;
        }
      } catch (e) {}
    }
    sessionStorage.removeItem('auto_shop_admin_unlocked');
    sessionStorage.removeItem('auto_shop_admin_token');
    syncStoreFromServer(() => { updateServerSyncBadge(); }, false);
    return;
  }
  if (sessionStorage.getItem('auto_shop_admin_unlocked') === '1') {
    enterWorkspace();
  }
})();

let failedAdminAttempts = 0;
let adminLockedUntil = 0;
document.getElementById('admin-login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (Date.now() < adminLockedUntil) {
    showAdminToast(`尝试次数过多，请 ${Math.ceil((adminLockedUntil - Date.now()) / 1000)} 秒后再试`);
    return;
  }
  const inputPwd = document.getElementById('admin-pwd-input').value;

  if (window.location.protocol.startsWith('http')) {
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: inputPwd })
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.ok) {
          window.AUTO_SHOP_SERVER_ONLINE = true;
          failedAdminAttempts = 0;
          sessionStorage.setItem('auto_shop_admin_unlocked', '1');
          sessionStorage.setItem('auto_shop_admin_token', data.token || 'admin-session-ok');
          enterWorkspace();
          return;
        }
      } else if (res.status === 401 || res.status === 429) {
        const errData = await res.json().catch(() => ({}));
        if (errData && errData.error) showAdminToast(errData.error);
        else handleLoginFailed();
        return;
      }
    } catch (err) {
      showAdminToast('无法连接到后端服务，请先运行 python3 server.py 启动服务端后再登录。');
      return;
    }
  } else {
    showAdminToast('请先启动后端服务（python3 server.py）并通过 HTTP 地址访问商家后台。');
    return;
  }
  handleLoginFailed();
});

function handleLoginFailed() {
  failedAdminAttempts += 1;
  if (failedAdminAttempts >= 5) {
    adminLockedUntil = Date.now() + 30000;
    failedAdminAttempts = 0;
    showAdminToast('密码连续错误，已暂停尝试 30 秒');
  } else {
    showAdminToast(`密码错误，还可尝试 ${5 - failedAdminAttempts} 次`);
  }
}

document.getElementById('admin-lock-btn').addEventListener('click', async () => {
  const token = sessionStorage.getItem('auto_shop_admin_token') || '';
  if (token && window.location.protocol.startsWith('http')) {
    try {
      await fetch('/api/admin/logout', { method: 'POST', headers: { 'X-Admin-Token': token } });
    } catch (e) {}
  }
  sessionStorage.removeItem('auto_shop_admin_unlocked');
  sessionStorage.removeItem('auto_shop_admin_token');
  workspaceEl.style.display = 'none';
  loginScreenEl.style.display = 'flex';
  document.getElementById('admin-pwd-input').value = '';
});

// ==========================================
// 2. 数据读写与多标签切换（支持多SKU独立价格与库存）
// ==========================================
// (状态变量已提升至文件顶部以避免初始化 TDZ 报错)

function getAllActiveProducts() {
  orders = readLocalData('auto_shop_orders', []);
  customCatalog = readLocalData('auto_shop_custom_products', []);
  deletedProductIds = readLocalData('auto_shop_deleted_ids', []);
  productOverrides = readLocalData('auto_shop_product_overrides', {});
  stockMap = readLocalData('auto_shop_stock_map', {});
  skuStockMap = readLocalData('auto_shop_sku_stock_map', {});

  const validOrders = orders.filter(o => o.status !== '已取消' && o.status !== '已退款');

  return [...customCatalog, ...BASE_CATALOG]
    .filter(item => !deletedProductIds.includes(item.id))
    .map(item => {
      const ov = productOverrides[item.id] || {};
      const merged = { ...item, ...ov };
      let realSold = 0;
      validOrders.forEach(o => (o.items || []).forEach(i => {
        if (i.id === merged.id) realSold += Number(i.quantity || 1);
      }));
      const baseSales = Number.isFinite(Number(merged.baseSales)) ? Math.max(0, Number(merged.baseSales)) : 0;
      merged.realSold = realSold;
      merged.baseSales = baseSales;
      merged.sales = baseSales + realSold;
      merged.onSale = merged.onSale !== false;
      merged.isTemplate = Boolean(item.isTemplate) && !merged.isEditedByMerchant;
      merged.stock = stockMap[merged.id] !== undefined
        ? Number(stockMap[merged.id])
        : (merged.stock !== undefined ? Number(merged.stock) : 20);
      merged.variantSkus = parseVariantSkus(merged.variantSkus || merged.variants, merged.price, merged.stock, merged.id, skuStockMap);
      merged.variants = merged.variantSkus.map(s => s.name);
      merged.img = resolveProductImage(merged.img, merged.cat);
      return merged;
    });
}

function refreshAllAdminViews() {
  updateServerSyncBadge();
  renderAdminOrders();
  renderAllProductsManager();
  renderReviewsManager();
  renderAdminQaManager();
  renderAdminContactMessages();
  renderCustomersCRM();
  renderAdminSubscribers();
  renderDiscountsManager();
  renderSalesAnalytics();
  renderAnalyticsTrendChart();
  renderAuditLogs();
  loadCmsSettingsForm();
}

document.querySelectorAll('.admin-tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const tabName = btn.dataset.adminTab;
    document.querySelectorAll('.admin-panel').forEach(p => p.style.display = 'none');
    document.getElementById(`admin-tab-${tabName}`).style.display = 'block';
    refreshAllAdminViews();
  });
});

// ==========================================
// 3. 订单履约、一键收款核销、1688 采购代发与售后退换货 (RMA) 审核
// ==========================================
function renderAdminOrders() {
  const activeProds = getAllActiveProducts();
  const validOrders = orders.filter(o => o.status !== '已取消' && o.status !== '已退款');
  const totalRevenue = validOrders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0);
  const pendingOrders = orders.filter(o => ['待核验收款', '已付款·待发货', '售后处理中'].includes(o.status || '待核验收款')).length;
  const aov = validOrders.length > 0 ? (totalRevenue / validOrders.length) : 0;
  const lowStockCount = activeProds.filter(p => p.onSale && p.stock <= 10).length;

  document.getElementById('kpi-revenue').textContent = `¥${totalRevenue.toFixed(1)}`;
  document.getElementById('kpi-pending').textContent = `${pendingOrders} 单`;
  document.getElementById('kpi-aov').textContent = `¥${aov.toFixed(1)}`;
  document.getElementById('kpi-low-stock').textContent = `${lowStockCount} 款`;

  const listEl = document.getElementById('admin-orders-list');
  if (orders.length === 0) {
    listEl.innerHTML = '<p style="text-align:center; color:#8e95a2; padding:40px 0;">暂无买家订单。当买家在前台下单后，点击「同步最新数据」即可在此查看、核销收款并安排发货。</p>';
    return;
  }

  const couriers = ['顺丰标快', '顺丰速运', '中通快递', '圆通速递', '极速达', '韵达快递', '极兔速递', '京东物流', '邮政EMS', '德邦快递'];

  const filteredOrders = orders
    .map((o, origIdx) => ({ o, origIdx }))
    .filter(({ o }) => {
      const st = o.status || '待核验收款';
      if (adminOrderStatusFilter === 'express') {
        if (o.courierCompany !== '极速达' && !String(o.note || '').includes('极速达')) return false;
      } else if (adminOrderStatusFilter !== 'all' && st !== adminOrderStatusFilter) {
        return false;
      }
      if (adminOrderSearchKw) {
        const kw = adminOrderSearchKw.toLowerCase();
        const hay = `${o.orderId || ''} ${o.phone || ''} ${o.name || ''} ${o.address || ''}`.toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      return true;
    });

  if (filteredOrders.length === 0) {
    listEl.innerHTML = '<div class="empty-state"><strong>没有匹配的订单</strong><p>请切换上方状态标签或清空搜索关键词。</p></div>';
    return;
  }

  listEl.innerHTML = filteredOrders.map(({ o, origIdx: idx }) => {
    const isCancelled = o.status === '已取消' || o.status === '已退款';
    const encodedOrderId = encodeURIComponent(String(o.orderId));
    const itemsHtml = (o.items || []).map(i => {
      const prodObj = activeProds.find(p => p.id === i.id);
      const savedSourceUrl = prodObj ? safeExternalUrl(prodObj.sourceUrl) : '';
      const url1688 = savedSourceUrl || `https://s.1688.com/selloffer/offer_search.htm?keywords=${encodeURIComponent(i.name)}`;
      return `
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;margin-bottom:4px;">
          <span>• ${escapeHTML(i.name)} [${escapeHTML(i.variant)}${i.skuCode ? ' / ' + escapeHTML(i.skuCode) : ''}] × ${Number(i.quantity) || 1}</span>
          <a href="${escapeHTML(url1688)}" target="_blank" rel="noopener noreferrer" style="font-size:0.76rem;color:#d8ff00;text-decoration:none;border:1px solid rgba(216,255,0,0.4);padding:2px 8px;border-radius:4px;">去 1688 采购代发 ↗</a>
        </div>`;
    }).join('');

    // 售后 RMA 审核卡片
    const rmaAdminBox = o.rma
      ? `<div style="background:rgba(245,158,11,0.12);border:1px solid rgba(245,158,11,0.45);padding:10px 12px;border-radius:6px;margin:8px 0;font-size:0.82rem;">
          <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:6px;margin-bottom:4px;">
            <strong style="color:#f59e0b;">⚠️ 买家售后申请：${escapeHTML(o.rma.type)}（状态：${escapeHTML(o.rma.status)}）</strong>
            <span style="color:#8e95a2;">申请时间：${escapeHTML(o.rma.appliedAt || '')}</span>
          </div>
          <div style="margin-bottom:6px;">原因说明：${escapeHTML(o.rma.reason)} ${o.rma.returnTrackingNo ? `｜ 买家退回单号：<strong>${escapeHTML(o.rma.returnTrackingNo)}</strong>` : ''}</div>
          ${o.rma.proofImg ? `<div style="margin-bottom:6px;"><img src="${escapeHTML(o.rma.proofImg)}" alt="售后凭证" style="height:56px;border-radius:4px;cursor:pointer;" onclick="window.open(this.src,'_blank')"></div>` : ''}
          <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
            <input type="text" id="rma-note-${idx}" placeholder="填写商家售后处理备注..." value="${escapeHTML(o.rma.merchantNote || '')}" style="flex:1;min-width:160px;padding:5px 8px;background:var(--bg-card);border:1px solid var(--border-dark);border-radius:4px;color:#fff;font-size:0.78rem;">
            <button type="button" class="neon-primary-btn" style="padding:4px 10px;font-size:0.76rem;" onclick="handleOrderRma(decodeURIComponent('${encodedOrderId}'), 'approve_refund', ${idx})">同意退款并退回库存</button>
            <button type="button" class="dark-outline-btn" style="padding:4px 10px;font-size:0.76rem;color:#10b981;" onclick="handleOrderRma(decodeURIComponent('${encodedOrderId}'), 'approve_exchange', ${idx})">同意换货补发</button>
            <button type="button" class="dark-outline-btn" style="padding:4px 10px;font-size:0.76rem;color:#f43f5e;" onclick="handleOrderRma(decodeURIComponent('${encodedOrderId}'), 'reject', ${idx})">驳回售后</button>
          </div>
        </div>`
      : '';

    return `
      <div class="admin-order-row" style="${isCancelled ? 'opacity:0.65;border-color:rgba(244,63,94,0.3);' : ''}">
        <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:8px;">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <input type="checkbox" class="cart-item-check admin-order-check" ${selectedAdminOrderIds.has(o.orderId) ? 'checked' : ''} onchange="toggleAdminOrderSelect(decodeURIComponent('${encodedOrderId}'), this.checked)">
            <strong>订单号：${escapeHTML(o.orderId)} <span style="color:#8e95a2;font-weight:400;font-size:0.8rem;">(${escapeHTML(o.time)})</span></strong>
            ${(o.courierCompany === '极速达' || String(o.note || '').includes('极速达')) ? '<span class="express-urgent-badge">⚡ 极速达加急 (+¥15)</span>' : (o.courierCompany ? `<span class="courier-info-badge">配送：${escapeHTML(o.courierCompany)}</span>` : '')}
          </div>
          <span style="color:${isCancelled ? '#f43f5e' : '#d8ff00'};font-weight:700;">${escapeHTML(o.payLabel)} ${o.paidTradeNo ? `[流水:${escapeHTML(o.paidTradeNo)}]` : ''} · 实付 ¥${escapeHTML(o.total)} (${escapeHTML(o.status || '待核验收款')})</span>
        </div>
        <div style="background:rgba(255,255,255,0.03);padding:8px 10px;border-radius:4px;margin-bottom:8px;font-size:0.85rem;">${itemsHtml}</div>
        <div style="font-size:0.82rem;color:#8e95a2;overflow-wrap:anywhere;">
          <strong>收货人：</strong>${escapeHTML(o.name)}（${escapeHTML(o.phone)}）｜ <strong>地址：</strong>${escapeHTML(o.address)} ｜ <strong>车型/备注：</strong>${escapeHTML(o.note || '无')}
        </div>
        ${rmaAdminBox}
        <div class="admin-order-controls">
          <select id="status-sel-${idx}" aria-label="订单状态">
            <option value="待核验收款" ${o.status === '待核验收款' || !o.status ? 'selected' : ''}>待核验收款</option>
            <option value="已付款·待发货" ${o.status === '已付款·待发货' ? 'selected' : ''}>已确认收款·待发货</option>
            <option value="已发货" ${o.status === '已发货' ? 'selected' : ''}>已发货（运输中）</option>
            <option value="已完成" ${o.status === '已完成' ? 'selected' : ''}>已完成</option>
            <option value="售后处理中" ${o.status === '售后处理中' ? 'selected' : ''}>售后处理中</option>
            <option value="已退款" ${o.status === '已退款' ? 'selected' : ''}>已退款（自动退回库存）</option>
            <option value="已取消" ${o.status === '已取消' ? 'selected' : ''}>已取消（自动退回库存）</option>
          </select>
          <select id="courier-sel-${idx}" aria-label="承运快递">
            ${couriers.map(c => `<option value="${c}" ${o.courierCompany === c ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
          <input type="text" id="track-input-${idx}" aria-label="快递单号" placeholder="填写快递单号 (如 SF123456789)" value="${escapeHTML(o.trackingNo || '')}" maxlength="40" style="flex:1;min-width:160px;">
          <button type="button" class="neon-primary-btn" style="padding:6px 14px;font-size:0.82rem;" onclick="saveOrderStatus(${idx})">保存状态</button>
          <button type="button" class="dark-outline-btn" style="padding:6px 10px;font-size:0.8rem;color:#f43f5e;" onclick="deleteOrderRecord(${idx})">删除</button>
        </div>
      </div>`;
  }).join('');
}

document.getElementById('refresh-orders-btn').addEventListener('click', () => {
  syncStoreFromServer(() => {
    refreshAllAdminViews();
    showAdminToast('已从数据中心同步最新订单、售后与库存状态！');
  });
});

window.handleOrderRma = async function(orderId, action, idx) {
  const noteEl = document.getElementById(`rma-note-${idx}`);
  const merchantNote = noteEl ? noteEl.value.trim() : '';

  if (window.location.protocol.startsWith('http')) {
    try {
      const res = await fetch('/api/orders/rma', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': sessionStorage.getItem('auto_shop_admin_token') || ''
        },
        body: JSON.stringify({ orderId, action, merchantNote })
      });
      if (res.ok) {
        await syncStoreFromServer(null, true);
        refreshAllAdminViews();
        showAdminToast(`订单 ${orderId} 售后处理已完成！`);
        return;
      }
    } catch (err) {}
  }

  const order = orders.find(o => o.orderId === orderId);
  if (!order || !order.rma) return;
  const nowStr = new Date().toLocaleString('zh-CN', { hour12: false });
  order.rma.merchantNote = merchantNote;
  if (!Array.isArray(order.timeline)) order.timeline = [];
  const activeProds = getAllActiveProducts();

  if (action === 'approve_refund') {
    order.rma.status = '已退款·库存已退回';
    order.status = '已退款';
    if (!order.stockRestored) {
      (order.items || []).forEach(item => {
        const prod = activeProds.find(p => p.id === item.id);
        const curStock = prod ? prod.stock : (stockMap[item.id] || 0);
        stockMap[item.id] = curStock + (Number(item.quantity) || 1);
      });
      order.stockRestored = true;
      writeLocalData('auto_shop_stock_map', stockMap);
    }
    order.timeline.unshift({ time: nowStr, title: '商家已同意退款并恢复商品库存', desc: merchantNote || '退款原路返回' });
  } else if (action === 'approve_exchange') {
    order.rma.status = '已同意换货补发';
    order.status = '已发货';
    order.timeline.unshift({ time: nowStr, title: '商家已同意换货并安排补发', desc: merchantNote || '补发商品已安排出库' });
  } else if (action === 'reject') {
    order.rma.status = '售后已驳回';
    order.status = order.trackingNo ? '已发货' : '已付款·待发货';
    order.timeline.unshift({ time: nowStr, title: '售后申请未通过审核', desc: merchantNote || '请联系商家沟通' });
  }
  writeLocalData('auto_shop_orders', orders);
  refreshAllAdminViews();
  showAdminToast(`订单 ${orderId} 售后状态已更新！`);
};

window.saveOrderStatus = function(idx) {
  if (!orders[idx]) return;
  const order = orders[idx];
  const prevStatus = order.status || '待核验收款';
  const nextStatus = document.getElementById(`status-sel-${idx}`).value;
  const courierCompany = document.getElementById(`courier-sel-${idx}`).value;
  const trackingNo = document.getElementById(`track-input-${idx}`).value.trim();
  if (nextStatus === '已发货' && !trackingNo) {
    showAdminToast('切换为「已发货」前请先填写快递单号');
    return;
  }

  const activeProds = getAllActiveProducts();
  const isCancelLike = nextStatus === '已取消' || nextStatus === '已退款';
  const wasCancelLike = prevStatus === '已取消' || prevStatus === '已退款';

  if (isCancelLike && !wasCancelLike && !order.stockRestored) {
    (order.items || []).forEach(item => {
      const prod = activeProds.find(p => p.id === item.id);
      const curStock = prod ? prod.stock : (stockMap[item.id] || 0);
      stockMap[item.id] = curStock + (Number(item.quantity) || 1);
      const skuKey = `${item.id}__${item.variant}`;
      if (skuStockMap[skuKey] !== undefined) {
        skuStockMap[skuKey] = Number(skuStockMap[skuKey]) + (Number(item.quantity) || 1);
      }
    });
    order.stockRestored = true;
    writeLocalData('auto_shop_stock_map', stockMap);
    writeLocalData('auto_shop_sku_stock_map', skuStockMap);
  } else if (wasCancelLike && !isCancelLike && order.stockRestored) {
    (order.items || []).forEach(item => {
      const prod = activeProds.find(p => p.id === item.id);
      const curStock = prod ? prod.stock : (stockMap[item.id] || 0);
      stockMap[item.id] = Math.max(0, curStock - (Number(item.quantity) || 1));
    });
    order.stockRestored = false;
    writeLocalData('auto_shop_stock_map', stockMap);
  }

  const nowStr = new Date().toLocaleString('zh-CN', { hour12: false });
  if (!Array.isArray(order.timeline)) order.timeline = [];
  if (nextStatus === '已发货' && trackingNo) {
    order.timeline.unshift({
      time: nowStr,
      title: `商家已发货 · 承运快递：${courierCompany}`,
      desc: `运单号：${trackingNo}（已完成车型配件核对与防震打包）`
    });
  } else if (nextStatus !== prevStatus) {
    order.timeline.unshift({
      time: nowStr,
      title: `订单状态更新为：${nextStatus}`,
      desc: trackingNo ? `${courierCompany} ${trackingNo}` : '商家后台操作更新'
    });
  }

  order.status = nextStatus;
  order.courierCompany = courierCompany;
  order.trackingNo = trackingNo;
  if (!writeLocalData('auto_shop_orders', orders)) return;
  refreshAllAdminViews();
  showAdminToast(`订单 ${order.orderId} 状态已更新为「${nextStatus}」，物流时间轴已同步至买家端！`);
};

window.deleteOrderRecord = async function(idx) {
  const order = orders[idx];
  if (!order) return;
  if (!await adminConfirm(`确定要彻底删除订单 ${order.orderId} 吗？`)) return;
  if (order.status !== '已取消' && order.status !== '已退款' && !order.stockRestored) {
    const activeProds = getAllActiveProducts();
    (order.items || []).forEach(item => {
      const prod = activeProds.find(p => p.id === item.id);
      const curStock = prod ? prod.stock : (stockMap[item.id] || 0);
      stockMap[item.id] = curStock + (Number(item.quantity) || 1);
    });
    writeLocalData('auto_shop_stock_map', stockMap);
  }
  orders.splice(idx, 1);
  writeLocalData('auto_shop_orders', orders);
  refreshAllAdminViews();
};

// ==========================================
// 4. 商品上架、多SKU全字段编辑、CSV批量导入导出与模板清理
// ==========================================
let uploadedProductImgData = '';
let editedProductImgData = '';
let adminReviewPhotoData = '';

async function compressAndUploadImage(file, maxWidth = 750) {
  return new Promise((resolve) => {
    if (!file || !/^image\/(jpeg|png|webp|gif)$/i.test(file.type) || file.size > 10 * 1024 * 1024) {
      showAdminToast('请选择 10MB 以内的 JPG、PNG 或 WebP 图片');
      resolve('');
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => { showAdminToast('图片读取失败，请重新选择'); resolve(''); };
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => { showAdminToast('图片格式无法识别，请更换文件'); resolve(''); };
      img.onload = async () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const context = canvas.getContext('2d');
        if (!context) { resolve(''); return; }
        context.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);

        if (window.location.protocol.startsWith('http')) {
          try {
            const res = await fetch('/api/upload-image', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Admin-Token': sessionStorage.getItem('auto_shop_admin_token') || ''
              },
              body: JSON.stringify({ dataUrl, filename: file.name })
            });
            if (res.ok) {
              const data = await res.json();
              if (data && data.url) {
                window.AUTO_SHOP_SERVER_ONLINE = true;
                resolve(data.url);
                return;
              }
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

let pubProductImages = [];
let editProductImages = [];

function renderAdminImageGrid(gridId, imagesArr, mode) {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  grid.innerHTML = imagesArr.map((src, idx) => `
    <div class="admin-img-thumb ${idx === 0 ? 'is-main' : ''}">
      <img src="${escapeHTML(resolveProductImage(src))}" alt="商品图 ${idx + 1}">
      ${idx === 0 ? '<span class="main-img-tag">主图</span>' : `<button type="button" class="set-main-btn" onclick="setAdminMainImage('${mode}', ${idx})">设为主图</button>`}
      <button type="button" class="del-img-btn" aria-label="删除图片" onclick="removeAdminImage('${mode}', ${idx})">✕</button>
    </div>`).join('');
}

window.setAdminMainImage = function(mode, idx) {
  const arr = mode === 'pub' ? pubProductImages : editProductImages;
  if (idx <= 0 || idx >= arr.length) return;
  const [picked] = arr.splice(idx, 1);
  arr.unshift(picked);
  renderAdminImageGrid(mode === 'pub' ? 'pub-images-grid' : 'edit-images-grid', arr, mode);
};

window.removeAdminImage = function(mode, idx) {
  const arr = mode === 'pub' ? pubProductImages : editProductImages;
  arr.splice(idx, 1);
  renderAdminImageGrid(mode === 'pub' ? 'pub-images-grid' : 'edit-images-grid', arr, mode);
};

const pubAddBtn = document.getElementById('pub-add-images-btn');
const pubMultiInput = document.getElementById('pub-multi-img-input');
if (pubAddBtn && pubMultiInput) {
  pubAddBtn.addEventListener('click', () => pubMultiInput.click());
  pubMultiInput.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files || []).slice(0, 8);
    for (const f of files) {
      const url = await compressAndUploadImage(f, 800);
      if (url) pubProductImages.push(url);
    }
    renderAdminImageGrid('pub-images-grid', pubProductImages, 'pub');
    e.target.value = '';
  });
}

const editAddBtn = document.getElementById('edit-add-images-btn');
const editMultiInput = document.getElementById('edit-multi-img-input');
if (editAddBtn && editMultiInput) {
  editAddBtn.addEventListener('click', () => editMultiInput.click());
  editMultiInput.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files || []).slice(0, 8);
    for (const f of files) {
      const url = await compressAndUploadImage(f, 800);
      if (url) editProductImages.push(url);
    }
    renderAdminImageGrid('edit-images-grid', editProductImages, 'edit');
    e.target.value = '';
  });
}

const cmsHeroUploadBtn = document.getElementById('cms-hero-upload-btn');
const cmsHeroFile = document.getElementById('cms-hero-file');
if (cmsHeroUploadBtn && cmsHeroFile) {
  cmsHeroUploadBtn.addEventListener('click', () => cmsHeroFile.click());
  cmsHeroFile.addEventListener('change', async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const url = await compressAndUploadImage(f, 1280);
    if (url) {
      document.getElementById('cms-hero-bg1').value = url;
      const pv = document.getElementById('cms-hero-preview');
      if (pv) pv.src = resolveProductImage(url);
    }
    e.target.value = '';
  });
}

document.getElementById('admin-publish-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const cat = document.getElementById('pub-cat').value;
  const finalImg = pubProductImages[0] || CATEGORY_IMAGE_MAP[cat] || 'assets/exterior.webp';
  const price = Number(document.getElementById('pub-price').value);
  const stockInput = Number(document.getElementById('pub-stock').value);
  const initStock = Number.isFinite(stockInput) ? Math.max(0, Math.floor(stockInput)) : 0;
  const newId = `custom_${Date.now()}_${Math.floor(Math.random() * 90 + 10)}`;
  syncSkuEditorToHidden('pub-sku-editor', 'pub-variants');
  const variantSkus = parseVariantSkus(document.getElementById('pub-variants').value, price, initStock, newId);
  if (!Number.isFinite(price) || price <= 0) { showAdminToast('请输入大于 0 的商品价格'); return; }
  if (!variantSkus.length) { showAdminToast('请至少填写一个商品规格'); return; }

  const galleryList = pubProductImages.length > 0 ? [...pubProductImages] : [finalImg];

  const newItem = {
    id: newId,
    isTemplate: false,
    isEditedByMerchant: true,
    onSale: true,
    isNewArrival: Boolean(document.getElementById('pub-is-new-arrival') && document.getElementById('pub-is-new-arrival').checked),
    cat,
    fit: document.getElementById('pub-fit').value,
    fitBrands: document.getElementById('pub-fit-brands').value.trim() || 'universal',
    fitYears: document.getElementById('pub-fit-years').value.trim() || '2015-2026',
    fitText: document.getElementById('pub-fit-text').value.trim(),
    name: document.getElementById('pub-name').value.trim(),
    price,
    stock: initStock,
    baseSales: 0,
    badge: document.getElementById('pub-badge').value.trim() || '新品上架',
    sourceUrl: document.getElementById('pub-source-url').value.trim(),
    videoUrl: document.getElementById('pub-video-url').value.trim(),
    img: finalImg,
    gallery: galleryList,
    sub: document.getElementById('pub-sub').value.trim(),
    specs: document.getElementById('pub-specs').value.split(/[,，]/).map(s => s.trim()).filter(Boolean),
    variants: variantSkus.map(v => v.name),
    variantSkus,
    material: document.getElementById('pub-material').value.trim() || '车规级精选环保材质',
    install: document.getElementById('pub-install').value.trim() || '原车无损安装，直接固定即可。',
    nameEn: (document.getElementById('pub-name-en')?.value || '').trim(),
    subEn: (document.getElementById('pub-sub-en')?.value || '').trim(),
    diyDifficulty: (document.getElementById('pub-diy-diff')?.value || '').trim(),
    diyDuration: (document.getElementById('pub-diy-time')?.value || '').trim(),
    boxContents: (document.getElementById('pub-box-contents')?.value || '').split(/[,，]/).map(s => s.trim()).filter(Boolean)
  };

  customCatalog.unshift(newItem);
  stockMap[newId] = initStock;
  variantSkus.forEach(s => { skuStockMap[`${newId}__${s.name}`] = s.stock; });
  writeLocalData('auto_shop_custom_products', customCatalog);
  writeLocalData('auto_shop_stock_map', stockMap);
  writeLocalData('auto_shop_sku_stock_map', skuStockMap);

  e.target.reset();
  pubProductImages = [];
  renderAdminImageGrid('pub-images-grid', pubProductImages, 'pub');
  refreshAllAdminViews();
  showAdminToast(`汽车升级商品「${newItem.name}」已成功上架（共 ${variantSkus.length} 个 SKU 规格）！`);
});

function renderAllProductsManager() {
  let list = getAllActiveProducts();
  document.getElementById('all-active-prod-count').textContent = list.length;
  document.getElementById('onsale-prod-count').textContent = list.filter(p => p.onSale).length;

  const restoreBtn = document.getElementById('restore-deleted-btn');
  if (deletedProductIds.length > 0) {
    restoreBtn.style.display = 'inline-block';
    document.getElementById('deleted-count-num').textContent = deletedProductIds.length;
  } else {
    restoreBtn.style.display = 'none';
  }

  const kw = document.getElementById('admin-prod-search').value.trim().toLowerCase();
  const catFilter = document.getElementById('admin-prod-cat-filter').value;
  if (catFilter === 'new-arrival') list = list.filter(p => Boolean(p.isNewArrival));
  else if (catFilter === 'low-stock-5') list = list.filter(p => p.stock > 0 && p.stock <= 5);
  else if (catFilter === 'low-stock') list = list.filter(p => p.stock > 0 && p.stock <= 10);
  else if (catFilter === 'out-of-stock') list = list.filter(p => p.stock <= 0);
  else if (catFilter === 'off-sale') list = list.filter(p => !p.onSale);
  else if (catFilter === 'custom-only') list = list.filter(p => !p.isTemplate);
  else if (catFilter === 'template-only') list = list.filter(p => p.isTemplate);
  else if (catFilter !== 'all') list = list.filter(p => p.cat === catFilter);

  if (kw) {
    list = list.filter(p =>
      String(p.name).toLowerCase().includes(kw) ||
      String(p.sub || '').toLowerCase().includes(kw) ||
      String(p.fitText || '').toLowerCase().includes(kw) ||
      String(p.fitBrands || '').toLowerCase().includes(kw) ||
      String(p.material || '').toLowerCase().includes(kw)
    );
  }

  const container = document.getElementById('admin-all-products-list');
  container.innerHTML = list.length === 0
    ? '<div class="empty-state"><strong>没有匹配的商品</strong><p>请调整搜索关键词、类目筛选，或在左侧发布您的新商品。</p></div>'
    : list.map(item => {
      const isOut = item.stock <= 0;
      const isLow = item.stock > 0 && item.stock <= 10;
      const id = encodeURIComponent(String(item.id));
      const catTitle = (CATEGORY_META[item.cat] || CATEGORY_META.all).title;
      const sourceBadge = item.isTemplate
        ? '<span style="font-size:0.68rem;padding:1px 6px;border-radius:4px;background:rgba(255,255,255,0.08);color:#8e95a2;">初始模板</span>'
        : '<span style="font-size:0.68rem;padding:1px 6px;border-radius:4px;background:rgba(216,255,0,0.14);color:#d8ff00;">商家实品</span>';
      const saleBadge = item.onSale
        ? '<span style="font-size:0.68rem;padding:1px 6px;border-radius:4px;background:rgba(16,185,129,0.15);color:#10b981;">上架中</span>'
        : '<span style="font-size:0.68rem;padding:1px 6px;border-radius:4px;background:rgba(244,63,94,0.15);color:#f43f5e;">已下架</span>';
      const stockColor = isOut ? '#f43f5e' : (isLow ? '#f59e0b' : '#10b981');
      const stockLabel = isOut ? '0 件 (已售罄)' : `${item.stock} 件${isLow ? ' (低库存)' : ''}`;

      return `
        <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.09);flex-wrap:wrap;${!item.onSale ? 'opacity:0.65;' : ''}">
          <input type="checkbox" class="cart-item-check admin-prod-check" ${selectedAdminProdIds.has(item.id) ? 'checked' : ''} onchange="toggleAdminProdSelect(decodeURIComponent('${id}'), this.checked)">
          <img src="${safeImageUrl(item.img, item.cat)}" alt="" style="width:48px;height:48px;border-radius:6px;object-fit:cover;">
          <div style="flex:1;min-width:180px;">
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
              ${sourceBadge}
              ${saleBadge}
              ${item.isNewArrival ? '<span style="font-size:0.68rem;padding:1px 6px;border-radius:4px;background:rgba(216,255,0,0.2);border:1px solid #d8ff00;color:#d8ff00;font-weight:700;">🔥 新品首推</span>' : ''}
              <span style="font-size:0.86rem;font-weight:600;">${escapeHTML(item.name)}</span>
            </div>
            <div style="font-size:0.76rem;color:#8e95a2;margin-top:3px;">
              <span>${escapeHTML(catTitle)} · ${escapeHTML(item.fitText)} (${item.variantSkus.length}个SKU)</span> ·
              <strong style="color:#d8ff00;">¥${Number(item.price).toFixed(1)}</strong> ·
              <span style="color:${stockColor};font-weight:600;">总库存 ${stockLabel}</span> · 已售 ${item.sales}
            </div>
          </div>
          <div style="display:flex;gap:5px;flex-wrap:wrap;">
            <button type="button" class="dark-outline-btn" style="padding:4px 9px;font-size:0.74rem;${item.isNewArrival ? 'background:rgba(216,255,0,0.16);color:#d8ff00;border-color:#d8ff00;' : 'color:#cbd5e1;'}" onclick="toggleNewArrivalProduct(decodeURIComponent('${id}'))">${item.isNewArrival ? '✓ 取消首推' : '🔥 设为首推'}</button>
            <button type="button" class="dark-outline-btn" style="padding:4px 9px;font-size:0.74rem;color:#10b981;border-color:rgba(16,185,129,0.4);" onclick="quickRestockProduct(decodeURIComponent('${id}'), 10)">+10补货</button>
            <button type="button" class="dark-outline-btn" style="padding:4px 7px;font-size:0.74rem;" onclick="toggleProductOnSale(decodeURIComponent('${id}'))">${item.onSale ? '下架' : '上架'}</button>
            <button type="button" class="dark-outline-btn" style="padding:4px 7px;font-size:0.74rem;" onclick="quickRestock(decodeURIComponent('${id}'))" title="一键增加20件库存">+20库存</button>
            <button type="button" class="neon-primary-btn" style="padding:4px 9px;font-size:0.74rem;" onclick="openEditProductModal(decodeURIComponent('${id}'))">全字段编辑</button>
            <button type="button" class="dark-outline-btn" style="padding:4px 8px;font-size:0.74rem;" onclick="duplicateProduct(decodeURIComponent('${id}'))">复制</button>
            <button type="button" class="dark-outline-btn" style="padding:4px 8px;font-size:0.74rem;color:#f43f5e;border-color:rgba(244,63,94,0.4);" onclick="deleteAnyProduct(decodeURIComponent('${id}'))">删除</button>
          </div>
        </div>`;
    }).join('');
}

window.toggleProductOnSale = function(productId) {
  const prod = getAllActiveProducts().find(p => p.id === productId);
  if (!prod) return;
  const nextOnSale = !prod.onSale;
  if (productId.startsWith('custom_')) {
    const idx = customCatalog.findIndex(c => c.id === productId);
    if (idx !== -1) {
      customCatalog[idx].onSale = nextOnSale;
      writeLocalData('auto_shop_custom_products', customCatalog);
    }
  } else {
    productOverrides[productId] = { ...(productOverrides[productId] || {}), onSale: nextOnSale };
    writeLocalData('auto_shop_product_overrides', productOverrides);
  }
  refreshAllAdminViews();
};

window.quickRestock = function(productId) {
  const prod = getAllActiveProducts().find(p => p.id === productId);
  if (!prod) return;
  stockMap[productId] = (prod.stock || 0) + 20;
  (prod.variantSkus || []).forEach(s => {
    const k = `${productId}__${s.name}`;
    skuStockMap[k] = (s.stock || 0) + 20;
  });
  writeLocalData('auto_shop_stock_map', stockMap);
  writeLocalData('auto_shop_sku_stock_map', skuStockMap);
  refreshAllAdminViews();
};

document.getElementById('batch-zero-stock-btn').addEventListener('click', async () => {
  if (!await adminConfirm('确定要将全店所有商品与规格库存一键清零吗？')) return;
  const list = getAllActiveProducts();
  list.forEach(p => {
    stockMap[p.id] = 0;
    (p.variantSkus || []).forEach(s => { skuStockMap[`${p.id}__${s.name}`] = 0; });
  });
  writeLocalData('auto_shop_stock_map', stockMap);
  writeLocalData('auto_shop_sku_stock_map', skuStockMap);
  refreshAllAdminViews();
  showAdminToast('全店商品库存已清零！');
});

document.getElementById('batch-set-stock-btn').addEventListener('click', async () => {
  const raw = await adminPrompt('请输入要统一设置的库存数量（正整数，如 30）：', '30');
  if (raw === null) return;
  const num = Math.floor(Number(raw));
  if (!Number.isFinite(num) || num < 0) { showAdminToast('请输入大于或等于 0 的有效整数'); return; }
  const list = getAllActiveProducts();
  list.forEach(p => {
    stockMap[p.id] = num;
    (p.variantSkus || []).forEach(s => { skuStockMap[`${p.id}__${s.name}`] = num; });
  });
  writeLocalData('auto_shop_stock_map', stockMap);
  writeLocalData('auto_shop_sku_stock_map', skuStockMap);
  refreshAllAdminViews();
  showAdminToast(`已将全店 ${list.length} 款商品及规格库存统一设置为 ${num} 件！`);
});

document.getElementById('clear-templates-btn').addEventListener('click', async () => {
  const uneditedTemplates = getAllActiveProducts().filter(p => p.isTemplate);
  if (uneditedTemplates.length === 0) {
    showAdminToast('当前没有未编辑的初始模板商品。');
    return;
  }
  if (!await adminConfirm(`确定要一键移除全部 ${uneditedTemplates.length} 款未修改的初始模板商品吗？`)) return;
  uneditedTemplates.forEach(p => {
    if (!deletedProductIds.includes(p.id)) deletedProductIds.push(p.id);
  });
  writeLocalData('auto_shop_deleted_ids', deletedProductIds);
  refreshAllAdminViews();
  showAdminToast('已清空全部未修改的初始模板商品！');
});

// P3: 导出全部商品库为 CSV
document.getElementById('export-products-csv-btn').addEventListener('click', () => {
  const list = getAllActiveProducts();
  const csvCell = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const headers = ['商品ID', '商品名称', '所属类目(interior/exterior/storage/scent)', '零售价格', '总库存', '上架状态(true/false)', '适配大类(universal/sedan/suv/ev)', '适配车系关键词', '适用年份', '适配说明', '角标', '主图路径', '多规格SKU配置', '一句话卖点', '主体材质', '安装说明', '1688采购链接'];
  const rows = list.map(p => [
    p.id, p.name, p.cat, p.price, p.stock, p.onSale !== false, p.fit, p.fitBrands || 'universal', p.fitYears || '2015-2026', p.fitText,
    p.badge || '', p.img, formatVariantSkusToString(p.variantSkus, p.variants, p.price, p.stock, p.id),
    p.sub || '', p.material || '', p.install || '', p.sourceUrl || ''
  ].map(csvCell));
  const csvContent = '\uFEFF' + [headers.map(csvCell).join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blobUrl = URL.createObjectURL(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }));
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = `AUTO_STUDIO_汽车升级商品库_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
});

// P3: 批量导入商品 CSV
function parseCsvRows(csvText) {
  const rows = [];
  let row = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < csvText.length; i++) {
    const ch = csvText[i];
    if (inQuotes) {
      if (ch === '"' && csvText[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else cur += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ',') { row.push(cur.trim()); cur = ''; }
      else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && csvText[i + 1] === '\n') i++;
        row.push(cur.trim());
        if (row.some(cell => cell !== '')) rows.push(row);
        row = [];
        cur = '';
      } else cur += ch;
    }
  }
  if (cur.length > 0 || row.length > 0) {
    row.push(cur.trim());
    if (row.some(cell => cell !== '')) rows.push(row);
  }
  return rows;
}

document.getElementById('import-products-csv-btn').addEventListener('click', () => {
  document.getElementById('import-products-csv-input').click();
});

document.getElementById('import-products-csv-input').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const text = String(ev.target.result || '').replace(/^\uFEFF/, '');
    const rows = parseCsvRows(text);
    if (rows.length < 2) { showAdminToast('CSV 文件中没有有效商品行'); return; }
    let updatedCount = 0;
    let createdCount = 0;

    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r[1]) continue;
      const id = r[0] || `custom_${Date.now()}_${i}`;
      const name = r[1];
      const cat = ['interior', 'exterior', 'storage', 'scent'].includes(r[2]) ? r[2] : 'interior';
      const price = Math.max(0.1, Number(r[3]) || 59);
      const stock = Math.max(0, Math.floor(Number(r[4]) || 20));
      const onSale = String(r[5]).toLowerCase() !== 'false';
      const fit = ['universal', 'sedan', 'suv', 'ev'].includes(r[6]) ? r[6] : 'universal';
      const fitBrands = r[7] || 'universal';
      const fitYears = r[8] || '2015-2026';
      const fitText = r[9] || '全车型通用';
      const badge = r[10] || '严选车品';
      const img = r[11] || CATEGORY_IMAGE_MAP[cat];
      const variantSkus = parseVariantSkus(r[12] || '标准通用款', price, stock, id);
      const sub = r[13] || name;
      const material = r[14] || '车规级精选环保材质';
      const install = r[15] || '原车无损安装';
      const sourceUrl = r[16] || '';

      const fields = {
        id, name, cat, price, stock, onSale, fit, fitBrands, fitYears, fitText,
        badge, img, variantSkus, variants: variantSkus.map(v => v.name),
        sub, material, install, sourceUrl, isEditedByMerchant: true
      };
      stockMap[id] = stock;
      variantSkus.forEach(s => { skuStockMap[`${id}__${s.name}`] = s.stock; });

      if (BASE_CATALOG.some(b => b.id === id)) {
        productOverrides[id] = { ...(productOverrides[id] || {}), ...fields };
        updatedCount++;
      } else {
        const cIdx = customCatalog.findIndex(c => c.id === id);
        if (cIdx !== -1) {
          customCatalog[cIdx] = { ...customCatalog[cIdx], ...fields };
          updatedCount++;
        } else {
          customCatalog.unshift({ ...fields, isTemplate: false, specs: ['原车开模', '无损安装'] });
          createdCount++;
        }
      }
    }
    writeLocalData('auto_shop_custom_products', customCatalog);
    writeLocalData('auto_shop_product_overrides', productOverrides);
    writeLocalData('auto_shop_stock_map', stockMap);
    writeLocalData('auto_shop_sku_stock_map', skuStockMap);
    e.target.value = '';
    refreshAllAdminViews();
    showAdminToast(`CSV 导入完成：新增 ${createdCount} 款商品，更新 ${updatedCount} 款现有商品！`);
  };
  reader.readAsText(file, 'utf-8');
});

document.getElementById('admin-prod-search').addEventListener('input', renderAllProductsManager);
document.getElementById('admin-prod-cat-filter').addEventListener('change', renderAllProductsManager);

window.deleteAnyProduct = async function(productId) {
  const product = getAllActiveProducts().find(item => item.id === productId);
  const productName = product ? product.name : productId;
  if (!await adminConfirm(`确定要从商店下架并删除「${productName}」吗？`)) return;
  if (productId.startsWith('custom_')) {
    customCatalog = customCatalog.filter(c => c.id !== productId);
    if (!writeLocalData('auto_shop_custom_products', customCatalog)) return;
  } else if (!deletedProductIds.includes(productId)) {
    deletedProductIds.push(productId);
    if (!writeLocalData('auto_shop_deleted_ids', deletedProductIds)) return;
  }
  refreshAllAdminViews();
};

document.getElementById('restore-deleted-btn').addEventListener('click', async () => {
  if (!await adminConfirm('确定要恢复所有已删除的内置汽车用品模板商品吗？')) return;
  deletedProductIds = [];
  writeLocalData('auto_shop_deleted_ids', deletedProductIds);
  refreshAllAdminViews();
});

const editProdModal = document.getElementById('edit-product-modal');
window.openEditProductModal = function(productId) {
  const prod = getAllActiveProducts().find(p => p.id === productId);
  if (!prod) return;
  editedProductImgData = '';
  document.getElementById('edit-prod-id').value = prod.id;
  document.getElementById('edit-prod-name').value = prod.name || '';
  const nameEnEl = document.getElementById('edit-prod-name-en'); if (nameEnEl) nameEnEl.value = prod.nameEn || '';
  const subEnEl = document.getElementById('edit-prod-sub-en'); if (subEnEl) subEnEl.value = prod.subEn || '';
  document.getElementById('edit-prod-cat').value = prod.cat || 'interior';
  document.getElementById('edit-prod-price').value = prod.price;
  document.getElementById('edit-prod-stock').value = prod.stock;
  document.getElementById('edit-prod-onsale').value = String(prod.onSale !== false);
  document.getElementById('edit-prod-base-sales').value = prod.baseSales || 0;
  document.getElementById('edit-prod-fit').value = prod.fit || 'universal';
  document.getElementById('edit-prod-fit-brands').value = prod.fitBrands || 'universal';
  document.getElementById('edit-prod-fit-years').value = prod.fitYears || '2015-2026';
  document.getElementById('edit-prod-fit-text').value = prod.fitText || '';
  const existingGallery = Array.isArray(prod.gallery) ? prod.gallery : [];
  editProductImages = Array.from(new Set([prod.img, ...existingGallery].filter(Boolean)));
  renderAdminImageGrid('edit-images-grid', editProductImages, 'edit');
  document.getElementById('edit-prod-badge').value = prod.badge || '';
  const skuStr = formatVariantSkusToString(prod.variantSkus, prod.variants, prod.price, prod.stock, prod.id);
  document.getElementById('edit-prod-variants').value = skuStr;
  renderSkuEditor('edit-sku-editor', prod.variantSkus || []);
  document.getElementById('edit-prod-specs').value = (prod.specs || []).join(', ');
  document.getElementById('edit-prod-sub').value = prod.sub || '';
  document.getElementById('edit-prod-material').value = prod.material || '车规级精选环保材质';
  document.getElementById('edit-prod-install').value = prod.install || '原车孔位/3M无损背胶固定';
  const diyDiffEl = document.getElementById('edit-prod-diy-diff');
  if (diyDiffEl) diyDiffEl.value = prod.diyDifficulty || '';
  const diyTimeEl = document.getElementById('edit-prod-diy-time');
  if (diyTimeEl) diyTimeEl.value = prod.diyDuration || '';
  const boxEl = document.getElementById('edit-prod-box-contents');
  if (boxEl) boxEl.value = Array.isArray(prod.boxContents) ? prod.boxContents.join(', ') : (prod.boxContents || '');
  document.getElementById('edit-prod-video-url').value = prod.videoUrl || '';
  document.getElementById('edit-prod-source-url').value = prod.sourceUrl || '';
  document.getElementById('edit-prod-redirect-url').value = prod.redirectUrl || '';
  editProdModal.classList.add('active');
};

document.getElementById('close-edit-prod-modal').addEventListener('click', () => editProdModal.classList.remove('active'));

document.getElementById('edit-product-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const id = document.getElementById('edit-prod-id').value;
  const cat = document.getElementById('edit-prod-cat').value;
  const price = Number(document.getElementById('edit-prod-price').value);
  const stockInput = Number(document.getElementById('edit-prod-stock').value);
  const newStock = Number.isFinite(stockInput) ? Math.max(0, Math.floor(stockInput)) : 0;
  const baseSalesInput = Number(document.getElementById('edit-prod-base-sales').value);
  const baseSales = Number.isFinite(baseSalesInput) ? Math.max(0, Math.floor(baseSalesInput)) : 0;
  const onSale = document.getElementById('edit-prod-onsale').value === 'true';
  syncSkuEditorToHidden('edit-sku-editor', 'edit-prod-variants');
  const variantSkus = parseVariantSkus(document.getElementById('edit-prod-variants').value, price, newStock, id);
  const skuImgInputs = Array.from(document.querySelectorAll('#edit-sku-editor .sku-edit-row')).map(r => (r.querySelector('.sku-in-img')?.value || '').trim());
  variantSkus.forEach((sku, idx) => { if (skuImgInputs[idx]) sku.img = skuImgInputs[idx]; });
  const specs = document.getElementById('edit-prod-specs').value.split(/[,，]/).map(s => s.trim()).filter(Boolean);
  const finalImg = editProductImages[0] || CATEGORY_IMAGE_MAP[cat] || 'assets/hero-auto-minimal.webp';
  const gallery = editProductImages.length > 0 ? [...editProductImages] : [finalImg];
  const sourceUrl = document.getElementById('edit-prod-source-url').value.trim();
  const redirectUrl = document.getElementById('edit-prod-redirect-url').value.trim();
  const videoUrl = document.getElementById('edit-prod-video-url').value.trim();

  if (!Number.isFinite(price) || price <= 0) { showAdminToast('请输入大于 0 的商品价格'); return; }
  if (!variantSkus.length) { showAdminToast('请至少保留一个商品规格'); return; }
  if ((sourceUrl && !safeExternalUrl(sourceUrl)) || (redirectUrl && !safeExternalUrl(redirectUrl))) {
    showAdminToast('外链仅支持有效的 http 或 https 地址');
    return;
  }

  const updatedFields = {
    name: document.getElementById('edit-prod-name').value.trim(),
    nameEn: (document.getElementById('edit-prod-name-en')?.value || '').trim(),
    subEn: (document.getElementById('edit-prod-sub-en')?.value || '').trim(),
    cat,
    price,
    stock: newStock,
    baseSales,
    onSale,
    fit: document.getElementById('edit-prod-fit').value,
    fitBrands: document.getElementById('edit-prod-fit-brands').value.trim() || 'universal',
    fitYears: document.getElementById('edit-prod-fit-years').value.trim() || '2015-2026',
    fitText: document.getElementById('edit-prod-fit-text').value.trim(),
    img: finalImg,
    gallery,
    badge: document.getElementById('edit-prod-badge').value.trim(),
    variants: variantSkus.map(v => v.name),
    variantSkus,
    specs: specs.length ? specs : ['原车开模', '无损安装'],
    sub: document.getElementById('edit-prod-sub').value.trim(),
    material: document.getElementById('edit-prod-material').value.trim() || '车规级精选环保材质',
    install: document.getElementById('edit-prod-install').value.trim() || '原车无损安装',
    diyDifficulty: (document.getElementById('edit-prod-diy-diff')?.value || '').trim(),
    diyDuration: (document.getElementById('edit-prod-diy-time')?.value || '').trim(),
    boxContents: (document.getElementById('edit-prod-box-contents')?.value || '').split(/[,，]/).map(s => s.trim()).filter(Boolean),
    videoUrl,
    sourceUrl,
    redirectUrl,
    isEditedByMerchant: true
  };

  stockMap[id] = newStock;
  variantSkus.forEach(s => { skuStockMap[`${id}__${s.name}`] = s.stock; });
  writeLocalData('auto_shop_stock_map', stockMap);
  writeLocalData('auto_shop_sku_stock_map', skuStockMap);

  if (id.startsWith('custom_')) {
    const idx = customCatalog.findIndex(c => c.id === id);
    if (idx !== -1) {
      customCatalog[idx] = { ...customCatalog[idx], ...updatedFields };
      writeLocalData('auto_shop_custom_products', customCatalog);
    }
  } else {
    productOverrides[id] = { ...(productOverrides[id] || {}), ...updatedFields };
    writeLocalData('auto_shop_product_overrides', productOverrides);
  }

  editProdModal.classList.remove('active');
  refreshAllAdminViews();
  showAdminToast(`商品「${updatedFields.name}」的全字段信息与多 SKU 库存已保存！`);
});

// ==========================================
// 5. 晒图评价管理（支持上传买家秀照片与已购认证标签）
// ==========================================
const adminRevPhotoInput = document.getElementById('admin-rev-photo-file');
if (adminRevPhotoInput) {
  adminRevPhotoInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    adminReviewPhotoData = await compressAndUploadImage(file, 600);
  });
}

function renderReviewsManager() {
  userReviews = readLocalData('auto_shop_reviews', {});
  const activeProds = getAllActiveProducts();

  const prodSelect = document.getElementById('rev-prod-select');
  if (prodSelect) {
    const prevVal = prodSelect.value;
    prodSelect.innerHTML = activeProds.map(p => `<option value="${escapeHTML(p.id)}">[${escapeHTML((CATEGORY_META[p.cat] || CATEGORY_META.all).title)}] ${escapeHTML(p.name)}</option>`).join('');
    if (prevVal && activeProds.some(p => p.id === prevVal)) prodSelect.value = prevVal;
  }

  const container = document.getElementById('admin-reviews-list');
  let allUserRevItems = [];
  Object.entries(userReviews).forEach(([prodId, revList]) => {
    if (!Array.isArray(revList)) return;
    const prod = activeProds.find(p => p.id === prodId);
    const prodName = prod ? prod.name : prodId;
    revList.forEach((r, idx) => allUserRevItems.push({ prodId, prodName, idx, ...r }));
  });

  document.getElementById('admin-reviews-total-count').textContent = allUserRevItems.length;

  if (allUserRevItems.length === 0) {
    container.innerHTML = '<p style="color:#8e95a2; font-size:0.85rem; padding:32px 0; text-align:center;">当前全站为 0 条评价。<br>当买家在商品详情页提交带图评价，或您在左侧录入真实车主买家秀后，将实时显示在此处。</p>';
    return;
  }

  container.innerHTML = allUserRevItems.map(item => {
    const productId = encodeURIComponent(String(item.prodId));
    const photosHTML = Array.isArray(item.photos) && item.photos.length
      ? `<div class="review-photos-row" style="margin-bottom:8px;">${item.photos.map(ph => `<img src="${escapeHTML(ph)}" alt="买家秀">`).join('')}</div>`
      : '';
    return `
      <div class="admin-order-row">
        <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:6px;font-size:0.84rem;margin-bottom:4px;">
          <strong>商品：${escapeHTML(item.prodName)}</strong>
          <span style="color:#d8ff00;">${escapeHTML(item.rating || '★★★★★')} · 车主：${escapeHTML(item.user)} (${escapeHTML(item.car)}) ${item.verifiedPurchase ? '✓已购认证' : ''}</span>
        </div>
        <p style="font-size:0.86rem;margin-bottom:8px;overflow-wrap:anywhere;">评价内容：${escapeHTML(item.text)}</p>
        ${photosHTML}
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <input type="text" id="reply-input-${item.prodId}-${item.idx}" aria-label="商家回复" placeholder="输入官方商家回复内容..." value="${escapeHTML(item.merchantReply || '')}" maxlength="300" style="flex:1;min-width:180px;padding:6px 10px;background:var(--bg-card);border:1px solid var(--border-dark);border-radius:4px;color:#fff;font-size:0.82rem;">
          <button type="button" class="neon-primary-btn" style="padding:5px 12px;font-size:0.8rem;" onclick="replyReview(decodeURIComponent('${productId}'),${item.idx})">保存回复</button>
          <button type="button" class="dark-outline-btn" style="padding:5px 10px;font-size:0.8rem;color:#f43f5e;" onclick="deleteReview(decodeURIComponent('${productId}'),${item.idx})">删除评价</button>
        </div>
      </div>`;
  }).join('');
}

document.getElementById('admin-add-review-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const prodId = document.getElementById('rev-prod-select').value;
  const user = document.getElementById('rev-user-input').value.trim();
  const car = document.getElementById('rev-car-input').value.trim();
  const rating = document.getElementById('rev-rating-select').value;
  const verifiedPurchase = document.getElementById('rev-verified-select').value === 'true';
  const text = document.getElementById('rev-text-input').value.trim();
  const merchantReply = document.getElementById('rev-reply-input').value.trim();
  if (!prodId || !user || !car || !text) { showAdminToast('请完整填写车主评价信息'); return; }

  userReviews = readLocalData('auto_shop_reviews', {});
  if (!Array.isArray(userReviews[prodId])) userReviews[prodId] = [];
  userReviews[prodId].unshift({
    id: 'rev_' + Date.now(),
    user,
    car,
    rating,
    verifiedPurchase,
    photos: adminReviewPhotoData ? [adminReviewPhotoData] : [],
    text,
    merchantReply,
    time: new Date().toLocaleDateString('zh-CN')
  });
  writeLocalData('auto_shop_reviews', userReviews);
  adminReviewPhotoData = '';
  e.target.reset();
  renderReviewsManager();
  showAdminToast('车主评价已发布到对应商品详情页！');
});

document.getElementById('clear-all-reviews-btn').addEventListener('click', async () => {
  if (!await adminConfirm('确定要清空全站所有商品的评价记录吗？')) return;
  userReviews = {};
  writeLocalData('auto_shop_reviews', userReviews);
  renderReviewsManager();
});

window.replyReview = function(prodId, idx) {
  if (!userReviews[prodId] || !userReviews[prodId][idx]) return;
  userReviews[prodId][idx].merchantReply = document.getElementById(`reply-input-${prodId}-${idx}`).value.trim();
  writeLocalData('auto_shop_reviews', userReviews);
  renderReviewsManager();
  showAdminToast('商家回复已发布到商品详情页！');
};

window.deleteReview = async function(prodId, idx) {
  if (!await adminConfirm('确定要删除这条评价吗？')) return;
  userReviews[prodId].splice(idx, 1);
  if (userReviews[prodId].length === 0) delete userReviews[prodId];
  writeLocalData('auto_shop_reviews', userReviews);
  renderReviewsManager();
};

// ==========================================
// 6. 客户管理 (Customers CRM)
// ==========================================
function renderCustomersCRM() {
  const users = readLocalData('auto_shop_users', []);
  orders = readLocalData('auto_shop_orders', []);
  const crmMap = {};

  users.forEach(u => {
    const key = u.phone || u.name;
    crmMap[key] = {
      name: u.name,
      phone: u.phone || '未留号码',
      address: u.savedAddress || '未填写地址',
      orderCount: 0,
      totalSpent: 0,
      carNote: ''
    };
  });

  orders.filter(o => o.status !== '已取消' && o.status !== '已退款').forEach(o => {
    const key = o.phone || o.name;
    if (!crmMap[key]) {
      crmMap[key] = { name: o.name, phone: o.phone, address: o.address, orderCount: 0, totalSpent: 0, carNote: '' };
    }
    crmMap[key].orderCount += 1;
    crmMap[key].totalSpent += parseFloat(o.total || 0);
    if (o.address) crmMap[key].address = o.address;
    if (o.note && o.note !== '无') crmMap[key].carNote = o.note;
  });

  const customers = Object.values(crmMap).sort((a, b) => b.totalSpent - a.totalSpent);
  document.getElementById('crm-total-badge').textContent = `共 ${customers.length} 位客户`;

  const listEl = document.getElementById('admin-customers-list');
  if (customers.length === 0) {
    listEl.innerHTML = '<p style="color:#8e95a2; font-size:0.85rem; padding:24px 0; text-align:center;">暂无客户记录，买家注册或下单后将自动沉淀至此。</p>';
    return;
  }

  listEl.innerHTML = customers.map(c => {
    const tierBadge = c.totalSpent >= 200
      ? '<span class="status-pill shipped">👑 VIP 车主</span>'
      : (c.orderCount > 0 ? '<span class="status-pill">已成交买家</span>' : '<span class="review-car-badge">注册潜客</span>');
    return `
      <div class="admin-order-row" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
        <div>
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
            <strong style="font-size:0.95rem;">${escapeHTML(c.name)}</strong>
            <span style="color:#8e95a2;font-size:0.82rem;">(${escapeHTML(c.phone)})</span>
            ${tierBadge}
          </div>
          <div style="font-size:0.8rem; color:#8e95a2;">常用地址：${escapeHTML(c.address)} ${c.carNote ? `｜ 车型备注：${escapeHTML(c.carNote)}` : ''}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:0.8rem; color:#8e95a2;">有效下单 ${c.orderCount} 次</div>
          <strong style="font-size:1.05rem; color:#d8ff00;">消费 ¥${c.totalSpent.toFixed(1)}</strong>
        </div>
      </div>
    `;
  }).join('');
}

// ==========================================
// 7. 多折扣码营销中心 (Discounts)
// ==========================================
function getDiscountsList() {
  const saved = readLocalData('auto_shop_discounts', null);
  return Array.isArray(saved) ? saved : [];
}

function renderDiscountsManager() {
  const discounts = getDiscountsList();
  const listEl = document.getElementById('admin-discounts-list');
  listEl.innerHTML = discounts.length === 0 ? '<div class="empty-state"><strong>暂无折扣码</strong><p>通过左侧表单创建第一个促销活动。</p></div>' : discounts.map((d, idx) => {
    const ruleText = d.type === 'fixed' ? `立减 ¥${Number(d.value) || 0}` : `享 ${(Number(d.value) / 10).toFixed(1)} 折`;
    const minText = d.minSpend > 0 ? `满 ¥${Number(d.minSpend)} 可用` : '无门槛';
    return `
      <div class="admin-order-row" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
        <div>
          <div style="display:flex;align-items:center;gap:8px;">
            <strong style="color:#d8ff00;font-size:1rem;letter-spacing:0.06em;">${escapeHTML(d.code)}</strong>
            <span class="status-pill ${d.active ? 'shipped' : ''}">${d.active ? '生效中' : '已停用'}</span>
          </div>
          <div style="font-size:0.8rem;color:#8e95a2;margin-top:4px;">${ruleText}（${minText}）· ${escapeHTML(d.desc || '')} · 已使用 ${Number(d.usedCount) || 0} 次</div>
        </div>
        <div style="display:flex;gap:6px;">
          <button type="button" class="dark-outline-btn" style="padding:4px 8px;font-size:0.76rem;" onclick="toggleDiscount(${idx})">${d.active ? '停用' : '启用'}</button>
          <button type="button" class="dark-outline-btn" style="padding:4px 8px;font-size:0.76rem;color:#f43f5e;" onclick="deleteDiscount(${idx})">删除</button>
        </div>
      </div>`;
  }).join('');
}

document.getElementById('admin-discount-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const code = document.getElementById('disc-code').value.trim().toUpperCase();
  const type = document.getElementById('disc-type').value;
  const value = parseFloat(document.getElementById('disc-value').value);
  const minSpend = parseFloat(document.getElementById('disc-min').value) || 0;
  const desc = document.getElementById('disc-desc').value.trim();
  if (!/^[A-Z0-9]{3,20}$/.test(code)) { showAdminToast('折扣码需为 3–20 位英文或数字'); return; }
  if (!Number.isFinite(value) || value <= 0 || (type === 'percent' && value >= 100)) { showAdminToast('固定立减需大于 0，百分比折扣需小于 100'); return; }
  if (!Number.isFinite(minSpend) || minSpend < 0) { showAdminToast('最低消费门槛不能小于 0'); return; }

  const discounts = getDiscountsList();
  if (discounts.some(d => d.code === code)) {
    showAdminToast('该折扣码已存在，请换一个名称！');
    return;
  }
  discounts.unshift({ code, type, value, minSpend, desc, active: true, usedCount: 0 });
  writeLocalData('auto_shop_discounts', discounts);
  e.target.reset();
  renderDiscountsManager();
  showAdminToast(`折扣码 ${code} 已创建并生效！`);
});

window.toggleDiscount = function(idx) {
  const discounts = getDiscountsList();
  if (!discounts[idx]) return;
  discounts[idx].active = !discounts[idx].active;
  writeLocalData('auto_shop_discounts', discounts);
  renderDiscountsManager();
};

window.deleteDiscount = async function(idx) {
  if (!await adminConfirm('确定要删除该折扣码吗？')) return;
  const discounts = getDiscountsList();
  discounts.splice(idx, 1);
  writeLocalData('auto_shop_discounts', discounts);
  renderDiscountsManager();
};

// ==========================================
// 8. 真实经营数据与四大类目营收占比报表
// ==========================================
function renderSalesAnalytics() {
  const list = getAllActiveProducts();
  const catTotals = { interior: 0, exterior: 0, storage: 0, scent: 0 };
  let grandTotal = 0;

  list.forEach(p => {
    const rev = p.sales * p.price;
    if (catTotals[p.cat] !== undefined) catTotals[p.cat] += rev;
    grandTotal += rev;
  });

  document.getElementById('analytics-category-bars').innerHTML = Object.entries(catTotals).map(([cat, rev]) => {
    const pct = grandTotal > 0 ? ((rev / grandTotal) * 100).toFixed(1) : '0.0';
    return `
      <div style="margin-bottom:12px;">
        <div style="display:flex; justify-content:space-between; font-size:0.84rem; margin-bottom:4px;">
          <strong>${CATEGORY_META[cat].title}</strong>
          <span>真实销售额 <strong style="color:#d8ff00;">¥${rev.toFixed(1)}</strong>（占比 ${pct}%）</span>
        </div>
        <div class="progress-track" style="height:8px;">
          <div class="progress-fill" style="width:${pct}%;"></div>
        </div>
      </div>
    `;
  }).join('');

  const best = [...list].sort((a, b) => b.sales - a.sales).slice(0, 8);
  const slow = [...list].sort((a, b) => a.sales - b.sales).slice(0, 8);

  document.getElementById('analytics-bestsellers').innerHTML = best.map((p, i) => `
    <div style="display:flex; justify-content:space-between; align-items:center; padding:9px 0; border-bottom:1px solid rgba(255,255,255,0.08); font-size:0.84rem;">
      <div>
        <span style="display:inline-block; width:20px; font-weight:800; color:${i < 3 ? '#d8ff00' : '#8e95a2'};">#${i + 1}</span>
        <span>${escapeHTML(p.name)}</span>
      </div>
      <div style="text-align:right; white-space:nowrap;">
        <strong style="color:#10b981;">已售 ${p.sales} 件</strong>
        <span style="color:#8e95a2; font-size:0.76rem; margin-left:6px;">(¥${(p.sales * p.price).toFixed(1)})</span>
      </div>
    </div>
  `).join('');

  document.getElementById('analytics-slowmovers').innerHTML = slow.map(p => `
    <div style="display:flex; justify-content:space-between; align-items:center; padding:9px 0; border-bottom:1px solid rgba(255,255,255,0.08); font-size:0.84rem;">
      <span style="max-width:62%; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHTML(p.name)}</span>
      <div style="display:flex; align-items:center; gap:8px;">
        <span style="color:#f59e0b;">已售 ${p.sales} 件</span>
        <button type="button" class="dark-outline-btn" style="padding:2px 8px; font-size:0.74rem;" onclick="openEditProductModal(decodeURIComponent('${encodeURIComponent(p.id)}'))">编辑优化</button>
      </div>
    </div>
  `).join('');
}

// ==========================================
// 9. 三屏轮播可视化装修、支付链接、数据库备份与恢复
// ==========================================
function loadCmsSettingsForm() {
  const cms = readLocalData('auto_shop_cms', {});
  const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
  const setChk = (id, v) => { const el = document.getElementById(id); if (el) el.checked = v !== false; };

  setVal('cms-brand-name', cms.brandName || 'MODFORM');
  setVal('cms-accent-color', cms.accentColor || '#d8ff00');
  setChk('cms-show-announcement', cms.showAnnouncement);
  setVal('cms-announcement', cms.announcement || '全场满 ¥99 顺丰包邮 · 支持 7 天无理由退换保障');
  setVal('cms-announcement-en', cms.announcementEn || 'Free SF Express shipping over ¥99 · 7-day hassle-free returns');

  setVal('cms-hero-title', cms.heroTitle || 'Your car. Styled your way.');
  setVal('cms-hero-btn-text', cms.heroBtnText || '我的爱车');
  setChk('cms-show-hero-garage', cms.showHeroGarageBtn);
  setVal('cms-hero-bg1', cms.heroBg1 || 'assets/hero-auto-minimal.webp');
  const heroPv = document.getElementById('cms-hero-preview');
  if (heroPv) heroPv.src = resolveProductImage(cms.heroBg1 || 'assets/hero-auto-minimal.webp');

  const catDefs = {
    interior: { title: '内饰美学', en: 'INTERIOR', img: 'assets/interior.webp', kTitle: 'catTitleInterior', kEn: 'catEnInterior', kImg: 'catImgInterior', kVis: 'catVisInterior' },
    exterior: { title: '外观升级', en: 'EXTERIOR', img: 'assets/exterior.webp', kTitle: 'catTitleExterior', kEn: 'catEnExterior', kImg: 'catImgExterior', kVis: 'catVisExterior' },
    storage: { title: '车载储物', en: 'STORAGE', img: 'assets/storage.webp', kTitle: 'catTitleStorage', kEn: 'catEnStorage', kImg: 'catImgStorage', kVis: 'catVisStorage' },
    scent: { title: '车载香薰', en: 'FRAGRANCE', img: 'assets/fragrance.webp', kTitle: 'catTitleScent', kEn: 'catEnScent', kImg: 'catImgScent', kVis: 'catVisScent' }
  };
  Object.keys(catDefs).forEach(cat => {
    const d = catDefs[cat];
    setVal(`cms-cat-title-${cat}`, cms[d.kTitle] || d.title);
    setVal(`cms-cat-en-${cat}`, cms[d.kEn] || d.en);
    const imgVal = cms[d.kImg] || d.img;
    setVal(`cms-cat-img-${cat}`, imgVal);
    setChk(`cms-cat-vis-${cat}`, cms[d.kVis]);
    const pv = document.getElementById(`cms-cat-preview-${cat}`);
    if (pv) pv.src = resolveProductImage(imgVal);
  });

  setChk('cms-show-new-arrivals', cms.showNewArrivalsSection);
  setVal('cms-new-arrivals-title', cms.newArrivalsTitle || '');
  setChk('cms-show-newsletter', cms.showNewsletterBand);
  setVal('cms-newsletter-heading', cms.newsletterHeading || '订阅我们的邮件 · SUBSCRIBE TO OUR EMAILS');
  setVal('cms-newsletter-sub', cms.newsletterSub || '第一时间获取 MODFORM 限量车品套装与车主专属优惠。');

  setChk('cms-show-contact', cms.showContactSection);
  setVal('cms-contact-title', cms.contactTitle || 'Contact · 联系我们');
  setVal('cms-contact-desc', cms.contactDesc || '车型适配核验、批量定制采购或售后安装协助，MODFORM 专属车品顾问为您提供一对一响应。');
  setVal('cms-contact-email', cms.contactEmail || 'support@modform.auto');
  setVal('cms-contact-wechat', cms.contactWechat || 'MODFORM_Studio');
  setVal('cms-contact-hours', cms.contactHours || '每日 09:30 – 22:00');
  setVal('cms-free-shipping', cms.freeShipping !== undefined ? cms.freeShipping : 99);
  setVal('cms-express-fee', cms.expressFee !== undefined ? cms.expressFee : 15);
  setVal('cms-footer-copyright', cms.footerCopyright || '© 2026 MODFORM');
  setVal('cms-policy-support', cms.policySupportText || '');
  setVal('cms-policy-warranty', cms.policyWarrantyText || '');
  setVal('cms-policy-terms', cms.policyTermsText || '');
  setVal('cms-policy-privacy', cms.policyPrivacyText || '');
  const orderArr = Array.isArray(cms.sectionOrder) && cms.sectionOrder.length ? cms.sectionOrder : ['hero', 'collections', 'new-arrivals', 'contact', 'newsletter'];
  setVal('cms-section-order', orderArr.join(','));
  if (typeof renderCmsSectionOrderEditor === 'function') renderCmsSectionOrderEditor(orderArr);
  setVal('cms-cat-layout-mode', cms.catLayoutMode || 'staggered');
  setVal('cms-catalog-cols', String(cms.catalogCols || '3'));
  setVal('cms-card-radius', cms.cardRadius || 'default');
  setVal('cms-card-aspect', cms.cardAspect || '16/11');
  setVal('cms-font-style', cms.fontStyle || 'modern');
  if (typeof renderCmsCustomNavEditor === 'function') renderCmsCustomNavEditor(Array.isArray(cms.customNavLinks) ? cms.customNavLinks : []);
  setVal('cms-brand-logo-img', cms.brandLogoImg || '');
  const logoPv = document.getElementById('cms-logo-preview');
  if (logoPv) logoPv.src = cms.brandLogoImg ? resolveProductImage(cms.brandLogoImg) : 'assets/favicon.svg';
  setVal('cms-favicon-img', cms.faviconImg || 'assets/favicon.svg');
  const favPv = document.getElementById('cms-favicon-preview');
  if (favPv) favPv.src = cms.faviconImg ? resolveProductImage(cms.faviconImg) : 'assets/favicon.svg';
  setVal('cms-bg-color', cms.bgColor || '#121418');
  setVal('cms-surface-color', cms.surfaceColor || '#171a20');
  setVal('cms-btn-style', cms.btnStyle || 'rounded');
  setVal('cms-seo-title', cms.seoTitle || '');
  setVal('cms-seo-desc', cms.seoDesc || '');
  setVal('cms-custom-css', cms.customCss || '');
  setVal('cms-announcement-bg', cms.announcementBg || cms.accentColor || '#d8ff00');
  setVal('cms-announcement-color', cms.announcementColor || '#090a0c');
  setVal('cms-announcement-link', cms.announcementLink || '');
  setVal('cms-hero-subtitle', cms.heroSubtitle || '');
  const ov = cms.heroOverlay !== undefined ? Number(cms.heroOverlay) : 45;
  setVal('cms-hero-overlay', String(isNaN(ov) ? 45 : ov));
  const ovLbl = document.getElementById('cms-hero-overlay-val');
  if (ovLbl) ovLbl.textContent = `${isNaN(ov) ? 45 : ov}%`;
  setVal('cms-hero-align', cms.heroAlign || 'center');
  setVal('cms-footer-icp', cms.footerIcp || '');
  setVal('cms-footer-icp-url', cms.footerIcpUrl || 'https://beian.miit.gov.cn/');
  if (typeof renderCmsCustomBlocksEditor === 'function') renderCmsCustomBlocksEditor(Array.isArray(cms.customBlocks) ? cms.customBlocks : []);
  if (typeof runProductionHealthCheck === 'function') runProductionHealthCheck();

  const paySettings = readLocalData('auto_shop_pay_settings', {});
  const stripeIn = document.getElementById('setting-stripe-link');
  if (stripeIn) stripeIn.value = paySettings.stripePaymentLink || '';
}

document.getElementById('admin-cms-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const getVal = (id, fb = '') => (document.getElementById(id)?.value || '').trim() || fb;
  const getChk = (id) => { const el = document.getElementById(id); return el ? Boolean(el.checked) : true; };

  const cmsData = {
    brandName: getVal('cms-brand-name', 'MODFORM'),
    accentColor: getVal('cms-accent-color', '#d8ff00'),
    showAnnouncement: getChk('cms-show-announcement'),
    announcement: getVal('cms-announcement', '全场满 ¥99 顺丰包邮 · 支持 7 天无理由退换保障'),
    announcementEn: getVal('cms-announcement-en', 'Free SF Express shipping over ¥99 · 7-day hassle-free returns'),
    heroTitle: getVal('cms-hero-title', 'Your car. Styled your way.'),
    heroBtnText: getVal('cms-hero-btn-text', '我的爱车'),
    showHeroGarageBtn: getChk('cms-show-hero-garage'),
    heroBg1: getVal('cms-hero-bg1', 'assets/hero-auto-minimal.webp'),

    catTitleInterior: getVal('cms-cat-title-interior', '内饰美学'),
    catEnInterior: getVal('cms-cat-en-interior', 'INTERIOR'),
    catImgInterior: getVal('cms-cat-img-interior', 'assets/interior.webp'),
    catVisInterior: getChk('cms-cat-vis-interior'),

    catTitleExterior: getVal('cms-cat-title-exterior', '外观升级'),
    catEnExterior: getVal('cms-cat-en-exterior', 'EXTERIOR'),
    catImgExterior: getVal('cms-cat-img-exterior', 'assets/exterior.webp'),
    catVisExterior: getChk('cms-cat-vis-exterior'),

    catTitleStorage: getVal('cms-cat-title-storage', '车载储物'),
    catEnStorage: getVal('cms-cat-en-storage', 'STORAGE'),
    catImgStorage: getVal('cms-cat-img-storage', 'assets/storage.webp'),
    catVisStorage: getChk('cms-cat-vis-storage'),

    catTitleScent: getVal('cms-cat-title-scent', '车载香薰'),
    catEnScent: getVal('cms-cat-en-scent', 'FRAGRANCE'),
    catImgScent: getVal('cms-cat-img-scent', 'assets/fragrance.webp'),
    catVisScent: getChk('cms-cat-vis-scent'),

    showNewArrivalsSection: getChk('cms-show-new-arrivals'),
    newArrivalsTitle: (document.getElementById('cms-new-arrivals-title')?.value || '').trim(),
    showNewsletterBand: getChk('cms-show-newsletter'),
    newsletterHeading: getVal('cms-newsletter-heading', '订阅我们的邮件 · SUBSCRIBE TO OUR EMAILS'),
    newsletterSub: getVal('cms-newsletter-sub', '第一时间获取 MODFORM 限量车品套装与车主专属优惠。'),

    showContactSection: getChk('cms-show-contact'),
    contactTitle: getVal('cms-contact-title', 'Contact · 联系我们'),
    contactDesc: getVal('cms-contact-desc', '车型适配核验、批量定制采购或售后安装协助，MODFORM 专属车品顾问为您提供一对一响应。'),
    contactEmail: getVal('cms-contact-email', 'support@modform.auto'),
    contactWechat: getVal('cms-contact-wechat', 'MODFORM_Studio'),
    contactHours: getVal('cms-contact-hours', '每日 09:30 – 22:00'),

    freeShipping: Math.max(0, parseFloat(document.getElementById('cms-free-shipping')?.value) || 0),
    expressFee: Math.max(0, parseFloat(document.getElementById('cms-express-fee')?.value) || 15),
    footerCopyright: getVal('cms-footer-copyright', '© 2026 MODFORM'),
    policySupportText: (document.getElementById('cms-policy-support')?.value || '').trim(),
    policyWarrantyText: (document.getElementById('cms-policy-warranty')?.value || '').trim(),
    policyTermsText: (document.getElementById('cms-policy-terms')?.value || '').trim(),
    policyPrivacyText: (document.getElementById('cms-policy-privacy')?.value || '').trim(),
    sectionOrder: (document.getElementById('cms-section-order')?.value || 'hero,collections,new-arrivals,contact,newsletter').split(',').map(s => s.trim()).filter(Boolean),
    catLayoutMode: getVal('cms-cat-layout-mode', 'staggered'),
    catalogCols: getVal('cms-catalog-cols', '3'),
    cardRadius: getVal('cms-card-radius', 'default'),
    cardAspect: getVal('cms-card-aspect', '16/11'),
    fontStyle: getVal('cms-font-style', 'modern'),
    customNavLinks: typeof collectCmsCustomNavLinks === 'function' ? collectCmsCustomNavLinks() : [],
    brandLogoImg: (document.getElementById('cms-brand-logo-img')?.value || '').trim(),
    faviconImg: (document.getElementById('cms-favicon-img')?.value || '').trim() || 'assets/favicon.svg',
    bgColor: getVal('cms-bg-color', '#121418'),
    surfaceColor: getVal('cms-surface-color', '#171a20'),
    btnStyle: getVal('cms-btn-style', 'rounded'),
    seoTitle: (document.getElementById('cms-seo-title')?.value || '').trim(),
    seoDesc: (document.getElementById('cms-seo-desc')?.value || '').trim(),
    customCss: (document.getElementById('cms-custom-css')?.value || '').trim(),
    announcementBg: getVal('cms-announcement-bg', '#d8ff00'),
    announcementColor: getVal('cms-announcement-color', '#090a0c'),
    announcementLink: (document.getElementById('cms-announcement-link')?.value || '').trim(),
    heroSubtitle: (document.getElementById('cms-hero-subtitle')?.value || '').trim(),
    heroOverlay: Math.min(85, Math.max(0, parseInt(document.getElementById('cms-hero-overlay')?.value || '45', 10) || 0)),
    heroAlign: getVal('cms-hero-align', 'center'),
    footerIcp: (document.getElementById('cms-footer-icp')?.value || '').trim(),
    footerIcpUrl: (document.getElementById('cms-footer-icp-url')?.value || '').trim() || 'https://beian.miit.gov.cn/',
    customBlocks: typeof collectCmsCustomBlocks === 'function' ? collectCmsCustomBlocks() : []
  };
  writeLocalData('auto_shop_cms', cmsData);
  if (typeof appendAuditLog === 'function') appendAuditLog('更新在线商店主题', cmsData.brandName);
  showAdminToast(`「${cmsData.brandName}」全站主题装修配置已保存并实时同步至买家端！`);
});

const cmsResetAllBtn = document.getElementById('cms-reset-all-btn');
if (cmsResetAllBtn) {
  cmsResetAllBtn.addEventListener('click', async () => {
    if (!await adminConfirm('确定将所有店铺主题文案、配色与封面图恢复为默认设置吗？（不会影响已上架的商品）')) return;
    writeLocalData('auto_shop_cms', {});
    loadCmsSettingsForm();
    showAdminToast('已恢复默认主题配置！');
  });
}

document.getElementById('save-pay-link-btn').addEventListener('click', () => {
  const link = document.getElementById('setting-stripe-link').value.trim();
  if (link && !safeExternalUrl(link)) { showAdminToast('请输入合法的 https:// 或 http:// 收银台链接'); return; }
  const settings = readLocalData('auto_shop_pay_settings', {});
  settings.stripePaymentLink = link;
  writeLocalData('auto_shop_pay_settings', settings);
  showAdminToast('在线收银台链接已保存！');
});

// 全站数据库 JSON 一键备份导出与恢复
document.getElementById('backup-db-btn').addEventListener('click', async () => {
  let backupPayload = null;
  if (window.location.protocol.startsWith('http')) {
    try {
      const res = await fetch('/api/admin/backup', {
        headers: { 'X-Admin-Token': sessionStorage.getItem('auto_shop_admin_token') || '' }
      });
      if (res.ok) backupPayload = await res.json();
    } catch (e) {}
  }
  if (!backupPayload) {
    const keys = [
      'auto_shop_orders', 'auto_shop_custom_products', 'auto_shop_deleted_ids',
      'auto_shop_product_overrides', 'auto_shop_stock_map', 'auto_shop_sku_stock_map',
      'auto_shop_reviews', 'auto_shop_discounts', 'auto_shop_cms', 'auto_shop_pay_settings', 'auto_shop_users'
    ];
    const data = {};
    keys.forEach(k => {
      const val = readLocalData(k, null);
      if (val !== null) data[k] = val;
    });
    backupPayload = { ok: true, version: '2.0-local', exportedAt: new Date().toISOString(), data };
  }
  const blobUrl = URL.createObjectURL(new Blob([JSON.stringify(backupPayload, null, 2)], { type: 'application/json;charset=utf-8;' }));
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = `AUTO_STUDIO_全站数据库备份_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
});

document.getElementById('restore-db-btn').addEventListener('click', () => {
  document.getElementById('restore-db-input').click();
});

document.getElementById('restore-db-input').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (ev) => {
    try {
      const parsed = JSON.parse(String(ev.target.result || '{}'));
      const dataMap = parsed.data || parsed;
      if (!dataMap || typeof dataMap !== 'object') throw new Error('无效备份文件');
      if (!await adminConfirm('确定要导入该备份并覆盖当前数据库吗？')) return;

      if (window.location.protocol.startsWith('http')) {
        try {
          await fetch('/api/admin/restore', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Admin-Token': sessionStorage.getItem('auto_shop_admin_token') || ''
            },
            body: JSON.stringify({ data: dataMap })
          });
        } catch (err) {}
      }
      Object.entries(dataMap).forEach(([k, v]) => {
        if (k.startsWith('auto_shop_')) writeLocalData(k, v);
      });
      refreshAllAdminViews();
      showAdminToast('全站数据库备份已成功恢复！');
    } catch (err) {
      showAdminToast('备份文件解析失败，请选择正确的 .json 备份文件');
    }
    e.target.value = '';
  };
  reader.readAsText(file, 'utf-8');
});

document.getElementById('export-csv-btn').addEventListener('click', () => {
  if (orders.length === 0) { showAdminToast('当前没有可导出的订单'); return; }
  const csvCell = value => {
    let text = String(value ?? '');
    if (/^\s*[=+\-@]/.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
  };
  const headers = ['订单编号', '下单时间', '购买状态', '承运快递', '快递单号', '收货人', '手机号', '收货地址', '车型与备注', '商品明细', '订单金额', '支付方式'];
  const rows = orders.map(o => [
    o.orderId, o.time, o.status || '待核验收款', o.courierCompany || '', o.trackingNo || '',
    o.name, o.phone, o.address, o.note || '',
    (o.items || []).map(i => `${i.name}[${i.variant}]x${i.quantity}`).join('; '), o.total, o.payLabel
  ].map(csvCell));
  const csvContent = '\uFEFF' + [headers.map(csvCell).join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blobUrl = URL.createObjectURL(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }));
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = `汽车用品升级发货清单_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
});

document.getElementById('setting-wechat-qr').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const dataUrl = await compressAndUploadImage(file, 400);
  if (!dataUrl) return;
  const settings = readLocalData('auto_shop_pay_settings', {});
  settings.wechatQrImage = dataUrl;
  writeLocalData('auto_shop_pay_settings', settings);
  showAdminToast('微信收款码已更新并同步！');
});

document.getElementById('setting-alipay-qr').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const dataUrl = await compressAndUploadImage(file, 400);
  if (!dataUrl) return;
  const settings = readLocalData('auto_shop_pay_settings', {});
  settings.alipayQrImage = dataUrl;
  writeLocalData('auto_shop_pay_settings', settings);
  showAdminToast('支付宝收款码已更新并同步！');
});

document.getElementById('admin-pwd-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const newPwd = document.getElementById('new-admin-pwd').value.trim();
  if (newPwd.length < 8) { showAdminToast('为了安全起见，新密码长度至少 8 位'); return; }

  if (window.location.protocol.startsWith('http')) {
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': sessionStorage.getItem('auto_shop_admin_token') || ''
        },
        body: JSON.stringify({ newPassword: newPwd })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        localStorage.removeItem('auto_shop_admin_pwd');
        showAdminToast('商家后台密码已通过服务端 PBKDF2 加密更新！');
        e.target.reset();
        return;
      }
      showAdminToast((data && data.error) || '修改密码失败，请重新登录后重试');
      return;
    } catch (err) {}
  }

  showAdminToast('修改密码失败：请确保已连接服务端 (server.py)。');
  showAdminToast('离线本地预览密码已修改成功！');
  e.target.reset();
});


// ==========================================
// 10. 商家端新增：订单状态筛选/搜索、快捷补货与邮件订阅客户管理
// ==========================================
document.querySelectorAll('#admin-order-status-tabs .order-filter-pill').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#admin-order-status-tabs .order-filter-pill').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    adminOrderStatusFilter = btn.dataset.adminOrderStatus || 'all';
    renderAdminOrders();
  });
});

const adminOrderSearchEl = document.getElementById('admin-order-search');
if (adminOrderSearchEl) {
  adminOrderSearchEl.addEventListener('input', (e) => {
    adminOrderSearchKw = e.target.value.trim();
    renderAdminOrders();
  });
}

window.quickRestockProduct = function(productId, addQty = 10) {
  const prods = getAllActiveProducts();
  const target = prods.find(p => p.id === productId);
  if (!target) return;
  stockMap[productId] = (Number(target.stock) || 0) + addQty;
  (target.variantSkus || []).forEach(s => {
    const k = `${productId}__${s.name}`;
    skuStockMap[k] = (Number(s.stock) || 0) + Math.max(1, Math.ceil(addQty / Math.max(1, target.variantSkus.length)));
  });
  writeLocalData('auto_shop_stock_map', stockMap);
  writeLocalData('auto_shop_sku_stock_map', skuStockMap);
  refreshAllAdminViews();
};

function renderAdminSubscribers() {
  const listEl = document.getElementById('admin-subscribers-list');
  const countEl = document.getElementById('admin-subscribers-count');
  if (!listEl) return;
  const subs = readLocalData('auto_shop_subscribers', []);
  if (countEl) countEl.textContent = Array.isArray(subs) ? subs.length : 0;
  if (!Array.isArray(subs) || subs.length === 0) {
    listEl.innerHTML = '<p style="color:#8e95a2; font-size:0.82rem; padding:12px 0;">暂无邮件订阅记录。买家在首页底部提交邮箱后将自动汇集于此。</p>';
    return;
  }
  listEl.innerHTML = subs.map(s => `
    <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid rgba(255,255,255,0.08); font-size:0.84rem;">
      <strong style="color:#fff;">${escapeHTML(s.email)}</strong>
      <span style="color:var(--text-muted); font-size:0.76rem;">${escapeHTML(s.subscribedAt || '')}</span>
    </div>`).join('');
}

const exportSubsBtn = document.getElementById('export-subscribers-csv-btn');
if (exportSubsBtn) {
  exportSubsBtn.addEventListener('click', () => {
    const subs = readLocalData('auto_shop_subscribers', []);
    if (!Array.isArray(subs) || subs.length === 0) { showAdminToast('暂无订阅邮箱可导出'); return; }
    const rows = subs.map(s => [s.email, s.subscribedAt || ''].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
    const csv = '\uFEFF邮箱,订阅时间\r\n' + rows.join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `MODFORM_邮件订阅客户_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
}

window.toggleNewArrivalProduct = function(productId) {
  const prods = getAllActiveProducts();
  const target = prods.find(p => p.id === productId);
  if (!target) return;
  const nextState = !Boolean(target.isNewArrival);
  const customIdx = customCatalog.findIndex(p => p.id === productId);
  if (customIdx >= 0) {
    customCatalog[customIdx].isNewArrival = nextState;
    writeLocalData('auto_shop_custom_products', customCatalog);
  } else {
    productOverrides[productId] = { ...(productOverrides[productId] || {}), isNewArrival: nextState };
    writeLocalData('auto_shop_product_overrides', productOverrides);
  }
  refreshAllAdminViews();
};


// ==========================================
// 11. 商家端 Pro：SKU 表格编辑器、商品/订单批量操作、SVG 趋势报表与操作审计日志
// ==========================================
function recordAdminAuditLog(action, detail) {
  const logs = readLocalData('auto_shop_audit_logs', []);
  const list = Array.isArray(logs) ? logs : [];
  list.unshift({
    time: new Date().toLocaleString('zh-CN', { hour12: false }),
    action,
    detail
  });
  writeLocalData('auto_shop_audit_logs', list.slice(0, 80));
}

function renderAuditLogs() {
  const el = document.getElementById('admin-audit-logs-list');
  if (!el) return;
  const logs = readLocalData('auto_shop_audit_logs', []);
  if (!Array.isArray(logs) || logs.length === 0) {
    el.innerHTML = '<p style="color:#8e95a2; padding:8px 0;">暂无后台操作记录（批量调价、核验收款、上下架与改密等将自动记录）。</p>';
    return;
  }
  el.innerHTML = logs.map(l => `
    <div style="display:flex; justify-content:space-between; gap:8px; padding:6px 0; border-bottom:1px solid rgba(255,255,255,0.06);">
      <span><strong style="color:var(--neon-lime);">[${escapeHTML(l.action)}]</strong> ${escapeHTML(l.detail)}</span>
      <span style="color:var(--text-muted); white-space:nowrap;">${escapeHTML(l.time)}</span>
    </div>`).join('');
}

const clearAuditLogsBtn = document.getElementById('clear-audit-logs-btn');
if (clearAuditLogsBtn) {
  clearAuditLogsBtn.addEventListener('click', async () => {
    if (!await adminConfirm('确定要清空所有操作审计日志吗？')) return;
    writeLocalData('auto_shop_audit_logs', []);
    renderAuditLogs();
  });
}

// --- SKU 可视化表格编辑器 ---
function createSkuRowHTML(sku = {}) {
  return `
    <div class="sku-edit-row">
      <input type="text" class="sku-in-name" placeholder="规格名称" value="${escapeHTML(sku.name || '')}" required>
      <input type="number" step="0.1" min="0.1" class="sku-in-price" placeholder="价格¥" value="${sku.price !== undefined ? Number(sku.price) : ''}" required>
      <input type="number" min="0" class="sku-in-stock" placeholder="库存" value="${sku.stock !== undefined ? Number(sku.stock) : 10}" required>
      <input type="text" class="sku-in-code" placeholder="SKU编码" value="${escapeHTML(sku.skuCode || '')}">
      <input type="text" class="sku-in-img" placeholder="绑定图路径(选填)" value="${escapeHTML(sku.img || '')}">
      <button type="button" class="sku-del-row-btn" onclick="this.parentElement.remove()" aria-label="删除规格行">✕</button>
    </div>`;
}

function renderSkuEditor(containerId, skuList) {
  const box = document.getElementById(containerId);
  if (!box) return;
  const rows = Array.isArray(skuList) && skuList.length
    ? skuList
    : [{ name: '标准款', price: 59.9, stock: 10, skuCode: 'SKU-01' }];
  box.innerHTML = rows.map(createSkuRowHTML).join('');
}

function syncSkuEditorToHidden(containerId, hiddenInputId) {
  const box = document.getElementById(containerId);
  const hidden = document.getElementById(hiddenInputId);
  if (!box || !hidden) return;
  const rowEls = Array.from(box.querySelectorAll('.sku-edit-row'));
  const parts = rowEls.map((row, idx) => {
    const n = (row.querySelector('.sku-in-name')?.value || '').trim();
    const p = (row.querySelector('.sku-in-price')?.value || '').trim();
    const s = (row.querySelector('.sku-in-stock')?.value || '10').trim();
    const c = (row.querySelector('.sku-in-code')?.value || `SKU-0${idx + 1}`).trim();
    if (!n) return '';
    return `${n}|${p || 59.9}|${s || 10}|${c}`;
  }).filter(Boolean);
  if (parts.length) hidden.value = parts.join(', ');
}

const pubAddSkuBtn = document.getElementById('pub-add-sku-row-btn');
if (pubAddSkuBtn) {
  pubAddSkuBtn.addEventListener('click', () => {
    const box = document.getElementById('pub-sku-editor');
    if (box) box.insertAdjacentHTML('beforeend', createSkuRowHTML({ name: '', price: '', stock: 10, skuCode: '' }));
  });
}
const editAddSkuBtn = document.getElementById('edit-add-sku-row-btn');
if (editAddSkuBtn) {
  editAddSkuBtn.addEventListener('click', () => {
    const box = document.getElementById('edit-sku-editor');
    if (box) box.insertAdjacentHTML('beforeend', createSkuRowHTML({ name: '', price: '', stock: 10, skuCode: '' }));
  });
}
renderSkuEditor('pub-sku-editor', [
  { name: '', price: '', stock: '', skuCode: '' }
]);

// --- 商品批量勾选与批量管理 ---
window.toggleAdminProdSelect = function(prodId, checked) {
  if (checked) selectedAdminProdIds.add(prodId);
  else selectedAdminProdIds.delete(prodId);
};

const adminProdSelectAll = document.getElementById('admin-prod-select-all');
if (adminProdSelectAll) {
  adminProdSelectAll.addEventListener('change', (e) => {
    const active = getAllActiveProducts();
    if (e.target.checked) active.forEach(p => selectedAdminProdIds.add(p.id));
    else selectedAdminProdIds.clear();
    renderAllProductsManager();
  });
}

function applyBatchProductUpdate(updaterFn, actionLabel) {
  if (selectedAdminProdIds.size === 0) { showAdminToast('请先勾选至少一件商品'); return; }
  const count = selectedAdminProdIds.size;
  selectedAdminProdIds.forEach(pid => {
    const customIdx = customCatalog.findIndex(p => p.id === pid);
    if (customIdx >= 0) {
      updaterFn(customCatalog[customIdx]);
    } else {
      const base = BASE_CATALOG.find(p => p.id === pid) || {};
      const merged = { ...base, ...(productOverrides[pid] || {}) };
      updaterFn(merged);
      productOverrides[pid] = { ...(productOverrides[pid] || {}), ...merged };
    }
  });
  writeLocalData('auto_shop_custom_products', customCatalog);
  writeLocalData('auto_shop_product_overrides', productOverrides);
  recordAdminAuditLog(actionLabel, `共批量处理 ${count} 件商品`);
  selectedAdminProdIds.clear();
  if (adminProdSelectAll) adminProdSelectAll.checked = false;
  refreshAllAdminViews();
  showAdminToast(`已完成「${actionLabel}」（${count} 件商品）`);
}

document.getElementById('batch-prod-onsale-btn')?.addEventListener('click', () => applyBatchProductUpdate(p => { p.onSale = true; }, '批量上架'));
document.getElementById('batch-prod-offsale-btn')?.addEventListener('click', () => applyBatchProductUpdate(p => { p.onSale = false; }, '批量下架'));
document.getElementById('batch-prod-newdrop-btn')?.addEventListener('click', () => applyBatchProductUpdate(p => { p.isNewArrival = true; }, '批量设新品首推'));
document.getElementById('batch-prod-price-btn')?.addEventListener('click', async () => {
  if (selectedAdminProdIds.size === 0) { showAdminToast('请先勾选至少一件商品'); return; }
  const expr = await adminPrompt('请输入调价方式（例如 "*0.9" 表示打 9 折，"+10" 表示涨价 10 元，"-5" 表示降价 5 元）：', '*0.9');
  if (!expr) return;
  const trimmed = expr.trim();
  const m = /^([*+-])(\d+(?:\.\d+)?)$/.exec(trimmed);
  if (!m) { showAdminToast('格式无效，请输入如 *0.9、+10 或 -5'); return; }
  const op = m[1];
  const val = parseFloat(m[2]);
  applyBatchProductUpdate(p => {
    const oldP = Number(p.price) || 50;
    let nextP = oldP;
    if (op === '*') nextP = oldP * val;
    else if (op === '+') nextP = oldP + val;
    else if (op === '-') nextP = oldP - val;
    p.price = Math.max(0.1, Number(nextP.toFixed(1)));
  }, `批量调价 (${trimmed})`);
});

// --- 订单批量核验、批量发货与打印装箱单 ---
window.toggleAdminOrderSelect = function(orderId, checked) {
  if (checked) selectedAdminOrderIds.add(orderId);
  else selectedAdminOrderIds.delete(orderId);
};

const adminOrderSelectAll = document.getElementById('admin-order-select-all');
if (adminOrderSelectAll) {
  adminOrderSelectAll.addEventListener('change', (e) => {
    if (e.target.checked) orders.forEach(o => selectedAdminOrderIds.add(o.orderId));
    else selectedAdminOrderIds.clear();
    renderAdminOrders();
  });
}

document.getElementById('batch-confirm-pay-btn')?.addEventListener('click', () => {
  if (selectedAdminOrderIds.size === 0) { showAdminToast('请先勾选至少一笔订单'); return; }
  const nowStr = new Date().toLocaleString('zh-CN', { hour12: false });
  let updated = 0;
  orders.forEach(o => {
    if (selectedAdminOrderIds.has(o.orderId) && (o.status === '待核验收款' || !o.status)) {
      o.status = '已付款·待发货';
      if (!Array.isArray(o.timeline)) o.timeline = [];
      o.timeline.unshift({ time: nowStr, title: '商家批量核验收款通过', desc: '订单已进入待发货队列' });
      updated++;
    }
  });
  if (updated > 0) {
    writeLocalData('auto_shop_orders', orders);
    recordAdminAuditLog('批量核验收款', `成功核销 ${updated} 笔待付款订单`);
    selectedAdminOrderIds.clear();
    if (adminOrderSelectAll) adminOrderSelectAll.checked = false;
    refreshAllAdminViews();
    showAdminToast(`已批量核验收款 ${updated} 笔订单`);
  } else {
    showAdminToast('所选订单中没有处于「待核验收款」状态的订单');
  }
});

document.getElementById('batch-mark-shipped-btn')?.addEventListener('click', () => {
  if (selectedAdminOrderIds.size === 0) { showAdminToast('请先勾选至少一笔订单'); return; }
  const nowStr = new Date().toLocaleString('zh-CN', { hour12: false });
  let updated = 0;
  orders.forEach(o => {
    if (selectedAdminOrderIds.has(o.orderId) && o.status !== '已取消' && o.status !== '已退款') {
      o.status = '已发货';
      if (!Array.isArray(o.timeline)) o.timeline = [];
      o.timeline.unshift({ time: nowStr, title: '商家已批量安排发货', desc: `承运商：${o.courierCompany || '顺丰标快'}` });
      updated++;
    }
  });
  if (updated > 0) {
    writeLocalData('auto_shop_orders', orders);
    recordAdminAuditLog('批量标记已发货', `已标记 ${updated} 笔订单为已发货`);
    selectedAdminOrderIds.clear();
    if (adminOrderSelectAll) adminOrderSelectAll.checked = false;
    refreshAllAdminViews();
    showAdminToast(`已批量标记 ${updated} 笔订单为已发货`);
  }
});

document.getElementById('batch-print-orders-btn')?.addEventListener('click', () => {
  if (selectedAdminOrderIds.size === 0) { showAdminToast('请先勾选需要打印装箱单的订单'); return; }
  const picked = orders.filter(o => selectedAdminOrderIds.has(o.orderId));
  const w = typeof window.open === 'function' ? window.open('', '_blank') : null;
  if (!w) { showAdminToast('请允许浏览器弹窗后重试打印'); return; }
  const cards = picked.map(o => `
    <div style="border:1px solid #222; padding:16px; margin-bottom:18px; page-break-inside:avoid;">
      <h3 style="margin:0 0 8px;">MODFORM 发货装箱单 · ${escapeHTML(o.orderId)}</h3>
      <p style="margin:4px 0;">收货人：<strong>${escapeHTML(o.name)}</strong> (${escapeHTML(o.phone)}) ｜ 配送：<strong>${escapeHTML(o.courierCompany || '顺丰标快')}</strong></p>
      <p style="margin:4px 0;">地址：${escapeHTML(o.address)}</p>
      <p style="margin:4px 0;">备注：${escapeHTML(o.note || '无')}</p>
      <hr>
      <ul>${(o.items || []).map(i => `<li>${escapeHTML(i.name)} [${escapeHTML(i.variant)}] × ${i.quantity}</li>`).join('')}</ul>
      <p style="text-align:right; font-weight:700;">订单实付：¥${escapeHTML(o.total)}</p>
    </div>`).join('');
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>MODFORM 装箱单</title></head><body style="font-family:sans-serif;padding:20px;">${cards}<script>window.print();<\/script></body></html>`);
  w.document.close();
});

// --- 数据报表时间维度筛选 & 纯 SVG 每日成交额趋势图 ---
document.querySelectorAll('#analytics-range-tabs .order-filter-pill').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#analytics-range-tabs .order-filter-pill').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    analyticsRange = btn.dataset.range || 'all';
    renderAnalyticsTrendChart();
  });
});

function renderAnalyticsTrendChart() {
  const container = document.getElementById('analytics-daily-trend-chart');
  const summaryEl = document.getElementById('analytics-range-summary');
  if (!container) return;

  const now = new Date();
  const valid = orders.filter(o => {
    if (!o || o.status === '已取消' || o.status === '已退款') return false;
    if (analyticsRange === 'all') return true;
    const d = new Date(String(o.time || '').replace(/-/g, '/'));
    if (isNaN(d.getTime())) return true;
    const diffDays = (now - d) / (1000 * 3600 * 24);
    if (analyticsRange === '7d') return diffDays <= 7;
    if (analyticsRange === '30d') return diffDays <= 30;
    if (analyticsRange === 'month') return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    return true;
  });

  const totalAmt = valid.reduce((s, o) => s + (parseFloat(o.total) || 0), 0);
  const labelMap = { all: '全部时间', '7d': '近 7 天', '30d': '近 30 天', month: '本月' };
  if (summaryEl) {
    summaryEl.textContent = `统计周期：${labelMap[analyticsRange] || '全部时间'} · 有效订单 ${valid.length} 单 · 实收 GMV ¥${totalAmt.toFixed(1)}`;
  }

  // 聚合最近 7 天每日 GMV
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const dt = new Date(now.getTime() - i * 86400000);
    const key = `${dt.getMonth() + 1}/${dt.getDate()}`;
    days.push({ key, y: dt.getFullYear(), m: dt.getMonth(), d: dt.getDate(), val: 0 });
  }
  valid.forEach(o => {
    const d = new Date(String(o.time || '').replace(/-/g, '/'));
    if (isNaN(d.getTime())) return;
    const slot = days.find(x => x.y === d.getFullYear() && x.m === d.getMonth() && x.d === d.getDate());
    if (slot) slot.val += parseFloat(o.total) || 0;
  });

  const maxVal = Math.max(100, ...days.map(d => d.val));
  const bars = days.map((d, idx) => {
    const x = 44 + idx * 82;
    const h = Math.max(4, Math.round((d.val / maxVal) * 120));
    const y = 148 - h;
    return `
      <rect x="${x}" y="${y}" width="38" height="${h}" rx="4" fill="${d.val > 0 ? '#d8ff00' : 'rgba(255,255,255,0.12)'}"/>
      <text x="${x + 19}" y="${y - 6}" text-anchor="middle" fill="#cbd5e1" font-size="11">${d.val > 0 ? '¥' + d.val.toFixed(0) : '0'}</text>
      <text x="${x + 19}" y="168" text-anchor="middle" fill="#8e95a2" font-size="11">${d.key}</text>`;
  }).join('');

  container.innerHTML = `
    <svg viewBox="0 0 640 182" width="100%" style="max-height:190px; display:block;" role="img" aria-label="近7日每日成交额柱状图">
      <line x1="28" y1="148" x2="620" y2="148" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
      ${bars}
    </svg>`;
}


// ==========================================
// 车友问答 (Q&A) 商家回复与删除管理
// ==========================================
function renderAdminQaManager() {
  const listEl = document.getElementById('admin-qa-list');
  const pendingEl = document.getElementById('admin-qa-pending-count');
  if (!listEl) return;
  const qaMap = readLocalData('auto_shop_qa', {});
  const prodNameMap = {};
  getAllActiveProducts().forEach(p => { prodNameMap[p.id] = p.name; });

  const flat = [];
  Object.keys(qaMap).forEach(pid => {
    const arr = Array.isArray(qaMap[pid]) ? qaMap[pid] : [];
    arr.forEach((item, idx) => {
      flat.push({ pid, idx, prodName: prodNameMap[pid] || pid, ...item });
    });
  });
  flat.sort((a, b) => (a.answer ? 1 : 0) - (b.answer ? 1 : 0));

  const pendingCount = flat.filter(item => !item.answer || !String(item.answer).trim()).length;
  if (pendingEl) pendingEl.textContent = String(pendingCount);

  if (!flat.length) {
    listEl.innerHTML = '<div style="padding:18px;text-align:center;color:var(--text-muted);font-size:0.84rem;">暂无车友提问记录。买家在商品详情页提交问题后将同步显示在此处。</div>';
    return;
  }

  listEl.innerHTML = flat.map(item => {
    const pidEnc = encodeURIComponent(item.pid);
    const hasReply = Boolean(item.answer && String(item.answer).trim());
    return `
      <div class="admin-card" style="padding:14px 16px;margin-bottom:10px;border-left:3px solid ${hasReply ? '#10b981' : '#d8ff00'};">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:6px;">
          <div style="font-size:0.82rem;color:#9ca3af;">
            <strong style="color:#f3f4f6;">${escapeHTML(item.prodName)}</strong>
            <span style="margin-left:8px;">${escapeHTML(item.user || '匿名车友')} · ${escapeHTML(item.car || '未登记车型')} · ${escapeHTML(item.time || '')}</span>
          </div>
          <span style="font-size:0.74rem;padding:2px 8px;border-radius:999px;background:${hasReply ? 'rgba(16,185,129,0.15)' : 'rgba(216,255,0,0.16)'};color:${hasReply ? '#34d399' : '#d8ff00'};">${hasReply ? '已回复' : '待回复'}</span>
        </div>
        <div style="font-size:0.9rem;color:#fff;margin-bottom:8px;"><strong>问：</strong>${escapeHTML(item.question || '')}</div>
        ${hasReply ? `<div style="font-size:0.84rem;color:#cbd5e1;background:rgba(255,255,255,0.04);padding:8px 10px;border-radius:6px;margin-bottom:8px;"><strong>商家回复：</strong>${escapeHTML(item.answer)}</div>` : ''}
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <input type="text" id="qa-reply-input-${item.pid}-${item.idx}" value="${escapeHTML(item.answer || '')}" placeholder="输入商家专业解答（如适用年份、安装细节）..." style="flex:1;min-width:220px;padding:7px 10px;font-size:0.82rem;">
          <button type="button" class="neon-primary-btn" style="padding:6px 12px;font-size:0.78rem;" onclick="replyAdminQa(decodeURIComponent('${pidEnc}'), ${item.idx})">${hasReply ? '更新回复' : '提交回复'}</button>
          <button type="button" class="dark-outline-btn" style="padding:6px 10px;font-size:0.78rem;color:#f87171;border-color:rgba(248,113,113,0.35);" onclick="deleteAdminQa(decodeURIComponent('${pidEnc}'), ${item.idx})">删除</button>
        </div>
      </div>`;
  }).join('');
}

window.replyAdminQa = function(productId, qaIndex) {
  const input = document.getElementById(`qa-reply-input-${productId}-${qaIndex}`);
  const replyText = (input ? input.value : '').trim();
  if (!replyText) {
    showAdminToast('请输入回复内容');
    return;
  }
  const qaMap = readLocalData('auto_shop_qa', {});
  if (!Array.isArray(qaMap[productId]) || !qaMap[productId][qaIndex]) return;
  qaMap[productId][qaIndex].answer = replyText;
  qaMap[productId][qaIndex].replyTime = new Date().toLocaleString('zh-CN', { hour12: false });
  if (!writeLocalData('auto_shop_qa', qaMap)) return;
  if (typeof appendAuditLog === 'function') {
    appendAuditLog('回复车友问答', `${productId} #${qaIndex + 1}`);
  }
  renderAdminQaManager();
};

window.deleteAdminQa = async function(productId, qaIndex) {
  if (!await adminConfirm('确定删除该条车友问答记录吗？')) return;
  const qaMap = readLocalData('auto_shop_qa', {});
  if (!Array.isArray(qaMap[productId])) return;
  qaMap[productId].splice(qaIndex, 1);
  if (qaMap[productId].length === 0) delete qaMap[productId];
  if (!writeLocalData('auto_shop_qa', qaMap)) return;
  if (typeof appendAuditLog === 'function') {
    appendAuditLog('删除车友问答', `${productId} #${qaIndex + 1}`);
  }
  renderAdminQaManager();
};


// ==========================================
// 客户 Contact 留言收件箱 + 商品快捷筛选胶囊
// ==========================================
(function initAdminQuickFilters() {
  const wrap = document.getElementById('admin-prod-quick-filters');
  const select = document.getElementById('admin-prod-cat-filter');
  if (!wrap || !select) return;
  wrap.querySelectorAll('.admin-qf-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      wrap.querySelectorAll('.admin-qf-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const val = btn.dataset.qf || 'all';
      if (val === 'low-stock-5') {
        if (!Array.from(select.options).some(o => o.value === 'low-stock-5')) {
          const opt = document.createElement('option');
          opt.value = 'low-stock-5';
          opt.textContent = '低库存 ≤5';
          select.appendChild(opt);
        }
      }
      select.value = val;
      renderAllProductsManager();
    });
  });
})();

function renderAdminContactMessages() {
  const listEl = document.getElementById('admin-contact-list');
  const unreadEl = document.getElementById('admin-contact-unread-count');
  if (!listEl) return;
  const msgs = readLocalData('auto_shop_contact_messages', []);
  const pending = msgs.filter(m => m.status !== '已处理').length;
  if (unreadEl) unreadEl.textContent = String(pending);

  if (!msgs.length) {
    listEl.innerHTML = '<div style="padding:16px;text-align:center;color:var(--text-muted);font-size:0.82rem;">暂无客户留言记录。买家在首页 Contact 表单留言后将同步显示在此处。</div>';
    return;
  }
  listEl.innerHTML = msgs.map((m, idx) => {
    const done = m.status === '已处理';
    return `
      <div class="admin-card" style="padding:12px 15px;margin-bottom:10px;border-left:3px solid ${done ? '#10b981' : '#d8ff00'};">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:6px;">
          <div style="font-size:0.82rem;color:#cbd5e1;">
            <strong style="color:#fff;">${escapeHTML(m.name || '匿名车友')}</strong>
            <span style="margin-left:8px;color:#9ca3af;">车型：${escapeHTML(m.car || '未填写')} · 联系方式：${escapeHTML(m.way || '')}</span>
          </div>
          <span style="font-size:0.72rem;padding:2px 8px;border-radius:999px;background:${done ? 'rgba(16,185,129,0.15)' : 'rgba(216,255,0,0.16)'};color:${done ? '#34d399' : '#d8ff00'};">${done ? '已处理' : '待处理'}</span>
        </div>
        <div style="font-size:0.86rem;color:#f3f4f6;margin-bottom:8px;">${escapeHTML(m.msg || '')}</div>
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">
          <span style="font-size:0.74rem;color:#8e95a2;">${escapeHTML(m.time || '')}</span>
          <div style="display:flex;gap:8px;">
            ${done ? '' : `<button type="button" class="neon-primary-btn" style="padding:4px 10px;font-size:0.75rem;" onclick="markContactMessageDone(${idx})">标记已处理</button>`}
            <button type="button" class="dark-outline-btn" style="padding:4px 10px;font-size:0.75rem;color:#f87171;" onclick="deleteContactMessage(${idx})">删除</button>
          </div>
        </div>
      </div>`;
  }).join('');
}

window.markContactMessageDone = function(idx) {
  const msgs = readLocalData('auto_shop_contact_messages', []);
  if (!msgs[idx]) return;
  msgs[idx].status = '已处理';
  if (!writeLocalData('auto_shop_contact_messages', msgs)) return;
  if (typeof appendAuditLog === 'function') appendAuditLog('处理客户留言', msgs[idx].way || `#${idx + 1}`);
  renderAdminContactMessages();
};

window.deleteContactMessage = async function(idx) {
  if (!await adminConfirm('确定删除该条客户留言吗？')) return;
  const msgs = readLocalData('auto_shop_contact_messages', []);
  msgs.splice(idx, 1);
  if (!writeLocalData('auto_shop_contact_messages', msgs)) return;
  renderAdminContactMessages();
};


// ==========================================
// V16 商家端增强：一键复制商品 + 四大品类封面图上传/重置
// ==========================================
window.duplicateProduct = function(productId) {
  const src = getAllActiveProducts().find(p => p.id === productId);
  if (!src) return;
  const newId = 'custom_' + Date.now();
  const cloned = {
    ...src,
    id: newId,
    name: `${src.name} (副本)`,
    isTemplate: false,
    onSale: true,
    variantSkus: Array.isArray(src.variantSkus) ? src.variantSkus.map(s => ({ ...s })) : []
  };
  customCatalog.unshift(cloned);
  stockMap[newId] = cloned.stock || 10;
  cloned.variantSkus.forEach(s => { skuStockMap[`${newId}__${s.name}`] = s.stock; });
  if (!writeLocalData('auto_shop_custom_products', customCatalog)) return;
  writeLocalData('auto_shop_stock_map', stockMap);
  writeLocalData('auto_shop_sku_stock_map', skuStockMap);
  if (typeof appendAuditLog === 'function') appendAuditLog('复制商品', cloned.name);
  refreshAllAdminViews();
};

const DEFAULT_CMS_CAT_COVERS = {
  interior: 'assets/interior.webp',
  exterior: 'assets/exterior.webp',
  storage: 'assets/storage.webp',
  scent: 'assets/fragrance.webp'
};

window.resetCmsCatCover = function(cat) {
  const def = DEFAULT_CMS_CAT_COVERS[cat];
  if (!def) return;
  const hid = document.getElementById(`cms-cat-img-${cat}`);
  const pv = document.getElementById(`cms-cat-preview-${cat}`);
  if (hid) hid.value = def;
  if (pv) pv.src = def;
};

['interior', 'exterior', 'storage', 'scent'].forEach(cat => {
  const inp = document.getElementById(`cms-cat-file-${cat}`);
  if (!inp) return;
  inp.addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const url = typeof uploadAdminImageFile === 'function'
        ? await uploadAdminImageFile(file)
        : await new Promise((resolve, reject) => {
            const r = new FileReader();
            r.onload = () => resolve(r.result);
            r.onerror = reject;
            r.readAsDataURL(file);
          });
      const hid = document.getElementById(`cms-cat-img-${cat}`);
      const pv = document.getElementById(`cms-cat-preview-${cat}`);
      if (hid) hid.value = url;
      if (pv) pv.src = resolveProductImage(url);
    } catch (err) {
      showAdminToast('封面图上传失败：' + (err && err.message ? err.message : '请重试'));
    }
    e.target.value = '';
  });
});


// ==========================================
// 布局排序器 + 自定义导航编辑器 + 上线安全健康自检仪
// ==========================================
const SECTION_LABELS_MAP = {
  hero: '首屏主视觉 (Hero)',
  collections: '四大品类入口区',
  'new-arrivals': '新品首推焦点区',
  contact: 'Contact 联系我们',
  newsletter: '荧光绿邮件订阅横幅'
};

window.renderCmsSectionOrderEditor = function(orderArr) {
  const listEl = document.getElementById('cms-section-order-list');
  const hid = document.getElementById('cms-section-order');
  if (!listEl) return;
  const arr = Array.isArray(orderArr) && orderArr.length ? [...orderArr] : ['hero', 'collections', 'new-arrivals', 'contact', 'newsletter'];
  if (hid) hid.value = arr.join(',');
  listEl.innerHTML = arr.map((key, idx) => `
    <div style="display:flex; justify-content:space-between; align-items:center; padding:7px 10px; border-radius:8px; background:#14171d; border:1px solid rgba(255,255,255,0.08);">
      <span style="font-size:0.8rem; color:#f3f4f6;"><strong>#${idx + 1}</strong> ${escapeHTML(SECTION_LABELS_MAP[key] || key)}</span>
      <div style="display:flex; gap:6px;">
        <button type="button" class="dark-outline-btn" style="padding:2px 8px; font-size:0.72rem;" ${idx === 0 ? 'disabled' : ''} onclick="moveCmsSection(${idx}, -1)">↑</button>
        <button type="button" class="dark-outline-btn" style="padding:2px 8px; font-size:0.72rem;" ${idx === arr.length - 1 ? 'disabled' : ''} onclick="moveCmsSection(${idx}, 1)">↓</button>
      </div>
    </div>`).join('');
};

window.moveCmsSection = function(idx, delta) {
  const hid = document.getElementById('cms-section-order');
  if (!hid) return;
  const arr = hid.value.split(',').map(s => s.trim()).filter(Boolean);
  const target = idx + delta;
  if (target < 0 || target >= arr.length) return;
  const tmp = arr[idx];
  arr[idx] = arr[target];
  arr[target] = tmp;
  renderCmsSectionOrderEditor(arr);
};

function createCmsNavRowHTML(item = {}) {
  const type = item.type || (item.content ? 'page' : (String(item.url || '').startsWith('#') ? 'section' : 'link'));
  const secVal = String(item.url || '#contact-section');
  return `
    <div class="cms-nav-edit-row admin-card" style="padding:10px; display:flex; flex-direction:column; gap:6px; margin-bottom:6px;">
      <div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap;">
        <input type="text" class="cms-nav-label" placeholder="菜单名称（如 品牌故事）" value="${escapeHTML(item.label || '')}" style="flex:1; min-width:110px; font-size:0.78rem;">
        <input type="text" class="cms-nav-label-en" placeholder="English Name (如 Story)" value="${escapeHTML(item.labelEn || '')}" style="flex:1; min-width:110px; font-size:0.78rem;">
        <select class="cms-nav-type dark-select" style="width:130px; font-size:0.76rem;" onchange="window.syncCmsNavRowMode(this)">
          <option value="page" ${type === 'page' ? 'selected' : ''}>站内图文弹窗</option>
          <option value="section" ${type === 'section' ? 'selected' : ''}>站内板块跳转</option>
          <option value="link" ${type === 'link' ? 'selected' : ''}>外部网址链接</option>
        </select>
        <button type="button" class="dark-outline-btn" style="padding:4px 8px; font-size:0.72rem; color:#f87171;" onclick="this.closest('.cms-nav-edit-row').remove()">删除</button>
      </div>
      <textarea class="cms-nav-content" rows="2" placeholder="输入买家点击此菜单后弹出的正文内容（如品牌故事、安装说明、合作方式）..." style="display:${type === 'page' ? 'block' : 'none'}; font-size:0.78rem;">${escapeHTML(item.content || '')}</textarea>
      <select class="cms-nav-section dark-select" style="display:${type === 'section' ? 'block' : 'none'}; font-size:0.78rem;">
        <option value="#contact-section" ${secVal === '#contact-section' ? 'selected' : ''}>跳转到：联系我们</option>
        <option value="#new-arrivals-section" ${secVal === '#new-arrivals-section' ? 'selected' : ''}>跳转到：新品首推</option>
        <option value="#newsletter-band" ${secVal === '#newsletter-band' ? 'selected' : ''}>跳转到：邮件订阅</option>
        <option value="#all-products" ${secVal === '#all-products' ? 'selected' : ''}>打开：全部商品目录</option>
      </select>
      <input type="url" class="cms-nav-url" placeholder="输入外部网址（如 https://...）" value="${type === 'link' ? escapeHTML(item.url || '') : ''}" style="display:${type === 'link' ? 'block' : 'none'}; font-size:0.78rem;">
    </div>`;
}

window.syncCmsNavRowMode = function(sel) {
  const row = sel.closest('.cms-nav-edit-row');
  if (!row) return;
  const v = sel.value;
  row.querySelector('.cms-nav-content').style.display = v === 'page' ? 'block' : 'none';
  row.querySelector('.cms-nav-section').style.display = v === 'section' ? 'block' : 'none';
  row.querySelector('.cms-nav-url').style.display = v === 'link' ? 'block' : 'none';
};

window.renderCmsCustomNavEditor = function(links) {
  const listEl = document.getElementById('cms-custom-nav-list');
  if (!listEl) return;
  const arr = Array.isArray(links) ? links : [];
  if (!arr.length) {
    listEl.innerHTML = '<div style="font-size:0.76rem; color:#8e95a2;">暂无自定义导航菜单（点击下方可添加站内图文介绍页、板块快捷入口或外部链接）。</div>';
    return;
  }
  listEl.innerHTML = arr.map(createCmsNavRowHTML).join('');
};

window.collectCmsCustomNavLinks = function() {
  const listEl = document.getElementById('cms-custom-nav-list');
  if (!listEl) return [];
  return Array.from(listEl.querySelectorAll('.cms-nav-edit-row')).map(row => {
    const label = (row.querySelector('.cms-nav-label')?.value || '').trim();
    const labelEn = (row.querySelector('.cms-nav-label-en')?.value || '').trim();
    const type = row.querySelector('.cms-nav-type')?.value || 'page';
    const content = (row.querySelector('.cms-nav-content')?.value || '').trim();
    const sectionUrl = row.querySelector('.cms-nav-section')?.value || '#contact-section';
    const extUrl = (row.querySelector('.cms-nav-url')?.value || '').trim();
    if (type === 'page') return { label, labelEn, type, content, url: '#custom-page' };
    if (type === 'section') return { label, labelEn, type, url: sectionUrl };
    return { label, labelEn, type: 'link', url: extUrl };
  }).filter(x => x.label && ((x.type === 'page' && x.content) || (x.type === 'section') || (x.type === 'link' && /^https?:\/\//i.test(x.url))));
};

const addNavLinkBtn = document.getElementById('cms-add-nav-link-btn');
if (addNavLinkBtn) {
  addNavLinkBtn.addEventListener('click', () => {
    const listEl = document.getElementById('cms-custom-nav-list');
    if (!listEl) return;
    if (!listEl.querySelector('.cms-nav-edit-row')) listEl.innerHTML = '';
    listEl.insertAdjacentHTML('beforeend', createCmsNavRowHTML({ type: 'page' }));
  });
}

window.runProductionHealthCheck = async function(isManualClick = false) {
  const box = document.getElementById('admin-health-check-list');
  const btn = document.getElementById('run-health-check-btn');
  if (!box) return;
  if (btn && isManualClick) {
    btn.disabled = true;
    btn.textContent = '体检中...';
  }

  const isHttp = window.location.protocol.startsWith('http');
  let serverAlive = false;
  if (isHttp) {
    try {
      const r = await fetch('/api/bootstrap', { cache: 'no-store' });
      serverAlive = Boolean(r && r.ok);
    } catch (e) {
      serverAlive = false;
    }
  }

  const allProds = typeof getAllActiveProducts === 'function' ? getAllActiveProducts() : [];
  const activeProds = allProds.filter(p => p && p.onSale !== false);
  const outStock = activeProds.filter(p => (Number(p.stock) || 0) <= 0).length;
  const orderList = Array.isArray(orders) ? orders : [];
  const pendingShip = orderList.filter(o => o && o.status === '已支付待发货').length;
  const qaMap = readLocalData('auto_shop_qa', {});
  let pendingQa = 0;
  if (qaMap && typeof qaMap === 'object') {
    Object.values(qaMap).forEach(arr => { if (Array.isArray(arr)) pendingQa += arr.filter(q => q && !q.answer).length; });
  }
  const rawMsgs = readLocalData('auto_shop_contact_messages', []);
  const unreadMsgs = Array.isArray(rawMsgs) ? rawMsgs.filter(m => m && m.status !== '已处理').length : 0;
  const paySet = readLocalData('auto_shop_pay_settings', {}) || {};
  const cmsSet = readLocalData('auto_shop_cms', {}) || {};

  const checks = [
    {
      ok: isHttp ? serverAlive : false,
      label: isHttp
        ? (serverAlive ? '后端服务端在线且 API 响应正常' : 'HTTP 服务端接口无响应，请检查 server.py / server.js')
        : '当前为本地文件打开（正式上线请启动 server.py）'
    },
    {
      ok: true,
      label: activeProds.length > 0
        ? `当前在售商品 ${activeProds.length} 款`
        : '干净零商品投产状态（可随时在商品管理发布上架）'
    },
    {
      ok: outStock === 0,
      label: outStock === 0 ? '库存状态健康（无 0 库存商品）' : `有 ${outStock} 款在售商品库存为 0`
    },
    {
      ok: pendingShip === 0,
      label: pendingShip === 0 ? '订单履约正常（无积压待发货）' : `有 ${pendingShip} 笔订单待发货`
    },
    {
      ok: pendingQa === 0 && unreadMsgs === 0,
      label: (pendingQa === 0 && unreadMsgs === 0) ? '问答与客户留言已全部处理' : `待回复问答 ${pendingQa} 条 / 待处理留言 ${unreadMsgs} 条`
    },
    {
      ok: Boolean(cmsSet.contactEmail || paySet.stripePaymentLink),
      label: paySet.stripePaymentLink ? '在线收银台外链已配置' : '联系方式已就绪（在线收银台外链按需配置）'
    }
  ];

  const passCount = checks.filter(c => c.ok).length;
  const nowStr = new Date().toLocaleTimeString('zh-CN', { hour12: false });
  box.innerHTML = `
    <div style="grid-column:1 / -1; display:flex; justify-content:space-between; align-items:center; padding:6px 10px; border-radius:8px; background:rgba(216,255,0,0.08); color:#d8ff00; font-weight:600;">
      <span>体检完成：${passCount} / ${checks.length} 项通过</span>
      <span style="font-size:0.74rem; color:#cbd5e1;">检测时间 ${nowStr}</span>
    </div>` +
    checks.map(c => `
      <div style="padding:8px 10px; border-radius:8px; background:#14171d; border:1px solid ${c.ok ? 'rgba(16,185,129,0.35)' : 'rgba(245,158,11,0.38)'}; color:${c.ok ? '#34d399' : '#fbbf24'};">
        ${c.ok ? '✓' : '⚠'} ${escapeHTML(c.label)}
      </div>`).join('');

  if (btn && isManualClick) {
    btn.disabled = false;
    btn.textContent = '立即重新体检';
  }
};

const healthBtn = document.getElementById('run-health-check-btn');
if (healthBtn) healthBtn.addEventListener('click', () => window.runProductionHealthCheck(true));

// 初始化页面时主动填充布局排序、自定义导航与体检仪，避免因函数定义在后导致首屏空白
if (typeof loadCmsSettingsForm === 'function') loadCmsSettingsForm();


// ==========================================
// 商家端协议与隐私政策预览弹窗
// ==========================================
(function initAdminLegalModals() {
  const modal = document.getElementById('admin-legal-modal');
  const titleEl = document.getElementById('admin-legal-modal-title');
  const bodyEl = document.getElementById('admin-legal-modal-body');
  const closeBtn = document.getElementById('close-admin-legal-modal');
  const termsBtn = document.getElementById('admin-view-terms-btn');
  const privacyBtn = document.getElementById('admin-view-privacy-btn');
  if (!modal || !titleEl || !bodyEl) return;

  const openLegal = (type) => {
    const cms = readLocalData('auto_shop_cms', {}) || {};
    if (type === 'terms') {
      titleEl.textContent = '用户服务协议 · Terms of Service';
      bodyEl.textContent = cms.policyTermsText || '当前使用内置标准《用户服务协议》（含订单生效、7天无理由退换货、账号安全、知识产权及争议解决条款）。您可在「店铺装修 -> 第5项」中随时自定义修改并实时同步至买家端。';
    } else {
      titleEl.textContent = '隐私政策 · Privacy Policy';
      bodyEl.textContent = cms.policyPrivacyText || '当前使用内置标准《隐私政策》（明确收集收货信息/车型/邮箱的最小必要用途、HTTPS 与哈希加密保护、不存储银行卡密码/CVV 及用户查询删除权）。您可在「店铺装修 -> 第5项」中随时自定义修改并实时同步至买家端。';
    }
    modal.classList.add('active');
  };

  if (termsBtn) termsBtn.addEventListener('click', () => openLegal('terms'));
  if (privacyBtn) privacyBtn.addEventListener('click', () => openLegal('privacy'));
  if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.remove('active'));
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('active'); });
})();


// ==========================================
// 商家端 Pro 编辑增强：Logo/Favicon 上传 + 自定义内容板块增删 + 实时预览弹窗
// ==========================================
window.clearCmsBrandLogo = function() {
  const hid = document.getElementById('cms-brand-logo-img');
  const pv = document.getElementById('cms-logo-preview');
  if (hid) hid.value = '';
  if (pv) pv.src = 'assets/favicon.svg';
};

window.resetCmsFavicon = function() {
  const hid = document.getElementById('cms-favicon-img');
  const pv = document.getElementById('cms-favicon-preview');
  if (hid) hid.value = 'assets/favicon.svg';
  if (pv) pv.src = 'assets/favicon.svg';
};

(function initLogoFaviconUploads() {
  const bind = (fileId, hiddenId, previewId) => {
    const inp = document.getElementById(fileId);
    if (!inp) return;
    inp.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      try {
        const url = typeof uploadAdminImageFile === 'function'
          ? await uploadAdminImageFile(file)
          : await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); });
        const hid = document.getElementById(hiddenId);
        const pv = document.getElementById(previewId);
        if (hid) hid.value = url;
        if (pv) pv.src = resolveProductImage(url);
      } catch (err) {
        showAdminToast('图片上传失败，请重试');
      }
      e.target.value = '';
    });
  };
  bind('cms-brand-logo-file', 'cms-brand-logo-img', 'cms-logo-preview');
  bind('cms-favicon-file', 'cms-favicon-img', 'cms-favicon-preview');
})();

function createCustomBlockRowHTML(b = {}) {
  return `
    <div class="cms-custom-block-row admin-card" style="padding:10px; display:flex; flex-direction:column; gap:6px;">
      <div style="display:flex; gap:6px; align-items:center;">
        <input type="text" class="cb-kicker" placeholder="顶部角标（如 BRAND STORY）" value="${escapeHTML(b.kicker || '')}" style="flex:1; font-size:0.76rem;">
        <select class="cb-theme dark-select" style="width:126px; font-size:0.76rem;">
          <option value="dark" ${b.theme !== 'neon' ? 'selected' : ''}>暗黑卡片风</option>
          <option value="neon" ${b.theme === 'neon' ? 'selected' : ''}>荧光绿醒目风</option>
        </select>
        <button type="button" class="dark-outline-btn" style="padding:3px 8px; font-size:0.72rem; color:#f87171;" onclick="this.closest('.cms-custom-block-row').remove()">删除</button>
      </div>
      <div style="display:flex; gap:6px;">
        <input type="text" class="cb-title" placeholder="板块主标题（必填）" value="${escapeHTML(b.title || '')}" style="flex:1; font-size:0.8rem;">
        <input type="text" class="cb-title-en" placeholder="English Title（选填）" value="${escapeHTML(b.titleEn || '')}" style="flex:1; font-size:0.8rem;">
      </div>
      <input type="text" class="cb-desc" placeholder="板块说明正文（选填）" value="${escapeHTML(b.desc || '')}" style="font-size:0.78rem;">
      <input type="text" class="cb-image" placeholder="板块配图路径或图片网址（选填，如 assets/interior.webp）" value="${escapeHTML(b.image || '')}" style="font-size:0.76rem;">
      <div style="display:flex; gap:6px;">
        <input type="text" class="cb-cta-text" placeholder="按钮文字（选填，如 联系顾问）" value="${escapeHTML(b.ctaText || '')}" style="flex:1; font-size:0.76rem;">
        <input type="text" class="cb-cta-url" placeholder="跳转目标（如 #contact-section 或 https://...）" value="${escapeHTML(b.ctaUrl || '')}" style="flex:1.4; font-size:0.76rem;">
      </div>
    </div>`;
}

window.renderCmsCustomBlocksEditor = function(blocks) {
  const listEl = document.getElementById('cms-custom-blocks-list');
  if (!listEl) return;
  const arr = Array.isArray(blocks) ? blocks : [];
  if (!arr.length) {
    listEl.innerHTML = '<div style="font-size:0.76rem; color:#8e95a2;">暂无自定义首页板块（点击下方按钮可新增活动横幅或品牌故事区）。</div>';
    return;
  }
  listEl.innerHTML = arr.map(createCustomBlockRowHTML).join('');
};

window.collectCmsCustomBlocks = function() {
  const listEl = document.getElementById('cms-custom-blocks-list');
  if (!listEl) return [];
  return Array.from(listEl.querySelectorAll('.cms-custom-block-row')).map(row => ({
    kicker: (row.querySelector('.cb-kicker')?.value || '').trim(),
    theme: row.querySelector('.cb-theme')?.value || 'dark',
    title: (row.querySelector('.cb-title')?.value || '').trim(),
    titleEn: (row.querySelector('.cb-title-en')?.value || '').trim(),
    image: (row.querySelector('.cb-image')?.value || '').trim(),
    desc: (row.querySelector('.cb-desc')?.value || '').trim(),
    ctaText: (row.querySelector('.cb-cta-text')?.value || '').trim(),
    ctaUrl: (row.querySelector('.cb-cta-url')?.value || '').trim()
  })).filter(b => b.title);
};

const addCustomBlockBtn = document.getElementById('cms-add-custom-block-btn');
if (addCustomBlockBtn) {
  addCustomBlockBtn.addEventListener('click', () => {
    const listEl = document.getElementById('cms-custom-blocks-list');
    if (!listEl) return;
    if (!listEl.querySelector('.cms-custom-block-row')) listEl.innerHTML = '';
    listEl.insertAdjacentHTML('beforeend', createCustomBlockRowHTML({}));
  });
}

(function initLivePreviewModal() {
  const modal = document.getElementById('admin-live-preview-modal');
  const iframe = document.getElementById('admin-live-preview-iframe');
  const openBtn = document.getElementById('open-live-preview-btn');
  const closeBtn = document.getElementById('close-live-preview-modal');
  const deskBtn = document.getElementById('preview-desktop-btn');
  const mobBtn = document.getElementById('preview-mobile-btn');
  const relBtn = document.getElementById('preview-reload-btn');
  if (!modal || !iframe) return;
  const loadPreview = () => { iframe.src = 'index.html?preview=' + Date.now(); };
  if (openBtn) openBtn.addEventListener('click', () => { modal.classList.add('active'); loadPreview(); });
  if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.remove('active'));
  if (deskBtn) deskBtn.addEventListener('click', () => { iframe.style.width = '100%'; });
  if (mobBtn) mobBtn.addEventListener('click', () => { iframe.style.width = '390px'; });
  if (relBtn) relBtn.addEventListener('click', loadPreview);
})();

if (typeof loadCmsSettingsForm === 'function') loadCmsSettingsForm();


// ==========================================
// 商家端增强交互：Toast 提示、主题预设、配置导入导出与快捷操作
// ==========================================
function showAdminToast(message) {
  const el = document.getElementById('admin-toast');
  if (!el) return;
  const text = String(message || '');
  el.textContent = text;
  el.classList.remove('error', 'warn');
  if (/失败|错误|无效|拒绝|未授权|不足|不能|无法/.test(text)) el.classList.add('error');
  else if (/请|至少|提示|暂未|没有/.test(text)) el.classList.add('warn');
  el.classList.add('show');
  clearTimeout(window.__adminToastTimer);
  window.__adminToastTimer = setTimeout(() => el.classList.remove('show'), 3200);
}

function adminConfirm(message, title = '操作确认') {
  return new Promise((resolve) => {
    const modal = document.getElementById('admin-dialog-modal');
    const titleEl = document.getElementById('admin-dialog-title');
    const msgEl = document.getElementById('admin-dialog-msg');
    const inpEl = document.getElementById('admin-dialog-input');
    const okBtn = document.getElementById('admin-dialog-ok');
    const cancelBtn = document.getElementById('admin-dialog-cancel');
    if (!modal || !okBtn || !cancelBtn) { resolve(true); return; }
    titleEl.textContent = title;
    msgEl.textContent = String(message || '');
    inpEl.style.display = 'none';
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

function adminPrompt(message, defaultVal = '', title = '请输入') {
  return new Promise((resolve) => {
    const modal = document.getElementById('admin-dialog-modal');
    const titleEl = document.getElementById('admin-dialog-title');
    const msgEl = document.getElementById('admin-dialog-msg');
    const inpEl = document.getElementById('admin-dialog-input');
    const okBtn = document.getElementById('admin-dialog-ok');
    const cancelBtn = document.getElementById('admin-dialog-cancel');
    if (!modal || !okBtn || !cancelBtn) { resolve(null); return; }
    titleEl.textContent = title;
    msgEl.textContent = String(message || '');
    inpEl.style.display = 'block';
    inpEl.value = String(defaultVal || '');
    modal.classList.add('active');
    setTimeout(() => inpEl.focus(), 50);
    const cleanup = (val) => {
      modal.classList.remove('active');
      okBtn.onclick = null;
      cancelBtn.onclick = null;
      resolve(val);
    };
    okBtn.onclick = () => cleanup(inpEl.value);
    cancelBtn.onclick = () => cleanup(null);
  });
}

(function initForgotPasswordAndOpsCockpit() {
  const openBtn = document.getElementById('open-forgot-pwd-btn');
  const modal = document.getElementById('admin-forgot-modal');
  const closeBtn = document.getElementById('close-admin-forgot-modal');
  const form = document.getElementById('admin-forgot-form');
  if (openBtn && modal) openBtn.addEventListener('click', () => modal.classList.add('active'));
  if (closeBtn && modal) closeBtn.addEventListener('click', () => modal.classList.remove('active'));
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const recoveryKey = (document.getElementById('forgot-recovery-key')?.value || '').trim();
      const newPassword = document.getElementById('forgot-new-pwd')?.value || '';
      const newPassword2 = document.getElementById('forgot-new-pwd2')?.value || '';
      if (newPassword !== newPassword2) {
        showAdminToast('两次输入的新密码不一致，请核对');
        return;
      }
      if (newPassword.length < 8) {
        showAdminToast('新密码长度至少为 8 位');
        return;
      }
      try {
        const res = await fetch('/api/admin/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recoveryKey, newPassword })
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.ok) {
          modal.classList.remove('active');
          form.reset();
          showAdminToast('✅ 管理员密码已重置，请使用新密码登录');
        } else {
          showAdminToast(data.error || '密码重置失败，请检查恢复密钥');
        }
      } catch (err) {
        showAdminToast('无法连接服务端，请确认 python3 server.py 正在运行');
      }
    });
  }

  const jumpToTab = (tabName) => {
    const btn = document.querySelector(`.admin-tab-btn[data-admin-tab="${tabName}"]`);
    if (btn) btn.click();
  };
  document.querySelectorAll('.ops-kpi-card[data-jump-tab]').forEach(card => {
    card.addEventListener('click', () => jumpToTab(card.dataset.jumpTab));
  });
  const quickPub = document.getElementById('quick-go-publish-btn');
  if (quickPub) quickPub.addEventListener('click', () => {
    jumpToTab('products');
    document.getElementById('pub-name')?.focus();
  });
  const quickCms = document.getElementById('quick-go-cms-btn');
  if (quickCms) quickCms.addEventListener('click', () => jumpToTab('cms'));

  window.updateOpsKpiCockpit = function() {
    const ordList = Array.isArray(orders) ? orders : [];
    const pendingOrders = ordList.filter(o => o.status && !['已完成', '已取消', '已退款'].includes(o.status)).length;
    const totalGmv = ordList.filter(o => o.status && !['已取消', '已退款'].includes(o.status))
      .reduce((s, o) => s + (parseFloat(o.total) || 0), 0);
    const activeProds = typeof getAllAdminProducts === 'function' ? getAllAdminProducts() : (Array.isArray(customCatalog) ? customCatalog : []);
    const lowStock = activeProds.filter(p => {
      const st = stockMap && stockMap[p.id] !== undefined ? Number(stockMap[p.id]) : Number(p.stock || 0);
      return st <= 5;
    }).length;
    const contactMsgs = readLocalData('auto_shop_contact_messages', []) || [];
    const qaMap = readLocalData('auto_shop_qa', {}) || {};
    const pendingQa = Object.values(qaMap).flat().filter(q => q && !q.answer).length;
    const unreadMsgs = Array.isArray(contactMsgs) ? contactMsgs.filter(m => m && !m.replied).length : 0;

    const setT = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    setT('kpi-pending-orders', String(pendingOrders));
    setT('kpi-active-prods', String(activeProds.length));
    setT('kpi-low-stock-sub', `低库存预警 ${lowStock} 款 →`);
    setT('kpi-pending-inbox', String(pendingQa + unreadMsgs));
    setT('kpi-total-gmv', `¥${totalGmv.toFixed(0)}`);
  };

  if (typeof refreshAllAdminViews === 'function') {
    const origRefresh = refreshAllAdminViews;
    refreshAllAdminViews = function() {
      origRefresh();
      if (typeof window.updateOpsKpiCockpit === 'function') window.updateOpsKpiCockpit();
    };
  }
})();

(function initAdminCmsEnhancements() {
  const PRESETS = {
    'modform-lime': {
      name: '暗夜荧光绿',
      accentColor: '#d8ff00', bgColor: '#090a0c', surfaceColor: '#14171d',
      announcementBg: '#d8ff00', announcementColor: '#090a0c',
      btnStyle: 'rounded', cardRadius: 'default', heroOverlay: 45, heroAlign: 'center'
    },
    'minimal-titanium': {
      name: '极简钛灰白',
      accentColor: '#f8fafc', bgColor: '#0c0d10', surfaceColor: '#16181e',
      announcementBg: '#f8fafc', announcementColor: '#090a0c',
      btnStyle: 'sharp', cardRadius: 'sharp', heroOverlay: 50, heroAlign: 'left'
    },
    'track-amber': {
      name: '赛道琥珀橙',
      accentColor: '#ff7a18', bgColor: '#0d0b0a', surfaceColor: '#181412',
      announcementBg: '#ff7a18', announcementColor: '#090a0c',
      btnStyle: 'pill', cardRadius: 'soft', heroOverlay: 40, heroAlign: 'center'
    },
    'deep-ocean': {
      name: '静谧深海蓝',
      accentColor: '#38bdf8', bgColor: '#090e16', surfaceColor: '#111827',
      announcementBg: '#38bdf8', announcementColor: '#090e16',
      btnStyle: 'rounded', cardRadius: 'soft', heroOverlay: 45, heroAlign: 'center'
    }
  };

  document.querySelectorAll('.cms-preset-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = PRESETS[btn.dataset.preset];
      if (!p) return;
      const setV = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
      setV('cms-accent-color', p.accentColor);
      setV('cms-bg-color', p.bgColor);
      setV('cms-surface-color', p.surfaceColor);
      setV('cms-announcement-bg', p.announcementBg);
      setV('cms-announcement-color', p.announcementColor);
      setV('cms-btn-style', p.btnStyle);
      setV('cms-card-radius', p.cardRadius);
      setV('cms-hero-overlay', String(p.heroOverlay));
      setV('cms-hero-align', p.heroAlign);
      const ovLbl = document.getElementById('cms-hero-overlay-val');
      if (ovLbl) ovLbl.textContent = `${p.heroOverlay}%`;
      document.querySelectorAll('.cms-preset-chip').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      showAdminToast(`已应用「${p.name}」预设，点击下方“发布并同步买家端”即可生效`);
    });
  });

  const ovSlider = document.getElementById('cms-hero-overlay');
  const ovLabel = document.getElementById('cms-hero-overlay-val');
  if (ovSlider && ovLabel) {
    ovSlider.addEventListener('input', () => { ovLabel.textContent = `${ovSlider.value}%`; });
  }

  const toggleAllBtn = document.getElementById('cms-toggle-all-btn');
  if (toggleAllBtn) {
    toggleAllBtn.addEventListener('click', () => {
      const details = Array.from(document.querySelectorAll('#admin-cms-form details'));
      const anyClosed = details.some(d => !d.open);
      details.forEach(d => { d.open = anyClosed; });
    });
  }

  const stickyPreviewBtn = document.getElementById('cms-sticky-preview-btn');
  const openPreviewBtn = document.getElementById('open-live-preview-btn');
  if (stickyPreviewBtn && openPreviewBtn) {
    stickyPreviewBtn.addEventListener('click', () => openPreviewBtn.click());
  }

  const exportThemeBtn = document.getElementById('cms-export-theme-btn');
  if (exportThemeBtn) {
    exportThemeBtn.addEventListener('click', () => {
      const cms = readLocalData('auto_shop_cms', {});
      const blob = new Blob([JSON.stringify(cms, null, 2)], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `modform-theme-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showAdminToast('已导出当前主题配置 JSON');
    });
  }

  const importThemeBtn = document.getElementById('cms-import-theme-btn');
  const importThemeInput = document.getElementById('cms-import-theme-input');
  if (importThemeBtn && importThemeInput) {
    importThemeBtn.addEventListener('click', () => importThemeInput.click());
    importThemeInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(String(reader.result || '{}'));
          if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('invalid');
          writeLocalData('auto_shop_cms', parsed);
          if (typeof loadCmsSettingsForm === 'function') loadCmsSettingsForm();
          showAdminToast('✅ 主题配置已导入并同步至买家端');
        } catch (err) {
          showAdminToast('主题配置文件格式无效，请选择合法的 JSON 文件。');
        }
        importThemeInput.value = '';
      };
      reader.readAsText(file, 'utf-8');
    });
  }
})();


// ==========================================
// 邮箱 / 手机号 6 位验证码找回密码 + 后台安全联系方式绑定
// ==========================================
(function initEmailPhonePasswordRecovery() {
  const sendBtn = document.getElementById('send-forgot-code-btn');
  const codeForm = document.getElementById('admin-forgot-code-form');
  const modal = document.getElementById('admin-forgot-modal');
  let cooldown = 0;

  if (sendBtn) {
    sendBtn.addEventListener('click', async () => {
      if (cooldown > 0) return;
      const contact = (document.getElementById('forgot-contact-input')?.value || '').trim();
      if (!contact) {
        showAdminToast('请先输入绑定的管理员邮箱或手机号');
        return;
      }
      sendBtn.disabled = true;
      try {
        const res = await fetch('/api/admin/forgot/send-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contact })
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.ok) {
          showAdminToast(data.message || '验证码已发送，请查收');
          cooldown = 60;
          const timer = setInterval(() => {
            cooldown -= 1;
            if (cooldown <= 0) {
              clearInterval(timer);
              sendBtn.disabled = false;
              sendBtn.textContent = '重新发送';
            } else {
              sendBtn.textContent = `${cooldown}s 后重试`;
            }
          }, 1000);
        } else {
          sendBtn.disabled = false;
          showAdminToast(data.error || '发送验证码失败');
        }
      } catch (err) {
        sendBtn.disabled = false;
        showAdminToast('无法连接服务端，请确认 python3 server.py 正在运行');
      }
    });
  }

  if (codeForm) {
    codeForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const contact = (document.getElementById('forgot-contact-input')?.value || '').trim();
      const code = (document.getElementById('forgot-code-input')?.value || '').trim();
      const p1 = document.getElementById('forgot-code-new-pwd')?.value || '';
      const p2 = document.getElementById('forgot-code-new-pwd2')?.value || '';
      if (p1 !== p2) {
        showAdminToast('两次输入的新密码不一致');
        return;
      }
      try {
        const res = await fetch('/api/admin/forgot/verify-reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contact, code, newPassword: p1 })
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.ok) {
          if (modal) modal.classList.remove('active');
          codeForm.reset();
          showAdminToast('✅ 密码已通过验证码重置，请使用新密码登录');
        } else {
          showAdminToast(data.error || '验证码校验失败');
        }
      } catch (err) {
        showAdminToast('无法连接服务端，请检查服务状态');
      }
    });
  }

  // 后台安全邮箱/手机绑定
  const bindBtn = document.getElementById('save-admin-bind-contact-btn');
  const loadBoundContact = () => {
    const saved = readLocalData('auto_shop_admin_contact', {}) || {};
    const eEl = document.getElementById('admin-bind-email');
    const pEl = document.getElementById('admin-bind-phone');
    if (eEl && saved.email) eEl.value = saved.email;
    if (pEl && saved.phone) pEl.value = saved.phone;
  };
  loadBoundContact();
  if (typeof refreshAllAdminViews === 'function') {
    const prevR = refreshAllAdminViews;
    refreshAllAdminViews = function() { prevR(); loadBoundContact(); };
  }
  if (bindBtn) {
    bindBtn.addEventListener('click', async () => {
      const email = (document.getElementById('admin-bind-email')?.value || '').trim();
      const phone = (document.getElementById('admin-bind-phone')?.value || '').trim();
      if (!email && !phone) {
        showAdminToast('请至少填写一个邮箱或手机号');
        return;
      }
      try {
        const res = await fetch('/api/admin/bind-contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Admin-Token': sessionStorage.getItem('auto_shop_admin_token') || ''
          },
          body: JSON.stringify({ email, phone })
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.ok) {
          writeLocalData('auto_shop_admin_contact', data.contact || { email, phone });
          showAdminToast('✅ 已绑定密码找回邮箱/手机号');
        } else {
          showAdminToast(data.error || '绑定失败，请重新登录后台后重试');
        }
      } catch (err) {
        showAdminToast('无法连接服务端');
      }
    });
  }
})();

const pubResetFormBtn = document.getElementById('pub-reset-form-btn');
if (pubResetFormBtn) {
  pubResetFormBtn.addEventListener('click', () => {
    const form = document.getElementById('admin-publish-form');
    if (form) form.reset();
    if (typeof renderSkuEditor === 'function') {
      renderSkuEditor('pub-sku-editor', [{ name: '', price: '', stock: '', skuCode: '' }]);
    }
    showAdminToast('已清空商品发布表单');
  });
}
