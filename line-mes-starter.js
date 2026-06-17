const storageKey = "lineMesStarter.v1";

const steps = ["request", "review", "workorder", "line"];
const sample = {
  customer: "Siam Metal Co., Ltd.",
  salesOwner: "คุณ ภมร",
  customerRef: "RFQ-LINE-2406",
  dueDate: "2026-06-12",
  requestNote: "ลูกค้าส่ง drawing ทาง LINE ต้องการชุดโครงเหล็ก 40 ชุด ส่งล็อตแรกก่อน 20 ชุด",
  jobType: "new",
  stockStatus: "pending",
  warehouseCheckOwner: "ฝ่ายคลัง",
  warehouseReply: "",
  engineeringOwner: "Engineering / ผลิต",
  engineeringReply: "ต้องให้ช่างถอดแบบ ทำ BOM/Process เบื้องต้น และประเมินเวลา/ต้นทุน/ความเสี่ยงก่อนแจ้งกลับฝ่ายขาย",
  leadTime: "7 วันทำการ",
  riskLevel: "ต้องเฝ้าระวัง",
  productionNote: "ต้องตรวจวัสดุ SS400 และยืนยัน jig ก่อนเริ่มผลิต",
  quoteNo: "QT20260604001",
  soNo: "SO20260604001",
  woNo: "WO20260604001",
  lineName: "Line B - Assembly",
  lineOwner: "คุณ แป๊ะ",
  deliveryMode: "บริษัทจัดส่ง",
  items: [
    { name: "โครงเหล็กตามแบบ", qty: 40, unit: "ชุด" },
    { name: "ชุดน็อตประกอบ", qty: 160, unit: "ตัว" },
  ],
};

const form = document.getElementById("starterForm");
const itemsList = document.getElementById("itemsList");
const toast = document.getElementById("toast");
let lastAction = "auto";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2200);
}

function setStep(step) {
  document.querySelectorAll(".step-pill").forEach((button) => {
    button.classList.toggle("active", button.dataset.step === step);
  });
  document.querySelectorAll(".step-view").forEach((view) => {
    view.classList.toggle("active", view.id === step);
  });
  updatePreview();
}

function createItemRow(item = {}) {
  const row = document.createElement("div");
  row.className = "item-row";
  row.innerHTML = `
    <label>
      รายการ
      <input name="itemName" required placeholder="เช่น โครงเหล็กตามแบบ" value="${escapeHtml(item.name || "")}" />
    </label>
    <label>
      จำนวน
      <input name="itemQty" type="number" min="1" value="${escapeHtml(item.qty || 1)}" />
    </label>
    <label>
      หน่วย
      <input name="itemUnit" placeholder="ชุด / ชิ้น / เมตร" value="${escapeHtml(item.unit || "ชุด")}" />
    </label>
    <button class="remove-item" data-remove-item type="button" title="ลบรายการ">×</button>
  `;
  itemsList.appendChild(row);
}

function collectItems() {
  return [...document.querySelectorAll(".item-row")]
    .map((row) => ({
      name: row.querySelector('[name="itemName"]').value.trim(),
      qty: Number(row.querySelector('[name="itemQty"]').value || 0),
      unit: row.querySelector('[name="itemUnit"]').value.trim() || "ชุด",
    }))
    .filter((item) => item.name && item.qty > 0);
}

function formValues() {
  const data = new FormData(form);
  const values = Object.fromEntries(data.entries());
  delete values.files;
  document.querySelectorAll("#review input[type='checkbox'], #line input[type='checkbox']").forEach((input) => {
    values[input.name] = input.checked;
  });
  values.items = collectItems();
  values.activeStep = document.querySelector(".step-pill.active")?.dataset.step || "request";
  return values;
}

