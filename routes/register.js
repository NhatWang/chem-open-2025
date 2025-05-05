const express = require('express');
const router = express.Router();
const Registration = require('../models/Registration'); // Đường dẫn tới model Registration

router.post('/register', async (req, res) => {
  try {
    const data = req.body;
    const newEntry = new Registration(data);
    const saved = await newEntry.save();
    res.json({ success: true, data: saved });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;