let paymentChartInstance = null;
let eventChartInstance = null;
let departmentChartInstance = null;

function logout() {
  fetch("/api/logout", {
    method: "POST",
    credentials: "include"
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        document.cookie = "connect.sid=; Max-Age=0; path=/;";
        window.location.href = "/chemopen_login.html";
      } else {
        alert("❌ Đăng xuất thất bại.");
      }
    })
    .catch(err => {
      console.error("❌ Lỗi logout:", err);
      alert("❌ Có lỗi xảy ra khi đăng xuất.");
    });
}

let pendingAction = null;

function showConfirm(message, callback, title = "XÁC NHẬN") {
  document.getElementById("confirmMessage").innerHTML = message;
  document.getElementById("confirmTitle").textContent = title;
  pendingAction = callback;
  const modal = new bootstrap.Modal(document.getElementById("confirmModal"));
  modal.show();
}

document.addEventListener("DOMContentLoaded", () => {
  const confirmBtn = document.getElementById("confirmBtn");
  if (confirmBtn) {
    confirmBtn.addEventListener("click", () => {
      if (typeof pendingAction === "function") pendingAction();
      bootstrap.Modal.getInstance(document.getElementById("confirmModal"))?.hide();
    });
  }

  // Gắn filter một lần duy nhất
  document.getElementById("searchInput").addEventListener("input", filterTable);
  document.getElementById("statusFilter").addEventListener("change", filterTable);

  fetchAndRenderData();
});

// Kích hoạt tab theo hash
function activateTabByHash(hash) {
  const tabTrigger = document.querySelector(`.nav-tabs a[href="${hash}"]`);
  if (tabTrigger) {
    new bootstrap.Tab(tabTrigger).show();
  }
}

document.querySelectorAll(".nav-tabs a").forEach(tab => {
  tab.addEventListener("shown.bs.tab", e => {
    const hash = e.target.getAttribute("href");
    history.replaceState(null, null, hash);
    activateTabByHash(hash);
  });
});

window.addEventListener("load", () => {
  activateTabByHash(window.location.hash || "#overview");
});

// Socket.IO cập nhật
const socket = io();
socket.on("payment-updated", ({ mssv, status }) => {
  const rows = document.querySelectorAll("#dataTable tbody tr");
  rows.forEach(row => {
    if (row.children[1].textContent === mssv) {
      row.children[9].textContent = status;
      row.children[9].className = "status " + status;
    }
  });
  fetchAndRenderData();
});

