const express = require("express");
const router = express.Router();
const Match = require("../models/Match");
const { protect, requireRole } = require("../middlewares/auth");
const Registration = require("../models/Registration");

// GET /api/matches - lấy tất cả trận đấu
router.get("/api/matches", async (req, res) => {
  try {
    const matches = await Match.find().sort({ createdAt: 1 });
    res.json(matches);
  } catch (err) {
    console.error("❌ Lỗi lấy danh sách trận:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// PUT /update-match/:id - cập nhật kết quả
router.put("/update-match/:id", protect, requireRole(["collab", "admin", "superadmin"]), async (req, res) => {
  const io = req.app.get("io");
  try {
    const { set1, set2, set3, total, status, time, location, round } = req.body;
    const updated = await Match.findByIdAndUpdate(
      req.params.id,
      { set1, set2, set3, total, status, time: time ? new Date(time) : undefined, location, round },
      { new: true }
    );

    if (!updated) return res.status(404).json({ success: false, message: "Không tìm thấy trận đấu" });

    if (io) io.emit("match-updated", updated)

    res.json({ success: true, match: updated });
  } catch (err) {
    console.error("❌ Lỗi cập nhật trận:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});
// POST /create-match - tạo trận đấu mới
router.post("/create-match", protect, requireRole(["admin", "superadmin"]), async (req, res) => {
  try {
    const { event, round, time, location, team1, team2 } = req.body;
    const match = new Match({ event, round, time, location, team1, team2 });
    await match.save();

    const io = req.app.get("io");
    if (io) io.emit("match-updated", match);

    res.json({ success: true, match });
  } catch (err) {
    console.error("❌ Lỗi tạo trận đấu:", err);
    res.status(500).json({ success: false, message: "Lỗi tạo trận" });
  }
});

// DELETE /api/delete-match/:id - xoá trận đấu
router.delete("/api/delete-match/:id", protect, requireRole(["admin", "superadmin"]), async (req, res) => {
  try {
    const deleted = await Match.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Không tìm thấy trận đấu" });
    }

    const io = req.app.get("io");
    if (io) io.emit("match-deleted", { id: req.params.id });

    res.json({ success: true, message: "Đã xoá trận đấu" });
  } catch (err) {
    console.error("❌ Lỗi xoá trận đấu:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});


router.post(
  "/matches/create-draw",
  protect,
  requireRole(["admin", "superadmin"]),
  async (req, res) => {
    try {
      const { event, round, time, location } = req.body;

      if (!event || !time) {
        return res.status(400).json({
          success: false,
          message: "Thiếu thông tin event hoặc time."
        });
      }

      // 1) Lấy ra tất cả user đã có mã bốc thăm cho event đó
      // Ở đây cần lấy thêm partnerInfo nếu event là đôi
      const projection = { fullName: 1, drawResult: 1 };
      if (["Đôi nam", "Đôi nữ", "Đôi nam nữ"].includes(event)) {
        projection.partnerInfo = 1; // lấy thêm thông tin partner
      }

      const allPlayers = await Registration.find(
        {
          [`drawResult.${event}`]: { $exists: true, $ne: null }
        },
        projection
      );

      // 2) Xây mảng các object:
      // Với đơn: { code, name }
      // Với đôi: { code, name, partnerName }
      const codeNamePairs = allPlayers
        .map(u => {
          const code = u.drawResult[event];
          const name = u.fullName;

          if (["Đôi nam", "Đôi nữ", "Đôi nam nữ"].includes(event)) {
            const partnerName = u.partnerInfo?.fullName || null;
            if (typeof code === "string" && code.trim() !== "" && partnerName) {
              return { code: code.trim(), name, partnerName };
            }
            return null;
          } else {
            if (typeof code === "string" && code.trim() !== "") {
              return { code: code.trim(), name };
            }
            return null;
          }
        })
        .filter(x => x); // lọc bỏ null

      // 3) Sắp xếp theo số trong code
      codeNamePairs.sort((a, b) => {
      const letterA = a.code[0];
      const letterB = b.code[0];

      if (letterA < letterB) return -1;
      if (letterA > letterB) return 1;

      // Nếu chữ cái giống nhau, so sánh số
      const numA = parseInt(a.code.substring(1), 10);
      const numB = parseInt(b.code.substring(1), 10);

      return numA - numB;
    });

     const matchesToInsert = [];

if (["Đôi nam", "Đôi nữ", "Đôi nam nữ"].includes(event)) {
  for (let i = 0; i < codeNamePairs.length; i += 2) {
    const p1 = codeNamePairs[i];
    const p2 = codeNamePairs[i + 1];

    if (!p2) {
      // Tạo trận bye cho cặp cuối cùng
      matchesToInsert.push({
        event,
        round: round || "",
        time: new Date(time),
        location: location || "",

        team1Code: p1.code,
        team1Name: `${p1.name} & ${p1.partnerName}`,

        team2Code: null,
        team2Name: "Không có",

        set1: "",
        set2: "",
        set3: "",
        total: "",
        status: "Vào vòng trong"
      });
      continue;
    }

    matchesToInsert.push({
      event,
      round: round || "",
      time: new Date(time),
      location: location || "",

      team1Code: p1.code,
      team1Name: `${p1.name} & ${p1.partnerName}`,

      team2Code: p2.code,
      team2Name: `${p2.name} & ${p2.partnerName}`,

      set1: "",
      set2: "",
      set3: "",
      total: "",
      status: "Chưa diễn ra"
    });
  }
} else {
  for (let i = 0; i < codeNamePairs.length; i += 2) {
    const p1 = codeNamePairs[i];
    const p2 = codeNamePairs[i + 1];

    if (!p2) {
      matchesToInsert.push({
        event,
        round: round || "",
        time: new Date(time),
        location: location || "",

        team1Code: p1.code,
        team1Name: p1.name,

        team2Code: null,
        team2Name: "Không có",

        set1: "",
        set2: "",
        set3: "",
        total: "",
        status: "Vào vòng trong"
      });
      continue;
    }

    matchesToInsert.push({
      event,
      round: round || "",
      time: new Date(time),
      location: location || "",

      team1Code: p1.code,
      team1Name: p1.name,

      team2Code: p2.code,
      team2Name: p2.name,

      set1: "",
      set2: "",
      set3: "",
      total: "",
      status: "Chưa diễn ra"
    });
  }
}

      // 4) Xóa match cũ của chính event+round
      await Match.deleteMany({ event, round });

      // 5) Insert match mới
      if (matchesToInsert.length > 0) {
        await Match.insertMany(matchesToInsert);
      }

      await Match.insertMany(matchesToInsert);

      // Lấy lại danh sách trận mới tạo (hoặc theo event + round)
      const newMatches = await Match.find({ event, round }).sort({ time: 1 });

      return res.json({
        success: true,
        message: `Đã tạo ${matchesToInsert.length} trận cho "${event}" - "${round}".`,
        matches: newMatches
      });
    } catch (err) {
      console.error("❌ Lỗi create-draw-matches:", err);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi tạo trận đấu từ bốc thăm."
      });
    }
  }
);

module.exports = router;