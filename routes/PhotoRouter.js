const express = require("express");
const Photo = require("../db/photoModel");
const User = require("../db/userModel");
const router = express.Router();

// API 3: /photosOfUser/:id → tất cả ảnh + comment của user đó
router.get("/:id", async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(400).json({ message: "Cannot find user" });

        const photos = await Photo.find({ user_id: req.params.id }).lean();

        const result = await Promise.all(
            photos.map(async (photo) => {
                const comments = await Promise.all(
                    (photo.comments || []).map(async (c) => {
                        const u = await User.findById(c.user_id).select(
                            "_id first_name last_name"
                        );
                        return {
                            _id: c._id,
                            comment: c.comment,
                            date_time: c.date_time,
                            user: u
                                ? {
                                    _id: u._id,
                                    first_name: u.first_name,
                                    last_name: u.last_name,
                                }
                                : null,
                        };
                    })
                );

                return {
                    _id: photo._id,
                    user_id: photo.user_id,
                    date_time: photo.date_time,
                    file_name: photo.file_name,
                    comments: comments,
                };
            })
        );

        res.json(result);
    } catch (error) {
        console.error("Error in /photosOfUser:", error);
        res.status(400).json({ message: "Invalid user ID or Server Error" });
    }
});

module.exports = router;
