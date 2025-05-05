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
        partnerFacebook: formData.get("partnerFacebook"),
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
    
    // ✅ Lưu dữ liệu
  const khoa = formData.get("khoa");
  const lop = khoa === "Hóa học" 
    ? document.getElementById("lopSelect").value 
    : document.getElementById("lopInput").value;

  savedData = {
    fullName,
    email,
    phone,
    facebook: formData.get("facebook"),
    khoa,
    lop,
    mssv,
    noidung: selected,
    amount,
    paymentMethod: selectedPaymentMethod,
    paymentStatus: "pending",
    partnerInfo: selected.includes("Đôi nam nữ")
      ? {
          fullName: formData.get("partnerName"),
          email: formData.get("partnerEmail"),
          phone: formData.get("partnerPhone"),
          facebook: formData.get("partnerFacebook"),
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

    // ✅ QR & Chuyển bước
    updateBankQR(mssv, fullName, selected);
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
          return fetch("http://localhost:3001/api/update-payment", {
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
          // Đóng modal sau 5 giây
          setTimeout(() => {
            document.getElementById("resultModal").style.display = "none";
          }, 5000);
        })
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

function updateBankQR(mssv, fullName, selectedOptions) {
  const amount = getPaymentAmountFromSelected(selectedOptions);
  const accountNumber = "VQRQACIDD7396"; // 👉 thay bằng số tài khoản của bạn
  const bankCode = "MB";              // 👉 mã ngân hàng (MB, VCB, ACB,...)
  const note = `${mssv}|${fullName}|${selectedOptions.join("_")}`;

  const sepayQRUrl = `https://qr.sepay.vn/img?acc=${accountNumber}&bank=${bankCode}&amount=${amount}&des=${encodeURIComponent(note)}`;

  document.getElementById("bankQRImg").src = sepayQRUrl;
  document.getElementById("paymentAmountDisplay").textContent = `Số tiền cần thanh toán: ${amount.toLocaleString("vi-VN")}₫`;
}

function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast ${type === "error" ? "error" : ""}`;
  toast.innerHTML = `<div class="toast-message">${message}</div><div class="toast-progress"></div>`;
  container.appendChild(toast);
  setTimeout(() => toast.classList.add("exit"), 3000);
  setTimeout(() => toast.remove(), 3500);
}
document.getElementById('confirm-payButton').addEventListener('click', async () => {
  const form = document.getElementById('registrationForm');
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());
  const khoa = formData.get("khoa");
  data.khoa = khoa;
  data.lop = khoa === "Hóa học"
  ? document.getElementById("lopSelect").value
  : document.getElementById("lopInput").value;  
  // checkbox multiple
  data.noidung = formData.getAll('noidung');

  // Partner info
  data.partnerInfo = {
    fullName: formData.get('partnerName'),
    email: formData.get('partnerEmail'),
    phone: formData.get('partnerPhone'),
    facebook: formData.get('partnerFacebook'),
    khoa: formData.get('partnerKhoa'),
    lop: formData.get("partnerKhoa") === "Hóa học"
  ? document.getElementById("partnerLopSelect").value
  : document.getElementById("partnerLopInput").value,
    mssv: formData.get('partnerMSSV')
  };

  data.paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'bank';
  
  console.log("📤 Gửi dữ liệu:", data)
  try {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await res.json();
    if (result.success) {
      showModal(result.data);
    } else {
      showToast("Lỗi khi gửi dữ liệu.", "error");
    }
  } catch (err) {
    console.error(err);
    showToast("Không thể kết nối đến máy chủ.", "error");
  }
});
function showModal(data) {
  const modal = document.getElementById('resultModal');
  const page1 = document.getElementById('modalPage1');
  const page2 = document.getElementById('modalPage2');
  const nextBtn = document.getElementById('nextPageBtn');
  const prevBtn = document.getElementById('prevPageBtn');

  const hasPartner = data.partnerInfo && data.partnerInfo.fullName;

  // Trang 1: Thông tin người đăng ký chính
  page1.innerHTML = `
    <p><strong>Họ và tên:</strong> ${data.fullName}</p>
    <p><strong>Số điện thoại:</strong> ${data.phone}</p>
    <p><strong>Email:</strong> ${data.email}</p>
    <p><strong>MSSV:</strong> ${data.mssv}</p>
    <p><strong>Khoa:</strong> ${data.khoa}</p>
    <p><strong>Lớp:</strong> ${data.lop}</p>
    <p><strong>Nội dung thi:</strong> ${(data.noidung && data.noidung.length) ? data.noidung.join(", ") : "Không có"}</p>
    <p><strong>Phương thức:</strong> ${data.paymentMethod === "bank" ? "Chuyển khoản" : "PayPal"}</p>
    <p><strong>Trạng thái thanh toán:</strong> ${data.paymentStatus === "pending" ? "Đang xử lý" : data.paymentStatus}</p>
  `;

  // Trang 2: Người thi đấu cùng
  if (hasPartner) {
    page2.innerHTML = `
      <p><strong>Họ và tên đồng đội:</strong> ${data.partnerInfo.fullName}</p>
      <p><strong>Số điện thoại:</strong> ${data.partnerInfo.phone}</p>
      <p><strong>Email:</strong> ${data.partnerInfo.email}</p>
      <p><strong>Khoa:</strong> ${data.partnerInfo.khoa}</p>
      <p><strong>Lớp:</strong> ${data.partnerInfo.lop}</p>
      <p><strong>MSSV:</strong> ${data.partnerInfo.mssv}</p>
    `;
    nextBtn.style.display = "inline-block";
  } else {
    page2.innerHTML = "";
    nextBtn.style.display = "none";
  }

  // Reset lại view
  page1.style.display = "block";
  page2.style.display = "none";
  prevBtn.style.display = "none";

  modal.style.display = "flex";
}
document.getElementById('nextPageBtn').addEventListener('click', () => {
  document.getElementById('modalPage1').style.display = 'none';
  document.getElementById('modalPage2').style.display = 'block';
  document.getElementById('prevPageBtn').style.display = 'inline-block';
  document.getElementById('nextPageBtn').style.display = 'none';
});

document.getElementById('prevPageBtn').addEventListener('click', () => {
  document.getElementById('modalPage1').style.display = 'block';
  document.getElementById('modalPage2').style.display = 'none';
  document.getElementById('prevPageBtn').style.display = 'none';
  document.getElementById('nextPageBtn').style.display = 'inline-block';
});
})
function showFinalThankYouModal() {
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
// 📡 Lắng nghe cập nhật trạng thái từ server khi có thay đổi
const socket = io();

socket.on("payment-updated", ({ mssv, status }) => {
  const currentMSSV = savedData?.mssv || document.querySelector("#modalPage1")?.textContent?.match(/\d{8}/)?.[0];

  if (mssv === currentMSSV && status === "paid") {
    const statusElem = document.querySelector("#modalPage1");
    if (statusElem) {
      const statusLine = statusElem.querySelector("p:last-child");
      if (statusLine) {
        statusLine.innerHTML = `<strong>Trạng thái thanh toán:</strong> ✅ Đã thanh toán`;
      }
    }

    savedData.paymentStatus = "paid"; // cập nhật local
    showFinalThankYouModal();
  }
});
