const state = {
  token: localStorage.getItem("vms_token") || "",
  user: JSON.parse(localStorage.getItem("vms_user") || "null"),
  vehicles: [],
  bookings: [],
  vehicleImages: JSON.parse(localStorage.getItem("vms_vehicle_images") || "{}"),
  charts: {},
  notificationsEnabled: localStorage.getItem("vms_toasts") !== "off",
  pendingConfirm: null,
  pendingImageData: "",
};

const els = {
  loader: document.getElementById("loaderOverlay"),
  alertBox: document.getElementById("alertBox"),
  toastContainer: document.getElementById("toastContainer"),
  userMeta: document.getElementById("userMeta"),
  authPanel: document.getElementById("authPanel"),
  sidebar: document.getElementById("sidebar"),
  navButtons: [...document.querySelectorAll(".sidebar-nav .nav-link")],
  adminOnly: [...document.querySelectorAll(".admin-only")],
  logoutBtn: document.getElementById("logoutBtn"),
  toggleSidebarBtn: document.getElementById("toggleSidebarBtn"),
  registerForm: document.getElementById("registerForm"),
  loginForm: document.getElementById("loginForm"),
  vehicleForm: document.getElementById("vehicleForm"),
  bookingForm: document.getElementById("bookingForm"),
  bookingVehicleSelect: document.getElementById("bookingVehicleSelect"),
  scheduledForInput: document.getElementById("scheduledForInput"),
  vehicleBrandInput: document.getElementById("vehicleBrandInput"),
  vehicleModelInput: document.getElementById("vehicleModelInput"),
  vehicleImageInput: document.getElementById("vehicleImageInput"),
  vehicleImageFileInput: document.getElementById("vehicleImageFileInput"),
  vehicleImagePreview: document.getElementById("vehicleImagePreview"),
  brandSuggestions: document.getElementById("brandSuggestions"),
  modelSuggestions: document.getElementById("modelSuggestions"),
  serviceTypeSuggestions: document.getElementById("serviceTypeSuggestions"),
  refreshBookingsBtn: document.getElementById("refreshBookingsBtn"),
  vehicleSearchInput: document.getElementById("vehicleSearchInput"),
  vehicleStatusFilter: document.getElementById("vehicleStatusFilter"),
  vehicleModelFilter: document.getElementById("vehicleModelFilter"),
  vehicleYearFilter: document.getElementById("vehicleYearFilter"),
  vehicleTypeFilter: document.getElementById("vehicleTypeFilter"),
  vehiclesGrid: document.getElementById("vehiclesGrid"),
  vehiclesTableBody: document.getElementById("vehiclesTableBody"),
  bookingsTimeline: document.getElementById("bookingsTimeline"),
  notificationList: document.getElementById("notificationList"),
  vehicleTypeSummary: document.getElementById("vehicleTypeSummary"),
  analyticsBox: document.getElementById("analyticsBox"),
  mostUsedVehicles: document.getElementById("mostUsedVehicles"),
  loadAnalyticsBtn: document.getElementById("loadAnalyticsBtn"),
  exportVehiclesBtn: document.getElementById("exportVehiclesBtn"),
  exportBookingsBtn: document.getElementById("exportBookingsBtn"),
  exportCombinedBtn: document.getElementById("exportCombinedBtn"),
  toastToggle: document.getElementById("toastToggle"),
  clearLogsBtn: document.getElementById("clearLogsBtn"),
  activityLogBody: document.getElementById("activityLogBody"),
  metricVehicles: document.getElementById("metricVehicles"),
  metricActive: document.getElementById("metricActive"),
  metricCompleted: document.getElementById("metricCompleted"),
  metricPending: document.getElementById("metricPending"),
  vehicleModalBody: document.getElementById("vehicleModalBody"),
  confirmText: document.getElementById("confirmText"),
  confirmActionBtn: document.getElementById("confirmActionBtn"),
};

