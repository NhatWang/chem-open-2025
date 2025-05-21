let paymentChartInstance = null;
let eventChartInstance = null;

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

      const eventStats = {};
      data.forEach(reg => {
        const types = reg.noidung || [];
        types.forEach(type => {
          eventStats[type] = (eventStats[type] || 0) + 1;
        });
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
    btn.addEventListener("click", () => {
      const paymentCode = btn.getAttribute("data-code");
      showConfirm(`Gửi lại email xác nhận cho mã thanh toán ${paymentCode}?`, () => {
        fetch("/api/resend-mail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentCode })
        })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              showToast("📧 Đã gửi lại email xác nhận!", "success");
            } else {
              showToast("❌ Không thể gửi lại email: " + data.message, "error");
            }
          })
          .catch(err => {
            console.error("❌ Lỗi gửi lại email:", err);
            showToast("❌ Có lỗi khi gửi email.", "error");
          });
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