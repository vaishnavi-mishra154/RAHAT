/* =========================================================
   RAHAT — Emergency Response Platform
   Frontend application logic

   STRUCTURE
   1. Config
   2. Mock data
   3. API layer (swap mock calls for real fetch() calls here)
   4. App state
   5. Rendering
   6. Event handlers
   7. Init
   ========================================================= */

/* =========================================================
   1. CONFIG
   ========================================================= */
const CONFIG = {
  // Base URL for the future backend API.
  // Leave as a relative path ("/api") so it works behind the same
  // ALB / EC2 host that serves this frontend — no hardcoded host,
  // no localhost, no port baked in.
  API_BASE_URL: "/api",

  // Toggle this to `true` once the backend endpoints below are live.
  // While `false`, the app runs entirely on mock data.
  USE_REAL_API: true,

  // Simulated network delay for mock calls, so loading states are visible.
  MOCK_LATENCY_MS: 500,
};

/* =========================================================
   2. MOCK DATA
   (Stand-in for GET /incidents until the backend is connected)
   ========================================================= */
let MOCK_INCIDENTS = [
  {
    id: "INC-1042",
    title: "Fire reported at Warehouse B",
    description: "Smoke visible from the loading dock area of Warehouse B. Fire alarm triggered automatically. Nearby staff have been evacuated to the assembly point.",
    location: "Sector 12, Warehouse B",
    severity: "critical",
    status: "in-progress",
    createdAt: "2026-09-14T04:12:00Z",
    notes: [
      { text: "Incident reported and fire brigade dispatched.", time: "2026-09-14T04:13:00Z" },
      { text: "Fire brigade on site, containment in progress.", time: "2026-09-14T04:35:00Z" },
    ],
  },
  {
    id: "INC-1041",
    title: "Gas leak near Sector 4 pipeline",
    description: "Residents reported a strong gas odor near the Sector 4 pipeline junction. Utility company has been notified and is en route.",
    location: "Sector 4, Pipeline Junction",
    severity: "critical",
    status: "open",
    createdAt: "2026-09-14T02:40:00Z",
    notes: [
      { text: "Incident logged. Awaiting utility crew arrival.", time: "2026-09-14T02:41:00Z" },
    ],
  },
  {
    id: "INC-1040",
    title: "Flooding on Riverside access road",
    description: "Heavy rainfall has caused flooding on the Riverside access road, blocking vehicle access. Water level rising slowly.",
    location: "Riverside Road, Zone 3",
    severity: "high",
    status: "in-progress",
    createdAt: "2026-09-13T22:05:00Z",
    notes: [
      { text: "Barricades placed at both ends of the flooded stretch.", time: "2026-09-13T22:20:00Z" },
      { text: "Pump trucks dispatched to reduce water level.", time: "2026-09-14T01:00:00Z" },
    ],
  },
  {
    id: "INC-1039",
    title: "Building power outage — Block C",
    description: "Complete power outage affecting Block C offices. Backup generators have kicked in for critical systems only.",
    location: "Block C, Main Campus",
    severity: "medium",
    status: "resolved",
    createdAt: "2026-09-13T14:30:00Z",
    notes: [
      { text: "Electrical team identified a tripped transformer.", time: "2026-09-13T14:50:00Z" },
      { text: "Power restored to all floors.", time: "2026-09-13T16:10:00Z" },
    ],
  },
  {
    id: "INC-1038",
    title: "Minor chemical spill in Lab 3",
    description: "A small quantity of solvent was spilled in Lab 3 during routine testing. Area cordoned off and ventilated per safety protocol.",
    location: "Research Wing, Lab 3",
    severity: "low",
    status: "resolved",
    createdAt: "2026-09-13T09:15:00Z",
    notes: [
      { text: "Spill contained and cleaned per SOP.", time: "2026-09-13T09:40:00Z" },
    ],
  },
  {
    id: "INC-1037",
    title: "Suspicious unattended bag at Gate 2",
    description: "Security flagged an unattended bag near the Gate 2 checkpoint. Area cordoned off as a precaution while it is inspected.",
    location: "Gate 2, Main Entrance",
    severity: "high",
    status: "open",
    createdAt: "2026-09-13T07:50:00Z",
    notes: [
      { text: "Security perimeter established, bomb squad notified as precaution.", time: "2026-09-13T07:55:00Z" },
    ],
  },
  {
    id: "INC-1036",
    title: "Elevator malfunction, Tower 1",
    description: "Elevator 2 in Tower 1 stopped between floors 4 and 5 with one occupant. Occupant is safe and in communication with security.",
    location: "Tower 1",
    severity: "medium",
    status: "in-progress",
    createdAt: "2026-09-12T19:22:00Z",
    notes: [
      { text: "Maintenance team on site, manual release underway.", time: "2026-09-12T19:30:00Z" },
    ],
  },
  {
    id: "INC-1035",
    title: "Slip-and-fall injury in cafeteria",
    description: "An employee slipped on a wet floor near the cafeteria entrance. First aid administered on site, no fracture suspected.",
    location: "Main Cafeteria",
    severity: "low",
    status: "resolved",
    createdAt: "2026-09-12T12:05:00Z",
    notes: [
      { text: "First aid provided. Wet floor signage added.", time: "2026-09-12T12:15:00Z" },
    ],
  },
];