function applyValues(values) {
  Object.entries(values).forEach(([name, value]) => {
    if (name === "items" || name === "checks" || name === "activeStep") return;
    const field = document.querySelector(`[name="${CSS.escape(name)}"]`);
    if (!field) return;
    if (field.type === "file") return;
    if (field.type === "checkbox") field.checked = Boolean(value);
    else field.value = value ?? "";
  });

  const checks = values.checks || values;
  Object.entries(checks).forEach(([name, checked]) => {
    const field = document.querySelector(`input[type="checkbox"][name="${CSS.escape(name)}"]`);
    if (field) field.checked = Boolean(checked);
  });

  itemsList.innerHTML = "";
  (values.items?.length ? values.items : [{}]).forEach(createItemRow);
  setStep(values.activeStep || "request");
  updateFileHint();
  updatePreview();
}

function save() {
  window.localStorage.setItem(storageKey, JSON.stringify(formValues()));
}

function updateDraftStatus(text, tone = "muted") {
  const status = document.getElementById("draftStatus");
  if (!status) return;
  status.textContent = text;
  status.className = `draft-status ${tone}`;
}

function validateRequest() {
  const values = formValues();
  const missing = [];
  if (!String(values.customer || "").trim()) missing.push("ลูกค้า");
  if (!values.items.length) missing.push("รายการสินค้า/งาน");
  if (!String(values.dueDate || "").trim()) missing.push("วันที่ลูกค้าต้องการ");
  return { ok: missing.length === 0, missing };
}

function saveDraftFromButton() {
  save();
  lastAction = "manual-save";
  updateDraftStatus(`บันทึก Draft แล้ว ${new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}`, "good");
  showToast("บันทึก Draft แล้ว");
}

function sendToReview() {
  const result = validateRequest();
  if (!result.ok) {
    updateDraftStatus(`ยังขาด: ${result.missing.join(", ")}`, "danger");
    showToast(`กรุณากรอก ${result.missing.join(", ")}`);
    return;
  }
  save();
  lastAction = "sent-review";
  updateDraftStatus("ส่งตรวจสอบประเภทงานแล้ว", "good");
  setStep("review");
  showToast("ส่งไปขั้นตรวจสอบประเภทงานแล้ว");
}

function jobTypeLabel(value) {
  return {
    repeat: "งานเดิม",
    standard: "งานมาตรฐาน",
    new: "งานใหม่",
  }[value || "repeat"];
}

function stockStatusLabel(value) {
  if (value === "pending") return "รอคลังตอบกลับ";
  return value === "out_stock" ? "ไม่มีในสต๊อก" : "มีในสต๊อก";
}

function decisionState(values = formValues()) {
  const isNew = values.jobType === "new";
  if (isNew) {
    const hasReply = String(values.engineeringReply || "").trim().length > 0;
    return {
      ready: hasReply,
      label: hasReply ? "ช่างแจ้งกลับแล้ว" : "รอช่างถอดแบบ",
      route: [
        "งานใหม่",
        "ต้องให้ช่างถอดแบบ",
        "ส่งประเมิน Engineering / ผลิต",
        hasReply ? "แจ้งกลับฝ่ายขายแล้ว" : "รอแจ้งกลับฝ่ายขาย",
      ],
      owner: values.engineeringOwner || "Engineering / ผลิต",
      summary: hasReply ? values.engineeringReply : "ต้องรอผลถอดแบบ, BOM/Process เบื้องต้น, เวลา, ต้นทุน และความเสี่ยง",
    };
  }

  const stockLabel = stockStatusLabel(values.stockStatus);
  const hasWarehouseReply = String(values.warehouseReply || "").trim().length > 0;
  const isStockAnswered = values.stockStatus && values.stockStatus !== "pending";
  const ready = isStockAnswered && hasWarehouseReply;
  const owner = values.warehouseCheckOwner || "ฝ่ายคลัง";
  return {
    ready,
    label: ready ? `${stockLabel} - คลังตอบกลับแล้ว` : "รอฝ่ายคลังเช็คสินค้า",
    route: [
      jobTypeLabel(values.jobType),
      "ส่งให้ฝ่ายคลังเช็คสินค้า",
      ready ? `${stockLabel} - คลังตอบกลับฝ่ายขายแล้ว` : "รอคลังตอบกลับฝ่ายขาย",
    ],
    owner,
    summary: ready ? values.warehouseReply : `${jobTypeLabel(values.jobType)} ต้องรอฝ่ายคลังเช็คสินค้าและตอบกลับฝ่ายขายก่อนเปิด SO/WO`,
  };
}

