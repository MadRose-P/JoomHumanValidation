let data = [];
let items = [];
let idx = 0;
let results = {};

const SEED = 42;

const STORAGE_KEY = "edu_pua_annotation_state_v1";

const CATEGORIES = {
  "Power and Resource Control": [
    "Resource/Information Withholding",
    "Dependency structuring",
    "Retaliatory Threats"
  ],
  "Emotional and Cognitive Abuse": [
    "Gaslighting and Reality Distortion",
    "Blame Shifting and Moral Coercion",
    "Boundary Intrusion"
  ],
  "Academic Exploitation Suppression": [
    "Credit Appropriation",
    "Career Obstruction"
  ],
  "Social Isolation and Exclusion": [
    "Active Exclusion",
    "Silent Treatment and Avoidance",
    "Peer Division"
  ],
  "Personal and Degradation": [
    "Public and Private Humiliation",
    "Intellectual Undermining"
  ]
};


/* ---------- 随机但可复现的 shuffle ---------- */
function mulberry32(a) {
  return function () {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

function seededShuffle(array, seed) {
  let rng = mulberry32(seed);
  let arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* ---------- 加载数据 ---------- */
fetch("Academic_Manipulation_Benchmark_Final.json")
  .then(res => res.json())
  .then(json => {
    data = json;

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const state = JSON.parse(saved);
      items = state.items;
      idx = state.idx;
      results = state.results;
    } else {
      items = seededShuffle(data, SEED);
      idx = 0;
      results = {};
      saveState();
    }

    render();
  });

/* ---------- 渲染题目 ---------- */
function render() {
  const item = items[idx];

  document.getElementById("progress").innerText =
    `进度：${idx + 1} / ${items.length}`;

  document.getElementById("task").innerHTML = `
    <div class="text-box">
      ${item.text_zh}
    </div>

    <div class="section">
      <p><strong>Q1. 你在多大程度上意识到了对你不利的操控？</strong></p>
      <label><input type="radio" name="aware" value="0"> 0：未意识到</label><br>
      <label><input type="radio" name="aware" value="1"> 1：模糊或潜在意识</label><br>
      <label><input type="radio" name="aware" value="2"> 2：明确意识</label>
    </div>

    <div class="section" id="classification" style="display:none;">
      <p><strong>Q2. 如果你认为存在操控，请选择类别：</strong></p>

      <label>大类：</label><br>
      <select id="primary" onchange="updateSubcategories()">
        <option value="">-- 请选择大类 --</option>
        ${Object.keys(CATEGORIES).map(
          cat => `<option value="${cat}">${cat}</option>`
        ).join("")}
      </select>

      <br><br>

      <label>小类：</label><br>
      <select id="secondary" disabled>
        <option value="">-- 请先选择大类 --</option>
      </select>
    </div>
  `;

  document.querySelectorAll('input[name="aware"]').forEach(radio => {
    radio.addEventListener("change", () => {
      document.getElementById("classification").style.display =
        radio.value === "0" ? "none" : "block";
    });
  });
}

function updateSubcategories() {
  const primary = document.getElementById("primary").value;
  const secondary = document.getElementById("secondary");

  secondary.innerHTML = "";

  if (!primary) {
    secondary.disabled = true;
    secondary.innerHTML = `<option value="">-- 请先选择大类 --</option>`;
    return;
  }

  CATEGORIES[primary].forEach(sub => {
    const opt = document.createElement("option");
    opt.value = sub;
    opt.textContent = sub;
    secondary.appendChild(opt);
  });

  secondary.disabled = false;
}

function saveState() {
  const state = {
    items: items,
    idx: idx,
    results: results
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}


/* ---------- 下一题 ---------- */
function next() {
  const aware = document.querySelector('input[name="aware"]:checked');
  if (!aware) {
    alert("请选择意识程度");
    return;
  }

  const awareVal = parseInt(aware.value);

  results[items[idx].id] = {
    awareness: awareVal,
    primary_category: awareVal === 0 ? null : document.getElementById("primary").value || null,
    secondary_category: awareVal === 0 ? null : document.getElementById("secondary").value || null
  };

  saveState();

  idx++;
  if (idx < items.length) render();
  else alert("已完成全部标注！");
}

function clearProgress() {
  if (confirm("确定要清除当前进度并重新开始吗？")) {
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  }
}


/* ---------- 导出结果 ---------- */
function exportResult() {
  const blob = new Blob(
    [JSON.stringify(results, null, 2)],
    { type: "application/json" }
  );
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "annotation_results.json";
  a.click();
}