const vehicleModal = new bootstrap.Modal(document.getElementById("vehicleModal"));
const confirmModal = new bootstrap.Modal(document.getElementById("confirmModal"));
const DAY = 24 * 60 * 60 * 1000;
const BRAND_MODEL_MAP = {
  Toyota: ["Innova", "Fortuner", "Camry", "Etios", "Corolla Altis", "Urban Cruiser"],
  Hyundai: ["Creta", "i20", "Verna", "Venue", "Alcazar", "Exter"],
  Honda: ["City", "Amaze", "Elevate", "WR-V", "Jazz"],
  Maruti: ["Swift", "Baleno", "Brezza", "Ertiga", "Dzire", "Ciaz"],
  Tata: ["Nexon", "Harrier", "Safari", "Punch", "Tiago", "Altroz"],
  Mahindra: ["Scorpio", "XUV700", "Thar", "Bolero", "XUV300"],
  Kia: ["Seltos", "Sonet", "Carens", "EV6"],
  MG: ["Hector", "Astor", "ZS EV", "Gloster"],
};
const SERVICE_TYPE_OPTIONS = [
  "General Service",
  "Oil Change",
  "Brake Inspection",
  "Battery Check",
  "Tyre Rotation",
  "Wheel Alignment",
  "Engine Diagnostics",
  "AC Service",
  "Car Wash & Detailing",
  "Emission Check",
];
const VEHICLE_TYPE_META = {
  Car: { icon: "🚗", badgeClass: "vehicle-type-car" },
  Bike: { icon: "🏍️", badgeClass: "vehicle-type-bike" },
  Truck: { icon: "🚛", badgeClass: "vehicle-type-truck" },
  Bus: { icon: "🚌", badgeClass: "vehicle-type-bus" },
  Other: { icon: "🚘", badgeClass: "vehicle-type-other" },
};
const CHART_PALETTE = ["#2563eb", "#10b981", "#f59e0b", "#7c3aed", "#ef4444", "#06b6d4"];

function showLoader(show) {
  els.loader.classList.toggle("d-none", !show);
}

function toast(message, level = "success") {
  if (!state.notificationsEnabled) return;
  const id = `t_${Date.now()}_${Math.floor(Math.random() * 9999)}`;
  const html = `
    <div id="${id}" class="toast align-items-center text-bg-${level} border-0" role="alert">
      <div class="d-flex">
        <div class="toast-body">${message}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    </div>`;
  els.toastContainer.insertAdjacentHTML("beforeend", html);
  const toastEl = document.getElementById(id);
  const bsToast = new bootstrap.Toast(toastEl, { delay: 2600 });
  bsToast.show();
  toastEl.addEventListener("hidden.bs.toast", () => toastEl.remove());
}

function setAlert(message, level = "success") {
  els.alertBox.innerHTML = `<div class="alert alert-${level}" role="alert">${message}</div>`;
}

function clearAlert() {
  els.alertBox.innerHTML = "";
}

function setInnerHtml(element, html) {
  if (!element) return;
  element.innerHTML = html;
}

function addLog(action, details = "") {
  const logs = JSON.parse(localStorage.getItem("vms_logs") || "[]");
  logs.unshift({
    time: new Date().toISOString(),
    user: state.user ? state.user.email : "guest",
    action,
    details,
  });
  localStorage.setItem("vms_logs", JSON.stringify(logs.slice(0, 200)));
  renderActivityLogs();
}

function renderActivityLogs() {
  const logs = JSON.parse(localStorage.getItem("vms_logs") || "[]");
  if (!logs.length) {
    setInnerHtml(els.activityLogBody, `<tr><td colspan="4" class="text-muted">No logs yet.</td></tr>`);
    return;
  }
  setInnerHtml(
    els.activityLogBody,
    logs
    .map(
      (log) => `
      <tr>
        <td>${new Date(log.time).toLocaleString()}</td>
        <td>${log.user}</td>
        <td>${log.action}</td>
        <td>${log.details || "-"}</td>
      </tr>
    `
    )
    .join("")
  );
}

function storeAuth() {
  if (state.token) localStorage.setItem("vms_token", state.token);
  else localStorage.removeItem("vms_token");
  if (state.user) localStorage.setItem("vms_user", JSON.stringify(state.user));
  else localStorage.removeItem("vms_user");
}

function persistVehicleImages() {
  localStorage.setItem("vms_vehicle_images", JSON.stringify(state.vehicleImages));
}

function populateSuggestions() {
  setInnerHtml(
    els.brandSuggestions,
    Object.keys(BRAND_MODEL_MAP)
      .map((brand) => `<option value="${brand}"></option>`)
      .join("")
  );
  setInnerHtml(
    els.serviceTypeSuggestions,
    SERVICE_TYPE_OPTIONS.map((service) => `<option value="${service}"></option>`).join("")
  );
  updateModelSuggestions();
}

function updateModelSuggestions() {
  const brandInput = (els.vehicleBrandInput.value || "").trim().toLowerCase();
  const exactBrand = Object.keys(BRAND_MODEL_MAP).find(
    (brand) => brand.toLowerCase() === brandInput
  );
  const models = exactBrand
    ? BRAND_MODEL_MAP[exactBrand]
    : [...new Set(Object.values(BRAND_MODEL_MAP).flat())];
  setInnerHtml(
    els.modelSuggestions,
    models.map((model) => `<option value="${model}"></option>`).join("")
  );
}

function refreshVehicleImagePreview() {
  const val = state.pendingImageData || (els.vehicleImageInput.value || "").trim();
  if (!val) {
    els.vehicleImagePreview.classList.add("d-none");
    els.vehicleImagePreview.removeAttribute("src");
    return;
  }
  els.vehicleImagePreview.src = val;
  els.vehicleImagePreview.classList.remove("d-none");
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read image file."));
    reader.readAsDataURL(file);
  });
}