// Hàm chính load dữ liệu
function fetchAndRenderData() {
  fetch("/api/registrations", {
    method: "GET",
    credentials: "include"
  })
    .then(res => res.json())
    .then(data => {
      let paid = 0, pending = 0, failed = 0;
      const tbody = document.querySelector("#dataTable tbody");
      tbody.innerHTML = "";

      data.forEach((reg, i) => {
        if (reg.paymentStatus === "paid") paid++;
        else if (reg.paymentStatus === "pending") pending++;
        else if (reg.paymentStatus === "failed") failed++;

        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${i + 1}</td>
          <td>${reg.mssv}</td>
          <td>${reg.fullName}</td>
          <td>${reg.email}</td>
          <td>${reg.phone}</td>
          <td>${reg.gender || "-"}</td>
          <td>${reg.khoa}</td>
          <td>${reg.lop}</td>
          <td>${reg.noidung?.join(" + ") || "-"}</td>
          <td>${reg.paymentMethod === "paypal" ? "PayPal" : "Chuyển khoản"}</td>
          <td>${reg.paymentStatus}</td>
          <td>
            <div class="btn-group">
              <button class="btn btn-sm btn-primary resend-email" data-code="${reg.paymentCode}" title="Gửi lại email xác nhận" ${reg.paymentStatus !== 'paid' ? 'disabled' : ''}>
                <i class="fa-solid fa-envelope"></i>
              </button>
              <button class="btn btn-sm btn-danger delete-entry" data-id="${reg.mssv}">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </td>

        `;
        tbody.appendChild(row);
      });

      const partnerTbody = document.querySelector("#partnerTable tbody");
      partnerTbody.innerHTML = "";

      let partnerIndex = 1;
      data.forEach(reg => {
        if (reg.partnerInfo?.fullName || reg.partnerInfo?.mssv) {
          const row = document.createElement("tr");
          row.innerHTML = `
            <td>${partnerIndex++}</td>
            <td>${reg.fullName}</td>
            <td>${reg.partnerInfo.fullName || "-"}</td>
            <td>${reg.partnerInfo.mssv || "-"}</td>
            <td>${reg.partnerInfo.email || "-"}</td>
            <td>${reg.partnerInfo.phone || "-"}</td>
            <td>${reg.partnerInfo.gender || "-"}</td>
            <td>${reg.partnerInfo.khoa || "-"}</td>
            <td>${reg.partnerInfo.lop || "-"}</td>
          `;
          partnerTbody.appendChild(row);
        }
      });

      attachDeleteHandlers();
      attachResendHandlers();


      document.getElementById("paidCount").textContent = paid;
      document.getElementById("pendingCount").textContent = pending;
      document.getElementById("failedCount").textContent = failed;
      let total = data.length; // người đăng ký chính

      data.forEach(reg => {
        if (reg.partnerInfo?.fullName || reg.partnerInfo?.mssv) {
          total += 1; // có đồng đội -> +1
        }
      });

      document.getElementById("totalParticipants").textContent = total;


      // Destroy biểu đồ cũ nếu có
      if (paymentChartInstance) paymentChartInstance.destroy();

      paymentChartInstance = new Chart(document.getElementById("paymentChart"), {
        type: "doughnut",
        data: {
          labels: ["Đã thanh toán", "Chờ thanh toán", "Thất bại"],
          datasets: [{
            data: [paid, pending, failed],
            backgroundColor: ["#28a745", "#ffc107", "#dc3545"]
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { position: "bottom" } }
        }
      });

      // Thống kê số lượng theo khoa
      const DEPARTMENT_COLORS = {
        "Hóa học": "#007bff",                // Xanh dương
        "Sinh học": "#28a745",               // Xanh lá
        "Vật lý - Vật lý kỹ thuật": "#dc3545", // Đỏ
        "Toán - Tin học": "#ffc107",         // Vàng
        "Công nghệ Thông tin": "#6f42c1",    // Tím
        "Môi trường": "#20c997",             // Xanh ngọc
        "Địa chất": "#fd7e14",               // Cam
        "Khoa học và vật liệu": "#17a2b8",   // Xanh biển
        "Điện tử viễn thông": "#e83e8c"      // Hồng
      };

      const departmentStats = {};

      // Gộp người chính và đồng đội
      data.forEach(reg => {
        departmentStats[reg.khoa] = (departmentStats[reg.khoa] || 0) + 1;
        if (reg.partnerInfo?.khoa) {
          departmentStats[reg.partnerInfo.khoa] = (departmentStats[reg.partnerInfo.khoa] || 0) + 1;
        }
      });

      // Lấy labels và values
      const departmentLabels = Object.keys(departmentStats);
      const departmentValues = Object.values(departmentStats);
      const departmentColors = departmentLabels.map(khoa => DEPARTMENT_COLORS[khoa] || "#999"); // fallback màu xám

      if (departmentChartInstance) departmentChartInstance.destroy();

      departmentChartInstance = new Chart(document.getElementById("departmentChart"), {
        type: "doughnut",
        data: {
          labels: departmentLabels,
          datasets: [{
            data: departmentValues,
            backgroundColor: departmentColors
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: "bottom" },
            title: {
              display: true,
              text: "Thống kê số lượng theo Khoa"
            }
          }
        }
      });



      const eventStats = {};
      data.forEach(reg => {
        const types = reg.noidung || [];
        types.forEach(type => {
          eventStats[type] = (eventStats[type] || 0) + 1;
        });
        const partner = reg.partnerInfo;
        if (partner && partner.noidung) {
          partner.noidung.forEach(type => {
            eventStats[type] = (eventStats[type] || 0) + 1;
          });
        }
      });
      

      if (eventChartInstance) eventChartInstance.destroy();

      eventChartInstance = new Chart(document.getElementById("eventChart"), {
        type: "bar",
        data: {
          labels: Object.keys(eventStats),
          datasets: [{
            label: "Số lượng đăng ký",
            data: Object.values(eventStats),
            backgroundColor: "#007bff"
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true } }
        }
      });
    });
}

async function loadDrawData() {
  const res = await fetch('/api/admin/draw-results'); // cần tạo API này
  const data = await res.json();

  const tbody = document.querySelector('#drawTable tbody');
  tbody.innerHTML = '';
  data.forEach((user, index) => {
    const drawResult = Object.entries(user.drawResult || {})
      .map(([event, code]) => `${event}: <strong>${code}</strong>`)
      .join('<br>');

    tbody.innerHTML += `
      <tr>
        <td>${index + 1}</td>
        <td>${user.fullName}</td>
        <td>${user.mssv}</td>
        <td>${user.paymentCode}</td>
        <td>${user.noidung.join(', ')}</td>
        <td>${drawResult}</td>
      </tr>
    `;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const tabDraws = document.querySelector('a[href="#draws"]');
  if (tabDraws) {
    tabDraws.addEventListener('click', loadDrawData);
  }
});

function filterTable() {
  const search = document.getElementById("searchInput").value.toLowerCase();
  const status = document.getElementById("statusFilter").value;
  const rows = document.querySelectorAll("#dataTable tbody tr");

  rows.forEach(row => {
    const text = row.innerText.toLowerCase();
    const rowStatus = row.children[9].innerText.toLowerCase();
    row.style.display = (text.includes(search) && (status === "" || rowStatus === status)) ? "" : "none";
  });
}

function attachDeleteHandlers() {
  document.querySelectorAll(".delete-entry").forEach(btn => {
    btn.addEventListener("click", () => {
      const mssv = btn.getAttribute("data-id");
      showConfirm(`BẠN CÓ CHẮC CHẮN MUỐN XOÁ ĐƠN ĐĂNG KÝ CỦA ${mssv} KHÔNG?`, () => {
        fetch(`/api/delete-registration?mssv=${encodeURIComponent(mssv)}`, {
          method: "DELETE"
        })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              fetchAndRenderData(); // Load lại bảng
              showToast("✅ Đã xoá đơn đăng ký!", "success"); // ✅ Hiện toast
            } else {
              showToast("❌ Không xoá được đơn.", "error");
            }
          })
          .catch(err => {
            console.error("❌ Lỗi xoá đơn:", err);
            showToast("❌ Có lỗi xảy ra!", "error");
          });
      });
    });
  });
}

function attachResendHandlers() {
  document.querySelectorAll(".resend-email").forEach(btn => {
    btn.addEventListener("click", async () => {
      const paymentCode = btn.getAttribute("data-code");
      const confirmMsg = `Gửi lại email xác nhận cho mã thanh toán ${paymentCode}?`;

      showConfirm(confirmMsg, async () => {
        try {
          const res = await fetch("/api/resend-mail", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentCode })
          });

          const data = await res.json();

          if (data.success) {
            showToast(data.message || "📧 Đã gửi lại email xác nhận!", "success");
          } else {
            showToast("❌ Không thể gửi lại email: " + (data.message || "Lỗi không rõ."), "error");
          }
        } catch (err) {
          console.error("❌ Lỗi gửi lại email:", err);
          showToast("❌ Có lỗi khi gửi email.", "error");
        }
      });
    });
  });
}


function showToast(message, type = "success") {
  const toastContainer = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;

  const progress = document.createElement("div");
  progress.className = "toast-progress";
  toast.appendChild(progress);

  toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

async function renderMatchUpdateTable() {
  try {
    const res = await fetch("/api/matches", { credentials: "include" });
    const matches = await res.json();

    const tbody = document.getElementById("updateMatchTableBody");
    tbody.innerHTML = "";

    matches.forEach((match, index) => {
      const row = document.createElement("tr");
      const formattedTime = formatDateTime(match.time);
      row.innerHTML = `
          <td>${index + 1}</td>
          <td>${formattedTime}</td>
          <td><input class="form-control form-control-sm" value="${match.location || ''}" data-field="location"></td>
          <td>${match.event}</td>
          <td>${match.team1}</td>
          <td>${match.team2}</td>
          <td><input class="form-control form-control-sm" value="${match.set1 || ""}" data-field="set1"></td>
          <td><input class="form-control form-control-sm" value="${match.set2 || ""}" data-field="set2"></td>
          <td><input class="form-control form-control-sm" value="${match.set3 || ""}" data-field="set3"></td>
          <td><input class="form-control form-control-sm" value="${match.total || ""}" data-field="total"></td>
          <td>
            <select class="form-select form-select-sm" data-field="status">
              <option${match.status === "Sắp bắt đầu" ? " selected" : ""}>Sắp bắt đầu</option>
              <option${match.status === "Đang diễn ra" ? " selected" : ""}>Đang diễn ra</option>
              <option${match.status === "Đã kết thúc" ? " selected" : ""}>Đã kết thúc</option>
            </select>
          </td>
          <td>
            <button class="btn btn-sm btn-success" onclick="saveMatch('${match._id}', this)">Lưu</button>
            <button class="btn btn-sm btn-danger ms-1" onclick="deleteMatch('${match._id}')">
              <i class="fa-solid fa-trash"></i>
            </button>
          </td>
        `;
      tbody.appendChild(row);
    });
  } catch (err) {
    console.error("❌ Lỗi tải dữ liệu trận đấu:", err);
  }
}

function formatDateTime(datetimeStr) {
  const { DateTime } = luxon;
  if (!datetimeStr) return "-";

  const dt = DateTime.fromISO(datetimeStr, { zone: "utc" }).setZone("Asia/Ho_Chi_Minh");

  const weekdays = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
  const weekday = weekdays[dt.weekday % 7]; // Luxon: 1=Monday → %7 để map về đúng chỉ số

  return `${weekday}, ${dt.toFormat("dd/MM/yyyy - HH:mm")}`;
}

function saveMatch(id, button) {
  const row = button.closest("tr");
  const inputs = row.querySelectorAll("input, select");

  const body = {};
  let dateStr = "", timeStr = "";

  inputs.forEach(input => {
    const field = input.getAttribute("data-field");

    if (field === "date") dateStr = input.value;
    else if (field === "time") timeStr = input.value;
    else body[field] = input.value;
  });

  if (dateStr && timeStr) {
  body.time = `${dateStr} ${timeStr}`; // lưu chuỗi
}

  fetch(`/api/update-match/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body)
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        showToast("✅ Đã lưu trận đấu.", "success");
      } else {
        showToast("❌ Lỗi lưu.", "error");
      }
    })
    .catch(err => {
      console.error("❌ Lỗi gửi request:", err);
      showToast("❌ Lỗi khi gửi dữ liệu.", "error");
    });
}

