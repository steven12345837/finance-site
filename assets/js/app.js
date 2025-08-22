/* ===========================================================
   SPA 殼（Shell）路由腳本（支援 GitHub Project Pages）
   - 以 History API + fetch 動態載入各子頁的 <main id="頁面內容">
   - 自動處理 Project Pages 前綴（例：/finance-site/）
   - 直接輸入深層路徑時由 404.html / 子頁腳本帶回殼再渲染
   =========================================================== */

// ---------- 自動偵測 basePath（User Pages="/"；Project Pages="/<repo>/"） ----------
const basePath = (() => {
  const seg = location.pathname.split('/').filter(Boolean);
  return seg.length > 0 ? `/${seg[0]}/` : '/';
})();

// 讓子頁知道目前在殼中（直入子頁會檢查這個旗標）
sessionStorage.setItem('__shell__', '1');

// ---------- 工具：乾淨路徑 → 實際 Project Pages 路徑（加上前綴） ----------
function toProjectPath(pretty) {
  // pretty 例："/about/" 或 "/services/asset-management.html"
  const base = basePath.replace(/\/$/, ''); // "/finance-site"
  const p = String(pretty || '/');
  return p.startsWith('/') ? base + p : base + '/' + p;
}

// 工具：去除 basePath 前綴，得到站內「乾淨路徑」
function stripBase(pathname) {
  if (pathname.startsWith(basePath)) {
    return pathname.slice(basePath.length - 1); // 例如 "/finance-site/x" -> "/x"
  }
  return pathname;
}

// 工具：正規化乾淨路徑（補上開頭 "/"；資料夾路徑補 "/"）
function normalizePrettyPath(p) {
  let path = p || '/';
  if (!path.startsWith('/')) path = '/' + path;
  // 非 .html 結尾且不是根，就補結尾斜線，維持資料夾語義
  if (path !== '/' && !path.endsWith('.html') && !path.endsWith('/')) {
    path += '/';
  }
  return path;
}

// ---------- 路由表：乾淨路徑（鍵） → 實際檔案（值） ----------
const ROUTES = {
  '/': 'home.html',
  '/about/': 'about/index.html',

  '/services/': 'services/index.html',
  '/services/asset-management.html': 'services/asset-management.html',
  '/services/financial-planning.html': 'services/financial-planning.html',
  '/services/insurance-advisory.html': 'services/insurance-advisory.html',
  '/services/tax-estate-partners.html': 'services/tax-estate-partners.html',
  '/services/corporate-solutions.html': 'services/corporate-solutions.html',

  '/products/': 'products/index.html',
  '/products/etf/': 'products/etf/index.html',
  '/products/etf/0050.html': 'products/etf/0050.html',
  '/products/etf/global-bond.html': 'products/etf/global-bond.html',
  '/products/funds/': 'products/funds/index.html',
  '/products/bonds/': 'products/bonds/index.html',
  '/products/futures/': 'products/futures/index.html',
  '/products/futures/micro-sp500.html': 'products/futures/micro-sp500.html',
  '/products/options/': 'products/options/index.html',

  '/academy/': 'academy/index.html',
  '/academy/basics/budgeting.html': 'academy/basics/budgeting.html',
  '/academy/basics/asset-allocation.html': 'academy/basics/asset-allocation.html',
  '/academy/strategies/': 'academy/strategies/index.html',
  '/academy/calculators/compounding.html': 'academy/calculators/compounding.html',
  '/academy/calculators/retirement-gap.html': 'academy/calculators/retirement-gap.html',
  '/academy/downloads/': 'academy/downloads/index.html',

  '/cases/': 'cases/index.html',
  '/cases/student.html': 'cases/student.html',
  '/cases/young-pro.html': 'cases/young-pro.html',
  '/cases/conservative-hnwi.html': 'cases/conservative-hnwi.html',

  '/tools/risk-quiz.html': 'tools/risk-quiz.html',
  '/tools/intake-form.html': 'tools/intake-form.html',

  '/faq/': 'faq/index.html',
  '/contact/': 'contact/index.html',

  '/legal/disclosures.html': 'legal/disclosures.html',
  '/legal/privacy.html': 'legal/privacy.html',
  '/legal/terms.html': 'legal/terms.html',
};

// 反查表：實檔 → 乾淨路徑（用於把實檔還原成漂亮 URL）
const FILE_TO_ROUTE = Object.entries(ROUTES).reduce((acc, [pretty, file]) => {
  acc[file] = pretty;
  return acc;
}, {});

// ---------- 主內容容器 ----------
const $main = document.getElementById('內容區');