async function vehicleImageFileHandler(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) {
    state.pendingImageData = "";
    refreshVehicleImagePreview();
    return;
  }
  if (!file.type.startsWith("image/")) {
    setAlert("Please select a valid image file.", "danger");
    e.target.value = "";
    return;
  }
  try {
    state.pendingImageData = await fileToDataUrl(file);
    els.vehicleImageInput.value = "";
    refreshVehicleImagePreview();
    toast("Image selected from local file", "info");
  } catch (err) {
    setAlert(err.message, "danger");
  }
}

function headers() {
  const h = { "Content-Type": "application/json" };
  if (state.token) h.Authorization = `Bearer ${state.token}`;
  return h;
}

async function api(path, method = "GET", body = null, withLoader = true) {
  if (withLoader) showLoader(true);
  try {
    const res = await fetch(path, {
      method,
      headers: headers(),
      body: body ? JSON.stringify(body) : null,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
  } finally {
    if (withLoader) showLoader(false);
  }
}

function requireFormValidity(form) {
  if (form.checkValidity()) return true;
  form.classList.add("was-validated");
  return false;
}

function daysFromNow(isoDate) {
  return Math.floor((new Date(isoDate).getTime() - Date.now()) / DAY);
}

function nowLocalForInput() {
  const d = new Date();
  d.setMilliseconds(0);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 19);
}

function normalizeScheduledFor(value) {
  const raw = (value || "").trim();
  if (!raw) return nowLocalForInput();
  if (raw.length === 16) return `${raw}:00`;
  return raw;
}

function statusBadge(status) {
  const tone = {
    scheduled: "warning",
    assigned: "info",
    in_progress: "primary",
    completed: "success",
    cancelled: "danger",
  }[status] || "secondary";
  return `<span class="badge text-bg-${tone} text-uppercase">${status.replace("_", " ")}</span>`;
}

function normalizeVehicleType(vehicleType) {
  const raw = String(vehicleType || "").trim().toLowerCase();
  const exact = Object.keys(VEHICLE_TYPE_META).find((type) => type.toLowerCase() === raw);
  return exact || "Other";
}

function vehicleTypeBadge(vehicleType) {
  const type = normalizeVehicleType(vehicleType);
  const meta = VEHICLE_TYPE_META[type];
  return `<span class="vehicle-type-badge ${meta.badgeClass}"><span class="vehicle-type-icon">${meta.icon}</span>${type}</span>`;
}

function vehicleTypeLabel(vehicleType) {
  const type = normalizeVehicleType(vehicleType);
  const meta = VEHICLE_TYPE_META[type];
  return `${meta.icon} ${type}`;
}

function getLastServiceDate(vehicleId) {
  const completed = state.bookings
    .filter((b) => b.vehicle_id === vehicleId && b.status === "completed")
    .sort((a, b) => new Date(b.scheduled_for) - new Date(a.scheduled_for));
  return completed[0] ? new Date(completed[0].scheduled_for) : null;
}

function predictNextService(vehicleId) {
  const last = getLastServiceDate(vehicleId);
  const base = last || new Date(Date.now() - 120 * DAY);
  return new Date(base.getTime() + 180 * DAY);
}

function getVehicleStatus(vehicleId) {
  const due = predictNextService(vehicleId);
  const days = Math.floor((due.getTime() - Date.now()) / DAY);
  if (days < 0) return "overdue";
  if (days <= 20) return "service_due";
  return "active";
}

function vehicleHealthScore(vehicleId) {
  const vehicleBookings = state.bookings.filter((b) => b.vehicle_id === vehicleId);
  const completed = vehicleBookings.filter((b) => b.status === "completed").length;
  const cancelled = vehicleBookings.filter((b) => b.status === "cancelled").length;
  const active = vehicleBookings.filter((b) => b.status !== "completed").length;
  let score = 100 + completed * 2 - cancelled * 12 - active * 4;
  if (getVehicleStatus(vehicleId) === "overdue") score -= 20;
  if (score > 100) score = 100;
  if (score < 25) score = 25;
  return score;
}

function isAdmin() {
  return state.user && state.user.role === "admin";
}

function setRoleUI() {
  const loggedIn = Boolean(state.user);
  els.userMeta.textContent = loggedIn
    ? `${state.user.full_name} (${state.user.role})`
    : "Not logged in";

  els.adminOnly.forEach((el) => {
    el.classList.toggle("d-none", !isAdmin());
  });

  els.authPanel.classList.toggle("d-none", loggedIn);
  if (loggedIn) showSection("dashboard");
}

function showSection(section) {
  document.querySelectorAll(".content-section").forEach((sec) => {
    if (sec.id.startsWith("section-")) {
      sec.classList.toggle("d-none", sec.id !== `section-${section}`);
    }
  });
  els.navButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.section === section);
  });
}

