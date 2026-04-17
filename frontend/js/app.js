// Configuration
const API_BASE_URL =
  localStorage.getItem("apiUrl") || "http://localhost:3000/api";
let currentFilter = "all";

// Initialize app
document.addEventListener("DOMContentLoaded", () => {
  loadReports();
  setupFormSubmit();
});

// Setup form submission
function setupFormSubmit() {
  const form = document.getElementById("reportForm");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const title = document.getElementById("title").value;
    const description = document.getElementById("description").value;
    const location = document.getElementById("location").value;
    const latitude = document.getElementById("latitude").value;
    const longitude = document.getElementById("longitude").value;

    if (!title || !description || !location) {
      showMessage("Judul, deskripsi, dan lokasi harus diisi!", "error");
      return;
    }

    try {
      formData.set("title", title);
      formData.set("description", description);
      formData.set("location", location);
      if (latitude) formData.set("latitude", latitude);
      if (longitude) formData.set("longitude", longitude);

      const response = await fetch(`${API_BASE_URL}/report`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        showMessage("Laporan berhasil dibuat!", "success");
        form.reset();
        setTimeout(() => {
          document.getElementById("title").value = "";
          document.getElementById("description").value = "";
          document.getElementById("location").value = "";
          document.getElementById("latitude").value = "";
          document.getElementById("longitude").value = "";
          document.getElementById("image").value = "";
        }, 1500);
        loadReports();
      } else {
        showMessage(`Error: ${result.message}`, "error");
      }
    } catch (error) {
      console.error("Error:", error);
      showMessage(`Error: ${error.message}`, "error");
    }
  });
}

// Load reports from API
async function loadReports() {
  try {
    const response = await fetch(`${API_BASE_URL}/reports`);
    const result = await response.json();

    if (result.success) {
      displayReports(result.data);
    } else {
      document.getElementById("reportsList").innerHTML =
        '<p class="loading">Gagal memuat laporan</p>';
    }
  } catch (error) {
    console.error("Error loading reports:", error);
    document.getElementById("reportsList").innerHTML =
      '<p class="loading">Error: Gagal terhubung ke server</p>';
  }
}

// Display reports in grid
function displayReports(reports) {
  const reportsList = document.getElementById("reportsList");

  if (!reports || reports.length === 0) {
    reportsList.innerHTML = '<p class="loading">Belum ada laporan</p>';
    return;
  }

  reportsList.innerHTML = reports
    .map(
      (report) => `
        <div class="report-card" onclick="viewReportDetails('${report.id}')">
            ${report.image_url ? `<img src="${report.image_url}" alt="Report" class="report-image">` : '<div class="report-image" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center;"><span style="color: white; font-size: 3rem;">📸</span></div>'}
            <div class="report-body">
                <h3 class="report-title">${escapeHtml(report.title)}</h3>
                <p class="report-location">📍 ${escapeHtml(report.location)}</p>
                <p class="report-description">${escapeHtml(report.description)}</p>
                <div class="report-footer">
                    <span class="report-status status-${report.status}">${formatStatus(report.status)}</span>
                    <span class="report-date">${formatDate(report.created_at)}</span>
                </div>
            </div>
        </div>
    `,
    )
    .join("");
}

// View report details in modal
async function viewReportDetails(reportId) {
  try {
    const response = await fetch(`${API_BASE_URL}/report/${reportId}`);
    const result = await response.json();

    if (result.success) {
      const report = result.data;
      const detailHtml = `
                <h2 class="modal-detail-title">${escapeHtml(report.title)}</h2>
                ${report.image_url ? `<img src="${report.image_url}" alt="Report" class="modal-detail-image">` : ""}
                
                <div class="modal-detail-row">
                    <div class="modal-detail-label">Status</div>
                    <div class="modal-detail-value">
                        <span class="report-status status-${report.status}">${formatStatus(report.status)}</span>
                    </div>
                </div>

                <div class="modal-detail-row">
                    <div class="modal-detail-label">Lokasi</div>
                    <div class="modal-detail-value">📍 ${escapeHtml(report.location)}</div>
                </div>

                ${
                  report.latitude && report.longitude
                    ? `
                <div class="modal-detail-row">
                    <div class="modal-detail-label">Koordinat</div>
                    <div class="modal-detail-value">${report.latitude.toFixed(6)}, ${report.longitude.toFixed(6)}</div>
                </div>
                `
                    : ""
                }

                <div class="modal-detail-row">
                    <div class="modal-detail-label">Deskripsi</div>
                    <div class="modal-detail-value">${escapeHtml(report.description)}</div>
                </div>

                <div class="modal-detail-row">
                    <div class="modal-detail-label">Tanggal Dibuat</div>
                    <div class="modal-detail-value">${formatDateTime(report.created_at)}</div>
                </div>

                <div class="modal-detail-row">
                    <div class="modal-detail-label">Terakhir Diubah</div>
                    <div class="modal-detail-value">${formatDateTime(report.updated_at)}</div>
                </div>

                <div class="modal-detail-row">
                    <div class="modal-detail-label">ID Laporan</div>
                    <div class="modal-detail-value" style="font-family: monospace; font-size: 0.85rem;">${report.id}</div>
                </div>
            `;

      document.getElementById("reportDetail").innerHTML = detailHtml;
      document.getElementById("reportModal").classList.add("show");
    }
  } catch (error) {
    console.error("Error loading report details:", error);
    alert("Gagal memuat detail laporan");
  }
}

// Close modal
function closeModal() {
  document.getElementById("reportModal").classList.remove("show");
}

// Filter reports
function filterReports(status) {
  currentFilter = status;

  // Update active button
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.classList.remove("active");
  });
  event.target.classList.add("active");

  // Reload and filter
  loadReports();
}

// Show message
function showMessage(message, type) {
  const messageEl = document.getElementById("submitMessage");
  messageEl.textContent = message;
  messageEl.className = type;
  messageEl.style.display = "block";

  setTimeout(() => {
    messageEl.style.display = "none";
  }, 4000);
}

// Show section
function showSection(sectionId) {
  document.querySelectorAll(".section").forEach((section) => {
    section.style.display = "none";
  });
  document.getElementById(sectionId).style.display = "block";

  if (sectionId === "reports-section") {
    loadReports();
  }
}

// Utility functions
function formatStatus(status) {
  const statusMap = {
    pending: "⏳ Pending",
    diproses: "⚙️ Diproses",
    selesai: "✅ Selesai",
  };
  return statusMap[status] || status;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Close modal when clicking outside
window.onclick = function (event) {
  const modal = document.getElementById("reportModal");
  if (event.target === modal) {
    modal.classList.remove("show");
  }
};