document.addEventListener("DOMContentLoaded", () => {
  const tabMatchUpdate = document.querySelector('a[href="#match-update"]');
  if (tabMatchUpdate) {
    tabMatchUpdate.addEventListener('click', renderMatchUpdateTable);
  }
  renderMatchUpdateTable();
});

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await checkUserRole(); // ✅ Đảm bảo đã xác thực xong trước khi render giao diện
    fetchAndRenderData();  // ✅ Gọi sau khi đã xác thực role
    renderMatchUpdateTable(); // ✅ Nếu cần, cũng gọi sau role
  } catch (err) {
    console.error("❌ Lỗi khi load ban đầu:", err);
    window.location.href = "/dang-nhap"; // fallback
  }
});

async function loadUserList() {
  try {
    const res = await fetch("/api/users", { credentials: "include" });
    const users = await res.json();
    const tbody = document.querySelector("#userTable tbody");
    tbody.innerHTML = "";

    users.forEach(user => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${user.email}</td>
        <td>${user.username}</td>
        <td>
          <select class="form-select form-select-sm user-role-select" data-id="${user._id}" ${user.role === "superadmin" ? "disabled" : ""}>
            <option value="collab" ${user.role === "collab" ? "selected" : ""}>collab</option>
            <option value="admin" ${user.role === "admin" ? "selected" : ""}>admin</option>
            <option value="superadmin" ${user.role === "superadmin" ? "selected" : ""}>superadmin</option>
          </select>
        </td>
        <td>${user.fullName || "-"}</td>
        <td>${user.mssv || "-"}</td>
        <td>${user.pending ? "Chờ duyệt" : "Đã duyệt"}</td>
        <td>${user.active ? "Đang hoạt động" : "Đã đăng xuất"}</td>
       <td>
        ${user.pending
          ? `<button class="btn btn-sm btn-success" onclick="approveUser('${user._id}')">
              <i class="fa-solid fa-check me-1"></i> Duyệt
            </button>
             <button class="btn btn-sm btn-secondary" onclick="rejectUser('${user._id}')">
              <i class="fa-solid fa-xmark me-1"></i> Không duyệt
            </button>
    ` : ""}
        <button class="btn btn-sm btn-danger" onclick="forceLogoutUser('${user._id}')">
          <i class="fa-solid fa-power-off me-1"></i> Đăng xuất
        </button>
       </td>
      `;
      tbody.appendChild(row);
    });

    // 🔄 Gắn sự kiện sau khi tạo xong DOM
    document.querySelectorAll(".user-role-select").forEach(select => {
      select.addEventListener("change", async () => {
        const userId = select.getAttribute("data-id");
        const newRole = select.value;
        try {
          const res = await fetch(`/api/change-role/${userId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ role: newRole })
          });
          const data = await res.json();
          if (data.success) {
            showToast("✅ Đã cập nhật vai trò.");
          } else {
            showToast("❌ Không thể cập nhật vai trò.");
          }
        } catch (err) {
          showToast("❌ Lỗi khi cập nhật vai trò.", "error");
        }
      });
    });

  } catch (err) {
    console.error("Lỗi tải danh sách người dùng:", err);
  }
}