function getFilteredVehicles() {
  const q = (els.vehicleSearchInput?.value || "").trim().toLowerCase();
  const status = els.vehicleStatusFilter?.value || "all";
  const model = (els.vehicleModelFilter?.value || "").trim().toLowerCase();
  const year = (els.vehicleYearFilter?.value || "").trim();
  const selectedType = els.vehicleTypeFilter?.value || "all";
  return state.vehicles.filter((v) => {
    const vStatus = getVehicleStatus(v.id);
    const okSearch = v.plate_number.toLowerCase().includes(q);
    const okStatus = status === "all" ? true : vStatus === status;
    const okModel = model ? v.model.toLowerCase().includes(model) : true;
    const okYear = year ? String(v.year) === year : true;
    const okType =
      selectedType === "all"
        ? true
        : normalizeVehicleType(v.vehicle_type) === normalizeVehicleType(selectedType);
    return okSearch && okStatus && okModel && okYear && okType;
  });
}

function vehicleImageUrl(vehicle) {
  if (state.vehicleImages[String(vehicle.id)]) return state.vehicleImages[String(vehicle.id)];
  if (state.vehicleImages[vehicle.plate_number]) return state.vehicleImages[vehicle.plate_number];
  const key = encodeURIComponent(`${vehicle.brand} ${vehicle.model}`);
  return `https://source.unsplash.com/400x240/?car,${key}`;
}

window.handleVehicleImageError = (img) => {
  img.onerror = null;
  img.src =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      "<svg xmlns='http://www.w3.org/2000/svg' width='400' height='240'><rect width='100%' height='100%' fill='#dbeafe'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#1e40af' font-size='20' font-family='Arial'>Vehicle Image</text></svg>"
    );
};

function renderVehicles() {
  const vehicles = getFilteredVehicles();
  if (!vehicles.length) {
    setInnerHtml(els.vehiclesGrid, `<div class="col-12"><div class="card panel-card"><div class="card-body text-muted">No vehicles match current filters.</div></div></div>`);
    setInnerHtml(els.vehiclesTableBody, `<tr><td colspan="6" class="text-center text-muted py-4">No vehicles match current filters.</td></tr>`);
    return;
  }
  setInnerHtml(
    els.vehiclesGrid,
    vehicles
    .map((v) => {
      const status = getVehicleStatus(v.id);
      const due = predictNextService(v.id);
      const health = vehicleHealthScore(v.id);
      const statusTone = status === "active" ? "success" : status === "service_due" ? "warning" : "danger";
      return `
      <div class="col-md-6 col-xl-4">
        <div class="card vehicle-card h-100">
          <img src="${vehicleImageUrl(v)}" class="vehicle-img" alt="vehicle" onerror="handleVehicleImageError(this)">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <h6 class="mb-0">${v.plate_number}</h6>
              <span class="badge text-bg-${statusTone}">${status.replace("_", " ")}</span>
            </div>
            <div class="mb-2">${vehicleTypeBadge(v.vehicle_type)}</div>
            <p class="text-muted mb-1">${v.brand} ${v.model} (${v.year})</p>
            <p class="small mb-1">Predicted Next Service: <strong>${due.toLocaleDateString()}</strong></p>
            <p class="small mb-2">Health Score: <strong>${health}/100</strong></p>
            <div class="progress mb-3" role="progressbar">
              <div class="progress-bar ${health > 75 ? "bg-success" : health > 50 ? "bg-warning" : "bg-danger"}" style="width:${health}%"></div>
            </div>
            <div class="d-flex gap-2">
              <button class="btn btn-sm btn-outline-primary flex-grow-1" onclick="viewVehicle(${v.id})"><i class="bi bi-eye"></i></button>
              <button class="btn btn-sm btn-outline-secondary flex-grow-1" onclick="quickEditVehicle(${v.id})"><i class="bi bi-pencil"></i></button>
              <button class="btn btn-sm btn-outline-danger flex-grow-1" onclick="confirmDeleteVehicle(${v.id})"><i class="bi bi-trash"></i></button>
            </div>
          </div>
        </div>
      </div>`;
    })
    .join("")
  );

  setInnerHtml(
    els.vehiclesTableBody,
    vehicles
    .map((v) => {
      const status = getVehicleStatus(v.id);
      const health = vehicleHealthScore(v.id);
      return `
      <tr>
        <td class="fw-semibold">${v.plate_number}</td>
        <td>${v.brand} ${v.model}</td>
        <td>${vehicleTypeBadge(v.vehicle_type)}</td>
        <td>${v.year}</td>
        <td>${statusBadge(status)}</td>
        <td>${health}/100</td>
      </tr>`;
    })
    .join("")
  );
}

