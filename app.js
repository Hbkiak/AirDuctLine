const today = new Date("2026-06-02T09:00:00+07:00");
const backendOrigin = "http://xnb-127:8765";

if (window.location.protocol === "file:") {
  window.location.replace(backendOrigin);
  throw new Error("Office MES requires the backend URL. Redirecting to backend.");
}

const statusLabels = {
  NEW_INQUIRY: "รับเรื่องใหม่",
  WAITING_DESIGN: "รอถอดแบบ",
  WAITING_STOCK: "รอเช็คสต็อก",
  QUOTING: "รอเสนอราคา",
  WAITING_CUSTOMER_CONFIRM: "รอลูกค้ายืนยัน",
  CONFIRMED: "ยืนยันแล้ว",
  DESIGN_REPLY: "ผลถอดแบบจากฝ่ายผลิต",
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

const salesOwners = [
  "คุณ ภมร",
  "คุณ มณเทียร",
  "คุณ ศักดิ์ณรงค์",
  "คุณ ภาคิน",
  "คุณ ลัคนา",
  "คุณ วนิดา",
  "คุณ สาธินี",
  "คุณ วชิราวรรณ",
  "คุณ สุพรรษา",
  "คุณ โชคพิสิฐ",
  "คุณ ธนา",
];

const departmentByStatus = {
  NEW_INQUIRY: "ฝ่ายขาย",
  WAITING_DESIGN: "ถอดแบบ/ผลิต",
  WAITING_STOCK: "คลัง",
  QUOTING: "ฝ่ายขาย",
  WAITING_CUSTOMER_CONFIRM: "ฝ่ายขาย",
  CONFIRMED: "Admin",
  DESIGN_REPLY: "ฝ่ายขาย",
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
  ฝ่ายขาย: salesOwners,
  "ถอดแบบ/ผลิต": ["คุณ แป๊ะ", "คุณ โรง", "คุณ เปรมสุข"],
  ผลิต: ["คุณ แป๊ะ", "คุณ โรง", "คุณ เปรมสุข"],
  วางแผน: ["คุณ แพ็ด"],
  คลัง: ["คุณ พล"],
  ขนส่ง: ["คุณ เรณู"],
  Admin: ["Admin", "คุณ ธนา"],
};

const documentRouteByStatus = {
  NEW_INQUIRY: ["ลูกค้า/ฝ่ายขาย", "ฝ่ายขาย"],
  WAITING_DESIGN: ["ฝ่ายขาย", "ถอดแบบ/ผลิต"],
  WAITING_STOCK: ["ฝ่ายขาย", "คลัง"],
  QUOTING: ["ฝ่ายขาย", "ฝ่ายขาย"],
  WAITING_CUSTOMER_CONFIRM: ["ฝ่ายขาย", "ลูกค้า"],
  CONFIRMED: ["ลูกค้า/ฝ่ายขาย", "Admin"],
  DESIGN_REPLY: ["ถอดแบบ/ผลิต", "ฝ่ายขาย"],
  WAITING_SO: ["ถอดแบบ/ผลิต หรือ คลัง", "ฝ่ายขาย"],
  WAITING_PRODUCTION_PLAN: ["ฝ่ายขาย", "วางแผน"],
  IN_PRODUCTION: ["วางแผน", "ผลิต"],
  PRODUCTION_DONE: ["ผลิต", "ฝ่ายขาย"],
  WAITING_DELIVERY_CONFIRM: ["ผลิต/ฝ่ายขาย", "ฝ่ายขาย"],
  WAIT_BOOKING_TRUCK: ["ฝ่ายขาย", "ขนส่ง"],
  READY_TO_DELIVER: ["ขนส่ง", "ลูกค้า/รับสินค้า"],
  DELIVERED: ["ขนส่ง", "Admin"],
  CLOSED: ["Admin", "จัดเก็บเอกสาร"],
};

const workflowGroups = [
  {
    title: "ขายและเสนอราคา",
    statuses: ["NEW_INQUIRY", "QUOTING", "WAITING_CUSTOMER_CONFIRM", "WAITING_DELIVERY_CONFIRM"],
  },
  {
    title: "ถอดแบบ / เช็คสต็อก",
    statuses: ["WAITING_DESIGN", "WAITING_STOCK"],
  },
  {
    title: "ฝ่ายขาย / Admin / วางแผน",
    statuses: ["CONFIRMED", "WAITING_SO", "WAITING_PRODUCTION_PLAN"],
  },
  {
    title: "ผลิต / ส่งมอบ",
    statuses: ["IN_PRODUCTION", "PRODUCTION_DONE", "WAIT_BOOKING_TRUCK", "READY_TO_DELIVER", "DELIVERED", "CLOSED"],
  },
];

let state = { counters: {}, jobs: [], notifications: [], users: [], activityLog: [] };
const dashboardSelectedIds = new Set();
const userStorageKey = "officeMesUser.v1";
const sessionStorageKey = "officeMesSession.v1";
let session = { token: window.localStorage.getItem(sessionStorageKey) || "", user: null, source: "" };

function currentRole() {
  return document.getElementById("roleSelect")?.value || "sales";
}

function currentUserId() {
  return session.user?.id || document.getElementById("userSelect")?.value || "";
}

function currentUser() {
  return session.user || state.users.find((user) => user.id === currentUserId()) || state.users[0] || null;
}

function canCreateJob() {
  return currentRole() === "sales";
}

function sourceJob(entry) {
  return entry.job || entry;
}

function effectiveStatus(entry) {
  return entry.entryStatus || entry.status;
}

function dashboardEntries() {
  return state.jobs.flatMap((job) => {
    const entries = [];
    if (job.designReply) {
      entries.push({
        id: `${job.id}::designReply`,
        displayId: `${job.id}-ตอบกลับ`,
        entryStatus: "DESIGN_REPLY",
        entryCreatedAt: job.designReply.repliedAt,
        job,
        selectable: false,
      });
    }
    entries.push({
      id: job.id,
      displayId: job.id,
      entryStatus: job.status,
      entryCreatedAt: job.createdAt,
      job,
      selectable: true,
    });
    return entries;
  });
}

function getLineItems(job) {
  if (Array.isArray(job.lineItems) && job.lineItems.length) return job.lineItems;
  if (job.item) return [{ name: job.item, quantity: job.quantity || 1 }];
  return [];
}

function lineItemsSummary(job) {
  const items = getLineItems(job);
  if (!items.length) return "-";
  return items.map((item) => `${escapeHtml(item.name)} <span class="muted">x ${escapeHtml(item.quantity || 1)}</span>`).join("<br>");
}

function lineItemsPlain(job) {
  const items = getLineItems(job);
  if (!items.length) return "-";
  return items.map((item) => `${item.name} x ${item.quantity || 1}`).join(", ");
}

function totalQuantity(job) {
  return getLineItems(job).reduce((sum, item) => sum + Number(item.quantity || 0), 0) || job.quantity || "-";
}

function isComplete(entry) {
  return effectiveStatus(entry) === "CLOSED";
}

async function api(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (session.token) headers.set("X-Session-Token", session.token);
  headers.set("X-User-Role", currentRole());
  const response = await fetch(path, { ...options, headers });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `API error ${response.status}`);
  }
  return response.json();
}

