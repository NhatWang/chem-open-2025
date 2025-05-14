const tips = [
  "🔄 Chào bạn! Hệ thống đang khởi động...",
  "Đang tải dữ liệu...",
  "Hệ thống đang khởi động...",
  "Chuẩn bị sẵn sàng tra cứu điểm...",
  "Gần xong rồi, cảm ơn bạn đã đợi!"
];

window.addEventListener("load", function () {
  const overlay = document.getElementById("loadingOverlay");
  if (overlay) {
    setTimeout(() => {
      overlay.style.display = "none";
    }, 10000);
  }

  const container = document.querySelector(".container");
  const logoContainer = document.querySelector(".logo-container");

  if (container) container.classList.add("fade-in");
  if (logoContainer) logoContainer.classList.add("slide-in");
});

let index = 0;
  const text = document.querySelector(".loading-text");
  if (text) {
    text.textContent = tips[0];
    setInterval(() => {
      index = (index + 1) % tips.length;
      text.textContent = tips[index];
    }, 2000);
  }

let traCuuKetQua = null;

// Hàm chính để tra cứu điểm
function traCuuDiem() {
  const sbd = document.getElementById("sbd").value.trim();
  const msv = document.getElementById("msv").value.trim();

  if (!sbd || !msv) {
    openModal(`<p class="fail">⚠️ Vui lòng nhập đủ SBD và MSSV</p>`);
    return;
  }

  fetch("/api/tra-cuu", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sbd, msv }),
  })
    .then((res) => res.json())
    .then((data) => {
      console.log("✅ Dữ liệu API:", data)
      if (data.success) {
        const { ten,
                diem,
                msv, 
                sbd, 
                xepHang, 
                tongSoNguoi,
                fileGiayChungNhan
               } = data.data;

        let thongBao = "";
        let diemHienThi = "Vắng";
        let hangXep = "";

        // ✅ Chỉ xử lý nếu có điểm
        if (typeof diem === "number" && !isNaN(diem)) {
          diemHienThi = diem;
          if (diem >= 450) {
            thongBao = `<p class="success">✅ Đủ điều kiện được cấp giấy chứng nhận</p>`;
          
            // ✅ Thêm nút nếu có file nhận về từ API
            if (fileGiayChungNhan) {
              thongBao += `
                <div class="btn-cert-wrapper">
                  <a href="${fileGiayChungNhan}" target="_blank" class="btn-cert">
                    🎓 Xem Giấy Chứng Nhận
                  </a>
                  <button onclick="openRegisterModal()" class="btn-cert" style="background-color: #ffc107; margin-left: 12px;">
                    ✉️ Nhận bản cứng
                  </button>
                </div>
              `;
            } else {
              // Để debug nếu không thấy file:
              console.warn("⚠️ Không tìm thấy fileGiayChungNhan cho SBD:", sbd);
            }
          
            // Confetti 🎉
            confetti({
              particleCount: 100,
              spread: 150,
              origin: { y: 0.6 }
            });
          } else {
            thongBao = `<p class="fail">📘 Bạn hãy cố gắng ôn tập nhé!</p>`;
          }

          // ✅ Chỉ hiển thị xếp hạng nếu có điểm
          hangXep = `<p><strong>Xếp hạng:</strong> ${xepHang} / ${tongSoNguoi}</p>`;
        }

        // ✅ Hiển thị kết quả trong modal
        openModal(`
          <p><strong>Họ và tên:</strong> ${ten}</p>
          <p><strong>Mã số sinh viên:</strong> ${msv}</p>
          <p><strong>Số báo danh:</strong> ${sbd}</p>
          <p><strong>Điểm:</strong> ${diemHienThi}</p> 
          ${hangXep}
          ${thongBao}
        `);

        traCuuKetQua = { ten, msv }; // ✅ Lưu thông tin để so sánh khi đăng ký

      } else {
        openModal(`<p class="fail">${data.message}</p>`);
      }
    })
    .catch((err) => {
      console.error("Lỗi khi gọi API:", err);
      openModal(`<p class="fail">Đã xảy ra lỗi khi tra cứu.</p>`);
    });
}

// Hàm mở modal
function openModal(noiDungHTML) {
  const modal = document.getElementById("modalKetQua");
  const modalBody = document.getElementById("modalBody");
  modalBody.innerHTML = noiDungHTML;
  modal.style.display = "flex";
}

// Hàm đóng modal
function closeModal() {
  const modal = document.getElementById("modalKetQua");
  if (modal) {
    modal.style.display = "none";
  }
}

