// =========================
// GitHub Pages basePath 自動偵測（User Pages=/，Project Pages=/repo/）
// =========================
const basePath = (() => {
  const seg = location.pathname.split('/').filter(Boolean);
  return seg.length > 0 ? `/${seg[0]}/` : '/';
})();

// =========================
// 殼啟動標記（讓子頁知道是殼在運作）
// =========================
sessionStorage.setItem('__shell__', '1');

// =========================
// 路由表：乾淨路徑 → 實際檔案（各頁都是獨立 .html 檔）
// （首頁使用 /home.html）
// =========================
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

// 反向表：實檔 → 乾淨路徑（為了從子頁直入可改回乾淨路徑）
const FILE_TO_ROUTE = Object.entries(ROUTES).reduce((m, [pretty, file]) => (m[file] = pretty, m), {});

// =========================
// 主容器
// =========================
const $main = document.getElementById('內容區');

// =========================
// 以 fetch 載入子頁，抽出 <main id="頁面內容"> 片段
// =========================
async function loadRoute(pathname, push = false) {
  // 正規化：去除 basePath 前綴
  let path = pathname;
  if (path.startsWith(basePath)) path = path.slice(basePath.length - 1);
  if (!path.startsWith('/')) path = '/' + path;

  // 路由查表（預設首頁）
  const file = ROUTES[path] || ROUTES['/'];
  const url = basePath + file.replace(/^\//, '');

  // 載入中狀態（可近性）
  $main.setAttribute('aria-busy', 'true');

  // 取得檔案文字
  const html = await fetch(url, { cache: 'no-cache' }).then(r => r.text());

  // 解析 HTML，抽出標題與 <main id="頁面內容"> 內容
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const frag = doc.querySelector('#頁面內容');
  const title = doc.querySelector('title')?.textContent?.trim() || '理財專員';

  // 替換主內容
  $main.innerHTML = '';
  if (frag) $main.append(...frag.cloneNode(true).childNodes);
  $main.setAttribute('aria-busy', 'false');
  $main.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // 設定標題
  document.title = title;

  // pushState／replaceState
  const pretty = FILE_TO_ROUTE[file] || path;
  const nextUrl = new URL(pretty, location.origin + basePath);
  if (push) history.pushState({ path: pretty }, '', nextUrl.pathname);
  else history.replaceState({ path: pretty }, '', nextUrl.pathname);

  // 頁面專屬互動初始化
  initPageInteractions(pretty);
}

// =========================
// 事件：攔截內部連結（不整頁換頁）
// =========================
document.addEventListener('click', (e) => {
  const a = e.target.closest('a');
  if (!a) return;
  const isSameOrigin = a.origin === location.origin;
  const route = a.getAttribute('data-route') || a.getAttribute('href');
  if (!route) return;

  // 只攔截：本站連結＋不是錨點＋不是檔案下載
  if (isSameOrigin && !a.hasAttribute('download') && !/^#/.test(route)) {
    // 外部連結或 target=_blank 放行
    if (a.target === '_blank') return;
    e.preventDefault();
    loadRoute(a.pathname, true);
  }
});

// =========================
// popstate（前進/後退）
// =========================
window.addEventListener('popstate', () => loadRoute(location.pathname, false));

// =========================
// 404 或子頁直入還原：讀取 __redirect__
// =========================
(function boot(){
  const pending = sessionStorage.getItem('__redirect__');
  if (pending) {
    sessionStorage.removeItem('__redirect__');
    loadRoute(pending, false);
  } else {
    loadRoute(location.pathname, false);
  }
  // 漢堡選單
  const btn = document.getElementById('漢堡鈕');
  const nav = document.getElementById('主導覽');
  btn?.addEventListener('click', ()=>{
    const visible = getComputedStyle(nav).display !== 'none';
    nav.style.display = visible ? 'none' : 'flex';
  });
})();

// =========================
// 頁內互動：風險測驗／複利／退休缺口
// =========================
function initPageInteractions(prettyPath) {
  if (prettyPath.endsWith('/tools/risk-quiz.html')) initRiskQuiz();
  if (prettyPath.endsWith('/academy/calculators/compounding.html')) initCompounding();
  if (prettyPath.endsWith('/academy/calculators/retirement-gap.html')) initRetirementGap();
}

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