// Simple incrementing id counter for new mock incidents.
let mockIdCounter = 1043;

/* =========================================================
   3. API LAYER
   -----------------------------------------------------------
   These four functions are the ONLY place that talks to the
   backend. Everything else in the app calls these functions,
   never fetch() directly — so wiring up the real API later
   only requires editing this section.

   To connect the real backend once it's ready:
     1. Set CONFIG.USE_REAL_API = true
     2. Set CONFIG.API_BASE_URL to the real API path (e.g. "/api"
        if the API is proxied through the same ALB, or a full
        "https://api.yourdomain.com" if it's separate).
     3. Remove the mock branches (the `if (!CONFIG.USE_REAL_API)`
        blocks) if you want, or just leave them as an automatic
        offline fallback.

   No AWS credentials, DB credentials, or secrets belong here —
   the frontend only ever talks to your own API over HTTPS.
   ========================================================= */

function apiDelay() {
  return new Promise((resolve) =>
    setTimeout(resolve, CONFIG.MOCK_LATENCY_MS)
  );
}

/* Convert backend MySQL format into frontend format */
function normalizeIncident(item) {
  if (!item) return null;

  return {
    id: String(item.id ?? item.incident_id ?? ""),
    title: item.title ?? "",
    description: item.description ?? "",
    location: item.location ?? "",
    severity: String(item.severity ?? "medium").toLowerCase(),
    status: String(item.status ?? "open")
      .toLowerCase()
      .replace("_", "-"),
    createdAt: item.createdAt ?? item.created_at ?? new Date().toISOString(),
    notes: Array.isArray(item.notes)
      ? item.notes
      : item.notes
      ? [{ text: String(item.notes), time: new Date().toISOString() }]
      : [],
  };
}

function normalizeIncidents(items) {
  if (!Array.isArray(items)) return [];
  return items.map(normalizeIncident).filter(Boolean);
}

/* GET /api/incidents */
async function apiGetIncidents() {
  if (!CONFIG.USE_REAL_API) {
    await apiDelay();
    return JSON.parse(JSON.stringify(MOCK_INCIDENTS));
  }

  const res = await fetch(`${CONFIG.API_BASE_URL}/incidents`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to load incidents (${res.status})`);
  }

  const data = await res.json();
  return normalizeIncidents(data);
}

/* POST /api/incidents */
async function apiCreateIncident(payload) {
  if (!CONFIG.USE_REAL_API) {
    await apiDelay();

    const newIncident = {
      id: `INC-${mockIdCounter++}`,
      title: payload.title,
      description: payload.description,
      location: payload.location,
      severity: payload.severity,
      status: "open",
      createdAt: new Date().toISOString(),
      notes: [
        {
          text: "Incident reported.",
          time: new Date().toISOString(),
        },
      ],
    };

    MOCK_INCIDENTS.unshift(newIncident);
    return newIncident;
  }

  const res = await fetch(`${CONFIG.API_BASE_URL}/incidents`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      title: payload.title,
      description: payload.description,
      location: payload.location,
      severity: payload.severity,
      status: "open",
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to create incident (${res.status})`);
  }

  const data = await res.json();

  /*
    Current app.py may return only:
    { message: "Incident created", id: 1 }

    Therefore reload the list after successful creation.
  */
  if (!data.title && !data.description) {
    const incidents = await apiGetIncidents();
    const created = incidents.find(
      (incident) => String(incident.id) === String(data.id)
    );

    if (created) return created;

    return {
      id: String(data.id ?? ""),
      title: payload.title,
      description: payload.description,
      location: payload.location,
      severity: payload.severity,
      status: "open",
      createdAt: new Date().toISOString(),
      notes: [],
    };
  }

  return normalizeIncident(data);
}

