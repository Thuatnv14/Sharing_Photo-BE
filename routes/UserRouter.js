const express = require("express");
const User = require("../db/userModel");
const Photo = require("../db/photoModel");
const router = express.Router();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// API 1: /users/list → danh sách user cho sidebar
router.get("/list", async (req, res) => {
    try {
        const users = await User.find({})
            .select("_id first_name last_name")
            .sort({ last_name: 1, first_name: 1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// API 2: /users/:id → chi tiết 1 user
router.get("/:id", async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select(
            "_id first_name last_name location description occupation"
        );

        if (!user) {
            return res.status(400).json({ message: "Cannot find user" });
        }
        res.json(user);
    } catch (error) {
        res.status(400).json({ message: "Invalid user ID" });
    }
});


// Lấy tất cả comments do user này viết
router.get('/:id/comments', async (req, res) => {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }

    try {
        const photos = await Photo.find({ 'comments.user_id': id })
            .select('_id file_name user_id comments')
            .lean();

        const userComments = [];
        for (const photo of photos) {
            for (const comment of photo.comments || []) {
                if (comment.user_id && comment.user_id.toString() === id) {
                    userComments.push({
                        _id: comment._id,
                        comment: comment.comment,
                        date_time: comment.date_time,
                        photo_file_name: photo.file_name,
                        photo_user_id: photo.user_id,
                    });
                }
            }
        }

        res.json(userComments);
    } catch (err) {
        console.error('Error fetching user comments:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post("/", async (req, res) => {
    const { login_name, password, first_name, last_name, location, description, occupation } = req.body;

    if (!login_name || !password || !first_name || !last_name) {
        return res.status(400).json({ message: "Required fields: login_name, password, first_name, last_name" });
    }

    try {
        const existing = await User.findOne({ login_name });
        if (existing) {
            return res.status(400).json({ message: "login_name already exists" });
        }

        const user = new User({
            login_name,
            password, // Hash tự động nhờ pre-save
            first_name,
            last_name,
            location: location || "",
            description: description || "",
            occupation: occupation || ""
        });

        await user.save();

        res.status(201).json({
            login_name: user.login_name,
            _id: user._id,
            first_name: user.first_name
        });
    } catch (err) {
        console.error("Registration error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
