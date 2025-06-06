const { DateTime } = luxon;
window.addEventListener("load", () => {
  setTimeout(() => {
    const overlay = document.getElementById("loadingOverlay");
    if (overlay) {
      overlay.classList.add("fade-out");
      setTimeout(() => {
        overlay.style.display = "none";
      }, 1000);
    }
  }, 0);
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

const events = ["ĐƠN NAM", "ĐƠN NỮ", "ĐÔI NAM", "ĐÔI NỮ", "ĐÔI NAM NỮ"];
const tabButtons = document.getElementById("tab-buttons");
const tabContents = document.getElementById("tab-contents");

function renderMatchTabs(matchData) {
  tabButtons.innerHTML = "";
  tabContents.innerHTML = "";

  events.forEach((eventName, idx) => {
    const tabBtn = document.createElement("div");
    tabBtn.className = "tab" + (idx === 0 ? " active" : "");
    tabBtn.innerText = eventName;
    tabBtn.dataset.tab = idx;
    tabButtons.appendChild(tabBtn);

    const tabDiv = document.createElement("div");
    tabDiv.className = "tab-content" + (idx === 0 ? " active" : "");
    tabDiv.id = `tab-${idx}`;

    const filtered = matchData
      .filter(m => (m.event || "").toUpperCase() === eventName)
      .sort((a, b) => new Date(a.time) - new Date(b.time));

    if (filtered.length > 0) {
      let html = `
        <table>
          <thead>
            <tr>
              <th>STT</th>
              <th>Thời gian</th>
              <th>Địa điểm</th>
              <th>Vòng đấu</th>
              <th>Đối thủ 1</th>
              <th>Đối thủ 2</th>
              <th>Set 1</th>
              <th>Set 2</th>
              <th>Set 3</th>
              <th>Tỉ số</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
      `;
      filtered.forEach((match, i) => {
        // Lấy thời điểm hiện tại ở múi giờ Việt Nam
        const now = DateTime.now().setZone("Asia/Ho_Chi_Minh");

        // Lấy thời gian bắt đầu trận đã được lưu (cũng phải ở múi giờ VN)
        const matchTime = DateTime.fromISO(match.time).setZone("Asia/Ho_Chi_Minh");

        // Giờ kết thúc = matchTime + 30 phút
        const matchEnd = matchTime.plus({ minutes: 30 });

        // "Ngưỡng sắp bắt đầu" = 10 phút trước giờ bắt đầu
        const warningThreshold = matchTime.minus({ minutes: 10 });

        let statusClass = "";
        let statusLabel = "";

        if (now < warningThreshold) {
          // Còn xa hơn 10 phút → "Chưa diễn ra"
          statusClass = "status-not-started";
          statusLabel = "Chưa diễn ra";
        } else if (now >= warningThreshold && now < matchTime) {
          // Từ 10 phút trước đến đúng giờ bắt đầu → "Sắp bắt đầu"
          statusClass = "status-upcoming";
          statusLabel = "Sắp bắt đầu";
        } else if (now >= matchTime && now <= matchEnd) {
          // Từ giờ bắt đầu đến giờ kết thúc → "Đang diễn ra"
          statusClass = "status-ongoing";
          statusLabel = "Đang diễn ra";
        } else {
          // Sau giờ kết thúc → "Đã kết thúc"
          statusClass = "status-finished";
          statusLabel = "Đã kết thúc";
        }

        let roundClass = "";
        if (match.round === "Vòng loại") {
          roundClass = "round-vong-loai";
        } else if (match.round === "Tứ kết") {
          roundClass = "round-tu-ket";
        } else if (match.round === "Vòng bán kết") {  // <-- sửa chỗ này
          roundClass = "round-ban-ket";
        } else if (match.round === "Vòng chung kết") { // <-- và ở đây
          roundClass = "round-chung-ket";
        }

        html += `
          <tr>
            <td>${i + 1}</td>
            <td>${formatVietnamTime(match.time)}</td>
            <td>${match.location || "-"}</td>
            <td class="${roundClass}">${match.round || "-"}</td>
            <td class="team">${match.team1}</td>
            <td class="team">${match.team2}</td>
            <td>${match.set1 || "-"}</td>
            <td>${match.set2 || "-"}</td>
            <td>${match.set3 || "-"}</td>
            <td><strong>${match.total || "-"}</strong></td>
            <td class="${statusClass}">${statusLabel}</td>
          </tr>
        `;
      });
      html += "</tbody></table>";
      tabDiv.innerHTML = html;
    } else {
      tabDiv.innerHTML = "<p>⚠️ Chưa có trận đấu nào cho nội dung này.</p>";
    }

    tabContents.appendChild(tabDiv);
  });

  document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(`tab-${tab.dataset.tab}`).classList.add("active");
    });
  });
}

fetch("/api/matches", { credentials: "include" })
  .then(res => res.json())
  .then(matchData => {
    renderMatchTabs(matchData);

    // Socket.IO cập nhật realtime
    const socket = io();
    socket.on("match-updated", (updatedMatch) => {
      console.log("📡 Realtime cập nhật:", updatedMatch);
      fetch("/api/matches", { credentials: "include" })
        .then(res => res.json())
        .then(renderMatchTabs)
        .catch(err => {
          console.error("❌ Không thể cập nhật bảng:", err);
        });
    });
  })
  .catch(err => {
    console.error("❌ Lỗi khi tải dữ liệu trận đấu:", err);
    tabContents.innerHTML = "<p style='color: red;'>Không thể tải dữ liệu trận đấu từ máy chủ.</p>";
  });

function formatVietnamTime(datetimeStr) {
  if (!datetimeStr) return "-";

  const dt = DateTime.fromISO(datetimeStr).setZone("Asia/Ho_Chi_Minh");

  const weekdays = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
  const weekday = weekdays[dt.weekday % 7];

  return `${weekday}, ${dt.toFormat("dd/MM/yyyy - HH:mm")}`;
}