// Đóng modal khi click ra ngoài
window.addEventListener("click", function (event) {
  const modal = document.getElementById("modalKetQua");
  if (event.target === modal) {
    modal.style.display = "none";
  }
});

document.addEventListener("DOMContentLoaded", function () {
  // 1. Xử lý nhấn Enter
  const sbdInput = document.getElementById("sbd");
  const msvInput = document.getElementById("msv");

  const msvTraCuuInput = document.getElementById("msvTraCuuTrangThai");
  const fullNameInput = document.getElementById("fullNameTraCuuTrangThai");
  const lopInput = document.getElementById("input[name='lop']");

function handleEnterKey(e, callback) {
    if (e.key === "Enter") {
      e.preventDefault(); // Ngăn hành động mặc định của phím Enter
      callback(); // Gọi hàm callback được truyền vào
    }
  }

  [fullNameInput, msvInput, lopInput].forEach((input) => {
    if (input) {
      input.addEventListener("keypress", (e) => {
        handleEnterKey(e, () => {
          console.log("Nhấn Enter trong modal đăng ký");
      });
    });
    }
    });

    if (msvTraCuuInput) {
      msvTraCuuInput.addEventListener("keypress", (e) => {
        handleEnterKey(e, () => {
          console.log("Nhấn Enter trong modal tra cứu trạng thái đơn");
          traCuuTrangThaiDon();
        });
      });
    }

  [sbdInput, msvInput].forEach((input) => {
    input.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        traCuuDiem();
      }
    });
  });
// ======================= KHI TẢI XONG TRANG =========================


// Mở modal đăng ký
function openRegisterModal() {
  const modal = document.getElementById("modalRegister");
  if (modal) {
    modal.style.display = "block";
  }
}
// Đóng modal đăng ký
function closeRegisterModal() {
  const modal = document.getElementById("modalRegister");
  if (modal) {
    modal.style.display = "none";
  }
}
// ======= FORM ĐĂNG KÝ NHẬN BẢN CỨNG =======
// Lắng nghe khi DOM đã tải xong
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("registerForm");
  const messageDiv = document.getElementById("registerMessage");
  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault(); // ✅ Ngăn form hành xử mặc định

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

// ✅ So sánh thông tin với kết quả tra cứu
if (!traCuuKetQua) {
showToast("⚠️ Vui lòng tra cứu điểm trước khi đăng ký!", "error");
return;
}

function normalize(str) {
  return (str || "")
    .normalize("NFC") // Hoặc "NFD"
    .replace(/\s+/g, " ") // bỏ khoảng trắng dư
    .trim()
    .toLowerCase();
}

const tenForm = normalize(data.fullName);
const msvForm = normalize(data.msv);
const tenTraCuu = normalize(traCuuKetQua.ten);
const msvTraCuu = normalize(traCuuKetQua.msv);

if (tenForm !== tenTraCuu || msvForm !== msvTraCuu) {
  showToast("❌ Họ tên hoặc MSSV không khớp với kết quả tra cứu!", "error");
  return;
}

// Tiếp tục gửi nếu đúng
const btn = form.querySelector('button[type="submit"]');
btn.disabled = true;
btn.textContent = "Đang gửi...";

fetch("/register-certificate", {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify(data)
})
.then(res => res.text())
.then(message => {
  if(message.includes("❌ Bạn đã đăng ký nhận giấy chứng nhận bản cứng trước đó.")) {
    showToast("❌ Bạn đã đăng ký nhận giấy chứng nhận bản cứng trước đó.", "error"); 

  } else {
    showToast("✅ Cảm ơn bạn đã đăng ký!", "success");
  }

btn.disabled = false;
btn.textContent = "Gửi đăng ký";

setTimeout(() => {
messageDiv.innerHTML = "";
closeRegisterModal();
}, 1500);
})
.catch(err => {
console.error("❌ Lỗi gửi form:", err);
showToast("❌ Gửi thất bại. Vui lòng thử lại!", "error");
btn.disabled = false;
btn.textContent = "Gửi đăng ký";
});
});
})