function setState(nextState) {
  state = nextState;
  pruneDashboardSelection();
  renderAll();
}

function pruneDashboardSelection() {
  const liveIds = new Set(state.jobs.map((job) => job.id));
  [...dashboardSelectedIds].forEach((id) => {
    if (!liveIds.has(id)) dashboardSelectedIds.delete(id);
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function statusBadge(status) {
  const label = statusLabels[status] || status;
  let cls = "badge";
  if (["WAITING_DESIGN", "WAITING_STOCK", "WAIT_BOOKING_TRUCK"].includes(status)) cls += " warn";
  if (["DESIGN_REPLY", "PRODUCTION_DONE", "READY_TO_DELIVER", "DELIVERED", "CLOSED"].includes(status)) cls += " good";
  if (status === "CLOSED") cls += " complete";
  if (status === "WAIT_BOOKING_TRUCK") cls += " danger";
  return `<span class="${cls}">${escapeHtml(label)}</span>`;
}

function responsibilityLabel(entry) {
  const job = sourceJob(entry);
  const department = departmentByStatus[effectiveStatus(entry)] || "-";
  if (department === "ฝ่ายขาย") return `${department} - ${job.salesOwner}`;
  const owners = ownersByDepartment[department] || [];
  return owners.length ? `${department} - ${owners.join(", ")}` : department;
}

function documentRoute(entry) {
  const job = sourceJob(entry);
  const status = effectiveStatus(entry);
  if (status === "WAITING_SO" && job.designReply) {
    return ["ถอดแบบ/ผลิต", "ฝ่ายขาย"];
  }
  return documentRouteByStatus[status] || ["-", departmentByStatus[status] || "-"];
}

function documentRouteLabel(job) {
  const [from, to] = documentRoute(job);
  return `เอกสาร: ${from} → ${to}`;
}

function messageReader(entry) {
  const job = sourceJob(entry);
  const status = effectiveStatus(entry);
  const salesReader = `ฝ่ายขาย - ${job.salesOwner || "ไม่ระบุ"}`;
  const readers = {
    NEW_INQUIRY: salesReader,
    WAITING_DESIGN: "ถอดแบบ/ผลิต - คุณ แป๊ะ",
    WAITING_STOCK: "คลัง - คุณ พล",
    QUOTING: salesReader,
    WAITING_CUSTOMER_CONFIRM: salesReader,
    CONFIRMED: "Admin - Admin",
    DESIGN_REPLY: salesReader,
    WAITING_SO: salesReader,
    WAITING_PRODUCTION_PLAN: "วางแผน - คุณ แพ็ด",
    IN_PRODUCTION: "ผลิต - คุณ แป๊ะ",
    PRODUCTION_DONE: salesReader,
    WAITING_DELIVERY_CONFIRM: salesReader,
    WAIT_BOOKING_TRUCK: "ขนส่ง - คุณ เรณู",
    READY_TO_DELIVER: "ขนส่ง - คุณ เรณู",
    DELIVERED: "Admin - Admin",
    CLOSED: "Admin - Admin",
  };
  return readers[status] || responsibilityLabel(entry);
}

function messageReaderLabel(job) {
  return `ต้องเปิดอ่าน: ${messageReader(job)}`;
}

function hasUserRead(job, status) {
  const user = currentUser();
  if (!user || !Array.isArray(job.reads)) return false;
  return job.reads.some((read) => read.userId === user.id && read.status === status);
}

function readCount(job, status) {
  return Array.isArray(job.reads) ? job.reads.filter((read) => read.status === status).length : 0;
}

function dateFromDocumentId(id) {
  const match = /^INQ(\d{4})(\d{2})(\d{2})/.exec(id || "");
  if (!match) return null;
  return `${match[1]}-${match[2]}-${match[3]}`;
}

function formatCreatedDateTime(entry) {
  const job = sourceJob(entry);
  const createdAt = entry.entryCreatedAt || job.createdAt;
  if (createdAt) {
    return new Date(createdAt).toLocaleString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  const docDate = dateFromDocumentId(job.id);
  if (!docDate) return "วันที่/เวลาไม่ระบุ";
  return `${formatDate(docDate)} / เวลาไม่ระบุ`;
}

function renderSalesOwners() {
  const select = document.getElementById("salesOwnerSelect");
  const owners = state.users?.length
    ? state.users.filter((user) => user.role === "sales" && user.active !== false).map((user) => user.name)
    : salesOwners;
  select.innerHTML = owners.map((owner) => `<option>${escapeHtml(owner)}</option>`).join("");
}

function roleLabel(role) {
  return {
    sales: "ฝ่ายขาย",
    production: "ฝ่ายผลิต",
    planning: "วางแผน",
    warehouse: "คลัง",
    logistics: "ขนส่ง",
    admin: "Admin",
  }[role] || role;
}

function departmentForRole(role) {
  return {
    sales: "ฝ่ายขาย",
    production: "ถอดแบบ/ผลิต",
    planning: "วางแผน",
    warehouse: "คลัง",
    logistics: "ส่งของ",
    admin: "Admin",
  }[role] || "";
}

function renderLoginUsers() {
  const select = document.getElementById("loginUserSelect");
  if (!select || !state.users.length) return;
  const saved = session.user?.id || window.localStorage.getItem(userStorageKey) || state.users[0]?.id || "";
  select.innerHTML = state.users
    .filter((user) => user.active !== false)
    .map((user) => `<option value="${escapeHtml(user.id)}">${escapeHtml(user.name)} - ${escapeHtml(roleLabel(user.role))}</option>`)
    .join("");
  if (saved && state.users.some((user) => user.id === saved)) select.value = saved;
}

function showLoginModal() {
  document.body.classList.add("session-locked");
  const modal = document.getElementById("loginModal");
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  renderLoginUsers();
}

function hideLoginModal() {
  document.body.classList.remove("session-locked");
  const modal = document.getElementById("loginModal");
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
}

function applySession(nextSession) {
  session = { ...session, ...nextSession };
  if (session.token) {
    window.localStorage.setItem(sessionStorageKey, session.token);
  } else {
    window.localStorage.removeItem(sessionStorageKey);
  }
  if (session.user?.id) window.localStorage.setItem(userStorageKey, session.user.id);
  renderUsers();
  renderLoginUsers();
  if (session.user) {
    hideLoginModal();
  } else {
    showLoginModal();
  }
}

function renderUsers() {
  const select = document.getElementById("userSelect");
  if (!select || !state.users.length) return;
  const saved = session.user?.id || window.localStorage.getItem(userStorageKey);
  select.innerHTML = state.users
    .filter((user) => user.active !== false || user.id === session.user?.id)
    .map((user) => `<option value="${escapeHtml(user.id)}">${escapeHtml(user.name)} - ${escapeHtml(roleLabel(user.role))}</option>`)
    .join("");
  if (saved && state.users.some((user) => user.id === saved)) select.value = saved;
  const user = currentUser();
  if (user) document.getElementById("roleSelect").value = user.role;
  select.disabled = !!session.user;
}

function renderAdminUsers() {
  const table = document.getElementById("adminUsersTable");
  if (!table) return;
  if (currentUser()?.role !== "admin") {
    table.innerHTML = `<tr><td colspan="6" class="muted">หน้านี้ใช้งานได้เฉพาะ Admin</td></tr>`;
    return;
  }
  table.innerHTML = state.users
    .map(
      (user) => `
        <tr class="${user.active === false ? "inactive-row" : ""}">
          <td><strong>${escapeHtml(user.name)}</strong><br><span class="muted">${escapeHtml(user.id)}</span></td>
          <td>${escapeHtml(roleLabel(user.role))}</td>
          <td>${escapeHtml(user.department || "-")}</td>
          <td><span class="line-id">${escapeHtml(user.lineUserId || "ยังไม่ผูก LINE")}</span></td>
          <td><span class="badge ${user.active === false ? "danger" : "good"}">${user.active === false ? "ปิดใช้งาน" : "เปิดใช้งาน"}</span></td>
          <td><button class="action-button" data-edit-user="${escapeHtml(user.id)}">แก้ไข</button></td>
        </tr>`
    )
    .join("");
}

function resetAdminUserForm() {
  const form = document.getElementById("adminUserForm");
  if (!form) return;
  form.reset();
  document.getElementById("adminUserId").value = "";
  document.getElementById("adminUserDepartment").value = departmentForRole(document.getElementById("adminUserRole").value);
  document.getElementById("adminUserActive").checked = true;
  document.getElementById("adminUserFormTitle").textContent = "เพิ่มผู้ใช้";
}

function editAdminUser(userId) {
  const user = state.users.find((item) => item.id === userId);
  if (!user) return;
  document.getElementById("adminUserId").value = user.id;
  document.getElementById("adminUserName").value = user.name || "";
  document.getElementById("adminUserRole").value = user.role || "sales";
  document.getElementById("adminUserDepartment").value = user.department || departmentForRole(user.role);
  document.getElementById("adminLineUserId").value = user.lineUserId || "";
  document.getElementById("adminUserActive").checked = user.active !== false;
  document.getElementById("adminUserFormTitle").textContent = `แก้ไข ${user.name}`;
}

async function submitAdminUser(event) {
  event.preventDefault();
  if (currentUser()?.role !== "admin") {
    showToast("จัดการผู้ใช้ได้เฉพาะ Admin");
    return;
  }
  const form = new FormData(event.currentTarget);
  const id = String(form.get("id") || "");
  const payload = {
    name: String(form.get("name") || "").trim(),
    role: String(form.get("role") || "sales"),
    department: String(form.get("department") || "").trim(),
    lineUserId: String(form.get("lineUserId") || "").trim(),
    active: form.get("active") === "on",
  };
  const result = await api(id ? `/api/users/${encodeURIComponent(id)}` : "/api/users", {
    method: id ? "PATCH" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  state.users = result.users;
  resetAdminUserForm();
  renderAll();
  showToast(id ? "บันทึกผู้ใช้แล้ว" : "เพิ่มผู้ใช้แล้ว");
}

function applyRolePermissions() {
  const allowed = canCreateJob();
  const createButton = document.querySelector("[data-open-create]");
  const submitButton = document.getElementById("createSubmitBtn");
  const permissionText = document.getElementById("createPermissionText");
  const logoutButton = document.getElementById("logoutBtn");
  const adminNav = document.querySelector('[data-view="admin"]');
  const sessionSourceText = document.getElementById("sessionSourceText");

  if (createButton) {
    createButton.disabled = !allowed;
    createButton.title = allowed ? "สร้างงานใหม่" : "สร้างงานใหม่ได้เฉพาะฝ่ายขาย";
  }
  if (submitButton) {
    submitButton.disabled = !allowed;
    submitButton.title = allowed ? "บันทึกงาน" : "บันทึกงานได้เฉพาะฝ่ายขาย";
  }
  if (permissionText) {
    permissionText.textContent = allowed
      ? `เข้าสู่ระบบเป็น ${currentUser()?.name || "ฝ่ายขาย"} สามารถสร้างงานใหม่ได้`
      : `เข้าสู่ระบบเป็น ${currentUser()?.name || "-"} สร้างงานใหม่ได้เฉพาะฝ่ายขาย`;
    permissionText.classList.toggle("permission-denied", !allowed);
  }
  if (logoutButton) {
    logoutButton.disabled = !session.user;
    logoutButton.textContent = session.user
      ? session.source === "line"
        ? `LINE: ${session.user.name}`
        : `ออกจากระบบ (${session.user.name})`
      : "ออกจากระบบ";
  }
  if (sessionSourceText) {
    sessionSourceText.textContent = session.source === "line" ? "LINE Auto" : "Browser";
    sessionSourceText.classList.toggle("line", session.source === "line");
  }
  if (adminNav) {
    adminNav.disabled = currentUser()?.role !== "admin";
    adminNav.title = currentUser()?.role === "admin" ? "Admin" : "ใช้งานได้เฉพาะ Admin";
  }
}

function renderStats() {
  const stats = [
    ["งานทั้งหมด", state.jobs.length],
    ["รอถอดแบบ/สต็อก", state.jobs.filter((j) => ["WAITING_DESIGN", "WAITING_STOCK"].includes(j.status)).length],
    ["กำลังผลิต", state.jobs.filter((j) => j.status === "IN_PRODUCTION").length],
    ["ส่งใกล้ถึง", state.jobs.filter((j) => daysUntil(j.dueDate) <= 1).length],
  ];
  document.getElementById("statsGrid").innerHTML = stats
    .map(([label, value]) => `<div class="stat"><span class="muted">${label}</span><strong>${value}</strong></div>`)
    .join("");
}

function renderStatusFilter() {
  const select = document.getElementById("statusFilter");
  const current = select.value;
  select.innerHTML = `<option value="all">ทุกสถานะ</option>${Object.entries(statusLabels)
    .map(([value, label]) => `<option value="${value}">${label}</option>`)
    .join("")}`;
  select.value = current || "all";
}

function renderJobsTable() {
  const filter = document.getElementById("statusFilter").value;
  const rows = dashboardEntries().filter((entry) => filter === "all" || effectiveStatus(entry) === filter);
  const selectableRows = rows.filter((entry) => entry.selectable !== false);
  const visibleIds = selectableRows.map((entry) => entry.id);
  const selectedVisibleCount = visibleIds.filter((id) => dashboardSelectedIds.has(id)).length;
  const selectAll = document.getElementById("dashboardSelectAll");
  selectAll.checked = visibleIds.length > 0 && selectedVisibleCount === visibleIds.length;
  selectAll.indeterminate = selectedVisibleCount > 0 && selectedVisibleCount < visibleIds.length;
  updateDashboardDeleteButton();
  document.getElementById("jobsTable").innerHTML = rows
    .map(
      (entry) => {
        const job = sourceJob(entry);
        const rowStatus = effectiveStatus(entry);
        const displayId = entry.displayId || job.id;
        const selectable = entry.selectable !== false;
        const readDone = hasUserRead(job, rowStatus);
        const readTotal = readCount(job, rowStatus);
        return `
        <tr class="${isComplete(entry) ? "complete-row" : ""} ${rowStatus === "DESIGN_REPLY" ? "entry-reply-row" : ""}">
          <td class="select-col">${
            selectable
              ? `<input type="checkbox" class="dashboard-job-check" value="${escapeHtml(job.id)}" aria-label="เลือก ${escapeHtml(job.id)}" ${dashboardSelectedIds.has(job.id) ? "checked" : ""} />`
              : `<span class="muted">-</span>`
          }</td>
          <td><strong>${escapeHtml(displayId)}</strong><br><span class="doc-time">${escapeHtml(formatCreatedDateTime(entry))}</span><span class="reader-text">${escapeHtml(messageReaderLabel(entry))}</span><span class="muted">${escapeHtml([job.quoteNo, job.soNo, job.woNo].filter(Boolean).join(" / "))}</span><span class="read-state ${readDone ? "done" : ""}">${readDone ? "คุณเปิดอ่านแล้ว" : "ยังไม่ได้เปิดอ่าน"} · อ่านแล้ว ${readTotal} ครั้ง</span></td>
          <td>${escapeHtml(job.customer)}<br><span class="muted">${escapeHtml(job.salesOwner)}</span></td>
          <td>${lineItemsSummary(job)}<br><span class="muted">รวม ${escapeHtml(totalQuantity(job))} / ${formatFiles(job.files)}</span></td>
          <td>${escapeHtml(responsibilityLabel(entry))}</td>
          <td>${statusBadge(rowStatus)}<br><span class="route-text">${escapeHtml(documentRouteLabel(entry))}</span></td>
          <td>${formatDate(job.dueDate)}<br><span class="muted">${escapeHtml(job.deliveryMode)}</span></td>
          <td>
            <div class="row-actions">
              <button class="action-button" data-read="${escapeHtml(job.id)}" data-entry-status="${escapeHtml(rowStatus)}">เปิดอ่าน</button>
              ${selectable ? `<button class="action-button delete-button" data-delete="${escapeHtml(job.id)}">ลบ</button>` : `<span class="muted">รายการแจ้งกลับ</span>`}
            </div>
          </td>
        </tr>`
      }
    )
    .join("");
}

function updateDashboardDeleteButton() {
  const button = document.getElementById("salesDeleteSelectedBtn");
  if (!button) return;
  const count = dashboardSelectedIds.size;
  button.disabled = count === 0;
  button.textContent = count ? `ฝ่ายขายลบรายการที่เลือก (${count})` : "ฝ่ายขายลบรายการที่เลือก";
}

function formatFiles(files) {
  if (!files || !files.length) return "ไม่มีไฟล์แนบ";
  return files
    .map((file) => {
      const name = typeof file === "string" ? file : file.name;
      const url = typeof file === "object" ? file.url : "";
      return url ? `<a href="${escapeHtml(url)}" target="_blank" rel="noreferrer">${escapeHtml(name)}</a>` : escapeHtml(name);
    })
    .join(", ");
}

function renderAlerts() {
  const alerts = [];
  state.jobs.forEach((job) => {
    if (job.status === "WAITING_DESIGN") alerts.push([job.id, "คุณ แป๊ะต้องประเมินวัสดุ เวลา และต้นทุน"]);
    if (job.status === "WAITING_STOCK") alerts.push([job.id, "คุณ พลต้องยืนยันจำนวนสต็อก"]);
    if (daysUntil(job.dueDate) <= 1) alerts.push([job.id, `${job.salesOwner} ต้องยืนยันกำหนดส่งกับลูกค้า`]);
    if (job.deliveryMode === "บริษัทจัดส่ง" && daysUntil(job.dueDate) <= 1) alerts.push([job.id, "คุณ เรณูต้องจองรถหรือยืนยันรอบจัดส่ง"]);
  });
  document.getElementById("todayAlerts").innerHTML =
    alerts.map(([id, text]) => `<div class="alert"><strong>${escapeHtml(id)}</strong><span>${escapeHtml(text)}</span></div>`).join("") ||
    `<div class="alert"><strong>ไม่มีแจ้งเตือน</strong><span>งานวันนี้เรียบร้อยดี</span></div>`;
}

function renderKanban() {
  document.getElementById("kanban").innerHTML = workflowGroups
    .map((group) => {
      const cards = state.jobs
        .filter((job) => group.statuses.includes(job.status))
        .map(
          (job) => `
            <div class="kanban-card">
              <strong>${escapeHtml(job.id)}</strong>
              <span>${escapeHtml(job.customer)}</span>
              <span class="muted">${escapeHtml(lineItemsPlain(job))} / รวม ${escapeHtml(totalQuantity(job))}</span>
              ${statusBadge(job.status)}
              <div class="card-actions">
                ${nextActionButtons(job)}
                <button class="action-button delete-button" data-delete="${escapeHtml(job.id)}">ลบ</button>
              </div>
            </div>`
        )
        .join("");
      return `<section class="kanban-column"><h2>${escapeHtml(group.title)}</h2>${cards || `<p class="muted">ไม่มีงาน</p>`}</section>`;
    })
    .join("");
}

function nextActionButtons(job) {
  const actions = {
    NEW_INQUIRY: [["WAITING_DESIGN", "ส่งถอดแบบ"], ["WAITING_STOCK", "เช็คสต็อก"]],
    WAITING_DESIGN: [["WAITING_SO", "ถอดแบบเสร็จ แจ้งฝ่ายขายออก SO"]],
    WAITING_STOCK: [["WAITING_SO", "สต็อกพร้อม แจ้งฝ่ายขายออก SO"]],
    QUOTING: [["WAITING_CUSTOMER_CONFIRM", "ส่งใบเสนอราคา"]],
    WAITING_CUSTOMER_CONFIRM: [["CONFIRMED", "ลูกค้ายืนยัน"]],
    CONFIRMED: [["WAITING_SO", "ส่ง Admin"]],
    WAITING_SO: [["WAITING_PRODUCTION_PLAN", "สร้าง SO"]],
    WAITING_PRODUCTION_PLAN: [["IN_PRODUCTION", "สร้าง WO"]],
    PRODUCTION_DONE: [["WAITING_DELIVERY_CONFIRM", "รอยืนยันส่ง"]],
    WAITING_DELIVERY_CONFIRM: [["WAIT_BOOKING_TRUCK", "ต้องจองรถ"], ["READY_TO_DELIVER", "ลูกค้ารับเอง"]],
    WAIT_BOOKING_TRUCK: [["READY_TO_DELIVER", "จองรถแล้ว"]],
    READY_TO_DELIVER: [["DELIVERED", "จัดส่งแล้ว"]],
    DELIVERED: [["CLOSED", "ทำให้สมบูรณ์"]],
  };
  return (actions[job.status] || [])
    .map(([status, label]) => {
      if (job.status === "WAITING_DESIGN" && status === "WAITING_SO") {
        return `<button class="action-button" data-design-complete="${escapeHtml(job.id)}">${label}</button>`;
      }
      return `<button class="action-button" data-move="${escapeHtml(job.id)}" data-status="${status}">${label}</button>`;
    })
    .join("");
}

async function moveJob(id, status) {
  const nextState = await api(`/api/jobs/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  setState(nextState);
  showToast(`${id} -> ${statusLabels[status]}`);
}

function renderWorkOrders() {
  const jobs = state.jobs.filter((job) => job.soNo || job.woNo || ["WAITING_PRODUCTION_PLAN", "IN_PRODUCTION", "PRODUCTION_DONE"].includes(job.status));
  document.getElementById("workOrders").innerHTML =
    jobs
      .map(
        (job) => `
          <div class="work-order">
            <strong>${escapeHtml(job.soNo || "รอ SO")} / ${escapeHtml(job.woNo || "รอ WO")}</strong>
            <span>${escapeHtml(job.customer)} - ${escapeHtml(lineItemsPlain(job))}</span>
            <span class="muted">รวม ${escapeHtml(totalQuantity(job))} / กำหนดส่ง ${formatDate(job.dueDate)}</span>
            ${statusBadge(job.status)}
          </div>`
      )
      .join("") || `<div class="work-order"><strong>ยังไม่มี SO/WO</strong><span>เมื่องานยืนยันแล้วจะแสดงที่นี่</span></div>`;

  const select = document.getElementById("productionJob");
  select.innerHTML = state.jobs
    .filter((job) => job.status === "IN_PRODUCTION")
    .map((job) => `<option value="${escapeHtml(job.id)}">${escapeHtml(job.woNo || job.id)} - ${escapeHtml(job.customer)}</option>`)
    .join("");
}

function renderDelivery() {
  const jobs = state.jobs.filter((job) => ["PRODUCTION_DONE", "WAITING_DELIVERY_CONFIRM", "WAIT_BOOKING_TRUCK", "READY_TO_DELIVER", "DELIVERED"].includes(job.status) || daysUntil(job.dueDate) <= 1);
  document.getElementById("deliveryList").innerHTML =
    jobs
      .map((job) => {
        const needTruck = job.deliveryMode === "บริษัทจัดส่ง";
        const lead = daysUntil(job.dueDate) <= 1 ? "ต้องติดตามวันนี้" : "ยังไม่ถึงรอบติดตาม";
        return `
          <div class="delivery-item">
            <strong>${escapeHtml(job.soNo || job.id)} - ${escapeHtml(job.customer)}</strong>
            <span>${escapeHtml(lineItemsPlain(job))} / รวม ${escapeHtml(totalQuantity(job))}</span>
            <span class="muted">ส่ง ${formatDate(job.dueDate)} / ${escapeHtml(job.deliveryMode)}</span>
            <div>${statusBadge(job.status)} <span class="badge ${needTruck ? "warn" : "good"}">${needTruck ? "ต้องจองรถ" : "ลูกค้ารับเอง"}</span> <span class="badge">${lead}</span></div>
          </div>`;
      })
      .join("") || `<div class="delivery-item"><strong>ยังไม่มีงานจัดส่ง</strong><span>งานผลิตเสร็จแล้วจะแสดงที่นี่</span></div>`;
}

function renderNotifications() {
  document.getElementById("notificationLog").innerHTML = state.notifications
    .slice()
    .reverse()
    .map((line) => `<div class="log-item">${escapeHtml(line)}</div>`)
    .join("");
}

function renderBulkDeleteList() {
  const list = document.getElementById("bulkDeleteList");
  if (!state.jobs.length) {
    list.innerHTML = `<div class="alert"><strong>ไม่มีงานให้ลบ</strong><span>สร้างงานใหม่หรือเพิ่มงานตัวอย่างก่อน</span></div>`;
    updateSelectedCount();
    return;
  }
  list.innerHTML = state.jobs
    .map(
      (job) => `
        <div class="bulk-row">
          <label><input type="checkbox" class="bulk-job-check" value="${escapeHtml(job.id)}" /> เลือก</label>
          <div>
            <strong>${escapeHtml(job.id)} - ${escapeHtml(job.customer)}</strong>
            <span class="muted">${escapeHtml(lineItemsPlain(job))}</span>
          </div>
          ${statusBadge(job.status)}
        </div>`
    )
    .join("");
  updateSelectedCount();
}

function updateSelectedCount() {
  const checks = [...document.querySelectorAll(".bulk-job-check")];
  const selected = checks.filter((check) => check.checked).length;
  document.getElementById("selectedCount").textContent = `เลือก ${selected} รายการ`;
  document.getElementById("selectAllJobs").checked = checks.length > 0 && selected === checks.length;
}

function openBulkDelete() {
  renderBulkDeleteList();
  document.getElementById("bulkDeleteModal").classList.add("open");
  document.getElementById("bulkDeleteModal").setAttribute("aria-hidden", "false");
}

function closeBulkDelete() {
  document.getElementById("bulkDeleteModal").classList.remove("open");
  document.getElementById("bulkDeleteModal").setAttribute("aria-hidden", "true");
  document.getElementById("selectAllJobs").checked = false;
}

async function deleteJob(id) {
  const job = state.jobs.find((item) => item.id === id);
  if (!job) return;
  const confirmed = window.confirm(`ต้องการลบงาน ${id} ของ ${job.customer} ใช่ไหม?`);
  if (!confirmed) return;
  setState(await api(`/api/jobs/${encodeURIComponent(id)}`, { method: "DELETE" }));
  showToast(`ลบ ${id} แล้ว`);
}

async function clearJobs() {
  const selectedIds = [...document.querySelectorAll(".bulk-job-check:checked")].map((check) => check.value);
  if (!selectedIds.length) {
    showToast("ยังไม่ได้เลือกรายการที่จะลบ");
    return;
  }
  const confirmed = window.confirm(`ต้องการลบงานที่เลือก ${selectedIds.length} รายการใช่ไหม?`);
  if (!confirmed) return;
  setState(
    await api("/api/jobs/bulk-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selectedIds }),
    })
  );
  closeBulkDelete();
  showToast(`ลบงานที่เลือก ${selectedIds.length} รายการแล้ว`);
}

async function deleteDashboardSelectedJobs() {
  const selectedIds = [...dashboardSelectedIds];
  if (!selectedIds.length) {
    showToast("ฝ่ายขายยังไม่ได้เลือกรายการที่จะลบ");
    return;
  }
  const confirmed = window.confirm(`ฝ่ายขายต้องการลบงานที่เลือก ${selectedIds.length} รายการใช่ไหม?`);
  if (!confirmed) return;
  setState(
    await api("/api/jobs/bulk-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selectedIds }),
    })
  );
  dashboardSelectedIds.clear();
  renderJobsTable();
  showToast(`ฝ่ายขายลบงานที่เลือก ${selectedIds.length} รายการแล้ว`);
}

function daysUntil(dateText) {
  const date = new Date(`${dateText}T00:00:00+07:00`);
  return Math.ceil((date - today) / 86400000);
}

function formatDate(dateText) {
  return new Date(`${dateText}T00:00:00+07:00`).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function renderAll() {
  renderUsers();
  renderLoginUsers();
  renderSalesOwners();
  applyRolePermissions();
  renderStats();
  renderStatusFilter();
  renderJobsTable();
  renderAlerts();
  renderKanban();
  renderWorkOrders();
  renderDelivery();
  renderNotifications();
  renderAdminUsers();
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2200);
}

function renderFilePreview() {
  const files = [...document.getElementById("attachmentsInput").files];
  document.getElementById("filePreview").innerHTML = files.length
    ? files.map((file) => `<span>${escapeHtml(file.name)} (${Math.ceil(file.size / 1024).toLocaleString("th-TH")} KB)</span>`).join("")
    : "ยังไม่ได้เลือกไฟล์";
}

function formatFilePreview(input, previewId) {
  const files = [...input.files];
  document.getElementById(previewId).innerHTML = files.length
    ? files.map((file) => `<span>${escapeHtml(file.name)} (${Math.ceil(file.size / 1024).toLocaleString("th-TH")} KB)</span>`).join("")
    : "ยังไม่ได้เลือกไฟล์";
}

function createLineItemRow(name = "", quantity = 1) {
  const row = document.createElement("div");
  row.className = "line-item-row";
  row.innerHTML = `
    <label>
      รายการ
      <input name="itemName" required placeholder="เช่น ชุดโครงเหล็กตามแบบ" value="${escapeHtml(name)}" />
    </label>
    <label>
      จำนวน
      <input name="itemQty" type="number" min="1" value="${escapeHtml(quantity)}" required />
    </label>
    <button type="button" class="icon-button line-remove" data-remove-line title="ลบรายการ">×</button>
  `;
  return row;
}

function collectLineItems() {
  return [...document.querySelectorAll("#lineItems .line-item-row")]
    .map((row) => ({
      name: row.querySelector('[name="itemName"]').value.trim(),
      quantity: Number(row.querySelector('[name="itemQty"]').value || 0),
    }))
    .filter((item) => item.name && item.quantity > 0);
}

function resetLineItems() {
  const list = document.getElementById("lineItems");
  list.innerHTML = "";
  list.appendChild(createLineItemRow());
}

function openDesignReply(jobId) {
  const job = state.jobs.find((item) => item.id === jobId);
  if (!job) return;
  document.getElementById("designReplyJobId").value = jobId;
  document.getElementById("designReplyJobLabel").textContent = `${job.id} - ${job.customer}`;
  document.getElementById("designReplyForm").reset();
  document.getElementById("designReplyPreview").textContent = "ยังไม่ได้เลือกไฟล์";
  document.getElementById("designReplyModal").classList.add("open");
  document.getElementById("designReplyModal").setAttribute("aria-hidden", "false");
}

function closeDesignReply() {
  document.getElementById("designReplyModal").classList.remove("open");
  document.getElementById("designReplyModal").setAttribute("aria-hidden", "true");
}

function closeDocumentRead() {
  document.getElementById("documentReadModal").classList.remove("open");
  document.getElementById("documentReadModal").setAttribute("aria-hidden", "true");
}

function readLogHtml(reads = []) {
  if (!reads.length) return `<div class="log-item">ยังไม่มีประวัติเปิดอ่าน</div>`;
  return reads
    .slice(0, 8)
    .map(
      (read) =>
        `<div class="log-item"><strong>${escapeHtml(read.userName)}</strong><span class="muted">${escapeHtml(roleLabel(read.role))} · ${escapeHtml(new Date(read.at).toLocaleString("th-TH"))} · ${escapeHtml(statusLabels[read.status] || read.status)}</span></div>`
    )
    .join("");
}

function activityLogHtml(items = []) {
  if (!items.length) return `<div class="log-item">ยังไม่มี activity log ของเอกสารนี้</div>`;
  return items
    .map(
      (item) =>
        `<div class="log-item"><strong>${escapeHtml(item.userName)}: ${escapeHtml(item.action)}</strong><span class="muted">${escapeHtml(new Date(item.at).toLocaleString("th-TH"))} · ${escapeHtml(item.detail || "")}</span></div>`
    )
    .join("");
}

async function openDocumentRead(jobId, entryStatus) {
  const detail = await api(`/api/jobs/${encodeURIComponent(jobId)}/read`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ entryStatus }),
  });
  const { job, target, activityLog } = detail;
  const relatedFiles = [...(job.files || []), ...(job.designReply?.files || [])];
  document.getElementById("documentReadTitle").textContent = `${job.id} - ${statusLabels[entryStatus] || entryStatus}`;
  document.getElementById("documentReadSubtitle").textContent = `เปิดอ่านโดย ${detail.user.name} / ผู้ที่ต้องอ่าน: ${target.name || roleLabel(target.role)}`;
  document.getElementById("documentReadBody").innerHTML = `
    <section class="detail-grid">
      <div><span class="muted">ลูกค้า</span><strong>${escapeHtml(job.customer)}</strong></div>
      <div><span class="muted">ฝ่ายขาย</span><strong>${escapeHtml(job.salesOwner)}</strong></div>
      <div><span class="muted">กำหนดส่ง</span><strong>${formatDate(job.dueDate)}</strong></div>
      <div><span class="muted">สถานะงานจริง</span><strong>${escapeHtml(statusLabels[job.status] || job.status)}</strong></div>
      <div class="full"><span class="muted">รายการ</span><strong>${escapeHtml(lineItemsPlain(job))}</strong></div>
      <div class="full"><span class="muted">หมายเหตุ</span><strong>${escapeHtml(job.note || "-")}</strong></div>
      ${
        job.designReply
          ? `<div class="full"><span class="muted">ข้อความตอบกลับจากฝ่ายผลิต</span><strong>${escapeHtml(job.designReply.message || "-")}</strong></div>`
          : ""
      }
    </section>
    <section class="detail-section">
      <h3>ไฟล์แนบ</h3>
      <div class="file-preview">${formatFiles(relatedFiles)}</div>
    </section>
    <section class="detail-section">
      <h3>ประวัติเปิดอ่าน</h3>
      <div class="notification-log">${readLogHtml(job.reads)}</div>
    </section>
    <section class="detail-section">
      <h3>Activity Log</h3>
      <div class="notification-log">${activityLogHtml(activityLog)}</div>
    </section>
  `;
  document.getElementById("documentReadModal").classList.add("open");
  document.getElementById("documentReadModal").setAttribute("aria-hidden", "false");
  setState(await api("/api/state"));
}

async function submitDesignReply(event) {
  event.preventDefault();
  const formElement = event.currentTarget;
  const jobId = document.getElementById("designReplyJobId").value;
  const form = new FormData(formElement);
  const message = String(form.get("designMessage") || "").trim();
  const hasFiles = [...document.getElementById("designReplyFiles").files].length > 0;
  if (!message && !hasFiles) {
    showToast("กรุณาใส่ข้อความหรือแนบไฟล์ถอดแบบ");
    return;
  }
  const nextState = await api(`/api/jobs/${encodeURIComponent(jobId)}/design-complete`, {
    method: "POST",
    body: form,
  });
  setState(nextState);
  closeDesignReply();
  showToast(`${jobId} ส่งข้อมูลถอดแบบกลับฝ่ายขายแล้ว`);
}

function lineCommandReply(command) {
  const replies = {
    งานวันนี้: state.jobs.filter((job) => daysUntil(job.dueDate) <= 1),
    รอถอดแบบ: state.jobs.filter((job) => job.status === "WAITING_DESIGN"),
    ต้องจองรถ: state.jobs.filter((job) => job.deliveryMode === "บริษัทจัดส่ง" && daysUntil(job.dueDate) <= 1),
    ผลิตค้าง: state.jobs.filter((job) => job.status === "IN_PRODUCTION"),
  };
  const lines = (replies[command] || []).map((job) => `${job.id} ${job.customer} - ${statusLabels[job.status]} - ส่ง ${formatDate(job.dueDate)}`);
  return `[${command}]\n${lines.join("\n") || "ไม่พบงาน"}`;
}

async function loginUser(userId) {
  const result = await api("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
  applySession({ token: result.token, user: result.user, source: "browser" });
  applyRolePermissions();
  renderJobsTable();
  showToast(`เข้าสู่ระบบเป็น ${result.user.name}`);
}

async function detectLineIdentity() {
  const params = new URLSearchParams(window.location.search);
  const lineUserId = params.get("lineUserId");
  if (lineUserId) {
    return {
      lineUserId,
      displayName: params.get("lineDisplayName") || "",
    };
  }
  if (window.liff?.isLoggedIn?.()) {
    const profile = await window.liff.getProfile();
    return {
      lineUserId: profile.userId,
      displayName: profile.displayName || "",
    };
  }
  return null;
}

async function loginWithLine(identity) {
  const result = await api("/api/line/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(identity),
  });
  applySession({ token: result.token, user: result.user, source: "line" });
  applyRolePermissions();
  renderJobsTable();
}

async function restoreSession() {
  if (!session.token) {
    applySession({ token: "", user: null });
    return;
  }
  try {
    const result = await api("/api/session");
    applySession({ token: session.token, user: result.user, source: result.session?.source || "browser" });
  } catch {
    applySession({ token: "", user: null, source: "" });
  }
}

async function logoutUser() {
  if (session.source === "line") {
    showToast("เมื่อใช้งานผ่าน LINE ระบบจะระบุตัวตนอัตโนมัติจากบัญชี LINE");
    return;
  }
  try {
    if (session.token) await api("/api/logout", { method: "POST" });
  } finally {
    applySession({ token: "", user: null, source: "" });
    applyRolePermissions();
    renderJobsTable();
    showToast("ออกจากระบบแล้ว");
  }
}

document.querySelectorAll(".nav-item").forEach((button) => {
  button.addEventListener("click", async () => {
    if (button.dataset.view === "admin" && currentUser()?.role !== "admin") {
      showToast("หน้านี้ใช้งานได้เฉพาะ Admin");
      return;
    }
    document.querySelectorAll(".nav-item").forEach((item) => item.classList.remove("active"));
    document.querySelectorAll(".view").forEach((view) => view.classList.remove("active"));
    button.classList.add("active");
    document.getElementById(button.dataset.view).classList.add("active");
    document.getElementById("pageTitle").textContent = button.textContent;
    if (button.dataset.view === "dashboard") {
      try {
        setState(await api("/api/state"));
      } catch (error) {
        showToast(error.message);
      }
    }
  });
});

document.getElementById("loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await loginUser(new FormData(event.currentTarget).get("userId"));
  } catch (error) {
    showToast(error.message);
  }
});

document.getElementById("logoutBtn").addEventListener("click", async () => {
  try {
    await logoutUser();
  } catch (error) {
    showToast(error.message);
  }
});

document.getElementById("adminUserRole").addEventListener("change", (event) => {
  document.getElementById("adminUserDepartment").value = departmentForRole(event.target.value);
});

document.getElementById("adminUserResetBtn").addEventListener("click", resetAdminUserForm);

document.getElementById("adminUserForm").addEventListener("submit", async (event) => {
  try {
    await submitAdminUser(event);
  } catch (error) {
    showToast(error.message);
  }
});

document.getElementById("adminUsersTable").addEventListener("click", (event) => {
  const target = event.target;
  if (target.matches("[data-edit-user]")) editAdminUser(target.dataset.editUser);
});

document.getElementById("userSelect").addEventListener("change", (event) => {
  window.localStorage.setItem(userStorageKey, event.target.value);
  const user = currentUser();
  if (user) document.getElementById("roleSelect").value = user.role;
  applyRolePermissions();
  renderJobsTable();
});

document.getElementById("statusFilter").addEventListener("change", renderJobsTable);
document.getElementById("dashboardSelectAll").addEventListener("change", (event) => {
  const visibleChecks = [...document.querySelectorAll(".dashboard-job-check")];
  visibleChecks.forEach((check) => {
    check.checked = event.target.checked;
    if (event.target.checked) {
      dashboardSelectedIds.add(check.value);
    } else {
      dashboardSelectedIds.delete(check.value);
    }
  });
  renderJobsTable();
});
document.getElementById("jobsTable").addEventListener("change", (event) => {
  if (!event.target.matches(".dashboard-job-check")) return;
  if (event.target.checked) {
    dashboardSelectedIds.add(event.target.value);
  } else {
    dashboardSelectedIds.delete(event.target.value);
  }
  renderJobsTable();
});
document.getElementById("salesDeleteSelectedBtn").addEventListener("click", async () => {
  try {
    await deleteDashboardSelectedJobs();
  } catch (error) {
    showToast(error.message);
  }
});

document.getElementById("createForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!canCreateJob()) {
    showToast("สร้างงานใหม่ได้เฉพาะฝ่ายขาย");
    return;
  }
  const formElement = event.currentTarget;
  try {
    const form = new FormData(formElement);
    const lineItems = collectLineItems();
    if (!lineItems.length) {
      showToast("กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ");
      return;
    }
    form.set("lineItems", JSON.stringify(lineItems));
    form.set("item", lineItems.map((item) => item.name).join(", "));
    form.set("quantity", String(lineItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0)));
    const nextState = await api("/api/jobs", {
      method: "POST",
      headers: { "X-User-Role": currentRole() },
      body: form,
    });
    setState(nextState);
    formElement.reset();
    resetLineItems();
    renderFilePreview();
    showToast(`สร้าง ${nextState.jobs[0].id} และอัปโหลดไฟล์แล้ว`);
  } catch (error) {
    showToast(error.message);
  }
});

document.getElementById("attachmentsInput").addEventListener("change", renderFilePreview);
document.getElementById("designReplyFiles").addEventListener("change", (event) => {
  formatFilePreview(event.currentTarget, "designReplyPreview");
});
document.getElementById("designReplyForm").addEventListener("submit", async (event) => {
  try {
    await submitDesignReply(event);
  } catch (error) {
    showToast(error.message);
  }
});
document.getElementById("closeDesignReplyBtn").addEventListener("click", closeDesignReply);
document.getElementById("cancelDesignReplyBtn").addEventListener("click", closeDesignReply);
document.getElementById("designReplyModal").addEventListener("click", (event) => {
  if (event.target.id === "designReplyModal") closeDesignReply();
});
document.getElementById("closeDocumentReadBtn").addEventListener("click", closeDocumentRead);
document.getElementById("documentReadModal").addEventListener("click", (event) => {
  if (event.target.id === "documentReadModal") closeDocumentRead();
});
document.getElementById("addLineItemBtn").addEventListener("click", () => {
  document.getElementById("lineItems").appendChild(createLineItemRow());
});
document.getElementById("lineItems").addEventListener("click", (event) => {
  if (!event.target.matches("[data-remove-line]")) return;
  const rows = document.querySelectorAll("#lineItems .line-item-row");
  if (rows.length === 1) {
    showToast("ต้องมีอย่างน้อย 1 รายการ");
    return;
  }
  event.target.closest(".line-item-row").remove();
});

document.addEventListener("click", async (event) => {
  const target = event.target;
  try {
    if (target.matches("[data-open-create]")) {
      if (!canCreateJob()) {
        showToast("สร้างงานใหม่ได้เฉพาะฝ่ายขาย");
        return;
      }
      document.querySelector('[data-view="inquiry"]').click();
    }
    if (target.matches("[data-move]")) {
      await moveJob(target.dataset.move, target.dataset.status);
    }
    if (target.matches("[data-design-complete]")) {
      openDesignReply(target.dataset.designComplete);
    }
    if (target.matches("[data-read]")) {
      await openDocumentRead(target.dataset.read, target.dataset.entryStatus);
    }
    if (target.matches("[data-delete]")) {
      await deleteJob(target.dataset.delete);
    }
    if (target.matches("[data-command]")) {
      const command = target.dataset.command;
      document.getElementById("lineReply").textContent = lineCommandReply(command);
    }
  } catch (error) {
    showToast(error.message);
  }
});

document.getElementById("bulkDeleteBtn").addEventListener("click", openBulkDelete);
document.getElementById("closeBulkDeleteBtn").addEventListener("click", closeBulkDelete);
document.getElementById("cancelBulkDeleteBtn").addEventListener("click", closeBulkDelete);
document.getElementById("confirmBulkDeleteBtn").addEventListener("click", clearJobs);
document.getElementById("selectAllJobs").addEventListener("change", (event) => {
  document.querySelectorAll(".bulk-job-check").forEach((check) => {
    check.checked = event.target.checked;
  });
  updateSelectedCount();
});
document.getElementById("bulkDeleteList").addEventListener("change", (event) => {
  if (event.target.matches(".bulk-job-check")) updateSelectedCount();
});
document.getElementById("bulkDeleteModal").addEventListener("click", (event) => {
  if (event.target.id === "bulkDeleteModal") closeBulkDelete();
});

document.getElementById("seedBtn").addEventListener("click", async () => {
  try {
    const nextState = await api("/api/jobs/seed", { method: "POST" });
    setState(nextState);
    showToast(`เพิ่มงานทดลอง ${nextState.jobs[0].id}`);
  } catch (error) {
    showToast(error.message);
  }
});

document.getElementById("productionForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const form = new FormData(event.currentTarget);
    const nextState = await api("/api/production/close", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId: form.get("jobId"),
        goodQty: form.get("goodQty"),
        defectQty: form.get("defectQty"),
      }),
    });
    setState(nextState);
    showToast("บันทึกผลผลิตแล้ว");
  } catch (error) {
    showToast(error.message);
  }
});

async function init() {
  renderSalesOwners();
  try {
    setState(await api("/api/state"));
    const lineIdentity = await detectLineIdentity();
    if (lineIdentity) {
      try {
        await loginWithLine(lineIdentity);
      } catch (error) {
        showToast(error.message);
        showLoginModal();
      }
      return;
    }
    await restoreSession();
  } catch (error) {
    showToast(error.message);
    showLoginModal();
  }
}

init();