// ---------- 以 fetch 載入子頁，抽出 <main id="頁面內容"> ----------
async function loadRoute(pathname, push = false) {
  // 1) 轉成乾淨路徑
  let pretty = normalizePrettyPath(stripBase(pathname));

  // 2) 查路由（找不到則回首頁）
  const file = ROUTES[pretty] || ROUTES['/'];
  const fileUrl = basePath + file.replace(/^\//, '');

  // 3) 載入中（可近性）
  $main.setAttribute('aria-busy', 'true');

  // 4) 取得檔案內容並解析
  let htmlText = '';
  try {
    const resp = await fetch(fileUrl, { cache: 'no-cache' });
    htmlText = await resp.text();
  } catch (err) {
    htmlText = '<main id="頁面內容"><section class="區塊 內文"><h1>載入失敗</h1><p>請稍後再試。</p></section></main>';
  }

  const doc = new DOMParser().parseFromString(htmlText, 'text/html');
  const frag = doc.querySelector('#頁面內容');
  const title = doc.querySelector('title')?.textContent?.trim() || '理財專員';

  // 5) 更新主內容
  $main.innerHTML = '';
  if (frag) $main.append(...frag.cloneNode(true).childNodes);
  $main.setAttribute('aria-busy', 'false');
  $main.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // 6) 設定文件標題
  document.title = title;

  // 7) 更新網址（用 Project Pages 真實前綴）
  const nextPretty = FILE_TO_ROUTE[file] || pretty;
  const nextUrlPath = toProjectPath(nextPretty);
  if (push) history.pushState({ path: nextPretty }, '', nextUrlPath);
  else history.replaceState({ path: nextPretty }, '', nextUrlPath);

  // 8) 讓新插入的 a[data-route] 都有正確 href（支援右鍵新分頁）
  updateInternalLinks();

  // 9) 頁面專屬互動
  initPageInteractions(nextPretty);
}

// ---------- 將 a[data-route] 的 href 補成含前綴的實體路徑 ----------
function updateInternalLinks() {
  document.querySelectorAll('a[data-route]').forEach(a => {
    const r = a.getAttribute('data-route');
    if (r) a.setAttribute('href', toProjectPath(r));
  });
}

// ---------- 攔截站內連結（不整頁換頁） ----------
document.addEventListener('click', (e) => {
  const a = e.target.closest('a');
  if (!a) return;

  // 外部連結 / 下載 / 錨點放行
  if (a.target === '_blank' || a.hasAttribute('download') || a.getAttribute('href')?.startsWith('#')) return;

  const isSameOrigin = a.origin === location.origin;
  if (!isSameOrigin) return;

  // 站內連結：改由殼載入
  const route = a.getAttribute('data-route') || a.getAttribute('href') || a.pathname;
  if (!route) return;

  e.preventDefault();
  // 轉成絕對 pathname 再交給 loader（可接受 "/finance-site/xxx" 或 "/xxx"）
  const abs = new URL(route, location.origin).pathname;
  loadRoute(abs, true);
});

// ---------- 前進/後退 ----------
window.addEventListener('popstate', () => loadRoute(location.pathname, false));

// ---------- 啟動（含 404/子頁回殼處理） ----------
(function boot(){
  const pending = sessionStorage.getItem('__redirect__'); // 404 或子頁直入會寫入
  if (pending) {
    sessionStorage.removeItem('__redirect__');
    loadRoute(pending, false);
  } else {
    loadRoute(location.pathname, false);
  }

  // 手機漢堡
  const btn = document.getElementById('漢堡鈕');
  const nav = document.getElementById('主導覽');
  btn?.addEventListener('click', ()=>{
    const visible = getComputedStyle(nav).display !== 'none';
    nav.style.display = visible ? 'none' : 'flex';
  });

  // 首次也更新一次 data-route 的 href
  updateInternalLinks();
})();

// ---------- 頁面互動（風險測驗／複利／退休缺口） ----------
function initPageInteractions(prettyPath) {
  if (prettyPath.endsWith('/tools/risk-quiz.html')) initRiskQuiz();
  if (prettyPath.endsWith('/academy/calculators/compounding.html')) initCompounding();
  if (prettyPath.endsWith('/academy/calculators/retirement-gap.html')) initRetirementGap();
}

// 風險屬性測驗
function initRiskQuiz(){
  const form = document.getElementById('風險表單');
  const out  = document.getElementById('風險結果');
  if(!form || !out) return;
  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const score = ['q1','q2','q3'].reduce((s,q)=>{
      const v = Number((new FormData(form)).get(q) || 0);
      return s + v;
    },0);
    let type = '保守型';
    if (score >= 7) type = '積極型';
    else if (score >= 5) type = '平衡型';
    out.innerHTML = `<strong>結果：</strong>${type}（分數 ${score}）<br>建議：依結果調整股債比例並定期再平衡。`;
  });
}

// 複利計算機
function initCompounding(){
  const f = document.getElementById('複利表單');
  const out = document.getElementById('複利結果');
  if(!f || !out) return;
  f.addEventListener('submit', (e)=>{
    e.preventDefault();
    const P = Number(document.getElementById('初始金額').value||0);
    const C = Number(document.getElementById('每期投入').value||0);
    const r = Number(document.getElementById('年化報酬率').value||0)/100;
    const n = Number(document.getElementById('年數').value||0);
    const FV_lump = P * Math.pow(1+r, n);
    const FV_ann  = C * ((Math.pow(1+r, n)-1) / (r||1));
    const FV = r ? FV_lump + FV_ann : FV_lump + C*n;
    out.innerHTML = `估計最終金額：約 <strong>${Math.round(FV).toLocaleString()}</strong> 元`;
  });
}

// 退休缺口試算
function initRetirementGap(){
  const f = document.getElementById('退休表單');
  const out = document.getElementById('退休結果');
  if(!f || !out) return;
  f.addEventListener('submit', (e)=>{
    e.preventDefault();
    const m  = Number(document.getElementById('目標月支出').value||0);
    const y  = Number(document.getElementById('退休年數').value||0);
    const A  = Number(document.getElementById('現有資產').value||0);
    const ry = Number(document.getElementById('退休報酬率').value||0)/100;
    const annual = m * 12;
    const pv = ry ? annual * (1 - Math.pow(1+ry, -y)) / ry : annual * y;
    const gap = Math.max(0, pv - A);
    out.innerHTML = `估計所需資產現值：約 <strong>${Math.round(pv).toLocaleString()}</strong> 元<br>
                     目前資產：${A.toLocaleString()} 元<br>
                     <strong>缺口：</strong>${Math.round(gap).toLocaleString()} 元`;
  });
}