/* GET /api/incidents/:id */
async function apiGetIncidentById(id) {
  if (!CONFIG.USE_REAL_API) {
    await apiDelay();

    const found = MOCK_INCIDENTS.find(
      (incident) => String(incident.id) === String(id)
    );

    if (!found) {
      throw new Error("Incident not found");
    }

    return JSON.parse(JSON.stringify(found));
  }

  /*
    app.py currently has GET /api/incidents but may not have
    GET /api/incidents/<id>. So fetch the list and find the ID.
  */
  const incidents = await apiGetIncidents();

  const found = incidents.find(
    (incident) => String(incident.id) === String(id)
  );

  if (!found) {
    throw new Error("Incident not found");
  }

  return found;
}

/* PATCH /api/incidents/:id */
async function apiUpdateIncident(id, changes) {
  if (!CONFIG.USE_REAL_API) {
    await apiDelay();

    const incident = MOCK_INCIDENTS.find(
      (item) => String(item.id) === String(id)
    );

    if (!incident) {
      throw new Error("Incident not found");
    }

    Object.assign(incident, changes);

    if (changes.status) {
      incident.notes = incident.notes || [];
      incident.notes.push({
        text: `Status changed to "${formatStatus(changes.status)}".`,
        time: new Date().toISOString(),
      });
    }

    return JSON.parse(JSON.stringify(incident));
  }

  const res = await fetch(
    `${CONFIG.API_BASE_URL}/incidents/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(changes),
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to update incident (${res.status})`);
  }

  const data = await res.json();

  /*
    If app.py returns only a message, reload the updated incident
    from the complete incidents list.
  */
  if (!data.title && !data.description) {
    const incidents = await apiGetIncidents();

    const updated = incidents.find(
      (incident) => String(incident.id) === String(id)
    );

    if (!updated) {
      throw new Error("Updated incident could not be loaded");
    }

    return updated;
  }

  return normalizeIncident(data);
}

/* =========================================================
   4. APP STATE
   ========================================================= */
const state = {
  incidents: [],
  loading: false,
  error: null,
  currentView: "dashboard",
  currentIncidentId: null,
  filters: {
    search: "",
    severity: "all",
    status: "all",
    sort: "latest",
  },
  layout: "cards", // "cards" | "table"
};

const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };
const SEVERITY_LABELS = { critical: "Critical", high: "High", medium: "Medium", low: "Low" };
const STATUS_LABELS = { open: "Open", "in-progress": "In Progress", resolved: "Resolved" };

/* =========================================================
   5. RENDERING
   ========================================================= */