function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");

  const toast = document.createElement("div");
  toast.className = `toast ${type === "error" ? "error" : ""}`;
  toast.textContent = message;

  container.appendChild(toast);

   // Sau 3s, thêm class .exit để trượt ra phải
  setTimeout(() => {
    toast.classList.add("exit");
  }, 3000);

  // Sau 2s, xoá khỏi DOM
  setTimeout(() => {
    toast.remove();
  }, 2000);
}
// ======================= TRA CỨU TRẠNG THÁI ĐƠN =========================
// Hàm mở modal tra cứu trạng thái đơn
document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("btnTraCuuTrangThai")?.addEventListener("click", traCuuTrangThaiDon);
});
  function openStatusModal() {
    const modal = document.getElementById("modalTraCuuTrangThai");
    if (modal) {
      modal.style.display = "flex";
      document.body.style.overflow = "hidden";
    }
  }
  
  function closeStatusModal() {
    const modal = document.getElementById("modalTraCuuTrangThai");
    if (modal) {
      modal.style.display = "none";
      document.body.style.overflow = "";
    }
  }

  function hienThiTrangThai(status) {
    const dict = {
      dang_xu_ly: {
        icon: "⏳",
        text: "Đang xử lý",
        color: "#ffc107"
      },
      cho_ky: {
        icon: "🖋",
        text: "Chờ ký",
        color: "#fd7e14"
      },
      da_ky: {
        icon: "✅",
        text: "Đã ký xong",
        color: "#28a745"
      },
      dang_van_chuyen: {
        icon: "🚚",
        text: "Đang vận chuyển",
        color: "#17a2b8"
      },
      san_sang_nhan: {
        icon: "📦",
        text: "Sẵn sàng nhận",
        color: "#007bff"
      },
      da_nhan: {
        icon: "📬",
        text: "Đã nhận",
        color: "#20c997"
      }
    };

    const item = dict[status];
    if (!item) return `<span style="color:red;">Không rõ trạng thái</span>`;
    return `<span style="color:${item.color}; font-weight:bold;">${item.icon} ${item.text}</span>`;
  }
  
  function traCuuTrangThaiDon() {
    const msv = document.getElementById("msvTraCuuTrangThai")?.value.trim();
  
    if (!msv) {
      showToast("❗Vui lòng nhập MSSV", "error");
      return;
    }
  
    openModal(`
      <p style="color:#666;">⏳ Đang kiểm tra trạng thái đơn...</p>
      <div class="spinner" style="margin-top:10px;"></div>
    `);
  
    fetch("/api/trang-thai-don", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ msv })
    })
      .then(res => res.json())
      .then(data => {
        if (!data.success || !data.status) {
          openModal(`<p class="fail">❌ ${data.message || "Không tìm thấy đơn."}</p>`);
          return;
        }
        const { fullName, lop, taodon, capnhat} = data;
        const trangThai = hienThiTrangThai(data.status);
        let formattedDate = "Chưa chọn";
        let selectedHours = "";
        let selectedMinutes = "";
  
        const showDateTimeInputs = data.status === "san_sang_nhan";
        const datePickerHTML = showDateTimeInputs
          ? `<p><strong>Chọn ngày giao:</strong></p>
             <input type="date" id="timeGiao">`
          : "";
        const timePickerHTML = showDateTimeInputs
          ? `<p><strong>Chọn thời gian giao:</strong></p>
             <input type="time" id="timepicker" min="09:00" max="16:00" step="1800">`
          : "";
        const saveButtonHTML = showDateTimeInputs
          ? `<button id="saveButton" class="btn btn-primary">Lưu thời gian nhận</button>`
          : "";
  
        openModal(`
          <p><strong>Họ và tên:</strong> ${fullName}</p>
          <p><strong>Mã số sinh viên:</strong> ${msv}</p>
          <p><strong>Lớp:</strong> ${lop}</p>
          <p><strong>Thời gian tạo đơn:</strong> ${taodon}</p>
          <p><strong>Thời gian cập nhật:</strong> ${capnhat}</p>
          <p><strong>Trạng thái:</strong> ${trangThai}</p>
          ${datePickerHTML}
          ${timePickerHTML}
          <p id="timeGiaoDisplay"><strong>Thời gian nhận đã chọn:</strong> ${formattedDate} ${selectedHours}</p>
          ${saveButtonHTML}
        `);
  
        const timeGiaoInput = document.getElementById("timeGiao");
        if (timeGiaoInput) {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          const minDate = tomorrow.toISOString().split("T")[0];
          timeGiaoInput.min = minDate;
  
          timeGiaoInput.addEventListener("change", function () {
            const val = this.value;
            if (!val) return;
            if (ngayLeVN.includes(val)) {
              showToast("❌ Đây là ngày lễ, vui lòng chọn ngày khác.", "error");
              this.value = "";
              return;
            }
  
            const [year, month, day] = val.split("-");
            formattedDate = `${day}/${month}/${year}`;
  
            const selectedDate = new Date(val);
            const dow = selectedDate.getDay();
            if (dow === 0 || dow === 6) {
              showToast("❌ Vui lòng chọn các ngày từ thứ 2 đến thứ 6.", "error");
              this.value = "";
              return;
            }
  
            const display = document.getElementById("timeGiaoDisplay");
            if (display) {
              display.textContent = `Thời gian nhận đã chọn: ${selectedHours}:${selectedMinutes} ${formattedDate}`;
            }
          });
        }
  
        const timePicker = document.getElementById("timepicker");
        if (timePicker) {
          timePicker.addEventListener("change", () => {
            const selectedTime = timePicker.value;
  
            if (!selectedTime || !selectedTime.includes(":")) {
              showToast("❌ Thời gian không hợp lệ.", "error");
              return;
            }
  
            let [hours, minutes] = selectedTime.split(":").map(Number);
            if (isNaN(hours) || isNaN(minutes)) return;
  
            if (minutes < 15) {
              minutes = 0;
            } else if (minutes < 45) {
              minutes = 30;
            } else {
              minutes = 0;
              hours += 1;
            }
  
            if (hours < 9) {
              showToast("❌ Chọn trong giờ hành chính (9:00 - 16:00)", "error");
              hours = 9;
              minutes = 0;
            } else if (hours > 16) {
              showToast("❌ Chọn trong giờ hành chính (9:00 - 16:00)", "error");
              hours = 16;
              minutes = 0;
            }
  
            selectedHours = hours.toString().padStart(2, "0");
            selectedMinutes = minutes.toString().padStart(2, "0");
            timePicker.value = `${selectedHours}:${selectedMinutes}`;
  
            const display = document.getElementById("timeGiaoDisplay");
            if (display) {
              display.textContent = `Thời gian nhận đã chọn: ${selectedHours}:${selectedMinutes} ${formattedDate}`;
            }
          });
        }
  
        const saveButton = document.getElementById("saveButton");
        if (saveButton) {
          saveButton.addEventListener("click", function () {
            const selectedDate = timeGiaoInput?.value || "";
            const selectedTime = timePicker?.value || "";
  
            if (!selectedDate || !selectedTime) {
              showToast("❗ Vui lòng chọn đầy đủ ngày và giờ nhận.", "error");
              return;
            }
  
            const combinedDateTime = `${selectedTime} ${selectedDate}`;
  
            fetch("/api/cap-nhat-ngay-va-gio", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                msv: msv,
                date: combinedDateTime
              })
            })
              .then((response) => response.json())
              .then((data) => {
                if (data.success) {
                  showToast(data.message ||"✅ Thời gian nhận đã được lưu!", "success");
                  saveButton.disabled = true;
                  timeGiaoInput.disabled = true;
                  timePicker.disabled = true;

                    setTimeout(closeStatusModal, 1500);
                  } else {
                    // ✅ Nếu đã gửi trước đó và có giờ/ngày
                    if (data.selectedDate && data.selectedTime) {
                      const [year, month, day] = data.selectedDate.split("-");
                      const formattedDate = `${day}/${month}/${year}`;
                      const formattedTime = data.selectedTime;
                      openModal(`
                        <p class="fail">Bạn đã chọn thời gian nhận <strong>${formattedTime}</strong> ngày <strong>${formattedDate}</strong> trước đó.</p>
                        <p>Vui lòng liên hệ <strong>email</strong> hoặc <strong>fanpage Liên chi Hội Khoa Hóa học</strong> để được hỗ trợ thay đổi.</p>
                      `);
                    } else {
                      openModal(`<p class="fail">${data.message || "❌ Có lỗi xảy ra."}</p>`);
                    }
                  }
                })
              .catch((err) => {
                console.error("Lỗi khi gửi dữ liệu:", err);
                showToast("❌ Đã xảy ra lỗi khi gửi dữ liệu.", "error");
              });
          });
        }
      })
      .catch(err => {
        console.error("Lỗi tra trạng thái:", err);
        openModal(`<p class="fail">❌ Lỗi khi kiểm tra đơn.</p>`);
      });
  }
    const ngayLeVN = [
      "2025-01-01",
      "2025-01-28", "2025-01-29", "2025-01-30", "2025-01-31",
      "2025-02-01", "2025-02-02", "2025-02-03",
      "2025-04-08",
      "2025-04-30",
      "2025-05-01",
      "2025-09-02"
    ];
  });