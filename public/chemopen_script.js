window.addEventListener("load", () => {
  setTimeout(() => {
    const overlay = document.getElementById("loadingOverlay");
    if (overlay) {
      overlay.classList.add("fade-out");
      setTimeout(() => {
        overlay.style.display = "none";
      }, 1000); // 1s khớp với thời gian fade
    }
  }, 10000); // ⏱️ đợi 10 giây rồi mới bắt đầu fade
});

const tips = [
  "Chào mừng bạn đến với Chem-Open 2025!",
  "Đây là một hoạt động của Liên chi Hội khoa Hoá học",
  "Đợi một chút nhé! Chúng mình đang chuẩn bị mọi thứ",
  "Xong rồi nè! Bắt đầu thôii"
];

let index = 0;
  const text = document.querySelector(".loading-text");
  if (text) {
    text.textContent = tips[0];
    setInterval(() => {
      index = (index + 1) % tips.length;
      text.textContent = tips[index];
    }, 2500);
  }

let savedData = null;
let selectedPaymentMethod = "bank"; // mặc định là bank

function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function isValidPhone(phone) {
  const re = /^(0|\+84)[0-9]{9}$/;
  return re.test(phone);
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registrationForm");
  const checkboxes = document.querySelectorAll('input[name="noidung"]');
  const doiNamNuCheckbox = document.querySelector('input[value="Đôi nam nữ"]');
  const partnerInfoSection = document.getElementById("partnerInfo");
  const partnerFields = partnerInfoSection.querySelectorAll("input, select");
  const khoaSelect = document.querySelector('select[name="khoa"]');
  const lopSelect = document.getElementById('lopSelect');
  const lopInput = document.getElementById('lopInput');

  khoaSelect.addEventListener('change', function () {
    if (this.value === "Hóa học") {
      lopSelect.style.display = "block";
      lopSelect.required = true;

      lopInput.style.display = "none";
      lopInput.required = false;
    } else {
      lopSelect.style.display = "none";
      lopSelect.required = false;

      lopInput.style.display = "block";
      lopInput.required = true;
    }
  });

  // Phần người thi cùng
  const partnerKhoaSelect = document.getElementById('partnerKhoa');
  const partnerLopSelect = document.getElementById('partnerLopSelect');
  const partnerLopInput = document.getElementById('partnerLopInput');
  
  partnerKhoaSelect.addEventListener('change', function () {
    const isHoaHoc = this.value === "Hóa học";
  
    // Hiển thị select nếu Hóa học, ngược lại thì input text
    partnerLopSelect.style.display = isHoaHoc ? "block" : "none";
    partnerLopSelect.required = isHoaHoc;
  
    partnerLopInput.style.display = isHoaHoc ? "none" : "block";
    partnerLopInput.required = !isHoaHoc;
  
    // ⚠️ Xoá giá trị nếu bị ẩn để tránh xung đột khi submit
    if (!isHoaHoc) {
      partnerLopSelect.removeAttribute("required");
      partnerLopSelect.value = "";
      partnerLopInput.setAttribute("required", "true");
    } else {
      partnerLopInput.removeAttribute("required");
      partnerLopInput.value = "";
      partnerLopSelect.setAttribute("required", "true");
    }
  });
  // ✅ Hiện/ẩn thông tin người thứ 2
  doiNamNuCheckbox.addEventListener("change", () => {
    if (doiNamNuCheckbox.checked) {
      partnerInfoSection.style.display = "block";
      partnerFields.forEach(input => {
        if (input.style.display !== "none") {
          input.setAttribute("required", "true");
        } else {
          input.removeAttribute("required");
        }
      });
    } else {
      partnerInfoSection.style.display = "none";
      partnerFields.forEach(input => input.removeAttribute("required"));
    }
  });

  // ✅ Xử lý chọn checkbox giới hạn
  checkboxes.forEach(checkbox => {
    checkbox.addEventListener("change", () => {
      const selected = Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.value);
      if (selected.length === 3) {
        showToast("Đăng ký nội thi đấu không hợp lệ.", "error");
        checkbox.checked = false;
      } else if (selected.includes("Đơn nam") && selected.includes("Đơn nữ")) {
        showToast("Chỉ được chọn 1 nội dung là Đơn nam hoặc Đơn nữ.", "error");
        checkbox.checked = false;
      }
    });
  });

  // ✅ Xử lý submit
  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const formData = new FormData(this);
    const fullName = formData.get("fullName");
    const mssv = formData.get("mssv");
    const selected = Array.from(document.querySelectorAll('input[name="noidung"]:checked')).map(cb => cb.value);
    const amount = getPaymentAmountFromSelected(selected);
    const phone = formData.get("phone");
    const email = formData.get("email");

    if (!isValidEmail(email)) {
      showToast("Email không hợp lệ", "error");
      return;
    }
    
    if (!isValidPhone(phone)) {
      showToast("Số điện thoại không hợp lệ", "error");
      return;
    }
    

    // Kiểm tra hợp lệ
    const isValid = (
      (selected.length === 1 && (selected.includes("Đơn nam") || selected.includes("Đơn nữ"))) ||
      (selected.length === 1 && selected.includes("Đôi nam nữ")) ||
      (selected.length === 2 && selected.includes("Đôi nam nữ") && (selected.includes("Đơn nam") || selected.includes("Đơn nữ")))
    );

    if (!isValid) {
      showToast("Chọn nội dung không hợp lệ.", "error");
      return;
    }
    // Nếu chọn Đôi nam nữ thì bắt buộc kiểm tra thông tin người thứ 2
    if (selected.includes("Đôi nam nữ")) {
      const partnerKhoa = formData.get("partnerKhoa");
    
      const partnerLop = partnerKhoa === "Hóa học"
        ? document.getElementById("partnerLopSelect").value
        : document.getElementById("partnerLopInput").value;
    
      const requiredPartnerFields = {
        partnerName: formData.get("partnerName"),
        partnerEmail: formData.get("partnerEmail"),
        partnerPhone: formData.get("partnerPhone"),
        partnerKhoa,
        partnerLop,
        partnerMSSV: formData.get("partnerMSSV")
      };
    
      for (const [fieldName, value] of Object.entries(requiredPartnerFields)) {
        if (!value || value.trim() === "") {
          showToast("Vui lòng điền đầy đủ thông tin người chơi thứ 2.", "error");
          return;
        }
      }
    }
    function generatePaymentCode() {
      const prefix = "CHEMO";
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let suffix = "";
      for (let i = 0; i < 4; i++) {
        suffix += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return prefix + suffix;
    }
    // ✅ Lưu dữ liệu
  const khoa = formData.get("khoa");
  const lop = khoa === "Hóa học" 
    ? document.getElementById("lopSelect").value 
    : document.getElementById("lopInput").value;
  const paymentCode = generatePaymentCode();
  savedData = {
    fullName,
    email,
    phone,
    khoa,
    lop,
    mssv,
    noidung: selected,
    amount,
    paymentMethod: selectedPaymentMethod,
    paymentCode,
    paymentStatus: "pending",
    partnerInfo: selected.includes("Đôi nam nữ")
      ? {
          fullName: formData.get("partnerName"),
          email: formData.get("partnerEmail"),
          phone: formData.get("partnerPhone"),
          khoa: formData.get("partnerKhoa"),
          lop: formData.get("partnerKhoa") === "Hóa học"
            ? document.getElementById("partnerLopSelect").value
            : document.getElementById("partnerLopInput").value,
          mssv: formData.get("partnerMSSV")
        }
      : null
  };

    console.log("✅ Dữ liệu:", savedData);
    showToast("Thông tin hợp lệ!", "success");
    fetch("/api/register", {
      method: "POST",
      headers: {
    "Content-Type": "application/json"
    },
      body: JSON.stringify(savedData)
    })
    .then(res => res.json())
    .then(result => {
      if (result.success) {
        console.log("✅ Đã lưu vào MongoDB:", result.data);
        savedData = result.data; // cập nhật nếu MongoDB gán _id, expireAt,...
      } else {
        console.warn("⚠️ Lưu thất bại:", result.message);
        showToast("Không thể lưu thông tin, vui lòng thử lại.", "error");
      }
    })
    .catch(err => {
      console.error("❌ Lỗi gửi dữ liệu:", err);
      showToast("Không thể kết nối đến máy chủ.", "error");
    });

    // ✅ QR & Chuyển bước
    updateBankQR(mssv, fullName, selected, paymentCode);
    document.getElementById("registrationSection").style.display = "none";
    document.getElementById("paymentSection").style.display = "block";

    // ✅ Render lại PayPal button
    const paypalContainer = document.getElementById("paypal-button-container");
    paypalContainer.innerHTML = "";
    paypal.Buttons({
      createOrder: function (data, actions) {
        const usd = (savedData.amount / 21500).toFixed(2);
        return actions.order.create({
          payer: {
            address: {
              country_code: "VN"
            }
          },
          purchase_units: [{
            amount: {
              value: usd,
              currency_code: "USD"
            },
            description: `Phí đăng ký thi đấu: ${savedData.fullName} - ${savedData.mssv}`
          }]
        });
      },
      onApprove: function (data, actions) {
        return actions.order.capture().then(function (details) {
          showToast(`✅ Thanh toán thành công! ${details.payer.name.given_name}`);
          console.log("📦 Giao dịch thành công:", details);
      
          // Gửi yêu cầu cập nhật trạng thái thanh toán
          return fetch("/api/update-payment", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              mssv: savedData.mssv,
              paymentStatus: "paid"
            })
          });
        })
        .then(res => res.json())
        .then(data => {
          console.log("🔄 Cập nhật trạng thái thành công:", data);
          showToast("🎉 Cảm ơn bạn đã đăng ký!", "success");
          showFinalThankYouModal();
        })
          // Đóng modal sau 5 giây
        .catch(err => {
          console.error("❌ Lỗi cập nhật trạng thái:", err);
        });
      }      
    }).render(paypalContainer);
  // ✅ Xử lý chuyển đổi phương thức thanh toán

