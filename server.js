const http = require("http");
const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const root = __dirname;
const port = Number(process.env.PORT || 8000);
const host = process.env.HOST || "127.0.0.1";
const dataDir = path.join(root, "data");
const uploadDir = path.join(root, "uploads");
const dbFile = path.join(dataDir, "state.json");

const today = new Date("2026-06-02T09:00:00+07:00");

const statusLabels = {
  NEW_INQUIRY: "รับเรื่องใหม่",
  WAITING_DESIGN: "รอถอดแบบ",
  WAITING_STOCK: "รอเช็คสต็อก",
  QUOTING: "รอเสนอราคา",
  WAITING_CUSTOMER_CONFIRM: "รอลูกค้ายืนยัน",
  CONFIRMED: "ยืนยันแล้ว",
  WAITING_SO: "รอฝ่ายขายออก SO",
  WAITING_PRODUCTION_PLAN: "รอวางแผนผลิต",
  IN_PRODUCTION: "กำลังผลิต",
  PRODUCTION_DONE: "ผลิตเสร็จ",
  WAITING_DELIVERY_CONFIRM: "รอยืนยันจัดส่ง",
  WAIT_BOOKING_TRUCK: "รอจองรถ",
  READY_TO_DELIVER: "พร้อมจัดส่ง",
  DELIVERED: "จัดส่งแล้ว",
  CLOSED: "สมบูรณ์แล้ว",
};

const departmentByStatus = {
  NEW_INQUIRY: "ฝ่ายขาย",
  WAITING_DESIGN: "ถอดแบบ/ผลิต",
  WAITING_STOCK: "คลัง",
  QUOTING: "ฝ่ายขาย",
  WAITING_CUSTOMER_CONFIRM: "ฝ่ายขาย",
  CONFIRMED: "Admin",
  WAITING_SO: "ฝ่ายขาย",
  WAITING_PRODUCTION_PLAN: "วางแผน",
  IN_PRODUCTION: "ผลิต",
  PRODUCTION_DONE: "ฝ่ายขาย",
  WAITING_DELIVERY_CONFIRM: "ฝ่ายขาย",
  WAIT_BOOKING_TRUCK: "ขนส่ง",
  READY_TO_DELIVER: "ขนส่ง",
  DELIVERED: "Admin",
  CLOSED: "Admin",
};

const ownersByDepartment = {
  "ถอดแบบ/ผลิต": ["คุณ แป๊ะ", "คุณ โรง", "คุณ เปรมสุข"],
  ผลิต: ["คุณ แป๊ะ", "คุณ โรง", "คุณ เปรมสุข"],
  วางแผน: ["คุณ แพ็ด"],
  คลัง: ["คุณ พล"],
  ขนส่ง: ["คุณ เรณู"],
  Admin: ["Admin", "คุณ ธนา"],
};