function updateDecisionVisibility(values = formValues()) {
  const isNew = values.jobType === "new";
  ["stockStatusField", "warehouseCheckField", "warehouseReplyField"].forEach((id) => {
    const field = document.getElementById(id);
    if (field) field.classList.toggle("hidden", isNew);
  });
  ["engineeringOwnerField", "engineeringReplyField"].forEach((id) => {
    const field = document.getElementById(id);
    if (field) field.classList.toggle("hidden", !isNew);
  });
}

function readiness() {
  const decision = decisionState();
  return { done: decision.ready ? 1 : 0, total: 1, ready: decision.ready, label: decision.label };
}

function activeStepIndex() {
  const step = document.querySelector(".step-pill.active")?.dataset.step || "request";
  return steps.indexOf(step);
}

function updatePreview() {
  const values = formValues();
  const items = values.items;
  const itemText = items.length ? items.map((item) => `${item.name} ${item.qty} ${item.unit}`).join(", ") : "ยังไม่ได้เพิ่มรายการ";
  const docNo = values.woNo || values.soNo || values.quoteNo || "INQ-DRAFT";
  const currentStep = activeStepIndex();
  const ready = readiness();
  const decision = decisionState(values);
  updateDecisionVisibility(values);

  document.getElementById("miniDocNo").textContent = docNo;
  document.getElementById("miniCustomer").textContent = values.customer || "ยังไม่มีลูกค้า";
  document.getElementById("miniDue").textContent = values.dueDate ? `กำหนดส่ง ${values.dueDate}` : "รอวันที่ส่ง";
  document.getElementById("miniItems").textContent = itemText;
  document.getElementById("miniFlow").innerHTML = steps
    .map((step, index) => `<span class="${index <= currentStep ? "active" : ""}">${index + 1}. ${stepLabel(step)}</span>`)
    .join("");

  const chip = document.getElementById("readinessChip");
  if (chip) {
    chip.textContent = ready.ready ? "พร้อมเปิด WO" : ready.label;
    chip.className = `status-chip ${ready.ready ? "green" : "red"}`;
  }
  const decisionChip = document.getElementById("decisionChip");
  if (decisionChip) {
    decisionChip.textContent = decision.label;
    decisionChip.className = `status-chip ${decision.ready ? "green" : "amber"}`;
  }
  const decisionFlow = document.getElementById("decisionFlow");
  if (decisionFlow) {
    decisionFlow.innerHTML = decision.route.map((step) => `<span>${escapeHtml(step)}</span>`).join("");
  }

  document.getElementById("lineMessage").textContent = buildLineMessage(values, ready);
  save();
  if (lastAction === "auto") updateDraftStatus("บันทึกอัตโนมัติเป็น Draft");
}

function stepLabel(step) {
  return {
    request: "รับคำขอ",
    review: "เช็กก่อนผลิต",
    workorder: "เปิดใบงาน",
    line: "ส่งเข้า LINE",
  }[step];
}

