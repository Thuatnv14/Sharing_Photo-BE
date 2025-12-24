const express = require('express');
const router = express.Router();
const User = require('../db/userModel')

const bcrypt = require("bcrypt"); // ← THÊM DÒNG NÀY

router.post("/login", async (req, res) => {
    const { login_name, password } = req.body;

    if (!login_name || !password) {
        return res.status(400).json({ message: "login_name and password required" });
    }

    try {
        const user = await User.findOne({ login_name });
        if (!user) {
            return res.status(400).json({ message: "Invalid login_name or password" });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(400).json({ message: "Invalid login_name or password" });
        }

        req.session.userId = user._id;

        res.json({
            _id: user._id,
            first_name: user.first_name,
            last_name: user.last_name
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// POST /admin/logout
router.post('/logout', (req, res) => {
    if (!req.session.userId) {
        return res.status(400).json({ message: "Not logged in" });
    }

    req.session.destroy(() => {
        res.json({ message: "Logged out" });
    });
});

module.exports = router;