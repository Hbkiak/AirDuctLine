const currentUser = {
  name: "คุณ โชคพิสิฐ",
  role: "ฝ่ายขาย",
  line: "LINE ส่วนตัวที่ผูกกับระบบแล้ว",
};

const chatMessages = [
  {
    side: "system",
    title: "ยินดีต้อนรับเข้าสู่ Office MES",
    text: "กด Rich Menu ด้านล่างเพื่อสร้างงานใหม่ ดูงานของฉัน หรือเปิด Dashboard ตามสิทธิ์ของคุณ",
    time: "09:05",
    actions: [
      ["create", "สร้างงาน"],
      ["my", "งานของฉัน"],
    ],
  },
  {
    side: "system",
    title: "งานถอดแบบเสร็จแล้ว",
    text: "INQ20260602047 ฝ่ายผลิตแจ้งกลับแล้ว กรุณาเปิดอ่านรายละเอียดและสร้าง SO",
    time: "09:18",
    actions: [
      ["notify", "เปิดแจ้งเตือน"],
      ["docs", "ดูเอกสาร"],
    ],
  },
  {
    side: "user",
    title: "ฝ่ายขาย",
    text: "รับทราบ กำลังตรวจข้อมูลเพื่อสร้าง SO",
    time: "09:21",
  },
];

const jobs = [
  {
    id: "INQ20260602047",
    customer: "Test 22 6 26 9.21",
    item: "ท่อลม 5x5 30 เมตร x 2",
    status: "รอสร้าง SO",
    tone: "warn",
    owner: "คุณ โชคพิสิฐ",
  },
  {
    id: "INQ20260602048",
    customer: "บริษัท ตัวอย่าง จำกัด",
    item: "Duct fitting x 8",
    status: "รอเสนอราคา",
    tone: "",
    owner: "คุณ ธนา",
  },
  {
    id: "WO20260629003",
    customer: "Factory A",
    item: "Main duct set x 1",
    status: "ผลิตเสร็จ",
    tone: "good",
    owner: "คุณ โรง",
  },
];

const viewContent = {
  create: {
    kicker: "LIFF / Sales",
    title: "สร้างงานใหม่",
    html: `
      ${userChip()}
      <div class="form-grid">
        <label class="field-label">ลูกค้า<input value="บริษัท ตัวอย่าง จำกัด" /></label>
        <label class="field-label">รายการสินค้า<input value="ท่อลมเหลี่ยม / ขนาด / จำนวน" /></label>
        <label class="field-label">กำหนดส่ง<input value="30 มิ.ย. 2569" /></label>
        <label class="field-label">รายละเอียดจากลูกค้า<textarea>แนบสเปกหรือข้อความจากลูกค้า แล้วส่งต่อให้ฝ่ายผลิต/คลังตรวจสอบ</textarea></label>
      </div>
      <div class="button-row">
        <button type="button">แนบไฟล์</button>
        <button class="primary" type="button" data-demo-submit="create">ส่งเข้าระบบ</button>
      </div>
    `,
  },
  my: {
    kicker: "LIFF / My Tasks",
    title: "งานของฉัน",
    html: `
      ${userChip()}
      ${jobs.map(createJobCard).join("")}
    `,
  },
  notify: {
    kicker: "LIFF / Notifications",
    title: "แจ้งเตือน",
    html: `
      ${createNotice("งานใหม่จากฝ่ายขาย", "INQ20260602049 ส่งให้ฝ่ายผลิตถอดแบบ", "09:28")}
      ${createNotice("ฝ่ายผลิตตอบกลับแล้ว", "INQ20260602047 มีข้อความและไฟล์แนบกลับมาถึงฝ่ายขาย", "09:18")}
      ${createNotice("เอกสารถูกเปิดอ่าน", "คุณ โรง เปิดอ่านงาน INQ20260602049 แล้ว", "09:12")}
    `,
  },
  dashboard: {
    kicker: "LIFF / Dashboard",
    title: "Dashboard",
    html: `
      <div class="metrics-grid">
        <div class="metric-tile"><strong>26</strong><span>งานทั้งหมด</span></div>
        <div class="metric-tile"><strong>8</strong><span>รอ SO</span></div>
        <div class="metric-tile"><strong>3</strong><span>ด่วน</span></div>
      </div>
      ${jobs.map(createJobCard).join("")}
    `,
  },
  docs: {
    kicker: "LIFF / Documents",
    title: "เอกสาร",
    html: `
      ${createDocRow("INQ20260602047", "ผลถอดแบบจากฝ่ายผลิต", "เปิดอ่านแล้ว")}
      ${createDocRow("SO20260629002", "Sales Order", "รออนุมัติ")}
      ${createDocRow("WO20260629003", "Work Order", "อยู่ระหว่างผลิต")}
    `,
  },
  admin: {
    kicker: "LIFF / Admin",
    title: "Admin",
    html: `
      ${userChip("ผู้ดูแลระบบ", "ใช้เฉพาะเพิ่มรายชื่อและผูก LINE User ID")}
      <div class="doc-row"><strong>รายชื่อพนักงาน</strong><span>ฝ่ายขาย / ผลิต / คลัง / ส่งของ</span></div>
      <div class="doc-row"><strong>ผูก LINE</strong><span>จับคู่ LINE User ID กับชื่อพนักงาน</span></div>
      <div class="doc-row"><strong>สิทธิ์การเปิดอ่าน</strong><span>กำหนดตามแผนกและสถานะงาน</span></div>
    `,
  },
};