function formatStatus(status) {
  return STATUS_LABELS[status] || status;
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function severityBadge(severity) {
  return `<span class="badge badge-${severity}">${SEVERITY_LABELS[severity] || severity}</span>`;
}

function statusBadge(status) {
  return `<span class="badge badge-${status}">${formatStatus(status)}</span>`;
}

function renderStatCards() {
  const total = state.incidents.length;
  const open = state.incidents.filter((i) => i.status === "open").length;
  const critical = state.incidents.filter((i) => i.severity === "critical").length;
  const inProgress = state.incidents.filter((i) => i.status === "in-progress").length;
  const resolved = state.incidents.filter((i) => i.status === "resolved").length;

  const stats = [
    { label: "Total Incidents", value: total, icon: "📋", color: "var(--color-primary)", bg: "var(--color-primary-light)" },
    { label: "Open", value: open, icon: "🚨", color: "var(--color-open)", bg: "var(--color-open-bg)" },
    { label: "Critical", value: critical, icon: "🔥", color: "var(--color-critical)", bg: "var(--color-critical-bg)" },
    { label: "In Progress", value: inProgress, icon: "⏱", color: "var(--color-progress)", bg: "var(--color-progress-bg)" },
    { label: "Resolved", value: resolved, icon: "✅", color: "var(--color-resolved)", bg: "var(--color-resolved-bg)" },
  ];

  const grid = document.getElementById("statGrid");
  grid.innerHTML = stats.map((s) => `
    <div class="stat-card">
      <div class="stat-card-top">
        <span class="stat-label">${s.label}</span>
        <span class="stat-icon" style="background:${s.bg}; color:${s.color};">${s.icon}</span>
      </div>
      <div class="stat-value">${s.value}</div>
    </div>
  `).join("");
}

function renderRecentIncidents() {
  const container = document.getElementById("recentIncidents");
  const recent = [...state.incidents]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  if (recent.length === 0) {
    container.innerHTML = `<p style="color:var(--color-text-muted); font-size:13.5px;">No incidents reported yet.</p>`;
    return;
  }

  const severityColor = {
    critical: "var(--color-critical)", high: "var(--color-high)",
    medium: "var(--color-medium)", low: "var(--color-low)",
  };

  container.innerHTML = recent.map((i) => `
    <div class="recent-item" data-id="${i.id}">
      <span class="recent-item-severity" style="background:${severityColor[i.severity]}"></span>
      <div class="recent-item-body">
        <div class="recent-item-title">${escapeHtml(i.title)}</div>
        <div class="recent-item-meta">${escapeHtml(i.location)} · ${timeAgo(i.createdAt)}</div>
      </div>
      ${statusBadge(i.status)}
    </div>
  `).join("");

  container.querySelectorAll(".recent-item").forEach((el) => {
    el.addEventListener("click", () => openIncidentDetails(el.dataset.id));
  });
}

function renderSeverityOverview() {
  const container = document.getElementById("severityOverview");
  const total = state.incidents.length || 1;
  const levels = ["critical", "high", "medium", "low"];
  const colorVar = {
    critical: "var(--color-critical)", high: "var(--color-high)",
    medium: "var(--color-medium)", low: "var(--color-low)",
  };

  container.innerHTML = levels.map((lvl) => {
    const count = state.incidents.filter((i) => i.severity === lvl).length;
    const pct = Math.round((count / total) * 100);
    return `
      <div class="severity-row">
        <span class="severity-row-label">${SEVERITY_LABELS[lvl]}</span>
        <div class="severity-bar-track">
          <div class="severity-bar-fill" style="width:${pct}%; background:${colorVar[lvl]};"></div>
        </div>
        <span class="severity-row-count">${count}</span>
      </div>
    `;
  }).join("");
}

function renderActivityChart() {
  const container = document.getElementById("activityChart");
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    days.push(d);
  }

  const counts = days.map((day) => {
    const next = new Date(day);
    next.setDate(next.getDate() + 1);
    return state.incidents.filter((inc) => {
      const t = new Date(inc.createdAt).getTime();
      return t >= day.getTime() && t < next.getTime();
    }).length;
  });

  const max = Math.max(...counts, 1);

  container.innerHTML = days.map((day, idx) => {
    const heightPct = Math.max((counts[idx] / max) * 100, counts[idx] > 0 ? 8 : 2);
    const label = day.toLocaleDateString(undefined, { weekday: "short" });
    return `
      <div class="activity-bar-wrap" title="${counts[idx]} incident(s)">
        <div class="activity-bar" style="height:${heightPct}%;"></div>
        <span class="activity-bar-label">${label}</span>
      </div>
    `;
  }).join("");
}