function buildLineMessage(values, ready) {
  const items = values.items.length
    ? values.items.map((item) => `- ${item.name}: ${item.qty} ${item.unit}`).join("\n")
    : "- ยังไม่ได้เพิ่มรายการ";
  const decision = decisionState(values);
  const missing = decision.ready ? [] : [decision.summary];
  const groups = [...document.querySelectorAll("#line input[type='checkbox']:checked")]
    .map((input) => input.parentElement.textContent.trim())
    .join(", ");

  return [
    `[MES] ${values.woNo || values.soNo || values.quoteNo || "INQ-DRAFT"}`,
    `ลูกค้า: ${values.customer || "-"}`,
    `ผู้ขาย: ${values.salesOwner || "-"}`,
    `อ้างอิง: ${values.customerRef || "-"}`,
    `กำหนดส่ง: ${values.dueDate || "-"}`,
    "",
    "รายการ:",
    items,
    "",
    `ประเภทงาน: ${jobTypeLabel(values.jobType)}`,
    `ทางเดินงาน: ${decision.route.join(" -> ")}`,
    `ผู้รับผิดชอบ: ${decision.owner}`,
    `Lead time: ${values.leadTime || "-"}`,
    `ความเสี่ยง: ${values.riskLevel || "-"}`,
    `ผลตรวจสอบก่อนเปิด WO: ${decision.label}`,
    missing.length ? `ยังขาด: ${missing.join(", ")}` : "พร้อมเปิด Work Order",
    "",
    `ไลน์ผลิต: ${values.lineName || "-"}`,
    `ผู้คุมงาน: ${values.lineOwner || "-"}`,
    `ส่งแจ้งเตือนถึง: ${groups || "-"}`,
    "",
    `หมายเหตุ: ${values.productionNote || values.requestNote || "-"}`,
  ].join("\n");
}

function updateFileHint() {
  const files = [...document.getElementById("fileInput").files];
  document.getElementById("fileHint").textContent = files.length
    ? files.map((file) => `${file.name} (${Math.ceil(file.size / 1024).toLocaleString("th-TH")} KB)`).join(", ")
    : "ยังไม่ได้เลือกไฟล์";
}

document.querySelectorAll(".step-pill").forEach((button) => {
  button.addEventListener("click", () => setStep(button.dataset.step));
});

document.getElementById("addItemBtn").addEventListener("click", () => {
  createItemRow();
  updatePreview();
});

document.getElementById("saveDraftBtn").addEventListener("click", saveDraftFromButton);
document.getElementById("sendReviewBtn").addEventListener("click", sendToReview);

itemsList.addEventListener("click", (event) => {
  if (!event.target.matches("[data-remove-item]")) return;
  if (document.querySelectorAll(".item-row").length === 1) {
    showToast("ต้องมีอย่างน้อย 1 รายการ");
    return;
  }
  event.target.closest(".item-row").remove();
  updatePreview();
});

document.addEventListener("input", (event) => {
  lastAction = "auto";
  if (event.target.closest(".app")) updatePreview();
});

document.addEventListener("change", (event) => {
  lastAction = "auto";
  if (event.target.id === "fileInput") updateFileHint();
  if (event.target.closest(".app")) updatePreview();
});

document.getElementById("loadSampleBtn").addEventListener("click", () => {
  lastAction = "auto";
  applyValues(sample);
  showToast("โหลดข้อมูลตัวอย่างแล้ว");
});

document.getElementById("resetBtn").addEventListener("click", () => {
  if (!window.confirm("ต้องการล้างข้อมูลในฟอร์มนี้ใช่ไหม?")) return;
  window.localStorage.removeItem(storageKey);
  lastAction = "auto";
  form.reset();
  document.querySelectorAll("#review input[type='checkbox']").forEach((input) => {
    input.checked = false;
  });
  itemsList.innerHTML = "";
  createItemRow();
  setStep("request");
  updateFileHint();
  updatePreview();
  updateDraftStatus("ยังไม่ได้บันทึกด้วยปุ่ม");
  showToast("ล้างฟอร์มแล้ว");
});

document.getElementById("copyLineBtn").addEventListener("click", async () => {
  const text = document.getElementById("lineMessage").textContent;
  await navigator.clipboard.writeText(text);
  showToast("คัดลอกข้อความ LINE แล้ว");
});

document.querySelectorAll("[data-command]").forEach((button) => {
  button.addEventListener("click", () => {
    const values = formValues();
    showToast(`${button.dataset.command}: ${values.woNo || values.soNo || "INQ-DRAFT"}`);
  });
});

const saved = window.localStorage.getItem(storageKey);
if (saved) {
  applyValues(JSON.parse(saved));
} else {
  createItemRow();
  updatePreview();
}