const chatMessagesEl = document.getElementById("chatMessages");
const liffScreen = document.getElementById("liffScreen");
const liffKicker = document.getElementById("liffKicker");
const liffTitle = document.getElementById("liffTitle");
const liffPanel = document.getElementById("liffPanel");
const richMenuButtons = [...document.querySelectorAll(".rich-menu-grid button")];

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function userChip(name = currentUser.name, detail = `${currentUser.role} / ${currentUser.line}`) {
  return `
    <div class="user-chip">
      <div class="oa-avatar">ME</div>
      <div><b>${escapeHtml(name)}</b><span>${escapeHtml(detail)}</span></div>
    </div>`;
}

function createJobCard(job) {
  return `
    <article class="job-mini-card">
      <header><strong>${escapeHtml(job.id)}</strong><span class="status-pill ${escapeHtml(job.tone)}">${escapeHtml(job.status)}</span></header>
      <span>${escapeHtml(job.customer)}</span>
      <div>${escapeHtml(job.item)}</div>
      <span>ผู้รับผิดชอบ: ${escapeHtml(job.owner)}</span>
    </article>`;
}

function createNotice(title, text, time) {
  return `
    <article class="chat-bubble system">
      <strong>${escapeHtml(title)}</strong>
      <span>${escapeHtml(text)}</span>
      <small>${escapeHtml(time)}</small>
      <div class="bubble-actions"><button class="primary" data-view="my" type="button">เปิดงาน</button><button data-view="docs" type="button">ดูเอกสาร</button></div>
    </article>`;
}

function createDocRow(id, title, status) {
  return `
    <div class="doc-row">
      <div><strong>${escapeHtml(id)}</strong><span>${escapeHtml(title)}</span></div>
      <span>${escapeHtml(status)}</span>
    </div>`;
}

function renderChat() {
  chatMessagesEl.innerHTML = chatMessages
    .map(
      (message) => `
        <article class="chat-bubble ${escapeHtml(message.side)}">
          <strong>${escapeHtml(message.title)}</strong>
          <span>${escapeHtml(message.text)}</span>
          <small>${escapeHtml(message.time)}</small>
          ${
            Array.isArray(message.actions)
              ? `<div class="bubble-actions">${message.actions.map(([view, label]) => `<button data-view="${escapeHtml(view)}" type="button">${escapeHtml(label)}</button>`).join("")}</div>`
              : ""
          }
        </article>`
    )
    .join("");
}

function renderLiff(view = "create") {
  const content = viewContent[view] || viewContent.create;
  liffKicker.textContent = content.kicker;
  liffTitle.textContent = content.title;
  liffPanel.innerHTML = content.html;
  richMenuButtons.forEach((button) => button.classList.toggle("active", button.dataset.view === view));
  liffScreen.classList.add("open");
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2200);
}

document.querySelector(".rich-menu-grid").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-view]");
  if (!button) return;
  renderLiff(button.dataset.view);
});

document.getElementById("chatScreen").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-view]");
  if (!button) return;
  renderLiff(button.dataset.view);
});

liffPanel.addEventListener("click", (event) => {
  const submitButton = event.target.closest("[data-demo-submit]");
  const viewButton = event.target.closest("button[data-view]");
  if (submitButton) showToast("จำลอง: บันทึกงานใหม่และส่งแจ้งเตือนไปฝ่ายผลิตแล้ว");
  if (viewButton) renderLiff(viewButton.dataset.view);
});

document.getElementById("closeLiffBtn").addEventListener("click", () => {
  liffScreen.classList.remove("open");
  richMenuButtons.forEach((button) => button.classList.remove("active"));
});

renderChat();