async function forceLogoutUser(userId) {
  if (!confirm("Bạn chắc chắn muốn đăng xuất người dùng này?")) return;

  try {
    const res = await fetch(`/api/logout/${userId}`, {
      method: "POST",
      credentials: "include"
    });
    const data = await res.json();
    showToast(data.success ? "✅ Đã đăng xuất người dùng." : "❌ Không thể đăng xuất.");
    loadUserList();
  } catch (err) {
    showToast("❌ Lỗi máy chủ.", "error");
  }
}

async function checkUserRole() {
  try {
    const res = await fetch("/api/me", { credentials: "include" });
    const data = await res.json();

    if (!data.success || !data.user || data.user.active === false) {
      return window.location.href = "/dang-nhap"; // chưa đăng nhập
    }

    const { role, fullName, username } = data.user;

    document.getElementById("userGreeting").textContent = `👋 Xin chào, ${fullName || username}`;
    document.getElementById("userRole").textContent = `👤 Vai trò: ${role}`;

    const socket = io();
    socket.emit("join-room", data.user._id); // _id là userId
    socket.on("force-logout", () => {
      alert("🔒 Bạn đã bị đăng xuất khỏi hệ thống.");
      window.location.href = "/dang-nhap";
    });
      socket.on("user-status-updated", ({ userId, active }) => {
      const rows = document.querySelectorAll("#userTable tbody tr");

      rows.forEach(row => {
        const idCell = row.querySelector("select[data-id]");
        if (idCell?.getAttribute("data-id") === userId) {
          const statusCell = row.children[6]; // cột thứ 7 là trạng thái hoạt động
          statusCell.textContent = active ? "Đang hoạt động" : "Đã đăng xuất";
          statusCell.className = active ? "text-success" : "text-muted";
        }
      });
    });

    const dashboard = document.getElementById("dashboardContainer");
    if (dashboard) dashboard.style.display = "block";

    if (role === "collab") {
      hideTabsExcept(["match-update"]);
    } else if (role === "admin") {
      hideTabsExcept(["overview", "list", "partner", "draws", "match-update"]);
    } else if (role === "superadmin") {
      // superadmin xem tất cả tab
    } else {
      alert("❌ Bạn không có quyền truy cập.");
      return window.location.href = "/dang-nhap";
    }

    if (role === "admin" || role === "superadmin") {
      document.getElementById("createMatchWrapper").style.display = "block";
    }

  } catch (err) {
    console.error("❌ Lỗi khi kiểm tra vai trò:", err);
    window.location.href = "/dang-nhap";
  }
}
function hideTabsExcept(allowedIds = []) {
  if (!Array.isArray(allowedIds)) {
    console.warn("⚠️ allowedIds không hợp lệ, đang gán mảng rỗng thay thế.");
    allowedIds = [];
  }

  const allTabs = document.querySelectorAll("#adminTabs .nav-link");
  allTabs.forEach(tab => {
    const href = tab.getAttribute("href");
    if (!href) return;

    const target = href.replace("#", "");
    if (!allowedIds.includes(target)) {
      tab.parentElement.style.display = "none";
      const tabContent = document.getElementById(target);
      if (tabContent) tabContent.style.display = "none";
    }
  });
}
function showCreateMatchModal() {
  const modal = new bootstrap.Modal(document.getElementById("createMatchModal"));
  modal.show();
}

