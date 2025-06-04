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
router.post("/create-match", protect, requireRole(["collab", "admin", "superadmin"]), async (req, res) => {
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

module.exports = router;