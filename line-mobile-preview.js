const statusLabels = {
  NEW_INQUIRY: "รับเรื่องใหม่",
  WAITING_DESIGN: "รอถอดแบบ",
  WAITING_STOCK: "รอเช็คสต๊อก",
  QUOTING: "รอเสนอราคา",
  WAITING_CUSTOMER_CONFIRM: "รอลูกค้ายืนยัน",
  CONFIRMED: "ยืนยันแล้ว",
  WAITING_SO: "รอออก SO",
  WAITING_PRODUCTION_PLAN: "รอวางแผน",
  IN_PRODUCTION: "กำลังผลิต",
  PRODUCTION_DONE: "ผลิตเสร็จ",
  WAITING_DELIVERY_CONFIRM: "รอยืนยันส่ง",
  WAIT_BOOKING_TRUCK: "รอจองรถ",
  READY_TO_DELIVER: "พร้อมส่ง",
  DELIVERED: "จัดส่งแล้ว",
  CLOSED: "สมบูรณ์",
};

const roleConfig = {
  sales: {
    label: "ฝ่ายขาย",
    headline: "งานที่ฝ่ายขายต้องติดตาม",
    statuses: ["NEW_INQUIRY", "QUOTING", "WAITING_CUSTOMER_CONFIRM", "WAITING_SO", "PRODUCTION_DONE", "WAITING_DELIVERY_CONFIRM"],
    bubble: "รายการที่ต้องตอบลูกค้า ออกเอกสาร QT/SO และติดตามงานที่ผลิตแจ้งกลับ",
  },
  production: {
    label: "ฝ่ายผลิต",
    headline: "งานผลิตและถอดแบบ",
    statuses: ["WAITING_DESIGN", "WAITING_PRODUCTION_PLAN", "IN_PRODUCTION", "PRODUCTION_DONE"],
    bubble: "งานที่ต้องถอดแบบ รับแผนผลิต หรือรายงานผลผลิตกลับฝ่ายขาย",
  },
  warehouse: {
    label: "คลัง",
    headline: "งานเช็คสต๊อก",
    statuses: ["WAITING_STOCK"],
    bubble: "คำขอเช็คสต๊อกที่ต้องตอบกลับฝ่ายขายก่อนออก SO",
  },
  logistics: {
    label: "ขนส่ง",
    headline: "งานจัดส่ง",
    statuses: ["WAITING_DELIVERY_CONFIRM", "WAIT_BOOKING_TRUCK", "READY_TO_DELIVER", "DELIVERED"],
    bubble: "งานที่ต้องจองรถ ยืนยันรอบส่ง และปิดสถานะจัดส่ง",
  },
};

let state = { jobs: [], notifications: [] };
let activeRole = "sales";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2200);
}