async function createMatch(event) {
  event.preventDefault();
  const form = document.getElementById("createMatchForm");
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  const datetime = `${data.date}T${data.time}`;
  const payload = {
    event: data.event,
    time: datetime,
    location: data.location,
    team1: data.team1,
    team2: data.team2
  };

  try {
    const res = await fetch("/api/create-match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (result.success) {
      showToast("✅ Đã tạo trận đấu", "success");
      bootstrap.Modal.getInstance(document.getElementById("createMatchModal")).hide();
      renderMatchUpdateTable(); // Refresh danh sách
    } else {
      showToast("❌ " + result.message, "error");
    }
  } catch (err) {
    console.error("❌ Lỗi tạo trận:", err);
    showToast("❌ Lỗi khi tạo trận đấu", "error");
  }
}

async function deleteMatch(matchId) {
  if (!confirm("❌ Bạn có chắc muốn xoá trận đấu này không?")) return;

  try {
    const res = await fetch(`/api/delete-match/${matchId}`, {
      method: "DELETE",
      credentials: "include"
    });
    const data = await res.json();
    if (data.success) {
      showToast("✅ Đã xoá trận đấu.", "success");
      renderMatchUpdateTable(); // Refresh bảng
    } else {
      showToast("❌ Không xoá được trận đấu.", "error");
    }
  } catch (err) {
    console.error("❌ Lỗi khi xoá trận đấu:", err);
    showToast("❌ Lỗi máy chủ khi xoá trận đấu.", "error");
  }
}


