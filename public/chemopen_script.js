let countdownInterval = null;
let qrShakeInterval = null;

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
  const partnerInfoSection = document.getElementById("partnerInfo");
  const partnerFields = partnerInfoSection.querySelectorAll("input, select");
  const lopSelect = document.getElementById('lopSelect');
  const lopInput = document.getElementById('lopInput');
  const khoaSelect = document.querySelector('select[name="khoa"]');
  const partnerKhoaHidden = document.getElementById("partnerKhoaHidden");

  khoaSelect.addEventListener('change', function () {
  const selectedKhoa = this.value;

  if (selectedKhoa === "Hóa học") {
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
  if (partnerKhoaHidden) {
    partnerKhoaHidden.value = selectedKhoa;
  }
  const partnerKhoaSelect = document.getElementById("partnerKhoa");
  if (partnerKhoaSelect) {
    partnerKhoaSelect.value = selectedKhoa;
  }
  const partnerLopSelect = document.getElementById("partnerLopSelect");
  const partnerLopInput = document.getElementById("partnerLopInput");

  if (selectedKhoa === "Hóa học") {
    partnerLopSelect.style.display = "block";
    partnerLopSelect.required = true;
    partnerLopInput.style.display = "none";
    partnerLopInput.required = false;
  } else {
    partnerLopSelect.style.display = "none";
    partnerLopSelect.required = false;
    partnerLopInput.style.display = "block";
    partnerLopInput.required = true;
  }
})

  // Phần người thi cùng
  const partnerLopSelect = document.getElementById('partnerLopSelect');
  const partnerLopInput = document.getElementById('partnerLopInput');
  const partnerGenderSelect = document.querySelector('select[name="partnerGender"]');

  // ✅ Xử lý chọn checkbox giới hạn
  const genderSelect = document.querySelector('select[name="gender"]');

// ❗ Khoá tất cả checkbox ngay từ đầu
checkboxes.forEach(cb => {
  cb.disabled = true;
  cb.parentElement.style.opacity = "0.5";
});

// ✅ Khi chọn giới tính
genderSelect.addEventListener("change", () => {
  const gender = genderSelect.value;

  const allowed = gender === "Nam"
    ? ["Đơn nam", "Đôi nam", "Đôi nam nữ"]
    : gender === "Nữ"
    ? ["Đơn nữ", "Đôi nữ", "Đôi nam nữ"]
    : [];

  checkboxes.forEach(cb => {
    const isAllowed = allowed.includes(cb.value);
    cb.disabled = !isAllowed;
    cb.checked = false;
    cb.parentElement.style.opacity = isAllowed ? "1" : "0.5";
  });

  // Reset phần đồng đội nếu giới tính thay đổi
  partnerGenderSelect.value = "";
  partnerInfoSection.style.display = "none";
});

// ✅ Bắt sự kiện thay đổi nội dung thi đấu
checkboxes.forEach(checkbox => {
  checkbox.addEventListener("change", () => {
    const gender = genderSelect.value;
    if (!gender) {
      checkbox.checked = false;
      showToast("Vui lòng chọn giới tính trước.", "error");
      return;
    }

    const selected = Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.value);
    const doi1 = gender === "Nam" ? "Đôi nam" : "Đôi nữ";
    const doi2 = "Đôi nam nữ";

    // ✅ Reset disable
    checkboxes.forEach(cb => {
      if ([doi1, doi2].includes(cb.value)) cb.disabled = false;
    });

    // ✅ Không được chọn cả Đơn nam và Đơn nữ
    if (selected.includes("Đơn nam") && selected.includes("Đơn nữ")) {
      checkbox.checked = false;
      showToast("Chỉ được chọn 1 nội dung đơn.", "error");
      return;
    }

    // ✅ Không được chọn quá 2 nội dung
    if (selected.length > 2) {
      checkbox.checked = false;
      showToast("Chỉ được chọn tối đa 2 nội dung gồm 1 đơn và 1 đôi.", "error");
      return;
    }

    // ✅ Không được chọn cả đôi cùng giới và đôi nam nữ
    if (selected.includes(doi1) && selected.includes(doi2)) {
      checkbox.checked = false;
      showToast(`Không được chọn cả ${doi1} và Đôi nam nữ.`, "error");
      return;
    }

    // ✅ Nếu đã chọn 1 trong 2, disable cái còn lại
    checkboxes.forEach(cb => {
      if (cb.value === doi1) {
        cb.disabled = selected.includes(doi2);
        if (selected.includes(doi2)) cb.checked = false;
      }
      if (cb.value === doi2) {
        cb.disabled = selected.includes(doi1);
        if (selected.includes(doi1)) cb.checked = false;
      }
    });

    // ✅ Hiện phần người thi đấu cùng nếu là đôi
    const needPartner = [doi1, doi2].some(item => selected.includes(item));
    partnerInfoSection.style.display = needPartner ? "block" : "none";
    partnerFields.forEach(input => {
      if (input.style.display !== "none" && needPartner) {
        input.setAttribute("required", "true");
      } else {
        input.removeAttribute("required");
      }
    });
    // ✅ Auto set giới tính người chơi cùng nếu chọn đôi cụ thể
    if (partnerGenderSelect) {
      if (selected.includes("Đôi nam nữ")) {
        partnerGenderSelect.value = gender === "Nam" ? "Nữ" : "Nam";
        partnerGenderSelect.disabled = true;
      } else if (selected.includes("Đôi nam")) {
        partnerGenderSelect.value = "Nam";
        partnerGenderSelect.disabled = true;
      } else if (selected.includes("Đôi nữ")) {
        partnerGenderSelect.value = "Nữ";
        partnerGenderSelect.disabled = true;
      } else {
        partnerGenderSelect.value = "";
        partnerGenderSelect.disabled = false;
      }
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
    if (amount === 0) {
      showToast("Lỗi thanh toán, vui lòng kiểm tra lại nội dung thi.", "error");
      return;
    }
    if (!selectedPaymentMethod) {
      showToast("Vui lòng chọn phương thức thanh toán.", "error");
      return;
    }
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
    
    // Nếu chọn Đôi nam nữ thì bắt buộc kiểm tra thông tin người thứ 2
    if (["Đôi nam", "Đôi nữ", "Đôi nam nữ"].some(nd => selected.includes(nd))) {
      const partnerKhoa = formData.get("partnerKhoaHidden");
    
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
    gender: formData.get("gender"),
    khoa,
    lop,
    mssv,
    noidung: selected,
    amount,
    paymentMethod: selectedPaymentMethod,
    paymentCode,
    paymentStatus: "pending",
    partnerInfo: ["Đôi nam", "Đôi nữ", "Đôi nam nữ"].some(nd => selected.includes(nd))
      ? {
          fullName: formData.get("partnerName"),
          email: formData.get("partnerEmail"),
          phone: formData.get("partnerPhone"),
          khoa: formData.get("partnerKhoaHidden"),
          gender: formData.get("partnerGender"),
          lop: formData.get("partnerKhoaHidden") === "Hóa học"
            ? document.getElementById("partnerLopSelect").value
            : document.getElementById("partnerLopInput").value,
          mssv: formData.get("partnerMSSV")
        }
      : null
  };

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
      savedData = result.data;
      localStorage.setItem("paymentCode", savedData.paymentCode);

      const serverExpireAt = new Date(result.data.expireAt);
      const serverNow = new Date(result.data.serverTime);
      const clientNow = new Date();
      const drift = clientNow - serverNow;
      const realRemaining = serverExpireAt - clientNow + drift;

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
});


// ✅ Hàm phụ trợ

function getPaymentAmountFromSelected(options) {
  const singles = ["Đơn nam", "Đơn nữ"];
  const doubles = ["Đôi nam", "Đôi nữ", "Đôi nam nữ"];

  const hasSingle = options.some(opt => singles.includes(opt));
  const hasDouble = options.some(opt => doubles.includes(opt));

  if (options.length === 1 && hasSingle) return 70000;
  if (options.length === 1 && hasDouble) return 150000;
  if (options.length === 2 && hasSingle && hasDouble) return 220000;

  return 0; // Không hợp lệ hoặc nhiều hơn 2 nội dung
}

function updateBankQR(mssv, fullName, selectedOptions, paymentCode) {
  const amount = getPaymentAmountFromSelected(selectedOptions);
  const accountNumber = "96247LCHHOAHOC"; // 👉 thay bằng số tài khoản của bạn
  const bankCode = "BIDV";              // 👉 mã ngân hàng (MB, VCB, ACB,...)
  const note = `${mssv}%20${fullName}%20${selectedOptions.join("_")}%20${paymentCode}`;

  const sepayQRUrl = `https://qr.sepay.vn/img?acc=${accountNumber}&bank=${bankCode}&amount=${amount}&des=${note}`;

  const qrImg = document.getElementById("bankQRImg");
  qrImg.src = sepayQRUrl;
  document.getElementById("paymentAmountDisplay").textContent = `Số tiền cần thanh toán: ${amount.toLocaleString("vi-VN")}₫`;
  setTimeout(() => {
  // Thêm hiệu ứng rung vào ảnh QR
  qrImg.classList.add("shake");

  // Đổi nội dung và màu chữ thông báo
  const paymentAmountDisplay = document.getElementById("paymentAmountDisplay");
  paymentAmountDisplay.innerHTML = `<span style="color: red; font-weight: bold;">
    ⚠️ Mã QR đã hết hạn. Vui lòng điền lại form để nhận mã mới.
  </span>`;

  // Toast thông báo
  showToast("Mã QR đã hết hạn. Vui lòng đăng ký lại!", "error");
}, 600000); // 10 phút (600000ms)
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
    if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
    // ✅ Ẩn timer
    document.getElementById("countdownBox").style.display = "none";

    // ✅ Toast thành công
    showToast("🎉 Thanh toán thành công!", "success");

    // ✅ Hiện modal cảm ơn
    showFinalThankYouModal(savedData.fullName);
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
      <p><strong>Giới tính:</strong> ${formData.get("gender")}</p>
      <p><strong>Khoa:</strong> ${formData.get("khoa")}</p>
      <p><strong>Lớp:</strong> ${formData.get("lop")}</p>
      <p><strong>MSSV:</strong> ${formData.get("mssv")}</p>
      <p><strong>Nội dung:</strong> ${(formData.getAll("noidung") || []).join(" + ")}</p>
    `;
    const partnerGender = document.getElementById("partnerGender").value || "Không có";
    const partnerKhoa = document.getElementById("partnerKhoaHidden").value || "Không có";
    const partnerLop = partnerKhoa === "Hóa học"
      ? document.getElementById("partnerLopSelect")?.value || "Không có"
      : document.getElementById("partnerLopInput")?.value || "Không có";
    modalPage2.innerHTML = `
      <h3>Thông tin đồng đội</h3>
      <p><strong>Họ tên:</strong> ${formData.get("partnerName") || "Không có"}</p>
      <p><strong>Email:</strong> ${formData.get("partnerEmail") || "Không có"}</p>
      <p><strong>SĐT:</strong> ${formData.get("partnerPhone") || "Không có"}</p>
      <p><strong>Giới tính:</strong> ${partnerGender}</p>
      <p><strong>Khoa:</strong> ${partnerKhoa}</p>
      <p><strong>Lớp:</strong> ${partnerLop}</p>
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
  
  // Chuyển sang trang thanh toán
  document.getElementById("registrationSection").style.display = "none";
  document.getElementById("paymentSection").style.display = "block";

  document.getElementById("confirmInfoButton").style.display = "none";

  // 👉 Hiện các ô thanh toán sau khi xác nhận thông tin
  document.getElementById("paymentOptions").style.display = "flex";
  const serverExpireAt = new Date(savedData.expireAt);
  const serverNow = new Date(savedData.serverTime);
  const clientNow = new Date();
  const drift = clientNow - serverNow;
  const realRemaining = serverExpireAt - clientNow + drift;

  startCountdown(Math.floor(realRemaining / 1000));

  const expireTimeFormatted = serverExpireAt.toLocaleTimeString("vi-VN");
  document.getElementById("expireTimeText").textContent = `(hết hạn lúc ${expireTimeFormatted})`;
  // 👉 Cập nhật MongoDB với expireAt mới

  fetch("/api/update-payment", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mssv: savedData.mssv,
      paymentStatus: "pending",
      paymentCode: savedData.paymentCode,
      expireAt: savedData.expireAt
    })
  })
    .then(res => res.json())
    .then(result => {
      console.log("✅ Cập nhật expireAt thành công:", result);
    })
    .catch(err => {
      console.error("❌ Lỗi khi cập nhật expireAt:", err);
    });
});

  document.getElementById("cancelBtn").addEventListener("click", async () => {
  const paymentCode = localStorage.getItem("paymentCode");

  // ✅ Xoá document khỏi MongoDB nếu có mã
  if (paymentCode) {
    try {
      const res = await fetch(`/api/delete-registration/${paymentCode}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showToast("🗑️ Đã huỷ đơn đăng ký.", "success");
      } else {
        showToast("⚠️ Không xoá được đơn.", "error");
      }
      localStorage.removeItem("paymentCode");
    } catch (err) {
      console.error("❌ Lỗi khi xoá đơn:", err);
      showToast("⚠️ Lỗi kết nối khi huỷ đơn.", "error");
    }
  }

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

window.showFinalThankYouModal = function (fullName) {
  const modal = document.createElement("div");
  modal.style.cssText = `
    position: fixed;
    top: 0; left: 0;
    width: 100%; height: 100%;
    background: rgba(0,0,0,0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    animation: fadeIn 0.3s ease-out;
  `;

  modal.innerHTML = `
    <style>
      @keyframes fadeIn {
        from { opacity: 0; transform: scale(0.9); }
        to { opacity: 1; transform: scale(1); }
      }
    </style>
    <div style="
      background: linear-gradient(135deg, #ffffff, #f0f9ff);
      padding: 40px 30px;
      border-radius: 16px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.2);
      text-align: center;
      max-width: 90%;
      width: 400px;
      animation: fadeIn 0.5s ease-out;
    ">
      <div style="font-size: 50px; margin-bottom: 20px;">✅</div>
      <h2 style="font-size: 24px; margin-bottom: 15px; color: #333;">Cảm ơn bạn ${fullName} đã đăng ký!</h2>
      <p style="font-size: 16px; color: #555;">BTC sẽ gửi mail xác nhận đến bạn trong vài phút tới.</p>
      <button id="closeThankYouModal" style="
        margin-top: 25px;
        padding: 10px 25px;
        font-size: 16px;
        border: none;
        border-radius: 6px;
        background: #007BFF;
        color: white;
        cursor: pointer;
        transition: background 0.3s;
      ">Đóng</button>
    </div>
  `;

  document.body.appendChild(modal);

  function closeAndRedirect() {
    modal.remove();
    window.location.href = "/";
  }

  document.getElementById("closeThankYouModal").addEventListener("click", closeAndRedirect);

  // ✅ Tự động đóng sau 5 giây
  setTimeout(closeAndRedirect, 5000);
};

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

function startCountdown(seconds) {
  let remaining = Math.floor(seconds);
  const box = document.getElementById("countdownBox");
  const display = document.getElementById("countdown");
  const qrImg = document.getElementById("bankQRImg");
  const ping = document.getElementById("pingSound");

  box.style.display = "block";

  if (countdownInterval) clearInterval(countdownInterval);
  if (qrShakeInterval) clearInterval(qrShakeInterval);

  countdownInterval = setInterval(() => {
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    display.textContent = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

    // 🟥 Cảnh báo khi còn đúng 30 giây
    if (remaining === 30) {
      if (qrImg) {
        qrImg.classList.add("qr-warning");

        qrShakeInterval = setInterval(() => {
          qrImg.classList.add("shake");
          setTimeout(() => qrImg.classList.remove("shake"), 800);

          if (ping) {
            ping.currentTime = 0;
            ping.play().catch(() => {});
          }
        }, 2000);
      }
    }

    // 🕒 Hết thời gian
    if (remaining <= 0) {
      clearInterval(countdownInterval);
      countdownInterval = null;
      if (qrShakeInterval) clearInterval(qrShakeInterval);

      if (qrImg) {
        qrImg.classList.remove("qr-warning");
        qrImg.classList.remove("shake");
        qrImg.style.opacity = "0.4";
        qrImg.style.pointerEvents = "none";
      }

      showModal("⏰ Đã hết thời gian giữ đơn, vui lòng đăng ký lại!");
      return;
    }

    remaining--;
  }, 1000);
}
function showModal(message) {
  const modal = document.createElement("div");
  modal.style.cssText = `
    position: fixed;
    top: 0; left: 0;
    width: 100%; height: 100%;
    background: rgba(0,0,0,0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
  `;

  modal.innerHTML = `
    <div style="background: white; padding: 30px; border-radius: 10px; text-align: center; max-width: 90%;">
      <h3>${message}</h3>
      <button id="closeAutoModal" style="margin-top: 20px; padding: 10px 20px;">Đóng</button>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById("closeAutoModal").addEventListener("click", () => {
    modal.remove();
    window.location.reload();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const openBtn = document.getElementById("openGuideBtn");
  const modal = document.getElementById("guideModal");
  const closeBtn = document.getElementById("closeGuideBtn");
  const video = modal.querySelector("video");

  openBtn.addEventListener("click", () => {
    modal.classList.add("active");
    video.currentTime = 0;
    video.play();
  });

  function closeModal() {
    modal.classList.remove("active");
    video.pause();
  }

  closeBtn.addEventListener("click", closeModal);
  window.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("active")) {
      closeModal();
    }
  });
});