function formatDate(dateText) {
  if (!dateText) return "ไม่ระบุวันส่ง";
  return new Date(`${dateText}T00:00:00+07:00`).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function daysUntil(dateText) {
  if (!dateText) return 99;
  const today = new Date("2026-06-11T00:00:00+07:00");
  const target = new Date(`${dateText}T00:00:00+07:00`);
  return Math.ceil((target - today) / 86400000);
}

function lineItems(job) {
  if (Array.isArray(job.lineItems) && job.lineItems.length) return job.lineItems;
  if (job.item) return [{ name: job.item, quantity: job.quantity || 1 }];
  return [];
}

function itemSummary(job) {
  const items = lineItems(job);
  if (!items.length) return "ไม่มีรายการสินค้า";
  return items
    .slice(0, 2)
    .map((item) => `${item.name} x ${item.quantity || 1}`)
    .join(", ");
}

function statusClass(status, job) {
  if (daysUntil(job.dueDate) <= 0 && !["DELIVERED", "CLOSED"].includes(status)) return "danger";
  if (["WAITING_DESIGN", "WAITING_STOCK", "WAIT_BOOKING_TRUCK"].includes(status)) return "warn";
  if (["PRODUCTION_DONE", "READY_TO_DELIVER", "DELIVERED", "CLOSED"].includes(status)) return "good";
  return "";
}

function ownerText(job) {
  if (job.status === "WAITING_DESIGN" || job.status === "IN_PRODUCTION") return "ผู้รับผิดชอบ: คุณ แป๊ะ";
  if (job.status === "WAITING_STOCK") return "ผู้รับผิดชอบ: คุณ พล";
  if (job.status === "WAIT_BOOKING_TRUCK" || job.status === "READY_TO_DELIVER") return "ผู้รับผิดชอบ: คุณ เรณู";
  return `ผู้รับผิดชอบ: ${job.salesOwner || "ฝ่ายขาย"}`;
}

function roleJobs(role) {
  const config = roleConfig[role];
  return state.jobs
    .filter((job) => config.statuses.includes(job.status))
    .sort((a, b) => daysUntil(a.dueDate) - daysUntil(b.dueDate));
}

function urgentJobs(jobs) {
  return jobs.filter((job) => daysUntil(job.dueDate) <= 1 && !["DELIVERED", "CLOSED"].includes(job.status));
}

function renderJobs(jobs) {
  const container = document.getElementById("jobStack");
  const rows = jobs.slice(0, 6);
  if (!rows.length) {
    container.innerHTML = `<div class="job-card"><strong>ไม่มีงานค้างในมุมมองนี้</strong><span class="job-meta">ลองเลือกแผนกอื่นจากแถบด้านบน</span></div>`;
    return;
  }

  container.innerHTML = rows
    .map(
      (job) => `
        <article class="job-card">
          <div class="job-head">
            <strong>${escapeHtml(job.id)}</strong>
            <span class="status-pill ${statusClass(job.status, job)}">${escapeHtml(statusLabels[job.status] || job.status)}</span>
          </div>
          <div class="job-customer">${escapeHtml(job.customer)}</div>
          <div class="job-meta">${escapeHtml(itemSummary(job))}</div>
          <div class="job-owner">${escapeHtml(ownerText(job))}</div>
          <div class="job-meta">กำหนดส่ง ${escapeHtml(formatDate(job.dueDate))} · ${escapeHtml(job.deliveryMode || "-")}</div>
          <div class="job-actions">
            <button class="primary" type="button" data-open-job="${escapeHtml(job.id)}">เปิดรายละเอียด</button>
            <button type="button" data-copy-job="${escapeHtml(job.id)}">ส่งต่อใน LINE</button>
          </div>
        </article>`
    )
    .join("");
}

function render() {
  const config = roleConfig[activeRole];
  const jobs = roleJobs(activeRole);
  const urgent = urgentJobs(jobs);

  document.querySelectorAll(".role-tabs button").forEach((button) => {
    button.classList.toggle("active", button.dataset.role === activeRole);
  });
  document.getElementById("roleLabel").textContent = config.label;
  document.getElementById("roleHeadline").textContent = config.headline;
  document.getElementById("totalJobs").textContent = state.jobs.length;
  document.getElementById("todoJobs").textContent = jobs.length;
  document.getElementById("urgentJobs").textContent = urgent.length;
  document.getElementById("bubbleTitle").textContent = `${config.label}: ${jobs.length} งานต้องติดตาม`;
  document.getElementById("bubbleText").textContent = urgent.length
    ? `${config.bubble} มีงานด่วน ${urgent.length} งานที่ควรเปิดอ่านก่อน`
    : config.bubble;
  renderJobs(jobs);
}

async function loadState() {
  const response = await fetch("/api/state");
  if (!response.ok) throw new Error(`โหลดข้อมูลไม่สำเร็จ ${response.status}`);
  state = await response.json();
  document.getElementById("syncTime").textContent = `อัปเดต ${new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}`;
  render();
}

document.querySelectorAll(".role-tabs button").forEach((button) => {
  button.addEventListener("click", () => {
    activeRole = button.dataset.role;
    render();
  });
});

document.getElementById("refreshBtn").addEventListener("click", async () => {
  try {
    await loadState();
    showToast("โหลดข้อมูลล่าสุดแล้ว");
  } catch (error) {
    showToast(error.message);
  }
});

document.querySelector(".rich-menu").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-command]");
  if (!button) return;
  const labels = {
    today: "แสดงงานวันนี้",
    mine: "แสดงงานของฉัน",
    scan: "เปิดค้นหาเลข INQ",
    notify: "เปิดรายการแจ้งเตือน",
  };
  showToast(labels[button.dataset.command] || "เลือกคำสั่ง");
});

document.getElementById("jobStack").addEventListener("click", (event) => {
  const openButton = event.target.closest("[data-open-job]");
  const copyButton = event.target.closest("[data-copy-job]");
  if (openButton) showToast(`เปิดรายละเอียด ${openButton.dataset.openJob}`);
  if (copyButton) showToast(`จำลองส่งต่อ ${copyButton.dataset.copyJob} ใน LINE`);
});

loadState().catch((error) => {
  document.getElementById("syncTime").textContent = "โหลดข้อมูลไม่สำเร็จ";
  showToast(error.message);
});