document.getElementById("changePasswordForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    const currentPassword = document.getElementById("currentPassword").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const msgBox = document.getElementById("changePasswordMessage");

    if (newPassword !== confirmPassword) {
      msgBox.innerHTML = `<div class='alert alert-warning'>Mật khẩu mới không khớp.</div>`;
      return;
    }

    try {
      const res = await fetch("/api/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        msgBox.innerHTML = `<div class='alert alert-success'>${data.message}</div>`;
      } else {
        msgBox.innerHTML = `<div class='alert alert-danger'>${data.message}</div>`;
      }
    } catch (err) {
      msgBox.innerHTML = `<div class='alert alert-danger'>Đã xảy ra lỗi khi đổi mật khẩu.</div>`;
    }
  });

  async function approveUser(userId) {
  if (!confirm("Bạn chắc chắn muốn duyệt tài khoản này?")) return;

  try {
    const res = await fetch(`/api/approve-user/${userId}`, {
      method: "PUT",
      credentials: "include"
    });
    const data = await res.json();
    if (data.success) {
      showToast("✅ Đã duyệt tài khoản!", "success");
      loadUserList();
    } else {
      showToast("❌ Không duyệt được tài khoản.", "error");
    }
  } catch (err) {
    console.error("❌ Lỗi duyệt tài khoản:", err);
    showToast("❌ Lỗi máy chủ khi duyệt tài khoản.", "error");
  }
}
async function rejectUser(userId) {
  if (!confirm("Bạn có chắc muốn không duyệt và xoá tài khoản này khỏi hệ thống?")) return;

  try {
    const res = await fetch(`/api/reject-user/${userId}`, {
      method: "DELETE",
      credentials: "include"
    });
    const data = await res.json();
    showToast(data.success ? "✅ Đã xoá tài khoản." : "❌ Không thể xoá.", data.success ? "success" : "error");
    if (data.success) loadUserList();
  } catch (err) {
    console.error("❌ Lỗi khi xoá tài khoản:", err);
    showToast("❌ Lỗi máy chủ khi xoá tài khoản.", "error");
  }
}


function togglePassword(icon) {
  const wrapper = icon.closest(".password-wrapper");
  const input = wrapper?.querySelector("input");
  if (!input) return;

  if (input.type === "password") {
    input.type = "text";
    icon.classList.remove("fa-eye");
    icon.classList.add("fa-eye-slash");
  } else {
    input.type = "password";
    icon.classList.remove("fa-eye-slash");
    icon.classList.add("fa-eye");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const tabUser = document.querySelector('a[href="#user-management"]');
  if (tabUser) {
    tabUser.addEventListener('click', loadUserList);
  }
  if (window.location.hash === "#user-management") {
      loadUserList();
  }
});