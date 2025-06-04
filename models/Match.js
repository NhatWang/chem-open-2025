const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema({
  event: {
    type: String,
    required: true,
    enum: ["Đơn nam", "Đơn nữ", "Đôi nam", "Đôi nữ", "Đôi nam nữ"]
  },
  time: { type: Date, required: true },
  location: { type: String, default: "" },
  round: {
    type: String,
    required: true,
    enum: ["Vòng loại", "Vòng tứ kết", "Vòng bán kết", "Vòng chung kết"]
  },
  team1: { type: String, required: true },
  team2: { type: String, required: true },
  set1: { type: String, default: "" },
  set2: { type: String, default: "" },
  set3: { type: String, default: "" },
  total: { type: String, default: "" },
  status: {
    type: String,
    enum: ["Chưa diễn ra", "Sắp bắt đầu", "Đang diễn ra", "Đã kết thúc"],
    default: "Chưa diễn ra"
  }
}, {
  timestamps: true // Tự động thêm createdAt và updatedAt
});


module.exports = mongoose.model("Match", matchSchema);