function renderBookings() {
  if (!state.bookings.length) {
    setInnerHtml(els.bookingsTimeline, `<p class="text-muted mb-0">No bookings yet.</p>`);
    return;
  }
  const sorted = [...state.bookings].sort(
    (a, b) => new Date(b.scheduled_for) - new Date(a.scheduled_for)
  );
  setInnerHtml(
    els.bookingsTimeline,
    sorted
    .map((b) => {
      const dueDays = daysFromNow(b.scheduled_for);
      return `
      <article class="timeline-item">
        <div class="timeline-marker"></div>
        <div class="timeline-content">
          <div class="d-flex justify-content-between align-items-center">
            <h6 class="mb-1">#${b.id} - Vehicle ${b.vehicle_id}</h6>
            ${statusBadge(b.status)}
          </div>
          <p class="mb-1">${b.service_type}</p>
          <p class="small text-muted mb-2">Scheduled: ${new Date(b.scheduled_for).toLocaleString()} (${dueDays >= 0 ? `${dueDays} days left` : `${Math.abs(dueDays)} days overdue`})</p>
          <div class="d-flex gap-2 flex-wrap">
            <button class="btn btn-sm btn-outline-dark" onclick="viewBookingHistory(${b.id})"><i class="bi bi-clock-history me-1"></i>History</button>
            ${
              isAdmin()
                ? `<button class="btn btn-sm btn-outline-success" onclick="setBookingStatus(${b.id},'completed')">Mark Completed</button>
                   <button class="btn btn-sm btn-outline-danger" onclick="setBookingStatus(${b.id},'cancelled')">Cancel</button>`
                : ""
            }
          </div>
        </div>
      </article>`;
    })
    .join("")
  );
}

function renderMetrics() {
  const active = state.bookings.filter((b) =>
    ["scheduled", "assigned", "in_progress"].includes(b.status)
  ).length;
  const completed = state.bookings.filter((b) => b.status === "completed").length;
  const pending = state.bookings.filter((b) => b.status === "scheduled").length;
  els.metricVehicles.textContent = state.vehicles.length;
  els.metricActive.textContent = active;
  els.metricCompleted.textContent = completed;
  els.metricPending.textContent = pending;
}

function countVehiclesByType() {
  const counts = Object.keys(VEHICLE_TYPE_META).reduce((acc, type) => {
    acc[type] = 0;
    return acc;
  }, {});
  state.vehicles.forEach((vehicle) => {
    counts[normalizeVehicleType(vehicle.vehicle_type)] += 1;
  });
  return counts;
}

function bucketByMonth() {
  const map = new Map();
  state.bookings.forEach((b) => {
    const d = new Date(b.scheduled_for);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    map.set(key, (map.get(key) || 0) + 1);
  });
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
}

function countByVehicle() {
  const map = new Map();
  state.bookings.forEach((b) => map.set(b.vehicle_id, (map.get(b.vehicle_id) || 0) + 1));
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
}

function countByServiceType() {
  const map = new Map();
  state.bookings.forEach((b) => map.set(b.service_type, (map.get(b.service_type) || 0) + 1));
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
}

function drawChart(id, config) {
  if (state.charts[id]) state.charts[id].destroy();
  const ctx = document.getElementById(id);
  if (!ctx) return;
  state.charts[id] = new Chart(ctx, config);
}

function renderCharts() {
  const trend = bucketByMonth();
  drawChart("bookingTrendChart", {
    type: "line",
    data: {
      labels: trend.map((x) => x[0]),
      datasets: [
        {
          label: "Bookings",
          data: trend.map((x) => x[1]),
          borderColor: "#2563eb",
          backgroundColor: "rgba(37,99,235,0.18)",
          pointBackgroundColor: "#dc2626",
          pointBorderColor: "#ffffff",
          pointRadius: 4,
          tension: 0.3,
          fill: true,
        },
      ],
    },
    options: { responsive: true, plugins: { legend: { display: false } } },
  });

  const usage = countByVehicle();
  drawChart("vehicleUsageChart", {
    type: "doughnut",
    data: {
      labels: usage.map((x) => `Vehicle ${x[0]}`),
      datasets: [
        {
          data: usage.map((x) => x[1]),
          backgroundColor: [
            "#2563eb",
            "#1d4ed8",
            "#7c3aed",
            "#dc2626",
            "#ef4444",
            "#0ea5e9",
          ],
        },
      ],
    },
    options: { responsive: true },
  });

  const freq = countByServiceType();
  drawChart("serviceFrequencyChart", {
    type: "bar",
    data: {
      labels: freq.map((x) => x[0]),
      datasets: [
        {
          label: "Count",
          data: freq.map((x) => x[1]),
          backgroundColor: freq.map((_, index) => CHART_PALETTE[index % CHART_PALETTE.length]),
          borderColor: freq.map((_, index) => CHART_PALETTE[index % CHART_PALETTE.length]),
          borderWidth: 1,
        },
      ],
    },
    options: { responsive: true, plugins: { legend: { display: false } } },
  });
}

