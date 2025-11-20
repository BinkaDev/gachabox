
const BOXES_JSON_URL = "./data/boxes.json";
const ITEM_JSON_BASE = "./data/items/";

let boxes = [];
let currentBox = null;

document.addEventListener("DOMContentLoaded", () => {
  loadBoxes();
  document.getElementById("boxSelect").addEventListener("change", onBoxChange);
});


async function loadBoxes() {
  const statusEl = document.getElementById("loadStatus");
  statusEl.textContent = "박스 데이터 로딩 중...";

  try {
    const res = await fetch(BOXES_JSON_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();


    boxes = Array.isArray(data) ? data : [data];

    if (!boxes.length) {
      statusEl.textContent = "박스 데이터가 없습니다.";
      return;
    }


    const select = document.getElementById("boxSelect");
    select.innerHTML = "";
    boxes.forEach((b, idx) => {
      const opt = document.createElement("option");
      opt.value = idx;
      opt.textContent = b.title || `Box ${idx + 1}`;
      select.appendChild(opt);
    });

    statusEl.textContent = "";
  
    select.value = 0;
    renderBox(boxes[0]);
  } catch (e) {
    console.error(e);
    statusEl.textContent = `데이터 로드 실패: ${e.message}`;
  }
}

function onBoxChange(e) {
  const idx = Number(e.target.value);
  if (!Number.isFinite(idx) || !boxes[idx]) return;
  renderBox(boxes[idx]);
}


function renderBox(box) {
  currentBox = box;

  
  const imgUrl = box.imageFile
    ? `./data/images/${box.imageFile}`
    : "";

  const imgEl = document.getElementById("boxImage");
  if (imgUrl) {
    imgEl.src = imgUrl;
    imgEl.style.visibility = "visible";
  } else {
    imgEl.src = "";
    imgEl.style.visibility = "hidden";
  }


  document.getElementById("boxTitle").textContent = box.title || "(제목 없음)";

const tagKR = {
  "Use Item": "사용 아이템",
  "Untradeable": "거래불가",
  "Undroppable": "버리기",
  
};


  const tagsWrap = document.getElementById("boxTags");
  tagsWrap.innerHTML = "";
  (box.tags || []).forEach(tag => {
    const kr = tagKR[tag] || tag;

    const span = document.createElement("span");
    span.className = "tag-chip";
    span.textContent = kr;
    tagsWrap.appendChild(span);
  });



 
  const statsWrap = document.getElementById("boxStats");
  statsWrap.innerHTML = "";
  const table = box.table || {};
  const statMap = [
    ["Level", "레벨"],
    ["Value", "값"],
    ["Weight", "무게"]
  ];
  statMap.forEach(([key, label]) => {
    if (table[key] != null) {
      const div = document.createElement("div");
      div.className = "stat-box";
      div.innerHTML =
        `<div class="stat-label">${label}</div>` +
        `<div class="stat-value">${table[key]}</div>`;
      statsWrap.appendChild(div);
    }
  });


  document.getElementById("boxDesc").textContent =
    box.description || "설명 없음";
  document.getElementById("boxPrice").textContent =
    box.price || "개발중";
  
  renderBoxItems(box.items || []);


  const detailArea = document.getElementById("itemDetailArea");
  detailArea.classList.add("muted");
  detailArea.innerHTML = "아이템을 클릭하면 상세 정보를 보여줄게.";
}


function renderBoxItems(items) {
  const tbody = document.getElementById("itemsTbody");
  tbody.innerHTML = "";

  document.getElementById("boxItemCount").textContent =
    `${items.length} items`;

  if (!items.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 4;
    td.textContent = "아이템이 없습니다.";
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  items.forEach(item => {
    const tr = document.createElement("tr");

   
    const tdIcon = document.createElement("td");
    const iconUrl = item.imgFile
      ? `./data/images/${item.imgFile}`
      : "";
    if (iconUrl) {
      const img = document.createElement("img");
      img.src = iconUrl;
      img.alt = "";
      img.className = "item-icon";
      tdIcon.appendChild(img);
    }
    tr.appendChild(tdIcon);


    const tdName = document.createElement("td");
    tdName.textContent = item.name || "(이름 없음)";
    tr.appendChild(tdName);


    const tdCount = document.createElement("td");
    tdCount.textContent = item.count || "";
    tr.appendChild(tdCount);

    // rate
    const tdRate = document.createElement("td");
    tdRate.textContent = item.rate || "";
    tr.appendChild(tdRate);

    tr.addEventListener("click", () => onItemClick(item));
    tbody.appendChild(tr);
  });
}


async function onItemClick(item) {
  const detailArea = document.getElementById("itemDetailArea");
  detailArea.classList.remove("error");
  detailArea.classList.remove("muted");
  detailArea.textContent = "아이템 정보 로딩 중...";

  try {
    const url = `${ITEM_JSON_BASE}${item.id}.json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    renderItemDetail(data, item);
  } catch (e) {
    console.error(e);
    detailArea.classList.add("error");
    detailArea.textContent = `데이터 로드 실패: ${e.message}`;
  }
}


const statKR = {
  AP: "공격력",
  AC: "명중률",
  DA: "감지력",
  LK: "행운",
  HP: "체력",
  DP: "방어력",
  HV: "회피력",
  MA: "마법력",
  MD: "마법방어",
  MP: "마나",
  "MP Recovery Rate": "마나 회복",
  "HP Recovery Rate": "체력 회복",
  "Wind Attribute": "공기 속성",
  
};


function renderItemDetail(itemData, boxItemMeta) {
  const area = document.getElementById("itemDetailArea");
  area.classList.remove("error");
  area.classList.remove("muted");

  const imgFile = itemData.imageFile || boxItemMeta.imgFile || "";
  const imgUrl = imgFile
    ? `./data/images/${imgFile}`
    : "";

  const title = itemData.title || boxItemMeta.name || "(이름 없음)";
  const table = itemData.table || {};
  const compoundable = itemData.compoundable || [];
  const attributes = itemData.attributes || {};

  let compBadges = "";
  if (compoundable.length) {
    compBadges = compoundable.map(s => {
      const kr = statKR[s] || s;
      return `<span class="badge">${kr}</span>`;
    }).join(" ");
  }

  let attrLines = "";
  const keys = Object.keys(attributes);
  if (keys.length) {
    attrLines = keys.map(key => {
      const kr = statKR[key] || key;
      const val = attributes[key];
      return `${kr} (${key}) : ${val}`;
    }).join("<br>");
  }

  const tableText = [
    table.Level ? `레벨 : ${table.Level}` : "",
    table.Value ? `값 : ${table.Value}` : "",
    table.Weight ? `무게 : ${table.Weight}` : "",
    table.Slots ? `구 : ${table.Slots}` : ""
  ].filter(Boolean).join("<br>");

  area.innerHTML = `
    <div class="item-header">
      ${imgUrl ? `<img src="${imgUrl}" alt="">` : ""}
      <div>
        <div><strong>${title}</strong></div>
        ${boxItemMeta.rate ? `<div class="muted">박스 드랍률: ${boxItemMeta.rate}</div>` : ""}
      </div>
    </div>

    ${tableText ? `<div class="muted" style="margin-bottom:6px;">${tableText}</div>` : ""}

    ${compBadges ? `
      <div class="badge-row">
        ${compBadges}
      </div>
    ` : ""}

    ${attrLines ? `
      <div style="margin-top:6px;">
        ${attrLines}
      </div>
    ` : `<div class="muted">상세 스탯 정보가 없습니다.</div>`}
  `;
}