const defaultUsers = [
  { id: "sales-pamon", name: "คุณ ภมร", role: "sales", department: "ฝ่ายขาย" },
  { id: "sales-monthian", name: "คุณ มณเทียร", role: "sales", department: "ฝ่ายขาย" },
  { id: "sales-saknarong", name: "คุณ ศักดิ์ณรงค์", role: "sales", department: "ฝ่ายขาย" },
  { id: "sales-pakin", name: "คุณ ภาคิน", role: "sales", department: "ฝ่ายขาย" },
  { id: "sales-lakkana", name: "คุณ ลัคนา", role: "sales", department: "ฝ่ายขาย" },
  { id: "sales-wanida", name: "คุณ วนิดา", role: "sales", department: "ฝ่ายขาย" },
  { id: "sales-sathinee", name: "คุณ สาธินี", role: "sales", department: "ฝ่ายขาย" },
  { id: "sales-wachirawan", name: "คุณ วชิราวรรณ", role: "sales", department: "ฝ่ายขาย" },
  { id: "sales-supansa", name: "คุณ สุพรรษา", role: "sales", department: "ฝ่ายขาย" },
  { id: "sales-chokepisit", name: "คุณ โชคพิสิฐ", role: "sales", department: "ฝ่ายขาย" },
  { id: "sales-thana", name: "คุณ ธนา", role: "sales", department: "ฝ่ายขาย" },
  { id: "prod-pae", name: "คุณ แป๊ะ", role: "production", department: "ถอดแบบ/ผลิต" },
  { id: "prod-rong", name: "คุณ โรง", role: "production", department: "ถอดแบบ/ผลิต" },
  { id: "prod-premsuk", name: "คุณ เปรมสุข", role: "production", department: "ถอดแบบ/ผลิต" },
  { id: "plan-pad", name: "คุณ แพ็ด", role: "planning", department: "วางแผน" },
  { id: "wh-pon", name: "คุณ พล", role: "warehouse", department: "คลัง" },
  { id: "log-renu", name: "คุณ เรณู", role: "logistics", department: "ขนส่ง" },
  { id: "admin", name: "Admin", role: "admin", department: "Admin" },
  { id: "admin-thana", name: "คุณ ธนา", role: "admin", department: "Admin" },
];

const defaultState = {
  counters: {},
  users: defaultUsers,
  activityLog: [],
  jobs: [
    {
      id: "INQ20260602001",
      customer: "บริษัท สยามเมทัล จำกัด",
      item: "โครงเหล็กตามแบบลูกค้า",
      quantity: 40,
      customerRef: "RFQ-LINE-001",
      salesOwner: "คุณ ภมร",
      files: [{ name: "แบบงาน.pdf", size: 0, type: "application/pdf", url: "" }],
      status: "WAITING_DESIGN",
      dueDate: "2026-06-04",
      deliveryMode: "บริษัทจัดส่ง",
      quoteNo: "",
      soNo: "",
      woNo: "",
      note: "ลูกค้าต้องการทราบ lead time ก่อนเที่ยง",
    },
    {
      id: "INQ20260602002",
      customer: "เอเชียแพ็ค",
      item: "สินค้ามาตรฐาน รุ่น ST-22",
      quantity: 300,
      customerRef: "โทรเข้า",
      salesOwner: "คุณ มณเทียร",
      files: [{ name: "ภาพถ่ายเอกสาร.jpg", size: 0, type: "image/jpeg", url: "" }],
      status: "WAITING_STOCK",
      dueDate: "2026-06-03",
      deliveryMode: "ลูกค้ารับเอง",
      quoteNo: "",
      soNo: "",
      woNo: "",
      note: "ฝ่ายขายถอดรายการเอง รอคลังยืนยันจำนวน",
    },
    {
      id: "INQ20260602003",
      customer: "North Factory",
      item: "ชุดประกอบพิเศษ",
      quantity: 120,
      customerRef: "PO-NF-778",
      salesOwner: "คุณ ศักดิ์ณรงค์",
      files: [{ name: "PO-NF-778.pdf", size: 0, type: "application/pdf", url: "" }],
      status: "IN_PRODUCTION",
      dueDate: "2026-06-02",
      deliveryMode: "บริษัทจัดส่ง",
      quoteNo: "QT20260602001",
      soNo: "SO20260602001",
      woNo: "WO20260602001",
      note: "ต้องจองรถก่อน 10:00 วันนี้",
    },
  ],
  notifications: [
    "LINE -> ถอดแบบ/ผลิต คุณ แป๊ะ: มีงานใหม่ INQ20260602001 รอถอดแบบ",
    "LINE -> คลัง คุณ พล: มีคำขอเช็คสต็อก INQ20260602002",
    "LINE -> ขนส่ง คุณ เรณู: SO20260602001 ต้องจองรถก่อน 10:00",
  ],
};

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

async function ensureStorage() {
  await fsp.mkdir(dataDir, { recursive: true });
  await fsp.mkdir(uploadDir, { recursive: true });
  if (!fs.existsSync(dbFile)) {
    await writeState(defaultState);
  }
}