function renderNotifications() {
  const notes = [];
  state.vehicles.forEach((v) => {
    const status = getVehicleStatus(v.id);
    if (status === "overdue") {
      notes.push(`Vehicle ${v.plate_number} is overdue for service.`);
    } else if (status === "service_due") {
      notes.push(`Vehicle ${v.plate_number} requires service soon.`);
    }
  });
  state.bookings
    .filter((b) => b.status === "scheduled")
    .forEach((b) => notes.push(`Booking #${b.id} is pending confirmation.`));
  if (!notes.length) notes.push("All operations normal. No urgent alerts.");
  setInnerHtml(
    els.notificationList,
    notes
      .slice(0, 8)
      .map((n) => `<li><i class="bi bi-bell-fill text-warning me-2"></i>${n}</li>`)
      .join("")
  );
}

function renderVehicleTypeSummary() {
  const counts = countVehiclesByType();
  setInnerHtml(
    els.vehicleTypeSummary,
    Object.entries(counts)
      .map(([type, count]) => {
        const meta = VEHICLE_TYPE_META[type];
        return `
      <div class="type-summary-card ${meta.badgeClass}">
        <div class="type-summary-icon">${meta.icon}</div>
        <div>
          <div class="type-summary-label">${type}</div>
          <div class="type-summary-value">${count}</div>
        </div>
      </div>`;
      })
      .join("")
  );
}

function renderMostUsedVehicles() {
  const usage = countByVehicle();
  if (!usage.length) {
    setInnerHtml(els.mostUsedVehicles, `<p class="text-muted mb-0">No data yet.</p>`);
    return;
  }
  setInnerHtml(
    els.mostUsedVehicles,
    `
    <div class="table-responsive">
      <table class="table table-sm mb-0">
        <thead><tr><th>Vehicle</th><th>Bookings</th></tr></thead>
        <tbody>
          ${usage
            .map((u) => `<tr><td>Vehicle ${u[0]}</td><td>${u[1]}</td></tr>`)
            .join("")}
        </tbody>
      </table>
    </div>
  `
  );
}

function populateBookingVehicleOptions() {
  if (!els.bookingVehicleSelect) return;
  const options = state.vehicles
    .map(
      (v) =>
        `<option value="${v.id}">${v.plate_number} - ${v.brand} ${v.model} (${v.year}) - ${vehicleTypeLabel(v.vehicle_type)}</option>`
    )
    .join("");
  setInnerHtml(
    els.bookingVehicleSelect,
    `<option value="">Select Vehicle (Plate Number)</option>${options}`
  );
}

async function refreshData() {
  if (!state.token) return;
  state.vehicles = await api("/api/vehicles", "GET", null, false);
  state.bookings = await api("/api/bookings", "GET", null, false);
  populateBookingVehicleOptions();
  renderVehicles();
  renderBookings();
  renderMetrics();
  renderCharts();
  renderNotifications();
  renderVehicleTypeSummary();
  renderMostUsedVehicles();
}