function getFilteredIncidents() {
  const { search, severity, status, sort } = state.filters;
  let result = [...state.incidents];

  if (search.trim()) {
    const q = search.trim().toLowerCase();
    result = result.filter((i) =>
      i.title.toLowerCase().includes(q) ||
      i.description.toLowerCase().includes(q) ||
      i.location.toLowerCase().includes(q)
    );
  }

  if (severity !== "all") result = result.filter((i) => i.severity === severity);
  if (status !== "all") result = result.filter((i) => i.status === status);

  if (sort === "latest") {
    result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else if (sort === "severity") {
    result.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
  }

  return result;
}

function renderIncidentsList() {
  const container = document.getElementById("incidentsContainer");
  const emptyState = document.getElementById("emptyState");
  const resultsMeta = document.getElementById("resultsMeta");
  const filtered = getFilteredIncidents();

  resultsMeta.textContent = `Showing ${filtered.length} of ${state.incidents.length} incidents`;

  if (filtered.length === 0) {
    container.innerHTML = "";
    emptyState.hidden = false;
    return;
  }
  emptyState.hidden = true;

  if (state.layout === "table") {
    container.innerHTML = `
      <div class="table-wrap">
        <table class="incident-table">
          <thead>
            <tr>
              <th>Incident</th>
              <th>Location</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map((i) => `
              <tr>
                <td>
                  <div class="table-title">${escapeHtml(i.title)}</div>
                  <div class="table-desc">${escapeHtml(i.description)}</div>
                </td>
                <td>${escapeHtml(i.location)}</td>
                <td>${severityBadge(i.severity)}</td>
                <td>${statusBadge(i.status)}</td>
                <td>${formatDate(i.createdAt)}</td>
                <td><button class="btn btn-secondary btn-sm" data-id="${i.id}" data-action="view">View</button></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div class="incident-grid">
        ${filtered.map((i) => `
          <div class="incident-card">
            <div class="incident-card-top">
              <span class="incident-card-title">${escapeHtml(i.title)}</span>
              ${severityBadge(i.severity)}
            </div>
            <p class="incident-card-desc">${escapeHtml(i.description)}</p>
            <div class="incident-card-meta">
              <span>📍 ${escapeHtml(i.location)}</span>
              <span>🕒 ${formatDate(i.createdAt)}</span>
            </div>
            <div class="incident-card-footer">
              ${statusBadge(i.status)}
              <button class="btn btn-secondary btn-sm" data-id="${i.id}" data-action="view">View details</button>
            </div>
          </div>
        `).join("")}
      </div>
    `;
  }

  container.querySelectorAll('[data-action="view"]').forEach((btn) => {
    btn.addEventListener("click", () => openIncidentDetails(btn.dataset.id));
  });
}

function renderIncidentDetails(incident) {
  document.getElementById("detailTitle").textContent = incident.title;
  document.getElementById("detailMeta").textContent = `${incident.id} · Reported ${timeAgo(incident.createdAt)}`;
  document.getElementById("detailDescription").textContent = incident.description;
  document.getElementById("detailLocation").textContent = incident.location;
  document.getElementById("detailSeverity").innerHTML = severityBadge(incident.severity);
  document.getElementById("detailStatus").innerHTML = statusBadge(incident.status);
  document.getElementById("detailCreated").textContent = formatDate(incident.createdAt);

  const notesList = document.getElementById("detailNotes");
  if (!incident.notes || incident.notes.length === 0) {
    notesList.innerHTML = `<li style="border-left-color: var(--color-border); color: var(--color-text-muted);">No response notes yet.</li>`;
  } else {
    notesList.innerHTML = [...incident.notes].reverse().map((n) => `
      <li>${escapeHtml(n.text)}<span class="note-time">${formatDate(n.time)}</span></li>
    `).join("");
  }

  document.querySelectorAll(".status-btn").forEach((btn) => {
    btn.classList.toggle("active-status", btn.dataset.status === incident.status);
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

function renderLoading(target) {
  target.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <span>Loading incidents…</span>
    </div>
  `;
}

function renderError(target, message, retryFn) {
  target.innerHTML = `
    <div class="error-state">
      <h3>Something went wrong</h3>
      <p>${escapeHtml(message)}</p>
      <button class="btn btn-secondary" id="retryBtn">Try again</button>
    </div>
  `;
  const retryBtn = document.getElementById("retryBtn");
  if (retryBtn && retryFn) retryBtn.addEventListener("click", retryFn);
}

function renderAll() {
  renderStatCards();
  renderRecentIncidents();
  renderSeverityOverview();
  renderActivityChart();
  renderIncidentsList();
}

/* =========================================================
   6. TOASTS
   ========================================================= */
function showToast(title, message, type = "success") {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = `toast ${type === "error" ? "toast-error" : ""}`;
  toast.innerHTML = `
    <div>
      <div class="toast-title">${escapeHtml(title)}</div>
      <div class="toast-msg">${escapeHtml(message)}</div>
    </div>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.2s ease";
    setTimeout(() => toast.remove(), 200);
  }, 4000);
}

/* =========================================================
   7. VIEW NAVIGATION
   ========================================================= */
function switchView(viewName) {
  state.currentView = viewName;
  document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
  document.getElementById(`view-${viewName}`).classList.add("active");

  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.toggle("active", link.dataset.view === viewName);
  });

  closeSidebar();
  window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
}

function openSidebar() {
  document.getElementById("sidebar").classList.add("open");
  document.getElementById("sidebarOverlay").classList.add("open");
}
function closeSidebar() {
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("sidebarOverlay").classList.remove("open");
}

/* =========================================================
   8. INCIDENT DETAILS FLOW
   ========================================================= */
async function openIncidentDetails(id) {
  state.currentIncidentId = id;
  switchView("details");

  const panel = document.querySelector("#view-details .detail-grid");
  const originalHTML = panel.innerHTML;
  panel.parentElement.querySelector(".panel")?.remove; // no-op guard

  try {
    const incident = await apiGetIncidentById(id);
    renderIncidentDetails(incident);
  } catch (err) {
    showToast("Couldn't load incident", err.message, "error");
    switchView("incidents");
  }
}

async function handleStatusChange(newStatus) {
  if (!state.currentIncidentId) return;
  try {
    const updated = await apiUpdateIncident(state.currentIncidentId, { status: newStatus });
    // reflect change in local state list too
    const idx = state.incidents.findIndex((i) => i.id === updated.id);
    if (idx !== -1) state.incidents[idx] = updated;
    renderIncidentDetails(updated);
    renderAll();
    showToast("Status updated", `Incident marked as "${formatStatus(newStatus)}".`, "success");
  } catch (err) {
    showToast("Update failed", err.message, "error");
  }
}

/* =========================================================
   9. CREATE INCIDENT FORM
   ========================================================= */
function validateForm(data) {
  const errors = {};
  if (!data.title || data.title.trim().length < 3) {
    errors.title = "Title is required (minimum 3 characters).";
  }
  if (!data.description || data.description.trim().length < 10) {
    errors.description = "Please provide a description of at least 10 characters.";
  }
  if (!data.location || data.location.trim().length < 2) {
    errors.location = "Location is required.";
  }
  if (!data.severity) {
    errors.severity = "Please select a severity level.";
  }
  return errors;
}

function clearFormErrors() {
  ["title", "description", "location", "severity"].forEach((field) => {
    const errEl = document.getElementById(`${field}Error`);
    const inputEl = document.getElementById(`${field}Input`);
    if (errEl) errEl.textContent = "";
    if (inputEl) inputEl.classList.remove("invalid");
  });
}

function showFormErrors(errors) {
  Object.entries(errors).forEach(([field, message]) => {
    const errEl = document.getElementById(`${field}Error`);
    const inputEl = document.getElementById(`${field}Input`);
    if (errEl) errEl.textContent = message;
    if (inputEl) inputEl.classList.add("invalid");
  });
}

async function handleCreateIncidentSubmit(e) {
  e.preventDefault();
  clearFormErrors();

  const data = {
    title: document.getElementById("titleInput").value,
    description: document.getElementById("descriptionInput").value,
    location: document.getElementById("locationInput").value,
    severity: document.getElementById("severityInput").value,
  };

  const errors = validateForm(data);
  if (Object.keys(errors).length > 0) {
    showFormErrors(errors);
    showToast("Check the form", "Some required fields need your attention.", "error");
    return;
  }

  const submitBtn = document.getElementById("submitIncidentBtn");
  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting…";

  try {
    const newIncident = await apiCreateIncident(data);
    state.incidents.unshift(newIncident);
    renderAll();
    document.getElementById("incidentForm").reset();
    showToast("Incident reported", `${newIncident.id} has been logged successfully.`, "success");
    switchView("dashboard");
  } catch (err) {
    showToast("Submission failed", err.message, "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit Incident";
  }
}

/* =========================================================
   10. LOAD INCIDENTS (initial + refresh)
   ========================================================= */
async function loadIncidents() {
  state.loading = true;
  const container = document.getElementById("incidentsContainer");
  container.innerHTML = `<div class="skeleton-grid">${'<div class="skeleton-card"></div>'.repeat(6)}</div>`;

  try {
    const incidents = await apiGetIncidents();
    state.incidents = incidents;
    state.error = null;
    renderAll();
  } catch (err) {
    state.error = err.message;
    renderError(container, "We couldn't load incidents right now. Please try again.", loadIncidents);
    showToast("Load failed", err.message, "error");
  } finally {
    state.loading = false;
  }
}

/* =========================================================
   11. EVENT WIRING
   ========================================================= */
function initNavigation() {
  document.querySelectorAll("[data-view]").forEach((link) => {
    link.addEventListener("click", () => switchView(link.dataset.view));
  });
  document.querySelectorAll("[data-goto]").forEach((btn) => {
    btn.addEventListener("click", () => switchView(btn.dataset.goto));
  });

  document.getElementById("sidebarToggle").addEventListener("click", openSidebar);
  document.getElementById("sidebarOverlay").addEventListener("click", closeSidebar);
  document.getElementById("topbarNewIncident").addEventListener("click", () => switchView("create"));
}

function initIncidentsToolbar() {
  document.getElementById("searchInput").addEventListener("input", (e) => {
    state.filters.search = e.target.value;
    renderIncidentsList();
  });
  document.getElementById("filterSeverity").addEventListener("change", (e) => {
    state.filters.severity = e.target.value;
    renderIncidentsList();
  });
  document.getElementById("filterStatus").addEventListener("change", (e) => {
    state.filters.status = e.target.value;
    renderIncidentsList();
  });
  document.getElementById("sortBy").addEventListener("change", (e) => {
    state.filters.sort = e.target.value;
    renderIncidentsList();
  });

  document.getElementById("layoutCards").addEventListener("click", () => {
    state.layout = "cards";
    document.getElementById("layoutCards").classList.add("active");
    document.getElementById("layoutTable").classList.remove("active");
    renderIncidentsList();
  });
  document.getElementById("layoutTable").addEventListener("click", () => {
    state.layout = "table";
    document.getElementById("layoutTable").classList.add("active");
    document.getElementById("layoutCards").classList.remove("active");
    renderIncidentsList();
  });

  document.getElementById("clearFiltersBtn").addEventListener("click", () => {
    state.filters = { search: "", severity: "all", status: "all", sort: "latest" };
    document.getElementById("searchInput").value = "";
    document.getElementById("filterSeverity").value = "all";
    document.getElementById("filterStatus").value = "all";
    document.getElementById("sortBy").value = "latest";
    renderIncidentsList();
  });
}

function initCreateForm() {
  document.getElementById("incidentForm").addEventListener("submit", handleCreateIncidentSubmit);
  document.getElementById("resetFormBtn").addEventListener("click", () => {
    document.getElementById("incidentForm").reset();
    clearFormErrors();
  });
}

function initDetailsView() {
  document.querySelectorAll(".status-btn").forEach((btn) => {
    btn.addEventListener("click", () => handleStatusChange(btn.dataset.status));
  });
}

/* =========================================================
   12. INIT
   ========================================================= */
function init() {
  initNavigation();
  initIncidentsToolbar();
  initCreateForm();
  initDetailsView();
  loadIncidents();
}

document.addEventListener("DOMContentLoaded", init);
