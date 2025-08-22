// ====== 漢堡選單（小螢幕） ======
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('漢堡鈕');
  const nav = document.getElementById('主導覽');
  btn?.addEventListener('click', () => {
    const visible = getComputedStyle(nav).display !== 'none';
    nav.style.display = visible ? 'none' : 'flex';
  });

  // 功能初始化（偵測表單存在才綁定）
  initRiskQuiz();
  initCompounding();
  initRetirementGap();
});

// ====== 風險屬性測驗 ======
function initRiskQuiz(){
  const form = document.getElementById('風險表單');
  const out  = document.getElementById('風險結果');
  if(!form || !out) return;
  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const fd = new FormData(form);
    const score = ['q1','q2','q3'].reduce((s,q)=> s + Number(fd.get(q)||0), 0);
    let type = '保守型';
    if (score >= 7) type = '積極型';
    else if (score >= 5) type = '平衡型';
    out.innerHTML = `<strong>結果：</strong>${type}（分數 ${score}）<br>建議：依結果調整股債比例並定期再平衡。`;
  });
}

// ====== 複利計算機 ======
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
    const FV_ann  = r ? C * ((Math.pow(1+r, n)-1) / r) : C*n;
    const FV = Math.round(FV_lump + FV_ann);
    out.innerHTML = `估計最終金額：約 <strong>${FV.toLocaleString()}</strong> 元`;
  });
}

// ====== 退休缺口試算 ======
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
                     目前資產：${A.toLocaleString()} 元｜<strong>缺口：</strong>${Math.round(gap).toLocaleString()} 元`;
  });
}