function toCsv(rows) {
  if (!rows.length) return "";
  const keys = Object.keys(rows[0]);
  const header = keys.join(",");
  const lines = rows.map((row) =>
    keys
      .map((k) => {
        const v = String(row[k] ?? "").replace(/"/g, '""');
        return `"${v}"`;
      })
      .join(",")
  );
  return [header, ...lines].join("\n");
}

function downloadCsv(name, rows) {
  const csv = toCsv(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function registerHandler(e) {
  e.preventDefault();
  const form = e.currentTarget;
  if (!requireFormValidity(form)) return;
  const payload = Object.fromEntries(new FormData(form));
  try {
    await api("/api/auth/register", "POST", payload);
    setAlert("Registration successful. Login to continue.", "success");
    toast("User registered successfully");
    addLog("REGISTER", payload.email);
    form.reset();
    form.classList.remove("was-validated");
  } catch (err) {
    setAlert(err.message, "danger");
    toast(err.message, "danger");
  }
}

async function loginHandler(e) {
  e.preventDefault();
  const form = e.currentTarget;
  if (!requireFormValidity(form)) return;
  try {
    const payload = Object.fromEntries(new FormData(form));
    const data = await api("/api/auth/login", "POST", payload);
    state.token = data.access_token;
    state.user = data.user;
    storeAuth();
    setRoleUI();
    setAlert(`Welcome ${data.user.full_name}.`, "success");
    toast("Login successful");
    addLog("LOGIN", data.user.email);
    await refreshData();
  } catch (err) {
    setAlert(err.message, "danger");
    toast(err.message, "danger");
  }
}

async function logoutHandler() {
  state.token = "";
  state.user = null;
  state.vehicles = [];
  state.bookings = [];
  storeAuth();
  setRoleUI();
  clearAlert();
  addLog("LOGOUT");
  location.reload();
}

async function vehicleHandler(e) {
  e.preventDefault();
  const form = e.currentTarget;
  if (!requireFormValidity(form)) return;
  const payload = Object.fromEntries(new FormData(form));
  const imageUrl = state.pendingImageData || (payload.image_url || "").trim();
  delete payload.image_url;
  payload.plate_number = payload.plate_number.trim().toUpperCase();
  payload.year = Number(payload.year);
  payload.vehicle_type = normalizeVehicleType(payload.vehicle_type);
  try {
    const created = await api("/api/vehicles", "POST", payload);
    if (imageUrl) {
      if (created && created.id) state.vehicleImages[String(created.id)] = imageUrl;
      state.vehicleImages[payload.plate_number] = imageUrl;
      persistVehicleImages();
    }
    toast("Vehicle added");
    setAlert("Vehicle created successfully.", "success");
    addLog("CREATE_VEHICLE", payload.plate_number);
    form.reset();
    state.pendingImageData = "";
    refreshVehicleImagePreview();
    await refreshData();
  } catch (err) {
    setAlert(err.message, "danger");
    toast(err.message, "danger");
  }
}

async function bookingHandler(e) {
  e.preventDefault();
  const form = e.currentTarget;
  if (!requireFormValidity(form)) return;
  const payload = Object.fromEntries(new FormData(form));
  payload.vehicle_id = Number(payload.vehicle_id);
  payload.scheduled_for = normalizeScheduledFor(payload.scheduled_for);
  try {
    await api("/api/bookings", "POST", payload);
    toast("Booking created");
    setAlert("Service booking scheduled.", "success");
    addLog("CREATE_BOOKING", `vehicle=${payload.vehicle_id}`);
    form.reset();
    if (els.scheduledForInput) els.scheduledForInput.value = nowLocalForInput();
    await refreshData();
  } catch (err) {
    setAlert(err.message, "danger");
    toast(err.message, "danger");
  }
}

async function loadAdminAnalytics() {
  try {
    const data = await api("/api/admin/analytics");
    els.analyticsBox.textContent = JSON.stringify(data, null, 2);
    toast("Analytics loaded");
    addLog("VIEW_ANALYTICS");
  } catch (err) {
    setAlert(err.message, "danger");
    toast(err.message, "danger");
  }
}

function setConfirmAction(message, handler) {
  els.confirmText.textContent = message;
  state.pendingConfirm = handler;
  confirmModal.show();
}

els.confirmActionBtn.addEventListener("click", async () => {
  if (state.pendingConfirm) {
    await state.pendingConfirm();
    state.pendingConfirm = null;
  }
  confirmModal.hide();
});

window.confirmDeleteVehicle = (id) => {
  setConfirmAction("Delete this vehicle? This cannot be undone.", async () => {
    try {
      const vehicle = state.vehicles.find((v) => v.id === id);
      await api(`/api/vehicles/${id}`, "DELETE");
      delete state.vehicleImages[String(id)];
      if (vehicle) delete state.vehicleImages[vehicle.plate_number];
      persistVehicleImages();
      addLog("DELETE_VEHICLE", `id=${id}`);
      toast("Vehicle deleted", "warning");
      await refreshData();
    } catch (err) {
      setAlert(err.message, "danger");
      toast(err.message, "danger");
    }
  });
};

window.quickEditVehicle = async (id) => {
  const vehicle = state.vehicles.find((v) => v.id === id);
  if (!vehicle) return;
  const model = prompt("Update model", vehicle.model);
  if (!model) return;
  const vehicleType = prompt(
    `Update vehicle type (${Object.keys(VEHICLE_TYPE_META).join(", ")})`,
    normalizeVehicleType(vehicle.vehicle_type)
  );
  if (vehicleType === null) return;
  try {
    await api(`/api/vehicles/${id}`, "PUT", {
      model,
      vehicle_type: normalizeVehicleType(vehicleType),
    });
    addLog("UPDATE_VEHICLE", `id=${id}`);
    toast("Vehicle updated", "info");
    await refreshData();
  } catch (err) {
    setAlert(err.message, "danger");
  }
};

window.viewVehicle = (id) => {
  const v = state.vehicles.find((x) => x.id === id);
  if (!v) return;
  const due = predictNextService(v.id);
  const status = getVehicleStatus(v.id);
  const health = vehicleHealthScore(v.id);
  els.vehicleModalBody.innerHTML = `
    <div class="small text-muted mb-2">Vehicle ID: ${v.id}</div>
    <p class="mb-1"><strong>Plate:</strong> ${v.plate_number}</p>
    <p class="mb-1"><strong>Brand:</strong> ${v.brand}</p>
    <p class="mb-1"><strong>Model:</strong> ${v.model}</p>
    <p class="mb-1"><strong>Year:</strong> ${v.year}</p>
    <p class="mb-1"><strong>Vehicle Type:</strong> ${vehicleTypeBadge(v.vehicle_type)}</p>
    <p class="mb-1"><strong>Status:</strong> ${status}</p>
    <p class="mb-1"><strong>Predicted Service:</strong> ${due.toLocaleDateString()}</p>
    <p class="mb-0"><strong>Health Score:</strong> ${health}/100</p>
  `;
  vehicleModal.show();
};

window.viewBookingHistory = async (id) => {
  try {
    const history = await api(`/api/bookings/${id}/history`);
    const content = history.length
      ? history
          .map(
            (h) =>
              `<li class="mb-2"><strong>${h.previous_status}</strong> -> <strong>${h.new_status}</strong> by user ${h.changed_by} on ${new Date(h.changed_at).toLocaleString()}</li>`
          )
          .join("")
      : "<li>No history found.</li>";
    els.vehicleModalBody.innerHTML = `<h6>Booking #${id} History</h6><ul class="mb-0">${content}</ul>`;
    vehicleModal.show();
  } catch (err) {
    setAlert(err.message, "danger");
  }
};

window.setBookingStatus = async (id, status) => {
  try {
    await api(`/api/bookings/${id}/status`, "PUT", { status });
    addLog("UPDATE_BOOKING_STATUS", `id=${id} status=${status}`);
    toast(`Booking ${id} -> ${status}`);
    await refreshData();
  } catch (err) {
    setAlert(err.message, "danger");
  }
};

function bindEvents() {
  els.navButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.section;
      if (!state.user) return;
      if ((target === "analytics" || target === "reports") && !isAdmin()) return;
      showSection(target);
    });
  });

  els.toggleSidebarBtn.addEventListener("click", () => {
    els.sidebar.classList.toggle("open");
  });

  els.logoutBtn.addEventListener("click", logoutHandler);
  els.registerForm.addEventListener("submit", registerHandler);
  els.loginForm.addEventListener("submit", loginHandler);
  els.vehicleForm.addEventListener("submit", vehicleHandler);
  els.bookingForm.addEventListener("submit", bookingHandler);
  els.vehicleBrandInput.addEventListener("input", updateModelSuggestions);
  els.vehicleImageInput.addEventListener("input", () => {
    state.pendingImageData = "";
    refreshVehicleImagePreview();
  });
  els.vehicleImageFileInput.addEventListener("change", vehicleImageFileHandler);
  els.refreshBookingsBtn.addEventListener("click", refreshData);
  els.loadAnalyticsBtn.addEventListener("click", loadAdminAnalytics);

  [els.vehicleSearchInput, els.vehicleStatusFilter, els.vehicleModelFilter, els.vehicleYearFilter, els.vehicleTypeFilter]
    .filter(Boolean)
    .forEach((input) => {
      input.addEventListener("input", renderVehicles);
      input.addEventListener("change", renderVehicles);
    });

  els.exportVehiclesBtn.addEventListener("click", () => {
    downloadCsv("vehicles_report.csv", state.vehicles);
    addLog("EXPORT", "vehicles");
  });
  els.exportBookingsBtn.addEventListener("click", () => {
    downloadCsv("bookings_report.csv", state.bookings);
    addLog("EXPORT", "bookings");
  });
  els.exportCombinedBtn.addEventListener("click", () => {
    const combined = state.bookings.map((b) => {
      const v = state.vehicles.find((x) => x.id === b.vehicle_id) || {};
      return {
        booking_id: b.id,
        vehicle_id: b.vehicle_id,
        plate_number: v.plate_number || "",
        service_type: b.service_type,
        status: b.status,
        scheduled_for: b.scheduled_for,
      };
    });
    downloadCsv("combined_operational_report.csv", combined);
    addLog("EXPORT", "combined");
  });

  els.toastToggle.checked = state.notificationsEnabled;
  els.toastToggle.addEventListener("change", (e) => {
    state.notificationsEnabled = e.target.checked;
    localStorage.setItem("vms_toasts", state.notificationsEnabled ? "on" : "off");
    toast(`Toasts ${state.notificationsEnabled ? "enabled" : "disabled"}`, "info");
  });

  els.clearLogsBtn.addEventListener("click", () => {
    localStorage.removeItem("vms_logs");
    renderActivityLogs();
    toast("Activity logs cleared", "warning");
  });
}

async function bootstrapApp() {
  populateSuggestions();
  bindEvents();
  refreshVehicleImagePreview();
  if (els.scheduledForInput) els.scheduledForInput.value = nowLocalForInput();
  renderActivityLogs();
  setRoleUI();
  if (state.token && state.user) {
    try {
      await refreshData();
      toast("Session restored", "info");
    } catch (_err) {
      state.token = "";
      state.user = null;
      storeAuth();
      setRoleUI();
    }
  }
}

bootstrapApp();