document.querySelectorAll(".payment-option").forEach(option => {
  option.addEventListener("click", () => {
    const method = option.getAttribute("data-method");
    selectedPaymentMethod = method;

    // ✅ Cập nhật radio
    const radio = option.querySelector('input[type="radio"]');
    if (radio) {
      radio.checked = true;
      radio.removeAttribute("required");
    }

    // ✅ Cập nhật hiển thị phần thanh toán tương ứng
    document.getElementById("bankTransferSection").style.display = method === "bank" ? "block" : "none";
    document.getElementById("paypal-button-container").style.display = method === "paypal" ? "block" : "none";

    // ✅ Cập nhật giao diện chọn
    document.querySelectorAll(".payment-option").forEach(opt => opt.classList.remove("selected"));
    option.classList.add("selected");
  });
});
const backButton = document.getElementById("backButton");

backButton.addEventListener("click", () => {
  // Ẩn phần thanh toán
  document.getElementById("paymentSection").style.display = "none";

  // Hiện lại form đăng ký
  document.getElementById("registrationSection").style.display = "block";

  // ✅ Ẩn phần người thứ 2 nếu có
  document.getElementById("partnerInfo").style.display = "none";

  // ✅ Ẩn QR nếu đã render
  document.getElementById("bankQRImg").src = "";
  document.getElementById("paymentAmountDisplay").textContent = "";
});
});

