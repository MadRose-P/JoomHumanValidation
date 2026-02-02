let data = [];
let items = [];
let idx = 0;
let results = {};

const SEED = 42;
const STORAGE_KEY = "edu_pua_annotation_state_v2";

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

/* ---------- 可复现 shuffle ---------- */
function mulberry32(a) {
  return function () {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
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

/* ---------- 渲染 ---------- */
function render() {
  const item = items[idx];

  document.getElementById("progress").innerText =
    `进度：${idx + 1} / ${items.length}`;

  document.getElementById("task").innerHTML = `
    <div class="text-box">${item.text_zh}</div>

    <div class="section">
      <strong>Q1. 你在多大程度上意识到了对你不利的操控？</strong><br>
      <label><input type="radio" name="aware" value="0"> 0：未意识到</label><br>
      <label><input type="radio" name="aware" value="1"> 1：模糊或潜在意识</label><br>
      <label><input type="radio" name="aware" value="2"> 2：明确意识</label>
    </div>

    <div class="section conditional" id="cond_block" style="display:none;">
      <strong>Q2. 操控类别</strong><br>
      <select id="primary" onchange="updateSubcategories()">
        <option value="">-- 大类 --</option>
        ${Object.keys(CATEGORIES).map(c => `<option>${c}</option>`).join("")}
      </select><br><br>

      <select id="secondary" disabled>
        <option value="">-- 小类 --</option>
      </select><br><br>

      <strong>Q3. 操控的隐晦程度</strong><br>
      <label><input type="radio" name="subtlety" value="0"> 直白</label><br>
      <label><input type="radio" name="subtlety" value="1"> 中等</label><br>
      <label><input type="radio" name="subtlety" value="2"> 非常隐晦</label>
    </div>

    <div class="section">
      <strong>Q4. 语言自然度</strong><br>
      <label><input type="radio" name="natural" value="0"> 不自然</label><br>
      <label><input type="radio" name="natural" value="1"> 一般</label><br>
      <label><input type="radio" name="natural" value="2"> 很自然</label>
    </div>

    <div class="section">
      <strong>Q5. 是否符合导师-学生语境</strong><br>
      <label><input type="radio" name="role" value="0"> 不符合</label><br>
      <label><input type="radio" name="role" value="1"> 尚可</label><br>
      <label><input type="radio" name="role" value="2"> 非常符合</label>
    </div>

    <div class="section">
      <strong>Q6. 你对自己判断的信心</strong><br>
      <select id="confidence">
        <option value="">-- 请选择 --</option>
        <option value="low">低</option>
        <option value="medium">中</option>
        <option value="high">高</option>
      </select>
    </div>

    <div class="section">
      <strong>Q7. 数据可用性</strong><br>
      <select id="usability">
        <option value="">-- 请选择 --</option>
        <option value="keep">保留</option>
        <option value="revise">存疑 / 需修改</option>
        <option value="remove">删除</option>
      </select>
    </div>
  `;

  document.querySelectorAll('input[name="aware"]').forEach(r => {
    r.addEventListener("change", () => {
      document.getElementById("cond_block").style.display =
        r.value === "0" ? "none" : "block";
    });
  });
}

function updateSubcategories() {
  const primary = document.getElementById("primary").value;
  const secondary = document.getElementById("secondary");
  secondary.innerHTML = "";

  if (!primary) {
    secondary.disabled = true;
    secondary.innerHTML = `<option>-- 小类 --</option>`;
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
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    items, idx, results
  }));
}

/* ---------- 下一题 ---------- */
function next() {
  const aware = document.querySelector('input[name="aware"]:checked');
  if (!aware) return alert("请完成 Q1");

  const natural = document.querySelector('input[name="natural"]:checked');
  const role = document.querySelector('input[name="role"]:checked');
  const confidence = document.getElementById("confidence").value;
  const usability = document.getElementById("usability").value;

  if (!natural || !role || !confidence || !usability)
    return alert("请完成所有必填项");

  const awareVal = parseInt(aware.value);

  results[items[idx].id] = {
    awareness: awareVal,
    primary_category: awareVal === 0 ? null : document.getElementById("primary").value || null,
    secondary_category: awareVal === 0 ? null : document.getElementById("secondary").value || null,
    subtlety: awareVal === 0 ? null :
      (document.querySelector('input[name="subtlety"]:checked')?.value ?? null),
    naturalness: parseInt(natural.value),
    role_plausibility: parseInt(role.value),
    confidence: confidence,
    usability: usability
  };

  saveState();
  idx++;
  if (idx < items.length) render();
  else alert("已完成全部标注！");
}

/* ---------- 工具 ---------- */
function clearProgress() {
  if (confirm("确定清空进度？")) {
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  }
}

function exportResult() {
  const blob = new Blob([JSON.stringify(results, null, 2)],
    { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "annotation_results.json";
  a.click();
}
