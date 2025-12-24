// routes/PhotoRouter.js
const express = require("express");
const router = express.Router();
const Photo = require("../db/photoModel");
const User = require("../db/userModel");
const upload = require('../middleware/upload'); // ← Đây là middleware đã gọi .single('photo')

// Middleware kiểm tra login
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.userId) {
        next();
    } else {
        res.status(401).json({ message: "Unauthorized" });
    }
};

router.get("/:id", isAuthenticated, async (req, res) => {
    try {
        const photos = await Photo.find({ user_id: req.params.id })
            .populate('comments.user_id', 'first_name last_name _id')
            .lean();

        // Format để trả về field "user" object (nhất quán frontend)
        const formattedPhotos = photos.map(photo => ({
            _id: photo._id,
            user_id: photo.user_id,
            date_time: photo.date_time,
            file_name: photo.file_name,
            comments: photo.comments.map(c => ({
                _id: c._id,
                comment: c.comment,
                date_time: c.date_time,
                user: c.user_id ? {
                    _id: c.user_id._id,
                    first_name: c.user_id.first_name,
                    last_name: c.user_id.last_name
                } : null
            }))
        }));

        res.json(formattedPhotos);
    } catch (error) {
        console.error("Error in GET /photos/:id:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// POST /new - Upload photo mới
router.post("/new", isAuthenticated, upload, async (req, res) => { // ← Chỉ dùng upload (không .single)
    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
    }

    try {
        const newPhoto = new Photo({
            file_name: req.file.filename,
            date_time: new Date(),
            user_id: req.session.userId,
            comments: []
        });

        await newPhoto.save();

        res.status(201).json({
            _id: newPhoto._id,
            file_name: newPhoto.file_name,
            date_time: newPhoto.date_time,
            user_id: newPhoto.user_id,
            comments: []
        });
    } catch (err) {
        console.error("Upload error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;