// ✅ Hàm phụ trợ

function getPaymentAmountFromSelected(options) {
  if (options.length === 1 && (options.includes("Đơn nam") || options.includes("Đơn nữ"))) return 70000;
  if (options.length === 1 && options.includes("Đôi nam nữ")) return 150000;
  if (options.length === 2 && options.includes("Đôi nam nữ") && (options.includes("Đơn nam") || options.includes("Đơn nữ"))) return 220000;
  return 0;
}

function updateBankQR(mssv, fullName, selectedOptions, paymentCode) {
  const amount = getPaymentAmountFromSelected(selectedOptions);
  const accountNumber = "96247LCHHOAHOC"; // 👉 thay bằng số tài khoản của bạn
  const bankCode = "BIDV";              // 👉 mã ngân hàng (MB, VCB, ACB,...)
  const note = `${mssv}%20${fullName}%20${selectedOptions.join("_")}%20${paymentCode}`;

  const sepayQRUrl = `https://qr.sepay.vn/img?acc=${accountNumber}&bank=${bankCode}&amount=${amount}&des=${note}`;

  const qrImg = document.getElementById("bankQRImg").src 
  qrImg.src = sepayQRUrl;
  document.getElementById("paymentAmountDisplay").textContent = `Số tiền cần thanh toán: ${amount.toLocaleString("vi-VN")}₫`;
  setTimeout(() => {
    qrImg.src = "";
    document.getElementById("paymentAmountDisplay").textContent =
      "⏰ Mã QR đã hết hạn. Vui lòng tải lại form để nhận mã mới.";
    showToast("Mã QR đã hết hạn. Vui lòng đăng ký lại!", "error");
  }, 600000); // 10 phút
}


