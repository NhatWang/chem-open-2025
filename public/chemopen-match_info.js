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
        const now = new Date();
        const matchTime = new Date(match.time);
        let statusClass = "status-upcoming", statusLabel = "Sắp bắt đầu";

        if (now >= matchTime && now <= new Date(matchTime.getTime() + 45 * 60 * 1000)) {
          statusClass = "status-ongoing";
          statusLabel = "Đang diễn ra";
        } else if (now > new Date(matchTime.getTime() + 45 * 60 * 1000)) {
          statusClass = "status-finished";
          statusLabel = "Đã kết thúc";
        }

        html += `
          <tr>
            <td>${i + 1}</td>
            <td>${matchTime.toLocaleString('vi-VN')}</td>
            <td>${match.location || "-"}</td>
            <td>${match.team1}</td>
            <td>${match.team2}</td>
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