async function readState() {
  await ensureStorage();
  const text = await fsp.readFile(dbFile, "utf8");
  const state = JSON.parse(text);
  return normalizeState(state);
}

async function writeState(state) {
  await fsp.mkdir(dataDir, { recursive: true });
  await fsp.writeFile(dbFile, JSON.stringify(normalizeState(state), null, 2), "utf8");
}

function json(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function error(res, status, message) {
  json(res, status, { error: message });
}

function requireSales(req, res, state) {
  const user = currentUser(req, state);
  if (user?.role === "sales" || user?.role === "admin") return user;
  if (!user && (req.headers["x-user-role"] || "").toLowerCase() === "sales") return { id: "legacy-sales", name: "ฝ่ายขาย", role: "sales" };
  error(res, 403, "สร้างงานใหม่ได้เฉพาะฝ่ายขาย");
  return null;
}

function normalizeState(state) {
  const existingUsers = Array.isArray(state.users) ? state.users : [];
  const userById = new Map(existingUsers.map((user) => [user.id, user]));
  defaultUsers.forEach((user) => {
    if (!userById.has(user.id)) userById.set(user.id, user);
  });
  state.users = [...userById.values()];
  state.activityLog = Array.isArray(state.activityLog) ? state.activityLog : [];
  state.notifications = Array.isArray(state.notifications) ? state.notifications : [];
  state.jobs = Array.isArray(state.jobs) ? state.jobs : [];
  state.counters = state.counters || {};
  state.jobs.forEach((job) => {
    job.reads = Array.isArray(job.reads) ? job.reads : [];
  });
  return state;
}

function currentUser(req, state) {
  const userId = req.headers["x-user-id"];
  const user = state.users.find((item) => item.id === userId);
  if (user) return user;
  const role = (req.headers["x-user-role"] || "").toLowerCase();
  if (role) return state.users.find((item) => item.role === role) || null;
  return null;
}

function readTarget(job, status = job.status) {
  const salesTarget = { role: "sales", name: job.salesOwner || "" };
  const targets = {
    NEW_INQUIRY: salesTarget,
    WAITING_DESIGN: { role: "production", name: "คุณ แป๊ะ" },
    WAITING_STOCK: { role: "warehouse", name: "คุณ พล" },
    QUOTING: salesTarget,
    WAITING_CUSTOMER_CONFIRM: salesTarget,
    CONFIRMED: { role: "admin", name: "Admin" },
    DESIGN_REPLY: salesTarget,
    WAITING_SO: salesTarget,
    WAITING_PRODUCTION_PLAN: { role: "planning", name: "คุณ แพ็ด" },
    IN_PRODUCTION: { role: "production", name: "คุณ แป๊ะ" },
    PRODUCTION_DONE: salesTarget,
    WAITING_DELIVERY_CONFIRM: salesTarget,
    WAIT_BOOKING_TRUCK: { role: "logistics", name: "คุณ เรณู" },
    READY_TO_DELIVER: { role: "logistics", name: "คุณ เรณู" },
    DELIVERED: { role: "admin", name: "Admin" },
    CLOSED: { role: "admin", name: "Admin" },
  };
  return targets[status] || { role: "admin", name: "Admin" };
}

function canReadJob(user, job, status = job.status) {
  if (!user) return false;
  if (user.role === "admin") return true;
  const target = readTarget(job, status);
  if (target.name && user.name === target.name) return true;
  return user.role === target.role && !target.name;
}

function requireCurrentUser(req, res, state) {
  const user = currentUser(req, state);
  if (user) return user;
  error(res, 401, "กรุณาเข้าสู่ระบบก่อน");
  return null;
}

function recordActivity(state, user, action, job, detail = "") {
  const item = {
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    userId: user?.id || "",
    userName: user?.name || "ไม่ระบุ",
    role: user?.role || "",
    action,
    jobId: job?.id || "",
    detail,
  };
  state.activityLog.unshift(item);
  state.activityLog = state.activityLog.slice(0, 500);
  return item;
}

function collectBody(req, limit = 25 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on("data", (chunk) => {
      total += chunk.length;
      if (total > limit) {
        reject(new Error("Request body too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

async function readJson(req) {
  const body = await collectBody(req, 2 * 1024 * 1024);
  return body.length ? JSON.parse(body.toString("utf8")) : {};
}

function parseMultipart(body, contentType) {
  const boundaryMatch = contentType.match(/boundary=([^;]+)/);
  if (!boundaryMatch) throw new Error("Missing multipart boundary");
  const boundary = Buffer.from(`--${boundaryMatch[1]}`);
  const fields = {};
  const files = [];
  let start = body.indexOf(boundary);

  while (start !== -1) {
    start += boundary.length;
    if (body.slice(start, start + 2).toString() === "--") break;
    if (body.slice(start, start + 2).toString() === "\r\n") start += 2;

    const next = body.indexOf(boundary, start);
    if (next === -1) break;
    let part = body.slice(start, next);
    if (part.slice(-2).toString() === "\r\n") part = part.slice(0, -2);

    const headerEnd = part.indexOf(Buffer.from("\r\n\r\n"));
    if (headerEnd !== -1) {
      const headerText = part.slice(0, headerEnd).toString("utf8");
      const content = part.slice(headerEnd + 4);
      const name = /name="([^"]+)"/.exec(headerText)?.[1];
      const filename = /filename="([^"]*)"/.exec(headerText)?.[1];
      const mimeType = /Content-Type:\s*([^\r\n]+)/i.exec(headerText)?.[1] || "application/octet-stream";

      if (name && filename) {
        files.push({ field: name, name: filename, type: mimeType, content });
      } else if (name) {
        fields[name] = content.toString("utf8");
      }
    }
    start = next;
  }

  return { fields, files };
}

function safeFileName(name) {
  const cleaned = path.basename(name || "file").replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_");
  return cleaned || "file";
}

async function saveUploadedFiles(files, fieldName = "attachments") {
  const saved = [];
  for (const file of files.filter((item) => item.field === fieldName && item.name)) {
    const originalName = safeFileName(file.name);
    const storedName = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}-${originalName}`;
    const diskPath = path.join(uploadDir, storedName);
    await fsp.writeFile(diskPath, file.content);
    saved.push({
      name: originalName,
      storedName,
      size: file.content.length,
      type: file.type,
      url: `/uploads/${encodeURIComponent(storedName)}`,
    });
  }
  return saved;
}

function nextDoc(state, prefix) {
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const key = `${prefix}${yyyy}${mm}${dd}`;
  state.counters[key] = (state.counters[key] || existingCount(state, key)) + 1;
  return `${key}${String(state.counters[key]).padStart(3, "0")}`;
}

function existingCount(state, key) {
  const values = state.jobs.flatMap((job) => [job.id, job.quoteNo, job.soNo, job.woNo]);
  return values.filter((value) => value && value.startsWith(key)).length;
}

function responsibilityLabel(job) {
  const department = departmentByStatus[job.status] || "-";
  if (department === "ฝ่ายขาย") return `${department} - ${job.salesOwner}`;
  const owners = ownersByDepartment[department] || [];
  return owners.length ? `${department} - ${owners.join(", ")}` : department;
}

function pushLine(state, message) {
  state.notifications.push(`LINE -> ${message}`);
}

async function createJob(req, res) {
  const body = await collectBody(req);
  const { fields, files } = parseMultipart(body, req.headers["content-type"] || "");
  const state = await readState();
  const user = requireSales(req, res, state);
  if (!user) return;
  const jobType = fields.jobType;
  const status = jobType === "design" ? "WAITING_DESIGN" : jobType === "stock" ? "WAITING_STOCK" : "QUOTING";
  const attachments = await saveUploadedFiles(files);
  let lineItems = [];
  try {
    lineItems = JSON.parse(fields.lineItems || "[]")
      .map((item) => ({ name: String(item.name || "").trim(), quantity: Number(item.quantity || 0) }))
      .filter((item) => item.name && item.quantity > 0);
  } catch {
    lineItems = [];
  }
  if (!lineItems.length && fields.item) {
    lineItems = [{ name: fields.item, quantity: Number(fields.quantity || 1) }];
  }
  const itemSummary = lineItems.map((item) => item.name).join(", ");
  const quantityTotal = lineItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0) || Number(fields.quantity || 1);
  const job = {
    id: nextDoc(state, "INQ"),
    createdAt: new Date().toISOString(),
    customer: fields.customer || "",
    item: itemSummary,
    quantity: quantityTotal,
    lineItems,
    customerRef: fields.customerRef || "",
    salesOwner: fields.salesOwner || "",
    files: attachments,
    status,
    dueDate: fields.dueDate || "",
    deliveryMode: fields.deliveryMode || "",
    quoteNo: "",
    soNo: "",
    woNo: "",
    note: fields.note || "",
  };
  state.jobs.unshift(job);
  recordActivity(state, user, "create_job", job, `สร้างงานใหม่ สถานะ ${statusLabels[status] || status}`);
  pushLine(state, `${responsibilityLabel(job)}: มีงานใหม่ ${job.id} จาก ${job.customer}`);
  await writeState(state);
  json(res, 201, state);
}

async function updateStatus(req, res, id) {
  const { status } = await readJson(req);
  const state = await readState();
  const user = requireCurrentUser(req, res, state);
  if (!user) return;
  const job = state.jobs.find((item) => item.id === id);
  if (!job) return error(res, 404, "Job not found");
  const oldStatus = job.status;
  job.status = status;
  if (status === "WAITING_CUSTOMER_CONFIRM" && !job.quoteNo) job.quoteNo = nextDoc(state, "QT");
  if (status === "WAITING_PRODUCTION_PLAN" && !job.soNo) job.soNo = nextDoc(state, "SO");
  if (status === "IN_PRODUCTION" && !job.woNo) job.woNo = nextDoc(state, "WO");
  if (status === "WAITING_SO") {
    pushLine(state, `ฝ่ายขาย - ${job.salesOwner}: ${job.id} ถอดแบบ/เช็คสต็อกเสร็จแล้ว กรุณาออก SO / Sales Order`);
  } else {
    pushLine(state, `${responsibilityLabel(job)}: ${job.id} เปลี่ยนสถานะเป็น ${statusLabels[status] || status}`);
  }
  recordActivity(state, user, "change_status", job, `${statusLabels[oldStatus] || oldStatus} -> ${statusLabels[status] || status}`);
  await writeState(state);
  json(res, 200, state);
}

async function completeDesign(req, res, id) {
  const body = await collectBody(req);
  const { fields, files } = parseMultipart(body, req.headers["content-type"] || "");
  const state = await readState();
  const user = requireCurrentUser(req, res, state);
  if (!user) return;
  if (!["production", "admin"].includes(user.role)) return error(res, 403, "ส่งผลถอดแบบได้เฉพาะฝ่ายผลิตหรือ Admin");
  const job = state.jobs.find((item) => item.id === id);
  if (!job) return error(res, 404, "Job not found");

  const designFiles = await saveUploadedFiles(files, "designFiles");
  const message = fields.designMessage || "";
  job.status = "WAITING_SO";
  job.designReply = {
    message,
    files: designFiles,
    repliedAt: new Date().toISOString(),
  };
  const fileText = designFiles.length ? ` แนบไฟล์ ${designFiles.map((file) => file.name).join(", ")}` : "";
  const messageText = message ? ` ข้อความ: ${message}` : "";
  recordActivity(state, user, "design_reply", job, message || "ฝ่ายผลิตส่งผลถอดแบบกลับฝ่ายขาย");
  pushLine(state, `ฝ่ายขาย - ${job.salesOwner}: ${job.id} ฝ่ายผลิตถอดแบบเสร็จแล้ว กรุณาออก SO / Sales Order.${messageText}${fileText}`);
  await writeState(state);
  json(res, 200, state);
}

async function deleteJob(req, res, id) {
  const state = await readState();
  const user = requireCurrentUser(req, res, state);
  if (!user) return;
  const job = state.jobs.find((item) => item.id === id);
  if (!job) return error(res, 404, "Job not found");
  if (!["sales", "admin"].includes(user.role)) return error(res, 403, "ลบงานได้เฉพาะฝ่ายขายหรือ Admin");
  state.jobs = state.jobs.filter((item) => item.id !== id);
  recordActivity(state, user, "delete_job", job, "ลบงานออกจากระบบ");
  pushLine(state, `Admin: ลบงาน ${id} ออกจากระบบ`);
  await writeState(state);
  json(res, 200, state);
}

async function bulkDelete(req, res) {
  const { ids = [] } = await readJson(req);
  const state = await readState();
  const user = requireCurrentUser(req, res, state);
  if (!user) return;
  if (!["sales", "admin"].includes(user.role)) return error(res, 403, "ลบงานได้เฉพาะฝ่ายขายหรือ Admin");
  const deletedJobs = state.jobs.filter((job) => ids.includes(job.id));
  state.jobs = state.jobs.filter((job) => !ids.includes(job.id));
  deletedJobs.forEach((job) => recordActivity(state, user, "delete_job", job, "ลบจากรายการที่เลือก"));
  pushLine(state, `Admin: ลบงานที่เลือก ${ids.length} รายการ`);
  await writeState(state);
  json(res, 200, state);
}

async function seedJob(req, res) {
  const state = await readState();
  const user = requireCurrentUser(req, res, state);
  if (!user) return;
  const id = nextDoc(state, "INQ");
  const job = {
    id,
    customer: "ลูกค้าทดลอง",
    item: "งานตัวอย่างสำหรับทดลอง workflow",
    quantity: 25,
    customerRef: "demo",
    salesOwner: "คุณ ภมร",
    files: [{ name: "demo.pdf", size: 0, type: "application/pdf", url: "" }],
    status: "NEW_INQUIRY",
    dueDate: "2026-06-05",
    deliveryMode: "บริษัทจัดส่ง",
    quoteNo: "",
    soNo: "",
    woNo: "",
    note: "สร้างจากปุ่มทดลอง",
    reads: [],
  };
  state.jobs.unshift(job);
  recordActivity(state, user, "create_job", job, "สร้างงานทดลอง");
  pushLine(state, `ฝ่ายขาย - คุณ ภมร: สร้างงานทดลอง ${id}`);
  await writeState(state);
  json(res, 201, state);
}

async function closeProduction(req, res) {
  const { jobId, goodQty, defectQty } = await readJson(req);
  const state = await readState();
  const user = requireCurrentUser(req, res, state);
  if (!user) return;
  if (!["production", "admin"].includes(user.role)) return error(res, 403, "ปิดงานผลิตได้เฉพาะฝ่ายผลิตหรือ Admin");
  const job = state.jobs.find((item) => item.id === jobId);
  if (!job) return error(res, 404, "Job not found");
  job.status = "PRODUCTION_DONE";
  recordActivity(state, user, "close_production", job, `ดี ${goodQty || 0} เสีย ${defectQty || 0}`);
  pushLine(state, `${job.salesOwner}/Admin: ${job.woNo || job.id} ผลิตเสร็จ ดี ${goodQty || 0} เสีย ${defectQty || 0}`);
  await writeState(state);
  json(res, 200, state);
}

async function readJob(req, res, id) {
  const { entryStatus } = await readJson(req);
  const state = await readState();
  const user = requireCurrentUser(req, res, state);
  if (!user) return;
  const job = state.jobs.find((item) => item.id === id);
  if (!job) return error(res, 404, "Job not found");
  const status = entryStatus || job.status;
  const target = readTarget(job, status);
  if (!canReadJob(user, job, status)) {
    recordActivity(state, user, "read_denied", job, `พยายามเปิดอ่าน ${statusLabels[status] || status}; ผู้ต้องอ่านคือ ${target.name || target.role}`);
    await writeState(state);
    return error(res, 403, `เอกสารนี้เปิดอ่านได้เฉพาะ ${target.name || target.role}`);
  }
  const readItem = {
    at: new Date().toISOString(),
    userId: user.id,
    userName: user.name,
    role: user.role,
    status,
  };
  job.reads.unshift(readItem);
  job.reads = job.reads.slice(0, 50);
  recordActivity(state, user, "read_job", job, `เปิดอ่าน ${statusLabels[status] || status}`);
  await writeState(state);
  json(res, 200, {
    job,
    user,
    target,
    activityLog: state.activityLog.filter((item) => item.jobId === job.id).slice(0, 12),
  });
}

async function handleApi(req, res, pathname) {
  if (req.method === "GET" && pathname === "/api/health") {
    return json(res, 200, {
      ok: true,
      app: "office-mes",
      storage: {
        dataFile: path.relative(root, dbFile),
        uploads: path.relative(root, uploadDir),
      },
      time: new Date().toISOString(),
    });
  }
  if (req.method === "GET" && pathname === "/api/state") return json(res, 200, await readState());
  if (req.method === "GET" && pathname === "/api/users") {
    const state = await readState();
    return json(res, 200, { users: state.users });
  }
  if (req.method === "POST" && pathname === "/api/jobs") return createJob(req, res);
  if (req.method === "POST" && pathname === "/api/jobs/bulk-delete") return bulkDelete(req, res);
  if (req.method === "POST" && pathname === "/api/jobs/seed") return seedJob(req, res);
  if (req.method === "POST" && pathname === "/api/production/close") return closeProduction(req, res);

  const statusMatch = pathname.match(/^\/api\/jobs\/([^/]+)\/status$/);
  if (req.method === "PATCH" && statusMatch) return updateStatus(req, res, decodeURIComponent(statusMatch[1]));

  const designMatch = pathname.match(/^\/api\/jobs\/([^/]+)\/design-complete$/);
  if (req.method === "POST" && designMatch) return completeDesign(req, res, decodeURIComponent(designMatch[1]));

  const readMatch = pathname.match(/^\/api\/jobs\/([^/]+)\/read$/);
  if (req.method === "POST" && readMatch) return readJob(req, res, decodeURIComponent(readMatch[1]));

  const deleteMatch = pathname.match(/^\/api\/jobs\/([^/]+)$/);
  if (req.method === "DELETE" && deleteMatch) return deleteJob(req, res, decodeURIComponent(deleteMatch[1]));

  return error(res, 404, "API route not found");
}

function serveStatic(req, res, pathname) {
  const cleanPath = decodeURIComponent(pathname);
  const filePath = path.join(root, cleanPath === "/" ? "index.html" : cleanPath);

  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.writeHead(200, {
      "Content-Type": types[path.extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url.pathname);
      return;
    }
    serveStatic(req, res, url.pathname);
  } catch (err) {
    console.error(err);
    error(res, 500, err.message || "Server error");
  }
});

ensureStorage().then(() => {
  server.listen(port, host, () => {
    const localUrl = `http://localhost:${port}`;
    const bindText = host === "0.0.0.0" ? "all network interfaces" : host;
    console.log(`Office MES backend running at ${localUrl}`);
    console.log(`Listening on ${bindText}:${port}`);
  });
});