// 📡 Lắng nghe cập nhật trạng thái từ server khi có thay đổi
const socket = io();
console.log("🔌 Socket connected:", socket.connected);

socket.on("connect", () => {
  console.log("✅ Socket.IO connected!");
});

socket.on("disconnect", () => {
  console.log("❌ Socket.IO disconnected");
});

socket.on("payment-updated", ({ mssv, status }) => {
  console.log("📡 Đã nhận sự kiện từ server:", mssv, status);
  const currentMSSV = savedData?.mssv || document.querySelector("#modalPage1")?.textContent?.match(/\d{8}/)?.[0];

  console.log("📡 Đã nhận sự kiện từ server:", mssv, status);
  console.log("🧾 MSSV hiện tại:", currentMSSV);

  if (mssv === currentMSSV && status === "paid") {
    // ✅ Cập nhật local
    if (!savedData) savedData = {};
  savedData.paymentStatus = "paid";

    // ✅ Ẩn timer
    document.getElementById("countdownBox").style.display = "none";

    // ✅ Toast thành công
    showToast("🎉 Thanh toán thành công!", "success");

    // ✅ Hiện modal cảm ơn
    showFinalThankYouModal();
    setTimeout(() => window.location.href = "/", 3000);
  
    // ✅ Gửi lại dữ liệu vào MongoDB (nếu chưa có _id hoặc bạn muốn update chắc chắn)
    fetch("/api/update-payment", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mssv: savedData.mssv,
        paymentStatus: "paid",
        paymentCode: savedData.paymentCode
      })
    })
      .then(res => res.json())
      .then(result => {
        console.log("✅ Đã xoá expireAt:", result);
      })
      .catch(err => {
        console.error("❌ Lỗi khi lưu dữ liệu đã thanh toán:", err);
      });
  }
});

  const confirmBtn = document.getElementById("confirmInfoButton");
  const resultModal = document.getElementById("resultModal");
  const modalPage1 = document.getElementById("modalPage1");
  const modalPage2 = document.getElementById("modalPage2");
  const nextBtn = document.getElementById("nextPageBtn");
  const prevBtn = document.getElementById("prevPageBtn");
  const cancelBtn = document.getElementById("cancelBtn");
  const finalBtn = document.getElementById("finalConfirmBtn");

  if (!confirmBtn || !resultModal || !modalPage1) {
    console.error("❌ Không tìm thấy phần tử modal hoặc nút xác nhận.");
    return;
  }

  confirmBtn.addEventListener("click", () => {
    const form = document.getElementById("registrationForm");
    const formData = new FormData(form);

    modalPage1.innerHTML = `
      <h3>Thông tin cá nhân</h3>
      <p><strong>Họ tên:</strong> ${formData.get("fullName")}</p>
      <p><strong>Email:</strong> ${formData.get("email")}</p>
      <p><strong>SĐT:</strong> ${formData.get("phone")}</p>
      <p><strong>Khoa:</strong> ${formData.get("khoa")}</p>
      <p><strong>Lớp:</strong> ${formData.get("lop")}</p>
      <p><strong>MSSV:</strong> ${formData.get("mssv")}</p>
      <p><strong>Nội dung:</strong> ${(formData.getAll("noidung") || []).join(" + ")}</p>
    `;

    modalPage2.innerHTML = `
      <h3>Thông tin đồng đội</h3>
      <p><strong>Họ tên:</strong> ${formData.get("partnerName") || "Không có"}</p>
      <p><strong>Email:</strong> ${formData.get("partnerEmail") || "Không có"}</p>
      <p><strong>SĐT:</strong> ${formData.get("partnerPhone") || "Không có"}</p>
      <p><strong>Khoa:</strong> ${formData.get("partnerKhoa") || "Không có"}</p>
      <p><strong>Lớp:</strong> ${formData.get("partnerLop") || "Không có"}</p>
      <p><strong>MSSV:</strong> ${formData.get("partnerMSSV") || "Không có"}</p>
    `;

    resultModal.classList.add("show");
    modalPage1.style.display = "block";
    modalPage2.style.display = "none";
    nextBtn.style.display = "inline-block";
    prevBtn.style.display = "none";
    cancelBtn.style.display = "none";
    finalBtn.style.display = "none";
  });

  nextBtn.addEventListener("click", () => {
    modalPage1.style.display = "none";
    modalPage2.style.display = "block";
    nextBtn.style.display = "none";
    prevBtn.style.display = "inline-block";
    cancelBtn.style.display = "inline-block";
    finalBtn.style.display = "inline-block";
  });

  prevBtn.addEventListener("click", () => {
    modalPage1.style.display = "block";
    modalPage2.style.display = "none";
    nextBtn.style.display = "inline-block";
    prevBtn.style.display = "none";
    finalBtn.style.display = "none";
  });

  finalBtn.addEventListener("click", () => {
    resultModal.classList.remove("show");
    document.getElementById("registrationSection").style.display = "none";
    document.getElementById("paymentSection").style.display = "block";
    startCountdown(10);
  });

  document.getElementById("cancelBtn").addEventListener("click", () => {
  // Ẩn modal
  document.getElementById("resultModal").classList.remove("show");

  // Hiện lại form đăng ký
  document.getElementById("registrationSection").style.display = "block";

  // Ẩn phần thanh toán nếu đang mở
  document.getElementById("paymentSection").style.display = "none";

  // Reset modal về trạng thái ban đầu
  document.getElementById("modalPage1").style.display = "block";
  document.getElementById("modalPage2").style.display = "none";
  document.getElementById("nextPageBtn").style.display = "inline-block";
  document.getElementById("prevPageBtn").style.display = "none";
  document.getElementById("finalConfirmBtn").style.display = "none";

  // Nếu QR đã hiển thị thì xoá ảnh và text
  document.getElementById("bankQRImg").src = "";
  document.getElementById("paymentAmountDisplay").textContent = "";
});
});
window.showFinalThankYouModal = function () {
  const modal = document.createElement("div");
  modal.style.cssText = `
    position: fixed;
    top: 0; left: 0;
    width: 100%; height: 100%;
    background: rgba(0,0,0,0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
  `;
  modal.innerHTML = `
    <div style="background: white; padding: 30px; border-radius: 10px; text-align: center;">
      <h2>🎉 Cảm ơn bạn đã đăng ký giải đấu!</h2>
      <button id="closeThankYouModal" style="margin-top: 20px; padding: 10px 20px;">Đóng</button>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById("closeThankYouModal").addEventListener("click", () => {
    modal.remove();
  });
}
function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `custom-toast ${type}`;
  toast.textContent = message;

  document.body.appendChild(toast);

  // Force reflow to trigger animation
  requestAnimationFrame(() => {
    toast.classList.add("show");
  });

  setTimeout(() => {
    toast.classList.remove("show");
    toast.addEventListener("transitionend", () => toast.remove());
  }, 3000);
}
function startCountdown(minutes) {
  const totalSeconds = minutes * 60;
  let remaining = totalSeconds;
  const box = document.getElementById("countdownBox");
  const display = document.getElementById("countdown");

  box.style.display = "block";

  const interval = setInterval(() => {
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    display.textContent = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

    if (remaining <= 0) {
      clearInterval(interval);
      showModal("⏰ Đã hết thời gian giữ đơn, vui lòng đăng ký lại!");
      window.location.reload(); // hoặc chuyển lại form
    }

    remaining--;
  }, 1000);
}